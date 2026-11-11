// Home's fan comes alive while you leave it be (a prototype of cards acting on
// their own, js/art/puppets.js). After a few seconds without a touch the
// cards stir: Seraphine's wings beat slowly, the Barrow Queen's ghosts sway.
// Every so often Ashmaw opens its jaws and lobs a fireball over to Seraphine,
// who throws up her wings and catches it in a burst of light, while the
// ghosts drift over to watch. A touch stops it all at once; it comes back
// when you've let go for a while. Everything here moves by transforms and
// opacity (the compositor's work, as js/sprites.js), one scene at a time.

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
    loop(part(Q, `ghost${i}`), [{ transform: 'none' }, { transform: `translateY(${-2.4 * u}px) rotate(${i < 3 ? -3 : 3}deg)` }], 2600 + i * 230, i * 700);
  }
  if (st.paused) for (const a of st.idle) a.pause();
}

// ── the scene: dragon fire, a winged catch, ghosts watching ─────────────
function endScene(st) {
  if (!st.scene) return;
  for (const a of st.scene.anims) a.cancel();
  for (const el of st.scene.els) el.remove();
  clearTimeout(st.scene.done);
  st.scene = null;
}
function scene(st) {
  const A = card(st, 'ashmaw'), S = card(st, 'seraphine'), Q = card(st, 'the-barrow-queen');
  const jaw = part(A, 'jaw'), wl = part(S, 'wingL'), wr = part(S, 'wingR'), her = part(S, 'her');
  if (!jaw || !wl || !wr || !her) return; // (the sprites aren't in yet)
  st.lastScene = Date.now();
  // The idle motion gives way: each part starts the scene from the pose it was
  // in and ends it at rest, where its idle motion picks up again (two motions
  // on one part at once would put it on the main thread).
  const pose = new Map([wl, wr, ...Array.from({ length: 6 }, (_, i) => part(Q, `ghost${i}`))].filter(Boolean).map((el) => [el, getComputedStyle(el).transform]));
  for (const a of st.idle) a.cancel();
  st.idle = [];
  const from = (el) => ({ transform: pose.get(el) || 'none' });
  const anims = [], els = [];
  // (the fire and light are hidden until their moment)
  const go = (el, frames, opts) => { const a = el.animate(frames, { easing: 'ease-in-out', ...opts }); anims.push(a); return a; };
  const show = (el, frames, opts) => go(el, frames, { fill: 'forwards', ...opts });
  const make = (cls, [x, y]) => { const el = document.createElement('i'); el.className = cls; el.style.left = `${x}px`; el.style.top = `${y}px`; st.fx.append(el); els.push(el); return el; };

  // 1. the jaws open, a glow builds in the mouth, then they gape as it fires
  go(jaw, [{ transform: 'none' }, { transform: 'rotate(-13deg)', offset: 0.3 }, { transform: 'rotate(-24deg)', offset: 0.36 }, { transform: 'rotate(-24deg)', offset: 0.7 }, { transform: 'none' }], { duration: 2300 });
  const mouth = at(st, A, [70, 70]);
  show(make('ff-glow', mouth), [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.3)', opacity: 0.95, offset: 0.75 }, { transform: 'scale(.6)', opacity: 0 }], { duration: 900 });

  // 2. a fireball lobbed over to Seraphine, embers trailing (an arc kept inside the fan)
  const heart = at(st, S, [150, 82]);
  const top = Math.max(14, Math.min(mouth[1], heart[1]) - 60);
  const ctrl = [(mouth[0] + heart[0]) / 2, top - 30];
  const path = Array.from({ length: 13 }, (_, i) => {
    const t = i / 12, q = 1 - t;
    return [q * q * mouth[0] + 2 * q * t * ctrl[0] + t * t * heart[0], q * q * mouth[1] + 2 * q * t * ctrl[1] + t * t * heart[1]];
  });
  const fly = (el, ms, delay, grow) => show(el, path.map(([x, y], i) => ({ transform: `translate(${x - mouth[0]}px, ${y - mouth[1]}px) scale(${(0.55 + (grow * i) / 12).toFixed(2)})`, opacity: i === 12 ? 0 : 1 })), { duration: ms, delay, easing: 'cubic-bezier(.3,.1,.6,1)' });
  fly(make('ff-ball', mouth), 760, 700, 0.6);
  for (let k = 1; k <= 6; k++) fly(make('ff-ember', mouth), 760, 700 + k * 45, 0.3 - k * 0.03);

  // 3. she throws up her wings, braces as it lands, and lets them down
  go(wl, [from(wl), { transform: 'rotate(20deg)', offset: 0.32 }, { transform: 'rotate(20deg)', offset: 0.62 }, { transform: 'none' }], { duration: 3150, fill: 'both' });
  go(wr, [from(wr), { transform: 'rotate(-20deg)', offset: 0.32 }, { transform: 'rotate(-20deg)', offset: 0.62 }, { transform: 'none' }], { duration: 3150, fill: 'both' });
  go(her, [{ transform: 'none' }, { transform: 'rotate(-2.5deg)', offset: 0.25 }, { transform: 'none' }], { duration: 900, delay: 1400 });

  // 4. a burst of light where it lands, and sparks
  show(make('ff-flare', heart), [{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1)', opacity: 1, offset: 0.2 }, { transform: 'scale(2.3)', opacity: 0 }], { duration: 800, delay: 1430, easing: 'ease-out' });
  for (let k = 0; k < 9; k++) {
    const ang = (k / 9) * Math.PI * 2 + 0.3, d = 22 + (k % 3) * 9;
    show(make('ff-spark', heart), [{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d}px) scale(.3)`, opacity: 0 }], { duration: 650, delay: 1450, easing: 'ease-out' });
  }

  // 5. the ghosts drift over to watch, then back
  const u = unit(Q), drift = [[-7, -3], [-9, -2], [-5, -2], [-18, -5], [-22, -3], [-14, -2]];
  drift.forEach(([dx, dy], i) => {
    const g = part(Q, `ghost${i}`);
    if (g) go(g, [from(g), { transform: `translate(${dx * u}px, ${dy * u}px) rotate(-7deg)`, offset: 0.55 }, { transform: `translate(${dx * u}px, ${dy * u}px) rotate(-5deg)`, offset: 0.78 }, { transform: 'none' }], { duration: 4450 + i * 90, fill: 'both' });
  });

  st.scene = { anims, els, done: setTimeout(() => endScene(st), 4800) };
}
