// The table: practice games against the bot (online games reuse it).
// Drag a card from your hand onto the table to play it (or tap it, then
// Play). Tap your ready creatures to send them into an attack; when someone
// attacks you, tap a creature of yours and then the attacker it blocks.
// Every move is animated on the old table first (cards flying in, lunges,
// hits, deaths), then the table is redrawn and everything glides into place.

import { BY_ID, KEYWORDS, RULES, STARTERS, isTrick } from './cards.js';
import { abilityNeeds, actor, apply, blockLimit, canAttack, canBlock, costOf, forcedBlocks, hasKw, living, needs, newGame, opponents, phoenixReady, playOptions, power, replay, useOptions, vitality } from './engine.js';
import { chooseAction } from './ai.js';
import { artTag, cardBackHTML, cardHTML, esc, factionCoin, factionVars } from './render.js';
import * as FX from './fx.js';
import * as Decks from './decks.js';
import * as Net from './net.js';
import * as Draft from './draft-ui.js';
import { TUTORIAL, botAction, matches } from './tutorial.js';

const SAVE = 'collective.practice.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch { /* fine without */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* fine */ } },
};
const SPEED_KEY = 'collective.fast';
const fastOn = () => { try { return localStorage.getItem(SPEED_KEY) === '1'; } catch { return false; } };
const SPEEDS = { normal: 1, fast: 1.7 };
FX.setSpeed(fastOn() ? SPEEDS.fast : SPEEDS.normal);

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.5.8-1.2 2.2-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="11" height="15" rx="1.5"/><path d="M9 3h9.5A1.5 1.5 0 0 1 20 4.5V17"/></svg>',
  deck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h6M9 12h6"/></svg>',
  trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7.5l4.6 4 4.4-7 4.4 7 4.6-4-1.9 11H4.9z"/><rect x="4.9" y="19.6" width="14.2" height="2.2" rx=".6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 1.5 4.5 13.6h6.3L9 22.5l10.5-12.9h-6.4z"/></svg>',
};
const COLORS = { ember: '#ff7a2e', verdant: '#b4e06a', tide: '#8fe0ee', umbral: '#b07cff', radiant: '#ffd77a' };
const colorOf = (cid) => COLORS[BY_ID[cid]?.factions[0]] || '#ffd77a';

let G = null; // the game being shown

// For performance checks from the console or a test script.
if (typeof window !== 'undefined') window.collectiveDebug = { redraw: () => redraw(), get G() { return G; } };

// ── play page ───────────────────────────────────────────────────────
function deckChoices() {
  const mine = Decks.loadDecks().filter((d) => Decks.validate(d.counts).ok).map((d) => ({ id: d.id, name: d.name, counts: d.counts }));
  return [...mine, ...STARTERS.map((d) => ({ id: d.id, name: `${d.name} (starter)`, counts: d.counts }))];
}

// ── online lobby ────────────────────────────────────────────────────
let L = null; // { code, info, unsub } while in a room
let playView = null;

