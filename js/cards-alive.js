// Cards acting out their moves in the game (each card's puppet and move, and
// the kit that builds it: js/puppet-kit.js). Two places:
//  - A card opened big (the zoom) plays its move, a moment after it opens and
//    then every few seconds, and rests while it's turned over.
//  - In Cards, while the page is left be, now and then one card acts on the
//    card beside it: an attacker's or a support's move goes to that card,
//    which takes the blow on its guard if it's a defender, or else jolts.
//    Others play on their own. One scene at a time; any touch stops it.
// Never inside a game (an idle card "attacking" could be taken for a move of
// the game: living-cards.md). With Reduce Motion on, nothing plays.

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
// `card`: a .card whose picture is in sprites (its .sp-art); what leaves the
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
  const m = makeKit({ id, mod, art, box, face: card.querySelector('.card-face'), over, aim, blows });
  try { mod.build(m.k); } catch (e) { console.warn(`${id}: its move didn't build`, e); dropMove(m); return null; }
  for (const a of m.anims) a.cancel();
  await Promise.all(m.made.filter((el) => el.tagName === 'IMG').map(loaded));
  return { id, END: m.END, BEATS: mod.BEATS || null, anims: m.anims, made: m.made };
}
const play = (m) => { for (const a of m.anims) { a.cancel(); a.play(); } };
// every picture in `els` decoded, and two frames painted
async function settle(els) {
  await Promise.all(els.flatMap((el) => [...el.querySelectorAll('img')]).map((im) => im.decode().catch(() => {})));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
const halt = (m) => { for (const a of m?.anims || []) a.cancel(); };
function dropMove(m) { halt(m); for (const el of m?.made || []) el.remove(); }

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

// ── Cards: one card acting on the card beside it ─────────────────────
const IDLE = 2000; // ms without a touch before a scene
const GAP = 1600; // ms from one scene's end to the next
let run = null;

export function startCardsAlive(view) {
  stopCardsAlive();
  const grid = view.querySelector('.grid');
  if (!grid || still()) return;
  const st = { grid, last: Date.now(), ended: 0, scene: null, busy: false, lastId: null };
  const touched = () => { st.last = Date.now(); endScene(st); };
  const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'];
  for (const e of evs) window.addEventListener(e, touched, { passive: true, capture: true });
  st.off = () => { for (const e of evs) window.removeEventListener(e, touched, { capture: true }); };
  st.timer = setInterval(() => tick(st), 250);
  run = st;
}
export function stopCardsAlive() {
  if (!run) return;
  const st = run;
  run = null;
  clearInterval(st.timer);
  st.off();
  endScene(st);
}

function tick(st) {
  if (!st.grid.isConnected) { stopCardsAlive(); return; }
  if (window.__sceneHold) return; // (a test stepping through a scene: leave it be)
  if (document.hidden || document.body.classList.contains('zoom-open')) { st.last = Date.now(); endScene(st); return; }
  if (st.scene || st.busy || Date.now() - st.last < IDLE || Date.now() - st.ended < GAP) return;
  st.busy = true;
  scene(st).catch((e) => { console.warn('cards alive:', e); endScene(st); }).finally(() => { st.busy = false; });
}

// The cards wholly on screen, each with the cards beside it in its row.
function onScreen(grid) {
  const vw = innerWidth, vh = innerHeight;
  const cards = [...grid.querySelectorAll('.card[data-id]')].map((el) => ({ el, id: el.dataset.id, r: el.getBoundingClientRect() }))
    .filter(({ r }) => r.top >= 0 && r.bottom <= vh && r.left >= 0 && r.right <= vw);
  for (const c of cards) {
    const row = cards.filter((o) => o !== c && Math.abs(o.r.top - c.r.top) < 6);
    c.left = row.filter((o) => o.r.right <= c.r.left + 1).sort((a, b) => b.r.right - a.r.right)[0] || null;
    c.right = row.filter((o) => o.r.left >= c.r.right - 1).sort((a, b) => a.r.left - b.r.left)[0] || null;
  }
  return cards;
}
const one = (list) => list[Math.floor(Math.random() * list.length)];
// Who acts: mostly an attacker or support on the card beside it (either side),
// sometimes a card on its own; never the same card twice running.
function pick(st) {
  const cards = onScreen(st.grid).filter((c) => canAct(c.id));
  const fresh = cards.filter((c) => c.id !== st.lastId), pool = fresh.length ? fresh : cards;
  const reach = pool.filter((c) => ['attacker', 'support'].includes(PUPPETS[c.id].role) && (c.left || c.right));
  if (reach.length && Math.random() < 0.75) {
    const a = one(reach), side = a.left && a.right ? (Math.random() < 0.5 ? -1 : 1) : a.left ? -1 : 1;
    return { actor: a, target: side < 0 ? a.left : a.right, side };
  }
  return pool.length ? { actor: one(pool) } : null;
}

// A card's picture: its drawing's units <-> screen px (the drawing cropped to
// fill the frame, as livenArt lays it).
function artBox(card) {
  const f = card.querySelector('.c-art').getBoundingClientRect(), k = Math.max(f.width / W, f.height / H);
  const x0 = f.left + (f.width - W * k) / 2, y0 = f.top + (f.height - H * k) / 2;
  return { to: ([x, y]) => [x0 + x * k, y0 + y * k], from: ([X, Y]) => [(X - x0) / k, (Y - y0) / k] };
}
const nearest = (pts, p) => pts.reduce((b, q) => (Math.hypot(q[0] - p[0], q[1] - p[1]) < Math.hypot(b[0] - p[0], b[1] - p[1]) ? q : b));

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
    if (undone || !card.isConnected) return;
    card.classList.add('pp');
    card.querySelector('.c-art').append(pp);
    livenArt(card);
  })();
  return { ready, undo() { undone = true; drop(pp.querySelector('.sp-art')); pp.remove(); card.classList.remove('pp'); } };
}

