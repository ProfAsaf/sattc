// Draft night, on screen: the draft itself (online, or against bots for
// practice) and the lobby panel of a draft room. The rules, the replay and
// the bots are in draft.js.
//
// The draft screen is a full-screen layer (#draft) above the app, like the
// game table: the round and its kind of card, the picking order with whose
// turn it is, the cards on the table (tap one to see it big, then Take it),
// what everyone else took, and your deck so far. When your 30 picks are in,
// it turns into your deck, with Start game / Ready / Play.
//
// game-ui.js calls in from the Play page and the online lobby:
//   savedPractice()                  a practice draft to resume, or null
//   roomPanelHTML(code, info, tonight), modeSwitchHTML(on), createSwitchHTML(on)
//   onPlayAct(act, el, ctx)          the Play page's draft-* buttons (draft-practice: el.dataset.n bots)
//   onRoomInfo(code, info, refresh)  each lobby update of the room this phone is in
//   beforeStart(code, info)          the host's Start game in a draft room
//   leaveRoom()                      this phone leaves the room
// and campaign-ui.js, for the campaign's finale (World 6), whose deck you draft:
//   campaignDraft(ctx), savedCampaignDraft()

import { BY_ID, KEYWORDS } from './cards.js';
import { cardHTML, cardRowHTML, esc, factionCoin } from './render.js';
import * as FX from './fx.js';
import { keepAwake } from './awake.js';
import * as Decks from './decks.js';
import * as Net from './net.js';
import * as St from './stats.js';
import * as Ins from './insights.js';
import * as Mode from './mode.js';
import {
  KINDS, KIND_INFO, PICKS, botChoice, byCost, deckCounts, deckName, factionCounts, kindCounts, lastPicks,
  newSeed, poolKey, replay, roundPicks, adviceFor, draftPool, kindInfo,
} from './draft.js';

const kept = (key) => ({
  get() { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set(v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* fine without */ } },
  clear() { try { localStorage.removeItem(key); } catch { /* fine */ } },
});
const store = kept('collective.draft.snake.v1');
const campStore = kept('collective.draft.campaign.v1'); // the campaign's draft, apart from the Play page's
const boxOf = (d) => (d.campaign ? campStore : store);
const BOT_MS = 700; // practice bots pick after this long, so you see what they took

// R: the draft of the online room this phone is in (kept while in the room,
//    whether or not the screen is open).
// P: a practice draft against bots.
// V: the draft screen, while it is open.
let R = null;
let P = null;
let V = null;
let refreshPlay = null; // redraws the Play page (from game-ui.js)

// for checks from the console or a test script
if (typeof window !== 'undefined') window.collectiveDraft = { get R() { return R; }, get P() { return P; }, get V() { return V; }, redraw: () => render() };

