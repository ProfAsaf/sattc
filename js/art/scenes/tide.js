// Tide card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (d, extra = '') => `<path d="${d}"${extra ? ` ${extra}` : ''}/>`;
const parts = (list) => list.map((d) => P(d)).join('');
// A smooth edge (shore, rock shelf, beach) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);
// Short horizontal glints on water: [x, y, width, opacity].
const glints = (rows, fill) => `<g fill="${fill}">${rows.map(([x, y, w, o]) =>
  `<rect x="${f1(x - w / 2)}" y="${y}" width="${w}" height="1.3" rx=".6" opacity="${o}"/>`).join('')}</g>`;
// Book spines standing on shelves (and the shelf boards) between x0 and x1.
function books(seed, x0, x1, y0, y1, gap = 20) {
  const r = rng(seed);
  let d = '';
  for (let y = y0 + gap; y <= y1; y += gap) {
    d += `M${x0},${y}h${x1 - x0}v1.6h${x0 - x1}Z`;
    for (let x = x0 + 1.5; x < x1 - 3;) {
      const w = 2.4 + r() * 2.6, h = gap * (0.48 + r() * 0.34);
      if (r() < 0.1) { x += 4 + r() * 5; continue; }
      d += `M${f1(x)},${y}h${f1(w)}v${f1(-h)}h${f1(-w)}Z`;
      x += w + 0.7;
    }
  }
  return d;
}
// A rolled scroll, glowing pale.
const scroll = (x, y, rot, k = 1) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${k})">` +
  '<rect x="-8" y="-3.2" width="16" height="6.4" rx="1" fill="#fbf6dc"/>' +
  '<rect x="-10.6" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d3c493"/><rect x="7.2" y="-4.1" width="3.4" height="8.2" rx="1.5" fill="#d3c493"/>' +
  '<path d="M-5.5,-1h11M-5.5,1.2h8" stroke="#a9b6a8" stroke-width=".5"/></g>';
// Five-armed star (a starfish).
const star = (cx, cy, R, r, rot = -90) => poly(Array.from({ length: 10 }, (_, i) => {
  const a = ((rot + i * 36) * Math.PI) / 180, q = i % 2 ? r : R;
  return [cx + Math.cos(a) * q, cy + Math.sin(a) * q];
}));

