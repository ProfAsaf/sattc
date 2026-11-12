// Cards as puppets (a prototype on Home's fan): the parts of a picture that
// move on their own, each cut from the finished art by tools/bake-live.mjs
// and moved on Home by js/home-alive.js. A part is a set of the drawing's
// elements (`of`), perhaps just the piece inside a polygon (`poly`, in the
// drawing's units, 300 x 210), turning about its joint (`pivot`). `cut`: the
// rest of its elements stay in the picture (a jaw from the dragon's body);
// otherwise all of them come out as parts. `of` is a selector into the
// drawing, 'fig:N' (the Nth figure), or 'alive:N - selector' (the Nth
// character, js/art/alive.js, without what the selector picks).

// The Barrow Queen's court: six ghosts [x, y, size, facing] (scenes/new-b.js)
const COURT = [[66, 168, 1, 1], [100, 178, 0.8, 1], [38, 186, 0.7, 1], [234, 168, 1, -1], [200, 178, 0.8, -1], [262, 186, 0.7, -1]];
const GHOST_POLYS = [
  [[63, 114], [104, 114], [104, 134], [96.5, 134], [96.5, 174], [63, 174]],
  [[96.5, 135], [131, 135], [131, 182], [96.5, 182]],
  [[34, 148], [63, 148], [63, 190], [34, 190]],
  [[196.5, 114], [237.5, 114], [237.5, 174], [203.8, 174], [203.8, 134], [196.5, 134]],
  [[169, 135], [203.8, 135], [203.8, 182], [169, 182]],
  [[237.5, 148], [267, 148], [267, 190], [237.5, 190]],
];

