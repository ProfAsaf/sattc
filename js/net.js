// Online play over Firebase Realtime Database.
//
// rooms/{code}/info                    lobby: seats, names, deck codes, round, seeds
// rooms/{code}/rounds/{n}/actions      the move list for game n (append-only)
// rooms/{code}/results/{created}/{n}   how game n went (for tonight's scoreboard)
// rooms/{code}/push, rooms/{code}/seen  turn alerts: the phones that want them, and who is looking
// rooms/{code}/shared                  not a room: a saved game someone shared (shareGame)
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
// The rooms this phone was in, newest first: invites go to their players.
export function recentRooms() {
  try { return JSON.parse(local.get('collective.rooms') || '[]').filter((c) => /^[A-Z]{4}$/.test(c)); } catch { return []; }
}
export function setLastRoom(c) {
  const before = lastRoom();
  local.set('collective.room', c || '');
  if (c) local.set('collective.rooms', JSON.stringify([...new Set([c, before, ...recentRooms()].filter(Boolean))].slice(0, 6)));
}

// ── which version of the game this phone runs ──────────────────────
// Phones replay each other's moves, so they must run the same rules. A phone's
// version is the stamp (a content hash, tools/stamp.mjs) of the files a replay
// depends on: the rules, the cards and the draft. Every seat in a room carries
// its phone's version, so the lobby can tell when a phone needs a reload, and
// a game remembers the version it was started with.
export function version() {
  try {
    const map = JSON.parse(document.querySelector('script[type="importmap"]')?.textContent || '{}').imports || {};
    return ['engine', 'cards', 'draft'].map((f) => String(map[`./js/${f}.js`] || '').split('?v=')[1] || '-').join('.');
  } catch { return '-'; }
}

/** The seats whose phone runs a different version from this one (a phone from before seats had versions counts). */
export const otherVersions = (info) => (info?.players || []).filter((p) => p && p.v !== version());

// ── rooms ───────────────────────────────────────────────────────────
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => Array.from({ length: 4 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');
export const cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
const infoRef = (code) => fb.ref(db, `rooms/${code}/info`);
const actionsRef = (code, round) => fb.ref(db, `rooms/${code}/rounds/${round}/actions`);

export async function createRoom({ seats, name, deck, draft = false, ultra = false }) {
  await connect();
  for (let tries = 0; tries < 6; tries++) {
    const code = newCode();
    const res = await fb.runTransaction(infoRef(code), (cur) => (cur === null
      ? { created: Date.now(), status: 'lobby', seats, host: clientId(), round: 0, champions: !ultra, players: [{ id: clientId(), name, deck, v: version() }], ...(draft ? { draft: { on: true } } : {}), ...(ultra ? { ultra: true } : {}) }
      : undefined));
    if (res.committed) { setLastRoom(code); return code; }
  }
  throw new Error('Could not find a free room code. Try again.');
}

// A game sent for someone else to look at: rooms/{code}/shared holds one saved
// game's record (stats.js; the newest games include their setup and move list)
// as JSON text, under a fresh code that no room uses. Returns the code.
export async function shareGame(rec) {
  await connect();
  const shared = { at: Date.now(), v: version(), rec: JSON.stringify(rec) };
  for (let tries = 0; tries < 6; tries++) {
    const code = newCode();
    const res = await fb.runTransaction(fb.ref(db, `rooms/${code}`), (cur) => (cur === null ? { shared } : undefined));
    if (res.committed) return code;
  }
  throw new Error('Could not find a free code. Try again.');
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
      players[mine] = { ...players[mine], ...(room.status === 'lobby' ? { name, deck } : {}), v: version() };
      seat = mine;
      room.players = players;
      return room;
    }
    if (room.status !== 'lobby') { why = 'That game has already started.'; return; }
    if (players.length >= room.seats) { why = 'That game is full.'; return; }
    seat = players.length;
    room.players = [...players, { id: clientId(), name, deck, v: version() }];
    return room;
  });
  if (!res.snapshot.exists()) throw new Error('No game with that code.');
  if (!res.committed || seat < 0) throw new Error(why || 'Could not join.');
  setLastRoom(code);
  return seat;
}

// Back in a room (say after a reload, which may bring a newer version): my
// seat says which version this phone runs now.
export async function markVersion(code) {
  await connect();
  const v = version();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room) return room;
    const p = (room.players || []).find((x) => x && x.id === clientId());
    if (!p || p.v === v) return; // nothing to change
    p.v = v;
    return room;
  }, { applyLocally: false }); // a first try on an empty cache must not show the room as gone
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
    // every phone on the host's version, or their games would not match
    const v = version();
    if (room.players.some((p) => !p || p.v !== v)) return room;
    room.v = v;
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

// ── turn alerts (js/push.js, push/worker.js) ────────────────────────
// rooms/{code}/push/{client id}   { sub, at }: this phone's Web Push subscription
// rooms/{code}/seen/{client id}   server time this phone last had the game in
//                                 front of it (0: put away); no alerts then
export async function savePush(code, sub) {
  await connect();
  await fb.set(fb.ref(db, `rooms/${code}/push/${clientId()}`), sub ? { sub, at: Date.now() } : null);
}

