// The table: practice games against the bot (online games reuse it).
// Drag a card from your hand onto the table to play it (or tap it, then
// Play). Tap your ready creatures to send them into an attack; when someone
// attacks you, tap a creature of yours and then the attacker it blocks.
// Every move is animated on the old table first (cards flying in, lunges,
// hits, deaths), then the table is redrawn and everything glides into place.

import { BY_ID, KEYWORDS, RULES, STARTERS, isTrick } from './cards.js';
import { actor, apply, blockLimit, canAttack, canBlock, costOf, forcedBlocks, hasKw, needs, newGame, opponents, phoenixReady, playOptions, power, replay, vitality } from './engine.js';
import { chooseAction } from './ai.js';
import { artTag, cardBackHTML, cardHTML, esc, factionCoin, factionVars } from './render.js';
import * as FX from './fx.js';
import * as Decks from './decks.js';
import * as Net from './net.js';
import { TUTORIAL, botAction, matches } from './tutorial.js';

const SAVE = 'collective.practice.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch { /* fine without */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* fine */ } },
};
const SPEED_KEY = 'collective.fast';
const fastOn = () => { try { return localStorage.getItem(SPEED_KEY) === '1'; } catch { return false; } };
const SPEEDS = { normal: 1.25, fast: 2.2 };
FX.setSpeed(fastOn() ? SPEEDS.fast : SPEEDS.normal);

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.5.8-1.2 2.2-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="11" height="15" rx="1.5"/><path d="M9 3h9.5A1.5 1.5 0 0 1 20 4.5V17"/></svg>',
  deck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h6M9 12h6"/></svg>',
  grave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 21V10a6 6 0 0 1 12 0v11z"/><path d="M4 21h16M12 9v6M9.5 11.5h5"/></svg>',
  trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
};
const COLORS = { ember: '#ff7a2e', verdant: '#b4e06a', tide: '#8fe0ee', umbral: '#b07cff', radiant: '#ffd77a' };
const colorOf = (cid) => COLORS[BY_ID[cid]?.factions[0]] || '#ffd77a';

