// Ember card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, faction, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
// Every taper() outline winds the same way, so several can share one `d`
// and still merge; blobs and polys get their own <path>.
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (...ds) => ds.map((d) => `<path d="${d}"/>`).join('');
const E = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
// A figure's shapes are painted with a gradient that fits each path's own box. When a path is split
// to tag its pieces, each piece is padded with two zero-length dots at the corners of the box the
// whole had, so every piece keeps the gradient it was drawn with (nothing is painted by the dots).
const boxOf = (...ds) => { const n = ds.join(' ').match(/-?\d+\.?\d*/g).map(Number), xs = n.filter((_, i) => i % 2 === 0), ys = n.filter((_, i) => i % 2 === 1); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
const padTo = ([x0, y0, x1, y1], d) => `${d}M${x0},${y0}L${x0},${y0}M${x1},${y1}L${x1},${y1}`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
// A circle as a clockwise subpath, so a cloud of them can be one path.
const circ = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1 1 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1 1 ${f1(-2 * r)},0Z`;
// Radial gradient in canvas units (the kit's are relative to each shape's box).
function radU(s, cx, cy, r, stops) {
  const id = s.uid('ru');
  s.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${s.stops(stops)}</radialGradient>`);
  return `url(#${id})`;
}
// A flame tongue rising from (x, y): height h, base width w, tip pushed sideways by `lean`.
const tongue = (x, y, h, w, lean = 0, wob = 0, per = 8) =>
  taper([[x, y], [x + lean * 0.25 + wob, y - h * 0.35], [x + lean * 0.6 - wob, y - h * 0.7], [x + lean, y - h]], [w, w * 0.8, w * 0.42, 0.4], { per });
// A ragged band of tongues along a baseline, as one path.
function flameWall({ seed, base, x0 = -14, x1 = W + 14, h = [20, 50], w = [8, 16], lean = 0, gap = [5, 10] }) {
  const r = rng(seed);
  let d = '';
  for (let x = x0; x < x1; x += gap[0] + r() * (gap[1] - gap[0])) {
    const hh = h[0] + r() * (h[1] - h[0]);
    d += tongue(x, base + r() * 3, hh, w[0] + r() * (w[1] - w[0]), (lean * hh) / h[1] + (r() - 0.5) * 6, (r() - 0.5) * 5, 4);
  }
  // a solid foot under the tongues (same winding)
  return d + `M${x0},${base}L${x0},${base + 16}L${x1},${base + 16}L${x1},${base}Z`;
}
// Small running soldier, feet at the origin, facing right.
const soldier = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="${
  taper([[2, -25], [-1, -14]], [6.5, 6]) +
  taper([[-1, -14], [5, -8], [8, 0]], [3.8, 3.2, 2.6]) +
  taper([[-1, -14], [-6, -8], [-13, -5]], [3.8, 3.2, 2.6]) +
  taper([[2, -23], [8, -20], [11, -23]], [2.6, 2.2, 1.8]) +
  taper([[1, -23], [-5, -19], [-8, -15]], [2.6, 2.2, 1.8]) +
  taper([[-17, -11], [15, -36]], [1.3, 1.3])}"/>${C(4, -29.5, 3.6)}${E(3.5, -31.5, 4.4, 1.6)}</g>`;
// Small fox at full stretch, feet at the origin, facing right.
const fox = (x, y, k) => `<g transform="translate(${x} ${y}) scale(${k})"><path d="${
  taper([[-10, -9], [0, -10], [10, -10]], [7, 6.5, 6]) +
  taper([[9, -11], [14, -13], [21, -12]], [6, 4.5, 1.6]) +
  taper([[11, -14], [11, -20]], [3.2, 0.4]) + taper([[14.5, -14], [15.5, -20]], [2.8, 0.3]) +
  taper([[7, -7], [13, -4], [18, -4]], [2.8, 2.2, 1.6]) + taper([[5, -7], [9, -2], [8, 1]], [2.8, 2.2, 1.6]) +
  taper([[-8, -7], [-14, -3], [-19, -2]], [3.2, 2.2, 1.6]) + taper([[-6, -7], [-9, -2], [-13, 1]], [3.2, 2.2, 1.6]) +
  taper([[-10, -11], [-20, -13], [-31, -11]], [5, 7.5, 1])}"/></g>`;

