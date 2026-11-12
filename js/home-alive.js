// Home's fan comes alive while you leave it be (a prototype of cards acting on
// their own, js/art/puppets.js). A second without a touch and a scene plays,
// then another a second after it ends, for as long as you leave it.
//
// The scene, an attack from both sides: Ashmaw swings its head round,
// breathing fire the whole way down on the burning city below, where it
// scorches the ground; it rears up to the right and breathes a stream of fire
// at Seraphine. The Barrow Queen glows as she calls up her ghosts, and they
// leave their card and swoop at Seraphine from the other side, a gloom
// spreading round them. She throws up both wings, their edges lit gold: a
// shield. Fire and ghosts strike the wings' very edges and are thrown back,
// the fire rolling up into smoke, the ghosts tumbling home. The scorches,
// on the dragon's card and on Seraphine's where the fire struck, burn on till
// the dragon's head is back, then go out and heal. A touch stops it all at once.
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
const END = 4500; // a scene's length
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let run = null;

// a card in the fan, a part of its puppet, and px per unit of its drawing
const card = (st, id) => st.fan.querySelector(`.card[data-id="${id}"] .sp-art`);
const part = (box, name) => box?.querySelector(`img.sp[data-part="${name}"]`);
const unit = (box) => (box ? box.offsetWidth / 300 : 1);
// Where elements' boxes lie on the fan (they may be tilted): for each, a map
// from fractions of its width and height to the fan's px (and back: inv), from
// three of its corners. All measured at once, with whatever else `more` reads
// (given the fan's box): a measure after a change has the page lay itself out
// again, and a scene makes some hundred and fifty things.
function frames(st, els, more = () => null) {
  const ps = els.map((el) => [[0, 0], [1, 0], [0, 1]].map(([x, y]) => {
    const p = document.createElement('i');
    p.style.cssText = `position:absolute;left:${x * 100}%;top:${y * 100}%;width:0;height:0`;
    el.append(p);
    return p;
  }));
  const f = st.fan.getBoundingClientRect();
  const maps = ps.map((three) => {
    const [a, b, c] = three.map((p) => { const r = p.getBoundingClientRect(); return [r.left - f.left, r.top - f.top]; });
    const map = (x, y) => [a[0] + x * (b[0] - a[0]) + y * (c[0] - a[0]), a[1] + x * (b[1] - a[1]) + y * (c[1] - a[1])];
    map.tilt = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    const ux = b[0] - a[0], uy = b[1] - a[1], vx = c[0] - a[0], vy = c[1] - a[1], det = ux * vy - uy * vx || 1;
    map.inv = (X, Y) => [((X - a[0]) * vy - (Y - a[1]) * vx) / det, (ux * (Y - a[1]) - uy * (X - a[0])) / det];
    return map;
  });
  const also = more(f);
  for (const three of ps) for (const p of three) p.remove();
  return [maps, also];
}

