// Card art for the SATTC Ultra cards, part A (cards 101–115: Ember, Verdant,
// two Tide). Style rules live in ../scenes.js; drawing tools in ../kit.js.
// The two Fields are whole landscapes, the battlefield they make.

import { H, W, blob, particles, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL, arcade } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const NUM = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
const rad = (deg) => (deg * Math.PI) / 180;

// An ellipse as a polygon, so it can join a union path.
function ell(cx, cy, rx, ry = rx, rot = 0, n = 22) {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    pts.push([cx + x * c - y * sn, cy + x * sn + y * c]);
  }
  return poly(pts);
}

// Many polygons as one path. Every ring is wound the same way, so where the
// parts overlap they merge (nonzero fill) instead of punching holes.
function U(...ds) {
  return ds.flat(Infinity).join('').split('M').filter((sp) => sp.trim()).map((sp) => {
    const pts = sp.replace(/Z\s*$/, '').split('L').map((q) => q.split(',').map(Number));
    let a = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      a += x1 * y2 - x2 * y1;
    }
    if (a < 0) pts.reverse();
    return 'M' + pts.map(pt).join('L') + 'Z';
  }).join('');
}

// Lots of small dots as a single path: [[x, y, r], ...].
const dots = (list) => list.map(([x, y, r]) =>
  `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0`).join('');

// Rotate or mirror a polygon path; carry a figure drawn at the origin to
// (x, y) at scale k.
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const flipX = (d, ax) => d.replace(NUM, (_, x, y) => `${f1(2 * ax - x)},${y}`);
const flipY = (d, k) => d.replace(NUM, (_, x, y) => `${x},${f1(k - y)}`);
const at = (x, y, k) => (d) => d.replace(NUM, (_, a, b) => `${f1(x + a * k)},${f1(y + b * k)}`);

// A smooth edge (hill, crag, shore) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);

// A rough stone: an ellipse with a seeded, lumpy outline.
function stone(cx, cy, rx, ry, seed, n = 9, rough = 0.2) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.3, k = 1 - rough / 2 + r() * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return blob(pts, 4);
}

// A lens-shaped leaf or petal centred on (x, y), `l` long, turned `a` degrees;
// leafAt() grows the same shape out of a point instead.
const lens = (x, y, l, a, w = 0.38, per = 4) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], per), x, y, a);
const leafAt = (x, y, a, l, w = 0.38, per = 4) => lens(x + (Math.cos(rad(a)) * l) / 2, y + (Math.sin(rad(a)) * l) / 2, l, a, w, per);

// A flame tongue along any direction (degrees), its tip flicking aside.
const lick = (x, y, deg, L, w, flick = 0.3) => {
  const a = rad(deg), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const q = (t, o) => [x + ux * L * t + nx * o, y + uy * L * t + ny * o];
  return taper([[x, y], q(0.35, w * 0.25), q(0.7, -w * 0.2), q(1, L * flick * 0.3)], [w, w * 0.8, w * 0.42, 0.3], { per: 5 });
};

// A tongue of flame that leaves (x, y) heading a0 degrees and bends round to
// a1 as it goes, `L` long; `w` is a width per step.
function plume(x, y, a0, a1, L, w) {
  const pts = [[x, y]];
  let px = x, py = y;
  for (let i = 1; i < w.length; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / (w.length - 1));
    px += (Math.cos(a) * L) / (w.length - 1); py += (Math.sin(a) * L) / (w.length - 1);
    pts.push([px, py]);
  }
  return taper(pts, w, { per: 6 });
}

// A line that leaves (x, y) heading `a` degrees and turns by `bend` over its
// length L: roots, vines, branches. `w` is [start, end] width.
function bough(x, y, a, L, bend, w, n = 6, per = 4) {
  const pts = [[x, y]];
  let px = x, py = y;
  for (let i = 1; i <= n; i++) {
    const g = rad(a + (bend * i) / n);
    px += (Math.cos(g) * L) / n; py += (Math.sin(g) * L) / n;
    pts.push([px, py]);
  }
  return { d: taper(pts, pts.map((_, i) => w[0] + ((w[1] - w[0]) * i) / n), { per }), end: [px, py], pts };
}

// A tendril from (x, y) heading `a` degrees, bending as it goes and rolling
// up at the end.
function tendril(x, y, a, L, { bend = 40, w = 2.6, curl = 5 } = {}) {
  const pts = [[x, y]];
  let px = x, py = y, ang = a;
  for (let i = 1; i <= 5; i++) { ang += bend / 5; px += (Math.cos(rad(ang)) * L) / 5; py += (Math.sin(rad(ang)) * L) / 5; pts.push([px, py]); }
  const dir = Math.sign(bend) || 1, cx = px + Math.cos(rad(ang + dir * 90)) * curl, cy = py + Math.sin(rad(ang + dir * 90)) * curl;
  let th = Math.atan2(py - cy, px - cx);
  for (let k = 1; k <= 8; k++) { th += dir * 0.7; const rr = curl * (1 - k / 11); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  return taper(pts, pts.map((_, i) => Math.max(0.4, w * (1 - i / pts.length))), { per: 4 });
}

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// Soft woodland: round crowns of uneven size whose tops follow a slow wave,
// traced as one outline. `prof(x)` scales heights across the layer.
function woods({ seed, base, top, x0 = -12, x1 = W + 12, r0 = 8, r1 = 16, prof = null }) {
  const r = rng(seed);
  const ph1 = r() * 7, ph2 = r() * 7;
  const crowns = [];
  for (let x = x0; x <= x1;) {
    const rr = r0 + r() * (r1 - r0);
    let w = 0.55 + 0.27 * Math.sin(x / 43 + ph1) + 0.16 * Math.sin(x / 15 + ph2) + (r() - 0.5) * 0.2;
    if (prof) w = prof(x) < 0 ? prof(x) : w * prof(x);
    w = Math.max(-2, Math.min(1, w));
    const y = base - (base - top) * w;
    crowns.push([x, y + rr, rr]);
    if (r() < 0.75) {
      const a = (r() < 0.5 ? -1 : 1) * (0.42 + r() * 0.3), pr = rr * (0.38 + r() * 0.2);
      crowns.push([x + a * rr, y + rr - Math.sqrt(1 - a * a) * rr + pr * 0.5, pr]);
    }
    x += rr * (0.6 + r() * 0.35);
  }
  const pts = [];
  for (let x = x0 - r1; x <= x1 + r1; x += 1.5) {
    let y = H + 8;
    for (const [cx, cy, rr] of crowns) {
      const dx = x - cx;
      if (Math.abs(dx) < rr) y = Math.min(y, cy - Math.sqrt(rr * rr - dx * dx));
    }
    pts.push([x, y]);
  }
  return `M${f1(x0 - r1)},${H + 8}L` + pts.map(pt).join('L') + `L${f1(x1 + r1)},${H + 8}Z`;
}

// A fern frond from (x, y): its stalk leaves at `a` degrees and bends by
// `bend` degrees over its length L, with paired leaflets shrinking toward
// the tip; `curl` rolls the tip up into a fiddlehead of that radius.
function frond(x, y, a, L, { bend = 30, n = 7, lw = 0.32, curl = 0, w = 2.4, lp = 3 } = {}) {
  const pts = [[x, y]];
  let px = x, py = y;
  for (let i = 1; i <= 8; i++) {
    const ang = rad(a + (bend * i) / 8);
    px += (Math.cos(ang) * L) / 8; py += (Math.sin(ang) * L) / 8;
    pts.push([px, py]);
  }
  const stem = pts.length;
  if (curl) {
    const dir = Math.sign(bend) || 1, ang = rad(a + bend);
    const cx = px + Math.cos(ang + (dir * Math.PI) / 2) * curl, cy = py + Math.sin(ang + (dir * Math.PI) / 2) * curl;
    let th = Math.atan2(py - cy, px - cx);
    for (let k = 1; k <= 10; k++) { th += dir * 0.62; const rr = curl * (1 - k / 13); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  }
  const out = [taper(pts, pts.map((_, i) => Math.max(0.5, w * (1 - (0.75 * i) / pts.length))), { per: 3 })];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), j = Math.min(stem - 2, Math.floor(t * (stem - 1))), [qx, qy] = pts[j], [rx, ry] = pts[j + 1];
    const ang = (Math.atan2(ry - qy, rx - qx) * 180) / Math.PI, l = L * lw * (1 - t * 0.72);
    out.push(leafAt(qx, qy, ang - 58, l, 0.36, lp), leafAt(qx, qy, ang + 58, l, 0.36, lp));
  }
  return out;
}

// A head in profile looking right, centred on the skull: brow, nose, an
// open mouth, chin. `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);
// The same head with the jaw dropped in a roar.
const ROAR = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.8, 1.9],
  [7.8, 3.2], [3.2, 5.4], [7.2, 8], [6, 10.4], [3, 11.4], [0.6, 11.6]];
