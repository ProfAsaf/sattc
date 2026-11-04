// The physical layer of the table: small real-looking cards (.tcard), the
// fanned hand, drag physics, FLIP moves between renders, and the combat and
// spell effects. Styles live in css/table.css.
//
// House rules:
//  · Only transform and opacity animate. Things in flight live in one fixed
//    overlay (#fx-layer); cards on the table animate in place.
//  · Motion uses the individual `translate` / `rotate` / `scale` properties,
//    which stack on top of a card's own `transform` (its fan slot or pose).
//  · Every effect returns a Promise that resolves (never rejects) when it is
//    over, so the table can `await` a sequence.
//  · setSpeed() scales every duration. With prefers-reduced-motion, motion is
//    near-instant; a card or banner that has to be read still shows briefly.

import { KEYWORDS } from './cards.js';
import { artTag, cardBackHTML, esc, factionVars, glyph } from './render.js';

const NS = 'http://www.w3.org/2000/svg';
const noop = () => {};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const normDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

// ── speed and reduced motion ────────────────────────────────────────
let SPEED = 1;
let FORCE_REDUCED = null;
const MQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

/** True when motion should be near-instant (the OS setting, or setReducedMotion(true)). */
export const isReduced = () => (FORCE_REDUCED ?? !!(MQ && MQ.matches));
/** Global speed multiplier: 2 = everything twice as fast, 0.5 = half speed. */
export function setSpeed(mult = 1) { SPEED = clamp(Number(mult) || 1, 0.1, 20); return SPEED; }
export const getSpeed = () => SPEED;
/** Force reduced motion on (true) or off (false); null follows the OS setting. */
export function setReducedMotion(on) { FORCE_REDUCED = on == null ? null : !!on; }

const D = (ms) => (isReduced() ? 1 : ms / SPEED);                          // motion
const HOLD = (ms) => (isReduced() ? Math.min(ms, 450) : ms) / SPEED;       // reading time
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** setTimeout as a Promise, scaled by the speed (near-instant under reduced motion). */
export const wait = (ms) => sleep(D(ms));

// ── the overlay and the stage ───────────────────────────────────────
let LAYER = null;
/** The fixed, click-through overlay that holds everything in flight. Created on demand. */
export function layer() {
  if (LAYER && LAYER.isConnected) return LAYER;
  LAYER = document.getElementById('fx-layer');
  if (!LAYER) {
    LAYER = document.createElement('div');
    LAYER.id = 'fx-layer';
    LAYER.setAttribute('aria-hidden', 'true');
    LAYER.style.cssText = 'position:fixed;inset:0;z-index:75;pointer-events:none;overflow:hidden';
    document.body.appendChild(LAYER);
  }
  return LAYER;
}

let STAGE = null;
/** The element that shakes and that banners and shown cards are centred on.
 *  Defaults to #game, then [data-fx-stage], then the viewport. */
export function setStage(el) { STAGE = el || null; }
function stage() {
  if (STAGE && STAGE.isConnected) return STAGE;
  return document.getElementById('game') || document.querySelector('[data-fx-stage]');
}
function stageRect() {
  const s = stage();
  const r = s && s.getBoundingClientRect();
  return r && r.width ? r : new DOMRect(0, 0, innerWidth, innerHeight);
}

function add(cls, css = '', parent = layer()) {
  const el = document.createElement('div');
  el.className = cls;
  if (css) el.style.cssText = css;
  parent.appendChild(el);
  return el;
}

// WAAPI with the speed applied. run() returns the Animation (or null),
// play() a Promise that resolves when it ends or is cancelled.
function run(el, frames, o = {}) {
  if (!el || typeof el.animate !== 'function') return null;
  try {
    return el.animate(frames, {
      duration: Math.max(1, D(o.duration ?? 300)),
      delay: o.delay ? D(o.delay) : 0,
      easing: o.easing || 'ease',
      fill: o.fill || 'both',
      iterations: o.iterations ?? 1,
    });
  } catch (err) {
    console.warn('fx: animation failed', err);
    return null;
  }
}
const done = (a) => (a ? a.finished.then(noop, noop) : Promise.resolve());
const play = (el, frames, o) => done(run(el, frames, o));

// ── measuring ───────────────────────────────────────────────────────
function angleOf(v) {
  if (!v || v === 'none') return 0;
  const m = /(-?[\d.]+(?:e-?\d+)?)(deg|rad|turn|grad)\s*$/.exec(v);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return m[2] === 'rad' ? (n * 180) / Math.PI : m[2] === 'turn' ? n * 360 : m[2] === 'grad' ? n * 0.9 : n;
}
function scaleOf(v) {
  if (!v || v === 'none') return 1;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 1;
}

// Where an element is on screen and how its transform turns and scales it.
// (e, f) is the translation part of its `transform`; with the origin at the
// centre, the element's untransformed centre is (cx - e, cy - f).
function measure(el, r = el.getBoundingClientRect()) {
  const cs = getComputedStyle(el);
  let a = 1, b = 0, e = 0, f = 0;
  if (cs.transform && cs.transform !== 'none') {
    try { const m = new DOMMatrixReadOnly(cs.transform); a = m.a; b = m.b; e = m.e; f = m.f; } catch { /* keep identity */ }
  }
  return {
    cs,
    w: el.offsetWidth || r.width,
    h: el.offsetHeight || r.height,
    ang: (Math.atan2(b, a) * 180) / Math.PI + angleOf(cs.rotate),
    sc: Math.hypot(a, b) * scaleOf(cs.scale),
    e, f,
    cx: r.left + r.width / 2,
    cy: r.top + r.height / 2,
  };
}

// Values for translate/rotate/scale that put an element's centre at
// (b.cx + dx, b.cy + dy), turned by dAng and scaled by s relative to where its
// own transform puts it. (They are applied around the same origin as the
// transform, so its translation has to be turned and scaled too.)
function pose(b, dx, dy, dAng = 0, s = 1, extra) {
  const rad = (dAng * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const rx = b.e * cos - b.f * sin, ry = b.e * sin + b.f * cos;
  const tx = dx + b.e - s * rx, ty = dy + b.f - s * ry;
  return { translate: `${tx.toFixed(2)}px ${ty.toFixed(2)}px`, rotate: `${dAng.toFixed(2)}deg`, scale: s.toFixed(4), ...extra };
}

// A damped spring from 1 to 0 over t in [0, 1] (about 5% overshoot).
function springAt(t, zeta = 0.68) {
  if (t >= 1) return 0;
  const w = 4.6 / zeta, wd = w * Math.sqrt(1 - zeta * zeta);
  return Math.exp(-zeta * w * t) * (Math.cos(wd * t) + ((zeta * w) / wd) * Math.sin(wd * t));
}
function springFrames(b, dx, dy, dAng, s, n = 24, zeta = 0.68) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), x = springAt(t, zeta);
    out.push({ ...pose(b, dx * x, dy * x, dAng * x, 1 + (s - 1) * x), offset: t });
  }
  return out;
}

// Distance from a rect's centre to its edge along the unit vector (ux, uy).
function edgeDist(r, ux, uy) {
  const tx = Math.abs(ux) > 1e-6 ? r.width / 2 / Math.abs(ux) : Infinity;
  const ty = Math.abs(uy) > 1e-6 ? r.height / 2 / Math.abs(uy) : Infinity;
  return Math.min(tx, ty);
}

// ══════════════════════════════════════════════════════════════════
//  1. The table card
// ══════════════════════════════════════════════════════════════════