// ── small helpers ───────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const box = document.createElement('div');
  box.className = 'toast';
  box.style.zIndex = 90;
  box.textContent = msg;
  document.body.appendChild(box);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => box.remove(), 2600);
}
const fail = (e) => toast(e?.message || String(e));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const listNames = (ns) => (ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`);
const who = (d, p) => (p === d.me ? 'You' : d.names[p] || `Player ${p + 1}`);
const nameOf = (cid) => esc(BY_ID[cid]?.name || cid);
const mine = (d) => d.st.pools[d.me];
const myDone = (d) => mine(d).length >= PICKS;
// an online pick of mine on its way to the database (not in the replay yet)
const sending = (d) => !!(d.sent && !d.st.done && d.sent.k === d.st.round && d.st.who === d.me);
// This phone's card list is not the one the draft was dealt from (an old version
// of the app on one of the phones): its table would be wrong, so it must not pick.
const stale = (d) => !!(d?.kind === 'online' && d.info?.draft?.pool && d.info.draft.pool !== poolKey(!!d.ultra));
const STALE = 'This phone’s cards don’t match the draft’s: one of the phones has an older version of the game. Reload the page on every phone, then carry on.';
const myTurn = (d) => !d.st.done && d.st.who === d.me;
const canPickNow = (d) => d.me >= 0 && myTurn(d) && !sending(d) && !stale(d) && d.st.table.length > 0;
// the cards still on the table (my pick on its way counts as gone)
const onTable = (d) => d.st.table.filter((c) => !(sending(d) && c === d.sent.cid));
const hostName = (info) => (info.players || []).find((p) => p && p.id === info.host)?.name || 'the host';

function explain(n, ultra = false) {
  const all = draftPool(ultra).length;
  return 'Each round, up to 6 cards of one kind (small, medium or big creatures, spells, tricks, relics) go on the table, and everyone takes one, in turn. '
    + 'The order snakes: whoever picks last in a round picks first in the next. 30 rounds, and your 30 picks are your deck, any factions. '
    + (ultra ? `SATTC Ultra: the cards are the Week One 90 without the four Ultra leaves out, and the 31 Ultra cards; ${n * PICKS} of those ${all} get picked.`
      : n === 3 ? 'With three of you, every one of the 90 cards gets picked.' : 'With two of you, 60 of the 90 cards get picked.');
}

function curveHTML(pool) {
  const c = Decks.curve(deckCounts(pool)).slice(1); // costs 1..7+
  const max = Math.max(4, ...c);
  return `<div class="curve dr-curve" aria-label="Cards by cost">${c.map((n, i) =>
    `<div><i style="height:${Math.round((n / max) * 22)}px"></i><span>${i === 6 ? '7+' : i + 1}</span></div>`).join('')}</div>`;
}

// Small 3 · Medium 2 · Big 1 · Spells 2 · Tricks 1 · Relics 0
function kindsHTML(pool) {
  const k = kindCounts(pool);
  return `<span class="dr-kinds">${KINDS.map((x) => `<span${k[x] ? '' : ' class="zero"'}>${KIND_INFO[x].short} <b>${k[x]}</b></span>`).join('')}</span>`;
}

function factionsHTML(pool) {
  const fs = factionCounts(pool);
  return fs.length ? fs.map(([f, n]) => `<span class="dr-fc">${factionCoin(f)}<b>${n}</b></span>`).join('') : '';
}

function kwHTML(card) {
  const list = Object.values(KEYWORDS).filter((k) => new RegExp('\\b' + k.name + '\\b', 'i').test(card.text || ''));
  return list.length ? `<div class="kw-help">${list.map((k) => `<div><b>${k.name}</b> — ${esc(k.text)}</div>`).join('')}</div>` : '';
}

// ── the screen ──────────────────────────────────────────────────────
const cur = () => (V ? (V.kind === 'online' ? R : P) : null);

function openScreen(kind) {
  if (!V) {
    const el = document.createElement('div');
    el.id = 'draft';
    el.className = 'dr';
    el.innerHTML = '<header class="dr-head"></header><div class="dr-main"></div><footer class="dr-foot"></footer><div class="dr-layer"></div>';
    document.body.appendChild(el);
    el.addEventListener('click', onClick);
    el.addEventListener('pointerdown', onPointerDown);
    const [head, main, foot, layer] = el.children;
    V = { kind, el, els: { head, main, foot, layer }, html: {}, mainKey: '', zoom: null, sheet: null, logLen: null };
    document.body.classList.add('in-draft');
    keepAwake('draft', true);
  }
  if (V.kind !== kind) Object.assign(V, { kind, html: {}, mainKey: '', zoom: null, sheet: null, logLen: null });
  render();
}

function closeScreen() {
  if (!V) return;
  V.el.remove();
  V = null;
  document.body.classList.remove('in-draft');
  keepAwake('draft', false);
}

// Back to the Play page (the draft carries on; the Play page can reopen it).
function backToPlay() {
  if (V?.kind === 'practice' && P?.campaign) { clearTimeout(P.timer); toast('Your draft is saved: carry on with it from World 6.'); closeScreen(); P.back?.(); return; }
  if (V?.kind === 'online' && R) R.dismissed = true;
  if (V?.kind === 'practice') { clearTimeout(P?.timer); toast('Your draft is saved: resume it from Play.'); }
  closeScreen();
  if (location.hash !== '#/play') location.hash = '#/play';
  else refreshPlay?.();
}

// Each part of the screen is only rebuilt when its markup changes, so the
// table keeps its scroll position while other players pick.
function setRegion(name, html) {
  if (V.html[name] === html) return false;
  V.html[name] = html;
  V.els[name].innerHTML = html;
  return true;
}

function render() {
  if (!V) return;
  const d = cur();
  if (!d || !d.st || stale(d)) {
    const back = `<div class="dr-top"><button class="dr-back" data-act="draft-close">‹ ${V.kind === 'online' ? 'Lobby' : P?.campaign ? 'Campaign' : 'Play'}</button><span class="dr-kicker">Draft night</span><span></span></div>`;
    setRegion('head', back);
    setRegion('main', d?.st ? `<div class="dr-wait"><h3>Update needed</h3><p class="dr-stale">${STALE}</p><button class="btn primary" data-act="draft-reload">Reload this page</button></div>`
      : '<div class="dr-wait"><h3>Dealing the cards<span class="dr-dots"><i></i><i></i><i></i></span></h3></div>');
    setRegion('foot', '');
    setRegion('layer', '');
    V.mainKey = '';
    return;
  }
  const st = d.st;
  // cards that just left the table fly to whoever took them
  const fresh = V.logLen != null && st.log.length > V.logLen ? st.log.slice(V.logLen) : [];
  if (fresh.length && fresh.length <= st.n && !document.hidden) fresh.forEach((e, i) => flyAway(e, d, i * 260));
  V.logLen = st.log.length;
  const done = myDone(d);
  if (V.zoom && (done || (V.zoom.list === 'table' && !onTable(d).includes(V.zoom.cid)))) V.zoom = null; // that card is gone
  const key = done ? 'end' : `round:${st.round}`;
  setRegion('head', headHTML(d));
  if (setRegion('main', done ? endHTML(d) : tableHTML(d)) && V.mainKey !== key) V.els.main.scrollTop = 0;
  V.mainKey = key;
  setRegion('foot', done ? endFootHTML(d) : poolBarHTML(d));
  setRegion('layer', layerHTML(d));
}

// A taken card leaves the table: a copy flies to the picker's name (or to
// your deck, for your own picks) and fades.
function flyAway(e, d, delay = 0) {
  const card = V.els.main.querySelector(`.dr-slot[data-cid="${e.cid}"] .card`);
  if (!card) return;
  const to = e.p === d.me ? V.els.foot.querySelector('.dr-pool') : V.els.head.querySelector(`.dr-seat[data-p="${e.p}"]`);
  const a = card.getBoundingClientRect();
  if (!a.width) return;
  const b = to ? to.getBoundingClientRect() : { left: a.left, top: -a.height, width: a.width, height: 0 };
  const ghost = card.cloneNode(true);
  ghost.classList.add('dr-ghost');
  Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px` });
  ghost.style.setProperty('--cw', `${a.width}px`);
  V.el.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = ghost.animate([
    { transform: 'none', opacity: 1 },
    { transform: `translate(${dx * 0.12}px, ${dy * 0.12 - 16}px) scale(1.06)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${dx}px, ${dy}px) scale(.16)`, opacity: 0.15 },
  ], { duration: 620, delay, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'backwards' });
  anim.onfinish = anim.oncancel = () => ghost.remove();
}

