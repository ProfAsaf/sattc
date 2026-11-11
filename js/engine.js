// The Collective — rules engine.
//
// Pure and deterministic: a game is newGame(setup) followed by a list of
// actions, and every client that replays the same list gets the same game.
// That makes online play an append-only action log, and undo a replay
// without the last action. Randomness (shuffles, who goes first) comes from
// a seeded generator stored in the state.
//
// Every choice is made by the acting player when they act: targets, which
// card Memory Diver keeps, which creatures block. `actor(s)` says whose move
// it is: the active player, or during a fight whoever must answer next
// (the defender choosing blockers, then both sides taking turns to play
// Tricks until both pass).

import { BY_ID, KEYWORDS, RULES, ULTRA_RULES, ULTRA_V2, championFor, legendFor, isTrick } from './cards.js';

// ── small helpers ───────────────────────────────────────────────────
const def = (c) => BY_ID[c.cid];
const nameOf = (c) => def(c).name;
const removeFrom = (arr, uid) => { const i = arr.indexOf(uid); if (i >= 0) arr.splice(i, 1); return i >= 0; };

function rnd(s) {
  s.rng = (s.rng + 0x6d2b79f5) | 0;
  let t = Math.imul(s.rng ^ (s.rng >>> 15), 1 | s.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function shuffle(s, arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(s) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function log(s, p, text) {
  s.log.push({ turn: s.turn, p, text });
  if (s.log.length > 400) s.log.splice(0, s.log.length - 400);
}
const ev = (s, e) => s.events.push(e);

// ── SATTC Ultra (setup.ultra; ultra-plan.md) ────────────────────────
const fieldIs = (s, cid) => s.field != null && s.cards[s.field]?.cid === cid;
// (version 4) "your Field": one you played
const fieldMine = (s, pi) => s.field != null && s.cards[s.field]?.ctrl === pi;
// Ultra's fifth version (2026-11-09): the toned-down cards and the guerrilla cards' rules.
const ultraV5 = (s) => !!s.ultra && s.uv >= 5;
// SATTC Ultra's second version: Legends, Fuse from the hand, Dig, ganging up (cards.js ULTRA_V).
export const ultraV2 = (s) => !!s.ultra && s.uv >= 2;
// ...and its third (the tournament lab's fixes): simultaneous strikes, and the growth cap.
const ultraV3 = (s) => !!s.ultra && s.uv >= 3;
const ritualOf = (s, P) => P.relics.find((u) => def(s.cards[u]).stages);
const handMax = (s, P) => RULES.handMax + 2 * P.relics.filter((u) => s.cards[u].cid === 'tidecallers-library').length;
// Max Energy grows by itself to RULES.maxEnergy (Ultra: to 6, and each Invest raises that by 1, up to 12).
const energyCap = (s, P) => (s.ultra ? Math.min(ULTRA_RULES.maxEnergy, ULTRA_RULES.energyGrowsTo + (P.invest || 0)) : RULES.maxEnergy);

export const opponents = (s, i) => s.players.filter((p) => p.i !== i && !p.out);
export const living = (s) => s.players.filter((p) => !p.out);
const listNames = (names) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

// Whose move is it? null during the mulligan (everyone decides at once) and once the game is over.
export function actor(s) {
  if (s.phase === 'combat') return s.combat.prio;
  if (s.phase === 'main') return s.active;
  return null;
}

// ── setup ───────────────────────────────────────────────────────────
function mk(s, cid, owner, zone) {
  const c = { uid: s.nextUid++, cid, owner, zone, token: !!BY_ID[cid].token };
  s.cards[c.uid] = c;
  return c;
}

// setup: { seed, players: [{ name, deck: [cardId × 30] }] }
// The tutorial adds `stacked: true` (decks keep their order, top card first)
// and `first` (who goes first), so every step of the lesson is predictable.
// `crown` turns the Crown on or off (on by default with three or more players).
// `startEnergy` is everyone's Energy on their first turn: new games pass
// RULES.startEnergy. A setup without it starts at 1, the old rule, so games
// saved before the change replay as they were played (the lesson too).
// `deckClock` (new games pass true; 2026-11-10): an empty deck costs its
// player RULES.emptyDeckDamage Life once, at the start of their turn, and any
// other draw from it does nothing. Without it, the old rule: that much Life
// for every card they'd draw from it (games saved before replay so).
// `champions`: every player starts with their deck's Champion on the table
// (a player's `champion` picks one; otherwise championFor). Off unless asked.
// A player's `powers` (the campaign's bosses, campaign.js; never in PvP):
// `life` more Life, `energy` more Energy every turn from the first, and
// `board`, creatures already on the table when the game starts.
// `ultra`: SATTC Ultra, the bigger rule changes (s.ultra). Off unless asked.
// `true` is its first version; a number is that version (s.uv; cards.js ULTRA_V).
// From version 2 every player has a Legend beside their deck (a player's
// `legend` picks one; otherwise legendFor), and no Champion.
export function newGame({ seed = 1, players, stacked = false, first = null, crown = null, startEnergy = 1, champions = false, ultra = false, deckClock = false }) {
  const s = {
    v: 2, rng: seed | 0, mode: players.length > 2 ? 'ffa' : 'duel', ...(deckClock ? { deckClock: true } : {}),
    turn: 0, active: 0, first: 0, phase: 'mulligan', winner: null, combat: null,
    crownOn: crown ?? players.length > 2, crown: null, ultra: !!ultra, ...(ultra ? { field: null, uv: ultra === true ? 1 : Number(ultra) || 1 } : {}),
    players: [], cards: {}, nextUid: 1, died: 0, diedOwn: [], log: [], events: [],
  };
  players.forEach((pl, i) => {
    const P = {
      i, name: pl.name || `Player ${i + 1}`, life: ultra ? (players.length > 2 ? ULTRA_RULES.startLife3 : ULTRA_RULES.startLife) : RULES.startLife, maxEnergy: startEnergy - 1, energy: 0, ...(ultra ? { invest: 0 } : {}),
      deck: [], hand: [], discard: [], exile: [], board: [], traps: [], relics: [],
      out: false, mull: null, turns: 0, spells: 0, mirror: false, attackedOn: -1, extra: 0,
    };
    if (pl.powers) { P.life += pl.powers.life || 0; P.maxEnergy += pl.powers.energy || 0; }
    s.players.push(P);
    s.diedOwn.push(0);
    for (const cid of pl.deck) P.deck.push(mk(s, cid, i, 'deck').uid);
    if (!stacked) shuffle(s, P.deck);
  });
  s.first = first ?? Math.floor(rnd(s) * players.length);
  s.active = s.first;
  for (const P of s.players) {
    const n = RULES.openingHand + (P.i !== s.first ? RULES.laterPlayerExtraCards : 0);
    for (let k = 0; k < n; k++) drawRaw(s, P);
  }
  for (const P of s.players) if (P.i !== s.first) P.hand.push(mk(s, 'spark', P.i, 'hand').uid);
  log(s, null, `${s.players[s.first].name} goes first. Everyone else gets a Spark.`);
  if (ultraV2(s) && ULTRA_V2.legends) {
    s.players.forEach((P, i) => {
      const cid = players[i].legend || legendFor(players[i].deck, s.uv);
      Object.assign(P, { legend: mk(s, cid, i, 'legend').uid, champ: cid, cxp: 0 });
    });
  } else if (champions) {
    s.players.forEach((P, i) => {
      const cid = players[i].champion || championFor(players[i].deck);
      enterPlay(s, mk(s, cid, i, 'board'), i);
      Object.assign(P, { champ: cid, cxp: 0 });
    });
    log(s, null, 'Every player’s Champion takes the field.');
  }
  players.forEach((pl, i) => {
    const on = pl.powers?.board || [];
    for (const cid of on) enterPlay(s, mk(s, cid, i, 'board'), i);
    if (on.length) log(s, i, `${s.players[i].name} starts with ${on.map((cid) => BY_ID[cid]?.name || cid).join(', ')} on the table.`);
  });
  return s;
}

function drawRaw(s, P) {
  const uid = P.deck.shift();
  if (uid == null) return;
  s.cards[uid].zone = 'hand';
  P.hand.push(uid);
}

// ── stats, keywords and costs ───────────────────────────────────────
const boardOf = (s, c) => s.players[c.ctrl].board;
const countOn = (s, uids, cid) => uids.reduce((n, u) => n + (s.cards[u].cid === cid ? 1 : 0), 0);

// ── Champions (a prototype: CHAMPIONS in cards.js) ──────────────────
// A player's Champion levels up as they do what its faction does (gainXP); its
// stats and keywords come from its owner's level, and its abilities work only
// while it is on the table (champOn). An Ultra Legend levels the same way
// (P.champ is its cid), but waits beside the deck (P.legend) until played.
const isChamp = (c) => !!def(c).champion;
const isLegend = (c) => !!def(c).legend;
// Ultra (version 2): a creature with the Fuse keyword is a Symbiote (see fuseNeeds).
const isSymbiote = (c) => def(c).keywords.includes('fuse');
// The XP a Champion or Legend needs for Levels 2 and 3 (a Legend may need more with three players: xp.at3).
export const xpAt = (s, cid) => (s.players.length > 2 && BY_ID[cid].xp.at3) || BY_ID[cid].xp.at;
export function champLevel(s, pi) {
  const P = s.players[pi];
  if (!P?.champ) return 0;
  const at = xpAt(s, P.champ);
  return 1 + (P.cxp >= at[0] ? 1 : 0) + (P.cxp >= at[1] ? 1 : 0);
}
function champOn(s, pi, cid, level) {
  const P = s.players[pi];
  return P.champ === cid && champLevel(s, pi) >= level && P.board.some((u) => s.cards[u].cid === cid);
}
function gainXP(s, pi, what, n = 1) {
  const P = s.players[pi];
  if (!P?.champ || P.out || n <= 0 || BY_ID[P.champ].xp.what !== what) return;
  const before = champLevel(s, pi);
  P.cxp += n;
  const after = champLevel(s, pi);
  if (after > before) {
    log(s, pi, `${BY_ID[P.champ].name} reaches Level ${after}!`);
    ev(s, { k: 'levelup', p: pi, cid: P.champ, level: after });
  }
}
// its Power (0), Vitality (1) or keywords (2) at its owner's level
const champStat = (s, c, i) => def(c).levels[Math.max(0, champLevel(s, c.owner) - 1)][i];

export function power(s, c) {
  let p = (isChamp(c) ? champStat(s, c, 0) : def(c).power) + (c.pP || 0) + (c.tP || 0);
  if (c.zone === 'board') {
    const board = boardOf(s, c);
    for (const u of board) if (u !== c.uid && s.cards[u].cid === 'standard-keeper') p += 1;
    if (c.cid === 'street-recruit' && board.length > 1) p += 1;
    if (c.cid === 'spirit') p += countOn(s, board, 'choirmother') + (champOn(s, c.ctrl, 'champion-radiant', 2) ? 1 : 0);
    if (c.cid === 'bloodrage-berserker') p += c.dmg || 0;
    if (s.ultra) p += v4Bonus(s, c, board)[0];
    if (s.ultra && BY_ID[s.players[c.ctrl].champ]?.legend) p = legendPower(s, c, p);
  }
  return Math.max(0, p);
}
// What a Legend on the table does for its side's Power (Ultra).
function legendPower(s, c, p) {
  const pi = c.ctrl;
  switch (s.players[pi].champ) {
    case 'legend-aeris': if (c.cid !== 'legend-aeris' && hasKw(s, c, 'soar') && champOn(s, pi, 'legend-aeris', 2)) p += 1; break;
    case 'legend-vesh': if (c.dmg > 0 && champOn(s, pi, 'legend-vesh', 3)) p += c.dmg; break;
    case 'legend-lumen': if (c.token && champOn(s, pi, 'legend-lumen', 2)) p += 1; break;
    case 'legend-halvard': if (hasKw(s, c, 'guard') && champOn(s, pi, 'legend-halvard', 3)) p = Math.max(p, vitality(s, c)); break;
    case 'legend-kasimir': if (def(c).cost <= 2 && champOn(s, pi, 'legend-kasimir', 2)) p += 1; break;
  }
  return p;
}
// Ultra (version 4): what the Field and the newer cards add to a creature on the table, [Power, Vitality].
function v4Bonus(s, c, board) {
  let p = 0, v = 0;
  if (c.cid === 'the-merchant-tortoise') { const m = s.players[c.ctrl].maxEnergy; p += m - def(c).power; v += m - def(c).vitality; }
  if (c.cid === 'storm-shepherd' && fieldMine(s, c.ctrl)) { p += 2; v += 1; }
  if (fieldIs(s, 'the-eye-of-the-storm') && fieldMine(s, c.ctrl)) { p += 1; v += 1; }
  if (fieldIs(s, 'gale-winds') && hasKw(s, c, 'soar')) { p += 1; v += 1; }
  if (c.attacking) p += countOn(s, board, 'war-drummer') - (c.cid === 'war-drummer' ? 1 : 0);
  return [p, v];
}
export function vitality(s, c) {
  let v = (isChamp(c) ? champStat(s, c, 1) : def(c).vitality) + (c.pV || 0) + (c.tV || 0);
  if (c.zone === 'board' && c.cid === 'spirit') v += countOn(s, boardOf(s, c), 'choirmother') + (champOn(s, c.ctrl, 'champion-radiant', 2) ? 1 : 0);
  if (c.zone === 'board' && s.ultra && hasKw(s, c, 'guard')) v += 2 * (countOn(s, boardOf(s, c), 'shield-captain') - (c.cid === 'shield-captain' ? 1 : 0));
  if (c.zone === 'board' && s.ultra) v += v4Bonus(s, c, boardOf(s, c))[1];
  return v;
}

// Printed keywords, plus what other cards grant and this turn's Tricks.
export function hasKw(s, c, kw) {
  if (def(c).keywords.includes(kw)) return true;
  if (isChamp(c) && champStat(s, c, 2).includes(kw)) return true;
  if (c.tKw && c.tKw.includes(kw)) return true;
  if (c.fuseKw && c.fuseKw.includes(kw)) return true;
  if (c.zone !== 'board') return false;
  if (kw === 'soar' && c.cid === 'spirit' && (countOn(s, boardOf(s, c), 'choirmother') || champOn(s, c.ctrl, 'champion-radiant', 2))) return true;
  if (kw === 'rush' && s.players[c.ctrl].relics.some((u) => s.cards[u].cid === 'banner-of-the-charge')) return true;
  if (kw === 'drain' && c.dmg > 0 && s.ultra && champOn(s, c.ctrl, 'legend-vesh', 2)) return true;
  if (kw === 'soar' && s.ultra && fieldIs(s, 'the-eye-of-the-storm') && fieldMine(s, c.ctrl)) return true;
  return false;
}

// ── what is helping a creature (its card sheet) ─────────────────────
// A line for each thing doing something for it right now, by the same rules as
// power, vitality and hasKw above and buff, heal, fight and the start of a turn
// below: its own growth and this turn's boosts first, then the cards on its side
// ("Shield Captain: +0/+2…"), then the Field. ("each turn": at the start of its
// owner's turn.)
const signed = (n) => `${n < 0 ? '−' : '+'}${Math.abs(n)}`;
const weakestOf = (s, P) => P.board.map((u) => s.cards[u]).reduce((m, x) => (power(s, x) < power(s, m) ? x : m));
export function helpers(s, c) {
  if (!c || c.zone !== 'board') return [];
  const P = s.players[c.ctrl], out = [];
  const on = (cid, self = false) => P.board.filter((u) => (self || u !== c.uid) && s.cards[u].cid === cid).length;
  const relics = (cid) => P.relics.filter((u) => s.cards[u].cid === cid).length;
  const say = (cid, k, text) => { if (k > 0) out.push(`${BY_ID[cid].name}${k > 1 ? ` ×${k}` : ''}: ${text}`); };
  if (c.pP || c.pV) {
    const cap = ultraV3(s) && ULTRA_V2.growthCap ? growthCap(s, c) : null; // (the growth cap: at its ceiling?)
    out.push(`Grown for good: ${signed(c.pP || 0)}/${signed(c.pV || 0)}${cap != null && Math.max(c.pP || 0, c.pV || 0) >= cap ? ` (its ceiling: +${cap}, your maximum Energy; Invest raises it)` : ''}`);
  }
  if (c.tP || c.tV) out.push(`This turn: ${signed(c.tP || 0)}/${signed(c.tV || 0)}`);
  if (c.cid === 'bloodrage-berserker' && c.dmg) out.push(`Its wounds: +${c.dmg}/+0`);
  if (c.cid === 'street-recruit' && P.board.length > 1) out.push('Not alone: +1/+0');
  const keepers = on('standard-keeper');
  say('standard-keeper', keepers, `+${keepers}/+0`);
  if (c.cid === 'spirit') {
    const k = on('choirmother');
    say('choirmother', k, `+${k}/+${k} and Soar`);
    if (champOn(s, c.ctrl, 'champion-radiant', 2)) say('champion-radiant', 1, '+1/+1 and Soar');
  }
  if (relics('banner-of-the-charge')) say('banner-of-the-charge', 1, 'Rush');
  // more for every boost that lasts
  const brambles = on('grandmother-bramble');
  say('grandmother-bramble', brambles, `+${brambles}/+${brambles} more whenever it grows for good`);
  if (c.cid !== 'champion-verdant' && champOn(s, c.ctrl, 'champion-verdant', 3)) say('champion-verdant', 1, '+1/+1 more whenever it grows for good');
  if (c.grown) { const k = relics('season-of-plenty'); say('season-of-plenty', k, `+${k}/+${k} each turn (it has grown)`); }
  if (weakestOf(s, P) === c) {
    say('heartwood-totem', relics('heartwood-totem'), '+1/+1 each turn while it’s the weakest');
    if (champOn(s, c.ctrl, 'champion-verdant', 2)) say('champion-verdant', 1, '+1/+1 each turn while it’s the weakest');
  }
  if (s.ultra) {
    if (hasKw(s, c, 'guard')) {
      const k = on('shield-captain'), all = on('shield-captain', true);
      if (all) out.push(`${BY_ID['shield-captain'].name}${all > 1 ? ` ×${all}` : ''}: ${k ? `+0/+${2 * k}, and ` : ''}+0/+${all} for good each time it blocks`);
    }
    const medics = on('field-medic', true);
    say('field-medic', medics, `heals ${2 * medics} more each turn`);
    const roots = on('rootmother', true);
    say('rootmother', roots, `+${roots}/+${roots} for good whenever it heals`);
    if (hasKw(s, c, 'soar')) { const k = on('thornback-archer', true); say('thornback-archer', k, `${2 * k} damage to whatever it fights, before anyone strikes`); }
    if (hasKw(s, c, 'drain') && on('bloodbinder', true)) say('bloodbinder', 1, 'it heals itself for the damage it deals');
    const wardens = on('gravewarden', true);
    say('gravewarden', wardens, `heals ${2 * wardens} and +${wardens}/+0 for good whenever another creature of yours dies`);
    if (!hasKw(s, c, 'bodyguard')) {
      for (const u of P.board) if (u !== c.uid && hasKw(s, s.cards[u], 'bodyguard')) out.push(`${nameOf(s.cards[u])}: Bodyguard, so opponents can’t aim Spells or abilities at this one`);
    }
    if (fieldIs(s, 'overgrowth')) out.push(`${BY_ID.overgrowth.name} (the Field): +1/+1 more whenever it grows for good`);
    if (fieldIs(s, 'sanctuary-spring')) out.push(`${BY_ID['sanctuary-spring'].name} (the Field): heals fully each turn (not poison)`);
    // (version 2) Shields, cards fused in, and its side's Legend
    if (c.shield) out.push(`${c.shield} Shield${c.shield > 1 ? 's' : ''}: ${c.shield > 1 ? 'each stops' : 'stops'} the next hit it would take`);
    if (c.fused) out.push(`${c.fused} card${c.fused > 1 ? 's' : ''} fused into it`);
    if (!(c.shield > 0) && on('shieldwright') && P.board.map((u) => s.cards[u]).filter((x) => !(x.shield > 0)).reduce((m, x) => (power(s, x) > power(s, m) ? x : m), c) === c) say('shieldwright', 1, 'a Shield at the start of your turn (your strongest without one)');
    const L = BY_ID[P.champ]?.legend ? P.champ : null, lv = (n) => L && champOn(s, c.ctrl, L, n);
    if (L === 'legend-halvard' && hasKw(s, c, 'guard')) { if (lv(3)) say(L, 1, 'its Power is its Vitality'); if (lv(2)) say(L, 1, 'blocks three attackers'); }
    if (L === 'legend-aeris' && c.cid !== L && hasKw(s, c, 'soar') && lv(2)) say(L, 1, '+1/+0');
    if (L === 'legend-vesh' && c.dmg > 0) { if (lv(3)) say(L, 1, `+${c.dmg}/+0 (its wounds)`); if (lv(2)) say(L, 1, 'Drain while it’s hurt'); }
    if (L === 'legend-lumen' && c.token && lv(2)) say(L, 1, `+1/+0${lv(3) ? ', and each opponent loses 1 Life when it dies' : ''}`);
    if (L === 'legend-ymra' && hasKw(s, c, 'unstable') && lv(3)) say(L, 1, 'when it erupts, your other creatures are spared and it keeps half its growth');
    // (version 4)
    if (L === 'legend-kasimir' && def(c).cost <= 2 && lv(2)) say(L, 1, '+1/+0 (it costs 2 or less)');
    if (c.cid === 'the-merchant-tortoise') out.push(`Its Power and Vitality are your maximum Energy: ${P.maxEnergy}`);
    if (c.cid === 'storm-shepherd' && fieldMine(s, c.ctrl)) out.push('Your Field is in play: +2/+1');
    if (fieldIs(s, 'gale-winds') && hasKw(s, c, 'soar')) out.push(`${BY_ID['gale-winds'].name} (the Field): +1/+1`);
    if (fieldIs(s, 'the-eye-of-the-storm') && fieldMine(s, c.ctrl)) out.push(`${BY_ID['the-eye-of-the-storm'].name} (your Field): +1/+1 and Soar`);
    const drums = on('war-drummer');
    say('war-drummer', drums, `+${drums}/+0 while it attacks`);
  }
  return out;
}

// Ultra: how far an Unstable creature is from erupting. It swells at the start
// of its owner's turn (+2/+2, more with what adds to every lasting boost, and
// Season of Plenty after that) and erupts at ULTRA_RULES.unstableAt Power; at 10
// already (a boost that doesn't last), it erupts with its next boost.
export function unstableClock(s, c) {
  if (!s.ultra || !c || c.zone !== 'board' || !hasKw(s, c, 'unstable')) return null;
  const P = s.players[c.ctrl], at = ULTRA_RULES.unstableAt, p = power(s, c);
  const more = (fieldIs(s, 'overgrowth') ? 1 : 0) + countOn(s, P.board, 'grandmother-bramble') - (c.cid === 'grandmother-bramble' ? 1 : 0)
    + (c.cid !== 'champion-verdant' && champOn(s, c.ctrl, 'champion-verdant', 3) ? 1 : 0);
  const seasons = P.relics.filter((u) => s.cards[u].cid === 'season-of-plenty').length;
  const swell = 2 + more + seasons * (1 + more);
  return { p, at, swell: 2 + more, turns: Math.max(1, Math.ceil((at - p) / swell)) };
}

const creaturesIn = (s, uids) => uids.filter((u) => def(s.cards[u]).type === 'creature').length;

function price(s, pi, c, from = 'hand') {
  const d = def(c), P = s.players[pi];
  let cost = from === 'discard' ? d.echo : d.cost;
  if (d.champion) cost = (d.legend ? d.cost : 2) + 2 * (c.deaths || 0); // (2 more each time it has died)
  if (from === 'hand') {
    switch (c.cid) {
      case 'the-mountain-is-angry': cost = Math.max(3, cost - s.died); break;
      case 'bonepicker': if (s.died > 0) cost -= 1; break;
      case 'something-beneath': cost = Math.max(2, cost - Math.floor(creaturesIn(s, P.discard) / 2)); break;
      case 'death-is-a-door': if (s.diedOwn[pi] > 0) cost = 3; break;
      case 'the-forest-remembers': cost = Math.max(3, cost - P.board.filter((u) => s.cards[u].grown).length); break;
    }
  }
  if (d.type === 'spell' && P.ripple > 0) cost -= 1; // Ripple: the next Spell this turn
  if (d.type === 'spell' && champOn(s, pi, 'champion-ember', 3)) cost -= 1;
  let usesMirror = false;
  if (d.type === 'spell' && !P.mirror && cost <= 2) {
    const mages = countOn(s, P.board, 'mirror-mage');
    if (mages) { cost -= mages; usesMirror = true; }
  }
  if (s.ultra) cost = v4Price(s, pi, d, cost);
  return { cost: Math.max(0, cost), usesMirror };
}
// Ultra (version 4): the costs the newer cards change.
function v4Price(s, pi, d, cost) {
  const P = s.players[pi];
  if (cost >= 7 && champOn(s, pi, 'legend-marisol', 3)) cost -= 2;
  if (d.type === 'spell' && P.spells === 0 && champOn(s, pi, 'legend-ione', 2)) cost -= 1; // (version 5)
  if ((isTrick(d) || d.subtype === 'Trap') && champOn(s, pi, 'legend-mirelle', 2)) cost -= 1;
  if (d.type === 'field') {
    cost -= countOn(s, P.board, 'weatherwitch');
    for (const o of opponents(s, pi)) cost += 3 * countOn(s, o.board, 'keeper-of-the-skies');
  }
  if (d.type === 'spell' && cost > 1) cost = Math.max(1, cost - P.relics.filter((u) => s.cards[u].cid === 'the-arcane-well').length);
  return cost;
}
export const costOf = (s, pi, c, from = 'hand') => price(s, pi, c, from).cost;

// ── zones ───────────────────────────────────────────────────────────
const TABLE_STATE = ['dmg', 'pP', 'pV', 'tP', 'tV', 'played', 'rush', 'awake', 'grown', 'sacEnd', 'gTurn', 'aTurn', 'hurt',
  'ex', 'frozen', 'tKw', 'ctrl', 'stolen', 'venomed', 'chimes', 'usedOn',
  'fuseKw', 'shelter', 'hex', 'poison', 'erupting', 'stage', 'stageOn', 'fused', 'fuseGrows', 'shield', 'stored', 'clock']; // (the last line: Ultra)
function resetPlay(c) {
  for (const k of TABLE_STATE) delete c[k];
  if (c.baseCid) { c.cid = c.baseCid; delete c.baseCid; }
}

function enterPlay(s, c, pi) {
  resetPlay(c);
  Object.assign(c, { zone: 'board', ctrl: pi, dmg: 0, pP: 0, pV: 0, tP: 0, tV: 0, played: s.turn, ex: false, gTurn: -1, aTurn: -1 });
  if (s.ultra) {
    c.shelter = ULTRA_V2.shelter && !(ultraV2(s) && isSymbiote(c)); // (until its controller's next turn; a Symbiote goes without)
    if (def(c).keywords.includes('shield')) c.shield = 1; // (it starts with one)
    // a creature sent back to the hand kept its growth
    if (c.keepP || c.keepV) { c.pP = c.keepP || 0; c.pV = c.keepV || 0; c.grown = true; }
    if (c.keepKw) c.fuseKw = c.keepKw;
  }
  delete c.keepP; delete c.keepV; delete c.keepKw;
  s.players[pi].board.push(c.uid);
}

// Anything headed for a discard pile comes through here: tokens vanish,
// Echo cards are removed from the game, and Forbidden Archivist watches
// for cards leaving hand or deck.
function toDiscard(s, c, from) {
  const P = s.players[c.owner];
  delete c.keepP; delete c.keepV; delete c.keepKw;
  if (isChamp(c)) { // (a Champion goes back to its owner's hand instead, dearer each time; a Legend beside the deck)
    if (from === 'board') c.deaths = (c.deaths || 0) + 1;
    if (isLegend(c)) { c.zone = 'legend'; log(s, c.owner, `${nameOf(c)} goes back beside ${P.name}'s deck${from === 'board' ? ', 2 Energy dearer' : ''}.`); return; }
    c.zone = 'hand';
    if (!P.hand.includes(c.uid)) P.hand.push(c.uid);
    log(s, c.owner, `${nameOf(c)} goes back to ${P.name}'s hand.`);
    return;
  }
  if (c.token) { c.zone = 'gone'; return; }
  if (c.echoed) { c.zone = 'exile'; P.exile.push(c.uid); return; }
  c.zone = 'discard';
  P.discard.push(c.uid);
  if (from === 'hand' || from === 'deck') archivist(s, c.owner);
}

function toHand(s, c, from) {
  const P = s.players[c.owner];
  c.echoed = false;
  if (c.token) { c.zone = 'gone'; return; }
  if (isLegend(c)) { c.zone = 'legend'; log(s, c.owner, `${nameOf(c)} goes back beside ${P.name}'s deck.`); return; } // (keeping what a bounce keeps)
  if (P.hand.length >= handMax(s, P)) { log(s, c.owner, `${P.name}'s hand is full; ${nameOf(c)} goes to the discard pile.`); toDiscard(s, c, from); return; }
  c.zone = 'hand';
  P.hand.push(c.uid);
}

// (`turnDraw`: the draw every turn starts with; any other is an extra card, for Nim)
export function draw(s, pi, n = 1, turnDraw = false) {
  const P = s.players[pi];
  for (let k = 0; k < n && !P.out; k++) {
    if (!P.deck.length) {
      // (the deck clock: Life once, at the start of the turn; any other draw finds nothing)
      if (s.deckClock && !turnDraw) { log(s, pi, `${P.name}'s deck is empty: nothing to draw.`); break; }
      log(s, pi, `${P.name} has no cards left to draw and loses ${RULES.emptyDeckDamage} Life.`);
      loseLife(s, pi, RULES.emptyDeckDamage);
      if (s.deckClock) break;
      continue;
    }
    const c = s.cards[P.deck.shift()];
    if (P.hand.length >= handMax(s, P)) {
      log(s, pi, `${P.name}'s hand is full; ${nameOf(c)} goes to the discard pile.`);
      toDiscard(s, c, 'deck');
      continue;
    }
    c.zone = 'hand';
    P.hand.push(c.uid);
    ev(s, { k: 'draw', p: pi });
    for (const u of [...P.board]) if (s.cards[u].cid === 'brook-hydra') buff(s, s.cards[u], 1, 1, true);
    if (!turnDraw) gainXP(s, pi, 'draw', 1);
    if (champOn(s, pi, 'champion-tide', 3)) {
      log(s, pi, `${BY_ID['champion-tide'].name}: each opponent loses 1 Life.`);
      for (const o of opponents(s, pi)) loseLife(s, o.i, 1);
    }
  }
}

function mill(s, pi, n) {
  const P = s.players[pi];
  for (let k = 0; k < n && P.deck.length; k++) {
    const c = s.cards[P.deck.shift()];
    log(s, pi, `${nameOf(c)} goes from ${P.name}'s deck to the discard pile.`);
    toDiscard(s, c, 'deck');
  }
}

function archivist(s, pi) {
  const P = s.players[pi];
  for (const u of [...P.board]) {
    const a = s.cards[u];
    if (a.cid !== 'forbidden-archivist' || a.zone !== 'board' || a.aTurn === s.turn) continue;
    a.aTurn = s.turn;
    log(s, pi, `Forbidden Archivist: ${P.name} loses 1 Life and draws a card.`);
    loseLife(s, pi, 1);
    draw(s, pi, 1);
  }
}

// ── life ────────────────────────────────────────────────────────────
// `by`: whose card made them lose it, when that isn't plain from the move (stats.js)
function loseLife(s, pi, n, by = null) {
  const P = s.players[pi];
  if (n <= 0 || P.out) return;
  P.life -= n;
  ev(s, by != null ? { k: 'life', p: pi, n: -n, by } : { k: 'life', p: pi, n: -n });
  if (P.life <= 0) eliminate(s, pi);
}
function gainLife(s, pi, n) {
  const P = s.players[pi];
  if (n <= 0 || P.out) return;
  P.life += n;
  ev(s, { k: 'life', p: pi, n });
}
function eliminate(s, pi) {
  const P = s.players[pi];
  if (P.out) return;
  P.out = true;
  log(s, pi, `${P.name} is out!`);
  // Their cards leave the table; creatures they had taken go back home.
  for (const Q of s.players) for (const u of [...Q.board]) {
    const c = s.cards[u];
    if (c.owner === pi) { removeFrom(Q.board, u); c.zone = 'gone'; }
    else if (Q.i === pi) {
      removeFrom(Q.board, u);
      const O = s.players[c.owner];
      if (!O.out && O.board.length < RULES.boardMax) { O.board.push(u); c.ctrl = O.i; delete c.stolen; } else { resetPlay(c); toDiscard(s, c, 'board'); }
    }
  }
  for (const u of [...P.relics, ...P.traps]) s.cards[u].zone = 'gone';
  P.relics = [];
  P.traps = [];
  // Their Crown goes to whoever's turn it is (back to the middle if it was their own).
  if (s.crown === pi) setCrown(s, s.active !== pi && !s.players[s.active].out ? s.active : null);
  if (s.combat && (s.combat.a === pi || s.combat.d === pi)) { clearCombatMarks(s); s.combat = null; s.phase = 'main'; }
  const alive = living(s);
  if (alive.length <= 1) {
    s.phase = 'over';
    s.combat = null;
    s.winner = alive.length ? alive[0].i : null;
    log(s, s.winner, alive.length ? `${alive[0].name} wins!` : 'Nobody is left standing.');
  }
}

// ── the Crown ───────────────────────────────────────────────────────
// Three-player games: the first player to hit someone in a fight takes the
// Crown, hitting whoever holds it takes it from them, and the holder draws
// an extra card at the end of each of their turns. It keeps everyone attacking.
function setCrown(s, to) {
  if (!s.crownOn || s.crown === to) return;
  const from = s.crown;
  s.crown = to;
  if (to == null) log(s, null, 'The Crown goes back to the middle: the next player to hit someone in a fight takes it.');
  else log(s, to, from == null ? `${s.players[to].name} takes the Crown!` : `${s.players[to].name} takes the Crown from ${s.players[from].name}!`);
  ev(s, { k: 'crown', p: to, from });
}

// ── creatures: buffs, damage, death ─────────────────────────────────
function buff(s, c, dP, dV, permanent, fromBramble = false, uncapped = false) {
  if (!c || c.zone !== 'board' || (dP <= 0 && dV <= 0)) return;
  if (permanent && !uncapped && ultraV3(s) && ULTRA_V2.growthCap) {
    // (the growth cap: no more lasting growth than its controller's maximum Energy)
    const cap = growthCap(s, c);
    dP = Math.max(0, Math.min(dP, cap - c.pP));
    dV = Math.max(0, Math.min(dV, cap - c.pV));
    if (dP <= 0 && dV <= 0) return;
  }
  if (permanent) { c.pP += dP; c.pV += dV; } else { c.tP += dP; c.tV += dV; }
  ev(s, { k: 'buff', uid: c.uid, dP, dV, perm: !!permanent });
  if (!c.awake) {
    c.awake = true;
    if (c.cid === 'mossback') { log(s, c.ctrl, 'Mossback awakens: gain 2 Life.'); gainLife(s, c.ctrl, 2); }
  }
  if (s.ultra && !c.erupting && hasKw(s, c, 'unstable') && power(s, c) >= ULTRA_RULES.unstableAt) { erupt(s, c); return; }
  if (!permanent) return;
  if (s.ultra && !fromBramble && fieldIs(s, 'overgrowth')) { log(s, c.ctrl, `Overgrowth: ${nameOf(c)} gets +1/+1 more.`); buff(s, c, 1, 1, true, true); }
  if (s.ultra && !fromBramble && s.castBy === c.ctrl && champOn(s, c.ctrl, 'legend-ione', 3)) { log(s, c.ctrl, `${BY_ID['legend-ione'].name}: ${nameOf(c)} gets +1/+1 more.`); buff(s, c, 1, 1, true, true); } // (version 5)
  c.grown = true;
  gainXP(s, c.ctrl, 'grow', 1);
  const board = s.players[c.ctrl].board;
  if (!fromBramble && c.cid !== 'champion-verdant' && c.zone === 'board' && champOn(s, c.ctrl, 'champion-verdant', 3)) {
    log(s, c.ctrl, `${BY_ID['champion-verdant'].name}: ${nameOf(c)} gets +1/+1 more.`);
    buff(s, c, 1, 1, true, true);
  }
  if (!fromBramble) {
    for (const u of [...board]) {
      if (u === c.uid || s.cards[u].cid !== 'grandmother-bramble' || c.zone !== 'board') continue;
      log(s, c.ctrl, `Grandmother Bramble: ${nameOf(c)} gets +1/+1 more.`);
      buff(s, c, 1, 1, true, true);
    }
  }
  for (const u of [...board]) {
    const g = s.cards[u];
    if (g.cid !== 'little-gardener' || g.uid === c.uid || g.gTurn === s.turn) continue;
    g.gTurn = s.turn;
    log(s, c.ctrl, 'Little Gardener grows +1/+1.');
    buff(s, g, 1, 1, true);
  }
}

// Ultra (version 2, with ULTRA_V2.growthCap): how much a creature can grow for good.
export const growthCap = (s, c) => s.players[c.ctrl].maxEnergy;

const giveKw = (c, ...kws) => { if (c && c.zone === 'board') c.tKw = [...(c.tKw || []), ...kws]; };

// Ultra: at 10 Power an Unstable creature erupts, then starts again from its printed size.
// (Ymra at Level 3: its side is spared, and it keeps half of what it had grown.)
function erupt(s, c) {
  c.erupting = true;
  const ymra = s.ultra && champOn(s, c.ctrl, 'legend-ymra', 3);
  log(s, c.ctrl, `${nameOf(c)} erupts: 3 damage to every other creature and every player!`);
  ev(s, { k: 'erupt', uid: c.uid });
  for (const Q of s.players) for (const u of [...Q.board]) if (u !== c.uid && !(ymra && Q.i === c.ctrl)) damage(s, s.cards[u], 3, c);
  for (const Q of living(s)) damagePlayer(s, Q.i, 3, c);
  if (ymra) log(s, c.ctrl, `${BY_ID['legend-ymra'].name}: ${s.players[c.ctrl].name}’s creatures are spared, and ${nameOf(c)} keeps half its growth.`);
  Object.assign(c, { pP: ymra ? Math.floor(Math.max(0, c.pP) / 2) : 0, pV: ymra ? Math.floor(Math.max(0, c.pV) / 2) : 0, tP: 0, tV: 0 });
  delete c.erupting;
}

// Ultra: wounds stay until they heal. Poison (Venom's damage) only a cure takes away.
function heal(s, c, n, cure = false) {
  if (!c || c.zone !== 'board' || n <= 0 || c.dmg <= 0) return 0;
  const k = cure ? c.dmg : Math.min(n, Math.max(0, c.dmg - (c.poison || 0)));
  if (cure) c.poison = 0;
  if (k <= 0) return 0;
  c.dmg -= k;
  ev(s, { k: 'heal', uid: c.uid, n: k });
  const roots = countOn(s, s.players[c.ctrl].board, 'rootmother');
  if (roots) { log(s, c.ctrl, `Rootmother: ${nameOf(c)} heals and grows +${roots}/+${roots}.`); buff(s, c, roots, roots, true); }
  return k;
}

// Ultra: Shields stack; each stops one hit (damage above).
function giveShield(s, c, n = 1) {
  if (!c || c.zone !== 'board') return;
  c.shield = (c.shield || 0) + n;
  log(s, c.ctrl, `${nameOf(c)} gets a Shield${c.shield > 1 ? ` (${c.shield} now)` : ''}.`);
  ev(s, { k: 'shield', uid: c.uid, n });
}

// Ultra: +1 max Energy for good (up to 12). Outside Ultra, the old rule (up to 8).
function invest(s, pi) {
  const P = s.players[pi];
  if (!s.ultra) { P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1); return; }
  if (P.maxEnergy >= ULTRA_RULES.maxEnergy) { log(s, pi, `${P.name}'s Energy is already as high as it goes.`); return; }
  P.invest = (P.invest || 0) + 1;
  P.maxEnergy += 1;
  log(s, pi, `${P.name} invests: maximum Energy ${P.maxEnergy}, for good.`);
  ev(s, { k: 'invest', p: pi });
  gainXP(s, pi, 'invest', 1);
  if (champOn(s, pi, 'legend-marisol', 2)) { log(s, pi, `${BY_ID['legend-marisol'].name}: ${P.name} draws a card.`); draw(s, pi, 1); }
  for (const o of opponents(s, pi)) { // (version 5: a Tollkeeper takes its toll)
    const k = countOn(s, o.board, 'tollkeeper');
    if (k) { log(s, o.i, `Tollkeeper: ${o.name} draws ${k > 1 ? `${k} cards` : 'a card'}.`); draw(s, o.i, k); }
  }
}

// Ultra: opponents can't aim Spells or abilities at a Sheltered creature (one
// that arrived since its controller's turn began), and a Bodyguard is the only
// creature on its side they can aim at.
function aimable(s, pi, uids) {
  if (!s.ultra) return uids;
  return uids.filter((u) => {
    const c = s.cards[u];
    if (c.ctrl === pi) return true;
    if (c.shelter) return false;
    const guards = s.players[c.ctrl].board.filter((x) => hasKw(s, s.cards[x], 'bodyguard'));
    return !guards.length || guards.includes(u);
  });
}

// Ultra: a creature with Fuse joins another of yours, which keeps its Power, Vitality and keywords.
function fuse(s, pi, c, t) {
  if (!t || t.zone !== 'board' || c.zone !== 'board' || t.uid === c.uid) return;
  const dP = Math.max(0, power(s, c) - (c.tP || 0)), dV = Math.max(0, vitality(s, c) - (c.tV || 0));
  const kws = [...new Set([...def(c).keywords, ...(c.fuseKw || [])])].filter((k) => k !== 'fuse' && KEYWORDS[k]);
  removeFrom(s.players[c.ctrl].board, c.uid);
  ev(s, { k: 'fuse', uid: c.uid, to: t.uid });
  resetPlay(c);
  toDiscard(s, c, 'board');
  t.fuseKw = [...new Set([...(t.fuseKw || []), ...kws])];
  log(s, pi, `${nameOf(c)} fuses into ${nameOf(t)}: +${dP}/+${dV}${kws.length ? `, ${kws.map((k) => KEYWORDS[k].name).join(', ')}` : ''}, for good.`);
  buff(s, t, dP, dV, true);
  if (ultraV2(s)) fusedMore(s, t);
}

// Ultra (version 2): any creature card can be fused in from the hand, for its
// cost: one of your creatures gets its printed Power, Vitality and the keywords
// below for good (Grows adds to its own; Unstable can set it off at once). On
// your turn into any creature of yours, or in a fight, like a Trick, into one
// of yours that is in it. The card goes to the discard pile; what it gave is
// lost with the creature.
const FUSE_KW = new Set(['rush', 'soar', 'reach', 'guard', 'swift', 'venom', 'drain', 'overrun', 'watchful', 'hunt', 'bodyguard', 'grows', 'multiply', 'unstable']);
export function fuseHosts(s, pi) {
  const own = s.players[pi].board.filter((u) => ULTRA_V2.fuseLegend || !isLegend(s.cards[u]));
  if (s.phase !== 'combat') return [...own];
  if (!ULTRA_V2.fuseFight) return [];
  const C = s.combat;
  if (C.a === pi) return own.filter((u) => C.att.includes(u));
  if (C.d !== pi) return [];
  if (C.step === 'block') return own.filter((u) => C.att.some((x) => canBlock(s, s.cards[u], s.cards[x])));
  return own.filter((u) => Object.values(C.blk).some((bs) => bs.includes(u)));
}
function checkFuse(s, a, P, c, d) {
  if (!ultraV2(s) || !ULTRA_V2.fuseHand) return 'Fusing from the hand is a SATTC Ultra rule.';
  if (a.from) return 'Only a card from your hand can be fused in.';
  if (d.type !== 'creature') return 'Only a creature card can be fused into a creature.';
  if (!fuseHosts(s, a.p).includes(a.fuse)) return s.phase === 'combat' ? 'In a fight, fuse it into one of your creatures in that fight.' : 'Fuse it into one of your own creatures.';
  if (fuseCost(s, a.p, c, s.cards[a.fuse]) > P.energy) return 'Not enough Energy.';
  return null;
}
// Its cost, and more for each card already fused into that creature (ULTRA_V2.fuseTax).
export const fuseCost = (s, pi, c, host) => price(s, pi, c, 'hand').cost + ULTRA_V2.fuseTax * (host?.fused || 0);
function fuseIn(s, pi, c, t) {
  const d = def(c);
  const kws = d.keywords.filter((k) => FUSE_KW.has(k));
  log(s, pi, `${s.players[pi].name} fuses ${d.name} into ${nameOf(t)}: +${d.power}/+${d.vitality}${kws.length ? `, ${kws.map((k) => KEYWORDS[k].name).join(', ')}` : ''}, for good.`);
  ev(s, { k: 'fuse', uid: c.uid, to: t.uid, p: pi, cid: c.cid, hand: true });
  toDiscard(s, c, 'fused');
  t.fuseKw = [...new Set([...(t.fuseKw || []), ...kws.filter((k) => k !== 'grows')])];
  if (d.grows) t.fuseGrows = (t.fuseGrows || 0) + d.grows;
  buff(s, t, d.power, d.vitality, true);
  if (d.keywords.includes('shield')) giveShield(s, t); // (a card that starts with a Shield brings it)
  if (t.zone === 'board') fusedMore(s, t);
}
// After a fuse: count it on the creature, and Ymra (Level 2) adds +1/+1.
function fusedMore(s, t) {
  t.fused = (t.fused || 0) + 1;
  if (t.zone === 'board' && champOn(s, t.ctrl, 'legend-ymra', 2)) {
    log(s, t.ctrl, `${BY_ID['legend-ymra'].name}: ${nameOf(t)} gets +1/+1 more.`);
    buff(s, t, 1, 1, true);
  }
}

// `src` is the creature dealing the damage, for Venom and Drain.
// (`drain` / `venom`: as the striker had them when a simultaneous strike began; otherwise as it has them now)
function damage(s, c, n, src = null, drain = null, venom = null) {
  if (n <= 0 || !c || c.zone !== 'board') return;
  if (c.shield > 0) { // (Ultra: a Shield stops the whole hit, then breaks)
    c.shield -= 1;
    log(s, c.ctrl, `${nameOf(c)}’s Shield takes the hit and breaks.`);
    ev(s, { k: 'shield', uid: c.uid, n: -1 });
    return;
  }
  c.dmg += n;
  c.hurt = true;
  gainXP(s, c.ctrl, 'wound', 1);
  if (src && (venom ?? hasKw(s, src, 'venom'))) { if (s.ultra && ULTRA_V2.poison) c.poison = (c.poison || 0) + n; else c.venomed = true; }
  ev(s, { k: 'dmg', uid: c.uid, n, src: src ? src.uid : null });
  if (src && (drain ?? hasKw(s, src, 'drain'))) { gainLife(s, src.ctrl ?? src.owner, n); bloodbound(s, src, n); }
}

// Ultra: with a Bloodbinder out, your Drain creatures heal themselves for what they deal.
function bloodbound(s, src, n) {
  if (s.ultra && src.zone === 'board' && countOn(s, s.players[src.ctrl].board, 'bloodbinder')) heal(s, src, n);
}

function damagePlayer(s, pi, n, src = null, drain = null) {
  if (n <= 0 || s.players[pi].out) return;
  if (s.combat && s.combat.d === pi) s.combat.hurtD = true;
  log(s, pi, `${s.players[pi].name} takes ${n} damage.`);
  ev(s, { k: 'hitPlayer', p: pi, n, src: src ? src.uid : null });
  loseLife(s, pi, n);
  if (src && (drain ?? hasKw(s, src, 'drain'))) { gainLife(s, src.ctrl ?? src.owner, n); bloodbound(s, src, n); }
}

// target: { p } for a player, { uid } for a creature
function hit(s, target, n) {
  if (!target) return;
  if (target.p != null) damagePlayer(s, target.p, n);
  else if (s.cards[target.uid]?.zone === 'board') { log(s, null, `${nameOf(s.cards[target.uid])} takes ${n} damage.`); damage(s, s.cards[target.uid], n); }
}

// Creatures dying together all leave first, then their triggers happen,
// so a Kindly Undertaker that dies alongside a friend still sees it go.
function killBatch(s, dead) {
  const before = s.players.map((P) => [...P.board]);
  const gone = [];
  for (const c of dead) {
    if (c.zone !== 'board') continue;
    const ctrl = c.ctrl, as = c.cid;
    removeFrom(s.players[ctrl].board, c.uid);
    s.died += 1;
    s.diedOwn[ctrl] += 1;
    log(s, ctrl, `${nameOf(c)} dies.`);
    ev(s, { k: 'die', uid: c.uid, cid: as, owner: c.owner, ctrl });
    // Ultra, Legacy: half of what it grew (rounded up) passes on
    const legacy = s.ultra && ULTRA_V2.legacy && (c.pP > 0 || c.pV > 0) ? [Math.ceil(Math.max(0, c.pP) / 2), Math.ceil(Math.max(0, c.pV) / 2)] : null;
    resetPlay(c);
    toDiscard(s, c, 'board');
    gone.push({ c, as, ctrl, legacy });
  }
  for (const { c, as, ctrl, legacy } of gone) {
    const P = s.players[ctrl];
    if (legacy && P.board.length) {
      const heir = P.board.map((u) => s.cards[u]).reduce((m, x) => (power(s, x) < power(s, m) ? x : m));
      log(s, ctrl, `Legacy: ${BY_ID[as].name} passes +${legacy[0]}/+${legacy[1]} on to ${nameOf(heir)}.`);
      ev(s, { k: 'legacy', uid: heir.uid, from: c.uid });
      buff(s, heir, legacy[0], legacy[1], true);
    }
    for (const Q of s.players) gainXP(s, Q.i, 'death', 1);
    if (c.token && s.ultra && champOn(s, ctrl, 'legend-lumen', 3)) {
      log(s, ctrl, `${BY_ID['legend-lumen'].name}: each opponent loses 1 Life.`);
      for (const o of opponents(s, ctrl)) loseLife(s, o.i, 1, ctrl);
    }
    if (champOn(s, ctrl, 'champion-umbral', 2)) {
      log(s, ctrl, `${BY_ID['champion-umbral'].name}: each opponent loses 1 Life.`);
      for (const o of opponents(s, ctrl)) loseLife(s, o.i, 1);
    }
    for (const u of before[ctrl]) {
      if (u === c.uid) continue;
      const o = s.cards[u];
      if (o.cid === 'ash-collector' && o.zone === 'board' && o.ctrl === ctrl) buff(s, o, 1, 0, false);
      if (o.cid === 'kindly-undertaker') { log(s, ctrl, 'Kindly Undertaker: gain 1 Life.'); gainLife(s, ctrl, 1); }
      if (o.cid === 'lantern-ferryman' && o.zone === 'board' && o.ctrl === ctrl && !BY_ID[as].token) { log(s, ctrl, `The Lantern Ferryman carries ${BY_ID[as].name} across: a Spirit rises.`); makeTokens(s, ctrl, 'spirit', 1); }
      if (o.cid === 'the-pale-abbess') {
        log(s, ctrl, 'The Pale Abbess takes her tithe: each opponent loses 1 Life.');
        for (const o2 of opponents(s, ctrl)) loseLife(s, o2.i, 1);
      }
      if (o.cid === 'gravewarden' && o.zone === 'board' && o.ctrl === ctrl) {
        log(s, ctrl, 'Gravewarden: the rest heal 2 and get +1/+0 for good.');
        for (const x of [...P.board]) { heal(s, s.cards[x], 2); buff(s, s.cards[x], 1, 0, true); }
      }
    }
    for (const u of P.relics) if (s.cards[u].cid === 'the-kiln') {
      log(s, ctrl, 'The Kiln flares: 1 damage to each opponent.');
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 1);
    }
    for (const Q of s.players) for (const u of [...Q.board]) if (s.cards[u].cid === 'hungry-ghoul') buff(s, s.cards[u], 1, 1, true);
    if (BY_ID[as].keywords.includes('lastBreath')) lastBreath(s, c, as, ctrl);
  }
}

function lastBreath(s, c, as, ctrl) {
  switch (as) {
    case 'cinderling':
      log(s, ctrl, 'Cinderling’s Last Breath burns each opponent.');
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 1);
      break;
    case 'grave-rat':
      mill(s, ctrl, 2);
      break;
    case 'phoenix-of-the-last-spark': {
      const O = s.players[c.owner];
      if (c.zone !== 'discard' || c.cid !== 'phoenix-of-the-last-spark') break;
      c.phoenixTurn = O.turns + 1;
      log(s, c.owner, `The Phoenix can return to ${O.name}'s hand next turn for 2 Energy.`);
      break;
    }
    case 'smoldering-golem':
      log(s, ctrl, 'Smoldering Golem bursts: 2 damage to every creature and each opponent.');
      for (const Q of s.players) for (const u of [...Q.board]) damage(s, s.cards[u], 2);
      for (const o of opponents(s, ctrl)) damagePlayer(s, o.i, 2);
      break;
  }
}

