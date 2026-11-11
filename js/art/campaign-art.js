// The campaign's pictures, in the cards' "lantern and paper" style (see
// scenes.js): World 1's map, from the harbor at sunset up to the Wall under
// the moon, and its five places. Each is a tall diorama drawn with the kit,
// baked once into a picture by tools/bake-campaign.mjs (filters and all),
// with its moving parts (grass in the wind, motes, smoke, water glints, a
// lighthouse's beam) kept apart as a light overlay that stays live, and the
// spots where the levels (or a place's three rounds) sit.
//
// An entry: { w, h, draw(s, live) → { spots } }. `s` is a kit Scene of that
// size (static, baked); `live` collects the overlay (no filters, only
// transform and opacity move: see .art-svg classes in card.css).

import { Scene, blob, line, particles, pines, poly, pt, ridge, rng, spline, taper } from './kit.js';

// ── small tools (as in scenes/ultra-d.js) ───────────────────────────
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const rad = (deg) => (deg * Math.PI) / 180;
function ell(cx, cy, rx, ry = rx, deg = 0, n = 22) {
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a), pts = [];
  for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry; pts.push([cx + x * c - y * sn, cy + x * sn + y * c]); }
  return poly(pts);
}
// many polygons as one path, all wound the same way (overlaps merge)
function U(...ds) {
  return ds.flat(Infinity).join('').split('M').filter((sp) => sp.trim()).map((sp) => {
    const pts = sp.replace(/Z\s*$/, '').split('L').map((q) => q.split(',').map(Number));
    let a = 0;
    for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
    if (a < 0) pts.reverse();
    return 'M' + pts.map(pt).join('L') + 'Z';
  }).join('');
}
const dots = (list) => list.map(([x, y, r]) => `M${f1(x - r)},${f1(y)}a${f1(r)},${f1(r)} 0 1,0 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1,0 ${f1(-2 * r)},0`).join('');
const quad = (x, y, w, h) => poly([[x, y], [x + w, y], [x + w, y + h], [x, y + h]]);
// a smooth edge closed off far below
const ledge = (pts, bottom) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);
// a gull: two arcs
const gull = (x, y, k = 1, deg = 0) => {
  const d = taper([[-7, 1], [-3.5, -1.6], [0, 0.6]], [0.8, 1.6, 1], { per: 4 }) + taper([[0, 0.6], [3.5, -1.6], [7, 1]], [1, 1.6, 0.8], { per: 4 });
  const a = rad(deg), c = Math.cos(a), sn = Math.sin(a);
  return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, px, py) => `${f1(x + (px * c - py * sn) * k)},${f1(y + (px * sn + py * c) * k)}`);
};
// a house: a box and a pitched roof (and a chimney), as one cut-out
const house = (x, base, w, h, roof = 0.55, chim = false) => U(quad(x, base - h, w, h),
  poly([[x - 1.2, base - h + 0.4], [x + w / 2, base - h - w * roof], [x + w + 1.2, base - h + 0.4]]),
  chim ? quad(x + w * 0.68, base - h - w * roof * 0.9, w * 0.13, w * roof * 0.55) : '');

// The overlay: what moves. Gradients of its own; motes and stars as kit particles.
function Live(w, h, pre = 'lv') {
  const defs = [], body = [];
  let k = 0;
  return {
    body,
    rad(stops) {
      const id = `${pre}-${k++}`; // unique per picture: a map and a place can share a page
      defs.push(`<radialGradient id="${id}">${stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}"${op !== 1 ? ` stop-opacity="${op}"` : ''}/>`).join('')}</radialGradient>`);
      return `url(#${id})`;
    },
    add(...s) { body.push(...s); return this; },
    // glowing motes (moths, fireflies, lantern sparks)
    motes(o) { const g = this.rad([[0, o.hot || '#ffffff'], [0.3, o.fill, 0.95], [0.6, o.fill, 0.3], [1, o.fill, 0]]); return this.add(particles({ ...o, r: (o.r || [0.6, 1.4]).map((x) => x * 2.4), fill: g })); },
    // grass and reeds bending in the wind: tufts of blades, each tuft its own beat
    grass({ seed, x0, x1, base, depth = 3, h = [6, 12], n = 14, fill, lit = null }) {
      const R = rng(seed);
      for (let i = 0; i < n; i++) {
        const x = x0 + R() * (x1 - x0), y = base + R() * depth, hh = (h[0] + R() * (h[1] - h[0])) * (depth > 3 ? 0.75 + 0.25 * ((y - base) / depth) : 1);
        let d = '';
        for (let b = 0; b < 5; b++) {
          const bx = x + (b - 2) * 1.3, lean = (R() - 0.5) * 4;
          d += taper([[bx, y], [bx + lean * 0.4, y - hh * 0.55], [bx + lean, y - hh * (0.75 + R() * 0.35)]], [1.3, 0.8, 0.1], { per: 3 });
        }
        const t = 2.8 + R() * 1.8, dl = -R() * t;
        body.push(`<g class="sway" style="--t:${f1(t)}s;--d:${f1(dl)}s"><path d="${d}" fill="${fill}"/>${lit ? `<path d="${d}" fill="${lit}" opacity=".35" transform="translate(-.4 -.5)"/>` : ''}</g>`);
      }
      return this;
    },
    svg() { return `<svg class="art-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${defs.join('')}</defs>${body.join('')}</svg>`; },
  };
}