const roar = (cx, cy, k, tilt) => rot(poly(ROAR.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);

// A small fish swimming along `a` degrees: body and forked tail.
const fish = (x, y, l, a) => rot(U(lens(x, y, l, 0, 0.42, 3), poly([[x - l * 0.42, y], [x - l * 0.78, y - l * 0.24], [x - l * 0.7, y], [x - l * 0.78, y + l * 0.24]])), x, y, a);

// Smoke banks lying across a sky: [[x, y, rx, ry, opacity], ...].
const smoke = (fill, list) => `<g fill="${fill}">${list.map(([x, y, rx, ry, o]) =>
  `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`;

// Heat shimmer: broad, faint, wavering ribbons of hot air standing over
// something hot, thin at both ends, of uneven heights. `fill` should fade
// upward.
function shimmer(seed, x0, x1, y0, y1, n, fill, op = 0.1) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n + (R() - 0.5) * 8, amp = 1.5 + R() * 2, ph = R() * 6;
    const b = y1 - R() * 10, t = y0 + R() * (y1 - y0) * 0.35, pts = [];
    for (let k = 0; k <= 6; k++) { const y = b + ((t - b) * k) / 6; pts.push([x + Math.sin(ph + k * 1.3) * amp * (0.4 + k * 0.12), y]); }
    const w = 5 + R() * 4;
    out += `<path class="float" style="--t:${f1(2.5 + R() * 2)}s;--d:-${f1(R() * 3)}s" d="${taper(pts, [0.5, w, w * 1.1, w, 0.5], { per: 4 })}" fill="${fill}" opacity="${f1(op * (0.6 + R() * 0.6))}"/>`;
  }
  return out;
}

// A column of smoke: soft puffs that grow, lean and fade as they rise.
function smokeCol(s, x, y, h, w, lean, color, op, n = 7) {
  const g = s.rad([[0, color, 1], [0.55, color, 0.6], [1, color, 0]]);
  let out = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), r = w * (0.85 + t * 1.4);
    out += `<ellipse cx="${f1(x + lean * h * t * t)}" cy="${f1(y - h * t)}" rx="${f1(r * 1.35)}" ry="${f1(r)}" fill="${g}" opacity="${f1(op * (1 - t * 0.7))}"/>`;
  }
  return `<g class="drift">${out}</g>`;
}

// A jagged crack across flat ground from (x, y) heading `a` degrees, flattened
// by the ground's perspective, thinning to nothing.
function crack(seed, x, y, a, L, w, n = 6, flat = 0.45) {
  const R = rng(seed), pts = [[x, y]];
  let px = x, py = y, g = a;
  for (let i = 1; i <= n; i++) { g += (R() - 0.5) * 70; px += (Math.cos(rad(g)) * L) / n; py += ((Math.sin(rad(g)) * L) / n) * flat; pts.push([px, py]); }
  return taper(pts, pts.map((_, i) => Math.max(0.15, w * (1 - i / n))), { per: 1 });
}

// ── the heart ───────────────────────────────────────────────────────
// A heart's outline, drawn in halves split down a jagged crack so the two can
// be pried apart: the half on side -1 (left) or 1 (right), in units where the
// notch is at (0, -5) and the point at (0, 17).
const CRACK = [[0, -5], [1.4, -1.6], [-1.1, 1.6], [1.7, 5], [-0.7, 8.6], [1, 12], [-0.4, 14.6], [0, 17]];
function heartHalf(side, seed, n = 22) {
  const R = rng(seed), out = [];
  for (let i = 0; i <= n; i++) {
    const t = side > 0 ? (Math.PI * i) / n : Math.PI + (Math.PI * i) / n;
    let x = 16 * Math.sin(t) ** 3, y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    // a lumpy, chipped stone rather than a drawn symbol; the left lobe fuller
    if (i > 0 && i < n) { const j = (R() - 0.5) * 1.6, k = 1 + (R() < 0.18 ? -0.07 : 0) + (side < 0 ? 0.05 : 0); x = x * k + x * j * 0.04; y = y * k + j * 0.7; }
    out.push([x, y]);
  }
  const crack = side > 0 ? [...CRACK].reverse() : CRACK;
  return [...out, ...crack.slice(1, -1)];
}

export const ultra_a = {
  // ── Ember ─────────────────────────────────────────────────────────

  // A stone heart on a black rock, split open down a jagged crack; the
  // molten fire inside pours light out of it, the air above it shakes.
  'kindling-heart'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#120404'], [0.4, '#330f09'], [0.72, '#6a2210'], [1, '#a4401a']]));
    s.glow(150, 200, 170, '#ff6a1f', 0.35);
    s.add(smoke('#2a0906', [[70, 30, 84, 6, 0.4], [236, 50, 70, 5, 0.3], [150, 12, 120, 6, 0.32]]));
    s.layer(ridge({ seed: 10101, base: 166, amp: 46, peaks: true, freq: 2.6 }), '#4a160b', { blur: 0.7 });
    s.haze(136, 174, '#ff7a2e', 0.3);
    s.path(ridge({ seed: 10102, base: 182, amp: 14, freq: 3.2 }), '#2a0c07');
    s.add(`<ellipse cx="62" cy="180" rx="70" ry="5" fill="${s.rad([[0, '#ffb04a', 0.6], [0.5, '#ff7a2e', 0.3], [1, '#ff7a2e', 0]])}"/>`);
    // its light
    const hx = 150, hy = 96, k = 2.6, tilt = -9, gap = 6.5;
    s.glow(hx, hy, 150, '#ff8a32', 0.5);
    s.glow(hx, hy - 6, 60, '#ffc25a', 0.5, 'breathe');
    // the heart: two halves pried apart from the point up, fire in the split
    // (drawn upright, then the whole heart is tipped)
    const ox = hx, oy = hy - 2.5 * k, tip = [ox, oy + 17 * k], place = at(ox, oy, k);
    const T = (d, side) => rot(rot(d, tip[0], tip[1], side * gap), hx, hy, tilt);
    const half = (side) => T(place(poly(heartHalf(side, 10103 + side))), side);
    // the rock it sits in, cupping its point
    const [tx, ty] = rot(`M${f1(tip[0])},${f1(tip[1])}`, hx, hy, tilt).slice(1).split(',').map(Number);
    s.figure(`<path d="${ledge([[62, 214], [72, 184], [88, 164], [110, 150], [132, ty + 1], [tx, ty + 4], [176, ty], [198, 147], [216, 158], [230, 178], [238, 214]])}"/>`,
      { fill: '#170705', rim: '#ff9a4a', offsets: [[0, -1.3], [-0.8, -0.8], [0.8, -0.8]], rimOp: 0.85, shade: 0.6 });
    s.add(`<path d="M92,166l9,6l-2,10M212,160l-7,8l3,9M118,152l7,5l1,6M190,150l-6,6" fill="none" stroke="#ff8a3a" stroke-width="1" opacity=".5"/>`);
    s.add(`<ellipse cx="${f1(tx)}" cy="${f1(ty + 1)}" rx="30" ry="5" fill="${s.rad([[0, '#ffd27a', 0.85], [0.5, '#ff8a32', 0.4], [1, '#ff8a32', 0]])}"/>`);
    s.add(`<ellipse cx="${ox}" cy="${f1(oy + 3 * k)}" rx="${f1(7 * k)}" ry="${f1(10 * k)}" transform="rotate(${tilt} ${hx} ${hy})" fill="${s.radU(ox, oy + 1 * k, 13 * k, [[0, '#fffbe8'], [0.25, '#ffe9a0'], [0.6, '#ffa040'], [1, '#d2401a']])}"/>`);
    const halves = half(-1) + half(1);
    s.add('<g data-part="heart">');
    s.figure(`<path d="${halves}"/>`, { fill: '#1c0907', rim: '#ffa04a', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.95, shade: 0.55, light: [0, -1] });
    // the stone red-hot along the split, cooling to black at its edges
    s.path(halves, s.radU(hx, hy + 2, 40, [[0, '#ff7a2e', 0.75], [0.45, '#c2401a', 0.35], [1, '#7a1e0c', 0]]));
    s.add(`<path d="${T(place('M-12,-7L-9,1L-12,9M-6,-10L-4,-3M-15,2L-9,3'), -1)}${T(place('M9,-8L12,0L9,6M5,-10L7,-3M13,4L8,7'), 1)}" fill="none" stroke="#3a1610" stroke-width="1.1" opacity=".85"/>`);
    // glowing seams: the lips of the split, and cracks running out from it
    const seams = [
      [-1, [[1.4, -1.6], [-3, -4], [-7, -5], [-10, -9]], [1.6, 1.1, 0.8, 0.3]], [-1, [[-1.1, 1.6], [-5, 3], [-9, 2], [-13, 4]], [1.6, 1.1, 0.8, 0.3]],
      [-1, [[-0.7, 8.6], [-4, 10], [-7, 8]], [1.4, 0.9, 0.3]], [-1, [[-5, 3], [-6, 6], [-9, 7]], [0.9, 0.6, 0.2]],
      [1, [[1.7, 5], [5, 3], [9, 4], [13, 1]], [1.6, 1.1, 0.8, 0.3]], [1, [[1.4, -1.6], [4, -5], [6, -9], [9, -10]], [1.4, 1, 0.7, 0.3]],
      [1, [[1, 12], [4, 12], [6, 10]], [1.2, 0.8, 0.3]], [1, [[9, 4], [10, 8], [8, 11]], [0.9, 0.6, 0.2]],
    ];
    const cracks = seams.map(([side, pts, w]) => T(place(taper(pts, w, { per: 4 })), side)).join('');
    // fire licking up out of the open top of the split
    const [fx, fy] = rot(`M${ox},${f1(oy - 3 * k)}`, hx, hy, tilt).slice(1).split(',').map(Number);
    const flame = lick(fx, fy + 6, -96, 40, 13, 0.3) + lick(fx - 3, fy + 6, -114, 24, 7, -0.4) + lick(fx + 3, fy + 6, -80, 26, 7, 0.4);
    s.bloom(`<path d="${flame}" fill="${s.linU(0, fy + 8, 0, fy - 36, [[0, '#fff3c8'], [0.4, '#ffb04a', 0.95], [1, '#ff6a1f', 0.2]])}"/>` +
      `<path d="${T(place(poly(CRACK, false)), -1)}${T(place(poly(CRACK, false)), 1)}" fill="none" stroke="#ffd27a" stroke-width="1.6" stroke-linejoin="round"/>` +
      `<path d="${cracks}" fill="#ffc25a"/>`, { sd: 2, k: 1.45, box: [80, 10, 140, 160] });
    s.add('</g>');
    s.add(shimmer(10104, 116, 180, 4, 52, 4, s.linU(0, 52, 0, 4, [[0, '#ffd8a0', 0.9], [1, '#ffd8a0', 0]]), 0.09));
    s.motes({ seed: 10105, n: 26, x: [104, 196], y: [14, 150], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 6] });
    s.motes({ seed: 10106, n: 12, x: [20, 280], y: [40, 200], r: [0.4, 0.9], fill: '#ff8a3a', cls: 'rise', t: [5, 9], op: [0.3, 0.7] });
    // dark rocks at the near corners
    s.path(ledge([[-10, 214], [-10, 186], [14, 182], [36, 190], [54, 214]]) + ledge([[244, 214], [260, 188], [286, 180], [310, 184], [310, 214]]), '#0c0302');
    return s.svg();
  },

  // A scarred berserker on a rise above a burning field, head thrown back
  // in a roar, his axe cocked over his head with fire streaming off the
  // blade; every wound on him glows like a coal.
  'bloodrage-berserker'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#1a0505'], [0.35, '#4a1209'], [0.62, '#8e2e12'], [0.82, '#c75a24'], [1, '#e07a36']]));
    s.glow(150, 196, 190, '#ff7a2e', 0.42);
    s.add(smoke('#2a0906', [[54, 26, 90, 6, 0.42], [244, 44, 80, 5, 0.32], [160, 10, 120, 6, 0.3], [30, 70, 60, 4, 0.22]]));
    // the burning field behind him: far hills, fires along the skyline
    s.layer(ridge({ seed: 10201, base: 160, amp: 24, freq: 2.2 }), '#5e1e0e', { blur: 0.7 });
    s.haze(132, 166, '#ff8a3a', 0.3);
    const R = rng(10202);
    let fires = '';
    for (let x = -6; x < 310; x += 7 + R() * 12) {
      if (x > 100 && x < 200) continue;
      const h = 3 + R() * 5, y = 168 + R() * 3;
      fires += lick(x, y, -90 + (R() - 0.5) * 20, h, 2.4 + R() * 2, R() - 0.5);
    }
    s.path(ridge({ seed: 10203, base: 176, amp: 10, freq: 3 }), '#2c0c07');
    s.add(`<path d="${fires}" fill="#ffb04a" opacity=".6"/>`);
    // the rise he stands on
    s.figure(`<path d="${ledge([[40, 214], [60, 198], [92, 190], [130, 187], [168, 188], [204, 192], [236, 200], [262, 214]])}"/>`,
      { fill: '#170605', rim: '#ff9447', offsets: [[0, -1.2]], rimOp: 0.75, shade: 0.5 });
    // the berserker: wide stance, fur over his shoulders, head back roaring,
    // one fist clenched low behind him, the axe cocked back over his head
    // (the axe: u runs along the haft, v out to the edge)
    const fx = 146, fy = 189, K = 0.86, place = at(fx, fy, K);
    const top = [-10, -158], dir = [-0.707, -0.707], perp = [0.707, -0.707];
    const ax = (u, v) => [top[0] + u * dir[0] + v * perp[0], top[1] + u * dir[1] + v * perp[1]];
    const blade = poly([[6, 0], [11, 10], [16, 22], [2, 27.5], [-16, 22], [-13, 10], [-9, 0]].map(([u, v]) => ax(u, v)));
    const spike = poly([[3, 0], [-1, -10], [-6, 0]].map(([u, v]) => ax(u, v)));
    const edge = place(poly(spline([[17, 21], [9, 25.6], [2, 27.5], [-6, 26.4], [-17, 21]].map(([u, v]) => ax(u, v)), 4), false));
    // the fire streaming up off the blade, behind it
    const [bx, by] = place(`M${ax(0, 16).map(f1).join(',')}`).slice(1).split(',').map(Number);
    s.add('<g data-part="glow">');
    s.glow(bx, by - 14, 80, '#ff9a3a', 0.5);
    s.add('</g>');
    s.add('<g data-part="fire">');
    const fire = s.radU(bx, by, 70, [[0, '#fff6d8'], [0.2, '#ffe08a'], [0.45, '#ffa040', 0.95], [0.8, '#ff6a1f', 0.7], [1, '#d23c14', 0.2]]);
    s.bloom(`<path d="${plume(bx + 4, by, -84, -120, 62, [16, 22, 18, 12, 5, 0.5]) + plume(bx - 6, by + 4, -116, -160, 46, [10, 14, 10, 5, 0.4]) +
      plume(bx + 10, by - 2, -60, -96, 42, [9, 12, 8, 3, 0.4]) + plume(bx - 10, by + 10, -150, -196, 34, [7, 9, 6, 2, 0.3])}" fill="${fire}"/>`, { sd: 2.4, k: 1.4, box: [60, -20, 170, 110] });
    s.add('</g>');
    const man = place(U(
      taper([[-5, -50], [-12, -27], [-20, -3]], [11.5, 9, 7]),
      taper([[6, -50], [13, -28], [18, -3]], [11.5, 9, 7]),
      ell(-21, -2, 6.4, 2.8), ell(20, -2, 6.8, 2.8),
      blob([[-12, -60], [12, -60], [15, -46], [17, -36], [11, -38], [6, -32], [1, -37], [-5, -32], [-10, -37], [-16, -34], [-15, -46]], 4),
      taper([[0, -54], [0, -72], [1, -88]], [24, 27, 33]),
      ell(-12, -88, 10, 7.5, -12), ell(14, -88, 10, 7.5, 12),
      poly([[-22, -84], [-23, -90], [-18, -92], [-15, -96], [-10, -93], [-5, -96], [0, -92], [5, -95], [10, -91], [15, -93], [19, -89], [24, -88], [21, -82], [0, -83]]),
      taper([[3, -92], [1, -99]], [12, 10], { per: 2 }),
      flipX(roar(0, -107, 1.2, -26), 0),
      taper([[2, -116], [9, -113], [13, -105], [14, -96]], [10, 10, 8, 3]),
      taper([[-7, -98], [-8, -92], [-6, -86]], [7, 5.5, 1.5]),
      taper([[15, -88], [24, -97], [28, -106]], [10.5, 9, 8]), taper([[28, -106], [26, -116], [21, -124]], [8, 7.5, 6.5]), ell(20.5, -126, 5, 4.5),
      taper([[30, -116], [10, -136], [-10, -158]], [3.4, 3.2, 3]), blade, spike,
      taper([[-12, -88], [-22, -78], [-28, -68]], [10.5, 9, 8]), taper([[-28, -68], [-34, -60], [-38, -52]], [8, 7.5, 6.5]), ell(-39, -49.5, 5, 4.6),
    ));
    s.figure(`<path d="${man}"/>`, { fill: p.fig, rim: '#ffb04a', offsets: [[-1.1, -0.6], [1.1, -0.6], [0, -1.2]], rimOp: 0.95, shade: 0.5, edge: 0.3, light: [0.2, -1] });
    // his wounds, glowing like coals, and the hot edge of the blade
    const wounds = place(U(
      taper([[-8, -84], [-2, -79], [4, -74]], [0.6, 2, 0.6]), taper([[-4, -70], [1, -67], [6, -64]], [0.5, 1.6, 0.5]),
      taper([[8, -44], [11, -38], [14, -31]], [0.5, 1.6, 0.5]),
      taper([[-29, -67], [-32, -63], [-35, -58]], [0.5, 1.4, 0.5]), taper([[-9, -18], [-12, -12], [-14, -6]], [0.5, 1.3, 0.5]),
      taper([[-2, -112], [-5, -106]], [0.4, 1.2], { per: 2 }),
    ));
    const armWound = place(U(taper([[17, -92], [21, -96], [25, -100]], [0.5, 1.5, 0.5])));
    s.bloom(`<g data-part="wounds"><path d="${wounds}" fill="#ffc25a"/></g><g data-part="edge"><path d="${armWound}" fill="#ffc25a"/><path d="${edge}" fill="none" stroke="#ffd27a" stroke-width="1.4"/></g>`, { sd: 1.6, k: 1.5, box: [90, 20, 120, 170] });
    s.motes({ seed: 10204, n: 30, x: [60, 260], y: [10, 180], r: [0.4, 1.3], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 7] });
    s.motes({ seed: 10205, n: 10, x: [100, 220], y: [20, 120], r: [0.5, 1.1], fill: '#ffd27a', cls: 'float', t: [3, 5], op: [0.5, 1] });
    return s.svg();
  },

  // A stout smith lunges at a great stone furnace, driving his long poker
  // into its white-hot mouth; fire roars out of the chimney top into a red
  // sky.
  'stoke-the-furnace'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#1c0605'], [0.4, '#52140a'], [0.7, '#a13a16'], [1, '#d4682c']]));
    s.glow(204, 20, 150, '#ff8a32', 0.45);
    s.add(smoke('#2a0906', [[70, 20, 90, 6, 0.38], [120, 52, 70, 4, 0.25], [280, 70, 60, 5, 0.25]]));
    s.layer(ridge({ seed: 10301, base: 176, amp: 26, freq: 2.4 }), '#5c1c0e', { blur: 0.7 });
    s.haze(150, 184, '#ff8a3a', 0.28);
    s.path('M-10,214L-10,190C60,188 140,189 200,190C250,191 280,189 310,190L310,214Z', s.lin([[0, '#2a0c07'], [1, '#0e0403']]));
    // the furnace: a squat stone body, the chimney stack, the arched mouth
    const mx = 200, my = 186;
    s.glow(mx, my - 14, 110, '#ff8a32', 0.5);
    const mouth = `M${mx - 18},${my}L${mx - 18},${my - 18}A18,18 0 0 1 ${mx + 18},${my - 18}L${mx + 18},${my}Z`;
    const body = U(poly([[148, 200], [148, 140], [156, 124], [174, 114], [234, 114], [252, 124], [262, 140], [262, 200]]),
      poly([[184, 118], [188, 40], [220, 40], [224, 118]]), poly([[180, 41], [180, 33], [228, 33], [228, 41]]));
    s.figure(`<path d="${body}"/>`, { fill: '#1e0a07', rim: '#ff9a4a', offsets: [[0, -1.3], [-1, -0.6], [1, -0.6]], rimOp: 0.9, shade: 0.5, light: [0, -1] });
    // courses of stone, catching the light
    let courses = '';
    for (let y = 48; y < 116; y += 8) courses += `M${f1(188 - (y - 40) * 0.05)},${y}H${f1(220 + (y - 40) * 0.05)}`;
    for (let y = 48, i = 0; y < 116; y += 8, i++) courses += `M${204 + (i % 2 ? 8 : -6)},${y}v8`;
    for (let y = 130; y < 198; y += 10) courses += `M${y < 140 ? 158 : 150},${y}H${y < 140 ? 250 : 260}`;
    for (let y = 130, i = 0; y < 198; y += 10, i++) for (let x = 160 + (i % 2) * 11; x < 258; x += 22) if (Math.abs(x - mx) > 24 || y < my - 40) courses += `M${x},${y}v10`;
    s.add(`<path d="${courses}" fill="none" stroke="#5a2414" stroke-width=".9" opacity=".75"/>`);
    // the mouth, white-hot
    s.add('<g data-part="mouth">');
    s.bloom(`<path d="${mouth}" fill="${s.radU(mx, my - 6, 26, [[0, '#ffffff'], [0.35, '#fff0b0'], [0.7, '#ffb04a'], [1, '#ff6a1f']])}"/>` +
      `<path d="${lick(mx - 8, my, -96, 18, 7, 0.3) + lick(mx + 2, my, -86, 22, 8, -0.3) + lick(mx + 10, my, -80, 14, 6, 0.3)}" fill="#fffbe8" opacity=".85"/>`, { sd: 2.4, k: 1.5, box: [150, 120, 100, 90] });
    s.add('</g>');
    s.add(`<ellipse cx="${mx - 20}" cy="${my + 8}" rx="70" ry="7" fill="${s.rad([[0, '#ffb04a', 0.7], [0.5, '#ff7a2e', 0.3], [1, '#ff7a2e', 0]])}"/>`);
    // the smith, lunging in, both hands on the poker
    const sx = 112, sy = 193, place = at(sx, sy, 1);
    const smith = place(U(
      taper([[-4, -46], [-13, -24], [-22, -3]], [10, 8, 6.5]),
      taper([[2, -46], [14, -31], [20, -3]], [10, 8.5, 6.5]),
      ell(-23, -2, 6, 2.6), ell(22, -2, 6.4, 2.6),
      blob([[-9, -46], [8, -44], [15, -52], [20, -64], [23, -76], [17, -83], [7, -81], [-1, -72], [-7, -60]], 5),
      blob([[8, -50], [16, -54], [21, -40], [18, -30], [11, -32]], 4),
      taper([[16, -80], [20, -86]], [9, 8], { per: 2 }),
      profile(23, -92, 1, 12), ell(21, -97.5, 7.4, 4, -12),
      taper([[17, -77], [24, -70], [29, -62]], [8, 7, 6.5]), taper([[29, -62], [35, -56], [40, -50]], [6.5, 6, 5.5]), ell(41, -49, 3.8, 3.4),
      taper([[10, -76], [12, -68], [16, -62]], [8, 7, 6.5]), taper([[16, -62], [21, -58], [26, -56]], [6.5, 6, 5.5]), ell(27, -55.5, 3.8, 3.4),
      taper([[2, -61.5], [86, -22.5]], [2.6, 2.2], { per: 2 }),
    ));
    s.figure(`<path d="${smith}"/>`, { fill: p.fig, rim: '#ffb04a', offsets: [[1.3, -0.2], [0.8, -1], [-0.6, -1]], rimOp: 0.95, shade: 0.5, edge: 0.3, light: [1, -0.4] });
    // the poker's tip, white in the fire; the fire roaring out of the stack
    s.add('<g data-part="tip">');
    s.glow(sx + 86, sy - 22, 14, '#fff6d8', 0.9);
    s.add('</g>');
    const fire = s.linU(0, 40, 0, -20, [[0, '#fffbe8'], [0.25, '#ffe08a'], [0.55, '#ffa040', 0.95], [1, '#e04a1a', 0.5]]);
    s.glow(204, 20, 60, '#ffd27a', 0.5, 'breathe');
    s.add('<g data-part="stack">');
    s.bloom(`<path d="${plume(204, 36, -90, -64, 64, [26, 30, 24, 15, 6, 0.6]) + plume(194, 36, -100, -80, 44, [14, 16, 12, 6, 0.4]) +
      plume(214, 36, -76, -46, 52, [14, 16, 11, 5, 0.4]) + lick(186, 36, -120, 22, 8, -0.4) + lick(222, 36, -60, 24, 8, 0.4)}" fill="${fire}"/>`, { sd: 2.4, k: 1.4, box: [150, -20, 150, 70] });
    s.add('</g>');
    s.motes({ seed: 10302, n: 30, x: [176, 290], y: [-4, 60], r: [0.4, 1.3], fill: '#ffc25a', hot: '#fff6d8', cls: 'rise', t: [3, 6] });
    s.motes({ seed: 10303, n: 12, x: [150, 250], y: [140, 196], r: [0.4, 1], fill: '#ffb04a', cls: 'rise', t: [3, 6], op: [0.5, 1] });
    return s.svg();
  },

  // Dusk: a volley of flaming arrows arcs high over a dark plain and comes
  // down toward a far line of spearmen standing against the sunset.
  'ember-volley'(s) {
    fin(s, 'ember');
    s.rect(s.lin([[0, '#1a0710'], [0.32, '#3e1014'], [0.58, '#7a2616'], [0.74, '#c2582a'], [0.82, '#e48a42'], [1, '#a8481f']]));
    s.add(particles({ seed: 10401, n: 14, x: [0, W], y: [0, 60], r: [0.25, 0.7], fill: '#ffe2c8', cls: 'twinkle', op: [0.2, 0.7], t: [2.5, 6] }));
    // the sun going down behind the far ridge
    const sx = 246, sy = 152;
    s.glow(sx, sy, 150, '#ffb04a', 0.55);
    s.glow(sx, sy, 40, '#ffe2a0', 0.7);
    s.add(`<circle cx="${sx}" cy="${sy}" r="12" fill="#fff0c8"/>`);
    s.add(smoke('#3a0f10', [[200, 120, 90, 3, 0.4], [80, 104, 70, 3, 0.3], [260, 134, 60, 2.4, 0.35]]));
    s.layer(ridge({ seed: 10402, base: 164, amp: 12, freq: 2 }), '#4a1810', { blur: 0.6 });
    s.haze(146, 170, '#ff9a4a', 0.3);
    // the line they are falling on: spearmen on the far ridge, shields up
    const crest = (x) => 158 - 3 * Math.sin(x / 31) - 2 * Math.sin(x / 13 + 1);
    s.path(poly([...Array.from({ length: 27 }, (_, i) => [120 + i * 7.6, crest(120 + i * 7.6)]), [318, 214], [120, 214]]) + 'M-10,214L-10,178C40,174 90,170 140,166L140,214Z', '#2a0c08');
    let men = '';
    const M = rng(10403);
    for (let x = 152; x < 304; x += 7 + M() * 4) {
      const b = crest(x) + 1, h = 11 + M() * 2.5, l = (M() - 0.5) * 3;
      men += U(taper([[x, b], [x + l * 0.3, b - h * 0.55], [x + l * 0.5, b - h * 0.85]], [3.6, 4.2, 3.4], { per: 3 }), ell(x + l * 0.5, b - h - 1.2, 1.8, 2, 0, 10),
        taper([[x + 2.4, b + 1], [x + 3 + l, b - h - 9]], [0.8, 0.6], { per: 2 }), M() < 0.6 ? ell(x - 2, b - h * 0.6, 2.6, 4, 0, 10) : '');
    }
    s.path(men, '#1c0806');
    // the plain, darkening toward us
    s.path(ledge([[-10, 186], [60, 182], [130, 180], [200, 182], [260, 186], [310, 184]]), s.lin([[0, '#1e0806'], [1, '#080202']]));
    // the volley: arrows past the top of their flight, coming down; the
    // nearest three larger, with the longest trails
    const fly = (x0, x1, h, t) => [x0 + (x1 - x0) * t, 232 + (156 - 232) * t - 4 * h * t * (1 - t)];
    const shots = [[-30, 226, 150, 0.74, 1.7], [-6, 252, 146, 0.76, 1.55], [-56, 270, 156, 0.7, 1.6], [-20, 290, 140, 0.8, 1],
      [10, 214, 130, 0.8, 1], [-70, 240, 160, 0.66, 1.05], [16, 300, 150, 0.7, 0.9], [-44, 200, 124, 0.82, 0.85], [-90, 284, 166, 0.62, 0.8]];
    let trails = '', cores = '', heads = '', shafts = '';
    for (const [x0, x1, h, t, k] of shots) {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push(fly(x0, x1, h, t - 0.16 * Math.sqrt(k) * (1 - i / 8)));
      const [hx, hy] = pts[8], [qx, qy] = fly(x0, x1, h, t - 0.01), a = Math.atan2(hy - qy, hx - qx), deg = (a * 180) / Math.PI;
      trails += taper(pts, [0.2, 0.6 * k, 1.2 * k, 2 * k, 2.6 * k, 3.4 * k, 4.4 * k, 5.4 * k, 6 * k], { per: 3 });
      cores += taper(pts.slice(3), [0.2, 0.5 * k, 0.8 * k, 1.1 * k, 1.4 * k, 1.8 * k], { per: 3 });
      heads += lick(hx + Math.cos(a) * 2 * k, hy + Math.sin(a) * 2 * k, deg + 180, 12 * k, 5.4 * k, 0.4) + lick(hx, hy, deg + 168, 8 * k, 3.2 * k, -0.4);
      shafts += taper([[hx - Math.cos(a) * 9 * k, hy - Math.sin(a) * 9 * k], [hx + Math.cos(a) * 4 * k, hy + Math.sin(a) * 4 * k]], [1 * k, 1 * k], { per: 2 }) +
        poly([[hx + Math.cos(a) * 7.5 * k, hy + Math.sin(a) * 7.5 * k], [hx + Math.cos(a + 1.9) * 2.6 * k, hy + Math.sin(a + 1.9) * 2.6 * k], [hx + Math.cos(a - 1.9) * 2.6 * k, hy + Math.sin(a - 1.9) * 2.6 * k]]);
      s.glow(hx, hy, 16 * k, '#ffb04a', 0.6);
    }
    s.bloom(`<path d="${trails}" fill="#ff8a3a" opacity=".45"/><path d="${cores}" fill="#ffd27a" opacity=".75"/>` +
      `<path d="${heads}" fill="${s.linU(0, 20, 0, 140, [[0, '#fff6d8'], [1, '#ffd27a']])}"/><path d="${shafts}" fill="#2a0a06"/>`, { sd: 1.8, k: 1.35 });
    s.motes({ seed: 10404, n: 26, x: [100, 290], y: [20, 150], r: [0.4, 1.1], fill: '#ffb04a', hot: '#fff0c0', cls: 'fall', op: [0.5, 1] });
    // the near slope, black
    s.path(ledge([[-10, 196], [40, 194], [90, 198], [130, 206], [160, 216]]), '#0b0302');
    return s.svg();
  },

  // A stone giant cups a molten orb in its two great hands, just below the
  // empty socket in its chest it is about to press it into; the socket
  // already glows.
  'molten-core'(s) {
    fin(s, 'ember');
    s.rect(s.lin([[0, '#1c0605'], [0.45, '#4c130a'], [0.75, '#9a3816'], [1, '#d06a2c']]));
    s.glow(150, 210, 170, '#ff7a2e', 0.4);
    s.layer(ridge({ seed: 10501, base: 176, amp: 44, peaks: true, freq: 2.8 }), '#4e180c', { blur: 0.7 });
    s.haze(150, 184, '#ff8a3a', 0.3);
    // the giant: a small heavy head, boulder shoulders, a chest of stone
    // slabs with an empty round socket in it, elbows out at its sides
    const gx = 150, ox = gx, oy = 138, sx = gx, sy = 96;
    const body = U(
      stone(gx, 40, 19, 17, 10502, 9, 0.12), taper([[gx, 50], [gx, 66]], [26, 32], { per: 2 }),
      stone(gx - 60, 78, 34, 26, 10503, 10, 0.18), stone(gx + 60, 78, 34, 26, 10504, 10, 0.18),
      poly([[gx - 70, 90], [gx - 56, 60], [gx + 56, 60], [gx + 70, 90], [gx + 60, 214], [gx - 60, 214]]),
      taper([[gx - 80, 84], [gx - 92, 116], [gx - 96, 150]], [36, 31, 28]),
      taper([[gx + 80, 84], [gx + 92, 116], [gx + 96, 150]], [36, 31, 28]),
    );
    s.figure(`<path d="${body}"/>`, { fill: '#2a120a', rim: '#ff9a4a', offsets: [[0, -1.4], [-1, -0.8], [1, -0.8]], rimOp: 0.85, shade: 0.5, light: [0, -1] });
    // the orb's light thrown up across the stone
    s.path(body, s.radU(ox, oy - 16, 100, [[0, '#ff8a3a', 0.7], [0.45, '#c2481c', 0.3], [1, '#c2481c', 0]]));
    s.add(`<path d="M${gx - 56},62L${gx - 42},92L${gx - 52},126L${gx - 44},166M${gx + 56},62L${gx + 42},92L${gx + 52},126L${gx + 44},166M${gx - 42},92L${gx - 26},96M${gx + 42},92L${gx + 26},96` +
      `M${gx - 52},126L${gx - 34},128M${gx + 52},126L${gx + 34},128M${gx - 90},112l10,4M${gx + 90},112l-10,4M${gx - 9},32l4,3M${gx + 9},32l-4,3M${gx - 30},190L${gx - 20},214M${gx + 30},190L${gx + 20},214" fill="none" stroke="#140604" stroke-width="1.6" opacity=".8"/>`);
    // the socket: a ragged hole in the stone, a dull ember deep inside it,
    // cracks running out from it as if they knew what was coming
    const hole = stone(sx, sy, 15, 13.5, 10507, 11, 0.32);
    s.glow(sx, sy, 40, '#ff9a3a', 0.35, 'breathe');
    s.path(hole, s.radU(sx, sy + 2, 16, [[0, '#7a240c'], [0.35, '#2e0c05'], [0.8, '#0a0302'], [1, '#050101']]));
    s.bloom(`<path d="${[crack(10508, sx - 13, sy - 4, 200, 22, 1.8, 4, 1), crack(10509, sx + 12, sy - 6, -20, 20, 1.8, 4, 1), crack(10510, sx - 6, sy - 13, -110, 18, 1.6, 4, 1),
      crack(10511, sx + 7, sy + 12, 60, 16, 1.6, 4, 1), crack(10512, sx - 9, sy + 11, 130, 14, 1.4, 4, 1)].join('')}" fill="#ffb04a"/>`, { sd: 1.4, k: 1.4, box: [100, 60, 100, 80] });
    // its eyes, on the orb
    s.glow(gx - 7, 42, 7, '#ffb04a', 0.9).glow(gx + 7, 42, 7, '#ffb04a', 0.9);
    // its forearms come in from the elbows to the great stone hands, cupped
    // together into a bowl under the orb, fingers curled up round it
    const arm = (side) => taper([[gx + side * 96, 150], [gx + side * 72, 164], [gx + side * 44, 168]], [28, 25, 22]);
    const fingers = [-1, 1].flatMap((side) => [[44, 154, 134], [37, 158, 138], [30, 161, 143], [23, 164, 149]].map(([x, y0, y1]) =>
      taper([[gx + side * x, y0], [gx + side * (x - 0.5), y1 + 5], [gx + side * (x - 3.5), y1]], [7, 6.4, 5.2], { per: 3 })));
    const hands = U(arm(-1), arm(1), fingers,
      blob([[gx - 48, 158], [gx - 40, 180], [gx - 18, 188], [gx, 185], [gx + 18, 188], [gx + 40, 180], [gx + 48, 158], [gx + 30, 162], [gx, 166], [gx - 30, 162]], 4));
    s.figure(`<path d="${hands}"/>`, { fill: '#1a0805', rim: '#ffc25a', offsets: [[0, -1.5], [-1, -0.9], [1, -0.9]], rimOp: 1, shade: 0.45, light: [0, -1] });
    s.add(`<path d="M${gx},168V186M${gx - 26},170l-4,12M${gx + 26},170l4,12" fill="none" stroke="#3e1a0c" stroke-width="1.2"/>`);
    // the orb: liquid rock, white at the heart, banded darker where it cools
    s.glow(ox, oy, 64, '#ffb04a', 0.55, 'breathe');
    const bands = U(taper([[ox - 12, oy - 2], [ox - 5, oy - 6], [ox + 3, oy - 4], [ox + 11, oy - 8]], [0.5, 2.6, 2.2, 0.5]),
      taper([[ox - 10, oy + 6], [ox - 2, oy + 3], [ox + 6, oy + 6], [ox + 12, oy + 3]], [0.5, 2.4, 2, 0.5]),
      taper([[ox - 7, oy - 10], [ox, oy - 11.6], [ox + 7, oy - 10]], [0.4, 1.6, 0.4]), taper([[ox - 8, oy + 10.5], [ox + 1, oy + 12], [ox + 8, oy + 10]], [0.4, 1.8, 0.4]));
    s.bloom(`<circle cx="${ox}" cy="${oy}" r="13" fill="${s.radU(ox - 3, oy - 4, 16, [[0, '#ffffff'], [0.3, '#fff0b0'], [0.68, '#ffb04a'], [1, '#e2501a']])}"/>` +
      `<path d="${bands}" fill="#d2501a" opacity=".55"/>`, { sd: 2.4, k: 1.5, box: [100, 92, 100, 100] });
    s.motes({ seed: 10506, n: 22, x: [116, 184], y: [70, 160], r: [0.4, 1.1], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [2.5, 5] });
    return s.svg();
  },

  // FIELD. A black plain after the fire: charred stumps smoking under an
  // orange haze, the ground still glowing in its cracks, embers on the wind.
  'scorched-earth'(s) {
    fin(s, 'ember');
    s.rect(s.lin([[0, '#3a1209'], [0.3, '#7a2e12'], [0.52, '#c2622a'], [0.62, '#e38a44'], [0.68, '#d2783a']]));
    // the sun, a dim disc in the haze
    s.glow(204, 76, 150, '#ffb05a', 0.5);
    s.add(`<circle cx="204" cy="76" r="15" fill="#ffd9a0" opacity=".75"/>`);
    s.add(smoke('#3a1408', [[60, 30, 110, 8, 0.4], [240, 18, 90, 6, 0.35], [150, 56, 120, 5, 0.25], [250, 100, 80, 4, 0.25]]));
    // the far edge of the plain, a few dead trunks along it
    const R = rng(10601);
    s.layer(ridge({ seed: 10602, base: 131, amp: 7, freq: 2 }), '#6a2a14', { blur: 0.6 });
    s.haze(110, 136, '#f0a060', 0.32);
    let far = '';
    for (const x of [22, 58, 98, 214, 236, 274]) {
      const h = 6 + R() * 10, l = (R() - 0.5) * 3;
      far += taper([[x, 133], [x + l, 133 - h]], [2.2, 0.7], { per: 2 }) + (R() < 0.6 ? taper([[x + l * 0.5, 133 - h * 0.55], [x + l + (R() < 0.5 ? -4 : 4), 133 - h * 0.85]], [1, 0.4], { per: 2 }) : '');
    }
    s.path(far, '#4a1c0e');
    // smoke going up from the far fires, leaning away on the wind
    s.add(smokeCol(s, 40, 128, 70, 6, 0.5, '#3a1810', 0.45, 10) + smokeCol(s, 252, 130, 64, 5, 0.6, '#3a1810', 0.4, 9) + smokeCol(s, 176, 134, 46, 4, 0.6, '#3a1810', 0.35, 8));
    // the plain: black, split by cracks that still glow
    s.path(ledge([[-10, 134], [60, 133], [140, 135], [220, 133], [310, 135]]), s.lin([[0, '#3a160c'], [0.25, '#1e0a06'], [1, '#080302']]));
    const cracks = [crack(10610, 150, 150, 120, 60, 2.2), crack(10611, 150, 150, 70, 70, 2.4), crack(10612, 200, 160, 20, 90, 2.2), crack(10613, 60, 170, 160, 70, 2.4),
      crack(10614, 190, 188, 100, 40, 3), crack(10615, 30, 196, 10, 60, 2.6), crack(10616, 240, 146, -10, 50, 1.4), crack(10617, 80, 148, 170, 60, 1.4)].join('');
    s.path(cracks, '#ff8a3a', 'opacity=".7"');
    // stumps across the middle distance
    const stump = (x, y, h, w, seed) => {
      const r = rng(seed);
      return poly([[x - w * 0.6, y], [x - w * 0.45, y - h * 0.55], [x - w * 0.5, y - h * 0.9], [x - w * 0.2, y - h * (0.8 + r() * 0.3)], [x, y - h * (1 + r() * 0.2)],
        [x + w * 0.2, y - h * (0.75 + r() * 0.2)], [x + w * 0.5, y - h * (0.9 + r() * 0.2)], [x + w * 0.45, y - h * 0.5], [x + w * 0.65, y]]);
    };
    s.path(stump(196, 150, 16, 7, 10603) + stump(250, 158, 22, 9, 10604) + stump(30, 154, 18, 8, 10605) + stump(160, 142, 9, 4, 10606) + stump(226, 143, 8, 4, 10607), '#1a0805');
    s.add(smokeCol(s, 250, 140, 40, 4, 0.7, '#4a2014', 0.45, 8));
    // the near trunk: snapped off and splintered, one limb broken short, its
    // roots clawing the ash; still smouldering inside
    const trunk = U(
      poly([...spline([[82, 216], [88, 190], [91, 160], [89, 128], [92, 102]], 4), [90, 90], [96, 82], [99, 94], [103, 76], [107, 70], [109, 86], [114, 80], [116, 96],
        ...spline([[117, 106], [119, 132], [121, 160], [124, 190], [132, 216]], 4)]),
      taper([[92, 128], [80, 125], [70, 127], [61, 125]], [8, 6.4, 5, 4]),
      taper([[116, 112], [128, 106], [134, 101]], [6, 4.5, 2]),
      taper([[90, 206], [74, 211], [58, 216]], [10, 6, 2]), taper([[122, 206], [140, 210], [156, 216]], [10, 6, 2]),
    );
    s.figure(`<path d="${trunk}"/>`, { fill: '#120604', rim: '#ffa04a', offsets: [[1, -0.8], [-0.6, -0.9]], rimOp: 0.8, shade: 0.5, edge: 0.25, light: [0.6, -1] });
    s.bloom(`<path d="${U(taper([[104, 198], [100, 184], [104, 170]], [1, 2.4, 0.6]), taper([[110, 160], [113, 147], [109, 134]], [0.8, 2.2, 0.5]),
      taper([[100, 122], [104, 112]], [1.6, 0.4]), taper([[104, 100], [103, 90]], [1.4, 0.3]))}" fill="#ffb04a"/>` +
      `<path d="M99,94L103,76L107,70L109,86" fill="none" stroke="#ffd27a" stroke-width="1.2"/>`, { sd: 1.6, k: 1.5, box: [50, 50, 100, 160] });
    s.add(smokeCol(s, 104, 72, 80, 8, 0.8, '#4a2014', 0.55, 12));
    // ash on the ground, embers on the wind
    s.add(particles({ seed: 10608, n: 8, x: [0, W], y: [150, 210], r: [0.6, 1.4], fill: '#3a1a10', cls: 'float', op: [0.4, 0.8] }));
    s.motes({ seed: 10609, n: 24, x: [0, 300], y: [40, 200], r: [0.4, 1.2], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [4, 8] });
    return s.svg();
  },

  // ── Verdant ───────────────────────────────────────────────────────

  // Close to the ground in a dim wood: a sprout no taller than a thumb has
  // just pushed up through the dark soil and opened its two first leaves;
  // one beam of sun has found it.
  sproutling(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#3e502c'], [0.4, '#5c7044'], [0.72, '#86965f'], [1, '#a2ac76']]));
    s.glow(60, 10, 150, '#fff3c0', 0.35);
    s.layer(woods({ seed: 11101, base: 154, top: 66, r0: 14, r1: 26 }), '#506439', { blur: 1.2 });
    s.haze(112, 156, '#c3cf94', 0.32);
    // the beam, and the light it leaves round the sprout
    const sx = 150, sy = 156;
    s.shafts({ cx: 20, cy: -60, n: 4, from: 52, to: 59, len: 320, spread: 2.4, color: '#fff6cc', op: 0.34, seed: 11102, sd: 3 });
    s.glow(sx, 100, 80, '#fff3c0', 0.55);
    s.motes({ seed: 11103, n: 18, x: [60, 180], y: [10, 150], r: [0.3, 0.8], fill: '#fff6cc', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    // dark soil, heaved up and cracked where it came through
    const soil = ledge([[-10, 160], [40, 157], [90, 159], [122, 155], [138, 151], [150, 150], [164, 151], [180, 156], [220, 159], [270, 156], [310, 159]]);
    s.figure(`<path d="${soil}"/>`, { fill: '#221a10', rim: '#d8c890', offsets: [[0, -1.1]], rimOp: 0.6, shade: 0.5, light: [0, -1] });
    s.add(`<ellipse cx="${sx}" cy="${sy - 4}" rx="40" ry="5" fill="${s.rad([[0, '#fff3c0', 0.55], [0.6, '#e6f78f', 0.15], [1, '#e6f78f', 0]])}"/>`);
    s.add(`<path d="M146,156l-14,3M156,156l12,2M150,157l-3,6" fill="none" stroke="#0e0a06" stroke-width="1" opacity=".7"/>`);
    s.figure(`<path d="${U(stone(130, 151, 7, 5, 11104, 7, 0.3), stone(169, 150, 6, 4.4, 11105, 7, 0.3), stone(120, 157, 4, 3, 11106, 6, 0.3), stone(180, 155, 3.6, 2.8, 11107, 6, 0.3), stone(140, 147, 3, 2.4, 11108, 6, 0.3))}"/>`,
      { fill: '#2a2014', rim: '#f0e0a8', offsets: [[-0.6, -0.9]], rimOp: 0.75 });
    // the sprout: a pale stem, two fleshy first leaves, the next one coming
    const stem = taper([[sx, sy - 2], [sx - 3, 138], [sx + 1, 116], [sx, 96]], [8, 7, 6, 5]);
    s.figure(`<path d="${stem}"/>`, { fill: '#3c5226', rim: p.rim, offsets: [[-1, -0.4], [1, -0.4]], rimOp: 0.85, shade: 0.4, light: [-0.5, -1] });
    const leaves = U(leafAt(sx, 95, -160, 52, 0.5, 5), leafAt(sx, 95, -22, 54, 0.5, 5));
    s.glow(sx, 88, 50, '#f2ffb0', 0.5, 'breathe');
    s.bloom(`<path d="${leaves}" fill="${s.radU(sx, 92, 56, [[0, '#fbffe0'], [0.45, '#eefaa6'], [1, '#bcd46a']])}"/>` +
      `<path d="M${sx},95L${sx - 46},78M${sx},95L${sx + 47},76" fill="none" stroke="#9cb456" stroke-width="1" opacity=".7"/>` +
      `<path d="${lens(sx, 86, 15, -90, 0.46)}" fill="#f8ffd2"/>`, { sd: 2, k: 1.35, box: [80, 50, 140, 70] });
    // the husk of its seed still caught on one leaf
    s.path(lens(sx - 49, 77, 11, -160, 0.62), '#6a5230');
    // a fallen leaf and grass at the edges
    s.figure(`<path d="${U(lens(250, 166, 60, -14, 0.34), taper([[218, 174], [212, 178]], [2, 1], { per: 2 }))}"/>`, { fill: '#1c2410', rim: p.rim, offsets: [[0, -1]], rimOp: 0.5 });
    s.add('<path d="M222,173L278,158" fill="none" stroke="#2e3a1c" stroke-width=".9"/>');
    const G = rng(11109), blades = [];
    for (const [x0, n, hh] of [[-6, 7, 40], [24, 4, 22], [262, 5, 26], [290, 6, 42]]) {
      for (let i = 0; i < n; i++) {
        const x = x0 + i * 3.4 + G() * 2, h = hh * (0.55 + G() * 0.5), l = (G() - 0.5) * 16;
        blades.push(taper([[x, 216], [x + l * 0.3, 214 - h * 0.5], [x + l, 214 - h]], [2.2, 1.4, 0.3], { per: 4 }));
      }
    }
    s.path(U(blades), '#141c0c');
    return s.svg();
  },

  // A cluster of mushrooms glowing on a mossy mound in the evening wood;
  // little new caps push up all round them, spores drift off, and threads of
  // light run between them all under the moss.
  'mycelium-bud'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#a7b384'], [0.35, '#83966a'], [0.7, '#4c5f37'], [1, '#26321c']]));
    s.glow(150, 118, 170, '#fff3c0', 0.5);
    s.layer(woods({ seed: 11201, base: 150, top: 54, r0: 12, r1: 22 }), '#6c7f4e', { blur: 0.8 });
    s.haze(108, 156, '#e4e6b0', 0.32);
    s.path(woods({ seed: 11202, base: 178, top: 138, r0: 8, r1: 14 }), '#3a4c2c');
    // the mound, furred with moss
    const R = rng(11203);
    const moss = [];
    for (let x = 40; x <= 262; x += 5 + R() * 4) { const y = 170 + Math.pow(Math.abs(x - 152) / 112, 2) * 34; moss.push([x, y + 2, 3 + R() * 3]); }
    const mound = U(ledge([[28, 214], [50, 196], [90, 179], [150, 172], [210, 178], [250, 194], [276, 214]]), moss.map(([x, y, r]) => ell(x, y, r * 1.2, r, 0, 10)));
    s.figure(`<path d="${mound}"/>`, { fill: '#1e2a15', rim: '#e6f0b0', offsets: [[0, -1.1]], rimOp: 0.6, shade: 0.4, light: [0, -1] });
    // threads of light under the moss, joining every cap to every other
    const threads = [taper([[150, 180], [124, 186], [96, 194], [66, 204]], [1.6, 1.2, 0.9, 0.3], { per: 4 }), taper([[150, 180], [176, 188], [210, 194], [244, 206]], [1.6, 1.2, 0.9, 0.3], { per: 4 }),
      taper([[124, 186], [118, 198], [104, 214]], [1, 0.7, 0.2], { per: 4 }), taper([[176, 188], [186, 200], [180, 214]], [1, 0.7, 0.2], { per: 4 }),
      taper([[96, 194], [84, 190], [74, 188]], [0.8, 0.5, 0.2], { per: 4 }), taper([[210, 194], [222, 190], [232, 188]], [0.8, 0.5, 0.2], { per: 4 }),
      taper([[150, 180], [148, 196], [142, 214]], [1.2, 0.8, 0.2], { per: 4 })].join('');
    // the mushrooms: a stout one in the middle, smaller ones leaning out
    // from it, and the new caps coming up round them
    const cap = (cx, cy, rx, ry, a) => rot(blob([[cx - rx, cy], [cx - rx * 0.72, cy - ry * 0.8], [cx, cy - ry], [cx + rx * 0.72, cy - ry * 0.8], [cx + rx, cy], [cx + rx * 0.45, cy + ry * 0.18], [cx, cy + ry * 0.22], [cx - rx * 0.45, cy + ry * 0.18]], 5), cx, cy, a);
    const list = [[148, 176, 66, 30, 17, -4, -3], [112, 180, 44, 20, 11, -14, -7], [188, 180, 38, 17, 9.5, 12, 6], [130, 182, 22, 10, 6, -8, -2], [208, 184, 16, 8, 5, 12, 2],
      [92, 188, 12, 6, 3.6, -10, -1], [76, 192, 7, 4, 2.6, -8, 0], [228, 190, 8, 4.4, 2.8, 8, 1], [168, 182, 9, 4.4, 2.8, 6, 1], [246, 198, 5, 3, 2, 6, 0], [58, 200, 5, 3, 2, -6, 0]];
    const tops = list.map(([x, y, h, rx, ry, a, b]) => ({ x: x + b, y: y - h, rx, ry, a, d: U(taper([[x, y], [x + b * 0.4, y - h * 0.5], [x + b, y - h]], [rx * 0.36, rx * 0.27, rx * 0.22], { per: 4 }), cap(x + b, y - h, rx, ry, a)) }));
    s.glow(148, 120, 90, '#f2ffb0', 0.5, 'breathe');
    s.figure(`<path d="${tops.map((t) => t.d).join('')}"/>`, { fill: '#1b2714', rim: p.rim, offsets: [[0, -1.2], [-0.8, -0.8], [0.8, -0.8]], rimOp: 0.9, shade: 0.4, light: [0, -1] });
    // the light under every cap, and the specks on the big ones
    const gills = tops.map((t) => rot(ell(t.x, t.y + t.ry * 0.12, t.rx * 0.9, Math.max(1, t.ry * 0.26), 0, 18), t.x, t.y, t.a)).join('');
    const specks = dots(tops.slice(0, 4).flatMap((t) => [[t.x - t.rx * 0.42, t.y - t.ry * 0.5, t.rx * 0.07], [t.x + t.rx * 0.12, t.y - t.ry * 0.78, t.rx * 0.08], [t.x + t.rx * 0.52, t.y - t.ry * 0.36, t.rx * 0.06]]));
    s.bloom(`<path d="${threads}" fill="#f2ffc0" opacity=".8"/><path d="${gills}" fill="#f4ffc4"/><path d="${specks}" fill="#f7ffd8" opacity=".9"/>`, { sd: 1.8, k: 1.4, box: [40, 70, 220, 145] });
    s.motes({ seed: 11204, n: 30, x: [70, 230], y: [30, 170], r: [0.3, 0.9], fill: '#eefaa6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 1] });
    s.add(particles({ seed: 11205, n: 12, x: [90, 210], y: [60, 150], r: [0.4, 0.8], fill: '#f7ffc8', cls: 'rise', t: [6, 10], op: [0.4, 0.9] }));
    // ferns at the near corners
    s.path(U(frond(-6, 214, -62, 56, { bend: 34, n: 7, w: 3.2 }), frond(6, 214, -86, 44, { bend: 26, n: 6, w: 2.8 }), frond(306, 214, -118, 56, { bend: -34, n: 7, w: 3.2 }), frond(294, 214, -94, 44, { bend: -26, n: 6, w: 2.8 })), '#121a0b');
    return s.svg();
  },

  // A tall tree-woman, her hair a mane of roots, bends over a stag lying
  // wounded in a sunlit clearing; the vines from her fingers wind round it
  // and its wounds glow green as they close.
  rootmother(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f4eec6'], [0.4, '#dfe2ac'], [0.75, '#b4c48c'], [1, '#93a873']]));
    s.glow(224, 30, 160, '#fff7d2', 0.9);
    s.shafts({ cx: 224, cy: 10, from: 96, to: 160, n: 9, len: 280, spread: 2.4, color: '#fffbe2', op: 0.26, seed: 11301 });
    s.layer(woods({ seed: 11302, base: 132, top: 46, r0: 12, r1: 22 }), '#b3c28e', { blur: 0.7 });
    s.haze(100, 142, '#f6f4d6', 0.36);
    s.path(woods({ seed: 11303, base: 164, top: 116, r0: 10, r1: 18 }), '#8ea36d');
    s.haze(142, 172, '#eef0c8', 0.28);
    s.path('M-10,214L-10,182C60,178 120,180 160,182C220,184 260,179 310,181L310,214Z', s.lin([[0, '#7e9658'], [0.5, '#56703c'], [1, '#2f4220']]));
    s.add(`<ellipse cx="190" cy="186" rx="76" ry="8" fill="${s.rad([[0, '#f6ffc8', 0.6], [1, '#e6f78f', 0]])}"/>`);
    // the stag, lying with its legs folded, its head turned up to her
    const stag = U(
      ell(226, 174, 30, 13, -3), ell(250, 170, 13, 12), ell(204, 170, 13, 13),
      taper([[206, 166], [200, 146], [193, 126]], [16, 13, 10]), ell(190, 118, 7.5, 6.4, -30),
      taper([[187, 120], [175, 127]], [8.4, 5], { per: 2 }),
      lens(199, 112, 10, -20, 0.42), lens(181, 111, 9, -160, 0.42),
      taper([[204, 180], [190, 185], [176, 186]], [7, 5, 4]), taper([[246, 180], [258, 186], [268, 186]], [8, 5, 4]),
      taper([[262, 168], [267, 164]], [4, 1.4], { per: 2 }),
    );
    const antler = (side) => {
      const b = bough(side > 0 ? 194 : 189, 110, side > 0 ? -66 : -114, 40, side > 0 ? -26 : 26, [3.8, 1.4]);
      const tines = [0.3, 0.55, 0.8].map((t, i) => { const q = b.pts[Math.round(t * 6)]; return taper([q, [q[0] + side * (5 + i * 2), q[1] - 11 + i * 2]], [2, 0.5], { per: 2 }); });
      return [b.d, ...tines];
    };
    s.figure(`<path d="${U(stag, antler(1), antler(-1))}"/>`, { fill: '#2c3218', rim: '#fff3c0', offsets: [[0, -1.2], [0.8, -0.8]], rimOp: 0.85, shade: 0.4, light: [0.4, -1] });
    // her: roots for feet, a trunk for a body, bowed over it
    const fx = 108, fy = 188, place = at(fx, fy, 1);
    const her = place(U(
      taper([[0, -4], [-12, 0], [-26, 3]], [8, 5, 1.4]), taper([[2, -4], [14, 0], [26, 2]], [8, 5, 1.4]), taper([[0, -2], [-6, 4], [-10, 8]], [5, 3, 1]), taper([[3, -2], [8, 5], [12, 8]], [5, 3, 1]),
      taper([[1, -2], [2, -30], [3, -60], [6, -84]], [22, 14, 11, 12]),
      taper([[6, -84], [12, -100], [22, -112]], [12, 13, 14]),
      taper([[22, -112], [27, -118]], [7, 6], { per: 2 }),
      profile(32, -122, 1.1, 40),
      taper([[30, -131], [18, -134], [6, -130], [-4, -120], [-10, -106], [-12, -90], [-10, -76]], [5, 4.6, 4, 3.2, 2.4, 1.4, 0.5]),
      taper([[28, -128], [16, -126], [6, -118], [0, -104], [-2, -90], [2, -78]], [4, 3.6, 3, 2.4, 1.4, 0.5]),
      taper([[32, -133], [24, -140], [12, -142], [0, -138], [-12, -130], [-22, -118], [-28, -102]], [4, 3.8, 3.2, 2.6, 2, 1.2, 0.4]),
      taper([[26, -126], [18, -118], [14, -108], [14, -96]], [3.4, 3, 2, 0.6]),
      taper([[-10, -106], [-18, -102]], [1.2, 0.3], { per: 2 }), taper([[-22, -118], [-30, -116]], [1, 0.3], { per: 2 }), taper([[0, -138], [-4, -146]], [1, 0.3], { per: 2 }), taper([[-12, -90], [-18, -84]], [1, 0.3], { per: 2 }),
      leafAt(30, -134, -60, 9, 0.42), leafAt(36, -132, -18, 8, 0.42), leafAt(24, -137, -110, 8, 0.42),
      taper([[22, -108], [32, -96], [40, -82]], [6, 5, 4.4]), taper([[40, -82], [58, -70], [78, -56]], [4.4, 3.8, 3]),
      taper([[78, -56], [84, -52], [87, -47]], [2.2, 1.4, 0.5]), taper([[78, -56], [85, -55], [90, -53]], [2, 1.2, 0.4]), taper([[77, -55], [80, -49], [80, -44]], [2, 1.2, 0.4]),
      taper([[18, -106], [26, -90], [32, -72]], [5.6, 4.8, 4.2]), taper([[32, -72], [54, -56], [78, -42]], [4.2, 3.6, 3]),
      taper([[78, -42], [84, -40], [88, -36]], [2, 1.2, 0.4]), taper([[78, -42], [83, -36], [84, -31]], [2, 1.2, 0.4]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0.8, -1], [0, -1.3], [-0.8, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    s.add(`<path d="${place('M2,-20C4,-36 1,-48 4,-60M-2,-8C0,-20 -3,-30 -1,-40M8,-90C10,-98 14,-104 18,-108')}" fill="none" stroke="#3a4a2a" stroke-width="1" opacity=".8"/>`);
    // her vines, wound from her fingers round its neck and over its back to
    // the wounds
    const vines = U(
      taper([[186, 132], [194, 128], [202, 134], [192, 142], [204, 150], [196, 158], [212, 162], [226, 160], [240, 164]], [2.2, 2.2, 2, 2, 1.8, 1.6, 1.4, 1.2, 0.5], { per: 4 }),
      taper([[186, 146], [196, 154], [206, 162], [214, 172], [226, 176], [238, 178]], [2, 1.8, 1.6, 1.4, 1.2, 0.4], { per: 4 }),
    );
    s.path(vines, '#56782e');
    // the wounds, closing in green light, and new leaves on the vines
    s.glow(226, 168, 30, '#eaff9a', 0.6, 'breathe');
    s.bloom(`<path d="${U(taper([[216, 170], [224, 166], [234, 160]], [0.5, 2.6, 0.5], { per: 3 }), taper([[226, 178], [233, 175], [241, 172]], [0.5, 2, 0.5], { per: 3 }),
      taper([[204, 154], [207, 149], [210, 143]], [0.4, 1.8, 0.4], { per: 3 }))}" fill="#f2ffb0"/>` +
      `<path d="${U(leafAt(202, 134, -30, 7, 0.45), leafAt(196, 158, 150, 7, 0.45), leafAt(212, 162, -80, 6, 0.45), leafAt(206, 162, 70, 6, 0.45), leafAt(232, 177, 60, 6, 0.45))}" fill="#dff59a"/>`, { sd: 1.6, k: 1.5, box: [170, 110, 90, 80] });
    s.motes({ seed: 11304, n: 18, x: [192, 252], y: [104, 176], r: [0.4, 1.1], fill: '#eaff9a', hot: '#ffffff', cls: 'rise', t: [3, 6], op: [0.5, 1] });
    s.add(particles({ seed: 11305, n: 12, x: [20, 280], y: [20, 170], r: [0.5, 1.1], fill: '#fffbe0', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // An archer in thorned bark armour kneels on a cliff edge and looses an
  // arrow at the dark beast leaping off a crag at the great eagle above her.
  'thornback-archer'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f7f1cc'], [0.35, '#e4e6b4'], [0.7, '#b9c995'], [1, '#93a878']]));
    s.glow(40, 22, 160, '#fff8d8', 0.9);
    s.shafts({ cx: 40, cy: 22, from: -6, to: 80, n: 10, len: 300, spread: 2.2, color: '#fffbe2', op: 0.2, seed: 11401 });
    s.layer(ridge({ seed: 11402, base: 150, amp: 62, peaks: true, freq: 2.4 }), '#c6d0a6', { blur: 0.8 });
    s.haze(112, 160, '#f2f2d2', 0.4);
    s.layer(woods({ seed: 11403, base: 184, top: 154, r0: 6, r1: 12 }), '#93a873', { blur: 0.5 });
    s.haze(152, 190, '#eceec8', 0.28);
    // the crag the beast leapt from, and her cliff edge
    s.figure(`<path d="${poly([[240, 216], [248, 170], [256, 134], [266, 108], [276, 98], [286, 104], [292, 132], [302, 216]])}"/>`, { fill: '#2e3c22', rim: p.rim, offsets: [[-1, -0.8]], rimOp: 0.8, shade: 0.4 });
    s.figure(`<path d="${poly([...spline([[-10, 180], [30, 178], [80, 180], [118, 181], [138, 184]], 5), [146, 196], [150, 216], [-10, 216]])}"/>`,
      { fill: '#1e2a16', rim: p.rim, offsets: [[-0.6, -1], [0.6, -1]], rimOp: 0.85, shade: 0.5, light: [0, -1] });
    // the eagle, wings spread, turning on the beast
    const wing = (side) => {
      const sh = side > 0 ? [144, 34] : [136, 37], tip = side > 0 ? [194, 12] : [84, 20];
      const q = (t, o) => [sh[0] + (tip[0] - sh[0]) * t, sh[1] + (tip[1] - sh[1]) * t - o];
      const fingers = [0, 1, 2, 3, 4].map((i) => { const a = (side > 0 ? -60 : -150) + side * i * 16; return taper([tip, [tip[0] + Math.cos(rad(a)) * 13, tip[1] + Math.sin(rad(a)) * 13]], [3.4, 0.6], { per: 2 }); });
      return [taper([sh, q(0.3, 5), q(0.65, 6), tip], [13, 18, 15, 8], { per: 6 }), ...fingers];
    };
    const eagle = U(wing(-1), wing(1), ell(140, 38, 15, 6, -8), ell(156, 33, 5, 4.4, -8), taper([[159, 33], [165, 36]], [3.2, 0.6], { per: 2 }),
      poly([[126, 40], [111, 36], [109, 43], [112, 49], [126, 44]]), taper([[142, 42], [146, 50], [150, 54]], [3, 2.2, 1.2], { per: 2 }), taper([[136, 42], [138, 50], [141, 55]], [3, 2.2, 1.2], { per: 2 }));
    s.figure(`<path d="${eagle}"/>`, { fill: '#2a3420', rim: p.rim, offsets: [[-1, -0.8], [-0.4, -1.2]], rimOp: 0.9, shade: 0.35 });
    // the beast: something like a great cat, too many eyes, a ridge of
    // spines, its jaws open at the eagle's wing
    const beast = U(
      taper([[268, 92], [250, 76], [230, 60]], [17, 20, 18]),
      taper([[230, 60], [220, 52], [213, 45]], [15, 13, 11]), ell(210, 42, 9, 7, -35),
      taper([[207, 38], [194, 30]], [6, 1], { per: 2 }), taper([[210, 46], [197, 40]], [5, 1], { per: 2 }),
      taper([[228, 64], [216, 58], [204, 48]], [7, 6, 4.4]), taper([[232, 68], [220, 70], [208, 62]], [7, 6, 4.4]),
      taper([[204, 48], [198, 46]], [2.4, 0.4], { per: 2 }), taper([[208, 62], [202, 62]], [2.4, 0.4], { per: 2 }),
      taper([[266, 94], [276, 98], [284, 104]], [9, 7, 4]), taper([[262, 96], [268, 106], [272, 114]], [9, 7, 4]),
      taper([[272, 88], [284, 82], [294, 72], [300, 64]], [6, 4.4, 3, 1]),
      ...[0, 1, 2, 3, 4].map((i) => { const x = 236 + i * 7, y = 56 + i * 6; return poly([[x - 3, y + 2], [x + 1, y - 8 + i], [x + 4, y + 4]]); }),
    );
    s.figure(`<path d="${beast}"/>`, { fill: '#121a0c', rim: '#e8e4b0', offsets: [[-1, -0.6]], rimOp: 0.7, shade: 0.3 });
    // the archer: down on one knee at the edge, bow out at full stretch, the
    // string hand flown back past her ear; thorns all down her back
    const fx = 66, fy = 182, K = 1.2, place = at(fx, fy, K);
    const aim = -20, ax = Math.cos(rad(aim)), ay = Math.sin(rad(aim)), hx = 4 + 32 * ax, hy = -62 + 32 * ay;
    const bt = (k, o) => [hx + -ay * k + ax * o, hy + ax * k + ay * o];
    const archer = place(U(
      taper([[-4, -30], [-10, -14], [-12, -3]], [11, 9, 8]), taper([[-12, -3], [-22, -2], [-32, -3]], [7, 6, 5]),
      taper([[4, -32], [12, -30], [19, -27]], [11, 10, 9]), taper([[19, -27], [20, -14], [21, -3]], [8, 7, 6]), ell(25, -2, 5.4, 2.2),
      taper([[0, -30], [-1, -48], [-1, -64]], [15, 16, 18]),
      taper([[0, -64], [2, -70]], [7, 6], { per: 2 }), profile(3, -76, 1, aim), taper([[-2, -82], [-6, -82], [-8, -78]], [5, 4, 1.4]),
      taper([[4, -62], [4 + 16 * ax, -62 + 16 * ay], [hx, hy]], [6, 5, 4.2]), ell(hx, hy, 3, 3),
      taper([[-2, -62], [-8, -65], [-13, -67]], [6, 5, 4.5]), taper([[-13, -67], [-19, -69], [-25, -70]], [4.5, 4, 3.4]),
      taper([bt(-28, -8), bt(-14, -1), bt(0, 2), bt(14, -1), bt(28, -8)], [1, 2, 2.6, 2, 1], { per: 4 }),
      ...[[-9, -64, 150], [-11, -56, 160], [-11, -48, 165], [-10, -40, 170], [-8, -33, 175], [-4, -66, 120], [6, -66, 60]].map(([x, y, a]) =>
        poly([[x, y - 2.4], [x + Math.cos(rad(-a)) * 7, y + Math.sin(rad(-a)) * 7], [x, y + 2.4]])),
    ));
    s.figure(`<path d="${archer}"/><path d="${place(`M${bt(-28, -8).map(f1).join(',')}L${bt(28, -8).map(f1).join(',')}`)}" fill="none" stroke-width=".7"/>`,
      { fill: p.fig, rim: p.rim, offsets: [[-1, -0.6], [0, -1.2], [1, -0.4]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.4, -1] });
    // the arrow, halfway to the beast, a streak of light behind it
    const [ox, oy] = [fx + hx * K, fy + hy * K], [tx, ty] = [226, 60];
    const da = Math.atan2(ty - oy, tx - ox), u = [Math.cos(da), Math.sin(da)], hd = [ox + (tx - ox) * 0.66, oy + (ty - oy) * 0.66];
    s.bloom(`<path d="${taper([[ox + u[0] * 10, oy + u[1] * 10], [hd[0] - u[0] * 14, hd[1] - u[1] * 14]], [0.3, 2.2], { per: 2 })}" fill="#fffbe2" opacity=".85"/>` +
      `<path d="${taper([[hd[0] - u[0] * 16, hd[1] - u[1] * 16], [hd[0], hd[1]]], [1.3, 1.3], { per: 2 }) + poly([[hd[0] + u[0] * 5, hd[1] + u[1] * 5], [hd[0] - u[1] * 2.4, hd[1] + u[0] * 2.4], [hd[0] + u[1] * 2.4, hd[1] - u[0] * 2.4]])}" fill="#1b2714"/>`, { sd: 1.4, k: 1.3, box: [90, 40, 150, 70] });
    // the beast's eyes
    s.add(`<path d="${dots([[212, 38.5, 1.1], [215.5, 40.5, 1], [209, 41.5, 0.9], [213, 43.5, 0.8]])}" fill="#f4ff9a"/>`);
    s.add(particles({ seed: 11404, n: 14, x: [20, 280], y: [20, 170], r: [0.5, 1.1], fill: '#fffbe0', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    s.add([[200, 56, 30], [190, 60, -20], [218, 30, 50], [186, 44, 10]].map(([x, y, a], i) =>
      `<path class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" d="${lens(x, y, 6, a, 0.36)}" fill="#3a4a2a"/>`).join(''));
    return s.svg();
  },

  // Under a meadow, a cut through the earth: a young tree no taller than a
  // child stands in the sun up top, and below it its roots spread wider and
  // deeper than any crown, through stone and glowing soil.
  'deep-roots'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    const gy = 62;
    // the sky and the meadow
    s.rect(s.lin([[0, '#fbf3cc'], [0.25, '#eef0bc'], [0.3, '#4a3a22'], [0.55, '#2c2214'], [1, '#1e1a10']]));
    s.glow(232, 6, 120, '#fff8d8', 0.8);
    s.layer(woods({ seed: 11501, base: gy + 2, top: gy - 18, r0: 6, r1: 12 }), '#c3cf9a', { blur: 0.6 });
    s.haze(gy - 20, gy + 2, '#f6f4d6', 0.4);
    // the earth below: bands of soil, light coming up out of the deep
    s.path(`M-10,${gy}L310,${gy}L310,214L-10,214Z`, s.lin([[0, '#5a4628'], [0.12, '#3a2c18'], [0.5, '#261c10'], [1, '#2a2a14']]));
    s.glow(150, 236, 170, '#e6f78f', 0.6);
    s.glow(150, 214, 70, '#f7ffc8', 0.5, 'breathe');
    s.add(`<path d="M-10,${gy + 34}C60,${gy + 30} 120,${gy + 40} 200,${gy + 34}C250,${gy + 30} 280,${gy + 36} 310,${gy + 33}M-10,${gy + 80}C70,${gy + 86} 160,${gy + 76} 230,${gy + 84}C270,${gy + 88} 290,${gy + 82} 310,${gy + 84}" fill="none" stroke="#4a3a20" stroke-width="5" opacity=".45"/>`);
    // stones in the earth
    const stones = U(stone(64, 118, 22, 15, 11502, 9, 0.25), stone(236, 132, 26, 17, 11503, 9, 0.25), stone(118, 178, 16, 11, 11504, 8, 0.25),
      stone(204, 190, 18, 12, 11505, 8, 0.25), stone(26, 172, 14, 10, 11506, 8, 0.25), stone(286, 186, 12, 9, 11507, 8, 0.25), stone(170, 104, 9, 6, 11508, 7, 0.25));
    s.figure(`<path d="${stones}"/>`, { fill: '#3a3020', rim: '#8a7a52', offsets: [[0, 1]], rimOp: 0.6, shade: 0.4, light: [0, 1] });
    // the roots: a tap root and great side roots, splitting as they go
    const R = rng(11509), roots = [], tips = [];
    const grow = (x, y, a, L, w, depth) => {
      const b = bough(x, y, a, L, (R() - 0.5) * 40, [w, w * 0.62], 4, 2);
      roots.push(b.d);
      if (depth === 0 || w < 1.2) { if (b.end[1] > 120 && R() < 0.6) tips.push([...b.end, Math.max(0.7, w * 0.4)]); return; }
      const n = depth > 2 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const na = a + (i - (n - 1) / 2) * (32 + R() * 16) + (R() - 0.5) * 14;
        grow(b.end[0], b.end[1], Math.max(8, Math.min(172, na)), L * (0.62 + R() * 0.16), w * 0.62, depth - 1);
      }
    };
    for (const [a, L, w] of [[90, 46, 9], [150, 50, 7], [30, 50, 7], [170, 40, 5], [10, 42, 5], [118, 40, 6], [62, 40, 6]]) grow(150, gy + 2, a, L, w, 3);
    s.figure(`<path d="${U(roots, taper([[146, gy + 6], [150, gy - 2], [154, gy + 6]], [10, 12, 10], { per: 2 }))}"/>`, { fill: '#18140c', rim: '#e6f0a8', offsets: [[0, 1], [-0.7, 0.7], [0.7, 0.7]], rimOp: 0.6, shade: 0.3, light: [0, 1] });
    s.bloom(`<path d="${dots(tips)}" fill="#f2ffb8"/>`, { sd: 1.6, k: 1.5, box: [-10, 70, 320, 150] });
    s.motes({ seed: 11510, n: 24, x: [10, 290], y: [100, 210], r: [0.4, 1], fill: '#eefaa6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    // the meadow edge, and the young tree in the sun
    s.add(`<path d="M-10,${gy}L310,${gy}" stroke="#2e3a1c" stroke-width="2"/>`);
    const G = rng(11511), blades = [];
    for (let x = -6; x < 310; x += 3 + G() * 4) { const h = 3 + G() * 6, l = (G() - 0.5) * 6; blades.push(taper([[x, gy + 1], [x + l * 0.4, gy - h * 0.5], [x + l, gy - h]], [1.6, 1, 0.3], { per: 3 })); }
    s.path(U(blades), '#3c4c26');
    const tree = U(taper([[150, gy + 1], [149, gy - 16], [151, gy - 32], [150, gy - 40]], [4.4, 3.4, 2.6, 1.6]),
      taper([[150, gy - 20], [140, gy - 28], [134, gy - 34]], [2, 1.4, 0.6]), taper([[150, gy - 26], [160, gy - 34], [166, gy - 38]], [1.8, 1.2, 0.5]));
    s.figure(`<path d="${tree}"/>`, { fill: '#2a3818', rim: '#fff6c8', offsets: [[0.9, -0.6], [-0.9, -0.6]], rimOp: 0.9 });
    let leaves = '';
    for (const [x, y, n, a0] of [[134, gy - 34, 5, -150], [166, gy - 38, 5, -30], [150, gy - 41, 5, -90], [142, gy - 28, 3, 170], [158, gy - 32, 3, 0]]) {
      for (let i = 0; i < n; i++) leaves += leafAt(x, y, a0 + (i - (n - 1) / 2) * 32 + (G() - 0.5) * 14, 7 + G() * 3, 0.46);
    }
    s.path(leaves, s.radU(150, gy - 34, 24, [[0, '#fbffd8'], [0.6, '#dff09a'], [1, '#a8c264']]));
    s.add(particles({ seed: 11512, n: 8, x: [20, 280], y: [6, gy - 6], r: [0.5, 1], fill: '#fffbe0', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A warrior in profile holds up his fist: over his forearm, his elbow and
  // his shoulder a living plate of bark and moss is creeping like armour,
  // little leaves unfurling from it.
  'bark-graft'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f2eec4'], [0.4, '#d9dea8'], [0.8, '#a8bc84'], [1, '#8ca070']]));
    s.glow(238, 40, 150, '#fff7d2', 0.85);
    s.shafts({ cx: 238, cy: 20, from: 100, to: 170, n: 8, len: 280, spread: 2.4, color: '#fffbe2', op: 0.24, seed: 11601 });
    s.layer(woods({ seed: 11602, base: 150, top: 56, r0: 12, r1: 22 }), '#b6c592', { blur: 0.7 });
    s.haze(110, 160, '#f6f4d6', 0.34);
    s.path(woods({ seed: 11603, base: 196, top: 150, r0: 9, r1: 16 }), '#8fa46e');
    // the warrior, waist up and side on: broad in the shoulder, a braid down
    // his back, one arm hanging, the other raised with the fist clenched
    // (drawn, then all of it set a little larger round his shoulder)
    const from = s.body.length;
    const body = U(
      blob([[104, 216], [106, 186], [106, 160], [104, 136], [106, 118], [114, 106], [128, 100], [146, 98], [158, 104], [164, 120], [160, 146], [154, 172], [156, 216]], 5),
      taper([[136, 102], [139, 86]], [15, 13], { per: 2 }), profile(146, 73, 1.5, -6),
      taper([[136, 64], [126, 68], [120, 80], [118, 94]], [8, 6.4, 4.6, 1.4]),
      taper([[152, 108], [172, 113], [192, 115]], [19, 17, 15]), taper([[192, 118], [196, 94], [198, 74]], [15, 14, 12]),
      blob([[190, 76], [188, 66], [190, 58], [196, 54], [203, 54], [207, 58], [207, 70], [202, 77]], 4),
      ell(205.5, 57, 3.4, 2.8, 20), ell(208, 62, 3.1, 2.6), ell(208.4, 67.2, 2.9, 2.4), ell(207.4, 72, 2.6, 2.2),
      taper([[191, 70], [198, 67], [204, 63]], [4.6, 4, 3.2], { per: 3 }),
    );
    s.figure(`<path d="${body}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1, -1], [0, -1.3], [1.2, 0]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.7, -1] });
    // the bark armour: a pauldron of three curved lames over the shoulder,
    // a round plate on the elbow, bark scales all up the forearm
    const lame = (x0, x1, y, h, bow) => poly([...spline([[x0, y + h * 0.6], [(x0 + x1) / 2, y - bow], [x1, y + h * 0.6]], 6),
      ...spline([[x1 - 1, y + h * 1.5], [(x0 + x1) / 2, y - bow + h], [x0 + 1, y + h * 1.5]], 6)]);
    const ax = [6 / 40.4, -40 / 40.4], nx = [-ax[1], ax[0]];
    const scales = [];
    for (let r = 0; r < 5; r++) for (let c = -1; c <= 1; c++) {
      const t = 4 + r * 8.6, o = c * 5.2 + (r % 2 ? 2.6 : 0);
      if (Math.abs(o) > 7) continue;
      const cx = 192 + ax[0] * t + nx[0] * o, cy = 116 + ax[1] * t + nx[1] * o;
      scales.push(rot(poly([[cx - 3.6, cy - 3.4], [cx - 3.9, cy + 0.8], [cx, cy + 5.4], [cx + 3.9, cy + 0.8], [cx + 3.6, cy - 3.4], [cx, cy - 4.6]]), cx, cy, 8));
    }
    const plates = [lame(128, 178, 120, 7, 9), lame(126, 172, 112, 7, 10), lame(128, 166, 103, 7, 9), ell(190, 116, 10, 9), ...scales];
    s.figure(`<path d="${U(plates)}"/>`, { fill: '#6a5434', rim: '#fff3c0', offsets: [[0, -1.2], [0.8, -0.8]], rimOp: 0.95, shade: 0.5, light: [0.5, -1] });
    // each lame's lit top edge, the seams between the scales, the grain
    const tops = [[128, 178, 120, 7, 9], [126, 172, 112, 7, 10], [128, 166, 103, 7, 9]].map(([x0, x1, y, h, bow]) => poly(spline([[x0 + 2, y + h * 0.5], [(x0 + x1) / 2, y - bow + 0.4], [x1 - 2, y + h * 0.5]], 6), false)).join('');
    s.add(`<path d="${tops}" fill="none" stroke="#e8dca8" stroke-width="1.1" opacity=".85"/><path d="${scales.join('')}" fill="none" stroke="#2a2012" stroke-width=".8" opacity=".85"/>` +
      `<path d="M134,112l4,8M146,108l2,9M158,110l-1,9M140,102l3,7M152,100l2,8M186,114q4,-3 8,0" fill="none" stroke="#2e2414" stroke-width="1" opacity=".75"/>`);
    // moss along the edges, tendrils feeling their way on over his chest
    s.path(dots([[133, 127, 1.6], [136, 128.4, 1.3], [139, 128, 1.5], [150, 129, 1.7], [153, 129.4, 1.3], [163, 128, 1.5], [171, 125, 1.6], [174, 124, 1.2],
      [184, 122, 1.6], [187, 123, 1.2], [199, 109, 1.3], [189, 90, 1.3], [192, 90.4, 1]]), '#7e9c50');
    s.path(U(tendril(126, 122, 150, 20, { bend: -50, w: 2, curl: 3 }), tendril(132, 128, 112, 16, { bend: 40, w: 1.8, curl: 3 }), tendril(136, 100, -140, 12, { bend: -40, w: 1.6, curl: 2.5 })), '#2c3a1c');
    // new leaves unfurling out of the bark
    const leaves = U(leafAt(206, 86, -10, 14, 0.46), leafAt(206, 100, 14, 12, 0.46), leafAt(196, 126, 70, 12, 0.46), leafAt(176, 104, -60, 14, 0.46),
      leafAt(156, 98, -96, 13, 0.46), leafAt(134, 104, -150, 14, 0.46), leafAt(124, 120, -170, 11, 0.46), leafAt(186, 80, -150, 10, 0.46), leafAt(164, 96, -120, 9, 0.46));
    s.bloom(`<path d="${leaves}" fill="${s.radU(170, 100, 60, [[0, '#fbffe0'], [0.5, '#eefaa6'], [1, '#c8de78']])}"/>`, { sd: 1.6, k: 1.35, box: [100, 60, 130, 90] });
    s.body.push(`<g transform="translate(160 130) scale(1.14) translate(-160 -130)">${s.body.splice(from).join('')}</g>`);
    s.motes({ seed: 11604, n: 16, x: [100, 240], y: [40, 150], r: [0.4, 1], fill: '#f2ffb8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // FIELD. A ruined city given back to the forest: vines thick as trunks
  // climb its broken towers and flower, trees burst out of its roofs, and
  // warm sun streams down through the leaves.
  overgrowth(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#fbf3cc'], [0.35, '#efe7b4'], [0.7, '#c9d29a'], [1, '#9db07c']]));
    s.glow(96, 30, 170, '#fff8d8', 0.9);
    // the far city: broken towers and a dome, soft in the light
    let far = '';
    for (const [x, w, h, dome] of [[12, 16, 46, 0], [34, 22, 30, 1], [196, 14, 52, 0], [214, 26, 34, 1], [246, 12, 40, 0], [264, 20, 26, 0], [288, 14, 44, 0]]) {
      const b = 150;
      far += dome ? `M${x},${b}V${b - h}A${w / 2},${w * 0.7} 0 0 1 ${x + w},${b - h}V${b}Z` : `M${x},${b}V${b - h + 6}L${x + w * 0.4},${b - h}L${x + w * 0.6},${b - h + 8}L${x + w},${b - h + 3}V${b}Z`;
    }
    s.layer(far + ridge({ seed: 11701, base: 152, amp: 8, freq: 2 }), '#b9c48f', { blur: 0.8 });
    s.haze(110, 156, '#f8f4d8', 0.3);
    // a domed temple at the left, a tree bursting out through its roof
    s.path(U(poly([[22, 186], [22, 128], [92, 128], [92, 186]]), ell(57, 130, 37, 28), ell(40, 92, 16, 13), ell(58, 84, 16, 14), ell(74, 94, 13, 11), ell(30, 104, 10, 8),
      taper([[56, 116], [56, 100]], [7, 4], { per: 2 })), '#9aac78');
    s.path('M30,186V150A9,9 0 0 1 48,150V186ZM66,186V150A9,9 0 0 1 84,150V186Z', '#e2e2b6');
    // nearer ruins: an arcade at the right, hung with vines, a tree on top
    s.path(U(ell(236, 104, 16, 12), ell(254, 96, 15, 12), ell(222, 108, 12, 9), ell(270, 104, 13, 10), ell(244, 88, 12, 10), taper([[244, 112], [246, 98]], [5, 3], { per: 2 })) +
      ledge([[-10, 186], [80, 182], [160, 184], [240, 181], [310, 184]]), '#7d9160');
    s.layer(arcade({ seed: 11702, x0: 178, x1: 290, base: 186, h: 76, bay: 28, col: 7 }), '#7d9160', { extra: 'fill-rule="evenodd"' });
    s.add(`<path d="${[196, 214, 236, 252, 270].map((x, i) => `M${x},${108 + (i % 2) * 6}C${x - 4},${130 + i * 3} ${x + 4},${146 - i * 2} ${x - 1},${160 + (i % 3) * 6}`).join('')}" fill="none" stroke="#6a7f50" stroke-width="2"/>`);
    s.haze(150, 192, '#eef0c8', 0.26);
    // the tower: broken off, its windows open, a vine as thick as a tree
    // wound up it and a tree bursting out of its top
    const tw = poly([[100, 204], [102, 70], [108, 58], [114, 66], [120, 50], [128, 60], [134, 48], [142, 62], [150, 56], [156, 68], [158, 204]]);
    const wins = `M118,100V88A11,11 0 0 1 140,88V100ZM118,152V138A11,11 0 0 1 140,138V152Z`;
    const vine = U(taper([[96, 210], [118, 196], [150, 176], [158, 156], [130, 136], [102, 118], [104, 98], [134, 84], [156, 72], [150, 56]], [12, 11, 10, 9, 9, 8, 7, 6, 5, 4], { per: 6 }),
      taper([[158, 156], [176, 150], [190, 154]], [5, 3, 1], { per: 4 }), taper([[102, 118], [88, 114], [80, 104]], [5, 3, 1], { per: 4 }));
    // (the canopy is a strip of woods turned upside down: it hangs lowest at
    // the sides and thins out where the sun is)
    const crown = flipY(woods({ seed: 11704, base: 190, top: 150, x0: -20, x1: 320, r0: 10, r1: 20, prof: (x) => 0.25 + 0.75 * Math.min(1, Math.abs(x - 112) / 130) }), 202);
    const trunk = U(taper([[130, 60], [126, 40], [118, 20], [104, 4]], [14, 11, 9, 7]), taper([[126, 36], [146, 20], [170, 8]], [8, 6, 4]), taper([[120, 24], [92, 14], [70, 12]], [6, 4.4, 3]));
    s.figure(`<path d="${tw}${wins}" fill-rule="evenodd"/>`, { fill: '#55663e', rim: '#fff6cc', offsets: [[-1, -0.8], [0, -1.2]], rimOp: 0.9, shade: 0.4, light: [-0.6, -1] });
    s.add(`<path d="M102,120H158M102,170H158M110,70V204M146,66V204" fill="none" stroke="#45542f" stroke-width="1" opacity=".7"/>`);
    s.figure(`<path d="${U(vine, trunk)}"/>`, { fill: '#2a3818', rim: p.rim, offsets: [[-1, -0.8], [0.6, -1]], rimOp: 0.85, shade: 0.4, edge: 0.25, light: [-0.6, -1] });
    // the crown, its light coming down through it in shafts
    s.path(crown, '#33461f');
    s.shafts({ cx: 96, cy: 0, from: 60, to: 120, n: 7, len: 230, spread: 2, color: '#fffbe2', op: 0.3, seed: 11705, sd: 2.4 });
    // leaves along the vine, and its great flowers
    const R = rng(11706);
    let leaves = '';
    for (const [x, y] of [[118, 196], [134, 186], [154, 166], [142, 140], [114, 126], [100, 108], [118, 90], [146, 76], [176, 150], [86, 112]]) {
      leaves += leafAt(x, y, -40 + R() * 80 - 90 + (R() < 0.5 ? 70 : -70), 12 + R() * 5, 0.44) + leafAt(x, y, 90 + (R() - 0.5) * 120, 10 + R() * 4, 0.44);
    }
    s.path(leaves, '#3e5428');
    const flower = (x, y, r, a) => U([0, 1, 2, 3, 4].map((i) => leafAt(x, y, a + i * 72, r, 0.62, 5)));
    const flowers = [[140, 182, 14, 10], [108, 132, 12, -20], [150, 92, 13, 30], [190, 154, 9, 0], [78, 102, 9, 20], [160, 170, 8, 40]];
    s.glow(130, 140, 70, '#fff3c0', 0.35, 'breathe');
    s.bloom(`<path d="${U(flowers.map(([x, y, r, a]) => flower(x, y, r, a)))}" fill="${s.radU(130, 140, 70, [[0, '#fffdf0'], [1, '#f6eec8']])}"/>` +
      `<path d="${dots(flowers.map(([x, y, r]) => [x, y, r * 0.24]))}" fill="#f0c95a"/>`, { sd: 1.8, k: 1.3, box: [60, 70, 150, 130] });
    // fallen drums of a column, ferns and big leaves at our feet
    s.figure(`<path d="${U(poly([[8, 214], [10, 186], [36, 184], [38, 214]]), ell(23, 186, 14, 4), poly([[238, 214], [244, 196], [276, 200], [272, 214]]))}"/>`, { fill: '#3a4a28', rim: p.rim, offsets: [[-0.6, -1]], rimOp: 0.8, shade: 0.4 });
    s.path(U(frond(46, 214, -70, 50, { bend: 30, n: 7, w: 3 }), frond(60, 214, -110, 40, { bend: -24, n: 6, w: 2.6 }), frond(300, 214, -120, 56, { bend: -32, n: 7, w: 3.2 }),
      frond(214, 214, -64, 36, { bend: 26, n: 6, w: 2.6 }), lens(-6, 196, 60, -30, 0.36), lens(296, 196, 54, -150, 0.36)), '#1c2a12');
    s.motes({ seed: 11707, n: 20, x: [40, 260], y: [20, 190], r: [0.4, 1.1], fill: '#fffbd6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── Tide ──────────────────────────────────────────────────────────

  // RELIC. On the sea floor a great carved bookcase stands among the stacks
  // of a drowned library, its shelves full of books and glowing scrolls;
  // silver fish drift between the rows and light falls from far above.
  'tidecallers-library'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#62a8aa'], [0.22, '#2c6c78'], [0.55, '#123c4c'], [1, '#061824']]));
    s.glow(150, -30, 200, '#e9fcf6', 0.7);
    s.shafts({ cx: 150, cy: -70, n: 10, from: 64, to: 116, len: 300, spread: 2.2, color: '#e9fcf6', op: 0.26, seed: 11801, sd: 2.6 });
    // the far stacks, row behind row, going blue with distance
    const stack = (x, w, b, h) => `M${x},${b}V${b - h + w / 2}A${w / 2},${w / 2} 0 0 1 ${x + w},${b - h + w / 2}V${b}Z`;
    s.layer([[-6, 30, 190, 150], [32, 24, 188, 122], [72, 16, 186, 96], [212, 16, 186, 98], [244, 26, 188, 126], [276, 32, 190, 152]].map(([x, w, b, h]) => stack(x, w, b, h)).join(''), '#2a6672', { blur: 0.9 });
    s.haze(90, 190, '#7fc0c0', 0.3);
    // nearer stacks at the edges, their shelves just showing
    const side = [[-14, 40, 216, 196], [262, 44, 216, 190]];
    s.path(side.map(([x, w, b, h]) => stack(x, w, b, h)).join(''), '#0b2a36');
    s.add(`<path d="${side.map(([x, w, b, h]) => Array.from({ length: 7 }, (_, i) => `M${x + 4},${b - 22 - i * 22}H${x + w - 4}`).join('')).join('')}" fill="none" stroke="#1e5260" stroke-width="2"/>`);
    // the sand, rippled
    s.path(ledge([[-10, 192], [60, 189], [150, 191], [240, 188], [310, 191]]), s.lin([[0, '#3e7a7c'], [0.3, '#1c4a54'], [1, '#0a2430']]));
    s.add('<path d="M20,198q20,-3 40,0M90,204q24,-3 48,0M176,200q22,-3 44,0M236,208q20,-3 40,0" fill="none" stroke="#5a9a98" stroke-width="1" opacity=".5"/>');
    // the great bookcase: an arched case with a scallop shell carved over it
    const bx0 = 102, bx1 = 198, bb = 192, bs = 100, bcx = 150;
    const caseD = `M${bx0},${bb}V${bs}A${(bx1 - bx0) / 2},40 0 0 1 ${bx1},${bs}V${bb}Z`;
    const shell = U([0, 1, 2, 3, 4, 5, 6].map((i) => { const a = -170 + i * 26.6; return taper([[bcx, 66], [bcx + Math.cos(rad(a)) * 18, 66 + Math.sin(rad(a)) * 15]], [2, 6.4], { per: 2 }); }), ell(bcx, 66, 6, 4));
    s.glow(bcx, 120, 110, '#c6f4f6', 0.4);
    s.figure(`<path d="${caseD}"/><path d="${shell}"/><path d="M${bx0 - 5},${bb}V${bb - 8}H${bx1 + 5}V${bb}Z"/>`, { fill: '#082430', rim: p.rim, offsets: [[0, -1.4], [-1, -0.8], [1, -0.8]], rimOp: 0.95, shade: 0.45, light: [0, -1] });
    // its shelves: rows of books, and racks of scrolls with their ends glowing
    const ix0 = bx0 + 8, ix1 = bx1 - 8;
    s.path(`M${ix0},${bb - 10}V${bs + 4}A${(ix1 - ix0) / 2},33 0 0 1 ${ix1},${bs + 4}V${bb - 10}Z`, '#0e3442');
    const R = rng(11802), spines = ['', '', ''], lit = [];
    for (const [y0, y1] of [[110, 128], [154, 172]]) {
      for (let x = ix0 + 1; x < ix1 - 2;) {
        const w = 2.6 + R() * 2.6, h = (y1 - y0) * (0.7 + R() * 0.28), k = Math.floor(R() * 3);
        if (R() < 0.12) lit.push([x, y1 - h, w, h]); else spines[k] += `M${f1(x)},${y1}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`;
        x += w + 0.6;
      }
    }
    ['#1f5260', '#2a6470', '#173e4a'].forEach((c, i) => s.path(spines[i], c));
    const scrolls = [];
    for (const [y, n, off] of [[147.5, 11, 0], [141, 10, 0.5], [178.2, 11, 0]]) for (let i = 0; i < n; i++) scrolls.push([ix0 + 4 + (i + off) * 7.4, y, 3.4]);
    const rose = [];
    for (let i = 0; i < 7; i++) { const a = -180 + i * 30; rose.push([bcx + Math.cos(rad(a)) * 22, 102 + Math.sin(rad(a)) * 16, 3.2]); }
    rose.push([bcx, 100, 4]);
    s.add(`<path d="M${ix0},${130}H${ix1}M${ix0},${152}H${ix1}M${ix0},${174}H${ix1}M${ix0},${108}H${ix1}" stroke="#082430" stroke-width="2.4"/>`);
    s.glow(bcx, 140, 50, '#f4f3d6', 0.3, 'breathe');
    s.bloom(`<path d="${dots([...scrolls, ...rose])}" fill="#f6f2d4"/><path d="${dots([...scrolls, ...rose].map(([x, y, r]) => [x, y, r * 0.32]))}" fill="#9fb4ae"/>` +
      `<path d="${lit.map(([x, y, w, h]) => `M${f1(x)},${f1(y + h)}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`).join('')}" fill="#d6f8f4"/>`, { sd: 1.6, k: 1.3, box: [100, 70, 100, 120] });
    // scrolls drifting up out of it, silver fish between the stacks
    s.add([[86, 74, -24, 0.8, 6], [214, 58, 28, 0.75, 7.5], [176, 34, -12, 0.65, 8.5]].map(([x, y, a, k, t], i) =>
      `<g class="float" style="--t:${t}s;--d:-${i * 2}s"><g transform="translate(${x} ${y}) rotate(${a}) scale(${k})">` +
      '<rect x="-8" y="-3.2" width="16" height="6.4" rx="1" fill="#fbfaee"/><rect x="-10.6" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d8dcc4"/><rect x="7.2" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d8dcc4"/></g></g>').join(''));
    const shoal = [[44, 110, 11, 8], [58, 118, 9, 4], [34, 124, 8, 10], [50, 132, 9, 6], [236, 96, 10, 172], [252, 108, 9, 176], [226, 112, 8, 168], [120, 44, 8, 190], [108, 50, 7, 186]];
    s.path(U(shoal.map(([x, y, l, a]) => fish(x, y, l, a))), '#d4ecec', 'opacity=".85"');
    s.add(particles({ seed: 11803, n: 16, x: [30, 270], y: [40, 200], r: [0.6, 1.6], stroke: '#d6f6f4', cls: 'rise', t: [5, 9], op: [0.4, 0.8] }));
    s.motes({ seed: 11804, n: 14, x: [40, 260], y: [20, 180], r: [0.4, 0.9], fill: '#c6f4f6', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    // kelp at the near corners
    const kelp = (x, h, lean, seed) => { const r = rng(seed), pts = []; for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(i * 1.1 + r() * 2) * 4 + lean * i, 216 - (h * i) / 6]); return taper(pts, [5, 5, 4.4, 4, 3.4, 2.4, 0.6], { per: 4 }); };
    s.path(U(kelp(6, 120, 1, 11805), kelp(18, 86, 2, 11806), kelp(-4, 70, 0, 11807), kelp(290, 126, -1.4, 11808), kelp(278, 84, -2, 11809), kelp(302, 70, -0.4, 11810)), '#04141c');
    return s.svg();
  },

  // RITUAL. Night on a moonlit beach: robed figures stand in a ring round a
  // circle of light on the sand with their arms raised, and behind them the
  // sea has stood up into one gigantic wave.
  'flood-rite'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#050f1c'], [0.35, '#0c2638'], [0.62, '#1a4658'], [0.75, '#24586a']]));
    s.add(particles({ seed: 11901, n: 30, x: [0, W], y: [0, 90], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, high over the back of the wave
    const mx = 238, my = 42;
    s.glow(mx, my, 120, '#c6f4f6', 0.45);
    s.add(`<circle cx="${mx}" cy="${my}" r="17" fill="#f2fbf6"/><circle cx="${mx - 5}" cy="${my - 4}" r="3.2" fill="#d6e8e6" opacity=".6"/><circle cx="${mx + 6}" cy="${my + 6}" r="2.4" fill="#d6e8e6" opacity=".5"/>`);
    // the wave: its back climbing from the right to a crest high over the
    // beach, the lip curling down at the left, moonlight through the top
    const outer = [[312, 130], [270, 112], [230, 90], [190, 62], [150, 36], [118, 22], [92, 18], [70, 22], [54, 34], [48, 50], [54, 62]];
    const inner = [[54, 62], [62, 56], [72, 52], [82, 58], [86, 74], [80, 94], [64, 114], [36, 132], [-12, 146]];
    const wave = poly([[312, 160], ...spline([...outer, ...inner.slice(1)], 6), [-12, 160]]);
    s.glow(120, 70, 120, '#c6f4f6', 0.35);
    s.figure(`<path d="${wave}"/>`, { fill: s.linU(0, 16, 0, 156, [[0, '#bfeee8'], [0.2, '#6ab8b8'], [0.5, '#24707a'], [1, '#0e3a48']]), rim: '#effaf3', offsets: [[0, -1.4], [1, -1]], rimOp: 0.9 });
    s.add(`<path d="${poly(spline([[66, 120], [96, 100], [120, 90]], 4), false)}${poly(spline([[100, 132], [150, 110], [200, 98], [240, 104]], 4), false)}${poly(spline([[120, 60], [160, 52], [200, 72]], 4), false)}" fill="none" stroke="#c6f4f6" stroke-width="1" opacity=".3"/>`);
    s.add(`<path d="${poly(spline([[64, 60], [72, 66], [80, 80], [76, 98], [62, 116], [40, 132]], 4), false)}" fill="none" stroke="#0a2a36" stroke-width="7" opacity=".5"/>`);
    s.bloom(`<path d="${poly(spline([[230, 90], [190, 62], [150, 36], [118, 22], [92, 18], [70, 22], [54, 34], [48, 50], [54, 62]], 6), false)}" fill="none" stroke="#f4fcf6" stroke-width="2.2" stroke-linecap="round"/>` +
      `<path d="${dots([[50, 66, 2.2], [56, 68, 1.6], [46, 58, 1.6], [62, 64, 1.4], [86, 14, 1.6], [110, 16, 1.4], [134, 26, 1.4], [72, 16, 1.4]])}" fill="#f8fdf9"/>`, { sd: 1.6, k: 1.3, box: [30, 0, 220, 100] });
    s.add([[48, 74], [58, 80], [42, 88], [66, 72]].map(([x, y], i) => `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx="1.1" ry="1.7" fill="#eefaf6"/>`).join(''));
    // the beach: wet sand under the moon, foam along the edge
    s.path(ledge([[-10, 150], [60, 152], [140, 150], [220, 152], [310, 150]]), s.lin([[0, '#3e6a70'], [0.2, '#1c3c46'], [1, '#08161e']]));
    s.add(`<g fill="#e6f6f2">${[[mx, 160, 26, 0.5], [mx + 2, 166, 18, 0.4], [mx - 1, 174, 30, 0.3], [mx + 1, 186, 14, 0.24], [mx, 198, 22, 0.16]].map(([x, y, w, o]) => `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.2" rx=".6" opacity="${o}"/>`).join('')}</g>`);
    s.add('<path d="M-10,153q30,-4 60,0t60,0t60,0t60,0t60,0t60,0" fill="none" stroke="#e9f8f2" stroke-width="1.6" opacity=".65"/>');
    // the ring: a circle of light on the sand with three marks round it,
    // and the robed figures standing round it, arms raised
    const cx = 150, cy = 178, rx = 56, ry = 11;
    const robe = (x, y, k, dir) => at(x, y, k)(U(
      blob([[-4, -24], [4, -24], [6, -12], [8, -2], [9, 0], [-9, 0], [-8, -2], [-6, -12]], 4),
      ell(0.6 * dir, -27.5, 3.6, 4), taper([[-2, -22], [-7, -30], [-10, -39]], [2.6, 2.2, 1.8]), taper([[2, -22], [7, -30], [10, -39]], [2.6, 2.2, 1.8]),
    ));
    const ring = [-90, -38, 14, 66, 118, 166, 222].map((a, i) => { const x = cx + Math.cos(rad(a)) * rx, y = cy + Math.sin(rad(a)) * ry; return { x, y, k: 0.64 + ((y - (cy - ry)) / (2 * ry)) * 0.26, dir: x < cx ? 1 : -1 }; });
    s.figure(ring.filter((f) => f.y < cy).map((f) => `<path d="${robe(f.x, f.y, f.k, f.dir)}"/>`).join(''), { fill: '#06151b', rim: p.rim, offsets: [[0.8, -1], [-0.8, -0.8]], rimOp: 0.9, shade: 0.4 });
    s.glow(cx, cy, 70, '#c6f4f6', 0.5, 'breathe');
    const marks = [[cx - 40, cy + 2], [cx + 40, cy + 2], [cx, cy + 8]].map(([x, y]) => `M${x - 3},${y}L${x},${y - 2.6}L${x + 3},${y}L${x},${y + 2.6}Z`).join('');
    s.bloom(`<ellipse cx="${cx}" cy="${cy}" rx="42" ry="8.4" fill="none" stroke="#e2fbf8" stroke-width="1.6"/><ellipse cx="${cx}" cy="${cy}" rx="30" ry="5.8" fill="none" stroke="#c6f4f6" stroke-width=".8" opacity=".7"/>` +
      `<path d="${marks}" fill="#f4fcf6"/>`, { sd: 1.6, k: 1.4, box: [90, 160, 120, 30] });
    s.figure(ring.filter((f) => f.y >= cy).map((f) => `<path d="${robe(f.x, f.y, f.k, f.dir)}"/>`).join(''), { fill: '#06151b', rim: p.rim, offsets: [[0.8, -1], [-0.8, -0.8]], rimOp: 0.9, shade: 0.4 });
    s.motes({ seed: 11902, n: 18, x: [90, 210], y: [120, 186], r: [0.4, 1], fill: '#c6f4f6', hot: '#ffffff', cls: 'rise', t: [4, 7], op: [0.4, 1] });
    return s.svg();
  },
};
