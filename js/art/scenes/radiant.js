// Radiant card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, pt, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();

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

// Scale a polygon path about (ox, oy).
const sc = (d, ox, oy, k) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f1(ox + (x - ox) * k)},${f1(oy + (y - oy) * k)}`);

// A four-point glint.
const glint = (x, y, r) => poly([[x, y - r], [x + r * 0.18, y - r * 0.18], [x + r, y], [x + r * 0.18, y + r * 0.18],
  [x, y + r], [x - r * 0.18, y + r * 0.18], [x - r, y], [x - r * 0.18, y - r * 0.18]]);

// y of a dense polyline at x (for standing things on a hill).
function yAt(pts, x) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if ((x >= x0 && x <= x1) || (x <= x0 && x >= x1)) return y0 + ((y1 - y0) * (x - x0)) / ((x1 - x0) || 1);
  }
  return pts[pts.length - 1][1];
}

// A soldier at attention, facing out, in a kettle hat: spear on the left,
// tall shield on the right. `k` scales it (1 ≈ 78px tall, spear 106px).
function soldier(cx, fy, k = 1) {
  const X = (dx) => cx + dx * k, Y = (dy) => fy - dy * k;
  return [
    taper([[X(-3.6), Y(34)], [X(-4.6), Y(17)], [X(-5), Y(1.5)]], [6.4 * k, 5.2 * k, 4.4 * k]),
    taper([[X(3.6), Y(34)], [X(4.6), Y(17)], [X(5), Y(1.5)]], [6.4 * k, 5.2 * k, 4.4 * k]),
    ell(X(-6), Y(0.8), 4.4 * k, 2 * k), ell(X(6), Y(0.8), 4.4 * k, 2 * k),
    taper([[X(0), Y(62)], [X(0), Y(48)], [X(0), Y(32)]], [17 * k, 14.5 * k, 13.5 * k]),
    taper([[X(0), Y(62)], [X(0), Y(66)]], 5 * k),
    ell(X(0), Y(68), 5.2 * k, 5.8 * k),
    ell(X(0), Y(72.5), 6.4 * k, 5.4 * k),
    ell(X(0), Y(70), 8.8 * k, 1.8 * k),
    poly([[X(-1), Y(58)], [X(12.5), Y(58)], [X(12.5), Y(32)], [X(5.8), Y(21)], [X(-1), Y(32)]]),
    taper([[X(-7), Y(60)], [X(-9.6), Y(50)], [X(-11), Y(42)]], [4.4 * k, 3.6 * k, 3.4 * k]),
    poly([[X(-12), Y(-1)], [X(-12), Y(95)], [X(-10.4), Y(95)], [X(-10.4), Y(-1)]]),
    poly([[X(-13.7), Y(94)], [X(-11.2), Y(106)], [X(-8.7), Y(94)]]),
  ];
}

// A knight behind a kite shield, facing out; `k` = scale (1 ≈ 113px tall).
function knight(cx, fy, k) {
  const X = (dx) => cx + dx * k, Y = (dy) => fy - dy * k;
  const kx = X(-6), top = Y(82), hw = 20 * k, h = 62 * k;
  return [
    taper([[X(-5), Y(40)], [X(-7), Y(20)], [X(-8), Y(2)]], [9 * k, 7.5 * k, 6.5 * k]),
    taper([[X(6), Y(40)], [X(7.5), Y(20)], [X(8.5), Y(2)]], [9 * k, 7.5 * k, 6.5 * k]),
    ell(X(-10), Y(0.5), 6 * k, 2.6 * k), ell(X(10.5), Y(0.5), 6 * k, 2.6 * k),
    taper([[X(1), Y(84)], [X(0.5), Y(62)], [X(0), Y(38)]], [26 * k, 22 * k, 20 * k]),
    ell(X(12), Y(80), 7 * k, 5.4 * k),
    poly([[X(-6.8), Y(100)], [X(-4), Y(105)], [X(0.4), Y(108)], [X(4.6), Y(105)], [X(7.4), Y(100)], [X(7.8), Y(89)], [X(5), Y(85)], [X(-5.5), Y(85)], [X(-7.3), Y(89)]]),
    poly([[X(15), Y(-1)], [X(15), Y(148)], [X(17.4), Y(148)], [X(17.4), Y(-1)]]),
    poly([[X(13.8), Y(147)], [X(16.2), Y(162)], [X(18.6), Y(147)]]),
    poly([[kx - hw, top + h * 0.04], [kx - hw * 0.5, top - h * 0.015], [kx, top - h * 0.03], [kx + hw * 0.5, top - h * 0.015], [kx + hw, top + h * 0.04],
      [kx + hw * 0.98, top + h * 0.3], [kx + hw * 0.8, top + h * 0.55], [kx + hw * 0.45, top + h * 0.8], [kx, top + h],
      [kx - hw * 0.45, top + h * 0.8], [kx - hw * 0.8, top + h * 0.55], [kx - hw * 0.98, top + h * 0.3]]),
  ];
}

export const radiant = {
  shieldbearer(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#8fa8bb'], [0.42, '#d6c49c'], [0.78, '#f4d99c'], [1, '#e7bf7a']]));
    s.glow(156, 138, 160, '#fff2c8', 0.75);
    s.add(rays({ cx: 156, cy: 138, from: -178, to: -2, n: 15, len: 280, spread: 2, color: '#fff8de', op: 0.24, seed: 51 }));
    s.add('<circle cx="156" cy="138" r="21" fill="#fff6dd"/>');
    s.path(ridge({ seed: 52, base: 166, amp: 24, freq: 2.1 }), '#c8ae84');
    // banners on the far ridge
    s.add('<g><path d="M58,166L58,124" stroke="#8a7352" stroke-width="1.4"/><path d="M58,125L74,129.5L58,135Z" fill="#9c4c3a"/>' +
      '<path d="M246,168L246,130" stroke="#8a7352" stroke-width="1.4"/><path d="M246,131L262,135L246,140Z" fill="#3e5d77"/></g>');
    s.path(ridge({ seed: 53, base: 184, amp: 16, freq: 3 }), '#8d7653');
    s.path('M-10,214L-10,186C60,181 120,181 160,183C220,185 262,182 310,186L310,214Z', '#3b2e1f');
    // arrows in flight
    const arrow = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0,0L22,0" stroke="#2a1f15" stroke-width="1.1"/><path d="M22,0L18,-2L18,2Z" fill="#2a1f15"/><path d="M0,0L-3,-2.4M0,0L-3,2.4M3,0L0,-2.4M3,0L0,2.4" stroke="#2a1f15" stroke-width=".7"/></g>`;
    s.add(arrow(262, 58, 158), arrow(238, 34, 162), arrow(282, 92, 155));
    // the shieldbearer behind a planted tower shield
    const soldier =
      `<path d="${taper([[151, 111], [143, 126], [136, 144], [131, 162]], [12, 17, 19, 15])}"/>` +
      '<path d="M122,160L131,170L140,159Z"/>' +
      `<path d="${taper([[154, 112], [150, 130], [146, 149]], [16, 18, 16])}"/>` +
      `<path d="${taper([[146, 147], [136, 162], [124, 182]], [12, 8.5, 6.5])}"/>` +
      `<path d="${taper([[150, 149], [158, 164], [160, 182]], [11, 8.5, 6.5])}"/>` +
      '<ellipse cx="121" cy="183" rx="7.5" ry="3"/><ellipse cx="163" cy="183" rx="7" ry="3"/>' +
      `<path d="${taper([[158, 118], [164, 125], [169, 130]], [6.4, 5.4, 4.8])}"/>` +
      '<circle cx="156" cy="104" r="8.5"/><ellipse cx="157" cy="107.5" rx="10.5" ry="3.2"/>' +
      `<path d="${taper([[160, 96.5], [154, 93.5], [147, 94.5], [141, 99]], [4.6, 4.8, 3.6, 1.2])}"/>` +
      `<path d="${taper([[139, 186], [133, 70]], [2.2, 1.7])}"/><path d="M130.4,72L133,57L135.6,72Z"/>` +
      '<path d="M160,101C172,99 184,100 191,103L191,181C184,185 172,186 160,185Z"/>';
    s.figure(soldier, { fill: p.fig, rim: p.rim, offsets: [[-1.4, -0.6], [1.4, -0.6], [0, -1.4]], rimOp: 0.95 });
    // arrows stuck in the shield, and one broken in the mud
    s.add(arrow(190, 126, -18), arrow(190, 152, -6), arrow(190, 138, 10));
    s.add('<path d="M206,186L222,180" stroke="#2a1f15" stroke-width="1.2"/><path d="M226,184L236,186" stroke="#2a1f15" stroke-width="1.2"/>');
    s.add(particles({ seed: 54, n: 18, x: [40, 260], y: [60, 180], r: [0.5, 1.2], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A kid in a too-big helmet, fist on hip, beside the line he is joining.
  'street-recruit'(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#a3bccb'], [0.42, '#dcd2ac'], [0.76, '#f5dea6'], [1, '#ecc98e']]));
    s.glow(236, 44, 150, '#fff3cc', 0.75);
    s.add(rays({ cx: 236, cy: 44, from: 92, to: 228, n: 11, len: 300, spread: 2.2, color: '#fff8de', op: 0.2, seed: 501 }));
    s.add('<circle cx="236" cy="44" r="13" fill="#fff7e0"/>');
    // rooftops and a bell tower round the square
    const b = 152;
    const roofs = [[-12, 30, 36, 14, 1], [16, 26, 46, 13], [40, 30, 32, 15, 1], [88, 28, 40, 14], [114, 34, 30, 16, 1], [146, 26, 48, 13],
      [170, 32, 36, 15, 1], [200, 28, 44, 14], [226, 34, 30, 16, 1], [258, 26, 42, 13], [282, 34, 34, 16, 1]];
    let town = roofs.map(([x, w, h, rf, ch]) => {
      let d = poly([[x, b], [x, b - h], [x + w / 2, b - h - rf], [x + w, b - h], [x + w, b]]);
      if (ch) d += poly([[x + w * 0.68, b - h - rf * 0.4], [x + w * 0.68, b - h - rf - 3], [x + w * 0.68 + 4, b - h - rf - 3], [x + w * 0.68 + 4, b - h - rf * 0.3]]);
      return d;
    }).join('');
    town += poly([[70, b], [70, 74], [67.5, 74], [79, 44], [90.5, 74], [88, 74], [88, b]]);
    s.path(town, '#cdbb96');
    const win = (x, y) => poly([[x, y], [x + 3.4, y], [x + 3.4, y + 5], [x, y + 5]]);
    s.path(roofs.map(([x, w, h]) => win(x + w * 0.2, b - h * 0.62) + win(x + w * 0.6, b - h * 0.62)).join('') +
      poly([[75, 92], [75, 84], [79, 79], [83, 84], [83, 92]]), '#b29d78');
    // the square
    s.path(`M-10,${b}L310,${b}L310,214L-10,214Z`, s.lin([[0, '#c3ab80'], [1, '#806b4c']]));
    s.add(`<path d="M-10,${b + 1}L310,${b + 1}" stroke="#a48f6b" stroke-width="2.4"/>`);
    // bunting strung across the square, backlit
    const bz = (t) => { const u = 1 - t; return [u * u * -5 + 2 * u * t * 150 + t * t * 305, u * u * 18 + 2 * u * t * 62 + t * t * 14]; };
    s.add(`<path d="${line(Array.from({ length: 13 }, (_, i) => bz(i / 12)))}" fill="none" stroke="#6d5a42" stroke-width=".7"/>`);
    const flags = ['', '', ''];
    for (let i = 0; i < 20; i++) {
      const [x, y] = bz(0.03 + i * 0.05);
      flags[i % 3] += poly([[x - 3.4, y], [x + 3.4, y + 0.3], [x, y + 8]]);
    }
    s.path(flags[0], '#9c4c3a').path(flags[1], '#e4d4a6').path(flags[2], '#3e5d77');
    // the line of soldiers he is joining
    const line5 = U([157, 186, 215, 244, 273].map((x) => soldier(x, 174, 1.16)));
    s.figure(`<path d="${line5}"/>`, { fill: '#77634a', rim: '#f6e3b2', offsets: [[1, -0.8]], rimOp: 0.6 });
    s.path('M-10,214L-10,196C60,192 140,194 200,196C250,198 280,195 310,196L310,214Z', '#3b2e1f');
    // the recruit: the same kettle hat as theirs, far too big for him, a
    // shield nearly as tall as his legs, fist on hip
    const K = 1.14, kx = (x) => 100 + (x - 100) * K, ky = (y) => 188 + (y - 188) * K;
    const kid = sc(U(
      taper([[95, 156], [90, 171], [85.5, 183.5]], [7, 5.6, 4.8]),
      taper([[102, 156], [108, 170], [112, 183.5]], [7, 5.6, 4.8]),
      ell(83.5, 185.5, 5.6, 2.5), ell(115, 185.5, 5.8, 2.5),
      taper([[100, 135], [99, 146], [98.5, 158]], [13, 11.5, 12.5]),
      taper([[101.5, 128], [100.5, 137]], 4.8),
      taper([[95, 138], [86, 147], [94, 156]], [4.6, 3.8, 3.6]),
      taper([[104, 139], [112, 147]], [4.4, 4]),
      ell(102.5, 129, 6, 6.2),
      ell(103.5, 122.5, 9, 7.6, -10),
      ell(105.5, 126.5, 13.5, 2.3, -10),
      ell(124, 152, 16.5, 20.5),
    ), 100, 188, K);
    s.figure(`<path d="${kid}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.2, -1], [0.4, -1.3]], rimOp: 0.95 });
    // a sun painted on the shield, its boss catching the light
    const [bx, by] = [kx(124), ky(152)];
    s.add(`<g stroke="#6b5233" stroke-width="1.2" fill="none" opacity=".9"><ellipse cx="${f1(bx)}" cy="${f1(by)}" rx="${f1(11.5 * K)}" ry="${f1(14.5 * K)}"/>${
      Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `<path d="M${f1(bx + Math.cos(a) * 4.5 * K)},${f1(by + Math.sin(a) * 5.6 * K)}L${f1(bx + Math.cos(a) * 8.5 * K)},${f1(by + Math.sin(a) * 10.6 * K)}"/>`; }).join('')}</g>`);
    s.glow(bx, by, 10, '#ffd77a', 0.75, 'breathe');
    s.add(`<circle cx="${f1(bx)}" cy="${f1(by)}" r="2.8" fill="#ffe8a8"/>`);
    s.add(particles({ seed: 502, n: 16, x: [40, 260], y: [50, 180], r: [0.5, 1.2], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // Two newborn spirits spiral up out of a field before sunrise.
  'twin-souls'(s) {
    s.rect(s.lin([[0, '#2f3a5a'], [0.38, '#6b7a95'], [0.7, '#d2bb8f'], [0.86, '#f6d699'], [1, '#efb97b']]));
    s.add(particles({ seed: 511, n: 18, x: [0, W], y: [0, 70], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    s.glow(66, 152, 150, '#ffe3a6', 0.7);
    s.add(rays({ cx: 66, cy: 152, from: -172, to: -18, n: 10, len: 300, spread: 2, color: '#fff3d0', op: 0.13, seed: 512 }));
    s.add('<circle cx="66" cy="152" r="15" fill="#fff4d6"/>');
    s.path(ridge({ seed: 513, base: 156, amp: 12, freq: 2 }), '#8a7c6c');
    s.path(U(taper([[250, 154], [249, 140], [244, 133]], [3, 2, 1.2]), taper([[249.5, 142], [256, 134]], [1.8, 1]),
      ell(236, 134, 9, 6), ell(246, 128, 11, 8), ell(259, 131, 10, 6.5), ell(252, 136, 12, 5), ell(240, 137, 8, 4.5)), '#8a7c6c');
    s.path(ridge({ seed: 514, base: 163, amp: 7, freq: 3 }), '#5d5142');
    // the field, furrows running to the horizon
    s.path('M-10,214L-10,160L310,160L310,214Z', s.lin([[0, '#4d4232'], [1, '#231c14']]));
    let fur = '';
    for (let dx = -480; dx <= 480; dx += 40) fur += `M${f1(150 + dx * 0.05)},161L${f1(150 + dx)},214`;
    s.add(`<path d="${fur}" stroke="#7a6748" stroke-width=".8" fill="none" opacity=".45"/>`);
    // where they were born
    s.glow(162, 177, 30, '#fff0c0', 0.85, 'breathe');
    s.add('<ellipse cx="162" cy="178" rx="22" ry="3.6" fill="#ffe7a8" opacity=".6"/>');
    // the two spirits: a double helix of light
    const cx = 162, y0 = 176, hgt = 126, turns = 1.25;
    const strand = (ph, t1) => Array.from({ length: 31 }, (_, i) => {
      const t = (i / 30) * t1;
      return [cx + (6 + 22 * t) * Math.sin(t * turns * 2 * Math.PI + ph), y0 - hgt * t];
    });
    s.glow(cx, 112, 70, '#ffe9b0', 0.22);
    const trail = s.lin([[0, '#fffbe8', 1], [0.6, '#ffe6a6', 0.6], [1, '#ffd77a', 0]]);
    const halo = s.lin([[0, '#ffe9b0', 0.45], [1, '#ffd77a', 0]]);
    const heads = [];
    for (const [ph, t1] of [[Math.PI, 0.93], [0, 1]]) {
      const pts = strand(ph, t1);
      s.path(taper(pts, [0.5, 3, 7, 11], { per: 3 }), halo);
      s.path(taper(pts, [0.3, 1.2, 2.6, 4.2], { per: 3 }), trail);
      heads.push(pts[pts.length - 1]);
    }
    for (const [x, y] of heads) {
      s.glow(x, y, 22, '#fff1c2', 0.95, 'breathe');
      const wing = (d) => taper([[x + d * 1.5, y - 1], [x + d * 6, y - 6], [x + d * 11, y - 9.5], [x + d * 14, y - 9]], [3.4, 4.4, 2.6, 0.4]);
      s.path(U(ell(x, y - 4.5, 2.9, 3), taper([[x, y - 1.5], [x, y + 4], [x, y + 10]], [4.4, 3.2, 0.4]), wing(-1), wing(1)), '#fffbea');
    }
    // wheat in the foreground, taller at the edges
    const R = rng(515);
    const wheat = [];
    for (let x = -8; x < 310; x += 4 + R() * 6) {
      const edge = x < 70 || x > 250, hh = (edge ? 22 : 9) + R() * (edge ? 30 : 15), lean = (R() - 0.5) * 12;
      const top = [x + lean, 214 - hh], len = Math.hypot(lean, hh), ux = lean / len, uy = -hh / len;
      wheat.push(taper([[x, 216], [x + lean * 0.4, 214 - hh * 0.5], top], [1.6, 1.1, 0.6], { per: 4 }));
      if (R() < 0.55) wheat.push(taper([[top[0] - ux, top[1] - uy], [top[0] + ux * 4, top[1] + uy * 4], [top[0] + ux * 9, top[1] + uy * 9]], [1.4, 2.6, 0.3], { per: 4 }));
    }
    s.path(U(wheat), '#1d1610');
    s.add(particles({ seed: 516, n: 22, x: [128, 198], y: [60, 178], r: [0.5, 1.4], fill: '#fff1c4', cls: 'rise', t: [4, 8], op: [0.5, 1] }));
    return s.svg();
  },

  // Low angle: the captain on a rock, sword up, the gonfalon blazing behind
  // her; the army's fists and spears below.
  rally(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#90a9be'], [0.45, '#dbca9e'], [0.8, '#f6d595'], [1, '#ecb877']]));
    s.glow(150, 66, 180, '#fff0c2', 0.8);
    s.add(rays({ cx: 150, cy: 66, from: -180, to: 180, n: 22, len: 320, spread: 2.4, color: '#fff8de', op: 0.2, seed: 521 }));
    s.path(ridge({ seed: 522, base: 172, amp: 16, freq: 2.2 }), '#c6ad85');
    s.path(ridge({ seed: 523, base: 186, amp: 12, freq: 2.8 }), '#937a57');
    // the rock she stands on
    s.path(poly([[112, 214], ...spline([[118, 186], [128, 166], [146, 155], [168, 151], [192, 148], [212, 152], [228, 164], [240, 186]], 6), [246, 214]]), '#3d3022');
    // the gonfalon, lit through by the sun
    const gon = poly([[122, 33], [166, 33], [165.5, 58], [162, 84], [158, 103], [155, 112], [146, 98], [137, 123], [129, 98], [114, 113], [118, 88], [120.5, 60]]);
    s.path(gon, s.rad([[0, '#fff4d0'], [0.55, '#f5c766'], [1, '#d48d3c']], { cx: 0.5, cy: 0.4, r: 0.65 }), 'opacity=".96"');
    s.add(`<path d="${taper([[133, 35], [132, 62], [130, 96]], [5, 8, 4])}" fill="#a86424" opacity=".18"/>` +
      `<path d="${taper([[154, 35], [154, 62], [151, 96]], [5, 8, 4])}" fill="#a86424" opacity=".18"/>`);
    s.add(`<g stroke="#a3652a" stroke-width="1.5" fill="none" opacity=".6"><circle cx="144" cy="52" r="6.5"/><path d="${
      Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(144 + Math.cos(a) * 9)},${f1(52 + Math.sin(a) * 9)}L${f1(144 + Math.cos(a) * 12.5)},${f1(52 + Math.sin(a) * 12.5)}`; }).join('')}"/></g>`);
    // the captain
    const cap = U(
      taper([[155, 118], [151, 134], [147, 148]], [8.4, 6.8, 5.4]),
      taper([[167, 118], [173, 133], [178, 147]], [8.4, 6.8, 5.4]),
      ell(145, 150, 6.2, 2.5), ell(181, 149, 6.2, 2.5),
      poly([[151, 111], [171, 111], [175, 125], [147, 125]]),
      taper([[161, 90], [161, 101], [161, 114]], [17, 13, 14]),
      taper([[162, 82], [162, 91]], 5),
      ell(162.5, 78, 6.6, 7.2),
      ell(163, 75, 7.8, 6.6),
      blob([[169.5, 71], [168, 63.5], [162, 60], [155.5, 62.5], [153, 69], [157, 69], [162, 66.5], [166, 68]]),
      taper([[165, 79.5], [170.5, 81]], [2.4, 1.4]),
      taper([[169, 92], [178, 80], [184, 65]], [5.6, 4.8, 4]),
      ell(184.5, 63, 3.4, 3.4),
      taper([[178, 60], [191, 58.5]], 2.4),
      taper([[185.5, 59], [190, 36], [193, 18]], [3.4, 3, 0.5]),
      taper([[155, 94], [149, 101], [145, 107]], [5.6, 4.8, 4.4]),
      ell(144.5, 107.5, 3.2, 3.4),
      taper([[143.5, 152], [144, 90], [144.5, 30]], [2.6, 2.4, 2.2]),
      poly([[142, 31], [144.5, 20], [147, 31]]),
      taper([[120, 31], [169, 31]], 2.2), ell(119, 31, 2, 2), ell(170, 31, 2, 2),
    );
    s.figure(`<path d="${cap}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.8], [1.2, -0.8], [0, -1.4]], rimOp: 0.95 });
    s.glow(193, 18, 14, '#fff6d6', 0.9, 'breathe');
    s.path(glint(193, 18, 8), '#fffbea');
    // the army below: fists and spears
    const R = rng(524);
    const crowd = [];
    for (let i = 0; i < 15; i++) {
      const x = -8 + i * 22.5 + (R() - 0.5) * 8, y = 196 + R() * 7, side = R() < 0.5 ? -1 : 1;
      crowd.push(ell(x, y, 6.4, 7.2), ell(x, y - 4.5, 7, 5.2), ell(x, y - 2, 10.5, 1.9), ell(x, y + 16, 16, 11));
      if (R() < 0.6) {
        const hx = x + side * (10 + R() * 5), hy = y - 24 - R() * 10;
        crowd.push(taper([[x + side * 9, y + 9], [x + side * 12, y - 6], [hx, hy]], [6, 5, 4.4]), ell(hx, hy - 2.5, 4.2, 4.6));
      }
      if (R() < 0.65) {
        const bx = x - side * 11, centre = bx > 110 && bx < 215, ty = centre ? 160 + R() * 8 : 128 + R() * 22, tx = bx + (R() - 0.5) * 14;
        crowd.push(taper([[bx, 216], [tx, ty]], [2.2, 1.8]), poly([[tx - 2.2, ty + 1], [tx, ty - 9], [tx + 2.2, ty + 1]]));
      }
    }
    s.figure(`<path d="${U(crowd)}"/>`, { fill: '#1d150e', rim: '#f0d9a0', offsets: [[0, -1.1]], rimOp: 0.55 });
    s.add(particles({ seed: 525, n: 18, x: [40, 260], y: [20, 170], r: [0.5, 1.3], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // An old man leaning into the wind on a hilltop, the standard streaming
  // out over his head with the low sun burning through its tails.
  'standard-keeper'(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#7c96ab'], [0.4, '#c6c1a5'], [0.75, '#f0d49b'], [1, '#e4b677']]));
    s.glow(236, 78, 160, '#fff1c4', 0.75);
    s.add(rays({ cx: 236, cy: 78, from: -180, to: 180, n: 16, len: 300, spread: 2, color: '#fff8de', op: 0.15, seed: 531 }));
    s.add('<circle cx="236" cy="78" r="14" fill="#fff6dc"/>');
    // cloud streaks racing with the wind
    s.add(`<g fill="#f8eed2">${[[58, 40, 46, 4.5, 0.45], [196, 26, 56, 4, 0.4], [128, 112, 40, 3, 0.35], [262, 120, 44, 3.5, 0.4], [30, 96, 34, 2.6, 0.3]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    s.path(ridge({ seed: 532, base: 168, amp: 16, freq: 2.3 }), '#c6ab84');
    s.path(ridge({ seed: 533, base: 184, amp: 10, freq: 3 }), '#9a815e');
    // the standard, streaming right, tattered at the end
    const topE = spline([[73, 24], [100, 18], [130, 28], [160, 20], [190, 30], [216, 24], [238, 33]], 5);
    const botE = spline([[75, 66], [102, 62], [132, 74], [162, 66], [190, 78], [214, 72]], 5);
    const flag = poly([...topE, [258, 37], [233, 46], [254, 57], [227, 59], [246, 74], ...botE.reverse()]);
    s.path(flag, s.lin([[0, '#e2a94f'], [0.55, '#f6cd76'], [1, '#fff0c6']], { x1: 0, y1: 0, x2: 1, y2: 0 }), 'opacity=".97"');
    s.add(`<path d="${taper([[131, 29], [131, 51], [132, 73]], [7, 10, 7])}" fill="#9b5c22" opacity=".2"/>` +
      `<path d="${taper([[191, 31], [190, 54], [190, 77]], [7, 10, 7])}" fill="#9b5c22" opacity=".16"/>`);
    s.add(`<g stroke="#9a6326" stroke-width="1.5" fill="none" opacity=".55"><circle cx="106" cy="43" r="6.5"/><path d="${
      Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(106 + Math.cos(a) * 9)},${f1(43 + Math.sin(a) * 9)}L${f1(106 + Math.cos(a) * 12.5)},${f1(43 + Math.sin(a) * 12.5)}`; }).join('')}"/></g>`);
    // the hill
    const hill = spline([[-10, 198], [30, 190], [70, 181], [102, 178], [136, 179], [176, 186], [226, 196], [310, 206]], 6);
    s.path(poly([...hill, [310, 214], [-10, 214]]), '#2e2318');
    const R = rng(534);
    const grass = [];
    for (let x = -6; x < 310; x += 4 + R() * 5) {
      const y = yAt(hill, x) + 1, h = 4 + R() * 7;
      grass.push(taper([[x, y], [x + h * 0.5, y - h * 0.7], [x + h * 1.1, y - h * 0.9]], [1.8, 1, 0.3]));
    }
    s.path(U(grass), '#2e2318');
    // the keeper
    const keeper = U(
      taper([[106, 145], [97, 160], [89, 174]], [8.5, 6.8, 5.6]),
      taper([[113, 145], [119, 160], [123, 175]], [8.5, 6.8, 5.6]),
      ell(86, 176.5, 6.4, 2.6), ell(126, 177, 6, 2.6),
      taper([[99, 118], [105, 132], [110, 147]], [15, 16, 14]),
      // cowl, its point blown back; a nose and a beard out front
      blob([[85, 112], [84.5, 104], [80, 97], [85, 91], [94, 87], [104, 88], [112, 93], [119, 101], [113, 105], [112, 113], [104, 119], [93, 118]], 5),
      taper([[86.5, 110], [83, 117.5], [80.5, 126]], [8.5, 5.5, 0.6]),
      // both hands on the pole, below the beard
      taper([[99, 124], [89, 134], [78, 140]], [6, 5, 4.4]),
      taper([[102, 132], [92, 148], [80, 154]], [6, 5, 4.4]),
      // cloak billowing off his back, hem above the knees
      blob([[104, 112], [120, 107], [138, 111], [156, 119], [167, 127], [157, 130], [160, 136], [146, 137], [136, 143], [124, 141], [114, 138], [108, 124]], 5),
      taper([[80, 184], [77, 100], [73, 22]], [2.8, 2.5, 2.2]),
      poly([[70.8, 23], [72.8, 10], [75.2, 23]]),
    );
    s.figure(`<path d="${keeper}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.3, -0.8], [0.4, -1.3]], rimOp: 0.95 });
    s.glow(72.8, 14, 9, '#ffe6a6', 0.8);
    // wind
    s.add(`<g stroke="#fff6dc" stroke-width=".7" fill="none" opacity=".55">${[[20, 132, 40], [150, 150, 52], [214, 120, 36], [36, 72, 30]].map(([x, y, l]) =>
      `<path class="drift" d="M${x},${y}q${l / 2},-3 ${l},0"/>`).join('')}</g>`);
    s.add(particles({ seed: 535, n: 16, x: [40, 270], y: [40, 175], r: [0.5, 1.2], fill: '#fff6d8', cls: 'float', t: [4, 7], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A shield wall running off into the distance, light breaking through a
  // hole in the storm onto it.
  'stand-together'(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#7d8794'], [0.4, '#cdc2a3'], [0.7, '#efd79e'], [1, '#c99c64']]));
    s.glow(170, 14, 170, '#fff1c4', 0.9);
    s.add(rays({ cx: 170, cy: 4, from: 52, to: 128, n: 12, len: 260, spread: 3, color: '#fff4cc', op: 0.3, seed: 541 }));
    // the storm breaking: two banks of cloud pulled apart, lit along the tear
    const puffs = (list) => U(list.map(([x, y, r]) => ell(x, y, r * 1.25, r)));
    const left = puffs([[40, -20, 64], [-4, 52, 22], [24, 60, 17], [50, 54, 19], [78, 58, 16], [104, 46, 17], [126, 30, 15], [140, 12, 13]]);
    const right = puffs([[262, -20, 64], [198, 12, 13], [212, 32, 15], [236, 46, 18], [262, 56, 19], [290, 50, 21], [308, 62, 17]]);
    s.figure(`<path d="${left}"/>`, { fill: '#4d5565', rim: '#ffe2a6', offsets: [[1.8, 0.6], [0.6, 1.8]], rimOp: 0.85 });
    s.figure(`<path d="${right}"/>`, { fill: '#4d5565', rim: '#ffe2a6', offsets: [[-1.8, 0.6], [-0.6, 1.8]], rimOp: 0.85 });
    s.glow(170, 10, 34, '#fffaf0', 0.9, 'breathe');
    s.path(ridge({ seed: 542, base: 154, amp: 10, freq: 2.4 }), '#8d887c');
    s.path('M-10,214L-10,154L310,154L310,214Z', s.lin([[0, '#6c604b'], [1, '#2e251a']]));
    s.add('<ellipse cx="176" cy="158" rx="80" ry="7" fill="#f6dc9e" opacity=".55"/>');
    // the wall: each knight's shield overlapping the next
    const row = [[74, 196, 1], [108, 186, 0.84], [137, 178, 0.71], [161, 171, 0.6], [181, 166, 0.51], [198, 162, 0.43], [212, 159, 0.37], [224, 157, 0.32], [234, 155.5, 0.28], [243, 154.5, 0.24]];
    const wall = U(row.map(([x, y, k]) => knight(x, y, k)));
    s.figure(`<path d="${wall}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.5], [-0.8, -1], [0.8, -1]], rimOp: 0.95 });
    s.path(dots(row.map(([x, y, k]) => [x - 6 * k, y - 56 * k, 2.6 * k])), '#e9c779');
    s.glow(68, 140, 9, '#ffd77a', 0.6);
    s.path('M-10,214L-10,200C70,197 150,199 220,201C260,202 290,200 310,201L310,214Z', '#241b12');
    s.add(particles({ seed: 543, n: 18, x: [120, 230], y: [40, 160], r: [0.5, 1.2], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // The captain against the rising sun; two soldiers of light take shape
  // on either side of her.
  'dawn-captain'(s) {
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#7d98b3'], [0.4, '#d6c8a3'], [0.7, '#f7d797'], [1, '#efb672']]));
    s.glow(150, 132, 180, '#fff1c4', 0.85);
    s.add(rays({ cx: 150, cy: 132, from: -180, to: 0, n: 18, len: 300, spread: 2.2, color: '#fff8de', op: 0.2, seed: 561 }));
    s.add('<circle cx="150" cy="132" r="36" fill="#fff6dc"/>');
    s.path(poly([...spline([[-10, 112], [20, 96], [48, 110], [76, 104], [104, 128], [126, 150], [150, 160], [176, 150], [198, 126], [226, 100], [256, 108], [284, 92], [310, 100]], 6), [310, 214], [-10, 214]]), '#8b7b6a');
    const ridgeL = spline([[-10, 196], [40, 188], [90, 182], [124, 172], [150, 167], [176, 172], [210, 182], [260, 190], [310, 196]], 6);
    s.path(poly([...ridgeL, [310, 214], [-10, 214]]), '#3a2d20');
    // the spirits, forming out of motes
    const ghost = s.lin([[0, '#ffffff', 1], [0.5, '#fff0c0', 0.85], [1, '#ffd77a', 0]]);
    const edge = s.lin([[0, '#ffffff', 1], [0.7, '#fff6d8', 0.7], [1, '#fff6d8', 0]]);
    for (const x of [84, 216]) s.glow(x, 140, 46, '#fff1c4', 0.75, 'breathe');
    const spL = U(soldier(84, 183, 0.92));
    const sp = spL + mirror(spL);
    s.path(sp, ghost);
    s.add(`<path d="${sp}" fill="none" stroke="${edge}" stroke-width=".8"/>`);
    s.add(particles({ seed: 562, n: 14, x: [58, 112], y: [100, 190], r: [0.5, 1.4], fill: '#fff4cc', cls: 'float', t: [4, 7], op: [0.5, 1] }));
    s.add(particles({ seed: 563, n: 14, x: [188, 242], y: [100, 190], r: [0.5, 1.4], fill: '#fff4cc', cls: 'float', t: [4, 7], op: [0.5, 1] }));
    // the captain, sword planted
    const cap = U(
      taper([[145, 128], [142, 148], [140, 165]], [10, 8, 6.4]),
      taper([[156, 128], [159, 148], [161, 165]], [10, 8, 6.4]),
      ell(138, 167, 6.8, 2.8), ell(163.5, 167, 6.8, 2.8),
      poly([[139, 116], [161, 116], [167, 133], [133, 133]]),
      taper([[150, 88], [150, 102], [150, 118]], [21, 15, 17]),
      ell(139.5, 91, 7.6, 5.6, -18), ell(160.5, 91, 7.6, 5.6, 18),
      taper([[150, 79], [150, 89]], 6),
      ell(150.5, 74, 7, 7.6),
      ell(151, 70.5, 8, 6.8),
      taper([[149, 64.5], [154, 60], [161, 59], [167, 62]], [4.4, 4.2, 2.8, 0.6]),
      taper([[140, 95], [137, 108], [146, 123]], [6.2, 5.2, 4.6]),
      taper([[160, 95], [163, 108], [154, 123]], [6.2, 5.2, 4.6]),
      ell(150, 124, 5.6, 3.6),
      taper([[139, 129], [161, 129]], 2.6),
      taper([[150, 129], [150, 150], [150, 167]], [3.6, 3, 0.6]),
      taper([[159, 88], [174, 102], [186, 124], [192, 150]], [8, 16, 19, 11]),
    );
    s.figure(`<path d="${cap}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.3, -0.6], [1.3, -0.6], [0, -1.4]], rimOp: 1 });
    // gold trim
    s.add('<path d="M132.5,93Q139,86 146.5,89M153.5,89Q161,86 167.5,93M143.5,72.5Q151,70 158.5,72.5M150,93V112M139.5,117.5H160.5" stroke="#ffd77a" stroke-width="1" fill="none" stroke-linecap="round"/>');
    s.add(particles({ seed: 564, n: 14, x: [40, 260], y: [30, 120], r: [0.5, 1.1], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.4, 0.8] }));
    return s.svg();
  },

  // Night: lights pour up out of a valley; one figure on a crag watches.
  'a-thousand-lights'(s) {
    s.rect(s.lin([[0, '#0e1330'], [0.45, '#1e2647'], [0.75, '#3b3c58'], [1, '#6e5e55']]));
    s.add(particles({ seed: 571, n: 36, x: [0, W], y: [0, 120], r: [0.3, 0.9], fill: '#eef0ff', cls: 'twinkle', op: [0.3, 0.9], t: [2.5, 6] }));
    s.path(poly([...spline([[-10, 92], [22, 78], [52, 96], [84, 116], [116, 142], [146, 160], [168, 166], [192, 158], [222, 134], [252, 108], [278, 84], [310, 76]], 6), [310, 214], [-10, 214]]), '#262a46');
    s.glow(168, 172, 110, '#ffcf7a', 0.45);
    s.add('<ellipse cx="170" cy="110" rx="64" ry="100" fill="' + s.rad([[0, '#ffe2a0', 0.3], [1, '#ffe2a0', 0]]) + '"/>');
    // the lights: a river of them, thinning as they climb
    const R = rng(572);
    const small = [], big = [];
    for (let i = 0; i < 160; i++) {
      const y = 188 - 176 * Math.pow(R(), 1.3), up = 188 - y;
      small.push([168 + Math.sin(up / 26) * 10 + (R() + R() - 1) * (12 + up * 0.72), y, 0.4 + R() * 0.8]);
    }
    for (let i = 0; i < 28; i++) {
      const y = 186 - 150 * Math.pow(R(), 1.2), up = 186 - y;
      big.push([168 + Math.sin(up / 26) * 10 + (R() + R() - 1) * (10 + up * 0.45), y, 1.1 + R() * 1]);
    }
    s.path(dots(small), '#ffe6a8', 'opacity=".85"');
    s.path(dots(big), '#fff6dc');
    s.glow(168, 160, 40, '#fff0c0', 0.5, 'breathe');
    s.add(particles({ seed: 573, n: 30, x: [118, 222], y: [60, 190], r: [0.6, 1.6], fill: '#fff1c4', cls: 'rise', t: [5, 10], op: [0.5, 1] }));
    s.path(poly([...spline([[-10, 140], [40, 146], [92, 166], [130, 182], [168, 190], [206, 182], [246, 162], [280, 150], [310, 144]], 6), [310, 214], [-10, 214]]), '#171a2c');
    // the crag and the one who watches
    s.path(poly([[-10, 214], [-10, 150], [30, 148], [66, 152], [92, 150], [104, 156], [110, 166], [106, 182], [118, 214]]), '#0c0b13');
    const watcher = U(
      taper([[79, 128], [77, 140], [76, 150]], [6.4, 5.4, 4.6]),
      taper([[85, 128], [87, 140], [89, 150]], [6.4, 5.4, 4.6]),
      ell(75, 151.5, 4.6, 2), ell(90, 151.5, 4.6, 2),
      taper([[82, 104], [82, 117], [82, 131]], [12.5, 11.5, 13]),
      // hood, peak trailing back
      blob([[77, 97], [78, 89], [84, 85.5], [89.5, 89], [90, 96], [87, 101.5], [80, 103]]),
      poly([[79, 89], [71, 93], [77, 97]]),
      // cloak hanging down the back, stirring in the updraught
      poly([[78, 99], [86, 101], [84, 114], [79, 126], [74, 137], [66, 141], [69, 128], [72, 113]]),
      taper([[95, 153], [94, 110], [93, 84]], [2, 1.8, 1.6]),
      taper([[87, 105], [92, 113], [94, 118]], [3.8, 3.2, 3]),
    );
    s.figure(`<path d="${watcher}"/>`, { fill: '#0c0b13', rim: '#ffe2a0', offsets: [[1.2, -0.4], [0.6, -1]], rimOp: 0.9 });
    return s.svg();
  },
};
