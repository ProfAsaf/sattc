// Card art for the five Champions, one hero per faction (they live in the
// CHAMPIONS export of cards.js, not in CARDS). Style rules live in
// ../scenes.js; drawing tools in ../kit.js. Each is one strong standing
// figure with one thing it holds up to the light.

import { H, W, blob, particles, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL } from './shared.js';

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

// Rotate a polygon path; carry a figure drawn at the origin to (x, y) at scale k.
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const at = (x, y, k) => (d) => d.replace(NUM, (_, a, b) => `${f1(x + a * k)},${f1(y + b * k)}`);

// A smooth edge (hill, crag, shore) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);

// A four-point glint.
const glint = (x, y, r, k = 0.18) => poly([[x, y - r], [x + r * k, y - r * k], [x + r, y], [x + r * k, y + r * k],
  [x, y + r], [x - r * k, y + r * k], [x - r, y], [x - r * k, y - r * k]]);

// A painted sun: ring and eight short rays, as one stroked path.
const sunMark = (x, y, r) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0` +
  Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(x + Math.cos(a) * r * 1.45)},${f1(y + Math.sin(a) * r * 1.45)}L${f1(x + Math.cos(a) * r * 2)},${f1(y + Math.sin(a) * r * 2)}`; }).join('');

// A lens-shaped leaf centred on (x, y), `l` long, turned `a` degrees;
// leafAt() grows the same shape out of a point instead.
const lens = (x, y, l, a, w = 0.38, per = 4) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], per), x, y, a);
const leafAt = (x, y, a, l, w = 0.38, per = 4) => lens(x + (Math.cos(rad(a)) * l) / 2, y + (Math.sin(rad(a)) * l) / 2, l, a, w, per);

// A tongue of flame that leaves (x, y) heading a0 degrees and bends round to
// a1 as it goes, `L` long; `w` is a width per step (6 steps).
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

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// A small winged spirit (the Spirit token's shape), centred on its chest.
function sprite(x, y, k = 1) {
  const X = (dx) => x + dx * k, Y = (dy) => y + dy * k;
  const wing = (d) => taper([[X(d * 1.6), Y(-1.5)], [X(d * 6), Y(-6)], [X(d * 11), Y(-9.5)], [X(d * 14.5), Y(-9)]], [3.2 * k, 4.4 * k, 2.6 * k, 0.4 * k], { per: 4 });
  return U(ell(X(0), Y(-5.5), 3 * k, 3.1 * k, 0, 14), taper([[X(0), Y(-2.2)], [X(0), Y(3.5)], [X(0), Y(10)]], [4.6 * k, 3.4 * k, 0.4 * k], { per: 4 }), wing(-1), wing(1));
}

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

// A head in profile looking right, centred on the skull: brow, nose, mouth,
// chin. `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);

// Grave markers standing on a baseline b, leaning a degrees.
const lean = (d, x, b, a) => (a ? `<path d="${d}" transform="rotate(${a} ${x} ${b})"/>` : `<path d="${d}"/>`);
const cross = (x, b, h, a = 0) => {
  const t = h * 0.075;
  return lean(`M${f1(x - t)},${b}V${f1(b - h)}H${f1(x + t)}V${b}ZM${f1(x - h * 0.28)},${f1(b - h * 0.76)}h${f1(h * 0.56)}v${f1(t * 1.9)}h${f1(-h * 0.56)}Z`, x, b, a);
};
const stone = (x, b, w, h, a = 0) => {
  const r = w / 2;
  return lean(`M${f1(x - r)},${b}V${f1(b - h + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(b - h + r)}V${b}Z`, x, b, a);
};

// A rolled scroll, glowing pale.
const scroll = (x, y, a, k = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${a}) scale(${k})">` +
  '<rect x="-8" y="-3.2" width="16" height="6.4" rx="1" fill="#fbfaee"/>' +
  '<rect x="-10.6" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d8dcc4"/><rect x="7.2" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d8dcc4"/>' +
  '<path d="M-5.5,-1h11M-5.5,1.2h8" stroke="#9fb4b0" stroke-width=".5"/></g>';

// A small fish swimming along `a` degrees: body and forked tail.
const fish = (x, y, l, a) => rot(U(lens(x, y, l, 0, 0.42, 3), poly([[x - l * 0.42, y], [x - l * 0.78, y - l * 0.24], [x - l * 0.7, y], [x - l * 0.78, y + l * 0.24]])), x, y, a);

