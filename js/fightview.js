// Fights, big. When a fight plays out (yours, or two others'), its creatures
// come up big and it goes pair by pair, like stories on a phone: who meets
// whom, the hits, and a few words on what happened and why (a creature is
// destroyed when its damage reaches its Vitality; Swift strikes first; Overrun
// carries the rest through; Venom destroys with any damage; creatures teaming
// up split the attacker's damage). Tap to go on, tap the left edge to go back,
// Skip to close. With `tap` (the table's default) each step waits for your
// tap; without it, each step moves on by itself once there has been time to
// read it, and holding pauses.
//
// game-ui.js builds the story from a move's events (fightStory) and plays it
// (playStory) in place of the small fight on the table; the note under the
// table after a fight plays it again.

import { BY_ID } from './cards.js';
import { hasKw, power, vitality } from './engine.js';
import { esc } from './render.js';
import * as FX from './fx.js';
import { endFights, fight, readyToFight } from './cards-alive.js';

const shortName = (n) => String(n ?? '').replace(/^Bot · /, '');
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const cap = (t) => t.replace(/^(<b>)?([a-z])/, (m, b, c) => (b || '') + c.toUpperCase());
const toPlayer = (to) => to != null && typeof to === 'object';
const KWS = ['swift', 'venom', 'overrun', 'drain', 'guard', 'soar', 'reach', 'watchful', 'hunt', 'rush', 'lastBreath', 'awaken'];

/**
 * The story of the fight in one move, or null if the move had none. s0 is the
 * table before the move, after the table after it, events the move's events,
 * me this phone's seat. Plain data, so it can be played again later.
 */