function headHTML(d) {
  const st = d.st;
  const top = `<div class="dr-top">
      <button class="dr-back" data-act="draft-close">‹ ${d.kind === 'online' ? 'Lobby' : d.campaign ? 'Campaign' : 'Play'}</button>
      <span class="dr-kicker">${d.campaign ? 'A deck for the Eclipse' : 'Draft night'}</span>
      ${myDone(d) ? '<span></span>' : `<button class="g-icon g-bulb dr-bulb${adviceOpen(d) ? ' on' : ''}" data-act="draft-advice" aria-label="Advice for this round">💡</button>`}
    </div>`;
  if (myDone(d)) return `${top}<div class="dr-title">Your deck</div>`;
  const kind = kindInfo(st.kind, st.ultra);
  const took = new Set(roundPicks(st).map((e) => e.p));
  if (sending(d)) took.add(d.me);
  const strip = st.order.map((p) => {
    const cls = took.has(p) ? ' done' : p === st.who && !sending(d) ? ' now' : '';
    return `<span class="dr-seat${cls}${p === d.me ? ' me' : ''}" data-p="${p}">${esc(who(d, p))}${took.has(p) ? ' ✓' : ''}</span>`;
  }).join('<i class="dr-arrow" aria-hidden="true">→</i>');
  const status = sending(d) ? 'Sending your pick…' : myTurn(d) ? 'Your pick!' : `${esc(who(d, st.who))} is picking…`;
  return `${top}
    <div class="dr-title">Round ${st.round + 1} of ${PICKS} · ${esc(kind.name)}</div>
    <div class="dr-sub">${esc(kind.line)}</div>
    <div class="dr-turns" aria-label="Picking order this round">${strip}</div>
    <div class="dr-status${canPickNow(d) ? ' mine' : ''}" role="status">${status}</div>`;
}

function newsHTML(d) {
  if (sending(d)) return `You took <b>${nameOf(d.sent.cid)}</b>.`;
  const e = d.st.log[d.st.log.length - 1];
  if (!e) return 'Everyone takes one card, in turn. Tap a card to see it big.';
  const card = `<b>${nameOf(e.cid)}</b>`;
  if (e.auto) return e.p === d.me ? `The last card is yours: ${card}.` : `The last card went to ${esc(who(d, e.p))}: ${card}.`;
  return `${esc(who(d, e.p))} took ${card}.`;
}

// 💡 Advice for the round, a tap away in the top right corner (as in a game):
// what this kind of card is for and how to tell a good one, what your deck
// could use, and what is on the table. Never which card to take. It stays open
// for the round; a tap on it (or on 💡 again) puts it away.
const adviceOpen = (d) => !!V && V.advice === d.st?.round && !myDone(d);

function adviceHTML(d) {
  if (!adviceOpen(d)) return '';
  const { kind, lines } = adviceFor(d.st, d.me);
  return `<div class="suggest dr-advice" data-act="draft-advice" role="button" aria-label="Put the advice away"><span class="suggest-t">`
    + `<span class="suggest-h">💡 ${esc(kindInfo(kind, d.st.ultra).name)}</span>${lines.map((l) => `<span class="dr-adv">${esc(l)}</span>`).join('')}</span></div>`;
}

function tableHTML(d) {
  const st = d.st;
  const picking = canPickNow(d);
  const taken = new Map(roundPicks(st).map((e) => [e.cid, e.p]));
  if (sending(d)) taken.set(d.sent.cid, d.me);
  const slots = st.dealt.map((cid, i) => (taken.has(cid)
    ? `<div class="dr-slot taken" data-cid="${esc(cid)}"><div class="dr-gone"><b>${esc(who(d, taken.get(cid)))}</b> took<span>${nameOf(cid)}</span></div></div>`
    : `<div class="dr-slot" style="--i:${i}" data-act="draft-look" data-cid="${esc(cid)}" role="button" tabindex="0" aria-label="${nameOf(cid)}">${cardHTML(BY_ID[cid])}</div>`)).join('');
  // the host can pick for a phone that went to sleep (the bot chooses)
  const away = d.kind === 'online' && d.info?.host === Net.clientId() && !st.done && st.who !== d.me && !stale(d)
    ? `<div class="dr-pickfor"><span>${esc(who(d, st.who))}’s phone asleep?</span><button class="btn small ghost" data-act="draft-pickfor">${d.armed === st.log.length ? `Tap again: pick for ${esc(who(d, st.who))}` : `Pick for ${esc(who(d, st.who))}`}</button></div>` : '';
  const others = d.names.map((_, p) => p).filter((p) => p !== d.me).map((p) => {
    const last = lastPicks(st, p, 3).map((e) => nameOf(e.cid));
    return `<div class="dr-other"><b>${esc(who(d, p))}</b><span>${plural(st.pools[p].length, 'card')}</span><em>${last.length ? last.join(' · ') : 'no picks yet'}</em></div>`;
  }).join('');
  return `${adviceHTML(d)}<div class="dr-news">${newsHTML(d)}</div>
    <div class="dr-grid">${slots}</div>
    ${away}
    <div class="dr-others">${others}</div>`;
}

function poolBarHTML(d) {
  const pool = mine(d);
  return `<button class="dr-pool" data-act="draft-pool" aria-label="Your deck so far: ${pool.length} cards">
      <span class="dr-pool-n"><b>${pool.length}</b><small>of ${PICKS}</small></span>
      ${kindsHTML(pool)}
      ${curveHTML(pool)}
    </button>`;
}

function handoffHTML(d) {
  if (d.kind === 'practice') return d.st.done ? '<b>Draft complete!</b> Tap Play to take your deck against the bots.' : 'The bots are making their last picks…';
  if (!d.st.done) return `<b>Your 30 picks are in.</b> Waiting for ${esc(who(d, d.st.who))} to make the last pick…`;
  const info = d.info;
  const host = info.host === Net.clientId();
  const ready = info.draft?.ready || {};
  const meReady = !!ready[Net.clientId()];
  const chips = d.order.map((id, p) => (id === info.host ? ''
    : `<span class="dr-who${ready[id] ? ' ok' : ''}"><span class="dr-dot"></span>${esc(who(d, p))}<i>${ready[id] ? 'ready' : 'looking'}</i></span>`)).join('');
  return `<b>Draft complete!</b> ${host ? 'Host: tap Start game when everyone is ready.' : `${meReady ? 'You are ready.' : 'Tap Ready.'} ${esc(hostName(info))} (the host) starts the game.`}
    ${chips ? `<div class="dr-whos">${chips}</div>` : ''}`;
}

