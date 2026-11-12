// Card art for the SATTC Ultra version 4 cards, part D: the Long Game
// (economy cards, Verdant and Tide: 142–145), Rot and Bloom (necromancers,
// Umbral: 146–150) and the Legends those two decks bring, Marisol and
// Morrow. Style rules live in ../scenes.js; drawing tools in ../kit.js.
// Seeds: a card's number × 100 plus a count; Marisol uses 9600–9619 and
// Morrow 9620–9639.

import { H, W, blob, line, particles, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL } from './shared.js';

// ── local helpers (the same toolbox as ultra-c.js) ──────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const f2 = (n) => (Math.round(n * 100) / 100).toString();
const NUM = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;
const rad = (deg) => (deg * Math.PI) / 180;

// An ellipse as a polygon, so it can join a union path.
function ell(cx, cy, rx, ry = rx, deg = 0, n = 22) {
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a);
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

// An ellipse at any angle as arc commands (strokes, and fills that never
// join a union).
const oval = (cx, cy, rx, ry, deg = 0) => {
  const c = Math.cos(rad(deg)) * rx, sn = Math.sin(rad(deg)) * rx;
  return `M${f1(cx - c)},${f1(cy - sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(2 * c)},${f1(2 * sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(-2 * c)},${f1(-2 * sn)}Z`;
};

// Move or rotate a polygon path; at() carries a figure drawn at the origin
// to (x, y) at scale k (dir -1 mirrors it to face the other way).
const mv = (d, dx, dy) => d.replace(NUM, (_, x, y) => `${f1(+x + dx)},${f1(+y + dy)}`);
const rot = (d, ox, oy, deg) => {
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const at = (x, y, k, dir = 1) => (d) => d.replace(NUM, (_, a, b) => `${f1(x + a * k * dir)},${f1(y + b * k)}`);
// The same for one point.
const rp = ([x, y], ox, oy, deg) => {
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a), dx = x - ox, dy = y - oy;
  return [ox + dx * c - dy * sn, oy + dx * sn + dy * c];
};

// A smooth edge (hill, rock, shore) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A lens-shaped leaf, petal or flame centred on (x, y), `l` long, turned
// `a` degrees; leafAt() grows the same shape out of a point instead.
const lens = (x, y, l, a, w = 0.38, per = 4) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], per), x, y, a);
const leafAt = (x, y, a, l, w = 0.38, per = 4) => lens(x + (Math.cos(rad(a)) * l) / 2, y + (Math.sin(rad(a)) * l) / 2, l, a, w, per);

// A point `l` along direction `a` (degrees) from (x, y).
const toward = (x, y, a, l) => [x + Math.cos(rad(a)) * l, y + Math.sin(rad(a)) * l];

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// A head in profile, centred on the skull: brow, nose, mouth, chin. Faces
// right; `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);

// Grave markers standing on a baseline b, leaning a degrees.
const lean = (d, x, b, a) => (a ? `<path d="${d}" transform="rotate(${a} ${x} ${b})"/>` : `<path d="${d}"/>`);
const crossD = (x, b, h) => {
  const t = h * 0.075;
  return `M${f1(x - t)},${b}V${f1(b - h)}H${f1(x + t)}V${b}ZM${f1(x - h * 0.28)},${f1(b - h * 0.76)}h${f1(h * 0.56)}v${f1(t * 1.9)}h${f1(-h * 0.56)}Z`;
};
const cross = (x, b, h, a = 0) => lean(crossD(x, b, h), x, b, a);
const slab = (x, b, w, h, a = 0) => {
  const r = w / 2;
  return lean(`M${f1(x - r)},${b}V${f1(b - h + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(b - h + r)}V${b}Z`, x, b, a);
};

// Thin horizontal glints of light on water: [[x, y, w, op], ...].
const glitter = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

// A gull gliding, wings bent at the wrist.
const gull = (x, y, k, a = 0) => rot(at(x, y, k)(poly([[-8, 0], [-5, -2.6], [-2, -1.2], [0, 0], [2, -1.2], [5, -2.6], [8, 0], [5, -1.4], [2, 0.2], [0, 1.4], [-2, 0.2], [-5, -1.4]])), x, y, a);

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

// ── new helpers ─────────────────────────────────────────────────────

// A bone from a to b, w thick, with a knuckle at each end.
const bone = (a, b, w) => U(taper([a, b], [w, w * 0.85], { per: 2 }), ell(a[0], a[1], w * 0.74, w * 0.74, 0, 10), ell(b[0], b[1], w * 0.68, w * 0.68, 0, 10));

// A rectangle w × h centred on (x, y), turned a degrees: pages, books, crates.
const quad = (x, y, w, h, a = 0) => rot(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]]), x, y, a);

// A little boat on the waterline at (x, y): sail 1 set, 0 furled on its
// boom; dir 1 has the bow to the right.
const boat = (x, y, k, sail = 1, dir = 1) => at(x, y, k, dir)(U(
  poly([[-15, -3.6], [-11, -2], [11, -2], [16, -5], [12.4, 2.2], [-10.4, 2.2]]),
  poly([[-0.7, -2], [-0.7, -25], [0.7, -25], [0.7, -2]]),
  sail ? poly([[1.6, -23], [1.6, -4.6], [13, -5.6]]) : poly([[-1.4, -21], [9, -18.4], [9, -16.4], [-1.4, -18.6]]),
));

// A porter with a sack on his shoulder, feet on y = b.
const porter = (x, b, k, dir = 1) => at(x, b, k, dir)(U(
  taper([[-1.4, 0], [-0.6, -7]], [1.7, 1.9], { per: 2 }), taper([[1.6, 0], [0.8, -7]], [1.7, 1.9], { per: 2 }),
  taper([[0, -7], [0.8, -13.4]], [3.8, 3.6], { per: 2 }), ell(1.4, -15.4, 1.7, 1.9, 0, 10),
  ell(-1.6, -15.6, 3.6, 2.6, -24, 12), taper([[1, -12.6], [-1.4, -15.4]], 1.3, { per: 2 }),
));

// A mushroom on a stem from (x, y), h tall, cap rx × ry, leaning a degrees.
// Returns its outline, the strip of gills under the cap, and the cap's top.
function mush(x, y, h, rx, ry, a = 0) {
  const [tx, ty] = toward(x, y, -90 + a, h);
  const cap = rot(blob([[tx - rx, ty], [tx - rx * 0.72, ty - ry * 0.78], [tx, ty - ry], [tx + rx * 0.72, ty - ry * 0.78], [tx + rx, ty], [tx + rx * 0.4, ty + ry * 0.2], [tx - rx * 0.4, ty + ry * 0.2]], 4), tx, ty, a);
  return {
    d: U(taper([[x, y], [(x + tx) / 2 - a * 0.03, (y + ty) / 2], [tx, ty]], [rx * 0.36, rx * 0.28, rx * 0.24], { per: 3 }), cap),
    gill: rot(ell(tx, ty + ry * 0.06, rx * 0.86, Math.max(0.7, ry * 0.2), 0, 16), tx, ty, a),
    top: [tx, ty - ry],
  };
}

// A lantern hanging from its ring at (x, y): the frame and, inside it, the
// glass (the light); c is the middle of the glass.
function lanternAt(x, y, k = 1) {
  const g = at(x, y, k);
  return {
    frame: g(U(ell(0, 1.2, 1.6, 1.6, 0, 10), poly([[-0.6, 2.4], [0.6, 2.4], [0.6, 3.4], [-0.6, 3.4]]),
      poly([[-3.2, 3.2], [3.2, 3.2], [4.8, 5.6], [-4.8, 5.6]]), poly([[-4.8, 15.2], [4.8, 15.2], [3.4, 17.6], [-3.4, 17.6]]),
      poly([[-4.8, 5.4], [-3.6, 5.4], [-3.6, 15.4], [-4.8, 15.4]]), poly([[3.6, 5.4], [4.8, 5.4], [4.8, 15.4], [3.6, 15.4]]),
      poly([[-0.5, 5.4], [0.5, 5.4], [0.5, 15.4], [-0.5, 15.4]]))),
    glass: g(poly([[-3.7, 5.4], [3.7, 5.4], [3.7, 15.4], [-3.7, 15.4]])),
    c: [x, y + 10.4 * k],
  };
}

// A dancing skeleton, feet near y = 0, facing us. Arms ([upper, fore]) and
// legs ([thigh, shin]) are angles in degrees (0 = right, 90 = down); `tilt`
// leans the whole body about the pelvis, `head` cocks the skull. Returns the
// bones as one path and its eye sockets and nose [[x, y, r], ...].
function skeleton({ tilt = 0, head = 0, la = [-150, -120], ra = [-30, -60], ll = [96, 90], rl = [84, 90] } = {}) {
  const parts = [];
  parts.push(taper([[0, -27], [0.8, -40], [0, -51]], [2.8, 2.5, 2.3], { per: 3 }));
  parts.push(taper([[-7.8, -49.4], [0, -51.6], [7.8, -49.4]], [1.8, 2, 1.8], { per: 3 }));
  for (let i = 0; i < 4; i++) {
    const y = -47.6 + i * 3.7, w = 7.2 - i * 0.6;
    for (const sd of [-1, 1]) parts.push(taper([[0, y], [sd * w * 0.7, y - 0.6], [sd * w, y + 1.9], [sd * w * 0.78, y + 4.4]], [1.7, 1.6, 1.3, 0.6], { per: 3 }));
  }
  parts.push(blob([[-6.4, -30], [-2, -31.8], [2, -31.8], [6.4, -30], [5.6, -25.8], [2, -24.2], [-2, -24.2], [-5.6, -25.8]], 3));
  const limb = (o, [a1, a2], l1, l2, w) => {
    const e = toward(o[0], o[1], a1, l1), h = toward(e[0], e[1], a2, l2);
    parts.push(bone(o, e, w), bone(e, h, w * 0.88));
    return [h, a2];
  };
  const arms = [limb([-7.8, -49], la, 10.5, 9.6, 2.1), limb([7.8, -49], ra, 10.5, 9.6, 2.1)];
  const legs = [limb([-3.6, -26.6], ll, 13.6, 13, 2.5), limb([3.6, -26.6], rl, 13.6, 13, 2.5)];
  for (const [h, a] of arms) {
    parts.push(ell(...toward(h[0], h[1], a, 1.6), 2.1, 1.6, a, 10));
    for (const d of [-34, 0, 32]) parts.push(taper([toward(h[0], h[1], a, 2.4), toward(h[0], h[1], a + d, 6.2)], [1.1, 0.5], { per: 2 }));
  }
  for (const [h] of legs) parts.push(ell(h[0] + 1.8, h[1] + 0.9, 3.8, 1.7, 0, 10));
  const sk = blob([[-5, -55], [-5.8, -60], [-3.8, -64.8], [0, -66.2], [3.8, -64.8], [5.8, -60], [5, -55], [3.2, -53], [2.8, -50.4], [-2.8, -50.4], [-3.2, -53]], 4);
  parts.push(rot(sk, 0, -51, head));
  const eyes = [[-2.2, -59.4, 1.6], [2.2, -59.4, 1.6], [0, -55.8, 0.8]].map(([x, y, r]) => [...rp(rp([x, y], 0, -51, head), 0, -28, tilt), r]);
  return { d: rot(U(parts), 0, -28, tilt), eyes };
}

// A ghost, head at y ≈ -46: a pale sheet with its arms flung up, its tail
// streaming away behind it (dir 1: the tail sweeps off to the left).
function ghost({ tilt = 0, la = -140, ra = -40, dir = 1 } = {}) {
  const arm = (o, a, b) => { const m = toward(o[0], o[1], a, 9); return taper([o, m, toward(m[0], m[1], b, 9)], [4.8, 3.2, 0.5]); };
  const body = U(
    ell(0, -46, 5.8, 6.8, 0, 16),
    taper([[0, -42], [0.4, -32], [-1.6 * dir, -20], [-7 * dir, -9], [-17 * dir, -2.4], [-29 * dir, -2.4], [-38 * dir, -8]], [12, 15, 14, 11, 6.4, 2.6, 0.4], { per: 5 }),
    arm([-5.4, -38], la, la - 24 * dir), arm([5.4, -38], ra, ra + 24 * dir),
  );
  const face = [[-2.3, -47.4, 1.6], [2.3, -47.4, 1.6], [0, -42.8, 1.5]];
  return { d: rot(body, 0, -30, tilt), face: face.map(([x, y, r]) => [...rp([x, y], 0, -30, tilt), r]) };
}

// A skull seen from the front, its jaw on y (14 wide at k = 1): the outline
// (a polygon, to join a union) and its sockets [[x, y, r], ...].
const skullAt = (x, y, k) => ({
  d: at(x, y, k)(blob([[-7, -6], [-6.6, -11.6], [-3.4, -15], [3.4, -15], [6.6, -11.6], [7, -6], [5.4, -2.6], [4.4, 1.4], [-4.4, 1.4], [-5.4, -2.6]], 4)),
  holes: [[x - 2.8 * k, y - 7 * k, 2.1 * k], [x + 2.8 * k, y - 7 * k, 2.1 * k], [x, y - 3 * k, 0.9 * k]],
});

