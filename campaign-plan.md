# The campaign: the whole road (plan, 2026-11-11)

Asaf: "Can you build all the worlds and the whole game? Maybe draft is last world or something crazy you can't face on p v p?" Then: "Build it all."

Six worlds. In each you play the deck of the last world's boss. The story keeps heading toward what Hush was fleeing: the Eclipse, which eats the dawn and hollows the Legends it touches. The finale is a draft, followed by a boss nobody could face in PvP. Each world is published as it's finished.

## The arc

| World | Name | You play | Its Legends (in order) | Pictures |
|---|---|---|---|---|
| 1 | The Harbor Road (built) | The Long Game (Marisol) | Mirelle, Aeris, Ymra, Lumen, Halvard (boss) | new |
| 2 | The Fog Country (built) | The Wall (Halvard) | Vesh, Kasimir, Morrow, Oriel, Hush (boss) | new |
| 3 | The Long Night | Fogbound (Hush) | hollowed Lumen, Ymra, Aeris and Mirelle, then Seren (boss), the Eclipse's herald | World 1's map and places under the eclipse, plus a new place: the Lighthouse |
| 4 | The Drowned Dawn | Storm Rising (Seren) | hollowed Vesh, Kasimir, Morrow and Oriel, then Ione (boss) | World 2's under the eclipse, plus a new place for Ione |
| 5 | The Edge of Night | Spellbloom (Ione) | your companions hollowed, freed one by one: Seren, Hush, Lumen, Halvard, then Marisol (boss) | all new: the deep east |
| 6 | The Eclipse (finale) | a deck you draft | the Eclipse's heralds, then the Eclipse itself | new |

- **The story.** Hush: "Something drove me west out of the deep east… It's still coming."
  - **World 3:** the dawn doesn't come back to the harbor. Hush's fog carries you west through the Wall, down the Harbor Road in the dark, past the Legends of World 1, now hollowed. The eclipse is in their eyes, their own power turned on them. At the end, Seren, the Storm-Scholar ("She took notes on the lightning. Then it took notes on her."), holds the dark lighthouse, the Eclipse's herald.
  - **World 4:** under the same eclipse, east again through the Fog Country to Ione, the Bloomcaller, whose spells root the dark.
  - **World 5:** the Eclipse takes your own companions. You free them one by one, Marisol last.
  - **World 6:** everyone together. You draft a deck from all their powers and face the Eclipse.
- **Freeing a Legend.** Beating a hollowed Legend for good frees them: the eclipse goes out of their eyes, and each gives a clue.
- **Difficulty.** Worlds 1 and 2 climb by the bot data alone (each Legend fought harder than the last). From World 3 on, the decks left don't line up that neatly. So hollowed Legends get **boss powers** that grow along the world, and the matchup line still shows the data. Every level is still three rounds: Casual, Practice, Expert.

## Bot results the order uses

From 3,198 Practice-against-Practice duels (`MATRIX=<file> node tools/train.mjs decks practice 1600`). Each row is how often that deck wins against each other deck (%):

- Fogbound: The Wall 73, Blood and Bone 72, Rot and Bloom 65, The Charge 61, The Long Game 61, Weathermakers 59, Endless Swarm 57, Spellbloom 57, Storm Rising 50, Smoke and Mirrors 47, Sky and Arrows 43, The Giant 42.
- Storm Rising: Rot and Bloom 53, Fogbound 50, Weathermakers 45, Smoke and Mirrors 40, Blood and Bone 37, Sky and Arrows 34, The Charge 32, Endless Swarm 31, The Giant 29, Spellbloom 25, The Wall 24, The Long Game 22.
- Spellbloom: Storm Rising 75, Weathermakers 69, Sky and Arrows 64, Blood and Bone 64, Rot and Bloom 59, The Giant 52, The Charge 52, Smoke and Mirrors 48, Fogbound 43, The Long Game 40, Endless Swarm 40, The Wall 39.

## Boss powers (campaign only, never in PvP)

A level's `boss: { life, energy, board }` goes into the bot's player in the game's setup (`engine.js newGame`):

- `life`: extra Life.
- `energy`: extra Energy every turn, from the first.
- `board`: creatures already on the table when the game starts.

A setup without it plays as before, and saved games replay the same way.

- **Hollowed Legends** grow along their world: for example +2 Life on the first, up to +8 Life and +1 Energy on the boss.
- **The finale** goes further (things you can't face in PvP): much more Life, more Energy, creatures on the table from the start, and its own cards.

## Pictures

- **The eclipse** (`campaign-art.js`): `eclipsed(draw, …)` draws an old picture again under an eclipse. A violet-dark wash goes over everything, with a black sun ringed in light where its light was (the picture's key light, its `finish` `at`), ashen motes, and a cold grade. The ids are the old ones with `~night`, for example `place-market~night`. World 3 reuses World 1's map and places this way, and World 4 reuses World 2's. That's far fewer new paintings: World 3 and World 4 each need one new place.
- **Hollowed Legends' faces** get a cold violet treatment in the campaign's medallions and headers (CSS, from the level's `hollow`).
- **World 5 and the finale** are all new: a map and places each.

## The finale (World 6): the draft

You draft a deck with the bot draft that's already in the game (draft.js and draft-ui.js, "Bots: draft a deck against them"), and the campaign keeps it for the finale. You can redraft whenever you like. Its levels are the Eclipse's heralds and then the Eclipse, with the strongest boss powers.

As built: three levels. The Echo of Hush (the Falls of Night) and the Echo of Ymra (the Stair of Ash), copies the Eclipse made, in the Legends' faces; then the Eclipse itself (Under the World), 20 more Life, 2 more Energy every turn and three creatures on the table. Beaten, the map turns to the sunrise.

## Status

- [x] World 1, World 2
- [x] the eclipse pictures, hollowed faces, boss powers
- [x] World 3: data, story, the Lighthouse, tests, publish
- [x] World 4: data, story, Ione's place (the Root of the Dawn), tests, publish
- [x] World 5: data, story, new map and four places (companions only: Seren, Hush, Halvard, Marisol), tests, publish
- [x] World 6: the draft in the campaign (one bot, kept apart, redraft any time), the Echoes and the Eclipse, the finale's pictures and the sunrise map, tests, publish