// ── World 1: The Harbor Road ───────────────────────────────────────
// 300 × 760, read bottom to top: the harbor and its market at sunset, the
// cliffs over the bay, the pass through the mountains at dusk, the high
// fields under the moon, and the Wall along its ridge at the top.
function harborRoad(s, live) {
  const w = s.w, h = s.h;
  const ROAD = [[150, 742], [128, 714], [96, 652], [118, 600], [178, 556], [204, 520], [168, 470], [122, 432], [112, 396], [134, 352], [178, 300], [192, 262], [168, 210], [150, 168]];
  // the sky: night at the top, the last violet of the day below it
  s.rect(s.lin([[0, '#0b0e26'], [0.1, '#18193f'], [0.18, '#2d2556'], [0.3, '#5a3a62']]));
  live.add(particles({ seed: 1101, n: 44, x: [6, 294], y: [6, 120], r: [0.3, 0.9], fill: '#fff8e8', cls: 'twinkle', op: [0.35, 1], t: [2.5, 6] }));
  // the moon, high on the left, and its cold light
  s.glow(64, 54, 150, '#a9b8ff', 0.32);
  s.glow(64, 54, 34, '#e9ecff', 0.5);
  s.bloom(`<circle cx="64" cy="54" r="11" fill="#f6f1dc"/><circle cx="60" cy="51" r="2.2" fill="#ded6b8" opacity=".6"/><circle cx="67" cy="57" r="1.6" fill="#ded6b8" opacity=".5"/>`, { sd: 3, k: 1.2 });
  // a long thin cloud across the moon (it drifts)
  live.add(`<g class="drift"><path d="${U(ell(40, 76, 22, 5), ell(70, 72, 26, 7), ell(104, 76, 20, 5), ell(130, 79, 14, 3.5))}" fill="#c8cff4" opacity=".12"/></g>`);
  // far peaks behind the Wall, pale with distance
  s.layer(ridge({ seed: 1102, base: 150, amp: 34, freq: 3.2, peaks: true, x1: w + 8, bottom: 200 }), '#2a2a52', { blur: 0.8 });
  s.haze(118, 150, '#6a6aa8', 0.35);
  s.glow(150, 152, 190, '#8f7fd0', 0.32);
  // the ridge and the Wall on it: battlements, towers, the gate with its fire
  const ridgeD = ledge([[-10, 152], [60, 146], [150, 140], [230, 145], [310, 150]], 220);
  const merl = [];
  for (let x = 8; x < 292; x += 9) merl.push(quad(x, 108, 5, 6));
  const towers = [[26, 92, 20], [86, 98, 18], [196, 98, 18], [256, 92, 20]].map(([x, top, tw]) =>
    U(quad(x, top, tw, 58), ...[0, 1, 2].map((k) => quad(x + 1 + k * (tw - 2) / 3, top - 6, (tw - 2) / 3 - 2, 6))));
  const gate = U(quad(128, 90, 44, 60), poly([[124, 92], [150, 70], [176, 92]]), ...[0, 1, 2, 3].map((k) => quad(130 + k * 10.5, 84, 6, 6)));
  s.figure(`<path d="${U(ridgeD, quad(8, 114, 284, 40), merl, towers, gate)}"/>`, { fill: '#1b1c40', rim: '#c4cdf8', offsets: [[-0.9, -0.9], [-0.4, -1.1]], rimOp: 0.8, shade: 0.4, edge: 0.35 });
  // the moon's side of each tower, and the wall's face below the battlements
  s.add(`<path d="${U([[26, 92, 20], [86, 98, 18], [196, 98, 18], [256, 92, 20]].map(([x, top, tw]) => quad(x, top, tw * 0.36, 22)), quad(128, 92, 14, 22))}" fill="#5a60a0" opacity=".28"/>`);
  s.add(`<path d="M8,128H292M8,138H292" stroke="#2c2e5a" stroke-width=".5" opacity=".5"/>`);
  // lit windows and the gate's fire
  s.bloom(`<path d="${U(quad(33, 108, 2.4, 4), quad(39, 120, 2.4, 4), quad(92, 112, 2.2, 4), quad(202, 112, 2.2, 4), quad(263, 108, 2.4, 4), quad(269, 122, 2.4, 4), quad(146, 100, 3, 5))}" fill="#ffc874"/>`, { sd: 1.6, k: 1.4 });
  s.add(`<path d="M138,150L138,126Q150,112 162,126L162,150Z" fill="#2a1408"/>`);
  s.glow(150, 140, 26, '#ff9a3c', 0.55);
  live.add(`<ellipse class="breathe" cx="150" cy="140" rx="14" ry="11" fill="${live.rad([[0, '#ffc874', 0.55], [1, '#ff9a3c', 0]])}"/>`);
  // the high fields under the moon: rolling, in rows, silver on their crests
  s.layer(ledge([[-10, 170], [70, 160], [160, 168], [240, 160], [310, 168]], 360), s.lin([[0, '#1a2a3c'], [0.5, '#203a3c'], [1, '#26443a']]), { rough: 1.4, seed: 1103 });
  {
    // parcels in rows that widen toward us, each its own shade of night green; silver along the top edges
    const R0 = rng(1120), cols = ['#22383f', '#2a4640', '#1d3338', '#30503f', '#27413c', '#35553f'];
    let parcels = '', edges = '';
    const rows = [176, 196, 220, 248, 280, 314];
    for (let r = 0; r < rows.length - 1; r++) {
      const y0 = rows[r], y1 = rows[r + 1];
      let x = -10 - R0() * 20;
      while (x < 310) {
        const wd = 34 + r * 10 + R0() * 30, sk = (R0() - 0.5) * 8;
        const quadP = poly([[x, y0 + R0() * 2], [x + wd, y0 + R0() * 2], [x + wd + sk, y1], [x + sk, y1]]);
        parcels += `<path d="${quadP}" fill="${cols[Math.floor(R0() * cols.length)]}" opacity=".9"/>`;
        edges += `M${f1(x)},${f1(y0 + 1)}h${f1(wd)}`;
        x += wd + 2;
      }
    }
    s.add(`<g>${parcels}</g><path d="${edges}" stroke="#b6c9da" stroke-width=".7" opacity=".32"/>`);
    // hedgerows between the rows: dark, moonlit on top
    const R9 = rng(1124), hedges = [];
    for (const y of [rows[2], rows[4]]) {
      let x = -10;
      while (x < 300) {
        const len = 30 + R9() * 50, x1 = Math.min(310, x + len);
        hedges.push(taper([[x, y + (R9() - 0.5) * 3], [(x + x1) / 2, y - 1 + (R9() - 0.5) * 3], [x1, y + (R9() - 0.5) * 3]], [1.4, 2.4, 1.4], { per: 5 }));
        if (R9() < 0.5) { const tx = x + len * R9(), r = 3 + R9() * 2.5; hedges.push(blob([[tx - r, y], [tx - r * 0.6, y - r * 1.3], [tx + r * 0.5, y - r * 1.5], [tx + r, y]], 4)); }
        x = x1 + 6 + R9() * 16;
      }
    }
    s.figure(`<path d="${U(hedges)}"/>`, { fill: '#10202a', rim: '#a9bdd8', offsets: [[-0.4, -0.7]], rimOp: 0.5 });
  }
  // dark trees along the field edges
  const trees = [[22, 190, 9], [40, 196, 7], [262, 186, 10], [282, 194, 8], [70, 300, 8], [246, 306, 9], [30, 318, 11]];
  s.figure(`<path d="${U(trees.map(([x, y, r]) => U(blob([[x - r, y], [x - r * 0.6, y - r * 1.2], [x, y - r * 1.6], [x + r * 0.7, y - r * 1.1], [x + r, y]], 4), quad(x - 0.8, y, 1.6, r * 0.6))))}"/>`, { fill: '#0d1a1c', rim: '#a8bde0', offsets: [[-0.6, -0.7]], rimOp: 0.6 });
  // the moths over the fields: a slow glowing cloud around the fourth level
  live.motes({ seed: 1104, n: 38, x: [150, 236], y: [226, 300], r: [0.4, 1], fill: '#fff0b8', hot: '#fffbe8', cls: 'float', op: [0.5, 1], t: [4, 8] });
  live.motes({ seed: 1105, n: 12, x: [120, 270], y: [200, 320], r: [0.3, 0.7], fill: '#fff0b8', cls: 'twinkle', op: [0.4, 0.9], t: [1.6, 3.4] });
  // mist in the valley below the fields
  s.haze(318, 350, '#8b97c4', 0.4, 22);
  live.add(`<g class="drift"><path d="${blob([[-20, 342], [60, 334], [140, 340], [220, 333], [320, 341], [230, 350], [120, 352], [10, 350]], 6)}" fill="#a9b4dc" opacity=".14"/></g>`);
  // the mountains at dusk: far, middle and near ranges; the pass cut through the near one
  s.layer(ridge({ seed: 1106, base: 380, amp: 70, freq: 2.6, peaks: true, x1: w + 8, bottom: 460 }), '#3b3a63', { blur: 0.7 });
  s.haze(320, 380, '#c98fa0', 0.22);
  s.layer(ridge({ seed: 1107, base: 410, amp: 62, freq: 3.4, peaks: true, x1: w + 8, bottom: 470 }), '#40385c', { shadow: 0.35, sd: 2.4, dy: -1 });
  const near = ledge([[-10, 380], [24, 352], [52, 366], [82, 344], [98, 380], [112, 402], [126, 384], [152, 350], [190, 368], [222, 346], [258, 372], [310, 360]], 480);
  s.figure(`<path d="${near}"/>`, { fill: '#2a2440', rim: '#f0a07a', offsets: [[1, -0.7], [0.6, -1]], rimOp: 0.55, shade: 0.45, light: [1, -0.4] });
  // the sun's last light on the right-hand faces of the near peaks
  s.add(`<path d="${U(poly([[82, 344], [98, 380], [90, 382]]), poly([[152, 350], [190, 368], [176, 372]]), poly([[222, 346], [258, 372], [246, 376]]), poly([[24, 352], [52, 366], [42, 368]]))}" fill="#f2a27a" opacity=".32"/>`);
  // two great boulders guard the pass (the mountain watching)
  s.figure(`<path d="${U(blob([[84, 404], [86, 388], [96, 382], [104, 392], [102, 408]], 4), blob([[120, 410], [122, 392], [132, 386], [142, 396], [138, 412]], 4))}"/>`, { fill: '#1d1830', rim: '#f2a27a', offsets: [[0.8, -0.8]], rimOp: 0.5 });
  s.bloom(`<path d="${dots([[94, 393, 0.9], [99, 393, 0.9]])}" fill="#ffcf8a"/>`, { sd: 1.2, k: 1.2 });
  // the warm air of sunset rising from the coast
  s.haze(436, 470, '#f0a878', 0.32, 24);
  // green slopes, lit from the sea on the right
  s.layer(ledge([[-10, 452], [60, 440], [130, 452], [200, 438], [310, 446]], 780), s.lin([[0, '#55704a'], [0.3, '#47663f'], [1, '#2f4a30']]), { rough: 1.3, seed: 1108 });
  s.add(`<path d="${line([[-10, 452], [60, 440], [130, 452], [200, 438], [310, 446]])}" stroke="#f2c98a" stroke-width="1.4" fill="none" opacity=".45"/>`);
  s.layer(ledge([[-10, 520], [50, 506], [110, 516], [160, 504], [210, 512]], 780), s.lin([[0, '#5d7a4c'], [1, '#34522f']]), { shadow: 0.3, sd: 2.2, dy: -1, rough: 1.1, seed: 1109 });
  s.add(`<path d="${line([[-10, 520], [50, 506], [110, 516], [160, 504], [210, 512]])}" stroke="#f6d398" stroke-width="1.2" fill="none" opacity=".4"/>`);
  // warm light pooling on the slopes
  s.add(`<ellipse cx="150" cy="486" rx="120" ry="28" fill="${s.radU(150, 486, 120, [[0, '#ffd89a', 0.28], [1, '#ffd89a', 0]])}"/>`);
  s.add(`<ellipse cx="90" cy="560" rx="110" ry="30" fill="${s.radU(90, 560, 110, [[0, '#ffd89a', 0.22], [1, '#ffd89a', 0]])}"/>`);
  // bushes and trees along the crests, lit on their sea side
  const bushes = [];
  const R1 = rng(1121);
  for (const [x0, x1, y] of [[-6, 80, 446], [150, 196, 442], [-6, 56, 512], [118, 168, 508]]) {
    for (let x = x0; x < x1; x += 7 + R1() * 8) { const r = 3.5 + R1() * 3.5; bushes.push(blob([[x - r, y + 2], [x - r * 0.5, y - r * 0.9], [x + r * 0.3, y - r * 1.2], [x + r, y - r * 0.4], [x + r * 0.9, y + 2]], 4)); }
  }
  bushes.push(U(blob([[40, 470], [44, 452], [54, 446], [64, 452], [66, 470]], 4), quad(52, 470, 2.4, 8)), U(blob([[150, 548], [154, 532], [162, 528], [170, 534], [172, 548]], 4), quad(160, 548, 2, 7)));
  s.figure(`<path d="${U(bushes)}"/>`, { fill: '#22361f', rim: '#ffd39a', offsets: [[0.9, -0.6], [0.5, -0.9]], rimOp: 0.75, shade: 0.4, light: [1, -0.5] });
  // a windmill on the high slope, its sails turning slowly
  s.figure(`<path d="${U(poly([[22, 504], [25, 478], [33, 478], [36, 504]]), poly([[22, 479], [29, 471], [36, 479]]))}"/>`, { fill: '#2c2420', rim: '#ffd39a', offsets: [[0.8, -0.6]], rimOp: 0.7 });
  live.add(`<g class="turn" style="transform-box:view-box;transform-origin:29px 476px"><path d="${U([0, 90, 180, 270].map((a) => taper([[29, 476], [29 + Math.cos(rad(a)) * 15, 476 + Math.sin(rad(a)) * 15]], [1.4, 3.4], { per: 2 })))}" fill="#2c2420"/></g>`);
  // wildflowers in the sun
  s.add(`<path d="${dots(Array.from({ length: 40 }, (_, i) => { const R = rng(1122 + i); return [10 + R() * 170, 530 + R() * 70, 0.7 + R() * 0.5]; }))}" fill="#ffe4a0" opacity=".55"/>`);
  // the sun itself, going down past the cliffs into the sea
  const sun = [292, 590];
  s.glow(sun[0], sun[1], 230, '#ffcf96', 0.55);
  s.shafts({ cx: sun[0], cy: sun[1], n: 16, from: 150, to: 260, len: 330, spread: 2.4, color: '#ffe4b8', op: 0.16, seed: 1110 });
  s.glow(sun[0], sun[1], 50, '#fff0d0', 0.75);
  // the sea: gold near the sun, deepening to night blue at the bottom
  const sea = poly([...spline([[166, 610], [196, 596], [240, 590], [310, 592]], 6), [310, 780], [160, 780], [150, 700]]);
  s.path(sea, s.linU(300, 590, 170, 770, [[0, '#f0c48a'], [0.25, '#9a9c8c'], [0.55, '#3c6274'], [1, '#132a38']]));
  s.add(`<path d="${line([[166, 610], [196, 596], [240, 590], [310, 592]])}" stroke="#ffe7b8" stroke-width="1.4" fill="none" opacity=".6"/>`);
  // the sun's road across the water: glints that come and go
  const glints = [];
  const R = rng(1111);
  for (let i = 0; i < 46; i++) {
    const t = R(), y = 600 + t * 150, x = 288 - t * 96 + (R() - 0.5) * (14 + t * 46), len = 3 + R() * (6 + t * 8);
    glints.push(`<path class="twinkle" style="--t:${f1(1.4 + R() * 2.4)}s;--d:${f1(-R() * 3)}s;--o:${f1(0.5 + R() * 0.5)}" d="M${f1(x - len / 2)},${f1(y)}h${f1(len)}" stroke="#fff4d8" stroke-width="${f1(0.7 + t * 0.6)}" stroke-linecap="round"/>`);
  }
  live.add(glints.join(''));
  // the cliffs over the bay: tall, gilded on top, sea-dark below
  const cliff = poly([...spline([[176, 600], [184, 560], [180, 528], [196, 506], [228, 494], [266, 500], [310, 492]], 6), [310, 604], [250, 600], [216, 608], [176, 612]]);
  s.figure(`<path d="${cliff}"/>`, { fill: '#4a3a34', rim: '#ffc888', offsets: [[0.8, -1], [1.2, -0.4]], rimOp: 0.85, shade: 0.55, light: [1, -0.6] });
  s.add(`<path d="${U(poly([[196, 506], [228, 494], [232, 512], [204, 524]]), poly([[266, 500], [310, 492], [310, 510], [272, 516]]))}" fill="#6b8a4c" opacity=".85"/>`);
  s.add(`<path d="M186,560L194,600M206,540L214,598M236,520L240,600M262,516L270,600M288,512L294,600" stroke="#2c201c" stroke-width="2" opacity=".35"/>`);
  s.add(`<path d="${line([[184, 540], [210, 536], [240, 540], [270, 534], [310, 538]])}${line([[188, 572], [220, 568], [250, 574], [310, 566]])}" stroke="#8a6a52" stroke-width="1" fill="none" opacity=".45"/>`);
  s.add(`<path d="${U(poly([[226, 530], [232, 528], [230, 560], [224, 566]]), poly([[276, 524], [281, 523], [283, 556], [277, 560]]))}" fill="#251a18" opacity=".55"/>`);
  // the lighthouse on its rock
  s.figure(`<path d="${U(blob([[244, 640], [250, 626], [266, 622], [280, 630], [284, 644]], 4), poly([[258, 626], [261, 586], [269, 586], [272, 626]]), quad(257.5, 580, 15, 6), poly([[259, 580], [265, 571], [271, 580]]))}"/>`, { fill: '#2a2224', rim: '#ffd29a', offsets: [[0.8, -0.8]], rimOp: 0.7 });
  s.add(`<path d="${U(poly([[259.6, 596], [270.4, 596], [270.9, 603], [259.1, 603]]), poly([[258.7, 612], [271.3, 612], [271.7, 619], [258.3, 619]]))}" fill="#e8e0d0"/>`);
  s.bloom(`<path d="${quad(261.5, 581, 7, 4)}" fill="#fff0b8"/>`, { sd: 2.2, k: 1.4 });
  live.add(`<path class="breathe" style="transform-box:view-box;transform-origin:265px 583px" d="M265,583L196,566L199,556Z" fill="${live.rad([[0, '#fff4cc', 0.5], [1, '#fff4cc', 0]])}" opacity=".5"/>`);
  // boats in the bay, sails catching the sun
  const boat = (x, y, k) => U(poly([[x - 9 * k, y], [x + 9 * k, y], [x + 6 * k, y + 3.4 * k], [x - 6 * k, y + 3.4 * k]]), poly([[x - 0.4 * k, y], [x - 0.4 * k, y - 16 * k], [x + 0.4 * k, y - 16 * k], [x + 0.4 * k, y]]),
    poly([[x + 0.6 * k, y - 15 * k], [x + 9 * k, y - 2 * k], [x + 0.6 * k, y - 1.6 * k]]), poly([[x - 0.6 * k, y - 12 * k], [x - 6 * k, y - 2 * k], [x - 0.6 * k, y - 2 * k]]));
  s.figure(`<path d="${U(boat(214, 664, 0.9), boat(250, 712, 1.15), boat(196, 742, 0.75))}"/>`, { fill: '#1d1f26', rim: '#ffd8a0', offsets: [[1, -0.7]], rimOp: 0.8 });
  live.add(`<g class="float" style="--t:6s;--d:-2s"><path d="${U(gull(232, 548, 0.7, -8), gull(250, 560, 0.55, 6), gull(214, 566, 0.5, -4))}" fill="#2a2228" opacity=".8"/></g>`);
  // the wind off the sea, combing the slopes
  live.add(`<g class="drift" opacity=".22"><path d="${line([[60, 470], [100, 466], [140, 470]])}M120,486C140,482 160,486 176,483" stroke="#fff4dc" stroke-width=".8" fill="none" stroke-linecap="round"/></g>`);
  // the road: worn into the land, pale and soft-edged, the whole way up
  const widths = ROAD.map((_, i) => 9 - (i / (ROAD.length - 1)) * 5.4);
  const road = taper(ROAD, widths, { per: 8 });
  s.layer(road, '#1a140c', { blur: 1.6, extra: 'opacity=".45" transform="translate(.8 1.4)"' });
  s.path(road, s.linU(0, 760, 0, 120, [[0, '#e6c894'], [0.45, '#d8bc8a'], [0.62, '#b8a6a0'], [1, '#9aa4c4']]));
  s.add(`<path d="${line(ROAD, 8)}" stroke="#fff6dc" stroke-width=".8" fill="none" opacity=".35" stroke-dasharray="1.5 6" stroke-linecap="round"/>`);
  // pebbles at its edges
  s.add(`<path d="${dots(Array.from({ length: 60 }, (_, i) => { const R = rng(1123 + i), k = Math.floor(R() * (ROAD.length - 1)), u = R(); const [ax, ay] = ROAD[k], [bx, by] = ROAD[k + 1]; return [ax + (bx - ax) * u + (R() < 0.5 ? -1 : 1) * (widths[k] / 2 + 1), ay + (by - ay) * u, 0.5 + R() * 0.5]; }))}" fill="#3a3024" opacity=".5"/>`);
  // the harbor town: roofs climbing the slope, windows lit, a market square
  const town = [];
  const R2 = rng(1112);
  for (const [x0, base, n] of [[2, 700, 6], [10, 728, 6], [-2, 756, 7], [100, 684, 2], [96, 746, 3]]) {
    let x = x0;
    for (let i = 0; i < n; i++) { const wd = 13 + R2() * 7, ht = 12 + R2() * 8; town.push([x, base - R2() * 4, wd, ht, 0.5 + R2() * 0.25, R2() < 0.5]); x += wd + 1 + R2() * 3; }
  }
  s.figure(`<path d="${U(town.map(([x, b, wd, ht, rf, ch]) => house(x, b, wd, ht, rf, ch)))}"/>`, { fill: '#3a2420', rim: '#ffc88a', offsets: [[1, -0.8]], rimOp: 0.7, shade: 0.4 });
  const wins = [];
  for (const [x, b, wd, ht] of town) if (R2() < 0.8) wins.push(quad(x + wd * 0.3, b - ht * 0.62, 2.2, 3), R2() < 0.5 ? quad(x + wd * 0.62, b - ht * 0.62, 2.2, 3) : '');
  s.bloom(`<path d="${U(wins)}" fill="#ffcf7e"/>`, { sd: 1.4, k: 1.3 });
  for (const [x, b, wd, ht, rf, ch] of town.filter((t) => t[5]).slice(0, 5)) {
    live.add(particles({ seed: Math.round(x * 7 + b), n: 3, x: [x + wd * 0.72, x + wd * 0.78], y: [b - ht - wd * rf - 2, b - ht - wd * rf], r: [1.2, 2.2], fill: '#d8ccc4', cls: 'rise', op: [0.15, 0.3], t: [6, 9] }));
  }
  // the market square: cobbles, awnings, a string of lanterns
  s.path(ell(96, 652, 34, 15), s.radU(96, 652, 36, [[0, '#d8b98a'], [1, '#9a7a56']]));
  const aw = [[64, 640, '#c84a3a'], [80, 632, '#3c7a8a'], [112, 632, '#d8a040'], [128, 640, '#8a4a7a']];
  s.figure(`<path d="${U(aw.map(([x, y]) => U(quad(x - 6, y, 12, 8), poly([[x - 8, y], [x, y - 5], [x + 8, y]]))))}"/>`, { fill: '#2a1c1c', rim: '#ffc88a', offsets: [[0.7, -0.7]], rimOp: 0.6 });
  for (const [x, y, c] of aw) s.add(`<path d="${poly([[x - 7.4, y - 0.3], [x, y - 4.6], [x + 7.4, y - 0.3]])}" fill="${c}" opacity=".85"/><path d="M${x - 7},${y}h14" stroke="#f4e8d0" stroke-width="1.2" stroke-dasharray="2 2"/>`);
  const lanterns = [[60, 626], [72, 622], [84, 620], [96, 619], [108, 620], [120, 622], [132, 626]];
  s.add(`<path d="${line(lanterns.map(([x, y]) => [x, y - 2]))}" stroke="#1a1210" stroke-width=".6" fill="none"/>`);
  live.add(lanterns.map(([x, y], i) => `<circle class="breathe" style="--d:${-i * 0.5}s" cx="${x}" cy="${y}" r="3.2" fill="${live.rad([[0, '#fff2c4', 0.95], [0.5, '#ffb04a', 0.5], [1, '#ff8a2a', 0]])}"/>`).join(''));
  // the quay where Marisol sets out
  s.path(poly([[138, 748], [168, 726], [214, 742], [210, 760], [140, 760]]), s.lin([[0, '#5a4030'], [1, '#2a1c14']]));
  s.add(`<path d="M150,744L196,736M146,752L202,744" stroke="#1a120c" stroke-width=".8" opacity=".7"/><path d="M138,748L168,726L214,742" stroke="#ffcf8a" stroke-width="1" fill="none" opacity=".5"/>`);
  // the near grass framing the bottom, bending in the wind
  live.grass({ seed: 1113, x0: -4, x1: 130, base: 762, h: [10, 20], n: 22, fill: '#1c2414', lit: '#f2c27a' });
  live.grass({ seed: 1116, x0: 0, x1: 160, base: 560, depth: 48, h: [5, 9], n: 10, fill: '#2a3b20', lit: '#f6d398' });
  live.grass({ seed: 1117, x0: 40, x1: 190, base: 462, depth: 30, h: [4, 7], n: 6, fill: '#2f4423', lit: '#f6d398' });
  live.grass({ seed: 1114, x0: 0, x1: 70, base: 522, depth: 22, h: [5, 9], n: 6, fill: '#26361f', lit: '#f6d398' });
  // the finish: the sun's warmth low on the right, the night's blue above
  s.finish({ hi: '#ffd7a0', lo: '#14163a', at: sun, reach: 720, grade: 0.34, vignette: 0.32, grain: 0.06 });
  return { spots: { start: [150, 742], levels: [[96, 652], [204, 520], [112, 396], [192, 262], [150, 128]] } };
}

// ── World 1's places ───────────────────────────────────────────────
// 300 × 600 each, seen from where you arrive: three spots climbing into the
// picture (round 1 nearest, round 3 at the Legend's own door), all above
// y 390 (the lower third sits under the level's words on a phone).