const HOURGLASS = '<path d="M6 3h12M6 21h12M7 3c0 5 10 5 10 9s-10 4-10 9M17 3c0 5-10 5-10 9s10 4 10 9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>';
const KW = {
  guard:      { name: 'Guard', c: '#e6d394', svg: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/>' },
  soar:       { name: 'Soar', c: '#a9dcf5', svg: '<path d="M1.5 7.5c3.4-.3 6.8 1.6 10.5 7 3.7-5.4 7.1-7.3 10.5-7-2.7 1.7-4.9 4.6-6.2 9.4-1.5-1-2.9-1.5-4.3-1.5s-2.8.5-4.3 1.5C6.4 12.1 4.2 9.2 1.5 7.5z"/>' },
  reach:      { name: 'Reach', c: '#a6d98a', svg: '<path d="M12 1.5 17.2 8.2h-3.5v14.3h-3.4V8.2H6.8z"/>' },
  overrun:    { name: 'Overrun', c: '#ff9a5c', svg: '<path d="M2.5 5 11 12l-8.5 7zM12.5 5 21 12l-8.5 7z"/>' },
  venom:      { name: 'Venom', c: '#a5ea6c', svg: '<path d="M12 2.2c-3.6 4.9-6.3 8.4-6.3 11.9a6.3 6.3 0 0 0 12.6 0c0-3.5-2.7-7-6.3-11.9z"/>' },
  drain:      { name: 'Drain', c: '#ff8296', svg: '<path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.5.8-1.2 2.2-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/>' },
  swift:      { name: 'Swift', c: '#ffe27a', svg: '<path d="M14.2 1.5 4.5 13.6h6.3L9 22.5l10.5-12.9h-6.4z"/>' },
  watchful:   { name: 'Watchful', c: '#c9b0ff', svg: '<path fill-rule="evenodd" d="M12 4.8C6.5 4.8 2.6 9.3 1.2 12c1.4 2.7 5.3 7.2 10.8 7.2s9.4-4.5 10.8-7.2C21.4 9.3 17.5 4.8 12 4.8zm0 3a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4z"/><circle cx="12" cy="12" r="2.1"/>' },
  rush:       { name: 'Rush', c: '#ffb36b', svg: '<path d="M11.2 4.2 21.5 12l-10.3 7.8z"/><path d="M2.6 8h6M1.6 12h7.6M2.6 16h6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' },
  lastBreath: { name: 'Last Breath', c: '#dcc9ff', svg: '<path d="M12 1.8l2.3 7.9 7.9 2.3-7.9 2.3L12 22.2l-2.3-7.9L1.8 12l7.9-2.3z"/>' },
  leaving:    { name: 'Leaves at the end of the turn', c: '#d8cfbd', svg: HOURGLASS },
};
const SPENT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 12.4a7.6 7.6 0 1 1-2.3-6.1" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/><path d="M20.7 3.2v6.6h-6.6z" fill="currentColor"/></svg>';

/** The keyword ids that have a badge. */
export const KEYWORD_BADGES = Object.keys(KW).filter((k) => k !== 'leaving');

/** Badge markup for one keyword id ('' if it has none). */
export function keywordBadge(k) {
  const d = KW[k];
  if (!d) return '';
  const name = KEYWORDS[k]?.name || d.name;
  return `<i class="tc-kw" data-kw="${k}" title="${esc(name)}" style="--kc:${d.c}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${d.svg}</svg></i>`;
}

// Rough width of a name in EB Garamond semibold, in ems (good enough to
// decide whether it fits on one line of a board card).
const NARROW = /[ijlI.,'’!|]/, SLIM = /[frt\s()-]/, WIDE = /[mwMW]/, UPPER = /[A-Z]/;
function nameEms(name) {
  let w = 0;
  for (const ch of name) w += NARROW.test(ch) ? 0.26 : SLIM.test(ch) ? 0.33 : WIDE.test(ch) ? 0.78 : UPPER.test(ch) ? 0.62 : 0.48;
  return w;
}

function nameTier(name, hand) {
  if (hand) return name.length > 24 ? ' n-sm' : '';
  // one line at ~9.6px holds about 5.3em on a 66px card; longer names take two lines at 9px
  return nameEms(name) > 5.2 ? ' n2' : '';
}

function typeText(card) {
  if (card.type === 'relic') return 'Relic';
  if (card.type !== 'creature') return card.subtype === 'Trap' || card.subtype === 'Trick' ? card.subtype : 'Spell';
  return card.token ? `Token · ${card.subtype || 'Creature'}` : card.subtype || 'Creature';
}

/**
 * A table card: a creature on the board or a card in the hand.
 *
 * state:
 *   uid        → data-uid (FLIP, ghosts and arrows find cards by it)
 *   zone       'board' (default) or 'hand' (adds cost hex and type line)
 *   states     array or space-separated classes: ready exhausted attacking blocking
 *              target selected hurt buffed sick can dim foe (see table.css)
 *   power, vitality   current values (vitality = what is left after damage)
 *   dmg        damage marked this turn (> 0 colours vitality red)
 *   cost       current cost in hand (greener when cheaper, redder when dearer)
 *   keywords   keyword ids to badge (default card.keywords)
 *   leaving    true → hourglass badge (leaves at the end of the turn)
 *   foe        true → it belongs to an opponent (pushes forward downwards)
 *   w          width in px (sets --w; otherwise --w-board / --w-hand)
 *   legendary  override for card.legendary
 *   cls        extra classes
 */
export function tcardHTML(card, state = {}) {
  if (!card) return '';
  const s = state || {};
  const hand = s.zone === 'hand';
  const creature = card.type === 'creature';
  const cls = ['tcard', hand ? 'in-hand' : 'on-board', creature ? 'is-creature' : 'is-spell'];
  if ((card.factions || []).length > 1) cls.push('multi');
  if (s.legendary ?? card.legendary === true) cls.push('legendary');
  if (card.token) cls.push('token');
  if (s.foe) cls.push('foe');
  const kws = [...new Set(s.keywords || card.keywords || [])].filter((k) => KW[k]);
  if (kws.includes('guard')) cls.push('guard');
  const states = Array.isArray(s.states) ? s.states : String(s.states || '').split(/\s+/);
  for (const st of states) if (st && !cls.includes(st)) cls.push(st);
  if (s.cls) cls.push(s.cls);

  const p = s.power ?? card.power, v = s.vitality ?? card.vitality;
  const pCls = p > card.power ? ' up' : p < card.power ? ' down' : '';
  const vCls = (s.dmg > 0 || v < card.vitality) ? ' hurt' : v > card.vitality ? ' up' : '';
  const cost = s.cost ?? card.cost;
  const costCls = cost < card.cost ? ' cheaper' : cost > card.cost ? ' pricier' : '';
  const badges = kws.map(keywordBadge).join('') + (s.leaving ? keywordBadge('leaving') : '');
  const art = artTag(card.id) || `<div class="tc-ph">${glyph((card.factions || [])[0] || 'neutral')}</div>`;
  const label = creature ? `${card.name}, ${p} power, ${v} vitality` : `${card.name}, ${typeText(card)}`;
  const style = factionVars(card) + (s.w ? `;--w:${s.w}px` : '');
  const tier = nameTier(card.name, hand);
  if (tier === ' n2') cls.push('name2');
  return `<div class="${cls.join(' ')}"${s.uid != null ? ` data-uid="${esc(s.uid)}"` : ''} data-cid="${esc(card.id)}" style="${style}" role="img" aria-label="${esc(label)}">`
    + '<div class="tc-body"><div class="tc-face"><div class="tc-frame">'
    + (cls.includes('legendary') ? '<i class="tc-sheen"></i>' : '')
    + `<div class="tc-art">${art}</div>`
    + `<div class="tc-name${tier}"><span>${esc(card.name)}</span></div>`
    + (hand ? `<div class="tc-type">${esc(typeText(card))}</div>` : '')
    + '</div></div>'
    + (hand ? `<div class="tc-cost${costCls}"><span>${cost}</span></div>` : '')
    + (creature ? `<b class="tc-p${pCls}">${p}</b><b class="tc-v${vCls}">${v}</b>` : '')
    + (badges ? `<div class="tc-kws">${badges}</div>` : '')
    + `<i class="tc-ex">${SPENT}</i>`
    + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════
//  2. The hand
// ══════════════════════════════════════════════════════════════════

const SLOT = new WeakMap();       // hand card → its fan slot from the last layout
const HANDS = new Set();
let RO = null;
const PENDING = new Set();
let pendingRaf = 0;

function scheduleLayout(h) {
  PENDING.add(h);
  pendingRaf ||= requestAnimationFrame(() => {
    pendingRaf = 0;
    const list = [...PENDING];
    PENDING.clear();
    for (const x of list) if (x.isConnected) layoutHand(x);
  });
}

function watchHand(h) {
  if (HANDS.has(h)) return;
  for (const x of HANDS) if (!x.isConnected) { HANDS.delete(x); RO?.unobserve(x); }
  HANDS.add(h);
  if (typeof ResizeObserver === 'function') {
    RO ||= new ResizeObserver((entries) => { for (const en of entries) if (en.target.isConnected) scheduleLayout(en.target); });
    RO.observe(h);
  } else if (!watchHand.onWin) {
    watchHand.onWin = true;
    addEventListener('resize', () => HANDS.forEach(scheduleLayout));
  }
}

/**
 * Fan the .tcard children of a hand container (.tc-hand) along a gentle arc.
 * Cards overlap but always show at least ~36px; with 9-10 cards they shrink
 * (down to --w-hand-min) to keep that. A card with .touched or .selected rises,
 * straightens and pushes its neighbours aside. Re-runs by itself when the
 * container resizes. Call it after every render of the hand.
 */
export function layoutHand(container, o = {}) {
  if (!container) return;
  watchHand(container);
  const cards = [...container.children].filter((c) => c.classList?.contains('tcard') && !c.classList.contains('dragging'));
  const n = cards.length;
  if (!n) return;
  const cs = getComputedStyle(container);
  const base = parseFloat(cs.getPropertyValue('--w-hand')) || 104;
  const minW = parseFloat(cs.getPropertyValue('--w-hand-min')) || 82;
  const reveal = o.reveal ?? 36;
  const W = container.clientWidth || 360;
  const pad = o.pad ?? 4;
  const avail = Math.max(base, W - 2 * pad);
  // a fuller hand fans flatter
  const R = o.radius ?? Math.max(560, W * 1.9) * (1 + Math.max(0, n - 6) * 0.18);
  // the widest spacing (≤ a card and a gap) whose outermost top corners, where
  // the cost sits, stay on screen once the end cards are turned
  const fit = (cw) => {
    if (n < 2) return 0;
    const ch = cw * 1.397, half = avail / 2 + pad - 3;
    let lo = 0, hi = cw + 8;
    for (let k = 0; k < 16; k++) {
      const sp = (lo + hi) / 2, t = (((n - 1) / 2) * sp) / R;
      const edge = R * Math.sin(t) + (cw / 2) * Math.cos(t) + (ch / 2) * Math.sin(t) + cw * 0.035;
      if (edge <= half) lo = sp; else hi = sp;
    }
    return lo;
  };
  let w = base;
  let s = fit(w);
  if (n > 1 && s < reveal) {
    // shrink the cards (not below --w-hand-min) until each shows `reveal` px
    let lo = minW, hi = base;
    for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (fit(m) >= reveal) lo = m; else hi = m; }
    w = lo;
    s = fit(w);
  }
  const h = w * 1.397;
  const fi = cards.findIndex((c) => c.classList.contains('touched') || c.classList.contains('selected'));
  const mid = (n - 1) / 2;
  const spread = fi < 0 ? 0 : clamp((w * 1.15 - s) * 0.45, 0, 24);
  const fresh = [];
  cards.forEach((c, i) => {
    const arc0 = (i - mid) * s;
    let arc = arc0;
    if (fi >= 0 && i !== fi) arc += Math.sign(i - fi) * spread * Math.max(0.3, 1 - (Math.abs(i - fi) - 1) * 0.25);
    const th = arc / R;
    let x = R * Math.sin(th), y = R * (1 - Math.cos(th)), r = (th * 180) / Math.PI, sc = 1, z = i + 1;
    if (i === fi) {
      const lim = Math.max(0, avail / 2 - (w * 1.15) / 2);
      x = clamp(R * Math.sin(arc0 / R), -lim, lim);
      y = -h * 0.26;
      r = 0; sc = 1.15; z = 60;
    }
    SLOT.set(c, { x, y, r, s: sc, x0: R * Math.sin(arc0 / R) });
    if (!c.dataset.fan) { c.dataset.fan = '1'; c.classList.add('fx-nofx'); fresh.push(c); }
    const st = c.style;
    st.setProperty('--w', `${w.toFixed(1)}px`);
    st.setProperty('--fx', `${x.toFixed(1)}px`);
    st.setProperty('--fy', `${y.toFixed(1)}px`);
    st.setProperty('--fr', `${r.toFixed(2)}deg`);
    st.setProperty('--fs', sc.toFixed(3));
    st.setProperty('--z', z);
  });
  if (fresh.length) {
    void container.offsetWidth; // place new cards without a transition
    for (const c of fresh) c.classList.remove('fx-nofx');
  }
}

function setTouched(hand, el) {
  if (!hand) return;
  for (const c of hand.children) if (c !== el) c.classList?.remove('touched');
  el?.classList.add('touched');
  layoutHand(hand);
}

// The hand card whose (unfocused) slot is nearest to a screen x.
function cardAtX(hand, x) {
  const r = hand.getBoundingClientRect(), cx = r.left + r.width / 2;
  let best = null, bd = Infinity;
  for (const c of hand.children) {
    if (!c.classList?.contains('tcard') || c.classList.contains('dragging') || c.classList.contains('returning')) continue;
    const sl = SLOT.get(c);
    if (!sl) continue;
    const d = Math.abs(cx + sl.x0 - x);
    if (d < bd) { bd = d; best = c; }
  }
  return best;
}

// ══════════════════════════════════════════════════════════════════
//  3. Drag physics
// ══════════════════════════════════════════════════════════════════

let ACTIVE = null;                     // the pointer interaction in progress (one at a time)
const preventTouch = (e) => { if (e.cancelable) e.preventDefault(); };

/** True while a finger is down on a hand card or aiming an arrow; put off re-renders until it is false. */
export const isDragging = () => !!ACTIVE;

function suppressClick() {
  const kill = (e) => { e.stopPropagation(); e.preventDefault(); };
  addEventListener('click', kill, { capture: true, once: true });
  setTimeout(() => removeEventListener('click', kill, { capture: true }), 400);
}

function listen(on) {
  const f = on ? addEventListener : removeEventListener;
  f('pointermove', onPointerMove, true);
  f('pointerup', onPointerUp, true);
  f('pointercancel', onPointerCancel, true);
}

function onPointerMove(e) { if (ACTIVE && e.pointerId === ACTIVE.id) ACTIVE.move(e); }
function onPointerUp(e) { if (ACTIVE && e.pointerId === ACTIVE.id) ACTIVE.up(e, false); }
function onPointerCancel(e) { if (ACTIVE && e.pointerId === ACTIVE.id) ACTIVE.up(e, true); }

function stepSpring(x, v, target, k, c, h) {
  const a = -k * (x - target) - c * v;
  v += a * h;
  return [x + v * h, v];
}
const damp = (k, zeta) => 2 * zeta * Math.sqrt(k);

/**
 * Make hand cards draggable. Press and move more than `threshold` px and the
 * card follows the finger on a stiff spring, tilting with its speed. A tap
 * (less movement) is left alone, so your click handler still opens the card.
 * Sliding sideways along the hand first "scrubs": the card under the finger
 * rises; pull up to take it.
 *
 *   drag(el or root, {
 *     selector,         // with a root: which elements drag (e.g. '.tc-hand > .tcard')
 *     threshold: 6,
 *     enabled(el),      // false → no drag (taps still work)
 *     canDrop(info),    // true → releasing here plays it
 *     onDrop(info),     // return false (or a Promise of false) to send it back
 *     onStart(info), onMove(info), onBack(info)
 *   }) → { destroy() }
 *
 * info = { el, uid, cid, x, y, dx, dy, vx, vy, rect, handRect, overHand, back() }
 * After an accepted drop the card stays where it was let go (class .dragging)
 * until you re-render; flip() then carries it from there to its new place.
 */
export function drag(target, o = {}) {
  const sel = o.selector || null;
  const down = (e) => {
    if (ACTIVE || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = sel ? e.target.closest?.(sel) : target;
    if (!el || (sel && !target.contains(el))) return;
    if (el.classList.contains('dragging') || el.classList.contains('returning')) return;
    beginPress(el, e, o);
  };
  target.addEventListener('pointerdown', down);
  return { destroy() { target.removeEventListener('pointerdown', down); } };
}

function beginPress(el, e, o) {
  const thr = o.threshold ?? 6;
  const hand = el.parentElement?.classList.contains('tc-hand') ? el.parentElement : null;
  const S = {
    id: e.pointerId, el, hand, o,
    x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, low: e.clientY,
    mode: 'press',            // press → scrub | drag → hold | back
    px: 0, py: 0, vx: 0, vy: 0, rot: 0, vr: 0, sc: 1, vs: 0,
    tx: 0, ty: 0, tr: 0, ts: 1,
    raf: 0, last: 0, ok: false, waiting: false,
  };
  const can = (c) => !o.enabled || o.enabled(c) !== false;
  if (hand) setTouched(hand, el);

  S.move = (ev) => {
    S.x = ev.clientX; S.y = ev.clientY;
    const dx = S.x - S.x0, dy = S.y - S.y0;
    if (S.mode === 'press') {
      if (Math.hypot(dx, dy) < thr) return;
      const sideways = Math.abs(dx) > Math.abs(dy) * 1.15;
      if (hand && (sideways || !can(S.el) || dy > 0)) { S.mode = 'scrub'; S.low = S.y; }
      else if (can(S.el)) startDrag(S);
      else { S.mode = 'idle'; return; }
    }
    if (S.mode === 'scrub') {
      S.low = Math.max(S.low, S.y);
      const c = cardAtX(hand, S.x);
      if (c && c !== S.el) { S.el = c; setTouched(hand, c); }
      if (S.low - S.y > 22 && can(S.el)) startDrag(S);
      return;
    }
    if (S.mode === 'drag') {
      if (ev.cancelable) ev.preventDefault();
      if (!S.el.isConnected) return;
      const inf = dragInfo(S);
      const ok = !!(o.canDrop && safeCall(o.canDrop, inf));
      if (ok !== S.ok) { S.ok = ok; S.el.classList.toggle('drop-ok', ok); }
      o.onMove?.(inf);
    }
  };

  S.up = (ev, cancelled) => {
    listen(false);
    ACTIVE = null;
    removeEventListener('touchmove', preventTouch, { passive: false });
    if (S.mode === 'press' || S.mode === 'idle') {
      if (hand) setTimeout(() => { S.el.classList.remove('touched'); if (hand.isConnected) layoutHand(hand); }, 140);
      return; // a tap: the click that follows is yours
    }
    suppressClick();
    if (S.mode === 'scrub') {
      S.el.classList.remove('touched');
      if (hand.isConnected) layoutHand(hand);
      return;
    }
    if (S.mode !== 'drag' || !S.el.isConnected) return; // the table was redrawn under the finger: let it go
    S.el.classList.remove('drop-ok');
    const inf = dragInfo(S);
    if (cancelled || !(o.canDrop && safeCall(o.canDrop, inf))) { goBack(S); return; }
    S.mode = 'hold';
    let res;
    try { res = o.onDrop ? o.onDrop(inf) : undefined; } catch (err) { console.error(err); res = false; }
    if (res === false) { goBack(S); return; }
    if (res && typeof res.then === 'function') {
      S.waiting = true;
      res.then((v) => { S.waiting = false; if (v === false) goBack(S); }, () => { S.waiting = false; goBack(S); });
    }
  };

  ACTIVE = S;
  listen(true);
}

function safeCall(fn, arg) {
  try { return fn(arg); } catch (err) { console.error(err); return false; }
}

function dragInfo(S) {
  const r = S.el.getBoundingClientRect();
  const hr = S.hand?.isConnected ? S.hand.getBoundingClientRect() : null;
  return {
    el: S.el, uid: S.el.dataset.uid, cid: S.el.dataset.cid,
    x: S.x, y: S.y, dx: S.x - S.x0, dy: S.y - S.y0, vx: S.vx, vy: S.vy,
    rect: r, handRect: hr, overHand: !!hr && S.y > hr.top + 4,
    back: () => goBack(S),
  };
}

function startDrag(S) {
  const el = S.el;
  const m = measure(el);
  S.P = { x: m.cx - m.e, y: m.cy - m.f };          // the untransformed centre (fixed point)
  S.px = m.e; S.py = m.f; S.rot = m.ang; S.sc = m.sc;
  S.vx = S.vy = S.vr = S.vs = 0;
  S.h = el.offsetHeight * m.sc;
  S.gx = S.x - m.cx; S.gy = S.y - m.cy;             // where the finger holds it
  S.mode = 'drag';
  el.classList.remove('touched');
  el.classList.add('dragging');
  applyDrag(S);
  if (S.hand) layoutHand(S.hand);                    // the rest close ranks
  addEventListener('touchmove', preventTouch, { passive: false });
  S.o.onStart?.(dragInfo(S));
  startLoop(S);
}

function applyDrag(S) {
  const st = S.el.style;
  st.translate = `${S.px.toFixed(2)}px ${S.py.toFixed(2)}px`;
  st.rotate = `${S.rot.toFixed(2)}deg`;
  st.scale = S.sc.toFixed(4);
}

function startLoop(S) {
  if (S.raf) return;
  S.last = performance.now();
  const tick = (now) => {
    S.raf = 0;
    if (!S.el.isConnected) return;                   // re-rendered away
    const dt = Math.min(0.05, (now - S.last) / 1000) * SPEED;
    S.last = now;
    const settled = physics(S, dt);
    applyDrag(S);
    if (S.mode === 'back' && settled) { finishBack(S); return; }
    if (S.mode === 'hold' && settled && !S.waiting) return;    // resting where it was dropped
    S.raf = requestAnimationFrame(tick);
  };
  S.raf = requestAnimationFrame(tick);
}

function physics(S, dt) {
  let kp, cp, kr, cr, ks, cs;
  if (S.mode === 'drag' || S.mode === 'hold') {
    if (S.mode === 'drag') {
      const k = 1 - Math.exp(-dt * 7);                 // ease the grip so the card sits above the finger
      S.gx += (0 - S.gx) * k;
      S.gy += (S.h * 0.3 - S.gy) * k;
      S.tx = S.x - S.gx - S.P.x;
      S.ty = S.y - S.gy - S.P.y;
      S.ts = S.ok ? 1.2 : 1.12;
    } else S.ts = 1.12;
    S.tr = clamp(S.vx * 0.036, -20, 20);
    kp = 1400; cp = damp(kp, 0.85); kr = 340; cr = damp(kr, 0.4); ks = 500; cs = damp(ks, 0.7);
  } else {                                             // back to its slot, with overshoot
    kp = 420; cp = damp(kp, 0.5); kr = 420; cr = damp(kr, 0.45); ks = 520; cs = damp(ks, 0.55);
  }
  if (isReduced()) {
    S.px = S.tx; S.py = S.ty; S.rot = S.mode === 'back' ? S.tr : 0; S.sc = S.ts; S.vx = S.vy = S.vr = S.vs = 0;
    return true;
  }
  const n = Math.max(1, Math.ceil(dt / (1 / 240))), h = dt / n;
  for (let i = 0; i < n; i++) {
    [S.px, S.vx] = stepSpring(S.px, S.vx, S.tx, kp, cp, h);
    [S.py, S.vy] = stepSpring(S.py, S.vy, S.ty, kp, cp, h);
    [S.rot, S.vr] = stepSpring(S.rot, S.vr, S.tr, kr, cr, h);
    [S.sc, S.vs] = stepSpring(S.sc, S.vs, S.ts, ks, cs, h);
  }
  return Math.abs(S.px - S.tx) < 0.35 && Math.abs(S.py - S.ty) < 0.35 && Math.abs(S.vx) + Math.abs(S.vy) < 12
    && Math.abs(S.rot - S.tr) < 0.25 && Math.abs(S.vr) < 6 && Math.abs(S.sc - S.ts) < 0.003 && Math.abs(S.vs) < 0.03;
}

function goBack(S) {
  if (S.mode === 'back' || !S.el.isConnected) return;
  S.mode = 'back';
  S.el.classList.remove('dragging', 'drop-ok');
  S.el.classList.add('returning');
  if (S.hand?.isConnected) layoutHand(S.hand);       // its slot opens again
  const sl = SLOT.get(S.el) || { x: 0, y: 0, r: 0, s: 1 };
  S.tx = sl.x; S.ty = sl.y; S.tr = sl.r; S.ts = sl.s;
  S.o.onBack?.(dragInfo(S));
  startLoop(S);
}

function finishBack(S) {
  const el = S.el, st = el.style;
  el.classList.add('fx-nofx');
  el.classList.remove('returning');
  st.translate = st.rotate = st.scale = '';
  void el.offsetWidth;
  el.classList.remove('fx-nofx');
}

/**
 * Drag from a creature to aim: a glowing curved arrow stretches from it to
 * the finger and snaps onto valid targets.
 *
 *   dragArrow(el or root, {
 *     selector,            // with a root: which elements can aim (e.g. '.tcard.ready')
 *     targets: [els] or (fromEl) => els,
 *     onHover(el|null), onDrop(el|null, fromEl), onStart(fromEl),
 *     enabled(el), color, threshold: 8
 *   }) → { destroy() }
 * A tap does nothing here, so tap-to-select keeps working alongside.
 */
export function dragArrow(source, o = {}) {
  const sel = o.selector || null;
  const thr = o.threshold ?? 8;
  const down = (e) => {
    if (ACTIVE || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const el = sel ? e.target.closest?.(sel) : source;
    if (!el || (sel && !source.contains(el))) return;
    if (o.enabled && o.enabled(el) === false) return;
    const A = { id: e.pointerId, el, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, live: false, hover: null };
    A.move = (ev) => {
      A.x = ev.clientX; A.y = ev.clientY;
      if (!A.live) {
        if (Math.hypot(A.x - A.x0, A.y - A.y0) < thr) return;
        A.live = true;
        const ts = typeof o.targets === 'function' ? o.targets(el) : o.targets;
        A.targets = [...(ts || [])].filter(Boolean);
        A.rects = A.targets.map((t) => t.getBoundingClientRect());
        A.from = el.getBoundingClientRect();
        A.svg = makeArrow(o.color || '#ff6b3d');
        el.classList.add('aiming');
        addEventListener('touchmove', preventTouch, { passive: false });
        o.onStart?.(el);
      }
      if (ev.cancelable) ev.preventDefault();
      let hit = null, hr = null;
      for (let i = 0; i < A.rects.length; i++) {
        const r = A.rects[i], pad = 10;
        if (A.x >= r.left - pad && A.x <= r.right + pad && A.y >= r.top - pad && A.y <= r.bottom + pad) { hit = A.targets[i]; hr = r; break; }
      }
      if (hit !== A.hover) {
        A.hover?.classList.remove('aim');
        hit?.classList.add('aim');
        A.hover = hit;
        o.onHover?.(hit);
      }
      const end = hr ? centre(hr) : { x: A.x, y: A.y };
      const pts = anchors(A.from, end, hr);
      drawArrow(A.svg, pts.ax, pts.ay, pts.bx, pts.by);
    };
    A.up = (ev, cancelled) => {
      listen(false);
      ACTIVE = null;
      if (!A.live) return;
      removeEventListener('touchmove', preventTouch, { passive: false });
      suppressClick();
      el.classList.remove('aiming');
      const t = cancelled || !el.isConnected || !A.hover?.isConnected ? null : A.hover; // redrawn meanwhile: let it go
      A.hover?.classList.remove('aim');
      if (t) fireArrow(A.svg); else retractArrow(A.svg);
      if (!el.isConnected) return;
      try { o.onDrop?.(t, el); } catch (err) { console.error(err); }
    };
    ACTIVE = A;
    listen(true);
  };
  source.addEventListener('pointerdown', down);
  return { destroy() { source.removeEventListener('pointerdown', down); } };
}

// ── arrows ──────────────────────────────────────────────────────────
function makeArrow(color) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'fx-arrow');
  svg.style.setProperty('--ac', color);
  svg.innerHTML = '<path class="fx-a-glow"/><path class="fx-a-body"/><path class="fx-a-core"/><path class="fx-a-head"/><circle class="fx-a-socket" r="9"/>';
  layer().appendChild(svg);
  return svg;
}

// From just inside the source's edge to just inside the target's edge.
function anchors(fromRect, end, toRect) {
  const a = centre(fromRect);
  const dx = end.x - a.x, dy = end.y - a.y, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const out = edgeDist(fromRect, ux, uy) * 0.55;
  let bx = end.x, by = end.y;
  if (toRect) { const back = edgeDist(toRect, ux, uy) * 0.3; bx -= ux * back; by -= uy * back; }
  return { ax: a.x + ux * out, ay: a.y + uy * out, bx, by };
}

function drawArrow(svg, ax, ay, bx, by, t = 1) {
  const [glow, body, core, head, sock] = svg.children;
  const dx0 = bx - ax, dy0 = by - ay, len0 = Math.hypot(dx0, dy0);
  sock.setAttribute('cx', ax.toFixed(1));
  sock.setAttribute('cy', ay.toFixed(1));
  if (len0 < 6) { for (const p of [glow, body, core, head]) p.setAttribute('d', ''); return; }
  const nx = -dy0 / len0, ny = dx0 / len0;
  const bend = (dx0 >= 0 ? -1 : 1) * Math.min(len0 * 0.2, 70);
  const cx = (ax + bx) / 2 + nx * bend, cy = (ay + by) / 2 + ny * bend;
  // draw only the first t of the curve (for the draw-in)
  let ex = bx, ey = by, qx = cx, qy = cy;
  if (t < 1) {
    const m1x = lerp(ax, cx, t), m1y = lerp(ay, cy, t), m2x = lerp(cx, bx, t), m2y = lerp(cy, by, t);
    ex = lerp(m1x, m2x, t); ey = lerp(m1y, m2y, t); qx = m1x; qy = m1y;
  }
  const tx = ex - qx, ty = ey - qy, tl = Math.hypot(tx, ty) || 1, ux = tx / tl, uy = ty / tl;
  const H = Math.min(24, Math.hypot(ex - ax, ey - ay) * 0.5), Wd = H * 0.85;
  const sx = ex - ux * H * 0.62, sy = ey - uy * H * 0.62;
  const d = `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${qx.toFixed(1)} ${qy.toFixed(1)} ${sx.toFixed(1)} ${sy.toFixed(1)}`;
  glow.setAttribute('d', d); body.setAttribute('d', d); core.setAttribute('d', d);
  const hx = ex - ux * H, hy = ey - uy * H, px = -uy * Wd / 2, py = ux * Wd / 2;
  const nxh = ex - ux * H * 0.62, nyh = ey - uy * H * 0.62;
  head.setAttribute('d', `M${ex.toFixed(1)} ${ey.toFixed(1)}L${(hx + px).toFixed(1)} ${(hy + py).toFixed(1)}L${nxh.toFixed(1)} ${nyh.toFixed(1)}L${(hx - px).toFixed(1)} ${(hy - py).toFixed(1)}Z`);
}

function fireArrow(svg) {
  play(svg, [{ opacity: 1 }, { opacity: 1, offset: 0.35 }, { opacity: 0 }], { duration: 320 }).then(() => svg.remove());
}
function retractArrow(svg) {
  play(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).then(() => svg.remove());
}

/**
 * Show an attack or targeting arrow from one element to another, so it is
 * obvious what an opponent picked. Returns the arrow (an <svg> in the overlay)
 * with `.finished` (a Promise for when it is gone) and `.fade()`. With
 * `duration` it fades by itself after that long; otherwise call `.fade()`.
 * The target gets .aim while the arrow is up.
 */
export function arrow(fromEl, toEl, o = {}) {
  if (!fromEl || !toEl) return null;
  const svg = makeArrow(o.color || '#ff6b3d');
  const fr = fromEl.getBoundingClientRect(), tr = toEl.getBoundingClientRect();
  const p = anchors(fr, centre(tr), tr);
  toEl.classList?.add('aim');
  let resolve;
  svg.finished = new Promise((r) => { resolve = r; });
  let gone = false;
  svg.fade = () => {
    if (gone) return svg.finished;
    gone = true;
    if (toEl.isConnected) toEl.classList.remove('aim');
    play(svg, [{ opacity: 1 }, { opacity: 0 }], { duration: 260 }).then(() => { svg.remove(); resolve(); });
    return svg.finished;
  };
  const t0 = performance.now(), dur = D(o.drawIn ?? 300);
  const step = (now) => {
    if (gone) return;
    const t = clamp((now - t0) / dur, 0, 1);
    drawArrow(svg, p.ax, p.ay, p.bx, p.by, 1 - (1 - t) ** 3);
    if (t < 1) requestAnimationFrame(step);
  };
  drawArrow(svg, p.ax, p.ay, p.bx, p.by, isReduced() ? 1 : 0.02);
  if (!isReduced()) requestAnimationFrame(step);
  if (o.duration) setTimeout(() => svg.fade(), HOLD(o.duration) + (isReduced() ? 0 : dur));
  return svg;
}

// ══════════════════════════════════════════════════════════════════
//  4. FLIP: capture before a render, flip after it
// ══════════════════════════════════════════════════════════════════

const SEL = '[data-uid]:not(button):not([data-act]), [data-p]:not(button):not([data-act])';
const INFO = new WeakMap();      // DOMRect from capture() → what else we saw

/** The key capture() uses: the data-uid ("12"), or "p" + data-p for player bars ("p0"). */
export function keyOf(el) {
  if (!el || !el.dataset) return null;
  if (el.dataset.uid != null) return String(el.dataset.uid);
  if (el.dataset.p != null) return `p${el.dataset.p}`;
  return null;
}

function snap(el, r) {
  const m = measure(el, r);
  const zone = el.classList.contains('in-hand') ? 'hand' : el.classList.contains('tcard') ? 'board' : 'other';
  const p = el.querySelector?.(':scope > .tc-body > .tc-p'), v = el.querySelector?.(':scope > .tc-body > .tc-v');
  const life = el.querySelector?.('.pb-life');
  return {
    el, zone, ...m, cs: undefined,
    vw: m.cs.getPropertyValue('--w').trim(),
    pv: p || v ? [p?.textContent ?? '', v?.textContent ?? ''] : null,
    life: life ? life.textContent : null,
  };
}

/**
 * Remember where every card ([data-uid]) and player bar ([data-p]) is.
 * Returns a Map of key → DOMRect (see keyOf). Call it just before a render.
 */
export function capture(root = document) {
  const map = new Map();
  for (const el of root.querySelectorAll(SEL)) {
    const k = keyOf(el);
    if (k == null || map.has(k) || el.closest('#fx-layer')) continue;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) continue;
    map.set(k, r);
    INFO.set(r, snap(el, r));
  }
  return map;
}

/**
 * After a render: everything that existed before glides from where it was to
 * where it is now (a card played from the hand is tossed onto the board,
 * creatures slide over when one leaves, a creature that attacked tilts).
 * New elements enter: hand cards are drawn in from the deck, tokens
 * materialise, other creatures drop onto the table.
 *
 * opts: duration, delay (old positions are held meanwhile),
 *       enter: 'auto' | 'none' | 'draw' | 'drop' | 'materialize' | 'fade' | (el) => one of those,
 *       exclude: elements or keys to leave alone, drawFrom: DOMRect where drawn cards come from.
 * Elements with .fx-hidden (e.g. waiting for showCard) are skipped.
 */
export function flip(root, before, o = {}) {
  if (!root || !before) return Promise.resolve();
  const excl = new Set((o.exclude || []).map((x) => (x && typeof x === 'object' ? x : String(x))));
  const items = [];
  for (const el of root.querySelectorAll(SEL)) {
    const k = keyOf(el);
    if (k == null || excl.has(el) || excl.has(k) || el.classList.contains('fx-hidden') || el.closest('#fx-layer')) continue;
    if (el.classList.contains('dragging') || el.classList.contains('returning')) continue;
    items.push({ el, k, old: before.get(k) });
  }
  for (const it of items) {
    it.r = it.el.getBoundingClientRect();
    it.m = measure(it.el, it.r);
    it.m.zone = it.el.classList.contains('in-hand') ? 'hand' : it.el.classList.contains('tcard') ? 'board' : 'other';
    if (it.old) it.a = INFO.get(it.old) || { cx: it.old.left + it.old.width / 2, cy: it.old.top + it.old.height / 2, w: it.old.width, h: it.old.height, ang: 0, sc: 1 };
  }
  const jobs = [];
  let drawn = 0;
  for (const it of items) {
    if (it.a) jobs.push(moveFrom(it, o));
    else if (before.size) jobs.push(enter(it.el, it.m, o, it.el.classList.contains('in-hand') ? drawn++ : 0));
  }
  return Promise.all(jobs).then(noop);
}

function moveFrom({ el, a, m: b }, o) {
  const s = clamp((a.w * a.sc) / ((b.w || 1) * (b.sc || 1)), 0.15, 6);
  const dx = a.cx - b.cx, dy = a.cy - b.cy, dAng = normDeg(a.ang - b.ang);
  const pops = () => popChanges(el, a);
  if (Math.abs(dx) < 0.6 && Math.abs(dy) < 0.6 && Math.abs(dAng) < 0.4 && Math.abs(s - 1) < 0.015) { pops(); return Promise.resolve(); }
  const dist = Math.hypot(dx, dy);
  const toss = (a.zone && b.zone && a.zone !== b.zone) || dist > 170;
  const delay = o.delay || 0;
  let anim;
  if (toss) {
    const arc = clamp(dist * 0.14, 12, 50);
    el.classList.add('fx-air');
    anim = run(el, [
      { ...pose(b, dx, dy, dAng, s), offset: 0, easing: 'cubic-bezier(.2,.55,.35,1)' },
      { ...pose(b, dx * 0.38, dy * 0.38 - arc, dAng * 0.3, lerp(s, 1, 0.6) * 1.16), offset: 0.5, easing: 'cubic-bezier(.5,0,.75,.55)' },
      { ...pose(b, 0, -3, 0, 1.035), offset: 0.84, easing: 'ease-out' },
      { ...pose(b, 0, 1, 0, 0.975), offset: 0.92 },
      { ...pose(b, 0, 0, 0, 1), offset: 1 },
    ], { duration: o.duration ?? 560, delay, easing: 'linear', fill: 'backwards' });
    if (b.zone === 'board') setTimeout(() => { if (el.isConnected) dust(el); }, D(delay + (o.duration ?? 560) * 0.84));
  } else {
    anim = run(el, springFrames(b, dx, dy, dAng, s), { duration: o.duration ?? 440, delay, easing: 'linear', fill: 'backwards' });
  }
  return done(anim).then(() => { el.classList.remove('fx-air'); pops(); });
}

// Pop the P/V coins (or a player's life) when their numbers changed.
function popChanges(el, a) {
  if (a.pv) {
    const p = el.querySelector(':scope > .tc-body > .tc-p'), v = el.querySelector(':scope > .tc-body > .tc-v');
    if (p && p.textContent !== a.pv[0]) pop(p);
    if (v && v.textContent !== a.pv[1]) pop(v);
  }
  if (a.life != null) {
    const l = el.querySelector('.pb-life');
    if (l && l.textContent !== a.life) pop(l);
  }
}
function pop(node) {
  if (isReduced()) return;
  node.classList.remove('fx-pop');
  void node.offsetWidth;
  node.classList.add('fx-pop');
  node.addEventListener('animationend', () => node.classList.remove('fx-pop'), { once: true });
}

function enter(el, b, o, i) {
  const mode = typeof o.enter === 'function' ? o.enter(el)
    : o.enter && o.enter !== 'auto' ? o.enter
      : el.classList.contains('in-hand') ? 'draw'
        : el.classList.contains('token') ? 'materialize'
          : el.classList.contains('tcard') ? 'drop' : 'fade';
  if (!mode || mode === 'none') return Promise.resolve();
  if (mode === 'materialize') return materialize(el, { delay: o.delay });
  if (mode === 'draw') return drawIn(el, b, o.drawFrom, (o.delay || 0) + i * 120);
  if (mode === 'drop') return dropIn(el, b, o.delay || 0);
  return play(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: o.delay || 0, fill: 'backwards' });
}

