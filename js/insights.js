// Insights: your games and drafts as the bot reads them. The Insights page
// (#/insights), the review of one game (from its end screen or the page),
// the review of a draft, the end screen's few lines, and the lobby's board
// for tonight. The numbers come from stats.js; this file words and draws them.
//
// The page reads top to bottom like a report: the record, how the bot rates
// your play, when you win, cards, rivals, drafts, records, recent games.
// Every number is something you can act on or brag about; anything longer
// is a tap away (a game's review, a draft's picks).

import { BY_ID, FACTIONS } from './cards.js';
import { esc, factionCoin } from './render.js';
import * as FX from './fx.js';
import { ROUNDS } from './draft.js';
import * as St from './stats.js';

const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const shortName = (n) => String(n ?? '').replace(/^Bot · /, '');
const card = (cid) => `<b>${esc(BY_ID[cid]?.name || cid)}</b>`;
const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const chance = (adv) => Math.round((adv + 1) * 50);
const PLAYER_COLORS = ['#e6c06d', '#7fc4e8', '#c79bff']; // you, then the others in seat order
const GRADE_NAME = Object.fromEntries([...St.GRADES.map((g) => [g.key, g.name]), ...St.PICK_GRADES.map((g) => [g.key, g.name]), ['great', 'Great']]);

// "You" for this phone's player, the name otherwise
const who = (rec, p, lower = false) => (p === rec.me ? (lower ? 'you' : 'You') : esc(shortName(rec.players[p]?.name)));
const whose = (rec, p, kk) => (p === rec.me ? `Your turn ${kk}` : `${esc(shortName(rec.players[p]?.name))}’s turn ${kk}`);
const others = (rec) => rec.players.filter((_, i) => i !== rec.me).map((P) => esc(shortName(P.name)));