function endHTML(d) {
  const pool = mine(d);
  const groups = [];
  for (const c of byCost(pool)) (groups[Math.min(7, c.cost)] ||= []).push(c);
  return `<div class="dr-end">
      <div class="dr-handoff">${handoffHTML(d)}</div>
      ${Ins.draftLineHTML(d.reviewed)}
      <div class="dr-sum">
        <div class="dr-sum-l"><div class="dr-fcs">${factionsHTML(pool)}</div>${kindsHTML(pool)}</div>
        ${curveHTML(pool)}
      </div>
      ${groups.map((g, k) => (g ? `<div class="group-label">${k === 7 ? '7+' : k} Energy · ${g.length}</div>
        <div class="rows">${g.map((c) => cardRowHTML(c, 1, { controls: false }).replace('class="row"', 'class="row" data-act="draft-look-deck"')).join('')}</div>` : '')).join('')}
    </div>`;
}

function endFootHTML(d) {
  if (d.kind === 'practice') {
    return `<button class="btn primary dr-go" data-act="draft-play" ${d.st.done ? '' : 'disabled'}>${!d.st.done ? 'Waiting for the bots…' : d.campaign ? 'Take it to the Eclipse' : 'Play'}</button>`;
  }
  const info = d.info;
  if (info.host === Net.clientId()) {
    const full = (info.players || []).length === info.seats;
    const odd = Net.otherVersions(info).length > 0;
    const ok = d.st.done && full && info.status === 'lobby' && !odd;
    const label = ok ? `Start game ${(info.round || 0) + 1}` : !d.st.done ? 'Waiting for the last pick…' : odd ? 'Reload every phone first' : 'Waiting for everyone to be back in the game';
    return `<button class="btn primary dr-go" data-act="draft-start-game" ${ok ? '' : 'disabled'}>${label}</button>`;
  }
  const ready = !!info.draft?.ready?.[Net.clientId()];
  return `<button class="btn primary dr-go" data-act="draft-ready" ${ready || !d.st.done ? 'disabled' : ''}>${ready ? `Ready ✓ · ${esc(hostName(info))} starts the game` : 'Ready'}</button>`;
}

// The cards big: the ones on the table (with Take it on your turn) or your
// deck so far, side by side like your hand big in a game, the one you tapped
// in the middle. Swipe sideways to look along them (they glide on after a
// flick), up or down to put them away (FX.swipeTrack); Take it sits low, where
// the thumb is. They show the baked pictures, not the live drawing the gallery
// zoom uses: that takes 0.3-3 s per card on a phone, too slow for looking
// through cards.
const zoomList = (d, list) => (list === 'table' ? onTable(d) : byCost(mine(d)).map((c) => c.id));
const zoomIndex = (d) => zoomList(d, V.zoom.list).indexOf(V.zoom.cid);
const layerHTML = (d) => (V.sheet ? poolSheetHTML(d) : '') + (V.zoom ? zoomHTML(d) : '');

function zoomHTML(d) {
  const z = V.zoom;
  const list = zoomList(d, z.list);
  const i = list.indexOf(z.cid);
  if (i < 0) return '';
  const st = d.st;
  const table = z.list === 'table';
  const picking = table && canPickNow(d);
  const cards = list.map((cid, k) => {
    const dk = k - i, ak = Math.min(Math.abs(dk), 3);
    return `<div class="hv-card${dk ? '' : ' on'}${ak >= 3 ? ' far' : ''}" data-hv-i="${k}" style="--kk:${dk};--akk:${ak};--z:${10 - ak}">${cardHTML(BY_ID[cid])}</div>`;
  }).join('');
  // dots for the few cards on the table, a count for a long deck
  const where = list.length < 2 ? '' : list.length <= 12
    ? `<div class="hv-dots">${list.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('')}</div>`
    : `<div class="hv-count">${i + 1} / ${list.length}</div>`;
  const main = picking ? `<button class="btn primary" data-act="draft-pick" data-cid="${esc(z.cid)}">Take it</button>`
    : table ? `<button class="btn" disabled>${sending(d) ? 'Sending your pick…' : `${esc(who(d, st.who))} is picking…`}</button>` : '';
  return `<div class="dr-zoom"><div class="hv">
      <div class="hv-info">${kwHTML(BY_ID[z.cid])}</div>
      <div class="hv-track">${cards}</div>${where}
      ${main ? `<div class="hv-btns">${main}</div>` : ''}
      <div class="hv-grab" data-act="draft-unlook" role="button" aria-label="Close"><i></i><span>Swipe up to close</span></div></div></div>`;
}

function poolSheetHTML(d) {
  const pool = mine(d);
  const cards = byCost(pool);
  return `<div class="dr-sheet">
      <div class="dr-sheet-in">
        <div class="dr-zoom-top"><span>Your deck so far · ${pool.length} of ${PICKS}</span></div>
        <div class="dr-sum">
          <div class="dr-sum-l"><div class="dr-fcs">${factionsHTML(pool)}</div>${kindsHTML(pool)}</div>
          ${curveHTML(pool)}
        </div>
        ${cards.length ? `<div class="rows">${cards.map((c) => cardRowHTML(c, 1, { controls: false })
          .replace('class="row"', 'class="row" data-act="draft-look-deck"')).join('')}</div>`
          : '<p class="muted small">Nothing yet: your picks gather here, cheapest first.</p>'}
      </div>
      <div class="g-grab" data-act="draft-sheet-close" role="button" aria-label="Close"><i></i><span>Swipe up to close</span></div>
    </div>`;
}