function drawIn(el, b, from, delay) {
  const st = stageRect();
  const start = from ? centre(from) : { x: st.right + b.w * 0.4, y: st.bottom + b.h * 0.3 };
  const dx = start.x - b.cx, dy = start.y - b.cy;
  el.classList.add('fx-air');
  return play(el, [
    { ...pose(b, dx, dy, 38, 0.7), offset: 0, easing: 'cubic-bezier(.2,.7,.3,1)' },
    { ...pose(b, dx * 0.12, -22, 6, 1.12), offset: 0.62, easing: 'cubic-bezier(.4,0,.6,1)' },
    { ...pose(b, 0, 2, 0, 0.985), offset: 0.86 },
    { ...pose(b, 0, 0, 0, 1), offset: 1 },
  ], { duration: 620, delay, easing: 'linear', fill: 'backwards' }).then(() => el.classList.remove('fx-air'));
}

function dropIn(el, b, delay) {
  setTimeout(() => { if (el.isConnected) dust(el); }, D(delay + 300));
  return play(el, [
    { ...pose(b, 0, -24, 0, 1.32), opacity: 0, offset: 0, easing: 'cubic-bezier(.5,0,.8,.6)' },
    { ...pose(b, 0, 2, 0, 0.95), opacity: 1, offset: 0.55, easing: 'cubic-bezier(.3,.7,.4,1)' },
    { ...pose(b, 0, -1.5, 0, 1.015), opacity: 1, offset: 0.78 },
    { ...pose(b, 0, 0, 0, 1), opacity: 1, offset: 1 },
  ], { duration: 540, delay, easing: 'linear', fill: 'backwards' });
}

