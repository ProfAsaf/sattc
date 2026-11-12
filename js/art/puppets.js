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
  // Field Medic: the medic (kneeling, from her knee, with the tabard sewn on her), her two arms (from the
  // shoulder), the four turns of golden bandage round the knight's forearm (each its own, split out of
  // one), the loose end of the roll and the curl of light lifting off it, and the wounded knight (his head
  // split off at the neck; the rest of him, sword and all, from his seat). `emit`: the bandage, where her
  // gift leaves; `hit`: her middle; `alone`: the knight's heart, where the gift goes when nothing is
  // aimed at; `shoulder`/`seat`/`neck`/`knee`: the joints; `turns`: the middle of each turn of bandage
  'field-medic': (() => {
    const Z = ([x, y]) => [+(170 + (x - 170) * 1.18).toFixed(1), +(190 + (y - 190) * 1.18).toFixed(1)];
    const col = (i) => (i < 0 ? [[-20, -20], [-20, 230]] : i > 3 ? [[320, -20], [320, 230]] : [Z([176 + 3.6 * i, 140]), Z([172.9 + 3.6 * i, 160])]);
    const wrap = (i) => { const a = col(i - 1), b = col(i === 3 ? 4 : i), edge = (c) => (c[0][0] === c[1][0] ? [] : c); return [[a[0][0], -20], [b[0][0], -20], ...edge(b), [b[1][0], 230], [a[1][0], 230], ...edge(a).reverse()]; };
    return {
      role: 'support', element: 'light', facing: 'right', emit: [178, 144], hit: [125, 140], alone: [210, 146],
      shoulder: [129.9, 125.1], seat: [203, 176], neck: [212, 118], knee: [124, 185],
      turns: [0, 1, 2, 3].map((i) => Z([172.3 + 3.6 * i, 151])),
      parts: [
        { name: 'knight', of: 'fig:1', pivot: [203, 176], poly: [[-20, -20], [195, -20], [195, 118], [232, 118], [232, -20], [320, -20], [320, 230], [-20, 230]] },
        { name: 'kHead', of: 'fig:1', pivot: [212, 118], poly: [[195, 85], [232, 85], [232, 118], [195, 118]] },
        { name: 'arms', of: 'fig:2 [data-part=arms]', pivot: [129.9, 125.1] },
        { name: 'her', of: ['fig:2 [data-part=her]', '[data-part=tabard]'], pivot: [124, 185] },
        ...[0, 1, 2, 3].map((i) => ({ name: `wrap${i}`, of: '[data-part=wraps]', pivot: Z([172.3 + 3.6 * i, 151]), poly: wrap(i) })),
        { name: 'loose', of: '[data-part=loose]', pivot: Z([172, 155]) },
        { name: 'curl', of: '[data-part=curl]', pivot: Z([183, 147]) },
      ],
    };
  })(),
  // Bastion Wall: the wall (its figure, with the courses of blocks), the stern face carved in it (brow,
  // eyes with their light, nose, mouth: each its own), the four bursts of sparks on its flanks, the five
  // arrows in flight (each turning about its head), the eight broken arrows and spears lying about it
  // (each from the head end), and the pebbles at its foot. `hit`: its face; `guard`: where blows land
  // on its sides, where the arrows would strike (left high to low, then right); `base`: its foot;
  // `eyes`: where its eyes are; `heads`: where each arrow's head is as drawn; `flank`: its two sides' x
  'bastion-wall': {
    role: 'defender', element: 'earth', facing: 'front', hit: [150, 125], guard: [[70, 71], [70, 111], [70, 147], [230, 86], [230, 132]],
    base: [150, 198], eyes: [[126, 112], [174, 112]], flank: [66, 234],
    heads: [[35.7, 59.9], [23.9, 104.8], [268.4, 72.1], [282.1, 124.8], [50, 146.2]],
    bursts: [[68, 70], [232, 118], [68, 150], [232, 160]],
    lying: [[52, 126], [80, 176], [58, 186], [252, 104], [246, 172], [222, 192], [250, 142], [273, 182]],
    parts: [
      { name: 'wall', of: ['fig:0', '[data-part=walldeco]'], pivot: [150, 198] },
      { name: 'brow', of: '[data-part=brow]', pivot: [150, 95] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 112] },
      { name: 'nose', of: '[data-part=nose]', pivot: [150, 108] },
      { name: 'mouth', of: '[data-part=mouth]', pivot: [150, 154] },
      ...[[68, 70], [232, 118], [68, 150], [232, 160]].map(([x, y], i) => ({ name: `burst${i}`, of: `[data-part=burst${i}]`, pivot: [x, y] })),
      ...[[35.7, 59.9], [23.9, 104.8], [268.4, 72.1], [282.1, 124.8], [50, 146.2]].map((pv, i) => ({ name: `fly${i}`, of: `fig:1 [data-part=fly${i}]`, pivot: pv })),
      ...[[52, 126], [80, 176], [58, 186], [252, 104], [246, 172], [222, 192], [250, 142], [273, 182]].map((pv, i) => ({ name: `fall${i}`, of: `[data-part=fall${i}]`, pivot: pv })),
      { name: 'pebbles', of: '[data-part=pebbles]', pivot: [150, 198] },
    ],
  },
  // Shield Captain: the ten shield-bearers in the line (each cut out of the men, their shields and
  // the seams and bosses on them, by a vertical split between spears, and standing from its feet),
  // the captain (from her feet), her tall shield (from its foot, with its inner rim), the sun on it,
  // and her sword. `hit`: her chest; `guard`: where blows land on her shield's face, high to low,
  // and on the first bearer's; `feet`/`foot`/`hand`: her joints; `rowFeet`: each bearer's feet
  'shield-captain': (() => {
    const ROW = [[162, 190, 0.84], [182, 188.6, 0.77], [200, 187.4, 0.7], [216.6, 186.3, 0.64], [231.6, 185.4, 0.58], [245.4, 184.6, 0.53], [258, 184, 0.48], [269.6, 183.4, 0.44], [280.4, 183, 0.4], [290.4, 182.6, 0.37]];
    const cut = (i) => (i < 0 ? -20 : i >= ROW.length - 1 ? 320 : +((ROW[i][0] + 11.8 * ROW[i][2] + ROW[i + 1][0] - 10.6 * ROW[i + 1][2]) / 2).toFixed(1));
    return {
      role: 'defender', element: 'light', facing: 'front', hit: [108, 132], guard: [[112, 118], [116, 140], [112, 160], [164, 156]],
      feet: [104, 193], foot: [112, 176], hand: [76.6, 79], sunmark: [112, 141], rowFeet: ROW.map(([x, b]) => [x, b]),
      parts: [
        ...ROW.map(([x, b], i) => ({ name: `row${i}`, of: ['fig:0', 'fig:1', '[data-part=rowdeco]'], pivot: [x, b], poly: [[cut(i - 1), -20], [cut(i), -20], [cut(i), 230], [cut(i - 1), 230]] })),
        { name: 'her', of: 'fig:2', pivot: [104, 193] },
        { name: 'shield', of: ['fig:3', '[data-part=shieldline]'], pivot: [112, 176] },
        { name: 'sunmark', of: '[data-part=sunmark]', pivot: [112, 141] },
        { name: 'sword', of: '[data-part=sword]', pivot: [76.6, 79] },
      ],
    };
  })(),
  // Venom Shard: the black crystal (its faces, green seams and veins, the drop on its point; it
  // turns about its middle), the green pool glowing in the palm, and the hand (palm up, from the
  // wrist). `emit`: the shard's middle, where it is let go from; `tip`/`butt`: its point (down) and
  // its upper end at rest; `alone`: the far right, where it flies when nothing is aimed at
  'venom-shard': {
    role: 'attacker', element: 'venom', facing: 'front', emit: [167.5, 90], hit: [150, 184],
    tip: [159, 140], butt: [176, 40], pool: [164, 184], alone: [268, 128],
    parts: [
      { name: 'hand', of: 'fig:0', pivot: [110, 212] },
      { name: 'pool', of: '[data-part=pool]', pivot: [164, 184] },
      { name: 'shard', of: '[data-part=shard]', pivot: [167.5, 90] },
    ],
  },
  // Shackles: the huge beast (its head and horns split off at the neck; the rest of him, standing on
  // his feet), the three iron cuffs, the chains running from them down into the earth, the violet
  // runes cut in the cuffs, and the pools of light where the chains are staked.
  // `emit`: the middle cuff, where the binding leaves; `cuffs`: each cuff; `stakes`: where each chain
  // is driven into the ground; `neck`: the head's joint; `head`: the head's middle; `alone`: the beast's
  // head, which the binding closes on when nothing is aimed at
  shackles: {
    role: 'support', element: 'shadow', facing: 'left', emit: [163, 165], hit: [190, 100],
    cuffs: [[127, 164], [163, 165], [278, 165]], stakes: [[84, 194], [206, 194], [238, 195]], neck: [118, 104], head: [88, 110], alone: [78, 112],
    parts: [
      { name: 'head', of: 'fig:0', pivot: [118, 104], poly: [[40, 55], [116, 55], [124, 100], [124, 125], [110, 150], [40, 150]] },
      { name: 'beast', of: 'fig:0', pivot: [200, 186], poly: [[-20, -20], [320, -20], [320, 230], [-20, 230], [-20, 150], [110, 150], [124, 125], [124, 100], [116, 55], [-20, 55]] },
      { name: 'cuffs', of: 'fig:1', pivot: [163, 165] },
      { name: 'chains', of: '[data-part=chains]', pivot: [163, 175] },
      { name: 'runes', of: '[data-part=runes]', pivot: [163, 165] },
      { name: 'pads', of: '[data-part=pads]', pivot: [160, 194] },
    ],
  },
  // Grave Rite: the moon (it swells), the ring of three rings cut in the turf, the three pale hands
  // breaking up through the earth (split out of one path, each from its own wrist), the clods they
  // throw up, and the four hooded figures (the two far, the two near), each standing from its feet.
  // `emit`: the middle of the ring, where the hands rise and the drain leaves; `hands`: each hand's
  // wrist; `tips`: each hand's fingertips; `alone`: the far right, where the drain goes when nothing is aimed at
  'grave-rite': {
    role: 'attacker', element: 'spirit', facing: 'front', emit: [150, 156], hit: [150, 168],
    hands: [[126, 168], [152, 170], [177, 173]], tips: [[116, 134], [150, 120], [184, 142]], ring: [150, 166], moon: [150, 84], alone: [268, 140],
    parts: [
      { name: 'moon', of: '[data-part=moon]', pivot: [150, 84] },
      { name: 'ring', of: '[data-part=ring]', pivot: [150, 166] },
      { name: 'handL', of: '[data-part=hands]', pivot: [126, 170], poly: [[100, 100], [139, 100], [139, 200], [100, 200]] },
      { name: 'handM', of: '[data-part=hands]', pivot: [152, 172], poly: [[139, 100], [167, 100], [167, 200], [139, 200]] },
      { name: 'handR', of: '[data-part=hands]', pivot: [177, 174], poly: [[167, 100], [210, 100], [210, 200], [167, 200]] },
      { name: 'clods', of: '[data-part=clods]', pivot: [150, 175] },
      { name: 'farL', of: 'fig:0', pivot: [96, 150], poly: [[0, 0], [150, 0], [150, 230], [0, 230]] },
      { name: 'farR', of: 'fig:0', pivot: [204, 150], poly: [[150, 0], [300, 0], [300, 230], [150, 230]] },
      { name: 'nearL', of: 'fig:1', pivot: [34, 214], poly: [[0, 0], [150, 0], [150, 230], [0, 230]] },
      { name: 'nearR', of: 'fig:1', pivot: [268, 214], poly: [[150, 0], [300, 0], [300, 230], [150, 230]] },
    ],
  },
  // Gravewarden: the five soldiers (each split out of their line, standing from their feet), the fresh grave
  // (mound and marker, with the light cracking its crown), the shade (hood, robe, sleeve and staff; its eyes
  // and the fold in its hood), its lantern hanging from the staff's hook, and the streams of violet light
  // running from the grave to the soldiers. `emit`: the heart of the grave, where the light wells up;
  // `chests`: where each stream enters its soldier; `hook`: where the lantern hangs; `feet`: the shade's
  gravewarden: {
    role: 'support', element: 'spirit', facing: 'right', emit: [160, 176], hit: [95, 118],
    hook: [159, 57], feet: [95, 190], lamp: [159, 71.5], tips: [[181.6, 88], [209.6, 92], [235.9, 96], [258.6, 99.5], [279.1, 103]],
    chests: [[194.2, 134], [221.8, 134.4], [246.5, 134.6], [268.2, 135.1], [287.9, 135.4]],
    parts: [
      { name: 'sold0', of: 'fig:0', pivot: [190, 162], poly: [[175, 60], [204, 60], [204, 200], [175, 200]] },
      { name: 'sold1', of: 'fig:0', pivot: [218, 160], poly: [[204, 60], [231, 60], [231, 200], [204, 200]] },
      { name: 'sold2', of: 'fig:0', pivot: [243, 158], poly: [[231, 60], [254, 60], [254, 200], [231, 200]] },
      { name: 'sold3', of: 'fig:0', pivot: [265, 156.5], poly: [[254, 60], [275, 60], [275, 200], [254, 200]] },
      { name: 'sold4', of: 'fig:0', pivot: [285, 155], poly: [[275, 60], [300, 60], [300, 200], [275, 200]] },
      { name: 'grave', of: 'fig:1', pivot: [160, 192] },
      { name: 'cracks', of: '[data-part=cracks]', pivot: [150, 180] },
      { name: 'shade', of: 'fig:2', pivot: [95, 190] },
      { name: 'fold', of: '[data-part=fold]', pivot: [95, 190] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [95, 190] },
      { name: 'streams', of: '[data-part=streams]', pivot: [160, 176] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [159, 57] },
    ],
  },
  // Bloodbinder: the fallen knight, the vampire (her body and her reaching arm, split at her shoulder;
  // her face; the wounds on her, one set on the sleeve and one on the breast), and the stream of red
  // light running from him into her hand. `emit`: her palm, where the stream arrives and the gift
  // leaves; `shoulder`: the arm's joint; `feet`: where she stands; `chest`: where the knight is drained
  bloodbinder: {
    role: 'support', element: 'blood', facing: 'left', emit: [152, 116], hit: [194, 140],
    shoulder: [183, 103], feet: [188, 189], chest: [90, 176],
    parts: [
      { name: 'knight', of: 'fig:0', pivot: [90, 182] },
      { name: 'body', of: 'fig:1', pivot: [188, 189], poly: [[-20, -20], [320, -20], [320, 230], [-20, 230], [-20, 135], [178, 135], [178, 95], [-20, 95]] },
      { name: 'arm', of: 'fig:1', pivot: [183, 103], poly: [[-20, 95], [178, 95], [178, 135], [-20, 135]] },
      { name: 'face', of: '[data-part=face]', pivot: [188, 189] },
      { name: 'woundsB', of: '[data-part=wounds]', pivot: [188, 189], poly: [[178, 95], [320, 95], [320, 135], [178, 135]] },
      { name: 'woundsA', of: '[data-part=wounds]', pivot: [183, 103], poly: [[-20, 95], [178, 95], [178, 135], [-20, 135]] },
      { name: 'stream', of: '[data-part=stream]', pivot: [120, 140] },
    ],
  },
  // Blood Pact: the two arms clasped over the altar (the whole figure, tightening on the clasp), the
  // red thread binding the hands (its near turns) and the four candle flames. `emit`: the heart of
  // the clasp, where the thread's gift is lifted from
  'blood-pact': {
    role: 'support', element: 'blood', facing: 'front', emit: [150, 98], hit: [150, 130],
    clasp: [150, 98], flames: [[98, 142], [196, 144], [208, 150]],
    parts: [
      { name: 'arms', of: 'fig:0', pivot: [150, 98] },
      { name: 'thread', of: '[data-part=thread]', pivot: [150, 98] },
      { name: 'flames', of: '[data-part=flames]', pivot: [150, 146] },
    ],
  },
  // Wing Graft: the two great wings of spray and light (quills and drops with them), split down the
  // middle at x = 150 and each turning about its shoulder, and the woman on her rock (hair and hem
  // too), standing from her feet; the rock stays. `emit`: between the wings, where the volley of
  // feathers is flung from; `shoulders`: each wing's root
  'wing-graft': {
    role: 'attacker', element: 'water', facing: 'left', emit: [150, 104], hit: [150, 132],
    shoulders: [[143, 112], [157, 112]],
    parts: [
      { name: 'wingL', of: '[data-part=wings]', pivot: [143, 112], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [157, 112], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'her', of: 'fig:1', pivot: [150, 177] },
    ],
  },
  // Wavewarden: the merman (his tail, trident and eye), the scallop shield (shell and ribs), the little
  // creatures sheltering behind him (fish and seahorse, with the fish's eyes) and the spear of water
  // (its stream, strands, burst and drops) shattering on the shield. `guard`: where the shield takes
  // blows (its face)
  wavewarden: {
    role: 'defender', element: 'water', facing: 'left', hit: [150, 118], guard: [[108, 102], [100, 112], [95, 124], [121, 96]],
    hinge: [126, 134],
    parts: [
      { name: 'fish', of: ['fig:0', '[data-part=fisheyes]'], pivot: [225, 125] },
      { name: 'man', of: ['fig:1', '[data-part=maneye]'], pivot: [152, 150] },
      { name: 'shield', of: ['fig:2', '[data-part=ribs]'], pivot: [126, 134] },
      { name: 'spear', of: '[data-part=spear]', pivot: [108, 104] },
    ],
  },
  // Tide of Fortune: the burst of spray where the wave breaks on the rock (sheet, jets and drops),
  // the gold (pile and strewn coins, with their glints) and the broken string of pearls, each cut
  // whole. `emit`: the heart of the spray, where the gift is lifted from; `pile`: the heart of the gold
  'tide-of-fortune': {
    role: 'support', element: 'water', facing: 'right', emit: [78, 96], hit: [150, 170],
    pile: [152, 170], shell: [112, 177],
    parts: [
      { name: 'spray', of: '[data-part=spray]', pivot: [78, 114] },
      { name: 'gold', of: '[data-part=gold]', pivot: [152, 172] },
      { name: 'pearls', of: '[data-part=pearls]', pivot: [200, 182] },
    ],
  },
  // Overgrowth: the great vine and tree-trunk (with the rim of light on them), its leaves and its
  // flowers, each cut whole and swaying together from the vine's foot; the tower, the ruins and
  // the canopy stay. `sun`: where the light pours in; `flowers`: each flower's heart, as drawn
  overgrowth: {
    role: 'aura', element: 'nature', facing: 'front', hit: [130, 140],
    sun: [96, 30], foot: [127, 200],
    flowers: [[140, 182], [108, 132], [150, 92], [190, 154], [78, 102], [160, 170]],
    parts: [
      { name: 'vine', of: 'fig:1', pivot: [127, 200] },
      { name: 'leaves', of: '[data-part=leaves]', pivot: [127, 200] },
      { name: 'flowers', of: '[data-part=flowers]', pivot: [127, 200] },
    ],
  },
  // Tidecaller's Library: the glowing scrolls and books lit on the great bookcase (its three rows
  // and the rose of lights above them) as one part, and the three shoals of silver fish, each on
  // its own. `rows`: the y of each lit row; `rose`: the heart of the arc of lights; `top`: the
  // bookcase's crown, where what rises from it leaves
  'tidecallers-library': {
    role: 'aura', element: 'water', facing: 'front', hit: [150, 150],
    rows: [178, 147, 119], rose: [150, 102], top: [150, 62], shelf: [114, 186],
    parts: [
      { name: 'scrolls', of: '[data-part=scrolls]', pivot: [150, 145] },
      { name: 'shoalL', of: '[data-part=shoal]', pivot: [46, 120], poly: [[0, 90], [80, 90], [80, 150], [0, 150]] },
      { name: 'shoalR', of: '[data-part=shoal]', pivot: [238, 104], poly: [[210, 80], [300, 80], [300, 130], [210, 130]] },
      { name: 'shoalT', of: '[data-part=shoal]', pivot: [114, 47], poly: [[95, 30], [135, 30], [135, 65], [95, 65]] },
    ],
  },
  // Flood Rite: the great wave (its body, the moonlit lines and crest on it) cut from the sea
  // below the beach's edge, and rising from there; the robed figures, the back three and the
  // front four, each row from its feet; the ring of light on the sand. `guard`: where the wave
  // takes blows (on its face); `ring`: the circle's centre
  'flood-rite': {
    role: 'defender', element: 'water', facing: 'front', hit: [150, 168], guard: [[110, 62], [160, 82], [215, 106]],
    ring: [150, 178], crest: [92, 18],
    parts: [
      { name: 'wave', of: ['fig:0', '[data-part=wavefx]'], pivot: [150, 148], cut: true, poly: [[-20, -30], [320, -30], [320, 148], [-20, 148]] },
      { name: 'back', of: 'fig:1', pivot: [150, 176] },
      { name: 'front', of: 'fig:2', pivot: [150, 188] },
      { name: 'ring', of: '[data-part=ring]', pivot: [150, 178] },
    ],
  },
  // Bark Graft: the warrior with his bark pauldron (the body, the lames over his shoulder, with their
  // grain; all left of the seam at x = 182, from his feet), his raised arm (the upper arm out from the
  // seam, the fist, the elbow plate and the scales up the forearm, with their seams; it turns about
  // the seam's heart), the moss and tendrils on him, and the new leaves unfurling from the bark. `guard`: where blows land on the bark (the forearm, the elbow, the pauldron);
  // `seam`: the arm's joint; `feet`: where he stands
  'bark-graft': {
    role: 'defender', element: 'nature', facing: 'right', hit: [140, 150],
    guard: [[201, 86], [193, 112], [148, 108]], seam: [182, 111], feet: [150, 214],
    parts: [
      { name: 'him', of: ['fig:0', 'fig:1', '[data-part=bark]'], pivot: [150, 214], poly: [[-20, -20], [182, -20], [182, 230], [-20, 230]] },
      { name: 'arm', of: ['fig:0', 'fig:1', '[data-part=bark]'], pivot: [182, 111], poly: [[182, -20], [320, -20], [320, 230], [182, 230]] },
      { name: 'moss', of: '[data-part=moss]', pivot: [150, 214] },
      { name: 'leaves', of: '[data-part=leaves]', pivot: [175, 100] },
    ],
  },
  // Deep Roots: the whole tangle of roots with the glowing tips at their ends (from the trunk's foot,
  // where it meets the meadow), the young tree's stem (from its foot) and its leaves (from the crown,
  // riding the stem). `base`: the stem's foot; `crown`: where the leaves meet, where the boon leaves
  // (`emit`); `tips`: the glowing root tips (measured from the baked tips); `alone`: the meadow to
  // its right, where the boon goes when nothing is aimed at
  'deep-roots': {
    role: 'support', element: 'nature', facing: 'front', emit: [150, 26], hit: [150, 46],
    base: [150, 63], crown: [150, 32], alone: [236, 52], deep: [150, 214],
    tips: [[72.5, 128.9], [50.1, 133.1], [61.6, 140.9], [97.2, 147.1], [102.8, 140], [206.5, 134], [184.3, 130.8], [230.5, 131.2], [230.5, 136.2], [236.5, 139.9], [219.8, 143.9], [227.3, 149.3], [196.4, 156], [185.3, 159], [215.5, 156.7], [124.4, 153.6], [128.9, 154.6], [147, 157.4], [135.1, 158.1], [157.1, 155.4], [125.2, 166.8], [120.2, 167.5], [110.6, 169.6], [126, 170.4], [152.9, 171.3], [96.1, 174.1], [73.8, 159.7]],
    parts: [
      { name: 'roots', of: ['fig:1', '[data-part=tips]'], pivot: [150, 64] },
      { name: 'stem', of: 'fig:2', pivot: [150, 63] },
      { name: 'leaves', of: '[data-part=leaves]', pivot: [150, 32] },
    ],
  },
  // Thornback Archer: she (from her feet, all of her but the bow arm), the bow arm (the arm out to the
  // grip, the bow and its string; it turns about the shoulder end of the cut), the arrow in flight (it
  // fades out as she nocks the next), and the beast and the eagle above (the beast with its eyes), which
  // jolt when her arrow lands on them. `feet`: her knee on the cliff; `shoulder`: the bow arm's joint;
  // `grip`: her bow hand, where the arrow leaves (`emit`) at rest; `hand`: her string hand, drawn back past her ear;
  // `aim`: the way the bow points at rest (degrees, 0 = right, 90 = down); `alone`: the beast's jaws, her target
  'thornback-archer': {
    role: 'attacker', element: 'nature', facing: 'right', emit: [107, 94], hit: [64, 128],
    feet: [66, 182], shoulder: [83, 103], grip: [107, 94], hand: [38, 98], aim: -20, alone: [212, 44],
    parts: [
      { name: 'her', of: 'fig:4', pivot: [66, 182], poly: [[-20, -20], [83, -20], [83, 138], [320, 138], [320, 230], [-20, 230]] },
      { name: 'bow', of: 'fig:4', pivot: [83, 103], poly: [[83, -20], [320, -20], [320, 138], [83, 138]] },
      { name: 'arrow', of: '[data-part=arrow]', pivot: [150, 70] },
      { name: 'beast', of: ['fig:3', '[data-part=beasteyes]'], pivot: [262, 96] },
      { name: 'eagle', of: 'fig:2', pivot: [140, 40] },
    ],
  },
  // Sproutling: the stem (from its foot in the soil), the two leaves (the one drawing of both,
  // with its halo, split down the stem; each turns about the joint at the stem's top) and the
  // husk of its seed on the left leaf's tip (it turns with that leaf). `joint`: the stem's top,
  // where the leaves meet; `base`: its foot; `tips`: the leaf tips (left, right);
  // `alone`: the ground to its right, where its boon goes when nothing is aimed at
  'sproutling': {
    role: 'support', element: 'nature', facing: 'front', emit: [150, 88], hit: [150, 128],
    joint: [150, 95], base: [150, 156], tips: [[100, 76], [201, 72]], alone: [232, 150],
    parts: [
      { name: 'stem', of: 'fig:2 [data-part=stem]', pivot: [150, 156] },
      { name: 'leafL', of: '[data-part=leaves]', pivot: [150, 95], poly: [[60, 40], [150, 40], [150, 130], [60, 130]] },
      { name: 'leafR', of: '[data-part=leaves]', pivot: [150, 95], poly: [[150, 40], [240, 40], [240, 130], [150, 130]] },
      { name: 'husk', of: '[data-part=husk]', pivot: [150, 95] },
    ],
  },
  // Scorched Earth: the sun in the haze (from its heart), the glowing cracks in the ground (from the
  // middle of the plain), the stumps in the middle distance, the snapped trunk (from its roots) and the
  // fire smouldering inside it. `base`: the trunk's roots, where the wave of heat starts;
  // `top`: its splintered crown; `cracks`: where the cracks start, for the wave to flare as it passes;
  // `sun`: the sun's heart; `horizon`: the far edge of the plain
  'scorched-earth': {
    role: 'aura', element: 'fire', facing: 'front', hit: [150, 150],
    base: [105, 205], top: [104, 72], sun: [204, 76], horizon: 134,
    cracks: [[150, 150], [200, 160], [60, 170], [190, 188], [30, 196], [240, 146], [80, 148]],
    parts: [
      { name: 'sun', of: '[data-part=sun]', pivot: [204, 76] },
      { name: 'cracks', of: '[data-part=cracks]', pivot: [150, 165] },
      { name: 'stumps', of: '[data-part=stumps]', pivot: [150, 150] },
      { name: 'trunk', of: 'fig:0 [data-part=trunk]', pivot: [105, 214] },
      { name: 'fire', of: '[data-part=innerfire]', pivot: [105, 160] },
    ],
  },
  // Molten Core: the giant (his stone, the light of the orb on it, his cracks, socket and eyes), from
  // his feet; the cupped hands (with the lines on them) from between them; the molten orb from its heart.
  // `socket`: the hole in his chest the core is pressed into, where the fire leaves (`emit`);
  // `orb`: the orb at rest; `eyes`: his eyes; `alone`: the far right, where the fire goes when nothing is aimed at
  'molten-core': {
    role: 'attacker', element: 'earth', facing: 'front', emit: [150, 96], hit: [150, 125],
    socket: [150, 96], orb: [150, 138], eyes: [[143, 42], [157, 42]], feet: [150, 214], alone: [268, 118],
    parts: [
      { name: 'giant', of: ['fig:0 [data-part=body]', '[data-part=giantfx]'], pivot: [150, 214] },
      { name: 'hands', of: ['fig:1 [data-part=hands]', '[data-part=handlines]'], pivot: [150, 176] },
      { name: 'orb', of: '[data-part=orb]', pivot: [150, 138] },
    ],
  },
  // Ember Volley: the nine flaming arrows, each (its head, shaft and glow) turning about its own
  // head, and the one sheet of their fiery trails (from the middle of the flight).
  // `heads`: each head at rest; `angles`: the way each points (degrees, 0 = right, 90 = down);
  // `size`: each one's scale; `emit`: the middle of the volley; `alone`: the far line of spearmen
  'ember-volley': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [172, 60],
    heads: [[159.4, 60.3], [190.1, 67.7], [172.2, 47.8], [228.0, 81.6], [173.2, 88.0], [134.6, 38.2], [214.8, 52.8], [156.1, 96.5], [141.9, 28.4]], angles: [38.8, 40.7, 27.2, 39.4, 48.5, 21.5, 29.1, 44.1, 11.6], size: [1.7, 1.55, 1.6, 1, 1, 1.05, 0.9, 0.85, 0.8], alone: [232, 152],
    parts: [
      { name: 'trails', of: ['[data-part=trails]', '[data-part=cores]'], pivot: [165, 58] },
      { name: 'a0', of: ['[data-part=g0]', '[data-part=h0]', '[data-part=s0]'], pivot: [159.4, 60.3] },
      { name: 'a1', of: ['[data-part=g1]', '[data-part=h1]', '[data-part=s1]'], pivot: [190.1, 67.7] },
      { name: 'a2', of: ['[data-part=g2]', '[data-part=h2]', '[data-part=s2]'], pivot: [172.2, 47.8] },
      { name: 'a3', of: ['[data-part=g3]', '[data-part=h3]', '[data-part=s3]'], pivot: [228.0, 81.6] },
      { name: 'a4', of: ['[data-part=g4]', '[data-part=h4]', '[data-part=s4]'], pivot: [173.2, 88.0] },
      { name: 'a5', of: ['[data-part=g5]', '[data-part=h5]', '[data-part=s5]'], pivot: [134.6, 38.2] },
      { name: 'a6', of: ['[data-part=g6]', '[data-part=h6]', '[data-part=s6]'], pivot: [214.8, 52.8] },
      { name: 'a7', of: ['[data-part=g7]', '[data-part=h7]', '[data-part=s7]'], pivot: [156.1, 96.5] },
      { name: 'a8', of: ['[data-part=g8]', '[data-part=h8]', '[data-part=s8]'], pivot: [141.9, 28.4] },
    ],
  },
  // Stoke the Furnace: the smith (from his feet) with the white-hot tip of his poker, the furnace's
  // mouth (from its heart) and the fire roaring from the chimney (from its base).
  // `emit`: the chimney's top, where the fire leaves; `mouth`: the furnace's white-hot mouth;
  // `tip`: the poker's tip; `alone`: the sky to the left, where the fire goes when nothing is aimed at
  'stoke-the-furnace': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [204, 34], hit: [205, 150],
    mouth: [200, 176], tip: [198, 171], feet: [112, 193], stack: [204, 36], alone: [66, 60],
    parts: [
      { name: 'smith', of: 'fig:1', pivot: [112, 193] },
      { name: 'mouth', of: '[data-part=mouth]', pivot: [200, 176] },
      { name: 'tip', of: '[data-part=tip]', pivot: [112, 193] },
      { name: 'stack', of: '[data-part=stack]', pivot: [204, 36] },
    ],
  },
  // Bloodrage Berserker: he himself (from his feet), the arm that holds the axe, with the
  // axe (from the shoulder), the fire streaming off the blade (from the shoulder too, so it
  // swings with the axe), his wounds (with him) and the lit edge of the blade (with the axe).
  // `shoulder`: the axe arm's joint; `blade`: the blade's heart, where the fire leaves;
  // `mouth`: where he roars; `wounds`: the glowing wounds on him
  'bloodrage-berserker': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [147, 44], hit: [146, 125],
    feet: [146, 189], shoulder: [160, 113], blade: [147, 44], mouth: [143, 95], alone: [246, 150],
    wounds: [[144, 121], [147, 131], [155, 156], [118, 135], [136, 179], [142, 98]],
    parts: [
      { name: 'glow', of: '[data-part=glow]', pivot: [147, 44] },
      { name: 'fire', of: '[data-part=fire]', pivot: [160, 113] },
      { name: 'man', of: 'fig:1', pivot: [146, 189], poly: [[-20, 81], [152, 81], [161.5, 86], [161.5, 106], [166, 109], [167, 113], [164, 118], [161, 123], [200, 123], [200, 240], [-20, 240]] },
      { name: 'axe', of: 'fig:1', pivot: [160, 113], poly: [[125, 25], [170, 25], [172, 70], [175, 80], [178, 95], [177, 110], [172, 119], [165, 121], [158, 117], [154, 111], [158, 106], [161.5, 104], [161.5, 86], [154, 78], [138, 60], [125, 57]] },
      { name: 'wounds', of: '[data-part=wounds]', pivot: [146, 189] },
      { name: 'edge', of: '[data-part=edge]', pivot: [160, 113] },
    ],
  },
  // Kindling Heart: the whole cracked heart (halves, the seams burning in them and the
  // flame licking from the split) tipping about its point, where it sits in the rock.
  // `crack`: the split's heart, where its fire gathers and leaves; `tip`: its point
  'kindling-heart': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 88], hit: [150, 100],
    tip: [155, 133], crack: [150, 88], alone: [240, 150],
    parts: [
      { name: 'heart', of: '[data-part=heart]', pivot: [155, 133] },
    ],
  },
  // Gloomweb Spider: its eight legs (each from its root on the body), its fangs, the body
  // (abdomen and head, with the violet marks and its eyes), the silk it hangs by and the
  // web behind it. `thread`: where the silk is fixed (the spider swings about its lower
  // end, `hang`); `roots`: each leg's root, front pair first (left; the right mirrors them)
  'gloomweb-spider': {
    role: 'attacker', element: 'venom', facing: 'front', emit: [150, 123], hit: [150, 80],
    thread: [150, 0], hang: [150, 48], eyes: [150, 107], roots: [[145, 108], [143, 104], [143, 99], [145, 94]], web: [150, 94], alone: [208, 168],
    parts: [
      { name: 'legL0', of: 'fig:1 [data-part=legL0]', pivot: [145, 108] },
      { name: 'legR0', of: 'fig:1 [data-part=legR0]', pivot: [155, 108] },
      { name: 'legL1', of: 'fig:1 [data-part=legL1]', pivot: [143, 104] },
      { name: 'legR1', of: 'fig:1 [data-part=legR1]', pivot: [157, 104] },
      { name: 'legL2', of: 'fig:1 [data-part=legL2]', pivot: [143, 99] },
      { name: 'legR2', of: 'fig:1 [data-part=legR2]', pivot: [157, 99] },
      { name: 'legL3', of: 'fig:1 [data-part=legL3]', pivot: [145, 94] },
      { name: 'legR3', of: 'fig:1 [data-part=legR3]', pivot: [155, 94] },
      { name: 'fangs', of: 'fig:1 [data-part=fangs]', pivot: [150, 112] },
      { name: 'body', of: ['fig:1 [data-part=body]', '[data-part=marks]'], pivot: [150, 80] },
      { name: 'thread', of: '[data-part=thread]', pivot: [150, 0] },
      { name: 'web', of: '[data-part=web]', pivot: [150, 94] },
    ],
  },
  // Sky Warden: the net of light (from his hand), the far wing and the near wing (each from
  // the shoulder), the griffin (with its beak and eye and the feather at the wing's root),
  // the knight (from his seat) and his casting arm (from the shoulder). `hand`: where the
  // arm ends and the net springs from; `reach`: how far the drawn net reaches from it;
  // `heading`: the way (deg, down is 90) the drawn net points; `alone`: the net's own target
  'sky-warden': {
    role: 'attacker', element: 'light', facing: 'right', emit: [145, 111], hit: [112, 100],
    hand: [145, 111.5], shoulder: [145, 78], seat: [126, 90], wing: [117, 88], centre: [120, 98], reach: 122, heading: 49, alone: [248, 172],
    parts: [
      { name: 'net', of: '[data-part=net]', pivot: [145, 111] },
      { name: 'wingF', of: '[data-part=wingF]', pivot: [117, 88] },
      { name: 'body', of: ['fig:1 [data-part=body]', '[data-part=beak]'], pivot: [120, 98] },
      { name: 'wingN', of: 'fig:1 [data-part=wingN]', pivot: [117, 88] },
      { name: 'rider', of: 'fig:2 [data-part=rider]', pivot: [126, 90] },
      { name: 'arm', of: 'fig:2 [data-part=arm]', pivot: [145, 78] },
    ],
  },
  // The Pale Abbess: she herself (habit, veil, wimple and face, rosary, and the lavender
  // edge behind her; from her feet), her raised arm (from the shoulder) and the lantern
  // (hanging from its hook, so it can swing). `emit`: the lantern's flame, where the souls
  // gather and leave from; `lamp`: its middle; `alone`: where its souls fly when nothing
  // is aimed at; `graves`: the far graves the dead rise from
  'the-pale-abbess': {
    role: 'attacker', element: 'spirit', facing: 'right', emit: [151, 70], hit: [116, 140],
    feet: [125, 197], shoulder: [124, 92], hook: [151, 52], lamp: [151, 70], alone: [236, 104], graves: [[24, 150], [178, 150], [236, 150], [266, 152], [204, 152]],
    parts: [
      { name: 'body', of: ['[data-part=shadow]', 'fig:3 [data-part=body]', '[data-part=face]'], pivot: [125, 197] },
      { name: 'arm', of: ['[data-part=armShadow]', 'fig:3 [data-part=arm]'], pivot: [124, 92] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [151, 52] },
    ],
  },
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
  // Mycelium Bud: each of its eleven mushrooms (the stem, the cap with its rim and shade, and the
  // light under the cap with its specks), the figure and the gills split by a polygon round each,
  // about its foot in the moss, so each can bob, swell and pop up; the mound, the threads of light
  // under the moss and the ferns stay.
  // m0 is the big one in the middle, m1 and m2 the two beside it, then the little ones.
  // `caps`: each cap's centre, `bases`: each foot (both as drawn, m0..m10); `emit`: the big
  // cap's gills, where the spores leave; `alone`: the moss on its right, where its boon goes when
  // nothing is aimed at
  'mycelium-bud': {
    role: 'support', element: 'nature', facing: 'front', emit: [147, 112], hit: [148, 150],
    caps: [[145, 110], [105, 136], [194, 142], [128, 160], [210, 168], [91, 176], [76, 185], [229, 182], [169, 173], [246, 193], [58, 195]], bases: [[148, 176], [112, 180], [188, 180], [130, 182], [208, 184], [92, 188], [76, 192], [228, 190], [168, 182], [246, 198], [58, 200]], alone: [248, 190],
    parts: [
      { name: 'm0', of: ['fig:1', '[data-part=gills]'], pivot: [148, 176], poly: [[155.8, 125.2], [164.4, 121.9], [171.1, 117.4], [175.2, 111.9], [176.3, 106.1], [174.4, 100.5], [169.5, 95.7], [162.3, 92.1], [153.4, 90.1], [143.6, 89.8], [133.9, 91.4], [125.4, 94.7], [118.7, 99.2], [114.6, 104.7], [113.5, 110.5], [115.4, 116.1], [120.2, 120.9], [127.5, 124.5], [138.8, 126.6], [141.1, 177.3], [154.9, 176.7], [152.6, 125.7]] },
      { name: 'm1', of: ['fig:1', '[data-part=gills]'], pivot: [112, 180], poly: [[111.7, 145.7], [119.4, 141.7], [123.4, 137.9], [125.5, 133.7], [125.6, 129.7], [123.6, 126.2], [119.8, 123.6], [114.5, 122.1], [108.3, 121.8], [101.7, 122.8], [95.4, 125.0], [90.0, 128.2], [86.1, 132.0], [84.0, 136.1], [83.9, 140.1], [85.8, 143.6], [89.6, 146.3], [94.9, 147.8], [101.7, 148.0], [107.0, 181.8], [117.0, 180.2]] },
      { name: 'm2', of: ['fig:1', '[data-part=gills]'], pivot: [188, 180], poly: [[197.0, 152.4], [203.0, 152.0], [207.5, 150.5], [210.7, 148.1], [212.3, 144.9], [212.1, 141.4], [210.2, 137.9], [206.7, 134.6], [202.0, 132.0], [196.5, 130.3], [190.8, 129.6], [185.4, 130.1], [180.9, 131.6], [177.7, 134.1], [176.1, 137.2], [176.3, 140.7], [178.2, 144.3], [181.7, 147.5], [188.1, 150.6], [183.5, 180.3], [192.5, 181.7]] },
      { name: 'm3', of: ['fig:1', '[data-part=gills]'], pivot: [130, 182], poly: [[131.8, 166.1], [135.5, 164.5], [137.7, 162.5], [139.1, 160.2], [139.3, 157.8], [138.4, 155.6], [136.5, 153.7], [133.8, 152.5], [130.4, 151.8], [123.4, 152.8], [120.4, 154.3], [118.1, 156.3], [116.8, 158.6], [116.5, 161.0], [117.4, 163.2], [119.3, 165.1], [122.1, 166.4], [125.3, 166.9], [126.7, 183.3], [133.3, 182.7]] },
      { name: 'm4', of: ['fig:1', '[data-part=gills]'], pivot: [208, 184], poly: [[214.5, 173.8], [218.5, 171.4], [219.4, 169.5], [219.4, 167.4], [216.7, 163.5], [211.5, 161.2], [208.5, 160.9], [203.4, 162.2], [201.7, 163.7], [200.8, 165.5], [200.8, 167.6], [201.8, 169.7], [203.5, 171.5], [206.4, 173.1], [205.1, 184.7], [210.9, 185.3], [212.2, 174.1]] },
      { name: 'm5', of: ['fig:1', '[data-part=gills]'], pivot: [92, 188], poly: [[94.1, 180.0], [96.0, 178.9], [98.2, 176.0], [97.7, 172.9], [96.4, 171.6], [92.4, 170.5], [90.1, 170.6], [85.9, 172.3], [84.4, 173.7], [83.6, 175.3], [84.2, 178.4], [85.5, 179.7], [88.8, 180.7], [89.4, 189.2], [94.6, 188.8]] },
      { name: 'm6', of: ['fig:1', '[data-part=gills]'], pivot: [76, 192], poly: [[79.6, 187.6], [81.3, 185.3], [81.4, 184.0], [81.0, 182.8], [78.7, 181.0], [73.7, 181.1], [72.3, 181.9], [70.6, 184.2], [71.0, 186.7], [73.8, 188.6], [73.8, 193.0], [78.2, 193.0], [78.2, 188.4]] },
      { name: 'm7', of: ['fig:1', '[data-part=gills]'], pivot: [228, 190], poly: [[230.9, 185.9], [234.4, 183.8], [234.9, 182.5], [234.8, 181.2], [233.0, 178.8], [229.6, 177.5], [227.8, 177.4], [224.7, 178.6], [223.7, 179.6], [223.3, 182.3], [224.0, 183.6], [226.3, 185.3], [225.7, 190.7], [230.3, 191.3]] },
      { name: 'm8', of: ['fig:1', '[data-part=gills]'], pivot: [168, 182], poly: [[170.9, 176.9], [173.5, 175.7], [174.9, 173.3], [174.7, 172.0], [172.8, 169.6], [169.5, 168.4], [167.6, 168.5], [164.5, 169.7], [163.6, 170.8], [163.3, 173.5], [164.0, 174.7], [166.4, 176.4], [165.7, 182.8], [170.3, 183.2]] },
      { name: 'm9', of: ['fig:1', '[data-part=gills]'], pivot: [246, 198], poly: [[248.4, 195.9], [249.4, 195.2], [250.5, 193.3], [249.9, 191.1], [248.9, 190.3], [245.0, 189.3], [242.6, 190.4], [241.9, 191.3], [241.7, 193.4], [244.0, 195.8], [244.0, 199.0], [248.0, 199.0]] },
      { name: 'm10', of: ['fig:1', '[data-part=gills]'], pivot: [58, 200], poly: [[60.0, 197.8], [62.3, 195.4], [62.5, 194.3], [61.4, 192.4], [60.3, 191.7], [56.2, 191.6], [54.1, 193.1], [53.5, 195.3], [54.6, 197.2], [56.0, 198.0], [56.0, 201.0], [60.0, 201.0]] },
    ],
  },
  // Rootmother: the tree-woman (her trunk, head and arms, with the bark lines on her) cut from her
  // roots; her hair of roots (the same drawing, split off above and behind the head, about the back
  // of her head); the stag (its body, and its head with neck and antlers split off about the
  // neck's root); the vines wound round it and the green light of its wounds closing, each cut
  // from where it lies. `hands`: her fingertips, where the healing leaves her (`emit`); `feet`: her
  // roots; `wound`: where the stag's wounds close (its own target, `alone`); `vine`: the two vines
  // from her fingers to the wounds, for the light to run along
  'rootmother': {
    role: 'support', element: 'nature', facing: 'right', emit: [192, 142], hit: [112, 140],
    hands: [[192, 139], [193, 149]], feet: [108, 188], alone: [226, 168],
    vine: [[[186, 132], [194, 128], [202, 134], [192, 142], [204, 150], [196, 158], [212, 162], [226, 160], [240, 164]], [[186, 146], [196, 154], [206, 162], [214, 172], [226, 176], [238, 178]]],
    parts: [
      { name: 'stag', of: 'fig:0', pivot: [226, 186], poly: [[0, 150], [300, 150], [300, 210], [0, 210]] },
      { name: 'head', of: 'fig:0', pivot: [206, 158], poly: [[150, 0], [300, 0], [300, 152], [150, 152]] },
      { name: 'her', of: ['fig:1', '[data-part=bark]'], pivot: [108, 188], poly: [[151, 0], [300, 0], [300, 210], [0, 210], [0, 115], [106, 115], [106, 104], [109, 88], [117, 75], [127, 63], [132, 56], [149, 53]] },
      { name: 'hair', of: ['fig:1', '[data-part=bark]'], pivot: [130, 60], poly: [[0, 0], [150, 0], [150, 54], [133, 57], [128, 64], [118, 76], [110, 88], [107, 104], [107, 116], [0, 116]] },
      { name: 'vines', of: '[data-part=vines]', pivot: [200, 150] },
      { name: 'wounds', of: '[data-part=wounds]', pivot: [226, 170] },
    ],
  },
  // ── end of lane B ──
};
