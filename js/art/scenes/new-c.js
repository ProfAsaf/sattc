// Card art for the second half of Week One (cards 46–90). Style rules live
// in ../scenes.js; drawing tools in ../kit.js.

import { W, blob, particles, pines, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();
const NUM = /(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g;

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

// Move, scale, rotate or mirror a polygon path.
const mv = (d, dx, dy) => d.replace(NUM, (_, x, y) => `${f1(+x + dx)},${f1(+y + dy)}`);
const sc = (d, ox, oy, k, ky = k) => d.replace(NUM, (_, x, y) => `${f1(ox + (x - ox) * k)},${f1(oy + (y - oy) * ky)}`);
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const flipX = (d, ax) => d.replace(NUM, (_, x, y) => `${f1(2 * ax - x)},${y}`);

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A lens-shaped leaf centred on (x, y), `l` long, turned `a` degrees.
const leaf = (x, y, l, a, w = 0.38) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], 4), x, y, a);

// A licking flame: an S-curved tongue, fattest a little above its root.
const flame = (x, y0, h, lean, w, wob = 0.14) => taper(
  [[x, y0], [x + lean * 0.12 + w * wob * 2, y0 - h * 0.28], [x + lean * 0.42 - w * wob * 3, y0 - h * 0.55], [x + lean * 0.74 + w * wob * 2, y0 - h * 0.8], [x + lean, y0 - h]],
  [w * 0.8, w, w * 0.68, w * 0.32, 0.3], { per: 6 });

// A jagged line from a to b.
function bolt(a, b, seed, n = 9, jag = 6) {
  const R = rng(seed), pts = [a];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) {
    const t = i / n, j = (R() - 0.5) * 2 * jag;
    pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  pts.push(b);
  return pts;
}
const polyline = (pts) => 'M' + pts.map(pt).join('L');

// A kite shield: top edge at `top`, half-width hw, height h.
const kite = (kx, top, hw, h) => poly([[kx - hw, top + h * 0.04], [kx - hw * 0.5, top - h * 0.015], [kx, top - h * 0.03], [kx + hw * 0.5, top - h * 0.015], [kx + hw, top + h * 0.04],
  [kx + hw * 0.98, top + h * 0.3], [kx + hw * 0.8, top + h * 0.55], [kx + hw * 0.45, top + h * 0.8], [kx, top + h],
  [kx - hw * 0.45, top + h * 0.8], [kx - hw * 0.8, top + h * 0.55], [kx - hw * 0.98, top + h * 0.3]]);

// A painted sun: ring and eight short rays, as one stroked path.
const sunMark = (x, y, r) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0` +
  Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(x + Math.cos(a) * r * 1.45)},${f1(y + Math.sin(a) * r * 1.45)}L${f1(x + Math.cos(a) * r * 2)},${f1(y + Math.sin(a) * r * 2)}`; }).join('');

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// Gradients in canvas units: linear, radial, and an elliptical radial.
function linU(s, x1, y1, x2, y2, stops) {
  const id = s.uid('nl');
  s.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">${s.stops(stops)}</linearGradient>`);
  return `url(#${id})`;
}
function radE(s, cx, cy, rx, ry, stops) {
  const id = s.uid('ne');
  s.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${f1(cx)} ${f1(cy)}) scale(${f1(rx)} ${f1(ry)})">${s.stops(stops)}</radialGradient>`);
  return `url(#${id})`;
}

// Blend two hex colours (t = 0 gives a).
const lerpC = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16), ch = (v, sh) => (v >> sh) & 255;
  return '#' + [16, 8, 0].map((sh) => Math.round(ch(A, sh) + (ch(B, sh) - ch(A, sh)) * t).toString(16).padStart(2, '0')).join('');
};

// A small winged spirit (the Spirit token's shape), centred on its chest.
function sprite(x, y, k = 1) {
  const X = (dx) => x + dx * k, Y = (dy) => y + dy * k;
  const wing = (d) => taper([[X(d * 1.6), Y(-1.5)], [X(d * 6), Y(-6)], [X(d * 11), Y(-9.5)], [X(d * 14.5), Y(-9)]], [3.2 * k, 4.4 * k, 2.6 * k, 0.4 * k]);
  return U(ell(X(0), Y(-5.5), 3 * k, 3.1 * k), taper([[X(0), Y(-2.2)], [X(0), Y(3.5)], [X(0), Y(10)]], [4.6 * k, 3.4 * k, 0.4 * k]), wing(-1), wing(1));
}

// A horse at full gallop, facing right, hooves on y = 0 (about 64 long):
// near legs stretched out fore and aft, far legs gathered under it.
function horse() {
  return U(
    ell(0, -22, 13.5, 7.2), ell(10, -23, 7.5, 7.8), ell(-10, -23, 8, 7.6),
    taper([[12, -27], [18, -33], [23, -37]], [10, 7.4, 5.4]),
    taper([[22, -38], [27.5, -35], [31, -31]], [6, 4.6, 3.2]),
    taper([[21.5, -40.5], [21, -44.5]], [2, 0.4]),
    taper([[13, -18], [21, -14], [28.5, -12.5]], [4.4, 3, 2.2]),
    taper([[9, -17], [12.5, -10], [7.5, -6]], [4, 2.8, 2.2]),
    taper([[-13, -19], [-21, -12], [-30, -9]], [5.4, 3.4, 2.4]),
    taper([[-8, -17], [-6, -9], [-2, -3.5]], [5, 3.2, 2.2]),
    taper([[-17, -26], [-26, -26], [-34, -22]], [3.8, 3.2, 1]),
  );
}
// Its rider, hunched into the gallop, spiked helm, sword up and forward.
function horseman() {
  return U(horse(),
    taper([[0, -28], [4, -36], [8, -42]], [7.4, 6.6, 7.4]),
    taper([[2, -29], [6, -23], [5, -18]], [3.6, 3, 2.6]),
    ell(10.5, -46, 3.5, 3.7),
    poly([[7.8, -47.5], [10.5, -56.5], [13.2, -47.5]]),
    taper([[2, -39], [-6, -38], [-14, -33]], [5, 4.4, 1.2]),
    taper([[7, -40], [12, -46], [15, -51]], [3, 2.6, 2.2]),
    taper([[15, -51], [21, -60], [25, -67]], [2, 1.6, 0.4]),
  );
}