function settle(s) {
  for (let guard = 0; guard < 60; guard++) {
    const dead = [];
    for (const P of s.players) for (const u of P.board) {
      const c = s.cards[u];
      if (c.dmg >= vitality(s, c) || (c.venomed && c.dmg > 0)) dead.push(c);
    }
    if (!dead.length) break;
    killBatch(s, dead);
  }
  for (const P of s.players) for (const u of [...P.board]) {
    const c = s.cards[u];
    if (!c.hurt) continue;
    c.hurt = false;
    if (c.cid === 'patient-giant') { log(s, c.ctrl, 'Patient Giant survives and gets +1 Power.'); buff(s, c, 1, 0, true); }
  }
}

function sacrifice(s, c) {
  log(s, c.ctrl, `${s.players[c.ctrl].name} sacrifices ${nameOf(c)}.`);
  sacrificed(s, c);
}
// A creature its controller sacrifices dies; then (Ultra, version 4) what pays off a sacrifice.
function sacrificed(s, c) {
  const pi = c.ctrl, token = !!(c.token || def(c).token), was = c.zone === 'board';
  killBatch(s, [c]);
  if (!was || !s.ultra) return;
  gainXP(s, pi, 'sac', 1);
  const P = s.players[pi], witches = countOn(s, P.board, 'mire-witch');
  if (witches) {
    log(s, pi, `Mire Witch: each opponent loses ${witches} Life, and ${P.name} gains ${2 * witches}.`);
    for (const o of opponents(s, pi)) loseLife(s, o.i, witches, pi);
    gainLife(s, pi, 2 * witches);
  }
  if (!token && champOn(s, pi, 'legend-morrow', 2)) { log(s, pi, `${BY_ID['legend-morrow'].name}: a Spirit rises from it.`); makeTokens(s, pi, 'spirit', 1); }
}
// An Offering (version 4): a creature of yours sacrificed as the card is played,
// for its stronger effect (which happens twice with Morrow at Level 3).
function offering(s, pi, a, strong, weak) {
  const o = a.offer != null ? s.cards[a.offer] : null;
  if (!o || o.zone !== 'board' || o.ctrl !== pi) { weak(); return; }
  log(s, pi, `${s.players[pi].name} makes an Offering of ${nameOf(o)}.`);
  sacrificed(s, o);
  strong();
  if (champOn(s, pi, 'legend-morrow', 3)) { log(s, pi, `${BY_ID['legend-morrow'].name}: the Offering pays twice.`); strong(); }
}