export function fightStory(s0, after, events, me) {
  const fi = events.findIndex((e) => e.k === 'fight');
  if (fi < 0) return null;
  const { a: A, d: D } = events[fi];
  const pre = events.slice(0, fi), post = events.slice(fi + 1);
  const gone = new Set(pre.filter((e) => e.k === 'die' || e.k === 'bounce').map((e) => e.uid));
  const C = s0.combat && s0.combat.a === A && s0.combat.d === D ? s0.combat : null;
  // the attackers, and who blocked them (declared in this move, or before it)
  const att = (C ? C.att : pre.filter((e) => e.k === 'attack').map((e) => e.uid)).filter((u) => !gone.has(u));
  const blk = {};
  const declared = pre.filter((e) => e.k === 'block');
  if (declared.length) for (const e of declared) (blk[e.att] ||= []).push(e.uid);
  else if (C) for (const [x, bs] of Object.entries(C.blk || {})) blk[x] = [...bs];
  for (const x of Object.keys(blk)) blk[x] = blk[x].filter((b) => !gone.has(b));

  // each creature as it went into the fight: as the move found it, plus any
  // boost or damage earlier in the same move (an ability used just before it)
  const adj = {};
  for (const e of pre) {
    if (e.k === 'buff') { const x = (adj[e.uid] ||= { p: 0, v: 0, dmg: 0 }); x.p += e.dP || 0; x.v += e.dV || 0; }
    if (e.k === 'dmg') (adj[e.uid] ||= { p: 0, v: 0, dmg: 0 }).dmg += e.n;
  }
  const cards = {};
  const card = (u) => {
    if (cards[u]) return cards[u];
    const c = s0.cards[u] || after.cards[u];
    const d = BY_ID[c?.cid] || {};
    const on = s0.cards[u]?.zone === 'board';
    const x = adj[u] || { p: 0, v: 0, dmg: 0 };
    return (cards[u] = {
      uid: u, cid: c?.cid, name: d.name || '?', token: !!d.token, ctrl: on ? s0.cards[u].ctrl : c?.owner,
      p: (on ? power(s0, c) : d.power || 0) + x.p, v: (on ? vitality(s0, c) : d.vitality || 0) + x.v, dmg: (on ? c.dmg || 0 : 0) + x.dmg,
      kws: on ? KWS.filter((k) => hasKw(s0, c, k)) : [...(d.keywords || [])],
    });
  };

  // what each strike did, and what was destroyed
  const hits = [], died = new Set(), crown = [], dmgAll = {};
  for (const e of post) {
    if (e.k === 'dmg') dmgAll[e.uid] = (dmgAll[e.uid] || 0) + e.n; // strikes and anything else (a Smoldering Golem's burst)
    if (e.k === 'strike') hits.push({ from: e.uid, to: e.to, n: 0 });
    else if ((e.k === 'dmg' || e.k === 'hitPlayer') && e.src != null) {
      const h = [...hits].reverse().find((x) => x.from === e.src && (e.k === 'dmg' ? x.to === e.uid : toPlayer(x.to) && x.to.p === e.p));
      if (h) h.n += e.n;
    } else if (e.k === 'die') died.add(e.uid);
    else if (e.k === 'crown') crown.push(e);
  }
  for (const h of hits) { card(h.from); if (!toPlayer(h.to)) card(h.to); h.first = card(h.from).kws.includes('swift'); }
  for (const u of att) card(u);
  for (const bs of Object.values(blk)) for (const b of bs) card(b);

  const name = (p) => esc(shortName(s0.players[p]?.name));
  const whoP = (p) => (p === me ? 'you' : name(p));
  // "your Mossback" ("The Forest Remembers" keeps its own article: the side of the screen says whose)
  const nm = (u) => `${card(u).ctrl === me && !/^The /.test(card(u).name) ? 'your ' : ''}<b>${esc(card(u).name)}</b>`;
  // several cards in a list, repeats counted: "your two Spirits", "Stoneback and your two Spirits"
  const plural = (n) => (/(s|x|ch|sh)$/.test(n) ? `${n}es` : /[^aeiou]y$/.test(n) ? `${n.slice(0, -1)}ies` : `${n}s`);
  const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];
  const groups = (uids) => {
    const g = new Map();
    for (const u of uids) { const k = `${card(u).ctrl}|${card(u).name}`; g.set(k, [...(g.get(k) || []), u]); }
    return [...g.values()];
  };
  const names = (uids, your = true) => list(groups(uids).map((us) => (us.length === 1 ? (your ? nm(us[0]) : `<b>${esc(card(us[0]).name)}</b>`)
    : `${your && card(us[0]).ctrl === me ? 'your ' : ''}${NUM[us.length] || us.length} <b>${esc(plural(card(us[0]).name))}</b>`)));
  // one of several with the same name: "one Spirit", then "the other Spirit" (or "another")
  const refer = (uids) => {
    const seen = new Map(), total = new Map();
    for (const u of uids) total.set(card(u).name, (total.get(card(u).name) || 0) + 1);
    return uids.map((u) => {
      const n = card(u).name, k = seen.get(n) || 0;
      seen.set(n, k + 1);
      if (total.get(n) < 2) return nm(u);
      return `${k === 0 ? 'one' : total.get(n) === 2 ? 'the other' : 'another'} <b>${esc(n)}</b>`;
    });
  };
  const stat = (u) => `${card(u).p}/${card(u).v - card(u).dmg}`;
  const lifeOf = (st, p) => Math.max(0, st.players[p].life);
  let ruleSaid = false;

  const cols = att.map((u) => ({ a: u, bs: blk[u] || [] }));
  const twice = new Set();
  const count = new Map();
  for (const c of cols) for (const b of c.bs) count.set(b, (count.get(b) || 0) + 1);
  for (const [b, n] of count) if (n > 1) twice.add(b);

  const beats = [];
  for (const c of cols.filter((x) => x.bs.length)) {
    const ids = [c.a, ...c.bs];
    const hs = hits.filter((h) => ids.includes(h.from) && (toPlayer(h.to) || ids.includes(h.to)));
    // how it plays: two that hit each other at once clash, any other strike is a lunge
    const steps = [], used = new Set();
    hs.forEach((h, i) => {
      if (used.has(i)) return;
      used.add(i);
      const j = hs.findIndex((x, k) => !used.has(k) && k > i && x.from === h.to && x.to === h.from && x.first === h.first);
      if (j >= 0) { used.add(j); steps.push({ t: 'clash', a: h.from, b: h.to, na: h.n, nb: hs[j].n }); } else steps.push({ t: 'hit', from: h.from, to: h.to, n: h.n });
    });
    const setup = (c.bs.length === 1 ? `${cap(nm(c.bs[0]))} (${stat(c.bs[0])}) blocks ${nm(c.a)} (${stat(c.a)}).`
      : `${cap(names(c.bs))} team up against ${nm(c.a)} (${stat(c.a)}).`)
      + c.bs.filter((b) => twice.has(b)).map((b) => ` ${cap(nm(b))} has Guard, so it blocks two attackers.`).join('');
    const lines = [];
    // the strikes as they happened: Swift creatures first (if not everyone has Swift), then the rest
    const sum = (xs) => xs.reduce((t, h) => t + h.n, 0);
    const said = (hits, back) => {
      const out = [];
      const aH = hits.filter((h) => h.from === c.a && !toPlayer(h.to));
      if (aH.length === 1) out.push(`${nm(c.a)} deals ${aH[0].n} to ${nm(aH[0].to)}`);
      else if (aH.length > 1) { const to = refer(aH.map((h) => h.to)); out.push(`${nm(c.a)} splits its ${sum(aH)} damage, ${list(aH.map((h, k) => `${h.n} to ${to[k]}`))} (it destroys the costliest blockers it can first)`); }
      const bH = hits.filter((h) => c.bs.includes(h.from));
      const from = [...new Set(bH.map((h) => h.from))];
      if (from.length === 1) out.push(`${nm(from[0])} deals ${sum(bH)}${aH.length || back ? ' back' : ` to ${nm(c.a)}`}`);
      else if (from.length > 1) out.push(`${names(from)} deal ${sum(bH)}${aH.length || back ? ' back' : ` to ${nm(c.a)}`} together`);
      return out;
    };
    const r1 = hs.filter((h) => h.first && !toPlayer(h.to)), r2 = hs.filter((h) => !h.first && !toPlayer(h.to));
    // Swift only matters when someone in the fight lacks it
    const swiftMatters = r1.length && ids.some((u) => !card(u).kws.includes('swift'));
    if (swiftMatters) {
      const fast = [...new Set(r1.map((h) => h.from))];
      lines.push(`${cap(names(fast))} ${fast.length > 1 ? 'have Swift, so they strike' : 'has Swift, so it strikes'} first: ${said(r1, false).join(', and ')}.`);
      if (r2.length) lines.push(`Then ${said(r2, true).join(', and ')}.`);
    } else if (hs.some((h) => !toPlayer(h.to))) lines.push(...said([...r1, ...r2], false).map((t) => `${cap(t)}.`));
    for (const h of hs) if (h.from === c.a && toPlayer(h.to) && h.n) lines.push(`Overrun: the other ${h.n} goes through to ${whoP(h.to.p)}.`);
    // what became of each of them, and why (the destroyed first; twins together). Damage
    // counts every hit in the fight (a Guard is hit by two attackers) and anything else
    // that hit them in it (a Smoldering Golem's burst); where the numbers can't tell the
    // whole story (a creature turned into a Fish just before), they are left out.
    const struck = (u) => hits.filter((h) => h.to === u).reduce((t, h) => t + h.n, 0);
    const took = (u) => Math.max(struck(u), dmgAll[u] || 0);
    const left = (u) => card(u).v - card(u).dmg;
    const venomed = (u) => took(u) < left(u) && hits.some((h) => h.to === u && h.n > 0 && card(h.from).kws.includes('venom'));
    const early = (u) => card(u).p > 0 && !hits.some((h) => h.from === u); // destroyed before it could strike
    const amount = (u) => (took(u) > struck(u) ? `${struck(u)} + ${took(u) - struck(u)} from other effects` : String(took(u)));
    const why = (us) => (us.every(venomed) ? ': Venom destroys with any damage'
      : us.every((u) => took(u) >= left(u)) ? ` (${list(us.map(amount))} damage, ${left(us[0])} Vitality${us.length > 1 ? ' each' : ''})` : '');
    // "both your Spirits", "all three of your Spirits"
    const allOf = (us) => { const x = card(us[0]), pl = `<b>${esc(plural(x.name))}</b>`, yours = x.ctrl === me; return us.length === 2 ? `both ${yours ? 'your ' : ''}${pl}` : `all ${NUM[us.length] || us.length} ${yours ? 'of your ' : ''}${pl}`; };
    for (const us of groups(ids.filter((x) => died.has(x)))) lines.push(`${cap(us.length > 1 ? allOf(us) : nm(us[0]))} ${us.length > 1 ? 'are' : 'is'} destroyed${us.every(early) ? ' before it can strike' : ''}${why(us)}.`);
    // (a creature whose player was knocked out leaves the table with them: no "survives")
    const stays = (u) => !after.players[card(u).ctrl]?.out;
    for (const us of groups(ids.filter((x) => !died.has(x) && took(x) > 0 && stays(x)))) {
      const nums = us.every((u) => took(u) < left(u)) ? ` (${list(us.map(amount))} damage, ${left(us[0])} Vitality${us.length > 1 ? ' each' : ''})` : '';
      lines.push(`${cap(us.length > 1 ? names(us) : nm(us[0]))} ${us.length > 1 ? 'survive' : 'survives'}${nums}.`);
    }
    if (!ruleSaid && ids.some((u) => died.has(u) || hs.some((h) => h.to === u && h.n))) {
      ruleSaid = true;
      lines.push('<span class="bf-rule">A creature is destroyed once its damage reaches its Vitality.</span>');
    }
    beats.push({ k: 'pair', att: [c.a], def: c.bs, setup, result: lines.join(' '), steps, dead: ids.filter((u) => died.has(u)) });
  }

  const open = cols.filter((x) => !x.bs.length);
  if (open.length) {
    const hs = hits.filter((h) => open.some((c) => c.a === h.from) && toPlayer(h.to));
    const total = hs.reduce((t, h) => t + h.n, 0);
    const setup = open.length === 1 ? `Nobody blocks ${nm(open[0].a)} (${stat(open[0].a)}).` : `Nobody blocks ${list(open.map((c) => nm(c.a)))}.`;
    const lines = [total ? `${open.length === 1 ? 'It hits' : 'They hit'} ${whoP(D)} for ${total}.` : 'It deals no damage.'];
    for (const e of crown) if (e.p != null) lines.push(`${e.p === me ? 'You take' : `${name(e.p)} takes`} the Crown.`);
    beats.push({ k: 'open', att: open.map((c) => c.a), p: D, setup, result: lines.join(' '), steps: hs.map((h) => ({ t: 'hit', from: h.from, to: h.to, n: h.n })), dead: [] });
  }

  // in the end: Life, losses, and anything else that happened
  const order = me === A ? [D, A] : [A, D];
  const endLines = [];
  for (const p of [D, A]) {
    const l0 = lifeOf(s0, p), l1 = lifeOf(after, p);
    if (l1 < l0) endLines.push(`${cap(whoP(p))} took ${l0 - l1} (Life ${l0} → ${l1}).`);
    else if (l1 > l0) endLines.push(`${cap(whoP(p))} gained ${l1 - l0} Life (now ${l1}).`);
  }
  const lost = (p) => [...died].filter((u) => card(u).ctrl === p);
  for (const p of [D, A]) if (lost(p).length) endLines.push(`${p === me ? 'You' : name(p)} lost ${names(lost(p), false)}.`);
  if (!died.size && endLines.every((l) => !/took/.test(l))) endLines.push('Nobody was hurt.');
  // other effects, in the game's own words
  const last = s0.log[s0.log.length - 1];
  let k = after.log.length - 1;
  while (k >= 0 && !(last && after.log[k].text === last.text && after.log[k].turn === last.turn)) k--;
  const also = after.log.slice(k + 1).map((l) => l.text)
    .filter((t) => !/ attacks | blocks? |doesn't block| takes \d+ damage| dies\.$|overruns|Crown|is out!| wins!|^No attackers|'s turn\.$|ends their turn|holds the Crown/.test(t)).slice(0, 3);
  if (after.phase === 'over') endLines.push(after.winner === me ? '<b>You win!</b>' : after.winner != null ? `<b>${name(after.winner)} wins.</b>` : '');
  else for (const p of [A, D]) if (after.players[p].out && !s0.players[p].out) endLines.push(`<b>${p === me ? 'You are' : `${name(p)} is`} out.</b>`);
  beats.push({ k: 'end', order, setup: 'After the fight', result: [...endLines, ...also.map((t) => `<span class="bf-also">${esc(t)}</span>`)].filter(Boolean).join(' '), steps: [], dead: [], lives: Object.fromEntries([A, D].map((p) => [p, [lifeOf(s0, p), lifeOf(after, p)]])), lost: Object.fromEntries([A, D].map((p) => [p, lost(p)])) });

  const title = `⚔ ${A === me ? 'You attack' : `${name(A)} attacks`} ${D === me ? 'you' : name(D)}`;
  return { A, D, me, mine: A === me || D === me, title, cards, beats, names: Object.fromEntries([A, D].map((p) => [p, p === me ? 'You' : shortName(s0.players[p]?.name)])) };
}

