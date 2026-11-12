// Card art for the second printing of Week One (cards 91–97: cards that
// multiply). Style rules live in ../scenes.js; drawing tools in ../kit.js.

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

// Move, rotate or mirror a polygon path.
const mv = (d, dx, dy) => d.replace(NUM, (_, x, y) => `${f1(+x + dx)},${f1(+y + dy)}`);
const rot = (d, ox, oy, deg) => {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), sn = Math.sin(a);
  return d.replace(NUM, (_, x, y) => { const dx = x - ox, dy = y - oy; return `${f1(ox + dx * c - dy * sn)},${f1(oy + dx * sn + dy * c)}`; });
};
const flipX = (d, ax) => d.replace(NUM, (_, x, y) => `${f1(2 * ax - x)},${y}`);

// A lens-shaped leaf or petal centred on (x, y), `l` long, turned `a` degrees;
// leafAt() grows the same shape out of a point instead.
const lens = (x, y, l, a, w = 0.38, per = 4) => rot(blob([[x - l / 2, y], [x, y - (l * w) / 2], [x + l / 2, y], [x, y + (l * w) / 2]], per), x, y, a);
const leafAt = (x, y, a, l, w = 0.38, per = 4) => lens(x + (Math.cos(rad(a)) * l) / 2, y + (Math.sin(rad(a)) * l) / 2, l, a, w, per);

// A flame tongue along any direction (degrees), its tip flicking aside.
const lick = (x, y, deg, L, w, flick = 0.3) => {
  const a = rad(deg), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const at = (t, o) => [x + ux * L * t + nx * o, y + uy * L * t + ny * o];
  return taper([[x, y], at(0.35, w * 0.25), at(0.7, -w * 0.2), at(1, L * flick * 0.3)], [w, w * 0.8, w * 0.42, 0.3], { per: 5 });
};

// A tendril from (x, y) heading `a` degrees, bending as it goes and rolling
// up at the end.
function tendril(x, y, a, L, { bend = 40, w = 2.6, curl = 5 } = {}) {
  const pts = [[x, y]];
  let px = x, py = y, ang = a;
  for (let i = 1; i <= 5; i++) { ang += bend / 5; px += (Math.cos(rad(ang)) * L) / 5; py += (Math.sin(rad(ang)) * L) / 5; pts.push([px, py]); }
  const dir = Math.sign(bend) || 1, cx = px + Math.cos(rad(ang + dir * 90)) * curl, cy = py + Math.sin(rad(ang + dir * 90)) * curl;
  let th = Math.atan2(py - cy, px - cx);
  for (let k = 1; k <= 8; k++) { th += dir * 0.7; const rr = curl * (1 - k / 11); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  return taper(pts, pts.map((_, i) => Math.max(0.4, w * (1 - i / pts.length))), { per: 4 });
}

// The kit's per-faction finish (colour grade, vignette, grain).
const fin = (s, f) => (typeof s.finish === 'function' ? s.finish({ faction: f }) : s);

// A small winged spirit (the Spirit token's shape), centred on its chest.
// (Drawn small here, so with fewer points than the token's.)
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

// Reeds along a bank: blades rising from `base`, leaning by `lean` (per unit
// of height), a bulrush head on some. A list of polygons, ready for U().
function reeds(seed, x0, x1, base, h, { gap = [3, 6], lean = 0, heads = 0.2, w = [1.6, 3] } = {}) {
  const R = rng(seed), out = [];
  for (let x = x0; x < x1; x += gap[0] + R() * (gap[1] - gap[0])) {
    const hh = h[0] + R() * (h[1] - h[0]), l = lean * hh + (R() - 0.5) * hh * 0.3, ww = w[0] + R() * (w[1] - w[0]), y = base + R() * 3;
    out.push(taper([[x, y], [x + l * 0.3, y - hh * 0.5], [x + l, y - hh]], [ww, ww * 0.7, 0.3], { per: 4 }));
    if (R() < heads) out.push(ell(x + l * 0.52, y - hh * 0.72, ww * 1.3, 2.5 + hh * 0.07, (Math.atan2(l * 0.8, hh) * 180) / Math.PI));
  }
  return out;
}

// A fern frond from (x, y): its stalk leaves at `a` degrees and bends by
// `bend` degrees over its length L, with paired leaflets shrinking toward
// the tip; `curl` rolls the tip up into a fiddlehead of that radius.
function frond(x, y, a, L, { bend = 30, n = 7, lw = 0.32, curl = 0, w = 2.4, lp = 3 } = {}) {
  const pts = [[x, y]];
  let px = x, py = y;
  for (let i = 1; i <= 8; i++) {
    const ang = rad(a + (bend * i) / 8);
    px += (Math.cos(ang) * L) / 8; py += (Math.sin(ang) * L) / 8;
    pts.push([px, py]);
  }
  const stem = pts.length;
  if (curl) {
    const dir = Math.sign(bend) || 1, ang = rad(a + bend);
    const cx = px + Math.cos(ang + (dir * Math.PI) / 2) * curl, cy = py + Math.sin(ang + (dir * Math.PI) / 2) * curl;
    let th = Math.atan2(py - cy, px - cx);
    for (let k = 1; k <= 10; k++) { th += dir * 0.62; const rr = curl * (1 - k / 13); pts.push([cx + Math.cos(th) * rr, cy + Math.sin(th) * rr]); }
  }
  const out = [taper(pts, pts.map((_, i) => Math.max(0.5, w * (1 - (0.75 * i) / pts.length))), { per: 3 })];
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1), j = Math.min(stem - 2, Math.floor(t * (stem - 1))), [qx, qy] = pts[j], [rx, ry] = pts[j + 1];
    const ang = (Math.atan2(ry - qy, rx - qx) * 180) / Math.PI, l = L * lw * (1 - t * 0.72);
    out.push(leafAt(qx, qy, ang - 58, l, 0.36, lp), leafAt(qx, qy, ang + 58, l, 0.36, lp));
  }
  return out;
}

// A tall robed singer, head tipped back in song, facing right (dir = -1:
// left); feet at (x, fy), about 80 tall at k = 1.
function singer(x, fy, k = 1, dir = 1) {
  const P = (pts) => pts.map(([a, b]) => [x + a * k * dir, fy + b * k]);
  return U(
    blob(P([[-5, -64], [5, -64], [8, -48], [11, -28], [14, -9], [16, -1], [6, 0.5], [-4, 0.5], [-13, -1], [-12, -12], [-10, -30], [-8, -48]]), 4),
    taper(P([[0.5, -62], [1.5, -69]]), 4.4 * k, { per: 2 }),
    ell(x + 2.2 * k * dir, fy - 74 * k, 4.6 * k, 5.6 * k, -34 * dir, 16),
    taper(P([[3, -71], [7.6, -73.6]]), [3.4 * k, 1.2 * k], { per: 2 }),
    taper(P([[-1, -79], [-5, -72], [-7, -62], [-8.5, -52]]), [6 * k, 6 * k, 4 * k, 0.8 * k], { per: 4 }),
    taper(P([[3, -60], [8.5, -55], [9.5, -49]]), [3.8 * k, 3.2 * k, 2.6 * k], { per: 4 }),
  );
}

// A head in profile looking right, centred on the skull: brow, nose, an
// open mouth, chin. `tilt` turns it (negative tips the face up).
const PROFILE = [[-4.5, 6.5], [-6.6, 1.5], [-6.4, -3.5], [-3.6, -7.2], [0.4, -7.9], [4.6, -5.6], [6.3, -2.2], [8.6, 0.6], [6.6, 1.9],
  [7.2, 3.1], [5.2, 4], [6.6, 5], [5.6, 7.4], [2.6, 8.2], [1.4, 9.4]];
const profile = (cx, cy, k, tilt) => rot(poly(PROFILE.map(([x, y]) => [cx + x * k, cy + y * k])), cx, cy, tilt);

