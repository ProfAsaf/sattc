# Living cards: how Home's fan scene was made

Home's fan shows three cards: Ashmaw (a dragon), Seraphine (an angel) and the Barrow Queen. Leave the screen alone for a second and they act out a fight. The dragon swings its head round breathing fire, and the Queen sends her ghosts. Seraphine blocks both on the golden edges of her wings. Burns smoulder on the cards and heal. This file records how it was built, so the work can be picked up again.

The history, with Asaf's words at each step, is in README.md under "Home's fan acts on its own".

## Where it stands (2026-11-11)

- **Live on Home's fan only.** It went through five takes. Asaf's verdict on the last: "It looks great."
- **On hold for the other cards.** Asaf asked how hard it would be to have every card act like this: cards side by side would interact while untouched, following rules by role. Two attackers' attacks would bounce off each other, and defenders would block as Seraphine does. The decision was to hold off: "I'd only want to do it for the rest if we can make the hand-made puppets at this level and not worth it yet."
- So extending it means hand-made puppets, card by card, at this level. The section "If we come back to it" has the plan and its cost.

## Every card, in the game (2026-11-12)

- **Every card is a puppet now.** Sonnet agents made all 193 from `bakeoff/recipe.md`, each with its own move (`bakeoff/moves/<id>.js`). Each also carries an interaction contract: role, element, facing, where its attack leaves (`emit`), where blows land (`hit`, `guard`) and its BEATS. That's in `js/art/puppets.js`.
- **The kit is shared.** `js/puppet-kit.js` builds a move. Both the harness (`bakeoff/harness.js`) and the game use it.
- **In the game** (`js/cards-alive.js`):
  - **A card opened big** plays its move a moment after it opens, then every few seconds. It rests while turned over.
  - **In a game**, once the table has been at rest for 0.6 s, cards act, up to three at once, each on cards of its own: a card acting or acted on is in no other scene (`inUse()`). While there's room, a new scene starts 0.45–1.1 s after the last one started, so one is nearly always playing (100% of the time after the first, in a 30 s test, mostly three at once). Asaf asked for it in steps:
    - "I want it in games (and basically all the time somebody isn't touching the screen or another action isn't happening)".
    - On the first live try: "Time to have it happen is mabye too long. Can we just do 1 second of wait?", plus no interactions seen and partly hidden hand cards acting.
    - Then: "Could we have them basically have at least one of them move basically anytime there is any idle moment? Also could we have multiple cards going at same time (as long as they aren't being acted upon)?"
    - At rest means nobody touching, no move playing out, nobody choosing a target (`G.flow`), no fight under way unless it waits on your choice, no lesson, and the game not over. `restWhy()` in `js/game-ui.js` gives the reason it isn't. It doesn't look at `G.dirty`: that flag can stay set after a move is over, and it only means something while one plays. Checking it kept whole turns from ever being at rest on Asaf's phone ("Nothing happening here", 2026-11-12). Nor does it look at `G.stale`.
    - **Seeing why on a phone:** open the game once with `?alive=1` (e.g. https://profasaf.github.io/sattc/?alive=1). A line at the bottom then says where you are, whether that counts as at rest (or why not), which cards are in sight, and what the last scene did (playing, or why it didn't). It stays on until `?alive=0`. An opponent's move already shown and waiting for your tap (`gates`) is at rest. So is a sheet, and so are the opening hand and the attack and block screens.
    - What acts depends on what's in sight (`pickGame()`):
      - Full cards (your opening hand, a sheet of cards to choose from) act on the card beside them; Asaf showed the opening hand with "Nothing happening here for example".
      - On an attack, block or tricks screen, each card acts alone, so an idle strike isn't mistaken for the fight.
      - Otherwise, the table and the card raised in your hand.
    - Most scenes, about 9 in 10 when one is possible, are one table card acting on another. An attacker aims its move at a card on another side (`k.aim` = that card's `hit`); a support aims at the card nearest it on its own side.
    - A defender it reaches takes the blow on its nearest guard point (`k.blows` at the attacker's impact). Any other card jolts along the blow; the jolt moves its `.tc-body`, as the game's own shakes do.
    - About one scene in five is the card raised in your hand (the fan's `.peek`), acting alone, since aimed at the table it would look like being played. The cards under it don't act. That's how spells act in a game.
    - A card opened big in the viewer (your hand, your opening hand, the table) plays its move a moment after it shows, then every few seconds. That's `actBig()`, restarted by `bigMove()` after each `draw()`.
    - Any touch, including the lift of a finger, ends every scene. `draw()`, `redraw()` and `present()` call `hushTable()` first, so the game's own moves never meet one.
  - **Real fights** (`fight()`). Asaf: "instead of current way of 'attacking' where the cards bump each other could we just use their actual animated attack targeted to either that card or the person (who has a little mini card thing that usually gets 'bumped')?"
    - A creature that strikes plays its own move aimed at what it strikes: a card's `hit` point, or the middle of a player's plate (the fight shown big, `js/fightview.js`) or bar (the table, `strikeAll()` in `js/game-ui.js`). The blow lands at the move's `BEATS.impact`: then the game's own `FX.impact` and number. The step goes on 0.38 s after the last blow lands; the move plays on and clears itself away.
    - Two striking each other both play at once, each aimed at the other, each blow landing at its own impact. A defender among them blocks the other's blow on its guard (its move only blocks) and strikes back as that blow lands.
    - A card too small for its move to show (the table's, under 96 px of picture) rises to about 96 px across, in front of the rest (`.pp-up`), while it strikes.
    - "X fights Y" (the engine's `clash` event) plays the same way.
    - It falls back to the old charge (`FX.lunge`, `FX.clash`) when a striker has no move that aims (a defender striking on its own; Seraphine and the Barrow Queen, who act only on Home), with Reduce Motion, or when its move isn't ready within 1.6 s. Each fight's cards are fetched ahead (`readyToFight()`, when the fight view opens and when a move's events start playing out).
    - In the game the kit is lenient (`makeKit({ lenient })`): a moment timed past the move's end, or before the one listed ahead of it, is held in, not an error. Aimed at a player's bar across the screen, Ember Duelist's move had timed itself out of order and failed; with that, all 148 cards whose moves aim strike far off with their own move. The harness keeps the strict check.
    - Timing: a strike's blow lands about 1.7–2.3 s after it starts (fetching, building, then the move's own impact beat), against 0.4 s for the old charge, so fights take longer.
    - **Tapping through a fight shown big** (`js/fightview.js`). Asaf: "Clicking sometimes advances but other times it seems to replay the same attack over and over again." Tapping the left 28% of the screen went back a step, and on the first step it played that step again. In the default tap-to-go-on mode, a press over 320 ms counted as "hold to pause" and went nowhere. Now every tap goes on, wherever it lands and however long it's held. Holding still pauses a fight that runs by itself, and the arrow keys still go back.
  - **A ceiling on what moves, against the white flash.** Asaf: "Is there anything else you can add (especially now that all these effects are happening) that steps in if the phone is about to run out of memory or have a problem and go to a white screen. It was still doing that a lot?"
    - On an iPhone every element in motion is its own layer, as big as itself and drawn at the largest its motion scales it (~12.6 MB a screen at 3x). The game's own effects keep under ~220 moving at once (`.phone-tests/ui-busy.mjs`). A move keeps every part and effect it has moving for its whole length: measured at fight-view size (150 px), a move alone is 45–210 elements, and usually 0.1–0.8 screens. On a few cards one huge glow is most of it: 4.3 screens for the Pale Abbess, 2.8 for Grand Illusion. Three scenes at once on the table reached 606 moving elements.
    - So before any move plays, `fit()` in `js/cards-alive.js` measures what it would set moving: how many elements, and how much screen (each element's box times the most its keyframes scale it). That includes the card's own drawn lights and motes, which move while its picture is in sprites. It then fits the move to the room left. First the pictures' own motions are stilled (the lights stay, unmoving; `data-still` keeps `js/sprites.js` from restarting them). Then the move's biggest effects go, then every other one of the rest (fewer sparks). The body, the picture's parts, always plays.
    - The room, by calm level, as [screens, elements]: scenes together [1.4, 220], then [0.7, 110], then nothing. A fight's moves [2.4, 280], then [1.2, 140]; at level 2 fights charge as they used to. A card opened big (viewer, zoom) [2, 240], then [1.1, 130], then [0.7, 80].
    - A scene that can't fit even body-only doesn't play, and no scene is built while the others leave fewer than 30 elements. A fight that can't fit charges as it used to.
    - Measured on a demo table left alone 25 s: the cards kept at most 241 moving, against 606 before; 6 of 11 scenes were trimmed and 1 held back. Six heavy moves at fight-view size all played their own move, trimmed where needed: the Pale Abbess 94 → 44 elements, 4.3 → 0.2 screens.
    - Calm levels come from `js/steady.js` (see the README, "When the app restarts"). After the phone closes the game once today: level 1, one scene at a time, half the room. After twice: level 2, nothing acts by itself (Home's fan scene included), fights charge, and an opened card plays a trimmed move. `?calm=0|1|2` sets it by hand, and `?alive=1` shows it.
    - Scenes in a layer share one effects overlay, since each full-screen overlay where a glow blends may be a screen of layer by itself. A fight has its own.
    - **Frames** (`watchFrames()`): while anything acts, the time between frames is watched. When most of the last 40 come over 45 ms apart (a phone saving power still draws 30 a second), the cards take half the room and one scene at a time for a minute (two the next time, and so on), and the scenes past the first end at once. With the CPU slowed tenfold it noticed in 3.2 s (frames 67 ms apart); at full speed, never. The readout shows "frames slow".
    - **What it keeps:** painted textures for the last 24 cards (older ones' blob URLs revoked), sprite files for the last 48 (`js/sprites.js`).
  - **Everywhere else** (Cards, the draft, the Rules page), one stage runs for the whole app (`startScreenAlive()`, started once in `app.js`). After 0.6 s untouched, cards in sight act, up to two at once (see the cost below): an attacker or support aims its move at the card beside it, a defender there blocks, and any other card jolts. Some scenes are a card on its own. Home's fan keeps its own scene, and the zoom its own loop.
  - **In sight** means wholly on screen, with the middle of its picture the topmost thing there (`elementFromPoint`). That rules out cards under a sheet, a viewer, a sticky bar, or another card of a fan.
  - A scene's effects go in the fixed layer its card is in (`layerOf()`: the game, a sheet, the draft) as `.pp-fx.pp-in`, so they draw above it. On a page, they go on a fixed overlay (`.pp-screen`).
  - A card's picture is swapped to sprites for its scene only, and swapped back after. Nothing plays with Reduce Motion. A test can set `window.__ppPicks = []` to note who acts on whom.
- **The foil.** Legendaries in grids lost the moving foil. It moved a background, which repainted every legendary on screen every frame: 270 style recalcs in 3 s on Cards at rest, now 0. Shown big, the foil still slides as a transform.
- **Cost, measured in headless Chrome:**
  - On its own, a move costs nothing on the main thread: 0 recalcs in the harness, and 0 on a page of 8 cards.
  - On the full Cards page (97 card pictures), Chrome produces a main-thread frame every frame while anything moves, about 70 a second. Removing the pictures stops it. It looks like Chrome's image budget. It's the same for the zoom over that page, and it isn't measured on an iPhone.
  - With three scenes at once on that page, the main thread had 2,485 ms of tasks during one scene (350 recalcs, 10 layouts), against 729 ms with one at a time (289 recalcs, 1 layout). So pages run at most two at once; games, with a dozen pictures, three.

## What plays

A scene starts after a second without a touch, and the next one a second after it ends. Any touch, key, wheel or pointer stops it at once and snaps every card back. Between scenes, the wings beat slowly and the ghosts sway. With Reduce Motion on, nothing plays. The scene also stops while the page is hidden or a card is zoomed open.

Every motion lasts the whole scene: END = 4500 ms. Each motion's moment is written into its keyframes (see the rules below).

| ms | Ashmaw | the Queen and her ghosts | Seraphine |
|---|---|---|---|
| 0–900 | Swings its head round to the right. The head narrows to a sliver at 450 and widens again, mirrored. It breathes a cone of fire down onto the burning city all the way. Billows burst flat on the roofs, flames stand up, and smoke rises. Scorches spread on the ground where the fire lands (from 350, 620 and 890). | Her aura gathers from 150 ms. | |
| 900–1300 | Rears up (40°, settling at 32°). Fire gathers in its mouth. | Her crown and raised hand flare as each ghost leaves its card (960 + 110·i). A dark gloom spreads round each ghost as it flies. | |
| 1300–2250 | A cone of flame leaves its mouth. Billows stream along an arc to the very edge of Seraphine's left wing. Each billow takes 300 ms, is thrown back off the edge, and rises into smoke. | | 1350–1700: both wings go up, and their gold edges (the shield) light. |
| 1680–2700 | | Each ghost strikes the right wing's edge (1760 + 110·i). It squashes, is thrown well back, tumbles head over heels and flies home. As each double lands (about 3.1–3.7 s), the ghost on the card reappears. | Flames lick back off the left edge, with light and sparks where the fire strikes. The fire scorches her card at 1700, 1880 and 2080. The left wing strains, the right jolts at each blow, and she braces (1800–2700). |
| 2300–3480 | Lowers its head and turns it back, through a sliver at 3030. Its drawn fire returns (3260–3700). | The aura fades by 3600. | 2800–3500: the wings come down. |
| 3480 (BACK) | Every scorch, on both cards, has burned until now. Each goes out and heals over 800 ms, a light passing over it. | | |
| 4600 | The scene ends: every motion is cancelled, and the pictures wait, unseen, for the next scene. | | |

## The files

| File | What it does |
|---|---|
| `js/home-alive.js` | The whole scene: when it plays, what moves and when, and where things are. |
| `js/fx-art.js` | The painted textures (fire, smoke, gloom and scorches), made once per page. |
| `js/art/puppets.js` | Each puppet card's parts: what is cut out, its joint, and the scene's anchor points. |
| `js/art/scenes/new-a.js`, `new-b.js`, `new-c.js` | The three cards' drawings, with their moving pieces tagged `data-part`. |
| `tools/bake-live.mjs` and `tools/bake-live.html` | Photograph each card's picture and cut out its parts. Output: `art/live/<id>.webp` and `.json`, `art/live/<id>-p-<part>.webp`, and the manifest `js/art-live.js`. |
| `js/sprites.js` (`liven`) and `js/render.js` (`livenArt`) | Lay the baked picture and its part sprites over a card. A part has no motion of its own until a scene moves it. |
| `js/app.js` | Home calls `startHomeAlive(view)` after `livenArt`; leaving Home calls `stopHomeAlive()`. |
| `css/app.css` | The scene's classes. `.fan-fx` is the overlay above the cards. `.fx` and `.lit` are effects (`.lit` adds its light). `.fx-in` is the sealed box inside a card. Also `.fx-scorch`, `.fx-rim` (shield edge), `.fx-wing` (wing glow), `.g-*` (glows), `.ff-ghost` and `.ff-spark`. |
| `.phone-tests/look-home-scene.mjs` and `.phone-tests/diag-*.mjs` | The checks, the recording and the diagnostics. They're local only: `.phone-tests` is gitignored because the scripts hold this computer's paths. See "Testing and diagnosing". |

## Making a card a puppet (by hand)

This is what was done for the three cards. It's the part that would be repeated for each new card.

1. **Tag the moving pieces in the card's drawing** (`js/art/scenes/*.js`) with `data-part="<name>"`:
   - **Ashmaw's head.** The figure's shapes were split into `head` (neck, jaws, horns, spikes) and `body`. The head went inside the figure as `<g data-part="head">`, with its eye, so the figure's rim, fill and glow layers still draw it. One highlight drawn outside the figure carries the same tag. The fire the dragon breathes as drawn is wrapped in `<g data-part="breath">`.
   - **Seraphine's wings.** Both are one group, `data-part="wings"`.
   - **The Queen's court.** The ghost bodies and their eyes are two groups, both `data-part="court"`.
   - **Check the card still looks the same.** A pixel diff against the previous bake should show nothing; Ashmaw's showed 0 pixels over 24.
2. **Describe the puppet** in `js/art/puppets.js`. Each part has these fields, in the drawing's units (300 × 210):
   - `name`.
   - `of`: its source. That's a selector (`'[data-part=wings]'`), a figure (`'fig:0'`), pieces of a figure's own drawing (`'fig:0 [data-part=head]'`, hidden from all of the figure's layers at once), a character from `js/art/alive.js` without some pieces (`'alive:0 - [data-part=wings]'`, which is Seraphine without her wings), or a list of these.
   - `pivot`: its joint.
   - `poly` (optional): a polygon that splits a source. Each wing is half of `wings`, and each ghost is its own polygon of `court`.
   - `cut` (optional): the rest of the source stays drawn, through a mask that keeps the joint.

   Add whatever points the scene needs: `ashmaw.neck` and `ashmaw.mouth`, and `seraphine.edges` (the raised wings' outer edges, where blows land).
3. **Bake it.** Run `python tools/serve.py 8770`, then `node tools/bake-live.mjs <id>` (with no id, it bakes Home's three).
   - Each source is photographed three ways: with what's drawn after it hidden (F), without itself as well (B), and alone (A).
   - The part's colours are (F − B(1 − A)) / A. That keeps them complete even where something in front covered them, so a raised wing shows no hole where her body was.
   - Polygons are cut with 4× supersampled masks. The base picture has the parts taken out.
   - Output: `<id>.webp`, one `<id>-p-<name>.webp` per part, and `<id>.json` with `{ a: 'part', name, x, y, w, h, ox, oy, img }`, where ox and oy are the pivot in % of the part's box. `js/art-live.js` is updated too.
4. **Measure the scene's anchor points from the cut parts.** For the shield edges, each wing's alpha was rotated ±20° about its pivot. The outermost opaque points still inside the picture became `PUPPETS.seraphine.edges`: [33, 38] and [267, 38]. That took a few lines of Python with PIL.
5. **Choreograph it** in `home-alive.js`, following the rules below.

## The scene's rules (`js/home-alive.js`)

- **One timeline.** Every motion runs the whole scene (END) with `fill: 'forwards'`, its moment set by keyframe offsets in ms. No `delay`s: each motion that starts or ends at its own moment wakes the main thread.
  - `fx(el, [[ms, props, easing], …])` makes an effect. It's unseen before its first keyframe and after its last.
  - `act(el, list)` moves a part. It holds its first pose before and its last after.
- **One motion per element.** A second transform animation on the same element puts it on the main thread. So a scene first cancels the idle loops, then starts each wing and ghost from the pose it was in (`from(el)`, read with `getComputedStyle`).
- **Made once, replayed.**
  - The first scene of a visit to Home makes everything: about 140 effects and their motions. They're kept in `st.made`.
  - Later scenes just `play()` those motions again. The effects wait, unseen, in between.
  - Only the motions that depend on where the wings and ghosts were are made anew each time: the wings, their two copies, and the ghosts on the card.
  - If the fan moves (`key` from its size and the cards' positions), everything is made afresh.
  - `.fan-fx[data-on]` marks a scene that's playing.
- **Where things are.** `frames(st, els, more)` probes three corners of each element (picture boxes, card faces). It gives a map from fractions of the element to fan px, which works on tilted cards, plus its inverse, `inv`. `more` reads anything else (the ghosts' places, sizes) in the same layout pass. `PA(x, y)` and `PS(x, y)` give points of Ashmaw's and Seraphine's drawings on the fan.
- **Where things go.**
  - `.fan-fx`, over all three cards, is isolated and `contain: strict`. `under()` puts smoke and gloom beneath the rest.
  - A sealed `.fx-in` box inside a card's picture or face holds what that card clips: the breath, the scorches, the Queen's glow.
  - A ghost leaves its card by handing over to a double on `.fan-fx` at the same place and tilt. It comes back the same way.
- **Building blocks.**
  - `pic` and `picIn` place painted textures, centred, standing on a base, or hanging from the top.
  - `light` and `lightIn` place CSS glows.
  - `flicker` makes a flame catch, flicker, lean and die.
  - `smokeUp` makes rising smoke.
  - `scorch` makes a scorch that spreads, smoulders until `BACK`, then heals with a light. It lies flat on the ground for the city, or upright on Seraphine's card.
  - `spark` makes a spark. `arc` and `smooth` give paths, and `dice` gives the scene's random throws.
- **The shield.** Each raised wing gets two copies of itself on the same keyframes. A gold copy sits behind it, 7% larger: that's the lit edge (`.fx-rim`: a silhouette with a gold drop-shadow). A faint glowing copy sits over it (`.fx-wing`).

## Painted fire (`js/fx-art.js`)

- **The textures.** Each is a small picture painted pixel by pixel from value noise (fbm) through a heat-to-colour ramp, running from transparent red, through orange and yellow, to white:
  - `flame` and `flame2`: tongues of flame standing on their base.
  - `jet`: a tongue hanging from a mouth.
  - `puff`, `puffHot` and `puffCool`: billows.
  - `smoke`.
  - `gloom`: the ghosts' dark, not fire.
  - `scorch1`–`scorch3`: each a `char` and a smouldering `glow`.
- **Moving fire from still pictures.** Every flame on screen shows one of these still pictures. The flicker and roll come from about 150 of them moving at once and adding up their light (`mix-blend-mode: plus-lighter`).
- **Painted once per page, ready about half a second after Home shows.**
  - They're painted on canvases kept off the GPU (`willReadFrequently`) and encoded with `toDataURL`, one per task.
  - The encoded images are kept as blob links and decoded before use.
  - Reading a GPU canvas back waited on a GPU busy drawing the page: up to 1.3 s per picture. `toBlob` waits for idle time that a busy page may not have.

## Keeping it cheap (the measured lessons)

Everything moves by transform and opacity, on the compositor. Each lesson below cost a debugging round, so keep them:

| Problem | Cost seen | Fix |
|---|---|---|
| Motions starting and ending at their own moments (`delay`) | About 200 style recalcs and 0.9 s of work a scene, though every animation was composited | One shared start and end: down to 1–2 recalcs |
| Two transform animations on one element | It ran on the main thread | Combine them, or take over from the idle motion at its pose |
| Something moving while wholly out of sight (clipped away, outside the fan, inside `visibility: hidden`) | It ticks on the main thread | Effects that would land outside the fan aren't made |
| A motion started on a picture that hadn't loaded | It stayed on the main thread the whole scene: 321 recalcs and 1.2 s | A scene waits for its parts' pictures (`complete` and `naturalWidth`) |
| Adding effects inside a card | The cards size their type by their own width (container units), so the whole card was laid out again: about 150 ms on the first frame | A sealed box (`contain: strict`): about 47 ms |
| Measuring after making things | Each measure laid the page out again | Measure everything first, in one pass |
| Making about 140 effects each scene | About 0.1 s of script every scene | Make them once and replay: a replay never holds the page up 50 ms at a time |
| Textures via GPU canvas and `toBlob` | 1.5–2.4 s before the first scene could start | CPU canvas and `toDataURL`: about 0.5 s |

Now, headless Chrome at phone size measures: the first scene of a visit costs about 0.1 s to make. A replayed scene never holds the page up 50 ms at a time. While a scene plays, the page does 1 style recalc and about 35 ms of work in 4 s. It hasn't been measured on an iPhone, where WebKit composites differently.

## Testing and diagnosing

All of these live in `.phone-tests/`, which is local and not in git. They drive Chrome through `drv.mjs` at phone size: 402 × 799 at 2×, with touch.

- `node look-home-scene.mjs [base]` is the scene's checks and recording:
  - A scene starts by itself, a second after its pictures load.
  - The next starts a second after it ends.
  - A touch stops it at once, and it comes back a second later.
  - It cleans up, with no motions left.
  - Starting one holds the page up for less than 120 ms at a time (a `longtask` observer). The playing cost is measured on the second scene, because the first can overlap the app's own start-up.
  - It records the scene frame by frame as a GIF plus stills in `%TEMP%/collective-shots`. It sets `window.__sceneHold` and steps every animation's `currentTime`, so the scene doesn't clean up mid-recording.
  - Run it against the live site with `node look-home-scene.mjs https://profasaf.github.io/sattc/`.
- `node diag-scene-composite.mjs` traces a scene and lists every animation Chrome wouldn't run on the compositor, and why. It reads `compositeFailed` bits from the trace's `Animation` events.
- `node diag-scene-tasks.mjs` lists the main-thread tasks around a scene's start, and what's inside each: script, style, layout or paint.
- `node diag-stagger.mjs` compares 40 sparks started at their own moments with the same 40 sharing one timeline. Staggered: 160 recalcs and 0.8 s. Shared: 5 recalcs and 0.02 s.
- `node diag-fx-textures.mjs` shows the painted textures enlarged, and how long painting took.
- To find which group of effects ticks, pause groups of animations in turn (`getAnimations()` filtered by class) and watch `RecalcStyleCount` from `Performance.getMetrics`.

## If we come back to it

The ask was cards side by side that interact while untouched, following rules: attacker against defender is this scene, and attacker against attacker means their attacks collide and bounce apart. Per Asaf, it's only worth it with hand-made puppets at this level. What that would take:

- **For every card:**
  - Tag its moving pieces in its drawing, with the look checked unchanged.
  - Write its puppet spec and bake it.
  - Measure its anchors: where its attack starts, and where blows land.
  - Give it a role (attacker, defender, support and so on) and an element (fire, frost, shadow, light, nature and so on).

  There are 171 cards: 91 creatures, 61 spells, 12 relics and 7 fields. Keywords hint at roles: Guard, Watchful and Shield suggest defenders; Venom, Rush, Overrun and Hunt suggest attackers. Of the creatures, 11 hit harder than they last, 20 last much longer than they hit, and 60 are even.
- **Shared moves**, built like this scene:
  - Attack styles by element: fire as here; frost, ghost swarms (as here, with gloom), lightning, projectiles and lunges would be new.
  - Blocks and reactions: shield edges, recoils, scorches, frost-over, healing light.
  - A clash for two attackers.

  New textures would get their own colour ramps in `fx-art.js`.
- **A general engine.** The three-card choreography here is written by hand. A general version would pick a pair's rule from their roles and place moves by each card's anchors. The rules above still apply: one timeline, made once and replayed, sealed boxes, measuring first.
- **Where it would show.** Home, the deck screen and the collection are safe. In a game, an idle dragon "attacking" the angel in your hand could be taken for a real game event, so only while waiting for the opponent, if at all. One scene per screen at a time.
- **The cost.** The general engine and shared moves would take roughly 7–10 sessions like the ones that made this scene, plus the per-card puppet work. For one card that means tagging, baking and choreographing, with rounds of feedback like the five takes here.
