"""Tally one bake-off agent: tokens and API-list cost (whole run and per card),
wall-clock per card, check runs and bakes per card.

    python bakeoff/checks/tally.py <model> <transcript.jsonl> <worktree> [out.json]
(model: haiku, sonnet or opus; the transcript is the subagent JSONL under ~/.claude/projects/.../subagents/)
"""
import json
import sys
from datetime import datetime

import os
CARDS = os.environ.get('CARDS', 'lightning-theorist,shieldbearer,bone-lance').split(',')  # (the batch's card ids: CARDS=a,b,c)
# $ per million tokens: input, output, cache read (cache writes: 1.25x input at 5 min, 2x at 1 h)
PRICE = {
    'opus': (4.0, 20.0, 0.20),
    'sonnet': (2.0, 10.0, 0.10),
    'haiku': (0.10, 0.50, 0.005),  # (cache read not given: taken as 5% of input, like the others)
}
# Haiku 5.5 past 100K prompt tokens: $0.50 in / $2.50 out (the claude-api skill's price table)
HAIKU_LONG = (0.50, 2.50, 0.025)


def ts(s):
    return datetime.fromisoformat(s.replace('Z', '+00:00'))


def main(model, path, tree, out=None):
    lines = [json.loads(l) for l in open(path, encoding='utf8') if l.strip()]
    msgs = {}
    tools = []  # (time, command text) of each tool call
    for l in lines:
        if l.get('type') != 'assistant':
            continue
        m = l['message']
        u = m.get('usage') or {}
        k = m.get('id') or l.get('uuid')
        prev = msgs.get(k)
        rec = {'t': ts(l['timestamp']), 'u': u, 'model': m.get('model')}
        if not prev or (u.get('output_tokens') or 0) >= (prev['u'].get('output_tokens') or 0):
            if prev:
                rec['t'] = prev['t']
            msgs[k] = rec
        for c in m.get('content') or []:
            if isinstance(c, dict) and c.get('type') == 'tool_use':
                txt = json.dumps(c.get('input'))
                tools.append((ts(l['timestamp']), txt))
                hits = sorted((txt.find(cid), cid) for cid in CARDS if cid in txt)
                if hits and not msgs[k].get('card'):
                    msgs[k]['card'] = hits[0][1]
    def cost(u):
        pin, pout, pread = PRICE[model]
        prompt = (u.get('input_tokens', 0) or 0) + (u.get('cache_creation_input_tokens', 0) or 0) + (u.get('cache_read_input_tokens', 0) or 0)
        if model == 'haiku' and prompt > 100_000:
            pin, pout, pread = HAIKU_LONG
        cc = u.get('cache_creation') or {}
        w5 = cc.get('ephemeral_5m_input_tokens', 0) or 0
        w1 = cc.get('ephemeral_1h_input_tokens', 0) or 0
        rest = (u.get('cache_creation_input_tokens', 0) or 0) - w5 - w1
        w5 += max(0, rest)
        return (u.get('input_tokens', 0) * pin + u.get('output_tokens', 0) * pout + u.get('cache_read_input_tokens', 0) * pread
                + w5 * pin * 1.25 + w1 * pin * 2) / 1e6

    def tok(u):
        return {
            'input': u.get('input_tokens', 0) or 0,
            'cacheWrite': u.get('cache_creation_input_tokens', 0) or 0,
            'cacheRead': u.get('cache_read_input_tokens', 0) or 0,
            'output': u.get('output_tokens', 0) or 0,
        }

    try:
        log = [json.loads(l) for l in open(f'{tree}/bakeoff/out/log.jsonl', encoding='utf8') if l.strip()]
    except FileNotFoundError:
        log = []
    starts = {}
    for e in log:
        if e.get('run') == 'start' and e['id'] in CARDS and e['id'] not in starts:
            starts[e['id']] = ts(e['t'])
    order = sorted(starts.items(), key=lambda x: x[1])
    times = sorted(r['t'] for r in msgs.values())
    t_first, t_last = times[0], times[-1]

    # each call belongs to the card its commands name, else to the card before it
    ordered = sorted(msgs.values(), key=lambda r: r['t'])
    cur = 'setup'
    for r in ordered:
        cur = r.get('card') or cur
        r['card_eff'] = cur
    nxt_t = {id(r): (ordered[i + 1]['t'] if i + 1 < len(ordered) else r['t']) for i, r in enumerate(ordered)}

    def card_at(t):
        return 'setup'

    per = {}
    for r in msgs.values():
        c = r['card_eff']
        p = per.setdefault(c, {'calls': 0, 'cost': 0.0, 'input': 0, 'cacheWrite': 0, 'cacheRead': 0, 'output': 0, 'maxPrompt': 0})
        p['calls'] += 1
        p['cost'] += cost(r['u'])
        t = tok(r['u'])
        for kk, v in t.items():
            p[kk] += v
        p['maxPrompt'] = max(p['maxPrompt'], t['input'] + t['cacheWrite'] + t['cacheRead'])
    # wall clock per card: the time from each of its calls to the next call
    for r in ordered:
        p = per.setdefault(r['card_eff'], {})
        p['minutes'] = p.get('minutes', 0) + (nxt_t[id(r)] - r['t']).total_seconds() / 60
    for p in per.values():
        if 'minutes' in p:
            p['minutes'] = round(p['minutes'], 1)
    # checks and bakes per card
    for cid in CARDS:
        runs = [e for e in log if e['id'] == cid and e.get('run') == 'check']
        full = [e for e in runs if e.get('checks') == 'abcd']
        first_pass = next((i for i, e in enumerate(full) if e.get('all')), None)
        p = per.setdefault(cid, {})
        p['checkRuns'] = len(runs)
        p['failedRuns'] = sum(1 for e in runs if not e.get('all'))
        p['fullRuns'] = len(full)
        p['fullRunsToFirstPass'] = None if first_pass is None else first_pass + 1
        p['lastFull'] = full[-1]['pass'] if full else None
        p['bakes'] = sum(1 for t, cmd in tools if 'bake-live.mjs' in cmd and cid in cmd)
    total = {
        'model': model, 'calls': len(msgs), 'minutes': round((t_last - t_first).total_seconds() / 60, 1),
        'cost': round(sum(cost(r['u']) for r in msgs.values()), 3),
        'maxPrompt': max(p.get('maxPrompt', 0) for p in per.values()),
    }
    for kk in ['input', 'cacheWrite', 'cacheRead', 'output']:
        total[kk] = sum(tok(r['u'])[kk] for r in msgs.values())
    for p in per.values():
        if 'cost' in p:
            p['cost'] = round(p['cost'], 3)
    res = {'total': total, 'perCard': per, 'starts': {k: v.isoformat() for k, v in starts.items()}}
    s = json.dumps(res, indent=1, default=str)
    if out:
        open(out, 'w', encoding='utf8').write(s)
    print(s)


if __name__ == '__main__':
    main(*sys.argv[1:])
