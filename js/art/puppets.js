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
  // ── end of lane B ──
};