// ── playing it ──────────────────────────────────────────────────────
const READ_MIN = 2800, READ_MAX = 7500;
const readMs = (html) => Math.min(READ_MAX, Math.max(READ_MIN, 1600 + html.replace(/<[^>]+>/g, '').length * 40)) / FX.getSpeed();

/** Play a story over the table. Resolves when it closes (Skip, the last step, or Escape). */
export function playStory(story, { stage = null, tap = false } = {}) {
  return new Promise((resolve) => {
    const me = story.me;
    const box = document.createElement('div');
    box.className = 'bf';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-label', 'The fight, step by step');
    box.innerHTML = `<div class="bf-bars">${story.beats.map(() => '<i><b></b></i>').join('')}</div>
      <div class="bf-head"><span class="bf-title">${story.title}</span><button class="bf-skip" type="button">Skip</button></div>
      <div class="bf-stage"></div>
      <div class="bf-text"><p class="bf-setup"></p><p class="bf-result"></p></div>
      <div class="bf-hint">${tap ? 'Tap to go on' : 'Tap to go on · hold to pause'}</div>`;
    document.body.appendChild(box);
    FX.setStage(box);
    readyToFight(Object.values(story.cards).map((x) => x.cid)); // (each striker's own move, fetched ahead)
    const $ = (sel) => box.querySelector(sel);
    const bars = [...box.querySelectorAll('.bf-bars b')];
    let i = -1, gen = 0, timer = 0, left = 0, since = 0, paused = false, closed = false;
    const life = {};

    // the cards' width: as big as the room the step's words leave allows (two rows, their
    // labels and the ⚔ between them), up to 150px, and n abreast across the screen
    let room = innerHeight - 250;
    const W = (n) => Math.round(Math.max(52, Math.min(150, (room - 74) / 2 / 1.33, (innerWidth - 40 - (n - 1) * 10) / n)));
    const cardHTML = (u, w, states = []) => {
      const x = story.cards[u];
      if (!x) return '';
      return FX.tcardHTML(BY_ID[x.cid], {
        uid: `bf${u}`, power: x.p, vitality: x.v - x.dmg, dmg: x.dmg, foe: x.ctrl !== me, rest: false, w, states,
        keywords: x.kws.filter((k) => FX.KEYWORD_BADGES.includes(k)),
      });
    };
    const el = (u) => box.querySelector(`.tcard[data-uid="bf${u}"]`);
    const plate = (p) => box.querySelector(`.bf-plate[data-p="${p}"]`);
    const plateHTML = (p, l) => `<div class="bf-plate${p === me ? ' me' : ''}" data-p="${p}"><b>${esc(story.names[p])}</b><span class="bf-life">❤ <i>${l}</i></span></div>`;
    // your side is at the bottom, as on the table; in a fight between two
    // others, the attacker is on top
    const defTop = story.A === me;
    const side = (inner, p, top) => `<div class="bf-side">${top ? `<div class="bf-who">${esc(story.names[p])}</div>` : ''}${inner}${top ? '' : `<div class="bf-who">${esc(story.names[p])}</div>`}</div>`;

    function stageHTML(b) {
      if (b.k === 'end') {
        const half = (p) => `<div class="bf-side">${plateHTML(p, b.lives[p][1])}${b.lost[p].length ? `<div class="bf-row bf-lost">${b.lost[p].map((u) => cardHTML(u, Math.min(76, W(b.lost[p].length)), ['doomed'])).join('')}</div>` : ''}</div>`;
        const [top, bottom] = defTop ? [story.D, story.A] : [story.A, story.D];
        return `${half(top)}<div class="bf-vs">⚔</div>${half(bottom)}`;
      }
      const w = W(Math.max(b.att.length, b.k === 'pair' ? b.def.length : 1));
      const row = (uids) => `<div class="bf-row">${uids.map((u) => cardHTML(u, w)).join('')}</div>`;
      const atk = side(row(b.att), story.A, !defTop);
      const def = b.k === 'open' ? `<div class="bf-side">${plateHTML(b.p, life[b.p] ?? b.l0 ?? '')}</div>` : side(row(b.def), story.D, defTop);
      return defTop ? `${def}<div class="bf-vs">⚔</div>${atk}` : `${atk}<div class="bf-vs">⚔</div>${def}`;
    }

    // a hit lands: the number, and the card's Vitality (or the player's Life) goes down
    const vit = {};
    function hurt(u, n) {
      const c = el(u);
      if (!c || !n) return;
      FX.number(c, `−${n}`, { kind: 'damage' });
      vit[u] = Math.max(0, (vit[u] ?? story.cards[u].v - story.cards[u].dmg) - n);
      const v = c.querySelector('.tc-v');
      if (v) { v.textContent = vit[u]; v.classList.add('hurt'); }
    }
    function hurtPlate(p, n) {
      const pl = plate(p);
      if (!pl || !n) return;
      FX.number(pl, `−${n}`, { kind: 'damage' });
      life[p] = Math.max(0, (life[p] ?? 0) - n);
      pl.querySelector('.bf-life i').textContent = life[p];
    }

    async function play(b, g) {
      await FX.wait(650);
      for (const st of b.steps) {
        if (g !== gen) return;
        // each strikes with its own move, aimed at what it strikes (js/cards-alive.js); one that
        // can't charges. A blow lands only while its step still shows.
        const blow = (from, to, n, hit, color) => ({ from, to, land: () => { if (g !== gen) return; FX.impact(to, { strength: Math.max(1, n), color }); hit(); } });
        if (st.t === 'clash') {
          const a = el(st.a), c = el(st.b), s = Math.max(st.na, st.nb, 1);
          const own = await fight([blow(a, c, s, () => hurt(st.b, st.na)), blow(c, a, s, () => hurt(st.a, st.nb))]);
          if (!own && g === gen) await FX.clash(a, c, { strength: s, onHit: () => { hurt(st.b, st.na); hurt(st.a, st.nb); } });
        } else if (toPlayer(st.to)) {
          const a = el(st.from), p = plate(st.to.p);
          const own = await fight([blow(a, p, st.n, () => hurtPlate(st.to.p, st.n), '#ff6a3d')]);
          if (!own && g === gen) await FX.lunge(a, p, { strength: Math.max(1, st.n), color: '#ff6a3d', onHit: () => hurtPlate(st.to.p, st.n) });
        } else {
          const a = el(st.from), t = el(st.to);
          const own = await fight([blow(a, t, st.n, () => hurt(st.to, st.n))]);
          if (!own && g === gen) await FX.lunge(a, t, { strength: Math.max(1, st.n), onHit: () => hurt(st.to, st.n) });
        }
        await FX.wait(260);
      }
      if (g !== gen) return;
      if (b.dead.length) endFights(); // (the strikers' moves end before the deaths: together they're the heaviest moment)
      // the destroyed crumble, then stay put, dimmed under a ☠, so the step still shows who met whom
      await Promise.race([Promise.all(b.dead.map((u) => {
        const c = el(u);
        return c ? FX.death(c, { style: story.cards[u].token ? 'light' : 'crumble', of: b.dead.length }).then(() => { c.classList.remove('fx-hidden'); c.classList.add('doomed', 'bf-dead'); }) : null;
      })), FX.wait(1400)]);
      for (const u of b.dead) { const c = el(u); if (c) { c.classList.remove('fx-hidden'); c.classList.add('doomed', 'bf-dead'); } }
    }

    function show(k) {
      if (closed) return;
      if (k >= story.beats.length) { close(); return; }
      k = Math.max(0, k);
      i = k;
      gen++;
      const g = gen, b = story.beats[k];
      clearTimeout(timer);
      bars.forEach((x, j) => { x.style.transition = 'none'; x.style.width = j < k ? '100%' : '0%'; });
      // Life where this step starts: unblocked hits come off the defender's Life as they land
      if (b.k === 'open') {
        const end = story.beats[story.beats.length - 1];
        const hitsTotal = b.steps.reduce((t, s) => t + s.n, 0);
        b.l0 = end.lives[b.p][1] + hitsTotal;
        life[b.p] = b.l0;
      }
      for (const u of Object.keys(vit)) delete vit[u];
      // the words first (the result is laid out but not shown yet), then the cards in the room left
      $('.bf-setup').innerHTML = b.setup;
      const res = $('.bf-result');
      res.classList.remove('on');
      res.innerHTML = b.result;
      const stageEl = $('.bf-stage');
      stageEl.innerHTML = '';
      room = stageEl.clientHeight || innerHeight - 250;
      stageEl.innerHTML = stageHTML(b);
      // the words come once the hits have played (or after a few seconds whatever happens,
      // so a stuck animation, say on a phone that slept, never holds the story up)
      const words = () => {
        if (g !== gen || closed || res.classList.contains('on')) return;
        res.classList.add('on');
        left = readMs(`${b.setup} ${b.result}`);
        if (tap) { fill(); return; } // it waits for your tap
        if (!paused) run();
      };
      const late = setTimeout(words, 6500 / FX.getSpeed());
      play(b, g).catch((e) => console.error(e)).then(() => { clearTimeout(late); words(); });
    }
    function run() {
      const bar = bars[i];
      since = performance.now();
      if (bar) {
        bar.style.transition = 'none';
        const done = 1 - left / readMs(`${story.beats[i].setup} ${story.beats[i].result}`);
        bar.style.width = `${(Math.max(0, done) * 100).toFixed(1)}%`;
        void bar.offsetWidth;
        bar.style.transition = `width ${left}ms linear`;
        bar.style.width = '100%';
      }
      clearTimeout(timer);
      timer = setTimeout(() => show(i + 1), left);
    }
    // tap to go on (`tap`): the step's bar fills once its words are up, and the story waits there
    function fill() {
      const bar = bars[i];
      if (!bar) return;
      bar.style.transition = 'width .35s ease-out';
      bar.style.width = '100%';
    }
    function pause() {
      if (paused) return;
      paused = true;
      box.classList.add('paused');
      clearTimeout(timer);
      if (since) left = Math.max(300, left - (performance.now() - since));
      const bar = bars[i];
      if (bar) { const w = getComputedStyle(bar).width; bar.style.transition = 'none'; bar.style.width = w; }
    }
    function resume() {
      if (!paused) return;
      paused = false;
      box.classList.remove('paused');
      if (!tap && $('.bf-result').classList.contains('on')) run();
    }
    function close() {
      if (closed) return;
      closed = true;
      gen++;
      clearTimeout(timer);
      removeEventListener('keydown', key, true);
      FX.setStage(stage);
      box.classList.add('closing');
      setTimeout(() => box.remove(), 160);
      resolve();
    }
    const key = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); } else if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); show(i + 1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); show(i - 1); }
    };
    addEventListener('keydown', key, true);

    // a tap goes on, wherever it lands, however long it's held (the left edge
    // used to go back a step, and on the first step that played the same
    // attack again: Asaf, 2026-11-12, "it seems to replay the same attack over
    // and over again"; the arrow keys still go back). When the story runs by
    // itself, holding pauses it until you let go.
    let downAt = 0, holdT = 0, held = false;
    box.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.bf-skip')) return;
      downAt = performance.now();
      held = false;
      clearTimeout(holdT);
      if (!tap) holdT = setTimeout(() => { held = true; pause(); }, 320);
    });
    box.addEventListener('pointerup', (e) => {
      clearTimeout(holdT);
      if (e.target.closest('.bf-skip')) return;
      if (held) { held = false; resume(); return; }
      if (!downAt) return;
      downAt = 0;
      show(i + 1);
    });
    box.addEventListener('pointercancel', () => { clearTimeout(holdT); if (held) { held = false; resume(); } });
    box.addEventListener('click', (e) => { if (e.target.closest('.bf-skip')) close(); });
    show(0);
  });
}