// The Market: a night street of mask stalls under strings of lanterns,
// leading to Mirelle's striped pavilion with its great mask.
function market(s, live) {
  s.rect(s.lin([[0, '#0a1424'], [0.18, '#1a2244'], [0.32, '#33295a'], [0.42, '#4a2e5c']]));
  live.add(particles({ seed: 2101, n: 30, x: [4, 296], y: [4, 140], r: [0.3, 0.8], fill: '#fff8e8', cls: 'twinkle', op: [0.3, 1], t: [2.5, 6] }));
  s.glow(232, 58, 60, '#b9c6ff', 0.28);
  s.add(`<path d="M232,46a12,12 0 1 0 9,20 10,10 0 1 1-9-20z" fill="#efe9d2"/>`);
  // rooftops of the town behind, against the sky
  s.layer(U([[0, 150, 26, 30], [24, 140, 22, 40], [44, 152, 24, 28], [210, 146, 24, 34], [232, 136, 26, 44], [256, 150, 26, 30], [280, 142, 24, 38]].map(([x, b, w, h]) => house(x, b + 40, w, h, 0.6, true))), '#1a1630', { blur: 0.5 });
  s.haze(150, 196, '#6a4a88', 0.3);
  // the pavilion: Mirelle's tent, striped, a great mask on its front, lit from within
  const vx = 150;
  s.glow(vx, 196, 120, '#ffb06a', 0.4);
  const tent = U(poly([[vx - 66, 214], [vx - 58, 150], [vx, 104], [vx + 58, 150], [vx + 66, 214]]), poly([[vx - 1, 104], [vx - 1, 86], [vx + 1, 86], [vx + 1, 104]]), poly([[vx + 1, 88], [vx + 14, 92], [vx + 1, 96]]));
  s.figure(`<path d="${tent}"/>`, { fill: '#2a1638', rim: '#ffc890', offsets: [[0, -1], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.7, shade: 0.45 });
  let stripes = '';
  for (let k = -3; k <= 3; k++) stripes += poly([[vx + k * 18 - 4, 214], [vx + k * 9.5 - 2, 150], [vx + k * 1.6, 106], [vx + k * 1.6 + 1.4, 106], [vx + k * 9.5 + 3, 150], [vx + k * 18 + 5, 214]]);
  s.add(`<path d="${stripes}" fill="#3d6a7a" opacity=".55"/>`);
  // the great mask on the tent's front
  const mask = U(blob([[vx - 18, 132], [vx - 14, 120], [vx, 115], [vx + 14, 120], [vx + 18, 132], [vx + 12, 150], [vx, 156], [vx - 12, 150]], 5));
  s.figure(`<path d="${mask}"/>`, { fill: '#e8e2d6', rim: '#fff4dc', offsets: [[0, -0.6]], rimOp: 0.6 });
  s.add(`<path d="${U(ell(vx - 7, 133, 4.4, 2.6, -12), ell(vx + 7, 133, 4.4, 2.6, 12))}" fill="#1a0e22"/><path d="M${vx - 5},146Q${vx},149 ${vx + 5},146" stroke="#7a3a5a" stroke-width="1.4" fill="none"/>`);
  s.add(`<path d="${line([[vx - 10, 124], [vx - 4, 122], [vx + 2, 124]])}" stroke="#c8a24a" stroke-width=".8" fill="none" opacity=".7"/>`);
  // the doorway, glowing
  s.add(`<path d="M${vx - 14},214L${vx - 10},176Q${vx},166 ${vx + 10},176L${vx + 14},214Z" fill="#ffcf8a"/>`);
  s.glow(vx, 200, 40, '#ffe0a8', 0.6);
  // the street: cobbles narrowing toward the tent, warm pools under the lanterns
  const street = poly([[-30, 600], [330, 600], [176, 214], [124, 214]]);
  s.path(street, s.linU(0, 600, 0, 214, [[0, '#2a2026'], [0.5, '#3a2c2c'], [1, '#6a4a3a']]));
  let cob = '';
  const Rc = rng(2102);
  for (let row = 0; row < 26; row++) {
    const t = row / 25, y = 214 + (600 - 214) * t ** 1.6, half = 26 + (180 - 26) * t ** 1.6, n = 4 + Math.floor(t * 14);
    for (let i = 0; i < n; i++) { const x = vx - half + ((i + 0.5 + (row % 2) * 0.5) / n) * half * 2 + (Rc() - 0.5) * 2; cob += ell(x, y, (half / n) * 0.85, 1 + t * 3.2, 0, 10); }
  }
  s.add(`<path d="${cob}" fill="#8a6a54" opacity=".35"/>`);
  for (const [x, y, r] of [[vx, 236, 30], [vx, 300, 46], [vx, 400, 70]]) s.add(`<ellipse cx="${x}" cy="${y}" rx="${r * 1.6}" ry="${r * 0.42}" fill="${s.radU(x, y, r * 1.6, [[0, '#ffb86a', 0.32], [1, '#ffb86a', 0]])}"/>`);
  // the stalls down both sides, smaller with distance: posts, a counter, an awning, masks for sale
  const awn = ['#a83a3a', '#2f6a7a', '#c8902a', '#6a3a7a', '#3a7a5a'];
  const stall = (x, base, k, dir, c) => {
    const w = 46 * k, h = 52 * k, x0 = dir > 0 ? x : x - w;
    const body = U(quad(x0, base - h, 2.4 * k, h), quad(x0 + w - 2.4 * k, base - h, 2.4 * k, h), quad(x0 - 2 * k, base - 16 * k, w + 4 * k, 16 * k));
    const roof = poly([[x0 - 6 * k, base - h + 2 * k], [x0 + w / 2, base - h - 12 * k], [x0 + w + 6 * k, base - h + 2 * k]]);
    return { body, roof, x0, w, h, k, c };
  };
  const stalls = [];
  for (const [x, base, k] of [[-6, 520, 1.6], [36, 400, 1.05], [74, 318, 0.72], [100, 268, 0.5], [116, 240, 0.36]]) stalls.push(stall(x, base, k, 1, awn[stalls.length % 5]));
  for (const [x, base, k] of [[306, 520, 1.6], [264, 400, 1.05], [226, 318, 0.72], [200, 268, 0.5], [184, 240, 0.36]]) stalls.push(stall(x, base, k, -1, awn[(stalls.length + 2) % 5]));
  s.figure(`<path d="${U(stalls.map((t) => t.body + t.roof))}"/>`, { fill: '#1e1218', rim: '#ffbf80', offsets: [[0, -0.9], [0.6, -0.5], [-0.6, -0.5]], rimOp: 0.55, shade: 0.35 });
  // awnings in colour, with fringe
  s.add(stalls.map((t) => { const yb = Number(t.roof.split('L')[0].split(',')[1]); return `<path d="${t.roof}" fill="${t.c}" opacity=".85"/><path d="M${f1(t.x0 - 5 * t.k)},${f1(yb + 1)}h${f1(t.w + 10 * t.k)}" stroke="#f4e6cc" stroke-width="${f1(1.4 * t.k)}" stroke-dasharray="${f1(2 * t.k)} ${f1(2 * t.k)}" opacity=".75"/>`; }).join(''));
  // masks hanging under the awnings: pale ovals, dark eyes
  let masks = '', eyes = '';
  for (const t of stalls) {
    const yb = Number(t.roof.split('L')[0].split(',')[1]);
    for (let i = 0; i < 3; i++) {
      const mx = t.x0 + t.w * (0.22 + i * 0.28), my = yb + 10 * t.k + (i % 2) * 3 * t.k;
      masks += ell(mx, my, 3.6 * t.k, 4.6 * t.k, 0, 14);
      eyes += ell(mx - 1.5 * t.k, my - 1 * t.k, 1 * t.k, 0.6 * t.k, 0, 8) + ell(mx + 1.5 * t.k, my - 1 * t.k, 1 * t.k, 0.6 * t.k, 0, 8);
    }
  }
  s.add(`<path d="${masks}" fill="#e6ddd0" opacity=".9"/><path d="${eyes}" fill="#1a0e22"/>`);
  // the fountain halfway down the street
  s.figure(`<path d="${U(ell(vx, 292, 30, 7), quad(vx - 28, 284, 56, 8), quad(vx - 3, 262, 6, 24), ell(vx, 262, 8, 2.4))}"/>`, { fill: '#2a2230', rim: '#ffc890', offsets: [[0, -0.9]], rimOp: 0.6 });
  s.add(`<ellipse cx="${vx}" cy="285" rx="26" ry="4.4" fill="#4a6a7a" opacity=".8"/>`);
  live.add(`<path class="fall" style="--d:-.4s" d="M${vx - 2},266q-6,6 -10,18" stroke="#bfe4ee" stroke-width="1" fill="none" opacity=".7"/><path class="fall" style="--d:-1.1s" d="M${vx + 2},266q6,6 10,18" stroke="#bfe4ee" stroke-width="1" fill="none" opacity=".7"/>`);
  live.add(particles({ seed: 2103, n: 10, x: [vx - 24, vx + 24], y: [282, 288], r: [0.4, 0.8], fill: '#fff4dc', cls: 'twinkle', op: [0.4, 1], t: [1.4, 3] }));
  // lanterns strung across the street at three depths
  for (const [y, xl, xr, sag, k] of [[226, 112, 188, 6, 0.4], [270, 90, 210, 10, 0.6], [330, 52, 248, 16, 0.9], [420, 6, 294, 22, 1.3]]) {
    const pts = Array.from({ length: 9 }, (_, i) => { const u = i / 8; return [xl + (xr - xl) * u, y + Math.sin(u * Math.PI) * sag]; });
    s.add(`<path d="${line(pts)}" stroke="#140c10" stroke-width="${f1(0.5 * k + 0.2)}" fill="none"/>`);
    live.add(pts.slice(1, -1).map(([x, yy], i) => `<circle class="breathe" style="--d:${f1(-i * 0.37 - k)}s" cx="${f1(x)}" cy="${f1(yy + 2.5 * k)}" r="${f1(3.2 * k + 0.8)}" fill="${live.rad([[0, '#fff2c4', 0.95], [0.45, '#ffb04a', 0.55], [1, '#ff8a2a', 0]])}"/>`).join(''));
  }
  // smoke from the braziers, low over the cobbles
  live.add(`<g class="drift"><path d="${U(ell(80, 446, 70, 7), ell(210, 452, 80, 8))}" fill="#c8b0c8" opacity=".09"/></g>`);
  // dark framing: a hanging banner of masks at the top corners, crates near
  s.figure(`<path d="${U(quad(-10, 540, 60, 70), quad(20, 520, 30, 24), quad(262, 548, 60, 60), quad(246, 532, 26, 20))}"/>`, { fill: '#120a0e', rim: '#ffbf80', offsets: [[0, -0.8]], rimOp: 0.4 });
  s.finish({ faction: ['tide', 'umbral'], at: [vx, 196], reach: 420, grade: 0.32, vignette: 0.42, grain: 0.06 });
  return { spots: { rounds: [[150, 372], [150, 300], [150, 210]] } };
}

// The Cliffs: a stair cut up sunset cliffs over the sea, to Aeris's
// wind-torn eyrie on the headland, banners streaming.
function cliffs(s, live) {
  s.rect(s.lin([[0, '#26304e'], [0.2, '#5a4a6e'], [0.38, '#c8705e'], [0.52, '#f4b47a'], [0.6, '#f8d49a']]));
  const sun = [58, 318];
  s.glow(sun[0], sun[1], 260, '#ffcf96', 0.55);
  s.shafts({ cx: sun[0], cy: sun[1], n: 18, from: -100, to: 10, len: 360, spread: 2.4, color: '#fff0d0', op: 0.16, seed: 2201 });
  s.glow(sun[0], sun[1], 40, '#fff6e0', 0.85);
  s.add(`<circle cx="${sun[0]}" cy="${sun[1]}" r="13" fill="#fff6e2"/>`);
  // long clouds lit from beneath
  const clouds = [[40, 120, 90, 7], [150, 160, 120, 8], [240, 96, 80, 6], [80, 220, 110, 6], [210, 250, 90, 5]];
  for (const [x, y, w, h] of clouds) {
    s.path(U(ell(x, y, w * 0.5, h), ell(x - w * 0.22, y - h * 0.5, w * 0.3, h * 0.8), ell(x + w * 0.2, y - h * 0.4, w * 0.28, h * 0.7)), s.lin([[0, '#6a5a7e'], [1, '#f2a882']]), 'opacity=".75"');
  }
  live.add(`<g class="drift"><path d="${U(ell(120, 190, 70, 4), ell(260, 210, 50, 3))}" fill="#ffd8b0" opacity=".2"/></g>`);
  // the sea below, gold under the sun, its glints
  const sea = poly([[-10, 330], [190, 330], [170, 610], [-10, 610]]);
  s.path(sea, s.linU(sun[0], 330, 60, 610, [[0, '#f6c88a'], [0.3, '#a89a86'], [0.65, '#3a6070'], [1, '#14303c']]));
  const R = rng(2202);
  live.add(Array.from({ length: 40 }, () => { const t = R(), y = 336 + t * 250, x = sun[0] + (R() - 0.5) * (12 + t * 90), len = 3 + R() * (5 + t * 8); return `<path class="twinkle" style="--t:${f1(1.4 + R() * 2.4)}s;--d:${f1(-R() * 3)}s;--o:${f1(0.5 + R() * 0.5)}" d="M${f1(x - len / 2)},${f1(y)}h${f1(len)}" stroke="#fff4d8" stroke-width="${f1(0.7 + t * 0.6)}" stroke-linecap="round"/>`; }).join(''));
  // the far headlands across the bay
  s.layer(ledge([[-10, 330], [20, 318], [46, 322], [70, 312], [96, 324], [118, 330]], 338), '#8a6a7a', { blur: 0.9 });
  s.haze(300, 334, '#ffcf9a', 0.35);
  // the cliff: a great wall of rock on the right, terraced, lit gold on its sunward faces
  const cliff = poly([...spline([[110, 610], [128, 520], [150, 440], [176, 380], [168, 330], [196, 280], [214, 236], [196, 196], [214, 160], [250, 150], [310, 146]], 6), [310, 610]]);
  s.figure(`<path d="${cliff}"/>`, { fill: '#3e2c2c', rim: '#ffcf96', offsets: [[-1, -0.6], [-0.6, -1]], rimOp: 0.85, shade: 0.55, edge: 0.4, light: [-1, -0.2] });
  // strata and sun-lit facets
  s.add(`<path d="${line([[140, 470], [190, 462], [250, 470], [310, 462]])}${line([[160, 404], [210, 398], [260, 404], [310, 398]])}${line([[184, 330], [230, 324], [310, 330]])}${line([[204, 262], [250, 258], [310, 262]])}" stroke="#7a5446" stroke-width="1.2" fill="none" opacity=".55"/>`);
  s.add(`<path d="${U(poly([[128, 520], [150, 440], [160, 446], [140, 524]]), poly([[176, 380], [168, 330], [178, 334], [186, 382]]), poly([[214, 236], [196, 196], [206, 198], [222, 236]]))}" fill="#f6b27a" opacity=".35"/>`);
  // facets of the rock catching the low sun, and grass where the slope eases
  // the sun's warmth on the upper rock
  s.add(`<path d="${cliff}" fill="${s.linU(120, 160, 300, 520, [[0, '#ffb27a', 0.22], [0.5, '#ffb27a', 0.06], [1, '#ffb27a', 0]])}"/>`);
  // buttresses: vertical ribs of rock, a sunlit edge on each
  const ribs = [[196, 250, 300, 14], [244, 210, 330, 18], [282, 200, 320, 16], [178, 400, 520, 16], [230, 420, 560, 20], [276, 400, 580, 18]];
  s.add(`<path d="${U(ribs.map(([x, y0, y1, w]) => poly([[x, y0], [x + w * 0.5, y0 - 6], [x + w, y0 + 4], [x + w * 0.9, y1], [x + w * 0.1, y1 + 8]])))}" fill="#2e2022" opacity=".55"/>`);
  s.add(`<path d="${ribs.map(([x, y0, y1, w]) => `M${f1(x)},${y0}L${f1(x + w * 0.1)},${y1 + 8}`).join('')}" stroke="#ffbf86" stroke-width="1.2" opacity=".45"/>`);
  // ledges where grass holds on, catching the light
  for (const [x0, x1, y] of [[178, 252, 384], [216, 300, 302], [156, 236, 474]]) s.add(`<path d="${line([[x0, y + 1], [(x0 + x1) / 2, y - 2], [x1, y + 1]])}" stroke="#ffc890" stroke-width="1.4" fill="none" opacity=".5"/>`);
  live.grass({ seed: 2208, x0: 182, x1: 250, base: 382, depth: 3, h: [4, 7], n: 6, fill: '#2a3420', lit: '#ffd8a0' });
  live.grass({ seed: 2209, x0: 220, x1: 298, base: 300, depth: 3, h: [4, 7], n: 6, fill: '#2a3420', lit: '#ffd8a0' });
  live.grass({ seed: 2210, x0: 160, x1: 234, base: 472, depth: 3, h: [4, 7], n: 6, fill: '#2a3420', lit: '#ffd8a0' });
  // surf breaking at the cliff's foot
  s.add(`<path d="${line([[106, 596], [118, 584], [130, 588], [140, 576]])}" stroke="#f8efe0" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>`);
  // the stair cut into the rock: a pale zigzag with steps
  const STAIR = [[140, 600], [150, 520], [176, 470], [172, 410], [168, 372], [196, 336], [228, 300], [234, 272], [212, 236], [204, 208], [206, 188]];
  const sw = STAIR.map((_, i) => 8 - (i / (STAIR.length - 1)) * 4);
  s.layer(taper(STAIR, sw, { per: 6 }), '#1a1010', { blur: 1.4, extra: 'opacity=".5" transform="translate(1 1.6)"' });
  s.path(taper(STAIR, sw, { per: 6 }), s.linU(0, 600, 0, 190, [[0, '#d8b490'], [1, '#f2d0a0']]));
  let steps = '';
  const sp = spline(STAIR, 6);
  for (let i = 2; i < sp.length - 1; i += 2) { const [x, y] = sp[i], wd = 8 - (i / sp.length) * 4; steps += `M${f1(x - wd / 2)},${f1(y)}h${f1(wd)}`; }
  s.add(`<path d="${steps}" stroke="#8a6448" stroke-width=".7" opacity=".7"/>`);
  // the eyrie on the headland: a broken round tower, arched windows, banners in the wind
  const tw = U(poly([[188, 196], [190, 140], [194, 132], [200, 138], [206, 128], [212, 136], [218, 130], [222, 140], [224, 196]]), quad(184, 192, 44, 6));
  s.figure(`<path d="${tw}"/>`, { fill: '#2a2228', rim: '#ffd8a0', offsets: [[-0.9, -0.6], [-0.5, -1]], rimOp: 0.85, shade: 0.4 });
  s.bloom(`<path d="${U(poly([[198, 168], [198, 158], [202, 154], [206, 158], [206, 168]]), poly([[210, 150], [210, 142], [213, 139], [216, 142], [216, 150]]))}" fill="#ffc874"/>`, { sd: 1.6, k: 1.3 });
  live.add(`<g class="sway" style="--t:1.6s"><path d="M222,132L246,128L238,134L248,138L222,140Z" fill="#c84a3a" opacity=".9"/></g><g class="sway" style="--t:1.9s;--d:-.7s"><path d="M190,144L170,140L176,146L168,150L190,150Z" fill="#3a7a9a" opacity=".9"/></g>`);
  s.add(`<path d="M222,130V142M190,142V152" stroke="#1a1418" stroke-width="1"/>`);
  // the wind: streaks combing past the tower, gulls riding it
  live.add(`<g class="drift" opacity=".35">${[[150, 116, 90], [180, 168, 70], [120, 250, 60]].map(([x, y, w]) => `<path d="${line([[x - w / 2, y + 3], [x, y], [x + w / 2, y + 2]])}" stroke="#fff4e0" stroke-width=".7" fill="none" stroke-linecap="round"/>`).join('')}</g>`);
  live.add(`<g class="float" style="--t:5s"><path d="${U(gull(150, 96, 0.9, -6), gull(176, 84, 0.7, 4), gull(118, 110, 0.6, -10))}" fill="#2a2030"/></g>`);
  live.add(`<g class="float" style="--t:7s;--d:-3s"><path d="${U(gull(250, 230, 0.6, 8), gull(268, 214, 0.5, -4))}" fill="#3a2a30"/></g>`);
  // grass on the ledges, bent by the wind
  live.grass({ seed: 2204, x0: 196, x1: 300, base: 150, depth: 6, h: [4, 8], n: 9, fill: '#2a3420', lit: '#ffd8a0' });
  live.grass({ seed: 2205, x0: 140, x1: 300, base: 598, depth: 4, h: [10, 20], n: 18, fill: '#1c1a16', lit: '#ffcf96' });
  // spray at the cliff's foot
  live.add(particles({ seed: 2206, n: 10, x: [112, 150], y: [570, 600], r: [0.6, 1.4], fill: '#f4ecdc', cls: 'rise', op: [0.3, 0.6], t: [3, 5] }));
  s.finish({ hi: '#ffd7a0', lo: '#1e1a3a', at: sun, reach: 520, grade: 0.32, vignette: 0.34, grain: 0.06 });
  return { spots: { rounds: [[170, 378], [232, 288], [206, 200]] } };
}

// The Pass: a switchback between two giant shoulders of rock, ember veins
// in the stone and two eyes high on the left: Ymra, the mountain itself.
function pass(s, live) {
  s.rect(s.lin([[0, '#1c1630'], [0.16, '#3a2240'], [0.28, '#8a3e4a'], [0.36, '#e88a5a'], [0.42, '#f8c27a']]));
  // the light through the notch
  s.glow(150, 214, 200, '#ffb070', 0.6);
  s.shafts({ cx: 150, cy: 214, n: 14, from: 60, to: 120, len: 420, spread: 2.6, color: '#ffd8a0', op: 0.14, seed: 2301 });
  s.glow(150, 214, 36, '#fff0c8', 0.85);
  // far peaks through the gap
  s.layer(ridge({ seed: 2302, base: 222, amp: 26, freq: 5, peaks: true, x0: 110, x1: 190, bottom: 260 }), '#a85a5a', { blur: 0.9 });
  s.haze(190, 236, '#ffb080', 0.4);
  // the two shoulders: the left one is a face in profile (brow, nose, chin), the right a sheer wall
  const left = poly([...spline([[-10, 60], [40, 70], [70, 96], [94, 118], [104, 140], [96, 152], [112, 170], [106, 184], [124, 214], [134, 238], [120, 300], [96, 420], [62, 560], [44, 610]], 6), [-10, 610]]);
  const right = poly([...spline([[310, 50], [266, 72], [226, 120], [204, 156], [186, 196], [168, 236], [180, 300], [204, 420], [238, 560], [256, 610]], 6), [310, 610]]);
  s.figure(`<path d="${left}"/>`, { fill: '#2a1a24', rim: '#ffb07a', offsets: [[1, -0.6], [0.6, -1]], rimOp: 0.8, shade: 0.55, edge: 0.4, light: [1, -0.2] });
  s.figure(`<path d="${right}"/>`, { fill: '#241622', rim: '#ffb07a', offsets: [[-1, -0.6], [-0.6, -1]], rimOp: 0.8, shade: 0.55, edge: 0.4, light: [-1, -0.2] });
  // the eyes, half open, and the ember veins running through the rock
  s.bloom(`<path d="${U(ell(80, 112, 6, 1.6, 8), ell(56, 104, 5, 1.4, 8))}" fill="#ffb44a"/>`, { sd: 2, k: 1.4 });
  const veins = line([[30, 160], [48, 190], [44, 228], [62, 262], [58, 300]]) + line([[84, 230], [96, 268], [90, 310], [108, 350]]) + line([[262, 140], [246, 180], [256, 220], [236, 262]]) + line([[226, 300], [242, 340], [230, 380]]);
  s.bloom(`<path d="${veins}" stroke="#ff8a3a" stroke-width="1.4" fill="none"/>`, { sd: 2.2, k: 1.3 });
  live.add(particles({ seed: 2303, n: 16, x: [30, 260], y: [200, 380], r: [0.5, 1.1], fill: '#ffb060', cls: 'rise', op: [0.5, 0.9], t: [5, 8] }));
  // the valley floor rising to the notch: rock and scree between the shoulders
  const floor = poly([...spline([[40, 612], [64, 556], [98, 418], [122, 300], [136, 242], [150, 240], [166, 242], [178, 300], [202, 418], [236, 556], [260, 612]], 6)]);
  s.path(floor, s.linU(0, 240, 0, 610, [[0, '#5a3436'], [0.25, '#3a2430'], [1, '#1a1018']]));
  s.add(`<path d="${line([[136, 242], [150, 240], [166, 242]])}" stroke="#ffd0a0" stroke-width="1.6" fill="none" opacity=".7"/>`);
  s.add(`<ellipse cx="150" cy="276" rx="40" ry="50" fill="${s.radU(150, 250, 64, [[0, '#ffb07a', 0.26], [1, '#ffb07a', 0]])}"/>`);
  s.add(`<path d="${dots(Array.from({ length: 70 }, (_, i) => { const R = rng(2310 + i), y = 260 + R() ** 0.7 * 340, half = 10 + (y - 250) * 0.26; return [150 + (R() - 0.5) * half * 2, y, 0.5 + R() * 1.2]; }))}" fill="#4a3038" opacity=".6"/>`);
  // the switchback trail up to the notch, worn pale
  const TRAIL = [[150, 604], [112, 526], [100, 462], [118, 412], [118, 386], [146, 352], [172, 322], [168, 300], [154, 272], [148, 252], [150, 238]];
  const tw = TRAIL.map((_, i) => 9 - (i / (TRAIL.length - 1)) * 5);
  s.layer(taper(TRAIL, tw, { per: 6 }), '#100808', { blur: 1.4, extra: 'opacity=".5" transform="translate(1 1.6)"' });
  s.path(taper(TRAIL, tw, { per: 6 }), s.linU(0, 600, 0, 220, [[0, '#a8806a'], [0.6, '#d8a07a'], [1, '#ffd8a8']]));
  // boulders along the way, and pines clinging to the shoulders
  const B = [[64, 470, 16, 12], [170, 430, 12, 9], [228, 380, 18, 13], [128, 330, 8, 6], [40, 360, 12, 9], [258, 444, 14, 11], [84, 540, 14, 10]];
  s.figure(`<path d="${U(B.map(([x, y, rx, ry]) => blob([[x - rx, y + ry * 0.4], [x - rx * 0.7, y - ry * 0.6], [x, y - ry], [x + rx * 0.8, y - ry * 0.5], [x + rx, y + ry * 0.4]], 4)))}"/>`, { fill: '#1e1218', rim: '#ffb07a', offsets: [[0.6, -0.9]], rimOp: 0.6, shade: 0.4 });
  s.figure(`<path d="${pines({ seed: 2304, base: 300, x0: 6, x1: 70, h: [16, 26], gap: [8, 12] })}${pines({ seed: 2305, base: 330, x0: 250, x1: 300, h: [18, 28], gap: [8, 12] })}"/>`, { fill: '#160c12', rim: '#ffb07a', offsets: [[0.7, -0.6]], rimOp: 0.55 });
  // near rocks framing the bottom, grass in the draught from the pass
  s.figure(`<path d="${U(blob([[-10, 600], [-6, 552], [26, 534], [60, 560], [70, 600]], 5), blob([[230, 600], [244, 560], [280, 548], [310, 566], [310, 600]], 5))}"/>`, { fill: '#100a0e', rim: '#ffb07a', offsets: [[0.5, -0.8]], rimOp: 0.4 });
  live.grass({ seed: 2306, x0: 70, x1: 230, base: 600, depth: 4, h: [9, 16], n: 14, fill: '#1a1214', lit: '#ffb07a' });
  live.add(`<g class="drift"><path d="${U(ell(150, 250, 60, 4), ell(110, 270, 40, 3))}" fill="#ffd0b0" opacity=".12"/></g>`);
  s.finish({ faction: ['ember', 'verdant'], at: [150, 214], reach: 460, grade: 0.32, vignette: 0.44, grain: 0.06 });
  return { spots: { rounds: [[118, 386], [168, 302], [150, 232]] } };
}

// The Fields at Night: a path through moonlit wheat, a sky full of moths
// and, against an enormous moon, the old tree where Lumen waits.
function fields(s, live) {
  s.rect(s.lin([[0, '#06081c'], [0.2, '#141a3c'], [0.36, '#283258'], [0.44, '#3a4268']]));
  live.add(particles({ seed: 2401, n: 34, x: [4, 296], y: [4, 170], r: [0.3, 0.8], fill: '#fff8e8', cls: 'twinkle', op: [0.3, 1], t: [2.5, 6] }));
  // the moon, huge and low behind the tree
  const mo = [150, 196];
  s.glow(mo[0], mo[1], 210, '#c8d0ff', 0.4);
  s.glow(mo[0], mo[1], 86, '#eef0ff', 0.55);
  s.add(`<circle cx="${mo[0]}" cy="${mo[1]}" r="58" fill="${s.radU(mo[0] - 10, mo[1] - 12, 70, [[0, '#fbf8ea'], [0.8, '#e6e2cc'], [1, '#cfcab2']])}"/>`);
  s.add(`<path d="${dots([[132, 180, 9], [168, 214, 6], [160, 170, 4], [126, 214, 5]])}" fill="#cfc8ae" opacity=".5"/>`);
  // the moths across the moon: dark wings in front of it, glowing ones everywhere else
  s.add(`<path d="${U(Array.from({ length: 26 }, (_, i) => { const R = rng(2402 + i), a = R() * Math.PI * 2, r = 20 + R() * 46, x = mo[0] + Math.cos(a) * r, y = mo[1] + Math.sin(a) * r * 0.8, k = 0.6 + R() * 0.8; return U(ell(x - 1.6 * k, y, 1.8 * k, 1.1 * k, -20), ell(x + 1.6 * k, y, 1.8 * k, 1.1 * k, 20)); }))}" fill="#1a1626" opacity=".85"/>`);
  live.motes({ seed: 2403, n: 46, x: [20, 280], y: [90, 330], r: [0.4, 1.1], fill: '#fff0b8', hot: '#fffbe8', cls: 'float', op: [0.5, 1], t: [4, 9] });
  live.motes({ seed: 2404, n: 18, x: [60, 240], y: [200, 380], r: [0.3, 0.8], fill: '#fff0b8', cls: 'twinkle', op: [0.4, 0.9], t: [1.6, 3.6] });
  // the far field line and the old tree, black against the moon
  s.layer(ledge([[-10, 236], [80, 230], [150, 234], [220, 228], [310, 234]], 260), '#16202a', { blur: 0.5 });
  const tree = U(taper([[150, 240], [148, 212], [152, 186]], [9, 6, 4]), taper([[150, 206], [128, 188], [112, 184]], [3, 1.6, 0.6]), taper([[151, 198], [172, 178], [190, 176]], [3, 1.6, 0.6]),
    blob([[110, 186], [118, 162], [136, 150], [158, 148], [178, 156], [194, 174], [186, 188], [160, 180], [140, 182]], 5));
  s.figure(`<path d="${tree}"/>`, { fill: '#0a0c16', rim: '#dfe4ff', offsets: [[0, -1], [-0.8, -0.6], [0.8, -0.6]], rimOp: 0.7 });
  // the wheat: silver under the moon, in waves toward us, a path through it
  s.path(ledge([[-10, 238], [80, 236], [150, 240], [220, 236], [310, 238]], 610), s.linU(0, 240, 0, 610, [[0, '#5a5e6a'], [0.25, '#8a8266'], [0.6, '#5a5038'], [1, '#221e14']]));
  // the wheat as a texture of ears, silver-gold, smaller and denser with distance
  {
    const R8 = rng(2410);
    let ears = '', lit = '';
    for (let i = 0; i < 900; i++) {
      const u = R8(), y = 246 + u ** 1.5 * 340, k = 0.3 + (y - 246) / 340 * 1.6, x = -8 + R8() * 316;
      const e = ell(x, y, 0.7 * k, 2.2 * k, (R8() - 0.5) * 30, 6);
      if (R8() < 0.55) lit += e; else ears += e;
    }
    s.add(`<path d="${ears}" fill="#3a3220" opacity=".55"/><path d="${lit}" fill="#d8c890" opacity=".42"/>`);
  }
  // the moon's sheen running across the field toward us
  s.add(`<ellipse cx="150" cy="300" rx="150" ry="60" fill="${s.radU(150, 280, 160, [[0, '#e8e4c8', 0.22], [1, '#e8e4c8', 0]])}"/>`);
  const PATH = [[150, 600], [124, 500], [104, 420], [118, 372], [160, 330], [196, 300], [186, 270], [160, 252], [150, 242]];
  const pw = PATH.map((_, i) => 10 - (i / (PATH.length - 1)) * 7);
  s.path(taper(PATH, pw, { per: 6 }), s.linU(0, 600, 0, 240, [[0, '#7a6a52'], [0.6, '#9a9a90'], [1, '#c8ccd8']]), 'opacity=".85"');
  // a gate at the field's edge, a scarecrow in the middle
  s.figure(`<path d="${U(quad(68, 352, 3, 30), quad(126, 352, 3, 30), quad(66, 356, 66, 3), quad(66, 368, 66, 3), poly([[70, 360], [73, 358], [124, 380], [121, 382]]))}"/>`, { fill: '#14120e', rim: '#dfe4ff', offsets: [[0, -0.8]], rimOp: 0.55 });
  s.figure(`<path d="${U(quad(214, 262, 2.4, 40), quad(200, 274, 30, 2.4), ell(215.2, 258, 5, 5.4), poly([[208, 256], [215, 246], [222, 256]]), poly([[206, 276], [224, 276], [228, 300], [202, 300]]))}"/>`, { fill: '#14120e', rim: '#dfe4ff', offsets: [[0, -0.9], [-0.5, -0.7]], rimOp: 0.6 });
  // the near wheat, tall, its heads nodding
  const wheat = (seed, x0, x1, base, n, hh) => {
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = x0 + R() * (x1 - x0), y = base + R() * 10, h = hh[0] + R() * (hh[1] - hh[0]), lean = (R() - 0.5) * 6;
      const stalk = taper([[x, y], [x + lean * 0.5, y - h * 0.6], [x + lean, y - h]], [1, 0.7, 0.4], { per: 3 });
      const head = U(ell(x + lean, y - h - 3, 1.5, 4, lean * 4, 10));
      const ears = U([0, 1, 2, 3].map((j) => ell(x + lean - 1.2 + (j % 2) * 2.4, y - h - 1 - j * 2.6, 1.3, 2.6, (j % 2 ? 22 : -22) + lean * 3, 8)));
      live.add(`<g class="sway" style="--t:${f1(3 + R() * 2)}s;--d:${f1(-R() * 3)}s"><path d="${stalk}${ears}" fill="#221e12"/><path d="${ears}" fill="#e8dcb0" opacity=".45" transform="translate(-.3 -.4)"/></g>`);
    }
  };
  wheat(2405, -6, 306, 566, 46, [28, 48]);
  wheat(2406, -6, 306, 486, 30, [16, 26]);
  s.finish({ faction: ['radiant', 'umbral'], at: mo, reach: 460, grade: 0.3, vignette: 0.46, grain: 0.06 });
  return { spots: { rounds: [[98, 378], [196, 304], [150, 232]] } };
}

