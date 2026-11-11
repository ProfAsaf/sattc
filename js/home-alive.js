// Home's fan comes alive while you leave it be (a prototype of cards acting on
// their own, js/art/puppets.js). A second without a touch and a scene plays,
// then another a second after it ends, for as long as you leave it.
//
// The scene, an attack from both sides: Ashmaw swings its head round,
// breathing fire the whole way (a jet sweeping flame along the burning city
// below), rears up to the right and breathes a stream of fire at Seraphine.
// The Barrow Queen glows as she calls up her ghosts, and they leave their card
// and swoop at Seraphine from the other side. She throws up both wings, ablaze
// with light: the left holds back the fire, which piles against it and rolls
// off; the ghosts bounce off the right and tumble home. The cards' edges catch
// (fire at the dragon's and Seraphine's left, ghost-fire at the Queen's and
// Seraphine's right), smoulder, go out and heal. A touch stops it all at once.
//
// Everything moves by transforms and opacity (the compositor's work, as
// js/sprites.js), and every motion of a scene lasts the whole scene (END), its
// own moment written into its keyframes: motions starting and ending at
// moments of their own wake the main thread, dozens of times a second here.
// The fire is pictures painted once in code (js/fx-art.js), many at a time.

import { PUPPETS } from './art/puppets.js';
import { fxArt } from './fx-art.js';

const IDLE = 1000; // ms without a touch before a scene
const GAP = 1000; // ms from one scene's end to the next
const END = 4400; // a scene's length
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let run = null;

// the edges that burn: [side it eats in from, where along it deepest (0-1), what fire]
const BURNS = {
  'ashmaw-L': ['L', 0.62, 'fire'], 'ashmaw-T': ['T', 0.3, 'fire'],
  'seraphine-L': ['L', 0.2, 'fire'], 'seraphine-R': ['R', 0.2, 'spirit'],
  'queen-R': ['R', 0.62, 'spirit'], 'queen-T': ['T', 0.72, 'spirit'],
};

// a card in the fan, a part of its puppet, and px per unit of its drawing
const card = (st, id) => st.fan.querySelector(`.card[data-id="${id}"] .sp-art`);
const part = (box, name) => box?.querySelector(`img.sp[data-part="${name}"]`);
const unit = (box) => (box ? box.offsetWidth / 300 : 1);
// Where an element's box lies on the fan (it may be tilted): a map from
// fractions of its width and height to the fan's px, from three of its corners.
function frame(st, el) {
  const ps = [[0, 0], [1, 0], [0, 1]].map(([x, y]) => {
    const p = document.createElement('i');
    p.style.cssText = `position:absolute;left:${x * 100}%;top:${y * 100}%;width:0;height:0`;
    el.append(p);
    return p;
  });
  const f = st.fan.getBoundingClientRect();
  const [a, b, c] = ps.map((p) => { const r = p.getBoundingClientRect(); return [r.left - f.left, r.top - f.top]; });
  for (const p of ps) p.remove();
  const map = (x, y) => [a[0] + x * (b[0] - a[0]) + y * (c[0] - a[0]), a[1] + x * (b[1] - a[1]) + y * (c[1] - a[1])];
  map.tilt = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  return map;
}

export function startHomeAlive(view) {
  stopHomeAlive();
  const fan = view.querySelector('.fan');
  if (!fan || still()) return;
  const fx = document.createElement('div');
  fx.className = 'fan-fx';
  fan.append(fx);
  const st = { fan, fx, last: Date.now(), ended: 0, count: 0, scene: null, idle: [], paused: true, art: null };
  fxArt(BURNS).then((art) => { st.art = art; });
  const touched = () => { st.last = Date.now(); endScene(st); hold(st, true); };
  const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  for (const e of evs) window.addEventListener(e, touched, { passive: true, capture: true });
  st.off = () => { for (const e of evs) window.removeEventListener(e, touched, { capture: true }); };
  st.timer = setInterval(() => tick(st), 200);
  run = st;
}
export function stopHomeAlive() {
  if (!run) return;
  const st = run;
  run = null;
  clearInterval(st.timer);
  st.off();
  endScene(st);
  for (const a of st.idle) a.cancel();
  st.fx.remove();
}

function tick(st) {
  if (!st.fan.isConnected) { stopHomeAlive(); return; }
  if (window.__sceneHold) return; // (a test recording the scene frame by frame: leave it be)
  if (document.hidden || document.body.classList.contains('zoom-open')) { endScene(st); hold(st, true); return; }
  if (Date.now() - st.last < IDLE) return;
  if (!st.idle.length && !st.scene) stir(st); // (between scenes: the idle motion picks up when one ends)
  hold(st, false);
  if (!st.scene && st.art && Date.now() - st.ended >= GAP) scene(st);
}
function hold(st, on) {
  if (st.paused === on) return;
  st.paused = on;
  for (const a of st.idle) on ? a.pause() : a.play();
}