// A puff of dust where a card lands.
function dust(el) {
  if (isReduced()) return;
  const r = el.getBoundingClientRect();
  const y = r.bottom - 3;
  particles(r.left + 4, y, { n: 5, kind: 'ash', dir: 180, spread: 50, vmin: 30, vmax: 80, gravity: -20, life: 520, size: [3, 6] });
  particles(r.right - 4, y, { n: 5, kind: 'ash', dir: 0, spread: 50, vmin: 30, vmax: 80, gravity: -20, life: 520, size: [3, 6] });
  shake(0.5);
}

/**
 * Clone an element into the overlay at its current screen position (keeping
 * its tilt and scale). With (before, key), clone the element that capture()
 * saw, at the place it saw it, even if it has left the DOM since.
 * Returns the clone (class .fx-ghost), or null.
 */
export function ghost(src, key) {
  let info;
  if (src instanceof Map) {
    const r = src.get(String(key));
    info = r && INFO.get(r);
  } else if (src && src.nodeType === 1) {
    if (src.classList.contains('fx-ghost')) return src;
    const r = src.getBoundingClientRect();
    info = snap(src, r);
  }
  if (!info || !info.el) return null;
  const g = info.el.cloneNode(true);
  g.removeAttribute('id');
  g.classList.remove('target', 'aim', 'aiming', 'touched', 'dragging', 'returning', 'drop-ok', 'fx-air', 'fx-lunge', 'fx-hidden', 'fx-nofx');
  g.classList.add('fx-ghost');
  g.querySelectorAll('.fx-flash, .fx-cracks').forEach((n) => n.remove());
  const st = g.style;
  st.position = 'absolute';
  st.left = `${(info.cx - info.w / 2).toFixed(1)}px`;
  st.top = `${(info.cy - info.h / 2).toFixed(1)}px`;
  st.width = `${info.w}px`;
  st.height = `${info.h}px`;
  st.margin = '0';
  st.translate = st.rotate = st.scale = 'none';
  st.transition = 'none';
  st.transform = `rotate(${info.ang.toFixed(2)}deg) scale(${info.sc.toFixed(4)})`;
  st.visibility = 'visible';
  st.opacity = '1';
  st.zIndex = '';
  if (info.vw) st.setProperty('--w', info.vw);
  GHOST.set(g, { ang: info.ang, sc: info.sc });
  layer().appendChild(g);
  return g;
}
const GHOST = new WeakMap();

