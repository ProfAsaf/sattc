// The table: practice games against the bot (online games reuse it).
// Tap a ready creature then its target to attack; tap a hand card to play
// it, and any choices the card needs are asked one at a time.

import { BY_ID, KEYWORDS, RULES, STARTERS } from './cards.js';
import { apply, attackTargets, canAttack, costOf, needs, newGame, opponents, phoenixReady, power, replay, vitality } from './engine.js';
import { chooseAction } from './ai.js';
import { artTag, cardHTML, esc, factionCoin, factionVars, glyph } from './render.js';
import * as Decks from './decks.js';
import * as Net from './net.js';
import { TUTORIAL, botAction, matches } from './tutorial.js';

const SAVE = 'collective.practice.v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch { /* fine without */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* fine */ } },
};

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.5.8-1.2 2.2-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="11" height="15" rx="1.5"/><path d="M9 3h9.5A1.5 1.5 0 0 1 20 4.5V17"/></svg>',
  deck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h6M9 12h6"/></svg>',
  grave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 21V10a6 6 0 0 1 12 0v11z"/><path d="M4 21h16M12 9v6M9.5 11.5h5"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/></svg>',
  hourglass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9"/></svg>',
  trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9.2c2.4-2.6 4.6-2.6 7 0s4.6 2.6 7 0 3.9-2.2 4 0M3 15c2.4-2.6 4.6-2.6 7 0s4.6 2.6 7 0 3.9-2.2 4 0"/></svg>',
};

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
      <p class="muted small" style="margin:6px 0 0">A guided game teaches you everything, one step at a time. It takes about 5 minutes.</p>
      <button class="btn${tutorialDone() ? '' : ' primary'}" data-act="tutorial" style="width:100%;margin-top:12px">${tutorialDone() ? 'Replay the guided lesson' : 'Start the guided lesson'}</button>
    </div>
    <div class="panel" style="margin-top:12px">
      <h3>Practice against the bot</h3>
      <p class="muted small" style="margin:6px 0 0">Learn the cards before Friday. You can take moves back.</p>
      <label class="field">Your deck
        <select id="my-deck" class="select">${choices.map((d) => `<option value="${esc(d.id)}"${d.id === chosen ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select></label>
      <label class="field">The bot plays
        <select id="bot-deck" class="select"><option value="random">A random starter deck</option>
        ${STARTERS.map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
      <label class="field">Table
        <select id="bot-count" class="select"><option value="1">You against one bot</option><option value="2">Three-way: you and two bots</option></select></label>
      <button class="btn primary" data-act="practice" style="width:100%;margin-top:14px">Start a practice game</button>
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
      const n = Number(document.getElementById('bot-count').value);
      const pool = [...STARTERS].sort(() => Math.random() - 0.5);
      const bots = Array.from({ length: n }, (_, i) => (which === 'random' ? pool[i] : STARTERS.find((d) => d.id === which)));
      startPractice(mine, bots);
    }
  };
}

function startPractice(mine, bots) {
  const players = [{ name: 'You', deck: Decks.cardList(mine.counts) },
    ...bots.map((d) => ({ name: `Bot · ${d.name}`, deck: Decks.cardList(d.counts) }))];
  const setup = { seed: (Math.random() * 2 ** 31) | 0, players };
  begin({ mode: 'practice', setup, actions: [], me: 0, bots: bots.map((_, i) => i + 1) });
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
  render();
  schedule();
}

// The bot's scripted lesson moves, one at a time so they can be followed.
function runBotScript(st, k) {
  if (!G || tutStep() !== st) return;
  if (k >= st.bot.length) { tutAdvance(); return; }
  const events = commit(botAction(G.state, 1, st.bot[k]));
  render(events || []);
  G.timer = setTimeout(() => runBotScript(st, k + 1), 1200);
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
  for (let k = 0; s.phase !== 'over' && (k < moves || s.active !== 0 || s.phase !== 'main'); k++) {
    if (k > moves + 200) break;
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : s.active;
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
  }
  document.body.classList.add('in-game');
}

function begin(rec) {
  clearTimeout(G?.timer);
  G = { ...rec, bots: new Set(rec.bots), state: replay(rec.setup, rec.actions), flow: null, attacker: null, sheet: null, timer: null };
  G.state.events = [];
  mount();
  render();
  schedule();
}

// An online game: the seed and decks come from the room, the moves from
// the shared move list. Nothing is applied locally until it is in the list.
function beginOnline(info, seat) {
  const round = info.round;
  const setup = { seed: info.seeds[round], players: info.players.map((p) => ({ name: p.name, deck: Decks.cardList(Decks.decode(p.deck) || {}) })) };
  clearTimeout(G?.timer);
  G?.unsubActions?.();
  G = { mode: 'online', code: L.code, round, setup, actions: [], me: seat, bots: new Set(), state: newGame(setup), flow: null, attacker: null, sheet: null, timer: null };
  G.state.events = [];
  mount();
  render();
  Net.watchActions(L.code, round, (actions, atEnd) => {
    if (!G || G.mode !== 'online' || G.round !== round) return;
    let events = [];
    if (atEnd && actions.length === G.actions.length + 1) {
      const r = apply(G.state, actions[actions.length - 1]);
      if (!r.error) { G.state = r.state; events = r.state.events; }
    } else {
      G.state = replay(setup, actions);
    }
    G.actions = actions;
    render(events);
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
  document.body.classList.remove('in-game');
  if (location.hash === goTo) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = goTo;
}

function save() {
  if (G.mode !== 'practice') return;
  store.set({ mode: G.mode, setup: G.setup, actions: G.actions, me: G.me, bots: [...G.bots], over: G.state.phase === 'over' });
}

// ── turns ───────────────────────────────────────────────────────────
function dispatch(a) {
  if (G.mode === 'online') {
    const r = apply(G.state, a);
    if (r.error) { flash(r.error); return false; }
    G.attacker = null;
    Net.sendAction(G.code, G.round, a).catch((e) => flash(`Not sent: ${e.message}`));
    return true;
  }
  // In the lesson, your moves must be the one the coach is asking for.
  const st = tutStep();
  let lessonMove = false;
  if (st && a.p === G.me && a.t !== 'concede' && a.t !== 'fix') {
    if (!st.expect) { flash(st.next ? 'Read the box first, then tap Next.' : 'Wait for the bot to finish.'); return false; }
    if (!matches(G.state, a, st.expect)) { flash(`Not quite. ${st.say}`); G.attacker = null; render(); return false; }
    lessonMove = true;
  }
  const events = commit(a);
  if (!events) return false;
  if (lessonMove) { render(events); tutAdvance(); return true; }
  render(events);
  schedule();
  return true;
}

// Apply a move locally and remember it. Returns its events, or null.
function commit(a) {
  const r = apply(G.state, a);
  if (r.error) { flash(r.error); return null; }
  G.actions.push(a);
  G.state = r.state;
  G.attacker = null;
  save();
  return r.state.events;
}

function schedule() {
  clearTimeout(G.timer);
  const s = G.state;
  if (s.phase === 'over') return;
  const st = tutStep();
  if (st?.bot) { G.timer = setTimeout(() => runBotScript(st, 0), 1000); return; }
  if (st) return; // the lesson is waiting for you
  const bot = s.phase === 'mulligan'
    ? s.players.find((P) => !P.mull && G.bots.has(P.i))?.i
    : (G.bots.has(s.active) ? s.active : undefined);
  if (bot == null) return;
  // after the lesson the bot plays for real, but gently
  const noise = G.mode === 'tutorial' ? 3 : 0.4;
  G.timer = setTimeout(() => {
    if (!G) return;
    dispatch(chooseAction(G.state, bot, { noise }));
  }, s.phase === 'mulligan' ? 250 : 900);
}

function undo() {
  let i = G.actions.length - 1;
  while (i >= 0 && G.actions[i].p !== G.me) i--;
  if (i < 0 || G.actions[i].t === 'mulligan') { flash('Nothing to take back.'); return; }
  clearTimeout(G.timer);
  G.actions = G.actions.slice(0, i);
  G.state = replay(G.setup, G.actions);
  G.state.events = [];
  G.flow = null; G.attacker = null; G.sheet = null;
  save();
  render();
  schedule();
}

// ── helpers about the position ──────────────────────────────────────
const S = () => G.state;

// The engine logs in the third person ("Dana plays…"); in practice games
// the human is called "You", so fix the grammar for display.
function speak(text) {
  if (S().players[G.me].name !== 'You' || !/\bYou\b/.test(text)) return text;
  return text
    .replace(/\bYou's\b/g, 'Your')
    .replace(/\bYou is\b/g, 'You are')
    .replace(/\bYou has\b/g, 'You have')
    .replace(/\b(You|and) (\w+?[^s])s\b/g, (m, w, v) => `${w} ${v}`)
    .replace(/\btheir\b/g, 'your');
}
const myTurn = () => S().phase === 'main' && S().active === G.me;

function playable(uid, from = 'hand') {
  const s = S(), P = s.players[G.me], c = s.cards[uid], d = BY_ID[c.cid];
  if (!myTurn()) return 'Wait for your turn.';
  const cost = costOf(s, G.me, c, from);
  if (cost > P.energy) return `Needs ${cost} Energy; you have ${P.energy}.`;
  if (d.type === 'creature' && P.board.length >= RULES.boardMax) return 'You already have 7 creatures.';
  const n = needs(s, G.me, c, from);
  if (n.sac && !n.sac.length) return 'You need a creature of yours to sacrifice.';
  if (n.target && !n.optional && !n.target.length) return 'There is nothing to target.';
  if (n.pick && !n.pick.length) return 'There is nothing in your discard pile it can bring back.';
  if (c.cid === 'borrowed-time' && P.board.length >= RULES.boardMax) return 'You already have 7 creatures.';
  if (n.targets && !n.count) return 'You need creatures of your own.';
  return null;
}

const PROMPTS = {
  'feed-the-flame': ['Sacrifice which of your creatures?', 'Where do the 3 damage go?'],
  'funeral-pyre': ['Sacrifice which of your creatures?', 'Where does the damage go?'],
  'the-mountain-is-angry': [null, 'Which opponent?'],
  'wild-growth': [null, 'Which of your creatures grows +2/+2?'],
  'worldtree-stag': [null, 'Give another creature of yours +2/+2 (or skip).'],
  'not-yet': [null, 'Return which creature to its owner’s hand?'],
  'deepwater-leviathan': [null, 'You may return another creature to its owner’s hand.'],
  'death-is-a-door': [null, 'Destroy which creature?'],
  'apex-predator': [null, 'Apex Predator fights which creature?'],
  'we-grow-together': [null, null, 'Choose your creatures to grow +1/+2.'],
};

function stepsFor(uid, from) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const n = needs(s, G.me, c, from);
  const pr = PROMPTS[c.cid] || [];
  const steps = [];
  if (n.sac) steps.push({ kind: 'sac', options: n.sac.map((u) => ({ uid: u })), prompt: pr[0] || 'Choose a creature to sacrifice.' });
  if (n.target && (n.target.length || !n.optional)) steps.push({ kind: 'target', options: n.target, optional: !!n.optional, prompt: pr[1] || 'Choose a target.' });
  if (n.targets && n.count) steps.push({ kind: 'targets', options: n.targets.map((u) => ({ uid: u })), count: n.count, prompt: pr[2] || `Choose ${n.count} of your creatures.` });
  if (n.pick) steps.push({ kind: 'pick', options: n.pick });
  if (n.picks) steps.push({ kind: 'picks', options: n.picks, max: n.max });
  if (n.keep && n.keep.length) steps.push({ kind: 'keep', options: n.keep });
  if (n.bottom && n.bottom.length) steps.push({ kind: 'bottom', options: n.bottom });
  if (n.discard) steps.push({ kind: 'discard', options: n.discard });
  if (d.type === 'spell' && opponents(s, G.me).some((Q) => Q.traps.length)) steps.push({ kind: 'tax' });
  return steps;
}

const sameT = (a, b) => (a.p != null ? a.p === b.p : a.uid === b.uid);

// What is highlighted on the table right now.
function highlights() {
  const h = { targets: [], picked: [] };
  if (G.attacker) h.targets = attackTargets(S(), G.me);
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'target', 'targets'].includes(st.kind)) {
    h.targets = st.options.filter((o) => !(st.kind === 'target' && o.uid != null && o.uid === G.flow.a.sac));
    if (st.kind === 'targets') h.picked = G.flow.multi.map((u) => ({ uid: u }));
  }
  return h;
}

// ── rendering ───────────────────────────────────────────────────────
function pips(P) {
  const max = Math.max(P.maxEnergy, P.energy);
  let h = '';
  for (let i = 0; i < max; i++) h += `<span class="pip${i < P.energy ? (i >= P.maxEnergy ? ' extra' : ' on') : ''}"></span>`;
  return h;
}

function pbarHTML(P, hl) {
  const isT = hl.targets.some((t) => t.p === P.i);
  return `<div class="pbar${isT ? ' target' : ''}" data-p="${P.i}">
    <div class="pb-name">${esc(P.name)}</div>
    <div class="pb-life${P.life <= 5 ? ' low' : ''}">${ICON.heart}${P.life}</div>
    <div class="pb-energy">${pips(P)}<span class="pb-en-n">${P.energy}/${P.maxEnergy}</span></div>
    <div class="pb-meta">
      <span title="cards in hand">${ICON.hand}${P.hand.length}</span>
      <span title="cards in deck">${ICON.deck}${P.deck.length}</span>
      <button data-act="discards" data-of="${P.i}" title="discard pile">${ICON.grave}${P.discard.length}</button>
      ${P.traps.length ? `<span class="trap-chip" title="a Countercurrent is set">${ICON.trap}${P.traps.length}</span>` : ''}
    </div>
  </div>`;
}

function tokHTML(c, hl) {
  const s = S(), d = BY_ID[c.cid];
  const p = power(s, c), v = vitality(s, c) - (c.dmg || 0);
  const cls = ['tok'];
  const mine = c.owner === G.me;
  if (mine && myTurn() && canAttack(s, G.me, c)) cls.push('ready');
  else if (mine && c.played === s.turn && !c.rush && !d.keywords.includes('rush')) cls.push('sick');
  if (d.keywords.includes('guard')) cls.push('guard');
  if (G.attacker === c.uid) cls.push('sel');
  if (hl.targets.some((t) => t.uid === c.uid)) cls.push('target');
  if (hl.picked.some((t) => t.uid === c.uid)) cls.push('picked');
  const badges = (d.keywords.includes('guard') ? `<span title="Guard">${ICON.shield}</span>` : '') +
    (c.sacEnd ? `<span title="Leaves at the end of the turn">${ICON.hourglass}</span>` : '') +
    (d.keywords.includes('lastBreath') ? '<span title="Last Breath">✦</span>' : '');
  return `<div class="${cls.join(' ')}" data-uid="${c.uid}" data-cid="${c.cid}" style="${factionVars(d)}">
    <div class="tok-art">${artTag(c.cid) || glyph(d.factions[0] || 'neutral')}</div>
    <div class="tok-name">${esc(d.name)}</div>
    <div class="tok-p${p > d.power ? ' up' : p < d.power ? ' down' : ''}">${p}</div>
    <div class="tok-v${c.dmg ? ' hurt' : v > d.vitality ? ' up' : ''}">${v}</div>
    ${badges ? `<div class="tok-badges">${badges}</div>` : ''}
  </div>`;
}

function rowHTML(P, hl) {
  return `<div class="g-row${P.board.length ? '' : ' empty'}">${P.board.map((u) => tokHTML(S().cards[u], hl)).join('')}</div>`;
}

function handHTML(P) {
  const s = S();
  return P.hand.map((u) => {
    const c = s.cards[u], d = BY_ID[c.cid];
    const cost = costOf(s, G.me, c);
    const can = !playable(u);
    return `<div class="hc${d.factions.length > 1 ? ' multi' : ''}${can ? ' can' : ''}" data-uid="${u}" data-cid="${c.cid}" style="${factionVars(d)}">
      <div class="hc-art">${artTag(c.cid) || glyph(d.factions[0] || 'neutral')}</div>
      <div class="hc-cost${cost < d.cost ? ' cheaper' : ''}">${cost}</div>
      ${d.type === 'creature' ? `<div class="hc-pv">${d.power}/${d.vitality}</div>` : `<div class="hc-tag">${d.subtype === 'Trap' ? 'Trap' : 'Spell'}</div>`}
      <div class="hc-name">${esc(d.name)}</div>
    </div>`;
  }).join('');
}

function statusHTML() {
  const s = S();
  if (s.phase === 'over') return 'Game over';
  if (s.phase === 'mulligan') return 'Waiting for everyone to choose an opening hand…';
  const P = s.players[s.active];
  if (s.active === G.me) return `<b>Your turn</b> · ${P.energy} Energy left`;
  return G.bots.has(s.active) ? `${esc(P.name)} is thinking…` : `${esc(P.name)}’s turn`;
}

function midHTML() {
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'target', 'targets'].includes(st.kind)) {
    const n = st.kind === 'targets' ? G.flow.multi.length : 0;
    return `<div class="banner"><span>${esc(st.prompt)}</span>
      ${st.optional ? '<button class="btn small" data-act="skip">Skip</button>' : ''}
      ${st.kind === 'targets' && n ? `<button class="btn small primary" data-act="done-targets">Done (${n})</button>` : ''}
      <button class="btn small ghost" data-act="cancel">Cancel</button></div>`;
  }
  if (G.attacker) {
    return `<div class="banner"><span>What does ${esc(BY_ID[S().cards[G.attacker].cid].name)} attack?</span>
      <button class="btn small" data-act="info" data-uid="${G.attacker}">Card</button>
      <button class="btn small ghost" data-act="cancel">Cancel</button></div>`;
  }
  const lesson = tutStep();
  if (lesson && !lesson.bot) return ''; // the coach is all there is to read
  const lines = S().log.slice(-2).map((l) => `<div>${esc(speak(l.text))}</div>`).join('');
  const hint = lesson ? '' : hintText();
  return `<div class="ticker">${lines}</div>${hint ? `<div class="hint">${hint}</div>` : ''}`;
}

// What can I do right now? Shown under the ticker in every game.
function hintText() {
  const s = S();
  if (s.phase !== 'main') return '';
  if (!myTurn()) return G.bots.has(s.active) ? 'The bot is playing. Watch the line above to see what it does.' : '';
  const P = s.players[G.me];
  const canPlay = P.hand.some((u) => !playable(u));
  const canHit = P.board.some((u) => canAttack(s, G.me, s.cards[u]));
  if (canPlay && canHit) return 'Your move: tap a <b>glowing card</b> to play it, or a <b>glowing creature</b> to attack.';
  if (canPlay) return 'Your move: tap a <b>glowing card</b> to play it.';
  if (canHit) return 'Your move: tap a <b>glowing creature</b>, then what it should attack.';
  return 'Nothing else you can do this turn: tap <b>End turn</b>.';
}

function anythingToDo() {
  const s = S(), P = s.players[G.me];
  if (!myTurn()) return false;
  if (P.hand.some((u) => !playable(u))) return true;
  if (P.board.some((u) => canAttack(s, G.me, s.cards[u]))) return true;
  return phoenixReady(s, G.me).length > 0 && P.energy >= 2;
}

function render(events = []) {
  const root = document.getElementById('game');
  if (!root || !G) return;
  const s = S(), me = s.players[G.me];
  if (s.phase === 'mulligan' && !me.mull) { root.innerHTML = mulliganHTML(); return; }
  const hl = highlights();
  const others = [];
  for (let k = 1; k < s.players.length; k++) others.push(s.players[(G.me + k) % s.players.length]);
  const phoenix = phoenixReady(s, G.me);
  root.className = s.players.length === 2 ? 'g-duel' : 'g-ffa';
  const st = tutStep();
  root.innerHTML = `
    <div class="g-top">
      <button class="g-icon" data-act="menu" aria-label="Menu">☰</button>
      <button class="g-icon" data-act="help" aria-label="How the table works">?</button>
      <div class="g-status">${statusHTML()}</div>
      ${G.mode === 'practice' ? '<button class="g-icon" data-act="undo" aria-label="Take back">↶</button>' : '<span style="width:36px"></span>'}
    </div>
    ${others.map((P) => `<section class="g-side opp${s.active === P.i ? ' active' : ''}${P.out ? ' out' : ''}">${pbarHTML(P, hl)}${rowHTML(P, hl)}</section>`).join('')}
    <div class="g-mid">${st ? coachHTML(st) : ''}${midHTML()}</div>
    <section class="g-side me${s.active === G.me ? ' active' : ''}">${rowHTML(me, hl)}${pbarHTML(me, hl)}</section>
    <div class="g-actions">
      ${phoenix.length && myTurn() ? `<button class="btn small" data-act="phoenix" data-uid="${phoenix[0]}">Return Phoenix (2)</button>` : ''}
      <span class="grow"></span>
      <button class="btn primary end-btn${myTurn() && !anythingToDo() ? ' nudge' : ''}" data-act="end" ${myTurn() && !G.flow ? '' : 'disabled'}>End turn</button>
    </div>
    <div class="g-hand${myTurn() ? '' : ' wait'}">${handHTML(me)}</div>
    ${s.phase === 'over' ? overHTML() : ''}
    ${G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div></div>` : ''}`;
  for (const e of events) {
    if (e.k === 'dmg') root.querySelector(`.tok[data-uid="${e.uid}"]`)?.classList.add('hit');
    if (e.k === 'life' && e.n < 0) root.querySelector(`.pbar[data-p="${e.p}"]`)?.classList.add('hit');
  }
  // ring whatever the lesson is talking about
  if (st?.show && !G.sheet) for (const sel of st.show) root.querySelectorAll(sel).forEach((el) => el.classList.add('coach-on'));
}

function mulliganHTML() {
  const s = S(), me = s.players[G.me];
  const first = s.players[s.first];
  return `<div class="g-full">
    <div class="kicker muted small" style="letter-spacing:.2em">YOUR OPENING HAND</div>
    <h2>${s.first === G.me ? 'You go first' : `${esc(first.name)} goes first`}</h2>
    <p class="muted small" style="margin:0">${s.first === G.me ? 'Going first, you skip your first draw.' : 'You start with a Spark: a free card that gives 1 extra Energy for a turn.'}</p>
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
    <p class="muted">${win ? 'Well played.' : 'Take it back with ↶, or try again.'}</p>
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
function kwHelp(cid) {
  const text = BY_ID[cid].text || '';
  return Object.values(KEYWORDS).filter((k) => new RegExp('\\b' + k.name + '\\b', 'i').test(text))
    .map((k) => `<div><b>${k.name}</b> — ${esc(k.text)}</div>`).join('');
}

function cardSheet(uid, { from = 'hand' } = {}) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const onBoard = c.zone === 'board';
  const opts = onBoard ? { power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), cls: 'anim' } : { cost: c.owner === G.me ? costOf(s, G.me, c, from) : d.cost, cls: 'anim' };
  let actions = '', note = '';
  if (c.owner === G.me && (from === 'hand' || (from === 'discard' && d.echo))) {
    let why = playable(uid, from);
    const cost = costOf(s, G.me, c, from);
    // in the lesson, only the card the coach is asking for can be played
    const st = tutStep();
    let advice = '';
    if (st && !why) {
      if (st.expect?.t === 'play' && st.expect.cid === c.cid) advice = st.sheet || '';
      else why = st.expect?.t === 'play' ? `For now, play ${BY_ID[st.expect.cid].name} (it's glowing on the table).` : 'Not yet: follow the box on the table first.';
    }
    actions = `<button class="btn primary" data-act="${from === 'discard' ? 'echo' : 'play'}" data-uid="${uid}" ${why ? 'disabled' : ''}>${from === 'discard' ? 'Play with Echo' : 'Play'} · ${cost} Energy</button>`;
    if (why) note = `<div class="why">${esc(why)}</div>`;
    if (advice) note = `<div class="coach coach-sheet"><div class="coach-text">${esc(advice)}</div></div>`;
  }
  if (onBoard) {
    const bits = [];
    if (c.dmg) bits.push(`${c.dmg} damage this turn (heals at the end of the turn)`);
    if (c.owner === G.me) {
      if (canAttack(s, G.me, c)) { if (myTurn()) actions = `<button class="btn primary" data-act="attack-from-sheet" data-uid="${uid}">Attack</button>`; }
      else if (c.attacked) bits.push('Already attacked this turn');
      else bits.push('Arrived this turn: it can attack next turn');
    }
    if (c.sacEnd) bits.push('Borrowed Time: it leaves at the end of this turn');
    if (bits.length) note = `<div class="sheet-note">${bits.map(esc).join('<br>')}</div>`;
  }
  return `${cardHTML(d, opts)}${note}<div class="kw-help">${kwHelp(c.cid)}</div>
    <div class="btn-col">${actions}<button class="btn ghost" data-act="close">Close</button></div>`;
}

function choiceSheet(st) {
  const s = S(), P = s.players[G.me];
  const cards = (uids, chosen = []) => `<div class="choice-grid">${uids.map((u) =>
    `<div data-choice="${u}" class="${chosen.includes(u) ? 'chosen' : ''}">${cardHTML(BY_ID[s.cards[u].cid])}</div>`).join('')}</div>`;
  const cancel = '<button class="btn ghost" data-act="cancel">Cancel</button>';
  switch (st.kind) {
    case 'pick':
      return `<h3>Choose a creature from your discard pile</h3>${cards(st.options)}<div class="btn-col">${cancel}</div>`;
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
      const owner = opponents(s, G.me).find((Q) => Q.traps.length);
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
    <button class="btn" data-act="fixes">Fix something</button>
    <button class="btn" data-act="rules">How to play (leaves the table; resume from Play)</button>
    <button class="btn danger" data-act="concede">Concede</button>
    <button class="btn ghost" data-act="leave">Leave (${G.mode === 'practice' ? 'you can resume later' : 'the game continues'})</button>
    <button class="btn ghost" data-act="close">Back to the game</button></div>`;
}

function helpSheet() {
  return `<h3>How the table works</h3>
    <div class="help-list">
      <div><b>Top: your opponent.</b> Their name, Life ❤, Energy (gold hexagons), and how many cards they have in hand, in their deck, and in their discard pile (tap that number to look through it).</div>
      <div><b>Creatures</b> sit in the middle: theirs above, yours below. The left number is <b>Power</b> (damage it deals), the right number is <b>Vitality</b> (damage it can take, red when it's hurt).</div>
      <div><b>Glowing gold means ready.</b> A glowing card in your hand can be played now. A glowing creature can attack now.</div>
      <div><b>To attack:</b> tap your glowing creature, then tap the opponent's name bar (to hit them) or one of their creatures. Creatures hit each other back; players don't.</div>
      <div><b>Badges on creatures:</b> shield = Guard (must be attacked first), ✦ = Last Breath (does something when it dies), hourglass = leaves at the end of the turn.</div>
      <div><b>Bottom: your hand.</b> Tap a card to read it, then Play. The hexagon is its Energy cost.</div>
      <div><b>End turn</b> when you're done. Next turn your Energy refills and goes up by one.</div>
      <div>Tap any card, anywhere, to read it. Keywords are explained under the card.</div>
    </div>
    <div class="btn-col">
      ${G.mode === 'online' ? '' : '<button class="btn" data-act="tutorial">Play the guided lesson</button>'}
      <button class="btn ghost" data-act="close">Back to the game</button></div>`;
}

function logSheet() {
  const items = S().log.map((l) => `<div class="${/’s turn\.$|'s turn\.$/.test(l.text) ? 'turn' : ''}">${esc(speak(l.text))}</div>`).join('');
  setTimeout(() => { const el = document.querySelector('.log-list'); if (el) el.scrollTop = el.scrollHeight; }, 0);
  return `<h3>Game log</h3><div class="log-list">${items}</div><div class="btn-col"><button class="btn ghost" data-act="close">Close</button></div>`;
}

function fixSheet() {
  const s = S();
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
  G.attacker = null;
  G.flow = { a: { t: 'play', p: G.me, uid, ...(from === 'discard' ? { from } : {}) }, steps: stepsFor(uid, from), i: 0, multi: [] };
  advance();
}

function advance() {
  const f = G.flow;
  if (f.i >= f.steps.length) { G.flow = null; G.sheet = null; dispatch(f.a); return; }
  const st = f.steps[f.i];
  G.sheet = ['pick', 'picks', 'keep', 'bottom', 'discard', 'tax'].includes(st.kind) ? choiceSheet(st) : null;
  render();
}

function chooseOnTable(t) {
  const f = G.flow, st = f.steps[f.i];
  if (!st.options.some((o) => sameT(o, t))) return false;
  if (st.kind === 'sac') { f.a.sac = t.uid; f.i++; advance(); return true; }
  if (st.kind === 'target') {
    if (t.uid != null && t.uid === f.a.sac) return false;
    f.a.target = t; f.i++; advance(); return true;
  }
  if (st.kind === 'targets') {
    const k = f.multi.indexOf(t.uid);
    if (k >= 0) f.multi.splice(k, 1); else f.multi.push(t.uid);
    if (f.multi.length === st.count) { f.a.targets = [...f.multi]; f.multi = []; f.i++; advance(); }
    else render();
    return true;
  }
  return false;
}

// ── input ───────────────────────────────────────────────────────────
let flashTimer;
function flash(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.zIndex = 90;
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.remove(), 2400);
}

function onClick(e) {
  if (!G) return;
  const s = S();
  const t = e.target;
  const actEl = t.closest('[data-act]');
  if (actEl) { onAct(actEl.dataset.act, actEl); return; }

  if (G.sheet) {
    const ch = t.closest('[data-choice]');
    const st = G.flow?.steps[G.flow.i];
    if (ch && st) {
      const u = Number(ch.dataset.choice);
      if (st.kind === 'picks') {
        const k = G.flow.multi.indexOf(u);
        if (k >= 0) G.flow.multi.splice(k, 1); else if (G.flow.multi.length < st.max) G.flow.multi.push(u);
        G.sheet = choiceSheet(st);
        render();
        return;
      }
      if (st.kind === 'pick') G.flow.a.pick = u;
      if (st.kind === 'keep') G.flow.a.keep = u;
      if (st.kind === 'discard') G.flow.a.discard = u;
      G.flow.i++;
      advance();
      return;
    }
    if (t.closest('[data-sheet]') && !t.closest('.g-sheet-inner')) { if (!G.flow) { G.sheet = null; render(); } }
    return;
  }

  const tok = t.closest('.tok');
  const pb = t.closest('.pbar');
  const target = tok ? { uid: Number(tok.dataset.uid) } : pb ? { p: Number(pb.dataset.p) } : null;

  if (G.flow) { if (target && !chooseOnTable(target)) flash('That is not one of the choices.'); return; }

  if (G.attacker) {
    if (target && attackTargets(s, G.me).some((o) => sameT(o, target))) { dispatch({ t: 'attack', p: G.me, uid: G.attacker, target }); return; }
    if (tok && Number(tok.dataset.uid) === G.attacker) { G.attacker = null; render(); return; }
    if (tok && s.cards[target.uid].owner === G.me && canAttack(s, G.me, s.cards[target.uid])) { G.attacker = target.uid; render(); return; }
    if (target) flash(target.p != null && s.players.some((Q) => Q.i !== G.me && Q.board.some((u) => BY_ID[s.cards[u].cid].keywords.includes('guard'))) ? 'A Guard is in the way.' : 'Not a legal target.');
    return;
  }

  if (tok) {
    const c = s.cards[target.uid];
    if (c.owner === G.me && myTurn() && canAttack(s, G.me, c)) { G.attacker = c.uid; render(); return; }
    G.sheet = cardSheet(c.uid);
    render();
    return;
  }
  const hc = t.closest('.hc');
  if (hc) { G.sheet = cardSheet(Number(hc.dataset.uid)); render(); }
}

function onAct(act, el) {
  const s = S();
  const uid = Number(el.dataset.uid);
  switch (act) {
    case 'close': G.sheet = null; render(); break;
    case 'cancel': G.flow = null; G.attacker = null; G.sheet = null; render(); break;
    case 'keep': dispatch({ t: 'mulligan', p: G.me, redraw: false }); break;
    case 'redraw': dispatch({ t: 'mulligan', p: G.me, redraw: true }); break;
    case 'end': G.flow = null; G.attacker = null; dispatch({ t: 'end', p: G.me }); break;
    case 'play': startPlay(uid, 'hand'); break;
    case 'echo': startPlay(uid, 'discard'); break;
    case 'echo-open': G.sheet = cardSheet(uid, { from: 'discard' }); render(); break;
    case 'info': G.sheet = cardSheet(uid); render(); break;
    case 'attack-from-sheet': G.sheet = null; G.attacker = uid; render(); break;
    case 'phoenix': dispatch({ t: 'phoenix', p: G.me, uid }); break;
    case 'skip': G.flow.i++; advance(); break;
    case 'done-targets': G.flow.a.targets = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; advance(); break;
    case 'done-picks': G.flow.a.picks = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; advance(); break;
    case 'wisp-top': G.flow.a.bottom = false; G.flow.i++; advance(); break;
    case 'wisp-bottom': G.flow.a.bottom = true; G.flow.i++; advance(); break;
    case 'tax-pay': G.flow.a.payTax = true; G.flow.i++; advance(); break;
    case 'tax-no': G.flow.a.payTax = false; G.flow.i++; advance(); break;
    case 'discards': G.sheet = discardSheet(Number(el.dataset.of)); render(); break;
    case 'menu': G.sheet = menuSheet(); render(); break;
    case 'log': G.sheet = logSheet(); render(); break;
    case 'fixes': G.sheet = fixSheet(); render(); break;
    case 'fix-life': dispatch({ t: 'fix', by: G.me, op: 'life', p: Number(el.dataset.p), n: Number(el.dataset.n) }); G.sheet = fixSheet(); render(); break;
    case 'fix-energy': dispatch({ t: 'fix', by: G.me, op: 'energy', p: G.me, n: Number(el.dataset.n) }); G.sheet = fixSheet(); render(); break;
    case 'undo': G.sheet = null; if (G.mode === 'practice') undo(); break;
    case 'coach-next': tutAdvance(); break;
    case 'coach-skip': G.tut.done = true; flash('Lesson skipped. The hint line and the ? button are still there.'); render(); schedule(); break;
    case 'help': G.sheet = helpSheet(); render(); break;
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
