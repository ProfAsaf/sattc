// Cards acting out their moves in the game (each card's puppet and move, and
// the kit that builds it: js/puppet-kit.js), whenever nothing else happens:
//  - A card opened big (the Cards zoom, a game's viewer) plays its move a
//    moment after it shows, then every few seconds.
//  - In a game at rest (nobody touching, no move playing out, nobody choosing
//    a target), cards act, a few at once, each on cards of its own: on the
//    table an attacker's move goes to a card on another side, a support's to
//    the card nearest it on its own (a defender it reaches blocks, any other
//    card jolts); the card raised in your hand acts alone; full cards in sight
//    (your opening hand, a sheet of cards) act on the card beside them; on an
//    attack or block screen each card acts alone.
//  - Everywhere else (Cards, the draft, the Rules), the cards in sight act on
//    the card beside them.
//  - In a real fight, a creature strikes with its own move, aimed at what it
//    strikes (fight(), below).
// Any touch ends every scene, and so does any move of the game. With Reduce
// Motion on, nothing plays. What moves at once has a ceiling (a phone closes a
// page that runs out of memory for it), lower after the phone has closed the
// game today (js/steady.js).

import { LIVE } from './art-live.js';
import { PUPPETS } from './art/puppets.js';
import { fxArt } from './fx-art.js';
import { H, W, loaded, makeKit, paint, sleep } from './puppet-kit.js';
import { livenArt } from './render.js';
import { drop, fetchSprites, release, still } from './sprites.js';
import { getSpeed, isReduced } from './fx.js';
import { calm } from './steady.js';
import { radialStops, softPicSoon } from './fx-tex.js';

const HOME_ONLY = new Set(['seraphine', 'the-barrow-queen']); // (they act in Home's own scene, js/home-alive.js)
export const canAct = (id) => !!(LIVE[id] && PUPPETS[id] && !HOME_ONLY.has(id)) && !still() && calm() < 3; // (3: Moving cards set to still)

// ── why nothing acts, seen on a phone: open the game once with ?alive=1 for a
// line at the bottom of the screen saying where the cards are, whether that's
// at rest (or why not), which cards are in sight, and what the last scene did;
// ?alive=0 takes it away ──
const DIAG = (() => {
  try {
    const q = new URLSearchParams(location.search).get('alive');
    if (q === '1' || q === '0') localStorage.setItem('collective.alive', q);
    return localStorage.getItem('collective.alive') === '1';
  } catch { return false; }
})();
const diag = { where: '', why: '', seen: '', last: '' };
let diagEl = null;
function note(part, text) {
  if (!DIAG || diag[part] === text) return;
  diag[part] = text;
  if (!diagEl?.isConnected) {
    diagEl = document.createElement('div');
    diagEl.style.cssText = 'position:fixed;left:4px;right:4px;bottom:calc(env(safe-area-inset-bottom, 0px) + 4px);z-index:2147483000;pointer-events:none;font:600 11px/1.35 system-ui, sans-serif;color:#fff;background:rgba(0,0,0,.78);padding:4px 8px;border-radius:8px;white-space:pre-wrap';
    document.body.append(diagEl);
  }
  diagEl.textContent = `${diag.where}: ${diag.why}\n${diag.seen}\n${diag.last}`;
}
if (DIAG && still()) note('why', 'Reduce Motion is on: nothing plays');

