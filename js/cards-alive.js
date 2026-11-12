// Cards acting out their moves in the game (each card's puppet and move, and
// the kit that builds it: js/puppet-kit.js). Three places:
//  - A card opened big (the zoom) plays its move, a moment after it opens and
//    then every few seconds, and rests while it's turned over.
//  - In a game, while nothing else happens (nobody touching, no move playing
//    out, nothing open, nobody choosing), now and then a card on the table
//    acts: an attacker's move goes to a card on another side, a support's to
//    the card nearest it on its own side; a defender it reaches takes the
//    blow on its guard, any other card jolts; often a card acts alone.
//  - In Cards, while the page is left be, one card acts on the card beside it.
// One scene at a time; any touch stops it, and so does any move of the game.
// With Reduce Motion on, nothing plays.

import { LIVE } from './art-live.js';
import { PUPPETS } from './art/puppets.js';
import { fxArt } from './fx-art.js';
import { H, W, loaded, makeKit, paint, sleep } from './puppet-kit.js';
import { livenArt } from './render.js';
import { drop, fetchSprites, still } from './sprites.js';

const HOME_ONLY = new Set(['seraphine', 'the-barrow-queen']); // (they act in Home's own scene, js/home-alive.js)
export const canAct = (id) => !!(LIVE[id] && PUPPETS[id] && !HOME_ONLY.has(id)) && !still();

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
  if (!box?.live) return null;
  await Promise.all([...box.querySelectorAll('img.sp')].map(loaded));
  const mod = await moveOf(id);
  if (!mod) return null;
  const art = await artOf(id, mod);
  if (!card.isConnected || !over.isConnected) return null;
  const face = card.querySelector('.card-face, .tc-face') || card;
  const m = makeKit({ id, mod, art, box, face, over, aim, blows });
  try { mod.build(m.k); } catch (e) { console.warn(`${id}: its move didn't build`, e); dropMove(m); return null; }
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
// A game's table and Cards are stages, each with its own cards, its own way of
// choosing who acts on whom, and its own overlay. A scene starts once the stage
// has been quiet (no touch, and its own quiet()) for `idle` ms.
const GAP = 1000; // ms from one scene's end to the next
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
  if (document.hidden || document.body.classList.contains('zoom-open') || !st.quiet()) { st.last = Date.now(); endScene(st); return; }
  if (st.scene || st.busy || Date.now() - st.last < st.idle || Date.now() - st.ended < GAP) return;
  st.busy = true;
  scene(st).catch((e) => { console.warn('cards alive:', e); endScene(st); }).finally(() => { st.busy = false; });
}

// ── a game's table ───────────────────────────────────────────────────
// `quiet()`: the game at rest (no move playing out, nothing open, nobody choosing).
export function startTableAlive(root, quiet) {
  startStage('table', {
    root, quiet, idle: 1000, art: '.tc-art', overIn: root, overCls: 'pp-fx pp-game',
    joltOf: (el) => el.querySelector('.tc-body') || el, // (the game's own shakes move .tc-body, never the tilted card)
    pick: (st) => pickAcross(st, onScreen(root.querySelectorAll('.g-side .tcard.on-board[data-cid]'), (el) => el.dataset.cid), inHand(root)),
  });
}
// The card raised in your hand (the fan's focus), if its picture shows: the
// others lie partly under their neighbours.
function inHand(root) {
  const fan = [...root.querySelectorAll('.tc-hand > .tcard.in-hand[data-cid]')];
  const z = (c) => Number(c.style.getPropertyValue('--z')) || 0;
  const el = fan.find((c) => c.classList.contains('peek')) || fan.reduce((b, c) => (!b || z(c) > z(b) ? c : b), null);
  const a = el?.querySelector('.tc-art')?.getBoundingClientRect();
  if (!a || a.width < 24 || a.top < 0 || a.bottom > innerHeight || a.left < 0 || a.right > innerWidth) return [];
  const top = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2)?.closest('.tcard');
  return top === el ? [{ el, id: el.dataset.cid, r: el.getBoundingClientRect(), side: null, hand: true }] : [];
}
export const stopTableAlive = () => stopStage('table');
// a move is about to play out, or the table to be drawn again: any scene ends now
export function hushTable() {
  const st = stages.get('table');
  if (st) { st.last = Date.now(); endScene(st); }
}

// ── Cards ────────────────────────────────────────────────────────────
export function startCardsAlive(view) {
  const grid = view.querySelector('.grid');
  if (!grid) { stopStage('cards'); return; }
  startStage('cards', {
    root: grid, quiet: () => true, idle: 1000, art: '.c-art', overIn: document.body, overCls: 'pp-fx pp-screen',
    joltOf: (el) => el,
    pick: (st) => pickBeside(st, onScreen(grid.querySelectorAll('.card[data-id]'), (el) => el.dataset.id)),
  });
}
export const stopCardsAlive = () => stopStage('cards');

