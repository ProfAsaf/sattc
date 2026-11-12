// Verdant card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, pt, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, faction, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
// Every taper() and leaf() outline winds the same way, so several can share
// one `d` and still merge; blobs get their own <path>.
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (...ds) => ds.map((d) => `<path d="${d}"/>`).join('');
const E = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
// A circle as a clockwise subpath, so a cloud of them can be one path.
const circ = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1 1 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1 1 ${f1(-2 * r)},0Z`;

// Soft woodland: round crowns of uneven size whose tops follow a slow wave,
// most with a smaller puff on one shoulder, traced as a single outline so a
// layer reads as foliage rather than a row of stamps. `top` is the highest a
// crown reaches, `base` the usual lowest; `prof(x)` scales heights across the
// layer, and going negative sinks a clump's end below the ground line.
function woods({ seed, base, top, x0 = -12, x1 = W + 12, r0 = 8, r1 = 16, prof = null }) {
  const r = rng(seed);
  const ph1 = r() * 7, ph2 = r() * 7;
  const crowns = [];
  for (let x = x0; x <= x1;) {
    const rad = r0 + r() * (r1 - r0);
    let w = 0.55 + 0.27 * Math.sin(x / 43 + ph1) + 0.16 * Math.sin(x / 15 + ph2) + (r() - 0.5) * 0.2;
    if (prof) w = prof(x) < 0 ? prof(x) : w * prof(x);
    w = Math.max(-2, Math.min(1, w));
    const y = base - (base - top) * w;
    crowns.push([x, y + rad, rad]);
    if (r() < 0.75) {
      const a = (r() < 0.5 ? -1 : 1) * (0.42 + r() * 0.3), pr = rad * (0.38 + r() * 0.2);
      crowns.push([x + a * rad, y + rad - Math.sqrt(1 - a * a) * rad + pr * 0.5, pr]);
    }
    x += rad * (0.6 + r() * 0.35);
  }
  const pts = [];
  for (let x = x0 - r1; x <= x1 + r1; x += 1.5) {
    let y = H + 8;
    for (const [cx, cy, rad] of crowns) {
      const dx = x - cx;
      if (Math.abs(dx) < rad) y = Math.min(y, cy - Math.sqrt(rad * rad - dx * dx));
    }
    pts.push([x, y]);
  }
  return `M${f1(x0 - r1)},${H + 8}L` + pts.map(pt).join('L') + `L${f1(x1 + r1)},${H + 8}Z`;
}

// A lens-shaped leaf from (x, y) pointing along angle a (radians).
const leaf = (x, y, a, len, wid) => {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const m = (k) => pt([x + ux * len * 0.5 + nx * wid * k, y + uy * len * 0.5 + ny * wid * k]);
  return `M${pt([x, y])}Q${m(1)} ${pt([x + ux * len, y + uy * len])}Q${m(-1)} ${pt([x, y])}Z`;
};

// A vine growing from a towards b, ending in a curl, with leaves along it.
function vine(a, b, { bend = 0.18, curl = 8, turns = 1.15, w = 6, side = 1, leaves = 3, lr = 9 } = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side;
  const at = (t) => { const o = L * bend * Math.sin(Math.PI * t); return [a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]; };
  const pts = [a, at(0.33), at(0.66), b];
  const cx = b[0] + nx * curl, cy = b[1] + ny * curl;
  const a0 = Math.atan2(b[1] - cy, b[0] - cx);
  const dir = -Math.sin(a0) * ux + Math.cos(a0) * uy >= 0 ? 1 : -1;
  for (let k = 1; k <= 8; k++) {
    const t = k / 8, ang = a0 + dir * t * turns * 2 * Math.PI, rr = curl * (1 - 0.65 * t);
    pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
  }
  let d = taper(pts, [w, w * 0.78, w * 0.6, w * 0.42, w * 0.3, w * 0.2, 0.6]);
  for (let i = 0; i < leaves; i++) {
    const t = 0.22 + (0.56 * i) / Math.max(1, leaves - 1);
    const p0 = at(t), p1 = at(t + 0.02);
    d += leaf(p0[0], p0[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (i % 2 ? 1 : -1) * 0.95, lr, lr * 0.55);
  }
  return d;
}

// Little bird in flight (one subpath).
const bird = (x, y, k) => `M${f1(x)},${f1(y)}c${f1(2 * k)},${f1(-2.6 * k)} ${f1(4.4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(1.6 * k)},${f1(-2.6 * k)} ${f1(4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(-2 * k)},${f1(-0.8 * k)} ${f1(-4 * k)},0 ${f1(-6 * k)},${f1(2 * k)}c${f1(-2 * k)},${f1(-2 * k)} ${f1(-4 * k)},${f1(-2.8 * k)} ${f1(-6 * k)},${f1(-2 * k)}Z`;

export const verdant = faction('verdant', {
  'little-gardener'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#efe4b2'], [0.45, '#d6dca2'], [1, '#93ad72']]));
    s.glow(52, 26, 120, '#fff7d2', 0.9);
    // the sun low in the corner, just over the far wood, and its shafts
    s.bloom('<circle cx="50" cy="28" r="13" fill="#fffdf0"/>', { sd: 3.2, k: 1.4, box: [0, -20, 100, 100] });
    s.shafts({ cx: 50, cy: 28, from: 16, to: 78, n: 7, len: 320, spread: 2.6, color: '#fffbe2', op: 0.3, seed: 21, sd: 2 });
    // far woodland: crisp layers of round crowns, paler with distance, and
    // nearer thickets at both sides that slope away behind the mound
    s.path(woods({ seed: 270, base: 80, top: 36, r0: 6, r1: 11 }), '#d3dcb0');
    s.haze(60, 84, '#fbf8dc', 0.25, 6);
    s.path(woods({ seed: 271, base: 108, top: 58, r0: 9, r1: 16 }), '#b3c692');
    s.haze(92, 114, '#fbf8dc', 0.2, 6);
    s.layer(woods({ seed: 273, base: 124, top: 66, r0: 10, r1: 17, x0: 172, prof: (x) => (x - 206) / 36 }) + woods({ seed: 274, base: 116, top: 60, r0: 9, r1: 15, x1: 84, prof: (x) => (50 - x) / 26 }), '#7a9660', { shadow: 0.3, sd: 3 });
    // the mound
    s.path('M-10,214L-10,178C40,171 92,168 150,171C206,168 258,172 310,178L310,214Z', s.lin([[0, '#2e4121'], [1, '#162010']]));
    // the sprout, glowing
    s.glow(106, 160, 32, '#ecff8f', 0.65, 'breathe');
    s.bloom('<path d="M106,177C106,171 107,166 106,159" stroke="#cfee70" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      `<path d="${blob([[106, 163], [99, 158], [93, 159], [98, 165]])}" fill="#effcaa"/><path d="${blob([[106, 161], [113, 154], [119, 155], [113, 162]])}" fill="#effcaa"/>`, { sd: 1.5, k: 1.5, box: [80, 140, 50, 50] });
    // the gardener: a rabbit in a hooded cloak, watering
    const can = `<g transform="rotate(-16 147 145)"><path d="M137,139L157,139L158,153L136,153Z"/>
      <path d="${taper([[139, 148], [130, 142], [122, 136]], [4.4, 3.2, 2.4])}"/><circle cx="121" cy="135.5" r="3.2"/>
      <path d="M141,139C141,130 153,130 153,139" fill="none" stroke-width="2.4"/></g>`;
    const rabbit =
      '<g data-part="body">' +
      `<path d="${blob([[166, 173], [165, 159], [168, 145], [174, 136], [184, 133], [192, 139], [196, 153], [200, 173]])}"/>` +
      '<circle cx="181" cy="126" r="11"/><ellipse cx="171" cy="129" rx="6.2" ry="4.8"/>' +
      '</g><g data-part="ears">' +
      '<ellipse cx="176.5" cy="101" rx="4.2" ry="15" transform="rotate(-10 176.5 101)"/>' +
      '<ellipse cx="186.5" cy="103" rx="4.2" ry="14" transform="rotate(15 186.5 103)"/>' +
      '</g><g data-part="body">' +
      '<path d="M186,117L198,124L188,131Z"/>' +
      '</g><g data-part="arm">' +
      `<path d="${taper([[176, 142], [167, 146], [158, 146]], [5.5, 4.6, 4])}"/>` + can +
      '</g><g data-part="body">' +
      '<ellipse cx="170" cy="173" rx="5.5" ry="2.4"/><ellipse cx="193" cy="173" rx="5.5" ry="2.4"/></g>';
    s.figure(rabbit, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -1.2]], shade: 0.45, halo: 0.35 });
    s.add('<circle data-part="eye" cx="168.5" cy="124.5" r="1.1" fill="#f1f6c8"/>'); // a glint of an eye
    // water arcing onto the sprout
    s.add([[117.5, 146, 1.9], [115, 151, 1.8], [112.5, 155.5, 1.7], [110, 159.5, 1.5]].map(([x, y, r], i) =>
      `<ellipse class="fall" style="--d:${(-i * 0.4).toFixed(2)}s" cx="${x}" cy="${y}" rx="${(r * 0.75).toFixed(2)}" ry="${r}" fill="#dff3ff" stroke="#7fb3c6" stroke-width=".45"/>`).join(''));
    // ferns framing the foreground
    const fern = (pts, w) => `<path d="${taper(pts, w)}"/>`;
    s.add(`<g fill="#121b0c">${fern([[-6, 214], [6, 196], [22, 184], [40, 180]], [7, 4, 2, 0.4])}${fern([[-4, 214], [2, 190], [6, 170], [16, 156]], [6, 4, 2, 0.4])}${fern([[306, 214], [294, 194], [280, 184], [264, 182]], [7, 4, 2, 0.4])}${fern([[304, 214], [298, 188], [300, 168], [292, 154]], [6, 4, 2, 0.4])}</g>`);
    s.motes({ seed: 25, n: 18, x: [40, 260], y: [40, 170], r: [0.5, 1.2], fill: '#fff6c0', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  seedling(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f6efca'], [0.5, '#dde2ac'], [1, '#a5bb81']]));
    s.glow(236, 16, 150, '#fff7d2', 0.9);
    s.shafts({ cx: 262, cy: -26, from: 104, to: 148, n: 6, len: 320, spread: 3, color: '#fffbe2', op: 0.3, seed: 201, sd: 2.2 });
    // we are very small here: grass blades tower, a toadstool, a fern
    s.path([
      taper([[14, 182], [18, 120], [30, 64], [48, 22]], [10, 8, 4.5, 0.5]),
      taper([[40, 182], [38, 130], [30, 92], [16, 60]], [8, 6, 3.5, 0.4]),
      taper([[276, 182], [272, 120], [262, 70], [246, 34]], [10, 8, 4.5, 0.5]),
      taper([[294, 182], [298, 130], [306, 96]], [8, 5, 0.4]),
      taper([[226, 182], [228, 140], [238, 108], [254, 84]], [7, 5.5, 3, 0.4]),
    ].join(''), '#c8d6a4');
    s.path(taper([[62, 180], [60, 150], [63, 122]], [14, 11, 10]), '#a5ba86');
    s.path(blob([[28, 124], [38, 104], [60, 94], [84, 100], [96, 118], [86, 124], [60, 122], [38, 128]]), '#a5ba86');
    let frond = taper([[304, 178], [290, 132], [268, 100], [244, 88], [226, 94]], [6, 5, 3.5, 2, 0.5]);
    for (let i = 0; i < 9; i++) {
      const t = 0.15 + i * 0.085, q = spline([[304, 178], [290, 132], [268, 100], [244, 88], [226, 94]], 8);
      const k = Math.floor(t * (q.length - 1)), [x, y] = q[k], [x2, y2] = q[k + 1], a = Math.atan2(y2 - y, x2 - x);
      frond += leaf(x, y, a - 1.25, 16 - i, 6) + leaf(x, y, a + 1.25, 15 - i, 6);
    }
    s.path(frond, '#8fa870');
    s.haze(130, 172, '#fbf6dc', 0.28, 4);
    // rich dark soil, heaving up where it breaks through
    s.layer('M-10,214L-10,174C30,171 70,170 100,166C120,160 136,157 150,158C166,157 182,160 200,166C230,170 270,171 310,174L310,214Z', s.lin([[0, '#45381f'], [0.5, '#30271a'], [1, '#1c170e']]), { shadow: 0.3, sd: 3 });
    s.path([[24, 186, 3], [60, 196, 2.4], [228, 190, 3.2], [270, 200, 2.6], [94, 204, 2], [206, 206, 2.2]].map(([x, y, r]) => circ(x, y, r)).join(''), '#5a4a2c');
    s.add('<path d="M40,190C52,186 60,190 70,186M236,182C248,186 256,182 268,186M150,182C146,192 152,198 148,206" stroke="#17130b" stroke-width="1.2" fill="none" opacity=".7"/>');
    // the seedling: a bean with leaf-arms, its husk still on its head like a cap
    const arms = taper([[134, 134], [124, 126], [116, 117]], [5, 3.6, 2.6]) + leaf(116, 117, -2.35, 30, 15) +
      taper([[166, 140], [176, 146], [184, 152]], [5, 3.6, 2.6]) + leaf(183, 152, 0.15, 28, 13) +
      taper([[153, 106], [155, 95], [160, 88], [167, 85]], [3.4, 2.8, 2.2, 1.6]);
    s.figure(P(blob([[150, 110], [162, 114], [169, 127], [170, 146], [166, 162], [150, 168], [134, 162], [130, 146], [132, 127], [139, 114]]), arms),
      { fill: p.fig, rim: p.rim, offsets: [[1.2, -1.2], [-0.6, -1.2]], shade: 0.45, edge: 0.3, halo: 0.35 });
    s.add('<g data-part="face"><path d="M131,121C131,108 145,99 160,102C166,103 171,108 172,113L167,111L164,116L159,111L154,116L149,111L144,117L139,113L135,119Z" fill="#4a3b22" stroke="#d9c98a" stroke-width=".6"/>');
    // curious eyes, looking up at a mote of light
    s.add(`<g fill="#f6f7dc">${E(143, 131, 4.2, 5.2)}${E(157.5, 130, 4.2, 5.2)}</g><g fill="${p.fig}">${C(141.6, 129.2, 2.4)}${C(156.2, 128.2, 2.4)}</g><g fill="#fff">${C(142.4, 128.2, 0.8)}${C(157, 127.2, 0.8)}</g></g>`);
    s.glow(169, 84, 14, '#ecff8f', 0.85, 'breathe');
    s.glow(104, 62, 18, '#f4ffb0', 0.9, 'breathe');
    s.add('<g data-part="sproutleaf">');
    s.bloom(`<path d="${leaf(166, 86, -0.5, 10, 6)}" fill="#effcaa"/><circle cx="104" cy="62" r="2.2" fill="#fbffe6"/>`, { sd: 1.6, k: 1.5, box: [80, 40, 110, 70] });
    s.add('</g>');
    // the lip of soil it is pushing through, cracked, clods tumbling
    s.figure(P('M104,176C114,168 128,163 140,165L150,169L160,164C174,163 188,168 198,176C182,174 168,173 150,174C132,173 118,174 104,176Z'),
      { fill: '#2c2416', rim: '#a99a6a', offsets: [[0, -1]], rimOp: 0.7 });
    s.add('<path d="M128,170L118,180L112,186M174,169L184,178L192,182M150,174L151,184" stroke="#17130b" stroke-width="1.2" fill="none"/>');
    s.add(`<g data-part="clods" fill="#2c2416">${C(122, 163, 3.2)}${C(180, 162, 3)}${C(114, 153, 2.2)}${C(190, 150, 1.8)}${C(128, 149, 1.5)}</g>`);
    s.motes({ seed: 202, n: 16, x: [30, 270], y: [20, 150], r: [0.5, 1.2], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  'wild-growth'(s) {
    const p = PAL.verdant;
    // dusk sage above; the light comes up out of the ground
    s.rect(s.lin([[0, '#9cae80'], [0.45, '#cbd6a0'], [0.8, '#eef0c6'], [1, '#f6f3d2']]));
    s.path(woods({ seed: 211, base: 148, top: 96, r0: 9, r1: 17 }), '#b2c391');
    s.haze(112, 150, '#f4f6d2', 0.35, 6);
    s.glow(150, 172, 175, '#f8ffc6', 0.9);
    s.glow(152, 160, 62, '#fbffd8', 0.85);
    s.shafts({ cx: 152, cy: 168, from: -176, to: -4, n: 16, len: 260, spread: 2.4, color: '#fbffdc', op: 0.3, seed: 212, sd: 2.2 });
    s.layer('M-10,214L-10,172C50,168 100,170 150,172C200,170 250,168 310,172L310,214Z', s.lin([[0, '#3a5228'], [1, '#18240f']]), { shadow: 0.3, sd: 3 });
    s.add(`<ellipse cx="152" cy="173" rx="72" ry="5" fill="${s.rad([[0, '#fbffd8', 0.9], [0.5, '#e6f78f', 0.45], [1, '#e6f78f', 0]])}"/>`);
    // the burst: vines whipping out from under the wolf
    const tips = [[40, 70], [104, 30], [198, 28], [262, 62], [284, 122], [22, 134]];
    s.figure(P([
      vine([118, 150], tips[0], { side: 1, curl: 9 }),
      vine([140, 132], tips[1], { side: -1, curl: 8 }),
      vine([162, 130], tips[2], { side: 1, curl: 9 }),
      vine([184, 140], tips[3], { side: -1, curl: 10 }),
      vine([196, 158], tips[4], { side: 1, curl: 8 }),
      vine([110, 162], tips[5], { side: -1, curl: 8 }),
    ].join('')), { fill: '#25371b', rim: '#f2f8bc', offsets: [[0, 1.1], [0.8, 0.5], [-0.8, 0.5]], rimOp: 0.75 });
    // the wolf howling, bark thickening along its spine, twigs breaking out of its back.
    // The head is drawn level (muzzle to the left) and tipped back 55 degrees.
    const head = `<g transform="translate(109 87) rotate(55)">${P(
      taper([[-3, -1], [-14, 0], [-25, 1.5]], [12, 8, 3.6]),                 // muzzle
      taper([[-3, 5], [-11, 7.5], [-20, 10]], [6, 4.2, 1.8]),                // lower jaw, open in the howl
      taper([[3, -5], [6, -11], [8, -18]], [7, 4, 0.5]),                     // ears, laid back
      taper([[-2, -6], [0, -12], [1, -18.5]], [6.5, 3.6, 0.5]))}${E(0, 0, 10.5, 8.5)}</g>`;
    const wolf = [
      taper([[126, 126], [152, 124], [178, 127], [198, 130]], [30, 24, 22, 24]),
      taper([[130, 128], [122, 110], [112, 96]], [28, 22, 16]),             // neck, arched up
      taper([[124, 136], [122, 154], [121, 172]], [11, 7, 5.5]) + taper([[134, 138], [136, 155], [134, 172]], [10, 6.5, 5.5]),
      taper([[190, 134], [204, 148], [198, 160], [200, 172]], [22, 13, 6.5, 5.5]) + taper([[178, 138], [184, 154], [180, 172]], [13, 7, 5.5]),
      taper([[206, 128], [220, 138], [226, 152], [222, 164]], [10, 12, 9, 2]),   // tail, low
      taper([[150, 114], [146, 99], [139, 89]], [3.8, 2.4, 0.6]) + taper([[146, 104], [154, 97]], [2, 0.4]),
      taper([[170, 116], [174, 101], [182, 93]], [3.6, 2.2, 0.5]) + taper([[190, 120], [196, 108], [204, 102]], [3, 1.8, 0.4]),
      leaf(139, 89, -2.2, 10, 5.5) + leaf(154, 97, -0.9, 8, 4.5) + leaf(182, 93, -0.7, 10, 5.5) + leaf(173, 103, -2, 8, 4.5) + leaf(204, 102, -0.5, 8, 4.4),
    ].join('');
    s.figure(P(wolf) + head + E(124, 131, 9, 11.5) + E(120, 173, 5.5, 2.5) + E(134, 173, 5, 2.5) + E(201, 173, 5.5, 2.5) + E(180, 173, 5, 2.5),
      { fill: p.fig, rim: p.rim, offsets: [[0, 1.2], [-0.9, 0.6], [0.9, 0.6]], rimOp: 0.95, shade: 0.5, edge: 0.3, halo: 0.35 });
    s.add('<path data-part="bark" d="M140,113l6,4l7,-3l6,5M162,114l7,4l8,-2l7,5" stroke="#4f6b38" stroke-width="1.2" fill="none" opacity=".9"/>');
    // new buds glowing at the tips
    const bud = s.rad([[0, '#fbffd0', 0.95], [0.35, '#e6f78f', 0.5], [1, '#e6f78f', 0]]);
    s.add('<g data-part="tips">');
    s.add(tips.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="${bud}"/>`).join(''));
    s.bloom(tips.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.1" fill="#fdffe6"/>`).join(''), { sd: 1.6, k: 1.6 });
    s.add('</g>');
    // dark vines in front, wrapping the frame
    s.path(vine([-12, 200], [44, 172], { side: -1, curl: 7, w: 7, leaves: 2, lr: 11 }) + vine([312, 204], [252, 180], { side: 1, curl: 7, w: 7, leaves: 2, lr: 11 }), '#121c0c');
    s.motes({ seed: 215, n: 22, x: [40, 260], y: [30, 175], r: [0.5, 1.2], fill: '#f2ffb8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  mossback(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f4efcc'], [0.55, '#d9dfb0'], [1, '#a9be8f']]));
    s.glow(232, 26, 150, '#fff8d8', 0.85);
    s.shafts({ cx: 250, cy: -14, from: 100, to: 160, n: 7, len: 300, spread: 2.5, color: '#fffbe6', op: 0.3, seed: 221, sd: 2.2 });
    // tall trunks going up into the mist, the farthest softened by it
    s.blur(`<g fill="#ccd6ae">${[[14, 6], [48, 5], [98, 7], [176, 5], [226, 6], [262, 8], [292, 5]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="160"/>`).join('')}</g>`, 0.7);
    s.fog(118, '#f8f4dc', 0.5);
    s.add(`<g fill="#aebf91">${[[30, 10], [76, 8], [244, 11], [282, 9]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="164"/>`).join('')}</g>`);
    s.path(woods({ seed: 222, base: 156, top: 132, r0: 7, r1: 12 }), '#a3b688');
    s.fog(146, '#f6f2d8', 0.55);
    // the stream
    s.path('M-10,214L-10,158C60,156 120,157 170,156C230,155 270,157 310,158L310,214Z', s.lin([[0, '#d5ddb6'], [1, '#86a070']]));
    // the beast wading: a domed, mossy shell with a little tree on it
    const bid = s.uid('mb');
    const shell = blob([[66, 146], [70, 120], [84, 98], [108, 82], [136, 76], [164, 80], [186, 94], [200, 116], [204, 144], [190, 150], [136, 152], [80, 150]]);
    const parts = taper([[184, 146], [188, 160], [189, 176]], [20, 18, 19]) + taper([[90, 146], [86, 160], [85, 176]], [20, 18, 19]) +
      taper([[196, 134], [212, 128], [226, 128]], [18, 14, 12]) + taper([[68, 140], [58, 146], [52, 150]], [7, 4, 0.5]) +
      taper([[140, 80], [141, 66], [139, 54]], [4, 3, 2]) +
      leaf(98, 90, -2.3, 12, 6) + leaf(100, 88, -1.7, 10, 5) + leaf(190, 96, -0.9, 12, 6) + leaf(188, 95, -1.5, 9, 5) + leaf(122, 80, -2, 9, 5) +
      [[80, 152, 160], [96, 153, 163], [118, 154, 161], [156, 154, 163], [178, 153, 160], [194, 151, 158]].map(([x, y, y2]) => taper([[x, y], [x + 0.5, y2]], [3, 0.5])).join('');
    s.defs.push(`<g id="${bid}">${P(shell, parts, blob([[220, 120], [232, 118], [242, 122], [246, 129], [240, 134], [226, 135], [219, 130]]), 'M244,126L250,131L242,133Z')}${E(136, 148, 72, 6)}` +
      `${C(82, 104, 5)}${C(96, 90, 6)}${C(114, 81, 6)}${C(152, 76, 6)}${C(170, 82, 6)}${C(186, 93, 5.5)}${C(197, 106, 4.5)}` +
      `${C(132, 52, 7)}${C(142, 46, 9)}${C(151, 52, 7)}${C(141, 57, 7)}</g>`);
    s.figure(`<use href="#${bid}"/>`, { fill: p.fig, rim: p.rim, offsets: [[1, -1.2], [-0.6, -1.2]], shade: 0.45, edge: 0.3, halo: 0.35 });
    s.add('<circle cx="234" cy="124" r="1.2" fill="#f1f6c8"/>');
    // flowers on the shell
    const fl = s.rad([[0, '#fbffd8', 0.95], [0.35, '#eef9a8', 0.5], [1, '#eef9a8', 0]]);
    const flowers = [[106, 84], [166, 79], [190, 99], [146, 44]];
    s.add(flowers.map(([x, y]) => `<circle class="breathe" cx="${x}" cy="${y}" r="8" fill="${fl}"/>`).join(''));
    s.bloom(flowers.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#fdffe8"/>`).join(''), { sd: 1.3, k: 1.6, box: [80, 20, 136, 100] });
    // water over its legs, its reflection, ripples
    s.path('M-10,214L-10,166L310,166L310,214Z', s.lin([[0, '#cfd9b0', 0.92], [1, '#7d9768']]));
    const cid = s.uid('c');
    s.defs.push(`<clipPath id="${cid}"><rect x="-5" y="166" width="310" height="50"/></clipPath>`);
    s.add(`<g clip-path="url(#${cid})"><use href="#${bid}" fill="#33472a" opacity=".28" transform="translate(0 332) scale(1 -1)"/></g>`);
    s.add('<g fill="none" stroke="#f5f3dc" stroke-width=".9" opacity=".75"><ellipse cx="187" cy="167" rx="18" ry="2.4"/><ellipse cx="86" cy="167" rx="17" ry="2.2"/><path d="M30,180h26M226,186h30M120,194h22"/></g>');
    s.fog(166, '#fbf8e6', 0.5);
    // rushes framing the near bank
    const rush = (x, h, lean) => taper([[x, 214], [x + lean * 0.4, 214 - h * 0.5], [x + lean, 214 - h]], [3, 2.2, 0.4]);
    s.path(rush(6, 70, -4) + rush(14, 52, 6) + rush(22, 40, 10) + rush(292, 66, 5) + rush(284, 50, -6) + rush(276, 36, -10), '#17220f');
    s.add(`<g fill="#17220f">${E(4.5, 156, 2.6, 7, -4)}${E(295, 160, 2.6, 7, 5)}</g>`);
    s.motes({ seed: 225, n: 16, x: [30, 270], y: [30, 160], r: [0.5, 1.2], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [6, 10], op: [0.5, 1] });
    return s.svg();
  },

  'ancient-roots'(s) {
    const p = PAL.verdant;
    // a strip of daylight above, the deep earth below
    s.rect(s.lin([[0, '#f6efc8'], [0.2, '#e4e3ae']]));
    s.glow(70, 0, 110, '#fff8d8', 0.8);
    s.path(woods({ seed: 231, base: 40, top: 16, r0: 5, r1: 9 }), '#bccb98');
    s.path('M-10,214L-10,41C40,39 80,41 120,40L180,40C220,41 260,39 310,41L310,214Z', s.lin([[0, '#5d5a3a'], [0.3, '#403f28'], [0.7, '#252b18'], [1, '#11160a']]));
    s.add('<g fill="none" stroke="#77744c" stroke-width="1.4" opacity=".3"><path d="M-10,80C60,74 120,84 180,78C230,74 270,82 310,78"/><path d="M-10,122C50,118 110,126 170,120C230,116 270,124 310,120"/><path d="M-10,170C60,164 130,172 190,166C240,162 280,170 310,166"/></g>');
    s.path([[30, 60, 3], [74, 102, 2.5], [228, 90, 3.2], [262, 140, 2.6], [36, 150, 3], [212, 186, 2.8], [90, 190, 2.4], [280, 60, 2]].map(([x, y, r]) => circ(x, y, r)).join(''), '#6b6847');
    // the glowing stones, and the light they throw out between the roots
    s.glow(150, 150, 120, '#d9f27a', 0.5, 'breathe');
    s.shafts({ cx: 150, cy: 152, from: -180, to: 180, n: 14, len: 150, spread: 3.2, color: '#eefaa8', op: 0.26, seed: 234, sd: 2.4, near: 0.22 });
    const st = s.rad([[0, '#fbffd8'], [0.55, '#e3f58c'], [1, '#a9c95a']], { cx: 0.42, cy: 0.38, r: 0.7 });
    s.bloom(`<g fill="${st}"><path d="${blob([[128, 142], [140, 128], [160, 127], [174, 138], [176, 158], [164, 172], [142, 172], [128, 160]])}"/><path d="${blob([[108, 158], [116, 150], [124, 156], [122, 168], [111, 168]])}"/><path d="${blob([[176, 168], [186, 160], [194, 166], [190, 176], [180, 177]])}"/></g>`, { sd: 2.4, k: 1.2, box: [80, 100, 140, 100] });
    // the roots: two great ones coil around the stones, the rest spread and dive
    const rootA = [[126, 40], [112, 66], [102, 100], [104, 134], [116, 162], [138, 180], [164, 180], [184, 166], [190, 144], [182, 126], [168, 121]];
    const rootB = [[174, 40], [190, 66], [198, 100], [190, 124], [170, 134], [150, 146], [132, 160], [118, 176], [104, 186], [88, 190]];
    const roots = [
      taper(rootA, [24, 20, 16, 14, 12, 10, 9, 8, 6, 4, 2]),
      taper(rootB, [22, 18, 15, 12, 10, 9, 7, 5, 3, 1.5]),
      taper([[120, 42], [90, 52], [58, 64], [30, 86], [10, 112], [-8, 132]], [14, 10, 8, 6, 4, 2.5]),
      taper([[180, 42], [212, 52], [244, 66], [270, 92], [290, 118], [308, 134]], [14, 10, 8, 6, 4, 2.5]),
      taper([[64, 62], [52, 96], [60, 132], [48, 168], [40, 204]], [7, 5.5, 4, 2.6, 1]),
      taper([[246, 66], [244, 104], [256, 140], [248, 176], [256, 210]], [7, 5.5, 4, 2.6, 1]),
      taper([[104, 104], [80, 126], [72, 156], [80, 190]], [6, 4.5, 3, 1]),
      taper([[196, 104], [222, 126], [228, 158], [218, 196]], [6, 4.5, 3, 1]),
      taper([[30, 86], [24, 120], [30, 150]], [3, 2, 0.8]) + taper([[270, 92], [276, 124], [270, 150]], [3, 2, 0.8]),
      taper([[116, 162], [100, 170], [92, 180]], [4, 2.5, 0.8]) + taper([[184, 166], [200, 176], [206, 190]], [4, 2.5, 0.8]),
    ].join('');
    s.figure(P(roots), { fill: '#121909', rim: '#c4de70', offsets: [[0, 1], [0.9, 0.4], [-0.9, 0.4]], rimOp: 0.55, shade: 0.5, edge: 0.3, halo: 0.35 });
    // light pulsing through them
    const veins = line(rootA.slice(0, 10)) + line(rootB.slice(0, 8));
    s.add(`<g class="twinkle" style="--t:2.6s;--o:.9" fill="none" stroke-linecap="round"><path d="${veins}" stroke="#e6f78f" stroke-width="2.6" opacity=".25"/><path d="${veins}" stroke="#eefaa8" stroke-width=".9"/></g>`);
    // the foot of the tree, up in the daylight
    s.figure(P('M114,-6L186,-6L186,22C188,32 198,38 214,42L86,42C102,38 112,32 114,22Z'), { fill: '#1d2814', rim: p.rim, offsets: [[-1, -0.6]] });
    s.path([12, 30, 52, 70, 222, 240, 262, 284].map((x, i) => taper([[x, 41], [x + (i % 2 ? 2 : -2), 34], [x + (i % 2 ? 4 : -3), 29]], [3, 1.6, 0.3])).join(''), '#3f5530');
    s.motes({ seed: 233, n: 18, x: [80, 220], y: [90, 200], r: [0.5, 1.1], fill: '#efffb0', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  'patient-giant'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#e6deae'], [0.55, '#d6dca4'], [1, '#9fb57d']]));
    s.glow(154, 46, 125, '#fff8d6', 0.95);
    // the sun stands right behind its head
    s.shafts({ cx: 154, cy: 46, from: -180, to: 0, n: 14, len: 280, spread: 2.2, color: '#fffbe4', op: 0.3, seed: 241, sd: 2.4 });
    s.bloom('<circle cx="154" cy="46" r="31" fill="#fffdf0"/>', { sd: 4, k: 1.3, box: [84, -24, 140, 140] });
    // far woods, then the pines round the clearing: they only reach its knees
    s.path(woods({ seed: 242, base: 152, top: 110, r0: 7, r1: 13 }), '#cbd6a6');
    s.haze(124, 154, '#fbf7dc', 0.35, 6);
    s.path(pines({ seed: 243, base: 166, h: [18, 34], gap: [6, 12] }), '#90a873');
    s.path('M-10,214L-10,170C60,164 120,166 160,168C210,170 260,166 310,170L310,214Z', '#3c5230');
    // the giant: old and heavy, head bowed between sloping shoulders, long
    // arms hanging loose, twig fingers, weight on one leg. It has stood still
    // so long that trees have taken root on its shoulders.
    const tree = (x, y, h, r) => [taper([[x, y + 1], [x + 0.6, y - h * 0.5], [x, y - h]], [2.2, 1.6, 1.2]),
      circ(x, y - h - r * 0.4, r) + circ(x - r * 0.75, y - h + r * 0.1, r * 0.7) + circ(x + r * 0.75, y - h + r * 0.15, r * 0.66)];
    const fingers = (x, y, k) => taper([[x, y], [x - 4 * k, y + 10], [x - 7 * k, y + 16]], [5, 3.4, 1.2]) +
      taper([[x + 1, y + 1], [x + 1, y + 12], [x - 1 * k, y + 19]], [5, 3.4, 1.2]) + taper([[x + 3 * k, y], [x + 6 * k, y + 9], [x + 7 * k, y + 15]], [4.5, 3, 1]);
    const body = [
      taper([[154, 63], [155, 74]], [12, 15]),
      taper([[128, 84], [118, 102], [114, 120], [116, 138], [114, 148]], [17, 14, 12, 10, 9]),
      taper([[182, 82], [192, 100], [195, 118], [192, 136], [194, 146]], [17, 14, 12, 10, 9]),
      fingers(114, 146, 1) + fingers(194, 144, -1),
      taper([[144, 130], [141, 157], [139, 183]], [22, 17, 15]),
      taper([[166, 130], [173, 156], [177, 182]], [22, 17, 15]),
    ].join('');
    const trees = [tree(173, 75, 11, 6), tree(184.5, 82, 7, 4.4), tree(159, 43, 6, 3.4)];
    const grove = trees.map((t) => t[0]).join(''), crowns = trees.map((t) => t[1]).join('');
    s.figure(P(body, grove, crowns,
      blob([[146, 44], [156, 41], [164, 47], [166, 58], [161, 67], [151, 69], [144, 62], [142, 52]]),
      blob([[124, 94], [130, 79], [142, 72], [156, 70], [170, 72], [182, 79], [188, 94], [188, 112], [182, 127], [170, 137], [142, 137], [130, 127], [124, 112]])) +
      C(129, 81, 3.6) + C(135, 76.5, 4) + C(142, 73, 3.4) + C(170, 73, 3.6) + C(181, 78, 3.4) + E(137, 186, 11, 4) + E(180, 185, 11, 4),
    { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.8], [1.2, -0.8], [0, -1.3]], shade: 0.4, edge: 0.3, halo: 0.4 });
    // bark: a few long seams, not ribs
    s.add('<path d="M138,88C141,100 137,108 140,118M163,82C159,94 165,104 161,116C159,122 162,127 160,132M143,148C141,158 144,168 142,178M175,150C174,160 177,170 176,178M119,108C118,116 116,122 116,130M192,106C193,114 194,120 193,128" stroke="#33462a" stroke-width="1.1" fill="none" opacity=".75"/>');
    // arrows it has not bothered to pull out
    const arrows = [[131, 79, -140, 32], [127, 85, -164, 30], [138, 75, -116, 30], [129, 82, -152, 23]].map(([x, y, deg, len]) => {
      const a = (deg * Math.PI) / 180, ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
      const q = (t, o) => pt([x + ux * t + nx * o, y + uy * t + ny * o]);
      return { shaft: `M${q(0, 0)}L${q(len, 0)}`, fletch: `M${q(len, 0)}L${q(len - 8, 3.2)}L${q(len - 4.5, 0)}L${q(len - 8, -3.2)}Z` };
    });
    s.add(`<path d="${arrows.map((a) => a.shaft).join('')}" stroke="${p.fig}" stroke-width="2"/><path d="${arrows.map((a) => a.fletch).join('')}" fill="${p.fig}"/>`);
    // calm eyes, half closed
    s.glow(148.5, 55, 7, '#f7ffc8', 0.85).glow(159.5, 55.5, 7, '#f7ffc8', 0.85);
    s.bloom(`<g fill="#fbffd8">${E(148.5, 55, 2.8, 0.9, 6)}${E(159.5, 55.5, 2.8, 0.9, 6)}</g>`, { sd: 1.2, k: 1.6, box: [130, 40, 46, 30] });
    // mist round its knees, and the near bank
    s.haze(146, 178, '#fbf8e2', 0.38, 10);
    s.path('M-10,214L-10,198C70,194 150,196 220,198C260,199 290,197 310,198L310,214Z', '#1c2913');
    s.path(bird(80, 44, 1.1) + bird(98, 34, 0.8) + bird(220, 40, 0.9), p.fig);
    s.motes({ seed: 244, n: 16, x: [40, 260], y: [30, 170], r: [0.5, 1.1], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  'worldtree-stag'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f1dfa4'], [0.5, '#ead494'], [1, '#9db57a']]));
    s.glow(112, 40, 130, '#fff6d0', 0.95);
    s.shafts({ cx: 112, cy: 40, from: 6, to: 174, n: 11, len: 300, spread: 2.3, color: '#fffbe6', op: 0.3, seed: 251, sd: 2.4 });
    // the sun, caught in its antlers
    s.bloom('<circle cx="112" cy="42" r="17" fill="#fffdf0"/>', { sd: 3.5, k: 1.35, box: [56, -14, 112, 112] });
    s.add(`<g fill="#d8d49c">${[[16, 6], [44, 5], [236, 7], [266, 5], [290, 8]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="180"/>`).join('')}</g>`);
    s.path(woods({ seed: 252, base: 150, top: 112, r0: 8, r1: 14 }), '#c9cd93');
    s.path(woods({ seed: 253, base: 170, top: 120, r0: 10, r1: 17, x0: 224, prof: (x) => (x - 250) / 30 }), '#9fb07a');
    s.path(woods({ seed: 254, base: 168, top: 128, r0: 9, r1: 15, x1: 50, prof: (x) => (24 - x) / 24 }), '#9fb07a');
    s.path('M-10,214L-10,186C40,182 90,184 120,186C170,188 230,182 310,186L310,214Z', '#2a3a1e');
    // antlers: two living branches, each tine ending in leaves
    const beams = [
      [[[110, 82], [104, 64], [94, 48], [82, 34], [74, 22]], [5, 4, 3, 2, 1.2]],
      [[[104, 64], [90, 60], [78, 54], [70, 46]], [3, 2.2, 1.6, 1]],
      [[[94, 48], [100, 36], [104, 24], [104, 14]], [2.6, 2, 1.4, 0.8]],
      [[[82, 34], [70, 32], [60, 26], [54, 18]], [2, 1.5, 1, 0.6]],
      [[[116, 80], [126, 62], [138, 46], [152, 34], [164, 26]], [5, 4, 3, 2, 1.2]],
      [[[126, 62], [140, 60], [152, 54], [160, 46]], [3, 2.2, 1.6, 1]],
      [[[138, 46], [134, 34], [136, 22], [140, 12]], [2.6, 2, 1.4, 0.8]],
      [[[152, 34], [166, 36], [178, 32], [188, 24]], [2, 1.5, 1, 0.6]],
    ].map(([pts, w]) => taper(pts, w)).join('');
    const R = rng(255);
    let leaves = '';
    for (const [x, y, n] of [[74, 22, 6], [70, 46, 5], [104, 14, 5], [54, 18, 5], [90, 42, 4], [164, 26, 6], [160, 46, 5], [140, 12, 5], [188, 24, 5], [146, 42, 4], [118, 58, 3], [84, 58, 3]]) {
      for (let i = 0; i < n; i++) {
        const a = R() * Math.PI * 2, d = 1.5 + R() * 4;
        leaves += leaf(x + Math.cos(a) * d, y + Math.sin(a) * d, a, 6 + R() * 3, 3.4 + R() * 1.4);
      }
    }
    // the stag
    const legs = [
      taper([[134, 122], [122, 106], [112, 90]], [26, 20, 15]),
      taper([[114, 84], [124, 80], [130, 80]], [6, 4, 0.5]),
      taper([[134, 140], [132, 162], [130, 185]], [9, 5, 4]) + taper([[146, 142], [148, 164], [150, 185]], [9, 5, 4]),
      taper([[200, 138], [208, 154], [204, 168], [206, 185]], [16, 8, 5, 4]) + taper([[188, 140], [194, 156], [190, 170], [192, 185]], [14, 7, 4.5, 4]),
      taper([[212, 118], [218, 124]], [5, 2]),
    ].join('');
    s.figure(P(legs, beams, leaves,
      blob([[128, 116], [150, 110], [180, 110], [204, 114], [214, 124], [210, 140], [196, 146], [160, 146], [136, 144], [124, 134]]),
      blob([[116, 82], [114, 92], [104, 98], [90, 100], [84, 96], [88, 90], [100, 84], [108, 78]])) +
      E(130, 186, 3, 1.6) + E(150, 186, 3, 1.6) + E(192, 186, 3, 1.6) + E(206, 186, 3, 1.6),
    { fill: p.fig, rim: p.rim, offsets: [[-1.2, -1], [0, -1.2]], shade: 0.45, edge: 0.3, halo: 0.35 });
    s.add('<circle cx="101" cy="88" r="1.2" fill="#f1f6c8"/>');
    // blossoms glowing among the leaves
    const bl = s.rad([[0, '#fffbe2', 0.95], [0.35, '#fff3b8', 0.5], [1, '#fff3b8', 0]]);
    const blossoms = [[76, 20], [102, 16], [58, 22], [72, 48], [166, 28], [142, 14], [186, 26], [158, 48]];
    s.add(blossoms.map(([x, y]) => `<circle class="breathe" cx="${x}" cy="${y}" r="6.5" fill="${bl}"/>`).join(''));
    s.bloom(`<path d="${blossoms.map(([x, y]) => circ(x, y, 1.6)).join('')}" fill="#fffdf0"/>`, { sd: 1.4, k: 1.5, box: [40, 0, 160, 66] });
    s.motes({ seed: 256, n: 18, x: [30, 270], y: [20, 180], r: [0.5, 1.2], fill: '#fff4c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },

  'the-forest-remembers'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#ece2b2'], [0.5, '#dee1a6'], [1, '#a3ba82']]));
    s.glow(150, 44, 175, '#fff8d6', 0.95);
    // the sun is behind its crown: light pours down between its boughs
    s.shafts({ cx: 150, cy: 44, from: 8, to: 172, n: 13, len: 300, spread: 2.2, color: '#fffbe6', op: 0.32, seed: 261, sd: 2.4 });
    s.path(woods({ seed: 262, base: 154, top: 126, r0: 6, r1: 11 }), '#c8d4a6');
    s.haze(126, 156, '#fbf8e0', 0.35, 6);
    // the colossus: an old oak standing up out of the forest, its crown running
    // off the top of the picture and its boughs spread wide like arms
    const R = rng(266);
    let crown = '';
    // three great clusters of leaves, with sky breaking through between them
    for (const [x, y, r] of [[150, -6, 27], [133, 8, 15], [167, 7, 15],
      [86, 22, 20], [66, 34, 12], [104, 10, 14], [76, 8, 13],
      [214, 20, 21], [234, 34, 12], [196, 9, 14], [224, 6, 13]]) {
      crown += circ(x, y, r);
      // leaves hang in scallops from the underside
      for (let i = 0; i < 2; i++) { const a = Math.PI * (0.15 + R() * 0.7); crown += circ(x + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85, r * (0.28 + R() * 0.14)); }
    }
    const boughs = [
      taper([[150, 192], [149, 150], [150, 110], [152, 76], [150, 30]], [88, 74, 64, 50, 34]),
      taper([[146, 48], [128, 34], [108, 26], [92, 24]], [16, 11, 7, 4]) + taper([[154, 48], [172, 34], [192, 26], [210, 24]], [16, 11, 7, 4]),
      taper([[124, 100], [98, 94], [74, 84], [54, 70], [42, 58]], [26, 19, 13, 8, 4]),
      taper([[176, 96], [202, 88], [226, 78], [246, 64], [258, 54]], [26, 19, 13, 8, 4]),
      taper([[74, 84], [62, 92], [50, 94]], [6, 4, 1]) + taper([[98, 94], [92, 80], [86, 70]], [6, 4, 1]),
      taper([[226, 78], [238, 86], [250, 88]], [6, 4, 1]) + taper([[202, 88], [208, 74], [214, 64]], [6, 4, 1]),
    ].join('');
    let tufts = '';
    for (const [x, y] of [[42, 56], [50, 94], [258, 52], [250, 88]]) {
      for (let i = 0; i < 3; i++) { const a = R() * Math.PI * 2; tufts += leaf(x, y, a, 6 + R() * 3, 3.6); }
    }
    s.figure(P(crown, boughs, tufts), { fill: p.fig, rim: p.rim, offsets: [[-1.2, -0.8], [1.2, -0.8], [0, -1.3]], shade: 0.4, edge: 0.3, halo: 0.4 });
    s.add('<path d="M118,140C121,152 116,164 119,178M182,140C179,152 184,164 181,178M128,60C125,70 129,80 126,88M172,60C175,70 171,80 174,88" stroke="#34482a" stroke-width="1.3" fill="none" opacity=".8"/>');
    // its face, lit by its own eyes: a heavy brow, a long nose, a closed mouth, a beard of moss
    s.add(`<ellipse cx="150" cy="112" rx="34" ry="30" fill="${s.rad([[0, '#3f552b', 0.95], [1, '#3f552b', 0]])}"/>`);
    s.add('<g fill="none" stroke-linecap="round"><path d="M120,95C127,86 140,85 148,93M180,95C173,86 160,85 152,93" stroke="#d6eb92" stroke-width="2.8" opacity=".85"/><path d="M150,96C149,106 148,113 145,119C148,122 153,122 156,119M124,106C122,113 124,120 128,126M176,106C178,113 176,120 172,126" stroke="#7d9858" stroke-width="1.5"/><path d="M136,131C143,129.5 157,129.5 164,131" stroke="#0b1208" stroke-width="2.6"/></g>');
    s.path(taper([[136, 134], [134, 146], [138, 160]], [7, 5, 0.8]) + taper([[146, 135], [146, 152], [144, 166]], [7, 5, 0.8]) + taper([[156, 135], [157, 150], [160, 164]], [7, 5, 0.8]) + taper([[165, 133], [167, 144], [164, 156]], [6, 4, 0.8]), '#3f5a2c');
    s.glow(137, 101, 14, '#ecff9a', 0.9, 'breathe').glow(163, 101, 14, '#ecff9a', 0.9, 'breathe');
    s.bloom('<path d="M126,100Q137,95.5 148,101Q137,105.5 126,100ZM152,101Q163,95.5 174,100Q163,105.5 152,101Z" fill="#f6ffc8"/>', { sd: 1.4, k: 1.7, box: [114, 84, 72, 32] });
    // memories: pale leaves drifting down out of its crown
    s.add([[80, 46, 0.6, 7], [112, 40, -0.4, 9], [190, 42, 2.2, 8], [222, 50, -2.6, 10], [68, 70, 1.4, 11], [232, 72, 0.3, 7.5], [126, 64, -1.2, 9.5], [176, 66, 2.8, 8.5], [110, 90, 0.9, 10.5], [192, 104, -1.9, 9], [132, 150, 2, 8], [168, 142, -0.7, 9.5]].map(([x, y, a, t], i) =>
      `<path class="float" style="--t:${t}s;--d:-${f1((t * (i % 3)) / 3)}s" d="${leaf(x, y, a, 8.5, 4.8)}" fill="#f4fcc4" opacity="${f1(0.72 + (i % 3) * 0.12)}"/>`).join(''));
    s.path(bird(52, 46, 1.2) + bird(266, 64, 0.9), p.fig);
    // the forest it rises from
    s.path(woods({ seed: 263, base: 172, top: 142, r0: 9, r1: 16 }), '#86a168');
    s.haze(150, 174, '#f8f6dc', 0.35, 8);
    s.path(woods({ seed: 264, base: 198, top: 172, r0: 10, r1: 18 }), '#24341b');
    s.motes({ seed: 265, n: 16, x: [40, 260], y: [30, 180], r: [0.5, 1.1], fill: '#fff6c8', hot: '#ffffff', cls: 'float', t: [5, 9], op: [0.5, 1] });
    return s.svg();
  },
});
