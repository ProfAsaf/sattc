// Card art for the SATTC Ultra version 5 cards, part G: the guerrillas
// (cards 173–178, which slow an opponent's economy, discard pile or hand)
// and the Legends of the two new decks, Ione, the Bloomcaller (Verdant +
// Tide) and Hush, the Fog Witch (Tide + Umbral). A spell shows its effect
// happening; a Legend is one heroic figure at the centre of their world.
// Style rules live in ../scenes.js; drawing tools in ../kit.js. Seeds: a
// card's number × 100 plus a count; Ione uses 9720–9739 and Hush 9740–9759.

import { H, W, blob, particles, poly, pt, ridge, rng, spline, taper } from '../kit.js';
import { PAL, page } from './shared.js';

// ── local helpers (the same toolbox as ultra-f.js) ──────────────────

const f1 = (n) => (Math.round(n * 10) / 10).toString();
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

// An ellipse at any angle as arc commands, for strokes and for fills that
// never join a union.
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

// A smooth edge (hill, bank, shore) closed off below the card, and its
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
const profile = (cx, cy, k, tilt = 0, dir = 1) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k * dir, cy + y * k])), cx, cy, tilt * dir);

// Fog, cloud or smoke: overlapping round puffs, [[x, y, r], ...].
const puffs = (list, flat = 1.3) => U(list.map(([x, y, r]) => ell(x, y, r * flat, r, 0, 20)));

