// Home's fan comes alive while you leave it be (a prototype of cards acting on
// their own, js/art/puppets.js). After a few seconds without a touch the
// cards stir: Seraphine's wings beat slowly, the Barrow Queen's ghosts sway.
// Every so often, an attack from both sides: Ashmaw swings its head round,
// breathing fire the whole way (a jet sweeping flame along the burning city
// below), rears up to the right and breathes a stream at Seraphine, while the
// Queen's ghosts leave their card and swoop at her from the other side. She
// throws up both wings: the left takes the fire, the right the ghosts, each
// breaking into light. A touch stops it all at once; it comes back when you've
// let go for a while. Everything here moves by transforms and opacity (the
// compositor's work, as js/sprites.js), one scene at a time, and all the
// motions of a scene share its one start and end (see END).

import { PUPPETS } from './art/puppets.js';

const IDLE = 3000; // ms without a touch before the cards stir
const EVERY = 12000; // ms between scenes, while idle
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let run = null;

// a card in the fan, a part of its puppet, and px per unit of its drawing
const card = (st, id) => st.fan.querySelector(`.card[data-id="${id}"] .sp-art`);
const part = (box, name) => box?.querySelector(`img.sp[data-part="${name}"]`);
const unit = (box) => (box ? box.offsetWidth / 300 : 1);
// a point of a card's drawing, on the fan (the card may be tilted)
function at(st, box, [x, y]) {
  const probe = document.createElement('i');
  probe.style.cssText = `position:absolute;left:${(x / 300) * 100}%;top:${(y / 210) * 100}%;width:0;height:0`;
  box.append(probe);
  const r = probe.getBoundingClientRect(), f = st.fan.getBoundingClientRect();
  probe.remove();
  return [r.left - f.left, r.top - f.top];
}

export function startHomeAlive(view) {
  stopHomeAlive();
  const fan = view.querySelector('.fan');
  if (!fan || still()) return;
  const fx = document.createElement('div');
  fx.className = 'fan-fx';
  fan.append(fx);
  const st = { fan, fx, last: Date.now(), lastScene: Date.now() - EVERY + 1500, scene: null, idle: [], paused: true };
  const touched = () => { st.last = Date.now(); endScene(st); hold(st, true); };
  const evs = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
  for (const e of evs) window.addEventListener(e, touched, { passive: true, capture: true });
  st.off = () => { for (const e of evs) window.removeEventListener(e, touched, { capture: true }); };
  st.timer = setInterval(() => tick(st), 400);
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
  if (!st.idle.length && !st.scene) stir(st); // (not during a scene: the idle motion picks up when it ends)
  hold(st, false);
  if (!st.scene && Date.now() - st.lastScene > EVERY) scene(st);
}
function hold(st, on) {
  if (st.paused === on) return;
  st.paused = on;
  for (const a of st.idle) on ? a.pause() : a.play();
}

// ── while idle: wings beat slowly, ghosts sway ─────────────────────────
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