// The Wall: a ramp up to the great gate between two towers, torches along
// the battlements, banners, and Halvard on top of the gatehouse.
function wall(s, live) {
  s.rect(s.lin([[0, '#080c20'], [0.22, '#18204a'], [0.4, '#2c3462']]));
  live.add(particles({ seed: 2501, n: 30, x: [4, 296], y: [4, 110], r: [0.3, 0.8], fill: '#fff8e8', cls: 'twinkle', op: [0.3, 1], t: [2.5, 6] }));
  s.glow(250, 80, 120, '#b0bcff', 0.35);
  s.add(`<circle cx="250" cy="80" r="16" fill="#f4efd8"/>`);
  // the wall: a great face of stone across the whole picture, battlements, two towers, the gate
  const top = 150;
  const merl = [];
  for (let x = -6; x < 306; x += 13) merl.push(quad(x, top - 9, 8, 10));
  const towers = [[70, 96, 44], [186, 96, 44]].map(([x, t, w]) => U(quad(x, t, w, 300), ...[0, 1, 2, 3].map((k) => quad(x + 1 + k * (w - 2) / 4, t - 9, (w - 2) / 4 - 3, 9))));
  const wallD = U(quad(-10, top, 320, 300), merl, towers);
  s.figure(`<path d="${wallD}"/>`, { fill: '#2a2c4a', rim: '#c8d0ff', offsets: [[0.8, -0.8], [0.4, -1]], rimOp: 0.7, shade: 0.35, edge: 0.3, light: [0.8, -0.6] });
  // courses of stone
  let courses = '';
  for (let y = top + 12; y < 450; y += 12) courses += `M-10,${y}H310`;
  s.add(`<path d="${courses}" stroke="#1c1e36" stroke-width=".8" opacity=".6"/>`);
  let joints = '';
  for (let y = top + 12, r = 0; y < 450; y += 12, r++) for (let x = (r % 2) * 9; x < 300; x += 18) joints += `M${x},${y}v12`;
  s.add(`<path d="${joints}" stroke="#1c1e36" stroke-width=".6" opacity=".45"/>`);
  // the moon's side of the towers
  s.add(`<path d="${U(quad(96, 96, 18, 300), quad(212, 96, 18, 300))}" fill="#5a62a0" opacity=".2"/>`);
  // the gate: arched, studded, light leaking around it
  const gate = U(quad(118, 276, 64, 120), ell(150, 276, 32, 30, 0, 26));
  s.glow(150, 330, 70, '#ffb060', 0.4);
  s.path(gate, s.linU(0, 246, 0, 396, [[0, '#4a2c1c'], [1, '#2a180e']]));
  s.add(`<path d="M150,250V396M118,300H182M118,340H182M118,376H182" stroke="#1a0e08" stroke-width="2"/>`);
  s.add(`<path d="${dots(Array.from({ length: 24 }, (_, i) => [124 + (i % 6) * 10.4, 290 + Math.floor(i / 6) * 28, 1.1]))}" fill="#c8a26a" opacity=".7"/>`);
  s.add(`<path d="M150,248V396" stroke="#ffcf8a" stroke-width="1.2" opacity=".7"/>`);
  // shields along the wall, banners from the towers
  const shields = [[30, 220], [258, 220], [30, 300], [258, 300]];
  s.figure(`<path d="${U(shields.map(([x, y]) => U(blob([[x - 9, y - 10], [x + 9, y - 10], [x + 9, y + 2], [x, y + 13], [x - 9, y + 2]], 3))))}"/>`, { fill: '#6a5a3a', rim: '#ffe0a0', offsets: [[0.6, -0.6]], rimOp: 0.6 });
  s.add(`<path d="${U(shields.map(([x, y]) => U(ell(x, y - 2, 3.4, 3.4, 0, 14), ...[0, 45, 90, 135, 180, 225, 270, 315].map((a) => taper([[x + Math.cos(rad(a)) * 4.4, y - 2 + Math.sin(rad(a)) * 4.4], [x + Math.cos(rad(a)) * 7, y - 2 + Math.sin(rad(a)) * 7]], [1.4, 0.2], { per: 2 })))))}" fill="#f2d27a" opacity=".8"/>`);
  for (const [x, c] of [[92, '#c8a03a'], [208, '#3a7a4a']]) live.add(`<g class="sway" style="--t:3.4s;--d:${x / -60}s;transform-origin:50% 0"><path d="M${x - 9},120H${x + 9}V190L${x},180L${x - 9},190Z" fill="${c}" opacity=".85"/><path d="M${x - 9},120H${x + 9}" stroke="#2a1c10" stroke-width="2"/></g>`);
  // torches along the battlements and at the gate, flickering
  for (const [x, y] of [[20, 146], [60, 146], [118, 260], [182, 260], [240, 146], [280, 146]]) {
    s.add(`<path d="M${x},${y + 2}v8" stroke="#1a120c" stroke-width="1.6"/>`);
    live.add(`<ellipse class="breathe" style="--d:${f1(-x / 50)}s" cx="${x}" cy="${y}" rx="7" ry="9" fill="${live.rad([[0, '#fff2c4', 0.95], [0.4, '#ffb04a', 0.6], [1, '#ff7a2a', 0]])}"/>`);
  }
  // Halvard on the gatehouse between the towers: a shield taller than him
  const hv = U(taper([[150, 152], [150, 132]], [7, 6]), ell(150, 128, 3.2, 3.6), blob([[140, 154], [141, 132], [146, 126], [148, 154]], 3));
  s.figure(`<path d="${hv}"/>`, { fill: '#10121e', rim: '#e8ecff', offsets: [[0.8, -0.8], [0, -1]], rimOp: 0.85 });
  // the ramp up to the gate, wide below
  s.path(poly([[-10, 450], [310, 450], [310, 610], [-10, 610]]), s.lin([[0, '#1a2030'], [1, '#0c0e16']]));
  const ramp = poly([[-20, 610], [320, 610], [194, 400], [106, 400]]);
  s.path(ramp, s.linU(0, 610, 0, 400, [[0, '#3a3440'], [1, '#5a5468']]));
  let slabs = '';
  for (let k = 1; k < 14; k++) { const t = k / 14, y = 400 + (610 - 400) * t ** 1.4, half = 44 + (170 - 44) * t ** 1.4; slabs += `M${f1(150 - half)},${f1(y)}H${f1(150 + half)}`; }
  s.add(`<path d="${slabs}" stroke="#24202a" stroke-width="1" opacity=".7"/><path d="M106,400L-20,610M194,400L320,610" stroke="#c8ccff" stroke-width="1" opacity=".3"/>`);
  s.add(`<ellipse cx="150" cy="404" rx="70" ry="12" fill="${s.radU(150, 404, 70, [[0, '#ffb060', 0.35], [1, '#ffb060', 0]])}"/>`);
  // the guard's palisade of shields at the foot of the ramp
  // the guard's shield wall at the foot of the ramp: round shields, rims and bosses, spears behind
  const pal = [], spears = [];
  for (let i = 0; i < 9; i++) { const x = 42 + i * 27, y = 392 + Math.abs(i - 4) * 1.4; pal.push(ell(x, y, 12, 12, 0, 22)); spears.push(taper([[x + 6, y + 8], [x + 9, y - 36]], [1.2, 0.8], { per: 2 }), poly([[x + 7.6, y - 36], [x + 9.4, y - 44], [x + 10.6, y - 36]])); }
  s.figure(`<path d="${U(spears)}"/>`, { fill: '#1a1620', rim: '#ffd8a0', offsets: [[0.5, -0.6]], rimOp: 0.6 });
  s.figure(`<path d="${U(pal)}"/>`, { fill: '#4a3a2a', rim: '#ffd8a0', offsets: [[0, -0.9]], rimOp: 0.6, shade: 0.4 });
  s.add(`<path d="${pal.map((_, i) => { const x = 42 + i * 27, y = 392 + Math.abs(i - 4) * 1.4; return `M${x - 9},${y}a9,9 0 1,0 18,0a9,9 0 1,0 -18,0`; }).join('')}" stroke="#c8a060" stroke-width="1" fill="none" opacity=".7"/>`);
  s.add(`<path d="${dots(pal.map((_, i) => [42 + i * 27, 392 + Math.abs(i - 4) * 1.4, 2.4]))}" fill="#e8c880"/>`);
  live.grass({ seed: 2502, x0: -6, x1: 60, base: 604, depth: 4, h: [9, 16], n: 8, fill: '#14121a', lit: '#c8d0ff' });
  live.grass({ seed: 2503, x0: 240, x1: 306, base: 604, depth: 4, h: [9, 16], n: 8, fill: '#14121a', lit: '#c8d0ff' });
  s.finish({ faction: ['radiant', 'verdant'], at: [150, 330], reach: 420, grade: 0.28, vignette: 0.46, grain: 0.06 });
  return { spots: { rounds: [[150, 376], [150, 300], [150, 160]] } };
}