// ══════════════════════════════════════════════════════════════════
//  5. Particles, flashes, rings, shake
// ══════════════════════════════════════════════════════════════════

let LIVE = 0;
const CAP = 200;   // never more particles than this at once (cheap phones)

function particles(x, y, o = {}) {
  if (isReduced()) return Promise.resolve();
  const n = Math.min(Math.round(o.n ?? 12), Math.max(0, CAP - LIVE));
  if (n <= 0) return Promise.resolve();
  const L = layer(), out = [];
  const g = o.gravity ?? 260, life = o.life ?? 700, kind = o.kind || 'dot';
  const [s0, s1] = o.size || [3, 6];
  const jit = Array.isArray(o.jitter) ? o.jitter : [o.jitter || 0, o.jitter || 0];
  const spread = o.spread ?? 360, dir = o.dir ?? 0;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = kind === 'dot' ? 'fx-p' : `fx-p ${kind}`;
    const col = Array.isArray(o.color) ? o.color[i % o.color.length] : o.color || '#ffcf7a';
    p.style.cssText = `left:${(x + rand(-jit[0], jit[0])).toFixed(1)}px;top:${(y + rand(-jit[1], jit[1])).toFixed(1)}px;--s:${rand(s0, s1).toFixed(1)}px;--c:${col}`;
    const ang = ((dir + rand(-spread / 2, spread / 2)) * Math.PI) / 180;
    const v = rand(o.vmin ?? 70, o.vmax ?? 190);
    const T = life * rand(0.7, 1.15), t = T / 1000;
    const vx = Math.cos(ang) * v, vy = Math.sin(ang) * v;
    const turn = kind === 'streak' ? (ang * 180) / Math.PI - 90 : rand(-200, 200);
    const frames = [];
    for (const k of [0, 0.25, 0.5, 0.75, 1]) {
      const e = 1 - (1 - k) * (1 - k);                          // air drag
      const px = vx * t * e, py = vy * t * e + 0.5 * g * (k * t) ** 2;
      const sc = kind === 'ash' ? 1 - 0.3 * k : 1 - 0.8 * k;
      const rot = kind === 'streak' ? turn : turn * k;
      frames.push({ transform: `translate(${px.toFixed(1)}px,${py.toFixed(1)}px) rotate(${rot.toFixed(0)}deg) scale(${sc.toFixed(2)})`, opacity: k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5, offset: k });
    }
    L.appendChild(p);
    LIVE++;
    out.push(play(p, frames, { duration: T, delay: (o.delay || 0) + rand(0, o.stagger || 0), easing: 'linear' }).then(() => { p.remove(); LIVE--; }));
  }
  return Promise.all(out).then(noop);
}

function ring(x, y, o = {}) {
  if (isReduced()) return Promise.resolve();
  const size = o.size ?? 80;
  const el = add('fx-ring', `left:${(x - size / 2).toFixed(1)}px;top:${(y - size / 2).toFixed(1)}px;width:${size}px;height:${size}px;--c:${o.color || '#ffd27a'};border-width:${o.width ?? 3}px`);
  return play(el, [{ transform: 'scale(.2)', opacity: 0.95 }, { transform: `scale(${o.to ?? 1.35})`, opacity: 0 }],
    { duration: o.duration ?? 450, delay: o.delay || 0, easing: 'cubic-bezier(.15,.7,.3,1)' }).then(() => el.remove());
}

function glow(x, y, o = {}) {
  if (isReduced()) return Promise.resolve();
  const size = o.size ?? 120;
  const el = add(`fx-glow${o.white ? ' white' : ''}`, `left:${(x - size / 2).toFixed(1)}px;top:${(y - size / 2).toFixed(1)}px;width:${size}px;height:${size}px;--c:${o.color || '#ffd27a'}`);
  return play(el, [
    { transform: 'scale(.3)', opacity: 0 },
    { transform: `scale(${o.mid ?? 1})`, opacity: o.peak ?? 0.9, offset: 0.3 },
    { transform: `scale(${o.to ?? 1.5})`, opacity: 0 },
  ], { duration: o.duration ?? 600, delay: o.delay || 0, easing: 'cubic-bezier(.2,.6,.3,1)' }).then(() => el.remove());
}

function flashOn(el, color = '#fff', peak = 0.9, dur = 320) {
  if (!el || isReduced()) return Promise.resolve();
  const body = el.querySelector?.(':scope > .tc-body');
  let f;
  if (body) {
    f = document.createElement('div');
    f.className = 'fx-flash';
    f.style.background = color;
    body.appendChild(f);
  } else {
    const r = el.getBoundingClientRect();
    f = add('fx-flash', `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;border-radius:${getComputedStyle(el).borderRadius};background:${color}`);
  }
  return play(f, [{ opacity: peak }, { opacity: 0 }], { duration: dur, easing: 'cubic-bezier(.1,.7,.25,1)' }).then(() => f.remove());
}

// A jolt on the card's body (not the card), so it never fights a lunge.
function jolt(el, strength = 2) {
  if (!el || isReduced()) return Promise.resolve();
  const body = el.querySelector?.(':scope > .tc-body') || el;
  const a = clamp(1.5 + strength * 1.3, 1.5, 9);
  return play(body, [
    { translate: '0px 0px' },
    { translate: `${-a}px ${a * 0.35}px`, offset: 0.14 },
    { translate: `${a * 0.85}px ${-a * 0.3}px`, offset: 0.3 },
    { translate: `${-a * 0.55}px ${a * 0.15}px`, offset: 0.48 },
    { translate: `${a * 0.3}px 0px`, offset: 0.68 },
    { translate: '0px 0px' },
  ], { duration: 340 + strength * 18, easing: 'linear', fill: 'none' });
}

let SHAKE = null;
/** Shake the stage: amplitude grows with strength (about damage) and is capped. */
export function shake(strength = 2, el = stage()) {
  if (!el || isReduced() || strength <= 0) return Promise.resolve();
  const amp = clamp(1 + strength * 1.5, 1, 11);
  const n = 8, frames = [];
  for (let i = 0; i <= n; i++) {
    const k = 1 - i / n, a = amp * k * k;
    frames.push({ translate: i === n ? '0px 0px' : `${rand(-a, a).toFixed(1)}px ${rand(-a * 0.75, a * 0.75).toFixed(1)}px` });
  }
  if (SHAKE && SHAKE.amp > amp && SHAKE.anim?.playState === 'running') return done(SHAKE.anim);
  SHAKE?.anim?.cancel();
  const anim = run(el, frames, { duration: clamp(220 + strength * 40, 220, 560), easing: 'linear', fill: 'none' });
  SHAKE = { amp, anim };
  return done(anim);
}

// ══════════════════════════════════════════════════════════════════
//  6. Events
// ══════════════════════════════════════════════════════════════════

/** Shake, white flash, a burst of sparks and a ring on the element. strength ≈ damage (1-10). */
export function impact(el, o = {}) {
  if (!el) return Promise.resolve();
  const s = clamp(o.strength ?? 2, 0.3, 10);
  const color = o.color || '#ffcf7a';
  const r = el.getBoundingClientRect();
  const c = o.at || centre(r);
  return Promise.all([
    jolt(el, s),
    o.flash === false ? null : flashOn(el, '#fff', clamp(0.38 + s * 0.04, 0.4, 0.62), 200),
    particles(c.x, c.y, { n: 6 + s * 3, color: [color, '#fff4d6', color], kind: 'streak', vmin: 110, vmax: 230 + s * 18, gravity: 320, life: 480, size: [4, 7] }),
    particles(c.x, c.y, { n: 3 + s * 1.5, color, vmin: 40, vmax: 120, gravity: 200, life: 700, size: [4, 8] }),
    ring(c.x, c.y, { color, size: Math.max(r.width, r.height) * 0.95, duration: 420 }),
    o.shake === false ? null : shake(s),
  ]).then(noop);
}