function when(at) {
  const d = new Date(at), now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const days = Math.round((day(now) - day(d)) / 864e5);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString(undefined, { weekday: 'short' });
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── words ───────────────────────────────────────────────────────────
// What the bot would have done, finishing "The bot would have …".
function altText(rec, a) {
  if (!a) return '';
  switch (a.t) {
    case 'play': return `played ${card(a.cid)}`;
    case 'use': return `used ${card(a.cid)}`;
    case 'phoenix': return 'brought the Phoenix back';
    case 'attack': return `attacked${rec.n > 2 ? ` ${who(rec, a.v, true)}` : ''} with ${list(a.cids.map(card))}`;
    case 'hold': return 'held back';
    case 'block': return list(a.pairs.map(([b, x]) => `blocked ${card(x)} with ${card(b)}`));
    case 'noblock': return 'not blocked';
    case 'pass': return 'let the fight go on';
    default: return 'ended the turn';
  }
}

/** One judged decision as a sentence. */
export function markText(rec, m) {
  switch (m.k) {
    case 'turn': return `You ended your turn with ${plural(m.left, 'Energy', 'Energy')} left. The bot would have ${altText(rec, m.alt)}.`;
    case 'attack': return `Attacking with ${list(m.cids.map(card))} cost you.${m.alt ? ` The bot would have ${altText(rec, m.alt)}.` : ''}`;
    case 'block': return m.alt ? `Your blocks cost you. The bot would have ${altText(rec, m.alt)}.` : 'Your blocks cost you.';
    case 'trick': return m.gain >= 0 ? `${card(m.cid)} won the fight.` : `${card(m.cid)} didn’t pay off: the bot would have kept it.`;
    default: return '';
  }
}

// A fight in a sentence, from your side of the table.
function fightText(rec, f) {
  const me = rec.me;
  const mine = f.deaths.filter((x) => x.p === me).map((x) => card(x.cid));
  const theirs = f.deaths.filter((x) => x.p !== me).map((x) => card(x.cid));
  if (f.a === me) {
    if (!f.hit && !theirs.length) return mine.length ? `You attacked ${who(rec, f.d)} and lost ${list(mine)}.` : '';
    let t = f.hit ? `You hit ${who(rec, f.d)} for ${f.hit}` : `You attacked ${who(rec, f.d)}`;
    if (theirs.length) t += `${f.hit ? ' and destroyed' : ': they lost'} ${list(theirs)}`;
    if (mine.length) t += `${theirs.length ? ', and you lost' : ', but lost'} ${list(mine)}`;
    return `${t}.`;
  }
  if (f.d === me) {
    if (!f.hit && !mine.length) return theirs.length ? `${who(rec, f.a)} attacked you and lost ${list(theirs)}.` : '';
    let t = f.hit ? `${who(rec, f.a)} hit you for ${f.hit}` : `${who(rec, f.a)} attacked you`;
    if (mine.length) t += `${f.hit ? ' and destroyed' : ': you lost'} ${list(mine)}`;
    if (theirs.length) t += `${mine.length ? ', and they lost' : ', but lost'} ${list(theirs)}`;
    return `${t}.`;
  }
  const t = f.hit ? `${who(rec, f.a)} hit ${who(rec, f.d)} for ${f.hit}` : `${who(rec, f.a)} attacked ${who(rec, f.d)}`;
  return `${t}${f.deaths.length ? `: ${list(f.deaths.map((x) => card(x.cid)))} ${f.deaths.length > 1 ? 'were' : 'was'} destroyed` : ''}.`;
}

/** The moments worth telling, as { when, text }. */
export function momentsText(rec) {
  return (rec.moments || []).map((m) => {
    switch (m.k) {
      case 'hit': return { t: m.t, when: whose(rec, m.p, m.kk), text: `${who(rec, m.p)} hit ${who(rec, m.v, true)} for ${m.n} with ${list(m.cids.filter(Boolean).map(card))}.` };
      case 'swing': {
        const f = m.fight ? fightText(rec, m.fight) : '';
        const way = m.d > 0 ? 'your way' : 'against you';
        return { t: m.t, when: whose(rec, m.p, m.kk), text: `${f ? `${f} ` : ''}The game swung ${way}.`, d: m.d };
      }
      case 'lead': return { t: m.t, when: whose(rec, m.p, m.kk), text: m.won ? 'From here on, you were ahead.' : 'From here on, you were behind.' };
      case 'out': return { t: m.t, when: whose(rec, m.p, m.kk), text: `${who(rec, m.v)} ${m.v === rec.me ? 'are' : 'is'} out.` };
      case 'comeback': return { t: m.t, when: 'The end', text: m.p === rec.me ? `You came back from ${m.n} Life to win.` : `${who(rec, m.p)} came back from ${m.n} Life to win.` };
      default: return null;
    }
  }).filter(Boolean);
}

/** The one thing to take from the game, as a sentence (or ''). */
export function tipText(rec) {
  const tip = St.tipFor(rec, rec.review);
  if (!tip) return '';
  switch (tip.k) {
    case 'mark': return markText(rec, tip.m);
    case 'energy': return `You used ${tip.pct}% of your Energy. A card every turn adds up.`;
    case 'full': return `Your hand was full ${plural(tip.n, 'time')}, and those cards were lost. Play them sooner.`;
    case 'great': return `${card(tip.m.cid)} won a fight for you: keeping Energy for a Trick paid off.`;
    case 'clean': return `Clean game: the bot rates your play ${tip.acc}%.`;
    default: return '';
  }
}

// ── charts ──────────────────────────────────────────────────────────
// "Your chances" (the bot's reading of who is ahead, as a chance of winning)
// or everyone's Life, turn by turn. Plain SVG, sized by the page.
const W = 320, H = 96, PAD = 4;
function chancesSVG(rec, { h = H, dots = true } = {}) {
  // lightly smoothed: each side gains on its own turn, and the raw line zigzags with that
  const raw = rec.adv.map(chance);
  const sm = raw.map((v, i) => (i === 0 || i === raw.length - 1 ? v : 0.25 * raw[i - 1] + 0.5 * v + 0.25 * raw[i + 1]));
  const pts = sm.map((c, i) => [PAD + (i / Math.max(1, sm.length - 1)) * (W - 2 * PAD), PAD + (1 - c / 100) * (h - 2 * PAD)]);
  const mid = PAD + (h - 2 * PAD) / 2;
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${PAD},${mid} ${line} ${(W - PAD).toFixed(1)},${mid}`;
  const id = `c${Math.random().toString(36).slice(2, 8)}`;
  const at = (t) => rec.marks.findIndex((m) => m && m.t === t);
  const marks = dots ? (rec.moments || []).map((m) => at(m.t)).filter((i) => i > 0).map((i) => `<circle cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="3.2" class="ch-dot"/>`).join('') : '';
  return `<svg class="ch" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" role="img" aria-label="Your chances of winning, turn by turn, as the bot saw them">
    <defs><clipPath id="${id}u"><rect x="0" y="0" width="${W}" height="${mid}"/></clipPath><clipPath id="${id}d"><rect x="0" y="${mid}" width="${W}" height="${h - mid}"/></clipPath></defs>
    <line x1="${PAD}" x2="${W - PAD}" y1="${mid}" y2="${mid}" class="ch-mid"/>
    <polygon points="${area}" class="ch-up" clip-path="url(#${id}u)"/><polygon points="${area}" class="ch-down" clip-path="url(#${id}d)"/>
    <polyline points="${line}" class="ch-line" vector-effect="non-scaling-stroke"/>${marks}</svg>`;
}

function lifeSVG(rec, { h = H } = {}) {
  const top = Math.max(20, ...rec.life.flat());
  const n = rec.life.length;
  const order = [rec.me, ...rec.players.map((_, i) => i).filter((i) => i !== rec.me)];
  const lines = order.map((p, k) => {
    const pts = rec.life.map((row, i) => `${(PAD + (i / Math.max(1, n - 1)) * (W - 2 * PAD)).toFixed(1)},${(PAD + (1 - row[p] / top) * (h - 2 * PAD)).toFixed(1)}`).join(' ');
    return `<polyline points="${pts}" style="stroke:${PLAYER_COLORS[k]}" class="ch-life${p === rec.me ? ' me' : ''}" vector-effect="non-scaling-stroke"/>`;
  }).reverse().join('');
  return `<svg class="ch" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" role="img" aria-label="Everyone's Life, turn by turn">${lines}</svg>`;
}

function legendHTML(rec) {
  const order = [rec.me, ...rec.players.map((_, i) => i).filter((i) => i !== rec.me)];
  return `<div class="ch-legend">${order.map((p, k) => `<span><i style="background:${PLAYER_COLORS[k]}"></i>${who(rec, p)} ${rec.players[p].life}</span>`).join('')}</div>`;
}

// Two views of one game, swapped by two small tabs (radio buttons: no script needed).
function chartsHTML(rec) {
  const id = `rv${Math.random().toString(36).slice(2, 8)}`;
  const c = chance(rec.adv[rec.adv.length - 1]);
  return `<div class="rv-charts">
    <input type="radio" name="${id}" id="${id}a" checked><input type="radio" name="${id}" id="${id}b">
    <div class="rv-tabs"><label for="${id}a">Your chances</label><label for="${id}b">Life</label></div>
    <div class="rv-chart rv-chart-a">${chancesSVG(rec)}<div class="ch-note">The bot’s guess at your chances of winning, turn by turn${rec.over ? '' : ` (${c}% now)`}. Dots mark the key moments.</div></div>
    <div class="rv-chart rv-chart-b">${lifeSVG(rec)}${legendHTML(rec)}</div>
  </div>`;
}

// ── one game ────────────────────────────────────────────────────────
function resultLine(rec) {
  if (!rec.over) return 'Unfinished';
  if (rec.winner === rec.me) return 'You won';
  return rec.winner == null ? 'Nobody won' : `${who(rec, rec.winner)} won`;
}

const accLine = (rv) => {
  if (!rv) return '<span class="rv-wait">The bot is reviewing your moves…</span>';
  if (rv.acc == null) return '<span class="muted">Too few decisions to rate.</span>';
  const c = St.GRADES.map((g) => (rv.counts[g.key] ? `<span class="gr gr-${g.key}">${plural(rv.counts[g.key], g.name.toLowerCase())}</span>` : '')).filter(Boolean);
  return `<b class="rv-acc-n">${rv.acc}%</b> <span class="muted">accuracy</span>${c.length ? ` · ${c.join(' · ')}` : ' · no mistakes'}`;
};

/** The whole review of one game: result, accuracy, chart, moments, the bot's notes, everyone's numbers. */
export function reviewHTML(rec) {
  const rv = rec.review;
  const me = rec.players[rec.me];
  const moments = momentsText(rec);
  const notes = rv ? [...(rv.great || []).map((m) => ({ ...m, g: 'great' })), ...(rv.marks || [])].sort((x, y) => x.t - y.t) : [];
  const order = [rec.me, ...rec.players.map((_, i) => i).filter((i) => i !== rec.me)];
  const pctE = (P) => (P.had ? `${Math.min(100, Math.round((100 * P.spent) / P.had))}%` : '–');
  const nem = rec.nem?.[0];
  return `<div class="rv">
    <div class="rv-head"><div class="rv-res${rec.winner === rec.me ? ' win' : ''}">${resultLine(rec)}</div>
      <div class="rv-sub">${rec.at ? `${when(rec.at)} · ` : ''}${plural(me.turns, 'turn')} · vs ${list(others(rec))}</div></div>
    <div class="rv-acc">${accLine(rv)}</div>
    ${chartsHTML(rec)}
    ${moments.length ? `<h4>Key moments</h4><ol class="rv-list">${moments.map((m) => `<li><span class="rv-when">${m.when}</span>${m.text}</li>`).join('')}</ol>` : ''}
    ${notes.length ? `<h4>The bot’s notes</h4><ol class="rv-list">${notes.map((m) => `<li><span class="rv-when">${whose(rec, m.p, m.kk)} <span class="gr gr-${m.g}">${GRADE_NAME[m.g]}</span></span>${markText(rec, m.g === 'great' ? { ...m, gain: m.gain } : m)}</li>`).join('')}</ol>`
      : rv && rv.acc != null ? '<h4>The bot’s notes</h4><p class="rv-none">Nothing to flag: the bot would have played it much the same.</p>' : ''}
    ${rv?.mull && !rv.mull.same ? `<p class="rv-none">Opening hand: the bot would have ${rv.mull.redraw ? 'kept yours' : 'drawn a new one'}.</p>` : ''}
    <h4>Everyone</h4>
    <div class="rv-table-wrap"><table class="rv-table"><thead><tr><th></th><th>Damage</th><th>Kills</th><th>Lost</th><th>Played</th><th>Energy</th></tr></thead><tbody>
      ${order.map((p, k) => { const P = rec.players[p]; return `<tr${p === rec.me ? ' class="me"' : ''}><th><i style="background:${PLAYER_COLORS[k]}"></i>${who(rec, p)}</th><td>${P.dealt}</td><td>${P.kills}</td><td>${P.lost}</td><td>${P.plays}</td><td>${pctE(P)}</td></tr>`; }).join('')}
    </tbody></table></div>
    <div class="rv-cards">
      ${me.mvp ? `<div><span class="rv-k">Your best card</span>${card(me.mvp.cid)} · ${[me.mvp.dmg ? `${me.mvp.dmg} damage` : '', me.mvp.k ? plural(me.mvp.k, 'kill') : ''].filter(Boolean).join(', ')}</div>` : ''}
      ${nem ? `<div><span class="rv-k">Hurt you most</span>${card(nem[0])} · ${nem[1]} damage</div>` : ''}
    </div>
  </div>`;
}

/** The end screen's few lines: how long, tonight's score (or your record against the bots), a small chart, the tip. */
export function overSummaryHTML(rec, { score = '' } = {}) {
  if (!rec) return '';
  const tip = rec.review ? tipText(rec) : '';
  const quit = rec.how === 'concede' ? rec.players.findIndex((P) => P.conceded) : -1;
  const line = [rec.players[rec.me].turns ? plural(rec.players[rec.me].turns, 'turn') : '', quit >= 0 ? `${who(rec, quit)} conceded` : '', score].filter(Boolean).join(' · ');
  return `<div class="ov-sum">
    <div class="ov-line">${line}</div>
    <div class="ov-chart">${chancesSVG(rec, { h: 64 })}</div>
    <div class="ov-tip">${rec.review ? (tip ? `<span aria-hidden="true">💡</span> ${tip}` : '') : '<span class="rv-wait">The bot is reviewing your moves…</span>'}</div>
    <button class="btn small" data-act="review">Game review${rec.review?.acc != null ? ` · ${rec.review.acc}%` : ''}</button>
  </div>`;
}

// ── a draft ─────────────────────────────────────────────────────────
const KIND = { small: 'Small', medium: 'Medium', big: 'Big', spells: 'Spells', tricks: 'Tricks', relics: 'Relics', last: 'Last call' };
export function draftReviewHTML(d) {
  const rv = d.review;
  const c = rv.counts;
  return `<div class="rv">
    <div class="rv-head"><div class="rv-res win">Draft score ${rv.score}</div>
      <div class="rv-sub">${d.at ? `${when(d.at)} · ` : ''}${d.n} players · ${d.mode === 'online' ? 'with friends' : 'against bots'}</div></div>
    <div class="rv-acc">${St.PICK_GRADES.map((g) => (c[g.key] ? `<span class="gr gr-${g.key}">${c[g.key]} ${g.name.toLowerCase()}</span>` : '')).filter(Boolean).join(' · ')}</div>
    <p class="rv-none">Each pick against the bot’s rating of every card on the table, for your deck as it was then: the card’s strength, your factions, your curve, enough creatures.</p>
    <ol class="dv-list">${rv.picks.map((x) => `<li class="dv-${x.auto ? 'auto' : x.g}"><span class="dv-r">${x.r + 1}<i>${KIND[ROUNDS[x.r]] || ''}</i></span>
      <span class="dv-t">${card(x.cid)}${x.auto ? ' <span class="muted">(the last card)</span>' : ` <span class="gr gr-${x.g}">${GRADE_NAME[x.g]}</span>`}
      ${!x.auto && x.best !== x.cid ? `<span class="dv-alt">The bot liked ${card(x.best)} more</span>` : ''}</span></li>`).join('')}</ol>
  </div>`;
}

/** The draft's end screen line: its score and a way into the review. */
export function draftLineHTML(d) {
  if (!d?.review || d.review.score == null) return '';
  const c = d.review.counts;
  return `<div class="dv-line"><span><b>Draft score ${d.review.score}</b> · ${c.best || 0} of your picks were the bot’s top choice</span>
    <button class="btn small" data-act="draft-review" data-id="${esc(d.id)}">See every pick</button></div>`;
}

// ── a sheet over the page ──────────────────────────────────────────
// For a game's or a draft's review outside the table: it closes like the
// table's sheets (swipe the handle up, tap it, or tap outside).
let sheet = null;
export function openSheet(html) {
  closeSheet();
  sheet = document.createElement('div');
  sheet.className = 'ins-sheet';
  sheet.innerHTML = `<div class="ins-sheet-inner">${html}</div><div class="g-grab ins-grab" role="button" aria-label="Close"><i></i><span>Swipe up to close</span></div>`;
  sheet.addEventListener('click', (e) => {
    if (e.target.closest('.ins-grab') || !e.target.closest('.ins-sheet-inner')) closeSheet();
  });
  sheet.addEventListener('pointerdown', (e) => {
    const grab = e.target.closest('.ins-grab');
    if (grab) FX.grabSwipe(e, grab, closeSheet);
  });
  document.body.appendChild(sheet);
  document.body.classList.add('ins-open');
}
export function closeSheet() {
  sheet?.remove();
  sheet = null;
  document.body.classList.remove('ins-open');
}

// ── the room's board for tonight ────────────────────────────────────
const AWARD = {
  dealt: (n) => ['🔥', 'Most damage', `${n}`],
  kills: (n) => ['⚔️', 'Most creatures destroyed', `${n}`],
  blocks: (n) => ['🛡️', 'The wall', `${n} blocks`],
  hit: (n) => ['💥', 'Biggest hit', `${n} in one fight`],
  crown: (n) => ['👑', 'Wore the Crown longest', `${n} turns`],
};

/** Tonight in this room: wins per player and a few awards (`extra` goes at the end). `myName` is shown as "You". */
export function tonightHTML(results, myName, extra = '') {
  const night = St.nightAwards(results);
  if (!night.games) return '';
  const mine = String(myName || '').trim().toLowerCase();
  const nm = (P) => (P.k === mine ? 'You' : esc(shortName(P.name)));
  const lead = Math.max(...night.people.map((P) => P.wins));
  const people = [...night.people].sort((a, b) => b.wins - a.wins);
  const awards = night.awards.slice(0, 4).map((a) => {
    if (a.k === 'card') return `<li><span aria-hidden="true">🃏</span><span>Card of the night</span><b>${card(a.cid)} <span class="muted">(${nm(a.who)})</span></b></li>`;
    const [icon, label, val] = AWARD[a.k](a.n);
    return `<li><span aria-hidden="true">${icon}</span><span>${label}</span><b>${nm(a.who)} <span class="muted">${val}</span></b></li>`;
  }).join('');
  return `<div class="tn">
    <div class="tn-h">Tonight <span class="muted">· ${plural(night.games, 'game')}</span></div>
    <div class="tn-wins">${people.map((P) => `<span class="${P.wins === lead && lead > 0 ? 'lead' : ''}"><b>${P.wins}</b>${nm(P)}</span>`).join('')}</div>
    ${awards ? `<ul class="tn-awards">${awards}</ul>` : ''}${extra}
  </div>`;
}

/** "Tonight: You 2, Dan 1" for the end screen. */
export function tonightLine(results, myName) {
  const night = St.nightAwards(results);
  if (!night.games) return '';
  const mine = String(myName || '').trim().toLowerCase();
  const people = [...night.people].sort((a, b) => b.wins - a.wins || (a.k === mine ? -1 : b.k === mine ? 1 : 0));
  return `Tonight: ${people.map((P) => `${P.k === mine ? 'You' : esc(shortName(P.name))} ${P.wins}`).join(', ')}`;
}

// ── the Insights page ──────────────────────────────────────────────
const F = { filter: 'all' };
const bar = (p, cls = '') => `<span class="ins-bar${cls ? ` ${cls}` : ''}"><i style="width:${Math.max(2, p ?? 0)}%"></i></span>`;
const wr = (x) => (x.n ? `${Math.round((100 * x.w) / x.n)}%` : '–');
const wl = (x) => `${x.w}–${x.n - x.w}`;
const spark = (vals, lo = 0, hi = 100) => {
  if (vals.length < 2) return '';
  const pts = vals.map((v, i) => `${((i / (vals.length - 1)) * 100).toFixed(1)},${(28 - ((v - lo) / Math.max(1, hi - lo)) * 26).toFixed(1)}`).join(' ');
  return `<svg class="ins-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" vector-effect="non-scaling-stroke"/></svg>`;
};
const facLabel = (f) => (f === '—' ? 'Mixed' : f.split('/').map((x) => FACTIONS[x]?.name || x).join('/'));
const facCoins = (f) => (f === '—' ? '' : f.split('/').map(factionCoin).join(''));

function recordHTML(S) {
  const form = S.form.map((w) => `<i class="${w ? 'w' : 'l'}" title="${w ? 'Won' : 'Lost'}"></i>`).join('');
  return `<section class="ins-card ins-record">
    <div class="ins-big"><b>${S.rate ?? 0}%</b><span>won</span></div>
    <div class="ins-rec-r">
      <div class="ins-wl"><b>${S.w}</b> won · <b>${S.l}</b> lost</div>
      <div class="ins-form" aria-label="Your last ${S.form.length} games, newest last">${form}</div>
      ${S.streak && S.streak.n >= 2 ? `<div class="muted small">${S.streak.n} ${S.streak.won ? 'wins' : 'losses'} in a row</div>` : ''}
    </div></section>`;
}

function playHTML(S) {
  const P = S.play;
  if (P.acc == null && P.energy == null) return '';
  const row = (label, x, note = '') => (x.n ? `<div class="ins-row"><span>${label}</span>${bar(Math.round((100 * x.ok) / x.n))}<b>${Math.round((100 * x.ok) / x.n)}%</b>${note ? `<small>${note}</small>` : ''}</div>` : '');
  const graded = St.GRADES.map((g) => (P.counts[g.key] ? `<span class="gr gr-${g.key}">${plural(P.counts[g.key], g.name.toLowerCase())}</span>` : '')).filter(Boolean).reverse();
  return `<section class="ins-card"><h3>How the bot rates your play</h3>
    ${P.acc != null ? `<div class="ins-acc"><div class="ins-big"><b>${P.acc}%</b><span>accuracy</span></div>${spark(P.trend, Math.min(...P.trend, 60), 100)}</div>
    <p class="ins-note">At each attack, block, fight Trick and end of turn: how close you came to the bot’s best move, by its own scoring.</p>` : ''}
    <div class="ins-rows">
      ${row('Ends of turn', P.turn, 'Energy put to use')}
      ${row('Attacks', P.attack)}
      ${row('Blocks', P.block)}
      ${row('Fight Tricks', P.trick)}
      ${P.energy != null ? `<div class="ins-row"><span>Energy used</span>${bar(P.energy)}<b>${P.energy}%</b>${P.botEnergy != null ? `<small>The bots use ${P.botEnergy}%</small>` : ''}</div>` : ''}
    </div>
    ${graded.length || P.great ? `<div class="ins-chips">${P.great ? `<span class="gr gr-great">${plural(P.great, 'great Trick')}</span>` : ''}${graded.join('')}</div>` : ''}
    <div class="ins-sub">An average game</div>
    <div class="ins-quad"><div><b>${P.dealt}</b><span>damage dealt</span></div><div><b>${P.taken}</b><span>damage taken</span></div><div><b>${P.kills}</b><span>creatures destroyed</span></div><div><b>${P.lost}</b><span>of yours lost</span></div></div>
    ${P.full ? `<div class="ins-note">${plural(P.full, 'card')} lost to a full hand so far.</div>` : ''}
  </section>`;
}

function whenHTML(S) {
  const Wn = S.when;
  const row = (label, x) => (x.n ? `<div class="ins-row"><span>${label}</span>${bar(Math.round((100 * x.w) / x.n), 'gold')}<b>${wr(x)}</b><small>${wl(x)}</small></div>` : '');
  return `<section class="ins-card"><h3>When you win</h3>
    <div class="ins-rows">
      ${row('Going first', Wn.first)}${row('Going second', Wn.second)}
      ${Wn.lengths.map((x) => row(x.label, x)).join('')}
      ${row('Kept opening hand', Wn.kept)}${row('New opening hand', Wn.redrew)}
    </div>
    ${Wn.factions.length ? `<div class="ins-sub">Your decks</div><div class="ins-rows">${Wn.factions.slice(0, 5).map((x) => `<div class="ins-row"><span class="ins-fac">${facCoins(x.f)}${facLabel(x.f)}</span>${bar(Math.round((100 * x.w) / x.n), 'gold')}<b>${wr(x)}</b><small>${wl(x)}</small></div>`).join('')}</div>` : ''}
  </section>`;
}

function cardsHTML(S) {
  const C = S.cards;
  if (!C.all.length) return '';
  const line = (c, right) => `<div class="ins-crow">${card(c.cid)}<span>${right}</span></div>`;
  const lifts = C.lift.length >= 2 ? [...C.lift.slice(0, 3), ...(C.lift.length > 3 ? [C.lift[C.lift.length - 1]] : [])] : [];
  return `<section class="ins-card"><h3>Your cards</h3>
    ${C.mvp.length ? `<div class="ins-sub">Did the most</div>${C.mvp.map((c) => line(c, [c.dmg ? `${c.dmg} damage` : '', c.k ? plural(c.k, 'kill') : ''].filter(Boolean).join(' · '))).join('')}` : ''}
    ${lifts.length ? `<div class="ins-sub">Winning when drawn <small>(win rate in games you drew it, against games it stayed in your deck)</small></div>
      ${lifts.map((c) => line(c, `<b class="${c.iwd >= 0 ? 'up' : 'down'}">${c.iwd >= 0 ? '+' : ''}${c.iwd}</b> · ${c.gihWr}% drawn, ${c.gnsWr}% not`)).join('')}`
      : '<p class="ins-note">After a few more games with the same cards, this shows which of them win more when you draw them, the way 17lands rates Magic cards.</p>'}
    ${C.stuck.length ? `<div class="ins-sub">Stuck in your hand</div>${C.stuck.map((c) => line(c, `drawn ${c.gih}, never played in ${c.stuck}`)).join('')}` : ''}
    ${C.nemesis.length ? `<div class="ins-sub">Hurt you most</div>${C.nemesis.map((c) => line(c, `${c.dmg} damage to you`)).join('')}` : ''}
  </section>`;
}

function rivalsHTML(S) {
  if (!S.rivals.length) return '';
  return `<section class="ins-card"><h3>Rivals</h3><div class="ins-rows">
    ${S.rivals.slice(0, 8).map((r) => `<div class="ins-row"><span>${esc(r.name)}${r.bot ? ' <small class="muted">bot</small>' : ''}</span>${bar(Math.round((100 * r.w) / r.n), 'gold')}<b>${r.w}–${r.l}</b><small>${plural(r.n, 'game')}</small></div>`).join('')}
  </div></section>`;
}

function draftsHTML(S) {
  const D = S.draft;
  if (!D) return '';
  return `<section class="ins-card"><h3>Drafting</h3>
    <div class="ins-acc"><div class="ins-big"><b>${D.score}</b><span>draft score</span></div>${spark(D.trend, Math.min(...D.trend, 50), 100)}</div>
    <p class="ins-note">How your picks compare with the bot’s rating of every card on the table, for your deck at that moment. ${plural(D.n, 'draft')} so far.</p>
    <div class="ins-chips">${St.PICK_GRADES.map((g) => (D.counts[g.key] ? `<span class="gr gr-${g.key}">${D.counts[g.key]} ${g.name.toLowerCase()}</span>` : '')).join('')}</div>
    <div class="ins-rows">${D.record.slice(-4).reverse().map((x) => `<button class="ins-game" data-act="ins-draft" data-id="${esc(x.d.id)}"><span>${when(x.d.at)} · ${x.d.n} players</span><span>score <b>${x.d.review.score}</b>${x.n ? ` · deck ${x.w}–${x.n - x.w}` : ''}</span><i aria-hidden="true">›</i></button>`).join('')}</div>
  </section>`;
}

function recordsHTML(S) {
  const R = S.records;
  const items = [
    R.hit && R.hit.n >= 4 ? ['💥', 'Biggest hit', `${R.hit.n} damage in one fight`] : null,
    R.fastest ? ['⚡', 'Fastest win', plural(R.fastest.n, 'turn')] : null,
    R.comeback ? ['🔥', 'Best comeback', `won from ${R.comeback.n} Life`] : null,
    R.flawless ? ['✨', 'Flawless', 'won without losing any Life'] : null,
  ].filter(Boolean);
  if (!items.length) return '';
  return `<section class="ins-card"><h3>Records</h3><ul class="tn-awards">${items.map(([i, k, v]) => `<li><span aria-hidden="true">${i}</span><span>${k}</span><b>${v}</b></li>`).join('')}</ul></section>`;
}

function recentHTML(S) {
  if (!S.recent.length) return '';
  return `<section class="ins-card"><h3>Recent games</h3><div class="ins-rows">
    ${S.recent.slice(0, 12).map((g) => `<button class="ins-game" data-act="ins-game" data-id="${esc(g.id)}">
      <span><b class="${g.winner === g.me ? 'up' : 'down'}">${g.winner === g.me ? 'Won' : 'Lost'}</b> vs ${list(others(g))}</span>
      <span>${when(g.at)} · ${plural(g.players[g.me].turns, 'turn')}${g.review?.acc != null ? ` · ${g.review.acc}%` : ''}</span><i aria-hidden="true">›</i></button>`).join('')}
  </div></section>`;
}

export function insightsPage(view) {
  const games = St.loadGames(), drafts = St.loadDrafts();
  const render = () => {
    const S = St.summarize(games, drafts, F.filter);
    const anyFriends = games.some((g) => g.mode === 'online'), anyBots = games.some((g) => g.mode !== 'online');
    const chips = anyFriends && anyBots ? `<div class="chips ins-filter">${[['all', 'All games'], ['friends', 'Friends'], ['bots', 'Bots']].map(([k, label]) => `<button class="chip${F.filter === k ? ' on' : ''}" data-f="${k}">${label}</button>`).join('')}</div>` : '';
    view.innerHTML = `
      <header class="pagehead"><a class="back" href="#/" aria-label="Home">${BACK}</a><h2>Insights</h2></header>
      ${chips}
      ${S.n ? `<div class="ins">${recordHTML(S)}${playHTML(S)}${whenHTML(S)}${cardsHTML(S)}${rivalsHTML(S)}${draftsHTML(S)}${recordsHTML(S)}${recentHTML(S)}</div>`
        : `<div class="ins-empty"><p>Your games show up here: your record, how the bot rates your play, your best cards and your rivals.</p>
           ${draftsHTML(S) ? `<div class="ins">${draftsHTML(S)}</div>` : ''}<a class="btn primary" href="#/play">Play a game</a></div>`}`;
  };
  render();
  view.onclick = (e) => {
    const chip = e.target.closest('.chip[data-f]');
    if (chip) { F.filter = chip.dataset.f; render(); return; }
    const g = e.target.closest('[data-act="ins-game"]');
    if (g) { const rec = games.find((x) => x.id === g.dataset.id); if (rec) openSheet(reviewHTML(rec)); return; }
    const d = e.target.closest('[data-act="ins-draft"]');
    if (d) { const rec = drafts.find((x) => x.id === d.dataset.id); if (rec) openSheet(draftReviewHTML(rec)); }
  };
}
