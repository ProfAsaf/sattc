// Umbral card art. Style rules live in ../scenes.js; drawing tools in ../kit.js.

import { H, W, blob, canopy, line, particles, pines, poly, rays, ridge, rng, ruins, spline, taper } from '../kit.js';
import { PAL, arcade, mirror, page } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (d, extra = '') => `<path d="${d}"${extra ? ` ${extra}` : ''}/>`;
const parts = (list) => list.map((d) => P(d)).join('');
// A smooth edge (hill, mound, moor) closed off below the card.
const ledge = (pts, bottom = H + 10) => poly([...spline(pts, 6), [pts[pts.length - 1][0], bottom], [pts[0][0], bottom]]);
// Grave markers standing on a baseline b, optionally leaning (degrees).
const lean = (d, x, b, a) => (a ? `<path d="${d}" transform="rotate(${a} ${x} ${b})"/>` : `<path d="${d}"/>`);
const cross = (x, b, h, a = 0) => {
  const t = h * 0.075;
  return lean(`M${f1(x - t)},${b}V${f1(b - h)}H${f1(x + t)}V${b}ZM${f1(x - h * 0.28)},${f1(b - h * 0.76)}h${f1(h * 0.56)}v${f1(t * 1.9)}h${f1(-h * 0.56)}Z`, x, b, a);
};
const stone = (x, b, w, h, a = 0) => {
  const r = w / 2;
  return lean(`M${f1(x - r)},${b}V${f1(b - h + r)}A${f1(r)},${f1(r)} 0 0 1 ${f1(x + r)},${f1(b - h + r)}V${b}Z`, x, b, a);
};
// An upright coffin standing on the baseline b.
const coffin = (x, b, h) => {
  const w = h * 0.34, hw = w * 0.62, fw = w * 0.5, t = b - h, sh = t + h * 0.27;
  return poly([[x - hw / 2, t], [x + hw / 2, t], [x + w / 2, sh], [x + fw / 2, b], [x - fw / 2, b], [x - w / 2, sh]]);
};
// Three long fingers fanning out from (x, y) around angle a (degrees).
const claw = (x, y, a, len = 9) => [-30, 0, 30].map((da) => {
  const t = ((a + da) * Math.PI) / 180;
  return taper([[x, y], [x + Math.cos(t) * len * 0.6, y + Math.sin(t) * len * 0.6], [x + Math.cos(t + 0.25) * len, y + Math.sin(t + 0.25) * len]], [2, 1.4, 0.3]);
});
// Small tufts of heather or grass along the bottom.
const tufts = (list) => parts(list.flatMap(([x, y, h]) => [-24, -8, 8, 22].map((a, i) => {
  const t = (a * Math.PI) / 180, hh = h * (0.75 + (i % 2) * 0.3);
  return taper([[x, y], [x + Math.sin(t) * hh * 0.5, y - hh * 0.55], [x + Math.sin(t) * hh, y - hh]], [2.6, 1.6, 0.3]);
})));