export const champions = {
  // RADIANT. Aurelia, the Lightkeeper: a tall armoured woman on a hilltop
  // before sunrise, her lantern of pure light held high over her head, small
  // winged spirits gathering round its glow.
  'champion-radiant'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#26304f'], [0.34, '#4a587e'], [0.62, '#b7a28c'], [0.8, '#f0c98e'], [1, '#e8a868']]));
    s.add(particles({ seed: 9801, n: 18, x: [0, W], y: [0, 70], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the dawn coming up behind the far hills
    s.glow(52, 174, 160, '#ffd9a0', 0.5);
    s.layer(ridge({ seed: 9802, base: 166, amp: 20, freq: 2.2 }), '#857a84', { blur: 0.7 });
    s.haze(146, 172, '#f2c690', 0.36);
    s.path(ridge({ seed: 9803, base: 182, amp: 10, freq: 3 }), '#4f4352');
    s.haze(168, 188, '#e9b886', 0.24);
    const hill = spline([[-10, 204], [40, 198], [90, 194.5], [136, 193.5], [180, 195], [230, 200], [310, 206]], 6);
    s.path(poly([...hill, [310, 214], [-10, 214]]), s.lin([[0, '#2c2230'], [1, '#120d14']]));
    // her lantern's light, over everything
    const fx = 136, fy = 194, place = at(fx, fy, 1);
    const lx = fx + 25, lb = fy - 132;
    s.glow(lx, lb - 12, 160, '#fff0c2', 0.5);
    s.shafts({ cx: lx, cy: lb - 12, from: -180, to: 180, n: 20, len: 250, spread: 2, color: '#fff6dc', op: 0.22, seed: 9804, sd: 2.4 });
    // Aurelia: greaves, plated skirt, breastplate, a braid down her back,
    // one arm straight up with the lantern, the other hand on the pommel of
    // her planted sword, her cloak streaming back
    const her = place(U(
      taper([[-4, -50], [-8, -27], [-11, -3]], [9, 7, 6]),
      taper([[4, -50], [9, -27], [12, -3]], [9, 7, 6]),
      ell(-8, -28, 4.6, 4.2), ell(9, -28, 4.6, 4.2),
      ell(-12.5, -1.6, 5.8, 2.3), ell(14, -1.6, 6.2, 2.3),
      poly([[-9.5, -66], [9.5, -66], [13, -43], [6.5, -45.5], [0, -42], [-6.5, -45.5], [-13, -43]]),
      taper([[0, -62], [0, -76], [0.5, -89]], [15, 15.5, 19]),
      ell(-10, -88, 7.6, 5.8, -16), ell(10.5, -88, 7.6, 5.8, 16),
      taper([[0.5, -92], [1.6, -97]], 5.4, { per: 2 }),
      profile(1.8, -103, 1.05, -30),
      taper([[-4, -102], [-7, -95], [-9, -86], [-10, -76], [-12, -67]], [7, 6.4, 5, 3.6, 1.2]),
      taper([[11, -89], [16, -98], [20, -107]], [7.4, 6.6, 6]), taper([[20, -107], [23, -117], [24.6, -126]], [6, 5.6, 5]),
      ell(25, -128.5, 3.8, 4),
      taper([[-10, -87], [-15, -75], [-17.5, -63], [-18.5, -52]], [6.6, 5.8, 5.2, 4.6]), ell(-18.5, -49.5, 3.8, 3.4),
      ell(-18.5, -54, 2.3, 2.3), taper([[-26, -44.5], [-11, -44.5]], 2.6, { per: 2 }),
      taper([[-18.5, -44], [-18.5, -22], [-18.5, -1]], [3.8, 3.4, 0.6]),
      blob([[-6, -94], [-16, -92], [-28, -86], [-40, -76], [-49, -63], [-55, -49], [-57, -36], [-51, -39], [-46, -31], [-40, -37], [-34, -30], [-29, -40], [-23, -55], [-15, -72], [-9, -86]], 4),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [0.2, -1] });
    s.add(`<path d="${place('M-16,-90Q-10,-95 -4,-91M5,-91Q11,-95 17,-90M0.5,-85L0.5,-67M-9.5,-65L9.5,-65M-12.5,-44L-6.5,-45.5L0,-42.5L6.5,-45.5L12.5,-44')}" fill="none" stroke="#ffd77a" stroke-width="1" stroke-linecap="round" opacity=".85"/>` +
      `<path d="${sunMark(fx + 0.5, fy - 77, 3)}" fill="none" stroke="#ffd77a" stroke-width=".9"/>`);
    // the lantern, all light
    s.add('<g data-part="halo">'); s.glow(lx, lb - 12, 50, '#fffaf0', 0.85); s.add('</g>');
    const lamp = at(lx, lb, 1.3);
    s.bloom(`<g data-part="lantern"><path d="${lamp('M-5,0L5,0L3.6,-2.4L-3.6,-2.4Z')}" fill="${p.fig}"/>` +
      `<path d="${lamp('M-4.2,-2.4L4.2,-2.4L4.2,-16.4L-4.2,-16.4Z')}" fill="#fffdf4"/>` +
      `<path d="${lamp('M-5,-16.4L5,-16.4L2.6,-19.6L-2.6,-19.6Z')}" fill="${p.fig}"/>` +
      `<circle cx="${f1(lx)}" cy="${f1(lb - 22 * 1.3)}" r="2.8" fill="none" stroke="${p.fig}" stroke-width="1.4"/>` +
      `<path d="${glint(lx, lb - 12, 16, 0.12)}" fill="#ffffff"/></g>`, { sd: 2.4, k: 1.6, box: [lx - 50, lb - 70, 100, 96] });
    // the spirits, gathering
    const sp = [[123, 44, 0.5], [133, 20, 0.42], [165, 13, 0.46], [195, 26, 0.5], [204, 54, 0.44], [191, 80, 0.38], [119, 72, 0.36], [103, 26, 0.34], [219, 38, 0.3]];
    for (const [x, y, k] of sp) s.glow(x, y - 2, 6 + 15 * k, '#fff1c4', 0.7);
    for (let g = 0; g < 3; g++) {
      s.path(U(sp.filter((_, i) => i % 3 === g).map(([x, y, k]) => sprite(x, y, k))), '#fffcf0', `class="float" style="--t:${5 + g * 1.5}s;--d:-${g * 2}s"`);
    }
    s.motes({ seed: 9805, n: 18, x: [96, 220], y: [10, 110], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 9806, n: 10, x: [30, 270], y: [90, 190], r: [0.5, 1.1], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.3, 0.7] }));
    return s.svg();
  },

  // EMBER. Pyra, Herald of Ash: a herald in scorched robes on a black crag,
  // blowing a long curved horn; fire and sparks pour out of its bell across
  // the red sky.
  'champion-ember'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#1e0605'], [0.3, '#4e130a'], [0.58, '#9a3414'], [0.78, '#d0622a'], [1, '#e48a3e']]));
    s.glow(150, 196, 190, '#ff7a2e', 0.4);
    // long banks of smoke lying across the sky
    s.add(`<g fill="#2a0a06">${[[60, 30, 90, 7, 0.45], [40, 64, 70, 5, 0.3], [250, 126, 80, 5, 0.3], [150, 12, 120, 6, 0.35]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    // the far peaks, lava glowing in the valley under them
    s.layer(ridge({ seed: 9812, base: 168, amp: 44, peaks: true, freq: 2.4 }), '#5a1d10', { blur: 0.7 });
    s.haze(140, 176, '#ff8a3a', 0.3);
    s.path(ridge({ seed: 9813, base: 186, amp: 14, freq: 3 }), '#2a0c07');
    s.add(`<ellipse cx="236" cy="184" rx="90" ry="7" fill="${s.rad([[0, '#ffb04a', 0.7], [0.5, '#ff7a2e', 0.35], [1, '#ff7a2e', 0]])}"/>`);
    // the crag she stands on
    s.figure(`<path d="${ledge([[30, 214], [48, 198], [70, 192], [100, 190], [126, 191], [148, 196], [164, 206], [172, 214]])}"/>`,
      { fill: '#160604', rim: '#ff9447', offsets: [[0, -1.2], [1, -0.6]], rimOp: 0.8, shade: 0.5 });
    // Pyra: a stride, robe burnt ragged at the hem and streaming back, hood
    // fallen, both hands on the long horn
    const fx = 100, fy = 191, K = 1.05, place = at(fx, fy, K);
    const her = place(U(
      taper([[3, -38], [9, -21], [13, -3]], [6.4, 5.2, 4.2]),
      taper([[-3, -38], [-8, -21], [-12, -3]], [6.4, 5.2, 4.2]),
      ell(14.5, -1.4, 5, 2), ell(-13, -1.4, 4.6, 2),
      blob([[-7, -90], [7, -90], [10, -76], [12, -60], [15, -46], [19, -33], [12, -30], [8, -35], [2, -30], [-4, -35], [-10, -29], [-17, -34], [-25, -30], [-33, -37], [-27, -46], [-22, -60], [-16, -74], [-11, -86]], 4),
      ell(0, -88, 10, 6), ell(-5, -91, 7.5, 4.6, -10),
      taper([[1.5, -91], [3, -96]], 5, { per: 2 }),
      profile(3.6, -102, 1, -8),
      taper([[-2, -107], [-10, -106], [-18, -102], [-25, -100], [-32, -95]], [8, 7.4, 6, 3.8, 0.6]),
      taper([[-3, -102], [-10, -99], [-16, -94], [-22, -91]], [7, 6, 4.4, 0.6]),
      taper([[-2, -98], [-7, -93], [-11, -87]], [5.6, 4.4, 0.6]),
      taper([[5, -87], [15, -84], [25, -99]], [6, 5, 4.4]), ell(26, -100.5, 3.2, 3),
      taper([[-3, -87], [6, -93], [14, -98]], [5.6, 4.8, 4]),
      taper([[9.5, -99], [26, -100], [42, -102], [57, -105], [70, -110], [82, -117]], [2.4, 3, 3.8, 4.8, 6.4, 9]),
      poly([[84.3, -113.1], [93.4, -113.2], [84.4, -128.8], [79.7, -120.9]]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: '#ffb04a', offsets: [[1.2, -0.8], [0.5, -1.2], [-0.8, -0.8]], rimOp: 0.95, shade: 0.5, edge: 0.32, light: [1, -0.7] });
    s.add(`<path d="${place('M14,-99.5L30,-100.5M44,-102.5L58,-105.5')}" stroke="#ff9447" stroke-width=".8" opacity=".55"/>`);
    // the plume: fire pouring out of the bell and away across the sky; the
    // burnt hem still glowing
    const [bx, by] = [fx + 88.9 * K, fy - 121 * K];
    s.glow(bx + 54, by - 10, 130, '#ff9a3a', 0.5);
    const fire = s.radU(bx, by, 140, [[0, '#fff6d8'], [0.12, '#ffe08a'], [0.38, '#ffa040', 0.95], [0.7, '#ff6a1f', 0.8], [1, '#d23c14', 0.25]]);
    const tongues = [
      plume(bx, by, -30, 8, 122, [10, 24, 34, 28, 16, 6, 0.5]),
      plume(bx + 2, by - 2, -44, -20, 108, [8, 17, 22, 15, 6, 0.4]),
      plume(bx + 3, by + 2, -18, 24, 100, [8, 15, 18, 12, 4, 0.4]),
      plume(bx, by, -58, -50, 70, [6, 12, 10, 4, 0.4]),
      plume(bx + 4, by + 4, -6, 40, 62, [5, 10, 9, 4, 0.4]),
    ].join('');
    const hem = place('M19,-33L12,-30L8,-35L2,-30L-4,-35L-10,-29L-17,-34L-25,-30L-33,-37');
    s.bloom(`<g data-part="plume"><path d="${tongues}" fill="${fire}"/>` +
      `<path d="${plume(bx, by, -30, -6, 62, [5, 11, 10, 4, 0.4]) + plume(bx + 2, by, -20, 12, 48, [4, 7, 6, 3, 0.4])}" fill="${s.linU(bx, by, bx + 60, by - 14, [[0, '#ffffff'], [0.5, '#fff4d2', 0.95], [1, '#ffe08a', 0.4]])}"/>` +
      `</g><path d="${hem}" fill="none" stroke="#ff7a2e" stroke-width="2.2" stroke-linejoin="round"/><path d="${hem}" fill="none" stroke="#ffd27a" stroke-width=".8" stroke-linejoin="round"/>`, { sd: 2.4, k: 1.4 });
    s.motes({ seed: 9814, n: 34, x: [160, 300], y: [0, 120], r: [0.4, 1.3], fill: '#ffc25a', hot: '#fff6d8', cls: 'rise', t: [3, 7] });
    s.motes({ seed: 9815, n: 16, x: [0, 300], y: [10, 190], r: [0.4, 1], fill: '#ff8a3a', cls: 'rise', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },

  // VERDANT. Old Root, Grove Warden: an ancient tree-giant standing guard at
  // the edge of a sunlit wood, a face in its bark, a shield of woven roots on
  // its arm and a branch for a staff.
  'champion-verdant'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f6efc8'], [0.45, '#e2e3ae'], [1, '#a9be84']]));
    // the sun over the trees at the left, its light slanting through the wood
    s.glow(36, 18, 150, '#fff7d2', 0.9);
    s.add(`<g fill="#d3dbb0">${[[200, 8], [226, 6], [258, 9], [286, 7], [12, 7], [62, 6], [96, 8]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="170"/>`).join('')}</g>`);
    s.layer(woods({ seed: 9821, base: 112, top: 34, r0: 12, r1: 22 }), '#a7bb88', { blur: 0.6 });
    s.add(`<g fill="#88a06c">${[[22, 10], [70, 8], [118, 12], [176, 9], [214, 11], [262, 10], [296, 8]].map(([x, w]) => `<rect x="${x}" y="90" width="${w}" height="80"/>`).join('')}</g>`);
    s.shafts({ cx: 20, cy: -10, from: 28, to: 74, n: 9, len: 330, spread: 2.6, color: '#fffbe2', op: 0.3, seed: 9822, sd: 2.2 });
    s.haze(118, 168, '#f6f4d6', 0.32);
    // the meadow in front of the wood
    s.path('M-10,214L-10,166C60,162 120,164 160,166C220,168 260,163 310,166L310,214Z', s.lin([[0, '#a7bd7c'], [0.5, '#6f8a4c'], [1, '#3f5a2c']]));
    // Old Root, facing us
    const fx = 150, fy = 197, K = 0.86, place = at(fx, fy, K);
    const giant = place(U(
      taper([[-14, -64], [-17, -34], [-21, -2]], [24, 18, 27]),
      taper([[14, -64], [17, -34], [21, -2]], [24, 18, 27]),
      taper([[-28, -6], [-40, -2], [-54, 4]], [10, 6, 1]), taper([[-22, -4], [-26, 2], [-30, 6]], [8, 5, 1]), taper([[-16, -4], [-12, 2], [-8, 6]], [7, 4, 1]),
      taper([[28, -6], [40, -2], [54, 4]], [10, 6, 1]), taper([[22, -4], [26, 2], [30, 6]], [8, 5, 1]), taper([[16, -4], [12, 2], [8, 6]], [7, 4, 1]),
      taper([[0, -60], [0, -92], [0, -118]], [44, 46, 56]),
      ell(-27, -116, 14, 11, -10), ell(27, -116, 14, 11, 10),
      taper([[-32, -124], [-38, -136], [-36, -146]], [4, 2.6, 0.6]), leafAt(-36, -146, -110, 10, 0.42), leafAt(-37, -138, 190, 9, 0.42),
      taper([[34, -124], [42, -134], [44, -144]], [4, 2.6, 0.6]), leafAt(44, -144, -60, 10, 0.42), leafAt(41, -134, -10, 9, 0.42),
      taper([[0, -118], [0, -136], [0, -150]], [32, 30, 26]),
      taper([[-6, -146], [-14, -160], [-26, -170], [-38, -170]], [8, 6, 3.4, 1]),
      taper([[6, -146], [16, -162], [30, -172], [42, -172]], [8, 6, 3.4, 1]),
      taper([[0, -150], [-2, -166], [3, -182]], [7, 4.4, 1]),
      taper([[-14, -160], [-14, -172], [-10, -180]], [3, 2, 0.6]), taper([[16, -162], [18, -174], [14, -182]], [3, 2, 0.6]),
      leafAt(-38, -170, 190, 12, 0.42), leafAt(-38, -170, 150, 11, 0.42), leafAt(42, -172, -10, 12, 0.42), leafAt(42, -172, 30, 11, 0.42),
      leafAt(3, -182, -70, 12, 0.42), leafAt(3, -182, -120, 10, 0.42), leafAt(-10, -180, -110, 10, 0.42), leafAt(14, -182, -60, 10, 0.42),
      taper([[-32, -114], [-42, -92], [-46, -70]], [14, 11, 9]), ell(-46, -66, 7, 6),
      taper([[-50, 2], [-48, -60], [-46, -120], [-42, -150]], [6, 6.4, 5.6, 3]),
      taper([[-42, -150], [-36, -160], [-30, -164]], [3, 2, 0.6]), leafAt(-30, -164, -30, 10, 0.42),
      taper([[32, -114], [40, -96], [34, -82]], [14, 11, 9]),
    ));
    s.figure(`<path d="${giant}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -1], [0, -1.3], [1, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.6, -1] });
    // bark: a few long seams, and the face in it
    s.add('<g data-part="face">');
    s.add(`<path d="${place('M-12,-104C-9,-90 -14,-78 -10,-64M12,-100C9,-88 14,-76 11,-64M-18,-50C-16,-36 -20,-22 -19,-8M18,-50C16,-36 20,-22 19,-8M-14,-142C-12,-132 -15,-126 -12,-120M14,-142C12,-132 15,-126 12,-120')}" fill="none" stroke="#34482a" stroke-width="1.2" opacity=".8"/>`);
    s.add(`<path d="${place('M-12,-136C-8,-142 -3,-142 -1,-138M12,-136C8,-142 3,-142 1,-138M0,-136C1,-130 1,-126 -1,-122M-7,-120C-3,-118 3,-118 7,-120')}" fill="none" stroke="#5c7a40" stroke-width="1.6" stroke-linecap="round"/>`);
    s.path(place(U(taper([[-8, -118], [-9, -110], [-7, -100]], [4, 3, 0.6]), taper([[-2, -117], [-2, -106], [0, -96]], [4.4, 3.4, 0.6]), taper([[4, -117], [5, -108], [3, -99]], [4, 3, 0.6]), taper([[9, -118], [11, -111], [10, -104]], [3.4, 2.4, 0.5]))), '#3f5a2c');
    s.add('</g>');
    // the shield of woven roots, a green bud at its boss
    const [sx, sy, sr] = [fx + 26 * K, fy - 80 * K, 27];
    s.figure(`<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${sr}"/>`, { fill: '#1e2b15', rim: p.rim, offsets: [[-1, -1], [0.6, -1]], rimOp: 0.9, shade: 0.5 });
    // roots woven over and under each other, bound round with a twisted rim
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><circle cx="${f1(sx)}" cy="${f1(sy)}" r="${sr - 2}" visibility="visible"/></clipPath>`);
    let warp = '', weft = '';
    for (let i = -3; i <= 3; i++) {
      const o = i * 8;
      warp += `M${f1(sx - 30)},${f1(sy + o - 10)}Q${f1(sx)},${f1(sy + o + 8)} ${f1(sx + 30)},${f1(sy + o - 10)}`;
      weft += `M${f1(sx + o - 10)},${f1(sy - 30)}Q${f1(sx + o + 8)},${f1(sy)} ${f1(sx + o - 10)},${f1(sy + 30)}`;
    }
    s.add('<g data-part="weave">');
    s.add(`<g clip-path="url(#${cid})" fill="none" stroke-linecap="round"><path d="${warp}" stroke="#4d6a3a" stroke-width="3.2"/><path d="${weft}" stroke="#3e5830" stroke-width="3.2" stroke-dasharray="5 3"/></g>` +
      `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${sr - 1.4}" fill="none" stroke="#4a6638" stroke-width="3.4" stroke-dasharray="3 1.6"/>`);
    s.path(U([[0, 2], [70, -1], [128, 1], [200, -1], [250, 1], [315, -1]].map(([a, dir]) => {
      const r0 = rad(a);
      return taper([[sx + Math.cos(r0) * (sr - 1), sy + Math.sin(r0) * (sr - 1)], [sx + Math.cos(r0 + dir * 0.12) * (sr + 5), sy + Math.sin(r0 + dir * 0.12) * (sr + 5)], [sx + Math.cos(r0 + dir * 0.3) * (sr + 9), sy + Math.sin(r0 + dir * 0.3) * (sr + 9)]], [3.4, 2, 0.4]);
    })), '#1e2b15');
    s.add('</g>');
    // its eyes and the bud, lit from inside
    const eyes = [[fx - 6.4 * K, fy - 134 * K], [fx + 6.4 * K, fy - 134 * K]];
    s.add('<g data-part="eyeglow">'); for (const [x, y] of eyes) s.glow(x, y, 9, '#ecff9a', 0.9); s.add('</g>');
    s.glow(sx, sy, 16, '#ecff9a', 0.8, 'breathe');
    s.bloom(`<g data-part="eyes"><path d="${eyes.map(([x, y]) => lens(x, y, 6, 0, 0.4)).join('')}" fill="#f7ffc8"/></g>` +
      `<g data-part="bud"><path d="${leafAt(sx, sy + 2, -62, 7, 0.46) + leafAt(sx, sy + 2, -118, 7, 0.46)}" fill="#effcaa"/><circle cx="${f1(sx)}" cy="${f1(sy + 2)}" r="2" fill="#fbffe0"/></g>`, { sd: 1.4, k: 1.6, box: [fx - 50, fy - 150, 110, 110] });
    // grass and flowers at its feet
    const G = rng(9823), blades = [];
    for (let x = -8; x < 310; x += 3 + G() * 5) {
      const edge = x < 70 || x > 230, h = (edge ? 10 : 4) + G() * (edge ? 16 : 7), l = (G() - 0.5) * 8;
      blades.push(taper([[x, 216], [x + l * 0.4, 214 - h * 0.5], [x + l, 214 - h]], [1.8, 1.2, 0.3], { per: 4 }));
    }
    s.path(U(blades), '#2a3d1c');
    s.path(dots([[30, 196, 1.6], [52, 202, 1.4], [246, 198, 1.6], [270, 204, 1.4], [84, 206, 1.2], [216, 207, 1.3]]), '#fff6c8');
    s.motes({ seed: 9824, n: 18, x: [30, 270], y: [20, 170], r: [0.5, 1.2], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  // UMBRAL. Morwen, the Gravekeeper: a cloaked woman leaning on her long
  // spade in the moonlit churchyard; behind her faint violet spirits rise out
  // of the graves.
  'champion-umbral'(s) {
    fin(s, 'umbral');
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#09060f'], [0.42, '#1f1734'], [0.68, '#45346a'], [0.78, '#3a2c58'], [1, '#150f20']]));
    s.add(particles({ seed: 9831, n: 34, x: [0, W], y: [0, 110], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, high on the right
    s.glow(240, 38, 100, '#c9b8f2', 0.42);
    s.add('<circle cx="240" cy="38" r="15" fill="#efe8fa"/><circle cx="235" cy="34" r="3" fill="#d4c8ea" opacity=".6"/><circle cx="245" cy="43" r="2.2" fill="#d4c8ea" opacity=".5"/>');
    // the chapel on its hill, yews, all soft in the mist
    s.blur(`<path d="${ledge([[-10, 146], [50, 140], [110, 143], [170, 139], [230, 142], [310, 138]])}" fill="#2c2246"/>` +
      '<g fill="#2c2246"><path d="M206,142V112L222,100L238,112V142ZM206,112V92L211,76L216,92V112Z"/><ellipse cx="252" cy="126" rx="6" ry="18"/><ellipse cx="266" cy="132" rx="5" ry="13"/><ellipse cx="40" cy="128" rx="5.5" ry="16"/></g>', 0.6);
    s.add('<path d="M226,124V118A2,2 0 0 1 230,118V124Z" fill="#c9a6ff" opacity=".8"/>');
    s.haze(118, 146, '#6a5494', 0.32);
    // the rows of graves behind her, and what is rising out of them
    s.add(`<g fill="#241b38">${stone(44, 160, 12, 18, -5)}${cross(84, 162, 20, 6)}${stone(196, 160, 13, 19, 4)}${cross(232, 162, 22, -7)}${stone(268, 158, 12, 17, 6)}${cross(18, 158, 16, 8)}</g>`);
    // each one a pale head and hooded shoulders, the body thinning to a wisp
    // that still trails down into its grave
    const wisps = [[44, 150, 52, 5], [84, 152, 60, -4], [196, 150, 56, 6], [232, 152, 66, -5], [268, 148, 48, 4], [18, 146, 42, -3]];
    for (const [x, y, h, dx] of wisps) {
      const hx = x + dx, hy = y - h;
      s.glow(hx, hy + 6, 20, '#b48cff', 0.5);
      const g = s.linU(0, y, 0, hy - 4, [[0, '#c9b0f4', 0], [0.5, '#d6c2fa', 0.3], [1, '#efe2ff', 0.7]]);
      s.path(U(taper([[x, y], [x + 4, y - h * 0.32], [x - 3, y - h * 0.62], [hx - 1, hy + 14], [hx, hy + 5]], [0.4, 2.6, 6.4, 10.5, 9]), ell(hx, hy, 3.8, 4.4)),
        g, `class="float" style="--t:${f1(6 + (x % 4))}s;--d:-${f1(x % 5)}s"`);
    }
    s.fog(156, '#9a86c4', 0.3);
    s.glow(146, 104, 80, '#8a6cd0', 0.42);
    // a dead tree at the left edge
    s.figure(`<path d="${U(taper([[8, 216], [12, 160], [6, 112], [14, 60], [8, 4]], [20, 15, 12, 9, 5]),
      taper([[10, 120], [30, 108], [46, 110], [60, 102]], [6, 4, 2.4, 0.6]), taper([[12, 74], [32, 60], [52, 58]], [5, 3.4, 0.6]),
      taper([[10, 36], [26, 26], [40, 28]], [4, 3, 0.5]), taper([[30, 108], [34, 94], [30, 84]], [2.6, 1.6, 0.4]))}"/>`, { fill: '#0d0a16', rim: '#a594dc', offsets: [[1, -0.4]], rimOp: 0.6 });
    // the near ground
    s.path(ledge([[-10, 192], [40, 188], [100, 190], [160, 192], [220, 189], [310, 190]]), s.lin([[0, '#1d1530'], [1, '#08060c']]));
    s.add(`<g fill="#120d1e">${stone(262, 196, 16, 26, 7)}${cross(290, 198, 30, -6)}</g>`);
    // Morwen: a deep hood, her cloak falling behind and trailing on the
    // ground, both hands folded on the grip of her spade
    const fx = 136, fy = 195, K = 1.12, place = at(fx, fy, K);
    // (her upper body is drawn upright, then tipped forward onto the spade)
    const tip = (d) => rot(d, 0, -62, 6);
    const her = place(U(
      taper([[-2, -20], [-3, -10], [-3.5, -3]], [5, 4.4, 3.8]), taper([[5, -20], [6.5, -10], [8, -3]], [5, 4.4, 3.8]),
      ell(-3, -1.3, 4.4, 1.8), ell(10, -1.3, 4.6, 1.8),
      blob([[-8, -66], [8, -66], [11, -44], [14, -18], [15, -7], [6, -5], [-4, -6], [-13, -7], [-12, -18], [-10, -44]], 4),
      tip(U(taper([[0, -62], [1.5, -76], [0.5, -88]], [11.5, 12, 13]),
        ell(0, -88, 9, 5.4),
        blob([[-9, -92], [-5, -104], [3, -110], [11, -107], [15, -97], [13, -88], [4, -85], [-7, -86]], 5),
        taper([[6, -86], [13, -80], [19, -92]], [6, 5, 4.2]),
        taper([[-3, -86], [6, -79], [17, -90]], [5.6, 4.6, 4]),
        ell(19.5, -93.5, 3.6, 3), ell(17, -91, 3.4, 2.8))),
      poly([[-0.8, -102.3], [-9.6, -95.2], [-17, -81.9], [-23, -62], [-27, -42], [-33, -22], [-42, -8], [-56, -1], [-62, 1], [-40, 1], [-22, 0], [-13, -2], [-10, -18], [-9, -42], [-8, -64], [-3.4, -86.5]]),
      taper([[25, -14], [24, -55], [23, -95]], [3, 2.8, 2.6]),
      poly([[20, -16], [30, -16], [30.5, -2], [25, 3], [19.5, -2]]),
    ));
    const grip = `M${f1(fx + 19.8 * K)},${f1(fy - 98.5 * K)}a${f1(3 * K)},${f1(2.6 * K)} 0 1,0 ${f1(6 * K)},0a${f1(3 * K)},${f1(2.6 * K)} 0 1,0 ${f1(-6 * K)},0`;
    s.figure(`<path d="${her}"/><path d="${grip}" fill="none" stroke-width="1.8"/>`, { fill: '#100b1a', rim: '#d6c2fa', offsets: [[1, -0.9], [-1, -0.6], [0, -1.2]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [0.4, -1] });
    // her face in the hood's shadow, pale in the moonlight
    s.path(place(tip(profile(8.4, -96.5, 0.62, 12))), '#cdbfe2');
    s.path(place(tip(blob([[-2, -103], [4, -107.5], [10, -106], [7.5, -102], [5, -97], [4, -90], [0, -88], [-3, -95]], 4))), '#100b1a');
    const [ex, ey] = [10.2, -98.4], c6 = Math.cos(rad(6)), s6 = Math.sin(rad(6));
    s.add(`<circle cx="${f1(fx + (ex * c6 - (ey + 62) * s6) * K)}" cy="${f1(fy + (-62 + ex * s6 + (ey + 62) * c6) * K)}" r=".8" fill="#2a1d48"/>`);
    // mist over the graves, motes
    s.fog(182, '#8f7fc8', 0.3).fog(198, '#7a68b0', 0.34);
    s.motes({ seed: 9832, n: 16, x: [20, 290], y: [70, 180], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.35, 0.85] });
    return s.svg();
  },

  // TIDE. Nim, the Tidecaller: a slender sea-mage on a rock in the surf,
  // one hand raised; behind her a great wave stands up, full of glowing
  // scrolls and silver fish.
  'champion-tide'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#4f8f9a'], [0.25, '#235a69'], [0.6, '#0f3442'], [1, '#071c25']]));
    s.glow(150, -24, 170, '#e3fbfb', 0.55);
    s.add(particles({ seed: 9841, n: 14, x: [0, W], y: [0, 50], r: [0.25, 0.7], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.7], t: [2.5, 6] }));
    // the wave: its back rising from the left, the crest curling over at the
    // top right, light coming through it
    const outer = [[-10, 150], [30, 128], [70, 98], [110, 66], [150, 40], [188, 22], [220, 16], [246, 21], [264, 34], [271, 50], [266, 64]];
    const inner = [[266, 64], [257, 58], [248, 48], [236, 44], [226, 52], [222, 70], [228, 92], [244, 114], [270, 132], [312, 146]];
    const wave = poly([[-10, 214], ...spline([...outer, ...inner.slice(1)], 6), [312, 214]]);
    s.glow(170, 80, 130, '#c6f4f6', 0.4);
    s.figure(`<path d="${wave}"/>`, { fill: s.linU(0, 14, 0, 170, [[0, '#cff3ee'], [0.22, '#8fd2cf'], [0.55, '#3c8a92'], [1, '#174a56']]), rim: '#effaf3', offsets: [[0, -1.5], [-1, -1]], rimOp: 0.9 });
    s.add(`<g fill="none" stroke="#e6faf6" stroke-width="1" opacity=".35"><path d="M40,140C80,110 120,86 168,64C196,52 214,44 230,40M70,150C110,124 150,104 196,90C214,84 222,80 228,74M120,156C150,140 186,128 230,118"/></g>`);
    // what the wave is carrying
    for (const [x, y] of [[66, 122], [104, 92], [204, 54], [236, 104], [176, 112]]) s.glow(x, y, 20, '#f0f8e8', 0.45, 'breathe');
    const fishes = U(fish(46, 136, 11, -24), fish(60, 128, 9, -30), fish(132, 70, 10, -40), fish(146, 82, 8, -34), fish(218, 80, 11, 20),
      fish(250, 92, 9, 40), fish(196, 128, 10, -10), fish(214, 138, 8, -14), fish(90, 112, 9, -28));
    s.bloom(scroll(66, 122, -24, 0.9) + scroll(104, 92, 16, 0.8) + scroll(204, 54, -32, 0.9) + scroll(236, 104, 28, 0.8) + scroll(176, 112, -8, 0.85) +
      `<path d="${fishes}" fill="#e6f1f2"/>` +
      `<path d="M150,40C170,30 190,20 220,16C240,18 256,26 266,38C272,48 270,58 266,64" fill="none" stroke="#f3fcf6" stroke-width="2.4" stroke-linecap="round"/>` +
      `<g fill="#f8fdf9">${[[268, 66, 2.4], [262, 70, 1.8], [256, 64, 1.6], [272, 58, 1.8], [240, 18, 1.6], [208, 15, 1.4], [180, 22, 1.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`, { sd: 1.6, k: 1.25 });
    // the sea in front, the rock, the surf round it
    s.path('M-10,214L-10,160C60,156 120,158 160,160C220,162 260,158 310,160L310,214Z', s.lin([[0, '#2c6a74'], [0.4, '#123c46'], [1, '#04121a']]));
    s.figure(`<path d="${ledge([[96, 214], [104, 194], [114, 182], [130, 176], [152, 174], [172, 177], [186, 186], [196, 198], [202, 214]])}"/>`,
      { fill: '#05131a', rim: p.rim, offsets: [[0, -1.2], [-0.8, -0.8]], rimOp: 0.8, shade: 0.5 });
    s.add('<g fill="none" stroke="#e9f8f2" stroke-linecap="round" opacity=".7"><path d="M78,190q12,-5 24,0M196,194q12,-5 26,0M60,176q10,-3 20,0M214,172q10,-3 22,0" stroke-width="1.4"/><path d="M30,184q8,-3 16,0M252,186q8,-3 18,0" stroke-width="1"/></g>');
    // Nim: slender, robed, hair and hem streaming back, one hand raised
    // into the wave, the other held out low behind her
    const fx = 151, fy = 175, K = 1.12, place = at(fx, fy, K);
    const her = place(U(
      taper([[-2.5, -30], [-4, -15], [-5, -2.5]], [5, 4, 3.2]), taper([[2.5, -30], [5, -15], [7, -2.5]], [5, 4, 3.2]),
      ell(-5, -1.2, 4, 1.6), ell(8.5, -1.2, 4.2, 1.6),
      blob([[-5, -66], [5, -66], [8, -52], [10, -38], [12, -28], [6, -26], [0, -28], [-6, -26], [-14, -27], [-24, -30], [-34, -36], [-22, -42], [-12, -52]], 5),
      taper([[0, -62], [0.5, -74], [-1, -86]], [8.6, 10, 10.4]),
      taper([[-1, -87], [0.5, -92]], [4.4, 4], { per: 2 }),
      profile(1.6, -97.5, 0.95, -34),
      taper([[-4, -102], [-12, -99], [-21, -95], [-30, -93], [-40, -94]], [7, 6.4, 5, 3, 0.5]),
      taper([[3, -85], [9, -99], [13, -112]], [4.8, 4, 3.6]), taper([[13, -112], [15, -121]], [3.6, 3]),
      ell(15.5, -123, 2.8, 3.4, 15),
      taper([[15, -126], [15.4, -131]], [1.4, 0.5], { per: 2 }), taper([[17, -125.5], [18.8, -130]], [1.3, 0.5], { per: 2 }),
      taper([[13.4, -125.5], [12, -129.6]], [1.3, 0.5], { per: 2 }), taper([[18.2, -123.5], [21, -126]], [1.2, 0.4], { per: 2 }),
      taper([[-3, -84], [-12, -75], [-21, -70]], [4.4, 3.6, 3]), taper([[-21, -70], [-27, -68]], [2.8, 0.7], { per: 2 }),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.32, halo: { op: 0.3, sd: 2.6, color: '#c6f4f6' }, light: [0.3, -1] });
    // the light in her raised hand
    const [hx, hy] = [fx + 15.5 * K, fy - 124 * K];
    s.glow(hx, hy, 26, '#e6fdfc', 0.9, 'breathe');
    s.add(`<circle cx="${f1(hx)}" cy="${f1(hy)}" r="2.4" fill="#f6fffe"/>`);
    s.add([[212, 66], [222, 78], [230, 60], [258, 74]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx="1.2" ry="1.8" fill="#f4fcf6"/>`).join(''));
    s.motes({ seed: 9842, n: 16, x: [40, 270], y: [30, 160], r: [0.4, 1.1], fill: '#c6f4f6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },
};