export const ember = faction('ember', {
  cinderling(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#150605'], [0.5, '#45140b'], [0.82, '#a5401a'], [1, '#d4622a']]));
    s.glow(112, 150, 150, '#ff6a1f', 0.45);
    // smoke from the crater
    s.add(`<g opacity=".28" fill="#3a1d16">${[[118, 66, 16], [128, 50, 20], [112, 36, 24], [132, 20, 26]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r}"/>`).join('')}</g>`);
    // far volcano with a lit crater and lava runs, softened by distance
    s.path('M-10,162L36,146L92,98L106,88L124,90L138,100L196,140L250,148L310,152L310,220L-10,220Z', s.lin([[0, '#6a2a18'], [0.5, '#5a2216'], [1, '#4a1a10']]));
    s.glow(114, 90, 30, '#ffb04a', 0.9, 'breathe');
    s.bloom(`<path d="M108,92C106,106 101,118 96,134M120,93C123,108 128,121 133,138" stroke="#ff9a3a" stroke-width="1.4" fill="none"/><path d="M105,90.5Q114,87.5 124,91Q114,93 105,90.5Z" fill="#ffe2a0"/>`, { sd: 1.6, k: 1.5 });
    s.haze(118, 168, '#ff7a2e', 0.32);
    s.layer(ridge({ seed: 11, base: 182, amp: 36, peaks: true, freq: 3.2 }), '#2a0f0a', { shadow: 0.45, sd: 3 });
    s.glow(150, 128, 78, '#ff7a2e', 0.42);
    // the rock it crouches on, cracked with heat
    s.figure('<path d="M86,214L95,188C104,177 125,171 150,170C176,169 198,175 207,186L216,214Z"/>',
      { fill: '#170907', rim: '#a8461b', offsets: [[0, -1.2]], rimOp: 0.8, shade: 0.8 });
    s.add(`<path d="M118,178l6,8l-2,9M182,179l-5,7l3,9M150,186l2,7" stroke="#ff7a2e" stroke-width="1" fill="none" opacity=".75"/>`);
    // wings: thin membranes the lava light shines through, with dark bones
    const wingL = 'M141,138C128,121 108,101 79,91C85,99 87,105 87,112C95,110 101,112 105,118C111,115 117,117 121,123C127,122 133,127 137,148Z';
    s.figure(`<g data-part="wingL"><path d="${wingL}"/></g><g data-part="wingR"><path d="${mirror(wingL)}"/></g>`, { fill: s.radU(150, 146, 74, [[0, '#a8401a'], [0.45, '#6a2010'], [1, '#3a0e07']]), rim: p.rim, offsets: [[0, -1]], rimOp: 0.6 });
    const bones = [[79, 91], [87, 112], [105, 118], [121, 123]];
    s.add(`<g stroke="${p.fig}" stroke-width="1.7" fill="none" stroke-linecap="round"><g data-part="boneL">${bones.map(([x, y]) =>
      `<path d="M141,137Q${(141 + x) / 2},${(137 + y) / 2 - 6} ${x},${y}"/>`).join('')}</g><g data-part="boneR">${bones.map(([x, y]) =>
      `<path d="M159,137Q${(159 + W - x) / 2},${(137 + y) / 2 - 6} ${W - x},${y}"/>`).join('')}</g></g>`);
    // the imp
    const tail = [
      taper([[164, 160], [184, 171], [201, 163], [204, 147], [212, 140]], [4.2, 3.4, 2.6, 2, 1.4]),
      'M209,142L221,132L220,147Z',
    ].map((d) => `<path d="${d}"/>`).join('');
    const imp = [
      taper([[141, 113], [136, 104], [131, 97], [133, 87]], [5.5, 4, 2.4, 0.6]),
      taper([[159, 113], [164, 104], [169, 97], [167, 87]], [5.5, 4, 2.4, 0.6]),
      'M138,119L116,110L137,126Z', 'M162,119L184,110L163,126Z',
      taper([[142, 141], [136, 154], [133, 168]], [5.5, 4.4, 3.6]),
      taper([[158, 141], [164, 154], [167, 168]], [5.5, 4.4, 3.6]),
    ].map((d) => `<path d="${d}"/>`).join('') +
      '<ellipse cx="150" cy="147" rx="16" ry="18"/><ellipse cx="140" cy="161" rx="10" ry="8"/><ellipse cx="160" cy="161" rx="10" ry="8"/>' +
      '<ellipse cx="150" cy="121" rx="14.5" ry="12.5"/><ellipse cx="134" cy="169" rx="6" ry="2.6"/><ellipse cx="166" cy="169" rx="6" ry="2.6"/>';
    s.figure(`<g data-part="tail">${tail}</g><g data-part="body">${imp}</g>`, { fill: p.fig, rim: p.rim, offsets: [[-0.8, -0.9], [0.8, -0.9]], rimOp: 0.85, shade: 0.45, edge: 0.28, halo: 0.3 });
    // glowing eyes, grin and cracks
    s.glow(144, 121, 9, '#ffb347', 0.8).glow(156, 121, 9, '#ffb347', 0.8);
    s.bloom('<ellipse cx="144.5" cy="121" rx="2.7" ry="1.6" fill="#ffe7a3" transform="rotate(14 144.5 121)"/><ellipse cx="155.5" cy="121" rx="2.7" ry="1.6" fill="#ffe7a3" transform="rotate(-14 155.5 121)"/>' +
      '<path d="M144.5,127.5Q150,131 155.5,127.5" stroke="#ffb34a" stroke-width="1" fill="none"/>' +
      '<path d="M146,137l3,5l-2,5l4,6M154.5,140l-2,6l3,4" stroke="#ff9f4a" stroke-width="1.2" fill="none" stroke-linecap="round"/>', { sd: 1.2, k: 1.6, box: [120, 100, 60, 70] });
    s.add('</g>');
    s.motes({ seed: 12, n: 28, x: [56, 244], y: [70, 205], r: [0.4, 1.2], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [4, 8] });
    return s.svg();
  },

  'reckless-initiate'(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#1d0806'], [0.4, '#4a160c'], [0.76, '#9e3d1a'], [1, '#c95a27']]));
    s.glow(60, 168, 160, '#ff6a1f', 0.3);
    s.glow(236, 62, 120, '#ff8a3a', 0.5);
    // the torch's smoke streams back over the charge
    let smoke = '';
    for (let i = 0; i < 9; i++) smoke += circ(214 - i * 27 - i * i * 0.6, 50 - i * 3.4 + (i % 2) * 5, 5 + i * 2.6) + circ(206 - i * 27, 44 - i * 3, 3 + i * 1.8);
    s.add(`<path class="drift" d="${smoke}" fill="${s.lin([[0, '#1e0b08', 0.6], [0.7, '#2c120c', 0.35], [1, '#5a2416', 0.1]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`);
    s.layer(ridge({ seed: 101, base: 152, amp: 40, peaks: true, freq: 2.4 }), '#62281a', { blur: 0.6, rough: 2, seed: 7 });
    s.haze(118, 168, '#ff8a3a', 0.28);
    s.layer(ridge({ seed: 102, base: 176, amp: 20, freq: 3 }), '#2e110b', { shadow: 0.45, sd: 3 });
    s.path('M-10,214L-10,170C50,166 120,169 180,167C230,166 270,168 310,171L310,214Z', '#190806');
    // the initiate mid-stride, torch-spear levelled, robe streaming back
    const hem = [[176, 122], [169, 128], [163, 124], [157, 132], [150, 127], [144, 135], [137, 129], [128, 133], [118, 127], [106, 130]];
    const robe = poly([[181, 86], [179, 98], [174, 110], ...hem, [112, 121], [102, 117], [118, 113], [134, 107], [150, 99], [164, 88], [172, 83]]);
    const limbs = [
      taper([[176, 87], [167, 104], [158, 121]], [15, 13.5, 12]),           // torso
      taper([[181, 80], [177, 88]], [5.5, 6.5]),                             // neck
      taper([[160, 120], [173, 122], [185, 125]], [11, 9.5, 8]),             // front thigh, knee up
      taper([[185, 125], [182, 137], [178, 149]], [8, 6.5, 5.5]),
      taper([[177, 149], [187, 152]], [5, 3]),
      taper([[155, 121], [146, 131], [138, 141]], [11, 9, 7.5]),             // back leg driving
      taper([[138, 141], [128, 150], [118, 157]], [7.5, 6, 5]),
      taper([[119, 157], [111, 166]], [5, 3]),
      taper([[176, 92], [184, 99], [190, 102]], [7, 6, 5.5]),                // lead arm
      taper([[190, 102], [196, 96], [200, 90]], [5.5, 5, 4.5]),
      taper([[171, 92], [160, 100], [161, 110]], [7, 6, 5]),                 // rear arm
    ];
    const hair = [
      taper([[187, 67], [176, 64], [164, 66]], [7, 4.5, 0.6]),               // hair blown flat
      taper([[182, 71], [171, 71], [161, 74]], [7, 4, 0.5]),
      taper([[178, 76], [170, 79], [163, 84]], [4.5, 3, 0.4]),
      taper([[176, 72], [162, 69], [148, 73], [138, 70]], [2.4, 2, 1.4, 0.4]), // headband tails
      taper([[176, 74], [163, 76], [151, 81], [142, 80]], [2.2, 1.8, 1.2, 0.4]),
    ];
    const spear = taper([[128, 126], [246, 67]], [2.6, 2.2]);                // spear
    const box = boxOf(...limbs, ...hair, spear);
    s.figure(`<g data-part="body">${P(robe, padTo(box, limbs.join('')))}</g>` +
      `<g data-part="spear">${P(padTo(box, spear))}</g><g data-part="hair">${P(padTo(box, hair.join('')))}</g>` +
      `<g data-part="front">${P('M190.5,73L194,76.5L190.5,78.5Z')}` +
      C(183, 74, 8) + E(186, 79, 5, 4) + C(200, 90, 3.4) + C(161, 110, 3.2) + `</g><g data-part="tip">${P('M244.7,64.3L259,60.5L247.3,69.7Z')}` + E(240, 70, 6, 3.6, -27) + '</g>',
    { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.8], [-0.4, -1.2]], rimOp: 0.9, shade: 0.5, edge: 0.3, halo: 0.35 });
    // the scorched hem still smoulders
    s.add(`<path d="${poly(hem, false)}" stroke="#ff8a3a" stroke-width="1.2" fill="none" stroke-linejoin="round" opacity=".85"/>`);
    // the torch
    s.glow(236, 58, 40, '#ffb04a', 0.9, 'breathe');
    s.bloom(`<g data-part="flame"><path d="${tongue(239, 73, 36, 13, -22, 3)}${tongue(243, 70, 34, 8, -4, -2)}${tongue(235, 74, 24, 8, -30, 2)}" fill="${s.lin([[0, '#ff5a1a', 0.5], [0.5, '#ff8a2e'], [1, '#ffd27a']])}"/>` +
      `<path d="${tongue(240, 73, 20, 7, -10, 1)}" fill="#fff0c0"/></g>`, { sd: 2, k: 1.4, box: [180, 0, 120, 110] });
    s.motes({ seed: 103, n: 22, x: [150, 255], y: [24, 92], r: [0.4, 1.1], fill: '#ffa040', hot: '#ffe8b0', cls: 'rise', t: [3, 6] });
    s.motes({ seed: 104, n: 10, x: [40, 260], y: [100, 200], r: [0.4, 1], fill: '#ff8a3a', cls: 'rise', t: [5, 9], op: [0.3, 0.7] });
    return s.svg();
  },

  'spark-runner'(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#140605'], [0.4, '#3a110a'], [0.6, '#7c2b14'], [0.69, '#c4541f'], [1, '#c4541f']]));
    s.glow(150, 144, 170, '#ff6a1f', 0.35);
    s.layer(ridge({ seed: 111, base: 145, amp: 16, peaks: true, freq: 3.4 }), '#5c2214', { blur: 0.6 });
    s.haze(118, 146, '#ff8a3a', 0.3, 4);
    // burnt snags on the horizon
    const snag = (x, y, h, k) => taper([[x, y], [x + k, y - h * 0.5], [x - k * 0.5, y - h]], [h * 0.12, h * 0.08, h * 0.03]) +
      taper([[x + k * 0.6, y - h * 0.45], [x + k * 0.6 + h * 0.2, y - h * 0.62], [x + k + h * 0.28, y - h * 0.8]], [h * 0.05, h * 0.035, 0.4]) +
      taper([[x, y - h * 0.62], [x - h * 0.2, y - h * 0.76], [x - h * 0.24, y - h * 0.9]], [h * 0.045, h * 0.03, 0.4]);
    s.path(snag(36, 147, 40, 2) + snag(262, 147, 30, -2) + snag(236, 147, 16, 1), '#1f0a06');
    // the scorched plain, cracks still glowing
    s.path('M-10,214L-10,144L310,144L310,214Z', s.lin([[0, '#2e100a'], [0.4, '#1c0906'], [1, '#0f0504']]));
    s.add('<path d="M18,178l14,3l8,-3l16,5l9,-1M200,170l11,4l9,-2l14,6M226,196l12,-3l10,4l14,-2M84,192l12,2l7,5M150,184l9,4l11,-1" stroke="#ff7a2e" stroke-width="1" fill="none" opacity=".5"/>');
    s.add(`<ellipse cx="146" cy="160" rx="78" ry="9" fill="${s.rad([[0, '#ff8a3a', 0.45], [1, '#ff8a3a', 0]])}"/>`);
    // the streak it leaves behind
    const tr = s.lin([[0, '#ffe7a3', 0.95], [0.22, '#ffb04a', 0.75], [0.6, '#ff7a2e', 0.32], [1, '#ff7a2e', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    s.glow(140, 108, 70, '#ff8a3a', 0.5);
    // the streak it leaves, and fire streaming back off its shoulders and spine
    s.bloom(`<g data-part="trail"><path d="${taper([[172, 106], [212, 101], [256, 96], [312, 88]], [18, 13, 7, 2])}${taper([[190, 126], [236, 128], [312, 120]], [6, 3.5, 1])}" fill="${tr}"/></g>` +
      `<g data-part="mane"><path d="${taper([[100, 94], [114, 84], [130, 80]], [10, 6, 0.4])}${taper([[120, 98], [136, 89], [154, 86]], [11, 6.5, 0.4])}${taper([[142, 100], [158, 92], [176, 90]], [10, 6, 0.4])}${taper([[164, 98], [180, 92], [198, 91]], [9, 5, 0.4])}" fill="${s.lin([[0, '#ffd27a', 0.9], [0.6, '#ff8a2e', 0.6], [1, '#ff6a1f', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/></g>`, { sd: 2.2, k: 1.3, box: [80, 50, 240, 110] });
    // the runner at full stretch: a lean hound of sparks
    const neck = taper([[108, 104], [98, 95], [88, 88]], [20, 15, 12]);
    const fore = taper([[108, 118], [96, 126], [84, 130], [71, 130]], [12, 7.5, 5, 4]) +        // forelegs reaching
      taper([[114, 122], [103, 132], [91, 139], [79, 142]], [11, 7, 4.5, 3.6]);
    const hind = taper([[170, 106], [184, 116], [195, 122], [210, 120]], [22, 12, 6.5, 4]) +     // hind legs flung back
      taper([[164, 110], [175, 124], [187, 132], [201, 136]], [17, 9, 5.5, 3.6]);
    const tail = taper([[182, 104], [198, 100], [216, 98], [236, 94]], [8, 7, 4, 0.4]);          // tail, turning to streak
    const ears = taper([[87, 82], [91, 70], [97, 62]], [8, 4.5, 0.5]) + taper([[82, 83], [83, 72], [86, 64]], [6.5, 3.5, 0.4]);
    const box = boxOf(neck, fore, hind, tail, ears);
    const trunk = blob([[98, 112], [104, 100], [116, 95], [132, 97], [148, 99], [164, 96], [178, 100], [184, 110], [178, 120], [164, 120], [150, 114], [134, 122], [116, 128], [102, 124]]);
    s.figure(`<g data-part="hind">${P(padTo(box, hind))}</g><g data-part="tail">${P(padTo(box, tail))}</g><g data-part="fore">${P(padTo(box, fore))}</g>` +
      `<g data-part="ears">${P(padTo(box, ears))}</g><g data-part="body">${P(padTo(box, neck), trunk, blob([[92, 80], [97, 87], [92, 95], [80, 97], [66, 96], [61, 93], [70, 88], [80, 82]]))}</g>`,
      { fill: p.fig, rim: '#ffb04a', offsets: [[1.2, -0.4], [0, -1.2], [-0.6, 1]], rimOp: 0.9, shade: 0.45, edge: 0.3, halo: 0.4 });
    // crackling veins
    const veins = 'M80,90L88,93L96,92L104,100L114,104L124,103L132,108L142,105L152,107L162,103L172,106L182,113L194,119M114,104L111,114L117,121M142,105L144,113M104,100L100,108L95,118L89,126';
    s.bloom(`<g data-part="veins"><g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${veins}" stroke="#ff7a2e" stroke-width="2.6" opacity=".5"/><path d="${veins}" stroke="#ffe08a" stroke-width="1"/></g>` +
      '<ellipse cx="81" cy="88" rx="2.4" ry="1.3" fill="#fff0c0"/></g>', { sd: 1.4, k: 1.5, box: [60, 70, 150, 70] });
    s.motes({ seed: 113, n: 28, x: [150, 300], y: [72, 140], r: [0.4, 1.3], fill: '#ffa040', hot: '#fff0c0', cls: 'rise', t: [2.5, 5] });
    s.add(particles({ seed: 114, n: 10, x: [60, 170], y: [66, 150], r: [0.4, 1], fill: '#ffe0a0', cls: 'twinkle', t: [1.5, 3] }));
    return s.svg();
  },

  'feed-the-flame'(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#120404'], [0.55, '#2c0c07'], [1, '#431508']]));
    s.glow(198, 96, 175, '#ff6a1f', 0.5);
    // the old hall, lit only by the brazier
    s.path(arcade({ seed: 121, x0: -10, x1: 310, base: 178, h: 152, bay: 62, col: 16 }),
      radU(s, 198, 100, 210, [[0, '#7c2c13'], [0.45, '#4c190b'], [1, '#1c0705']]), 'fill-rule="evenodd"');
    s.path('M-10,214L-10,176L310,176L310,214Z', '#170706');
    s.add(`<ellipse cx="198" cy="184" rx="96" ry="12" fill="${s.rad([[0, '#ff8a3a', 0.45], [1, '#ff8a3a', 0]])}"/>`);
    // the fire, leaping
    s.glow(198, 80, 80, '#ffb04a', 0.65, 'breathe');
    s.bloom(`<g data-part="fireA"><path d="${tongue(170, 130, 54, 13, -6, 3)}${tongue(184, 130, 80, 18, -8, -4)}${tongue(200, 130, 110, 28, 2, 5)}${tongue(216, 130, 78, 18, 8, -4)}${tongue(229, 130, 48, 12, 10, 3)}${tongue(192, 130, 96, 14, -16, 3)}" fill="${s.lin([[0, '#e2481a', 0.2], [0.35, '#ff6a1f', 0.85], [0.8, '#ff9a3a'], [1, '#ffb04a']])}"/></g>` +
      `<g data-part="fireB"><path d="${tongue(188, 130, 50, 14, -4, 2)}${tongue(204, 130, 72, 18, 4, -3)}${tongue(218, 130, 40, 11, 6, 2)}" fill="${s.lin([[0, '#ff9a3a', 0.6], [0.6, '#ffc25a'], [1, '#ffd98a']])}"/></g>` +
      `<g data-part="fireC"><path d="${tongue(200, 130, 32, 24, 0, 0)}" fill="#fff4d2"/></g>`, { sd: 2.6, k: 1.3, box: [130, 0, 140, 150] });
    // the brazier
    s.figure(P('M162,126L234,126C232,137 220,147 198,148C176,147 164,137 162,126Z',
      taper([[180, 140], [172, 163], [166, 187]], [5, 4, 3.4]) + taper([[198, 146], [198, 167], [198, 188]], [5, 4, 3.4]) + taper([[216, 140], [224, 163], [230, 187]], [5, 4, 3.4])) +
      E(198, 126, 37, 3.5) + E(166, 188, 5, 2) + E(198, 189, 5, 2) + E(230, 188, 5, 2),
    { fill: p.fig, rim: '#ffb04a', offsets: [[0, -1.4], [1, -0.6]], rimOp: 0.95, shade: 0.5 });
    s.add('<ellipse data-part="lip" cx="198" cy="125.5" rx="33" ry="2" fill="#ffcf6a"/>');
    // the hooded feeder, arms out over the fire
    // a deep cowl: the front overhangs the face, the back drapes into the robe
    const hood = 'M100,93C94,82 94,66 104,53C113,49 127,52 137,59C141,62 144,66 146,70C142,71 139,72 137,74C134,79 135,86 131,93Z';
    const robe = blob([[116, 86], [130, 92], [138, 104], [140, 122], [138, 144], [136, 162], [124, 168], [106, 172], [88, 176], [86, 164], [90, 140], [94, 112], [98, 92]]);
    const legs = taper([[128, 150], [136, 168], [142, 186]], [11, 8, 6.5]) + taper([[102, 162], [99, 175], [97, 186]], [10, 8, 6.5]);
    const arms = taper([[124, 98], [140, 97], [155, 91], [168, 82]], [13, 10, 7, 5.5]) + taper([[122, 108], [140, 110], [155, 104], [166, 96]], [9, 8, 6, 5]) +
      taper([[136, 101], [143, 108], [145, 116]], [9, 6, 0.5]);              // the sleeve hanging off the arm
    const box = boxOf(legs, arms);
    s.figure(`<g data-part="man">${P(hood, robe, padTo(box, legs))}</g><g data-part="arms">${P(padTo(box, arms))}${C(171, 80, 4)}${C(168, 95, 3.5)}</g><g data-part="man">${E(146, 187, 6.5, 2.4)}${E(101, 187, 6, 2.4)}</g>`,
      { fill: p.fig, rim: p.rim, offsets: [[1.4, -0.4], [0.6, -1.2]], rimOp: 0.9, shade: 0.5, edge: 0.35, halo: 0.35 });
    // the struggling shadow-thing
    const thing = taper([[186, 90], [194, 84], [200, 76]], [3, 2, 0.8]) + taper([[189, 96], [198, 98], [205, 94]], [3, 2, 0.8]) +
      taper([[185, 104], [190, 112], [197, 116]], [3.6, 2.6, 1]) + taper([[180, 104], [177, 114], [182, 122]], [3.6, 2.6, 1]) +
      taper([[178, 100], [170, 108], [166, 118], [172, 124]], [2.6, 2, 1, 0.3]) +
      taper([[175, 80], [171, 72]], [2.6, 0.4]) + taper([[180, 80], [183, 72]], [2.6, 0.4]);
    s.figure(P(thing) + C(177, 85, 5.5) + E(184, 96, 7, 9, -20), { fill: '#08030a', rim: '#ffd27a', offsets: [[1, -0.6], [0, 1]], rimOp: 0.9, halo: { op: 0.5, sd: 2 } });
    s.add('<g data-part="eyes"><circle cx="175.4" cy="85" r="1" fill="#fff4d8"/><circle cx="179" cy="85.6" r="1" fill="#fff4d8"/></g>');
    s.motes({ seed: 123, n: 26, x: [168, 236], y: [14, 120], r: [0.4, 1.2], fill: '#ffb04a', hot: '#fff0c0', cls: 'rise', t: [3, 6] });
    return s.svg();
  },

  'ash-collector'(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#2a0d08'], [0.36, '#571d0e'], [0.6, '#9a401a'], [0.74, '#d27c3c'], [1, '#d27c3c']]));
    s.glow(212, 150, 140, '#ffb060', 0.6);
    s.bloom('<circle cx="212" cy="152" r="15" fill="#ffe2b0"/>', { sd: 3, k: 1.1, box: [150, 90, 124, 124] });
    // smoke still rising off the field, in billows that widen as they climb
    let smoke = '';
    for (const [x0, y0, k] of [[50, 170, 1], [262, 168, 0.85]]) {
      for (let i = 0; i < 9; i++) smoke += circ(x0 + (i * 5 + i * i * 0.9) * k, y0 - i * 21 * k, (5 + i * 3.4) * k);
    }
    s.add(`<path class="drift" d="${smoke}" fill="${s.lin([[0, '#4a2418', 0], [0.5, '#45201a', 0.3], [1, '#3a1a12', 0.55]])}"/>`);
    s.layer(ruins({ seed: 131, base: 157, x0: 16, x1: 100, h: [10, 30], w: [6, 12] }) + ridge({ seed: 132, base: 160, amp: 10, freq: 2 }), '#74301a', { blur: 0.6 });
    s.haze(132, 164, '#ffa060', 0.3, 6);
    s.path(ridge({ seed: 133, base: 178, amp: 10, freq: 3 }), '#3a160c');
    // what is left of the battle
    s.add(`<g fill="#2b1009"><path d="${taper([[30, 180], [40, 146]], [2, 1.5]) + taper([[62, 180], [54, 150]], [2, 1.5]) + taper([[238, 178], [250, 146]], [2, 1.5]) +
      taper([[272, 180], [264, 156]], [2, 1.5]) + taper([[222, 179], [226, 126]], [2.2, 1.8])}"/><path d="M226,128L250,133L243,137L252,142L240,144L226,146Z"/>${E(100, 178, 6, 4)}</g>`);
    s.add('<g fill="none" stroke="#2b1009" stroke-width="1.6"><circle cx="82" cy="174" r="8.5"/><path d="M82,165.5V182.5M73.5,174H90.5M76,168L88,180"/></g>');
    s.path('M-10,214L-10,183C60,179 120,181 170,182C220,183 270,180 310,183L310,214Z', '#150605');
    // the collector: hunched, sweeping, his ash-lantern hung out ahead on a pole
    const coat = blob([[136, 96], [146, 89], [160, 89], [170, 97], [176, 114], [180, 136], [184, 158], [187, 170], [166, 171], [150, 168], [146, 152], [142, 128], [138, 110]]);
    const crown = blob([[124, 85], [125, 75], [131, 70], [139, 72], [142, 80], [141, 86]]);
    const legs = taper([[155, 162], [149, 175], [145, 186]], [10, 8, 6.5]) + taper([[174, 162], [176, 175], [178, 186]], [10, 8, 6.5]);
    const arms = taper([[146, 98], [149, 112], [142, 126]], [9, 7, 6]) + taper([[140, 100], [130, 118], [124, 134], [122, 146]], [8, 7, 6, 5.5]) +
      taper([[166, 100], [100, 172]], [2.4, 2.2]);
    const lampPole = taper([[174, 116], [176, 92], [172, 70], [160, 54], [140, 45], [114, 44]], [3.2, 3, 2.6, 2.3, 2, 1.8]);
    const box = boxOf(legs, arms, lampPole);
    const besom = poly([[97, 165], [104, 171], [106, 180], [104, 189], [100, 184], [97, 190], [92, 185], [88, 190], [84, 185], [79, 189], [77, 184], [70, 187], [80, 178], [90, 172]]);
    s.figure(`<g data-part="body">${P(coat, crown, padTo(box, legs), padTo(box, lampPole), 'M125,90L119,94L125,96Z')}${E(132, 85.5, 15, 3, -6)}${C(131, 91, 6.5)}${E(140, 187, 7, 2.6)}${E(178, 187, 6.5, 2.6)}</g>` +
      `<g data-part="sweep">${P(padTo(box, arms), besom)}${C(141, 126, 3.5)}${C(121, 148, 3.5)}</g>`,
    { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.9], [-1, -0.7]], rimOp: 0.85, shade: 0.45, edge: 0.3, halo: 0.3 });
    // the lantern of ash
    s.glow(114, 62, 50, '#ffb04a', 0.8, 'breathe');
    s.bloom(`<g data-part="lantern"><path d="M114,44V52" stroke="${p.fig}" stroke-width="1"/><path d="M107.5,52H120.5L118.5,55.5H109.5ZM108,68.5H120L121.5,72H106.5Z" fill="${p.fig}"/>` +
      '<rect x="109" y="55.5" width="10" height="13" rx="1" fill="#ffe0a0"/><path d="M114,55.5V68.5" stroke="#3a1a0e" stroke-width=".9"/>' +
      '<g fill="#ff7a2e"><circle cx="111.4" cy="65.5" r=".9"/><circle cx="116.6" cy="63" r=".8"/><circle cx="112" cy="60" r=".6"/></g></g>', { sd: 1.8, k: 1.2, box: [80, 30, 70, 70] });
    // the swept heap, still glowing
    s.path(blob([[46, 190], [54, 183], [66, 181], [76, 185], [80, 190]]), '#2a120c');
    s.add('<g fill="#ff8a3a"><circle cx="58" cy="185" r=".9"/><circle cx="66" cy="183.5" r=".8"/><circle cx="71" cy="186.5" r=".9"/></g>');
    s.add(particles({ seed: 134, n: 16, x: [40, 260], y: [40, 190], r: [0.5, 1.3], fill: '#e0b494', cls: 'float', t: [6, 10], op: [0.3, 0.7] }));
    s.motes({ seed: 135, n: 10, x: [44, 90], y: [150, 190], r: [0.4, 1], fill: '#ff9a3a', hot: '#ffe0a0', cls: 'rise', t: [4, 7] });
    return s.svg();
  },

  wildfire(s) {
    s.rect(s.lin([[0, '#0c0303'], [0.3, '#2a0a06'], [0.5, '#7a2610'], [0.64, '#d0561f'], [1, '#d0561f']]));
    s.glow(120, 128, 190, '#ff7a2e', 0.5);
    // smoke boiling off the fire, lit from beneath
    const r = rng(144);
    let smoke = '';
    for (let x = -20; x < 330; x += 22 + r() * 16) smoke += circ(x, 56 + r() * 30, 22 + r() * 18);
    s.add(`<path class="drift" d="${smoke}" fill="${s.lin([[0, '#160605', 0.85], [0.6, '#3c130a', 0.8], [1, '#8a3214', 0.45]])}"/>`);
    // the wall of fire on the far slope, bent by the wind
    s.bloom(`<g data-part="wallA"><path d="${flameWall({ seed: 141, base: 140, h: [30, 74], w: [12, 22], lean: 16, gap: [6, 11] })}" fill="${s.lin([[0, '#ff4a12', 0], [0.3, '#ff6a1f', 0.8], [0.75, '#ffa040'], [1, '#ffd27a']])}"/></g>`, { sd: 3, k: 1.1, box: [-30, 30, 360, 140] });
    s.add(`<g data-part="pines"><path d="${pines({ seed: 142, base: 146, h: [26, 46], gap: [8, 14] })}" fill="#140504"/></g>`);
    s.bloom(`<g data-part="wallB"><path d="${flameWall({ seed: 143, base: 146, h: [8, 24], w: [8, 14], lean: 6, gap: [5, 9] })}" fill="${s.lin([[0, '#ff9a3a', 0.2], [0.5, '#ffc25a', 0.9], [1, '#fff0c0']])}"/></g>`, { sd: 2, k: 1.4, box: [-30, 90, 360, 90] });
    // the near hill
    s.figure('<path d="M-10,214L-10,150C40,146 90,147 140,150C190,153 240,158 310,164L310,214Z"/>', { fill: '#170605', rim: '#ff8a3a', offsets: [[0, -1.2]], rimOp: 0.8 });
    // everything that can run, running
    const deer = [
      taper([[118, 116], [136, 112], [156, 110]], [15, 16, 14]),
      taper([[154, 110], [162, 98], [168, 88]], [12, 9, 7]),
      taper([[167, 84], [161, 77]], [3.5, 0.5]),
      taper([[169, 83], [168, 72], [174, 62]], [2.4, 1.6, 0.4]), taper([[168, 74], [160, 68]], [1.5, 0.3]), taper([[171, 82], [177, 74], [185, 70]], [2, 1.2, 0.3]),
      taper([[154, 116], [164, 122], [172, 120], [178, 124]], [6, 4, 3, 2.4]), taper([[150, 118], [158, 128], [166, 130]], [6, 4, 2.4]),
      taper([[124, 118], [112, 126], [100, 134]], [8, 4.5, 2.6]), taper([[120, 116], [104, 118], [92, 122]], [7, 4, 2.4]),
      taper([[118, 110], [112, 104]], [4, 1]),
    ].join('');
    const bird = (x, y, k) => `M${x},${y}c${2 * k},${-2.6 * k} ${4.4 * k},${-2.6 * k} ${6 * k},0c${1.6 * k},${-2.6 * k} ${4 * k},${-2.6 * k} ${6 * k},0c${-2 * k},${-0.8 * k} ${-4 * k},0 ${-6 * k},${2 * k}c${-2 * k},${-2 * k} ${-4 * k},${-2.8 * k} ${-6 * k},${-2 * k}Z`;
    s.figure(`<g data-part="deer">${P(deer, blob([[164, 86], [170, 82], [180, 85], [186, 90], [180, 93], [168, 92]]))}</g><g data-part="birds">${P(bird(228, 96, 1) + bird(248, 104, 0.8))}</g>` +
      `<g data-part="soldierL">${soldier(56, 149, 1.05)}</g><g data-part="soldierR">${soldier(236, 160, 0.9)}</g><g data-part="fox">${fox(196, 157, 1.1)}</g>`,
    { fill: '#120504', rim: '#ff9447', offsets: [[0, -1.2], [-1, -0.6]], rimOp: 0.9, edge: 0.3, halo: 0.4 });
    // foreground grass, black against the glow
    s.path(taper([[-4, 214], [4, 196], [16, 186]], [6, 3, 0.4]) + taper([[6, 214], [10, 194], [6, 178]], [5, 3, 0.4]) + taper([[300, 214], [292, 196], [280, 188]], [6, 3, 0.4]) + taper([[292, 214], [292, 196], [298, 182]], [5, 3, 0.4]), '#0a0302');
    s.motes({ seed: 145, n: 36, x: [0, W], y: [40, 205], r: [0.4, 1.3], fill: '#ff9a3a', hot: '#ffe8b0', cls: 'rise', t: [3, 7] });
    return s.svg();
  },

  'phoenix-of-the-last-spark'(s) {
    s.rect(s.lin([[0, '#0c0303'], [0.5, '#220806'], [1, '#2e0b06']]));
    s.add(particles({ seed: 151, n: 18, x: [0, W], y: [0, 120], r: [0.3, 0.8], fill: '#ffcfa0', cls: 'twinkle', op: [0.2, 0.6], t: [3, 6] }));
    s.glow(150, 96, 150, '#ff5a1a', 0.42);
    s.glow(150, 100, 56, '#ffb04a', 0.45);
    // the heap of ash and the last ember in it
    s.path('M54,214C84,192 116,183 150,182C184,183 216,192 246,214Z', '#1a0806');
    s.glow(150, 182, 26, '#ffb04a', 0.95, 'breathe');
    s.bloom('<ellipse cx="150" cy="182.5" rx="5" ry="3" fill="#fff0c4"/>', { sd: 2, k: 1.5, box: [120, 160, 60, 45] });
    // the bird: wings up, every feather a tongue of fire
    // each feather ends in a flick that curls outward, like a flame tip
    const feather = (b, deg, L, w) => {
      const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const at = (t, o) => [b[0] + ux * L * t + nx * o, b[1] + uy * L * t + ny * o];
      const tip = at(1, 0), fa = a + (35 * Math.PI) / 180;
      return taper([b, at(0.4, 2.5), at(0.75, -1.5), tip, [tip[0] + Math.cos(fa) * 5, tip[1] + Math.sin(fa) * 5]], [w, w * 0.85, w * 0.55, w * 0.25, 0.3]);
    };
    const arm = taper([[142, 92], [126, 84], [110, 74], [95, 62], [81, 51]], [18, 15, 12, 9, 6]);
    const wingL = arm + [[[80, 50], -140, 48], [[85, 55], -158, 50], [[91, 61], -176, 50], [[98, 66], 166, 46], [[106, 71], 148, 40], [[115, 77], 130, 32], [[124, 83], 112, 25], [[133, 88], 96, 19]]
      .map(([b, a, L]) => feather(b, a, L, 9)).join('');
    // the tail swings out in one long S and curls back down to the ember
    const tail = taper([[150, 124], [160, 138], [172, 150], [176, 164], [166, 175], [155, 179]], [12, 10, 8, 6, 3.5, 0.4]) +
      taper([[148, 124], [152, 142], [158, 156], [156, 168], [148, 173]], [8, 7, 5, 3, 0.4]) +
      taper([[152, 124], [168, 133], [184, 141], [194, 152], [193, 163], [186, 168]], [8, 7, 6, 4, 2, 0.4]);
    const fid = s.uid('ph');
    s.defs.push(`<g id="${fid}L">${P(wingL)}</g><g id="${fid}R">${P(mirror(wingL))}</g><g id="${fid}T">${P(tail)}</g>`);
    const head = taper([[150, 86], [153, 73], [158, 63]], [13, 10, 8]) +
      taper([[155, 56], [145, 49], [134, 47], [122, 50]], [6.5, 5, 2.6, 0.4]) + taper([[158, 53], [152, 44], [142, 39], [131, 39]], [5.5, 4, 2.2, 0.3]) +
      taper([[159, 52], [157, 43], [151, 35], [145, 32]], [4, 3, 1.6, 0.3]);
    s.figure(`<g data-part="wingL"><use href="#${fid}L"/></g><g data-part="wingR"><use href="#${fid}R"/></g><g data-part="tail"><use href="#${fid}T"/></g>` +
      `<g data-part="body">${P(head, blob([[150, 78], [159, 86], [161, 102], [157, 118], [150, 128], [143, 118], [139, 102], [141, 86]]), 'M165,54L178,59L171,60.5L166,63Z') + C(160, 58, 7)}</g>`,
      { fill: PAL.ember.fig, rim: '#ffb04a', offsets: [[-1.2, -0.5], [1.2, -0.5], [0, 1.3]], rimOp: 0.9, shade: 0.4, halo: 0.35 });
    // fire runs out along the feathers
    const fireFill = radU(s, 150, 100, 112, [[0, '#ff6a1f', 0], [0.34, '#ff6a1f', 0], [0.62, '#ff7a2e', 0.8], [0.85, '#ffb04a', 0.95], [1, '#fff0c0']]);
    s.bloom(`<g data-part="fireL"><use href="#${fid}L" fill="${fireFill}"/></g><g data-part="fireR"><use href="#${fid}R" fill="${fireFill}"/></g><g data-part="fireT"><use href="#${fid}T" fill="${fireFill}"/></g>`, { sd: 2.4, k: 1.2 });
    s.add('<g data-part="eye">');
    s.glow(162, 57, 6, '#ffd27a', 0.9);
    s.add('<circle cx="162" cy="57" r="1.3" fill="#fff0c4"/>');
    s.add('</g>');
    s.motes({ seed: 152, n: 30, x: [40, 260], y: [30, 200], r: [0.4, 1.3], fill: '#ffa040', hot: '#fff0c0', cls: 'rise', t: [4, 8] });
    return s.svg();
  },

  'the-mountain-is-angry'(s) {
    s.rect(s.lin([[0, '#100303'], [0.45, '#2c0a07'], [0.78, '#5e1c0d'], [1, '#7c2b12']]));
    s.glow(150, 74, 170, '#ff5a1a', 0.42);
    // the plume boiling out of the summit, lit from below
    let plume = '';
    for (const [x, y, r] of [[150, 40, 34], [118, 30, 26], [184, 28, 28], [96, 16, 22], [206, 12, 24], [140, 6, 26], [170, 0, 24], [74, 4, 18], [228, 2, 18], [132, 56, 18], [168, 54, 18]]) plume += circ(x, y, r);
    s.add(`<path class="drift" d="${plume}" fill="${s.lin([[0, '#1a0706'], [0.65, '#3e140b'], [1, '#8a3416']])}"/>`);
    // lava thrown up out of the crater, bombs arcing away
    s.glow(150, 50, 54, '#ffb04a', 0.75, 'breathe');
    s.add('<g data-part="eruption">');
    s.bloom(`<path d="${taper([[150, 72], [148, 50], [152, 28], [147, 8]], [16, 11, 6, 0.5])}${taper([[146, 70], [134, 52], [124, 40]], [6, 4, 0.5])}${taper([[154, 70], [168, 54], [178, 44]], [6, 4, 0.5])}" fill="${s.lin([[0, '#ff6a1f', 0.3], [0.5, '#ffb04a'], [1, '#fff0c0']])}"/>` +
      `<path d="${taper([[140, 64], [122, 40], [104, 32], [90, 36]], [2.6, 2, 1.2, 0.3])}${taper([[160, 62], [182, 36], [200, 28], [212, 32]], [2.6, 2, 1.2, 0.3])}${taper([[146, 60], [138, 30], [128, 16]], [2.2, 1.4, 0.3])}" fill="#ffb04a" opacity=".9"/>`, { sd: 2.2, k: 1.3, box: [70, -20, 160, 110] });
    s.add('</g>');
    s.path(ridge({ seed: 161, base: 178, amp: 14, freq: 3 }), '#4a170c');
    // the mountain
    s.figure('<path d="M-10,184C30,176 64,156 88,128C104,108 114,86 120,68L130,72L138,66L150,70L160,65L170,71L180,68C186,86 196,108 212,128C236,156 270,176 310,182L310,214L-10,214Z"/>',
      { fill: '#200907', rim: '#ff8a3a', offsets: [[0, -1.4], [-1, -0.6], [1, -0.6]], rimOp: 0.9, shade: 0.6, halo: 0.4 });
    // a face breaking through the rock: cracks, two slit eyes, a mouth full of lava
    s.glow(132, 92, 22, '#ff9a3a', 0.85, 'breathe').glow(169, 92, 20, '#ff9a3a', 0.8, 'breathe');
    s.glow(150, 128, 38, '#ff8a3a', 0.65);
    const lava = 'M149,150C140,158 128,164 116,170C108,174 100,177 94,180M151,158C160,164 172,170 186,174C194,177 200,180 206,182';
    s.add('<g data-part="face">');
    s.bloom('<path d="M115,86L106,93L101,104M185,87L194,95L197,106M150,77L148,87L151,95M128,116L118,124M172,117L183,126" stroke="#ff7a2e" stroke-width="1" fill="none" opacity=".7"/>' +
      '<path d="M114,85L146,96.5C138,101 125,99 114,85ZM185,86.5L155,96.5C163,100 175,98.5 185,86.5Z" fill="#ffd77a"/>' +
      `<path d="M128,114C135,110 142,113 150,110C158,113 165,110 173,115C171,125 165,133 157,137C153,139 147,139 143,137C135,133 130,124 128,114Z" fill="${s.rad([[0, '#fff0c0'], [0.45, '#ff9a3a'], [1, '#5a1a0c']], { cy: 0.9, r: 0.8 })}"/>` +
      // lava pouring from the mouth, splitting as it runs towards the village
      `<path d="${taper([[150, 134], [149, 146], [152, 157], [148, 168], [150, 180]], [11, 8, 6, 4.5, 3])}" fill="${s.lin([[0, '#ffe08a'], [0.6, '#ff8a3a'], [1, '#ff5a1a', 0.7]])}"/>` +
      `<g fill="none" stroke-linecap="round"><path d="${lava}" stroke="#ff6a1f" stroke-width="2.6" opacity=".8"/><path d="${lava}" stroke="#ffd27a" stroke-width=".9"/></g>`, { sd: 1.8, k: 1.4, box: [80, 60, 140, 140] });
    s.add('</g>');
    // the village, very small, against the lava-lit haze
    s.add(`<ellipse cx="80" cy="186" rx="84" ry="10" fill="${s.rad([[0, '#ff8a3a', 0.4], [1, '#ff8a3a', 0]])}"/>`);
    const house = (x, y, w, h) => `M${x},${y}L${x},${y - h}L${x + w / 2},${y - h - w * 0.55}L${x + w},${y - h}L${x + w},${y}Z`;
    s.path('M-10,214L-10,192C30,187 80,186 130,189C170,192 220,194 310,192L310,214Z', '#0b0302');
    s.path([house(30, 191, 11, 8), house(43, 190, 13, 9), house(72, 190, 10, 7), house(84, 189, 12, 10), house(99, 190, 11, 7), house(112, 191, 13, 8)].join('') + 'M59,190L59,170L63,160L67,170L67,190Z', '#0b0302');
    s.add('<g fill="#ffd27a"><rect x="47" y="184" width="2" height="2"/><rect x="88" y="182" width="2" height="2"/><rect x="117" y="185" width="2" height="2"/></g>');
    s.motes({ seed: 162, n: 16, x: [110, 190], y: [0, 70], r: [0.6, 1.6], fill: '#ffa040', hot: '#fff0c0', cls: 'rise', t: [3, 6] });
    s.motes({ seed: 163, n: 18, x: [20, 280], y: [40, 200], r: [0.4, 1], fill: '#ff8a3a', cls: 'rise', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },
});