/** A big number that pops on the element and drifts up. kind: 'damage' | 'heal' | 'buff'. */
export function number(el, text, o = {}) {
  if (!el) return Promise.resolve();
  const str = String(text);
  const kind = o.kind || (/^\s*\+/.test(str) ? 'heal' : 'damage');
  const r = el.getBoundingClientRect();
  const k = NUMS.get(el) || 0;
  NUMS.set(el, k + 1);
  const mag = Number((/\d+/.exec(str) || [1])[0]) || 1;
  const fs = o.size ?? clamp(30 + mag * 2.6, 30, 56);
  const x = r.left + r.width / 2 + (k ? (k % 2 ? 16 : -16) : 0), y = r.top + r.height * 0.42 - k * 24;
  const n = add(`fx-num k-${kind}`, `left:${x.toFixed(1)}px;top:${y.toFixed(1)}px;--fs:${fs.toFixed(0)}px;translate:-50% -50%`);
  n.textContent = str;
  const release = () => { n.remove(); NUMS.set(el, Math.max(0, (NUMS.get(el) || 1) - 1)); };
  if (isReduced()) return sleep(HOLD(800)).then(release);
  const drift = rand(-10, 10);
  return play(n, [
    { transform: 'translateY(8px) scale(.2)', opacity: 0 },
    { transform: 'translateY(-6px) scale(1.45)', opacity: 1, offset: 0.13 },
    { transform: 'translateY(0px) scale(1)', opacity: 1, offset: 0.26 },
    { transform: `translate(${(drift * 0.4).toFixed(1)}px,-16px) scale(1)`, opacity: 1, offset: 0.64 },
    { transform: `translate(${drift.toFixed(1)}px,-48px) scale(.9)`, opacity: 0 },
  ], { duration: o.duration ?? 1200, easing: 'cubic-bezier(.25,.7,.35,1)' }).then(release);
}
const NUMS = new WeakMap();

/**
 * The attacker winds up, charges into the target with overshoot, hits
 * (impact() on the target; then onHit(target)) and springs back.
 * opts: strength (≈ damage), color, onHit.
 */
export async function lunge(attacker, target, o = {}) {
  if (!attacker || !target) return;
  const ra = attacker.getBoundingClientRect(), rt = target.getBoundingClientRect();
  const A = centre(ra), B = centre(rt);
  const dx = B.x - A.x, dy = B.y - A.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
  const gap = dist - edgeDist(ra, ux, uy) - edgeDist(rt, ux, uy);
  const reach = Math.max(0, gap + Math.min(12, rt.height * 0.14));
  const back = Math.min(18, 7 + dist * 0.05);
  const lean = clamp(ux * 18, -18, 18);
  const s = clamp(o.strength ?? 2, 0.3, 10);
  attacker.classList.add('fx-lunge');
  const a1 = run(attacker, [
    { translate: '0px 0px', scale: 1, rotate: '0deg', easing: 'cubic-bezier(.3,0,.5,1)' },
    { translate: `${(-ux * back).toFixed(1)}px ${(-uy * back).toFixed(1)}px`, scale: 1.1, rotate: `${(-lean * 0.35).toFixed(1)}deg`, offset: 0.58, easing: 'cubic-bezier(.75,0,.95,.45)' },
    { translate: `${(ux * reach).toFixed(1)}px ${(uy * reach).toFixed(1)}px`, scale: 1.14, rotate: `${lean.toFixed(1)}deg` },
  ], { duration: 400, fill: 'forwards' });
  await done(a1);
  const hit = impact(target, { strength: s, color: o.color });
  try { o.onHit?.(target); } catch (err) { console.error(err); }
  const a2 = run(attacker, [
    { translate: `${(ux * reach).toFixed(1)}px ${(uy * reach).toFixed(1)}px`, scale: 1.14, rotate: `${lean.toFixed(1)}deg` },
    { translate: `${(ux * (reach - 16)).toFixed(1)}px ${(uy * (reach - 16)).toFixed(1)}px`, scale: 1.04, rotate: `${(lean * 0.25).toFixed(1)}deg`, offset: 0.22 },
    { translate: '0px 0px', scale: 1, rotate: '0deg' },
  ], { duration: 380, easing: 'cubic-bezier(.3,.8,.35,1.18)', fill: 'none' });
  a1?.cancel();
  await done(a2);
  attacker.classList.remove('fx-lunge');
  await hit;
}

/** Two creatures rush at each other and collide in the middle. opts: strength, color, onHit(a, b). */
export async function clash(a, b, o = {}) {
  if (!a || !b) return;
  const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
  const A = centre(ra), B = centre(rb);
  const dx = B.x - A.x, dy = B.y - A.y, dist = Math.hypot(dx, dy) || 1, ux = dx / dist, uy = dy / dist;
  const ea = edgeDist(ra, ux, uy), eb = edgeDist(rb, ux, uy);
  const gap = Math.max(0, dist - ea - eb);
  const meet = { x: A.x + ux * (ea + gap / 2), y: A.y + uy * (ea + gap / 2) };
  const da = gap / 2 + 5, db = gap / 2 + 5, back = 13;
  const lean = clamp(ux * 14, -14, 14);
  const s = clamp(o.strength ?? 3, 0.3, 10);
  const color = o.color || '#ffcf7a';
  a.classList.add('fx-lunge'); b.classList.add('fx-lunge');
  const go = (el, u, v, d, sign) => run(el, [
    { translate: '0px 0px', scale: 1, rotate: '0deg', easing: 'cubic-bezier(.3,0,.5,1)' },
    { translate: `${(-u * back).toFixed(1)}px ${(-v * back).toFixed(1)}px`, scale: 1.08, rotate: `${(-lean * 0.3 * sign).toFixed(1)}deg`, offset: 0.55, easing: 'cubic-bezier(.75,0,.95,.45)' },
    { translate: `${(u * d).toFixed(1)}px ${(v * d).toFixed(1)}px`, scale: 1.13, rotate: `${(lean * sign).toFixed(1)}deg` },
  ], { duration: 420, fill: 'forwards' });
  const a1 = go(a, ux, uy, da, 1), b1 = go(b, -ux, -uy, db, -1);
  await Promise.all([done(a1), done(b1)]);
  const hits = Promise.all([
    impact(a, { strength: s, color, shake: false, at: meet }),
    impact(b, { strength: s, color, shake: false, at: meet }),
    particles(meet.x, meet.y, { n: 10 + s * 2, color: ['#fff', color], kind: 'streak', vmin: 160, vmax: 320, gravity: 260, life: 520, size: [5, 8] }),
    glow(meet.x, meet.y, { color, size: 150 + s * 10, duration: 480, peak: 0.85 }),
    shake(s * 1.25),
  ]);
  try { o.onHit?.(a, b); } catch (err) { console.error(err); }
  const knock = (el, u, v, d, sign) => run(el, [
    { translate: `${(u * d).toFixed(1)}px ${(v * d).toFixed(1)}px`, scale: 1.13, rotate: `${(lean * sign).toFixed(1)}deg` },
    { translate: `${(u * (d - 22)).toFixed(1)}px ${(v * (d - 22)).toFixed(1)}px`, scale: 1.05, rotate: `${(-lean * 0.3 * sign).toFixed(1)}deg`, offset: 0.25 },
    { translate: '0px 0px', scale: 1, rotate: '0deg' },
  ], { duration: 460, easing: 'cubic-bezier(.3,.8,.35,1.2)', fill: 'none' });
  const a2 = knock(a, ux, uy, da, 1), b2 = knock(b, -ux, -uy, db, -1);
  a1?.cancel(); b1?.cancel();
  await Promise.all([done(a2), done(b2)]);
  a.classList.remove('fx-lunge'); b.classList.remove('fx-lunge');
  await hits;
}

/** A spell hits: glow, shock rings, sparks and a flash in the spell's colour. */
export function burst(el, o = {}) {
  if (!el) return Promise.resolve();
  const color = o.color || '#9fd8ff';
  const r = el.getBoundingClientRect(), c = centre(r), size = Math.max(r.width, r.height);
  return Promise.all([
    glow(c.x, c.y, { color, size: size * 2.3, duration: 640, peak: 0.95 }),
    ring(c.x, c.y, { color, size: size * 1.5, duration: 540, width: 4 }),
    ring(c.x, c.y, { color: '#fffaf0', size: size * 0.9, duration: 430, width: 2, delay: 70 }),
    particles(c.x, c.y, { n: 16, color: [color, '#ffffff'], kind: 'streak', vmin: 130, vmax: 270, gravity: 90, life: 560, size: [4, 7] }),
    particles(c.x, c.y, { n: 10, color, vmin: 25, vmax: 90, gravity: -50, life: 950, size: [3, 6], jitter: size * 0.2 }),
    flashOn(el, color, 0.75, 420),
    jolt(el, o.strength ?? 2),
    shake(o.strength ?? 1.5),
  ]).then(noop);
}

/**
 * A board-wide sweep (a wall of fire, a tide): a band of light crosses the
 * root's rect and every .tcard in it takes a hit as it passes.
 * opts: color, dir ('right' | 'left' | 'up' | 'down'), duration, strength,
 *       targets (default: root's .tcard), onHit(el).
 */
export function wave(root, o = {}) {
  const host = root || stage();
  const rr = host?.getBoundingClientRect?.() || stageRect();
  const color = o.color || '#ff7a2e';
  const dir = o.dir || 'right';
  const horiz = dir === 'left' || dir === 'right';
  const dur = o.duration ?? 1000;
  const targets = o.targets || (host?.querySelectorAll ? [...host.querySelectorAll('.tcard')] : []);
  const jobs = [];
  if (isReduced()) {
    for (const t of targets) { try { o.onHit?.(t); } catch (err) { console.error(err); } }
    return Promise.resolve();
  }
  const box = add(`fx-wave ${dir}`, `left:${rr.left}px;top:${rr.top}px;width:${rr.width}px;height:${rr.height}px;--c:${color}`);
  const tint = add('fx-wave-tint', '', box);
  const len = horiz ? rr.width : rr.height;
  const band = len * 0.7, span = len + band;
  const bandEl = add('fx-wave-band', horiz ? `left:0;width:${band}px;top:-10%;bottom:-10%` : `top:0;height:${band}px;left:-10%;right:-10%`, box);
  const tf = (p) => (horiz ? `translateX(${p}px)` : `translateY(${p}px)`);
  const from = dir === 'right' || dir === 'down' ? -band : len;
  const to = dir === 'right' || dir === 'down' ? len : -band;
  jobs.push(play(bandEl, [{ transform: tf(from) }, { transform: tf(to) }], { duration: dur, easing: 'linear' }));
  jobs.push(play(tint, [{ opacity: 0 }, { opacity: 0.16, offset: 0.45 }, { opacity: 0 }], { duration: dur, easing: 'ease-in-out' }));
  // the bright core sits 78% along the band, in the direction of travel
  const coreAt = (frac) => -band * 0.22 + frac * span;
  for (let i = 1; i <= 6; i++) {
    const frac = i / 7, pos = coreAt(frac);
    if (pos < 0 || pos > len) continue;
    const along = dir === 'right' ? rr.left + pos : dir === 'left' ? rr.right - pos : dir === 'down' ? rr.top + pos : rr.bottom - pos;
    jobs.push(sleep(D(dur * frac)).then(() => {
      for (let j = 0; j < 3; j++) {
        const cross = horiz ? rr.top + rand(0.1, 0.9) * rr.height : rr.left + rand(0.1, 0.9) * rr.width;
        particles(horiz ? along : cross, horiz ? cross : along, { n: 4, color: [color, '#ffe9b8'], dir: -90, spread: 70, vmin: 30, vmax: 110, gravity: -90, life: 800, size: [3, 6] });
      }
    }));
  }
  for (const t of targets) {
    const c = centre(t.getBoundingClientRect());
    const pos = dir === 'right' ? c.x - rr.left : dir === 'left' ? rr.right - c.x : dir === 'down' ? c.y - rr.top : rr.bottom - c.y;
    const frac = clamp((pos + band * 0.22) / span, 0, 1);
    jobs.push(sleep(D(dur * frac)).then(() => {
      if (!t.isConnected) return;
      try { o.onHit?.(t); } catch (err) { console.error(err); }
      return impact(t, { color, strength: o.strength ?? 1.4, shake: false });
    }));
  }
  jobs.push(sleep(D(dur * 0.35)).then(() => shake(o.strength ?? 1.6)));
  return Promise.all(jobs).then(() => box.remove());
}

