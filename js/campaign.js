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
  next: 'ultra-the-wall',
  intro: [
    'The delta has gone quiet. No barges come down the river, no carts come over the hills, and the harbor’s ledgers are running red.',
    'Marisol, the Harbormistress, shuts her ledger. “Trade doesn’t stop by itself. Someone is choking it.”',
    '“I’ll take the road up to the Wall and find out who. And every coin I earn on the way, I’ll put to work.”',
  ],
  done: 'Halvard joins you. World 2, The Wall, is next on the road.',
  stages: [
    { deck: 'ultra-smoke-and-mirrors', place: 'The Market', odds: 0.82,
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
    { deck: 'ultra-sky-and-arrows', place: 'The Cliffs', odds: 0.63,
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
    { deck: 'ultra-the-giant', place: 'The Pass', odds: 0.48,
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
    { deck: 'ultra-endless-swarm', place: 'The Fields at Night', odds: 0.35,
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
    { deck: 'ultra-the-wall', place: 'The Wall', odds: 0.29, boss: true,
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
}];

export const worldOf = (id) => WORLDS.find((w) => w.id === id) || null;

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
