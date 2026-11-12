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
  // ── end of lane B ──
};