function deckSelect(id, choices, chosen) {
  return `<select id="${id}" class="select">${choices.map((d) => `<option value="${esc(d.id)}"${d.id === chosen ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
}

function onlinePanelHTML(choices, chosen) {
  if (!Net.isConfigured()) {
    return `<h3>Play your friends</h3><p class="muted small" style="margin:6px 0 0">Online games, 1v1 or three-way, switch on once the game's database is connected.</p>`;
  }
  if (L && L.info) {
    if (L.info.draft) return Draft.roomPanelHTML(L.code, L.info); // Draft night has its own lobby
    const info = L.info;
    const meSeat = (info.players || []).findIndex((p) => p && p.id === Net.clientId());
    const host = info.host === Net.clientId();
    const seats = Array.from({ length: info.seats }, (_, i) => {
      const p = info.players?.[i];
      if (!p) return `<div class="deck-card"><span class="fac-slot-empty"></span><div class="muted">Waiting for a player…</div><span></span></div>`;
      const counts = Decks.decode(p.deck) || {};
      const fs = [...Decks.factionsOf(counts)];
      return `<div class="deck-card${i === meSeat ? ' active' : ''}"><div class="deck-coins">${fs.map(factionCoin).join('')}</div>
        <div><div class="deck-name">${esc(p.name)}${i === meSeat ? ' (you)' : ''}</div><div class="deck-meta">${p.id === info.host ? 'Host · ' : ''}${Decks.total(counts)} cards</div></div><span></span></div>`;
    }).join('');
    const full = (info.players || []).length === info.seats;
    const link = `${location.origin}${location.pathname}?room=${L.code}`;
    const myDeck = info.players?.[meSeat]?.deck;
    const current = choices.find((d) => Decks.encode(d.counts) === myDeck)?.id || chosen;
    return `<h3>Game ${esc(L.code)}</h3>
      <p class="muted small" style="margin:6px 0 10px">Friends join with the code <b style="color:var(--gold);letter-spacing:.1em">${esc(L.code)}</b>, or this link.</p>
      <div class="btn-row"><button class="btn small" data-act="copy-link" data-link="${esc(link)}">Copy invite link</button></div>
      <div class="deck-cards" style="margin-top:12px">${seats}</div>
      ${host && info.status === 'lobby' ? Draft.modeSwitchHTML(false) : ''}
      <label class="field">Your deck for the next game ${deckSelect('room-deck', choices, current)}</label>
      <div class="btn-col" style="display:grid;gap:8px;margin-top:12px">
        ${host ? `<button class="btn primary" data-act="start" ${full ? '' : 'disabled'}>${full ? `Start game ${(info.round || 0) + 1}` : 'Waiting for everyone to join'}</button>` : `<p class="muted small" style="margin:0">The host starts the game when everyone is in.</p>`}
        ${info.status === 'playing' ? '<button class="btn" data-act="rejoin-table">Back to the table</button>' : ''}
        <button class="btn ghost" data-act="leave-room">Leave this game</button>
      </div>`;
  }
  const code = Net.cleanCode(new URLSearchParams(location.search).get('room')) || '';
  const last = Net.lastRoom();
  return `<h3>Play your friends</h3>
    <label class="field">Your name <input id="my-name" class="name-input" style="font-size:18px;min-height:44px" maxlength="16" value="${esc(Net.myName())}" placeholder="Name" autocomplete="off"></label>
    <label class="field">Your deck ${deckSelect('net-deck', choices, chosen)}</label>
    ${Draft.createSwitchHTML()}
    <div class="btn-row" style="margin-top:12px">
      <button class="btn primary" style="flex:1" data-act="create" data-seats="3">New three-way game</button>
      <button class="btn" style="flex:1" data-act="create" data-seats="2">New 1v1 game</button>
    </div>
    <div class="btn-row" style="margin-top:12px">
      <input id="join-code" class="name-input" style="flex:1;min-width:0;font-size:20px;letter-spacing:.2em;text-transform:uppercase" maxlength="4" placeholder="CODE" value="${esc(code)}" autocomplete="off" autocapitalize="characters">
      <button class="btn" data-act="join">Join</button>
    </div>
    ${last && !code ? `<p class="small" style="margin:10px 0 0"><button class="btn small ghost" data-act="rejoin" data-code="${esc(last)}">Rejoin game ${esc(last)}</button></p>` : ''}`;
}

async function enterRoom(code) {
  if (L?.unsub) L.unsub();
  L = { code, info: null, unsub: null };
  L.unsub = await Net.watchRoom(code, (info) => {
    if (!L || L.code !== code) return;
    L.info = info;
    Draft.onRoomInfo(code, info, () => { if (playView && location.hash === '#/play' && !G) playPage(playView); });
    if (!info) { flash('That game no longer exists.'); Net.setLastRoom(''); exitRoom(); return; }
    const seat = (info.players || []).findIndex((p) => p && p.id === Net.clientId());
    if (seat < 0 && info.status !== 'lobby') { Net.setLastRoom(''); exitRoom(); return; }
    if (info.status === 'playing' && seat >= 0 && !(G && G.mode === 'online' && G.round === info.round)) beginOnline(info, seat);
    if (info.status === 'lobby' && G && G.mode === 'online') { leave(); }
    if (playView && location.hash === '#/play' && !G) playPage(playView);
  });
}

// On start-up, go straight back into a game this phone was part of
// (iPhones reload pages that have been in the background a while).
export async function autoRejoin() {
  const code = Net.lastRoom();
  if (!code || !Net.isConfigured() || L) return;
  try { await enterRoom(code); } catch { /* offline: the Rejoin button is still there */ }
}

function exitRoom() {
  if (L?.unsub) L.unsub();
  L = null;
  if (playView && location.hash === '#/play' && !G) playPage(playView);
}

async function onlineAct(act, el, choices) {
  const deckOf = (id) => choices.find((d) => d.id === document.getElementById(id)?.value);
  try {
    if (act === 'create' || act === 'join' || act === 'rejoin') {
      const name = (document.getElementById('my-name')?.value || '').trim() || Net.myName();
      if (!name) { flash('Type your name first.'); return; }
      Net.setMyName(name);
      const deck = deckOf('net-deck');
      const dcode = Decks.encode(deck.counts);
      if (act === 'create') { const code = await Net.createRoom({ seats: Number(el.dataset.seats), name, deck: dcode, draft: !!document.getElementById('draft-new')?.checked }); await enterRoom(code); }
      else {
        const code = act === 'rejoin' ? el.dataset.code : Net.cleanCode(document.getElementById('join-code').value);
        if (code.length !== 4) { flash('Game codes have four letters.'); return; }
        await Net.joinRoom(code, { name, deck: dcode });
        await enterRoom(code);
      }
    }
    if (act === 'start') {
      if (L.info?.draft) await Draft.beforeStart(L.code, L.info); // drafted decks, not the picker's
      else await Net.setDeck(L.code, Decks.encode(deckOf('room-deck').counts));
      await Net.startGame(L.code);
    }
    if (act === 'leave-room') { const code = L.code; Draft.leaveRoom(); exitRoom(); await Net.leaveLobby(code); } // stop watching first, so leaving isn't reported as the game vanishing
    if (act === 'rejoin-table') { const seat = L.info.players.findIndex((p) => p.id === Net.clientId()); beginOnline(L.info, seat); }
    if (act === 'copy-link') { try { await navigator.clipboard.writeText(el.dataset.link); flash('Invite link copied.'); } catch { flash(el.dataset.link); } }
  } catch (e) { flash(e.message || String(e)); }
}

export function playPage(view) {
  playView = view;
  const choices = deckChoices();
  const active = Decks.getActiveId();
  const chosen = choices.find((d) => d.id === active) ? active : choices[0].id;
  const saved = store.get();
  view.innerHTML = `
    <div class="sect-title"><h2>Play</h2></div>
    ${saved && !saved.over ? `<div class="notice"><div>⏸</div><div>A practice game is in progress.
      <div class="btn-row" style="margin-top:8px"><button class="btn small primary" data-act="resume">Resume</button>
      <button class="btn small ghost" data-act="forget">Throw it away</button></div></div></div>` : ''}
    <div class="panel learn" style="margin-top:12px">
      <h3>${tutorialDone() ? 'Want a refresher?' : 'New to the game? Start here'}</h3>
      <p class="muted small" style="margin:6px 0 0">A guided game teaches attacking, blocking and Tricks, one step at a time. About 5 minutes.</p>
      <button class="btn${tutorialDone() ? '' : ' primary'}" data-act="tutorial" style="width:100%;margin-top:12px">${tutorialDone() ? 'Replay the guided lesson' : 'Start the guided lesson'}</button>
    </div>
    <div class="panel" style="margin-top:12px">
      <h3>Practice against bots</h3>
      <p class="muted small" style="margin:6px 0 0">Learn the cards before Friday. You can take moves back.</p>
      <label class="field">Your deck
        <select id="my-deck" class="select">${choices.map((d) => `<option value="${esc(d.id)}"${d.id === chosen ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
      <label class="field">The bots play
        <select id="bot-deck" class="select"><option value="random">Random starter decks</option>
        ${STARTERS.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
      <div style="display:grid;gap:8px;margin-top:14px">
        <button class="btn primary" data-act="practice" data-n="1">You against one bot</button>
        <button class="btn primary" data-act="practice" data-n="2">Three-way: you against two bots</button>
      </div>
    </div>
    ${Draft.practicePanelHTML()}
    <div class="panel" style="margin-top:12px">${onlinePanelHTML(choices, chosen)}</div>`;
  view.onchange = (e) => {
    if (e.target.id !== 'room-deck' || !L) return;
    const d = choices.find((x) => x.id === e.target.value);
    Net.setDeck(L.code, Decks.encode(d.counts)).then(() => flash(`${d.name.replace(/ \(starter\)$/, '')} is your deck for the next game.`), (err) => flash(err.message));
  };
  view.onclick = (e) => {
    const el = e.target.closest('[data-act]');
    const act = el?.dataset.act;
    if (['create', 'join', 'rejoin', 'start', 'leave-room', 'rejoin-table', 'copy-link'].includes(act)) { onlineAct(act, el, choices); return; }
    if (act?.startsWith('draft-')) { Draft.onPlayAct(act, el, { play: startPractice, refresh: () => playPage(view), code: L?.code }); return; }
    if (act === 'resume') resume();
    if (act === 'tutorial') startTutorial();
    if (act === 'forget') { store.clear(); playPage(view); }
    if (act === 'practice') {
      const mine = choices.find((d) => d.id === document.getElementById('my-deck').value);
      const which = document.getElementById('bot-deck').value;
      startPractice(mine, pickBots(Number(el.dataset.n), which, mine));
    }
  };
}

// Bots get different starters, and not yours if there is a choice.
function pickBots(n, which, mine) {
  if (which !== 'random') return Array.from({ length: n }, () => STARTERS.find((d) => d.id === which));
  const pool = [...STARTERS].filter((d) => d.id !== mine?.id).sort(() => Math.random() - 0.5);
  return pool.slice(0, n);
}

function startPractice(mine, bots) {
  const players = [{ name: 'You', deck: Decks.cardList(mine.counts) },
    ...bots.map((d) => ({ name: `Bot · ${d.name}`, deck: Decks.cardList(d.counts) }))];
  const setup = { seed: (Math.random() * 2 ** 31) | 0, players };
  begin({ mode: 'practice', setup, actions: [], me: 0, bots: bots.map((_, i) => i + 1) });
}

// One tap from the home page: you (with your deck in use) against two bots.
export function startThreeWay() {
  const choices = deckChoices();
  const mine = choices.find((d) => d.id === Decks.getActiveId()) || choices.find((d) => d.id === STARTERS[1].id) || choices[0];
  startPractice(mine, pickBots(2, 'random', mine));
}

// ── the guided first game ───────────────────────────────────────────
// Both opening hands are kept automatically; the coach takes it from there.
export function startTutorial() {
  begin({
    mode: 'tutorial', setup: TUTORIAL.setup, me: 0, bots: [1], tut: { i: 0, done: false },
    actions: [{ t: 'mulligan', p: 0, redraw: false }, { t: 'mulligan', p: 1, redraw: false }],
  });
}

const tutDoneKey = 'collective.tutorialDone';
export const tutorialDone = () => { try { return !!localStorage.getItem(tutDoneKey); } catch { return false; } };

// The current lesson step, or null outside the lesson.
const tutStep = () => (G && G.mode === 'tutorial' && G.tut && !G.tut.done ? TUTORIAL.steps[G.tut.i] : null);

function tutAdvance() {
  G.tut.i++;
  if (G.tut.i >= TUTORIAL.steps.length) {
    G.tut.done = true;
    try { localStorage.setItem(tutDoneKey, '1'); } catch { /* fine */ }
  }
  redraw();
  schedule();
}

// The bot's scripted lesson moves, one at a time so they can be followed.
async function runBotScript(st) {
  for (const m of st.bot) {
    if (!G || tutStep() !== st) return;
    commit(botAction(G.state, 1, m));
    await G.chain;
    await FX.wait(500);
  }
  if (G && tutStep() === st) tutAdvance();
}

function coachHTML(st) {
  const n = G.tut.i + 1, total = TUTORIAL.steps.length;
  return `<div class="coach${st.bot ? ' coach-wait' : ''}" data-key="coach">
    <div class="coach-text">${esc(st.say)}</div>
    <div class="coach-row"><span class="coach-n">Lesson ${n} of ${total}${st.next ? ' · Next is at the bottom right' : ''}</span>
      ${st.final || st.bot ? '' : '<button class="btn small ghost" data-act="coach-skip">Skip lesson</button>'}</div>
  </div>`;
}

// ?demo=<seed>&moves=<n>&bots=<1|2>: bots play every seat for n moves, then
// hand you the position. For screenshots and quick checks.
export function demo(params) {
  const seed = Number(params.get('demo')) || 1;
  const nBots = Number(params.get('bots')) || 1;
  const moves = Number(params.get('moves')) || 24;
  const decks = [STARTERS[1], STARTERS[4], STARTERS[0]];
  const players = [{ name: 'You', deck: Decks.cardList(decks[0].counts) },
    ...decks.slice(1, 1 + nBots).map((d) => ({ name: `Bot · ${d.name}`, deck: Decks.cardList(d.counts) }))];
  const setup = { seed, players };
  let s = newGame(setup);
  const actions = [];
  for (let k = 0; s.phase !== 'over' && (k < moves || actor(s) !== 0 || s.phase !== 'main'); k++) {
    if (k > moves + 300) break;
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const a = chooseAction(s, p, { noise: 0 });
    s = apply(s, a).state;
    actions.push(a);
  }
  begin({ mode: 'practice', setup, actions, me: 0, bots: players.slice(1).map((_, i) => i + 1) });
}

function resume() {
  const saved = store.get();
  if (saved) begin(saved);
}

function mount() {
  let root = document.getElementById('game');
  if (!root) {
    root = document.createElement('div');
    root.id = 'game';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    FX.setStage(root);
    // Drag a hand card up onto the table to play it.
    FX.drag(root, {
      selector: '.tc-hand > .tcard',
      enabled: (el) => !!G && !G.busy && !G.flow && !G.sheet && !playable(Number(el.dataset.uid)),
      canDrop: (info) => !info.overHand && info.y < info.handRect.top - 24,
      onDrop: (info) => dropPlay(Number(info.el.dataset.uid)),
    });
    // Drag from your creature to aim: at an opponent to attack, at an attacker to block it.
    FX.dragArrow(root, {
      selector: '.g-side.me .tcard',
      enabled: (el) => !!G && !G.busy && !G.flow && !G.sheet && aimTargets(Number(el.dataset.uid)).length > 0,
      targets: (el) => aimTargets(Number(el.dataset.uid)),
      onDrop: (toEl, fromEl) => { if (toEl) aimDrop(Number(fromEl.dataset.uid), toEl); },
    });
  }
  document.body.classList.add('in-game');
  return root;
}

function begin(rec) {
  clearTimeout(G?.timer);
  const state = replay(rec.setup, rec.actions);
  state.events = [];
  G = { ...rec, bots: new Set(rec.bots), state, view: state, lastShown: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
  mount();
  redraw();
  schedule();
}

// An online game: the seed and decks come from the room, the moves from
// the shared move list. Nothing is applied locally until it is in the list.
function beginOnline(info, seat) {
  const round = info.round;
  const setup = { seed: info.seeds[round], players: info.players.map((p) => ({ name: p.name, deck: Decks.cardList(Decks.decode(p.deck) || {}) })) };
  clearTimeout(G?.timer);
  G?.unsubActions?.();
  const state = newGame(setup);
  state.events = [];
  G = { mode: 'online', code: L.code, round, setup, actions: [], me: seat, bots: new Set(), state, view: state, lastShown: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
  mount();
  redraw();
  Net.watchActions(L.code, round, (actions, atEnd) => {
    if (!G || G.mode !== 'online' || G.round !== round) return;
    if (atEnd && actions.length === G.actions.length + 1) {
      const r = apply(G.state, actions[actions.length - 1]);
      if (!r.error) { G.state = r.state; G.actions = actions; show(r.state.events); return; }
    }
    G.state = replay(setup, actions);
    G.state.events = [];
    G.actions = actions;
    show([]);
  }).then((unsub) => { if (G && G.round === round) G.unsubActions = unsub; else unsub(); });
}

// Leave the table (a practice game stays saved and can be resumed;
// an online game carries on and you can go back to it from Play).
function leave(goTo = '#/play') {
  clearTimeout(G?.timer);
  G?.unsubActions?.();
  if (G && G.mode === 'practice' && G.state.phase === 'over') store.clear();
  G = null;
  document.getElementById('game')?.remove();
  document.getElementById('fx-layer')?.replaceChildren();
  document.body.classList.remove('in-game');
  if (location.hash === goTo) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = goTo;
}

function save() {
  if (G.mode !== 'practice') return;
  store.set({ mode: G.mode, setup: G.setup, actions: G.actions, me: G.me, bots: [...G.bots], over: G.state.phase === 'over' });
}

// ── moves ───────────────────────────────────────────────────────────
function dispatch(a) {
  if (!G) return false;
  if (G.mode === 'online') {
    const r = apply(G.state, a);
    if (r.error) { flash(r.error); return false; }
    clearSelections();
    Net.sendAction(G.code, G.round, a).catch((e) => flash(`Not sent: ${e.message}`));
    return true;
  }
  // In the lesson, your moves must be the one the coach is asking for.
  const st = tutStep();
  let lessonMove = false;
  if (st && a.p === G.me && a.t !== 'concede' && a.t !== 'fix') {
    if (!st.expect) { flash(st.next ? 'Read the box first, then tap Next.' : 'Wait for the bot to finish.'); return false; }
    if (!matches(G.state, a, st.expect)) { flash(`Not quite. ${st.say}`); clearSelections(); redraw(); return false; }
    lessonMove = true;
  }
  if (!commit(a)) return false;
  if (lessonMove) G.chain.then(() => { if (G && tutStep() === st) tutAdvance(); });
  else schedule();
  return true;
}

// Apply a move locally, remember it, and show it. Returns true if it happened.
function commit(a) {
  const r = apply(G.state, a);
  if (r.error) { flash(r.error); return false; }
  G.actions.push(a);
  G.state = r.state;
  // using an ability while picking attackers keeps the attackers picked
  const atk = a.t === 'use' && G.atk ? G.atk : null;
  clearSelections();
  if (atk) {
    atk.att = atk.att.filter((u) => canAttack(r.state, G.me, r.state.cards[u]));
    if (atk.att.length) G.atk = atk;
  }
  save();
  show(r.state.events);
  return true;
}

function clearSelections() {
  if (!G) return;
  G.recap = null;
  G.fightNote = null;
  G.atk = null;
  G.blk = null;
  G.flow = null;
  G.suggest = null;
}

// ── 💡 a suggested move: what the bot would do in your place ────────
// Worked out without the opponents' face-down Traps, so it gives nothing away.
function suggestion() {
  const s = structuredClone(G.state);
  s.events = [];
  for (const Q of s.players) if (Q.i !== G.me) { for (const u of Q.traps) s.cards[u].zone = 'gone'; Q.traps = []; }
  return chooseAction(s, G.me, { noise: 0 });
}

function startSuggest() {
  if (!G || G.busy || !myMove() || tutStep()) return;
  const at = G.state;
  G.suggest = { state: at, thinking: true };
  redraw();
  // let the button press show before the bot thinks (a moment on a slow phone)
  setTimeout(() => {
    if (!G || G.state !== at || !G.suggest) return;
    try {
      const a = suggestion();
      G.suggest = { state: at, a, text: describeMove(at, a), show: suggestRings(at, a) };
      // An attack or a block is set up on the table, so the line under it shows how
      // it would go; you confirm with the usual button (or change it first).
      if (a.t === 'attack') {
        G.atk = { att: [...a.att], hunt: (a.hunt || []).map((h) => [...h]), target: a.target };
        G.suggest.setUp = at.players.length === 2 ? 'Attack!' : `Attack ${at.players[a.target].name.replace(/^Bot · /, '')}`;
      }
      if (a.t === 'block' && G.blk) { G.blk.pairs = a.blocks.map((p) => [...p]); G.blk.sel = null; G.suggest.setUp = a.blocks.length ? 'Done' : 'Don’t block'; }
    } catch (e) { console.error(e); G.suggest = null; flash('No suggestion this time.'); }
    redraw();
  }, 40);
}

function describeMove(s, a) {
  const card = (u) => `<b>${esc(BY_ID[s.cards[u].cid].name)}</b>`;
  const who = (p) => (p === G.me ? 'yourself' : `<b>${esc(shortName(s.players[p].name))}</b>`);
  const on = (t) => (!t ? '' : t.p != null ? ` on ${who(t.p)}` : ` on ${card(t.uid)}`);
  switch (a.t) {
    case 'play': {
      let t = `Play ${card(a.uid)}${a.from === 'discard' ? ' from your discard pile (Echo)' : ''}`;
      if (a.sac != null) t += `, sacrificing ${card(a.sac)},`;
      if (a.fighter != null) t += ` with ${card(a.fighter)} fighting`;
      t += on(a.target);
      if (a.pick != null) t += `, bringing back ${card(a.pick)}`;
      if (a.picks?.length) t += `, getting back ${listNames(a.picks.map(card))}`;
      if (a.targets?.length) t += ` on ${listNames(a.targets.map(card))}`;
      if (a.keep != null) t += `, keeping ${card(a.keep)}`;
      if (a.discard != null) t += `, then discarding ${card(a.discard)}`;
      return `${t}.`;
    }
    case 'attack': {
      const hunt = (a.hunt || []).map(([x, y]) => `${card(x)} hunts ${card(y)}`);
      return `Attack ${who(a.target)} with ${listNames(a.att.map(card))}${hunt.length ? ` (${hunt.join(', ')})` : ''}.`;
    }
    case 'block': {
      if (!a.blocks.length) return 'Don’t block this time: take the hit and keep your creatures.';
      const by = new Map();
      for (const [b, x] of a.blocks) by.set(x, [...(by.get(x) || []), b]);
      return `${[...by].map(([x, bs]) => `${listNames(bs.map(card))} ${bs.length > 1 ? 'block' : 'blocks'} ${card(x)}`).join('; ')}.`;
    }
    case 'pass': return 'Tap <b>Fight!</b> No Trick or ability is worth it here.';
    case 'use': {
      const c = s.cards[a.uid];
      if (c.zone === 'relic') return `Use the ${card(a.uid)}: sacrifice ${card(a.sac)} to draw a card.`;
      return `Use ${card(a.uid)}: ${esc(BY_ID[c.cid].ability.short)}${on(a.target)}.`;
    }
    case 'phoenix': return 'Pay 2 Energy to bring the Phoenix back to your hand.';
    case 'end': return 'End your turn: nothing else is worth doing right now.';
  }
  return 'Anything goes.';
}

// What to ring on the table for a suggested move.
function suggestRings(s, a) {
  const c = (u) => (s.cards[u]?.zone === 'relic' ? `.relic[data-uid="${u}"]` : `.tcard[data-uid="${u}"]:not(.in-hand)`);
  const t = (x) => (!x ? [] : x.p != null ? [`.pbar[data-p="${x.p}"]`] : [c(x.uid)]);
  switch (a.t) {
    case 'play': return [a.from === 'discard' ? `.tc-pile[data-pile="${G.me}"]` : `.g-hand .tcard[data-uid="${a.uid}"]`, ...t(a.target), ...[a.sac, a.fighter, ...(a.targets || [])].filter((u) => u != null).map(c)];
    case 'attack': return [...a.att.map(c), `.pbar[data-p="${a.target}"]`, ...(a.hunt || []).map(([, y]) => c(y))];
    case 'block': return a.blocks.length ? a.blocks.flatMap(([b, x]) => [c(b), c(x)]) : ['.blk-btn'];
    case 'pass': return ['.fight-btn'];
    case 'use': return [c(a.uid), ...t(a.target), ...(a.sac != null ? [c(a.sac)] : [])];
    case 'phoenix': return ['[data-act="phoenix"]'];
    case 'end': return ['.end-btn'];
  }
  return [];
}

function suggestHTML() {
  const sg = G.suggest;
  if (!sg || sg.state !== G.state || !myMove()) return '';
  if (sg.thinking) return '<div class="suggest"><span class="suggest-t"><span class="suggest-h">💡 Thinking…</span></span></div>';
  if (sg.setUp) {
    return `<div class="suggest"><span class="suggest-t"><span class="suggest-h">💡 The bot would:</span> ${sg.text} It’s set up: tap <b>${esc(sg.setUp)}</b>, or change it.</span>
      <div class="suggest-row"><button class="btn small ghost" data-act="suggest-close">Got it</button></div></div>`;
  }
  return `<div class="suggest"><span class="suggest-t"><span class="suggest-h">💡 The bot would:</span> ${sg.text}</span>
    <div class="suggest-row"><button class="btn small ghost" data-act="suggest-close">Got it</button><button class="btn small primary" data-act="suggest-do">Do it</button></div></div>`;
}

// Queue the animation of a move, then the redraw of the position after it.
// A hidden page (the phone was put away) or a pile of moves catching up
// skips straight to the result.
function show(events) {
  const after = G.state;
  // Remember the table as your turn ended, for "Since your last turn".
  const prev = G.lastShown;
  if (prev && prev.active === G.me && prev.phase !== 'mulligan' && (after.active !== G.me || after.turn !== prev.turn)) {
    G.mark = { turn: prev.turn, life: prev.players.map((P) => P.life), board: prev.players[G.me].board.map((u) => ({ uid: u, name: BY_ID[prev.cards[u].cid].name })) };
  }
  G.lastShown = after;
  G.backlog = (G.backlog || 0) + 1;
  G.chain = G.chain.then(async () => {
    const quick = document.hidden || G.backlog > 2;
    try { await present(quick ? [] : events || [], after, quick); } finally { if (G) G.backlog--; }
  }).catch((e) => console.error(e));
  return G.chain;
}
// Animations wait on the screen; never let one hold the game up for long.
const capped = (p, ms) => Promise.race([p, FX.wait(ms)]);

// The bot (or the lesson script) moves once the table has caught up.
function schedule() {
  if (!G) return;
  clearTimeout(G.timer);
  const id = ++G.sched;
  G.chain.then(() => {
    if (!G || G.sched !== id) return;
    const s = G.state;
    if (s.phase === 'over') return;
    const st = tutStep();
    if (st?.bot) { G.timer = setTimeout(() => runBotScript(st), 600); return; }
    if (st) return; // the lesson is waiting for you
    const who = s.phase === 'mulligan'
      ? s.players.find((P) => !P.mull && G.bots.has(P.i))?.i
      : (G.bots.has(actor(s)) ? actor(s) : undefined);
    if (who == null) return;
    const noise = G.mode === 'tutorial' ? 3 : 0.4;
    G.timer = setTimeout(() => {
      if (!G || G.sched !== id || G.state !== s) return;
      dispatch(chooseAction(G.state, who, { noise }));
    }, s.phase === 'mulligan' ? 200 : s.phase === 'combat' ? 700 : 950);
  });
}

function undo() {
  let i = G.actions.length - 1;
  while (i >= 0 && G.actions[i].p !== G.me) i--;
  if (i < 0 || G.actions[i].t === 'mulligan') { flash('Nothing to take back.'); return; }
  clearTimeout(G.timer);
  G.actions = G.actions.slice(0, i);
  G.state = replay(G.setup, G.actions);
  G.state.events = [];
  G.view = G.state;
  G.lastShown = G.state;
  G.mark = null;
  clearSelections();
  G.sheet = null;
  save();
  redraw();
  schedule();
}

// ── helpers about the position ──────────────────────────────────────
const S = () => G.view;

// The engine logs in the third person ("Dana plays…"); in practice games
// the human is called "You", so fix the grammar for display.
function speak(text) {
  if (G.state.players[G.me].name !== 'You') return text;
  // Other players' names stay as they are (a deck can be called "You Didn't Need That").
  const names = G.state.players.filter((P) => P.i !== G.me).map((P) => P.name);
  let t = names.reduce((acc, n, k) => acc.split(n).join(`\u0001${k}\u0001`), text);
  if (/\bYou\b/.test(t)) {
    t = t
      .replace(/\bYou's\b/g, 'Your')
      .replace(/\bYou is\b/g, 'You are')
      .replace(/\bYou has\b/g, 'You have')
      .replace(/\bYou goes\b/g, 'You go')
      .replace(/\bYou doesn't\b/g, 'You don’t')
      .replace(/\bYou does\b/g, 'You do')
      .replace(/\bYou passes\b/g, 'You pass')
      .replace(/\b(You|and) (\w+?[^s])s\b/g, (m, w, v) => `${w} ${v}`)
      .replace(/([a-z,;:] )You\b/g, '$1you')
      .replace(/\btheir\b/g, 'your');
  }
  // bots go by their deck's name, and "Everything Dies's turn" reads "Everything Dies’ turn"
  return t.replace(/\u0001(\d+)\u0001('s)?/g, (m, k, s) => (s ? poss(shortName(names[k])) : shortName(names[k])));
}
// Practice bots are called "Bot · <deck>"; on the table they go by the deck's name.
const shortName = (n) => String(n ?? '').replace(/^Bot · /, '');
const poss = (n) => (/s$/.test(n) ? `${n}’` : `${n}’s`);
const name = (p) => shortName(S().players[p].name);
// (Whose move it is, as shown. Input is held back separately while G.busy.)
const myMove = () => actor(S()) === G.me && S().phase !== 'over';
const myMain = () => myMove() && S().phase === 'main';
const fightStep = (step) => S().phase === 'combat' && S().combat.step === step;
const iBlock = () => myMove() && fightStep('block');
const iTrick = () => myMove() && fightStep('tricks');
const attackedThisTurn = () => S().players[G.me].attackedOn === S().turn;
const nameOf = (u) => BY_ID[S().cards[u].cid].name;
const listNames = (ns) => (ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`);

function playable(uid, from = 'hand') {
  const s = S(), P = s.players[G.me], c = s.cards[uid];
  if (!c) return 'Gone.';
  const d = BY_ID[c.cid];
  if (!myMove()) return actor(s) === G.me ? 'Just a moment…' : 'Wait for your turn.';
  if (s.phase === 'combat' && !isTrick(d)) return 'During a fight you can only play Tricks.';
  const cost = costOf(s, G.me, c, from);
  if (cost > P.energy) return `Needs ${cost} Energy; you have ${P.energy}.`;
  if (d.type === 'creature' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  if (d.type === 'relic' && P.relics.length >= RULES.relicMax) return `You already have ${RULES.relicMax} Relics.`;
  if (!playOptions(s, G.me, c, from, 1).length) {
    const n = needs(s, G.me, c, from);
    if (n.sac && !n.sac.length) return 'You need a creature of yours to sacrifice.';
    if (n.fighter && !n.fighter.length) return 'You need a creature of yours to fight with.';
    if (c.cid === 'dawns-judgment') return 'Only when a creature is attacking you.';
    if (n.target && !n.target.length) return 'There is nothing to target.';
    if (n.pick && !n.pick.length) return 'There is nothing in the discard pile it can bring back.';
    if (n.targets && !n.count) return 'You need creatures of your own.';
    return 'You can’t play that right now.';
  }
  return null;
}

const PROMPTS = {
  'feed-the-flame': ['Sacrifice which of your creatures?', 'Where do the 3 damage go?'],
  'funeral-pyre': ['Sacrifice which of your creatures?', 'Where does the damage go?'],
  'the-mountain-is-angry': [null, 'Which opponent?'],
  'wild-growth': [null, 'Which of your creatures grows +2/+2?'],
  'worldtree-stag': [null, 'Give another creature of yours +2/+2 (or skip).'],
  'not-yet': [null, 'Send which creature or Relic (cost 3 or less) back to its owner’s hand?'],
  'deepwater-leviathan': [null, 'You may return another creature to its owner’s hand.'],
  'death-is-a-door': [null, 'Destroy which creature or Relic?'],
  'apex-predator': [null, 'Apex Predator fights which creature?'],
  'we-grow-together': [null, null, 'Choose your creatures to grow +1/+2.'],
  scorch: [null, 'Scorch which creature (2 damage)?'],
  kindle: [null, 'Which of your creatures gets +2 Power and Swift?'],
  mutiny: [null, 'Take which enemy creature until the end of the turn?'],
  'sudden-growth': [null, 'Which of your creatures gets +3/+3?'],
  'savage-clash': ['Which of your creatures fights?', 'Fight which enemy creature?'],
  'grove-druid': [null, 'Destroy a Relic? (Skip to raise your maximum Energy instead.)'],
  'sea-change': [null, 'Turn which creature into a Fish?'],
  'tidal-mimic': [null, 'Copy which creature? (or skip)'],
  nerissa: [null, 'Take which enemy creature for good? (cost 4 or less, or skip)'],
  'kiss-of-night': [null, 'Which of your creatures gets Venom and Drain?'],
  bastion: [null, 'Which of your creatures gets +1/+3?'],
  'dawns-judgment': [null, 'Destroy which attacker?'],
  'sky-warden': [null, 'Pin down which enemy creature?'],
};
// what an ability asks for
const ABILITY_PROMPTS = {
  'ember-duelist': 'Ember Duelist: 1 damage to which creature?',
  'canopy-archer': 'Canopy Archer: shoot which creature with Soar?',
  'hungry-ghoul': 'Hungry Ghoul: sacrifice which of your creatures?',
  'dawnwatch-knight': 'Which of your creatures gets +0/+2 this turn?',
};

// Why can't I use this creature's ability right now? (null: I can)
function abilityBlocked(uid) {
  const s = S(), c = s.cards[uid], ab = c && BY_ID[c.cid].ability;
  if (!ab || c.zone !== 'board') return 'It has no ability.';
  if (c.ctrl !== G.me) return 'That is not your creature.';
  if (c.usedOn === s.turn) return 'Already used this turn.';
  if (!myMove()) return s.phase === 'combat' ? 'Wait: someone else is deciding.' : 'On your turn, or during a fight you’re in.';
  if (ab.cost > s.players[G.me].energy) return `Needs ${ab.cost} Energy; you have ${s.players[G.me].energy}.`;
  if (c.cid === 'choirmother' && s.players[G.me].board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  if (!useOptions(s, G.me, c, 1).length) return 'There is nothing to target.';
  return null;
}

function startAbility(uid) {
  const why = abilityBlocked(uid);
  if (why) { flash(why); return; }
  const s = S(), c = s.cards[uid];
  const n = abilityNeeds(s, G.me, c);
  G.sheet = null;
  if (!n.target) { dispatch({ t: 'use', p: G.me, uid }); return; }
  G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'target', options: n.target, prompt: ABILITY_PROMPTS[c.cid] || 'Choose a target.' }], i: 0, multi: [] };
  nextChoice();
}

function stepsFor(uid, from) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const n = needs(s, G.me, c, from);
  const pr = PROMPTS[c.cid] || [];
  const steps = [];
  if (n.sac) steps.push({ kind: 'sac', options: n.sac.map((u) => ({ uid: u })), prompt: pr[0] || 'Choose a creature to sacrifice.' });
  if (n.fighter) steps.push({ kind: 'fighter', options: n.fighter.map((u) => ({ uid: u })), prompt: pr[0] || 'Which of your creatures?' });
  if (n.target && (n.target.length || !n.optional)) steps.push({ kind: 'target', options: n.target, optional: !!n.optional, prompt: pr[1] || 'Choose a target.' });
  if (n.targets && n.count) steps.push({ kind: 'targets', options: n.targets.map((u) => ({ uid: u })), count: n.count, prompt: pr[2] || `Choose ${n.count} of your creatures.` });
  if (n.pick && n.pick.length) steps.push({ kind: 'pick', options: n.pick, optional: !!n.optional });
  if (n.picks) steps.push({ kind: 'picks', options: n.picks, max: n.max });
  if (n.keep && n.keep.length) steps.push({ kind: 'keep', options: n.keep });
  if (n.bottom && n.bottom.length) steps.push({ kind: 'bottom', options: n.bottom });
  if (n.discard) steps.push({ kind: 'discard', options: n.discard });
  if (d.type === 'spell' && countercurrentOwner(s)) steps.push({ kind: 'tax' });
  return steps;
}
const countercurrentOwner = (s) => opponents(s, G.me).find((Q) => Q.traps.some((u) => s.cards[u].cid === 'countercurrent'));

const sameT = (a, b) => (a.p != null ? a.p === b.p : a.uid === b.uid);

// What is highlighted on the table right now.
function highlights() {
  const h = { targets: [], picked: [] };
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'fighter', 'target', 'targets'].includes(st.kind)) {
    h.targets = st.options.filter((o) => !(st.kind === 'target' && o.uid != null && (o.uid === G.flow.a.sac || o.uid === G.flow.a.fighter)));
    if (st.kind === 'targets') h.picked = [...G.flow.multi];
  }
  if (G.atk) {
    for (const Q of opponents(S(), G.me)) h.targets.push({ p: Q.i });
    if (hunterWithoutPrey()) for (const u of preyFor(hunterWithoutPrey())) h.targets.push({ uid: u });
  }
  if (G.blk && G.blk.sel != null) for (const a of S().combat.att) if (canAssign(G.blk.sel, a)) h.targets.push({ uid: a });
  return h;
}

