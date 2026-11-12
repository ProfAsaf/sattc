# Recipe: turning a card into a living puppet

You are making cards of **The Collective**, a phone card game, come alive: every card is being done, a batch of three at a time, and you have one batch. Each card gets its own **signature move**: a few seconds in which its picture acts, then settles back exactly as drawn. Each also carries what a later stage needs to have cards **interact**: one card's attack striking another, a defender blocking it (see "Interactions"). This file is everything you need. Read it all before you start.

## What you're making, and the bar

The game's card pictures are drawn in code (SVG, "cut paper lit from behind"). On the game's Home screen, three cards already act out a fight when the screen is left alone: a dragon swings its head round breathing fire, an angel throws up her wings as a golden shield, a queen sends her ghosts. Those three are the **quality bar**. They were made by hand, by the method below, and the game's owner said of them: "It looks great." Your moves must reach that level:

- **It reads at a glance on a phone.** One clear action with a beginning, a peak and an end. Someone glancing at it knows what happened: she hurled lightning, he took the arrows on his shield.
- **It's alive, not mechanical.** Anticipation before the action (a gather, a wind-up), overlap and follow-through after it (a recoil, a settle), easing on every motion, no two things starting on the same beat unless they should. Fire in Home's scene is about 150 small painted pictures at once, each flickering and drifting, adding up their light. Light spills onto things: the city glows under the dragon's fire, sparks fly where a blow lands, scorches smoulder and heal.
- **It belongs to the picture.** Same style, same light, same palette. Effects come from the card's own elements (her lightning, his shield, the lance's violet fire). Nothing looks pasted on.
- **It starts and ends at rest.** Before and after the move, the card looks exactly as drawn.
- **It's cheap.** Everything moves on the phone's compositor (transforms and opacity only), so the page itself does nothing while it plays. The harness and its kit enforce most of this for you.