export const new_d = {
  // A ring of tall singers made of light in a dim hall at dawn; the spirit
  // their song wakes splits in two as it climbs, and those split again.
  'the-bright-choir'(s) {
    fin(s, 'radiant');
    s.rect(s.lin([[0, '#1a1f3d'], [0.4, '#2c3356'], [0.72, '#47435f'], [1, '#594956']]));
    // the vault: a tall blind arch behind the choir, its ribs meeting overhead
    s.path('M90,152L90,64C90,22 120,0 150,-12C180,0 210,22 210,64L210,152Z', s.lin([[0, '#141933'], [1, '#262844']]));
    s.add('<g fill="none" stroke="#7478a0" opacity=".3"><path d="M90,152L90,64C90,22 120,0 150,-12C180,0 210,22 210,64L210,152" stroke-width="1.6"/>' +
      '<path d="M68,40C92,16 120,2 150,-8M232,40C208,16 180,2 150,-8M68,40V152M232,40V152" stroke-width="1.1"/></g>');
    // the high windows, the dawn in them; the sun just up in the right one
    const lancet = (x0, x1, top, bot) => {
      const m = (x0 + x1) / 2, sp = top + (x1 - x0) * 0.8;
      return `M${x0},${bot}L${x0},${f1(sp)}C${x0},${f1(sp - 16)} ${f1(m - 7)},${top + 4} ${m},${top}C${f1(m + 7)},${top + 4} ${x1},${f1(sp - 16)} ${x1},${f1(sp)}L${x1},${bot}Z`;
    };
    const winR = lancet(246, 278, 8, 102);
    s.glow(38, 56, 80, '#ffe2a6', 0.42);
    s.glow(262, 66, 110, '#fff0c2', 0.62);
    s.path(lancet(22, 54, 8, 102) + winR, s.lin([[0, '#a9bed8'], [0.5, '#f0d7a2'], [1, '#f7c27c']]));
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><path d="${winR}"/></clipPath>`);
    s.add(`<circle cx="266" cy="100" r="9" fill="#fffbea" clip-path="url(#${cid})"/>`);
    s.add('<path d="M38,18V102M22,60H54M262,18V102M246,60H278" stroke="#1d2140" stroke-width="2.2"/>');
    // the floor, polished, and the light the choir throws on it
    s.path('M-10,214L-10,150L310,150L310,214Z', s.lin([[0, '#4a3f50'], [0.4, '#2e2632'], [1, '#141016']]));
    s.add(`<ellipse data-part="floor" cx="150" cy="172" rx="112" ry="18" fill="${s.rad([[0, '#ffdc94', 0.62], [0.55, '#ffd27a', 0.25], [1, '#ffd27a', 0]])}"/>`);
    // shafts of dawn falling onto the ring, and the song rising out of it
    const beamL = s.linU(40, 40, 150, 190, [[0, '#fff1c8', 0.55], [1, '#fff1c8', 0.05]]);
    const beamR = s.linU(260, 40, 150, 190, [[0, '#fff4d0', 0.6], [1, '#fff4d0', 0.05]]);
    const column = s.linU(0, 178, 0, 92, [[0, '#fff3cc', 0.75], [1, '#fff3cc', 0.08]]);
    s.add(`<g ${s.fx('blur', { sd: 3 })}>` +
      `<g data-part="beams"><path d="M44,30L56,50L172,188L132,192Z" fill="${beamL}"/><path d="M36,62L50,100L116,194L92,192Z" fill="${beamL}" opacity=".7"/>` +
      `<path d="M256,30L244,50L128,188L168,192Z" fill="${beamR}"/><path d="M264,62L250,100L184,194L208,192Z" fill="${beamR}" opacity=".7"/></g>` +
      `<path data-part="column" d="M134,182L166,182L157,96L143,96Z" fill="${column}"/></g>`);
    // the choir: six tall singers in a ring, faces turned up
    const ring = [[104, 158, 0.86, 1], [196, 158, 0.86, -1], [70, 167, 0.98, 1], [230, 167, 0.98, -1], [126, 182, 1.1, 1], [174, 182, 1.1, -1]];
    const back = s.uid('sb'), front = s.uid('sf');
    s.defs.push(`<path id="${back}" d="${U(ring.slice(0, 4).map(([x, y, k, d]) => singer(x, y, k, d)))}"/>`,
      `<path id="${front}" d="${U(ring.slice(4).map(([x, y, k, d]) => singer(x, y, k, d)))}"/>`);
    s.blur(`<g fill="#ffd27a" opacity=".8"><use href="#${back}"/><use href="#${front}"/></g>`, 4);
    const robe = s.linU(0, 84, 0, 186, [[0, '#fffdf4'], [0.45, '#fff0c8'], [1, '#e8b86a']]);
    s.add(`<use href="#${back}" fill="${robe}"/>`);
    // a dark seam where the near singers stand in front of the far ones
    s.add(`<use href="#${front}" fill="none" stroke="#4a3440" stroke-width="2.6" opacity=".45"/>`);
    s.add(`<use href="#${front}" fill="${robe}"/>`);
    s.add(`<path d="${ring.map(([x, y, k, d]) => `M${f1(x + k * d)},${f1(y - 54 * k)}Q${f1(x + 3 * k * d)},${f1(y - 28 * k)} ${f1(x + 6 * k * d)},${f1(y - 3 * k)}` +
      `M${f1(x - 3 * k * d)},${f1(y - 50 * k)}Q${f1(x - 5 * k * d)},${f1(y - 26 * k)} ${f1(x - 9 * k * d)},${f1(y - 3 * k)}`).join('')}" fill="none" stroke="#d6a457" stroke-width=".8" opacity=".5"/>`);
    // the spirits: one, then two, four, eight, each pair streaming up out of
    // the one below (their trails fade back toward where they split)
    const span = [0, 52, 106, 156], ys = [102, 78, 55, 32], ks = [1.1, 0.82, 0.66, 0.52];
    const lv = [[[150, ys[0]]]];
    for (let L = 1; L < 4; L++) {
      const n = 2 ** L;
      lv.push(Array.from({ length: n }, (_, i) => [150 - span[L] / 2 + (span[L] * i) / (n - 1), ys[L] + (i % 2 ? -1.5 : 1.5)]));
    }
    let tails = '';
    for (let L = 1; L < 4; L++) {
      let soft = '', core = '';
      lv[L].forEach(([x, y], i) => {
        const [px, py] = lv[L - 1][i >> 1], k = ks[L], pts = [[px, py - 4], [px + (x - px) * 0.35, py - (py - y) * 0.45], [x, y + 5 * k]];
        soft += taper(pts, [1, 3.6 * k, 7 * k], { per: 5 });
        core += taper(pts, [0.3, 1.1 * k, 2.4 * k], { per: 5 });
      });
      const g = s.linU(0, ys[L - 1] - 4, 0, ys[L] + 4, [[0, '#fff4d2', 0], [1, '#fff4d2', 0.9]]);
      tails += `<g data-part="tail${L}"><path d="${soft}" fill="${g}" opacity=".35"/><path d="${core}" fill="${g}"/></g>`;
    }
    s.bloom(tails, { sd: 1.6, k: 1.3, box: [50, 8, 200, 110] });
    lv.forEach((row, L) => { s.add(`<g data-part="glow${L}">`); row.forEach(([x, y]) => s.glow(x, y - 2, 8 + 16 * ks[L], '#fff1c4', 0.8)); s.add('</g>'); });
    const all = lv.flatMap((row, L) => row.map(([x, y]) => [x, y, ks[L]]));
    for (let g = 0; g < 3; g++) {
      s.path(U(all.filter((_, i) => i % 3 === g).map(([x, y, k]) => sprite(x, y, k))), '#fffcf0', `class="float" style="--t:${6 + g * 1.5}s;--d:-${g * 2}s"`);
    }
    // great pillars either side of us
    const pillar = (x0, x1) => poly([[x0, 216], [x0, -6], [x1, -6], [x1, 216]]) + poly([[x0 - 5, 216], [x0 - 5, 194], [x1 + 5, 194], [x1 + 5, 216]]);
    s.figure(`<path d="${pillar(-10, 14)}"/>`, { fill: '#100f1c', rim: '#ffd99a', offsets: [[1.2, 0]], rimOp: 0.7 });
    s.figure(`<path d="${pillar(286, 310)}"/>`, { fill: '#100f1c', rim: '#ffe6b0', offsets: [[-1.2, 0]], rimOp: 0.8 });
    s.motes({ seed: 9101, n: 20, x: [40, 260], y: [40, 190], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 9102, n: 14, x: [70, 230], y: [14, 112], r: [0.4, 0.9], fill: '#fff6d8', cls: 'twinkle', t: [1.5, 3.5], op: [0.4, 1] }));
    return s.svg();
  },

  // A woman on a hilltop at sunrise, head thrown back in song; a stream of
  // tiny winged spirits pours out of her voice and away to the sun.
  dawnsinger(s) {
    fin(s, 'radiant');
    const p = PAL.radiant;
    s.rect(s.lin([[0, '#2b3557'], [0.3, '#56628a'], [0.56, '#c3aa8c'], [0.76, '#f1cc90'], [1, '#e9a467']]));
    s.add(particles({ seed: 9201, n: 16, x: [0, W], y: [0, 56], r: [0.3, 0.8], fill: '#f3ecff', cls: 'twinkle', op: [0.3, 0.8], t: [2.5, 6] }));
    // the sun, half up over the far hills
    const sx = 238, sy = 150;
    s.glow(sx, sy, 170, '#fff0c2', 0.85);
    s.shafts({ cx: sx, cy: sy, n: 16, from: -180, to: -8, len: 320, spread: 2, color: '#fff6dc', op: 0.22, seed: 9202 });
    s.glow(sx, sy, 56, '#fffaf0', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="16" fill="#fff8e6"/>`);
    s.layer(ridge({ seed: 9203, base: 160, amp: 18, freq: 2.2 }), '#a8987f', { blur: 0.7 });
    s.haze(138, 166, '#f6ddab', 0.38);
    s.path(ridge({ seed: 9204, base: 178, amp: 10, freq: 3 }), '#7b6851');
    s.haze(158, 186, '#f3d39e', 0.28);
    // her hill
    const hill = spline([[-10, 188], [24, 181], [56, 178], [88, 178.5], [120, 181], [160, 189], [210, 198], [310, 206]], 6);
    s.path(poly([...hill, [310, 214], [-10, 214]]), s.lin([[0, '#3b2d20'], [1, '#1d150d']]));
    // the singer: chest lifted, head thrown right back so her face is to the
    // sky, arms open, hair and hem lifting in the dawn wind (drawn with her
    // feet at the origin, then set on the hill)
    const K = 1.1, fx = 96, fy = 179.5;
    const place = (d) => d.replace(NUM, (_, x, y) => `${f1(fx + x * K)},${f1(fy + y * K)}`);
    const her = place(U(
      taper([[-2.5, -28], [-4.5, -14], [-5.6, -2.5]], [5.4, 4.4, 3.4]),
      taper([[3, -28], [6, -14], [8, -2.5]], [5.4, 4.4, 3.4]),
      ell(-4.6, -1.2, 4.4, 1.7), ell(10, -1.2, 4.6, 1.7),
      blob([[-6, -62], [6, -62], [9, -50], [12, -38], [16, -27], [10, -24], [3, -26], [-4, -24], [-12, -23], [-22, -25], [-30, -28], [-20, -36], [-12, -48]], 5),
      taper([[0.5, -60], [0, -72], [-5, -82]], [10, 12.5, 11]),
      taper([[-5, -83], [-3, -88], [-1, -91.5]], [6.2, 5.6, 5.2]),
      profile(-7.5, -95.5, 1.05, -72),
      taper([[-12, -95], [-20, -93], [-29, -90], [-37, -88.5], [-46, -90]], [8, 7.6, 6, 3.6, 0.6]),
      taper([[-6, -80], [-16, -72], [-26, -65]], [4.6, 3.8, 3]), taper([[-26, -65], [-32, -62]], [3, 0.8]),
      taper([[-3, -80], [7, -71], [16, -64]], [4.8, 3.9, 3]), taper([[16, -64], [22, -61]], [3, 0.8]),
    ));
    s.figure(`<path d="${her}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1.3, -0.3], [0.6, -1.2], [1.1, 0.5]], rimOp: 0.95, shade: 0.5, edge: 0.32, light: [1, -0.3] });
    // the song: a ribbon of light from her open mouth, arcing over to the
    // sun, full of tiny spirits
    const ctrl = [[95, 66], [102, 46], [124, 29], [158, 21], [194, 27], [222, 50], [234, 88], [238, 128]];
    const path = spline(ctrl, 10);
    const song = s.linU(95, 0, 238, 0, [[0, '#ffe2a0', 0.75], [0.55, '#fff1c8', 0.55], [1, '#fff6dc', 0.15]]);
    s.bloom(`<path d="${taper(ctrl, [1, 5, 8, 10, 10, 9, 7, 3])}" fill="${song}" opacity=".45"/>` +
      `<path d="${taper(ctrl, [0.4, 1.4, 2, 2.2, 2, 1.6, 1, 0.4])}" fill="#fffbea" opacity=".8"/>`, { sd: 2, k: 1.3, box: [80, 0, 180, 160] });
    const R = rng(9205), sp = [];
    for (let i = 0; i < 15; i++) {
      const u = 0.06 + (0.89 * i) / 14, [x, y] = path[Math.round(u * (path.length - 1))];
      sp.push([x + (R() - 0.5) * 9, y + (R() - 0.5) * 9, 0.24 + 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.15))]);
    }
    for (const [x, y, k] of sp) s.glow(x, y - 2, 5 + 16 * k, '#fff1c4', 0.7);
    for (let g = 0; g < 3; g++) {
      s.path(U(sp.filter((_, i) => i % 3 === g).map(([x, y, k]) => sprite(x, y, k))), '#fffcf0', `class="float" style="--t:${5 + g * 1.5}s;--d:-${g * 2}s"`);
    }
    s.motes({ seed: 9206, n: 14, x: [94, 140], y: [24, 66], r: [0.3, 0.8], fill: '#fff1c4', cls: 'float', t: [3, 6], op: [0.5, 1] });
    // tufts of grass on the crest and in the near corners
    const G = rng(9207), blades = [];
    for (const [x0, y0, n, hh] of [[4, 184, 4, 8], [40, 180, 3, 6], [132, 184, 3, 6], [160, 191, 4, 8], [250, 210, 6, 14], [284, 210, 6, 16], [-6, 210, 5, 14]]) {
      for (let i = 0; i < n; i++) {
        const x = x0 + i * 2.6 + G() * 2, h = hh * (0.6 + G() * 0.6), lean = (i - n / 2) * 2.4 + (G() - 0.5) * 3;
        blades.push(taper([[x, y0 + 2], [x + lean * 0.4, y0 - h * 0.5], [x + lean, y0 - h]], [1.6, 1, 0.3], { per: 4 }));
      }
    }
    s.path(U(blades), '#1d150d');
    s.motes({ seed: 9208, n: 14, x: [40, 270], y: [60, 180], r: [0.4, 1], fill: '#ffe39a', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    return s.svg();
  },

  // A fire mage conducting with both arms up; a spiral of flame winds up
  // around her, wider and brighter with every turn.
  crescendo(s) {
    fin(s, 'ember');
    s.rect(s.lin([[0, '#110303'], [0.42, '#2a0b07'], [0.7, '#561a0c'], [0.86, '#94361a'], [1, '#b44a1f']]));
    s.glow(150, 176, 170, '#ff6a1f', 0.35);
    s.layer(ridge({ seed: 9301, base: 170, amp: 30, peaks: true, freq: 2.6 }), '#4c180d', { blur: 0.7 });
    s.haze(142, 178, '#ff7a2e', 0.26);
    s.path('M-10,214L-10,180C60,176 120,178 170,179C230,180 270,177 310,180L310,214Z', s.lin([[0, '#260c07'], [1, '#0d0403']]));
    s.add('<path d="M20,196l14,3l8,-3l16,5M226,192l12,4l9,-2l14,6M92,204l12,2l7,5M190,206l10,-3l12,4" stroke="#ff7a2e" stroke-width="1" fill="none" opacity=".45"/>');
    // the spiral's light, strongest at the top
    s.glow(150, 56, 160, '#ff9a3a', 0.4);
    s.glow(150, 40, 70, '#ffd27a', 0.3);
    s.add(`<ellipse cx="150" cy="188" rx="46" ry="6" fill="${s.rad([[0, '#ff9a3a', 0.7], [1, '#ff9a3a', 0]])}"/>`);
    // the spiral: a widening helix around her, from her feet round her
    // waist and up behind her to end in front, right over her hands; cut
    // into the runs behind her and the runs in front
    const cx = 150, yb = 186, Hh = 165, r0 = 7, r1 = 112, turns = 1.75, tilt = 0.35, th0 = rad(90 - 630);
    const N = 150, pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, th = th0 + t * turns * 2 * Math.PI, r = r0 + (r1 - r0) * Math.pow(t, 1.3);
      const w = (1.4 + 15 * Math.pow(t, 1.5)) * (t > 0.92 ? 1 - (0.6 * (t - 0.92)) / 0.08 : 1);
      pts.push({ t, th, x: cx + r * Math.cos(th), y: yb - Hh * t + Math.sin(th) * r * tilt, front: Math.sin(th) > 0, w });
    }
    const runs = [];
    pts.forEach((q, i) => {
      const last = runs[runs.length - 1];
      if (!last || last.front !== q.front) { if (last) last.pts.push(q); runs.push({ front: q.front, pts: i ? [pts[i - 1], q] : [q] }); }
      else last.pts.push(q);
    });
    const fire = s.linU(0, 194, 0, 14, [[0, '#b0341a', 0.85], [0.3, '#e04a1a', 0.9], [0.6, '#ff8a2e'], [0.82, '#ffc25a'], [1, '#fff0c0']]);
    const hot = s.linU(0, 150, 0, 14, [[0, '#ffd27a', 0], [0.5, '#ffe7a3', 0.75], [1, '#fffaf0']]);
    const end = pts[N];
    // flames stream back off the turning ribbon (it runs leftward across the
    // front, rightward across the back); the end flares up white-hot
    const draw = (run) => {
      const P = run.pts.map((q) => [q.x, q.y]);
      let licks = '', core = '';
      run.pts.forEach((q, i) => {
        if (q.t < 0.1 || q.t > 0.97 || i % 4) return;
        const a = -90 + (run.front ? 1 : -1) * 34 * Math.abs(Math.sin(q.th)) + Math.cos(q.th) * 30;
        const L = (run.front ? 0.55 : 1) * (4 + 30 * Math.pow(q.t, 1.4)), w = 1.4 + 6.5 * q.t;
        licks += lick(q.x, q.y - q.w * 0.3, a, L, w, i % 8 ? 0.4 : -0.4);
      });
      if (run.pts.includes(end)) {
        licks += lick(end.x, end.y - 2, -94, 50, 17, 0.3) + lick(end.x - 4, end.y, -122, 26, 8, -0.4) + lick(end.x + 5, end.y, -62, 30, 8, 0.4);
        core = lick(end.x, end.y - 3, -94, 30, 8, 0.3);
      }
      return `<path d="${taper(P, run.pts.map((q) => q.w), { per: 2 })}${licks}" fill="${fire}"/>` +
        `<path d="${taper(P, run.pts.map((q) => Math.max(0.2, q.w * 0.42 * Math.max(0, (q.t - 0.25) / 0.75))), { per: 2 })}${core}" fill="${hot}"/>`;
    };
    s.bloom(`<g opacity=".72">${runs.filter((r) => !r.front).map(draw).join('')}</g>`, { sd: 2, k: 1.2, box: [10, -16, 280, 216] });
    // the mage, arms up like a conductor, hair streaming up in the draught
    const mage = U(
      taper([[-4, -40], [-8, -20], [-11, -2]], [7.4, 6, 5]),
      taper([[4, -40], [8, -20], [11, -2]], [7.4, 6, 5]),
      ell(-12.5, -0.5, 5.2, 2.2), ell(12.5, -0.5, 5.2, 2.2),
      blob([[-7, -60], [7, -60], [11, -48], [18, -33], [11, -35], [5, -31], [0, -37], [-5, -31], [-11, -35], [-18, -33], [-11, -48]], 5),
      taper([[0, -56], [0, -70], [0, -82]], [12, 12.5, 17]),
      ell(-8.5, -80, 5.4, 4.2, -15), ell(8.5, -80, 5.4, 4.2, 15),
      taper([[0, -84], [0, -90]], 4.6),
      ell(0.6, -95, 5.6, 6.6),
      taper([[-1, -100], [-5, -108], [-12, -113], [-17, -120], [-18, -128]], [8, 7, 5, 3, 0.5]),
      taper([[2, -101], [1, -109], [-3, -116], [-4, -123]], [5, 4, 2.4, 0.4]),
      taper([[-11, -81], [-21, -92], [-25, -106]], [5.4, 4.4, 3.8]),
      taper([[11, -81], [22, -91], [29, -104]], [5.4, 4.4, 3.8]),
      ell(-26, -109, 3, 3.6, -15), ell(30, -107, 3, 3.6, 20),
      taper([[-26, -112], [-27, -117]], [1.6, 0.6]), taper([[-24, -112], [-22, -117]], [1.6, 0.6]), taper([[-28, -110], [-31.5, -113]], [1.6, 0.6]),
      taper([[30, -110], [30.5, -116]], [1.6, 0.6]), taper([[32, -109], [35, -114]], [1.6, 0.6]), taper([[28, -110], [26, -115]], [1.6, 0.6]),
    );
    s.figure(`<path d="${mv(mage, 150, 188)}"/>`, { fill: '#120504', rim: '#ffb04a', offsets: [[-1.2, -0.6], [1.2, -0.6], [0, -1.3]], rimOp: 0.95, shade: 0.45, edge: 0.3, light: [0, -1] });
    s.bloom(`<g data-part="spiralF">${runs.filter((r) => r.front).map(draw).join('')}</g>`, { sd: 2.4, k: 1.4, box: [10, -16, 280, 216] });
    s.motes({ seed: 9302, n: 26, x: [30, 270], y: [10, 190], r: [0.4, 1.2], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [3, 7] });
    return s.svg();
  },

  // A single bright drop falls from a leaf into a still forest pool; rings
  // of light run out across the water to the reeds at its edges.
  ripple(s) {
    fin(s, 'tide');
    const p = PAL.tide;
    s.rect(s.lin([[0, '#a6d8d2'], [0.2, '#5aa3a6'], [0.42, '#22606c'], [0.5, '#163f4c']]));
    s.glow(150, -24, 160, '#effdf6', 0.75);
    s.shafts({ cx: 150, cy: -50, n: 8, from: 66, to: 114, len: 230, spread: 2.4, color: '#e9fcf6', op: 0.26, seed: 9401, sd: 2.4 });
    // the far bank, soft in the evening air, and its reflection
    const bank = woods({ seed: 9402, base: 100, top: 48, r0: 10, r1: 20 });
    s.layer(bank, '#1f5560', { blur: 0.8 });
    s.haze(72, 102, '#8ccac6', 0.3);
    s.path(U(reeds(9403, 0, 70, 101, [7, 19], { gap: [2, 6], heads: 0.08, w: [1.2, 2] }), reeds(9408, 112, 128, 101, [5, 11], { gap: [2, 5], heads: 0, w: [1, 1.6] }),
      reeds(9409, 186, 250, 101, [8, 21], { gap: [2, 7], heads: 0.08, w: [1.2, 2] })), '#123a44');
    s.path('M-10,100H310V214H-10Z', s.lin([[0, '#3d7d84'], [0.06, '#16424e'], [0.45, '#0a2732'], [1, '#03111a']]));
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><rect x="-5" y="100" width="310" height="116"/></clipPath>`);
    s.add(`<g clip-path="url(#${cid})"><path d="${bank}" fill="#0c303a" opacity=".55" transform="matrix(1 0 0 -1 0 200)"/></g>`);
    s.add('<path d="M-10,100.6H310" stroke="#8fd0cc" stroke-width=".8" opacity=".45"/>');
    // the rings, running out from under the drop
    const ix = 150, iy = 142, flat = 0.21;
    const ringFill = s.linU(0, iy - 28, 0, iy + 28, [[0, '#f4fffc'], [0.5, '#d6f8f7', 0.9], [1, '#9fdbe2', 0.6]]);
    let rings = '';
    [7, 15, 26, 40, 57, 77, 100, 126].forEach((r, i) => {
      const o = 1 - i * 0.1, w = 2 - i * 0.18, ry = f1(r * flat);
      rings += `<ellipse cx="${ix}" cy="${iy}" rx="${r}" ry="${ry}" stroke-width="${f1(w * 2.6)}" opacity="${f1(o * 0.25)}"/>` +
        `<ellipse cx="${ix}" cy="${iy}" rx="${r}" ry="${ry}" stroke-width="${f1(w)}" opacity="${f1(o)}"/>`;
    });
    s.glow(ix, iy, 60, '#c6f4f6', 0.35);
    s.add(`<ellipse cx="${ix}" cy="${iy + 26}" rx="9" ry="30" fill="${s.rad([[0, '#c6f4f6', 0.3], [1, '#c6f4f6', 0]])}"/>`);
    s.glow(ix, iy - 10, 24, '#e9fffb', 0.8, 'breathe');
    const drop = (x, y) => `M${x},${y - 8}C${x + 1.4},${y - 4.6} ${x + 3.8},${y - 1.2} ${x + 3.8},${y + 1.4}A3.8,3.8 0 0 1 ${x - 3.8},${y + 1.4}C${x - 3.8},${y - 1.2} ${x - 1.4},${y - 4.6} ${x},${y - 8}Z`;
    s.bloom(`<g data-part="rings" fill="none" stroke="${ringFill}">${rings}</g><g data-part="drop">` +
      `<path d="${taper([[ix, 90], [ix, 110], [ix, 122]], [0.2, 1, 2])}" fill="${s.linU(0, 90, 0, 122, [[0, '#e9fffb', 0], [1, '#e9fffb', 0.7]])}"/>` +
      `<path d="${drop(ix, 127)}" fill="#f6fffe"/><ellipse cx="${ix}" cy="${iy}" rx="5" ry="1.4" fill="#f4fffc"/></g>`, { sd: 1.6, k: 1.3, box: [0, 84, 300, 100] });
    // lily pads riding the rings
    const pad = (x, y, rx, ry, a) => `<path d="M${x},${y}L${f1(x + rx * Math.cos(rad(a - 14)))},${f1(y + ry * Math.sin(rad(a - 14)))}A${rx},${ry} 0 1 1 ${f1(x + rx * Math.cos(rad(a + 14)))},${f1(y + ry * Math.sin(rad(a + 14)))}Z"/>`;
    s.figure(pad(84, 162, 14, 3.8, 60) + pad(212, 124, 10, 2.6, 120) + pad(236, 178, 17, 4.6, 110), { fill: '#0a2a2f', rim: '#7fc2c4', offsets: [[0, -0.8]], rimOp: 0.7 });
    // reeds standing in the shallows either side
    s.figure(`<path d="${U(reeds(9404, -12, 42, 166, [54, 104], { gap: [3, 6], lean: 0.08, heads: 0.3, w: [2, 3.4] }))}"/>`, { fill: '#04131a', rim: p.rim, offsets: [[0.6, -0.8]], rimOp: 0.45 });
    s.figure(`<path d="${U(reeds(9405, 258, 312, 164, [50, 100], { gap: [3, 6], lean: -0.08, heads: 0.3, w: [2, 3.4] }))}"/>`, { fill: '#04131a', rim: p.rim, offsets: [[-0.6, -0.8]], rimOp: 0.45 });
    // the branch it fell from, its last leaf hanging right above the pool
    const branch = U(taper([[-12, 8], [40, 14], [96, 14], [150, 20]], [7, 5, 3.4, 1.6]),
      leafAt(30, 13, 70, 24, 0.4), leafAt(62, 15, 110, 26, 0.4), leafAt(92, 14, 60, 22, 0.42), leafAt(120, 17, 112, 22, 0.42), leafAt(150, 19, 88, 24, 0.4));
    s.figure(`<path d="${branch}"/>`, { fill: '#08202a', rim: '#d6f6f2', offsets: [[0, -1]], rimOp: 0.6 });
    s.motes({ seed: 9406, n: 14, x: [40, 260], y: [90, 190], r: [0.4, 1], fill: '#c6f4f6', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.4, 0.9] });
    s.add(particles({ seed: 9407, n: 10, x: [60, 240], y: [128, 176], r: [0.4, 0.9], fill: '#effefc', cls: 'twinkle', t: [1.5, 3.5], op: [0.4, 1] }));
    return s.svg();
  },

  // An orchard at harvest under a huge low sun; the old trees bow with
  // fruit, and a young tree among them glows as it grows.
  'season-of-plenty'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#e2cf96'], [0.22, '#f2dfa4'], [0.42, '#f8e4a6']]));
    // the sun, sitting huge on the far hills
    const sx = 150, sy = 82;
    s.glow(sx, sy, 180, '#ffe9a8', 0.9);
    s.shafts({ cx: sx, cy: sy, n: 18, from: -180, to: 0, len: 300, spread: 2, color: '#fff6d4', op: 0.28, seed: 9501 });
    s.glow(sx, sy, 72, '#fff3c4', 0.8);
    s.add(`<circle cx="${sx}" cy="${sy}" r="46" fill="${s.radU(sx, sy, 46, [[0, '#fffcec'], [0.6, '#fff3c6'], [1, '#ffe08e']])}"/>`);
    s.layer(ridge({ seed: 9502, base: 92, amp: 9, freq: 2.2 }), '#d3c389', { blur: 0.6 });
    s.haze(74, 98, '#fff3cc', 0.5);
    // the orchard falling away below us, row on row
    s.path('M-10,214L-10,94L310,94L310,214Z', s.lin([[0, '#d6c587'], [0.22, '#b2a660'], [0.6, '#7b7d3e'], [1, '#3f441e']]));
    const R = rng(9503);
    for (const [y, h, c] of [[98, 7, '#c3b67b'], [105, 10, '#ada565'], [115, 14, '#959352'], [130, 19, '#7c8044'], [150, 26, '#636c36']]) {
      let crowns = '', trunks = '';
      const fruit = [];
      for (let x = -10 + R() * h; x < 314; x += h * (1.25 + R() * 0.3)) {
        if (h > 18 && Math.abs(x - 150) < h * 1.3) continue;
        const b = y + R() * 2;
        crowns += dots([[x, b - h * 0.68, h * 0.3], [x - h * 0.2, b - h * 0.6, h * 0.2], [x + h * 0.21, b - h * 0.6, h * 0.2]]);
        trunks += `M${f1(x - h * 0.045)},${f1(b)}h${f1(h * 0.09)}v${f1(-h * 0.5)}h${f1(-h * 0.09)}Z`;
        if (h > 13) fruit.push([x - h * 0.16, b - h * 0.55, h * 0.05], [x + h * 0.12, b - h * 0.66, h * 0.05], [x + h * 0.26, b - h * 0.5, h * 0.045]);
      }
      s.path(trunks + crowns, c);
      if (fruit.length) s.path(dots(fruit), '#e0a040', 'opacity=".8"');
    }
    // the young tree, glowing as it grows
    s.glow(150, 124, 80, '#eaff9a', 0.45, 'breathe');
    s.add(`<ellipse cx="150" cy="182" rx="44" ry="6" fill="${s.rad([[0, '#f6ffc8', 0.85], [0.5, '#e6f78f', 0.4], [1, '#e6f78f', 0]])}"/>`);
    const young = U(taper([[150, 184], [149, 160], [151, 138], [150, 112]], [6.6, 4.8, 3.6, 2]),
      taper([[150, 154], [140, 144], [130, 139]], [2.8, 1.8, 0.7]), taper([[150, 146], [161, 134], [171, 129]], [2.6, 1.7, 0.6]),
      taper([[150, 132], [141, 120], [134, 111]], [2.2, 1.4, 0.5]), taper([[150, 128], [158, 116], [163, 106]], [2.2, 1.4, 0.5]));
    s.figure(`<path d="${young}"/>`, { fill: '#2a3818', rim: '#f6ffc8', offsets: [[0.9, -0.6], [-0.9, -0.6]], rimOp: 0.9 });
    let leaves = '';
    for (const [x, y, n, a0] of [[130, 139, 5, 185], [171, 129, 5, -8], [134, 111, 5, -150], [163, 106, 5, -36], [150, 110, 5, -90], [140, 146, 3, 150], [160, 136, 3, 20], [144, 124, 3, -170], [156, 120, 3, -10]]) {
      for (let i = 0; i < n; i++) leaves += leafAt(x, y, a0 + (i - (n - 1) / 2) * 30 + (R() - 0.5) * 16, 10 + R() * 4, 0.44);
    }
    s.bloom(`<path d="${leaves}" fill="${s.radU(150, 122, 44, [[0, '#fbffd8'], [0.6, '#eefaa8'], [1, '#cfe97a']])}"/>` +
      `<path d="${dots([[150, 97, 2], [134, 103, 1.5], [165, 98, 1.5], [125, 137, 1.5], [176, 126, 1.5]])}" fill="#ffffff"/>`, { sd: 1.6, k: 1.35, box: [100, 76, 100, 92] });
    // the old trees at either hand, their boughs bowed down under the fruit
    const crown = (list) => list.map(([x, y, r]) => ell(x, y, r * 1.1, r, 0, 16));
    const fringe = (list) => list.flatMap(([x, y], i) => [leafAt(x, y, 70 - (i % 2) * 8, 10, 0.42), leafAt(x, y, 116 + (i % 2) * 8, 9, 0.42)]);
    const oldL = U(taper([[16, 216], [24, 164], [17, 120], [26, 72], [40, 32], [52, -8]], [28, 22, 20, 16, 14, 12]),
      taper([[30, 52], [62, 50], [88, 62], [104, 84], [110, 106]], [12, 9, 6.5, 4, 1.4]),
      taper([[22, 98], [46, 96], [66, 108], [78, 128]], [9, 7, 4.5, 1.4]),
      taper([[70, 54], [80, 44], [92, 40]], [3.4, 2.4, 1]),
      crown([[-8, 6, 32], [28, -8, 28], [66, -6, 24], [96, 2, 16], [2, 40, 20], [46, 22, 18],
        [62, 42, 13], [78, 47, 9], [92, 34, 8], [94, 62, 8], [44, 86, 11], [60, 92, 8]]),
      fringe([[72, 53], [86, 60], [98, 74], [106, 92], [110, 106], [54, 98], [66, 107], [74, 120]]));
    const oldR = mv(flipX(oldL, 150), 6, 5);
    s.figure(`<path d="${oldL}"/><path d="${oldR}"/>`, { fill: '#24301a', rim: '#fff0b8', offsets: [[0.8, -1], [-0.8, -1]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0, -1] });
    const bark = 'M14,206C18,186 14,170 19,154M26,182C30,166 26,150 29,136M14,140C10,124 16,110 13,96M24,110C22,96 28,84 26,72M30,66C34,54 38,42 40,32';
    s.add(`<path d="${bark}${mv(flipX(bark, 150), 6, 5)}" fill="none" stroke="#3c4a2a" stroke-width="1.2" opacity=".8"/>`);
    // fruit hanging in bunches under the boughs, each on its stalk
    const bunches = [[60, 58, 3], [84, 66, 2], [99, 84, 2], [107, 102, 1], [46, 102, 2], [64, 110, 2], [74, 126, 1], [28, 50, 1], [90, 16, 2], [50, 34, 1], [70, 26, 1]];
    const fruit = [];
    let stalks = '';
    for (const [x, y, n] of bunches) {
      for (const side of [1, -1]) {
        for (let i = 0; i < n; i++) {
          const by = side > 0 ? y : y + 5;
          const fx = (side > 0 ? x : 306 - x) + (i - (n - 1) / 2) * 8.5 + (R() - 0.5) * 2, r = 3.5 + R() * 0.9, fy = by + 6 + (i % 2) * 5 + R() * 2;
          fruit.push([fx, fy, r, side]);
          stalks += `M${f1(fx)},${f1(by)}L${f1(fx)},${f1(fy - r)}`;
        }
      }
    }
    s.path(stalks, 'none', 'stroke="#24301a" stroke-width="1.1"');
    s.path(dots(fruit), '#d98a2e');
    s.path(dots(fruit.map(([x, y, r, side]) => [x + side * r * 0.3, y - r * 0.32, r * 0.5])), '#ffd27a', 'opacity=".9"');
    // a basket of the harvest at our feet
    s.figure(`<path d="${U(poly([[30, 216], [27, 196], [80, 196], [77, 216]]), ell(53.5, 196, 27, 3.6))}"/><path d="M32,196C34,174 72,174 75,196" fill="none" stroke-width="2.6"/>`,
      { fill: '#1e2612', rim: '#fff0b8', offsets: [[0.8, -0.8]], rimOp: 0.8 });
    const heap = [[35, 193, 4.6], [45, 191, 5], [55, 190, 5.2], [65, 191, 4.8], [73, 193, 4.4], [41, 186, 4.4], [51, 184, 4.8], [61, 185, 4.6], [56, 179, 4.2]];
    s.path(dots(heap), '#c97a28');
    s.path(dots(heap.map(([x, y, r]) => [x + r * 0.3, y - r * 0.32, r * 0.5])), '#ffcf70', 'opacity=".85"');
    s.motes({ seed: 9504, n: 18, x: [112, 188], y: [88, 184], r: [0.4, 1.1], fill: '#efffb0', hot: '#ffffff', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 9505, n: 12, x: [30, 270], y: [20, 180], r: [0.6, 1.3], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A hooded ferryman poles a narrow boat across a misty river at night,
  // his lantern hung at the bow; a pale spirit rises out of the wake.
  'lantern-ferryman'(s) {
    fin(s, 'umbral');
    s.rect(s.lin([[0, '#0a0714'], [0.4, '#1d1533'], [0.6, '#3c2c5c'], [0.66, '#46366a']]));
    s.add(particles({ seed: 9601, n: 28, x: [0, W], y: [0, 100], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moon, low behind him
    const mx = 116, my = 64;
    s.glow(mx, my, 120, '#c9b8f2', 0.42);
    s.add(`<circle cx="${mx}" cy="${my}" r="22" fill="#ece4fa"/><circle cx="${mx - 7}" cy="${my - 6}" r="4" fill="#d4c8ea" opacity=".6"/><circle cx="${mx + 8}" cy="${my + 8}" r="2.8" fill="#d4c8ea" opacity=".5"/>`);
    // the far bank: low hills, dead trees, reeds, all in the mist
    s.layer(ridge({ seed: 9602, base: 136, amp: 14, freq: 2 }) + U(
      taper([[34, 136], [36, 112], [30, 96]], [4, 2.6, 1]), taper([[35, 116], [44, 106]], [2, 0.6]), taper([[33, 106], [24, 98]], [1.8, 0.5]),
      taper([[264, 134], [262, 104], [268, 88]], [4.4, 2.8, 1]), taper([[263, 110], [252, 100]], [2, 0.6]), taper([[265, 98], [274, 90]], [1.8, 0.5]),
      reeds(9603, 150, 240, 135, [6, 14], { gap: [3, 6], heads: 0.15, w: [1, 1.6] })), '#2a2048', { blur: 0.8 });
    s.haze(112, 138, '#7a62b0', 0.32);
    // the river, the moon's road across it
    s.path('M-10,134H310V214H-10Z', s.lin([[0, '#3a2c58'], [0.08, '#1e1734'], [0.5, '#110c1e'], [1, '#06040a']]));
    s.add(`<g fill="#ddd0f6">${[[mx, 140, 30, 0.45], [mx - 2, 145, 22, 0.35], [mx + 2, 151, 34, 0.28], [mx - 1, 172, 18, 0.2], [mx + 1, 180, 26, 0.16], [mx, 190, 14, 0.12]].map(([x, y, w, o]) =>
      `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`);
    s.fog(140, '#8c78b8', 0.3);
    // the spirit rising out of the wake, reaching after the boat
    const ghost = U(ell(52, 110, 5.4, 6.4, 24),
      taper([[48, 116], [46, 128], [45, 140], [46, 152], [42, 163], [34, 172]], [7, 14, 14, 11, 5, 0.6]),
      taper([[44, 120], [37, 130], [34, 142]], [6, 4, 0.6]),
      taper([[51, 121], [60, 120], [69, 116], [78, 111]], [5, 4, 2.6, 0.4]),
      taper([[49, 127], [58, 131], [67, 131], [74, 128]], [4.6, 3.6, 2.2, 0.4]));
    s.glow(50, 132, 46, '#b8a6e2', 0.42, 'breathe');
    s.blur(`<path d="${ghost}" fill="#c9b8f2" opacity=".8"/>`, 3);
    s.path(ghost, s.linU(0, 104, 0, 174, [[0, '#f6f1ff', 0.95], [0.4, '#e2d6fa', 0.8], [1, '#b8a6e2', 0]]));
    // the wake behind the boat, and the rings where the spirit breaks the water
    s.add('<g fill="none" stroke="#a898d8" stroke-width=".9" opacity=".5"><path d="M62,158C46,154 26,152 -6,154M62,162C46,166 28,174 -4,182"/>' +
      '<ellipse cx="40" cy="172" rx="16" ry="3"/><ellipse cx="40" cy="173" rx="27" ry="5" opacity=".5"/></g>');
    // the boat, its prow curling up into the hook the lantern hangs from; the
    // ferryman: a deep hood, a long robe ragged at the back, both hands on the
    // pole as he leans into the push
    const hull = U(poly([...spline([[58, 145], [66, 151], [100, 154], [160, 154.5], [204, 152], [226, 148]], 5), ...spline([[230, 152], [210, 159], [160, 163], [110, 163], [78, 160], [62, 154], [56, 148]], 5)]),
      taper([[222, 152], [232, 142], [238, 128], [237, 116], [243, 110], [249, 112]], [10, 7, 5, 4, 3, 2]),
      taper([[60, 150], [54, 144], [53, 138]], [6, 4, 2]));
    const pole = taper([[98.6, 177], [132, 112], [176, 30]], [2.4, 2.2, 2]);
    const man = U(
      blob([[103, 80], [117, 79], [123, 92], [125, 110], [127, 130], [130, 153], [118, 155], [106, 155], [98, 154], [90, 150], [84, 146], [90, 142], [80, 136], [90, 130], [86, 122], [96, 112], [98, 94]], 5),
      blob([[100, 58], [109, 48], [120, 50], [127, 60], [128, 74], [121, 84], [106, 85], [99, 72]], 5),
      taper([[102, 56], [94, 58], [87, 64]], [7, 4, 0.6]),
      taper([[115, 84], [128, 91], [137, 96]], [7, 5.6, 4.4]), ell(138.5, 97, 3.4, 2.8, -30),
      taper([[118, 87], [131, 104], [129, 112]], [7.4, 6, 4.6]), ell(129, 114, 3.4, 2.8, -30),
    );
    s.figure(`<path d="${hull}"/><path d="${man}"/><path d="${pole}"/>`, { fill: '#0b0812', rim: '#cdb6f4', offsets: [[-1, -0.8], [1, -0.8], [0, -1.2]], rimOp: 0.85, shade: 0.45, edge: 0.3, light: [0.3, -1] });
    s.add('<path d="M70,152.5C110,157 170,157 222,150" fill="none" stroke="#3a2c58" stroke-width="1" opacity=".8"/>');
    s.add('<g fill="none" stroke="#a898d8" stroke-width=".8" opacity=".55"><ellipse cx="99" cy="177" rx="8" ry="1.6"/><ellipse cx="99" cy="177.5" rx="15" ry="2.8" opacity=".5"/></g>');
    s.glow(123, 67, 9, '#b07cff', 0.75);
    s.add('<g fill="#efe2ff"><circle cx="121.6" cy="67" r=".9"/><circle cx="125" cy="67.4" r=".8"/></g>');
    // the lantern
    const lx = 249, ly = 124;
    s.glow(lx, ly, 70, '#b98cff', 0.5);
    s.glow(lx, ly, 26, '#efe2ff', 0.8, 'breathe');
    s.add(`<g fill="#e9dcff">${[[lx, 158, 14, 0.5], [lx + 1, 164, 10, 0.4], [lx - 1, 171, 16, 0.3], [lx, 180, 8, 0.24], [lx + 1, 190, 12, 0.16]].map(([x, y, w, o]) =>
      `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`);
    s.bloom(`<path d="M${lx},112V117" stroke="#0b0812" stroke-width="1.2"/><path d="M${lx - 5},117H${lx + 5}L${lx + 3.6},120H${lx - 3.6}ZM${lx - 3.6},131H${lx + 3.6}L${lx + 5},134H${lx - 5}Z" fill="#0b0812"/>` +
      `<rect x="${lx - 3.6}" y="120" width="7.2" height="11" rx="1" fill="#f6eeff"/><path d="M${lx},120V131" stroke="#6a4fa8" stroke-width=".8"/>`, { sd: 2, k: 1.5, box: [lx - 30, 96, 60, 60] });
    // mist over the water, reeds at the near corners
    s.fog(166, '#9a86c8', 0.28).fog(186, '#8c78b8', 0.34);
    s.path(U(reeds(9604, -12, 22, 218, [30, 64], { gap: [3, 5], lean: 0.1, heads: 0.3, w: [2, 3.2] }), reeds(9605, 278, 312, 218, [34, 70], { gap: [3, 5], lean: -0.1, heads: 0.3, w: [2, 3.2] })), '#06040a');
    s.motes({ seed: 9606, n: 16, x: [20, 280], y: [90, 190], r: [0.35, 0.9], fill: '#c9b0f4', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.35, 0.85] });
    return s.svg();
  },

  // A little fern on the forest floor bursts all at once into a towering
  // flower; petals and light blow out of its heart.
  'wild-bloom'(s) {
    fin(s, 'verdant');
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#4e6844'], [0.3, '#8ea677'], [0.62, '#d9dfae'], [1, '#f0eec6']]));
    const hx = 150, hy = 62;
    s.glow(hx, hy, 180, '#f6ffcf', 0.7);
    s.shafts({ cx: hx, cy: hy, n: 22, from: -180, to: 180, len: 260, spread: 2.2, color: '#fbffdc', op: 0.3, seed: 9701, sd: 2.2 });
    s.layer(woods({ seed: 9702, base: 168, top: 128, r0: 8, r1: 15 }), '#9db383', { blur: 0.7 });
    s.haze(140, 172, '#f4f6d2', 0.35);
    s.path(woods({ seed: 9703, base: 188, top: 168, r0: 7, r1: 12 }), '#6f8a56');
    s.path('M-10,214L-10,186C50,182 110,184 150,185C200,186 260,182 310,185L310,214Z', s.lin([[0, '#34472a'], [1, '#141c0c']]));
    s.add(`<ellipse cx="150" cy="190" rx="80" ry="7" fill="${s.rad([[0, '#fbffd8', 0.8], [0.5, '#e6f78f', 0.3], [1, '#e6f78f', 0]])}"/>`);
    s.add('<ellipse cx="150" cy="190" rx="56" ry="5.4" fill="none" stroke="#f2ffc0" stroke-width="1" opacity=".35"/>');
    // the plant: the little fern it was, still at its foot, and the stalk that
    // shot up out of it, leaves flung open, tendrils still whipping
    const plant = U(
      taper([[150, 196], [146, 172], [153, 146], [147, 118], [151, 92], [150, 74]], [12, 10, 8.5, 7, 6, 5]),
      leafAt(147, 174, -164, 54, 0.32), leafAt(149, 164, -18, 58, 0.31),
      leafAt(152, 142, -150, 46, 0.34), leafAt(151, 134, -32, 46, 0.34),
      leafAt(148, 114, -138, 34, 0.38), leafAt(149, 108, -44, 34, 0.38),
      tendril(150, 124, -170, 34, { bend: 60, w: 2.6, curl: 5 }), tendril(151, 150, -6, 38, { bend: -70, w: 2.6, curl: 5 }),
      taper([[149, 124], [128, 116], [110, 110], [100, 104]], [3.4, 2.6, 2, 1.6]), taper([[151, 112], [172, 104], [190, 98], [198, 92]], [3.4, 2.6, 2, 1.6]),
      lens(141, 72, 14, 125, 0.4), lens(159, 72, 14, 55, 0.4), lens(150, 76, 12, 90, 0.42),
      frond(146, 190, -168, 30, { bend: 26, n: 6 }), frond(154, 190, -12, 32, { bend: -26, n: 6 }),
      frond(148, 190, -128, 24, { bend: 30, n: 5 }), frond(152, 190, -56, 22, { bend: -34, curl: 4, n: 4 }),
    );
    s.figure(`<path d="${plant}"/>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1.2], [-0.9, -0.6], [0.9, -0.6]], rimOp: 0.9, shade: 0.4, edge: 0.3, light: [0, -1] });
    // the bloom: a great wheel of petals, its heart blazing; two buds
    // opening on the side shoots
    const petals = [], inner = [];
    for (let i = 0; i < 10; i++) {
      const a = -90 + i * 36 + 6;
      petals.push(lens(hx + Math.cos(rad(a)) * 25, hy + Math.sin(rad(a)) * 25, 44, a, 0.44));
      const b = a + 18;
      inner.push(lens(hx + Math.cos(rad(b)) * 13, hy + Math.sin(rad(b)) * 13, 24, b, 0.5));
    }
    const buds = [];
    for (const [bx, by] of [[100, 100], [199, 88]]) {
      for (let i = 0; i < 6; i++) { const a = i * 60 + 10; buds.push(lens(bx + Math.cos(rad(a)) * 6, by + Math.sin(rad(a)) * 6, 12, a, 0.5)); }
    }
    const pf = s.radU(hx, hy, 50, [[0, '#ffffff'], [0.35, '#fbf8dc'], [0.8, '#efe6b0'], [1, '#d8cf86']]);
    s.glow(hx, hy, 70, '#f2ffb8', 0.6, 'breathe');
    s.glow(100, 100, 18, '#f2ffb8', 0.6).glow(199, 88, 18, '#f2ffb8', 0.6);
    const pid = s.uid('pt');
    s.defs.push(`<path id="${pid}" d="${U(petals)}"/>`);
    s.bloom(`<use href="#${pid}" fill="${pf}"/><use href="#${pid}" fill="none" stroke="#b8ad66" stroke-width=".7" opacity=".7"/>` +
      `<path d="${U(inner)}" fill="#fffef2"/><path d="${U(buds)}" fill="#fbf6d6"/>` +
      `<circle cx="${hx}" cy="${hy}" r="9" fill="#fbffe0"/><circle cx="${hx}" cy="${hy}" r="4.4" fill="#ffffff"/><path d="${dots([[100, 100, 2.4], [199, 88, 2.4]])}" fill="#ffffff"/>`, { sd: 2, k: 1.35, box: [70, 0, 160, 130] });
    // petals flung out by the burst
    const R = rng(9704);
    let flung = '';
    for (let i = 0; i < 16; i++) {
      const a = -180 + (360 * i) / 16 + (R() - 0.5) * 16, d = 62 + R() * 66, l = 6 + R() * 6;
      const x = hx + Math.cos(rad(a)) * d, y = hy + Math.sin(rad(a)) * d * 0.85;
      if (y > 178 || y < 4) continue;
      flung += `<path class="float" style="--t:${f1(4 + R() * 4)}s;--d:-${f1(R() * 4)}s" d="${lens(x, y, l, a + (R() - 0.5) * 60, 0.46)}" fill="#fbf6d6" opacity="${f1(0.75 + R() * 0.25)}"/>`;
    }
    s.add(flung);
    s.motes({ seed: 9705, n: 24, x: [60, 240], y: [8, 150], r: [0.4, 1.1], fill: '#f2ffb8', hot: '#ffffff', cls: 'float', t: [4, 8], op: [0.5, 1] });
    // clods of earth thrown up round its foot
    s.add([[118, 176, 2.6, 20], [184, 173, 2.4, -30], [131, 166, 1.8, 50], [170, 163, 2, -10], [107, 184, 2, 70], [195, 181, 1.8, 0]].map(([x, y, r, a], i) =>
      `<path class="fall" style="--d:${(-i * 0.3).toFixed(1)}s" d="${rot(poly([[x - r, y], [x - r * 0.3, y - r * 0.9], [x + r, y - r * 0.4], [x + r * 0.6, y + r * 0.7], [x - r * 0.5, y + r * 0.8]]), x, y, a)}" fill="#1e2412"/>`).join(''));
    // its old neighbours, still small, and dark ferns at the front
    s.path(U(frond(54, 190, -150, 20, { bend: 30, n: 5, lp: 2 }), frond(58, 190, -40, 22, { bend: -30, n: 5, lp: 2 }), frond(56, 190, -96, 16, { bend: 20, curl: 3, n: 3, lp: 2 }),
      frond(244, 190, -144, 22, { bend: 30, n: 5, lp: 2 }), frond(248, 190, -36, 20, { bend: -30, n: 5, lp: 2 }), frond(246, 190, -86, 16, { bend: -20, curl: 3, n: 3, lp: 2 })), '#2c3d20');
    s.path(U(frond(-6, 214, -60, 54, { bend: 36, n: 7, w: 3.4 }), frond(4, 214, -84, 46, { bend: 30, n: 6, w: 3 }), frond(306, 214, -120, 54, { bend: -36, n: 7, w: 3.4 }), frond(296, 214, -96, 46, { bend: -30, n: 6, w: 3 })), '#121b0c');
    return s.svg();
  },
};