export function startHomeAlive(view) {
  stopHomeAlive();
  const fan = view.querySelector('.fan');
  if (!fan || still()) return;
  const fx = document.createElement('div');
  fx.className = 'fan-fx';
  fan.append(fx);
  const st = { fan, fx, last: Date.now(), ended: 0, count: 0, scene: null, idle: [], paused: true, art: null };
  fxArt().then((art) => { st.art = art; });
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
  dropScene(st);
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
  // (held, a motion is let go, its moment kept: a paused one still holds a layer of the phone's memory)
  for (const a of st.idle) {
    if (on) { if (a.playState !== 'idle') { a.at = a.currentTime; a.cancel(); } }
    else if (a.playState === 'idle') { a.currentTime = a.at ?? 0; a.play(); }
  }
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
  clearTimeout(st.scene.done);
  st.scene = null;
  st.ended = Date.now();
  delete st.fx.dataset.on;
}
// and its pictures gone too (leaving Home, or the fan has moved)
function dropScene(st) {
  endScene(st);
  for (const el of st.made?.els || []) el.remove();
  st.made = null;
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
  const moving = [head, breath, wl, wr, her, ...ghosts];
  if (moving.some((g) => !g)) return; // (the sprites aren't in yet)
  // nor their pictures loaded: a motion started on a picture with nothing to
  // show yet can stay on the main thread for the whole scene
  if (moving.some((g) => !g.complete || !g.naturalWidth)) return;
  const art = st.art, rand = dice(++st.count), eio = 'ease-in-out';
  // The idle motion gives way: each part starts from the pose it was in and
  // ends at rest, where its idle motion picks up again (two motions on one
  // part at once would put it on the main thread).
  const pose = new Map([wl, wr, ...ghosts].map((el) => [el, getComputedStyle(el).transform]));
  for (const a of st.idle) a.cancel();
  st.idle = [];
  const from = (el) => pose.get(el) || 'none';
  // where things are, on the fan: points of each picture, in its drawing's units
  const faceS = S.closest('.card').querySelector('.card-face');
  const [[mA, mS, mQ, cS], { homes, uA, FW, FH }] = frames(st, [A, S, Q, faceS], (f) => ({
    homes: ghosts.map((g) => { const r = g.getBoundingClientRect(); return { s: [r.left + r.width / 2 - f.left, r.top + r.height / 2 - f.top], w: g.offsetWidth, h: g.offsetHeight }; }),
    uA: unit(A), FW: st.fan.clientWidth, FH: st.fan.clientHeight,
  }));
  const PA = (x, y) => mA(x / 300, y / 210), PS = (x, y) => mS(x / 300, y / 210);
  const inFan = ([x, y]) => x > 3 && x < FW - 3 && y > 3 && y < FH - 3; // (out of sight, a motion would tick on the main thread)
  // The scene is made once and played again and again: its pictures stay on
  // the fan, unseen, between scenes, and their motions start over. (Making
  // them, some hundred and forty with their keyframes, keeps the page busy for
  // a tenth of a second.) Made afresh if the fan has moved.
  const key = [FW, FH, ...mA(0, 0), ...mS(0, 0), ...mQ(0, 0)].map(Math.round).join();
  if (st.made && st.made.key !== key) dropScene(st);
  const fresh = !st.made;
  const launches = ghosts.map((_, i) => 960 + i * 110), hits = launches.map((t) => t + 800);

  const anims = [], els = fresh ? [] : st.made.els;
  const add = (host, el) => { host.append(el); els.push(el); return el; };
  const under = (el) => { st.fx.prepend(el); els.push(el); return el; }; // (on the fan, beneath all the rest)
  // What's drawn within a card goes in a box of its own there, sealed off
  // (contain: strict): adding to it doesn't have the card laid out again.
  const boxes = new Map();
  const within = (host) => {
    if (!boxes.has(host)) { const d = document.createElement('div'); d.className = 'fx-in'; boxes.set(host, add(host, d)); }
    return boxes.get(host);
  };
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
  // a painted picture (art) on the fan at p: centred, standing on its base, or
  // hung from its top; adding up its light (lit), or beneath the rest (low)
  const pic = (src, [x, y], w, h, { base = false, top = false, lit = true, low = false } = {}) => {
    const el = document.createElement('img');
    el.src = art[src]; el.alt = ''; el.className = lit ? 'fx lit' : 'fx';
    el.style.cssText = `left:${(x - w / 2).toFixed(1)}px;top:${(top ? y : y - (base ? h : h / 2)).toFixed(1)}px;width:${w.toFixed(1)}px;height:${h.toFixed(1)}px;transform-origin:50% ${top ? 0 : base ? 100 : 50}%`;
    return low ? under(el) : add(st.fx, el);
  };
  // the same inside a card's picture, in its drawing's units (its frame clips it)
  const picIn = (box, src, [x, y], w, h, { base = false, top = false, lit = true } = {}) => {
    const el = document.createElement('img');
    el.src = art[src]; el.alt = ''; el.className = lit ? 'fx lit' : 'fx';
    el.style.cssText = `left:${pc((x - w / 2) / 300)};top:${pc((top ? y : base ? y - h : y - h / 2) / 210)};width:${pc(w / 300)};height:${pc(h / 210)};transform-origin:50% ${top ? 0 : base ? 100 : 50}%`;
    return add(within(box), el);
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
    return add(within(box), el);
  };
  // a flame catching at `on`, flickering, leaning `lean` degrees, and dying down after `off`
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    const step = off - on > 1200 ? 120 : 70; // (a long burn in longer steps: fewer to build)
    for (let t = on + 120, k = 1; (t += step + rand() * 60) < off; k++) {
      const s = k % 2 ? 1 : -1;
      list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    }
    list.push([off + 260, { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  // smoke rising from p from `t` on, drifting by dx and up by rise (px), for `ms`
  const smokeUp = (p, t, size, dx, rise, ms) => {
    const r = Math.round(rand() * 360);
    fx(pic('smoke', p, size, size, { lit: false, low: true }), [[t, { transform: `translate(0px, 0px) rotate(${r}deg) scale(.5, .5)`, opacity: 0 }, 'ease-out'],
      [t + ms * 0.25, { transform: `translate(${(dx * 0.2).toFixed(1)}px, ${(-rise * 0.25).toFixed(1)}px) rotate(${r + 20}deg) scale(1, 1)`, opacity: 0.5 }],
      [t + ms, { transform: `translate(${dx.toFixed(1)}px, ${(-rise).toFixed(1)}px) rotate(${r + 50}deg) scale(2, 2)`, opacity: 0 }]]);
  };
  // A scorch where fire lands, on `host` (at fractions ax, ay of it, `px`
  // across; squashed to `flat` when it lies on the ground): it spreads (t0 to
  // t1) and burns on, smouldering, till the dragon's head is back (`heal`);
  // then it goes out and heals by `whole`, a light passing over it.
  const scorch = (host, [ax, ay], px, v, flat, t0, t1, heal, whole) => {
    const at = (w, h) => `left:calc(${(ax * 100).toFixed(2)}% - ${(w / 2).toFixed(1)}px);top:calc(${(ay * 100).toFixed(2)}% - ${(h / 2).toFixed(1)}px);width:${w.toFixed(1)}px;height:${h.toFixed(1)}px`;
    const wrap = document.createElement('div');
    wrap.className = 'fx-scorch';
    wrap.style.cssText = at(px, px);
    for (const what of ['char', 'glow']) {
      const im = document.createElement('img');
      im.src = art[`scorch${v}:${what}`]; im.alt = '';
      if (what === 'glow') im.className = 'lit';
      wrap.append(im);
    }
    add(within(host), wrap);
    const r = ((rand() - 0.5) * (flat < 0.8 ? 16 : 360)).toFixed(1), [ch, gl] = wrap.children;
    act(wrap, [[t0, { transform: `rotate(${r}deg) scale(.15, ${(0.15 * flat).toFixed(3)})` }, 'cubic-bezier(.2,.7,.4,1)'], [t1, { transform: `rotate(${r}deg) scale(1, ${flat})` }]]);
    act(ch, [[t0, { opacity: 0 }], [t0 + 80, { opacity: 1 }], [heal + 150, { opacity: 1 }, eio], [whole, { opacity: 0 }]]);
    const gs = [[t0, { opacity: 0 }], [t0 + 80, { opacity: 0.95 }, eio]];
    for (let t = t0 + 80, k = 0; (t += 140 + rand() * 90) < heal; k++) gs.push([t, { opacity: k % 2 ? 1 : 0.7 }, eio]);
    gs.push([heal, { opacity: 1 }, 'ease-in'], [heal + 500, { opacity: 0 }]);
    act(gl, gs);
    const lt = document.createElement('i');
    lt.className = 'fx lit g-heal';
    lt.style.cssText = at(px * 1.3, px * 1.3 * flat);
    fx(add(within(host), lt), [[heal + 150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [heal + 400, { transform: 'scale(1)', opacity: 0.85 }], [whole, { transform: 'scale(1.25)', opacity: 0 }]]);
  };
  const BACK = 3480; // (the dragon's head is round again: the burning stops, and the healing starts)

  if (fresh) {
    // ── 1. Ashmaw swings its head round to the right (0-900 ms), breathing
    //       fire the whole way down on the burning city, scorching the ground
    //       where it lands; rears up (1150) and breathes a stream at Seraphine
    //       (1350-2250). Its fire as drawn dies down meanwhile, and comes back.
    const [, my] = PUPPETS.ashmaw.mouth, mx0 = mouthX(0), ground = 150;
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
    // scorches where it lands, flat on the ground, burning on till its head is back
    for (let k = 0; k < 3; k++) {
      const t = 150 + k * 270, x = mouthX(t + 120) + (rand() - 0.5) * 10;
      scorch(A, [x / 300, (ground + 6) / 210], (58 + rand() * 12) * uA, k + 1, 0.45, t + 200, t + 900, BACK + k * 60, BACK + 800 + k * 60);
      for (let j = 0; j < 2; j++) flicker(picIn(A, j ? 'flame' : 'flame2', [x + (j ? 9 : -8) + (rand() - 0.5) * 4, ground + 8], 9 + rand() * 3, 14 + rand() * 7, { base: true }), t + 320 + j * 110, BACK - 100 + rand() * 80);
    }
    // its breath: a cone of flame from its mouth to the ground (and a hotter one
    // inside it), swept along with the head
    for (const [w, len, o, ph] of [[44, ground - my - 2, 0.8, 0], [18, (ground - my - 2) * 0.85, 1, 1]]) {
      const jl = [[0, { transform: 'translateX(0px) scale(.6, .3)', opacity: 0 }, 'ease-out']];
      for (let t = 60, k = ph; t <= 840; t += 60, k++) jl.push([t, { transform: `translateX(${((mouthX(t) - mx0) * uA).toFixed(1)}px) scale(${k % 2 ? 0.86 : 1.1}, ${k % 2 ? 1.05 : 0.94})`, opacity: +(o * (k % 2 ? 0.88 : 1)).toFixed(2) }]);
      jl.push([940, { transform: `translateX(${((mouthX(900) - mx0) * uA).toFixed(1)}px) scale(.7, .5)`, opacity: 0 }]);
      fx(picIn(A, 'jet', [mx0, my + 1], w, len, { top: true }), jl);
    }
    // billows of it pouring down, drawn out by their speed, bursting flat on the roofs
    const fall = (ground - my - 6) * uA;
    for (let k = 0; k < 17; k++) {
      const t = 20 + k * 49, j = (rand() - 0.5) * 24, dx = (rand() - 0.5) * 10 * uA;
      const at = (f, s, o, st2 = 1.45) => ({ transform: `translate(${(dx * f).toFixed(1)}px, ${(fall * f).toFixed(1)}px) rotate(${(90 + j).toFixed(1)}deg) scale(${(s * st2).toFixed(2)}, ${(s / Math.sqrt(st2)).toFixed(2)})`, opacity: o });
      fx(picIn(A, k % 3 === 2 ? 'puffCool' : 'puff', [mouthX(t), my + 6], 26, 26), [[t, at(0, 0.45, 0), 'ease-out'], [t + 50, at(0.2, 0.62, 0.95)], [t + 120, at(0.5, 0.82, 0.9)], [t + 210, at(1, 1.1, 0.85, 1.3), 'ease-out'],
        [t + 400, { transform: `translate(${(dx + (rand() - 0.5) * 8 * uA).toFixed(1)}px, ${(fall - 4 * uA).toFixed(1)}px) rotate(${(90 + j + (rand() - 0.5) * 40).toFixed(1)}deg) scale(1, 2.1)`, opacity: 0 }]]);
    }
    for (let k = 0; k < 9; k++) {
      const t = 40 + k * 90;
      fx(picIn(A, 'puffHot', [mouthX(t), my + 4], 18, 18), [[t, { transform: 'translate(0px, 0px) scale(.4)', opacity: 0 }, 'ease-out'],
        [t + 50, { transform: `translate(0px, ${(fall * 0.18).toFixed(1)}px) scale(.75)`, opacity: 0.95 }], [t + 140, { transform: `translate(0px, ${(fall * 0.45).toFixed(1)}px) scale(.9)`, opacity: 0 }]]);
    }
    // and the flames it leaves standing along the city
    for (let k = 0; k < 9; k++) {
      const t = 70 + k * 95;
      flicker(picIn(A, k % 2 ? 'flame' : 'flame2', [mouthX(t) + (rand() - 0.5) * 6, ground + 6], 12 + rand() * 4, 22 + rand() * 12, { base: true }), t + 230, t + 900 + rand() * 300);
    }
    // the fire gathering in its mouth as it rears, blazing while it breathes
    const ml = [[900, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1.25)', opacity: 0.95 }]];
    for (let t = 1300, k = 0; t < 2250; t += 160, k++) ml.push([t, { transform: `scale(${k % 2 ? 1.18 : 0.98})`, opacity: k % 2 ? 0.95 : 0.8 }, eio]);
    ml.push([2300, { transform: 'scale(1.05)', opacity: 0.85 }, 'ease-in'], [2480, { transform: 'scale(.5)', opacity: 0 }]);
    fx(light('g-warm', PA(...mouthTurned(36)), 44), ml);

    // ── 2. The stream: a cone of flame leaving the mouth, billow after billow
    //       along an arc to the very edge of her left wing, its shield; thrown
    //       back from it, the fire rolls up and away into smoke.
    const [F, G] = PUPPETS.seraphine.edges.map(([x, y]) => PS(x, y)), mouth = PA(...mouthTurned(32)); // (her raised wings' very edges)
    const C = [(mouth[0] + F[0]) / 2, Math.max(10, Math.min(mouth[1], F[1]) - 22)];
    const bz = (t) => { const q = 1 - t; return [q * q * mouth[0] + 2 * q * t * C[0] + t * t * F[0], q * q * mouth[1] + 2 * q * t * C[1] + t * t * F[1]]; };
    const tan = (t) => { const dx = 2 * (1 - t) * (C[0] - mouth[0]) + 2 * t * (F[0] - C[0]), dy = 2 * (1 - t) * (C[1] - mouth[1]) + 2 * t * (F[1] - C[1]), l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const dir = (p) => { const [tx, ty] = tan(p); return (Math.atan2(ty, tx) * 180) / Math.PI; };
    // a point of the stream, `side` of its middle: a billow there, drawn out along it by `stretch`
    const along = (p, side, s, rot, o, stretch = 1) => {
      const [x, y] = bz(p), [tx, ty] = tan(p), off = side * (1 + 6 * p);
      return { transform: `translate(${(x - mouth[0] - ty * off).toFixed(1)}px, ${(y - mouth[1] + tx * off).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${(s * stretch).toFixed(2)}, ${(s / Math.sqrt(stretch)).toFixed(2)})`, opacity: o };
    };
    const ca = dir(0.15) - 90, cl = [[1260, { transform: `rotate(${ca.toFixed(1)}deg) scale(.6, .3)`, opacity: 0 }, 'ease-out']];
    for (let t = 1340, k = 0; t < 2260; t += 70, k++) cl.push([t, { transform: `rotate(${(ca + (rand() - 0.5) * 6).toFixed(1)}deg) scale(${k % 2 ? 0.88 : 1.08}, ${k % 2 ? 1.06 : 0.93})`, opacity: k % 2 ? 0.86 : 0.97 }, eio]);
    cl.push([2300, { transform: `rotate(${ca.toFixed(1)}deg) scale(.95, .85)`, opacity: 0.9 }, 'ease-in'], [2460, { transform: `rotate(${ca.toFixed(1)}deg) scale(.6, .3)`, opacity: 0 }]);
    fx(pic('jet', mouth, 15, Math.hypot(F[0] - mouth[0], F[1] - mouth[1]) * 0.6, { top: true }), cl);
    const hl = Math.hypot(mouth[0] - F[0], mouth[1] - F[1]) || 1, bk = [(mouth[0] - F[0]) / hl, (mouth[1] - F[1]) / hl]; // (back the way it came)
    const turn = ([x, y], a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
    for (let k = 0; k < 15; k++) {
      const t = 1350 + k * 62, side = (rand() - 0.5) * 2, j = (rand() - 0.5) * 30, sp = rand() < 0.5 ? -1 : 1;
      const [dx, dy] = turn(bk, (rand() - 0.5) * 1.3), d = 44 + rand() * 26, fx0 = F[0] - mouth[0], fy0 = F[1] - mouth[1], ra = dir(1) + j;
      fx(pic(k % 2 ? 'puffCool' : 'puff', mouth, 26, 26), [[t, along(0, side, 0.4, dir(0) + j, 0, 1.5), 'ease-out'], [t + 40, along(0.2, side, 0.55, dir(0.2) + j, 0.95, 1.5)],
        [t + 95, along(0.4, side, 0.68, dir(0.4) + j, 0.9, 1.5)], [t + 160, along(0.6, side, 0.8, dir(0.6) + j, 0.86, 1.5)], [t + 230, along(0.8, side, 0.92, dir(0.8) + j, 0.82, 1.45)],
        [t + 300, along(1, side, 1.05, ra, 0.8, 1.2), 'cubic-bezier(.2,.7,.4,1)'],
        [t + 470, { transform: `translate(${(fx0 + dx * d * 0.55).toFixed(1)}px, ${(fy0 + dy * d * 0.55 - 6).toFixed(1)}px) rotate(${(ra + sp * 50).toFixed(1)}deg) scale(1.45, 1.2)`, opacity: 0.66 }, 'ease-out'],
        [t + 760, { transform: `translate(${(fx0 + dx * d).toFixed(1)}px, ${(fy0 + dy * d - 22).toFixed(1)}px) rotate(${(ra + sp * 90).toFixed(1)}deg) scale(1.9, 1.7)`, opacity: 0 }]]);
    }
    for (let k = 0; k < 10; k++) {
      const t = 1350 + k * 95, side = (rand() - 0.5) * 1.2, r = Math.round(rand() * 360);
      fx(pic('puffHot', mouth, 22, 22), [[t, along(0, side, 0.3, r, 0), 'ease-out'], [t + 50, along(0.25, side, 0.55, r + 20, 0.95)], [t + 120, along(0.5, side, 0.7, r + 40, 0.85)], [t + 210, along(0.72, side, 0.8, r + 60, 0)]]);
    }
    // flames held at the shield's edge, licking back the way they came
    for (const [x, y, k] of [[22, 14, 0], [27, 22, 1], [25, 30, 2], [32, 38, 3], [31, 46, 4]]) {
      const p = PS(x - 3, y);
      if (inFan(p)) flicker(pic(k % 2 ? 'flame' : 'flame2', p, 11 + rand() * 4, 16 + rand() * 9, { base: true }), 1680 + Math.abs(k - 3) * 70 + rand() * 50, 2450 + rand() * 200, 14);
    }
    // where it strikes, the fire scorches her card, burning on till the dragon's head is back
    [[-4, 2, 38, 1700], [-11, 24, 26, 1880], [9, -12, 22, 2080]].forEach(([dx, dy, px, t0], k) => {
      const p = [F[0] + dx, F[1] + dy];
      scorch(faceS, cS.inv(...p), px, k + 1, 0.9, t0, t0 + 650, BACK + k * 60, BACK + 800 + k * 60);
      if (inFan(p)) flicker(pic(k % 2 ? 'flame' : 'flame2', [p[0] + (rand() - 0.5) * 6, p[1] + 4], 9 + rand() * 3, 13 + rand() * 6, { base: true }), t0 + 200, BACK - 100 + rand() * 80, 8);
    });
    // the light where it strikes, beating with the blows; sparks and smoke flung back
    const il = [[1660, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1740, { transform: 'scale(1.1)', opacity: 0.95 }]];
    for (let t = 1860, k = 0; t < 2600; t += 120, k++) il.push([t, { transform: `scale(${k % 2 ? 1.12 : 0.95})`, opacity: k % 2 ? 0.95 : 0.75 }, eio]);
    il.push([2900, { transform: 'scale(.7)', opacity: 0 }]);
    fx(light('g-warm', F, 56), il);
    const spark = (cls, p, t, ang, d) => {
      const el = document.createElement('i');
      el.className = `lit ${cls}`;
      el.style.cssText = `left:${p[0].toFixed(1)}px;top:${p[1].toFixed(1)}px`;
      fx(add(st.fx, el), [[t, { transform: 'translate(0px, 0px) scale(1)', opacity: 1 }, 'ease-out'], [t + 650, { transform: `translate(${(Math.cos(ang) * d).toFixed(1)}px, ${(Math.sin(ang) * d).toFixed(1)}px) scale(.3)`, opacity: 0 }]]);
    };
    const ba = Math.atan2(bk[1], bk[0]);
    for (let k = 0; k < 9; k++) spark('ff-spark', F, 1700 + k * 95, ba + (rand() - 0.5) * 2.2, 22 + rand() * 22);
    for (let k = 0; k < 6; k++) {
      const [dx, dy] = turn(bk, (rand() - 0.5) * 1.2), d = 30 + rand() * 20;
      smokeUp([F[0] + dx * d, F[1] + dy * d - 10], 2050 + k * 170, 28 + rand() * 12, dx * 14, 36 + rand() * 18, 1300);
    }

    // ── 3. The Queen glows as she calls up her court; the ghosts leave their
    //       card (960 ms on, one after another), a gloom spreading round each,
    //       and swoop at the very edge of Seraphine's right wing; thrown back
    //       from it, they tumble home.
    const pulse = (base, peak, s0, s1) => launches.flatMap((t) => [[t, { transform: `scale(${s0})`, opacity: base }, 'ease-out'], [t + 45, { transform: `scale(${s1})`, opacity: peak }, 'ease-in']]);
    fx(lightIn(Q, 'g-aura', [150, 96], 210), [[150, { transform: 'scale(.8)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1)', opacity: 0.6 }], ...pulse(0.6, 0.95, 1, 1.1),
      [1700, { transform: 'scale(1)', opacity: 0.65 }], [2600, { transform: 'scale(1)', opacity: 0.55 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
    fx(lightIn(Q, 'g-violet', [150, 48], 46), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1)', opacity: 0.8 }], ...pulse(0.8, 1, 1, 1.35),
      [1750, { transform: 'scale(1)', opacity: 0.8 }], [2600, { transform: 'scale(1)', opacity: 0.6 }, eio], [3400, { transform: 'scale(.6)', opacity: 0 }]]);
    fx(lightIn(Q, 'g-violet', [187, 76], 34), [[600, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.7 }], ...pulse(0.7, 1, 1, 1.5),
      [1750, { transform: 'scale(1)', opacity: 0.7 }], [2300, { transform: 'scale(.6)', opacity: 0 }]]);
    const tq = mQ.tilt;
    ghosts.forEach((g, i) => {
      const t0 = launches[i], hit = hits[i], reb = hit + 470, home = reb + 900, gone = home + 120;
      const { s, w, h } = homes[i];
      const flip = i < 3 ? -1 : 1; // (the three facing their Queen turn round to face Seraphine)
      const c = document.createElement('img');
      c.className = 'ff-ghost';
      c.src = g.currentSrc || g.src;
      c.style.cssText = `left:${s[0] - w / 2}px;top:${s[1] - h / 2}px;width:${w}px;height:${h}px`;
      add(st.fx, c);
      const tf = ([x, y], rot, sx, sy) => `translate(${(x - s[0]).toFixed(1)}px, ${(y - s[1]).toFixed(1)}px) rotate(${rot.toFixed(1)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})`;
      const P = [G[0] + 5, G[1] + (i - 2.5) * 6], k0 = 0.824, out = arc(s, [s[0] - 6 - i * 3, s[1] - 26 - (i % 3) * 6], P, 8, smooth);
      const list = out.map((p, j) => [t0 + j * 100, { transform: tf(p, tq - j * 2.5, (j ? flip : 1) * (1 - j * 0.022), 1 - j * 0.022), opacity: 1 }]);
      // the blow: squashed against the shield, then thrown well back, tumbling
      const R = [P[0] + 70 + (i % 3) * 10, P[1] - 40 + (i - 2.5) * 8];
      list.push([hit + 50, { transform: tf([P[0] + 1, P[1]], tq - 20, flip * k0 * 0.68, k0 * 1.22), opacity: 1 }, 'cubic-bezier(.15,.7,.35,1)']);
      list.push([reb, { transform: tf(R, tq + 200, flip * k0, k0), opacity: 0.95 }]);
      // and home, righting itself on the way
      arc(R, [(R[0] + s[0]) / 2 + 8, Math.min(R[1], s[1]) - 30], s, 6, smooth).slice(1).forEach((p, j) => {
        const q = (j + 1) / 6, k = k0 + (1 - k0) * q;
        list.push([reb + q * 900, { transform: tf(p, tq + 200 + 160 * q, (flip + (1 - flip) * q) * k, k), opacity: 1 }]);
      });
      list.push([gone, { transform: tf(s, tq + 360, 1, 1), opacity: 0 }]);
      fx(c, list);
      // its gloom, spreading round it as it goes, broken by the shield's light;
      // and left hanging behind it, spreading as it fades
      const dim = (p, k, o) => ({ transform: `translate(${(p[0] - s[0]).toFixed(1)}px, ${(p[1] - s[1]).toFixed(1)}px) scale(${k.toFixed(2)})`, opacity: o });
      fx(pic('gloom', s, 48, 48, { lit: false, low: true }), [...out.map((p, j) => [t0 + j * 100, dim(p, 0.7 + j * 0.28, j ? Math.min(0.68, 0.25 + j * 0.1) : 0)]),
        [hit + 60, dim(P, 3.2, 0.55), 'ease-out'], [hit + 260, dim([P[0] + 10, P[1]], 3.8, 0)]]);
      for (const j of [2, 4, 6]) {
        const t = t0 + j * 100, dr = (rand() - 0.5) * 12;
        fx(pic('gloom', out[j], 40, 40, { lit: false, low: true }), [[t, { transform: 'translate(0px, 0px) scale(.7)', opacity: 0 }, 'ease-out'],
          [t + 160, { transform: `translate(${(dr * 0.3).toFixed(1)}px, -2px) scale(1.3)`, opacity: 0.5 }], [t + 1100, { transform: `translate(${dr.toFixed(1)}px, -10px) scale(2.6)`, opacity: 0 }]]);
      }
    });

    // ── 4. Seraphine's wings, each with a shield (a gold copy behind it, a
    //       little larger) and a glow (a copy over it); and she braces as the
    //       blows land.
    const copies = [wl, wr].map((img) => ['fx-rim', 'fx-wing'].map((cls, k) => {
      const c = img.cloneNode();
      c.removeAttribute('data-part');
      c.removeAttribute('data-i');
      c.className = cls;
      if (k) img.after(c); else img.before(c);
      els.push(c);
      return c;
    }));
    act(her, [[1800, { transform: 'none' }, eio], [2070, { transform: 'translateY(-1%) rotate(-2deg)' }, eio], [2700, { transform: 'none' }]]);
    st.made = { key, els, anims: anims.splice(0), copies };
  } else for (const a of st.made.anims) a.play();

  // ── Each time, made anew: the motions of the parts that start from wherever
  //    they were, stirring. On their card the ghosts settle, each gone the
  //    moment its double takes off, and back as the double lands. Seraphine
  //    throws up both wings (1350-1700), their shields lit: the left strains
  //    against the fire, the right is struck by each ghost; down they come
  //    (2800-3500), shield and glow with them.
  ghosts.forEach((g, i) => {
    const t0 = launches[i], home = hits[i] + 470 + 900;
    act(g, [[0, { transform: from(g), opacity: 1 }, eio], [t0, { transform: 'none', opacity: 1 }], [t0 + 80, { transform: 'none', opacity: 0 }], [home, { transform: 'none', opacity: 0 }], [home + 120, { transform: 'none', opacity: 1 }]]);
  });
  const raise = (el, deg, jolts) => [[0, { transform: from(el) }], [1350, { transform: from(el) }, eio], [1700, { transform: `rotate(${deg}deg)` }, eio],
    ...jolts.map(([t, d]) => [t, { transform: `rotate(${d}deg)` }, eio]), [2800, { transform: `rotate(${deg}deg)` }, eio], [3500, { transform: 'none' }]];
  const left = raise(wl, 20, [[1820, 18.4], [1940, 20.4], [2060, 18.6], [2180, 20.3], [2300, 18.8], [2420, 20.2], [2540, 19], [2660, 20]]);
  const right = raise(wr, -20, [...hits.flatMap((t) => [[t, -20], [t + 45, -16.8]]), [hits.at(-1) + 150, -20]]);
  act(wl, left);
  act(wr, right);
  // (the copies move with their wing, by the same keyframes, lit at each)
  const edge = (t, k) => (t <= 1350 || t >= 3500 ? 0 : t === 1700 ? 0.95 : t >= 2800 ? 0.75 : k % 2 ? 1 : 0.78);
  const blaze = (t, k) => (t <= 1350 || t >= 3500 ? 0 : t === 1700 ? 0.3 : t >= 2800 ? 0.2 : k % 2 ? 0.4 : 0.25);
  [left, right].forEach((list, w) => st.made.copies[w].forEach((c, k) => act(c, list.map(([t, fr, e], j) => [t, {
    transform: k ? fr.transform : fr.transform === 'none' ? 'scale(1.07)' : `${fr.transform} scale(1.07)`, opacity: (k ? blaze : edge)(t, j) }, e]))));

  st.scene = { anims: [...st.made.anims, ...anims], done: setTimeout(() => { if (!window.__sceneHold) endScene(st); }, END + 100) };
  st.fx.dataset.on = '1'; // (a scene on)
}
