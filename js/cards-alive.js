// Cards acting out their moves in the game (each card's puppet and move, and
// the kit that builds it: js/puppet-kit.js), whenever nothing else happens:
//  - A card opened big (the Cards zoom, a game's viewer) plays its move a
//    moment after it shows, then every few seconds.
//  - In a game at rest (nobody touching, no move playing out, nobody choosing
//    a target), one card at a time acts: on the table an attacker's move goes
//    to a card on another side, a support's to the card nearest it on its own
//    (a defender it reaches blocks, any other card jolts); the card raised in
//    your hand acts alone; full cards in sight (your opening hand, a sheet of
//    cards) act on the card beside them; on an attack or block screen each
//    card acts alone.
//  - Everywhere else (Cards, the draft, the Rules), the cards in sight act on
//    the card beside them.
// Any touch ends a scene, and so does any move of the game. With Reduce
// Motion on, nothing plays.

import { LIVE } from './art-live.js';
import { PUPPETS } from './art/puppets.js';
import { fxArt } from './fx-art.js';
import { H, W, loaded, makeKit, paint, sleep } from './puppet-kit.js';
import { livenArt } from './render.js';
import { drop, fetchSprites, still } from './sprites.js';

const HOME_ONLY = new Set(['seraphine', 'the-barrow-queen']); // (they act in Home's own scene, js/home-alive.js)
export const canAct = (id) => !!(LIVE[id] && PUPPETS[id] && !HOME_ONLY.has(id)) && !still();

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
// its textures: the shared fire, smoke and gloom (js/fx-art.js) and its own, painted once a page
function artOf(id, mod) {
  if (!arts.has(id)) {
    arts.set(id, (async () => {
      const art = { ...(await fxArt()) };
      for (const [name, [w, h, px]] of Object.entries(mod.textures || {})) { art[name] = paint(w, h, px); await sleep(0); }
      await Promise.all(Object.values(art).map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
      return art;
    })());
  }
  return arts.get(id);
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
  const m = makeKit({ id, mod, art, box, face, over, aim, blows });
  try { mod.build(m.k); } catch (e) { console.warn(`${id}: its move didn't build`, e); note('last', `${id}: its move broke: ${e?.message || e}`); dropMove(m); return null; }
  for (const a of m.anims) a.cancel();
  await Promise.all(m.made.filter((el) => el.tagName === 'IMG').map(loaded));
  return { id, END: m.END, BEATS: mod.BEATS || null, anims: m.anims, made: m.made };
}
const play = (m) => { for (const a of m.anims) { a.cancel(); a.play(); } };
const halt = (m) => { for (const a of m?.anims || []) a.cancel(); };
function dropMove(m) { halt(m); for (const el of m?.made || []) el.remove(); }
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
    for (let first = true; st.on && m; first = false) {
      await nap(first ? 500 : 1500);
      if (!st.on) break;
      if (st.paused || document.hidden) continue;
      play(m);
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
    if (m) await settle([over, card]);
    for (let first = true; st.on && m; first = false) {
      await nap(first ? 300 : 1200);
      if (!st.on) break;
      if (document.hidden) continue;
      play(m);
      await nap(m.END + 100);
      halt(m);
    }
  })();
  return { stop() { st.on = false; st.wake?.(); dropMove(st.m); over.remove(); swap.undo(); } };
}

// ── a stage: one card acting at a time, while nothing else happens ──
// A game and the rest of the app are stages, each with its own cards and its
// own way of choosing who acts on whom. A scene starts once the stage has been
// quiet (no touch, and its own quiet()) for `idle` ms.
const GAP = 1000; // ms from one scene's end to the next
const ART = '.tc-art, .c-art'; // (a card's picture: a table card's, or a full card's)
const stages = new Map();

function startStage(name, o) {
  stopStage(name);
  if (still()) return;
  const st = { ...o, name, last: Date.now(), ended: 0, scene: null, busy: false, lastEl: null };
  const touched = () => { st.last = Date.now(); endScene(st); };
  const evs = ['pointerdown', 'pointerup', 'keydown', 'wheel', 'touchstart', 'scroll'];
  for (const e of evs) window.addEventListener(e, touched, { passive: true, capture: true });
  st.off = () => { for (const e of evs) window.removeEventListener(e, touched, { capture: true }); };
  st.timer = setInterval(() => tick(st), 250);
  stages.set(name, st);
}
function stopStage(name) {
  const st = stages.get(name);
  if (!st) return;
  stages.delete(name);
  clearInterval(st.timer);
  st.off();
  endScene(st);
}
function tick(st) {
  if (!st.root.isConnected) { stopStage(st.name); return; }
  if (window.__sceneHold) return; // (a test stepping through a scene: leave it be)
  const why = document.hidden ? 'the page is hidden' : document.body.classList.contains('zoom-open') ? 'a card zoomed' : st.quiet() ? '' : st.why?.() || 'not at rest';
  if (DIAG && (st.name === 'table' || !document.body.classList.contains('in-game'))) {
    note('where', st.name === 'table' ? 'in a game' : 'on a page');
    note('why', why || (st.scene ? 'at rest: a card acting' : Date.now() - st.last < st.idle ? 'touched just now' : 'at rest'));
  }
  if (why) { st.last = Date.now(); endScene(st); return; }
  if (st.scene || st.busy || Date.now() - st.last < st.idle || Date.now() - st.ended < GAP) return;
  st.busy = true;
  scene(st).catch((e) => { console.warn('cards alive:', e); note('last', `went wrong: ${e?.message || e}`); endScene(st); }).finally(() => { st.busy = false; });
}

