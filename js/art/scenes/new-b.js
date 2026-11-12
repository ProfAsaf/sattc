// Card art for the second half of Week One (cards 46–90). Style rules live
// in ../scenes.js; drawing tools in ../kit.js.
// This file: the new Tide cards (and the Fish token) and the new Umbral cards.

import { H, W, blob, canopy, line, particles, pines, poly, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, faction, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (d, extra = '') => `<path d="${d}"${extra ? ` ${extra}` : ''}/>`;
const parts = (list) => list.map((d) => P(d)).join('');
const circ = (list) => list.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
// A smooth edge (shore, rock, hill) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);
// Short horizontal glints on water: [x, y, width, opacity].
const glints = (rows, fill) => `<g fill="${fill}">${rows.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${y}" width="${w}" height="1.3" rx=".6" opacity="${o}"/>`).join('')}</g>`;
// Drops falling: [x, y].
const drops = (list, fill, r = 1.2) => list.map(([x, y], i) =>
  `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx="${r}" ry="${f1(r * 1.5)}" fill="${fill}"/>`).join('');
// A little bird (a gull, a crow) in flight, as one subpath.
const bird = (x, y, k) => `M${f1(x)},${f1(y)}c${f1(2 * k)},${f1(-2.6 * k)} ${f1(4.4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(1.6 * k)},${f1(-2.6 * k)} ${f1(4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(-2 * k)},${f1(-0.8 * k)} ${f1(-4 * k)},0 ${f1(-6 * k)},${f1(2 * k)}c${f1(-2 * k)},${f1(-2 * k)} ${f1(-4 * k)},${f1(-2.8 * k)} ${f1(-6 * k)},${f1(-2 * k)}Z`;
// Mirror local x,y pairs across x = 0 (for shapes drawn about their own centre).
// (numbers like "-.5" count too: matching only "5" there would leave "-.-5")
const flipX = (d) => d.replace(/(-?(?:\d*\.\d+|\d+)),(-?(?:\d*\.\d+|\d+))/g, (_, x, y) => `${f1(-Number(x))},${y}`);
// Grave markers standing on a baseline b, optionally leaning (degrees).
const lean = (d, x, b, a) => (a ? `<path d="${d}" transform="rotate(${a} ${x} ${b})"/>` : `<path d="${d}"/>`);
const stoneD = (x, b, w, h) => {
  const r = w / 2;
  return `M${f1(x - r)},${b}V${f1(b - h + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(b - h + r)}V${b}Z`;
};
const stone = (x, b, w, h, a = 0) => lean(stoneD(x, b, w, h), x, b, a);
const cross = (x, b, h, a = 0) => {
  const t = h * 0.075;
  return lean(`M${f1(x - t)},${b}V${f1(b - h)}H${f1(x + t)}V${b}ZM${f1(x - h * 0.28)},${f1(b - h * 0.76)}h${f1(h * 0.56)}v${f1(t * 1.9)}h${f1(-h * 0.56)}Z`, x, b, a);
};
// A clump of reeds standing in water at y = b, some topped with cattails.
function reeds(seed, x0, x1, b, h0, h1, cat = 0.3) {
  const r = rng(seed);
  let d = '';
  for (let x = x0; x < x1; x += 2 + r() * 5) {
    const h = h0 + r() * (h1 - h0), tilt = (r() - 0.5) * h * 0.3;
    d += taper([[x, b + 2], [x + tilt * 0.4, b - h * 0.5], [x + tilt, b - h]], [2.2, 1.5, 0.2], { per: 3 });
    if (r() < cat) {
      const cx = x + tilt * 0.75, cy = b - h * 0.78;
      d += `M${f1(cx - 1.7)},${f1(cy)}a1.7,5.2 0 1 1 3.4,0a1.7,5.2 0 1 1 -3.4,0Z`;
    }
  }
  return d;
}
// A moth heading up, centred at the origin, about 26 across.
const MOTH_L = 'M-.5,-1C-5,-8 -12,-10 -13,-4.5C-13.5,-.5 -7,1.5 -.5,1Z' + 'M-.5,1C-5,2 -9,5 -8,8.5C-6,10 -2,7 -.5,3Z';
const mothBody = () => 'M0,-3.6C1.4,-3.6 1.4,5.6 0,5.6C-1.4,5.6 -1.4,-3.6 0,-3.6Z' +
  taper([[-0.4, -3], [-3, -7.6], [-5, -9.6]], [0.8, 0.6, 0.3]) + taper([[0.4, -3], [3, -7.6], [5, -9.6]], [0.8, 0.6, 0.3]) + disc(-7, -4, 1.5) + disc(7, -4, 1.5);
const moth = (x, y, k, a, fill, dark) => `<g transform="translate(${x} ${y}) rotate(${a}) scale(${k})">` +
  `<path d="${MOTH_L}${flipX(MOTH_L)}" fill="${fill}"/><path d="${mothBody()}" fill="${dark}"/></g>`;
// A long bone lying from x0 to x1 at height y, knuckled at both ends (one path).
const boneD = (x0, x1, y, w) => `M${f1(x0)},${f1(y - w * 0.4)}H${f1(x1)}V${f1(y + w * 0.4)}H${f1(x0)}Z` +
  disc(x0, y - w * 0.42, w * 0.5) + disc(x0, y + w * 0.42, w * 0.5) + disc(x1, y - w * 0.42, w * 0.5) + disc(x1, y + w * 0.42, w * 0.5);
// A skull seen from the front, its jaw on y (16 wide at k = 1), sockets dark.
const skull = (x, y, k, socket = '#0e0a16') => `<g transform="translate(${x} ${y}) scale(${k})">` +
  '<path d="M-8,-9C-8,-19 8,-19 8,-9C8,-5 6,-3 5,-2V3H-5V-2C-6,-3 -8,-5 -8,-9Z"/>' +
  `<path d="M-5.6,-9.4a2.4,2.6 0 1 0 4.8,0a2.4,2.6 0 1 0 -4.8,0ZM.8,-9.4a2.4,2.6 0 1 0 4.8,0a2.4,2.6 0 1 0 -4.8,0ZM0,-6L-1.2,-3.6H1.2Z" fill="${socket}"/>` +
  `<path d="M-3,1V3M0,1V3M3,1V3" stroke="${socket}" stroke-width=".7"/></g>`;
// The lit part of a disc (cx, cy, r) left uncovered by a second disc offset by
// (dx, dy) with radius r2: a crescent moon.
function crescent(cx, cy, r, dx, dy, r2) {
  const d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
  const x = (d * d + r * r - r2 * r2) / (2 * d), h = Math.sqrt(Math.max(0, r * r - x * x));
  const p1 = [cx + Math.cos(a) * x - Math.sin(a) * h, cy + Math.sin(a) * x + Math.cos(a) * h];
  const p2 = [cx + Math.cos(a) * x + Math.sin(a) * h, cy + Math.sin(a) * x - Math.cos(a) * h];
  return `M${f1(p1[0])},${f1(p1[1])}A${r},${r} 0 1 1 ${f1(p2[0])},${f1(p2[1])}A${r2},${r2} 0 ${d < x ? 1 : 0} 0 ${f1(p1[0])},${f1(p1[1])}Z`;
}
// A full circle as a clockwise subpath, so many of them union in one path.
const disc = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1 1 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1 1 ${f1(-2 * r)},0Z`;
// A cloud bank: overlapping puffs heaped highest mid-way, on a flat underside at y = base.
function cloud({ seed, x0, x1, base, top, r0 = 6, r1 = 15 }) {
  const r = rng(seed);
  let d = `M${f1(x0)},${f1(base)}V${f1(base - r0)}H${f1(x1)}V${f1(base)}Z`;
  for (let x = x0 + r0; x < x1 - r0 * 0.5;) {
    const t = (x - x0) / (x1 - x0), dome = Math.sin(Math.PI * t);
    const rr = r0 + (r1 - r0) * (0.3 + 0.7 * dome) * (0.6 + r() * 0.4);
    const ty = base - (base - top) * (0.3 + 0.7 * dome) * (0.75 + r() * 0.25);
    const cy = Math.min(base - rr * 0.2, ty + rr);
    d += disc(x, cy, rr);
    if (r() < 0.45 && rr > r0 * 1.4) d += disc(x + (r() - 0.5) * rr * 0.6, cy - rr * 0.62, rr * 0.5);
    x += rr * (0.75 + r() * 0.5);
  }
  return d;
}
// A small round fish facing left at the origin (about 28 across): body, fins
// and tail in one shape, with two little horn nubs left over from whatever it was.
const fishShape = (horns = true) =>
  '<ellipse cx="0" cy="0" rx="10" ry="8.6"/>' +
  '<path d="M7,-1.6C10.5,-4.5 13.5,-9 17.6,-10C16.2,-4 16.2,4 17.6,10C13.5,9 10.5,4.5 7,1.6Z"/>' +
  '<path d="M-0.6,-8.5C1.4,-13.2 6.4,-14 9.4,-10.6C8,-8.8 6.4,-7.6 4.8,-6.8Z"/>' +
  '<path d="M-1.6,7.6C0.2,11.6 4.4,12.2 6.4,9.8C4.8,8.8 3.2,7.9 1.6,7.3Z"/>' +
  (horns ? '<path d="M-7.6,-4.8L-11.6,-10.8L-4.6,-7.2Z"/><path d="M-3.8,-7.6L-5,-13.8L-0.6,-8.4Z"/>' : '');
// Its startled face: a big round eye, an O of a mouth, a gill and a fin.
const fishFace = (rim) =>
  `<path d="M0.5,1.5C3.5,0.6 6.6,2.2 7,5.2C4.4,5.4 2,4.2 0.5,1.5Z" fill="${rim}" opacity=".45"/>` +
  `<path d="M1.4,-5.2Q3.4,0 1.4,5.4" fill="none" stroke="${rim}" stroke-width=".5" opacity=".45"/>` +
  '<circle cx="-4.4" cy="-2.2" r="3.5" fill="#f8fbef"/><circle cx="-5.3" cy="-2" r="1.25" fill="#06151b"/>' +
  `<circle cx="-10.1" cy="1.9" r="1.5" fill="#0d2a33" stroke="${rim}" stroke-width=".5"/>`;

const tide = faction('tide', {
  // A manta glides over a sea of cloud at sundown, mist peeling off its wings.
  'cloud-ray'(s) {
    const p = PAL.tide;
    const hz = 148; // the horizon, far below
    s.rect(s.lin([[0, '#071824'], [0.3, '#143e4f'], [0.52, '#336c7a'], [0.64, '#86b2b0'], [0.705, '#eadcb2']]));
    s.add(particles({ seed: 621, n: 22, x: [0, W], y: [0, 56], r: [0.25, 0.75], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    // the sun going down behind the cloud sea
    s.glow(206, hz, 160, '#f6e0ae', 0.5);
    s.shafts({ cx: 206, cy: hz, from: -168, to: -24, n: 8, len: 300, spread: 2.6, color: '#f7ead0', op: 0.16, seed: 622, sd: 2.4 });
    s.bloom(`<circle cx="206" cy="${hz}" r="10" fill="#fff3d4"/>`, { sd: 2.4, k: 1.3, box: [160, 100, 92, 92] });
    // far below, the open sea
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#6d9895'], [0.3, '#2c5b63'], [1, '#08202a']]));
    s.add(glints([[206, 151, 36, 0.7], [204, 155, 26, 0.55], [208, 160, 30, 0.42], [203, 166, 18, 0.32], [207, 173, 24, 0.24]], '#fbecc6'));
    // the cloud sea: a pale far bank on the horizon, a lit middle bank, a dark near one
    s.blur(`<path d="${cloud({ seed: 623, x0: -14, x1: 150, base: 151, top: 134, r0: 4, r1: 9 })}" fill="#a9c6be"/>` +
      `<path d="${cloud({ seed: 624, x0: 236, x1: 316, base: 150, top: 137, r0: 4, r1: 8 })}" fill="#a9c6be"/>`, 0.8);
    s.figure(P(cloud({ seed: 625, x0: -24, x1: 132, base: 190, top: 118, r0: 7, r1: 19 })) + P(cloud({ seed: 626, x0: 248, x1: 324, base: 188, top: 150, r0: 6, r1: 13 })),
      { fill: '#3f717b', rim: '#f2e2b8', offsets: [[1.1, -0.7]], rimOp: 0.75 });
    s.figure(P(cloud({ seed: 627, x0: -30, x1: 184, base: 226, top: 164, r0: 9, r1: 24 })) + P(cloud({ seed: 628, x0: 166, x1: 330, base: 228, top: 184, r0: 8, r1: 18 })),
      { fill: '#173f4b', rim: '#c8ddd0', offsets: [[0.9, -1]], rimOp: 0.6 });
    // the ray, drawn heading up (broad head, two horn-lobes, swept wings), then
    // turned into its glide
    const R = [[0, -14], [7.5, -14.6], [8, -20], [8.6, -25], [9.6, -26.8], [12.4, -24.6], [14, -19.4], [14.8, -15.6], [20, -13.6], [34, -8.8], [50, -2.4],
      [65, 5.6], [78, 14], [91, 24.5], [80, 22.4], [64, 18.2], [48, 16], [34, 17], [23, 20.5], [15, 26], [11, 31], [6, 33.4], [2.6, 33.8]];
    const body = blob([...R, ...R.map(([x, y]) => [-x, y]).reverse().slice(0, -1)], 5);
    const tail = taper([[0, 32], [0.6, 48], [-1.2, 68], [-4.5, 92]], [3, 1.9, 1, 0.25]);
    const tf = 'translate(150 84) rotate(-18) scale(.92 .86)';
    const mist = s.lin([[0, '#f6efd8', 0.8], [1, '#f6efd8', 0]]);
    s.add(`<g data-part="mist" transform="${tf}" fill="${mist}">${[1, -1].map((k) =>
      `<path d="${taper([[91 * k, 25], [95 * k, 46], [99 * k, 72], [102 * k, 108]], [9, 6.5, 4, 0.8])}" opacity=".42"/>` +
      `<path d="${taper([[91 * k, 25], [95 * k, 46], [99 * k, 72], [102 * k, 108]], [2.8, 1.9, 1.1, 0.2])}" opacity=".95"/>` +
      `<path d="${taper([[66 * k, 19], [68 * k, 40], [71 * k, 64]], [3.4, 1.8, 0.3])}" opacity=".3"/>`).join('')}</g>`);
    s.figure(`<g transform="${tf}">${P(body)}${P(tail)}</g>`, { fill: p.fig, rim: '#f0e3bf', offsets: [[1, 0.8], [1.2, -0.3]], rimOp: 0.9, shade: 0.5, halo: 0.3 });
    s.add(`<g data-part="eyes" transform="${tf}" fill="#f4f3d6"><circle cx="-15.6" cy="-13" r="1.1"/><circle cx="15.6" cy="-13" r="1.1"/></g>`);
    // wisps it is gliding through
    s.add(`<g fill="#d8e6d8">${[[64, 118, 52, 3.2, 0.32], [236, 56, 40, 2.4, 0.22], [112, 34, 30, 2, 0.18], [196, 128, 34, 2.4, 0.26]].map(([x, y, rx, ry, o]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    s.motes({ seed: 629, n: 10, x: [60, 260], y: [40, 160], r: [0.4, 1], fill: '#f6ecd0', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // A great wave curls over an armoured knight in the shallows and drags him back.
  riptide(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0b2430'], [0.32, '#285d6c'], [0.52, '#79aeae'], [0.6, '#cfe6dc']]));
    s.glow(64, 64, 150, '#f0fbf2', 0.55);
    s.shafts({ cx: 40, cy: -30, from: 48, to: 96, n: 7, len: 280, spread: 2.4, color: '#f2fbf2', op: 0.15, seed: 631, sd: 2.2 });
    // the far sea and a headland, seen under the curl
    s.path('M-10,127C8,119 26,116 42,119C52,121 58,125 66,127Z', '#6b9c9b');
    s.path(`M-10,126H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#73a7a4'], [1, '#2f6168']]));
    s.add(glints([[60, 130, 30, 0.5], [74, 134, 22, 0.4], [52, 139, 26, 0.3]], '#f2fbf2'));
    // the wave: a dark wall curling over from the right, its lip lit through
    const outer = [[312, 120], [310, 72], [298, 42], [276, 22], [246, 10], [214, 9], [184, 15], [156, 27], [132, 41], [113, 55], [100, 69], [92, 84]];
    const inner = [[92, 84], [99, 80], [109, 71], [122, 63], [140, 58], [160, 58], [180, 64], [196, 76], [207, 94], [212, 116], [210, 140], [202, 160], [190, 178], [176, 196], [166, 214]];
    const wave = poly([[312, 214], ...spline(outer, 6), ...spline(inner, 6).slice(1)]);
    s.add('<g data-part="wave">');
    s.figure(P(wave), { fill: s.linU(100, 40, 290, 170, [[0, '#6fb4b2'], [0.18, '#3c8690'], [0.45, '#1a5561'], [1, '#062530']]), rim: '#f2fbf4', offsets: [[-1, -1.2], [0, -1.4]], rimOp: 0.9 });
    // light caught under the lip, and the run of the water up the face
    const back = [[180, 214], [200, 186], [216, 164], [226, 140], [228, 114], [222, 90], [210, 72], [192, 58], [170, 50], [148, 48], [126, 53], [108, 63], [97, 76]];
    s.path(poly([...spline(inner, 6), ...spline(back, 6)]), s.linU(140, 55, 200, 190, [[0, '#bfe6df', 0.6], [0.35, '#5fa3a6', 0.35], [1, '#1d5560', 0]]));
    s.add(`<g fill="none" stroke="#a9dcd8" stroke-width="1.2" stroke-linecap="round">` +
      `<path d="${line([[250, 214], [244, 160], [246, 100], [256, 60], [270, 38]])}" opacity=".22"/>` +
      `<path d="${line([[282, 214], [276, 150], [280, 96], [290, 64]])}" opacity=".16"/>` +
      `<path d="${line([[220, 200], [232, 150], [238, 104], [232, 70], [214, 40], [196, 30]])}" opacity=".26"/></g>`);
    s.add(`<path d="${line(outer.slice(3))}" fill="none" stroke="#f4fcf6" stroke-width="2.4" opacity=".9"/>`);
    s.add(`<g fill="#f4fcf6">${parts([
      taper([[93, 83], [88, 94], [86, 106]], [3.4, 1.8, 0.3]),
      taper([[99, 80], [97, 92], [98, 101]], [2.6, 1.4, 0.3]),
      taper([[106, 74], [107, 84]], [2.2, 0.3]),
      taper([[116, 66], [119, 76]], [2, 0.3]),
    ])}${circ([[87, 112, 1.5], [95, 108, 1.1], [83, 100, 1.2], [104, 92, 1], [252, 10, 2.4], [232, 8, 2.2], [210, 10, 2], [188, 15, 1.8], [164, 25, 1.6], [142, 37, 1.4]])}</g>`);
    s.add('</g>');
    // the beach he came up, his footprints and the furrows his heels dug
    s.path(ledge([[-10, 160], [24, 163], [58, 169], [86, 177], [108, 186], [126, 198], [136, 214]]), s.lin([[0, '#7f978d'], [1, '#2c423f']]));
    s.add(`<g fill="#3b5552" opacity=".8">${[[14, 165], [26, 168], [38, 168], [50, 172], [62, 173]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.1"/>`).join('')}</g>`);
    s.add('<path d="M70,177L94,180M72,180L95,183" stroke="#3b5552" stroke-width="1.2" opacity=".8"/>');
    // the backwash, pulling everything toward the wave
    s.add('<g data-part="wash">');
    s.add('<g fill="none" stroke="#eef8f2" stroke-linecap="round"><path d="M66,174C100,168 132,166 170,172" stroke-width="2" opacity=".7"/>' +
      '<path d="M84,186C112,180 142,180 178,186" stroke-width="1.6" opacity=".55"/><path d="M98,198C124,192 152,194 184,200" stroke-width="1.4" opacity=".45"/></g>');
    s.add('</g>');
    // the knight: leaning for the shore, sword up, cape and plume torn seaward
    const knight = parts([
      taper([[121, 140], [114, 150], [110, 158]], [9, 8, 7]),
      taper([[110, 158], [106, 168], [102, 177]], [7, 6, 5.5]),
      taper([[127, 141], [133, 149], [138, 157]], [9, 8, 7]),
      taper([[138, 157], [145, 164], [151, 171]], [7, 6, 5]),
      blob([[113, 127], [131, 127], [138, 144], [128, 149], [116, 148], [109, 143]]),
      taper([[124, 132], [120, 118], [114, 104]], [18, 20, 19]),
      taper([[121, 104], [126, 94], [128, 86]], [6.5, 5.5, 5]),
      taper([[128, 86], [127, 78], [124, 70]], [5, 4.6, 4.2]),
      taper([[108, 107], [101, 113], [96, 118]], [6, 5.5, 5]),
      taper([[96, 118], [90, 121], [85, 123]], [5, 4.5, 4]),
      taper([[110, 80], [120, 74], [132, 73], [146, 78]], [4, 4.6, 3, 0.4]),
      taper([[117.5, 68.6], [130.5, 65.4]], [2.4, 2.4]),
      poly([[118, 100], [132, 98], [150, 104], [164, 114], [174, 126], [162, 123], [167, 134], [151, 125], [141, 130], [133, 116], [123, 112]]),
    ]) + '<path d="M100,101V89Q100,80.5 107.5,78.5Q115,80.5 115,89V101Z"/><path d="M100.4,87L96.2,91.5L100.4,96Z"/>' +
      '<ellipse cx="108" cy="106" rx="7" ry="5.5"/><ellipse cx="121" cy="103" rx="7.5" ry="6"/>' +
      '<circle cx="124" cy="69" r="3.4"/><circle cx="125.5" cy="75" r="2"/><circle cx="83" cy="124" r="3.2"/><ellipse cx="98" cy="178" rx="6" ry="2.6"/>';
    s.figure(knight, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.8], [-0.4, -1.2]], rimOp: 0.95, shade: 0.4, halo: 0.3 });
    s.bloom(`<path d="${taper([[123.5, 65], [118.5, 45], [114, 27]], [3.4, 2.8, 0.3])}" fill="#f2fdfa"/>`, { sd: 1.4, k: 1.4, box: [96, 12, 46, 68] });
    s.add('</g>');
    // white water round his legs, streaming off toward the wave
    s.add('<g data-part="foam">');
    s.add(`<g fill="#eef8f2">${[[100, 177, 9, 2.6, 0.9], [151, 171, 8, 2.6, 0.85], [126, 176, 18, 3, 0.55]].map(([x, y, rx, ry, o]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity="${o}"/>`).join('')}</g>`);
    s.add('<g fill="none" stroke="#eef8f2" stroke-width="1.2" opacity=".7" stroke-linecap="round"><path d="M108,179C122,177 136,178 150,176M157,172C166,171 174,172 182,175"/></g>');
    s.add(drops([[88, 118], [97, 113], [83, 108], [104, 102]], '#f4fcf6'));
    s.add('</g>');
    s.add(particles({ seed: 634, n: 14, x: [92, 240], y: [20, 120], r: [0.5, 1.4], fill: '#f4fcf6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A spiral of sea-magic winds a roaring horned monster down into a fish in a bubble.
  'sea-change'(s) {
    const p = PAL.tide;
    const hz = 150, C = [212, 124];
    s.rect(s.lin([[0, '#06151e'], [0.4, '#133a48'], [0.66, '#2b6472'], [0.715, '#4a858b']]));
    s.add(particles({ seed: 641, n: 20, x: [0, W], y: [0, 70], r: [0.25, 0.75], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#3a727a'], [0.35, '#173f4a'], [1, '#05141a']]));
    s.glow(C[0], C[1], 120, '#c6f4f6', 0.42);
    // the monster: a horned head roaring at the spell, its neck already
    // unwinding into it
    const monster = parts([
      blob([[72, 66], [76, 50], [90, 40], [110, 38], [128, 42], [146, 50], [160, 58], [156, 64], [138, 64], [118, 68], [96, 76], [80, 78]]),
      taper([[86, 80], [104, 96], [120, 110], [136, 120]], [18, 13, 8, 3]),
      taper([[88, 44], [78, 30], [62, 22], [48, 22], [40, 28]], [10, 8, 5, 3, 0.5]),
      taper([[100, 40], [96, 24], [86, 12], [72, 8]], [8, 6, 3.5, 0.5]),
      taper([[112, 40], [118, 31]], [5, 0.4]),
      'M128,65L131,72L134,65Z', 'M140,63L143,69L146,63Z', 'M150,61L152.5,66L155,61Z',
      'M106,89.4L111.7,86.3L110,92.6Z', 'M122.4,101.4L128.1,98.3L126.4,104.6Z', 'M131.6,111.4L135.8,108.6L135.6,114.6Z',
      taper([[84, 74], [76, 96], [78, 118], [90, 136]], [30, 26, 18, 5]),
      taper([[70, 72], [60, 67]], [4.4, 0.4]), taper([[64, 92], [54, 91]], [4, 0.4]),
    ]);
    s.add('<g data-part="monster">');
    s.figure(monster, { fill: '#0a2129', rim: p.rim, offsets: [[1.2, 0.2], [0.6, -1]], rimOp: 0.85, halo: 0.3 });
    s.glow(114, 50, 7, '#f4f3d6', 0.8);
    s.add('<ellipse cx="114" cy="50" rx="2.6" ry="1.5" fill="#f8f6dc" transform="rotate(14 114 50)"/>');
    s.add('</g>');
    // the spiral: four streams unwound from the beast, winding in to the bubble
    const spiral = (a0, r0, turns, n = 18) => Array.from({ length: n }, (_, i) => {
      const t = i / (n - 1), a = a0 + turns * 2 * Math.PI * t, r = r0 * Math.pow(24 / r0, t);
      return [C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r * 0.62];
    });
    const widths = (n, w0) => Array.from({ length: n }, (_, i) => w0 * Math.pow(1 - i / (n - 1), 1.1) + 0.5);
    const arms = [[0.93, 124, 1.05, 9], [1, 136, 1, 7], [0.86, 116, 1.1, 6], [1.08, 150, 0.95, 5]].map(([a0, r0, tn, w]) => [spiral(Math.PI * a0, r0, tn), w]);
    const flow = s.linU(70, 120, 214, 120, [[0, '#bfeef0', 0.1], [0.5, '#d9f7f6', 0.45], [1, '#f2fffd', 0.85]]);
    s.add('<g data-part="spiral">');
    s.add(`<g fill="${flow}">${parts(arms.map(([pts, w]) => taper(pts, widths(pts.length, w))))}</g>`);
    s.add(`<g fill="none" stroke="#f2fffd" stroke-width=".6" opacity=".55">${arms.map(([pts]) => `<path d="${line(pts.slice(6))}"/>`).join('')}</g>`);
    s.add('</g>');
    // the bubble, and what is left of the monster
    s.glow(C[0], C[1], 40, '#e6fdfc', 0.7, 'breathe');
    s.add('<g data-part="bubble">');
    s.add(`<circle cx="${C[0]}" cy="${C[1]}" r="22" fill="${s.rad([[0, '#a6e2e2', 0.5], [0.72, '#7cc7cc', 0.55], [0.92, '#d9f8f6', 0.85], [1, '#f2fffd', 0.95]], { cx: 0.44, cy: 0.42, r: 0.56 })}"/>`);
    s.add('</g>');
    const fx = `translate(${C[0] - 2} ${C[1] + 2}) scale(1.15)`;
    s.add('<g data-part="fish">');
    s.figure(`<g transform="${fx}">${fishShape(true)}</g>`, { fill: p.fig, rim: p.rim, offsets: [[0, -1], [-0.8, -0.6]], rimOp: 0.9 });
    s.add(`<g transform="${fx}">${fishFace(p.rim)}</g>`);
    s.add('</g>');
    s.add('<g data-part="shine">');
    s.bloom(`<path d="M${C[0] - 15},${C[1] - 9}A17,17 0 0 1 ${C[0] - 4},${C[1] - 18}" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round"/>`, { sd: 1.2, k: 1.3, box: [C[0] - 30, C[1] - 30, 40, 36] });
    s.add('</g>');
    s.add(`<ellipse cx="${C[0]}" cy="${hz + 6}" rx="30" ry="3" fill="#c6f4f6" opacity=".3"/>`);
    s.add(particles({ seed: 643, n: 14, x: [150, 250], y: [70, 170], r: [0.7, 1.9], stroke: '#cdf3f6', cls: 'rise', t: [6, 11], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A sage rides the sea wind high above the cliffs, reading; pages and gulls wheel round her.
  'windborne-sage'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#a6d6d4'], [0.28, '#62a3ab'], [0.58, '#2d6876'], [0.8, '#1b4b59']]));
    s.glow(126, -8, 170, '#f6fcee', 0.7);
    s.shafts({ cx: 126, cy: -40, from: 54, to: 126, n: 8, len: 300, spread: 2.4, color: '#f4fcf0', op: 0.2, seed: 661, sd: 2.4 });
    // the sea far below, and a pale headland between the cliffs
    s.blur('<path d="M70,168C92,157 116,151 140,152C162,153 180,160 196,168Z" fill="#79acae"/>', 0.8);
    s.path(`M-10,167H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#5c999c'], [1, '#1b4a55']]));
    s.add(glints([[150, 172, 40, 0.5], [146, 178, 28, 0.4], [154, 186, 36, 0.3], [149, 195, 22, 0.22]], '#f2fbf2'));
    // the cliffs: a tall one on the left, a lower one on the right
    const cliffs = P('M-10,214L-10,56C6,52 24,53 40,58L48,62C52,72 50,82 56,92C60,104 58,118 64,132C68,146 72,160 80,176L88,214Z') +
      P('M310,214L310,88C294,84 274,86 258,92L250,98C248,110 252,120 246,132C242,146 240,158 232,176L224,214Z');
    s.figure(cliffs, { fill: '#0e3440', rim: '#d8f2ea', offsets: [[0, -1.3], [0.8, -0.6]], rimOp: 0.8 });
    s.add('<g stroke="#08222b" stroke-width="1.2" fill="none" opacity=".8"><path d="M20,70L26,96L22,124M36,64L44,90L40,110M266,98L262,124L268,150M286,92L282,116"/></g>');
    s.add(`<g fill="#0e3440">${parts([[4, 56], [18, 54], [30, 55], [262, 91], [280, 87], [298, 86]].map(([x, y]) =>
      taper([[x, y + 1], [x + 1.5, y - 4], [x + 3, y - 7]], [3, 1.6, 0.3]) + taper([[x + 2, y + 1], [x + 5, y - 3], [x + 8, y - 5]], [2.6, 1.4, 0.3])))}</g>`);
    s.add('<g fill="none" stroke="#e9f8f2" stroke-width="1.4" opacity=".6" stroke-linecap="round"><path d="M80,178q8,-3 16,0M88,190q10,-3 20,0M224,180q-8,-3 -16,0M218,192q-10,-3 -20,0"/></g>');
    // the sage: hood down, hair and scarf and one sleeve streaming on the wind,
    // her robe billowing back with her bare feet below it
    const sage = `<g data-part="hair">${parts([
      taper([[131, 55], [146, 51], [162, 53], [180, 48]], [8, 6, 4, 0.5]),
      taper([[133, 61], [150, 61], [168, 65], [186, 62]], [6, 4.5, 3, 0.4]),
    ])}</g><g data-part="scarf">${parts([taper([[136, 70], [156, 74], [178, 72], [200, 78], [224, 73]], [5, 5, 4.5, 3.5, 1])])}</g>` + parts([
      taper([[131, 64], [135, 72]], [4.4, 5]),
      taper([[136, 72], [140, 86], [144, 100]], [14, 15, 14]),
    ]) + `<g data-part="robe">${parts([poly([[136, 97], [150, 97], [166, 103], [186, 111], [208, 117], [196, 121], [205, 129], [186, 129], [190, 137], [170, 135], [157, 139], [146, 137], [138, 127], [134, 111]])])}</g>` + parts([
      taper([[144, 132], [143, 146], [141, 156]], [6, 5, 4]),
      taper([[152, 134], [154, 147], [157, 156]], [6, 5, 4]),
      taper([[141, 155], [137, 162]], [4, 1.4]),
      taper([[157, 155], [156, 163]], [4, 1.4]),
    ]) + `<g data-part="arm">${parts([taper([[134, 76], [124, 86], [115, 84]], [8, 9, 6]), poly([[128, 82], [122, 92], [126, 100], [132, 90]])])}<circle cx="114" cy="83" r="2.8"/></g>` +
      `<g data-part="sleeve">${parts([taper([[140, 75], [152, 69], [164, 63]], [7, 6, 4.6]), poly([[146, 73], [156, 68], [166, 64], [178, 66], [192, 61], [184, 71], [170, 73], [156, 78]])])}<circle cx="166" cy="61.8" r="2.8"/></g>` +
      '<circle cx="128" cy="58.5" r="6.6"/><ellipse cx="134.5" cy="66" rx="6" ry="4.4"/>';
    s.figure(sage, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-0.8, -0.9], [0.9, -0.8]], rimOp: 0.95, shade: 0.4, halo: 0.3 });
    // the open book, glowing
    s.glow(106, 78, 26, '#f4f3d6', 0.7, 'breathe');
    s.add('<g data-part="book">');
    s.bloom('<path d="M95,75Q101,71 107,76Q113,71 119,75L117,85Q112,81 107,86Q102,81 97,85Z" fill="#fbf6dc"/>' +
      '<path d="M99,77.5Q103,75.5 106,78M108,78Q111,75.5 115,77.5M99.5,80.5Q103,78.5 106,81M108,81Q111,78.5 114.5,80.5" stroke="#b9c3ad" stroke-width=".5" fill="none"/>', { sd: 1.4, k: 1.3, box: [80, 56, 56, 46] });
    s.add('</g>');
    // pages torn out on the wind, and gulls wheeling with them
    s.add(page(86, 60, -24, 0.85, 8, -1), page(70, 96, 18, 0.7, 9, -3), page(98, 118, -40, 0.6, 7, -5), page(176, 28, 30, 0.8, 9, -2),
      page(214, 58, -16, 0.7, 8, -6), page(232, 100, 40, 0.55, 10, -4), page(60, 44, 10, 0.5, 9, -7));
    s.add(`<g fill="#123c48">${[bird(62, 30, 1.4), bird(228, 24, 1.2), bird(250, 64, 1.6), bird(196, 150, 1.1), bird(96, 142, 1)].map((d, i) => `<g data-part="bird${i}">${P(d)}</g>`).join('')}</g>`);
    s.motes({ seed: 663, n: 10, x: [70, 240], y: [20, 150], r: [0.4, 1], fill: '#f6fbe8', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },

  // A water-thing rises out of a tide pool, halfway into the shape of a knight.
  'tidal-mimic'(s) {
    const p = PAL.tide;
    const hz = 112;
    s.rect(s.lin([[0, '#04111a'], [0.34, '#0f2e3b'], [0.5, '#2b5e6a'], [0.535, '#86b0a8']]));
    s.add(particles({ seed: 671, n: 26, x: [0, W], y: [0, 80], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    // the last of the light low on the sea
    s.glow(232, hz, 110, '#efe6c2', 0.4);
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#4f8488'], [0.3, '#1d4954'], [1, '#081d24']]));
    s.add(glints([[232, 115, 30, 0.5], [226, 120, 22, 0.4], [236, 126, 26, 0.3]], '#f2ecd0'));
    // rocks round the pool: a far reef, then the dark near shelves
    s.path('M184,114C196,108 206,106 218,109L226,114Z', '#244e58');
    s.figure(P('M-10,214L-10,118C8,112 26,113 40,120C54,126 62,136 74,146C88,156 104,160 120,162L118,214Z') +
      P('M310,214L310,124C292,120 276,124 262,132C248,140 238,150 222,158C208,163 194,164 182,164L184,214Z'),
      { fill: '#0b252d', rim: '#86b6b4', offsets: [[0, -1.2]], rimOp: 0.7 });
    s.path('M66,178C94,166 126,162 150,162C176,162 208,166 236,178C216,192 184,198 150,198C116,198 86,192 66,178Z', s.lin([[0, '#2c6470'], [1, '#0b2a33']]));
    s.glow(150, 176, 54, '#c6f4f6', 0.4);
    s.add('<g fill="none" stroke="#bff0ee"><ellipse cx="150" cy="174" rx="24" ry="4" opacity=".6"/><ellipse cx="150" cy="176" rx="42" ry="7" opacity=".35"/><ellipse cx="150" cy="178" rx="64" ry="10" opacity=".18"/></g>');
    // the mimic: crisp where it has learned the shape (helm, pauldron, sword
    // arm), still loose water where it has not
    s.glow(150, 104, 74, '#c6f4f6', 0.42, 'breathe');
    const body = '<g data-part="body">' + parts([
      taper([[150, 176], [147, 158], [152, 140], [150, 120]], [34, 18, 15, 22]),
      blob([[132, 88], [168, 88], [167, 104], [160, 118], [140, 118], [133, 104]]),
      blob([[160, 86], [172, 88], [179, 96], [177, 104], [168, 102]]),
      taper([[168, 96], [180, 110], [183, 128], [177, 146], [168, 166]], [10, 8, 7, 6, 4]),
    ]) + '<path d="M139,82V64Q139,51 150,49Q161,51 161,64V82Z"/><ellipse cx="133" cy="90" rx="10" ry="7"/></g>' +
      '<g data-part="plume">' + parts([
      taper([[150, 51], [153, 41], [160, 33]], [4.4, 2.8, 0.4]), taper([[153, 52], [162, 45], [172, 43]], [3.8, 2.4, 0.4]), taper([[156, 54], [167, 53], [177, 56]], [3.2, 2, 0.4]),
    ]) + '</g><g data-part="arm">' + parts([
      taper([[131, 95], [124, 103], [120, 110]], [8, 7, 6]),
      taper([[120, 110], [117, 103], [116, 96]], [6, 5.5, 5]),
    ]) + '<circle cx="116" cy="94" r="3.6"/></g>';
    s.bloom(`<g fill="${s.linU(0, 44, 0, 176, [[0, '#f2fffd'], [0.4, '#a9e3e3'], [1, '#3f8c96']])}" opacity=".84">${body}</g>`, { sd: 2.6, k: 0.7 });
    s.add('<g data-part="body" fill="none" stroke="#ffffff" stroke-width=".8" opacity=".45" stroke-linecap="round"><path d="M146,170C150,160 146,150 151,140M154,166C157,154 152,146 155,132M138,98C144,102 152,100 160,106M168,112C174,120 179,128 177,140"/></g>');
    s.add('<g data-part="body" fill="none" stroke="#f4fffd" stroke-width="1" opacity=".9"><path d="M139,82V64Q139,51 150,49Q161,51 161,64V82Z"/><ellipse cx="133" cy="90" rx="10" ry="7"/><path d="M150,88V117M140,100H150"/></g>');
    s.add(`<g data-part="sword" fill="#effdfc" stroke="#ffffff" stroke-width=".5">${parts([taper([[116, 90], [115, 64], [114, 44]], [4, 3.4, 0.4]), taper([[109, 91], [123, 91]], [2.4, 2.4])])}<circle cx="116" cy="101" r="2"/></g>`);
    s.add('<g data-part="body"><path d="M142.5,66H157.5" stroke="#06151b" stroke-width="2.6" stroke-linecap="round"/><path d="M150,61.5V71" stroke="#06151b" stroke-width="1.1"/></g>');
    s.add(drops([[178, 150], [171, 160], [184, 132], [176, 108], [163, 36], [176, 50]], '#d9f7f6'));
    s.add(particles({ seed: 674, n: 16, x: [110, 196], y: [40, 176], r: [0.6, 1.7], stroke: '#cdf3f6', cls: 'rise', t: [6, 10], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A barnacled clock tower stands half-drowned at night; its face glows, and
  // its bells ring rings of light out over the water.
  'the-drowned-clock'(s) {
    const p = PAL.tide;
    const hz = 140, g = 'rotate(-5 150 150)';
    s.rect(s.lin([[0, '#040c13'], [0.45, '#0c2632'], [0.67, '#1d4a58']]));
    s.add(particles({ seed: 681, n: 36, x: [0, W], y: [0, 110], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.85], t: [2.5, 6] }));
    // the rings the bells send out, and the light in the belfry
    s.add(`<g data-part="rings" transform="${g}" fill="none" stroke="#f4ecc8">${[[34, 0.42], [50, 0.3], [68, 0.2], [90, 0.12], [116, 0.07]].map(([r, o]) =>
      `<circle cx="150" cy="50" r="${r}" stroke-width="${f1(1.7 - r / 110)}" opacity="${o}"/>`).join('')}</g>`);
    s.glow(141, 54, 20, '#f6e8b8', 0.9);
    // a drowned town far off
    s.blur('<path d="M28,141V128L34,119L40,128V141ZM50,141V133L62,126L74,133V141ZM236,141V122L242,110L248,122V141ZM258,141V134L271,128L284,134V141Z" fill="#244f5c"/>', 0.7);
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#1f4d5a'], [0.4, '#0c2a35'], [1, '#03101a']]));
    // the tower, leaning, crusted with barnacles and hung with weed
    const tower = `<g data-part="tower" transform="${g}">` + parts([
      'M128,156V100H172V156Z', 'M124,101V66H176V101Z', 'M121,104V98H179V104Z', 'M120,68V62H180V68Z', 'M128,39V34H172V39Z',
      'M131,35L147,9L150,12L153,6L169,35Z',
      taper([[123, 104], [122, 113], [124, 122]], [2.2, 1.6, 0.4]), taper([[133, 104], [134, 110]], [1.8, 0.4]),
      taper([[177, 104], [178, 114], [176, 121]], [2.2, 1.6, 0.4]), taper([[170, 104], [169, 109]], [1.6, 0.4]),
    ]) + P('M131,62V38H169V62ZM139,60V48A11,11 0 0 1 161,48V60Z', 'fill-rule="evenodd"') +
      circ([[128, 138, 2.2], [129, 130, 1.6], [127.5, 146, 1.8], [172, 134, 2.2], [171.5, 126, 1.4], [172.5, 143, 1.9], [124, 66, 1.4], [176, 66, 1.6],
        [121, 99, 1.6], [179, 99, 1.8], [138, 156, 2.2], [146, 155, 1.6], [163, 156, 2]]) +
      `</g><g data-part="bell" transform="${g}">` + parts(['M144,60Q144,50.5 150,49.5Q156,50.5 156,60L158,61.5H142Z', 'M149.2,49.5V44H150.8V49.5Z']) + '</g>';
    s.figure(tower, { fill: '#0b1e26', rim: '#e6efd6', offsets: [[0, -1.2], [-1, -0.5], [1, -0.5]], rimOp: 0.8, halo: 0.25 });
    s.add(`<g data-part="tower" transform="${g}" stroke="#2b4750" stroke-width=".8"><path d="M129,112H171M129,124H171M129,136H171M125,76H175M125,90H131M169,90H175M132,50H138M162,50H168"/></g>`);
    // the face, glowing: nearly midnight
    s.glow(144, 83, 64, '#f6e8b8', 0.5, 'breathe');
    s.bloom(`<g data-part="face"><circle cx="150" cy="83" r="15" fill="${s.rad([[0, '#fffbe8'], [0.75, '#fbefc6'], [1, '#e9d49a']])}" transform="${g}"/></g>`, { sd: 2.4, k: 1.2, box: [110, 50, 70, 70] });
    s.add(`<g transform="${g}"><g data-part="face"><circle cx="150" cy="83" r="15" fill="none" stroke="#3a3424" stroke-width="1.6"/>` +
      `<g stroke="#5c5236" stroke-width="1.1">${Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return `<path d="M${f1(150 + Math.sin(a) * 10.8)},${f1(83 - Math.cos(a) * 10.8)}L${f1(150 + Math.sin(a) * 13)},${f1(83 - Math.cos(a) * 13)}"/>`;
      }).join('')}</g></g>` +
      '<path data-part="hands" d="M150,83L143.4,79.2M150,83L149.2,71.4" stroke="#2a2618" stroke-width="1.7" stroke-linecap="round"/><circle cx="150" cy="83" r="1.6" fill="#2a2618"/></g>');
    // the sea closes over its feet; rings of light spread on the water
    s.add(`<rect x="-5" y="${hz}" width="${W + 10}" height="${H - hz + 10}" fill="${s.lin([[0, '#1f4d5a', 0.86], [0.2, '#0e2e39', 0.92], [1, '#03101a', 0.97]])}"/>`);
    s.add(`<g data-part="ripples" fill="none" stroke="#f4ecc8">${[[40, 4, 0.5], [62, 6.5, 0.36], [88, 9, 0.24], [118, 12, 0.14]].map(([rx, ry, o]) =>
      `<ellipse cx="149" cy="142" rx="${rx}" ry="${ry}" stroke-width="1.2" opacity="${o}"/>`).join('')}</g>`);
    s.add('<g data-part="reflect">' + glints([[146, 146, 22, 0.6], [147, 151, 16, 0.45], [145, 157, 20, 0.35], [147, 164, 12, 0.26], [146, 172, 16, 0.18]], '#f6e8b8') + '</g>');
    s.path(ridge({ seed: 684, base: 214, amp: 24, freq: 3, peaks: true }), '#03101a');
    s.add(particles({ seed: 685, n: 12, x: [90, 210], y: [20, 130], r: [0.4, 1.1], fill: '#f6e8b8', cls: 'float', t: [6, 10], op: [0.3, 0.8] }));
    return s.svg();
  },

  // A tiny boat has just ridden out one wave; behind it a taller one rises, and
  // the sailor looks up at it.
  'one-more-wave'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#06161f'], [0.35, '#173f4d'], [0.7, '#2e6470']]));
    // a break in the storm, high on the left
    s.glow(64, 14, 130, '#e8f7ee', 0.6);
    s.add(`<g fill="#0a1d26">${[[20, 2, 60, 18], [150, -4, 80, 22], [270, 4, 66, 20]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    // the second wave: a dark wall across the card, lit through along its crest,
    // pitching over into a curl at its far end
    const top = [[-10, 98], [26, 82], [62, 66], [96, 51], [128, 38], [158, 27], [186, 19], [210, 15], [234, 18], [254, 28], [268, 44], [270, 60], [262, 70], [251, 70], [246, 63]];
    const face = [[246, 63], [244, 55], [237, 50], [229, 53], [226, 63], [229, 78], [240, 90], [262, 98], [290, 102], [312, 104]];
    s.figure(P(poly([...spline(top, 6), ...spline(face, 6).slice(1), [312, 214], [-10, 214]])),
      { fill: s.linU(0, 30, 0, 190, [[0, '#2f7580'], [0.35, '#1a5560'], [1, '#0b303b']]), rim: '#f4fcf6', offsets: [[-0.8, -1.2], [0, -1.4]], rimOp: 0.9 });
    s.add('<g data-part="wave">');
    const lit = top.slice(0, 11).map(([x, y]) => [x, y + 12]);
    s.path(taper(top.slice(0, 11).map(([x, y]) => [x, y + 18]), [24, 30, 34, 36, 36, 36, 34, 30, 24, 14, 2]), '#5fa8a8', 'opacity=".3"');
    s.path(taper(lit, [16, 20, 22, 24, 24, 24, 22, 20, 16, 10, 2]), '#7fc4bc', 'opacity=".38"');
    s.path(taper(top.slice(0, 11).map(([x, y]) => [x, y + 5]), [6, 8, 9, 10, 10, 10, 9, 8, 6, 4, 1]), '#cdf0e6', 'opacity=".45"');
    s.add(`<g fill="none" stroke="#a9dcd6" stroke-width="1.1" stroke-linecap="round">${[[60, 0.14], [110, 0.2], [160, 0.18], [200, 0.2]].map(([x, o]) =>
      `<path d="${line([[x - 30, 190], [x - 14, 140], [x - 2, 96], [x + 6, 60]])}" opacity="${o}"/>`).join('')}</g>`);
    s.add('</g>');
    // ragged foam along the crest and round the curl, spray torn off it
    const r = rng(696), ridgeLine = spline(top, 6);
    let foam = '';
    for (let i = 6; i < ridgeLine.length; i++) foam += disc(ridgeLine[i][0] + (r() - 0.5) * 2, ridgeLine[i][1] + 0.4 + r() * 1.4, 0.9 + r() * (i > 56 ? 2.6 : 1.7));
    s.add('<g data-part="foam">');
    s.add(`<path d="${line(top.slice(1))}" fill="none" stroke="#f4fcf6" stroke-width="2" opacity=".9"/>`);
    s.path(foam, '#f4fcf6', 'opacity=".9"');
    s.add('</g>');
    s.add(`<g data-part="spray" fill="#f4fcf6">${parts([[262, 68, 0], [254, 70, 1], [270, 58, 2]].map(([x, y, k]) =>
      taper([[x, y], [x - 4 + k, y + 7], [x - 9 + k * 2, y + 11 + k * 2]], [3.6, 2, 0.3])))}</g>`);
    s.add(`<g data-part="mist" fill="#e9f7f2" opacity=".2">${parts([[128, 38], [176, 21], [214, 15], [252, 26]].map(([x, y]) =>
      taper([[x, y], [x - 12, y - 7], [x - 30, y - 10]], [7, 4.4, 0.4])))}</g>`);
    // light off the face of it, behind the boat
    s.glow(104, 98, 54, '#bfe8e0', 0.3);
    // the first wave, nearer and lower, and the boat on its crest
    const near = [[-10, 148], [30, 136], [70, 126], [98, 121], [122, 124], [150, 134], [184, 142], [218, 140], [252, 132], [284, 136], [312, 144]];
    s.figure(P(ledge(near)), { fill: s.lin([[0, '#2f6f78'], [0.25, '#123e47'], [1, '#04131a']]), rim: '#dff5ee', offsets: [[0, -1.2]], rimOp: 0.8 });
    s.add(`<path data-part="nearline" d="${line(near.slice(1, 8))}" fill="none" stroke="#eef9f4" stroke-width="1.6" opacity=".7"/>`);
    const bt = 'translate(100 118) rotate(-8) scale(1.4)';
    const boat = `<g data-part="hull" transform="${bt}"><path d="M-13,-2L12,-2L8,4L-9,4Z"/><path d="M-.6,-2V-23H.6V-2Z"/><path d="M1.2,-21.5L1.2,-7L10,-8.5Z"/></g>` +
      `<g data-part="sailor" transform="${bt}"><path d="${taper([[-5, -2], [-5.4, -11]], [4, 3.4])}"/><circle cx="-3" cy="-14.4" r="2.3"/>` +
      `<path d="${taper([[-4.4, -10], [-1.2, -15.5]], [1.6, 1.1])}"/><path d="${taper([[-6, -10], [-4.8, -13.8]], [1.4, 1])}"/></g>`;
    s.figure(boat, { fill: '#04121a', rim: '#e6f4ec', offsets: [[-0.8, -0.8], [0.6, -0.8]], rimOp: 0.9 });
    s.glow(84, 112.5, 13, '#f6e7b4', 0.9, 'breathe');
    s.bloom(`<g data-part="lantern"><circle cx="0" cy="0" r="1.4" fill="#fff7d8" transform="${bt} translate(-11 -5.5)"/></g>`, { sd: 1.2, k: 1.4, box: [66, 94, 36, 34] });
    s.add(drops([[256, 82], [264, 76], [248, 86], [272, 70]], '#eef9f4'));
    // the near swell
    s.path(ridge({ seed: 694, base: 214, amp: 30, peaks: true, freq: 3.2 }), '#04141b');
    s.add('<g fill="none" stroke="#9fd0d4" stroke-width="1" opacity=".3"><path d="M40,196q14,-6 30,-2M180,192q16,-7 34,-2"/></g>');
    s.add(particles({ seed: 695, n: 16, x: [60, 280], y: [10, 120], r: [0.5, 1.4], fill: '#eef9f4', cls: 'float', t: [5, 9], op: [0.4, 0.85] }));
    return s.svg();
  },

  // Nerissa sings on a sea rock against the full moon; a knight wades into the
  // waves toward her, and the rings of her song cross the water between them.
  nerissa(s) {
    const p = PAL.tide;
    const hz = 136, M = [196, 64];
    s.rect(s.lin([[0, '#030d14'], [0.3, '#0d2a37'], [0.56, '#2a5e6b'], [0.65, '#7aa7a6']]));
    s.add(particles({ seed: 701, n: 14, x: [0, W], y: [0, 120], r: [0.25, 0.85], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.85], t: [2.5, 6] }));
    // the full moon behind her
    s.glow(M[0], M[1], 170, '#e6f6ee', 0.55);
    s.shafts({ cx: M[0], cy: M[1], from: 0, to: 360, n: 8, len: 230, spread: 2, color: '#eaf8f0', op: 0.2, seed: 702, sd: 2.6 });
    s.bloom(`<circle cx="${M[0]}" cy="${M[1]}" r="40" fill="${s.rad([[0, '#fbfbec'], [0.8, '#eef3df'], [1, '#d9e8d8']])}"/>` +
      '<g fill="#d3e0cf" opacity=".55"><circle cx="210" cy="50" r="6"/><circle cx="214" cy="80" r="3"/><circle cx="178" cy="44" r="2.6"/></g>', { sd: 3, k: 1, box: [130, 0, 132, 128] });
    // the mast of a ship she sang down, and the sea, lit by the moon
    s.path('M24,137V114H25.8V137ZM17,119H33V120.6H17Z', '#3a6b74');
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#a6cbc3'], [0.08, '#4d8288'], [0.4, '#16404b'], [1, '#04121a']]));
    s.add(glints([[140, 140, 30, 0.6], [272, 140, 26, 0.5], [130, 146, 22, 0.45], [278, 147, 20, 0.4], [120, 154, 26, 0.32], [284, 156, 18, 0.28]], '#f2fbf2'));
    // her rock, craggy
    s.figure(P('M158,214L164,190L168,170L175,152L182,140L192,132L204,128L216,128L228,131L236,140L242,154L246,170L252,188L256,214Z'),
      { fill: '#06161d', rim: '#cfe9e2', offsets: [[0, -1.2], [1, -0.8], [-1, -0.8]], rimOp: 0.85 });
    s.add('<path d="M184,150L190,162L186,176M226,146L222,160L228,172" stroke="#0e2a33" stroke-width="1.2" fill="none"/>');
    // the rings of her song, spreading toward him
    const ring = (r) => {
      const a1 = (150 * Math.PI) / 180, a2 = (212 * Math.PI) / 180;
      return `M${f1(188 + r * Math.cos(a1))},${f1(74.5 + r * Math.sin(a1))}A${r},${r} 0 0 1 ${f1(188 + r * Math.cos(a2))},${f1(74.5 + r * Math.sin(a2))}`;
    };
    s.add('<g data-part="song">');
    s.bloom(`<g fill="none" stroke="#d9faf7" stroke-linecap="round">${[[12, 1.8, 0.85], [24, 1.6, 0.7], [38, 1.5, 0.55], [54, 1.3, 0.42], [72, 1.2, 0.3], [92, 1.1, 0.2]].map(([r, w, o]) =>
      `<path d="${ring(r)}" stroke-width="${w}" opacity="${o}"/>`).join('')}</g>`, { sd: 1.4, k: 1.2, box: [80, 20, 120, 110] });
    s.add('</g>');
    // Nerissa: crowned with coral, singing, one hand held out to him; her hair
    // streams back across the moon and her tail sweeps off the rock to its fluke
    const siren = `<g data-part="hair">${parts([taper([[202, 62], [214, 64], [222, 72], [232, 78], [240, 88], [250, 94], [260, 104]], [12, 13, 12, 10, 8, 5, 0.6])])}</g>` +
      `<g data-part="body">${parts([
      taper([[205, 72], [214, 82], [218, 94], [226, 104], [230, 116]], [9, 9, 8, 6, 0.6]),
      taper([[199, 79], [201, 87]], [5.6, 7]),
      taper([[201, 86], [204, 100], [207, 114], [208, 124]], [17, 13, 12, 18]),
      taper([[209, 90], [217, 104], [220, 120]], [6, 5, 4.2]),
    ])}</g>` +
      `<g data-part="head">${parts([
      taper([[192.5, 62], [189, 52], [186, 43]], [3.6, 2.6, 1.2]), taper([[189, 53], [182, 47], [179, 42]], [2, 1.4, 0.6]),
      taper([[198, 60], [198.5, 47], [200, 35]], [4, 2.8, 1.2]), taper([[198.6, 48], [205, 42], [207, 37]], [2, 1.4, 0.6]), taper([[199.4, 41], [194, 36]], [1.6, 0.6]),
      taper([[203.5, 62], [209, 53], [214, 45]], [3.6, 2.6, 1.2]), taper([[209, 53], [211, 45]], [1.8, 0.6]),
      blob([[195.9, 60.2], [202.8, 61.4], [206.2, 68.3], [203.9, 76.3], [198.2, 79.8], [192.4, 79.8], [190.1, 76.9], [188.4, 75.8], [190.1, 74], [187.8, 72.3], [187.2, 70.1], [190.1, 66], [191.3, 62.5]]),
    ])}${circ([[186, 43, 1.6], [179, 42, 1.3], [200, 35, 1.7], [207, 37, 1.3], [194, 36, 1.2], [214, 45, 1.6], [211, 45, 1.2]])}</g>` +
      `<g data-part="arm">${parts([
      taper([[195, 90], [187, 94], [179, 96]], [6.4, 5.4, 4.6]), taper([[179, 96], [171, 95], [164, 92]], [4.6, 4, 3.4]),
      taper([[164, 92], [157, 89.5], [151, 88]], [3.4, 2.8, 0.6]), taper([[163, 90.6], [159, 86.4]], [1.6, 0.5]),
    ])}</g>` +
      `<g data-part="tail">${parts([
      taper([[206, 118], [214, 128], [228, 134], [244, 132], [256, 124], [264, 112], [268, 100]], [22, 20, 16, 12, 8, 5, 3]),
      taper([[268, 101], [258, 88], [251, 80]], [5, 4.6, 0.6], { bulge: 0.3 }), taper([[268, 101], [276, 88], [283, 80]], [5, 4.6, 0.6], { bulge: 0.3 }),
      taper([[228, 131], [234, 122], [242, 120]], [3, 1.6, 0.3]),
    ])}${circ([[221, 122, 2.6]])}</g>`;
    s.figure(siren, { fill: p.fig, rim: p.rim, offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6], [0, 1]], rimOp: 0.9, shade: 0.35, halo: 0.35 });
    s.glow(200, 40, 17, '#f4f3d6', 0.55);
    s.add(`<g data-part="head" fill="#fbf8e4">${circ([[186, 43, 1.5], [200, 35, 1.7], [214, 45, 1.5]])}</g><ellipse data-part="head" cx="191.6" cy="69" rx="1.5" ry=".8" fill="#c6f4f6"/>`);
    // the knight, wading in to his waist, both arms out to her like a sleepwalker
    const knight = '<g data-part="kbody">' + parts([
      blob([[74, 128], [78, 124], [92, 123.6], [96, 127.6], [93, 140], [91, 157], [77, 157], [75, 140]]),
      taper([[85.6, 125], [86, 120.6]], [5, 4.6]),
    ]) + '<path d="M80.6,121V112.4Q80.6,105.6 87,105Q93.4,105.6 93.4,112L97.4,116.4L93.4,118.6V121Z"/></g>' + '<g data-part="kreach">' + parts([
      taper([[93, 128], [104, 130], [115, 127]], [5.4, 4.6, 4]),
      taper([[88, 132], [100, 136], [112, 134]], [5.4, 4.6, 4]),
    ]) + circ([[116.4, 126.8, 2.4], [113.6, 134, 2.4]]) + '</g>';
    s.figure(knight, { fill: p.fig, rim: p.rim, offsets: [[1, -0.8], [0.4, -1.2]], rimOp: 0.9 });
    s.add('<ellipse cx="84" cy="156" rx="15" ry="2.6" fill="#e9f8f2" opacity=".75"/><g fill="none" stroke="#cdeee8"><ellipse cx="84" cy="157" rx="25" ry="4" opacity=".4"/><ellipse cx="84" cy="158" rx="37" ry="6" opacity=".2"/></g>');
    // dark rocks and surf at the near corners
    s.path(ledge([[-10, 184], [18, 180], [40, 188], [58, 214]]) + ledge([[262, 214], [276, 192], [296, 186], [312, 190]]), '#030e13');
    s.add('<g fill="none" stroke="#e9f8f2" stroke-width="1.2" opacity=".5" stroke-linecap="round"><path d="M44,184q10,-3 20,0M246,190q10,-4 20,0M160,186q8,-3 16,0"/></g>');
    s.motes({ seed: 704, n: 8, x: [100, 280], y: [30, 170], r: [0.4, 1.1], fill: '#e6fbf8', cls: 'rise', t: [6, 10], op: [0.3, 0.85] });
    return s.svg();
  },

  // Fish token: a small round startled fish in a floating sphere of seawater.
  fish(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#5f9fa8'], [0.32, '#2c6676'], [0.66, '#143845'], [0.72, '#235664']]));
    s.glow(150, -20, 170, '#e3fbfb', 0.6);
    s.shafts({ cx: 150, cy: -40, from: 62, to: 118, n: 8, len: 300, spread: 2.2, color: '#e6fbf8', op: 0.2, seed: 651, sd: 2.2 });
    // a far shore, and the sea it was lifted out of
    s.path('M200,161C216,154 234,149 254,149C272,149 292,155 312,154L312,162Z', '#2f6470');
    s.path('M-10,161L-10,153C10,150 22,148 34,151C44,154 52,158 60,161Z', '#2f6470');
    s.path(`M-10,160H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#3e7a82'], [0.3, '#1d4c57'], [1, '#06171d']]));
    s.add('<ellipse cx="150" cy="182" rx="44" ry="5.5" fill="#c6f4f6" opacity=".22"/>');
    s.add(glints([[150, 172, 30, 0.45], [148, 177, 22, 0.35], [152, 186, 34, 0.28], [149, 195, 18, 0.2]], '#e6fbf8'));
    // the sphere of seawater
    const cx = 150, cy = 92, R = 53;
    s.glow(cx, cy, 90, '#c6f4f6', 0.35, 'breathe');
    s.add('<g data-part="bubble">');
    s.add(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${s.rad([[0, '#a9e0dd', 0.62], [0.6, '#6fb5b8', 0.55], [0.88, '#9fd8d8', 0.6], [1, '#e2faf7', 0.92]], { cx: 0.45, cy: 0.4, r: 0.55 })}"/>`);
    s.add(`<ellipse cx="${cx + 8}" cy="${cy + 38}" rx="26" ry="9" fill="#f2fffb" opacity=".25"/>`);
    s.add('</g>');
    // the fish
    const fx = 'translate(143 97) scale(2.45)';
    // (fishShape's pieces, each its own part: body, tail, top fin, belly fin and the two horn nubs)
    s.figure(`<g transform="${fx}"><g data-part="fbody"><ellipse cx="0" cy="0" rx="10" ry="8.6"/></g>` +
      '<g data-part="ftail"><path d="M7,-1.6C10.5,-4.5 13.5,-9 17.6,-10C16.2,-4 16.2,4 17.6,10C13.5,9 10.5,4.5 7,1.6Z"/></g>' +
      '<g data-part="ftop"><path d="M-0.6,-8.5C1.4,-13.2 6.4,-14 9.4,-10.6C8,-8.8 6.4,-7.6 4.8,-6.8Z"/></g>' +
      '<g data-part="fbelly"><path d="M-1.6,7.6C0.2,11.6 4.4,12.2 6.4,9.8C4.8,8.8 3.2,7.9 1.6,7.3Z"/></g>' +
      '<g data-part="fhorns"><path d="M-7.6,-4.8L-11.6,-10.8L-4.6,-7.2Z"/><path d="M-3.8,-7.6L-5,-13.8L-0.6,-8.4Z"/></g></g>', { fill: p.fig, rim: p.rim, offsets: [[0, -1.2], [-0.8, -0.8]], rimOp: 0.9, shade: 0.4 });
    s.add(`<g data-part="fface" transform="${fx}">${fishFace(p.rim)}</g>`);
    s.add([[112, 92, 2.4], [108, 80, 1.8], [111, 69, 1.4], [106, 59, 1]].map(([x, y, r], i) =>
      `<circle class="rise" style="--t:${6 + i}s;--d:${-i * 1.5}s;--o:.85" cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#e9fdfb" stroke-width=".7" opacity=".85"/>`).join(''));
    // the light on its skin of water
    s.add('<g data-part="bshine">');
    s.bloom(`<path d="M${cx - 44},${cy - 22}A50,50 0 0 1 ${cx - 14},${cy - 50}" stroke="#ffffff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/><circle cx="${cx - 40}" cy="${cy - 34}" r="2.4" fill="#fff"/>`,
      { sd: 1.6, k: 1.2, box: [cx - 70, cy - 70, 80, 70] });
    s.add(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#e9fdfb" stroke-width="1.4" opacity=".8"/>`);
    s.add('</g>');
    s.add(drops([[146, 152], [156, 157]], '#e9fdfb'));
    s.motes({ seed: 653, n: 10, x: [60, 240], y: [30, 150], r: [0.4, 1], fill: '#e6fbf8', cls: 'float', t: [6, 10], op: [0.3, 0.8] });
    return s.svg();
  },
});

const umbral = faction('umbral', {
  // A hooded woman blows a kiss off her pale hand; it breaks into violet moths
  // that wheel away up to a thin moon.
  'kiss-of-night'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#07050d'], [0.45, '#1c1430'], [0.72, '#43306a'], [0.8, '#2c2044'], [1, '#100b18']]));
    s.add(particles({ seed: 711, n: 24, x: [80, W], y: [0, 120], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.85], t: [2.5, 6] }));
    // the moon, a thin crescent
    s.add('<g data-part="moon">');
    s.glow(226, 46, 86, '#c9b8f2', 0.36);
    s.bloom(`<path d="${crescent(226, 46, 24, 9, -6, 21)}" fill="#ece4f8"/>`, { sd: 2.4, k: 1, box: [176, 0, 100, 100] });
    s.add('</g>');
    // the moor, and a dead tree on it
    s.path(ledge([[-10, 160], [60, 152], [120, 156], [180, 150], [240, 155], [310, 150]]), '#2c2244');
    s.add(`<g fill="#2c2244">${parts([taper([[262, 154], [262, 132], [258, 118]], [4, 2.6, 0.8]), taper([[262, 136], [272, 126], [278, 124]], [1.8, 1.1, 0.3]), taper([[260, 126], [252, 116]], [1.4, 0.3])])}</g>`);
    s.fog(152, '#8c78b8', 0.2);
    s.path(ledge([[-10, 186], [70, 180], [150, 184], [230, 178], [310, 182]]), '#140e1e');
    // the one who blows it: a hooded profile at the left edge, a sleeve raised
    const lady = P(blob([[-14, 36], [10, 27], [34, 28], [52, 36], [64, 46], [69, 56], [66.6, 62.4], [66.4, 66], [68, 70], [69.4, 73], [75, 80], [71, 82.6], [72.4, 85],
      [74.6, 87.2], [72.6, 89.4], [72.8, 91.2], [69, 96], [64.4, 98.8], [62.6, 104], [66, 112], [70, 128], [74, 150], [76, 178], [72, 220], [-14, 220]], 4)).replace(/^/, '<g data-part="lady">') + '</g>' + '<g data-part="sleeve">' + P(taper([[66, 136], [74, 118], [82, 105]], [13, 10, 8])) + '</g>';
    s.figure(lady, { fill: p.fig, rim: '#d9c8f6', offsets: [[1.2, -0.4], [0.8, -1]], rimOp: 0.9, halo: 0.25 });
    // her pale hand, palm up, the kiss leaving it
    s.add('<g data-part="hand">');
    s.glow(98, 98, 26, '#d9c8f6', 0.4);
    s.bloom(`<g fill="#e6dcf4">${parts([
      blob([[80, 104], [84, 99], [94, 97], [102, 97], [104, 100], [98, 103], [88, 105]]),
      taper([[100, 98], [107, 96], [113, 94.5]], [3.2, 2.6, 1.6]), taper([[101, 99.6], [108, 98.8], [114, 98.4]], [3, 2.4, 1.5]),
      taper([[100, 101.4], [106, 101.6], [111, 102]], [2.8, 2.2, 1.4]), taper([[88, 98], [90, 93], [93, 90]], [3.4, 2.6, 1.8]),
      taper([[81, 105], [87, 101]], [6, 5.4]),
    ])}</g>`, { sd: 1.2, k: 0.6, box: [66, 80, 60, 36] });
    s.add('</g>');
    // the moths, spiralling up from her fingertips toward the moon
    const wing = s.rad([[0, '#f1e6ff'], [0.45, '#b98cff'], [1, '#6a3fc0']]);
    s.glow(150, 78, 40, '#9b6bff', 0.4).glow(196, 52, 30, '#9b6bff', 0.3);
    s.add([[122, 88, 0.62, 40], [138, 74, 0.82, -12], [156, 86, 0.95, 46], [170, 64, 1.1, -24], [150, 54, 0.74, -46], [186, 46, 0.86, 14], [200, 68, 0.64, 56], [206, 32, 0.54, -8]].map(([x, y, k, a], i) =>
      `<g data-part="moth${i}">${moth(x, y, k, a, wing, '#1a1028')}</g>`).join(''));
    s.motes({ seed: 714, n: 12, x: [110, 230], y: [30, 110], r: [0.4, 1], fill: '#c9a6ff', cls: 'float', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },

  // A black adder rears out of the reeds against the moon, fangs catching the light.
  'marsh-adder'(s) {
    const p = PAL.umbral;
    const hz = 146, M = [178, 60];
    s.rect(s.lin([[0, '#08060f'], [0.42, '#1f1732'], [0.66, '#46335f'], [0.7, '#2e2442']]));
    s.add(particles({ seed: 721, n: 26, x: [0, W], y: [0, 110], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.85], t: [2.5, 6] }));
    s.glow(M[0], M[1], 130, '#c9b8f2', 0.36);
    s.bloom(`<circle cx="${M[0]}" cy="${M[1]}" r="30" fill="#ebe4f6"/><g fill="#d4c9e8" opacity=".6"><circle cx="168" cy="52" r="5"/><circle cx="190" cy="70" r="3.4"/><circle cx="186" cy="46" r="2.2"/></g>`, { sd: 2.6, k: 1, box: [128, 10, 100, 100] });
    // far willows and reeds on the horizon, the marsh water and the moon's road on it
    s.blur(`<path d="${canopy({ seed: 722, base: 148, top: 128, x0: -20, x1: 110, r0: 6, r1: 12 })}" fill="#3f3060"/><path d="${reeds(723, 196, 310, 148, 10, 22, 0.25)}" fill="#3f3060"/>`, 0.7);
    s.path(`M-10,${hz}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#3d2f58'], [0.3, '#1a1328'], [1, '#07050b']]));
    s.add(glints([[178, 150, 30, 0.55], [176, 156, 22, 0.42], [180, 163, 26, 0.32], [177, 171, 16, 0.24], [179, 180, 20, 0.16]], '#e6def4'));
    // reeds behind it
    s.path(reeds(724, 40, 120, 160, 26, 52, 0.35) + reeds(725, 196, 276, 162, 24, 48, 0.35), '#251c38');
    // the adder: an S rising from its coils to a viper's head, jaws open
    const spine = [[96, 206], [112, 190], [136, 184], [156, 176], [162, 160], [150, 146], [134, 136], [130, 120], [140, 104], [158, 94], [172, 84], [179, 72]];
    const snake = '<g data-part="body">' + P(taper(spine, [12, 14, 15, 15, 14, 13, 12, 11, 10, 9, 8.4, 8], { per: 10 })) + '</g>' +
      '<g data-part="head">' + P(poly([[188, 66], [187, 57], [181, 51], [171, 48.5], [162, 50], [154, 53], [148, 56.5], [149, 59.2], [156, 60.2], [166, 61], [177, 64]])) +
      P(taper([[184, 68], [170, 77], [156, 85]], [7.4, 4.6, 1.4])) + '</g>';
    s.figure(snake, { fill: p.fig, rim: '#d9cff2', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.9, halo: 0.3 });
    // a violet zig-zag down its back
    const back = spline(spine, 10);
    let zig = '';
    for (let i = 6, k = 1; i < back.length - 3; i += 4, k = -k) {
      const [x, y] = back[i], [x2, y2] = back[i + 1], l = Math.hypot(x2 - x, y2 - y) || 1;
      zig += `${zig ? 'L' : 'M'}${f1(x - ((y2 - y) / l) * 2.6 * k)},${f1(y + ((x2 - x) / l) * 2.6 * k)}`;
    }
    s.add(`<path data-part="zig" d="${zig}" fill="none" stroke="#a97cf6" stroke-width="1.7" stroke-linejoin="round" opacity=".75"/>`);
    // fangs, eye and tongue
    s.add('<g data-part="face">');
    s.glow(172, 56, 8, '#b07cff', 0.8);
    s.bloom('<path d="M153.6,60Q153.8,65.6 156,68.6Q155.8,64 156.8,60.4Z" fill="#f6f0ff"/><path d="M158.8,60.8Q159,65.6 161,68.2Q160.8,64.2 161.8,61.2Z" fill="#f6f0ff"/>' +
      '<ellipse cx="172" cy="56" rx="2.4" ry="1.1" fill="#efe2ff"/>', { sd: 1, k: 1.3, box: [140, 44, 44, 34] });
    s.add('<path d="M152,69L144,72M144,72L139.4,69.6M144,72L140.6,75.8" stroke="#c08cff" stroke-width=".9" fill="none" stroke-linecap="round"/><path d="M164,50.6Q170,48 177,50.6" stroke="#2b2140" stroke-width="1" fill="none"/></g>');
    // reeds and cattails in front, and the dark water at its coils
    s.path(reeds(726, -10, 70, 214, 40, 78, 0.4) + reeds(727, 226, 310, 214, 36, 74, 0.4) + reeds(728, 104, 172, 214, 26, 54, 0.3), '#07050b');
    s.add('<g fill="none" stroke="#9a86c4" opacity=".4"><ellipse cx="112" cy="196" rx="20" ry="2.4"/><ellipse cx="112" cy="197" rx="32" ry="4" opacity=".5"/></g>');
    s.motes({ seed: 729, n: 12, x: [40, 280], y: [40, 180], r: [0.4, 1], fill: '#cdb8f0', cls: 'float', t: [6, 10], op: [0.25, 0.7] });
    return s.svg();
  },

  // The Barrow Queen sits her throne of tilted gravestones on top of her barrow;
  // violet light blazes behind it and her dead court rises out of the earth.
  'the-barrow-queen'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#07050d'], [0.38, '#1e1533'], [0.64, '#4a3474'], [0.74, '#2c2044'], [1, '#110c1a']]));
    s.add(particles({ seed: 771, n: 16, x: [0, W], y: [0, 90], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.85], t: [2.5, 6] }));
    // a thin moon, and the far moor with its standing stones
    s.glow(52, 36, 46, '#c9b8f2', 0.3);
    s.add(`<path d="${crescent(52, 36, 13, -5, -3, 11)}" fill="#e6def4"/>`);
    s.blur(`<path d="${ledge([[-10, 150], [50, 142], [110, 146], [190, 141], [250, 146], [310, 142]])}M30,145V134h3v11ZM38,145V137h2.6v8ZM262,145V131h3.4v14ZM270,145V136h2.6v9Z" fill="#3a2b58"/>`, 0.8);
    // the light of her court, blazing up behind the throne
    s.glow(150, 104, 150, '#9b6bff', 0.5);
    s.shafts({ cx: 150, cy: 112, from: -172, to: -8, n: 10, len: 230, spread: 2.2, color: '#c9a6ff', op: 0.24, seed: 772, sd: 2.4 });
    // the barrow, its slopes set with old stones
    s.figure(P(ledge([[-10, 188], [30, 172], [70, 158], [110, 148], [150, 144], [190, 148], [230, 158], [270, 172], [310, 186]])),
      { fill: '#150f20', rim: '#b8a6e2', offsets: [[0, -1.2]], rimOp: 0.7 });
    s.add(`<g fill="#221a33">${stone(36, 180, 9, 14, -14)}${cross(62, 166, 16, -8)}${stone(244, 166, 10, 15, 10)}${cross(272, 178, 15, 12)}</g>`);
    // the throne: gravestones fanned out behind her like a crown
    const fan = [[-58, 50], [-38, 60], [-17, 66], [17, 66], [38, 60], [58, 50]];
    s.figure(fan.map(([a, h]) => lean(stoneD(150, 142, 17, h), 150, 142, a)).join('') +
      '<path d="M116,144V131H184V144Z"/><path d="M108,144V122H124V144ZM176,144V122H192V144Z"/>',
      { fill: '#1d1630', rim: '#d2c2f6', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.8 });
    s.add(`<g stroke="#2e2445" stroke-width="1.4" fill="none">${fan.map(([a, h]) =>
      `<path d="M150,${142 - h + 14}V${142 - h + 26}M145,${142 - h + 18}H155" transform="rotate(${a} 150 142)"/>`).join('')}</g>`);
    // the queen: spiked collar, long gown spilling down the barrow, a sceptre
    // in one hand, the other raised to call them up
    const queen = parts([
      poly([[134, 85], [131, 63], [140, 72], [144, 61], [150, 73], [156, 61], [160, 72], [169, 63], [166, 85]]),
      taper([[150, 70], [150, 79]], [5, 6.4]),
      blob([[134, 84], [166, 84], [164, 100], [158, 118], [142, 118], [136, 100]]),
      taper([[136, 88], [128, 104], [122, 121]], [7, 6, 5]),
      taper([[164, 88], [176, 97], [184, 86]], [7, 6, 5]),
      taper([[184, 86], [187, 79]], [4.4, 3.6]),
      taper([[186, 79], [185, 72]], [1.6, 0.6]), taper([[187.6, 79], [189, 72]], [1.6, 0.6]), taper([[189, 80], [192, 74]], [1.5, 0.6]), taper([[184.6, 80.6], [181, 76]], [1.6, 0.6]),
      taper([[121, 146], [119.4, 80]], [2.6, 2.2]),
      blob([[136, 115], [164, 115], [170, 132], [130, 132]]),
      poly([[134, 128], [166, 128], [176, 148], [190, 164], [206, 176], [180, 173], [168, 180], [150, 175], [132, 180], [120, 173], [94, 176], [110, 164], [124, 148]]),
    ]) + '<ellipse cx="150" cy="64" rx="6.4" ry="8"/><circle cx="119.4" cy="77" r="4.6"/><circle cx="121" cy="123" r="3"/>';
    s.figure(queen, { fill: p.fig, rim: '#e2d4f6', offsets: [[0, -1.3], [-1.1, -0.6], [1.1, -0.6]], rimOp: 0.9, shade: 0.35, halo: 0.4 });
    s.add('<g fill="#1d1630"><circle cx="117.6" cy="76.2" r="1.1"/><circle cx="121.2" cy="76.2" r="1.1"/></g>');
    // the crown and her eyes burn violet
    s.glow(150, 50, 22, '#b07cff', 0.75, 'breathe');
    s.bloom('<path d="M141,57L141,50L143.5,52.5L145,41L147.6,51.5L150,34L152.4,51.5L155,41L156.5,52.5L159,50L159,57Z" fill="#c9a6ff"/>' +
      '<path d="M145.4,63.2H148.6M151.4,63.2H154.6" stroke="#f1e6ff" stroke-width="1.5" stroke-linecap="round"/>', { sd: 1.4, k: 1.4, box: [126, 22, 48, 54] });
    // her court rising out of the earth: hooded shapes of mist, bowed low,
    // long arms reaching toward her
    const ghost = (x, y, k, dir) => `<g transform="translate(${x} ${y}) scale(${f1(k * dir)} ${f1(k)})">` +
      P(taper([[0, 3], [1, -10], [-1, -22], [2, -34], [5, -42]], [1, 5, 7.5, 8.5, 7.5]) + blob([[3, -42], [6, -48.5], [11, -50.5], [15, -47.5], [14.4, -43], [9.6, -41]]) +
        taper([[5, -38], [14, -34], [23, -33], [30, -36], [35, -38.5]], [3, 2.3, 1.7, 0.9, 0.3]) + taper([[1, -37], [-3, -28], [-1, -18]], [2.3, 1.7, 0.6])) + '</g>';
    const court = [[66, 168, 1, 1], [100, 178, 0.8, 1], [38, 186, 0.7, 1], [234, 168, 1, -1], [200, 178, 0.8, -1], [262, 186, 0.7, -1]];
    s.glow(66, 150, 52, '#b07cff', 0.3).glow(234, 150, 52, '#b07cff', 0.3);
    s.add(`<g data-part="court" fill="${s.lin([[0, '#efe6ff', 0.8], [0.6, '#c9b4f2', 0.5], [1, '#b8a0ea', 0.05]])}">${court.map(([x, y, k, d]) => ghost(x, y, k, d)).join('')}</g>`);
    s.add(`<g data-part="court" fill="#1a1028" opacity=".75">${court.map(([x, y, k, d]) => `<ellipse cx="${f1(x + 10.6 * k * d)}" cy="${f1(y - 45.4 * k)}" rx="${f1(1.9 * k)}" ry="${f1(1.3 * k)}"/>`).join('')}</g>`);
    s.add(particles({ seed: 774, n: 12, x: [30, 270], y: [90, 200], r: [0.4, 1.2], fill: '#d9c2ff', cls: 'rise', t: [5, 9], op: [0.3, 0.85] }));
    return s.svg();
  },

  // A great bat spreads violet-veined wings across a blood-red moon, above a
  // ruined spire.
  'vesper-bat'(s) {
    const M = [150, 92];
    s.rect(s.lin([[0, '#08060f'], [0.45, '#1e1530'], [0.72, '#3e2c58'], [0.8, '#2a1f3e'], [1, '#100b18']]));
    s.add(particles({ seed: 731, n: 18, x: [0, W], y: [0, 100], r: [0.25, 0.75], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    // the blood moon
    s.glow(M[0], M[1], 160, '#b8323e', 0.45);
    s.bloom(`<circle cx="${M[0]}" cy="${M[1]}" r="70" fill="${s.rad([[0, '#f39a84'], [0.55, '#d4555a'], [1, '#9c2c40']], { cx: 0.42, cy: 0.38, r: 0.68 })}"/>` +
      `<g fill="#a63446" opacity=".45">${circ([[120, 64, 11], [176, 118, 8], [182, 58, 5.4], [112, 120, 4.6]])}</g>`, { sd: 3, k: 0.9, box: [50, 0, 200, 190] });
    s.add(`<g fill="#140812">${parts([bird(212, 40, 1), bird(232, 56, 0.8), bird(64, 48, 0.9)])}</g>`);
    // the ruined town: far roofs, a broken arcade, and the spire under the moon
    s.blur(`<path d="${ruins({ seed: 732, base: 178, x0: -10, x1: 310, h: [8, 26], w: [8, 18] })}" fill="#2a1f3e"/>`, 0.7);
    s.path(arcade({ seed: 733, x0: 172, x1: 316, base: 214, h: 46, bay: 26, col: 7 }), '#0c0812', 'fill-rule="evenodd"');
    s.figure(P('M112,214V158H142V214Z') + P('M114,159V140H140V159ZM123,157V147Q127,140 131,147V157Z', 'fill-rule="evenodd"') +
      P('M113,141L124,124L126.4,128L128.4,119L141,141Z') + P('M111,142L113,132L115,142ZM139,142L141,132L143,142Z'),
      { fill: '#0c0812', rim: '#e8888a', offsets: [[0, -1.1], [0.8, -0.6]], rimOp: 0.7 });
    s.path('M-10,214V176L14,170L30,178L48,172L66,180L84,176L100,184L104,214Z', '#0c0812');
    // the bat: arms, finger-bones and the scalloped skin between them
    const wingR = 'M5,-6L26,-18L48,-27L90,-18Q77,-7 84,12Q70,6 64,31Q51,17 38,33Q26,20 11,22L6,8Z';
    const ears = 'M-6.5,-16L-9.5,-31L-1.5,-20Z', thumb = 'M48,-27L49,-34L52,-27Z';
    const bt = 'translate(150 82) scale(1.2)';
    s.figure(`<g transform="${bt}">${`<g data-part="wings">${P(wingR + flipX(wingR))}</g>`}<g data-part="body">${P('M-9,4a9,15 0 1 1 18,0a9,15 0 1 1 -18,0Z' + disc(0, -14, 7.5) + ears + flipX(ears) + thumb + flipX(thumb) +
      taper([[-4, 17], [-6, 24]], [2.6, 0.4]) + taper([[4, 17], [6, 24]], [2.6, 0.4]))}</g></g>`,
      { fill: s.radU(0, 4, 96, [[0, '#46142c'], [0.5, '#1c0914'], [1, '#0b0509']]), rim: '#ff9c8c', offsets: [[0, -1], [-1, 0], [1, 0], [0, 1]], rimOp: 0.7, halo: 0.3 });
    const veins = 'M5,-6L26,-18L48,-27L90,-18M48,-27L84,12M48,-27L64,31M48,-27L38,33M26,-18L11,22';
    s.add('<g data-part="veins">');
    s.bloom(`<path d="${veins}${flipX(veins)}" transform="${bt}" fill="none" stroke="#b98cf6" stroke-width=".7" stroke-linecap="round" opacity=".7"/>`, { sd: 1, k: 1, box: [30, 30, 240, 120] });
    s.add('</g><g data-part="eyes">');
    s.glow(150, 64.5, 10, '#d6a0ff', 0.7);
    s.add('<g fill="#f3dcff"><circle cx="146.6" cy="64.4" r="1.1"/><circle cx="153.4" cy="64.4" r="1.1"/></g></g>');
    s.add(particles({ seed: 734, n: 12, x: [40, 260], y: [30, 190], r: [0.4, 1.1], fill: '#e0a0c8', cls: 'float', t: [6, 10], op: [0.25, 0.7] }));
    return s.svg();
  },

  // An altar of stacked bones in a crypt; candles gutter on it and a cold violet
  // flame burns on top.
  'bone-altar'(s) {
    s.rect(s.lin([[0, '#06040b'], [0.5, '#140f21'], [1, '#0a0710']]));
    // the vault behind, lit by the flame
    s.glow(150, 74, 170, '#7a4fd0', 0.5);
    s.path('M40,214V96Q40,26 150,18Q260,26 260,96V214Z', s.lin([[0, '#2b2148'], [0.6, '#1f1834'], [1, '#120d1e']]));
    s.add('<g fill="none" stroke="#3a2d5c" stroke-width="1.2" opacity=".8"><path d="M70,214V100Q70,50 150,44Q230,50 230,100V214M40,130H70M230,130H260M40,100H70M230,100H260"/></g>');
    // niches with skulls in the side walls
    s.path('M47,174V140Q47,130 55.5,130Q64,130 64,140V174ZM236,174V140Q236,130 244.5,130Q253,130 253,140V174Z', '#0d0916');
    s.add(`<g fill="#7d7298">${skull(55.5, 168, 0.55)}${skull(244.5, 168, 0.55)}</g>`);
    // pillars in front, and the floor
    s.path('M-10,214V-10H30V214ZM270,214V-10H310V214Z', '#08060d');
    s.path('M-10,184H310V214H-10Z', '#0d0915');
    s.add('<path d="M30,196H270M60,184L50,214M120,184L116,214M180,184L184,214M240,184L250,214" stroke="#1d1630" stroke-width="1" fill="none"/>');
    // the steps and the altar's stone core
    s.figure('<path d="M80,190V182H220V190Z"/><path d="M90,182V172H210V182Z"/>', { fill: '#120d1c', rim: '#a08cc8', offsets: [[0, -1.2]], rimOp: 0.8 });
    s.path('M102,172V114H198V172Z', '#0c0814');
    // bones laid in courses, a row of skulls between them
    s.figure(P(boneD(100, 150, 120, 6) + boneD(150, 200, 121, 6.4) + boneD(98, 136, 151, 6) + boneD(136, 172, 150, 6.4) + boneD(172, 202, 151, 5.6) +
      boneD(102, 158, 163, 6.4) + boneD(158, 198, 164, 6)), { fill: '#5a4e78', rim: '#d9c8f6', offsets: [[0, -1]], rimOp: 0.85 });
    s.add(`<g data-part="skulls" fill="#7d7298">${skull(122, 143, 0.8)}${skull(150, 143, 0.85)}${skull(178, 143, 0.8)}</g>`);
    // the top slab and the bowl
    s.figure('<path d="M96,114V106H204V114Z"/><path d="M128,97H172L165,104H135Z"/><path d="M125,94H175V97.4H125Z"/><path d="M145,103V106H155V103Z"/>', { fill: '#1d1630', rim: '#e6d6ff', offsets: [[0, -1.2]], rimOp: 0.9 });
    // candles, their wax running down over the bones
    const candles = [[107, 106, 15], [117, 106, 9], [185, 106, 13], [195, 106, 8], [66, 198, 22], [236, 198, 18]];
    s.add(`<g fill="#d6cce8">${candles.map(([x, b, h]) => `<rect x="${x - 2.4}" y="${b - h}" width="4.8" height="${h}" rx=".8"/>`).join('')}</g>`);
    s.add('<path d="M106,114v8M117,114v5M186,114v10M195,114v4M64,184v6M238,186v5" stroke="#d6cce8" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>');
    s.glow(112, 88, 18, '#d9c2ff', 0.6).glow(190, 90, 18, '#d9c2ff', 0.6).glow(66, 172, 18, '#d9c2ff', 0.6).glow(236, 176, 16, '#d9c2ff', 0.6);
    // the cold flame
    s.glow(150, 64, 62, '#b07cff', 0.8, 'breathe');
    const tongue = (x, b) => `M${x},${b - 7}C${x + 2.4},${b - 3} ${x + 1.8},${b} ${x},${b}C${x - 1.8},${b} ${x - 2.4},${b - 3} ${x},${b - 7}Z`;
    s.add('<g data-part="flames">');
    s.bloom(`<g fill="#9b6bff">${parts([
      taper([[150, 96], [144, 76], [153, 54], [146, 28]], [30, 21, 9, 0.6]),
      taper([[138, 96], [131, 80], [135, 62]], [13, 9, 0.5]),
      taper([[162, 96], [170, 80], [166, 60]], [13, 9, 0.5]),
    ])}</g><path d="${taper([[150, 96], [147.4, 78], [151.4, 54]], [17, 10, 0.5])}" fill="#dcc8ff"/><path d="${taper([[150, 96], [150, 86], [150.6, 72]], [8, 5, 0.4])}" fill="#ffffff"/>` +
      `<path d="${candles.map(([x, b, h]) => tongue(x, b - h - 1)).join('')}" fill="#efe2ff"/>`, { sd: 1.8, k: 1.3, box: [40, 20, 220, 190] });
    s.add('</g>');
    s.add(particles({ seed: 754, n: 14, x: [128, 172], y: [16, 92], r: [0.4, 1.1], fill: '#d9c2ff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A gaunt ghoul crouches on a gravestone in the fog, long fingers hooked over
  // its edge, eyes burning violet.
  'hungry-ghoul'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0b0814'], [0.45, '#241a38'], [0.7, '#4a3a68'], [1, '#1a1426']]));
    s.add(particles({ seed: 741, n: 18, x: [0, W], y: [0, 90], r: [0.25, 0.75], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    s.glow(156, 50, 96, '#c9b8f2', 0.42);
    s.add('<circle cx="156" cy="50" r="23" fill="#e6def4"/><circle cx="148" cy="44" r="4.4" fill="#cfc4e4" opacity=".6"/><circle cx="164" cy="60" r="3" fill="#cfc4e4" opacity=".5"/>');
    // the graveyard going back into the fog
    s.blur(`<path d="${ledge([[-10, 142], [50, 136], [110, 139], [170, 134], [230, 138], [310, 135]])}" fill="#4a3c6c"/>` +
      `<g fill="#4a3c6c">${cross(30, 140, 14, -6)}${stone(52, 139, 8, 11)}${cross(214, 137, 13, 7)}${stone(236, 138, 9, 12, -5)}${cross(268, 136, 16, -3)}</g>`, 0.7);
    s.fog(136, '#b3a2dc', 0.3);
    s.path(ledge([[-10, 164], [60, 158], [120, 161], [190, 157], [250, 160], [310, 156]]), '#2a2040');
    s.add(`<g fill="#2a2040">${stone(30, 162, 14, 22, -9)}${cross(66, 160, 24, 6)}${stone(232, 159, 13, 20, 6)}${cross(270, 157, 28, -6)}</g>`);
    s.fog(154, '#9a86c4', 0.26);
    s.path(ledge([[-10, 190], [60, 186], [130, 190], [200, 188], [260, 184], [310, 188]]), '#120d1b');
    // its gravestone
    const gt = 'translate(166 206) scale(1.3) translate(-166 -206)';
    s.figure(`<g transform="${gt}">${P('M138,206V132Q140,124 166,123Q192,124 194,132V206Z')}</g>`, { fill: '#241c38', rim: '#d2c2f2', offsets: [[0, -1.1]], rimOp: 0.75 });
    s.add(`<g transform="${gt}" stroke="#1c1630" stroke-width="1.6" fill="none"><path d="M166,140V164M158,148H174"/><path d="M146,180H186M150,188H182" stroke-width="1"/></g>`);
    // the ghoul: haunches high, back arched, the long skull thrust out low,
    // arms hanging between its knees to the stone's edge
    const ghoul = `<g data-part="body" transform="${gt}">${parts([
      taper([[190, 116], [187, 102], [178, 89], [162, 83]], [12, 14, 13, 10]),
      taper([[188, 114], [182, 100], [176, 87]], [9, 7, 5.6]), taper([[176, 87], [179, 106], [181, 123]], [5.6, 4.4, 3.6]),
      taper([[182, 116], [168, 102], [157, 89]], [9, 7, 5.4]), taper([[157, 89], [155, 108], [153, 123]], [5.4, 4.2, 3.4]),
      taper([[182, 123], [176, 125.5], [169, 126]], [5, 3.6, 2.2]), taper([[155, 123], [148, 125.5], [143, 126.4]], [5, 3.6, 2]),
      taper([[143.5, 126], [141, 129], [140.6, 133]], [1.8, 1.4, 0.5]),
      taper([[164, 84], [152, 87], [142, 91]], [7, 5.6, 5]),
    ])}</g>` +
      `<g data-part="head" transform="${gt}">${parts([
      blob([[143, 86], [137, 83.6], [129, 84.4], [122, 88], [118.6, 93], [122, 97], [130, 99], [138, 97.6], [143.6, 93]]),
      taper([[141, 86], [149, 79.6], [154, 77.6]], [3.6, 1.6, 0.3]),
    ])}</g>` +
      `<g data-part="jaw" transform="${gt}">${parts([taper([[136, 97.6], [128, 102.6], [121, 104]], [5, 3, 1.2])])}</g>` +
      `<g data-part="armA" transform="${gt}">${parts([
      taper([[160, 86], [152, 98], [147, 108]], [5.4, 4.4, 3.8]), taper([[147, 108], [143, 118], [140, 128]], [3.8, 3.2, 2.8]),
      taper([[140, 128], [137, 134], [136.4, 144]], [2.2, 1.7, 0.5]), taper([[141, 129], [139.6, 137], [140, 147]], [2.1, 1.6, 0.5]), taper([[142.4, 129], [142.8, 136], [144, 143]], [1.9, 1.5, 0.5]),
    ])}</g>` +
      `<g data-part="armB" transform="${gt}">${parts([
      taper([[168, 88], [169, 104], [166, 118]], [4.6, 3.8, 3]), taper([[166, 118], [162, 122], [158, 124]], [3.4, 2.6, 1]), taper([[166, 119], [164, 124], [163.6, 127]], [2.6, 2, 0.6]),
    ])}</g>` + `<g data-part="body" transform="${gt}"><ellipse cx="170" cy="83" rx="8" ry="4.6" transform="rotate(-20 170 83)"/>${circ([[192, 100, 1.8], [186.6, 92.4, 1.8], [179.6, 86, 1.8], [171.4, 80.6, 1.7], [164.4, 79.4, 1.6]])}</g>`;
    s.figure(ghoul, { fill: p.fig, rim: '#e2d4f6', offsets: [[0, -1.2], [-1, -0.6], [1, -0.6]], rimOp: 0.9, shade: 0.45, halo: 0.3 });
    s.add(`<g data-part="ribs"><path d="M181,94q-3,7 0,12M175,91q-3,7 0,12M186,99q-2.6,6 0,10" transform="${gt}" stroke="#c9b8f2" stroke-width=".8" fill="none" opacity=".4"/></g>`);
    // too many eyes
    s.add('<g data-part="eyefire">');
    s.glow(115.3, 55.2, 16, '#b07cff', 0.8);
    s.bloom(`<g transform="${gt}" fill="#efe2ff"><ellipse cx="128" cy="89.6" rx="1.7" ry="1.1"/><ellipse cx="123.2" cy="91.2" rx="1.3" ry=".9"/><ellipse cx="132.4" cy="88.4" rx="1" ry=".7"/></g>`, { sd: 1.2, k: 1.4, box: [96, 40, 40, 30] });
    s.add('</g>');
    s.fog(198, '#8c78b8', 0.2);
    s.add(particles({ seed: 744, n: 12, x: [60, 280], y: [60, 190], r: [0.4, 1], fill: '#cdb8f0', cls: 'float', t: [6, 10], op: [0.25, 0.65] }));
    return s.svg();
  },

  // A giant scythe of violet light sweeps across a field of small figures; those
  // it has passed through come apart into wisps. One tall shape is spared.
  'the-culling'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#07050c'], [0.4, '#1b1430'], [0.64, '#3d2b5e'], [0.73, '#5b4282'], [0.78, '#2a2040'], [1, '#0e0a16']]));
    const clouds = [[30, 10, 70, 24], [130, 2, 80, 26], [230, 8, 74, 24], [310, 20, 50, 20]];
    s.add(`<g fill="#3a2a58">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y + 4}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add(`<g fill="#0c0816">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    // the field
    s.blur(`<path d="${ledge([[-10, 158], [60, 152], [130, 156], [200, 150], [260, 155], [310, 151]])}" fill="#3a2b58"/>`, 0.7);
    s.path(ledge([[-10, 176], [80, 172], [160, 176], [240, 171], [310, 175]]), '#151020');
    // the swath the blade has cut, fading back toward where it began
    s.glow(120, 140, 90, '#9b6bff', 0.4);
    s.path('M60,146C96,124 150,112 210,110C250,109 290,112 312,116V172C280,170 240,168 200,168C150,166 104,160 60,148Z',
      s.lin([[0, '#c9a6ff', 0.5], [0.5, '#9b6bff', 0.22], [1, '#7a4fd0', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    // the people: whole ahead of the blade, cut and coming apart behind it,
    // and one tall shape that the blade went through and left standing
    const legs = taper([[-1.6, -10], [-2.6, 0]], [2.4, 2]) + taper([[1.6, -10], [3, 0]], [2.4, 2]);
    const whole = (x, b, k, ears = false) => `<g transform="translate(${x} ${b}) scale(${k})">${P(legs + taper([[0, -9], [0, -17]], [5.4, 4.6]) + disc(0.6, -20.4, 2.8) +
      taper([[1.6, -16], [4.4, -11]], [1.8, 1.4]) + taper([[-1.6, -16], [-3.4, -11]], [1.8, 1.4]) + (ears ? taper([[-1, -21], [-5, -24]], [1.4, 0.3]) + taper([[2, -21], [6, -24]], [1.4, 0.3]) : ''))}</g>`;
    const cut = (x, b, k) => `<g transform="translate(${x} ${b}) scale(${k})">${P(legs + taper([[0, -9], [0, -12.5]], [5.4, 5]))}</g>`;
    const giant = '<g transform="translate(198 176)">' + P(
      taper([[-4, -30], [-6, -14], [-7, 0]], [7, 6, 5.4]) + taper([[4, -30], [6, -14], [8, 0]], [7, 6, 5.4]) +
      taper([[0, -28], [0, -46], [0, -56]], [16, 20, 22]) + disc(-10, -55, 6) + disc(10, -55, 6) +
      'M-5,-58V-66Q-5,-71 0,-71.5Q5,-71 5,-66V-58Z' + taper([[-4, -69], [-9, -75], [-11, -81]], [2.4, 1.6, 0.4]) + taper([[4, -69], [9, -75], [11, -81]], [2.4, 1.6, 0.4]) +
      taper([[12, -53], [16, -40], [15, -30]], [6, 5, 4.4]) + taper([[-12, -53], [-15, -40], [-13, -31]], [6, 5, 4.4]) +
      'M13.4,-34V2H16.6V-34ZM9,-33H21V-30.6H9Z') + '</g>';
    const crowd = [[78, 176, 1.05], [98, 175, 0.95], [118, 176, 1.1], [140, 176, 0.9], [160, 177, 1], [228, 175, 1], [250, 176, 0.9], [272, 175, 1.05]];
    s.figure(`<g data-part="folk0">${whole(26, 177, 1.05)}</g><g data-part="folk1">${whole(44, 176, 0.85, true)}</g><g data-part="folk2">${whole(58, 177, 1)}</g>` + crowd.map(([x, b, k]) => cut(x, b, k)).join('') + giant,
      { fill: '#0b0710', rim: '#d9c2ff', offsets: [[0, -1], [0.8, -0.5]], rimOp: 0.8 });
    s.add(`<g data-part="ghosts" fill="#d9c2ff" opacity=".42">${parts(crowd.map(([x, b, k]) =>
      taper([[x + 1, b - 9 * k], [x + 2, b - 17 * k]], [5.4 * k, 4.6 * k]) + disc(x + 2.8 * k, b - 20.6 * k, 2.8 * k)))}</g>`);
    s.add(`<g data-part="wisps" fill="#e6d6ff" opacity=".6">${parts(crowd.map(([x, b, k]) =>
      taper([[x + 2, b - 16 * k], [x + 6 * k, b - 25 * k], [x + 13 * k, b - 31 * k], [x + 22 * k, b - 35 * k]], [3.6 * k, 2.6 * k, 1.4 * k, 0.2]) +
      taper([[x + 3.4 * k, b - 21 * k], [x + 9 * k, b - 27 * k], [x + 17 * k, b - 28 * k]], [2.6 * k, 1.6 * k, 0.2]) +
      taper([[x, b - 13 * k], [x + 6 * k, b - 17 * k], [x + 12 * k, b - 17 * k]], [2.2 * k, 1.4 * k, 0.2])))}</g>`);
    // the scythe
    s.bloom('<g data-part="scythe"><path d="M300,-8L216,130" stroke="#d9c2ff" stroke-width="3" stroke-linecap="round"/><path d="M252,66L262,72" stroke="#d9c2ff" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M218,122C178,112 118,118 62,146C104,136 158,132 216,134Z" fill="#f1e6ff"/></g>', { sd: 2.2, k: 1.3 });
    s.add(particles({ seed: 764, n: 18, x: [70, 290], y: [110, 170], r: [0.4, 1.2], fill: '#d9c2ff', cls: 'rise', t: [4, 8], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A skeletal wyrm circles low over a battlefield under storm clouds, violet
  // light burning in its ribs.
  'carrion-wyrm'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0a0712'], [0.38, '#2a1d44'], [0.64, '#5b4282'], [0.76, '#3a2a58'], [1, '#120d1c']]));
    s.glow(160, 76, 160, '#a77cf0', 0.52);
    // storm clouds with lit undersides, lightning far off
    const clouds = [[24, 14, 64, 24], [112, 4, 74, 26], [204, 10, 70, 24], [292, 6, 62, 26]];
    s.add(`<g fill="#4a3670">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y + 4}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add(`<g fill="#0c0816">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add('<path d="M276,30L270,52L276,55L266,82L272,84L263,108" stroke="#f3eaff" stroke-width="1.4" fill="none" stroke-linejoin="bevel" opacity=".85"/>');
    // the battlefield: far ranks of spears, a banner, the near ground
    const r = rng(762);
    let spears = '';
    for (let i = 0; i < 16; i++) {
      const x = 10 + r() * 280, a = ((r() - 0.5) * 40 * Math.PI) / 180, h = 8 + r() * 7;
      spears += `M${f1(x)},165l${f1(Math.sin(a) * h)},${f1(-Math.cos(a) * h)}`;
    }
    s.blur(`<path d="${ledge([[-10, 166], [60, 160], [130, 164], [200, 158], [260, 162], [310, 158]])}" fill="#4a3a68"/><path d="${spears}" stroke="#4a3a68" stroke-width="1"/>`, 0.7);
    s.path(ledge([[-10, 186], [70, 180], [150, 184], [230, 178], [310, 182]]), '#2a2040');
    s.add('<g fill="#2a2040"><path d="M40,182L44,150L45.6,150L42,182Z"/><path d="M44,151L58,154L52,158L57,162L43.6,161Z"/><path d="M226,180a9,8 0 0 1 18,0Z"/><path d="M120,184L134,170L135,171L122,185Z"/></g>');
    s.path(ledge([[-10, 202], [100, 206], [200, 203], [310, 199]]), '#0c0812');
    s.add('<g fill="#0c0812"><path d="M262,206L266,166L268.4,166L265,206Z"/><path d="M259,170H276V172.6H259Z"/></g>');
    s.add(`<g fill="#140e20">${parts([bird(60, 80, 0.9), bird(232, 140, 0.8), bird(40, 104, 0.7)])}</g>`);
    // the wyrm: torn wings on long finger-bones, a chain of vertebrae from skull
    // to tail, its tail curled round as it circles
    s.add('<g data-part="memL">');
    s.path(poly([[146, 82], [124, 56], [100, 36], [36, 48], [50, 58], [44, 62], [46, 74], [58, 78], [56, 84], [66, 90], [78, 90], [80, 96], [92, 96], [110, 92], [120, 96], [140, 92]]), '#1a1230', 'opacity=".88"');
    s.add('</g><g data-part="memR">');
    s.path(poly([[156, 80], [180, 50], [206, 30], [266, 34], [254, 44], [260, 50], [262, 58], [250, 62], [252, 68], [244, 74], [232, 74], [230, 80], [222, 82], [204, 84], [196, 90], [182, 90]]), '#1a1230', 'opacity=".88"');
    s.add('</g>');
    s.glow(166, 100, 30, '#b07cff', 0.8, 'breathe');
    s.add('<g data-part="heart">');
    s.bloom('<ellipse cx="166" cy="100" rx="8" ry="6" fill="#e6d0ff"/>', { sd: 2.2, k: 1.4, box: [140, 78, 52, 44] });
    s.add('</g>');
    const spine = [[92, 110], [104, 102], [118, 93], [134, 86], [150, 83], [166, 85], [182, 92], [198, 103], [216, 111], [236, 111], [251, 102], [257, 88], [251, 75], [240, 69]];
    const sp = spline(spine, 3);
    let verts = '';
    sp.forEach(([x, y], i) => { verts += disc(x, y, Math.max(1.4, 4.6 - (i / sp.length) * 3.4)); });
    const wyrm = `<g data-part="spine">${P(taper(spine, [4.4, 5, 5.4, 5.4, 5.4, 5, 4.4, 3.8, 3.2, 2.6, 2.2, 1.8, 1.4, 0.8]) + verts)}</g>` +
      // ribs, curving down round the light
      `<g data-part="ribs">${parts([...[[142, 84, 1], [150, 83, 1.06], [158, 83.6, 1.1], [166, 85, 1.1], [174, 88, 1], [182, 92, 0.86]].map(([x, y, k]) =>
        taper([[x, y + 1], [x - 5 * k, y + 10 * k], [x - 4 * k, y + 20 * k], [x + 1, y + 27 * k]], [3.64, 3.08, 2.38, 0.84]))])}</g>` +
      // the skull, horned, jaw hanging
      `<g data-part="skull">${parts([
        blob([[96, 104], [90, 99], [80, 99.6], [70, 104], [64, 109], [70, 112.6], [82, 113.6], [94, 112]]),
        taper([[94, 101], [103, 93], [111, 90]], [4.48, 2.52, 0.56]), taper([[89, 99.6], [94, 90], [97, 84]], [3.92, 2.24, 0.56]),
      ])}</g>` +
      `<g data-part="jaw">${parts([taper([[92, 113], [80, 119], [68, 120]], [5.6, 3.64, 1.4])])}</g>` +
      // the wing arms and finger-bones
      `<g data-part="armL">${parts([
        taper([[146, 82], [134, 66], [124, 56]], [6.16, 5.04, 4.2]), taper([[124, 56], [112, 44], [100, 36]], [4.2, 3.64, 3.08]), taper([[100, 36], [104, 28]], [2.8, 0.42]),
        taper([[100, 36], [68, 40], [36, 48]], [3.08, 2.24, 0.84]), taper([[100, 36], [72, 56], [46, 74]], [2.8, 2.1, 0.84]),
        taper([[100, 36], [84, 62], [66, 90]], [2.8, 2.1, 0.84]), taper([[100, 36], [96, 66], [92, 96]], [2.52, 1.96, 0.84]),
      ])}</g>` +
      `<g data-part="armR">${parts([
        taper([[156, 80], [168, 62], [180, 50]], [5.6, 4.76, 3.92]), taper([[180, 50], [194, 38], [206, 30]], [3.92, 3.36, 2.8]), taper([[206, 30], [208, 22]], [2.52, 0.42]),
        taper([[206, 30], [236, 30], [266, 34]], [2.8, 2.1, 0.84]), taper([[206, 30], [236, 44], [262, 58]], [2.66, 1.96, 0.84]),
        taper([[206, 30], [226, 52], [244, 74]], [2.52, 1.96, 0.84]), taper([[206, 30], [214, 56], [222, 82]], [2.38, 1.82, 0.84]),
      ])}</g>` +
      // the legs, claws hanging
      `<g data-part="legs">${parts([
        taper([[184, 94], [192, 106], [187, 119]], [5.04, 3.92, 3.36]), taper([[187, 119], [183, 125]], [2.52, 0.42]), taper([[187, 119], [189, 126]], [2.52, 0.42]),
        taper([[150, 90], [146, 102], [139, 107]], [4.2, 3.36, 2.8]), taper([[139, 107], [134, 109]], [2.24, 0.42]), taper([[139, 107], [136, 112]], [2.24, 0.42]),
      ])}</g>`;
    s.figure(wyrm, { fill: '#120c1e', rim: '#e2d4f6', offsets: [[0, -1.2], [-0.8, -0.8], [0.8, -0.8]], rimOp: 0.85, halo: 0.3 });
    s.add('<g data-part="eye">');
    s.glow(80, 104, 7, '#b07cff', 0.9);
    s.add('<ellipse cx="80" cy="104" rx="2.2" ry="1.3" fill="#efe2ff"/>');
    s.add('</g>');
    s.add(particles({ seed: 764, n: 14, x: [40, 290], y: [40, 200], r: [0.4, 1.2], fill: '#d9c2ff', cls: 'float', t: [6, 10], op: [0.3, 0.8] }));
    return s.svg();
  },
});

export const new_b = { ...tide, ...umbral };
