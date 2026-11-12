// Card art for the SATTC Ultra cards, part B (cards 116–131): three Tide,
// six Umbral and seven Radiant. Style rules live in ../scenes.js; drawing
// tools in ../kit.js. Seeds are the card's number × 100 plus a count.

import { H, W, blob, particles, pines, poly, pt, ridge, rng, spline, taper } from '../kit.js';
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

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// A head in profile, centred on the skull: brow, nose, mouth, chin. Faces
// right (dir -1: left); `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt, dir = 1) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k * dir, cy + y * k])), cx, cy, tilt * dir);

// A small fish swimming along `a` degrees: body and forked tail.
const fish = (x, y, l, a) => rot(U(lens(x, y, l, 0, 0.42, 3), poly([[x - l * 0.42, y], [x - l * 0.78, y - l * 0.24], [x - l * 0.7, y], [x - l * 0.78, y + l * 0.24]])), x, y, a);

// A seahorse facing left, its head at (x, y): snout, crest, curled tail.
const seahorse = (x, y, k) => at(x, y, k)(U(
  ell(0, 0, 3.4, 2.9, -10, 14), taper([[-2, 0.6], [-8, 1.8]], [2.4, 1.6], { per: 2 }), taper([[0.5, -2.4], [2, -5]], [2.2, 0.5], { per: 2 }),
  taper([[1.4, 1.6], [3.6, 6], [4.6, 11], [3.4, 16], [0.6, 19.5]], [3.6, 5.6, 6.4, 5, 3.2]),
  taper([[0.6, 19.5], [-1.4, 23.5], [0, 27.4], [3, 28.2], [4.4, 25.6], [2.6, 24]], [3.2, 2.4, 1.8, 1.3, 0.9, 0.4]),
  lens(6.4, 10, 5.6, 80, 0.5, 3),
));

// A chain from (x0, y0) to (x1, y1), sagging by `sag`: links `l` long, face
// on (rings) and edge on (bars) by turns. Path data for [rings, bars], to stroke.
function chain(x0, y0, x1, y1, l = 8, sag = 0) {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / (l * 0.74)));
  let rings = '', bars = '';
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + sag * 4 * t * (1 - t);
    const a = (Math.atan2(y1 - y0 + sag * 4 * (1 - 2 * t), x1 - x0) * 180) / Math.PI;
    if (i % 2 === 0) rings += oval(x, y, l * 0.5, l * 0.27, a);
    else { const [ax, ay] = toward(x, y, a, l * 0.44), [bx, by] = toward(x, y, a + 180, l * 0.44); bars += `M${f1(bx)},${f1(by)}L${f1(ax)},${f1(ay)}`; }
  }
  return [rings, bars];
}

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

