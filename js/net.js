// Online play over Firebase Realtime Database.
//
// rooms/{code}/info                    lobby: seats, names, deck codes, round, seeds
// rooms/{code}/rounds/{n}/actions      the move list for game n (append-only)
//
// The engine is deterministic, so a game is just its seed, decks and move
// list. Every phone replays the same list in key order. A phone that sleeps,
// reloads or drops off simply catches up from the list.

import { FIREBASE_CONFIG } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2';
let db = null, fb = null;

export const isConfigured = () => !!FIREBASE_CONFIG;

async function connect() {
  if (db) return db;
  if (!FIREBASE_CONFIG) throw new Error('Online play is not set up yet.');
  const app = await import(`${SDK}/firebase-app.js`);
  fb = await import(`${SDK}/firebase-database.js`);
  db = fb.getDatabase(app.initializeApp(FIREBASE_CONFIG));
  return db;
}

// ── who am I ────────────────────────────────────────────────────────
const local = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* fine */ } },
};
export function clientId() {
  // ?client=x lets two tabs on one computer act as two players (testing)
  const forced = new URLSearchParams(location.search).get('client');
  if (forced) return 'test-' + forced.replace(/[^a-z0-9]/gi, '').slice(0, 12);
  let id = local.get('collective.client');
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)) .replace(/-/g, '').slice(0, 16);
    local.set('collective.client', id);
  }
  return id;
}
export const myName = () => local.get('collective.name') || '';
export const setMyName = (n) => local.set('collective.name', n);
export const lastRoom = () => local.get('collective.room') || '';
export const setLastRoom = (c) => local.set('collective.room', c || '');

// ── rooms ───────────────────────────────────────────────────────────
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
const infoRef = (code) => fb.ref(db, `rooms/${code}/info`);
const actionsRef = (code, round) => fb.ref(db, `rooms/${code}/rounds/${round}/actions`);

export async function createRoom({ seats, name, deck }) {
  await connect();
  for (let tries = 0; tries < 6; tries++) {
    const code = newCode();
    const res = await fb.runTransaction(infoRef(code), (cur) => (cur === null
      ? { created: Date.now(), status: 'lobby', seats, host: clientId(), round: 0, players: [{ id: clientId(), name, deck }] }
      : undefined));
    if (res.committed) { setLastRoom(code); return code; }
  }
  throw new Error('Could not find a free room code. Try again.');
}

// Join, or rejoin, a room. Returns my seat number.
export async function joinRoom(code, { name, deck }) {
  await connect();
  let seat = -1, why = '';
  const res = await fb.runTransaction(infoRef(code), (room) => {
    if (room === null) return null;
    const players = room.players || [];
    const mine = players.findIndex((p) => p && p.id === clientId());
    if (mine >= 0) {
      if (room.status === 'lobby') players[mine] = { ...players[mine], name, deck };
      seat = mine;
      room.players = players;
      return room;
    }
    if (room.status !== 'lobby') { why = 'That game has already started.'; return; }
    if (players.length >= room.seats) { why = 'That game is full.'; return; }
    seat = players.length;
    room.players = [...players, { id: clientId(), name, deck }];
    return room;
  });
  if (!res.snapshot.exists()) throw new Error('No game with that code.');
  if (!res.committed || seat < 0) throw new Error(why || 'Could not join.');
  setLastRoom(code);
  return seat;
}

// Update my deck between games (the 60 you left out are your sideboard).
export async function setDeck(code, deck) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room) return room;
    const i = (room.players || []).findIndex((p) => p && p.id === clientId());
    if (i >= 0 && room.status === 'lobby') room.players[i].deck = deck;
    return room;
  });
}

export async function leaveLobby(code) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.status !== 'lobby') return room;
    room.players = (room.players || []).filter((p) => p && p.id !== clientId());
    if (!room.players.length) return null;
    if (room.host === clientId()) room.host = room.players[0].id;
    return room;
  });
  setLastRoom('');
}

// Host: start the next game. A fresh seed; the loser of the last game
// could be given the first turn later, for now it is random.
export async function startGame(code) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.host !== clientId() || room.status !== 'lobby') return room;
    if ((room.players || []).length !== room.seats) return room;
    const round = (room.round || 0) + 1;
    room.round = round;
    room.seeds = { ...(room.seeds || {}), [round]: Math.floor(Math.random() * 2 ** 31) };
    room.status = 'playing';
    return room;
  });
}

// Back to the lobby after a game, so decks can change before the next one.
export async function backToLobby(code) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.status !== 'playing') return room;
    room.status = 'lobby';
    return room;
  });
}

export async function watchRoom(code, onInfo) {
  await connect();
  return fb.onValue(infoRef(code), (snap) => onInfo(snap.val()));
}

// Moves arrive in key order; a late arrival that sorts earlier (two phones
// acting at once during the opening) is flagged so the caller replays.
export async function watchActions(code, round, onActions) {
  await connect();
  const list = [];
  const q = fb.query(actionsRef(code, round), fb.orderByKey());
  return fb.onChildAdded(q, (snap) => {
    const key = snap.key;
    let i = list.length;
    while (i > 0 && list[i - 1].key > key) i--;
    list.splice(i, 0, { key, a: snap.val() });
    onActions(list.map((x) => x.a), i === list.length - 1);
  });
}

export async function sendAction(code, round, a) {
  await connect();
  await fb.push(actionsRef(code, round), JSON.parse(JSON.stringify(a)));
}