// ── World 2: The Fog Country ───────────────────────────────────────
// a bank of fog: a long soft lens from x0 to x1 around y, th thick
const fogBank = (x0, x1, y, th) => {
  const d = x1 - x0;
  return blob([[x0, y], [x0 + d * 0.22, y - th * 0.75], [x0 + d * 0.5, y - th], [x0 + d * 0.78, y - th * 0.7], [x1, y], [x0 + d * 0.72, y + th * 0.55], [x0 + d * 0.3, y + th * 0.65]], 6);
};
// fog drifting (the overlay): banks [x0, x1, y, th, opacity], each its own pace
const drifting = (live, banks, color) => live.add(banks.map(([x0, x1, y, th, op], i) => `<g class="drift" style="animation-duration:${14 + (i % 3) * 5}s;animation-delay:${-i * 3}s"><path d="${fogBank(x0, x1, y, th)}" fill="${color}" opacity="${op}"/></g>`).join(''));
// a dead tree: a trunk and crooked branches
const deadTree = (x, base, hgt, R) => {
  const top = [x + (R() - 0.5) * 6, base - hgt], parts = [taper([[x, base], [x + (R() - 0.5) * 4, base - hgt * 0.5], top], [hgt * 0.09, hgt * 0.06, hgt * 0.02], { per: 4 })];
  for (let k = 0; k < 4; k++) {
    const t = 0.4 + k * 0.15, y = base - hgt * t, dir = k % 2 ? 1 : -1, len = hgt * (0.45 - k * 0.07);
    parts.push(taper([[x, y], [x + dir * len * 0.5, y - len * 0.35], [x + dir * len, y - len * (0.3 + R() * 0.4)]], [hgt * 0.035, hgt * 0.02, hgt * 0.006], { per: 4 }));
  }
  return U(parts);
};