function bounce(s, c) {
  if (!c) return;
  // (Ultra before version 5: a creature sent back to the hand kept its growth; the rules audit cut that, 2026-11-09)
  if (s.ultra && ULTRA_V2.keepGrowth && !ultraV5(s) && c.zone === 'board') { c.keepP = Math.max(0, c.pP || 0); c.keepV = Math.max(0, c.pV || 0); if (c.fuseKw) c.keepKw = [...c.fuseKw]; }
  if (c.zone === 'board') removeFrom(s.players[c.ctrl].board, c.uid);
  else if (c.zone === 'relic') removeFrom(s.players[c.ctrl].relics, c.uid);
  else return;
  log(s, c.owner, `${nameOf(c)} returns to ${s.players[c.owner].name}'s hand.`);
  ev(s, { k: 'bounce', uid: c.uid });
  resetPlay(c);
  toHand(s, c, 'board');
}

function destroyRelic(s, c) {
  if (!c || c.zone !== 'relic') return;
  removeFrom(s.players[c.ctrl].relics, c.uid);
  log(s, c.ctrl, `${nameOf(c)} is destroyed.`);
  ev(s, { k: 'die', uid: c.uid, cid: c.cid, owner: c.owner, ctrl: c.ctrl });
  resetPlay(c);
  toDiscard(s, c, 'board');
}