/** A creature (often a token) appears out of a pillar of light. */
export function materialize(el, o = {}) {
  if (!el) return Promise.resolve();
  const r = el.getBoundingClientRect(), c = centre(r);
  const b = measure(el, r);
  const delay = o.delay || 0;
  const jobs = [];
  if (!isReduced()) {
    const pw = r.width * 1.3, ph = r.height * 2.5;
    const pillar = add('fx-pillar', `left:${(c.x - pw / 2).toFixed(1)}px;top:${(r.bottom - ph).toFixed(1)}px;width:${pw.toFixed(1)}px;height:${ph.toFixed(1)}px`);
    jobs.push(play(pillar, [
      { transform: 'scale(.35, 0)', opacity: 0 },
      { transform: 'scale(1, 1)', opacity: 0.95, offset: 0.35 },
      { transform: 'scale(.15, 1.05)', opacity: 0 },
    ], { duration: 820, delay, easing: 'cubic-bezier(.3,.6,.3,1)' }).then(() => pillar.remove()));
    jobs.push(glow(c.x, c.y, { white: true, size: r.width * 2.6, duration: 760, delay: delay + 160, peak: 0.9 }));
    jobs.push(particles(c.x, r.bottom - r.height * 0.15, { n: 14, color: ['#fff7de', o.color || '#ffe0a0'], dir: -90, spread: 70, gravity: -80, vmin: 20, vmax: 80, life: 1050, jitter: [r.width * 0.4, 4], delay: delay + 140, stagger: 200 }));
    jobs.push(sleep(D(delay + 220)).then(() => flashOn(el, '#fff8e0', 0.95, 620)));
  }
  jobs.push(play(el, [
    { ...pose(b, 0, 10, 0, 0.6), opacity: 0, offset: 0, easing: 'cubic-bezier(.3,.7,.3,1)' },
    { ...pose(b, 0, -4, 0, 1.06), opacity: 1, offset: 0.6, easing: 'ease-in-out' },
    { ...pose(b, 0, 0, 0, 1), opacity: 1, offset: 1 },
  ], { duration: 640, delay: delay + 180, easing: 'linear', fill: 'backwards' }));
  return Promise.all(jobs).then(noop);
}

// ── death ───────────────────────────────────────────────────────────
let DYING = 0;

/**
 * A creature dies: it cracks with light and crumbles into falling shards,
 * embers and ash ({ style: 'crumble' }, the default), or brightens and
 * dissolves into motes ({ style: 'light' }, the default for tokens).
 * Pass a ghost (see ghost()), a live element (it is ghosted and hidden), or
 * (before, key) to use what capture() saw. opts: style, color.
 */
export async function death(target, a, b) {
  let g, o;
  if (target instanceof Map) { g = ghost(target, a); o = b || {}; }
  else {
    o = a || {};
    if (!target) return;
    if (target.classList?.contains('fx-ghost')) g = target;
    else { g = ghost(target); target.classList?.add('fx-hidden'); }
  }
  if (!g) return;
  const style = o.style || (g.classList.contains('token') ? 'light' : 'crumble');
  try {
    if (isReduced()) await play(g, [{ opacity: 1 }, { opacity: 0 }], { duration: 120 });
    else if (style === 'light') await dissolve(g, o);
    else await crumble(g, o);
  } catch (err) {
    console.warn('fx: death', err);
  } finally {
    g.remove();
  }
}

function heatOf(g) {
  const fl = getComputedStyle(g).getPropertyValue('--fl').trim();
  return fl || '#ff9a4a';
}

// A jittered grid cut into quads and triangles whose inner edges zig-zag like
// real fractures. Neighbouring shards share their edges exactly, so they tile
// the card; `lines` are those inner edges (the cracks).
function shatter(w, h, cols, rows, split = true) {
  const pts = [];
  for (let j = 0; j <= rows; j++) {
    for (let i = 0; i <= cols; i++) {
      let x = (i / cols) * w, y = (j / rows) * h;
      if (i > 0 && i < cols) x += rand(-0.28, 0.28) * (w / cols);
      if (j > 0 && j < rows) y += rand(-0.26, 0.26) * (h / rows);
      pts.push([x, y]);
    }
  }
  const P = (i, j) => pts[j * (cols + 1) + i];
  const edges = new Map(), lines = [];
  const border = (a, b) => (a[0] === b[0] && (a[0] === 0 || a[0] === cols)) || (a[1] === b[1] && (a[1] === 0 || a[1] === rows));
  // the polyline from grid index a to grid index b, made once per edge
  const edge = (a, b) => {
    const ka = `${a[0]},${a[1]}`, kb = `${b[0]},${b[1]}`;
    const fwd = ka < kb, key = fwd ? `${ka}|${kb}` : `${kb}|${ka}`;
    let line = edges.get(key);
    if (!line) {
      const [s, e] = fwd ? [a, b] : [b, a];
      const p = P(s[0], s[1]), q = P(e[0], e[1]);
      line = [p];
      if (!border(s, e)) {
        const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
        const n = Math.random() < 0.5 ? 2 : 3;
        for (let k = 1; k <= n; k++) {
          const t = k / (n + 1) + rand(-0.07, 0.07), off = rand(-0.14, 0.14) * len;
          line.push([p[0] + dx * t + nx * off, p[1] + dy * t + ny * off]);
        }
        lines.push(line);
      }
      line.push(q);
      edges.set(key, line);
    }
    return fwd ? line : [...line].reverse();
  };
  const ring = (...corners) => {
    const out = [];
    corners.forEach((c, k) => out.push(...edge(c, corners[(k + 1) % corners.length]).slice(0, -1)));
    return out;
  };
  const cells = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = [i, j], b = [i + 1, j], c = [i + 1, j + 1], d = [i, j + 1];
      const k = split ? Math.random() : 0;
      if (k < 0.4) cells.push(ring(a, b, c, d));
      else if (k < 0.7) cells.push(ring(a, b, c), ring(a, c, d));
      else cells.push(ring(a, b, d), ring(b, c, d));
    }
  }
  return { cells, lines };
}