export const new_c = {
  // A boy soldier braced inside a dome of light; a black spear hits it and
  // breaks apart in a flash.
  bastion(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#5a6b86'], [0.42, '#a3a396'], [0.74, '#e6cf9c'], [1, '#e7b878']]));
    s.glow(60, 172, 110, '#ffe7b0', 0.35);
    s.layer(ridge({ seed: 7801, base: 162, amp: 24, freq: 2.2 }), '#a69b86', { blur: 0.7 });
    s.haze(134, 172, '#f2dcab', 0.38);
    s.path(ridge({ seed: 7802, base: 180, amp: 10, freq: 3 }), '#75654f');
    s.path('M-10,214L-10,185C60,182 140,181 200,183C250,184 282,182 310,184L310,214Z', s.lin([[0, '#4c3b28'], [1, '#1f160d']]));
    // the dome: faint inside, bright at its skin
    const cx = 126, cy = 186, rx = 94, ry = 122;
    s.add('<g data-part="dome">');
    s.path(`M${cx - rx},${cy}A${rx},${ry} 0 0 1 ${cx + rx},${cy}Z`,
      radE(s, cx, cy, rx, ry, [[0, '#fff6d8', 0.62], [0.55, '#ffe6a6', 0.36], [0.86, '#ffd77a', 0.38], [0.965, '#fff2c8', 0.85], [1, '#fff2c8', 0]]));
    s.add(`<ellipse cx="${cx}" cy="${cy}" rx="${rx + 4}" ry="6" fill="#ffe39a" opacity=".55"/>`);
    s.add('</g>');
    // the boy, braced behind his little shield
    const kid = sc(U(
      taper([[100, 152], [93, 167], [86, 181]], [8.4, 6.6, 5.4]),
      taper([[107, 152], [117, 165], [119, 181]], [8.6, 7, 5.6]),
      ell(84, 183, 5.6, 2.4), ell(122, 183, 6, 2.4),
      poly([[97, 140], [113, 140], [117, 156], [94, 156]]),
      taper([[104, 154], [107, 140], [111, 126]], [13, 12.5, 14]),
      taper([[112, 124], [114, 118]], 4.6),
      ell(115.5, 114, 5.4, 6),
      ell(116, 108.5, 8.6, 6, -8),
      ell(117, 112, 12.4, 2.1, -8),
      taper([[113, 127], [121, 133], [128, 132]], [5.2, 4.4, 4]),
      ell(134, 131, 8.5, 15.5, -6),
      taper([[106, 128], [100, 138], [96, 146]], [5, 4.4, 4]),
      ell(95.5, 147, 2.6, 2.6),
      taper([[93, 143], [99.5, 150.5]], 1.8),
      taper([[95, 148.5], [86, 157], [77, 164]], [2.6, 2.2, 0.6]),
    ), 104, 184, 1.3);
    s.figure(`<path d="${kid}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.7], [0.5, -1.3]], rimOp: 0.95, shade: 0.5, edge: 0.32, light: [1, -0.6] });
    s.add('<circle data-part="boss" cx="143.4" cy="115.1" r="2.8" fill="#ffd77a"/>');
    // the dome's skin in front of him: a meridian, two latitudes, the lit rim
    s.add(`<g data-part="skin" fill="none" stroke="#fff3cc">` +
      `<path d="M${cx - 58},${cy}A58,${ry} 0 0 1 ${cx + 58},${cy}" stroke-width=".8" opacity=".32"/>` +
      `<path d="M${cx - 81},125A81,7.5 0 0 0 ${cx + 81},125" stroke-width=".8" opacity=".32"/>` +
      `<path d="M${cx - 50},83A50,4.8 0 0 0 ${cx + 50},83" stroke-width=".7" opacity=".28"/>` +
      `<path d="M${cx - rx},${cy}A${rx},${ry} 0 0 1 ${cx + rx},${cy}" stroke="${linU(s, cx - rx, 0, cx + rx, 0, [[0, '#fff2c8', 0.3], [0.6, '#fff2c8', 0.65], [1, '#fffbe8', 1]])}" stroke-width="1.8"/></g>`);
    // the impact on the dome's shoulder
    const th = (34 * Math.PI) / 180, ix = cx + rx * Math.cos(th), iy = cy - ry * Math.sin(th);
    const ta = (Math.atan2(-ry * Math.cos(th), -rx * Math.sin(th)) * 180) / Math.PI + 180;
    s.add('<g data-part="strike">');
    s.glow(ix, iy, 74, '#fff3cc', 0.8);
    s.shafts({ cx: ix, cy: iy, n: 11, from: -105, to: 70, len: 120, spread: 3, color: '#fff6d8', op: 0.3, seed: 7803, sd: 1.6 });
    s.add(`<g fill="none" stroke="#fff6dc">${[[9, 3.4, 1.3, 0.95], [17, 6.2, 1, 0.65], [27, 9.4, 0.8, 0.38]].map(([a, b, w, o]) =>
      `<ellipse cx="${f1(ix)}" cy="${f1(iy)}" rx="${a}" ry="${b}" transform="rotate(${f1(ta)} ${f1(ix)} ${f1(iy)})" stroke-width="${w}" opacity="${o}"/>`).join('')}</g>`);
    const cracks = [[-150, 22], [-100, 18], [150, 24], [110, 20], [-60, 14]].map(([a, l], i) => {
      const r = ((ta + a) * Math.PI) / 180;
      return polyline(bolt([ix, iy], [ix + Math.cos(r) * l, iy + Math.sin(r) * l], 7804 + i, 4, 2.4));
    }).join('');
    s.add(`<path d="${cracks}" fill="none" stroke="#fffbe8" stroke-width=".8" opacity=".85"/>`);
    s.add('</g>');
    // the spear, snapped short of the dome, its head in pieces
    const bx = 330, by = 38, ux = (ix - bx) / Math.hypot(ix - bx, iy - by), uy = (iy - by) / Math.hypot(ix - bx, iy - by);
    const ex = ix - ux * 13, ey = iy - uy * 13;
    const shaft = U(taper([[bx, by], [ex, ey]], [3.6, 3]),
      poly([[ex - uy * 1.6, ey + ux * 1.6], [ex - ux * 4 - uy * 0.6, ey - uy * 4 + ux * 0.6], [ex + uy * 1.6, ey - ux * 1.6], [ex + ux * 3, ey + uy * 3]]));
    const shard = (x, y, r, a) => rot(poly([[x - r, y - r * 0.3], [x + r, y], [x - r * 0.5, y + r * 0.5]]), x, y, a);
    const shards = U(shard(ix + 18, iy - 22, 4.6, -30), shard(ix + 24, iy + 6, 3.6, 40), shard(ix + 8, iy + 20, 3, 110),
      shard(ix + 32, iy - 8, 2.6, 10), shard(ix - 4, iy - 18, 2.4, -80), shard(ix + 40, iy - 30, 2, -20));
    s.figure(`<g data-part="shaft"><path d="${shaft}"/></g><g data-part="shards"><path d="${shards}"/></g>`, { fill: '#0f0a07', rim: '#ffe6a6', offsets: [[-0.7, 0.8], [-0.8, -0.4]], rimOp: 0.8 });
    s.add('<g data-part="flare">');
    s.bloom(`<path d="${glint(ix, iy, 15, 0.12)}" fill="#fffbea"/><path d="${rot(glint(ix, iy, 7, 0.2), ix, iy, 45)}" fill="#fff3cc"/><circle cx="${f1(ix)}" cy="${f1(iy)}" r="3.4" fill="#fff"/>`, { sd: 2, k: 1.5 });
    s.add('</g>');
    // grass at the corners
    const R = rng(7805), blades = [];
    for (const [x0, x1] of [[-8, 40], [262, 310]]) {
      for (let x = x0; x < x1; x += 3 + R() * 4) {
        const h = 8 + R() * 14, lean = (R() - 0.5) * 10;
        blades.push(taper([[x, 216], [x + lean * 0.4, 214 - h * 0.5], [x + lean, 214 - h]], [2, 1.3, 0.3], { per: 4 }));
      }
    }
    s.path(U(blades), '#1c140c');
    s.motes({ seed: 7806, n: 16, x: [52, 200], y: [92, 178], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 7807, n: 10, x: [ix - 10, ix + 50], y: [iy - 40, iy + 30], r: [0.4, 1], fill: '#fff6d8', cls: 'twinkle', t: [1.5, 3], op: [0.4, 1] }));
    return s.svg();
  },

  // A girl in pale robes at sunrise, threads of light running between her
  // hands and gathering into a small winged spirit.
  lightweaver(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#667c9b'], [0.4, '#a8aaa8'], [0.68, '#e4cf9e'], [0.86, '#f3d394'], [1, '#e9b274']]));
    s.glow(62, 166, 140, '#fff0c4', 0.65);
    s.add('<circle cx="62" cy="166" r="14" fill="#fff6dc"/>');
    s.layer(ridge({ seed: 7901, base: 164, amp: 20, freq: 2 }), '#b2a385', { blur: 0.7 });
    s.haze(142, 172, '#f6dfae', 0.38);
    const hill = spline([[-10, 186], [40, 183], [100, 188], [160, 191], [230, 194], [310, 191]], 6);
    s.path(poly([...hill, [310, 214], [-10, 214]]), s.lin([[0, '#5a4a34'], [1, '#2a2016']]));
    // the one who follows her, faint
    s.glow(52, 72, 16, '#fff1c4', 0.45, 'breathe');
    s.path(sprite(52, 72, 0.75), '#fffbea', 'opacity=".6"');
    // the girl, facing the light she is making; long hair down her back
    const K = 1.22;
    const robe = blob([[111, 111], [124, 110], [127, 124], [130, 142], [135, 160], [139, 174], [127, 176], [115, 176], [101, 174], [91, 171], [99, 156], [104, 136], [107, 120]], 5);
    const girl = sc(U(
      taper([[113, 170], [112, 180], [111, 187]], [4.8, 4, 3.4]),
      taper([[121, 170], [124, 180], [126.5, 187]], [4.8, 4, 3.4]),
      ell(109, 188.5, 4.2, 1.9), ell(129.5, 188.5, 4.4, 1.9),
      robe,
      taper([[118.5, 103], [119, 111]], 4),
      ell(120, 97, 6, 6.6),
      taper([[125.5, 96.5], [128, 99.5]], [2.2, 0.6]),
      ell(118.4, 94.8, 6.6, 5.8),
      taper([[115.5, 92], [112.5, 100], [110, 110], [105.5, 120], [99, 127]], [9, 8.6, 7, 4.6, 0.6]),
      taper([[114, 97], [108, 106], [101, 112], [94, 114]], [4, 3.4, 2.4, 0.4]),
    ), 118, 188, K);
    const armU = sc(U(
      taper([[123, 114], [135, 110], [146, 97]], [4.6, 3.8, 3.2]), ell(147.5, 95.5, 2.6, 2.4),
      blob([[127, 112], [137, 109.5], [138, 116], [133, 127], [127, 121]], 4),
    ), 118, 188, K);
    const armL = sc(U(
      taper([[118, 116], [132, 122], [148, 118]], [4.6, 3.8, 3.2]), ell(149.5, 117.5, 2.6, 2.4),
      blob([[124, 119], [136, 123], [134, 133], [126, 130]], 4),
    ), 118, 188, K);
    // (the figure is drawn from three pieces, and its shading gradient follows each shape's own box: each piece
    // carries the whole figure's four extreme points as zero-length marks, which paint nothing, so the box is as it was)
    const pts = [...(girl + armU + armL).matchAll(NUM)].map((m) => [+m[1], +m[2]]);
    const ext = [(a, b) => a[0] - b[0], (a, b) => b[0] - a[0], (a, b) => a[1] - b[1], (a, b) => b[1] - a[1]].map((c) => pts.reduce((m, q) => (c(q, m) < 0 ? q : m)));
    const pin = ext.map(([x, y]) => `M${x},${y}L${x},${y}`).join('');
    s.figure(`<g data-part="body"><path d="${girl}${pin}"/></g><g data-part="armU"><path d="${armU}${pin}"/></g><g data-part="armL"><path d="${armL}${pin}"/></g>`, { fill: '#433629', rim: '#fff3d0', offsets: [[-1.2, -0.4], [1.1, -0.6]], rimOp: 0.95, shade: 0.55, edge: 0.35, light: [1, -0.4] });
    // the low sun through her pale robe
    s.add('<g data-part="sun">');
    s.path(sc(robe, 118, 188, K), radE(s, 70, 196, 110, 90, [[0, '#ffe9b8', 0.75], [0.4, '#f6d79a', 0.4], [1, '#f6d79a', 0]]));
    s.add('</g>');
    // the spirit she is weaving
    const sx = 182.7, sy = 84.3;
    s.add('<g data-part="halo">');
    s.glow(sx, sy, 66, '#ffe6a6', 0.45);
    s.add('</g>');
    s.glow(sx, sy, 26, '#fff1c2', 0.95, 'breathe');
    const threads = sc('M148,95C156,84 165,86 170,97M150,118C158,127 167,122 171,110M148,95C156,104 141,110 150,118M147,97C162,106 160,113 150,118' +
      'M146,96C150,88 158,90 168,100M151,117C160,112 164,110 169,106M150,118C140,110 151,102 148,95', 118, 188, K);
    s.add('<g data-part="threads">');
    s.bloom(`<path d="${threads}" fill="none" stroke="#ffd77a" stroke-width="3" opacity=".4"/><path d="${threads}" fill="none" stroke="#fff4d0" stroke-width=".9"/>` +
      `<ellipse cx="${sx}" cy="${sy}" rx="21" ry="6" fill="none" stroke="#fff4d0" stroke-width=".7" opacity=".7" transform="rotate(-20 ${sx} ${sy})"/>`, { sd: 1.4, k: 1.4, box: [136, 50, 80, 80] });
    s.add('</g>');
    s.add('<g data-part="spirit">');
    s.path(sprite(sx, sy, 1.4), '#fffdf2');
    s.add('</g>');
    s.motes({ seed: 7902, n: 18, x: [140, 214], y: [54, 118], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 7903, n: 14, x: [30, 270], y: [40, 170], r: [0.5, 1.1], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.3, 0.7] }));
    // meadow grass and flowers at the front
    const R = rng(7904), blades = [];
    for (let x = -8; x < 310; x += 3 + R() * 5) {
      const edge = x < 60 || x > 240, h = (edge ? 12 : 5) + R() * (edge ? 16 : 7), lean = (R() - 0.5) * 9;
      blades.push(taper([[x, 216], [x + lean * 0.4, 214 - h * 0.5], [x + lean, 214 - h]], [1.8, 1.2, 0.3], { per: 4 }));
    }
    s.path(U(blades), '#221a11');
    return s.svg();
  },

  // Side on: dark riders thunder down the dawn road; out of the mist on the
  // near side burst soldiers made of light, spears levelled.
  'ambush-at-dawn'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#54678a'], [0.45, '#a5a59c'], [0.72, '#e8cf9a'], [1, '#e6b274']]));
    s.add(`<rect x="-5" y="-5" width="310" height="220" fill="${s.lin([[0, '#1f2844', 0.66], [0.6, '#1f2844', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`);
    s.glow(240, 138, 150, '#fff0c2', 0.8);
    s.shafts({ cx: 240, cy: 138, n: 12, from: -175, to: -8, len: 300, spread: 2, color: '#fff6dc', op: 0.22, seed: 8001 });
    s.add('<circle cx="240" cy="138" r="15" fill="#fff7e0"/>');
    s.layer(ridge({ seed: 8002, base: 148, amp: 18, freq: 2.4 }), '#9c9786', { blur: 0.7 });
    s.haze(124, 152, '#f4dfb0', 0.38);
    s.path('M-10,214L-10,148L310,148L310,214Z', s.lin([[0, '#6a5d48'], [1, '#2a2118']]));
    // the road, wide at the lower left, a thread where it meets the sun
    s.path('M-10,214L-10,186C60,174 150,160 228,150L262,147L272,148C200,160 120,184 64,214Z', s.lin([[0, '#c9b38a'], [1, '#8a7656']], { x1: 1, y1: 0, x2: 0, y2: 1 }));
    // the riders, coming on
    const rd = horseman();
    const riders = [[278, 150, 0.56], [254, 154.5, 0.76], [230, 160, 0.98]].map(([x, y, k], i) =>
      `<g data-part="rider${i}" transform="translate(${x} ${y}) scale(${-k} ${k})"><path d="${rd}"/></g>`).join('');
    s.figure(riders, { fill: '#1a1310', rim: '#ffe6ad', offsets: [[1, -0.6], [0, -1.1]], rimOp: 0.85 });
    s.add('<ellipse cx="250" cy="161" rx="42" ry="2.6" fill="#2a2018" opacity=".35"/>');
    // dust kicked up behind them
    s.add(`<g fill="#e9d3a4" opacity=".4">${[[262, 160, 10], [284, 155, 8]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.6}"/>`).join('')}</g>`);
    // the spirit soldiers, rising out of the mist, spears levelled
    const sol = U(
      taper([[-2, 0], [-10, 12], [-18, 24]], [8, 6.4, 5]),
      taper([[3, 0], [12, 10], [16, 24]], [8, 6.6, 5]),
      taper([[0, 2], [5, -12], [10, -26]], [13, 12, 14]),
      taper([[11, -27], [13, -32]], 4.6),
      ell(14.5, -36, 5.2, 5.8),
      ell(15, -39.5, 8, 5.4, -8),
      ell(15.8, -36.8, 11.6, 1.9, -8),
      ell(21, -15, 8.4, 13, -8),
      taper([[12, -24], [20, -21], [27, -22]], [5, 4.2, 3.6]),
      taper([[-22, -16], [52, -26]], [2, 1.6]),
      poly([[51, -28.4], [60, -27.2], [52, -23.6]]),
    );
    const troop = [[38, 136, 0.86], [130, 143, 0.96], [84, 150, 1.44]].map(([x, y, k], i) =>
      `<g data-part="sol${i}" transform="translate(${x} ${y}) scale(${k})"><path d="${sol}"/></g>`).join('');
    s.glow(88, 118, 80, '#fff0c2', 0.5, 'breathe');
    s.blur(`<g fill="#ffcf6a" opacity=".9">${troop}</g>`, 3.6);
    const ghost = linU(s, 0, 70, 0, 178, [[0, '#fff9e2', 0.95], [0.35, '#ffe6a2', 0.85], [0.7, '#ffd77a', 0.45], [1, '#ffd77a', 0]]);
    s.add(`<g fill="${ghost}">${troop}</g>`);
    // the mist they come out of
    s.add('<g data-part="mist">');
    s.haze(150, 196, '#f0e2c0', 0.4, 20);
    s.add('</g>');
    s.fog(170, '#fff1cf', 0.55).fog(184, '#f6e4bf', 0.6).fog(198, '#e9d6b0', 0.5);
    s.add(`<g fill="#fff1cf" opacity=".5">${[[40, 176, 30], [96, 186, 38], [150, 178, 26], [70, 196, 30]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.5}" ry="${r * 0.32}"/>`).join('')}</g>`);
    s.motes({ seed: 8003, n: 20, x: [30, 170], y: [110, 200], r: [0.4, 1.1], fill: '#ffe39a', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    return s.svg();
  },

  // A knight on the battlements at sunrise, spear grounded, his long banner
  // streaming out toward the sun.
  'dawnwatch-knight'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#7d97b2'], [0.4, '#cfc6a6'], [0.7, '#f5d898'], [1, '#ebb574']]));
    s.glow(214, 132, 160, '#fff0c2', 0.85);
    s.shafts({ cx: 214, cy: 132, n: 14, from: -178, to: -2, len: 300, spread: 2, color: '#fff8de', op: 0.22, seed: 8101 });
    s.add('<circle cx="214" cy="132" r="16" fill="#fff7e0"/>');
    s.layer(ridge({ seed: 8102, base: 150, amp: 24, freq: 2.2 }), '#b3a68b', { blur: 0.7 });
    s.haze(128, 160, '#f7e2b2', 0.4);
    s.path(ridge({ seed: 8103, base: 168, amp: 12, freq: 3 }), '#8e7c5f');
    s.haze(152, 178, '#f5ddaa', 0.32);
    // two birds over the valley
    s.add('<path d="M58,70q3,-3 6,0q3,-3 6,0M76,58q2,-2 4,0q2,-2 4,0" fill="none" stroke="#5b4c3a" stroke-width="1" opacity=".7"/>');
    // the banner: long, swallow-tailed, the sun shining through it
    const topE = spline([[104, 28], [130, 21], [158, 29], [186, 23], [214, 31], [240, 27]], 5);
    const botE = spline([[104, 54], [130, 50], [158, 58], [186, 52], [212, 59]], 5);
    const flag = poly([...topE, [264, 33], [236, 42], [258, 51], [226, 56], ...botE.reverse()]);
    s.add('<g data-part="banner">');
    s.path(flag, s.lin([[0, '#df9f4e'], [0.5, '#f5cb78'], [1, '#fff0c8']], { x1: 0, y1: 0, x2: 1, y2: 0 }), 'opacity=".97"');
    s.add(`<path d="${taper([[158, 30], [158, 44], [158, 57]], [7, 10, 7])}" fill="#9b5c22" opacity=".18"/>` +
      `<path d="${taper([[214, 32], [213, 45], [212, 58]], [6, 9, 6])}" fill="#9b5c22" opacity=".14"/>`);
    s.add(`<path d="${sunMark(126, 37, 5)}" fill="none" stroke="#9a6326" stroke-width="1.4" opacity=".55"/>`);
    s.add('</g>');
    // the wall: a tower at the left, merlons either side of him
    let wall = 'M-10,214L-10,178L310,178L310,214Z';
    for (const [a, b] of [[52, 80], [160, 190], [228, 258], [296, 316]]) wall += `M${a},178L${a},157L${b},157L${b},178Z`;
    wall += 'M-10,214L-10,64L-2,64L-2,54L8,54L8,64L16,64L16,54L26,54L26,64L36,64L36,214Z';
    s.figure(`<path d="${wall}"/>`, { fill: '#3a2c1d', rim: '#ffe8b4', offsets: [[0, -1.2], [1, -0.6]], rimOp: 0.85, shade: 0.4 });
    s.add('<path d="M-10,190H310M-10,202H310M20,178V190M70,178V190M120,178V190M170,178V190M220,178V190M270,178V190M45,190V202M95,190V202M145,190V202M195,190V202M245,190V202M295,190V202" stroke="#261b11" stroke-width=".8" opacity=".6"/>');
    s.add('<rect x="13" y="96" width="4" height="12" rx="2" fill="#ffd77a" opacity=".85"/>');
    // the knight
    const knight = U(
      taper([[113, 142], [111, 160], [110, 175]], [9, 7.6, 6.4]),
      taper([[124, 142], [127, 160], [129, 175]], [9, 7.6, 6.4]),
      ell(108, 177, 6.4, 2.5), ell(132, 177, 6.6, 2.5),
      poly([[108, 130], [130, 130], [134, 146], [105, 146]]),
      taper([[119, 102], [119, 116], [119, 132]], [20, 16, 17]),
      ell(109.5, 104.5, 7.4, 5.6, -15), ell(128.5, 104.5, 7.4, 5.6, 15),
      taper([[119.5, 92], [119.5, 101]], 6.4),
      ell(120.5, 87.5, 7, 8),
      ell(121.5, 84, 8, 6.4),
      taper([[118, 79.5], [112, 75], [104, 75.5], [97, 79.5], [92, 84.5]], [4.4, 6, 5.4, 3.6, 0.6]),
      taper([[127, 87], [131.5, 89]], [3, 1.4]),
      taper([[111, 106], [106, 114], [103, 118]], [6, 5, 4.4]),
      ell(102.5, 118.5, 3, 3),
      taper([[102.5, 178], [102.5, 100], [102.5, 30]], [2.6, 2.4, 2.2]),
      poly([[100, 31], [102.5, 17], [105, 31]]),
    );
    // (the shield, with the arm that holds it, is a moving piece of his own)
    const shield = U(taper([[128, 106], [133, 118], [136, 126]], [6, 5, 4.6]), kite(139, 105, 12.5, 44));
    // (its shading gradient follows each shape's own box, so each piece carries two dots at the corners of the whole's box: it shades as before)
    const xs = (knight + shield).match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g).map((q) => q.split(',').map(Number));
    const box = [Math.min(...xs.map((q) => q[0])), Math.min(...xs.map((q) => q[1])), Math.max(...xs.map((q) => q[0])), Math.max(...xs.map((q) => q[1]))];
    const pin = `M${box[0]},${box[1]}L${box[0]},${box[1]}ZM${box[2]},${box[3]}L${box[2]},${box[3]}Z`;
    s.figure(`<g data-part="man"><path d="${knight}${pin}"/></g><g data-part="shield"><path d="${shield}${pin}"/></g>`, { fill: p.fig, rim: p.rim, offsets: [[1.3, -0.6], [0.4, -1.3], [-0.8, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.35, light: [1, -0.5] });
    s.add(`<path data-part="shield" d="${sunMark(139, 122, 4)}" fill="none" stroke="#e7b860" stroke-width="1.1" opacity=".8"/>`);
    s.bloom(`<path d="${glint(102.5, 18, 6, 0.16)}" fill="#fffbea"/>`, { sd: 1.2, k: 1.4, box: [90, 6, 26, 26] });
    s.add(particles({ seed: 8104, n: 16, x: [40, 270], y: [40, 170], r: [0.5, 1.2], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A pillar of light drops through a hole in the storm onto a dark knight
  // charging up the road; his horse rears inside it.
  'dawns-judgment'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#3f475b'], [0.38, '#7d7a7a'], [0.7, '#d4bb8c'], [1, '#e3ae6c']]));
    s.glow(150, 170, 170, '#ffe2a6', 0.4);
    s.layer(ridge({ seed: 8201, base: 162, amp: 16, freq: 2.4 }), '#8a8274', { blur: 0.6 });
    s.haze(142, 168, '#ead2a2', 0.3);
    s.path('M-10,214L-10,167L310,167L310,214Z', s.lin([[0, '#584a38'], [1, '#1c140c']]));
    s.path('M84,214L146,167L154,167L222,214Z', s.lin([[0, '#cdb68c'], [1, '#6e5d45']]));
    // the pillar: a wide soft spill, then the beam itself
    s.path('M104,-6L196,-6L222,186L78,186Z', linU(s, 78, 0, 222, 0, [[0, '#ffe6a6', 0], [0.5, '#ffe6a6', 0.4], [1, '#ffe6a6', 0]]));
    const beam = 'M126,-6L174,-6L196,184L104,184Z';
    s.path(beam, linU(s, 104, 0, 196, 0, [[0, '#ffe6a6', 0], [0.2, '#ffe9b0', 0.62], [0.5, '#fffbea', 0.97], [0.8, '#ffe9b0', 0.62], [1, '#ffe6a6', 0]]));
    // the storm, torn open, lit along the tear
    const puffs = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.3, r)));
    const left = puffs([[16, -16, 50], [-10, 34, 22], [22, 44, 18], [54, 40, 20], [82, 32, 18], [102, 20, 16], [112, 4, 14]]);
    const right = puffs([[286, -16, 50], [188, 4, 14], [198, 20, 16], [220, 32, 19], [248, 42, 18], [280, 36, 20], [308, 44, 18]]);
    s.figure(`<path d="${left}"/>`, { fill: '#3a4052', rim: '#ffe2a6', offsets: [[1.6, 0.8], [0.6, 1.6]], rimOp: 0.85, shade: 0.4 });
    s.figure(`<path d="${right}"/>`, { fill: '#3a4052', rim: '#ffe2a6', offsets: [[-1.6, 0.8], [-0.6, 1.6]], rimOp: 0.85, shade: 0.4 });
    // where it lands
    s.glow(150, 180, 64, '#fff3cc', 0.85);
    s.add('<ellipse cx="150" cy="183" rx="50" ry="6.5" fill="#fff4d2" opacity=".8"/>');
    const cracks = [[96, 196], [118, 204], [186, 202], [208, 192], [70, 186], [234, 186]].map(([x, y], i) => polyline(bolt([150 + (x - 150) * 0.25, 184], [x, y], 8202 + i, 5, 2.4))).join('');
    s.add(`<path d="${cracks}" fill="none" stroke="#ffe9b0" stroke-width=".9" opacity=".75"/>`);
    // the dark knight, his horse rearing in the light: long head and neck
    // up on the left, forelegs folded, hind legs planted; he sits back,
    // sword up at the sky
    const knight = U(
      taper([[163, 146], [170, 162], [163, 181]], [10, 5.4, 3.6]),
      taper([[155, 148], [160, 164], [151, 181]], [9, 5, 3.4]),
      ell(164, 182, 3.8, 1.8), ell(151, 182, 3.8, 1.8),
      ell(162, 140, 11, 12),
      taper([[161, 139], [148, 122], [137, 106]], [21, 19.5, 17]),
      ell(137, 106, 9, 10),
      taper([[137, 103], [131, 88], [126, 76]], [15, 11, 8.4]),
      taper([[127, 74], [119, 76], [110.5, 82.5]], [9.4, 7.6, 5]),
      taper([[127.5, 72.5], [129.5, 65.5]], [2.6, 0.4]),
      taper([[131, 79], [138, 82], [143, 90]], [4.4, 4, 0.8]),
      taper([[134, 112], [124, 106], [116, 112], [113, 122]], [7, 5, 3.6, 3]),
      taper([[138, 116], [128, 116], [122, 124], [121, 134]], [6.4, 4.6, 3.4, 2.8]),
      taper([[171, 134], [181, 144], [186, 158], [182, 170]], [6, 5, 3, 0.8]),
      taper([[149, 117], [152, 103], [156, 91]], [11, 9.4, 10]),
      taper([[150, 116], [142, 120], [143, 130]], [6, 5, 4]),
      taper([[158, 89], [158, 84], [158.5, 78.5]], [8.4, 9, 8.4]),
      poly([[155.4, 80], [158.6, 66.5], [161.6, 80]]),
      taper([[154.5, 81], [148.5, 77.5], [146, 72]], [2.4, 1.6, 0.4]),
      taper([[160, 92], [167, 82], [171, 70]], [5, 4.2, 3.6]),
      taper([[167, 72.5], [176, 70]], 2.2),
      taper([[172, 70], [176, 54], [179, 39]], [2.8, 2.4, 0.5]),
      taper([[152, 96], [143, 99], [136, 98]], [4.6, 4, 3.6]),
      taper([[155, 93], [166, 100], [176, 110], [182, 122]], [8, 10, 8, 2]),
    );
    s.figure(`<path d="${knight}"/>`, { fill: '#140e0b', rim: '#fff4d6', offsets: [[0, -1.5], [-1.2, -0.5], [1.2, -0.5]], rimOp: 1, halo: { op: 0.45, sd: 3.4, color: '#fff1c8' } });
    // he is inside it: a veil of the beam over him, the core above
    s.path(beam, linU(s, 104, 0, 196, 0, [[0, '#fff3cc', 0], [0.5, '#fffbea', 0.2], [1, '#fff3cc', 0]]));
    s.bloom('<path d="M145,-6L155,-6L153,60L147,60Z" fill="#ffffff" opacity=".9"/>', { sd: 2.4, k: 1.3, box: [120, -10, 60, 80] });
    s.motes({ seed: 8203, n: 22, x: [100, 200], y: [100, 186], r: [0.4, 1.1], fill: '#ffe39a', cls: 'rise', t: [3, 6], op: [0.5, 1] });
    s.add(particles({ seed: 8204, n: 12, x: [126, 174], y: [10, 120], r: [0.4, 1], fill: '#fffbea', cls: 'fall', t: [1.4, 2], op: [0.5, 1] }));
    s.path('M-10,214L-10,200C40,196 80,198 110,203L118,214Z', '#18110b');
    s.path('M310,214L310,198C270,195 230,198 196,204L190,214Z', '#18110b');
    return s.svg();
  },

  // A tall angel of light hovering over a hilltop before dawn, singing with
  // her arms up; small winged spirits rise round her like sparks.
  choirmother(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#232b4a'], [0.38, '#46517a'], [0.62, '#8c8597'], [0.82, '#e4bb8a'], [1, '#e9a465']]));
    s.add(particles({ seed: 8301, n: 24, x: [0, W], y: [0, 90], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(150, 204, 180, '#ffdca0', 0.6);
    s.layer(ridge({ seed: 8302, base: 174, amp: 22, freq: 2.2 }), '#5d5670', { blur: 0.6 });
    s.haze(152, 182, '#e9b98a', 0.3);
    s.path(ridge({ seed: 8303, base: 188, amp: 10, freq: 3 }), '#38324a');
    s.path('M-10,214L-10,200C40,196 100,192 150,192C200,192 260,196 310,200L310,214Z', '#1b1622');
    // her light
    s.glow(150, 104, 104, '#fff1c4', 0.42);
    s.glow(150, 100, 52, '#fffaf0', 0.45, 'breathe');
    s.add('<ellipse cx="150" cy="192" rx="30" ry="3.4" fill="#ffe7b0" opacity=".5"/>');
    // wings folded down behind her like a mantle
    const wl = U(
      taper([[141, 82], [129, 92], [121, 110], [117, 132]], [12, 16, 14, 8]),
      taper([[124, 102], [116, 128], [113, 152]], [9, 7.4, 1]),
      taper([[128, 108], [121, 136], [119, 160]], [9, 7.4, 1]),
      taper([[132, 114], [127, 142], [126, 166]], [8, 6.4, 1]),
    );
    const wings = wl + flipX(wl, 150);
    s.path(wings, radE(s, 150, 92, 60, 90, [[0, '#ffe7a8', 0.9], [0.7, '#f5c66a', 0.78], [1, '#e9a94e', 0.6]]));
    s.add(`<path d="${wings}" fill="none" stroke="#fff3cc" stroke-width=".6" opacity=".7"/>`);
    // the Choirmother
    const body = U(
      blob([[141, 84], [159, 84], [163, 100], [166, 122], [171, 146], [178, 168], [168, 172], [158, 169], [150, 173], [141, 169], [131, 172], [122, 168], [129, 146], [134, 122], [137, 100]], 5),
      taper([[145, 168], [144, 176], [142.5, 183]], [4, 3, 0.8]),
      taper([[155, 168], [156, 176], [157.5, 182]], [4, 3, 0.8]),
      taper([[149.5, 70], [150, 85]], 5.4),
      ell(148.5, 63, 6.4, 7.6, -25),
      taper([[144.5, 60], [141, 57.5], [139.5, 54.5]], [2.6, 1.6, 0.4]),
      taper([[153, 58], [158, 68], [160, 82], [158, 96]], [9, 9, 7, 2]),
      taper([[141, 86], [131, 68], [124, 46]], [5.6, 4.6, 3.6]), ell(123, 43, 2.8, 3.6, -20),
      taper([[159, 86], [169, 68], [176, 46]], [5.6, 4.6, 3.6]), ell(177, 43, 2.8, 3.6, 20),
      blob([[126, 50], [131, 64], [138, 80], [130, 90], [121, 94], [117, 84], [120, 66]], 4),
      blob([[174, 50], [169, 64], [162, 80], [170, 90], [179, 94], [183, 84], [180, 66]], 4),
    );
    s.blur(`<path d="${body}" fill="#ffd77a" opacity=".85"/>`, 4);
    s.path(body, linU(s, 0, 40, 0, 186, [[0, '#fffef8'], [0.55, '#fff2cc'], [1, '#ffd994']]));
    s.add('<path d="M146,102Q143,132 137,166M154,102Q157,132 163,166M150,106V170M140,92Q150,96 160,92" fill="none" stroke="#dca752" stroke-width=".8" opacity=".45"/>');
    s.add('<ellipse cx="152" cy="51" rx="10.5" ry="3.4" fill="none" stroke="#fff3c6" stroke-width="1.3" transform="rotate(-25 152 51)"/>');
    // the little ones, rising
    const kids = [[104, 166, 0.5], [90, 136, 0.62], [96, 102, 0.72], [102, 70, 0.62], [88, 42, 0.54], [118, 20, 0.46],
      [198, 158, 0.55], [212, 128, 0.66], [206, 94, 0.72], [198, 62, 0.6], [214, 36, 0.52], [182, 14, 0.44]];
    for (const [x, y, k] of kids) s.glow(x, y - 2, 6 + 14 * k, '#fff1c4', 0.7);
    for (let g = 0; g < 3; g++) {
      const d = U(kids.filter((_, i) => i % 3 === g).map(([x, y, k]) => sprite(x, y, k)));
      s.path(d, '#fffcf0', `class="float" style="--t:${6 + g * 1.5}s;--d:-${g * 2}s"`);
    }
    s.motes({ seed: 8304, n: 26, x: [70, 230], y: [40, 196], r: [0.4, 1.1], fill: '#ffe39a', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    return s.svg();
  },

  // The beacon on its hill, its great fire throwing a beam across the
  // dawn; out in the beam a spirit is taking shape.
  'beacon-of-hope'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#1f2744'], [0.36, '#434e70'], [0.64, '#97868c'], [0.84, '#e8bd88'], [1, '#e6a066']]));
    s.add(particles({ seed: 8401, n: 22, x: [130, W], y: [70, 130], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(262, 194, 150, '#ffd9a0', 0.5);
    s.layer(ridge({ seed: 8402, base: 176, amp: 20, freq: 2.4 }), '#6b6075', { blur: 0.6 });
    s.haze(156, 184, '#e3ad80', 0.3);
    // a village down in the valley, a few windows lit
    let vil = '';
    for (const [x, w, h] of [[190, 12, 8], [204, 10, 10], [216, 14, 7], [232, 10, 9], [244, 12, 8], [258, 9, 7]]) {
      vil += poly([[x, 196], [x, 196 - h], [x + w / 2, 196 - h - 5], [x + w, 196 - h], [x + w, 196]]);
    }
    s.path(vil, '#2c2433');
    s.path(dots([[196, 191, 0.9], [209, 189, 0.9], [222, 192, 0.8], [249, 191, 0.9]]), '#ffd77a');
    // the beam, and the spirit forming in it
    const sx = 212, sy = 42;
    s.blur(`<path d="M96,25L320,-34L320,122L96,37Z" fill="${linU(s, 96, 0, 320, 0, [[0, '#fff3cc', 0.8], [0.45, '#ffe6a6', 0.36], [1, '#ffe6a6', 0.04]])}"/>` +
      `<path d="M96,29L320,10L320,74L96,33Z" fill="${linU(s, 96, 0, 320, 0, [[0, '#fffbea', 0.8], [0.5, '#fff3cc', 0.3], [1, '#fff3cc', 0]])}"/>`, 2.6);
    s.add('<g data-part="spirit">');
    s.glow(sx, sy, 40, '#fff1c4', 0.75);
    s.add('</g>');
    s.glow(sx, sy, 16, '#fffaf0', 0.9, 'breathe');
    s.add('<g data-part="spirit">');
    s.path(sprite(sx, sy, 1.3), '#fffdf2', 'opacity=".9"');
    s.add('</g>');
    const R = rng(8403), ring = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + R() * 0.3, rr = 14 + R() * 8; ring.push([sx + Math.cos(a) * rr, sy + Math.sin(a) * rr * 0.6, 0.5 + R() * 0.7]); }
    s.add(`<path class="twinkle" style="--t:2.6s" d="${dots(ring)}" fill="#fff6d8"/>`);
    s.motes({ seed: 8404, n: 18, x: [120, 290], y: [10, 70], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [4, 8], op: [0.4, 0.9] });
    // the hill and the tower
    const hill = spline([[-10, 186], [40, 179], [80, 174], [110, 173], [150, 178], [200, 188], [250, 198], [310, 204]], 6);
    s.path(poly([...hill, [310, 214], [-10, 214]]), s.lin([[0, '#2a2027'], [1, '#120d10']]));
    const merl = [76, 84, 92, 100, 108].map((x) => poly([[x, 66], [x, 59], [x + 4, 59], [x + 4, 66]]));
    const tower = U(
      poly([[76, 178], [81, 76], [111, 76], [116, 178]]),
      poly([[73, 76], [119, 76], [117, 66], [75, 66]]),
      [80, 88, 96, 104, 112].map((x) => poly([[x - 2.4, 75], [x + 2.4, 75], [x + 1.2, 81], [x - 1.2, 81]])),
      merl,
      poly([[85, 60], [107, 60], [104, 52], [88, 52]]),
      poly([[83, 52], [109, 52], [109, 50], [83, 50]]),
    );
    s.figure(`<path d="${tower}"/>`, { fill: '#231a16', rim: '#ffd99a', offsets: [[0, -1.3], [1, -0.6], [-1, -0.6]], rimOp: 0.9, shade: 0.5, edge: 0.32, light: [0.3, -1] });
    s.add('<path d="M79,96H113M78.5,116H113.5M78,136H114M77.5,156H114.5" stroke="#15100d" stroke-width=".8" opacity=".6"/>');
    s.path('M93,178L93,168A3,3 0 0 1 99,168L99,178Z' + poly([[94.6, 108], [97.4, 108], [97.4, 120], [94.6, 120]]) + poly([[94.6, 132], [97.4, 132], [97.4, 142], [94.6, 142]]), '#ffcf6a', 'opacity=".9"');
    // the great fire
    s.glow(96, 34, 110, '#ffd27a', 0.55);
    s.glow(96, 36, 40, '#fff1c4', 0.8, 'breathe');
    const fire = U(flame(96, 54, 50, -3, 26), flame(86, 54, 34, -11, 15, -0.14), flame(106, 54, 38, 9, 17), flame(92, 52, 42, 6, 12, -0.16), flame(101, 52, 30, -8, 11));
    s.add('<g data-part="fire">');
    s.bloom(`<path d="${fire}" fill="${linU(s, 0, 4, 0, 56, [[0, '#ffb347', 0.2], [0.35, '#ffcf6a', 0.95], [1, '#ffe7a8']])}"/>` +
      `<path d="${U(flame(96, 53, 28, 0, 14, 0.06), flame(90.5, 53, 18, -4, 8, -0.06), flame(101.5, 53, 20, 4, 8, 0.06))}" fill="#fff8e2"/>`, { sd: 2.4, k: 1.4, box: [50, -14, 92, 80] });
    s.add('</g>');
    s.add(particles({ seed: 8405, n: 18, x: [78, 116], y: [6, 50], r: [0.5, 1.2], fill: '#ffd27a', cls: 'rise', t: [3, 6], op: [0.5, 1] }));
    return s.svg();
  },

  // LEGENDARY. Seraphine comes down out of the sunrise, sword up, wings of
  // gold light spread across the whole sky.
  seraphine(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#2f3a5a'], [0.32, '#646e8f'], [0.56, '#cfb28e'], [0.74, '#f5cf8c'], [1, '#e8a25e']]));
    s.add(particles({ seed: 8501, n: 16, x: [0, W], y: [0, 56], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.7], t: [2.5, 6] }));
    // the sun, coming up behind her
    s.glow(150, 176, 220, '#fff0c2', 0.9);
    s.shafts({ cx: 150, cy: 176, n: 22, from: -180, to: 0, len: 330, spread: 2.2, color: '#fff6dc', op: 0.3, seed: 8502 });
    s.glow(150, 176, 70, '#fffaf0', 0.9);
    s.add('<circle cx="150" cy="176" r="40" fill="#fffbec"/>');
    s.path(ridge({ seed: 8503, base: 186, amp: 14, freq: 2.4 }), '#b89c7c');
    s.haze(170, 192, '#f6d9a4', 0.3);
    s.path(ridge({ seed: 8504, base: 200, amp: 10, freq: 3.2 }), '#3a2b1e');
    // wings of light: a fan of long feathers off each arm
    const A = [[144, 80], [88, 46], [26, 22]];
    const at = (t) => {
      const [a, b, u] = t < 0.5 ? [A[0], A[1], t * 2] : [A[1], A[2], (t - 0.5) * 2];
      return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    };
    const LEN = [46, 54, 62, 68, 72, 74, 72, 66, 58, 50, 40, 32];
    let back = '', front = '';
    LEN.forEach((L, i) => {
      const t = i / (LEN.length - 1), [bx, by] = at(t), a = ((100 + 92 * t) * Math.PI) / 180, a2 = a + 0.12;
      back += taper([[bx, by], [bx + Math.cos(a) * L * 0.55, by + Math.sin(a) * L * 0.55], [bx + Math.cos(a2) * L, by + Math.sin(a2) * L]], [10, 8.6, 1]);
      if (i % 2 === 0) front += taper([[bx, by], [bx + Math.cos(a) * L * 0.3, by + Math.sin(a) * L * 0.3], [bx + Math.cos(a2) * L * 0.52, by + Math.sin(a2) * L * 0.52]], [11, 9, 1.4]);
    });
    front += taper(A, [24, 18, 6]);
    const wingsBack = back + flipX(back, 150), wingsFront = front + flipX(front, 150);
    s.add('<g data-part="wings">'); // (a puppet part on Home: js/art/puppets.js)
    s.blur(`<path d="${wingsBack + wingsFront}" fill="#ffd77a" opacity=".75"/>`, 5);
    const wf = s.radU(150, 78, 150, [[0, '#ffffff', 1], [0.3, '#fff4d0', 0.95], [0.65, '#ffdc8a', 0.85], [1, '#f6b45a', 0.7]]);
    s.path(wingsBack, wf);
    s.add(`<path d="${wingsBack}" fill="none" stroke="#fffaf0" stroke-width=".55" opacity=".7"/>`);
    s.path(wingsFront, s.radU(150, 78, 130, [[0, '#ffffff', 1], [0.5, '#fff6dc', 0.95], [1, '#ffe39a', 0.85]]));
    s.add(`<path d="${wingsFront}" fill="none" stroke="#fffaf0" stroke-width=".55" opacity=".7"/>`);
    s.add('</g>');
    // a halo behind her head (a disc of light her head is cut out against)
    // and her blade, both burning with the sunrise
    s.glow(150, 50, 30, '#fffaf0', 0.85);
    s.bloom('<circle cx="150" cy="50" r="15.5" fill="#fff8e2"/><circle cx="150" cy="50" r="18.5" fill="none" stroke="#fff3c6" stroke-width="1.2" opacity=".85"/>' +
      `<path d="${taper([[183, 39], [195, 22], [204, 8.5]], [4.4, 3.4, 0.5])}" fill="#fffbea"/><path d="${glint(204, 9, 10, 0.13)}" fill="#ffffff"/>`, { sd: 1.8, k: 1.4, box: [120, -10, 110, 84] });
    // Seraphine: plate and a fluttering skirt, toes pointed as she comes
    // down, sword raised in her right hand, left hand open
    const her = U(
      taper([[153, 114], [155, 134], [152, 156]], [10.5, 8, 5]),
      taper([[152, 154], [151, 165]], [4.6, 0.8]),
      taper([[146, 114], [142, 132], [145, 150]], [9.6, 7.2, 4.6]),
      taper([[145, 148], [146, 158]], [4.2, 0.8]),
      poly([[136, 96], [164, 96], [171, 118], [162, 112], [156, 123], [150, 113], [144, 123], [138, 112], [129, 118]]),
      taper([[150, 68], [150, 84], [150, 100]], [24, 19, 17]),
      ell(137, 72, 8.5, 6.5, -20), ell(163, 72, 8.5, 6.5, 20),
      taper([[150, 58], [150, 69]], 6),
      ell(150, 51.5, 7.4, 8.2),
      ell(150, 48.5, 8.6, 7.4),
      taper([[143, 51], [141.5, 59], [142.5, 65]], [5, 4.4, 2]),
      taper([[157, 51], [158.5, 59], [157.5, 65]], [5, 4.4, 2]),
      taper([[163, 73], [175, 58], [182, 43]], [7, 6, 5]),
      ell(183, 40.5, 3.6, 3.8),
      taper([[177.2, 35], [188.8, 43]], 2.6),
      taper([[137, 74], [125, 86], [112, 94]], [6.4, 5.2, 4.2]),
      ell(109.5, 95, 3.6, 3.2),
    );
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: '#fff6d8', offsets: [[0, -1.4], [-1.2, -0.6], [1.2, -0.6], [0, 1.1]], rimOp: 1, shade: 0.45, edge: 0.32, light: [0, 1] });
    s.add('<path d="M139,76Q150,83 161,76M150,79V95M137.5,97.5H162.5M139,112L144,123M161,112L156,123" stroke="#ffd77a" stroke-width="1.1" fill="none" stroke-linecap="round"/>');
    s.add(`<path d="${sunMark(150, 87, 2.6)}" fill="none" stroke="#ffd77a" stroke-width=".9"/>`);
    s.motes({ seed: 8505, n: 24, x: [30, 270], y: [20, 180], r: [0.4, 1.1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 8506, n: 14, x: [120, 180], y: [110, 190], r: [0.5, 1.2], fill: '#fff6d8', cls: 'rise', t: [3, 6], op: [0.5, 1] }));
    return s.svg();
  },

  // ── two-faction ───────────────────────────────────────────────────

  // Ember + Radiant: the gold war banner, its tail burning, carried over the
  // head of a cavalry charge into the sunrise.
  'banner-of-the-charge'(s) {
    fin(s, ['ember', 'radiant']);
    s.rect(s.lin([[0, '#3b1219'], [0.3, '#7a2b20'], [0.56, '#d4733a'], [0.78, '#f4c27a'], [1, '#f0d6a0']]));
    s.glow(252, 162, 190, '#ffe4a6', 0.85);
    s.shafts({ cx: 252, cy: 162, n: 14, from: -180, to: -20, len: 330, spread: 2.2, color: '#fff0c8', op: 0.26, seed: 8601 });
    s.add('<circle cx="252" cy="162" r="18" fill="#fff4d8"/>');
    s.layer(ridge({ seed: 8602, base: 170, amp: 16, freq: 2.4 }), '#b56a48', { blur: 0.6 });
    s.haze(150, 178, '#f7c98a', 0.32);
    s.path('M-10,214L-10,174L310,174L310,214Z', s.lin([[0, '#5c2a1a'], [1, '#1d0c08']]));
    s.add(`<g fill="#e09a5a" opacity=".35">${[[40, 184, 26], [96, 188, 22], [10, 178, 18]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.5}"/>`).join('')}</g>`);
    // the banner, streaming back off the pole, the sun shining through it
    const topE = spline([[147, 18], [122, 12], [96, 20], [70, 13], [44, 21]], 6);
    const botE = spline([[146, 94], [124, 91], [100, 101], [76, 93], [54, 103]], 6);
    const tail = [[44, 21], [14, 33], [40, 58], [16, 82], [54, 103]];
    const flag = poly([...topE, ...tail.slice(1, 4), ...botE.slice().reverse()]);
    s.glow(96, 58, 100, '#ffcf7a', 0.4);
    s.path(flag, s.lin([[0, '#e8913e'], [0.55, '#f6c96c'], [1, '#fff0c4']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    s.add(`<path d="${taper([[70, 15], [70, 54], [76, 93]], [9, 12, 8])}" fill="#8a3d16" opacity=".2"/>` +
      `<path d="${taper([[122, 14], [122, 52], [124, 91]], [9, 12, 8])}" fill="#8a3d16" opacity=".16"/>`);
    s.add(`<path d="${sunMark(97, 56, 9.5)}" fill="none" stroke="#8a4416" stroke-width="2.2" opacity=".55"/>`);
    // its burning edge: char, then fire, flames streaming back
    const edge = polyline([...tail, ...botE.slice().reverse()].reverse());
    const R = rng(8603), tongues = [];
    for (const [x, y, h] of [[44, 21, 12], [58, 16, 9], [14, 33, 22], [22, 42, 16], [31, 50, 19], [40, 58, 14], [30, 70, 17], [16, 82, 23],
      [28, 92, 17], [41, 98, 15], [54, 103, 13], [66, 99, 11], [80, 95, 10], [96, 100, 9], [112, 97, 7]]) {
      tongues.push(flame(x, y + 1, h + R() * 5, -h * 0.8, 5 + R() * 3.4, (R() - 0.5) * 0.3));
    }
    s.add(`<path d="${edge}" fill="none" stroke="#2e0d07" stroke-width="6" stroke-linejoin="round"/>`);
    s.glow(30, 66, 44, '#ff8a3a', 0.45);
    const cores = [[14, 33], [22, 42], [31, 50], [40, 58], [30, 70], [16, 82], [28, 92]].map(([x, y]) => flame(x, y + 1, 9, -7, 3));
    s.bloom(`<path d="${U(tongues)}" fill="${linU(s, 0, 10, 0, 106, [[0, '#ffe08a', 0.7], [0.45, '#ff8a3a', 0.95], [1, '#ff6a1f']])}"/>` +
      `<path d="${U(cores)}" fill="#fff0b0"/>` +
      `<path d="${edge}" fill="none" stroke="#ff7a2e" stroke-width="3.2" stroke-linejoin="round"/><path d="${edge}" fill="none" stroke="#ffe08a" stroke-width="1.1" stroke-linejoin="round"/>`, { sd: 2, k: 1.45, box: [-14, -6, 150, 124] });
    s.add(particles({ seed: 8604, n: 26, x: [-6, 76], y: [4, 110], r: [0.5, 1.4], fill: '#ffb05a', cls: 'rise', t: [3, 6], op: [0.6, 1] }));
    // the line of riders behind him
    const lancer = U(horse(),
      taper([[0, -28], [4, -36], [7, -42]], [7.4, 6.6, 7.4]),
      taper([[2, -29], [6, -23], [5, -18]], [3.6, 3, 2.6]),
      ell(9.5, -46, 3.5, 3.7), ell(10, -48, 4.4, 3.2),
      taper([[7, -40], [13, -38], [17, -40]], [3, 2.6, 2.2]),
      taper([[1, -39], [-7, -37], [-15, -33]], [5, 4.4, 1.2]),
      taper([[6, -24], [22, -56], [30, -72]], [1.8, 1.5, 1.2]), poly([[28, -71], [32.6, -80], [32.4, -70]]),
    );
    const line2 = [[30, 184, 0.78], [72, 189, 0.98], [226, 188, 0.94], [270, 183, 0.74]].map(([x, y, k]) =>
      `<g transform="translate(${x} ${y}) scale(${k})"><path d="${lancer}"/></g>`).join('');
    s.figure(line2, { fill: '#2a120c', rim: '#ffb36a', offsets: [[1, -0.6], [0, -1.1]], rimOp: 0.8 });
    // the bearer, out in front, pole up
    const lead = U(horse(),
      taper([[0, -28], [4, -36], [7, -42]], [7.4, 6.6, 7.4]),
      taper([[2, -29], [6, -23], [5, -18]], [3.6, 3, 2.6]),
      ell(9.5, -46, 3.5, 3.7), ell(10, -48, 4.4, 3.2),
      taper([[6, -40], [8.5, -48], [7.6, -56]], [3, 2.6, 2.2]),
      taper([[1, -39], [-7, -37], [-15, -33]], [5, 4.4, 1.2]),
    );
    s.figure(`<g transform="translate(150 198) scale(1.5)"><path d="${lead}"/></g><path d="${taper([[167, 160], [147, 14]], [3, 2.6])}"/>`,
      { fill: '#1d0c08', rim: '#ffcf8a', offsets: [[1.2, -0.7], [0, -1.3]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [1, -0.5] });
    s.add(`<path d="${poly([[144, 15], [146.6, 4], [149.4, 15]])}" fill="#ffd27a"/>`);
    s.motes({ seed: 8605, n: 16, x: [60, 300], y: [90, 200], r: [0.4, 1.1], fill: '#ffcf7a', cls: 'float', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // Verdant + Tide: five sleek heads up out of a sunlit forest stream.
  'brook-hydra'(s) {
    fin(s, ['verdant', 'tide']);
    s.rect(s.lin([[0, '#f4efc8'], [0.35, '#d7dcae'], [0.62, '#a3bf9c'], [1, '#6c9c8e']]));
    s.glow(64, 10, 170, '#fff6cc', 0.8);
    s.layer([[16, 10], [50, 7], [86, 9], [206, 8], [238, 11], [272, 9]].map(([x, w]) => poly([[x, -6], [x + w, -6], [x + w + 1, 170], [x - 1, 170]])).join(''), '#b4c49a', { blur: 0.7 });
    s.haze(110, 168, '#eef0c8', 0.35);
    s.path(ridge({ seed: 8701, base: 168, amp: 8, freq: 3 }), '#8fae86');
    const crowns = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.2, r)));
    s.path(crowns([[214, -4, 30], [250, 6, 28], [286, -2, 32], [312, 24, 24], [180, -14, 22]]), '#6f8f5c');
    s.path(crowns([[-10, 30, 26], [18, -6, 26], [-6, 64, 18]]), '#6f8f5c');
    s.add('<g fill="#4f6e45"><rect x="-4" y="-5" width="13" height="190"/><rect x="288" y="-5" width="16" height="190"/></g>');
    s.shafts({ cx: 64, cy: -16, n: 9, from: 38, to: 96, len: 270, spread: 3, color: '#fffbe0', op: 0.3, seed: 8702 });
    // the stream
    s.path('M-10,214L-10,168C60,165 240,165 310,168L310,214Z', s.lin([[0, '#88b9a9'], [0.35, '#3f7f7c'], [1, '#174a52']]));
    // the hydra: a back arched out of the water, five necks
    const necks = [
      [[[126, 176], [112, 156], [100, 138], [92, 124], [86, 114]], 196],
      [[[138, 172], [132, 146], [126, 120], [118, 98], [111, 85]], 208],
      [[[150, 170], [158, 140], [156, 110], [150, 84], [154, 62]], -36],
      [[[162, 172], [174, 146], [184, 120], [194, 100], [204, 90]], -10],
      [[[172, 176], [190, 160], [208, 146], [222, 136], [232, 132]], 14],
    ];
    const head = (x, y, a, k = 1) => {
      const r = (a * Math.PI) / 180, c = Math.cos(r), sn = Math.sin(r);
      let ux = sn, uy = -c; if (uy > 0) { ux = -ux; uy = -uy; }
      const P = (f, u) => [x + c * f * k + ux * u * k, y + sn * f * k + uy * u * k];
      return { d: [ell(...P(6, 0.5), 8.6 * k, 5.4 * k, a), taper([P(4, -0.8), P(12, -0.6), P(20, 0.4)], [8 * k, 5.4 * k, 2.6 * k]),
        taper([P(1, 3), P(-4, 7), P(-8, 10)], [3.4 * k, 2.2 * k, 0.4 * k]), taper([P(4, 4), P(1, 9), P(-1, 13)], [3 * k, 2 * k, 0.4 * k]),
        taper([P(-1, 1), P(-7, 3), P(-12, 4)], [3 * k, 2 * k, 0.4 * k])], eye: P(9.5, 1.8) };
    };
    const parts = [ell(150, 178, 36, 12), taper([[184, 182], [196, 168], [210, 165], [222, 171], [230, 182]], [10, 11, 10, 8, 5])];
    const eyes = [], moss = [];
    for (const [pts, a] of necks) {
      parts.push(taper(pts, [16, 13, 11, 9.5, 8.5]));
      const h = head(...pts[pts.length - 1], a);
      parts.push(h.d);
      eyes.push(h.eye);
      const sp = spline(pts, 6);
      for (const t of [0.2, 0.36, 0.52, 0.68]) {
        const i = Math.floor(t * (sp.length - 1)), [x0, y0] = sp[i], [x1, y1] = sp[i + 1];
        const len = Math.hypot(x1 - x0, y1 - y0) || 1;
        let nx = -(y1 - y0) / len, ny = (x1 - x0) / len; if (nx > 0) { nx = -nx; ny = -ny; }
        moss.push([x0 + nx * 3, y0 + ny * 3, 1 + (i % 3) * 0.3]);
      }
    }
    s.figure(`<path d="${U(parts)}"/>`, { fill: '#163b37', rim: '#fff3c0', offsets: [[-1.2, -1], [-0.3, -1.3]], rimOp: 0.95, shade: 0.5, edge: 0.3, light: [-0.6, -1] });
    s.path(dots(moss), '#a9c97c', 'opacity=".55"');
    for (const [x, y] of eyes) s.glow(x, y, 7, '#e6f78f', 0.8);
    s.path(dots(eyes.map(([x, y]) => [x, y, 1.3])), '#f7ffc8');
    // the water over its body, rings where the necks break the surface
    s.path('M-10,214L-10,171C60,169 240,169 310,171L310,214Z', s.lin([[0, '#5f9f98', 0.72], [1, '#123c45', 0.92]]));
    s.add(`<g fill="none" stroke="#e9f6d6" opacity=".55">${[[126, 176, 9], [139, 172, 8], [150, 171, 9], [162, 172, 8], [173, 176, 9], [186, 179, 7], [228, 180, 6]].map(([x, y, r]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 0.24)}" stroke-width=".8"/><ellipse cx="${x}" cy="${y + 1}" rx="${r * 1.8}" ry="${f1(r * 0.4)}" stroke-width=".5" opacity=".6"/>`).join('')}</g>`);
    let glints = '';
    const R = rng(8703);
    for (let i = 0; i < 22; i++) { const x = R() * 300, y = 174 + R() * 38, w = 3 + R() * 8; glints += `M${f1(x)},${f1(y)}h${f1(w)}`; }
    s.add(`<path d="${glints}" stroke="#f4f7d6" stroke-width=".7" opacity=".45"/>`);
    // ferns and stones on the near banks
    const fern = (x, y, a, l) => {
      const r = (a * Math.PI) / 180, out = [taper([[x, y], [x + Math.cos(r) * l * 0.5, y + Math.sin(r) * l * 0.5 - 4], [x + Math.cos(r) * l, y + Math.sin(r) * l]], [3, 2, 0.4])];
      for (let k = 1; k < 6; k++) {
        const t = k / 6, px = x + Math.cos(r) * l * t, py = y + Math.sin(r) * l * t - Math.sin(Math.PI * t) * 4;
        out.push(leaf(px - 3, py - 3, 9 * (1 - t * 0.5), a - 40), leaf(px + 3, py - 1, 9 * (1 - t * 0.5), a + 40));
      }
      return out;
    };
    s.path(U(ell(18, 206, 30, 12), ell(290, 208, 30, 12), fern(-4, 212, -55, 52), fern(10, 214, -80, 44), fern(304, 212, -125, 52), fern(290, 214, -100, 40)), '#14261c');
    s.motes({ seed: 8704, n: 18, x: [40, 260], y: [20, 160], r: [0.4, 1], fill: '#fff3c0', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // Verdant + Umbral: a huge spider head-down in a web strung between dead
  // trees, a pale moon low in the mist beneath it.
  'gloomweb-spider'(s) {
    fin(s, ['verdant', 'umbral']);
    s.rect(s.lin([[0, '#0b0a1a'], [0.45, '#1d1838'], [0.78, '#3a3160'], [1, '#262040']]));
    s.add(particles({ seed: 8801, n: 26, x: [0, W], y: [0, 110], r: [0.3, 0.8], fill: '#eee8ff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the moon, low beneath the web
    s.glow(150, 176, 150, '#b9a6ff', 0.42);
    s.glow(150, 176, 56, '#e2d8ff', 0.6);
    s.bloom('<circle cx="150" cy="176" r="22" fill="#efe8ff"/>', { sd: 3, k: 1.2, box: [96, 122, 108, 108] });
    s.layer(pines({ seed: 8802, base: 176, h: [26, 46], gap: [10, 18] }), '#2b2550', { blur: 0.7 });
    s.haze(150, 186, '#9f8fd0', 0.32);
    // the two dead trees, branches reaching in
    const treeL = [
      taper([[24, 216], [28, 160], [20, 100], [28, 40], [22, -10]], [26, 20, 16, 12, 9]),
      taper([[26, 150], [50, 146], [74, 154], [92, 150]], [8, 6, 3, 0.8]),
      taper([[22, 104], [40, 96], [52, 98], [58, 92]], [7, 5, 3, 0.6]),
      taper([[26, 54], [52, 42], [76, 40], [94, 28]], [7, 5, 3, 0.6]),
      taper([[24, 22], [46, 12], [70, 14], [88, 4]], [6, 4, 2.4, 0.5]),
      taper([[60, 44], [64, 30], [62, 20]], [3, 2, 0.4]), taper([[62, 148], [66, 162], [64, 174]], [3, 2, 0.4]),
    ];
    const trees = U(treeL) + flipX(U(treeL), 150);
    s.figure(`<path d="${trees}"/>`, { fill: '#0d0a16', rim: '#a594dc', offsets: [[0, 1], [0, -0.8]], rimOp: 0.55 });
    // glowing fungus on the trunks
    const caps = [[31, 122, 5], [33, 129, 3.6], [270, 84, 5], [268, 91, 3.4], [29, 70, 3.6]];
    for (const [x, y, r] of caps) s.glow(x, y, r * 3, '#d9f27a', 0.55);
    s.path(caps.map(([x, y, r]) => `M${x - r},${y}A${r},${f1(r * 0.6)} 0 0 1 ${x + r},${y}Z`).join(''), '#e6f78f');
    // the web: spokes to the branches, a sagging spiral
    const C = [150, 94], A = [], n = 16;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 - Math.PI / 2; A.push([C[0] + Math.cos(a) * 120, C[1] + Math.sin(a) * 88]); }
    let spokes = '', spiral = '';
    for (const [x, y] of A) spokes += `M${C[0]},${C[1]}L${f1(x)},${f1(y)}`;
    const Rw = rng(8803), dew = [];
    for (const f of [0.14, 0.22, 0.3, 0.39, 0.48, 0.58, 0.68, 0.79, 0.9]) {
      const P = A.map(([x, y]) => [C[0] + (x - C[0]) * f, C[1] + (y - C[1]) * f]);
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[(i + 1) % n];
        if (Rw() < 0.07) continue;
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], q = [C[0] + (m[0] - C[0]) * 0.9, C[1] + (m[1] - C[1]) * 0.9];
        spiral += `M${f1(a[0])},${f1(a[1])}Q${f1(q[0])},${f1(q[1])} ${f1(b[0])},${f1(b[1])}`;
        if (Rw() < 0.22) dew.push([a[0], a[1], 0.6 + Rw() * 0.6]);
      }
    }
    s.add(`<path d="${spokes}" fill="none" stroke="#d8d0f0" stroke-width=".6" opacity=".55"/><path d="${spiral}" fill="none" stroke="#d8d0f0" stroke-width=".45" opacity=".5"/>`);
    s.add(`<path class="twinkle" style="--t:3s" d="${dots(dew)}" fill="#f2eeff"/>`);
    // the spider, head down
    const legL = [
      [[145, 108], [126, 118], [116, 152]],
      [[143, 104], [114, 104], [88, 128]],
      [[143, 99], [114, 84], [84, 74]],
      [[145, 94], [126, 68], [106, 38]],
    ];
    const legs = legL.map(([r, k, t]) => [taper([r, k], [4.6, 3.6]), taper([k, [(k[0] + t[0]) / 2, (k[1] + t[1]) / 2], t], [3.6, 2.6, 0.8]), ell(k[0], k[1], 2.6, 2.6)]);
    const halfL = U(legs, taper([[145, 110], [139, 116], [137, 123]], [2.6, 2, 0.6]), taper([[147, 111], [146, 117], [147.6, 122]], [3.4, 2.4, 0.5]));
    const spider = U(halfL, flipX(halfL, 150), ell(150, 72, 17, 22), ell(150, 92, 5, 4), ell(150, 102, 10.5, 11.5), taper([[150, 52], [150, 46]], [4, 1]));
    s.add('<path d="M150,48L150,-6" stroke="#d8d0f0" stroke-width=".6" opacity=".6"/>');
    s.figure(`<path d="${spider}"/>`, { fill: '#0b0711', rim: '#c3b2f0', offsets: [[0, 1.2], [-1, 0.5], [1, 0.5]], rimOp: 0.85, shade: 0.4, halo: { op: 0.35, sd: 3, color: '#8f6ad8' }, light: [0, 1] });
    s.add('<path d="M141,62L150,69L159,62M143,74L150,80L157,74M145.5,85L150,88.5L154.5,85" fill="none" stroke="#8d6ad8" stroke-width="1.2" opacity=".75"/>');
    s.glow(150, 107, 11, '#b07cff', 0.75);
    s.path(dots([[147.3, 107.5, 1.5], [152.7, 107.5, 1.5], [144.8, 104.6, 0.9], [155.2, 104.6, 0.9], [148.6, 104, 0.8], [151.4, 104, 0.8], [146, 110.6, 0.8], [154, 110.6, 0.8]]), '#efe2ff');
    // mist rolling through the trees' feet
    s.fog(166, '#b8a8e8', 0.3).fog(182, '#a898dc', 0.38).fog(198, '#8f80c8', 0.4);
    s.add(particles({ seed: 8804, n: 12, x: [40, 260], y: [30, 170], r: [0.4, 1], fill: '#d9f27a', cls: 'float', t: [5, 9], op: [0.3, 0.7] }));
    return s.svg();
  },

  // Tide + Radiant: a knight on a white griffin stooping through the
  // clouds, throwing a net of gold light down ahead of them.
  'sky-warden'(s) {
    fin(s, ['tide', 'radiant']);
    s.rect(s.lin([[0, '#e6eed6'], [0.16, '#9cc3c1'], [0.45, '#558e9b'], [0.75, '#2d5d78'], [1, '#183452']]));
    s.glow(240, -6, 180, '#fff6d8', 0.8);
    s.shafts({ cx: 240, cy: -20, n: 10, from: 95, to: 165, len: 280, spread: 3, color: '#fffbe6', op: 0.25, seed: 8901 });
    const puffs = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.5, r)));
    // far clouds, high and sunlit, off to the sides of the dive
    s.layer(puffs([[226, 62, 16], [258, 54, 20], [292, 62, 18], [318, 78, 16], [-22, 120, 18], [8, 128, 14], [36, 136, 12]]), '#b9d3d0', { blur: 0.7 });
    s.haze(100, 150, '#a9cdcc', 0.28);
    // mid clouds, teal, lit on top
    s.figure(`<path d="${puffs([[-6, 150, 16], [26, 158, 14], [58, 166, 12], [236, 132, 14], [266, 124, 16], [300, 134, 18], [16, 176, 20], [284, 156, 20]])}"/>`, { fill: '#4d7f8c', rim: '#f6f4dc', offsets: [[0, -1.3]], rimOp: 0.8 });
    // the net of light, flung ahead and down
    const hx = 145, hy = 111, net = [], rays2 = [];
    const ang = [16, 27, 38, 49, 60, 71, 82].map((a) => (a * Math.PI) / 180);
    for (const a of ang) rays2.push(`M${hx},${hy}L${f1(hx + Math.cos(a) * 128)},${f1(hy + Math.sin(a) * 128)}`);
    for (const R2 of [34, 56, 78, 100, 122]) {
      let d = '';
      ang.forEach((a, i) => {
        const p = [hx + Math.cos(a) * R2, hy + Math.sin(a) * R2];
        if (i === 0) d += `M${f1(p[0])},${f1(p[1])}`;
        else {
          const am = (a + ang[i - 1]) / 2, q = [hx + Math.cos(am) * R2 * 0.96, hy + Math.sin(am) * R2 * 0.96 + 2];
          d += `Q${f1(q[0])},${f1(q[1])} ${f1(p[0])},${f1(p[1])}`;
        }
      });
      net.push(d);
    }
    const knots = ang.map((a) => [hx + Math.cos(a) * 122, hy + Math.sin(a) * 122, 1.8]);
    s.glow(214, 166, 70, '#ffe39a', 0.35);
    s.bloom(`<path d="${rays2.join('') + net.join('')}" fill="none" stroke="#ffd77a" stroke-width="2.2" opacity=".45"/>` +
      `<path d="${rays2.join('') + net.join('')}" fill="none" stroke="#fff4cf" stroke-width=".8"/><path d="${dots(knots)}" fill="#fff6dc"/>`, { sd: 1.8, k: 1.4, box: [130, 96, 190, 130] });
    // near clouds, dark, below
    s.path(puffs([[-10, 200, 22], [34, 206, 18], [80, 212, 20], [190, 214, 18], [236, 204, 20], [284, 198, 22], [316, 206, 18]]), '#1d3a55');
    // the griffin
    const A = [[-4, -6], [-14, -38], [-44, -58]];
    const at = (t) => { const [a, b, u] = t < 0.5 ? [A[0], A[1], t * 2] : [A[1], A[2], (t - 0.5) * 2]; return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]; };
    const WL = [20, 26, 30, 34, 36, 36, 33, 28, 22];
    const wing = U(taper(A, [12, 9, 3]), WL.map((L, i) => {
      const t = i / (WL.length - 1), [bx, by] = at(t), a = ((152 + 50 * t) * Math.PI) / 180, a2 = a + 0.1;
      return taper([[bx, by], [bx + Math.cos(a) * L * 0.55, by + Math.sin(a) * L * 0.55], [bx + Math.cos(a2) * L, by + Math.sin(a2) * L]], [8, 7, 1]);
    }));
    const body = U(
      taper([[-30, 2], [-12, 0], [8, -2]], [17, 20, 18]),
      ell(12, 0, 12, 11),
      taper([[16, -4], [26, -9], [32, -11]], [13, 10.5, 9]),
      ell(35, -11.5, 8, 7),
      taper([[31, -16], [24, -20.5], [16, -21]], [4.4, 3.2, 0.6]),
      taper([[30, -13], [22, -14.5], [15, -13]], [3.6, 2.6, 0.5]),
      taper([[16, 6], [25, 12], [34, 13]], [6.4, 4.4, 3.4]), taper([[33, 12], [38, 13], [40, 16.5]], [1.8, 1.3, 0.3]), taper([[33, 14], [36, 17], [36, 20.5]], [1.8, 1.3, 0.3]),
      taper([[10, 8], [18, 16], [27, 20]], [6, 4.2, 3.2]), taper([[26, 19], [31, 21], [33, 24.5]], [1.7, 1.2, 0.3]),
      taper([[-27, 6], [-37, 10], [-47, 8]], [9, 6, 4]), ell(-48.5, 8, 3.4, 2.6),
      taper([[-24, 8], [-32, 16], [-42, 19]], [8, 5, 3.6]), ell(-43.5, 19.5, 3.2, 2.4),
      taper([[-36, 0], [-50, -4], [-62, -2], [-71, 3]], [5, 3.6, 2.4, 1.6]), ell(-73, 4, 5, 3.2, 20),
    );
    const G = (d) => `<g transform="translate(118 96) rotate(28) scale(1.1)"><path d="${d}"/></g>`;
    // the far wing, fanned back behind the body, in shadow
    s.add(`<g fill="#a7c1c2">${G(rot(wing, -4, -6, -18))}</g>`);
    s.figure(G(body + wing), { fill: '#f2f6f0', rim: '#fffbe6', offsets: [[0.8, -1.2]], rimOp: 1, shade: 0.7, edge: 0.3, light: [0.5, -1] });
    // its hooked gold beak and dark eye
    s.add(`<g fill="#e2b257">${G(poly([[40, -16], [50, -13], [54.5, -8.5], [53, -4], [50.5, -6.5], [46, -6], [41.5, -7]]))}</g>`);
    s.add(`<g fill="#1a2b38">${G(ell(38, -13.6, 1.5, 1.3))}</g>`);
    // the knight, low over its neck, casting
    const kn = U(
      taper([[4, -8], [9, -19], [14, -28]], [10, 9, 9.4]),
      taper([[5, -9], [13, -6]], [6, 5]),
      taper([[13, -6], [14, 2]], [4.4, 3.6]),
      ell(16.5, -33, 4.4, 4.8), ell(17, -35, 5.2, 3.8, -12),
      taper([[13, -37.5], [6, -40], [-1.5, -39]], [3, 2.4, 0.5]),
      taper([[14, -26], [22, -15], [27.5, -1]], [4.4, 3.8, 3.2]), ell(28.2, 1, 2.4, 2.2),
      taper([[10, -24], [18, -19], [23, -17]], [4, 3.4, 3]),
      taper([[8, -26], [1, -27.5], [-6, -25]], [6, 6, 1]),
    );
    s.figure(G(kn), { fill: '#13202f', rim: '#ffe9b0', offsets: [[0.8, -1.1]], rimOp: 0.95 });
    s.glow(hx, hy, 16, '#fff3cc', 0.9, 'breathe');
    s.add(particles({ seed: 8902, n: 18, x: [140, 290], y: [100, 210], r: [0.5, 1.2], fill: '#ffe9b0', cls: 'fall', t: [1.4, 2.2], op: [0.5, 1] }));
    s.fog(170, '#9cc3c6', 0.25);
    return s.svg();
  },

  // LEGENDARY. Umbral + Radiant: the abbess holds up her lantern in the
  // misty graveyard; the dead drift up out of their graves into it.
  'the-pale-abbess'(s) {
    fin(s, ['umbral', 'radiant']);
    s.rect(s.lin([[0, '#100c22'], [0.42, '#271d47'], [0.72, '#4a3a6c'], [1, '#2a2142']]));
    s.add(particles({ seed: 9001, n: 22, x: [0, W], y: [0, 90], r: [0.3, 0.8], fill: '#eee8ff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the moon, high on the left, a thin cloud across it
    s.glow(54, 36, 90, '#cbbcff', 0.4);
    s.add('<circle cx="54" cy="36" r="13" fill="#ece4ff"/>');
    s.figure(`<path d="${U(ell(30, 52, 22, 7), ell(56, 50, 17, 8), ell(80, 54, 18, 6.5), ell(4, 56, 16, 6))}"/>`, { fill: '#2a2150', rim: '#cbbcff', offsets: [[0, -1.2]], rimOp: 0.7 });
    // the abbey, far off in the mist, one window lit
    s.layer('M6,164L6,130L48,130L48,164Z' + poly([[3, 131], [27, 114], [51, 131]]) + 'M54,164L54,98L70,98L70,164Z' + poly([[52, 99], [62, 74], [72, 99]]), '#30275a', { blur: 0.6 });
    s.add('<path d="M60,118L60,110A2,2 0 0 1 64,110L64,118Z" fill="#ffd27a" opacity=".85"/>');
    s.haze(130, 172, '#8d7cc4', 0.32);
    // the far row of graves, pale in the mist
    const grave = (x, y, w, h, tilt, kind) => {
      let d;
      if (kind === 1) d = U(poly([[x - w * 0.16, y], [x - w * 0.16, y - h], [x + w * 0.16, y - h], [x + w * 0.16, y]]), poly([[x - w / 2, y - h * 0.72], [x + w / 2, y - h * 0.72], [x + w / 2, y - h * 0.56], [x - w / 2, y - h * 0.56]]));
      else if (kind === 2) d = poly([[x - w / 2, y], [x - w / 2, y - h * 0.72], [x, y - h], [x + w / 2, y - h * 0.72], [x + w / 2, y]]);
      else d = `M${f1(x - w / 2)},${y}L${f1(x - w / 2)},${f1(y - h + w / 2)}A${f1(w / 2)},${f1(w / 2)} 0 0 1 ${f1(x + w / 2)},${f1(y - h + w / 2)}L${f1(x + w / 2)},${y}Z`;
      return `<path d="${d}" transform="rotate(${tilt} ${x} ${y})"/>`;
    };
    s.add(`<g fill="#3d3266">${[[24, 158, 10, 16, -6, 0], [178, 158, 9, 15, 4, 0], [204, 160, 8, 13, -5, 2], [236, 158, 10, 17, 7, 1], [266, 160, 9, 14, -4, 0]].map((g) => grave(...g)).join('')}</g>`);
    s.fog(162, '#a493d8', 0.35);
    s.path('M-10,214L-10,170C60,166 240,166 310,170L310,214Z', s.lin([[0, '#2e2448'], [1, '#120d1e']]));
    s.haze(160, 188, '#8f7fc8', 0.3);
    // a dead tree at the right edge
    s.figure(`<path d="${U(taper([[296, 216], [290, 160], [296, 110], [288, 60], [294, 6]], [18, 14, 11, 8, 5]),
      taper([[292, 120], [270, 110], [252, 112], [236, 104]], [6, 4, 2.4, 0.6]), taper([[290, 70], [268, 56], [248, 54]], [5, 3.4, 0.6]),
      taper([[292, 30], [276, 20], [262, 22]], [4, 3, 0.5]))}"/>`, { fill: '#0d0a16', rim: '#9d8ad6', offsets: [[-1, -0.4]], rimOp: 0.6 });
    // the near graves
    s.figure(`<g>${[[14, 190, 16, 26, 6, 1], [50, 192, 14, 22, -8, 0], [194, 192, 14, 24, 7, 0], [232, 190, 16, 28, -5, 1], [272, 192, 15, 22, 8, 2]].map((g) => grave(...g)).join('')}</g>`,
      { fill: '#140f22', rim: '#b7a5ea', offsets: [[0, -1.1], [-0.8, -0.6]], rimOp: 0.7 });
    // her lantern's light
    const lx = 151, ly = 72;
    s.glow(lx, ly, 150, '#ffd98a', 0.5);
    s.glow(lx, ly, 70, '#ffe7b0', 0.45);
    s.glow(lx, ly, 40, '#fff1c4', 0.75, 'breathe');
    s.add(`<ellipse cx="160" cy="194" rx="70" ry="9" fill="${s.rad([[0, '#ffd98a', 0.45], [1, '#ffd98a', 0]])}"/>`);
    // the dead drifting up into the lantern, pale violet turning gold
    const wisps = [[[40, 152], [56, 76], 0.55], [[60, 180], [96, 122], 0.36], [[194, 172], [214, 104], 0.48], [[236, 150], [232, 62], 0.7],
      [[272, 178], [252, 118], 0.3], [[14, 182], [36, 108], 0.24], [[232, 186], [196, 40], 0.86]];
    for (const [[x0, y0], [qx, qy], t] of wisps) {
      const B = (u) => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * qx + u * u * lx, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * qy + u * u * ly];
      const pts = Array.from({ length: 7 }, (_, j) => B(Math.max(0, t - 0.16 + j * (0.16 / 6))));
      const c = lerpC('#cdbfff', '#ffe2a0', t), [hx, hy] = pts[6];
      s.glow(hx, hy, 9, c, 0.7);
      s.path(U(taper(pts, [0.3, 1, 1.8, 2.6, 3.2, 3.6, 3.4], { per: 3 }), ell(hx, hy, 2.6, 2.6)), c, `opacity=".9" class="float" style="--t:${f1(5 + t * 4)}s;--d:-${f1(t * 5)}s"`);
    }
    // the abbess: habit, a veil down her back, her lantern arm raised
    const robe = blob([[104, 90], [124, 88], [131, 108], [135, 136], [140, 166], [147, 194], [131, 197], [113, 198], [95, 198], [78, 196], [86, 168], [93, 138], [97, 112]], 5);
    const her = U(
      robe,
      ell(141, 197.5, 5.2, 2.2), ell(127, 198.5, 4.8, 2.2),
      blob([[105, 58], [113, 52], [122, 52], [128, 58], [127, 66], [119, 63], [113, 68], [110, 82], [104, 98], [96, 112], [88, 118], [92, 104], [98, 86], [100, 70]], 5),
      ell(120, 66, 6.4, 7.6),
      taper([[124, 92], [138, 78], [149, 58]], [7.4, 6, 4.6]), ell(150, 55.5, 3.2, 3.4),
      blob([[128, 88], [138, 77], [144, 68], [145, 78], [142, 90], [135, 99], [128, 100]], 4),
      taper([[106, 94], [112, 106], [121, 110]], [6.4, 5.6, 4.6]), ell(123, 110, 3.2, 3),
    );
    s.path(mv(her, -1.3, -0.3), '#9d8ad6', 'opacity=".75"');
    s.figure(`<path d="${her}"/>`, { fill: '#1c1430', rim: '#ffd98a', offsets: [[1.2, -0.8], [0.6, -1.3]], rimOp: 0.95, shade: 0.5, edge: 0.32, halo: { op: 0.3, sd: 3, color: '#ffcf7a' }, light: [1, -0.8] });
    // white wimple and a pale face, lit by the lantern
    const pale = linU(s, 106, 0, 132, 0, [[0, '#a89cd0'], [0.6, '#efe6f2'], [1, '#fff4dc']]);
    s.path(blob([[115, 59], [124, 57.5], [129, 61], [129.5, 71], [127, 77], [131, 84], [127, 93], [116, 95], [110, 87], [112, 74], [112.5, 64]], 5), pale);
    s.path(U(ell(123, 68, 4.4, 5.6), taper([[126.6, 66.5], [129.2, 68.8]], [2, 0.5])), '#f6ead8');
    s.path(dots([[123, 114.5, 1], [123.4, 118, 1], [123.9, 121.5, 1], [124.4, 125, 1], [124.9, 128.5, 1]]) + poly([[124.6, 130.5], [125.8, 130.5], [125.8, 137], [124.6, 137]]) + poly([[122.8, 132.5], [127.6, 132.5], [127.6, 133.7], [122.8, 133.7]]), '#e9ddc8');
    // the lantern
    const L = (d) => sc(d, 151, 57, 1.25);
    s.add(`<path d="M146,57.5Q151,49 156,57.5" fill="none" stroke="#1c1430" stroke-width="1.3"/>`);
    s.path(L(poly([[145, 61], [157, 61], [155, 58], [147, 58]]) + poly([[144.6, 78], [157.4, 78], [156, 81], [146, 81]])), '#2a1f2c');
    s.bloom(`<path d="${L(poly([[146.2, 61], [155.8, 61], [155.8, 78], [146.2, 78]]))}" fill="#fff1c4"/><path d="${L(U(flame(151, 75, 10, 0, 4.6, 0.05)))}" fill="#ffffff"/>`, { sd: 2.4, k: 1.55, box: [116, 32, 70, 74] });
    s.add(`<path d="${L('M149.4,61L149.4,78M152.6,61L152.6,78')}" stroke="#2a1f2c" stroke-width=".9"/>`);
    // mist across the front
    s.fog(184, '#a898dc', 0.32).fog(200, '#8f80c8', 0.38);
    s.motes({ seed: 9002, n: 16, x: [90, 220], y: [30, 120], r: [0.4, 1], fill: '#ffe2a0', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },
};