// Move a creature onto another player's side of the table.
function takeControl(s, c, pi, until) {
  if (!c || c.zone !== 'board' || c.ctrl === pi) return false;
  const P = s.players[pi];
  if (P.board.length >= RULES.boardMax) { log(s, pi, `${P.name} has no room for ${nameOf(c)}.`); return false; }
  const from = c.ctrl;
  removeFrom(s.players[from].board, c.uid);
  P.board.push(c.uid);
  c.ctrl = pi;
  if (until) c.stolen = c.stolen || { back: from };
  else delete c.stolen;
  ev(s, { k: 'steal', uid: c.uid, from, to: pi });
  return true;
}

// `answer`: these are The Bright Choir's own (they don't call it again).
function makeTokens(s, pi, cid, n, answer = false) {
  const P = s.players[pi];
  let made = 0;
  for (let k = 0; k < n && P.board.length < RULES.boardMax; k++, made++) {
    const t = mk(s, cid, pi, 'board');
    enterPlay(s, t, pi);
    ev(s, { k: 'token', uid: t.uid, p: pi });
  }
  if (made) log(s, pi, `${P.name} creates ${made} ${BY_ID[cid].name}${made === 1 ? '' : 's'}.`);
  gainXP(s, pi, 'token', made);
  if (!made || cid !== 'spirit') return;
  gainXP(s, pi, 'spirit', made);
  const singers = countOn(s, P.board, 'dawnsinger');
  if (singers) {
    log(s, pi, `Dawnsinger: each opponent loses ${made * singers} Life.`);
    for (const o of opponents(s, pi)) loseLife(s, o.i, made * singers);
  }
  if (answer) return;
  for (const u of [...P.relics]) if (s.cards[u].cid === 'the-bright-choir') {
    log(s, pi, 'The Bright Choir answers.');
    makeTokens(s, pi, 'spirit', made, true);
  }
  if (champOn(s, pi, 'champion-radiant', 3)) {
    log(s, pi, `${BY_ID['champion-radiant'].name} answers.`);
    makeTokens(s, pi, 'spirit', made, true);
  }
}

// ── fighting ────────────────────────────────────────────────────────
export function canAttack(s, pi, c) {
  return !!c && c.zone === 'board' && c.ctrl === pi && !c.ex && !c.hex &&
    (c.played < s.turn || ((!!c.rush || hasKw(s, c, 'rush')) && !(s.ultra && fieldIs(s, 'hallowed-ground')))) &&
    !(isChamp(c) && !isLegend(c) && champLevel(s, c.owner) < 2); // (a Champion defends until Level 2)
}

// Can creature b block attacker a?
export function canBlock(s, b, a) {
  if (!b || b.zone !== 'board' || b.ex || b.hex || def(b).cantBlock) return false;
  if (a && hasKw(s, a, 'soar') && !hasKw(s, b, 'soar') && !hasKw(s, b, 'reach')) return false;
  return true;
}

export const blockLimit = (s, b) => (hasKw(s, b, 'guard') ? (s.ultra && champOn(s, b.ctrl, 'legend-halvard', 2) ? 3 : 2) : 1);

const otherSide = (C) => (C.prio === C.a ? C.d : C.a);
const combatOver = (s, C) => s.combat !== C;

function clearCombatMarks(s) {
  for (const P of s.players) for (const u of P.board) { delete s.cards[u].attacking; delete s.cards[u].blocking; }
}

function endCombat(s) {
  if (!s.combat) return;
  const C = s.combat;
  if (s.ultra && !C.hurtD && !s.players[C.d].out) { // (version 5: Hush counts attacks that didn't hurt her player)
    gainXP(s, C.d, 'stall', 1);
    if (champOn(s, C.d, 'legend-hush', 3)) { log(s, C.d, `${BY_ID['legend-hush'].name}: ${s.players[C.d].name} draws a card.`); draw(s, C.d, 1); }
  }
  clearCombatMarks(s);
  s.combat = null;
  if (s.phase === 'combat') s.phase = 'main';
  ev(s, { k: 'combatEnd' });
}

// Attackers that died, went home or changed sides leave the fight.
function pruneCombat(s) {
  const C = s.combat;
  if (!C) return;
  C.att = C.att.filter((u) => s.cards[u].zone === 'board' && s.cards[u].ctrl === C.a);
  if (!C.att.length) { log(s, C.a, 'No attackers are left; the fight is over.'); endCombat(s); }
}

function attack(s, pi, a) {
  const P = s.players[pi], d = a.target, Q = s.players[d];
  P.attackedOn = s.turn;
  const att = a.att.map((u) => s.cards[u]);
  s.phase = 'combat';
  const C = s.combat = { a: pi, d, att: [...a.att], hunt: (a.hunt || []).map((h) => [...h]), blk: {}, step: 'block', prio: d, passes: 0 };
  log(s, pi, `${P.name} attacks ${Q.name} with ${listNames(att.map(nameOf))}.`);
  for (const c of att) {
    c.attacking = true;
    if (!hasKw(s, c, 'watchful')) c.ex = true;
    ev(s, { k: 'attack', uid: c.uid, target: { p: d } });
  }
  for (const [au, tu] of C.hunt) log(s, pi, `${nameOf(s.cards[au])} hunts ${nameOf(s.cards[tu])}: it must block.`);
  // "Whenever it attacks"
  for (const c of att) {
    if (c.zone !== 'board') continue;
    if (c.cid === 'reckless-initiate') { log(s, pi, 'Reckless Initiate singes itself.'); damage(s, c, 1); }
    if (c.cid === 'ashmaw') {
      log(s, pi, `Ashmaw breathes fire over ${Q.name}'s creatures.`);
      ev(s, { k: 'breath', uid: c.uid, p: d });
      for (const u of [...Q.board]) damage(s, s.cards[u], 2, c);
    }
  }
  settle(s);
  if (combatOver(s, C)) return;
  // The defender's Traps spring now.
  for (const u of [...Q.traps]) {
    const t = s.cards[u];
    if (t.cid === 'riptide') {
      const live = C.att.map((x) => s.cards[x]).filter((x) => x.zone === 'board' && x.ctrl === pi);
      if (!live.length) continue;
      springTrap(s, Q, t);
      const big = live.reduce((m, x) => (def(x).cost > def(m).cost ? x : m), live[0]);
      bounce(s, big);
    } else if (t.cid === 'ambush-at-dawn') {
      springTrap(s, Q, t);
      makeTokens(s, d, 'spirit', 2);
    } else if (t.cid === 'pitfall' || t.cid === 'mirror-shield' || t.cid === 'grave-snare') {
      // Ultra: these catch the attacker with the most Power (Pitfall: only one with 5 or more)
      const live = C.att.map((x) => s.cards[x]).filter((x) => x.zone === 'board' && x.ctrl === pi);
      const big = live.length ? live.reduce((m, x) => (power(s, x) > power(s, m) ? x : m)) : null;
      if (!big || (t.cid === 'pitfall' && power(s, big) < 5)) continue;
      springTrap(s, Q, t);
      leaveFight(s, big);
      if (t.cid === 'pitfall') {
        Object.assign(big, { ex: true, frozen: true });
        log(s, pi, `${nameOf(big)} falls into the pit: out of the fight, and it won't ready next turn.`);
      } else if (t.cid === 'mirror-shield') {
        const n = Math.floor(power(s, big) / 2);
        log(s, pi, `${nameOf(big)} strikes its own reflection: out of the fight, and ${n} damage.`);
        damage(s, big, n);
      } else {
        big.hex = def(t).hex;
        log(s, pi, `${nameOf(big)} is caught: out of the fight, and it can't attack or block until ${P.name} pays ${big.hex} Energy.`);
        ev(s, { k: 'buff', uid: big.uid, dP: 0, dV: 0 });
      }
    } else if (t.cid === 'fog-bank') {
      springTrap(s, Q, t);
      C.fog = true;
      log(s, d, `A fog bank rolls in: no creature can hurt ${Q.name} in this fight.`);
    } else if (t.cid === 'bluff') {
      springTrap(s, Q, t);
      log(s, d, `It was only a bluff, and ${Q.name} invests and draws a card.`);
      invest(s, d);
      draw(s, d, 1);
    } else if (t.cid === 'backdraft') {
      const live = C.att.map((x) => s.cards[x]).filter((x) => x.zone === 'board' && x.ctrl === pi);
      if (!live.length) continue;
      springTrap(s, Q, t);
      log(s, d, 'The fire blows back: 2 damage to each attacker.');
      for (const x of live) damage(s, x, 2);
    }
  }
  settle(s);
  if (combatOver(s, C)) return;
  pruneCombat(s);
}

// A Trap takes an attacker out of the fight (it stays exhausted).
function leaveFight(s, c) {
  const C = s.combat;
  if (!C) return;
  C.att = C.att.filter((u) => u !== c.uid);
  delete c.attacking;
  ev(s, { k: 'leaveFight', uid: c.uid });
}

function springTrap(s, Q, t) {
  removeFrom(Q.traps, t.uid);
  log(s, Q.i, `${Q.name}'s Trap springs: ${nameOf(t)}!`);
  ev(s, { k: 'trap', p: Q.i, uid: t.uid, cid: t.cid });
  t.zone = 'stack';
  toDiscard(s, t, 'trap');
  if (s.ultra) gainXP(s, Q.i, 'trick', 1); // (Mirelle)
}

// C.blk maps each blocked attacker to its blockers, in the order they were chosen.
function declareBlocks(s, pi, blocks) {
  const C = s.combat, Q = s.players[pi];
  C.blk = {};
  for (const [b, at] of blocks) {
    (C.blk[at] ||= []).push(b);
    s.cards[b].blocking = true;
    ev(s, { k: 'block', uid: b, att: at });
  }
  const said = Object.entries(C.blk).map(([at, bs]) => `${listNames(bs.map((b) => nameOf(s.cards[b])))} ${bs.length > 1 ? 'block' : 'blocks'} ${nameOf(s.cards[at])}`);
  log(s, pi, said.length ? `${Q.name}: ${said.join('; ')}.` : `${Q.name} doesn't block.`);
  gainXP(s, pi, 'block', new Set(blocks.map(([u]) => u)).size);
  if (s.ultra) {
    const captains = countOn(s, Q.board, 'shield-captain');
    for (const b of [...new Set(blocks.map(([u]) => u))].map((u) => s.cards[u])) {
      if (captains && hasKw(s, b, 'guard')) { log(s, pi, `Shield Captain: ${nameOf(b)} holds and gets +0/+${captains} for good.`); buff(s, b, 0, captains, true); }
      if (b.cid === 'bastion-wall') { log(s, pi, `Bastion Wall: ${s.players[C.a].name} loses 2 Life.`); loseLife(s, C.a, 2, pi); }
    }
  }
  C.step = 'tricks';
  C.prio = C.a;
  C.passes = 0;
}

// Combat damage: Swift creatures strike first, then everyone still standing.
function fight(s) {
  const C = s.combat, d = C.d;
  const live = (c, side) => !!c && c.zone === 'board' && c.ctrl === side;
  const groups = C.att.map((u) => s.cards[u]).filter((c) => live(c, C.a))
    .map((a) => ({ a, bs: (C.blk[a.uid] || []).map((u) => s.cards[u]) }));
  ev(s, { k: 'fight', a: C.a, d });
  if (s.ultra) {
    // Thornback Archer covers a flier: 2 damage to whatever it fights, before anyone strikes
    const cover = (side, flier, foe) => {
      for (const u of [...s.players[side].board]) {
        const ar = s.cards[u];
        if (ar.cid !== 'thornback-archer' || foe.zone !== 'board') continue;
        log(s, side, `Thornback Archer covers ${nameOf(flier)}: 2 damage to ${nameOf(foe)}.`);
        ev(s, { k: 'strike', uid: ar.uid, to: foe.uid });
        damage(s, foe, 2, ar);
      }
    };
    for (const { a, bs } of groups) for (const b of bs) {
      if (live(a, C.a) && live(b, d) && hasKw(s, a, 'soar')) cover(C.a, a, b);
      if (live(a, C.a) && live(b, d) && hasKw(s, b, 'soar')) cover(d, b, a);
    }
    settle(s);
    if (combatOver(s, C)) return;
  }
  // Ultra (version 2): creatures ganging up on one attacker each strike 1 harder
  const together = (bs) => (ultraV2(s) && bs.length >= 2 ? ULTRA_V2.together : 0);
  for (const { a, bs } of groups) if (together(bs)) log(s, d, `${listNames(bs.map(nameOf))} gang up on ${nameOf(a)}: +${together(bs)} Power each.`);
  for (const first of [true, false]) {
    if (ultraV3(s)) {
      // Ultra (version 3): everyone striking in this step strikes at once, with the
      // Power, Drain and Venom they had before anyone was hurt (a wound taken in
      // the same exchange doesn't make the hit back harder: Bloodrage, Vesh)
      const hits = [];
      for (const { a, bs } of groups) {
        const standing = bs.filter((b) => live(b, d));
        if (live(a, C.a) && hasKw(s, a, 'swift') === first) hits.push(...strikePlan(s, a, bs, standing, d));
        for (const b of standing) if (live(a, C.a) && hasKw(s, b, 'swift') === first) hits.push({ from: b, to: a, n: power(s, b) + together(bs) });
      }
      for (const h of hits) { h.drain = hasKw(s, h.from, 'drain'); h.venom = hasKw(s, h.from, 'venom'); }
      for (const h of hits) {
        if (h.to.p == null) { ev(s, { k: 'strike', uid: h.from.uid, to: h.to.uid }); damage(s, h.to, h.n, h.from, h.drain, h.venom); continue; }
        if (h.overrun) log(s, h.from.ctrl, `${nameOf(h.from)} overruns!`);
        hitInFight(s, h.from, h.to.p, h.n, h.drain);
      }
    } else {
      for (const { a, bs } of groups) {
        const standing = bs.filter((b) => live(b, d));
        if (live(a, C.a) && hasKw(s, a, 'swift') === first) strike(s, a, bs, standing, d);
        for (const b of standing) {
          if (!live(a, C.a) || hasKw(s, b, 'swift') !== first) continue;
          ev(s, { k: 'strike', uid: b.uid, to: a.uid });
          damage(s, a, power(s, b) + together(bs), b);
        }
      }
    }
    settle(s);
    if (combatOver(s, C)) return;
  }
  endCombat(s);
}

// What an attacker's strike will hit (version 3: planned before anyone strikes), like strike below.
function strikePlan(s, a, bs, standing, d) {
  const pw = power(s, a);
  if (!bs.length) return [{ from: a, to: { p: d }, n: pw }];
  if (!standing.length) return hasKw(s, a, 'overrun') ? [{ from: a, to: { p: d }, n: pw }] : [];
  const { parts, rest } = splitDamage(s, a, standing, pw);
  const out = parts.map(([b, n]) => ({ from: a, to: b, n }));
  if (rest > 0) out.push({ from: a, to: { p: d }, n: rest, overrun: true });
  return out;
}

// `bs` are the creatures that blocked `a`; `standing` those still there.
function strike(s, a, bs, standing, d) {
  const pw = power(s, a);
  if (!bs.length) { hitInFight(s, a, d, pw); return; }
  // Its blockers are gone: only Overrun carries the damage through.
  if (!standing.length) { if (hasKw(s, a, 'overrun')) hitInFight(s, a, d, pw); return; }
  const { parts, rest } = splitDamage(s, a, standing, pw);
  for (const [b, n] of parts) {
    ev(s, { k: 'strike', uid: a.uid, to: b.uid });
    damage(s, b, n, a);
  }
  if (rest > 0) { log(s, a.ctrl, `${nameOf(a)} overruns!`); hitInFight(s, a, d, rest); }
}

// An attacker blocked by several creatures splits its damage: it destroys
// the costliest blockers it can, one after another; what is left lands on
// the next blocker, or with Overrun (once every blocker has its fill) on the player.
export function splitDamage(s, a, bs, pw) {
  const venom = hasKw(s, a, 'venom') && !(s.ultra && ULTRA_V2.poison); // (in Ultra, Venom poisons instead of killing)
  const lethal = (b) => { if (b.shield > 0) return Infinity; const left = Math.max(0, vitality(s, b) - b.dmg); return venom ? Math.min(1, left) : left; }; // (a Shield stops the hit)
  const order = [...bs].sort((x, y) => def(y).cost - def(x).cost || power(s, y) - power(s, x) || x.uid - y.uid);
  const got = new Map();
  let rest = pw;
  for (const b of order) {
    const need = lethal(b);
    if (need > 0 && need <= rest) { got.set(b, need); rest -= need; }
  }
  if (rest > 0) {
    const spare = order.find((b) => !got.has(b));
    if (spare) { got.set(spare, rest); rest = 0; }
    else if (!hasKw(s, a, 'overrun')) { got.set(order[0], got.get(order[0]) + rest); rest = 0; }
  }
  return { parts: order.filter((b) => got.has(b)).map((b) => [b, got.get(b)]), rest };
}