// ── who acts on whom ─────────────────────────────────────────────────
// The cards wholly on screen: { el, id, r, side } (side: the table's side it's on).
function onScreen(els, idOf) {
  const vw = innerWidth, vh = innerHeight;
  return [...els].map((el) => ({ el, id: idOf(el), r: el.getBoundingClientRect(), side: el.closest('.g-side') }))
    .filter(({ r }) => r.width > 0 && r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw);
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
  const raised = hand.find((c) => c.el !== st.lastEl) || (table.length ? null : hand[0]);
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
// Cards: mostly an attacker or support on the card beside it in its row (either side), sometimes a card alone
function pickBeside(st, cards) {
  for (const c of cards) {
    const row = cards.filter((o) => o !== c && Math.abs(o.r.top - c.r.top) < 6);
    c.left = row.filter((o) => o.r.right <= c.r.left + 1).sort((a, b) => b.r.right - a.r.right)[0] || null;
    c.right = row.filter((o) => o.r.left >= c.r.right - 1).sort((a, b) => a.r.left - b.r.left)[0] || null;
  }
  const pool = actors(st, cards);
  const reach = pool.filter((c) => ['attacker', 'support'].includes(PUPPETS[c.id].role) && (c.left || c.right));
  if (reach.length && Math.random() < 0.75) {
    const a = one(reach), left = a.left && a.right ? Math.random() < 0.5 : !!a.left;
    return { actor: a, target: left ? a.left : a.right };
  }
  return pool.length ? { actor: one(pool) } : null;
}

// A card's picture (`sel`): its drawing's units <-> screen px (the drawing
// cropped to fill the frame, as livenArt lays it).
function artBox(card, sel) {
  const f = card.querySelector(sel).getBoundingClientRect(), k = Math.max(f.width / W, f.height / H);
  const x0 = f.left + (f.width - W * k) / 2, y0 = f.top + (f.height - H * k) / 2;
  return { to: ([x, y]) => [x0 + x * k, y0 + y * k], from: ([X, Y]) => [(X - x0) / k, (Y - y0) / k] };
}
const nearestPt = (pts, p) => pts.reduce((b, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(b[0] - p[0], b[1] - p[1]) ? q : b));

// A card's picture in sprites, laid over the picture it has (in `sel`), its
// pictures loaded first so it shows whole at once; undo() takes it off again.
function inSprites(card, id, sel) {
  const pp = document.createElement('div');
  pp.className = 'pp-art';
  pp.innerHTML = `<img class="art-img" src="${LIVE[id].src}" alt="" decoding="async"><div class="sp-art" data-live="${id}"></div>`;
  let undone = false;
  const ready = (async () => {
    const L = await fetchSprites(LIVE[id].live);
    const srcs = [LIVE[id].src, ...(L?.sprites || []).filter((s) => s.img).map((s) => s.img)];
    await Promise.all(srcs.map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    const art = card.querySelector(sel);
    if (undone || !card.isConnected || !art) return;
    card.classList.add('pp');
    art.append(pp);
    livenArt(card);
  })();
  return { ready, undo() { undone = true; drop(pp.querySelector('.sp-art')); pp.remove(); card.classList.remove('pp'); } };
}

// A card taking a blow it doesn't block: a jolt along the blow (`dir`, a unit
// vector from the one that struck), at `at` ms of an END ms scene.
function jolt(el, END, at, [dx, dy]) {
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
  if (!p) { st.ended = Date.now(); return; }
  st.lastEl = p.actor.el;
  const sc = { swaps: [], moves: [], anims: [], over: null, timer: 0 };
  st.scene = sc;
  const gone = () => st.scene !== sc;
  const tspec = p.target ? PUPPETS[p.target.id] || {} : null;
  const blocks = !!(p.target && tspec.role === 'defender' && canAct(p.target.id));
  sc.swaps.push(inSprites(p.actor.el, p.actor.id, st.art));
  if (blocks) sc.swaps.push(inSprites(p.target.el, p.target.id, st.art));
  await Promise.all(sc.swaps.map((s) => s.ready));
  if (gone()) return;
  sc.over = document.createElement('div');
  sc.over.className = st.overCls;
  st.overIn.append(sc.over);
  // where the other card is, in the actor's drawing (and the actor in the other's): measured once, first
  let aim = null, from = null, dir = [0, 0];
  if (p.target) {
    const A = artBox(p.actor.el, st.art), T = artBox(p.target.el, st.art);
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
  if (p.target && !b) sc.anims.push(jolt(st.joltOf(p.target.el), a.END, impact, dir));
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