// ── input ───────────────────────────────────────────────────────────
function onClick(e) {
  if (!V) return;
  const t = e.target;
  const el = t.closest('[data-act]');
  if (!el) {
    // the big cards: tap one at the side to bring it to the middle, or the space around them to put them away
    if (V.zoom && t.closest('.dr-zoom')) {
      const card = t.closest('.hv-card');
      if (card) { if (!card.classList.contains('on')) goZoom(Number(card.dataset.hvI)); }
      else if (t.classList.contains('hv') || t.classList.contains('dr-zoom')) closeZoom('down');
      return;
    }
    // a tap beside the deck list closes it
    if (V.sheet && t.closest('.dr-sheet') && !t.closest('.dr-sheet-in')) { V.sheet = null; render(); }
    return;
  }
  const d = cur();
  switch (el.dataset.act) {
    case 'draft-look': V.zoom = { list: 'table', cid: el.dataset.cid }; render(); break;
    case 'draft-look-deck': V.zoom = { list: 'pool', cid: el.dataset.id }; render(); break;
    case 'draft-unlook': closeZoom('up'); break;
    case 'draft-pick': pick(el.dataset.cid); break;
    case 'draft-pool': V.sheet = 'pool'; render(); break;
    case 'draft-sheet-close': V.sheet = null; V.zoom = null; render(); break;
    case 'draft-advice': V.advice = d && adviceOpen(d) ? null : d?.st?.round ?? null; render(); break;
    case 'draft-pickfor': pickFor(d); break;
    case 'draft-close': backToPlay(); break;
    case 'draft-play': playPractice(); break;
    case 'draft-start-game': startOnlineGame(el); break;
    case 'draft-ready': if (R) { el.disabled = true; Net.setDraftReady(R.code).catch(fail); } break;
    case 'draft-reload': location.reload(); break;
    case 'draft-review': if (d?.reviewed) Ins.openSheet(Ins.draftReviewHTML(d.reviewed)); break;
  }
}

// A finished draft goes into Insights: each of your picks against the bot's
// ratings (stats.js), saved on this phone with the deck it made, so the
// games that deck plays can be counted with it.
function noteDraft(d) {
  if (!d?.st?.done || d.me < 0 || d.reviewed) return;
  const id = d.kind === 'online' ? `od:${d.code}:${d.id}` : `pd:${d.seed}`;
  const old = St.findDraft(id);
  if (old) { d.reviewed = old; return; }
  try {
    const review = St.reviewDraft({ seed: d.seed, n: d.n, ultra: !!d.ultra }, d.picks, d.me);
    d.reviewed = { id, at: Date.now(), mode: d.kind, n: d.n, ...(d.ultra ? { ultra: true } : {}), deck: Decks.encode(deckCounts(review.pool)), review: { score: review.score, counts: review.counts, picks: review.picks } };
    St.saveDraft(d.reviewed);
  } catch (e) { console.error(e); }
}

// The cards came to rest on card i. They are already in place, so the rest of
// the view (the rules, the dots, Take it) is refreshed around them instead of
// redrawn (a redraw would rebuild every picture).
function zoomSettled(i) {
  const d = cur();
  if (!V?.zoom || !d?.st) return;
  const list = zoomList(d, V.zoom.list);
  if (!list[i]) return;
  V.zoom.cid = list[i];
  const html = layerHTML(d);
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const live = V.els.layer.querySelector('.dr-zoom .hv'), fresh = tpl.content.querySelector('.dr-zoom .hv');
  const rest = (hv) => [...hv.children].filter((c) => !c.classList.contains('hv-track'));
  const was = live && rest(live), now = fresh && rest(fresh);
  const lc = live?.querySelectorAll('.hv-card'), fc = fresh?.querySelectorAll('.hv-card');
  if (!was || !now || was.length !== now.length || lc.length !== fc.length) { render(); return; }
  was.forEach((c, k) => c.replaceWith(now[k]));
  lc.forEach((c, k) => { c.className = fc[k].className; c.setAttribute('style', fc[k].getAttribute('style')); });
  V.html.layer = html;
}

// Bring card i to the middle (a tap on it at the side, or the arrow keys): the cards glide there.
function goZoom(i) {
  const d = cur();
  const hv = V?.els.layer.querySelector('.dr-zoom .hv'), track = hv?.querySelector('.hv-track');
  if (!track || !V.zoom || !d?.st) return;
  const n = zoomList(d, V.zoom.list).length;
  FX.moveTrack(track, hv, Math.max(0, Math.min(n - 1, i)), 0, zoomSettled);
}
const moveZoom = (step) => { const d = cur(); if (V?.zoom && d?.st) goZoom(zoomIndex(d) + step); };

// Put the big cards away, flying off the way they were swiped.
function closeZoom(dir = 'up') {
  const hv = V?.els.layer.querySelector('.dr-zoom .hv');
  const done = () => { if (V?.zoom) { V.zoom = null; render(); } };
  if (!hv) { done(); return; }
  hv.classList.add(`out-${dir}`);
  setTimeout(done, 240);
}

// Swipes: the big cards (FX.swipeTrack, as with your hand big in a game:
// sideways to look along them, up or down to put them away) and the deck
// list's handle (up to close it).
function onPointerDown(e) {
  if (!V) return;
  const grab = e.target.closest?.('.dr-sheet .g-grab');
  if (grab && V.sheet && !V.zoom) { FX.grabSwipe(e, grab, () => { if (V) { V.sheet = null; render(); } }); return; }
  const zone = e.target.closest?.('.dr-zoom .hv-track, .dr-zoom .hv-grab');
  const d = cur();
  if (!zone || !V.zoom || !d?.st) return;
  const hv = zone.closest('.hv'), track = hv.querySelector('.hv-track');
  FX.swipeTrack(e, { track, zone, host: hv, index: zoomIndex(d), onSettle: zoomSettled, onClose: closeZoom });
}

if (typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (!V) return;
    if (e.key === 'Escape' && (V.zoom || V.sheet)) { if (V.zoom) closeZoom('down'); else { V.sheet = null; render(); } }
    if (V.zoom && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) moveZoom(e.key === 'ArrowLeft' ? -1 : 1);
    if (!V.zoom && (e.key === 'Enter' || e.key === ' ') && e.target?.dataset?.act === 'draft-look') { e.preventDefault(); e.target.click(); }
  });
}