// Combat damage to a player. It takes the Crown if they hold it (or if nobody does yet).
function hitInFight(s, a, d, n, drain = null) {
  if (s.combat?.fog && n > 0) { log(s, d, `The fog swallows ${nameOf(a)}’s blow.`); return; } // (Fog Bank)
  if (n > 0 && s.ultra && champOn(s, a.ctrl, 'legend-kasimir', 3)) n += 1;
  ev(s, { k: 'strike', uid: a.uid, to: { p: d } });
  damagePlayer(s, d, n, a, drain);
  if (n > 0 && a.cid === 'pickpocket' && s.players[d].hand.length && !s.players[d].out) { // (version 5)
    const Q = s.players[d], u = Q.hand[Math.floor(rnd(s) * Q.hand.length)], x = s.cards[u];
    if (!def(x).champion) {
      removeFrom(Q.hand, u);
      log(s, a.ctrl, `The Pickpocket snatches ${nameOf(x)} from ${Q.name}'s hand.`);
      toDiscard(s, x, 'hand');
    }
  }
  if (n > 0 && s.ultra && !s.players[a.ctrl].out) { // (version 4: Kasimir counts hits; a War Chest pays for the first each turn)
    gainXP(s, a.ctrl, 'hit', 1);
    for (const u of s.players[a.ctrl].relics) {
      const r = s.cards[u];
      if (r.cid !== 'war-chest' || r.usedOn === s.turn) continue;
      r.usedOn = s.turn;
      log(s, a.ctrl, 'The War Chest pays out.');
      invest(s, a.ctrl);
    }
  }
  if (n > 0 && s.ultra && hasKw(s, a, 'soar') && !s.players[a.ctrl].out) {
    gainXP(s, a.ctrl, 'skyhit', 1);
    if (s.combat && !s.combat.skyDraw && champOn(s, a.ctrl, 'legend-aeris', 3)) {
      s.combat.skyDraw = true;
      log(s, a.ctrl, `${BY_ID['legend-aeris'].name}: ${s.players[a.ctrl].name} draws a card.`);
      draw(s, a.ctrl, 1);
    }
  }
  if (n > 0 && s.crownOn && s.phase !== 'over' && (s.crown == null || s.crown === d) && !s.players[a.ctrl].out) setCrown(s, a.ctrl);
}

// After every move in a fight: skip anyone who has nothing they could do.
function advance(s) {
  for (let guard = 0; guard < 12 && s.phase === 'combat'; guard++) {
    const C = s.combat;
    if (C.step === 'block') {
      if (blockersExist(s, C) || canRespond(s, C.d)) return;
      declareBlocks(s, C.d, forcedBlocks(s, C));
      continue;
    }
    if (C.passes >= 2) { fight(s); return; }
    if (canRespond(s, C.prio)) return;
    C.passes += 1;
    C.prio = otherSide(C);
  }
}

function blockersExist(s, C) {
  const att = C.att.map((u) => s.cards[u]);
  return s.players[C.d].board.some((u) => att.some((a) => canBlock(s, s.cards[u], a)));
}

// Hunt targets that can still block their hunter must do so.
export function forcedBlocks(s, C = s.combat) {
  const out = [];
  for (const [au, tu] of C.hunt) {
    const a = s.cards[au], t = s.cards[tu];
    if (!C.att.includes(au) || a.zone !== 'board' || !t || t.zone !== 'board' || t.ctrl !== C.d || !canBlock(s, t, a)) continue;
    if (out.some(([b, x]) => x === au)) continue;
    if (out.filter(([b]) => b === tu).length >= blockLimit(s, t)) continue;
    out.push([tu, au]);
  }
  return out;
}

// Does this player have anything to do in a fight: a Trick, or a creature's ability?
function canRespond(s, pi) {
  const P = s.players[pi];
  if (P.out) return false;
  return P.hand.some((u) => (isTrick(def(s.cards[u])) || (ultraV2(s) && def(s.cards[u]).type === 'creature')) && playOptions(s, pi, s.cards[u], 'hand', 1).length > 0)
    || P.board.some((u) => def(s.cards[u]).ability && useOptions(s, pi, s.cards[u], 1).length > 0);
}

// ── abilities ───────────────────────────────────────────────────────
// "Pay N Energy: …" on a creature. Each works once each turn, whenever you
// could play a Trick: on your own turn, or during a fight you are in.
export function abilityNeeds(s, pi, c) {
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const others = s.players[pi].board.filter((u) => u !== c.uid);
  switch (c.cid) {
    case 'canopy-archer': return { target: T(aimable(s, pi, s.players.flatMap((Q) => Q.board)).filter((u) => hasKw(s, s.cards[u], 'soar'))) };
    case 'hungry-ghoul': case 'dawnwatch-knight': return { target: T(others) };
    case 'ember-duelist': return { target: T(aimable(s, pi, s.players.flatMap((Q) => Q.board))) };
    case 'the-puppeteer': { const e = aimable(s, pi, opponents(s, pi).flatMap((Q) => Q.board)); return { fighter: e, target: T(e) }; } // (Ultra, version 4)
    case 'blight-beetle': return { target: T(aimable(s, pi, opponents(s, pi).flatMap((Q) => Q.board)).filter((u) => s.cards[u].pP > 0 || s.cards[u].pV > 0)) }; // (version 5)
    default:
      if (!isSymbiote(c)) return {};
      if (ultraV2(s)) return symbioteNeeds(s, pi, c, others);
      return { target: T(others) };
  }
}

// Ultra (version 2): a Symbiote kills a creature it can kill in one hit (`prey`:
// Vitality left no more than its Power, no Shield; an opponent's as an ability
// may aim), then fuses into another creature of yours (`target`; not a Legend).
function symbioteNeeds(s, pi, c, others) {
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const pw = power(s, c);
  const prey = aimable(s, pi, s.players.flatMap((Q) => Q.board)).filter((u) => {
    const x = s.cards[u];
    return u !== c.uid && !(x.shield > 0) && pw > 0 && vitality(s, x) - (x.dmg || 0) <= pw;
  });
  return { prey, target: T(ULTRA_V2.fuseLegend ? others : others.filter((u) => !isLegend(s.cards[u]))) };
}

// Every legal way to use a creature's ability or a Relic, up to `limit` (whose move it is aside).
export function useOptions(s, pi, c, limit = Infinity) {
  const out = [];
  if (!c) return out;
  const base = { t: 'use', p: pi, uid: c.uid };
  const push = (a) => { if (out.length < limit && !checkUse(s, a)) out.push(a); };
  if (c.zone === 'relic') {
    if (c.cid === 'bone-altar') for (const sac of s.players[pi].board) push({ ...base, sac });
    if (def(c).stages) {
      const n = stageNeeds(s, pi, c);
      if (n.target) { for (const target of n.target) push({ ...base, target }); if (n.optional || !n.target.length) push(base); }
      else if (n.pick) { for (const pick of n.pick) push({ ...base, pick }); push(base); }
      else if (n.picks) push({ ...base, picks: [...n.picks].sort((x, y) => def(s.cards[y]).cost - def(s.cards[x]).cost).slice(0, n.max) });
      else push(base);
    }
    return out;
  }
  if (!def(c).ability || c.zone !== 'board') return out;
  const n = abilityNeeds(s, pi, c);
  if (n.prey) { for (const prey of n.prey) for (const target of n.target) if (target.uid !== prey) push({ ...base, prey, target }); }
  else if (n.fighter) { for (const fighter of n.fighter) for (const target of n.target) if (target.uid !== fighter) push({ ...base, fighter, target }); }
  else if (n.target) for (const target of n.target) push({ ...base, target });
  else push(base);
  return out;
}

// ── what a card needs from the player ───────────────────────────────
// Returns the choices a card asks for when played, with legal options.
// UI and bot both use this, and check() validates against it.
// Keys: target (one of a list; `optional` if it may be skipped), sac (your
// creature to sacrifice), fighter (your creature that fights), pick / picks
// (cards in a discard pile), targets (several of your creatures), keep /
// bottom / discard (looking at your own cards).
export function needs(s, pi, c, from = 'hand') {
  if (def(c).stages) return stageNeeds(s, pi, c, 0);
  const P = s.players[pi];
  const all = aimable(s, pi, s.players.flatMap((Q) => Q.board));
  const own = [...P.board];
  const enemy = aimable(s, pi, opponents(s, pi).flatMap((Q) => Q.board));
  const relics = s.players.flatMap((Q) => Q.relics).filter((u) => !def(s.cards[u]).stages); // (a Ritual is not a Relic to aim at)
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const anyTarget = [...living(s).map((Q) => ({ p: Q.i })), ...T(all)];
  const discardOf = (pred) => P.discard.filter((u) => pred(def(s.cards[u])));
  const creature = def(c).type === 'creature';
  // A creature's "when played" choice is skipped when there's nothing to choose.
  const pickOne = (uids, optional = false) => ({ target: T(uids), optional: optional || (creature && !uids.length) });
  switch (c.cid) {
    case 'feed-the-flame':
    case 'funeral-pyre':
      return { sac: own, target: anyTarget };
    case 'the-mountain-is-angry':
      return { target: opponents(s, pi).map((Q) => ({ p: Q.i })) };
    case 'wild-growth': case 'kindle': case 'sudden-growth': case 'kiss-of-night': case 'bastion': case 'wild-bloom':
      return pickOne(own);
    case 'crescendo':
      return { target: anyTarget };
    case 'worldtree-stag':
      return pickOne(own, true);
    case 'not-yet':
      return pickOne([...all, ...relics].filter((u) => def(s.cards[u]).cost <= 3));
    case 'deepwater-leviathan': case 'tidal-mimic':
      return pickOne(all, true);
    case 'death-is-a-door':
      return pickOne([...all, ...relics]);
    case 'apex-predator': case 'scorch': case 'sea-change':
      return pickOne(all);
    case 'mutiny': case 'sky-warden':
      return pickOne(enemy);
    case 'nerissa':
      return pickOne(enemy.filter((u) => def(s.cards[u]).cost <= 4), true);
    case 'savage-clash':
      return { fighter: own, target: T(enemy) };
    case 'grove-druid':
      return pickOne(relics, true);
    case 'dawns-judgment':
      return pickOne(s.combat ? s.combat.att.filter((u) => s.cards[u].zone === 'board') : []);
    case 'unearth':
      return { pick: discardOf((d) => d.type === 'creature' && d.cost <= 2) };
    case 'borrowed-time':
      return { pick: discardOf((d) => d.type === 'creature') };
    case 'the-barrow-queen':
      return { pick: living(s).flatMap((Q) => Q.discard.filter((u) => def(s.cards[u]).type === 'creature')), optional: true };
    case 'perfect-recall':
      return { picks: discardOf((d) => d.type === 'spell'), max: 3 };
    case 'we-grow-together':
      return { targets: own, count: Math.min(own.length, own.length >= 4 ? 3 : 2) };
    case 'memory-diver':
      return { keep: P.deck.slice(0, 3) };
    case 'curious-wisp':
      return { bottom: P.deck.slice(0, 1) };
    case 'second-thought':
      return { discard: [...P.hand.filter((u) => u !== c.uid), ...P.deck.slice(0, 2)] };
    // SATTC Ultra
    case 'ember-volley':
      return { targets: enemy, count: Math.min(3, enemy.length) };
    case 'shackles':
      return pickOne(enemy);
    case 'menders-hymn': case 'ward-of-dawn': case 'aegis-acolyte':
      return pickOne(own);
    // (version 4) `offer`: a creature of yours you may sacrifice for the stronger effect
    case 'grave-harvest':
      return { offer: own };
    case 'bone-lance':
      return { offer: own, target: anyTarget };
    case 'bone-tithe':
      return { sac: own };
    case 'danse-macabre':
      return { picks: discardOf((d) => d.type === 'creature'), max: 4 };
    case 'turnabout':
      return pickOne(all);
    case 'static-spark':
      return { target: anyTarget };
    case 'the-last-storm':
      return { target: opponents(s, pi).map((Q) => ({ p: Q.i })) };
    case 'weatherwitch':
      return { pick: discardOf((d) => d.type === 'field'), optional: true };
    // (version 5)
    case 'whispered-doubt':
      return { pick: opponents(s, pi).flatMap((Q) => Q.hand.filter((u) => !def(s.cards[u]).token && !def(s.cards[u]).champion && def(s.cards[u]).cost >= 4)), optional: true };
    default:
      return {};
  }
}

// A Ritual's stage `k` (0 = the one it starts with; on the table, the next one).
export function stageNeeds(s, pi, c, k = c.zone === 'relic' ? c.stage : 0) {
  const P = s.players[pi];
  const T = (uids) => uids.map((u) => ({ uid: u }));
  const dead = P.discard.filter((u) => def(s.cards[u]).type === 'creature');
  switch (`${c.cid}:${k}`) {
    case 'flood-rite:1': return { target: T(aimable(s, pi, s.players.flatMap((Q) => Q.board))), optional: true };
    case 'grave-rite:0': return { pick: dead, optional: true };
    case 'grave-rite:2': return { picks: dead, max: 2 };
    default: return {};
  }
}

const sameTarget = (a, b) => a && b && (a.p != null ? a.p === b.p : a.uid === b.uid);

export function phoenixReady(s, pi) {
  const P = s.players[pi];
  return P.discard.filter((u) => s.cards[u].cid === 'phoenix-of-the-last-spark' && s.cards[u].phoenixTurn === P.turns);
}