// ── attacking ───────────────────────────────────────────────────────
const readyAttackers = () => S().players[G.me].board.filter((u) => canAttack(S(), G.me, S().cards[u]));
const canStartAttack = () => myMain() && !attackedThisTurn() && readyAttackers().length > 0;
const hunterWithoutPrey = () => G.atk?.att.find((u) => hasKw(S(), S().cards[u], 'hunt') && !G.atk.hunt.some(([a]) => a === u));
function preyFor(hunter, target = G.atk?.target) {
  const s = S(), a = s.cards[hunter];
  return opponents(s, G.me).filter((Q) => target == null || Q.i === target).flatMap((Q) => Q.board).filter((u) => canBlock(s, s.cards[u], a));
}

function toggleAttacker(uid) {
  G.suggest = null; // a suggestion set up on the table is now yours to change
  if (!G.atk) G.atk = { att: [], hunt: [], target: S().players.length === 2 ? opponents(S(), G.me)[0].i : null };
  const k = G.atk.att.indexOf(uid);
  if (k >= 0) { G.atk.att.splice(k, 1); G.atk.hunt = G.atk.hunt.filter(([a]) => a !== uid); }
  else G.atk.att.push(uid);
  if (!G.atk.att.length) G.atk = null;
  redraw();
}

function sendAttack(target) {
  const t = target ?? G.atk?.target;
  if (!G.atk || t == null) return;
  const hunt = G.atk.hunt.filter(([, prey]) => S().cards[prey].ctrl === t);
  dispatch({ t: 'attack', p: G.me, target: t, att: [...G.atk.att], ...(hunt.length ? { hunt } : {}) });
}

// ── blocking ────────────────────────────────────────────────────────
function syncBlocks() {
  if (!iBlock()) { G.blk = null; return; }
  const key = `${S().turn}:${S().combat.att.join(',')}`;
  if (!G.blk || G.blk.key !== key) G.blk = { key, pairs: forcedBlocks(S()), sel: null };
}
const isForced = (b, a) => forcedBlocks(S()).some(([x, y]) => x === b && y === a);
function canAssign(b, a) {
  const s = S(), bc = s.cards[b], ac = s.cards[a];
  if (!bc || bc.ctrl !== G.me || !canBlock(s, bc, ac)) return false;
  // a creature that must block its hunter (Hunt) stays where it is
  return !G.blk.pairs.some(([x, y]) => x === b && y !== a && blockLimit(s, bc) === 1 && isForced(x, y));
}
const canBlockSomething = (u) => S().combat.att.some((a) => canBlock(S(), S().cards[u], S().cards[a]));

// Several creatures may block the same attacker; each blocks one (a Guard two).
function assignBlock(b, a) {
  if (!canAssign(b, a)) { flash(`${nameOf(b)} can’t block that.`); return; }
  G.suggest = null;
  if (!G.blk.pairs.some(([x, y]) => x === b && y === a)) {
    // over its limit: it lets go of the attacker it was blocking before
    const mine = G.blk.pairs.filter(([x]) => x === b);
    if (mine.length >= blockLimit(S(), S().cards[b])) { const drop = mine.find(([x, y]) => !isForced(x, y)); G.blk.pairs = G.blk.pairs.filter((p) => p !== drop); }
    G.blk.pairs.push([b, a]);
  }
  G.blk.sel = null;
  redraw();
}

// What a block would lead to, if nobody plays a Trick.
const lean = (s) => ({ ...s, log: [], events: [] });
function playOut(s, a) {
  const r = apply(lean(s), a);
  if (r.error) return null;
  let t = r.state;
  for (let i = 0; i < 20 && t.phase === 'combat'; i++) {
    const C = t.combat;
    const r2 = apply(t, C.step === 'block' ? { t: 'block', p: C.d, blocks: forcedBlocks(t, C) } : { t: 'pass', p: C.prio });
    if (r2.error) break;
    t = r2.state;
  }
  return t;
}
function outcome(s, t) {
  if (!t) return '';
  const lost = s.players[G.me].life - t.players[G.me].life;
  const gone = (P) => P.board.filter((u) => t.cards[u].zone !== 'board').map((u) => BY_ID[s.cards[u].cid].name);
  const mine = gone(s.players[G.me]);
  const theirs = s.players.filter((Q) => Q.i !== G.me).flatMap(gone);
  const bits = [lost > 0 ? `you take <b>${lost}</b>` : 'you take no damage'];
  for (const Q of s.players) {
    const n = Q.life - t.players[Q.i].life;
    if (Q.i !== G.me && n > 0) bits.push(`${esc(shortName(Q.name))} takes <b>${n}</b>${t.players[Q.i].out ? ' (and is out!)' : ''}`);
  }
  if (mine.length) bits.push(`you lose ${esc(listNames(mine))}`);
  if (theirs.length) bits.push(`they lose ${esc(listNames(theirs))}`);
  return bits.join(' · ');
}

// Dragging from one of your creatures: what can it aim at?
function aimTargets(uid) {
  const root = document.getElementById('game');
  if (!root || !G) return [];
  const s = S(), c = s.cards[uid];
  if (!c || c.ctrl !== G.me) return [];
  if (iBlock()) {
    if (!canBlockSomething(uid)) return [];
    return s.combat.att.filter((a) => canBlock(s, c, s.cards[a])).map((a) => root.querySelector(`.tcard[data-uid="${a}"]`)).filter(Boolean);
  }
  if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) {
    const bars = opponents(s, G.me).map((Q) => root.querySelector(`.pbar[data-p="${Q.i}"]`));
    const prey = hasKw(s, c, 'hunt') ? opponents(s, G.me).flatMap((Q) => Q.board).filter((u) => canBlock(s, s.cards[u], c)).map((u) => root.querySelector(`.tcard[data-uid="${u}"]`)) : [];
    return [...bars, ...prey].filter(Boolean);
  }
  return [];
}