function pick(cid) {
  const d = cur();
  if (!d?.st || !canPickNow(d)) return;
  if (!d.st.table.includes(cid)) { V.zoom = null; render(); toast('That card is not on the table any more.'); return; }
  const k = d.st.round;
  V.zoom = null;
  if (d.kind === 'practice') { addPracticePick({ p: d.me, k, cid }); return; }
  flyAway({ p: d.me, cid }, d);
  d.sent = { k, cid };
  render();
  Net.sendPick(d.code, d.id, { p: d.me, k, cid }).then(() => {
    // stored, but the replay did not take it (someone picked for me first): carry on from the replay
    setTimeout(() => {
      if (R !== d || d.sent?.k !== k || !d.st || d.st.round !== k || d.st.who !== d.me) return;
      d.sent = null;
      render();
      toast('That pick did not count. Please pick again.');
    }, 2500);
  }, (e) => {
    if (R === d && d.sent?.k === k) d.sent = null;
    render();
    toast(`Pick not sent: ${e.message}`);
  });
}

// Host only: pick for the seat that is up (its phone is asleep), with the bot's choice.
function pickFor(d) {
  if (!d?.st || d.kind !== 'online' || d.st.done || d.st.who === d.me || d.info?.host !== Net.clientId() || stale(d)) return;
  const st = d.st;
  if (d.armed !== st.log.length) { d.armed = st.log.length; render(); return; } // tap twice: it is someone else's card
  d.armed = null;
  const cid = botChoice(st);
  if (!cid) return;
  render();
  Net.sendPick(d.code, d.id, { p: st.who, k: st.round, cid }).catch(fail);
}

// ── practice against bots ───────────────────────────────────────────
function loadPractice(box = store) {
  const s = box.get();
  if (!s || ![2, 3].includes(s.n) || !Number.isInteger(s.seed) || !Array.isArray(s.picks)) return null;
  try { replay(s, s.picks); return s; } catch { return null; }
}

function practiceFrom(saved, ctx) {
  const bots = Array.from({ length: saved.n - 1 }, (_, i) => i + 1);
  const d = {
    kind: 'practice', seed: saved.seed, n: saved.n, ultra: !!saved.ultra, picks: [...saved.picks], me: 0,
    names: ['You', ...bots.map((p) => `Bot ${p}`)], bots, play: ctx.play, timer: null,
    ...(saved.campaign ? { campaign: true, back: ctx.back } : {}),
  };
  d.st = replay(d, d.picks);
  noteDraft(d);
  return d;
}

function savePractice() {
  if (P) boxOf(P).set({ seed: P.seed, n: P.n, ultra: !!P.ultra, picks: P.picks, at: Date.now(), ...(P.campaign ? { campaign: true } : {}) });
}

function startPracticeDraft(bots, ctx) {
  P = practiceFrom({ seed: newSeed(), n: bots + 1, ultra: Mode.ultra(), picks: [] }, ctx);
  savePractice();
  openScreen('practice');
  botsTick();
}

function resumePracticeDraft(ctx) {
  const s = loadPractice();
  if (!s) { store.clear(); toast('That draft could not be found.'); ctx.refresh?.(); return; }
  P = practiceFrom(s, ctx);
  openScreen('practice');
  botsTick();
}

// A bot whose turn it is picks after a moment, so you can see what it took.
function botsTick() {
  if (!P) return;
  clearTimeout(P.timer);
  if (P.st.done || V?.kind !== 'practice' || !P.bots.includes(P.st.who)) return;
  const d = P, turn = d.st.log.length;
  P.timer = setTimeout(() => {
    if (P !== d || d.st.done || d.st.log.length !== turn || !d.bots.includes(d.st.who)) return;
    const cid = botChoice(d.st);
    if (cid) addPracticePick({ p: d.st.who, k: d.st.round, cid });
  }, BOT_MS + Math.random() * 200);
}

function addPracticePick(x) {
  P.picks.push(x);
  P.st = replay(P, P.picks);
  noteDraft(P);
  savePractice();
  if (V?.kind === 'practice') render();
  botsTick();
}

function playPractice() {
  if (!P?.st.done) return;
  const st = P.st;
  const you = { id: 'draft-you', name: 'Your draft', counts: deckCounts(st.pools[0]) };
  const bots = P.bots.map((p) => ({ id: `draft-bot-${p}`, name: `${deckName(st.pools[p])} draft`, counts: deckCounts(st.pools[p]) }));
  const bad = (P.campaign ? [you] : [you, ...bots]).map((d) => Decks.validateDrafted(d.counts)).find((v) => !v.ok);
  if (bad) { toast(bad.errors[0]); return; }
  const play = P.play, ultra = !!P.ultra;
  clearTimeout(P.timer);
  boxOf(P).clear();
  P = null;
  closeScreen();
  play(you, bots, { ultra }); // (the game plays by the rules the draft was dealt with)
}

// ── online: the room's draft ────────────────────────────────────────
// Called with every lobby update of the room this phone is in (null when the
// room is gone). Starts and stops watching the picks, opens the screen when
// a draft starts (or this phone comes back mid-draft) and closes it when the
// game begins.
export function onRoomInfo(code, info, refresh) {
  if (refresh) refreshPlay = refresh;
  const d = info?.draft;
  if (R && (R.code !== code || !d?.id || d.id !== R.id)) stopRoom();
  if (!d?.id) { if (V?.kind === 'online') closeScreen(); return; }
  if (!R) watchDraft(code, d);
  R.info = info;
  R.me = d.order.indexOf(Net.clientId());
  R.names = d.order.map((id, p) => (info.players || []).find((x) => x && x.id === id)?.name || `Player ${p + 1}`);
  if (R.me < 0 || info.status !== 'lobby') { if (V?.kind === 'online') closeScreen(); return; }
  if (R.st) { noteDraft(R); ensureDeck(); maybeOpen(); }
  if (V?.kind === 'online') render();
}