// Could this card be played right now (ignoring whose move it is)?
const fromOf = (a) => (a.from === 'discard' || a.from === 'legend' ? a.from : 'hand');
function checkPlay(s, a) {
  const P = s.players[a.p];
  const c = s.cards[a.uid];
  const from = fromOf(a);
  const here = from === 'legend' ? ultraV2(s) && P.legend === a.uid && c?.zone === 'legend' : (from === 'hand' ? P.hand : P.discard).includes(a.uid);
  if (!c || !here) return 'That card is not available.';
  const d = def(c);
  if (from === 'discard' && !d.echo) return 'Only Echo cards can be played from the discard pile.';
  if (a.fuse != null) return checkFuse(s, a, P, c, d);
  if (s.phase === 'combat' && !isTrick(d) && !d.keywords.includes('ambush')) return 'During a fight you can only play Tricks.';
  if (price(s, a.p, c, from).cost > P.energy) return 'Not enough Energy.';
  if (d.type === 'field' && s.ultra && fieldIs(s, 'the-eye-of-the-storm') && s.cards[s.field].ctrl !== a.p) return 'The Eye of the Storm holds: no other Field can come in while it’s here.';
  if (d.type === 'creature' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  if (d.type === 'relic' && P.relics.filter((u) => !def(s.cards[u]).stages).length >= RULES.relicMax) return `You already have ${RULES.relicMax} Relics.`;
  if (d.stages && ritualOf(s, P) != null) return 'You already have a Ritual going.';
  if (c.cid === 'mutiny' && P.board.length >= RULES.boardMax) return 'You have no room for another creature.';
  const n = needs(s, a.p, c, from);
  if (n.offer && a.offer != null) {
    if (!n.offer.includes(a.offer)) return 'Offer one of your own creatures.';
    if (a.target?.uid === a.offer) return 'Choose a target other than your Offering.';
  }
  if (n.sac || n.fighter) {
    const mine = n.sac || n.fighter, chosen = n.sac ? a.sac : a.fighter;
    if (!mine.includes(chosen)) return n.sac ? 'Choose one of your creatures to sacrifice.' : 'Choose one of your creatures to fight.';
    if (n.target && (!n.target.some((t) => sameTarget(t, a.target)) || sameTarget(a.target, { uid: chosen }))) return 'Choose a target.';
  } else if (n.target) {
    if (a.target == null) { if (!n.optional) return n.target.length ? 'Choose a target.' : 'There is nothing to target.'; }
    else if (!n.target.some((t) => sameTarget(t, a.target))) return 'That is not a legal target.';
  }
  if (n.pick) {
    if (a.pick == null) { if (!n.optional) return n.pick.length ? 'Choose a card from a discard pile.' : 'There is nothing to return.'; }
    else if (!n.pick.includes(a.pick)) return 'Choose a card from a discard pile.';
    if (c.cid === 'borrowed-time' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  }
  if (n.picks) {
    const ps = a.picks || [];
    if (ps.length > n.max || new Set(ps).size !== ps.length || ps.some((u) => !n.picks.includes(u))) return c.cid === 'perfect-recall' ? 'Choose up to three Spells.' : `Choose up to ${n.max} creatures.`;
  }
  if (n.targets) {
    const ts = a.targets || [];
    if (n.count && ts.length < 1) return 'Choose your creatures.';
    if (ts.length > n.count || new Set(ts).size !== ts.length || ts.some((u) => !n.targets.includes(u))) return 'Choose different creatures you control.';
  }
  if (n.keep && n.keep.length && !n.keep.includes(a.keep)) return 'Choose the card to keep.';
  if (n.discard && !n.discard.includes(a.discard)) return 'Choose a card to discard.';
  return null;
}

function checkAttack(s, a) {
  const P = s.players[a.p];
  if (P.attackedOn === s.turn) return 'You already attacked this turn.';
  const Q = s.players[a.target];
  if (!Q || Q.out || a.target === a.p) return 'Choose an opponent to attack.';
  const att = a.att || [];
  if (!att.length) return 'Choose at least one creature to attack with.';
  if (new Set(att).size !== att.length) return 'Each creature attacks once.';
  if (s.ultra && fieldIs(s, 'rolling-fog') && att.length > 2) return 'In the Rolling Fog, no more than two creatures can attack in one fight.';
  for (const u of att) if (!canAttack(s, a.p, s.cards[u])) return `${s.cards[u] ? nameOf(s.cards[u]) : 'That'} can't attack now.`;
  const hunted = new Set();
  for (const h of a.hunt || []) {
    const [au, tu] = h || [];
    const ac = s.cards[au], tc = s.cards[tu];
    if (!att.includes(au) || !hasKw(s, ac, 'hunt')) return 'Only an attacker with Hunt can choose its prey.';
    if (hunted.has(au)) return 'Each hunter chooses one creature.';
    hunted.add(au);
    if (!tc || tc.zone !== 'board' || tc.ctrl !== a.target || !canBlock(s, tc, ac)) return 'Hunt a creature that could block it.';
    if (s.ultra && tc.shelter) return `${nameOf(tc)} is Sheltered: it can't be hunted yet.`;
  }
  return null;
}

function checkBlock(s, a) {
  const C = s.combat;
  if (C.step !== 'block') return 'Blockers are already chosen.';
  const blocks = a.blocks || [];
  const seen = new Set(), count = {};
  for (const pair of blocks) {
    const [b, at] = pair || [];
    const bc = s.cards[b], ac = s.cards[at];
    if (!C.att.includes(at) || !ac || ac.zone !== 'board') return 'That creature is not attacking.';
    if (seen.has(`${b}>${at}`)) return 'That creature is already blocking it.';
    seen.add(`${b}>${at}`);
    if (!bc || bc.zone !== 'board' || bc.ctrl !== a.p) return 'Block with your own creatures.';
    if (!canBlock(s, bc, ac)) return `${nameOf(bc)} can't block ${nameOf(ac)}.`;
    count[b] = (count[b] || 0) + 1;
    if (count[b] > blockLimit(s, bc)) return `${nameOf(bc)} can only block one attacker.`;
  }
  for (const [tu, au] of forcedBlocks(s, C)) {
    if (!blocks.some(([b, x]) => b === tu && x === au)) return `${nameOf(s.cards[tu])} must block ${nameOf(s.cards[au])} (Hunt).`;
  }
  return null;
}

function checkUse(s, a) {
  const P = s.players[a.p];
  const c = s.cards[a.uid];
  if (c?.zone === 'relic') {
    if (!P.relics.includes(a.uid)) return 'That Relic is not yours.';
    if (def(c).stages) {
      const st = def(c).stages[c.stage];
      if (!st) return 'That Ritual is complete.';
      if (a.p !== s.active || s.phase !== 'main') return 'A Ritual moves on only on your turn.';
      if (c.stageOn === s.turn) return 'One stage a turn: the next one comes on a later turn.';
      if (st.cost > P.energy) return 'Not enough Energy.';
      const n = stageNeeds(s, a.p, c);
      if (n.target && a.target != null && !n.target.some((t) => sameTarget(t, a.target))) return 'That is not a legal target.';
      if (n.target && a.target == null && !n.optional) return 'Choose a target.';
      if (n.pick && a.pick != null && !n.pick.includes(a.pick)) return 'Choose a creature from your discard pile.';
      if (n.picks) { const ps = a.picks || []; if (ps.length > n.max || new Set(ps).size !== ps.length || ps.some((u) => !n.picks.includes(u))) return `Choose up to ${n.max} creatures.`; }
      return null;
    }
    if (c.cid !== 'bone-altar') return 'That Relic works by itself.';
    if (a.p !== s.active) return 'Only on your turn.';
    if (c.usedOn === s.turn) return 'Already used this turn.';
    if (!P.board.includes(a.sac)) return 'Choose one of your creatures to sacrifice.';
    return null;
  }
  if (!c || c.zone !== 'board' || c.ctrl !== a.p) return 'Use your own creatures.';
  const ab = def(c).ability;
  if (!ab) return `${nameOf(c)} has no ability to use.`;
  if (c.usedOn === s.turn) return 'Already used this turn.';
  if (ab.cost > P.energy) return 'Not enough Energy.';
  if (c.cid === 'choirmother' && P.board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  const n = abilityNeeds(s, a.p, c);
  if (n.prey) {
    if (c.played === s.turn) return 'A Symbiote can’t fuse the turn it arrives.';
    if (!n.prey.includes(a.prey)) return n.prey.length ? 'Choose a creature it can kill in one hit.' : 'There is nothing weak enough for it to kill.';
    if (!n.target.some((t) => sameTarget(t, a.target)) || a.target?.uid === a.prey) return n.target.length ? 'Choose another creature of yours for it to join.' : 'You have no creature for it to join.';
    return null;
  }
  if (n.fighter) { // (The Puppeteer)
    if (n.fighter.length < 2) return 'It needs two enemy creatures it can aim at.';
    if (!n.fighter.includes(a.fighter)) return 'Choose an enemy creature to fight.';
    if (!n.target.some((t) => sameTarget(t, a.target)) || a.target?.uid === a.fighter) return 'Choose another enemy creature for it to fight.';
    return null;
  }
  if (n.target && !n.target.some((t) => sameTarget(t, a.target))) return n.target.length ? 'Choose a target.' : 'There is nothing to target.';
  return null;
}

// Is this action legal right now? Returns null, or a reason it isn't.
export function check(s, a) {
  if (!a || !a.t) return 'Unknown action.';
  if (a.t === 'fix') return null;
  const P = s.players[a.p];
  if (!P) return 'Unknown player.';
  if (a.t === 'concede') return P.out || s.phase === 'over' ? 'Already out.' : null;
  if (s.phase === 'over') return 'The game is over.';
  if (a.t === 'mulligan') return s.phase !== 'mulligan' ? 'Not now.' : P.mull ? 'Already decided.' : null;
  if (s.phase === 'mulligan') return 'Decide on your opening hand first.';
  if (P.out) return 'You are out of the game.';
  if (actor(s) !== a.p) return s.phase === 'combat' ? 'Wait: someone else is deciding.' : 'It is not your turn.';

  if (s.phase === 'combat') {
    switch (a.t) {
      case 'play': return checkPlay(s, a);
      case 'block': return checkBlock(s, a);
      case 'pass': return s.combat.step === 'tricks' ? null : 'Choose your blockers first.';
      case 'use': return checkUse(s, a);
      default: return 'Finish the fight first.';
    }
  }
  switch (a.t) {
    case 'end': return null;
    case 'play': return checkPlay(s, a);
    case 'attack': return checkAttack(s, a);
    case 'use': return checkUse(s, a);
    case 'unhex': {
      const c = s.cards[a.uid];
      if (!c || c.zone !== 'board' || c.ctrl !== a.p || !c.hex) return 'There is no Hex on it.';
      return c.hex > P.energy ? `Breaking the Hex takes ${c.hex} Energy.` : null;
    }
    case 'dig':
      if (!ultraV2(s) || !ULTRA_V2.dig) return 'Digging is a SATTC Ultra rule.';
      if (P.dugOn === s.turn) return 'You already dug this turn.';
      if (!P.deck.length) return 'Your deck is empty.';
      return P.energy < ULTRA_V2.digCost ? `Digging takes ${ULTRA_V2.digCost} Energy.` : null;
    case 'phoenix':
      if (!phoenixReady(s, a.p).includes(a.uid)) return 'The Phoenix cannot return now.';
      if (P.energy < 2) return 'Not enough Energy.';
      if (P.hand.length >= handMax(s, P)) return 'Your hand is full.';
      return null;
    case 'block': case 'pass': return 'Nobody is attacking.';
  }
  return 'Unknown action.';
}

// ── doing things ────────────────────────────────────────────────────
function resolveSpell(s, pi, c, a) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  const t = tc(a.target);
  switch (c.cid) {
    case 'spark':
      P.energy += 1;
      break;
    case 'feed-the-flame': {
      const sac = s.cards[a.sac], hadLB = def(sac).keywords.includes('lastBreath');
      sacrifice(s, sac);
      hit(s, a.target, hadLB ? 4 : 3);
      break;
    }
    case 'funeral-pyre': {
      const sac = s.cards[a.sac], pw = power(s, sac), as = sac.cid, ctrl = sac.ctrl;
      sacrifice(s, sac);
      hit(s, a.target, pw);
      if (BY_ID[as].keywords.includes('lastBreath')) { log(s, pi, `${BY_ID[as].name}’s Last Breath happens again.`); lastBreath(s, sac, as, ctrl); }
      break;
    }
    case 'wildfire':
      log(s, pi, 'Wildfire deals 2 damage to every creature.');
      for (const Q of s.players) for (const u of [...Q.board]) damage(s, s.cards[u], 2);
      break;
    case 'the-mountain-is-angry':
      hit(s, a.target, 7);
      break;
    case 'crescendo':
      log(s, pi, `Crescendo: ${P.spells} Spell${P.spells === 1 ? '' : 's'} this turn.`);
      hit(s, a.target, P.spells);
      break;
    case 'ripple':
      draw(s, pi, 1);
      P.ripple = (P.ripple || 0) + 1;
      break;
    case 'wild-bloom':
      if (t?.zone === 'board') buff(s, t, Math.max(0, power(s, t)), Math.max(0, vitality(s, t)), false);
      break;
    case 'wild-growth':
      buff(s, t, 2, 2, true);
      break;
    case 'ancient-roots':
      invest(s, pi);
      break;
    case 'not-yet':
      bounce(s, t);
      break;
    case 'second-thought': {
      draw(s, pi, 2);
      const u = P.hand.includes(a.discard) ? a.discard : P.hand[P.hand.length - 1];
      if (u != null) { removeFrom(P.hand, u); log(s, pi, `${P.name} discards ${nameOf(s.cards[u])}.`); toDiscard(s, s.cards[u], 'hand'); }
      break;
    }
    case 'perfect-recall':
      for (const u of a.picks || []) if (removeFrom(P.discard, u)) toHand(s, s.cards[u], 'discard');
      break;
    case 'unearth':
      if (removeFrom(P.discard, a.pick)) { log(s, pi, `${nameOf(s.cards[a.pick])} returns to ${P.name}'s hand.`); toHand(s, s.cards[a.pick], 'discard'); }
      break;
    case 'borrowed-time': {
      const b = s.cards[a.pick];
      if (removeFrom(P.discard, a.pick)) {
        enterPlay(s, b, pi);
        b.rush = true;
        b.sacEnd = true;
        log(s, pi, `${nameOf(b)} returns to play until the end of the turn.`);
      }
      break;
    }
    case 'death-is-a-door':
      if (t?.zone === 'board') { log(s, pi, `${nameOf(t)} is destroyed.`); killBatch(s, [t]); }
      else if (t?.zone === 'relic') destroyRelic(s, t);
      break;
    case 'twin-souls':
      makeTokens(s, pi, 'spirit', 2);
      break;
    case 'rally':
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 0, false);
      break;
    case 'stand-together':
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 1, false);
      if (P.board.length >= 4) draw(s, pi, 1);
      break;
    case 'a-thousand-lights':
      makeTokens(s, pi, 'spirit', 5);
      for (const u of [...P.board]) buff(s, s.cards[u], 1, 1, true);
      break;
    case 'we-grow-together':
      for (const u of a.targets || []) buff(s, s.cards[u], 1, 2, true);
      break;
    // ── the second half ──
    case 'scorch':
      hit(s, a.target, 2);
      break;
    case 'kindle':
      buff(s, t, 2, 0, false);
      giveKw(t, 'swift');
      break;
    case 'mutiny':
      if (takeControl(s, t, pi, true)) {
        t.ex = false;
        t.rush = true;
        log(s, pi, `${P.name} takes ${nameOf(t)} until the end of the turn.`);
      }
      break;
    case 'sudden-growth':
      buff(s, t, 3, 3, false);
      break;
    case 'savage-clash': {
      const f = s.cards[a.fighter];
      if (f?.zone === 'board' && t?.zone === 'board') {
        log(s, pi, `${nameOf(f)} fights ${nameOf(t)}.`);
        ev(s, { k: 'clash', uid: f.uid, to: t.uid });
        const pf = power(s, f), pt = power(s, t);
        damage(s, t, pf, f);
        damage(s, f, pt, t);
      }
      break;
    }
    case 'stampede':
      for (const u of [...P.board]) { buff(s, s.cards[u], 2, 2, false); giveKw(s.cards[u], 'overrun'); }
      break;
    case 'sea-change':
      if (t?.zone === 'board') {
        log(s, pi, `${nameOf(t)} becomes a Fish.`);
        t.baseCid = t.baseCid || t.cid;
        t.cid = 'fish';
        Object.assign(t, { pP: 0, pV: 0, tP: 0, tV: 0, awake: true });
        delete t.tKw;
        ev(s, { k: 'transform', uid: t.uid });
      }
      break;
    case 'one-more-wave':
      P.extra += 1;
      log(s, pi, `${P.name} will take an extra turn.`);
      break;
    case 'kiss-of-night':
      giveKw(t, 'venom', 'drain');
      if (t) ev(s, { k: 'buff', uid: t.uid, dP: 0, dV: 0 });
      break;
    case 'the-culling': {
      const doomed = s.players.flatMap((Q) => Q.board.map((u) => s.cards[u])).filter((x) => power(s, x) <= 2);
      log(s, pi, 'The Culling: every creature with 2 or less Power is destroyed.');
      killBatch(s, doomed);
      break;
    }
    case 'bastion':
      buff(s, t, 1, 3, false);
      break;
    case 'dawns-judgment':
      if (t?.zone === 'board') { log(s, pi, `Dawn’s Judgment destroys ${nameOf(t)}.`); killBatch(s, [t]); }
      break;
    // ── SATTC Ultra ──
    case 'stoke-the-furnace':
      invest(s, pi);
      for (const o of opponents(s, pi)) damagePlayer(s, o.i, 1);
      break;
    case 'ember-volley':
      for (const u of a.targets || []) { const x = s.cards[u]; if (x?.zone === 'board') { log(s, null, `${nameOf(x)} takes 1 damage.`); damage(s, x, 1); } }
      break;
    case 'deep-roots': {
      invest(s, pi);
      const small = P.board.map((u) => s.cards[u]).reduce((m, x) => (!m || power(s, x) < power(s, m) ? x : m), null);
      if (small) buff(s, small, 1, 1, true);
      break;
    }
    case 'tide-of-fortune':
      invest(s, pi);
      draw(s, pi, 2);
      break;
    case 'blood-pact':
      invest(s, pi);
      loseLife(s, pi, 3, pi);
      break;
    case 'tithe-of-light':
      invest(s, pi);
      gainLife(s, pi, 3);
      break;
    case 'shackles':
      if (t?.zone === 'board') {
        t.hex = def(c).hex;
        log(s, pi, `${nameOf(t)} is shackled: it can't attack or block until ${s.players[t.ctrl].name} pays ${t.hex} Energy.`);
        ev(s, { k: 'freeze', uid: t.uid });
      }
      break;
    case 'menders-hymn':
      if (t?.zone === 'board') { heal(s, t, Infinity, true); buff(s, t, 0, 2, false); }
      break;
    case 'ward-of-dawn':
      giveShield(s, t);
      break;
    case 'flood-rite': case 'grave-rite':
      resolveStage(s, pi, c, 0, a);
      break;
    // ── SATTC Ultra, version 4 ──
    case 'compound-interest':
      draw(s, pi, Math.floor(P.maxEnergy / 3));
      break;
    case 'grave-harvest':
      offering(s, pi, a, () => draw(s, pi, 3), () => draw(s, pi, 1));
      break;
    case 'bone-lance':
      offering(s, pi, a, () => hit(s, a.target, 5), () => hit(s, a.target, 2));
      break;
    case 'bone-tithe':
      sacrifice(s, s.cards[a.sac]);
      invest(s, pi);
      draw(s, pi, 1);
      break;
    case 'danse-macabre':
      for (const u of (a.picks || []).slice(0, 4)) {
        if (P.board.length >= RULES.boardMax || !removeFrom(P.discard, u)) continue;
        const b = s.cards[u];
        enterPlay(s, b, pi);
        Object.assign(b, { rush: true, sacEnd: 'danse' });
        log(s, pi, `${nameOf(b)} rises to dance until the end of the turn.`);
        ev(s, { k: 'token', uid: b.uid, p: pi });
      }
      break;
    case 'turnabout':
      if (t?.zone === 'board') {
        const p = power(s, t), v = vitality(s, t);
        t.tP += v - p;
        t.tV += p - v;
        log(s, pi, `${nameOf(t)} turns about: ${v}/${p} this turn.`);
        ev(s, { k: 'buff', uid: t.uid, dP: v - p, dV: p - v });
      }
      draw(s, pi, 1);
      break;
    case 'grand-illusion': {
      const mine = P.board.length;
      log(s, pi, 'Grand Illusion: every creature returns to its owner’s hand.');
      for (const Q of s.players) for (const u of [...Q.board]) bounce(s, s.cards[u]);
      draw(s, pi, mine);
      break;
    }
    case 'static-spark':
      hit(s, a.target, 1);
      break;
    case 'the-last-storm': {
      const n = P.discard.filter((u) => def(s.cards[u]).type === 'spell').length;
      log(s, pi, `The Last Storm: ${n} Spell${n === 1 ? '' : 's'} in ${P.name}'s discard pile.`);
      if (a.target?.p != null) damagePlayer(s, a.target.p, n);
      break;
    }
    case 'hour-of-glory':
      for (const u of [...P.board]) { buff(s, s.cards[u], 3, 0, false); giveKw(s.cards[u], 'rush'); }
      break;
    // ── SATTC Ultra, version 5 ──
    case 'choking-smoke':
      for (const o of opponents(s, pi)) o.smoke = (o.smoke || 0) + 2;
      log(s, pi, 'Choking Smoke: each opponent will have 2 less Energy on their next turn.');
      break;
    case 'whispered-doubt': {
      const x = a.pick != null ? s.cards[a.pick] : null, Q = x && s.players[x.owner];
      if (x && Q && Q.i !== pi && removeFrom(Q.hand, x.uid)) {
        x.zone = 'deck';
        Q.deck.push(x.uid);
        log(s, pi, `${nameOf(x)} goes to the bottom of ${Q.name}'s deck.`);
        draw(s, Q.i, 1);
      }
      draw(s, pi, 1);
      break;
    }
  }
}

// A Ritual's stages (Ultra). Stage I comes with playing the card; the rest are
// paid for later, one a turn.
function resolveStage(s, pi, c, k, a) {
  const P = s.players[pi];
  const t = a.target?.uid != null ? s.cards[a.target.uid] : null;
  log(s, pi, `${nameOf(c)}, stage ${['I', 'II', 'III'][k]}: ${def(c).stages[k].text}`);
  switch (`${c.cid}:${k}`) {
    case 'flood-rite:0': draw(s, pi, 2); break;
    case 'flood-rite:1': if (t) bounce(s, t); break;
    case 'flood-rite:2': P.extra += 1; break;
    case 'grave-rite:0':
      if (a.pick != null && removeFrom(P.discard, a.pick)) { log(s, pi, `${nameOf(s.cards[a.pick])} returns to ${P.name}'s hand.`); toHand(s, s.cards[a.pick], 'discard'); }
      break;
    case 'grave-rite:1':
      for (const o of opponents(s, pi)) loseLife(s, o.i, 2, pi);
      gainLife(s, pi, 2);
      break;
    case 'grave-rite:2':
      for (const u of (a.picks || []).slice(0, 2)) {
        if (P.board.length >= RULES.boardMax || !removeFrom(P.discard, u)) continue;
        const b = s.cards[u];
        enterPlay(s, b, pi);
        log(s, pi, `${nameOf(b)} rises from ${P.name}'s discard pile.`);
        ev(s, { k: 'token', uid: b.uid, p: pi });
      }
      break;
  }
}

function advanceRitual(s, pi, c, a) {
  const P = s.players[pi], stages = def(c).stages, k = c.stage;
  P.energy -= stages[k].cost;
  c.stage += 1;
  c.stageOn = s.turn;
  ev(s, { k: 'use', uid: c.uid, p: pi, cid: c.cid, target: a.target || null });
  resolveStage(s, pi, c, k, a);
  if (c.stage >= stages.length && c.zone === 'relic') {
    removeFrom(P.relics, c.uid);
    log(s, pi, `${nameOf(c)} is complete.`);
    resetPlay(c);
    toDiscard(s, c, 'relic');
  }
  settle(s);
}

// Ultra (version 2): once a turn, on your turn, pay 3 Energy to draw a card.
function dig(s, pi) {
  const P = s.players[pi];
  P.energy -= ULTRA_V2.digCost;
  P.dugOn = s.turn;
  log(s, pi, `${P.name} pays ${ULTRA_V2.digCost} Energy and digs for a card.`);
  ev(s, { k: 'dig', p: pi });
  draw(s, pi, 1);
  settle(s);
}