function aimDrop(uid, toEl) {
  const s = S();
  if (iBlock()) { const a = Number(toEl.dataset.uid); syncBlocks(); assignBlock(uid, a); return; }
  if (!G.atk) G.atk = { att: [], hunt: [], target: null };
  if (!G.atk.att.includes(uid)) G.atk.att.push(uid);
  if (toEl.dataset.p != null) G.atk.target = Number(toEl.dataset.p);
  else {
    const prey = Number(toEl.dataset.uid);
    G.atk.hunt = G.atk.hunt.filter(([a]) => a !== uid);
    G.atk.hunt.push([uid, prey]);
    G.atk.target = s.cards[prey].ctrl;
  }
  redraw();
}

// ── rendering ───────────────────────────────────────────────────────
function pips(P) {
  const max = Math.max(P.maxEnergy, P.energy);
  let h = '';
  for (let i = 0; i < max; i++) h += `<span class="pip${i < P.energy ? (i >= P.maxEnergy ? ' extra' : ' on') : ''}"></span>`;
  return h;
}

function relicHTML(s, r, hl) {
  const d = BY_ID[r.cid];
  const isT = hl.targets.some((t) => t.uid === r.uid);
  const note = r.cid === 'the-drowned-clock' ? `<b class="relic-n">${r.chimes || 0}/3</b>` : r.cid === 'bone-altar' && r.usedOn === s.turn ? '<b class="relic-n">✓</b>' : '';
  return `<button class="relic${isT ? ' target' : ''}" data-uid="${r.uid}" data-cid="${r.cid}" style="${factionVars(d)}" aria-label="${esc(d.name)}">
    <span class="relic-art">${artTag(r.cid) || ''}</span>${note}</button>`;
}

function pbarHTML(s, P, hl) {
  const isT = hl.targets.some((t) => t.p === P.i);
  const C = s.combat;
  const fighting = C && (C.d === P.i ? ' defending' : C.a === P.i ? ' attacking' : '');
  const crown = s.crown === P.i ? `<button class="pb-crown" data-act="crown-info" aria-label="Holds the Crown">${ICON.crown}</button>` : '';
  // A glance shows Life, Energy and cards in hand; the rest is a tap away (playerSheet).
  // Your own Energy keeps its pips (you spend them); the others' is one number.
  const mine = P.i === G.me;
  const energy = mine
    ? `<div class="pb-energy${s.players.length > 2 && Math.max(P.maxEnergy, P.energy) >= 6 ? ' many' : ''}">${pips(P)}<span class="pb-en-n">${P.energy}/${P.maxEnergy}</span></div>`
    : `<div class="pb-en" title="Energy">${ICON.bolt}${P.energy}</div>`;
  const meta = (mine ? '' : `<span title="cards in hand">${ICON.hand}${P.hand.length}</span>`)
    + (P.deck.length <= 5 && !P.out ? `<span class="pb-low" title="cards left in the deck">${ICON.deck}${P.deck.length} left</span>` : '')
    + (P.traps.length ? `<span class="trap-chip" title="${P.traps.length} face-down Trap${P.traps.length > 1 ? 's' : ''}">${ICON.trap}${P.traps.length}</span>` : '');
  return `<div class="pbar${isT ? ' target' : ''}${fighting || ''}${crown ? ' crowned' : ''}" data-p="${P.i}">
    <div class="pb-name">${crown}${esc(shortName(P.name))}</div>
    <div class="pb-life${P.life <= 5 ? ' low' : ''}">${ICON.heart}${P.out ? 'OUT' : P.life}</div>
    ${energy}
    ${meta ? `<div class="pb-meta">${meta}</div>` : ''}
    ${FX.pileHTML(P.discard.slice(-3).map((u) => ({ cid: s.cards[u].cid })), { p: P.i, count: P.discard.length, act: 'discards', w: s.players.length > 2 ? 22 : 26 })}
    ${P.relics.length ? `<div class="pb-relics">${P.relics.map((u) => relicHTML(s, s.cards[u], hl)).join('')}</div>` : ''}
  </div>`;
}

function creatureHTML(s, c, hl, inBattle = false) {
  const d = BY_ID[c.cid];
  const mine = c.ctrl === G.me;
  const st = [];
  const inAtk = G.atk?.att.includes(c.uid);
  const blkPair = G.blk?.pairs.some(([b]) => b === c.uid);
  if (c.ex && !c.attacking) st.push('exhausted');
  if (c.attacking || inAtk) st.push('attacking');
  if (c.blocking || blkPair) st.push('blocking');
  if (mine) {
    if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c) && !inAtk) st.push('ready');
    else if (iBlock() && !blkPair && s.combat.att.some((a) => canAssign(c.uid, a))) st.push('ready');
    if (c.played === s.turn && s.active === G.me && !c.rush && !hasKw(s, c, 'rush')) st.push('sick');
  }
  if (G.blk?.sel === c.uid) st.push('selected');
  if (hl.targets.some((t) => t.uid === c.uid)) st.push('target');
  if (hl.picked.includes(c.uid)) st.push('selected');
  const kws = FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k));
  // ⚡ chips only on your own creatures (theirs are a tap away, on the card)
  const ability = d.ability && mine ? { cost: d.ability.cost, on: !abilityBlocked(c.uid), used: c.usedOn === s.turn } : null;
  return FX.tcardHTML(d, {
    uid: c.uid, states: st, power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), dmg: c.dmg,
    keywords: kws, leaving: !!(c.sacEnd || c.stolen), foe: !mine, ability,
    ...(inBattle ? { cls: 'in-battle', rest: false } : {}),
  });
}

// The blockers of each attacker: the engine's, the ones just declared (shown while
// that move is animated), or the ones I am choosing right now.
function blockersOf(s) {
  const C = s.combat;
  if (!C) return {};
  if (G.showBlk && C.step === 'block') return G.showBlk;
  if (C.step === 'block' && C.d === G.me && G.blk) {
    const blk = {};
    for (const [b, x] of G.blk.pairs) (blk[x] ||= []).push(b);
    return blk;
  }
  return C.blk;
}

// ── the battle zone ─────────────────────────────────────────────────
// While a fight is on (or while you pick attackers), the creatures in it
// leave their rows and meet in the middle: each attacker in a column, its
// blockers straight across from it (side by side when there are several).
function battleView(s) {
  const C = s.combat;
  let att, blk = {}, a, d;
  if (C) {
    att = C.att.filter((u) => s.cards[u].zone === 'board');
    a = C.a; d = C.d;
    blk = blockersOf(s);
  } else if (G.atk && myMain()) {
    att = [...G.atk.att];
    a = G.me; d = G.atk.target;
  } else return null;
  if (!att.length) return null;
  // You are always at the bottom; otherwise the attacker is on top.
  const attTop = a !== G.me;
  const placed = new Set();
  const cols = att.map((u) => {
    const all = (blk[u] || []).filter((b) => s.cards[b]?.zone === 'board');
    const bs = all.filter((b) => !placed.has(b));
    const also = all.filter((b) => placed.has(b)); // a Guard blocking two is shown once
    for (const b of all) placed.add(b);
    return { a: u, bs, also };
  });
  return { a, d, attTop, cols, inZone: new Set([...att, ...placed]) };
}

function battleHTML(s, bv, hl) {
  const card = (u) => creatureHTML(s, s.cards[u], hl, true);
  const blocking = iBlock();
  const target = bv.d != null ? s.players[bv.d] : null;
  const short = (P) => (P.i === G.me ? 'you' : shortName(P.name));
  const cols = bv.cols.map(({ a, bs, also }) => {
    const parts = bs.map(card);
    if (also.length) parts.push(`<div class="gb-empty gb-also">also ${esc(listNames(also.map(nameOf)))}</div>`);
    const open = blocking && G.blk?.sel != null && canAssign(G.blk.sel, a) && !G.blk.pairs.some(([x, y]) => x === G.blk.sel && y === a);
    // an unblocked attacker gets a small "→ name" label, not a card-sized slot
    let label = false;
    if (!parts.length) {
      label = !blocking;
      parts.push(blocking ? `<div class="gb-empty${open ? ' open' : ''}" data-att="${a}">block<br>here</div>` : `<div class="gb-empty gb-hit">→ ${target ? esc(short(target)) : '?'}</div>`);
    } else if (open) parts.push(`<div class="gb-empty gb-add open" data-att="${a}">+ here</div>`);
    const other = `<div class="gb-slot${parts.length > 1 ? ' multi' : ''}${label ? ' label' : ''}">${parts.join('')}</div>`;
    const mine = `<div class="gb-slot">${card(a)}</div>`;
    const blocked = bs.length + also.length > 0;
    return `<div class="gb-col${parts.length > 1 ? ' wide' : ''}" data-key="col-${a}">${bv.attTop ? mine : other}<div class="gb-vs">${blocked ? '⚔' : ''}</div>${bv.attTop ? other : mine}</div>`;
  }).join('');
  const who = bv.a === G.me ? 'You' : shortName(s.players[bv.a].name);
  const at = target ? (target.i === G.me ? 'you' : shortName(target.name)) : null;
  const across = bv.cols.reduce((n, c) => n + Math.max(1, c.bs.length + (c.also.length ? 0.6 : 0)), 0);
  const label = at ? `⚔ ${esc(who)} → ${esc(at)}` : '⚔ Who do you attack? Tap a button below ↓';
  return `<div class="g-battle ${bv.attTop ? 'att-top' : 'att-bottom'}${bv.cols.length > 4 || across > 5 ? ' many' : ''}" data-key="battle">${tutStep() ? '' : `<div class="gb-label">${label}</div>`}<div class="gb-cols">${cols}</div></div>`;
}

function handHTML(s) {
  const P = s.players[G.me];
  return P.hand.map((u) => {
    const c = s.cards[u], d = BY_ID[c.cid];
    const can = !playable(u);
    const st = can ? ['can'] : myMove() ? ['dim'] : [];
    if (G.flow?.a.uid === u) st.push('selected');
    return FX.tcardHTML(d, { uid: u, zone: 'hand', cost: costOf(s, G.me, c), states: st });
  }).join('');
}

function statusHTML() {
  const s = S();
  if (s.phase === 'over') return 'Game over';
  if (s.players[G.me].out) return `<b>You’re out</b> · watching ${esc(listNames(living(s).map((P) => shortName(P.name))))} finish`;
  if (s.phase === 'mulligan') return 'Waiting for everyone to choose an opening hand…';
  const P = s.players[s.active];
  const who = actor(s);
  if (s.phase === 'combat') return who === G.me ? `<b>${s.combat.step === 'block' ? 'Choose your blockers' : 'Your move: Trick, ⚡ or Fight!'}</b>` : `${esc(name(who))} is deciding…`;
  if (s.active === G.me) return `<b>Your turn</b> · ${s.players[G.me].energy} Energy left`;
  return G.bots.has(s.active) ? `${esc(shortName(P.name))} is thinking…` : `${esc(poss(shortName(P.name)))} turn`;
}

function midHTML() {
  return suggestHTML() + midInner();
}

function midInner() {
  const s = S();
  const coached = !!tutStep(); // the coach box says what to do; keep banners short
  const tight = coached || s.players.length > 2; // three players leave less room in the middle
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'fighter', 'target', 'targets'].includes(st.kind)) return `<div class="banner"><span>${esc(st.prompt)}</span></div>`;
  if (G.atk && myMain()) {
    const hunter = hunterWithoutPrey();
    if (hunter) return `<div class="banner fight"><span>${esc(nameOf(hunter))} can Hunt: tap the enemy creature it must fight (optional).</span></div>`;
    if (tight) return '';
    return `<div class="banner fight"><span>Tap more creatures to add them, or tap one again to keep it home.</span></div>`;
  }
  if (iBlock()) {
    const pairs = G.blk?.pairs || [];
    const preview = outcome(s, playOut(s, { t: 'block', p: G.me, blocks: pairs }));
    const sel = G.blk?.sel != null ? `Now tap the attacker ${esc(nameOf(G.blk.sel))} should block.` : 'Tap one of your creatures to put it in front of an attacker.';
    return `<div class="banner fight foe">${tight ? '' : `<span>${sel}</span>`}<div class="banner-sub">If no one plays a Trick: ${preview}</div></div>`;
  }
  if (iTrick()) {
    if (coached) return '';
    const preview = outcome(s, playOut(s, { t: 'pass', p: G.me }));
    const role = s.combat.a === G.me ? 'Blockers are set.' : 'Your chance to answer.';
    return `<div class="banner fight">${tight ? '' : `<span>${role} Play a Trick or use a ⚡ ability, or tap Fight!</span>`}<div class="banner-sub">As things stand: ${preview}</div></div>`;
  }
  // One line at most: how the last fight went, or what you can do now.
  // (The full story is in the game log, in the menu.)
  if (G.fightNote && s.phase === 'main' && !tutStep()) return `<div class="fight-note">${G.fightNote}</div>`;
  if (tutStep()) return ''; // the coach is all there is to read
  const hint = hintText();
  return hint ? `<div class="hint">${hint}</div>` : '';
}