// 300 × 760, read bottom to top, east from the Wall: its gate standing open,
// firelit, at the bottom; the river and the red ford; the marsh and its
// causeway; the barrows of the bone garden; the storm spire on its crag; and
// at the top the still black mere the fog rises from, under a pale light it
// hides. Fog lies between them all, thicker the farther east you look.
function fogCountry(s, live) {
  const w = s.w;
  const ROAD = [[150, 742], [140, 712], [112, 676], [96, 640], [112, 604], [158, 574], [204, 518], [182, 474], [136, 440], [110, 398], [136, 352], [176, 308], [194, 262], [172, 216], [154, 176], [150, 128]];
  // the sky: deep at the very top, then all fog, pale grey-violet
  s.rect(s.lin([[0, '#10132a'], [0.06, '#1c1f38'], [0.16, '#3e3d58'], [0.3, '#504e64'], [0.62, '#46424e'], [1, '#2a2226']]));
  live.add(particles({ seed: 2100, n: 14, x: [6, 294], y: [4, 40], r: [0.3, 0.7], fill: '#f4f0ff', cls: 'twinkle', op: [0.2, 0.7], t: [3, 6] }));
  // a pale light somewhere behind the fog, over the mere
  s.glow(150, 58, 200, '#cfc8f0', 0.36);
  s.glow(150, 58, 44, '#f0eaff', 0.42);
  s.add('<circle cx="150" cy="58" r="14" fill="#ece6fa" opacity=".5"/>');
  // the far shore of the mere, dim
  s.layer(ridge({ seed: 2101, base: 108, amp: 14, freq: 2.4, x1: w + 8, bottom: 150 }), '#2e2e46', { blur: 0.9 });
  s.haze(88, 116, '#b4b0d4', 0.42);
  // the mere: still and black, the pale light lying on it
  const mereD = blob([[22, 134], [74, 116], [150, 110], [228, 116], [282, 134], [244, 160], [150, 170], [60, 160]], 6);
  s.path(mereD, s.linU(0, 110, 0, 170, [[0, '#48486a'], [0.35, '#1e2034'], [1, '#0c0e1a']]));
  s.add(`<ellipse cx="150" cy="136" rx="10" ry="28" fill="${s.radU(150, 136, 28, [[0, '#ece6ff', 0.5], [1, '#ece6ff', 0]])}"/>`);
  s.add(`<path d="${line([[30, 136], [80, 120], [150, 114], [226, 120], [276, 136]])}" stroke="#c8c4e8" stroke-width=".8" fill="none" opacity=".35"/>`);
  // drowned roofs showing through it, and reeds along its near shore
  s.figure(`<path d="${U(house(54, 146, 16, 5, 0.6), house(206, 148, 18, 5, 0.55), house(230, 140, 12, 4, 0.6, true))}"/>`, { fill: '#121220', rim: '#cfc8f0', offsets: [[0, -0.8]], rimOp: 0.5 });
  {
    const R = rng(2102), reeds = [];
    for (let i = 0; i < 40; i++) { const x = 20 + R() * 260, y = 160 + R() * 14 - Math.abs(x - 150) * 0.05, hh = 4 + R() * 6; reeds.push(taper([[x, y], [x + (R() - 0.5) * 2, y - hh]], [0.9, 0.2], { per: 2 })); }
    s.figure(`<path d="${U(reeds)}"/>`, { fill: '#14141e', rim: '#cfc8f0', offsets: [[0, -0.6]], rimOp: 0.4 });
  }
  // will-o'-wisps over the water
  live.motes({ seed: 2103, n: 16, x: [36, 264], y: [104, 164], r: [0.5, 1.1], fill: '#9cf0de', hot: '#f0fff8', cls: 'float', op: [0.5, 1], t: [5, 9] });
  live.motes({ seed: 2104, n: 6, x: [60, 240], y: [110, 160], r: [0.4, 0.9], fill: '#c8a8ff', cls: 'twinkle', op: [0.4, 0.9], t: [2, 4] });
  // the storm over the spire, and the crag it stands on
  s.haze(176, 206, '#bcb8d0', 0.4);
  const cloud = U(ell(196, 166, 40, 14), ell(226, 172, 32, 12), ell(170, 176, 30, 10), ell(214, 156, 26, 11), ell(250, 182, 22, 8));
  s.figure(`<path d="${cloud}"/>`, { fill: '#25283e', rim: '#a8bcff', offsets: [[0, 1], [-0.6, 0.8]], rimOp: 0.5, shade: 0.3 });
  s.add(`<path d="${Array.from({ length: 16 }, (_, i) => { const R = rng(2105 + i), x = 166 + R() * 96; return `M${f1(x)},${f1(184 + R() * 6)}l${f1(-3 - R() * 2)},${f1(16 + R() * 14)}`; }).join('')}" stroke="#b8c4e8" stroke-width=".5" opacity=".35"/>`);
  s.layer(ridge({ seed: 2120, base: 300, amp: 26, freq: 3.2, peaks: true, x1: w + 8, bottom: 340 }), '#3a3a52', { blur: 1 });
  s.haze(286, 316, '#b0aec8', 0.4);
  const crag = poly([...spline([[138, 312], [160, 290], [176, 262], [190, 240], [204, 234], [218, 244], [232, 268], [252, 292], [270, 312]], 6), [270, 330], [138, 330]]);
  s.figure(`<path d="${crag}"/>`, { fill: '#2a2a3e', rim: '#c4d0ff', offsets: [[-0.6, -0.9], [0.5, -0.8]], rimOp: 0.6, shade: 0.4, light: [0, -1] });
  // the spire: white, tall, a lit window and a crown of rods
  const tower = U(poly([[196, 238], [199, 186], [209, 186], [212, 238]]), quad(196, 180, 16, 7), ...[0, 1, 2].map((k) => quad(197 + k * 5.4, 175, 3.4, 5)));
  s.figure(`<path d="${tower}"/>`, { fill: '#c8ccd8', rim: '#ffffff', offsets: [[-0.5, -0.6]], rimOp: 0.6, shade: 0.5, light: [-1, -0.4] });
  s.add('<path d="M199,175V164M204,175V160M209,175V164" stroke="#2a2c3a" stroke-width=".7"/>');
  s.bloom(`<path d="${U(quad(202.5, 196, 3, 5), quad(202.5, 214, 3, 5))}" fill="#fff0c0"/>`, { sd: 1.4, k: 1.3 });
  // lightning, now and then, from the cloud to the crown
  const bolt = taper([[188, 150], [196, 156], [192, 160], [202, 166], [199, 169], [204, 175]], [1.6, 1.4, 1.2, 1, 0.8, 0.5], { per: 2 });
  live.add(`<g class="twinkle" style="--t:1.1s;--d:-.4s"><path d="${bolt}" fill="#f4f8ff"/></g>`);
  live.add(`<circle class="twinkle" style="--t:1.1s;--d:-.4s" cx="204" cy="170" r="16" fill="${live.rad([[0, '#e8f0ff', 0.7], [1, '#a8c0ff', 0]])}"/>`);
  // fog lying in the hollows between the spire and the garden
  s.haze(300, 336, '#a8a8c0', 0.45, 18);
  // the bone garden: barrows white with flowers, dead trees, old stones
  s.layer(ridge({ seed: 2121, base: 356, amp: 14, freq: 2.6, x0: -8, x1: 230, bottom: 384 }), '#363a4c', { blur: 1 });
  {
    const mounds = [[48, 382, 26, 10], [92, 372, 24, 9], [140, 388, 28, 11], [70, 420, 34, 13], [172, 426, 30, 11], [24, 416, 18, 8]];
    s.figure(`<path d="${U(mounds.map(([x, y, rx, ry]) => blob([[x - rx, y], [x - rx * 0.6, y - ry * 0.8], [x, y - ry], [x + rx * 0.6, y - ry * 0.8], [x + rx, y]], 6)))}"/>`, { fill: '#26302e', rim: '#d8e8e0', offsets: [[0.3, -0.9]], rimOp: 0.55, shade: 0.4, light: [0.3, -1] });
    const R = rng(2106), fl = [];
    for (const [x, y, rx, ry] of mounds) for (let k = 0; k < 18; k++) { const u = (R() - 0.5) * 1.7, v = R(); fl.push([x + u * rx, y - ry * (1 - u * u * 0.9) * (0.2 + v * 0.75), 0.5 + R() * 0.5]); }
    s.add(`<path d="${dots(fl)}" fill="#eef6e8" opacity=".7"/>`);
    live.motes({ seed: 2107, n: 18, x: [10, 200], y: [356, 426], r: [0.3, 0.7], fill: '#d8ffe8', cls: 'twinkle', op: [0.3, 0.8], t: [2.4, 5] });
    const Rt = rng(2108);
    s.figure(`<path d="${U(deadTree(22, 380, 30, Rt), deadTree(206, 412, 34, Rt), deadTree(120, 350, 22, Rt), quad(158, 400, 4, 7), quad(52, 396, 3.4, 6), quad(100, 404, 3.6, 6), ell(160, 400, 2, 1.4), ell(53.7, 396, 1.7, 1.2))}"/>`, { fill: '#121816', rim: '#d8e8e0', offsets: [[0.4, -0.7]], rimOp: 0.5 });
  }
  live.add(`<g class="drift"><path d="${fogBank(-30, 240, 404, 10)}" fill="#d0dcd8" opacity=".16"/></g>`);
  // the marsh: pools holding the pale sky, reeds, and the causeway across it
  s.haze(436, 466, '#9aa0a8', 0.4, 16);
  s.layer(ledge([[-10, 448], [80, 444], [160, 450], [240, 444], [310, 450]], 596), s.lin([[0, '#3a4244'], [0.5, '#2c3434'], [1, '#22282a']]), { rough: 1, seed: 2109 });
  {
    const R = rng(2110), pools = [], reeds = [];
    for (let i = 0; i < 14; i++) { const x = 10 + R() * 280, y = 462 + R() * 116, rx = 10 + R() * 22, ry = 2.6 + R() * 4; if (Math.abs(x - 180) < 30 && y < 540) continue; pools.push(ell(x, y, rx, ry, 0, 18)); for (let k = 0; k < 5; k++) reeds.push(taper([[x - rx + R() * rx * 2, y - ry + 1], [x - rx + R() * rx * 2 + (R() - 0.5) * 3, y - ry - 5 - R() * 8]], [1, 0.2], { per: 2 })); }
    s.path(U(pools), s.linU(0, 460, 0, 580, [[0, '#a6a8ba'], [1, '#6a6e84']]), 'opacity=".75"');
    s.figure(`<path d="${U(reeds)}"/>`, { fill: '#1a2020', rim: '#d8dce4', offsets: [[0, -0.6]], rimOp: 0.4 });
  }
  live.add(`<g class="drift" style="animation-delay:-6s"><path d="${fogBank(60, 340, 470, 9)}" fill="#c8ccd4" opacity=".16"/></g>`);
  // a ruined watchtower out in the marsh, from before the fog
  s.figure(`<path d="${U(poly([[54, 520], [56, 478], [60, 474], [63, 482], [66, 476], [70, 480], [72, 520]]), poly([[50, 520], [78, 520], [80, 526], [48, 526]]), quad(78, 512, 10, 8), quad(42, 514, 7, 6))}"/>`, { fill: '#26262e', rim: '#d8d8e4', offsets: [[0, -0.8], [-0.4, -0.6]], rimOp: 0.5, shade: 0.3 });
  s.add(`<path d="${U(quad(61, 488, 3, 5), quad(61, 502, 3, 5))}" fill="#14141a"/>`);
  // the river and its ford, red with a sun hidden in the fog
  s.glow(0, 616, 150, '#ff8a5a', 0.4);
  const river = poly([...spline([[-10, 598], [60, 606], [140, 618], [220, 630], [310, 640]], 6), ...spline([[310, 676], [220, 666], [140, 656], [60, 644], [-10, 636]], 6)]);
  s.path(river, s.linU(0, 600, 300, 660, [[0, '#d07a5a'], [0.35, '#8a3e3c'], [1, '#2a1a26']]));
  s.add(`<path d="${line([[-10, 598], [60, 606], [140, 618], [220, 630], [310, 640]])}" stroke="#ffc8a8" stroke-width=".9" fill="none" opacity=".45"/>`);
  live.add(Array.from({ length: 24 }, (_, i) => { const R = rng(2111 + i), x = R() * 300, y = 606 + x * 0.12 + R() * 26, len = 4 + R() * 8; return `<path class="twinkle" style="--t:${f1(1.6 + R() * 2.4)}s;--d:${f1(-R() * 3)}s" d="M${f1(x)},${f1(y)}h${f1(len)}" stroke="#ffd2b4" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`; }).join(''));
  // the old battle at the ford: spears standing in the water, a broken shield
  s.figure(`<path d="${U([[64, 640, -8], [74, 636, 6], [126, 650, -10], [134, 652, 4], [52, 626, 10]].map(([x, y, a]) => taper([[x, y], [x + a * 0.3, y - 22]], [1.1, 0.5], { per: 2 })), ell(140, 646, 5, 2.4, -14))}"/>`, { fill: '#1a1216', rim: '#ffb898', offsets: [[-0.6, -0.6]], rimOp: 0.6 });
  // trees along the banks, bare
  { const Rb = rng(2122); s.figure(`<path d="${U(deadTree(18, 600, 26, Rb), deadTree(262, 618, 30, Rb), deadTree(288, 626, 22, Rb), deadTree(196, 610, 18, Rb))}"/>`, { fill: '#1a1618', rim: '#ffc0a0', offsets: [[-0.6, -0.6]], rimOp: 0.5 }); }
  // the banks: the fields east of the Wall, grey-green in the fog
  s.layer(ledge([[-10, 672], [80, 664], [160, 676], [240, 668], [310, 680]], 700), s.lin([[0, '#3a3e36'], [1, '#262a24']]), { rough: 1.1, seed: 2112 });
  // the Wall, from the outside: battlements and towers, the gate standing open, firelit
  {
    const top = 700, merl = [];
    for (let x = -4; x < 304; x += 11) merl.push(quad(x, top - 7, 6.5, 8));
    const towers = [[22, 680, 30], [248, 680, 30]].map(([x, t, tw]) => U(quad(x, t, tw, 90), ...[0, 1, 2].map((k) => quad(x + 1 + k * (tw - 2) / 3, t - 7, (tw - 2) / 3 - 2.4, 7))));
    s.figure(`<path d="${U(quad(-10, top, 320, 70), merl, towers)}"/>`, { fill: '#2c2a3a', rim: '#d8d0e8', offsets: [[0, -1], [-0.5, -0.8]], rimOp: 0.65, shade: 0.35, light: [0, -1] });
    let courses = '';
    for (let y = top + 10; y < 770; y += 10) courses += `M-10,${y}H310`;
    s.add(`<path d="${courses}" stroke="#1c1a28" stroke-width=".7" opacity=".55"/>`);
    // the gateway, its doors swung wide, the fire inside spilling out on the road
    s.path(U(quad(124, 716, 52, 54), ell(150, 716, 26, 20, 0, 24)), s.linU(0, 696, 0, 770, [[0, '#ffcf8a'], [0.5, '#ff9a4a'], [1, '#7a3a1c']]));
    s.glow(150, 730, 70, '#ffb060', 0.5);
    s.figure(`<path d="${U(poly([[124, 716], [110, 722], [110, 770], [124, 770]]), poly([[176, 716], [190, 722], [190, 770], [176, 770]]))}"/>`, { fill: '#3a2414', rim: '#ffcf8a', offsets: [[0, -0.6]], rimOp: 0.6 });
    for (const [x, y] of [[16, 692], [80, 692], [220, 692], [284, 692], [118, 708], [182, 708]]) live.add(`<ellipse class="breathe" style="--d:${f1(-x / 50)}s" cx="${x}" cy="${y}" rx="6" ry="8" fill="${live.rad([[0, '#fff2c4', 0.95], [0.4, '#ffb04a', 0.6], [1, '#ff7a2a', 0]])}"/>`);
  }
  // the road out of the gate: warm by the fire, paler and paler into the fog
  const widths = ROAD.map((_, i) => 9.5 - (i / (ROAD.length - 1)) * 6);
  const road = taper(ROAD, widths, { per: 8 });
  s.layer(road, '#141018', { blur: 1.6, extra: 'opacity=".45" transform="translate(.8 1.4)"' });
  s.path(road, s.linU(0, 760, 0, 120, [[0, '#e8c48e'], [0.18, '#b09c86'], [0.5, '#96929a'], [1, '#aaa6c0']]));
  s.add(`<path d="${line(ROAD, 8)}" stroke="#f8f2e6" stroke-width=".8" fill="none" opacity=".3" stroke-dasharray="1.5 6" stroke-linecap="round"/>`);
  // the causeway's posts and lanterns along the road through the marsh
  {
    const pts = [[158, 574], [181, 546], [204, 518], [193, 496], [182, 474]], posts = [], lan = [];
    for (const [x, y] of pts) for (const d of [-8, 8]) { posts.push(quad(x + d - 0.8, y - 9, 1.6, 9)); lan.push([x + d, y - 10]); }
    s.figure(`<path d="${U(posts)}"/>`, { fill: '#1c1a1a', rim: '#f0e0c8', offsets: [[0, -0.6]], rimOp: 0.5 });
    live.add(lan.map(([x, y], i) => `<circle class="breathe" style="--d:${-i * 0.45}s" cx="${x}" cy="${y}" r="3" fill="${live.rad([[0, '#fff2c4', 0.95], [0.5, '#ffc46a', 0.5], [1, '#ff9a3a', 0]])}"/>`).join(''));
  }
  // the fog, drifting at every height, thicker toward the east
  drifting(live, [[-40, 200, 192, 12, 0.22], [120, 340, 214, 10, 0.18], [-40, 180, 300, 10, 0.18], [140, 340, 340, 9, 0.16], [-40, 160, 456, 9, 0.14], [100, 340, 590, 8, 0.12], [-40, 120, 690, 8, 0.1]], '#d8d4e8');
  // near grass at the foot of the Wall, either side of the gate
  live.grass({ seed: 2113, x0: -4, x1: 104, base: 762, h: [8, 16], n: 16, fill: '#1a1a20', lit: '#ffc890' });
  live.grass({ seed: 2114, x0: 196, x1: 304, base: 762, h: [8, 16], n: 16, fill: '#1a1a20', lit: '#ffc890' });
  live.grass({ seed: 2115, x0: 0, x1: 300, base: 664, depth: 20, h: [4, 8], n: 14, fill: '#262a22', lit: '#e8d8c0' });
  s.finish({ hi: '#f0e2d0', lo: '#12142a', at: [150, 730], reach: 760, grade: 0.3, vignette: 0.34, grain: 0.06 });
  return { spots: { start: [150, 742], levels: [[96, 640], [204, 518], [110, 398], [194, 262], [150, 128]] } };
}