function unhex(s, pi, a) {
  const P = s.players[pi], c = s.cards[a.uid];
  P.energy -= c.hex;
  log(s, pi, `${P.name} pays ${c.hex} Energy and breaks the Hex on ${nameOf(c)}.`);
  delete c.hex;
  ev(s, { k: 'buff', uid: c.uid, dP: 0, dV: 0 });
}

function creatureEnters(s, pi, c, a, from) {
  const P = s.players[pi];
  const tc = (t) => (t && t.uid != null ? s.cards[t.uid] : null);
  const t = tc(a.target);
  switch (c.cid) {
    case 'curious-wisp':
      if (a.bottom && P.deck.length) { P.deck.push(P.deck.shift()); log(s, pi, `${P.name} puts the top card of their deck on the bottom.`); }
      break;
    case 'memory-diver': {
      const top = P.deck.splice(0, 3);
      const keep = top.includes(a.keep) ? a.keep : top[0];
      for (const u of top) {
        if (u === keep) { s.cards[u].zone = 'deck'; toHand(s, s.cards[u], 'deck'); }
        else { log(s, pi, `${nameOf(s.cards[u])} goes to ${P.name}'s discard pile.`); toDiscard(s, s.cards[u], 'deck'); }
      }
      break;
    }
    case 'worldtree-stag':
      if (t) buff(s, t, 2, 2, true);
      break;
    case 'aegis-acolyte':
      giveShield(s, t);
      break;
    case 'blitz-captain':
      for (const u of P.board) if (u !== c.uid) { buff(s, s.cards[u], 1, 0, false); giveKw(s.cards[u], 'rush'); }
      break;
    case 'grave-robber': // (version 5)
      for (const o of opponents(s, pi)) {
        const top = o.discard.map((u) => s.cards[u]).filter((x) => def(x).type === 'creature').sort((x, y) => def(y).cost - def(x).cost || x.uid - y.uid).slice(0, 3);
        for (const x of top) { removeFrom(o.discard, x.uid); x.zone = 'deck'; o.deck.push(x.uid); }
        if (top.length) log(s, pi, `The Grave Robber carries off ${listNames(top.map(nameOf))}: to the bottom of ${o.name}'s deck.`);
      }
      break;
    case 'weatherwitch':
      if (a.pick != null && removeFrom(P.discard, a.pick)) { log(s, pi, `${nameOf(s.cards[a.pick])} returns to ${P.name}'s hand.`); toHand(s, s.cards[a.pick], 'discard'); }
      break;
    case 'deepwater-leviathan':
      if (t) bounce(s, t);
      break;
    case 'dawn-captain':
      makeTokens(s, pi, 'spirit', 2);
      break;
    case 'apex-predator':
      if (t && t.zone === 'board') {
        log(s, pi, `Apex Predator fights ${nameOf(t)}.`);
        ev(s, { k: 'clash', uid: c.uid, to: t.uid });
        const pa = power(s, c), pt = power(s, t);
        damage(s, t, pa, c);
        damage(s, c, pt, t);
        settle(s);
        if (c.zone === 'board') buff(s, c, 2, 2, true);
      }
      break;
    case 'the-one-who-came-back':
      if (from === 'discard') {
        log(s, pi, 'The One Who Came Back: each opponent loses 3 Life.');
        for (const o of opponents(s, pi)) loseLife(s, o.i, 3);
      }
      break;
    // ── the second half ──
    case 'grove-druid':
      if (t?.zone === 'relic') destroyRelic(s, t);
      else if (s.ultra) invest(s, pi);
      else { P.maxEnergy = Math.min(RULES.maxEnergy, P.maxEnergy + 1); log(s, pi, `${P.name}'s maximum Energy grows to ${P.maxEnergy}.`); }
      break;
    case 'windborne-sage':
      draw(s, pi, 1);
      break;
    case 'tidal-mimic':
      if (t && t.zone === 'board' && t.uid !== c.uid) {
        log(s, pi, `Tidal Mimic becomes a copy of ${nameOf(t)}.`);
        c.baseCid = 'tidal-mimic';
        c.cid = t.cid;
        ev(s, { k: 'transform', uid: c.uid });
      }
      break;
    case 'nerissa':
      if (t && takeControl(s, t, pi, false)) {
        t.played = s.turn;
        log(s, pi, `Nerissa sings: ${nameOf(t)} joins ${P.name} for good.`);
      }
      break;
    case 'the-barrow-queen': {
      const b = s.cards[a.pick];
      if (!b || b.zone !== 'discard') break;
      if (P.board.length >= RULES.boardMax) { log(s, pi, `${P.name} has no room for another creature.`); break; }
      removeFrom(s.players[b.owner].discard, b.uid);
      enterPlay(s, b, pi);
      log(s, pi, `The Barrow Queen calls ${nameOf(b)} back from ${s.players[b.owner].name}'s discard pile.`);
      ev(s, { k: 'token', uid: b.uid, p: pi });
      break;
    }
    case 'lightweaver':
      makeTokens(s, pi, 'spirit', 1);
      break;
    case 'sky-warden':
      if (t?.zone === 'board') {
        t.ex = true;
        t.frozen = true;
        log(s, pi, `${nameOf(t)} is pinned down: it stays exhausted through its next turn.`);
        ev(s, { k: 'freeze', uid: t.uid });
      }
      break;
  }
}

function play(s, pi, a) {
  const P = s.players[pi];
  const c = s.cards[a.uid];
  const d = def(c);
  const from = fromOf(a);
  const { cost, usesMirror } = price(s, pi, c, from);
  P.energy -= a.fuse != null ? fuseCost(s, pi, c, s.cards[a.fuse]) : cost;
  if (from !== 'legend') removeFrom(from === 'hand' ? P.hand : P.discard, c.uid);
  if (a.fuse != null) { fuseIn(s, pi, c, s.cards[a.fuse]); settle(s); return; }
  if (from === 'discard') c.echoed = true;
  const set = d.subtype === 'Trap';
  log(s, pi, set ? `${P.name} sets a Trap face-down.` : `${P.name} plays ${d.name}${from === 'discard' ? ' from the discard pile (Echo)' : from === 'legend' ? ', their Legend' : ''}.`);
  ev(s, { k: 'play', p: pi, uid: c.uid, cid: set ? null : c.cid, target: a.target || null, sac: a.sac ?? a.fighter ?? null });

  if (d.type === 'creature') {
    enterPlay(s, c, pi);
    creatureEnters(s, pi, c, a, from);
    settle(s);
    return;
  }
  if (d.type === 'relic') {
    c.zone = 'relic';
    c.ctrl = pi;
    c.chimes = 0;
    P.relics.push(c.uid);
    settle(s);
    return;
  }
  if (d.type === 'field') { // (Ultra: one Field for the whole table; a new one replaces it)
    const old = s.field != null ? s.cards[s.field] : null;
    if (old) { log(s, old.owner, `${nameOf(old)} gives way.`); resetPlay(old); toDiscard(s, old, 'field'); }
    c.zone = 'field';
    c.ctrl = pi;
    s.field = c.uid;
    log(s, pi, `The Field is now ${d.name}.`);
    ev(s, { k: 'field', uid: c.uid, p: pi });
    fieldArrives(s, pi, c);
    settle(s);
    return;
  }

  // Spells
  c.zone = 'stack';
  if (usesMirror) P.mirror = true;
  if (P.ripple > 0) P.ripple -= 1; // (a Ripple's discount is used up)
  P.spells += 1;
  gainXP(s, pi, 'spell', 1);
  if (s.ultra) spellPlayed(s, pi, d);
  if (champOn(s, pi, 'champion-ember', 2)) {
    log(s, pi, `${BY_ID['champion-ember'].name}: 1 damage to each opponent.`);
    for (const o of opponents(s, pi)) damagePlayer(s, o.i, 1);
  }
  if (P.spells === 2) {
    for (const u of [...P.board]) if (s.cards[u].cid === 'lightning-theorist') {
      log(s, pi, 'Lightning Theorist: 2 damage to each opponent.');
      for (const o of opponents(s, pi)) damagePlayer(s, o.i, 2);
    }
  }
  // An opponent's Countercurrent springs on the first Spell it sees.
  for (const Q of opponents(s, pi)) {
    const tu = Q.traps.find((u) => s.cards[u].cid === 'countercurrent');
    if (tu == null) continue;
    springTrap(s, Q, s.cards[tu]);
    if (a.payTax && P.energy >= 2) {
      P.energy -= 2;
      log(s, pi, `${P.name} pays 2 more Energy to get past it.`);
    } else {
      log(s, pi, `Countercurrent cancels ${d.name}.`);
      ev(s, { k: 'countered', uid: c.uid });
      toDiscard(s, c, 'stack');
      settle(s);
      return;
    }
    break;
  }
  s.castBy = pi; // (Ione: growth that comes from a Spell of yours)
  resolveSpell(s, pi, c, a);
  delete s.castBy;
  if (set) { c.zone = 'trap'; P.traps.push(c.uid); }
  else if (d.stages) { c.zone = 'relic'; c.ctrl = pi; c.stage = 1; c.stageOn = s.turn; P.relics.push(c.uid); } // (a Ritual stays, in stages)
  else toDiscard(s, c, 'stack');
  settle(s);
}

// Ultra (version 4): what a new Field sets off.
function fieldArrives(s, pi, c) {
  if (!s.ultra) return;
  const P = s.players[pi];
  if (c.cid === 'gale-winds') draw(s, pi, 1);
  if (c.cid === 'rolling-fog' && ultraV5(s)) c.clock = 0;
  gainXP(s, pi, 'field', 1);
  if (champOn(s, pi, 'legend-oriel', 2)) { log(s, pi, `${BY_ID['legend-oriel'].name}: ${P.name} draws a card.`); draw(s, pi, 1); }
}
// Ultra (version 4): what playing a Spell sets off.
function spellPlayed(s, pi, d) {
  const P = s.players[pi];
  if (!ultraV5(s) || P.spells === 1) for (const u of [...P.board]) if (s.cards[u].cid === 'spellwright-apprentice') { log(s, pi, 'Spellwright Apprentice: +1/+1 for good.'); buff(s, s.cards[u], 1, 1, true); } // (version 5: the first Spell each turn)
  if (P.spells === 2 && champOn(s, pi, 'legend-seren', 2)) { log(s, pi, `${BY_ID['legend-seren'].name}: a second Spell, and ${P.name} draws a card.`); draw(s, pi, 1); }
  if (champOn(s, pi, 'legend-seren', 3)) { log(s, pi, `${BY_ID['legend-seren'].name}: 1 damage to each opponent.`); for (const o of opponents(s, pi)) damagePlayer(s, o.i, 1); }
  if (isTrick(d)) {
    gainXP(s, pi, 'trick', 1);
    if (champOn(s, pi, 'legend-mirelle', 3)) { log(s, pi, `${BY_ID['legend-mirelle'].name}: ${P.name} draws a card.`); draw(s, pi, 1); }
  }
}

function use(s, pi, a) {
  const c = s.cards[a.uid];
  const P = s.players[pi];
  c.usedOn = s.turn;
  if (c.zone === 'relic' && def(c).stages) { advanceRitual(s, pi, c, a); return; }
  if (c.zone === 'relic') {
    const sac = s.cards[a.sac];
    log(s, pi, `Bone Altar: ${P.name} sacrifices ${nameOf(sac)} and draws a card.`);
    ev(s, { k: 'use', uid: c.uid, p: pi, cid: c.cid });
    sacrifice(s, sac);
    draw(s, pi, 1);
    settle(s);
    return;
  }
  const d = def(c);
  const t = a.target?.uid != null ? s.cards[a.target.uid] : null;
  P.energy -= d.ability.cost;
  log(s, pi, `${P.name} pays ${d.ability.cost} Energy: ${d.name} — ${d.ability.short}${t ? ` (${nameOf(t)})` : ''}.`);
  ev(s, { k: 'use', uid: c.uid, p: pi, cid: c.cid, target: a.target || null });
  switch (c.cid) {
    case 'reckless-initiate': buff(s, c, 2, 0, false); break;
    case 'ember-duelist': damage(s, t, 1, c); break;
    case 'mossback': buff(s, c, 1, 1, true); break;
    case 'canopy-archer': damage(s, t, 1, c); break;
    case 'curious-wisp': draw(s, pi, 1); break;
    case 'cloud-ray': bounce(s, c); break;
    case 'vesper-bat':
      for (const o of opponents(s, pi)) loseLife(s, o.i, 1);
      gainLife(s, pi, 1);
      break;
    case 'hungry-ghoul': if (t?.zone === 'board') sacrifice(s, t); break;
    case 'choirmother': makeTokens(s, pi, 'spirit', 1); break;
    case 'dawnwatch-knight': buff(s, t, 0, 2, false); break;
    // (Ultra, version 4)
    case 'pearl-diver': invest(s, pi); break;
    case 'blight-beetle': // (version 5)
      if (t?.zone === 'board') {
        const dP = Math.min(1, Math.max(0, t.pP || 0)), dV = Math.min(1, Math.max(0, t.pV || 0));
        t.pP -= dP; t.pV -= dV;
        log(s, pi, `${nameOf(t)} loses +${dP}/+${dV} of its growth.`);
        ev(s, { k: 'buff', uid: t.uid, dP: -dP, dV: -dV, perm: true });
      }
      break;
    case 'the-puppeteer': {
      const f = s.cards[a.fighter];
      if (f?.zone !== 'board' || t?.zone !== 'board') break;
      log(s, pi, `${nameOf(f)} is made to fight ${nameOf(t)}.`);
      ev(s, { k: 'clash', uid: f.uid, to: t.uid });
      const pf = power(s, f), pt = power(s, t);
      damage(s, t, pf, f);
      damage(s, f, pt, t);
      break;
    }
    default:
      if (!d.keywords.includes('fuse')) break;
      if (ultraV2(s) && a.prey != null) { // (a Symbiote kills first)
        const prey = s.cards[a.prey];
        log(s, pi, `${nameOf(c)} strikes ${nameOf(prey)}.`);
        ev(s, { k: 'strike', uid: c.uid, to: prey.uid });
        damage(s, prey, power(s, c), c);
        settle(s);
        if (prey.zone === 'board') break; // (it lived: no fuse)
      }
      fuse(s, pi, c, t);
  }
  settle(s);
}

function startTurn(s, i) {
  s.turn += 1;
  s.active = i;
  const P = s.players[i];
  P.turns += 1;
  P.spells = 0;
  P.mirror = false;
  P.ripple = 0;
  P.maxEnergy = Math.max(P.maxEnergy, Math.min(energyCap(s, P), P.maxEnergy + 1));
  P.energy = P.maxEnergy;
  for (const u of P.board) {
    const c = s.cards[u];
    if (c.frozen) c.frozen = false;
    else c.ex = false;
  }
  log(s, i, `${P.name}'s turn.`);
  ev(s, { k: 'turn', p: i });
  if (s.ultra) ultraTurnStart(s, i);
  for (const u of [...P.relics]) {
    const r = s.cards[u];
    if (r.zone !== 'relic') continue;
    if (r.cid === 'heartwood-totem' && P.board.length) {
      const small = P.board.map((x) => s.cards[x]).reduce((m, x) => (power(s, x) < power(s, m) ? x : m));
      log(s, i, `Heartwood Totem strengthens ${nameOf(small)}.`);
      buff(s, small, 1, 1, true);
    }
    if (r.cid === 'beacon-of-hope') makeTokens(s, i, 'spirit', 1);
    if (r.cid === 'season-of-plenty') {
      const grown = P.board.filter((u) => s.cards[u].grown); // (those it grows don't count twice)
      if (grown.length) log(s, i, `Season of Plenty: ${grown.length} creature${grown.length > 1 ? 's' : ''} grow${grown.length > 1 ? '' : 's'} again.`);
      for (const u of grown) buff(s, s.cards[u], 1, 1, true);
    }
    if (r.cid === 'the-drowned-clock') {
      r.chimes = (r.chimes || 0) + 1;
      ev(s, { k: 'chime', uid: r.uid, n: r.chimes });
      if (r.chimes >= 3) {
        r.chimes = 0;
        log(s, i, 'The Drowned Clock strikes three: each opponent loses 6 Life.');
        for (const o of opponents(s, i)) loseLife(s, o.i, 6);
      } else log(s, i, `The Drowned Clock chimes (${r.chimes} of 3).`);
    }
  }
  if (champOn(s, i, 'champion-verdant', 2) && P.board.length) {
    const small = P.board.map((x) => s.cards[x]).reduce((m, x) => (power(s, x) < power(s, m) ? x : m));
    log(s, i, `${BY_ID['champion-verdant'].name} strengthens ${nameOf(small)}.`);
    buff(s, small, 1, 1, true);
  }
  if (champOn(s, i, 'champion-umbral', 3) && P.board.length < RULES.boardMax) {
    const back = P.discard.map((x) => s.cards[x]).filter((x) => def(x).type === 'creature' && def(x).cost <= 3)
      .reduce((m, x) => (!m || def(x).cost >= def(m).cost ? x : m), null);
    if (back) {
      removeFrom(P.discard, back.uid);
      enterPlay(s, back, i);
      log(s, i, `${BY_ID['champion-umbral'].name} calls ${nameOf(back)} back from the grave.`);
      ev(s, { k: 'token', uid: back.uid, p: i });
    }
  }
  if (champOn(s, i, 'champion-tide', 2)) {
    log(s, i, `${BY_ID['champion-tide'].name}: ${P.name} draws an extra card.`);
    draw(s, i, 1);
  }
  for (const u of [...P.board]) {
    const c = s.cards[u];
    if (c.cid === 'seedling' && c.zone === 'board' && vitality(s, c) >= 3) {
      log(s, i, 'Seedling has grown: sacrifice it and draw a card.');
      sacrificed(s, c);
      draw(s, i, 1);
    }
  }
  if (!(i === s.first && P.turns === 1)) draw(s, i, 1, true);
  settle(s);
  if (P.out && s.phase !== 'over') nextTurn(s);
}