// "Since your last turn": what happened to you first (the Life you lost, who
// hit you, what you lost), then the rest in a line each. It sits over the
// table at the start of your turn, so it is never cut off; a tap closes it.
function recapInfo() {
  const s = S(), log = s.log, me = s.players[G.me];
  let start = log.length - 1;
  while (start >= 0 && log[start].text !== `${me.name}'s turn.`) start--;   // this turn's start
  let prev = start - 1;
  while (prev >= 0 && log[prev].text !== `${me.name}'s turn.`) prev--;      // your previous turn's start
  if (start < 0 || prev < 0) return null;
  let from = prev + 1;
  while (from < start && !/'s turn\.$/.test(log[from].text)) from++;  // skip your own turn
  const fights = [], news = [];
  let cur = null;
  for (const { text } of log.slice(from, start)) {
    let m;
    if ((m = text.match(/^(.+) attacks (.+) with (.+)\.$/))) { cur = { who: m[1], target: m[2], with: m[3], dmg: 0 }; fights.push(cur); continue; }
    if ((m = text.match(/^(.+) takes (\d+) damage\.$/)) && cur && m[1] === cur.target) { cur.dmg += Number(m[2]); continue; }
    if (/'s turn\.$/.test(text)) { cur = null; continue; }
    if (/takes the Crown|Crown goes|is out|plays (?!a )|sets a Trap|Trap springs/.test(text)) news.push(text);
  }
  const mk = G.mark && G.mark.turn < s.turn ? G.mark : null;
  return {
    fights, news, now: me.life, before: mk ? mk.life[G.me] : null,
    lost: mk ? mk.life[G.me] - me.life : 0,
    died: mk ? mk.board.filter((x) => !(s.cards[x.uid]?.zone === 'board' && s.cards[x.uid].ctrl === G.me)).map((x) => x.name) : [],
  };
}

function recapHTML() {
  const s = S();
  if (G.recap !== s.turn || !myMain() || tutStep()) return '';
  const r = recapInfo();
  if (!r) return '';
  const me = s.players[G.me].name;
  const who = (n) => (n === me ? 'you' : `<b>${esc(shortName(n))}</b>`);
  const lines = [];
  for (const f of r.fights.filter((x) => x.target === me)) lines.push(`${who(f.who)} attacked you with ${esc(f.with)}${f.dmg ? `: you took <b class="bad">${f.dmg}</b>.` : ', but nothing got through.'}`);
  if (r.died.length) lines.push(`You lost ${esc(listNames(r.died))}.`);
  for (const t of r.news.filter((x) => /Crown|is out/.test(x))) lines.push(esc(speak(t)));
  for (const f of r.fights.filter((x) => x.target !== me)) lines.push(`${who(f.who)} attacked ${who(f.target)}${f.dmg ? ` (${f.dmg} damage)` : ''}.`);
  for (const t of r.news.filter((x) => !/Crown|is out/.test(x)).slice(-2)) lines.push(esc(speak(t)));
  if (!lines.length && !r.lost) return '';
  const head = r.lost > 0 ? `You lost <b class="bad">${r.lost} Life</b> (${r.before} → ${r.now}).` : r.lost < 0 ? `You gained ${-r.lost} Life (now ${r.now}).` : `You lost no Life (${r.now}).`;
  return `<div class="recap-pop" data-act="recap-close" data-key="recap"><div class="recap-h">Since your last turn</div>
    <div class="recap-life">${head}</div>${lines.slice(0, 5).map((t) => `<div>${t}</div>`).join('')}<div class="recap-x">Tap to close</div></div>`;
}

// What can I do right now? Shown under the ticker in every game.
// What can I do right now? One short line, only when it's my move: the status
// line at the top already says whose turn it is and what the others are doing.
function hintText() {
  const s = S();
  if (s.phase !== 'main') return '';
  if (s.players[G.me].out) return 'You’re out of this game; the others play on.';
  if (s.active !== G.me) return '';
  const P = s.players[G.me];
  const canPlay = P.hand.some((u) => !playable(u));
  const canHit = canStartAttack();
  // three players: nobody has the Crown yet, so the first hit takes it
  const crown = s.crownOn && s.crown == null && canHit ? ' First hit takes the 👑.' : '';
  if (canPlay && canHit) return `Play a <b>glowing card</b>, or tap <b>glowing creatures</b> to attack.${crown}`;
  if (canPlay) return 'Drag a <b>glowing card</b> up to play it.';
  if (canHit) return `Tap <b>glowing creatures</b> to attack.${crown}`;
  if (P.board.some((u) => BY_ID[s.cards[u].cid].ability && !abilityBlocked(u))) return 'Use a glowing <b>⚡</b>, or <b>End turn</b>.';
  return 'Nothing left to do: <b>End turn</b>.';
}

function anythingToDo() {
  const s = S(), P = s.players[G.me];
  if (!myMain()) return false;
  if (P.hand.some((u) => !playable(u))) return true;
  if (canStartAttack()) return true;
  return phoenixReady(s, G.me).length > 0 && P.energy >= 2;
}

// The buttons under the table. The main one is always bottom right.
function actionsHTML() {
  const s = S();
  const btn = (cls, act, label, extra = '') => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
  const left = [], right = [];
  // In the lesson, "Next" is the main button: the coach box can be taller than the
  // middle of a short phone, and the button must never be the part that's cut off.
  const lesson = tutStep();
  if (lesson?.next) return `<span class="grow"></span>${btn('primary coach-next-btn', 'coach-next', lesson.final ? 'Let’s play!' : 'Next')}`;
  const st = G.flow?.steps[G.flow.i];
  // 💡 asks the bot what it would do (not during the lesson: the coach does that)
  const hint = (short) => { if (myMove() && !tutStep()) left.push(btn('small ghost hint-btn', 'suggest', short ? '💡' : '💡 Suggest', 'aria-label="Suggest a move"')); };
  if (st && ['sac', 'fighter', 'target', 'targets'].includes(st.kind)) {
    left.push(btn('small ghost', 'cancel', 'Cancel'));
    if (st.kind === 'targets' && G.flow.multi.length) right.push(btn('primary', 'done-targets', `Done (${G.flow.multi.length})`));
    else if (st.optional) right.push(btn('primary', 'skip', 'Skip'));
  } else if (G.atk && myMain()) {
    left.push(btn('small ghost', 'cancel', 'Cancel'));
    const opps = opponents(s, G.me);
    if (opps.length === 1) { hint(true); right.push(btn('primary atk-btn', 'attack', 'Attack!', `data-p="${opps[0].i}"`)); }
    // one short button per opponent, kept to one line ("⚔ Wild Hunt")
    else for (const Q of opps) right.push(btn(`primary atk-btn atk-3${G.atk.target === Q.i ? ' on' : ''}`, 'attack', `⚔ ${esc(shortName(Q.name))}`, `data-p="${Q.i}" aria-label="Attack ${esc(shortName(Q.name))}"`));
  } else if (iBlock()) {
    const n = G.blk?.pairs.length || 0;
    if (n && G.blk.pairs.some(([b, a]) => !isForced(b, a))) left.push(btn('small ghost', 'clear-blocks', 'Clear'));
    hint(n > 0);
    right.push(btn('primary blk-btn', 'block', n ? `Done: block with ${n}` : 'Don’t block'));
  } else if (iTrick()) {
    hint(false);
    right.push(btn('primary fight-btn', 'pass', 'Fight!'));
  } else {
    const phoenix = phoenixReady(s, G.me);
    if (phoenix.length && myMain()) left.push(btn('small', 'phoenix', 'Return Phoenix (2)', `data-uid="${phoenix[0]}"`));
    hint(phoenix.length > 0);
    const mine = myMain();
    if (s.players[G.me].out && s.phase !== 'over') right.push(btn('primary', 'leave', 'Leave'));
    else right.push(btn(`primary end-btn${mine && !anythingToDo() ? ' nudge' : ''}`, 'end', mine ? 'End turn' : 'Waiting…', mine && !G.flow ? '' : 'disabled'));
  }
  return `${left.join('')}<span class="grow"></span>${right.join('')}`;
}

function tableHTML() {
  const s = S(), me = s.players[G.me];
  const hl = highlights();
  const others = [];
  for (let k = 1; k < s.players.length; k++) others.push(s.players[(G.me + k) % s.players.length]);
  const st = tutStep();
  const bv = battleView(s);
  const row = (P) => `<div class="tc-row">${P.board.filter((u) => !bv?.inZone.has(u)).map((u) => creatureHTML(s, s.cards[u], hl)).join('')}</div>`;
  return `
    <div class="g-top">
      <button class="g-icon" data-act="menu" aria-label="Menu (take back a move, game log, leave)">☰</button>
      <div class="g-status">${statusHTML()}</div>
      <button class="g-icon" data-act="help" aria-label="How the table works">?</button>
    </div>
    <div class="g-table">
      ${others.map((P) => `<section class="g-side opp${s.active === P.i ? ' active' : ''}${P.out ? ' out' : ''}${s.combat && (s.combat.a === P.i || s.combat.d === P.i) ? ' in-fight' : ''}" data-side="${P.i}">${pbarHTML(s, P, hl)}${row(P)}</section>`).join('')}
      <div class="g-mid">${st ? coachHTML(st) : ''}${bv ? battleHTML(s, bv, hl) : ''}<div class="g-say" data-key="say">${midHTML()}</div></div>
      <section class="g-side me${s.active === G.me ? ' active' : ''}${me.out ? ' out' : ''}" data-side="${G.me}">${row(me)}${pbarHTML(s, me, hl)}</section>
      ${recapHTML()}
    </div>
    <div class="g-actions">${actionsHTML()}</div>
    <div class="tc-hand g-hand${myMove() ? '' : ' wait'}${me.out ? ' out' : ''}">${handHTML(s)}</div>
    <svg class="g-lines" aria-hidden="true"></svg>
    ${s.phase === 'over' ? overHTML() : ''}
    ${G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div></div>` : ''}`;
}

// ── updating the page in place ──────────────────────────────────────
// Rebuilding the whole table on every move made phones re-lay-out and
// repaint every card. Instead the new markup is merged into what is there:
// cards keep their elements (pictures, running animations, the hand's fan),
// and only what changed is touched.
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-uid') ?? n.getAttribute('data-side') ?? n.getAttribute('data-key') : null);
// Classes the animation layer puts on cards itself; a redraw leaves them alone.
const FX_CLASS = /^(fx-|dragging$|returning$|touched$|aim$|aiming$|drop-ok$)/;
const tplProps = new WeakMap(); // element -> style properties that came from the markup

function morphChildren(parent, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  syncChildren(parent, tpl.content);
}

function syncChildren(from, to) {
  const old = [...from.childNodes];
  const keyed = new Map();
  for (const n of old) { const k = keyOf(n); if (k != null) keyed.set(`${n.nodeName}|${k}`, n); }
  const loose = old.filter((n) => keyOf(n) == null);
  const used = new Set();
  let u = 0, i = 0;
  for (const nn of [...to.childNodes]) {
    const k = keyOf(nn);
    let match = null;
    if (k != null) match = keyed.get(`${nn.nodeName}|${k}`) || null;
    else {
      while (u < loose.length && used.has(loose[u])) u++;
      if (loose[u] && loose[u].nodeName === nn.nodeName) match = loose[u++];
    }
    if (match && !used.has(match)) {
      used.add(match);
      syncNode(match, nn);
      if (from.childNodes[i] !== match) from.insertBefore(match, from.childNodes[i] || null);
    } else {
      const fresh = document.importNode(nn, true);
      noteStyles(fresh);
      from.insertBefore(fresh, from.childNodes[i] || null);
    }
    i++;
  }
  while (from.childNodes.length > i) from.removeChild(from.lastChild);
}

// A node added fresh: remember which of its style properties came from the
// markup, so a later redraw that reuses it for something else clears them.
function noteStyles(node) {
  if (node.nodeType !== 1) return;
  for (const el of [node, ...node.querySelectorAll('[style]')]) {
    const st = el.getAttribute('style');
    if (st) tplProps.set(el, new Set(st.split(';').filter((d) => d.includes(':')).map((d) => d.slice(0, d.indexOf(':')).trim())));
  }
}

function syncNode(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.isEqualNode(b)) return;
  for (const { name } of [...a.attributes]) if (name !== 'class' && name !== 'style' && !b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) {
    if (name === 'class' || name === 'style') continue;
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  syncClass(a, b.getAttribute('class') || '');
  syncStyle(a, b.getAttribute('style') || '');
  syncChildren(a, b);
}

function syncClass(a, cls) {
  const want = new Set(cls.split(/\s+/).filter(Boolean));
  for (const c of [...a.classList]) if (!want.has(c) && !FX_CLASS.test(c)) a.classList.remove(c);
  for (const c of want) if (!a.classList.contains(c)) a.classList.add(c);
}

// Only the properties written in the markup are synced; the animation layer's own
// inline properties (fan slots, FLIP offsets) are left as they are.
function syncStyle(a, style) {
  const want = new Map();
  for (const decl of style.split(';')) {
    const at = decl.indexOf(':');
    if (at > 0) want.set(decl.slice(0, at).trim(), decl.slice(at + 1).trim());
  }
  const had = tplProps.get(a) || new Set();
  for (const p of had) if (!want.has(p)) a.style.removeProperty(p);
  for (const [p, v] of want) if (a.style.getPropertyValue(p).trim() !== v) a.style.setProperty(p, v);
  tplProps.set(a, new Set(want.keys()));
}

// Draw the position in G.view. No animation here.
function draw(root) {
  const s = S(), me = s.players[G.me];
  syncBlocks();
  if (s.phase === 'mulligan' && !me.mull) {
    root.className = 'g-mull';
    morphChildren(root, mulliganHTML() + (G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div></div>` : ''));
    return;
  }
  const cls = (s.players.length === 2 ? 'g-duel' : 'g-ffa') + (G.busy ? ' busy' : '') + (s.combat || G.atk ? ' fighting' : '') + (s.combat ? ' in-combat' : '') + (tutStep() ? ' lesson' : '');
  if (root.className !== cls) root.className = cls; // an unchanged class costs nothing to restyle
  morphChildren(root, tableHTML());
  FX.layoutHand(root.querySelector('.tc-hand'));
  // ring whatever the lesson (or a 💡 suggestion) is talking about
  const st = tutStep();
  const rings = st?.show || (G.suggest?.show && G.suggest.state === G.state ? G.suggest.show : null);
  if (rings && !G.sheet) for (const sel of rings) root.querySelectorAll(sel).forEach((el) => el.classList.add('coach-on'));
}

// Redraw after a tap: things that moved glide to their new places.
function redraw() {
  const root = document.getElementById('game');
  if (!root || !G) return;
  if (G.busy) { G.dirty = true; return; }
  const before = FX.capture(root);
  draw(root);
  drawLines(root);
  FX.flip(root, before, { duration: 260, enter: 'none' }).then(() => drawLines(root));
}

// Combat lines: attackers point at whoever they attack; blockers are tied to their attacker.
function drawLines(root) {
  const svg = root.querySelector('.g-lines');
  if (!svg || !G) return;
  const s = S();
  const rr = root.getBoundingClientRect();
  const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2, r }; };
  const card = (u) => root.querySelector(`.tcard[data-uid="${u}"]:not(.in-hand)`);
  const bar = (p) => root.querySelector(`.pbar[data-p="${p}"]`);
  const lines = [];
  const C = s.combat;
  if (C) {
    const blk = blockersOf(s);
    // blocked attackers face their blockers in the battle zone; the rest head for the player
    for (const a of C.att) if (!blk[a]?.length) lines.push([card(a), bar(C.d), 'attack']);
  } else if (G.atk) {
    for (const a of G.atk.att) if (G.atk.target != null) lines.push([card(a), bar(G.atk.target), 'attack']);
    for (const [a, p] of G.atk.hunt) lines.push([card(a), card(p), 'hunt']);
  }
  svg.setAttribute('viewBox', `0 0 ${rr.width} ${rr.height}`);
  svg.innerHTML = `<defs><marker id="gl-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ff7b4d"/></marker></defs>` +
    lines.filter(([a, b]) => a && b).map(([a, b, kind]) => {
      const p = at(a), q = at(b);
      // stop at the edge of the target rather than its middle
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const back = kind === 'attack' ? Math.min(q.r.height / 2 + 2, len / 3) : 0;
      const ex = q.x - (dx / len) * back, ey = q.y - (dy / len) * back;
      const mx = (p.x + ex) / 2 + dy * 0.12, my = (p.y + ey) / 2 - dx * 0.12;
      return `<path class="gl ${kind}" d="M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}"${kind === 'block' ? '' : ' marker-end="url(#gl-head)"'}/>`;
    }).join('');
}

// ── animation of a move ─────────────────────────────────────────────
async function present(events, after, quick = false) {
  const root = document.getElementById('game');
  if (!root || !G) return;
  if (quick) { G.view = after; draw(root); drawLines(root); return; }
  G.busy = true;
  root.classList.add('busy');
  try {
    if (events.length && root.querySelector('.g-table')) await capped(animateOld(root, events, after), 20000);
  } catch (e) { console.error(e); }
  if (events.some((e) => e.k === 'fight')) G.fightNote = fightNoteText(events);
  G.showBlk = null;
  const before = FX.capture(root);
  G.view = after;
  G.dirty = false;
  draw(root);
  drawLines(root);
  try {
    await capped(FX.flip(root, before), 2500);
    drawLines(root);
    await capped(animateNew(root, events), 2500);
  } catch (e) { console.error(e); }
  G.busy = false;
  root.classList.remove('busy');
  if (G.dirty) redraw();
}

const el = (root, uid) => root.querySelector(`.tcard[data-uid="${uid}"]:not(.in-hand), .relic[data-uid="${uid}"]`);
const barEl = (root, p) => root.querySelector(`.pbar[data-p="${p}"]`);
const DMG = new Set(['strike', 'dmg', 'hitPlayer', 'life', 'buff']);

