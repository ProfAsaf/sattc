// Card art for the SATTC Ultra version 4 cards, part F: the Weathermakers
// (cards 161–167, Tide and Radiant: the Fields and the people who make the
// weather), the Charge (168–172, Ember and Radiant: hitting early), and two
// Legends, Oriel, Lady of Storms (Tide + Radiant) and Kasimir, the First
// Blade (Ember + Radiant). A Field changes the world for everyone, so each
// is a whole landscape or sky with one clear focal point; a Legend is one
// heroic figure at the centre of their world. Style rules live in
// ../scenes.js; drawing tools in ../kit.js. Seeds: a card's number × 100
// plus a count; Oriel uses 9680–9699 and Kasimir 9700–9719.

import { H, W, blob, particles, poly, pt, ridge, rng, spline, taper } from '../kit.js';
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
// never join a union.
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
// A tagged piece of a figure is a path of its own, and the figure's shading gradient is laid across each path's own
// box: pin every piece to the whole figure's box [x0, y0, x1, y1], with points that draw nothing, so the shading
// of the still picture stays exactly as it was.
const bb = (d) => { const xs = [], ys = []; d.replace(NUM, (m, x, y) => { xs.push(+x); ys.push(+y); return m; }); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const pin = (d, [x0, y0, x1, y1]) => `${d}M${x0},${y0}ZM${x1},${y1}Z`;

// A smooth edge (hill, cliff, shore) closed off below the card, and its
// height at x.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);
function edgeAt(pts, x) {
  const sp = spline(pts, 6);
  for (let i = 0; i < sp.length - 1; i++) {
    const [a, b] = sp[i], [c, d] = sp[i + 1];
    if ((x >= a && x <= c) || (x <= a && x >= c)) return b + ((d - b) * (x - a)) / (c - a || 1);
  }
  return x < sp[0][0] ? sp[0][1] : sp[sp.length - 1][1];
}

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A lens-shaped leaf, petal, feather or wing centred on (x, y), `l` long,
// turned `a` degrees; leafAt() grows the same shape out of a point instead.
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

// Fog or cloud: overlapping round puffs, [[x, y, r], ...].
const puffs = (list, flat = 1.3) => U(list.map(([x, y, r]) => ell(x, y, r * flat, r, 0, 20)));

// Thin horizontal glints of light on water: [[x, y, w, op], ...].
const glitter = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

// A gull gliding, wings bent at the wrist.
const gull = (x, y, k, a = 0) => rot(at(x, y, k)(poly([[-8, 0], [-5, -2.6], [-2, -1.2], [0, 0], [2, -1.2], [5, -2.6], [8, 0], [5, -1.4], [2, 0.2], [0, 1.4], [-2, 0.2], [-5, -1.4]])), x, y, a);

// A kite (the bird) soaring, seen from below: long fingered wings and a
// forked tail, head toward +x before the turn `a`.
const kite = (x, y, k, a = 0) => rot(at(x, y, k)(U(
  lens(1.5, 0, 12, 0, 0.26, 3),
  taper([[3, -0.8], [1, -7], [-2.4, -13], [-1.6, -19]], [3.6, 3.2, 2.2, 0.4], { per: 3 }),
  taper([[3, 0.8], [1, 7], [-2.4, 13], [-1.6, 19]], [3.6, 3.2, 2.2, 0.4], { per: 3 }),
  poly([[-4, -1], [-11, -3.4], [-8.6, 0], [-11, 3.4], [-4, 1]]),
)), x, y, a);

// A streak of wind along the points: a ribbon thin at both ends, `w` at
// its widest.
const gust = (pts, w) => taper(pts, pts.map((_, i) => Math.max(0.15, w * Math.sin((Math.PI * (i + 0.35)) / (pts.length - 0.3)))), { per: 5 });

// A jagged crack, vein or bolt from (x, y) heading `a` degrees, L long, `w`
// wide at the start and thinning to nothing.
function jag(seed, x, y, a, L, w, n = 6, wob = 50) {
  const R = rng(seed), pts = [[x, y]];
  let px = x, py = y, g = a;
  for (let i = 1; i <= n; i++) { g += (R() - 0.5) * wob; px += (Math.cos(rad(g)) * L) / n; py += (Math.sin(rad(g)) * L) / n; pts.push([px, py]); }
  return taper(pts, pts.map((_, i) => Math.max(0.15, w * (1 - i / n))), { per: 1 });
}

// A jagged line from a to b, as points.
function bolt(a, b, seed, n = 9, j = 6) {
  const R = rng(seed), pts = [a];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) {
    const t = i / n, o = (R() - 0.5) * 2 * j;
    pts.push([a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]);
  }
  pts.push(b);
  return pts;
}
const polyline = (pts) => 'M' + pts.map(pt).join('L');

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

// A small flame rising from (x, y0), `h` tall, its tip pushed `lean` aside.
const flame = (x, y0, h, lean, w, wob = 0.14) => taper(
  [[x, y0], [x + lean * 0.12 + w * wob * 2, y0 - h * 0.28], [x + lean * 0.42 - w * wob * 3, y0 - h * 0.55], [x + lean * 0.74 + w * wob * 2, y0 - h * 0.8], [x + lean, y0 - h]],
  [w * 0.8, w, w * 0.68, w * 0.32, 0.3], { per: 6 });

// A radial gradient in canvas units squashed to the ellipse (rx, ry).
function radE(s, cx, cy, rx, ry, stops) {
  const id = s.uid('re');
  s.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rx)}" ` +
    `gradientTransform="translate(${f1(cx)} ${f1(cy)}) scale(1 ${(ry / rx).toFixed(3)}) translate(${f1(-cx)} ${f1(-cy)})">${s.stops(stops)}</radialGradient>`);
  return `url(#${id})`;
}

// A swallow-tailed banner flying from a pole top at (x, y): `len` long
// toward `dir` (1 right, -1 left), `h` deep, rippling.
function pennant(x, y, len, h, dir, seed, wave = 3) {
  const R = rng(seed), T = [], B = [], ph = R() * 3;
  for (let i = 0; i <= 6; i++) {
    const t = i / 6, wv = Math.sin(t * 5.2 + ph) * wave * t;
    T.push([x + dir * len * t, y + wv + t * h * 0.12]);
    B.push([x + dir * len * t * 0.96, y + h * (1 - 0.18 * t) + wv + t * h * 0.12]);
  }
  const a = T[6], b = B[6];
  return poly([...spline(T, 4), [a[0] - dir * len * 0.16, (a[1] + b[1]) / 2], ...spline(B, 4).reverse()]);
}

// A horse at full gallop, facing right, hooves on y = 0 (about 64 long),
// and the same horse with a rider on it, sword up (or a lance, `lance`).
// (small figures in a crowd need fewer points: a coarser taper and ellipse)
const tp = (pts, w) => taper(pts, w, { per: 3 });
const el = (cx, cy, rx, ry = rx, r = 0) => ell(cx, cy, rx, ry, r, 12);
function horse() {
  return U(
    el(0, -22, 13.5, 7.2), el(10, -23, 7.5, 7.8), el(-10, -23, 8, 7.6),
    tp([[12, -27], [18, -33], [23, -37]], [10, 7.4, 5.4]),
    tp([[22, -38], [27.5, -35], [31, -31]], [6, 4.6, 3.2]),
    tp([[21.5, -40.5], [21, -44.5]], [2, 0.4]),
    tp([[13, -18], [21, -14], [28.5, -12.5]], [4.4, 3, 2.2]),
    tp([[9, -17], [12.5, -10], [7.5, -6]], [4, 2.8, 2.2]),
    tp([[-13, -19], [-21, -12], [-30, -9]], [5.4, 3.4, 2.4]),
    tp([[-8, -17], [-6, -9], [-2, -3.5]], [5, 3.2, 2.2]),
    tp([[-17, -26], [-26, -26], [-34, -22]], [3.8, 3.2, 1]),
  );
}
function galloper(lance = false) {
  return U(horse(),
    tp([[0, -28], [4, -36], [7, -42]], [7.4, 6.6, 7.4]),
    tp([[2, -29], [6, -23], [5, -18]], [3.6, 3, 2.6]),
    el(9.5, -46, 3.5, 3.7), el(10, -48, 4.4, 3.2),
    tp([[1, -39], [-7, -37], [-15, -33]], [5, 4.4, 1.2]),
    lance ? [tp([[-6, -30], [22, -58], [34, -72]], [1.8, 1.5, 1.2]), poly([[32, -71], [37, -79.6], [36.4, -69.4]])]
      : [tp([[7, -40], [11, -48], [13, -55]], [3, 2.6, 2.2]), tp([[13, -55], [20, -66], [25, -73]], [2.2, 1.6, 0.4])],
  );
}

// A soldier on foot facing right, feet on y = 0, running: sword raised
// (v odd) or spear held high (v even); a round shield on some.
function runner(v) {
  return U(
    tp([[0, -24], [-7, -14], [-14, -6]], [5.6, 4.4, 3.6]), el(-15, -4.6, 3.6, 1.8, 30),
    tp([[1, -24], [8, -16], [9, -5]], [5.6, 4.4, 3.6]), el(11, -3.4, 3.6, 1.8),
    tp([[0, -24], [3, -36], [6, -46]], [9.4, 8.6, 10.4]),
    blob([[-4, -30], [6, -30], [8, -22], [0, -18], [-8, -19], [-15, -15], [-11, -24]], 3),
    el(9.4, -51, 4, 4.4), el(9.4, -53.4, 4.8, 2.6),
    tp([[3, -42], [-4, -36], [-9, -33]], [3.2, 2.8, 2.4]),
    v % 3 === 2 ? el(-9, -35, 5.4, 6.8) : [],
    tp([[6, -44], [10, -54], [13, -63]], [3.4, 3, 2.6]),
    v % 2 ? tp([[13, -62], [22, -84]], [2.4, 0.5]) : [tp([[8, -49], [23, -94]], [1.5, 1.2]), lens(23.8, -97, 7, -72, 0.4, 3)],
  );
}
// Where that soldier's blade or spear ends.
const runnerTip = (v) => (v % 2 ? [22, -84] : [25, -100]);

// The rearing warhorse from the grave-snare card (there facing left, hooves
// near y = 186): haunches planted, forelegs folded, neck up.
const REARING = () => U(
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
);