// Who an invite to room `code` would wake: the players of this phone's last
// few rooms whose phones have alerts on ([{ id, name }]; the room's own players
// are left out where it's shown).
// The alert worker picks the same people (push/worker.js, /invite).
export async function invitees(code) {
  await connect();
  const out = new Map();
  for (const r of recentRooms().filter((x) => x !== code).slice(0, 3)) {
    const [room, push] = await Promise.all([fb.get(infoRef(r)), fb.get(fb.ref(db, `rooms/${r}/push`))]);
    const subs = push.val() || {};
    for (const p of room.val()?.players || []) {
      if (p && p.id !== clientId() && subs[p.id]?.sub && !out.has(p.id)) out.set(p.id, p.name);
    }
  }
  return [...out].map(([id, name]) => ({ id, name }));
}

export async function markSeen(code, here) {
  await connect();
  const ref = fb.ref(db, `rooms/${code}/seen/${clientId()}`);
  if (here) fb.onDisconnect(ref).set(0); // closed, or the connection lost: away
  await fb.set(ref, here ? fb.serverTimestamp() : 0);
}

// ── tonight's results ───────────────────────────────────────────────
// rooms/{code}/results/{created}/{round}   a finished game's summary (stats.js roomResult)
// Every phone that sees a game end writes the same summary (the games are
// the same everywhere), so it doesn't matter which one gets there first.
// Under the room's creation time, so a reused room code starts a new night.
const resultsRef = (code, created) => fb.ref(db, `rooms/${code}/results/${created}`);

export async function sendResult(code, created, round, result) {
  await connect();
  await fb.set(fb.child(resultsRef(code, created), String(round)), JSON.parse(JSON.stringify(result)));
}

export async function watchResults(code, created, onResults) {
  await connect();
  return fb.onValue(resultsRef(code, created), (snap) => onResults(snap.val() || {}));
}

// ── draft night ─────────────────────────────────────────────────────
// rooms/{code}/info.draft          { on: true } while the room waits to draft, then
//                                  { on, id, seed, order: [client ids, by draft seat] }
// rooms/{code}/draft/{id}/picks    the picks, a push list of { p, k, cid }: draft seat
//                                  p's pick number k was card cid (js/draft.js)
// The draft runs while the room is in the lobby. Every phone replays the picks,
// like a game's moves; each player then sets their deck from their 30 picks.
// Picks live under the draft's id, so a new draft (or a reused room code)
// never sees old picks.
const picksRef = (code, id) => fb.ref(db, `rooms/${code}/draft/${id}/picks`);

// Host, before the draft starts: switch the room between bring-your-deck and draft.
// Host, in the lobby: Champions on or off for the room's games.
export async function setChampions(code, on) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.host !== clientId() || room.status !== 'lobby') return room;
    room.champions = !!on;
    return room;
  });
}

// Host, in the lobby: SATTC Ultra on or off for the room's games.
export async function setUltra(code, on) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.host !== clientId() || room.status !== 'lobby') return room;
    room.ultra = !!on;
    return room;
  });
}

export async function setDraftMode(code, on) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.host !== clientId() || room.status !== 'lobby' || room.draft?.id) return room;
    room.draft = on ? { on: true } : null;
    return room;
  });
}

// Host: start the draft (a fresh seed) once everyone is in. `again` starts a
// new draft in a room that has drafted before. `pool` fingerprints the host's
// card list, so a phone on an older version can tell (js/draft.js poolKey).
export async function startDraft(code, { again = false, pool = '', ultra = false } = {}) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.host !== clientId() || room.status !== 'lobby' || !room.draft) return room;
    if (room.draft.id && !again) return room;
    if ((room.players || []).length !== room.seats) return room;
    if (room.players.some((p) => !p || p.v !== version())) return room; // a phone on another version: reload first
    if (!!room.ultra !== !!ultra) return room; // (the switch moved meanwhile: the host taps again)
    const seed = Math.floor(Math.random() * 2 ** 31);
    room.draft = { on: true, id: Date.now().toString(36) + seed.toString(36).slice(0, 4), seed, order: room.players.map((p) => p.id), pool, ...(ultra ? { ultra: true } : {}) };
    return room;
  });
}

export async function sendPick(code, id, { p, k, cid }) {
  await connect();
  await fb.push(picksRef(code, id), { p, k, cid });
}

// The whole pick list, in key order, every time it grows.
export async function watchPicks(code, id, onPicks) {
  await connect();
  return fb.onValue(fb.query(picksRef(code, id), fb.orderByKey()), (snap) => {
    const list = [];
    snap.forEach((c) => { list.push(c.val()); });
    onPicks(list);
  });
}

// Host, starting a game after a draft: make sure every deck is the drafted one
// (each phone sets its own, but a phone asleep at the end may not have yet).
// `decks` maps client id -> deck code.
export async function setDraftDecks(code, decks) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || room.status !== 'lobby' || !room.draft?.id) return room;
    for (const p of room.players || []) if (p && decks[p.id]) p.deck = decks[p.id];
    return room;
  });
}

// "I've seen my deck, ready to play" after a draft (shown to the host).
export async function setDraftReady(code) {
  await connect();
  await fb.runTransaction(infoRef(code), (room) => {
    if (!room || !room.draft?.id) return room;
    room.draft.ready = { ...(room.draft.ready || {}), [clientId()]: true };
    return room;
  });
}