// On the old table: show what happens, in order.
async function animateOld(root, events, after = G.state) {
  const s0 = S();
  let i = 0;
  const lifeShown = new Set();
  while (i < events.length) {
    const e = events[i];
    if (e.k === 'play') {
      i++;
      const d = e.cid ? BY_ID[e.cid] : null;
      const from = e.p === G.me ? root.querySelector(`.tcard[data-uid="${e.uid}"]`)?.getBoundingClientRect() : barEl(root, e.p)?.getBoundingClientRect();
      if (e.p === G.me && (!d || d.type !== 'spell')) continue; // your creatures and Relics glide over from your hand
      const html = d ? cardHTML(d) : cardBackHTML();
      if (e.p === G.me) root.querySelector(`.tcard[data-uid="${e.uid}"]`)?.classList.add('fx-hidden');
      const target = e.target ? (e.target.p != null ? barEl(root, e.target.p) : el(root, e.target.uid)) : e.sac != null ? el(root, e.sac) : null;
      const look = { fromRect: from, hold: e.p === G.me ? 350 : d ? 1050 : 650, flip: e.p !== G.me && !!d, width: e.p === G.me ? 0.55 : 0.7 };
      if (d && d.type === 'spell') {
        // what the spell does is everything up to the next move
        let j = i;
        while (j < events.length && !['play', 'attack', 'turn', 'fight'].includes(events[j].k)) j++;
        const effects = events.slice(i, j);
        i = j;
        const effect = async () => {
          const ar = target && FX.arrow(barEl(root, e.p), target, { duration: 600, color: colorOf(e.cid) });
          if (ar) await ar.finished;
          await animateOld(root, effects, after);
        };
        // it lands on its owner's discard pile (tokens vanish, Echo cards leave the game)
        const pile = after.cards[e.uid]?.zone === 'discard' ? root.querySelector(`.tc-pile[data-pile="${s0.cards[e.uid]?.owner ?? e.p}"]`) : null;
        await FX.showCard(html, { ...look, ...(pile ? { toPile: pile } : {}), during: effect });
        continue;
      }
      // An opponent's creature or Relic is put down where it will sit.
      const toRect = e.p !== G.me && d ? landingRect(root, e.p, d.type) : undefined;
      await FX.showCard(html, { ...look, toRect });
      continue;
    }
    if (e.k === 'attack') {
      const group = [];
      while (i < events.length && events[i].k === 'attack') group.push(events[i++]);
      const d = group[0].target.p;
      const atk = s0.cards[group[0].uid]?.ctrl;
      const label = d === G.me ? `${name(atk)} attacks you!` : atk === G.me ? `You attack ${name(d)}` : `${name(atk)} attacks ${name(d)}`;
      const sub = group.length > 2 ? `with ${group.length} creatures` : `with ${listNames(group.map((g) => BY_ID[s0.cards[g.uid].cid].name))}`;
      const arrows = group.map((g) => FX.arrow(el(root, g.uid), barEl(root, d), { duration: 1000, color: '#ff6a3d' }));
      // the whole screen only when it's about you; two others fighting gets a note
      const say = d === G.me || atk === G.me ? FX.banner(label, { sub, tone: d === G.me ? 'foe' : 'mine' }) : toast(`⚔ ${label}`);
      await Promise.all([say, ...arrows.map((a) => a?.finished)]);
      continue;
    }
    if (e.k === 'block') {
      const group = [];
      while (i < events.length && events[i].k === 'block') group.push(events[i++]);
      await Promise.all(group.map((g) => FX.arrow(el(root, g.uid), el(root, g.att), { duration: 550, color: '#bfe6ff' })?.finished));
      // The blockers step into the battle zone before the fight plays out
      // (when nobody can answer with a Trick, the fight comes in the same move).
      G.showBlk = {};
      for (const g of group) (G.showBlk[g.att] ||= []).push(g.uid);
      const before = FX.capture(root);
      draw(root);
      drawLines(root);
      await capped(FX.flip(root, before), 900);
      await FX.wait(300);
      continue;
    }
    if (e.k === 'fight' || e.k === 'strike') {
      // One damage step: everything that strikes at the same time.
      if (e.k === 'fight') i++;
      const strikes = [];
      while (i < events.length && DMG.has(events[i].k)) {
        const x = events[i++];
        if (x.k === 'strike') strikes.push({ from: x.uid, to: x.to, n: 0 });
        else if ((x.k === 'dmg' || x.k === 'hitPlayer') && x.src != null) { const sk = [...strikes].reverse().find((t) => t.from === x.src); if (sk) sk.n += x.n; }
        else if (x.k === 'life' && x.n > 0) lifeShown.add(x);
      }
      await strikeAll(root, strikes);
      continue;
    }
    if (e.k === 'die') {
      const group = [];
      while (i < events.length && events[i].k === 'die') group.push(events[i++]);
      const deaths = group.map((g) => {
        const node = el(root, g.uid);
        return node ? FX.death(node, { style: BY_ID[g.cid]?.token ? 'light' : 'crumble', color: colorOf(g.cid) }) : null;
      });
      await Promise.race([Promise.all(deaths), FX.wait(1000)]);
      continue;
    }
    if (e.k === 'dmg' || e.k === 'hitPlayer' || e.k === 'buff' || e.k === 'life') {
      // Damage from spells and abilities, life changes, boosts: all at once.
      const group = [];
      while (i < events.length && ['dmg', 'hitPlayer', 'buff', 'life'].includes(events[i].k)) group.push(events[i++]);
      const dmg = group.filter((g) => g.k === 'dmg');
      if (dmg.length >= 3 && !dmg[0].src) {
        await Promise.race([FX.wave(root.querySelector('.g-table'), { color: '#ff8a3d', targets: dmg.map((g) => el(root, g.uid)).filter(Boolean) }), FX.wait(650)]);
      }
      const hits = new Set(group.filter((g) => g.k === 'hitPlayer').map((g) => g.p));
      group.forEach((g) => {
        if (g.k === 'dmg') { const n = el(root, g.uid); if (!n) return null; if (dmg.length < 3) FX.impact(n, { strength: g.n }); return FX.number(n, `−${g.n}`, { kind: 'damage' }); }
        if (g.k === 'hitPlayer') { const b = barEl(root, g.p); FX.impact(b, { strength: g.n }); return FX.number(b, `−${g.n}`, { kind: 'damage' }); }
        if (g.k === 'life') {
          if (lifeShown.has(g) || (g.n < 0 && hits.has(g.p))) return null;
          return FX.number(barEl(root, g.p), g.n > 0 ? `+${g.n}` : `−${-g.n}`, { kind: g.n > 0 ? 'heal' : 'damage' });
        }
        if (g.k === 'buff') {
          const n = el(root, g.uid);
          if (!n || (!g.dP && !g.dV)) return n ? FX.burst(n, { color: '#b07cff' }) : null;
          return FX.number(n, g.dV ? `+${g.dP}/+${g.dV}` : `+${g.dP}`, { kind: 'buff' });
        }
        return null;
      });
      await FX.wait(group.some((g) => g.k !== 'buff') ? 420 : 260);
      continue;
    }
    i++;
    switch (e.k) {
      case 'trap': {
        const d = BY_ID[e.cid];
        await Promise.all([FX.banner('Trap!', { sub: `${name(e.p)}: ${d.name}`, tone: e.p === G.me ? 'mine' : 'foe' }),
          FX.showCard(cardHTML(d), { fromRect: barEl(root, e.p)?.getBoundingClientRect(), hold: 900, flip: true })]);
        break;
      }
      case 'breath': {
        const side = root.querySelector(`.g-side[data-side="${e.p}"]`);
        await FX.wave(side || root, { color: '#ff7a2e', dir: 'down' });
        break;
      }
      case 'clash': await FX.clash(el(root, e.uid), el(root, e.to), { color: colorOf(s0.cards[e.uid]?.cid) }); break;
      case 'countered': await FX.banner('Canceled!', { sub: 'Countercurrent', tone: 'info' }); break;
      case 'bounce': case 'transform': case 'freeze': case 'steal': {
        const n = el(root, e.uid);
        if (n) await FX.burst(n, { color: e.k === 'freeze' ? '#d6ecff' : e.k === 'steal' ? '#ff9a6b' : '#8fe0ee' });
        break;
      }
      case 'use': {
        // an ability (or the Bone Altar): a gold flash, the Energy paid, a line to its target
        const n = el(root, e.uid), d = BY_ID[e.cid], ab = d?.ability;
        if (ab && e.p !== G.me) toast(`⚡ ${name(e.p)}: ${d.name}, ${ab.short}`, 1600);
        if (n) { FX.burst(n, { color: ab ? '#ffd76a' : '#b07cff' }); if (ab) FX.number(n, `⚡${ab.cost}`, { kind: 'buff' }); }
        const t = e.target?.uid != null ? el(root, e.target.uid) : null;
        const ar = n && t && FX.arrow(n, t, { duration: 550, color: '#ffd76a' });
        if (ar) await ar.finished; else await FX.wait(ab && e.p !== G.me ? 700 : 380);
        break;
      }
      case 'crown': {
        const msg = e.p == null ? 'The Crown is back in the middle' : e.p === G.me ? 'You take the Crown!' : `${name(e.p)} takes the Crown!`;
        const sub = e.p == null ? 'Hit someone in a fight to take it' : e.p === G.me ? 'You draw an extra card at the end of each of your turns' : 'Hit them in a fight to take it';
        // the first Crown, and any Crown you win or lose, get the whole screen; the rest a note
        const big = e.p === G.me || e.from === G.me || e.from == null;
        await Promise.all([
          big ? FX.banner(msg, { sub, tone: e.p === G.me ? 'mine' : e.from === G.me ? 'foe' : 'info' }) : toast(`👑 ${msg}`),
          flyCrown(root, e.from != null ? barEl(root, e.from) : null, e.p != null ? barEl(root, e.p) : null),
        ]);
        break;
      }
      case 'crownDraw': { const b = barEl(root, e.p); if (b) await FX.number(b, '👑 +1 card', { kind: 'buff' }); break; }
      case 'chime': { const n = el(root, e.uid); if (n) await FX.number(n, `🔔 ${e.n || 3}/3`, { kind: 'buff' }); break; }
      default: break;
    }
  }
}

// A quiet note at the top of the table for what doesn't need the whole screen
// (someone else's turn, two others fighting). It lives outside the redrawn table.
function toast(text, ms = 1300) {
  document.querySelectorAll('.g-toast').forEach((x) => x.remove());
  const box = document.createElement('div');
  box.className = 'g-toast';
  box.textContent = text;
  document.body.appendChild(box);
  const anim = box.animate([
    { opacity: 0, transform: 'translate(-50%, -6px)' },
    { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.12 },
    { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.82 },
    { opacity: 0, transform: 'translate(-50%, -4px)' },
  ], { duration: ms, fill: 'forwards' });
  // the game waits only for the first moment of it
  anim.finished.catch(() => {}).then(() => box.remove());
  return FX.wait(Math.min(ms, 700));
}