export const umbral = {
  'something-beneath'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0c0814'], [0.5, '#211832'], [0.74, '#3a2d54'], [1, '#14101f']]));
    s.add(particles({ seed: 41, n: 46, x: [0, W], y: [0, 112], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(66, 46, 70, '#c9b8f2', 0.32);
    s.add('<circle cx="66" cy="46" r="15" fill="#e6def4"/><circle cx="61" cy="43" r="3" fill="#cfc4e4" opacity=".6"/><circle cx="70" cy="51" r="2.2" fill="#cfc4e4" opacity=".5"/>');
    // drowned towers give it scale: dark against the pale horizon
    s.path(ruins({ seed: 42, base: 151, x0: -4, x1: 74, h: [16, 50], w: [7, 13] }), '#110c1a');
    s.path(ruins({ seed: 43, base: 151, x0: 228, x1: 304, h: [14, 42], w: [7, 12] }), '#110c1a');
    s.glow(152, 104, 96, '#7a4fd0', 0.24);
    const horror = [
      blob([[92, 160], [94, 124], [106, 92], [124, 68], [146, 55], [168, 58], [188, 76], [202, 106], [208, 160]]),
      taper([[134, 66], [128, 54], [122, 46]], [6, 2.6, 0.4]),
      taper([[160, 60], [166, 47], [174, 40]], [7, 3, 0.4]),
      taper([[148, 57], [146, 44]], [4, 0.4]),
      taper([[180, 70], [188, 60]], [4, 0.4]),
      taper([[102, 162], [82, 122], [67, 86], [72, 60], [88, 53], [95, 64]], [19, 15, 11, 7, 4, 1.4], { per: 10 }),
      taper([[198, 162], [220, 126], [235, 93], [230, 67], [216, 62], [211, 74]], [19, 15, 11, 7, 4, 1.4], { per: 10 }),
      taper([[36, 166], [41, 141], [56, 131], [69, 139], [72, 166]], [8, 6.5, 5, 4, 3.5]),
      taper([[252, 166], [256, 146], [268, 139], [279, 151], [283, 168]], [6.5, 5, 4, 3, 2.4]),
      taper([[118, 162], [111, 141], [117, 125], [126, 122]], [6.5, 4.5, 2.2, 0.8]),
    ].map((d) => `<path d="${d}"/>`).join('');
    s.figure(horror, { fill: p.fig, rim: p.rim, offsets: [[-1.2, -1]], rimOp: 0.75 });
    // suckers along the inside of the two great arms
    s.add(`<g fill="${p.rim}" opacity=".28">${[[86, 128, 2.2], [78, 112, 2], [73, 96, 1.7], [74, 80, 1.4], [80, 68, 1.1],
      [214, 130, 2.2], [222, 114, 2], [228, 98, 1.7], [226, 82, 1.4], [220, 70, 1.1]].map(([x, y, r]) =>
      `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`);
    // no face, just too many eyes, unevenly spaced, and a seam of light
    s.glow(148, 126, 26, '#a46bff', 0.5, 'breathe');
    s.add('<path d="M146,112C144,121 145,131 148,142C151,131 152,121 150,112Z" fill="#9d6be8" opacity=".9"/>');
    for (const [x, y, rx] of [[131, 94, 2.9], [160, 88, 3.4], [146, 78, 1.9], [119, 107, 1.5], [176, 101, 2.2], [139, 104, 1.3], [167, 109, 1.2], [153, 70, 1.1]]) {
      s.glow(x, y, rx * 3.2, '#b07cff', 0.65);
      s.add(`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${(rx * 0.55).toFixed(2)}" fill="#f1e6ff"/>`);
    }
    // the black lake hides everything below the waterline
    s.path(`M-10,151L${W + 10},151L${W + 10},${H + 10}L-10,${H + 10}Z`, s.lin([[0, '#1d1530'], [1, '#06040a']]));
    s.add(`<g stroke="#9a86c4" fill="none" opacity=".4">${[[54, 153, 22], [150, 154, 64], [268, 153, 20], [116, 154, 12]].map(([x, y, r]) =>
      `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 0.12).toFixed(1)}" stroke-width=".8"/>`).join('')}</g>`);
    s.add(`<g fill="#d8cdf0">${[[66, 158, 14, 0.55], [66, 164, 10, 0.4], [66, 171, 16, 0.3], [66, 179, 8, 0.25], [66, 187, 12, 0.18]].map(([x, y, w, o]) =>
      `<rect x="${x - w / 2}" y="${y}" width="${w}" height="1.1" rx=".5" opacity="${o}"/>`).join('')}</g>`);
    s.fog(150, '#8c78b8', 0.22);
    s.fog(166, '#6d5a96', 0.16);
    return s.svg();
  },

  // A scrawny rat digs at an old grave by moonlight, bones in the spoil heap.
  'grave-rat'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0b0814'], [0.45, '#1f1730'], [0.68, '#3b2c57'], [0.82, '#2a2040'], [1, '#14101e']]));
    s.add(particles({ seed: 401, n: 24, x: [0, W], y: [0, 100], r: [0.25, 0.8], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    s.glow(236, 42, 72, '#c9b8f2', 0.34);
    s.add('<circle cx="236" cy="42" r="14" fill="#e6def4"/><circle cx="231" cy="38.5" r="2.6" fill="#cfc4e4" opacity=".6"/><circle cx="240" cy="47" r="1.8" fill="#cfc4e4" opacity=".5"/>');
    // the far churchyard on its hill
    s.path(ledge([[-10, 140], [40, 133], [90, 129], [140, 132], [190, 131], [240, 135], [310, 139]]), '#2b2142');
    s.add(`<g fill="#2b2142">${cross(70, 132, 13, -6)}${cross(96, 131, 10, 4)}${stone(118, 132, 7, 10)}${cross(186, 133, 12, 8)}${stone(206, 134, 8, 11, -5)}${cross(264, 138, 14, -3)}` +
      '<path d="M12,139V112L27,101L42,112V139ZM12,112V94L17,82L22,94V112Z"/></g>');
    s.fog(136, '#8c78b8', 0.2);
    // a fence and leaning stones nearer in; something else is watching
    s.path(ledge([[-10, 164], [60, 160], [130, 162], [200, 158], [310, 162]]), '#1a1426');
    let fence = 'M-4,150h76v1.6h-76ZM-4,159h76v1.6h-76Z';
    for (let x = -2; x < 72; x += 6) fence += `M${x},166V146l1.2,-3l1.2,3V166Z`;
    s.path(fence, '#1a1426');
    s.add(`<g fill="#1a1426">${stone(232, 162, 12, 20, 6)}${cross(256, 162, 22, -10)}${stone(288, 163, 14, 18, -4)}</g>`);
    s.glow(31, 170, 7, '#b07cff', 0.7).glow(283, 151, 7, '#b07cff', 0.7);
    s.add('<g fill="#e2ccff"><circle cx="29" cy="170" r=".9"/><circle cx="33" cy="170" r=".9"/><circle cx="281" cy="151" r=".9"/><circle cx="285" cy="151" r=".9"/></g>');
    // the ground, the old stone, the open hole and the spoil heap
    s.path(ledge([[-10, 178], [40, 176], [90, 179], [140, 183], [200, 185], [260, 183], [310, 180]]), '#0e0a14');
    s.figure(stone(92, 184, 40, 80, -7), { fill: '#1d1630', rim: p.rim, offsets: [[1, -1]], rimOp: 0.8 });
    s.add(`<g transform="rotate(-7 92 184)"><g fill="#2a2142">${cross(92, 152, 26)}</g><path d="M99,108l-4,10l5,7l-6,12l3,9" stroke="#0a0710" stroke-width="1.4" fill="none"/></g>`);
    s.add('<ellipse cx="132" cy="187" rx="32" ry="6.5" fill="#050308"/>');
    s.figure(P(blob([[146, 190], [158, 172], [176, 160], [198, 155], [222, 157], [244, 165], [262, 178], [266, 190]])), { fill: '#1a1424', rim: '#6e5a96', offsets: [[0.8, -1]], rimOp: 0.8 });
    const bone = '#a497bd';
    s.add(`<g fill="${bone}"><ellipse cx="56" cy="184" rx="8" ry="6.6"/><rect x="51" y="186" width="10" height="5.4" rx="2"/>` +
      '<circle cx="231" cy="176.5" r="2.4"/><circle cx="232.5" cy="180" r="2.4"/><circle cx="252" cy="168.4" r="2.4"/><circle cx="253.6" cy="171.8" r="2.4"/></g>' +
      `<path d="M232,178L253,170" stroke="${bone}" stroke-width="3"/>` +
      '<g fill="#0e0a14"><ellipse cx="53" cy="184.5" rx="2.2" ry="2"/><ellipse cx="59.5" cy="184.5" rx="2.2" ry="2"/><path d="M56,187.6l-1.2,2h2.4Z"/></g>' +
      `<path d="M186,168q2,-9 10,-12M192,170q2,-9 10,-12M198,172q2,-8 9,-11" stroke="${bone}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`);
    // the rat: lean, its backbone showing, nose down in the dirt, tail up
    const rat = parts([
      blob([[154, 147], [160, 137], [174, 129], [192, 126], [210, 128], [224, 136], [230, 146], [222, 153], [204, 152], [182, 150], [164, 151]]),
      taper([[163, 141], [152, 147], [142, 157], [136, 167]], [18, 13.5, 7.5, 1.6]),
      taper([[158, 150], [150, 162], [143, 173]], [4.4, 3, 2.2]),
      taper([[167, 151], [163, 163], [157, 176]], [4.4, 3, 2.2]),
      taper([[143, 173], [138, 178]], [2.2, 0.4]), taper([[157, 176], [152, 180]], [2.2, 0.4]),
      taper([[222, 150], [230, 160], [227, 168]], [4.4, 3.2, 2.4]),
      taper([[227, 168], [241, 169]], [3, 0.6]),
      taper([[229, 143], [246, 136], [258, 122], [264, 104], [260, 90], [252, 84]], [4.4, 3.6, 3, 2.2, 1.3, 0.4], { per: 10 }),
    ]) + '<ellipse cx="163" cy="128" rx="4.4" ry="6.4" transform="rotate(-28 163 128)"/><ellipse cx="218" cy="145" rx="9" ry="8"/>' +
      [[184, 126.8], [194, 125.6], [204, 125.8], [213, 128]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4"/>`).join('');
    s.figure(rat, { fill: p.fig, rim: p.rim, offsets: [[1, -1], [0.4, -1.2]], rimOp: 0.9 });
    s.add(`<path d="M184,134q-3,8 0,14M192,133q-3,8 0,14M200,133q-3,8 0,14" stroke="${p.rim}" stroke-width=".8" opacity=".35" fill="none"/>`);
    s.glow(154, 146, 11, '#b07cff', 0.85, 'breathe');
    s.add('<ellipse cx="154" cy="146" rx="2.2" ry="1.4" fill="#efe2ff" transform="rotate(32 154 146)"/>');
    s.add([[128, 172, 2.2], [122, 165, 1.6], [134, 162, 1.4]].map(([x, y, r], i) =>
      `<circle class="fall" style="--d:${(-i * 0.5).toFixed(1)}s" cx="${x}" cy="${y}" r="${r}" fill="#2a2038"/>`).join(''));
    s.add(`<g fill="#07050b">${tufts([[8, 214, 22], [30, 214, 16], [286, 214, 20], [304, 214, 14]])}</g>`);
    s.add(particles({ seed: 404, n: 12, x: [60, 280], y: [60, 170], r: [0.4, 1], fill: '#cdb8f0', cls: 'float', t: [6, 10], op: [0.25, 0.6] }));
    return s.svg();
  },

  // The undertaker among his coffins: lantern held low, a tape measure in the other hand.
  'kindly-undertaker'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0c0915'], [0.5, '#251b38'], [0.76, '#4a3868'], [1, '#1c1528']]));
    s.add(particles({ seed: 411, n: 26, x: [0, W], y: [0, 84], r: [0.25, 0.75], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.8], t: [2.5, 6] }));
    s.glow(150, 168, 170, '#7a5cb8', 0.3);
    // a far chapel and yews
    s.path(ledge([[-10, 152], [50, 146], [110, 148], [170, 145], [230, 149], [310, 146]]), '#30254a');
    s.add('<g fill="#30254a"><path d="M14,150V118L30,106L46,118V150ZM14,118V96L19,80L24,96V118Z"/>' +
      '<ellipse cx="64" cy="132" rx="6" ry="18"/><ellipse cx="78" cy="137" rx="5" ry="14"/><ellipse cx="166" cy="134" rx="5.5" ry="16"/></g>');
    s.path(ledge([[-10, 162], [80, 158], [160, 160], [240, 156], [310, 158]]), '#1d162b');
    // two rows of coffins standing on end, one either side of him
    const row = [[86, 180, 64], [61, 174, 55], [40, 169, 48], [21, 165, 42], [4, 162, 37],
      [184, 182, 78], [214, 176, 68], [240, 171, 60], [263, 167, 53], [283, 163, 47], [301, 160, 42]];
    s.figure(parts(row.map(([x, b, h]) => coffin(x, b, h))), { fill: '#221a33', rim: '#a08cc8', offsets: [[0, -1.2], [1, -0.6]], rimOp: 0.7 });
    s.add(`<g fill="#3a2d54">${row.map(([x, b, h]) => `<path d="M${f1(x - 0.8)},${f1(b - h * 0.86)}h1.6v${f1(h * 0.34)}h-1.6ZM${f1(x - h * 0.07)},${f1(b - h * 0.76)}h${f1(h * 0.14)}v1.5h${f1(-h * 0.14)}Z"/>`).join('')}</g>`);
    s.path(ledge([[-10, 180], [60, 182], [140, 186], [220, 184], [310, 180]]), '#120d1b');
    // the undertaker: top hat, frock coat, a gentle stoop
    s.glow(110, 131, 46, '#d9b8ff', 0.55, 'breathe');
    s.add('<ellipse cx="112" cy="187" rx="46" ry="6" fill="#d9b8ff" opacity=".14"/>');
    const man = parts([
      taper([[134, 140], [127, 162], [123, 182]], [7, 6, 5]),
      taper([[141, 140], [145, 162], [147, 182]], [7, 6, 5]),
      taper([[140, 90], [139, 108], [139, 126], [141, 146]], [19, 20, 22, 22]),
      taper([[146, 128], [152, 146], [155, 158]], [10, 8, 2]),
      taper([[136, 91], [130, 84]], [6, 5]),
      taper([[119, 79], [115.5, 82]], [3, 0.6]),
      taper([[134, 94], [124, 108], [112, 116]], [5.6, 4.8, 4]),
      taper([[144, 94], [152, 110], [155, 124]], [5.4, 4.6, 4]),
    ]) + '<circle cx="126" cy="79" r="7.5"/><ellipse cx="127" cy="72" rx="11.5" ry="2.4" transform="rotate(-6 127 72)"/>' +
      '<path d="M119.5,72L120.5,49L134,48L135.5,71Z"/><circle cx="110.5" cy="117" r="2.8"/><circle cx="155" cy="126" r="2.6"/>' +
      '<ellipse cx="119" cy="183.5" rx="6.4" ry="2.2"/><ellipse cx="150" cy="183.5" rx="6" ry="2.2"/>' +
      '<path d="M108.5,117.5V121M104,125L116,125L113,121L107,121Z"/><path d="M103.5,138h13v2.6h-13Z"/><path d="M104,125h1.3v13h-1.3ZM114.7,125h1.3v13h-1.3Z"/>';
    s.figure(man, { fill: p.fig, rim: '#e2d4f6', offsets: [[-1.2, 0.3], [-0.6, -1.1]], rimOp: 0.9 });
    s.add('<rect x="105.3" y="125" width="9.4" height="13" fill="#f6ecff"/><circle cx="121.5" cy="78" r="1.1" fill="#efe2ff"/>');
    const tape = 'M155,128C159,146 151,160 156,174C159,182 166,185 172,184';
    s.add(`<path d="${tape}" fill="none" stroke="#e9e0f6" stroke-width="2.2"/><path d="${tape}" fill="none" stroke="#3d2f5c" stroke-width="2.2" stroke-dasharray=".8 4.2"/>`);
    s.add(particles({ seed: 413, n: 12, x: [76, 150], y: [96, 176], r: [0.4, 1.1], fill: '#efe2ff', cls: 'float', t: [5, 9], op: [0.3, 0.8] }));
    return s.svg();
  },

  // A skeletal hand claws up out of a fresh grave; violet light leaks through the soil.
  unearth(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0e0a17'], [0.42, '#2a2040'], [0.7, '#54437a'], [1, '#2a2040']]));
    s.add(particles({ seed: 421, n: 20, x: [0, W], y: [0, 70], r: [0.25, 0.7], fill: '#e8defa', cls: 'twinkle', op: [0.2, 0.7], t: [2.5, 6] }));
    // the misty graveyard behind
    s.path(ledge([[-10, 146], [50, 140], [110, 143], [170, 139], [230, 142], [310, 138]]), '#3d3058');
    s.add(`<g fill="#3d3058">${cross(28, 142, 16, -8)}${stone(52, 142, 9, 13)}${cross(214, 141, 15, 6)}${stone(240, 142, 10, 14, -6)}${cross(276, 139, 18, -4)}</g>`);
    s.fog(136, '#b3a2dc', 0.28);
    s.path(ledge([[-10, 164], [60, 158], [120, 161], [190, 157], [250, 160], [310, 156]]), '#251c38');
    s.add(`<g fill="#251c38">${stone(34, 162, 16, 24, -9)}${cross(70, 161, 26, 7)}${stone(234, 160, 15, 22, 6)}${cross(268, 158, 30, -6)}</g>`);
    s.fog(154, '#9a86c4', 0.24);
    // light seeping up from below, and the hand
    s.glow(150, 100, 84, '#7a5cb8', 0.32);
    s.glow(150, 170, 64, '#a46bff', 0.55, 'breathe');
    const knuckles = [[127, 101, 3], [141, 88, 3], [151, 86, 3], [161, 89, 3], [170, 97, 2.8], [121, 91, 2.4], [137, 74, 2.5], [150, 70, 2.5], [164, 75, 2.4], [176, 87, 2.2],
      [145, 121, 4.6], [151, 118.5, 4.6], [157, 122, 4.2], [151, 124, 4]];
    const hand = parts([
      taper([[143, 178], [145, 150], [146, 126]], [7.5, 5.5, 7]),
      taper([[157, 178], [157, 150], [157, 128]], [7, 5, 6.5]),
      taper([[142, 118], [134, 110], [127, 101]], [4.4, 3.6, 3.2]),
      taper([[146, 114], [143, 100], [141, 88]], [4, 3.4, 3.2]),
      taper([[151, 113], [151, 98], [151, 86]], [4.2, 3.4, 3.2]),
      taper([[156, 114], [159, 100], [161, 89]], [4, 3.4, 3.2]),
      taper([[160, 118], [166, 106], [170, 97]], [3.8, 3.2, 3]),
      taper([[127, 101], [121, 91], [119, 82], [120, 75]], [3.2, 2.8, 2, 0.4]),
      taper([[141, 88], [137, 74], [137, 62], [140, 54], [145, 50]], [3.2, 2.8, 2.6, 1.8, 0.4]),
      taper([[151, 86], [150, 70], [151, 57], [154, 49], [159, 45]], [3.2, 2.8, 2.6, 1.8, 0.4]),
      taper([[161, 89], [164, 75], [166, 64], [170, 57], [174, 54]], [3, 2.7, 2.5, 1.7, 0.4]),
      taper([[170, 97], [176, 87], [179, 78], [182, 72], [185, 70]], [2.8, 2.4, 2.2, 1.4, 0.4]),
    ]) + knuckles.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
    s.figure(hand, { fill: p.fig, rim: '#c9a6ff', offsets: [[-1, 0.8], [1, 0.8], [0, 1.3], [0, -0.8]], rimOp: 0.85 });
    // the fresh earth, cracked with light, clods thrown up
    s.figure(P(ledge([[-10, 188], [30, 182], [70, 176], [110, 170], [150, 166], [190, 168], [230, 174], [270, 181], [310, 187]])),
      { fill: s.lin([[0, '#1d1429'], [1, '#08060c']]), rim: '#b07cff', offsets: [[0, -1.2]], rimOp: 0.7 });
    s.add('<g stroke="#c08cff" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"><path d="M146,170l-8,7l-6,3l-10,10l-8,4M156,170l7,8l10,5l6,9M150,172l-2,10l3,8l-2,12M166,169l14,3l12,-2l14,6"/></g>');
    s.add('<g fill="#1c1428"><ellipse cx="126" cy="168" rx="7" ry="3.4"/><ellipse cx="176" cy="166.5" rx="8" ry="3.6"/><ellipse cx="108" cy="173" rx="5" ry="2.6"/><ellipse cx="196" cy="171" rx="5.5" ry="2.6"/></g>');
    s.add([[128, 150, 2.4], [174, 144, 2], [136, 136, 1.6], [168, 128, 1.4]].map(([x, y, r], i) =>
      `<circle class="fall" style="--d:${(-i * 0.4).toFixed(1)}s" cx="${x}" cy="${y}" r="${r}" fill="#1c1428"/>`).join(''));
    s.add(particles({ seed: 424, n: 18, x: [96, 204], y: [96, 200], r: [0.5, 1.3], fill: '#c9a6ff', cls: 'rise', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  // A gaunt vulture-thing with too many limbs perches on a broken wall above the battlefield.
  bonepicker(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#120c1e'], [0.42, '#30244a'], [0.68, '#6a4f80'], [0.8, '#98728f'], [1, '#3a2a48']]));
    s.glow(236, 152, 130, '#e0b0c8', 0.38);
    s.add(particles({ seed: 431, n: 18, x: [0, W], y: [0, 60], r: [0.25, 0.7], fill: '#efe2ff', cls: 'twinkle', op: [0.2, 0.7], t: [2.5, 6] }));
    // the battlefield far below: spears, a banner
    s.path(ledge([[-10, 168], [60, 163], [130, 166], [200, 161], [260, 164], [310, 160]]), '#4d3a62');
    const r = rng(432);
    let spears = '';
    for (let i = 0; i < 18; i++) {
      const x = 20 + r() * 270, a = ((r() - 0.5) * 40 * Math.PI) / 180, h = 9 + r() * 7;
      spears += `M${f1(x)},167l${f1(Math.sin(a) * h)},${f1(-Math.cos(a) * h)}`;
    }
    s.add(`<path d="${spears}" stroke="#4d3a62" stroke-width="1"/>`);
    s.add('<g fill="#4d3a62"><path d="M246,165L249,138L250.4,138L247.4,165Z"/><path d="M249,139L262,142L256,146L261,150L248.6,149Z"/></g>');
    s.add('<g fill="none" stroke="#2a1f3a" stroke-width="1.1"><path d="M58,62q3,-3 6,0q3,-3 6,0M78,52q2.4,-2.4 4.8,0q2.4,-2.4 4.8,0M262,74q2.4,-2.4 4.8,0q2.4,-2.4 4.8,0"/></g>');
    s.fog(160, '#c9a6c8', 0.18);
    s.path(ledge([[-10, 186], [70, 180], [150, 184], [230, 178], [310, 182]]), '#2a1f3a');
    s.path(ledge([[-10, 200], [100, 204], [200, 202], [310, 198]]), '#0c0812');
    // the broken wall: high where it perches, crumbled low in front of its head
    const wall = poly([[34, 214], [34, 162], [42, 156], [52, 158], [60, 150], [74, 152], [84, 147], [100, 149], [110, 145], [124, 147], [134, 136], [146, 129], [180, 129], [190, 125], [200, 128], [208, 137], [214, 134], [221, 150], [226, 163], [231, 214]]);
    s.figure(P(wall), { fill: '#2a2040', rim: '#e6c6dc', offsets: [[0.8, -1], [0, -1.2]], rimOp: 0.75 });
    s.add('<g stroke="#1a1428" stroke-width="1" fill="none" opacity=".8"><path d="M40,166H120M128,150H212M44,180H96M108,170H224M38,196H140M150,188H228M80,166V180M150,150V170M190,150V170M110,180V196M70,196V210M180,188V210"/></g>');
    // the bonepicker in profile: hunched, one ragged wing raised, a bald head
    // hanging on a long neck, and more legs than a bird should have
    const beast = parts([
      blob([[140, 112], [146, 96], [160, 86], [178, 86], [192, 96], [198, 112], [194, 126], [180, 132], [160, 130], [146, 124]]),
      poly([[150, 94], [170, 86], [190, 90], [202, 102], [210, 118], [216, 134], [222, 150], [214, 143], [212, 154], [206, 141], [200, 150], [196, 134], [184, 124], [164, 116]]),
      poly([[164, 92], [170, 72], [182, 52], [196, 38], [214, 28], [208, 41], [221, 41], [206, 51], [217, 57], [200, 61], [209, 69], [192, 71], [196, 81], [180, 84]]),
      poly([[152, 92], [143, 95], [137, 90], [135, 99], [128, 97], [133, 105], [141, 106], [149, 108]]),
      taper([[148, 100], [134, 95], [122, 99], [114, 109], [111, 119]], [10, 7, 6, 5.5, 5]),
      taper([[106, 127], [100, 132], [98, 140], [101, 146]], [5.6, 3.8, 2, 0.4]),
      taper([[160, 128], [158, 134]], [4.4, 2.8]), taper([[176, 130], [178, 134]], [4.4, 2.8]),
      taper([[158, 133], [151, 132]], [2, 0.4]), taper([[158, 133], [163, 134]], [2, 0.4]), taper([[178, 133], [171, 133]], [2, 0.4]), taper([[178, 133], [184, 134]], [2, 0.4]),
      taper([[150, 122], [138, 132], [131, 148], [127, 164]], [4.4, 3.4, 3, 2.6]),
      taper([[166, 130], [161, 146], [159, 162], [157, 176]], [4, 3.2, 2.8, 2.4]),
      taper([[188, 128], [198, 142], [200, 158], [198, 172]], [4, 3.2, 2.8, 2.4]),
      ...claw(127, 164, 100), ...claw(157, 176, 95), ...claw(198, 172, 85),
    ]) + '<ellipse cx="110" cy="124" rx="7.5" ry="6" transform="rotate(40 110 124)"/>';
    s.figure(beast, { fill: p.fig, rim: '#e6c6dc', offsets: [[1, -0.5], [0.5, -1]], rimOp: 0.9 });
    for (const [x, y, rr] of [[106.5, 121.5, 1.4], [111, 119.5, 1.1], [113, 124.5, 0.9], [116.5, 116, 0.8], [104.5, 125.5, 0.7]]) {
      s.glow(x, y, rr * 4, '#b07cff', 0.7);
      s.add(`<circle cx="${x}" cy="${y}" r="${rr}" fill="#efe2ff"/>`);
    }
    // a helmet on a spear in the foreground
    s.add('<g fill="#0c0812"><path d="M262,214L270,96L272,96L265,214Z"/><path d="M268,98L271,84L274,98Z"/><path d="M258,128a10,9 0 0 1 20,0l1,6h-22Z"/></g>');
    s.add(particles({ seed: 434, n: 14, x: [40, 290], y: [30, 190], r: [0.4, 1.1], fill: '#e2d0e8', cls: 'float', t: [6, 10], op: [0.25, 0.7] }));
    return s.svg();
  },

  // A ghostly knight rises from his tomb holding up a cracked hourglass, the sand pouring.
  'borrowed-time'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0a0712'], [0.55, '#1d1631'], [1, '#110c1b']]));
    // the crypt: a narrow window in the side wall, two pillars, the floor
    s.glow(90, 54, 80, '#9a7fd6', 0.38);
    s.path('M80,86V44Q80,30 90,24Q100,30 100,44V86Z', s.lin([[0, '#e2d8f6'], [1, '#8a74bc']]));
    s.add('<path d="M90,26V86M80,60H100" stroke="#140f22" stroke-width="1.8"/>');
    s.add(rays({ cx: 90, cy: 56, from: 28, to: 60, n: 5, len: 170, spread: 2.6, color: '#c9b6f2', op: 0.09, seed: 441 }));
    s.add('<g fill="#2a2142"><path d="M48,174V40h16v134ZM44,44h24v-6h-24ZM236,174V40h16v134ZM232,44h24v-6h-24Z"/></g>');
    s.path('M-10,172H310V214H-10Z', '#141020');
    s.add('<g stroke="#221a33" stroke-width="1" fill="none"><path d="M-10,184H310M-10,198H310M40,172L20,214M110,172L100,214M190,172L200,214M260,172L280,214"/></g>');
    // the knight, rising
    s.glow(142, 108, 64, '#8f6bd8', 0.32);
    const knight = parts([
      blob([[124, 150], [121, 128], [124, 110], [134, 102], [150, 102], [160, 110], [163, 128], [160, 150]]),
      taper([[160, 108], [176, 101], [186, 90]], [10, 8.5, 7]),
      taper([[186, 90], [190, 76], [192, 66]], [7.5, 6.5, 6]),
      taper([[124, 110], [108, 124], [100, 141]], [10, 8, 7]),
      taper([[142, 66], [142, 58]], [3.4, 1.2]),
    ]) + '<ellipse cx="124" cy="107" rx="11.5" ry="8" transform="rotate(-20 124 107)"/><ellipse cx="160" cy="106" rx="11.5" ry="8" transform="rotate(20 160 106)"/>' +
      '<path d="M136,104V94H148V104Z"/><path d="M131,96V78Q131,66 142,64Q153,66 153,78V96Z"/>' +
      '<circle cx="192" cy="63" r="5"/><ellipse cx="99" cy="145" rx="6.4" ry="4"/>';
    s.figure(knight, { fill: '#120c1e', rim: '#cbb8f4', offsets: [[-1.3, -0.4], [1.3, -0.4], [0, -1.4], [0, 1]], rimOp: 0.85 });
    s.glow(142, 80, 16, '#b07cff', 0.7);
    s.add('<path d="M134,80.5H150" stroke="#efe2ff" stroke-width="2.2" stroke-linecap="round"/>');
    // the hourglass, cracked, the sand running out fast
    s.glow(194, 40, 44, '#b07cff', 0.7, 'breathe');
    s.add('<g transform="translate(194 44) scale(1.3) translate(-194 -44)">' +
      '<path d="M186,32Q194,42 194,44Q194,46 186,56H202Q194,46 194,44Q194,42 202,32Z" fill="#d9c8f6" opacity=".55"/>' +
      '<path d="M188.5,35H199.5Q196,40.5 194,43Q192,40.5 188.5,35Z" fill="#c08cff"/><path d="M187.5,56Q194,47 200.5,56Z" fill="#c08cff"/>' +
      '<path d="M194,43V55" stroke="#f1e6ff" stroke-width=".8"/><path d="M189,33.5l3,3.4l-2.2,2.6l3.6,2.4" stroke="#0a0710" stroke-width=".8" fill="none"/>' +
      '<g fill="#1a1428"><rect x="181" y="28" width="26" height="4" rx="1"/><rect x="181" y="56" width="26" height="4" rx="1"/><rect x="183" y="32" width="1.8" height="24"/><rect x="203.2" y="32" width="1.8" height="24"/></g>' +
      [[194, 47], [194, 50.5], [194, 53.5], [186, 40], [184, 46]].map(([x, y], i) =>
        `<circle class="fall" style="--d:${(-i * 0.3).toFixed(1)}s" cx="${x}" cy="${y}" r=".7" fill="#f1e6ff"/>`).join('') + '</g>');
    // the tomb, its lid shoved aside, mist spilling over the rim
    s.figure('<path d="M66,152H234V198H66Z"/><path d="M60,146H240V154H60Z"/>', { fill: '#1d1630', rim: '#c9b6f4', offsets: [[0, -1.2]], rimOp: 0.7 });
    s.add('<g fill="none" stroke="#2e2445" stroke-width="1.6"><rect x="78" y="162" width="40" height="26"/><rect x="130" y="162" width="40" height="26"/><rect x="182" y="162" width="40" height="26"/></g>');
    s.figure('<path d="M214,140L292,180L288,190L210,150Z"/>', { fill: '#251d3a', rim: '#c9b6f4', offsets: [[0, -1.2]], rimOp: 0.6 });
    s.fog(146, '#b9a6e8', 0.34);
    s.fog(156, '#8f78c8', 0.2);
    // the arch we look through
    s.path('M-10,-10H310V214H284V76Q284,24 150,2Q16,24 16,76V214H-10Z', '#06040a');
    s.add(particles({ seed: 444, n: 14, x: [80, 230], y: [40, 150], r: [0.4, 1.1], fill: '#d9c8f6', cls: 'float', t: [6, 10], op: [0.3, 0.8] }));
    return s.svg();
  },

  // A lone stone door on the moor at night, ajar; cold light spills across the heather.
  'death-is-a-door'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#07050d'], [0.48, '#1b1430'], [0.72, '#3a2b58'], [0.78, '#2c2142'], [1, '#100b18']]));
    s.add(particles({ seed: 451, n: 50, x: [0, W], y: [0, 120], r: [0.25, 0.85], fill: '#e8defa', cls: 'twinkle', op: [0.25, 0.9], t: [2.5, 6] }));
    // the moor: far hills with standing stones, mist
    s.path(ledge([[-10, 152], [40, 146], [90, 149], [150, 144], [210, 148], [260, 143], [310, 147]]), '#2c2244');
    s.add('<g fill="#2c2244"><path d="M36,148V137h3v11ZM42,148V140h2.6v8ZM262,145V132h3.4v13ZM270,146V137h2.6v9Z"/></g>');
    s.fog(146, '#8c78b8', 0.22);
    s.path(ledge([[-10, 176], [50, 172], [110, 175], [170, 171], [230, 174], [310, 170]]), '#1a1428');
    s.path(ledge([[-10, 196], [60, 200], [130, 204], [200, 206], [270, 201], [310, 198]]), '#0b0811');
    // the light from beyond the door
    s.glow(162, 112, 96, '#9b6bff', 0.42, 'breathe');
    s.add(rays({ cx: 162, cy: 110, from: -60, to: 60, n: 7, len: 170, spread: 2.5, color: '#c9a6ff', op: 0.08, seed: 452 }));
    s.path('M158,174L166,174L248,214L176,214Z', s.lin([[0, '#c9a6ff', 0.6], [1, '#c9a6ff', 0]]));
    // the doorway: the lit gap, the slab swung back, the frame
    s.add('<rect x="135" y="52" width="31" height="122" fill="#efe2ff"/>');
    s.add('<path d="M135,52L158,56V170L135,174Z" fill="#0a0710"/><path d="M158,56V170" stroke="#d9c2ff" stroke-width="1"/>');
    s.figure(parts([
      poly([[120, 174], [121, 52], [135, 50], [135, 174]]),
      poly([[166, 174], [166, 50], [180, 52], [181, 174]]),
      poly([[112, 55], [114, 40], [150, 35], [188, 40], [190, 55], [150, 51]]),
      poly([[112, 174], [188, 174], [192, 180], [108, 180]]),
    ]), { fill: '#16101f', rim: '#cdb6f4', offsets: [[0, -1.2], [-1, -0.4], [1, -0.4]], rimOp: 0.8 });
    s.add('<path d="M166.4,52V174" stroke="#f1e6ff" stroke-width="1.2" opacity=".8"/>');
    // someone small stands in the light, looking at it
    const walker = parts([
      taper([[196, 180], [195, 196]], [6, 9.5]),
      taper([[196, 178], [196, 172]], [4.4, 0.5]),
      taper([[193.5, 195], [192, 203]], [2.4, 2]),
      taper([[198, 195], [200, 203]], [2.4, 2]),
      taper([[201, 179], [203, 204]], [1.2, 1.2]),
    ]) + '<circle cx="196" cy="179" r="3.2"/>';
    s.figure(walker, { fill: p.fig, rim: '#e6d6ff', offsets: [[-0.8, -0.6], [0.8, -0.6]], rimOp: 0.9 });
    s.add(`<g fill="#07050b">${tufts([[10, 214, 20], [36, 214, 14], [64, 214, 18], [262, 214, 16], [290, 214, 22]])}</g>`);
    s.add(particles({ seed: 454, n: 12, x: [146, 230], y: [60, 172], r: [0.4, 1.2], fill: '#d9c2ff', cls: 'float', t: [6, 10], op: [0.3, 0.85] }));
    return s.svg();
  },

  // A towering revenant strides out of its barrow, chains dragging, under a violet storm.
  'the-one-who-came-back'(s) {
    const p = PAL.umbral;
    s.rect(s.lin([[0, '#0a0712'], [0.38, '#2a1d44'], [0.66, '#5b3f8c'], [0.8, '#3d2b5e'], [1, '#150f20']]));
    s.glow(160, 80, 140, '#a77cf0', 0.36, 'breathe');
    // storm clouds with lit undersides, and lightning
    const clouds = [[30, 12, 62, 24], [118, 4, 72, 26], [206, 10, 66, 24], [290, 4, 60, 26]];
    s.add(`<g fill="#3c2a5e">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y + 3}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.add(`<g fill="#0c0816">${clouds.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</g>`);
    s.glow(252, 60, 50, '#e6d6ff', 0.4);
    s.add('<path d="M262,24L254,50L262,53L249,86L257,88L245,120" stroke="#f3eaff" stroke-width="1.6" fill="none" stroke-linejoin="bevel"/><path d="M254,50L244,60M249,86L240,92" stroke="#e6d6ff" stroke-width=".8" fill="none"/>');
    // far moor with tiny standing stones
    s.path(ledge([[-10, 172], [60, 166], [120, 170], [180, 165], [240, 169], [310, 166]]), '#2a1f40');
    s.add('<g fill="#2a1f40"><path d="M24,170V160h3v10ZM31,170V163h2.4v7ZM60,168V158h3v10Z"/></g>');
    // the barrow and its stone door, still faintly lit inside
    s.path(blob([[150, 200], [170, 166], [200, 140], [236, 124], [272, 120], [300, 126], [320, 140], [320, 200]]), '#1a1328');
    s.add('<path d="M234,196V156H262V196Z" fill="#050308"/>');
    s.glow(248, 182, 22, '#9b6bff', 0.45);
    s.add('<g fill="#2a2040"><path d="M226,198V152h9v46ZM261,198V152h9v46ZM222,154l2,-9h50l2,9Z"/></g>');
    s.path(ledge([[-10, 188], [60, 190], [120, 194], [200, 196], [260, 194], [310, 190]]), '#0c0814');
    // the revenant: a crowned helm, hunched shoulders, a cloak gone to rags,
    // long arms with chains still on the wrists
    const crown = [[138, 47, -16, 7], [143.5, 44, -6, 10], [149, 43, 3, 6], [154.5, 44, 12, 11]];
    const body = parts([
      taper([[138, 122], [120, 150]], [17, 13]), taper([[120, 150], [104, 184]], [12, 9]),
      taper([[154, 124], [168, 152]], [17, 13]), taper([[168, 152], [182, 182]], [12, 9]),
      poly([[128, 104], [164, 104], [168, 128], [162, 121], [160, 134], [154, 124], [150, 138], [144, 124], [138, 135], [134, 122], [128, 131]]),
      taper([[146, 118], [146, 96], [147, 76]], [28, 34, 38]),
      blob([[137, 72], [135, 57], [139, 45], [147, 40], [155, 45], [159, 57], [157, 72]]),
      ...crown.map(([x, y, a, h]) => { const t = (a * Math.PI) / 180; return taper([[x, y], [x + Math.sin(t) * h, y - Math.cos(t) * h]], [3.6, 0.5]); }),
      taper([[126, 80], [114, 106], [108, 132]], [11, 9, 8]),
      taper([[168, 80], [178, 106], [184, 132]], [11, 9, 8]),
      taper([[116, 102], [117, 120]], [5, 0.5]), taper([[176, 102], [173, 121]], [5, 0.5]),
      poly([[164, 66], [186, 66], [210, 72], [232, 84], [250, 100], [262, 118], [266, 134], [256, 128], [254, 146], [244, 132], [238, 150], [230, 132], [222, 144], [216, 124], [206, 112], [192, 102], [180, 94], [172, 84]]),
      ...claw(107, 138, 95, 8), ...claw(185, 138, 85, 8),
    ]) + '<ellipse cx="126" cy="77" rx="12" ry="9" transform="rotate(-25 126 77)"/><ellipse cx="168" cy="77" rx="12" ry="9" transform="rotate(25 168 77)"/>' +
      '<circle cx="120" cy="150" r="7.5"/><circle cx="168" cy="152" r="7.5"/><ellipse cx="107" cy="134" rx="6" ry="6.6"/><ellipse cx="185" cy="134" rx="6" ry="6.6"/>' +
      '<ellipse cx="98" cy="187" rx="10" ry="3.4"/><ellipse cx="188" cy="185" rx="9" ry="3"/>' +
      '<path d="M106,142C103,164 111,186 129,193S180,197 216,195" fill="none" stroke-width="2.6" stroke-dasharray="3.2 1.6"/>' +
      '<path d="M186,142C193,164 207,182 240,190S282,195 306,193" fill="none" stroke-width="2.6" stroke-dasharray="3.2 1.6"/>';
    s.figure(body, { fill: p.fig, rim: '#cdb6f4', offsets: [[-1.2, -0.6], [1.2, -0.6], [0, -1.3]], rimOp: 0.9 });
    s.glow(147, 58, 16, '#b07cff', 0.75, 'breathe');
    s.add('<path d="M140.5,58H153.5" stroke="#efe2ff" stroke-width="2.2" stroke-linecap="round"/>');
    s.glow(146, 96, 14, '#a46bff', 0.5);
    s.add('<path d="M147,82l-3,8l4,6l-4,9l3,7" stroke="#c9a6ff" stroke-width="1.3" fill="none"/>');
    s.add(particles({ seed: 464, n: 16, x: [40, 290], y: [60, 200], r: [0.4, 1.2], fill: '#d9c2ff', cls: 'rise', t: [5, 9], op: [0.3, 0.8] }));
    return s.svg();
  },
};