export const tide = {
  'memory-diver'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#7fbcc6'], [0.3, '#2f6b7a'], [0.7, '#10313b'], [1, '#05141a']]));
    s.glow(176, -14, 130, '#e3fbfb', 0.7);
    s.add(rays({ cx: 176, cy: -40, from: 62, to: 118, n: 9, len: 320, spread: 2.2, color: '#d8f6f8', op: 0.16, seed: 31 }));
    // the sunken library: two arcades and fallen stones
    s.path(arcade({ seed: 32, x0: -10, x1: 310, base: 200, h: 62, bay: 30, col: 7 }), '#1f4c59', 'fill-rule="evenodd"');
    s.path(arcade({ seed: 33, x0: 30, x1: 250, base: 212, h: 40, bay: 36, col: 9 }), '#123441', 'fill-rule="evenodd"');
    s.path(ridge({ seed: 34, base: 212, amp: 14, freq: 2 }), '#081a21');
    s.add(page(70, 120, -20, 0.55, 8, -1), page(240, 82, 25, 0.5, 9, -4), page(104, 64, 12, 0.35, 10, -6), page(262, 140, -35, 0.45, 7, -2));
    // the diver plunging head-first, one hand out for a page; the cloak
    // streams off one shoulder so both kicking legs stay readable
    const diver =
      `<path d="${taper([[177, 124], [166, 113], [150, 104], [131, 99], [110, 99], [92, 104]], [7, 12, 15, 14, 9, 2], { per: 10 })}"/>` +
      `<path d="${taper([[182, 132], [176, 117], [168, 101]], [10.5, 12.5, 9.5])}"/>` +
      `<path d="${taper([[169, 102], [166, 86], [161, 70], [157, 56]], [8.6, 7, 5.4, 3.6])}"/>` +
      `<path d="${taper([[157, 57], [152, 48]], [3.8, 1.2])}"/>` +
      `<path d="${taper([[166, 103], [157, 92], [152, 78], [143, 68]], [8, 6.4, 5, 3.2])}"/>` +
      `<path d="${taper([[143, 68], [136, 63]], [3.2, 1])}"/>` +
      `<path d="${taper([[183, 133], [193, 142], [203, 150], [210, 156]], [4.8, 4.2, 3.6, 3])}"/>` +
      '<ellipse cx="211.5" cy="157.5" rx="3" ry="2.2" transform="rotate(40 211.5 157.5)"/>' +
      `<path d="${taper([[179, 128], [173, 139], [166, 147], [157, 151]], [4.6, 4, 3.2, 2.6])}"/>` +
      '<circle cx="188.5" cy="142" r="6.6"/>' +
      `<path d="${taper([[186, 136], [181, 126], [178, 116]], [3.4, 1.8, 0.4])}"/>` +
      `<path d="${taper([[190, 136], [188, 125], [188, 114]], [2.8, 1.4, 0.3])}"/>` +
      `<path d="${taper([[183, 138], [175, 131], [170, 122]], [2.6, 1.3, 0.3])}"/>`;
    s.figure(diver, { fill: p.fig, rim: p.rim, offsets: [[0, -1.4], [1, -0.9]], rimOp: 0.9 });
    s.glow(218, 162, 30, '#e9fff4', 0.5, 'breathe');
    s.add('<g transform="translate(219 163) rotate(22)"><rect x="-5" y="-6.5" width="10" height="13" rx=".8" fill="#fbf8e4"/><path d="M-3.4,-3.6h6.8M-3.4,-1.4h6.8M-3.4,.8h5M-3.4,3h6" stroke="#a7b7ac" stroke-width=".5"/></g>');
    s.add(particles({ seed: 35, n: 24, x: [110, 240], y: [60, 205], r: [0.7, 2.1], stroke: '#cdf3f6', cls: 'rise', t: [6, 11], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A little glowing spirit peeks over the far lip of a tide pool at dusk.
  'curious-wisp'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#061822'], [0.26, '#113747'], [0.44, '#2b6574'], [0.49, '#4b868c']]));
    s.add(particles({ seed: 301, n: 22, x: [0, W], y: [0, 64], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    // the sun going down over the sea, its path across the water
    s.glow(62, 102, 130, '#f4e6b6', 0.5);
    s.add('<circle cx="62" cy="102" r="9.5" fill="#fbf1cf"/>');
    s.path('M176,103C196,95 212,86 234,84C256,82 272,89 292,87L312,89L312,104Z', '#2a5c68');
    s.path('M18,103L22,90L27,85L32,90L35,103Z', '#2a5c68');
    s.path(`M-10,102H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#447f86'], [0.22, '#1f505c'], [1, '#06171d']]));
    s.add(glints([[62, 105, 34, 0.6], [60, 109.5, 24, 0.45], [65, 114.5, 30, 0.35], [59, 120.5, 18, 0.3], [64, 127.5, 24, 0.22], [61, 135.5, 12, 0.18]], '#fbf1cf'));
    // the wisp: a glowing head, a curl of tail, two big dark eyes
    s.glow(170, 124, 66, '#c6f4f6', 0.42, 'breathe');
    const body = s.rad([[0, '#ffffff'], [0.55, '#dcf8f7'], [1, '#90d3dc']], { cx: 0.42, cy: 0.36, r: 0.64 });
    const tail = s.lin([[0, '#c6f4f6', 0.08], [0.55, '#d6f8f7', 0.7], [1, '#eafdfc', 0.95]]);
    s.add('<g transform="rotate(-10 172 150)">' +
      `<path d="${taper([[178, 116], [190, 99], [194, 81], [187, 64], [175, 58], [167, 65]], [22, 15, 10, 6.5, 3.4, 0.6], { per: 10 })}" fill="${tail}"/>` +
      `<circle cx="172" cy="131" r="20.5" fill="${body}"/>` +
      '<ellipse cx="163.5" cy="134.5" rx="5.8" ry="7.6" fill="#06151b"/><ellipse cx="181" cy="134.5" rx="5.8" ry="7.6" fill="#06151b"/>' +
      '<circle cx="161.7" cy="131.4" r="2" fill="#fff"/><circle cx="179.2" cy="131.4" r="2" fill="#fff"/></g>');
    // the far lip of the pool hides the rest of it
    const lip = ledge([[-10, 114], [8, 109], [28, 114], [46, 129], [70, 143], [100, 149], [130, 151], [160, 150.5], [186, 150], [212, 150.5], [240, 146], [262, 139], [286, 136], [310, 140]], 182);
    s.figure(P(lip), { fill: '#0a222b', rim: p.rim, offsets: [[0, -1.3], [-0.9, -0.7]], rimOp: 0.75 });
    s.glow(170, 151, 44, '#c6f4f6', 0.28);
    s.add('<ellipse cx="150" cy="151.5" rx="5.8" ry="3.3" fill="#d4f6f6" transform="rotate(-16 150 151.5)"/><ellipse cx="189" cy="150.6" rx="5.8" ry="3.3" fill="#d4f6f6" transform="rotate(12 189 150.6)"/>');
    // the pool, holding its reflection
    s.path(`M-10,174H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#3b737b'], [0.45, '#1c4a55'], [1, '#0b2830']]));
    s.add('<path d="M-10,174.6H310" stroke="#8cc7c9" stroke-width=".8" opacity=".5"/>');
    s.glow(170, 182, 30, '#c6f4f6', 0.5, 'breathe');
    s.add('<ellipse cx="170" cy="181" rx="15" ry="4.5" fill="#d4f6f6" opacity=".45"/>' +
      '<g fill="none" stroke="#b5e8ea"><ellipse cx="170" cy="182" rx="26" ry="3.6" opacity=".35"/><ellipse cx="170" cy="183" rx="40" ry="5.4" opacity=".2"/></g>');
    // the near rim, weed and a starfish
    s.figure(P(ledge([[-10, 182], [18, 186], [46, 194], [86, 200], [140, 203], [196, 201], [236, 195], [266, 187], [310, 183]])),
      { fill: '#041013', rim: '#3e7480', offsets: [[0, -1]], rimOp: 0.8 });
    s.add(`<g fill="#041013">${parts([taper([[2, 214], [8, 196], [18, 182], [34, 172]], [7, 4.5, 2.4, 0.4]), taper([[14, 214], [14, 194], [22, 178], [20, 164]], [6, 4, 2, 0.4]), taper([[302, 214], [294, 196], [284, 186], [270, 180]], [7, 4.5, 2.4, 0.4])])}</g>`);
    s.path(star(248, 197, 8, 3.2, -80), '#2b6470');
    // an anemone on the near rim, its fronds against the bright pool
    s.add(`<g fill="#041013">${parts([[-30, 186], [-14, 182], [0, 181], [14, 182], [30, 186]].map(([dx, ty]) =>
      taper([[100, 200], [100 + dx * 0.4, ty + 8], [100 + dx * 0.5, ty]], [3.2, 2.2, 0.6])))}</g>`);
    s.add(particles({ seed: 302, n: 14, x: [128, 222], y: [46, 146], r: [0.5, 1.3], fill: '#e6fdfc', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A curling wave scoops a startled goblin off the beach and carries him back out.
  'not-yet'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#5d96a1'], [0.4, '#a3cdca'], [0.6, '#d6e8d7']]));
    s.glow(120, 6, 170, '#f4fbea', 0.55);
    s.add(rays({ cx: 120, cy: -30, from: 50, to: 130, n: 9, len: 300, spread: 2.4, color: '#f6fff4', op: 0.14, seed: 311 }));
    // open sea and a far headland
    s.path('M196,121C214,113 232,106 254,104C272,102 292,108 312,106L312,124Z', '#8db6b1');
    s.path(`M-10,122H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#7fb0b0'], [1, '#3a7279']]));
    s.add(glints([[262, 128, 26, 0.5], [246, 133, 18, 0.4], [276, 138, 22, 0.35]], '#f4fbf0'));
    // the beach: his footprints, and the shield he dropped
    s.path(ledge([[96, 200], [140, 188], [186, 176], [228, 164], [266, 154], [312, 148]]), s.lin([[0, '#6e8a80'], [1, '#2c4440']]));
    s.add(`<g fill="#2d4642" opacity=".75">${[[294, 160], [282, 165], [270, 164], [258, 169], [246, 168], [234, 173]].map(([x, y]) =>
      `<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.2"/>`).join('')}</g>`);
    s.add('<ellipse cx="270" cy="182" rx="10" ry="4" fill="#1b2e2d"/><ellipse cx="270" cy="181" rx="2.4" ry="1.2" fill="#3d5652"/>');
    // the wave: a dark curl around a bright, sunlit hollow
    const outer = [[-10, 132], [18, 104], [52, 70], [92, 44], [138, 30], [180, 32], [210, 46], [227, 66], [230, 86], [224, 100], [214, 106]];
    const inner = [[214, 106], [206, 103], [203, 94], [205, 84], [198, 71], [183, 61], [160, 59], [137, 67], [119, 85], [111, 109], [113, 135], [125, 157], [147, 173], [178, 183], [216, 189], [262, 195], [312, 199]];
    const wave = poly([[-10, 214], ...spline([...outer, ...inner.slice(1)], 6), [312, 214]]);
    s.figure(P(wave), { fill: s.lin([[0, '#63adb0'], [0.4, '#2e7682'], [1, '#0d3842']]), rim: '#effaf3', offsets: [[0, -1.5], [-1, -1]], rimOp: 0.9 });
    const hollow = poly([...spline(inner.slice(0, 15).concat([[214, 188]]), 6), ...spline([[214, 188], [224, 158], [225, 128], [219, 110], [214, 106]], 6)]);
    s.path(hollow, s.lin([[0, '#d2f1ea', 0.95], [0.72, '#a9dcd5', 0.75], [1, '#a9dcd5', 0.2]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    s.add(`<path d="${line([[40, 82], [70, 56], [100, 40], [138, 30], [180, 32], [210, 46], [227, 66], [230, 86], [224, 100]])}" fill="none" stroke="#f3fcf6" stroke-width="2.2" opacity=".85"/>`);
    s.add(`<path d="${line([[125, 158], [147, 174], [178, 184], [216, 190], [262, 196], [312, 200]])}" fill="none" stroke="#eef9f2" stroke-width="1.6" opacity=".7"/>`);
    s.add(`<g fill="#f4fcf6">${[[226, 97, 3], [230, 87, 2.6], [219, 104, 2.4], [211, 108, 2], [200, 41, 2.2], [186, 34, 2.4], [166, 30, 2], [228, 76, 2]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`);
    // the goblin: tipped over backwards, ears and arms flung up
    const gob = parts([
      taper([[0, -16], [0, -6], [-1, 4]], [9, 11.5, 10]),
      taper([[-3, -14], [-11, -22], [-15, -34]], [4.2, 3.4, 2.6]),
      taper([[3, -13], [12, -18], [21, -24]], [4.2, 3.4, 2.6]),
      taper([[-2, 3], [-9, 13], [-7, 25]], [5, 4, 3.4]),
      taper([[2, 3], [11, 10], [21, 7]], [5, 4, 3.4]),
      taper([[-4, -27], [-13, -32], [-21, -33]], [5, 3, 0.4]),
      taper([[4, -28], [11, -34], [16, -40]], [4.6, 2.8, 0.4]),
      taper([[5, -23], [11, -21], [14, -17]], [4, 3, 1]),
    ]) + '<circle cx="0" cy="-24" r="7"/><path d="M-7.6,-27A7.6,6 0 0 1 7.6,-27Z"/><path d="M-1,-32.5L0,-38L1.4,-32.5Z"/>' +
      '<circle cx="-15.5" cy="-35" r="2.6"/><circle cx="22" cy="-25" r="2.6"/><ellipse cx="-6" cy="26" rx="4" ry="2"/><ellipse cx="22.5" cy="6" rx="2" ry="3.8"/>';
    s.figure(`<g transform="translate(160 122) rotate(-28)">${gob}</g>`, { fill: p.fig, rim: '#effaf3', offsets: [[-1, -1], [1, -1], [1, 0.6]], rimOp: 0.9 });
    s.add('<g transform="translate(160 122) rotate(-28)"><circle cx="3.2" cy="-25" r="2" fill="#f4fbf2"/><circle cx="3.8" cy="-25" r=".9" fill="#06151b"/></g>');
    // his spear, tumbling away
    s.add('<g transform="translate(256 62) rotate(-50)"><path d="M-22,0H18" stroke="#0b2a31" stroke-width="1.8"/><path d="M18,-3L27,0L18,3Z" fill="#0b2a31"/></g>');
    s.add([[214, 116], [219, 126], [212, 134], [221, 143]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx="1.3" ry="1.9" fill="#f4fcf6"/>`).join(''));
    s.add(particles({ seed: 312, n: 16, x: [120, 252], y: [18, 110], r: [0.6, 1.6], fill: '#f4fcf6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A scholar kneels at a still pool; her reflection is not doing what she is.
  'second-thought'(s) {
    const p = PAL.tide;
    const k = 112, w = 121; // she kneels on the lip at y=k; the water starts at y=w
    s.rect(s.lin([[0, '#0a1c25'], [0.52, '#183c48'], [0.56, '#0f2b34'], [1, '#081b22']]));
    // shelves on both walls
    s.path(`M-10,10H70V${k}H-10ZM230,10H310V${k}H230Z`, '#081a21');
    s.path(books(322, -8, 68, 10, k) + books(323, 232, 308, 10, k), '#1d4350');
    // a tall window behind her lets cold light into the room
    s.glow(122, 58, 110, '#d6f3ef', 0.42);
    s.path(`M92,${k - 6}V40A30,30 0 0 1 152,40V${k - 6}Z`, s.lin([[0, '#eefaf6'], [1, '#8fc6c6']]));
    s.add(`<path d="M122,10V${k - 6}M92,56H152M92,82H152" stroke="#0e2a33" stroke-width="2"/>`);
    s.add(rays({ cx: 122, cy: 40, from: 66, to: 112, n: 6, len: 120, spread: 3, color: '#dff7f3', op: 0.1, seed: 321 }));
    // the lip of the pool, and the still water
    s.path(`M-10,${k}H310V${w + 1}H-10Z`, '#112d36');
    s.add(`<path d="M-10,${k + 0.5}H310" stroke="#3f7480" stroke-width="1" opacity=".6"/>`);
    s.path(`M-10,${w}H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#1f4d58'], [0.5, '#123540'], [1, '#081d24']]));
    // the scholar, kneeling on the lip and looking down (drawn for a lip at
    // y=121, then lifted into place)
    const g = 121;
    const kneel = parts([
      taper([[114, 74], [106, 88], [100, 104], [92, g - 2]], [6, 9, 11, 8]),
      taper([[110, 98], [116, 82], [124, 70]], [16, 14, 11]),
      taper([[124, 70], [130.5, 64]], [5.5, 4.4]),
      taper([[112, 99], [134, 98]], [13, 9]),
      taper([[134, 98], [136, g - 3]], [7, 5]),
      taper([[110, 101], [114, g - 3]], [12, 8]),
      taper([[114, g - 3], [100, g - 1.5], [88, g - 1]], [8, 6, 4]),
    ]) + `<circle cx="134" cy="55" r="7.5"/><circle cx="127.5" cy="48" r="4.3"/><ellipse cx="140" cy="${g - 1.5}" rx="5" ry="2"/><ellipse cx="86" cy="${g - 1}" rx="3.4" ry="1.8"/>`;
    const restArm = P(taper([[122, 74], [128, 88], [134, 96]], [5, 4.4, 3.6])) + '<circle cx="135" cy="97" r="2.4"/>';
    const reachArm = P(taper([[122, 74], [136, 92], [147, 112]], [5, 4.4, 3.6])) + '<circle cx="148" cy="114.5" r="2.4"/>';
    // her reflection: pale, and reaching up with two pages she is not holding
    const flip = 2 * w + (g - k); // reflect the lifted figure about the waterline
    s.glow(130, 166, 54, '#c6f4f6', 0.3, 'breathe');
    s.add(`<g transform="matrix(1 0 0 -1 0 ${flip})" fill="#a9e2e6" stroke="#a9e2e6" stroke-width=".6" opacity=".55">${kneel}${reachArm}</g>`);
    s.add('<g stroke="#bfe9ea" stroke-width=".8" opacity=".22"><path d="M80,150H184M94,174H172"/></g>');
    s.glow(151, 130, 20, '#f4f3d6', 0.75, 'breathe');
    s.add('<g transform="translate(151 130)"><rect x="-7" y="-5.5" width="9" height="11.5" rx=".6" fill="#f8f6e0" transform="rotate(-14)"/><rect x="-2" y="-6" width="9" height="11.5" rx=".6" fill="#fbf8e4" transform="rotate(12)"/></g>');
    s.figure(`<g transform="translate(0 ${k - g})">${kneel}${restArm}</g>`, { fill: p.fig, rim: p.rim, offsets: [[-1, -1], [1.1, -0.8], [1.2, 0.4]], rimOp: 0.9 });
    // candles on the lip, and their doubles in the water
    for (const [x, h] of [[74, 16], [200, 11], [213, 19]]) {
      const fy = k - h - 4;
      s.glow(x, fy, 16, '#f7e6b0', 0.7, 'breathe');
      s.glow(x, 2 * w - fy, 10, '#f7e6b0', 0.3);
      s.add(`<rect x="${x - 2.2}" y="${k - h}" width="4.4" height="${h}" rx="1" fill="#cdbf98"/>` +
        `<path d="M${x},${fy - 4}C${x + 2.6},${fy} ${x + 2},${fy + 3.5} ${x},${fy + 3.5}C${x - 2},${fy + 3.5} ${x - 2.6},${fy} ${x},${fy - 4}Z" fill="#fff6d2"/>`);
    }
    // scrolls piled on the right
    s.figure(`<g transform="translate(0 ${k - g})"><rect x="234" y="114" width="26" height="6.4" rx="3"/><rect x="258" y="114" width="22" height="6.4" rx="3"/><rect x="245" y="107.8" width="24" height="6.4" rx="3"/></g>`,
      { fill: '#0d2830', rim: '#e6dcb8', offsets: [[-0.8, -0.8]], rimOp: 0.7 });
    s.add(`<g fill="#b9ad86" transform="translate(0 ${k - g})"><ellipse cx="236" cy="117.2" rx="1.6" ry="3"/><ellipse cx="260" cy="117.2" rx="1.6" ry="3"/><ellipse cx="247" cy="111" rx="1.6" ry="3"/></g>`);
    s.add(particles({ seed: 324, n: 14, x: [92, 160], y: [16, 108], r: [0.4, 1.1], fill: '#e6fbf6', cls: 'float', t: [6, 10], op: [0.3, 0.8] }));
    return s.svg();
  },

  // A wizard on a sea cliff casts into a floating disc of water; two beams come out.
  'mirror-mage'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#081d27'], [0.42, '#1a4b59'], [0.7, '#3a7682']]));
    s.add(particles({ seed: 331, n: 24, x: [0, W], y: [0, 96], r: [0.25, 0.8], fill: '#e4fbfb', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    // far headland across the bay, and the sea below
    s.path('M-10,149L-10,132C10,128 26,124 40,126C56,128 66,138 84,142C100,146 120,148 140,149Z', '#2b5f6b');
    s.path(`M-10,148H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#2f6a75'], [1, '#08202a']]));
    s.add(glints([[206, 152, 30, 0.5], [204, 157, 22, 0.4], [208, 163, 34, 0.32], [203, 170, 20, 0.26], [207, 178, 28, 0.2]], '#dff8f8'));
    // the mirror of water hangs in the air; the spell goes in once and comes out twice
    s.glow(206, 88, 84, '#c6f4f6', 0.5, 'breathe');
    const fade = s.lin([[0, '#e9fdfc', 0.75], [1, '#c6f4f6', 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    s.add(`<path d="M212,80L312,16L312,40Z" fill="${fade}"/><path d="M212,95L312,128L312,152Z" fill="${fade}"/>`);
    s.add(`<path d="M128,90L204,82.5L204,91L128,92.5Z" fill="${s.lin([[0, '#f4fffe', 0.95], [1, '#d6f7f7', 0.6]], { x1: 0, y1: 0, x2: 1, y2: 0 })}"/>`);
    const disc = s.rad([[0, '#f4fffe'], [0.5, '#bfeef0'], [1, '#5fa9b3']]);
    s.add(`<g transform="rotate(-10 206 88)"><ellipse cx="206" cy="88" rx="22" ry="31" fill="${disc}" opacity=".92"/>` +
      '<g fill="none" stroke="#effdfc"><ellipse cx="206" cy="88" rx="22" ry="31" stroke-width="1.6" opacity=".85"/><ellipse cx="206" cy="88" rx="13" ry="19" opacity=".45"/><ellipse cx="206" cy="88" rx="6" ry="9" opacity=".35"/></g></g>');
    s.add('<circle cx="204" cy="86" r="3.6" fill="#ffffff"/>');
    // the cliff and the wizard
    s.figure(P(ledge([[-10, 166], [30, 167], [70, 170], [110, 171], [136, 174], [150, 180], [160, 192], [164, 214]])),
      { fill: '#05131a', rim: p.rim, offsets: [[1, -1], [0, -1.2]], rimOp: 0.7 });
    const mage = parts([
      taper([[90, 138], [84, 154], [79, 168]], [7, 6, 5]),
      taper([[95, 138], [103, 154], [108, 168]], [7, 6, 5]),
      taper([[92, 97], [92, 117], [91, 140]], [16, 19, 24]),
      poly([[91, 95], [82, 101], [74, 111], [66, 123], [58, 136], [50, 148], [41, 158], [51, 155], [54, 164], [61, 153], [68, 160], [71, 146], [77, 132], [83, 118], [88, 106]]),
      taper([[100, 90], [104, 96]], [5.5, 1]),
      taper([[103, 85], [107, 88]], [3, 0.5]),
      taper([[95, 79], [92, 66], [86, 55], [77, 50]], [15, 9, 4.4, 0.8]),
      taper([[98, 101], [111, 99], [125, 92]], [5.6, 4.6, 3.8]),
      taper([[88, 99], [80, 110], [73, 118]], [5.4, 4.6, 3.8]),
      taper([[66, 170], [71, 100], [73, 72]], [2.6, 2.4, 2.2]),
    ]) + '<circle cx="97" cy="86" r="7"/><ellipse cx="96" cy="80" rx="13.5" ry="2.4" transform="rotate(-6 96 80)"/>' +
      '<circle cx="126.5" cy="91.5" r="2.8"/><circle cx="72.5" cy="118.5" r="2.6"/>' +
      '<ellipse cx="77" cy="169.5" rx="5.4" ry="2.2"/><ellipse cx="111" cy="169.5" rx="5.8" ry="2.2"/>' +
      '<path d="M73,73C69,64 76,57 82,61" fill="none" stroke-width="2.2"/>';
    s.figure(mage, { fill: p.fig, rim: p.rim, offsets: [[1.3, -0.4], [0.5, -1.2]], rimOp: 0.95 });
    s.glow(130, 91, 22, '#e6fdfc', 0.85);
    s.add('<circle cx="130.5" cy="91" r="3.2" fill="#f6fffe"/>');
    s.add([[203, 121], [209, 127], [199, 131]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.5).toFixed(1)}s" cx="${x}" cy="${y}" rx="1.2" ry="1.8" fill="#dff8f8"/>`).join(''));
    s.add(particles({ seed: 332, n: 12, x: [176, 236], y: [52, 128], r: [0.7, 1.8], stroke: '#cdf3f6', cls: 'rise', t: [6, 10], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A rising whirlpool swallows a ball of fire while a calm mage watches from the rocks.
  countercurrent(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0a2230'], [0.45, '#22566a'], [0.64, '#4b8792']]));
    // the swallowed fire lights the sky above the spout; steam pours off it
    s.glow(196, 44, 120, '#ff9a4a', 0.42);
    s.add(`<g fill="#d9e6e6" opacity=".24">${[[174, 18, 10], [216, 16, 12], [196, 2, 13], [234, 8, 9], [158, 6, 8]].map(([x, y, r]) =>
      `<ellipse class="drift" cx="${x}" cy="${y}" rx="${r * 1.4}" ry="${r}"/>`).join('')}</g>`);
    s.path('M180,135C200,128 222,122 246,121C266,120 286,126 312,124L312,136Z', '#3c7680');
    s.path(`M-10,134H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#3d7a84'], [0.3, '#1d4e5a'], [1, '#06171d']]));
    s.add('<g fill="none" stroke="#cdeeee" stroke-width="1" opacity=".4"><path d="M120,146q6,-3 12,0M250,150q7,-3 14,0M270,166q8,-3 16,0M110,170q8,-3 16,0M228,182q9,-3 18,0"/></g>');
    // the whirlpool on the surface
    s.add('<g fill="none" stroke="#bfeaea"><ellipse cx="196" cy="151" rx="66" ry="10" opacity=".25"/><ellipse cx="196" cy="150" rx="44" ry="7" opacity=".4"/><ellipse cx="196" cy="149.5" rx="24" ry="4" opacity=".55"/></g>');
    s.add('<ellipse cx="196" cy="149.5" rx="12" ry="2.4" fill="#0a2229"/>');
    // the spout: a twisting column of seawater, opening at the top
    s.glow(196, 100, 70, '#c6f4f6', 0.3);
    s.path(taper([[196, 151], [193, 132], [198, 112], [193, 92], [198, 74], [196, 60]], [6, 11, 19, 31, 50, 78], { per: 10 }),
      s.lin([[0, '#a6dcda', 0.92], [0.5, '#4d97a0', 0.9], [1, '#2a6871', 0.95]]));
    const hw = (y) => 39 - (y - 60) * 0.39;
    let bands = '';
    for (let y = 72; y < 148; y += 12) bands += `M${f1(196 - hw(y))},${y}Q196,${y + 5} ${f1(196 + hw(y - 10))},${y - 10}`;
    s.add(`<path d="${bands}" stroke="#dcf6f4" stroke-width="1.5" fill="none" opacity=".55"/>`);
    s.add('<ellipse cx="196" cy="60" rx="39" ry="8" fill="#1e5560"/>');
    // the fire, being pulled down into it
    s.glow(196, 44, 40, '#ffb35a', 0.8, 'breathe');
    s.add(`<g fill="#ff8a3a">${parts([
      taper([[185, 62], [181, 44], [185, 26]], [15, 10, 0.6]),
      taper([[196, 62], [197, 38], [203, 12]], [19, 11, 0.6]),
      taper([[207, 62], [213, 46], [217, 30]], [14, 9, 0.6]),
    ])}<ellipse cx="196" cy="58" rx="17" ry="9"/></g>`);
    s.add(`<g fill="#ffd27a">${parts([taper([[191, 62], [191, 48], [194, 34]], [10, 7, 0.5]), taper([[201, 62], [204, 50], [207, 42]], [8, 5, 0.4])])}</g>`);
    // water arms reach up over the flames from both sides
    s.add(`<g fill="${s.lin([[0, '#d4f3f0', 0.95], [1, '#86c7c8', 0.92]])}">${parts([
      taper([[160, 62], [158, 46], [165, 32], [177, 25], [188, 28]], [11, 9, 6.5, 4, 0.6]),
      taper([[232, 62], [235, 48], [230, 35], [219, 30]], [10, 8, 4.5, 0.6]),
      taper([[176, 64], [172, 54], [175, 44], [182, 40]], [6, 5, 3, 0.5]),
    ])}</g>`);
    s.add('<path d="M157,60A39,8 0 0 0 235,60L233,66.5A37,7 0 0 1 159,66.5Z" fill="#8fcfcf"/><path d="M157,60A39,8 0 0 0 235,60" fill="none" stroke="#e8faf8" stroke-width="1.6"/>');
    // the mage on the rocks, quite unbothered
    s.figure(P(ledge([[-10, 168], [24, 170], [60, 176], [96, 180], [120, 188], [134, 200], [140, 214]])), { fill: '#05131a', rim: '#4a8590', offsets: [[0.8, -1]], rimOp: 0.8 });
    const mage = parts([
      taper([[67, 150], [64, 176]], [6, 4.6]),
      taper([[76, 150], [80, 176]], [6, 4.6]),
      taper([[72, 116], [72, 134], [71, 154]], [13, 16, 19]),
      taper([[69, 116], [61, 132], [55, 150]], [6, 9, 6]),
      taper([[74, 102], [68, 106], [63, 114]], [9, 6, 1]),
      taper([[77, 118], [84, 126], [88, 131]], [4.6, 4, 3.4]),
      taper([[89, 178], [90, 96]], [2.2, 2]),
    ]) + '<circle cx="76" cy="106" r="6.6"/><ellipse cx="63" cy="177.5" rx="4.6" ry="2"/><ellipse cx="83" cy="177.5" rx="5" ry="2"/><circle cx="88.5" cy="131.5" r="2.4"/>';
    s.figure(mage, { fill: p.fig, rim: '#f1c9a0', offsets: [[1.1, -0.9]], rimOp: 0.85 });
    s.glow(90, 95, 9, '#c6f4f6', 0.85, 'breathe');
    s.add(particles({ seed: 341, n: 14, x: [160, 236], y: [14, 84], r: [0.5, 1.3], fill: '#ffb05a', cls: 'rise', t: [4, 8] }));
    s.add(particles({ seed: 342, n: 14, x: [150, 244], y: [60, 150], r: [0.6, 1.5], fill: '#dff8f6', cls: 'float', t: [5, 9], op: [0.4, 0.85] }));
    return s.svg();
  },

  // A leviathan surfaces in a storm beside a tiny ship; its eye is as big as the ship.
  'deepwater-leviathan'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#050f15'], [0.4, '#12323d'], [0.66, '#2a5f6b'], [1, '#0c262e']]));
    // lightning far off on the left lights the storm
    s.glow(46, 60, 120, '#d6f2f6', 0.42, 'breathe');
    s.add(`<g fill="#091b22">${[[20, 6, 52, 22], [96, -2, 62, 26], [172, 4, 58, 22], [250, 0, 70, 26], [304, 14, 40, 18]].map(([x, y, rx, ry]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add('<path d="M58,12L50,36L57,39L45,70L53,72L40,104" stroke="#f1fdff" stroke-width="1.6" fill="none" stroke-linejoin="bevel"/><path d="M50,36L41,48M45,70L35,78" stroke="#e1f7fb" stroke-width=".8" fill="none"/>');
    const r = rng(351);
    let rain = '';
    for (let i = 0; i < 46; i++) rain += `M${f1(r() * 320)},${f1(r() * 190)}l-4,12`;
    s.add(`<path d="${rain}" stroke="#a9d6dc" stroke-width=".6" opacity=".22"/>`);
    s.path(ridge({ seed: 352, base: 154, amp: 16, peaks: true, freq: 5 }), '#1d4c58');
    // the head, rising out of the sea toward the ship
    const head = poly([
      ...spline([[146, 97], [156, 86], [176, 74], [200, 66], [228, 61], [258, 61], [286, 67], [312, 76]], 6),
      [312, 212], [250, 212],
      ...spline([[250, 190], [244, 160], [232, 140], [214, 126], [190, 116], [164, 108], [148, 101]], 6),
    ]);
    const horn = (x, y, dx, dy, w) => taper([[x, y], [x + dx * 0.6, y + dy * 0.6], [x + dx, y + dy]], [w, w * 0.5, 0.4]);
    const beast = P(head) + parts([
      horn(222, 64, 10, -16, 9), horn(244, 62, 12, -18, 10), horn(266, 64, 13, -17, 10), horn(288, 70, 13, -14, 9),
      horn(258, 104, 22, -10, 9), horn(262, 116, 24, -2, 8), horn(260, 128, 20, 6, 7),
      taper([[154, 102], [151, 114], [145, 124], [140, 131]], [3.4, 2.4, 1.4, 0.4]),
      taper([[166, 108], [166, 120], [161, 131]], [3, 2, 0.4]),
      taper([[188, 74], [200, 70], [214, 72]], [3, 5, 2]),
    ]);
    s.figure(beast, { fill: p.fig, rim: p.rim, offsets: [[-1.4, -1], [0, -1.2]], rimOp: 0.85 });
    s.add('<path d="M150,101C170,106 192,110 222,113" stroke="#4f8b95" stroke-width="1" fill="none" opacity=".55"/>');
    // the eye, as big as the ship
    s.glow(205, 87, 28, '#c6f4f6', 0.55, 'breathe');
    s.add('<ellipse cx="205" cy="87" rx="10.5" ry="6.4" fill="#f4f3d6" transform="rotate(-10 205 87)"/><ellipse cx="205" cy="87" rx="1.7" ry="5.4" fill="#06151b"/>');
    // water pouring off the jaw
    s.add('<g stroke="#bfe6ea" stroke-width=".8" opacity=".4"><path d="M172,112V150M186,116V156M200,121V152M214,128V160"/></g>');
    s.add([[178, 128], [192, 134], [207, 140], [170, 136]].map(([x, y], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" rx="1.1" ry="1.7" fill="#dff8f8"/>`).join(''));
    // the tiny ship, fleeing on a swell, its stern lantern lit
    s.path(ledge([[-10, 162], [20, 155], [44, 151], [66, 152], [88, 157], [112, 163], [142, 166], [172, 168]]), '#123843');
    const ship = '<path d="M-14,-2L13,-1L9,5.5L-10,5.5Z"/><path d="M-3,-1V-23M6,-1V-18M13,-1L20,-5" fill="none" stroke-width="1.2"/>' +
      '<path d="M-9,-20Q-3,-16 3,-20L3,-6Q-3,-3 -9,-6Z"/><path d="M2,-15Q7,-12 11,-15L11,-5Q7,-3 2,-5Z"/><path d="M-3,-23L-9,-21.5L-3,-20Z"/>';
    s.figure(`<g transform="translate(66 146) rotate(10) scale(-1 1)">${ship}</g>`, { fill: '#071820', rim: p.rim, offsets: [[-0.8, -0.8]], rimOp: 0.9 });
    s.glow(78, 145, 9, '#f6e7b4', 0.85, 'breathe');
    s.add('<circle cx="78" cy="145" r="1.2" fill="#fff7d8"/>');
    // the near swells and their foam
    s.path(ridge({ seed: 354, base: 212, amp: 36, peaks: true, freq: 3.4 }), '#05141a');
    s.add('<g fill="none" stroke="#9fd0d4" stroke-width="1" opacity=".35"><path d="M236,170q14,-8 30,-2q14,6 46,-4M-10,188q20,-10 40,-4M96,196q16,-8 34,-2"/></g>');
    s.add(particles({ seed: 355, n: 16, x: [130, 300], y: [100, 176], r: [0.6, 1.6], fill: '#dff8f8', cls: 'float', t: [4, 8], op: [0.4, 0.85] }));
    return s.svg();
  },

  // An old archivist on the last dry stair of a flooded library; three scrolls rise to her hands.
  'perfect-recall'(s) {
    const p = PAL.tide;
    s.rect(s.lin([[0, '#0a1f28'], [0.55, '#1a4351'], [1, '#0c2830']]));
    // the far wall: a great arched window
    s.glow(188, 64, 120, '#dcf5f1', 0.45);
    s.path('M162,108V46A26,26 0 0 1 214,46V108Z', s.lin([[0, '#f2fbf7'], [1, '#9fd0cf']]));
    s.add('<path d="M188,20V108M162,64H214M162,86H214" stroke="#173d48" stroke-width="2.2"/>');
    s.add(rays({ cx: 188, cy: 56, from: 92, to: 160, n: 8, len: 170, spread: 2.5, color: '#e0f7f3', op: 0.11, seed: 361 }));
    // shelves: a pale far pair beside the window, a dark near pair at the edges
    s.path('M104,30H156V150H104ZM220,30H272V150H220Z', '#2a5c68');
    s.path(books(362, 104, 156, 30, 150, 18) + books(363, 220, 272, 30, 150, 18), '#3d7480');
    s.path('M-10,0H46V160H-10ZM262,0H310V160H262Z', '#0b222b');
    s.path(books(364, -10, 46, 0, 160, 24) + books(365, 262, 310, 0, 160, 24), '#174050');
    // the flood
    s.path(`M-10,146H${W + 10}V${H + 10}H-10Z`, s.lin([[0, '#2f6774'], [0.4, '#173f4b'], [1, '#071a20']]));
    s.add(glints([[188, 150, 40, 0.45], [190, 155, 30, 0.38], [186, 161, 46, 0.3], [191, 168, 26, 0.24], [187, 176, 36, 0.18]], '#e6faf6'));
    s.add('<g fill="#0a2229"><path d="M232,160l12,-2l3,4l-12,2Z"/><path d="M262,178l14,-3l2,5l-14,3Z"/><path d="M196,190l10,1l-1,5l-11,-1Z"/></g>');
    // three scrolls rising out of the water, the last one reaching her
    s.add('<g fill="none" stroke="#e6faf6"><ellipse cx="170" cy="160" rx="16" ry="3" opacity=".5"/><ellipse cx="170" cy="161" rx="28" ry="5" opacity=".25"/></g>');
    for (const [x, y] of [[170, 154], [150, 124], [128, 92]]) s.glow(x, y, 22, '#f4f3d6', 0.6, 'breathe');
    s.add(scroll(170, 154, 28), scroll(150, 124, -14), scroll(128, 92, 8));
    // the stair
    s.figure('<path d="M-10,214V158H108V166H122V175H136V186H150V214Z"/>', { fill: '#05131a', rim: p.rim, offsets: [[1, -1]], rimOp: 0.6 });
    // the archivist: bent back, bun, shawl, hands held out
    const keeper = parts([
      blob([[75, 110], [83, 111], [89, 128], [95, 148], [86, 151.5], [69, 151.5], [62, 148], [68, 128]]),
      taper([[72, 147], [71, 156.5]], [4.4, 3.6]), taper([[85, 147], [87, 156.5]], [4.4, 3.6]),
      taper([[78, 114], [80, 101], [86, 91]], [14, 14, 11]),
      taper([[87, 90], [92, 86]], [5, 4.4]),
      taper([[82, 89], [74, 99], [68, 113], [64, 124]], [8, 12, 9, 2]),
      taper([[88, 93], [99, 97], [109, 91]], [5, 4.2, 3.4]),
      taper([[86, 96], [96, 104], [106, 100]], [4.6, 4, 3.2]),
      taper([[101, 83], [105, 86]], [2.8, 0.6]),
    ]) + '<circle cx="78" cy="97" r="7"/><circle cx="96" cy="83" r="6.6"/><circle cx="90.5" cy="76.5" r="3.4"/>' +
      '<ellipse cx="112" cy="89.5" rx="3.6" ry="2.2" transform="rotate(-20 112 89.5)"/><ellipse cx="108.5" cy="99" rx="3.2" ry="2" transform="rotate(-10 108.5 99)"/>' +
      '<ellipse cx="68.5" cy="157.5" rx="4.6" ry="1.9"/><ellipse cx="90" cy="157.5" rx="4.8" ry="1.9"/>';
    s.figure(keeper, { fill: p.fig, rim: p.rim, offsets: [[1.2, -0.6], [0.6, -1.1]], rimOp: 0.95 });
    s.add('<circle cx="99.6" cy="82.6" r="1.2" fill="#f4f3d6"/>');
    s.add(particles({ seed: 366, n: 18, x: [116, 186], y: [84, 166], r: [0.5, 1.3], fill: '#f4f3d6', cls: 'rise', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },
};