// A painted sun: ring and eight short rays, as one stroked path.
const sunMark = (x, y, r) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0` +
  Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return `M${f1(x + Math.cos(a) * r * 1.45)},${f1(y + Math.sin(a) * r * 1.45)}L${f1(x + Math.cos(a) * r * 2)},${f1(y + Math.sin(a) * r * 2)}`; }).join('');

// A candle flame, base at (x, b), `h` tall, leaning `lean` units at the tip.
const flame = (x, b, h, lean = 0) => `M${f1(x + lean)},${f1(b - h)}C${f1(x + lean * 0.4 + h * 0.34)},${f1(b - h * 0.45)} ${f1(x + h * 0.26)},${f1(b)} ${f1(x)},${f1(b)}` +
  `C${f1(x - h * 0.26)},${f1(b)} ${f1(x + lean * 0.4 - h * 0.34)},${f1(b - h * 0.45)} ${f1(x + lean)},${f1(b - h)}Z`;

// Thin horizontal glints of light on water under a light: [[x, y, w, op], ...].
const shimmer = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

export const ultra_b = {
  // ── TIDE ──────────────────────────────────────────────────────────

  // A wave breaks over the rocks of a dark shore; where its foam slides back
  // down the sand it has left gold coins and pearls glinting.
  'tide-of-fortune'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#78b8b6'], [0.2, '#418992'], [0.4, '#1d5867'], [0.46, '#1a4f5e']]));
    // light from high above, through a break in the cloud
    s.glow(176, -26, 180, '#e6fbf8', 0.62);
    s.shafts({ cx: 176, cy: -50, n: 9, from: 64, to: 126, len: 270, spread: 2.4, color: '#e9fcf6', op: 0.24, seed: 11601, sd: 2.4 });
    s.add(`<g fill="#d8f4ef">${[[250, 40, 70, 5, 0.18], [210, 14, 110, 6, 0.16]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    // the far headlands, soft in the spray
    s.layer('M204,98L208,88L215,80L226,74L244,70L262,67L284,65L310,62L310,99ZM182,98L184,91L188,89L191,98ZM-10,98L-10,84L12,82L30,86L44,93L50,98Z', '#2c6a74', { blur: 0.7 });
    // the sea out to the horizon, the light lying on it
    s.path('M-10,97H310V214H-10Z', s.lin([[0, '#64aaac'], [0.08, '#2c6e7a'], [0.42, '#164653'], [1, '#08202a']]));
    s.add('<path d="M-10,97.5H310" stroke="#c9f1ec" stroke-width=".8" opacity=".5"/>');
    s.add(shimmer([[176, 101, 34, 0.5], [172, 105, 22, 0.4], [180, 109, 40, 0.32], [174, 114, 26, 0.26], [182, 119, 18, 0.2]], '#e2fbf6'));
    // the breaker rolling in behind the rocks, white along its crest
    const crest = [[-10, 128], [30, 122], [64, 114], [100, 117], [140, 123], [190, 126], [240, 123], [310, 126]];
    s.path(poly([...spline(crest, 6), [310, 152], [-10, 152]]), s.lin([[0, '#7fc6c4'], [0.35, '#2f7581'], [1, '#123f4b']]));
    s.path(taper(crest, [3, 5, 7, 6, 4, 3, 4, 2]), '#ecfcf8', 'opacity=".75"');
    s.add('<g fill="none" stroke="#d8f6f1" stroke-width=".9" opacity=".35"><path d="M120,132C150,134 180,136 214,134M150,140C180,142 210,143 250,140M30,134C50,132 70,134 90,138"/></g>');
    // the rocks it breaks on
    const rocks = U(blob([[18, 152], [22, 130], [34, 116], [52, 108], [70, 112], [84, 104], [102, 112], [116, 126], [126, 152]], 5),
      blob([[118, 152], [122, 140], [134, 134], [148, 138], [154, 152]], 4),
      blob([[232, 152], [236, 138], [250, 130], [266, 132], [278, 142], [282, 152]], 4));
    s.figure(`<path d="${rocks}"/>`, { fill: '#0a2229', rim: '#c4f1ef', offsets: [[0, -1.3], [0.9, -0.8]], rimOp: 0.85, shade: 0.5, edge: 0.3, light: [0.4, -1] });
    // the wet sand, and the thin sheet of foam sliding back down it
    s.path(ledge([[-10, 150], [40, 148], [100, 146.5], [160, 147.5], [220, 149], [310, 147]]), s.lin([[0, '#3b6a6c'], [0.2, '#1d4045'], [1, '#081a1f']]));
    const lace = spline([[-10, 166], [30, 170], [62, 164], [96, 172], [132, 168], [168, 176], [204, 170], [240, 174], [274, 167], [310, 171]], 6);
    s.path(poly([...spline([[-10, 150], [100, 148], [220, 150], [310, 148]], 6), ...lace.slice().reverse()]), '#9edad4', 'opacity=".22"');
    s.add(`<path d="${poly(lace, false)}" fill="none" stroke="#effdf9" stroke-width="1.4" opacity=".7" stroke-dasharray="7 2 3 2"/>` +
      `<path d="${poly(lace.map(([x, y]) => [x + 4, y - 7]), false)}" fill="none" stroke="#e2faf5" stroke-width=".8" opacity=".4" stroke-dasharray="4 3 9 2"/>`);
    // what the sea left: coins strewn through the foam, a pile where they
    // caught, a broken string of pearls, an open shell with its pearl
    const R = rng(11602), coins = [];
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, d = Math.pow(R(), 0.8) * 46;
      coins.push([150 + Math.cos(a) * d * 1.3, 173 + Math.sin(a) * d * 0.3, 3.4 + R() * 2, 0.34 + R() * 0.2, (R() - 0.5) * 30]);
    }
    coins.push([148, 163, 4.6, 1, 0], [162, 166, 4, 0.9, 12], [136, 167, 4, 0.95, -10]);
    const gold = s.radU(150, 170, 58, [[0, '#fff6c8'], [0.3, '#ffd96a'], [0.7, '#e2a63a'], [1, '#a8741f']]);
    const pile = blob([[124, 179], [131, 170], [143, 163], [156, 161], [169, 164], [178, 171], [183, 179], [152, 182]], 4);
    // the burst of spray where the wave hits the big rock: a ragged sheet of
    // white water thrown up, thin jets out of it, and drops everywhere
    const R2 = rng(11605), sheet = [], spray = [];
    let jets = '';
    for (let i = 0; i <= 30; i++) {
      const a = rad(-180 + (180 * i) / 30), r = (i % 2 ? 0.55 + R2() * 0.25 : 0.82 + R2() * 0.3) * (0.75 + 0.25 * Math.sin(Math.PI * i / 30));
      sheet.push([78 + Math.cos(a) * 54 * r, 114 + Math.sin(a) * 70 * r]);
    }
    for (let i = 0; i < 9; i++) {
      const a = -160 + (140 * i) / 8 + (R2() - 0.5) * 10, L = 46 + R2() * 34;
      jets += taper([[78, 112], toward(78, 112, a, L * 0.6), toward(78, 112, a + (R2() - 0.5) * 12, L)], [7, 4, 0.4], { per: 4 });
    }
    for (let i = 0; i < 34; i++) { const a = rad(-176 + R2() * 172), d = 34 + R2() * 56; spray.push([78 + Math.cos(a) * d * 0.95, 112 + Math.sin(a) * d, 0.5 + R2() * 1.3]); }
    const plume = blob(sheet, 3);
    s.add(`<ellipse cx="150" cy="176" rx="60" ry="9" fill="${s.rad([[0, '#ffe7a0', 0.42], [0.5, '#ffd77a', 0.16], [1, '#ffd77a', 0]])}"/>`);
    s.glow(78, 76, 56, '#e9fcf8', 0.3);
    s.glow(152, 170, 34, '#ffe7a0', 0.5, 'breathe');
    const wash = s.linU(0, 36, 0, 116, [[0, '#f4fffd', 0], [0.4, '#e9fcf8', 0.3], [0.8, '#dcf6f2', 0.62], [1, '#c8eeea', 0.75]]);
    s.bloom(`<g data-part="spray"><path d="${plume}" fill="${wash}"/><path d="${jets}" fill="${wash}"/>` +
      `<path d="${dots(spray)}" fill="#f2fffd" opacity=".85"/></g><g data-part="gold">` +
      `<path d="${pile}" fill="${gold}"/>` +
      `<path d="${coins.map(([x, y, r, k, a]) => oval(x, y, r, r * k, a)).join('')}" fill="${gold}" stroke="#9c6a1c" stroke-width=".5"/>` +
      `<path d="${coins.filter(([, , r]) => r > 3).map(([x, y, r, k, a]) => oval(x, y - 0.3, r * 0.6, r * k * 0.6, a)).join('')}" fill="none" stroke="#fff3c4" stroke-width=".5" opacity=".8"/>` +
      `<path d="${glint(148, 161, 11) + glint(167, 166, 7) + glint(127, 174, 6)}" fill="#ffffff"/></g>`, { sd: 1.4, k: 1.3, box: [0, 20, 250, 180] });
    // a broken string of pearls trailing out of the pile
    const pearls = spline([[178, 178], [188, 183], [199, 181], [209, 185.5], [221, 183]], 12).filter((_, i) => i % 4 === 0);
    s.add(`<g data-part="pearls"><path d="M176,177.5Q187,184.5 199,181T222,183" fill="none" stroke="#c9c2dc" stroke-width=".5" opacity=".8"/>` +
      `<path d="${dots(pearls.map(([x, y]) => [x, y, 2.1]).concat([[228, 188, 2], [196, 191, 1.8], [134, 188, 1.9]]))}" fill="${s.radU(200, 178, 40, [[0, '#ffffff'], [0.6, '#efeafa'], [1, '#cfc8e2']])}"/>` +
      `<path d="${dots(pearls.map(([x, y]) => [x - 0.6, y - 0.7, 0.7]))}" fill="#ffffff"/></g>`);
    // the open shell and its pearl
    s.figure(`<path d="${U(blob([[100, 183], [104, 176], [112, 173], [120, 176], [123, 183], [112, 186]], 4), blob([[101, 176], [103, 168], [110, 163], [118, 165], [122, 172], [112, 174]], 4))}"/>`,
      { fill: '#2e5a60', rim: '#e6f8f4', offsets: [[0, -1]], rimOp: 0.8 });
    s.add('<g fill="none" stroke="#a9d6d2" stroke-width=".6" opacity=".7"><path d="M112,174L106,167M112,174L111,164.5M112,174L116,165.5M112,174L120,169"/></g>');
    s.add(`<circle cx="112" cy="177.4" r="3.2" fill="${s.rad([[0, '#ffffff'], [0.6, '#f0ecfa'], [1, '#c8c2dc']], { cx: 0.38, cy: 0.35 })}"/>`);
    // dark rocks in the near corners, weed hanging off them
    s.path(U(blob([[-12, 214], [-10, 186], [6, 176], [26, 180], [40, 194], [46, 214]], 5), blob([[262, 214], [266, 190], [282, 178], [300, 176], [314, 184], [314, 214]], 5),
      taper([[30, 182], [36, 190], [34, 200]], [3, 2, 0.5]), taper([[272, 184], [266, 194], [268, 204]], [3, 2, 0.5])), '#041319');
    // spray in the air, glints on the gold
    s.add([[46, 64], [58, 46], [96, 52], [110, 72], [36, 86], [120, 94], [74, 40]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.23).toFixed(2)}s" cx="${x}" cy="${y}" rx="1" ry="1.5" fill="#f2fdfb"/>`).join(''));
    s.motes({ seed: 11603, n: 14, x: [20, 280], y: [40, 150], r: [0.4, 1], fill: p.glow, hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 11604, n: 10, x: [118, 214], y: [160, 186], r: [0.5, 1.1], fill: '#fff8dc', cls: 'twinkle', t: [1.2, 2.8], op: [0.5, 1] }));
    return s.svg();
  },

  // Under the sea a merman guard holds up a great scallop shield; a spear of
  // water flung at the little fish sheltering behind him bursts against it.
  wavewarden(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#8fd0ca'], [0.14, '#46929a'], [0.45, '#18505f'], [1, '#061a24']]));
    // the surface far above, the light coming down through it
    s.glow(156, -30, 190, '#e6fcf8', 0.7);
    s.shafts({ cx: 156, cy: -60, n: 11, from: 58, to: 122, len: 290, spread: 2.2, color: '#e9fcf6', op: 0.26, seed: 11701, sd: 2.4 });
    s.add('<path d="M-10,7C30,3 60,10 100,6C140,2 170,9 210,5C250,1 280,8 310,4" fill="none" stroke="#f2fffc" stroke-width="1.2" opacity=".35"/>');
    // the reef far off, kelp standing up out of it
    const kelp = (x, b, h, ph, w) => {
      const pts = [];
      for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(ph + i * 0.9) * 4, b - (h * i) / 6]);
      return taper(pts, [w, w * 0.9, w * 0.8, w * 0.7, w * 0.55, w * 0.4, 0.4]);
    };
    s.layer(ridge({ seed: 11702, base: 176, amp: 24, freq: 2.4 }) + U(kelp(30, 160, 70, 0, 4), kelp(52, 164, 50, 2, 3.4), kelp(244, 160, 76, 1, 4), kelp(270, 166, 54, 3, 3.4)), '#2a6c76', { blur: 0.8 });
    s.haze(132, 178, '#7cc0c0', 0.3);
    s.path(ledge([[-10, 192], [40, 186], [90, 189], [150, 186], [210, 190], [260, 185], [310, 189]]), s.lin([[0, '#123c46'], [1, '#04121a']]));
    // the small creatures sheltering behind him
    s.figure(`<path d="${U(fish(204, 98, 15, 186), fish(228, 120, 13, 172), fish(198, 140, 11, 192), fish(248, 100, 9, 160), seahorse(236, 140, 1.25))}"/>`,
      { fill: '#123f4b', rim: '#a6e4ec', offsets: [[0, -1], [-0.7, -0.5]], rimOp: 0.65 });
    s.add('<g data-part="fisheyes" fill="#c6f4f6"><circle cx="197.5" cy="97" r=".9"/><circle cx="222" cy="119.6" r=".8"/><circle cx="193.4" cy="139.6" r=".7"/><circle cx="232.6" cy="139.6" r=".7"/></g>');
    // the merman: tail curling away behind, a fin crest on his helm, his
    // trident held upright in the far hand
    const K = 1.0, mx = 156, my = 128, place = at(mx, my, K);
    const man = place(U(
      taper([[2, -6], [2, 8], [7, 22], [16, 34], [28, 42], [40, 46]], [20, 19, 16, 12, 8, 4.4]),
      taper([[39, 46], [46, 40], [52, 31]], [4, 7, 0.8]), taper([[39, 46], [48, 50], [57, 52]], [4, 7, 0.8]),
      lens(12, 22, 14, 60, 0.4),
      blob([[-9, -4], [9, -4], [10, -16], [12, -30], [11, -42], [5, -47], [-5, -47], [-12, -43], [-14, -32], [-12, -18]], 4),
      taper([[-2, -45], [-3, -53]], [6.4, 5.6], { per: 2 }),
      profile(-3.6, -60, 0.95, -4, -1),
      ell(-2.6, -63.6, 8.6, 6.2, -8, 16),
      poly([[-6, -67], [2, -76], [3, -71], [10, -76], [10, -70], [17, -72], [15, -66], [22, -65], [12, -61]]),
      taper([[3, -58], [10, -55], [17, -49], [24, -45]], [7, 6, 4, 0.8]),
      taper([[6, -42], [14, -32], [20, -24]], [6.4, 5.4, 4.6]), taper([[20, -24], [22, -36], [22, -47]], [4.6, 4.2, 3.8]), ell(22, -49, 3.4, 3),
      taper([[22, 10], [22, -50], [22, -92]], [2.4, 2.2, 2]), taper([[22, -92], [22, -104]], [2.6, 0.4], { per: 2 }),
      taper([[22, -89], [16, -91], [15, -99]], [2.2, 2, 0.4]), taper([[22, -89], [28, -91], [29, -99]], [2.2, 2, 0.4]),
      taper([[-8, -42], [-18, -34], [-26, -27]], [7, 6, 5]),
    ));
    s.figure(`<path d="${man}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-1, -0.7], [0.9, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.add(`<circle data-part="maneye" cx="${f1(mx - 6.6 * K)}" cy="${f1(my - 61.4 * K)}" r=".9" fill="#c6f4f6"/>`);
    // the shield: a scallop shell, ribs fanning out from the hinge
    const R0 = 36, sx = 126, sy = 134, tilt = -16, sq = 0.84;
    const edge = [];
    for (let k = 0; k <= 18; k++) { const a = rad(-168 + (156 * k) / 18), r = R0 * (k % 2 ? 0.95 : 1.04); edge.push([Math.cos(a) * r * sq, Math.sin(a) * r]); }
    const shellPts = [[0, 4], [-9, 3], [-11, -2], [-6, -4], ...edge.slice(0).filter((q) => q[1] < -3.5), [6, -4], [11, -2], [9, 3]];
    const place2 = (d) => rot(mv(d, sx, sy), sx, sy, tilt);
    const shell = place2(blob(shellPts, 3));
    s.figure(`<path d="${shell}"/>`, { fill: s.linU(0, sy - 40, 0, sy + 4, [[0, '#3c7f86'], [0.6, '#1d5560'], [1, '#0d3540']]), rim: '#e3fbf6', offsets: [[0, -1.3], [-1, -0.7]], rimOp: 0.95 });
    const ribs = edge.filter((_, k) => k % 2 === 0 && k > 0 && k < 18).map(([x, y]) => `M0,-3L${f1(x * 0.94)},${f1(y * 0.94)}`).join('');
    s.add(`<g data-part="ribs"><path d="${ribs}" transform="translate(${sx} ${sy}) rotate(${tilt})" fill="none" stroke="#bfeeee" stroke-width="1.1" opacity=".55" stroke-linecap="round"/></g>`);
    // the spear of water and its shattering
    const ix = 108, iy = 104;
    s.glow(ix, iy, 44, '#e6fdfc', 0.6, 'breathe');
    const jet = s.linU(-10, 76, ix, iy, [[0, '#c6f4f6', 0.2], [0.6, '#e3fbf8', 0.75], [1, '#ffffff', 0.95]]);
    let burst = '';
    for (const [a, l, w] of [[-150, 26, 5], [-125, 22, 4.4], [-100, 16, 3.4], [-175, 30, 5], [160, 24, 4.4], [132, 18, 4], [108, 14, 3], [-70, 10, 2.6], [80, 10, 2.6]]) {
      burst += taper([[ix, iy], toward(ix, iy, a, l * 0.5), toward(ix, iy, a + 8, l)], [w, w * 0.7, 0.3], { per: 4 });
    }
    const R = rng(11703), drops = [];
    for (let i = 0; i < 22; i++) { const a = rad(100 + R() * 160), d = 10 + R() * 30; drops.push([ix + Math.cos(a) * d, iy + Math.sin(a) * d * 0.9, 0.6 + R() * 1.1]); }
    for (let i = 0; i < 14; i++) { const t = R(), x = -6 + (ix - 14) * t; drops.push([x, 75 + 28 * t + (R() - 0.5) * (6 + 12 * t), 0.5 + R() * 0.8]); }
    // the jet twists as it flies: two strands winding round each other
    const strand = (ph) => {
      const pts = [];
      for (let i = 0; i <= 14; i++) { const t = i / 14, x = -10 + (ix + 8) * t; pts.push([x, 74 + 29 * t + Math.sin(ph + t * 11) * (1.2 + 3.2 * t)]); }
      return `M${pts.map(pt).join('L')}`;
    };
    s.bloom(`<g data-part="spear"><path d="${taper([[-10, 74], [30, 86], [70, 95], [ix - 2, iy - 1]], [2, 7, 10, 12])}" fill="${jet}" opacity=".7"/>` +
      `<path d="${strand(0)}${strand(Math.PI)}" fill="none" stroke="#ffffff" stroke-width="1.3" opacity=".75" stroke-linecap="round"/>` +
      `<path d="${burst}" fill="#effefb" opacity=".85"/><path d="${dots(drops)}" fill="#f4fffd"/><circle cx="${ix}" cy="${iy}" r="5" fill="#ffffff"/></g>`, { sd: 1.6, k: 1.35, box: [-10, 50, 170, 100] });
    // kelp close by at either edge
    s.path(U(kelp(-2, 216, 120, 0.5, 7), kelp(14, 216, 84, 2.2, 5.4), kelp(296, 216, 118, 1.6, 7), kelp(282, 216, 76, 3.4, 5)), '#041319');
    s.add(particles({ seed: 11704, n: 16, x: [90, 220], y: [40, 190], r: [0.6, 1.8], stroke: '#d6f6f4', cls: 'rise', t: [5, 9], op: [0.4, 0.8] }));
    s.motes({ seed: 11705, n: 14, x: [20, 280], y: [30, 180], r: [0.4, 1], fill: p.glow, hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // A woman on a sea rock, the ocean all round her; a pair of great wings
  // made of spray and light unfolds from her shoulders.
  'wing-graft'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#6eaeb0'], [0.25, '#3a828e'], [0.5, '#1f5c6b'], [0.62, '#1a5161']]));
    s.glow(150, 8, 200, '#effdf9', 0.6);
    s.shafts({ cx: 150, cy: -20, n: 12, from: 30, to: 150, len: 280, spread: 2.2, color: '#f2fffc', op: 0.2, seed: 11801, sd: 2.4 });
    s.add(`<g fill="#e6faf6">${[[54, 40, 70, 5, 0.25], [252, 30, 80, 6, 0.22], [200, 70, 60, 4, 0.18]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    // the horizon, an islet on it, the sea
    s.layer('M226,131L230,124L238,120L250,121L258,126L262,131ZM30,131L33,127L40,126L44,131Z', '#3a7e86', { blur: 0.6 });
    s.path('M-10,130H310V214H-10Z', s.lin([[0, '#6db2b2'], [0.1, '#2f7480'], [0.5, '#123e4b'], [1, '#06171f']]));
    s.add('<path d="M-10,130.5H310" stroke="#d8f8f3" stroke-width=".8" opacity=".5"/>');
    s.add(shimmer([[150, 134, 40, 0.45], [146, 139, 28, 0.38], [154, 145, 48, 0.3], [148, 152, 30, 0.24], [152, 160, 22, 0.18]], '#e8fcf8'));
    s.add('<g fill="none" stroke="#d8f6f1" stroke-width="1" stroke-linecap="round" opacity=".45"><path d="M30,150q10,-3 20,0M236,146q12,-3 24,0M60,170q14,-4 28,0M214,168q12,-4 26,0M10,188q14,-4 28,0M262,190q14,-4 28,0"/></g>');
    // the wings: feathers of spray fanned out from her shoulders, brightest
    // at the root, breaking up into drops at their tips
    // (the leading edge arches up from her shoulder to the wrist; the long
    // flight feathers hang from it, swept further out toward the tip)
    const arm = spline([[157, 112], [165, 94], [178, 77], [198, 62], [222, 52], [246, 47]], 6);
    const feathers = [], quills = [], spray = [];
    const R = rng(11802);
    const N = 16;
    for (let i = 0; i < N; i++) {
      const t = 0.03 + (0.97 * i) / (N - 1), [x, y] = arm[Math.round(t * (arm.length - 1))];
      const a = 100 - 76 * t, L = 28 + 26 * t + 6 * Math.sin(Math.PI * t);
      const tip = toward(x, y, a, L), mid = toward(x, y, a - 5, L * 0.5);
      feathers.push(taper([[x, y], mid, tip], [7 + 3 * t, 6.4 + 2 * t, 0.6], { per: 5 }));
      quills.push(`M${f1(x)},${f1(y)}Q${f1(mid[0])},${f1(mid[1])} ${f1(tip[0] - Math.cos(rad(a)) * 4)},${f1(tip[1] - Math.sin(rad(a)) * 4)}`);
      for (let k = 0; k < 2; k++) spray.push([tip[0] + (R() - 0.5) * 8, tip[1] + (R() - 0.3) * 8, 0.5 + R() * 0.9]);
    }
    for (let i = 0; i < 9; i++) {
      const t = 0.08 + (0.86 * i) / 8, [x, y] = arm[Math.round(t * (arm.length - 1))];
      feathers.push(leafAt(x, y, 96 - 74 * t, 16 + 12 * t, 0.42));
    }
    feathers.push(taper(arm, [10, 9, 8, 6, 4, 1]));
    const wingR = U(feathers), wingL = flipX(wingR, 150);
    const qR = quills.join(''), qL = flipX(qR, 150);
    const sprayAll = [...spray, ...spray.map(([x, y, r]) => [300 - x, y, r])];
    s.glow(150, 96, 96, '#c6f4f6', 0.55);
    const wf = s.radU(150, 112, 130, [[0, '#ffffff', 0.95], [0.3, '#e9fcf9', 0.8], [0.7, '#b4ebee', 0.5], [1, '#a6e4ec', 0.18]]);
    s.bloom(`<g data-part="wings"><path d="${wingR}${wingL}" fill="${wf}"/>` +
      `<path d="${qR}${qL}" fill="none" stroke="#ffffff" stroke-width=".7" opacity=".55"/>` +
      `<path d="${dots(sprayAll)}" fill="#f2fffd" opacity=".85"/></g>`, { sd: 1.8, k: 1.25 });
    // her rock in the sea, surf round its foot
    s.figure(`<path d="${ledge([[104, 214], [110, 194], [120, 182], [136, 177], [156, 176], [174, 179], [186, 188], [194, 214]])}"/>`,
      { fill: '#05131a', rim: p.rim, offsets: [[0, -1.2]], rimOp: 0.8, shade: 0.5 });
    s.add('<g fill="none" stroke="#e9f8f2" stroke-linecap="round" opacity=".7"><path d="M84,196q12,-5 24,0M192,196q12,-5 26,0" stroke-width="1.4"/><path d="M70,206q8,-3 16,0M214,204q8,-3 18,0" stroke-width="1"/></g>');
    // her: facing us, arms a little out, hair and hem blown to one side
    const fx = 150, fy = 177, K = 0.95, place = at(fx, fy, K);
    const her = place(U(
      taper([[-3, -30], [-4, -15], [-5, -2]], [5.4, 4.4, 3.4]), taper([[3, -30], [4.5, -15], [6, -2]], [5.4, 4.4, 3.4]),
      ell(-5.4, -1, 3.6, 1.5), ell(6.8, -1, 3.6, 1.5),
      blob([[-6, -58], [6, -58], [9, -46], [11, -35], [15, -27], [20, -25], [9, -24], [1, -25], [-7, -24], [-12, -25], [-10, -36], [-8, -48]], 4),
      taper([[0, -54], [0, -62], [0, -70]], [11, 12, 15]),
      taper([[0, -70], [0, -75]], 4.6, { per: 2 }),
      profile(-0.6, -80.5, 0.72, -12, -1),
      taper([[0, -84], [5, -82], [11, -78], [17, -76], [23, -77], [28, -75]], [9, 9, 7.4, 5.4, 3.4, 0.6]),
      taper([[-6.5, -68], [-12, -58], [-17, -48]], [4.4, 3.8, 3.2]), taper([[-17, -48], [-20, -43]], [3.2, 1], { per: 2 }),
      taper([[6.5, -68], [12, -58], [17, -48]], [4.4, 3.8, 3.2]), taper([[17, -48], [20, -43]], [3.2, 1], { per: 2 }),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0, -1.3], [-1, -0.6], [1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    // drops shaken from the wings; spray lifting off the sea into them
    s.add(sprayAll.filter(([x], i) => i % 4 === 0 && Math.abs(x - 150) > 22).map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.2).toFixed(1)}s" cx="${f1(x)}" cy="${f1(y + 6)}" rx=".9" ry="1.4" fill="#f2fffd"/>`).join(''));
    s.motes({ seed: 11803, n: 18, x: [70, 230], y: [100, 200], r: [0.4, 1.1], fill: p.glow, hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    s.motes({ seed: 11804, n: 10, x: [20, 280], y: [20, 120], r: [0.4, 0.9], fill: '#e6fdfc', cls: 'float', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },

  // ── UMBRAL ────────────────────────────────────────────────────────

  // Two hands clasp over a stone altar, black against the moon; a thin
  // thread of red light winds round both wrists, and the candles gutter.
  'blood-pact'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.4, '#1d1533'], [0.64, '#3e2e60'], [0.74, '#4b3a72']]));
    s.add(particles({ seed: 11901, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, right behind the clasp
    const mx = 150, my = 92;
    s.glow(mx, my, 130, '#c9b8f2', 0.46);
    s.add(`<circle cx="${mx}" cy="${my}" r="31" fill="#ece4fa"/><circle cx="${mx - 11}" cy="${my - 9}" r="5" fill="#d4c8ea" opacity=".6"/><circle cx="${mx + 13}" cy="${my + 12}" r="3.4" fill="#d4c8ea" opacity=".5"/><circle cx="${mx + 9}" cy="${my - 15}" r="2.4" fill="#d4c8ea" opacity=".5"/>`);
    // the moor behind, standing stones on it
    s.layer(ridge({ seed: 11902, base: 164, amp: 12, freq: 2 }) + 'M30,154L32,132L40,128L43,154ZM54,156L55,142L61,140L62,156ZM252,154L253,130L261,126L264,154Z', '#2e2450', { blur: 0.7 });
    s.haze(136, 164, '#7a62b0', 0.3);
    // the thread's far turns, behind the hands
    const turn = (ph) => [112 + 76 * ph, 98 + Math.sin(ph * Math.PI * 7) * 15];
    const back = [], front = [];
    for (let i = 0; i < 70; i++) {
      const t0 = i / 70, t1 = (i + 1) / 70;
      (Math.cos(t0 * Math.PI * 7) > 0 ? front : back).push(`M${pt(turn(t0))}L${pt(turn(t1))}`);
    }
    s.add(`<path d="${back.join('')}" fill="none" stroke="#b8384a" stroke-width="1" opacity=".55"/>`);
    // the two arms reaching up out of the corners: a wide robe sleeve on the
    // left, a slashed doublet sleeve on the right; the hands gripped
    // together, a thumb on top
    const arms = U(
      taper([[-14, 190], [30, 162], [80, 128], [122, 100]], [30, 26, 21, 16]),
      taper([[-24, 200], [18, 172], [58, 146]], [48, 44, 36], { per: 4 }),
      taper([[314, 190], [270, 162], [220, 128], [178, 100]], [30, 26, 21, 16]),
      taper([[324, 200], [282, 172], [242, 146]], [42, 38, 32], { per: 4 }),
      ell(250.6, 131.6, 3.4, 3.6), ell(246, 138, 3.4, 3.6), ell(241.4, 144.4, 3.4, 3.6), ell(236.8, 150.8, 3.4, 3.6), ell(232.2, 157.2, 3.4, 3.6),
      blob([[120, 90], [134, 84], [150, 82], [166, 84], [179, 90], [181, 100], [171, 108], [150, 111], [129, 108], [119, 100]], 5),
      taper([[136, 87], [148, 81], [160, 80]], [7, 5.6, 4.4]), ell(161, 80.6, 2.6, 2.4),
      ell(171, 92, 4.4, 5), ell(172.5, 100.5, 4, 4.4), ell(132, 107, 3.4, 3), ell(139, 109.6, 3.2, 2.8), ell(146, 110.6, 3, 2.6),
    );
    s.figure(`<path d="${arms}"/>`, { fill: '#0b0812', rim: '#d6c2fa', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7], [0, 1]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0, -1] });
    s.add('<path d="M48.6,132.5L67.4,159.5M256,130L238,158" stroke="#4a3a70" stroke-width="1.6" opacity=".9"/>');
    // the altar, candles on it, wax running down its face
    s.figure('<path d="M80,152H220L228,160H72Z"/><path d="M72,160H228V216H72Z"/>', { fill: '#0d0a16', rim: '#b8a6e2', offsets: [[0, -1.2]], rimOp: 0.8 });
    s.add('<path d="M72,160.5H228" stroke="#2a2040" stroke-width="1.2"/><g fill="none" stroke="#3a2c58" stroke-width="1" opacity=".7"><circle cx="150" cy="188" r="15"/><circle cx="150" cy="188" r="10"/><path d="M150,173V203M135,188H165M139,177L161,199M161,177L139,199"/></g>');
    const candles = [[96, 13], [108, 7], [194, 11], [206, 6]];
    s.add(`<g fill="#d6cce8">${candles.map(([x, h]) => `<rect x="${x - 2.6}" y="${156 - h}" width="5.2" height="${h}" rx=".9"/>`).join('')}</g>` +
      '<path d="M94,154v9M98,155v5M109,155v10M193,155v7M207,155v9" stroke="#d6cce8" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>');
    // the thread's near turns, and its glow; a drop of blood falling
    s.glow(150, 98, 46, '#ff5a6a', 0.32, 'breathe');
    for (const [x, h] of candles.filter((_, i) => i !== 1)) s.glow(x + 2, 156 - h - 6, 16, '#e6d2ff', 0.55);
    s.bloom(`<g data-part="thread"><path d="${front.join('')}" fill="none" stroke="#ff5068" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="${front.join('')}" fill="none" stroke="#ffd6dc" stroke-width=".7" stroke-linecap="round"/></g>` +
      `<path data-part="flames" d="${candles.filter((_, i) => i !== 1).map(([x, h]) => flame(x, 156 - h - 0.5, 8, 2.6)).join('')}" fill="#f2e8ff"/>` +
      '<ellipse cx="150" cy="152.4" rx="4.4" ry="1" fill="#ff5068"/>', { sd: 1.4, k: 1.4, box: [60, 60, 180, 110] });
    s.add('<ellipse class="fall" style="--d:-.4s" cx="150" cy="124" rx="1.3" ry="2" fill="#ff5068"/>');
    // the snuffed candle's smoke
    s.path(taper([[108, 146], [106, 136], [111, 127], [107, 118], [112, 110]], [1.4, 2.2, 2.6, 2, 0.4]), '#b8a6e2', 'class="drift" opacity=".35"');
    s.motes({ seed: 11903, n: 14, x: [30, 270], y: [40, 150], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.35, 0.85] });
    return s.svg();
  },

  // A pale vampire mage in a high collar stands over a fallen knight; a
  // stream of red light pours out of him into her open hand.
  bloodbinder(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.42, '#1f1734'], [0.66, '#46346a'], [0.76, '#523c70']]));
    s.add(particles({ seed: 12001, n: 26, x: [0, W], y: [0, 96], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(232, 46, 90, '#c9b8f2', 0.4);
    s.add('<circle cx="232" cy="46" r="15" fill="#ece4fa"/><circle cx="227" cy="42" r="3" fill="#d4c8ea" opacity=".6"/><circle cx="237" cy="51" r="2.2" fill="#d4c8ea" opacity=".5"/>');
    // the battlefield behind: a ridge, spears standing in it, a torn banner
    const R = rng(12002);
    let spears = '';
    for (let i = 0; i < 14; i++) {
      const x = 10 + R() * 280, a = (R() - 0.5) * 40, h = 10 + R() * 8, [tx, ty] = toward(x, 152, a - 90, h);
      spears += `M${f1(x)},152L${f1(tx)},${f1(ty)}`;
    }
    s.blur(`<path d="${ledge([[-10, 154], [60, 148], [130, 151], [200, 147], [260, 150], [310, 146]])}" fill="#2e2448"/><path d="${spears}" stroke="#2e2448" stroke-width="1.1"/>` +
      '<path d="M44,150L46,118L47.4,118L45.6,150ZM46.6,119L60,122L54,126L59,131L46.4,129Z" fill="#2e2448"/>', 0.6);
    s.haze(128, 156, '#7a5a9a', 0.3);
    s.path(ledge([[-10, 184], [50, 180], [120, 182], [190, 184], [250, 181], [310, 184]]), s.lin([[0, '#1a1328'], [1, '#07050b']]));
    // the fallen knight, on his back, his sword dropped beside him
    const foe = U(
      taper([[40, 184], [56, 182], [70, 181]], [6.4, 7, 8]), taper([[70, 181], [58, 172], [46, 176]], [7, 6, 5.4]),
      taper([[68, 180], [86, 177], [102, 176]], [13, 14, 12]), ell(110, 174, 7, 6.6),
      taper([[98, 172], [104, 162], [114, 158]], [5, 4.2, 3.6]),
      taper([[90, 182], [98, 186], [108, 187]], [4.6, 4, 3.4]),
    );
    s.figure(`<path d="${foe}"/><path d="M114,190L150,186" stroke-width="1.6"/><path d="M118,186.4L119.6,192" stroke-width="1.6"/>`, { fill: '#0b0812', rim: '#b8a6e2', offsets: [[0, -1.1], [0.7, -0.7]], rimOp: 0.75 });
    // her: tall, pale, a collar standing up behind her head, the cape
    // falling behind; one hand held out over him, fingers spread
    const vx = 188, vy = 189, K = 1.02, place = at(vx, vy, K, -1);
    const her = place(U(
      blob([[-7, -62], [7, -62], [10, -46], [13, -28], [16, -10], [18, 0], [6, 1], [-6, 1], [-16, 0], [-32, -1], [-24, -8], [-16, -24], [-12, -44]], 4),
      taper([[0, -60], [0, -74], [0, -86]], [11, 10, 14]),
      taper([[-5, -84], [-9, -96], [-12, -110]], [9, 6, 0.6]), taper([[4, -85], [7, -95], [8, -102]], [5, 3.4, 0.5]),
      taper([[1, -86], [2, -92]], 4.6, { per: 2 }),
      profile(3.6, -97.5, 0.9, -4),
      ell(-2.4, -103.4, 4.8, 4, 0, 14), taper([[-3, -100], [-9, -96], [-12, -90]], [5, 3.4, 0.6]),
      taper([[5, -84], [17, -79], [30, -73]], [5.4, 4.4, 3.6]),
      taper([[30, -73], [36, -68], [40, -63]], [2, 1.6, 0.6]), taper([[31, -73], [38, -71], [43, -67]], [2, 1.6, 0.6]),
      taper([[30, -74], [37, -75], [42, -73]], [1.8, 1.4, 0.6]), taper([[29, -72], [32, -66], [33, -61]], [1.8, 1.4, 0.6]),
      taper([[-3, -84], [-6, -72], [-5, -60]], [5, 4.2, 3.6]),
      blob([[-4, -88], [-14, -84], [-26, -74], [-36, -58], [-44, -40], [-48, -22], [-42, -25], [-38, -14], [-32, -23], [-26, -11], [-21, -27], [-12, -50], [-6, -70]], 4),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#0d0915', rim: '#d6c2fa', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [0.3, -1] });
    // her face and hand, pale in the moonlight
    s.add('<g data-part="face">');
    s.path(place(profile(3.6, -97.5, 0.9, -4)), '#ddd2ec');
    s.path(place(U(ell(-2.4, -103.4, 4.8, 4, 0, 14), taper([[-3, -101], [-1, -95], [-2.6, -90]], [4, 3, 1]))), '#0d0915');
    s.add(`<circle cx="${f1(vx - 5.6 * K)}" cy="${f1(vy - 99 * K)}" r=".8" fill="#7a1430"/>`);
    s.add('</g>');
    // the stream of red light, out of his chest and into her hand; her
    // wounds closing where it reaches her
    const ctrl = [[84, 171], [88, 156], [98, 142], [114, 130], [130, 121], [146, 116], [156, 115]];
    const red = s.linU(84, 171, 156, 115, [[0, '#a8102a', 0.5], [0.5, '#ff3d55', 0.85], [1, '#ffd0d6']]);
    s.glow(84, 172, 30, '#ff4a5e', 0.35);
    s.glow(156, 115, 30, '#ff8a96', 0.5, 'breathe');
    const wounds = place('M10,-80L16,-77M20,-78L24,-75M2,-76L5,-70');
    s.bloom(`<g data-part="stream"><path d="${taper(ctrl, [1.4, 4, 6, 6, 5, 4, 1.6])}" fill="${red}" opacity=".85"/>` +
      `<path d="${taper(ctrl, [0.4, 1.2, 1.6, 1.6, 1.4, 1.2, 0.6])}" fill="#ffe2e6"/></g>` +
      `<path data-part="wounds" d="${wounds}" stroke="#ff5068" stroke-width="1.3" stroke-linecap="round"/>`, { sd: 1.6, k: 1.4, box: [60, 90, 140, 100] });
    s.motes({ seed: 12003, n: 14, x: [86, 156], y: [112, 172], r: [0.4, 1], fill: '#ff6a7a', hot: '#ffe2e6', cls: 'float', t: [3, 6], op: [0.5, 1] });
    s.fog(184, '#8f7fc8', 0.24);
    s.motes({ seed: 12004, n: 10, x: [20, 290], y: [60, 180], r: [0.35, 0.9], fill: '#c9b0f4', cls: 'float', t: [6, 10], op: [0.3, 0.7] });
    return s.svg();
  },

  // A hooded shade with a lantern hangs over a fresh grave; violet light
  // flows out of the grave into a line of soldiers standing behind it.
  gravewarden(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#09060f'], [0.42, '#1f1734'], [0.66, '#43336a'], [0.74, '#4a3870']]));
    s.add(particles({ seed: 12101, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(246, 38, 90, '#c9b8f2', 0.38);
    s.add('<circle cx="246" cy="38" r="13" fill="#ece4fa"/><circle cx="242" cy="35" r="2.6" fill="#d4c8ea" opacity=".6"/>');
    s.layer(ridge({ seed: 12102, base: 138, amp: 16, freq: 2.2 }), '#2c2246', { blur: 0.7 });
    s.haze(112, 146, '#6a5494', 0.3);
    // the rise the soldiers stand on
    s.path(ledge([[-10, 166], [60, 162], [130, 160], [190, 158], [250, 156], [310, 154]]), '#1d1630');
    const soldier = (x, b, k) => U(
      taper([[x - 2 * k, b], [x - 2 * k, b - 13 * k]], [3 * k, 3.4 * k], { per: 2 }), taper([[x + 2.4 * k, b], [x + 2.4 * k, b - 13 * k]], [3 * k, 3.4 * k], { per: 2 }),
      blob([[x - 5 * k, b - 12 * k], [x + 5 * k, b - 12 * k], [x + 6 * k, b - 24 * k], [x + 4 * k, b - 29 * k], [x - 4 * k, b - 29 * k], [x - 6 * k, b - 24 * k]], 3),
      ell(x, b - 32.5 * k, 3.6 * k, 3.9 * k, 0, 12), taper([[x - 5 * k, b - 32 * k], [x + 5 * k, b - 32 * k]], 1.4 * k, { per: 2 }),
      ell(x + 3 * k, b - 20 * k, 6 * k, 7.4 * k, 0, 14),
      taper([[x - 6 * k, b + 1], [x - 6 * k, b - 48 * k]], [1.4 * k, 1.1 * k], { per: 2 }), lens(x - 6 * k, b - 50 * k, 5 * k, 90, 0.4, 3),
    );
    const line = [[190, 162, 1.4], [218, 160, 1.28], [243, 158, 1.17], [265, 156.5, 1.07], [285, 155, 0.98]];
    s.figure(`<path d="${U(line.map(([x, b, k]) => soldier(x, b, k)))}"/>`, { fill: '#130e22', rim: '#c9a6ff', offsets: [[0, -1], [-0.8, -0.6]], rimOp: 0.8 });
    // the near ground and the fresh grave, its marker leaning
    s.path(ledge([[-10, 186], [50, 182], [120, 185], [190, 184], [250, 188], [310, 185]]), s.lin([[0, '#171126'], [1, '#07050b']]));
    s.figure(`<path d="${blob([[112, 190], [122, 175], [142, 167], [170, 167], [190, 173], [202, 190], [160, 193]], 5)}"/>${cross(204, 182, 30, 8)}`,
      { fill: '#120d1c', rim: '#b07cff', offsets: [[0, -1.2], [-0.8, -0.6]], rimOp: 0.85 });
    // the shade: a pointed hood with nothing in it but eyes, a long sleeve
    // reaching out over the grave, its robe fraying away into wisps
    const shade = U(
      blob([[84, 70], [80, 54], [82, 40], [78, 28], [92, 36], [104, 45], [110, 58], [108, 72], [98, 78]], 4),
      blob([[82, 72], [106, 74], [116, 90], [120, 112], [121, 134], [115, 150], [104, 158], [90, 160], [78, 150], [72, 128], [72, 104], [76, 86]], 5),
      taper([[112, 148], [114, 164], [108, 178], [102, 186]], [11, 8, 4, 0.5]), taper([[98, 154], [96, 170], [88, 182]], [12, 7, 0.5]),
      taper([[84, 150], [74, 164], [62, 172]], [10, 6, 0.5]),
      taper([[104, 84], [118, 92], [133, 98]], [11, 8, 5.4]), ell(135, 98.4, 3.6, 3.2),
      taper([[121, 182], [135, 98], [147, 55]], [2.6, 2.4, 2.2]),
      taper([[147, 55], [150, 49], [156, 48], [160, 52], [159, 58]], [2.2, 2.1, 2, 1.8, 1.6]),
    );
    s.figure(`<path d="${shade}"/>`, { fill: '#09060e', rim: '#c9b0f4', offsets: [[0, -1.2], [1, -0.7], [-0.8, -0.6]], rimOp: 0.85, shade: 0.4, edge: 0.3, light: [0.4, -1] });
    s.add('<path data-part="fold" d="M101,52C104,58 105,66 103,72" stroke="#1d1630" stroke-width="2" fill="none"/>');
    // its lantern, the grave's light, the streams running into the soldiers
    const lx = 159, ly = 70;
    s.glow(lx, ly, 60, '#b98cff', 0.45);
    s.glow(lx, ly, 22, '#efe2ff', 0.8, 'breathe');
    s.glow(158, 178, 48, '#a46bff', 0.5, 'breathe');
    const streams = line.map(([x, b, k]) => `M160,176Q${f1((160 + x) / 2 - 10)},${f1(b - 46)} ${f1(x + 3 * k)},${f1(b - 20 * k)}`).join('');
    for (const [x, b, k] of line) s.glow(x + 3 * k, b - 20 * k, 9 * k, '#c9a6ff', 0.55);
    s.bloom(`<g data-part="streams"><path d="${streams}" fill="none" stroke="#b07cff" stroke-width="3" opacity=".35"/><path d="${streams}" fill="none" stroke="#e6d2ff" stroke-width=".9"/></g>` +
      '<g data-part="cracks" stroke="#d2a8ff" stroke-width="1.2" fill="none" stroke-linecap="round"><path d="M134,178l8,-4l6,2l8,-5M168,174l6,4l9,-1M150,184l6,-6l8,3"/></g>' +
      `<g data-part="lantern"><path d="M${lx},58V62" stroke="#09060e" stroke-width="1.1"/><path d="M${lx - 4.6},62H${lx + 4.6}L${lx + 3.4},65H${lx - 3.4}ZM${lx - 3.4},77H${lx + 3.4}L${lx + 4.6},80H${lx - 4.6}Z" fill="#09060e"/>` +
      `<rect x="${lx - 3.4}" y="65" width="6.8" height="12" rx="1" fill="#f6eeff"/></g>` +
      '<g data-part="eyes" fill="#e6d2ff"><circle cx="104.6" cy="56" r="1.1"/><circle cx="108.6" cy="57" r="1"/><circle cx="106.4" cy="61.4" r=".7"/></g>', { sd: 1.6, k: 1.4, box: [80, 30, 220, 170] });
    s.fog(170, '#8f7fc8', 0.26).fog(194, '#7a68b0', 0.3);
    s.motes({ seed: 12103, n: 18, x: [130, 290], y: [100, 186], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [5, 9], op: [0.35, 0.85] });
    return s.svg();
  },

  // A ritual in three parts: under a huge violet moon, hooded figures stand
  // round a ring of graves with their arms raised, and in its middle three
  // pale hands break up through the earth, one further than the next.
  'grave-rite'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.4, '#21173a'], [0.62, '#4a3474'], [0.7, '#56407e']]));
    s.add(particles({ seed: 12201, n: 30, x: [0, W], y: [0, 90], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, huge and low
    const mx = 150, my = 84;
    s.glow(mx, my, 150, '#b98cff', 0.5);
    s.add(`<g data-part="moon"><circle cx="${mx}" cy="${my}" r="46" fill="${s.radU(mx - 10, my - 12, 60, [[0, '#f4ecff'], [0.6, '#dcc6fb'], [1, '#bb98ee']])}"/>` +
      `<g fill="#b796e6" opacity=".45"><circle cx="${mx - 16}" cy="${my - 12}" r="7"/><circle cx="${mx + 18}" cy="${my + 14}" r="5"/><circle cx="${mx + 14}" cy="${my - 22}" r="3.4"/><circle cx="${mx - 22}" cy="${my + 18}" r="3"/></g></g>`);
    // yews and the far hill
    s.layer(ridge({ seed: 12202, base: 134, amp: 12, freq: 2 }) + U(ell(30, 116, 7, 20), ell(44, 122, 5, 14), ell(262, 114, 7, 22), ell(278, 122, 5, 14)), '#2c2148', { blur: 0.7 });
    s.haze(108, 140, '#7a5cb0', 0.32);
    // the knoll the ring stands on
    s.path(ledge([[-10, 156], [40, 146], [100, 140], [150, 139], [200, 140], [260, 146], [310, 156]]), s.lin([[0, '#271c40'], [0.5, '#170f26'], [1, '#08060c']]));
    // the ring: graves round it, a circle of three rings cut in the turf
    s.add(`<g fill="#1d1532">${stone(68, 150, 10, 15, -6)}${cross(106, 143, 17, 4)}${cross(194, 143, 17, -5)}${stone(232, 150, 10, 15, 6)}</g>`);
    // the two far figures, arms up
    const robed = (k) => U(
      blob([[-8, -50], [8, -50], [12, -30], [16, -8], [18, 0], [-18, 0], [-16, -8], [-12, -30]], 4),
      blob([[-6, -50], [-7, -59], [-3, -67], [3, -71], [7, -64], [7, -55], [5, -50]], 4),
      taper([[-6, -47], [-13, -60], [-17, -74]], [7, 5, 4]), ell(-17.6, -76, 2.6, 3),
      taper([[6, -47], [13, -60], [17, -74]], [7, 5, 4]), ell(17.6, -76, 2.6, 3),
    );
    s.figure(`<path d="${at(96, 150, 0.62)(robed())}${at(204, 150, 0.62)(robed())}"/>`, { fill: '#120c20', rim: '#d2b8fa', offsets: [[0, -1], [-0.6, -0.6], [0.6, -0.6]], rimOp: 0.85 });
    const rings = [[40, 8.4, 0.9], [56, 11.6, 0.6], [72, 15, 0.38]];
    s.add(`<g fill="none" stroke="#2e2248" stroke-width="2.4">${rings.map(([rx, ry]) => `<ellipse cx="150" cy="166" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add(`<g fill="#140e24">${stone(56, 172, 14, 22, -8)}${cross(94, 182, 26, 6)}${cross(206, 182, 26, -6)}${stone(244, 172, 14, 22, 8)}</g>`);
    // the hands: fingertips just through, a hand to the wrist, an arm to the elbow
    const hand = (x, y, a, k, arm) => rot(at(x, y, k)(U(
      taper([[0, arm], [0, 0]], [7, 6.4], { per: 2 }), blob([[-4.6, 2], [-5, -6], [-3, -10], [3, -10], [5, -6], [4.6, 2]], 3),
      taper([[-4.4, -8], [-7.6, -15], [-8.6, -21]], [2.6, 2.2, 1.6]), taper([[-2, -10], [-2.6, -19], [-2.6, -26]], [2.6, 2.2, 1.6]),
      taper([[1, -10], [1.6, -19], [2, -26]], [2.6, 2.2, 1.6]), taper([[3.6, -9], [6, -17], [7, -23]], [2.4, 2, 1.4]),
      taper([[4.6, -2], [9, -6], [11, -11]], [3, 2.4, 1.6]),
    )), x, y, a);
    s.glow(150, 160, 70, '#a46bff', 0.45, 'breathe');
    const skin = s.linU(0, 112, 0, 172, [[0, '#f6f0ff'], [0.6, '#dccbf6'], [1, '#a98bd8']]);
    s.bloom(`<g data-part="ring" fill="none" stroke="#b98cff" stroke-linecap="round">${rings.map(([rx, ry, o]) => `<ellipse cx="150" cy="166" rx="${rx}" ry="${ry}" stroke-width="1.1" opacity="${o}"/>`).join('')}</g>` +
      `<path data-part="hands" d="${hand(152, 156, 4, 1.3, 14) + hand(126, 166, -12, 0.95, 4) + hand(177, 172, 14, 0.8, 2)}" fill="${skin}"/>` +
      '<g stroke="#e0c4ff" stroke-width="1.2" fill="none" stroke-linecap="round"><path d="M140,172l-8,3l-9,-1M162,173l9,3l8,-2M150,175l1,6M120,170l-6,2M182,176l6,2"/></g>', { sd: 1.6, k: 1.35, box: [60, 90, 180, 110] });
    // clods thrown up by the hands
    s.add('<g data-part="clods">'); s.path(dots([[132, 175, 2], [168, 177, 1.8], [113, 172, 1.6], [190, 175, 1.5]]), '#120c1e'); s.add('</g>');
    // the two near figures, framing us, arms raised to the moon
    s.figure(`<path d="${at(34, 214, 1.5)(robed())}${at(268, 214, 1.5)(robed())}"/>`, { fill: '#07050b', rim: '#b8a6e2', offsets: [[0, -1.2], [1, -0.4], [-1, -0.4]], rimOp: 0.75 });
    s.fog(186, '#9a86c8', 0.16);
    s.motes({ seed: 12203, n: 18, x: [90, 210], y: [100, 180], r: [0.35, 1], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // A huge horned beast, its head hung low, held to the ground: iron
  // shackles cut with violet runes clamp its legs, chains running from them
  // down into the earth.
  shackles(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0b0814'], [0.42, '#221a3a'], [0.68, '#4a3a70'], [0.78, '#55407a']]));
    s.add(particles({ seed: 12301, n: 30, x: [0, W], y: [0, 100], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(58, 42, 100, '#c9b8f2', 0.42);
    s.add('<circle cx="58" cy="42" r="17" fill="#ece4fa"/><circle cx="53" cy="38" r="3.4" fill="#d4c8ea" opacity=".6"/><circle cx="64" cy="48" r="2.4" fill="#d4c8ea" opacity=".5"/>');
    // tiny ruined towers on the horizon, for scale
    s.layer(ridge({ seed: 12302, base: 158, amp: 10, freq: 2 }) + 'M18,154V136L21,133L24,136V154ZM28,154V142L31,140L33,143V154ZM226,152V128L229,124L232,128V152ZM236,152V140L239,138L241,140V152ZM270,150V134L273,131L276,134V150Z', '#2c2248', { blur: 0.6 });
    s.haze(130, 162, '#7a62b0', 0.32);
    s.path(ledge([[-10, 184], [50, 180], [120, 182], [190, 180], [250, 183], [310, 181]]), s.lin([[0, '#1d1530'], [1, '#08060c']]));
    // the beast: a hump of shoulder with a ragged mane, its back running off
    // the card, the horned head hung low between its forelegs
    const back = spline([[108, 84], [126, 60], [154, 44], [190, 38], [226, 44], [262, 54]], 8), mane = [];
    for (let i = 2; i < back.length - 4; i += 2) {
      const [x, y] = back[i], t = i / back.length;
      mane.push(taper([[x, y + 3], toward(x, y, -40, 4), toward(x, y, -18 - 10 * Math.sin(i), 7 + 3 * Math.sin(Math.PI * t) + (i % 4 ? 0 : 2))], [5, 3, 0.4], { per: 3 }));
    }
    const beast = U(
      blob([[104, 110], [110, 82], [128, 58], [156, 42], [190, 36], [226, 42], [262, 52], [312, 58], [312, 152], [284, 150], [250, 140], [214, 138], [182, 136], [152, 132], [124, 126]], 5),
      mane,
      blob([[62, 120], [68, 106], [82, 96], [100, 94], [116, 102], [121, 118], [111, 133], [95, 141], [77, 141], [65, 133]], 5),
      taper([[72, 130], [60, 138], [50, 144]], [20, 17, 15]), ell(50, 144, 6.6, 7.4, 34),
      taper([[62, 148], [53, 146], [47, 138], [46, 131]], [3.4, 2.8, 2, 0.6]),
      taper([[98, 98], [90, 84], [76, 75], [60, 75], [50, 83], [47, 95]], [10, 9, 7, 5, 3, 1]),
      taper([[110, 100], [108, 84], [100, 70], [88, 62], [76, 62]], [9, 8, 6, 4, 1]),
      taper([[136, 118], [132, 148], [127, 172], [125, 184]], [32, 24, 19, 21]),
      taper([[168, 124], [166, 150], [162, 172], [162, 184]], [28, 21, 17, 19]),
      taper([[284, 116], [278, 148], [277, 172], [280, 184]], [36, 24, 18, 20]),
      ell(124, 185, 13, 4), ell(162, 185, 11, 3.6), ell(281, 185, 12, 3.8),
    );
    s.figure(`<path d="${beast}"/>`, { fill: '#0b0812', rim: '#cdb6f4', offsets: [[-1.2, -1], [0, -1.3], [1, -0.6]], rimOp: 0.9, shade: 0.45, edge: 0.3, light: [-0.6, -1] });
    s.add('<g fill="#8a6cd0"><circle cx="86" cy="114" r="1.6"/><circle cx="94" cy="117" r="1.2"/></g>');
    // the shackles, and the chains from them down into the ground
    const cuff = (x, y, w) => `M${f1(x - w / 2)},${f1(y - 6)}Q${f1(x)},${f1(y - 9)} ${f1(x + w / 2)},${f1(y - 6)}L${f1(x + w / 2)},${f1(y + 6)}Q${f1(x)},${f1(y + 3)} ${f1(x - w / 2)},${f1(y + 6)}Z`;
    const cuffs = [[127, 164, 27], [163, 165, 23], [278, 165, 24]];
    s.figure(`<path d="${cuffs.map(([x, y, w]) => cuff(x, y, w)).join('')}"/>`, { fill: s.lin([[0, '#4a3e62'], [1, '#1d1630']]), rim: '#e6d6ff', offsets: [[0, -1], [-0.8, -0.6]], rimOp: 0.9 });
    const links = [chain(116, 170, 84, 193, 9, 3), chain(172, 171, 206, 193, 8.4, 3), chain(268, 171, 238, 194, 8.4, 2)];
    s.add(`<g data-part="chains" fill="none" stroke-linecap="round"><path d="${links.map((c) => c[0]).join('')}" stroke="#463b62" stroke-width="2.6"/><path d="${links.map((c) => c[1]).join('')}" stroke="#463b62" stroke-width="3.6"/>` +
      `<path d="${links.map((c) => c[0]).join('')}" stroke="#c9b8f2" stroke-width=".7" opacity=".7"/></g>`);
    // runes: forks, diamonds, hourglasses, a ring with a dot
    const glyphs = [(x, y) => `M${x},${y + 3}v-6M${x},${y}l-1.8,-2.6M${x},${y}l1.8,-2.6`, (x, y) => `M${x},${y - 3}l1.9,3l-1.9,3l-1.9,-3Z`,
      (x, y) => `M${x - 1.7},${y - 3}h3.4l-3.4,6h3.4Z`, (x, y) => `M${x - 2},${y}a2,2 0 1,0 4,0a2,2 0 1,0 -4,0M${x},${y}h.1`];
    const runes = cuffs.map(([x, y, w]) => {
      let d = '';
      const n = Math.floor(w / 6.4);
      for (let i = 0; i < n; i++) d += glyphs[(i + Math.round(x)) % 4](f1(x - ((n - 1) * 6.4) / 2 + i * 6.4), y);
      return d;
    }).join('');
    s.glow(127, 164, 30, '#b07cff', 0.55, 'breathe');
    s.glow(163, 165, 26, '#b07cff', 0.5, 'breathe');
    s.bloom(`<path data-part="runes" d="${runes}" fill="none" stroke="#e2c8ff" stroke-width="1.1" stroke-linecap="round"/>` +
      `<g data-part="pads" fill="#c9a6ff">${[[84, 193], [206, 193], [238, 194]].map(([x, y]) => `<ellipse cx="${x}" cy="${y + 1}" rx="7" ry="2"/>`).join('')}</g>` +
      '<g data-part="pads" stroke="#b07cff" stroke-width="1" fill="none" stroke-linecap="round"><path d="M77,194l-8,3l-6,-1M91,195l8,2M199,194l-7,3M213,194l8,2l6,-1M231,196l-8,2M245,195l7,3"/></g>', { sd: 1.4, k: 1.5, box: [40, 140, 260, 70] });
    s.fog(188, '#8f7fc8', 0.24);
    s.motes({ seed: 12303, n: 16, x: [60, 300], y: [120, 196], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [5, 9], op: [0.35, 0.85] });
    return s.svg();
  },

  // A sliver of black crystal hangs over an open palm, dripping green
  // poison; thin fumes curl up off it.
  'venom-shard'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#09060f'], [0.45, '#1d1532'], [0.72, '#3c2c5c'], [0.82, '#463468']]));
    s.add(particles({ seed: 12401, n: 26, x: [0, W], y: [0, 110], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    s.glow(62, 38, 70, '#c9b8f2', 0.32);
    s.add('<circle cx="62" cy="38" r="10" fill="#e6def4"/>');
    s.layer(ridge({ seed: 12402, base: 170, amp: 22, freq: 2.2 }) + U(taper([[236, 160], [238, 130], [232, 112]], [4, 2.6, 0.8]), taper([[237, 134], [248, 124]], [2, 0.5]), taper([[236, 122], [226, 114]], [1.8, 0.5])), '#271e40', { blur: 0.7 });
    s.haze(140, 176, '#6e58a0', 0.3);
    // the hand, palm up and cupped, a sleeve at the wrist
    const hand = U(
      taper([[90, 218], [110, 200], [128, 189]], [28, 23, 18]),
      blob([[124, 181], [136, 175], [156, 173], [174, 173], [184, 179], [180, 189], [160, 193], [138, 193], [124, 191]], 4),
      taper([[174, 177], [186, 171], [194, 161], [196, 151]], [8.4, 7.2, 6, 4.6]),
      taper([[178, 183], [190, 177], [200, 167], [204, 157]], [8.2, 7, 6, 4.6]),
      taper([[178, 187], [192, 183], [202, 175], [208, 167]], [7.6, 6.4, 5.4, 4.2]),
      taper([[174, 191], [188, 189], [198, 183], [204, 177]], [6.8, 5.8, 4.8, 3.8]),
      taper([[136, 181], [128, 171], [124, 161], [124, 153]], [10, 8, 6.6, 5.2]),
      blob([[70, 218], [86, 202], [104, 192], [118, 196], [116, 206], [108, 218]], 4),
    );
    s.figure(`<path d="${hand}"/>`, { fill: '#0b0812', rim: '#cdb6f4', offsets: [[0, -1.3], [-1, -0.7], [1, -0.7]], rimOp: 0.85, shade: 0.4, edge: 0.3, light: [0.2, -1] });
    // the shard: a long six-sided sliver, point down, green light in its seams
    const top = [176, 40], bot = [159, 140], L = Math.hypot(bot[0] - top[0], bot[1] - top[1]);
    const ux = (bot[0] - top[0]) / L, uy = (bot[1] - top[1]) / L, nx = -uy, ny = ux;
    const P = (u, v) => [top[0] + ux * L * u + nx * v, top[1] + uy * L * u + ny * v];
    const T = P(0, 0), UL = P(0.2, -9), LL = P(0.74, -8), B = P(1, 0), LR = P(0.76, 8.6), UR = P(0.22, 7.6), C1 = P(0.2, 0.6), C2 = P(0.75, 0.4);
    const sx = (top[0] + bot[0]) / 2, sy = (top[1] + bot[1]) / 2;
    s.glow(sx, sy, 80, '#7dff6a', 0.22);
    s.glow(166, 182, 26, '#8cff6a', 0.45, 'breathe');
    s.add('<g data-part="shard">');
    s.path(poly([T, UL, LL, B, C2, C1]), '#0a0610');
    s.path(poly([T, C1, C2, B, LR, UR]), s.linU(UR[0], UR[1], LL[0], LL[1], [[0, '#2c2440'], [1, '#100a18']]));
    const veins = `M${pt(P(0.3, -2))}L${pt(P(0.42, 2))}L${pt(P(0.5, -1))}L${pt(P(0.62, 3))}M${pt(P(0.46, 0.5))}L${pt(P(0.52, 5))}`;
    s.add('</g>');
    s.bloom(`<g data-part="shard"><path d="M${pt(T)}L${pt(C1)}L${pt(C2)}L${pt(B)}M${pt(UL)}L${pt(LL)}L${pt(B)}L${pt(LR)}L${pt(UR)}L${pt(T)}L${pt(UL)}" fill="none" stroke="#9dff7a" stroke-width=".9" stroke-linejoin="round" opacity=".9"/>` +
      `<path d="${veins}" fill="none" stroke="#c8ff9a" stroke-width=".8"/>` +
      `<path d="M${f1(B[0] - 2.2)},${f1(B[1] - 1)}Q${f1(B[0])},${f1(B[1] + 9)} ${f1(B[0] + 2.2)},${f1(B[1] - 1)}Z" fill="#a8ff7a"/></g>` +
      '<g data-part="pool"><ellipse cx="164" cy="184" rx="11" ry="2.6" fill="#8cff6a" opacity=".85"/><ellipse cx="164" cy="183.6" rx="5" ry="1.2" fill="#e6ffcc"/></g>', { sd: 1.4, k: 1.5, box: [130, 30, 80, 170] });
    s.add([[B[0], B[1] + 14, 0], [B[0] + 1, B[1] + 28, -0.5], [B[0] + 2, B[1] + 38, -1]].map(([x, y, d]) =>
      `<ellipse class="fall" style="--d:${d}s" cx="${f1(x)}" cy="${f1(y)}" rx="1.4" ry="2.1" fill="#a8ff7a"/>`).join(''));
    // the fumes
    const fume = (x, y, h, sw, ph) => {
      const pts = [];
      for (let i = 0; i <= 6; i++) pts.push([x + Math.sin(ph + i * 1.1) * sw * (0.4 + i / 6), y - (h * i) / 6]);
      return taper(pts, [0.6, 2.6, 3.4, 3.4, 2.8, 1.8, 0.4]);
    };
    s.add(`<g fill="#9adf86">${[[150, 60, 46, 5, 0, 0.22], [188, 72, 52, 6, 2, 0.18], [168, 176, 40, 4, 1, 0.2], [140, 104, 40, 5, 3, 0.16]].map(([x, y, h, w, ph, o], i) =>
      `<path class="drift" style="--d:-${i * 2}s" d="${fume(x, y, h, w, ph)}" opacity="${o}"/>`).join('')}</g>`);
    s.motes({ seed: 12403, n: 16, x: [120, 210], y: [40, 180], r: [0.35, 0.9], fill: '#9dff7a', hot: '#f2ffe6', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── RADIANT ───────────────────────────────────────────────────────

  // A captain with her sword raised behind a tall shield; a line of
  // shield-bearers locks shields beside her, going back toward the sunrise.
  'shield-captain'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#26304f'], [0.34, '#4f5d84'], [0.62, '#b9a48c'], [0.8, '#f0c98e'], [1, '#e8a868']]));
    s.add(particles({ seed: 12501, n: 14, x: [0, W], y: [0, 60], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun coming up at the left
    const sx = 40, sy = 164;
    s.glow(sx, sy, 180, '#fff0c2', 0.85);
    s.shafts({ cx: sx, cy: sy, n: 16, from: -96, to: 6, len: 330, spread: 2, color: '#fff6dc', op: 0.22, seed: 12502 });
    s.glow(sx, sy, 50, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="14" fill="#fff8e6"/>`);
    s.layer(ridge({ seed: 12503, base: 170, amp: 16, freq: 2.2 }), '#9a8a82', { blur: 0.7 });
    s.haze(148, 176, '#f2c690', 0.36);
    s.path(poly([...spline([[-10, 196], [40, 192], [100, 190], [160, 188], [220, 186], [310, 184]], 6), [310, 214], [-10, 214]]), s.lin([[0, '#3a2c22'], [1, '#160f0a']]));
    // the shield wall going back to the right
    // (each a helmeted head over a tall round-topped shield, the shields
    // overlapping edge to edge, a spear held upright behind)
    const bearer = (x, b, k) => U(
      taper([[x - 3.6 * k, b - 12 * k], [x - 4.4 * k, b]], [4.4 * k, 3.8 * k], { per: 2 }), taper([[x + 3.6 * k, b - 12 * k], [x + 4.4 * k, b]], [4.4 * k, 3.8 * k], { per: 2 }),
      ell(x, b - 52 * k, 4.6 * k, 5.2 * k, 0, 14), ell(x, b - 54 * k, 5.4 * k, 3.6 * k, 0, 14), taper([[x - 6.4 * k, b - 51 * k], [x + 6.4 * k, b - 51 * k]], 1.6 * k, { per: 2 }),
      taper([[x - 2 * k, b - 58 * k], [x + 3 * k, b - 61 * k], [x + 8 * k, b - 58 * k]], [3 * k, 3.4 * k, 1 * k], { per: 3 }),
      taper([[x + 11 * k, b + 2], [x + 11 * k, b - 84 * k]], [1.6 * k, 1.3 * k], { per: 2 }), lens(x + 11 * k, b - 87 * k, 6 * k, 90, 0.38, 3),
    );
    const boss = (x, b, k) => `M${f1(x - 10 * k)},${f1(b - 10 * k)}L${f1(x - 10.6 * k)},${f1(b - 40 * k)}Q${f1(x)},${f1(b - 50 * k)} ${f1(x + 10.6 * k)},${f1(b - 40 * k)}L${f1(x + 10 * k)},${f1(b - 10 * k)}Q${f1(x)},${f1(b - 6 * k)} ${f1(x - 10 * k)},${f1(b - 10 * k)}Z`;
    const row = [[162, 190, 0.84], [182, 188.6, 0.77], [200, 187.4, 0.7], [216.6, 186.3, 0.64], [231.6, 185.4, 0.58], [245.4, 184.6, 0.53], [258, 184, 0.48], [269.6, 183.4, 0.44], [280.4, 183, 0.4], [290.4, 182.6, 0.37]];
    s.figure(`<path d="${U(row.map(([x, b, k]) => bearer(x, b, k)))}"/>`, { fill: '#2e2218', rim: p.rim, offsets: [[-1.2, -0.6], [-0.4, -1.2]], rimOp: 0.9, shade: 0.4, light: [-1, -0.5] });
    // their shields, each one a little in front of the one behind it
    s.figure(row.slice().reverse().map(([x, b, k]) => `<path d="${boss(x, b, k)}"/>`).join(''), { fill: s.lin([[0, '#5a4128'], [1, '#2e2218']]), rim: '#ffe7a8', offsets: [[-1.2, -0.5], [-0.4, -1.2]], rimOp: 0.95 });
    s.add(`<g data-part="rowdeco"><g fill="none" stroke="#1e140c" stroke-width="1.3" opacity=".85">${row.slice(0, -1).map(([x, b, k]) => `<path d="M${f1(x + 10 * k)},${f1(b - 11 * k)}L${f1(x + 10.6 * k)},${f1(b - 40 * k)}"/>`).join('')}</g>` +
      `<g fill="none" stroke="#d2a860" stroke-width=".9" opacity=".8">${row.map(([x, b, k]) => `<circle cx="${f1(x)}" cy="${f1(b - 27 * k)}" r="${f1(3.4 * k)}"/>`).join('')}</g></g>`);
    // the captain: plumed helm, cape behind, sword up, the tall shield
    // held across her body
    const cx = 104, cy = 193, place = at(cx, cy, 1);
    const her = place(U(
      taper([[-6, -36], [-8, -18], [-10, -2]], [8.6, 7, 6]), taper([[6, -36], [8, -18], [10, -2]], [8.6, 7, 6]),
      ell(-11.5, -1.4, 5.4, 2.2), ell(11.5, -1.4, 5.4, 2.2),
      poly([[-11, -50], [11, -50], [14, -34], [6, -37], [0, -33], [-6, -37], [-14, -34]]),
      taper([[0, -46], [0, -66], [0, -84]], [20, 21, 25]),
      ell(-13, -83, 8, 6, -12), ell(13, -83, 8, 6, 12),
      taper([[0, -86], [0, -92]], 6.4, { per: 2 }),
      ell(0, -99, 7.2, 8.2, 0, 16), taper([[-8.4, -97], [8.4, -97]], 2, { per: 2 }),
      blob([[-14, -101], [-12.6, -108], [-7.4, -113], [0, -115], [7.4, -113], [12.6, -108], [14, -101], [7, -104.6], [0, -105.6], [-7, -104.6]], 4),
      taper([[-15, -83], [-24, -95], [-27, -111]], [7.4, 6.4, 5.4]), ell(-27.4, -114, 4.2, 4),
      taper([[-35, -117.6], [-20, -117.6]], 2.6, { per: 2 }),
      blob([[-12, -84], [-20, -74], [-28, -56], [-34, -36], [-40, -18], [-46, -6], [-36, -10], [-30, -4], [-24, -12], [-18, -30], [-14, -52]], 4),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.3, -0.4], [-0.6, -1.2], [0.6, -1.1]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [-0.8, -0.6] });
    const shield = place('M-9,-20L-10,-76L-5,-84L8,-87L21,-84L26,-76L25,-20L8,-15Z');
    s.figure(`<path d="${shield}"/>`, { fill: s.linU(cx - 12, 0, cx + 28, 0, [[0, '#6a4c2a'], [0.5, '#4a3420'], [1, '#2e2016']]), rim: '#ffe7a8', offsets: [[-1.3, -0.4], [-0.5, -1.2]], rimOp: 0.95 });
    s.add(`<path data-part="shieldline" d="${place('M-6.5,-22L-7.5,-74L-3.5,-81L8,-84L19.5,-81L22.5,-74L21.5,-22L8,-18Z')}" fill="none" stroke="#b48a4a" stroke-width="1.1" opacity=".8"/>`);
    // her sword and the sun on her shield, catching the light
    s.glow(cx - 27.4, cy - 138, 40, '#fff0c2', 0.5, 'breathe');
    s.add('<g data-part="sunmark">'); s.glow(cx + 8, cy - 52, 22, '#ffd77a', 0.5); s.add('</g>');
    s.bloom(`<g data-part="sword"><path d="${place(taper([[-27.4, -118], [-27.4, -150], [-27.4, -164]], [3.8, 3.2, 0.4]))}" fill="#fff6dc"/>` +
      `<path d="${glint(cx - 27.4, cy - 150, 9, 0.14)}" fill="#ffffff"/></g>` +
      `<path data-part="sunmark" d="${sunMark(cx + 8, cy - 52, 4.6)}" fill="none" stroke="#ffd77a" stroke-width="1.6"/>` +
      `<path data-part="rowdeco" d="${row.map(([x, b, k]) => glint(x + 13 * k, b - 90 * k, 3.4 * k, 0.2)).join('')}" fill="#fff6dc"/>`, { sd: 1.6, k: 1.4, box: [40, 10, 260, 170] });
    s.motes({ seed: 12504, n: 18, x: [30, 290], y: [40, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // A living wall of golden stone with a stern carved face; arrows and a
  // spear break against it and fall.
  'bastion-wall'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#34446c'], [0.34, '#7884a6'], [0.6, '#dcc09a'], [0.82, '#f4d4a0'], [1, '#e8b07a']]));
    // the dawn breaking behind it
    s.glow(150, 54, 190, '#fff0c2', 0.8);
    s.shafts({ cx: 150, cy: 80, n: 22, from: -180, to: 0, len: 320, spread: 2, color: '#fff6dc', op: 0.24, seed: 12601 });
    s.layer(ridge({ seed: 12602, base: 176, amp: 14, freq: 2.4 }), '#a08c7e', { blur: 0.7 });
    s.haze(152, 182, '#f2c690', 0.34);
    s.path(poly([...spline([[-10, 196], [60, 192], [150, 194], [240, 191], [310, 195]], 6), [310, 214], [-10, 214]]), s.lin([[0, '#3e2e20'], [1, '#170f0a']]));
    // the wall, merlons along its top
    const x0 = 66, x1 = 234, top = 46, mt = 30, bot = 198;
    let outline = `M${x0},${bot}L${x0},${mt}`;
    for (let i = 0; i < 6; i++) {
      const a = x0 + i * 29.6;
      outline += `L${f1(a + 20)},${mt}` + (i < 5 ? `L${f1(a + 20)},${top}L${f1(a + 29.6)},${top}L${f1(a + 29.6)},${mt}` : '');
    }
    outline += `L${x1},${bot}Z`;
    s.figure(`<path d="${outline}"/>`, { fill: s.lin([[0, '#a07e4a'], [0.45, '#86663a'], [1, '#4e3820']]), rim: '#fff0c2', offsets: [[0, -1.4], [-1.2, -0.6], [1.2, -0.6]], rimOp: 0.95, edge: 0.3, light: [0, -1] });
    // courses of blocks, every other one offset; a few blocks lit warmer
    let mortar = '', lit = '';
    const R = rng(12603);
    for (let y = top + 16, row = 0; y < bot; y += 16, row++) {
      mortar += `M${x0},${y}H${x1}`;
      for (let x = x0 + (row % 2 ? 14 : 28); x < x1 - 4; x += 28) {
        mortar += `M${x},${y}V${Math.min(bot, y + 16)}`;
        if (R() < 0.18) lit += `M${x + 1.5},${y + 1.5}h25v13h-25Z`;
      }
    }
    for (let i = 0; i < 6; i++) mortar += `M${f1(x0 + i * 29.6 + 10)},${mt}V${top}`;
    mortar += `M${x0},${top}H${x1}`;
    s.add(`<g data-part="walldeco"><path d="${lit}" fill="#c49a5c" opacity=".35"/><path d="${mortar}" fill="none" stroke="#3a2814" stroke-width="1.6" opacity=".75"/></g>`);
    // the face carved in it: a heavy frowning brow, deep eyes, a straight
    // stern mouth
    s.add('<g data-part="brow">');
    s.path('M100,80L148,95L152,95L200,80L200,92L152,106L148,106L100,92Z', '#4a3420');
    s.path('M100,79L148,94L152,94L200,79', 'none', 'stroke="#f2d49a" stroke-width="1.6" opacity=".8"');
    s.add('</g><g data-part="eyes">');
    s.path(`${oval(126, 112, 15, 6.6, 8)}${oval(174, 112, 15, 6.6, -8)}`, '#24170c');
    s.add('</g><g data-part="nose">');
    s.path('M144,106L156,106L163,138L137,138Z', '#5c4226');
    s.path('M150,106L163,138L156,140', '#3a2814', 'opacity=".7"');
    s.add('</g><g data-part="mouth">');
    s.path('M118,158L130,152L170,152L182,158L170,156L130,156Z', '#24170c');
    s.add('</g>');
    // arrows in flight, arrows broken against it and falling, a snapped spear
    const arrow = (x, y, a, L) => rot(U(taper([[x - L, y], [x, y]], 1.4, { per: 2 }), poly([[x + 6, y], [x - 1, y - 2.6], [x - 1, y + 2.6]]),
      poly([[x - L, y], [x - L - 6, y - 3.4], [x - L + 2, y - 0.6]]), poly([[x - L, y], [x - L - 6, y + 3.4], [x - L + 2, y + 0.6]])), x, y, a);
    const broken = (x, y, a, L, head) => rot(U(taper([[x - L, y], [x, y]], 1.4, { per: 2 }), head ? poly([[x + 6, y], [x - 1, y - 2.6], [x - 1, y + 2.6]]) : poly([[x, y - 1], [x + 3, y - 0.2], [x + 1, y + 0.4], [x + 3.4, y + 1.2], [x, y + 0.8]]),
      poly([[x - L, y], [x - L - 6, y - 3.4], [x - L + 2, y - 0.6]])), x, y, a);
    const flying = [arrow(30, 58, 18, 24), arrow(18, 104, 8, 24), arrow(274, 70, 160, 24), arrow(288, 124, 172, 22), arrow(44, 146, 2, 22)];
    const falling = [broken(52, 126, 64, 14, true), broken(80, 176, 112, 12, false), broken(58, 186, 20, 10, true),
      broken(252, 104, 116, 13, true), broken(246, 172, 80, 12, false), broken(222, 192, 160, 10, true),
      rot(U(taper([[234, 142], [266, 142]], 2.6, { per: 2 }), poly([[268, 142], [262, 138.6], [262, 145.4]])), 250, 142, -50),
      rot(taper([[256, 182], [290, 182]], 2.6, { per: 2 }), 273, 182, 22)];
    s.figure(flying.map((d, i) => `<g data-part="fly${i}"><path d="${d}"/></g>`).join(''), { fill: '#2a1f15', rim: '#fff0c2', offsets: [[0, -0.8]], rimOp: 0.7 });
    falling.forEach((d, i) => { s.add(`<g data-part="fall${i}">`); s.path(d, '#2a1f15'); s.add('</g>'); });
    // its eyes, and sparks where the arrows strike
    const eyes = `${oval(126, 112, 8.6, 2.2, 8)}${oval(174, 112, 8.6, 2.2, -8)}`;
    s.add('<g data-part="eyes">'); s.glow(126, 112, 16, '#ffd77a', 0.7).glow(174, 112, 16, '#ffd77a', 0.7); s.add('</g>');
    const spark = (x, y, a) => [-40, -20, 0, 20, 40].map((d, i) => { const [ex, ey] = toward(x, y, a + d, i % 2 ? 6 : 9); return `M${x},${y}L${f1(ex)},${f1(ey)}`; }).join('');
    s.bloom(`<path data-part="eyes" d="${eyes}" fill="#fff4c8"/>` +
      `<g stroke="#fff0c2" stroke-width="1.1" stroke-linecap="round">${[[68, 70, 200], [232, 118, -20], [68, 150, 180], [232, 160, 0]].map(([x, y, a], i) => `<path data-part="burst${i}" d="${spark(x, y, a)}"/>`).join('')}</g>`, { sd: 1.4, k: 1.5, box: [40, 50, 220, 130] });
    s.add('<g data-part="pebbles">'); s.path(dots([[72, 196, 3.4], [84, 198, 2.6], [218, 197, 3], [230, 199, 2.4], [62, 199, 2.2]]), '#2a1f15'); s.add('</g>');
    s.motes({ seed: 12604, n: 16, x: [20, 280], y: [30, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // A medic in a pale tabard kneels by a wounded knight propped against a
  // rock, winding a bandage of golden light round his arm.
  'field-medic'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#2a3456'], [0.32, '#55628a'], [0.6, '#c2a88a'], [0.8, '#f0c88e'], [1, '#e6a468']]));
    s.add(particles({ seed: 12701, n: 12, x: [0, W], y: [0, 56], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    const sx = 62, sy = 150;
    s.glow(sx, sy, 170, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 14, from: -120, to: 0, len: 300, spread: 2, color: '#fff6dc', op: 0.2, seed: 12702 });
    s.glow(sx, sy, 40, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="11" fill="#fff8e6"/>`);
    // the field behind: banners and spears standing in it
    const R = rng(12703);
    let spears = '';
    for (let i = 0; i < 12; i++) {
      const x = 100 + R() * 200, a = (R() - 0.5) * 36, h = 9 + R() * 7, [tx, ty] = toward(x, 160, a - 90, h);
      spears += `M${f1(x)},160L${f1(tx)},${f1(ty)}`;
    }
    s.blur(`<path d="${ridge({ seed: 12704, base: 164, amp: 12, freq: 2.2 })}" fill="#9a8678"/><path d="${spears}" stroke="#9a8678" stroke-width="1"/>` +
      '<path d="M236,160L238,130L239.4,130L237.6,160ZM238.6,131L252,134L246,138L251,143L238.4,141Z" fill="#9a8678"/>', 0.6);
    s.haze(140, 170, '#f2c690', 0.34);
    s.path(poly([...spline([[-10, 192], [60, 188], [130, 189], [200, 186], [260, 188], [310, 186]], 6), [310, 214], [-10, 214]]), s.lin([[0, '#3a2c20'], [1, '#160f0a']]));
    // (the two of them are drawn at 1.18 about the point (170, 190))
    const Z = at(170 - 170 * 1.18, 190 - 190 * 1.18, 1.18), zp = (x, y) => [170 + (x - 170) * 1.18, 190 + (y - 190) * 1.18];
    // the rock he leans on, his sword against it, his helm on the grass
    s.figure(`<path d="${Z(blob([[198, 192], [200, 166], [212, 150], [234, 145], [252, 154], [260, 174], [256, 194]], 5))}"/>`, { fill: '#2a2018', rim: p.rim, offsets: [[-1, -1]], rimOp: 0.6 });
    // the knight: sitting, back to the rock, one knee up, his arm held out
    const knight = U(
      taper([[196, 182], [176, 182], [158, 185]], [11, 9, 7.4]), ell(155, 182, 4.4, 6),
      taper([[194, 178], [186, 170], [178, 162]], [11, 10, 9]), taper([[178, 162], [175, 174], [172, 186]], [8, 7, 6.4]), ell(168, 187, 5, 2.4),
      taper([[198, 178], [203, 156], [208, 138]], [18, 19, 22]),
      ell(204, 138, 7.4, 5.4), taper([[206, 134], [205, 128]], 5.4, { per: 2 }),
      profile(205, 121, 0.95, 14, -1), ell(208.6, 118.6, 6.4, 6),
      taper([[200, 140], [192, 147], [186, 152]], [8, 7, 6.4]), taper([[186, 152], [176, 151], [166, 150]], [6.4, 5.8, 5]), ell(163, 150, 3.6, 3),
      taper([[213, 142], [217, 160], [215, 176]], [7, 6, 5]),
      blob([[226, 192], [226, 183], [229, 178], [234, 176], [239, 178], [242, 183], [242, 192]], 3), taper([[234, 176], [239, 172], [246, 173], [250, 178]], [3, 3.4, 2.4, 0.6]),
      taper([[246, 196], [262, 150]], 2, { per: 2 }), taper([[252, 163], [262, 167]], 2, { per: 2 }),
    );
    s.figure(`<path d="${Z(knight)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.6], [-0.4, -1.2]], rimOp: 0.9, shade: 0.45, light: [-1, -0.6] });
    // the medic: kneeling, head bent over his arm, both hands at the binding
    const medic = U(
      taper([[124, 170], [128, 180], [131, 186]], [10, 9, 8]), taper([[131, 186], [120, 188], [108, 189]], [7, 6, 5]),
      taper([[128, 170], [138, 166], [146, 164]], [10, 9, 8.4]), taper([[146, 164], [147, 176], [148, 187]], [7.4, 6.4, 5.6]), ell(151, 188, 5, 2.2),
      blob([[114, 168], [132, 163], [141, 172], [134, 184], [118, 187], [110, 180]], 4),
      taper([[124, 170], [128, 152], [134, 134]], [16, 16, 18]),
      taper([[136, 132], [138, 126]], 5.4, { per: 2 }),
      profile(141, 119, 0.95, 26),
      ell(136.4, 116.4, 7.2, 7.6), taper([[133, 112], [126, 122], [121, 138]], [10, 8, 3]),
    );
    const arms = U(
      taper([[136, 135], [149, 144], [166, 146]], [6, 5.4, 4.6]), ell(168, 146, 3.2, 2.8),
      taper([[131, 138], [144, 154], [168, 155]], [6.4, 5.6, 4.8]), ell(171, 155, 3.2, 2.8),
    );
    // (each piece keeps the whole figure's bounding box, so its light shades exactly as it did: two
    // zero-length marks at its corners)
    const xy = [...(Z(medic) + Z(arms)).matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [+m[1], +m[2]]);
    const pin = `M${f1(Math.min(...xy.map((q) => q[0])))},${f1(Math.min(...xy.map((q) => q[1])))}ZM${f1(Math.max(...xy.map((q) => q[0])))},${f1(Math.max(...xy.map((q) => q[1])))}Z`;
    s.figure(`<g data-part="arms"><path d="${Z(arms)}${pin}"/></g><g data-part="her"><path d="${Z(medic)}${pin}"/></g>`, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.6], [-0.4, -1.2]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-1, -0.6] });
    // her tabard, pale even in the shade, the sun sewn on it
    s.add('<g data-part="tabard">');
    s.path(Z('M128,138L137,136L136,170L125,171Z'), s.lin([[0, '#b2a48c'], [1, '#76685a']]));
    s.path(Z('M124.6,160L136.6,159L136.5,162L124.5,163Z'), '#2a1f15');
    s.add(`<path d="${Z('M128,138L137,136M125,171L136,170')}" stroke="#2a1f15" stroke-width="1"/>`);
    const [ex, ey] = zp(131, 150);
    s.add(`<path d="${sunMark(ex, ey, 2.6)}" fill="none" stroke="#c99a4a" stroke-width="1"/>`);
    s.add('</g>');
    // the bandage of light: four turns round his forearm, the roll in her
    // hand, a curl of light lifting off it
    const [bx, by] = zp(177, 151);
    s.glow(bx, by, 40, '#ffe9a8', 0.6, 'breathe');
    let wraps = '';
    for (let i = 0; i < 4; i++) wraps += poly([[172 + i * 3.6, 146.4], [174.4 + i * 3.6, 146.4], [173 + i * 3.6, 155.4], [170.6 + i * 3.6, 155.4]]);
    const loose = [[172, 155], [170, 160], [166, 162]], curl = [[183, 147], [186, 140], [182, 134], [176, 135], [177, 140]];
    s.bloom(`<path data-part="wraps" d="${Z(wraps)}" fill="#fff4cc"/><path data-part="loose" d="${Z(taper(loose, [2.4, 2.2, 1.6]))}" fill="#ffe7a0"/>` +
      `<path data-part="curl" d="${Z(taper(curl, [1.6, 1.4, 1.1, 0.7, 0.3]))}" fill="#ffe7a0" opacity=".8"/>`, { sd: 1.4, k: 1.5, box: [150, 120, 80, 70] });
    s.motes({ seed: 12705, n: 14, x: [150, 220], y: [110, 180], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 12706, n: 10, x: [20, 280], y: [60, 190], r: [0.5, 1.1], fill: '#fff6d8', cls: 'float', t: [5, 9], op: [0.3, 0.7] }));
    return s.svg();
  },

  // A great moth whose body is a glowing paper lantern flies over a dark
  // meadow at dusk; a swarm of small ones flies with it, and more rise from
  // the grass to join them.
  'lantern-moth'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#1a2042'], [0.36, '#384270'], [0.62, '#9a8890'], [0.78, '#e8b87c'], [0.86, '#d89a64']]));
    s.add(particles({ seed: 12801, n: 26, x: [0, W], y: [0, 90], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.9], t: [2.5, 6] }));
    s.glow(150, 184, 170, '#ffd9a0', 0.55);
    s.layer(ridge({ seed: 12802, base: 176, amp: 16, freq: 2.4 }) + pines({ seed: 12805, base: 172, x0: 16, x1: 70, h: [14, 24], gap: [7, 11] }) + pines({ seed: 12806, base: 170, x0: 222, x1: 290, h: [14, 26], gap: [7, 11] }), '#5a4a50', { blur: 0.7 });
    s.haze(152, 180, '#e8b07a', 0.34);
    // the meadow
    s.path(ledge([[-10, 186], [60, 182], [130, 184], [200, 181], [260, 184], [310, 182]]), s.lin([[0, '#2a2024'], [1, '#0c0809']]));
    // the swarm: small moths, each a spark of light with two dark wings,
    // trailing up out of the grass and off into the dusk
    const swarm = [[58, 170, 0.5], [70, 150, 0.55], [52, 128, 0.6], [84, 120, 0.62], [70, 98, 0.66], [100, 60, 0.6], [214, 52, 0.64], [236, 78, 0.6], [252, 46, 0.52],
      [228, 128, 0.62], [246, 152, 0.55], [204, 168, 0.5], [270, 104, 0.5], [118, 34, 0.48], [186, 28, 0.46], [284, 64, 0.42]];
    const small = (x, y, k) => U(lens(x - 4 * k, y - 1.6 * k, 9 * k, -24, 0.62, 3), lens(x + 4 * k, y - 1.6 * k, 9 * k, 24, 0.62, 3),
      lens(x - 3 * k, y + 2.6 * k, 6 * k, 30, 0.6, 3), lens(x + 3 * k, y + 2.6 * k, 6 * k, -30, 0.6, 3));
    for (const [x, y, k] of swarm) s.glow(x, y + 1, 5 + 9 * k, '#ffd77a', 0.75);
    for (let g = 0; g < 3; g++) {
      const mine = swarm.filter((_, i) => i % 3 === g);
      s.add(`<g class="float" style="--t:${5 + g * 1.5}s;--d:-${g * 2}s"><path d="${U(mine.map(([x, y, k]) => small(x, y, k)))}" fill="#2a1f18"/>` +
        `<path d="${dots(mine.map(([x, y, k]) => [x, y + 1, 1.8 * k + 0.6]))}" fill="#fff4cc"/></g>`);
    }
    // the great moth: broad forewings and round hindwings spread wide,
    // feathered feelers, and the lantern of its body hanging below
    const mx = 150, my = 92;
    const wingR = U(blob([[154, 80], [170, 66], [192, 55], [216, 48], [230, 51], [228, 64], [210, 82], [186, 94], [162, 94]], 5),
      blob([[156, 94], [176, 97], [196, 106], [206, 119], [196, 130], [176, 126], [162, 114], [156, 104]], 5));
    const wings = wingR + flipX(wingR, mx);
    s.glow(mx, my + 10, 110, '#ffe2a0', 0.5);
    s.figure(`<path d="${wings}"/>`, { fill: s.radU(mx, my + 12, 84, [[0, '#8a6038'], [0.3, '#4a3424'], [1, '#1e1610']]), rim: '#ffe7b0', offsets: [[0, -1.2], [-0.8, -0.7], [0.8, -0.7]], rimOp: 0.85, edge: 0.3, light: [0, -1] });
    const veins = [[162, 90, 228, 56], [160, 88, 210, 64], [162, 92, 222, 72], [160, 100, 202, 116], [158, 104, 190, 126]].map(([a, b, c, d]) =>
      `M${a},${b}Q${(a + c) / 2},${(b + d) / 2 - 6} ${c},${d}M${2 * mx - a},${b}Q${2 * mx - (a + c) / 2},${(b + d) / 2 - 6} ${2 * mx - c},${d}`).join('');
    s.add(`<path d="${veins}" fill="none" stroke="#d8a860" stroke-width=".8" opacity=".5"/>` +
      `<g fill="none" stroke="#e8b870" stroke-width="1.2" opacity=".55"><circle cx="196" cy="70" r="6"/><circle cx="104" cy="70" r="6"/><circle cx="186" cy="112" r="4"/><circle cx="114" cy="112" r="4"/></g>`);
    const feeler = (dir) => [taper([[mx + 2 * dir, 72], [mx + 9 * dir, 58], [mx + 18 * dir, 48]], [1.6, 1.2, 0.5], { per: 4 }),
      ...[0.3, 0.5, 0.7, 0.88].map((t) => { const x = mx + 2 * dir + 16 * dir * t, y = 72 - 24 * t; return leafAt(x, y, dir > 0 ? -20 : 200, 5 - 2 * t, 0.36, 3) + leafAt(x, y, dir > 0 ? 70 : 110, 4 - 1.6 * t, 0.36, 3); })];
    s.figure(`<path d="${U(ell(mx, 82, 6, 7.4), ell(mx, 72.6, 4.4, 4), feeler(1), feeler(-1), taper([[mx, 88], [mx, 92]], 6, { per: 2 }))}"/>`, { fill: '#241a12', rim: '#ffe7b0', offsets: [[0, -1.1]], rimOp: 0.9 });
    // the lantern: ribbed, all light, a dark cap and a little tassel
    s.glow(mx, 108, 30, '#fff0c2', 0.85, 'breathe');
    const lb = s.radU(mx, 106, 16, [[0, '#ffffff'], [0.45, '#fff4cc'], [1, '#ffcf6a']]);
    s.bloom(`<ellipse cx="${mx}" cy="107" rx="8.4" ry="14" fill="${lb}"/>` +
      `<path d="M${mx - 7.4},100H${mx + 7.4}M${mx - 8.4},106H${mx + 8.4}M${mx - 7.8},112H${mx + 7.8}M${mx - 5.6},117H${mx + 5.6}" stroke="#e0a040" stroke-width=".7" opacity=".8"/>` +
      `<path d="M${mx - 4},93H${mx + 4}L${mx + 3},95.6H${mx - 3}ZM${mx - 3.4},120H${mx + 3.4}L${mx + 2.4},122.6H${mx - 2.4}Z" fill="#3a2a1a"/><path d="M${mx},122.6V129" stroke="#ffd77a" stroke-width="1"/>`, { sd: 1.6, k: 1.5, box: [110, 70, 80, 80] });
    // grass and seed heads in front
    const G = rng(12803), blades = [];
    for (let x = -8; x < 312; x += 3 + G() * 4) {
      const edge = x < 80 || x > 220, h = (edge ? 14 : 6) + G() * (edge ? 22 : 10), l = (G() - 0.5) * 10;
      blades.push(taper([[x, 216], [x + l * 0.4, 214 - h * 0.5], [x + l, 214 - h]], [1.8, 1.1, 0.3], { per: 4 }));
      if (edge && G() < 0.25) blades.push(ell(x + l, 212 - h, 1.6, 3.4, l * 3));
    }
    s.path(U(blades), '#0c0809');
    s.motes({ seed: 12804, n: 16, x: [40, 260], y: [30, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // In a ruined chapel at dawn a priestess sings with her hands raised;
  // golden notes of light drift over and settle on a wounded soldier.
  'menders-hymn'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#2a3456'], [0.3, '#56628a'], [0.58, '#c8ae8e'], [0.8, '#f2cc90'], [1, '#e8a868']]));
    s.add(particles({ seed: 12901, n: 14, x: [0, W], y: [0, 60], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun, low behind the chapel's broken arch
    const sx = 150, sy = 150;
    s.glow(sx, sy, 170, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 18, from: -180, to: 0, len: 300, spread: 2, color: '#fff6dc', op: 0.22, seed: 12902 });
    s.glow(sx, sy, 46, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="13" fill="#fff8e6"/>`);
    s.layer('M92,178V66C92,40 118,24 150,22C168,23 178,28 184,34L178,44C172,38 162,34 150,34C126,36 106,48 106,70V178ZM190,178V92L196,84L200,90L204,86V178Z' +
      ridge({ seed: 12903, base: 178, amp: 10, freq: 2.2 }), '#a08c88', { blur: 0.7 });
    s.haze(150, 182, '#f2c690', 0.34);
    s.path(poly([...spline([[-10, 192], [60, 188], [130, 190], [200, 188], [260, 190], [310, 187]], 6), [310, 214], [-10, 214]]), s.lin([[0, '#3a2c22'], [1, '#160f0a']]));
    s.add('<path d="M20,198H90M110,196H180M200,198H290M40,206H130M160,207H250" stroke="#4e3c2c" stroke-width="1" opacity=".7"/>');
    // the priestess: veil streaming back, head tipped up in song, both
    // hands raised and open
    const place = at(92, 189, 1.04);
    const her = place(U(
      blob([[-8, -66], [8, -66], [11, -48], [14, -28], [17, -8], [19, 0], [-19, 0], [-24, -5], [-30, -3], [-21, -14], [-14, -30], [-11, -48]], 4),
      taper([[0, -62], [0, -76], [0, -88]], [12, 12, 15]),
      taper([[1, -88], [2, -94]], 5, { per: 2 }),
      profile(4, -100, 1, -28),
      blob([[-3, -108], [3, -110], [6, -106], [2, -100], [-2, -94], [-5, -84], [-7, -72], [-8, -62], [-14, -64], [-14, -76], [-12, -90], [-8, -102]], 4),
      taper([[4, -86], [14, -96], [21, -108]], [5.4, 4.6, 4]), ell(22.4, -110.6, 3.4, 2.4, -30), taper([[21, -111], [23, -116]], [2, 0.8], { per: 2 }),
      taper([[-2, -86], [8, -100], [12, -116]], [5.4, 4.6, 4]), ell(13, -118.6, 3.2, 2.3, -55), taper([[12, -119], [12.6, -124]], [1.8, 0.7], { per: 2 }),
      taper([[6, -92], [12, -86], [14, -78]], [8, 6, 1.4]), taper([[0, -92], [4, -84], [5, -76]], [7, 5, 1.2]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0.9, -1], [0, -1.3], [1.2, 0]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [0.8, -0.6] });
    // the soldier, down on one knee, sword planted, his head bowed
    const placeS = at(212, 189, 1, -1);
    const him = placeS(U(
      taper([[0, -28], [3, -16], [6, -4]], [10, 9, 8]), taper([[6, -4], [-4, -2], [-14, -1]], [7, 6, 5]),
      taper([[2, -28], [10, -28], [18, -26]], [10, 9, 8]), taper([[18, -26], [19, -13], [20, -1]], [7.4, 6.4, 5.6]), ell(23, -1, 5, 2.2),
      taper([[0, -28], [4, -46], [8, -62]], [16, 17, 20]),
      ell(6, -60, 8, 5.6, 20), taper([[10, -64], [13, -68]], 5.4, { per: 2 }),
      profile(16, -74, 0.95, 34), ell(13.4, -76.4, 7.4, 6.6, 20),
      taper([[10, -58], [18, -48], [25, -38]], [6.6, 5.6, 4.6]),
      taper([[27, 0], [27, -33]], [0.6, 2.6], { per: 2 }), taper([[21, -33], [33, -33]], 2.2, { per: 2 }), taper([[27, -33], [27, -40]], 2.4, { per: 2 }),
      taper([[4, -58], [0, -48], [6, -42]], [6.4, 5.4, 4.6]),
      blob([[2, -62], [-8, -56], [-14, -40], [-18, -22], [-24, -4], [-12, -8], [-6, -24], [-2, -40]], 4),
    ));
    s.figure(`<path d="${him}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-0.9, -1], [0, -1.3], [-1.2, 0]], rimOp: 0.9, shade: 0.45, light: [-0.8, -0.6] });
    // the notes: they leave her hands in an arc and come down on him
    const path = spline([[118, 66], [128, 46], [148, 34], [170, 36], [188, 50], [198, 72], [202, 96], [204, 118]], 10);
    const note = (x, y, k) => ({ head: oval(x, y, 2.5 * k, 1.8 * k, -20), stem: `M${f1(x + 2.2 * k)},${f1(y - 0.6 * k)}V${f1(y - 10 * k)}q${f1(3.4 * k)},${f1(2 * k)} ${f1(4.2 * k)},${f1(6.4 * k)}` });
    const notes = [];
    for (let i = 0; i < 12; i++) {
      const u = 0.04 + (0.92 * i) / 11, [x, y] = path[Math.round(u * (path.length - 1))];
      notes.push([x + (i % 2 ? 5 : -5), y + (i % 3) * 3, 0.7 + 0.35 * Math.sin(Math.PI * u)]);
    }
    s.glow(202, 128, 46, '#ffe9a8', 0.5, 'breathe');
    for (const [x, y, k] of notes) s.glow(x, y - 3, 7 + 6 * k, '#fff1c4', 0.6);
    for (let g = 0; g < 3; g++) {
      const mine = notes.filter((_, i) => i % 3 === g).map(([x, y, k]) => note(x, y, k));
      s.add(`<g class="float" style="--t:${5 + g * 1.4}s;--d:-${g * 1.8}s"><path d="${mine.map((n) => n.head).join('')}" fill="#fff6d8"/>` +
        `<path d="${mine.map((n) => n.stem).join('')}" fill="none" stroke="#fff6d8" stroke-width="1.1" stroke-linecap="round"/></g>`);
    }
    s.motes({ seed: 12904, n: 18, x: [110, 220], y: [30, 150], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [4, 8], op: [0.5, 1] });
    s.motes({ seed: 12905, n: 10, x: [184, 228], y: [110, 170], r: [0.4, 1], fill: '#fff1c4', hot: '#ffffff', cls: 'fall', t: [3, 6], op: [0.5, 1] });
    return s.svg();
  },

  // In a dim temple villagers set small candles into a great golden bowl;
  // its light climbs to the rafters.
  'tithe-of-light'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#1e1a2a'], [0.5, '#3a2c30'], [1, '#1c1412']]));
    // tall windows in the far wall, the dawn in them
    const lancet = (x0, x1, t, b) => { const m = (x0 + x1) / 2; return `M${x0},${b}V${t + 12}Q${x0},${t} ${m},${t - 4}Q${x1},${t} ${x1},${t + 12}V${b}Z`; };
    s.glow(66, 80, 60, '#ffe2a6', 0.3).glow(234, 80, 60, '#ffe2a6', 0.3);
    s.path(lancet(56, 76, 42, 128) + lancet(224, 244, 42, 128), s.lin([[0, '#a9bed8'], [0.55, '#f0d7a2'], [1, '#f7c27c']]));
    s.add('<path d="M66,40V128M56,84H76M234,40V128M224,84H244" stroke="#1e1a2a" stroke-width="2"/>');
    // the bowl's light, climbing to the roof
    s.glow(150, 118, 160, '#ffe9b0', 0.75);
    s.shafts({ cx: 150, cy: 128, n: 12, from: -128, to: -52, len: 190, spread: 2.6, color: '#fff3cc', op: 0.32, seed: 13001, sd: 2.6 });
    // the rafters, lit from below
    s.figure('<path d="M-10,24H310V31H-10Z"/><path d="M150,-14L-10,48L-10,40L150,-22L310,40L310,48Z"/><path d="M146,-16H154V27H146Z"/><path d="M148,12L96,28L98,32L150,18ZM152,12L204,28L202,32L150,18Z"/>',
      { fill: '#1a120e', rim: '#ffd88a', offsets: [[0, 1.3]], rimOp: 0.85, light: [0, 1] });
    s.glow(150, 30, 60, '#fff0c2', 0.35);
    // pillars at either hand
    s.figure('<path d="M10,214V44H34V214Z"/><path d="M266,214V44H290V214Z"/><path d="M4,52H40V44H4ZM260,52H296V44H260Z"/>', { fill: '#16100c', rim: '#ffd88a', offsets: [[1.2, 0], [-1.2, 0]], rimOp: 0.5 });
    // the floor, the pool of light on it
    s.path('M-10,214V186H310V214Z', s.lin([[0, '#4a3628'], [1, '#18100c']]));
    s.add(`<ellipse cx="150" cy="190" rx="110" ry="12" fill="${s.rad([[0, '#ffdc94', 0.6], [0.55, '#ffd27a', 0.22], [1, '#ffd27a', 0]])}"/>`);
    // the bowl on its pedestal
    s.figure('<path d="M132,186V160H168V186Z"/><path d="M122,192V186H178V192Z"/><path d="M140,160V154H160V160Z"/>', { fill: '#2a1f15', rim: '#ffe7a8', offsets: [[0, -1.2], [-1, 0], [1, 0]], rimOp: 0.8 });
    const gold = s.linU(98, 0, 202, 0, [[0, '#7a4e1c'], [0.3, '#e8b44c'], [0.5, '#fff0b0'], [0.7, '#e0a640'], [1, '#6a4214']]);
    s.path('M98,126C100,142 118,154 140,155H160C182,154 200,142 202,126Z', gold);
    s.add('<path d="M104,134C112,144 124,150 140,151H160C176,150 188,144 196,134" fill="none" stroke="#a87830" stroke-width="1" opacity=".7"/>');
    // the candles in it, a crowd of small flames
    const R = rng(13002), flames = [], wicks = [];
    for (let i = 0; i < 26; i++) {
      const a = R() * Math.PI * 2, d = Math.sqrt(R()), x = 150 + Math.cos(a) * d * 44, y = 126 + Math.sin(a) * d * 6;
      flames.push(flame(x, y - 3, 5 + R() * 3, (R() - 0.5) * 1.6));
      wicks.push(`M${f1(x - 1.4)},${f1(y)}h2.8v-3h-2.8Z`);
    }
    s.glow(150, 120, 60, '#fff0c2', 0.8, 'breathe');
    s.bloom(`<path d="${oval(150, 126, 52, 8.6)}" fill="#ffe7a0"/><path d="${wicks.join('')}" fill="#fff4dc"/><path d="${flames.join('')}" fill="#fffaf0"/>` +
      `<path d="${oval(150, 126, 52, 8.6)}" fill="none" stroke="#fff6d8" stroke-width="1.2"/>`, { sd: 1.8, k: 1.4, box: [80, 90, 140, 60] });
    // the villagers: a woman reaching up to set her candle in, a child
    // holding one up, an old man with his stick waiting his turn
    const woman = at(82, 192, 1)(U(
      blob([[-7, -48], [7, -48], [10, -30], [13, -10], [15, 0], [-15, 0], [-12, -10], [-10, -30]], 4),
      taper([[0, -44], [3, -58], [7, -70]], [11, 11, 13]),
      taper([[8, -70], [10, -75]], 4.6, { per: 2 }),
      profile(12, -80, 0.9, -24), taper([[8, -84], [2, -82], [-2, -74], [-4, -62]], [8, 8, 5, 1]),
      taper([[10, -68], [18, -76], [24, -88]], [5, 4.2, 3.6]), ell(25, -90, 2.8, 2.6),
      taper([[4, -68], [12, -62], [18, -58]], [5, 4.2, 3.6]),
    ));
    const child = at(196, 192, 0.62, -1)(U(
      blob([[-7, -48], [7, -48], [10, -30], [12, -10], [13, 0], [-13, 0], [-11, -10], [-10, -30]], 4),
      taper([[0, -44], [1, -58], [2, -68]], [11, 11, 12]), taper([[2, -70], [3, -75]], 4.6, { per: 2 }),
      ell(4, -82, 7.4, 8), taper([[6, -66], [14, -74], [20, -84]], [5, 4.2, 3.6]), ell(21, -86, 2.8, 2.6),
    ));
    const old = at(226, 192, 1.02, -1)(U(
      blob([[-8, -50], [8, -50], [11, -30], [13, -10], [15, 0], [-15, 0], [-13, -10], [-11, -30]], 4),
      taper([[0, -46], [4, -58], [10, -68]], [12, 12, 13]),
      taper([[12, -68], [16, -72]], 4.6, { per: 2 }), profile(19, -76, 0.9, 10), ell(15, -78, 6.6, 6.2),
      taper([[12, -64], [20, -56], [24, -54]], [5, 4.2, 3.6]), taper([[8, -62], [16, -52], [23, -51]], [5, 4.2, 3.6]),
      taper([[-6, -60], [-14, -44], [-20, -30]], [5, 4.2, 3.6]), taper([[-21, -32], [-24, 0]], [2, 2], { per: 2 }),
    ));
    s.figure(`<path d="${woman}${child}${old}"/>`, { fill: p.fig, rim: '#ffe7b0', offsets: [[1.2, -0.6], [-1.2, -0.6], [0, -1.2]], rimOp: 0.9, shade: 0.4, light: [0, -1] });
    // their candles
    const held = [[107, 101, 7], [183, 138, 5], [204, 136, 6]];
    s.add(`<g fill="#e8dcc4">${held.map(([x, y, h]) => `<rect x="${x - 1.6}" y="${y}" width="3.2" height="${h}" rx=".6"/>`).join('')}</g>`);
    for (const [x, y] of held) s.glow(x, y - 4, 12, '#fff0c2', 0.8);
    s.add(`<path d="${held.map(([x, y]) => flame(x, y - 0.5, 6, 0.6)).join('')}" fill="#fffaf0"/>`);
    s.motes({ seed: 13003, n: 22, x: [100, 200], y: [20, 124], r: [0.4, 1.1], fill: '#ffe39a', hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    return s.svg();
  },

  // A FIELD. Inside a grotto, looking out through its sunlit mouth: a
  // clear spring pool fills the floor, gold light dancing on the water and
  // the rock, and a wounded young stag stands at the edge to drink.
  'sanctuary-spring'(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    // outside: a pale morning sky, a sunlit meadow and trees beyond the mouth
    s.rect(s.lin([[0, '#9fb8d2'], [0.3, '#dcd6c0'], [0.55, '#f6deaa'], [0.75, '#efc88a']]));
    const sx = 168, sy = 76;
    s.glow(sx, sy, 160, '#fff6d8', 0.9);
    s.glow(sx, sy, 40, '#fffcf0', 0.85);
    s.layer(ridge({ seed: 13101, base: 128, amp: 22, freq: 2.4 }), '#d8c290', { blur: 0.8 });
    s.haze(100, 134, '#fff2cc', 0.4);
    s.path(ridge({ seed: 13102, base: 150, amp: 12, freq: 3 }), '#b8a068');
    // the pool, the bright mouth mirrored in it
    s.path('M-10,214V148H310V214Z', s.lin([[0, '#f2d69c'], [0.1, '#b89058'], [0.45, '#5a4228'], [1, '#22180e']]));
    s.add(`<ellipse cx="156" cy="150" rx="96" ry="44" fill="${s.rad([[0, '#fff2cc', 0.7], [0.5, '#ffe2a0', 0.3], [1, '#ffe2a0', 0]], { cx: 0.5, cy: 0.1, r: 0.6 })}"/>`);
    s.add(shimmer([[150, 154, 120, 0.5], [146, 160, 96, 0.45], [156, 167, 110, 0.38], [148, 175, 80, 0.32], [154, 184, 96, 0.26], [150, 194, 64, 0.2]], '#fff6d8'));
    // light falling in through the mouth onto the water
    s.shafts({ cx: sx, cy: sy - 30, n: 10, from: 70, to: 140, len: 220, spread: 2.6, color: '#fff6d8', op: 0.3, seed: 13103, sd: 2.4 });
    // the stag on a shelf of rock at the water's edge, neck stretched down
    // to drink, small antlers, a healing wound glowing on his shoulder
    s.path(U(blob([[158, 190], [162, 181], [172, 177], [186, 179], [196, 175], [214, 174], [230, 177], [244, 174], [262, 170], [282, 172], [292, 190]], 5), blob([[150, 192], [154, 185], [166, 184], [170, 192]], 3)), '#1e160e');
    const stag = U(
      blob([[190, 120], [206, 114], [228, 114], [244, 119], [251, 129], [247, 141], [232, 146], [208, 146], [194, 141], [186, 131]], 5),
      taper([[200, 124], [188, 138], [178, 152]], [16, 12, 8.6]),
      ell(173, 156, 8, 5, 40), taper([[169, 159], [163, 165]], [5.6, 4.2], { per: 2 }),
      lens(182, 147, 8, -64, 0.44, 3), lens(185, 150, 7, -14, 0.44, 3),
      taper([[180, 148], [185, 137], [183, 126]], [2.4, 2, 0.6]), taper([[184, 139], [192, 134]], [1.6, 0.4], { per: 2 }), taper([[183.6, 131], [177, 126]], [1.4, 0.4], { per: 2 }),
      taper([[196, 139], [195, 156], [196, 176]], [8.6, 5.4, 3.6]), taper([[205, 141], [206, 158], [205, 176]], [8, 5, 3.4]),
      taper([[236, 140], [242, 154], [238, 165], [240, 176]], [12, 6.4, 4.2, 3.4]), taper([[246, 136], [251, 151], [248, 163], [250, 174]], [10.6, 6, 4, 3.2]),
      taper([[249, 122], [254, 116], [256, 112]], [4.4, 3.4, 1]),
    );
    s.figure(`<path d="${stag}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [-0.3, -1] });
    // the cave: dark rock all round the mouth, teeth of stone hanging from
    // its lip, gold light from the water dancing on its walls
    const R = rng(13104), lip = [];
    for (let i = 0; i <= 26; i++) {
      const a = rad(180 + (180 * i) / 26), r = 1 + (R() - 0.5) * 0.08;
      lip.push([150 + Math.cos(a) * 98 * r, 150 + Math.sin(a) * 128 * r]);
    }
    const mouth = `M-10,-10H310V214H-10Z${poly([[44, 150], ...lip.slice(1, -1), [256, 150], [262, 214], [38, 214]])}`;
    let teeth = '';
    for (let i = 3; i < 24; i += 2) {
      const [x, y] = lip[i], l = 6 + R() * 12;
      teeth += taper([[x, y - 4], [x + (R() - 0.5) * 2, y + l * 0.5], [x, y + l]], [5 + R() * 3, 3, 0.4], { per: 3 });
    }
    s.figure(`<path d="${mouth}" fill-rule="evenodd"/><path d="${U(teeth)}"/>`, { fill: s.lin([[0, '#1a120c'], [1, '#0e0906']]), rim: '#ffe7a8', offsets: [[1.2, 0.5], [-1.2, 0.5], [0, 1.3]], rimOp: 0.9 });
    // light off the water rippling on the walls near the mouth
    let dance = '';
    for (const [x0, y0, x1] of [[14, 124, 44], [10, 136, 40], [16, 147, 46], [256, 122, 288], [262, 134, 294], [258, 146, 290]]) {
      const pts = [];
      for (let x = x0; x <= x1; x += 5) pts.push([x, y0 + Math.sin(x / 4 + y0) * 1.6]);
      dance += poly(spline(pts, 3), false);
    }
    s.add(`<path d="${dance}" fill="none" stroke="#ffd98a" stroke-width=".8" opacity=".24" stroke-linecap="round" stroke-dasharray="5 3 2 3"/>`);
    // the spring welling up in the pool, rings round where he drinks
    s.glow(166, 162, 26, '#fff0c2', 0.5);
    s.glow(98, 178, 30, '#fff0c2', 0.45, 'breathe');
    s.glow(222, 128, 11, '#ffe9a8', 0.7, 'breathe');
    s.bloom('<g fill="none" stroke="#fff6d8" stroke-width="1"><ellipse cx="164" cy="166" rx="7" ry="1.6"/><ellipse cx="164" cy="166.4" rx="14" ry="3" opacity=".6"/>' +
      '<ellipse cx="98" cy="178" rx="6" ry="1.4"/><ellipse cx="98" cy="178.4" rx="14" ry="3" opacity=".7"/><ellipse cx="98" cy="178.8" rx="24" ry="5" opacity=".4"/></g>' +
      `<path d="${dots([[98, 176.6, 1.4], [95, 175.6, 0.9], [101, 175.8, 0.8]])}" fill="#fffaf0"/>`, { sd: 1.4, k: 1.4, box: [60, 150, 140, 46] });
    // ferns over the lip and along the near edge of the pool
    const G = rng(13105), fronds = [];
    for (const [x, y, a, l] of [[66, 70, 96, 26], [74, 52, 80, 22], [232, 60, 100, 24], [240, 80, 86, 20], [112, 30, 94, 16], [196, 28, 86, 14],
      [30, 214, -72, 40], [42, 214, -104, 34], [8, 214, -60, 30], [270, 214, -108, 38], [282, 214, -74, 34], [296, 214, -120, 30]]) {
      fronds.push(taper([[x, y], toward(x, y, a, l * 0.5), toward(x, y, a + 12, l)], [2.4, 1.6, 0.4], { per: 3 }));
      for (let t = 0.22; t < 0.95; t += 0.14) { const [qx, qy] = toward(x, y, a + 6 * t, l * t); fronds.push(leafAt(qx, qy, a + 66 + G() * 10, 8 * (1.1 - t), 0.4, 3), leafAt(qx, qy, a - 66 - G() * 10, 8 * (1.1 - t), 0.4, 3)); }
    }
    s.path(U(fronds), '#0e0906');
    s.motes({ seed: 13106, n: 20, x: [60, 250], y: [30, 150], r: [0.4, 1.1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 13107, n: 16, x: [60, 240], y: [150, 200], r: [0.5, 1.1], fill: '#fff8dc', cls: 'twinkle', t: [1.2, 2.8], op: [0.5, 1] }));    return s.svg();
  },
};