// ── World 2's places (300 × 600, as World 1's) ────────────────────────
// The Red Ford: the river wide and shallow at dusk, red with a sun hidden in
// the fog; the ford's stones lead across, past the spears and shields of an
// old battle, to the far bank, where Vesh's banner stands by a dead tree.
function ford(s, live) {
  s.rect(s.lin([[0, '#1a1626'], [0.2, '#3a2834'], [0.34, '#7a4440'], [0.42, '#c06a52']]));
  s.glow(60, 232, 240, '#ff8a5a', 0.45);
  s.glow(60, 232, 80, '#ffc89a', 0.5);
  s.add('<circle cx="60" cy="232" r="20" fill="#ffd8b0" opacity=".45"/>');
  // the far bank: low hills in the fog, a dead tree, Vesh's banner
  s.layer(ridge({ seed: 3101, base: 218, amp: 16, freq: 2.2, x1: 308, bottom: 258 }), '#52343a', { blur: 0.9 });
  s.haze(196, 230, '#e0a088', 0.42);
  s.layer(ledge([[-10, 244], [70, 236], [150, 242], [230, 234], [310, 242]], 262), '#2a1c24', { rough: 1.1, seed: 3102 });
  s.figure(`<path d="${U(deadTree(232, 240, 52, rng(3103)), quad(186, 190, 2, 52))}"/>`, { fill: '#140c12', rim: '#ffb08a', offsets: [[-0.8, -0.6]], rimOp: 0.6 });
  live.add('<g class="sway" style="--t:3.2s;transform-origin:50% 0"><path d="M188,192H212L207,201L212,210H188Z" fill="#8a1a22" opacity=".92"/><path d="M188,192H212" stroke="#2a0c10" stroke-width="1.4"/></g>');
  // the river: wide and shallow, red where the light lies on it, dark toward us
  s.path(poly([[-10, 252], [310, 252], [310, 610], [-10, 610]]), s.linU(0, 252, 0, 610, [[0, '#d0785a'], [0.12, '#a04a40'], [0.42, '#5a2430'], [1, '#160c14']]));
  s.add(`<ellipse cx="80" cy="292" rx="130" ry="44" fill="${s.radU(70, 280, 140, [[0, '#ffb890', 0.38], [1, '#ffb890', 0]])}"/>`);
  live.add(Array.from({ length: 40 }, (_, i) => { const R = rng(3104 + i), t = R(), y = 260 + t * 300, x = 10 + R() * 280, len = 4 + R() * (6 + t * 14); return `<path class="twinkle" style="--t:${f1(1.6 + R() * 2.4)}s;--d:${f1(-R() * 3)}s" d="M${f1(x - len / 2)},${f1(y)}h${f1(len)}" stroke="#ffd0b0" stroke-width="${f1(0.6 + t * 0.9)}" stroke-linecap="round" opacity=".6"/>`; }).join(''));
  // the old battle: spears standing in the water, shields half sunk
  const R = rng(3150), spears = [];
  for (let i = 0; i < 16; i++) { const x = R() < 0.5 ? 10 + R() * 90 : 200 + R() * 92, y = 270 + R() * 230, k = 0.4 + (y - 270) / 230 * 1.4, a = (R() - 0.5) * 30; spears.push(taper([[x, y], [x + a * 0.3 * k, y - 30 * k]], [1.3 * k, 0.6 * k], { per: 2 }), poly([[x + a * 0.3 * k - 1.4 * k, y - 30 * k], [x + a * 0.33 * k, y - 38 * k], [x + a * 0.3 * k + 1.4 * k, y - 30 * k]])); }
  const shields = [[44, 420, 1], [250, 360, 0.8], [228, 470, 1.2], [80, 330, 0.7]].map(([x, y, k]) => ell(x, y, 9 * k, 4 * k, -12));
  s.figure(`<path d="${U(spears, shields)}"/>`, { fill: '#1e1218', rim: '#ffb898', offsets: [[-0.6, -0.7]], rimOp: 0.6 });
  // the ford: flat stones across, from our bank to the far one
  const PATH = [[150, 600], [144, 540], [132, 470], [130, 400], [150, 352], [174, 300], [168, 262], [150, 232]];
  const stones = [];
  const tops = [], Rs = rng(3160);
  for (let i = 0; i < PATH.length - 1; i++) for (let k = 0; k < 2; k++) {
    const t = (k + 0.3) / 2, [ax, ay] = PATH[i], [bx, by] = PATH[i + 1], x = ax + (bx - ax) * t + (Rs() - 0.5) * 6, y = ay + (by - ay) * t, z = 2.4 + ((y - 220) / 380) * 13;
    stones.push(blob(Array.from({ length: 7 }, (_, j) => { const a = (j / 7) * Math.PI * 2, r = 1 + (Rs() - 0.5) * 0.4; return [x + Math.cos(a) * z * 1.2 * r, y + Math.sin(a) * z * (Math.sin(a) < 0 ? 0.75 : 0.45) * r]; }), 4));
    tops.push(ell(x - z * 0.2, y - z * 0.35, z * 0.7, z * 0.22, -6, 12));
  }
  s.figure(`<path d="${U(stones)}"/>`, { fill: '#3e2c2e', rim: '#ffc0a0', offsets: [[0, -0.9], [-0.5, -0.6]], rimOp: 0.65, shade: 0.45, light: [-0.4, -1] });
  s.add(`<path d="${U(tops)}" fill="#ffc8a8" opacity=".3"/>`);
  // our bank: dark mud and reeds, bending
  s.path(ledge([[-10, 566], [80, 558], [160, 572], [240, 562], [310, 568]], 610), s.lin([[0, '#2a1a1c'], [1, '#100a0c']]));
  live.grass({ seed: 3105, x0: -6, x1: 116, base: 604, depth: 34, h: [14, 26], n: 18, fill: '#1a1014', lit: '#ffb090' });
  live.grass({ seed: 3106, x0: 186, x1: 306, base: 604, depth: 34, h: [14, 26], n: 18, fill: '#1a1014', lit: '#ffb090' });
  drifting(live, [[-40, 340, 250, 12, 0.16], [-40, 200, 320, 9, 0.1]], '#f0c4ac');
  s.finish({ faction: ['umbral', 'ember'], at: [60, 232], reach: 460, grade: 0.32, vignette: 0.46, grain: 0.06 });
  return { spots: { rounds: [[132, 384], [174, 300], [150, 226]] } };
}

// The Causeway: a road of old stone on piles, straight out across the marsh
// into the fog, lanterns on posts along it, still water either side holding
// the pale sky; far out where it vanishes, Kasimir's riders.
function causeway(s, live) {
  s.rect(s.lin([[0, '#1e222c'], [0.2, '#3a404c'], [0.34, '#7a7e86'], [0.4, '#a8aaae']]));
  s.glow(150, 228, 240, '#ece6dc', 0.42);
  // the far marsh: dark reeds and a few trees in the fog
  s.layer(ledge([[-10, 236], [60, 230], [120, 234], [180, 228], [240, 233], [310, 229]], 246), '#4a4e56', { blur: 1 });
  s.layer(ridge({ seed: 3201, base: 230, amp: 8, freq: 6, x1: 308, bottom: 240 }), '#3e444c', { blur: 0.8 });
  s.haze(212, 244, '#dcdad4', 0.5);
  // the water: the sky again, darker toward us
  s.path(poly([[-10, 240], [310, 240], [310, 610], [-10, 610]]), s.linU(0, 240, 0, 610, [[0, '#b2b4b6'], [0.2, '#7c8086'], [0.6, '#363c44'], [1, '#12161c']]));
  // the causeway: wide at our feet, a thread at the fog
  const vy = 238, L = (y) => 144 - ((y - vy) / (610 - vy)) * 100, Rx = (y) => 156 + ((y - vy) / (610 - vy)) * 100;
  s.path(poly([[L(610) - 6, 610], [Rx(610) + 6, 610], [Rx(vy) + 0.4, vy + 3], [L(vy) - 0.4, vy + 3]]), '#141618', 'opacity=".6"');
  s.path(poly([[L(610), 610], [Rx(610), 610], [Rx(vy), vy], [L(vy), vy]]), s.linU(0, 610, 0, vy, [[0, '#4e4a44'], [0.5, '#6e6c66'], [1, '#b0aea8']]));
  let courses = '';
  for (let k = 1; k < 24; k++) { const t = k / 24, y = vy + (610 - vy) * t ** 1.7; courses += `M${f1(L(y))},${f1(y)}H${f1(Rx(y))}`; }
  s.add(`<path d="${courses}" stroke="#26241f" stroke-width=".9" opacity=".6"/>`);
  s.add(`<path d="M${f1(L(610))},610L${f1(L(vy))},${vy}M${f1(Rx(610))},610L${f1(Rx(vy))},${vy}" stroke="#ece6d8" stroke-width="1.1" opacity=".45"/>`);
  // posts along both sides, each with a lantern
  const posts = [], lan = [];
  for (let k = 0; k < 7; k++) {
    const t = (k + 0.6) / 7.4, y = vy + (610 - vy) * t ** 1.8, hgt = 5 + t * 50, wd = 0.8 + t * 3.4;
    for (const x of [L(y) - 2 - t * 8, Rx(y) + 2 + t * 8]) { posts.push(quad(x - wd / 2, y - hgt, wd, hgt + 3 * t)); lan.push([x, y - hgt - 1.5 * t, 1 + t * 4.4]); }
  }
  s.figure(`<path d="${U(posts)}"/>`, { fill: '#1c1a1a', rim: '#f0e6d0', offsets: [[0, -0.7]], rimOp: 0.5 });
  live.add(lan.map(([x, y, r], i) => `<circle class="breathe" style="--d:${f1(-i * 0.4)}s" cx="${f1(x)}" cy="${f1(y)}" r="${f1(r * 1.8)}" fill="${live.rad([[0, '#fff2c4', 0.95], [0.45, '#ffc46a', 0.5], [1, '#ff9a3a', 0]])}"/>`).join(''));
  s.add(lan.map(([x, y, r]) => `<path d="M${f1(x)},${f1(y + r * 2)}v${f1(30 + r * 6)}" stroke="#ffd8a0" stroke-width="${f1(0.4 + r * 0.25)}" opacity=".18"/>`).join(''));
  // reeds on both sides, the near ones bending
  {
    const R = rng(3202), reeds = [];
    for (let i = 0; i < 70; i++) { const right = R() < 0.5, y = 250 + R() ** 1.4 * 330, t = (y - vy) / (610 - vy), x = right ? Rx(y) + 10 + R() * (60 + t * 80) : L(y) - 10 - R() * (60 + t * 80), hh = 4 + t * 20; reeds.push(taper([[x, y], [x + (R() - 0.5) * 3, y - hh]], [0.7 + t, 0.2], { per: 2 })); }
    s.figure(`<path d="${U(reeds)}"/>`, { fill: '#1c2224', rim: '#e0e2e4', offsets: [[0, -0.6]], rimOp: 0.4 });
  }
  live.grass({ seed: 3203, x0: -6, x1: 60, base: 604, depth: 30, h: [16, 30], n: 14, fill: '#161a1c', lit: '#f0e6d0' });
  live.grass({ seed: 3204, x0: 240, x1: 306, base: 604, depth: 30, h: [16, 30], n: 14, fill: '#161a1c', lit: '#f0e6d0' });
  // far out, Kasimir's riders where the causeway meets the fog: lances up, a pennant
  const rider = (x, k) => U(ell(x, 240 - 3 * k, 3 * k, 1.8 * k), ell(x + 2.4 * k, 240 - 5 * k, 1.1 * k, 1.4 * k), quad(x - 0.4 * k, 240 - 8 * k, 1.2 * k, 3.4 * k), ell(x + 0.2 * k, 240 - 9 * k, 0.8 * k, 0.9 * k), quad(x + 0.8 * k, 240 - 16 * k, 0.4 * k, 12 * k), quad(x - 2.4 * k, 240 - 3 * k, 0.5 * k, 3 * k), quad(x + 2 * k, 240 - 3 * k, 0.5 * k, 3 * k));
  s.figure(`<path d="${U(rider(146, 1.2), rider(154, 1.1), rider(150, 1.3))}"/>`, { fill: '#2a2a30', rim: '#f8f0e0', offsets: [[0, -0.5]], rimOp: 0.4 });
  live.add('<g class="sway" style="--t:2.6s;transform-origin:0 50%"><path d="M151.3,224.6l7,2.2l-7,2.2Z" fill="#c8302a"/></g>');
  drifting(live, [[-60, 360, 246, 10, 0.24], [-40, 180, 300, 9, 0.14], [140, 340, 340, 8, 0.12]], '#e8e6e0');
  s.finish({ faction: ['ember', 'radiant'], at: [150, 228], reach: 460, grade: 0.26, vignette: 0.44, grain: 0.06 });
  return { spots: { rounds: [[150, 384], [150, 300], [150, 246]] } };
}

// The Bone Garden: barrows in the fog under a hidden moon, every mound white
// with flowers that glow faintly; a crooked path winds between them, past
// dead trees and old stones, to Morrow's arch of bones.
function garden(s, live) {
  s.rect(s.lin([[0, '#0e1218'], [0.2, '#1e2830'], [0.34, '#3e4c52'], [0.42, '#5c6c6e']]));
  s.glow(200, 104, 170, '#d0e0e8', 0.36);
  s.glow(200, 104, 36, '#eef6f8', 0.42);
  s.add('<circle cx="200" cy="104" r="12" fill="#eef4f4" opacity=".45"/>');
  // far trees in the fog
  s.layer(ridge({ seed: 3301, base: 226, amp: 22, freq: 5, x1: 308, bottom: 250 }), '#2e3a40', { blur: 1.1 });
  s.haze(204, 238, '#b8c8cc', 0.45);
  // the ground, misty far off, dark at our feet
  s.path(ledge([[-10, 240], [80, 234], [160, 240], [240, 232], [310, 238]], 610), s.linU(0, 234, 0, 610, [[0, '#4e5a58'], [0.3, '#2e3a36'], [1, '#0e1412']]));
  // the barrows, bigger toward us
  const mounds = [[50, 262, 34, 11], [146, 254, 40, 12], [246, 262, 36, 11], [36, 334, 50, 17], [262, 324, 54, 17], [62, 440, 72, 26], [246, 452, 76, 26]];
  s.figure(`<path d="${U(mounds.map(([x, y, rx, ry]) => blob([[x - rx, y], [x - rx * 0.6, y - ry * 0.8], [x, y - ry], [x + rx * 0.6, y - ry * 0.8], [x + rx, y]], 6)))}"/>`, { fill: '#26302c', rim: '#dceae4', offsets: [[0.3, -0.9]], rimOp: 0.55, shade: 0.45, light: [0.4, -1] });
  {
    const R = rng(3302), fl = [];
    for (const [x, y, rx, ry] of mounds) for (let k = 0; k < Math.round(rx * 1.4); k++) { const u = (R() - 0.5) * 1.7, v = R(); fl.push([x + u * rx, y - ry * (1 - u * u * 0.9) * (0.2 + v * 0.75), (0.4 + R() * 0.5) * (0.5 + ry / 26)]); }
    s.bloom(`<path d="${dots(fl)}" fill="#eef8ec" opacity=".8"/>`, { sd: 0.9, k: 1.2 });
  }
  live.motes({ seed: 3303, n: 30, x: [0, 300], y: [240, 470], r: [0.3, 0.8], fill: '#d8ffe8', cls: 'twinkle', op: [0.3, 0.9], t: [2.4, 5] });
  live.motes({ seed: 3304, n: 12, x: [20, 280], y: [250, 440], r: [0.4, 1], fill: '#c8ffe0', hot: '#f4fff8', cls: 'float', op: [0.4, 0.9], t: [5, 9] });
  // the path, pale, winding between the barrows to the arch
  const PATH = [[150, 600], [124, 520], [108, 450], [112, 384], [150, 340], [186, 302], [176, 262], [150, 236]];
  s.path(taper(PATH, PATH.map((_, i) => 18 - (i / (PATH.length - 1)) * 14), { per: 6 }), s.linU(0, 600, 0, 236, [[0, '#6a6a5c'], [0.6, '#9aa49c'], [1, '#c8d4d0']]), 'opacity=".8"');
  // dead trees, old stones, and Morrow's arch of bones
  const Rt = rng(3305), stones = [[200, 380, 8, 13], [86, 300, 5, 9], [222, 290, 5, 8], [40, 520, 10, 18], [264, 560, 11, 20], [196, 500, 7, 12]];
  const ribs = [];
  for (const d of [-1, 1]) {
    ribs.push(taper([[150 + d * 21, 242], [150 + d * 23, 218], [150 + d * 15, 198], [150 + d * 3, 188]], [3.4, 2.8, 2, 1], { per: 5 }));
    for (const k of [1, 2, 3]) ribs.push(taper([[150 + d * (21.5 - k * 0.6), 240 - k * 11], [150 + d * (29 + k * 1.5), 236 - k * 12], [150 + d * (31 + k), 228 - k * 12]], [1.5, 1.1, 0.4], { per: 4 }));
  }
  const arch = U(ribs, ell(150, 185, 4.6, 4), poly([[146.6, 187], [153.4, 187], [152, 192], [148, 192]]));
  s.figure(`<path d="${U(deadTree(18, 300, 60, Rt), deadTree(286, 270, 54, Rt), deadTree(232, 400, 40, Rt), stones.map(([x, y, sw, sh]) => U(quad(x - sw / 2, y - sh * 0.7, sw, sh * 0.7), ell(x, y - sh * 0.7, sw / 2, sw / 2.2, 0, 14))))}"/>`, { fill: '#121816', rim: '#dceae4', offsets: [[0.4, -0.7]], rimOp: 0.5 });
  s.figure(`<path d="${arch}"/>`, { fill: '#c8c4b4', rim: '#ffffff', offsets: [[0.3, -0.5]], rimOp: 0.4, shade: 0.5, light: [0.5, -1] });
  // lanterns hung along the path, pale green
  live.add([[96, 452], [140, 360], [200, 312], [126, 520], [170, 270]].map(([x, y], i) => `<circle class="breathe" style="--d:${-i * 0.6}s" cx="${x}" cy="${y - 12}" r="4.4" fill="${live.rad([[0, '#f4fff0', 0.95], [0.5, '#b8f0c8', 0.45], [1, '#80d8a0', 0]])}"/>`).join(''));
  s.add([[96, 452], [140, 360], [200, 312], [126, 520], [170, 270]].map(([x, y]) => `<path d="M${x},${y}v-10" stroke="#121816" stroke-width="1"/>`).join(''));
  live.grass({ seed: 3306, x0: -6, x1: 90, base: 604, depth: 30, h: [12, 22], n: 16, fill: '#121614', lit: '#dceae4' });
  live.grass({ seed: 3307, x0: 210, x1: 306, base: 604, depth: 30, h: [12, 22], n: 16, fill: '#121614', lit: '#dceae4' });
  drifting(live, [[-40, 340, 246, 10, 0.2], [-60, 200, 330, 10, 0.16], [120, 360, 410, 9, 0.14]], '#d8e4e0');
  s.finish({ faction: ['umbral', 'verdant'], at: [200, 104], reach: 460, grade: 0.3, vignette: 0.48, grain: 0.06 });
  return { spots: { rounds: [[112, 384], [186, 302], [150, 228]] } };
}

