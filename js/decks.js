// Decks: validation against the Week One rules, local storage, and short
// share codes (2 bits per design, in collector-number order).

import { BY_ID, CARDS, RULES, STARTERS } from './cards.js';

const KEY = 'collective.decks.v1';
const ACTIVE = 'collective.activeDeck';

const store = {
  get(k, fallback) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: decks just won't persist */ } },
};

export function total(counts) {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

export function factionsOf(counts) {
  const s = new Set();
  for (const [id, n] of Object.entries(counts)) if (n > 0) for (const f of BY_ID[id].factions) s.add(f);
  return s;
}

export function curve(counts) {
  const c = [0, 0, 0, 0, 0, 0, 0, 0]; // index 7 means 7+
  for (const [id, n] of Object.entries(counts)) c[Math.min(7, BY_ID[id].cost)] += n;
  return c;
}

export function split(counts) {
  let creatures = 0, spells = 0;
  for (const [id, n] of Object.entries(counts)) (BY_ID[id]?.type === 'creature' ? (creatures += n) : (spells += n));
  return { creatures, spells };
}

// Can one more copy go in? Returns a reason when it can't.
export function canAdd(counts, id) {
  const card = BY_ID[id];
  if ((counts[id] || 0) >= RULES.maxCopies) return { ok: false, reason: 'You own one of each card, and it is already in.' };
  const fs = factionsOf(counts);
  for (const f of card.factions) fs.add(f);
  if (fs.size > RULES.maxFactions) return { ok: false, reason: 'That would make 4 factions. Decks can use at most 3.' };
  if (total(counts) >= RULES.deckSize) return { ok: false, reason: 'Your deck already has 30 cards.' };
  return { ok: true };
}

export function validate(counts) {
  const errors = [];
  const n = total(counts);
  if (n !== RULES.deckSize) errors.push(n < RULES.deckSize ? `${RULES.deckSize - n} more card${RULES.deckSize - n === 1 ? '' : 's'} needed.` : `${n - RULES.deckSize} too many cards.`);
  const fs = factionsOf(counts);
  if (fs.size > RULES.maxFactions) errors.push(`${fs.size} factions; the limit is ${RULES.maxFactions}.`);
  for (const [id, c] of Object.entries(counts)) {
    if (!BY_ID[id] || BY_ID[id].token) errors.push(`Unknown card: ${id}.`);
    else if (c > RULES.maxCopies) errors.push(`${BY_ID[id].name}: you own only one.`);
  }
  return { ok: errors.length === 0, errors };
}

// Expand counts into a 30-card list of ids (deterministic order).
export function cardList(counts) {
  const out = [];
  for (const c of CARDS) for (let i = 0; i < (counts[c.id] || 0); i++) out.push(c.id);
  return out;
}

// ── share codes ─────────────────────────────────────────────────────
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

export function encode(counts) {
  const bytes = new Uint8Array(Math.ceil((CARDS.length * 2) / 8));
  CARDS.forEach((c, i) => {
    const v = Math.min(3, counts[c.id] || 0);
    bytes[(i * 2) >> 3] |= v << ((i * 2) & 7);
  });
  let bits = 0, acc = 0, s = '';
  for (const b of bytes) {
    acc |= b << bits; bits += 8;
    while (bits >= 6) { s += B64[acc & 63]; acc >>= 6; bits -= 6; }
  }
  if (bits > 0) s += B64[acc & 63];
  return 'W1-' + s;
}

export function decode(code) {
  const m = String(code).trim().match(/^W1-([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const bytes = [];
  let bits = 0, acc = 0;
  for (const ch of m[1]) {
    const v = B64.indexOf(ch);
    if (v < 0) return null;
    acc |= v << bits; bits += 6;
    while (bits >= 8) { bytes.push(acc & 255); acc >>= 8; bits -= 8; }
  }
  const counts = {};
  CARDS.forEach((c, i) => {
    const v = ((bytes[(i * 2) >> 3] || 0) >> ((i * 2) & 7)) & 3;
    if (v) counts[c.id] = v;
  });
  return counts;
}

// ── storage ─────────────────────────────────────────────────────────
export function loadDecks() {
  return store.get(KEY, []);
}

function saveDecks(decks) {
  store.set(KEY, decks);
}

export function getDeck(id) {
  const s = STARTERS.find((d) => d.id === id);
  if (s) return { ...s, starter: true };
  return loadDecks().find((d) => d.id === id) || null;
}

export function upsertDeck(deck) {
  const decks = loadDecks();
  const i = decks.findIndex((d) => d.id === deck.id);
  const rec = { ...deck, updated: Date.now() };
  if (i >= 0) decks[i] = rec; else decks.unshift(rec);
  saveDecks(decks);
  return rec;
}

export function deleteDeck(id) {
  saveDecks(loadDecks().filter((d) => d.id !== id));
  if (getActiveId() === id) setActiveId(null);
}

export function newDeck(name = 'New deck', counts = {}) {
  const id = 'deck-' + Math.random().toString(36).slice(2, 9);
  return upsertDeck({ id, name, counts: { ...counts } });
}

export function getActiveId() {
  return store.get(ACTIVE, null);
}

export function setActiveId(id) {
  store.set(ACTIVE, id);
}
