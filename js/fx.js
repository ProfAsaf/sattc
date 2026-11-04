// The physical layer of the table: small real-looking cards (.tcard), the
// fanned hand, drag physics, FLIP moves between renders, cards falling onto
// the table, discard piles, and the combat and spell effects. Styles live in
// css/table.css.
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

import { BY_ID, KEYWORDS } from './cards.js';
import { artTag, cardBackHTML, esc, factionVars, glyph } from './render.js';

const NS = 'http://www.w3.org/2000/svg';
const noop = () => {};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const centre = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
const normDeg = (d) => ((((d + 180) % 360) + 360) % 360) - 180;

// A stable number in [-1, 1] from a string: the same card always rests the
// same way, so a re-render never reshuffles the table.
function hashUnit(str, salt = 0) {
  let h = (2166136261 ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

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
// (b.cx + dx, b.cy + dy), turned by dAng and scaled by s (or [sx, sy])
// relative to where its own transform puts it. (They are applied around the
// same origin as the transform, so its translation has to be turned and
// scaled too.)
function pose(b, dx, dy, dAng = 0, s = 1, extra) {
  const [sx, sy] = Array.isArray(s) ? s : [s, s];
  const rad = (dAng * Math.PI) / 180, cos = Math.cos(rad), sin = Math.sin(rad);
  const ex = (b.e || 0) * sx, fy = (b.f || 0) * sy;
  const rx = ex * cos - fy * sin, ry = ex * sin + fy * cos;
  const tx = dx + (b.e || 0) - rx, ty = dy + (b.f || 0) - ry;
  const scale = Math.abs(sx - sy) < 1e-4 ? sx.toFixed(4) : `${sx.toFixed(4)} ${sy.toFixed(4)}`;
  return { translate: `${tx.toFixed(2)}px ${ty.toFixed(2)}px`, rotate: `${dAng.toFixed(2)}deg`, scale, ...extra };
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
const SPENT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.6 12.4a7.6 7.6 0 1 1-2.3-6.1" fill="none" stroke="currentColor" stroke-width="2.9" stroke-linecap="round"/><path d="M20.9 2.9v7.1h-7.1z" fill="currentColor"/></svg>';
// ⚡ on an ability chip
const BOLT = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14.2 1.5 4.5 13.6h6.3L9 22.5l10.5-12.9h-6.4z"/></svg>';
// "zZ": just arrived, not awake enough to attack
const DOZE = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2.8 10.4h8.4L2.8 20.6h8.4" stroke-width="2.7"/><path d="M14.2 3.4h6.4l-6.4 7.8h6.4" stroke-width="2.3"/></svg>';

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
 *              ready = gold glow (can attack now); sick = zZ chip (just arrived:
 *              can block, can't attack yet); exhausted = tilted, darkened, SPENT
 *              stamp (attacked: can't attack or block until its next turn)
 *   power, vitality   current values (vitality = what is left after damage)
 *   dmg        damage marked this turn (> 0 colours vitality red)
 *   cost       current cost in hand (greener when cheaper, redder when dearer)
 *   keywords   keyword ids to badge (default card.keywords)
 *   leaving    true → hourglass badge (leaves at the end of the turn)
 *   foe        true → it belongs to an opponent (pushes forward downwards)
 *   rest       false → no resting jitter (board cards otherwise lie a little
 *              askew, the same way every time for the same uid)
 *   w          width in px (sets --w; otherwise --w-board / --w-hand)
 *   legendary  override for card.legendary
 *   cls        extra classes
 *   ability    { cost, on, used } → a ⚡ chip for a "Pay N Energy" ability
 *              (on: usable now, glows; used: already used this turn).
 *              Tapping it fires data-act="ability" with data-ab = uid.
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
  const readiness = cls.includes('exhausted') ? ', spent until its next turn' : cls.includes('sick') ? ', just arrived: cannot attack yet' : cls.includes('ready') ? ', ready' : '';
  const label = (creature ? `${card.name}, ${p} power, ${v} vitality` : `${card.name}, ${typeText(card)}`) + readiness;
  let style = factionVars(card) + (s.w ? `;--w:${s.w}px` : '');
  if (!hand && s.rest !== false) {
    // put down by hand, not snapped to a grid: a small tilt and offset that belong to this card
    const key = String(s.uid ?? card.id);
    style += `;--jx:${(hashUnit(key, 1) * 2).toFixed(2)}px;--jy:${(hashUnit(key, 2) * 3).toFixed(2)}px;--jr:${(hashUnit(key, 3) * 3).toFixed(2)}deg`;
  }
  const tier = nameTier(card.name, hand);
  if (tier === ' n2') cls.push('name2');
  return `<div class="${cls.join(' ')}"${s.uid != null ? ` data-uid="${esc(s.uid)}"` : ''} data-cid="${esc(card.id)}" style="${style}" role="img" aria-label="${esc(label)}">`
    + '<i class="tc-shadow"></i>'
    + '<div class="tc-body"><div class="tc-face"><div class="tc-frame">'
    + (cls.includes('legendary') ? '<i class="tc-sheen"></i>' : '')
    + `<div class="tc-art">${art}</div>`
    + `<div class="tc-name${tier}"><span>${esc(card.name)}</span></div>`
    + (hand ? `<div class="tc-type">${esc(typeText(card))}</div>` : '')
    // the rules in small print, shown on the hand's focal card (.peek)
    + (hand && card.text ? `<div class="tc-text">${esc(card.text).replace(/\n/g, '<br>')}</div>` : '')
    + '</div></div>'
    + (hand ? `<div class="tc-cost${costCls}"><span>${cost}</span></div>` : '')
    + (creature ? `<b class="tc-p${pCls}">${p}</b><b class="tc-v${vCls}">${v}</b>` : '')
    + (s.ability && !hand ? `<i class="tc-ab${s.ability.on ? ' on' : ''}${s.ability.used ? ' used' : ''}" data-act="ability"${s.uid != null ? ` data-ab="${esc(s.uid)}"` : ''} role="button" aria-label="Ability: pay ${s.ability.cost} Energy">${BOLT}<b>${s.ability.cost}</b></i>` : '')
    + (badges ? `<div class="tc-kws">${badges}</div>` : '')
    + `<i class="tc-ex">${SPENT}<b>Spent</b></i>`
    + `<i class="tc-zz">${DOZE}</i>`
    + '</div></div>';
}

// ══════════════════════════════════════════════════════════════════
//  2. The hand
// ══════════════════════════════════════════════════════════════════

const SLOT = new WeakMap();       // hand card → its fan slot from the last layout
const HAND_DIM = new WeakMap();   // hand → its card sizes and width, and what they depend on
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
  // The sizes only change with the screen or the page's mode: read them once,
  // not on every redraw (each read forces the browser to restyle the page).
  const key = `${(container.parentElement?.className || '').replace(/\bbusy\b/, '')}|${innerWidth}x${innerHeight}`;
  let dim = HAND_DIM.get(container);
  if (!dim || dim.key !== key) {
    const cs = getComputedStyle(container);
    dim = { key, base: parseFloat(cs.getPropertyValue('--w-hand')) || 104, minW: parseFloat(cs.getPropertyValue('--w-hand-min')) || 82, W: container.clientWidth || 360 };
    HAND_DIM.set(container, dim);
  }
  const { base, minW, W } = dim;
  // a full hand shows a little more of each card, so a tap lands on the one you meant
  const reveal = o.reveal ?? (n >= 8 ? 40 : 36);
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
  // The card under your finger (or being played) rises highest. Otherwise the
  // hand's focal card (.peek) pokes up a little, a bit bigger, its rules showing.
  let fi = cards.findIndex((c) => c.classList.contains('touched') || c.classList.contains('selected'));
  const lift = fi >= 0 ? { y: 0.26, s: 1.15 } : { y: 0.2, s: 1.12 };
  if (fi < 0) fi = cards.findIndex((c) => c.classList.contains('peek'));
  const mid = (n - 1) / 2;
  const spread = fi < 0 ? 0 : clamp((w * lift.s - s) * 0.45, 0, 24);
  const fresh = [];
  cards.forEach((c, i) => {
    const arc0 = (i - mid) * s;
    let arc = arc0;
    if (fi >= 0 && i !== fi) arc += Math.sign(i - fi) * spread * Math.max(0.3, 1 - (Math.abs(i - fi) - 1) * 0.25);
    const th = arc / R;
    let x = R * Math.sin(th), y = R * (1 - Math.cos(th)), r = (th * 180) / Math.PI, sc = 1, z = i + 1;
    if (i === fi) {
      const lim = Math.max(0, avail / 2 - (w * lift.s) / 2);
      x = clamp(R * Math.sin(arc0 / R), -lim, lim);
      y = -h * lift.y;
      r = 0; sc = lift.s; z = 60;
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
const DRAGS = new WeakMap();           // dragged card → its physics state (capture() reads the momentum)
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
 *     onStart(info), onMove(info), onBack(info),
 *     onScrub(el)       // a sideways slide along the hand ended on this card
 *   }) → { destroy() }
 *
 * info = { el, uid, cid, x, y, dx, dy, vx, vy, rect, handRect, overHand, back() }
 * After an accepted drop the card stays where it was let go (class .dragging)
 * until you re-render; flip() then lets it fall from there onto its place on
 * the board, carrying the momentum it was released with.
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
      // the card you slid to stays the hand's focal card
      if (o.onScrub) safeCall(o.onScrub, S.el);
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
  DRAGS.set(el, S);
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

const SEL = '[data-uid]:not(button):not([data-act]), [data-p]:not(button):not([data-act]), [data-pile]';
const INFO = new WeakMap();      // DOMRect from capture() → what else we saw

/** The key capture() uses: the data-uid ("12"), "p" + data-p for player bars ("p0"), "pile" + data-pile for discard piles ("pile0"). */
export function keyOf(el) {
  if (!el || !el.dataset) return null;
  if (el.dataset.uid != null) return String(el.dataset.uid);
  if (el.dataset.p != null) return `p${el.dataset.p}`;
  if (el.dataset.pile != null) return `pile${el.dataset.pile}`;
  return null;
}

function snap(el, r) {
  const m = measure(el, r);
  const zone = el.classList.contains('in-hand') ? 'hand' : el.classList.contains('tcard') ? 'board' : 'other';
  const p = el.querySelector?.(':scope > .tc-body > .tc-p'), v = el.querySelector?.(':scope > .tc-body > .tc-v');
  const life = el.querySelector?.('.pb-life');
  const S = DRAGS.get(el);
  return {
    el, zone, ...m, cs: undefined,
    vw: m.cs.getPropertyValue('--w').trim(),
    pv: p || v ? [p?.textContent ?? '', v?.textContent ?? ''] : null,
    life: life ? life.textContent : null,
    pile: el.dataset?.pile != null ? el.dataset.count : null,
    dragging: el.classList.contains('dragging'),
    vel: S && (S.mode === 'drag' || S.mode === 'hold') ? { x: S.vx, y: S.vy } : null,
  };
}

/**
 * Remember where every card ([data-uid]), player bar ([data-p]) and discard
 * pile ([data-pile]) is. Returns a Map of key → DOMRect (see keyOf). Call it
 * just before a render.
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
 * where it is now. A card that left the hand for the board falls onto the
 * table (from where it was let go, keeping its momentum; a tapped play is
 * lifted out of the hand first). Creatures slide over when one leaves, a
 * creature that attacked tilts. New elements enter: hand cards are drawn in
 * from the deck, tokens materialise, other creatures drop onto the table,
 * and a creature showCard() already put down (toRect) takes over from its
 * stand-in without landing twice.
 *
 * opts: duration (slides), fallDuration, delay (old positions are held meanwhile),
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
    else if (it.m.zone === 'board') {
      const pk = takeParked(it.el);
      if (pk) { it.a = pk.info; it.parked = pk; }
    }
  }
  const jobs = [];
  let drawn = 0;
  for (const it of items) {
    if (it.a) {
      jobs.push(moveFrom(it, o));
      if (it.parked) it.parked.el.remove();   // the real card now shows where its stand-in was
    } else if (before.size) jobs.push(enter(it.el, it.m, o, it.el.classList.contains('in-hand') ? drawn++ : 0));
  }
  return Promise.all(jobs).then(noop);
}

function moveFrom({ el, a, m: b }, o) {
  const s = clamp((a.w * a.sc) / ((b.w || 1) * (b.sc || 1)), 0.15, 6);
  const dx = a.cx - b.cx, dy = a.cy - b.cy, dAng = normDeg(a.ang - b.ang);
  const pops = () => popChanges(el, a);
  if (a.zone === 'hand' && b.zone === 'board' && el.classList.contains('on-board')) {
    // played: it falls from the hand (or from where the drag let go of it) onto the table
    return runFall(el, { cx: a.cx, cy: a.cy, w: a.w * a.sc, ang: a.ang }, b,
      { lift: !a.dragging, velocity: a.vel, delay: o.delay, duration: o.fallDuration }).then(pops);
  }
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

// Pop the P/V coins (or a player's life, or a pile's count) when their numbers changed.
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
  if (a.pile != null && el.dataset.count !== a.pile) {
    const n = el.querySelector(':scope > .tc-pile-n');
    if (n) pop(n);
  }
}
function pop(node) {
  if (!node || isReduced()) return;
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

// A creature that appears without coming from the hand drops a short way.
function dropIn(el, b, delay) {
  const restW = (b.w || 1) * (b.sc || 1);
  play(el, [{ opacity: 0 }, { opacity: 1, offset: 0.22 }, { opacity: 1 }], { duration: 620, delay, fill: 'backwards' });
  return runFall(el, { cx: b.cx + rand(-6, 6), cy: b.cy - 30, w: restW * 1.4, ang: b.ang + rand(-9, 9) }, b,
    { delay, duration: 620, flutter: 4.5 });
}

// A puff of dust where a card lands.
function dust(el) { landFx(el, 'dust'); }

// ══════════════════════════════════════════════════════════════════
//  Falling and landing
// ══════════════════════════════════════════════════════════════════
//
// A card let go above the table keeps the momentum it was released with and
// drifts, shrinks from held size to table size as gravity takes it (slowly,
// then fast), flutters (a small wobble that dies away, with a hint of the card
// tipping), and its shadow tightens as it nears the cloth. It touches down a
// few px short, squashes, skids in and settles at its resting angle.
//
// fallPlan() samples that path relative to the resting pose: x, y are screen px
// from the resting centre, ang degrees from the resting angle, sx/sy a factor of
// the resting size, h the height (1 = held, 0 = on the table). The samples are
// then written as keyframes for a card on the table (restFrames, which stack on
// the card's own transform) or for a stand-in in the overlay (overlayFrames).

function fallPlan(a, b, o = {}) {
  // lift: true = tossed up out of the hand first; a number = how much it rises
  // before it falls (1 = not at all, 1.25 = a little: a card let go from high up)
  const lift = o.lift === true ? 2.2 : typeof o.lift === 'number' && o.lift > 1 ? o.lift : 0;
  const restW = Math.max(1, (b.w || 1) * (b.sc || 1));
  const s0 = clamp(a.w / restW, 0.3, 8);
  const P0x = a.cx - b.cx, P0y = a.cy - b.cy;
  const dist = Math.hypot(P0x, P0y);
  const v = o.velocity || { x: 0, y: 0 };
  const speed = Math.hypot(v.x, v.y);
  // which way it is moving when it touches down: toward its place, bent by the throw
  let ux = -P0x + v.x * 0.15, uy = -P0y + v.y * 0.15;
  const ul = Math.hypot(ux, uy);
  if (ul < 1) { ux = 0; uy = 1; } else { ux /= ul; uy /= ul; }
  const skid = o.skid ?? clamp(2.5 + dist * 0.012 + speed * 0.002, 2.5, 7);
  const Lx = -ux * skid, Ly = -uy * skid;          // touch down a little short of the place, then skid in
  // the start of the path: the throw, or (a tap) up and out of the hand
  let m0x, m0y;
  if (lift >= 2) { m0x = -P0x * 0.1; m0y = -Math.max(110, Math.abs(P0y) * 0.55 + 50); }
  else if (lift) { m0x = -P0x * 0.15; m0y = -P0y * 0.15 - 24; }
  else {
    m0x = v.x * 0.3; m0y = v.y * 0.3;
    const ml = Math.hypot(m0x, m0y);
    if (ml > 120) { m0x *= 120 / ml; m0y *= 120 / ml; }
  }
  const m1x = ux * skid * 3, m1y = uy * skid * 3;
  const dA = normDeg(a.ang - b.ang);
  const resid = clamp(ux * 2.5 + Math.sign(dA || 1) * 0.8, -3.5, 3.5);   // lands a touch askew, then settles
  const wob = o.flutter ?? clamp(3.5 + speed * 0.004 + dist * 0.008, 3.5, 8.5);
  const ph = rand(0, Math.PI * 2), ph2 = rand(0, Math.PI * 2);
  const tLand = o.tLand ?? (lift ? 0.78 : 0.74);
  const samples = [];
  const N1 = 26, N2 = 12;
  for (let i = 0; i <= N1 + N2; i++) {
    const t = i <= N1 ? (tLand * i) / N1 : tLand + ((1 - tLand) * (i - N1)) / N2;
    let x, y, ang, sx, sy, h;
    if (i <= N1) {
      const u = t / tLand, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      x = h00 * P0x + h10 * m0x + h01 * Lx + h11 * m1x;
      y = h00 * P0y + h10 * m0y + h01 * Ly + h11 * m1y;
      h = lift ? (1 - u) * (1 + lift * u) : 1 - u2;  // a toss rises first; a drop just falls
      const s = 1 + (s0 - 1) * h;
      const ramp = Math.min(1, u / 0.12), fade = (1 - u) ** 1.4;
      ang = dA + (resid - dA) * (u2 * (3 - 2 * u)) + wob * Math.sin(2 * Math.PI * 1.45 * u + ph) * fade * ramp;
      const tip = 1 - 0.07 * Math.abs(Math.sin(2 * Math.PI * 1.05 * u + ph2)) * fade * ramp;
      sx = s * tip; sy = s;
    } else {
      const u = (t - tLand) / (1 - tLand);
      const k = 1 - (1 - u) ** 3;                    // skid, slowing with friction
      x = Lx * (1 - k); y = Ly * (1 - k);
      const squash = u < 0.3 ? -0.05 * Math.sin((Math.PI * u) / 0.3) : u < 0.62 ? 0.014 * Math.sin((Math.PI * (u - 0.3)) / 0.32) : 0;
      sx = sy = 1 + squash;
      ang = resid * springAt(u, 0.45);
      h = 0;
    }
    samples.push({ t, x, y, ang, sx, sy, h });
  }
  samples[samples.length - 1] = { t: 1, x: 0, y: 0, ang: 0, sx: 1, sy: 1, h: 0 };
  return { samples, tLand, dir: { x: ux, y: uy }, lift: lift >= 2, dist };
}

const within = (samples, from, to) => samples.filter((s) => s.t >= from - 1e-9 && s.t <= to + 1e-9);
const offsetIn = (t, from, to) => clamp((t - from) / Math.max(1e-6, to - from), 0, 1);

// Keyframes for a card resting at b (they stack on its own transform).
function restFrames(b, samples, from = 0, to = 1) {
  return within(samples, from, to).map((s) => ({ ...pose(b, s.x, s.y, s.ang, [s.sx, s.sy]), offset: offsetIn(s.t, from, to) }));
}

// Keyframes for an untransformed element in the overlay whose layout box is
// centred at (lay.cx, lay.cy) with width lay.w, landing on dest {cx, cy, ang, w}.
function overlayFrames(dest, lay, samples, from = 0, to = 1) {
  const k = dest.w / Math.max(1, lay.w);
  return within(samples, from, to).map((s) => ({
    translate: `${(dest.cx + s.x - lay.cx).toFixed(2)}px ${(dest.cy + s.y - lay.cy).toFixed(2)}px`,
    rotate: `${(dest.ang + s.ang).toFixed(2)}deg`,
    scale: `${(k * s.sx).toFixed(4)} ${(k * s.sy).toFixed(4)}`,
    offset: offsetIn(s.t, from, to),
  }));
}

// The shadow under a falling card: soft and well below it while it is high,
// tight and dark as it touches down, then gone (the card's own shadow stays).
function shadowFrames(w, samples, from = 0, to = 1, tLand = 0.75) {
  return within(samples, from, to).map((s) => {
    const after = s.t > tLand ? offsetIn(s.t, tLand, 1) : 0;
    const h = Math.max(0, s.h);
    return {
      transform: `translateY(${(w * (0.03 + 0.2 * h) * (1 - after)).toFixed(2)}px) scale(${(1 + 0.1 * h).toFixed(3)})`,
      opacity: ((0.95 - 0.35 * Math.min(1, h)) * (1 - after)).toFixed(3),
      offset: offsetIn(s.t, from, to),
    };
  });
}

// Run a fall on a card that already sits in its resting place.
function runFall(el, a, b, o = {}) {
  const plan = fallPlan(a, b, o);
  const dur = o.duration ?? (plan.lift ? 840 : clamp(660 + plan.dist * 0.25, 660, 800));
  const delay = o.delay || 0;
  el.classList.add('fx-fall');
  const anim = run(el, restFrames(b, plan.samples), { duration: dur, delay, easing: 'linear', fill: 'backwards' });
  const sh = el.querySelector?.(':scope > .tc-shadow');
  if (sh) run(sh, shadowFrames(el.offsetWidth || b.w, plan.samples, 0, 1, plan.tLand), { duration: dur, delay, easing: 'linear', fill: 'backwards' });
  if (o.puff !== false) setTimeout(() => { if (el.isConnected) landFx(el, o.puff || 'dust', plan.dir); }, D(delay + dur * plan.tLand));
  return done(anim).then(() => { el.classList.remove('fx-fall'); });
}

/**
 * Drop a card onto the table. `el` is the card already in its new place (after
 * the render); `fromRect` is where it starts (a hand card, the point a drag let
 * go of it, a player bar). It falls the way flip() lets played cards fall.
 * opts: velocity {x, y} (px/s, the throw it keeps), angle (start angle, deg),
 *       width (start width, default fromRect.width), lift (toss it up first, like
 *       a tapped play), duration (default 660-840ms), delay, flutter (deg),
 *       puff ('dust' | 'light' | false).
 */
export function fall(el, fromRect, o = {}) {
  if (!el || !fromRect) return Promise.resolve();
  const b = measure(el);
  const a = { cx: fromRect.left + fromRect.width / 2, cy: fromRect.top + fromRect.height / 2, w: o.width ?? fromRect.width, ang: o.angle ?? 0 };
  return runFall(el, a, b, o);
}

// Touch-down: the air under the card puffs out its outline, dust skips away
// from the edges (mostly ahead of the skid), the table takes a small knock.
function landFx(el, kind = 'dust', dir = { x: 0, y: -1 }, o = {}) {
  if (!kind || isReduced() || !el) return;
  const isRect = typeof el.getBoundingClientRect !== 'function';
  const r = isRect ? el : el.getBoundingClientRect(), c = centre(r);
  const bw = (!isRect && el.offsetWidth) || r.width, bh = (!isRect && el.offsetHeight) || r.height;
  const light = kind === 'light';
  const puff = add(`fx-puff${light ? ' light' : ''}`, `left:${(c.x - bw / 2).toFixed(1)}px;top:${(c.y - bh / 2).toFixed(1)}px;width:${bw.toFixed(1)}px;height:${bh.toFixed(1)}px;border-radius:${(bw * 0.09).toFixed(1)}px`);
  play(puff, [{ transform: 'scale(.94)', opacity: 0.75 }, { transform: 'scale(1.3)', opacity: 0 }], { duration: 460, easing: 'cubic-bezier(.15,.7,.3,1)' }).then(() => puff.remove());
  const n = o.n ?? 4, kindP = light ? 'dot' : 'ash', col = light ? ['#fff6dc', '#ffd98a'] : '#e9dcc0';
  particles(r.left + 3, r.bottom - 4, { n, kind: kindP, color: col, dir: 180, spread: 60, vmin: 25, vmax: 70, gravity: -25, life: 560, size: [3, 6] });
  particles(r.right - 3, r.bottom - 4, { n, kind: kindP, color: col, dir: 0, spread: 60, vmin: 25, vmax: 70, gravity: -25, life: 560, size: [3, 6] });
  particles(c.x + dir.x * bw * 0.5, c.y + dir.y * bh * 0.5, { n: Math.max(2, n - 1), kind: kindP, color: col, dir: (Math.atan2(dir.y, dir.x) * 180) / Math.PI, spread: 70, vmin: 20, vmax: 60, gravity: -20, life: 520, size: [3, 5] });
  if (light) particles(c.x, c.y, { n: 10, color: ['#fff6dc', '#ffd27a'], dir: -90, spread: 120, vmin: 20, vmax: 80, gravity: -60, life: 800, jitter: [bw * 0.4, bh * 0.3], size: [3, 5] });
  if (o.shake !== false) shake(0.55);
}

// ── stand-ins: a card showCard() put down before the table was redrawn ──
const PARKED = new Set();

function parkCard(card, rect, o = {}) {
  const host = document.createElement('div');
  host.innerHTML = tcardHTML(card, { zone: 'board', foe: !!o.foe, rest: false, w: rect.width });
  const el = host.firstElementChild;
  el.classList.add('fx-ghost', 'fx-parked', 'fx-hidden');
  el.style.position = 'absolute';
  el.style.left = `${rect.left.toFixed(1)}px`;
  el.style.top = `${(rect.top + rect.height / 2 - (rect.width * 1.33) / 2).toFixed(1)}px`;
  layer().appendChild(el);
  return el;
}

function park(el, cid) {
  const pk = { el, cid };
  // if the table never draws it (the play was canceled), let it go
  pk.timer = setTimeout(() => {
    if (!PARKED.delete(pk)) return;
    play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }).then(() => el.remove());
  }, 6000);
  PARKED.add(pk);
}

// The stand-in for this freshly drawn card, if there is one (same card, close by).
function takeParked(el) {
  const cid = el.dataset?.cid;
  if (!cid || !PARKED.size) return null;
  const c = centre(el.getBoundingClientRect());
  let best = null, bd = Infinity;
  for (const pk of PARKED) {
    if (pk.cid !== cid || !pk.el.isConnected) continue;
    const r = pk.el.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - c.x, r.top + r.height / 2 - c.y);
    if (d < bd) { bd = d; best = pk; }
  }
  if (!best || bd > 320) return null;
  PARKED.delete(best);
  clearTimeout(best.timer);
  best.info = snap(best.el, best.el.getBoundingClientRect());
  return best;
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
  g.classList.remove('target', 'aim', 'aiming', 'touched', 'dragging', 'returning', 'drop-ok', 'fx-air', 'fx-lunge', 'fx-hidden', 'fx-nofx', 'fx-fall', 'fx-parked');
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

// ── discard piles ───────────────────────────────────────────────────
// A pile is a small messy stack: the top three cards, each a little off and
// turned (the same way every time: it depends on the player, the card's place
// in the pile and the card), the top one face up. Its count sits in a badge.

// a card object, a card id, or { cid }
function cardOf(x) {
  if (typeof x === 'string') return BY_ID[x] || null;
  if (x && typeof x === 'object') return x.id && x.name ? x : BY_ID[x.cid] || null;
  return null;
}

function pileRest(p, i, cid) {
  const key = `${p}|${i}|${cid || ''}`;
  return { x: hashUnit(key, 11) * 3.2, y: hashUnit(key, 12) * 2.6, r: hashUnit(key, 13) * 14 };
}

function pileCardHTML(card, rest, top) {
  const inner = card
    ? `<div class="tc-pc-face"><div class="tc-pc-art">${artTag(card.id) || glyph((card.factions || [])[0] || 'neutral')}</div><i class="tc-pc-plate"></i></div>`
    : '<div class="tc-pc-face tc-pc-back"></div>';
  return `<div class="tc-pcard${top ? ' top' : ''}"${card ? ` data-cid="${esc(card.id)}"` : ''} style="${card ? `${factionVars(card)};` : ''}--px:${rest.x.toFixed(2)}px;--py:${rest.y.toFixed(2)}px;--pr:${rest.r.toFixed(2)}deg">${inner}</div>`;
}

const pileThick = (n) => (n >= 14 ? 3 : n >= 8 ? 2 : n >= 4 ? 1 : 0);

/**
 * A discard pile: `cards` bottom to top (card objects, card ids, or {cid}),
 * all of them or just the top few; opts.count is the full size (default
 * cards.length). Returns a .tc-pile with data-pile="<p>", which capture() and
 * flip() track ("pile<p>"). Size: --pile-w (default 44px) or opts.w.
 * opts.act adds data-act="<act>" data-of="<p>" so a tap can open the pile.
 */
export function pileHTML(cards = [], o = {}) {
  const p = o.p ?? 0;
  const list = (cards || []).map(cardOf).filter(Boolean);
  const count = Math.max(o.count ?? list.length, list.length);
  const top = list.slice(-3);
  const first = count - top.length;
  const last = top[top.length - 1];
  const label = count ? `Discard pile, ${count} card${count === 1 ? '' : 's'}${last ? `, ${last.name} on top` : ''}` : 'Discard pile, empty';
  const thick = pileThick(count);
  const cls = `tc-pile${count ? '' : ' empty'}${thick ? ` thick-${thick}` : ''}${o.cls ? ` ${o.cls}` : ''}`;
  const act = o.act ? ` data-act="${esc(o.act)}" data-of="${esc(p)}" role="button"` : ' role="img"';
  return `<div class="${cls}" data-pile="${esc(p)}" data-count="${count}"${act} aria-label="${esc(label)}"${o.w ? ` style="--pile-w:${o.w}px"` : ''}>`
    + '<i class="tc-pile-slot"></i>'
    + top.map((c, k) => pileCardHTML(c, pileRest(p, first + k, c.id), k === top.length - 1)).join('')
    + `<b class="tc-pile-n">${count}</b></div>`;
}

// Put a card on top of a pile element (what pileHTML would draw next).
function addToPile(pile, cid, index) {
  const card = cardOf(cid);
  const rest = pileRest(pile.dataset.pile, index, card?.id);
  pile.querySelectorAll(':scope > .tc-pcard.top').forEach((n) => n.classList.remove('top'));
  const badge = pile.querySelector(':scope > .tc-pile-n');
  const holder = document.createElement('div');
  holder.innerHTML = pileCardHTML(card, rest, true);
  const el = holder.firstElementChild;
  pile.insertBefore(el, badge);
  const shown = pile.querySelectorAll(':scope > .tc-pcard');
  for (let i = 0; i < shown.length - 3; i++) shown[i].remove();
  const count = Math.max(index + 1, Number(pile.dataset.count || 0));
  pile.dataset.count = count;
  if (badge) badge.textContent = count;
  pile.classList.remove('empty', 'thick-1', 'thick-2', 'thick-3');
  if (pileThick(count)) pile.classList.add(`thick-${pileThick(count)}`);
  return el;
}

const livePile = (pile) => (pile?.isConnected ? pile : pile?.dataset ? document.querySelector(`[data-pile="${CSS.escape(pile.dataset.pile)}"]`) : null);

// Fly an overlay element (layout box `lay`, currently looking like `from`)
// down onto the top of a pile, then hand over to the pile's new top card.
async function pileDrop(fly, lay, from, pileEl, o = {}) {
  const pile = livePile(pileEl);
  if (!pile) { await play(fly, [{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }); return; }
  const n = Number(pile.dataset.count || 0);
  const rest = pileRest(pile.dataset.pile, n, o.cid);
  const pr = pile.getBoundingClientRect();
  const pw = parseFloat(getComputedStyle(pile).getPropertyValue('--pile-w')) || 44;
  const dest = { cx: pr.left + pr.width / 2 + rest.x, cy: pr.top + pr.height / 2 + rest.y, ang: rest.r, w: pw };
  const plan = fallPlan(from, { cx: dest.cx, cy: dest.cy, ang: dest.ang, w: pw, sc: 1, e: 0, f: 0 }, { flutter: 8, skid: 3, velocity: o.velocity });
  const dur = o.duration ?? clamp(700 + plan.dist * 0.2, 700, 900);
  fly.classList.add('falling');
  const sh = o.shadowW ? showShadow(fly) : null;
  const anim = run(fly, overlayFrames(dest, lay, plan.samples, 0, plan.tLand), { duration: dur * plan.tLand, easing: 'linear', fill: 'forwards' });
  if (sh) run(sh, shadowFrames(o.shadowW, plan.samples, 0, plan.tLand, plan.tLand), { duration: dur * plan.tLand, easing: 'linear', fill: 'forwards' });
  if (o.fadeIn) run(fly, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1 }], { duration: dur * plan.tLand, easing: 'linear', fill: 'forwards' });
  o.base?.cancel();
  await done(anim);
  // touch-down: the pile's new top card takes over
  const live = livePile(pile);
  let top = null;
  if (live) {
    const now = Number(live.dataset.count || 0);
    const already = now > n && live.querySelector(':scope > .tc-pcard.top');
    top = already || addToPile(live, o.cid, n);
  }
  fly.style.visibility = 'hidden';
  if (!top) return;
  const tb = measure(top);
  landFx(top, 'dust', plan.dir, { n: 2, shake: false });
  pop(live.querySelector(':scope > .tc-pile-n'));
  await play(top, restFrames(tb, plan.samples, plan.tLand, 1), { duration: dur * (1 - plan.tLand), easing: 'linear', fill: 'none' });
}

function showShadow(wrap) {
  if (isReduced()) return null;
  const sh = document.createElement('i');
  sh.className = 'fx-show-shadow';
  wrap.prepend(sh);
  return sh;
}

/**
 * A card flutters down onto a discard pile and lands on top, a little askew.
 * source: a card element (it is ghosted and hidden), a ghost, or card HTML
 *         (cardHTML / tcardHTML; it appears at opts.fromRect, or just above the pile).
 * opts: fromRect, cid (which card, if the source does not say), velocity,
 *       duration (default 700-900ms).
 * The pile element is updated in place (new top card, count), so the next
 * pileHTML render of the same pile looks the same.
 */
export async function toPile(source, pileEl, o = {}) {
  if (!pileEl || !source) return;
  let fly = null, lay, from, fadeIn = false;
  let cid = o.cid || null;
  try {
    if (typeof source === 'string') {
      fly = add('fx-pilefly', 'visibility:hidden');
      fly.innerHTML = source;
      const inner = fly.firstElementChild;
      cid ||= inner?.dataset?.cid || inner?.dataset?.id || null;
      const pr = livePile(pileEl)?.getBoundingClientRect();
      const fr = o.fromRect && o.fromRect.width ? o.fromRect
        : pr ? new DOMRect(pr.left + pr.width / 2 - pr.width * 0.8, pr.top - pr.height * 1.4, pr.width * 1.6, pr.height * 1.6) : null;
      if (!fr) { fly.remove(); return; }
      if (inner?.classList.contains('card')) inner.style.setProperty('--cw', `${fr.width}px`);
      if (inner?.classList.contains('tcard')) inner.style.setProperty('--w', `${fr.width}px`);
      fly.style.width = `${fr.width}px`;
      const h = inner?.offsetHeight || fr.width * 1.4;
      fly.style.left = `${fr.left.toFixed(1)}px`;
      fly.style.top = `${(fr.top + fr.height / 2 - h / 2).toFixed(1)}px`;
      fly.style.visibility = '';
      lay = { cx: fr.left + fr.width / 2, cy: fr.top + fr.height / 2, w: fr.width };
      from = { ...lay, ang: o.angle ?? rand(-6, 6) };
      fadeIn = true;
    } else {
      if (source.classList?.contains('fx-ghost')) fly = source;
      else { fly = ghost(source); source.classList?.add('fx-hidden'); }
      if (!fly) return;
      cid ||= fly.dataset?.cid || fly.querySelector?.('[data-cid]')?.dataset.cid || null;
      const gi = GHOST.get(fly) || { ang: 0, sc: 1 };
      const w = fly.offsetWidth, h = fly.offsetHeight;
      const left = parseFloat(fly.style.left) || 0, top = parseFloat(fly.style.top) || 0;
      fly.style.transform = 'none';                // its turn and scale move into the keyframes
      lay = { cx: left + w / 2, cy: top + h / 2, w };
      from = { cx: lay.cx, cy: lay.cy, w: w * gi.sc, ang: gi.ang };
    }
    if (isReduced()) { const pile = livePile(pileEl); if (pile) addToPile(pile, cid, Number(pile.dataset.count || 0)); return; }
    await pileDrop(fly, lay, from, pileEl, { cid, fadeIn, velocity: o.velocity, duration: o.duration });
  } catch (err) {
    console.warn('fx: toPile', err);
  } finally {
    fly?.remove();
  }
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
 * then falls onto the table like a dropped card, or flutters onto a discard
 * pile, or fades.
 *
 * html: usually cardHTML(card, { cls: 'anim' }).
 * opts: fromRect,
 *       toEl   the card on the table it becomes (hidden until it lands; if it has
 *              been re-rendered meanwhile, it is found again by data-uid),
 *       toRect where it will sit when the table is next drawn: it lands there; a
 *              creature leaves a stand-in until flip() hands over to the real card
 *              (anything else, e.g. a Relic, lands and fades),
 *       toPile a discard pile element (see pileHTML): it flutters onto the pile,
 *       during () => Promise: run while it is shown (an effect); it leaves after,
 *       hold, flip (start face down, turn over on the way: an opponent's card),
 *       width (fraction of the stage, default .7), dim (default true), skippable,
 *       card (the card object, when html is not from cardHTML), foe, puff.
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
  const card = o.card || BY_ID[inner.querySelector('.card[data-id]')?.dataset.id] || null;

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
    const during = o.during ? Promise.resolve().then(o.during).catch((err) => console.error(err)) : null;
    await Promise.all([holdFor(holdMs, wrap, o.skippable !== false), during]);
    float?.cancel();
    wrap.classList.remove('skippable');

    if (toEl && !toEl.isConnected && uid != null) {
      toEl = document.querySelector(`[data-uid="${CSS.escape(uid)}"]:not(.fx-ghost)`);
      toEl?.classList.add('fx-hidden');
    }
    const dimOut = dim ? run(dim, [{ opacity: 1 }, { opacity: 0 }], { duration: 520, fill: 'forwards' }) : null;
    dimIn?.cancel();
    const lay = { cx, cy, w: W };
    if (o.toPile) {
      await pileDrop(wrap, lay, { cx, cy, w: W, ang: 0 }, o.toPile, { cid: card?.id, base: flyIn, shadowW: W });
    } else if (toEl || (o.toRect && o.toRect.width && card?.type === 'creature')) {
      // it falls onto the table; at touch-down the real card (or a stand-in creature) takes over
      const parked = toEl ? null : parkCard(card, o.toRect, o);
      const target = toEl || parked;
      const b = measure(target);
      const plan = fallPlan({ cx, cy, w: W, ang: 0 }, b, { lift: 1.25, flutter: 5, skid: 4 });
      const dur = 900;
      wrap.classList.add('falling');
      const sh = showShadow(wrap);
      const out = run(wrap, overlayFrames({ cx: b.cx, cy: b.cy, ang: b.ang, w: b.w * b.sc }, lay, plan.samples, 0, plan.tLand), { duration: dur * plan.tLand, easing: 'linear', fill: 'forwards' });
      if (sh) run(sh, shadowFrames(W, plan.samples, 0, plan.tLand, plan.tLand), { duration: dur * plan.tLand, easing: 'linear', fill: 'forwards' });
      flyIn?.cancel();
      await done(out);
      target.classList.remove('fx-hidden');
      wrap.style.visibility = 'hidden';
      landFx(target, o.puff || 'dust', plan.dir);
      const tail = run(target, restFrames(b, plan.samples, plan.tLand, 1), { duration: dur * (1 - plan.tLand), easing: 'linear' });
      const tsh = target.querySelector(':scope > .tc-shadow');
      if (tsh) run(tsh, shadowFrames(target.offsetWidth || b.w, plan.samples, plan.tLand, 1, plan.tLand), { duration: dur * (1 - plan.tLand), easing: 'linear' });
      if (parked) park(parked, card.id);   // flip() swaps it for the real card when the table is drawn
      await done(tail);
    } else if (o.toRect && o.toRect.width) {
      // not a creature (a Relic going to its bar): fall onto the spot and fade there
      const tr = o.toRect;
      const b = { cx: tr.left + tr.width / 2, cy: tr.top + tr.height / 2, ang: 0, w: tr.width, sc: 1, e: 0, f: 0 };
      const plan = fallPlan({ cx, cy, w: W, ang: 0 }, b, { lift: 1.25, flutter: 5 });
      const out = run(wrap, overlayFrames(b, lay, plan.samples, 0, plan.tLand), { duration: 900 * plan.tLand, easing: 'linear', fill: 'forwards' });
      flyIn?.cancel();
      await done(out);
      landFx(tr, o.puff || 'light', plan.dir);
      await play(wrap, [{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: 'forwards' });
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
  // long lines (three players' names) step down a size instead of wrapping out of the band
  if (text.length > 15) b.classList.add(text.length > 23 ? 'longer' : 'long');
  if (o.sub && o.sub.length > 30) b.classList.add('long-sub');
  const band = b.firstElementChild, inner = b.lastElementChild;
  // and if it still wraps, the band grows to hold it
  const need = inner.offsetHeight + 28;
  if (need > h) { b.style.height = `${need}px`; b.style.top = `${(y - need / 2).toFixed(1)}px`; }
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
