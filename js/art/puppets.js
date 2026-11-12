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
  // wild growth (a spell, a support: a creature gets +2/+2): the vines whipping out from under
  // the wolf, the left three and the right three (split at the wolf's middle, behind it), the
  // wolf itself with the bark on its back, and the buds glowing at the vines' tips (left, right,
  // each with its vines); `emit`: the ground under the wolf, where the growth wells up and
  // leaves from, `hit`: the wolf's chest, where its own boon lands, `tips`: the six vine-tips
  'wild-growth': {
    role: 'support', element: 'nature', facing: 'front', emit: [152, 168], hit: [160, 125],
    feet: [160, 172], rootL: [124, 152], rootR: [176, 142], chest: [160, 125],
    tips: [[40, 70], [104, 30], [198, 28], [262, 62], [284, 122], [22, 134]],
    parts: [
      { name: 'vinesL', of: 'fig:0', pivot: [124, 152], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'vinesR', of: 'fig:0', pivot: [176, 142], poly: [[150, -20], [330, -20], [330, 230], [150, 230]] },
      { name: 'wolf', of: ['fig:1', '[data-part=bark]'], pivot: [160, 172] },
      { name: 'tipsL', of: '[data-part=tips]', pivot: [124, 152], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'tipsR', of: '[data-part=tips]', pivot: [176, 142], poly: [[150, -20], [330, -20], [330, 230], [150, 230]] },
    ],
  },
  // the seedling: its bean body (with the husk cap and eyes), its two leaf-arms from the
  // shoulders, the shoot on its head (with its glowing leaf), each about its joint, and the
  // lip of soil in front of it (and the clods) over all; `emit`: the shoot's tip, where its
  // boon is gathered and leaves, `feet`: where it sits in the soil
  'seedling': {
    role: 'support', element: 'nature', facing: 'front', emit: [167, 85], hit: [150, 140],
    feet: [150, 168], shoot: [153, 106], shoulderL: [134, 134], shoulderR: [166, 140], handL: [96, 98], handR: [208, 152], eyes: [[143, 131], [157.5, 130]],
    parts: [
      { name: 'body', of: 'fig:0', pivot: [150, 168], poly: [[126, 106], [172, 106], [172, 172], [126, 172]] },
      { name: 'face', of: '[data-part=face]', pivot: [150, 168] },
      { name: 'armL', of: 'fig:0', pivot: [134, 134], poly: [[80, 80], [136, 80], [136, 142], [80, 142]] },
      { name: 'armR', of: 'fig:0', pivot: [166, 140], poly: [[164, 130], [222, 130], [222, 168], [164, 168]] },
      { name: 'sprout', of: 'fig:0', pivot: [153, 106], poly: [[146, 66], [186, 66], [186, 110], [146, 110]] },
      { name: 'tip', of: '[data-part=sproutleaf]', pivot: [153, 106], poly: [[150, 70], [186, 70], [186, 100], [150, 100]], cut: true },
      { name: 'lip', of: ['fig:1', '[data-part=clods]'], pivot: [150, 172] },
    ],
  },
  // the mountain's wrath (a spell, an attacker: the eruption is the attack): the mountain,
  // its face (eyes, mouth and the lava running down) and the column of lava out of the
  // crater; `emit`: the crater's mouth, where the bombs leave, `crater`: its lip,
  // `base`: where the mountain turns about its foot, `village`: where its own fire falls
  'the-mountain-is-angry': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 58], hit: [150, 118],
    crater: [150, 68], base: [150, 184], village: [78, 178], eyes: [[132, 92], [169, 92]], mouth: [150, 120],
    parts: [
      { name: 'mountain', of: 'fig:0', pivot: [150, 184] },
      { name: 'face', of: '[data-part=face]', pivot: [150, 184] },
      { name: 'eruption', of: '[data-part=eruption]', pivot: [150, 72] },
    ],
  },
  // the initiate: his body (robe, legs, arms), the spear sliding through his hands, his
  // streaming hair, the front of him (face, hands) and the torch's blade and flame, each
  // about its joint; `emit`: the torch's tip, `hand`: the rear hand the spear is levelled from
  'reckless-initiate': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [246, 66], hit: [165, 100],
    feet: [150, 158], hand: [161, 110], head: [178, 72], torch: [239, 73], axis: [0.894, -0.453],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [150, 158] },
      { name: 'spear', of: 'fig:0 [data-part=spear]', pivot: [161, 110] },
      { name: 'hair', of: 'fig:0 [data-part=hair]', pivot: [178, 72] },
      { name: 'front', of: 'fig:0 [data-part=front]', pivot: [150, 158] },
      { name: 'tip', of: 'fig:0 [data-part=tip]', pivot: [161, 110] },
      { name: 'flame', of: '[data-part=flame]', pivot: [239, 73] },
    ],
  },
  // the spark runner: the streak and the fire off its shoulders (under it), its hind legs,
  // tail, forelegs, ears and body (neck, trunk, head), each about its joint, and its
  // crackling veins (and eye) over all; `emit`: its muzzle, `feet`: where it turns about
  'spark-runner': {
    role: 'attacker', element: 'lightning', facing: 'left', emit: [62, 93], hit: [135, 108],
    feet: [140, 140], mid: 140, muzzle: [62, 93],
    parts: [
      { name: 'trail', of: '[data-part=trail]', pivot: [172, 106] },
      { name: 'mane', of: '[data-part=mane]', pivot: [100, 94] },
      { name: 'hind', of: 'fig:0 [data-part=hind]', pivot: [170, 108] },
      { name: 'tail', of: 'fig:0 [data-part=tail]', pivot: [182, 104] },
      { name: 'fore', of: 'fig:0 [data-part=fore]', pivot: [108, 118] },
      { name: 'ears', of: 'fig:0 [data-part=ears]', pivot: [88, 84] },
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [140, 140] },
      { name: 'veins', of: '[data-part=veins]', pivot: [140, 140] },
    ],
  },
  // the feeding of the fire (a spell, an attacker: its fire is the attack): the flames
  // (outer tongues, inner tongues, white heart) each from their base, the brazier, the
  // hooded feeder from his feet, his arms (with the hands) from the shoulder, and the
  // shadow-creature he feeds it (and its eyes); `emit`: the top of the flames, where the
  // blast leaves, `base`: the fire's base, `bowl`: the brazier's mouth, `held`: the thing
  // as it's held, `grip`: where the hands hold it, `shoulder`: where the arms turn
  'feed-the-flame': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [200, 30], hit: [198, 140],
    base: [200, 130], bowl: [198, 127], held: [183, 100], grip: [170, 88], shoulder: [126, 102], feet: [115, 187],
    parts: [
      { name: 'fireA', of: '[data-part=fireA]', pivot: [200, 130] },
      { name: 'fireB', of: '[data-part=fireB]', pivot: [200, 130] },
      { name: 'fireC', of: '[data-part=fireC]', pivot: [200, 130] },
      { name: 'brazier', of: ['fig:0', '[data-part=lip]'], pivot: [198, 187] },
      { name: 'man', of: 'fig:1 [data-part=man]', pivot: [115, 187] },
      { name: 'arms', of: 'fig:1 [data-part=arms]', pivot: [126, 102] },
      { name: 'thing', of: 'fig:2', pivot: [183, 100] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [183, 100] },
    ],
  },
  // the imp: each wing (membrane and its bones) at its shoulder, the tail at its
  // root, and the imp himself (body, horns, glowing face) crouched from his feet
  cinderling: {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 128], hit: [150, 148],
    mouth: [150, 128], feet: [150, 168], shoulders: [[141, 138], [159, 138]],
    parts: [
      { name: 'wingL', of: ['fig:1 [data-part=wingL]', '[data-part=boneL]'], pivot: [141, 138] },
      { name: 'wingR', of: ['fig:1 [data-part=wingR]', '[data-part=boneR]'], pivot: [159, 138] },
      { name: 'tail', of: 'fig:2 [data-part=tail]', pivot: [166, 160] },
      { name: 'imp', of: ['fig:2 [data-part=body]', '[data-part=face]'], pivot: [150, 168] },
    ],
  },
  // the gardener: the rabbit (and the glint in his eye) from his feet, his ears
  // from the top of his head, and his arm with the copper can from the shoulder;
  // `spout`: the can's mouth as drawn, `sprout`: what he waters, `mid`: the line
  // he turns about when he faces the other way
  'little-gardener': {
    role: 'support', element: 'nature', facing: 'left', emit: [117, 142], hit: [184, 150],
    spout: [117, 142], sprout: [106, 160], shoulder: [177, 142], feet: [182, 173], mid: 183,
    parts: [
      { name: 'body', of: ['fig:0 [data-part=body]', '[data-part=eye]'], pivot: [182, 173] },
      { name: 'ears', of: 'fig:0 [data-part=ears]', pivot: [181, 114] },
      { name: 'arm', of: 'fig:0 [data-part=arm]', pivot: [177, 142] },
    ],
  },
  // the kiln (an aura: the place itself acts): the white-hot arch of its mouth
  // and the flames standing in it, each about its base;
  // `mouth`: its mouth's middle, `vent`: the chimney's opening, souls rise from there
  'the-kiln': {
    role: 'aura', element: 'spirit', facing: 'front', hit: [150, 130],
    mouth: [150, 175], base: [150, 187], vent: [150, 65],
    parts: [
      { name: 'mouth', of: '[data-part=mouth]', pivot: [150, 187] },
      { name: 'flames', of: '[data-part=flames]', pivot: [150, 187] },
    ],
  },
  // the ash collector: him (coat, hat, legs, the lamp's pole) from his feet, his arms with the
  // pole and the besom from the shoulder (they sweep together), and the ash-lantern from the
  // pole's tip; `emit`: the besom's head, where the swept ash leaves, `grip`: his hands on the pole
  'ash-collector': {
    role: 'attacker', element: 'fire', facing: 'left', emit: [84, 184], hit: [160, 125],
    feet: [160, 186], shoulder: [144, 99], lamp: [114, 62], tip: [114, 44], grip: [[141, 126], [121, 148]], heap: [62, 184],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [160, 186] },
      { name: 'sweep', of: 'fig:0 [data-part=sweep]', pivot: [144, 99] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [114, 44] },
    ],
  },
  // the wildfire (a spell, an attacker: the wall of fire is the attack): the far wall of
  // flames and the near one, each from its base (the pines between them are cut too, so
  // the far wall doesn't cover them), and the things running before it, each about its
  // feet: the deer, the two birds, the soldiers and the fox; `emit`: the wall's heart,
  // where the surge leaves, `front`: the line along the hill's crest the fire runs on
  wildfire: {
    role: 'attacker', element: 'fire', facing: 'right', emit: [150, 112], hit: [150, 125],
    front: 146, base: [150, 146],
    parts: [
      { name: 'wallA', of: '[data-part=wallA]', pivot: [150, 142] },
      { name: 'pines', of: '[data-part=pines]', pivot: [150, 146] },
      { name: 'wallB', of: '[data-part=wallB]', pivot: [150, 146] },
      { name: 'deer', of: 'fig:1 [data-part=deer]', pivot: [140, 126] },
      { name: 'birds', of: 'fig:1 [data-part=birds]', pivot: [238, 100] },
      { name: 'soldierL', of: 'fig:1 [data-part=soldierL]', pivot: [56, 149] },
      { name: 'soldierR', of: 'fig:1 [data-part=soldierR]', pivot: [236, 160] },
      { name: 'fox', of: 'fig:1 [data-part=fox]', pivot: [196, 157] },
    ],
  },
  // the phoenix (rising from its ember): each wing with the fire running along it, at its
  // shoulder, the tail (and its fire) from its root, and the bird himself (head, body, eye)
  // from the base of his body; `emit`: his beak's tip, where the fireball leaves,
  // `shoulders`: where the wings turn, `tips`: the wings' outer tips, `ember`: the last spark
  'phoenix-of-the-last-spark': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [177, 59], hit: [150, 100],
    shoulders: [[142, 90], [158, 90]], tips: [[42, 14], [258, 14]], ember: [150, 182], feet: [150, 176],
    parts: [
      { name: 'wingL', of: ['fig:0 [data-part=wingL]', '[data-part=fireL]'], pivot: [142, 90] },
      { name: 'wingR', of: ['fig:0 [data-part=wingR]', '[data-part=fireR]'], pivot: [158, 90] },
      { name: 'tail', of: ['fig:0 [data-part=tail]', '[data-part=fireT]'], pivot: [150, 124] },
      { name: 'body', of: ['fig:0 [data-part=body]', '[data-part=eye]'], pivot: [150, 128] },
    ],
  },
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
  // ── end of lane B ──
};
