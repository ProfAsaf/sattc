// Two-faction and token card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, pt, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, mirror, page } from './shared.js';

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

// Rotate a polygon path about (ox, oy).
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A lens-shaped leaf centred on (x, y), `l` long, turned `a` degrees.
const leaf = (x, y, l, a, w = 0.38) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], 4), x, y, a);

// A flame tongue rising from (x, y0).
const tongue = (x, y0, h, lean, w) => taper([[x, y0], [x + lean * 0.25, y0 - h * 0.35], [x + lean * 0.75, y0 - h * 0.7], [x + lean, y0 - h]], [w, w * 0.78, w * 0.42, 0.4]);

// A licking flame: an S-curved tongue, fattest a little above its root.
const flame = (x, y0, h, lean, w, wob = 0.14) => taper(
  [[x, y0], [x + lean * 0.12 + w * wob * 2, y0 - h * 0.28], [x + lean * 0.42 - w * wob * 3, y0 - h * 0.55], [x + lean * 0.74 + w * wob * 2, y0 - h * 0.8], [x + lean, y0 - h]],
  [w * 0.8, w, w * 0.68, w * 0.32, 0.3], { per: 6 });

// A jagged bolt from a to b.
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

export const multi = {
  // Ember + Umbral: a shrouded body on the pyre, the fire orange below and
  // violet above, faces in the smoke.
  'funeral-pyre'(s) {
    s.finish({ faction: ['ember', 'umbral'] });
    s.rect(s.lin([[0, '#0b0810'], [0.5, '#1d0f1c'], [0.8, '#3a1620'], [1, '#1a0b0e']]));
    s.glow(150, 132, 165, '#ff6a2e', 0.34);
    s.glow(150, 66, 120, '#8f55e8', 0.3);
    // smoke, and the faces in it
    s.add(`<g fill="#2e1d34" opacity=".55">${[[150, 44, 40], [112, 24, 34], [192, 20, 38], [150, 2, 48]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.3}" ry="${r * 0.8}"/>`).join('')}</g>`);
    const gfill = s.lin([[0, '#d6c4f6', 0.42], [0.4, '#a98fdc', 0.2], [1, '#a98fdc', 0]]);
    let gi = 0;
    for (const [x, y, k, lean, up, t] of [[96, 40, 1, 7, 1, 9], [206, 30, 0.95, -7, -1, 11], [156, 12, 0.72, 4, 1, 8]]) {
      // long heads, hollow slanted eyes, mouths stretched open, bodies
      // unravelling into the smoke
      const body = U(ell(x, y, 5.2 * k, 11 * k), taper([[x, y + 6 * k], [x + lean, y + 24 * k], [x - lean * 0.7, y + 44 * k], [x + lean * 0.5, y + 66 * k], [x - lean * 0.2, y + 80 * k]], [10 * k, 8 * k, 5 * k, 2 * k, 0.3 * k]),
        taper([[x - up * 3 * k, y + 12 * k], [x - up * 9 * k, y + 22 * k], [x - up * 8 * k, y + 34 * k]], [3 * k, 2 * k, 0.3 * k]));
      s.add(`<g data-part="ghost${gi++}"><path d="${body}" fill="${gfill}"/><g fill="#0b0810" opacity=".8">` +
        `<ellipse cx="${f1(x - 2.4 * k)}" cy="${f1(y - 2 * k)}" rx="${f1(1.1 * k)}" ry="${f1(2.6 * k)}" transform="rotate(-18 ${f1(x - 2.4 * k)} ${f1(y - 2 * k)})"/>` +
        `<ellipse cx="${f1(x + 2.4 * k)}" cy="${f1(y - 2 * k)}" rx="${f1(1.1 * k)}" ry="${f1(2.6 * k)}" transform="rotate(18 ${f1(x + 2.4 * k)} ${f1(y - 2 * k)})"/>` +
        `<ellipse cx="${f1(x)}" cy="${f1(y + 5.4 * k)}" rx="${f1(1.4 * k)}" ry="${f1(3.6 * k)}"/></g></g>`);
    }
    s.path(ridge({ seed: 601, base: 166, amp: 12, freq: 2.2 }), '#190c13');
    s.path('M-10,214L-10,174L310,174L310,214Z', s.lin([[0, '#1c0d11'], [1, '#080406']]));
    s.add('<ellipse cx="150" cy="180" rx="90" ry="9" fill="#ff8a3a" opacity=".18"/>');
    // the fire: orange at the root, violet where it reaches up
    const outer = U(flame(150, 150, 122, -8, 36), flame(130, 150, 94, -18, 26, -0.14), flame(171, 150, 102, 16, 27),
      flame(114, 154, 66, -14, 19), flame(187, 154, 74, 16, 19, -0.14), flame(141, 142, 108, 12, 16, -0.16), flame(160, 144, 88, -12, 15),
      flame(104, 160, 40, -10, 13), flame(198, 160, 46, 12, 13, -0.14));
    s.add('<g data-part="flames">');
    s.bloom(`<path d="${outer}" fill="${s.lin([[0, '#9a5cf0', 0], [0.2, '#a868f4', 0.85], [0.48, '#d65aa6', 0.92], [0.7, '#ff7a2e', 1], [1, '#ffc35a', 1]])}"/>` +
      `<path d="${U(flame(150, 148, 82, -5, 21), flame(135, 148, 58, -10, 13, -0.14), flame(165, 148, 64, 10, 14))}" fill="${s.lin([[0, '#efe2ff', 0], [0.3, '#e7d2ff', 0.8], [0.7, '#ffd27a', 1], [1, '#fff6de', 1]])}"/>`,
    { sd: 2.6, k: 1.2, box: [60, -10, 180, 200] });
    s.add('</g>');
    // the pyre and the shrouded body on it
    s.glow(150, 162, 58, '#ffb347', 0.95);
    const pyre = U(
      taper([[98, 177], [202, 177]], 10), taper([[103, 166], [197, 166.3]], 9), taper([[109, 155.5], [191, 155.3]], 8.6), taper([[113, 145.5], [187, 145.5]], 8),
      [[98, 177, 5], [202, 177, 5], [103, 166, 4.5], [197, 166.3, 4.5], [109, 155.5, 4.3], [191, 155.3, 4.3]].map(([x, y, r]) => ell(x, y, r * 0.55, r)),
      taper([[90, 184], [114, 158]], 4), taper([[210, 184], [186, 158]], 4), taper([[101, 172], [94, 150]], 3), taper([[199, 172], [207, 151]], 3),
      blob([[116, 137], [121, 128.5], [133, 127], [150, 129], [168, 127.5], [182, 131], [187, 137]]),
      ell(121.5, 130, 6, 5),
    );
    s.figure(`<path d="${pyre}"/>`, { fill: '#120708', rim: '#ff9447', offsets: [[0, -1.2], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.9, shade: 0.5, halo: 0.3 });
    s.add('<g data-part="tongues">');
    s.bloom(`<path d="${U(flame(118, 172, 12, -3, 5), flame(184, 172, 13, 3, 5, -0.14), flame(132, 161, 11, -2, 4.4, -0.14), flame(166, 161, 12, 2, 4.4), flame(146, 150.5, 10, 2, 4))}" fill="${s.lin([[0, '#ffe8a0', 0.85], [1, '#ff7a2e', 1]])}"/>`,
      { sd: 1.4, k: 1.4, box: [96, 126, 110, 60] });
    s.add('</g>');
    // mourners at the edges, hoods bowed
    const mourner = U(
      blob([[24, 214], [26, 178], [30, 152], [36, 134], [46, 128], [56, 134], [62, 156], [67, 214]]),
      blob([[37, 136], [34, 124], [36, 112], [42, 106], [50, 108], [58, 115], [64, 124], [62, 131], [55, 134], [46, 139]]),
      taper([[54, 140], [60, 148], [63, 153]], [6, 5, 4.6]),
    );
    s.figure(`<path d="${mourner}"/>`, { fill: '#0c0609', rim: '#ff8a3a', offsets: [[1.4, -0.4], [0.8, -1]], rimOp: 0.8, shade: 0.5 });
    s.figure(`<path d="${mirror(mourner)}"/>`, { fill: '#0c0609', rim: '#ff8a3a', offsets: [[-1.4, -0.4], [-0.8, -1]], rimOp: 0.8, shade: 0.5 });
    s.motes({ seed: 604, n: 24, x: [100, 200], y: [40, 170], r: [0.4, 1.1], fill: '#ff9a3a', hot: '#ffe8b0', cls: 'rise', t: [4, 8] });
    s.motes({ seed: 605, n: 14, x: [110, 190], y: [16, 120], r: [0.4, 1], fill: '#b48cff', hot: '#f4ecff', cls: 'rise', t: [5, 9] });
    return s.svg();
  },

  // Verdant + Radiant: a dryad and a knight clasp hands in a glade; leaves
  // and gold motes wheel round them.
  'we-grow-together'(s) {
    s.finish({ faction: ['verdant', 'radiant'] });
    s.rect(s.lin([[0, '#ece2b2'], [0.45, '#d9d293'], [1, '#90a86a']]));
    s.glow(150, 14, 160, '#fff2c0', 0.8);
    s.shafts({ cx: 150, cy: -30, from: 64, to: 116, n: 9, len: 300, spread: 2.6, color: '#fffbe2', op: 0.32, seed: 611, sd: 2 });
    // the glade: a low far wood; trunks rising out of frame, their crowns
    // closing in at the corners round a gap of sky
    s.layer(canopy({ seed: 612, base: 134, top: 94, r0: 12, r1: 20 }), '#c6cf9d', { blur: 0.6 });
    s.haze(116, 140, '#fbf6d8', 0.2, 8);
    s.add(`<g fill="#8ca26e">${[[26, 7], [62, 5], [92, 4], [204, 4], [232, 6], [262, 8]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="185"/>`).join('')}</g>`);
    const crowns = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.2, r)));
    s.path(crowns([[-6, 6, 30], [30, -4, 26], [66, 8, 20], [96, 0, 16], [14, 30, 16]]), '#a6b884');
    s.path(crowns([[306, 6, 30], [270, -4, 26], [236, 8, 20], [206, 0, 16], [288, 30, 16]]), '#a6b884');
    s.add(`<g fill="#6f8a55">${[[-2, 14], [290, 14]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="195"/>`).join('')}</g>`);
    s.path(crowns([[-10, 0, 34], [22, -12, 26], [6, 26, 18]]), '#6f8a55');
    s.path(crowns([[310, 0, 34], [278, -12, 26], [294, 26, 18]]), '#6f8a55');
    s.path('M-10,214L-10,174C50,170 100,168 150,169C200,168 252,170 310,174L310,214Z', '#7d955f');
    s.path('M-10,214L-10,186C50,181 104,179 150,180C198,179 250,181 310,186L310,214Z', '#2a3b1f');
    // the swirl: the back half of each ring goes behind them
    const rings = [[150, 150, 70, 15, 0], [150, 104, 56, 12, 5]];
    const leafAt = (cx, cy, rx, ry, a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
    const swirl = (front) => {
      let band = '', green = [], gold = [];
      rings.forEach(([cx, cy, rx, ry, off], k) => {
        band += `M${cx - rx},${cy}A${rx},${ry} 0 0,${front ? 0 : 1} ${cx + rx},${cy}`;
        for (let i = 0; i < 12; i++) {
          const a = ((i + off * 0.1) / 12) * Math.PI * 2, [x, y] = leafAt(cx, cy, rx, ry, a);
          if ((Math.sin(a) > 0) !== front) continue;
          (i % 3 === 1 ? gold : green).push(leaf(x, y, 8.5 + (i % 2) * 2.5, (a * 180) / Math.PI + 70 + i * 23));
        }
      });
      s.add(`<path d="${band}" fill="none" stroke="#fff6cc" stroke-width="1.6" opacity="${front ? 0.5 : 0.3}"/>`);
      s.path(U(green), '#d8f08e', `class="float" style="--t:7s;--d:-${front ? 2 : 5}s"${front ? '' : ' opacity=".75"'}`);
      s.path(U(gold), '#ffd77a', `class="float" style="--t:8s;--d:-${front ? 4 : 1}s"${front ? '' : ' opacity=".75"'}`);
    };
    swirl(false);
    // the two of them, one silhouette joined at the hands
    const pair = U(
      // dryad: slender, leaf skirt, branching hair streaming back
      taper([[128, 150], [126, 166], [124, 181]], [6, 5, 4]),
      taper([[134, 150], [137, 166], [139, 181]], [6, 5, 4]),
      ell(122.5, 182, 4.4, 2), ell(141, 182, 4.4, 2),
      poly([[124, 126], [138, 126], [143, 140], [147, 155], [141, 151], [138, 157], [133, 152], [128, 158], [124, 152], [119, 156], [117, 149], [120, 138]]),
      taper([[131, 104], [131, 114], [131, 127]], [11, 9, 9.5]),
      taper([[132, 96], [132, 104]], 3.6),
      ell(133, 92, 5.6, 6.4),
      taper([[130, 88], [122, 84], [114, 86], [105, 81]], [6, 6, 4, 0.6]),
      taper([[129, 92], [120, 95], [112, 99], [103, 99]], [5, 5, 3.5, 0.6]),
      taper([[128, 96], [121, 103], [116, 110]], [4, 3, 0.5]),
      leaf(104, 79, 8, -20), leaf(102, 99, 7, 10), leaf(114, 112, 6, 50),
      taper([[133, 87], [131, 78], [127, 71]], [2, 1.4, 0.4]), taper([[131, 79], [136, 73]], [1.2, 0.3]),
      taper([[135, 87], [139, 79], [142, 72]], [1.8, 1.2, 0.3]),
      taper([[135, 106], [142, 114], [149, 118]], [4, 3.4, 3]),
      taper([[127, 106], [121, 116], [117, 126]], [4, 3.4, 2.8]),
      // knight: plumed helm, cape down the back, sword at the hip
      taper([[163, 140], [162, 160], [161, 179]], [8.5, 7, 6]),
      taper([[172, 140], [175, 160], [177, 179]], [8.5, 7, 6]),
      ell(158.5, 181, 6.4, 2.6), ell(180, 181, 6.4, 2.6),
      poly([[158, 132], [178, 132], [182, 146], [155, 146]]),
      taper([[168, 104], [168, 118], [168, 134]], [19, 15, 16]),
      ell(160.5, 106, 7, 5.4, -10),
      taper([[166, 94], [167, 104]], 5.5),
      ell(165.5, 92, 7, 7.6),
      ell(166, 89, 8, 7),
      taper([[160, 92.5], [156.5, 94]], [2.6, 1.6]),
      taper([[167, 82], [172, 77.5], [180, 77.5], [186, 82]], [4, 4, 3, 0.6]),
      taper([[160, 108], [155, 115], [151, 118]], [6, 5, 4.4]),
      taper([[175, 108], [179, 122], [178, 133]], [5.6, 4.8, 4.4]),
      taper([[176, 137], [184, 152], [191, 166]], [3.2, 3, 2.6]),
      taper([[171, 135], [181, 139]], 2.4),
      taper([[174, 102], [184, 118], [190, 140], [193, 158]], [8, 12, 12, 6]),
      ell(150, 118, 4.2, 3.8),
    );
    s.figure(`<path d="${pair}"/>`, { fill: '#1d2416', rim: '#fff3c0', offsets: [[0, -1.3], [-0.9, -0.8], [0.9, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, halo: 0.35 });
    s.glow(150, 118, 32, '#fff6c8', 0.95, 'breathe');
    s.bloom(`<path d="${glint(150, 118, 9)}" fill="#fffdf2"/>`, { sd: 1.6, k: 1.4, box: [120, 90, 60, 56] });
    swirl(true);
    const fern = (pts, w) => taper(pts, w);
    s.path(U(fern([[-6, 214], [6, 196], [22, 184], [40, 180]], [7, 4, 2, 0.4]), fern([[-4, 214], [2, 190], [6, 170], [16, 156]], [6, 4, 2, 0.4]),
      fern([[306, 214], [294, 194], [280, 184], [264, 182]], [7, 4, 2, 0.4]), fern([[304, 214], [298, 188], [300, 168], [292, 154]], [6, 4, 2, 0.4])), '#16210f');
    s.motes({ seed: 616, n: 20, x: [60, 240], y: [60, 170], r: [0.4, 1.1], fill: '#ffe9a0', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  // Tide + Umbral: knee-deep in a flooded vault, reading by cold candlelight
  // from a book that drips black water.
  'forbidden-archivist'(s) {
    s.finish({ faction: ['tide', 'umbral'] });
    s.rect(s.lin([[0, '#14223a'], [0.55, '#1a2038'], [1, '#090c16']]));
    // the shelves behind the arches
    const R = rng(621);
    let books = '', books2 = '', planks = '';
    for (const [x0, x1] of [[20, 84], [118, 182], [216, 280]]) {
      for (const y of [74, 100, 126, 152]) {
        planks += poly([[x0, y], [x1, y], [x1, y + 2], [x0, y + 2]]);
        for (let x = x0 + 1; x < x1 - 3;) {
          const w = 2.4 + R() * 2.4, h = 13 + R() * 8, lean = R() < 0.12 ? 3 : 0;
          const b = poly([[x, y], [x + lean, y - h], [x + lean + w, y - h], [x + w, y]]);
          if (R() < 0.5) books += b; else books2 += b;
          x += w + 0.6 + (R() < 0.08 ? 4 : 0);
        }
      }
    }
    s.blur(`<path d="${books}" fill="#2c3d5c"/><path d="${books2}" fill="#243250"/><path d="${planks}" fill="#0d1424"/>`, 0.5);
    // the vault wall, arches cut through it
    let wall = 'M-10,-10L310,-10L310,214L-10,214Z';
    for (const [x0, x1] of [[20, 84], [118, 182], [216, 280]]) wall += `M${x0},172L${x0},60A32,32 0 0 1 ${x1},60L${x1},172Z`;
    s.path(wall, s.lin([[0, '#1d2a44'], [1, '#121a2c']]), 'fill-rule="evenodd"');
    s.add('<path d="M20,60A32,32 0 0 1 84,60M118,60A32,32 0 0 1 182,60M216,60A32,32 0 0 1 280,60" fill="none" stroke="#2f4262" stroke-width="2"/>');
    // cold candles on the ledges
    const candles = [[40, 152, 9], [62, 126, 7], [236, 152, 8], [262, 100, 7], [204, 172, 10], [96, 172, 9]];
    for (const [x, y, h] of candles) s.glow(x, y - h - 3, 14, '#b07cff', 0.45, 'breathe');
    s.path(U(candles.map(([x, y, h]) => poly([[x - 1.4, y], [x - 1.4, y - h], [x + 1.4, y - h], [x + 1.4, y]]))), '#cfc6d8', 'opacity=".85"');
    s.bloom(`<path d="${U(candles.map(([x, y, h]) => blob([[x, y - h - 7], [x + 1.6, y - h - 2.5], [x, y - h - 0.5], [x - 1.6, y - h - 2.5]], 4)))}" fill="#f8f2ff"/>`, { sd: 1.3, k: 1.5, box: [20, 70, 260, 110] });
    // the flood
    s.path('M-10,214L-10,170L310,170L310,214Z', s.lin([[0, '#11223a'], [1, '#04070d']]));
    s.add('<path d="M-10,170.5L310,170.5" stroke="#5c86a6" stroke-width=".8" opacity=".6"/>');
    s.add(`<g fill="#d9c8ff">${candles.map(([x], i) => [0, 1, 2, 3].map((k) =>
      `<rect x="${f1(x - 3 + k * 0.6 + (i % 2))}" y="${174 + k * 6}" width="${6 - k}" height="1" rx=".5" opacity="${f1(0.4 - k * 0.08)}"/>`).join('')).join('')}</g>`);
    // the archivist, bowed over the book
    const big = 'transform="translate(143 172) scale(1.25) translate(-143 -172)"';
    s.add(`<g ${big}>`);
    s.glow(176, 116, 44, '#9fe8ee', 0.42);
    s.add('</g>');
    const man = U(
      blob([[124, 174], [125, 150], [128, 128], [133, 112], [141, 103], [151, 103], [157, 112], [158, 134], [160, 152], [163, 174]]),
      blob([[139, 104], [141, 94], [149, 87], [159, 87], [167, 93], [170, 101], [168, 108], [162, 106.5], [155, 109], [146, 110]]),
      taper([[148, 109], [155, 118], [165, 120.5]], [8, 6.6, 4.8]),
      poly([[151, 116], [161, 121], [159, 133], [150, 128]]),
      taper([[154, 107], [162, 113], [168, 117]], [6, 5, 4]),
    );
    s.figure(`<g ${big}><path d="${man}"/></g>`, { fill: '#070b13', rim: '#a6e4ec', offsets: [[1.3, 0.5], [0.8, 1], [0, -1]], rimOp: 0.85, shade: 0.5, edge: 0.3, halo: 0.35 });
    s.add(`<g ${big}>`);
    s.path(poly([[160.5, 96], [163.5, 98], [165.5, 102.5], [163.8, 103.4], [164.3, 105.6], [161, 106.4], [158.4, 102]]), '#cfe3e8', 'opacity=".9"');
    // the open book, pages lit from within, black water running off them
    s.add(`<g ${s.fx('bloom', { sd: 1.4, k: 1.3 })}><path d="${poly([[159, 112.5], [172, 116.5], [172, 121.5], [160, 118]])}" fill="#effdfb"/>` +
      `<path d="${poly([[172, 116.5], [186, 111.5], [185, 117], [172, 121.5]])}" fill="#def8f5"/>` +
      '<path d="M162,114.6L170,117M162,116.4L169,118.6M174.5,116.8L183,113.8M174.5,118.6L182,115.8" stroke="#7fa7b0" stroke-width=".5"/></g>');
    s.path(U(taper([[164, 118.6], [164.4, 124], [164.8, 129]], [2, 1.4, 0.4]), taper([[177, 119.6], [177.3, 126], [177.6, 133]], [2.2, 1.5, 0.4]),
      taper([[183, 117.6], [183.2, 122], [183.4, 126]], [1.6, 1.1, 0.3])), '#05070d', 'stroke="#8d6ad8" stroke-width=".4"');
    s.add([[164.8, 140, 0], [177.6, 148, 0.5], [183.4, 136, 1.1], [177.6, 160, 0.8]].map(([x, y, d]) =>
      `<ellipse class="fall" style="--d:-${d}s" cx="${x}" cy="${y}" rx="1.1" ry="1.7" fill="#05070d" stroke="#8d6ad8" stroke-width=".4"/>`).join(''));
    s.add('</g>');
    s.add('<g fill="none" stroke="#8fb7d0" opacity=".5"><ellipse cx="186" cy="171" rx="10" ry="1.6" stroke-width=".7"/><ellipse cx="186" cy="171" rx="18" ry="2.6" stroke-width=".5"/><ellipse cx="142" cy="173" rx="31" ry="2.6" stroke-width=".6"/></g>');
    s.add(`<g fill="#b8f0f4">${[0, 1, 2, 3, 4].map((k) => `<rect x="${f1(180 - 5 + k)}" y="${176 + k * 6}" width="${10 - k * 2}" height="1.1" rx=".5" opacity="${f1(0.5 - k * 0.09)}"/>`).join('')}</g>`);
    s.add(particles({ seed: 622, n: 18, x: [40, 260], y: [30, 165], r: [0.6, 1.6], stroke: '#a6e4ec', cls: 'rise', t: [7, 12], op: [0.3, 0.7] }));
    return s.svg();
  },

  // Ember + Tide: on a sea cliff in a storm, lightning held arcing between
  // her raised hands.
  'lightning-theorist'(s) {
    s.finish({ faction: ['ember', 'tide'] });
    s.rect(s.lin([[0, '#091520'], [0.45, '#163241'], [0.68, '#2a4c58'], [1, '#0f232c']]));
    s.glow(122, 52, 150, '#ffb35a', 0.32);
    // storm clouds lit from below by the bolt
    const puffs = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.3, r)));
    s.figure(`<path d="${puffs([[-6, 30, 22], [26, 40, 16], [58, 30, 18], [176, 34, 16], [210, 44, 20], [246, 52, 18], [280, 46, 22], [310, 56, 18]])}"/>`,
      { fill: '#1b3442', rim: '#ffcf8a', offsets: [[0, 1.4]], rimOp: 0.35, shade: 0.4 });
    s.figure(`<path d="${puffs([[14, -10, 36], [62, 2, 24], [96, -8, 22], [160, -2, 22], [200, 6, 26], [240, 14, 24], [286, 4, 32], [36, 16, 14], [264, 30, 15], [120, 4, 14]])}"/>`,
      { fill: '#0b1821', rim: '#ffd9a0', offsets: [[0, 1.6]], rimOp: 0.6, shade: 0.4 });
    // the sea, far and near
    s.path('M-10,214L-10,138L310,138L310,214Z', s.lin([[0, '#1e4350'], [1, '#06151b']]));
    s.add('<path d="M-10,138.5L310,138.5" stroke="#7fb5bd" stroke-width=".7" opacity=".5"/>');
    let caps = '';
    const R = rng(631);
    for (let i = 0; i < 26; i++) {
      const y = 142 + R() * 64, x = 140 + R() * 170, w = 4 + (y - 140) * 0.18;
      caps += `M${f1(x)},${f1(y)}q${f1(w / 2)},-${f1(1 + w * 0.08)} ${f1(w)},0`;
    }
    s.add(`<path d="${caps}" stroke="#bfe6ea" stroke-width=".8" fill="none" opacity=".55"/>`);
    s.add('<ellipse cx="236" cy="150" rx="70" ry="5" fill="#ffcf8a" opacity=".12"/>');
    // rain
    let rain = '';
    for (let i = 0; i < 40; i++) { const x = R() * 320, y = R() * 200; rain += `M${f1(x)},${f1(y)}l-3,9`; }
    s.add(`<path d="${rain}" stroke="#9fc9d2" stroke-width=".5" opacity=".35"/>`);
    // the cliff
    s.figure(`<path d="${poly([[-10, 214], [-10, 150], [30, 147], [70, 151], [104, 152], [134, 150], [150, 154], [156, 166], [162, 186], [170, 214]])}"/>`,
      { fill: '#0a1418', rim: '#ffcf8a', offsets: [[0, -1.2]], rimOp: 0.55, shade: 0.5 });
    s.add(particles({ seed: 632, n: 16, x: [158, 200], y: [170, 206], r: [0.6, 1.6], fill: '#cdeff2', cls: 'rise', t: [3, 6], op: [0.4, 0.9] }));
    // the theorist, arms up, coat and hair thrown back by the gale
    const her = U(
      taper([[115, 124], [111, 138], [108, 150]], [7.5, 6, 5]),
      taper([[122, 124], [127, 138], [130, 149]], [7.5, 6, 5]),
      ell(106, 151.5, 5.6, 2.4), ell(132.5, 150.5, 5.6, 2.4),
      blob([[112, 100], [124, 100], [128, 116], [130, 134], [118, 131], [106, 136], [94, 141], [100, 126], [106, 112]], 5),
      taper([[120, 93], [120, 101]], 4.6),
      ell(120.5, 89, 6, 6.8),
      taper([[117, 85], [108, 80], [99, 80]], [5, 4, 0.5]), taper([[116, 89], [106, 90], [96, 94]], [5, 4, 0.5]),
      taper([[119, 84], [114, 74], [106, 70]], [4, 3, 0.5]), taper([[122, 84], [122, 74], [118, 66]], [3.5, 2.5, 0.4]),
      taper([[116, 93], [108, 99], [100, 105]], [4, 3, 0.4]), taper([[124, 83], [128, 75], [128, 68]], [3, 2, 0.4]),
      taper([[114, 101], [103, 87], [95, 71]], [5.4, 4.6, 4]),
      taper([[126, 101], [139, 88], [149, 72]], [5.4, 4.6, 4]),
      ell(94.5, 69, 3.4, 3.8), ell(149.5, 70, 3.4, 3.8),
      taper([[93, 67], [90, 61]], [1.6, 0.4]), taper([[95.5, 66], [95, 59.5]], [1.6, 0.4]), taper([[97.5, 67], [100, 61.5]], [1.5, 0.4]),
      taper([[148, 67.5], [145.5, 61.5]], [1.6, 0.4]), taper([[150.5, 66.5], [151, 60]], [1.6, 0.4]), taper([[152.5, 68], [155.5, 62.5]], [1.5, 0.4]),
    );
    s.figure(`<path d="${her}"/>`, { fill: '#071016', rim: '#ffe2b0', offsets: [[0, -1.4], [-0.8, -1], [0.8, -1]], rimOp: 0.95, shade: 0.5, edge: 0.3, halo: 0.4 });
    // the arc between her hands, and the bolt that feeds it
    const arc = Array.from({ length: 13 }, (_, i) => { const t = i / 12; return [95 + (149 - 95) * t, 64 - Math.sin(Math.PI * t) * 26]; });
    const R2 = rng(633);
    const jag = arc.map(([x, y], i) => (i === 0 || i === 12 ? [x, y] : [x + (R2() - 0.5) * 5, y + (R2() - 0.5) * 7]));
    const strike = bolt([136, -4], [124, 40], 634, 8, 7);
    const forks = [bolt([122, 38], [104, 30], 635, 4, 3), bolt([128, 18], [146, 10], 636, 4, 3), bolt([104, 50], [92, 44], 637, 3, 2.5)];
    const all = [jag, strike, ...forks].map(polyline).join('');
    s.add('<g data-part="arc">');
    s.bloom(`<path d="${all}" stroke="#ff9a3c" stroke-width="5" fill="none" opacity=".4" stroke-linejoin="round"/><path d="${all}" stroke="#fffaea" stroke-width="1.5" fill="none" stroke-linejoin="round"/>`,
      { sd: 2, k: 1.4, box: [66, -24, 110, 120] });
    s.add('</g>');
    s.glow(95, 66, 16, '#ffd27a', 0.9, 'breathe').glow(149, 68, 16, '#ffd27a', 0.9, 'breathe');
    s.glow(123, 40, 22, '#fff1c8', 0.55);
    s.motes({ seed: 638, n: 16, x: [86, 160], y: [30, 90], r: [0.35, 0.9], fill: '#ffc870', hot: '#fffaea', cls: 'twinkle', t: [1.5, 3], op: [0.4, 1] });
    return s.svg();
  },

  // Verdant + Ember: a sabre-tooth in mid-leap through a burning jungle,
  // its stripes smouldering like coals.
  'apex-predator'(s) {
    s.finish({ faction: ['verdant', 'ember'] });
    s.rect(s.lin([[0, '#1f0d09'], [0.4, '#4f1c0f'], [0.75, '#a8441a'], [1, '#d96d2c']]));
    s.glow(160, 176, 170, '#ff7a2e', 0.5);
    s.add(`<g fill="#2a120d" opacity=".5">${[[70, 40, 40], [140, 22, 46], [230, 36, 42], [290, 60, 30]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r * 0.7}"/>`).join('')}</g>`);
    // burning jungle: far crowns lit from below, flames between the trunks
    s.figure(`<path d="${canopy({ seed: 641, base: 150, top: 104, r0: 12, r1: 22 })}"/>`, { fill: '#4a2214', rim: '#ff9447', offsets: [[0, -1.2]], rimOp: 0.6, shade: 0.4 });
    s.bloom(`<path d="${U(flame(40, 154, 46, 5, 16), flame(96, 152, 60, -7, 20, -0.14), flame(150, 154, 42, 5, 14), flame(206, 152, 64, 7, 20, -0.14), flame(262, 154, 50, -5, 16),
      flame(68, 156, 30, -3, 11, -0.14), flame(234, 156, 34, 3, 11))}" fill="${s.lin([[0, '#ffd27a', 0.15], [0.4, '#ff8a3a', 0.85], [1, '#ffd98a', 1]])}"/>`, { sd: 2.4, k: 1.2, box: [-20, 70, 340, 110] });
    // palms
    const palm = (x, y, h, lean) => {
      const top = [x + lean, y - h];
      const fr = [-150, -120, -75, -40, -10, 20].map((a) => {
        const r = (a * Math.PI) / 180, L = 26 + Math.abs(Math.cos(r)) * 8;
        return taper([top, [top[0] + Math.cos(r) * L * 0.55, top[1] + Math.sin(r) * L * 0.55 - 4], [top[0] + Math.cos(r) * L, top[1] + Math.sin(r) * L + 8]], [5, 4, 0.5]);
      });
      return [taper([[x, y], [x + lean * 0.4, y - h * 0.5], top], [6, 4.6, 3.4]), ...fr];
    };
    s.figure(`<path d="${U(palm(24, 214, 150, 14), palm(282, 214, 136, -10))}"/>`, { fill: '#160f09', rim: '#ff9447', offsets: [[0, -1]], rimOp: 0.6, shade: 0.4 });
    s.path(ridge({ seed: 642, base: 192, amp: 14, freq: 3 }), '#1d130b');
    // the beast, tipped down into its pounce
    const cat = U(
      ell(178, 100, 24, 20.5),
      taper([[172, 98], [146, 96], [122, 95]], [36, 28, 26]),
      ell(112, 96, 18, 17),
      taper([[188, 92], [198, 93], [206, 95]], [24, 21, 18]),
      blob([[201, 94], [207, 85], [218, 82], [229, 86], [237, 94], [236, 102], [226, 106], [211, 107], [203, 102]]),
      ell(208, 86, 4.4, 3.4, -30),
      taper([[213, 106], [222, 114], [231, 117]], [6.5, 4.4, 1.6]),
      taper([[188, 108], [202, 120], [216, 128], [226, 132]], [15, 11, 9, 8]), ell(229, 133, 8.5, 5, 15),
      taper([[176, 112], [190, 128], [202, 140], [210, 146]], [13, 10, 8, 7]), ell(213, 147, 7.5, 4.6, 25),
      [[235, 131], [236, 135], [235, 139]].map(([x, y]) => taper([[x, y], [x + 4, y + 2], [x + 4.5, y + 5]], [1.8, 1.1, 0.3])),
      taper([[116, 102], [96, 110], [82, 116]], [24, 14, 9]), taper([[82, 116], [66, 118], [54, 117]], [9, 6.5, 5.5]), ell(50, 117, 6.5, 4, -5),
      taper([[108, 106], [94, 120], [82, 128]], [19, 12, 8]), taper([[82, 128], [70, 136], [60, 140]], [8, 6, 5]), ell(56, 141, 6, 3.8, -25),
      taper([[98, 88], [84, 80], [70, 77]], [8, 6, 3]),
    );
    const tilt = 'transform="rotate(10 150 104)"';
    s.figure(`<g ${tilt}><path d="${cat}"/></g>`, { fill: '#120a07', rim: '#ff9a4a', offsets: [[0, -1.4], [-1, -0.8], [1, -0.8]], rimOp: 0.95, shade: 0.5, edge: 0.3, halo: 0.4 });
    // smouldering stripes, the eye, the sabres
    const stripes = U(
      [[124, 80, 14, 2], [136, 79, 17, -1], [148, 79, 15, 2], [160, 80, 18, -2], [170, 82, 12, 1]].map(([x, y, l, b]) => taper([[x, y], [x + 2 + b, y + l * 0.5], [x + 1, y + l]], [2.6, 1.8, 0.3])),
      taper([[104, 82], [100, 90], [101, 97]], [2.4, 1.6, 0.3]), taper([[114, 81], [112, 90]], [2.2, 0.3]),
      taper([[184, 84], [188, 92], [186, 100]], [2.6, 1.8, 0.3]), taper([[194, 86], [196, 94]], [2.2, 0.3]),
      taper([[90, 106], [86, 114]], [2.2, 0.3]), taper([[200, 116], [206, 122]], [2.2, 0.3]),
    );
    s.add(`<g ${tilt}><g ${s.fx('bloom', { sd: 1.4, k: 1.4 })}><path d="${stripes}" fill="#ff6a1f" opacity=".45" stroke="#ff7a2e" stroke-width="2.4" stroke-linejoin="round"/><path d="${stripes}" fill="#ffcc78"/></g>`);
    s.glow(222, 92, 7, '#ffcf5a', 0.9);
    s.add(`<ellipse cx="222" cy="92" rx="2.8" ry="1.5" fill="#fff0b0" transform="rotate(12 222 92)"/>` +
      `<path d="${U(taper([[227, 104], [228.5, 113], [230, 122]], [3, 2.2, 0.3]), taper([[220, 106], [221, 113], [222.5, 119]], [2.4, 1.8, 0.3]))}" fill="#f3e3c0"/></g>`);
    // big leaves in the foreground
    const R = rng(643);
    const fronds = [];
    for (const [x, y, a, l] of [[-4, 214, -60, 54], [10, 216, -35, 50], [30, 216, -80, 40], [300, 214, -120, 56], [286, 216, -150, 46]]) {
      const r = (a * Math.PI) / 180;
      fronds.push(taper([[x, y], [x + Math.cos(r) * l * 0.5, y + Math.sin(r) * l * 0.5 - 6], [x + Math.cos(r) * l, y + Math.sin(r) * l]], [14 + R() * 4, 12, 0.6]));
    }
    s.path(U(fronds), '#0f160b');
    s.motes({ seed: 644, n: 30, x: [20, 290], y: [60, 205], r: [0.4, 1.2], fill: '#ff9a3a', hot: '#ffe8b0', cls: 'rise', t: [4, 8] });
    return s.svg();
  },

  // Token: a winged child of light hanging in the dawn.
  spirit(s) {
    s.finish({ faction: 'radiant' });
    s.rect(s.lin([[0, '#36405f'], [0.45, '#7a84a0'], [0.76, '#e0c597'], [1, '#f1c07c']]));
    s.add(particles({ seed: 651, n: 16, x: [0, W], y: [0, 70], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(232, 168, 130, '#ffe3a6', 0.65);
    s.bloom('<circle cx="232" cy="164" r="11" fill="#fff6dc"/>', { sd: 3, k: 1.1, box: [176, 108, 112, 96] });
    s.layer(ridge({ seed: 652, base: 166, amp: 16, freq: 2 }), '#8c7f74', { blur: 0.6 });
    s.haze(146, 172, '#ffe3b0', 0.3, 6);
    s.path(ridge({ seed: 653, base: 182, amp: 12, freq: 2.6 }), '#4a4038');
    s.path('M-10,214L-10,194C60,189 130,188 190,191C240,193 280,190 310,192L310,214Z', '#1f1914');
    // grass at the corners
    const R = rng(656);
    const blades = [];
    for (const [x0, x1, hh, left] of [[-8, 74, 44, 1], [232, 310, 40, 0]]) {
      for (let x = x0; x < x1; x += 2.5 + R() * 4) {
        const d = left ? (x - x0) / (x1 - x0) : (x1 - x) / (x1 - x0), h = 20 + R() * hh * (1 - d), lean = (R() - 0.5) * 14;
        blades.push(taper([[x, 216], [x + lean * 0.4, 214 - h * 0.5], [x + lean, 214 - h]], [2.2, 1.4, 0.3], { per: 4 }));
      }
    }
    s.path(U(blades), '#1f1914');
    // the spirit
    s.glow(150, 100, 76, '#fff1c4', 0.6, 'breathe');
    s.glow(150, 100, 28, '#fffaf0', 0.9);
    const wing = (d) => U(
      taper([[150 + d * 4, 94], [150 + d * 20, 80], [150 + d * 38, 66], [150 + d * 48, 62]], [7, 9, 6, 0.6]),
      taper([[150 + d * 4, 97], [150 + d * 20, 90], [150 + d * 36, 84], [150 + d * 47, 82]], [6, 8, 5, 0.5]),
      taper([[150 + d * 4, 100], [150 + d * 18, 99], [150 + d * 32, 100], [150 + d * 41, 102]], [5, 6.5, 4, 0.5]),
      taper([[150 + d * 4, 103], [150 + d * 15, 107], [150 + d * 25, 113], [150 + d * 31, 118]], [4, 5, 3, 0.4]),
    );
    const wf = s.lin([[0, '#fffbe8', 0.95], [1, '#ffd77a', 0.35]], { x1: 0.5, y1: 0, x2: 0.5, y2: 1 });
    // a small child: big head, round body, arms open, legs tucked
    const child = U(ell(150, 80, 7.6, 7.8), taper([[150, 87], [150, 90]], 5), ell(150, 99, 8.4, 11),
      blob([[141.5, 100], [158.5, 100], [162, 114], [150, 117], [138, 114]]),
      taper([[146, 113], [143.5, 121], [140, 126]], [5.4, 4.4, 3.6]), taper([[154, 113], [158, 120], [162.5, 124]], [5.4, 4.4, 3.6]),
      taper([[143, 92], [135, 95], [128.5, 92]], [4.4, 3.6, 3]), ell(127.5, 91.5, 2.6, 2.4),
      taper([[157, 92], [165, 95], [171.5, 92]], [4.4, 3.6, 3]), ell(172.5, 91.5, 2.6, 2.4));
    s.bloom(`<path d="${wing(-1) + wing(1)}" fill="${wf}"/><path d="${child}" fill="#fffdf4"/>` +
      '<ellipse cx="150" cy="69" rx="8" ry="2.4" fill="none" stroke="#fff3c6" stroke-width="1.2" opacity=".9"/>', { sd: 2, k: 1.2, box: [80, 36, 140, 110] });
    s.motes({ seed: 654, n: 22, x: [96, 204], y: [56, 150], r: [0.4, 1.1], fill: '#ffe9b0', hot: '#ffffff', cls: 'float', t: [4, 8], op: [0.5, 1] });
    s.motes({ seed: 655, n: 10, x: [132, 168], y: [120, 175], r: [0.35, 0.8], fill: '#ffdf98', hot: '#ffffff', cls: 'rise', t: [3, 6], op: [0.5, 1] });
    return s.svg();
  },

  // Token: one spark held over an open palm, in the dark.
  spark(s) {
    s.rect(s.lin([[0, '#0b0907'], [1, '#141009']]));
    s.glow(156, 104, 165, '#ffc861', 0.42);
    s.glow(152, 84, 46, '#ffe6a6', 0.7, 'breathe');
    // the hand, palm up and a little cupped, in from the lower right
    const hand = U(
      taper([[326, 236], [276, 196], [236, 164]], [46, 38, 32]),
      blob([[240, 152], [228, 167], [202, 172], [172, 168], [150, 160], [147, 150], [166, 144], [194, 144], [214, 140], [232, 142]]),
      taper([[160, 155], [140, 154], [122, 150], [108, 143]], [12.5, 10.5, 9, 7.4]), ell(107.5, 142.5, 3.8, 3.6),
      taper([[164, 150], [142, 147], [124, 141], [112, 133]], [11.5, 10, 8.6, 7]), ell(111.5, 132.5, 3.6, 3.4),
      taper([[168, 146], [150, 142], [136, 136], [127, 128]], [10.5, 9, 7.6, 6.2]), ell(126.5, 127.5, 3.2, 3),
      taper([[173, 143], [159, 138], [149, 132], [144, 125]], [9.4, 8, 6.6, 5.2]), ell(143.5, 124.5, 2.8, 2.6),
      taper([[216, 148], [205, 133], [195, 123], [185, 118]], [17, 13, 10.5, 8.6]), ell(184, 117.5, 4.4, 4.2),
    );
    s.figure(`<path d="${hand}"/>`, { fill: '#120c07', rim: '#ffcf6a', offsets: [[0, -1.3], [-0.7, -1], [0.7, -1]], rimOp: 0.9, shade: 0.5, edge: 0.3, halo: 0.35 });
    s.add('<ellipse cx="178" cy="150" rx="30" ry="4.6" fill="#ffcf6a" opacity=".13"/>');
    // the spark
    s.glow(152, 86, 18, '#fff6d8', 1, 'breathe');
    s.bloom(`<path d="${glint(152, 86, 15, 0.12)}" fill="#fffbea"/><path d="${rot(glint(152, 86, 8, 0.2), 152, 86, 45)}" fill="#fff3cc"/><circle cx="152" cy="86" r="2.6" fill="#ffffff"/>`,
      { sd: 2, k: 1.5, box: [112, 46, 80, 80] });
    s.motes({ seed: 661, n: 16, x: [116, 190], y: [52, 126], r: [0.3, 0.75], fill: '#ffd27a', hot: '#fffaea', cls: 'twinkle', op: [0.3, 0.9], t: [1.5, 3.5] });
    return s.svg();
  },
};