// ── between scenes: wings beat slowly, ghosts sway ────────────────────
function stir(st) {
  const S = card(st, 'seraphine'), Q = card(st, 'the-barrow-queen');
  const loop = (el, frames, ms, delay = 0) => { if (el) st.idle.push(el.animate(frames, { duration: ms, delay: -delay, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' })); };
  loop(part(S, 'wingL'), [{ transform: 'none' }, { transform: 'rotate(5deg)' }], 2300);
  loop(part(S, 'wingR'), [{ transform: 'none' }, { transform: 'rotate(-5deg)' }], 2300);
  const u = unit(Q);
  for (let i = 0; i < 6; i++) {
    loop(part(Q, `ghost${i}`), [{ transform: 'none' }, { transform: `translateY(${-6 * u}px) rotate(${i < 3 ? -7 : 7}deg)` }], 2400 + i * 230, i * 700);
  }
  if (st.paused) for (const a of st.idle) a.pause();
}

function endScene(st) {
  if (!st.scene) return;
  for (const a of st.scene.anims) a.cancel();
  for (const el of st.scene.els) el.remove();
  clearTimeout(st.scene.done);
  st.scene = null;
  st.ended = Date.now();
}

// The dragon's mouth with its head turned to the right and raised by `up`
// degrees (about the base of its neck), in its drawing's units.
function mouthTurned(up) {
  const [px, py] = PUPPETS.ashmaw.neck, [mx, my] = PUPPETS.ashmaw.mouth, r = (up * Math.PI) / 180;
  const dx = mx - px, dy = my - py;
  return [px - (dx * Math.cos(r) - dy * Math.sin(r)), py + dx * Math.sin(r) + dy * Math.cos(r)];
}
// the ease-in-out curve, cubic-bezier(.42, 0, .58, 1), at x
function easeInOut(x) {
  let t = x;
  for (let i = 0; i < 8; i++) {
    const bx = 3 * (1 - t) ** 2 * t * 0.42 + 3 * (1 - t) * t * t * 0.58 + t ** 3 - x;
    const dx = 3 * (1 - t) ** 2 * 0.42 + 6 * (1 - t) * t * 0.16 + 3 * t * t * 0.42;
    t = Math.min(1, Math.max(0, t - bx / (dx || 1)));
  }
  return 3 * (1 - t) * t * t + t ** 3;
}
// The mouth's x (in its drawing) as the dragon swings its head round (0-900
// ms): the head narrows to a sliver (450) and widens again, mirrored.
function mouthX(ms) {
  const [nx] = PUPPETS.ashmaw.neck, [mx] = PUPPETS.ashmaw.mouth;
  const s = ms < 450 ? 1 - 0.94 * easeInOut(ms / 450) : 0.06 - 1.06 * easeInOut(Math.min(1, (ms - 450) / 450));
  return nx + (mx - nx) * s;
}
// n + 1 points along a curve from s to e, pulled toward c, spaced by `pace`
const arc = (s, c, e, n = 10, pace = (t) => t) => Array.from({ length: n + 1 }, (_, i) => {
  const t = pace(i / n), q = 1 - t;
  return [q * q * s[0] + 2 * q * t * c[0] + t * t * e[0], q * q * s[1] + 2 * q * t * c[1] + t * t * e[1]];
});
const smooth = (t) => t * t * (3 - 2 * t); // (slow, quick, slow)
const bare = ({ offset, easing, ...f }) => f;
const pc = (v) => `${(v * 100).toFixed(3)}%`;
// (a scene's dice: the same throws each time it plays out, a little different each scene)
const dice = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function scene(st) {
  const A = card(st, 'ashmaw'), S = card(st, 'seraphine'), Q = card(st, 'the-barrow-queen');
  const head = part(A, 'head'), breath = part(A, 'breath'), wl = part(S, 'wingL'), wr = part(S, 'wingR'), her = part(S, 'her');
  const ghosts = Array.from({ length: 6 }, (_, i) => part(Q, `ghost${i}`));
  if (!head || !breath || !wl || !wr || !her || ghosts.some((g) => !g)) return; // (the sprites aren't in yet)
  const art = st.art, rand = dice(++st.count), eio = 'ease-in-out';
  // The idle motion gives way: each part starts from the pose it was in and
  // ends at rest, where its idle motion picks up again (two motions on one
  // part at once would put it on the main thread).
  const pose = new Map([wl, wr, ...ghosts].map((el) => [el, getComputedStyle(el).transform]));
  for (const a of st.idle) a.cancel();
  st.idle = [];
  const from = (el) => pose.get(el) || 'none';
  // where things are, on the fan: points of each picture (in its drawing's
  // units) and of each card (in fractions of it)
  const face = (box) => box.closest('.card').querySelector('.card-face');
  const fA = face(A), fS = face(S), fQ = face(Q);
  const mA = frame(st, A), mS = frame(st, S), mQ = frame(st, Q), cA = frame(st, fA), cS = frame(st, fS), cQ = frame(st, fQ);
  const PA = (x, y) => mA(x / 300, y / 210), PS = (x, y) => mS(x / 300, y / 210);
  const uA = unit(A), FW = st.fan.clientWidth, FH = st.fan.clientHeight;
  const inFan = ([x, y]) => x > 3 && x < FW - 3 && y > 3 && y < FH - 3; // (out of sight, a motion would tick on the main thread)

  const anims = [], els = [];
  const add = (host, el) => { host.append(el); els.push(el); return el; };
  // keyframes at moments of the scene, [ms, props, easing of the step after it]
  const K = (list) => list.map(([ms, f, e]) => ({ ...f, offset: ms / END, easing: e || 'linear' }));
  const play = (el, ks) => anims.push(el.animate(ks, { duration: END, fill: 'forwards' }));
  // an effect: unseen until its first moment, and after its last
  const fx = (el, list) => {
    const ks = K(list), a = ks[0], z = ks.at(-1), e = 1 / END;
    if (a.offset > e) ks.unshift({ ...bare(a), opacity: 0, offset: 0 }, { ...bare(a), opacity: 0, offset: a.offset - e });
    if (z.offset < 1 - e) ks.push({ ...bare(z), opacity: 0, offset: z.offset + e }, { ...bare(z), opacity: 0, offset: 1 });
    play(el, ks);
  };
  // a part of a card: as it is until its first moment, and as it ends after its last
  const act = (el, list) => {
    const ks = K(list);
    if (ks[0].offset > 0) ks.unshift({ ...bare(ks[0]), offset: 0 });
    if (ks.at(-1).offset < 1) ks.push({ ...bare(ks.at(-1)), offset: 1 });
    play(el, ks);
  };
  // a painted picture of fire or smoke (art), on the fan at p: centred, standing on its base, or hung from its top
  const pic = (src, [x, y], w, h, { base = false, top = false, lit = true } = {}) => {
    const el = document.createElement('img');
    el.src = art[src]; el.alt = ''; el.className = lit ? 'fx lit' : 'fx';
    el.style.cssText = `left:${(x - w / 2).toFixed(1)}px;top:${(top ? y : y - (base ? h : h / 2)).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;transform-origin:50% ${top ? 0 : base ? 100 : 50}%`;
    return add(st.fx, el);
  };
  // the same inside a card's picture, in its drawing's units (its frame clips it): hung from its top, or standing on its base
  const picIn = (box, src, [x, y], w, h, { base = false, top = false, lit = true } = {}) => {
    const el = document.createElement('img');
    el.src = art[src]; el.alt = ''; el.className = lit ? 'fx lit' : 'fx';
    el.style.cssText = `left:${pc((x - w / 2) / 300)};top:${pc((top ? y : base ? y - h : y - h / 2) / 210)};width:${pc(w / 300)};height:${pc(h / 210)};transform-origin:50% ${top ? 0 : base ? 100 : 50}%`;
    return add(box, el);
  };
  // a glow of light (a gradient, cls), on the fan at p, or in a card's picture
  const light = (cls, [x, y], w, h = w) => {
    const el = document.createElement('i');
    el.className = `fx lit ${cls}`;
    el.style.cssText = `left:${(x - w / 2).toFixed(1)}px;top:${(y - h / 2).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
    return add(st.fx, el);
  };
  const lightIn = (box, cls, [x, y], w, h = w) => {
    const el = document.createElement('i');
    el.className = `fx lit ${cls}`;
    el.style.cssText = `left:${pc((x - w / 2) / 300)};top:${pc((y - h / 2) / 210)};width:${pc(w / 300)};height:${pc(h / 210)}`;
    return add(box, el);
  };
  // a flame catching at `on`, flickering and leaning, and dying down after `off`
  const flicker = (el, on, off) => {
    const list = [[on, { transform: 'translateY(0px) scale(.6, .12) skewX(0deg)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'translateY(0px) scale(1, 1) skewX(0deg)', opacity: 0.95 }, eio]];
    for (let t = on + 120, k = 1; (t += 70 + rand() * 60) < off; k++) {
      const s = k % 2 ? 1 : -1;
      list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) skewX(${(s * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    }
    list.push([off + 260, { transform: 'translateY(0px) scale(.5, .15) skewX(0deg)', opacity: 0 }]);
    fx(el, list);
  };
  // smoke rising from p from `t` on, drifting by dx and up by rise (px), for `ms`
  const smokeUp = (p, t, size, dx, rise, ms) => {
    const r = Math.round(rand() * 360);
    fx(pic('smoke', p, size, size, { lit: false }), [[t, { transform: `translate(0px, 0px) rotate(${r}deg) scale(.5, .5)`, opacity: 0 }, 'ease-out'],
      [t + ms * 0.25, { transform: `translate(${(dx * 0.2).toFixed(1)}px, ${(-rise * 0.25).toFixed(1)}px) rotate(${r + 20}deg) scale(1, 1)`, opacity: 0.5 }],
      [t + ms, { transform: `translate(${dx.toFixed(1)}px, ${(-rise).toFixed(1)}px) rotate(${r + 50}deg) scale(2, 2)`, opacity: 0 }]]);
  };

  // The impact points: Seraphine's left wing, where the fire meets it; her
  // right, where the ghosts do; and the dragon's mouth, reared and turned.
  const W = PS(88, 42), G = PS(190, 46), mouth = PA(...mouthTurned(32));
  const launches = ghosts.map((_, i) => 960 + i * 110), hits = launches.map((t) => t + 800);

  // Smoke first (under all the fire): off the wing, and off the burnt edges.
  for (let k = 0; k < 6; k++) smokeUp([W[0] - 6 - rand() * 16, W[1] - 4 + (rand() - 0.5) * 20], 2050 + k * 170, 30 + rand() * 12, -14 - rand() * 14, 38 + rand() * 18, 1300);
  for (const [map, q, t] of [[cA, 0.55, 2350], [cA, 0.7, 2550], [cA, 0.42, 2750], [cS, 0.18, 2950], [cS, 0.28, 3150]]) {
    const p = map(0.02, q);
    if (inFan(p)) smokeUp(p, t, 26 + rand() * 10, -6 - rand() * 8, 34 + rand() * 14, 1200);
  }

  // ── 1. Ashmaw swings its head round to the right (0-900 ms), breathing
  //       fire the whole way, on the burning city below; rears up (1150) and
  //       breathes a stream at Seraphine (1300-2250). Its fire as drawn dies
  //       down meanwhile, and comes back after.
  const [, my] = PUPPETS.ashmaw.mouth, mx0 = mouthX(0);
  act(head, [[0, { transform: 'none' }, eio], [450, { transform: 'scale(.06, 1.03)' }, eio], [900, { transform: 'scaleX(-1)' }, eio],
    [1150, { transform: 'scaleX(-1) rotate(40deg)' }, eio], [1300, { transform: 'scaleX(-1) rotate(32deg)' }, eio], [2300, { transform: 'scaleX(-1) rotate(32deg)' }, eio],
    [2600, { transform: 'scaleX(-1)' }, eio], [3030, { transform: 'scale(.06, 1.03)' }, eio], [3480, { transform: 'none' }]]);
  act(breath, [[0, { opacity: 1 }, eio], [260, { opacity: 0 }], [3260, { opacity: 0 }, eio], [3700, { opacity: 1 }]]);
  // the city's glow, and smoke going up from it
  fx(lightIn(A, 'g-city', [150, 150], 330, 120), [[60, { opacity: 0 }, 'ease-out'], [450, { opacity: 0.9 }], [1500, { opacity: 0.75 }, eio], [2500, { opacity: 0 }]]);
  for (let k = 0; k < 5; k++) {
    const t = 650 + k * 260, x = 64 + k * 30 + (rand() - 0.5) * 14, r = Math.round(rand() * 360);
    fx(picIn(A, 'smoke', [x, 128], 30, 30, { lit: false }), [[t, { transform: `translate(0px, 0px) rotate(${r}deg) scale(.5, .5)`, opacity: 0 }, 'ease-out'],
      [t + 350, { transform: `translate(${(-3 * uA).toFixed(1)}px, ${(-14 * uA).toFixed(1)}px) rotate(${r + 20}deg) scale(1, 1)`, opacity: 0.55 }],
      [t + 1500, { transform: `translate(${(-10 * uA).toFixed(1)}px, ${(-52 * uA).toFixed(1)}px) rotate(${r + 50}deg) scale(2, 2)`, opacity: 0 }]]);
  }
  // the jet, hanging from its mouth to the ground, swept along with the head
  const jl = [[0, { transform: 'translateX(0px) scale(.7, .4)', opacity: 0 }, 'ease-out']];
  for (let t = 70, k = 0; t <= 840; t += 70, k++) jl.push([t, { transform: `translateX(${((mouthX(t) - mx0) * uA).toFixed(1)}px) scale(${k % 2 ? 0.86 : 1.08}, ${k % 2 ? 1.05 : 0.94})`, opacity: k % 2 ? 0.85 : 0.97 }]);
  jl.push([940, { transform: `translateX(${((mouthX(900) - mx0) * uA).toFixed(1)}px) scale(.7, .5)`, opacity: 0 }]);
  fx(picIn(A, 'jet', [mx0, my + 1], 16, 154 - my, { top: true }), jl);
  // billows of it falling and bursting on the roofs
  const fall = (150 - my - 4) * uA;
  for (let k = 0; k < 14; k++) {
    const t = 30 + k * 60, r = Math.round(rand() * 360), jx = ((rand() - 0.5) * 10 * uA).toFixed(1);
    fx(picIn(A, k < 5 ? 'puffHot' : 'puff', [mouthX(t), my + 4], 15, 15), [[t, { transform: `translate(0px, 0px) rotate(${r}deg) scale(.5, .5)`, opacity: 0 }, 'ease-in'],
      [t + 50, { transform: `translate(0px, ${(fall * 0.12).toFixed(1)}px) rotate(${r + 8}deg) scale(.75, .75)`, opacity: 0.95 }, 'ease-in'],
      [t + 250, { transform: `translate(${jx}px, ${fall.toFixed(1)}px) rotate(${r + 40}deg) scale(1.15, 1.15)`, opacity: 0.9 }, 'ease-out'],
      [t + 400, { transform: `translate(${jx}px, ${(fall + 2 * uA).toFixed(1)}px) rotate(${r + 60}deg) scale(1.9, .8)`, opacity: 0 }]]);
  }
  // and the flames it leaves standing along the city
  for (let k = 0; k < 9; k++) {
    const t = 70 + k * 95;
    flicker(picIn(A, k % 2 ? 'flame' : 'flame2', [mouthX(t) + (rand() - 0.5) * 6, 156], 12 + rand() * 4, 22 + rand() * 12, { base: true }), t + 230, t + 900 + rand() * 300);
  }
  // the fire gathering in its mouth as it rears, blazing while it breathes
  const ml = [[900, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1.25)', opacity: 0.95 }]];
  for (let t = 1300, k = 0; t < 2250; t += 160, k++) ml.push([t, { transform: `scale(${k % 2 ? 1.18 : 0.98})`, opacity: k % 2 ? 0.95 : 0.8 }, eio]);
  ml.push([2250, { transform: 'scale(1.05)', opacity: 0.85 }, 'ease-in'], [2450, { transform: 'scale(.5)', opacity: 0 }]);
  fx(light('g-warm', PA(...mouthTurned(36)), 44), ml);

  // ── 2. The stream: billow after billow along an arc to her left wing, a
  //       white-hot core near the mouth, piling against the wing and rolling
  //       off it, back and up, as smoke.
  const C = [(mouth[0] + W[0]) / 2, Math.max(10, Math.min(mouth[1], W[1]) - 26)];
  const bz = (t) => { const q = 1 - t; return [q * q * mouth[0] + 2 * q * t * C[0] + t * t * W[0], q * q * mouth[1] + 2 * q * t * C[1] + t * t * W[1]]; };
  const tan = (t) => { const dx = 2 * (1 - t) * (C[0] - mouth[0]) + 2 * t * (W[0] - C[0]), dy = 2 * (1 - t) * (C[1] - mouth[1]) + 2 * t * (W[1] - C[1]), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
  const into = tan(1), dir = (p) => { const [tx, ty] = tan(p); return (Math.atan2(ty, tx) * 180) / Math.PI; };
  // a point of the stream, `side` of its middle: a billow there, drawn out along it by `stretch`
  const along = (p, side, s, rot, o, stretch = 1) => {
    const [x, y] = bz(p), [tx, ty] = tan(p), off = side * (1 + 6 * p);
    return { transform: `translate(${(x - mouth[0] - ty * off).toFixed(1)}px, ${(y - mouth[1] + tx * off).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(s * stretch).toFixed(2)}, ${(s / Math.sqrt(stretch)).toFixed(2)})`, opacity: o };
  };
  // the breath leaving its mouth: a cone of flame along the stream's first stretch
  const ca = dir(0.15) - 90, cl = [[1240, { transform: `rotate(${ca.toFixed(1)}deg) scale(.6, .3)`, opacity: 0 }, 'ease-out']];
  for (let t = 1330, k = 0; t < 2250; t += 70, k++) cl.push([t, { transform: `rotate(${(ca + (rand() - 0.5) * 6).toFixed(1)}deg) scale(${k % 2 ? 0.88 : 1.08}, ${k % 2 ? 1.06 : 0.93})`, opacity: k % 2 ? 0.86 : 0.97 }, eio]);
  cl.push([2250, { transform: `rotate(${ca.toFixed(1)}deg) scale(.95, .85)`, opacity: 0.9 }, 'ease-in'], [2420, { transform: `rotate(${ca.toFixed(1)}deg) scale(.6, .3)`, opacity: 0 }]);
  fx(pic('jet', mouth, 15, Math.hypot(W[0] - mouth[0], W[1] - mouth[1]) * 0.55, { top: true }), cl);
  // billow after billow along it, drawn out by their speed, then thrown off the
  // wing sideways along it (it holds), and rising
  for (let k = 0; k < 18; k++) {
    const t = 1300 + k * 52, side = (rand() - 0.5) * 2, j = (rand() - 0.5) * 30, sp = rand() < 0.5 ? -1 : 1;
    const a = (k % 2 ? 1 : -1) * (1 + rand() * 0.75), bx = -into[0], by = -into[1], dx = bx * Math.cos(a) - by * Math.sin(a), dy = bx * Math.sin(a) + by * Math.cos(a);
    const wx = W[0] - mouth[0], wy = W[1] - mouth[1], ra = dir(1) + j;
    fx(pic(k % 2 ? 'puffCool' : 'puff', mouth, 27, 27), [[t, along(0, side, 0.4, dir(0) + j, 0, 1.5), 'ease-out'], [t + 50, along(0.2, side, 0.55, dir(0.2) + j, 0.95, 1.5)],
      [t + 110, along(0.4, side, 0.68, dir(0.4) + j, 0.9, 1.5)], [t + 190, along(0.6, side, 0.8, dir(0.6) + j, 0.86, 1.5)], [t + 290, along(0.8, side, 0.92, dir(0.8) + j, 0.82, 1.45)],
      [t + 400, along(1, side, 1.05, ra, 0.78, 1.3), 'ease-out'],
      [t + 540, { transform: `translate(${(wx + dx * 16).toFixed(1)}px, ${(wy + dy * 16 - 5).toFixed(1)}px) rotate(${(ra + sp * 40).toFixed(1)}deg) scale(1.45, 1.15)`, opacity: 0.62 }, 'ease-out'],
      [t + 740, { transform: `translate(${(wx + dx * 30).toFixed(1)}px, ${(wy + dy * 30 - 16).toFixed(1)}px) rotate(${(ra + sp * 70).toFixed(1)}deg) scale(1.7, 1.5)`, opacity: 0 }]]);
  }
  for (let k = 0; k < 10; k++) {
    const t = 1300 + k * 95, side = (rand() - 0.5) * 1.2, r = Math.round(rand() * 360);
    fx(pic('puffHot', mouth, 24, 24), [[t, along(0, side, 0.3, r, 0), 'ease-out'], [t + 60, along(0.25, side, 0.55, r + 20, 0.95)], [t + 150, along(0.5, side, 0.7, r + 40, 0.85)], [t + 260, along(0.72, side, 0.8, r + 60, 0)]]);
  }
  // fire clinging to the wing, spread along it from where it hits
  const P0 = PS(144, 80), span = [W[0] - P0[0], W[1] - P0[1]];
  for (let k = 0; k < 9; k++) {
    const s = 0.72 + k * 0.09, p = [P0[0] + span[0] * s - into[0] * 3, P0[1] + span[1] * s - into[1] * 3 + 4];
    if (inFan(p)) flicker(pic(k % 2 ? 'flame' : 'flame2', p, 13 + rand() * 5, 20 + rand() * 12, { base: true }), 1720 + 380 * Math.abs(s - 1) + rand() * 60, 2620 + rand() * 180);
  }
  // the light where it hits, beating with the blows, and sparks
  const il = [[1650, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1740, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = 1860, k = 0; t < 2600; t += 120, k++) il.push([t, { transform: `scale(${k % 2 ? 1.12 : 0.95})`, opacity: k % 2 ? 0.95 : 0.75 }, eio]);
  il.push([2900, { transform: 'scale(.7)', opacity: 0 }]);
  fx(light('g-warm', W, 62), il);
  const spark = (cls, p, t, ang, d) => {
    const el = document.createElement('i');
    el.className = `lit ${cls}`;
    el.style.cssText = `left:${p[0].toFixed(1)}px;top:${p[1].toFixed(1)}px`;
    fx(add(st.fx, el), [[t, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, 'ease-out'], [t + 650, { transform: `translate(${(Math.cos(ang) * d).toFixed(1)}px, ${(Math.sin(ang) * d).toFixed(1)}px) scale(.3)`, opacity: 0 }]]);
  };
  for (let k = 0; k < 9; k++) spark('ff-spark', W, 1800 + k * 95, Math.PI + (rand() - 0.5) * 2.6, 18 + rand() * 18);

  // ── 3. The Queen glows as she calls up her court; the ghosts leave their
  //       card (960 ms on, one after another) and swoop at Seraphine from
  //       the right, bounce off her wing, tumbling, and go home.
  const pulse = (base, peak, s0, s1) => launches.flatMap((t) => [[t, { transform: `scale(${s0})`, opacity: base }, 'ease-out'], [t + 45, { transform: `scale(${s1})`, opacity: peak }, 'ease-in']]);
  fx(lightIn(Q, 'g-aura', [150, 96], 210), [[150, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.6 }], ...pulse(0.6, 0.95, 1, 1.1),
    [1700, { transform: 'scale(1)', opacity: 0.65 }], [2600, { transform: 'scale(1)', opacity: 0.55 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(lightIn(Q, 'g-violet', [150, 48], 46), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1)', opacity: 0.8 }], ...pulse(0.8, 1, 1, 1.35),
    [1750, { transform: 'scale(1)', opacity: 0.8 }], [2600, { transform: 'scale(1)', opacity: 0.6 }, eio], [3400, { transform: 'scale(.6)', opacity: 0 }]]);
  fx(lightIn(Q, 'g-violet', [187, 76], 34), [[600, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }], ...pulse(0.7, 1, 1, 1.5),
    [1750, { transform: 'scale(1)', opacity: 0.7 }], [2300, { transform: 'scale(.6)', opacity: 0 }]]);
  const tq = mQ.tilt, f = st.fan.getBoundingClientRect();
  ghosts.forEach((g, i) => {
    const t0 = launches[i], hit = hits[i], reb = hit + 430, home = reb + 900, gone = home + 120;
    const r = g.getBoundingClientRect(), s = [r.left + r.width / 2 - f.left, r.top + r.height / 2 - f.top], w = g.offsetWidth, h = g.offsetHeight;
    const flip = i < 3 ? -1 : 1; // (the three facing their Queen turn round to face Seraphine)
    // On the card it settles, and is gone the moment its double (free of the
    // card's frame) takes off from the same place; back as the double lands.
    act(g, [[0, { transform: from(g), opacity: 1 }, eio], [t0, { transform: 'none', opacity: 1 }], [t0 + 80, { transform: 'none', opacity: 0 }], [home, { transform: 'none', opacity: 0 }], [gone, { transform: 'none', opacity: 1 }]]);
    const c = document.createElement('img');
    c.className = 'ff-ghost';
    c.src = g.currentSrc || g.src;
    c.style.cssText = `left:${s[0] - w / 2}px;top:${s[1] - h / 2}px;width:${w}px;height:${h}px`;
    add(st.fx, c);
    const tf = ([x, y], rot, sx, sy) => `translate(${(x - s[0]).toFixed(1)}px, ${(y - s[1]).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
    const P = [G[0] + 6, G[1] + (i - 2.5) * 5], k0 = 0.824;
    const list = arc(s, [s[0] - 6 - i * 3, s[1] - 26 - (i % 3) * 6], P, 8, smooth).map((p, j) => [t0 + j * 100, { transform: tf(p, tq - j * 2.5, (j ? flip : 1) * (1 - j * 0.022), 1 - j * 0.022), opacity: 1 }]);
    // the blow: squashed against the wing, then knocked back, tumbling
    const R = [P[0] + 44 + (i % 3) * 8, P[1] - 30 + (i - 2.5) * 6];
    list.push([hit + 50, { transform: tf([P[0] - 2, P[1]], tq - 20, flip * k0 * 0.68, k0 * 1.22), opacity: 1 }, 'cubic-bezier(.15,.7,.35,1)']);
    list.push([reb, { transform: tf(R, tq + 200, flip * k0, k0), opacity: 0.95 }]);
    // and home, righting itself on the way
    arc(R, [(R[0] + s[0]) / 2 + 8, Math.min(R[1], s[1]) - 34], s, 6, smooth).slice(1).forEach((p, j) => {
      const q = (j + 1) / 6, k = k0 + (1 - k0) * q;
      list.push([reb + q * 900, { transform: tf(p, tq + 200 + 160 * q, (flip + (1 - flip) * q) * k, k), opacity: 1 }]);
    });
    list.push([gone, { transform: tf(s, tq + 360, 1, 1), opacity: 0 }]);
    fx(c, list);
    // breaking against her wing in violet light
    fx(light('g-violet', P, 56), [[hit, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [hit + 90, { transform: 'scale(1)', opacity: 0.95 }, 'ease-out'], [hit + 520, { transform: 'scale(1.7)', opacity: 0 }]]);
    spark('ff-spark violet', P, hit, (rand() - 0.5) * 2.4, 16 + rand() * 14);
    spark('ff-spark violet', P, hit + 40, (rand() - 0.5) * 2.4, 16 + rand() * 14);
  });

  // ── 4. Seraphine throws up both wings (1350-1700), ablaze with light: the
  //       left strains against the fire, the right is struck by each ghost;
  //       she braces, and lets them down (2800-3500).
  const raise = (el, deg, jolts) => [[0, { transform: from(el) }], [1350, { transform: from(el) }, eio], [1700, { transform: `rotate(${deg}deg)` }, eio],
    ...jolts.map(([t, d]) => [t, { transform: `rotate(${d}deg)` }, eio]), [2800, { transform: `rotate(${deg}deg)` }, eio], [3500, { transform: 'none' }]];
  const left = raise(wl, 20, [[1820, 18.4], [1940, 20.4], [2060, 18.6], [2180, 20.3], [2300, 18.8], [2420, 20.2], [2540, 19], [2660, 20]]);
  const right = raise(wr, -20, [...hits.flatMap((t) => [[t, -20], [t + 45, -16.8]]), [hits.at(-1) + 150, -20]]);
  act(wl, left);
  act(wr, right);
  // each blazing: a glowing copy of it, moving with it (the same keyframes)
  const blaze = (img, list) => {
    const c = img.cloneNode();
    c.removeAttribute('data-part');
    c.removeAttribute('data-i');
    c.className = 'fx-wing';
    img.after(c);
    els.push(c);
    act(c, list.map(([t, fr, e], k) => [t, { ...fr, opacity: t < 1700 ? 0 : t >= 3500 ? 0 : t >= 2800 ? 0.55 : k % 2 ? 0.95 : 0.78 }, e]));
  };
  blaze(wl, left);
  blaze(wr, right);
  act(her, [[1800, { transform: 'none' }, eio], [2070, { transform: 'translateY(-1%) rotate(-2deg)' }, eio], [2700, { transform: 'none' }]]);

  // ── 5. The edges catch: scorched in from the side (from t0 to t1), the
  //       burn's front smouldering, flames along it; out (from `out`); then
  //       the card heals (from `heal` to `whole`), a light passing along it.
  const edge = (fc, map, name, t0, t1, out, heal, whole, n) => {
    const [side, hot, kind] = BURNS[name], spirit = kind === 'spirit', vert = side !== 'T';
    const Wf = fc.offsetWidth, Hf = fc.offsetHeight, bw = vert ? Wf * 0.13 : Wf, bh = vert ? Hf : Hf * 0.09;
    const band = document.createElement('div');
    band.className = 'fx-band';
    band.style.cssText = `${side === 'R' ? 'right' : 'left'}:0;top:0;width:${bw.toFixed(1)}px;height:${bh.toFixed(1)}px`;
    for (const what of ['char', 'glow']) {
      const im = document.createElement('img');
      im.src = art[`${name}:${what}`]; im.alt = ''; im.className = what === 'glow' ? 'lit' : '';
      band.append(im);
    }
    add(fc, band);
    // (it starts all but outside the card, and slides in: never quite out of
    // sight, which would put its motion on the main thread)
    const d = side === 'L' ? [-0.95 * bw, 0] : side === 'R' ? [0.95 * bw, 0] : [0, -0.95 * bh];
    act(band, [[t0, { transform: `translate(${d[0].toFixed(1)}px, ${d[1].toFixed(1)}px)` }, 'cubic-bezier(.25,.6,.45,1)'], [t1, { transform: 'translate(0px, 0px)' }]]);
    const [ch, gl] = band.children;
    act(ch, [[heal, { opacity: 1 }, eio], [whole, { opacity: 0 }]]);
    const gs = [[t0, { opacity: 0.9 }]];
    for (let t = t0 + 110, k = 0; t < out; t += 90 + rand() * 70, k++) gs.push([t, { opacity: k % 2 ? 1 : 0.72 }, eio]);
    gs.push([out, { opacity: 1 }, 'ease-in'], [out + 450, { opacity: 0 }]);
    act(gl, gs);
    // flames along it, catching as the burn reaches them
    for (let k = 0; k < n; k++) {
      const q = Math.min(0.94, Math.max(0.06, hot + (k - (n - 1) / 2) * 0.075 + (rand() - 0.5) * 0.03)), p = side === 'L' ? map(0.012, q) : side === 'R' ? map(0.988, q) : map(q, 0.012);
      if (!inFan(p)) continue;
      const src = spirit ? (k % 2 ? 'spiritFlame' : 'spiritFlame2') : k % 2 ? 'flame' : 'flame2';
      const big = 1 - Math.min(1, Math.abs(q - hot) * 5) * 0.45;
      flicker(pic(src, p, (9 + rand() * 3) * big, (13 + rand() * 9) * big, { base: true }), t0 + (t1 - t0) * Math.min(1, Math.abs(q - hot) * 2.2) + rand() * 120, out - 200 + rand() * 260);
    }
    // the healing light
    const sw = document.createElement('i');
    sw.className = `fx lit g-heal${spirit ? ' spirit' : ''}`;
    const [ew, eh] = vert ? [Wf * 0.34, Hf * 0.22] : [Wf * 0.3, Hf * 0.14];
    sw.style.cssText = `left:${((side === 'R' ? Wf : 0) - ew / 2).toFixed(1)}px;top:${(-eh / 2).toFixed(1)}px;width:${ew.toFixed(1)}px;height:${eh.toFixed(1)}px`;
    add(fc, sw);
    const go = (k) => (vert ? `translate(0px, ${(Hf * k).toFixed(1)}px)` : `translate(${(Wf * k).toFixed(1)}px, 0px)`);
    fx(sw, [[heal, { transform: go(0.04), opacity: 0 }, 'ease-out'], [heal + 160, { transform: go(0.14), opacity: 0.9 }], [whole - 160, { transform: go(0.86), opacity: 0.9 }, 'ease-in'], [whole, { transform: go(0.96), opacity: 0 }]]);
  };
  edge(fA, cA, 'ashmaw-L', 250, 1400, 2350, 3000, 3850, 3);
  edge(fA, cA, 'ashmaw-T', 420, 1500, 2400, 3100, 3950, 2);
  edge(fS, cS, 'seraphine-L', 1760, 2550, 2950, 3350, 4200, 3);
  edge(fS, cS, 'seraphine-R', 1780, 2500, 2850, 3250, 4050, 3);
  edge(fQ, cQ, 'queen-R', 700, 1600, 2400, 2950, 3750, 3);
  edge(fQ, cQ, 'queen-T', 760, 1650, 2450, 3050, 3850, 2);

  st.scene = { anims, els, done: setTimeout(() => { if (!window.__sceneHold) endScene(st); }, END + 100) };
}