export const ultra_f = {
  // ── THE WEATHERMAKERS (Tide and Radiant) ──────────────────────────

  // TIDE. Weatherwitch: on a cliff top in a gale a witch holds up a glass
  // jar with a tiny storm swirling in it, lightning and all; her cloak, her
  // hair and the bent tip of her hat stream back off the wind, and the sea
  // breaks far below.
  weatherwitch(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0b1c28'], [0.3, '#1a3e4c'], [0.52, '#3a7680'], [0.58, '#5a9696']]));
    // a break in the storm out over the sea, its light falling on the water
    s.glow(244, 20, 150, '#d8f6f1', 0.5);
    s.shafts({ cx: 244, cy: 2, n: 8, from: 76, to: 122, len: 220, spread: 2.4, color: '#e2faf6', op: 0.24, seed: 16101, sd: 2.4 });
    // the far headland across the bay, and the sea
    s.layer(ledge([[150, 126], [178, 116], [204, 112], [228, 116], [252, 124]]), '#3c7478', { blur: 0.7 });
    s.path('M-10,122H310V214H-10Z', s.lin([[0, '#64a2a2'], [0.12, '#2c6672'], [0.5, '#123a46'], [1, '#06161e']]));
    s.add('<path d="M-10,122.5H310" stroke="#d8f8f3" stroke-width=".8" opacity=".4"/>');
    s.add(`<ellipse cx="242" cy="138" rx="62" ry="10" fill="${s.rad([[0, '#effdf9', 0.5], [0.5, '#c6f4f6', 0.2], [1, '#c6f4f6', 0]])}"/>`);
    s.add(glitter([[242, 127, 40, 0.5], [236, 133, 30, 0.42], [246, 140, 52, 0.36], [238, 148, 40, 0.3], [248, 157, 56, 0.24], [240, 168, 44, 0.2]], '#e8fcf8'));
    s.add('<g fill="none" stroke="#d8f6f1" stroke-width=".9" stroke-linecap="round" opacity=".45"><path d="M190,146q-8,-2 -16,1M270,150q-8,-2 -16,1M218,166q-10,-3 -20,1M286,178q-10,-3 -20,1M250,194q-12,-3 -24,1"/></g>');
    // the storm overhead
    const cl = puffs([[8, -16, 40], [52, 2, 22], [88, -4, 26], [126, 6, 20], [162, -2, 22], [196, 6, 16], [214, -10, 18], [306, -12, 30], [288, 8, 14]], 1.4);
    s.figure(`<path d="${cl}"/>`, { fill: '#122a36', rim: '#cdeee9', offsets: [[0, 1.2], [0.8, 0.8]], rimOp: 0.75, light: [0, 1] });
    // the gale: long streaks of wind tearing in off the sea
    const gusts = [[[312, 40], [262, 37], [214, 42], [172, 39]], [[256, 66], [204, 60], [160, 64], [112, 58], [68, 62]], [[312, 98], [272, 93], [232, 97], [198, 92]],
      [[118, 26], [78, 21], [36, 26], [-10, 21]], [[92, 86], [58, 81], [22, 87], [-12, 81]], [[194, 112], [154, 106], [114, 111], [74, 105]]];
    s.add(`<path class="drift" d="${gusts.map((g, i) => gust(g, 1.4 + (i % 3) * 0.5)).join('')}" fill="#e6fbf8" opacity=".32"/>`);
    // the light of the jar, behind her
    const X = 120, Y = 178, K = 0.9, place = at(X, Y, K);
    const jx = X + 26.5 * K, jb = Y - 133 * K;
    s.glow(jx, jb - 12, 56, '#c6f4f6', 0.55);
    // the cliff top, its grass flattened by the wind; its face drops away
    // to the surf
    const top = [[-12, 176], [30, 172], [76, 175], [122, 178], [168, 175], [198, 178], [210, 184]];
    const G = rng(16102), blades = [];
    for (let x = -8; x < 206; x += 2.6 + G() * 3.4) {
      const y = edgeAt(top, x) + 1.5, h = 5 + G() * 8, l = 4 + G() * 7;
      blades.push(taper([[x, y], [x - l * 0.4, y - h * 0.6], [x - l, y - h]], [1.8, 1.1, 0.3], { per: 3 }));
    }
    const cliff = poly([...spline(top, 6), [214, 194], [220, 204], [224, 216], [-12, 216]]);
    s.figure(`<path d="${cliff}"/><path d="${U(blades)}"/>`, { fill: '#0a2026', rim: '#bfeee9', offsets: [[0.6, -1.1], [1.1, -0.3]], rimOp: 0.75, shade: 0.4, light: [0.6, -1] });
    s.add('<g fill="none" stroke="#e9f8f2" stroke-linecap="round" opacity=".7"><path d="M226,206q10,-5 22,-1M232,213q12,-4 26,0" stroke-width="1.4"/><path d="M256,200q8,-3 16,0" stroke-width="1"/></g>');
    // her cloak streaming back off her shoulders in long folds
    const cloak = place(U(
      taper([[2, -90], [-14, -93], [-30, -89], [-48, -94], [-64, -89], [-80, -93], [-94, -86], [-100, -80]], [12, 17, 20, 19, 16, 12, 6, 1]),
      taper([[-2, -82], [-18, -78], [-34, -81], [-50, -75], [-64, -78], [-74, -72]], [7, 11, 11, 9, 5, 0.6]),
    ));
    s.figure(`<path d="${cloak}"/>`, { fill: '#103440', rim: '#bfeee9', offsets: [[0.6, -1], [1, -0.3]], rimOp: 0.7, shade: 0.4, light: [0.6, -1] });
    s.add(`<path d="${place('M-12,-90Q-30,-84 -48,-90T-84,-88M-20,-84Q-36,-80 -52,-84')}" fill="none" stroke="#06181e" stroke-width="1" opacity=".55"/>`);
    // the witch: leaning into the wind, skirts pressed to her legs and
    // flaring behind, one hand thrown back, the other holding the jar high
    const her = place(U(
      taper([[3, -44], [6, -22], [9, -3]], [7, 5.4, 4]), ell(12, -1.8, 5, 2.2, 6),
      taper([[-3, -44], [-6, -22], [-9, -3]], [7, 5.4, 4]), ell(-6, -1.8, 5, 2.2),
      blob([[-7, -62], [8, -62], [10, -46], [11, -30], [8, -18], [0, -17], [-10, -15], [-22, -11], [-34, -14], [-30, -22], [-40, -24], [-28, -32], [-20, -44], [-12, -56]], 4),
      taper([[0, -58], [2, -74], [4, -88]], [12, 10.4, 13]),
      taper([[5, -90], [6, -96]], 4, { per: 2 }),
      profile(8, -102, 0.72, -14),
      ell(6, -108.6, 16, 2.8, -10),
      taper([[5, -109], [4, -119], [2, -128], [-3, -135], [-10, -137], [-15, -134]], [13, 10, 7, 4, 2, 0.5]),
      taper([[2, -104], [-10, -106], [-22, -101], [-34, -104], [-46, -99]], [8, 7, 5, 3, 0.5]),
      taper([[2, -99], [-12, -96], [-24, -91], [-37, -94]], [6, 5, 3.4, 0.5]),
      taper([[8, -88], [15, -100], [21, -111]], [4.6, 4, 3.6]),
      taper([[21, -111], [24, -121], [26, -129]], [3.6, 3.2, 2.8]),
      ell(26.5, -131, 2.8, 3),
      taper([[-1, -86], [-9, -77], [-16, -68]], [4.4, 3.8, 3.2]), taper([[-16, -68], [-22, -62], [-26, -59]], [3.2, 2.6, 0.8]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0.8, -1.1], [1.2, -0.3], [-0.5, -1]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.5, -1] });
    // the jar: a little storm cloud inside, rain, a spark of lightning
    const jar = blob([[jx - 9, jb], [jx - 11.5, jb - 4], [jx - 12, jb - 13], [jx - 11, jb - 20], [jx - 7, jb - 23.5], [jx + 7, jb - 23.5], [jx + 11, jb - 20], [jx + 12, jb - 13], [jx + 11.5, jb - 4], [jx + 9, jb]], 5);
    s.add('<g data-part="jar">');
    s.path(jar, radE(s, jx, jb - 12, 13, 13, [[0, '#e6fffc', 0.28], [0.6, '#bfeef2', 0.32], [1, '#e8fffd', 0.62]]));
    s.path(puffs([[jx - 4.4, jb - 15, 3.4], [jx + 2.4, jb - 16.4, 4], [jx - 0.6, jb - 19.2, 3.2], [jx + 6.4, jb - 14, 2.4], [jx - 7.6, jb - 13.4, 2.2]], 1.3), '#22404c');
    s.add(`<path d="${oval(jx, jb - 13, 9.4, 3, -8)}" fill="none" stroke="#e8fffd" stroke-width=".7" stroke-dasharray="5 3" opacity=".65"/>` +
      `<path d="M${f1(jx - 5)},${f1(jb - 10)}l-1,3.2M${f1(jx - 1)},${f1(jb - 9)}l-1,3.2M${f1(jx + 4)},${f1(jb - 10)}l-1,3.2M${f1(jx + 7)},${f1(jb - 9)}l-.8,2.6" stroke="#d8f6f4" stroke-width=".7" opacity=".85"/>`);
    s.path(`M${f1(jx - 7.4)},${f1(jb - 23)}V${f1(jb - 27)}H${f1(jx + 7.4)}V${f1(jb - 23)}Z`, '#1a3640');
    s.path(`M${f1(jx - 9)},${f1(jb - 26.6)}Q${f1(jx - 9)},${f1(jb - 31)} ${f1(jx - 6)},${f1(jb - 31)}H${f1(jx + 6)}Q${f1(jx + 9)},${f1(jb - 31)} ${f1(jx + 9)},${f1(jb - 26.6)}Z`, '#0e2028');
    s.path(U(ell(jx, jb + 0.6, 5.6, 2.6), taper([[jx - 5, jb + 0.6], [jx - 7, jb - 4.4]], [2.2, 1.2], { per: 2 }), taper([[jx + 5, jb + 0.6], [jx + 6.8, jb - 4.4]], [2.2, 1.2], { per: 2 })), p.fig);
    s.glow(jx, jb - 13, 22, '#f4fffd', 0.5);
    const zig = polyline([[jx + 1.4, jb - 12], [jx - 1.8, jb - 7.6], [jx + 1.6, jb - 6.6], [jx - 1.4, jb - 1.4]]);
    s.bloom(`<path d="${zig}" fill="none" stroke="#c6f4f6" stroke-width="2.4" stroke-linejoin="bevel" opacity=".7"/><path d="${zig}" fill="none" stroke="#ffffff" stroke-width="1.1" stroke-linejoin="bevel"/>` +
      `<path d="${jar}" fill="none" stroke="#dcfbff" stroke-width="1"/>` +
      `<path d="M${f1(jx - 8.4)},${f1(jb - 19)}Q${f1(jx - 11)},${f1(jb - 12)} ${f1(jx - 8.6)},${f1(jb - 4)}" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>`,
    { sd: 1.4, k: 1.5, box: [jx - 30, jb - 50, 60, 60] });
    s.add('</g>');
    s.add([[60, 70], [92, 44], [204, 84], [184, 30], [30, 104], [252, 62], [160, 96]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.23).toFixed(2)}s" cx="${x}" cy="${y}" rx=".7" ry="1.7" fill="#d8f4f2" opacity=".6"/>`).join(''));
    s.motes({ seed: 16103, n: 14, x: [110, 186], y: [16, 86], r: [0.35, 0.9], fill: p.glow, hot: '#ffffff', cls: 'float', t: [3, 6], op: [0.4, 0.9] });
    s.add(particles({ seed: 16104, n: 8, x: [20, 200], y: [80, 170], r: [0.6, 1.2], fill: '#9cc8c4', cls: 'float', t: [4, 7], op: [0.3, 0.6] }));
    return s.svg();
  },

  // RADIANT. Storm Shepherd: a shepherdess rides a great white swan up
  // through golden storm clouds, crook raised; behind her the sun breaks
  // through the storm and turns the edge of every cloud gold, and three
  // small white birds of her flock follow.
  'storm-shepherd'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#2e3856'], [0.35, '#575c78'], [0.6, '#8e8090'], [0.8, '#c8a07c'], [1, '#c08a62']]));
    // the sun breaking through, up to the right behind her
    const sx = 232, sy = 52;
    s.glow(sx, sy, 200, '#ffe9b8', 0.75);
    s.shafts({ cx: sx, cy: sy, n: 20, from: 90, to: 260, len: 320, spread: 2.2, color: '#fff3d4', op: 0.2, seed: 16201 });
    s.glow(sx, sy, 50, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="13" fill="#fff8e6"/>`);
    // the storm: a dark bank across the top and down the left, rain
    // trailing from it, torn open round the sun
    const bank = puffs([[-6, 18, 30], [34, 6, 24], [72, -2, 22], [112, 6, 24], [150, -4, 22], [184, 4, 20], [-12, 60, 26], [14, 86, 18], [-4, 110, 20], [40, 44, 16], [306, -6, 26], [284, 4, 14]], 1.35);
    s.figure(`<path d="${bank}"/>`, { fill: '#454257', rim: '#ffe2a6', offsets: [[1.2, 0.8], [0.4, 1.4], [1.4, -0.2]], rimOp: 0.85, shade: 0.35, light: [1, 0.6] });
    let rain = '';
    const Rr = rng(16202);
    for (let i = 0; i < 16; i++) { const x = 4 + Rr() * 80, y = 30 + Rr() * 40, l = 40 + Rr() * 50; rain += `M${f1(x)},${f1(y)}l${f1(-l * 0.16)},${f1(l)}`; }
    s.add(`<path d="${rain}" stroke="#d6d4e0" stroke-width=".7" opacity=".28"/>`);
    // a far bank of cloud catching the light, and the sea of cloud below
    s.layer(puffs([[0, 146, 18], [36, 140, 16], [72, 146, 18], [112, 142, 16], [150, 148, 18], [190, 140, 16], [230, 146, 18], [270, 140, 16], [306, 146, 18]], 1.6) + 'M-10,146H310V214H-10Z', '#a88a74', { blur: 0.8 });
    s.haze(126, 156, '#ffe6b0', 0.3);
    const floor = puffs([[-6, 180, 24], [32, 172, 20], [68, 182, 22], [108, 176, 24], [150, 184, 22], [192, 176, 24], [234, 182, 22], [276, 172, 24], [312, 180, 22]], 1.5) + 'M-10,182H310V214H-10Z';
    s.figure(`<path d="${floor}"/>`, { fill: '#8a6c58', rim: '#fff0c2', offsets: [[0.6, -1.3], [1.2, -0.6]], rimOp: 0.85, shade: 0.4, light: [0.5, -1] });
    // three little white birds of her flock, following
    s.figure(`<path d="${U(gull(70, 118, 1.1, -10), gull(50, 128, 0.9, -6), gull(38, 112, 0.8, -12))}"/>`, { fill: '#efe6d4', rim: '#fff6dc', offsets: [[0.6, -0.6]], rimOp: 0.8 });
    // the swan: wings raised high, flight feathers trailing from them; a
    // long neck stretched out ahead
    const bx = 116, by = 146, place = at(bx, by, 1);
    // a wing: flight feathers hanging back from the arm, overlapping, and a
    // row of short coverts along its leading edge
    const wingOf = (pts, n, l0, l1, a0, a1, w0, w1) => {
      const arm = spline(pts, 6), out = [taper(pts, pts.map((_, i) => 10 - (7 * i) / (pts.length - 1)))], quills = [], cov = [];
      for (let i = 0; i < n; i++) {
        const t = 0.03 + (0.97 * i) / (n - 1), [x, y] = arm[Math.round(t * (arm.length - 1))];
        const a = a0 + (a1 - a0) * t, L = l0 + (l1 - l0) * t, w = w0 + (w1 - w0) * t, mid = toward(x, y, a + 4, L * 0.5), tip = toward(x, y, a, L);
        out.push(taper([[x, y], mid, tip], [w, w * 0.92, 1.2], { per: 5 }));
        quills.push(`M${pt([x, y])}Q${pt(mid)} ${pt(toward(x, y, a, L - 4))}`);
        if (t < 0.92) cov.push(leafAt(x, y, a - 10, L * 0.4, 0.62, 4));
      }
      return { d: U(out), q: quills.join(''), c: U(cov) };
    };
    const far = wingOf([[16, -12], [14, -34], [8, -56], [-4, -74], [-18, -88], [-32, -98]], 16, 22, 40, 140, 194, 9, 11);
    const near = wingOf([[8, -10], [2, -30], [-8, -50], [-22, -66], [-38, -80], [-56, -90]], 18, 26, 46, 150, 200, 10, 12);
    s.add('<g data-part="wingfar">');
    s.path(place(far.d), s.radU(sx, sy, 240, [[0, '#fffdf6'], [0.4, '#efe4cc'], [1, '#b8a486']]));
    s.path(place(far.d), 'none', 'stroke="#8a7a62" stroke-width=".7" opacity=".6"');
    s.add(`<path d="${place(far.q)}" fill="none" stroke="#a8977c" stroke-width=".6" opacity=".5"/>`);
    s.add('</g><g data-part="wingnear">');
    const wingFill = s.radU(sx, sy, 240, [[0, '#ffffff'], [0.35, '#fbf5e8'], [0.75, '#e2d4ba'], [1, '#c0ae92']]);
    s.path(place(near.d), wingFill);
    s.path(place(near.d), 'none', 'stroke="#7a6a52" stroke-width=".7" opacity=".6"');
    s.add(`<path d="${place(near.q)}" fill="none" stroke="#9a8a70" stroke-width=".6" opacity=".55"/>`);
    s.path(place(near.c), wingFill, 'stroke="#b4a488" stroke-width=".6"');
    s.add('</g>');
    const body = place(U(
      blob([[-36, 0], [-28, -8], [-12, -13], [8, -14], [24, -11], [36, -4], [42, 4], [36, 13], [20, 18], [0, 17], [-20, 12]], 4),
      taper([[32, -6], [48, -14], [64, -21], [80, -27], [92, -31]], [14, 10, 7.6, 6.4, 6]),
      ell(96, -32.6, 6.6, 4.8, -12),
      poly([[-30, -2], [-46, -9], [-53, -2], [-48, 6], [-30, 7]]),
      taper([[-12, 12], [-26, 16], [-38, 16]], [3.6, 2.6, 1.2]),
    ));
    s.figure(`<path d="${body}"/>`, { fill: '#e8dcc6', rim: '#fff6dc', offsets: [[1, -1], [1.3, 0]], rimOp: 0.95, shade: 0.5, light: [0.7, -1] });
    s.path(place(poly([[100.4, -36], [113, -33.4], [101.4, -29.6]])), '#d89040');
    s.path(place(ell(100.6, -33, 2.2, 2.6, -12)), '#2a1f15');
    s.add(`<circle cx="${f1(bx + 97.4)}" cy="${f1(by - 34)}" r=".9" fill="#2a1f15"/>`);
    // the shepherdess astride its back, shawl and skirts blown back, the
    // crook raised high into the light
    const rx = bx + 16, ry = by - 12, rp = at(rx, ry, 1.2);
    const hookPts = [[24, -79], [24.4, -86], [28, -91], [33.4, -90.6], [36.4, -86.4], [35.6, -81.4], [33, -79]];
    const rider = rp(U(
      blob([[-2, -4], [8, -6], [10, 0], [2, 4], [-10, 3], [-22, 4], [-32, 0], [-22, -3], [-12, -4]], 3),
      taper([[4, -2], [12, 2], [14, 9]], [6.4, 5, 4]), ell(16, 10.4, 3.2, 1.8, 20),
      taper([[2, -3], [4, -14], [7, -25]], [10, 8.6, 10.4]),
      taper([[8, -27], [9, -31]], 3.4, { per: 2 }),
      ell(10, -35.5, 4.4, 5),
      taper([[11, -39], [4, -40], [-6, -37], [-16, -39], [-26, -35]], [6, 6, 4.4, 2.6, 0.5]),
      taper([[9, -24], [14, -34], [18, -44]], [3.8, 3.2, 2.8]), ell(18.6, -46, 2.4, 2.6),
      taper([[6, -22], [14, -16], [20, -14]], [3.4, 3, 2.6]),
      taper([[14, -20], [24, -80]], [2, 1.7]),
      taper(hookPts, [1.8, 1.8, 1.8, 1.7, 1.6, 1.4, 1.1], { per: 4 }),
    ));
    s.figure(`<path d="${rider}"/>`, { fill: p.fig, rim: '#fff0c2', offsets: [[1.2, -0.8], [0.4, -1.3]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [0.8, -1] });
    s.add('<g data-part="glint">');
    s.glow(rx + 30 * 1.2, ry - 85 * 1.2, 18, '#ffe08a', 0.55);
    s.bloom(`<path d="${rp(polyline(hookPts))}" fill="none" stroke="#ffe7a0" stroke-width="1.3" stroke-linecap="round"/>`, { sd: 1.3, k: 1.5, box: [rx + 14, ry - 124, 50, 44] });
    s.add('</g>');
    s.motes({ seed: 16203, n: 18, x: [60, 280], y: [20, 170], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. A FIELD. Gale Winds: a gale off the sea hits a high cliff and
  // rolls up and over it in one great curl of wind; gulls and kites ride its
  // streaks across a bright teal sky, and the lone tree on the cliff top
  // has grown flat in it.
  'gale-winds'(s) {
    fin(s, 'tide');
    s.rect(s.lin([[0, '#2a8896'], [0.3, '#4ea8b0'], [0.55, '#8acfca'], [0.64, '#a8ddd4']]));
    s.glow(240, 24, 150, '#f4fffb', 0.7);
    s.glow(240, 24, 30, '#ffffff', 0.8);
    s.add('<circle cx="240" cy="24" r="10" fill="#fffef6"/>');
    s.add(`<g fill="#effcf8" opacity=".45">${[[70, 32, 70, 3.2], [196, 52, 80, 2.6], [124, 16, 60, 2.2], [262, 74, 50, 2], [36, 62, 40, 1.8]].map(([x, y, rx, ry]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    // the far shore, the sea, whitecaps torn off by the wind
    s.layer(ledge([[156, 136], [194, 129], [236, 126], [274, 130], [312, 134]]), '#5ea2a4', { blur: 0.7 });
    s.path('M-10,134H310V214H-10Z', s.lin([[0, '#a0dcd4'], [0.08, '#4aa2a8'], [0.4, '#1c6270'], [1, '#0a2e3c']]));
    const Rw = rng(16301);
    let caps = '';
    for (let i = 0; i < 22; i++) { const y = 140 + Math.pow(Rw(), 0.8) * 70, x = 150 + Rw() * 170, l = 4 + (y - 134) * 0.2; caps += `M${f1(x)},${f1(y)}q${f1(-l / 2)},${f1(-l * 0.18)} ${f1(-l)},${f1(l * 0.06)}`; }
    s.add(`<path d="${caps}" fill="none" stroke="#effcf8" stroke-width="1" stroke-linecap="round" opacity=".6"/>`);
    // the cliff: grass flattened along its top, its sunlit face falling to
    // the surf
    const top = [[-12, 104], [28, 106], [68, 110], [104, 112], [134, 116], [150, 122]];
    const Gb = rng(16302), grass = [];
    for (let x = -8; x < 150; x += 2.4 + Gb() * 3) {
      const y = edgeAt(top, x) + 1.5, h = 4 + Gb() * 6, l = 5 + Gb() * 6;
      grass.push(taper([[x, y], [x - l * 0.45, y - h * 0.55], [x - l, y - h * 0.7]], [1.6, 1, 0.3], { per: 3 }));
    }
    const cliff = poly([...spline(top, 6), [156, 136], [158, 156], [164, 176], [170, 196], [174, 216], [-12, 216]]);
    s.figure(`<path d="${cliff}"/><path d="${U(grass)}"/>`, { fill: '#1a4a48', rim: '#e8fff6', offsets: [[0.8, -1], [1.2, -0.2]], rimOp: 0.9, shade: 0.5, light: [0.6, -1] });
    s.path('M150,122L156,136L158,156L164,176L170,196L174,216L152,216L146,190L140,160L136,134Z', s.linU(136, 0, 174, 0, [[0, '#2a5c5a'], [1, '#5c9a92']]));
    s.add('<g fill="none" stroke="#173e3e" stroke-width="1" opacity=".8"><path d="M140,140L156,142M142,158L158,160M144,176L164,180M148,196L170,198"/></g>');
    s.add('<g fill="none" stroke="#effcf8" stroke-linecap="round" opacity=".75"><path d="M176,204q10,-6 22,-2M180,212q12,-4 26,0" stroke-width="1.4"/><path d="M172,190q6,-3 12,0" stroke-width="1"/></g>');
    // the tree on the cliff top, grown flat in the wind
    const tree = U(
      taper([[66, 113], [63, 102], [56, 92], [46, 85], [34, 80]], [6.4, 5.4, 4.2, 3, 1.6]),
      taper([[59, 98], [49, 98], [38, 101], [27, 103]], [2.6, 2, 1.4, 0.6]),
      taper([[52, 89], [44, 93], [33, 93]], [2, 1.6, 0.6]),
      blob([[54, 84], [50, 77], [38, 73], [22, 73], [6, 76], [-6, 80], [8, 82], [24, 83], [40, 84]], 4),
      blob([[42, 96], [34, 91], [20, 91], [6, 95], [-4, 99], [10, 99], [26, 98]], 4),
      blob([[30, 72], [22, 66], [8, 66], [-2, 70], [12, 71]], 3),
    );
    s.figure(`<path d="${tree}"/>`, { fill: '#163c34', rim: '#e8fff6', offsets: [[0.8, -1], [1.2, -0.3]], rimOp: 0.85 });
    // the gale: streaks of wind sweeping in over the sea, and the great curl
    // where it rolls up off the cliff edge and over
    const others = [
      [[318, 88], [262, 84], [214, 80], [176, 70], [156, 46], [130, 30], [96, 24], [50, 24], [-12, 30]],
      [[318, 104], [270, 101], [222, 100], [184, 96]],
      [[146, 104], [112, 96], [72, 94], [32, 92], [-12, 96]],
      [[318, 54], [260, 48], [204, 42], [160, 22], [120, 12]],
      [[318, 142], [262, 140], [208, 139]],
    ];
    s.add(`<path class="drift" d="${others.map((g, i) => gust(g, [3.4, 2.4, 2.6, 2, 1.8][i])).join('')}" fill="#f2fffd" opacity=".42"/>`);
    const main = [[318, 126], [272, 123], [226, 120], [190, 116], [166, 106], [154, 88], [150, 68], [138, 50], [118, 42], [100, 48], [94, 62], [102, 74], [116, 72], [118, 60], [108, 54]];
    const sb = spline(main, 6);
    const twin = along(spline(main.slice(0, 11), 6), 12).filter((_, i) => i % 6 === 0);
    s.add('<g data-part="curl">');
    s.path(gust(main, 14) + gust(twin, 5), s.linU(318, 0, 94, 0, [[0, '#f4fffd', 0.25], [0.5, '#f4fffd', 0.55], [1, '#ffffff', 0.72]]));
    const streak = (d, a, b) => 'M' + along(sb, d).slice(a, b).map(pt).join('L');
    s.add(`<path d="${streak(-4.5, 4, 70) + streak(3.5, 10, 80) + streak(0, 30, 84) + streak(-1.5, 6, 50)}" fill="none" stroke="#ffffff" stroke-width=".8" opacity=".6" stroke-dasharray="14 4 6 3" stroke-linecap="round"/>`);
    s.bloom(`<path d="${'M' + sb.slice(24, 85).map(pt).join('L')}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>`, { sd: 1.6, k: 1.4, box: [80, 20, 110, 110] });
    s.add('</g>');
    // gulls and kites riding it
    const gulls = [gull(206, 112, 1.25, -6), gull(254, 95, 0.95, -4), gull(182, 66, 1.05, -18), gull(64, 70, 0.8, 4), gull(276, 46, 0.8, -4), gull(30, 34, 0.7, 6), gull(228, 30, 0.6, -6)];
    const kites = [kite(108, 60, 1.3, 196), kite(150, 28, 0.85, 186)];
    s.figure(gulls.map((g, i) => `<g data-part="gull${i}"><path d="${U(g)}"/></g>`).join('') + kites.map((g, i) => `<g data-part="kite${i}"><path d="${U(g)}"/></g>`).join(''), { fill: '#123a40', rim: '#ffffff', offsets: [[0, -0.8]], rimOp: 0.7 });
    s.motes({ seed: 16303, n: 16, x: [150, 300], y: [110, 210], r: [0.4, 1], fill: '#effcf8', hot: '#ffffff', cls: 'float', t: [3, 6], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. A FIELD. Rolling Fog: a bank of sea fog rolls up over a coastal
  // hillside; two warriors stand clear in front, and behind them rank on
  // rank of an army fades into the mist until only their spears show.
  'rolling-fog'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#14303c'], [0.35, '#3a6670'], [0.62, '#86aaa8'], [0.8, '#b0ccc6']]));
    // the sun, a pale disc in the fog
    s.glow(210, 46, 140, '#e8fbf6', 0.55);
    s.add('<circle cx="210" cy="46" r="12" fill="#f2fdf8" opacity=".6"/>');
    // the hill rising to the left, the sea at its foot on the right
    s.path('M-10,126H310V214H-10Z', s.lin([[0, '#a8c4c0'], [0.5, '#6e9294'], [1, '#3c5c60']]));
    s.layer(ledge([[-12, 96], [40, 94], [90, 100], [140, 108], [190, 116], [240, 122], [312, 126]]), '#a2bcb8', { blur: 0.8 });
    // the fog bank rolling in off the sea and over the hill
    const bank = puffs([[330, 56, 48], [282, 70, 38], [240, 86, 32], [200, 98, 28], [164, 106, 24], [302, 110, 40], [256, 116, 30], [130, 110, 20]], 1.35);
    s.add(`<path class="drift" d="${bank}" fill="${s.radU(250, 86, 150, [[0, '#f0faf6', 0.92], [1, '#c8deda', 0.7]])}"/>`);
    // the army behind them, rank on rank, going into the fog
    const trooper = (x, b, k, v) => at(x, b, k)(U(
      tp([[-3, -28], [-4, -14], [-4.6, 0]], [4.6, 4, 3.6]), tp([[3, -28], [4, -14], [4.6, 0]], [4.6, 4, 3.6]),
      tp([[0, -26], [0, -40], [0, -52]], [13, 13.4, 16]),
      el(0, -57.5, 4.6, 5.2), poly([[-5.4, -58], [0, -67], [5.4, -58]]),
      v % 2 ? el(7, -38, 7.4, 9.4) : tp([[7, -50], [9, -38], [9, -28]], [4, 3.4, 3]),
      tp([[-8, -50], [-10, -38], [-9, -28]], [4, 3.4, 3]),
      v % 3 !== 1 ? [taper([[-10, 2], [-10, -84]], [1.4, 1.1], { per: 2 }), lens(-10, -88, 8, 90, 0.36, 3)] : [],
      v % 5 === 2 ? poly([[-10, -84], [6, -82], [2, -77], [6, -72], [-10, -72]]) : [],
    ));
    const R = rng(16401);
    const rank = (n, x0, x1, b0, b1, k, jit = 6) => {
      const out = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t + (R() - 0.5) * jit, b = b0 + (b1 - b0) * t + (R() - 0.5) * 2;
        out.push(trooper(x, b, k * (0.92 + R() * 0.16), Math.floor(R() * 30)));
      }
      return U(out);
    };
    // (each rank fades toward the fog bank on the right as well as with
    // distance)
    const fade = (c) => s.linU(0, 0, 300, 0, [[0, c], [0.6, c, 0.85], [1, c, 0.35]]);
    s.path(rank(15, 10, 290, 110, 124, 0.3), fade('#8eaaa8'));
    s.fog(114, '#d6e8e4', 0.5);
    s.path(rank(12, 0, 300, 124, 138, 0.42), fade('#6e8e8e'));
    s.fog(128, '#d6e8e4', 0.45);
    s.haze(118, 150, '#c8dcd8', 0.35);
    s.path(rank(9, -6, 306, 142, 154, 0.58), fade('#56767a'));
    s.fog(146, '#d6e8e4', 0.4);
    s.haze(136, 172, '#c8dcd8', 0.3);
    // the fog bank spilling down over the ranks on the right
    const mist = s.rad([[0, '#e8f4f0', 0.85], [0.6, '#dcece8', 0.6], [1, '#dcece8', 0]]);
    s.add(`<g class="drift">${[[300, 128, 40], [262, 140, 30], [232, 122, 26], [286, 160, 30], [214, 150, 20]].map(([x, y, r]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${f1(r * 1.4)}" ry="${r}" fill="${mist}"/>`).join('')}</g>`);
    // the near ground
    s.path(ledge([[-10, 178], [60, 174], [140, 178], [220, 175], [310, 179]]), s.lin([[0, '#2a4448'], [1, '#0c1a1e']]));
    // the two in front: a spearman with his round shield, and a swordsman
    // turned toward him, blade up
    const spearman = U(
      taper([[-4, -40], [-6, -20], [-7, 0]], [8, 6.4, 5]), ell(-8, -1.4, 5, 2.2),
      taper([[4, -40], [6, -20], [8, 0]], [8, 6.4, 5]), ell(9, -1.4, 5, 2.2),
      blob([[-9, -66], [9, -66], [11, -46], [12, -30], [0, -28], [-12, -30], [-11, -46]], 4),
      taper([[0, -44], [0, -58], [0, -70]], [15, 16, 20]),
      taper([[0, -72], [0, -77]], 5, { per: 2 }), ell(0, -82, 5.6, 6), poly([[-6.2, -82], [0, -95], [6.2, -82]]),
      taper([[-9, -68], [-13, -56], [-14, -46]], [5, 4.4, 4]), ell(-14, -44, 3, 3.4),
      taper([[9, -68], [12, -58], [10, -50]], [5, 4.4, 4]),
      blob([[-10, -70], [-16, -62], [-19, -40], [-20, -26], [-14, -28], [-10, -48]], 4),
    );
    const spear = U(taper([[-14, 2], [-14, -116]], [2.2, 1.7], { per: 2 }), lens(-14, -121, 12, 90, 0.34, 3));
    const swordsman = U(
      taper([[-4, -40], [-8, -20], [-11, 0]], [8, 6.4, 5]), ell(-13, -1.4, 5, 2.2),
      taper([[4, -40], [7, -20], [9, 0]], [8, 6.4, 5]), ell(11, -1.4, 5, 2.2),
      blob([[-9, -66], [9, -66], [11, -46], [13, -32], [0, -30], [-13, -32], [-11, -46]], 4),
      taper([[0, -44], [1, -58], [2, -70]], [15, 16, 19]),
      taper([[2, -72], [2.6, -77]], 5, { per: 2 }), ell(3.4, -82.4, 5.8, 6.2), ell(3, -85, 6.6, 4),
      blob([[-6, -72], [-14, -66], [-20, -50], [-24, -30], [-28, -16], [-18, -18], [-10, -24], [-6, -46]], 4),
      taper([[-7, -66], [-12, -56], [-14, -48]], [5, 4.4, 4]),
    );
    const sword = U(taper([[8, -66], [14, -56], [16, -46]], [5, 4.4, 4]), ell(17, -44.4, 3.2, 3.2),
      taper([[16.4, -47], [30, -84]], [2.6, 0.7], { per: 2 }), taper([[12, -48.6], [21, -42.6]], [1.8, 1.8], { per: 2 }));
    const A = at(110, 194, 1.05), B = at(190, 196, 1.05, -1);
    const bA = bb(A(U(spearman, spear))), bB = bb(B(U(swordsman, sword)));
    s.figure(`<path d="${pin(A(spearman), bA)}"/><g data-part="spear"><path d="${pin(A(spear), bA)}"/></g><path d="${pin(B(swordsman), bB)}"/><g data-part="sword"><path d="${pin(B(sword), bB)}"/></g>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0.6, -1.2], [1, -0.4], [-0.8, -0.8]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0.4, -1] });
    // his shield, painted, catching the fog light
    const [shx, shy] = [110 + 8 * 1.05, 194 - 46 * 1.05];
    s.add(`<g data-part="shield"><path d="${oval(shx, shy, 12, 13)}" fill="#1e3a3e" stroke="#9cc8c8" stroke-width="1.1"/><path d="${oval(shx, shy, 8, 8.8)}" fill="none" stroke="#2e5052" stroke-width="1"/>` +
      `<circle cx="${f1(shx)}" cy="${f1(shy)}" r="2.6" fill="#c6f4f6" opacity=".85"/></g>`);
    // fog curling round their feet
    s.fog(186, '#d6e8e4', 0.32).fog(202, '#cfe2de', 0.3);
    s.motes({ seed: 16402, n: 12, x: [20, 280], y: [60, 190], r: [0.4, 0.9], fill: p.glow, cls: 'float', t: [6, 10], op: [0.3, 0.7] });
    return s.svg();
  },

  // RADIANT. A FIELD. Hallowed Ground: a ring of standing stones on a hill
  // at dawn; the sun comes up right in the gate of its tallest pair, and gold
  // light pours in through every gap across the calm grass inside, between
  // the long shadows of the stones.
  'hallowed-ground'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#54668a'], [0.3, '#989eae'], [0.52, '#e0c696'], [0.6, '#f6d896']]));
    s.add(particles({ seed: 16501, n: 12, x: [0, W], y: [0, 50], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    const sx = 150, sy = 120;
    s.glow(sx, sy, 210, '#fff0c2', 0.85);
    s.glow(sx, sy, 54, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="13" fill="#fffaf0"/>`);
    // the far downs, soft in the light
    s.layer(ridge({ seed: 16502, base: 131, amp: 9, freq: 2 }), '#c8b08a', { blur: 0.7 });
    s.haze(110, 134, '#fff0c6', 0.4);
    // the hilltop, and the light pouring in across it
    s.path(ledge([[-10, 137], [60, 131], [150, 129], [240, 131], [310, 137]]), s.lin([[0, '#dcc486'], [0.2, '#b29a58'], [0.6, '#6a5a32'], [1, '#2e2616']]));
    s.add(`<ellipse cx="150" cy="150" rx="170" ry="44" fill="${s.rad([[0, '#fff2c8', 0.75], [0.5, '#ffe2a0', 0.3], [1, '#ffe2a0', 0]], { cx: 0.5, cy: 0.2, r: 0.7 })}"/>`);
    // the ring: stones round its far side, three pairs capped with lintels,
    // their shadows reaching toward us
    const ringPt = (deg) => [150 + Math.cos(rad(deg)) * 132, 158 + Math.sin(rad(deg)) * 26];
    const stone = (x, b, w, h, seed) => {
      const R = rng(seed);
      return poly([[x - w / 2, b + 1.5], [x - w * 0.54, b - h * 0.45], [x - w * 0.46, b - h * (0.9 + R() * 0.06)], [x - w * 0.12, b - h], [x + w * 0.3, b - h * (0.95 + R() * 0.05)],
        [x + w * 0.5, b - h * (0.84 + R() * 0.08)], [x + w * 0.52, b - h * 0.4], [x + w / 2, b + 1.5]]);
    };
    const far = [196, 214, 236, 258, 282, 304, 326, 344].map((deg, i) => {
      const [x, b] = ringPt(deg), k = 0.56 + (b - 132) / 46, gate = deg === 258 || deg === 282;
      return [x, b, (13 * k + 4) * (gate ? 1.1 : 1), 96 * k * (gate ? 1.1 : 1), 16503 + i];
    });
    let shade = '';
    for (const [x, b, w] of far) {
      const dx = x - sx, dy = b - sy, t = (216 - b) / dy, xe = x + dx * t, we = (w * (216 - sy)) / dy;
      shade += poly([[x - w / 2, b], [x + w / 2, b], [xe + we / 2, 216], [xe - we / 2, 216]]);
    }
    s.path(shade, '#3a2a14', 'opacity=".42"');
    const lintel = (a, b2) => {
      const [x1, b1, w1, h1] = far[a], [x2, bb, w2, h2] = far[b2], y1 = b1 - h1, y2 = bb - h2;
      return poly([[x1 - w1 * 0.7, y1 + 2], [x1 - w1 * 0.6, y1 - 7], [x2 + w2 * 0.6, y2 - 7], [x2 + w2 * 0.7, y2 + 2]]);
    };
    const stones = far.map(([x, b, w, h, seed]) => stone(x, b, w, h, seed)).join('') + lintel(1, 2) + lintel(3, 4) + lintel(5, 6);
    s.figure(`<path d="${stones}"/>`, { fill: '#4e4032', rim: '#fff0c2', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [0, -1] });
    s.shafts({ cx: sx, cy: sy, n: 12, from: 20, to: 160, len: 200, spread: 3, color: '#fff3cc', op: 0.22, seed: 16511, sd: 2.6 });
    // the low stone in the middle of the ring, the light lying on it
    s.add('<g data-part="altar">');
    s.path('M124,170L127,163L173,163L176,170L176,174L124,174Z', '#4a3c2a');
    s.add('</g>');
    // two great near stones at the edges, dark against it all
    const near = stone(24, 176, 30, 112, 16512) + stone(278, 178, 32, 104, 16513);
    s.figure(`<path d="${near}"/>`, { fill: '#2a2014', rim: '#ffe7a8', offsets: [[0, -1.2], [-1, -0.4], [1, -0.4]], rimOp: 0.85 });
    s.bloom(`<path d="M127,163.4H173" stroke="#fff6d8" stroke-width="1.3"/><circle cx="${sx}" cy="${sy}" r="9" fill="#ffffff"/>`, { sd: 1.6, k: 1.4, box: [100, 90, 100, 90] });
    // grass and small flowers in the light
    const G = rng(16514), blades = [], flowers = [];
    for (let x = -8; x < 312; x += 2.4 + G() * 3.4) {
      const h = 6 + G() * (x < 60 || x > 240 ? 16 : 8), l = (G() - 0.5) * 6;
      blades.push(taper([[x, 216], [x + l * 0.4, 214 - h * 0.5], [x + l, 214 - h]], [1.8, 1.1, 0.3], { per: 3 }));
      if (G() < 0.18) flowers.push([x + l, 212 - h, 0.9]);
    }
    s.add('<g data-part="grass">');
    s.path(U(blades), '#2a2214');
    s.add(`<path d="${dots(flowers)}" fill="#fff4d6" opacity=".8"/>`);
    s.add('</g>');
    s.motes({ seed: 16515, n: 22, x: [60, 240], y: [100, 200], r: [0.4, 1.1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE + RADIANT. Keeper of the Skies: on the gallery of a lighthouse a
  // tall robed woman raises one hand against a black storm front, and it
  // stops there, piled up against nothing, while behind her the sky stays
  // gold and the sea calm.
  'keeper-of-the-skies'(s) {
    fin(s, ['tide', 'radiant']);
    const p = PAL.tide;
    s.rect(s.lin([[0, '#b88e64'], [0.3, '#e2bc84'], [0.56, '#f6d89e'], [0.64, '#f8e2ac']]));
    // the sun going down calm behind her
    const sx = 266, sy = 116;
    s.glow(sx, sy, 170, '#fff0c2', 0.8);
    s.glow(sx, sy, 40, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="11" fill="#fff8e6"/>`);
    s.path(U(gull(232, 70, 0.8, -6), gull(250, 84, 0.6, 4), gull(276, 64, 0.7, -2)), '#6a4a30');
    // the sea: gold under the sun, black under the storm
    s.path('M-10,134H310V214H-10Z', s.lin([[0, '#f0d29a'], [0.1, '#b89a72'], [0.5, '#5e5650'], [1, '#2a2a30']]));
    s.add(glitter([[262, 138, 36, 0.6], [258, 144, 48, 0.5], [266, 151, 40, 0.42], [256, 160, 60, 0.34], [264, 172, 50, 0.26]], '#fff6d8'));
    s.path('M-10,134H180V214H-10Z', s.linU(-10, 0, 180, 0, [[0, '#0e1824', 0.95], [0.6, '#16202c', 0.8], [1, '#16202c', 0]]));
    s.add('<g fill="none" stroke="#9ab0bc" stroke-width=".9" stroke-linecap="round" opacity=".45"><path d="M20,150q8,-4 16,0M70,158q10,-4 20,0M30,176q12,-5 24,0M96,182q12,-4 24,0M12,198q14,-5 28,0M66,204q14,-4 28,0"/></g>');
    // where she stands, and her raised palm
    const X = 154, Y = 146, K = 0.92, place = at(X, Y, K, -1);
    const hx = X - 36 * K, hy = Y - 121 * K;
    // her ward: a wall of light from the clouds to the sea, bowed toward the
    // storm where her palm holds it
    const wardX = (y) => hx - 9 + 0.0016 * (y - hy) * (y - hy);
    const ward = [];
    for (let y = -12; y <= 138; y += 6) ward.push([wardX(y), y]);
    // the storm front, piled up flat against the ward; lightning in it, rain
    // under it
    const Rb = rng(16605), front = ward.map(([x, y]) => [x - 3 - Rb() * 1.5, y]);
    const mass = poly([[-14, -14], ...front, [-14, 140]]);
    const billows = puffs([[wardX(-4) - 18, -4, 14], [wardX(20) - 16, 20, 11], [wardX(56) - 14, 56, 10], [wardX(84) - 16, 84, 12], [wardX(112) - 18, 112, 12]], 1.2);
    s.figure(`<path d="${U(mass, billows)}"/>`, { fill: '#18263a', rim: '#ffe2a6', offsets: [[1.4, 0], [1, -0.8], [1, 0.8]], rimOp: 0.9, shade: 0.4, light: [1, 0] });
    const inner = puffs([[wardX(8) - 20, 8, 14], [wardX(52) - 22, 52, 13], [wardX(84) - 20, 84, 14], [wardX(114) - 24, 114, 12], [40, 24, 22], [62, 62, 20], [22, 96, 22], [56, 118, 16], [8, 54, 16]], 1.2);
    s.figure(`<path d="${inner}"/>`, { fill: '#1f3248', rim: '#9a8a74', offsets: [[1.2, 0.4], [0.6, -0.8]], rimOp: 0.55 });
    s.add(`<g data-part="stormlines" fill="none" stroke="#3a4e66" stroke-width="1.2" opacity=".7"><path d="${[[60, 30, 22], [24, 70, 26], [70, 96, 20], [30, 118, 18]].map(([x, y, r]) =>
      `M${x - r},${y}a${r},${r * 0.6} 0 0 1 ${2 * r},0`).join('')}"/></g>`);
    let rain = '';
    const Rr = rng(16601);
    for (let i = 0; i < 26; i++) { const x = -6 + Rr() * (hx - 30), y = 120 + Rr() * 20, l = 40 + Rr() * 50; rain += `M${f1(x)},${f1(y)}l${f1(l * 0.2)},${f1(l)}`; }
    s.add(`<path d="${rain}" stroke="#8aa0b4" stroke-width=".7" opacity=".4"/>`);
    // the lighthouse: tower, gallery and lantern room, the lamp lit
    s.glow(206, 114, 54, '#ffd77a', 0.6);
    const house = U(poly([[170, 216], [176, 152], [236, 152], [242, 216]]), poly([[124, 152], [124, 146], [288, 146], [288, 152]]),
      poly([[174, 90], [186, 76], [206, 66], [226, 76], [238, 90]]), poly([[204, 67], [205, 52], [207, 52], [208, 67]]), ell(206, 58, 3.2, 3.2),
      poly([[178, 90], [234, 90], [234, 146], [178, 146]]), poly([[172, 152], [180, 160], [232, 160], [240, 152]]));
    s.figure(`<path d="${house}"/>`, { fill: '#2e2a30', rim: '#ffe7a8', offsets: [[1.2, -0.4], [0.6, -1]], rimOp: 0.9, shade: 0.4, light: [1, -0.4] });
    s.path('M182,95H230V142H182Z', s.lin([[0, '#fff2c4'], [0.6, '#ffd77a'], [1, '#e8a850']]));
    s.add('<path d="M198,95V142M214,95V142M182,118H230" stroke="#2e2a30" stroke-width="1.8"/><path d="M178,176H238M176,196H242" stroke="#1e1a20" stroke-width="2" opacity=".7"/>');
    // the keeper: a long robe blown back, hood down, her hand up
    const arm = U(
      taper([[5, -86], [14, -94], [22, -101]], [5, 4.4, 4]),
      taper([[22, -101], [29, -110], [34, -117]], [4, 3.6, 3.2]),
      ell(36, -121, 3, 4.4, -20), taper([[35, -124], [36, -130]], [1.4, 0.6], { per: 2 }), taper([[37.4, -124], [39.6, -129.4]], [1.4, 0.6], { per: 2 }),
    );
    const hair = U(
      taper([[-1, -105], [-12, -105], [-24, -99], [-36, -101], [-48, -95]], [8, 7, 5, 3, 0.5]),
      taper([[-2, -100], [-14, -97], [-26, -92], [-38, -94]], [6, 5, 3.4, 0.5]),
    );
    const body = U(
      blob([[6, -88], [-6, -88], [-10, -70], [-14, -50], [-20, -30], [-28, -12], [-40, -2], [-26, 0], [-10, 1], [8, 0], [12, -4], [10, -30], [9, -60]], 4),
      ell(10, -1.2, 5, 2),
      taper([[0, -60], [0, -76], [0, -88]], [12, 12, 15]),
      ell(-4, -89, 7, 4),
      taper([[1, -90], [1.5, -95]], 4, { per: 2 }),
      profile(3, -101, 0.78, -6),
      blob([[18, -98], [10, -92], [2, -80], [-4, -72], [4, -78], [14, -86]], 3),
      taper([[-3, -86], [-6, -70], [-6, -56]], [4.4, 3.8, 3.4]),
    );
    const bH = bb(place(U(body, arm, hair)));
    // (her blown hair and scarf, and her raised arm with its hand, are tagged to move)
    s.figure(`<path d="${pin(place(body), bH)}"/><g data-part="hair"><path d="${pin(place(hair), bH)}"/></g><g data-part="arm"><path d="${pin(place(arm), bH)}"/></g>`, { fill: '#101c28', rim: '#fff0c2', offsets: [[1.2, -0.4], [0.8, -1], [-0.6, -0.9]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [1, -0.6] });
    // the gallery rail, in front of her
    let rail = 'M124,131H282M124,138.5H282';
    for (let x = 126; x <= 280; x += 8) rail += `M${x},131V146`;
    s.add(`<path d="${rail}" stroke="#1e1c22" stroke-width="1.6" fill="none"/><path d="M124,130.4H282" stroke="#ffe7a8" stroke-width=".7" opacity=".7"/>`);
    // the ward lit up where the storm leans on it, rings of light spreading
    // out from her palm
    const arcAt = (r, a0, a1) => { let d = ''; for (let a = a0; a >= a1; a -= 6) d += (d ? 'L' : 'M') + pt(toward(hx, hy, a, r)); return d; };
    const wardFade = s.linU(0, -12, 0, 138, [[0, '#fff6dc', 0.15], [0.25, '#fff6dc', 0.95], [0.6, '#fff6dc', 0.8], [1, '#fff6dc', 0.1]]);
    s.path(poly([...ward, ...ward.slice().reverse().map(([x, y]) => [x + 7, y])]), '#fff0c2', 'opacity=".16"');
    s.glow(hx, hy, 30, '#fff4d6', 0.55, 'breathe');
    s.bloom(`<path d="${polyline(ward)}" fill="none" stroke="${wardFade}" stroke-width="1.6"/><path d="${polyline(ward)}" fill="none" stroke="${wardFade}" stroke-width="5" opacity=".25"/>` +
      `<path d="${arcAt(6, 250, 110) + arcAt(11, 240, 120)}" fill="none" stroke="#fff0c2" stroke-width=".9" stroke-linecap="round" opacity=".7"/>` +
      `<path d="${polyline(bolt([40, 24], [20, 104], 16602, 7, 6))}" fill="none" stroke="#e6f2ff" stroke-width="1.2"/><path d="${polyline(bolt([30, 64], [52, 84], 16603, 3, 3))}" fill="none" stroke="#e6f2ff" stroke-width=".8"/>` +
      `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="3.4" fill="#fffaf0"/>`, { sd: 1.5, k: 1.5 });
    s.motes({ seed: 16604, n: 16, x: [hx - 10, 300], y: [20, 140], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE + RADIANT. A FIELD. The Eye of the Storm: looking straight up from
  // the calm at the heart of a hurricane, a circle of gold sky far overhead,
  // ringed by walls of cloud that spiral out and down all round, lightning
  // flickering in them; gulls circle in the calm.
  'the-eye-of-the-storm'(s) {
    fin(s, ['tide', 'radiant']);
    const cx = 150, cy = 84, sq = 0.78;
    s.rect(s.lin([[0, '#122638'], [0.5, '#0c1e2c'], [1, '#08141e']]));
    s.glow(cx, cy, 190, '#ffd98a', 0.45);
    s.add(`<ellipse cx="${cx}" cy="${cy}" rx="70" ry="${f1(70 * sq)}" fill="${radE(s, cx, cy, 70, 70 * sq, [[0, '#fffaf0'], [0.3, '#ffeab4'], [0.7, '#f4c070'], [1, '#d08c50']])}"/>`);
    s.glow(cx, cy, 40, '#ffffff', 0.6, 'breathe');
    // the walls of the storm: bands of cloud, each scalloped, wound a little
    // further round than the one inside it, lit gold on their inner edge
    // (each scallop rises steeply and trails off, so the walls look as if
    // they are turning; the nearer, lower walls sit a little lower, as if
    // the funnel leaned toward us)
    const ring = (R, amp, n, ph, out, ccy) => {
      const pts = [];
      for (let k = 0; k < 160; k++) {
        const th = (k / 160) * Math.PI * 2, u = (((n * th) / (Math.PI * 2) + ph) % 1 + 1) % 1;
        const b = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.5)), 0.7);
        const r = R * (1 + 0.05 * Math.sin(2 * th + ph * 3)) + (out ? 1 : -1) * amp * b;
        pts.push([cx + Math.cos(th) * r, ccy + Math.sin(th) * r * sq]);
      }
      return poly(pts);
    };
    const bands = [
      [62, 88, 13, 8, '#b4a084', '#fff2c8', 0.95], [84, 116, 15, 10, '#7a7a7c', '#ffe6a6', 0.9], [110, 148, 17, 12, '#4c5c66', '#f0d8a0', 0.75],
      [142, 188, 19, 14, '#2e404c', '#c8dccc', 0.55], [182, 236, 21, 16, '#1c2e3a', '#9cc4c8', 0.42], [228, 310, 23, 19, '#10202c', '#7aa8b4', 0.32],
    ];
    bands.forEach(([ri, ro, n, amp, fill, rim, rop], j) => {
      const ccy = cy + j * 5, ph = j * 0.37;
      const d = ring(ro, amp, n, ph + 0.15, true, ccy) + ring(ri, amp, n, ph, false, ccy);
      const g = radE(s, cx, ccy, ro, ro * sq, [[0, mix2(fill, '#ffffff', 0.25)], [f2(ri / ro), mix2(fill, '#ffffff', 0.18)], [1, mix2(fill, '#000000', 0.4)]]);
      const id = s.uid('band');
      s.add(`<g data-part="wall${j}">`);
      s.defs.push(`<path id="${id}" d="${d}" fill-rule="evenodd"/>`);
      s.add(`<use href="#${id}" fill="${rim}" opacity="${rop}" transform="translate(${cx} ${ccy}) scale(${(1 - (j < 2 ? 3.4 : 2.6) / ri).toFixed(4)}) translate(${-cx} ${-ccy})"/>`);
      s.add(`<use href="#${id}" fill="${g}"/>`);
      s.add('</g>');
    });
    // the wind's spiral, streaked through the walls
    let sp = '';
    for (let a = 0; a < 7; a++) {
      const pts = [];
      for (let k = 0; k <= 30; k++) { const th = rad(a * 51 + k * 5), r = 74 * Math.exp(0.0105 * k * 5); pts.push([cx + Math.cos(th) * r, cy + 10 + Math.sin(th) * r * sq]); }
      sp += polyline(pts);
    }
    s.add(`<path data-part="spiral" d="${sp}" fill="none" stroke="#eef6f2" stroke-width=".9" opacity=".3" stroke-dasharray="12 5 4 5" stroke-linecap="round"/>`);
    // lightning in the outer walls
    const bolts = [bolt([34, 20], [62, 58], 16701, 6, 5), bolt([262, 150], [232, 186], 16702, 6, 5), bolt([280, 30], [246, 48], 16703, 5, 4), bolt([30, 168], [64, 150], 16704, 5, 4)];
    s.bloom('<g data-part="bolts">' + bolts.map((b) => `<path d="${polyline(b)}" fill="none" stroke="#e6f6ff" stroke-width="1.3" stroke-linejoin="bevel"/>`).join('') + '</g>' +
      `<path d="${glint(cx, cy, 10, 0.12)}" fill="#ffffff" opacity=".7"/>`, { sd: 1.6, k: 1.5 });
    // gulls wheeling in the calm
    [gull(132, 72, 1.1, 14), gull(170, 92, 0.9, -20), gull(156, 62, 0.7, 40), gull(124, 98, 0.8, -30)].forEach((g, i) => { s.add(`<g data-part="gull${i}">`); s.path(U(g), '#3a2c22'); s.add('</g>'); });
    s.motes({ seed: 16705, n: 18, x: [90, 210], y: [40, 130], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── THE CHARGE (Ember and Radiant) ────────────────────────────────

  // EMBER. Ash Squire: a boy squire bursts at a dead run out of a bank of
  // smoke and embers, his torch streaming flame behind him, short sword out,
  // leaning hard into the run.
  'ash-squire'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#1a0605'], [0.32, '#43130a'], [0.6, '#8a2e12'], [0.78, '#c4521e'], [0.86, '#d8682a']]));
    // the fire behind the smoke
    s.glow(80, 160, 190, '#ff7a2e', 0.5);
    s.layer(ridge({ seed: 16801, base: 174, amp: 12, freq: 2.4 }), '#4a160b', { blur: 0.7 });
    s.haze(152, 180, '#ff8a3a', 0.3);
    s.path(ledge([[-10, 186], [70, 183], [150, 186], [230, 182], [310, 185]]), s.lin([[0, '#2a0e08'], [1, '#0a0302']]));
    // the smoke he comes out of: a great column of it boiling up off the
    // fire behind him and leaning away on the wind, lit orange at its foot
    const dusk = s.rad([[0, '#1c0606', 1], [0.6, '#200808', 0.9], [1, '#200808', 0]]);
    const soot = s.rad([[0, '#341008', 1], [0.6, '#2c0e08', 0.85], [1, '#2c0e08', 0]]);
    const lit = s.rad([[0, '#c2561e', 0.95], [0.5, '#7a3016', 0.8], [1, '#5a2010', 0]]);
    const billow = (list, g) => list.map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${f1(r * 1.25)}" ry="${r}" fill="${g}"/>`).join('');
    s.add(`<g class="drift">${billow([[-14, 16, 48], [40, 4, 36], [6, 60, 46], [62, 54, 30], [-10, 108, 44], [82, 22, 24]], dusk)}` +
      `${billow([[30, 36, 30], [78, 66, 24], [36, 92, 36], [92, 100, 26], [14, 136, 38], [68, 124, 32], [104, 128, 20]], soot)}</g>`);
    s.glow(60, 176, 84, '#ff6a1f', 0.6);
    s.add(billow([[10, 182, 36], [62, 172, 30], [104, 180, 22], [36, 154, 26], [88, 152, 20], [118, 166, 12]], lit));    // the squire: back leg straight out behind him, its toe pushing off, the
    // front knee driven high, body leaning far forward; sword out ahead,
    // the torch held high, tunic and hair flying back
    const X = 150, Y = 193, K = 1.1, place = at(X, Y, K);
    const boy = place(U(
      taper([[-1, -46], [-10, -26]], [8.4, 6.6], { per: 2 }), taper([[-10, -26], [-21, -7]], [6.4, 4.6], { per: 2 }), ell(-24, -4.4, 5.4, 2.2, 36),
      taper([[2, -47], [17, -42]], [8.4, 7], { per: 2 }), taper([[17, -42], [12, -24]], [6.6, 4.8], { per: 2 }), ell(14, -20.4, 5, 2.2, 50),
      blob([[-6, -54], [8, -56], [10, -44], [0, -40], [-10, -40], [-24, -35], [-18, -46]], 4),
      taper([[0, -44], [8, -58], [16, -72]], [12.4, 11.4, 14]),
      taper([[18, -74], [21, -79]], 4.6, { per: 2 }),
      profile(25, -85, 0.76, 10),
      taper([[22, -91], [12, -94], [4, -91], [-4, -94]], [7, 6, 3.6, 0.5]), taper([[20, -87], [10, -87], [2, -83]], [5, 3.6, 0.5]),
    ));
    // (his sword arm and his torch arm, each its own piece)
    const swordArm = place(U(
      taper([[15, -70], [26, -63]], [5, 4.4], { per: 2 }), taper([[26, -63], [35, -60]], [4.4, 3.6], { per: 2 }), ell(37, -59.6, 3, 2.6),
      taper([[36.4, -64.4], [38.4, -54.4]], [1.8, 1.8], { per: 2 }), taper([[39, -59], [61, -52]], [2.8, 0.6], { per: 2 }),
    ));
    const torchArm = place(U(
      taper([[12, -71], [13, -86]], [4.8, 4], { per: 2 }), taper([[13, -86], [17, -100]], [4, 3.4], { per: 2 }), ell(17.6, -102, 2.8, 2.6),
      taper([[16, -96], [20, -114]], [2.4, 2.8], { per: 2 }), ell(20.4, -116, 3, 3.8, 10),
    ));
    // (each piece spans the whole figure's box, so the figure's gradient runs across all of it as one: two points, no area)
    const span = 'M118.5,61.2L118.5,61.2M217.2,192.1L217.2,192.1';
    // smoke dragged along behind him
    s.add(`<g class="drift">${[[128, 132, 12], [112, 116, 16], [98, 140, 14], [120, 96, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r}" fill="${s.rad([[0, '#3a140c', 0.8], [0.7, '#2a0e08', 0.4], [1, '#2a0e08', 0]])}"/>`).join('')}</g>`);
    s.figure(`<g data-part="body"><path d="${boy + span}"/></g><g data-part="sword"><path d="${swordArm + span}"/></g><g data-part="torch"><path d="${torchArm + span}"/></g>`, { fill: p.fig, rim: '#ffb060', offsets: [[-0.8, -1], [-1.2, 0], [0.6, -1]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.4, -1] });
    // the torch flame streaming back over his head, the blade catching it
    const [tx, ty] = [X + 20.4 * K, Y - 119 * K];
    const fire = U(plume(tx, ty, -92, -150, 40, [10, 12, 8, 3, 0.4]), plume(tx - 2, ty + 1, -120, -186, 34, [7, 8, 5, 0.4]), plume(tx + 2, ty, -74, -128, 26, [6, 6, 3, 0.4]),
      plume(tx - 1, ty - 4, -104, -172, 46, [5, 6, 4, 2, 0.3]), plume(tx - 4, ty + 2, -150, -200, 22, [5, 5, 3, 0.3]));
    const core = U(plume(tx, ty + 1, -94, -140, 22, [6, 6, 3, 0.4]));
    s.glow(tx - 10, ty - 10, 44, '#ff8a3a', 0.6, 'breathe');
    s.bloom(`<g data-part="flame"><path d="${fire}" fill="${s.linU(tx, ty, tx - 44, ty - 20, [[0, '#fff3c8'], [0.35, '#ffb04a', 0.95], [1, '#ff6a1f', 0.4]])}"/><path d="${core}" fill="#fff6dc"/></g>` +
      `<path data-part="bladeglint" d="M${f1(X + 39.5 * K)},${f1(Y - 58.6 * K)}L${f1(X + 60 * K)},${f1(Y - 52.4 * K)}" stroke="#ffd6a0" stroke-width=".9" stroke-linecap="round"/>`, { sd: 1.8, k: 1.45, box: [100, 20, 140, 160] });
    s.motes({ seed: 16802, n: 28, x: [20, 200], y: [20, 180], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 7] });
    s.motes({ seed: 16803, n: 10, x: [100, 160], y: [50, 110], r: [0.4, 1], fill: '#ffd27a', hot: '#ffffff', cls: 'rise', t: [2.5, 5] });
    return s.svg();
  },

  // RADIANT. War Drummer: on a hilltop at dawn a drummer in a gold tabard
  // beats a great roped war drum, one stick high, the other coming down;
  // banners stream behind her and a column of spears marches past below.
  'war-drummer'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#45537a'], [0.32, '#8e8ea0'], [0.56, '#e2c08c'], [0.68, '#f4d698']]));
    s.add(particles({ seed: 16901, n: 10, x: [0, W], y: [0, 50], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    const sx = 226, sy = 136;
    s.glow(sx, sy, 180, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 16, from: -180, to: 0, len: 320, spread: 2, color: '#fff6dc', op: 0.2, seed: 16902 });
    s.glow(sx, sy, 44, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="12" fill="#fff8e6"/>`);
    s.layer(ridge({ seed: 16903, base: 152, amp: 12, freq: 2.2 }), '#a89282', { blur: 0.7 });
    s.haze(132, 158, '#f2d49a', 0.36);
    // the column marching past along the road below the hill
    const marcher = (x, b, k, v) => at(x, b, k)(U(
      tp([[-1, -24], [-4, -12], [-7, 0]], [5, 4.4, 3.6]), tp([[1, -24], [4, -12], [7, 0]], [5, 4.4, 3.6]),
      tp([[0, -22], [0.6, -34], [1.2, -44]], [9, 9, 11]),
      el(1.8, -49, 3.8, 4), el(1.8, -51.2, 4.6, 2.6),
      tp([[3, -42], [6.4, -34], [5, -27]], [3.2, 2.8, 2.4]),
      taper([[-12, -12], [12, -76]], [1.3, 1], { per: 2 }), lens(12.8, -79, 6, -69, 0.4, 3),
      v % 4 === 0 ? poly([[12, -74], [26, -71], [21, -67], [25, -62], [10, -66]]) : [],
    ));
    s.path(ledge([[-10, 168], [80, 166], [160, 168], [240, 165], [310, 167]]), '#6a5440');
    const Rm = rng(16904), col = [];
    for (let x = -12, i = 0; x < 316; x += 15 + Rm() * 5, i++) col.push(marcher(x, 167 + Math.sin(x / 40) * 1.5, 0.42, i));
    s.figure(`<path d="${U(col)}"/>`, { fill: '#4e3c2e', rim: '#ffe7a8', offsets: [[0, -1], [-0.7, -0.6], [0.7, -0.6]], rimOp: 0.8 });
    // the hilltop she stands on
    s.path(ledge([[-10, 194], [50, 188], [120, 186], [190, 185], [250, 188], [310, 194]]), s.lin([[0, '#3a2c1c'], [1, '#120e08']]));
    // banners flying behind her, the low sun through them
    const flags = pennant(210, 58, 70, 26, 1, 16905) + pennant(242, 76, 54, 22, 1, 16906);
    s.path(U(taper([[210, 190], [210, 52]], [2.6, 2.2], { per: 2 }), taper([[242, 190], [242, 70]], [2.4, 2], { per: 2 }), ell(210, 51, 2.4, 2.4), ell(242, 69, 2.2, 2.2)), '#2a1f15');
    const flagFill = s.linU(210, 0, 296, 0, [[0, '#c8642e', 0.95], [0.5, '#eaa04a', 0.9], [1, '#f6c96c', 0.85]]);
    s.add('<g data-part="flags">'); s.path(flags, flagFill); s.add('</g>');
    s.add(`<path data-part="mark" d="${sunMark(240, 70, 4.6)}" fill="none" stroke="#8a3d16" stroke-width="1.4" opacity=".5"/>`);
    // the war drum: a tall shell laced with rope, a painted sun on its head
    const dx = 120, dt = 142, db = 180, dr = 32, dry = 8.6;
    s.add('<g data-part="drum">');
    s.path(U(taper([[dx - 22, db + 2], [dx - 27, 192]], [3.4, 3], { per: 2 }), taper([[dx + 22, db + 2], [dx + 27, 192]], [3.4, 3], { per: 2 }), taper([[dx, db + 6], [dx, 194]], [3.4, 3], { per: 2 })), '#1e140c');
    s.figure(`<path d="M${dx - dr},${dt}V${db}A${dr},${dry} 0 0 0 ${dx + dr},${db}V${dt}Z"/>`, { fill: '#3e2a18', rim: '#ffe7a8', offsets: [[1.2, -0.4], [0.6, -1]], rimOp: 0.9, shade: 0.45, light: [1, -0.3] });
    let rope = '';
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI - (Math.PI * i) / 8, x = dx + Math.cos(a) * dr * 0.96, yT = dt + 5 + Math.sin(a) * dry * 0.9, yB = db - 5 + Math.sin(a) * dry * 0.9;
      rope += (i ? 'L' : 'M') + `${f1(x)},${f1(i % 2 ? yB : yT)}`;
    }
    s.add(`<path d="${rope}" fill="none" stroke="#d6b06a" stroke-width="1.2" opacity=".8"/>` +
      `<path d="M${dx - dr},${dt + 3}A${dr},${dry} 0 0 0 ${dx + dr},${dt + 3}M${dx - dr},${db - 3}A${dr},${dry} 0 0 0 ${dx + dr},${db - 3}" fill="none" stroke="#1a120a" stroke-width="2.4"/>`);
    s.add('</g>');
    s.add(`<g data-part="skin"><ellipse cx="${dx}" cy="${dt}" rx="${dr}" ry="${dry}" fill="${s.lin([[0, '#f2e2bc'], [1, '#c8ae80']])}" stroke="#2a1f15" stroke-width="1.4"/>` +
      `<path d="${oval(dx - 4, dt, 7, 7 * (dry / dr))}" fill="none" stroke="#b8442a" stroke-width="1.6" opacity=".8"/></g>`);
    // the drummer
    const her = U(
      taper([[-4, -44], [-8, -22], [-12, 0]], [8, 6.4, 5]), ell(-14, -1.4, 5.4, 2.2),
      taper([[4, -44], [8, -22], [12, 0]], [8, 6.4, 5]), ell(14, -1.4, 5.4, 2.2),
      taper([[0, -42], [0, -60], [1, -78]], [14, 13, 16]),
      taper([[1, -80], [2, -85]], 4.4, { per: 2 }),
      profile(4, -91, 0.78, -2),
      ell(-2, -94, 4.2, 4), taper([[-3, -92], [-6, -84], [-7, -74], [-6, -66]], [3.6, 3.2, 2.6, 1]),
    );
    // (her raised arm with its stick, and her arm at the drum with its stick, each its own piece)
    const armB = U(
      taper([[-1, -77], [-10, -88], [-8, -101]], [4.8, 4.2, 3.6]), ell(-7.6, -103.4, 3, 3),
      taper([[-7.6, -103], [-22, -114]], [2, 1.6], { per: 2 }), ell(-23.4, -115.4, 3.2, 3.2),
    );
    const armF = U(
      taper([[5, -75], [14, -66], [22, -60]], [4.8, 4.2, 3.6]), ell(23, -59, 3, 3),
      taper([[23, -59], [37, -48]], [2, 1.6], { per: 2 }), ell(38.4, -47, 3.2, 3.2),
    );
    const place = at(172, 186, 1.02, -1);
    const span = 'M129.6,65L129.6,65M199.1,186.8L199.1,186.8'; // (each piece spans the figure's whole box, so its gradient runs across all of it as one: two points, no area)
    s.figure(`<g data-part="body"><path d="${place(her) + span}"/></g><g data-part="armB"><path d="${place(armB) + span}"/></g><g data-part="armF"><path d="${place(armF) + span}"/></g>`, { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.6], [0.4, -1.2], [-0.6, -1]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    // her tabard, gold, a sun on it
    s.add('<g data-part="tabard">');
    const tab = place(blob([[-5.4, -77], [6.4, -77], [7.4, -62], [8, -46], [9, -34], [0, -32], [-9, -34], [-7.4, -46], [-6.4, -62]], 4));
    s.path(tab, s.linU(176, 108, 160, 156, [[0, '#c89238'], [0.45, '#8e6224'], [1, '#4e3412']]));
    s.path(tab, 'none', 'stroke="#ffe7a8" stroke-width=".7" opacity=".55"');
    s.add(`<path d="${place('M-7.2,-52L8.2,-52')}" stroke="#2a1f15" stroke-width="2.2"/><path d="${sunMark(172, 186 - 64 * 1.02, 2.6)}" fill="none" stroke="#ffe9a8" stroke-width=".9" opacity=".8"/>`);
    s.add('</g>');
    // the beat: the head shivers, the air rings
    const [kx, ky] = [172 - 38.4 * 1.02, dt + 0.5];
    s.glow(kx, ky, 26, '#fff0c2', 0.6, 'breathe');
    s.bloom(`<g data-part="beat"><path d="${oval(kx, ky, 7, 1.8)}${oval(kx, ky, 13, 3.4)}" fill="none" stroke="#fff6d8" stroke-width="1"/>` +
      [44, 56, 68].map((r, i) => `<path d="M${f1(dx + Math.cos(rad(200)) * r)},${f1(dt + Math.sin(rad(200)) * r)}A${r},${r} 0 0 1 ${f1(dx + Math.cos(rad(244)) * r)},${f1(dt + Math.sin(rad(244)) * r)}" fill="none" stroke="#ffe9b0" stroke-width="1.3" opacity="${0.8 - i * 0.22}" stroke-linecap="round"/>`).join('') + '</g>',
    { sd: 1.4, k: 1.4, box: [40, 60, 130, 100] });
    s.motes({ seed: 16907, n: 16, x: [40, 290], y: [40, 180], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // RADIANT. War Chest: in a war tent an iron-bound chest stands open,
  // heaped over with gold; captured banners hang over it and lean on it,
  // and the lantern on the tent pole sets every coin glinting. Through the
  // open door, the camp at dawn.
  'war-chest'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#2e2216'], [0.3, '#5a4028'], [0.7, '#8a6438'], [1, '#5a3e22']]));
    // the open door at the back, the camp outside at dawn
    const door = poly([[214, 46], [260, 150], [168, 150]]);
    const did = s.uid('c');
    s.defs.push(`<clipPath id="${did}"><path d="${door}"/></clipPath>`);
    s.add(`<g clip-path="url(#${did})"><rect x="160" y="40" width="110" height="112" fill="${s.lin([[0, '#8a9ab8'], [0.55, '#e8cfa0'], [1, '#f8dca0']])}"/>` +
      `<circle cx="228" cy="134" r="9" fill="#fff6dc"/><path d="${U(poly([[170, 150], [184, 128], [198, 150]]), poly([[226, 150], [236, 134], [246, 150]]), poly([[196, 150], [204, 138], [212, 150]]))}" fill="#a88a6a"/>` +
      `<path d="M188,150V112M188,113L200,116L196,119L200,122L188,121Z" stroke="#a88a6a" stroke-width="1" fill="#a88a6a"/></g>`);
    s.path(door, 'none', 'stroke="#2a1c10" stroke-width="3"');
    // the canvas: seams, the hem where wall meets roof, the lantern's light
    s.glow(92, 64, 150, '#ffcf7a', 0.5);
    const fold = s.lin([[0, '#2a1a0c', 0], [0.5, '#2a1a0c', 0.3], [1, '#2a1a0c', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    s.add(`<g fill="${fold}">${[30, 70, 120, 270].map((x) => `<rect x="${x - 12}" y="40" width="24" height="110"/>`).join('')}</g>` +
      `<path d="M-10,-10H310V40H-10Z" fill="#1e140a" opacity=".3"/>` +
      '<g fill="none" stroke="#3a2818" stroke-width="1" opacity=".55"><path d="M30,40Q28,96 30,150M70,40Q68,96 70,150M120,40Q118,96 120,150M150,40V60M270,40Q272,96 270,150M-10,40H310M40,40L-10,-6M110,40L90,-6M190,40L210,-6M260,40L310,-6"/></g>');
    s.path('M-10,150H310V214H-10Z', s.lin([[0, '#3a2414'], [1, '#1a0e08']]));
    s.path('M40,154H260L320,214H-20Z', s.lin([[0, '#6a2218'], [1, '#3a120c']]));
    s.add('<path d="M48,158H252L304,210H-4Z" fill="none" stroke="#c8963e" stroke-width="1.4" opacity=".55"/>');
    // the tent pole and the lantern hung on it
    s.path('M88,-6H96V152H88Z', '#1e140c');
    s.add('<path d="M92,36V52" stroke="#1e140c" stroke-width="1.2"/>');
    // the chest: front, side, the lid thrown back, iron bands and studs
    const L = 104, Rt = 196, T = 152, B = 194, ddx = 8, ddy = -10;
    s.glow(150, 190, 70, '#2a1408', 0.5);
    s.path(oval(152, 196, 60, 7), '#140a04', 'opacity=".6"');
    const lid = `M${L + ddx},${T + ddy}L${L + ddx - 3},${T + ddy - 40}Q${(L + Rt) / 2 + ddx},${T + ddy - 56} ${Rt + ddx + 3},${T + ddy - 40}L${Rt + ddx},${T + ddy}Z`;
    s.figure(`<path d="${lid}"/>`, { fill: '#3a2414', rim: '#ffd78a', offsets: [[-1, -0.6], [0, -1.2]], rimOp: 0.85, shade: 0.4, light: [-0.6, -1] });
    s.add(`<path d="M${L + ddx - 1.6},${T + ddy - 20}H${Rt + ddx + 1.6}M${L + ddx + 18},${T + ddy - 1}L${L + ddx + 16},${T + ddy - 48}M${Rt + ddx - 18},${T + ddy - 1}L${Rt + ddx - 16},${T + ddy - 48}" fill="none" stroke="#1a140e" stroke-width="3"/>`);
    s.path(`M${Rt},${T}L${Rt + ddx},${T + ddy}V${B + ddy}L${Rt},${B}Z`, s.lin([[0, '#5a361c'], [1, '#2a180c']]));
    s.path(`M${L},${T}H${Rt}V${B}H${L}Z`, s.linU(L, 0, Rt, 0, [[0, '#a06a36'], [0.5, '#7a4a24'], [1, '#4a2c14']]));
    s.add(`<g fill="#221a14"><path d="M${L},${T}H${Rt}V${T + 5}H${L}ZM${L},${B - 5}H${Rt}V${B}H${L}ZM${L + 10},${T}H${L + 17}V${B}H${L + 10}ZM${Rt - 17},${T}H${Rt - 10}V${B}H${Rt - 17}Z"/>` +
      `<path d="M144,${T + 4}H156V${T + 18}L150,${T + 22}L144,${T + 18}Z"/></g>` +
      `<path d="${dots([[L + 13.5, T + 12, 1], [L + 13.5, T + 24, 1], [L + 13.5, T + 36, 1], [Rt - 13.5, T + 12, 1], [Rt - 13.5, T + 24, 1], [Rt - 13.5, T + 36, 1]])}" fill="#d8b878" opacity=".8"/>` +
      `<path d="M150,${T + 10}V${T + 15}" stroke="#d8b878" stroke-width="1.4"/>`);
    // the hoard heaped over the rim and spilling down the front
    const heap = blob([[L + 1, T + 1], [L + 8, T - 8], [122, T - 18], [140, T - 26], [158, T - 25], [178, T - 20], [Rt + 4, T - 12], [Rt + 8, T - 4], [Rt + 2, T + 2]], 5);
    const gold = s.radU(118, 110, 110, [[0, '#fff2b0'], [0.45, '#f0c050'], [1, '#a8741c']]);
    s.add('<g data-part="hoard">');
    s.path(heap, gold);
    const Rc = rng(17001), coins = [];
    for (let i = 0; i < 34; i++) {
      const x = L + 6 + Rc() * (Rt - L), y = T - 4 - Rc() * 20 * Math.sin(((x - L) / (Rt - L)) * Math.PI);
      coins.push([x, y, 3 + Rc() * 1.6, 0.4 + Rc() * 0.3, (Rc() - 0.5) * 40]);
    }
    for (let i = 0; i < 9; i++) coins.push([162 + Rc() * 12, T + 6 + i * 4.6, 3.2, 0.5, (Rc() - 0.5) * 50]);
    for (let i = 0; i < 12; i++) coins.push([150 + (Rc() - 0.4) * 80, 198 + Rc() * 12, 3.4 + Rc(), 0.36, (Rc() - 0.5) * 30]);
    s.add(`<path d="${coins.map(([x, y, r, k, a]) => oval(x, y, r, r * k, a)).join('')}" fill="${gold}" stroke="#8a5c16" stroke-width=".5"/>` +
      `<path d="${coins.filter(([, , r]) => r > 3.4).map(([x, y, r, k, a]) => oval(x, y - 0.3, r * 0.6, r * k * 0.6, a)).join('')}" fill="none" stroke="#fff3c4" stroke-width=".5" opacity=".8"/>`);
    s.add('</g>');
    // the captured banners: a red one thrown over the corner of the chest,
    // a blue one on its pole leaning against the side
    s.add('<g data-part="redflag">');
    s.path(`M${L + 4},${T - 8}C${L - 2},${T - 2} ${L - 4},${T + 6} ${L - 6},${T + 14}L${L - 8},${B + 8}L${L},${B + 4}L${L + 6},${B + 10}L${L + 14},${B + 2}L${L + 16},${T + 20}C${L + 18},${T + 8} ${L + 22},${T - 4} ${L + 22},${T - 12}Z`,
      s.linU(L - 8, 0, L + 22, 0, [[0, '#4a0e12'], [0.5, '#8a1c1e'], [1, '#5a1214']]));
    s.add(`<path d="M${L - 2},${T + 18}L${L - 3},${B}M${L + 8},${T + 14}L${L + 7},${B}" stroke="#3a080c" stroke-width="1.2" opacity=".7"/><path d="${sunMark(L + 6, T + 34, 3)}" fill="none" stroke="#d89a8a" stroke-width=".9" opacity=".55"/>`);
    s.add('</g><g data-part="blueflag">');
    s.path(U(taper([[238, 204], [200, 58]], [3, 2.4], { per: 2 }), taper([[194, 66], [228, 74]], [2, 2], { per: 2 })), '#1e140c');
    s.path(rot(`M198,68L226,76L222,126L214,118L208,130L200,120L192,124Z`, 212, 70, -14), s.lin([[0, '#2c3a6e'], [1, '#18204a']]));
    s.add(`<path d="${rot('M204,84L216,86L212,104L206,100Z', 212, 70, -14)}" fill="none" stroke="#b8c0e8" stroke-width=".9" opacity=".5"/>`);
    s.add('</g>');
    // the lantern
    const lx = 92, ly = 64;
    s.glow(lx, ly, 34, '#fff0c2', 0.7, 'breathe');
    s.path(`M${lx - 8},${ly - 6}H${lx + 8}V${ly + 10}H${lx - 8}Z`, s.lin([[0, '#fff8dc'], [1, '#ffcf6a']]));
    s.path(U(poly([[lx - 10, ly - 6], [lx - 6, ly - 13], [lx + 6, ly - 13], [lx + 10, ly - 6]]), poly([[lx - 10, ly + 10], [lx + 10, ly + 10], [lx + 8, ly + 14], [lx - 8, ly + 14]]),
      poly([[lx - 1, ly - 13], [lx - 1, ly - 18], [lx + 1, ly - 18], [lx + 1, ly - 13]])), '#1e140c');
    s.add(`<path d="M${lx - 8},${ly - 6}V${ly + 10}M${lx},${ly - 6}V${ly + 10}M${lx + 8},${ly - 6}V${ly + 10}" stroke="#1e140c" stroke-width="1.4"/>`);
    const R2 = rng(17002), glints = [];
    for (let i = 0; i < 8; i++) { const [x, y, r] = coins[Math.floor(R2() * 34)]; glints.push(glint(x - r * 0.3, y - r * 0.3, 3 + R2() * 3, 0.16)); }
    s.bloom(`<path d="${U(glints)}" fill="#fffbe8"/><path d="${oval(lx, ly + 2, 3, 4.4)}" fill="#ffffff"/>`, { sd: 1.3, k: 1.5, box: [70, 40, 160, 170] });
    s.motes({ seed: 17003, n: 14, x: [60, 240], y: [40, 150], r: [0.4, 0.9], fill: '#ffe39a', cls: 'float', t: [6, 10], op: [0.3, 0.7] });
    return s.svg();
  },

  // EMBER + RADIANT. Blitz Captain: a knight on a rearing warhorse lifts a
  // burning banner high, and the charge pours past her on both sides
  // toward a red horizon banked with smoke.
  'blitz-captain'(s) {
    fin(s, ['ember', 'radiant']);
    const p = PAL.ember;
    s.rect(s.lin([[0, '#260b10'], [0.3, '#5c1a18'], [0.56, '#a83c20'], [0.74, '#e07a3a'], [0.84, '#eca060']]));
    // the red horizon they ride for, smoke banked along it
    s.glow(252, 156, 200, '#ff8a3a', 0.6);
    s.glow(252, 156, 56, '#ffc87a', 0.55);
    s.add(smoke('#3a0e0a', [[226, 134, 90, 7, 0.5], [278, 122, 60, 5, 0.4], [174, 146, 70, 5, 0.35], [80, 120, 90, 6, 0.3]]));
    s.layer(ridge({ seed: 17101, base: 162, amp: 8, freq: 2 }), '#6a2414', { blur: 0.7 });
    s.haze(140, 168, '#ff9a4a', 0.32);
    s.path(ledge([[-10, 168], [80, 166], [160, 169], [240, 166], [310, 168]]), s.lin([[0, '#3a140c'], [0.5, '#1e0a06'], [1, '#0c0402']]));
    // the far riders streaming into the smoke, dust behind them
    const gal = galloper(), lan = galloper(true);
    const rideAt = (x, y, k, d) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="${d}"/></g>`;
    s.add(`<g class="drift">${[[150, 174, 26], [200, 172, 22], [250, 170, 20]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.4}" fill="#e08a54" opacity=".3"/>`).join('')}</g>`);
    s.figure([[168, 170, 0.36, gal], [192, 171, 0.34, lan], [214, 169, 0.36, gal], [240, 170, 0.32, lan], [262, 168, 0.3, gal], [284, 169, 0.3, lan]].map(([x, y, k, d]) => rideAt(x, y, k, d)).join(''),
      { fill: '#4a1a10', rim: '#ffb36a', offsets: [[0.8, -0.6]], rimOp: 0.7 });
    // the nearer riders pouring past her
    s.figure([[30, 190, 0.62, lan], [196, 192, 0.66, gal], [244, 188, 0.6, lan], [290, 191, 0.64, gal]].map(([x, y, k, d]) => rideAt(x, y, k, d)).join(''),
      { fill: '#2a0e08', rim: '#ffb36a', offsets: [[1, -0.6], [0.2, -1.1]], rimOp: 0.85 });
    // the captain: her horse rearing, her banner up
    const X = 126, Y = 197, K = 0.82, place = at(X, Y, K);
    const steed = place(mv(flipX(REARING(), 150), -150, -186));
    const rider = place(U(
      taper([[-20, -96], [-12, -84], [-14, -70]], [9, 7, 5.6]), ell(-12, -67, 4, 2.2, 20),
      taper([[-20, -96], [-18, -112], [-15, -126]], [12, 11, 13]),
      taper([[-14, -128], [-13, -133]], 4.2, { per: 2 }),
      ell(-12, -139, 5.6, 6.4), poly([[-17, -141], [-11, -153], [-6, -141]]),
      taper([[-16, -138], [-26, -134], [-36, -136], [-44, -132]], [4, 3.4, 2.4, 0.5]),
      blob([[-18, -126], [-28, -124], [-42, -120], [-58, -122], [-70, -116], [-62, -110], [-70, -102], [-54, -104], [-44, -100], [-32, -106], [-22, -110]], 4),
      taper([[-12, -120], [-2, -114], [6, -112]], [4.2, 3.6, 3]),
    ));
    const armP = place(U(taper([[-12, -124], [-6, -136], [-2, -148]], [4.6, 4, 3.6]), ell(-1.6, -150.6, 3, 3.2)));
    const poleP = place(U(taper([[-7, -110], [6, -200]], [2.6, 2.2], { per: 2 })));
    s.figure(`<g data-part="steed"><path d="${steed}"/></g><g data-part="rider"><path d="${rider}${armP}${poleP}"/></g>`, { fill: p.fig, rim: '#ffc080', offsets: [[1.2, -0.5], [0.4, -1.2], [-0.6, -0.9]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.8, -1] });
    s.add(`<circle cx="${f1(X + (300 - 125 - 150) * K)}" cy="${f1(Y + (46 - 186) * K)}" r="1" fill="#ffd0a0"/>`);
    // the banner, its tail on fire
    const flag = place(pennant(5, -198, 70, 28, -1, 17102, 4));
    s.add('<g data-part="flag">');
    s.path(flag, s.linU(X, 0, X - 60, 0, [[0, '#f6c96c'], [0.6, '#e8913e'], [1, '#b84a1e']]));
    s.add(`<path d="${sunMark(X - 26 * K, Y - 184 * K, 3.6)}" fill="none" stroke="#8a3d16" stroke-width="1.3" opacity=".55"/>`);
    s.add('</g>');
    const R = rng(17103), tongues = [];
    for (const [x, y, h] of [[-62, -194, 16], [-68, -186, 20], [-60, -180, 18], [-66, -174, 16], [-56, -170, 12], [-48, -168, 10]]) {
      const [ax, ay] = [X + x * K, Y + y * K];
      tongues.push(plume(ax, ay, -160 + R() * 20, -120 + R() * 20, h + R() * 6, [5, 6, 4, 2, 0.4]));
    }
    s.glow(X - 56 * K, Y - 184 * K, 34, '#ff8a3a', 0.55, 'breathe');
    s.add('<g data-part="fire">');
    s.bloom(`<path d="${U(tongues)}" fill="${s.linU(0, Y - 160 * K, 0, Y - 220 * K, [[0, '#fff0b0'], [0.4, '#ffb04a', 0.95], [1, '#ff6a1f', 0.5]])}"/>` +
      `<path d="${polyline([[X - 64 * K, Y - 196 * K], [X - 58 * K, Y - 183 * K], [X - 62 * K, Y - 172 * K]])}" fill="none" stroke="#ffe08a" stroke-width="1.6" stroke-linejoin="round"/>`, { sd: 1.8, k: 1.45, box: [40, 6, 110, 80] });
    s.add('</g>');
    s.add(particles({ seed: 17104, n: 22, x: [40, 110], y: [10, 60], r: [0.5, 1.3], fill: '#ffb05a', cls: 'rise', t: [3, 6], op: [0.6, 1] }));
    s.motes({ seed: 17105, n: 18, x: [0, 300], y: [60, 200], r: [0.4, 1.1], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // EMBER + RADIANT. Hour of Glory: at sunrise a whole army pours down a
  // hillside at a run, gold light and sparks streaming back from every
  // raised blade and spear point, their banners blazing; the sun comes up
  // over the crest behind them.
  'hour-of-glory'(s) {
    fin(s, ['ember', 'radiant']);
    s.rect(s.lin([[0, '#2a0e14'], [0.28, '#6a2418'], [0.5, '#c4602e'], [0.66, '#f0a85a'], [0.76, '#f6cc84']]));
    const sx = 58, sy = 92;
    s.glow(sx, sy, 200, '#ffe2a0', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 18, from: -100, to: 40, len: 330, spread: 2, color: '#fff0c8', op: 0.22, seed: 17201 });
    s.glow(sx, sy, 50, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="14" fill="#fff6dc"/>`);
    s.add(smoke('#5a1e12', [[220, 40, 90, 5, 0.3], [260, 70, 60, 4, 0.25]]));
    // the hill: its crest coming down from the left, the slope facing us
    const crest = [[-12, 96], [40, 100], [100, 110], [160, 122], [220, 134], [280, 146], [312, 152]];
    s.path(ledge(crest), s.lin([[0, '#5a2414'], [0.3, '#3a160c'], [1, '#140806']]));
    // the army in three ranks down the slope, nearer ones bigger
    // dust thrown up along the slope behind them
    s.add(`<g class="drift">${[[40, 118, 30], [120, 136, 34], [210, 158, 30]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.8}" ry="${r * 0.36}" fill="#e09a5a" opacity=".22"/>`).join('')}</g>`);
    const lanes = [
      { n: 15, x0: 22, x1: 300, y: (x) => edgeAt(crest, x) + 1.5, k: [0.32, 0.38], fill: '#3a1810', flags: [3, 8, 12] },
      { n: 8, x0: 4, x1: 284, y: (x) => 132 + x * 0.17, k: [0.52, 0.6], fill: '#2a100a', flags: [2, 6] },
      { n: 4, x0: -6, x1: 168, y: (x) => 178 + x * 0.12, k: [0.8, 0.9], fill: '#1e0a06', flags: [] },
    ];
    const R = rng(17202), tips = [], flags = [];
    lanes.forEach((L, j) => {
      let d = '';
      for (let i = 0; i < L.n; i++) {
        const t = (i + 0.3 + R() * 0.4) / L.n, x = L.x0 + (L.x1 - L.x0) * t, y = L.y(x), k = L.k[0] + (L.k[1] - L.k[0]) * t, v = Math.floor(R() * 12);
        if (L.flags.includes(i)) {
          d += at(x, y, k)(U(runner(1), taper([[-6, -30], [-10, -118]], [2.2, 1.8], { per: 2 })));
          flags.push(pennant(x - 10 * k, y - 116 * k, 40 * k, 17 * k, -1, 17206 + i + j * 20, 3 * k));
        } else d += at(x, y, k)(runner(v));
        const [tx, ty] = runnerTip(L.flags.includes(i) ? 1 : v);
        tips.push([x + tx * k, y + ty * k, k]);
      }
      s.figure(`<path d="${d}"/>`, { fill: L.fill, rim: '#ffd08a', offsets: j === 0 ? [[-0.6, -0.8], [0, -1]] : [[-0.8, -0.8], [0, -1.1], [0.6, -0.6]], rimOp: 0.9 });
    });
    // the leader out in front, his banner blazing
    const lx = 236, ly = 204, lk = 1.1;
    const lead = at(lx, ly, lk)(U(runner(1), taper([[-6, -30], [-12, -126]], [2.2, 1.8], { per: 2 })));
    s.figure(`<path d="${lead}"/>`, { fill: '#140604', rim: '#ffd890', offsets: [[-1, -0.8], [0, -1.2], [0.8, -0.6]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [-0.6, -1] });
    tips.push([lx + 22 * lk, ly - 84 * lk, lk]);
    const fx = lx - 12 * lk, fy = ly - 124 * lk, flen = 64, fh = 26;
    const lflag = pennant(fx, fy, flen, fh, -1, 17203, 4);
    const flagFill = s.linU(lx, 0, 0, 0, [[0, '#ffe08a'], [0.4, '#f6b85a'], [1, '#e8813a']]);
    s.path(flags.join(''), flagFill);
    s.add('<g data-part="banner">');
    s.path(lflag, flagFill);
    s.add(`<path d="${sunMark(fx - 30, fy + 13, 4.4)}" fill="none" stroke="#8a3d16" stroke-width="1.4" opacity=".5"/>`);
    s.add('</g>');
    // the light off their weapons, streaming back up the hill behind them
    const streaks = [], sparks = [];
    for (const [x, y, k] of tips) {
      const L = 30 * k + 8, ux = -0.95, uy = -0.32;
      streaks.push(taper([[x, y], [x + ux * L * 0.5, y + uy * L * 0.5 - 1], [x + ux * L, y + uy * L - 4]], [2.6 * k + 0.6, 1.5 * k + 0.2, 0.2], { per: 3 }));
      sparks.push([x, y, 1.2 * k + 0.4]);
    }
    const bannerFire = [];
    const Rf = rng(17204);
    for (let i = 0; i < 6; i++) { const t = i / 5, x = fx - flen * (0.86 + 0.08 * Math.sin(t * 3)), y = fy + 2 + (fh - 2) * t; bannerFire.push(plume(x, y, -168 + Rf() * 16, -128 + Rf() * 16, 12 + Rf() * 8, [4, 5, 3, 0.4])); }
    s.glow(lx + 22 * lk, ly - 84 * lk, 24, '#ffe08a', 0.6, 'breathe');
    s.add('<g data-part="streaks">');
    s.bloom(`<path d="${U(streaks)}" fill="#ffd27a" opacity=".85"/><path d="${dots(sparks)}" fill="#fff6dc"/>` +
      `<path d="${U(bannerFire)}" fill="${s.linU(fx - flen, 0, fx - flen - 24, 0, [[0, '#fff0b0'], [0.5, '#ffb04a', 0.9], [1, '#ff6a1f', 0.5]])}"/>`, { sd: 1.6, k: 1.45 });
    s.add('</g>');
    s.motes({ seed: 17205, n: 30, x: [20, 300], y: [60, 200], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 7] });
    return s.svg();
  },

  // ── LEGENDS ───────────────────────────────────────────────────────

  // TIDE + RADIANT. Oriel, Lady of Storms: a sylph on four long glassy wings
  // hangs over a sunlit sea in a cloak of cloud. One hand is raised into a
  // rain cloud, drawing the rain down out of it onto the sea; the other is
  // held out palm up, and under it the sun comes up out of the water.
  'legend-oriel'(s) {
    fin(s, ['tide', 'radiant']);
    s.rect(s.lin([[0, '#1a3a48'], [0.3, '#3e6c76'], [0.52, '#8ea8a2'], [0.64, '#e4cc98'], [0.7, '#f2d69e']]));
    s.add(particles({ seed: 9680, n: 12, x: [150, W], y: [0, 50], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun she calls up, rising out of the sea on the right
    const sx = 252, sy = 142;
    s.glow(sx, sy, 190, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 16, from: -175, to: -5, len: 320, spread: 2.2, color: '#fff6dc', op: 0.2, seed: 9681 });
    s.glow(sx, sy, 50, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="15" fill="#fff8e6"/>`);
    // the sea: gold under the sun, grey and dimpled under the rain
    s.path('M-10,142H310V214H-10Z', s.lin([[0, '#a8b8a8'], [0.12, '#5a8486'], [0.5, '#2a5058'], [1, '#0e2630']]));
    s.add(`<ellipse cx="${sx}" cy="160" rx="70" ry="16" fill="${s.rad([[0, '#fff2c8', 0.7], [0.5, '#ffe2a0', 0.3], [1, '#ffe2a0', 0]])}"/>`);
    s.add(glitter([[sx, 146, 44, 0.6], [sx - 4, 152, 60, 0.5], [sx + 4, 159, 48, 0.42], [sx - 2, 168, 70, 0.34], [sx + 2, 180, 56, 0.26], [sx, 194, 80, 0.2]], '#fff6d8'));
    s.add(`<g fill="none" stroke="#c8dcdc" stroke-width=".7" opacity=".45">${[[20, 160, 6], [52, 172, 8], [84, 156, 5], [30, 192, 9], [96, 186, 7], [64, 204, 10], [116, 170, 5]].map(([x, y, r]) => `<path d="${oval(x, y, r, r * 0.24)}"/>`).join('')}</g>`);
    // the rain cloud she has called up over the left of the sea, the rain
    // falling out of it
    const rc = puffs([[-6, 22, 30], [30, 10, 26], [66, 16, 24], [96, 22, 18], [112, 32, 12], [10, 52, 20], [46, 50, 20], [80, 48, 16], [102, 46, 11]], 1.35);
    s.figure(`<path d="${rc}"/>`, { fill: '#2c4450', rim: '#e8f6f0', offsets: [[1, 1], [0, 1.3]], rimOp: 0.75, shade: 0.4, light: [1, 0.6] });
    s.add(`<path d="${[[20, 36, 16], [56, 44, 14], [90, 40, 10], [-4, 14, 14]].map(([x, y, r]) => `M${x - r},${y}a${r},${r * 0.55} 0 0 1 ${2 * r},0`).join('')}" fill="none" stroke="#1c323c" stroke-width="1.2" opacity=".6"/>`);
    let rain = '';
    const R = rng(9682);
    for (let i = 0; i < 30; i++) { const x = -8 + R() * 120, y = 56 + R() * 18, l = 142 - y + R() * 4; rain += `M${f1(x)},${f1(y)}l${f1(-l * 0.08)},${f1(l)}`; }
    s.add(`<path d="${rain}" stroke="#d6eef0" stroke-width=".7" opacity=".35"/>`);
    // Oriel: a cloak of cloud, four long glassy wings; one hand up into the
    // rain cloud, the other held out over the sun
    const X = 150, Y = 98, K = 1.1, place = at(X, Y, K);
    // the wings, the light coming through them
    const wingR = [leafAt(5, -22, -26, 100, 0.3, 5), leafAt(5, -12, 22, 76, 0.3, 5)];
    const veins = [[5, -22, -26, 100], [5, -12, 22, 76]].map(([x, y, a, l]) => `M${pt([x, y])}L${pt(toward(x, y, a, l * 0.94))}` +
      [0.3, 0.5, 0.7].map((t) => { const [qx, qy] = toward(x, y, a, l * t); return `M${pt([qx, qy])}L${pt(toward(qx, qy, a - 24, l * 0.18))}M${pt([qx, qy])}L${pt(toward(qx, qy, a + 24, l * 0.16))}`; }).join('')).join('');
    const wR = place(U(wingR)), wL = place(flipX(U(wingR), 0));
    s.path(wL, s.radU(X, Y - 20, 120, [[0, '#ffffff', 0.75], [0.5, '#d6f6f4', 0.55], [1, '#a6e4ec', 0.4]]));
    s.path(wR, s.radU(X, Y - 20, 120, [[0, '#ffffff', 0.7], [0.5, '#fff0c8', 0.5], [1, '#f2d08a', 0.4]]));
    s.add(`<path d="${wL + wR}" fill="none" stroke="#f4fffd" stroke-width=".9" opacity=".8"/><path d="${place(veins) + place(flipX(veins, 0))}" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".5"/>`);
    // the cloak: cloud heaped on her shoulders, falling behind her on both
    // sides and pooling into billows below her feet, its tail blown out
    // toward the sun
    const capeD = place(U(blob([[-14, -24], [14, -24], [24, 8], [34, 44], [30, 66], [-30, 66], [-36, 44], [-24, 8]], 4), puffs([
      [-12, -26, 6], [12, -26, 6], [0, -29, 5], [-17, -16, 7], [17, -16, 7],
      [-21, -2, 8], [-26, 14, 9], [-33, 32, 11], [-42, 50, 13], [21, -2, 8], [26, 14, 9], [33, 32, 11], [44, 48, 13],
      [-34, 64, 14], [-12, 70, 16], [12, 70, 16], [34, 64, 14], [54, 62, 11], [68, 60, 8], [78, 57, 5], [85, 54, 3]], 1.25)));
    s.figure(`<path d="${capeD}"/>`, { fill: s.linU(X - 60, 0, X + 70, 0, [[0, '#6e8a92'], [0.45, '#bcc6c0'], [1, '#f8ead0']]), rim: '#fff4d6', offsets: [[1.2, -0.6], [0.4, -1.2], [-0.8, -0.8]], rimOp: 0.9 });
    s.add(`<path d="${place('M-30,8Q-22,18 -20,30M-38,36Q-30,46 -28,58M30,8Q24,20 24,32M38,38Q32,48 30,58M-14,62Q-4,70 8,66M40,58Q52,64 64,60')}" fill="none" stroke="#5a7078" stroke-width="1.2" opacity=".55"/>`);
    const her = place(U(
      blob([[-6, 0], [6, 0], [9, 16], [12, 32], [14, 46], [18, 54], [10, 52], [4, 58], [-4, 52], [-10, 56], [-12, 44], [-11, 30], [-9, 14]], 4),
      taper([[12, 50], [22, 56], [32, 54], [40, 58]], [5, 3.6, 2, 0.5]),
      taper([[0, 2], [0, -12], [0, -24]], [9, 9.5, 13]),
      ell(-6, -23.5, 4, 3), ell(6, -23.5, 4, 3),
      taper([[0, -26], [0, -31]], 3.6, { per: 2 }),
      ell(0, -36, 5, 6.2),
      taper([[2, -40], [10, -41], [18, -36], [26, -33], [34, -34]], [7, 7, 5, 3, 0.5]), taper([[3, -36], [10, -33], [18, -28], [24, -23]], [5, 4.4, 3, 0.5]),
      taper([[-6, -22], [-15, -32], [-22, -44]], [3.6, 3.2, 2.8]), taper([[-22, -44], [-26, -52], [-28, -58]], [2.8, 2.4, 2]), ell(-28.6, -60, 2.2, 2.8, 20),
      taper([[6, -22], [17, -17], [28, -14]], [3.6, 3.2, 2.8]), ell(31, -14.6, 3.4, 1.8),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#0f1c24', rim: '#fff4d6', offsets: [[1, -0.8], [0, -1.3], [-1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    // her circlet; the sun's light rising to her open palm
    const [px, py] = [X + 31 * K, Y - 16 * K];
    const trail = [];
    for (let i = 0; i < 9; i++) { const t = i / 8, x = sx - 8 + (px - sx + 8) * t + Math.sin(t * Math.PI) * 14, y = sy - 16 + (py - sy + 16) * t; trail.push([x, y, 1.6 - t * 0.6]); }
    s.glow(px, py - 3, 22, '#fff0c2', 0.6, 'breathe');
    s.bloom(`<path d="${place('M-4.4,-41L-5,-46L-2.4,-43.6L0,-48L2.4,-43.6L5,-46L4.4,-41Z')}" fill="#fff6dc"/><path d="${dots(trail)}" fill="#fff4d0"/>` +
      `<path d="${oval(px, py - 2.4, 3.6, 2.2)}" fill="#fffaf0"/>`, { sd: 1.4, k: 1.5, box: [130, 30, 130, 120] });
    s.add([[60, 90], [30, 110], [90, 120], [50, 130], [110, 100]].map(([x, y], i) => `<ellipse class="fall" style="--d:${(-i * 0.3).toFixed(1)}s" cx="${x}" cy="${y}" rx=".7" ry="1.7" fill="#e8f6f6" opacity=".7"/>`).join(''));
    s.motes({ seed: 9683, n: 16, x: [140, 290], y: [40, 160], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // EMBER + RADIANT. Kasimir, the First Blade: a young knight in scorched
  // gold armour leaps down off a broken wall into the battle at dawn, his
  // sword blazing up ahead of him and his banner streaming out behind; below,
  // the enemy line waits in the smoke.
  'legend-kasimir'(s) {
    fin(s, ['ember', 'radiant']);
    s.rect(s.lin([[0, '#2a0c14'], [0.3, '#6a2218'], [0.55, '#c25c2c'], [0.72, '#f0a45a'], [0.82, '#f6c886']]));
    // dawn coming up through the smoke of the battle
    const sx = 236, sy = 150;
    s.glow(sx, sy, 190, '#ffd28a', 0.7);
    s.shafts({ cx: sx, cy: sy, n: 14, from: -180, to: -10, len: 320, spread: 2, color: '#fff0c8', op: 0.18, seed: 9700 });
    s.glow(sx, sy, 50, '#fff0c8', 0.75);
    s.add(`<circle cx="${sx}" cy="${sy}" r="14" fill="#fff4d8"/>`);
    s.add(smoke('#3a120c', [[250, 122, 90, 6, 0.4], [180, 138, 80, 5, 0.35], [280, 100, 60, 5, 0.3]]));
    // the far field: the battle lines, spears up out of the smoke
    let spears = '';
    const Rs = rng(9701);
    for (let x = 120; x < 310; x += 3 + Rs() * 4) { const b = 162 + Rs() * 3, h = 10 + Rs() * 8; spears += `M${f1(x)},${f1(b)}L${f1(x + 0.8)},${f1(b)}L${f1(x + 0.6 + h * 0.15)},${f1(b - h)}Z`; }
    s.layer(ridge({ seed: 9702, base: 166, amp: 6, freq: 2 }) + spears, '#6a2a1a', { blur: 0.7 });
    s.haze(146, 172, '#ff9a4a', 0.32);
    // the broken wall he leaps from
    const wall = poly([[-14, 216], [-14, 98], ...battlement(-14, 64, 98, 10, 7, 8), [70, 98], [76, 106], [84, 102], [90, 114], [98, 112], [104, 126], [100, 142], [108, 158], [104, 178], [112, 196], [110, 216]]);
    s.figure(`<path d="${wall}"/>`, { fill: '#2a120c', rim: '#ffc890', offsets: [[0.8, -1], [1.2, -0.2]], rimOp: 0.9, shade: 0.45, light: [0.7, -1] });
    let mortar = '';
    const Rm = rng(9703);
    for (let y = 110, row = 0; y < 214; y += 11, row++) {
      const xe = Math.min(100, 70 + (y - 98) * 0.3);
      mortar += `M-14,${y}H${f1(xe)}`;
      for (let x = -14 + (row % 2 ? 8 : 16) + Rm() * 4; x < xe; x += 16 + Rm() * 5) mortar += `M${f1(x)},${y}V${y + 11}`;
    }
    s.add(`<path d="${mortar}" fill="none" stroke="#120604" stroke-width="1.1" opacity=".85"/>`);
    // the enemy line below, spears up, in the smoke
    let line = '';
    const Re = rng(9704);
    for (let x = 136; x < 316; x += 9 + Re() * 4) {
      const b = 206 + Re() * 4, k = 0.62 + Re() * 0.1;
      line += at(x, b, k)(U(taper([[0, 0], [0, -40]], [12, 13], { per: 2 }), ell(0, -46, 5, 5.6), ell(0, -48, 6, 3.4), ell(-7, -24, 8, 10),
        taper([[4, -30], [-20, -80]], [1.6, 1.2], { per: 2 }), lens(-21.4, -83.4, 8, -112, 0.36, 3)));
    }
    s.add(`<g class="drift">${[[190, 190, 30], [256, 184, 26], [150, 198, 22]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.6}" fill="${s.rad([[0, '#4a1a10', 0.7], [1, '#4a1a10', 0]])}"/>`).join('')}</g>`);
    s.figure(`<path d="${line}"/>`, { fill: '#160806', rim: '#ff9a50', offsets: [[0.8, -0.8]], rimOp: 0.75 });
    // Kasimir in the air: trailing leg back toward the wall, leading knee
    // up, sword arm flung up and forward, banner arm back
    const X = 150, Y = 128, K = 1.2, place = at(X, Y, K);
    const pole = [[-12, -14], [-46, -70]];
    const kas = place(U(
      taper([[2, 2], [16, 12]], [10.4, 8.4], { per: 2 }), taper([[16, 12], [13, 31]], [8.4, 6], { per: 2 }), ell(17, 33, 6.2, 2.6, 8), ell(16, 12, 4.4, 4.4),
      taper([[-2, 2], [-16, 16]], [10.4, 8.4], { per: 2 }), taper([[-16, 16], [-32, 26]], [8.4, 6], { per: 2 }), ell(-36, 27.4, 6.2, 2.6, 26), ell(-16, 16, 4.4, 4.4),
      blob([[-8, -4], [8, -4], [12, 6], [4, 10], [-6, 9], [-14, 6]], 4),
      taper([[0, 0], [5, -14], [10, -28]], [13, 12, 15.5]),
      ell(4, -28, 7, 5, -20), ell(15, -26, 6, 4.4, 20),
      taper([[12, -31], [14, -36]], 4.6, { per: 2 }), ell(17, -41, 5.6, 6.2),
      taper([[15, -46], [6, -50], [-6, -48], [-16, -51]], [4.4, 4.4, 3, 0.5]),
      taper([[12, -26], [22, -36]], [5.4, 4.6], { per: 2 }), taper([[22, -36], [30, -48]], [4.6, 3.8], { per: 2 }), ell(31, -50, 3.4, 3.4),
      taper([[27, -45], [35, -55]], [2, 2], { per: 2 }),
      taper([[4, -26], [-8, -26]], [5, 4.4], { per: 2 }), taper([[-8, -26], [-18, -22]], [4.4, 3.6], { per: 2 }), ell(-20, -21.4, 3.2, 3.2),
      taper(pole, [2.2, 1.8], { per: 2 }),
    ));
    const flag = place(pennant(-46, -70, 64, 26, -1, 9705, 4));
    s.path(flag, s.linU(X - 46 * K, 0, X - 110 * K, 0, [[0, '#f6c96c', 0.95], [0.6, '#e8913e', 0.92], [1, '#b84a1e', 0.9]]));
    s.add(`<path d="${place('M-104,-62L-96,-60L-100,-54M-110,-50L-102,-49')}" fill="none" stroke="#5a1a0a" stroke-width="1.2" opacity=".55"/>` +
      `<path d="${sunMark(X - 76 * K, Y - 58 * K, 4.2)}" fill="none" stroke="#8a2a10" stroke-width="1.4" opacity=".6"/>`);
    s.figure(`<path d="${kas}"/>`, { fill: '#6a4c1e', rim: '#ffd27a', offsets: [[0.8, -1], [1.2, -0.2], [-0.6, -1]], rimOp: 0.95, shade: 0.55, edge: 0.38, light: [0.6, -1] });
    // soot streaked on the gold, its trim catching the dawn
    s.add(`<path d="${place(U(lens(1, -16, 9, 70, 0.3, 3), lens(-3, 4, 8, 20, 0.34, 3), lens(13, -22, 6, -30, 0.36, 3), lens(-20, 18, 7, 30, 0.3, 3)))}" fill="#1a0e06" opacity=".55"/>` +
      `<path d="${place('M2,-33Q4,-24 9,-23M10,-30Q17,-31 20,-25M9,-25L13,-11M12,-41.4L21,-41.4M-6,-3L10,-3')}" fill="none" stroke="#ffe08a" stroke-width=".9" stroke-linecap="round" opacity=".75"/>`);
    // the sword, blazing, fire streaming back off it
    const [ax, ay] = [X + 33 * K, Y - 52 * K], [bx, by] = [X + 54 * K, Y - 86 * K];
    const flames = [];
    for (let i = 1; i <= 6; i++) { const t = i / 7, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; flames.push(plume(x, y, -150, -190, 12 + 10 * t, [4, 5, 3, 0.4])); }
    s.glow((ax + bx) / 2, (ay + by) / 2, 40, '#ffd27a', 0.6, 'breathe');
    s.bloom(`<path d="${U(flames)}" fill="${s.linU(ax, 0, ax - 30, 0, [[0, '#ffe08a'], [0.5, '#ff9a3a', 0.9], [1, '#ff6a1f', 0.4]])}"/>` +
      `<path d="${taper([[ax, ay], [bx, by]], [3.4, 0.8], { per: 2 })}" fill="#fffaf0"/>`, { sd: 1.6, k: 1.5, box: [130, 10, 100, 80] });
    s.motes({ seed: 9706, n: 26, x: [100, 300], y: [20, 200], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 7] });
    return s.svg();
  },
};

// Blend two hex colours (t = 0 gives a).
function mix2(a, b, t) {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), ch = (v, sh) => (v >> sh) & 255;
  return '#' + [16, 8, 0].map((sh) => Math.round(ch(A, sh) + (ch(B, sh) - ch(A, sh)) * t).toString(16).padStart(2, '0')).join('');
}
