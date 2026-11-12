// Card art for the SATTC Ultra version 4 cards, part E: the tricksters of
// Smoke and Mirrors (151–156, Tide and Umbral), the spells of Storm Rising
// (157–160, Ember and Tide) and two Legends, Mirelle the Mask-Maker and
// Seren the Storm-Scholar. Style rules live in ../scenes.js; drawing tools
// in ../kit.js. Seeds: a card's number × 100 plus a count; Mirelle uses
// 9640–9659 and Seren 9660–9679.

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
// never join a union (mv/rot/at would bend its radii).
const oval = (cx, cy, rx, ry, deg = 0) => {
  const c = Math.cos(rad(deg)) * rx, sn = Math.sin(rad(deg)) * rx;
  return `M${f1(cx - c)},${f1(cy - sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(2 * c)},${f1(2 * sn)}a${f1(rx)},${f1(ry)} ${f1(deg)} 1,0 ${f1(-2 * c)},${f1(-2 * sn)}Z`;
};

// Move or rotate a polygon path; at() carries a figure drawn at the origin
// to (x, y) at scale k (dir -1 mirrors it to face the other way).
const mv = (d, dx, dy) => d.replace(NUM, (_, x, y) => `${f1(+x + dx)},${f1(+y + dy)}`);
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
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
const profile = (cx, cy, k, tilt = 0, dir = 1) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k * dir, cy + y * k])), cx, cy, tilt * dir);

// Fog or cloud: overlapping round puffs, [[x, y, r], ...].
const puffs = (list, flat = 1.3) => U(list.map(([x, y, r]) => ell(x, y, r * flat, r, 0, 20)));

// Thin horizontal glints of light on water: [[x, y, w, op], ...].
const glitter = (list, color) => `<g fill="${color}">${list.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${f1(y)}" width="${f1(w)}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`;

// A jagged line of lightning from a to b, as points; polyline() strokes it.
function bolt(a, b, seed, n = 9, jg = 6) {
  const R = rng(seed), pts = [a];
  const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
  for (let i = 1; i < n; i++) {
    const t = i / n, j = (R() - 0.5) * 2 * jg;
    pts.push([a[0] + dx * t + nx * j, a[1] + dy * t + ny * j]);
  }
  pts.push(b);
  return pts;
}
const polyline = (pts) => 'M' + pts.map(pt).join('L');

// Little magic glyphs, as stroke path data, about 5k tall, centred on (x, y).
const RUNES = [
  (x, y, k) => `M${f1(x)},${f1(y + 2.4 * k)}V${f1(y - 2.4 * k)}M${f1(x)},${f1(y)}L${f1(x - 1.6 * k)},${f1(y - 2.2 * k)}M${f1(x)},${f1(y)}L${f1(x + 1.6 * k)},${f1(y - 2.2 * k)}`,
  (x, y, k) => `M${f1(x)},${f1(y - 2.4 * k)}L${f1(x + 1.7 * k)},${f1(y)}L${f1(x)},${f1(y + 2.4 * k)}L${f1(x - 1.7 * k)},${f1(y)}Z`,
  (x, y, k) => `M${f1(x - 1.4 * k)},${f1(y - 2.4 * k)}H${f1(x + 1.4 * k)}L${f1(x - 1.4 * k)},${f1(y + 2.4 * k)}H${f1(x + 1.4 * k)}`,
  (x, y, k) => `M${f1(x - 1.7 * k)},${f1(y)}a${f1(1.7 * k)},${f1(1.7 * k)} 0 1,0 ${f1(3.4 * k)},0a${f1(1.7 * k)},${f1(1.7 * k)} 0 1,0 ${f1(-3.4 * k)},0M${f1(x)},${f1(y - 2.6 * k)}V${f1(y + 2.6 * k)}`,
  (x, y, k) => `M${f1(x - 1.6 * k)},${f1(y + 2.4 * k)}L${f1(x)},${f1(y - 2.4 * k)}L${f1(x + 1.6 * k)},${f1(y + 2.4 * k)}M${f1(x - 0.9 * k)},${f1(y + 0.4 * k)}H${f1(x + 0.9 * k)}`,
  (x, y, k) => `M${f1(x - 1.4 * k)},${f1(y - 2.4 * k)}V${f1(y + 2.4 * k)}M${f1(x - 1.4 * k)},${f1(y - 2.4 * k)}L${f1(x + 1.6 * k)},${f1(y - 0.8 * k)}L${f1(x - 1.4 * k)},${f1(y + 0.8 * k)}`,
  (x, y, k) => `M${f1(x - 1.8 * k)},${f1(y - 1.6 * k)}L${f1(x + 1.8 * k)},${f1(y + 1.6 * k)}M${f1(x + 1.8 * k)},${f1(y - 1.6 * k)}L${f1(x - 1.8 * k)},${f1(y + 1.6 * k)}M${f1(x)},${f1(y - 2.6 * k)}V${f1(y - 1.2 * k)}`,
];
const rune = (i, x, y, k = 1) => RUNES[((i % RUNES.length) + RUNES.length) % RUNES.length](x, y, k);

// Every vertex of a polygon path, [[x, y], ...].
const ptsOf = (d) => [...d.matchAll(NUM)].map((m) => [+m[1], +m[2]]);

// A mask hanging on a wall, centred on (x, y), k its size; kinds: 0 round
// face, 1 domino half-mask, 2 long nose, 3 horned, 4 crescent, 5 teardrop.
// Returns [face, holes].
function maskAt(x, y, k, kind, tilt = 0) {
  let face;
  const eyes = [lens(x - 2.1 * k, y - 0.8 * k, 2.6 * k, 8, 0.5, 3), lens(x + 2.1 * k, y - 0.8 * k, 2.6 * k, -8, 0.5, 3)];
  if (kind === 0) face = ell(x, y + 0.6 * k, 4.6 * k, 6 * k, 0, 16);
  else if (kind === 1) face = blob([[x - 5.4 * k, y - 1.4 * k], [x - 3 * k, y - 3.4 * k], [x, y - 2.4 * k], [x + 3 * k, y - 3.4 * k], [x + 5.4 * k, y - 1.4 * k], [x + 3.2 * k, y + 1.8 * k], [x, y + 0.8 * k], [x - 3.2 * k, y + 1.8 * k]], 3);
  else if (kind === 2) face = U(ell(x, y, 4.2 * k, 5 * k, 0, 16), poly([[x - 1.4 * k, y + 1 * k], [x + 1.4 * k, y + 1 * k], [x, y + 8.4 * k]]));
  else if (kind === 3) face = U(ell(x, y + 0.6 * k, 4.4 * k, 5.6 * k, 0, 16), taper([[x - 3 * k, y - 3.6 * k], [x - 5.6 * k, y - 7.4 * k], [x - 5 * k, y - 10 * k]], [2.4 * k, 1.4 * k, 0.3]), taper([[x + 3 * k, y - 3.6 * k], [x + 5.6 * k, y - 7.4 * k], [x + 5 * k, y - 10 * k]], [2.4 * k, 1.4 * k, 0.3]));
  else if (kind === 4) face = blob([[x - 4.6 * k, y - 4 * k], [x - 1 * k, y - 2 * k], [x + 3.4 * k, y - 0.4 * k], [x + 4.6 * k, y + 3 * k], [x + 1 * k, y + 5.6 * k], [x - 3.6 * k, y + 4.4 * k], [x - 5.6 * k, y + 0.4 * k]], 3);
  else face = blob([[x, y - 5 * k], [x + 4.2 * k, y - 2.6 * k], [x + 3.6 * k, y + 2.6 * k], [x, y + 7 * k], [x - 3.6 * k, y + 2.6 * k], [x - 4.2 * k, y - 2.6 * k]], 4);
  return [rot(face, x, y, tilt), rot(eyes.join(''), x, y, tilt)];
}

