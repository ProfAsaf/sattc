// Card art for the SATTC Ultra cards, part C: the five Legends (the big
// named characters each Ultra deck brings), the five Traps (cards 132–136)
// and the glass cannons and Shields (137–141). A Legend is one heroic
// figure standing at the centre of its world; a Trap is the moment
// something springs on an attacker; every Shield is drawn in the same
// glassy light (shieldLight below). Style rules live in ../scenes.js;
// drawing tools in ../kit.js. Seeds: a card's number × 100 plus a count;
// the Legends, which have no number, use 99xx (after the Champions' 98xx).

import { H, W, blob, particles, pines, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const f2 = (n) => (Math.round(n * 100) / 100).toString();
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

// An ellipse at any angle as arc commands, for strokes and for fills that
// never join a union (mv/rot/at would bend its radii).
const oval = (cx, cy, rx, ry, deg = 0) => {
  const c = Math.cos(rad(deg)) * rx, sn = Math.sin(rad(deg)) * rx;
  return `M${f1(cx - c)},${f1(cy - sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(2 * c)},${f1(2 * sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(-2 * c)},${f1(-2 * sn)}Z`;
};

// Move, rotate or mirror a polygon path; at() carries a figure drawn at the
// origin to (x, y) at scale k (dir -1 mirrors it to face the other way).
const mv = (d, dx, dy) => d.replace(NUM, (_, x, y) => `${f1(+x + dx)},${f1(+y + dy)}`);
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const flipX = (d, ax) => d.replace(NUM, (_, x, y) => `${f1(2 * ax - x)},${y}`);
const at = (x, y, k, dir = 1) => (d) => d.replace(NUM, (_, a, b) => `${f1(x + a * k * dir)},${f1(y + b * k)}`);

// A smooth edge (hill, rock, shore) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A lens-shaped leaf, petal or feather centred on (x, y), `l` long, turned
// `a` degrees; leafAt() grows the same shape out of a point instead.
const lens = (x, y, l, a, w = 0.38, per = 4) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], per), x, y, a);
const leafAt = (x, y, a, l, w = 0.38, per = 4) => lens(x + (Math.cos(rad(a)) * l) / 2, y + (Math.sin(rad(a)) * l) / 2, l, a, w, per);

// A point `l` along direction `a` (degrees) from (x, y).
const toward = (x, y, a, l) => [x + Math.cos(rad(a)) * l, y + Math.sin(rad(a)) * l];

// The same points pushed `d` sideways (to the left of the way they run).
const along = (pts, d) => pts.map((q, i) => {
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return [q[0] + (dy / l) * d, q[1] - (dx / l) * d];
});

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// A head in profile, centred on the skull: brow, nose, mouth, chin. Faces
// right; `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);

// Grave markers standing on a baseline b, leaning a degrees.
const lean = (d, x, b, a) => (a ? `<path d="${d}" transform="rotate(${a} ${x} ${b})"/>` : `<path d="${d}"/>`);
const cross = (x, b, h, a = 0) => {
  const t = h * 0.075;
  return lean(`M${f1(x - t)},${b}V${f1(b - h)}H${f1(x + t)}V${b}ZM${f1(x - h * 0.28)},${f1(b - h * 0.76)}h${f1(h * 0.56)}v${f1(t * 1.9)}h${f1(-h * 0.56)}Z`, x, b, a);
};
const slab = (x, b, w, h, a = 0) => {
  const r = w / 2;
  return lean(`M${f1(x - r)},${b}V${f1(b - h + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(b - h + r)}V${b}Z`, x, b, a);
};

// A painted sun: ring and eight short rays, as one stroked path.
const sunMark = (x, y, r) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0` +
  Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(x + Math.cos(a) * r * 1.45)},${f1(y + Math.sin(a) * r * 1.45)}L${f1(x + Math.cos(a) * r * 2)},${f1(y + Math.sin(a) * r * 2)}`; }).join('');

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

// Smoke or cloud banks lying across a sky: [[x, y, rx, ry, opacity], ...].
const smoke = (fill, list) => `<g fill="${fill}">${list.map(([x, y, rx, ry, o]) =>
  `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`;

// A tendril from (x, y) heading `a` degrees, bending as it goes and rolling
// up at the end. Returns the path and where the curl sits.
function tendril(x, y, a, L, { bend = 40, w = 2.6, curl = 5 } = {}) {
  const pts = [[x, y]];
  let px = x, py = y, ang = a;
  for (let i = 1; i <= 5; i++) { ang += bend / 5; px += (Math.cos(rad(ang)) * L) / 5; py += (Math.sin(rad(ang)) * L) / 5; pts.push([px, py]); }
  const dir = Math.sign(bend) || 1, cx = px + Math.cos(rad(ang + dir * 90)) * curl, cy = py + Math.sin(rad(ang + dir * 90)) * curl;
  let th = Math.atan2(py - cy, px - cx);
  for (let k = 1; k <= 8; k++) { th += dir * 0.7; const rr = curl * (1 - k / 11); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  return { d: taper(pts, pts.map((_, i) => Math.max(0.4, w * (1 - i / pts.length))), { per: 4 }), tip: [cx, cy] };
}

// Soft woodland: round crowns of uneven size whose tops follow a slow wave,
// traced as one outline.
function woods({ seed, base, top, x0 = -12, x1 = W + 12, r0 = 8, r1 = 16 }) {
  const r = rng(seed);
  const ph1 = r() * 7, ph2 = r() * 7;
  const crowns = [];
  for (let x = x0; x <= x1;) {
    const rr = r0 + r() * (r1 - r0);
    const w = Math.max(-2, Math.min(1, 0.55 + 0.27 * Math.sin(x / 43 + ph1) + 0.16 * Math.sin(x / 15 + ph2) + (r() - 0.5) * 0.2));
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

// Little pines standing along a curve: base(x) is the ground's height there.
function pinesOn(seed, x0, x1, base, h = [8, 16], gap = [4, 7]) {
  const r = rng(seed), parts = [];
  for (let x = x0; x < x1; x += gap[0] + r() * (gap[1] - gap[0])) {
    const th = h[0] + r() * (h[1] - h[0]), tw = th * 0.36, y = base(x) + 1.5;
    parts.push(poly([[x - 0.8, y], [x - 0.8, y - th * 0.24], [x + 0.8, y - th * 0.24], [x + 0.8, y]]));
    for (let k = 0; k < 3; k++) {
      const top = y - th + (k * th) / 3.6, bot = top + th * 0.5, half = tw * (0.55 + k * 0.22);
      parts.push(poly([[x, top], [x + half, bot], [x - half, bot]]));
    }
  }
  return parts;
}

// A climbing vine along the points: a stem `w` wide at the root, thinning
// away, and a leaf every `step` samples on alternate sides.
function vine(pts, w, leaf, seed, step = 6) {
  const R = rng(seed), sp = spline(pts, 6), out = [taper(pts, [w, w * 0.8, w * 0.3])];
  for (let i = step, side = 1; i < sp.length - 2; i += step, side = -side) {
    const [x, y] = sp[i], [x2, y2] = sp[i + 1], a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
    out.push(leafAt(x, y, a + side * (48 + R() * 24), leaf * (1 - (0.35 * i) / sp.length) * (0.8 + R() * 0.4), 0.48, 3));
  }
  return out;
}

// A thorned briar stem along the points, `w` wide at the root.
function briar(pts, w, seed) {
  const R = rng(seed), sp = spline(pts, 6), out = [taper(pts, [w, w * 0.8, w * 0.45])];
  for (let i = 3, side = 1; i < sp.length - 1; i += 3 + Math.floor(R() * 2), side = -side) {
    const [x, y] = sp[i], [x2, y2] = sp[i + 1], a = Math.atan2(y2 - y, x2 - x);
    const ux = Math.cos(a), uy = Math.sin(a), nx = -uy * side, ny = ux * side, hw = w * 0.42, L = w * (0.8 + R() * 0.6);
    out.push(poly([[x - ux * hw + nx * hw * 0.5, y - uy * hw + ny * hw * 0.5], [x + nx * (hw + L) + ux * L * 0.6, y + ny * (hw + L) + uy * L * 0.6], [x + ux * hw + nx * hw * 0.5, y + uy * hw + ny * hw * 0.5]]));
  }
  return out;
}

// A rose head: a lumpy ring of petals.
function rose(x, y, r, seed) {
  const R = rng(seed), pts = [];
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + R() * 0.4, k = 0.82 + R() * 0.3; pts.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * 0.86]); }
  return blob(pts, 4);
}

// Thin horizontal glints of light on water: [[x, y, w, op], ...].
const glitter = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

// Birds: a gull gliding (wings bent at the wrist), a kestrel stooping (head
// toward +x), a raven perched (feet at the point, facing right; dir -1 left).
const gull = (x, y, k, a = 0) => rot(at(x, y, k)(poly([[-8, 0], [-5, -2.6], [-2, -1.2], [0, 0], [2, -1.2], [5, -2.6], [8, 0], [5, -1.4], [2, 0.2], [0, 1.4], [-2, 0.2], [-5, -1.4]])), x, y, a);
const kestrel = (x, y, k, a = 0) => rot(at(x, y, k)(U(
  lens(0.6, 0, 9, 0, 0.3, 3), taper([[1, -0.4], [-0.6, -5], [-3.6, -10.4]], [3, 2, 0.3], { per: 3 }), taper([[1, 0.4], [-0.6, 5], [-3.6, 10.4]], [3, 2, 0.3], { per: 3 }),
  poly([[-3.4, -0.9], [-8.8, -1.9], [-8.8, 1.9], [-3.4, 0.9]]))), x, y, a);
const raven = (x, y, k, dir = 1) => at(x, y, k, dir)(U(ell(0, -5, 4.6, 3.2, -24, 14), ell(4.4, -9.2, 2.6, 2.4, 0, 12), poly([[6.4, -10], [10.6, -8.8], [6.4, -7.8]]),
  poly([[-3.6, -3.4], [-11, 0], [-10.4, 1.6], [-2.4, -1.2]]), taper([[-0.4, -2.4], [0, 0]], 0.9, { per: 2 }), taper([[1.6, -2.4], [2, 0]], 0.9, { per: 2 })));

// A jagged crack or vein from (x, y) heading `a` degrees, L long, `w` wide
// at the start and thinning to nothing.
function jag(seed, x, y, a, L, w, n = 6, wob = 50) {
  const R = rng(seed), pts = [[x, y]];
  let px = x, py = y, g = a;
  for (let i = 1; i <= n; i++) { g += (R() - 0.5) * wob; px += (Math.cos(rad(g)) * L) / n; py += (Math.sin(rad(g)) * L) / n; pts.push([px, py]); }
  return taper(pts, pts.map((_, i) => Math.max(0.15, w * (1 - i / n))), { per: 1 });
}

// The top of a battlement from x0 to x1 at height y: merlons w wide, h tall.
function battlement(x0, x1, y, w = 9, g = 7, h = 7) {
  const out = [];
  for (let x = x0; x < x1 - 2; x += w + g) {
    const x2 = Math.min(x1, x + w);
    out.push([x, y], [x, y - h], [x2, y - h], [x2, y]);
  }
  out.push([x1, y]);
  return out;
}

// Fog or cloud: overlapping round puffs, [[x, y, r], ...].
const puffs = (list, flat = 1.3) => U(list.map(([x, y, r]) => ell(x, y, r * flat, r, 0, 20)));

// ── Shields ─────────────────────────────────────────────────────────

// A radial gradient in canvas units squashed to the ellipse (rx, ry).
function radE(s, cx, cy, rx, ry, stops) {
  const id = s.uid('re');
  s.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rx)}" ` +
    `gradientTransform="translate(${f1(cx)} ${f1(cy)}) scale(1 ${(ry / rx).toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})">${s.stops(stops)}</radialGradient>`);
  return `url(#${id})`;
}

