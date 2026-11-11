// The campaign (2026-11-11): worlds to travel through against the bots, a
// deck of yours for each world. A world's levels are the decks yours does
// best against first and its hardest last, the boss; the order comes from
// every starter played against every other (about 3,200 bot games, Practice
// against Practice: tools/train.mjs decks practice with MATRIX=). Beating the
// boss brings its deck over to your side, for the next world.
// Each level is a rivalry in three rounds, at the three difficulties in turn
// (DIFFS): the Legend escapes your first two wins and comes back with better
// fighters; the third, at Expert, beats them for good and opens the road on.
// A level's stars are the rounds won. The story is told by the Legends: yours,
// and the one leading each deck you meet. Progress stays on this phone.

export const DIFFS = [
  { stars: 1, level: 'casual', name: 'Casual' },
  { stars: 2, level: 'practice', name: 'Practice' },
  { stars: 3, level: 'expert', name: 'Expert' },
];

// A level: the deck you meet there (its Legend tells the story), the place,
// `odds` (how often the world's deck beat it in those bot games), and the
// lines: `before` round 1, `back` before rounds 2 and 3 (they return),
// `escape` after your first two wins, `win` after the third, `lose`.
export const WORLDS = [{
  id: 1,
  name: 'The Harbor Road',
  deck: 'ultra-the-long-game',
  map: 'world-1', // its painting (js/art/campaign-art.js); each level's place has one too
  next: 'ultra-the-wall',
  intro: [
    'The delta has gone quiet. No barges come down the river, no carts come over the hills, and the harbor’s ledgers are running red.',
    'Marisol, the Harbormistress, shuts her ledger. “Trade doesn’t stop by itself. Someone is choking it.”',
    '“I’ll take the road up to the Wall and find out who. And every coin I earn on the way, I’ll put to work.”',
  ],
  done: 'Halvard joins you, and the Wall opens. World 2, The Fog Country, lies beyond it.',
  stages: [
    { deck: 'ultra-smoke-and-mirrors', place: 'The Market', pic: 'place-market', odds: 0.82,
      before: [
        'In the market square every stall sells the same mask, and behind every mask is Mirelle, the Mask-Maker.',
        '“Coins, Harbormistress? I can make them look like anything. Even like yours.”',
      ],
      back: [
        ['By morning the market is full of new masks. “My finest work,” says Mirelle. “Even I can’t tell which of us is real.”'],
        ['No more decoys. Mirelle stands alone in the square, every trick she owns up her sleeves. “Now, Harbormistress. Show me what’s real.”'],
      ],
      escape: [
        ['The mask you beat cracks open, and there was nobody behind it.', 'Mirelle’s laugh comes from another stall: “A decoy, Harbormistress. I’ll bring better faces.”'],
        ['Mirelle’s cloak tears free and flutters away empty.', '“Twice fooled by your luck,” her voice sighs. “The third time, I play in earnest.”'],
      ],
      win: ['The masks clatter to the cobbles. Mirelle only laughs.', '“Fine: the false coins came from upriver, not from me. Ask the wind who carried them.”'],
      lose: ['“Nothing here is what it looks like,” Mirelle whispers. “Least of all your winning hand.”'] },
    { deck: 'ultra-sky-and-arrows', place: 'The Cliffs', pic: 'place-cliffs', odds: 0.63,
      before: [
        'On the cliffs above the bay every wind blows against the sails. Aeris, Queen of the Winds, rides them all.',
        '“The sky is mine. Your ships pay my toll, or they turn back.”',
      ],
      back: [
        ['The sky darkens with wings: Aeris has called the high flocks down from the peaks. “Let’s see your ships sail through this.”'],
        ['The whole sky leans on the cliffs, and Aeris rides at its head. “No more games, trader. The sky itself.”'],
      ],
      escape: [
        ['Aeris catches a gust and is gone, up out of reach.', '“A lucky calm! The winds will send me better archers.”'],
        ['The flock breaks, and Aeris vanishes into a cloud.', '“The storm hasn’t even started,” she calls down.'],
      ],
      win: ['The wind drops. “You don’t fight the weather,” Aeris admits. “You outlast it.”', '“The road inland is blocked by something much bigger than me. Go and see.”'],
      lose: ['Arrows fall out of a clear sky. “Come back when you can reach me,” laughs Aeris.'] },
    { deck: 'ultra-the-giant', place: 'The Pass', pic: 'place-pass', odds: 0.48,
      before: [
        'The mountain pass is gone. In its place sits Ymra, Heart of the Mountain, growing one stone at a time.',
        '“Build all you like, little trader. I am already built.”',
      ],
      back: [
        ['The mountain has grown in the night: new ridges, new shoulders. “Patience,” says Ymra. “I told you I had more of it.”'],
        ['The whole range stands up, and Ymra rises from its heart, older than the hills. “Now you meet all of me.”'],
      ],
      escape: [
        ['The stones you broke roll back together.', '“Pebbles,” rumbles Ymra. “I will grow bigger ones.”'],
        ['Ymra sinks into the earth, and the ground shakes for an hour.', '“The root of the mountain goes deeper still.”'],
      ],
      win: ['Ymra settles back into the hillside with a rumble you feel in your teeth.', '“The fields up there… something is eating them at night. Not me.”'],
      lose: ['“Patience,” grinds the mountain. “I have more of it than you.”'] },
    { deck: 'ultra-endless-swarm', place: 'The Fields at Night', pic: 'place-fields', odds: 0.35,
      before: [
        'Night falls on the grain fields, and the fields begin to move: moths, thousands of them, and at their heart Lumen, Mother of Moths.',
        '“One moth is nothing. A thousand is a famine. Death by a thousand cuts, Harbormistress.”',
      ],
      back: [
        ['The fields are thick with wings again, twice as many as before. “Every one that fell taught the rest,” hums Lumen.'],
        ['Night falls, and it has never been this dark: the moths have covered the moon. “A thousand cuts, Harbormistress. Count them.”'],
      ],
      escape: [
        ['The moths you burned drift down as ash, but the cloud only thins.', '“You swatted the hungry ones,” hums Lumen. “The starving ones are coming.”'],
        ['Dawn scatters the swarm, and Lumen’s voice drifts away with it.', '“Tonight, all of us.”'],
      ],
      win: ['Dawn breaks, and the swarm scatters into the light.', 'Lumen’s voice comes from everywhere at once: “We were only hungry. The Wall stopped the grain. Ask Halvard why.”'],
      lose: ['“Every one of us you swat makes the rest stronger,” hums the swarm. “Every one.”'] },
    { deck: 'ultra-the-wall', place: 'The Wall', pic: 'place-wall', odds: 0.29, boss: true,
      before: [
        'At the top of the road stands the Wall, and on it Halvard, the Unbroken.',
        '“Nothing passes. Not grain, not coin, not you. The Wall holds. It is all I know how to do.”',
      ],
      back: [
        ['The gate is barred with new shields: Halvard has called his whole guard to the Wall. “Nothing passes.”'],
        ['Halvard stands alone in the gate, his shield older than the harbor. “Then come. The last stone of the Wall is me.”'],
      ],
      escape: [
        ['A stone falls from the Wall, and Halvard steps back behind it.', '“One stone. The Wall has thousands. I will call the guard.”'],
        ['The guard falls back into the gatehouse, Halvard last of all.', '“The Wall bends. It does not break.”'],
      ],
      win: [
        'For the first time in a hundred years, Halvard lowers his shield.',
        '“You built until you broke through. Then perhaps the Wall should open.” He looks east, into a fog that wasn’t there yesterday. “Walk with me. There is something out there I was keeping in.”',
      ],
      lose: ['“The Wall holds,” says Halvard. “It always holds.”'] },
  ],
}, {
  // World 2 (2026-11-11): east of the Wall, into the fog, with Halvard's deck.
  // Its levels are Legends nobody has met yet, from the one The Wall beats
  // most often to its hardest: Hush, whose fog Halvard was keeping out. (The
  // Wall's results, Practice against Practice: Blood and Bone 78%, The Charge
  // 71%, Rot and Bloom 59%, Weathermakers 45%, Fogbound 27%.)
  id: 2,
  name: 'The Fog Country',
  deck: 'ultra-the-wall',
  map: 'world-2',
  next: 'ultra-fogbound',
  intro: [
    'Beyond the Wall the old east road runs down into the fog, and for a hundred years nobody has walked it and come back.',
    'Halvard lifts the bar from the gate himself. “I held this gate shut against the fog, and it came on anyway, a little more each year. A wall only makes it wait.”',
    '“So we go to it,” says Marisol, opening a fresh ledger. “Whoever is breathing that fog onto my roads owes me a hundred years of trade.”',
  ],
  done: 'Hush joins you. World 3 begins where the dawn should have, and didn’t.',
  stages: [
    { deck: 'ultra-blood-and-bone', place: 'The Red Ford', pic: 'place-ford', odds: 0.78,
      before: [
        'Where the east road meets the river, the water runs red, and on the far bank waits Vesh, the Red Widow, a blade in each hand.',
        '“The wall-builder comes out at last. Did you bring your wounds, Halvard? I always bring mine.”',
      ],
      back: [
        ['By dawn Vesh is back in the ford, with fresh cuts and twice the fighters. “Every scar teaches me something,” she says. “I study hard.”'],
        ['Vesh stands alone in the red water, bleeding from a dozen cuts, and smiling. “Now I’m ready. Hit me.”'],
      ],
      escape: [
        ['Vesh staggers back into the fog, laughing through her teeth.', '“First blood to the wall-builder. It only makes me hungrier.”'],
        ['Vesh wades off downstream, the river reddening behind her.', '“Bleed me once more and you’ll see what I really am.”'],
      ],
      win: ['Vesh sinks to one knee in the ford and wipes her blades on her sleeve.', '“You don’t bleed, wall-builder. It isn’t fair.” She nods east. “The fog took my husband. Find whoever sends it, and give them a cut from me.”'],
      lose: ['“You hold so carefully,” sighs Vesh, “and still you break.”'] },
    { deck: 'ultra-the-charge', place: 'The Causeway', pic: 'place-causeway', odds: 0.71,
      before: [
        'A stone causeway runs straight out across the marsh, and from its far end comes a horn: Kasimir, the First Blade, and his riders.',
        '“I have ridden this causeway a thousand times and never once arrived second. Stand aside, or be ridden down.”',
      ],
      back: [
        ['Hooves ring on the stones again: Kasimir has gathered his fastest riders. “That was a stumble. This is a charge.”'],
        ['Kasimir rides out of the fog alone, lance lowered. “No riders this time. Just me, and the first blow.”'],
      ],
      escape: [
        ['Kasimir wheels his horse and is gone down the causeway before you can follow.', '“Second,” he spits. “Once. Never again.”'],
        ['The riders scatter into the reeds, and Kasimir gallops after them.', '“You don’t chase. You just stand there. I hate that.”'],
      ],
      win: ['Kasimir’s lance breaks on Halvard’s shield, and for once he stops.', '“I was never racing anyone,” he admits. “I was running from the fog. It follows whatever’s fastest.” He points into the mist. “Ask the gardener what it waters.”'],
      lose: ['“First again,” laughs Kasimir, already galloping away.'] },
    { deck: 'ultra-rot-and-bloom', place: 'The Bone Garden', pic: 'place-garden', odds: 0.59,
      before: [
        'Past the marsh the fog lies thick over a garden of barrows, every mound white with flowers. Morrow, the Bone Gardener, is planting.',
        '“Mind the beds, Halvard. Everything here was someone once, and everything here will be something again.”',
      ],
      back: [
        ['Overnight the barrows have bloomed again, taller and paler. “Nothing stays buried in my garden,” says Morrow. “Not even my losses.”'],
        ['Morrow kneels at the oldest barrow, and the ground opens around her. “This bed I’ve kept a long time. Let’s see what comes up.”'],
      ],
      escape: [
        ['Morrow sinks into the soft earth like a seed.', '“Planted,” says her voice from under the flowers. “I’ll come up stronger.”'],
        ['The garden folds over Morrow, and the flowers close for the night.', '“Patience. Every bloom needs its winter.”'],
      ],
      win: ['Morrow sits back on her heels and brushes the soil from her hands.', '“The fog waters my garden. I never asked what it drowns.” She points at a dark tower above the mist. “Oriel has tried to blow it away for years. Ask her why she can’t.”'],
      lose: ['“Back to the earth with you,” says Morrow kindly. “You’ll grow back.”'] },
    { deck: 'ultra-weathermakers', place: 'The Storm Spire', pic: 'place-spire', odds: 0.45,
      before: [
        'On a crag above the fog stands a white tower crowned with lightning. Oriel, Lady of Storms, is giving the sky its orders.',
        '“Another wall-builder come to tell me to stop? Fog doesn’t listen to walls. It will listen to thunder.”',
      ],
      back: [
        ['The tower bristles with new rods, and the clouds over it boil. “The sky has more weather in it than you have shields,” says Oriel.'],
        ['Oriel brings the whole storm down at once and stands in its eye. “Every gale I ever kept. Hold this, Unbroken.”'],
      ],
      escape: [
        ['A gust lifts Oriel back up to her balcony.', '“A lull. The sky owes me a better storm.”'],
        ['Lightning strikes the spire, and when the light clears Oriel is gone.', '“Next time,” the thunder rumbles, “I give orders to the whole sky.”'],
      ],
      win: ['The clouds over the spire break, and for a moment there is sun.', '“I’ve blown on that fog for twenty years,” says Oriel quietly. “It doesn’t move, because it isn’t weather. Someone is breathing it.” She points east, where the mist is thickest. “Hush lives at its heart.”'],
      lose: ['“The weather always wins,” says Oriel. “Ask any wall.”'] },
    { deck: 'ultra-fogbound', place: 'The Heart of the Fog', pic: 'place-mere', odds: 0.27, boss: true,
      before: [
        'At the heart of the fog lies a still black mere, and the fog rises off it like breath. Somewhere out on it, Hush, the Fog Witch, is humming.',
        '“A hundred years you kept me out, Halvard. A hundred years I waited at your wall. Come closer. You won’t find me.”',
      ],
      back: [
        ['Overnight the fog has thickened and filled with shapes. “I have so many faces in here,” whispers Hush. “Find the real one.”'],
        ['The mere goes silent. Hush stands on the water with all the fog gathered round her like a cloak. “Then come and find me.”'],
      ],
      escape: [
        ['The shape you struck melts into mist.', '“Warm,” giggles Hush from everywhere at once. “But not found.”'],
        ['Hush sinks into the mere without a ripple.', '“Closer, closer. The last of me is the hardest to find.”'],
      ],
      win: [
        'The fog thins, and Hush is only a small, cold woman standing in the reeds.',
        '“I wasn’t choking your roads,” she says. “I was hiding. Something drove me west out of the deep east, and I hid in my own fog.” She looks east, where the dawn should be and isn’t. “It’s still coming.”',
      ],
      lose: ['“You looked everywhere,” whispers Hush, “everywhere but here.”'] },
  ],
}, {
  // World 3 (campaign-plan.md): the Eclipse has put out the dawn in the west.
  // Back through the Wall and down the Harbor Road in the dark, with Hush's
  // deck, against World 1's Legends, hollowed: stronger the farther you go
  // (`powers`, engine.js newGame), as the decks left no longer climb by the
  // data alone (Fogbound's results: Endless Swarm 57%, The Giant 42%, Sky and
  // Arrows 43%, Smoke and Mirrors 47%, Storm Rising 50%). Its pictures are
  // World 1's under the Eclipse (campaign-art.js eclipsed), and a lighthouse.
  id: 3,
  name: 'The Long Night',
  deck: 'ultra-fogbound',
  map: 'world-3',
  next: 'ultra-storm-rising',
  intro: [
    'Three days after the fog lifted, the sun did not rise. Not over the marsh, not over the Wall, not over the harbor far to the west.',
    'Hush draws her fog around the three of you like a cloak. “It hollows what it touches: it puts out the light inside a Legend and wears them. My fog hides us from its eyes. Stay close.”',
    'Back through the Wall and down the old road, every light is out, and every Legend Marisol beat on the way up is waiting in the dark.',
  ],
  done: 'Seren joins you, and her notes on the Eclipse with her. World 4, The Drowned Dawn, lies back east, the way it came.',
  stages: [
    { deck: 'ultra-endless-swarm', place: 'The Fields at Night', pic: 'place-fields-night', odds: 0.57, hollow: true, powers: { life: 2 },
      before: [
        'The fields are dark, and the moths have stopped glowing. Lumen stands among them with the Eclipse in her eyes.',
        '“Every light I ever let go came home, Hush. Then the dark came home with them.”',
      ],
      back: [
        ['The moths rise again, black as soot, more of them than before. “The dark is hungry too,” hums Lumen, in a voice that isn’t hers.'],
        ['Lumen opens her arms, and every moth in the fields comes to her at once. “Put us out, then. All of us.”'],
      ],
      escape: [
        ['The black moths scatter, and Lumen with them.', '“Not yet,” says the voice inside her. “She burns a little longer.”'],
        ['For a moment one moth glows gold. Then the dark swallows it, and Lumen is gone.', '“Again,” she whispers. “Please.”'],
      ],
      win: ['The Eclipse goes out of Lumen’s eyes, and every moth in the fields lights at once.', '“It came out of the east with the night,” she says, shaking. “It wants the lights. Ymra holds the pass for it. She didn’t want to.”'],
      lose: ['“Dark is only a light that gave up,” hums the swarm.'] },
    { deck: 'ultra-the-giant', place: 'The Pass', pic: 'place-pass-night', odds: 0.42, hollow: true, powers: { life: 3 },
      before: [
        'In the pass the mountain has turned to black glass. Ymra sits at its heart, and the fire in her chest burns cold.',
        '“Go back, little fog. The mountain answers to the night now.”',
      ],
      back: [
        ['The black glass has grown in the night, sharp as knives. “The night is patient,” grinds Ymra, “and I have learned to be patient for it.”'],
        ['The whole range shudders up around Ymra, cold fire running in its cracks. “All of me, and all of it.”'],
      ],
      escape: [
        ['The glass you broke runs back together like water.', '“Still whole,” says the cold voice in the stone.'],
        ['Ymra sinks into the black mountain, and it closes over her.', '“Deeper,” she rumbles. “Where the night is warmest.”'],
      ],
      win: ['The cold fire in Ymra’s chest catches, and burns warm again.', '“It made me hold the pass so nothing could carry word west,” she says. “Aeris carried word anyway. It caught her for it.”'],
      lose: ['“Stone holds the dark best,” grinds the mountain.'] },
    { deck: 'ultra-sky-and-arrows', place: 'The Cliffs', pic: 'place-cliffs-night', odds: 0.43, hollow: true, powers: { life: 4 },
      before: [
        'No wind blows on the cliffs. Aeris hangs in the still air over the bay, her wings black, her arrows tipped with the Eclipse.',
        '“The sky is closed, Hush. I closed it.”',
      ],
      back: [
        ['The air over the cliffs fills with black wings. “The night lent me its flocks,” says Aeris flatly.'],
        ['Aeris holds the whole dead sky over the bay. “Shoot me down, or go home.”'],
      ],
      escape: [
        ['Aeris rises out of reach into the black sky.', '“The sky is still mine,” the voice says. “Hers is gone.”'],
        ['A gust, the first in days, carries Aeris away.', '“Did you feel that?” she whispers. “Do it again.”'],
      ],
      win: ['The wind comes back to the cliffs all at once, and Aeris laughs like a girl.', '“I flew east to see what it was, and it caught me in the air.” She points down at the harbor. “Mirelle made it the masks it wears. Ask her why.”'],
      lose: ['Black arrows fall without a sound. “The sky remembers no one,” says Aeris.'] },
    { deck: 'ultra-smoke-and-mirrors', place: 'The Market', pic: 'place-market-night', odds: 0.47, hollow: true, powers: { life: 5 },
      before: [
        'The market square is full of masks again, every one smiling the same black smile. Mirelle sits on the fountain, wearing the Eclipse.',
        '“Every face I ever made, it wears now. Do you like this one, Hush? It’s yours.”',
      ],
      back: [
        ['The masks have moved in the night, and every stall is a mirror now. “It loves my work,” says Mirelle. “It never takes them off.”'],
        ['Mirelle takes off her mask, and there is only night behind it. “No more tricks. Only this.”'],
      ],
      escape: [
        ['The mask you struck shatters, and another face is under it.', '“There is always another face,” says the voice.'],
        ['Every mirror in the market goes dark at once, and Mirelle steps into one.', '“Find the real me before it does.”'],
      ],
      win: ['Mirelle’s last mask cracks, and her own face is under it, tired and furious.', '“I made it a thousand faces, and it still wanted a voice.” She points at the black lighthouse at the harbor mouth. “Seren gave it one.”'],
      lose: ['“Nothing here is what it looks like,” says Mirelle in its voice, “least of all you.”'] },
    { deck: 'ultra-storm-rising', place: 'The Lighthouse', pic: 'place-lighthouse', odds: 0.5, boss: true, hollow: true, powers: { life: 6, energy: 1 },
      before: [
        'The lighthouse at the harbor mouth is burning, but its light is black. On its gallery Seren, the Storm-Scholar, reads aloud from the Eclipse’s own notes.',
        '“I wanted to understand it. Now I do, Hush. Shall I explain?”',
      ],
      back: [
        ['Lightning crawls over the lighthouse, black and silent. “I’ve revised my notes,” says Seren. “You were a footnote.”'],
        ['Seren stands on the lamp itself, the whole storm written around her. “The last chapter. Read closely.”'],
      ],
      escape: [
        ['A bolt of black lightning, and Seren is back up on the gallery.', '“A rough draft,” she says. “The finished one is worse.”'],
        ['The lamp flares black, and Seren is gone into its light.', '“Next time,” her voice says from everywhere, “I read you the ending.”'],
      ],
      win: [
        'The black light gutters, and for a moment the lighthouse burns gold again.',
        '“I took notes on it, and it took notes on me,” says Seren, and hands Marisol a burned notebook. “It came from the east, from under the sunrise. It doesn’t eat the sun. It holds it down. And it wants one thing more: the Legends who beat it.”',
      ],
      lose: ['“Your mistake is in the first line,” says Seren. “You thought you could win.”'] },
  ],
}, {
  // World 4: east again through the Fog Country, under the Eclipse, with
  // Seren's deck against World 2's Legends, hollowed, and the one rooting the
  // dark past the mere. Storm Rising is the weakest deck (Blood and Bone 37%,
  // The Charge 32%, Rot and Bloom 53%, Weathermakers 45%, Spellbloom 25%), so
  // the hollowed here grow gently. Its pictures are World 2's under the
  // Eclipse, and the Root of the Dawn.
  id: 4,
  name: 'The Drowned Dawn',
  deck: 'ultra-storm-rising',
  map: 'world-4',
  next: 'ultra-spellbloom',
  intro: [
    'East again, back through the Wall and into the Fog Country. But the fog is black now, and the Legends Halvard met there are waiting in it, hollowed.',
    'Seren opens her burned notebook. “It came out of the deep east, and it has put down roots. Somewhere past the mere, someone is planting the dark for it.”',
    '“Then we dig it up,” says Marisol.',
  ],
  done: 'Ione joins you, but the others are gone into the dark. World 5 lies at the edge of the night.',
  stages: [
    { deck: 'ultra-blood-and-bone', place: 'The Red Ford', pic: 'place-ford-night', odds: 0.37, hollow: true, powers: { life: 1 },
      before: [
        'The ford runs black now. Vesh stands in it to her knees, and her wounds don’t bleed: they leak night.',
        '“Seren. You brought me a scholar this time. Let’s see what she’s made of.”',
      ],
      back: [
        ['Vesh is back in the black water, and the cuts on her arms are shaped like eclipses. “It teaches pain better than I ever did.”'],
        ['Vesh opens every wound at once, and the night pours out of them. “All of it, scholar. Take notes.”'],
      ],
      escape: [
        ['Vesh sinks into the black water and doesn’t come up.', '“The river remembers me,” says the voice. “Come back.”'],
        ['Vesh laughs, and for a moment the laugh is hers.', '“Again. Cut it out of me.”'],
      ],
      win: ['The night runs out of Vesh’s wounds, the river turns red again, and she has never looked so glad to bleed.', '“It came for Kasimir first,” she says. “He was fastest, so it caught him first. He’s still riding the causeway for it.”'],
      lose: ['“Take notes,” sneers the thing in Vesh. “You lost.”'] },
    { deck: 'ultra-the-charge', place: 'The Causeway', pic: 'place-causeway-night', odds: 0.32, hollow: true, powers: { life: 2 },
      before: [
        'Hooves on the causeway, but no horn: Kasimir rides out of the black fog with his riders, silent, their lances black.',
        '“I arrive first,” he says, in a voice like a door closing. “I always arrive first. Now it rides with me.”',
      ],
      back: [
        ['More riders now, a column of them out of the dark. “It gave me riders that never tire,” says Kasimir.'],
        ['Kasimir rides alone, and the causeway cracks under his hooves. “First and last. Stand.”'],
      ],
      escape: [
        ['Kasimir wheels and is gone down the causeway, faster than ever.', '“Second,” says the voice, puzzled. “Second?”'],
        ['The riders break into fog, and Kasimir with them.', '“Faster,” he whispers. “Make me faster than it.”'],
      ],
      win: ['Kasimir’s horse stops of its own accord, and he sits there, breathing.', '“I couldn’t outrun it,” he says. “Nobody can. Morrow tried to bury it instead. Go and see what grew.”'],
      lose: ['“First,” says Kasimir, and rides on into the dark.'] },
    { deck: 'ultra-rot-and-bloom', place: 'The Bone Garden', pic: 'place-garden-night', odds: 0.53, hollow: true, powers: { life: 2 },
      before: [
        'Every barrow in the garden has bloomed black. Morrow kneels among them, planting something that moves.',
        '“I buried it, Seren. It came up. Everything I bury comes up, and so did it.”',
      ],
      back: [
        ['The black flowers have spread over the paths. “It grows so well here,” says Morrow fondly.'],
        ['Morrow lies down in her oldest barrow, and the black garden closes over her. “Dig me up, if you can.”'],
      ],
      escape: [
        ['Morrow sinks into the black earth.', '“Planted again,” says the voice. “Deeper.”'],
        ['The black flowers close, and Morrow is gone beneath them.', '“Find the root,” she whispers. “Find the root.”'],
      ],
      win: ['The black flowers wilt all at once, and white ones push up through them.', '“It has a root,” says Morrow, brushing the soil from her eyes. “Something past the mere keeps it watered. Oriel sees everything from her spire. Ask her where.”'],
      lose: ['“Everything comes back up,” says Morrow kindly, “except you.”'] },
    { deck: 'ultra-weathermakers', place: 'The Storm Spire', pic: 'place-spire-night', odds: 0.45, hollow: true, powers: { life: 3 },
      before: [
        'The storm over the spire has stopped. The clouds hang still and black, and Oriel stands on the tower with the sky folded in her hands.',
        '“Seren, little scholar. I gave the weather its orders; now it gives me mine. Isn’t that funny?”',
      ],
      back: [
        ['Oriel has unfolded the sky again, and every cloud in it is an eye. “It sees through all of them,” she says.'],
        ['Oriel calls the whole black sky down onto the spire. “Weather this.”'],
      ],
      escape: [
        ['Oriel folds herself into a cloud and drifts up out of reach.', '“A lull,” says the voice. “Nothing more.”'],
        ['Thunder, the first in weeks, and Oriel is gone in it.', '“That was mine,” she gasps. “That thunder was mine.”'],
      ],
      win: ['The black clouds split, and real rain falls on the spire.', '“I can see it from here,” says Oriel, pointing past the mere. “A tree as tall as the sky, growing out of the water, and under the water, the dawn. Ione is singing to it.”'],
      lose: ['“Fair weather never comes,” says Oriel. “Not anymore.”'] },
    { deck: 'ultra-spellbloom', place: 'The Root of the Dawn', pic: 'place-root', odds: 0.25, boss: true, hollow: true, powers: { life: 4, energy: 1 },
      before: [
        'Past the mere a tree as tall as the sky grows out of the black water, and under the water, tangled in its roots, burns the dawn. Ione, the Bloomcaller, sits in its branches, reading aloud.',
        '“Every spell I read puts down roots, Seren. I have been reading this one for a long time. Listen to how deep it goes.”',
      ],
      back: [
        ['The tree has grown in the night, and its roots have pulled the dawn deeper. “Hear that?” says Ione. “That’s the sunrise, going down.”'],
        ['Ione closes her book, and every branch of the tree turns toward you. “The last page. I’ll read it slowly.”'],
      ],
      escape: [
        ['Ione climbs into the high branches, still reading.', '“A misprint,” says the voice. “Turn the page.”'],
        ['The tree shudders, and Ione sinks into its bark.', '“Pull,” she whispers from inside it. “Pull it out by the roots.”'],
      ],
      win: [
        'Ione’s book falls into the water, and the roots let go. Far below, the dawn rises a little, and the whole mere glows gold.',
        'Then the light goes out of Marisol’s eyes, and Halvard’s, and Hush’s, and Seren’s, all at once. “It wants the Legends who beat it,” Ione whispers, holding your hand, “and now it has them. Come. We have to get them back.”',
      ],
      lose: ['“Roots always win,” reads Ione. “Give them time.”'] },
  ],
}];