export const ultra_d = {
  // ── THE LONG GAME ─────────────────────────────────────────────────

  // VERDANT. The Granary: a round stone granary with a thatched cone of a
  // roof stands on a hill above the delta in the evening sun. Its door is
  // open on a heap of golden grain that spills out down the slope into
  // baskets; sheaves stand on the hill, and boats unload at the landing
  // below.
  'the-granary'(s) {
    fin(s, 'verdant');
    s.rect(s.lin([[0, '#a2b89e'], [0.26, '#d8d6a8'], [0.44, '#f2d293'], [0.53, '#f4b874']]));
    // the evening sun going down over the delta
    const sx = 240, sy = 100;
    s.glow(sx, sy, 190, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 13, from: -178, to: -100, len: 300, spread: 2.2, color: '#fff6dc', op: 0.2, seed: 14201 });
    s.glow(sx, sy, 44, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="10" fill="#fffbea"/>`);
    s.path(U(gull(196, 62, 0.8, -6), gull(210, 54, 0.6, 6), gull(184, 74, 0.55, 10)), '#5c4c30', 'opacity=".7"');
    // the far shore, and the delta lying flat out to it, its arms of river
    // shining with the sun
    s.layer(ridge({ seed: 14202, base: 112, amp: 8, freq: 2.6 }), '#b8b28a', { blur: 0.7 });
    s.haze(94, 114, '#f8e2a8', 0.34);
    // the delta: the river's arms spread wide and shining with the sun, low
    // islands of reed and poplar lying between them
    s.path('M-10,111H310V214H-10Z', s.lin([[0, '#f8deA6'], [0.14, '#e4cc96'], [0.5, '#b2b48e'], [1, '#7a886c']]));
    s.add(glitter([[240, 113, 16, 0.85], [238, 117, 10, 0.7], [243, 121, 18, 0.6], [239, 126, 12, 0.5], [244, 132, 20, 0.45], [240, 139, 14, 0.4], [246, 147, 24, 0.35], [252, 160, 18, 0.3], [262, 176, 26, 0.3], [276, 196, 30, 0.25]], '#ffffff'));
    const isle = (x, y, w, h) => blob([[x - w / 2, y], [x - w * 0.3, y - h], [x + w * 0.1, y - h * 1.1], [x + w * 0.38, y - h * 0.8], [x + w / 2, y], [x, y + h * 0.4]], 4);
    const poplars = [];
    for (const [x, y, n] of [[34, 114, 3], [96, 116, 2], [146, 113.4, 3], [198, 117, 2], [276, 119, 3], [206, 130, 3], [290, 135, 2]]) for (let i = 0; i < n; i++) poplars.push(ell(x + i * 4.4, y - 4 - (i % 2) * 1.6, 1.9, 4.8 + (i % 2) * 1.6, 0, 12));
    s.path(U([[30, 114.6, 64, 2], [96, 116.4, 54, 2.2], [150, 114, 44, 1.8], [200, 117.8, 50, 2.4], [272, 120, 56, 2.6], [122, 121.4, 74, 2.8], [36, 125, 80, 3.4]].map((q) => isle(...q)), poplars,
      boat(226, 115.6, 0.2, 1, 1), boat(170, 118.4, 0.18, 1, -1)), '#73784a');
    s.path(U([[210, 133, 76, 4.6], [294, 140, 56, 5], [176, 147, 56, 5.4], [258, 156, 44, 5]].map((q) => isle(...q))), '#596440');
    s.add('<g fill="none" stroke="#fff6dc" stroke-linecap="round" opacity=".5"><path d="M196,151q8,-2 16,0M226,140q10,-2 20,0M268,166q10,-2 20,0M280,182q12,-3 24,0" stroke-width=".9"/></g>');
    // the hill, and the sheaves standing in its stubble
    const hill = ledge([[-12, 168], [20, 160], [60, 152], [96, 146], [124, 144], [152, 146], [180, 154], [204, 166], [222, 180], [236, 196], [250, 216]]);
    s.figure(`<path d="${hill}"/>`, { fill: s.lin([[0, '#5a6236'], [1, '#20260f']]), rim: '#fff2c4', offsets: [[0.8, -1]], rimOp: 0.75 });
    const stook = (x, b, k) => poly([[x - 4 * k, b], [x - 1.6 * k, b - 7 * k], [x - 4 * k, b - 12 * k], [x - 3 * k, b - 15 * k], [x - 1.8 * k, b - 13.4 * k], [x - 0.8 * k, b - 17 * k],
      [x + 0.4 * k, b - 14 * k], [x + 1.6 * k, b - 16.6 * k], [x + 2.4 * k, b - 13.2 * k], [x + 3.8 * k, b - 14.6 * k], [x + 4 * k, b - 12 * k], [x + 1.6 * k, b - 7 * k], [x + 4 * k, b]]);
    s.figure(`<path d="${U([[30, 176, 1], [54, 170, 0.95], [78, 164, 0.9], [40, 196, 1.3], [68, 188, 1.2], [94, 180, 1.1]].map(([x, b, k]) => stook(x, b, k)))}"/>`,
      { fill: '#6a5826', rim: '#ffe6a0', offsets: [[0.9, -0.8]], rimOp: 0.85 });
    s.path(taper([[148, 168], [168, 176], [190, 186], [210, 196], [226, 210]], [2.4, 4, 6, 8, 10]), '#c4b07a', 'opacity=".45"');
    // the granary: a drum of stone (its courses sag below the eye and lift
    // above it) under a cone of thatch
    const gx = 124, gb = 146;
    const base = spline([[gx - 25, gb - 3], [gx - 13, gb + 0.8], [gx, gb + 1.8], [gx + 13, gb + 0.8], [gx + 25, gb - 3]], 4);
    s.figure(`<path d="${poly([...base, [gx + 23, gb - 50], [gx - 23, gb - 50]])}"/>`, { fill: '#5a4a30', rim: '#fff0c0', offsets: [[1.1, -0.5], [0.6, -0.9]], rimOp: 0.95, shade: 0.55, edge: 0.32, light: [1, -0.35] });
    const R = rng(14203);
    const course = (y, x) => { const half = 25 - (gb - y) * 0.04, t = Math.max(0, Math.min(1, (x - gx + half) / (2 * half))); return y + 4 * (y - 110) * 0.09 * t * (1 - t); };
    let stones = '';
    for (let k = 1; k <= 6; k++) {
      const y = gb - 1 - k * 7.2, half = 25 - (gb - y) * 0.04;
      stones += `M${f1(gx - half)},${f1(y)}Q${gx},${f1(y + 2 * (y - 110) * 0.09)} ${f1(gx + half)},${f1(y)}`;
      for (let x = gx - 21 + (k % 2) * 4.5 + R() * 2; x < gx + 21; x += 8 + R() * 4) stones += `M${f1(x)},${f1(course(y, x))}V${f1(course(y + 7.2, x))}`;
    }
    s.add(`<path d="${stones}" fill="none" stroke="#2a2014" stroke-width=".7" opacity=".55"/>`);
    const eaveY = (t) => gb - 46 - 4.6 * Math.sin(Math.PI * t);
    const eave = [];
    for (let i = 0; i <= 16; i++) eave.push([gx - 34 + (68 * i) / 16, eaveY(i / 16) + (i % 2 ? 1.6 : 0)]);
    const roof = poly([...eave, ...spline([[gx + 34, gb - 46], [gx + 24, gb - 66], [gx + 11, gb - 88], [gx, gb - 102]], 4).slice(1),
      ...spline([[gx, gb - 102], [gx - 11, gb - 88], [gx - 24, gb - 66], [gx - 34, gb - 46]], 4).slice(1, -1)]);
    s.figure(`<path d="${U(roof, taper([[gx, gb - 100], [gx, gb - 107]], 1.8, { per: 2 }), ell(gx, gb - 108.6, 2.2, 2.6, 0, 12))}"/>`,
      { fill: '#3a311e', rim: '#fff0c0', offsets: [[1.1, -0.5], [0.5, -1]], rimOp: 0.95, shade: 0.5, light: [1, -0.4] });
    let thatch = '';
    for (let i = -5; i <= 5; i++) thatch += `M${f1(gx + i * 1.3)},${f1(gb - 97)}L${f1(gx + i * 6.2)},${f1(eaveY((i * 6.2 + 34) / 68) - 0.6)}`;
    thatch += `M${f1(gx - 27)},${f1(gb - 61)}Q${gx},${f1(gb - 67)} ${f1(gx + 27)},${f1(gb - 61)}M${f1(gx - 17)},${f1(gb - 80)}Q${gx},${f1(gb - 84.4)} ${f1(gx + 17)},${f1(gb - 80)}`;
    s.add(`<path d="${thatch}" fill="none" stroke="#1c160c" stroke-width=".8" opacity=".55"/>`);
    // the open door, the grain heaped inside it and pouring out down the
    // slope into the baskets
    const door = poly([[gx - 8, gb + 1.6], ...Array.from({ length: 9 }, (_, i) => toward(gx, gb - 21, 180 + i * 22.5, 8)), [gx + 8, gb + 1.6]]);
    const heap = blob([[gx - 8, gb + 1], [gx - 6, gb - 7], [gx, gb - 11], [gx + 6, gb - 7], [gx + 8, gb + 1]], 3);
    const spill = blob([[gx - 8, gb], [gx + 8, gb], [gx + 12, gb + 6], [gx + 16, gb + 13], [gx + 6, gb + 15], [gx - 6, gb + 16], [gx - 16, gb + 13], [gx - 12, gb + 6]], 4);
    const baskets = [[gx - 24, gb + 26, 16, 10], [gx + 2, gb + 30, 18, 11], [gx + 27, gb + 23, 14, 9]];
    const domes = U(baskets.map(([x, b, w, h]) => ell(x, b - h, w * 0.47, h * 0.5, 0, 16)));
    const grain = s.linU(0, gb - 12, 0, gb + 26, [[0, '#fff4b8'], [0.5, '#ffd56c'], [1, '#e6a440']]);
    s.glow(gx, gb + 2, 44, '#ffcf6a', 0.55, 'breathe');
    s.bloom(`<path d="${door}" fill="${s.linU(0, gb - 30, 0, gb + 2, [[0, '#6a3410'], [0.4, '#d07a26'], [0.7, '#ffcf6a'], [1, '#fff0b8']])}"/>` +
      `<path d="${heap + spill + domes}" fill="${grain}"/>` +
      `<path d="M${gx + 10.6},${gb - 36}V${gb - 41.6}a1.4,1.4 0 0 1 2.8,0V${gb - 36}Z" fill="#ffd77a"/>`, { sd: 1.6, k: 1.35, box: [80, 90, 100, 100] });
    s.figure(`<path d="${U(baskets.map(([x, b, w, h]) => poly([[x - w / 2, b - h], [x + w / 2, b - h], [x + w * 0.4, b - 1], [x + w * 0.3, b], [x - w * 0.3, b], [x - w * 0.4, b - 1]])))}"/>`,
      { fill: '#3a2c14', rim: '#ffe6a0', offsets: [[0.8, -0.8], [0, -1]], rimOp: 0.85 });
    s.add(`<path d="${baskets.map(([x, b, w, h]) => `M${f1(x - w * 0.46)},${f1(b - h * 0.62)}H${f1(x + w * 0.46)}M${f1(x - w * 0.42)},${f1(b - h * 0.3)}H${f1(x + w * 0.42)}`).join('')}" stroke="#806024" stroke-width=".7" opacity=".7"/>`);
    // the landing at the foot of the hill: boats tied up, porters unloading
    s.figure(`<path d="${U(poly([[226, 197], [270, 193.4], [270, 196.4], [226, 200.4]]), [240, 256].map((x) => poly([[x - 0.9, 195], [x + 0.9, 195], [x + 0.9, 206], [x - 0.9, 206]])),
      boat(272, 208, 0.8, 0, -1), boat(294, 184, 0.62, 1, -1), porter(240, 197, 0.95, 1), ell(254, 194.4, 3.4, 2.4, 0, 10), ell(260, 194, 3, 2.2, 0, 10), ell(257, 190.6, 3, 2.2, 0, 10))}"/>`,
      { fill: '#241c10', rim: '#fff0c0', offsets: [[0.8, -0.8]], rimOp: 0.8 });
    // standing wheat in the near corner
    const Q = rng(14204), stalks = [];
    for (let i = 0; i < 22; i++) {
      const x = -8 + Q() * 62, h = 24 + Q() * 36, l = (Q() - 0.35) * 14;
      stalks.push(taper([[x, 216], [x + l * 0.4, 216 - h * 0.6], [x + l, 216 - h]], [1.4, 1, 0.6], { per: 3 }), lens(x + l * 1.04, 216 - h - 4, 9, -90 + l * 3, 0.34, 3));
    }
    s.figure(`<path d="${U(stalks)}"/>`, { fill: '#2a2410', rim: '#ffe6a0', offsets: [[0.8, -0.6]], rimOp: 0.6 });
    s.motes({ seed: 14205, n: 16, x: [60, 270], y: [40, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. Pearl Diver: a diver kicks up through the teal water toward the
  // light, one hand reaching for the surface and the other holding out a
  // great glowing pearl; shells stud her harness, and her bubbles rise in a
  // trail to the rippling ceiling of light.
  'pearl-diver'(s) {
    fin(s, 'tide');
    s.rect(s.lin([[0, '#a4e2d4'], [0.12, '#5cb4ac'], [0.4, '#236e7a'], [0.7, '#0e394a'], [1, '#05161f']]));
    s.glow(176, -20, 200, '#effff8', 0.75);
    s.shafts({ cx: 176, cy: -46, n: 12, from: 62, to: 124, len: 300, spread: 2, color: '#eafff8', op: 0.26, seed: 14301, sd: 2.4 });
    // the underside of the surface, rippling with light
    const R = rng(14302), wave = [];
    for (let x = 314; x >= -14; x -= 9) wave.push([x, 8 + Math.sin(x / 11) * 2.2 + R() * 2.4]);
    s.path(poly([[-14, -10], [314, -10], ...spline(wave, 3)]), '#ecfff9', 'opacity=".55"');
    s.add('<path d="M30,17q6,-2.4 12,0t12,0M80,21q6,-2 12,0t12,0M196,18q6,-2.4 12,0t12,0t12,0M250,14q5,-2 10,0t10,0M128,25q5,-2 10,0t10,0" fill="none" stroke="#f2fffb" stroke-width=".8" opacity=".5"/>');
    // far kelp and rocks in the blue
    let far = ridge({ seed: 14303, base: 204, amp: 24, freq: 3 });
    for (const [x, h, sw] of [[14, 136, 1], [32, 100, -1], [50, 70, 1], [252, 116, -1], [272, 152, 1], [292, 104, -1]]) {
      const pts = Array.from({ length: 7 }, (_, i) => [x + Math.sin(i * 1.15 + x) * 5 * sw, 212 - (h * i) / 6]);
      far += taper(pts, [5, 4.6, 3.6, 2.4, 1]);
      for (let i = 1; i < 6; i++) far += leafAt(pts[i][0], pts[i][1], -90 + (i % 2 ? 50 : -50), 12 - i, 0.36, 3);
    }
    s.layer(far, '#185462', { blur: 0.9 });
    // a school of little fish, dark against the light
    const fish = [];
    for (let i = 0; i < 12; i++) { const x = 34 + R() * 70, y = 34 + R() * 34, k = 0.8 + R() * 0.4; fish.push(lens(x, y, 6 * k, -6, 0.42, 3), poly([[x - 2.6 * k, y], [x - 5.2 * k, y - 1.8 * k], [x - 5.2 * k, y + 1.8 * k]])); }
    s.path(U(fish), '#1e5e6a', 'opacity=".75"');
    // the seabed, an empty oyster open on it
    s.path(ledge([[-10, 198], [30, 192], [70, 196], [120, 204], [170, 206], [220, 198], [260, 192], [310, 196]]), s.lin([[0, '#0a2630'], [1, '#030c10']]));
    s.path(U(blob([[64, 199], [70, 194.6], [82, 194.6], [88, 199], [76, 201.6]], 3), rot(blob([[64, 198], [69, 191], [82, 189.6], [88, 196.6]], 3), 64, 198, -26)), '#06171d');
    // the diver, rising toward the light (drawn upright, hips at the
    // origin, facing right, then tipped forward)
    const hx = 136, hy = 128, tip = 32, K = 1.14;
    const place = (d) => rot(at(hx, hy, K)(d), hx, hy, tip);
    const P = (x, y) => rp([hx + x * K, hy + y * K], hx, hy, tip);
    const her = U(
      profile(2.5, -55, 0.7, -62),
      taper([[0.5, -48], [0.5, -43]], 4.6, { per: 2 }),
      taper([[0, -44], [1.6, -31], [0, -12]], [11, 10.4, 8.6]),
      ell(0, -7, 6.6, 7.6),
      taper([[-2, -4], [-3.4, 16], [-5, 36]], [8.4, 6.6, 4.4]), lens(-5.6, 44, 16, 94, 0.42, 3),
      taper([[3.4, -4], [9, 10], [11, 22]], [8.4, 6.8, 5.4]), taper([[11, 22], [7, 33], [3, 44]], [5.2, 4.4, 3.6]), lens(1.6, 52, 16, 104, 0.42, 3),
      taper([[1.4, -41], [3, -57], [4.4, -72]], [4.4, 3.6, 3]), ell(4.8, -75.6, 2.2, 3.4, 8),
      taper([[2.6, -39], [10, -31], [16, -25]], [4.4, 3.8, 3.2]), taper([[16, -25], [21, -24], [25, -26]], [3.2, 2.8, 2.4]), ell(26.6, -27, 2.6, 2.2),
      taper([[-2, -60], [-8, -54], [-11, -44], [-15, -32], [-17, -22]], [7, 6.6, 5, 3, 0.6]),
    );
    s.figure(`<path d="${place(her)}"/>`, { fill: '#082029', rim: '#d8fbf6', offsets: [[0.5, -1.3], [-0.6, -1], [1.2, -0.4]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [0.2, -1] });
    // her harness, studded with shells
    s.add(`<path d="${place('M-4.6,-42L4.4,-14M-6.2,-11.6L6.2,-13')}" stroke="#7a8c84" stroke-width="1.3" fill="none" opacity=".9"/>`);
    s.path(dots([[-3.4, -38.6], [-1.2, -31.6], [1, -24.6], [3.2, -17.6], [-4, -12], [0, -12.3], [4, -12.7]].map(([x, y], i) => [...P(x, y), i % 2 ? 1 : 1.4])), '#f2ecd6');
    // the pearl
    const [px, py] = P(30.4, -29);
    s.glow(px, py, 54, '#f4f3d6', 0.65, 'breathe');
    s.bloom(`<circle cx="${f1(px)}" cy="${f1(py)}" r="6.2" fill="${s.radU(px - 1.8, py - 2, 8.4, [[0, '#ffffff'], [0.4, '#f8f4e6'], [0.8, '#d6eae6'], [1, '#b0c4d4']])}"/>` +
      `<circle cx="${f1(px - 2)}" cy="${f1(py - 2.2)}" r="1.5" fill="#ffffff"/>`, { sd: 1.8, k: 1.5, box: [130, 80, 100, 90] });
    // her bubbles, rising to the surface
    const [mx, my] = P(6.7, -56.9), bub = [];
    for (let i = 0; i < 18; i++) { const t = i / 17; bub.push([mx + 2 + Math.sin(t * 5 + 1) * 5 + t * 4 + (R() - 0.5) * 7 * t, my - 3 - t * (my - 16) + (R() - 0.5) * 4, 0.7 + t * 2 + R() * 1.2]); }
    s.add(`<g fill="#dffcf6" fill-opacity=".18" stroke="#effffb" stroke-width=".6" opacity=".9">${bub.map(([x, y, r], i) =>
      `<circle class="rise" style="--t:${f1(4 + (i % 4))}s;--d:${f1(-i * 0.6)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}"/>`).join('')}</g>`);
    // near kelp at the edges
    const kelp = [];
    for (const [x, h, sw] of [[-2, 120, 1], [12, 84, -1], [296, 132, -1], [282, 92, 1]]) {
      const pts = Array.from({ length: 7 }, (_, i) => [x + Math.sin(i * 1.2 + x) * 6 * sw, 216 - (h * i) / 6]);
      kelp.push(taper(pts, [6, 5.4, 4.4, 3, 1.4]));
      for (let i = 1; i < 6; i++) kelp.push(leafAt(pts[i][0], pts[i][1], -90 + (i % 2 ? 46 : -46) * sw, 16 - i * 1.4, 0.34, 3));
    }
    s.figure(`<path d="${U(kelp)}"/>`, { fill: '#03100f', rim: '#7fd0cc', offsets: [[0, -1]], rimOp: 0.5 });
    s.motes({ seed: 14304, n: 18, x: [20, 280], y: [20, 200], r: [0.3, 0.8], fill: '#c6f4f6', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // TIDE. Compound Interest: in a counting house cut into a sea cave, an
  // open ledger lies on the desk, and out of it a spiral of glowing pages
  // and coins winds up into the dark, every page splitting in two as it
  // climbs; beyond the cave mouth, the bright sea.
  'compound-interest'(s) {
    fin(s, 'tide');
    s.rect(s.lin([[0, '#163e4c'], [0.3, '#2c6670'], [0.5, '#6aa8a6'], [0.52, '#5e9c9c']]));
    s.add(particles({ seed: 14404, n: 10, x: [10, 96], y: [44, 100], r: [0.3, 0.7], fill: '#e4fbfb', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(46, 70, 60, '#e6fbf8', 0.5);
    s.add('<circle cx="46" cy="70" r="7.4" fill="#eefcf8"/>');
    // the sea outside, a stack of rock and a sail far out on it
    s.path('M-10,108H130V170H-10Z', s.lin([[0, '#4e9296'], [0.3, '#2a6670'], [1, '#0e3440']]));
    s.add(glitter([[46, 111, 16, 0.7], [44, 116, 10, 0.5], [48, 122, 20, 0.45], [45, 130, 12, 0.35], [47, 140, 18, 0.3]], '#e8fcf8'));
    s.path(blob([[64, 109], [65, 96], [69, 90], [73, 94], [75, 109]], 3) + boat(24, 108, 0.32, 1, 1), '#1e5056');
    // the cave: rock all round the mouth, its light falling in
    const mouth = blob([[8, 160], [3, 140], [9, 122], [5, 104], [13, 88], [21, 76], [19, 62], [31, 54], [41, 50], [50, 42], [62, 46], [71, 43], [80, 54], [88, 62], [85, 76],
      [93, 88], [91, 104], [97, 120], [93, 138], [99, 160], [56, 166]], 2);
    s.figure(`<path d="M-10,-10H310V220H-10Z${mouth}" fill-rule="evenodd"/>`, { fill: s.linU(0, 0, 300, 0, [[0, '#123a48'], [0.35, '#0c2a36'], [1, '#071820']]), rim: '#a6e4ec', offsets: [[-1.2, 0], [-0.8, 0.8]], rimOp: 0.7 });
    s.shafts({ cx: 40, cy: 84, n: 7, from: 6, to: 40, len: 240, spread: 3, color: '#c6f4f6', op: 0.12, seed: 14401 });
    s.add('<path d="M108,28Q150,38 200,26T300,34M118,62Q170,70 228,58T310,68M222,112Q262,120 310,110M104,186Q140,180 170,188M100,40Q104,70 98,96M102,120Q108,140 104,160" fill="none" stroke="#1d5262" stroke-width="1" opacity=".7"/>');
    // the dripping roof of the cave
    const R = rng(14402), drips = [];
    for (let x = 104; x < 310; x += 18 + R() * 22) { const h = 8 + R() * 16, w = 4 + R() * 5; drips.push(poly([[x - w, -4], [x + w, -4], [x + w * 0.4, h * 0.6], [x + 0.5, h], [x - 0.5, h]])); }
    s.figure(`<path d="${U(drips)}"/>`, { fill: '#0a2430', rim: '#a6e4ec', offsets: [[0, 0.8]], rimOp: 0.3 });
    // shelves cut in the far wall: ledgers, scroll ends, a strongbox
    s.path('M250,64H300V96H250ZM246,108H300V138H246Z', '#04121a');
    const spines = [];
    for (let x = 253, i = 0; x < 290; x += 4.2 + (i % 3), i++) spines.push(quad(x, 82 + (i % 2), 3.4, 24 - (i % 3) * 2, i % 5 === 4 ? 10 : 0));
    s.path(U(spines, quad(276, 128, 18, 14), poly([[267, 121], [285, 121], [283, 117], [269, 117]])), '#1f4652');
    s.path(dots([[252, 116, 2.4], [252, 122, 2.4], [258, 119, 2.4], [252, 128, 2.4]]), '#3c6a70');
    // chests and sacks inside the mouth, dark against the sea
    s.figure(`<path d="${U(quad(38, 175, 32, 18), quad(38, 164.4, 35, 5), blob([[64, 184], [62, 170], [67, 162], [72, 160], [77, 162], [80, 170], [80, 184]], 4), ell(71, 157.6, 3.4, 2.2, 0, 10))}"/>`,
      { fill: '#041218', rim: '#a6e4ec', offsets: [[-0.8, -0.9]], rimOp: 0.7 });
    s.add('<path d="M22,167.4H54M27,166V184M49,166V184" stroke="#2a5058" stroke-width="1" opacity=".8"/>');
    s.path(ledge([[-10, 186], [60, 184], [120, 190], [200, 188], [310, 192]]), s.lin([[0, '#0a2028'], [1, '#03090c']]));
    // the desk, the ledger open on it, an inkwell and stacked coins
    const desk = U(quad(173, 160.5, 134, 5), quad(173, 168, 116, 10), quad(118, 189, 7, 44), quad(228, 189, 7, 44));
    s.figure(`<path d="${desk}"/>`, { fill: '#18120e', rim: '#e6f8ee', offsets: [[0, -1], [-0.8, -0.6]], rimOp: 0.75 });
    s.path(U(quad(126, 154, 7, 7), taper([[127, 151], [131, 140], [136, 132]], [1, 1.6, 0.4], { per: 3 })), '#0c0a08');
    const cx = 172, by = 152;
    const leaf = (d) => poly([[cx, by + 1], [cx + d * 26, by + 0.6], [cx + d * 28, by - 7], [cx + d * 2, by - 10]]);
    s.path(poly([[cx - 31, by + 3], [cx + 31, by + 3], [cx + 28, by - 1], [cx - 28, by - 1]]), '#2a160e');
    // the spiral: a stream of light winding up out of the book, carrying
    // pages that split as they rise (1, 2, 4, 8, 16) and coins between them
    const helix = (t) => { const th = 0.5 + t * 4 * Math.PI * 2, r = 5 + 54 * Math.pow(t, 0.8); return [cx + Math.cos(th) * r, by - 6 - 108 * t + Math.sin(th) * r * 0.25, th]; };
    const stream = Array.from({ length: 161 }, (_, i) => helix(i / 160));
    const line = 'M' + stream.map(([x, y]) => pt([x, y])).join('L');
    s.glow(cx, by - 8, 40, '#e8fffa', 0.7, 'breathe');
    const pages = [], coins = [];
    for (let g = 0; g < 5; g++) {
      const n = 2 ** g;
      for (let i = 0; i < n; i++) {
        const t = 0.07 + g * 0.19 + ((i + 0.5) / n) * 0.17, [x, y, th] = helix(t), w = 9.4 - g * 1.1, a = (th * 180) / Math.PI + 90 + (R() - 0.5) * 40;
        if (g > 0 && i % 2) { const [x0, y0] = helix(t - 0.17 / n); pages.push(quad((x + x0) / 2, (y + y0) / 2, w * 0.9, w * 1.2, a - 20)); }
        pages.push(quad(x, y, w, w * 1.3, a));
      }
    }
    for (let i = 0; i < 34; i++) { const t = 0.03 + (i / 33) * 0.95, [x, y] = helix(t + 0.012), r = 3.2 - 1.5 * t; coins.push([x + (R() - 0.5) * 9, y + (R() - 0.5) * 7, r, r * (0.3 + R() * 0.7), (R() - 0.5) * 50]); }
    s.bloom(`<path d="${line}" fill="none" stroke="#c6f4f6" stroke-width="5" opacity=".14"/><path d="${line}" fill="none" stroke="#effffa" stroke-width=".8" opacity=".55"/>` +
      `<path d="${leaf(-1) + leaf(1)}" fill="#f6fff6"/><path d="M${cx},${by + 1}L${cx + 1},${by - 9.6}" stroke="#9ab8b0" stroke-width=".6"/>` +
      `<path d="${U(pages)}" fill="#effff6" opacity=".92"/>` +
      `<path d="${coins.map(([x, y, rx, ry, a]) => oval(x, y, rx, ry, a)).join('')}" fill="#ffd77a"/>`, { sd: 1.6, k: 1.4, box: [80, 0, 190, 170] });
    s.path(U(quad(212, 155.6, 8, 3.2), quad(212, 152.4, 8, 3.2), quad(212.6, 149.2, 8, 3.2), quad(222, 155.6, 8, 3.2), quad(221.4, 152.4, 8, 3.2)), '#c89a3a');
    s.add(`<path d="${[155.6, 152.4, 149.2].map((y) => `M208,${y - 1.6}h8`).join('')}M218,154h8M217.4,150.8h8" stroke="#ffe8a0" stroke-width=".5" opacity=".8"/>`);
    s.motes({ seed: 14403, n: 16, x: [110, 250], y: [10, 150], r: [0.4, 1], fill: '#c6f4f6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // VERDANT + TIDE. The Merchant Tortoise: a colossal old tortoise wades
  // through the delta with a whole market town on its shell (towers,
  // tents, gardens, bunting, lit windows), moss hanging from the rim of
  // its shell, little boats sailing round its feet.
  'the-merchant-tortoise'(s) {
    fin(s, ['verdant', 'tide']);
    s.rect(s.lin([[0, '#7eb0aa'], [0.3, '#bcd4b2'], [0.52, '#eee0ae'], [0.6, '#f4daa0']]));
    const sx = 238, sy = 46;
    s.glow(sx, sy, 170, '#fff4cc', 0.75);
    s.shafts({ cx: sx, cy: sy, n: 11, from: 100, to: 200, len: 280, spread: 2.2, color: '#fff8dc', op: 0.2, seed: 14501 });
    s.glow(sx, sy, 34, '#fffbea', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="9" fill="#fffcee"/>`);
    // the far shores of the delta, and the water
    s.layer(woods({ seed: 14502, base: 128, top: 113, r0: 4, r1: 9 }), '#a6b89c', { blur: 0.6 });
    s.haze(110, 130, '#f4ecc6', 0.34);
    s.path('M-10,127H310V214H-10Z', s.lin([[0, '#a6d0c2'], [0.18, '#68a8a2'], [0.55, '#2e6e74'], [1, '#123c46']]));
    s.add('<path d="M-10,127.5H310" stroke="#f2fbe6" stroke-width=".8" opacity=".5"/>');
    s.add(glitter([[236, 130, 20, 0.6], [228, 136, 14, 0.5], [244, 142, 26, 0.4], [30, 134, 18, 0.4], [60, 140, 12, 0.35]], '#fffbe8'));
    s.path(U(gull(118, 34, 0.7, -6), gull(212, 24, 0.55, 8), gull(92, 58, 0.55, 4)), '#3c5a52', 'opacity=".75"');
    // the tortoise, facing left: the far legs first, then its body (drawn a
    // little large, then set inside the safe area)
    const fit = 'transform="translate(18 9) scale(.94)"';
    s.add(`<g ${fit}>`);
    const domeY = (x) => 82 + ((x - 166) / 82) ** 2 * 48;
    s.path(U(taper([[84, 148], [80, 166], [78, 184]], [20, 18, 18]), taper([[238, 148], [242, 166], [244, 182]], [18, 16, 16])), '#1a2016');
    const shell = blob([[80, 152], [84, 132], [96, 112], [114, 96], [138, 86], [166, 82], [194, 86], [216, 97], [234, 113], [246, 132], [250, 152], [236, 158], [204, 161], [166, 162], [128, 161], [98, 158]], 5);
    const rimY = (x) => 162 - ((x - 166) / 84) ** 2 * 10;
    const bumps = [];
    for (let x = 88; x <= 246; x += 11) bumps.push(ell(x, rimY(x) + 0.6, 6.4, 3.8, 0, 12));
    const body = U(shell, bumps,
      taper([[100, 142], [86, 133], [72, 124], [60, 117]], [26, 21, 17, 15]),
      blob([[40, 100], [52, 99], [61, 104], [64, 112], [59, 120], [47, 124], [36, 122], [30, 117], [29, 109], [33, 103]], 4), poly([[30.4, 110], [25.4, 115.6], [31, 118.6]]),
      taper([[106, 148], [104, 166], [102, 186]], [28, 24, 24]), taper([[214, 150], [218, 168], [220, 186]], [30, 26, 26]),
      taper([[248, 146], [258, 150], [264, 157]], [8, 5, 1]),
    );
    s.figure(`<path d="${body}"/>`, { fill: '#2a3220', rim: '#fff2c4', offsets: [[0.8, -1.1], [0, -1.2], [-0.8, -0.6]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [0.5, -1] });
    s.path(shell, s.radU(204, 100, 96, [[0, '#d6d29a', 0.32], [0.6, '#a8a878', 0.1], [1, '#a8a878', 0]]));
    // the plates of its shell, the folds of its neck, its old eye
    let plates = 'M92,146Q166,72 242,146M108,151Q166,100 226,151';
    for (const x of [100, 122, 144, 166, 188, 210, 232]) plates += `M${x},${f1(rimY(x) - 3)}L${f1(x + (x - 166) * 0.08)},${f1(domeY(x) + 22 + Math.abs(x - 166) * 0.1)}`;
    s.add(`<path d="${plates}" fill="none" stroke="#6a6e44" stroke-width="1.2" opacity=".75"/>` +
      '<path d="M64,112Q70,118 66,127M74,117Q80,124 76,133M85,123Q91,130 87,139M30.6,115.2Q38,116.2 46.4,119.6M36.4,105.6Q40,103.4 44.6,105" fill="none" stroke="#0e140a" stroke-width="1" opacity=".85"/>');
    // moss and creepers hanging from the rim
    const M = rng(14503), moss = [];
    for (let x = 92; x < 244; x += 6 + M() * 7) { const y = rimY(x) + 2, h = 4 + M() * 10; moss.push(taper([[x, y], [x + 0.6, y + h * 0.6], [x - 0.4, y + h]], [2.4, 1.6, 0.4], { per: 3 })); }
    s.path(U(moss), '#3e5a2a');
    // the town on its back
    const town = [], lit = [], tops = [];
    const tower = (x, w, h, cap = 'cone') => {
      const b = domeY(x) + 5, t = b - h;
      town.push(poly([[x - w / 2, b], [x - w / 2, t], [x + w / 2, t], [x + w / 2, b]]));
      let top;
      if (cap === 'cone') { town.push(poly([[x - w / 2 - 1.8, t + 0.5], [x, t - w * 1.6], [x + w / 2 + 1.8, t + 0.5]])); top = t - w * 1.6; }
      else { town.push(ell(x, t - w * 0.25, w * 0.62, w * 0.62, 0, 14), poly([[x - 1, t - w * 0.8], [x, t - w * 1.4], [x + 1, t - w * 0.8]])); top = t - w * 1.4; }
      town.push(poly([[x - 0.5, top + 1], [x - 0.5, top - 7], [x + 0.5, top - 7], [x + 0.5, top + 1]]), poly([[x + 0.5, top - 7], [x + 7.4, top - 5.6], [x + 0.5, top - 4]]));
      lit.push([x, t + 4.6, 1], [x, t + 11, 0.9]);
      tops.push([x, t + 1]);
    };
    const tent = (x, w, h) => { const b = domeY(x) + 4; town.push(poly([[x - w / 2, b], [x - w * 0.1, b - h], [x, b - h - 2.4], [x + w * 0.1, b - h], [x + w / 2, b]])); };
    const house = (x, w, h) => { const b = domeY(x) + 4; town.push(poly([[x - w / 2, b], [x - w / 2, b - h], [x, b - h - w * 0.5], [x + w / 2, b - h], [x + w / 2, b]])); lit.push([x, b - h * 0.5, 0.9]); };
    const tree = (x, r) => { const b = domeY(x) + 3; town.push(taper([[x, b], [x, b - r]], 1.8, { per: 2 }), ell(x, b - r - r * 0.7, r, r * 0.9, 0, 14)); };
    tree(98, 5); house(108, 9, 7); tent(120, 14, 11); tower(132, 7, 26); house(145, 10, 8); tree(153, 6);
    tower(167, 10, 34); tent(181, 13, 11); house(191, 9, 9); tower(203, 8, 26, 'dome'); tree(215, 6); tent(225, 13, 9); house(235, 8, 6); tree(242, 4);
    s.figure(`<path d="${U(town)}"/>`, { fill: '#2e2a1c', rim: '#fff2c4', offsets: [[0.8, -1], [0, -1.1], [-0.6, -0.6]], rimOp: 0.95, shade: 0.4, light: [0.5, -1] });
    // bunting strung between the towers
    const [[ax, ay], [mx2, my2], [bx2, by2]] = tops;
    const sag = (x0, y0, x1, y1, d) => { const pts = []; for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + d * 4 * t * (1 - t)]); } return pts; };
    const strings = [sag(ax, ay - 4, mx2, my2 - 8, 6), sag(mx2, my2 - 8, bx2, by2 - 4, 6)];
    s.add(`<path d="${strings.map((p) => 'M' + p.map(pt).join('L')).join('')}" fill="none" stroke="#2e2a1c" stroke-width=".6"/>`);
    s.path(strings.flatMap((p) => p.slice(1, -1).map(([x, y]) => poly([[x - 1.6, y], [x + 1.6, y], [x, y + 3]]))).join(''), '#c86a4a');
    // lit windows and the lamps at the tower tops
    s.bloom(`<path d="${dots(lit)}" fill="#ffd77a"/><circle cx="40.6" cy="108.6" r="1.6" fill="#ffe08a"/>`, { sd: 1.2, k: 1.6, box: [26, 20, 234, 110] });
    s.add('</g>');
    // the near water over its legs, the ripples round them, the boats
    s.path('M-10,172.6H310V214H-10Z', s.lin([[0, '#3a7c7e', 0.82], [1, '#123c46', 0.95]]));
    s.add(`<path d="M-10,173H310" stroke="#e6f8ee" stroke-width=".7" opacity=".5"/><g ${fit} fill="none" stroke="#e6f8ee" stroke-linecap="round" opacity=".55"><path d="M84,176q18,4 36,0M196,177q24,4 46,0M66,175q8,2 16,0M232,175q10,2 20,0" stroke-width="1.1"/><path d="M90,184q12,3 26,0M202,186q16,3 34,0" stroke-width=".8"/></g>`);
    s.add(`<ellipse cx="172" cy="188" rx="88" ry="9" fill="#0e2e36" opacity=".4"/>`);
    s.figure(`<path d="${U(boat(54, 186, 0.46, 1, -1), boat(152, 194, 0.52, 0, 1), boat(270, 180, 0.42, 1, 1))}"/>`, { fill: '#10201e', rim: '#fff2c4', offsets: [[0.6, -0.8]], rimOp: 0.8 });
    s.motes({ seed: 14504, n: 14, x: [40, 280], y: [20, 170], r: [0.4, 0.9], fill: '#fff4c4', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── ROT AND BLOOM ─────────────────────────────────────────────────

  // UMBRAL. Grave Harvest: by moonlight a hooded gravedigger leans back and
  // hauls a clutch of glowing violet bulbs up out of a grave mound, pale
  // roots trailing from them back into the earth; a lantern hangs from a
  // crooked post by the headstone.
  'grave-harvest'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.38, '#1c1530'], [0.62, '#3c2e64'], [0.74, '#4a3870']]));
    s.add(particles({ seed: 14601, n: 26, x: [0, W], y: [0, 96], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon behind him
    s.glow(56, 44, 100, '#c9b8f2', 0.42);
    s.add('<circle cx="56" cy="44" r="15" fill="#ece4fa"/><circle cx="51" cy="40" r="3" fill="#d4c8ea" opacity=".6"/><circle cx="61" cy="49" r="2.2" fill="#d4c8ea" opacity=".5"/>');
    // the churchyard beyond: a bell tower among yews, crosses on the rise
    s.layer(ridge({ seed: 14602, base: 150, amp: 10, freq: 2 }) + 'M172,148V118L180,110L188,118V148ZM175,118V98L180,84L185,98V118Z' +
      U(ell(158, 136, 6, 15), ell(204, 134, 7, 18), ell(282, 138, 6, 14)) + crossD(230, 146, 14) + crossD(110, 148, 12), '#2c2246', { blur: 0.7 });
    s.add('<path d="M178,128V123A2,2 0 0 1 182,123V128Z" fill="#c9a6ff" opacity=".7"/>');
    s.haze(118, 152, '#6a5494', 0.3);
    s.path(ledge([[-10, 166], [60, 162], [130, 165], [200, 161], [260, 164], [310, 162]]), '#1d1530');
    s.add(`<g fill="#241b38">${slab(24, 168, 12, 18, -5)}${cross(134, 166, 20, 6)}${slab(292, 165, 12, 17, 5)}</g>`);
    s.fog(164, '#9a86c4', 0.28);
    s.path(ledge([[-10, 190], [50, 186], [120, 188], [180, 190], [240, 187], [310, 189]]), s.lin([[0, '#1d1530'], [1, '#08060c']]));
    // the grave mound and its headstone, the lantern on its crooked post,
    // his spade stuck in the ground behind him
    const mound = blob([[136, 196], [144, 181], [162, 171], [186, 168], [208, 173], [224, 185], [230, 196], [182, 199]], 5);
    const post = taper([[252, 200], [254, 172], [249, 146], [252, 122], [258, 108], [270, 102]], [3.6, 3.2, 3, 2.6, 2.2, 1.6]);
    const lamp = lanternAt(271, 102.6, 1.15);
    const spade = U(poly([[49, 196], [58, 196], [58.6, 185], [54, 182], [49.4, 185]]), taper([[54, 183], [49, 140]], 2.2, { per: 2 }), taper([[44, 140], [54, 140]], 2, { per: 2 }));
    s.figure(`<path d="${U(mound, post, lamp.frame, spade)}"/>${slab(214, 178, 18, 30, 7)}`, { fill: '#120d1c', rim: '#b8a6e2', offsets: [[0, -1.2], [-0.8, -0.6]], rimOp: 0.8 });
    s.add('<ellipse cx="160" cy="175.4" rx="9" ry="2.8" fill="#05030a"/>');
    // the gravedigger, leaning back and hauling (drawn facing right, feet
    // on y = 0): the point of his hood flung back, both fists together
    const man = U(
      taper([[-3, -40], [-12, -20], [-21, -1]], [8.4, 7, 5.6]), ell(-23, -1.4, 5.4, 2.4, 6),
      taper([[3, -40], [13, -24], [16, -2]], [8.4, 7, 5.6]), ell(19, -1.6, 5.4, 2.4),
      blob([[-9, -46], [8, -46], [11, -34], [6, -26], [-2, -30], [-12, -28], [-13, -38]], 4),
      taper([[0, -40], [-4, -56], [-9, -72]], [15, 14.4, 15.4]),
      blob([[-2.4, -73], [-0.6, -81], [-3.6, -89.6], [-10.6, -94], [-18, -92.4], [-23.6, -86], [-27.4, -77], [-30, -68], [-24.6, -70], [-17, -71]], 4),
      taper([[-6, -70], [8, -68], [27, -66]], [5.4, 4.6, 4]), taper([[-4, -67], [10, -63], [27, -62]], [5.4, 4.6, 4]),
      ell(29.6, -66, 3.4, 3), ell(29.6, -61.6, 3.4, 3),
    );
    const G = at(96, 190, 1.08);
    // what he pulls: the leaves in his fists, the bulbs below, the roots
    // trailing back down into the hole they came from
    const bulbs = [[140, 140, 7.8], [127, 147.6, 6.2], [152.6, 149.4, 5.8]];
    const onion = ([x, y, r]) => blob([[x, y - r * 1.5], [x + r * 0.5, y - r * 0.8], [x + r, y], [x + r * 0.62, y + r * 0.78], [x, y + r], [x - r * 0.62, y + r * 0.78], [x - r, y], [x - r * 0.5, y - r * 0.8]], 4);
    const leaves = U(bulbs.map(([x, y, r]) => taper([[128.6, 121], [(128.6 + x) / 2 + 1, (121 + y - r) / 2], [x, y - r * 1.4]], [2.2, 1.6, 1.2], { per: 3 })),
      leafAt(126, 119, -112, 15, 0.26, 3), leafAt(128, 118, -84, 12, 0.26, 3), leafAt(124, 120, -146, 11, 0.28, 3), leafAt(129, 119, -58, 9, 0.28, 3));
    s.figure(`<path d="${U(G(man), leaves)}"/>`, { fill: '#0b0812', rim: '#cdb6f4', offsets: [[-1.1, -0.9], [0, -1.2], [0.9, -0.5]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [-0.4, -1] });
    const Rr = rng(14603), roots = [];
    for (const [x, y, r] of bulbs) {
      for (let j = 0; j < 3; j++) {
        const len = 8 + Rr() * 12, sw = (Rr() - 0.5) * 8, p0 = [x + (j - 1) * r * 0.4, y + r * 0.9];
        roots.push(taper([p0, [p0[0] + sw * 0.5 + 2, p0[1] + len * 0.5], [p0[0] + sw + 4, p0[1] + len]], [1.3, 0.8, 0.25], { per: 4 }));
      }
    }
    // the longest of them still run back into the grave
    roots.push(taper([[142, 147], [149, 160], [157, 174]], [1.3, 0.9, 0.3], { per: 5 }), taper([[154, 155], [158, 165], [165, 174]], [1.1, 0.8, 0.3], { per: 5 }));
    s.path(U(roots), '#d6c6ee', 'opacity=".85"');
    s.glow(139, 145, 38, '#b07cff', 0.6, 'breathe');
    s.glow(160, 174, 22, '#a46bff', 0.55, 'breathe');
    s.glow(lamp.c[0], lamp.c[1], 26, '#b98cff', 0.55, 'breathe');
    const bulbFill = s.radU(138, 141, 18, [[0, '#ffffff'], [0.3, '#f0e0ff'], [0.65, '#c08cff'], [1, '#7a44d0']]);
    s.bloom(`<path d="${U(bulbs.map(onion))}" fill="${bulbFill}"/>` +
      `<path d="${bulbs.map(([x, y, r]) => `M${f1(x - r * 0.4)},${f1(y - r * 0.5)}Q${f1(x - r * 0.1)},${f1(y + r * 0.3)} ${f1(x - r * 0.3)},${f1(y + r * 0.7)}`).join('')}" fill="none" stroke="#ffffff" stroke-width=".7" opacity=".7"/>` +
      `<path d="${oval(160, 175, 7.4, 1.8)}" fill="#c9a6ff" opacity=".8"/><path d="${lamp.glass}" fill="#f2e6ff"/>`, { sd: 1.5, k: 1.45, box: [110, 90, 180, 100] });
    // mist on the ground, motes rising out of the open grave
    s.fog(188, '#8f7fc8', 0.28);
    s.path(U([[-10, 216, 30, 18], [306, 216, 40, 22]].map(([x, y, w, h]) => blob([[x - w, y], [x - w * 0.5, y - h * 0.6], [x, y - h], [x + w * 0.5, y - h * 0.6], [x + w, y]], 3))), '#07050b');
    s.motes({ seed: 14604, n: 16, x: [130, 200], y: [96, 176], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL. Bone Lance: a long spear carved from bone and wreathed in
  // violet fire flies across a misty graveyard under the moon, a trail of
  // ghostly light streaming out behind it.
  'bone-lance'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#08060e'], [0.4, '#1c1432'], [0.66, '#3a2c62'], [0.76, '#46366e']]));
    s.add(particles({ seed: 14701, n: 28, x: [0, W], y: [0, 110], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(252, 34, 80, '#c9b8f2', 0.4);
    s.add('<circle cx="252" cy="34" r="12" fill="#ece4fa"/><circle cx="248" cy="31" r="2.4" fill="#d4c8ea" opacity=".6"/><circle cx="256" cy="38" r="1.7" fill="#d4c8ea" opacity=".5"/>');
    // the graveyard: a mausoleum and yews on the rise, rows of stones in the mist
    s.layer(ridge({ seed: 14702, base: 158, amp: 12, freq: 2.2 }) + 'M60,152V131H92V152ZM56,131L76,119L96,131Z' +
      U(ell(40, 140, 6, 16), ell(112, 142, 5, 13), ell(232, 140, 7, 18), ell(262, 144, 5, 12)) + crossD(150, 156, 16) + crossD(196, 154, 14), '#2a2044', { blur: 0.7 });
    s.haze(130, 162, '#6a5494', 0.32);
    s.fog(154, '#9a86c4', 0.3);
    s.path(ledge([[-10, 176], [60, 172], [130, 175], [200, 171], [260, 174], [310, 172]]), '#1a132c');
    s.add(`<g fill="#221a36">${slab(30, 176, 12, 18, -6)}${cross(84, 174, 22, 5)}${slab(128, 175, 11, 16, 3)}${cross(176, 173, 20, -6)}${slab(222, 172, 13, 19, 4)}${slab(278, 174, 11, 15, -4)}</g>`);
    s.fog(178, '#8f7fc8', 0.26);
    s.add(`<ellipse cx="160" cy="176" rx="116" ry="14" fill="${s.rad([[0, '#b98cff', 0.32], [1, '#b98cff', 0]])}"/>`);
    s.path(ledge([[-10, 196], [50, 192], [110, 195], [170, 197], [230, 193], [310, 195]]), s.lin([[0, '#140f22'], [1, '#06040a']]));
    s.figure(`${slab(20, 200, 22, 34, -6)}${cross(286, 202, 40, 5)}${slab(246, 200, 14, 22, 4)}`, { fill: '#0a0710', rim: '#b8a6e2', offsets: [[0, -1]], rimOp: 0.6 });
    // the lance: drawn lying along +x from its butt (0) to its point (L)
    const B = [60, 72], T = [242, 120];
    const dx = T[0] - B[0], dy = T[1] - B[1], L = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    const ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
    const place = (d) => rot(mv(d, B[0], B[1]), B[0], B[1], ang);
    // the trail of ghostly light streaming out behind it, faces in it
    const tail = [0, 60, 130, 210].map((l) => [B[0] - ux * l, B[1] - uy * l]);
    s.add('<g data-part="trail">');
    s.path(taper(tail, [12, 24, 34, 42]), s.linU(B[0], B[1], B[0] - ux * 170, B[1] - uy * 170, [[0, '#cdb6f4', 0.42], [0.45, '#a890e8', 0.16], [1, '#a890e8', 0]]));
    const R = rng(14703);
    let streaks = '';
    for (let i = 0; i < 9; i++) {
      const o = (R() - 0.5) * 22, l0 = 10 + R() * 20, l1 = 70 + R() * 110;
      streaks += `M${f1(B[0] + nx * o - ux * l0)},${f1(B[1] + ny * o - uy * l0)}L${f1(B[0] + nx * o * 1.4 - ux * l1)},${f1(B[1] + ny * o * 1.4 - uy * l1)}`;
    }
    s.add(`<path d="${streaks}" stroke="#e6d8ff" stroke-width=".7" stroke-linecap="round" opacity=".35"/>`);
    const faces = [[24, -7, 1], [52, 6, 0.85], [82, -4, 0.7]].map(([l, o, k]) => [B[0] - ux * l + nx * o, B[1] - uy * l + ny * o, k]);
    s.path(U(faces.map(([x, y, k]) => rot(U(ell(x, y, 5 * k, 6 * k, 0, 14), taper([[x + 4 * k, y + 2 * k], [x + 14 * k, y + 5 * k], [x + 26 * k, y + 3 * k]], [7 * k, 4 * k, 0.4])), x, y, ang + 180))), '#d8c8f6', 'opacity=".22"');
    s.path(dots(faces.flatMap(([x, y, k]) => [[...rp([x - 1.9 * k, y - 0.6 * k], x, y, ang), 1.2 * k], [...rp([x + 1.9 * k, y - 0.6 * k], x, y, ang), 1.2 * k], [...rp([x, y + 2.8 * k], x, y, ang), 1.1 * k]])), '#120a1e', 'opacity=".45"');
    s.add(`<path d="${line([B, T])}" stroke="#a46bff" stroke-width="20" stroke-linecap="round" opacity=".14"/>`);
    s.add('</g>');
    // the violet fire streaming back off it
    const flames = [], cores = [];
    for (let i = 0; i < 12; i++) {
      const x = L - 26 - i * 13, sd = i % 2 ? -1 : 1, len = 16 + i * 2.4 + R() * 8;
      flames.push(plume(x, sd * 4, 180 - sd * 30, 180 - sd * 6, len, [5.4 + i * 0.2, 6.4, 4.6, 2, 0.3]));
      if (i < 9) cores.push(plume(x - 2, sd * 4.4, 180 - sd * 24, 180 - sd * 4, len * 0.5, [2.6, 3, 1.6, 0.3]));
    }
    flames.push(lens(L - 16, 0, 46, 0, 0.42));
    // the bone: a knuckled butt, a shaft bound at two joints, a carved
    // blade with barbs
    const boneD = U(
      ell(4.6, -4.4, 7, 5.2, -20, 14), ell(4.6, 4.4, 7, 5.2, 20, 14),
      taper([[7, 0], [40, 0], [100, 0], [L - 34, 0]], [8.6, 7.2, 6.8, 6.2]),
      ell(56, 0, 6.2, 5.2, 0, 14), ell(108, 0, 5.8, 4.8, 0, 14),
      poly([[L - 38, -4.6], [L - 26, -8.4], [L - 11, -5.4], [L + 4, 0], [L - 11, 5.4], [L - 26, 8.4], [L - 38, 4.6]]),
      poly([[L - 35, -4.8], [L - 46, -10.6], [L - 31, -6.2]]), poly([[L - 35, 4.8], [L - 46, 10.6], [L - 31, 6.2]]),
    );
    const boneFill = s.linU(B[0] - nx * 7, B[1] - ny * 7, B[0] + nx * 7, B[1] + ny * 7, [[0, '#ffffff'], [0.4, '#f2eaf8'], [0.7, '#cfc2e4'], [1, '#8a78ac']]);
    s.glow(T[0] - ux * 30, T[1] - uy * 30, 44, '#b07cff', 0.5, 'breathe');
    s.add('<g data-part="lance">');
    s.bloom(`<path d="${place(U(flames))}" fill="#9a5cff" opacity=".8"/><path d="${place(U(cores))}" fill="#efe2ff" opacity=".75"/>` +
      `<path d="${place(boneD)}" fill="${boneFill}"/><path d="${place(boneD)}" fill="none" stroke="#4a3468" stroke-width=".6" opacity=".7"/>` +
      `<path d="${place('M50,-6.2L51.6,6.2M54,-6.2L55.6,6.2M102,-5.8L103.6,5.8M106,-5.8L107.6,5.8')}" stroke="#3a2850" stroke-width="1.4"/>` +
      `<path d="${place('M24,-1.2L32,1.2M74,-1.4L78,1.4L82,-1.4M128,1.2L134,-1.2L140,1.2')}" fill="none" stroke="#a46bff" stroke-width="1" stroke-linecap="round"/>`, { sd: 1.6, k: 1.4, box: [0, 20, 280, 140] });
    s.add('</g>');
    s.motes({ seed: 14704, n: 18, x: [20, 250], y: [40, 150], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL. Bone Tithe: in a crypt a skeletal hand reaches out of the dark
  // and sets a glowing coin on an altar heaped with bones, between violet
  // candles; in the black archway behind, a cowled figure watches.
  'bone-tithe'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#06040b'], [0.45, '#130e20'], [1, '#221936']]));
    // the crypt wall, its stones caught by the candles
    const R = rng(14801);
    let mortar = '';
    for (let y = 12, row = 0; y < 150; y += 13, row++) {
      mortar += `M-5,${y}H305`;
      for (let x = (row % 2 ? 6 : 18) + R() * 6; x < 300; x += 22 + R() * 8) mortar += `M${f1(x)},${y}V${y + 13}`;
    }
    s.path('M-5,-5H305V150H-5Z', s.radU(150, 126, 190, [[0, '#30244a'], [0.5, '#1c152e'], [1, '#0c0814']]));
    s.add(`<path d="${mortar}" stroke="#08050e" stroke-width="1.2" opacity=".8"/>`);
    // the archway, dark as a well, and the watcher standing in it
    const arch = poly([[110, 150], [110, 78], ...Array.from({ length: 13 }, (_, i) => toward(150, 78, 180 + i * 15, 40)), [190, 78], [190, 150]]);
    s.path(arch, '#030106');
    let vous = '';
    for (let i = 0; i <= 12; i++) { const [x1, y1] = toward(150, 78, 180 + i * 15, 40), [x2, y2] = toward(150, 78, 180 + i * 15, 50); vous += `M${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}`; }
    s.add(`<path d="${vous}M100,78V150M200,78V150" stroke="#3a2e56" stroke-width="1.2" opacity=".8"/><path d="${'M' + Array.from({ length: 13 }, (_, i) => pt(toward(150, 78, 180 + i * 15, 50))).join('L')}" fill="none" stroke="#3a2e56" stroke-width="1.2"/>`);
    const watcher = blob([[150, 50], [160, 53], [167, 63], [167, 76], [179, 86], [186, 100], [188, 152], [112, 152], [114, 100], [121, 86], [133, 76], [133, 63], [140, 53]], 4);
    s.figure(`<path d="${watcher}"/>`, { fill: '#0b0713', rim: '#5e4a86', offsets: [[0, -1]], rimOp: 0.6 });
    s.path(blob([[150, 58], [157, 62], [160, 71], [157, 80], [150, 83], [143, 80], [140, 71], [143, 62]], 4), '#020104');
    // candles at both ends of the altar
    const candles = [[62, 146, 24, 4.8], [74, 146, 15, 4.2], [224, 146, 17, 4.4], [237, 146, 27, 5]];
    const wax = U(candles.map(([x, b, h, w]) => U(quad(x, b - h / 2, w, h), ell(x, b - h, w / 2, 1.2, 0, 10), taper([[x + w / 2 - 0.4, b - h], [x + w / 2 + 0.3, b - h + 4.6]], [1.3, 0.6], { per: 2 }))));
    s.figure(`<path d="${wax}"/>`, { fill: '#40305a', rim: '#efe2ff', offsets: [[0, -0.9]], rimOp: 0.6 });
    // the altar: a slab on a block, a skull carved on its front
    s.figure(`<path d="${U(quad(150, 182, 184, 64), quad(150, 147, 200, 10))}"/>`, { fill: '#1c1530', rim: '#c9b6f0', offsets: [[0, -1]], rimOp: 0.65, shade: 0.4, light: [0, -1] });
    const carved = skullAt(150, 186, 1.2);
    s.add(`<path d="M66,160H234V204H66Z" fill="none" stroke="#0e0a18" stroke-width="1.4" opacity=".8"/><path d="${carved.d}" fill="none" stroke="#0e0a18" stroke-width="1.2" opacity=".8"/>`);
    // the heap of bones on it, and the coins already given
    s.path(blob([[82, 145], [94, 135], [112, 127], [132, 121], [150, 119], [170, 121], [190, 128], [206, 136], [220, 145]], 4), '#120d1e');
    const boneFill = s.linU(0, 110, 0, 148, [[0, '#f2eafc'], [0.6, '#cfc1e4'], [1, '#8f7cae']]);
    const back = U(bone([90, 141], [128, 133], 3.4), bone([172, 131], [214, 141], 3.2), bone([118, 127], [146, 121], 2.8), bone([156, 121], [186, 128], 2.8), bone([100, 137], [116, 121], 2.6), bone([196, 121], [205, 139], 2.6));
    const skulls = [skullAt(110, 142, 0.95), skullAt(191, 142, 0.9), skullAt(131, 130, 0.7), skullAt(171, 128, 0.72)];
    s.path(back, boneFill);
    s.path(back, 'none', 'stroke="#140c20" stroke-width=".6"');
    s.path(U(skulls.map((k) => k.d)), boneFill);
    s.path(U(skulls.map((k) => k.d)), 'none', 'stroke="#140c20" stroke-width=".6"');
    s.path(dots(skulls.flatMap((k) => k.holes)), '#100a1a');
    s.path([[122, 139, 2.6, -10], [160, 137, 2.4, 14], [142, 126, 2.2, 0], [184, 134, 2.4, -16], [100, 130, 2, 20]].map(([x, y, r, a]) => oval(x, y, r, r * 0.42, a)).join(''), '#a8823a');
    // the arm reaching out of its sleeve, and the hand with the coin
    s.path(blob([[306, 18], [286, 26], [268, 40], [262, 56], [270, 70], [290, 66], [308, 58]], 4), '#09060f');
    const C = [148, 112];
    const chains = [
      [[198, 99], [180, 102], [168, 104], [159, 107], [154, 110]],
      [[199, 104], [186, 115], [175, 119], [165, 118], [157, 116]],
      [[199, 102], [182, 108], [171, 113], [166, 120], [168, 126]],
      [[200, 104], [185, 113], [176, 119], [173, 126], [176, 131]],
      [[201, 106], [189, 118], [182, 124], [181, 130], [184, 134]],
    ];
    const fingers = chains.flatMap((c) => c.slice(0, -1).map((p, i) => bone(p, c[i + 1], [3, 2.8, 2.5, 2.2][i])));
    const hand = U(bone([274, 56], [206, 95], 3.8), bone([280, 63], [210, 100], 3.2), ell(203, 99, 5.4, 3.8, 30, 12), ell(198, 103, 3.6, 3, 30, 10), fingers);
    s.figure(`<path d="${hand}"/>`, { fill: '#d8cceb', rim: '#ffffff', offsets: [[0, -0.8]], rimOp: 0.6 });
    s.path(hand, 'none', 'stroke="#2a1c40" stroke-width=".55" opacity=".9"');
    // the light: the coin, the candle flames, the watcher's eyes
    s.glow(C[0], C[1], 40, '#ffd77a', 0.5, 'breathe');
    for (const [x, b, h] of candles) s.glow(x, b - h - 5, 22, '#b07cff', 0.6);
    s.bloom(`<circle cx="${C[0]}" cy="${C[1]}" r="7" fill="${s.radU(C[0] - 2, C[1] - 2.4, 9, [[0, '#fffbe6'], [0.45, '#ffe08a'], [1, '#c8902e']])}"/>` +
      `<circle cx="${C[0]}" cy="${C[1]}" r="4.6" fill="none" stroke="#b0781e" stroke-width=".8"/><path d="${glint(C[0] - 2.4, C[1] - 2.8, 5, 0.16)}" fill="#ffffff"/>` +
      `<path d="${candles.map(([x, b, h]) => lens(x, b - h - 4.6, 8, -90, 0.44, 3)).join('')}" fill="#e6d2ff"/>` +
      `<path d="${candles.map(([x, b, h]) => lens(x, b - h - 3.8, 4, -90, 0.5, 3)).join('')}" fill="#ffffff"/>` +
      '<path d="M144.6,70.4h2.6M152.8,70.4h2.6" stroke="#d9c4ff" stroke-width="1.3" stroke-linecap="round"/>', { sd: 1.5, k: 1.45, box: [40, 50, 220, 90] });
    s.motes({ seed: 14802, n: 14, x: [40, 260], y: [30, 150], r: [0.35, 0.9], fill: '#c9b0f4', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // UMBRAL + VERDANT. Mire Witch: a witch stands knee-deep in a misty bog
  // at night, holding up a lantern full of glowing fungus; pale mushrooms
  // crowd the tussocks round her and violet will-o'-wisps rise off the
  // water.
  'mire-witch'(s) {
    fin(s, ['umbral', 'verdant']);
    s.rect(s.lin([[0, '#0a0916'], [0.36, '#1c1a32'], [0.6, '#363a50'], [0.72, '#46564a']]));
    s.add(particles({ seed: 14901, n: 22, x: [0, W], y: [0, 90], r: [0.25, 0.8], fill: '#e6e8f6', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    s.glow(56, 40, 90, '#d6dcc8', 0.35);
    s.add('<circle cx="56" cy="40" r="11" fill="#e8ecdc" opacity=".9"/>');
    // dead trees on the far side of the bog
    const snag = (x, b, h, k) => U(taper([[x, b], [x + 1, b - h * 0.6], [x - 1, b - h]], [4 * k, 3 * k, 1]),
      taper([[x + 0.6, b - h * 0.5], [x + 8 * k, b - h * 0.68], [x + 12 * k, b - h * 0.86]], [2 * k, 1.4 * k, 0.4]),
      taper([[x - 0.4, b - h * 0.62], [x - 7 * k, b - h * 0.74], [x - 9 * k, b - h * 0.9]], [1.8 * k, 1.2 * k, 0.4]));
    s.layer(ridge({ seed: 14902, base: 152, amp: 6, freq: 2.4 }) + U(snag(24, 150, 40, 1), snag(70, 152, 28, 0.8), snag(206, 150, 34, 0.9), snag(244, 151, 46, 1.1), snag(286, 152, 30, 0.8)), '#2e3442', { blur: 0.7 });
    s.haze(128, 158, '#6e7a6a', 0.3);
    // the bog: still black water, the moon in it
    s.path('M-10,154H310V214H-10Z', s.lin([[0, '#3a4450'], [0.25, '#1e2432'], [1, '#0a0c14']]));
    s.add(glitter([[56, 158, 10, 0.5], [58, 162, 6, 0.4], [55, 167, 8, 0.3]], '#e8ecdc'));
    // the far tussocks
    s.path(U(blob([[180, 160], [196, 154], [214, 155], [226, 160]], 3), blob([[96, 160], [110, 155], [124, 157], [132, 161]], 3)), '#141822');
    // the witch (facing right, the water at her knees on y = 0): a crooked
    // hat, a shawl, her hair down her back; one hand holds the lantern up,
    // the other a gnarled staff
    const witch = U(
      blob([[-9, -64], [9, -64], [13, -46], [16, -24], [19, 4], [-19, 4], [-16, -24], [-13, -46]], 4),
      taper([[0, -62], [0.5, -75], [0, -86]], [12, 12.4, 15.4]),
      blob([[-9, -89], [8, -89], [11, -80], [4, -70], [-6, -66], [-13, -72], [-13, -82]], 4),
      taper([[0, -87], [1, -91]], 4.4, { per: 2 }),
      ell(1.4, -95.6, 4.8, 5.8, 0, 16), poly([[5.4, -97], [10.4, -93.4], [5.4, -93.4]]),
      taper([[-2, -99], [-8, -92], [-11, -82], [-13, -72]], [7, 6, 4, 0.6]),
      ell(1.2, -100.6, 17, 3, -6, 22),
      taper([[0.8, -102], [1.8, -112], [4.4, -121], [10, -128], [16, -131]], [15, 11, 7, 3.4, 0.6]),
      taper([[6, -85], [16, -84], [24, -92]], [4.4, 3.8, 3.2]), ell(25.4, -94.4, 2.4, 2.6, 0, 12),
      taper([[-5, -84], [-12, -74], [-17, -66]], [4.4, 3.8, 3.2]), ell(-18.4, -65, 2.6, 2.4, 0, 12),
      taper([[-20, 6], [-19.4, -30], [-17.6, -70], [-15.4, -100], [-16.4, -110]], [3, 2.8, 2.6, 2.4, 2.2]),
      ell(-16.4, -112, 3.2, 3.6, 20, 12), taper([[-15, -110], [-9, -116], [-6, -122]], [1.6, 1.2, 0.5]), taper([[-18, -108], [-24, -114], [-25, -120]], [1.4, 1, 0.4]),
    );
    const wx = 146, wy = 172, wk = 0.94, Wp = at(wx, wy, wk);
    const lamp = lanternAt(wx + 25.4 * wk, wy - 92.6 * wk, 1.25);
    s.figure(`<path d="${U(Wp(witch), lamp.frame)}"/>`, { fill: '#0a0a10', rim: '#d6e6c0', offsets: [[0.9, -0.6], [0, -1.1], [-0.9, -0.7]], rimOp: 0.85, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    // the near water over her knees, rings spreading round her, the
    // lantern's light lying on the water
    s.path('M-10,173H310V214H-10Z', s.lin([[0, '#1a2030', 0.86], [1, '#0a0c14', 0.96]]));
    s.add('<path d="M-10,173.4H310" stroke="#8a9a9a" stroke-width=".6" opacity=".5"/><g fill="none" stroke="#b6c8b8" stroke-linecap="round" opacity=".5"><path d="M128,176q22,5 44,0M120,182q30,6 60,0" stroke-width=".9"/></g>');
    s.add(`<ellipse cx="${f1(lamp.c[0])}" cy="190" rx="5" ry="16" fill="${s.rad([[0, '#d8f08a', 0.5], [1, '#d8f08a', 0]])}"/>`);
    // tussocks crowded with pale mushrooms, and a drowned dead tree leaning
    // over the bog, moss hanging from it and shelf fungus on its trunk
    const caps = [mush(36, 178, 14, 6, 4.4, -10), mush(48, 176, 21, 7.4, 5.2, 4), mush(61, 178, 12, 4.8, 3.4, 12), mush(27, 181, 8, 3.6, 2.6, -8), mush(72, 181, 7, 3.4, 2.4, 10),
      mush(110, 182, 9, 4, 3, -6), mush(118, 183, 6, 3, 2.2, 8), mush(196, 182, 10, 4.4, 3.2, 6), mush(205, 183, 6, 3, 2.2, 14),
      mush(263, 158, 5, 3.6, 2.4, -66), mush(265, 146, 4, 3, 2, -68), mush(262, 170, 6, 4, 2.6, -64)];
    const limbs = [[[271, 98], [254, 86], [238, 82], [224, 72]], [[273, 62], [259, 50], [247, 47]], [[268, 132], [256, 129], [248, 121]]];
    const moss = [];
    for (const lb of limbs) for (const [x, y] of spline(lb, 2).slice(1, -1)) moss.push(taper([[x, y + 1], [x + 0.8, y + 8], [x - 0.6, y + 14]], [1.6, 1, 0.3], { per: 3 }));
    const ground = U(blob([[8, 196], [16, 180], [34, 176], [58, 175], [78, 179], [90, 190], [60, 198]], 4), blob([[100, 190], [108, 183], [122, 182], [130, 190]], 3), blob([[188, 190], [196, 183], [210, 182], [216, 190]], 3),
      taper([[270, 216], [268, 172], [273, 124], [271, 84], [279, 40], [288, -12]], [22, 17, 14, 12, 10, 9]),
      taper(limbs[0], [6, 4, 2.4, 0.8]), taper(limbs[1], [5, 3, 0.8]), taper(limbs[2], [4, 2.6, 0.6]), moss);
    s.figure(`<path d="${ground}"/>`, { fill: '#0c0e12', rim: '#b8c4a6', offsets: [[0, -1], [-0.8, -0.4]], rimOp: 0.55 });
    s.path(U(caps.map((m) => m.d)), s.lin([[0, '#f0eadc'], [1, '#a8a294']]));
    s.path(caps.map((m) => m.gill).join(''), '#6a6a5a');
    // the will-o'-wisps
    const wisps = [[96, 118, 1.2], [116, 82, 1], [210, 70, 1.1], [228, 122, 1.3], [80, 72, 0.8], [252, 94, 0.9], [132, 142, 0.8]];
    for (const [x, y, k] of wisps) s.glow(x, y, 13 * k, '#b07cff', 0.6, 'breathe');
    s.glow(lamp.c[0], lamp.c[1], 60, '#d8f08a', 0.55);
    s.glow(lamp.c[0], lamp.c[1], 18, '#f4ffc8', 0.7, 'breathe');
    s.bloom(`<path d="${lamp.glass}" fill="${s.radU(lamp.c[0], lamp.c[1], 8, [[0, '#ffffff'], [0.5, '#f0ffb0'], [1, '#b8e060']])}"/>` +
      `<path d="${[[-1.6, 2, 2.4, 1.6], [1.8, 0.4, 2, 1.4], [0, -2.8, 1.6, 1.1]].map(([dx, dy, rx, ry]) => oval(lamp.c[0] + dx, lamp.c[1] + dy, rx, ry)).join('')}" fill="#8aa83a"/>` +
      `<path d="${wisps.map(([x, y, k]) => lens(x, y + 4 * k, 9 * k, 90, 0.4, 3)).join('')}" fill="#b07cff" opacity=".6"/>` +
      `<path d="${dots(wisps.map(([x, y, k]) => [x, y, 1.8 * k]))}" fill="#f6eeff"/>`, { sd: 1.5, k: 1.5, box: [60, 50, 210, 110] });
    // reeds and bulrushes in the near corners, mist on the water
    const Q = rng(14903), reeds = [];
    for (const [x0, x1] of [[-6, 40], [262, 306]]) {
      for (let i = 0; i < 9; i++) {
        const x = x0 + Q() * (x1 - x0), h = 30 + Q() * 46, l = (Q() - 0.5) * 12;
        reeds.push(taper([[x, 216], [x + l * 0.4, 216 - h * 0.6], [x + l, 216 - h]], [1.6, 1.1, 0.4], { per: 3 }));
        if (i % 3 === 0) reeds.push(ell(x + l * 0.86, 216 - h * 0.86, 1.8, 5, l * 2, 10));
      }
    }
    s.path(U(reeds), '#06070a');
    s.fog(166, '#8a9aa0', 0.26).fog(188, '#7a8a9a', 0.3);
    s.motes({ seed: 14904, n: 16, x: [30, 270], y: [60, 190], r: [0.35, 0.9], fill: '#e6f78f', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // UMBRAL. Danse Macabre: in a moonlit graveyard a ring of skeletons and
  // pale ghosts whirls hand in hand round a bonfire of violet flame.
  'danse-macabre'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#08060f'], [0.4, '#1b1432'], [0.64, '#33285a'], [0.74, '#3c2f62']]));
    s.add(particles({ seed: 15001, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(252, 32, 70, '#c9b8f2', 0.4);
    s.add('<circle cx="252" cy="32" r="11" fill="#ece4fa"/><circle cx="248" cy="29" r="2.2" fill="#d4c8ea" opacity=".6"/>');
    // the chapel and graves beyond, the ground the dancers wheel on
    s.layer(ridge({ seed: 15002, base: 146, amp: 10, freq: 2 }) + 'M30,144V118L44,106L58,118V144ZM34,118V98L39,86L44,98V118Z' +
      U(ell(78, 132, 6, 15), ell(232, 130, 7, 18), ell(282, 134, 6, 14)) + crossD(108, 144, 14) + crossD(196, 142, 16) + crossD(262, 144, 12), '#2a2046', { blur: 0.7 });
    s.add('<path d="M42,124V119A2,2 0 0 1 46,119V124Z" fill="#c9a6ff" opacity=".6"/>');
    s.haze(116, 150, '#6a5494', 0.3);
    s.path(ledge([[-10, 152], [60, 148], [130, 150], [200, 147], [260, 150], [310, 148]]), s.lin([[0, '#231a3a'], [1, '#0a0710']]));
    s.glow(150, 126, 170, '#a46bff', 0.45);
    s.add(`<ellipse cx="150" cy="172" rx="124" ry="22" fill="${s.rad([[0, '#c9a6ff', 0.42], [1, '#c9a6ff', 0]])}"/>`);
    // a dancer: a skeleton (pale bone, rimmed by the fire) or a ghost
    // (a translucent sheet)
    const skel = (x, y, k, pose, lit, rim) => {
      const sk = skeleton(pose), A = at(x, y, k);
      s.figure(`<path d="${A(sk.d)}"/>`, { fill: lit ? '#ece4f6' : '#9c8ec0', rim: '#fbf6ff', offsets: rim, rimOp: 0.9 });
      s.path(dots(sk.eyes.map(([ex, ey, r]) => [x + ex * k, y + ey * k, r * k])), '#120a1e');
    };
    const spook = (x, y, k, pose, op) => {
      const g = ghost(pose), A = at(x, y, k), d = A(g.d);
      s.path(d, s.lin([[0, '#f6f0ff', op], [1, '#c8b4f0', op * 0.3]]));
      s.path(d, 'none', `stroke="#f6f0ff" stroke-width=".7" opacity="${f2(op)}"`);
      s.path(dots(g.face.map(([fx, fy, r]) => [x + fx * k, y + fy * k, r * k])), '#1a1030', `opacity="${f2(Math.min(1, op + 0.2))}"`);
    };
    // the far side of the ring, behind the fire
    skel(116, 152, 0.56, { tilt: -10, la: [-160, -130], ra: [-40, -80], ll: [104, 92], rl: [24, 84] }, true, [[0.8, -0.6]]);
    skel(186, 151, 0.56, { tilt: 10, la: [-140, -100], ra: [-20, -50], ll: [150, 100], rl: [80, 90] }, true, [[-0.8, -0.6]]);
    // the fire: logs, violet flames, a white-hot heart
    s.path(U(taper([[122, 180], [178, 168]], [5, 4], { per: 2 }), taper([[124, 168], [180, 180]], [5, 4], { per: 2 }), taper([[140, 182], [162, 162]], [4, 3.4], { per: 2 })), '#0c0812');
    const fire = s.radU(150, 168, 100, [[0, '#ffffff'], [0.14, '#f4e8ff'], [0.36, '#cfa6ff'], [0.7, '#8a4ae6', 0.9], [1, '#5a2aa8', 0.5]]);
    const tongues = [plume(150, 174, -90, -96, 98, [30, 34, 26, 16, 6, 0.5]), plume(136, 174, -106, -128, 72, [20, 22, 16, 8, 0.5]), plume(164, 174, -74, -52, 74, [20, 22, 16, 8, 0.5]),
      plume(126, 176, -130, -160, 44, [12, 12, 8, 3, 0.4]), plume(174, 176, -50, -20, 44, [12, 12, 8, 3, 0.4]), plume(144, 170, -96, -70, 62, [10, 10, 6, 0.4])];
    const core = [plume(150, 174, -90, -84, 58, [18, 18, 10, 0.5]), plume(142, 174, -100, -120, 34, [10, 9, 4, 0.4]), plume(158, 174, -80, -60, 34, [10, 9, 4, 0.4])];
    s.glow(150, 150, 46, '#f2e4ff', 0.6, 'breathe');
    s.bloom(`<path d="${tongues.join('')}" fill="${fire}"/><path d="${core.join('')}" fill="#fbf6ff" opacity=".9"/>`, { sd: 2, k: 1.4, box: [80, 50, 140, 150] });
    // the near side of the ring, dark against the fire
    spook(36, 168, 0.9, { tilt: 12, la: -150, ra: -30, dir: 1 }, 0.72);
    spook(266, 166, 0.9, { tilt: -12, la: -150, ra: -30, dir: -1 }, 0.72);
    skel(86, 190, 1.02, { tilt: -6, la: [-160, -130], ra: [-40, -60], ll: [96, 90], rl: [10, 70] }, false, [[0.9, -0.7], [0, -1]]);
    skel(214, 190, 1.02, { tilt: 8, la: [-140, -110], ra: [-20, 10], ll: [170, 110], rl: [84, 92] }, false, [[-0.9, -0.7], [0, -1]]);
    // graves in the near corners
    s.figure(`${slab(10, 218, 22, 30, -8)}${cross(294, 218, 34, 7)}`, { fill: '#08060c', rim: '#b8a6e2', offsets: [[0, -1]], rimOp: 0.6 });
    s.motes({ seed: 15003, n: 22, x: [110, 190], y: [40, 160], r: [0.35, 1], fill: '#c9a6ff', hot: '#ffffff', cls: 'rise', t: [3, 7], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── LEGENDS ───────────────────────────────────────────────────────

  // VERDANT + TIDE. Marisol, the Harbormistress: on the river dock at
  // sunset the harbormistress stands with her lantern held high and her
  // ledger under her arm; barges loaded with grain sacks and fish lie at
  // the quay either side of her, gulls wheel, and the sun goes down over
  // the delta right behind her.
  'legend-marisol'(s) {
    fin(s, ['verdant', 'tide']);
    s.rect(s.lin([[0, '#1c3c50'], [0.24, '#3c6672'], [0.44, '#9c9c84'], [0.56, '#eabf88'], [0.64, '#f4a864']]));
    // the sun going down over the delta, right behind her
    const sx = 150, sy = 128;
    s.glow(sx, sy, 200, '#ffd9a0', 0.75);
    s.shafts({ cx: sx, cy: sy, n: 20, from: -180, to: 0, len: 320, spread: 2, color: '#fff0d0', op: 0.2, seed: 9600 });
    s.glow(sx, sy, 56, '#fff6e0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="15" fill="#fff6e2"/>`);
    s.path(U(gull(84, 44, 1.1, -6), gull(222, 34, 1, 8), gull(246, 64, 0.8, 4), gull(58, 76, 0.7, -10), gull(196, 58, 0.6, 2)), '#24323a');
    // the far shore: low islands, poplars, a windmill
    const mill = U(taper([[60, 134], [60, 116]], [7, 4.4], { per: 2 }), poly([[57, 117], [60, 112], [63, 117]]),
      [20, 110, 200, 290].map((a) => taper([[60, 114], toward(60, 114, a, 12)], [2.4, 1.6], { per: 2 })));
    const pop = [];
    for (const [x, n] of [[18, 3], [96, 2], [212, 3], [270, 2]]) for (let i = 0; i < n; i++) pop.push(ell(x + i * 5, 128 - (i % 2) * 2, 2.2, 6 + (i % 2) * 2, 0, 12));
    s.layer(ridge({ seed: 9601, base: 136, amp: 5, freq: 3 }) + U(mill, pop), '#868672', { blur: 0.7 });
    s.haze(116, 138, '#f4c890', 0.34);
    // the water, the sun's road across it
    s.path('M-10,135H310V214H-10Z', s.lin([[0, '#e6b27a'], [0.12, '#8a948a'], [0.5, '#3a5a62'], [1, '#14282e']]));
    s.add(glitter([[150, 137, 32, 0.9], [150, 141, 22, 0.8], [150, 146, 38, 0.7], [150, 152, 26, 0.6], [150, 159, 46, 0.5], [150, 167, 32, 0.45]], '#fff4dc'));
    // the barges at the quay: grain sacks heaped on the left one, fish
    // baskets, crates and a crane on the right one
    const sacks = [[6, 145, 8, 5], [20, 145, 9, 5.4], [34, 146, 8, 5], [48, 146, 9, 5], [62, 146.4, 8, 4.6], [13, 137, 8, 5], [27, 137, 9, 5.4], [41, 138, 8, 5], [55, 139, 8, 4.6], [20, 129, 8, 5], [34, 130, 8, 5], [27, 122, 7, 4.6]];
    const left = U(poly([[-12, 150], [74, 150], [92, 143], [98, 144], [90, 162], [-12, 162]]), sacks.map(([x, y, rx, ry]) => ell(x, y, rx, ry, 0, 14)),
      poly([[37, 150], [37, 40], [39, 40], [39, 150]]), taper([[14, 52], [62, 46]], 1.6, { per: 2 }), taper([[16, 54], [38, 51.6], [60, 48]], [3, 4.6, 3]));
    const baskets = [[228, 146, 8, 6], [246, 145, 9, 7], [264, 146, 8, 6], [282, 145, 9, 7], [300, 146, 8, 6]];
    const right = U(poly([[312, 152], [226, 152], [208, 145], [202, 146], [210, 164], [312, 164]]),
      baskets.map(([x, y, w, h]) => poly([[x - w, y - h / 2], [x + w, y - h / 2], [x + w * 0.8, y + h / 2], [x - w * 0.8, y + h / 2]])),
      quad(238, 136, 12, 10), quad(288, 134, 14, 12), quad(254, 132, 10, 8),
      poly([[270, 152], [270, 62], [273, 62], [273, 152]]), taper([[271.4, 74], [248, 62], [228, 58]], [3, 2.4, 1.8]),
      poly([[292, 152], [292, 42], [294, 42], [294, 152]]),
      blob([[221, 96], [228, 93.6], [235, 97], [237, 106], [233, 113], [228, 115], [222, 113], [219, 105]], 4));
    s.figure(`<path d="${left}"/><path d="${right}"/>`, { fill: '#141a1c', rim: '#ffd8a0', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.9 });
    s.add('<g fill="none" stroke="#141a1c" stroke-width=".7" opacity=".9"><path d="M38,42L96,144M38,42L-6,150M38,58L80,150M293,44L232,152M293,44L312,120M228,58V92M271,64L240,152"/></g>');
    s.add(`<path d="${sacks.map(([x, y, rx]) => `M${f1(x - rx * 0.5)},${f1(y - 1)}h${f1(rx)}`).join('')}" stroke="#ffd8a0" stroke-width=".6" opacity=".35"/>`);
    s.path(dots([[236, 141, 1], [250, 140, 1.1], [262, 141.6, 1], [280, 140.4, 1.1]]), '#e8f4f0', 'opacity=".7"');
    s.add('<path d="M221,100L234,112M226,95L237,106M220,108L229,115M235,99L222,112M231,95L219,106M237,107L228,115" stroke="#ffd8a0" stroke-width=".5" opacity=".45"/>');
    // the dock: planks running back toward the sun, its lit edge, bollards
    s.path('M-10,176H310V214H-10Z', s.lin([[0, '#3a2a1c'], [1, '#120c08']]));
    let planks = '';
    for (let i = -9; i <= 9; i++) planks += `M${f1(150 + i * 12)},176L${f1(150 + i * 46)},214`;
    s.add(`<path d="${planks}" stroke="#0e0906" stroke-width="1" opacity=".8"/><path d="M-10,176.6H310" stroke="#ffcf8a" stroke-width="1.2" opacity=".55"/>`);
    s.add(`<ellipse cx="150" cy="190" rx="70" ry="10" fill="${s.rad([[0, '#ffcf8a', 0.3], [1, '#ffcf8a', 0]])}"/>`);
    // Marisol: a long coat open over boots, its skirts blowing out to the
    // right; a broad hat with a feather, her hair tied back; the lantern
    // held up in her right hand, the ledger clamped under her left arm
    const her = U(
      taper([[-4.6, -38], [-5.4, -20], [-6.4, -3]], [7, 6, 5.2]), ell(-8, -1.6, 5.4, 2.4, 0, 12),
      taper([[4.6, -38], [5.6, -20], [6.6, -3]], [7, 6, 5.2]), ell(8.4, -1.6, 5.4, 2.4, 0, 12),
      poly(spline([[-9, -64], [-14, -46], [-19, -30], [-22, -20], [-12, -22], [-6, -36], [0, -44], [6, -36], [14, -24], [24, -20], [33, -22], [27, -29], [20, -42], [12, -58], [9, -64]], 4, true)),
      taper([[0, -58], [0, -76], [0, -92]], [17, 16, 22]),
      ell(-10, -91, 6, 4.4, 0, 14), ell(10, -91, 6, 4.4, 0, 14),
      taper([[0, -94], [0, -100]], 5, { per: 2 }),
      ell(0.6, -105.5, 5.4, 6.6, 0, 16),
      ell(0.4, -110.4, 15, 3, -5, 22), blob([[-6, -111], [6.4, -112], [5.8, -118], [0, -120.4], [-5.6, -118]], 4),
      leafAt(2, -115.6, -12, 17, 0.26, 3),
      taper([[4, -104], [11, -101], [18, -96], [24, -94]], [4.4, 3.4, 2, 0.4]),
      taper([[-10, -90], [-18, -104], [-22, -118]], [5.4, 4.6, 4]), taper([[-22, -118], [-24, -130]], [4, 3.4], { per: 2 }), ell(-24.4, -133, 2.6, 3, 0, 12),
      taper([[10, -90], [17, -78], [18, -66]], [5.4, 4.6, 4]), taper([[18, -66], [11, -60]], [4, 3.6], { per: 2 }),
    );
    const fx = 150, fy = 194, M = at(fx, fy, 1);
    const lamp = lanternAt(fx - 24.4, fy - 132, 1.3);
    s.figure(`<path d="${U(M(her), lamp.frame)}"/>`, { fill: '#1a1612', rim: '#ffe2b0', offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.figure(`<path d="${M(quad(21.4, -72, 9, 21, -8))}"/>`, { fill: '#3c2416', rim: '#ffe2b0', offsets: [[0.8, -0.8]], rimOp: 0.9 });
    s.path(M(quad(25.4, -72.6, 2.4, 19, -8)), '#efe2c4');
    s.add(`<path d="${M('M14,-80L22,-81M14.4,-64L23.4,-65')}" stroke="#b08850" stroke-width=".8"/>`);
    // her lantern
    s.glow(lamp.c[0], lamp.c[1], 70, '#ffd98a', 0.5);
    s.glow(lamp.c[0], lamp.c[1], 20, '#fff4d0', 0.75, 'breathe');
    s.bloom(`<path d="${lamp.glass}" fill="${s.radU(lamp.c[0], lamp.c[1], 8, [[0, '#ffffff'], [0.5, '#fff0c0'], [1, '#ffc060']])}"/>` +
      `<path d="${glint(lamp.c[0], lamp.c[1], 9, 0.12)}" fill="#ffffff" opacity=".85"/>`, { sd: 1.6, k: 1.5, box: [96, 46, 60, 60] });
    // a coil of rope, a crate and a fish basket on the near planks
    s.figure(`<path d="${U(quad(272, 198, 30, 22), quad(290, 182, 22, 14), blob([[14, 214], [10, 196], [20, 190], [36, 190], [44, 196], [42, 214]], 4))}"/>`, { fill: '#0e0a08', rim: '#ffcf8a', offsets: [[0, -1]], rimOp: 0.6 });
    s.add(`<path d="${oval(70, 200, 12, 4)}${oval(70, 199, 8, 2.6)}${oval(70, 198.4, 4, 1.3)}" fill="none" stroke="#2a1e14" stroke-width="2"/><path d="M257,198H287M272,187V209" stroke="#2a1e14" stroke-width="1.2"/>`);
    s.motes({ seed: 9602, n: 16, x: [20, 280], y: [30, 180], r: [0.4, 1], fill: '#ffe2a8', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL + VERDANT. Morrow, the Bone Gardener: an old woman in a hooded
  // cloak stands in a moonlit graveyard garden, one hand on her spade (a
  // lantern hangs from its handle), the other scattering glowing seed over
  // a grave; pale lilies and glowing mushrooms grow out of the graves all
  // round her.
  'legend-morrow'(s) {
    fin(s, ['umbral', 'verdant']);
    s.rect(s.lin([[0, '#090a14'], [0.4, '#1a1c32'], [0.64, '#33364c'], [0.78, '#3e4a46']]));
    s.add(particles({ seed: 9620, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.85], fill: '#e8e6f6', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, right behind her
    const mx = 148, my = 82;
    s.glow(mx, my, 150, '#d8d0f4', 0.5);
    s.glow(mx, my, 52, '#efeaff', 0.6);
    s.add(`<circle cx="${mx}" cy="${my}" r="26" fill="#ece8f6"/><circle cx="${mx - 9}" cy="${my - 7}" r="4.6" fill="#d8d2ea" opacity=".6"/><circle cx="${mx + 10}" cy="${my + 8}" r="3.4" fill="#d8d2ea" opacity=".5"/><circle cx="${mx + 6}" cy="${my - 12}" r="2.4" fill="#d8d2ea" opacity=".5"/>`);
    // the far graveyard: yews and crosses along the rise, a lychgate
    const yews = U(ell(30, 132, 7, 18), ell(58, 136, 6, 14), ell(236, 130, 8, 20), ell(270, 134, 6, 15));
    s.layer(ridge({ seed: 9621, base: 150, amp: 8, freq: 2.2 }) + yews + 'M96,148V126H100V148ZM116,148V126H120V148ZM92,128L108,116L124,128Z' +
      crossD(78, 148, 12) + crossD(190, 146, 14) + crossD(212, 148, 10), '#2c2e44', { blur: 0.7 });
    s.haze(128, 160, '#5a6070', 0.3);
    s.path(ledge([[-10, 164], [60, 160], [130, 162], [200, 159], [260, 162], [310, 160]]), '#1c1e2c');
    s.add(`<g fill="#24263a">${slab(20, 166, 12, 18, -5)}${slab(92, 164, 11, 15, 4)}${cross(206, 163, 20, -5)}${slab(250, 164, 12, 17, 6)}${slab(286, 163, 10, 14, -3)}</g>`);
    s.fog(162, '#8a8fb0', 0.28);
    // the near ground, a moonlit path down the middle
    s.path(ledge([[-10, 182], [50, 179], [120, 182], [180, 181], [240, 178], [310, 181]]), s.lin([[0, '#1a1c28'], [1, '#08090e']]));
    s.path(taper([[148, 168], [149, 182], [150, 198], [150, 216]], [10, 26, 44, 64]), '#4a4c5e', 'opacity=".4"');
    // the two near graves: a headstone and a cross, their mounds
    const mounds = U(blob([[8, 204], [16, 190], [40, 184], [72, 184], [100, 190], [112, 204], [60, 208]], 5), blob([[188, 204], [196, 192], [220, 186], [254, 186], [278, 192], [288, 204], [240, 208]], 5));
    s.figure(`<path d="${mounds}"/>${slab(34, 190, 22, 40, -6)}${cross(268, 192, 46, 5)}`, { fill: '#0c0d14', rim: '#c8c4e6', offsets: [[0, -1.1], [0.6, -0.7]], rimOp: 0.8 });
    // pale lilies and daisies growing out of them
    const lily = (x, y, h, a) => {
      const top = toward(x, y, -90 + a, h);
      return U(taper([[x, y], [x + a * 0.06, y - h * 0.5], top], [1.4, 1.1, 0.8], { per: 3 }), leafAt(x, y - 2, -90 + a - 50, h * 0.5, 0.3, 3),
        leafAt(...top, -90 + a - 42, 6.4, 0.46, 3), leafAt(...top, -90 + a + 42, 6.4, 0.46, 3), leafAt(...top, -90 + a, 7, 0.44, 3), leafAt(...top, -90 + a - 14, 5, 0.5, 3));
    };
    const lilies = U(lily(52, 186, 16, -8), lily(64, 186, 20, 6), lily(76, 188, 14, 14), lily(22, 192, 12, -16), lily(206, 190, 15, -10), lily(232, 188, 19, 4), lily(246, 189, 13, 12));
    const daisy = (x, y, r) => blob(Array.from({ length: 10 }, (_, i) => toward(x, y, i * 36, i % 2 ? r * 0.4 : r)), 2);
    s.path(U(lilies, [[92, 196, 2.6], [100, 199, 2.2], [84, 200, 2], [16, 200, 2.2], [216, 198, 2.6], [262, 200, 2.2], [280, 198, 2]].map(([x, y, r]) => daisy(x, y, r))), s.lin([[0, '#f6f2fa'], [1, '#a8a2c0']]));
    // Morrow (facing right, feet on y = 0): a long hooded cloak, her
    // feet showing under its hem, her back bent a little; one hand on the
    // spade, the other held out over the grave
    const her = U(
      poly(spline([[-12, -82], [-19, -66], [-23, -44], [-27, -22], [-41, -9], [-28, -6], [-12, -8], [0, -9], [11, -9], [15, -12], [16, -34], [16, -56], [16, -74], [10, -85]], 4, true)),
      taper([[-4, -10], [-4.6, -3]], 3.6, { per: 2 }), ell(-2.4, -1.8, 4.4, 2.2, 0, 12),
      taper([[7, -10], [7.4, -3]], 3.6, { per: 2 }), ell(9.6, -1.8, 4.4, 2.2, 0, 12),
      blob([[-11, -83], [-15, -93], [-11, -103], [-3, -108], [7, -106], [15, -99], [17, -90], [12, -83]], 4),
      ell(-19, -48, 7.4, 8.4, -10, 14), taper([[-8, -82], [-19, -56]], 1.6, { per: 2 }),
      taper([[9, -80], [18, -76], [27, -77]], [6, 5, 4.4]), ell(29, -77, 3, 3.4, 0, 12),
      taper([[-7, -80], [-17, -70], [-30, -66]], [6, 5, 4.4]), ell(-33, -66, 3.4, 2.6, -10, 12),
    );
    const spade = U(poly([[25.6, -1], [34.4, -1], [34.6, -12], [30, -15], [25.4, -12]]), taper([[30, -14], [30, -112]], 2.6, { per: 2 }), taper([[24, -112], [36.4, -112]], 2.6, { per: 2 }), taper([[36, -112], [38.4, -107]], 1.2, { per: 2 }));
    const fx = 150, fy = 195, k = 1.1, M = at(fx, fy, k);
    const lamp = lanternAt(fx + 38.4 * k, fy - 107 * k, 1.25);
    const shape = U(M(her), M(spade), lamp.frame);
    // the lantern's warm light along her near side, the moon's round the rest
    s.path(mv(shape, 1.4, 0.2), '#f2e8a8', 'opacity=".85"');
    s.figure(`<path d="${shape}"/>`, { fill: '#0c0b12', rim: '#ddd6f6', offsets: [[0, -1.3], [-1.1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.add(`<path d="${M('M-6,-80Q-11,-52 -17,-16M3,-80Q2,-48 1,-12M-22,-34Q-28,-22 -34,-11')}" fill="none" stroke="#2a2838" stroke-width="1" opacity=".9"/>`);
    // her old face in the hood, wisps of white hair
    s.path(M(U(blob([[8.4, -97.4], [11.6, -97], [13.2, -94.4], [15.8, -92.2], [13.4, -91.4], [13, -89.2], [9.8, -87.6], [7.6, -90.4]], 3), ell(29, -77, 2.4, 2.8, 0, 10), ell(-33.4, -66.4, 2.8, 2, -10, 10))), '#b8a68c');
    s.add(`<path d="${M('M7.6,-98Q5,-93 6,-86.6M9,-98.6Q7,-94 8.4,-89')}" fill="none" stroke="#e6e2ee" stroke-width=".8" opacity=".85"/>`);
    // the seed falling from her hand, the mushrooms glowing on the graves
    const [hx, hy] = [fx - 33 * k, fy - 66 * k];
    const R = rng(9622), seeds = [];
    for (let i = 0; i < 14; i++) { const t = i / 13; seeds.push([hx - 6 - t * 40 + (R() - 0.5) * 8, hy + 4 + t * (186 - hy) + (R() - 0.5) * 6, 0.9 - t * 0.3]); }
    const shrooms = [mush(42, 190, 9, 4.6, 3.4, -10), mush(50, 188, 13, 5.6, 4, 2), mush(88, 192, 8, 4, 2.8, 10), mush(97, 194, 5, 2.8, 2, 16),
      mush(222, 190, 11, 5, 3.6, -6), mush(214, 192, 6, 3, 2.2, -14), mush(256, 192, 8, 4, 2.8, 8), mush(130, 200, 6, 3.2, 2.2, -8), mush(168, 202, 7, 3.6, 2.6, 8)];
    for (const [x, y] of [[48, 178], [220, 180], [100, 190]]) s.glow(x, y, 22, '#d8f08a', 0.5, 'breathe');
    s.glow(lamp.c[0], lamp.c[1], 50, '#f2e8a8', 0.5);
    s.glow(lamp.c[0], lamp.c[1], 16, '#fffbe0', 0.75, 'breathe');
    s.bloom(`<path d="${U(shrooms.map((m) => m.d))}" fill="${s.lin([[0, '#f6ffc8'], [0.6, '#cfe880'], [1, '#7a9a3a']])}"/>` +
      `<path d="${dots(seeds)}" fill="#efffb0"/>` +
      `<path d="${lamp.glass}" fill="${s.radU(lamp.c[0], lamp.c[1], 8, [[0, '#ffffff'], [0.5, '#fff6c8'], [1, '#e8d070']])}"/>`, { sd: 1.4, k: 1.5, box: [10, 60, 270, 150] });
    s.fog(196, '#8a8fb0', 0.22);
    s.motes({ seed: 9623, n: 18, x: [20, 280], y: [60, 200], r: [0.35, 0.9], fill: '#e6f78f', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.35, 0.85] });
    return s.svg();
  },
};