let G = null; // the game being shown

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
    <label class="field">Your name <input id="my-name" class="name-input" style="font-size:18px" maxlength="16" value="${esc(Net.myName())}" placeholder="Name" autocomplete="off"></label>
    <label class="field">Your deck ${deckSelect('net-deck', choices, chosen)}</label>
    <div class="btn-row" style="margin-top:12px">
      <button class="btn primary" data-act="create" data-seats="2">New 1v1 game</button>
      <button class="btn" data-act="create" data-seats="3">New three-way game</button>
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
      if (act === 'create') { const code = await Net.createRoom({ seats: Number(el.dataset.seats), name, deck: dcode }); await enterRoom(code); }
      else {
        const code = act === 'rejoin' ? el.dataset.code : Net.cleanCode(document.getElementById('join-code').value);
        if (code.length !== 4) { flash('Game codes have four letters.'); return; }
        await Net.joinRoom(code, { name, deck: dcode });
        await enterRoom(code);
      }
    }
    if (act === 'start') { await Net.setDeck(L.code, Decks.encode(deckOf('room-deck').counts)); await Net.startGame(L.code); }
    if (act === 'leave-room') { const code = L.code; exitRoom(); await Net.leaveLobby(code); } // stop watching first, so leaving isn't reported as the game vanishing
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
  return `<div class="coach${st.bot ? ' coach-wait' : ''}">
    <div class="coach-text">${esc(st.say)}</div>
    <div class="coach-row"><span class="coach-n">Lesson ${n} of ${total}</span>
      ${st.next ? `<button class="btn small primary" data-act="coach-next">${st.final ? 'Let’s play!' : 'Next'}</button>` : ''}
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
  G = { ...rec, bots: new Set(rec.bots), state, view: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
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
  G = { mode: 'online', code: L.code, round, setup, actions: [], me: seat, bots: new Set(), state, view: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
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
  clearSelections();
  save();
  show(r.state.events);
  return true;
}

function clearSelections() {
  if (!G) return;
  G.recap = null;
  G.atk = null;
  G.blk = null;
  G.flow = null;
}

// Queue the animation of a move, then the redraw of the position after it.
// A hidden page (the phone was put away) or a pile of moves catching up
// skips straight to the result.
function show(events) {
  const after = G.state;
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
    }, s.phase === 'mulligan' ? 200 : s.phase === 'combat' ? 450 : 650);
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
      .replace(/\b(You|and) (\w+?[^s])s\b/g, (m, w, v) => `${w} ${v}`)
      .replace(/\btheir\b/g, 'your');
  }
  return t.replace(/\u0001(\d+)\u0001/g, (m, k) => names[k]);
}
const name = (p) => S().players[p].name;
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
  // a Hunt pairing can't be undone
  return !G.blk.pairs.some(([x, y]) => (y === a && x !== b && isForced(x, y)) || (x === b && blockLimit(s, bc) === 1 && isForced(x, y)));
}
const canBlockSomething = (u) => S().combat.att.some((a) => canBlock(S(), S().cards[u], S().cards[a]));

function assignBlock(b, a) {
  if (!canAssign(b, a)) { flash(`${nameOf(b)} can’t block that.`); return; }
  G.blk.pairs = G.blk.pairs.filter(([, y]) => y !== a);
  // over its limit (one attacker, two with Guard): it lets go of the oldest
  const mine = G.blk.pairs.filter(([x]) => x === b);
  if (mine.length >= blockLimit(S(), S().cards[b])) { const drop = mine.find(([x, y]) => !isForced(x, y)); G.blk.pairs = G.blk.pairs.filter((p) => p !== drop); }
  G.blk.pairs.push([b, a]);
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
    if (Q.i !== G.me && n > 0) bits.push(`${esc(Q.name)} takes <b>${n}</b>${t.players[Q.i].out ? ' (and is out!)' : ''}`);
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
  return `<div class="pbar${isT ? ' target' : ''}${fighting || ''}" data-p="${P.i}">
    <div class="pb-name">${esc(P.name)}</div>
    <div class="pb-life${P.life <= 5 ? ' low' : ''}">${ICON.heart}${P.life}</div>
    <div class="pb-energy">${pips(P)}<span class="pb-en-n">${P.energy}/${P.maxEnergy}</span></div>
    <div class="pb-meta">
      <span title="cards in hand">${ICON.hand}${P.hand.length}</span>
      <span title="cards in deck">${ICON.deck}${P.deck.length}</span>
      <button data-act="discards" data-of="${P.i}" title="discard pile">${ICON.grave}${P.discard.length}</button>
      ${P.traps.length ? `<span class="trap-chip" title="${P.traps.length} face-down Trap${P.traps.length > 1 ? 's' : ''}">${ICON.trap}${P.traps.length}</span>` : ''}
    </div>
    ${P.relics.length ? `<div class="pb-relics">${P.relics.map((u) => relicHTML(s, s.cards[u], hl)).join('')}</div>` : ''}
  </div>`;
}

function creatureHTML(s, c, hl) {
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
  return FX.tcardHTML(d, {
    uid: c.uid, states: st, power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), dmg: c.dmg,
    keywords: kws, leaving: !!(c.sacEnd || c.stolen), foe: !mine,
  });
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
  if (s.phase === 'mulligan') return 'Waiting for everyone to choose an opening hand…';
  const P = s.players[s.active];
  const who = actor(s);
  if (s.phase === 'combat') return who === G.me ? `<b>${s.combat.step === 'block' ? 'Choose your blockers' : 'Your Trick window'}</b>` : `${esc(name(who))} is deciding…`;
  if (s.active === G.me) return `<b>Your turn</b> · ${s.players[G.me].energy} Energy left`;
  return G.bots.has(s.active) ? `${esc(P.name)} is thinking…` : `${esc(P.name)}’s turn`;
}

function midHTML() {
  const s = S();
  const coached = !!tutStep(); // the coach box says what to do; keep banners short
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'fighter', 'target', 'targets'].includes(st.kind)) {
    const n = st.kind === 'targets' ? G.flow.multi.length : 0;
    return `<div class="banner"><span>${esc(st.prompt)}</span>
      ${st.optional ? '<button class="btn small" data-act="skip">Skip</button>' : ''}
      ${st.kind === 'targets' && n ? `<button class="btn small primary" data-act="done-targets">Done (${n})</button>` : ''}
      <button class="btn small ghost" data-act="cancel">Cancel</button></div>`;
  }
  if (G.atk && myMain()) {
    const n = G.atk.att.length;
    const opps = opponents(s, G.me);
    const hunter = hunterWithoutPrey();
    const hint = hunter ? `<div class="banner-sub">${esc(nameOf(hunter))} can Hunt: tap the enemy creature it must fight (optional).</div>` : '';
    const buttons = opps.length === 1
      ? `<button class="btn small primary atk-btn" data-act="attack" data-p="${opps[0].i}">Attack!</button>`
      : opps.map((Q) => `<button class="btn small primary atk-btn${G.atk.target === Q.i ? ' on' : ''}" data-act="attack" data-p="${Q.i}">Attack ${esc(Q.name)}</button>`).join('');
    return `<div class="banner fight"><span>⚔ ${n} attacker${n === 1 ? '' : 's'}${coached ? '' : ' chosen · tap more, or'}</span>${buttons}
      <button class="btn small ghost" data-act="cancel">Cancel</button>${hint}</div>`;
  }
  if (iBlock()) {
    const C = s.combat;
    const pairs = G.blk?.pairs || [];
    const preview = outcome(s, playOut(s, { t: 'block', p: G.me, blocks: pairs }));
    const sel = G.blk?.sel != null ? `Now tap the attacker ${esc(nameOf(G.blk.sel))} should block.` : 'Tap one of your creatures, then the attacker it blocks (or drag onto it).';
    return `<div class="banner fight foe"><span><b>${esc(name(C.a))} attacks you</b> with ${esc(listNames(C.att.map(nameOf)))}.</span>
      ${coached ? '' : `<div class="banner-sub">${sel}</div>`}
      <div class="banner-sub">If no one plays a Trick: ${preview}</div>
      <button class="btn small primary blk-btn" data-act="block">${pairs.length ? `Done: block with ${pairs.length}` : 'Don’t block'}</button>
      ${pairs.length ? '<button class="btn small ghost" data-act="clear-blocks">Clear</button>' : ''}</div>`;
  }
  if (iTrick()) {
    const C = s.combat;
    const preview = outcome(s, playOut(s, { t: 'pass', p: G.me }));
    const role = C.a === G.me ? 'Blockers are set.' : `${esc(name(C.a))} played a Trick.`;
    return `<div class="banner fight"><span>${coached ? 'Your Trick window.' : `${role} Play a Trick from your hand, or let the fight happen.`}</span>
      ${coached ? '' : `<div class="banner-sub">As things stand: ${preview}</div>`}
      <button class="btn small primary fight-btn" data-act="pass">Fight!</button></div>`;
  }
  const lesson = tutStep();
  if (lesson && !lesson.bot) return ''; // the coach is all there is to read
  const recap = !lesson && G.recap === s.turn && myMain() ? recapLines() : [];
  if (recap.length) {
    return `<div class="recap" data-act="recap-close"><div class="recap-h">Since your last turn</div>${recap.map((t) => `<div>${esc(speak(t))}</div>`).join('')}</div>${hintText() ? `<div class="hint">${hintText()}</div>` : ''}`;
  }
  const lines = s.log.slice(-2).map((l) => `<div>${esc(speak(l.text))}</div>`).join('');
  const hint = lesson ? '' : hintText();
  return `<div class="ticker">${lines}</div>${hint ? `<div class="hint">${hint}</div>` : ''}`;
}

// The others' moves between your previous turn and this one (the important lines).
function recapLines() {
  const log = S().log;
  const me = S().players[G.me].name;
  let start = log.length - 1;
  while (start >= 0 && log[start].text !== `${me}'s turn.`) start--;   // this turn's start
  let prev = start - 1;
  while (prev >= 0 && log[prev].text !== `${me}'s turn.`) prev--;      // your previous turn's start
  if (start < 0 || prev < 0) return [];
  let from = prev + 1;
  while (from < start && !/'s turn\.$/.test(log[from].text)) from++;  // skip your own turn
  const keep = /plays|attacks|blocks|dies|takes \d|loses|Trap|is out|sets a Trap|returns|becomes|takes control|calls|strikes|cancels/;
  const lines = log.slice(from, start).map((l) => l.text).filter((t) => keep.test(t) && !/'s turn\.$|ends their turn/.test(t));
  return lines.length >= 2 ? lines.slice(-7) : [];
}

// What can I do right now? Shown under the ticker in every game.
function hintText() {
  const s = S();
  if (s.phase === 'over' || s.phase === 'mulligan') return '';
  const who = actor(s);
  if (s.phase === 'combat') {
    if (who === G.me) return '';
    if (s.combat.d === G.me || s.combat.a === G.me) return `Waiting for ${esc(name(who))}…`;
    return `${esc(name(s.combat.a))} is attacking ${esc(name(s.combat.d))}.`;
  }
  if (s.active !== G.me) return G.bots.has(s.active) ? `${esc(name(s.active))} is playing. Its moves show up big in the middle.` : '';
  const P = s.players[G.me];
  const canPlay = P.hand.some((u) => !playable(u));
  const canHit = canStartAttack();
  if (canPlay && canHit) return 'Your move: drag a <b>glowing card</b> up to play it, or tap <b>glowing creatures</b> to attack.';
  if (canPlay) return 'Your move: drag a <b>glowing card</b> up onto the table to play it.';
  if (canHit) return 'Your move: tap your <b>glowing creatures</b> to send them into an attack.';
  return 'Nothing else you can do this turn: tap <b>End turn</b>.';
}

function anythingToDo() {
  const s = S(), P = s.players[G.me];
  if (!myMain()) return false;
  if (P.hand.some((u) => !playable(u))) return true;
  if (canStartAttack()) return true;
  return phoenixReady(s, G.me).length > 0 && P.energy >= 2;
}

function tableHTML() {
  const s = S(), me = s.players[G.me];
  const hl = highlights();
  const others = [];
  for (let k = 1; k < s.players.length; k++) others.push(s.players[(G.me + k) % s.players.length]);
  const phoenix = phoenixReady(s, G.me);
  const st = tutStep();
  const row = (P) => `<div class="tc-row">${P.board.map((u) => creatureHTML(s, s.cards[u], hl)).join('')}</div>`;
  return `
    <div class="g-top">
      <button class="g-icon" data-act="menu" aria-label="Menu">☰</button>
      <button class="g-icon" data-act="help" aria-label="How the table works">?</button>
      <div class="g-status">${statusHTML()}</div>
      ${G.mode === 'practice' ? '<button class="g-icon" data-act="undo" aria-label="Take back">↶</button>' : '<span style="width:36px"></span>'}
    </div>
    <div class="g-table">
      ${others.map((P) => `<section class="g-side opp${s.active === P.i ? ' active' : ''}${P.out ? ' out' : ''}" data-side="${P.i}">${pbarHTML(s, P, hl)}${row(P)}</section>`).join('')}
      <div class="g-mid">${st ? coachHTML(st) : ''}${midHTML()}</div>
      <section class="g-side me${s.active === G.me ? ' active' : ''}" data-side="${G.me}">${row(me)}${pbarHTML(s, me, hl)}</section>
    </div>
    <div class="g-actions">
      ${phoenix.length && myMain() ? `<button class="btn small" data-act="phoenix" data-uid="${phoenix[0]}">Return Phoenix (2)</button>` : ''}
      <span class="grow"></span>
      ${s.phase === 'combat' ? '' : `<button class="btn primary end-btn${myMain() && !anythingToDo() && !G.atk ? ' nudge' : ''}" data-act="end" ${myMain() && !G.flow ? '' : 'disabled'}>End turn</button>`}
    </div>
    <div class="tc-hand g-hand${myMove() ? '' : ' wait'}">${handHTML(s)}</div>
    <svg class="g-lines" aria-hidden="true"></svg>
    ${s.phase === 'over' ? overHTML() : ''}
    ${G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div></div>` : ''}`;
}

// Draw the position in G.view. No animation here.
function draw(root) {
  const s = S(), me = s.players[G.me];
  syncBlocks();
  if (s.phase === 'mulligan' && !me.mull) { root.className = 'g-mull'; root.innerHTML = mulliganHTML(); return; }
  root.className = (s.players.length === 2 ? 'g-duel' : 'g-ffa') + (G.busy ? ' busy' : '');
  root.innerHTML = tableHTML();
  FX.layoutHand(root.querySelector('.tc-hand'));
  // ring whatever the lesson is talking about
  const st = tutStep();
  if (st?.show && !G.sheet) for (const sel of st.show) root.querySelectorAll(sel).forEach((el) => el.classList.add('coach-on'));
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
    const blk = C.step === 'block' && C.d === G.me && G.blk ? Object.fromEntries(G.blk.pairs.map(([b, a]) => [a, b])) : C.blk;
    for (const a of C.att) {
      const b = blk[a];
      lines.push(b != null ? [card(a), card(b), 'block'] : [card(a), bar(C.d), 'attack']);
    }
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
    if (events.length && root.querySelector('.g-table')) await capped(animateOld(root, events), 20000);
  } catch (e) { console.error(e); }
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
async function animateOld(root, events) {
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
      const html = d ? cardHTML(d, { cls: 'anim' }) : cardBackHTML();
      if (e.p === G.me) root.querySelector(`.tcard[data-uid="${e.uid}"]`)?.classList.add('fx-hidden');
      const target = e.target ? (e.target.p != null ? barEl(root, e.target.p) : el(root, e.target.uid)) : e.sac != null ? el(root, e.sac) : null;
      // An opponent's creature or Relic is put down where it will sit; spells just fade.
      const toRect = e.p !== G.me && d && d.type !== 'spell' ? landingRect(root, e.p, d.type) : undefined;
      await FX.showCard(html, { fromRect: from, toRect, hold: e.p === G.me ? 350 : d ? 1050 : 650, flip: e.p !== G.me && !!d, width: e.p === G.me ? 0.55 : 0.7 });
      const ar = target && FX.arrow(barEl(root, e.p), target, { duration: 600, color: colorOf(e.cid) });
      if (ar) await ar.finished;
      continue;
    }
    if (e.k === 'attack') {
      const group = [];
      while (i < events.length && events[i].k === 'attack') group.push(events[i++]);
      const d = group[0].target.p;
      const atk = s0.cards[group[0].uid]?.ctrl;
      const label = d === G.me ? `${name(atk)} attacks you!` : atk === G.me ? `You attack ${name(d)}` : `${name(atk)} attacks ${name(d)}`;
      const sub = `with ${listNames(group.map((g) => BY_ID[s0.cards[g.uid].cid].name))}`;
      const arrows = group.map((g) => FX.arrow(el(root, g.uid), barEl(root, d), { duration: 1000, color: '#ff6a3d' }));
      await Promise.all([FX.banner(label, { sub, tone: d === G.me ? 'foe' : atk === G.me ? 'mine' : 'info' }), ...arrows.map((a) => a?.finished)]);
      continue;
    }
    if (e.k === 'block') {
      const group = [];
      while (i < events.length && events[i].k === 'block') group.push(events[i++]);
      await Promise.all(group.map((g) => FX.arrow(el(root, g.uid), el(root, g.att), { duration: 550, color: '#bfe6ff' })?.finished));
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
      await Promise.race([Promise.all(deaths), FX.wait(550)]);
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
          FX.showCard(cardHTML(d, { cls: 'anim' }), { fromRect: barEl(root, e.p)?.getBoundingClientRect(), hold: 900, flip: true })]);
        break;
      }
      case 'breath': {
        const side = root.querySelector(`.g-side[data-side="${e.p}"]`);
        await FX.wave(side || root, { color: '#ff7a2e', dir: 'down' });
        break;
      }
      case 'clash': await FX.clash(el(root, e.uid), el(root, e.to), { color: colorOf(s0.cards[e.uid]?.cid) }); break;
      case 'countered': await FX.banner('Canceled!', { sub: 'Countercurrent', tone: 'info' }); break;
      case 'bounce': case 'transform': case 'freeze': case 'steal': case 'use': {
        const n = el(root, e.uid);
        if (n) await FX.burst(n, { color: e.k === 'freeze' ? '#d6ecff' : e.k === 'steal' ? '#ff9a6b' : e.k === 'use' ? '#b07cff' : '#8fe0ee' });
        break;
      }
      case 'chime': { const n = el(root, e.uid); if (n) await FX.number(n, `🔔 ${e.n || 3}/3`, { kind: 'buff' }); break; }
      default: break;
    }
  }
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
async function strikeAll(root, strikes) {
  const done = new Set();
  const jobs = [];
  const hit = (target, n) => { if (target && n) FX.number(target, `−${n}`, { kind: 'damage' }); };
  for (const sk of strikes) {
    if (done.has(sk)) continue;
    done.add(sk);
    const a = el(root, sk.from);
    const toPlayer = sk.to && typeof sk.to === 'object';
    const b = toPlayer ? barEl(root, sk.to.p) : el(root, sk.to);
    const back = !toPlayer && strikes.find((t) => !done.has(t) && t.from === sk.to && t.to === sk.from);
    if (back && a && b) {
      done.add(back);
      jobs.push(FX.clash(a, b, { strength: Math.max(sk.n, back.n), onHit: () => { hit(b, sk.n); hit(a, back.n); } }));
    } else if (a && b) {
      jobs.push(FX.lunge(a, b, { strength: sk.n, color: toPlayer ? '#ff6a3d' : undefined, onHit: () => hit(b, sk.n) }));
    }
  }
  await Promise.all(jobs);
}

// On the new table: turn banners.
async function animateNew(root, events) {
  const turn = events.find((e) => e.k === 'turn');
  if (!turn) return;
  const P = S().players[turn.p];
  // a new turn's banner replaces any that is still on screen (bots can be quick)
  document.querySelectorAll('#fx-layer .fx-banner').forEach((b) => b.remove());
  if (turn.p === G.me) { G.recap = S().turn; redraw(); FX.banner('Your turn', { sub: `${P.energy} Energy`, tone: 'mine' }); }
  else FX.banner(`${P.name}’s turn`, { tone: 'info', duration: 800 });
  await FX.wait(turn.p === G.me ? 250 : 450);
}

function mulliganHTML() {
  const s = S(), me = s.players[G.me];
  const first = s.players[s.first];
  return `<div class="g-full">
    <div class="kicker muted small" style="letter-spacing:.2em">YOUR OPENING HAND</div>
    <h2>${s.first === G.me ? 'You go first' : `${esc(first.name)} goes first`}</h2>
    <p class="muted small" style="margin:0">${s.first === G.me ? 'Going first, you skip your first draw.' : 'You start with a Spark: a free card that gives 1 extra Energy.'}</p>
    <div class="hand-row">${me.hand.map((u) => cardHTML(BY_ID[s.cards[u].cid])).join('')}</div>
    <p class="muted small" style="margin:0">Keep these, or shuffle them back and draw ${RULES.openingHand} new cards (once).</p>
    <div class="btn-row"><button class="btn primary" data-act="keep">Keep</button><button class="btn" data-act="redraw">Draw a new hand</button></div>
    <button class="btn ghost small" data-act="leave">Leave game</button>
  </div>`;
}

function overHTML() {
  const s = S();
  const win = s.winner === G.me;
  return `<div class="g-sheet"><div class="g-sheet-inner g-full" style="min-height:70vh;justify-content:center">
    <div class="winner">${win ? 'You win!' : `${esc(s.players[s.winner]?.name || 'Nobody')} wins`}</div>
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
  const list = Object.values(KEYWORDS).filter((k) => new RegExp('\\b' + k.name + '\\b', 'i').test(text));
  return list.map((k) => `<div><b>${k.name}</b> — ${esc(k.text)}</div>`).join('');
}