export const worldOf = (id) => WORLDS.find((w) => w.id === id) || null;
// A world opens once the one before it is done (its boss beaten for good).
export const worldOpen = (p, w) => w === 1 || (!!worldOf(w - 1) && beaten(p, w - 1, worldOf(w - 1).stages.length - 1));
export const latestWorld = (p) => WORLDS.reduce((best, W) => (worldOpen(p, W.id) ? W.id : best), 1);
// Addresses: a world's map is #/campaign/w2, a place in it #/campaign/w2-3;
// World 1's places keep their first addresses (#/campaign/3), so fights saved
// before there was a World 2 come back to them. #/campaign alone is the
// furthest world open.
export const mapHash = (w) => `#/campaign/w${w}`;
export const placeHash = (w, i) => (w === 1 ? `#/campaign/${i}` : `#/campaign/w${w}-${i}`);
export function placeOf(arg, p = progress()) {
  let w = null, i = null, m;
  if (/^\d+$/.test(arg || '')) { w = 1; i = Number(arg); }
  else if ((m = /^w(\d+)(?:-(\d+))?$/.exec(arg || ''))) { w = Number(m[1]); i = m[2] != null ? Number(m[2]) : null; }
  if (w == null || !worldOf(w) || !worldOpen(p, w)) return { w: latestWorld(p), i: null };
  return { w, i };
}