// The Storm Spire: a white tower on a crag above a sea of fog, a storm
// wheeling round its crown and lightning on its rods; a stair cut into the
// rock climbs to its door.
function spire(s, live) {
  s.rect(s.lin([[0, '#0a0e1c'], [0.2, '#1c2238'], [0.42, '#363e5a'], [0.6, '#4c5470']]));
  // the storm: heavy clouds round the top, lit from inside
  const puffs = (list) => U(list.map(([x, y, rx, ry]) => U(ell(x, y, rx, ry), ell(x - rx * 0.5, y + ry * 0.3, rx * 0.6, ry * 0.7), ell(x + rx * 0.5, y + ry * 0.2, rx * 0.55, ry * 0.7), ell(x - rx * 0.1, y - ry * 0.5, rx * 0.5, ry * 0.6))));
  s.glow(120, 70, 120, '#7a90e0', 0.3);
  s.figure(`<path d="${puffs([[10, 30, 50, 22], [150, 20, 70, 24], [290, 36, 50, 22]])}"/>`, { fill: '#202640', rim: '#8ca2e8', offsets: [[0, 1.2]], rimOp: 0.4, shade: 0.4, light: [0, 1] });
  s.figure(`<path d="${puffs([[40, 64, 58, 24], [116, 50, 52, 22], [204, 52, 64, 26], [272, 78, 50, 22], [82, 116, 46, 16], [232, 120, 50, 18], [152, 98, 42, 15]])}"/>`, { fill: '#323a5c', rim: '#c4d4ff', offsets: [[0, 1.4], [0.6, 1]], rimOp: 0.55, shade: 0.55, light: [0, 1] });
  s.add(`<path d="${U([[40, 64, 58], [116, 50, 52], [204, 52, 64], [272, 78, 50], [152, 98, 42]].map(([x, y, rx]) => ell(x, y + 10, rx * 0.8, 4)))}" fill="#aabcf0" opacity=".14"/>`);
  s.add(`<path d="${Array.from({ length: 40 }, (_, i) => { const R = rng(3401 + i), x = R() * 320 - 10, y = 120 + R() * 200; return `M${f1(x)},${f1(y)}l${f1(-5)},${f1(18 + R() * 10)}`; }).join('')}" stroke="#a8b8e0" stroke-width=".5" opacity=".28"/>`);
  // lightning: bolts down to the crown (they flash), and the light they throw
  const zig = (pts) => taper(pts, pts.map((_, i) => 2 - (i / (pts.length - 1)) * 1.5), { per: 2 });
  live.add(`<g class="twinkle" style="--t:1.2s;--d:-.2s"><path d="${zig([[86, 30], [104, 44], [98, 52], [118, 62], [112, 70], [140, 84]])}" fill="#f2f6ff"/></g>`);
  live.add(`<g class="twinkle" style="--t:1.7s;--d:-1s"><path d="${zig([[226, 36], [206, 50], [212, 58], [192, 68], [198, 74], [160, 84]])}" fill="#f2f6ff"/></g>`);
  live.add(`<circle class="twinkle" style="--t:1.2s;--d:-.2s" cx="150" cy="84" r="60" fill="${live.rad([[0, '#e0eaff', 0.45], [1, '#9cb4ff', 0]])}"/>`);
  // the sea of fog below, lit from above
  s.path(ledge([[-10, 452], [80, 444], [160, 452], [240, 442], [310, 450]], 610), s.linU(0, 444, 0, 610, [[0, '#a8b0cc'], [0.4, '#6a7290'], [1, '#2a3048']]));
  // the crag: a great rock out of the fog, the stair cut into its face
  const crag = poly(spline([[28, 612], [42, 566], [58, 546], [64, 506], [86, 476], [90, 444], [104, 414], [106, 382], [118, 354], [114, 322], [126, 292], [122, 266], [132, 246], [168, 246], [178, 264], [174, 292], [188, 318], [190, 352], [206, 386], [212, 422], [232, 454], [240, 492], [260, 522], [266, 562], [288, 612]], 2));
  s.figure(`<path d="${crag}"/>`, { fill: '#2a2c3e', rim: '#c4d2ff', offsets: [[-0.8, -0.8], [0.6, -0.8]], rimOp: 0.6, shade: 0.5, light: [-0.6, -1] });
  // its faces: lit planes toward the storm, dark clefts between them
  s.add(`<path d="${U(poly([[64, 506], [86, 476], [98, 490], [78, 532]]), poly([[90, 444], [104, 414], [116, 426], [100, 462]]), poly([[106, 382], [118, 354], [128, 366], [114, 398]]), poly([[114, 322], [126, 292], [134, 304], [124, 336]]), poly([[42, 566], [58, 546], [70, 560], [52, 594]]))}" fill="#5a6488" opacity=".5"/>`);
  s.add(`<path d="${U(poly([[188, 318], [190, 352], [178, 340]]), poly([[206, 386], [212, 422], [196, 404]]), poly([[232, 454], [240, 492], [222, 470]]), poly([[260, 522], [266, 562], [248, 540]]))}" fill="#14141f" opacity=".6"/>`);
  s.add(`<path d="${line([[66, 478], [96, 486], [128, 476], [160, 484]])}${line([[54, 548], [92, 556], [140, 548]])}${line([[100, 404], [132, 410], [168, 402]])}${line([[118, 340], [150, 344], [182, 336]])}${line([[200, 450], [230, 458]])}${line([[220, 530], [252, 536]])}" stroke="#151624" stroke-width="1.2" fill="none" opacity=".55"/>`);
  const STAIR = [[150, 600], [96, 540], [130, 470], [118, 410], [176, 352], [182, 300], [152, 262], [150, 246]];
  s.path(taper(STAIR, STAIR.map((_, i) => 14 - (i / (STAIR.length - 1)) * 9), { per: 5 }), s.linU(0, 600, 0, 246, [[0, '#6a6c80'], [1, '#b4b8cc']]), 'opacity=".75"');
  // the tower: tall and white, windows lit, a balcony, a crown of rods
  const tower = U(poly([[134, 250], [138, 120], [162, 120], [166, 250]]), quad(130, 196, 40, 4), quad(134, 112, 32, 9), ...[0, 1, 2, 3].map((k) => quad(135 + k * 8, 104, 5, 8)));
  s.figure(`<path d="${tower}"/>`, { fill: '#c8ccda', rim: '#ffffff', offsets: [[-0.6, -0.6]], rimOp: 0.6, shade: 0.5, light: [-1, -0.4] });
  s.add('<path d="M140,104V84M150,104V76M160,104V84" stroke="#2a2c3a" stroke-width="1"/>');
  s.bloom(`<path d="${U(quad(147, 140, 6, 9), quad(147, 168, 6, 9), quad(146, 216, 8, 12), poly([[143, 250], [143, 236], [150, 230], [157, 236], [157, 250]]))}" fill="#fff0c0"/>`, { sd: 1.6, k: 1.4 });
  live.add(`<circle class="breathe" cx="150" cy="80" r="14" fill="${live.rad([[0, '#f0f6ff', 0.8], [1, '#9cb4ff', 0]])}"/>`);
  drifting(live, [[-60, 360, 454, 12, 0.22], [-40, 200, 500, 10, 0.16], [120, 360, 540, 10, 0.14]], '#c8d0e8');
  s.finish({ faction: ['tide', 'radiant'], at: [150, 80], reach: 460, grade: 0.3, vignette: 0.46, grain: 0.06 });
  return { spots: { rounds: [[118, 384], [180, 300], [150, 236]] } };
}

// The Heart of the Fog: a still black mere the fog breathes off, roofs of a
// drowned village showing through it, will-o'-wisps over the water, and a
// boardwalk out into the mist toward a pale light where Hush waits.
function mere(s, live) {
  s.rect(s.lin([[0, '#14162a'], [0.18, '#2c2e46'], [0.32, '#5a5c74'], [0.4, '#8c8ca2']]));
  s.glow(150, 214, 240, '#dcd8f4', 0.5);
  s.glow(150, 214, 60, '#f6f4ff', 0.55);
  s.haze(190, 240, '#e0dcf0', 0.5);
  // the water: black, the light lying on it in a long column
  s.path(poly([[-10, 238], [310, 238], [310, 610], [-10, 610]]), s.linU(0, 238, 0, 610, [[0, '#6a6c86'], [0.08, '#2a2c42'], [0.4, '#121424'], [1, '#06070e']]));
  s.add(`<ellipse cx="150" cy="330" rx="26" ry="110" fill="${s.radU(150, 300, 110, [[0, '#e8e4ff', 0.3], [1, '#e8e4ff', 0]])}"/>`);
  live.add(Array.from({ length: 22 }, (_, i) => { const R = rng(3501 + i), t = R(), y = 248 + t * 250, x = 150 + (R() - 0.5) * (20 + t * 60), len = 3 + R() * (5 + t * 8); return `<path class="twinkle" style="--t:${f1(2 + R() * 2.4)}s;--d:${f1(-R() * 3)}s" d="M${f1(x - len / 2)},${f1(y)}h${f1(len)}" stroke="#ece8ff" stroke-width="${f1(0.5 + t * 0.7)}" stroke-linecap="round" opacity=".5"/>`; }).join(''));
  // drowned roofs either side, a steeple, and their shadows in the water
  const roofs = U(house(20, 300, 30, 8, 0.6, true), house(58, 276, 22, 6, 0.6), house(232, 290, 34, 9, 0.55), house(262, 330, 30, 10, 0.6, true), house(196, 262, 18, 5, 0.6), quad(36, 236, 5, 60), poly([[34, 238], [38.5, 214], [43, 238]]));
  s.figure(`<path d="${roofs}"/>`, { fill: '#121322', rim: '#d8d4f0', offsets: [[0, -0.8], [-0.4, -0.6]], rimOp: 0.5, shade: 0.3 });
  // the boardwalk: planks on posts, out from us into the mist
  const WALK = [[150, 610], [160, 540], [144, 470], [150, 400], [138, 330], [146, 280], [156, 240]];
  const ww = WALK.map((_, i) => 34 - (i / (WALK.length - 1)) * 28);
  s.path(taper(WALK, ww, { per: 6 }), s.linU(0, 610, 0, 240, [[0, '#3a3430'], [0.6, '#5c5654'], [1, '#9a96a4']]));
  let planks = '';
  const pts = spline(WALK, 6);
  for (let k = 2; k < pts.length - 1; k += 2) { const [x, y] = pts[k], t = 1 - (y - 240) / 370, half = (34 - t * 28) / 2; planks += `M${f1(x - half)},${f1(y)}h${f1(half * 2)}`; }
  s.add(`<path d="${planks}" stroke="#1a1614" stroke-width=".8" opacity=".7"/>`);
  const postsP = [];
  for (let k = 3; k < pts.length - 1; k += 6) { const [x, y] = pts[k], t = 1 - (y - 240) / 370, half = (34 - t * 28) / 2, hh = 4 + (1 - t) * 18; for (const d of [-1, 1]) postsP.push(quad(x + d * half - 0.8 - (1 - t), y - hh, 1.6 + (1 - t) * 2, hh + 4)); }
  s.figure(`<path d="${U(postsP)}"/>`, { fill: '#1a1618', rim: '#d8d4f0', offsets: [[0, -0.6]], rimOp: 0.45 });
  // will-o'-wisps over the water, teal and violet
  live.motes({ seed: 3502, n: 26, x: [10, 290], y: [240, 520], r: [0.5, 1.2], fill: '#9cf0de', hot: '#f0fff8', cls: 'float', op: [0.5, 1], t: [5, 10] });
  live.motes({ seed: 3503, n: 12, x: [30, 270], y: [250, 480], r: [0.4, 1], fill: '#c8a8ff', cls: 'twinkle', op: [0.4, 0.9], t: [2, 4] });
  // a pale shape far out in the light, that might be her
  s.add(`<path d="${U(ell(156, 222, 2.2, 2.6), poly([[153, 224], [159, 224], [161, 240], [151, 240]]))}" fill="#f4f2ff" opacity=".35"/>`);
  live.grass({ seed: 3504, x0: -6, x1: 100, base: 604, depth: 30, h: [16, 28], n: 18, fill: '#10111a', lit: '#c8c4e8' });
  live.grass({ seed: 3505, x0: 200, x1: 306, base: 604, depth: 30, h: [16, 28], n: 18, fill: '#10111a', lit: '#c8c4e8' });
  drifting(live, [[-60, 360, 236, 14, 0.3], [-60, 200, 290, 12, 0.2], [100, 360, 350, 12, 0.18], [-40, 240, 430, 10, 0.14]], '#dcd8ee');
  s.finish({ faction: ['tide', 'umbral'], at: [150, 214], reach: 460, grade: 0.3, vignette: 0.5, grain: 0.06 });
  return { spots: { rounds: [[150, 384], [140, 300], [156, 236]] } };
}

export const CAMPAIGN_ART = {
  'world-1': { w: 300, h: 760, draw: harborRoad },
  'world-2': { w: 300, h: 760, draw: fogCountry },
  'place-ford': { w: 300, h: 600, draw: ford },
  'place-causeway': { w: 300, h: 600, draw: causeway },
  'place-garden': { w: 300, h: 600, draw: garden },
  'place-spire': { w: 300, h: 600, draw: spire },
  'place-mere': { w: 300, h: 600, draw: mere },
  'place-market': { w: 300, h: 600, draw: market },
  'place-cliffs': { w: 300, h: 600, draw: cliffs },
  'place-pass': { w: 300, h: 600, draw: pass },
  'place-fields': { w: 300, h: 600, draw: fields },
  'place-wall': { w: 300, h: 600, draw: wall },
};

// Draw one: the static picture (to bake), the overlay, and the spots.
export function drawCampaign(id) {
  const A = CAMPAIGN_ART[id];
  const s = new Scene(`cp-${id}`, { w: A.w, h: A.h });
  const live = Live(A.w, A.h, `lv-${id}`);
  const { spots } = A.draw(s, live);
  return { w: A.w, h: A.h, svg: s.svg(), live: live.svg(), spots };
}