function watchDraft(code, draft) {
  const d = {
    kind: 'online', code, id: draft.id, seed: draft.seed, n: draft.order.length, ultra: !!draft.ultra, order: draft.order,
    info: null, picks: [], st: null, me: -1, names: [], sent: null, armed: null, dismissed: false, unsub: null, deckBusy: false,
  };
  R = d;
  Net.watchPicks(code, draft.id, (picks) => {
    if (R !== d) return;
    const first = !d.st, wasDone = d.st?.done;
    d.picks = picks;
    try { d.st = replay(d, picks); } catch (e) { console.error(e); return; }
    noteDraft(d);
    if (d.sent && (d.st.done || d.st.round > d.sent.k || d.st.who !== d.me)) d.sent = null;
    ensureDeck();
    if (first) maybeOpen();
    if (V?.kind === 'online') render();
    // the lobby shows everyone's progress, and the hand-off when it is done
    if (V?.kind !== 'online' || first || wasDone !== d.st.done) refreshPlay?.();
  }).then((unsub) => { if (R === d) d.unsub = unsub; else unsub(); }, fail);
}

function stopRoom() {
  if (!R) return;
  R.unsub?.();
  R = null;
}

export function leaveRoom() {
  stopRoom();
  if (V?.kind === 'online') closeScreen();
}

// Mid-draft and not sent back to the lobby by the player: show the draft.
function maybeOpen() {
  if (!R?.st || R.dismissed || R.me < 0 || R.info?.status !== 'lobby' || myDone(R)) return;
  if (V?.kind !== 'online') openScreen('online');
}

// My 30 picks are my deck: put it in the room as my deck for the games.
function ensureDeck() {
  const d = R;
  if (!d?.st || d.me < 0 || d.deckBusy || d.info?.status !== 'lobby' || !myDone(d) || stale(d)) return;
  const code = Decks.encode(deckCounts(mine(d)));
  const me = (d.info.players || []).find((p) => p && p.id === Net.clientId());
  if (!me || me.deck === code) return;
  d.deckBusy = true;
  Net.setDeck(d.code, code).catch((e) => toast(`Deck not saved: ${e.message}`)).finally(() => { d.deckBusy = false; });
}

// The host's Start game in a draft room: every deck must be the drafted one.
export async function beforeStart(code, info) {
  const draft = info?.draft;
  if (!draft?.id) return;
  if (!R || R.code !== code || R.id !== draft.id || !R.st) throw new Error('The draft is still loading. Try again in a moment.');
  if (stale(R)) throw new Error(STALE);
  if (!R.st.done) throw new Error(`The draft is not finished: ${R.names[R.st.who]} is picking.`);
  const decks = {};
  draft.order.forEach((id, p) => {
    const counts = deckCounts(R.st.pools[p]);
    const v = Decks.validateDrafted(counts);
    if (!v.ok) throw new Error(`${R.names[p]}: ${v.errors[0]}`);
    decks[id] = Decks.encode(counts);
  });
  await Net.setDraftDecks(code, decks);
}

async function startOnlineGame(btn) {
  if (!R?.info) return;
  btn.disabled = true;
  try {
    await beforeStart(R.code, R.info);
    await Net.startGame(R.code); // the table takes over when the room says "playing"
  } catch (e) { fail(e); btn.disabled = false; }
}

// ── the Play page ───────────────────────────────────────────────────
export function onPlayAct(act, el, ctx = {}) {
  if (ctx.refresh) refreshPlay = ctx.refresh;
  switch (act) {
    case 'draft-practice': startPracticeDraft(Number(el.dataset.n) === 2 ? 2 : 1, ctx); break;
    case 'draft-resume': resumePracticeDraft(ctx); break;
    case 'draft-forget': store.clear(); ctx.refresh?.(); break;
    case 'draft-reload': location.reload(); break;
    case 'draft-open': if (R && R.me >= 0) { R.dismissed = false; openScreen('online'); } break;
    case 'draft-mode': if (ctx.code) Net.setDraftMode(ctx.code, !!el.checked).catch(fail); break;
    case 'draft-start': if (ctx.code) { el.disabled = true; Net.startDraft(ctx.code, { pool: poolKey(!!ctx.ultra), ultra: !!ctx.ultra }).catch((e) => { el.disabled = false; fail(e); }); } break;
    case 'draft-again':
      if (el.dataset.confirm !== '1') { el.dataset.confirm = '1'; el.textContent = 'Tap again: a new draft for everyone'; break; }
      if (ctx.code) Net.startDraft(ctx.code, { again: true, pool: poolKey(!!ctx.ultra), ultra: !!ctx.ultra }).catch(fail);
      break;
  }
}

// The campaign's finale (campaign-ui.js): a deck drafted against one bot, from
// the Ultra cards, kept apart from the Play page's draft. The one under way
// carries on, else a new one. ctx.play(you) takes the finished deck;
// ctx.back() is the way out, the draft kept.
export function campaignDraft(ctx) {
  const s = loadPractice(campStore);
  P = practiceFrom(s || { seed: newSeed(), n: 2, ultra: true, picks: [], campaign: true }, ctx);
  if (!s) savePractice();
  openScreen('practice');
  botsTick();
}
export function savedCampaignDraft() {
  const s = loadPractice(campStore);
  if (!s) return null;
  const picks = replay(s, s.picks).pools[0].length;
  return { picks, of: PICKS, done: picks >= PICKS };
}

// A practice draft against bots to come back to: how far it got, or null.
export function savedPractice() {
  const s = loadPractice();
  if (!s) return null;
  const picks = replay(s, s.picks).pools[0].length;
  return { picks, of: PICKS, done: picks >= PICKS };
}