export const ultra_e = {
  // ── SMOKE AND MIRRORS ─────────────────────────────────────────────

  // TIDE. Turnabout: a swordsman at the top of a somersault, upside down
  // over the lip of a breaking wave against the moon; the sea below is
  // glass, and in it his double stands the right way up.
  turnabout(s) {
    fin(s, 'tide');
    const p = PAL.tide, HY = 116, o = HY / H;
    s.rect(s.lin([[0, '#0a2230'], [0.3, '#1c4a58'], [f2(o - 0.06), '#6aaaa8'], [f2(o - 0.005), '#a8d8ce'], [f2(o + 0.01), '#5a9a9c'], [0.8, '#163e4c'], [1, '#06161e']]));
    s.add(particles({ seed: 15101, n: 16, x: [0, W], y: [0, 70], r: [0.25, 0.75], fill: '#e4fbfb', cls: 'twinkle', op: [0.25, 0.8], t: [2.5, 6] }));
    const mx = 176, my = 50;
    s.glow(mx, my, 150, '#dcf8f2', 0.5);
    s.glow(mx, 2 * HY - my, 90, '#bfeee8', 0.24);
    // the far headland; the breaker he has just come over, its lip curling
    const head = poly([...spline([[204, HY + 1], [222, HY - 5], [242, HY - 12], [262, HY - 15], [282, HY - 11], [300, HY - 12], [314, HY - 9]], 5), [314, HY + 1]]);
    const body = poly([...spline([[-14, 108], [8, 104], [34, 96], [58, 84], [78, 68], [94, 54], [108, 46], [120, 46], [127, 54], [128, 66], [126, 80], [128, 94], [136, 106], [152, 113], [172, 116.2]], 5), [172, HY + 0.6], [-14, HY + 0.6]]);
    const lip = taper([[102, 47], [116, 43], [128, 47], [136, 56], [139, 67], [136.6, 78], [132, 84]], [5, 7.4, 7.4, 6, 4, 2, 0.6]);
    const wfill = s.linU(0, 42, 0, HY, [[0, '#c2f2ea'], [0.22, '#6ab4b4'], [0.6, '#2c707c'], [1, '#1d5866']]);
    // the swordsman upside down at the top of his somersault (drawn about
    // his hips, head down and feet up), turned a little into the spin
    const cx = 174, cy = 56, tilt = -16;
    const local = U(
      taper([[0, 0], [0, 11], [0, 22]], [10, 11, 12.5]),
      ell(-4.8, 21.5, 3.4, 2.8), ell(4.8, 21.5, 3.4, 2.8),
      taper([[0, 23], [0, 27.5]], 3.6, { per: 2 }),
      ell(0.4, 32.4, 4.5, 5.2),
      taper([[2.5, 0], [4, -14], [5, -27]], [6.6, 5.4, 4.2]), ell(2.4, -28.4, 4.4, 1.9, -6),
      taper([[-2.5, 0], [-12, -9]], [6.6, 5.6], { per: 2 }), taper([[-12, -9], [-9.4, -21]], [5.4, 4.2], { per: 2 }), ell(-12, -22.4, 4.4, 1.9, 6),
      taper([[5, 21], [14, 19], [23, 15]], [3.8, 3.4, 3]), ell(24.4, 14.4, 2.3, 2),
      taper([[-5, 21], [-12, 27], [-17, 34]], [3.8, 3.4, 3]), ell(-18, 35.4, 2.2, 2),
      taper([[-2, 22], [-11, 15], [-20, 12], [-31, 13]], [3.6, 3.4, 2.4, 0.5]),
    );
    const place = (d) => rot(at(cx, cy, 1.18)(d), cx, cy, tilt);
    const man = place(local);
    const sword = place(U(taper([[26, 13.6], [58, -1]], [2.2, 0.5], { per: 2 }), taper([[24, 10.4], [27.6, 17.6]], 1.4, { per: 2 })));
    // his double in the glass below, the right way up
    s.add(`<g transform="matrix(1 0 0 -1 0 ${2 * HY})" opacity=".85"><path d="${head}" fill="#2c6a72"/>` +
      `<circle cx="${mx}" cy="${my}" r="15" fill="#e2f6f2"/><path d="${body + lip}" fill="${wfill}"/>` +
      `<g data-part="double"><path d="${man + sword}" fill="#0c2a32"/></g></g>`);
    s.add(`<rect x="-5" y="${HY}" width="${W + 10}" height="${H - HY + 5}" fill="${s.lin([[0, '#4a9496', 0.1], [0.5, '#0e3442', 0.4], [1, '#04121a', 0.7]])}"/>`);
    const R = rng(15102);
    let rip = '';
    for (let i = 0; i < 24; i++) {
      const y = HY + 4 + Math.pow(R(), 1.3) * 90, x = R() * 300 - 10, w = 8 + R() * 30 * (1 + (y - HY) / 50);
      rip += `M${f1(x)},${f1(y)}h${f1(w)}`;
    }
    s.add(`<path d="${rip}" stroke="#d8f6f1" stroke-width=".7" opacity=".32" stroke-linecap="round"/>`);
    s.add(glitter([[mx, 2 * HY - my - 10, 16, 0.5], [mx - 3, 2 * HY - my - 4, 26, 0.45], [mx + 2, 2 * HY - my + 3, 22, 0.42], [mx - 2, 2 * HY - my + 10, 30, 0.35], [mx + 3, 2 * HY - my + 17, 20, 0.3]], '#f2fffc'));
    s.add(`<path d="M-10,${HY + 0.4}H310" stroke="#ecfdf9" stroke-width=".9" opacity=".6"/>`);
    // the world above
    s.add(`<circle cx="${mx}" cy="${my}" r="15" fill="#f4fcf8"/>`);
    s.layer(head, '#2a6670', { blur: 0.6 });
    s.path(body + lip, wfill);
    s.path(lens(131, 66, 18, 84, 0.5), '#1a5462', 'opacity=".75"');
    s.add('<path d="M30,97Q58,84 80,64T118,43.6Q133,46 139,62" fill="none" stroke="#f2fffc" stroke-width="2.2" stroke-linecap="round" opacity=".9"/>' +
      '<path d="M48,98Q70,86 90,66M70,100Q88,90 100,76" fill="none" stroke="#e2faf6" stroke-width="1" stroke-linecap="round" stroke-dasharray="6 3" opacity=".45"/>');
    // the arc of his flight, off the lip and over the moon
    s.path(taper([[138, 58], [140, 38], [152, 22], [172, 13], [196, 16], [214, 30], [223, 50]], [0.4, 2.4, 3.6, 4, 3.6, 2.2, 0.4]), '#effdf9', 'opacity=".3"');
    s.figure(`<path d="${man}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[0, -1.3], [-1.1, -0.8], [1.1, -0.8], [0, 1]], rimOp: 0.95, shade: 0.4, edge: 0.3, light: [0, -1] });
    const [tx, ty] = ptsOf(place('M58,-1'))[0];
    s.add('<g data-part="sword">');
    s.path(sword, '#cfe6ea');
    s.bloom(`<path d="${place('M27,12.6L57,-1')}" stroke="#ffffff" stroke-width=".9" stroke-linecap="round"/><path d="${glint(tx, ty, 6)}" fill="#ffffff"/>`, { sd: 1.2, k: 1.5, box: [150, 20, 90, 70] });
    s.add('</g>');
    // spray thrown off the lip
    const spray = [];
    for (let i = 0; i < 22; i++) { const a = rad(-160 + R() * 150), d = 5 + R() * 26; spray.push([136 + Math.cos(a) * d * 1.2, 56 + Math.sin(a) * d, 0.5 + R() * 1.1]); }
    s.path(dots(spray), '#effdfa', 'opacity=".8"');
    s.motes({ seed: 15103, n: 12, x: [110, 230], y: [20, 110], r: [0.4, 1], fill: p.glow, hot: '#ffffff', cls: 'fall', t: [3, 6], op: [0.4, 0.9] });
    return s.svg();
  },

  // UMBRAL. Bluff (a Trap): down a moonlit alley a swordsman comes running;
  // in front of us a figure in a theatrical half-mask waits for him, quite
  // calm, hands behind the back round a small closed box, and violet light
  // leaks from under its lid.
  bluff(s) {
    fin(s, 'umbral');
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0a0716'], [0.25, '#1d1636'], [0.42, '#3a2c5e'], [0.6, '#56427a']]));
    s.add(particles({ seed: 15201, n: 16, x: [50, 180], y: [0, 70], r: [0.25, 0.75], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.85], t: [2.5, 6] }));
    s.glow(112, 32, 110, '#d6c8f6', 0.5);
    s.add('<circle cx="112" cy="32" r="11" fill="#efe8fc"/><circle cx="108.4" cy="29" r="2.2" fill="#d4c8ea" opacity=".6"/><circle cx="116" cy="36" r="1.6" fill="#d4c8ea" opacity=".5"/>');
    // the far end of the alley: a moonlit street, a lit window
    s.layer('M96,134V84L104,80L112,84L120,78L128,84V134Z', '#6a5a92', { blur: 0.5 });
    s.add('<path d="M106,98h4v6h-4ZM116,96h3v5h-3Z" fill="#d9c2ff" opacity=".85"/>');
    // the walls closing in: the left in shadow, the right lit high up by
    // the moon, the shadow of the left roofs across it
    s.path('M96,84L52,-10L-10,-10L-10,214L16,214L96,134Z', s.linU(96, 0, -10, 0, [[0, '#3a2e58'], [0.4, '#1e1834'], [1, '#100c1e']]));
    s.path('M128,84L172,-10L310,-10L310,214L208,214L128,134Z', s.linU(128, 0, 310, 0, [[0, '#7a68a4'], [0.5, '#5a4a82'], [1, '#3c3060']]));
    s.path('M128,112L310,178L310,214L208,214L128,134Z', '#140f26', 'opacity=".72"');
    // courses of stone running back to the far end
    let courses = '';
    for (let i = 1; i < 9; i++) {
      const yf = 134 - i * 6;
      courses += `M128,${yf}L310,${f1(118 + (yf - 118) * (310 - 112) / (128 - 112))}`;
      courses += `M96,${yf}L-10,${f1(118 + (yf - 118) * (-10 - 112) / (96 - 112))}`;
    }
    s.add(`<path d="${courses}" stroke="#0c0818" stroke-width=".8" opacity=".55"/>`);
    // a shuttered window and a hanging sign; washing strung across the top
    s.path('M236,46L266,40L266,82L236,84ZM50,64L36,62L36,96L50,96Z', '#1a1430');
    s.add('<path d="M251,43L251,83M43,63L43,96" stroke="#5a4a82" stroke-width="1"/>');
    s.path('M24,104H60V107H24ZM30,107H52V124H30Z', '#0c0818');
    s.add('<path d="M40,60Q112,92 214,46" fill="none" stroke="#0c0818" stroke-width=".8"/>');
    s.path(U(poly([[58, 68], [70, 73], [68, 90], [56, 86]]), poly([[86, 78], [98, 80], [97, 96], [86, 94]]), poly([[150, 71], [164, 66], [166, 82], [152, 87]]), poly([[180, 62], [190, 58], [192, 70], [182, 74]])), '#140e24');
    // the floor: cobbles, a puddle with the moon in it
    s.path('M96,134L128,134L208,214L16,214Z', s.lin([[0, '#4a3c6a'], [0.4, '#2a2040'], [1, '#110c1c']]));
    let cob = '';
    for (let i = 0; i < 9; i++) {
      const y = 138 + i * i * 1.0 + i * 3, half = 16 + (y - 134), cxr = 112;
      for (let x = cxr - half + (i % 2) * 4; x < cxr + half - 4; x += 5 + (y - 134) * 0.22) cob += `M${f1(x)},${f1(y)}q${f1(2 + (y - 134) * 0.06)},${f1(-1 - (y - 134) * 0.02)} ${f1(4 + (y - 134) * 0.12)},0`;
    }
    s.add(`<path d="${cob}" fill="none" stroke="#7a68a4" stroke-width=".6" opacity=".4"/>`);
    s.add(`<ellipse cx="118" cy="182" rx="22" ry="4" fill="#8a78b8" opacity=".35"/><ellipse cx="118" cy="182" rx="5" ry="1.2" fill="#efe8fc" opacity=".7"/>`);
    // the swordsman coming, small against the far end
    const foe = U(
      taper([[-2, -44], [-12, -26], [-20, -4]], [8, 7, 6]), ell(-22, -2, 5.4, 2.2),
      taper([[2, -44], [10, -28], [16, -6]], [8, 7, 6]), ell(18, -3, 5.4, 2.2),
      taper([[0, -44], [4, -60], [8, -74]], [13, 14, 16]),
      taper([[9, -76], [10, -80]], 5, { per: 2 }), ell(11.4, -85, 5.4, 6),
      taper([[10, -72], [14, -86], [12, -98]], [5, 4.4, 4]), taper([[12, -99], [-8, -114]], [2.6, 0.6], { per: 2 }),
      taper([[6, -70], [18, -66], [28, -62]], [5, 4.4, 4]),
      blob([[2, -72], [-10, -70], [-24, -64], [-32, -54], [-18, -56], [-6, -60]], 4),
    );
    s.figure(`<path d="${at(106, 152, 0.4)(foe)}"/>`, { fill: '#0e0a1a', rim: '#d6c8f6', offsets: [[0, -1], [-0.6, -0.6]], rimOp: 0.8 });
    // the masked figure: hat cocked, a long coat, hands behind the back
    const fx = 166, fy = 198, place = at(fx, fy, 1);
    const fig = U(
      taper([[-3, -46], [-6, -24], [-8, -3]], [7, 6, 4.6]), ell(-10.4, -1.8, 5.6, 2.3),
      taper([[3, -46], [5, -24], [6, -3]], [7, 6, 4.6]), ell(3.4, -1.8, 5.4, 2.3),
      blob([[-8, -90], [8, -90], [11, -66], [15, -44], [22, -30], [28, -23], [14, -26], [2, -28], [-8, -27], [-16, -29], [-13, -46], [-10, -68]], 4),
      taper([[0, -52], [0, -72], [-1, -90]], [15, 15, 16]),
      taper([[-1.5, -92], [-2.2, -98]], 4.6, { per: 2 }),
      profile(-2.6, -105, 1.12, -4, -1),
      lens(-3, -111, 28, -5, 0.2), blob([[-9, -112], [-8, -118], [-2, -121.4], [5, -119], [7, -111]], 4),
      taper([[2, -88], [10, -76], [13, -64]], [6.4, 5.6, 4.8]),
      ell(13, -60, 3.4, 3), ell(19, -59, 3, 2.8),
    );
    s.figure(`<path d="${place(fig)}"/>`, { fill: p.fig, rim: p.rim, offsets: [[-1.1, -1], [0, -1.3], [0.8, -0.6]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [-0.6, -1] });
    // the half-mask, pale in the moonlight, its ribbons trailing
    s.add('<g data-part="mask">');
    s.path(place('M-1,-109.4L-6,-109.4L-9.6,-106.6L-11,-104L-15,-101.2L-10.2,-100.4L-7,-100.8L-3.6,-101.6L-0.4,-103.2L0.6,-106.6Z'), '#ece4f8');
    s.path(place(lens(-6.6, -105.4, 3.2, -10, 0.5, 3)), '#0a0710');
    s.add(`<path d="${place('M0.6,-106Q8,-104 12,-98T20,-92M0.4,-104.4Q6,-100 8,-94')}" fill="none" stroke="#c9b8ec" stroke-width=".9" opacity=".8"/>`);
    s.add('</g>');
    // the box, and the light leaking out of it
    const bx = fx + 9.6, by = fy - 63, bw = 12, bh = 9;
    s.glow(bx + bw / 2, by + 3, 60, '#b07cff', 0.7, 'breathe');
    s.add(`<ellipse cx="${bx + 4}" cy="${fy + 1}" rx="40" ry="6" fill="${s.rad([[0, '#c49cff', 0.4], [1, '#b07cff', 0]])}"/>`);
    s.add('<g data-part="box">');
    s.path(`M${bx},${by + 2}h${bw}v${bh}h${-bw}Z`, '#1a1028');
    s.add('</g><g data-part="lid">');
    s.path(`M${bx - 0.6},${by - 0.6}h${bw + 1.2}v2.6h${-bw - 1.2}Z`, '#2a1a40');
    s.add('</g><g data-part="box">');
    s.add(`<path d="M${bx + 1},${by + 5}h${bw - 2}M${bx + 6},${by + 2}v${bh}" stroke="#4a3466" stroke-width=".6"/>`);
    s.add('</g>');
    let leak = '';
    for (let i = 0; i < 7; i++) { const x = bx + 1 + i * (bw - 2) / 6, a = -90 + (i - 3) * 16; leak += taper([[x, by + 1.6], toward(x, by + 1.6, a, 9 + (i % 3) * 5)], [1.6, 0.2], { per: 2 }); }
    s.add('<g data-part="leak">');
    s.bloom(`<path d="M${bx - 0.4},${by + 1.9}h${bw + 0.8}" stroke="#f2e6ff" stroke-width="1.1"/><path d="${leak}" fill="#d2b0ff" opacity=".8"/>`, { sd: 1.4, k: 1.5, box: [bx - 30, by - 40, bw + 60, 70] });
    s.add('</g>');
    s.motes({ seed: 15202, n: 12, x: [bx - 6, bx + bw + 6], y: [by - 34, by], r: [0.4, 0.9], fill: '#c49cff', hot: '#ffffff', cls: 'rise', t: [3, 6], op: [0.4, 0.9] });
    s.motes({ seed: 15203, n: 10, x: [20, 280], y: [40, 190], r: [0.4, 0.9], fill: '#b8a6e2', cls: 'float', t: [6, 10], op: [0.25, 0.6] });
    return s.svg();
  },

  // TIDE. Reed Lurker: a marsh at moonrise, half above the water and half
  // under it. Above, mist in the reeds and nothing but two eyes and the
  // point of a bone spear; below, the merfolk hunter they belong to,
  // coiled among the reed stems, spear in hand.
  'reed-lurker'(s) {
    fin(s, 'tide');
    const p = PAL.tide, SY = 104;
    s.rect(s.lin([[0, '#0d2731'], [0.25, '#24525a'], [0.42, '#6a9e9a'], [0.5, '#a6cac0']]));
    s.add(particles({ seed: 15301, n: 12, x: [0, W], y: [0, 50], r: [0.25, 0.7], fill: '#e4fbfb', cls: 'twinkle', op: [0.25, 0.7], t: [2.5, 6] }));
    s.glow(214, 52, 120, '#e6fbf2', 0.5);
    s.add('<circle cx="214" cy="52" r="10" fill="#f4fcf2"/>');
    // the far bank, soft in the mist
    s.layer(ridge({ seed: 15302, base: 100, amp: 10, freq: 3 }), '#3c6e70', { blur: 0.7 });
    s.haze(80, 103, '#d6ece4', 0.38);
    // the water, seen from the side: the murk under the surface
    s.path(`M-10,${SY}H310V214H-10Z`, s.lin([[0, '#3a7472'], [0.12, '#1e4e52'], [0.6, '#0c2a30'], [1, '#04121a']]));
    let beams = '';
    for (const [x, w] of [[96, 8], [128, 6], [196, 10], [232, 7], [62, 6]]) beams += poly([[x - w / 2, SY], [x + w / 2, SY], [x - 18 + w, 214], [x - 26, 214]]);
    s.path(beams, s.lin([[0, '#cfeee8', 0.32], [0.6, '#cfeee8', 0.08], [1, '#cfeee8', 0]]));
    // the reeds: stalks above, stems going down into the murk
    const R = rng(15303), stalks = [], heads = [], stems = [];
    const clump = (x0, x1, n, h0, h1) => {
      for (let i = 0; i < n; i++) {
        const x = x0 + R() * (x1 - x0), h = h0 + R() * (h1 - h0), lean = (R() - 0.5) * 18;
        if (R() < 0.35) {
          stalks.push(taper([[x, SY + 2], [x + lean * 0.5, SY - h * 0.5], [x + lean * 2.2, SY - h * 0.85]], [3.2, 2.2, 0.4], { per: 5 }));
        } else {
          stalks.push(taper([[x, SY + 2], [x + lean * 0.4, SY - h * 0.5], [x + lean, SY - h]], [2.2, 1.5, 0.6], { per: 4 }));
          if (R() < 0.55) heads.push(lens(x + lean * 0.86, SY - h * 0.84, 10 + R() * 4, -90 + lean * 1.6, 0.26, 3));
        }
        stems.push(taper([[x, SY], [x - lean * 0.15, 150 + R() * 60]], [2, 1.4], { per: 2 }));
      }
    };
    clump(-6, 92, 22, 30, 78); clump(214, 306, 20, 30, 80); clump(118, 132, 3, 18, 34); clump(206, 214, 2, 20, 40);
    s.path(U(stems), '#2c605e', 'opacity=".75"');
    s.path(ledge([[-10, 194], [40, 188], [100, 194], [160, 190], [220, 195], [310, 189]]), s.lin([[0, '#0e2626'], [1, '#040c10']]));
    // the hunter, coiled under the surface: his head up to the waterline,
    // fins at its sides, one hand on the spear, the other clawed
    const sp0 = [179, 178], sp1 = [199, 40];
    const onSpear = (y) => [sp0[0] + ((sp1[0] - sp0[0]) * (sp0[1] - y)) / (sp0[1] - sp1[1]), y];
    const [hx, hy] = onSpear(128);
    const earFin = (x, y, a0, a1, L) => {
      const pts = [[x, y + 2.4]];
      for (let i = 0; i <= 4; i++) {
        const a = a0 + ((a1 - a0) * i) / 4;
        pts.push(toward(x, y, a, L - (i % 2) * 2.4));
        if (i < 4) pts.push(toward(x, y, a + (a1 - a0) / 8, L * 0.6));
      }
      pts.push([x, y - 2.4]);
      return poly(pts);
    };
    const finTips = [];
    for (let i = 0; i <= 4; i++) { finTips.push([141, 102, 196 + i * 13, 15 - (i % 2) * 2.4], [159, 102, -16 - i * 13, 15 - (i % 2) * 2.4]); }
    const mer = U(
      ell(150, 106.4, 10, 12.4),
      earFin(141, 102, 196, 248, 15), earFin(159, 102, -16, -68, 15),
      taper([[150, 96], [150, 93.4]], [3, 0.6], { per: 2 }),
      taper([[150, 116], [150, 124]], 10, { per: 2 }),
      ell(150, 127, 22, 7),
      taper([[150, 126], [149, 142], [147, 156]], [28, 22, 15]),
      taper([[147, 154], [142, 170], [128, 182], [110, 187], [96, 181], [90, 170]], [16, 14, 11, 8, 5, 3]),
      leafAt(91, 171, -104, 15, 0.42), leafAt(91, 171, -146, 13, 0.42),
      taper([[166, 126], [178, 140], [182, 150]], [8.4, 7, 6]), taper([[182, 150], [hx, 138], [hx, hy + 2]], [6, 5, 4.4]), ell(hx, hy, 3.8, 3.4),
      taper([[134, 126], [121, 139], [118, 151]], [8.4, 7, 6]), taper([[118, 151], [126, 158], [134, 160]], [5.6, 5, 4.4]),
      [[134, 157.6, -34], [135.6, 160, -4], [134.6, 162.6, 26]].map(([x, y, a]) => taper([[x, y], toward(x, y, a, 7)], [1.8, 0.3], { per: 2 })),
      leafAt(121, 141, 166, 14, 0.4), leafAt(179, 143, 14, 14, 0.4),
      [[132, 128], [138, 124], [162, 124], [168, 128]].map(([x, y]) => taper([[x, y + 2], [x + (x - 150) * 0.25, y - 6]], [2.8, 0.4], { per: 2 })),
    );
    s.figure(`<path d="${mer}"/>`, { fill: '#061a1e', rim: '#bfeee8', offsets: [[0, -1.2], [-0.7, -0.7], [0.7, -0.7]], rimOp: 0.85, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.add(`<path d="${finTips.map(([x, y, a, l]) => `M${x},${y}L${pt(toward(x, y, a, l - 1.4))}`).join('')}" stroke="#3c7070" stroke-width=".8"/>`);
    // the bone spear, through the surface
    const spear = U(taper([sp0, sp1], [2.6, 2.2], { per: 2 }), lens(sp1[0] + 1, sp1[1] - 7, 16, -82, 0.34),
      taper([[sp1[0] - 1, sp1[1] + 3], [sp1[0] - 6, sp1[1] + 8]], [1.6, 0.3], { per: 2 }), taper([[sp1[0] + 1.6, sp1[1] + 3], [sp1[0] + 6, sp1[1] + 6]], [1.6, 0.3], { per: 2 }));
    s.figure(`<path d="${spear}"/>`, { fill: s.linU(0, 30, 0, 180, [[0, '#ece6d0'], [0.4, '#d6ccb0'], [0.42, '#7a9a92'], [1, '#3a5a58']]), rim: '#ffffff', offsets: [[0, -0.8]], rimOp: 0.5 });
    s.add('<g data-part="spearline">');
    s.add(`<path d="M${f1(sp0[0] + 0.6)},${sp0[1]}L${f1(sp1[0] + 0.6)},${sp1[1] + 6}" stroke="#7e7660" stroke-width=".5" opacity=".6"/>`);
    s.add('</g>');
    // the murk over everything under the surface, then the surface itself
    s.add(`<rect x="-5" y="${SY}" width="${W + 10}" height="${H - SY + 5}" fill="${s.lin([[0, '#2a6a6a', 0.18], [1, '#04121a', 0.45]])}"/>`);
    s.add(`<rect x="-5" y="${SY - 0.5}" width="${W + 10}" height="4" fill="${s.lin([[0, '#e6fbf6', 0.7], [1, '#e6fbf6', 0]])}"/>`);
    s.path(U(stalks, heads), '#071a1e');
    s.add(`<g fill="none" stroke="#e6fbf6" stroke-width=".8" opacity=".5"><ellipse cx="150" cy="${SY}" rx="16" ry="2.2"/><ellipse cx="150" cy="${SY}" rx="26" ry="3.4" opacity=".5"/>` +
      `<ellipse cx="${f1(onSpear(SY)[0])}" cy="${SY}" rx="6" ry="1.2"/></g>`);
    // the eyes, just above the water
    s.glow(150, 100.6, 30, p.glow, 0.6, 'breathe');
    s.add('<g data-part="eyes">');
    s.bloom(`<path d="${lens(145, 100.8, 6.6, 12, 0.46, 3) + lens(155, 100.8, 6.6, -12, 0.46, 3)}" fill="#f4f8c4"/><path d="${lens(145.4, 100.9, 2.6, 80, 0.5, 3) + lens(154.6, 100.9, 2.6, 100, 0.5, 3)}" fill="#0a1a10"/>`, { sd: 1.2, k: 1.6, box: [126, 86, 48, 28] });
    s.add('</g>');
    s.fog(96, '#d8eee8', 0.34).fog(86, '#cfe8e2', 0.22);
    s.add(particles({ seed: 15304, n: 16, x: [20, 280], y: [112, 200], r: [0.5, 1.4], stroke: '#a6e4ec', cls: 'rise', t: [6, 10], op: [0.3, 0.7] }));
    s.motes({ seed: 15305, n: 10, x: [20, 280], y: [30, 100], r: [0.4, 0.9], fill: '#e8f6c0', cls: 'float', t: [5, 9], op: [0.3, 0.7] });
    return s.svg();
  },

  // UMBRAL. Gloom Stalker: in a moonlit wall a dark doorway, and in it two
  // pale eyes; long thin fingers have come out round both sides of the
  // frame and a long foot feels for the step, green poison running from
  // the fingertips.
  'gloom-stalker'(s) {
    fin(s, 'umbral');
    s.rect(s.linU(0, 0, 300, 210, [[0, '#6a5a8e'], [0.45, '#43366a'], [1, '#1c1630']]));
    // moonlight falling across it from the upper left
    s.glow(0, -20, 230, '#cdbcf2', 0.38);
    // courses of stone, lit from the upper left
    let mortar = '';
    const Rm = rng(15401);
    for (let y = 8, row = 0; y < 196; y += 13, row++) {
      mortar += `M-10,${y}H310`;
      for (let x = -10 + (row % 2 ? 12 : 26) + Rm() * 6; x < 310; x += 24 + Rm() * 10) {
        if (x > 104 && x < 196 && y < 174) continue;
        mortar += `M${f1(x)},${y}V${y + 13}`;
      }
    }
    s.add(`<path d="${mortar}" fill="none" stroke="#120c20" stroke-width="1.1" opacity=".55"/>`);
    // the doorway: a round arch, its voussoirs, the dark inside
    const dx = 150, dyc = 84, r = 34;
    const doorD = `M${dx - r},172V${dyc}A${r},${r} 0 0 1 ${dx + r},${dyc}V172Z`;
    let vous = '';
    for (let i = 0; i <= 8; i++) { const [x1, y1] = toward(dx, dyc, 180 + 22.5 * i, r), [x2, y2] = toward(dx, dyc, 180 + 22.5 * i, r + 11); vous += `M${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}`; }
    s.path(`M${dx - r - 11},172V${dyc}A${r + 11},${r + 11} 0 0 1 ${dx + r + 11},${dyc}V172Z`, s.linU(0, 40, 0, 172, [[0, '#7a6aa0'], [1, '#3a2e58']]));
    s.add(`<path d="${vous}M${dx - r - 11},${dyc}H${dx - r}M${dx + r},${dyc}H${dx + r + 11}M${dx - r - 11},110H${dx - r}M${dx + r},110H${dx + r + 11}M${dx - r - 11},140H${dx - r}M${dx + r},140H${dx + r + 11}" stroke="#1a1230" stroke-width="1.1"/>`);
    s.path(doorD, s.radU(150, 120, 70, [[0, '#120a20'], [1, '#040208']]));
    // the steps
    s.path('M108,172H192V178H108ZM100,178H200V185H100ZM92,185H208V193H92Z', '#2c2244');
    s.add('<path d="M108,172.5H192M100,178.5H200M92,185.5H208" stroke="#8a7ab4" stroke-width="1" opacity=".75"/>');
    s.path(ledge([[-10, 193], [80, 193], [150, 194], [220, 193], [310, 193]]), s.lin([[0, '#2a2040'], [1, '#0e0a18']]));
    // the stalker: hunched in the dark, its hands round the frame
    const body = U(
      ell(146, 93, 6.4, 10.6, -14), taper([[149, 102], [153, 112]], 4.4, { per: 2 }),
      taper([[126, 118], [138, 108], [152, 110], [166, 116], [172, 124]], [6, 8, 9, 8, 6]),
      taper([[150, 112], [152, 136], [155, 160]], [14, 10, 8]),
      taper([[155, 158], [166, 140]], [7, 6], { per: 2 }),
    );
    s.figure(`<path d="${body}"/>`, { fill: '#05030a', rim: '#9a84d0', offsets: [[-0.9, -0.9]], rimOp: 0.45 });
    const finger = (pts) => taper(pts, [2.6, 2.1, 1.6, 0.7], { per: 4 });
    const handL = U(
      taper([[126, 116], [118, 100], [114, 98]], [5, 4.4, 4]), taper([[116, 99], [104, 101]], [4, 3.4], { per: 2 }), ell(100, 101.6, 4.6, 3.4, -8),
      finger([[98, 100], [86, 92], [76, 84], [70, 87]]), finger([[97, 101.5], [84, 98], [72, 98], [66, 102]]),
      finger([[97, 103], [86, 108], [77, 114], [73, 121]]), finger([[98, 104.5], [91, 114], [85, 124], [86, 131]]),
      taper([[101, 104], [100, 112], [104, 118]], [2.4, 1.8, 0.6], { per: 3 }),
    );
    const handR = U(
      taper([[172, 124], [182, 128], [186, 130]], [5, 4.4, 4]), taper([[184, 130], [197, 132]], [4, 3.4], { per: 2 }), ell(201, 132, 4.6, 3.4, 8),
      finger([[203, 130], [215, 120], [225, 112], [231, 115]]), finger([[204, 131.5], [217, 128], [229, 128], [235, 132]]),
      finger([[204, 133], [215, 140], [224, 146], [227, 153]]), finger([[203, 134.5], [210, 146], [214, 156], [212, 162]]),
      taper([[200, 129], [199, 121], [195, 115]], [2.4, 1.8, 0.6], { per: 3 }),
    );
    const foot = U(taper([[166, 140], [172, 156], [177, 170]], [5, 3.6, 3]), ell(178.4, 171.4, 4, 1.8),
      taper([[180, 171.4], [189, 170], [195, 172.6]], [1.8, 1.3, 0.5], { per: 3 }), taper([[180, 172.6], [187, 174], [190, 177.4]], [1.6, 1.2, 0.5], { per: 3 }));
    s.path(mv(handL, 4, 5), '#0c0818', 'opacity=".4" data-part="shadowL"');
    s.path(mv(handR, 4, 5), '#0c0818', 'opacity=".4" data-part="shadowR"');
    s.path(mv(foot, 4, 5), '#0c0818', 'opacity=".4" data-part="shadowF"');
    s.figure(`<path d="${handL + handR + foot}"/>`, { fill: '#07040e', rim: '#d6c8f6', offsets: [[-1, -1], [0, -1.2]], rimOp: 0.9, shade: 0.35, edge: 0.25, light: [-0.7, -1] });
    // the poison: beads at the fingertips, runs down the wall, drops, pools
    const tips = [[70, 87], [66, 102], [73, 121], [86, 131], [231, 115], [235, 132], [227, 153], [212, 162]];
    const runs = [[66, 103, 34], [73, 122, 26], [235, 133, 22], [212, 163, 8]].map(([x, y, l]) => taper([[x, y], [x + 0.4, y + l * 0.5], [x - 0.3, y + l]], [1.4, 1, 0.4], { per: 3 }));
    const tipDots = (a) => dots(a.map(([x, y]) => [x, y + 0.6, 1.3]));
    s.glow(100, 176, 26, '#8aff5a', 0.3, 'breathe');
    s.glow(214, 178, 22, '#8aff5a', 0.28, 'breathe');
    s.bloom(`<g data-part="poisonL"><path d="${tipDots(tips.slice(0, 4))}" fill="#b8ff7a"/><path d="${U(runs.slice(0, 2))}" fill="#8ae85a" opacity=".85"/></g>` +
      `<g data-part="poisonR"><path d="${tipDots(tips.slice(4))}" fill="#b8ff7a"/><path d="${U(runs.slice(2))}" fill="#8ae85a" opacity=".85"/></g>` +
      `<path d="${oval(100, 176, 9, 1.6) + oval(214, 177.6, 7, 1.4) + oval(150, 192, 5, 1)}" fill="#9cff6a" opacity=".7"/>`, { sd: 1.2, k: 1.4, box: [50, 80, 200, 120] });
    s.add([[66, 140, 0], [73, 150, 0.6], [235, 158, 1.1], [86, 140, 0.3]].map(([x, y, d]) => `<ellipse class="fall" style="--d:-${d}s" cx="${x}" cy="${y}" rx=".9" ry="1.5" fill="#b8ff7a"/>`).join(''));
    // the eyes in the blackness
    s.glow(147, 92, 20, '#d6c8f6', 0.35, 'breathe');
    s.bloom(`<g data-part="eyes"><path d="${lens(142.4, 92.6, 4.4, 12, 0.36, 3) + lens(150.8, 90.6, 4.4, -18, 0.36, 3)}" fill="#f2ecff"/></g>`, { sd: 1.1, k: 1.5, box: [128, 80, 34, 24] });
    s.motes({ seed: 15402, n: 10, x: [20, 280], y: [30, 190], r: [0.4, 0.9], fill: '#b8a6e2', cls: 'drift', t: [6, 10], op: [0.25, 0.6] });
    return s.svg();
  },

  // UMBRAL. The Puppeteer: on a dark stage under a violet spotlight two
  // marionette knights duel; above them, half in the dark, the masked
  // puppeteer looms with his arms spread, a control bar in each hand.
  'the-puppeteer'(s) {
    fin(s, 'umbral');
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0a0614'], [0.5, '#1c1030'], [1, '#0c0812']]));
    // the back curtain, lit softly by the spill of the spot
    s.glow(150, 104, 150, '#8a5ad8', 0.32);
    let folds = '';
    for (let x = 6; x < 300; x += 11) folds += `M${x},0Q${x + 3},90 ${x - 1},170`;
    s.add(`<path d="${folds}" fill="none" stroke="#08040e" stroke-width="2.2" opacity=".45"/>`);
    // the stage floor, boards running back
    s.path('M-10,166H310V214H-10Z', s.lin([[0, '#3a2648'], [0.3, '#24182e'], [1, '#0c0810']]));
    let boards = '';
    for (let i = -8; i <= 8; i++) boards += `M${f1(150 + i * 14)},166L${f1(150 + i * 40)},214`;
    s.add(`<path d="${boards}M-10,180H310M-10,197H310" stroke="#0c0812" stroke-width=".8" opacity=".6"/>`);
    // the puppeteer: top hat, a pale mask, long coat, arms spread wide
    const pup = U(
      blob([[-14, -128], [14, -128], [20, -90], [26, -50], [32, -10], [36, 0], [-36, 0], [-32, -10], [-26, -50], [-20, -90]], 4),
      taper([[0, -128], [0, -138]], 8, { per: 2 }), ell(0, -146, 8, 9.4),
      ell(0, -154.6, 12.6, 2.6), poly([[-7.8, -155], [-8.6, -181], [8.6, -181], [7.8, -155]]), ell(0, -181, 8.6, 1.6),
      ell(-12, -128, 9, 5), ell(12, -128, 9, 5),
      taper([[-14, -128], [-36, -120], [-54, -116]], [9, 7.4, 6]), taper([[-54, -116], [-62, -130], [-66, -144]], [6, 5.4, 4.8]),
      taper([[14, -128], [36, -120], [54, -116]], [9, 7.4, 6]), taper([[54, -116], [62, -130], [66, -144]], [6, 5.4, 4.8]),
      ell(-66.4, -147, 3.6, 3.4), ell(66.4, -147, 3.6, 3.4),
      [-1, 1].map((d) => [[-2, -6], [0, -7.6], [2, -6]].map(([fx, fy]) => taper([[d * 66.4 + fx, -148], [d * 66.4 + fx * 1.4, -148 + fy]], [1.2, 0.4], { per: 2 }))),
    );
    const PX = 150, PY = 184;
    s.figure(`<path d="${at(PX, PY, 1)(pup)}"/>`, { fill: '#0a0610', rim: '#c9a6ff', offsets: [[0, 1], [-0.9, 0.6], [0.9, 0.6], [0, -1]], rimOp: 0.7, shade: 0.4, edge: 0.25, light: [0, 1] });
    s.path(at(PX, PY, 1)(blob([[0, -155], [6.4, -152], [7.4, -146], [5, -139], [0, -136.4], [-5, -139], [-7.4, -146], [-6.4, -152]], 4)), '#e6dcf6');
    s.path(at(PX, PY, 1)(lens(-3, -147, 3.4, 4, 0.42, 3) + lens(3, -147, 3.4, -4, 0.42, 3) + 'M-1.6,-140.6L1.6,-140.6L1.6,-140L-1.6,-140Z'), '#140c20');
    // the control bars
    const bar = (x, y) => U(taper([[x - 15, y + 2], [x + 15, y - 2]], 2.4, { per: 2 }), taper([[x, y - 10], [x, y + 10]], 2.2, { per: 2 }));
    const cl = [PX - 66.4, PY - 150], cr = [PX + 66.4, PY - 150];
    s.path(bar(...cl), '#3a2a20', 'stroke="#c8a6ff" stroke-width=".5" data-part="barL"');
    s.path(bar(...cr), '#3a2a20', 'stroke="#c8a6ff" stroke-width=".5" data-part="barR"');
    // the spotlight, and the pool it makes
    s.path('M136,-12L164,-12L226,186L74,186Z', s.lin([[0, '#c9a6ff', 0.04], [0.6, '#b07cff', 0.14], [1, '#d6c0ff', 0.22]]));
    s.add(`<ellipse cx="150" cy="184" rx="78" ry="13" fill="${s.rad([[0, '#efe2ff', 0.55], [0.6, '#b07cff', 0.28], [1, '#b07cff', 0]])}"/>`);
    // the two marionette knights (each facing the other, feet on y = 0):
    // jointed limbs, a helm with a crest, a round shield, a sword
    const knight = (sw) => U(
      taper([[-2, -18], [-5, -10], [-6, -2]], [4, 3.6, 3.2]), ell(-4.6, -10, 2.2), ell(-6, -0.4, 2.8, 1.6, 30),
      taper([[2, -18], [5, -10], [7, -2]], [4, 3.6, 3.2]), ell(5, -10, 2.2), ell(8, -0.4, 2.8, 1.6, -20),
      taper([[0, -17], [0, -25], [0, -31]], [9, 10, 11]),
      ell(-4.6, -30.6, 3, 2.4), ell(4.6, -30.6, 3, 2.4),
      taper([[0, -33], [0, -35]], 3, { per: 2 }), ell(0.6, -38.6, 4.2, 4.6),
      taper([[-4, -42], [0, -45.4], [5, -43.6]], [2, 2.6, 0.6]),
      sw === 'lunge' ? U(taper([[4, -29], [11, -31], [17, -34]], [3.4, 3, 2.6]), ell(18, -34.4, 2, 1.8))
        : U(taper([[4, -29], [9, -35], [12, -42]], [3.4, 3, 2.6]), ell(12.4, -43.4, 2, 1.8)),
      taper([[-4, -29], [-8, -24], [-10, -22]], [3.4, 3, 2.6]), ell(-11, -24, 5.2, 6.4),
    );
    const kl = at(120, 184, 1.12), kr = at(182, 184, 1.12, -1);
    const kn = kl(knight('lunge')) + kr(knight('parry'));
    s.path(oval(120, 186, 14, 2.4) + oval(182, 186, 14, 2.4), '#0a0610', 'opacity=".55"');
    s.figure(`<path d="${kn}"/>`, { fill: '#3a2c50', rim: '#f2e8ff', offsets: [[0, -1.2], [-0.7, -0.7], [0.7, -0.7]], rimOp: 0.95, shade: 0.5, edge: 0.3, light: [0, -1] });
    const swL = [[120 + 19 * 1.12, 184 - 34.4 * 1.12], [158, 128]], swR = [[182 - 13 * 1.12, 184 - 43.4 * 1.12], [140, 126]];
    s.path(U(taper(swL, [1.8, 0.5], { per: 2 })), '#e6dcf6', 'data-part="swordL"');
    s.path(U(taper(swR, [1.8, 0.5], { per: 2 })), '#e6dcf6', 'data-part="swordR"');
    // the strings, from the bars to heads, hands and knees
    const lk = [[0.6, -43], [18, -34.4], [-11, -30], [-4.6, -10], [5, -10]].map(([x, y]) => [120 + x * 1.12, 184 + y * 1.12]);
    const rk = [[0.6, -43], [12.4, -43.4], [-11, -30], [-4.6, -10], [5, -10]].map(([x, y]) => [182 - x * 1.12, 184 + y * 1.12]);
    const ends = ([x, y]) => [[x - 15, y + 2], [x + 15, y - 2], [x, y - 10], [x, y + 10], [x + 7, y]];
    const str = (from, to) => from.map((a, i) => `M${pt(a)}L${pt(to[i])}`).join('');
    s.bloom(`<path data-part="stringsL" d="${str(ends(cl), lk)}" stroke="#e6d6ff" stroke-width=".45" opacity=".85"/><path data-part="stringsR" d="${str(ends(cr), rk)}" stroke="#e6d6ff" stroke-width=".45" opacity=".85"/>` +
      `<path data-part="glint" d="${glint(149, 127, 7) + rot(glint(149, 127, 4), 149, 127, 45)}" fill="#ffffff"/>`, { sd: 1, k: 1.4, box: [60, 20, 180, 170] });
    // the side curtains and the valance
    const drape = (x0, d) => U(poly([[x0, -10], [x0 + d * 46, -10], [x0 + d * 40, 60], [x0 + d * 30, 130], [x0 + d * 36, 214], [x0, 214]]));
    s.figure(`<path d="${drape(-10, 1) + drape(310, -1)}"/>`, { fill: '#2a0c22', rim: '#b07cff', offsets: [[0, 0]], rimOp: 0 });
    s.add('<path d="M10,0Q14,100 8,214M22,0Q28,100 20,214M290,0Q286,100 292,214M278,0Q272,100 280,214" fill="none" stroke="#12040e" stroke-width="2" opacity=".7"/>');
    let val = 'M-10,-10H310V14';
    for (let x = 310; x > -10; x -= 25) val += `Q${x - 12.5},28 ${x - 25},14`;
    s.path(val + 'Z', '#2a0c22');
    s.add(`<path d="${val.replace('M-10,-10H310V14', 'M310,14')}" fill="none" stroke="#b07cff" stroke-width=".8" opacity=".5"/>`);
    s.motes({ seed: 15501, n: 16, x: [80, 220], y: [20, 180], r: [0.4, 0.9], fill: '#d2b0ff', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // TIDE. Grand Illusion: a towering curtain of seawater sweeps across a
  // battlefield; ahead of it the fight goes on, and behind it the warriors
  // and beasts it has passed come apart into bubbles and glittering spray.
  'grand-illusion'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#1e4c5a'], [0.35, '#4e8c94'], [0.62, '#9cc8c0'], [0.76, '#b6d8cc']]));
    s.glow(250, 20, 150, '#f2fffb', 0.5);
    // the far field, banners standing on it
    s.layer(ridge({ seed: 15601, base: 156, amp: 14, freq: 2.4 }) + 'M250,148L251,124L252.4,124L251.6,148ZM252,125L264,128L258,132L263,136L252,134Z', '#5e8e8e', { blur: 0.7 });
    s.haze(132, 162, '#d6eee8', 0.32);
    s.path(ledge([[-10, 168], [70, 165], [150, 169], [230, 165], [310, 168]]), s.lin([[0, '#2a4442'], [0.3, '#16282a'], [1, '#060e10']]));
    const Rg = rng(15604);
    s.path(U(Array.from({ length: 30 }, () => { const x = 170 + Rg() * 140, y = 168 + Rg() * 44, h = 3 + Rg() * 5; return taper([[x, y + 1], [x + (Rg() - 0.5) * 4, y - h]], [1.4, 0.3], { per: 2 }); })), '#0a1416');
    // the ones still fighting, charging into it (facing left, feet on y = 0)
    const runner = U(
      taper([[2, -30], [10, -17], [18, -6]], [6.4, 5.2, 4]), ell(19.5, -4.4, 4.4, 2.2, -30),
      taper([[-2, -30], [-10, -19], [-11, -3]], [6.4, 5.2, 4.2]), ell(-13.4, -1.8, 4.6, 2),
      taper([[0, -30], [-4, -44], [-7, -56]], [11, 11, 12]),
      taper([[-8, -58], [-10, -62]], 4.4, { per: 2 }), ell(-11.6, -66, 4.6, 5), taper([[-15, -69], [-10, -73], [-5, -72]], [2, 2.6, 0.6]),
      taper([[-3, -54], [1, -66], [-1, -76]], [4.4, 3.8, 3.2]), taper([[-1, -77], [-14, -96]], [2.6, 0.6], { per: 2 }),
      taper([[-8, -52], [-16, -49], [-21, -47]], [4.4, 3.8, 3.4]), ell(-23.4, -47, 3.6, 6.4),
    );
    const beast = U(
      blob([[-30, -30], [-20, -40], [0, -42], [18, -38], [30, -30], [32, -18], [20, -14], [-10, -14], [-26, -16]], 4),
      taper([[-26, -30], [-38, -26], [-46, -20]], [18, 14, 10]), ell(-48, -18, 6, 5),
      taper([[-44, -24], [-52, -32], [-54, -42]], [3.4, 2.4, 0.6]), taper([[-40, -26], [-44, -36], [-42, -44]], [3, 2, 0.5]),
      taper([[-20, -16], [-24, -6], [-26, 0]], [7, 5.6, 4.6]), taper([[-10, -16], [-8, -6], [-6, 0]], [6.4, 5, 4.4]),
      taper([[16, -16], [12, -6], [10, 0]], [7, 5.6, 4.6]), taper([[24, -18], [28, -8], [30, 0]], [6.4, 5, 4.4]),
      taper([[30, -28], [38, -30], [42, -36]], [3, 2, 0.6]),
    );
    s.figure(`<path d="${at(198, 173, 0.92)(runner) + at(262, 176, 1)(beast) + at(288, 168, 0.6)(runner)}"/>`,
      { fill: '#0a1e24', rim: '#d8f6f1', offsets: [[-1.2, -0.6], [-0.6, -1.1]], rimOp: 0.9, shade: 0.4, edge: 0.28, light: [-1, -0.5] });
    const R0 = rng(15605);
    // the curtain: its front a towering wall leaning forward, the crest
    // pitching over and breaking into spray
    const front = [[178, 178], [176, 150], [176, 120], [179, 92], [185, 64], [193, 44], [203, 31], [214, 26], [223, 30], [225, 39], [221, 46]];
    const back = [[214, 38], [204, 32], [186, 26], [160, 24], [126, 27], [90, 23], [50, 25], [14, 21], [-12, 23]];
    const wall = poly([...spline(front, 6), ...spline(back, 6), [-12, 214], [176, 214]]);
    s.add('<g data-part="curtain">');
    s.path(wall, s.linU(0, 20, 224, 0, [[0, '#0e3844', 0.97], [0.72, '#1a5864', 0.95], [0.9, '#4a9ca2', 0.93], [1, '#c6f2ea', 0.95]]));
    s.path(wall, s.lin([[0, '#e6fbf6', 0.3], [0.18, '#e6fbf6', 0.05], [1, '#03141a', 0.5]]));
    let flow = '';
    for (let i = 0; i < 9; i++) { const y = 44 + i * 14 + R0() * 6, x = -10 + R0() * 60; flow += `M${f1(x)},${f1(y)}C${f1(x + 60)},${f1(y - 2)} ${f1(150 + i * 2)},${f1(y - 4 - i)} ${f1(172 + i)},${f1(y - 14 - i * 2)}`; }
    s.add(`<path d="${flow}" fill="none" stroke="#bfeee8" stroke-width=".8" stroke-dasharray="18 6 4 6" opacity=".2"/>`);
    const crestPts = spline(back.slice().reverse(), 6);
    const lipPts = crestPts.filter((_, i) => i % 2 === 0);
    s.path(taper(lipPts, lipPts.map((_, i) => 1.2 + 2.2 * Math.abs(Math.sin(i * 1.7)) + (i / lipPts.length) * 1.6)), '#eefdfa', 'opacity=".7"');
    // inside it, the ones it took: shapes of bubbles, coming apart
    const R = rng(15602), bub = [];
    const ghost = (d, keep, drift) => {
      for (const [x, y] of ptsOf(d)) if (R() < keep) bub.push([x + (R() - 0.5) * drift, y - R() * drift * 1.4, 0.6 + R() * 1.6]);
    };
    const g1 = at(96, 170, 1)(beast), g2 = at(150, 172, 0.95)(runner), g3 = at(40, 168, 0.8)(runner);
    s.path(g1 + g2 + g3, '#bfeee8', 'opacity=".26"');
    ghost(g1, 0.55, 8); ghost(g2, 0.6, 6); ghost(g3, 0.45, 12);
    for (let i = 0; i < 60; i++) { const x = 10 + R() * 170, y = 40 + R() * 130; bub.push([x, y, 0.5 + R() * 1.4]); }
    s.add(`<path d="${dots(bub)}" fill="none" stroke="#e6fbf6" stroke-width=".55" opacity=".8"/>`);
    // the bright face of it and the spray off the crest
    const face = spline(front, 6);
    s.path(taper(face.filter((_, i) => i % 2 === 0), [2.6, 3.4, 3.6, 3.2, 4, 4.4, 4, 3, 2]), '#f4fffd', 'opacity=".75"');
    const spray = [];
    for (let i = 0; i < 40; i++) { const a = rad(-80 + R() * 110), d = 6 + R() * 40; spray.push([220 + Math.cos(a) * d, 34 + Math.sin(a) * d * 0.9, 0.5 + R() * 1.4]); }
    for (let i = 0; i < 24; i++) { const y = 40 + R() * 130, x = 178 + R() * 14 + (170 - y) * 0.06; spray.push([x, y, 0.4 + R() * 1.1]); }
    s.add(`<path d="${U(puffs([[184, 176, 6], [194, 178, 5], [204, 177, 4], [214, 179, 3], [178, 170, 5]], 1.6))}" fill="#e6fbf6" opacity=".8"/>`);
    s.add('</g>');
    s.glow(204, 40, 54, '#effdf9', 0.6, 'breathe');
    s.add('<g data-part="spray">');
    s.bloom(`<path d="${dots(spray)}" fill="#f4fffd"/><path d="${glint(222, 30, 7) + glint(188, 70, 4) + glint(181, 120, 5)}" fill="#ffffff"/>`, { sd: 1.3, k: 1.5, box: [150, 0, 130, 190] });
    s.add('</g>');
    s.motes({ seed: 15603, n: 18, x: [10, 180], y: [30, 170], r: [0.4, 1.1], fill: p.glow, hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    return s.svg();
  },

  // ── STORM RISING ──────────────────────────────────────────────────

  // TIDE. Spellwright Apprentice: in a study cut into a sea cave, a young
  // apprentice holds her arm out over an open spellbook; glowing runes curl
  // up out of its pages, round her wrist, and settle on her sleeve.
  'spellwright-apprentice'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0c2430'], [0.5, '#12343e'], [1, '#081c24']]));
    // the cave mouth, the sea outside it, light coming in
    const ox = 232, oy = 66;
    const mouth = blob([[194, 74], [198, 58], [203, 46], [211, 40], [216, 30], [226, 29], [234, 22], [245, 28], [255, 29], [262, 42], [270, 51], [267, 66], [273, 80], [264, 93], [252, 99], [240, 108], [222, 103], [209, 101], [200, 88]], 2);
    const cm = s.uid('c');
    s.defs.push(`<clipPath id="${cm}"><path d="${mouth}"/></clipPath>`);
    s.glow(ox, oy - 10, 120, '#e6fbf6', 0.5);
    s.add(`<g clip-path="url(#${cm})"><rect x="190" y="20" width="84" height="90" fill="${s.lin([[0, '#5aa2a6'], [0.6, '#c2ece4'], [0.62, '#5e9ea0'], [1, '#2a6470']])}"/>` +
      `<path d="M244,78L248,66L252,62L256,66L258,78ZM200,78L206,72L214,74L218,78Z" fill="#3c7a80"/>` +
      `${glitter([[232, 81, 24, 0.6], [236, 86, 34, 0.45], [230, 92, 20, 0.35], [234, 98, 40, 0.3]], '#f2fffc')}</g>`);
    s.shafts({ cx: ox, cy: oy - 16, n: 7, from: 132, to: 162, len: 220, spread: 2.6, color: '#e9fcf6', op: 0.26, seed: 15701, sd: 2.2 });
    // shelves of books cut into the rock
    const R = rng(15702);
    let books = '';
    for (const y of [86, 112]) for (let x = 12; x < 74;) { const w = 2.6 + R() * 2.6, h = 11 + R() * 7; books += poly([[x, y], [x, y - h], [x + w, y - h], [x + w, y]]); x += w + 0.6 + (R() < 0.12 ? 4 : 0); }
    s.path(books, '#2c5c66');
    s.add('<path d="M8,86.5H78M8,112.5H78" stroke="#0a1e24" stroke-width="2.4"/>');
    s.path(U(ell(36, 132, 5, 6), ell(50, 133, 4, 5), poly([[60, 138], [62, 126], [68, 126], [70, 138]])), '#1d4650');
    // the cave walls round it all
    const rock = U(
      poly([[-10, -10], [310, -10], [310, 24], [292, 18], [282, 30], [268, 22], [250, 18], [236, 14], [214, 20], [196, 14], [176, 22], [160, 14], [138, 20], [118, 12], [96, 18], [74, 12], [52, 20], [30, 14], [12, 22], [-10, 18]]),
      [[180, 21, 12], [146, 18, 16], [104, 16, 10], [64, 17, 14], [24, 19, 9], [284, 26, 10]].map(([x, y, h]) => taper([[x, y - 2], [x + 0.6, y + h * 0.6], [x, y + h]], [5, 2.6, 0.3], { per: 3 })),
      poly([[310, 24], [296, 44], [290, 84], [298, 122], [290, 160], [300, 214], [310, 214]]),
      poly([[-10, 18], [6, 46], [-2, 120], [8, 170], [-4, 214], [-10, 214]]),
    );
    s.figure(`<path d="${rock}"/>`, { fill: '#061418', rim: '#7fb5bd', offsets: [[0, 1], [-0.8, 0.6]], rimOp: 0.5 });
    // the floor, the desk and its book
    s.path(ledge([[-10, 190], [80, 188], [160, 192], [240, 188], [310, 190]]), s.lin([[0, '#2c4c50'], [1, '#0a1a1e']]));
    s.path('M134,148L212,140L214,146L136,154ZM142,152L146,192L150,192L147,152ZM202,146L206,190L210,190L206,145Z', '#1a2c2e');
    s.add('<path d="M134,148L212,140" stroke="#8ec6c0" stroke-width="1" opacity=".6"/>');
    // the apprentice (facing right, feet on y = 0): robe to the floor, hair
    // in a bun, the near arm held out over the book, its sleeve rolled
    const hd = (d) => d.replace(NUM, (_, x, y) => `${f1(1.4 + (x - 1.4) * 1.16)},${f1(-79 + (+y + 79) * 1.16)}`);
    const girl = U(
      blob([[-7, -56], [7, -56], [9, -36], [12, -14], [14, 0], [-13, 0], [-11, -14], [-9, -36]], 4),
      taper([[0, -54], [0, -64], [0, -72]], [12, 12, 13]),
      blob([[-8, -75], [8, -75], [11, -68], [9, -62], [0, -63.4], [-9, -62], [-11, -68]], 4),
      taper([[1, -74], [1.6, -79]], 4.2, { per: 2 }),
      hd(U(profile(3.2, -86.4, 0.92, 12), ell(-1.2, -89, 6, 5.8), taper([[-5, -88], [-11, -84], [-13, -76]], [3.2, 2.6, 0.8]),
        lens(1.6, -93.6, 25, -10, 0.17), taper([[1.4, -95], [-1.4, -104], [-6.6, -112], [-14, -115], [-17, -112]], [12, 8.6, 5, 2, 0.6]))),
      blob([[3, -73], [12, -71], [18, -65], [19.6, -58], [13, -57.6], [7, -63]], 4),
      taper([[16, -61], [26, -60.4], [34, -59.6]], [4.2, 3.6, 3]), ell(36, -59.4, 3, 2.1, 8),
      [[36, -58.4, 70], [37.6, -58.6, 56], [39, -59.2, 40]].map(([x, y, a]) => taper([[x, y], toward(x, y, a, 3.4)], [1.2, 0.5], { per: 2 })),
      taper([[-4, -70], [2, -61], [10, -57]], [5, 4.4, 3.8]),
    );
    const gx = 104, gy = 192, gk = 1.16, place = at(gx, gy, gk);
    s.figure(`<path d="${place(girl)}"/>`, { fill: p.fig, rim: '#e6fdfc', offsets: [[1.2, -0.8], [0.4, -1.2], [-0.6, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [1, -0.6] });
    // the open book, lit from within
    const bk = [[150, 146], [168, 142], [186, 140]];
    s.glow(170, 136, 70, '#c6f4f6', 0.65);
    s.bloom(`<path d="M150,147L167,140L168,144.6L151,151Z" fill="#effdfb"/><path d="M168,144.6L167,140L186,135L188,140Z" fill="#def8f5"/>` +
      '<path d="M153,147.6L165,142.6M154,149.4L165,144.6M170,142L184,137.6M170,143.8L184,139.6" stroke="#7fa7b0" stroke-width=".5"/>', { sd: 1.4, k: 1.3, box: [130, 120, 80, 40] });
    // the runes: up out of the pages in a curl, round her wrist and forearm,
    // and the ones already settled glowing on her sleeve
    const [hx, hy] = [gx + 36 * gk, gy - 59.4 * gk], [ex, ey] = [gx + 17 * gk, gy - 64 * gk];
    const path = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      if (t < 0.35) { const u = t / 0.35; path.push([168 - 6 * u + Math.sin(u * 5) * 6, 140 - u * 30]); }
      else { const u = (t - 0.35) / 0.65, x = hx + (ex - hx) * u, y = hy + (ey - hy) * u, a = u * Math.PI * 3.2; path.push([x + Math.cos(a) * 3, y - 2 + Math.sin(a) * 9]); }
    }
    let runes = '';
    path.forEach(([x, y], i) => { if (i % 3 === 0) runes += rune(i, x, y, 0.95); });
    const settled = [[-6, 2], [0, -2], [-11, -4], [-4, -8], [4, -6]].map(([dxs, dys], i) => rune(i + 2, ex + dxs, ey + dys, 0.62)).join('');
    s.add(`<path d="${poly(path, false)}" fill="none" stroke="#c6f4f6" stroke-width="5" opacity=".22" stroke-linecap="round"/><path d="${poly(path, false)}" fill="none" stroke="#effdfb" stroke-width="1" opacity=".35" stroke-linecap="round"/>`);
    s.bloom(`<path d="${runes}" fill="none" stroke="#effdfb" stroke-width=".7" stroke-linecap="round"/><path d="${settled}" fill="none" stroke="#c6f4f6" stroke-width=".7" stroke-linecap="round"/>`, { sd: 1.2, k: 1.5, box: [100, 70, 110, 90] });
    s.motes({ seed: 15703, n: 14, x: [120, 200], y: [90, 150], r: [0.4, 0.9], fill: p.glow, hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] });
    s.add(particles({ seed: 15704, n: 14, x: [20, 280], y: [40, 190], r: [0.5, 1.3], stroke: '#a6e4ec', cls: 'float', t: [7, 12], op: [0.2, 0.5] }));
    return s.svg();
  },

  // EMBER. Static Spark: in a dark room a hand points at a candle, and a
  // tiny spark crackles from the fingertip to the wick; the air shivers
  // round it.
  'static-spark'(s) {
    fin(s, 'ember');
    const p = PAL.ember;
    s.rect(s.lin([[0, '#140504'], [0.5, '#260a06'], [1, '#100302']]));
    const sx = 177, sy = 99;
    s.glow(sx, sy, 150, '#ff7a2e', 0.4);
    // a shelf in the dark, jars and books on it
    s.path('M196,40H300V44H196ZM206,40V22H214V40ZM216,40V26H222V40ZM226,40V18H232V40ZM246,40V28A6,6 0 0 1 258,28V40ZM270,40V30H282V40Z', '#1a0604');
    // the table and the candle in its holder
    s.path(ledge([[-10, 174], [100, 173], [200, 172], [310, 173]]), s.lin([[0, '#2a0e08'], [1, '#0c0302']]));
    s.add('<path d="M-10,173.4H310" stroke="#ff9a4a" stroke-width=".7" opacity=".35"/>');
    const candle = U(poly([[196, 170], [196, 112], [199, 109], [204, 110.5], [209, 108.6], [212, 112], [212, 170]]), ell(204, 172, 20, 4.4), ell(204, 168, 12, 3));
    s.figure(`<path d="${candle}"/>`, { fill: s.linU(190, 0, 216, 0, [[0, '#6a4434'], [0.4, '#3a2016'], [1, '#1a0a06']]), rim: '#ffb070', offsets: [[-1.2, -0.4], [-0.8, -1]], rimOp: 0.9 });
    s.path('M204,110L204.6,104Q205.4,101 204.6,99', 'none', 'stroke="#140604" stroke-width="1.2" stroke-linecap="round"');
    // the hand, pointing: sleeve and cuff, the back of the hand, the index
    // finger out, the thumb along it, the other fingers curled
    const hand = U(
      taper([[-14, 152], [20, 140], [52, 128]], [44, 40, 34]),
      taper([[52, 128], [66, 120]], [26, 22], { per: 2 }),
      blob([[62, 110], [78, 104], [96, 100], [108, 100], [114, 104], [114, 114], [106, 124], [88, 130], [70, 132], [60, 126]], 4),
      taper([[106, 103.4], [118, 102.4], [130, 101.4], [140, 101.6], [146, 102.2]], [9, 8.4, 7.6, 6.8, 5.6]), ell(146.4, 102.4, 2.9, 2.7),
      blob([[104, 106], [116, 107], [123, 112], [125, 119], [121, 126], [112, 130], [100, 132], [92, 130]], 4),
      taper([[80, 106], [90, 98.6], [100, 95.4], [108, 94.6]], [11, 9, 7.6, 6.6]), ell(108.8, 95, 3.3, 3),
    );
    s.figure(`<path d="${hand}"/>`, { fill: p.fig, rim: '#ffc890', offsets: [[1.2, -0.4], [0.8, -1], [0.6, 0.8]], rimOp: 0.95, shade: 0.45, edge: 0.32, light: [1, -0.3] });
    s.path(taper([[46, 132], [52, 128], [58, 124]], [36, 36, 34]), '#2a0c08');
    s.add('<path d="M48,112L60,148M53,110L64,145" stroke="#3a140c" stroke-width="1" opacity=".8"/><path d="M112,111Q118,113 121,118M106,121Q112,123 114,128" fill="none" stroke="#3a1a10" stroke-width=".9" opacity=".9"/>');
    // the air shivering round the spark
    let shim = '';
    for (const [rx, ry, o] of [[16, 10, 0.4], [26, 16, 0.28], [38, 23, 0.18]]) shim += `<ellipse cx="${sx}" cy="${sy}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffd27a" stroke-width=".6" stroke-dasharray="3 2.4 1 2.4" opacity="${o}"/>`;
    s.add(shim);
    // the spark: a crackling thread from fingertip to wick, forks off it
    const main = bolt([149.4, 102], [204.6, 99.4], 15801, 9, 4.4);
    const forks = [bolt(main[3], [main[3][0] + 6, main[3][1] - 10], 15802, 3, 2), bolt(main[6], [main[6][0] + 4, main[6][1] + 9], 15803, 3, 2), bolt(main[5], [main[5][0] - 2, main[5][1] - 9], 15804, 3, 1.6)];
    const all = [main, ...forks].map(polyline).join('');
    const R = rng(15805), sparks = [];
    for (let i = 0; i < 16; i++) { const a = rad(R() * 360), d = 4 + R() * 18; sparks.push([sx + Math.cos(a) * d * 1.6, sy + Math.sin(a) * d, 0.4 + R() * 0.7]); }
    s.glow(sx, sy, 34, '#ffd27a', 0.7, 'breathe');
    s.glow(149, 102, 12, '#fff0c8', 0.8);
    s.glow(205, 99, 10, '#ffd27a', 0.8);
    s.bloom(`<path d="${all}" stroke="#ff9a3c" stroke-width="3.6" fill="none" opacity=".45" stroke-linejoin="round"/><path d="${all}" stroke="#fffaea" stroke-width="1.1" fill="none" stroke-linejoin="round"/>` +
      `<path d="${dots(sparks)}" fill="#ffe2a0"/><path d="${glint(149.6, 102, 5) + glint(205, 99, 4)}" fill="#ffffff"/>`, { sd: 1.6, k: 1.5, box: [120, 60, 110, 80] });
    s.motes({ seed: 15806, n: 12, x: [140, 220], y: [70, 130], r: [0.3, 0.8], fill: '#ffb04a', hot: '#fff6d8', cls: 'twinkle', t: [1.5, 3], op: [0.4, 1] });
    return s.svg();
  },

  // TIDE (Relic). The Arcane Well: a round stone well in a moonlit
  // cloister courtyard, brimming with glowing blue water; runes circle its
  // rim and small lights rise out of it.
  'the-arcane-well'(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0a2030'], [0.4, '#1d4656'], [0.68, '#3e7880']]));
    s.add(particles({ seed: 15901, n: 22, x: [0, W], y: [0, 80], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.25, 0.85], t: [2.5, 6] }));
    s.glow(236, 30, 110, '#e6fbf6', 0.45);
    s.add('<circle cx="236" cy="30" r="11" fill="#f2fbf8"/>');
    // the cloister round the courtyard: an arcade, a roof over it
    let arc = 'M-10,142L-10,88L310,88L310,142Z';
    for (let x = -4; x < 310; x += 30) arc += `M${x},142L${x},114A11,11 0 0 1 ${x + 22},114L${x + 22},142Z`;
    s.layer(arc, '#14303a', { blur: 0.5, extra: 'fill-rule="evenodd"' });
    s.path('M-10,90L-10,80L310,80L310,90Z', '#0c222a');
    s.add('<path d="M-10,80.5H310" stroke="#9fd6d0" stroke-width=".7" opacity=".5"/>');
    s.haze(118, 146, '#9fd6d0', 0.24);
    // the courtyard floor, flagstones round the well
    s.path('M-10,142H310V214H-10Z', s.lin([[0, '#3a6a70'], [0.4, '#244a50'], [1, '#0c2026']]));
    let flags = '';
    for (const [rx, ry] of [[70, 12], [100, 20], [136, 30], [180, 42]]) flags += oval(150, 160, rx, ry);
    for (let i = 0; i < 16; i++) { const a = rad(i * 22.5 + 8), [x1, y1] = [150 + Math.cos(a) * 70, 160 + Math.sin(a) * 12], [x2, y2] = [150 + Math.cos(a) * 200, 160 + Math.sin(a) * 46]; flags += `M${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}`; }
    s.add(`<path d="${flags}" fill="none" stroke="#0e2a30" stroke-width=".9" opacity=".45"/>`);
    // the glow it throws on the stones
    s.add(`<ellipse cx="150" cy="166" rx="110" ry="22" fill="${s.rad([[0, '#c6f4f6', 0.4], [0.5, '#a6e4ec', 0.16], [1, '#a6e4ec', 0]])}"/>`);
    // the winch frame over it: two posts, a beam, the rope and bucket
    s.figure(`<path d="${U(poly([[103, 124], [103, 56], [108, 56], [108, 124]]), poly([[192, 124], [192, 56], [197, 56], [197, 124]]), poly([[96, 52], [204, 52], [204, 59], [96, 59]]),
      poly([[92, 52], [150, 34], [208, 52]]), poly([[149.4, 59], [150.6, 59], [150.6, 84], [149.4, 84]]), poly([[142, 84], [158, 84], [156, 96], [144, 96]]))}"/>`,
      { fill: '#0c1e24', rim: '#c6f4f6', offsets: [[0, -1], [0.6, -0.8]], rimOp: 0.7 });
    // the well: a drum of stone, its rim, the water brimming at the top
    const cx = 150, top = 122, rx = 50, ry = 12, bot = 172;
    const drum = `M${cx - rx},${top}A${rx},${ry} 0 0 0 ${cx + rx},${top}V${bot}A${rx},${ry} 0 0 1 ${cx - rx},${bot}Z`;
    s.path(drum, s.linU(cx - rx, 0, cx + rx, 0, [[0, '#1c3c44'], [0.35, '#3c6c74'], [0.6, '#2c5660'], [1, '#10262c']]));
    let blocks = '';
    for (let k = 1; k < 4; k++) { const y = top + 4 + k * 11.6; blocks += `M${cx - rx},${f1(y)}A${rx},${ry} 0 0 0 ${cx + rx},${f1(y)}`; }
    for (let k = 0; k < 4; k++) for (let i = 0; i < 7; i++) {
      const a = rad(180 - (i + 0.5 + (k % 2) * 0.5) * (180 / 7)), x = cx + Math.cos(a) * rx, y = top + 4 + k * 11.6 + Math.sin(a) * ry;
      if (Math.abs(Math.cos(a)) < 0.95) blocks += `M${f1(x)},${f1(y)}v11.6`;
    }
    s.add(`<path d="${blocks}" fill="none" stroke="#0a1a1e" stroke-width=".9" opacity=".8"/>`);
    s.path(oval(cx, top, rx + 3, ry + 2.4), '#4a7e86');
    s.path(oval(cx, top + 2.6, rx + 3, ry + 2.4), '#2a525a', 'opacity=".6"');
    s.path(oval(cx, top, rx - 3, ry - 2.4), s.radU(cx, top, rx, [[0, '#ffffff'], [0.3, '#e6fffb'], [0.7, '#9ee6ea'], [1, '#4ab8c4']]));
    s.glow(cx, top - 6, 70, '#c6f4f6', 0.55, 'breathe');
    // the runes round the rim, and the water running over it
    let runes = '';
    for (let i = 0; i < 11; i++) { const a = rad(166 - i * 15.2), x = cx + Math.cos(a) * (rx + 1.5), y = top + 2.4 + Math.sin(a) * (ry + 2); runes += rune(i, x, y, 0.56); }
    const spill = U(taper([[118, 132], [117, 146], [118, 160]], [2.4, 1.6, 0.4], { per: 3 }), taper([[176, 133], [177, 150], [176, 164]], [2.4, 1.6, 0.4], { per: 3 }));
    s.bloom(`<path d="${runes}" fill="none" stroke="#effdfb" stroke-width=".75" stroke-linecap="round"/><path d="${spill}" fill="#c6f4f6" opacity=".85"/>` +
      `<path d="${oval(cx, top, rx - 3, ry - 2.4)}" fill="none" stroke="#ffffff" stroke-width=".8" opacity=".7"/>`, { sd: 1.3, k: 1.45, box: [90, 100, 120, 70] });
    s.motes({ seed: 15903, n: 26, x: [110, 190], y: [36, 118], r: [0.4, 1.2], fill: p.glow, hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.45, 1] });
    s.add(particles({ seed: 15904, n: 10, x: [30, 270], y: [90, 200], r: [0.4, 0.9], fill: '#c6f4f6', cls: 'float', t: [6, 10], op: [0.2, 0.5] }));
    return s.svg();
  },

  // EMBER + TIDE. The Last Storm: a colossal storm over a dark sea, and out
  // of it one huge bolt, lightning and fire wound together, striking a
  // tower on a rock far out at the horizon.
  'the-last-storm'(s) {
    fin(s, ['ember', 'tide']);
    s.rect(s.lin([[0, '#070e16'], [0.4, '#142630'], [0.66, '#2c3a3e'], [0.72, '#4a3a34']]));
    const tx = 216, ty = 112;
    s.glow(tx, ty, 170, '#ff9a4a', 0.42);
    s.glow(tx, ty, 50, '#fff0c8', 0.6);
    // the sea: dark, whitecaps, the strike lying on it
    s.path('M-10,150H310V214H-10Z', s.lin([[0, '#3a3a36'], [0.08, '#1a2a30'], [0.5, '#0c1a20'], [1, '#04090c']]));
    s.add('<path d="M-10,150.5H310" stroke="#ffcf8a" stroke-width=".7" opacity=".45"/>');
    const R = rng(16001);
    let caps = '';
    for (let i = 0; i < 30; i++) { const y = 154 + R() * 56, x = R() * 310, w = 4 + (y - 150) * 0.2; caps += `M${f1(x)},${f1(y)}q${f1(w / 2)},${f1(-1 - w * 0.08)} ${f1(w)},0`; }
    s.add(`<path d="${caps}" stroke="#bfe6ea" stroke-width=".8" fill="none" opacity=".45"/>`);
    s.add(glitter([[tx, 154, 30, 0.6], [tx - 2, 160, 22, 0.5], [tx + 3, 167, 40, 0.42], [tx - 4, 176, 28, 0.34], [tx + 2, 186, 50, 0.26], [tx, 198, 36, 0.2]], '#ffe2a8'));
    // the tower on its rock, far out
    s.figure(`<path d="${U(blob([[192, 152], [198, 144], [208, 140], [224, 141], [234, 146], [240, 152]], 4), poly([[210, 142], [210, 116], [208.6, 116], [208.6, 110], [211, 110], [211, 113], [213, 113], [213, 110], [215.6, 110], [215.6, 113], [217.6, 113], [217.6, 110], [220, 110], [220, 116], [218.6, 116], [218.6, 142]]))}"/>`,
      { fill: '#0a0c0e', rim: '#ffd9a0', offsets: [[0, -1.2], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.9 });
    s.add(`<rect x="213" y="124" width="2.2" height="3.6" fill="#ffd27a"/>`);
    // the storm: a wall of cloud filling the sky, its belly lit by the bolt,
    // turning round the eye the bolt comes out of
    const ex = 104, ey = 64;
    const belly = [[-14, 98], [12, 106], [38, 100], [60, 104], [80, 92], [94, 76], [106, 70], [120, 80], [140, 96], [168, 104], [196, 96], [222, 104], [250, 98], [276, 106], [314, 98]];
    const mass = U(poly([[-14, -14], [314, -14], ...spline(belly.slice().reverse(), 5)]),
      puffs([[22, 102, 11], [56, 104, 9], [150, 100, 11], [188, 100, 10], [236, 102, 11], [286, 104, 12]], 1.7));
    s.figure(`<path d="${mass}"/>`, { fill: s.lin([[0, '#0c141a'], [0.6, '#222e34'], [1, '#3c484c']]), rim: '#ffcf8a', offsets: [[0, 1.6], [0.9, 1.1], [-0.9, 1.1]], rimOp: 0.75, shade: 0.3, light: [0.2, 1] });
    // billows inside the mass, each lit along its underside, wheeling
    // round the eye
    const high = puffs([[-4, 30, 26], [44, 18, 24], [150, 14, 24], [204, 22, 26], [258, 18, 26], [306, 30, 26]], 1.5);
    const mid = puffs([[14, 66, 18], [56, 56, 16], [150, 58, 16], [186, 66, 18], [232, 60, 18], [280, 68, 20]], 1.6);
    s.figure(`<path d="${high}"/>`, { fill: s.lin([[0, '#121c22'], [1, '#2a363c']]), rim: '#e6b680', offsets: [[0, 1.4]], rimOp: 0.4 });
    s.figure(`<path d="${mid}"/>`, { fill: s.lin([[0, '#26323a'], [1, '#4a565a']]), rim: '#ffcf8a', offsets: [[0, 1.5], [0.6, 1]], rimOp: 0.6 });
    s.add(`<rect x="-5" y="-5" width="${W + 10}" height="${H + 10}" fill="${s.radU(160, 86, 170, [[0, '#ff9a4a', 0.34], [0.45, '#ff7a2e', 0.14], [1, '#ff7a2e', 0]])}" style="mix-blend-mode:screen"/>`);
    s.add(`<ellipse cx="${ex}" cy="${ey + 2}" rx="26" ry="14" fill="${s.rad([[0, '#fff0c8', 0.55], [0.5, '#ffb35a', 0.25], [1, '#ffb35a', 0]])}"/>`);
    let rain = '';
    for (let i = 0; i < 46; i++) { const x = R() * 330 - 10, y = 90 + R() * 110; rain += `M${f1(x)},${f1(y)}l-3,9`; }
    s.add(`<path d="${rain}" stroke="#9fc9d2" stroke-width=".5" opacity=".3"/>`);
    // the bolt: a channel of lightning out of the storm's eye, a ribbon of
    // fire wound round it, forks splitting off, the burst on the tower
    const a0 = [ex, ey], a1 = [tx, ty];
    const core = bolt(a0, a1, 16002, 12, 6);
    const len = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]), nx = -(a1[1] - a0[1]) / len, ny = (a1[0] - a0[0]) / len;
    const helix = [], ws = [];
    for (let i = 0; i <= 72; i++) {
      const t = i / 72, x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t, ph = t * Math.PI * 7;
      helix.push([x + nx * 10 * (1 - t * 0.5) * Math.sin(ph), y + ny * 10 * (1 - t * 0.5) * Math.sin(ph)]);
      ws.push(1.2 + 5 * (0.5 + 0.5 * Math.cos(ph)) * (1 - t * 0.4));
    }
    const fire = taper(helix, ws, { per: 1 });
    const forks = [bolt(core[3], [core[3][0] - 34, core[3][1] + 44], 16003, 5, 5), bolt(core[6], [core[6][0] + 30, core[6][1] + 26], 16004, 4, 4),
      bolt(core[2], [core[2][0] + 44, core[2][1] - 10], 16005, 4, 4), bolt(core[8], [core[8][0] - 18, core[8][1] + 36], 16006, 4, 4), bolt(core[1], [core[1][0] - 30, core[1][1] + 6], 16008, 4, 4)];
    s.glow(ex, ey, 46, '#fff0c8', 0.65, 'breathe');
    s.bloom(`<path d="${polyline(core)}" stroke="#bfefff" stroke-width="8" fill="none" opacity=".4" stroke-linejoin="round"/><path d="${fire}" fill="${s.linU(ex, ey, tx, ty, [[0, '#ffd27a'], [0.5, '#ff8a3a'], [1, '#ffb04a']])}"/>` +
      `<path d="${polyline(core)}" stroke="#ffffff" stroke-width="2.6" fill="none" stroke-linejoin="round"/><path d="${forks.map(polyline).join('')}" stroke="#e6faff" stroke-width="1.1" fill="none" stroke-linejoin="round"/>` +
      `<path d="${glint(tx, ty, 22, 0.12) + rot(glint(tx, ty, 11, 0.2), tx, ty, 45)}" fill="#ffffff"/>`, { sd: 2, k: 1.4, box: [30, 20, 260, 150] });
    s.motes({ seed: 16007, n: 22, x: [180, 260], y: [80, 150], r: [0.4, 1.1], fill: '#ffb04a', hot: '#fff6d8', cls: 'rise', t: [3, 6], op: [0.4, 1] });
    return s.svg();
  },

  // ── LEGENDS ───────────────────────────────────────────────────────

  // TIDE + UMBRAL. Mirelle, the Mask-Maker: in her workshop by the sea,
  // against a round window full of moon and water, she holds a glowing
  // half-mask up before her face; dozens of masks hang on the walls round
  // her, every one of them watching.
  'legend-mirelle'(s) {
    fin(s, ['tide', 'umbral']);
    s.rect(s.lin([[0, '#100c22'], [0.5, '#1c1a36'], [1, '#0c0a18']]));
    // the round window: the moon over the sea
    const wx = 150, wy = 82, wr = 58;
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><circle cx="${wx}" cy="${wy}" r="${wr}"/></clipPath>`);
    s.glow(wx - 20, wy - 20, 140, '#d6e6ff', 0.45);
    s.add(`<g clip-path="url(#${cid})"><rect x="${wx - wr}" y="${wy - wr}" width="${2 * wr}" height="${2 * wr}" fill="${s.lin([[0, '#1a2a4a'], [0.5, '#4a6a8a'], [0.66, '#8ab0b8']])}"/>` +
      `<circle cx="${wx - 26}" cy="${wy - 24}" r="13" fill="#f2f6fc"/>` +
      `<rect x="${wx - wr}" y="${wy + 16}" width="${2 * wr}" height="${wr}" fill="${s.lin([[0, '#3a5a72'], [1, '#0e1e30']])}"/>` +
      `${glitter([[wx - 26, wy + 19, 30, 0.7], [wx - 28, wy + 24, 22, 0.6], [wx - 23, wy + 30, 36, 0.5], [wx - 29, wy + 37, 26, 0.4], [wx - 24, wy + 45, 44, 0.3]], '#eaf2ff')}</g>`);
    // its frame and mullions
    s.add(`<circle cx="${wx}" cy="${wy}" r="${wr + 3}" fill="none" stroke="#08060f" stroke-width="7"/><circle cx="${wx}" cy="${wy}" r="${wr + 3}" fill="none" stroke="#8a9ad8" stroke-width=".8" opacity=".6"/>` +
      `<path d="M${wx - wr},${wy}H${wx + wr}M${wx},${wy - wr}V${wy + wr}" stroke="#08060f" stroke-width="3"/>` +
      `<circle cx="${wx}" cy="${wy}" r="${wr * 0.5}" fill="none" stroke="#08060f" stroke-width="2"/>`);
    // the masks on the walls, rows of them, every one with eyes
    const R = rng(9640);
    const faces = [], holes = [];
    const spots = [];
    for (let row = 0; row < 5; row++) for (let i = 0; i < 4; i++) {
      spots.push([14 + i * 21 + (row % 2) * 9 + (R() - 0.5) * 5, 26 + row * 30 + (R() - 0.5) * 6]);
      spots.push([300 - (14 + i * 21 + ((row + 1) % 2) * 9 + (R() - 0.5) * 5), 26 + row * 30 + (R() - 0.5) * 6]);
    }
    let cords = '', mouths = '';
    const kinds = [0, 1, 2, 4, 5, 0, 1, 2, 5, 2];
    for (const [x, y] of spots) {
      if (Math.hypot(x - wx, y - wy) < wr + 14) continue;
      const k = 1.3 + R() * 0.5, kind = kinds[Math.floor(R() * kinds.length)], tl = (R() - 0.5) * 24, [f, h] = maskAt(x, y, k, kind, tl);
      faces.push(f); holes.push(h); cords += `M${f1(x)},${f1(y - 6 * k)}V${f1(y - 10 * k)}`;
      if (kind === 0 || kind === 5) mouths += rot(`M${f1(x - 1.6 * k)},${f1(y + 3.6 * k)}Q${f1(x)},${f1(y + (R() < 0.5 ? 2.2 : 3.6) * k)} ${f1(x + 1.6 * k)},${f1(y + 3.6 * k)}`, x, y, tl);
    }
    s.add(`<path d="${cords}" stroke="#2a2440" stroke-width=".6"/>`);
    s.figure(`<path d="${U(faces)}"/>`, { fill: s.lin([[0, '#6e6a8e'], [1, '#383452']]), rim: '#b8c8ec', offsets: [[0, -0.8]], rimOp: 0.45 });
    s.path(U(holes), '#0a0814');
    s.add(`<path d="${mouths}" fill="none" stroke="#0a0814" stroke-width=".8"/>`);
    // the floor, moonlight from the window lying on it
    s.path('M-10,178H310V214H-10Z', s.lin([[0, '#2a2440'], [1, '#0c0a14']]));
    s.add(`<ellipse cx="150" cy="190" rx="60" ry="9" fill="${s.rad([[0, '#c6d6f4', 0.32], [1, '#c6d6f4', 0]])}"/>`);
    // the workbench at the side, a mask half-carved on it
    s.path('M222,160H300V166H222ZM228,166H232V196H228ZM290,166H294V196H290Z', '#0c0a16');
    const [bf, bh] = maskAt(252, 154, 1.4, 1, -8);
    s.path(bf, '#a6a2c4'); s.path(bh, '#0a0814');
    s.path('M268,158L284,152L285,154L270,160Z', '#2a2440');
    // Mirelle: a long coat falling to the floor, its hem flared out behind
    // her; one arm raised with the mask before her face, the other at her
    // side with a carving knife
    const fx = 150, fy = 194, place = at(fx, fy, 1);
    const her = place(U(
      blob([[-10, -112], [10, -112], [14, -84], [18, -54], [26, -24], [40, -4], [46, 2], [20, 0], [0, 2], [-22, 0], [-30, -4], [-22, -26], [-16, -56], [-13, -86]], 4),
      taper([[0, -110], [0, -122], [0, -132]], [16, 15, 18]),
      ell(-7, -131, 5, 3.8), ell(7, -131, 5, 3.8),
      taper([[0, -134], [0, -140]], 5, { per: 2 }),
      ell(0, -147, 6, 7.4), ell(1, -156, 5, 4.4), taper([[3, -155], [10, -152], [14, -144]], [2.4, 1.8, 0.4]),
      taper([[7, -130], [16, -137], [22, -142]], [5.4, 4.8, 4.4]), taper([[22, -142], [17, -148], [10, -151]], [4.2, 3.8, 3.4]), ell(9, -151.4, 2.8, 2.4),
      taper([[-7, -130], [-12, -116], [-14, -100]], [5.4, 4.6, 4]), taper([[-14, -100], [-15, -90], [-15, -84]], [4, 3.6, 3.2]), ell(-15, -82, 2.6, 3),
      taper([[-15, -80], [-15, -70]], [1.4, 0.4], { per: 2 }),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#08060e', rim: '#d6e6ff', offsets: [[0, -1.3], [-1.1, -0.7], [1.1, -0.7]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    // the mask she holds: a half-mask glowing violet-white, a ribbon off it
    const mk = place(blob([[-10, -152.6], [-5, -156.4], [0, -154], [5, -156.4], [10, -152.6], [8, -145.4], [2.6, -144.8], [0, -146.6], [-2.6, -144.8], [-8, -145.4]], 3));
    s.glow(fx, fy - 150, 40, '#c9a6ff', 0.6, 'breathe');
    s.bloom(`<path d="${mk}" fill="#f2ecff"/><path d="${place(lens(-4.2, -150.6, 3.8, 8, 0.5, 3) + lens(4.2, -150.6, 3.8, -8, 0.5, 3))}" fill="#3a2a5c"/>` +
      `<path d="${place('M-1.6,-155.4Q0,-152 1.6,-155.4Q0,-153.4 -1.6,-155.4Z')}" fill="#9a7ad8"/>` +
      `<path d="${place('M9.6,-151Q18,-150 22,-143T30,-134M9.2,-148Q15,-145 17,-139T23,-130')}" fill="none" stroke="#d6c0ff" stroke-width="1" opacity=".9"/>`, { sd: 1.4, k: 1.5, box: [120, 20, 80, 60] });
    s.motes({ seed: 9641, n: 16, x: [40, 260], y: [30, 180], r: [0.4, 1], fill: '#c9b8f4', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // EMBER + TIDE. Seren, the Storm-Scholar: on the top of a sea tower in a
  // storm she holds an open book in one hand and lifts her staff with the
  // other; the clouds have opened over it, lightning and fire coil up it
  // into the gap, and loose pages fly off on the gale.
  'legend-seren'(s) {
    fin(s, ['ember', 'tide']);
    s.rect(s.lin([[0, '#0c1a20'], [0.35, '#24464e'], [0.58, '#4a6e70'], [0.6, '#2a4a52'], [1, '#1a2c32']]));
    const sx = 183, sy = 6;
    s.glow(sx, sy, 190, '#ffc070', 0.55);
    s.glow(sx, sy, 60, '#fff0c8', 0.55);
    s.shafts({ cx: sx, cy: sy, n: 12, from: 40, to: 150, len: 260, spread: 2.2, color: '#ffe6b8', op: 0.26, seed: 9665, sd: 2.2 });
    // the sea far below, whitecaps, rain
    s.path('M-10,124H310V214H-10Z', s.lin([[0, '#2a4a52'], [0.1, '#163038'], [1, '#06141a']]));
    s.add('<path d="M-10,124.5H310" stroke="#ffcf8a" stroke-width=".6" opacity=".35"/>');
    const R = rng(9660);
    let caps = '', rain = '';
    for (let i = 0; i < 22; i++) { const y = 128 + R() * 40, x = R() * 310, w = 3 + (y - 124) * 0.14; caps += `M${f1(x)},${f1(y)}q${f1(w / 2)},${f1(-0.8 - w * 0.08)} ${f1(w)},0`; }
    for (let i = 0; i < 40; i++) { const x = R() * 330 - 10, y = R() * 200; rain += `M${f1(x)},${f1(y)}l-4,9`; }
    s.add(`<path d="${caps}" stroke="#bfe6ea" stroke-width=".7" fill="none" opacity=".45"/>`);
    // the storm, torn open over her staff
    const left = U(poly([[-14, -14], [164, -14], ...spline([[166, -14], [164, 6], [154, 24], [138, 40], [114, 54], [90, 62], [60, 60], [30, 68], [-14, 62]], 5)]),
      puffs([[140, 40, 10], [110, 56, 10], [80, 64, 9], [46, 64, 10], [10, 66, 10]], 1.5));
    const right = U(poly([[314, -14], [204, -14], ...spline([[202, -14], [206, 8], [218, 26], [240, 40], [268, 48], [314, 46]], 5)]),
      puffs([[224, 32, 9], [252, 46, 9], [288, 50, 9]], 1.5));
    const cfill = s.lin([[0, '#08121a'], [0.6, '#1a2c34'], [1, '#2e444a']]);
    s.figure(`<path d="${left}"/>`, { fill: cfill, rim: '#ffd9a0', offsets: [[1.2, 1.2], [0.4, 1.6]], rimOp: 0.8 });
    s.figure(`<path d="${right}"/>`, { fill: cfill, rim: '#ffd9a0', offsets: [[-1.2, 1.2], [-0.4, 1.6]], rimOp: 0.8 });
    s.add(`<path d="${rain}" stroke="#9fc9d2" stroke-width=".5" opacity=".3"/>`);
    // the top of the tower: a ring of parapet, the far side small behind
    // her, the near side big in front
    const ring = (y0, rx, ry, h, w, gap, a0, a1) => {
      const out = [];
      for (let a = a0; a < a1; a += gap) {
        const x = 150 + Math.cos(rad(a)) * rx, y = y0 + Math.sin(rad(a)) * ry, x2 = 150 + Math.cos(rad(a + w)) * rx, y2 = y0 + Math.sin(rad(a + w)) * ry;
        out.push(poly([[x, y], [x, y - h], [x2, y2 - h], [x2, y2]]));
      }
      return out;
    };
    const backArc = Array.from({ length: 21 }, (_, i) => [150 + Math.cos(rad(180 + i * 9)) * 190, 168 + Math.sin(rad(180 + i * 9)) * 20]);
    s.path(U(poly([[-14, 150], ...backArc, [314, 150], [314, 214], [-14, 214]]), ring(168, 190, 20, 8, 4.2, 9, 180, 360)), s.lin([[0, '#2a2a2c'], [0.3, '#1a1c1e'], [1, '#0c0e10']]));
    s.add(`<path d="M${backArc.map(pt).join('L')}" fill="none" stroke="#ffcf8a" stroke-width=".8" opacity=".5"/>`);
    s.add(`<ellipse cx="160" cy="174" rx="70" ry="8" fill="${s.rad([[0, '#ffd9a0', 0.3], [1, '#ffd9a0', 0]])}"/>`);
    // Seren: robes and a long scarf flying out on the wind, the open book in
    // her left hand, the staff raised in her right
    const fx = 150, fy = 184, K = 1, place = at(fx, fy, K);
    const her = place(U(
      blob([[-9, -86], [9, -86], [12, -60], [16, -34], [22, -8], [26, 0], [-22, 0], [-26, -6], [-36, -10], [-22, -24], [-16, -50], [-12, -70]], 4),
      taper([[0, -84], [0, -96], [0, -106]], [16, 15, 18]),
      ell(-7, -105, 5, 3.8), ell(7, -105, 5, 3.8),
      taper([[0, -108], [0, -114]], 5, { per: 2 }),
      profile(1.4, -121, 1, -10),
      taper([[-4, -126], [-14, -127], [-24, -123], [-34, -125]], [6, 5, 3.6, 0.6]), taper([[-4, -121], [-16, -118], [-28, -114], [-38, -116]], [5, 4.4, 3, 0.5]),
      taper([[-4, -108], [-20, -112], [-40, -106], [-60, -112], [-78, -104]], [7, 7, 6, 4, 0.6]),
      taper([[7, -104], [16, -114], [23, -124]], [5.4, 4.6, 4]), taper([[23, -124], [26, -130], [28, -136]], [4.2, 3.8, 3.4]), ell(28.4, -137.4, 3.2, 3.4),
      taper([[-7, -104], [-16, -94], [-26, -88]], [5.4, 4.6, 4]), taper([[-26, -88], [-34, -90], [-38, -94]], [4.2, 3.8, 3.4]),
      taper([[-11, -64], [-15, -50], [-17, -38]], [4.4, 4.4, 4]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: '#071016', rim: '#ffe2b0', offsets: [[0.8, -1.2], [0, -1.3], [-0.8, -0.8]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0.5, -1] });
    // the near parapet in front of her
    const frontArc = Array.from({ length: 21 }, (_, i) => [150 + Math.cos(rad(i * 9)) * 190, 168 + Math.sin(rad(i * 9)) * 26]).reverse();
    s.figure(`<path d="${U(poly([[-14, 214], [-14, 196], ...frontArc, [314, 196], [314, 214]]), ring(168, 190, 26, 16, 5, 10, 8, 175))}"/>`,
      { fill: s.lin([[0, '#1a1c1e'], [1, '#08090a']]), rim: '#ffcf8a', offsets: [[0, -1.2], [0.6, -0.8]], rimOp: 0.8 });
    // the staff
    const s0 = [fx + 28.4 * K, fy - 137.4 * K], s1 = [sx, sy], sb = [168.4, 142];
    s.path(taper([sb, s0, s1], [3, 2.8, 2.4], { per: 2 }), '#1a1410');
    // the book, its pages lit, and pages flying off it
    const bxk = fx - 38 * K, byk = fy - 96 * K;
    s.glow(bxk, byk, 34, '#ffe2b0', 0.55);
    const leaves = [[bxk - 18, byk - 14, -30], [bxk - 36, byk - 32, 20], [bxk - 58, byk - 22, -50], [bxk - 78, byk - 48, 10], [bxk - 20, byk - 46, 40]];
    s.add(leaves.map(([x, y, a], i) => `<g class="float" style="--t:${5 + i}s;--d:-${f1(i * 1.3)}s"><path d="${rot(`M${f1(x - 4)},${f1(y - 3)}L${f1(x + 4)},${f1(y - 4)}L${f1(x + 4.6)},${f1(y + 3)}L${f1(x - 3.4)},${f1(y + 4)}Z`, x, y, a)}" fill="#f4ecd6" opacity=".85"/></g>`).join(''));
    // the coil: lightning and fire wound up the staff, out into the gap
    const coil = (ph, w) => {
      const pts = [];
      for (let i = 0; i <= 50; i++) {
        const t = i / 50, x = s0[0] + (s1[0] - s0[0]) * t, y = s0[1] + (s1[1] - s0[1]) * t, a = t * Math.PI * 5 + ph, r = w * (0.35 + 0.65 * t);
        pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.4]);
      }
      return pts;
    };
    const zap = coil(0, 10).map(([x, y], i) => [x + (i % 2 ? 1.8 : -1.8), y + (i % 3 ? 0.8 : -0.8)]);
    const fire = coil(Math.PI, 11);
    const up = bolt(s1, [sx + 34, -12], 9661, 6, 6), up2 = bolt(s1, [sx - 30, -12], 9662, 6, 6), up3 = bolt(s1, [sx + 4, -14], 9664, 5, 5);
    s.glow(sx, sy + 4, 44, '#fff0c8', 0.75, 'breathe');
    s.bloom(`<path d="${taper(fire, fire.map((_, i) => 1.4 + 4.4 * (i / 50)), { per: 1 })}" fill="${s.linU(s0[0], s0[1], s1[0], s1[1], [[0, '#ff6a1f'], [0.6, '#ff9a3a'], [1, '#ffd27a']])}"/>` +
      `<path d="${polyline(zap)}" stroke="#e6faff" stroke-width="1.4" fill="none"/>` +
      `<path d="${polyline(up) + polyline(up2) + polyline(up3)}" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linejoin="round"/>` +
      `<path d="${glint(s1[0], s1[1], 12, 0.14)}" fill="#ffffff"/>` +
      `<path d="${[-17, -10, -3, 4, 11, 18].map((x, i) => rune(i, fx + x * K, fy - 7 * K, 0.7)).join('')}" fill="none" stroke="#ffb35c" stroke-width=".7" stroke-linecap="round"/>` +
      `<path d="M${f1(bxk - 13)},${f1(byk + 2)}L${f1(bxk)},${f1(byk - 4)}L${f1(bxk)},${f1(byk + 2.4)}L${f1(bxk - 12)},${f1(byk + 7.4)}ZM${f1(bxk)},${f1(byk - 4)}L${f1(bxk + 13)},${f1(byk - 2)}L${f1(bxk + 12)},${f1(byk + 5.4)}L${f1(bxk)},${f1(byk + 2.4)}Z" fill="#fff2d0"/>`, { sd: 1.6, k: 1.45, box: [50, -10, 240, 200] });
    s.motes({ seed: 9663, n: 20, x: [120, 270], y: [10, 120], r: [0.4, 1.1], fill: '#ffb04a', hot: '#fff6d8', cls: 'rise', t: [3, 7], op: [0.4, 1] });
    return s.svg();
  },
};