// ── a move, built on a card on the page ──────────────────────────────
const mods = new Map(), arts = new Map();
const moveOf = (id) => {
  if (!mods.has(id)) mods.set(id, import(`../bakeoff/moves/${id}.js`).then((m) => (typeof m.build === 'function' ? m : null)).catch(() => null));
  return mods.get(id);
};
// its textures: the shared fire, smoke and gloom (js/fx-art.js) and its own,
// painted once a page; the last ARTS cards' kept, older ones let go (their
// pictures freed), so a long session doesn't pile them up
const ARTS = 24;
function artOf(id, mod) {
  let a = arts.get(id);
  if (a) { arts.delete(id); arts.set(id, a); return a.ready; } // (the most recent last)
  const own = [];
  a = { own, ready: (async () => {
    const art = { ...(await fxArt()) };
    for (const [name, [w, h, px]] of Object.entries(mod.textures || {})) { art[name] = paint(w, h, px); own.push(art[name]); await sleep(0); }
    await Promise.all(Object.values(art).map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    return art;
  })() };
  arts.set(id, a);
  for (const [old, o] of arts) {
    if (arts.size <= ARTS) break;
    arts.delete(old);
    o.ready.then(() => { for (const u of o.own) URL.revokeObjectURL(u); }).catch(() => {});
  }
  return a.ready;
}
// `card`: a card whose picture is in sprites (its .sp-art); what leaves the
// picture goes on `over`. Null if it has no move (or it couldn't be built).
async function build(id, card, over, { aim = null, blows = null } = {}) {
  const box = card.querySelector('.sp-art');
  for (let t = 0; t < 100 && box && !box.live; t++) await sleep(50);
  if (!box?.live) { note('last', `${id}: its picture's parts never came`); return null; }
  await Promise.all([...box.querySelectorAll('img.sp')].map(loaded));
  const mod = await moveOf(id);
  if (!mod) { note('last', `${id}: its move didn't load`); return null; }
  const art = await artOf(id, mod);
  if (!card.isConnected || !over.isConnected) { note('last', `${id}: the screen changed first`); return null; }
  const face = card.querySelector('.card-face, .tc-face') || card;
  const m = makeKit({ id, mod, art, box, face, over, aim, blows, lenient: true });
  try { mod.build(m.k); } catch (e) { console.warn(`${id}: its move didn't build`, e); note('last', `${id}: its move broke: ${e?.message || e}`); dropMove(m); return null; }
  for (const a of m.anims) a.cancel();
  await asPictures(m);
  await Promise.all(m.made.filter((el) => el.tagName === 'IMG').map(loaded));
  return { id, END: m.END, BEATS: mod.BEATS || null, anims: m.anims, made: m.made };
}
// A built move's soft lights (CSS radial gradients) as small pictures the
// graphics chip stretches (js/fx-tex.js): each painted gradient needed a layer
// as big as it shows, at 3x; a picture doesn't. Read from the light as built
// (its classes and its own colours), swapped in its place, its motion moved
// onto the picture; any light that isn't a plain soft gradient stays as it is.
// (Read all first, then swap: reading between swaps would lay the page out again each time. A light
// up to 60 px across gets a 128 px picture, a bigger one 192.)
async function asPictures(m) {
  if (window.__ppNoTex) return; // (a test comparing the two)
  const todo = [];
  for (const el of m.made) {
    if (el.tagName !== 'I' || !el.classList.contains('fx') || !el.isConnected) continue;
    const cs = getComputedStyle(el), bg = cs.backgroundImage, st = radialStops(bg);
    // (a circle stretched to a box that isn't square would be an ellipse: as CSS; and only a box cut round, or not at all)
    const r = cs.borderTopLeftRadius, round = r === '50%', w = el.offsetWidth, h = el.offsetHeight;
    if (!st || (st.circle && Math.abs(w - h) > 0.5) || !(round || r === '0px')) { if (bg !== 'none') window.__ppTexMiss?.push(bg); continue; }
    todo.push({ el, st, round, size: Math.max(w, h) <= 60 ? 128 : 192 });
  }
  if (!todo.length) return;
  const urls = await Promise.all(todo.map((t) => softPicSoon(t.st.stops, t.size, t.round, t.st.side)));
  const swaps = new Map();
  todo.forEach(({ el }, i) => {
    if (!el.isConnected) return;
    const im = document.createElement('img');
    im.alt = '';
    im.src = urls[i];
    im.className = `${el.className} tex`;
    im.style.cssText = el.style.cssText;
    el.replaceWith(im);
    swaps.set(el, im);
  });
  if (!swaps.size) return;
  for (const a of m.anims) { const t = a.effect?.target; if (swaps.has(t)) a.effect.target = swaps.get(t); }
  m.made = m.made.map((el) => swaps.get(el) || el);
}
const play = (m) => { for (const a of m.anims) { a.cancel(); a.play(); } };
const halt = (m) => { for (const a of m?.anims || []) a.cancel(); };
function dropMove(m) { halt(m); for (const el of m?.made || []) { release(el); el.remove(); } }
// every picture in `els` decoded, and two frames painted (a motion started on
// a picture that isn't stays on the main thread)
async function settle(els) {
  await Promise.all(els.flatMap((el) => [...el.querySelectorAll('img')]).map((im) => im.decode().catch(() => {})));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

// ── a card opened big ────────────────────────────────────────────────
// Gives { pause(on), stop() }, or null when the card can't act.
export function actInZoom(zoomEl, id) {
  const card = zoomEl.querySelector('.flip-inner > .card');
  if (!canAct(id) || !card?.querySelector('.sp-art')) return null;
  card.classList.add('pp');
  const over = document.createElement('div');
  over.className = 'pp-fx';
  zoomEl.append(over);
  const st = { on: true, paused: false, m: null, wake: null };
  const nap = (ms) => new Promise((r) => { st.wake = r; setTimeout(r, ms); });
  (async () => {
    const m = await build(id, card, over);
    if (!st.on) { dropMove(m); return; }
    st.m = m;
    if (m) fit([m], roomFor('big'), { idle: idleOf(card), what: 'zoom' });
    for (let first = true; st.on && m; first = false) {
      await nap(first ? 500 : 1500);
      if (!st.on) break;
      if (st.paused || document.hidden) continue;
      play(m);
      watchFrames(m.END);
      await nap(m.END + 100);
      halt(m);
    }
  })();
  return {
    pause(on) { st.paused = on; if (on) { halt(st.m); st.wake?.(); } },
    stop() { st.on = false; st.wake?.(); dropMove(st.m); over.remove(); card.classList.remove('pp'); },
  };
}

// ── a card shown big in a game (its viewer: your hand, the table) ────
// Its picture in sprites laid over its own, its move a moment after it shows
// and then every few seconds, its effects on an overlay in `host`. The game
// draws the viewer afresh on every change, so it starts this anew each time.
// Gives { stop() }, or null when the card can't act.
export function actBig(host, card, id) {
  if (!host || !card || !canAct(id)) return null;
  const swap = inSprites(card, id, '.c-art');
  const over = document.createElement('div');
  over.className = 'pp-fx';
  host.append(over);
  const st = { on: true, m: null, wake: null };
  const nap = (ms) => new Promise((r) => { st.wake = r; setTimeout(r, ms); });
  (async () => {
    await swap.ready;
    const m = st.on ? await build(id, card, over) : null;
    if (!st.on) { dropMove(m); return; }
    st.m = m;
    if (m) { fit([m], roomFor('big'), { idle: idleOf(card), what: 'big' }); await settle([over, card]); }
    for (let first = true; st.on && m; first = false) {
      await nap(first ? 300 : 1200);
      if (!st.on) break;
      if (document.hidden) continue;
      play(m);
      watchFrames(m.END);
      await nap(m.END + 100);
      halt(m);
    }
  })();
  return { stop() { st.on = false; st.wake?.(); dropMove(st.m); over.remove(); swap.undo(); } };
}

// ── how much moves at once: a ceiling ────────────────────────────────
// On an iPhone every element in motion is a layer of its own, as big as
// itself and drawn at the largest its motion scales it (a screen of layer is
// ~12.6 MB at 3x), and a page that runs out of memory for them is closed: the
// white flash. The game's own effects keep under ~220 moving at once
// (.phone-tests/ui-busy.mjs); a move keeps every part and effect it has moving
// for the whole move, often 150-250 of them. So before one plays, what it
// would set moving (how many, and how much screen) is fitted to the room left:
// its biggest effects (glows, bursts) go first, then every other one of the
// rest (fewer sparks) until it fits; its body (the picture's parts) always
// plays. A scene that can't fit even so doesn't play; a fight that can't
// charges as it used to. There's less room after the phone has closed the game
// today (calm(), js/steady.js), and at the calmest nothing acts by itself.
const ROOM = { // by calm level: [screens, elements]
  scenes: [[1, 150], [0.6, 90], [0, 0]], // the scenes together
  fight: [[1.2, 140], [0.7, 80], [0, 0]], // a fight's moves (no scene plays meanwhile; they end as the deaths start: endFights())
  big: [[1.6, 180], [1, 110], [0.7, 80]], // a card opened big (nothing else acts meanwhile)
};
const used = { area: 0, n: 0 }; // what scenes and fights keep moving now
function roomFor(kind) {
  const [a, n0] = ROOM[kind][Math.min(2, calm())] || [0, 0], k = strained() ? 0.5 : 1, area = a * k, n = Math.round(n0 * k);
  return kind === 'scenes' ? { area: area - used.area, n: n - used.n } : { area, n };
}

// ── frames: a phone straining shows it in its frames first ───────────
// While cards act, the time between frames is watched. When most of the last
// 40 come over 45 ms apart (under ~22 a second; a phone saving power still
// draws 30), the phone is struggling: for a minute (two the next time, and so
// on) the cards take half the room, one scene at a time, and the scenes past
// the first end now. A long task now and then (a bot thinking) doesn't count.
const strain = { until: 0, times: 0, raf: 0, last: 0, gaps: [], playing: 0 };
const strained = () => Date.now() < strain.until;
function watchFrames(ms) {
  strain.playing = Math.max(strain.playing, Date.now() + ms);
  if (strain.raf) return;
  const step = (t) => {
    if (document.hidden) strain.last = 0;
    else if (strain.last) {
      strain.gaps.push(t - strain.last);
      if (strain.gaps.length > 40) strain.gaps.shift();
      const mid = [...strain.gaps].sort((x, y) => x - y)[20];
      if (strain.gaps.length === 40 && mid > 40) {
        strain.times++;
        strain.until = Date.now() + 60e3 * strain.times;
        strain.gaps = [];
        note('last', `the phone's frames came slowly (${Math.round(mid)} ms): calmer for ${strain.times} min`);
        for (const st of stages.values()) [...st.scenes].slice(1).forEach((sc) => endScene(st, sc));
      }
    }
    strain.last = document.hidden ? 0 : t;
    if (Date.now() < strain.playing) strain.raf = requestAnimationFrame(step);
    else { strain.raf = 0; strain.last = 0; strain.gaps = []; }
  };
  strain.raf = requestAnimationFrame(step);
}
// what an element moving costs: its box, at the most its motion scales it, in screens (4 at most)
function costOf(el, anim = null) {
  const r = el.getBoundingClientRect();
  let k = 1;
  for (const f of anim?.effect?.getKeyframes?.() || []) {
    if (typeof f.transform !== 'string') continue;
    for (const m of f.transform.matchAll(/scale(?:3d|X|Y)?\(([^)]*)\)/g)) for (const v of m[1].split(',')) k = Math.max(k, Math.abs(parseFloat(v)) || 0);
  }
  return Math.min(4, (r.width * r.height * k * k) / (innerWidth * innerHeight));
}
// The motions a card's picture has of its own while it's in sprites (its drawn
// lights and motes: js/sprites.js), on the cards given.
const idleOf = (...cards) => cards.flatMap((c) => (c?.querySelector('.sp-art')?.anims || []).filter((a) => a?.effect?.target));
// Fits moves into `room` ({ area, n }), with `more`: other elements moving with
// them, that stay; and `idle`: the pictures' own motions, which go first (the
// lights stay, still). Gives what they keep moving after ({ area, n }) and
// whether that fits. (A test may set window.__ppCosts = [] to note each fit.)
function fit(moves, room, { more = [], idle = [], what = '' } = {}) {
  const list = moves.flatMap((m) => m.anims.map((a) => ({ m, a, el: a.effect?.target })).filter((x) => x.el)).map((x) => ({ ...x, c: costOf(x.el, x.a) }));
  const still = idle.map((a) => ({ a, el: a.effect.target, c: costOf(a.effect.target, a), idle: true }));
  let area = [...list, ...still].reduce((s, x) => s + x.c, more.reduce((s, el) => s + costOf(el), 0)), n = list.length + still.length + more.length, cut = 0;
  const was = { area, n };
  const drop = (x) => {
    x.a.cancel();
    if (x.idle) x.el.dataset.still = '1'; // (and so it stays, js/sprites.js move())
    else { x.m.anims.splice(x.m.anims.indexOf(x.a), 1); x.el.remove(); }
    area -= x.c; n--; cut++; x.gone = true;
  };
  for (const x of still.sort((p, q) => q.c - p.c)) { if (area <= room.area && n <= room.n) break; drop(x); }
  const fx = list.filter((y) => y.el.classList.contains('fx')).sort((p, q) => q.c - p.c);
  for (const x of fx) { if (area <= room.area) break; drop(x); }
  for (let left = fx.filter((x) => !x.gone); n > room.n && left.length; left = left.filter((x) => !x.gone)) {
    left.forEach((x, k) => { if (k % 2 && n > room.n) drop(x); });
    if (left.length === 1) drop(left[0]);
  }
  window.__ppCosts?.push({ what, ids: moves.map((m) => m.id), was: { area: +was.area.toFixed(2), n: was.n }, now: { area: +area.toFixed(2), n }, cut, room: { area: +room.area.toFixed(2), n: room.n } });
  return { area, n, fits: area <= room.area + 1e-6 && n <= room.n };
}

// ── a stage: cards acting while nothing else happens ─────────────────
// A game and the rest of the app are stages, each with its own cards and its
// own way of choosing who acts on whom. Once the stage has been quiet (no
// touch, and its own quiet()) for `idle` ms, a scene starts, and another a
// moment after while there's room: up to `max` at once, each on cards of its
// own (a card acting, or acted on, is in no other scene).
const NEXT = [450, 1100]; // ms from one scene's start to the next's: somewhere between
const ART = '.tc-art, .c-art'; // (a card's picture: a table card's, or a full card's)
const stages = new Map();

function startStage(name, o) {
  stopStage(name);
  if (still()) return;
  const st = { ...o, name, last: Date.now(), next: 0, scenes: new Set(), recent: [] };
  const touched = () => { st.last = Date.now(); endAll(st); };
  const evs = ['pointerdown', 'pointerup', 'keydown', 'wheel', 'touchstart', 'scroll'];
  for (const e of evs) window.addEventListener(e, touched, { passive: true, capture: true });
  st.off = () => { for (const e of evs) window.removeEventListener(e, touched, { capture: true }); };
  st.timer = setInterval(() => tick(st), 150);
  stages.set(name, st);
}
function stopStage(name) {
  const st = stages.get(name);
  if (!st) return;
  stages.delete(name);
  clearInterval(st.timer);
  st.off();
  endAll(st);
}
function tick(st) {
  if (!st.root.isConnected) { stopStage(st.name); return; }
  if (window.__sceneHold) return; // (a test stepping through a scene: leave it be)
  const why = document.hidden ? 'the page is hidden' : document.body.classList.contains('zoom-open') ? 'a card zoomed' : st.quiet() ? '' : st.why?.() || 'not at rest';
  const now = Date.now();
  if (DIAG && (st.name === 'table' || !document.body.classList.contains('in-game'))) {
    note('where', st.name === 'table' ? 'in a game' : 'on a page');
    note('why', (why || (st.scenes.size ? `at rest: ${st.scenes.size} acting, ${used.n} moving (${used.area.toFixed(1)} screens)` : now - st.last < st.idle ? 'touched just now' : 'at rest')) + (calm() ? ` · calm ${calm()} (the phone closed the game today)` : '') + (strained() ? ' · frames slow: calmer for now' : ''));
  }
  if (why) { st.last = now; endAll(st); return; }
  const most = strained() ? Math.min(1, st.max) : [st.max, 1, 0, 0][calm()] ?? 0;
  if (now - st.last < st.idle || now < st.next || st.scenes.size >= most || roomFor('scenes').n < 30) return;
  st.next = now + NEXT[0] + Math.random() * (NEXT[1] - NEXT[0]);
  scene(st).catch((e) => { console.warn('cards alive:', e); note('last', `went wrong: ${e?.message || e}`); });
}

// ── a game ───────────────────────────────────────────────────────────
// `quiet()`: the game at rest (no move playing out, nobody choosing a target).
export function startTableAlive(root, quiet, why = null) {
  startStage('table', { root, quiet, why, idle: 600, max: 2, pick: (st) => pickGame(st, root) });
}
export const stopTableAlive = () => stopStage('table');
// a move is about to play out, or the table to be drawn again: every scene ends now
export function hushTable() {
  const st = stages.get('table');
  if (st) { st.last = Date.now(); endAll(st); }
}
// What the game shows, to act in: full cards in sight (your opening hand, a
// sheet of cards to choose from) act on the card beside them; on a choice's own
// screen (attack, block, tricks) each acts alone; else the table and the card
// raised in your hand.
function pickGame(st, root) {
  const full = shown(root.querySelectorAll('.card[data-id]'), (el) => el.dataset.id);
  if (full.length) { note('seen', `full cards in sight: ${full.length}`); return pickBeside(st, full); }
  const dec = shown(root.querySelectorAll('.g-dec .tcard[data-cid]'), (el) => el.dataset.cid);
  if (dec.length) { note('seen', `cards to choose in sight: ${dec.length}`); const pool = actors(st, dec); return pool.length ? { actor: one(pool) } : null; }
  const onTable = root.querySelectorAll('.g-side .tcard.on-board[data-cid]'), table = shown(onTable, (el) => el.dataset.cid), hand = inHand(root);
  note('seen', `table: ${table.length} of ${onTable.length} in sight · hand: ${hand[0]?.id || 'raised card not in sight'}`);
  return pickAcross(st, table, hand);
}
// The card raised in your hand (the fan's focus), if its picture shows: the
// others lie partly under their neighbours.
function inHand(root) {
  const fan = [...root.querySelectorAll('.tc-hand > .tcard.in-hand[data-cid]')];
  const z = (c) => Number(c.style.getPropertyValue('--z')) || 0;
  const el = fan.find((c) => c.classList.contains('peek')) || fan.reduce((b, c) => (!b || z(c) > z(b) ? c : b), null);
  return el ? shown([el], (c) => c.dataset.cid).map((c) => ({ ...c, side: null, hand: true })) : [];
}

// ── everywhere else: any page's cards (Cards, the draft, the Rules...) ──
// Home's fan has its own scene, and a card opened big its own loop. (Two at
// once at most: a page of a hundred pictures costs Chrome a main-thread frame
// for every frame anything moves.)
export function startScreenAlive() {
  startStage('screen', {
    root: document.body, idle: 600, max: 2, quiet: () => !document.body.classList.contains('in-game'),
    pick: (st) => { const cards = shown(document.querySelectorAll('.card[data-id]'), (el) => el.dataset.id); note('seen', `cards in sight: ${cards.length}`); return pickBeside(st, cards); },
  });
}

// ── who acts on whom ─────────────────────────────────────────────────
// The cards wholly on screen: { el, id, r, side } (side: the table's side it's on).
function onScreen(els, idOf) {
  const vw = innerWidth, vh = innerHeight;
  return [...els].map((el) => ({ el, id: idOf(el), r: el.getBoundingClientRect(), side: el.closest('.g-side') }))
    .filter(({ r }) => r.width > 0 && r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw);
}
// ...and in sight: the middle of its picture not under anything else (a sheet,
// a viewer, the card above it in a fan), and not Home's fan
function shown(els, idOf) {
  return onScreen(els, idOf).filter(({ el }) => {
    if (el.closest('.fan')) return false;
    const a = el.querySelector(ART)?.getBoundingClientRect();
    return !!a && a.width >= 24 && document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2)?.closest('.card, .tcard') === el;
  });
}
const one = (list) => list[Math.floor(Math.random() * list.length)];
const mid = (c) => [c.r.left + c.r.width / 2, c.r.top + c.r.height / 2];
// the cards in a scene now, acting or acted on
const inUse = (st) => new Set([...st.scenes].flatMap((sc) => sc.els));
// the cards that may act: in no scene, and not among the last few to act unless there's no other
function actors(st, cards) {
  const used = inUse(st), can = cards.filter((c) => canAct(c.id) && !used.has(c.el)), fresh = can.filter((c) => !st.recent.includes(c.el));
  return fresh.length ? fresh : can;
}
// a game: mostly one card on the table acting on another, an attacker at a
// card on another side, a support at the card nearest it on its own (a
// defender it reaches blocks, any other card jolts); about one scene in five
// the card raised in your hand, alone (aimed at the table, it would look like
// being played); now and then a table card alone.
function pickAcross(st, cards, hand = []) {
  const used = inUse(st), open = cards.filter((c) => !used.has(c.el)), table = actors(st, cards);
  const hands = hand.filter((c) => canAct(c.id) && !used.has(c.el));
  const raised = hands.find((c) => !st.recent.includes(c.el)) || (table.length ? null : hands[0]);
  const foesOf = (a) => open.filter((c) => c.side !== a.side), matesOf = (a) => open.filter((c) => c.side === a.side && c !== a);
  const reach = table.filter((c) => (PUPPETS[c.id].role === 'attacker' && foesOf(c).length) || (PUPPETS[c.id].role === 'support' && matesOf(c).length));
  const r = Math.random();
  if (raised && (r < 0.2 || !table.length)) return { actor: raised };
  if (reach.length && r < 0.9) {
    const a = one(reach), [ax] = mid(a);
    const target = PUPPETS[a.id].role === 'attacker' ? one(foesOf(a)) : matesOf(a).sort((p, q) => Math.abs(mid(p)[0] - ax) - Math.abs(mid(q)[0] - ax))[0];
    return { actor: a, target };
  }
  return table.length ? { actor: one(table) } : null;
}
// cards in rows (Cards, an opening hand, the draft): mostly an attacker or
// support on the card beside it in its row (either side, if that card is in no
// other scene), sometimes a card alone
function pickBeside(st, cards) {
  const used = inUse(st);
  for (const c of cards) {
    const row = cards.filter((o) => o !== c && Math.abs(o.r.top - c.r.top) < 6);
    const left = row.filter((o) => o.r.right <= c.r.left + 1).sort((a, b) => b.r.right - a.r.right)[0];
    const right = row.filter((o) => o.r.left >= c.r.right - 1).sort((a, b) => a.r.left - b.r.left)[0];
    c.left = left && !used.has(left.el) ? left : null;
    c.right = right && !used.has(right.el) ? right : null;
  }
  const pool = actors(st, cards);
  const reach = pool.filter((c) => ['attacker', 'support'].includes(PUPPETS[c.id].role) && (c.left || c.right));
  if (reach.length && Math.random() < 0.8) {
    const a = one(reach), left = a.left && a.right ? Math.random() < 0.5 : !!a.left;
    return { actor: a, target: left ? a.left : a.right };
  }
  return pool.length ? { actor: one(pool) } : null;
}