export const PUPPETS = {
  // ── lane A's puppets (bakeoff/recipe.md): new entries go just below this line ──
  // ── end of lane A ──

  // the dragon's head and neck (its own pieces of the figure, and its eye),
  // turning about the base of its neck; and the fire it breathes as drawn
  ashmaw: {
    role: 'attacker', element: 'fire', facing: 'left', emit: [70, 70], hit: [150, 122], // (the interaction contract: bakeoff/recipe.md)
    neck: [146, 90], mouth: [70, 70],
    parts: [
      { name: 'head', of: ['fig:0 [data-part=head]', ':scope > [data-part=head]'], pivot: [146, 90] },
      { name: 'breath', of: '[data-part=breath]', pivot: [72, 72] },
    ],
  },
  // her wings, one each side, at the shoulders; she herself (with halo and blade)
  // above them. `edges`: her raised wings' outer edges (raised 20°, as far out as
  // the picture shows them), where blows land on her shield.
  seraphine: {
    role: 'defender', element: 'light', facing: 'front', hit: [150, 82], guard: [[33, 38], [267, 38]],
    heart: [150, 82], edges: [[33, 38], [267, 38]],
    parts: [
      { name: 'wingL', of: '[data-part=wings]', pivot: [144, 80], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [156, 80], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'her', of: 'alive:0 - [data-part=wings]', pivot: [150, 166] },
    ],
  },
  // her court of ghosts, each on its own
  'the-barrow-queen': {
    role: 'attacker', element: 'spirit', facing: 'front', emit: [150, 160], hit: [150, 100],
    parts: COURT.map(([x, y, k, d], i) => ({ name: `ghost${i}`, of: '[data-part=court]', pivot: [x + k * d, y + 2 * k], poly: GHOST_POLYS[i] })),
  },
  // the theorist: the arc held between her hands (and the bolt feeding it), and
  // she herself, leaning from her feet; `hands`: where the arc springs from
  'lightning-theorist': {
    hands: [[95, 66], [149, 68]], feet: [120, 152], sea: [240, 142],
    parts: [
      { name: 'arc', of: '[data-part=arc]', pivot: [122, 66] },
      { name: 'her', of: 'fig:3', pivot: [120, 152] },
    ],
  },
  // the shieldbearer: he (with his spear) and his shield, each from the knee /
  // the shield's foot; the three arrows already in the shield (they ride with it);
  // and the three in flight, each turning about its own tip. `hits`: where
  // each flying arrow strikes the shield's face, in the order they land.
  shieldbearer: {
    knee: [116, 186], hits: [[187.5, 137], [185.5, 117], [183, 110]],
    parts: [
      { name: 'man', of: 'fig:0 [data-part=man]', pivot: [118, 186] },
      { name: 'shield', of: 'fig:0 [data-part=shield]', pivot: [168, 180] },
      { name: 'stuck', of: '[data-part=stuck]', pivot: [168, 180] },
      { name: 'fly0', of: '[data-part=fly0]', pivot: [245.3, 63.5] },
      { name: 'fly1', of: '[data-part=fly1]', pivot: [219.0, 38.4] },
      { name: 'fly2', of: '[data-part=fly2]', pivot: [263.9, 99.0] },
    ],
  },
  // the lance (bone, violet fire) and the ghostly trail streaming behind it, both
  // about the butt, B; they run along the axis B -> T (its point at T, +4)
  'bone-lance': {
    butt: [60, 72], point: [248, 120.5], axis: [0.9683, 0.2554], ground: [270, 128],
    parts: [
      { name: 'trail', of: '[data-part=trail]', pivot: [60, 72] },
      { name: 'lance', of: '[data-part=lance]', pivot: [60, 72] },
    ],
  },

  // ── lane B's puppets (bakeoff/recipe.md): new entries go just below this line ──
  // Ambush at Dawn: the three spirit soldiers (each its body and its glow, from its
  // feet), the mist they rise from, and the three dark riders (each from its hooves).
  // `guard`: where blows land on the soldiers (their spear points, then their chests),
  // right to left; `soldiers`/`riders`: their feet / hooves
  'ambush-at-dawn': {
    role: 'defender', element: 'spirit', facing: 'right', hit: [114, 128],
    guard: [[187.6, 117.1], [170.4, 111.1], [150, 128.6], [114, 128.4], [89.6, 112.8], [56, 123]],
    soldiers: [[37, 156.6], [129, 166], [83, 184.6]], riders: [[278, 150], [254, 154.5], [230, 160]],
    parts: [
      { name: 'sol0', of: '[data-part=sol0]', pivot: [37, 156.6] },
      { name: 'sol1', of: '[data-part=sol1]', pivot: [129, 166] },
      { name: 'sol2', of: '[data-part=sol2]', pivot: [83, 184.6] },
      { name: 'mist', of: '[data-part=mist]', pivot: [150, 196] },
      { name: 'rider0', of: 'fig:0 [data-part=rider0]', pivot: [278, 150] },
      { name: 'rider1', of: 'fig:0 [data-part=rider1]', pivot: [254, 154.5] },
      { name: 'rider2', of: 'fig:0 [data-part=rider2]', pivot: [230, 160] },
    ],
  },
  // the Lightweaver: she (from her feet; the low sun's light on her robe goes with her),
  // each arm from its shoulder, the threads between her hands, and the spirit forming
  // (its glow, and its body). `hands`: where each arm ends; `emit`: where the spirit
  // leaves from; `follower`: the faint spirit behind her (the move's own target alone)
  lightweaver: {
    role: 'support', element: 'spirit', facing: 'right', emit: [183, 84], hit: [118, 130],
    hands: [[154, 75], [156.4, 102]], shoulders: [[124, 98], [118, 100]], feet: [120, 186], follower: [52, 72], weave: [153, 89],
    parts: [
      { name: 'her', of: 'fig:0 [data-part=body]', pivot: [120, 186] },
      { name: 'armU', of: 'fig:0 [data-part=armU]', pivot: [124, 98] },
      { name: 'armL', of: 'fig:0 [data-part=armL]', pivot: [118, 100] },
      { name: 'sun', of: '[data-part=sun]', pivot: [120, 186] },
      { name: 'halo', of: '[data-part=halo]', pivot: [183, 84] },
      { name: 'threads', of: '[data-part=threads]', pivot: [153, 89] },
      { name: 'spirit', of: '[data-part=spirit]', pivot: [183, 84] },
    ],
  },
  // Bastion: the dome of light (its fill and base, and its skin of lines), the boy
  // braced behind it (with his shield's boss), and the spear breaking on its shoulder:
  // the flash and cracks, the shaft, the shards, the glint. `guard`: points on the
  // dome's skin (an ellipse, centre `dome`, radii 94 x 122), right to left, where
  // blows land; `tip`: where the drawn shaft stops, `axis`: the way it flies
  bastion: {
    role: 'defender', element: 'light', facing: 'right', hit: [112, 140],
    guard: [[218.6, 164.8], [203.9, 117.8], [173, 80.3], [129.3, 64.1], [81.9, 78.3], [48.1, 117.8], [33.4, 164.8]],
    dome: [126, 186], feet: [104, 184], tip: [214.9, 110.8], axis: [-0.845, 0.535],
    parts: [
      { name: 'dome', of: '[data-part=dome]', pivot: [126, 186] },
      { name: 'kid', of: ['fig:0', '[data-part=boss]'], pivot: [104, 184] },
      { name: 'skin', of: '[data-part=skin]', pivot: [126, 186] },
      { name: 'strike', of: '[data-part=strike]', pivot: [203.9, 117.8] },
      { name: 'shaft', of: 'fig:1 [data-part=shaft]', pivot: [214.9, 110.8] },
      { name: 'shards', of: 'fig:1 [data-part=shards]', pivot: [203.9, 117.8] },
      { name: 'flare', of: '[data-part=flare]', pivot: [203.9, 117.8] },
    ],
  },
  // the dark knight (rearing in the pillar) and the two halves of the torn storm
  // above it; `tear`: where the pillar leaves the clouds; `ground`: where it lands
  'dawns-judgment': {
    role: 'attacker', element: 'light', facing: 'front', emit: [150, 4], hit: [150, 118],
    tear: [150, 8], ground: [150, 183], feet: [157, 182],
    parts: [
      { name: 'cloudL', of: 'fig:0', pivot: [0, -10] },
      { name: 'cloudR', of: 'fig:1', pivot: [300, -10] },
      { name: 'knight', of: 'fig:2', pivot: [157, 182] },
    ],
  },
  // the knight (spear grounded, from his feet), the shield with the arm that holds
  // it (from the shoulder), and the long banner in four pieces, each from its own
  // joint along it, so a ripple can run down it. `guard`: where blows land on the
  // shield's face, high to low; `joints`: the banner's joints, from the spear
  'dawnwatch-knight': {
    role: 'defender', element: 'light', facing: 'right', hit: [120, 118], guard: [[151, 110], [151.5, 121], [147.5, 133]],
    feet: [120, 178], shoulder: [131, 108],
    joints: [[104, 40], [150, 40], [196, 40], [232, 40]],
    parts: [
      { name: 'banner0', of: '[data-part=banner]', pivot: [104, 40], poly: [[98, -20], [150, -20], [150, 100], [98, 100]] },
      { name: 'banner1', of: '[data-part=banner]', pivot: [150, 40], poly: [[150, -20], [196, -20], [196, 100], [150, 100]] },
      { name: 'banner2', of: '[data-part=banner]', pivot: [196, 40], poly: [[196, -20], [232, -20], [232, 100], [196, 100]] },
      { name: 'banner3', of: '[data-part=banner]', pivot: [232, 40], poly: [[232, -20], [300, -20], [300, 100], [232, 100]] },
      { name: 'man', of: 'fig:1 [data-part=man]', pivot: [120, 178] },
      { name: 'shield', of: ['fig:1 [data-part=shield]', ':scope > [data-part=shield]'], pivot: [131, 108] },
    ],
  },
  // the beacon: its great flame (from the tower's top, where it burns) and the
  // spirit forming in the beam (about its heart); `heart`: the flame's heart,
  // where the beam leaves; `windows`: the tower's lit slits and door, low to high;
  // `village`: the lit windows in the valley
  'beacon-of-hope': {
    role: 'aura', element: 'light', facing: 'front',
    heart: [96, 34], spirit: [212, 42], base: [96, 54],
    windows: [[96, 172], [96, 138], [96, 114]], village: [[196, 191], [209, 189], [222, 192], [249, 191]],
    parts: [
      { name: 'fire', of: '[data-part=fire]', pivot: [96, 54] },
      { name: 'spirit', of: '[data-part=spirit]', pivot: [212, 42] },
    ],
  },
  // the Choirmother: her wings (each from its shoulder), she herself (from her feet),
  // each raised arm (cut from her, from its shoulder) and her halo. `emit`: her halo,
  // where the spirit of her song forms; `hands`: her raised hands; `alone`: the sky
  // where her spirit flies when nothing is aimed at
  choirmother: {
    role: 'support', element: 'spirit', facing: 'front', emit: [152, 51], hit: [150, 112],
    feet: [150, 186], shoulders: [[141, 86], [159, 86]], hands: [[123, 43], [177, 43]], mouth: [149, 63], alone: [236, 70],
    parts: [
      { name: 'wingL', of: '[data-part=wings]', pivot: [141, 86], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [159, 86], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'her', of: '[data-part=her]', pivot: [150, 186] },
      { name: 'armL', of: '[data-part=her]', pivot: [141, 88], poly: [[100, 30], [139, 30], [139, 84], [144, 93], [130, 102], [100, 102]], cut: true },
      { name: 'armR', of: '[data-part=her]', pivot: [159, 88], poly: [[200, 30], [161, 30], [161, 84], [156, 93], [170, 102], [200, 102]], cut: true },
      { name: 'halo', of: '[data-part=halo]', pivot: [152, 51] },
    ],
  },
  // the banner of the charge: the burning banner in four pieces (its cloth and its fire
  // together), each from its own joint along it, chained from the pole, so a ripple can
  // run out to the tail; the lead rider (with the pole) and the four behind him, each
  // from its hooves. `joints`: the banner's joints from the pole; `riders`: their hooves;
  // `heart`: the sun mark on the banner; `sun`: the sun on the horizon
  'banner-of-the-charge': {
    role: 'aura', element: 'fire', facing: 'right', hit: [150, 130],
    joints: [[147, 56], [96, 56], [64, 56], [34, 56]], heart: [97, 56], sun: [252, 162],
    riders: [[30, 186], [72, 191], [226, 190], [270, 185]], lead: [150, 196],
    parts: [
      { name: 'flag0', of: ['[data-part=flag]', '[data-part=flame]'], pivot: [147, 56], poly: [[96, -20], [150, -20], [150, 130], [96, 130]] },
      { name: 'flag1', of: ['[data-part=flag]', '[data-part=flame]'], pivot: [96, 56], poly: [[64, -20], [96, -20], [96, 130], [64, 130]] },
      { name: 'flag2', of: ['[data-part=flag]', '[data-part=flame]'], pivot: [64, 56], poly: [[34, -20], [64, -20], [64, 130], [34, 130]] },
      { name: 'flag3', of: ['[data-part=flag]', '[data-part=flame]'], pivot: [34, 56], poly: [[-30, -20], [34, -20], [34, 130], [-30, 130]] },
      { name: 'r0', of: 'fig:0 [data-part=r0]', pivot: [30, 186] },
      { name: 'r1', of: 'fig:0 [data-part=r1]', pivot: [72, 191] },
      { name: 'r2', of: 'fig:0 [data-part=r2]', pivot: [226, 190] },
      { name: 'r3', of: 'fig:0 [data-part=r3]', pivot: [270, 185] },
      { name: 'lead', of: 'fig:1 [data-part=lead]', pivot: [150, 196] },
    ],
  },
  // the brook hydra: each of its five necks and heads (with the moss on it and the glow
  // of its eye) cut from the figure about a joint a third of the way up it, so each can
  // sway, bow and strike; the rest of the hydra stays in the water. `heads`: each snout's tip
  // (left to right as drawn); `bases`: where each neck leaves the water; `emit`:
  // the middle head (the move picks the head nearest its target); `alone`: its own target
  'brook-hydra': {
    role: 'support', element: 'nature', facing: 'front', emit: [170.2, 50.2], hit: [150, 140],
    heads: [[66.8, 108.4], [93.3, 75.6], [170.2, 50.2], [223.7, 86.5], [251.4, 136.8]], bases: [[122, 172], [137, 172], [150, 172], [163, 172], [177, 172]], alone: [40, 96],
    parts: [
      { name: 'neck0', of: ['fig:0', '[data-part=moss]', '[data-part=eyes]'], pivot: [111.6, 155.4], cut: true, joint: 7, poly: [[104.0, 122.8], [106.0, 114.0], [104.5, 106.3], [102.8, 103.2], [93.7, 95.5], [86.0, 94.0], [78.3, 95.5], [71.9, 99.9], [67.5, 106.3], [66.4, 110.1], [66.1, 116.0], [67.5, 121.7], [69.4, 125.1], [73.3, 129.5], [76.6, 131.6], [85.0, 134.0], [90.8, 144.1], [102.5, 161.5], [120.8, 149.3], [109.4, 132.2]] },
      { name: 'neck1', of: ['fig:0', '[data-part=moss]', '[data-part=eyes]'], pivot: [131.0, 141.7], cut: true, joint: 7, poly: [[128.5, 94.7], [130.9, 87.0], [130.1, 79.2], [126.5, 72.3], [120.4, 67.4], [113.0, 65.1], [105.2, 65.9], [98.3, 69.5], [93.4, 75.6], [91.4, 81.1], [91.0, 85.0], [91.9, 90.8], [94.2, 95.8], [102.8, 103.2], [108.8, 104.9], [110.6, 110.0], [141.0, 136.2], [136.3, 116.2]] },
      { name: 'neck2', of: ['fig:0', '[data-part=moss]', '[data-part=eyes]'], pivot: [157.6, 133.6], cut: true, joint: 7, poly: [[161.2, 83.7], [161.8, 80.4], [168.1, 76.1], [172.5, 69.7], [173.9, 64.0], [173.1, 56.2], [169.5, 49.3], [163.4, 44.4], [156.0, 42.1], [148.2, 42.9], [142.9, 45.4], [137.4, 50.9], [134.9, 56.2], [134.0, 62.0], [135.5, 69.7], [140.2, 76.4], [139.1, 85.4], [145.1, 111.6], [146.6, 133.9], [165.2, 100.7]] },
      { name: 'neck3', of: ['fig:0', '[data-part=moss]', '[data-part=eyes]'], pivot: [175.1, 143.2], cut: true, joint: 7, poly: [[201.4, 109.8], [209.8, 109.1], [216.7, 105.5], [221.6, 99.4], [223.9, 92.0], [223.1, 84.2], [219.5, 77.3], [213.4, 72.4], [206.0, 70.1], [200.1, 70.4], [194.6, 72.4], [189.9, 75.9], [186.4, 80.6], [184.1, 88.0], [184.5, 94.4], [173.7, 116.1], [164.8, 139.3], [185.3, 147.2], [194.1, 124.4]] },
      { name: 'neck4', of: ['fig:0', '[data-part=moss]', '[data-part=eyes]'], pivot: [191.1, 159.2], cut: true, joint: 7, poly: [[222.2, 149.4], [230.0, 151.9], [237.8, 151.1], [244.7, 147.5], [249.6, 141.4], [251.9, 134.0], [251.1, 126.2], [247.5, 119.3], [241.4, 114.4], [235.9, 112.4], [230.0, 112.1], [224.3, 113.5], [220.9, 115.4], [215.4, 120.9], [213.5, 124.3], [212.2, 129.5], [184.3, 150.5], [197.8, 167.8]] },
    ],
  },
  // ── end of lane B ──
};