async function crumble(g, o) {
  const w = g.offsetWidth, h = g.offsetHeight;
  const r = g.getBoundingClientRect(), c = centre(r);
  const heat = o.color || heatOf(g);
  const many = DYING >= 2;
  DYING++;
  try {
    const grid = shatter(w, h, many ? 2 : 3, many ? 3 : 4, !many);
    // 1. struck: cracks of light run through it
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fx-cracks');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    // the cracks run outwards from the point of the blow
    const hit = [w * rand(0.35, 0.65), h * rand(0.3, 0.55)];
    const far = Math.hypot(w, h) / 2;
    const near = (pl) => Math.min(...pl.map((p) => Math.hypot(p[0] - hit[0], p[1] - hit[1])));
    const order = grid.lines.map((pl) => {
      // draw each crack starting from its end nearer the blow
      const a = pl[0], b = pl[pl.length - 1];
      const flipIt = Math.hypot(b[0] - hit[0], b[1] - hit[1]) < Math.hypot(a[0] - hit[0], a[1] - hit[1]);
      return { pl: flipIt ? [...pl].reverse() : pl, delay: (near(pl) / far) * 150 };
    });
    svg.innerHTML = order.map(({ pl }) => {
      const d = `M${pl.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}`;
      return `<path d="${d}" pathLength="1" stroke="${heat}" stroke-width="4.5" opacity=".65"/><path d="${d}" pathLength="1" stroke="#fff6de" stroke-width="1.4"/>`;
    }).join('');
    (g.querySelector(':scope > .tc-body') || g).appendChild(svg);
    const paths = [...svg.querySelectorAll('path')];
    for (const p of paths) { p.style.strokeDasharray = '1 1'; p.style.strokeDashoffset = '1'; }
    jolt(g, 2.5);
    flashOn(g, '#fff', 0.6, 220);
    const hp = { x: r.left + (hit[0] / w) * r.width, y: r.top + (hit[1] / h) * r.height };
    particles(hp.x, hp.y, { n: 8, color: ['#fff', heat], kind: 'streak', vmin: 90, vmax: 200, gravity: 260, life: 420, size: [4, 6] });
    await Promise.all(paths.map((p, k) => play(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: 230, delay: order[k >> 1].delay, easing: 'cubic-bezier(.3,.6,.3,1)' })));
    await sleep(D(130));
    // 2. it breaks: shards fall, embers rise, ash drifts down
    const gi = GHOST.get(g) || { ang: 0, sc: 1 };
    const rad = (gi.ang * Math.PI) / 180, cos = Math.cos(rad) * gi.sc, sin = Math.sin(rad) * gi.sc;
    const L = layer();
    svg.remove();                       // each shard carries only its own glowing edge
    const shards = grid.cells.map((poly) => {
      const s = g.cloneNode(true);
      s.classList.add('fx-shard');
      const d = `M${poly.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`;
      const edge = document.createElementNS(NS, 'svg');
      edge.setAttribute('class', 'fx-cracks');
      edge.setAttribute('viewBox', `0 0 ${w} ${h}`);
      edge.setAttribute('preserveAspectRatio', 'none');
      edge.innerHTML = `<path d="${d}" stroke="${heat}" stroke-width="4.5" opacity=".6"/><path d="${d}" stroke="#fff6de" stroke-width="1.3"/>`;
      (s.querySelector(':scope > .tc-body') || s).appendChild(edge);
      const cx = poly.reduce((t, p) => t + p[0], 0) / poly.length, cy = poly.reduce((t, p) => t + p[1], 0) / poly.length;
      // rotate about the shard's own centre, but keep the ghost's turn about the card centre
      const ox = w / 2 - cx, oy = h / 2 - cy;
      const tx = ox - (cos * ox - sin * oy), ty = oy - (sin * ox + cos * oy);
      s.style.clipPath = `polygon(${poly.map((p) => `${p[0].toFixed(1)}px ${p[1].toFixed(1)}px`).join(',')})`;
      s.style.transformOrigin = `${cx.toFixed(1)}px ${cy.toFixed(1)}px`;
      s.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${gi.ang.toFixed(2)}deg) scale(${gi.sc.toFixed(4)})`;
      s.style.willChange = 'transform, opacity';
      L.appendChild(s);
      return { s, cx, cy };
    });
    g.style.visibility = 'hidden';
    const jobs = shards.map(({ s, cx, cy }) => {
      let ux = cx - w / 2, uy = cy - h / 2;
      const ul = Math.hypot(ux, uy) || 1;
      ux /= ul; uy /= ul;
      const out = rand(8, 22), fall = rand(70, 150) + uy * 20, spin = rand(25, 80) * (Math.random() < 0.5 ? -1 : 1);
      return play(s, [
        { translate: '0px 0px', rotate: '0deg', opacity: 1, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { translate: `${(ux * out * 0.7).toFixed(1)}px ${(uy * out * 0.7 - 6).toFixed(1)}px`, rotate: `${(spin * 0.15).toFixed(1)}deg`, opacity: 1, offset: 0.18, easing: 'cubic-bezier(.4,0,.8,.6)' },
        { translate: `${(ux * out).toFixed(1)}px ${(uy * out + fall * 0.42).toFixed(1)}px`, rotate: `${(spin * 0.55).toFixed(1)}deg`, opacity: 0.9, offset: 0.55, easing: 'cubic-bezier(.4,0,.9,.7)' },
        { translate: `${(ux * out * 1.15).toFixed(1)}px ${(uy * out + fall).toFixed(1)}px`, rotate: `${spin.toFixed(1)}deg`, opacity: 0 },
      ], { duration: rand(760, 980), easing: 'linear' });
    });
    jobs.push(particles(c.x, c.y, { n: many ? 10 : 18, color: [heat, '#ffd9a0', '#fff1d0'], dir: -90, spread: 110, vmin: 25, vmax: 95, gravity: -70, life: 1150, size: [3, 6], jitter: [w * 0.4, h * 0.35], stagger: 220 }));
    jobs.push(particles(c.x, c.y, { n: many ? 5 : 9, kind: 'ash', dir: 90, spread: 140, vmin: 10, vmax: 50, gravity: 90, life: 1100, size: [3, 6], jitter: [w * 0.4, h * 0.3], stagger: 200 }));
    jobs.push(glow(c.x, c.y, { color: heat, size: Math.max(w, h) * 1.8, duration: 700, peak: 0.6 }));
    await Promise.all(jobs);
    for (const { s } of shards) s.remove();
  } finally {
    DYING--;
  }
}

async function dissolve(g, o) {
  const w = g.offsetWidth, h = g.offsetHeight;
  const r = g.getBoundingClientRect(), c = centre(r);
  const body = g.querySelector(':scope > .tc-body') || g;
  const f = document.createElement('div');
  f.className = 'fx-flash';
  f.style.background = 'radial-gradient(circle at 50% 45%, #fff, #fff3cf 70%)';
  body.appendChild(f);
  await Promise.all([
    play(f, [{ opacity: 0 }, { opacity: 0.92, offset: 0.4 }, { opacity: 1 }], { duration: 700 }),
    play(g, [{ opacity: 1, scale: 1 }, { opacity: 1, scale: 1.07, offset: 0.45 }, { opacity: 0, scale: 1.14 }], { duration: 860, easing: 'ease-in' }),
    glow(c.x, c.y, { white: true, size: Math.max(w, h) * 2.4, duration: 900, delay: 240, peak: 0.85 }),
    particles(c.x, c.y, { n: 22, color: ['#fffbe8', o.color || '#ffe39a'], dir: -90, spread: 100, gravity: -90, vmin: 20, vmax: 100, life: 1200, jitter: [w * 0.42, h * 0.4], delay: 240, stagger: 320, size: [3, 6] }),
  ]);
}

// ── the big card in the middle ──────────────────────────────────────

function holdFor(ms, el, skippable) {
  return new Promise((resolve) => {
    let t = 0;
    const fin = () => { clearTimeout(t); el.removeEventListener('pointerdown', fin); resolve(); };
    t = setTimeout(fin, ms);
    if (skippable) { el.classList.add('skippable'); el.addEventListener('pointerdown', fin); }
  });
}

/**
 * Show a played card big: it flies from `fromRect` to the middle of the stage,
 * grows to ~70% of its width, holds (`hold` ms, default 1100; a tap skips),
 * then flies down onto `toEl` / `toRect` and lands with a flare, or fades.
 *
 * html: usually cardHTML(card, { cls: 'anim' }).
 * opts: fromRect, toRect, toEl (hidden until the card lands on it; if it has
 *       been re-rendered meanwhile, it is found again by data-uid),
 *       hold, flip (start face down, turn over on the way: an opponent's card),
 *       width (fraction of the stage, default .7), dim (default true), skippable.
 */
export async function showCard(html, o = {}) {
  const st = stageRect();
  const W = Math.round(clamp(st.width * (o.width ?? 0.7), 150, 340));
  const H = Math.round((W * 88) / 63);
  const cx = st.left + st.width / 2, cy = st.top + st.height * 0.45;
  let toEl = o.toEl || null;
  const uid = toEl?.dataset?.uid;
  if (toEl) toEl.classList.add('fx-hidden');
  const dim = o.dim === false ? null : add('fx-dim', `left:${st.left}px;top:${st.top}px;width:${st.width}px;height:${st.height}px`);
  const wrap = add('fx-show', `left:${(cx - W / 2).toFixed(1)}px;top:${(cy - H / 2).toFixed(1)}px;width:${W}px;height:${H}px;will-change:transform,opacity`);
  const inner = document.createElement('div');
  inner.className = 'fx-show-card';
  wrap.appendChild(inner);
  let flipper = null;
  if (o.flip) {
    flipper = document.createElement('div');
    flipper.className = 'fx-flipper';
    flipper.innerHTML = html + cardBackHTML();
    inner.appendChild(flipper);
  } else inner.innerHTML = html;
  for (const c of inner.querySelectorAll('.card')) c.style.setProperty('--cw', `${W}px`);

  try {
    const fr = o.fromRect;
    // start as big as fits inside fromRect (a hand card, or a sliver of a player bar)
    const f = fr && fr.width ? { x: fr.left + fr.width / 2, y: fr.top + fr.height / 2, s: clamp(Math.min(fr.width / W, fr.height / H), 0.08, 1) } : { x: cx, y: st.bottom + H * 0.25, s: 0.4 };
    const fromRot = o.fromRotate ?? (fr ? -4 : -10);
    const flyIn = run(wrap, [
      { translate: `${(f.x - cx).toFixed(1)}px ${(f.y - cy).toFixed(1)}px`, scale: f.s, rotate: `${fromRot}deg`, opacity: fr ? 1 : 0, easing: 'cubic-bezier(.2,.75,.25,1)' },
      { translate: '0px -8px', scale: 1.05, rotate: '1.2deg', opacity: 1, offset: 0.72, easing: 'ease-in-out' },
      { translate: '0px 0px', scale: 1, rotate: '0deg', opacity: 1 },
    ], { duration: 540, fill: 'forwards' });
    if (flipper) run(flipper, [{ transform: 'rotateY(180deg)' }, { transform: 'rotateY(180deg)', offset: 0.2 }, { transform: 'rotateY(0deg)' }], { duration: 600, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'forwards' });
    const dimIn = dim ? run(dim, [{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: 'forwards' }) : null;
    await done(flyIn);
    if (!isReduced()) {
      const shine = document.createElement('div');
      shine.className = 'fx-shine';
      inner.appendChild(shine);
      glow(cx, cy, { white: true, size: W * 1.5, duration: 700, peak: 0.35 });
    }
    const holdMs = HOLD(o.hold ?? 1100);
    const float = isReduced() ? null : run(inner, [{ translate: '0px 0px' }, { translate: '0px -4px', offset: 0.5 }, { translate: '0px 0px' }], { duration: Math.max(600, holdMs), easing: 'ease-in-out', fill: 'none' });
    await holdFor(holdMs, wrap, o.skippable !== false);
    float?.cancel();
    wrap.classList.remove('skippable');

    if (toEl && !toEl.isConnected && uid != null) {
      toEl = document.querySelector(`[data-uid="${CSS.escape(uid)}"]:not(.fx-ghost)`);
      toEl?.classList.add('fx-hidden');
    }
    const tr = toEl ? toEl.getBoundingClientRect() : o.toRect;
    const dimOut = dim ? run(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: 'forwards' }) : null;
    dimIn?.cancel();
    if (tr && tr.width) {
      const tc = centre(tr), ts = tr.width / W;
      const tAng = toEl ? measure(toEl, tr).ang : 0;
      const dur = 500;
      const out = run(wrap, [
        { translate: '0px 0px', scale: 1, rotate: '0deg', opacity: 1, easing: 'cubic-bezier(.4,0,.7,.4)' },
        { translate: '0px -12px', scale: 1.04, rotate: '-1.5deg', opacity: 1, offset: 0.16, easing: 'cubic-bezier(.35,0,.65,1)' },
        { translate: `${(tc.x - cx).toFixed(1)}px ${(tc.y - cy).toFixed(1)}px`, scale: ts * 1.04, rotate: `${tAng.toFixed(1)}deg`, opacity: 1, offset: 0.86 },
        { translate: `${(tc.x - cx).toFixed(1)}px ${(tc.y - cy).toFixed(1)}px`, scale: ts, rotate: `${tAng.toFixed(1)}deg`, opacity: 0 },
      ], { duration: dur, fill: 'forwards' });
      flyIn?.cancel();
      // cross-fade into the real card at the end of the flight
      await sleep(D(dur * 0.8));
      if (toEl) {
        toEl.classList.remove('fx-hidden');
        play(toEl, [{ opacity: 0 }, { opacity: 1 }], { duration: dur * 0.2, fill: 'backwards' });
      }
      await done(out);
      if (o.flare !== false) {
        const sz = Math.max(tr.width, tr.height);
        if (toEl) jolt(toEl, 1);
        glow(tc.x, tc.y, { white: true, size: sz * 3, duration: 620, peak: 0.95 });
        ring(tc.x, tc.y, { color: '#ffe7b0', size: sz * 1.7, duration: 520, width: 2 });
        particles(tc.x, tc.y, { n: 12, color: ['#fff6dc', '#ffd27a'], vmin: 60, vmax: 160, gravity: 60, life: 650, size: [3, 6] });
        shake(1);
        await sleep(D(260));
      }
    } else {
      const out = run(wrap, [{ opacity: 1, scale: 1, translate: '0px 0px' }, { opacity: 0, scale: 1.1, translate: '0px -24px' }], { duration: 400, easing: 'ease-in', fill: 'forwards' });
      flyIn?.cancel();
      await done(out);
    }
    await done(dimOut);
  } catch (err) {
    console.warn('fx: showCard', err);
  } finally {
    wrap.remove();
    dim?.remove();
    if (toEl) toEl.classList.remove('fx-hidden');
  }
}

/**
 * A big centred banner that slides in and out (about 1.25s):
 * banner('Your turn', { sub: 'Draw · 4 Energy' }), banner('Bot is attacking!', { tone: 'foe' }).
 * tone: 'mine' (gold) | 'foe' (red) | 'info' (blue). opts: sub, duration, y (0-1 of the stage).
 */
export async function banner(text, o = {}) {
  const st = stageRect();
  const h = o.sub ? 108 : 86;
  const y = st.top + st.height * (o.y ?? 0.42);
  const b = add(`fx-banner tone-${o.tone || 'mine'}`, `left:${st.left}px;top:${(y - h / 2).toFixed(1)}px;width:${st.width}px;height:${h}px`);
  b.innerHTML = `<div class="fx-banner-band"></div><div class="fx-banner-inner"><div class="fx-banner-text"></div>${o.sub ? '<div class="fx-banner-sub"></div>' : ''}</div>`;
  b.querySelector('.fx-banner-text').textContent = text;
  if (o.sub) b.querySelector('.fx-banner-sub').textContent = o.sub;
  const band = b.firstElementChild, inner = b.lastElementChild;
  try {
    if (isReduced()) { await sleep(HOLD(900)); return; }
    const total = o.duration ?? 1250;
    await Promise.all([
      play(band, [
        { transform: 'scaleY(0)', opacity: 0 },
        { transform: 'scaleY(1.08)', opacity: 1, offset: 0.13 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.2 },
        { transform: 'scaleY(1)', opacity: 1, offset: 0.82 },
        { transform: 'scaleY(0)', opacity: 0 },
      ], { duration: total, easing: 'ease-in-out' }),
      play(inner, [
        { transform: 'translateX(70px)', opacity: 0 },
        { transform: 'translateX(-5px)', opacity: 1, offset: 0.2 },
        { transform: 'translateX(0px)', opacity: 1, offset: 0.28 },
        { transform: 'translateX(0px)', opacity: 1, offset: 0.78 },
        { transform: 'translateX(-80px)', opacity: 0 },
      ], { duration: total, easing: 'cubic-bezier(.3,.7,.3,1)' }),
    ]);
  } finally {
    b.remove();
  }
}