// ── a game ───────────────────────────────────────────────────────────
// `quiet()`: the game at rest (no move playing out, nobody choosing a target).
export function startTableAlive(root, quiet, why = null) {
  startStage('table', { root, quiet, why, idle: 1000, pick: (st) => pickGame(st, root) });
}
export const stopTableAlive = () => stopStage('table');
// a move is about to play out, or the table to be drawn again: any scene ends now
export function hushTable() {
  const st = stages.get('table');
  if (st) { st.last = Date.now(); endScene(st); }
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
// Home's fan has its own scene, and a card opened big its own loop.
export function startScreenAlive() {
  startStage('screen', {
    root: document.body, idle: 1000, quiet: () => !document.body.classList.contains('in-game'),
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
// the cards that may act: not the one that acted last, unless it's the only one
function actors(st, cards) {
  const can = cards.filter((c) => canAct(c.id)), fresh = can.filter((c) => c.el !== st.lastEl);
  return fresh.length ? fresh : can;
}
// a game: mostly one card on the table acting on another, an attacker at a
// card on another side, a support at the card nearest it on its own (a
// defender it reaches blocks, any other card jolts); about one scene in five
// the card raised in your hand, alone (aimed at the table, it would look like
// being played); now and then a table card alone.
function pickAcross(st, cards, hand = []) {
  const table = actors(st, cards);
  const raised = hand.find((c) => c.el !== st.lastEl && canAct(c.id)) || (table.length ? null : hand.find((c) => canAct(c.id)));
  const foesOf = (a) => cards.filter((c) => c.side !== a.side), matesOf = (a) => cards.filter((c) => c.side === a.side && c !== a);
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
// support on the card beside it in its row (either side), sometimes a card alone
function pickBeside(st, cards) {
  for (const c of cards) {
    const row = cards.filter((o) => o !== c && Math.abs(o.r.top - c.r.top) < 6);
    c.left = row.filter((o) => o.r.right <= c.r.left + 1).sort((a, b) => b.r.right - a.r.right)[0] || null;
    c.right = row.filter((o) => o.r.left >= c.r.right - 1).sort((a, b) => a.r.left - b.r.left)[0] || null;
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
// The fixed layer a card is in (the game, a sheet, the draft): its scene's
// effects go there, above it. Null: the page itself.
function layerOf(el) {
  for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return a;
  return null;
}

// A card's picture in sprites, laid over the picture it has, its pictures
// loaded first so it shows whole at once; undo() takes it off again.
function inSprites(card, id) {
  const pp = document.createElement('div');
  pp.className = 'pp-art';
  pp.innerHTML = `<img class="art-img" src="${LIVE[id].src}" alt="" decoding="async"><div class="sp-art" data-live="${id}"></div>`;
  let undone = false;
  const ready = (async () => {
    const L = await fetchSprites(LIVE[id].live);
    const srcs = [LIVE[id].src, ...(L?.sprites || []).filter((s) => s.img).map((s) => s.img)];
    await Promise.all(srcs.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    const art = card.querySelector(ART);
    if (undone || !card.isConnected || !art) return;
    card.classList.add('pp');
    art.append(pp);
    livenArt(card);
  })();
  return { ready, undo() { undone = true; drop(pp.querySelector('.sp-art')); pp.remove(); card.classList.remove('pp'); } };
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
  const who = p ? `${p.actor.id}${p.target ? ` → ${p.target.id}` : ''}` : '';
  note('last', p ? `${who}: getting ready` : 'no card here can act');
  if (!p) { st.ended = Date.now(); return; }
  st.lastEl = p.actor.el;
  const sc = { swaps: [], moves: [], anims: [], over: null, timer: 0 };
  st.scene = sc;
  const gone = () => st.scene !== sc;
  const tspec = p.target ? PUPPETS[p.target.id] || {} : null;
  const blocks = !!(p.target && tspec.role === 'defender' && canAct(p.target.id));
  sc.swaps.push(inSprites(p.actor.el, p.actor.id));
  if (blocks) sc.swaps.push(inSprites(p.target.el, p.target.id));
  await Promise.all(sc.swaps.map((s) => s.ready));
  if (gone()) return;
  const layer = layerOf(p.actor.el);
  sc.over = document.createElement('div');
  sc.over.className = layer ? 'pp-fx pp-in' : 'pp-fx pp-screen';
  (layer || document.body).append(sc.over);
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
  if (gone() || !a) { dropMove(a); if (!gone()) endScene(st); return; }
  sc.moves.push(a);
  const impact = a.BEATS?.impact ?? Math.round(a.END * 0.4);
  let b = null;
  if (blocks) {
    b = await build(p.target.id, p.target.el, sc.over, { blows: [{ at: impact, to: nearestPt(tspec.guard?.length ? tspec.guard : [tspec.hit || [W / 2, H / 2]], from) }] });
    if (gone()) { dropMove(b); return; }
    if (b) sc.moves.push(b);
  }
  await settle([sc.over, p.actor.el, ...(b ? [p.target.el] : [])]);
  if (gone()) return;
  // all from one start
  for (const m of sc.moves) play(m);
  if (p.target && !b) sc.anims.push(jolt(p.target.el, a.END, impact, dir));
  note('last', `${who}: playing`);
  sc.timer = setTimeout(() => endScene(st), Math.max(...sc.moves.map((m) => m.END)) + 150);
}

function endScene(st) {
  const sc = st.scene;
  if (!sc) return;
  st.scene = null;
  st.ended = Date.now();
  clearTimeout(sc.timer);
  for (const m of sc.moves) dropMove(m);
  for (const x of sc.anims) x.cancel();
  sc.over?.remove();
  for (const s of sc.swaps) s.undo();
}