// ── the scene: fire from the left, ghosts from the right, wings to block ─
// Every motion in it starts with the scene and ends with it, END ms on, its
// own moment written into its keyframes. (Motions with moments of their own,
// by delays, each wake the main thread as they start and end: dozens of times
// a second here. Sharing one start and one end, they're the compositor's alone.)
const END = 4400;
function endScene(st) {
  if (!st.scene) return;
  for (const a of st.scene.anims) a.cancel();
  for (const el of st.scene.els) el.remove();
  clearTimeout(st.scene.done);
  st.scene = null;
}
// The dragon's mouth with its head turned to the right and raised by `up`
// degrees (about the base of its neck), in its drawing's units.
function mouthTurned(up) {
  const [px, py] = PUPPETS.ashmaw.neck, [mx, my] = PUPPETS.ashmaw.mouth, r = (up * Math.PI) / 180;
  const dx = mx - px, dy = my - py;
  return [px - (dx * Math.cos(r) - dy * Math.sin(r)), py + dx * Math.sin(r) + dy * Math.cos(r)];
}
// A card's tilt in the fan, in degrees.
function tilt(el) {
  const m = getComputedStyle(el).transform.match(/matrix\(([^,]+),\s*([^,]+)/);
  return m ? (Math.atan2(+m[2], +m[1]) * 180) / Math.PI : 0;
}
// keyframes eased step by step
const eased = (frames) => frames.map((f, i) => (i < frames.length - 1 ? { easing: 'ease-in-out', ...f } : f));
// n + 1 points along a curve from s to e, pulled toward c, spaced by `pace`
const arc = (s, c, e, n = 10, pace = (t) => t) => Array.from({ length: n + 1 }, (_, i) => {
  const t = pace(i / n), q = 1 - t;
  return [q * q * s[0] + 2 * q * t * c[0] + t * t * e[0], q * q * s[1] + 2 * q * t * c[1] + t * t * e[1]];
});
const smooth = (t) => t * t * (3 - 2 * t); // (slow, quick, slow)
const bare = ({ offset, easing, ...f }) => f;
// A motion's keyframes (their offsets within its own span, given or spread
// evenly as the browser would) put `at` ms into the scene, lasting `ms`.
function place(frames, at, ms, ease) {
  const n = frames.length, o = frames.map((f, i) => f.offset ?? (i === 0 ? 0 : i === n - 1 ? 1 : null));
  for (let i = 1; i < n - 1; i++) {
    if (o[i] !== null) continue;
    let j = i;
    while (o[j] === null) j++;
    for (let k = i; k < j; k++) o[k] = o[i - 1] + ((o[j] - o[i - 1]) * (k - i + 1)) / (j - i + 1);
  }
  return frames.map((f, i) => ({ ...bare(f), easing: f.easing || ease, offset: (at + o[i] * ms) / END }));
}

function scene(st) {
  const A = card(st, 'ashmaw'), S = card(st, 'seraphine'), Q = card(st, 'the-barrow-queen');
  const head = part(A, 'head'), breath = part(A, 'breath'), wl = part(S, 'wingL'), wr = part(S, 'wingR'), her = part(S, 'her');
  const ghosts = Array.from({ length: 6 }, (_, i) => part(Q, `ghost${i}`));
  if (!head || !breath || !wl || !wr || !her || ghosts.some((g) => !g)) return; // (the sprites aren't in yet)
  st.lastScene = Date.now();
  // The idle motion gives way: each part starts from the pose it was in and
  // ends at rest, where its idle motion picks up again (two motions on one
  // part at once would put it on the main thread).
  const pose = new Map([wl, wr, ...ghosts].map((el) => [el, getComputedStyle(el).transform]));
  for (const a of st.idle) a.cancel();
  st.idle = [];
  const from = (el) => ({ transform: pose.get(el) || 'none' });
  const anims = [], els = [];
  const play = (el, ks) => anims.push(el.animate(ks, { duration: END, fill: 'forwards' }));
  // a part of a card: as it was until its moment, and as it ends after it
  const move = (el, frames, at, ms, ease = 'linear') => {
    const ks = place(frames, at, ms, ease);
    if (ks[0].offset > 0) ks.unshift({ ...bare(ks[0]), offset: 0 });
    if (ks.at(-1).offset < 1) ks.push({ ...bare(ks.at(-1)), offset: 1 });
    play(el, ks);
  };
  // an effect: unseen until its moment, and after it
  const flash = (el, frames, at, ms, ease = 'linear') => {
    const ks = place(frames, at, ms, ease), a = ks[0], z = ks.at(-1), e = 1 / END;
    if (a.offset > e) ks.unshift({ ...bare(a), opacity: 0, offset: 0 }, { ...bare(a), opacity: 0, offset: a.offset - e });
    if (z.offset < 1 - e) ks.push({ ...bare(z), opacity: 0, offset: z.offset + e }, { ...bare(z), opacity: 0, offset: 1 });
    play(el, ks);
  };
  const make = (cls, [x, y], host = st.fx) => { const el = document.createElement('i'); el.className = cls; el.style.left = `${x}px`; el.style.top = `${y}px`; host.append(el); els.push(el); return el; };
  // something drawn inside a card (its frame clips it, and the card in front covers it)
  const inCard = (box, cls, [x, y], [w, h]) => { const el = document.createElement('i'); el.className = cls; el.style.cssText = `left:${(x / 300) * 100}%;top:${(y / 210) * 100}%;width:${(w / 300) * 100}%;height:${(h / 210) * 100}%`; box.append(el); els.push(el); return el; };
  const uA = unit(A);

  // 1. Ashmaw swings its head round to the right (0-900 ms), breathing fire the
  //    whole way: a jet from its mouth sweeping along the burning city below,
  //    then rears up (to 1150) and breathes a stream at Seraphine (1300-1850).
  //    Its fire as drawn dies down meanwhile, and comes back after.
  const T = 3700, at_ = (ms) => ms / T;
  move(head, eased([
    { transform: 'none' }, { transform: 'scale(.06, 1.03)', offset: at_(450) }, { transform: 'scaleX(-1)', offset: at_(900) },
    { transform: 'scaleX(-1) rotate(40deg)', offset: at_(1150) }, { transform: 'scaleX(-1) rotate(32deg)', offset: at_(1300) },
    { transform: 'scaleX(-1) rotate(32deg)', offset: at_(2300) }, { transform: 'scaleX(-1)', offset: at_(2600) },
    { transform: 'scale(.06, 1.03)', offset: at_(3030) }, { transform: 'none', offset: at_(3480) }, { transform: 'none' }]), 0, T);
  move(breath, eased([{ opacity: 1 }, { opacity: 0, offset: 0.07 }, { opacity: 0, offset: 0.88 }, { opacity: 1 }]), 0, T);
  const [mx0, my] = PUPPETS.ashmaw.mouth, mxMid = PUPPETS.ashmaw.neck[0] - (PUPPETS.ashmaw.neck[0] - mx0) * 0.06, mx1 = mouthTurned(0)[0];
  const jet = inCard(A, 'ff-jet', [mx0 - 6, my], [12, 158 - my]);
  flash(jet, eased([{ transform: 'translateX(0) scaleY(.6)', opacity: 0 }, { transform: 'translateX(0) scaleY(1)', opacity: 1, offset: 0.06 },
    { transform: `translateX(${(mxMid - mx0) * uA}px) scaleY(1.05)`, opacity: 1, offset: 0.5 }, { transform: `translateX(${(mx1 - mx0) * uA}px) scaleY(.95)`, opacity: 1, offset: 0.94 },
    { transform: `translateX(${(mx1 - mx0) * uA}px) scaleY(.7)`, opacity: 0 }]), 0, 900);
  for (let k = 0; k < 9; k++) { // flames bursting up along the city where the jet lands
    const ms = 60 + k * 100, f = ms / 900, x = f < 0.5 ? mx0 + (mxMid - mx0) * (f / 0.5) : mxMid + (mx1 - mxMid) * ((f - 0.5) / 0.5);
    flash(inCard(A, 'ff-puff', [x - 9, 140], [18, 22]), [{ transform: 'translateY(0) scale(.4)', opacity: 0 }, { transform: 'translateY(-10%) scale(1)', opacity: 1, offset: 0.25 }, { transform: 'translateY(-70%) scale(1.25)', opacity: 0 }], ms, 700, 'ease-out');
  }
  const mouth = at(st, A, mouthTurned(32)), wingFire = at(st, S, [110, 46]), wingGhost = at(st, S, [190, 46]);
  flash(make('ff-glow', at(st, A, mouthTurned(40))), [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 0.95, offset: 0.7 }, { transform: 'scale(.7)', opacity: 0 }], 900, 500, 'ease-out');
  const ctrl = [(mouth[0] + wingFire[0]) / 2, Math.max(10, Math.min(mouth[1], wingFire[1]) - 26)];
  const stream = arc(mouth, ctrl, wingFire);
  for (let k = 0; k < 12; k++) { // the stream: flame after flame along the arc
    flash(make('ff-blob', mouth), stream.map(([x, y], i) => ({ transform: `translate(${x - mouth[0]}px, ${y - mouth[1]}px) scale(${(0.6 + i * 0.05 + (k % 3) * 0.08).toFixed(2)})`, opacity: i === stream.length - 1 ? 0 : 1 })), 1300 + k * 45, 560);
  }

  // 2. The Queen's ghosts leave their card (900 ms on, one after another) and
  //    swoop at Seraphine from the right, to land as the fire does.
  const tiltQ = tilt(Q.closest('.card'));
  ghosts.forEach((g, i) => {
    const start = 860 + i * 110, r = g.getBoundingClientRect(), f = st.fan.getBoundingClientRect();
    const s = [r.left + r.width / 2 - f.left, r.top + r.height / 2 - f.top], w = g.offsetWidth, h = g.offsetHeight;
    const flip = i < 3 ? -1 : 1; // (the three facing their Queen turn round to face Seraphine)
    // On the card it settles, and is gone the moment its double (free of the
    // card's frame) takes off from the same place; it rises back at the end.
    const back = 3300 + i * 80, D = back + 600, u = unit(Q);
    move(g, [{ ...from(g), opacity: 1, easing: 'ease-in-out' }, { transform: 'none', opacity: 1, offset: start / D }, { transform: 'none', opacity: 0, offset: (start + 80) / D },
      { transform: `translateY(${6 * u}px)`, opacity: 0, offset: back / D, easing: 'ease-out' }, { transform: 'none', opacity: 1 }], 0, D);
    const c = document.createElement('img');
    c.className = 'ff-ghost';
    c.src = g.currentSrc || g.src;
    c.style.cssText = `left:${s[0] - w / 2}px;top:${s[1] - h / 2}px;width:${w}px;height:${h}px`;
    st.fx.append(c); els.push(c);
    const rise = [s[0] - 6 - i * 3, s[1] - 26 - (i % 3) * 6], path = arc(s, rise, [wingGhost[0] + 6, wingGhost[1] + (i - 2.5) * 5], 8, smooth);
    flash(c, path.map(([x, y], j) => ({ transform: `translate(${x - s[0]}px, ${y - s[1]}px) rotate(${(tiltQ - j * 2.5).toFixed(1)}deg) scaleX(${j ? flip : 1}) scale(${(1 - j * 0.045).toFixed(3)})`, opacity: j === path.length - 1 ? 0 : 1 })), start, 900);
    // breaking against her right wing in violet light
    flash(make('ff-flare violet', wingGhost), [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(.8)', opacity: 0.9, offset: 0.2 }, { transform: 'scale(1.7)', opacity: 0 }], start + 830, 650, 'ease-out');
  });

  // 3. Seraphine throws up both wings (1350-1700), the left against the fire,
  //    the right against the ghosts, braces as they land, and lets them down.
  const W = 3400, w_ = (ms) => ms / W;
  move(wl, eased([from(wl), { ...from(wl), offset: w_(1350) }, { transform: 'rotate(20deg)', offset: w_(1700) }, { transform: 'rotate(20deg)', offset: w_(2650) }, { transform: 'none' }]), 0, W);
  move(wr, eased([from(wr), { ...from(wr), offset: w_(1350) }, { transform: 'rotate(-20deg)', offset: w_(1700) }, { transform: 'rotate(-20deg)', offset: w_(2650) }, { transform: 'none' }]), 0, W);
  move(her, eased([{ transform: 'none' }, { transform: 'translateY(-1%) rotate(-2deg)', offset: 0.3 }, { transform: 'none' }]), 1800, 900);
  for (const ms of [1860, 2060, 2260]) { // the fire breaking on her left wing
    flash(make('ff-flare', wingFire), [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 }, { transform: 'scale(2)', opacity: 0 }], ms, 700, 'ease-out');
  }
  for (let k = 0; k < 9; k++) {
    const ang = (k / 9) * Math.PI * 2 + 0.3, d = 20 + (k % 3) * 9;
    flash(make('ff-spark', wingFire), [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px) scale(.3)`, opacity: 0 }], 1880, 650, 'ease-out');
    flash(make('ff-spark violet', wingGhost), [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang + 0.4) * d}px, ${Math.sin(ang + 0.4) * d}px) scale(.3)`, opacity: 0 }], 1720 + (k % 6) * 110, 650, 'ease-out');
  }

  st.scene = { anims, els, done: setTimeout(() => { if (!window.__sceneHold) endScene(st); }, END + 100) };
}