// A card's picture: its drawing's units <-> screen px (the drawing cropped to
// fill the frame, as livenArt lays it).
function artBox(card) {
  const f = card.querySelector(ART).getBoundingClientRect(), k = Math.max(f.width / W, f.height / H);
  const x0 = f.left + (f.width - W * k) / 2, y0 = f.top + (f.height - H * k) / 2;
  return { to: ([x, y]) => [x0 + x * k, y0 + y * k], from: ([X, Y]) => [(X - x0) / k, (Y - y0) / k] };
}
const nearestPt = (pts, p) => pts.reduce((b, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(b[0] - p[0], b[1] - p[1]) ? q : b));
// The fixed layer a card is in (the game, a sheet, the draft, a fight shown
// big): its scene's effects go there, above it. Null: the page itself.
function layerOf(el) {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return a;
  return null;
}
// The overlay for scenes' effects in the layer a card is in, one for all the
// scenes there (each is a screen of layer once a glow blends in it); given
// back with letGo() when a scene ends. A fight has its own (`own`).
const overlays = new Map(); // a layer (or the page) -> { el, users }
function overlayFor(el, own = false) {
  const layer = layerOf(el) || document.body;
  const make = () => { const d = document.createElement('div'); d.className = layer === document.body ? 'pp-fx pp-screen' : 'pp-fx pp-in'; layer.append(d); return d; };
  if (own) return make();
  let o = overlays.get(layer);
  if (!o?.el.isConnected) overlays.set(layer, (o = { el: make(), users: 0 }));
  o.users++;
  return o.el;
}
function letGo(over) {
  if (!over) return;
  for (const [layer, o] of overlays) if (o.el === over) { if (--o.users <= 0) { o.el.remove(); overlays.delete(layer); } return; }
  over.remove();
}
// when a move's blow lands, in ms from its start
const impactOf = (m) => m.BEATS?.impact ?? Math.round(m.END * 0.4);