function cardSheet(uid, { from = 'hand' } = {}) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const onBoard = c.zone === 'board';
  const opts = onBoard ? { power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), cls: 'anim' } : { cost: c.owner === G.me && c.zone === 'hand' ? costOf(s, G.me, c, from) : d.cost, cls: 'anim' };
  let actions = '', note = '';
  const granted = onBoard ? FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k) && !d.keywords.includes(k)) : [];
  if (c.owner === G.me && (c.zone === 'hand' || (from === 'discard' && d.echo))) {
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
    if (c.stolen) bits.push(`Borrowed from ${s.players[c.stolen.back].name} until the end of the turn`);
    if (c.owner !== c.ctrl && !c.stolen) bits.push(`Taken from ${s.players[c.owner].name} for good`);
    if (c.sacEnd) bits.push('Borrowed Time: it leaves at the end of this turn');
    if (c.baseCid) bits.push(`Really ${BY_ID[c.baseCid].name}: it turns back if it leaves play`);
    if (c.ctrl === G.me) {
      if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) actions = `<button class="btn primary" data-act="attack-from-sheet" data-uid="${uid}">${G.atk?.att.includes(uid) ? 'Keep it home' : 'Send it into the attack'}</button>`;
      else if (c.played === s.turn && s.active === G.me && !hasKw(s, c, 'rush')) bits.push('Arrived this turn: it can attack next turn (it can block already)');
    }
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
    const whose = c.owner !== G.me ? `<div class="choice-owner">${esc(s.players[c.owner].name)}’s</div>` : '';
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
      return `<h3>Countercurrent</h3><p class="sheet-note">${esc(owner.name)} has a Countercurrent set. Your next Spell is canceled unless you pay 2 more Energy.</p>
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
  return `<h3>${esc(P.name)}’s discard pile (${list.length})</h3>
    ${list.length ? `<div class="choice-grid">${items}</div>` : '<p class="sheet-note">Empty.</p>'}
    ${P.exile.length ? `<p class="sheet-note">Removed from the game: ${P.exile.map((u) => esc(BY_ID[s.cards[u].cid].name)).join(', ')}</p>` : ''}
    <div class="btn-col"><button class="btn ghost" data-act="close">Close</button></div>`;
}

function menuSheet() {
  return `<h3>Menu</h3><div class="btn-col">
    ${G.mode === 'practice' ? '<button class="btn" data-act="undo">↶ Take back my last move</button>' : ''}
    <button class="btn" data-act="log">Game log</button>
    <button class="btn" data-act="speed">${fastOn() ? 'Animations: fast (tap for normal)' : 'Animations: normal (tap for fast)'}</button>
    <button class="btn" data-act="fixes">Fix something</button>
    <button class="btn" data-act="rules">How to play (leaves the table; resume from Play)</button>
    <button class="btn danger" data-act="concede">Concede</button>
    <button class="btn ghost" data-act="leave">Leave (${G.mode === 'practice' ? 'you can resume later' : 'the game continues'})</button>
    <button class="btn ghost" data-act="close">Back to the game</button></div>`;
}

function helpSheet() {
  return `<h3>How the table works</h3>
    <div class="help-list">
      <div><b>Top: your opponents.</b> Name, Life ❤, Energy (gold hexagons), cards in hand, in deck, and in the discard pile (tap it to look). Relics sit under the name; ⊠ is a face-down Trap.</div>
      <div><b>Creatures</b>: theirs above, yours below. Left number = <b>Power</b> (damage it deals), right = <b>Vitality</b> (damage it can take). Small badges are keywords; tap any card to read it.</div>
      <div><b>Play a card</b>: drag it from your hand up onto the table, or tap it and tap Play. Glowing cards can be played now.</div>
      <div><b>Attack</b> (once a turn): tap your glowing creatures, then <b>Attack</b>. Or drag from a creature onto an opponent’s name. Attackers tilt (exhausted) and can’t block until your next turn.</div>
      <div><b>Block</b>: when you are attacked, tap one of your creatures and then the attacker it should stop (or drag onto it), then Done. The banner tells you what will happen.</div>
      <div><b>Tricks</b> can be played during a fight. After blockers are set, you get a chance; tap <b>Fight!</b> when you are done.</div>
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
  const rows = s.players.map((P) => `<div>${esc(P.name)} · Life ${P.life}</div>
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

  const card = t.closest('.tcard');
  const relic = t.closest('.relic');
  const pb = t.closest('.pbar');
  const inHand = card?.classList.contains('in-hand');
  const target = relic ? { uid: Number(relic.dataset.uid) } : card && !inHand ? { uid: Number(card.dataset.uid) } : pb ? { p: Number(pb.dataset.p) } : null;

  if (G.flow) { if (target && !chooseOnTable(target)) flash('That is not one of the choices.'); return; }

  if (inHand) { G.sheet = cardSheet(Number(card.dataset.uid)); redraw(); return; }
  if (relic) { G.sheet = cardSheet(target.uid); redraw(); return; }

  if (iBlock() && target?.uid != null) {
    const c = s.cards[target.uid];
    if (c.ctrl === G.me) {
      const paired = G.blk.pairs.find(([b]) => b === c.uid);
      if (paired && !isForced(paired[0], paired[1])) { G.blk.pairs = G.blk.pairs.filter(([b, a]) => !(b === c.uid && !isForced(b, a))); G.blk.sel = null; redraw(); return; }
      if (canBlockSomething(c.uid)) { G.blk.sel = G.blk.sel === c.uid ? null : c.uid; redraw(); return; }
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
  }
}

function onAct(act, el) {
  const uid = Number(el.dataset.uid);
  const busyOk = ['menu', 'help', 'close', 'log', 'leave', 'speed', 'rules', 'coach-skip'].includes(act);
  if (G.busy && !busyOk) return;
  switch (act) {
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
    case 'clear-blocks': G.blk.pairs = forcedBlocks(S()); G.blk.sel = null; redraw(); break;
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
    case 'concede': G.sheet = null; dispatch({ t: 'concede', p: G.me }); break;
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