// The Crown flies from its old holder's name (or the middle) to the new one's.
async function flyCrown(root, fromEl, toEl) {
  const box = document.createElement('div');
  box.className = 'fx-crown';
  box.innerHTML = ICON.crown;
  box.style.left = '0';
  box.style.top = '0';
  document.body.appendChild(box);
  const rr = root.getBoundingClientRect();
  const spot = (bar) => {
    if (!bar) return { x: rr.left + rr.width / 2, y: rr.top + rr.height * 0.45 };
    const r = (bar.querySelector('.pb-name') || bar).getBoundingClientRect();
    return { x: r.left + 12, y: r.top + r.height / 2 };
  };
  const a = spot(fromEl), b = spot(toEl);
  const at = (p, sc, o) => ({ transform: `translate(${p.x - 17}px, ${p.y - 15}px) scale(${sc})`, opacity: o });
  try {
    await box.animate([
      at(a, fromEl ? 0.7 : 0.3, fromEl ? 1 : 0),
      { ...at({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 50 }, 1.7, 1), offset: 0.45 },
      at(b, toEl ? 0.65 : 0.3, toEl ? 1 : 0),
    ], { duration: 1150, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).finished;
  } catch { /* the page went away */ }
  box.remove();
}

// Where a newly played card will land: the end of that player's row (a Relic: their bar).
function landingRect(root, p, type) {
  if (type === 'relic') { const r = barEl(root, p)?.getBoundingClientRect(); return r && new DOMRect(r.left + 8, r.top, 40, r.height); }
  const row = root.querySelector(`.g-side[data-side="${p}"] .tc-row`);
  if (!row) return undefined;
  const cards = row.querySelectorAll('.tcard');
  const last = cards[cards.length - 1]?.getBoundingClientRect();
  const w = last?.width || parseFloat(getComputedStyle(row).getPropertyValue('--w-board-max')) || 64;
  const h = last?.height || w * 1.33;
  const r = row.getBoundingClientRect();
  const x = last ? Math.min(last.right + 6 + w / 2, r.right - w / 2) : r.left + r.width / 2;
  return new DOMRect(x - w / 2, r.top + (r.height - h) / 2, w, h);
}

// Every strike in one damage step at once: pairs that hit each other clash.
// One pair at a time, in the spotlight: the rest of the table dims, the two
// creatures fight (or the attacker charges the player), the numbers stay up
// long enough to read, then the next pair.
async function strikeAll(root, strikes) {
  const done = new Set();
  const hit = (target, n) => { if (target && n) FX.number(target, `−${n}`, { kind: 'damage' }); };
  root.classList.add('spotlight');
  for (const sk of strikes) {
    if (done.has(sk)) continue;
    done.add(sk);
    const a = el(root, sk.from);
    const toPlayer = sk.to && typeof sk.to === 'object';
    const b = toPlayer ? barEl(root, sk.to.p) : el(root, sk.to);
    const back = !toPlayer && strikes.find((t) => !done.has(t) && t.from === sk.to && t.to === sk.from);
    if (back) done.add(back);
    if (!a || !b) continue;
    const lit = [a, b, a.closest('.gb-col')].filter(Boolean);
    lit.forEach((x) => x.classList.add('focus'));
    await FX.wait(160);
    if (back) await FX.clash(a, b, { strength: Math.max(sk.n, back.n), onHit: () => { hit(b, sk.n); hit(a, back.n); } });
    else await FX.lunge(a, b, { strength: sk.n, color: toPlayer ? '#ff6a3d' : undefined, onHit: () => hit(b, sk.n) });
    await FX.wait(420);
    lit.forEach((x) => x.classList.remove('focus'));
  }
  root.classList.remove('spotlight');
}

// One line saying how a fight ended, shown until the next move.
function fightNoteText(events) {
  const s0 = S();
  const lost = new Map();
  for (const e of events) if (e.k === 'hitPlayer') lost.set(e.p, (lost.get(e.p) || 0) + e.n);
  const bits = [...lost].map(([p, n]) => `${p === G.me ? 'You' : esc(shortName(s0.players[p].name))} took <b>${n}</b>`);
  const died = events.filter((e) => e.k === 'die' && BY_ID[e.cid]?.type === 'creature')
    // with three players, "their" could be anyone's: name the owner
    .map((e) => `${e.ctrl === G.me ? 'your' : s0.players.length > 2 ? esc(poss(shortName(s0.players[e.ctrl].name))) : 'their'} ${esc(BY_ID[e.cid].name)}`);
  if (died.length) bits.push(`${listNames(died)} died`);
  return bits.length ? `⚔ ${bits.join(' · ')}` : '⚔ Nobody was hurt.';
}

// On the new table: turn banners.
async function animateNew(root, events) {
  const turn = events.find((e) => e.k === 'turn');
  if (!turn) return;
  const P = S().players[turn.p];
  // a new turn's banner replaces any that is still on screen (bots can be quick)
  document.querySelectorAll('#fx-layer .fx-banner').forEach((b) => b.remove());
  if (turn.p === G.me) {
    G.recap = S().turn;
    redraw();
    FX.banner('Your turn', { sub: `${P.energy} Energy`, tone: 'mine' });
    // what the others did to you meanwhile, in one number on your bar
    const lost = recapInfo()?.lost || 0;
    if (lost > 0 && !tutStep()) FX.number(barEl(root, G.me), `−${lost}`, { kind: 'damage' });
  }
  else toast(`${poss(shortName(P.name))} turn`, 1100);
  await FX.wait(turn.p === G.me ? 250 : 450);
}

function mulliganHTML() {
  const s = S(), me = s.players[G.me];
  const first = s.players[s.first];
  return `<div class="g-full" data-key="mull">
    <div class="kicker muted small" style="letter-spacing:.2em">YOUR OPENING HAND</div>
    <h2>${s.first === G.me ? 'You go first' : `${esc(shortName(first.name))} goes first`}</h2>
    <p class="muted small" style="margin:0">${s.first === G.me ? 'Going first, you skip your first draw.' : 'You start with a Spark: a free card that gives 1 extra Energy.'}</p>
    <div class="hand-row">${me.hand.map((u) => `<div class="mull-card" data-mull="${u}">${cardHTML(BY_ID[s.cards[u].cid])}</div>`).join('')}</div>
    <p class="muted small" style="margin:0">Tap a card to read it.</p>
    <p class="muted small" style="margin:0">Keep these, or shuffle them back and draw ${RULES.openingHand} new cards (once).</p>
    <p class="small" style="margin:0;color:#cfe6f5">💡 Not sure? The bot would ${chooseAction(s, G.me).redraw ? 'draw a new hand: too few cheap cards, or too many expensive ones' : 'keep this hand'}.</p>
    <div class="btn-row"><button class="btn primary" data-act="keep">Keep</button><button class="btn" data-act="redraw">Draw a new hand</button></div>
    <button class="btn ghost small" data-act="leave">Leave game</button>
  </div>`;
}

function overHTML() {
  const s = S();
  const win = s.winner === G.me;
  return `<div class="g-sheet"><div class="g-sheet-inner g-full" style="min-height:70vh;justify-content:center">
    <div class="winner">${win ? 'You win!' : `${esc(shortName(s.players[s.winner]?.name || 'Nobody'))} wins`}</div>
    <div class="over-how">${s.log.slice(-4).filter((l) => !/ wins!$|ends their turn|'s turn\.$/.test(l.text)).slice(-2).map((l) => `<div>${esc(speak(l.text))}</div>`).join('')}</div>
    <p class="muted">${win ? 'Well played.' : G.mode === 'practice' ? 'Take it back with ↶, or try again.' : 'Good game.'}</p>
    <div class="btn-row">
      ${G.mode === 'online'
        ? '<button class="btn primary" data-act="lobby">Back to the lobby (swap cards, play again)</button>'
        : G.mode === 'tutorial'
          ? '<button class="btn primary" data-act="leave">Try a real practice game</button><button class="btn" data-act="tutorial">Replay the lesson</button>'
          : `<button class="btn primary" data-act="rematch">Play again</button>${!win ? '<button class="btn" data-act="undo">Take back a move</button>' : ''}`}
      <button class="btn ghost" data-act="leave">Leave</button>
    </div></div></div>`;
}

// ── sheets ──────────────────────────────────────────────────────────
function kwHelp(card, extra = []) {
  const text = `${card.text || ''} ${extra.map((k) => KEYWORDS[k]?.name || '').join(' ')}`;
  const list = Object.values(KEYWORDS).filter((k) => k !== KEYWORDS.ability && new RegExp('\\b' + k.name + '\\b', 'i').test(text));
  if (card.ability) list.push(KEYWORDS.ability);
  return list.map((k) => `<div><b>${k.name}</b> — ${esc(k.text)}</div>`).join('');
}

function cardSheet(uid, { from = 'hand' } = {}) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const onBoard = c.zone === 'board';
  // the baked picture: drawing the live art the first time can stall a phone for a moment
  const opts = onBoard ? { power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0) } : { cost: c.owner === G.me && c.zone === 'hand' ? costOf(s, G.me, c, from) : d.cost };
  let actions = '', note = '';
  const granted = onBoard ? FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k) && !d.keywords.includes(k)) : [];
  if (c.owner === G.me && s.phase !== 'mulligan' && (c.zone === 'hand' || (from === 'discard' && d.echo))) {
    let why = playable(uid, from);
    const cost = costOf(s, G.me, c, from);
    // in the lesson, only the card the coach is asking for can be played
    const st = tutStep();
    let advice = '';
    if (st && !why) {
      if (st.expect?.t === 'play' && st.expect.cid === c.cid) advice = st.sheet || '';
      else why = st.expect?.t === 'play' ? `For now, play ${BY_ID[st.expect.cid].name} (it's glowing).` : 'Not yet: follow the box on the table first.';
    }
    actions = `<button class="btn primary" data-act="${from === 'discard' ? 'echo' : 'play'}" data-uid="${uid}" ${why ? 'disabled' : ''}>${from === 'discard' ? 'Play with Echo' : 'Play'} · ${cost} Energy</button>`;
    if (why) note = `<div class="why">${esc(why)}</div>`;
    if (advice) note = `<div class="coach coach-sheet"><div class="coach-text">${esc(advice)}</div></div>`;
  }
  if (onBoard) {
    const bits = [];
    if (c.dmg) bits.push(`${c.dmg} damage this turn (heals at the end of the turn)`);
    if (c.ex) bits.push(c.frozen ? 'Exhausted, and pinned: it stays down through its next turn' : 'Exhausted: it can’t attack or block until its controller’s next turn');
    if (c.stolen) bits.push(`Borrowed from ${shortName(s.players[c.stolen.back].name)} until the end of the turn`);
    if (c.owner !== c.ctrl && !c.stolen) bits.push(`Taken from ${shortName(s.players[c.owner].name)} for good`);
    if (c.sacEnd) bits.push('Borrowed Time: it leaves at the end of this turn');
    if (c.baseCid) bits.push(`Really ${BY_ID[c.baseCid].name}: it turns back if it leaves play`);
    if (c.ctrl === G.me) {
      if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) actions = `<button class="btn primary" data-act="attack-from-sheet" data-uid="${uid}">${G.atk?.att.includes(uid) ? 'Keep it home' : 'Send it into the attack'}</button>`;
      else if (c.played === s.turn && s.active === G.me && !hasKw(s, c, 'rush')) bits.push('Arrived this turn: it can attack next turn (it can block already)');
      if (d.ability) {
        const why = abilityBlocked(uid);
        actions = `<button class="btn primary ab-btn" data-act="use-ability" data-uid="${uid}" ${why ? 'disabled' : ''}>⚡ Pay ${d.ability.cost} Energy: ${esc(d.ability.short)}</button>${actions.replace('btn primary', 'btn')}`;
        if (why) bits.push(`Ability: ${why}`);
      }
    } else if (d.ability) bits.push(c.usedOn === s.turn ? 'Its ability was used this turn' : `Its ability: pay ${d.ability.cost} Energy for ${d.ability.short}`);
    if (bits.length) note = `<div class="sheet-note">${bits.map(esc).join('<br>')}</div>`;
  }
  if (c.zone === 'relic') {
    const bits = [];
    if (c.cid === 'the-drowned-clock') bits.push(`Chimes so far: ${c.chimes || 0} of 3`);
    if (c.cid === 'bone-altar' && c.ctrl === G.me) {
      const ok = myMove() && s.active === G.me && c.usedOn !== s.turn && s.players[G.me].board.length > 0;
      actions = `<button class="btn primary" data-act="use" data-uid="${uid}" ${ok ? '' : 'disabled'}>Sacrifice a creature to draw a card</button>`;
      if (c.usedOn === s.turn) bits.push('Already used this turn');
    }
    if (bits.length) note = `<div class="sheet-note">${bits.map(esc).join('<br>')}</div>`;
  }
  return `${cardHTML(d, opts)}${note}<div class="kw-help">${kwHelp(d, granted)}</div>
    <div class="btn-col">${actions}<button class="btn ghost" data-act="close">Close</button></div>`;
}

function choiceSheet(st) {
  const s = S(), P = s.players[G.me];
  const cards = (uids, chosen = []) => `<div class="choice-grid">${uids.map((u) => {
    const c = s.cards[u];
    const whose = c.owner !== G.me ? `<div class="choice-owner">${esc(poss(shortName(s.players[c.owner].name)))}</div>` : '';
    return `<div data-choice="${u}" class="${chosen.includes(u) ? 'chosen' : ''}">${cardHTML(BY_ID[c.cid])}${whose}</div>`;
  }).join('')}</div>`;
  const cancel = '<button class="btn ghost" data-act="cancel">Cancel</button>';
  switch (st.kind) {
    case 'pick': {
      const title = G.flow.a.uid && s.cards[G.flow.a.uid].cid === 'the-barrow-queen' ? 'Bring back a creature from any discard pile' : 'Choose a creature from your discard pile';
      return `<h3>${title}</h3>${cards(st.options)}<div class="btn-col">${st.optional ? '<button class="btn" data-act="skip">Bring nothing back</button>' : ''}${cancel}</div>`;
    }
    case 'picks':
      return `<h3>Return up to three Spells</h3>${cards(st.options, G.flow.multi)}
        <div class="btn-col"><button class="btn primary" data-act="done-picks">Return ${G.flow.multi.length}</button>${cancel}</div>`;
    case 'keep':
      return `<h3>Memory Diver</h3><p class="sheet-note">The top ${st.options.length} cards of your deck. Keep one; the rest go to your discard pile.</p>${cards(st.options)}<div class="btn-col">${cancel}</div>`;
    case 'bottom':
      return `<h3>Curious Wisp</h3><p class="sheet-note">The top card of your deck:</p>${cards(st.options)}
        <div class="btn-col"><button class="btn" data-act="wisp-top">Leave it on top</button><button class="btn" data-act="wisp-bottom">Put it on the bottom</button>${cancel}</div>`;
    case 'discard': {
      const drawn = P.deck.slice(0, 2);
      return `<h3>Second Thought</h3><p class="sheet-note">You will draw ${drawn.map((u) => esc(BY_ID[s.cards[u].cid].name)).join(' and ') || 'nothing'}. Then discard one card:</p>${cards(st.options)}<div class="btn-col">${cancel}</div>`;
    }
    case 'tax': {
      const owner = countercurrentOwner(s);
      const cost = costOf(s, G.me, s.cards[G.flow.a.uid], G.flow.a.from || 'hand');
      const left = P.energy - cost;
      return `<h3>Countercurrent</h3><p class="sheet-note">${esc(shortName(owner.name))} has a Countercurrent set. Your next Spell is canceled unless you pay 2 more Energy.</p>
        <div class="btn-col"><button class="btn primary" data-act="tax-pay" ${left >= 2 ? '' : 'disabled'}>Pay 2 more (${left} left after the card)</button>
        <button class="btn" data-act="tax-no">Play it anyway (it will be canceled)</button>${cancel}</div>`;
    }
  }
  return '';
}

function discardSheet(pi) {
  const s = S(), P = s.players[pi];
  const list = [...P.discard].reverse();
  const items = list.map((u) => {
    const d = BY_ID[s.cards[u].cid];
    const echo = pi === G.me && d.echo;
    return `<div>${cardHTML(d)}${echo ? `<button class="btn small primary" style="width:100%;margin-top:6px" data-act="echo-open" data-uid="${u}">Echo ${d.echo}</button>` : ''}</div>`;
  }).join('');
  return `<h3>${pi === G.me ? 'Your' : esc(poss(shortName(P.name)))} discard pile (${list.length})</h3>
    ${list.length ? `<div class="choice-grid big">${items}</div>` : '<p class="sheet-note">Empty.</p>'}
    ${P.exile.length ? `<p class="sheet-note">Removed from the game: ${P.exile.map((u) => esc(BY_ID[s.cards[u].cid].name)).join(', ')}</p>` : ''}
    <div class="btn-col"><button class="btn ghost" data-act="close">Close</button></div>`;
}

// Tap a player's bar: everything about them, in words.
function playerSheet(pi) {
  const s = S(), P = s.players[pi], mine = pi === G.me;
  const who = mine ? 'You' : esc(shortName(P.name));
  const rows = [
    ['Life', P.out ? 'out of the game' : P.life],
    ['Energy', `${P.energy} now, ${P.maxEnergy} at the start of ${mine ? 'your' : 'their'} turn`],
    ['Cards in hand', P.hand.length],
    ['Cards left in the deck', P.deck.length],
    ['Discard pile', `${P.discard.length} card${P.discard.length === 1 ? '' : 's'}`],
    ...(P.traps.length ? [['Face-down Traps', P.traps.length]] : []),
    ...(s.crownOn ? [['The Crown', s.crown === pi ? (mine ? 'yours: an extra card at the end of each of your turns' : 'theirs: hit them in a fight to take it') : 'no']] : []),
  ];
  const relics = P.relics.map((u) => BY_ID[s.cards[u].cid]).map((d) => `<div><b>${esc(d.name)}</b> — ${esc(d.text.replace(/^Relic\n/, ''))}</div>`).join('');
  return `<h3>${who}</h3>
    <div class="pl-rows">${rows.map(([k, v]) => `<div>${k}</div><div>${typeof v === 'number' ? v : esc(String(v))}</div>`).join('')}</div>
    ${relics ? `<div class="kw-help"><div class="sheet-note" style="text-align:left;margin:0 0 4px">Relics</div>${relics}</div>` : ''}
    <div class="btn-col">${P.discard.length ? `<button class="btn" data-act="discards" data-of="${pi}">Look at the discard pile</button>` : ''}<button class="btn ghost" data-act="close">Close</button></div>`;
}

function menuSheet() {
  return `<h3>Menu</h3><div class="btn-col">
    ${G.mode === 'practice' ? '<button class="btn" data-act="undo">↶ Take back my last move</button>' : ''}
    <button class="btn" data-act="log">Game log</button>
    <button class="btn" data-act="speed">${fastOn() ? 'Animations: fast (tap for normal)' : 'Animations: normal (tap for fast)'}</button>
    <button class="btn" data-act="fixes">Fix something</button>
    <button class="btn" data-act="rules">How to play (leaves the table; resume from Play)</button>
    <button class="btn danger" data-act="concede">${G.concedeArm && Date.now() - G.concedeArm < 4000 ? 'Tap again to concede' : 'Concede'}</button>
    <button class="btn ghost" data-act="leave">Leave (${G.mode === 'practice' ? 'you can resume later' : 'the game continues'})</button>
    <button class="btn ghost" data-act="close">Back to the game</button></div>`;
}

