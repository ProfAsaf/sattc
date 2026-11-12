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
  // Ione, the Bloomcaller (a legend whose Spells discount and grow creatures for good: she gives boons, so a support,
  // not the suggested defender; the picture is her reading a spell out of the book into the blossoming tree): she
  // herself (rocking, turning to her target) with her wreath, the spell's two light strands rising off the pages
  // (they ride with her), and the tree's crown with its blossom; `emit`: the book's pages, where her gift leaves,
  // `hit`: her chest, `book`: the pages, `bough`: the crown where the spell lands when alone, `root`: her feet and
  // the line she turns about
  'legend-ione': {
    role: 'support', element: 'nature', facing: 'right', emit: [158, 92], hit: [128, 132],
    book: [158, 96], bough: [216, 60], root: [126, 194],
    parts: [
      { name: 'her', of: 'fig:2', pivot: [126, 194] },
      { name: 'wreath', of: '[data-part=wreath]', pivot: [126, 194] },
      { name: 'spell', of: '[data-part=spell]', pivot: [126, 194] },
      { name: 'crown', of: 'fig:1', pivot: [244, 96] },
      { name: 'blossom', of: '[data-part=blossom]', pivot: [244, 96] },
    ],
  },
  // Hush, the Fog Witch (a legend that stalls attacks on her: a defender; the fog is her water): she herself (a
  // body, her pale face and her long hair blown back, each its own piece), her lantern's glass, and the whole wall of
  // fog with the lost warriors in it; `hit`: her chest, `guard`: where blows are taken as she throws the fog up
  // before her (the lantern, her breast, the cloak's front; measured from her cut parts), `lamp`: the glass, `facing` her right
  'legend-hush': {
    role: 'defender', element: 'water', facing: 'right', hit: [140, 126], guard: [[177, 140], [155, 112], [148, 152]],
    lamp: [178, 140], root: [146, 194], head: [152, 78],
    parts: [
      { name: 'fog', of: '[data-part=fogwall]', pivot: [150, 120] },
      { name: 'her', of: 'fig:2', pivot: [146, 194] },
      { name: 'face', of: 'fig:3', pivot: [146, 194] },
      { name: 'hair', of: 'fig:4', pivot: [150, 80] },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [146, 194] },
    ],
  },
  // blight beetle (a 1/3 whose ability saps an enemy creature's lasting growth; the picture shows it gnawing the great
  // tree's glowing root with the leaves above withering: the blight is its attack, so an attacker, not the suggested
  // defender): the beetle in three pieces (its body, wing case and legs, rearing on its hind legs; the head with its jaws,
  // turning on the neck; the two antennae) and its shell's painted colours riding the body; `emit`: its jaws, where the blight
  // leaves from, `hit`: the middle of its wing cases, `rear`: where it rears from (the hind feet), `neck`: the head's
  // joint, `feelers`: where the antennae grow from, `bough`: the withering leaves above it (the target when alone)
  'blight-beetle': {
    role: 'attacker', element: 'nature', facing: 'left', emit: [104, 142], hit: [190, 108],
    rear: [232, 152], neck: [126, 122], feelers: [121, 114], bough: [150, 36],
    parts: [
      { name: 'body', of: 'fig:3', pivot: [232, 152], poly: [[131, 60], [320, 60], [320, 220], [80, 220], [80, 160], [108, 160], [112, 143], [131, 141]] },
      { name: 'head', of: 'fig:3', pivot: [126, 122], poly: [[80, 112], [131, 112], [131, 141], [112, 143], [108, 160], [80, 160]] },
      { name: 'ant', of: 'fig:3', pivot: [121, 114], poly: [[80, 60], [131, 60], [131, 112], [80, 112]] },
      { name: 'shell', of: '[data-part=shell]', pivot: [232, 152] },
    ],
  },
  // whispered doubt (a spell: the foe's costly card goes to the bottom of their deck, they draw, you draw: a boon of
  // cards, so a support; the picture shows the whisper itself): the shadow's upper body (leaning in at his ear from
  // the waist, sheared, not turned, so the cut stays seamless) with its two glowing eyes, its hand on the plans, the
  // sleeping king's head (nodding on its neck) and his slipping crown with the glint on it, the violet wisp that
  // curls out of the hood, in at his ear and up out of his head, and the candle's flame; `emit`: where the wisp rises
  // out of his head to carry the boon away, `hit`: his shoulder, `waist`: the line the shadow leans from, `neck`:
  // the king's neck joint, `dream`: where the wisp ends up (the target when alone)
  'whispered-doubt': {
    role: 'support', element: 'spirit', facing: 'right', emit: [190, 78], hit: [186, 130],
    waist: [110, 130], neck: [194, 119], dream: [244, 44], hood: [164, 96], ear: [190, 94],
    parts: [
      { name: 'torso', of: 'fig:0', pivot: [110, 130], poly: [[0, -20], [200, -20], [200, 130], [0, 130]], cut: true },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [110, 130] },
      { name: 'hand', of: 'fig:3', pivot: [118, 150] },
      { name: 'head', of: 'fig:1', pivot: [194, 119], poly: [[185, 60], [230, 60], [230, 118], [185, 118]], cut: true },
      { name: 'crown', of: '[data-part=crown]', pivot: [202, 95] },
      { name: 'twink', of: '[data-part=twink]', pivot: [208, 83] },
      { name: 'wisp', of: '[data-part=wisp]', pivot: [164, 96] },
      { name: 'flame', of: '[data-part=flame]', pivot: [279.5, 151] },
    ],
  },
  // pickpocket (a 1/2 flyer that, when it hits, makes the foe discard: the picture shows the magpie darting off with
  // the purse, so an attacker: its dive-bomb is the attack, the coins it flings are its element's... wind's gust and
  // glints): the magpie in pieces (the far wing, the body with eye, tail and belly, the little red cloak, the near
  // wing, the purse swinging from its beak) all turning, tilting and flipping as one body about `body`; the
  // merchant's shaking fist (his raised arm cut off at the shoulder, with the little marks of its shaking);
  // `emit`: its beak, where the strike leaves from, `hit`: its breast, `shoulderF`/`shoulderN`: where the far and
  // near wings turn, `beak`: where the purse hangs from, `merchant`: his head (the target when alone)
  'pickpocket': {
    role: 'attacker', element: 'wind', facing: 'left', emit: [87, 65], hit: [124, 78],
    body: [136, 80], shoulderF: [125, 69], shoulderN: [135, 72], beak: [90, 67], merchant: [240, 138],
    parts: [
      { name: 'farwing', of: '[data-part=farwing]', pivot: [125, 69] },
      { name: 'body', of: '[data-part=body]', pivot: [136, 80] },
      { name: 'cloak', of: '[data-part=cloak]', pivot: [136, 80] },
      { name: 'nearwing', of: '[data-part=nearwing]', pivot: [135, 72] },
      { name: 'purse', of: '[data-part=purse]', pivot: [90, 67] },
      { name: 'arm', of: 'fig:2', pivot: [236, 153], poly: [[215, 100], [235.5, 100], [235.5, 153], [215, 153]], cut: true },
      { name: 'shake', of: '[data-part=shake]', pivot: [236, 153] },
    ],
  },
  // Grave Robber (a 2/2 that, when played, sends each opponent's three costliest creatures from their discard pile to the bottom of their
  // deck: an attacker whose attack is the earth he heaves, and the graves it buries what was in them; a hooded robber climbing out of an open
  // crypt, a sack of grave goods over his shoulder and a hand on his shovel): his body from the ankles up (hood, back, the arm
  // that holds the shovel, the raised foot, with the violet light under it), the shovel (shaft, grip and blade, cut from the figure
  // beside the hand, turning about it), the sack (with its creases, swinging from his shoulder) and the gleam of stolen gold at its
  // neck; `emit`: the shovel's blade at rest, where the earth is flung from, `hit`: his back, `hand`: where the shovel is held
  // (it turns about it), `ankles`: where he leans from (the body is cut at the ankles; the legs below stay), `neck`: the sack's
  // neck, where it hangs, `grave`: the stair of the open crypt, `ground`: the cemetery to the right (the target when alone)
  'grave-robber': {
    role: 'attacker', element: 'earth', facing: 'right', emit: [221, 190], hit: [128, 118],
    hand: [166.8, 140.6], ankles: [120, 186], neck: [120.6, 86], grave: [144, 190], ground: [268, 170],
    parts: [
      { name: 'sack', of: 'fig:1', pivot: [120.6, 94.4] },
      { name: 'creases', of: '[data-part=creases]', pivot: [120.6, 94.4] },
      { name: 'under', of: '[data-part=under]', pivot: [120, 186], poly: [[-10, -10], [158, -10], [158, 126], [162.5, 134.6], [190, 161], [190, 186], [-10, 186]], cut: true, joint: 1 },
      { name: 'body', of: 'fig:2', pivot: [120, 186], poly: [[-10, -10], [158, -10], [158, 126], [162.5, 134.6], [190, 161], [190, 186], [-10, 186]], cut: true, joint: 2 },
      { name: 'shovel', of: 'fig:2', pivot: [166.8, 140.6], poly: [[158, 124], [172, 122], [240, 180], [240, 210], [190, 210], [190, 161], [162.5, 134.6], [158, 126]], cut: true, joint: 2 },
      { name: 'gleam', of: '[data-part=gleam]', pivot: [120.6, 86] },
    ],
  },
  // Tollkeeper (a 2/3 who draws a card whenever an opponent Invests: the toll paid is the card drawn, so a support whose boon is a
  // card of light sent from his lantern: a stern man in a gold-trimmed coat at the bridge gate, lantern raised in one hand and the
  // ledger open in the other, coins stacked on the gatepost): his lantern arm (cut from his figure at the shoulder, past the coat),
  // the lantern's glass and the glow round it (no longer a breathing ambient glow: it rides the lantern), the open ledger and
  // the coins stacked on the post (with their glint); `emit`: the lantern's heart, where the card of light leaves from, `hit`:
  // his chest, `shoulder`: where the arm turns (the lantern and its glow turn with it), `hand`: the ring the lantern hangs from,
  // `ledger`: the ledger's middle, `coins`: the stack on the post, `road`: the bridge's road ahead (the target when alone)
  'tollkeeper': {
    role: 'support', element: 'light', facing: 'front', emit: [142, 90], hit: [114, 126],
    shoulder: [116.6, 107], hand: [141.9, 77.8], ledger: [129.6, 123], coins: [52, 84], road: [226, 170],
    parts: [
      { name: 'arm', of: 'fig:1', pivot: [116.6, 107], poly: [[120.5, 111.5], [120.5, 101], [133, 97], [135, 70], [150, 70], [150, 104], [141, 108], [132, 111.5]], cut: true, joint: 3 },
      { name: 'lamp', of: '[data-part=lamp]', pivot: [116.6, 107] },
      { name: 'lampglow', of: '[data-part=lampglow]', pivot: [116.6, 107] },
      { name: 'ledger', of: '[data-part=ledger]', pivot: [129.6, 123] },
      { name: 'coins', of: '[data-part=coins]', pivot: [52, 93] },
    ],
  },
  // Choking Smoke (a Spell that takes 2 Energy from each opponent: a curse thrown at them, an attacker, its element the smoke itself,
  // shadow: the forge's chimney belches black smoke that rolls over the village and the forge-fire below chokes down to embers):
  // the great rolling mass of smoke left of the chimney (cut at the chimney, turning about the seam; the lit curls drawn on it
  // go with it) and the heap of embers in the forge's mouth; `emit`: the chimney's mouth, where the smoke pours from, `hit`:
  // the forge's body, `chimney`: the mouth, `seam`: where the mass is cut and turns, `embers`: the heap, `roofs`: the village's
  // roofs to the left (the target when alone)
  'choking-smoke': {
    role: 'attacker', element: 'shadow', facing: 'left', emit: [205, 46], hit: [190, 170],
    chimney: [205, 46], seam: [188, 24], embers: [205, 200], roofs: [56, 160],
    parts: [
      { name: 'smoke', of: 'fig:0', pivot: [188, 24], poly: [[-12, -12], [188, -12], [188, 150], [-12, 150]], cut: true, joint: 3 },
      { name: 'folds', of: '[data-part=folds]', pivot: [188, 24], poly: [[-12, -12], [188, -12], [188, 150], [-12, 150]], cut: true, joint: 1 },
      { name: 'embers', of: '[data-part=embers]', pivot: [205, 200] },
    ],
  },
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
  // role: attacker, element: bone; it faces right (its point is at the right); `emit`: its point, where the
  // blow leaves from; `hit`: its middle; `alone`: the foot of the right-hand stones, where it strikes when
  // nothing is aimed at
  'bone-lance': {
    role: 'attacker', element: 'bone', facing: 'right', emit: [248, 120.5], hit: [154, 96], alone: [274, 127],
    butt: [60, 72], point: [248, 120.5], axis: [0.9683, 0.2554], ground: [270, 128],
    parts: [
      { name: 'trail', of: '[data-part=trail]', pivot: [60, 72] },
      { name: 'lance', of: '[data-part=lance]', pivot: [60, 72] },
    ],
  },

  // ── lane B's puppets (bakeoff/recipe.md): new entries go just below this line ──
  // Oriel, Lady of Storms: her four wings (a pair each side, from the shoulders), her cloak of cloud (from
  // its middle), she herself (from her hips) with her raised arm (from its shoulder; the hand she calls the
  // rain with, up in the rain cloud) and her palm arm (the hand held out for the sun), her circlet and the
  // light in her palm. role: attacker (the suggestion was defender: she never blocks; her text counts Fields
  // and, at last, deals 2 to each opponent: the Lady of Storms hurls the storm), element: lightning (the storm
  // gathered in the rain cloud over her head); facing: front. `emit`: her raised hand, where the bolt leaves
  // (as drawn); `hit`: her middle; `shoulder`/`palmShoulder`: the arms' joints; `palm`: her open hand;
  // `cloud`: the heart of the rain cloud, where the storm gathers; `sun`: the sun she calls up; `alone`: the
  // sea under the rain, where her bolt strikes when nothing is aimed at
  'legend-oriel': {
    role: 'attacker', element: 'lightning', facing: 'front', emit: [118.5, 32.5], hit: [150, 100], shoulder: [143.4, 73.8], palmShoulder: [156.6, 73.8], palm: [184, 82], crownAt: [150, 52], cloud: [52, 32], sun: [252, 142], alone: [62, 150],
    parts: [
      { name: 'wingL', of: '[data-part=wings]', pivot: [146, 76], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [154, 76], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'cape', of: 'fig:1', pivot: [150, 140] },
      { name: 'torso', of: 'fig:2', pivot: [150, 150], poly: [[141, -20], [320, -20], [320, 73.6], [160, 73.6], [160, 92], [320, 92], [320, 230], [-20, 230], [-20, 77], [141, 77]] },
      { name: 'armUp', of: 'fig:2', pivot: [143.4, 73.8], poly: [[-20, -20], [141, -20], [141, 77], [-20, 77]] },
      { name: 'armP', of: 'fig:2', pivot: [156.6, 73.8], poly: [[160, 73.6], [320, 73.6], [320, 92], [160, 92]] },
      { name: 'crown', of: '[data-part=crown]', pivot: [150, 52] },
      { name: 'palmlight', of: '[data-part=palmlight]', pivot: [184, 82] },
    ],
  },
  // Hour of Glory: the leader out in front (one figure, with his pole; from his feet) and his banner (from the
  // top of its pole). The ranks, the other banners and the light streaming off the weapons stay as drawn: the
  // spell's light acts over them. role: support (as suggested: it gives every creature +3/+0 and Rush), element:
  // light (the dawn gold streaming off the weapons; the embers ride on it); `emit`: the sun, where the boon is
  // let go from; `hit`: the middle of the host; `alone`: the middle of the host, where the boon goes when nothing
  // is aimed at; `tips`: the weapon points, where the light streams from (the leader's last)
  'hour-of-glory': {
    role: 'support', element: 'light', facing: 'right', emit: [58, 92], hit: [150, 150], alone: [170, 142], feet: [236, 204], pole: [223, 66],
    tips: [[40, 98.6], [69.1, 113.9], [101.5, 101.1], [109.4, 83.3], [122.1, 103.8], [129.8, 81.2], [135.2, 97.1], [153.2, 91.2], [162.5, 106.2], [166.2, 87.8], [168.4, 101.6], [190, 98], [205.9, 100.8], [210.8, 117.2], [227.8, 98.8], [237.4, 121], [246.1, 108.2], [259.9, 111.3]],
    parts: [
      { name: 'leader', of: 'fig:3', pivot: [236, 204] },
      { name: 'banner', of: '[data-part=banner]', pivot: [223, 70] },
    ],
  },
  // Blitz Captain: the far riders (one figure), the near riders pouring past (one figure), her warhorse (from its
  // hind hooves), she herself with her banner's pole in her fist (the whole rider, from her seat), the banner
  // (from her seat, so it swings with her) and the flames on its tail. role: attacker (as suggested: Rush, she
  // charges), element: fire (the burning banner, the red horizon); facing: right (the horse, the charge);
  // `emit`: the banner's pole top, where the fire is flung from; `hit`: the horse's chest; `hoof`: the horse's
  // joint; `seat`: hers; `alone`: the red horizon, where the charge goes when nothing is aimed at
  'blitz-captain': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [130, 32], hit: [118, 140], alone: [262, 150],
    hoof: [112, 194], seat: [114, 104], tip: [130, 32],
    parts: [
      { name: 'far', of: 'fig:0', pivot: [226, 172] },
      { name: 'near', of: 'fig:1', pivot: [150, 190] },
      { name: 'steed', of: 'fig:2 [data-part=steed]', pivot: [112, 194] },
      { name: 'rider', of: 'fig:2 [data-part=rider]', pivot: [114, 104] },
      { name: 'flag', of: '[data-part=flag]', pivot: [114, 104] },
      { name: 'fire', of: '[data-part=fire]', pivot: [114, 104] },
    ],
  },
  // War Chest: the hoard heaped over the chest's rim (its top, from the middle of the chest; the trickle down the
  // front and the coins on the floor stay), the red banner thrown over the corner (from where it drapes over the rim),
  // the blue banner on its pole leaning on the side (from the pole's foot). role: aura (as suggested: a relic, the
  // place itself acts), element: light (the gold of the coins and the lantern); `heart`: the middle of the hoard,
  // where the light swells from; `lantern`: the lantern; `hit`: the chest's front
  'war-chest': {
    role: 'aura', element: 'light', facing: 'front', hit: [150, 176], heart: [152, 138], lantern: [92, 64],
    parts: [
      { name: 'hoard', of: '[data-part=hoard]', pivot: [152, 156], poly: [[90, 100], [225, 100], [225, 160], [90, 160]], cut: true },
      { name: 'redflag', of: '[data-part=redflag]', pivot: [118, 146] },
      { name: 'blueflag', of: '[data-part=blueflag]', pivot: [238, 204] },
    ],
  },
  // War Drummer: the column marching past (one figure, from the road), the two banners (one piece, from between
  // the poles) and the sun on them, the drum (shell, rope and legs, from its foot) and its skin (with the red
  // ring), the drummer (from her feet, without her arms), her two arms with their sticks (the raised one from
  // its shoulder, the one at the drum from its shoulder), her tabard (with its sun) and the rings of the beat
  // in the air (from the drum's head). role: support (as suggested: her other creatures hit harder), element:
  // light (the dawn gold of the beat); `emit`: the middle of the drum's head, where the boon leaves; `hit`:
  // her chest; `skin`: the drum head's middle; `shoulderB`, `shoulderF`: the arms' joints (`B` the raised
  // one); `tipF`: the stick's head on the drum; `feet`: her joint; `alone`: the column on the left, where
  // the boon goes when nothing is aimed at
  'war-drummer': {
    role: 'support', element: 'light', facing: 'left', emit: [120, 142], hit: [170, 130], alone: [56, 150],
    skin: [120, 142], shoulderB: [173, 107.5], shoulderF: [166.9, 109.5], tipF: [132.8, 138], tipB: [195.9, 68.3], feet: [172, 186], poles: [[210, 58], [242, 76]],
    parts: [
      { name: 'column', of: 'fig:0', pivot: [150, 168] },
      { name: 'flags', of: '[data-part=flags]', pivot: [226, 70] },
      { name: 'mark', of: '[data-part=mark]', pivot: [226, 70] },
      { name: 'drum', of: '[data-part=drum]', pivot: [120, 190] },
      { name: 'skin', of: '[data-part=skin]', pivot: [120, 190] },
      { name: 'body', of: 'fig:2 [data-part=body]', pivot: [172, 186] },
      { name: 'armB', of: 'fig:2 [data-part=armB]', pivot: [173, 107.5] },
      { name: 'armF', of: 'fig:2 [data-part=armF]', pivot: [166.9, 109.5] },
      { name: 'tabard', of: '[data-part=tabard]', pivot: [172, 186] },
      { name: 'beat', of: '[data-part=beat]', pivot: [120, 142] },
    ],
  },
  // Ash Squire: the boy himself (legs, body, head, hair and tunic, from his feet), his sword arm with its blade and
  // the glint along it (from the shoulder), his torch arm (from the shoulder) and the torch's flame streaming back
  // (from the torch's head). role: attacker (as suggested: Rush, he hits first), element: fire (the torch);
  // `emit`: the sword's point, where his attack leaves; `hit`: his chest; `shoulder`, `shoulderT`: the arms'
  // joints; `feet`: his joint; `torch`: the flame's root; `alone`: the ground ahead of him at the right,
  // where his fire strikes when nothing is aimed at
  'ash-squire': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [217.1, 135.8], hit: [159, 130], alone: [268, 140],
    shoulder: [166.5, 116], shoulderT: [163.2, 114.9], feet: [150, 190], torch: [172.4, 62.1],
    parts: [
      { name: 'body', of: 'fig:0 [data-part=body]', pivot: [150, 190] },
      { name: 'sword', of: ['fig:0 [data-part=sword]', '[data-part=bladeglint]'], pivot: [166.5, 116] },
      { name: 'torch', of: 'fig:0 [data-part=torch]', pivot: [163.2, 114.9] },
      { name: 'flame', of: '[data-part=flame]', pivot: [172.4, 62.1] },
    ],
  },
  // The Eye of the Storm: the six walls of cloud (each from the middle of the eye, the nearer ones a little lower:
  // inner wall first), the wind's spiral streaked through them, the lightning in the outer walls and the four gulls
  // wheeling in the calm (each from its own middle). role: aura (a Field), element: lightning (as suggested: the
  // storm's own flashes, and the gold light they pour into); `hit`: the eye's middle; `eye`: its centre and
  // radii (the gold disc); `walls`: each wall's joint; `gulls`: each gull's middle; `bolts`: where the lightning
  // strikes, as drawn
  'the-eye-of-the-storm': {
    role: 'aura', element: 'lightning', facing: 'front', hit: [150, 84], eye: [150, 84, 70, 54.6],
    walls: [[150, 84], [150, 89], [150, 94], [150, 99], [150, 104], [150, 109]],
    gulls: [[132, 72], [170, 92], [156, 62], [124, 98]], bolts: [[48, 39], [247, 168], [263, 39], [47, 159]],
    parts: [
      { name: 'wall0', of: '[data-part=wall0]', pivot: [150, 84] },
      { name: 'wall1', of: '[data-part=wall1]', pivot: [150, 89] },
      { name: 'wall2', of: '[data-part=wall2]', pivot: [150, 94] },
      { name: 'wall3', of: '[data-part=wall3]', pivot: [150, 99] },
      { name: 'wall4', of: '[data-part=wall4]', pivot: [150, 104] },
      { name: 'wall5', of: '[data-part=wall5]', pivot: [150, 109] },
      { name: 'spiral', of: '[data-part=spiral]', pivot: [150, 94] },
      { name: 'bolts', of: '[data-part=bolts]', pivot: [150, 94] },
      { name: 'gull0', of: '[data-part=gull0]', pivot: [132, 72] },
      { name: 'gull1', of: '[data-part=gull1]', pivot: [170, 92] },
      { name: 'gull2', of: '[data-part=gull2]', pivot: [156, 62] },
      { name: 'gull3', of: '[data-part=gull3]', pivot: [124, 98] },
    ],
  },
  // Keeper of the Skies: the storm front piled against her ward (its two figures and its cloud lines, from the
  // ward's foot), her raised arm with its hand (from her shoulder), her hair and scarf blown back (from the nape);
  // she herself, the lighthouse, the ward's own lines and the rail stay in the picture. role: defender (as
  // suggested: she holds the storm back), element: wind (as suggested); `hit`: her chest; `guard`: where the storm's
  // blows meet the ward (the ward is bowed toward the storm where her palm holds it), high to low; `palm`: her
  // hand; `shoulder`, `nape`: the joints; `foot`: where the ward meets the sea; `storm`: the storm's middle, where
  // its lightning gathers
  'keeper-of-the-skies': {
    role: 'defender', element: 'wind', facing: 'left', hit: [150, 96], guard: [[112.2, 48], [114.4, 74], [118.7, 100], [123.6, 120]],
    palm: [120.9, 34.7], shoulder: [149.4, 66.9], nape: [154.9, 49.4], foot: [126, 138], storm: [45, 70],
    parts: [
      { name: 'storm', of: ['fig:0', 'fig:1', '[data-part=stormlines]'], pivot: [112, 80] },
      { name: 'hair', of: 'fig:3 [data-part=hair]', pivot: [154.9, 49.4] },
      { name: 'arm', of: 'fig:3 [data-part=arm]', pivot: [149.4, 66.9] },
    ],
  },
  // Hallowed Ground: the far ring of standing stones with their lintels (one piece, from the ground at the
  // ring's middle), the low stone in the middle (from its foot), the two great near stones (from their feet), the
  // grass and flowers in the light (from the ground). role: aura (a Field), element: light (the suggestion was
  // earth: the stones are only where the light gathers; what the move is made of is the dawn's gold);
  // `hit`: the middle of the ring; `altar`: the top of the low stone, where the light rises from; `sun`: the
  // dawn in the gate; `gate`: the gap it shines through
  'hallowed-ground': {
    role: 'aura', element: 'light', facing: 'front', hit: [150, 150], altar: [150, 164], sun: [150, 120], gate: [150, 122],
    parts: [
      { name: 'ring', of: 'fig:0', pivot: [150, 158] },
      { name: 'altar', of: '[data-part=altar]', pivot: [150, 174] },
      { name: 'near', of: 'fig:1', pivot: [150, 178] },
      { name: 'grass', of: '[data-part=grass]', pivot: [150, 216] },
    ],
  },
  // Rolling Fog: the spearman's spear (from his hand), the swordsman's sword with the arm that holds it (from his
  // shoulder), the spearman's round shield (from its middle); the army and the fog bank stay in the picture
  // (the fog is ambient). role: aura (a Field), element: water (the suggestion was shadow: sea fog is mist off
  // the water); `hit`: the middle of the picture; `hand`, `shoulder`, `boss`: the joints; `front`: where the
  // two stand (feet); `tips`: spear heads of the army lost in the fog, to show through it
  'rolling-fog': {
    role: 'aura', element: 'water', facing: 'left', hit: [150, 120],
    hand: [95.3, 147.8], shoulder: [181.6, 126.7], boss: [118.4, 145.7], front: [[110, 194], [190, 196]],
    parts: [
      { name: 'spear', of: 'fig:0 [data-part=spear]', pivot: [95.3, 147.8] },
      { name: 'sword', of: 'fig:0 [data-part=sword]', pivot: [181.6, 126.7] },
      { name: 'shield', of: '[data-part=shield]', pivot: [118.4, 145.7] },
    ],
  },
  // Gale Winds: the lone tree grown flat on the cliff top (from its foot), the great curl of wind rolling up off
  // the cliff edge and over (from the edge), the seven gulls and the two kites riding it (each from its centre).
  // role: aura (a Field: the place itself acts), element: wind (the suggestion was water; what the place is made of
  // is the gale); `edge`: where the wind meets the cliff; `eye`: the middle of the curl; `foot`: the tree's joint;
  // `gulls`/`kites`: where each flies, as drawn; `hit`: the middle of the picture, over the cliff's top
  'gale-winds': {
    role: 'aura', element: 'wind', facing: 'left', hit: [150, 100], edge: [150, 120], eye: [112, 56], foot: [66, 113],
    gulls: [[206, 112], [254, 95], [182, 66], [64, 70], [276, 46], [30, 34], [228, 30]], kites: [[108, 60], [150, 28]],
    parts: [
      { name: 'tree', of: 'fig:1', pivot: [66, 113] },
      { name: 'curl', of: '[data-part=curl]', pivot: [160, 118] },
      { name: 'gull0', of: 'fig:2 [data-part=gull0]', pivot: [206, 112] },
      { name: 'gull1', of: 'fig:2 [data-part=gull1]', pivot: [254, 95] },
      { name: 'gull2', of: 'fig:2 [data-part=gull2]', pivot: [182, 66] },
      { name: 'gull3', of: 'fig:2 [data-part=gull3]', pivot: [64, 70] },
      { name: 'gull4', of: 'fig:2 [data-part=gull4]', pivot: [276, 46] },
      { name: 'gull5', of: 'fig:2 [data-part=gull5]', pivot: [30, 34] },
      { name: 'gull6', of: 'fig:2 [data-part=gull6]', pivot: [228, 30] },
      { name: 'kite0', of: 'fig:2 [data-part=kite0]', pivot: [108, 60] },
      { name: 'kite1', of: 'fig:2 [data-part=kite1]', pivot: [150, 28] },
    ],
  },
  // Storm Shepherd: the swan's two wings (each from where it joins the body), the swan herself (neck and tail),
  // the shepherdess (from her seat, without the crook), the crook with its golden hook (from her raised hand)
  // and the glint of light round the hook (with it), the flock of three small birds. role: support (she lifts
  // her Field: +2/+1), element: wind (the golden gale off the wings); `emit`: the hook's tip, where the gift
  // leaves; `hit`: the swan's chest; `seat`, `hand`, `wing`: the joints; `alone`: out over the sunlit sea of
  // cloud at the right, where the gale goes when nothing is aimed at
  'storm-shepherd': {
    role: 'support', element: 'wind', facing: 'right', emit: [172, 30], hit: [122, 146], seat: [132, 134], hand: [154.3, 78.8], wing: [128, 135], alone: [250, 118],
    parts: [
      { name: 'flock', of: 'fig:2', pivot: [55, 120] },
      { name: 'wingfar', of: '[data-part=wingfar]', pivot: [128, 135] },
      { name: 'wingnear', of: '[data-part=wingnear]', pivot: [128, 135] },
      { name: 'swan', of: 'fig:3', pivot: [120, 148] },
      { name: 'rider', of: 'fig:4', pivot: [132, 134], poly: [[88.0, 10.0], [88.0, 165.0], [175.0, 165.0], [175.0, 40.3], [173.0, 42.1], [173.0, 42.1], [173.0, 42.1], [173.0, 42.1], [172.9, 42.1], [172.9, 42.1], [172.9, 42.1], [171.2, 42.4], [171.2, 42.4], [171.1, 42.4], [171.1, 42.4], [171.1, 42.4], [171.1, 42.4], [171.1, 42.3], [169.5, 41.6], [169.5, 41.6], [169.5, 41.6], [169.4, 41.6], [169.4, 41.5], [169.4, 41.5], [168.6, 40.3], [168.6, 40.3], [168.6, 40.3], [168.6, 40.3], [168.6, 40.3], [168.6, 40.2], [168.6, 40.2], [168.5, 38.5], [168.5, 38.5], [168.5, 38.4], [168.5, 38.4], [168.5, 38.4], [168.5, 38.4], [168.5, 38.4], [168.5, 38.3], [168.5, 38.3], [171.7, 34.8], [172.3, 31.2], [170.3, 28.4], [167.1, 28.1], [166.0, 29.7], [166.0, 30.0], [165.8, 30.0], [164.4, 31.9], [164.3, 38.9], [164.3, 38.9], [152.3, 111.6], [152.2, 111.6], [152.2, 111.6], [152.2, 111.6], [152.2, 111.6], [152.2, 111.7], [152.2, 111.7], [152.2, 111.7], [152.2, 111.7], [152.2, 111.7], [152.1, 111.7], [152.1, 111.7], [152.1, 111.7], [152.1, 111.7], [152.1, 111.7], [152.0, 111.7], [152.0, 111.7], [145.5, 110.7], [145.5, 110.7], [145.5, 110.6], [145.5, 110.6], [145.4, 110.6], [145.4, 110.6], [145.4, 110.6], [145.4, 110.6], [145.4, 110.6], [145.4, 110.6], [145.4, 110.5], [145.4, 110.5], [145.3, 110.5], [145.3, 110.5], [145.3, 110.5], [145.3, 110.4], [145.3, 110.4], [157.8, 35.7], [158.3, 29.8], [158.3, 29.8], [158.3, 29.7], [158.3, 29.7], [158.3, 29.7], [158.3, 29.7], [158.3, 29.7], [160.0, 27.5], [160.0, 10.0]] },
      { name: 'crook', of: 'fig:4', pivot: [154.3, 78.8], poly: [[164.1, 38.9], [164.2, 31.8], [167.1, 27.9], [170.4, 28.2], [172.5, 31.1], [171.9, 34.9], [168.7, 38.5], [168.8, 40.2], [169.6, 41.4], [171.2, 42.2], [172.9, 41.9], [177.3, 38.0], [178.6, 29.7], [173.6, 22.8], [164.3, 22.1], [158.5, 29.8], [158.0, 35.8], [145.5, 110.5], [152.1, 111.5]] },
      { name: 'glint', of: '[data-part=glint]', pivot: [154.3, 78.8] },
    ],
  },
  // Weatherwitch: her cloak (from her shoulder), she herself (hair, hat and robes, from her feet, without the arm
  // that holds the jar up), that arm (from the shoulder), and the jar with the little storm in it (from its foot,
  // which rests on her hand). role: support (her Fields cost less, she brings one back), element: wind (the
  // jar's storm, let out); `emit`: the jar's heart, where the gift leaves; `hit`: her middle; `shoulder`: the
  // arm's joint; `hand`: where the jar sits; `feet`: her joint; `alone`: out over the sunlit sea at the
  // right, where her storm goes when nothing is aimed at
  weatherwitch: {
    role: 'support', element: 'wind', facing: 'right', emit: [143.9, 46.3], hit: [123, 135], shoulder: [127.2, 98.8], hand: [143.85, 58.3], feet: [121, 177], alone: [250, 134],
    parts: [
      { name: 'cloak', of: 'fig:2', pivot: [122, 97] },
      { name: 'her', of: 'fig:3', pivot: [121, 177], poly: [[60.0, 40.0], [60.0, 205.0], [180.0, 205.0], [180.0, 40.0], [157.5, 40.0], [133.8, 95.1], [125.3, 91.5], [147.5, 40.0]] },
      { name: 'arm', of: 'fig:3', pivot: [127.2, 98.8], poly: [[131.4, 100.6], [151.2, 54.7], [142.7, 51.1], [123.0, 97.0]] },
      { name: 'jar', of: '[data-part=jar]', pivot: [143.85, 58.3] },
    ],
  },
  // Seren, the Storm-Scholar: she herself (robes, scarf and all, from her feet), the staff (from her grip), the
  // coil of lightning and fire wound up it into the gap, and the open book in her other hand (from its middle).
  // role: support (she counts Spells and draws), element: lightning; `emit`: the staff's tip, where the gift
  // leaves; `hit`: her middle; `grip`: her hand on the staff; `book`: the book's middle; `feet`: her joint;
  // `alone`: over the sea at the right, where her gift goes when nothing is aimed at
  'legend-seren': {
    role: 'support', element: 'lightning', facing: 'right', emit: [183, 6], hit: [150, 130], grip: [178.4, 50], book: [112, 98], feet: [150, 184], alone: [262, 128],
    parts: [
      { name: 'her', of: 'fig:2', pivot: [150, 184] },
      { name: 'staff', of: '[data-part=staff]', pivot: [178.4, 50] },
      { name: 'coil', of: '[data-part=coil]', pivot: [178.4, 50] },
      { name: 'book', of: '[data-part=book]', pivot: [112, 98] },
    ],
  },
  // Mirelle, the Mask-Maker: the half-mask she holds up before her face (with its glow and the ribbon off it) and
  // she herself (the coat and all, from her feet). The masks on the walls are drawn with the room and stay.
  // role: support (her Tricks and Traps cost less, she draws), element: arcane (the violet light of the masks);
  // `emit`: the mask as she holds it, where the boon leaves; `hit`: her middle; `feet`: her joint; `alone`: the half-carved mask on the workbench, which she lends
  // her light to when nothing is aimed at
  'legend-mirelle': {
    role: 'support', element: 'arcane', facing: 'front', emit: [150, 45], hit: [150, 130], feet: [150, 194], alone: [252, 154],
    parts: [
      { name: 'her', of: 'fig:1', pivot: [150, 194] },
      { name: 'mask', of: '[data-part=mask]', pivot: [150, 45] },
    ],
  },
  // The Last Storm: the one great bolt (the channel, the fire wound round it and its forks, out of the storm's
  // eye) and the starburst where it strikes the tower. role: attacker (it deals damage), element: lightning;
  // `emit`: the storm's eye, where the bolt leaves; `hit`: the eye too (a spell: its heart); `alone`: the
  // tower's top, where it strikes when nothing is aimed at
  'the-last-storm': {
    role: 'attacker', element: 'lightning', facing: 'right', emit: [104, 64], hit: [104, 64], alone: [216, 112],
    parts: [
      { name: 'bolt', of: '[data-part=bolt]', pivot: [104, 64] },
      { name: 'glint', of: '[data-part=glint]', pivot: [216, 112] },
    ],
  },
  // The Arcane Well: the rope and bucket on the winch (hanging from the beam), the water brimming at the
  // top (the surface), the runes round the rim and the two threads of water running over it. `rim`: the
  // middle of the rim's water, where the light rises from; `top`: the lip of the rim; `runeAt`: the
  // runes' places round the rim, left to right
  'the-arcane-well': {
    role: 'aura', element: 'water', facing: 'front', hit: [150, 150], rim: [150, 122], beam: [150, 59],
    runeAt: [[100, 127.8], [105, 131.2], [113.2, 134.2], [123.9, 136.5], [136.5, 137.9], [150, 138.4], [163.5, 137.9], [176.1, 136.5], [186.8, 134.2], [195, 131.2], [200, 127.8]],
    parts: [
      { name: 'bucket', of: 'fig:0 [data-part=bucket]', pivot: [150, 59] },
      { name: 'water', of: '[data-part=water]', pivot: [150, 122] },
      { name: 'runes', of: '[data-part=runes]', pivot: [150, 124] },
      { name: 'spill', of: '[data-part=spill]', pivot: [147, 132] },
    ],
  },
  // Static Spark: the hand (sleeve and pointing finger; it swings from the far end of the sleeve, off the
  // picture's left), the crackling thread of lightning between fingertip and wick (with its glints and
  // sparks) and the shimmer of air round it. `emit`: the fingertip, where the spark leaves; `alone`: the
  // wick, where it lands when nothing is aimed at; `wrist`: the hand's joint
  'static-spark': {
    role: 'attacker', element: 'lightning', facing: 'right', emit: [149.6, 102], alone: [204.6, 99.4], wrist: [-4, 146],
    parts: [
      { name: 'hand', of: 'fig:1', pivot: [-4, 146] },
      { name: 'spark', of: '[data-part=spark]', pivot: [149.6, 102] },
      { name: 'shim', of: '[data-part=shim]', pivot: [177, 99] },
    ],
  },
  // Spellwright Apprentice: she (the figure, from her feet), her near arm cut from her shoulder (the two
  // parts split the figure at the shoulder's edge), the runes curling up out of the book (and the glow thread
  // they run on) and the ones already settled on her sleeve. `emit`: her fingertip, where the runes leave
  // her; `book`: the open book's heart, where the runes rise; `sleeve`: where they settle, and where
  // they go when nothing is aimed at; `shoulder`: the arm's joint
  'spellwright-apprentice': {
    role: 'support', element: 'arcane', facing: 'right', emit: [151, 124], hit: [104, 150],
    book: [168, 140], sleeve: [121, 114], shoulder: [125, 121], feet: [104, 192],
    parts: [
      { name: 'her', of: 'fig:1', pivot: [104, 192], poly: [[-20, -20], [320, -20], [320, 106], [125, 106], [125, 140], [320, 140], [320, 230], [-20, 230]] },
      { name: 'arm', of: 'fig:1', pivot: [125, 121], poly: [[125, 106], [160, 106], [160, 140], [125, 140]] },
      { name: 'curl', of: ['[data-part=thread]', '[data-part=curl]'], pivot: [168, 140] },
      { name: 'settled', of: '[data-part=settled]', pivot: [104, 192] },
    ],
  },
  // Grand Illusion: the fighters still on the field at the right (the three of them, one figure), the curtain
  // of seawater (its wall, the ones it took shown as shapes of bubbles inside it, the foam at its foot; it
  // surges forward by stretching from its left edge, about the foot of the picture) and the spray that
  // flies off its crest and front (carried forward with the front). `emit`: the crest, where the sweep of
  // spray leaves from; `alone`: the beast in the middle of the fighters, where the sweep lands when nothing
  // is aimed at; `front`: the wall's front edge at rest; `bodies`: points on the fighters (left to right),
  // where they come apart into bubbles
  'grand-illusion': {
    role: 'attacker', element: 'water', facing: 'right', emit: [222, 32], hit: [200, 100], alone: [262, 152],
    front: [176, 120], crest: [220, 34], foot: [0, 214],
    bodies: [[187, 114], [194, 136], [191, 160], [206, 168], [232, 160], [250, 146], [272, 148], [292, 156], [286, 130], [288, 152]],
    parts: [
      { name: 'fighters', of: 'fig:0', pivot: [255, 176] },
      { name: 'curtain', of: '[data-part=curtain]', pivot: [0, 214] },
      { name: 'spray', of: '[data-part=spray]', pivot: [220, 34] },
    ],
  },
  // The Puppeteer: his figure in three (the torso with hat, and the two arms, each about its shoulder), the control bar in each
  // hand, the two marionette knights (one figure, split down the middle at x=150, each about its feet) with
  // their swords (each about its hand), the strings from each bar down to its knight, and the glint where
  // the blades cross. `emit`: the right bar (`emitL`, the left's), where the thread of shadow leaves; `hit`:
  // his middle; `alone`: where the blades cross, which is where it strikes when nothing is aimed at;
  // `endsL`/`endsR`: where each bar's strings end on its knight; `handL`/`handR`: the sword bases;
  // `tipL`/`tipR`: the sword points
  'the-puppeteer': {
    role: 'attacker', element: 'shadow', facing: 'front', emit: [216, 34], emitL: [84, 34], hit: [150, 112], alone: [149, 127],
    barL: [83.6, 34], barR: [216.4, 34], shoulderL: [136, 58], shoulderR: [164, 58],
    feetL: [120, 184], feetR: [182, 184], handL: [141.3, 145.5], handR: [167.4, 135.4], tipL: [158, 128], tipR: [140, 126], clash: [149, 127],
    endsL: [[120.7, 135.8], [140.2, 145.5], [107.7, 150.4], [114.8, 172.8], [125.6, 172.8]],
    endsR: [[181.3, 135.8], [168.1, 135.4], [194.3, 150.4], [187.2, 172.8], [176.4, 172.8]],
    parts: [
      { name: 'torso', of: 'fig:0', pivot: [150, 184], poly: [[128, -20], [172, -20], [172, 80], [320, 80], [320, 230], [-20, 230], [-20, 80], [128, 80]] },
      { name: 'armL', of: 'fig:0', pivot: [136, 58], poly: [[-20, -20], [128, -20], [128, 80], [-20, 80]] },
      { name: 'armR', of: 'fig:0', pivot: [164, 58], poly: [[172, -20], [320, -20], [320, 80], [172, 80]] },
      { name: 'barL', of: '[data-part=barL]', pivot: [83.6, 34] },
      { name: 'barR', of: '[data-part=barR]', pivot: [216.4, 34] },
      { name: 'knightL', of: 'fig:1', pivot: [120, 184], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'knightR', of: 'fig:1', pivot: [182, 184], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'swordL', of: '[data-part=swordL]', pivot: [141.3, 145.5] },
      { name: 'swordR', of: '[data-part=swordR]', pivot: [167.4, 135.4] },
      { name: 'stringsL', of: '[data-part=stringsL]', pivot: [83.6, 34] },
      { name: 'stringsR', of: '[data-part=stringsR]', pivot: [216.4, 34] },
      { name: 'glint', of: '[data-part=glint]', pivot: [149, 127] },
    ],
  },
  // Gloom Stalker: the shade in its doorway (its body, and its pale eyes in the dark) and the long hands
  // and the foot that have come out round the frame, each with its poison (the beads at the fingertips
  // and the runs down from them) and the shadow it throws on the wall. One source, split in three by
  // polygons: the left hand (and arm) about its shoulder, the right hand about its shoulder, and the foot
  // about its knee. `emit`: the right hand's fingertips, where the thrown poison leaves from (`emitL`,
  // the left's); `tipsL`/`tipsR`: all eight fingertips; `shoulderL`/`shoulderR`: the joints; `alone`: the
  // corner below at the right, where it flings its poison when nothing is aimed at
  'gloom-stalker': {
    role: 'attacker', element: 'venom', facing: 'front', emit: [231, 124], emitL: [70, 98], hit: [152, 122], alone: [276, 182],
    shoulderL: [126, 116], shoulderR: [172, 124], knee: [166, 140], eyes: [147, 92], mid: [150, 150],
    tipsL: [[70, 87], [66, 102], [73, 121], [86, 131]], tipsR: [[231, 115], [235, 132], [227, 153], [212, 162]],
    pools: [[100, 176], [214, 178]],
    parts: [
      { name: 'body', of: ['fig:0', '[data-part=eyes]'], pivot: [150, 150] },
      { name: 'handL', of: ['fig:1', '[data-part=poisonL]', '[data-part=shadowL]', '[data-part=shadowR]', '[data-part=poisonR]', '[data-part=shadowF]'], pivot: [126, 116], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'handR', of: ['fig:1', '[data-part=poisonL]', '[data-part=shadowL]', '[data-part=shadowR]', '[data-part=poisonR]', '[data-part=shadowF]'], pivot: [172, 124], poly: [[150, -20], [320, -20], [320, 230], [200, 230], [200, 139], [150, 139]] },
      { name: 'foot', of: ['fig:1', '[data-part=poisonL]', '[data-part=shadowL]', '[data-part=shadowR]', '[data-part=poisonR]', '[data-part=shadowF]'], pivot: [166, 140], poly: [[150, 139], [200, 139], [200, 230], [150, 230]] },
    ],
  },
  // Reed Lurker: the merfolk hunter (his whole figure, with his eyes just above the water; both turn about
  // the middle of his coil) and the bone spear he holds (its shaft, its head and the pale line down it),
  // which turns about his hand and thrusts along its own length. `emit`: the spear's head, where the
  // thrown bone leaves from; `hand`: the joint; `tip`: the spear's point at rest; `surface`: the waterline
  // where it breaks through; `alone`: the reeds at the right, where it strikes when nothing is aimed at
  'reed-lurker': {
    role: 'attacker', element: 'bone', facing: 'front', emit: [201, 24], hit: [150, 142], alone: [262, 58],
    hand: [186.2, 128], tip: [201, 24], surface: [189.7, 104], coil: [150, 140],
    parts: [
      { name: 'mer', of: ['fig:0', '[data-part=eyes]'], pivot: [150, 140] },
      { name: 'spear', of: ['fig:1', '[data-part=spearline]'], pivot: [186.2, 128] },
    ],
  },
  // Bluff: the masked figure (with her mask and ribbons; from her feet), the small box behind her back
  // (its body, and its lid on a hinge at its left edge) and the light leaking from under the lid. The
  // box and its light ride with her. `emit`: the box's mouth, where the card of light leaves; `box`: its
  // middle; `alone`: where the card goes when nothing is aimed at (toward the player, below the picture's foot)
  'bluff': {
    role: 'support', element: 'arcane', facing: 'front', emit: [181.6, 135], hit: [166, 150], alone: [196, 200],
    feet: [166, 198], box: [181.6, 141.5], hinge: [175, 135.4], mouth: [181.6, 135.4],
    parts: [
      { name: 'figure', of: ['fig:1', '[data-part=mask]'], pivot: [166, 198] },
      { name: 'box', of: '[data-part=box]', pivot: [181.6, 141.5] },
      { name: 'lid', of: '[data-part=lid]', pivot: [175, 136] },
      { name: 'leak', of: '[data-part=leak]', pivot: [181.6, 136] },
    ],
  },
  // Turnabout: the swordsman (and his sword) turning over about his hips, and his double in the glass below
  // (the sea's reflection of him) turning the other way. `emit`: the sword's tip; `alone`: the double's middle,
  // where the swap lands when nothing is aimed at; `hips`/`mirror`: the two joints
  'turnabout': {
    role: 'support', element: 'water', facing: 'right', emit: [239.4, 36], hit: [176, 62], alone: [178, 168],
    hips: [174, 56], mirror: [174, 176],
    parts: [
      { name: 'swordsman', of: ['fig:0', '[data-part=sword]'], pivot: [174, 56] },
      { name: 'double', of: '[data-part=double]', pivot: [174, 176] },
    ],
  },
  // Morrow, the Bone Gardener: the arm that scatters the seed (cut from her figure left of x=131 between y=98 and
  // y=128; the rest of her stays in the picture). `hand`: the seed leaves it (`emit`); `shoulder`: the arm's joint
  // (where it meets her cloak); `lamp`: the lantern's heart on the spade; `hit`: her middle; `alone`: the grave
  // mound at the left, where the seed is sown when nothing is aimed at
  'legend-morrow': {
    role: 'support', element: 'nature', facing: 'left', emit: [112, 122], hit: [150, 140], alone: [62, 188],
    hand: [112, 122], shoulder: [131, 113], lamp: [192, 88], mounds: [[60, 190], [240, 190]],
    parts: [
      { name: 'arm', of: 'fig:1', pivot: [131, 113], poly: [[0, 98], [131, 98], [131, 128], [0, 128]], cut: true },
    ],
  },
  // Marisol, the Harbormistress: the figure (her whole silhouette, and the ledger under her arm) split about her
  // raised shoulder: `arm` (the lantern arm and the frame, everything above y=108 left of x=141) and `her` (the rest,
  // swaying about her feet); `lamplight`, the lantern's glass and its glow, moves with the arm. `lamp`: the lantern's
  // heart; `shoulder`: the arm's joint; `feet`: where she stands; `ward`: the dome of light she throws up (centre, radii);
  // `guard`: where blows land on it; `blows`: the river's surges when nothing is aimed at her
  'legend-marisol': {
    role: 'defender', element: 'water', facing: 'front', hit: [150, 124],
    guard: [[189, 112], [191, 134], [111, 112], [109, 134]],
    lamp: [125, 74], shoulder: [140, 103], feet: [150, 192], ward: [150, 132, 42, 60],
    blows: [{ at: 1000, to: [189, 112] }, { at: 1450, to: [191, 134] }],
    parts: [
      { name: 'ledger', of: 'fig:2', pivot: [150, 192] },
      { name: 'her', of: 'fig:1', pivot: [150, 192], poly: [[0, 0], [300, 0], [300, 210], [0, 210], [0, 108], [141, 108], [141, 100], [138, 90], [135, 80], [135, 40], [0, 40]] },
      { name: 'arm', of: 'fig:1', pivot: [140, 103], poly: [[0, 40], [135, 40], [135, 80], [138, 90], [141, 100], [141, 108], [0, 108]] },
      { name: 'lamplight', of: '[data-part=lamplight]', pivot: [140, 103] },
    ],
  },
  // Danse Macabre: the four near dancers (two ghosts and two skeletons, each tagged whole; the far two and the fire
  // stay in the picture). `fire`: the violet bonfire's heart, where the gift leaves from (`emit`); `feet`: each
  // dancer's footing; `ring`: where the summoned dead rise when nothing is aimed at (`alone`)
  'danse-macabre': {
    role: 'support', element: 'bone', facing: 'front', emit: [150, 138], hit: [150, 158], alone: [150, 188],
    fire: [150, 150], feet: [[86, 192], [214, 192], [36, 160], [266, 160]], ring: [150, 184],
    parts: [
      { name: 'ghostL', of: '[data-part=ghostL]', pivot: [38, 158] },
      { name: 'ghostR', of: '[data-part=ghostR]', pivot: [264, 158] },
      { name: 'skelL', of: '[data-part=skelL]', pivot: [86, 192] },
      { name: 'skelR', of: '[data-part=skelR]', pivot: [214, 192] },
    ],
  },
  // Mire Witch: the lantern arm (cut from her figure: right of x=155 between y=81 and y=110; the rest of her stays in
  // the picture), the lantern's glass, and the seven will-o'-wisps (each a glowN, its violet glow, and a wispN, its
  // flame). `lamp`: the lantern's glass, where the wisps gather and the attack leaves from (`emit`); `shoulder`: the
  // arm's joint; `feet`: where she stands in the water; `hit`: her chest; `wisps`: each one's heart and size; `alone`:
  // the open water before the dead tree, where the drain goes when nothing is aimed at
  'mire-witch': {
    role: 'attacker', element: 'spirit', facing: 'right', emit: [170, 98], hit: [146, 128], alone: [236, 128],
    lamp: [170, 98], shoulder: [153, 92], feet: [146, 173],
    wisps: [[96, 118, 1.2], [116, 82, 1], [210, 70, 1.1], [228, 122, 1.3], [80, 72, 0.8], [252, 94, 0.9], [132, 142, 0.8]],
    parts: [
      { name: 'arm', of: 'fig:0', pivot: [153, 92], cut: true, poly: [[155, 81], [182, 81], [182, 110], [155, 110]] },
      { name: 'glass', of: '[data-part=glass]', pivot: [153, 92] },
      { name: 'glow0', of: '[data-part=wg0]', pivot: [96, 121.6] },
      { name: 'wisp0', of: '[data-part=wf0]', pivot: [96, 121.6] },
      { name: 'glow1', of: '[data-part=wg1]', pivot: [116, 85] },
      { name: 'wisp1', of: '[data-part=wf1]', pivot: [116, 85] },
      { name: 'glow2', of: '[data-part=wg2]', pivot: [210, 73.3] },
      { name: 'wisp2', of: '[data-part=wf2]', pivot: [210, 73.3] },
      { name: 'glow3', of: '[data-part=wg3]', pivot: [228, 125.9] },
      { name: 'wisp3', of: '[data-part=wf3]', pivot: [228, 125.9] },
      { name: 'glow4', of: '[data-part=wg4]', pivot: [80, 74.4] },
      { name: 'wisp4', of: '[data-part=wf4]', pivot: [80, 74.4] },
      { name: 'glow5', of: '[data-part=wg5]', pivot: [252, 96.7] },
      { name: 'wisp5', of: '[data-part=wf5]', pivot: [252, 96.7] },
      { name: 'glow6', of: '[data-part=wg6]', pivot: [132, 144.4] },
      { name: 'wisp6', of: '[data-part=wf6]', pivot: [132, 144.4] },
    ],
  },
  // Bone Tithe: the skeletal hand (with its sleeve and its outline) holding the coin, the coin (the glints' bloom,
  // cut round the coin), and the heap of bones and coins on the altar. `coin`: the coin's heart, where the hand
  // holds it; `emit`: the coin, where the boon (the card drawn) leaves from; `heap`: the heap's top, where the
  // coin is set down; `elbow`: where the arm turns; `eyes`: the watcher's eyes; `alone`: the dark of the arch
  // above the watcher, where the drawn card goes when nothing is aimed at
  'bone-tithe': {
    role: 'support', element: 'bone', facing: 'left', emit: [148, 112], hit: [150, 96], alone: [150, 22],
    coin: [148, 112], heap: [150, 121], elbow: [300, 40], eyes: [[145.9, 70.4], [154.1, 70.4]], candles: [[62, 117], [74, 126], [224, 124], [237, 114]],
    parts: [
      { name: 'heap', of: '[data-part=heap]', pivot: [150, 146] },
      { name: 'hand', of: ['fig:3 [data-part=hand]', '[data-part=sleeve]', '[data-part=handline]'], pivot: [300, 40] },
      { name: 'coin', of: '[data-part=glints]', pivot: [148, 112], cut: true, poly: [[148, 86], [166, 94], [174, 112], [166, 130], [148, 138], [130, 130], [122, 112], [130, 94]] },
    ],
  },
  // Grave Harvest: the gravedigger (cut from his figure in two: his arms, fists and the leaves in them, right of
  // x=96 between y=96 and y=134; and the rest of him from his feet), the pale roots trailing from the bulbs, the
  // three glowing bulbs and the glow on the grave's mouth. `hands`: his fists, where the bulbs hang from;
  // `shoulder`: the arms' joint; `feet`: his feet, about which he leans; `bulbs`: each bulb's heart and radius;
  // `emit`: the bulbs' middle, where his gift leaves; `hit`: his chest; `grave`: the open grave's mouth; `alone`: the
  // lantern on its post, where the gift goes when nothing is aimed at
  'grave-harvest': {
    role: 'support', element: 'nature', facing: 'right', emit: [140, 144], hit: [92, 150], alone: [266, 112],
    hands: [128.6, 121], shoulder: [96, 114], feet: [96, 190], grave: [160, 175], lamp: [271, 103],
    bulbs: [[140, 140, 7.8], [127, 147.6, 6.2], [152.6, 149.4, 5.8]],
    parts: [
      { name: 'body', of: 'fig:1', pivot: [96, 190], poly: [[-20, -20], [320, -20], [320, 96], [96, 96], [96, 134], [320, 134], [320, 230], [-20, 230]] },
      { name: 'arms', of: 'fig:1', pivot: [96, 114], poly: [[96, 96], [320, 96], [320, 134], [96, 134]] },
      { name: 'roots', of: '[data-part=roots]', pivot: [128.6, 121] },
      { name: 'bulbs', of: '[data-part=bulbs]', pivot: [128.6, 121] },
      { name: 'graveglow', of: '[data-part=graveglow]', pivot: [160, 175] },
    ],
  },
  // The Merchant Tortoise: its head and neck (cut from the body at x=100, with the creases and the glowing eye),
  // its shell and legs above the waterline (the rest of the figure, cut at y=172.5 so the legs stay in the water,
  // with the moss and plates that ride it), the town on its back (towers, tents, bunting, lit windows) and the
  // three boats, each on its own. `neck`: the head's joint; `mouth`: its snout; `foot`: its near fore foot at the
  // waterline, where the stomp lands and its attack leaves; `emit`: the same; `hit`: the shell's face; `axis`:
  // the body's middle, about which it turns to face a target on its right; `alone`: the open water ahead of it,
  // where the surge goes when nothing is aimed at
  'the-merchant-tortoise': {
    role: 'attacker', element: 'nature', facing: 'left', emit: [98, 170], hit: [150, 122], alone: [16, 160],
    neck: [100, 140], mouth: [46, 117], foot: [98, 170], axis: 172, waterline: 172.5, boats: [[54, 190], [152, 198], [270, 184]],
    parts: [
      { name: 'shell', of: 'fig:0', pivot: [172, 172], poly: [[100.5, -20], [320, -20], [320, 172.5], [100.5, 172.5]], cut: true },
      { name: 'shellfx', of: '[data-part=shellfx]', pivot: [172, 172] },
      { name: 'head', of: 'fig:0', pivot: [100, 140], poly: [[-20, -20], [100.5, -20], [100.5, 172.5], [-20, 172.5]], cut: true },
      { name: 'face', of: '[data-part=face]', pivot: [100, 140] },
      { name: 'eye', of: '[data-part=eye]', pivot: [100, 140] },
      { name: 'town', of: ['fig:1', '[data-part=bunting]', '[data-part=windows]'], pivot: [172, 172] },
      { name: 'boatL', of: 'fig:2', pivot: [54, 190], poly: [[-20, 150], [100, 150], [100, 230], [-20, 230]] },
      { name: 'boatM', of: 'fig:2', pivot: [152, 198], poly: [[100, 150], [210, 150], [210, 230], [100, 230]] },
      { name: 'boatR', of: 'fig:2', pivot: [270, 184], poly: [[210, 150], [320, 150], [320, 230], [210, 230]] },
    ],
  },
  // Compound Interest: the stream of light winding up out of the open ledger, the pages riding it and the coins
  // between them (each cut whole, turning together about the book), and the book's two leaves. `emit`: the heart
  // of the spiral, where its gift leaves (pages and coins peel off all along it); `book`: the ledger's spine;
  // `hit`: the desk's front; `alone`: the sea outside the cave mouth, where the gift goes when nothing is aimed at
  'compound-interest': {
    role: 'support', element: 'water', facing: 'front', emit: [172, 100], hit: [172, 165], alone: [46, 120],
    book: [172, 150], top: [172, 44],
    parts: [
      { name: 'stream', of: '[data-part=stream]', pivot: [172, 146] },
      { name: 'pages', of: '[data-part=pages]', pivot: [172, 146] },
      { name: 'coins', of: '[data-part=coins]', pivot: [172, 146] },
      { name: 'book', of: '[data-part=book]', pivot: [172, 152] },
    ],
  },
  // Pearl Diver: her pearl arm (cut from her at the shoulder: what lies right of x=160 between y=92 and y=130),
  // her legs (cut from her below the hip: everything below the line through the hip), and the pearl itself
  // (cut from its bloom). `emit`: the pearl as drawn, where her gift leaves; `hit`: her chest; `shoulder`: the
  // pearl arm's joint; `hip`: where the legs join; `alone`: open water up and to the right, where the
  // gift goes when nothing is aimed at
  'pearl-diver': {
    role: 'support', element: 'water', facing: 'right', emit: [183, 118], hit: [150, 101], alone: [236, 66],
    shoulder: [162, 91], hip: [141, 120],
    parts: [
      { name: 'arm', of: 'fig:0', pivot: [162, 91], poly: [[160, 92], [200, 92], [200, 130], [168, 130]], cut: true },
      { name: 'legs', of: 'fig:0', pivot: [141, 120], poly: [[82, 83], [141, 120], [162, 133], [170, 200], [50, 200], [50, 83]], cut: true },
      { name: 'pearl', of: '[data-part=pearl]', pivot: [183, 118] },
    ],
  },
  // The Granary: the door's glow and the heap of grain spilling out of it (both from the glowing door and
  // slope), the baskets (and their hoops) the grain pours into, the sheaves on the hill and the wheat
  // standing in the near corner. `door`: the doorway's foot, where the grain spills out; `baskets`: their
  // three mouths; `roof`: the finial's tip, where the stored light goes; `sun`: the sun on the delta; an
  // aura isn't aimed: `hit`: the drum's middle
  'the-granary': {
    role: 'aura', element: 'earth', facing: 'front', hit: [124, 124],
    door: [124, 148], baskets: [[100, 166], [126, 170], [151, 164]], roof: [124, 39], sun: [240, 100],
    parts: [
      { name: 'doorglow', of: '[data-part=doorglow]', pivot: [124, 146] },
      { name: 'grain', of: '[data-part=grain]', pivot: [124, 148] },
      { name: 'baskets', of: ['fig:4', '[data-part=hoops]'], pivot: [126, 176] },
      { name: 'stooks', of: 'fig:1', pivot: [60, 196] },
      { name: 'wheat', of: 'fig:6', pivot: [22, 216] },
    ],
  },
  // Shieldwright: the smith's raised hammer arm and her tongs arm (each cut from her figure at the shoulder: the
  // hammer, its handle and the arm up to it; the arm and tongs right of her torso), the shield on the anvil
  // (its glassy pane is baked into the picture; the rim, its highlights and the boss are cut), the sparks off it
  // and the stack of finished shields leaning behind her. `emit`: the shield on the anvil, where the gift
  // leaves; `hit`: her chest; `anvil`: the anvil's hot face; `alone`: the warrior at the forge door, where
  // the gift goes when nothing is aimed at
  'shieldwright': {
    role: 'support', element: 'light', facing: 'right', emit: [182, 139], hit: [104, 148], alone: [262, 128],
    anvil: [177, 158], shoulder: [116.5, 132.5], tongs: [128, 138], stackAt: [46, 166],
    parts: [
      { name: 'hammer', of: 'fig:2', pivot: [116.5, 132.5], poly: [[88, 62], [134, 62], [134, 133], [117.5, 133], [116.5, 118], [114, 104], [104, 98], [88, 98]], cut: true },
      { name: 'tongs', of: 'fig:2', pivot: [128, 138], poly: [[128, 124], [180, 124], [180, 152], [128, 152]], cut: true },
      { name: 'forged', of: '[data-part=forged]', pivot: [182, 139] },
      { name: 'sparks', of: '[data-part=sparks]', pivot: [182, 139] },
      { name: 'stack', of: '[data-part=stack]', pivot: [46, 166] },
    ],
  },
  // Ward of Dawn: the huge claw out of the storm (its spined arm and talons, with the scales on it), the glow
  // on each talon's tip and the sparks flying where they strike (both ride the claw, about the cloud it
  // comes from), the soldier crouched under the dome (from his feet), the dome (its rim and rings, and its
  // glassy fill, from the ground) and the rings of light on the ground at its foot. `hit`: the soldier's
  // chest; `guard`: where blows land on the glass (the four talons' tips, high to low, then the same four on
  // the dome's left); `tips`: where the talons strike as drawn; `shoulder`: the claw's joint in the cloud;
  // `dome`: its centre at the ground and its two radii
  'ward-of-dawn': {
    role: 'defender', element: 'light', facing: 'left', hit: [144, 150],
    guard: [[166, 112.4], [183, 120.7], [196.7, 133.4], [207.2, 150], [134, 112.4], [117, 120.7], [103.3, 133.4], [92.8, 150]],
    tips: [[166, 112.4], [183, 120.7], [196.7, 133.4], [207.2, 150]], shoulder: [300, 8], dome: [150, 190, 66, 80], feet: [144, 190],
    parts: [
      { name: 'claw', of: ['fig:2', '[data-part=scales]'], pivot: [300, 8] },
      { name: 'tipglow', of: '[data-part=tipglow]', pivot: [300, 8] },
      { name: 'sparks', of: '[data-part=sparks]', pivot: [300, 8] },
      { name: 'soldier', of: 'fig:1', pivot: [144, 190] },
      { name: 'domefill', of: '[data-part=domefill]', pivot: [150, 190] },
      { name: 'dome', of: '[data-part=dome]', pivot: [150, 190] },
      { name: 'rings', of: '[data-part=rings]', pivot: [150, 190] },
    ],
  },
  // Aegis Acolyte: the kneeling knight (one figure, from his knee), the acolyte (all but her two raised arms,
  // from her feet), her arms (cut from her at the sleeves: what lies right of x=96 between y=100 and y=138),
  // the orbs of light in her hands, the threads of light running from them to the dome, the dome (its rim and
  // rings, and its glassy fill) and its four last panes, each flying in on its own. `emit`: between her
  // raised hands, where her gift leaves; `hit`: her middle; `alone`: the dome's heart over the knight, where
  // the gift goes when nothing is aimed at; `dome`: its centre at the ground and its two radii
  'aegis-acolyte': {
    role: 'support', element: 'light', facing: 'right', emit: [107, 106], hit: [86, 150], alone: [198, 150],
    shoulder: [96, 120], feet: [84, 191], dome: [198, 191, 54, 76], seat: [200, 191],
    parts: [
      { name: 'knight', of: 'fig:0', pivot: [200, 191] },
      { name: 'her', of: 'fig:1', pivot: [84, 191], poly: [[-20, -20], [320, -20], [320, 100], [96, 100], [96, 138], [320, 138], [320, 230], [-20, 230]] },
      { name: 'arms', of: 'fig:1', pivot: [96, 120], poly: [[96, 100], [320, 100], [320, 138], [96, 138]] },
      { name: 'orbs', of: '[data-part=orbs]', pivot: [96, 120] },
      { name: 'threads', of: '[data-part=threads]', pivot: [107, 106] },
      { name: 'domefill', of: '[data-part=domefill]', pivot: [198, 191] },
      { name: 'dome', of: '[data-part=dome]', pivot: [198, 191] },
      { name: 'pane0', of: '[data-part=pane0]', pivot: [198, 191] },
      { name: 'pane1', of: '[data-part=pane1]', pivot: [198, 191] },
      { name: 'pane2', of: '[data-part=pane2]', pivot: [198, 191] },
      { name: 'pane3', of: '[data-part=pane3]', pivot: [198, 191] },
    ],
  },
  // Prism Duelist: the sylph in her lunge (all but her sword arm, from her middle), her sword arm (from the
  // shoulder; the hand with it), the rapier of light in it (about the same shoulder), her two pairs of glassy
  // wings (from where they join her back), the bubble round her (its rim, rings and glint, about its middle),
  // the flecks of colour in its skin, the fan of rainbow the blade throws beyond it and the rainbow at its foot.
  // `emit`: the rapier's point at the skin; `hit`: her chest; `guard`: the bubble's skin (right side, high to
  // low, then left); `centre`/`radius`: the bubble; `shoulder`: the sword arm's joint; `tip`: the point as drawn
  'prism-duelist': {
    role: 'defender', element: 'light', facing: 'right', emit: [206, 77], hit: [147, 100],
    guard: [[197.5, 58.7], [208, 92], [200.2, 121.2], [102.5, 125.3], [92, 92], [102.5, 58.7]],
    centre: [150, 92], radius: 58, shoulder: [153, 83], tip: [206, 77], roots: [145, 86], waist: [146, 106],
    parts: [
      { name: 'wings', of: '[data-part=wings]', pivot: [145, 86] },
      { name: 'her', of: 'fig:0', pivot: [146, 106], poly: [[-20, -20], [320, -20], [320, 76], [157, 76], [157, 90], [320, 90], [320, 230], [-20, 230]] },
      { name: 'arm', of: 'fig:0', pivot: [153, 83], poly: [[157, 76], [320, 76], [320, 90], [157, 90]] },
      { name: 'blade', of: '[data-part=blade]', pivot: [153, 83] },
      { name: 'bubble', of: '[data-part=bubble]', pivot: [150, 92] },
      { name: 'sheen', of: '[data-part=sheen]', pivot: [150, 92] },
      { name: 'fan', of: '[data-part=fan]', pivot: [206, 77] },
      { name: 'foot', of: '[data-part=foot]', pivot: [150, 92] },
    ],
  },
  // Sunglass Lancer: the horse at full stretch (cut into its body, with the tail and head, and its
  // fore and hind legs, each from where it meets the belly), the rider in his mirrored armour (one
  // piece, about his hips), the haze of light along the lance, the lance of sunlight itself (a
  // glint at its tip), and the cracks and splinters of glass in his armour. `emit`: the lance's
  // tip; `butt`: where it is couched under his arm; `hit`: his chest; `alone`: just beyond the
  // picture, where the lance's light goes when nothing is aimed at; `hooves`: the horse's feet
  'sunglass-lancer': {
    role: 'attacker', element: 'light', facing: 'right', emit: [290, 100], hit: [120, 112], butt: [116, 117], tip: [290, 100], alone: [340, 110], hooves: [116, 188],
    parts: [
      { name: 'horse', of: 'fig:0', pivot: [116, 188], poly: [[-20, -20], [320, -20], [320, 230], [185, 230], [185, 152], [117, 152], [117, 230], [104, 230], [104, 152], [40, 152], [40, 230], [-20, 230]] },
      { name: 'foreleg', of: 'fig:0', pivot: [128, 152], poly: [[117, 152], [185, 152], [185, 230], [117, 230]] },
      { name: 'hindleg', of: 'fig:0', pivot: [94, 152], poly: [[40, 152], [104, 152], [104, 230], [40, 230]] },
      { name: 'rider', of: 'fig:1', pivot: [122, 134] },
      { name: 'haze', of: '[data-part=haze]', pivot: [116, 117] },
      { name: 'lance', of: '[data-part=lance]', pivot: [116, 117] },
      { name: 'shards', of: '[data-part=shards]', pivot: [95, 100] },
    ],
  },
  // Backdraft: the white-hot door (the arch's fill), the blast of fire bursting out of it (tongues
  // and core, one piece about the arch's heart), the four attackers (one figure: the shading is
  // a gradient over its own box, so they move as a line) and the one caught black in the arch.
  // `emit`: the arch's heart, where the blast leaves; `hit`: the blast's middle; `alone`: where its
  // fire goes when nothing is aimed at (the attackers on the right, then those on the left: each
  // attacking creature takes it); `feet`: where the line's feet stand
  'backdraft': {
    role: 'attacker', element: 'fire', facing: 'front', emit: [150, 140], hit: [150, 150],
    alone: [[236, 160], [66, 160]], feet: [150, 196],
    parts: [
      { name: 'hot', of: '[data-part=hot]', pivot: [150, 150] },
      { name: 'blast', of: '[data-part=blast]', pivot: [150, 150] },
      { name: 'crew', of: 'fig:0', pivot: [150, 200] },
      { name: 'caught', of: '[data-part=caught]', pivot: [150, 178] },
    ],
  },
  // Grave Snare: the rearing horse and its rider (one figure, turning about its planted hind hooves),
  // the rune ring cut in the turf with the cracks of light running out of it, and the bony hands:
  // the two gripping its hind legs (one path), two clawing up on the left (one path), one on the
  // right, one far left, each rising from its wrist. `emit`: the middle of the ring, where the
  // snare's grip leaves; `hit`: the horse's chest; `alone`: its hind legs, where the snare closes
  // when nothing is aimed at; `hooves`: where the hind hooves stand
  'grave-snare': {
    role: 'support', element: 'bone', facing: 'left', emit: [150, 188], hit: [160, 96], alone: [178, 160], hooves: [172, 185],
    reach: [[170, 170], [128, 168], [200, 172]],
    parts: [
      { name: 'horse', of: 'fig:0', pivot: [172, 185] },
      { name: 'ring', of: '[data-part=ring]', pivot: [150, 188] },
      { name: 'grips', of: '[data-part=grips]', pivot: [171, 196] },
      { name: 'boneAC', of: '[data-part=boneAC]', pivot: [132, 205] },
      { name: 'boneB', of: '[data-part=boneB]', pivot: [200, 205] },
      { name: 'boneD', of: '[data-part=boneD]', pivot: [108, 205] },
    ],
  },
  // Fog Bank: the towering bank of fog (its three rows of billows, rolling in about its far corner),
  // the shore, then the charging warriors, each in its depth with the sheets of fog drifting over
  // it: the two far ones, a veil, the third, a veil, the fourth, a veil, the two near ones, and the
  // rocks (shore and rocks stay still, but must lie in their place over the others). `hit`: the
  // bank's middle; `guard`: where blows meet the face of the bank (high to low); `feet`: each
  // warrior's feet as drawn (far to near); `corner`: the bank's far corner
  'fog-bank': {
    role: 'defender', element: 'water', facing: 'left', hit: [230, 100], guard: [[156, 70], [160, 112], [148, 152]],
    corner: [318, 160], feet: [[244, 151], [218, 156], [188, 163], [150, 172], [104, 184], [52, 199]],
    parts: [
      { name: 'bank', of: ['fig:0', 'fig:1', 'fig:2'], pivot: [318, 160] },
      { name: 'shore', of: '[data-part=shore]', pivot: [150, 160] },
      { name: 'farmen', of: '[data-part=farmen]', pivot: [231, 153] },
      { name: 'veil0', of: '[data-part=veil0]', pivot: [250, 150] },
      { name: 'man2', of: '[data-part=man2]', pivot: [188, 163] },
      { name: 'veil1', of: '[data-part=veil1]', pivot: [250, 150] },
      { name: 'man3', of: 'fig:3', pivot: [150, 172] },
      { name: 'veil2', of: '[data-part=veil2]', pivot: [200, 190] },
      { name: 'near', of: 'fig:4', pivot: [78, 191] },
      { name: 'rocks', of: 'fig:5', pivot: [150, 200] },
    ],
  },
  // Mirror Shield: the tall golden kite shield with its reflection and rim (it rocks about its point
  // in the earth), the horned brute charging it (with its eye, standing on its feet), and the burst
  // of light where the claws meet. `hit`: the shield's middle; `guard`: where blows land on its
  // face (the claw's meeting point, the upper face, the lower face); `point`: the shield's foot;
  // `claw`: where the brute's claws meet the shield; `feet`: the brute's feet
  'mirror-shield': {
    role: 'defender', element: 'light', facing: 'left', hit: [196, 110], guard: [[158, 96], [186, 72], [194, 132]],
    point: [196, 176], claw: [154, 96], feet: [46, 169],
    parts: [
      { name: 'shield', of: ['fig:0', '[data-part=shield]'], pivot: [196, 176] },
      { name: 'brute', of: ['fig:1', '[data-part=eye]'], pivot: [46, 169] },
      { name: 'burst', of: '[data-part=burst]', pivot: [154, 96] },
    ],
  },
  // Pitfall: the aurochs pitching into the pit (with its eye), the torn leaf-carpet lip and the
  // snapped sticks in front of the pit, the vines on the pit's left and on its right (with the
  // lights on their tips), each turning about its root. `hit`: the beast's flank; `guard`: where
  // blows meet the pit (its left lip, its middle, its right lip); `pit`: its middle; `hoof`: the
  // beast's planted hoof; `roots`: where each side's vines come out of the edge
  'pitfall': {
    role: 'defender', element: 'nature', facing: 'left', hit: [165, 135], guard: [[48, 178], [124, 170], [200, 184]],
    pit: [124, 178], hoof: [228, 172], roots: [[58, 190], [199, 191]],
    parts: [
      { name: 'bull', of: ['fig:0', '[data-part=eye]'], pivot: [228, 172] },
      { name: 'lip', of: '[data-part=lip]', pivot: [124, 190] },
      { name: 'vinesL', of: ['fig:1', '[data-part=vtips]'], pivot: [58, 190], poly: [[-20, -20], [110, -20], [110, 230], [-20, 230]] },
      { name: 'vinesR', of: ['fig:1', '[data-part=vtips]'], pivot: [199, 191], poly: [[110, -20], [320, -20], [320, 230], [110, 230]] },
    ],
  },
  // Lumen, Mother of Moths: her two wings (split down the middle, each beating about its root;
  // her body stays), and each of the fourteen little moths that spiral
  // out from under her wings (with the glow behind it), each about its own middle.
  // `moths`: where each sits as drawn (x, y, size); `emit`: under her wings, where the swarm
  // leaves; `alone`: the meadow on her right, where her light goes when nothing is aimed at
  'legend-lumen': {
    role: 'support', element: 'light', facing: 'front', emit: [150, 128], hit: [150, 96],
    roots: [[146, 90], [154, 90]], alone: [232, 152], moths: [[157.4, 145, 0.52], [175.8, 155, 0.57], [198.8, 157.4, 0.62], [224.2, 147.9, 0.67], [252.3, 133.7, 0.72], [266.3, 110.2, 0.76], [259.8, 82.8, 0.81], [142, 148.6, 0.52], [124.8, 151.8, 0.57], [103.6, 160.6, 0.62], [67.2, 148.3, 0.67], [58.3, 137.4, 0.72], [44.1, 116.8, 0.76], [45.5, 85.3, 0.81]],
    parts: [
      { name: 'wingL', of: '[data-part=wings]', pivot: [146, 90], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [154, 90], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'moth0', of: '[data-part=moth0]', pivot: [157.4, 145] },
      { name: 'moth1', of: '[data-part=moth1]', pivot: [175.8, 155] },
      { name: 'moth2', of: '[data-part=moth2]', pivot: [198.8, 157.4] },
      { name: 'moth3', of: '[data-part=moth3]', pivot: [224.2, 147.9] },
      { name: 'moth4', of: '[data-part=moth4]', pivot: [252.3, 133.7] },
      { name: 'moth5', of: '[data-part=moth5]', pivot: [266.3, 110.2] },
      { name: 'moth6', of: '[data-part=moth6]', pivot: [259.8, 82.8] },
      { name: 'moth7', of: '[data-part=moth7]', pivot: [142, 148.6] },
      { name: 'moth8', of: '[data-part=moth8]', pivot: [124.8, 151.8] },
      { name: 'moth9', of: '[data-part=moth9]', pivot: [103.6, 160.6] },
      { name: 'moth10', of: '[data-part=moth10]', pivot: [67.2, 148.3] },
      { name: 'moth11', of: '[data-part=moth11]', pivot: [58.3, 137.4] },
      { name: 'moth12', of: '[data-part=moth12]', pivot: [44.1, 116.8] },
      { name: 'moth13', of: '[data-part=moth13]', pivot: [45.5, 85.3] },
    ],
  },
  // Ymra, Heart of the Mountain: each arm braced on the slopes (cut from the stone about its
  // shoulder), her head (cut at the neck) with its face and eyes, the woods on her shoulders
  // and arms, and the fire in her chest (its veins, and the heart). The rest of her is the
  // mountain and does not move. `guard`: the left forearm, the right forearm, her chest, the
  // woods on her left and right shoulders; `heart`: the fire; `alone`: where her own blows come from
  'legend-ymra': {
    role: 'defender', element: 'earth', facing: 'front', hit: [150, 118], guard: [[64, 138], [236, 138], [150, 118], [108, 92], [192, 92]],
    heart: [150, 120], shoulders: [[96, 104], [204, 104]], neck: [150, 80], feet: [150, 190],
    parts: [
      { name: 'armL', of: 'fig:0', pivot: [96, 104], poly: [[-20, 82], [100, 82], [100, 98], [93, 112], [90, 130], [91, 152], [94, 166], [-20, 166]], cut: true, joint: 5 },
      { name: 'armR', of: 'fig:0', pivot: [204, 104], poly: [[320, 82], [200, 82], [200, 98], [207, 112], [210, 130], [209, 152], [206, 166], [320, 166]], cut: true, joint: 5 },
      { name: 'head', of: 'fig:0', pivot: [150, 80], poly: [[124, 18], [176, 18], [176, 72], [168, 80], [132, 80], [124, 72]], cut: true, joint: 5 },
      { name: 'face', of: '[data-part=face]', pivot: [150, 80] },
      { name: 'pinesL', of: 'fig:1 [data-part=pinesL]', pivot: [112, 94] },
      { name: 'pinesR', of: 'fig:1 [data-part=pinesR]', pivot: [188, 94] },
      { name: 'treesL', of: 'fig:1 [data-part=treesL]', pivot: [96, 104] },
      { name: 'treesR', of: 'fig:1 [data-part=treesR]', pivot: [204, 104] },
      { name: 'veins', of: '[data-part=veins]', pivot: [150, 120] },
      { name: 'heart', of: '[data-part=heart]', pivot: [150, 120] },
      { name: 'eyes', of: '[data-part=eyes]', pivot: [150, 80] },
    ],
  },
  // Vesh, the Red Widow: each arm (the sleeve cut from her gown about the shoulder; the pale
  // hand and the crimson drops over its palm turn with it), the veil in three lengths (the
  // drape and head, then two stretches of its streaming tail, each about where it joins the
  // last), and the three ravens on the graves, each about its feet. `shoulders`, `palms`: as
  // drawn; `emit`: the right palm's drops; `alone`: where her blood goes when nothing is aimed at
  'legend-vesh': {
    role: 'attacker', element: 'blood', facing: 'front', emit: [188, 128], hit: [150, 120],
    shoulders: [[139.6, 99.4], [160.4, 99.4]], palms: [[112.1, 132.6], [187.9, 132.6]], alone: [244, 132], ravens: [[80, 149], [266, 154], [39, 156]],
    parts: [
      { name: 'veil0', of: '[data-part=veil]', pivot: [152, 72], poly: [[-20, -20], [196, -20], [196, 230], [-20, 230]] },
      { name: 'veil1', of: '[data-part=veil]', pivot: [196, 98], poly: [[196, -20], [244, -20], [244, 230], [196, 230]] },
      { name: 'veil2', of: '[data-part=veil]', pivot: [244, 94], poly: [[244, -20], [330, -20], [330, 230], [244, 230]] },
      { name: 'armL', of: 'fig:1', pivot: [139.6, 99.4], poly: [[96, 92], [139, 92], [139.5, 100], [137, 110], [134.5, 120], [133, 130], [134, 140], [135, 152], [96, 152]], cut: true, joint: 4 },
      { name: 'armR', of: 'fig:1', pivot: [160.4, 99.4], poly: [[204, 92], [161, 92], [160.5, 100], [163, 110], [165.5, 120], [167, 130], [166, 140], [165, 152], [204, 152]], cut: true, joint: 4 },
      { name: 'handL', of: '[data-part=handL]', pivot: [139.6, 99.4] },
      { name: 'handR', of: '[data-part=handR]', pivot: [160.4, 99.4] },
      { name: 'dropsL', of: '[data-part=dropsL]', pivot: [112, 130] },
      { name: 'dropsR', of: '[data-part=dropsR]', pivot: [188, 130] },
      { name: 'rv0', of: 'fig:0 [data-part=rv0]', pivot: [80, 149] },
      { name: 'rv1', of: 'fig:0 [data-part=rv1]', pivot: [266, 154] },
      { name: 'rv2', of: 'fig:0 [data-part=rv2]', pivot: [39, 156] },
    ],
  },
  // Aeris, Queen of the Winds: her cloak of wind (the loop of pale air, with its streaks), the glow behind
  // her wings, the two great wings (split at her middle, each from its shoulder), the queen (all but her
  // raised arm, with her face: the arm is what lies left of x=142.5 between y=30 and y=86; it turns from the
  // shoulder), the gulls and kestrels (all together, wheeling about the loop's centre), the wisp of cloak
  // across her, and her crown. `emit`: her raised hand, where the boon leaves; `hit`: her middle;
  // `shoulder`: the raised arm's joint; `hand`: the hand as drawn; `alone`: the sky over the left cliff,
  // where her gift goes when nothing is aimed at
  'legend-aeris': {
    role: 'support', element: 'wind', facing: 'front', emit: [130.6, 41], hit: [150, 100], shoulder: [146, 84], hand: [130.6, 41], alone: [58, 62], loop: [150, 128], crownAt: [150, 57],
    parts: [
      { name: 'cloak', of: '[data-part=cloak]', pivot: [150, 128] },
      { name: 'wglow', of: '[data-part=wglow]', pivot: [150, 76] },
      { name: 'wingL', of: '[data-part=wings]', pivot: [146, 84], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'wingR', of: '[data-part=wings]', pivot: [154, 84], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'her', of: ['fig:2', '[data-part=face]'], pivot: [150, 106], poly: [[-20, -20], [320, -20], [320, 230], [-20, 230], [-20, 86], [142.5, 86], [142.5, 30], [-20, 30]] },
      { name: 'armL', of: ['fig:2', '[data-part=face]'], pivot: [146, 84], poly: [[-20, 30], [142.5, 30], [142.5, 86], [-20, 86]] },
      { name: 'birds', of: 'fig:3', pivot: [150, 128] },
      { name: 'wisp', of: '[data-part=wisp]', pivot: [150, 128] },
      { name: 'crown', of: '[data-part=crown]', pivot: [150, 57] },
    ],
  },
  // Halvard, the Unbroken: the two ranks of shield-bearers behind him (ten a side, cut out of the men,
  // their shields, and the seams and rings on them, in five pairs a side by vertical splits between
  // spears; each pair stands from its feet), the warden (cape and all, from his feet), his great shield
  // (from its point in the earth, with its inner rim), the vines climbing him and the shield, their
  // buds and the light on them, his gauntlets on the rim, the roots running from the shield's point,
  // and the sun on his shield. `hit`: his chest; `guard`: where blows land on the shield's face, high
  // to low, left and right; `feet`/`point`: his joints; `rankFeet`: each pair's feet (left pairs, then
  // right pairs), `rankPairs` how many pairs a side
  'legend-halvard': (() => {
    const LEFT = [[106, 182, 0.74], [91.2, 179.8, 0.688], [77.4, 177.6, 0.64], [64.6, 175.4, 0.595], [52.7, 173.2, 0.554], [41.7, 171, 0.515], [31.4, 168.8, 0.479], [21.8, 166.6, 0.445], [12.9, 164.4, 0.414], [4.6, 162.2, 0.385]];
    // the cut between pair j and the next one out (left rank): half-way between the first one's spear and the next one's shield
    const B = (j) => (j >= 4 ? -20 : +(((LEFT[2 * j + 1][0] - 12 * LEFT[2 * j + 1][2]) + (LEFT[2 * j + 2][0] + 10.6 * LEFT[2 * j + 2][2])) / 2).toFixed(1));
    const lo = (j) => B(j), hi = (j) => (j === 0 ? 150 : B(j - 1));
    const pairs = [];
    for (let j = 0; j < 5; j++) pairs.push({ x0: lo(j), x1: hi(j), pv: [LEFT[2 * j][0], LEFT[2 * j][1]] });
    const rank = (name, a, b, pv) => ({ name, of: ['fig:0', 'fig:1', '[data-part=rowdeco]'], pivot: pv, poly: [[a, -20], [b, -20], [b, 230], [a, 230]] });
    return {
      role: 'defender', element: 'nature', facing: 'front', hit: [150, 100], guard: [[150, 112], [128, 138], [172, 138], [150, 168]],
      feet: [150, 195], point: [150, 203], sunmark: [150, 133], rankPairs: 5,
      rankFeet: [...pairs.map((q) => q.pv), ...pairs.map((q) => [300 - q.pv[0], q.pv[1]])],
      parts: [
        ...pairs.map((q, j) => rank(`rankL${j}`, q.x0, q.x1, q.pv)),
        ...pairs.map((q, j) => rank(`rankR${j}`, 300 - q.x1, 300 - q.x0, [300 - q.pv[0], q.pv[1]])),
        { name: 'him', of: 'fig:2', pivot: [150, 195] },
        { name: 'shield', of: ['fig:3', '[data-part=shieldline]'], pivot: [150, 203] },
        { name: 'vines', of: 'fig:4', pivot: [150, 203] },
        { name: 'hands', of: 'fig:5', pivot: [150, 203] },
        { name: 'roots', of: '[data-part=roots]', pivot: [150, 200] },
        { name: 'buds', of: '[data-part=buds]', pivot: [150, 203] },
        { name: 'sunmark', of: '[data-part=sunmark]', pivot: [150, 133] },
      ],
    };
  })(),
  // Sanctuary Spring: the stag's head and neck (cut from the stag at the shoulder: what lies left of
  // x=191, so his legs and body stay), turning about the shoulder to lift from the water. `emit`: the
  // spring's heart, where the healing light wells; `hit`: the stag's middle; `drink`: the ring where he
  // drinks; `pool2`: the second spring's ring; `wound`: the healing wound on his shoulder; `mouth`: the
  // grotto's bright mouth
  'sanctuary-spring': {
    role: 'aura', element: 'water', facing: 'left', emit: [150, 168], hit: [222, 130], drink: [164, 166], pool2: [98, 178], wound: [222, 128], mouth: [168, 76], shoulder: [194, 128],
    parts: [
      { name: 'head', of: 'fig:0', pivot: [194, 128], poly: [[150, 100], [186, 100], [193, 125], [190.6, 138], [190.4, 160], [150, 175]], cut: true, joint: 4 },
    ],
  },
  // Lantern Moth: the great moth's right and left wings (each with its veins and rings; split at its
  // body's middle), its two feelers (cut from the body at the root), and the ribbed lantern it carries
  // (its caps and tassel too). `emit`: the lantern's middle, where its swarm leaves; `hit`: its body;
  // `root`: where the wings join; `lamp`: the lantern's middle; `alone`: where its swarm goes when
  // nothing is aimed at: up and away over the meadow's far side
  'lantern-moth': {
    role: 'attacker', element: 'light', facing: 'front', emit: [150, 108], hit: [150, 98], root: [150, 88], lamp: [150, 108], alone: [262, 70],
    parts: [
      { name: 'wingR', of: ['fig:0', '[data-part=veins]', '[data-part=rings]'], pivot: [153, 88], poly: [[150, -20], [320, -20], [320, 230], [150, 230]] },
      { name: 'wingL', of: ['fig:0', '[data-part=veins]', '[data-part=rings]'], pivot: [147, 88], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'feelR', of: 'fig:1', pivot: [155, 70], poly: [[155, 30], [200, 30], [200, 71], [155, 71]], cut: true },
      { name: 'feelL', of: 'fig:1', pivot: [145, 70], poly: [[100, 30], [145, 30], [145, 71], [100, 71]], cut: true },
      { name: 'lantern', of: '[data-part=lantern]', pivot: [150, 106] },
    ],
  },
  // Mender's Hymn: the priestess (all but her raised arms, which turn from the shoulder: the arms are what
  // lies right of x=99 above y=100) and the kneeling soldier (his head split off at the neck; the rest of
  // him, sword and all, from his seat). `emit`: between her raised hands, where the notes leave; `hit`:
  // her middle; `alone`: the soldier's heart, where the song settles; `shoulder`, `seat`, `neck`: joints
  'menders-hymn': {
    role: 'support', element: 'light', facing: 'right', emit: [110, 70], hit: [92, 140], alone: [201, 130],
    shoulder: [97, 99], seat: [200, 186], neck: [200, 123], feet: [92, 189],
    parts: [
      { name: 'her', of: 'fig:0', pivot: [92, 189], poly: [[-20, -20], [99, -20], [99, 100], [320, 100], [320, 230], [-20, 230]] },
      { name: 'arms', of: 'fig:0', pivot: [97, 99], poly: [[99, -20], [320, -20], [320, 100], [99, 100]] },
      { name: 'soldier', of: 'fig:1', pivot: [200, 186], poly: [[-20, -20], [183, -20], [183, 123], [215, 123], [215, -20], [320, -20], [320, 230], [-20, 230]] },
      { name: 'sHead', of: 'fig:1', pivot: [200, 123], poly: [[183, 85], [215, 85], [215, 123], [183, 123]] },
    ],
  },
  // Tithe of Light: the great bowl's crowd of candle flames (in three groups, left to right), the three
  // villagers (the woman, the child, the old man: each cut from the one figure, about their feet) and
  // the candles they hold (rod, flame and glow, split by whose it is). `emit`: the bowl's heart, where its
  // light leaves; `hit`: the bowl; `alone`: the rafters, where the light climbs to; `rim`: the bowl's
  // lip; `held`: where each held candle is as drawn
  'tithe-of-light': {
    role: 'support', element: 'light', facing: 'front', emit: [150, 122], hit: [150, 140], alone: [150, 24], rim: [150, 126],
    held: [[107, 101], [183, 138], [204, 136]],
    parts: [
      { name: 'flamesL', of: '[data-part=flames]', pivot: [114, 126], poly: [[-20, -20], [128, -20], [128, 230], [-20, 230]] },
      { name: 'flamesM', of: '[data-part=flames]', pivot: [150, 126], poly: [[128, -20], [172, -20], [172, 230], [128, 230]] },
      { name: 'flamesR', of: '[data-part=flames]', pivot: [186, 126], poly: [[172, -20], [320, -20], [320, 230], [172, 230]] },
      { name: 'woman', of: 'fig:3', pivot: [82, 192], poly: [[-20, -20], [128, -20], [128, 230], [-20, 230]] },
      { name: 'child', of: 'fig:3', pivot: [196, 192], poly: [[128, -20], [203, -20], [203, 230], [128, 230]] },
      { name: 'old', of: 'fig:3', pivot: [226, 192], poly: [[203, -20], [320, -20], [320, 230], [203, 230]] },
      { name: 'candleW', of: ['[data-part=hr]', '[data-part=hf]', '[data-part=hg]'], pivot: [107, 108], poly: [[-20, -20], [150, -20], [150, 230], [-20, 230]] },
      { name: 'candleC', of: ['[data-part=hr]', '[data-part=hf]', '[data-part=hg]'], pivot: [183, 142], poly: [[150, -20], [194, -20], [194, 230], [150, 230]] },
      { name: 'candleO', of: ['[data-part=hr]', '[data-part=hf]', '[data-part=hg]'], pivot: [204, 140], poly: [[194, -20], [320, -20], [320, 230], [194, 230]] },
    ],
  },
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
  // Kasimir, the First Blade: the knight himself (legs, body, head and scarf, with the soot and gold trim
  // drawn on him) leaping from the middle of his body; his sword arm (from its shoulder) and the blazing
  // sword it holds (flames and blade, about the same shoulder); his banner arm with the pole (from its
  // shoulder) and the banner on the pole's top. role: attacker (as suggested), element: fire (the sword
  // blazes; the suggestion was earth), facing: right; `emit`: the sword's tip, where the slash of fire leaves;
  // `hit`: his chest; `shoulder`/`bshoulder`: the sword arm's and the banner arm's joints; `grip`: his fist
  // on the sword; `top`: the banner pole's top; `mid`: his body's joint; `alone`: the enemy line below
  // in the smoke, where the slash lands when nothing is aimed at
  'legend-kasimir': {
    role: 'attacker', element: 'fire', facing: 'right', emit: [214.8, 24.8], hit: [156, 108], shoulder: [164.4, 96.8], bshoulder: [154.8, 96.8], grip: [189.6, 65.6], top: [94.8, 44], mid: [150, 128], alone: [236, 172],
    parts: [
      { name: 'banner', of: '[data-part=banner]', pivot: [94.8, 44] },
      { name: 'body', of: 'fig:2', pivot: [150, 128], poly: [[-20, -20], [320, -20], [320, 58], [184, 58], [186, 64], [180, 76], [173.5, 82], [166, 95], [166, 100], [320, 100], [320, 230], [-20, 230], [-20, 118], [145, 118], [145, 101], [150, 101], [150, 89], [127, 89], [127, 30], [-20, 30]] },
      { name: 'armB', of: 'fig:2', pivot: [154.8, 96.8], poly: [[-20, 30], [127, 30], [127, 89], [150, 89], [150, 101], [145, 101], [145, 118], [-20, 118]] },
      { name: 'armS', of: 'fig:2', pivot: [164.4, 96.8], poly: [[166, 100], [166, 95], [173.5, 82], [180, 76], [186, 64], [184, 58], [320, 58], [320, 100]] },
      { name: 'decor', of: '[data-part=decor]', pivot: [150, 128] },
      { name: 'sword', of: '[data-part=sword]', pivot: [164.4, 96.8] },
    ],
  },
  // ── end of lane B ──
};