// Phones replay each other's moves and picks, so they must all run the same
// version of the game (Net.version). A phone that doesn't is named in the
// lobby until it reloads, and the host can't start until every phone matches.
export function versionNoteHTML(info) {
  const odd = Net.otherVersions(info).filter((p) => p.id !== Net.clientId()); // this phone's own seat catches up by itself
  if (!odd.length) return '';
  return `<p class="pp-stale">${listNames(odd.map((p) => `${esc(p.name)}’s`))} ${odd.length > 1 ? 'phones have' : 'phone has'} a different version of the game. Reload the page on every phone.</p>`;
}

// The "Draft night" switch: in the new-game form (read when the game is
// created) and, for the host, in the lobby until the draft starts.
export function createSwitchHTML(on = false) {
  return `<label class="dr-switch"><input type="checkbox" id="draft-new"${on ? ' checked' : ''}><span class="dr-knob" aria-hidden="true"></span>
      <span class="dr-switch-text"><b>Draft night</b></span></label>`;
}

export function modeSwitchHTML(on) {
  return `<label class="dr-switch"><input type="checkbox" data-act="draft-mode"${on ? ' checked' : ''}><span class="dr-knob" aria-hidden="true"></span>
      <span class="dr-switch-text"><b>Draft night</b></span></label>`;
}

// The lobby of a draft room: seats with draft progress, then the next step.
// `rules`: the room's rules (the SATTC Ultra switch, or a note), shown with the draft's own switch.
export function roomPanelHTML(code, info, tonight = '', rules = '') {
  const me = Net.clientId();
  const players = info.players || [];
  const meSeat = players.findIndex((p) => p && p.id === me);
  const host = info.host === me;
  const draft = info.draft || {};
  const started = !!draft.id;
  const order = draft.order || [];
  const ready = draft.ready || {};
  const st = R && R.code === code && R.id === draft.id ? R.st : null;
  const full = players.length === info.seats;
  const inDraft = order.includes(me);
  const link = `${location.origin}${location.pathname}?room=${code}`;
  const odd = Net.otherVersions(info).length > 0; // a phone on another version: no starting until it reloads
  const seats = Array.from({ length: info.seats }, (_, i) => {
    const p = players[i];
    if (!p) return '<div class="deck-card"><span class="fac-slot-empty"></span><div class="muted">Waiting for a player…</div><span></span></div>';
    const ds = order.indexOf(p.id);
    const pool = st && ds >= 0 ? st.pools[ds] : null;
    let meta = 'Ready to draft', coins = '';
    if (started) {
      if (ds < 0) meta = 'Not in this draft';
      else if (!pool) meta = 'Drafting…';
      else if (pool.length >= PICKS) {
        meta = ready[p.id] ? 'Deck drafted · ready' : 'Deck drafted';
        coins = factionCounts(pool).slice(0, 3).map(([f]) => factionCoin(f)).join('');
      } else meta = `Drafting · ${pool.length} of ${PICKS} cards${!st.done && st.who === ds ? ' · picking now' : ''}`;
    }
    return `<div class="deck-card${i === meSeat ? ' active' : ''}"><div class="deck-coins">${coins || '<span class="fac-slot-empty"></span>'}</div>
      <div><div class="deck-name">${esc(p.name)}${i === meSeat ? ' (you)' : ''}</div><div class="deck-meta">${p.id === info.host ? 'Host · ' : ''}${meta}</div></div><span></span></div>`;
  }).join('');

  let next;
  if (started && draft.pool && draft.pool !== poolKey(!!draft.ultra)) {
    next = `<p class="dr-stale">${STALE}</p><button class="btn primary" data-act="draft-reload">Reload this page</button>`;
  } else if (info.status === 'playing') next = '<button class="btn primary" data-act="rejoin-table">Back to the table</button>';
  else if (!started) {
    // how it works is a tap away, for whoever hasn't drafted before
    next = `<details class="dr-how"><summary>How the draft works</summary><p class="muted small">${explain(info.seats, !!info.ultra)}</p></details>${host
      ? `${modeSwitchHTML(true)}${rules}${odd ? '<button class="btn primary" disabled>Reload every phone first</button>' : `<button class="btn primary" data-act="draft-start" ${full ? '' : 'disabled'}>${full ? 'Start the draft' : 'Waiting for everyone to join'}</button>`}`
      : '<p class="muted small" style="margin:0">The host starts the draft when everyone is in.</p>'}`;
  } else if (!st) next = '<p class="muted small" style="margin:0">Loading the draft…</p>';
  else if (!st.done) {
    const up = order[st.who] === me ? 'your pick' : `${esc(R.names[st.who])} is picking`;
    next = `${inDraft ? '<button class="btn primary" data-act="draft-open">Back to the draft</button>' : ''}
      <p class="muted small" style="margin:0">Round ${st.round + 1} of ${PICKS} (${esc(kindInfo(st.kind, st.ultra).name)}): ${up}.</p>`;
  } else {
    next = `<div class="dr-handoff"><b>Draft complete!</b> Host: tap Start game.</div>
      ${host ? (odd ? '<button class="btn primary" disabled>Reload every phone first</button>' : `<button class="btn primary" data-act="start" ${full ? '' : 'disabled'}>${full ? `Start game ${(info.round || 0) + 1}` : 'Waiting for everyone to come back'}</button>`)
        : `<p class="muted small" style="margin:0">${esc(hostName(info))} starts the game.</p>`}
      ${inDraft ? '<button class="btn" data-act="draft-open">See your deck</button>' : ''}
      ${host ? '<button class="btn ghost small" data-act="draft-again">Draft again from scratch</button>' : ''}`;
  }
  return `<div class="pp-title"><h3>Game <b>${esc(code)}</b> · Draft night</h3><button class="btn small" data-act="copy-link" data-link="${esc(link)}">Copy invite link</button></div>
    ${tonight}
    <div class="deck-cards" style="margin-top:12px">${seats}</div>
    ${versionNoteHTML(info)}
    <div class="dr-room">${next}<button class="btn ghost" data-act="leave-room">Leave this game</button></div>`;
}