// Soft drifting sheets of mist or smoke, each fading out to its edge:
// [[x, y, rx, ry], ...].
function mist(s, color, op, list) {
  const g = s.rad([[0, color, op], [0.55, color, op * 0.7], [1, color, 0]]);
  return `<g fill="${g}">${list.map(([x, y, rx, ry]) => `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`;
}

// Thin horizontal glints of light on water: [[x, y, w, op], ...].
const glitter = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

const polyline = (pts) => 'M' + pts.map(pt).join('L');

// A rectangle w × h centred on (x, y), turned a degrees: pages, books, crates.
const quad = (x, y, w, h, a = 0) => rot(poly([[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]]), x, y, a);

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

// A house or workshop on baseline b: walls w × h under a gable rh high, and
// a chimney ch tall on the right-hand slope (none if ch is 0).
const house = (x, b, w, h, rh, ch = 0) => {
  const cx = x + w * 0.66, cw = Math.max(2.4, w * 0.12);
  return U(poly([[x, b], [x, b - h], [x + w / 2, b - h - rh], [x + w, b - h], [x + w, b]]),
    ch ? poly([[cx, b - h - rh * 0.5], [cx, b - h - rh * 0.68 - ch], [cx + cw, b - h - rh * 0.68 - ch], [cx + cw, b - h - rh * 0.4]]) : []);
};

// Little magic glyphs, as stroke path data, about 5k tall, centred on (x, y).
const RUNES = [
  (x, y, k) => `M${f1(x)},${f1(y + 2.4 * k)}V${f1(y - 2.4 * k)}M${f1(x)},${f1(y)}L${f1(x - 1.6 * k)},${f1(y - 2.2 * k)}M${f1(x)},${f1(y)}L${f1(x + 1.6 * k)},${f1(y - 2.2 * k)}`,
  (x, y, k) => `M${f1(x)},${f1(y - 2.4 * k)}L${f1(x + 1.7 * k)},${f1(y)}L${f1(x)},${f1(y + 2.4 * k)}L${f1(x - 1.7 * k)},${f1(y)}Z`,
  (x, y, k) => `M${f1(x - 1.7 * k)},${f1(y)}a${f1(1.7 * k)},${f1(1.7 * k)} 0 1,0 ${f1(3.4 * k)},0a${f1(1.7 * k)},${f1(1.7 * k)} 0 1,0 ${f1(-3.4 * k)},0M${f1(x)},${f1(y - 2.6 * k)}V${f1(y + 2.6 * k)}`,
  (x, y, k) => `M${f1(x - 1.6 * k)},${f1(y + 2.4 * k)}L${f1(x)},${f1(y - 2.4 * k)}L${f1(x + 1.6 * k)},${f1(y + 2.4 * k)}M${f1(x - 0.9 * k)},${f1(y + 0.4 * k)}H${f1(x + 0.9 * k)}`,
  (x, y, k) => `M${f1(x - 1.4 * k)},${f1(y - 2.4 * k)}V${f1(y + 2.4 * k)}M${f1(x - 1.4 * k)},${f1(y - 2.4 * k)}L${f1(x + 1.6 * k)},${f1(y - 0.8 * k)}L${f1(x - 1.4 * k)},${f1(y + 0.8 * k)}`,
];
const rune = (i, x, y, k = 1) => RUNES[((i % RUNES.length) + RUNES.length) % RUNES.length](x, y, k);

// A five-petalled blossom on (x, y), its petals r long, turned a degrees.
const bloomAt = (x, y, r, a = 0) => U(Array.from({ length: 5 }, (_, i) => leafAt(x, y, a + i * 72, r, 0.62, 3)));

// A wing raised over the back of a bird facing left: the arm goes up from
// the shoulder (x, y) to the wrist and the primaries fan out above it,
// longest in the middle; `sweep` turns the whole wing back toward the tail.
// Returns the wing and the white patch on its primaries.
function wingUp(x, y, k, sweep) {
  const f = (d) => rot(at(x, y, k)(d), x, y, sweep);
  const arm = blob([[-6, 2], [-10, -10], [-11, -22], [-6, -29], [4, -30], [13, -22], [17, -10], [13, 2]], 4);
  const fan = [-104, -90, -76, -62, -49, -37].map((a, i) => leafAt(-8 + i * 2.6, -27 + i * 0.9, a, [22, 26, 28, 27, 24, 20][i], 0.27, 3));
  return { d: f(U(arm, fan)), patch: f(lens(-1, -40, 15, -80, 0.5, 3)) };
}

export const ultra_g = {
  // ── THE GUERRILLAS ────────────────────────────────────────────────

  // EMBER. Choking Smoke: black smoke pours out of the forge chimney, rolls
  // across the sky and comes down on the roofs of the workshops; under it
  // the great hearth has burned down to a heap of embers.
  'choking-smoke'(s) {
    fin(s, 'ember');
    s.rect(s.lin([[0, '#1e0706'], [0.3, '#4a150b'], [0.56, '#952f12'], [0.74, '#cf5820'], [0.82, '#e0702c']]));
    // the last of the evening light, low behind the village
    s.glow(124, 172, 210, '#ff7a2e', 0.55);
    // the far roofs of the town
    const R = rng(17301), far = [];
    for (let x = -14; x < 314;) {
      const w = 12 + R() * 12;
      far.push(house(x, 175, w, 4 + R() * 8, 3 + R() * 5, R() < 0.45 ? 3 + R() * 4 : 0));
      x += w + 1 + R() * 7;
    }
    s.layer(U(far, 'M-12,174L312,174L312,216L-12,216Z'), '#7c2c12', { blur: 0.7 });
    s.haze(150, 178, '#ff8a3a', 0.3);
    // the smoke: out of the chimney in a thick column, rolling over to the
    // left and down onto the roofs, its belly lit by the fires it smothers
    const thick = puffs([
      [206, 38, 9], [210, 27, 10], [204, 18, 14], [192, 8, 17], [174, 2, 19], [152, 4, 20], [128, 10, 21], [106, 22, 21], [86, 38, 22], [66, 55, 22], [47, 73, 22], [28, 91, 22], [10, 106, 22], [-8, 118, 22],
      [168, 24, 11], [150, 30, 12], [128, 38, 14], [106, 50, 16], [84, 66, 18], [62, 84, 18], [40, 102, 18], [20, 120, 18], [0, 136, 18],
      [72, 100, 14], [94, 106, 12], [114, 110, 9], [130, 113, 6], [48, 120, 15], [28, 136, 15], [8, 150, 15], [-12, 158, 14],
      [150, -20, 26], [96, -14, 30], [40, -4, 32], [-6, 20, 32], [-14, 70, 26], [4, -14, 30], [-20, 44, 28],
      [30, 40, 24], [58, 28, 22], [12, 62, 22], [84, 14, 20],
    ], 1.3);
    s.figure(`<path d="${thick}"/>`, { fill: '#130605', rim: '#ff8a3c', offsets: [[0, 1.5], [-1, 1.1], [1, 0.8]], rimOp: 0.75, shade: 0.4, light: [-0.3, 1] });
    // its billows: shadowed folds, and the lit curl under each
    const fold = (list, a, b) => list.map(([x, y, r]) => `M${f1(x - r)},${y}a${r},${f1(r * a)} 0 0 ${b} ${2 * r},0`).join('');
    s.add(`<g data-part="folds"><path d="${fold([[176, 0, 9], [122, 8, 15], [70, 36, 13], [30, 70, 16], [-2, 98, 12], [98, 22, 8]], 0.6, 1)}" fill="none" stroke="#050202" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>` +
      `<path d="${fold([[200, 24, 7], [154, 18, 13], [104, 42, 15], [58, 80, 12], [24, 114, 14], [92, 112, 8], [40, 132, 9]], 0.45, 0)}" fill="none" stroke="#b4481c" stroke-width="1.1" stroke-linecap="round" opacity=".38"/></g>`);
    // the village of workshops; the forge and its tall chimney
    const village = U(
      house(-14, 204, 30, 30, 13, 9), house(14, 204, 24, 22, 11), house(36, 204, 34, 36, 15, 10),
      house(68, 204, 26, 26, 12, 8), house(92, 204, 30, 32, 13), house(120, 204, 24, 22, 10, 7),
      house(268, 204, 46, 30, 14, 9),
      poly([[50, 172], [62, 172], [62, 173.4], [50, 173.4]]), quad(60, 178.6, 7, 8),
    );
    const forge = U(
      poly([[144, 204], [144, 160], [206, 128], [272, 160], [272, 204]]),
      poly([[194, 142], [196, 50], [214, 50], [216, 142]]),
      poly([[191, 51], [191, 44], [219, 44], [219, 51]]),
    );
    s.figure(`<path d="${village}"/><path d="${forge}"/>`, { fill: '#1c0907', rim: '#ffa060', offsets: [[0, -1.2], [-0.9, -0.8], [0.9, -0.8]], rimOp: 0.85, shade: 0.35, light: [-0.3, -1] });
    let bricks = '';
    for (let y = 56, i = 0; y < 132; y += 6, i++) {
      const xl = 196 - (y - 50) * 0.024, xr = 214 + (y - 50) * 0.024;
      bricks += `M${f1(xl)},${y}H${f1(xr)}`;
      for (let x = xl + (i % 2 ? 3 : 7); x < xr - 1; x += 8) bricks += `M${f1(x)},${y}v6`;
    }
    s.add(`<path d="${bricks}" stroke="#3e160a" stroke-width=".7" opacity=".9"/>`);
    // a few windows still dimly lit
    s.path([[2, 186], [24, 188], [46, 178], [64, 186], [78, 186], [100, 180], [112, 180], [128, 190], [284, 184], [298, 184]].map(([x, y]) => `M${x},${y}h4v5h-4Z`).join(''), '#b4441a', 'opacity=".5"');
    // where the smoke comes down on the roofs, soft sheets of it
    s.add(mist(s, '#1e0b08', 0.85, [[24, 160, 56, 11], [84, 166, 46, 8], [128, 170, 30, 5], [-4, 176, 40, 8]]));
    // the forge's mouth: the fire burned down to a heap of embers
    s.path('M186,204V180A19,19 0 0 1 224,180V204Z', s.radU(205, 204, 34, [[0, '#7a1c0a'], [0.5, '#3a0c06'], [1, '#160504']]));
    s.add(`<ellipse cx="205" cy="207" rx="46" ry="5" fill="${s.rad([[0, '#ff7a2e', 0.4], [1, '#ff7a2e', 0]])}"/>`);
    s.glow(205, 198, 30, '#ff5a1e', 0.55, 'breathe');
    const heap = blob([[189, 205], [193, 198], [200, 194.6], [208, 194], [215, 196.6], [221, 205]], 4);
    s.bloom(`<g data-part="embers"><path d="${heap}" fill="${s.radU(205, 200, 16, [[0, '#ffc060'], [0.4, '#f06a24'], [1, '#7a1a08']])}"/>` +
      `<path d="${dots([[198, 199, 0.9], [204, 197, 1.1], [211, 198.6, 0.9], [207, 201, 0.8], [216, 201, 0.7], [194, 202, 0.7]])}" fill="#fff0b0"/></g>`, { sd: 1.4, k: 1.4, box: [170, 170, 70, 44] });
    // the street
    s.path('M-10,204H310V214H-10Z', '#120504');
    // ash coming down; the last sparks going up the chimney
    s.add(particles({ seed: 17303, n: 16, x: [0, 200], y: [40, 200], r: [0.4, 0.9], fill: '#9a7a6a', cls: 'float', op: [0.25, 0.55], t: [6, 10] }));
    s.motes({ seed: 17304, n: 7, x: [196, 216], y: [24, 46], r: [0.3, 0.7], fill: '#ff7a2e', hot: '#ffd27a', cls: 'rise', t: [3, 6], op: [0.4, 0.9] });
    return s.svg();
  },

  // RADIANT. Tollkeeper: at dawn a stern tollkeeper in a gold-trimmed coat
  // stands at the gate of a bridge, lantern raised and ledger open; the toll
  // bar is up, coins are stacked on the gatepost, and the road runs away
  // over the river to the sunrise.
  tollkeeper(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#4c6288'], [0.3, '#909eb6'], [0.52, '#dcc498'], [0.63, '#f4d89c']]));
    s.add(particles({ seed: 17401, n: 10, x: [0, 140], y: [0, 50], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun coming up at the far end of the bridge
    const sx = 200, sy = 124;
    s.glow(sx, sy, 200, '#fff0c2', 0.8);
    s.shafts({ cx: sx, cy: sy, n: 16, from: -178, to: -2, len: 300, spread: 2.2, color: '#fff3d4', op: 0.2, seed: 17402 });
    s.glow(sx, sy, 50, '#fffaf0', 0.85);
    s.add(`<circle cx="${sx}" cy="${sy}" r="13" fill="#fff8e6"/>`);
    // the town on the far bank
    const town = U(ridge({ seed: 17403, base: 139, amp: 5, freq: 3 }),
      house(146, 137, 14, 8, 5), house(162, 137, 11, 10, 6, 3), house(218, 137, 12, 9, 5, 3), house(232, 137, 16, 7, 6), house(250, 137, 10, 8, 5),
      poly([[180, 137], [180, 112], [183, 104], [186, 112], [186, 137]]), quad(244, 126, 6, 20), poly([[240, 116], [244, 108], [248, 116]]));
    s.layer(town, '#b49870', { blur: 0.7 });
    s.haze(116, 140, '#ffe6b0', 0.34);
    // the river either side of the bridge
    s.path('M-10,137H310V214H-10Z', s.lin([[0, '#efd49e'], [0.12, '#a8a28a'], [0.5, '#56707a'], [1, '#26383e']]));
    s.add(glitter([[60, 141, 30, 0.5], [100, 139.5, 22, 0.55], [36, 145, 36, 0.4], [252, 141, 30, 0.45], [282, 146, 24, 0.35]], '#fff4dc'));
    // the bridge: the road running away to the far bank between its parapets
    const lx = (y) => 197 + ((y - 136.6) * (34 - 197)) / (216 - 136.6), rx = (y) => 203 + ((y - 136.6) * (270 - 203)) / (216 - 136.6);
    s.path('M34,216L197,136.6L203,136.6L270,216Z', s.linU(0, 136, 0, 216, [[0, '#f2dcaa'], [0.15, '#b49a72'], [0.6, '#6a5640'], [1, '#30261c']]));
    s.path(taper([[200, 137], [186, 216]], [1, 34], { per: 2 }), '#ffe8b8', 'opacity=".22"');
    let cob = '';
    for (let i = -4; i <= 4; i++) cob += `M${f1(200 + i * 1.2)},137L${f1(152 + i * 26)},216`;
    for (const y of [140, 144, 149, 156, 165, 176, 190, 206]) cob += `M${f1(lx(y))},${y}L${f1(rx(y))},${y}`;
    s.add(`<path d="${cob}" stroke="#3a2c1e" stroke-width=".7" opacity=".55"/>`);
    const parapets = U(poly([[-12, 216], [-12, 158], [194, 134], [197, 136.6], [34, 216]]), poly([[312, 216], [312, 164], [206, 134], [203, 136.6], [270, 216]]));
    // the gate: two stone posts, the toll bar raised on the right one
    const posts = U(quad(52, 152, 24, 104), quad(52, 97, 32, 7), quad(264, 162, 20, 84), quad(264, 118.4, 26, 6),
      taper([[268, 122], [264, 112], [228, 8]], [4.6, 4, 2.6]), poly([[259, 115], [259, 106], [261, 106], [261, 115]]), poly([[267, 115], [267, 106], [269, 106], [269, 115]]));
    s.figure(`<path d="${parapets}"/><path d="${posts}"/>`, { fill: '#4a3a2c', rim: '#fff0c2', offsets: [[0.4, -1.2], [1, -0.4]], rimOp: 0.9, shade: 0.4, light: [0.3, -1] });
    s.add(`<path d="M264,112L228,8" stroke="#e8c070" stroke-width="2.4" stroke-dasharray="7 7" opacity=".75"/><circle cx="264" cy="112" r="1.8" fill="#ffe39a"/>` +
      `<path d="M-12,170L195,140M312,176L205,140" stroke="#2a2018" stroke-width=".8" opacity=".6"/>`);
    // the coins stacked on the near post's cap
    const stack = (x, n) => Array.from({ length: n }, (_, i) => `M${f1(x - 3.2)},${f1(93.4 - (i + 1) * 1.7)}h6.4v1.7h-6.4Z`).join('');
    const coins = stack(44, 5) + stack(52, 8) + stack(60, 3);
    // the tollkeeper: a broad man in a long coat and a cocked hat, a short
    // beard; the lantern held up, the ledger open in the other hand
    const X = 108, Y = 202, K = 1.08, place = at(X, Y, K);
    const lamp = lanternAt(X + 31.4 * K, Y - 116 * K, 1.25);
    const man = U(place(U(
      taper([[-4, -36], [-5, -18], [-5.4, -3]], [7.6, 6.4, 6]), ell(-6.6, -2, 6, 2.6),
      taper([[4, -36], [6, -18], [7, -3]], [7.6, 6.4, 6]), ell(9.4, -2, 6, 2.6),
      blob([[-11, -66], [11, -66], [13, -50], [14, -36], [8, -32], [2, -36], [-4, -32], [-12, -30], [-17, -36], [-15, -52]], 4),
      taper([[0, -58], [0, -76], [0, -90]], [18, 19, 23]),
      ell(-9, -90, 6.4, 4.6), ell(9, -90, 6.4, 4.6),
      taper([[1, -93], [1.4, -98]], 5.4, { per: 2 }),
      profile(3, -104, 0.9, -10),
      blob([[-2, -100], [3, -97], [9, -97.4], [8.4, -93], [2, -92], [-2, -95]], 3),
      blob([[-14, -108.6], [-8, -111.6], [-3, -118], [5, -119.6], [12, -116], [16, -111], [22, -108.6], [15, -107], [4, -109.6], [-6, -106.6]], 3),
      taper([[8, -88], [17, -90], [25, -96]], [6, 5.2, 4.6]), taper([[25, -96], [29, -106], [31, -113]], [4.6, 4, 3.6]), ell(31.4, -115, 3, 3.4),
      taper([[-8, -86], [-6, -72], [2, -64]], [6, 5.2, 4.6]), taper([[2, -64], [12, -66], [19, -70]], [4.6, 4, 3.6]), ell(20, -71, 3.2, 3),
    )), lamp.frame);
    s.figure(`<path d="${man}"/>`, { fill: p.fig, rim: '#fff0c2', offsets: [[1.1, -0.6], [0.4, -1.2], [-0.6, -0.9]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.6, -1] });
    // the gold on his coat and hat
    s.add(`<path d="${place('M10,-87L11,-66L13,-50L14,-37M-17,-35.6L-12,-30.6L-4,-32.6L2,-36.6L8,-32.6L14,-37M21,-93L24.6,-97.6M14.6,-64.4L16,-70.6M-13,-108.4L-6,-106.8L4,-109.4L15,-107.2L21,-108.4')}" fill="none" stroke="#ffd77a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>` +
      `<path d="${dots([[X + 6.4 * K, Y - 82 * K, 0.9], [X + 6.8 * K, Y - 76 * K, 0.9], [X + 7.2 * K, Y - 70 * K, 0.9]])}" fill="#ffe39a"/>`);
    // the ledger, open
    const bx = X + 20 * K, by = Y - 73 * K;
    s.add('<g data-part="ledger">');
    s.path(`M${f1(bx - 1)},${f1(by - 6)}L${f1(bx - 12)},${f1(by - 3)}L${f1(bx - 11)},${f1(by + 7)}L${f1(bx)},${f1(by + 4)}ZM${f1(bx - 1)},${f1(by - 6)}L${f1(bx + 11)},${f1(by - 7)}L${f1(bx + 11.6)},${f1(by + 3)}L${f1(bx)},${f1(by + 4)}Z`, '#f6ecd0');
    s.add(`<path d="M${f1(bx - 9)},${f1(by - 1)}l6,-1.6M${f1(bx - 9)},${f1(by + 1.6)}l6,-1.6M${f1(bx - 8.6)},${f1(by + 4.2)}l5,-1.4M${f1(bx + 2)},${f1(by - 4)}l7,-.6M${f1(bx + 2)},${f1(by - 1.4)}l7,-.6M${f1(bx + 2.2)},${f1(by + 1.2)}l5,-.4" stroke="#8a7458" stroke-width=".6"/>`);
    s.add('</g>');
    // the lantern's light, and the coins catching the dawn
    s.add('<g data-part="lampglow">');
    s.glow(lamp.c[0], lamp.c[1], 60, '#ffd98a', 0.5);
    s.glow(lamp.c[0], lamp.c[1], 18, '#fff4d0', 0.75);
    s.add('</g>');
    s.bloom(`<g data-part="lamp"><path d="${lamp.glass}" fill="${s.radU(lamp.c[0], lamp.c[1], 8, [[0, '#ffffff'], [0.5, '#fff0c0'], [1, '#ffc060']])}"/></g>` +
      `<g data-part="coins"><path d="${coins}" fill="${s.linU(40, 0, 64, 0, [[0, '#c8902e'], [0.5, '#ffe08a'], [1, '#b07a26']])}"/><path d="${coins}" fill="none" stroke="#7a5418" stroke-width=".35"/>` +
      `<path d="${glint(53, 79.6, 5, 0.16)}" fill="#ffffff"/></g>`, { sd: 1.4, k: 1.5, box: [20, 50, 160, 80] });
    s.motes({ seed: 17404, n: 16, x: [60, 280], y: [30, 160], r: [0.4, 1], fill: '#ffe39a', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL. Grave Robber: under a moon just up over the cemetery wall, a
  // hooded robber climbs out of a grave he has opened, a bulging sack of
  // grave goods over his shoulder, a hand on his shovel; a cold violet
  // light comes up the stair behind him.
  'grave-robber'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.36, '#1d1532'], [0.58, '#3a2c62'], [0.68, '#4a3870']]));
    s.add(particles({ seed: 17501, n: 22, x: [0, W], y: [0, 96], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, just up over the wall
    const mx = 150, my = 88;
    s.glow(mx, my, 150, '#cdbcf4', 0.5);
    s.glow(mx, my, 54, '#efe8ff', 0.55);
    s.add(`<circle cx="${mx}" cy="${my}" r="32" fill="#ece4fa"/><circle cx="${mx - 11}" cy="${my - 9}" r="5" fill="#d8cfee" opacity=".6"/>` +
      `<circle cx="${mx + 12}" cy="${my + 6}" r="3.6" fill="#d8cfee" opacity=".5"/><circle cx="${mx + 4}" cy="${my - 18}" r="2.6" fill="#d8cfee" opacity=".5"/>`);
    // yews and a chapel beyond the wall
    s.layer(U(ell(30, 112, 9, 26), ell(54, 118, 7, 18), ell(252, 108, 10, 30), ell(278, 116, 7, 20),
      poly([[196, 118], [196, 100], [210, 92], [224, 100], [224, 118]]), poly([[206, 95], [206, 80], [210, 70], [214, 80], [214, 95]])), '#2c2248', { blur: 0.7 });
    // the cemetery wall: coping, two piers with urns on them
    const wall = U(poly([[-12, 153], [-12, 117], [312, 117], [312, 153]]), poly([[-14, 118], [-14, 113], [314, 113], [314, 118]]),
      [40, 244].map((x) => [quad(x, 128, 14, 48), quad(x, 104, 18, 4), ell(x, 97.6, 4, 4.6, 0, 14), quad(x, 92, 3, 3)]));
    s.figure(`<path d="${wall}"/>`, { fill: '#1e1634', rim: '#c9b8f2', offsets: [[0, -1.2]], rimOp: 0.75, shade: 0.4, light: [0, -1] });
    let courses = '';
    const Rc = rng(17503);
    for (let y = 126, row = 0; y < 153; y += 9, row++) {
      courses += `M-12,${y}H312`;
      for (let x = (row % 2 ? 4 : 14) + Rc() * 6; x < 310; x += 20 + Rc() * 8) courses += `M${f1(x)},${y - 9}V${y}`;
    }
    s.add(`<path d="${courses}" stroke="#0e0a1a" stroke-width=".9" opacity=".7"/>`);
    // the graves this side of the wall, mist among them
    const ground = s.lin([[0, '#221a3a'], [0.5, '#140e22'], [1, '#07050b']]);
    s.path('M-10,152H310V214H-10Z', ground);
    s.add(`<g fill="#2a2044">${slab(18, 168, 12, 20, -6)}${cross(62, 166, 22, 5)}${slab(244, 168, 13, 19, 4)}${cross(288, 170, 24, -6)}</g>`);
    s.fog(166, '#9a86c4', 0.26);
    // the opened grave: a stair going down into the dark, lit from below
    s.path('M94,181L190,179L203,199L80,202Z', s.linU(0, 179, 0, 202, [[0, '#a07ade'], [0.3, '#4a3078'], [1, '#100a1c']]));
    s.add('<path d="M91,186.4L193.6,184.4M88,192L197,190M84.6,197.4L200.4,195.4" stroke="#d6b8ff" stroke-width=".8" opacity=".6"/>');
    s.glow(144, 184, 76, '#b07cff', 0.6, 'breathe');
    s.shafts({ cx: 144, cy: 192, n: 8, from: -134, to: -46, len: 120, spread: 4, color: '#c9a6ff', op: 0.2, seed: 17502, sd: 2.4 });
    // the robber (facing right, hips at the origin): his hood, one foot up
    // on the edge, one leg still down the stair, a hand on the shovel, the
    // other over his shoulder holding the sack
    const X = 122, Y = 156, K = 1.4, place = at(X, Y, K);
    const man = place(U(
      taper([[0, 0], [5, -15], [10, -30]], [14, 14, 16.4]),
      blob([[9, -33], [7, -42], [9, -51], [14, -55], [24, -51], [27, -44], [26, -37], [21, -32]], 4),
      taper([[12, -51], [5, -54], [-1, -54], [-7, -51]], [7, 4.6, 2.6, 0.4]),
      blob([[6, -32], [-2, -27], [-9, -13], [-12, 2], [-6, 8], [4, 6], [8, -12]], 4),
      taper([[3, 2], [12, -4], [20, -6]], [12, 10, 8.6]), taper([[20, -6], [24, 6], [26, 15]], [8.6, 7, 6]), ell(29, 17.4, 6, 2.6, 4),
      taper([[-3, 2], [-4, 16], [-3, 32]], [12, 10, 8.6]),
      taper([[14, -27], [22, -18], [30, -12]], [6, 5.2, 4.6]), ell(32, -11, 3.2, 3.4),
      taper([[8, -30], [6, -40], [2, -46]], [5.6, 5, 4.4]), ell(1, -47.4, 3.2, 3),
    ));
    const shovel = U(taper([[221, 186], [165, 132]], [2.8, 2.4], { per: 2 }), taper([[160, 134], [169, 127]], 2.4, { per: 2 }),
      rot(poly([[216, 182], [226, 182], [227, 194], [221, 199], [215, 194]]), 221, 190, -46));
    // the sack hung down his back, lumpy with what he took
    const sack = place(U(
      blob([[-3, -44], [-9, -45], [-17, -41], [-24, -34], [-27, -24], [-26, -14], [-20, -7], [-11, -8], [-5, -14], [-2, -24], [-1, -34]], 4),
      ell(-22, -30, 5, 6, 20, 14), ell(-12, -12, 6, 4, 0, 14),
      taper([[1, -47], [-2, -45], [-4, -43]], [3.4, 4, 5], { per: 2 }),
    ));
    s.add('<g data-part="under">');
    s.path(mv(man, 0.6, 1.8), '#c9a6ff', 'opacity=".75"');
    s.add('</g>');
    s.figure(`<path d="${sack}"/>`, { fill: '#3a3046', rim: '#d6c8f6', offsets: [[0, -1.2], [-1, -0.6]], rimOp: 0.85, shade: 0.45, light: [-0.3, -1] });
    s.add(`<g data-part="creases"><path d="${place('M-8,-40Q-14,-30 -12,-18M-18,-40Q-22,-34 -22,-26M-4,-30Q-8,-22 -14,-16M-3,-42.6L-0.6,-44.6M-4.4,-41L-1.6,-43')}" fill="none" stroke="#120d1c" stroke-width=".9" opacity=".75"/></g>`);
    s.figure(`<path d="${U(man, shovel)}"/>`, { fill: '#0b0812', rim: '#d6c8f6', offsets: [[0, -1.3], [-1, -0.8], [1, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    // the ground this side of the grave, over his other leg, and the slab
    // he heaved off it, a cross cut in it
    s.path('M-10,202L80,202L203,199L310,198L310,214L-10,214Z', ground);
    s.figure(`<path d="${U(poly([[26, 188], [84, 172], [94, 182], [36, 200]]), poly([[36, 200], [94, 182], [95, 186.6], [37, 205]]))}"/>`, { fill: '#1a1428', rim: '#c9a6ff', offsets: [[0.4, -1.1]], rimOp: 0.7 });
    s.add('<path d="M50,188L74,181M60,180L64,190" stroke="#08060e" stroke-width="1.6" stroke-linecap="round"/>');
    // the gleam of stolen gold at the neck of the sack
    const [gx, gy] = [X - 1 * K, Y - 50 * K];
    s.bloom(`<g data-part="gleam"><path d="${oval(gx - 1.6, gy + 1, 3, 1.4, -24)}" fill="#ffd77a"/><path d="${glint(gx - 2.4, gy, 4.6, 0.16)}" fill="#ffffff"/></g>`, { sd: 1.2, k: 1.4, box: [gx - 30, gy - 25, 60, 50] });
    s.fog(204, '#8f7fc8', 0.24);
    s.motes({ seed: 17504, n: 14, x: [100, 196], y: [120, 186], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE. Pickpocket: over the harbour market a sly magpie in a tiny red
  // cloak flaps away with a fat coin purse in its beak, a coin dropping out
  // of it; below, the merchant it robbed shakes his fist.
  pickpocket(s) {
    fin(s, 'tide');
    s.rect(s.lin([[0, '#1a6474'], [0.3, '#3a909c'], [0.56, '#86c4be'], [0.64, '#acd6cc']]));
    // the sun high over the harbour
    s.glow(96, 4, 170, '#f4fff8', 0.6);
    s.shafts({ cx: 96, cy: -10, n: 10, from: 40, to: 140, len: 240, spread: 2.6, color: '#effffa', op: 0.22, seed: 17601 });
    // the far shore and the harbour mouth, a lighthouse on the mole
    s.layer(U(ridge({ seed: 17602, base: 133, amp: 10, freq: 2, x1: 170 }), poly([[208, 135], [208, 129], [312, 127], [312, 135]]),
      poly([[268, 129], [270, 105], [276, 105], [278, 129]]), poly([[267, 106], [273, 99], [279, 106]])), '#5e9ea0', { blur: 0.7 });
    // the sea in the harbour
    s.path('M-10,134H310V214H-10Z', s.lin([[0, '#a6dcd2'], [0.1, '#4c9ea6'], [0.5, '#1e6270'], [1, '#0c303c']]));
    s.add(glitter([[110, 138, 30, 0.5], [150, 141, 40, 0.45], [196, 138, 24, 0.4], [130, 146, 50, 0.35]], '#effcf8'));
    // a ship at the quay on the left, the mast of another on the right
    const ships = U(
      poly([[-14, 170], [-14, 150], [70, 150], [86, 143], [92, 145], [84, 170]]),
      quad(30, 92, 3.4, 118), quad(30, 52, 66, 3), lens(30, 55.6, 62, 0, 0.12), quad(30, 96, 54, 2.6), lens(30, 99.4, 50, 0, 0.14),
      quad(290, 96, 3.4, 140), quad(290, 64, 56, 3), lens(290, 67.4, 52, 0, 0.12),
    );
    s.figure(`<path d="${ships}"/>`, { fill: '#163c44', rim: '#e8fbf6', offsets: [[0, -1]], rimOp: 0.7 });
    s.add('<g fill="none" stroke="#163c44" stroke-width=".7" opacity=".8"><path d="M30,34L-6,150M30,34L80,148M30,52L64,150M290,26L250,170M290,26L314,110"/></g>');
    // the market on the quay: three stalls under striped awnings
    const stall = (x0, x1, top) => {
      const sc = [], st = [], n = Math.round((x1 - x0) / 8);
      for (let i = 0; i < n; i++) {
        const a = x0 + ((x1 - x0) * i) / n, b = x0 + ((x1 - x0) * (i + 1)) / n, fa = a + (a - (x0 + x1) / 2) * 0.08, fb = b + (b - (x0 + x1) / 2) * 0.08;
        sc.push(ell((fa + fb) / 2, top + 12, (fb - fa) / 2, 3, 0, 10));
        if (i % 2) st.push(poly([[a, top], [b, top], [fb, top + 12], [fa, top + 12]]), ell((fa + fb) / 2, top + 12, (fb - fa) / 2, 3, 0, 10));
      }
      const fl = x0 - ((x1 - x0) / 2) * 0.08, fr = x1 + ((x1 - x0) / 2) * 0.08;
      return { cloth: U(poly([[x0, top], [x1, top], [fr, top + 12], [fl, top + 12]]), sc), stripes: U(st),
        frame: U(quad(fl + 1.5, top + 34, 2, 44), quad(fr - 1.5, top + 34, 2, 44), quad((x0 + x1) / 2, top + 40, x1 - x0 - 6, 22)) };
    };
    const stalls = [stall(8, 74, 158), stall(98, 168, 156), stall(196, 290, 154)];
    s.figure(`<path d="${U(stalls.map((t) => t.frame))}"/>`, { fill: '#0e2a30', rim: '#d8f6f0', offsets: [[0, -1]], rimOp: 0.6 });
    s.path(U(stalls.map((t) => t.cloth)), '#e2dcc4');
    s.path(U(stalls.map((t) => t.stripes)), '#3c7c80');
    s.add(`<path d="${stalls.map((t) => t.cloth).join('')}" fill="none" stroke="#0e2a30" stroke-width=".6" opacity=".6"/>`);
    // what is on the counters: fish, fruit
    s.path(U(lens(20, 182, 12, -10, 0.34), lens(34, 183, 13, 8, 0.34), lens(50, 182, 11, -4, 0.34), lens(62, 183, 10, 14, 0.34)), '#9cc8c4');
    s.path(dots([[112, 182, 3], [119, 181, 3], [126, 182, 3], [133, 181, 3], [116, 177, 3], [123, 177, 3], [130, 177, 3], [146, 182, 3], [153, 181, 3], [149, 177, 3]]), '#c8a85a');
    // the quay
    s.path('M-10,202H310V214H-10Z', s.lin([[0, '#2a4a50'], [1, '#0c1e22']]));
    // the merchant, fist shaking up at the thief (drawn facing right, feet
    // at the origin, then turned to face left)
    const M = at(244, 203, 0.95, -1);
    const man = M(U(
      taper([[-4, -24], [-4.6, -12], [-5, -2]], [6.4, 5.6, 5]), ell(-6.6, -1.4, 4.8, 2.2),
      taper([[4, -24], [4.6, -12], [5, -2]], [6.4, 5.6, 5]), ell(6.6, -1.4, 4.8, 2.2),
      blob([[-11, -52], [9, -52], [15, -42], [16, -30], [10, -22], [0, -20], [-12, -22], [-15, -34], [-14, -46]], 4),
      taper([[1, -52], [2, -56]], 5, { per: 2 }), profile(4, -61, 0.8, -24),
      ell(2, -67, 6.6, 2.6, -24, 14), blob([[-3, -66], [-1, -71], [5, -72.4], [9, -69], [6, -66]], 3),
      taper([[6, -50], [12, -62], [16, -72]], [5.4, 4.6, 4]), taper([[16, -72], [15, -80], [13, -88]], [4, 3.6, 3.2]), ell(12.6, -90, 3.8, 4),
      taper([[-8, -48], [-17, -40], [-12, -32]], [5, 4.4, 3.8]),
    ));
    s.figure(`<path d="${man}"/>`, { fill: '#0a2026', rim: '#e8fbf6', offsets: [[0, -1.2], [0.6, -0.8]], rimOp: 0.9, shade: 0.4, light: [0.2, -1] });
    s.path(M('M-8,-42L10,-42L12,-24L0,-22L-10,-24Z'), '#cfd8cc', 'opacity=".85"');
    s.add('<g data-part="shake">');
    s.add(`<path d="M${f1(244 - 12.6 * 0.95 - 7)},${f1(203 - 92 * 0.95)}q-3,4 0,8M${f1(244 - 12.6 * 0.95 + 6)},${f1(203 - 94 * 0.95)}q3,4 0,8" fill="none" stroke="#0a2026" stroke-width=".9" opacity=".7"/>`);
    s.add('</g>');
    // the magpie (drawn facing left about the middle of its body, then
    // tipped up into its climb): both wings up over its back, a long tail,
    // a little red cloak streaming off its shoulders
    const X = 136, Y = 80, K = 1.25, tilt = 10, place = (d) => rot(at(X, Y, K)(d), X, Y, tilt), P = (x, y) => rp([X + x * K, Y + y * K], X, Y, tilt);
    const far = wingUp(-10, -7, 0.9, -14), near = wingUp(-2, -6, 1.08, 26);
    const bird = U(
      blob([[-22, -3], [-15, -9], [-2, -10], [12, -8], [22, -3], [18, 4], [4, 8], [-12, 7], [-20, 3]], 4),
      ell(-25, -5, 7.4, 6.4),
      poly([[-30.5, -7.6], [-41, -5], [-31, -3.4]]), poly([[-31, -3], [-39.6, -2.8], [-30.6, -0.4]]),
      taper([[16, -1], [30, 2], [44, 5.4], [56, 8]], [6, 7.2, 8, 7.6]), ell(57, 8.4, 4.6, 3.8, 14),
      taper([[-6, 6], [-4, 12], [-8, 15]], [2.2, 1.8, 1]), taper([[0, 6], [3, 12], [0, 15.6]], [2.2, 1.8, 1]),
    );
    s.add('<g data-part="farwing">');
    s.figure(`<path d="${place(far.d)}"/>`, { fill: '#173a42', rim: '#e8fbf6', offsets: [[0, -1]], rimOp: 0.8 });
    s.path(place(far.patch), '#b8d0cc');
    s.add('</g><g data-part="body">');
    s.figure(`<path d="${place(bird)}"/>`, { fill: '#08161c', rim: '#f2fffc', offsets: [[0, -1.2], [-0.8, -0.8], [0.8, -0.8]], rimOp: 0.95, shade: 0.4, light: [0, -1] });
    s.path(place(blob([[-17, 2.6], [-6, 7.4], [8, 5.4], [6, 0.6], [-8, 0.4]], 3)), '#eef6f2');
    s.path(place(taper([[18, 0.4], [32, 3], [46, 6.2], [56, 8.4]], [2, 3, 3.4, 2])), '#2a8078', 'opacity=".8"');
    s.add('</g><g data-part="cloak">');
    const cloak = U(taper([[-21, -7], [-12, -11], [-1, -11], [10, -10], [22, -13], [32, -19], [41, -20]], [4, 9, 11, 12, 11, 8, 2]), taper([[22, -10], [30, -12], [38, -10]], [6, 4, 0.6]));
    s.figure(`<path d="${place(cloak)}"/>`, { fill: '#7a2a30', rim: '#ffe0d8', offsets: [[0, -1]], rimOp: 0.8, shade: 0.4, light: [0, -1] });
    s.add(`<path d="${place('M-10,-9Q2,-6 14,-10M2,-10Q14,-8 26,-14')}" fill="none" stroke="#4a1418" stroke-width=".8" opacity=".7"/>`);
    s.add('</g><g data-part="nearwing">');
    s.figure(`<path d="${place(near.d)}"/>`, { fill: '#08161c', rim: '#f2fffc', offsets: [[0, -1.1], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0, -1] });
    s.path(place(U(near.patch, lens(4, -10, 16, -60, 0.36, 3))), '#eef6f2');
    s.add('</g><g data-part="body">');
    s.add(`<circle cx="${f1(P(-26.6, -6.4)[0])}" cy="${f1(P(-26.6, -6.4)[1])}" r="1.2" fill="#ffffff"/><path d="${dots([[...P(-21, -6), 1.3]])}" fill="#ffd77a"/>`);
    s.add('</g>');
    // the purse dangling from its beak, its neck gathered, a coin falling
    // out of it
    const [tx, ty] = P(-38, -3.6);
    const pouch = blob([[tx - 3, ty + 11], [tx + 3, ty + 11], [tx + 7, ty + 16], [tx + 6, ty + 22], [tx, ty + 25], [tx - 6, ty + 22], [tx - 7, ty + 16]], 4);
    const frill = poly([[tx - 4.6, ty + 11.4], [tx - 5.4, ty + 7.6], [tx - 2, ty + 9.4], [tx, ty + 6.6], [tx + 2, ty + 9.4], [tx + 5.4, ty + 7.6], [tx + 4.6, ty + 11.4]]);
    s.add('<g data-part="purse">');
    s.add(`<path d="M${f1(tx)},${f1(ty)}L${f1(tx - 1.4)},${f1(ty + 9)}M${f1(tx + 0.6)},${f1(ty)}L${f1(tx + 1.8)},${f1(ty + 9)}" stroke="#3a2a1a" stroke-width=".8"/>`);
    s.path(U(pouch, frill), s.radU(tx - 2, ty + 15, 13, [[0, '#b08a52'], [1, '#4a3018']]));
    s.path(`M${f1(tx - 4.6)},${f1(ty + 11.4)}L${f1(tx + 4.6)},${f1(ty + 11.4)}`, 'none', 'stroke="#2a1a0a" stroke-width="1.4"');
    s.glow(tx, ty + 14, 26, '#ffe08a', 0.45);
    s.bloom(`<path d="${dots([[tx - 1.6, ty + 9.4, 1.6], [tx + 1.8, ty + 9, 1.4]])}" fill="#ffd77a"/><path d="${glint(tx + 1.4, ty + 8.6, 6, 0.15)}" fill="#ffffff"/>`, { sd: 1.3, k: 1.5, box: [tx - 30, ty - 20, 60, 60] });
    s.add('</g>');
    s.add([[tx - 4, ty + 36, 0], [tx + 6, ty + 54, -0.6], [tx - 1, ty + 74, -1.1]].map(([x, y, d]) =>
      `<ellipse class="fall" style="--d:${d}s" cx="${f1(x)}" cy="${f1(y)}" rx="2" ry="1.2" fill="#ffd77a"/>`).join(''));
    s.motes({ seed: 17603, n: 12, x: [40, 260], y: [20, 150], r: [0.4, 0.9], fill: '#effcf8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.8] });
    return s.svg();
  },

  // UMBRAL. Whispered Doubt: the king has fallen asleep at his war table,
  // crown slipping; a thing made of shadow stoops over him from behind and
  // whispers in his ear, violet wisps curling from its hood into his
  // dreams, its long fingers spread over his scattered battle plans.
  'whispered-doubt'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0c0818'], [0.5, '#1a1230'], [1, '#100a1c']]));
    // the stone wall of the war room
    const Rm = rng(17701);
    let mortar = '';
    for (let y = 12, row = 0; y < 160; y += 13, row++) {
      mortar += `M-5,${y}H305`;
      for (let x = (row % 2 ? 6 : 18) + Rm() * 6; x < 300; x += 22 + Rm() * 8) mortar += `M${f1(x)},${y}V${y + 13}`;
    }
    s.add(`<path d="${mortar}" stroke="#06040c" stroke-width="1.1" opacity=".75"/>`);
    // the tall window behind them, the moon in it
    const win = 'M96,160V72A55,55 0 0 1 206,72V160Z';
    s.glow(158, 70, 150, '#cdbcf4', 0.45);
    s.path(win, s.lin([[0, '#2a2050'], [0.6, '#4a3a7a'], [1, '#6a56a0']]));
    s.add(particles({ seed: 17702, n: 10, x: [104, 198], y: [30, 140], r: [0.25, 0.7], fill: '#efe8ff', cls: 'twinkle', op: [0.3, 0.9], t: [2.5, 6] }));
    s.add('<circle cx="158" cy="66" r="27" fill="#ece4fa"/><circle cx="150" cy="58" r="4.4" fill="#d8cfee" opacity=".6"/><circle cx="168" cy="74" r="3.2" fill="#d8cfee" opacity=".5"/>');
    s.add(`<path d="${win}" fill="none" stroke="#06040c" stroke-width="6"/><path d="M96,124H206" stroke="#06040c" stroke-width="3"/>`);
    s.shafts({ cx: 151, cy: 96, n: 7, from: 62, to: 118, len: 170, spread: 4, color: '#d6c8f6', op: 0.16, seed: 17703, sd: 2.6 });
    // the shadow (facing right): a tall hooded thing stooped over from the
    // left, its hood at his ear, its long arm reaching down to the plans;
    // below the waist it runs off into smoke
    const shadow = U(
      blob([[150, 98], [147, 88], [151, 79], [159, 75], [167, 78], [171, 86], [170, 96], [165, 102], [157, 103]], 4),
      taper([[152, 80], [141, 71], [128, 68]], [8, 4, 0.4]),
      blob([[148, 84], [140, 74], [126, 70], [112, 74], [100, 86], [92, 104], [86, 128], [82, 156], [78, 186], [70, 214], [128, 214], [122, 186], [124, 160], [132, 132], [144, 112], [154, 100]], 5),
      taper([[130, 94], [118, 112], [112, 134]], [7, 6, 5]), taper([[112, 134], [114, 148], [118, 162]], [5, 4.4, 3.8]),
      taper([[86, 190], [60, 200], [40, 214]], [12, 6, 1]), taper([[118, 196], [140, 206], [154, 214]], [8, 5, 1]),
    );
    const shade = { fill: '#06040b', rim: '#b8a6e2', offsets: [[0.8, -1], [0, -1.2], [-0.8, -0.8]], rimOp: 0.8 };
    s.figure(`<path d="${shadow}"/>`, { ...shade, shade: 0.3, light: [0.5, -1] });
    s.add('<g data-part="eyes"><path d="M163.6,88.6l3,.8M162.4,93.4l2.4,.6" stroke="#c49cff" stroke-width="1" stroke-linecap="round" opacity=".9"/></g>');
    // the king behind his table (facing right): fur on his shoulders, a
    // beard, head dropped forward asleep, the crown slipping off it
    const king = U(
      taper([[188, 168], [186, 146], [188, 128]], [38, 32, 26]),
      ell(188, 126, 16, 6.4),
      taper([[192, 122], [196, 113]], 7, { per: 2 }),
      profile(201, 102, 1.25, 14),
      blob([[196, 108], [203, 110], [208, 110], [209, 115], [205, 121], [200, 117]], 3),
      taper([[198, 130], [208, 144], [214, 158]], [10, 9, 8]),
    );
    s.figure(`<path d="${king}"/>`, { fill: '#130d20', rim: '#d6c8f6', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0, -1] });
    s.path(dots([[176, 128, 0.9], [182, 131, 0.9], [190, 131, 0.9], [197, 128, 0.9], [179, 124, 0.8], [192, 124, 0.8]]), '#d8cff0', 'opacity=".7"');
    const crownD = rot(poly([[193, 95], [192.2, 83.6], [197.4, 89.4], [202, 80.6], [206.6, 89.4], [211.8, 83.6], [211, 95]]), 202, 95, 26);
    s.add('<g data-part="crown">');
    s.path(crownD, s.linU(192, 82, 212, 96, [[0, '#f6dc94'], [1, '#a8782e']]));
    s.add('</g>');
    // the table and the plans scattered over it, under both their hands
    s.path('M-10,162L310,158L310,186L-10,188Z', s.lin([[0, '#3a2c48'], [1, '#221a2e']]));
    s.path('M-10,188L310,186L310,214L-10,214Z', '#0c0814');
    const plans = [quad(234, 170, 44, 20, -6), quad(200, 177, 28, 15, 10), quad(274, 174, 24, 14, -16), quad(126, 174, 46, 20, 4), quad(90, 178, 22, 13, -14), quad(162, 179, 22, 12, 12)];
    s.path(U(plans), s.linU(0, 158, 0, 188, [[0, '#d8ccb8'], [1, '#a8987e']]));
    s.add('<path d="M216,168l10,-4l8,6l10,-5M224,174l14,1M254,166l-6,8M192,173l10,6M188,181l14,-4M108,168l12,4l10,-3M106,178l20,1M140,170l8,6M264,172l10,4M158,178l8,-2M84,176l10,4" fill="none" stroke="#5a3a3a" stroke-width=".8" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M242,166l4,1.6-4,1.6M236,177l3.4,2-3.8,1M128,170l3.4,1.6-3.4,1.4" fill="none" stroke="#7a2a3a" stroke-width=".9" opacity=".8"/>');
    // his hand lying on them; and the shadow's, its long fingers spread
    s.figure(`<path d="${U(taper([[214, 156], [226, 160], [238, 162]], [8, 6.6, 5.4]), ell(241, 162, 4.6, 3, 0, 14))}"/>`, { fill: '#130d20', rim: '#d6c8f6', offsets: [[0, -1]], rimOp: 0.8 });
    const fingers = [[-34, 21], [-14, 24], [6, 24], [24, 21], [40, 15]].map(([a, l]) => taper([[118, 162], toward(118, 163, 90 + a * 0.6, l * 0.5), toward(118, 163, 90 + a, l)], [2.6, 1.7, 0.4], { per: 3 }));
    s.figure(`<path d="${U(taper([[112, 132], [113, 148], [118, 162]], [5, 4.4, 3.8]), ell(118, 163, 4, 3, 0, 12), fingers)}"/>`, shade);
    // little war pieces on the map, one knocked over
    const piece = (x, y) => U(ell(x, y, 2.2, 1.2, 0, 10), poly([[x - 1.2, y], [x - 0.8, y - 5], [x + 0.8, y - 5], [x + 1.2, y]]), ell(x, y - 6, 1.6, 1.6, 0, 10));
    s.path(U(piece(214, 163), piece(248, 165), piece(262, 170), rot(U(ell(190, 168, 1.2, 2.2, 0, 10), poly([[190, 166.8], [195, 167.2], [195, 168.8], [190, 169.2]]), ell(196.4, 168, 1.6, 1.6, 0, 10)), 193, 168, 8)), '#14101c');
    // the candle burned low
    s.path('M276,160h7v-9h-7Z', '#cfc4dc');
    s.glow(279.5, 146, 30, '#c49cff', 0.55, 'breathe');
    // the whisper: wisps out of the hood, into his ear, and up out of his
    // head into his dreams
    const wisp = [[164, 96], [172, 98], [180, 100], [187, 100], [191, 94], [188, 84], [186, 72], [192, 62], [204, 58], [212, 64], [208, 74], [199, 72], [200, 62], [212, 50], [228, 44], [244, 44]];
    const curl2 = [[192, 92], [204, 86], [216, 76], [226, 68], [238, 66], [250, 68]];
    const sw = spline(wisp, 6), sw2 = spline(curl2, 6);
    const wd = taper(sw, sw.map((_, i) => 0.4 + 2.6 * Math.sin((Math.PI * i) / (sw.length - 1))), { per: 1 });
    const wd2 = taper(sw2, sw2.map((_, i) => 0.3 + 1.6 * Math.sin((Math.PI * i) / (sw2.length - 1))), { per: 1 });
    s.glow(180, 98, 26, '#b07cff', 0.55, 'breathe');
    s.bloom(`<g data-part="wisp"><path d="${wd + wd2}" fill="#d2b0ff" opacity=".9"/><path d="${polyline(sw)}" fill="none" stroke="#f6eeff" stroke-width=".6" opacity=".9"/></g>` +
      `<g data-part="flame"><path d="${lens(279.5, 147, 9, -90, 0.44, 3)}" fill="#e6d2ff"/><path d="${lens(279.5, 148, 4, -90, 0.5, 3)}" fill="#ffffff"/></g>` +
      `<g data-part="twink"><path d="${glint(208, 83, 3.6, 0.16)}" fill="#fff6dc"/></g>`, { sd: 1.4, k: 1.5, box: [150, 26, 150, 140] });
    s.add(page(64, 198, -24, 0.85, 6, -1.2) + page(214, 204, 18, 0.7, 7, -3.4));
    s.motes({ seed: 17704, n: 14, x: [160, 250], y: [30, 110], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.35, 0.85] });
    return s.svg();
  },

  // VERDANT. Blight Beetle: a big iridescent beetle stands on a root of a
  // great tree and gnaws into it; the light that runs in the roots spills
  // out of the wound, and above, the tree's leaves wither and come down.
  'blight-beetle'(s) {
    fin(s, 'verdant');
    s.rect(s.lin([[0, '#4e6a44'], [0.3, '#8aa070'], [0.56, '#d4d8a4'], [0.7, '#eee8bc']]));
    // the sun through the wood behind
    const sx = 250, sy = 80;
    s.glow(sx, sy, 180, '#fff3c0', 0.7);
    s.shafts({ cx: sx, cy: sy, n: 12, from: 100, to: 200, len: 260, spread: 2.6, color: '#fffbe0', op: 0.24, seed: 17801 });
    s.glow(sx, sy, 40, '#fffbe6', 0.75);
    // the far wood
    s.layer(ridge({ seed: 17802, base: 150, amp: 30, freq: 3.4, oct: 2 }), '#a6b484', { blur: 0.8 });
    s.haze(120, 160, '#f6f0c4', 0.35);
    s.path(ledge([[-10, 170], [80, 166], [160, 170], [240, 166], [310, 168]]), s.lin([[0, '#6a7a48'], [1, '#2a3418']]));
    // the great tree: its trunk on the left, boughs over the top, the roots
    // running out across the floor of the wood
    const rootA = [[20, 172], [70, 160], [120, 156], [170, 160], [220, 170], [270, 184], [316, 194]];
    const rootB = [[30, 190], [80, 196], [120, 206], [150, 218]];
    const rootC = [[50, 166], [100, 150], [150, 146], [200, 150]];
    const bough1 = [[40, 30], [90, 14], [150, 2], [220, -6]], bough2 = [[46, 60], [100, 40], [160, 30], [200, 26]];
    const tree = U(
      poly([[-16, -10], [56, -10], [52, 40], [56, 100], [62, 140], [80, 168], [-16, 214]]),
      taper(rootA, [26, 20, 16, 14, 12, 9, 6]), taper(rootB, [16, 12, 9, 6]), taper(rootC, [12, 9, 7, 3]),
      taper(bough1, [16, 12, 8, 4]), taper(bough2, [10, 7, 4, 2]),
      taper([[120, 8], [134, 22], [142, 36]], [3, 2, 0.6]), taper([[180, 0], [196, 12], [204, 26]], [2.6, 1.8, 0.5]), taper([[132, 34], [148, 48], [152, 60]], [2.4, 1.6, 0.5]),
    );
    s.figure(`<path d="${tree}"/>`, { fill: '#26301a', rim: '#fff3c0', offsets: [[0.8, -1], [1.2, -0.2]], rimOp: 0.85, shade: 0.45, light: [0.7, -1] });
    s.add('<path d="M10,20Q16,80 8,140M30,0Q36,60 30,120M44,70Q50,120 60,150" fill="none" stroke="#141a0c" stroke-width="1.2" opacity=".7"/>');
    // the leaves along the boughs, most of them gone brown and curling
    const Rl = rng(17803), live = [], dead = [];
    const spots = [...spline(bough1, 8), ...spline(bough2, 8).slice(4)];
    for (let i = 0; i < 64; i++) {
      const [x, y] = spots[Math.floor(Rl() * spots.length)], a = 50 + Rl() * 110, l = 10 + Rl() * 6;
      if (x < 70) continue;
      (Rl() < 0.7 ? dead : live).push(leafAt(x + (Rl() - 0.5) * 8, y + 2, a, l, 0.4, 3));
    }
    s.figure(`<path d="${U(live)}"/>`, { fill: '#4a5c28', rim: '#fff3c0', offsets: [[0.6, -0.8]], rimOp: 0.6 });
    s.figure(`<path d="${U(dead)}"/>`, { fill: '#9a7230', rim: '#ffe6a0', offsets: [[0.6, -0.8]], rimOp: 0.7 });
    // the light running in the roots
    const vein = spline(rootA, 6), veinC = spline(rootC, 6), veinB = spline(rootB, 6);
    // the beetle (facing left, the middle of its wing cases at the origin):
    // head down, jaws sunk in the root
    const X = 178, Y = 118, K = 1.3, place = at(X, Y, K);
    const elytra = blob([[-22, 6], [-20, -10], [-8, -20], [10, -23], [28, -19], [42, -8], [46, 4], [38, 12], [18, 15], [-8, 14]], 5);
    const pron = blob([[-38, 8], [-40, -4], [-34, -13], [-22, -15], [-16, -6], [-18, 8], [-28, 11]], 4);
    const beetle = U(
      elytra, pron,
      blob([[-50, 12], [-52, 3], [-46, -4], [-38, -3], [-36, 8], [-42, 14]], 4),
      taper([[-50, 9], [-58, 12], [-62, 18], [-60, 23]], [4.6, 4, 2.6, 0.6]), taper([[-47, 12], [-52, 18], [-53, 24], [-50, 28]], [4.4, 3.8, 2.4, 0.6]),
      taper([[-46, -2], [-54, -12], [-62, -20], [-68, -22]], [1.6, 1.3, 1.1, 0.9]), ell(-70, -22.6, 3, 1.8, -10, 12),
      taper([[-42, -3], [-46, -16], [-52, -26], [-56, -30]], [1.5, 1.2, 1, 0.8]), ell(-57.6, -31, 2.8, 1.7, -40, 12),
      taper([[-30, 8], [-40, 17], [-46, 28], [-52, 30]], [3.6, 3, 1.8, 0.8]),
      taper([[-8, 12], [-12, 22], [-20, 30], [-25, 31]], [3.6, 3, 1.8, 0.8]),
      taper([[16, 13], [28, 21], [36, 30], [42, 31]], [3.6, 3, 1.8, 0.8]),
      taper([[-26, 8], [-22, 19], [-28, 29]], [2.8, 2.2, 0.8]), taper([[2, 12], [10, 21], [6, 30]], [2.8, 2.2, 0.8]), taper([[24, 12], [42, 17], [54, 27]], [2.8, 2.2, 0.8]),
    );
    // the wound in the root under its jaws
    const [bx, by] = [X - 57 * K, Y + 26 * K];
    s.figure(`<path d="${place(beetle)}"/>`, { fill: '#0c140e', rim: '#fff3c0', offsets: [[0.8, -1], [1.2, -0.2], [-0.4, -1]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0.7, -1] });
    // its shell: green, blue and violet shifting over it, a seam down it
    s.add('<g data-part="shell">');
    s.path(place(elytra), s.linU(X - 24 * K, Y - 22 * K, X + 44 * K, Y + 14 * K, [[0, '#2a7a58'], [0.35, '#1a5c70'], [0.65, '#333278'], [1, '#4a1e56']]));
    s.path(place(pron), s.linU(X - 40 * K, Y - 14 * K, X - 16 * K, Y + 10 * K, [[0, '#348a60'], [0.5, '#1a5064'], [1, '#262652']]));
    s.add(`<path d="${place('M-18,-9Q8,-24 44,-6')}" fill="none" stroke="#0c140e" stroke-width="1.2"/>` +
      `<path d="${place(U(lens(6, -17, 28, -8, 0.16, 3), lens(30, -12, 14, 20, 0.2, 3), lens(-30, -8, 10, -30, 0.24, 3)))}" fill="#d8fff0" opacity=".45"/>`);
    s.add('</g>');
    s.glow(bx, by, 36, '#e6f78f', 0.65, 'breathe');
    const cut = vein.findIndex(([x]) => x >= bx - 2);
    s.bloom(`<path d="${polyline(vein.slice(0, cut))}" fill="none" stroke="#efffb0" stroke-width="1.6" stroke-linecap="round" opacity=".9"/>` +
      `<path d="${polyline(vein.slice(cut + 1))}" fill="none" stroke="#b8c48a" stroke-width="1" stroke-linecap="round" opacity=".3"/>` +
      `<path d="${polyline(veinC)}" fill="none" stroke="#efffb0" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>` +
      `<path d="${polyline(veinB)}" fill="none" stroke="#efffb0" stroke-width="1.2" stroke-linecap="round" opacity=".7"/>` +
      `<path d="${lens(bx, by + 1, 9, -8, 0.5, 3)}" fill="#f7ffc8"/><path d="${dots([[bx - 3, by + 7, 1.3], [bx + 2, by + 11, 1.1], [bx - 1, by + 15, 0.9]])}" fill="#f7ffc8"/>`, { sd: 1.5, k: 1.5, box: [0, 120, 320, 100] });
    // dead leaves coming down
    const Rf = rng(17804);
    s.add(Array.from({ length: 10 }, (_, i) => {
      const x = 70 + Rf() * 220, y = 40 + Rf() * 110, a = Rf() * 360;
      return `<g class="float" style="--t:${f1(5 + Rf() * 4)}s;--d:${f1(-Rf() * 6)}s"><path d="${leafAt(x, y, a, 8 + Rf() * 3, 0.42, 3)}" fill="${i % 3 ? '#b08a3e' : '#7a6a2e'}"/></g>`;
    }).join(''));
    s.motes({ seed: 17805, n: 14, x: [bx - 20, bx + 30], y: [by - 50, by], r: [0.35, 0.9], fill: '#e6f78f', hot: '#ffffff', cls: 'rise', t: [3, 6], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── THE LEGENDS ───────────────────────────────────────────────────

  // VERDANT + TIDE. Ione, the Bloomcaller: on a riverbank at sundown a
  // young druid-mage reads aloud from an open book of pressed flowers; a
  // spell of light spirals up off its pages into the tree beside her, and
  // the tree breaks into blossom where it lands.
  'legend-ione'(s) {
    fin(s, ['verdant', 'tide']);
    s.rect(s.lin([[0, '#2e6670'], [0.28, '#6e9e98'], [0.5, '#c4d6aa'], [0.62, '#f0eac0']]));
    // the sun going down over the river, behind her
    const sx = 100, sy = 128;
    s.glow(sx, sy, 190, '#fff3c0', 0.75);
    s.shafts({ cx: sx, cy: sy, n: 14, from: -175, to: -5, len: 300, spread: 2.2, color: '#fffbe0', op: 0.2, seed: 9720 });
    s.glow(sx, sy, 46, '#fffbe6', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="12" fill="#fffaf0"/>`);
    // the far bank: willows, reeds
    const willows = U(ell(30, 128, 14, 10), ell(52, 126, 10, 12), ell(170, 128, 12, 9), ell(196, 126, 9, 11));
    s.layer(U(ridge({ seed: 9721, base: 137, amp: 5, freq: 3 }), willows), '#8aa888', { blur: 0.7 });
    s.haze(118, 142, '#fff3c8', 0.34);
    // the river
    s.path('M-10,136H310V214H-10Z', s.lin([[0, '#f0e6b8'], [0.12, '#9cbcae'], [0.5, '#3e7478'], [1, '#183a40']]));
    s.add(glitter([[sx, 139, 30, 0.8], [sx - 2, 143, 22, 0.7], [sx + 2, 148, 36, 0.6], [sx - 3, 154, 26, 0.5], [sx + 2, 161, 44, 0.4]], '#fffbe6'));
    s.add(`<g fill="none" stroke="#e8f4e0" stroke-width=".7" opacity=".45">${[[40, 158, 8], [160, 156, 7], [190, 166, 10], [24, 172, 9]].map(([x, y, r]) => `<path d="${oval(x, y, r, r * 0.22)}"/>`).join('')}</g>`);
    // the near bank: grass and reeds
    const bankTop = [[-12, 176], [40, 172], [100, 176], [150, 180], [210, 178], [260, 174], [312, 176]];
    const Rg = rng(9722), blades = [];
    for (let x = -8; x < 310; x += 2.6 + Rg() * 3.4) {
      const y = edgeAt(bankTop, x) + 1.5, h = 5 + Rg() * 10, l = (Rg() - 0.5) * 6;
      blades.push(taper([[x, y], [x + l * 0.4, y - h * 0.5], [x + l, y - h]], [1.8, 1.1, 0.3], { per: 3 }));
    }
    const reeds = U([[8, 40], [16, 52], [24, 36], [282, 46], [292, 38], [300, 50]].map(([x, h]) => taper([[x, 180], [x + 2, 180 - h * 0.6], [x + 3, 180 - h]], [2, 1.4, 0.6], { per: 3 })),
      [[16, 52], [292, 38]].map(([x, h]) => ell(x + 2.4, 180 - h * 0.86, 1.8, 5, 4, 12)));
    // the tree beside her: trunk and boughs, a crown breaking into blossom
    const tree = U(
      taper([[256, 214], [258, 180], [252, 150], [244, 120], [238, 96]], [22, 16, 13, 11, 9]),
      taper([[248, 132], [270, 112], [292, 100], [312, 98]], [8, 6, 4, 2]),
      taper([[242, 108], [222, 90], [204, 80], [190, 74]], [7, 5, 3.4, 2]),
      taper([[238, 98], [240, 70], [248, 44], [260, 24]], [7, 5, 3.4, 2]),
    );
    s.figure(`<path d="${ledge(bankTop)}"/><path d="${U(blades)}"/><path d="${reeds}"/><path d="${tree}"/>`, { fill: '#1e2c1c', rim: '#fff3c8', offsets: [[-1, -1], [0, -1.2], [1, -0.6]], rimOp: 0.85, shade: 0.4, light: [-0.4, -1] });
    const crown = puffs([[196, 70, 14], [216, 56, 16], [240, 44, 18], [266, 30, 18], [292, 26, 18], [312, 40, 16], [228, 76, 12], [256, 64, 14], [284, 58, 14], [304, 70, 12], [276, 92, 12], [300, 96, 10], [248, 22, 14], [278, 8, 16], [306, 6, 16]], 1.25);
    s.figure(`<path d="${crown}"/>`, { fill: s.radU(214, 60, 120, [[0, '#fff2ea'], [0.5, '#ecc8cc'], [1, '#9a8a9a']]), rim: '#fffaf0', offsets: [[-1, -0.6], [0, -1.2]], rimOp: 0.85 });
    // blossom all over it, deeper pink in the shade
    const Rb = rng(9725), petals = [];
    for (let i = 0; i < 26; i++) {
      const x = 200 + Rb() * 110, y = 10 + Rb() * 90;
      if (Math.hypot(x - 214, y - 60) < 18) continue;
      petals.push(bloomAt(x, y, 2.6 + Rb() * 1.6, Rb() * 72));
    }
    s.path(U(petals), '#c88a9c', 'opacity=".55"');
    // Ione (facing right, feet at the origin): a long dress, a hooded cloak
    // thrown back off her shoulders, hair loose with a wreath in it, the open
    // book held out in both hands
    const X = 126, Y = 194, K = 1.06, place = at(X, Y, K);
    const her = place(U(
      blob([[-9, -76], [9, -76], [12, -56], [16, -32], [22, -8], [26, 0], [8, 1], [-8, 1], [-22, -1], [-30, -4], [-22, -12], [-16, -32], [-13, -56]], 4),
      ell(16, -0.8, 5, 2),
      blob([[-6, -92], [-14, -86], [-24, -66], [-34, -40], [-48, -18], [-60, -8], [-44, -10], [-30, -18], [-20, -36], [-12, -60], [-4, -80]], 4),
      taper([[0, -70], [0, -84], [0, -96]], [13, 13, 16]),
      ell(-6, -95, 4.6, 3.6), ell(6, -95, 4.6, 3.6),
      taper([[0.6, -98], [1.2, -103]], 4, { per: 2 }),
      profile(2.4, -110, 0.84, -10),
      blob([[2, -118], [-5, -119], [-12, -116], [-19, -110], [-25, -103], [-31, -97], [-38, -93], [-30, -92], [-22, -94], [-15, -97], [-9, -103], [-4, -110]], 4),
      taper([[-16, -108], [-26, -104], [-34, -102], [-42, -98]], [3.4, 2.8, 2, 0.4]),
      taper([[6, -94], [14, -90], [20, -84]], [4.4, 3.8, 3.4]), taper([[20, -84], [26, -88], [30, -92]], [3.4, 3.2, 2.8]), ell(31, -93, 2.6, 2.4),
      taper([[-6, -94], [0, -84], [10, -80]], [4.4, 3.8, 3.4]), taper([[10, -80], [18, -82], [24, -86]], [3.4, 3.2, 2.8]), ell(25, -87, 2.6, 2.4),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#142018', rim: '#fff6d0', offsets: [[-1.2, -0.6], [0, -1.3], [1, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.5, -1] });
    // the wreath in her hair
    s.path(U([[-5, -117.4, 2], [0, -119.2, 2.2], [5, -117.4, 2], [-9.6, -114.6, 1.8]].map(([x, y, r], i) => bloomAt(X + x * K, Y + y * K, r, i * 30))), '#f6d8e0');
    // the book: its pages lit, pressed flowers on them
    const bkx = X + 30 * K, bky = Y - 92 * K;
    const pages = `M${f1(bkx)},${f1(bky + 2)}L${f1(bkx - 11)},${f1(bky - 2)}L${f1(bkx - 10)},${f1(bky - 9)}L${f1(bkx)},${f1(bky - 5)}ZM${f1(bkx)},${f1(bky + 2)}L${f1(bkx + 10)},${f1(bky - 3)}L${f1(bkx + 9)},${f1(bky - 10)}L${f1(bkx)},${f1(bky - 5)}Z`;
    // the spell: two strands of light, one leaf-gold and one river-pale,
    // twisting round each other on an arc from the pages up and over into
    // the crown, petals and leaves and little glyphs caught along them
    const end = [216, 60];
    const axis = (t) => [bkx + (end[0] - bkx) * t - Math.sin(t * Math.PI) * 20, bky - 6 + (end[1] - bky + 6) * t - Math.sin(t * Math.PI) * 26];
    const strand = (ph) => Array.from({ length: 71 }, (_, i) => {
      const t = i / 70, [x, y] = axis(t), [x2, y2] = axis(t + 0.01), dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1;
      const o = Math.sin(t * Math.PI * 4 + ph) * (2 + 5.4 * Math.sin(t * Math.PI * 0.92));
      return [x - (dy / l) * o, y + (dx / l) * o];
    });
    const sa = strand(0), sb = strand(Math.PI);
    const rib = (pts, w) => taper(pts, pts.map((_, i) => 0.4 + w * Math.sin((Math.PI * i) / 70)), { per: 1 });
    const along = [12, 22, 32, 42, 52, 62].map((i) => axis(i / 70));
    const bits = U(along.map(([x, y], i) => (i % 2 ? leafAt(x, y, -60 + i * 40, 7, 0.42, 3) : bloomAt(x, y, 3.4, i * 20))));
    const flowers = U([[216, 60, 6], [205, 71, 4.6], [228, 49, 5.4], [233, 68, 4.6], [199, 60, 4], [243, 57, 4.2], [220, 78, 4], [210, 48, 3.6]].map(([x, y, r], i) => bloomAt(x, y, r, i * 23)));
    s.glow(bkx, bky - 4, 32, '#fff6c0', 0.7, 'breathe');
    s.glow(end[0], end[1], 46, '#fff0d8', 0.65, 'breathe');
    s.bloom(`<path d="${polyline(Array.from({ length: 41 }, (_, i) => axis(i / 40)))}" fill="none" stroke="#f7ffc8" stroke-width="10" stroke-linecap="round" opacity=".2"/>` +
      `<path d="${rib(sa, 4)}" fill="#e6f78f"/><path d="${rib(sb, 3.4)}" fill="#c6f4f6"/>` +
      `<path d="${polyline(sa)}" fill="none" stroke="#ffffff" stroke-width=".6" opacity=".8"/>` +
      `<path d="${bits}" fill="#f7ffc8"/><path d="${flowers}" fill="#fff6f0"/><path d="${dots([[216, 60, 1.5], [205, 71, 1.1], [228, 49, 1.3], [233, 68, 1.1]])}" fill="#ffe08a"/>` +
      `<path d="${pages}" fill="#fffbea"/>`, { sd: 1.5, k: 1.5, box: [120, 10, 150, 110] });
    s.add(`<path d="${along.slice(0, 5).map(([x, y], i) => rune(i, x + (i % 2 ? -12 : 12), y + 3, 0.8)).join('')}" fill="none" stroke="#fffbe0" stroke-width=".6" opacity=".8"/>`);
    s.path(dots([[bkx - 6, bky - 4, 1.1], [bkx + 5, bky - 5, 1.1], [bkx - 4, bky - 1.6, 0.8], [bkx + 4, bky - 2, 0.8]]), '#c87a8a', 'opacity=".75"');
    // petals coming down off the tree
    const Rp = rng(9723);
    s.add(Array.from({ length: 8 }, () => {
      const x = 180 + Rp() * 120, y = 80 + Rp() * 90;
      return `<g class="float" style="--t:${f1(5 + Rp() * 4)}s;--d:${f1(-Rp() * 6)}s"><path d="${lens(x, y, 4, Rp() * 180, 0.5, 3)}" fill="#fbe6ea" opacity=".85"/></g>`;
    }).join(''));
    s.motes({ seed: 9724, n: 14, x: [120, 280], y: [30, 170], r: [0.4, 1], fill: '#f7ffc8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // TIDE + UMBRAL. Hush, the Fog Witch: on a dark shore a pale witch holds
  // out her lantern; behind her a wall of fog stands up out of the sea to
  // the sky, and in it, faint, the shapes of the warriors it has swallowed.
  'legend-hush'(s) {
    fin(s, ['tide', 'umbral']);
    s.rect(s.lin([[0, '#0b0b1c'], [0.3, '#1c2040'], [0.52, '#324468'], [0.62, '#46607a']]));
    s.add(particles({ seed: 9740, n: 18, x: [0, W], y: [0, 40], r: [0.25, 0.75], fill: '#e8eefa', cls: 'twinkle', op: [0.25, 0.85], t: [2.5, 6] }));
    // the moon, low on the left where the fog has not yet reached
    const mx = 46, my = 26;
    s.glow(mx, my, 130, '#d8e2f6', 0.5);
    s.add(`<circle cx="${mx}" cy="${my}" r="11" fill="#eef2fa"/>`);
    // the wall of fog standing up out of the sea, towering higher to the
    // right: great billows piled on each other, lit along the top by the moon
    const tops = [[-24, 70, 26], [12, 62, 22], [46, 54, 22], [80, 44, 26], [116, 32, 30], [154, 22, 32], [194, 14, 34], [236, 8, 34], [276, 4, 34], [316, 8, 34],
      [136, 6, 16], [176, -6, 18], [222, -14, 20], [268, -18, 22], [304, -20, 22]];
    const wall = U(puffs(tops, 1.3), tops.map(([x, y, r]) => poly([[x - r * 1.25, y], [x + r * 1.25, y], [x + r * 1.25, 110], [x - r * 1.25, 110]])), 'M-14,100L314,100L314,160L-14,160Z');
    s.figure(`<path d="${wall}"/>`, { fill: s.lin([[0, '#c4cce0'], [0.35, '#98a5c0'], [1, '#6e7fa0']]), rim: '#f2f5ff', offsets: [[-0.8, -1], [0, -1.2], [-1.2, 0]], rimOp: 0.85 });
    s.add(mist(s, '#5e6e90', 0.45, tops.slice(0, 10).map(([x, y, r]) => [x + 8, y + r * 0.6, r * 1.15, r * 0.4])));
    // the lost warriors in it: ranks of them, fading back into the fog
    const warrior = (x, b, k, v, spear = true) => at(x, b, k, v % 2 ? 1 : -1)(U(
      taper([[-3, -28], [-4, -14], [-4.6, 0]], [4.6, 4, 3.6], { per: 3 }), taper([[3, -28], [4, -14], [4.6, 0]], [4.6, 4, 3.6], { per: 3 }),
      taper([[0, -26], [0, -40], [0, -52]], [13, 13.4, 16], { per: 3 }),
      ell(0, -57.5, 4.6, 5.2, 0, 12), v % 3 ? poly([[-5.6, -58], [0, -66], [5.6, -58]]) : ell(0, -60, 6.4, 2.4, 0, 12),
      v % 2 ? ell(7, -38, 7.4, 9.4, 0, 12) : taper([[7, -50], [9, -38], [9, -28]], [4, 3.4, 3], { per: 3 }),
      taper([[-8, -50], [-10, -38], [-9, -28]], [4, 3.4, 3], { per: 3 }),
      spear && v % 4 !== 1 ? [taper([[-10, 2], [-10, -84]], [2, 1.6], { per: 2 }), poly([[-12, -84], [-10, -92], [-8, -84]])] : [],
      spear && v % 5 === 2 ? poly([[-10, -82], [-1, -82], [-2, -66], [-5, -70], [-8, -63], [-10, -66]]) : [],
    ));
    const Rw = rng(9741), heads = [];
    const rank = (n, x0, x1, b, k, skip, spear) => U(Array.from({ length: n }, (_, i) => {
      const x = x0 + ((x1 - x0) * (i + 0.5)) / n + (Rw() - 0.5) * 8, bb = b + (Rw() - 0.5) * 3, kk = k * (0.9 + Rw() * 0.2), v = Math.floor(Rw() * 30);
      if (Math.abs(x - 150) < skip) return [];
      heads.push([x, bb - 57.5 * kk, kk]);
      return warrior(x, bb, kk, v, spear);
    }));
    const farRank = rank(12, -10, 310, 124, 0.5, 0, false), nearRank = rank(7, -24, 324, 158, 0.86, 30, true);
    s.blur(`<path d="${farRank}" fill="#8290ae" opacity=".55"/><path d="${nearRank}" fill="#56658a" opacity=".6"/>`, 0.9);
    s.add(mist(s, '#d0d6e4', 0.6, [[60, 116, 80, 10], [236, 112, 90, 9], [150, 134, 100, 9], [20, 148, 70, 10], [280, 150, 70, 10]]));
    // here and there a pair of eyes in it
    s.add(`<path d="${heads.filter((_, i) => [2, 9, 13, 15, 17].includes(i)).map(([x, y, k]) => `M${f1(x - 2.4 * k)},${f1(y)}h${f1(1.4 * k)}M${f1(x + 1 * k)},${f1(y)}h${f1(1.4 * k)}`).join('')}" stroke="#e0fbff" stroke-width="1" stroke-linecap="round" opacity=".6"/>`);
    // the sea at the foot of the fog, the shore
    s.path('M-10,156H310V214H-10Z', s.lin([[0, '#5a6e88'], [0.2, '#24344c'], [1, '#0c1420']]));
    s.add(glitter([[90, 160, 40, 0.35], [210, 163, 50, 0.3], [150, 166, 70, 0.25]], '#cfe2ee'));
    const shore = [[-12, 176], [50, 172], [110, 175], [170, 178], [230, 174], [312, 177]];
    s.path(ledge(shore), s.lin([[0, '#1c2230'], [1, '#07090e']]));
    s.add(`<path d="${polyline(spline(shore, 6).map(([x, y]) => [x, y - 0.6]))}" fill="none" stroke="#dce8f0" stroke-width="1.1" opacity=".55"/>`);
    s.figure(`<path d="${U(blob([[0, 214], [4, 196], [20, 188], [38, 192], [46, 214]], 4), blob([[262, 214], [268, 198], [284, 192], [300, 196], [308, 214]], 4))}"/>`, { fill: '#0a0c14', rim: '#b8c8e0', offsets: [[0, -1]], rimOp: 0.6 });
    // Hush (facing right, feet at the origin): a long dark cloak with a high
    // collar, its hem turning to fog; long pale hair blowing back off her
    // pale face; the lantern held out low
    const X = 146, Y = 194, K = 1.08, place = at(X, Y, K);
    const lamp = lanternAt(X + 30 * K, Y - 62 * K, 1.3);
    const her = U(place(U(
      blob([[-10, -86], [10, -86], [13, -60], [16, -34], [20, -10], [22, 0], [-14, 0], [-30, -4], [-46, -8], [-32, -16], [-20, -34], [-14, -60]], 4),
      taper([[0, -80], [0, -94], [0, -104]], [16, 15, 18]),
      ell(-7, -103, 5, 3.8), ell(7, -103, 5, 3.8),
      poly([[-10, -104], [-13, -118], [-3, -108]]), poly([[6, -106], [9, -116], [2, -109]]),
      taper([[8, -100], [16, -88], [22, -76]], [5.4, 4.6, 4]), taper([[22, -76], [27, -68], [30, -62]], [4, 3.6, 3.2]), ell(30, -61, 2.6, 2.6),
      taper([[-7, -100], [-10, -86], [-8, -72]], [5, 4.4, 3.8]),
    )), lamp.frame);
    s.figure(`<path d="${her}"/>`, { fill: s.linU(0, Y - 118 * K, 0, Y, [[0, '#090c16'], [0.6, '#0e1220'], [0.86, '#3a4660'], [1, '#7a88a6']]), rim: '#e6f0ff', offsets: [[0, -1.3], [-1.1, -0.7], [1.1, -0.7]], rimOp: 0.95 });
    // her pale face, and her long white hair blowing back off it
    s.figure(`<path d="${place(U(taper([[2, -106], [3, -112]], 4.4, { per: 2 }), profile(5, -118, 0.82, -8)))}"/>`, { fill: '#e2e8f2', rim: '#ffffff', offsets: [[0.6, -0.8]], rimOp: 0.9 });
    const hair = place(U(
      blob([[5, -126], [-2, -128.6], [-12, -127], [-24, -122], [-36, -116], [-48, -110], [-58, -106], [-46, -104], [-36, -102], [-26, -96], [-18, -92], [-10, -96], [-4, -106], [-1, -116]], 4),
      taper([[-14, -100], [-24, -92], [-34, -88], [-44, -82]], [4, 3.4, 2.4, 0.5]),
      taper([[-20, -122], [-34, -124], [-46, -122], [-56, -118]], [4, 3, 2, 0.4]),
    ));
    s.figure(`<path d="${hair}"/>`, { fill: '#c6cedc', rim: '#ffffff', offsets: [[0, -1], [0.8, -0.6]], rimOp: 0.9, shade: 0.4, light: [0.3, -1] });
    s.add(`<path d="${place('M-4,-123Q-20,-120 -36,-113T-54,-106M-6,-116Q-18,-110 -30,-102M-10,-108Q-16,-100 -22,-96')}" fill="none" stroke="#8e9cb4" stroke-width=".7" opacity=".8"/>`);
    // fog curling round her and along the shore
    s.add(mist(s, '#c8d0de', 0.6, [[100, 190, 60, 5], [200, 195, 56, 4.4], [146, 205, 80, 5], [30, 200, 50, 4.6], [270, 203, 50, 4.6]]));
    // the lantern: a cold green-white witchlight
    s.glow(lamp.c[0], lamp.c[1], 70, '#c6f4f6', 0.5);
    s.glow(lamp.c[0], lamp.c[1], 20, '#effffc', 0.75, 'breathe');
    s.bloom(`<path d="${lamp.glass}" fill="${s.radU(lamp.c[0], lamp.c[1], 8, [[0, '#ffffff'], [0.5, '#dcfff8'], [1, '#8adcd0']])}"/>` +
      `<path d="${glint(lamp.c[0], lamp.c[1], 9, 0.12)}" fill="#ffffff" opacity=".85"/>`, { sd: 1.6, k: 1.5, box: [140, 100, 70, 70] });
    s.motes({ seed: 9742, n: 16, x: [20, 280], y: [60, 200], r: [0.35, 0.9], fill: '#c6f4f6', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },
};