To see the bar: read `living-cards.md` (how Home's scene was made, and its rules) and skim `js/home-alive.js` (the scene itself). Then look at the worked example below, which is one of those cards redone with this recipe's tools.

## Your setup

You're given a folder (a git worktree of the game on its own branch), a port, a lane (A or B) and a batch of card ids. `bakeoff/cards.json` has each card's data, the drawing file it's in, and a suggested role and element.

- **Work only inside your folder.** Don't read, list or change anything outside it: not the game's main folder, not other `collective-*` folders next to yours. Don't push, merge or switch branches. Don't commit; your work is collected from your folder.
- **Only your batch's cards.** Other cards in the same drawing file, and their puppets, are someone else's.
- **A page server is already running** for your folder at `http://localhost:<port>`. Don't start or stop servers. If it stops answering, say so in your final report.
- **Run commands from your folder.** Each shell command starts fresh, so begin every command with `cd "<your folder>" &&`. In the Bash tool the folder looks like `/c/Users/.../collective-bakeoff-xxx`; file tools (Read, Edit, Write) take the Windows form `C:\Users\...\collective-bakeoff-xxx\...`.
- **Every command that drives the browser needs `BASE`**: `BASE=http://localhost:<port> node ...`.
- **Headless Chrome only through the given scripts** (`bakeoff/checks/check.mjs`, `tools/bake-live.mjs`), **one at a time, never in the background**: this computer can't run many browsers at once. If you ever write your own browser script, use `bakeoff/checks/chrome.mjs` (it deletes its temporary profile folder when it ends; leftover profiles once nearly filled the disk). Don't use any browser or browser-pane tools.
- **Do the work yourself.** Don't start other agents.
- **Look at pictures with the Read tool**: it shows PNG and WebP files.

## The files

| File | What it is | You |
|---|---|---|
| `js/cards.js` | Every card's data: name, type, rules text, and `art` (what the picture shows). | read |
| `js/art/scenes/*.js` | The drawings: one function per card id, e.g. `'lightning-theorist'(s) { ... }`. | tag moving pieces in your three |
| `js/art/kit.js` | The drawing helpers (`s.figure`, `s.bloom`, `s.glow`, `taper`, `blob` ...). | read only |
| `js/art/puppets.js` | Each puppet card's parts, anchor points and interaction contract. | add yours in your lane's section |
| `bakeoff/cards.json` | Every card: data, drawing file, suggested `role` and `element`. | read |
| `tools/bake-live.mjs` | Photographs a card and cuts out its parts. Writes `art/live/<id>.webp`, `art/live/<id>-p-<part>.webp`, `art/live/<id>.json` and updates `js/art-live.js`. | run |
| `bakeoff/moves/<id>.js` | The card's move, built with the harness kit. | write |
| `bakeoff/moves/ashmaw.js` | **The worked example**: the dragon from Home, as a solo move. | read |
| `bakeoff/harness.html` | The harness: one card big at phone size; plays its move. | use via the checks |
| `bakeoff/checks/check.mjs` | The four checks, and a picture of the move. | run |
| `bakeoff/ref/<id>.png` | Each card's drawing as it was before you started (for check a; made for you before you start). | never change |
| `bakeoff/out/` | What the checks write: strips, diffs, reports, the log. | read |

Don't change other cards, Home's three puppets in `js/art/puppets.js`, the shared drawing helpers, the harness, the checks or the references.

## Interactions: what every card carries

Later, cards side by side will act on each other by their roles: an attacker's fire strikes the card beside it and a defender throws up its shield; two attackers' attacks meet and burst apart; a support's light heals a neighbour. That engine isn't built yet. So that it can use your card without redoing it, every card you make carries this **contract**:

1. **In its puppet entry** (`js/art/puppets.js`):
   - `role`: what it does in a fight. One of:
     - `attacker`: it strikes. Creatures that hit hard, and spells or Traps that deal damage or destroy.
     - `defender`: it blocks. Guard and Shield creatures, walls, and protective spells.
     - `support`: it helps. Healers, buffers, growers, card draw, Energy.
     - `aura`: fields and relics: the place itself acts.

     `bakeoff/cards.json` suggests one from the card's rules. Check it against the card's text and picture, and change it if it's wrong (say so in your report).
   - `element`: what its effects are made of. One of `fire`, `lightning`, `frost`, `water`, `wind`, `earth`, `nature`, `venom`, `shadow`, `spirit`, `bone`, `blood`, `light`, `arcane`, `steel`. Suggested from its picture; pick what its move shows.
   - `facing`: `left`, `right` or `front`: which way its figure (or the spell's thrust) faces in the drawing.
   - `emit: [x, y]`: where its attack or boon leaves from (jaws, hands, a blade's tip, the spell's heart). Attackers and supports.
   - `hit: [x, y]`: where blows land on it (its chest, its middle). Every creature.
   - `guard: [[x, y], ...]`: where it takes blows when it blocks (a shield's face, wing edges). Defenders.

   Measure these from the cut parts (step 5), in the drawing's units, at rest.
2. **In its move** (`bakeoff/moves/<id>.js`): `export const BEATS = { release, impact, settle }`, in ms: when its attack (or boon, or brace) goes out, when it lands (or the first blow lands), and when the card is back at rest. The engine lines up two cards' moves by these.
3. **Its move can be aimed.**
   - **Attackers and supports**: the attack or boon goes to `T = k.aim || <your own target>`. `k.aim` is another card's point, in your drawing's units: it may be far outside your picture, to either side. Alone, `k.aim` is null and the move uses its own target. Work out every point of the attack's path, and where it lands, from `emit` and `T`. Turn the figure (or the part that throws) toward `T`: if `T` is behind it, mirror or turn it, as the worked example does. Put what flies or lands outside your picture on the overlay (`k.pic`, `k.light`), never `picIn`.
   - **Defenders**: blows come at you as `k.blows || <your own blows>`: a list of `{ at: ms, to: [x, y] }`. Alone, `k.blows` is null and you use your own (the arrows in the picture, or whatever its threat is). React to each blow at its time and place, snapped to your nearest `guard` point: a jolt, a flash, sparks.
   - **Auras** aren't aimed: their move spreads over their picture and past its frame.

   Check (e) tries it: it aims your move at another point, or sends it two blows. It checks that the move builds and stays cheap, and makes a strip with those points ringed. Look at that strip: the attack must go to the ring.

## How a puppet works

A card's picture is baked into a still picture **without** its moving parts, and each part is cut out as its own little picture (a sprite) laid back over it at rest. At rest you see exactly the drawing. A move then turns, shifts, scales and fades the parts (each about its own joint) and adds effects: small painted pictures and glows, inside the card's picture or above the card. Nothing is redrawn while it plays.

Some bits of a drawing already move on their own forever (rain, stars, embers, motes, glows: elements with the class `rise`, `float`, `twinkle`, `drift`, `breathe`, `fall`, `sway` or `turn`). The bake cuts those out as **ambient sprites** that keep their own motion. They can't be part of a puppet part, and a move must not animate them (a second motion on one element puts it on the main thread). If one sits on a part you move (a glow on a hand), either let it be, cover it with an effect while the part is away, or take its class off in the drawing so it becomes ordinary drawing (that doesn't change the still picture, but it stops that bit's ambient motion: say so in your report).

## For each card, in order

### 0. Note that you start it

```
cd "<folder>" && node bakeoff/checks/check.mjs <id> start
```

### 1. Look at it

- Read the card in `js/cards.js` (search for `id: '<id>'`): its type, rules and the `art` line.
- Find its drawing: `grep -n "'<id>'\|  <id>(" js/art/scenes/*.js`. Read the whole function. Note how each piece is drawn and in what order (later is in front).
- See it: `BASE=http://localhost:<port> node bakeoff/checks/check.mjs <id> look`, then Read `bakeoff/out/<id>-look.png` (the picture at 3x; the drawing's units are 300 x 210, so divide pixels by 3).
- Read its line in `bakeoff/cards.json`: confirm or change its `role` and `element` (see "Interactions").
- Plan the move from its role (see "Moves by role", at the end) and its picture: which pieces move, about which joints, what effects, its target or blows, and the timeline in ms, with its BEATS. Write the plan down in a comment at the top of the move file.

### 2. Tag the moving pieces in the drawing

Wrap each piece that will move in a group with `data-part="<name>"`:

- A group of drawn elements: `s.add('<g data-part="lance">'); ...the drawing calls...; s.add('</g>');` (as Seraphine's wings in `js/art/scenes/new-c.js`).
- Pieces of a figure. `s.figure(inner, opts)` draws one silhouette several times (rim light, fill, glow) from the shapes in `inner`. Tag pieces inside `inner`: `` `<g data-part="arm">${P(armShapes)}</g>` `` (as Ashmaw's head in `js/art/scenes/new-a.js`; `P(...)` there makes a `<path>`). Split the shapes so that the piece's shapes go in its group and the rest stay outside it. The puppet then names it `'fig:N [data-part=arm]'`, N counting the drawing's figures from 0 in drawing order.

Rules: change only what you must; never change a shape, colour or order. Then check that it still looks the same, to the pixel:

```
BASE=http://localhost:<port> node bakeoff/checks/check.mjs <id> a
```

Must say 0 changed pixels. If not, `bakeoff/out/<id>-a-diff.png` shows where.

### 3. Describe the puppet in `js/art/puppets.js`

Add an entry `'<id>': { role, element, facing, emit, hit, guard, ...other anchors, parts: [...] }` to `PUPPETS`, **just below your lane's line** (`// ── lane A's puppets ...` or `// ── lane B's puppets ...`), so two lanes' entries never touch. Read the comments and Home's three entries there first. Each part, in the drawing's units (300 x 210):

- `name`: what the move calls it.
- `of`: what it's cut from:
  - a selector into the drawing: `'[data-part=lance]'`;
  - a whole figure: `'fig:0'`;
  - tagged pieces of a figure's own drawing: `'fig:0 [data-part=arm]'` (hidden from every layer of that figure at once: rim, fill and glow);
  - a character without some pieces: `'alive:0 - [data-part=wings]'`;
  - or a list of these, taken together.
- `pivot`: its joint `[x, y]`: the point it turns about.
- `poly` (optional): a polygon `[[x, y], ...]` splitting the source: the part is only what lies inside it. Two parts may split one source (Seraphine's left and right wing).
- `cut: true` (optional, with `poly`): the rest of the source stays in the picture (an arm cut out of a body); without it, everything in the source comes out as parts.
- `joint` (optional, with `cut`): the radius of the joint kept in both (default 4).

Parts are laid over the picture in the order they're drawn, all of them over the rest of the picture. So a piece that has something drawn in front of it in the drawing will cover that thing when cut out; check (b) catches that (cut the thing in front too, or move only what's in front).

Add the anchor points your move needs as named entries (`hands: [[95, 66], [149, 68]]`); the move reads them as `k.spec`.

### 4. Bake it, and check the bake

```
BASE=http://localhost:<port> node tools/bake-live.mjs <id>
BASE=http://localhost:<port> node bakeoff/checks/check.mjs <id> b
```

Check (b) says which parts were cut and whether the baked picture with its parts laid back at rest matches the drawing. A fail means a hole or a missing or misplaced piece: compare `bakeoff/out/<id>-noamb.png` (the drawing) with `bakeoff/out/<id>-baked.png`, and look at `bakeoff/out/<id>-b-diff.png` (red: big differences; thin outlines along the parts' edges are normal). Look at each part too: `art/live/<id>-p-<name>.webp`, and its box and joint in `art/live/<id>.json` (`x, y, w, h` in drawing units; `ox, oy`: the joint in % of the box).

### 5. Measure the anchors from the cut parts

Where exactly is a hand, a shield's edge, the lance's tip? Measure it from the parts rather than guessing: a few lines of Python with PIL and numpy on `art/live/<id>-p-<name>.webp` (pixels are 2x the drawing's units; add the part's `x, y` from the JSON). Home's angel's shield edges were found by turning each wing's alpha 20 degrees about its joint and taking the outermost opaque point. Put what you find in the puppet's anchors, and measure the contract's points the same way: `emit` (where its attack leaves), `hit` (where blows land on it), `guard` (where it blocks).

### 6. Write the move: `bakeoff/moves/<id>.js`

Start from the worked example, `bakeoff/moves/ashmaw.js`. A move is a module:

```js
export const END = 4000;                        // its length in ms: 3000-4500
export const BEATS = { release: 900, impact: 1200, settle: 3700 }; // its key moments (see "Interactions")
export const STILLS = [200, 600, 1000, 1400, 1900, 2500, 3100, 3700]; // optional: 8 moments for the frame strip
export const textures = {                       // optional: little pictures of your own, painted once
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [255, 240, 200, Math.max(0, 1 - r)]; }],
};
export function build(k) {
  const T = k.aim || [240, 60];                 // where its attack goes: another card's point, or its own target
  const arm = k.part('arm');
  k.act(arm, [[0, { transform: 'none' }, 'ease-in-out'], [600, { transform: 'rotate(-25deg)' }, 'ease-out'], [900, { transform: 'rotate(10deg)' }, 'ease-in-out'], [2000, { transform: 'none' }]]);
  k.fx(k.picIn('flame', [120, 80], 14, 24, { base: true }), [[700, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [820, { transform: 'scale(1)', opacity: 0.9 }], [1500, { transform: 'scale(.6)', opacity: 0 }]]);
}
```

`build(k)` runs once, when the harness page loads; every play replays what it made. Everything is placed in **the drawing's units** (300 x 210, y down) and timed in **ms of the move**.

**The kit, `k`:**

| | |
|---|---|
| `k.END` | the move's length, ms |
| `k.part(name)` | a part's sprite (an `<img>`), at rest where it's drawn; it turns about its `pivot` |
| `k.spec` | the card's entry in `js/art/puppets.js` (your anchors and contract: `k.spec.emit`, `k.spec.guard`, ...) |
| `k.aim` | where its attack or boon goes when another card is there, `[x, y]` in your drawing's units (often outside your picture); `null` alone |
| `k.blows` | blows landing on a defender when another card attacks: `[{ at: ms, to: [x, y] }, ...]`; `null` alone |
| `k.act(el, list)` | moves a part (or a copy of one): `list` is `[[ms, { transform, opacity }, easing], ...]`. It holds its first pose before its first moment and its last pose after its last. |
| `k.fx(el, list)` | the same for an effect: unseen before its first moment and after its last; a keyframe without `opacity` has opacity 1 |
| `k.picIn(src, [x, y], w, h, o)` | a picture inside the card's picture (its frame clips it), centred on `[x, y]`, `w x h` units. `o.base`: standing on its bottom edge at `[x, y]`; `o.top`: hanging from its top edge; `o.lit: false`: drawn normally instead of adding its light; `o.under`: beneath the parts instead of over them. `src` is a texture name or an image URL. |
| `k.pic(src, [x, y], w, h, o)` | the same on the overlay above the whole card (it may leave the picture); `o.low`: beneath the overlay's other effects |
| `k.lightIn(cls, [x, y], w, h, o)` / `k.light(...)` | a glow: an element whose class gives it a radial-gradient background. Classes in `css/app.css`: `g-warm` (fire light), `g-city`, `g-violet`, `g-aura`, `g-heal`, `g-heal spirit`; add your own with `k.css` |
| `k.copy(name, cls, { behind })` | a copy of a part, with your class, just over it (or behind it); move it with `k.act` on the same keyframes as the part. Home's lit shield edge is a gold copy behind a wing, 7% larger, shown by opacity. |
| `k.svg(markup, w, h)` | an image URL of SVG drawn in a `w x h` box of units (`viewBox 0 0 w h`), for `pic`/`picIn`: a lightning bolt, a shard, a ring. Static inside (filters are fine there: it's drawn once). |
| `k.css(text)` | style rules of your own (glow classes), added once |
| `k.art` | the textures: `flame`, `flame2` (tongues of flame standing on their base), `jet` (a tongue hanging from a mouth), `puff`, `puffHot`, `puffCool` (fire billows), `smoke`, `gloom` (dark shadow), `scorch1`-`scorch3` with `:char` and `:glow`; plus your own `textures` |
| `k.T(dx, dy)` | a `translate(...)` of drawing units, for keyframe transforms (they're in px) |
| `k.u` | px per drawing unit (multiply your own distances in transforms by it) |
| `k.P(x, y)` | a drawing point as overlay px (for your own maths) |
| `k.rand()` | the move's dice: random, but the same every play |
| `k.arc(s, c, e, n, pace)`, `k.smooth(t)` | points along a curve from `s` to `e` bent toward `c`; an ease |

**Transforms**: `transform-origin` of a picture is its centre (or its base / top with `o.base` / `o.top`); a part's is its pivot. Write each keyframe's transform with the same functions in the same order (`translate(...) rotate(...) scale(...)`) so it interpolates as you mean. Easing names a step's curve: the easing at one keyframe shapes the way to the next.

**The rules** (the kit throws an error if you break one; check (c) catches the rest):

- Only `transform` and `opacity` move. Never `left`, `width`, `filter`, colours, SVG attributes.
- One motion per element: all of an element's moments go in one keyframe list.
- Everything runs the whole move from one shared start; a thing's moments are its keyframes (no delays).
- Measure nothing in `build`: no `getBoundingClientRect`, `offsetWidth` or `getComputedStyle`. Positions come from the drawing's units and `k.spec`.
- Don't create elements outside the kit, and don't animate ambient sprites or the card itself.
- Keep painted textures small (64 px a side is plenty; at most 128) and few: they're painted when the page loads.
- Build at most about 250 effects; building must take under 150 ms (check c reports it).

### 7. Check it, look at it, improve it

```
BASE=http://localhost:<port> node bakeoff/checks/check.mjs <id>
```

runs all five checks:

- **(a) still**: the drawing is pixel-identical to the reference (0 changed pixels).
- **(b) bake**: every part was cut, and at rest the baked card matches the drawing.
- **(c) cheap**: while the move plays, no animation runs off the compositor, at most 3 style recalcs and 1 layout, at most 80 ms of main-thread work; starting it holds the page under 100 ms; nothing left running after it ends.
- **(d) strip**: 8 stills across the move in one picture, `bakeoff/out/<id>-strip.png`.
- **(e) aim**: its contract (role, element, facing, emit, hit, guard are checked in b; BEATS here), and the move aimed at another point, or given two blows: it builds and stays cheap, and `bakeoff/out/<id>-aimed-strip.png` shows it with the points ringed.

Then **Read both strips and judge them against the bar** above. In the aimed strip, the attack (or boon) must reach the ring, or the blocks must happen at the rings. Is the action clear in the stills? Does each phase (gather, strike, aftermath, settle) show? Is it rich enough (Home's fire is dozens of overlapping pieces, not three)? Does it fit the picture's style and light? Is the last still back at rest? For a closer look at a moment, set `STILLS` to the moments you want and run `check.mjs <id> d`.

Improve and check again. Stop when all five checks pass and the move is at the bar, or after about six rounds of improving one card. Then go on to the next card (step 0 again).

If the harness itself fails (`bakeoff/out/<id>-report.json` has the error), the message usually names the problem: a part that doesn't exist, a keyframe outside 0..END, a property that can't move.

## When you're done

Reply with a short report, per card: its role and element (and whether you changed the suggestion, and why); the move in one sentence; its parts; whether all five checks pass (paste the last check output's PASS/FAIL lines); anything you changed in the drawing besides tags; anything you're unsure about. Don't commit.

## Moves by role

Each card gets its own move, from its picture and its role. Nothing in it touches another card unless it's aimed (`k.aim`, `k.blows`). The worked example (`bakeoff/moves/ashmaw.js`) is an attacker. Give every move a beginning, a peak and an end:

- **Attacker**: it gathers (anticipation: a wind-up, power building in its element), lets go (`release`), the attack travels to `T` and lands (`impact`) with a burst in its element at `T`, it recoils or follows through, and settles (`settle`). Its own figure acts: a head turns, an arm throws, a body lunges. Alone, its target is in or just beyond its own picture, where its picture suggests (the sea below a storm-caller, a foe it faces).
- **Defender**: it braces (`release`), blows land on its guard (`impact`: the first), each with a jolt, a flash at the guard and sparks or splinters, it holds, then settles. Alone, the blows are the threat its picture shows (arrows, claws, a wave), or a generic strike in its opponent's direction.
- **Support**: it gathers its gift (light, growth, water, a song), sends it (`release`) to `T`, where it blooms (`impact`): a glow, a ring, rising motes. Alone, `T` is in its own picture (the figure it tends, the ground it blesses, the sky).
- **Aura** (fields and relics): the place itself comes alive: a pulse, a wave, weather, a light passing over it and spilling past its frame, then calm. BEATS: the swell (`release`), its peak (`impact`), calm (`settle`).

Spells and Traps have a role too: a damage spell is an attacker (the spell is the attack: the bolt, the lance, the wave), a protective spell a defender, a buff or heal a support.

### Upgrading a card from the bake-off

`lightning-theorist`, `shieldbearer` and `bone-lance` were made before the contract existed: their drawing tags, puppet entry and move are in place and pass checks a-d. If one is in your batch, don't start over. Bring it up to the contract:
- the puppet fields (role, element, facing, emit, hit, guard);
- BEATS;
- an attack built from `emit` to `k.aim` (or blocks driven by `k.blows`).

Improve it where you see a clear gap. Then all five checks must pass.
