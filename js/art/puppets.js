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
  // Wild Bloom (a Trick that doubles a creature's Power and Vitality for the turn: a boon, a support: a little fern bursts in an
  // instant into a towering flowering plant; its spring is the boon, so the plant crouches, the bloom closes to a bud and
  // flings open, and the burst of petals and light goes out to the creature): the stalk with its leaves, tendrils and the ferns
  // at its foot (the whole plant figure, turning about its foot) and the great flower with its two side buds (turning about its
  // heart, riding the stalk's top); `emit`: the flower's heart where the burst leaves, `hit`: the stalk's middle, `foot`: where
  // the plant stands, `ground`: the ground to the right (the target when alone)
  'wild-bloom': {
    role: 'support', element: 'nature', facing: 'front', emit: [150, 62], hit: [150, 140], foot: [150, 196], ground: [236, 168],
    parts: [
      { name: 'stalk', of: 'fig:0', pivot: [150, 196] },
      { name: 'bloom', of: '[data-part=bloom]', pivot: [150, 62] },
    ],
  },
  // Lantern Ferryman (a Shade creature, a support: a hooded ferryman poling a narrow boat across a dark river, a lantern at the bow and
  // a pale spirit rising from the wake; whenever a friend dies he makes a spirit, so his gift is a spirit sent out from the lantern
  // to a friend): the hull (with the line along its side), the ferryman with his arms (turning about his hips) and his glowing
  // eyes, the pole (turning about its foot in the water) and the rings round that foot, the lantern (swinging from its hook,
  // with its halo) and the spirit in the wake (rising from its tail); `emit`: the lantern, where the spirit leaves,
  // `hit`: his chest, `hips`: where he leans about, `hook`: the lantern's hook, `foot`: the pole's foot, `wake`: the spirit's tail
  // in the water, `river`: the water ahead of the bow (the target when alone)
  'lantern-ferryman': {
    role: 'support', element: 'spirit', facing: 'right', emit: [249, 126], hit: [116, 108],
    hips: [112, 152], hook: [249, 112], foot: [98.6, 177], wake: [44, 172], river: [272, 172], boat: [150, 158],
    parts: [
      { name: 'hull', of: ['fig:0 [data-part=hull]', '[data-part=hullline]'], pivot: [150, 158] },
      { name: 'man', of: 'fig:0 [data-part=man]', pivot: [112, 152] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [112, 152] },
      { name: 'pole', of: 'fig:0 [data-part=pole]', pivot: [98.6, 177] },
      { name: 'footrings', of: '[data-part=footrings]', pivot: [99, 177] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [249, 112] },
      { name: 'ghost', of: '[data-part=ghost]', pivot: [44, 172] },
    ],
  },
  // Season of Plenty (a Relic, an aura: the orchard itself acts; what has been strengthened keeps growing, so the young tree
  // in the middle swells and its light spills out over the rows): the great low sun (disc and its inner glow) and the shafts
  // fanning from it, the young tree (whole figure) and its crown of glowing leaves (both turning about the foot, so they grow
  // together), and the fruit hanging on the two old trees; `emit`: the heart of the crown where the growth begins, `hit`: the
  // young tree's middle, `sun`: the sun's middle, `foot`: where the young tree stands, `orchard`: the far rows (the target when alone)
  'season-of-plenty': {
    role: 'aura', element: 'nature', facing: 'front', emit: [150, 122], hit: [150, 150], sun: [150, 82], foot: [150, 184], orchard: [150, 120],
    parts: [
      { name: 'shafts', of: '[data-part=shafts]', pivot: [150, 82] },
      { name: 'sun', of: '[data-part=sun]', pivot: [150, 82] },
      { name: 'young', of: 'fig:0', pivot: [150, 184] },
      { name: 'crown', of: '[data-part=crown]', pivot: [150, 184] },
      { name: 'fruit', of: '[data-part=fruit]', pivot: [150, 40] },
    ],
  },
  // Ripple (a Spell that draws a card and discounts the next Spell: a boon, a support: the drop falls and the pond answers
  // with rings of light that run out to the reeds): the eight rings on the water, the drop with the thread of light above
  // it and the dot where it lands, the lily pads riding the rings, the reeds on each side (turning about their feet,
  // each cut whole because they are drawn over the rings) and the branch with its leaves (the drop's source); `emit`: the
  // leaf's tip where the drop forms, `hit`: where the drop lands, `pool`: the middle of the rings, `rim`: where the
  // rings reach the reeds on the right (the target when alone)
  'ripple': {
    role: 'support', element: 'water', facing: 'front', emit: [150, 40], hit: [150, 142], pool: [150, 142], rim: [256, 150],
    parts: [
      { name: 'rings', of: '[data-part=rings]', pivot: [150, 142] },
      { name: 'drop', of: '[data-part=drop]', pivot: [150, 127] },
      { name: 'pads', of: 'fig:0', pivot: [150, 150] },
      { name: 'reedsL', of: 'fig:1', pivot: [24, 166] },
      { name: 'reedsR', of: 'fig:2', pivot: [285, 164] },
      { name: 'branch', of: 'fig:3', pivot: [-4, 10] },
    ],
  },
  // Crescendo (a Spell that deals damage by the Spells played this turn: the fire mage is the spell, an attacker: she
  // conducts the spiral up and hurls its fire): her two raised arms (each cut from her figure, turning about its
  // shoulder), the spiral's runs in front of her (with the white-hot ring at its end; the runs behind her stay in the picture, since parts lie over her);
  // `emit`: the ring's end, where the fire gathers and leaves, `hit`: her chest, `ring`: the ring's middle, `feet`:
  // the ground she stands on
  'crescendo': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 52], hit: [150, 140], ring: [150, 52], feet: [150, 188],
    shoulderL: [140, 107], shoulderR: [160, 107],
    parts: [
      { name: 'armL', of: 'fig:0', pivot: [140, 107], poly: [[114, 66], [129, 66], [130, 82], [135, 92], [141, 102], [141, 113], [133, 113], [127, 103], [114, 90]], cut: true, joint: 4 },
      { name: 'armR', of: 'fig:0', pivot: [160, 107], poly: [[171, 66], [190, 66], [190, 92], [172, 108], [160, 113], [158, 106], [166, 95], [171, 80]], cut: true, joint: 4 },
      { name: 'spiralF', of: '[data-part=spiralF]', pivot: [150, 186] },
    ],
  },
  // Dawnsinger (a 2/3 that drains a life whenever you make a Spirit; the picture is her song, a ribbon of light arcing from her
  // mouth to the sunrise with tiny winged spirits riding it, so a support: her boon is the spirits): her head thrown back
  // in song (with the streaming hair, nodding about the neck) and each open arm (turning about its shoulder), each cut
  // from her one figure; `emit`: her mouth where the song leaves, `hit`: her chest, `sun`: the half-risen sun where the
  // song ends (the target when alone)
  'dawnsinger': {
    role: 'support', element: 'spirit', facing: 'right', emit: [95, 66], hit: [100, 128], sun: [238, 128],
    neck: [93, 89], shoulderL: [90, 93], shoulderR: [95, 93],
    parts: [
      { name: 'head', of: 'fig:0', pivot: [93, 89], poly: [[43, 58], [112, 58], [112, 88], [44, 88]], cut: true, joint: 4 },
      { name: 'armL', of: 'fig:0', pivot: [90, 93], poly: [[54, 98], [88, 84], [93, 92], [92, 108], [70, 118], [54, 116]], cut: true, joint: 4 },
      { name: 'armR', of: 'fig:0', pivot: [95, 93], poly: [[95, 86], [102, 88], [126, 102], [126, 118], [110, 118], [97, 105]], cut: true, joint: 4 },
    ],
  },
  // The Bright Choir (a Relic, an aura: the place itself acts; whenever you make Spirits, make that many more, so the spirits
  // its song wakes split in two as they climb): the pool of light on the floor, the column of song and the shafts of dawn
  // falling on the ring, and the four rows of spirits (one, two, four, eight: each row's glows, and for the upper three the
  // trails streaming up to it from the row below), each cut so the move can hide them and bring them back as they split;
  // `emit`: the first spirit, where the song begins to split, `hit`: the middle of the ring, `levels`: where each spirit of
  // each row hangs at rest (row 0 is the first), `singers`: the singers' heads, where the song rises from
  'the-bright-choir': {
    role: 'aura', element: 'spirit', facing: 'front', emit: [150, 100], hit: [150, 140],
    levels: [[[150, 102]], [[124.0, 79.5], [176.0, 76.5]], [[97.0, 56.5], [132.3, 53.5], [167.7, 56.5], [203.0, 53.5]], [[72.0, 33.5], [94.3, 30.5], [116.6, 33.5], [138.9, 30.5], [161.1, 33.5], [183.4, 30.5], [205.7, 33.5], [228.0, 30.5]]], singers: [[104, 112], [196, 112], [70, 114], [230, 114], [126, 123], [174, 123]],
    parts: [
      { name: 'floor', of: '[data-part=floor]', pivot: [150, 172] },
      { name: 'column', of: '[data-part=column]', pivot: [150, 182] },
      { name: 'beams', of: '[data-part=beams]', pivot: [150, 150] },
      { name: 'glow0', of: '[data-part=glow0]', pivot: [150, 102] },
      { name: 'glow1', of: '[data-part=glow1]', pivot: [150, 78] },
      { name: 'glow2', of: '[data-part=glow2]', pivot: [150, 55] },
      { name: 'glow3', of: '[data-part=glow3]', pivot: [150, 32] },
      { name: 'tail1', of: '[data-part=tail1]', pivot: [150, 78] },
      { name: 'tail2', of: '[data-part=tail2]', pivot: [150, 55] },
      { name: 'tail3', of: '[data-part=tail3]', pivot: [150, 32] },
    ],
  },

  // Nim, the Tidecaller (a Champion creature, a support: a slender sea-mage on a rock in the surf, one hand raised to a great wave
  // full of glowing scrolls and silver fish; her text is drawing extra cards, so her move is the gift: she sweeps her hand
  // and the wave pours its scrolls and fish out in a stream to a friend): her raised arm (cut at the shoulder), the light in
  // her hand (no longer a breathing ambient glow: it rides the hand), her other arm held out low, her streaming hair, the
  // flare of her hem, the wave's five scrolls (scroll0-4) and nine fish (fish0-8), each its own part which leaves the wave
  // when it flies; `emit`: her raised hand, where the gift leaves from, `hit`: her chest, `shoulder`: where the arm turns,
  // `hand`: the hand at rest, `shoulderL`: where the low arm turns, `hair`/`hem`: where her hair and hem start, `scrolls`/`fish`:
  // where each rests in the wave, `sea`: the surf in front of the wave's curl (the target when alone)
  'champion-tide': {
    role: 'support', element: 'water', facing: 'front', emit: [168.4, 37.2], hit: [153, 110],
    shoulder: [154.4, 80], hand: [168.4, 37.2], shoulderL: [147, 82], hair: [146, 63], hem: [134, 138], sea: [258, 148],
    scrolls: [[66, 122], [104, 92], [204, 54], [236, 104], [176, 112]], fish: [[46, 136], [60, 128], [132, 70], [146, 82], [218, 80], [250, 92], [196, 128], [214, 138], [90, 112]],
    parts: [
      { name: 'arm', of: 'fig:2', pivot: [154.4, 80], poly: [[152, 86], [164, 90], [180, 40], [180, 22], [160, 22], [160.2, 50], [158.6, 66]], cut: true, joint: 4 },
      { name: 'handlight', of: '[data-part=handlight]', pivot: [154.4, 80] },
      { name: 'armL', of: 'fig:2', pivot: [147, 82], poly: [[116, 90], [116, 104], [146, 104], [146, 76], [134, 76]], cut: true, joint: 4 },
      { name: 'hair', of: 'fig:2', pivot: [146, 63], poly: [[98, 50], [146, 50], [146, 76], [98, 76]], cut: true, joint: 3 },
      { name: 'hem', of: 'fig:2', pivot: [134, 138], poly: [[108, 118], [134, 118], [134, 150], [108, 150]], cut: true, joint: 3 },
      { name: 'scroll0', of: '[data-part=scroll0]', pivot: [66, 122] },
      { name: 'scroll1', of: '[data-part=scroll1]', pivot: [104, 92] },
      { name: 'scroll2', of: '[data-part=scroll2]', pivot: [204, 54] },
      { name: 'scroll3', of: '[data-part=scroll3]', pivot: [236, 104] },
      { name: 'scroll4', of: '[data-part=scroll4]', pivot: [176, 112] },
      { name: 'fish0', of: '[data-part=fish0]', pivot: [46, 136] },
      { name: 'fish1', of: '[data-part=fish1]', pivot: [60, 128] },
      { name: 'fish2', of: '[data-part=fish2]', pivot: [132, 70] },
      { name: 'fish3', of: '[data-part=fish3]', pivot: [146, 82] },
      { name: 'fish4', of: '[data-part=fish4]', pivot: [218, 80] },
      { name: 'fish5', of: '[data-part=fish5]', pivot: [250, 92] },
      { name: 'fish6', of: '[data-part=fish6]', pivot: [196, 128] },
      { name: 'fish7', of: '[data-part=fish7]', pivot: [214, 138] },
      { name: 'fish8', of: '[data-part=fish8]', pivot: [90, 112] },
    ],
  },

  // Morwen, the Gravekeeper (a Champion creature, a defender: a cloaked woman bent over the grip of her long spade among the graves,
  // her faint violet dead rising behind her; she is the keeper that is hard to move, so she plants the spade and the dead rise
  // to take the blows): her figure without the spade's lower shaft (cloak, hood, hands, the grip), and the spade below her hands
  // (shaft and blade); `hit`: her cloak's middle, `guard`: where blows land when she blocks (the cloak's front and the spade),
  // `feet`: where she stands (she settles and leans about them), `blade`: the spade's tip, where it strikes the ground,
  // `grip`: the top of the spade under her hands (the spade turns about the point just under it), `graves`: where her dead
  // rise from (the six wisps of the drawing: they keep their own drifting; a ward of light is laid over each)
  'champion-umbral': {
    role: 'defender', element: 'spirit', facing: 'right', hit: [128, 140],
    guard: [[152, 120], [150, 150], [164, 140], [164, 176], [146, 98]],
    feet: [136, 195], blade: [164, 197], grip: [163, 112],
    graves: [[49, 98], [80, 92], [202, 94], [227, 86], [272, 100], [15, 104]],
    parts: [
      { name: 'body', of: 'fig:1', pivot: [136, 195], poly: [[-10, -10], [310, -10], [310, 220], [176, 220], [176, 112], [156, 112], [156, 220], [-10, 220]] },
      { name: 'spade', of: 'fig:1', pivot: [163, 112], poly: [[156, 112], [176, 112], [176, 220], [156, 220]] },
    ],
  },

  // Old Root, Grove Warden (a Champion creature, a defender: a tree-giant standing guard with a shield of woven roots on his
  // arm; Reach and a great deal of Vitality, so he is the wall: he plants himself and takes the blows on the shield): the
  // body (everything of him from the crown's base down: trunk, arms, legs, staff, and the bark seams and the carved
  // face that ride on it, with the glow of his eyes), the crown of branches and leaves (cut at the head's top), the shield
  // (its disc, the woven roots over it and the green bud at its boss); `hit`: his chest, `guard`: the shield's face and
  // rim, where blows land when he blocks, `shield`: the shield's centre (it jolts about it), `feet`: where he stands
  // (his body leans and settles about them), `crown`: where the crown turns, `eyes`: his eyes, `bud`: the bud on the
  // shield's boss
  'champion-verdant': {
    role: 'defender', element: 'nature', facing: 'front', hit: [150, 120],
    guard: [[199, 128], [192, 108], [192, 148], [172, 101], [172, 155], [172, 128]],
    shield: [172, 128], feet: [150, 197], crown: [150, 72], eyes: [[144.5, 82], [155.5, 82]], bud: [172, 130],
    parts: [
      { name: 'body', of: 'fig:0', pivot: [150, 197], poly: [[-10, 70], [310, 70], [310, 220], [-10, 220]] },
      { name: 'crown', of: 'fig:0', pivot: [150, 72], poly: [[-10, -10], [310, -10], [310, 73], [-10, 73]] },
      { name: 'face', of: '[data-part=face]', pivot: [150, 197] },
      { name: 'eyeglow', of: '[data-part=eyeglow]', pivot: [150, 197] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 197] },
      { name: 'shield', of: 'fig:1', pivot: [172, 128] },
      { name: 'weave', of: '[data-part=weave]', pivot: [172, 128] },
      { name: 'bud', of: '[data-part=bud]', pivot: [172, 128] },
    ],
  },

  // Pyra, Herald of Ash (a Champion creature, an attacker: she blows her long horn and fire pours from its bell; her text is
  // Spells that damage, so the blast is the attack: a roar of fire thrown from the bell at a target): the horn with her
  // forearm (cut from her figure past the hands), the plume of fire pouring from the bell, her head with the fallen hood,
  // the hood's tail streaming back and the left flare of her robe; `emit`: the horn's bell, where the fire leaves from,
  // `hit`: her chest, `hands`: where the horn is held (it turns about them), `neck`: where the head turns, `bell`: the
  // bell, `ground`: the crag's far end, where the fire lands when she is alone (the target: the lava valley)
  'champion-ember': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [191, 65], hit: [106, 126],
    hands: [127, 87], elbow: [117, 98], neck: [102, 93], bell: [191, 65], ground: [248, 172],
    parts: [
      { name: 'plume', of: '[data-part=plume]', pivot: [127, 87] },
      { name: 'horn', of: 'fig:1', pivot: [117, 98], poly: [[116, 40], [212, 40], [212, 112], [116, 112]], cut: true, joint: 4 },
      { name: 'head', of: 'fig:1', pivot: [102, 93], poly: [[92, 60], [116, 60], [116, 92], [92, 92]], cut: true, joint: 4 },
      { name: 'hood', of: 'fig:1', pivot: [94, 86], poly: [[56, 66], [92, 66], [92, 94], [56, 94]], cut: true, joint: 3 },
      { name: 'robe', of: 'fig:1', pivot: [88, 140], poly: [[56, 134], [86, 134], [86, 170], [56, 170]], cut: true, joint: 3 },
    ],
  },

  // Aurelia, the Lightkeeper (a Champion creature, a support: she raises a lantern of pure light and Spirits gather at it; her
  // text is Spirits and boosting them, so her move is the gift: she gathers the Spirits into the lantern, throws her arm out
  // and sends them streaming to a friend): her lantern arm (cut from her figure at the shoulder), the lantern with its glint,
  // the halo round it (no longer a breathing ambient glow: it rides the lantern) and the left flare of her cloak; `emit`:
  // the lantern's heart, where the Spirits leave from, `hit`: her breastplate, `shoulder`: where the arm turns, `hand`: the
  // lantern's hand, `cloak`: where the cloak's flare turns, `spirits`: where the Spirits hover round the lantern (they gather
  // from here; each is its own part, spirit0-8, which leaves its place when it gathers and returns as the move ends)
  'champion-radiant': {
    role: 'support', element: 'spirit', facing: 'right', emit: [161, 50], hit: [138, 126],
    shoulder: [148, 102], hand: [161, 65], cloak: [108, 124],
    spirits: [[123, 44], [133, 20], [165, 13], [195, 26], [204, 54], [191, 80], [119, 72], [103, 26], [219, 38]],
    parts: [
      { name: 'arm', of: 'fig:0', pivot: [148, 102], poly: [[146, 99], [172, 99], [172, 52], [149, 52], [149, 94]], cut: true, joint: 4 },
      { name: 'halo', of: '[data-part=halo]', pivot: [148, 102] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [148, 102] },
      { name: 'cloak', of: 'fig:0', pivot: [108, 124], poly: [[70, 96], [107, 96], [107, 172], [70, 172]], cut: true, joint: 3 },
      { name: 'spirit0', of: '[data-part=spirit0]', pivot: [123, 44] },
      { name: 'spirit1', of: '[data-part=spirit1]', pivot: [133, 20] },
      { name: 'spirit2', of: '[data-part=spirit2]', pivot: [165, 13] },
      { name: 'spirit3', of: '[data-part=spirit3]', pivot: [195, 26] },
      { name: 'spirit4', of: '[data-part=spirit4]', pivot: [204, 54] },
      { name: 'spirit5', of: '[data-part=spirit5]', pivot: [191, 80] },
      { name: 'spirit6', of: '[data-part=spirit6]', pivot: [119, 72] },
      { name: 'spirit7', of: '[data-part=spirit7]', pivot: [103, 26] },
      { name: 'spirit8', of: '[data-part=spirit8]', pivot: [219, 38] },
    ],
  },

  // Carrion Wyrm (a creature, an attacker: a skeletal wyrm circling low over the battlefield, violet light in its ribs; it
  // soars and its bite is venom, so its attack is a volley of bone shards spat from the jaws): the two torn wings (the
  // skin, and the arm with its finger-bones, each side), the spine cut in three (the neck with its vertebrae, the body's
  // middle, and the tail curling up at the right), the skull with its horns, the hanging jaw, its single eye with its glow,
  // the ribs, the two legs and the heart of light in the ribs; `emit`: the skull's mouth, where the shards leave from,
  // `hit`: the ribcage, where blows land, `neck`: where the neck bends from, `head`: where the skull turns on the neck,
  // `hinge`: where the jaw turns, `shoulderL`/`shoulderR`: where the wings turn, `body`: the body's middle (it tilts and
  // banks about it), `tail`: where the tail turns, `eye`: the eye, `ground`: the battlefield below its jaws (the target when
  // alone)
  'carrion-wyrm': {
    role: 'attacker', element: 'bone', facing: 'left', emit: [66, 115], hit: [160, 98],
    neck: [120, 93], head: [96, 106], hinge: [92, 113], shoulderL: [146, 82], shoulderR: [156, 80], body: [150, 92], tail: [204, 106], eye: [80, 104], heart: [166, 100], ground: [56, 160],
    parts: [
      { name: 'memL', of: '[data-part=memL]', pivot: [146, 82] },
      { name: 'memR', of: '[data-part=memR]', pivot: [156, 80] },
      { name: 'neck', of: 'fig:0 [data-part=spine]', pivot: [120, 93], poly: [[-10, -10], [120, -10], [120, 220], [-10, 220]] },
      { name: 'trunk', of: 'fig:0 [data-part=spine]', pivot: [150, 92], poly: [[120, -10], [204, -10], [204, 220], [120, 220]] },
      { name: 'tail', of: 'fig:0 [data-part=spine]', pivot: [204, 106], poly: [[204, -10], [310, -10], [310, 220], [204, 220]] },
      { name: 'ribs', of: 'fig:0 [data-part=ribs]', pivot: [150, 92] },
      { name: 'skull', of: 'fig:0 [data-part=skull]', pivot: [96, 106] },
      { name: 'jaw', of: 'fig:0 [data-part=jaw]', pivot: [92, 113] },
      { name: 'armL', of: 'fig:0 [data-part=armL]', pivot: [146, 82] },
      { name: 'armR', of: 'fig:0 [data-part=armR]', pivot: [156, 80] },
      { name: 'legs', of: 'fig:0 [data-part=legs]', pivot: [150, 92] },
      { name: 'eye', of: '[data-part=eye]', pivot: [96, 106] },
      { name: 'heart', of: '[data-part=heart]', pivot: [150, 92] },
    ],
  },
  // The Culling (a spell, an attacker: it destroys every creature with 2 or less Power, so the spell is the scythe and the
  // sweep itself): the giant scythe of violet light (its handle, the grip's peg and the blade, with the glow they throw),
  // the three small people at the left, still whole and standing ahead of the blade (folk0-folk2), the faint ghosts of the
  // people it has already cut, standing in the swath, and the wisps curling up from them; `emit`: the blade's tip, where the
  // reaping wave leaves from, `hit`: the middle of the swath, where creatures fall, `grip`: where the scythe turns (its
  // peg on the handle), `blade`: the middle of the blade, `folk`: where the three people stand (their feet), `swath`: the
  // middle of the cut swath, `giant`: the tall one that was spared, `stand`: where the people stand, a point among the three
  // (the target when alone)
  'the-culling': {
    role: 'attacker', element: 'spirit', facing: 'left', emit: [64, 145], hit: [150, 140],
    grip: [262, 56], blade: [140, 126], folk: [[26, 177], [44, 176], [58, 177]], swath: [150, 140], giant: [198, 130], stand: [44, 162],
    parts: [
      { name: 'folk0', of: 'fig:0 [data-part=folk0]', pivot: [26, 177] },
      { name: 'folk1', of: 'fig:0 [data-part=folk1]', pivot: [44, 176] },
      { name: 'folk2', of: 'fig:0 [data-part=folk2]', pivot: [58, 177] },
      { name: 'ghosts', of: '[data-part=ghosts]', pivot: [170, 150] },
      { name: 'wisps', of: '[data-part=wisps]', pivot: [170, 150] },
      { name: 'scythe', of: '[data-part=scythe]', pivot: [262, 56] },
    ],
  },
  // Hungry Ghoul (a creature, a support: it feeds on the dead and grows, +1/+1 whenever another creature dies, and it can
  // eat one of yours): its head (the long skull with its horn), its jaw, its three glowing eyes (with the violet light they
  // throw), the long arm hanging over the gravestone's edge (armA) and the arm gripping the stone's top (armB), the rest of
  // the crouched body (the arched back, haunches, legs, neck) and the faint ribs along its flank; `emit`: its open mouth,
  // where the hunger reaches out from, `hit`: the middle of its back, `neck`: where the head turns, `hinge`: where the jaw
  // turns, `shoulderA`/`shoulderB`: where the arms turn, `feet`: where it crouches on the stone (it swells about it),
  // `cross`: the little cross at the left of the foreground (the target when alone)
  'hungry-ghoul': {
    role: 'support', element: 'shadow', facing: 'left', emit: [107, 69], hit: [171, 69],
    neck: [135, 57], hinge: [127, 65], shoulderA: [158, 50], shoulderB: [168, 53], feet: [174, 98], cross: [66, 140],
    parts: [
      { name: 'body', of: 'fig:1 [data-part=body]', pivot: [174, 98] },
      { name: 'ribs', of: '[data-part=ribs]', pivot: [174, 98] },
      { name: 'armB', of: 'fig:1 [data-part=armB]', pivot: [168, 53] },
      { name: 'armA', of: 'fig:1 [data-part=armA]', pivot: [158, 50] },
      { name: 'head', of: 'fig:1 [data-part=head]', pivot: [135, 57] },
      { name: 'jaw', of: 'fig:1 [data-part=jaw]', pivot: [127, 65] },
      { name: 'eyes', of: '[data-part=eyefire]', pivot: [135, 57] },
    ],
  },
  // Bone Altar (a relic, an aura: once each turn a creature is sacrificed to draw a card, so the place itself acts): the cold
  // violet flame on the altar (its tongues, and the glow they throw), the little flames of the four candles on the altar and
  // the two on the floor (candA-candD are the altar's, left to right, candE and candF the floor's), and the three skulls in
  // the altar's front; `flame`: the flame's base, where it stands, `slab`: the middle of the altar's top, `skulls`: where the
  // three skulls sit (their bases), `candles`: where each candle flame sits (their bases, in the order named above),
  // `bowl`: the bowl the flame burns in
  'bone-altar': {
    role: 'aura', element: 'bone', facing: 'front', hit: [150, 150],
    flame: [150, 97], slab: [150, 110], bowl: [150, 97], skulls: [[122, 150], [150, 150], [178, 150]],
    candles: [[107, 90], [117, 96], [185, 92], [195, 97], [66, 175], [236, 179]],
    parts: [
      { name: 'flame', of: '[data-part=flames]', pivot: [150, 97], poly: [[124, -10], [176, -10], [176, 102], [124, 102]] },
      { name: 'candA', of: '[data-part=flames]', pivot: [107, 90], poly: [[96, 76], [111, 76], [111, 100], [96, 100]] },
      { name: 'candB', of: '[data-part=flames]', pivot: [117, 96], poly: [[111, 76], [124, 76], [124, 104], [111, 104]] },
      { name: 'candC', of: '[data-part=flames]', pivot: [185, 92], poly: [[176, 76], [190, 76], [190, 102], [176, 102]] },
      { name: 'candD', of: '[data-part=flames]', pivot: [195, 97], poly: [[190, 76], [204, 76], [204, 106], [190, 106]] },
      { name: 'candE', of: '[data-part=flames]', pivot: [66, 175], poly: [[54, 158], [78, 158], [78, 182], [54, 182]] },
      { name: 'candF', of: '[data-part=flames]', pivot: [236, 179], poly: [[224, 162], [248, 162], [248, 186], [224, 186]] },
      { name: 'skull0', of: '[data-part=skulls]', pivot: [122, 150], poly: [[-10, -10], [136, -10], [136, 220], [-10, 220]] },
      { name: 'skull1', of: '[data-part=skulls]', pivot: [150, 150], poly: [[136, -10], [164, -10], [164, 220], [136, 220]] },
      { name: 'skull2', of: '[data-part=skulls]', pivot: [178, 150], poly: [[164, -10], [310, -10], [310, 220], [164, 220]] },
    ],
  },
  // Vesper Bat (a creature, a support: it drains life: an opponent loses 1 and you gain 1): its two wings (the scalloped skin
  // with its thumb-claw), its body (the head with ears, the belly, its two feet), the violet veins running through each wing
  // and its two glowing eyes; `emit`: its mouth, where the drained life is taken from, `hit`: its belly, where it gets the
  // life back, `shoulderL`/`shoulderR`: where the wings turn, `body`: where it tilts, `town`: the ruined arcade (the
  // target when alone)
  'vesper-bat': {
    role: 'support', element: 'blood', facing: 'front', emit: [150, 71], hit: [150, 91],
    shoulderL: [144, 76], shoulderR: [156, 76], body: [150, 90], town: [232, 146],
    parts: [
      { name: 'wingL', of: 'fig:1 [data-part=wings]', pivot: [144, 76], poly: [[-10, -10], [150, -10], [150, 220], [-10, 220]] },
      { name: 'wingR', of: 'fig:1 [data-part=wings]', pivot: [156, 76], poly: [[150, -10], [310, -10], [310, 220], [150, 220]] },
      { name: 'thumbL', of: 'fig:1 [data-part=body]', pivot: [144, 76], poly: [[-10, -10], [125, -10], [125, 220], [-10, 220]] },
      { name: 'thumbR', of: 'fig:1 [data-part=body]', pivot: [156, 76], poly: [[175, -10], [310, -10], [310, 220], [175, 220]] },
      { name: 'body', of: 'fig:1 [data-part=body]', pivot: [150, 90], poly: [[125, -10], [175, -10], [175, 220], [125, 220]] },
      { name: 'veinsL', of: '[data-part=veins]', pivot: [144, 76], poly: [[-10, -10], [150, -10], [150, 220], [-10, 220]] },
      { name: 'veinsR', of: '[data-part=veins]', pivot: [156, 76], poly: [[150, -10], [310, -10], [310, 220], [150, 220]] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 90] },
    ],
  },
  // Marsh Adder (a creature, an attacker: a black snake rearing out of the reeds, its venom is the attack): the upper
  // S of its body (cut at the reeds' height, with the violet zig-zag along it), its head (the hooded skull and jaw) and its
  // face (eye with its glow, the two fangs, the flicking tongue); `emit`: between the fangs, where the venom leaves from,
  // `hit`: its chest, `neck`: where the upper body bends from, `head`: where the head turns on the neck, `reeds`: where
  // its venom lands when alone (the dark water to its left)
  'marsh-adder': {
    role: 'attacker', element: 'venom', facing: 'left', emit: [157, 68], hit: [140, 112],
    neck: [132, 122], head: [180, 70], reeds: [92, 96],
    parts: [
      { name: 'neck', of: 'fig:0 [data-part=body]', pivot: [132, 122], poly: [[100, 114], [210, 114], [210, 30], [100, 30]], cut: true, joint: 4 },
      { name: 'zig', of: '[data-part=zig]', pivot: [132, 122], poly: [[100, 114], [210, 114], [210, 30], [100, 30]], cut: true, joint: 1 },
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [180, 70] },
      { name: 'face', of: '[data-part=face]', pivot: [180, 70] },
    ],
  },
  // Kiss of Night (a Trick, a support: a creature you control gets Venom and Drain, so the boon is the kiss): the crescent
  // moon (with its glow), the hooded woman (her silhouette, and the sleeve of her raised arm), her pale hand with its glow
  // and the eight violet moths the kiss became (each its own, flying on their own now); `emit`: the palm's fingertips, where
  // the kiss leaves from, `tree`: the dead tree on the moor (the target when alone), `lips`: her lips, `wrist`: where the
  // hand turns, `shoulder`: where the sleeve turns, `moon`: the crescent's middle, `moths`: where the eight moths are
  // drawn (their middles), `feet`: where the woman stands (she leans about it)
  'kiss-of-night': {
    role: 'support', element: 'shadow', facing: 'left', emit: [114, 97], hit: [262, 130],
    tree: [262, 130], lips: [72, 63], wrist: [84, 104], shoulder: [66, 136], moon: [226, 46], feet: [40, 214],
    moths: [[122, 88], [138, 74], [156, 86], [170, 64], [150, 54], [186, 46], [200, 68], [206, 32]],
    parts: [
      { name: 'moon', of: '[data-part=moon]', pivot: [226, 46] },
      { name: 'lady', of: 'fig:0 [data-part=lady]', pivot: [40, 214] },
      { name: 'sleeve', of: 'fig:0 [data-part=sleeve]', pivot: [66, 136] },
      { name: 'hand', of: '[data-part=hand]', pivot: [66, 136] },
      { name: 'moth0', of: '[data-part=moth0]', pivot: [122, 88] },
      { name: 'moth1', of: '[data-part=moth1]', pivot: [138, 74] },
      { name: 'moth2', of: '[data-part=moth2]', pivot: [156, 86] },
      { name: 'moth3', of: '[data-part=moth3]', pivot: [170, 64] },
      { name: 'moth4', of: '[data-part=moth4]', pivot: [150, 54] },
      { name: 'moth5', of: '[data-part=moth5]', pivot: [186, 46] },
      { name: 'moth6', of: '[data-part=moth6]', pivot: [200, 68] },
      { name: 'moth7', of: '[data-part=moth7]', pivot: [206, 32] },
    ],
  },
  // Fish (a token creature, an attacker: a small startled fish in a bubble of seawater, it spits a jet of water): the bubble
  // (its skin of water and the pale pool under the fish), the fish in six pieces (body, tail, top fin, belly fin, the two
  // horn nubs left over from what it was, and the face with its round eye, gill and O of a mouth) and the light on the
  // bubble's skin with its rim; `emit`: its mouth, where the jet leaves from, `hit`: its middle, `centre`: the body's
  // middle (a fish turning about faces the other way about it), `bubble`: the bubble's centre and radius
  'fish': {
    role: 'attacker', element: 'water', facing: 'left', emit: [118.3, 101.7], hit: [143, 98],
    mouth: [118.3, 101.7], centre: [143, 97], bubble: [150, 92], radius: 53, eye: [132.2, 91.6],
    parts: [
      { name: 'bubble', of: '[data-part=bubble]', pivot: [150, 92] },
      { name: 'fbody', of: 'fig:0 [data-part=fbody]', pivot: [143, 97] },
      { name: 'ftail', of: 'fig:0 [data-part=ftail]', pivot: [160, 97] },
      { name: 'ftop', of: 'fig:0 [data-part=ftop]', pivot: [146, 82] },
      { name: 'fbelly', of: 'fig:0 [data-part=fbelly]', pivot: [145, 116] },
      { name: 'fhorns', of: 'fig:0 [data-part=fhorns]', pivot: [130, 86] },
      { name: 'fface', of: '[data-part=fface]', pivot: [143, 97] },
      { name: 'bshine', of: '[data-part=bshine]', pivot: [150, 92] },
    ],
  },
  // Nerissa, Voice of the Deep (a legendary creature, an attacker: her song takes an enemy creature under her sway): her
  // hair streaming back across the moon, her body (neck, torso, back arm), her head with its coral crown and pearls, the
  // beckoning arm, her tail with its fluke, the rings of her song, and the knight wading toward her (his body, and the
  // two arms he reaches out with); `emit`: her mouth, where the song leaves from, `hit`: her chest, `mouth`: her mouth,
  // `neck`: where her head turns, `shoulder`: where the beckoning arm turns, `hand`: its fingertips, `hip`: where her body
  // and tail bend, `feet`: where the knight stands in the water (the target when alone: `knight` is his chest)
  'nerissa': {
    role: 'attacker', element: 'water', facing: 'left', emit: [189, 71], hit: [205, 98],
    mouth: [189, 71], neck: [199, 80], shoulder: [196, 90], hand: [151, 88], hip: [208, 120], feet: [84, 157], knight: [86, 136],
    parts: [
      { name: 'song', of: '[data-part=song]', pivot: [188, 74.5] },
      { name: 'hair', of: 'fig:1 [data-part=hair]', pivot: [203, 64] },
      { name: 'body', of: 'fig:1 [data-part=body]', pivot: [208, 120] },
      { name: 'head', of: ['fig:1 [data-part=head]', '[data-part=head]'], pivot: [199, 80] },
      { name: 'arm', of: 'fig:1 [data-part=arm]', pivot: [196, 90] },
      { name: 'tail', of: 'fig:1 [data-part=tail]', pivot: [212, 122] },
      { name: 'kbody', of: 'fig:2 [data-part=kbody]', pivot: [84, 157] },
      { name: 'kreach', of: 'fig:2 [data-part=kreach]', pivot: [93, 130] },
    ],
  },
  // one more wave (a spell, a support: you take an extra turn, so the sea gives you another wave): the second, taller
  // wave behind (its body with the lit bands and streaks, the foam along its crest and round its curl, the spray torn
  // off the curl and the mist wisps over it), the nearer, lower wave the boat sits on (with its bright lip), the boat
  // (hull, mast and sail), the sailor in it (looking up) and the lantern in the bow; `emit`: the great wave's crest,
  // where the gift (a surge of lit water) leaves from, `hit`: the boat, where it lands (the target when alone),
  // `crest`: the wave's highest point, `curl`: the tip of its curl, `base`: where the wave stands on the sea (it rears
  // about it), `boat`: the hull's middle, `waist` and `head`: the sailor's waist (it leans about it) and head,
  // `lantern`: the light in the bow, `sea`: the nearer wave's foot it rises from
  'one-more-wave': {
    role: 'support', element: 'water', facing: 'left', emit: [236, 24], hit: [100, 112],
    crest: [212, 15], curl: [262, 66], base: [240, 214], boat: [100, 118], waist: [92.7, 116.2], head: [93, 98.6], lantern: [84, 112.5], sea: [150, 214],
    parts: [
      { name: 'wave', of: ['fig:0', '[data-part=wave]'], pivot: [240, 214] },
      { name: 'foam', of: '[data-part=foam]', pivot: [240, 214] },
      { name: 'spray', of: '[data-part=spray]', pivot: [262, 70] },
      { name: 'mist', of: '[data-part=mist]', pivot: [240, 214] },
      { name: 'near', of: ['fig:1', '[data-part=nearline]'], pivot: [150, 214] },
      { name: 'hull', of: 'fig:2 [data-part=hull]', pivot: [100, 120] },
      { name: 'sailor', of: 'fig:2 [data-part=sailor]', pivot: [92.7, 116.2] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [84, 112.5] },
    ],
  },
  // the drowned clock (a Relic, an aura: it chimes at the start of your turn, and on the third chime each opponent loses 6
  // Life): the rings of light the bell sends out over the sky, the leaning tower (its stonework, weed and barnacles, with
  // the lines of its courses), the bell in its belfry, the glowing face (disc and dial), the hour hand and the minute hand
  // (cut from the one drawn stroke), the tower's reflection on the water and the rings spreading on the sea; `bell`: the
  // belfry, where the chime and its rings come from, `face`: the clock face's centre (the hands turn about it), `peak`:
  // the spire's tip, `base`: where the tower stands in the sea (the water's rings spread from it)
  'the-drowned-clock': {
    role: 'aura', element: 'water', facing: 'front', hit: [143, 108],
    bell: [141.5, 55], face: [144.2, 83.3], peak: [138, 12], base: [149, 142],
    parts: [
      { name: 'rings', of: '[data-part=rings]', pivot: [141.3, 50.4] },
      { name: 'tower', of: ['fig:0 [data-part=tower]', '[data-part=tower]'], pivot: [148, 150] },
      { name: 'bell', of: 'fig:0 [data-part=bell]', pivot: [140.8, 44.4] },
      { name: 'face', of: '[data-part=face]', pivot: [144.2, 83.3] },
      { name: 'hour', of: '[data-part=hands]', pivot: [144.2, 83.3], poly: [[133, 70], [140.6, 68], [142.8, 83.6], [147, 85.5], [147, 89], [133, 89]] },
      { name: 'minute', of: '[data-part=hands]', pivot: [144.2, 83.3], poly: [[140.6, 68], [147, 68], [147, 85.5], [142.9, 85.5], [142.8, 83.6]] },
      { name: 'reflect', of: '[data-part=reflect]', pivot: [146, 146] },
      { name: 'ripples', of: '[data-part=ripples]', pivot: [149, 142] },
    ],
  },
  // the tidal mimic (a creature, an attacker: a tide-pool water-thing half-formed into a knight, its sword raised): the
  // knight's body (helm, torso, far arm, visor and the lines drawn on it), the plume streaming from its helm, the sword
  // arm (shoulder and hand) and the sword in it (the drops hanging round it fall on their own); `emit`: the sword's tip (where the
  // slash of water leaves from), `hit`: its chest, `shoulder`: where the sword arm turns, `hand`: the hand on the hilt,
  // `feet`: where it stands in the pool (it sways about them), `mid`: the axis it mirrors about to face a target
  'tidal-mimic': {
    role: 'attacker', element: 'water', facing: 'left', emit: [115, 45], hit: [152, 112],
    shoulder: [130, 95], hand: [116, 96], feet: [150, 176], mid: 150,
    parts: [
      { name: 'body', of: '[data-part=body]', pivot: [150, 176] },
      { name: 'plume', of: '[data-part=plume]', pivot: [153, 53] },
      { name: 'arm', of: '[data-part=arm]', pivot: [130, 95] },
      { name: 'sword', of: '[data-part=sword]', pivot: [116, 96] },
    ],
  },
  // the windborne sage (a creature, a support: when played she draws a card): her hair and her scarf
  // streaming on the wind, her billowing robe, her book-arm (sleeve and hand), her far sleeve, the
  // open glowing book, and the five gulls (each its own); the rest of her (head, body, legs) stays;
  // `emit`: the book, where the card she draws is gathered and leaves from, `hit`: her chest,
  // `book`: the book's centre, `shoulder`: where the book-arm turns, `head`: her head, `feet`: her
  // bare feet, `gulls`: where the five gulls are drawn (their middles)
  'windborne-sage': {
    role: 'support', element: 'wind', facing: 'left', emit: [107, 79], hit: [141, 90],
    book: [107, 79], shoulder: [134, 78], head: [130, 60], feet: [149, 160],
    gulls: [[65, 28], [231, 22], [253, 62], [199, 148], [99, 140]],
    parts: [
      { name: 'hair', of: 'fig:1 [data-part=hair]', pivot: [131, 58] },
      { name: 'scarf', of: 'fig:1 [data-part=scarf]', pivot: [136, 70] },
      { name: 'robe', of: 'fig:1 [data-part=robe]', pivot: [140, 98] },
      { name: 'arm', of: 'fig:1 [data-part=arm]', pivot: [134, 78] },
      { name: 'sleeve', of: 'fig:1 [data-part=sleeve]', pivot: [140, 75] },
      { name: 'book', of: '[data-part=book]', pivot: [107, 80] },
      { name: 'bird0', of: '[data-part=bird0]', pivot: [65, 28] },
      { name: 'bird1', of: '[data-part=bird1]', pivot: [231, 22] },
      { name: 'bird2', of: '[data-part=bird2]', pivot: [253, 62] },
      { name: 'bird3', of: '[data-part=bird3]', pivot: [199, 148] },
      { name: 'bird4', of: '[data-part=bird4]', pivot: [99, 140] },
    ],
  },
  // sea change (a Trick, a support: a creature becomes a small fish): the roaring horned monster (with
  // its eye), the four streams of sea-magic winding in from it to the bubble, the bubble, the fish in
  // it (with its face) and the bubble's shine; `emit`: the bubble's heart, where the spell is gathered
  // and leaves from, `hit`: the monster's chest, where the magic takes hold of it (the target when
  // alone), `bubble`: the bubble's centre and radius, `mouth`: the monster's open mouth, `eye`: its eye
  'sea-change': {
    role: 'support', element: 'water', facing: 'left', emit: [212, 124], hit: [96, 96],
    bubble: [212, 124], radius: 22, mouth: [148, 60], eye: [114, 50], feet: [212, 150],
    parts: [
      { name: 'monster', of: '[data-part=monster]', pivot: [100, 100] },
      { name: 'spiral', of: '[data-part=spiral]', pivot: [212, 124] },
      { name: 'bubble', of: '[data-part=bubble]', pivot: [212, 124] },
      { name: 'fish', of: '[data-part=fish]', pivot: [212, 126] },
      { name: 'shine', of: '[data-part=shine]', pivot: [212, 124] },
    ],
  },
  // riptide (a Trap, a defender: the wave takes the attacker and drags it back to the sea): the great wave
  // (hide, lit lip, streaks and spray), the knight (with his blade's glow), the white water round his legs
  // and the backwash drawn toward the wave; `hit`: the knight's chest, `guard`: where blows are taken (the
  // lip's tip, the underside of the curl, the face of the wave), `base`: the wave's foot it swells from,
  // `feet`: where the knight stands, `blade`: the sword's tip, `fist`: his empty hand
  'riptide': {
    role: 'defender', element: 'water', facing: 'left', hit: [124, 118],
    guard: [[92, 86], [160, 58], [208, 130]], base: [300, 214], feet: [125, 176], blade: [114, 27], fist: [86, 123],
    parts: [
      { name: 'wave', of: '[data-part=wave]', pivot: [300, 214] },
      { name: 'wash', of: '[data-part=wash]', pivot: [180, 186] },
      { name: 'knight', of: '[data-part=knight]', pivot: [125, 176] },
      { name: 'foam', of: '[data-part=foam]', pivot: [125, 176] },
    ],
  },
  // cloud ray (a creature that glides over the clouds, an attacker: a sweep of its wing throws the water it carries): the
  // manta as one body (banking, diving and spreading and folding its wings by stretching along its span, about its middle),
  // the mist trailing from its wing-tips (behind it) and its two eyes; `emit`: its right wing-tip, `tipL`: its left (a
  // blow to its left leaves from this one), `hit`: its back, `mid`: the body's middle it turns about, `axis`: the angle
  // of its span (degrees), `sea`: the horizon it glides over
  'cloud-ray': {
    role: 'attacker', element: 'water', facing: 'front', emit: [236, 78], hit: [150, 84],
    tipL: [77, 129], mid: [150, 84], axis: -18, sea: 148,
    parts: [
      { name: 'mist', of: '[data-part=mist]', pivot: [150, 84] },
      { name: 'ray', of: 'fig:2', pivot: [150, 84] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 84] },
    ],
  },
  // stampede (a Trick: your creatures get +2/+2 and Overrun, a support: the herd's charge is the boon): the lead beast whole
  // (with its eye, drawn over it), the nearer herd behind it (the second figure), the far herd, and the bolt in the storm;
  // `emit`: the lead beast's brow where the boon leaves from, `hit`: its shoulder, `feet`: where each group gallops from,
  // `ground`: the plain's floor
  'stampede': {
    role: 'support', element: 'earth', facing: 'left', emit: [54, 136], hit: [105, 150],
    ground: 190, feet: [[118, 190], [240, 182], [240, 160]],
    parts: [
      { name: 'far', of: '[data-part=far]', pivot: [240, 160] },
      { name: 'mid', of: 'fig:0', pivot: [240, 182] },
      { name: 'lead', of: 'fig:1', pivot: [118, 190] },
      { name: 'eye', of: '[data-part=eye]', pivot: [118, 190] },
      { name: 'bolt', of: '[data-part=bolt]', pivot: [244, 34] },
    ],
  },
  // ironhide charger (a creature that charges through whatever it picks, an attacker: the charge is the attack): the beast
  // split at the neck, its body (with the great plates, drawn over it) lunging from its middle, its head
  // tossing from the neck; `emit`: the horn's tip where the blow leaves from, `hit`: its plated flank, `mid`: the body's
  // middle it lunges about, `neck`: the head's joint, `ground`: its feet's floor
  'ironhide-charger': {
    role: 'attacker', element: 'earth', facing: 'left', emit: [22, 120], hit: [150, 128],
    mid: [150, 130], neck: [86, 140], ground: 186,
    parts: [
      { name: 'body', of: 'fig:0', pivot: [150, 130], poly: [[84, -10], [310, -10], [310, 220], [78, 220]] },
      { name: 'head', of: 'fig:0', pivot: [86, 140], poly: [[-10, -10], [84, -10], [78, 220], [-10, 220]] },
      { name: 'plates', of: '[data-part=plates]', pivot: [150, 130] },
      { name: 'eye', of: '[data-part=eye]', pivot: [86, 140] },
    ],
  },
  // savage clash (a spell: a creature of yours fights an enemy creature, so an attacker whose attack is the clash itself): the
  // great bear reared up on the left and the horned beast with its head down on the right, each one whole (the figure's
  // two halves), rearing back and crashing together from their feet; `emit`: the heart of the clash where the
  // shockwave of leaves and dust leaves from, `hit`: the beast's chest, `ground`: the clearing's floor,
  // `feet`: where each leans from
  'savage-clash': {
    role: 'attacker', element: 'nature', facing: 'right', emit: [157, 99], hit: [190, 112],
    ground: 185, feet: [[94, 184], [226, 184]],
    parts: [
      { name: 'bear', of: 'fig:0 [data-part=bear]', pivot: [94, 184] },
      { name: 'beast', of: 'fig:0 [data-part=beast]', pivot: [226, 184] },
    ],
  },
  // heartwood totem (a relic whose boon grows your weakest creature; an aura: the place itself acts): the owl's two wings
  // (cut from the totem, each with its feather carving) turning from the shoulders, the sprout on its crown turning
  // from its base, the heart-knot's burning green (swelling about its middle) and the little visitor's ears;
  // `emit`: the heart-knot, `hit`: the trunk, `heart`: its middle, `eyes`: the owl's eyes, `face`: the carved face at the foot,
  // `shoulders`: the wings' joints, `crown`: the sprout's base, `ground`: the moss
  'heartwood-totem': {
    role: 'aura', element: 'nature', facing: 'front', emit: [150, 120], hit: [150, 100],
    heart: [150, 119], eyes: [[143, 44], [157, 44]], face: [150, 166], shoulders: [[135, 60], [165, 60]], crown: [150, 30], ground: 186,
    parts: [
      { name: 'wingL', of: 'fig:0', pivot: [135, 60], poly: [[84, 40], [135, 40], [135, 86], [84, 86]], cut: true, joint: 3 },
      { name: 'wingR', of: 'fig:0', pivot: [165, 60], poly: [[165, 40], [216, 40], [216, 86], [165, 86]], cut: true, joint: 3 },
      { name: 'linesL', of: '[data-part=carving]', pivot: [135, 60], poly: [[96, 52], [133, 52], [133, 78], [96, 78]], cut: true, joint: 1 },
      { name: 'linesR', of: '[data-part=carving]', pivot: [165, 60], poly: [[167, 52], [204, 52], [204, 78], [167, 78]], cut: true, joint: 1 },
      { name: 'sprout', of: 'fig:0', pivot: [150, 30], poly: [[137, -10], [163, -10], [163, 29], [137, 29]], cut: true, joint: 3 },
      { name: 'heart', of: '[data-part=heart]', pivot: [150, 120] },
      { name: 'ears', of: 'fig:1 [data-part=ears]', pivot: [201, 171] },
    ],
  },
  // grandmother bramble (a creature that gives every boost +1/+1 more, a support: her boon is the growth she tends): her
  // long reaching arm (turning from just clear of the shawl), her hand (turning from the wrist), the crown of twigs with the
  // nests and chicks (swaying from the top of her head), the chicks' open beaks, the four glowing saplings, one each, and
  // the birds in the sky; `emit`: her fingertips where the boon leaves from, `hit`: her back, `shoulder`: the arm's joint,
  // `wrist`: the hand's joint, `crown`: the twigs' root, `saps`: each sapling's base and top, `ground`: the soil
  'grandmother-bramble': {
    role: 'support', element: 'nature', facing: 'right', emit: [181, 165], hit: [108, 132],
    shoulder: [145, 121], wrist: [166, 148], crown: [138, 88], ground: 190,
    saps: [[[188, 190], [189, 177]], [[212, 190], [213, 173]], [[236, 190], [237, 169]], [[260, 190], [261, 165]]],
    parts: [
      { name: 'crown', of: 'fig:0', pivot: [138, 88], poly: [[30, -10], [200, -10], [200, 83], [152, 83], [132, 85], [116, 90], [100, 99], [96, 102], [30, 102]], cut: true, joint: 5 },
      { name: 'beaks', of: '[data-part=beaks]', pivot: [138, 88] },
      { name: 'arm', of: 'fig:0', pivot: [145, 121], poly: [[135.5, 128.3], [154.5, 113.7], [176, 140.2], [157, 154.8]], cut: true, joint: 5 },
      { name: 'hand', of: 'fig:0', pivot: [166, 148], poly: [[157, 154.8], [176, 140.2], [215, 140.2], [215, 205], [157, 205]], cut: true, joint: 3 },
      { name: 'sap0', of: '[data-part=saplings]', pivot: [188, 190], poly: [[170, -10], [200, -10], [200, 220], [170, 220]] },
      { name: 'sap1', of: '[data-part=saplings]', pivot: [212, 190], poly: [[200, -10], [224, -10], [224, 220], [200, 220]] },
      { name: 'sap2', of: '[data-part=saplings]', pivot: [236, 190], poly: [[224, -10], [248, -10], [248, 220], [224, 220]] },
      { name: 'sap3', of: '[data-part=saplings]', pivot: [260, 190], poly: [[248, -10], [290, -10], [290, 220], [248, 220]] },
      { name: 'birds', of: '[data-part=birds]', pivot: [214, 42] },
    ],
  },
  // smoldering golem (an attacker that deals its damage as it falls: 3 Power, 4 Vitality): the hot stones stacked into
  // a body, in six pieces: the torso (squashing and stretching from its feet), the head with its eyes and seams,
  // each arm (shoulder, arm and fist, with their glowing seams: turning from the shoulder, raised overhead and
  // slammed down) and the legs with their feet and seams, the cracks across the torso; `emit`: the floor between its fists where the slam lands and its
  // shockwave leaves, `hit`: the torso's middle, `feet`: where it squashes from, `shoulders`: the arms' joints,
  // `neck`: the head's joint
  'smoldering-golem': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 178], hit: [150, 128],
    feet: [150, 190], shoulders: [[110, 106], [190, 106]], neck: [151, 102],
    parts: [
      { name: 'body', of: 'fig:1 [data-part=body]', pivot: [150, 190] },
      { name: 'head', of: ['fig:1 [data-part=head]', '[data-part=headseams]', '[data-part=eyes]'], pivot: [151, 102] },
      { name: 'armL', of: ['fig:1 [data-part=armL]', '[data-part=armLseams]'], pivot: [112, 108] },
      { name: 'armR', of: ['fig:1 [data-part=armR]', '[data-part=armRseams]'], pivot: [188, 108] },
      { name: 'legs', of: ['fig:1 [data-part=legs]', '[data-part=legsseams]'], pivot: [150, 190] },
      { name: 'cracks', of: '[data-part=cracks]', pivot: [150, 190] },
    ],
  },
  // molten berserker (a charging attacker that can't block, 5 Power): the front arm and fist (swinging from the
  // shoulder, drawn first so the torso covers its root), the rest of the brute (legs, torso, the other fist: leaning
  // and lunging from the hips), his two white-hot eyes (with the body) and the fist's glow, flung drops and
  // seams (with the arm); `emit`: the front fist where the blow and the molten drops leave from,
  // `hit`: his chest, `hips`: where he leans from, `shoulder`: the arm's joint, `fist`: the other, back fist
  'molten-berserker': {
    role: 'attacker', element: 'fire', facing: 'left', emit: [74, 77], hit: [160, 100],
    hips: [150, 128], shoulder: [135, 88], fist: [218, 143],
    parts: [
      { name: 'arm', of: 'fig:0 [data-part=arm]', pivot: [135, 88] },
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [150, 128] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 128] },
      { name: 'fistfx', of: '[data-part=fistfx]', pivot: [135, 88] },
    ],
  },
  // mutiny (a spell that takes an enemy creature, a support: its boon is the command): the soldier turned on his own
  // (his body, his cloak, and the round trim of his head and hands) and the spear he levels, its burning head
  // (flame, glow and core as one); all share one pivot, his hips, so they lean and mirror as one; `emit`: the
  // spear's burning head where the command leaves from, `hit`: his chest, `hips`: where he leans from,
  // `hand`: the front hand holding the spear, `eye`: his ember-red eye
  'mutiny': {
    role: 'support', element: 'fire', facing: 'left', emit: [121, 125.5], hit: [207, 108],
    hips: [207, 128], hand: [180, 120], eye: [195, 80],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [207, 128] },
      { name: 'trim', of: 'fig:0 [data-part=trim]', pivot: [207, 128] },
      { name: 'cloak', of: 'fig:0 [data-part=cloak]', pivot: [207, 128] },
      { name: 'spear', of: 'fig:0 [data-part=spear]', pivot: [207, 128] },
      { name: 'flame', of: '[data-part=flame]', pivot: [207, 128] },
    ],
  },
  // ember duelist (an attacker: Swift, Hunt, and 2 Energy to deal 1 damage): the fencer in two pieces (all of her
  // but the saluting arm, leaning and lunging from her hips; and the arm, turning from the shoulder, its
  // slice overlapping the torso by a little so the seam never opens) and the red-hot rapier it holds
  // (its glow, flame and core as one, turning with the arm about the shoulder); `emit`: the rapier's tip where
  // the fire leaves, `hit`: her chest, `hips`: where she leans from, `shoulder`: the arm's joint,
  // `hand`: where the hilt is held, `blade`: the rapier's middle
  'ember-duelist': {
    role: 'attacker', element: 'fire', facing: 'left', emit: [153, 13], hit: [172, 100],
    hips: [172, 140], shoulder: [166, 84], hand: [157, 79], blade: [155, 44],
    parts: [
      { name: 'body', of: 'fig:1', pivot: [172, 140], poly: [[-10, -10], [310, -10], [310, 220], [-10, 220], [-10, 103], [146, 103], [164, 103], [164.5, 96], [164.5, 78], [162.5, 71.5], [146, 71.5], [-10, 71.5]] },
      { name: 'arm', of: 'fig:1', pivot: [166, 84], poly: [[146, 71.5], [162.5, 71.5], [166, 78], [166, 96], [165.5, 103], [146, 103]] },
      { name: 'rapier', of: '[data-part=rapier]', pivot: [166, 84] },
    ],
  },
  // kindle (a buff spell, a support: +2 Power and Swift to a creature): the warrior (the whole figure, leaning and
  // lunging from her hips), her blade burning white and the arc of fire it left behind (turning about its
  // centre); body and blade share one pivot so they move as one, x = 150 so all three mirror about it;
  // `emit`: the blade's tip where the gift leaves from, `hit`: her chest, `hips`: where she turns from,
  // `hand`: where the sword is held, `mid`: the arc's centre
  'kindle': {
    role: 'support', element: 'fire', facing: 'right', emit: [246, 126], hit: [158, 104],
    hips: [150, 130], hand: [195, 117], mid: [150, 114],
    parts: [
      { name: 'arc', of: '[data-part=arc]', pivot: [150, 114] },
      { name: 'body', of: 'fig:0', pivot: [150, 130] },
      { name: 'blade', of: '[data-part=blade]', pivot: [150, 130] },
    ],
  },
  // scorch (a damage spell, an attacker): the outstretched hand (turning from its wrist), the bolt of white-hot
  // fire it flicked (its glow, flame and core as one, turning about its tail at the fingertips) and the snarling
  // wolf mid-leap (with its eye) it is thrown at; `emit`: the bolt's tail where it leaves the fingers,
  // `hit`: the wolf's chest, `wrist`: where the hand turns from, `tip`: the bolt's head as drawn
  'scorch': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [94, 152], hit: [208, 77],
    wrist: [56, 180], tip: [152, 110],
    parts: [
      { name: 'hand', of: 'fig:2', pivot: [56, 180] },
      { name: 'bolt', of: '[data-part=bolt]', pivot: [94, 152] },
      { name: 'wolf', of: ['fig:1', '[data-part=eye]'], pivot: [208, 80] },
    ],
  },
  // spark: the open hand (cupping and lifting from its wrist) and the spark above it (its glint,
  // core and the bright glow round it, turning about its heart); `emit`: the spark's heart
  // where the gift leaves from, `hit`: the palm, `wrist`: where the hand turns from, `palm`: its hollow
  'spark': {
    role: 'support', element: 'light', facing: 'left', emit: [152, 86], hit: [178, 150],
    wrist: [238, 166], palm: [178, 148],
    parts: [
      { name: 'hand', of: 'fig:0', pivot: [238, 166] },
      { name: 'spark', of: '[data-part=spark]', pivot: [152, 86] },
    ],
  },
  // spirit: the winged child of light: each wing (turning from the shoulder), the child (leaning
  // from its middle) and its halo (riding its head); `emit`: between its open hands where it
  // gathers its light and throws it from, `hit`: its middle, `hands`: its two hands, `head`: its crown
  'spirit': {
    role: 'attacker', element: 'spirit', facing: 'front', emit: [150, 90], hit: [150, 102],
    hands: [[127.5, 91.5], [172.5, 91.5]], head: [150, 72], shoulder: [150, 96],
    parts: [
      { name: 'wingL', of: '[data-part=wingL]', pivot: [146, 98] },
      { name: 'wingR', of: '[data-part=wingR]', pivot: [154, 98] },
      { name: 'child', of: '[data-part=child]', pivot: [150, 104] },
      { name: 'halo', of: '[data-part=halo]', pivot: [150, 80] },
    ],
  },
  // apex predator: the sabre-tooth as one body (leaping from its middle), its two front legs
  // split off at the shoulder (a swipe), the smouldering stripes and the face (eye and sabres);
  // `emit`: the claws' tips where the strike leaves from, `hit`: its chest, `shoulder`: where
  // the front legs hang from, `jaws`: the sabres' tips, `mid`: the body's centre it leaps about
  'apex-predator': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [234, 148], hit: [176, 110],
    shoulder: [194, 133], jaws: [226, 128], mid: [150, 104],
    parts: [
      { name: 'body', of: 'fig:2', pivot: [150, 104], poly: [[-10, -10], [310, -10], [310, 137], [180, 137], [180, 220], [-10, 220]] },
      { name: 'paws', of: 'fig:2', pivot: [194, 133], poly: [[180, 137], [310, 137], [310, 220], [180, 220]] },
      { name: 'stripes', of: '[data-part=stripes]', pivot: [150, 104] },
      { name: 'face', of: '[data-part=face]', pivot: [150, 104] },
    ],
  },
  // forbidden archivist: he (with his pale face, which is drawn over him) leaning from his feet, and
  // the book (and the black streams running off it) lifting from its near edge; `hit`: his chest,
  // `guard`: where the ward of ink-dark water he raises in front of the book takes blows,
  // `ward`: the foot of that ward, `book`: the open book's middle
  'forbidden-archivist': {
    role: 'defender', element: 'water', facing: 'right', hit: [145, 132],
    guard: [[217, 110], [220, 132], [217, 154]], ward: [208, 172], book: [180, 103], feet: [143, 172],
    parts: [
      { name: 'man', of: ['fig:0', '[data-part=face]'], pivot: [143, 172] },
      { name: 'book', of: '[data-part=book]', pivot: [168, 106] },
    ],
  },
  // we grow together: the pair is one silhouette joined at the hands; it's split down the clasp
  // into the dryad and the knight, each leaning in and growing from her / his feet;
  // `emit`: the clasped hands where the boon leaves, `hit`: their middle, `feet`: each one's feet
  'we-grow-together': {
    role: 'support', element: 'nature', facing: 'front', emit: [150, 118], hit: [150, 132],
    feet: [[132, 182], [169, 182]], heads: [[133, 90], [166, 88]],
    parts: [
      { name: 'dryad', of: 'fig:0', pivot: [132, 182], poly: [[-10, -10], [150, -10], [150, 220], [-10, 220]] },
      { name: 'knight', of: 'fig:0', pivot: [169, 182], poly: [[150, -10], [310, -10], [310, 220], [150, 220]] },
    ],
  },
  // funeral pyre: the three ghosts in the smoke (each from its middle), the column of fire (from
  // its base), the pyre and its shrouded body (cut so the flames behind it stay behind), the
  // little tongues of flame on its logs, and the two mourners (from their feet); `emit`: the
  // crown of the fire where the ghosts gather and the blast leaves, `hit`: the middle of the pyre,
  // `body`: the shrouded body (where the soul rises from), `ghosts`: each ghost's middle
  'funeral-pyre': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 62], hit: [150, 150],
    body: [150, 130], base: [150, 172], ghosts: [[96, 62], [206, 52], [156, 28]], feet: [[45, 214], [255, 214]],
    parts: [
      { name: 'ghost0', of: '[data-part=ghost0]', pivot: [96, 62] },
      { name: 'ghost1', of: '[data-part=ghost1]', pivot: [206, 52] },
      { name: 'ghost2', of: '[data-part=ghost2]', pivot: [156, 28] },
      { name: 'flames', of: '[data-part=flames]', pivot: [150, 172] },
      { name: 'pyre', of: 'fig:0', pivot: [150, 177] },
      { name: 'tongues', of: '[data-part=tongues]', pivot: [150, 165] },
      { name: 'mournerL', of: 'fig:1', pivot: [45, 214] },
      { name: 'mournerR', of: 'fig:2', pivot: [255, 214] },
    ],
  },
  // a thousand lights: the river of lights rising from the valley (turning about its mouth), the
  // watcher on the crag (from his feet) and his cloak (from his shoulders; one drawing, split
  // along the cloak's front edge); `emit`: the valley's mouth where the lights leave from,
  // `hit`: the watcher's chest, `feet`: where he stands, `head`: his hood's peak, `staff`: its top
  'a-thousand-lights': {
    role: 'support', element: 'spirit', facing: 'left', emit: [168, 150], hit: [82, 118],
    mouth: [168, 186], feet: [82, 152], head: [84, 90], staff: [94, 83], shoulder: [78, 100],
    parts: [
      { name: 'river', of: '[data-part=river]', pivot: [168, 188] },
      { name: 'watcher', of: 'fig:0', pivot: [82, 152], poly: [[-10, -10], [310, -10], [310, 220], [-10, 220], [-10, 142], [60, 142], [70, 142], [72, 132], [75, 128], [75, 96], [60, 96], [-10, 96]] },
      { name: 'cloak', of: 'fig:0', pivot: [78, 100], poly: [[60, 96], [75, 96], [75, 128], [72, 132], [70, 142], [60, 142]] },
    ],
  },
  // dawn captain: the captain's cloak (cut from her figure along its inner edge, swinging from her
  // shoulder) and the two spirit soldiers (one drawing, split down the middle, each turning from
  // his feet); `hit`: her chest, `guard`: where blows are taken (the cloak's face and hem, each
  // soldier's body, her chest), `spearTips`: the spears' heads, `gems`: each soldier's heart
  'dawn-captain': {
    role: 'defender', element: 'spirit', facing: 'front', hit: [150, 108],
    guard: [[181, 112], [187, 136], [216, 130], [84, 130], [150, 106]],
    shoulder: [160, 90], feet: [[84, 183], [216, 183]], spearTips: [[73, 87], [227, 87]],
    parts: [
      { name: 'cloak', of: 'fig:0', pivot: [160, 90], poly: [[163, 82], [205, 82], [205, 172], [176, 172], [171, 134], [170, 116], [166, 100]], cut: true, joint: 3 },
      { name: 'spiritL', of: '[data-part=spirits]', pivot: [84, 183], poly: [[-10, -10], [150, -10], [150, 220], [-10, 220]] },
      { name: 'spiritR', of: '[data-part=spirits]', pivot: [216, 183], poly: [[150, -10], [310, -10], [310, 220], [150, 220]] },
    ],
  },
  // stand together: the wall of knights cut into ten slices, one to a knight (each rising from his
  // feet in a wave as the light reaches him), the two banks of storm cloud (drawn apart from their
  // far edges) and the gap between them; `emit`: the heart of the light in the gap, `hit`: the
  // middle of the wall, `gems`: the glowing boss on each knight's shield, `feet`: where each
  // knight stands (nearest first), `gap`: the break in the cloud
  'stand-together': {
    role: 'support', element: 'light', facing: 'front', emit: [170, 14], hit: [137, 150],
    gap: [170, 12], gems: [[68, 140], [103.0, 139.0], [132.7, 138.2], [157.4, 137.4], [177.9, 137.4], [195.4, 137.9], [209.8, 138.3], [222.1, 139.1], [232.3, 139.8], [241.6, 141.1]], feet: [[74, 196], [108, 186], [137, 178], [161, 171], [181, 166], [198, 162], [212, 159], [224, 157], [234, 155.5], [243, 154.5]], scales: [1, 0.84, 0.71, 0.6, 0.51, 0.43, 0.37, 0.32, 0.28, 0.24],
    parts: [
      { name: 'cloudL', of: 'fig:0', pivot: [150, 10] },
      { name: 'cloudR', of: 'fig:1', pivot: [190, 10] },
      { name: 'k0', of: 'fig:2', pivot: [74, 196], poly: [[-10, -10], [91, -10], [91, 220], [-10, 220]] },
      { name: 'k1', of: 'fig:2', pivot: [108, 186], poly: [[91, -10], [122.5, -10], [122.5, 220], [91, 220]] },
      { name: 'k2', of: 'fig:2', pivot: [137, 178], poly: [[122.5, -10], [149, -10], [149, 220], [122.5, 220]] },
      { name: 'k3', of: 'fig:2', pivot: [161, 171], poly: [[149, -10], [171, -10], [171, 220], [149, 220]] },
      { name: 'k4', of: 'fig:2', pivot: [181, 166], poly: [[171, -10], [189.5, -10], [189.5, 220], [171, 220]] },
      { name: 'k5', of: 'fig:2', pivot: [198, 162], poly: [[189.5, -10], [205, -10], [205, 220], [189.5, 220]] },
      { name: 'k6', of: 'fig:2', pivot: [212, 159], poly: [[205, -10], [218, -10], [218, 220], [205, 220]] },
      { name: 'k7', of: 'fig:2', pivot: [224, 157], poly: [[218, -10], [229, -10], [229, 220], [218, 220]] },
      { name: 'k8', of: 'fig:2', pivot: [234, 155.5], poly: [[229, -10], [238.5, -10], [238.5, 220], [229, 220]] },
      { name: 'k9', of: 'fig:2', pivot: [243, 154.5], poly: [[238.5, -10], [310, -10], [310, 220], [238.5, 220]] },
    ],
  },
  // standard keeper: the keeper with his pole (leaning into the wind from his feet), the standard
  // streaming from the pole's head (turning from where it is tied on), his cloak streaming from
  // his shoulders (turning from its root); `emit`: the standard's tail, where the gust leaves
  // carrying his light downwind, `hit`: his chest, `feet`: where he stands, `flagRoot`/`cloakRoot`:
  // where the standard and the cloak turn, `finial`: the pole's head
  'standard-keeper': {
    role: 'support', element: 'wind', facing: 'left', emit: [250, 52], hit: [104, 128],
    feet: [112, 182], flagRoot: [75, 45], cloakRoot: [108, 100], finial: [73, 14], field: [236, 150],
    parts: [
      { name: 'flag', of: '[data-part=flag]', pivot: [75, 45] },
      { name: 'keeper', of: 'fig:0', pivot: [112, 182], poly: [[-10, -10], [112, -10], [112, 84], [112, 120], [124, 128], [148, 129], [168, 121], [174, 128], [193, 122], [196, 114], [212, 113], [212, 108], [206, 94], [174, 89], [140, 83], [112, 84], [112, -10], [310, -10], [310, 215], [-10, 215]] },
      { name: 'cloak', of: 'fig:0', pivot: [108, 100], poly: [[104, 86], [140, 83], [174, 89], [206, 94], [212, 108], [212, 113], [196, 114], [193, 122], [174, 128], [168, 121], [148, 129], [124, 128], [104, 122]] },
    ],
  },
  // rally: the captain's sword arm (turning from her shoulder, cut out of her figure), the gonfalon
  // hung from the crossbar (turning from its top), the rest of the captain with her pole and crossbar (cut so that the gonfalon
  // lies behind them as drawn) and the army below with its spears; `emit`: the sword's tip, where
  // her rallying light leaves from, `hit`: her chest, `crowd`: the middle of the army, where the
  // light lands when she is alone
  'rally': {
    role: 'support', element: 'light', facing: 'right', emit: [192, 17], hit: [161, 100],
    shoulder: [168, 92], crown: [144, 33], crowd: [150, 182],
    parts: [
      { name: 'banner', of: '[data-part=banner]', pivot: [144, 33] },
      { name: 'body', of: 'fig:0', pivot: [144, 152], poly: [[100, 5], [191, 5], [191, 12], [189, 36], [188, 54], [177, 55], [174, 60], [177, 72], [173, 84], [167, 86], [167, 98], [174, 99], [183, 88], [187, 74], [191, 72], [195, 66], [194, 54], [195, 36], [197, 12], [197, 5], [260, 5], [260, 170], [100, 170]] },
      { name: 'sword', of: 'fig:0', pivot: [168, 92], poly: [[162, 86], [173, 84], [177, 72], [174, 60], [177, 55], [188, 54], [189, 36], [191, 12], [197, 12], [195, 36], [194, 54], [195, 66], [191, 72], [187, 74], [183, 88], [174, 99], [162, 98]] },
      { name: 'army', of: 'fig:1', pivot: [150, 214] },
    ],
  },
  // twin souls: the two spirits at the helix's tips (each with its glow, from where it is), and the
  // helix of light they rise on (about its foot, in the field); `heads`: where each spirit is, `pool`: where they were born
  'twin-souls': {
    role: 'support', element: 'spirit', facing: 'front', emit: [165, 55],
    heads: [[139.5, 58.8], [190, 50]], pool: [162, 177],
    parts: [
      { name: 'helix', of: '[data-part=helix]', pivot: [162, 177] },
      { name: 'soul0', of: '[data-part=soul0]', pivot: [139.5, 58.8] },
      { name: 'soul1', of: '[data-part=soul1]', pivot: [190, 50] },
    ],
  },
  // the street recruit: the kid and his shield (with the sun painted on it, and its glint)
  // both lean from his feet; `boss`: the shield's centre, where his light leaves from
  'street-recruit': {
    role: 'attacker', element: 'light', facing: 'right', emit: [124, 147], hit: [93, 138],
    boss: [124, 147], feet: [100, 194],
    parts: [
      { name: 'kid', of: 'fig:1 [data-part=kid]', pivot: [100, 194] },
      { name: 'shield', of: ['fig:1 [data-part=shield]', '[data-part=sun]'], pivot: [100, 194] },
    ],
  },
  // the one who came back (a creature, an attacker: a towering revenant striding out of its barrow,
  // chains trailing): its body (legs, torso, helm and crown), the ragged cloak streaming behind
  // it, the two long arms (each with its claws, turning from its shoulder), the two chains that
  // hang from its wrists and the glints (the glow and seam of light on its chest); `emit`: its left
  // hand, where the lash of its chain leaves from (`handR`: the right hand, used when the target
  // lies to the right), `hit`: its chest, `shoulderL`/`shoulderR`: where the arms turn, `neck`:
  // where its helm sits, `feet`: where it stands, `cloakRoot`: where the cloak hangs from,
  // `bolt`: the lightning behind it, `barrow`: its open door
  'the-one-who-came-back': {
    role: 'attacker', element: 'shadow', facing: 'front', emit: [107, 138], hit: [146, 110],
    handR: [185, 138], shoulderL: [126, 80], shoulderR: [168, 80], neck: [147, 74], feet: [143, 186], cloakRoot: [166, 68], bolt: [226, 56], barrow: [248, 178],
    parts: [
      { name: 'body', of: '[data-part=rbody]', pivot: [143, 186] },
      { name: 'cloak', of: '[data-part=rcloak]', pivot: [166, 68] },
      { name: 'larm', of: '[data-part=rlarm]', pivot: [126, 80] },
      { name: 'rarm', of: '[data-part=rrarm]', pivot: [168, 80] },
      { name: 'chainL', of: '[data-part=rchainL]', pivot: [106, 142] },
      { name: 'chainR', of: '[data-part=rchainR]', pivot: [186, 142] },
      { name: 'glints', of: '[data-part=rglints]', pivot: [146, 90] },
    ],
  },
  // death is a door (a spell, an attacker: the stone door swings wide and takes a creature or a
  // relic through): the door's slab (swung back inside the frame, turning from its hinge), the
  // stone frame (two posts, lintel and step), the bright edge line of the right post and the
  // small wanderer standing in the light, who flinches from it; `emit`: the lit gap, where the
  // cold light gathers and the beam leaves from, `hit`: the stone frame, where blows land,
  // `hinge`: where the slab swings from, `wanderer`: his feet (the foe it takes when alone),
  // `lintel`: the frame's top
  'death-is-a-door': {
    role: 'attacker', element: 'spirit', facing: 'right', emit: [162, 112], hit: [150, 112],
    hinge: [135, 112], wanderer: [196, 200], lintel: [150, 40],
    parts: [
      { name: 'slab', of: '[data-part=slab]', pivot: [135, 112] },
      { name: 'frame', of: 'fig:0', pivot: [150, 176] },
      { name: 'edge', of: '[data-part=edge]', pivot: [166, 112] },
      { name: 'walker', of: 'fig:1', pivot: [196, 200] },
    ],
  },
  // borrowed time (a spell, a support: a creature returns from the discard pile for one turn: the
  // gift is the spirit that steps out of the hourglass): the ghostly knight's body (with the
  // resting arm), his raised arm (turning from the shoulder, with the hand under the hourglass), his
  // helm, the visor's glow, the cracked hourglass (turning about its middle) and the tomb in front
  // of him (the tomb, its panels and its shoved-aside lid), which he sinks behind and rises from;
  // `emit`: the hourglass, where the returning spirit gathers and leaves from, `hit`: his chest,
  // where the boon lands when alone, `shoulder`: where the raised arm turns, `neck`: where the
  // helm nods, `glass`: the hourglass's middle, `rim`: the tomb's lip
  'borrowed-time': {
    role: 'support', element: 'spirit', facing: 'front', emit: [194, 44], hit: [142, 124],
    shoulder: [160, 108], neck: [142, 98], glass: [194, 44], rim: 148,
    parts: [
      { name: 'body', of: '[data-part=kbody]', pivot: [142, 150] },
      { name: 'arm', of: '[data-part=karm]', pivot: [160, 108] },
      { name: 'head', of: '[data-part=khead]', pivot: [142, 98] },
      { name: 'visor', of: '[data-part=kvisor]', pivot: [142, 80] },
      { name: 'glass', of: '[data-part=glass]', pivot: [194, 44] },
      { name: 'tomb', of: 'fig:1', pivot: [150, 150] },
      { name: 'panels', of: '[data-part=panels]', pivot: [150, 175] },
      { name: 'lid', of: 'fig:2', pivot: [250, 165] },
    ],
  },
  // the bonepicker (a creature, an attacker with Soar: a gaunt vulture-horror on a broken wall): its
  // body (with the stubby extra legs), the ragged tail-wing, the great raised wing, its head (ruff,
  // long neck, beak and bald skull), its three long legs (each about its hip) and the cluster of
  // glowing eyes; `emit`: the beak's tip, where its strike leaves from, `hit`: the middle of its
  // body, `neck`: where the head swings from, `wingRoot`: where the wing turns, `eyes`: the
  // cluster's middle, `hips`: the three legs' joints, `feet`: its claws on the wall
  'bonepicker': {
    role: 'attacker', element: 'bone', facing: 'left', emit: [101, 146], hit: [170, 112],
    neck: [148, 100], wingRoot: [166, 92], tailRoot: [160, 110], eyes: [109, 122], hips: [[150, 122], [166, 130], [188, 128]], feet: [[127, 164], [157, 176], [198, 172]],
    parts: [
      { name: 'tail', of: 'fig:1 [data-part=tail]', pivot: [160, 110] },
      { name: 'body', of: 'fig:1 [data-part=body]', pivot: [168, 112] },
      { name: 'wing', of: 'fig:1 [data-part=wing]', pivot: [166, 92] },
      { name: 'head', of: 'fig:1 [data-part=head]', pivot: [148, 100] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [148, 100] },
      { name: 'leg1', of: 'fig:1 [data-part=leg1]', pivot: [150, 122] },
      { name: 'leg2', of: 'fig:1 [data-part=leg2]', pivot: [166, 130] },
      { name: 'leg3', of: 'fig:1 [data-part=leg3]', pivot: [188, 128] },
    ],
  },
  // unearth (a spell, a support: a creature comes back from the discard pile to your hand): the
  // skeletal arm (the two forearm bones, rising out of the grave by stretching from its foot), the
  // palm's bones, the five fingers (each about its base knuckle), the lip of fresh earth over the
  // arm's foot, the violet cracks in it and the clods on it; `emit`: the palm's heart, where the
  // returning spirit gathers and leaves from, `hit`: the arm, where its boon lands when alone,
  // `grave`: where the arm comes out of the earth, `bases`: the five fingers' base knuckles
  'unearth': {
    role: 'support', element: 'bone', facing: 'front', emit: [150, 104], hit: [151, 140],
    grave: [150, 178], bases: [[142, 118], [146, 114], [151, 113], [156, 114], [160, 118]],
    parts: [
      { name: 'arm', of: 'fig:0 [data-part=arm]', pivot: [150, 178] },
      { name: 'palm', of: 'fig:0 [data-part=palm]', pivot: [150, 124] },
      { name: 'f1', of: 'fig:0 [data-part=f1]', pivot: [142, 118] },
      { name: 'f2', of: 'fig:0 [data-part=f2]', pivot: [146, 114] },
      { name: 'f3', of: 'fig:0 [data-part=f3]', pivot: [151, 113] },
      { name: 'f4', of: 'fig:0 [data-part=f4]', pivot: [156, 114] },
      { name: 'f5', of: 'fig:0 [data-part=f5]', pivot: [160, 118] },
      { name: 'lip', of: 'fig:1', pivot: [150, 172] },
      { name: 'cracks', of: '[data-part=cracks]', pivot: [150, 172] },
      { name: 'clods', of: '[data-part=clods]', pivot: [150, 168] },
    ],
  },
  // the kindly undertaker (a creature, a support: he gains you life when your creatures die): his
  // lantern arm (with the lantern's frame, turning from the shoulder), the lantern's white-hot
  // glass, his head (nose, hat and brim), the glint in his eye, his tape arm and the measuring
  // tape hanging from it; `emit`: the lantern, where his gift of light gathers and leaves
  // from, `hit`: his chest, `shoulder`: where the lantern arm turns, `neck`: where his head
  // nods, `tapeShoulder`: where the tape arm turns, `tapeHand`: its hand, `coffins`: the
  // coffin rows' middles (where his own light falls when he is alone)
  'kindly-undertaker': {
    role: 'support', element: 'light', facing: 'left', emit: [110, 131], hit: [140, 116],
    shoulder: [134, 94], neck: [132, 88], tapeShoulder: [145, 95], tapeHand: [155, 126], coffins: [[40, 140], [214, 130]],
    parts: [
      { name: 'arm', of: 'fig:1 [data-part=lamparm]', pivot: [134, 94] },
      { name: 'lamp', of: '[data-part=lamp]', pivot: [134, 94] },
      { name: 'head', of: 'fig:1 [data-part=head]', pivot: [132, 88] },
      { name: 'glint', of: '[data-part=eyeglint]', pivot: [132, 88] },
      { name: 'tapearm', of: 'fig:1 [data-part=tapearm]', pivot: [145, 95] },
      { name: 'tape', of: '[data-part=tape]', pivot: [155, 127] },
    ],
  },
  // grave rat (a creature, an attacker with Venom: it digs at a grave, then lunges and bites): its
  // body (with the haunch and the spine), the ribs over it, its head (snout and ear), its
  // digging forelegs, its hind leg, its tail, its glowing eye and the bones on the heap; `emit`:
  // the snout's tip, where its bite and what it flings leave from, `hit`: the middle of its body,
  // `neck`: where the head turns, `hip`: where the rat rears from (its hind foot), `shoulder`:
  // where the forelegs turn, `eye`: the eye's centre, `dig`: the hole it digs at
  'grave-rat': {
    role: 'attacker', element: 'bone', facing: 'left', emit: [138, 166], hit: [195, 140],
    neck: [172, 134], hip: [227, 168], shoulder: [162, 150], eye: [154, 146], dig: [140, 178], tailRoot: [229, 143], bones: [242, 174],
    parts: [
      { name: 'body', of: ['fig:2 [data-part=body]'], pivot: [227, 168] },
      { name: 'head', of: 'fig:2 [data-part=head]', pivot: [172, 134] },
      { name: 'forelegs', of: 'fig:2 [data-part=forelegs]', pivot: [162, 150] },
      { name: 'hind', of: 'fig:2 [data-part=hind]', pivot: [224, 152] },
      { name: 'tail', of: 'fig:2 [data-part=tail]', pivot: [229, 143] },
      { name: 'ribs', of: '[data-part=ribs]', pivot: [227, 168] },
      { name: 'eye', of: '[data-part=eye]', pivot: [172, 134] },
      { name: 'bone', of: '[data-part=bone]', pivot: [242, 174] },
    ],
  },
  // something beneath (a creature, an attacker: a shadowy horror rising from the black lake): its
  // great body (with the horns and the inner tentacle), the two great arms and the two small
  // tentacles breaking the water at the edges (each about its foot at the waterline), the
  // eyes (and their glows) and the seam of violet light in its maw; `emit`: the seam, where its
  // darkness gathers and is breathed out, `hit`: the middle of its body, `waterline`: where it
  // rises from the lake, `eyes`: the eyes' middle
  'something-beneath': {
    role: 'attacker', element: 'shadow', facing: 'front', emit: [148, 126], hit: [150, 100],
    waterline: 151, eyes: [148, 92], feet: [150, 151], baseL: [100, 150], baseR: [200, 150],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [150, 151] },
      { name: 'armL', of: 'fig:0 [data-part=armL]', pivot: [100, 150] },
      { name: 'armR', of: 'fig:0 [data-part=armR]', pivot: [200, 150] },
      { name: 'tipL', of: 'fig:0 [data-part=tipL]', pivot: [54, 152] },
      { name: 'tipR', of: 'fig:0 [data-part=tipR]', pivot: [268, 152] },
      { name: 'eyes', of: ['[data-part=eyes]', '[data-part=eyeglow]'], pivot: [148, 92] },
      { name: 'seam', of: '[data-part=seam]', pivot: [148, 126] },
    ],
  },
  // perfect recall (a spell, a support: three spells come back from the discard pile to her hand):
  // the archivist's reaching arms (both forearms and hands, turning from the shoulder) and the
  // three scrolls rising out of the flood (each about its own middle); `emit`: her hands, where
  // the scrolls are gathered and leave from, `hit`: her chest, where the boon lands when alone,
  // `shoulder`: where the arms turn, `water`: where the scrolls rise from, `scrolls`: their
  // resting places (the last is nearest her hands)
  'perfect-recall': {
    role: 'support', element: 'water', facing: 'right', emit: [111, 92], hit: [82, 122],
    shoulder: [86, 94], water: [170, 160], scrolls: [[170, 154], [150, 124], [128, 92]],
    parts: [
      { name: 'arms', of: 'fig:1 [data-part=arms]', pivot: [86, 94] },
      { name: 'scrollA', of: '[data-part=scrollA]', pivot: [170, 154] },
      { name: 'scrollB', of: '[data-part=scrollB]', pivot: [150, 124] },
      { name: 'scrollC', of: '[data-part=scrollC]', pivot: [128, 92] },
    ],
  },
  // the deepwater leviathan (a creature, an attacker: it rises beside the tiny ship and drowns it in
  // a wave): its head (hide, brow and jaw line), the spines along it, the fangs hanging from the
  // jaw, the great eye, the water pouring off the jaw, the ship (with its lantern) and the
  // lightning in the sky; every part of the beast turns about `neck`, where it rears and
  // lunges from; `emit`: the jaw, where the wave leaves, `hit`: the cheek, `ship`: where the
  // ship sits (the target when alone), `eye`: the eye's centre
  'deepwater-leviathan': {
    role: 'attacker', element: 'water', facing: 'left', emit: [148, 106], hit: [250, 122],
    neck: [300, 150], eye: [205, 87], ship: [66, 148], shipFoot: [66, 152], bolt: [48, 58],
    parts: [
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [300, 150] },
      { name: 'spines', of: 'fig:0 [data-part=spines]', pivot: [300, 150] },
      { name: 'fangs', of: 'fig:0 [data-part=fangs]', pivot: [300, 150] },
      { name: 'eye', of: '[data-part=eye]', pivot: [300, 150] },
      { name: 'pour', of: '[data-part=pour]', pivot: [300, 150] },
      { name: 'ship', of: ['fig:1', '[data-part=lantern]'], pivot: [66, 152] },
      { name: 'bolt', of: '[data-part=bolt]', pivot: [48, 58] },
    ],
  },
  // countercurrent (a Trap, a defender: it swallows the next spell cast): the whirlpool's rings,
  // the fireball caught in the spout, the spout itself (column and its three fingers), the foam
  // and flames at its crest, and the calm mage's head; `hit`: the spout's middle, `guard`: where
  // spells strike it (the two fingers' outer faces and the crest's mouth), `base`: where the
  // spout rises from the pool, `heart`: the fireball's centre
  'countercurrent': {
    role: 'defender', element: 'water', facing: 'front', hit: [196, 104],
    guard: [[158, 64], [236, 64], [196, 44]], base: [196, 151], heart: [196, 62], head: [76, 108],
    parts: [
      { name: 'pool', of: '[data-part=pool]', pivot: [196, 150] },
      { name: 'fire', of: '[data-part=fire]', pivot: [196, 151] },
      { name: 'spout', of: '[data-part=spout]', pivot: [196, 151] },
      { name: 'crest', of: '[data-part=crest]', pivot: [196, 151] },
      { name: 'head', of: 'fig:1 [data-part=head]', pivot: [76, 112] },
    ],
  },
  // the mirror mage (a creature, an attacker: his spell goes into the mirror of water and comes
  // out doubled): his casting arm (with the hand), the orb of light in his hand, his hat, his
  // cloak, the mirror, the beam into it and the two beams out of it; `emit`: the mirror's heart,
  // where the doubled bolts leave, `hand`: his casting hand, where the spell is gathered,
  // `shoulder`: where the arm turns, `hit`: his chest, `mirror`: the mirror's centre and size
  'mirror-mage': {
    role: 'attacker', element: 'water', facing: 'right', emit: [206, 88], hit: [92, 118],
    hand: [130, 91], shoulder: [98, 101], mirror: [206, 88], feet: [94, 168],
    parts: [
      { name: 'arm', of: 'fig:1 [data-part=arm]', pivot: [98, 101] },
      { name: 'hat', of: 'fig:1 [data-part=hat]', pivot: [96, 82] },
      { name: 'cloak', of: 'fig:1 [data-part=cloak]', pivot: [90, 100] },
      { name: 'orb', of: '[data-part=orb]', pivot: [98, 101] },
      { name: 'mirror', of: '[data-part=mirror]', pivot: [206, 88] },
      { name: 'beamIn', of: '[data-part=beamIn]', pivot: [128, 91] },
      { name: 'beamsOut', of: '[data-part=beamsOut]', pivot: [212, 88] },
    ],
  },
  // the curious wisp (a creature, a support: it peeks at your top card and may send it to the bottom,
  // and draws a card): the tail, the head (body), the eyes, the pool's far lip (cut so it stays in
  // front of the head as the wisp rises over it) and the two little hands on the lip; `emit`: just
  // above its brow, where the card it peeks at appears and leaves from, `hit`: the middle of its
  // head, `eyes`: the two eyes as drawn, `head`: the centre of the head, `tailRoot`: where the
  // tail joins, `pool`: the still pool beneath it (where its card sinks when it is alone)
  'curious-wisp': {
    role: 'support', element: 'spirit', facing: 'front', emit: [166, 111], hit: [169, 131],
    eyes: [[161, 136], [178, 133]], head: [169, 131], tailRoot: [171, 118], pool: [170, 182],
    parts: [
      { name: 'tail', of: '[data-part=tail]', pivot: [171, 120] },
      { name: 'body', of: '[data-part=body]', pivot: [169, 140] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [169, 134] },
      { name: 'lip', of: '[data-part=lip]', pivot: [170, 150] },
      { name: 'handL', of: '[data-part=handL]', pivot: [150, 151.5] },
      { name: 'handR', of: '[data-part=handR]', pivot: [189, 150.6] },
    ],
  },
  // mossback (a creature, a support: it grows itself and gains life): its head and neck,
  // lifting from the shoulder, and the little tree on its shell, swaying from its foot;
  // `emit`: the tree's crown, where its gift gathers and leaves from, `hit`: the middle of
  // the shell, `flowers`: the four blossoms (three on the shell, one in the tree)
  'mossback': {
    role: 'support', element: 'nature', facing: 'right', emit: [142, 50], hit: [136, 118],
    neck: [196, 134], treeFoot: [140, 80], flowers: [[106, 84], [166, 79], [190, 99], [146, 44]],
    parts: [
      { name: 'head', of: ['fig:0 [data-part=head]', ':scope > [data-part=head]'], pivot: [196, 134] },
      { name: 'tree', of: 'fig:0 [data-part=tree]', pivot: [140, 80] },
    ],
  },
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
  // ancient roots (a spell, a support: it raises the Energy ceiling): the glowing stones the
  // roots coil round; `emit`: their heart, where the boon gathers and leaves from, `hit`: the
  // middle of the picture, `up`: where the great roots meet the tree's foot, in daylight (where
  // the boon goes alone), `veins`: the two glowing veins' control points, from the tree's foot
  // down round the stones (the move runs light along them)
  'ancient-roots': {
    role: 'support', element: 'nature', facing: 'front', emit: [152, 150], hit: [150, 110],
    up: [150, 40],
    veinA: [[126, 40], [112, 66], [102, 100], [104, 134], [116, 162], [138, 180], [164, 180], [184, 166], [190, 144], [182, 126]],
    veinB: [[174, 40], [190, 66], [198, 100], [190, 124], [170, 134], [150, 146], [132, 160], [118, 176]],
    parts: [
      { name: 'stones', of: '[data-part=stones]', pivot: [152, 152] },
    ],
  },
  // the patient giant (a creature, a defender: it takes arrows and only grows): its torso (the
  // arms and the round middle, cut at the waist so its legs stay planted), its head with the
  // little trees on its head and shoulders, its two glowing eyes, the seams in its bark and the
  // four arrows already stuck in its left shoulder; `guard`: where blows land on it, up its
  // left side from the shoulder, `hit`: its chest, `waist`: where it turns, `neck`: where its
  // head turns, `tips`: where the stuck arrows go in
  'patient-giant': {
    role: 'defender', element: 'nature', facing: 'front', hit: [155, 105], guard: [[130, 82], [125, 98], [131, 114]],
    waist: [155, 146], neck: [155, 72], tips: [131, 80], eyes: [[148.5, 55], [159.5, 55.5]], crowns: [[173, 56], [184, 70], [159, 38]],
    parts: [
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [155, 72] },
      { name: 'torso', of: 'fig:0 [data-part=torso]', pivot: [155, 146], poly: [[-20, -20], [320, -20], [320, 146], [-20, 146]], cut: true },
      { name: 'bark', of: '[data-part=bark]', pivot: [155, 146] },
      { name: 'arrows', of: '[data-part=arrows]', pivot: [155, 146] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [155, 72] },
    ],
  },
  // the worldtree stag (a creature, a support: it gives another creature +2/+2): its antlers
  // with the blossoms among their leaves, split at the crown into the left and the right
  // antler (each turning about the crown), and its head (with its eye), nodding from the neck's
  // top; `emit`: the sun caught between the antlers, where its gift gathers and leaves from,
  // `hit`: its flank, `crown`: where the antlers spring from the head, `neck`: where the head
  // turns, `blossoms`: the eight blossoms among the leaves
  'worldtree-stag': {
    role: 'support', element: 'nature', facing: 'left', emit: [112, 40], hit: [168, 128],
    crown: [112, 84], neck: [112, 92],
    blossoms: [[76, 20], [102, 16], [58, 22], [72, 48], [166, 28], [142, 14], [186, 26], [158, 48]],
    parts: [
      { name: 'antlersL', of: ['fig:0 [data-part=antlers]', '[data-part=blossoms]'], pivot: [112, 84], poly: [[-20, -20], [113, -20], [113, 230], [-20, 230]] },
      { name: 'antlersR', of: ['fig:0 [data-part=antlers]', '[data-part=blossoms]'], pivot: [112, 84], poly: [[113, -20], [320, -20], [320, 230], [113, 230]] },
      { name: 'head', of: ['fig:0 [data-part=head]', '[data-part=eye]'], pivot: [112, 92] },
    ],
  },
  // the forest remembers (a creature, an attacker: it overruns): the great crown, and each
  // bough raised like an arm from the shoulder (cut from the trunk, with the leaves at its twigs),
  // turning about its joint; `emit`: between its glowing eyes, where its attack gathers and
  // leaves from, `hit`: its chest, `eyes`: the two eyes, `mouth`: its closed mouth, `crown`: where
  // the crown rests on the trunk, `shoulders`: the boughs' joints
  'the-forest-remembers': {
    role: 'attacker', element: 'spirit', facing: 'front', emit: [150, 102], hit: [150, 130],
    eyes: [[137, 101], [163, 101]], mouth: [150, 131], crown: [150, 60], shoulders: [[126, 100], [174, 100]],
    parts: [
      { name: 'crown', of: 'fig:0 [data-part=crown]', pivot: [150, 60] },
      { name: 'armL', of: 'fig:0 [data-part=boughs]', pivot: [126, 100], poly: [[20, 50], [100, 52], [125, 54], [122, 76], [120, 88], [130, 100], [120, 112], [20, 118]], cut: true, joint: 14 },
      { name: 'armR', of: 'fig:0 [data-part=boughs]', pivot: [174, 100], poly: [[280, 50], [200, 52], [175, 54], [178, 76], [180, 88], [170, 100], [180, 112], [280, 118]], cut: true, joint: 14 },
      { name: 'tuftsL', of: 'fig:0 [data-part=tufts]', pivot: [126, 100], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'tuftsR', of: 'fig:0 [data-part=tufts]', pivot: [174, 100], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
    ],
  },
  // the memory diver (a creature, a support: it looks at your top three cards and keeps one): the
  // diver in pieces (body, the reaching arm and the swept-back arm each with its hand, the two
  // legs, the streaming hair and the head), each about its joint, and the page it reaches for;
  // `emit`: the page, where its gift leaves from, `hit`: its chest, `head`: where the kept
  // memory goes in alone, `page`: the page's centre, `shoulders`: the reaching arm's and the
  // back arm's, `hips`: the two legs' joints, `hands`: the two hands as drawn
  'memory-diver': {
    role: 'support', element: 'water', facing: 'right', emit: [224, 147], hit: [167, 93],
    head: [190, 106], page: [224, 147], neck: [180, 102], shoulders: [[177.6, 105.3], [176.2, 102.8]], hips: [[145.7, 75], [142.3, 79.8]], hands: [[214.4, 137], [147.5, 94.3]],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [170, 94] },
      { name: 'armF', of: 'fig:0 [data-part=armF]', pivot: [177.6, 105.3] },
      { name: 'armB', of: 'fig:0 [data-part=armB]', pivot: [176.2, 102.8] },
      { name: 'legA', of: 'fig:0 [data-part=legA]', pivot: [145.7, 75] },
      { name: 'legB', of: 'fig:0 [data-part=legB]', pivot: [142.3, 79.8] },
      { name: 'hair', of: 'fig:0 [data-part=hair]', pivot: [187.9, 99.7] },
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [180, 102] },
      { name: 'page', of: '[data-part=page]', pivot: [224, 147] },
    ],
  },
  // not yet (a Trick spell, a defender: the wave sweeps the attacker back): the whole wave (rearing up
  // about its foot at the lower left, so it never uncovers the beach), the goblin it tips over
  // (with his eye) and his tumbling spear; `hit`: the wave's face, `guard`: where it takes blows:
  // the crest's tip, the crest's top, the hollow's far wall and its floor, `goblin`: where the
  // goblin lies in the hollow, `sea`: where the wave sweeps him to, `spear`: its middle as drawn
  'not-yet': {
    role: 'defender', element: 'water', facing: 'right', hit: [150, 100],
    guard: [[226, 92], [196, 45], [118, 120], [178, 183]], goblin: [160, 118], sea: [262, 102], spear: [256, 62],
    parts: [
      { name: 'wave', of: '[data-part=wave]', pivot: [20, 200] },
      { name: 'goblin', of: ['fig:1 [data-part=goblin]', '[data-part=gobeye]'], pivot: [160, 118] },
      { name: 'spear', of: '[data-part=spear]', pivot: [256, 62] },
    ],
  },
  // second thought (a spell, a support: draw two cards, then discard one): the scholar in three pieces
  // (body, head, and the arm she reaches out with, each about its joint), her pale reflection
  // (shimmering about the waterline) and the two pages in it, each its own sprite; `emit`: where
  // she holds the pages to read, where the boon leaves from, `hit`: her middle, `shoulder`,
  // `neck`, `hand`: the arm's joint and its end as drawn, `pages`: where the two pages float as
  // drawn, `read`: where she holds them to read, `reach`: where her hand takes them, `water`: the
  // waterline, `knee`: where she kneels
  'second-thought': {
    role: 'support', element: 'water', facing: 'right', emit: [143, 72], hit: [116, 84],
    shoulder: [122, 65], neck: [130, 55], hand: [135, 88], pages: [151, 130], read: [143, 72], reach: [148, 106], water: 121, knee: [112, 110],
    parts: [
      { name: 'reflection', of: '[data-part=reflection]', pivot: [130, 121] },
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [112, 110] },
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [130, 55] },
      { name: 'arm', of: 'fig:0 [data-part=arm]', pivot: [122, 65] },
      { name: 'pageA', of: '[data-part=pageA]', pivot: [151, 130] },
      { name: 'pageB', of: '[data-part=pageB]', pivot: [151, 130] },
    ],
  },
  // sudden growth (a Trick that makes a creature enormous, a support: its boon is the growth): the fox's body
  // (head, chest, haunch and feet, squashing and rising from its feet), its tail (whipping up from its root) and
  // its eye (with the body), the roots heaving up each side with the buds at their tips (one pivot each, so they
  // move as one) and the two dark vines across the front with their berries; `emit`: the heart of the light at the
  // fox's feet where the boon leaves from, `hit`: the fox's chest, `feet`: where it grows from, `rootL`, `rootR`:
  // where each side's roots come out of the ground, `tailRoot`: the tail's joint, `head`: the fox's head
  'sudden-growth': {
    role: 'support', element: 'nature', facing: 'left', emit: [152, 176], hit: [156, 118],
    feet: [150, 186], rootL: [62, 196], rootR: [240, 196], tailRoot: [206, 170], head: [141, 78],
    parts: [
      { name: 'rootsL', of: '[data-part=rootsL]', pivot: [62, 196] },
      { name: 'rootsR', of: '[data-part=rootsR]', pivot: [240, 196] },
      { name: 'body', of: 'fig:0', pivot: [150, 186], poly: [[0, 0], [212, 0], [212, 210], [0, 210]] },
      { name: 'tail', of: 'fig:0', pivot: [206, 170], poly: [[212, 0], [300, 0], [300, 210], [212, 210]] },
      { name: 'eye', of: '[data-part=eye]', pivot: [150, 186] },
      { name: 'budsL', of: '[data-part=budsL]', pivot: [62, 196] },
      { name: 'budsR', of: '[data-part=budsR]', pivot: [240, 196] },
      { name: 'frontL', of: '[data-part=frontL]', pivot: [20, 200] },
      { name: 'frontR', of: '[data-part=frontR]', pivot: [290, 200] },
    ],
  },
  // canopy archer (a 2/2 with Reach that shoots down fliers, an attacker: the arrow is the attack): the dark winged
  // thing across the sun (jolted and knocked about when the arrow lands), the archer's body (legs, cloak, hood,
  // the draw arm: leaning and rocking from the hips) and what she aims, one joint for all (the bow, its arm cut
  // off at the elbow, the hand on the grip, the drawing hand, the string, the arrow and its glowing head),
  // so the bow turns toward the target as one; `emit`: the arrow's head, where the shot leaves from,
  // `hit`: her chest, `hips`: where she leans from, `aimAt`: the joint the bow turns about, `drawHand`: where
  // the string is drawn to, `tips`: the bow's tips, `mirrorX`: the line she is flipped about to face the other way
  'canopy-archer': {
    role: 'attacker', element: 'wind', facing: 'right', emit: [150, 82], hit: [106, 125],
    hips: [103, 177], aimAt: [118, 98], drawHand: [115, 94], tips: [[151, 113], [121, 70]], mirrorX: 105, bird: [222, 29],
    parts: [
      { name: 'bird', of: '[data-part=bird]', pivot: [222, 30] },
      { name: 'body', of: 'fig:1 [data-part=abody]', pivot: [103, 177], poly: [[0, 0], [127, 0], [127, 122], [200, 122], [200, 210], [0, 210]] },
      { name: 'bow', of: 'fig:1 [data-part=abody]', pivot: [118, 98], poly: [[127, 40], [200, 40], [200, 122], [127, 122]] },
      { name: 'hand', of: 'fig:1 [data-part=ahand]', pivot: [118, 98] },
      { name: 'draw', of: 'fig:1 [data-part=adraw]', pivot: [118, 98] },
      { name: 'string', of: 'fig:1 [data-part=astring]', pivot: [118, 98] },
      { name: 'arrow', of: 'fig:1 [data-part=aarrow]', pivot: [118, 98] },
      { name: 'tip', of: '[data-part=atip]', pivot: [118, 98] },
    ],
  },
  // grove druid (a 1/2 that plants a seed to grow Energy or to uproot a Relic; the picture shows the planting, so a
  // support: its boon is the growth): the druid's body (knees, robe, back, arms and hands: leaning in to the
  // seed and rising from the hips) and her antlered head (nodding about the neck, with the crown's band);
  // `emit`: the seed under her hands where the growth leaves from along the roots, `hit`: her back,
  // `hips`: where she leans from, `neck`: the head's joint, `ground`: the earth's surface line
  'grove-druid': {
    role: 'support', element: 'nature', facing: 'right', emit: [183, 171], hit: [146, 138],
    hips: [124, 176], neck: [162, 118], ground: 172,
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [124, 176] },
      { name: 'head', of: 'fig:0 [data-part=head]', pivot: [162, 118] },
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
  // she herself, leaning from her feet; `hands`: where the arc springs from (`emit`: the right
  // one, where the bolt leaves when it goes right; the move uses the left when it goes left),
  // `hit`: her chest, `sea`: where the bolt strikes the water when it has no other target
  'lightning-theorist': {
    role: 'attacker', element: 'lightning', facing: 'front', emit: [149, 67], hit: [118, 112],
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
    role: 'defender', element: 'light', facing: 'right', hit: [135, 138],
    guard: [[186, 122], [187, 142], [184, 164]],
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