// Ultra, at the start of a turn: Shelter ends; wounds heal (half, rounded up;
// all of them at Sanctuary Spring, none under Scorched Earth; 2 more for each
// Field Medic); creatures that Grow grow, Unstable ones swell, Multiply ones
// copy themselves; a Library draws its card.
function ultraTurnStart(s, i) {
  const P = s.players[i];
  for (const u of P.relics) { // (version 4: what a Granary saved)
    const r = s.cards[u];
    if (!r.stored) continue;
    P.energy += r.stored;
    log(s, i, `The Granary gives back ${r.stored} Energy.`);
    ev(s, { k: 'granary', uid: r.uid, n: -r.stored });
    r.stored = 0;
  }
  if (ultraV5(s) && fieldMine(s, i) && fieldIs(s, 'rolling-fog')) { // (version 5: the fog lifts at the start of its owner's third turn)
    const f = s.cards[s.field];
    f.clock = (f.clock || 0) + 1;
    if (f.clock >= 3) {
      log(s, i, 'The Rolling Fog lifts.');
      resetPlay(f);
      s.field = null;
      toDiscard(s, f, 'field');
      ev(s, { k: 'field', uid: null, p: i });
    }
  }
  if (P.smoke) { // (version 5: Choking Smoke)
    const k = Math.min(P.smoke, P.energy);
    P.energy -= k;
    log(s, i, `Choking Smoke: ${P.name} has ${k} less Energy this turn.`);
    P.smoke = 0;
  }
  if (champOn(s, i, 'legend-hush', 2)) {
    log(s, i, `${BY_ID['legend-hush'].name}: each opponent loses 1 Life, and ${P.name} gains 1.`);
    for (const o of opponents(s, i)) loseLife(s, o.i, 1, i);
    gainLife(s, i, 1);
  }
  if (fieldMine(s, i)) { // (version 4: Oriel)
    gainXP(s, i, 'field', 1);
    if (champOn(s, i, 'legend-oriel', 3)) { log(s, i, `${BY_ID['legend-oriel'].name}: the storm hits each opponent for 2.`); for (const o of opponents(s, i)) damagePlayer(s, o.i, 2); }
  }
  for (const u of P.board) delete s.cards[u].shelter;
  const medics = countOn(s, P.board, 'field-medic');
  for (const u of [...P.board]) {
    const c = s.cards[u];
    if (c.zone !== 'board' || c.dmg <= 0) continue;
    const open = Math.max(0, c.dmg - (c.poison || 0));
    const natural = fieldIs(s, 'scorched-earth') ? 0 : fieldIs(s, 'sanctuary-spring') ? open : Math.ceil(open / 2);
    heal(s, c, natural + 2 * medics);
  }
  for (const u of [...P.board]) {
    const c = s.cards[u];
    if (c.zone !== 'board') continue;
    const g = (def(c).grows || 0) + (c.fuseGrows || 0); // (Grows fused in from the hand adds up)
    if (g) { log(s, i, `${nameOf(c)} grows +${g}/+${g}.`); buff(s, c, g, g, true); }
    if (c.zone === 'board' && hasKw(s, c, 'unstable')) { log(s, i, `${nameOf(c)} swells +2/+2.`); buff(s, c, 2, 2, true, false, true); } // (beyond any cap: it erupts and starts again)
  }
  for (const c of P.board.map((u) => s.cards[u]).filter((x) => hasKw(s, x, 'multiply'))) {
    if (P.board.length >= RULES.boardMax) break;
    const t = mk(s, c.cid, i, 'board');
    t.token = true;
    enterPlay(s, t, i);
    log(s, i, `${nameOf(c)} multiplies.`);
    ev(s, { k: 'token', uid: t.uid, p: i });
    gainXP(s, i, 'token', 1);
  }
  for (const u of [...P.relics]) if (s.cards[u].cid === 'tidecallers-library') { log(s, i, `Tidecaller’s Library: ${P.name} draws an extra card.`); draw(s, i, 1); }
  for (let k = countOn(s, P.board, 'shieldwright'); k > 0; k--) {
    const bare = P.board.map((u) => s.cards[u]).filter((x) => !(x.shield > 0));
    if (!bare.length) break;
    const top = bare.reduce((m, x) => (power(s, x) > power(s, m) ? x : m));
    log(s, i, `Shieldwright forges a Shield for ${nameOf(top)}.`);
    giveShield(s, top);
  }
  gainXP(s, i, 'guard', P.board.filter((u) => hasKw(s, s.cards[u], 'guard')).length); // (Halvard: the wall that stands)
  settle(s);
}

function nextTurn(s) {
  if (s.phase === 'over') return;
  const cur = s.players[s.active];
  if (cur.extra > 0 && !cur.out) {
    cur.extra -= 1;
    log(s, cur.i, `${cur.name} takes an extra turn!`);
    startTurn(s, cur.i);
    return;
  }
  let i = s.active;
  for (let k = 0; k < s.players.length; k++) {
    i = (i + 1) % s.players.length;
    if (!s.players[i].out) break;
  }
  startTurn(s, i);
}

function endTurn(s) {
  const all = () => s.players.flatMap((Q) => Q.board.map((u) => s.cards[u]));
  const P = s.players[s.active];
  if (s.ultra) for (const u of P.relics) { // (version 4: a Granary saves up to 3 Energy for the next turn)
    const r = s.cards[u];
    if (r.cid !== 'the-granary') continue;
    r.stored = Math.min(3, Math.max(0, P.energy));
    P.energy -= r.stored;
    if (r.stored) { log(s, P.i, `The Granary saves ${r.stored} Energy for next turn.`); ev(s, { k: 'granary', uid: r.uid, n: r.stored }); }
  }
  if (s.crownOn && s.crown === P.i && !P.out) {
    log(s, P.i, `${P.name} holds the Crown and draws a card.`);
    ev(s, { k: 'crownDraw', p: P.i });
    draw(s, P.i, 1);
    if (s.phase === 'over') return;
  }
  for (const c of all().filter((x) => x.sacEnd)) if (c.zone === 'board') { log(s, c.ctrl, c.sacEnd === 'danse' ? `The dance ends for ${nameOf(c)}.` : `Borrowed Time runs out for ${nameOf(c)}.`); sacrificed(s, c); }
  settle(s);
  // Borrowed creatures go home.
  for (const c of all().filter((x) => x.stolen)) {
    const back = s.players[c.stolen.back];
    removeFrom(s.players[c.ctrl].board, c.uid);
    delete c.stolen;
    delete c.rush;
    if (!back.out && back.board.length < RULES.boardMax) { back.board.push(c.uid); c.ctrl = back.i; log(s, back.i, `${nameOf(c)} returns to ${back.name}.`); ev(s, { k: 'steal', uid: c.uid, to: back.i }); }
    else { resetPlay(c); toDiscard(s, c, 'board'); }
  }
  for (const Q of s.players) for (const u of Q.board) {
    const c = s.cards[u];
    if (!s.ultra || !ULTRA_V2.wounds) { c.dmg = 0; c.poison = 0; } // (in Ultra, wounds stay until they heal)
    c.tP = 0; c.tV = 0;
    delete c.tKw;
    delete c.venomed;
  }
  settle(s);
  s.died = 0;
  s.diedOwn = s.diedOwn.map(() => 0);
  nextTurn(s);
}

function mulligan(s, pi, redraw) {
  const P = s.players[pi];
  P.mull = redraw ? 'redrew' : 'kept';
  if (redraw) {
    const back = P.hand.filter((u) => !s.cards[u].token);
    P.hand = P.hand.filter((u) => s.cards[u].token);
    for (const u of back) { s.cards[u].zone = 'deck'; P.deck.push(u); }
    shuffle(s, P.deck);
    for (let k = 0; k < RULES.openingHand; k++) drawRaw(s, P);
    log(s, pi, `${P.name} draws a new opening hand.`);
  } else log(s, pi, `${P.name} keeps their hand.`);
  if (s.players.every((Q) => Q.mull)) {
    s.phase = 'main';
    startTurn(s, s.first);
  }
}

// Manual fixes for game night: if something goes wrong, players can put it right.
function fix(s, a) {
  const who = s.players[a.by]?.name || 'Someone';
  if (a.op === 'life') { const P = s.players[a.p]; P.life += a.n; log(s, a.p, `🛠 ${who} adjusts ${P.name}'s Life by ${a.n > 0 ? '+' : ''}${a.n}.`); if (P.life <= 0) eliminate(s, a.p); }
  else if (a.op === 'energy') { const P = s.players[a.p]; P.energy = Math.max(0, P.energy + a.n); log(s, a.p, `🛠 ${who} adjusts ${P.name}'s Energy by ${a.n > 0 ? '+' : ''}${a.n}.`); }
  else if (a.op === 'stat') { const c = s.cards[a.uid]; if (c?.zone === 'board') { c.pP += a.dP || 0; c.pV += a.dV || 0; log(s, c.ctrl, `🛠 ${who} adjusts ${nameOf(c)} by ${a.dP || 0}/${a.dV || 0}.`); settle(s); } }
  else if (a.op === 'move') {
    const c = s.cards[a.uid];
    if (!c) return;
    for (const Q of s.players) for (const z of ['hand', 'deck', 'discard', 'board', 'exile', 'traps', 'relics']) removeFrom(Q[z], c.uid);
    const P = s.players[c.owner];
    if (a.to === 'board') enterPlay(s, c, c.owner);
    else { resetPlay(c); c.zone = a.to; (a.to === 'deck' ? P.deck.unshift(c.uid) : P[a.to].push(c.uid)); }
    log(s, c.owner, `🛠 ${who} moves ${nameOf(c)} to ${a.to}.`);
    if (s.combat) pruneCombat(s);
    settle(s);
  }
}

// Apply one action. Returns { state, error }; on error the state is unchanged.
export function apply(state, a) {
  const error = check(state, a);
  if (error) return { state, error };
  const s = structuredClone(state);
  s.events = [];
  const inFight = s.phase === 'combat';
  switch (a.t) {
    case 'mulligan': mulligan(s, a.p, !!a.redraw); break;
    case 'play': play(s, a.p, a); break;
    case 'attack': attack(s, a.p, a); break;
    case 'block': declareBlocks(s, a.p, a.blocks || []); break;
    case 'pass': s.combat.passes += 1; s.combat.prio = otherSide(s.combat); break;
    case 'use': use(s, a.p, a); break;
    case 'unhex': unhex(s, a.p, a); break;
    case 'dig': dig(s, a.p); break;
    case 'phoenix': {
      const P = s.players[a.p];
      P.energy -= 2;
      removeFrom(P.discard, a.uid);
      s.cards[a.uid].phoenixTurn = 0;
      toHand(s, s.cards[a.uid], 'discard');
      log(s, a.p, `${P.name} pays 2 Energy and the Phoenix returns to their hand.`);
      break;
    }
    case 'end': log(s, a.p, `${s.players[a.p].name} ends their turn.`); endTurn(s); break;
    case 'concede': log(s, a.p, `${s.players[a.p].name} concedes.`); eliminate(s, a.p); break;
    case 'fix': fix(s, a); break;
  }
  if (s.phase === 'combat') {
    // A Trick (or an ability) after blockers gives the other side a chance to answer.
    if (inFight && (a.t === 'play' || a.t === 'use') && s.combat.step === 'tricks') { s.combat.passes = 0; s.combat.prio = otherSide(s.combat); }
    pruneCombat(s);
    advance(s);
  }
  if (s.phase === 'main' && s.players[s.active].out) nextTurn(s);
  return { state: s, error: null };
}

// Put a card straight into a zone. For tests and scenario set-up only.
export function addCard(s, cid, owner, zone, extra = {}) {
  const c = mk(s, cid, owner, zone);
  const P = s.players[owner];
  if (zone === 'board') { enterPlay(s, c, owner); c.played = s.turn - 2; }
  else if (zone === 'traps') { c.zone = 'trap'; P.traps.push(c.uid); }
  else if (zone === 'relics') { c.zone = 'relic'; c.ctrl = owner; c.chimes = 0; P.relics.push(c.uid); }
  else if (zone === 'legend') Object.assign(P, { legend: c.uid, champ: cid, cxp: P.cxp || 0 }); // (Ultra: beside the deck)
  else P[zone].push(c.uid);
  Object.assign(c, extra);
  return c;
}

export function replay(setup, actions) {
  let s = newGame(setup);
  for (const a of actions) s = apply(s, a).state;
  return s;
}

// ── every legal move (for the bot and the fuzz tests) ──────────────
// All the ways to play one card, up to `limit` of them.
export function playOptions(s, pi, c, from = 'hand', limit = Infinity) {
  const out = [];
  const P = s.players[pi];
  const d = def(c);
  const fusing = ultraV2(s) && ULTRA_V2.fuseHand && d.type === 'creature' && from === 'hand';
  if (s.phase === 'combat' && !isTrick(d) && !d.keywords.includes('ambush')) return fusing ? fuseOptions(s, pi, c, limit) : out;
  if (price(s, pi, c, from).cost > P.energy) return out;
  const base = { t: 'play', p: pi, uid: c.uid, ...(from !== 'hand' ? { from } : {}), payTax: true };
  const push = (a) => { if (out.length < limit && !checkPlay(s, a)) out.push(a); };
  const n = needs(s, pi, c, from);
  if (n.sac || n.fighter) {
    const key = n.sac ? 'sac' : 'fighter';
    for (const x of n.sac || n.fighter) { if (!n.target) push({ ...base, [key]: x }); else for (const target of n.target) push({ ...base, [key]: x, target }); } // (Bone Tithe: a sacrifice alone)
  } else if (n.target) {
    for (const target of n.target) push({ ...base, target });
    if (n.optional || !n.target.length) push(base);
  } else if (n.pick) {
    for (const pick of n.pick) push({ ...base, pick });
    if (n.optional || !n.pick.length) push(base);
  } else if (n.picks) {
    const best = [...n.picks].sort((x, y) => def(s.cards[y]).cost - def(s.cards[x]).cost).slice(0, n.max);
    push({ ...base, picks: best });
  } else if (n.targets) {
    const own = n.targets, k = n.count, combos = [];
    const rec = (start, acc) => { if (acc.length === k) { combos.push([...acc]); return; } for (let i = start; i < own.length; i++) { acc.push(own[i]); rec(i + 1, acc); acc.pop(); } };
    if (k > 0) rec(0, []);
    for (const targets of combos.slice(0, 40)) push({ ...base, targets });
  } else if (n.keep) {
    if (n.keep.length) for (const keep of n.keep) push({ ...base, keep }); else push(base);
  } else if (n.bottom) {
    push({ ...base, bottom: false });
    if (n.bottom.length) push({ ...base, bottom: true });
  } else if (n.discard) {
    for (const discard of n.discard) push({ ...base, discard });
  } else push(base);
  if (n.offer) for (const o of [...out]) for (const offer of n.offer) if (o.target?.uid !== offer) push({ ...o, offer }); // (each with each Offering)
  if (fusing && out.length < limit) out.push(...fuseOptions(s, pi, c, limit - out.length));
  return out;
}

// Ultra (version 2): the ways to fuse a creature card from the hand into one of yours.
function fuseOptions(s, pi, c, limit = Infinity) {
  const out = [];
  for (const host of fuseHosts(s, pi)) {
    if (out.length >= limit) break;
    const a = { t: 'play', p: pi, uid: c.uid, fuse: host };
    if (!checkPlay(s, a)) out.push(a);
  }
  return out;
}

// A handful of sensible attack declarations against one opponent.
export function attackOptions(s, pi) {
  const out = [];
  const P = s.players[pi];
  if (P.attackedOn === s.turn || s.phase !== 'main') return out;
  const ready = P.board.filter((u) => canAttack(s, pi, s.cards[u]));
  if (!ready.length) return out;
  for (const Q of opponents(s, pi)) {
    const sets = [ready, ...ready.map((u) => [u])];
    if (ready.length > 2) for (const u of ready) sets.push(ready.filter((x) => x !== u));
    if (s.ultra && fieldIs(s, 'rolling-fog')) sets.push([...ready].sort((x, y) => power(s, s.cards[y]) - power(s, s.cards[x])).slice(0, 2)); // (two at most)
    const seen = new Set();
    for (const att of sets) {
      const key = att.join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      // Each hunter picks the toughest creature it could pin down.
      const hunt = [];
      for (const u of att) {
        const a = s.cards[u];
        if (!hasKw(s, a, 'hunt')) continue;
        const prey = Q.board.map((x) => s.cards[x]).filter((b) => canBlock(s, b, a) && !(s.ultra && b.shelter));
        if (prey.length) hunt.push([u, prey.reduce((m, b) => (power(s, b) > power(s, m) ? b : m)).uid]);
      }
      out.push({ t: 'attack', p: pi, target: Q.i, att, ...(hunt.length ? { hunt } : {}) });
    }
  }
  return out.filter((a) => !checkAttack(s, a));
}

// A few block declarations: none, each single block, one blocker per
// attacker, and everyone who can piling onto the first attacker.
export function blockOptions(s, pi) {
  const C = s.combat;
  if (!C || C.step !== 'block' || C.d !== pi) return [];
  const forced = forcedBlocks(s, C);
  const free = s.players[pi].board.filter((u) => !forced.some(([b]) => b === u));
  const open = C.att.filter((u) => !forced.some(([, x]) => x === u));
  const out = [forced];
  for (const b of free) for (const at of open) if (canBlock(s, s.cards[b], s.cards[at])) out.push([...forced, [b, at]]);
  const greedy = [...forced], used = new Set();
  for (const at of open) {
    const b = free.find((x) => !used.has(x) && canBlock(s, s.cards[x], s.cards[at]));
    if (b != null) { used.add(b); greedy.push([b, at]); }
  }
  out.push(greedy);
  if (C.att.length) out.push([...forced, ...free.filter((b) => canBlock(s, s.cards[b], s.cards[C.att[0]])).map((b) => [b, C.att[0]])]);
  return out.map((blocks) => ({ t: 'block', p: pi, blocks })).filter((a) => !checkBlock(s, a));
}

export function legalActions(s, pi) {
  const out = [];
  const P = s.players[pi];
  if (s.phase === 'over' || P.out) return out;
  if (s.phase === 'mulligan') return P.mull ? out : [{ t: 'mulligan', p: pi, redraw: false }, { t: 'mulligan', p: pi, redraw: true }];
  if (actor(s) !== pi) return out;
  const sources = [...P.hand.map((u) => ['hand', u]), ...P.discard.filter((u) => def(s.cards[u]).echo).map((u) => ['discard', u]),
    ...(P.legend != null && s.cards[P.legend].zone === 'legend' ? [['legend', P.legend]] : [])];
  for (const [from, uid] of sources) out.push(...playOptions(s, pi, s.cards[uid], from));
  for (const u of [...P.relics, ...P.board]) out.push(...useOptions(s, pi, s.cards[u]));
  if (s.phase === 'combat') {
    if (s.combat.step === 'block') out.push(...blockOptions(s, pi));
    else out.push({ t: 'pass', p: pi });
    return out;
  }
  for (const u of phoenixReady(s, pi)) { const a = { t: 'phoenix', p: pi, uid: u }; if (!check(s, a)) out.push(a); }
  for (const u of P.board) { const a = { t: 'unhex', p: pi, uid: u }; if (s.cards[u].hex && !check(s, a)) out.push(a); }
  if (ultraV2(s) && !check(s, { t: 'dig', p: pi })) out.push({ t: 'dig', p: pi });
  out.push(...attackOptions(s, pi));
  out.push({ t: 'end', p: pi });
  return out;
}