// Shield light, the look every Shield shares (the table marks a Shield with
// a pale-blue glassy ring): a pane of glassy light, clear at its heart and
// brightening toward a pale cyan rim, a thread of gold inside the rim and a
// fainter second ring inside that (Shields stack), and a curved highlight
// on the side toward the light (`light`, degrees). An ellipse about
// (cx, cy), or with dome: true only its upper half, standing on y = cy;
// boss: true puts a boss at the middle of a round shield. Paints the pane
// and returns its rim and highlight, for the scene's bloom.
function shieldLight(s, cx, cy, rx, ry, { dome = false, light = -130, op = 1, boss = false } = {}) {
  const ring = (k, a0 = dome ? 180 : 0, a1 = 360, n = 40) => {
    const out = [];
    for (let i = 0; i <= n; i++) { const a = rad(a0 + ((a1 - a0) * i) / n); out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return out;
  };
  const line = (pts) => 'M' + pts.map(pt).join('L');
  s.path(poly(ring(1)), radE(s, cx, cy, rx, ry, [[0, '#fff2cc', 0.05 * op], [0.55, '#d6f6f4', 0.12 * op], [0.84, '#bfeef2', 0.28 * op], [1, '#e8fffd', 0.55 * op]]));
  return `<path d="${line(ring(1))}" fill="none" stroke="#dcfbff" stroke-width="1.5" stroke-linejoin="round" opacity="${f2(op)}"/>` +
    `<path d="${line(ring(0.93))}" fill="none" stroke="#ffe2a0" stroke-width=".7" opacity="${f2(0.7 * op)}"/>` +
    `<path d="${line(ring(0.72))}" fill="none" stroke="#c6f4f6" stroke-width=".6" opacity="${f2(0.35 * op)}"/>` +
    `<path d="${line(ring(0.84, light - 26, light + 26, 12))}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="${f2(0.85 * op)}"/>` +
    (boss ? `<path d="${oval(cx, cy, rx * 0.2, ry * 0.2)}" fill="#fff6dc" opacity="${f2(0.9 * op)}"/><path d="${oval(cx, cy, rx * 0.3, ry * 0.3)}" fill="none" stroke="#ffe2a0" stroke-width=".8" opacity="${f2(0.8 * op)}"/>` : '');
}

export const ultra_c = {
  // ── LEGENDS ───────────────────────────────────────────────────────

  // RADIANT + VERDANT. Halvard, the Unbroken: a towering armoured warden,
  // the sun coming up right behind him, a great shield planted in the earth
  // before him with his gauntlets on its rim; vines climb his armour, and
  // two ranks of shields run back from his shoulders.
  'legend-halvard'(s) {
    fin(s, ['radiant', 'verdant']);
    const v = PAL.verdant;
    s.rect(s.lin([[0, '#2a3848'], [0.3, '#56666c'], [0.55, '#a4a686'], [0.76, '#ecd49c'], [1, '#e8b67a']]));
    s.add(particles({ seed: 9901, n: 12, x: [0, W], y: [0, 50], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun coming up right behind him
    const sx = 150, sy = 122;
    s.glow(sx, sy, 190, '#fff0c2', 0.85);
    s.shafts({ cx: sx, cy: sy, n: 22, from: -180, to: 0, len: 320, spread: 2, color: '#fff6dc', op: 0.22, seed: 9902 });
    s.glow(sx, sy, 62, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="17" fill="#fff8e6"/>`);
    // far hills, sage green in the haze, and the field
    s.layer(ridge({ seed: 9903, base: 160, amp: 18, freq: 2.2 }), '#9c9e82', { blur: 0.7 });
    s.haze(140, 166, '#f2d49a', 0.36);
    s.path(ledge([[-10, 164], [70, 161], [150, 165], [230, 161], [310, 164]]), s.lin([[0, '#6c6a4a'], [1, '#34301e']]));
    // two ranks of shield-bearers running back from his shoulders: helmed
    // heads over tall round-topped shields, spears upright behind
    const rank = [];
    for (let i = 0, x = 106, b = 182, k = 0.74; i < 10; i++) { rank.push([x, b, k]); x -= 20 * k; b -= 2.2; k *= 0.93; }
    const both = [...rank, ...rank.map(([x, b, k]) => [300 - x, b, k])];
    const man = (x, b, k, d) => U(
      taper([[x - 3.4 * k, b - 12 * k], [x - 3.8 * k, b]], [4.2 * k, 3.6 * k], { per: 2 }), taper([[x + 3.4 * k, b - 12 * k], [x + 3.8 * k, b]], [4.2 * k, 3.6 * k], { per: 2 }),
      ell(x, b - 49 * k, 4.4 * k, 5 * k, 0, 12), ell(x, b - 51.5 * k, 5.4 * k, 3.8 * k, 0, 12), taper([[x - 6.4 * k, b - 49.5 * k], [x + 6.4 * k, b - 49.5 * k]], 1.5 * k, { per: 2 }),
      taper([[x + d * 10 * k, b + 1], [x + d * 10 * k, b - 82 * k]], [1.5 * k, 1.2 * k], { per: 2 }), lens(x + d * 10 * k, b - 85 * k, 6 * k, 90, 0.38, 3),
    );
    const board = (x, b, k) => `M${f1(x - 10 * k)},${f1(b - 8 * k)}L${f1(x - 10.6 * k)},${f1(b - 38 * k)}Q${f1(x)},${f1(b - 48 * k)} ${f1(x + 10.6 * k)},${f1(b - 38 * k)}` +
      `L${f1(x + 10 * k)},${f1(b - 8 * k)}Q${f1(x)},${f1(b - 4 * k)} ${f1(x - 10 * k)},${f1(b - 8 * k)}Z`;
    s.figure(`<path d="${U(both.map(([x, b, k]) => man(x, b, k, x < 150 ? -1 : 1)))}"/>`, { fill: '#2e2818', rim: '#ffe7a8', offsets: [[0, -1.1], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.85 });
    const back = both.slice().sort((a, b) => a[2] - b[2]);
    s.figure(back.map(([x, b, k]) => `<path d="${board(x, b, k)}"/>`).join(''), { fill: s.lin([[0, '#5c4828'], [1, '#2e2618']]), rim: '#ffe7a8', offsets: [[0, -1], [-0.7, -0.6], [0.7, -0.6]], rimOp: 0.9 });
    s.add(`<g fill="none" stroke="#1e160c" stroke-width="1.2" opacity=".85"><path d="${rank.slice(0, -1).map(([x, b, k]) =>
      `M${f1(x - 10 * k)},${f1(b - 9 * k)}L${f1(x - 10.6 * k)},${f1(b - 38 * k)}M${f1(300 - x + 10 * k)},${f1(b - 9 * k)}L${f1(300 - x + 10.6 * k)},${f1(b - 38 * k)}`).join('')}"/></g>` +
      `<g fill="none" stroke="#c8a060" stroke-width=".8" opacity=".75">${both.map(([x, b, k]) => `<circle cx="${f1(x)}" cy="${f1(b - 26 * k)}" r="${f1(3.4 * k)}"/>`).join('')}</g>`);
    // the ground he holds
    s.path(ledge([[-10, 190], [60, 188], [150, 195], [240, 188], [310, 190]]), s.lin([[0, '#2c2616'], [1, '#0e0c08']]));
    // Halvard: a cape falling wide behind him, a plumed great helm, leaves
    // sprouting from the joints of his armour
    const fx = 150, fy = 195, place = at(fx, fy, 1);
    const cape = blob([[-26, -128], [26, -128], [44, -106], [54, -72], [62, -36], [70, -4], [56, -8], [44, -2], [30, -7], [0, -4], [-30, -7], [-44, -2], [-56, -8], [-68, -4], [-60, -36], [-52, -72], [-42, -106]], 4);
    const him = place(U(
      cape,
      taper([[-13, -66], [-16, -34], [-19, -5]], [17, 14, 13]), taper([[13, -66], [16, -34], [19, -5]], [17, 14, 13]),
      ell(-21, -2.6, 9, 3.4), ell(21, -2.6, 9, 3.4),
      poly([[-21, -80], [21, -80], [25, -56], [0, -61], [-25, -56]]),
      taper([[0, -76], [0, -100], [0, -124]], [36, 38, 46]),
      ell(-27, -123, 15, 10, -14), ell(27, -123, 15, 10, 14), ell(-31, -116, 12, 7.6, -26), ell(31, -116, 12, 7.6, 26),
      taper([[0, -126], [0, -136]], 13, { per: 2 }),
      blob([[-10.5, -133], [-11.5, -146], [-8.5, -156], [0, -160], [8.5, -156], [11.5, -146], [10.5, -133], [6, -130], [-6, -130]], 4),
      poly([[-2.2, -158], [0, -166], [2.4, -158]]),
      taper([[0, -161], [8, -167], [18, -166], [27, -159], [33, -149], [36, -138]], [6, 8, 8, 6.4, 4, 1]),
      taper([[-36, -120], [-41, -108], [-41, -97]], [12, 11, 10]), taper([[36, -120], [41, -108], [41, -97]], [12, 11, 10]),
      taper([[-41, -97], [-31, -100], [-21, -103]], [10, 9.6, 9]), taper([[41, -97], [31, -100], [21, -103]], [10, 9.6, 9]),
      leafAt(-39, -128, -150, 10, 0.44), leafAt(-41, -124, -112, 8, 0.44), leafAt(36, -131, -62, 9, 0.44), leafAt(43, -121, -24, 9, 0.44),
      leafAt(-11, -147, -160, 7, 0.44), leafAt(-11, -141, 172, 6, 0.44), leafAt(-55, -64, 196, 8, 0.44), leafAt(60, -42, -12, 8, 0.44),
    ));
    s.figure(`<path d="${him}"/>`, { fill: '#221d14', rim: '#fff0c2', offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    // the great shield, its point sunk in the earth
    const shield = place('M-34,-100Q0,-110 34,-100L33,-58Q30,-22 0,8Q-30,-22 -33,-58Z');
    s.figure(`<path d="${shield}"/>`, { fill: s.linU(fx - 34, 0, fx + 34, 0, [[0, '#6c5232'], [0.5, '#4c3a24'], [1, '#30261a']]), rim: '#ffe7a8', offsets: [[0, -1.3], [-1, -0.6], [1, -0.6]], rimOp: 0.95 });
    s.add(`<path d="${place('M-29,-96Q0,-105 29,-96L28.4,-58Q25.6,-26 0,1Q-25.6,-26 -28.4,-58Z')}" fill="none" stroke="#b08a4e" stroke-width="1.3" opacity=".8"/>`);
    // vines climbing the shield, his legs and both shoulders
    const vines = place(U(
      vine([[-1, 4], [-12, -12], [-22, -32], [-28, -54], [-27, -74], [-23, -92]], 2.6, 6, 9904),
      vine([[24, -1], [29, -18], [28, -40], [30, -62], [26, -82]], 2.4, 6, 9905),
      vine([[-42, -94], [-45, -108], [-38, -124], [-26, -131], [-15, -134]], 2.2, 5.4, 9906),
      vine([[42, -95], [45, -110], [38, -126], [27, -132]], 2.2, 5.4, 9907),
      vine([[-62, -4], [-58, -24], [-54, -46]], 2, 5, 9908),
    ));
    s.figure(`<path d="${vines}"/>`, { fill: '#34492a', rim: '#d6e6a0', offsets: [[0, -0.8]], rimOp: 0.45 });
    // his gauntlets on the rim
    s.figure(`<path d="${place(U(ell(-19, -103, 6.8, 5.6), ell(19, -103, 6.8, 5.6), taper([[-24, -104], [-25, -97]], [3, 2.2], { per: 2 }), taper([[24, -104], [25, -97]], [3, 2.2], { per: 2 })))}"/>`,
      { fill: '#221d14', rim: '#fff0c2', offsets: [[0, -1.2]], rimOp: 0.9 });
    // roots running out from the shield's point
    s.path(U(
      taper([[150, 199], [128, 203], [104, 202], [82, 209]], [5, 4, 2.6, 0.5]), taper([[150, 199], [172, 204], [198, 201], [222, 208]], [5, 4, 2.6, 0.5]),
      taper([[150, 200], [144, 210], [140, 218]], [4, 3, 1]), taper([[129, 193], [112, 195], [94, 193]], [3, 2, 0.5]), taper([[171, 193], [190, 196], [208, 194]], [3, 2, 0.5]),
    ), '#120f0a');
    // the sun on his shield with a green shoot in it, his visor, the buds
    const buds = [[-27, -74], [30, -62], [-38, -124], [38, -126], [-12, -12], [-56, -44]].map(([x, y]) => [fx + x, fy + y]);
    for (const [x, y] of buds) s.glow(x, y, 6, v.glow, 0.55);
    s.glow(fx, fy - 62, 24, '#ffd77a', 0.55, 'breathe');
    s.bloom(`<path d="${sunMark(fx, fy - 62, 6.4)}" fill="none" stroke="#ffd77a" stroke-width="1.6"/>` +
      `<path d="${leafAt(fx, fy - 61, -62, 5.4, 0.5) + leafAt(fx, fy - 61, -118, 5.4, 0.5)}" fill="#effcaa"/>` +
      `<path d="M${fx - 7},${fy - 147}H${fx + 7}M${fx},${fy - 147}V${fy - 139}" stroke="#ffe9a8" stroke-width="1.3" stroke-linecap="round"/>` +
      `<path d="${dots(buds.map(([x, y]) => [x, y, 1.2]))}" fill="${v.hot}"/>`, { sd: 1.4, k: 1.5, box: [70, 30, 160, 160] });
    s.motes({ seed: 9909, n: 18, x: [30, 270], y: [30, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. Aeris, Queen of the Winds: a crowned queen on great pale wings,
  // borne up on an updraft between two sea cliffs, one arm raised; her cloak
  // of wind loops round under her, full of gulls and kestrels, and storm
  // light falls through a break in the clouds onto the waves below.
  'legend-aeris'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#14303c'], [0.32, '#2a5c68'], [0.6, '#5b9a9e'], [0.67, '#72b0ae']]));
    // the break in the storm, right over her
    s.glow(150, -10, 200, '#e6fbf8', 0.62);
    s.shafts({ cx: 150, cy: -40, n: 11, from: 62, to: 118, len: 290, spread: 2.4, color: '#e9fcf6', op: 0.24, seed: 9911, sd: 2.4 });
    // the sea, and the storm light lying on it under her
    s.path('M-10,140H310V214H-10Z', s.lin([[0, '#68aaaa'], [0.1, '#2c6e7a'], [0.45, '#13404c'], [1, '#06171f']]));
    s.add('<path d="M-10,140.5H310" stroke="#d8f8f3" stroke-width=".8" opacity=".45"/>');
    s.add(`<ellipse cx="150" cy="170" rx="74" ry="12" fill="${s.rad([[0, '#effdf9', 0.5], [0.5, '#c6f4f6', 0.2], [1, '#c6f4f6', 0]])}"/>`);
    s.add(glitter([[150, 146, 40, 0.5], [146, 152, 30, 0.42], [154, 160, 52, 0.36], [148, 168, 40, 0.3], [152, 177, 60, 0.26], [150, 188, 44, 0.2]], '#e8fcf8'));
    s.add('<g fill="none" stroke="#d8f6f1" stroke-width="1" stroke-linecap="round" opacity=".5"><path d="M86,156q8,-3 16,0M206,152q10,-3 20,0M74,178q12,-4 24,0M214,174q12,-4 26,0M104,198q14,-4 28,0M178,200q14,-4 28,0"/></g>');
    // the cliffs either side, surf at their feet
    const cliffs = U(
      poly([...spline([[-12, 104], [12, 106], [34, 110], [50, 116], [58, 128]], 5), [62, 150], [68, 176], [74, 214], [-12, 214]]),
      poly([...spline([[312, 112], [290, 114], [268, 118], [252, 124], [244, 134]], 5), [240, 156], [234, 180], [230, 214], [312, 214]]),
    );
    s.figure(`<path d="${cliffs}"/>`, { fill: '#0c2830', rim: '#d8f6f1', offsets: [[0, -1.3], [0.9, -0.6], [-0.9, -0.6]], rimOp: 0.85, shade: 0.5, light: [0, -1] });
    s.add('<g fill="none" stroke="#1f4a54" stroke-width="1" opacity=".8"><path d="M20,130L40,134M8,152L44,156M16,178L56,182M262,140L292,138M248,164L290,160M252,190L300,186"/></g>' +
      '<g fill="none" stroke="#e9f8f2" stroke-linecap="round" opacity=".7"><path d="M70,196q8,-4 18,0M216,190q10,-4 18,0" stroke-width="1.4"/><path d="M78,206q8,-3 16,0M206,204q8,-3 16,0" stroke-width="1"/></g>');
    // the storm clouds, torn open over her
    const cl = puffs([[6, -18, 46], [-14, 30, 20], [24, 26, 16], [52, 18, 18], [80, 8, 16], [100, -4, 14]], 1.35);
    s.figure(`<path d="${cl}"/><path d="${flipX(cl, 150)}"/>`, { fill: '#1d3a44', rim: '#e2faf6', offsets: [[0, 1.4], [1.2, 0.8], [-1.2, 0.8]], rimOp: 0.8, light: [0, 1] });
    // the updraft rising off the sea
    const R = rng(9912);
    let up = '';
    for (let i = 0; i < 8; i++) {
      const x0 = 118 + R() * 64, x1 = 150 + (x0 - 150) * 2.4;
      up += taper([[x0, 214], [x0 + (x1 - x0) * 0.3, 186], [x1, 150 - R() * 24]], [0.4, 2, 0.3], { per: 5 });
    }
    s.path(up, '#e9fcf6', 'opacity=".3"');
    // her cloak of wind: a loop of pale air from her shoulders, round under
    // her and up the far side, birds wheeling in it
    const band = [[148, 84], [124, 98], [102, 118], [90, 144], [100, 168], [126, 182], [162, 184], [196, 174], [222, 152], [232, 124], [228, 96], [214, 74]];
    s.path(taper(band, [3, 10, 16, 20, 22, 22, 20, 18, 14, 10, 6, 0.6]), s.radU(150, 128, 100, [[0, '#f2fffd', 0.62], [0.6, '#d6f6f4', 0.42], [1, '#a6e4ec', 0.22]]));
    const sb = spline(band, 6);
    const streak = (d, a, b) => 'M' + along(sb, d).slice(a, b).map(pt).join('L');
    s.add(`<path d="${streak(-7, 4, 40) + streak(-2, 14, 58) + streak(4, 8, 50) + streak(8, 26, 62)}" fill="none" stroke="#f4fffd" stroke-width=".8" opacity=".55" stroke-dasharray="14 4 6 3" stroke-linecap="round"/>`);
    // Aeris: great pale wings lit through by the storm light, long flight
    // feathers hanging from an arm that arches up and out from her shoulders
    const fx = 150, fy = 106, place = at(fx, fy, 1);
    const arm = spline([[5, -22], [13, -38], [26, -51], [42, -60], [60, -64], [74, -63]], 6);
    const feathers = [], quills = [];
    const N = 15;
    for (let i = 0; i < N; i++) {
      const t = 0.04 + (0.96 * i) / (N - 1), [x, y] = arm[Math.round(t * (arm.length - 1))];
      const a = 100 - 80 * t, L = 20 + 16 * t + 4 * Math.sin(Math.PI * t), mid = toward(x, y, a - 4, L * 0.5), tip = toward(x, y, a, L);
      feathers.push(taper([[x, y], mid, tip], [6 + 3 * t, 5.4 + 2 * t, 0.6], { per: 5 }));
      quills.push(`M${pt([x, y])}Q${pt(mid)} ${pt(toward(x, y, a, L - 4))}`);
    }
    for (let i = 0; i < 8; i++) { const t = 0.1 + (0.8 * i) / 7, [x, y] = arm[Math.round(t * (arm.length - 1))]; feathers.push(leafAt(x, y, 96 - 76 * t, 12 + 10 * t, 0.42)); }
    feathers.push(taper(arm, [9, 8, 7, 5, 3, 1]));
    const wingR = U(feathers), wings = place(U(wingR, flipX(wingR, 0)));
    s.glow(fx, fy - 30, 110, '#c6f4f6', 0.42);
    s.path(wings, s.radU(fx, fy - 24, 118, [[0, '#ffffff', 0.97], [0.35, '#eafcf9', 0.93], [0.75, '#c2e8ea', 0.9], [1, '#98ced4', 0.88]]));
    s.path(wings, 'none', 'stroke="#76aeb6" stroke-width=".6" opacity=".55"');
    const qs = quills.join('');
    s.add(`<path d="${place(qs) + place(flipX(qs, 0))}" fill="none" stroke="#6ea4ac" stroke-width=".7" opacity=".6"/>`);
    // her: a long gown blown back on the wind, one arm raised high, the
    // other flung out, hair streaming, a crown
    const her = place(U(
      blob([[-6, -2], [6, -2], [9, 12], [12, 28], [16, 44], [24, 56], [14, 54], [8, 62], [0, 55], [-8, 60], [-10, 46], [-9, 26], [-8, 10]], 4),
      taper([[0, 0], [0, -12], [0, -24]], [9, 9.5, 13]),
      ell(-5, -23.5, 3.6, 2.8), ell(5, -23.5, 3.6, 2.8),
      taper([[0, -26], [0, -31]], 3.8, { per: 2 }),
      ell(0, -36.5, 5, 6),
      taper([[2, -41], [8, -43], [16, -41], [24, -37], [33, -35]], [7, 6.4, 5, 3, 0.5]), taper([[3, -37], [10, -35], [18, -31], [27, -29]], [5, 4.4, 3, 0.4]),
      taper([[-5, -23], [-11, -33], [-15, -44]], [3.6, 3.2, 2.8]), taper([[-15, -44], [-18, -54], [-19, -63]], [2.8, 2.4, 2]), ell(-19.4, -65, 1.8, 2.4),
      taper([[5, -23], [15, -26], [25, -28]], [3.6, 3.2, 2.8]), taper([[25, -28], [34, -30], [42, -34]], [2.8, 2.4, 2]), ell(44, -35, 2.2, 1.8, -20),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.path(place(blob([[0, -40.6], [3, -39], [3.4, -35.6], [1.8, -32.2], [0, -31.4], [-1.8, -32.2], [-3.4, -35.6], [-3, -39]], 4)), '#bcd8d8');
    // birds wheeling in her cloak of wind
    const birds = [];
    [[10, 1.1, 0], [18, 1.15, 1], [26, 1.3, 0], [33, 1.1, 1], [41, 1.2, 0], [48, 1.05, 1], [55, 1.1, 0], [62, 0.95, 1]].forEach(([i, k, kind], j) => {
      const [x, y] = along(sb, j % 2 ? 4 : -4)[i], [x2, y2] = sb[Math.min(sb.length - 1, i + 1)], [x1, y1] = sb[i];
      const a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      birds.push(kind ? kestrel(x, y, k, a) : gull(x, y, k * 1.1, a * 0.3));
    });
    birds.push(gull(56, 64, 1.1, -8), gull(250, 40, 1, 10), kestrel(84, 92, 1, -70));
    s.figure(`<path d="${U(birds)}"/>`, { fill: '#0b2229', rim: '#e6fdfc', offsets: [[0, -0.8]], rimOp: 0.7 });
    // a wisp of the cloak passing in front of her
    s.add(`<path d="${streak(-1, 30, 44)}" fill="none" stroke="#f2fffd" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>`);
    // her crown catches the storm light
    s.glow(fx, fy - 46, 16, '#f4f3d6', 0.6, 'breathe');
    s.bloom(`<path d="${place('M-4.8,-41L-5.4,-48.4L-2.8,-44.8L0,-50.6L2.8,-44.8L5.4,-48.4L4.8,-41Z')}" fill="#f6f4dc"/>`, { sd: 1.3, k: 1.5, box: [125, 40, 50, 36] });
    s.add([[118, 120], [184, 128], [100, 92], [206, 98]].map(([x, y], i) => `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx=".9" ry="1.4" fill="#f2fdfb"/>`).join(''));
    s.motes({ seed: 9913, n: 16, x: [40, 260], y: [30, 190], r: [0.4, 1], fill: p.glow, hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL + EMBER. Vesh, the Red Widow: a pale widow in black, her long red
  // veil streaming away on the dusk wind; drops of crimson light rise out of
  // her open hands. Thorned roses grow round her feet, and ravens sit on the
  // gravestones behind her against the last of the sunset.
  'legend-vesh'(s) {
    fin(s, ['umbral', 'ember']);
    s.rect(s.lin([[0, '#0d0816'], [0.34, '#26122c'], [0.56, '#55192c'], [0.7, '#9a3228'], [0.8, '#d0602e']]));
    s.add(particles({ seed: 9921, n: 26, x: [0, W], y: [0, 80], r: [0.25, 0.8], fill: '#f0dcea', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the last of the sun, just down behind the hill
    s.glow(150, 170, 180, '#ff8a4a', 0.55);
    s.glow(150, 170, 60, '#ffb070', 0.5);
    s.layer(ridge({ seed: 9922, base: 166, amp: 12, freq: 2.2 }) + U(ell(34, 150, 6, 18), ell(48, 156, 5, 12), ell(270, 148, 7, 20), ell(284, 156, 5, 12)), '#4a1828', { blur: 0.7 });
    s.haze(144, 170, '#e0703a', 0.3);
    s.path(ledge([[-10, 176], [60, 172], [150, 175], [240, 171], [310, 175]]), s.lin([[0, '#2a1018'], [1, '#0c060a']]));
    // the graves behind her, ravens on three of them
    s.figure(`${slab(40, 176, 13, 20, -4)}${cross(78, 174, 26, 5)}${slab(112, 176, 11, 15, 3)}${slab(192, 175, 12, 17, -5)}${cross(226, 173, 28, -4)}${slab(264, 175, 14, 21, 6)}` +
      `<path d="${U(raven(80.3, 148.6, 1.15, -1), raven(266.2, 154.4, 1.1, 1), raven(38.6, 156.4, 1, 1))}"/>`, { fill: '#1a0a12', rim: '#ff9a6a', offsets: [[0, -1]], rimOp: 0.75 });
    s.path(U(gull(232, 62, 1.2, 6), gull(70, 78, 0.9, -10), gull(254, 92, 0.7, 4)), '#140810');
    // Vesh: a fitted black gown falling to the roses, long flared sleeves,
    // her hands held out at her sides, palms up
    const fx = 150, fy = 194, K = 1.04, place = at(fx, fy, K);
    const her = place(U(
      blob([[-8, -66], [8, -66], [12, -50], [17, -30], [23, -12], [28, 0], [0, 3], [-28, 0], [-23, -12], [-17, -30], [-12, -50]], 4),
      taper([[0, -62], [0, -79], [0, -93]], [12.5, 11, 15]),
      ell(-7.6, -92, 5, 3.6), ell(7.6, -92, 5, 3.6),
      taper([[0, -95], [0, -101]], 4.6, { per: 2 }),
      ell(0, -107.5, 6, 7.6, 0, 16),
      taper([[-10, -91], [-16, -80], [-20, -69]], [4.4, 3.8, 3.4]), taper([[-20, -69], [-27, -62], [-33, -58]], [3.4, 3, 2.6]),
      taper([[10, -91], [16, -80], [20, -69]], [4.4, 3.8, 3.4]), taper([[20, -69], [27, -62], [33, -58]], [3.4, 3, 2.6]),
      taper([[-19, -70], [-23, -58], [-24, -46]], [4, 7, 0.6]), taper([[19, -70], [23, -58], [24, -46]], [4, 7, 0.6]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#0e0810', rim: '#ffb08a', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [0, -1] });
    // the veil: a sheer red mantle over her head, framing her face, falling
    // past her shoulder on one side and streaming far out on the wind on
    // the other, its lace edge catching the last light
    const veilPts = [[0, -119.5], [8, -117.6], [14, -111], [24, -106], [40, -108], [58, -104], [76, -108], [96, -101], [116, -106], [132, -98], [114, -90], [96, -86], [78, -82], [60, -78],
      [44, -72], [30, -68], [20, -72], [14, -82], [10, -93], [7, -100], [6, -109], [0, -112], [-6, -109], [-7, -100], [-9, -92], [-13, -82], [-17, -71], [-21, -63], [-18, -78], [-14.5, -94], [-12.5, -108], [-8, -116.4]];
    const veil = place(poly(spline(veilPts, 3, true)));
    s.path(veil, s.linU(fx, fy - 120 * K, fx + 130, fy - 80 * K, [[0, '#a8182c', 0.82], [0.4, '#961628', 0.66], [1, '#7a1020', 0.4]]));
    s.path(veil, 'none', 'stroke="#ffb0a0" stroke-width="1.1" stroke-dasharray=".1 2.2" stroke-linecap="round" opacity=".55"');
    s.add(`<path d="${place('M16,-104Q40,-98 64,-98T112,-100M14,-92Q36,-86 58,-86T104,-92M-12,-100Q-14,-86 -18,-72')}" fill="none" stroke="#5a0814" stroke-width=".9" opacity=".6"/>`);
    // her face and hands, pale as the moon; a black comb on her head
    s.path(place(blob([[0, -114], [4.4, -111], [5, -105], [3, -101], [0, -99.4], [-3, -101], [-5, -105], [-4.4, -111]], 4)), '#ead8d6');
    s.path(place('M-5.6,-117L-4.6,-123L-2.4,-119L0,-125L2.4,-119L4.6,-123L5.6,-117L0,-115Z'), '#0e0810');
    s.path(place(U(ell(-36.4, -57.4, 4, 2, -6), taper([[-39, -58.4], [-41.5, -61]], [1.4, 0.5], { per: 2 }), taper([[-34, -58.6], [-35, -62]], [1.4, 0.5], { per: 2 }),
      ell(36.4, -57.4, 4, 2, 6), taper([[39, -58.4], [41.5, -61]], [1.4, 0.5], { per: 2 }), taper([[34, -58.6], [35, -62]], [1.4, 0.5], { per: 2 }))), '#e6d4d2');
    s.add(`<path d="${place(lens(-2, -107, 2.6, 6, 0.42, 3) + lens(2, -107, 2.6, -6, 0.42, 3))}" fill="#7a0c22"/>` +
      `<ellipse cx="${f1(fx)}" cy="${f1(fy - 102.2 * K)}" rx="1.2" ry=".55" fill="#8a1424"/>`);
    // the crimson drops rising out of her palms
    const hands = [[fx - 36.4 * K, fy - 59 * K, -1], [fx + 36.4 * K, fy - 59 * K, 1]];
    const drops = [], cores = [];
    for (const [hx, hy, d] of hands) {
      for (let i = 0; i < 8; i++) {
        const t = i / 7, x = hx + d * (2 + 9 * t + 5 * Math.sin(t * 5)), y = hy - 6 - 66 * t, r = 2.3 - 1.4 * t;
        drops.push([x, y, r]);
        cores.push([x, y - r * 0.15, r * 0.45]);
      }
    }
    for (const [hx, hy] of hands) s.glow(hx, hy - 4, 24, '#ff3a50', 0.5, 'breathe');
    s.bloom(`<path d="${dots(drops)}" fill="#ff2e4a"/><path d="${dots(cores)}" fill="#ffd6dc"/>` +
      `<path d="${drops.map(([x, y, r]) => `M${f1(x - r * 0.6)},${f1(y + r * 0.4)}L${f1(x)},${f1(y + r * 2.6)}L${f1(x + r * 0.6)},${f1(y + r * 0.4)}Z`).join('')}" fill="#ff2e4a" opacity=".7"/>`, { sd: 1.4, k: 1.5, box: [80, 40, 140, 110] });
    // the rose briars round her feet and in both near corners
    const stems = U(
      briar([[-12, 214], [6, 190], [18, 168], [36, 152], [58, 146]], 3, 9923), briar([[20, 214], [30, 196], [52, 182], [74, 178]], 2.6, 9924),
      briar([[-6, 180], [14, 172], [30, 176]], 2, 9925), briar([[312, 214], [294, 190], [282, 168], [264, 152], [242, 146]], 3, 9926),
      briar([[280, 214], [270, 196], [248, 182], [226, 178]], 2.6, 9927), briar([[306, 180], [286, 172], [270, 176]], 2, 9928),
      briar([[96, 214], [108, 200], [124, 194], [134, 192]], 2.2, 9929), briar([[204, 214], [192, 200], [176, 194], [166, 193]], 2.2, 9930),
      [[60, 148, -30], [36, 152, -120], [76, 178, 10], [240, 148, -150], [264, 152, -60], [224, 178, 170], [18, 172, -90], [282, 172, -90]].map(([x, y, a]) => leafAt(x, y, a, 7, 0.5)),
    );
    s.figure(`<path d="${stems}"/>`, { fill: '#12080c', rim: '#ff9a6a', offsets: [[0, -0.9]], rimOp: 0.6 });
    const blooms = [[24, 176, 6.4], [48, 158, 5.2], [70, 182, 5.6], [8, 152, 4.6], [276, 172, 6.4], [252, 156, 5.2], [232, 184, 5.6], [292, 150, 4.6], [124, 200, 5], [178, 201, 5.6], [150, 208, 4.4], [100, 196, 4]];
    s.path(U(blooms.map(([x, y, r], i) => rose(x, y, r, 9931 + i))), '#6e0c1c');
    s.add(`<path d="${blooms.map(([x, y, r]) => `M${f1(x - r * 0.5)},${f1(y)}a${f1(r * 0.5)},${f1(r * 0.42)} 0 1,1 ${f1(r * 0.6)},${f1(r * 0.3)}M${f1(x - r * 0.7)},${f1(y - r * 0.2)}q${f1(r * 0.6)},${f1(-r * 0.7)} ${f1(r * 1.3)},${f1(-r * 0.1)}`).join('')}" fill="none" stroke="#c63848" stroke-width=".8" opacity=".85"/>`);
    s.motes({ seed: 9943, n: 14, x: [96, 204], y: [50, 140], r: [0.35, 0.9], fill: '#ff5068', hot: '#ffe2e6', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    s.add(particles({ seed: 9944, n: 8, x: [20, 280], y: [100, 190], r: [0.6, 1.2], fill: '#b8303c', cls: 'float', t: [6, 10], op: [0.4, 0.8] }));
    return s.svg();
  },

  // EMBER + VERDANT. Ymra, Heart of the Mountain: a stone giantess heaving
  // herself up out of the flank of a volcano, its crater blazing right
  // behind her head; molten veins run out from the fire in her chest, pine
  // woods grow on her shoulders, and two villages sit lit at her hands.
  'legend-ymra'(s) {
    fin(s, ['ember', 'verdant']);
    s.rect(s.lin([[0, '#1a0806'], [0.3, '#3c140c'], [0.56, '#7a2c14'], [0.78, '#c25428'], [1, '#d8783a']]));
    // the crater's glare behind her, its smoke going up
    s.glow(150, 58, 190, '#ff8a3a', 0.6);
    s.glow(150, 62, 60, '#ffc25a', 0.55);
    s.add(smoke('#2a0a06', [[60, 26, 90, 7, 0.45], [244, 34, 80, 6, 0.35], [150, 8, 130, 8, 0.4]]));
    s.add(`<g class="drift">${[[150, 30, 34], [138, 14, 28], [164, 2, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r}" fill="${s.rad([[0, '#3a120a', 0.85], [0.7, '#2a0a06', 0.5], [1, '#2a0a06', 0]])}"/>`).join('')}</g>`);
    // far peaks, lava glowing in the valleys
    s.layer(ridge({ seed: 9951, base: 176, amp: 36, peaks: true, freq: 2.4 }), '#5a1d10', { blur: 0.7 });
    s.haze(146, 182, '#ff8a3a', 0.3);
    // the volcano's cone, rising behind her to the crater at her head
    s.path(poly([[-10, 214], [-10, 168], [40, 140], [96, 98], [134, 66], [166, 66], [204, 98], [260, 140], [310, 168], [310, 214]]), s.lin([[0, '#3a140a'], [1, '#1a0806']]));
    // Ymra: arms braced on the slopes either side, elbows out; long hair
    // falling over her shoulders, a crown of crags on her head
    const body = U(
      ell(150, 55, 11.5, 14.5),
      blob([[150, 36], [160, 38], [167, 46], [170, 58], [172, 72], [178, 86], [186, 96], [168, 92], [160, 80], [150, 76], [140, 80], [132, 92], [114, 96], [122, 86], [128, 72], [130, 58], [133, 46], [140, 38]], 4),
      poly([[137, 44], [140, 31], [144.6, 39], [150, 24], [155.4, 39], [160, 31], [163, 44]]),
      taper([[150, 66], [150, 86]], [14, 20], { per: 2 }),
      blob([[94, 94], [120, 86], [150, 84], [180, 86], [206, 94], [214, 112], [206, 134], [196, 154], [190, 172], [110, 172], [104, 154], [94, 134], [86, 112]], 5),
      ell(98, 102, 20, 15, -20), ell(202, 102, 20, 15, 20),
      [1, -1].map((d) => {
        const X = (x) => (d > 0 ? x : 300 - x);
        return [
          taper([[X(92), 104], [X(74), 120], [X(61), 134]], [26, 22, 20]), taper([[X(61), 134], [X(60), 148], [X(63), 160]], [20, 18, 16]),
          ell(X(63), 164, 14, 5.6, d * 4), taper([[X(55), 164], [X(45), 168]], [4, 2.4], { per: 2 }), taper([[X(56), 167], [X(47), 173]], [4, 2.4], { per: 2 }),
          taper([[X(60), 168], [X(54), 175]], [4, 2.4], { per: 2 }), taper([[X(71), 162], [X(78), 166]], [4, 2.4], { per: 2 }),
        ];
      }),
      ledge([[-12, 194], [20, 184], [46, 174], [70, 166], [92, 160], [116, 162], [150, 165], [184, 162], [208, 160], [230, 166], [254, 174], [280, 184], [312, 194]]),
    );
    s.figure(`<path d="${body}"/>`, { fill: '#1c120e', rim: '#ffc070', offsets: [[0, -1.4], [-1.2, -0.7], [1.2, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [0, -1] });
    // her face, a mask of warmer stone in the frame of her hair
    s.path(blob([[150, 42], [157.6, 45], [160.4, 54], [158, 63], [150, 68.6], [142, 63], [139.6, 54], [142.4, 45]], 4), s.lin([[0, '#2c1a12'], [1, '#4a2a1a']]));
    s.add('<path d="M143,50.4Q146.4,48.6 149,50.6M151,50.6Q153.6,48.6 157,50.4M150,52V59.4M146.8,63.2H153.2" fill="none" stroke="#140a06" stroke-width=".9" stroke-linecap="round"/>');
    // seams in the stone
    s.add('<g fill="none" stroke="#3a2418" stroke-width="1.2" opacity=".8"><path d="M112,96C118,110 114,126 120,140M188,96C182,110 186,126 180,140M128,150C140,156 160,156 172,150M80,122C74,130 68,134 64,142M220,122C226,130 232,134 236,142M30,196C60,190 80,186 100,180M200,180C230,186 260,190 290,196"/></g>');
    // the woods on her shoulders and the tops of her arms
    const along2 = (pts) => (x) => { for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, e] = pts[i + 1]; if (x <= c) return b + ((e - b) * (x - a)) / (c - a); } return pts[pts.length - 1][1]; };
    const lsh = along2([[78, 108], [88, 96], [100, 89], [112, 87], [126, 86], [136, 86]]);
    const larm = along2([[62, 124], [70, 116], [80, 108]]);
    s.figure(`<path d="${U(pinesOn(9952, 82, 134, lsh, [8, 17]), pinesOn(9953, 166, 218, (x) => lsh(300 - x), [8, 17]),
      pinesOn(9954, 62, 78, larm, [6, 11], [5, 7]), pinesOn(9955, 222, 238, (x) => larm(300 - x), [6, 11], [5, 7]))}"/>`,
      { fill: '#1a2410', rim: '#ffc080', offsets: [[0, -1], [-0.7, -0.6], [0.7, -0.6]], rimOp: 0.85 });
    // the fire in her chest and the molten veins running out of it, down
    // her arms to her hands and into the lava on the slopes
    const hx = 150, hy = 120;
    const veins = [
      jag(9956, hx, hy, -96, 32, 2.6), jag(9957, hx - 2, hy, -164, 50, 2.6, 7), jag(9958, hx + 2, hy, -16, 50, 2.6, 7),
      jag(9959, hx, hy + 4, 108, 48, 2.6), jag(9960, hx + 1, hy + 4, 72, 46, 2.4),
      jag(9961, 100, 106, 144, 44, 2, 6, 30), jag(9962, 63, 134, 88, 28, 1.8, 5, 30),
      jag(9963, 200, 106, 36, 44, 2, 6, 30), jag(9964, 237, 134, 92, 28, 1.8, 5, 30),
      jag(9965, 150, 43, -90, 7, 1, 2, 30),
    ].join('');
    const lava = U(taper(spline([[126, 170], [112, 178], [106, 188], [96, 196], [92, 206], [88, 216]], 4), [3.6, 3.2, 2.8, 2.4, 2, 1.6], { per: 2 }),
      taper(spline([[174, 170], [188, 179], [192, 190], [204, 198], [208, 207], [212, 216]], 4), [3.6, 3.2, 2.8, 2.4, 2, 1.6], { per: 2 }));
    s.glow(hx, hy, 70, '#ff7a2e', 0.5);
    s.glow(hx, hy, 26, '#ffd27a', 0.8, 'breathe');
    s.bloom(`<path d="${veins}" fill="#ffb04a"/><path d="${lava}" fill="#ff9a3a"/>` +
      `<path d="${lens(hx, hy, 24, 90, 0.5)}" fill="${s.radU(hx, hy, 14, [[0, '#ffffff'], [0.3, '#fff0b0'], [0.7, '#ffb04a'], [1, '#ff6a1f']])}"/>` +
      `<path d="${lens(145, 55, 5.2, -6, 0.4, 3) + lens(155, 55, 5.2, 6, 0.4, 3)}" fill="#ffe08a"/>`, { sd: 1.8, k: 1.45, box: [30, 30, 240, 184] });
    // the foothills, and two villages with their windows lit
    s.path(ledge([[-10, 202], [40, 197], [90, 200], [150, 204], [210, 199], [260, 197], [310, 201]]), s.lin([[0, '#140a08'], [1, '#060302']]));
    const house = (x, b, w, h) => poly([[x, b], [x, b - h], [x + w / 2, b - h - w * 0.55], [x + w, b - h], [x + w, b]]);
    const village = (x0, b, seed) => {
      const r = rng(seed), out = [], lit = [];
      for (let x = x0, i = 0; i < 7; i++) {
        const w = 5 + r() * 3, h = 4 + r() * 3, y = b + Math.sin(x / 9) * 1.2;
        out.push(house(x, y + 1, w, h));
        if (r() < 0.8) lit.push([x + w * 0.5, y - h * 0.45, 0.8]);
        x += w + 1 + r() * 3;
      }
      return { out, lit };
    };
    const vl = village(30, 198, 9966), vr = village(212, 198, 9967);
    const spire = U(poly([[66, 199], [66, 184], [68.5, 176], [71, 184], [71, 199]]), poly([[242, 199], [242, 186], [244.4, 179], [246.8, 186], [246.8, 199]]));
    s.path(U(vl.out, vr.out, spire), '#0a0504');
    s.bloom(`<path d="${dots([...vl.lit, ...vr.lit, [68.5, 190, 0.8], [244.4, 191, 0.8]])}" fill="#ffd27a"/>`, { sd: 1.2, k: 1.6, box: [20, 170, 260, 40] });
    s.motes({ seed: 9968, n: 26, x: [20, 290], y: [10, 180], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // RADIANT + UMBRAL. Lumen, Mother of Moths: a great moth hangs over a dark
  // meadow at night, her wings stained glass lit from within, gold at the
  // heart and violet at the edges; out from under them spiral two streams
  // of tiny glowing moths, hundreds of them.
  'legend-lumen'(s) {
    fin(s, ['radiant', 'umbral']);
    s.rect(s.lin([[0, '#0a0818'], [0.36, '#1b1838'], [0.62, '#3a2c5c'], [0.8, '#6a4a6a'], [0.88, '#86606a']]));
    s.add(particles({ seed: 9971, n: 34, x: [0, W], y: [0, 120], r: [0.25, 0.8], fill: '#f0e6ff', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(150, 96, 170, '#ffd9a0', 0.42);
    s.layer(ridge({ seed: 9972, base: 174, amp: 14, freq: 2.4 }) + pines({ seed: 9973, base: 170, x0: 10, x1: 70, h: [12, 22], gap: [6, 10] }) + pines({ seed: 9974, base: 168, x0: 228, x1: 292, h: [12, 24], gap: [6, 10] }), '#3a2c48', { blur: 0.7 });
    s.haze(150, 180, '#b88a8a', 0.26);
    s.path(ledge([[-10, 186], [60, 182], [130, 185], [200, 182], [260, 185], [310, 183]]), s.lin([[0, '#241a28'], [1, '#0a070c']]));
    s.add(`<ellipse cx="150" cy="188" rx="96" ry="9" fill="${s.rad([[0, '#ffd98a', 0.42], [0.5, '#ffcf7a', 0.16], [1, '#ffcf7a', 0]])}"/>`);
    // the wings: forewing and hindwing (with its long tail) on the right,
    // mirrored to the left
    const fore = blob([[154, 80], [164, 66], [180, 50], [200, 38], [224, 28], [246, 24], [258, 30], [256, 44], [246, 60], [228, 76], [204, 90], [178, 98], [158, 96]], 4);
    const hind = U(blob([[154, 96], [172, 100], [196, 108], [214, 120], [220, 136], [212, 148], [198, 146], [184, 136], [168, 122], [156, 108]], 4),
      taper([[202, 142], [210, 153], [216, 164], [219, 173]], [9, 5.6, 4, 3]), lens(220.4, 177.6, 9.6, 72, 0.5));
    const wings = U(fore, hind, flipX(fore, 150), flipX(hind, 150));
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><path d="${wings}"/></clipPath>`);
    // the panes: cells between the veins (rays from each wing's root) and
    // the cross-veins (rings round it), tinted gold near the body and
    // violet and rose toward the edges
    const F = [156, 86], G = [156, 100];
    const A = [-70, -54, -41, -28, -15, -2, 12, 26], RA = [7, 30, 58, 86, 170];
    const B = [6, 24, 42, 60, 78, 100], RB = [6, 24, 46, 150];
    const tints = [['#fff4d6', '#fff4d6'], ['#ffc860', '#ff9a6a'], ['#ffb04a', '#b07cff'], ['#8a5ad8', '#c86aa0']];
    const ops = [0.35, 0.45, 0.5, 0.6];
    const cell = ([cx, cy], a0, a1, r0, r1) => poly([toward(cx, cy, a0, r0), toward(cx, cy, a0, r1), toward(cx, cy, (a0 + a1) / 2, r1 * 1.04), toward(cx, cy, a1, r1), toward(cx, cy, a1, r0)]);
    let panes = '', lead = '';
    for (const [root, ang, rr] of [[F, A, RA], [G, B, RB]]) {
      for (let j = 0; j < rr.length - 1; j++) {
        for (let i = 0; i < ang.length - 1; i++) {
          const c = cell(root, ang[i], ang[i + 1], rr[j], rr[j + 1]);
          panes += `<path d="${c + flipX(c, 150)}" fill="${tints[j][(i + j) % 2]}" opacity="${ops[j]}"/>`;
        }
      }
      for (const a of ang) lead += `M${pt(toward(root[0], root[1], a, 4))}L${pt(toward(root[0], root[1], a, 180))}`;
      for (const r of rr.slice(1, -1)) {
        const arc = [];
        for (let a = ang[0]; a <= ang[ang.length - 1]; a += 4) arc.push(toward(root[0], root[1], a, r));
        lead += 'M' + arc.map(pt).join('L');
      }
    }
    lead += flipX(lead, 150);
    s.glow(150, 92, 110, '#ffe2a0', 0.5);
    s.add(`<g clip-path="url(#${cid})"><rect x="0" y="0" width="${W}" height="${H}" fill="${s.radU(150, 96, 120, [[0, '#fff8e4'], [0.3, '#ffd98a'], [0.62, '#e09060'], [1, '#6a3a7a']])}"/>` +
      `${panes}<path d="${lead}" fill="none" stroke="#1a1020" stroke-width="1.8" stroke-linejoin="round"/></g>`);
    s.figure(`<path d="${wings}" fill="none" stroke-width="3.2" stroke-linejoin="round"/>`, { fill: 'none', rim: '#ffe7b0', offsets: [[0, -0.8]], rimOp: 0.5 });
    s.path(wings, 'none', 'stroke="#140c1a" stroke-width="3.2" stroke-linejoin="round"');
    // eyespots, round panes in each wing
    const eyes = [[221, 51, 8], [185.7, 126.8, 5.6]];
    // the body: furred thorax, a long tapering abdomen, feathered feelers
    const feeler = (dir) => {
      const sp = spline([[150 + dir * 3, 60], [150 + dir * 10, 48], [150 + dir * 20, 38], [150 + dir * 28, 34]], 6), out = [taper([[150 + dir * 3, 60], [150 + dir * 10, 48], [150 + dir * 20, 38], [150 + dir * 28, 34]], [1.8, 1.4, 1, 0.5])];
      for (let i = 3; i < sp.length - 1; i += 2) {
        const [x, y] = sp[i], [x2, y2] = sp[i + 1], a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI, l = 5 - (3 * i) / sp.length;
        out.push(leafAt(x, y, a - 70, l, 0.34, 3), leafAt(x, y, a + 70, l, 0.34, 3));
      }
      return out;
    };
    const body = U(
      ell(150, 64, 5.6, 5), ell(150, 78, 8.4, 11),
      taper([[150, 88], [150, 108], [150, 130]], [13, 11, 3]),
      [-160, -130, -100, -80, -50, -20].map((a) => leafAt(150, 71, a, 7, 0.5, 3)),
      feeler(1), feeler(-1),
      taper([[144, 84], [137, 92], [135, 100]], [2, 1.6, 1]), taper([[156, 84], [163, 92], [165, 100]], [2, 1.6, 1]),
    );
    s.figure(`<path d="${body}"/>`, { fill: '#140c1a', rim: '#ffe7b0', offsets: [[0, -1.1], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.9 });
    s.add('<path d="M143,96H157M144,103H156M145,110H155M146,117H154M147,123H153" stroke="#3a2a44" stroke-width="1" opacity=".9"/>');
    // the swarm: two arms spiralling out from under her wings, round below
    // her and up past her wingtips, thinning as they go
    const R = rng(9975), swarm = [[], [], []], hot = [], small = [];
    for (const d of [1, -1]) {
      for (let i = 0; i < 74; i++) {
        const t = i / 73, th = rad(85 - 130 * t), r = 18 + 127 * Math.pow(t, 0.9), spread = 2 + 10 * t;
        const x = 150 + d * (r * Math.cos(th) + (R() - 0.5) * spread * 2), y = 130 + r * Math.sin(th) * 0.6 + (R() - 0.5) * spread * 2;
        const rr = Math.max(0.35, 1.5 - 0.9 * t + (R() - 0.5) * 0.5);
        swarm[i % 3].push([x, y, rr]);
        if (rr > 1.1) hot.push([x, y, rr * 0.45]);
        if (i % 10 === 5) small.push([x, y, 0.5 + 0.35 * t]);
      }
    }
    for (let i = 0; i < 26; i++) swarm[i % 3].push([150 + (R() - 0.5) * 50, 128 + R() * 18, 0.5 + R() * 0.8]);
    for (let i = 0; i < 20; i++) swarm[i % 3].push([20 + R() * 260, 10 + R() * 150, 0.35 + R() * 0.5]);
    const tiny = (x, y, k) => U(lens(x - 4 * k, y - 1.6 * k, 9 * k, -24, 0.62, 3), lens(x + 4 * k, y - 1.6 * k, 9 * k, 24, 0.62, 3), lens(x - 3 * k, y + 2.6 * k, 6 * k, 30, 0.6, 3), lens(x + 3 * k, y + 2.6 * k, 6 * k, -30, 0.6, 3));
    for (const [x, y, k] of small) s.glow(x, y, 6 + 8 * k, '#ffd77a', 0.6);
    s.glow(150, 132, 36, '#ffe2a0', 0.55, 'breathe');
    for (let g = 0; g < 3; g++) {
      s.add(`<g class="float" style="--t:${5 + g * 1.5}s;--d:-${g * 2}s"><path d="${dots(swarm[g])}" fill="#ffe6a8"/></g>`);
    }
    s.bloom(`<path d="${U(small.map(([x, y, k]) => tiny(x, y, k)))}" fill="#ffe2a0" opacity=".85"/><path d="${dots(hot)}" fill="#ffffff"/>` +
      `${eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff2c8"/><circle cx="${300 - x}" cy="${y}" r="${r}" fill="#fff2c8"/>`).join('')}` +
      '<g fill="#fff6dc"><circle cx="147.4" cy="64" r="1.2"/><circle cx="152.6" cy="64" r="1.2"/></g>', { sd: 1.4, k: 1.4 });
    s.add(`<g fill="none">${eyes.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r * 0.62}" stroke="#8a5ad8" stroke-width="${f1(r * 0.3)}"/><circle cx="${300 - x}" cy="${y}" r="${r * 0.62}" stroke="#8a5ad8" stroke-width="${f1(r * 0.3)}"/>` +
      `<circle cx="${x}" cy="${y}" r="${r}" stroke="#1a1020" stroke-width="1.6"/><circle cx="${300 - x}" cy="${y}" r="${r}" stroke="#1a1020" stroke-width="1.6"/>`).join('')}</g>`);
    // grass in front
    const G2 = rng(9976), blades = [];
    for (let x = -8; x < 312; x += 3 + G2() * 4) {
      const edge = x < 80 || x > 220, h = (edge ? 14 : 6) + G2() * (edge ? 22 : 10), l = (G2() - 0.5) * 10;
      blades.push(taper([[x, 216], [x + l * 0.4, 214 - h * 0.5], [x + l, 214 - h]], [1.8, 1.1, 0.3], { per: 4 }));
    }
    s.path(U(blades), '#0a070c');
    return s.svg();
  },

  // ── TRAPS ─────────────────────────────────────────────────────────

  // VERDANT. Pitfall: on a sunlit forest path the carpet of leaves gives way
  // under a great horned aurochs; it pitches forward into the pit, its
  // forelegs gone through, a hind leg kicking, leaves bursting up all round,
  // and vines lash up from the edge to close over it.
  pitfall(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f6efc6'], [0.42, '#e0e0aa'], [1, '#a9be84']]));
    s.glow(56, 6, 150, '#fff7d2', 0.9);
    // the wood: pale far trunks, the canopy, nearer trunks
    s.add(`<g fill="#d6dcb0">${[[196, 8], [236, 6], [266, 9], [16, 7], [70, 6], [104, 8]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="150"/>`).join('')}</g>`);
    s.layer(woods({ seed: 13201, base: 116, top: 40, r0: 12, r1: 22 }), '#a9bc8a', { blur: 0.6 });
    s.add(`<g fill="#8aa26c">${[[24, 10], [62, 8], [226, 11], [262, 9], [290, 8]].map(([x, w]) => `<rect x="${x}" y="92" width="${w}" height="60"/>`).join('')}</g>`);
    s.shafts({ cx: 30, cy: -10, from: 30, to: 76, n: 9, len: 320, spread: 2.6, color: '#fffbe2', op: 0.3, seed: 13202, sd: 2.2 });
    s.haze(112, 150, '#f6f4d6', 0.3);
    // the forest floor, the path running back into the trees
    s.path('M-10,214L-10,142C60,138 120,140 160,142C220,144 260,139 310,142L310,214Z', s.lin([[0, '#b8c47e'], [0.4, '#8a9a54'], [1, '#46582e']]));
    s.path('M56,214L118,146Q132,138 146,146L204,214Z', s.lin([[0, '#e2dca4'], [0.5, '#c6c084'], [1, '#9aa066']]));
    // the pit: its far wall lit by the sun, roots hanging into the dark
    const px = 124, py = 178, rx = 84, ry = 20;
    s.path(oval(px, py, rx, ry), s.lin([[0, '#a6884e'], [0.3, '#6a5030'], [0.62, '#221a0e'], [1, '#080604']]));
    const R = rng(13203);
    let roots = '';
    for (let i = 0; i < 16; i++) {
      const x = px - rx + 10 + ((2 * rx - 20) * i) / 15 + (R() - 0.5) * 4, y = py - ry * Math.sqrt(Math.max(0, 1 - ((x - px) / rx) ** 2)) + 1;
      roots += taper([[x, y], [x + (R() - 0.5) * 3, y + 4 + R() * 6], [x + (R() - 0.5) * 4, y + 8 + R() * 10]], [1.4, 0.9, 0.2], { per: 3 });
    }
    s.path(roots, '#2e2212');
    // the aurochs, side on, stumbling forward as the ground goes from under
    // it: forelegs plunging into the pit, head still up with its horns
    // against the light, one hind leg planted, one kicking, tail flung up
    // (drawn facing left, then pitched forward about its planted hoof)
    const bull = U(
      blob([[-36, -14], [-40, -30], [-30, -46], [-14, -54], [6, -48], [26, -44], [44, -42], [52, -32], [50, -16], [40, -8], [10, -6], [-20, -6]], 5),
      taper([[-34, -34], [-48, -32], [-61, -28]], [26, 22, 15]), ell(-63, -26, 8, 7.4, 10),
      taper([[-46, -43], [-54, -58], [-68, -66], [-81, -60]], [7.6, 6, 3.8, 0.6]),
      taper([[-41, -45], [-43, -61], [-53, -71], [-67, -73]], [6.6, 5, 3, 0.5]),
      lens(-40, -42, 7, -150, 0.42, 3), taper([[-52, -24], [-50, -16], [-48, -10]], [6, 4, 0.6]),
      [[-32, -45], [-24, -50], [-16, -53], [-8, -53]].map(([x, y]) => taper([[x, y + 3], [x - 2, y - 1], [x - 4, y - 3]], [6, 4, 0.6], { per: 3 })),
      taper([[-30, -10], [-38, 8], [-44, 26]], [11, 8.4, 6.6]), taper([[-20, -8], [-24, 10], [-26, 28]], [10, 8, 6]),
      taper([[38, -14], [40, 4], [42, 20]], [14, 10, 7]), ell(43, 21, 5, 3),
      taper([[46, -18], [56, -10], [63, -8]], [13, 10, 7]), taper([[63, -8], [71, -12], [77, -18]], [6.4, 5.4, 4.8]), ell(79, -19.4, 4.6, 3.2, -40),
      taper([[50, -36], [61, -43], [68, -55], [69, -66]], [4.6, 3.6, 2.6, 1.6]), lens(69.4, -71, 11, -84, 0.46),
    );
    const tip = (d) => rot(at(228 - 42 * 1.1, 172 - 22 * 1.1, 1.1)(d), 228, 172, -22);
    s.figure(`<path d="${tip(bull)}"/>`, { fill: '#141c0e', rim: p.rim, offsets: [[-1.1, -1], [0, -1.3], [1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.5, -1] });
    const [ex, ey] = tip('M-54,-34').slice(1).split(',').map(Number);
    s.add(`<circle cx="${f1(ex)}" cy="${f1(ey)}" r="1.2" fill="#f2f6d8"/>`);
    // the near lip of the pit: the torn carpet of leaves sagging over it
    const lip = [];
    for (let i = 0; i <= 26; i++) { const a = rad((180 * i) / 26); lip.push([px - Math.cos(a) * (rx + 1), py + Math.sin(a) * (ry + 1) + (i % 2 ? 2.2 : 0)]); }
    s.path(poly([[px - rx - 30, 214], [px - rx - 30, py], ...lip, [px + rx + 30, py], [px + rx + 30, 214]]), s.lin([[0, '#5e7440'], [0.3, '#4a6032'], [1, '#2e4020']]));
    const flaps = [];
    for (let i = 1; i < 26; i += 2) { const [x, y] = lip[i]; flaps.push(leafAt(x, y - 1, -90 + (R() - 0.5) * 50, 6 + R() * 4, 0.5, 3)); }
    s.path(U(flaps), '#4e6434');
    // sticks of the hidden lattice, snapped
    s.add('<g stroke="#2e2414" stroke-width="1.6" stroke-linecap="round"><path d="M42,174L54,158M206,176L196,160M70,196L80,182M180,198L172,182"/></g>');
    // vines lashing up out of the edge at either side, curling in over it
    const v1 = tendril(42, 178, -78, 46, { bend: 72, w: 3, curl: 5 }), v2 = tendril(74, 200, -64, 36, { bend: 64, w: 2.8, curl: 4 });
    const v3 = tendril(186, 200, -116, 40, { bend: -70, w: 2.8, curl: 4.4 }), v4 = tendril(212, 182, -70, 30, { bend: 60, w: 2.4, curl: 4 });
    const vl = [v1, v2, v3, v4];
    const vleaves = [[44, 160, -150, 7], [50, 144, -30, 6], [80, 184, -150, 6], [178, 184, -30, 6], [214, 168, -150, 5]].map(([x, y, a, l]) => leafAt(x, y, a, l, 0.5));
    s.figure(`<path d="${U(vl.map((t) => t.d), vleaves)}"/>`, { fill: '#2a3e1c', rim: '#f2ffc0', offsets: [[0, -1], [-0.8, -0.6]], rimOp: 0.9 });
    for (const t of vl) s.glow(t.tip[0], t.tip[1], 7, p.glow, 0.75);
    s.bloom(`<path d="${dots(vl.map((t) => [t.tip[0], t.tip[1], 1.4]))}" fill="${p.hot}"/>`, { sd: 1.2, k: 1.6, box: [40, 100, 220, 110] });
    // leaves bursting up into the air all round it
    const flying = [[], [], []];
    for (let i = 0; i < 32; i++) {
      const a = rad(-178 + R() * 176), d = 40 + R() * 66, x = px + 10 + Math.cos(a) * d * 1.3, y = 152 + Math.sin(a) * d * 0.95;
      flying[i % 3].push(lens(x, y, 4 + R() * 4, R() * 180, 0.5, 3));
    }
    s.add(flying.map((f, g) => `<path class="float" style="--t:${5 + g}s;--d:-${g * 1.6}s" d="${U(f)}" fill="${['#6e8a44', '#b4b870', '#4a6230'][g]}"/>`).join(''));
    // ferns at the near corners
    const frond = (x, y, a, L, bend) => {
      const pts = [[x, y]];
      let qx = x, qy = y;
      for (let i = 1; i <= 8; i++) { const g = rad(a + (bend * i) / 8); qx += (Math.cos(g) * L) / 8; qy += (Math.sin(g) * L) / 8; pts.push([qx, qy]); }
      const out = [taper(pts, [3, 0.6])];
      for (let i = 1; i < 8; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], g = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI, l = L * 0.3 * (1 - i / 9); out.push(leafAt(ax, ay, g - 58, l, 0.36, 3), leafAt(ax, ay, g + 58, l, 0.36, 3)); }
      return out;
    };
    s.path(U(frond(-6, 214, -62, 56, 34), frond(8, 214, -88, 44, 26), frond(306, 214, -118, 56, -34), frond(292, 214, -92, 44, -26)), '#16200e');
    s.motes({ seed: 13204, n: 14, x: [30, 270], y: [20, 160], r: [0.5, 1.1], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  // RADIANT. Mirror Shield: a great polished golden shield stands planted
  // alone on a dawn battlefield; a horned brute charges it claws first, and
  // in its face the brute's own reflection reaches back. Light bursts where
  // the two claws meet.
  'mirror-shield'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#222a46'], [0.34, '#46507a'], [0.6, '#a2928a'], [0.8, '#e6bf8a'], [1, '#e2a068']]));
    s.add(particles({ seed: 13301, n: 14, x: [0, W], y: [0, 60], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(250, 166, 150, '#ffd9a0', 0.55);
    // the far field: a ridge, spears standing in it, a torn banner
    const R = rng(13302);
    let spears = '';
    for (let i = 0; i < 14; i++) { const x = 6 + R() * 288, a = (R() - 0.5) * 40, h = 9 + R() * 8, [tx, ty] = toward(x, 160, a - 90, h); spears += `M${f1(x)},160L${f1(tx)},${f1(ty)}`; }
    s.blur(`<path d="${ridge({ seed: 13303, base: 164, amp: 12, freq: 2.2 })}" fill="#9a8678"/><path d="${spears}" stroke="#9a8678" stroke-width="1"/>` +
      '<path d="M266,160L268,128L269.4,128L267.6,160ZM268.6,129L282,132L276,136L281,141L268.4,139Z" fill="#9a8678"/>', 0.6);
    s.haze(140, 170, '#f2c690', 0.34);
    s.path(ledge([[-10, 176], [60, 175], [150, 174], [230, 172], [310, 175]]), s.lin([[0, '#4a3826'], [1, '#160f0a']]));
    // the brute: a hunched horned thing in full charge, its near arm flung
    // out claws first (drawn facing right, feet on y = 0)
    const brute = U(
      taper([[-6, -48], [-20, -28], [-34, -8]], [20, 15, 11]), ell(-37, -4, 9, 4, 20),
      taper([[8, -48], [20, -30], [18, -6]], [20, 15, 12]), ell(23, -3, 10, 4),
      blob([[-16, -48], [6, -44], [28, -58], [44, -76], [50, -92], [40, -110], [16, -118], [-6, -110], [-20, -90], [-24, -66]], 5),
      ell(52, -88, 10, 9, 10), taper([[54, -82], [64, -79], [70, -75]], [8, 6, 3]),
      taper([[48, -96], [54, -110], [68, -116], [80, -110]], [7, 5.6, 3.4, 0.6]),
      taper([[42, -98], [42, -114], [52, -124], [66, -124]], [6, 4.6, 2.8, 0.5]),
      taper([[36, -94], [60, -88], [82, -80]], [17, 13, 11]), ell(88, -78, 7, 6, 20),
      taper([[92, -82], [100, -84], [106, -81]], [3.4, 2.2, 0.4]), taper([[94, -78], [102, -77], [108, -73]], [3.4, 2.2, 0.4]), taper([[92, -74], [98, -70], [102, -64]], [3.4, 2.2, 0.4]),
      taper([[8, -104], [-10, -96], [-24, -84]], [14, 12, 10]), taper([[-24, -84], [-30, -70], [-30, -58]], [10, 8.6, 7]),
      taper([[-30, -58], [-28, -50]], [3, 0.6], { per: 2 }), taper([[-33, -58], [-35, -50]], [3, 0.6], { per: 2 }),
      [[-8, -110], [2, -116], [12, -119], [22, -117], [32, -112]].map(([x, y], i) => taper([[x, y + 3], [x - 4, y - 5], [x - 9, y - 9 - (i % 2) * 3]], [6, 3.4, 0.4], { per: 3 })),
    );
    const P = [154, 96], claw = [108, -73];
    // the shield: a tall kite shield, its point driven into the earth, the
    // polished face turned a little toward the brute
    const kite = 'M154,62Q194,50 234,62L236,96Q232,142 196,178Q158,142 154,96Z';
    const inner = 'M158,66Q194,55 230,66L232,96Q228,139 196,172Q162,139 158,96Z';
    s.figure(`<path d="${mv(kite, 5, 0)}"/>`, { fill: '#4a3018', rim: '#ffe7a8', offsets: [[1, -1], [0, -1.3]], rimOp: 0.9 });
    s.path(kite, s.radU(176, 82, 120, [[0, '#fff8dc'], [0.22, '#ffe08a'], [0.6, '#d6a040'], [1, '#7a5420']]));
    // in its face, the brute coming the other way, reaching for the same
    // point: its reflection, smaller in the curve of the gold
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><path d="${inner}"/></clipPath>`);
    const mirrored = at(P[0] + claw[0] * 0.6, P[1] - claw[1] * 0.6, 0.6, -1)(brute);
    s.add(`<g clip-path="url(#${cid})"><path d="${mirrored}" fill="#5a3818" opacity=".8"/>` +
      '<path d="M146,130L206,40L222,40L162,130ZM170,160L230,70L236,70L176,160Z" fill="#fffbe8" opacity=".22"/></g>');
    s.add(`<path d="${kite}" fill="none" stroke="#f6d27a" stroke-width="2.6"/><path d="${inner}" fill="none" stroke="#9a6a28" stroke-width="1" opacity=".8"/>` +
      `<path d="${dots([[161, 68, 1.1], [194, 59.6, 1.1], [227, 68, 1.1], [231, 100, 1.1], [218, 134, 1.1], [196, 166, 1.1], [174, 134, 1.1], [161, 100, 1.1]])}" fill="#fff0c2"/>`);
    s.path(U(ell(196, 177, 18, 4.4), ell(184, 178, 10, 3), ell(210, 178, 9, 3)), '#2a1c10');
    // the brute itself, and the dust it kicks up
    s.add(`<g class="drift">${[[18, 166, 26, 9], [42, 172, 18, 6], [0, 174, 16, 6]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${s.rad([[0, '#ecd0a2', 0.5], [1, '#ecd0a2', 0]])}"/>`).join('')}</g>`);
    s.figure(`<path d="${at(P[0] - claw[0], P[1] - claw[1], 1)(brute)}"/>`, { fill: '#1e1610', rim: p.rim, offsets: [[0.9, -1], [0, -1.3], [-0.8, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    s.add(`<circle cx="${f1(P[0] - claw[0] + 57)}" cy="${f1(P[1] - claw[1] - 90)}" r="1.3" fill="#ff9a4a"/>`);
    // the burst where the claws meet
    s.glow(P[0], P[1], 70, '#fff6dc', 0.85);
    s.glow(P[0], P[1], 26, '#ffffff', 0.9, 'breathe');
    let rays = '';
    for (let i = 0; i < 16; i++) { const a = i * 22.5 + (i % 2) * 6, [x1, y1] = toward(P[0], P[1], a, 7), [x2, y2] = toward(P[0], P[1], a, i % 2 ? 18 : 30); rays += `M${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}`; }
    const sparks = [];
    for (let i = 0; i < 18; i++) { const a = rad(R() * 360), d = 12 + R() * 34; sparks.push([P[0] + Math.cos(a) * d, P[1] + Math.sin(a) * d * 0.8, 0.5 + R() * 0.9]); }
    s.bloom(`<path d="${rays}" stroke="#fff6dc" stroke-width="1.3" stroke-linecap="round"/><path d="${glint(P[0], P[1], 24, 0.12) + rot(glint(P[0], P[1], 12, 0.2), P[0], P[1], 45)}" fill="#ffffff"/>` +
      `<path d="${dots(sparks)}" fill="#fff0c2"/>`, { sd: 1.6, k: 1.5, box: [100, 40, 110, 110] });
    s.motes({ seed: 13304, n: 16, x: [30, 280], y: [30, 180], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. Fog Bank: a towering bank of silver fog rolls in off the sea over
  // a rocky shore under the moon; a line of warriors charges into it, each
  // one further in fainter, the last already gone to a shadow.
  'fog-bank'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0c2430'], [0.4, '#1e4c58'], [0.62, '#46808a'], [0.7, '#5a9298']]));
    s.add(particles({ seed: 13401, n: 18, x: [0, 170], y: [0, 80], r: [0.25, 0.7], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.7], t: [2.5, 6] }));
    // the moon over the sea, lighting the bank's face
    s.glow(64, 38, 130, '#e6fbf8', 0.55);
    s.add('<circle cx="64" cy="38" r="13" fill="#f2fbf8"/><circle cx="60" cy="34" r="2.6" fill="#d6eeec" opacity=".6"/><circle cx="69" cy="43" r="1.8" fill="#d6eeec" opacity=".5"/>');
    // the sea out to the horizon, the moon's path on it
    s.path('M-10,128H310V214H-10Z', s.lin([[0, '#5e9a9c'], [0.12, '#2a6470'], [0.5, '#123c48'], [1, '#06171f']]));
    s.add('<path d="M-10,128.5H310" stroke="#d8f8f3" stroke-width=".8" opacity=".45"/>');
    s.add(glitter([[64, 131, 26, 0.5], [60, 135, 18, 0.4], [68, 140, 30, 0.32], [62, 146, 16, 0.24]], '#e8fcf8'));
    // the bank: rows of billows, each one lit along its top from the moon
    const row = (list) => U(puffs(list, 1.3), poly([...list.map(([x, y]) => [x, y]), [list[list.length - 1][0], 230], [340, 230], [340, list[0][1]]]));
    const rows = [
      [[[318, 0, 30], [278, -6, 26], [240, 2, 24], [206, 18, 22], [184, 40, 20], [166, 62, 18]], '#cfe6e4'],
      [[[318, 40, 30], [280, 44, 28], [244, 52, 26], [212, 64, 22], [188, 82, 20], [168, 100, 18], [152, 118, 16]], '#bcdad8'],
      [[[318, 90, 30], [278, 98, 28], [240, 106, 26], [206, 116, 22], [180, 128, 20], [158, 140, 18], [140, 152, 14]], '#a8cccc'],
    ];
    for (const [list, c] of rows) s.figure(`<path d="${row(list)}"/>`, { fill: c, rim: '#f6fffd', offsets: [[-0.9, -1], [0, -1.2]], rimOp: 0.9, shade: 0.35, light: [-0.6, -1] });
    // the shore: dark rocks, the beach
    s.path(ledge([[-10, 152], [30, 148], [70, 152], [110, 158], [160, 162], [220, 160], [310, 156]]), s.lin([[0, '#26464c'], [1, '#0a1c22']]));
    s.add('<g fill="none" stroke="#e9f8f2" stroke-linecap="round" opacity=".6"><path d="M18,149q10,-3 22,0M68,153q12,-3 24,0" stroke-width="1.2"/></g>');
    // sheets of fog drifting over the warriors running into it
    const sheet = (list) => U(puffs(list, 1.25), poly([[list[0][0], -30], [340, -30], [340, 230], [list[list.length - 1][0], 230], ...list.slice().reverse().map(([x, y]) => [x, y])]));
    const veil = (d, a) => {
      s.path(mv(d, -0.9, -1), '#f4fffd', `opacity="${f1(a * 0.5)}"`);
      s.path(d, s.lin([[0, '#d6ecea', a], [1, '#a2c8ca', a * 0.85]]));
    };
    // one charging warrior, facing right, feet on y = 0: round shield
    // before him, a spear or a raised sword
    const charger = (v) => U(
      taper([[-1, -30], [-9, -17], [-18, -6]], [6.4, 5.2, 4]), ell(-19.5, -4.4, 4.4, 2.2, 30),
      taper([[2, -30], [10, -19], [11, -3]], [6.4, 5.2, 4.2]), ell(13.4, -1.8, 4.6, 2),
      taper([[0, -30], [4, -44], [7, -56]], [11, 11, 12]),
      taper([[8, -58], [10, -62]], 4.4, { per: 2 }), ell(11.6, -66, 4.6, 5),
      v % 2 ? taper([[9, -70], [4, -75], [-3, -73]], [3, 3, 0.6]) : U(taper([[9, -69], [6, -74], [2, -76]], [2.4, 1.6, 0.4]), taper([[14, -69], [17, -74], [21, -75]], [2.4, 1.6, 0.4])),
      ell(17, -46, 7, 8.6),
      v % 2 ? U(taper([[3, -54], [-1, -64], [1, -74]], [4.4, 3.8, 3.2]), taper([[1, -76], [-6, -92]], [2.6, 0.6], { per: 2 }), taper([[-3, -75], [5, -77]], 1.6, { per: 2 }))
        : U(taper([[3, -54], [-4, -52], [-8, -48]], [4.4, 3.8, 3.4]), taper([[-18, -40], [40, -60]], [1.6, 1.4], { per: 2 }), lens(43, -61, 8, -19, 0.4, 3)),
    );
    const men = [[244, 151, 0.42], [218, 156, 0.5], [188, 163, 0.62], [150, 172, 0.78], [104, 184, 0.98], [52, 199, 1.2]];
    const man = (i) => { const [x, b, k] = men[i]; return at(x, b, k)(charger(i)); };
    s.path(man(0) + man(1), '#46747a', 'opacity=".55"');
    veil(sheet([[272, -16, 30], [256, 18, 28], [244, 50, 26], [236, 80, 24], [222, 102, 22], [212, 122, 20], [204, 140, 18], [196, 158, 16], [186, 172, 14]]), 0.6);
    s.path(man(2), '#24505a', 'opacity=".85"');
    veil(sheet([[284, -12, 30], [268, 22, 28], [254, 50, 26], [242, 74, 24], [230, 96, 22], [214, 116, 20], [202, 134, 20], [192, 150, 18], [182, 166, 16], [168, 178, 14], [150, 188, 12]]), 0.5);
    s.figure(`<path d="${man(3)}"/>`, { fill: '#10262e', rim: '#d8f6f1', offsets: [[-0.8, -0.8], [0, -1.1]], rimOp: 0.7 });
    veil(U(puffs([[300, 168, 24], [262, 176, 22], [226, 182, 20], [192, 188, 18], [160, 194, 16], [130, 198, 14], [104, 202, 12]], 1.4), poly([[104, 202], [300, 168], [340, 168], [340, 230], [100, 230]])), 0.55);
    s.figure(`<path d="${man(4)}"/><path d="${man(5)}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[-1, -0.8], [0, -1.2], [0.6, -0.8]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [-0.6, -1] });
    // the near rocks
    s.figure(`<path d="${U(blob([[-12, 214], [-10, 192], [6, 184], [22, 188], [30, 202], [34, 214]], 5), blob([[250, 214], [256, 196], [272, 188], [292, 190], [312, 200], [312, 214]], 5))}"/>`,
      { fill: '#04121a', rim: '#a6e4ec', offsets: [[-0.6, -1]], rimOp: 0.6 });
    // fog curling along the ground toward us
    s.fog(198, '#d8eeec', 0.3).fog(186, '#cfe8e6', 0.22);
    s.motes({ seed: 13402, n: 16, x: [100, 290], y: [20, 200], r: [0.5, 1.2], fill: '#e6fbf8', cls: 'drift', t: [6, 10], op: [0.3, 0.7] });
    return s.svg();
  },

  // UMBRAL. Grave Snare: in a misty graveyard under the moon a charging
  // knight's horse rears in terror; skeletal hands have burst out of the
  // earth to grip its hind legs, inside a ring of violet runes.
  'grave-snare'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.4, '#1f1734'], [0.66, '#44346a'], [0.76, '#4e3a74']]));
    s.add(particles({ seed: 13501, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(60, 40, 100, '#c9b8f2', 0.42);
    s.add('<circle cx="60" cy="40" r="15" fill="#ece4fa"/><circle cx="55" cy="36" r="3" fill="#d4c8ea" opacity=".6"/><circle cx="65" cy="45" r="2.2" fill="#d4c8ea" opacity=".5"/>');
    // the chapel and yews beyond, the rows of graves
    s.layer(ridge({ seed: 13502, base: 150, amp: 10, freq: 2 }) + 'M224,146V118L238,106L252,118V146ZM224,118V96L229,82L234,96V118Z' + U(ell(206, 132, 6, 16), ell(270, 130, 7, 18), ell(30, 132, 6, 16)), '#2c2246', { blur: 0.7 });
    s.add('<path d="M241,128V122A2,2 0 0 1 245,122V128Z" fill="#c9a6ff" opacity=".8"/>');
    s.haze(120, 152, '#6a5494', 0.32);
    s.path(ledge([[-10, 164], [60, 160], [130, 162], [200, 159], [260, 162], [310, 160]]), '#1d1530');
    s.add(`<g fill="#241b38">${slab(30, 166, 12, 18, -5)}${cross(70, 164, 22, 6)}${slab(224, 162, 13, 19, 4)}${cross(262, 164, 24, -7)}${slab(292, 162, 11, 15, 6)}</g>`);
    s.fog(162, '#9a86c4', 0.3);
    s.path(ledge([[-10, 188], [40, 184], [100, 187], [160, 189], [220, 186], [310, 188]]), s.lin([[0, '#1d1530'], [1, '#08060c']]));
    // the rune ring on the ground, cracks of light running out of it
    // (x, y come as text: +y + 2.4, not y + 2.4)
    const glyphs = [(x, y) => `M${x},${f1(+y + 2.4)}v-4.8M${x},${y}l-1.5,-2.2M${x},${y}l1.5,-2.2`, (x, y) => `M${x},${y - 2.4}l1.6,2.4l-1.6,2.4l-1.6,-2.4Z`,
      (x, y) => `M${x - 1.4},${y - 2.4}h2.8l-2.8,4.8h2.8Z`, (x, y) => `M${x - 1.7},${y}a1.7,1.7 0 1,0 3.4,0a1.7,1.7 0 1,0 -3.4,0`];
    let runes = '';
    for (let i = 0; i < 16; i++) {
      const a = rad(i * 22.5 + 11), x = 150 + Math.cos(a) * 64, y = 188 + Math.sin(a) * 10;
      runes += glyphs[i % 4](f1(x), f1(y));
    }
    const cracks = [jag(13504, 96, 190, 170, 30, 1.2, 4), jag(13505, 204, 190, 10, 30, 1.2, 4), jag(13506, 120, 196, 150, 20, 1, 3), jag(13507, 182, 196, 30, 22, 1, 3)].join('');
    // the horse, rearing, facing left: haunches planted, the body slanting
    // up to a high chest, forelegs folded, neck up and head forward, ears
    // pricked; a tail of loose hair. The knight leans into its neck, lance
    // couched, plume and cloak streaming.
    const steed = U(
      blob([[198, 116], [196, 108], [186, 102], [172, 94], [160, 84], [152, 74], [148, 62], [144, 50], [140, 42], [134, 38], [126, 40], [118, 44], [112, 49], [108, 54], [110, 58],
        [115, 59], [122, 56], [128, 56], [130, 62], [128, 72], [126, 82], [122, 92], [126, 102], [138, 112], [152, 124], [164, 136], [176, 142], [190, 140], [200, 130], [202, 122]], 4),
      taper([[138, 42], [141, 31]], [3.6, 0.6], { per: 2 }), taper([[133, 40], [133, 30]], [3, 0.5], { per: 2 }),
      [[146, 52], [149, 61], [151, 70], [154, 78]].map(([x, y], i) => taper([[x, y], [x + 8, y + 2], [x + 15, y + 7 + i]], [4.4, 3, 0.4], { per: 3 })),
      taper([[128, 96], [118, 98], [110, 98]], [11, 9, 7.4]), taper([[110, 98], [106, 106], [104, 114]], [6.4, 5.4, 4.8]), ell(104, 116, 3.6, 2.6, 70),
      taper([[134, 90], [124, 86], [116, 82]], [10, 8.4, 7]), taper([[116, 82], [111, 90], [110, 98]], [6, 5, 4.6]), ell(110, 100, 3.4, 2.4, 70),
      taper([[178, 140], [184, 152], [188, 164]], [16, 11, 8]), taper([[188, 164], [184, 174], [180, 182]], [6.6, 5.6, 5]), ell(178, 186, 5.4, 2.8),
      taper([[166, 138], [170, 152], [172, 166]], [14, 10, 7.4]), taper([[172, 166], [167, 176], [162, 183]], [6, 5, 4.6]), ell(160, 186.4, 5, 2.6),
      taper([[199, 117], [207, 128], [211, 142], [209, 158], [205, 172]], [3, 6, 8, 6, 1]), taper([[203, 123], [213, 136], [217, 152], [215, 166]], [2, 3, 3, 0.6]),
      taper([[205, 129], [209, 146], [203, 162], [199, 174]], [2, 3, 2.4, 0.5]),
      taper([[170, 90], [162, 100], [158, 108]], [10, 9, 7.4]), taper([[158, 108], [160, 116], [162, 122]], [6.4, 5.6, 5]), ell(164, 124, 4.4, 2.2),
      taper([[172, 90], [166, 78], [158, 66]], [14, 14, 16]),
      ell(153, 57, 5.6, 6.2), taper([[153, 51], [160, 46], [170, 45], [180, 50]], [3.6, 5, 4, 0.6]),
      taper([[160, 66], [176, 64], [192, 70], [204, 82]], [8, 12, 10, 1]),
      taper([[158, 70], [150, 74], [144, 72]], [5, 4.4, 4]),
      taper([[190, 84], [130, 60], [70, 36]], [3, 2.4, 1.2]), lens(66.4, 34.6, 9, 201.8, 0.36, 3),
      poly([[82, 40.8], [96, 46.4], [104, 54], [96, 52], [100, 60], [88, 50]]),
    );
    s.figure(`<path d="${steed}"/>`, { fill: '#0b0812', rim: '#cdb6f4', offsets: [[-1.1, -1], [0, -1.3], [1, -0.6]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [-0.6, -1] });
    s.add('<circle cx="125" cy="46" r="1.1" fill="#d6c2fa"/>');
    // the hands: bone, two gripping its hind legs, more clawing up round them
    const bones = (x, y, a, k, open = 0.5) => rot(at(x, y, k)(U(
      taper([[-1.4, 14], [-1.2, 0]], [1.6, 1.4], { per: 2 }), taper([[1.4, 14], [1.2, 0]], [1.6, 1.4], { per: 2 }),
      ell(0, -2, 3.4, 2.6),
      taper([[-3, -3], [-4 - 4 * open, -9], [-5 - 6 * open, -14]], [1.4, 1.1, 0.7]), taper([[-1, -4], [-1.4 - 2 * open, -11], [-2 - 3 * open, -17]], [1.4, 1.1, 0.7]),
      taper([[1, -4], [1.4 + 2 * open, -11], [2 + 3 * open, -17]], [1.4, 1.1, 0.7]), taper([[3, -3], [4 + 4 * open, -9], [5 + 6 * open, -14]], [1.3, 1, 0.6]),
      taper([[3.4, -1], [7, -3], [9, -7]], [1.4, 1.1, 0.7]),
    )), x, y, a);
    const grip = (x, y, k, dir) => at(x, y, k, dir)(U(
      taper([[-6, 16], [-4, 4]], [1.6, 1.4], { per: 2 }), taper([[-3, 16], [-1.6, 4]], [1.6, 1.4], { per: 2 }), ell(-3, 1.4, 3.4, 3),
      taper([[-1, -1], [3, -3], [6, -1.4], [7, 2]], [1.5, 1.4, 1.2, 0.8]), taper([[-1, 1.4], [3.6, 0.6], [6.6, 2.8], [7, 5.6]], [1.5, 1.4, 1.2, 0.8]),
      taper([[-1, 3.6], [3, 3.6], [5.6, 6], [5.4, 8.6]], [1.4, 1.3, 1.1, 0.7]), taper([[-5, -1], [-3, -4], [0, -5]], [1.3, 1.1, 0.6]),
    ));
    s.glow(150, 186, 78, '#a46bff', 0.42, 'breathe');
    const bone = s.linU(0, 150, 0, 196, [[0, '#f6f0ff'], [0.6, '#dccbf6'], [1, '#a98bd8']]);
    s.bloom(`<ellipse cx="150" cy="188" rx="64" ry="10" fill="none" stroke="#b98cff" stroke-width="1.1"/><ellipse cx="150" cy="188" rx="72" ry="12.6" fill="none" stroke="#b98cff" stroke-width=".6" opacity=".6"/>` +
      `<path d="${runes}" fill="none" stroke="#e2c8ff" stroke-width=".9" stroke-linecap="round"/><path d="${cracks}" fill="#c9a6ff"/>` +
      `<path d="${grip(175, 178, 1.15, 1) + grip(168, 180, 1.05, -1) + bones(124, 190, -18, 1.25, 0.6) + bones(198, 191, 16, 1.2, 0.8) + bones(140, 196, -4, 0.9, 0.3) + bones(104, 194, -30, 0.9, 1)}" fill="${bone}"/>`, { sd: 1.4, k: 1.45, box: [70, 140, 160, 70] });
    s.path(dots([[170, 190, 2.4], [182, 189, 1.8], [150, 191, 2], [161, 192, 1.4], [120, 196, 1.8], [196, 197, 1.6], [134, 198, 1.4]]), '#120c1e');
    // mist over everything, motes; dark stones at the near corners
    s.fog(184, '#9a86c8', 0.22).fog(200, '#8f7fc8', 0.3);
    s.add(`<g fill="#0a0710">${slab(14, 214, 22, 34, -6)}${cross(286, 214, 40, 5)}</g>`);
    s.motes({ seed: 13508, n: 16, x: [80, 230], y: [100, 196], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [5, 9], op: [0.35, 0.85] });
    return s.svg();
  },

  // EMBER. Backdraft: attackers storm the steps of a stone gate, the doors
  // give, and fire bursts back out of the arch into them; the nearest is a
  // black shape inside the blast, the rest reel back with shields up, and
  // smoke and embers pour up over the wall.
  backdraft(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#160404'], [0.36, '#3a0f08'], [0.62, '#6e2410'], [0.8, '#a4401a']]));
    s.add(smoke('#2a0906', [[60, 20, 90, 7, 0.45], [244, 30, 80, 6, 0.35]]));
    // the gate: a curtain wall between two towers, a round arch in it
    const outline = [[12, 214], [12, 40], ...battlement(12, 74, 40, 9, 6, 7), [74, 64], ...battlement(80, 220, 64, 9, 7, 7), [226, 64], [226, 40], ...battlement(226, 288, 40, 9, 6, 7), [288, 214]];
    const door = [[122, 178], [122, 124]];
    for (let i = 1; i < 18; i++) door.push(toward(150, 124, 180 + (180 * i) / 18, 28));
    door.push([178, 124], [178, 178]);
    s.glow(150, 140, 200, '#ff7a2e', 0.5);
    s.path(poly(outline) + poly(door), s.lin([[0, '#2a0e08'], [1, '#160604']]), 'fill-rule="evenodd"');
    s.path(poly(outline) + poly(door), 'none', 'stroke="#ff9447" stroke-width=".8" opacity=".5"');
    // its stones, lit by the fire nearest the arch
    let mortar = '';
    const Rm = rng(13601);
    for (let y = 76, row = 0; y < 196; y += 12, row++) {
      mortar += `M12,${y}H288`;
      for (let x = 12 + (row % 2 ? 9 : 18) + Rm() * 4; x < 288; x += 18 + Rm() * 6) mortar += `M${f1(x)},${y}V${y + 12}`;
    }
    mortar += 'M74,64V214M226,64V214M12,52H74M226,52H288';
    s.add(`<path d="${mortar}" fill="none" stroke="#0c0302" stroke-width="1.2" opacity=".85"/>`);
    s.add(`<rect x="0" y="0" width="${W}" height="${H}" fill="${s.radU(150, 140, 110, [[0, '#ff8a3a', 0.55], [0.5, '#ff6a1f', 0.2], [1, '#ff6a1f', 0]])}" style="mix-blend-mode:screen"/>`);
    // the voussoirs round the arch
    let vous = '';
    for (let i = 0; i <= 9; i++) { const a = 180 + 20 * i, [x1, y1] = toward(150, 124, a, 28), [x2, y2] = toward(150, 124, a, 40); vous += `M${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}`; }
    const outer = [];
    for (let i = 0; i <= 18; i++) outer.push(toward(150, 124, 180 + 10 * i, 40));
    vous += 'M' + outer.map(pt).join('L');
    s.add(`<path d="${vous}" fill="none" stroke="#ffb04a" stroke-width="1.2" opacity=".7"/>`);
    // the steps up to it
    s.path('M114,178H186V184H114ZM104,184H196V190H104ZM92,190H208V196H92Z', '#2a0e08');
    s.add('<path d="M114,178H186M104,184H196M92,190H208" stroke="#ffb04a" stroke-width="1" opacity=".7"/>');
    s.path(ledge([[-10, 196], [60, 194], [150, 196], [240, 194], [310, 196]]), s.lin([[0, '#1e0806'], [1, '#080202']]));
    // the blast: white-hot in the arch, tongues of fire bursting out of it
    // in every direction and rolling up the wall
    s.path(poly(door), s.radU(150, 150, 40, [[0, '#ffffff'], [0.4, '#fff3c8'], [1, '#ffb04a']]));
    const fire = s.radU(150, 146, 150, [[0, '#ffffff'], [0.12, '#fff3c8'], [0.36, '#ffb04a', 0.95], [0.7, '#ff6a1f', 0.8], [1, '#c23a14', 0.3]]);
    const tongues = [
      plume(150, 120, -92, -86, 90, [26, 30, 24, 14, 6, 0.5]), plume(136, 126, -120, -150, 96, [20, 26, 20, 12, 4, 0.5]), plume(164, 126, -60, -30, 96, [20, 26, 20, 12, 4, 0.5]),
      plume(128, 146, -170, -200, 100, [18, 24, 18, 10, 4, 0.5]), plume(172, 146, -10, 20, 100, [18, 24, 18, 10, 4, 0.5]),
      plume(134, 166, 160, 200, 96, [18, 22, 16, 8, 0.5]), plume(166, 166, 20, -20, 96, [18, 22, 16, 8, 0.5]),
      plume(144, 170, 120, 150, 70, [16, 20, 14, 6, 0.5]), plume(156, 170, 60, 30, 70, [16, 20, 14, 6, 0.5]),
      plume(120, 112, -140, -110, 60, [10, 12, 8, 3, 0.4]), plume(180, 112, -40, -70, 60, [10, 12, 8, 3, 0.4]),
    ].join('');
    const core = [plume(150, 140, -92, -90, 50, [20, 18, 10, 0.5]), plume(144, 150, -160, -190, 50, [16, 12, 6, 0.4]), plume(156, 150, -20, 10, 50, [16, 12, 6, 0.4])].join('');
    s.bloom(`<path d="${tongues}" fill="${fire}"/><path d="${core}" fill="#fff6dc" opacity=".9"/>`, { sd: 2.2, k: 1.4 });
    // smoke billowing up off it
    const R = rng(13602);
    const billow = [];
    for (let i = 0; i < 9; i++) billow.push([150 + (R() - 0.5) * 60, 30 - i * 2 + R() * 10, 14 + R() * 14]);
    s.add(`<g class="drift">${billow.map(([x, y, r]) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 1.3)}" ry="${f1(r)}" fill="${s.rad([[0, '#3a120a', 0.9], [0.7, '#2a0a06', 0.6], [1, '#2a0a06', 0]])}"/>`).join('')}</g>`);
    // the attackers (each drawn facing the gate, to the right, feet on
    // y = 0): one caught in the arch with his arms flung up; two braced
    // behind their raised shields; one kneeling behind his; one turning
    // away with an arm over his face
    const caught = at(150, 178, 0.62)(U(
      taper([[-3, -30], [-6, -16], [-9, -2]], [7, 6, 5]), taper([[3, -30], [6, -16], [9, -2]], [7, 6, 5]),
      taper([[0, -28], [0, -44], [0, -56]], [12, 14, 17]), ell(0, -63, 5, 5.6), poly([[-5.4, -63], [0, -73], [5.4, -63]]),
      taper([[-7, -54], [-16, -66], [-20, -80]], [5, 4.4, 3.6]), taper([[7, -54], [16, -66], [20, -80]], [5, 4.4, 3.6]),
    ));
    const helm = (x, y) => U(ell(x, y, 4.8, 5.2, 0, 16), poly([[x - 5.4, y + 0.6], [x, y - 9.6], [x + 5.4, y + 0.6]]), taper([[x + 3.6, y - 1], [x + 5, y + 5]], [1.6, 1], { per: 2 }));
    const brace = U(
      taper([[-4, -28], [-14, -16], [-22, -2]], [8, 7, 6]), ell(-23, -1.4, 5.6, 2.2), taper([[4, -28], [12, -18], [10, -2]], [8, 7, 6]), ell(13, -1.4, 5.6, 2.2),
      taper([[0, -28], [-5, -42], [-10, -54]], [13, 13, 15]), helm(-7, -60),
      taper([[-4, -50], [4, -54], [9, -56]], [5, 4.4, 4]), ell(13, -56, 7.4, 13, 6),
      taper([[-10, -50], [-20, -46], [-27, -40]], [4.6, 4, 3.4]), taper([[-27, -40], [-38, -30]], [2.6, 0.6], { per: 2 }),
      taper([[-8, -53], [-20, -51], [-32, -45], [-42, -36]], [6, 9, 7, 1]),
    );
    const kneel = U(
      taper([[-2, -18], [-12, -10], [-14, -1]], [8, 7, 6]), taper([[-14, -1], [-24, -1]], [5, 4], { per: 2 }), taper([[3, -18], [11, -14], [11, -2]], [8, 7, 6]), ell(14, -1.2, 5, 2),
      taper([[0, -18], [2, -30], [3, -40]], [12, 13, 13]), helm(4, -46),
      ell(15, -30, 9, 15, 4), taper([[-2, -36], [-10, -30], [-16, -26]], [4.4, 3.8, 3.2]),
    );
    const turn = U(
      taper([[-2, -28], [-10, -16], [-14, -2]], [8, 7, 6]), ell(-17, -1.4, 5.6, 2.2), taper([[4, -28], [10, -16], [16, -4]], [8, 7, 6]), ell(18, -2, 5, 2.2, 20),
      taper([[0, -28], [-6, -42], [-12, -54]], [13, 13, 15]), helm(-14, -60), taper([[-14, -69], [-21, -73], [-28, -71]], [3, 2.4, 0.5]),
      taper([[-6, -52], [0, -61], [6, -66]], [5, 4.4, 4]), ell(7.6, -67, 3, 2.6),
      taper([[-10, -50], [-22, -48], [-32, -50]], [4.6, 4, 3.4]),
      taper([[-8, -54], [-22, -54], [-34, -48], [-44, -40]], [6, 10, 8, 1]),
    );
    const crew = U(
      at(62, 206, 1.14, 1)(brace), at(242, 206, 1.1, -1)(turn),
      at(104, 195, 0.86, 1)(kneel), at(200, 196, 0.84, -1)(brace),
    );
    s.figure(`<path d="${crew}"/>`, { fill: p.fig, rim: '#ffb04a', offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [0, -1] });
    s.path(caught, '#120504');
    s.motes({ seed: 13603, n: 34, x: [40, 260], y: [10, 190], r: [0.4, 1.3], fill: '#ffc25a', hot: '#fff6d8', cls: 'rise', t: [3, 7] });
    s.motes({ seed: 13604, n: 12, x: [0, 300], y: [20, 200], r: [0.4, 1], fill: '#ff8a3a', cls: 'rise', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },
  // ── GLASS CANNONS AND SHIELDS ─────────────────────────────────────

  // RADIANT. Sunglass Lancer: at dawn a lancer in thin mirrored armour
  // gallops across the field, a lance of pure sunlight couched under his
  // arm; his armour throws back the sky and the line of the dawn, and where
  // the lance's light falls on it, it is already cracking like glass,
  // splinters flying off behind him.
  'sunglass-lancer'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#232c4c'], [0.34, '#4c5880'], [0.62, '#b8a28c'], [0.8, '#f0c88e'], [1, '#e6a468']]));
    s.add(particles({ seed: 13701, n: 14, x: [0, W], y: [0, 60], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun just up, behind him
    const sx = 40, sy = 150;
    s.glow(sx, sy, 170, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 14, from: -96, to: 4, len: 330, spread: 2, color: '#fff6dc', op: 0.2, seed: 13702 });
    s.glow(sx, sy, 40, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="11" fill="#fff8e6"/>`);
    // the far field, a banner on the ridge
    s.layer(ridge({ seed: 13703, base: 168, amp: 14, freq: 2.2 }) + 'M236,162L238,134L239.4,134L237.6,162ZM238.6,135L252,138L246,142L251,147L238.4,145Z', '#9a8a82', { blur: 0.7 });
    s.haze(148, 174, '#f2c690', 0.34);
    s.path(ledge([[-10, 186], [60, 184], [150, 188], [230, 185], [310, 187]]), s.lin([[0, '#3e2e22'], [1, '#160f0a']]));
    // the dust his horse throws up behind them
    s.add(`<g class="drift">${[[24, 180, 24, 8], [48, 186, 16, 5], [6, 188, 14, 5]].map(([x, y, rx, ry]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${s.rad([[0, '#ecd0a2', 0.5], [1, '#ecd0a2', 0]])}"/>`).join('')}</g>`);
    // the horse at full stretch (drawn facing right, hooves on y = 0)
    const horse = U(
      blob([[-34, -44], [-26, -49], [-8, -47], [10, -50], [18, -55], [25, -62], [31, -68], [36, -70], [42, -66], [49, -60], [53, -54], [51, -50], [46, -50],
        [40, -53], [34, -53], [28, -46], [22, -38], [16, -30], [0, -28], [-16, -30], [-26, -32], [-35, -37], [-38, -42]], 4),
      taper([[34, -70], [35, -76]], [3, 0.6], { per: 2 }), taper([[31, -69], [30, -75]], [2.6, 0.5], { per: 2 }),
      [[30, -66], [24, -60], [18, -55]].map(([x, y], i) => taper([[x, y], [x - 8, y - 3], [x - 15, y - 2 + i]], [4.4, 3, 0.4], { per: 3 })),
      taper([[16, -32], [26, -24], [36, -17], [43, -12]], [8.4, 6.4, 4.8, 4]), ell(45.4, -11, 3.6, 2.4, 30),
      taper([[10, -30], [15, -18], [9, -10], [5, -6]], [7.6, 5.6, 4.4, 4]), ell(3.6, -4.6, 3.6, 2.2, -20),
      taper([[-26, -34], [-37, -24], [-47, -17], [-55, -13]], [10, 7, 5, 4.4]), ell(-57.6, -12.4, 3.6, 2.4, -20),
      taper([[-18, -32], [-15, -20], [-21, -10], [-25, -4]], [9, 6, 4.6, 4]), ell(-26, -2.6, 3.8, 2.4),
      taper([[-35, -44], [-46, -46], [-58, -43], [-68, -38]], [3, 6, 5, 0.6]),
    );
    // the rider, crouched forward into the charge: a crested helm with a
    // short plume streaming off its back, a round pauldron, the lance arm
    // tucked to his side and the rein hand forward
    const rider = U(
      taper([[2, -48], [10, -42], [8, -33]], [8, 7, 5.6]), ell(9.6, -31.4, 3.6, 2, 20),
      taper([[0, -49], [5, -60], [10, -70]], [13, 13, 14]),
      taper([[11, -72], [13, -76]], 4.6, { per: 2 }), ell(15, -80.6, 5.6, 6), poly([[10.6, -84.6], [13.6, -91], [19.6, -84.6]]),
      taper([[11, -86], [5, -87.4], [-2, -85.6], [-8, -82]], [3.4, 3.6, 2.4, 0.5]),
      ell(9, -66, 6.4, 5.2, -20),
      taper([[10, -68], [17, -63], [22, -61]], [5, 4.4, 4]),
      taper([[12, -66], [20, -58], [28, -56]], [4, 3.4, 3]),
    );
    const K = 1.2, X = 116, Y = 188, place = at(X, Y, K);
    s.figure(`<path d="${place(horse)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.6], [-0.4, -1.2]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [-1, -0.4] });
    // his armour is a mirror: the night sky above in it, the dark field
    // below, and between them the bright line of the dawn
    s.figure(`<path d="${place(rider)}"/>`, { fill: s.linU(0, Y - 90 * K, 0, Y - 30 * K, [[0, '#161c34'], [0.3, '#2c3860'], [0.42, '#8a96bc'], [0.47, '#fff4d8'], [0.52, '#e6ae6c'], [0.62, '#4a3222'], [1, '#1a120c']]),
      rim: '#fff6dc', offsets: [[-1.2, -0.6], [-0.4, -1.2], [0.8, -0.8]], rimOp: 0.95 });
    // the lance of sunlight, couched under his arm; the armour cracking like
    // glass where its light falls, splinters of it breaking off behind
    const beam = [[X, Y - 59 * K], [X + 22 * K, Y - 61 * K], [288, 100]];
    s.add(`<ellipse cx="215" cy="107" rx="84" ry="9" transform="rotate(-5.8 215 107)" fill="${s.rad([[0, '#fff6dc', 0.5], [0.6, '#ffe6a0', 0.2], [1, '#ffe6a0', 0]])}"/>`);
    s.glow(beam[1][0] + 6, beam[1][1] - 1, 26, '#fff4cc', 0.7, 'breathe');
    const [hx, hy] = place('M14,-64').slice(1).split(',').map(Number);
    const cracks = [jag(13704, hx, hy, -170, 22, 1.8, 4, 60), jag(13705, hx, hy, -120, 20, 1.7, 4, 60), jag(13706, hx, hy, 150, 18, 1.6, 4, 60),
      jag(13707, hx - 4, hy - 8, -150, 16, 1.4, 3, 60), jag(13708, hx - 2, hy - 20, 180, 12, 1.2, 3, 60), jag(13709, hx - 6, hy + 8, 170, 14, 1.3, 3, 60)].join('');
    const R = rng(13710), shards = [];
    for (let i = 0; i < 14; i++) {
      const x = 62 + R() * 54, y = 74 + R() * 44, z = 2.2 + R() * 3.4 * (1 - (116 - x) / 90);
      shards.push(rot(poly([[x, y - z], [x + z * 0.8, y + z * 0.5], [x - z * 0.6, y + z * 0.7]]), x, y, R() * 360));
    }
    s.bloom(`<path d="${taper(beam, [9, 13, 2])}" fill="#ffe6a0" opacity=".45"/><path d="${taper(beam, [3.4, 5, 0.6])}" fill="#fffdf2"/>` +
      `<path d="${glint(286, 100.2, 10, 0.14)}" fill="#ffffff"/>` +
      `<path d="${cracks}" fill="#ffffff"/><path d="${shards.join('')}" fill="#dff4ff" stroke="#ffffff" stroke-width=".5" opacity=".9"/>`, { sd: 1.4, k: 1.45, box: [50, 50, 250, 100] });
    s.motes({ seed: 13711, n: 16, x: [30, 290], y: [40, 180], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. Prism Duelist: high over the sea a slender sylph on long
  // dragonfly wings lunges with a rapier of light, inside a shimmering
  // bubble (her Shield); where the light passes out through its skin it
  // breaks into rainbows.
  'prism-duelist'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#5e9ea4'], [0.3, '#3a7c88'], [0.62, '#1e5464'], [0.72, '#1a4c5c']]));
    s.glow(150, -20, 190, '#e6fbf8', 0.6);
    s.shafts({ cx: 150, cy: -40, n: 10, from: 60, to: 120, len: 280, spread: 2.4, color: '#e9fcf6', op: 0.22, seed: 13801, sd: 2.4 });
    s.add(`<g fill="#e6faf6">${[[50, 34, 70, 5, 0.22], [256, 24, 80, 6, 0.2], [250, 128, 56, 4, 0.16], [36, 122, 50, 4, 0.16]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    // the sea far below, the bubble's light lying on it
    s.path('M-10,154H310V214H-10Z', s.lin([[0, '#6aaeae'], [0.12, '#2c6e7a'], [0.5, '#123e4a'], [1, '#06171f']]));
    s.add('<path d="M-10,154.5H310" stroke="#d8f8f3" stroke-width=".8" opacity=".45"/>');
    s.add(glitter([[150, 158, 40, 0.5], [146, 163, 30, 0.42], [154, 169, 50, 0.34], [148, 176, 36, 0.28], [152, 185, 54, 0.22], [150, 196, 40, 0.18]], '#e8fcf8'));
    s.add('<g fill="none" stroke="#d8f6f1" stroke-width="1" stroke-linecap="round" opacity=".45"><path d="M40,168q10,-3 20,0M236,164q12,-3 24,0M70,188q12,-4 24,0M210,186q12,-4 26,0M20,202q14,-4 28,0M262,204q14,-4 28,0"/></g>');
    const bx = 150, by = 92, br = 58;
    s.glow(bx, by, 100, '#c6f4f6', 0.45);
    // her wings: two pairs of long glassy dragonfly wings
    const fx = 146, fy = 106, K = 1.1, place = at(fx, fy, K);
    const wl = [[-160, 46], [-138, 40], [172, 36], [150, 30]];
    const wings = place(U(wl.map(([a, l]) => leafAt(-1, -18, a, l, 0.2, 4))));
    s.path(wings, '#e6fbf8', 'opacity=".4"');
    s.add(`<path d="${wings}" fill="none" stroke="#c6f4f6" stroke-width=".6" opacity=".8"/>` +
      `<path d="${place(wl.map(([a, l]) => { const [x, y] = toward(-1, -18, a, l * 0.9); return `M-1,-18L${f1(x)},${f1(y)}`; }).join(''))}" stroke="#c6f4f6" stroke-width=".5" opacity=".7"/>`);
    // the duelist: a lunge, her sword arm out straight, the other curled up
    // behind her head, hair tied back and streaming
    const duel = place(U(
      taper([[-1, 0], [-12, 9], [-24, 16]], [5.6, 4.6, 3.6]), taper([[-24, 16], [-29, 18]], [3.4, 1.4], { per: 2 }),
      taper([[1, 0], [10, 8], [13, 18]], [5.6, 4.8, 3.8]), taper([[13, 18], [12, 26]], [3.6, 2.6], { per: 2 }), ell(14, 27, 3.4, 1.4),
      blob([[-5, -2], [6, -2], [9, 6], [3, 5], [-3, 6], [-8, 5]], 3),
      taper([[0, 0], [2, -11], [4, -21]], [8.4, 8.4, 10.4]),
      taper([[5, -23], [6, -27]], 3.4, { per: 2 }), ell(7.4, -31, 4.2, 4.8, 10),
      taper([[4, -34], [-2, -36], [-10, -35], [-17, -31]], [5, 4.4, 2.6, 0.4]),
      taper([[6, -20], [18, -21], [30, -23]], [3.6, 3, 2.6]), ell(32, -23.4, 2.2, 2),
      taper([[1, -20], [-8, -24], [-12, -32]], [3.4, 2.8, 2.4]), taper([[-12, -32], [-10, -38]], [2.2, 1.4], { per: 2 }),
      ell(34.4, -23.6, 2.6, 3),
    ));
    s.figure(`<path d="${duel}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    // the bubble round her: Shield light, a sheen of colour in its skin
    const rim = shieldLight(s, bx, by, br, br, { light: -130 });
    const arcAt = (r, a0, a1) => { const pts = []; for (let i = 0; i <= 14; i++) { const a = rad(a0 + ((a1 - a0) * i) / 14); pts.push([bx + Math.cos(a) * r, by + Math.sin(a) * r]); } return 'M' + pts.map(pt).join('L'); };
    s.add([['#ff9ac2', 0.97, -74, -24], ['#9af0ff', 0.9, -64, -14], ['#fff09a', 0.86, 146, 196], ['#c8a6ff', 0.95, 156, 206]].map(([c, k, a0, a1]) =>
      `<path d="${arcAt(br * k, a0, a1)}" fill="none" stroke="${c}" stroke-width="1.2" opacity=".4" stroke-linecap="round"/>`).join(''));
    // her rapier of light, its point at the skin; the light breaking into a
    // fan of colours beyond it, and a rainbow off the bubble's foot
    const hand = [fx + 34.4 * K, fy - 23.6 * K], tipP = [206, 77];
    const spectrum = ['#ff6a6a', '#ffb24a', '#fff06a', '#7cf09a', '#6ad0ff', '#a07aff'];
    s.add(spectrum.map((c, i) => `<path d="${taper([tipP, toward(tipP[0], tipP[1], -16 + i * 4.4, 58 + i * 3)], [0.6, 4])}" fill="${c}" opacity=".42"/>`).join('') +
      spectrum.map((c, i) => `<path d="${arcAt(br + 5 + i * 1.6, 100, 160)}" fill="none" stroke="${c}" stroke-width="1.6" opacity=".36"/>`).join(''));
    s.glow(tipP[0], tipP[1], 14, '#ffffff', 0.7, 'breathe');
    s.bloom(rim + `<path d="${taper([hand, tipP], [1.6, 0.4])}" fill="#ffffff"/><path d="${glint(tipP[0], tipP[1], 8, 0.16)}" fill="#ffffff"/>`, { sd: 1.4, k: 1.4, box: [80, 24, 200, 140] });
    s.motes({ seed: 13802, n: 14, x: [60, 260], y: [30, 160], r: [0.4, 1], fill: p.glow, hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // RADIANT. Aegis Acolyte: at dawn on a hillside a young acolyte raises
  // both hands, and a dome of glassy light (a Shield) forms over the knight
  // kneeling before her; threads of light run from her hands to it, and its
  // last panes are still flying into place.
  'aegis-acolyte'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#26304f'], [0.34, '#4f5d84'], [0.62, '#bca48c'], [0.8, '#f0c98e'], [1, '#e8a868']]));
    s.add(particles({ seed: 13901, n: 14, x: [0, W], y: [0, 60], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun low behind the knight
    const sx = 246, sy = 164;
    s.glow(sx, sy, 170, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 14, from: -178, to: -70, len: 330, spread: 2, color: '#fff6dc', op: 0.2, seed: 13902 });
    s.glow(sx, sy, 40, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="11" fill="#fff8e6"/>`);
    s.layer(ridge({ seed: 13903, base: 170, amp: 16, freq: 2.2 }), '#9a8a82', { blur: 0.7 });
    s.haze(150, 176, '#f2c690', 0.34);
    s.path(ledge([[-10, 194], [40, 190], [100, 189], [160, 191], [220, 189], [310, 192]]), s.lin([[0, '#3a2c22'], [1, '#160f0a']]));
    // the knight, kneeling, both hands on his planted sword, head bowed
    // (drawn facing right, then turned to face her)
    const knight = U(
      taper([[0, -26], [-6, -12], [-8, -3]], [10, 9, 8]), taper([[-8, -3], [-16, -2], [-24, -2]], [7, 6, 5]),
      taper([[2, -26], [10, -24], [16, -22]], [10, 9, 8]), taper([[16, -22], [16, -12], [17, -2]], [7.4, 6.4, 5.6]), ell(20, -1.4, 5, 2),
      taper([[0, -26], [2, -40], [4, -52]], [14, 14, 16]),
      ell(-3, -50, 6, 4.6, -20), ell(10, -50, 6, 4.6, 20),
      taper([[5, -54], [7, -57]], 5, { per: 2 }), ell(9, -61, 5, 5.6, 20),
      taper([[8, -66], [2, -68], [-6, -64]], [3, 3.4, 0.6]),
      taper([[8, -50], [15, -45], [20, -42]], [5, 4.4, 4]), taper([[2, -49], [11, -45], [19, -43]], [5, 4.4, 4]),
      taper([[16, -38.6], [26, -38.6]], 2.2, { per: 2 }), taper([[21, -46], [21, -38]], 2.6, { per: 2 }), taper([[21, -38], [21, 0]], [2.8, 0.6], { per: 2 }),
      blob([[-2, -54], [-12, -46], [-18, -30], [-22, -12], [-28, -1], [-10, -1], [-6, -18], [-4, -36]], 4),
    );
    s.figure(`<path d="${at(200, 191, 1, -1)(knight)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.6], [0.4, -1.2]], rimOp: 0.9, shade: 0.45, light: [1, -0.5] });
    // the acolyte: a slight girl in a long robe that flares and trails
    // behind her, her face tipped up to it, both arms reaching out to it,
    // her wide sleeves falling back from them, her hair loose down her back
    const place = at(84, 191, 1.1);
    const her = U(
      blob([[-5, -58], [5, -58], [7, -44], [9, -28], [13, -12], [17, -2], [20, 0], [-14, 0], [-22, 1], [-30, 0], [-22, -6], [-14, -16], [-9, -32], [-7, -46]], 4),
      taper([[0, -56], [1, -61]], 4.2, { per: 2 }),
      profile(3, -67, 0.82, -24),
      taper([[-1, -71], [-5, -67], [-7, -59], [-8, -51], [-9, -45]], [7, 7, 5.6, 3.4, 0.8]),
      taper([[3, -54], [12, -62], [21, -70]], [4, 3.4, 2.8]), ell(23.4, -72, 2.4, 2, -40),
      taper([[-1, -54], [8, -66], [16, -76]], [4, 3.4, 2.8]), ell(18, -78.4, 2.2, 2, -50),
      taper([[13, -63], [9, -56], [6, -48]], [2, 7, 0.6]), taper([[9, -68], [4, -60], [1, -52]], [2, 7, 0.6]),
    );
    s.figure(`<path d="${place(her)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.6], [0.4, -1.2], [-0.6, -1]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.8, -0.6] });
    s.path(place('M-5,-57.4Q0,-54 5.4,-57.4L6.4,-50Q0,-46 -6,-50Z'), s.lin([[0, '#efe4c8'], [1, '#b0a080']]));
    // the dome forming over him
    const dx = 198, dy = 191, drx = 54, dry = 76;
    s.glow(dx, dy - 40, 76, '#fff3cc', 0.45, 'breathe');
    const rim = shieldLight(s, dx, dy, drx, dry, { dome: true, light: -140 });
    // threads of light from her hands to it, its last panes flying in
    const dp = (a, out = 0) => {
      const c = Math.cos(rad(a)), sn = Math.sin(rad(a)), nx = c / drx, ny = sn / dry, nl = Math.hypot(nx, ny);
      return [dx + c * drx + (nx / nl) * out, dy + sn * dry + (ny / nl) * out];
    };
    const hands = [place('M23.4,-72'), place('M18,-78.4')].map((m) => m.slice(1).split(',').map(Number));
    const threads = [[hands[0], [146, 82], dp(-112)], [hands[1], [128, 70], dp(-90)], [hands[0], [136, 112], dp(-146)]].map(([a, c, b]) => `M${pt(a)}Q${pt(c)} ${pt(b)}`).join('');
    const panes = [[-58, 12], [-44, 20], [-30, 10], [-68, 24]].map(([a, d]) => {
      const [x, y] = dp(a, d), [x2, y2] = dp(a + 3, d), t = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
      return rot(poly([[x - 5, y - 1.6], [x + 5, y - 1.6], [x + 4, y + 1.6], [x - 4, y + 1.6]]), x, y, t);
    }).join('');
    s.bloom(rim + `<path d="${threads}" fill="none" stroke="#fff4d0" stroke-width="1.1" stroke-linecap="round" opacity=".85"/>` +
      `<path d="${panes}" fill="#e6fffd" stroke="#ffffff" stroke-width=".6" opacity=".8"/>` +
      `<path d="${dots(hands.map(([x, y]) => [x, y - 2, 2]))}" fill="#fff6dc"/>`, { sd: 1.4, k: 1.45, box: [70, 50, 200, 150] });
    s.motes({ seed: 13904, n: 18, x: [90, 260], y: [60, 190], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [4, 8], op: [0.5, 1] });
    return s.svg();
  },

  // RADIANT. Ward of Dawn: a huge black claw comes down out of the storm on
  // a soldier, and a dome of dawn light snaps into place over him just in
  // time; sparks burst where the talons strike the glass, and a ring of
  // light runs out over the ground from its foot.
  'ward-of-dawn'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#1a1e36'], [0.36, '#3a4064'], [0.64, '#9a8682'], [0.82, '#e4b47e'], [1, '#d89460']]));
    s.add(particles({ seed: 14001, n: 12, x: [0, 180], y: [0, 70], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the dawn behind, and the storm cloud the claw comes out of
    s.glow(110, 176, 150, '#ffd9a0', 0.55);
    s.figure(`<path d="${puffs([[270, -10, 44], [312, 30, 30], [226, -14, 30], [292, 66, 22], [250, 30, 26]], 1.3)}"/>`,
      { fill: '#1a1a2c', rim: '#ffd9a0', offsets: [[-1, 1], [-1.2, 0]], rimOp: 0.6, shade: 0.4, light: [-1, 0.6] });
    s.layer(ridge({ seed: 14002, base: 172, amp: 14, freq: 2.3 }), '#8a7a7a', { blur: 0.7 });
    s.haze(152, 178, '#f2c690', 0.32);
    s.path(ledge([[-10, 188], [60, 186], [150, 190], [240, 186], [310, 188]]), s.lin([[0, '#3a2c22'], [1, '#160f0a']]));
    // the soldier, crouched under it, sword up, his other arm over his head
    const soldier = U(
      taper([[-4, -22], [-12, -12], [-16, -2]], [9, 8, 7]), ell(-18, -1.4, 5.4, 2.2),
      taper([[4, -22], [12, -16], [12, -2]], [9, 8, 7]), ell(15, -1.4, 5.4, 2.2),
      taper([[0, -22], [2, -34], [2, -44]], [13, 13, 14]),
      ell(4, -51, 5, 5.4, 0, 16), taper([[3, -56], [-3, -58], [-9, -55]], [2.6, 2.6, 0.5]),
      taper([[6, -40], [14, -50], [18, -58]], [5, 4.4, 3.8]), taper([[15, -58], [23, -58]], 1.8, { per: 2 }), taper([[19, -58], [24, -72]], [2.6, 0.5], { per: 2 }),
      taper([[-2, -40], [-10, -48], [-12, -56]], [5, 4.4, 3.8]), ell(-12, -58, 2.4, 2.2),
    );
    s.figure(`<path d="${at(144, 190, 1)(soldier)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1, -0.8], [0, -1.2], [1, -0.6]], rimOp: 0.9, shade: 0.4, light: [0, -1] });
    // the dome, just snapped shut over him
    const dx = 150, dy = 190, drx = 66, dry = 80;
    s.glow(dx, dy - 40, 84, '#fff3cc', 0.5);
    const rim = shieldLight(s, dx, dy, drx, dry, { dome: true, light: -145 });
    // the claw: a spined, scaled arm out of the cloud, its talons hooked on
    // the glass
    const dp = (a) => [dx + Math.cos(rad(a)) * drx, dy + Math.sin(rad(a)) * dry];
    const tips = [-76, -60, -45, -30].map((a) => dp(a));
    const claw = U(
      taper([[330, -30], [280, 14], [230, 58]], [46, 40, 32]),
      [[318, -4], [298, 12], [278, 28], [258, 44]].map(([x, y]) => poly([[x - 6, y - 4], [x - 2, y - 14], [x + 4, y - 4]])),
      blob([[230, 52], [238, 68], [232, 86], [216, 98], [198, 96], [190, 86], [196, 72], [212, 58]], 4),
      taper([[198, 80], [186, 84], [176, 92]], [9, 8, 7]), taper([[176, 92], [170, 100], tips[0]], [6, 4, 0.6]),
      taper([[202, 90], [194, 98], [188, 104]], [9, 8, 7]), taper([[188, 104], [185, 112], tips[1]], [6, 4, 0.6]),
      taper([[212, 96], [208, 106], [204, 114]], [9, 8, 7]), taper([[204, 114], [200, 124], tips[2]], [6, 4, 0.6]),
      taper([[228, 86], [228, 104], [222, 120]], [10, 8, 7]), taper([[222, 120], [214, 136], tips[3]], [6, 4, 0.6]),
    );
    s.figure(`<path d="${claw}"/>`, { fill: '#120e0c', rim: '#e8fbff', offsets: [[-0.9, 0.9], [0, 1.2]], rimOp: 0.85, shade: 0.4, light: [-0.6, 0.8] });
    s.add('<g fill="none" stroke="#3a3040" stroke-width=".9" opacity=".8"><path d="M292,4q6,6 12,2M276,18q6,6 12,2M262,32q6,6 12,2M248,46q6,6 12,2M300,24q6,6 12,2M284,38q6,6 12,2"/></g>');
    // sparks where the talons strike, the ring of light at the dome's foot
    const R = rng(14003), sparks = [];
    for (const [x, y] of tips) for (let i = 0; i < 6; i++) { const a = rad(R() * 360), d = 4 + R() * 14; sparks.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, 0.5 + R() * 0.8]); }
    for (const [x, y] of tips) s.glow(x, y, 14, '#ffffff', 0.7, 'breathe');
    s.bloom(rim + `<path d="${tips.map(([x, y], i) => glint(x, y, i % 2 ? 7 : 10, 0.14)).join('')}" fill="#ffffff"/><path d="${dots(sparks)}" fill="#fff4cc"/>` +
      `<ellipse cx="${dx}" cy="${dy}" rx="${drx + 6}" ry="6" fill="none" stroke="#fff6dc" stroke-width="1.2"/>` +
      `<ellipse cx="${dx}" cy="${dy + 1}" rx="${drx + 26}" ry="9" fill="none" stroke="#ffe6a0" stroke-width=".8" opacity=".5"/>`, { sd: 1.4, k: 1.5, box: [50, 70, 210, 140] });
    s.motes({ seed: 14004, n: 16, x: [60, 260], y: [60, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // RADIANT. Shieldwright: in her forge a stout dwarf smith, hammer raised
  // over her head, works a round shield of light held in her tongs on the
  // glowing anvil, sparks flying off it; the shields she has finished lean
  // in a stack against the wall behind her, and at the open door warriors
  // wait in the dawn for theirs.
  shieldwright(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#1c140f'], [0.6, '#2a1d15'], [1, '#1a120d']]));
    // the wall's stones, tools hanging on it
    let mortar = '';
    const Rm = rng(14102);
    for (let y = 40, row = 0; y < 190; y += 14, row++) {
      mortar += `M-10,${y}H310`;
      for (let x = (row % 2 ? 6 : 20) + Rm() * 4; x < 300; x += 26 + Rm() * 8) mortar += `M${f1(x)},${y}V${y + 14}`;
    }
    s.add(`<path d="${mortar}" fill="none" stroke="#0e0906" stroke-width="1.1" opacity=".55"/>`);
    s.path(U(taper([[18, 54], [94, 54]], 2.4, { per: 2 }), taper([[30, 54], [30, 82]], 1.8, { per: 2 }), poly([[24, 82], [36, 82], [36, 90], [24, 90]]),
      taper([[52, 54], [48, 84]], 1.6, { per: 2 }), taper([[54, 54], [58, 84]], 1.6, { per: 2 }), taper([[76, 54], [76, 78]], 1.8, { per: 2 }), lens(76, 82, 9, 90, 0.5, 3)), '#0e0906');
    // the open door, the dawn outside
    const door = poly([[226, 190], [226, 92], ...Array.from({ length: 13 }, (_, i) => toward(257, 92, 180 + (180 * i) / 12, 31)), [288, 92], [288, 190]]);
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><path d="${door}"/></clipPath>`);
    s.glow(257, 140, 90, '#ffe2a0', 0.4);
    s.add(`<g clip-path="url(#${cid})"><rect x="220" y="50" width="80" height="150" fill="${s.lin([[0, '#9fb6d2'], [0.5, '#f0d6a2'], [1, '#f2b878']])}"/>` +
      `<ellipse cx="270" cy="170" rx="60" ry="40" fill="${s.rad([[0, '#fff6dc', 0.9], [1, '#fff6dc', 0]])}"/>` +
      `<path d="${ridge({ seed: 14101, base: 178, amp: 10, freq: 3, x0: 220, x1: 300 })}" fill="#b89a7c"/></g>`);
    s.path(door, 'none', 'stroke="#0e0906" stroke-width="5"');
    // the floor, the door's light falling in across it
    s.path('M-10,190H310V214H-10Z', s.lin([[0, '#20160f'], [1, '#0e0906']]));
    s.path('M226,190L288,190L262,214L120,214Z', s.linU(288, 0, 120, 0, [[0, '#ffe2a0', 0.4], [1, '#ffe2a0', 0]]));
    // the warriors waiting at the door, spears and no shields yet
    const waiting = U(
      taper([[-3, -26], [-3, -12], [-4, -1]], [6, 5, 4.4]), taper([[3, -26], [4, -12], [5, -1]], [6, 5, 4.4]),
      taper([[0, -26], [0, -40], [0, -50]], [11, 11, 13]),
      ell(1, -56, 4.4, 5), poly([[-4.4, -56], [1, -65], [6.4, -56]]),
      taper([[-5, -46], [-8, -36], [-8, -28]], [4, 3.4, 3]),
      taper([[6, -46], [9, -38], [10, -30]], [4, 3.4, 3]), taper([[10, 2], [10, -76]], [1.4, 1.2], { per: 2 }), lens(10, -79, 6, 90, 0.36, 3),
    );
    s.figure(`<path d="${U(at(282, 188, 0.7, -1)(waiting), at(266, 189, 0.8, -1)(waiting), at(244, 190, 0.86, -1)(waiting))}"/>`,
      { fill: '#2a1d15', rim: '#fff0c2', offsets: [[1, -0.6], [0, -1], [-0.8, -0.5]], rimOp: 0.7 });
    // the shields she has finished, leaning against the wall behind her in
    // a stack, each a little in front of the last; their light behind her
    const stack = [[22, 160, 21], [36, 164, 22], [52, 167, 23], [68, 170, 23]];
    s.glow(46, 160, 56, '#d6f6f4', 0.32);
    const rims = stack.map(([x, y, r]) => shieldLight(s, x, y, r * 0.84, r, { light: -125, op: 0.85, boss: true })).join('');
    // the anvil, its face hot from the work
    s.glow(178, 160, 40, '#ff9a3a', 0.45);
    s.figure(`<path d="${U(poly([[146, 158], [206, 158], [224, 156], [214, 162], [206, 166], [148, 166]]), poly([[158, 166], [196, 166], [190, 176], [164, 176]]), poly([[152, 176], [202, 176], [206, 188], [148, 188]]))}"/>`,
      { fill: '#1a120c', rim: '#ffb070', offsets: [[0, -1.2], [-0.8, -0.6]], rimOp: 0.9 });
    // the shield on it, stood on its rim and held in her tongs
    const wx = 182, wy = 139, wr = 19;
    s.glow(wx, wy, 50, '#e8fbff', 0.5, 'breathe');
    const work = shieldLight(s, wx, wy, wr * 0.84, wr, { light: -125, boss: true });
    // the smith: stout, a braid down her back, the hammer raised high in one
    // hand and the tongs in the other
    const smith = U(
      taper([[-6, -22], [-7, -10], [-8, -1]], [11, 10, 9]), taper([[6, -22], [8, -10], [9, -1]], [11, 10, 9]),
      ell(-9.6, -1.8, 6.4, 2.6), ell(11.6, -1.8, 6.4, 2.6),
      blob([[-15, -48], [15, -48], [19, -34], [18, -20], [-18, -20], [-19, -34]], 4),
      ell(-12, -46, 7.4, 5.4, -20), ell(12, -46, 7.4, 5.4, 20),
      taper([[2, -50], [3, -54]], 6.4, { per: 2 }),
      profile(4, -59, 0.9, -6),
      blob([[-5, -64], [1, -67.4], [7, -65.4], [9, -61], [3, -62], [-3, -59], [-6, -61]], 3),
      taper([[-3, -60], [-7, -52], [-8, -42], [-6, -34]], [4.4, 4, 3.4, 2.4]),
      taper([[10, -46], [15, -58], [13, -72]], [8, 7, 6]), ell(12.6, -74, 4, 3.6),
      taper([[12, -72], [3, -88]], [3, 2.6], { per: 2 }), taper([toward(2, -90, -30, -7), toward(2, -90, -30, 7)], 6.6, { per: 2 }),
      taper([[-4, -44], [14, -40], [28, -38]], [7.4, 6.4, 5.4]), ell(29, -38, 3.6, 3.4),
      taper([[30, -39], [42, -42], [53, -45]], [2, 1.8, 1.4]), taper([[30, -37], [42, -38], [53, -41]], [2, 1.8, 1.4]),
    );
    s.figure(`<path d="${at(104, 190, 1.25)(smith)}"/>`, { fill: p.fig, rim: '#ffd8a0', offsets: [[1.2, -0.6], [-1, -0.8], [0, -1.2]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [0.6, -1] });
    s.path(oval(wx, wy, wr * 0.2, wr * 0.2), '#fff6dc');
    // sparks off the shield from the last blow, the anvil's hot face
    const R = rng(14103), sparks = [];
    let streaks = '';
    for (let i = 0; i < 18; i++) {
      const a = -100 - R() * 130, d = 8 + R() * 36, [x, y] = toward(wx - 4, wy - 10, a, d);
      if (i % 3) sparks.push([x, y, 0.5 + R() * 0.8]); else { const [x2, y2] = toward(x, y, a, 4 + R() * 4); streaks += `M${f1(x)},${f1(y)}L${f1(x2)},${f1(y2)}`; }
    }
    s.bloom(rims + work + `<path d="${dots(sparks)}" fill="#ffe6a0"/><path d="${streaks}" stroke="#fff0c2" stroke-width="1" stroke-linecap="round"/>` +
      '<path d="M148,158H206L204,160.6H150Z" fill="#ffb04a"/>', { sd: 1.4, k: 1.45, box: [0, 80, 240, 120] });
    s.motes({ seed: 14104, n: 16, x: [130, 230], y: [60, 170], r: [0.4, 1], fill: '#ffc25a', hot: '#fff6d8', cls: 'rise', t: [3, 7], op: [0.4, 0.9] });
    return s.svg();
  },
};