// A card's picture in sprites, laid over the picture it has, its pictures
// loaded first so it shows whole at once; undo() takes it off again. A card
// shown at most 100 px wide (the table, a small fight card) gets the 320 px
// copy of its picture (tools/small-art.py): the same there, under a third of
// the memory (the moving parts are small already).
function inSprites(card, id) {
  const w = card.querySelector(ART)?.getBoundingClientRect().width || 999;
  const base = w <= 100 && /^art\/live\/[\w-]+\.webp/.test(LIVE[id].src) ? LIVE[id].src.replace(/^art\/live\//, 'art/live/s/') : LIVE[id].src;
  const pp = document.createElement('div');
  pp.className = 'pp-art';
  pp.innerHTML = `<img class="art-img" src="${base}" alt="" decoding="async"><div class="sp-art" data-live="${id}"></div>`;
  let undone = false;
  const ready = (async () => {
    const L = await fetchSprites(LIVE[id].live);
    const srcs = [base, ...(L?.sprites || []).filter((s) => s.img).map((s) => s.img)];
    await Promise.all(srcs.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    const art = card.querySelector(ART);
    if (undone || !card.isConnected || !art) return;
    card.classList.add('pp');
    art.append(pp);
    livenArt(card);
  })();
  return { ready, undo() { undone = true; drop(pp.querySelector('.sp-art')); release(pp); pp.remove(); card.classList.remove('pp'); } };
}

// A card taking a blow it doesn't block: a jolt along the blow (`dir`, a unit
// vector from the one that struck), at `at` ms of an END ms scene. A table
// card jolts its .tc-body (the game's own shakes do, never the tilted card).
function jolt(card, END, at, [dx, dy]) {
  const el = card.querySelector('.tc-body') || card;
  const t = (ms) => Math.min(1, Math.max(0, ms / END)), r = dx >= 0 ? 1 : -1;
  const by = (k, deg) => `translate(${(k * dx).toFixed(1)}px, ${(k * dy).toFixed(1)}px) rotate(${(deg * r).toFixed(1)}deg)`;
  return el.animate([
    { transform: 'none', offset: 0 },
    { transform: 'none', offset: t(at) },
    { transform: by(5, 1.2), offset: t(at + 80), easing: 'ease-out' },
    { transform: by(-2, -0.4), offset: t(at + 260), easing: 'ease-in-out' },
    { transform: 'none', offset: t(at + 460) },
    { transform: 'none', offset: 1 },
  ], { duration: END, fill: 'forwards' });
}

async function scene(st) {
  const p = st.pick(st);
  window.__ppPicks?.push(p ? [p.actor.id, p.target?.id ?? null] : null); // (a test noting who acts on whom)
  if (!p) { if (!st.scenes.size) note('last', 'no card here can act'); st.next = Date.now() + 800; return; }
  const who = `${p.actor.id}${p.target ? ` → ${p.target.id}` : ''}`;
  note('last', `${who}: getting ready`);
  st.recent = [p.actor.el, ...st.recent.filter((el) => el !== p.actor.el)].slice(0, 3);
  const sc = { els: [p.actor.el, ...(p.target ? [p.target.el] : [])], swaps: [], moves: [], anims: [], over: null, timer: 0 };
  st.scenes.add(sc);
  const gone = () => !st.scenes.has(sc);
  try {
    const tspec = p.target ? PUPPETS[p.target.id] || {} : null;
    const blocks = !!(p.target && tspec.role === 'defender' && canAct(p.target.id));
    sc.swaps.push(inSprites(p.actor.el, p.actor.id));
    if (blocks) sc.swaps.push(inSprites(p.target.el, p.target.id));
    await Promise.all(sc.swaps.map((s) => s.ready));
    if (gone()) return;
    sc.over = overlayFor(p.actor.el);
    // where the other card is, in the actor's drawing (and the actor in the other's): measured once, first
    let aim = null, from = null, dir = [0, 0];
    if (p.target) {
      const A = artBox(p.actor.el), T = artBox(p.target.el);
      aim = A.from(T.to(tspec.hit || tspec.guard?.[0] || [W / 2, H / 2]));
      from = T.from(A.to([W / 2, H / 2]));
      const [ax, ay] = mid(p.actor), [tx, ty] = mid(p.target), d = Math.hypot(tx - ax, ty - ay) || 1;
      dir = [(tx - ax) / d, (ty - ay) / d];
    }
    const a = await build(p.actor.id, p.actor.el, sc.over, { aim });
    if (gone() || !a) { dropMove(a); endScene(st, sc); return; }
    sc.moves.push(a);
    const impact = impactOf(a);
    let b = null;
    if (blocks) {
      b = await build(p.target.id, p.target.el, sc.over, { blows: [{ at: impact, to: nearestPt(tspec.guard?.length ? tspec.guard : [tspec.hit || [W / 2, H / 2]], from) }] });
      if (gone()) { dropMove(b); return; }
      if (b) sc.moves.push(b);
    }
    await settle([sc.over, p.actor.el, ...(b ? [p.target.el] : [])]);
    if (gone()) return;
    // what it would set moving, fitted into the room the other scenes leave
    const f = fit(sc.moves, roomFor('scenes'), { more: p.target && !b ? [p.target.el.querySelector('.tc-body') || p.target.el] : [], idle: idleOf(p.actor.el, b && p.target.el), what: 'scene' });
    if (!f.fits) { note('last', `${who}: held back, no room (${used.n} moving already)`); endScene(st, sc); st.next = Date.now() + 1200; return; }
    sc.cost = f;
    used.area += f.area; used.n += f.n;
    // all from one start
    for (const m of sc.moves) play(m);
    watchFrames(Math.max(...sc.moves.map((m) => m.END)));
    if (p.target && !b) sc.anims.push(jolt(p.target.el, a.END, impact, dir));
    note('last', `${who}: playing`);
    sc.timer = setTimeout(() => endScene(st, sc), Math.max(...sc.moves.map((m) => m.END)) + 150);
  } catch (e) { endScene(st, sc); throw e; }
}

function endScene(st, sc) {
  if (!st.scenes.delete(sc)) return;
  if (sc.cost) { used.area = Math.max(0, used.area - sc.cost.area); used.n = Math.max(0, used.n - sc.cost.n); }
  clearTimeout(sc.timer);
  for (const m of sc.moves) dropMove(m);
  for (const x of sc.anims) x.cancel();
  letGo(sc.over);
  for (const s of sc.swaps) s.undo();
  if (!st.scenes.size) st.next = Math.min(st.next, Date.now()); // (the next one straight away)
}
function endAll(st) { for (const sc of [...st.scenes]) endScene(st, sc); }

// ── a real fight: each striker's own move ────────────────────────────
// A creature that strikes plays its own move aimed at what it strikes (a
// card, or a player's plate or bar) instead of charging into it, and the blow
// lands (`land()`: the game's own hit and number) at its move's impact beat.
// Two striking each other both play at once, each aimed at the other; a
// defender among them (its move only blocks) blocks the other's blow and
// strikes back as it lands.
// `blows`: [{ from, to, land }]. Resolves true once every blow has landed and
// a moment has passed (the moves play on and clear themselves away), or false,
// with nothing landed, when a striker has no move that aims (or Reduce Motion
// is on) or its move isn't ready in time: the game charges as it always did.
const fighting = new Map(); // a card in a fight -> what ends that fight
// The deaths after a fight's blows are the game's heaviest moment on a phone:
// the strikers' moves (playing on after their blows) end first.
export function endFights() { for (const end of new Set(fighting.values())) end(); }
const idOf = (el) => el?.dataset.cid || el?.dataset.id;
const aims = (id) => canAct(id) && ['attacker', 'support'].includes(PUPPETS[id].role);
const guards = (id) => canAct(id) && PUPPETS[id].role === 'defender';
// where a blow lands: a card's own hit point (in its picture), else the middle of it
function hitPoint(el) {
  const spec = PUPPETS[idOf(el)];
  if (spec && el.querySelector(ART)) return artBox(el).to(spec.hit || spec.guard?.[0] || [W / 2, H / 2]);
  const r = el.getBoundingClientRect();
  return [r.left + r.width / 2, r.top + r.height / 2];
}
// A card too small for its move to show rises (in front of the rest) to about
// a hundred px across while it strikes; down() lets it back. Null: big enough.
function rise(card, speed = 1) {
  const w = card.querySelector(ART)?.getBoundingClientRect().width || 0, k = Math.min(1.8, 96 / Math.max(1, w));
  if (k < 1.12) return null;
  card.classList.add('pp-up');
  const a = card.animate([{ scale: 1 }, { scale: k }], { duration: 220 / speed, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'forwards' });
  return {
    up: a.finished.catch(() => {}),
    down() {
      const b = card.animate([{ scale: k }, { scale: 1 }], { duration: 200 / speed, easing: 'ease-in-out', fill: 'forwards' });
      a.cancel();
      b.finished.catch(() => {}).then(() => { b.cancel(); card.classList.remove('pp-up'); });
    },
  };
}
// cards about to fight (their elements, or ids): their moves, textures and parts fetched ahead
export function readyToFight(cards) {
  for (const id of new Set([...cards].map((c) => (typeof c === 'string' ? c : idOf(c))))) {
    if (!id || !canAct(id)) continue;
    moveOf(id).then((mod) => mod && artOf(id, mod)).catch(() => {});
    Promise.resolve(fetchSprites(LIVE[id].live)).catch(() => {});
  }
}
export async function fight(blows, { wait = 1600 } = {}) {
  if (isReduced() || calm() >= 2 || !blows.length || blows.some(({ from, to }) => !from?.isConnected || !to?.isConnected || !from.querySelector(ART))) return false;
  const plan = blows.map((b) => {
    const id = idOf(b.from), back = blows.find((o) => o.from === b.to && o.to === b.from);
    if (aims(id)) return { ...b, id, how: 'aim' };
    return back && guards(id) && aims(idOf(back.from)) ? { ...b, id, how: 'guard', back } : null;
  });
  if (plan.some((x) => !x)) return false;
  hushTable();
  for (const b of plan) fighting.get(b.from)?.();
  const speed = getSpeed();
  const over = overlayFor(plan[0].from, true);
  over.classList.add('pp-fight');
  over.style.zIndex = '60'; // (over the two in the spotlight, and a card charging)
  const swaps = plan.map((b) => inSprites(b.from, b.id));
  // a small card (the table's) rises to strike, so its move shows
  const ups = plan.map((b) => rise(b.from, speed));
  let moves = [], timer = 0, watch = 0, ended = false, cost = null;
  const end = () => {
    if (ended) return;
    ended = true;
    if (cost) { used.area = Math.max(0, used.area - cost.area); used.n = Math.max(0, used.n - cost.n); }
    clearTimeout(timer); clearInterval(watch);
    for (const m of moves) dropMove(m);
    over.remove();
    for (const s of swaps) s.undo();
    for (const u of ups) u?.down();
    for (const b of plan) if (fighting.get(b.from) === end) fighting.delete(b.from);
  };
  for (const b of plan) fighting.set(b.from, end);
  // the strikers' moves aimed first, then a defender's, blocking the blow at it
  const making = (async () => {
    await Promise.all([...swaps.map((s) => s.ready), ...ups.map((u) => u?.up)]);
    const made = new Map();
    for (const b of plan) if (b.how === 'aim' && !ended) made.set(b, await build(b.id, b.from, over, { aim: artBox(b.from).from(hitPoint(b.to)) }));
    for (const b of plan) {
      if (b.how !== 'guard' || ended) continue;
      const m = made.get(plan.find((x) => x.from === b.back.from)), spec = PUPPETS[b.id];
      const from = artBox(b.from).from(hitPoint(b.to));
      made.set(b, m ? await build(b.id, b.from, over, { blows: [{ at: impactOf(m), to: nearestPt(spec.guard?.length ? spec.guard : [spec.hit || [W / 2, H / 2]], from) }] }) : null);
    }
    return made;
  })();
  const made = await Promise.race([making, sleep(wait).then(() => null)]);
  if (!made || ended || made.size < plan.length || [...made.values()].some((m) => !m)) {
    making.then((mm) => { for (const m of mm?.values() || []) if (!moves.includes(m)) dropMove(m); });
    end();
    return false;
  }
  moves = [...made.values()];
  await settle([over, ...plan.map((b) => b.from)]);
  if (ended) return false;
  // fitted into a fight's room; too much moving even so: the old charge
  const f = fit(moves, roomFor('fight'), { idle: idleOf(...plan.map((b) => b.from)), what: 'fight' });
  if (!f.fits) { note('last', `a fight held back: ${f.n} would move`); end(); return false; }
  cost = f;
  used.area += f.area; used.n += f.n;
  for (const m of moves) { play(m); if (speed !== 1) for (const a of m.anims) a.playbackRate = speed; }
  watchFrames(Math.max(...moves.map((m) => m.END)) / speed);
  timer = setTimeout(end, Math.max(...moves.map((m) => m.END)) / speed + 120);
  watch = setInterval(() => { if (plan.some((b) => !b.from.isConnected)) end(); }, 120);
  // each blow lands at its move's impact; a defender's at the impact of the blow it blocks
  await Promise.all(plan.map((b) => {
    const m = b.how === 'aim' ? made.get(b) : made.get(plan.find((x) => x.from === b.back.from));
    return sleep(impactOf(m) / speed).then(() => { if (b.to.isConnected) { try { b.land?.(); } catch (e) { console.error(e); } } });
  }));
  await sleep(380 / speed);
  return true;
}