function helpSheet() {
  return `<h3>How the table works</h3>
    <div class="help-list">
      <div><b>Top: your opponents.</b> Name, Life ❤, Energy ⚡ and cards in hand. <b>Tap anyone’s bar</b> for the rest: their deck, discard pile and Relics. ⊠ is a face-down Trap.</div>
      <div><b>Creatures</b>: theirs above, yours below. Left number = <b>Power</b> (damage it deals), right = <b>Vitality</b> (damage it can take). Small badges are keywords; tap any card to read it.</div>
      <div><b>Play a card</b>: drag it from your hand up onto the table, or tap it and tap Play. Glowing cards can be played now.</div>
      <div><b>Attack</b> (once a turn): tap your glowing creatures and they step into the middle of the table, then tap <b>Attack!</b> (bottom right). Attackers are exhausted afterwards: they can’t block until your next turn.</div>
      <div><b>Block</b>: when you are attacked, the attackers come to the middle. Tap one of your creatures and it steps in front of an attacker (if it could stop several, tap the one you want). Then <b>Done</b>. The line above tells you what will happen.</div>
      <div><b>Team up</b>: several of your creatures can block the same attacker. They all hit it, and it splits its damage among them, destroying the costliest ones it can.</div>
      <div><b>The fight</b> plays out one pair at a time, in the middle. <b>Tricks</b> and abilities can be used before it starts; tap <b>Fight!</b> when you are done.</div>
      <div><b>⚡ Abilities</b>: some creatures say “Pay 2 Energy: …”. Tap the ⚡ chip on the card (it glows when you can use it). Each works once a turn: on your turn, or in a fight you are in.</div>
      ${S().crownOn ? '<div><b>👑 The Crown</b> (three players): the first player to hit someone in a fight takes it. Whoever holds it draws an extra card at the end of each of their turns. Hit the holder in a fight and it’s yours.</div>' : ''}
      <div>The main button (End turn, Attack!, Done, Fight!) is always at the bottom right.</div>
      <div><b>💡 Suggest</b> (bottom left) asks the bot what it would do in your place: it spells out the move and rings the cards. Tap <b>Do it</b> to make that move, or do something else.</div>
      <div><b>Is it ready?</b> A <b>gold glow</b> means it can act now. <b>zZ</b> means it just arrived: it can block, but it can’t attack until your next turn. Turned sideways, with ↻ in its corner, means it attacked: it can’t attack or block until its owner’s next turn.</div>
      <div><b>Discard piles</b> sit at the end of each player’s bar. Spells land there when they’re done; tap a pile to look through it.</div>
      <div><b>End turn</b> when you’re finished. Energy you don’t spend waits for your next turn, so you can answer attacks with Tricks.</div>
    </div>
    <div class="btn-col">
      ${G.mode === 'online' ? '' : '<button class="btn" data-act="tutorial">Play the guided lesson</button>'}
      <button class="btn ghost" data-act="close">Back to the game</button></div>`;
}

function logSheet() {
  const items = G.state.log.map((l) => `<div class="${/’s turn\.$|'s turn\.$/.test(l.text) ? 'turn' : ''}">${esc(speak(l.text))}</div>`).join('');
  setTimeout(() => { const box = document.querySelector('.log-list'); if (box) box.scrollTop = box.scrollHeight; }, 0);
  return `<h3>Game log</h3><div class="log-list">${items}</div><div class="btn-col"><button class="btn ghost" data-act="close">Close</button></div>`;
}

function fixSheet() {
  const s = G.state;
  const rows = s.players.map((P) => `<div>${esc(shortName(P.name))} · Life ${P.life}</div>
      <button class="btn small" data-act="fix-life" data-p="${P.i}" data-n="-1">−1</button>
      <button class="btn small" data-act="fix-life" data-p="${P.i}" data-n="1">+1</button>`).join('');
  return `<h3>Fix something</h3><p class="sheet-note">If the game ever gets a rule wrong, put it right here. Everyone sees the fix in the log.</p>
    <div class="fix-grid">${rows}
      <div>Your Energy · ${s.players[G.me].energy}</div>
      <button class="btn small" data-act="fix-energy" data-n="-1">−1</button>
      <button class="btn small" data-act="fix-energy" data-n="1">+1</button></div>
    <div class="btn-col"><button class="btn ghost" data-act="close">Done</button></div>`;
}

// ── playing a card, one choice at a time ───────────────────────────
function startPlay(uid, from = 'hand') {
  G.sheet = null;
  G.atk = null;
  G.flow = { a: { t: 'play', p: G.me, uid, ...(from === 'discard' ? { from } : {}) }, steps: stepsFor(uid, from), i: 0, multi: [] };
  nextChoice();
}

// Dropped from the hand onto the table: play it now, or ask what it needs first.
function dropPlay(uid) {
  if (playable(uid)) return false;
  const steps = stepsFor(uid, 'hand');
  if (steps.length) { startPlay(uid, 'hand'); return false; }
  return dispatch({ t: 'play', p: G.me, uid });
}

function nextChoice() {
  const f = G.flow;
  if (f.i >= f.steps.length) { G.flow = null; G.sheet = null; dispatch(f.a); if (G && !G.busy) redraw(); return; }
  const st = f.steps[f.i];
  G.sheet = ['pick', 'picks', 'keep', 'bottom', 'discard', 'tax'].includes(st.kind) ? choiceSheet(st) : null;
  redraw();
}

function chooseOnTable(t) {
  const f = G.flow, st = f.steps[f.i];
  if (!st.options.some((o) => sameT(o, t))) return false;
  if (st.kind === 'sac') { f.a.sac = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'fighter') { f.a.fighter = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'target') {
    if (t.uid != null && (t.uid === f.a.sac || t.uid === f.a.fighter)) return false;
    f.a.target = t; f.i++; nextChoice(); return true;
  }
  if (st.kind === 'targets') {
    const k = f.multi.indexOf(t.uid);
    if (k >= 0) f.multi.splice(k, 1); else f.multi.push(t.uid);
    if (f.multi.length === st.count) { f.a.targets = [...f.multi]; f.multi = []; f.i++; nextChoice(); }
    else redraw();
    return true;
  }
  return false;
}

// ── input ───────────────────────────────────────────────────────────
let flashTimer;
function flash(msg) {
  document.querySelector('.toast')?.remove();
  const box = document.createElement('div');
  box.className = 'toast';
  box.style.zIndex = 90;
  box.textContent = msg;
  document.body.appendChild(box);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => box.remove(), 2400);
}

function onClick(e) {
  if (!G) return;
  const s = S();
  const t = e.target;
  const actEl = t.closest('[data-act]');
  // "Since your last turn" goes away at the first tap anywhere (and the tap still counts)
  if (G.recap != null && !t.closest('.recap-pop')) { G.recap = null; if (!actEl) redraw(); }
  if (actEl && !t.closest('.relic')) { onAct(actEl.dataset.act, actEl); return; }
  if (G.busy) return;

  if (G.sheet) {
    const ch = t.closest('[data-choice]');
    const st = G.flow?.steps[G.flow.i];
    if (ch && st) {
      const u = Number(ch.dataset.choice);
      if (st.kind === 'picks') {
        const k = G.flow.multi.indexOf(u);
        if (k >= 0) G.flow.multi.splice(k, 1); else if (G.flow.multi.length < st.max) G.flow.multi.push(u);
        G.sheet = choiceSheet(st);
        redraw();
        return;
      }
      if (st.kind === 'pick') G.flow.a.pick = u;
      if (st.kind === 'keep') G.flow.a.keep = u;
      if (st.kind === 'discard') G.flow.a.discard = u;
      G.flow.i++;
      nextChoice();
      return;
    }
    if (t.closest('[data-sheet]') && !t.closest('.g-sheet-inner')) { if (!G.flow) { G.sheet = null; redraw(); } }
    return;
  }

  // the opening hand: tap a card to read it
  const mull = t.closest('[data-mull]');
  if (mull) { G.sheet = cardSheet(Number(mull.dataset.mull)); redraw(); return; }

  const card = t.closest('.tcard');
  const relic = t.closest('.relic');
  const pb = t.closest('.pbar');
  const inHand = card?.classList.contains('in-hand');
  const target = relic ? { uid: Number(relic.dataset.uid) } : card && !inHand ? { uid: Number(card.dataset.uid) } : pb ? { p: Number(pb.dataset.p) } : null;

  if (G.flow) { if (target && !chooseOnTable(target)) flash('That is not one of the choices.'); return; }

  if (inHand) { G.sheet = cardSheet(Number(card.dataset.uid)); redraw(); return; }
  if (relic) { G.sheet = cardSheet(target.uid); redraw(); return; }

  // an empty "block here" slot in the battle zone
  const slot = t.closest('.gb-empty[data-att]');
  if (iBlock() && slot) {
    if (G.blk.sel != null) assignBlock(G.blk.sel, Number(slot.dataset.att));
    else flash('First tap the creature of yours that should block.');
    return;
  }

  if (iBlock() && target?.uid != null) {
    const c = s.cards[target.uid];
    if (c.ctrl === G.me) {
      const paired = G.blk.pairs.find(([b]) => b === c.uid);
      if (paired && !isForced(paired[0], paired[1])) { G.blk.pairs = G.blk.pairs.filter(([b, a]) => !(b === c.uid && !isForced(b, a))); G.blk.sel = null; G.suggest = null; redraw(); return; }
      const fits = s.combat.att.filter((a) => canAssign(c.uid, a));
      // only one attacker it could stop: it steps in front of it straight away (beside any other blocker)
      if (fits.length === 1) { assignBlock(c.uid, fits[0]); return; }
      if (fits.length) { G.blk.sel = G.blk.sel === c.uid ? null : c.uid; redraw(); return; }
    } else if (s.combat.att.includes(c.uid) && G.blk.sel != null) { assignBlock(G.blk.sel, c.uid); return; }
    G.sheet = cardSheet(target.uid);
    redraw();
    return;
  }

  if (myMain() && G.atk && target) {
    if (target.p != null && target.p !== G.me) { if (S().players.length === 2) sendAttack(target.p); else { G.atk.target = target.p; redraw(); } return; }
    const c = target.uid != null ? s.cards[target.uid] : null;
    const hunter = hunterWithoutPrey();
    if (c && c.ctrl !== G.me && hunter && preyFor(hunter, null).includes(c.uid)) {
      G.atk.hunt.push([hunter, c.uid]);
      G.atk.target = c.ctrl;
      redraw();
      return;
    }
    if (c && c.ctrl === G.me && canAttack(s, G.me, c)) { toggleAttacker(c.uid); return; }
  }
  if (card) {
    const c = s.cards[target.uid];
    if (c.ctrl === G.me && myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) { toggleAttacker(c.uid); return; }
    G.sheet = cardSheet(c.uid);
    redraw();
    return;
  }
  // a player's bar: their details, in words
  if (pb) { G.sheet = playerSheet(Number(pb.dataset.p)); redraw(); }
}

function onAct(act, el) {
  const uid = Number(el.dataset.uid);
  const busyOk = ['menu', 'help', 'close', 'log', 'leave', 'speed', 'rules', 'coach-skip', 'crown-info'].includes(act);
  if (G.busy && !busyOk) return;
  // While choosing a target, the small chips on cards and bars are part of what you tap.
  const choosing = G.flow || G.atk || (G.blk && G.blk.sel != null);
  switch (act) {
    case 'ability': {
      const card = el.closest('.tcard');
      if (G.flow || G.sheet) { if (card) onClick({ target: card }); break; }
      G.sheet = cardSheet(Number(el.dataset.ab));
      redraw();
      break;
    }
    case 'use-ability': startAbility(uid); break;
    case 'suggest': startSuggest(); break;
    case 'suggest-close': G.suggest = null; redraw(); break;
    case 'suggest-do': {
      const a = G.suggest?.state === G.state ? G.suggest.a : null;
      G.suggest = null;
      if (a) dispatch(a); else redraw();
      break;
    }
    case 'crown-info':
      if (choosing) { const bar = el.closest('.pbar'); if (bar) onClick({ target: bar }); break; }
      flash(S().crown === G.me
        ? 'You hold the Crown: you draw an extra card at the end of each of your turns. Anyone who hits you in a fight takes it.'
        : `${name(S().crown)} holds the Crown: an extra card at the end of each of their turns. Hit them in a fight to take it.`);
      break;
    case 'close': G.sheet = null; redraw(); break;
    case 'recap-close': G.recap = null; redraw(); break;
    case 'cancel': clearSelections(); G.sheet = null; redraw(); break;
    case 'keep': dispatch({ t: 'mulligan', p: G.me, redraw: false }); break;
    case 'redraw': dispatch({ t: 'mulligan', p: G.me, redraw: true }); break;
    case 'end': clearSelections(); dispatch({ t: 'end', p: G.me }); break;
    case 'play': startPlay(uid, 'hand'); break;
    case 'echo': startPlay(uid, 'discard'); break;
    case 'echo-open': G.sheet = cardSheet(uid, { from: 'discard' }); redraw(); break;
    case 'attack-from-sheet': G.sheet = null; toggleAttacker(uid); break;
    case 'attack': sendAttack(Number(el.dataset.p)); break;
    case 'block': dispatch({ t: 'block', p: G.me, blocks: G.blk?.pairs || [] }); break;
    case 'clear-blocks': G.blk.pairs = forcedBlocks(S()); G.blk.sel = null; G.suggest = null; redraw(); break;
    case 'pass': dispatch({ t: 'pass', p: G.me }); break;
    case 'use':
      G.sheet = null;
      G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'sac', options: S().players[G.me].board.map((u) => ({ uid: u })), prompt: 'Sacrifice which creature to draw a card?' }], i: 0, multi: [] };
      nextChoice();
      break;
    case 'phoenix': dispatch({ t: 'phoenix', p: G.me, uid }); break;
    case 'skip': G.flow.i++; nextChoice(); break;
    case 'done-targets': G.flow.a.targets = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; nextChoice(); break;
    case 'done-picks': G.flow.a.picks = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; nextChoice(); break;
    case 'wisp-top': G.flow.a.bottom = false; G.flow.i++; nextChoice(); break;
    case 'wisp-bottom': G.flow.a.bottom = true; G.flow.i++; nextChoice(); break;
    case 'tax-pay': G.flow.a.payTax = true; G.flow.i++; nextChoice(); break;
    case 'tax-no': G.flow.a.payTax = false; G.flow.i++; nextChoice(); break;
    case 'discards': G.sheet = discardSheet(Number(el.dataset.of)); redraw(); break;
    case 'menu': G.sheet = menuSheet(); redraw(); break;
    case 'log': G.sheet = logSheet(); redraw(); break;
    case 'speed': {
      const fast = !fastOn();
      try { localStorage.setItem(SPEED_KEY, fast ? '1' : '0'); } catch { /* fine */ }
      FX.setSpeed(fast ? SPEEDS.fast : SPEEDS.normal);
      G.sheet = menuSheet();
      redraw();
      break;
    }
    case 'fixes': G.sheet = fixSheet(); redraw(); break;
    case 'fix-life': dispatch({ t: 'fix', by: G.me, op: 'life', p: Number(el.dataset.p), n: Number(el.dataset.n) }); G.sheet = fixSheet(); redraw(); break;
    case 'fix-energy': dispatch({ t: 'fix', by: G.me, op: 'energy', p: G.me, n: Number(el.dataset.n) }); G.sheet = fixSheet(); redraw(); break;
    case 'undo': G.sheet = null; if (G.mode === 'practice') undo(); break;
    case 'coach-next': tutAdvance(); break;
    case 'coach-skip': G.tut.done = true; flash('Lesson skipped. The hint line and the ? button are still there.'); redraw(); schedule(); break;
    case 'help': G.sheet = helpSheet(); redraw(); break;
    case 'tutorial': startTutorial(); break;
    case 'concede':
      if (!G.concedeArm || Date.now() - G.concedeArm > 4000) { G.concedeArm = Date.now(); G.sheet = menuSheet(); redraw(); break; }
      G.concedeArm = 0;
      G.sheet = null;
      dispatch({ t: 'concede', p: G.me });
      break;
    case 'rules': leave('#/rules'); break;
    case 'leave': leave(); break;
    case 'lobby': Net.backToLobby(G.code).catch((e) => flash(e.message)); break;
    case 'rematch': {
      const setup = { ...G.setup, seed: (Math.random() * 2 ** 31) | 0 };
      begin({ mode: G.mode, setup, actions: [], me: G.me, bots: [...G.bots] });
      break;
    }
  }
}