// How a matchup looks from your side, in words (from `odds`).
export function matchupText(odds) {
  if (odds >= 0.7) return 'Their deck suits yours: a good place to start.';
  if (odds >= 0.55) return 'A fair fight, a little in your favor.';
  if (odds >= 0.45) return 'An even match.';
  if (odds >= 0.33) return 'Their deck is built to beat yours.';
  return 'Your hardest match: their deck is everything yours fears.';
}

// ── progress ────────────────────────────────────────────────────────
// { v: 1, stars: { w1s0: 2, … }, seen: { w1: true } }: a level's stars are the rounds won there
const KEY = 'collective.campaign';
export function progress() {
  try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && p.v === 1) return p; } catch { /* a fresh start */ }
  return { v: 1, stars: {}, seen: {} };
}
function keep(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* fine without */ } }
const key = (w, i) => `w${w}s${i}`;
export const starsOf = (p, w, i) => p.stars[key(w, i)] || 0;
export const beaten = (p, w, i) => starsOf(p, w, i) >= 3;
export const isOpen = (p, w, i) => i === 0 || beaten(p, w, i - 1);
export const worldStars = (p, W) => W.stages.reduce((t, _, i) => t + starsOf(p, W.id, i), 0);
// the round to fight next at a level (1–3; null once it is beaten)
export const roundOf = (p, w, i) => (beaten(p, w, i) ? null : starsOf(p, w, i) + 1);
// the level to play next: the first not beaten yet (null once the world is done)
export const nextStage = (p, W) => { const i = W.stages.findIndex((_, k) => !beaten(p, W.id, k)); return i < 0 ? null : i; };
// what a level's Legend says before a round
export const beforeLines = (S, round) => (round > 1 ? S.back[round - 2] : S.before);
export function markSeen(what) { const p = progress(); p.seen[what] = true; keep(p); }
// How many of a level's rounds its place last showed won (undefined: never
// shown), so a win is played out there the next time you look.
export const shownOf = (p, w, i) => p.seen[`v${key(w, i)}`];
export function markShown(w, i, n) { const p = progress(); p.seen[`v${key(w, i)}`] = n; keep(p); }

// A finished campaign fight ({ world, stage, diff }: diff is the round). Only
// the round due counts: a win there is a star; the third beats the Legend and
// opens the next level (or finishes the world). What changed, for the end screen.
export function record(c, win) {
  const p = progress(), k = key(c.world, c.stage), before = p.stars[k] || 0;
  if (win && c.diff === before + 1) p.stars[k] = c.diff;
  keep(p);
  const W = worldOf(c.world), last = c.stage === W.stages.length - 1, now = p.stars[k] || 0;
  const down = win && now === 3 && before < 3; // (beaten just now)
  return { win, before, now, escaped: win && now === c.diff && now < 3, beaten: down, opened: down && !last ? c.stage + 1 : null, worldDone: down && last };
}