// A card taking a blow it doesn't block: a jolt away from the blow (dir +1:
// the blow comes from its left), at `at` ms of an END ms scene.
function jolt(card, END, at, dir) {
  const t = (ms) => Math.min(1, Math.max(0, ms / END));
  return card.animate([
    { transform: 'none', offset: 0 },
    { transform: 'none', offset: t(at) },
    { transform: `translateX(${4 * dir}px) rotate(${1.2 * dir}deg)`, offset: t(at + 80), easing: 'ease-out' },
    { transform: `translateX(${-1.5 * dir}px) rotate(${-0.4 * dir}deg)`, offset: t(at + 260), easing: 'ease-in-out' },
    { transform: 'none', offset: t(at + 460) },
    { transform: 'none', offset: 1 },
  ], { duration: END, fill: 'forwards' });
}

async function scene(st) {
  const p = pick(st);
  if (!p) { st.ended = Date.now(); return; }
  st.lastId = p.actor.id;
  const sc = { swaps: [], moves: [], anims: [], over: null, timer: 0 };
  st.scene = sc;
  const gone = () => st.scene !== sc;
  const tspec = p.target ? PUPPETS[p.target.id] || {} : null;
  const blocks = !!(p.target && tspec.role === 'defender' && canAct(p.target.id));
  sc.swaps.push(inSprites(p.actor.el, p.actor.id));
  if (blocks) sc.swaps.push(inSprites(p.target.el, p.target.id));
  await Promise.all(sc.swaps.map((s) => s.ready));
  if (gone()) return;
  sc.over = document.createElement('div');
  sc.over.className = 'pp-fx pp-screen';
  document.body.append(sc.over);
  // where the other card is, in the actor's drawing (and the actor in the other's): measured once, first
  let aim = null, from = null;
  if (p.target) {
    const A = artBox(p.actor.el), T = artBox(p.target.el);
    aim = A.from(T.to(tspec.hit || tspec.guard?.[0] || [W / 2, H / 2]));
    from = T.from(A.to([W / 2, H / 2]));
  }
  const a = await build(p.actor.id, p.actor.el, sc.over, { aim });
  if (gone() || !a) { dropMove(a); if (!gone()) endScene(st); return; }
  sc.moves.push(a);
  const impact = a.BEATS?.impact ?? Math.round(a.END * 0.4);
  let b = null;
  if (blocks) {
    b = await build(p.target.id, p.target.el, sc.over, { blows: [{ at: impact, to: nearest(tspec.guard?.length ? tspec.guard : [tspec.hit || [W / 2, H / 2]], from) }] });
    if (gone()) { dropMove(b); return; }
    if (b) sc.moves.push(b);
  }
  // (every picture decoded and painted before anything moves: a motion started on one that isn't stays on the main thread)
  await settle([sc.over, p.actor.el, ...(b ? [p.target.el] : [])]);
  if (gone()) return;
  // all from one start
  for (const m of sc.moves) play(m);
  if (p.target && !b) sc.anims.push(jolt(p.target.el, a.END, impact, p.side));
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
