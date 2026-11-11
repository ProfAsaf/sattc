// The campaign (2026-11-11): worlds to travel through against the bots, a
// deck of yours for each world. A world's levels are the decks yours does
// best against first and its hardest last, the boss; the order comes from
// every starter played against every other (about 3,200 bot games, Practice
// against Practice: tools/train.mjs decks practice with MATRIX=). Beating the
// boss brings its deck over to your side, for the next world.
// Each level is played at three difficulties, a star each (DIFFS); a level
// opens once the one before it has a star. The story is told by the Legends:
// yours, and the one leading each deck you meet. Progress stays on this phone.

export const DIFFS = [
  { stars: 1, level: 'casual', name: 'Casual' },
  { stars: 2, level: 'practice', name: 'Practice' },
  { stars: 3, level: 'expert', name: 'Expert' },
];

// odds: how often the world's deck beat that deck in those bot games
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
      win: ['The masks clatter to the cobbles. Mirelle only laughs.', '“Fine: the false coins came from upriver, not from me. Ask the wind who carried them.”'],
      lose: ['“Nothing here is what it looks like,” Mirelle whispers. “Least of all your winning hand.”'] },
    { deck: 'ultra-sky-and-arrows', place: 'The Cliffs', odds: 0.63,
      before: [
        'On the cliffs above the bay every wind blows against the sails. Aeris, Queen of the Winds, rides them all.',
        '“The sky is mine. Your ships pay my toll, or they turn back.”',
      ],
      win: ['The wind drops. “You don’t fight the weather,” Aeris admits. “You outlast it.”', '“The road inland is blocked by something much bigger than me. Go and see.”'],
      lose: ['Arrows fall out of a clear sky. “Come back when you can reach me,” laughs Aeris.'] },
    { deck: 'ultra-the-giant', place: 'The Pass', odds: 0.48,
      before: [
        'The mountain pass is gone. In its place sits Ymra, Heart of the Mountain, growing one stone at a time.',
        '“Build all you like, little trader. I am already built.”',
      ],
      win: ['Ymra settles back into the hillside with a rumble you feel in your teeth.', '“The fields up there… something is eating them at night. Not me.”'],
      lose: ['“Patience,” grinds the mountain. “I have more of it than you.”'] },
    { deck: 'ultra-endless-swarm', place: 'The Fields at Night', odds: 0.35,
      before: [
        'Night falls on the grain fields, and the fields begin to move: moths, thousands of them, and at their heart Lumen, Mother of Moths.',
        '“One moth is nothing. A thousand is a famine. Death by a thousand cuts, Harbormistress.”',
      ],
      win: ['Dawn breaks, and the swarm scatters into the light.', 'Lumen’s voice comes from everywhere at once: “We were only hungry. The Wall stopped the grain. Ask Halvard why.”'],
      lose: ['“Every one of us you swat makes the rest stronger,” hums the swarm. “Every one.”'] },
    { deck: 'ultra-the-wall', place: 'The Wall', odds: 0.29, boss: true,
      before: [
        'At the top of the road stands the Wall, and on it Halvard, the Unbroken.',
        '“Nothing passes. Not grain, not coin, not you. The Wall holds. It is all I know how to do.”',
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
// { v: 1, stars: { w1s0: 2, … }, seen: { w1: true } }
const KEY = 'collective.campaign';
export function progress() {
  try { const p = JSON.parse(localStorage.getItem(KEY)); if (p && p.v === 1) return p; } catch { /* a fresh start */ }
  return { v: 1, stars: {}, seen: {} };
}
function keep(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* fine without */ } }
const key = (w, i) => `w${w}s${i}`;
export const starsOf = (p, w, i) => p.stars[key(w, i)] || 0;
export const isOpen = (p, w, i) => i === 0 || starsOf(p, w, i - 1) > 0;
export const worldStars = (p, W) => W.stages.reduce((t, _, i) => t + starsOf(p, W.id, i), 0);
// the level to play next: the first without a star (null once all have one)
export const nextStage = (p, W) => { const i = W.stages.findIndex((_, k) => !starsOf(p, W.id, k)); return i < 0 ? null : i; };
export function markSeen(what) { const p = progress(); p.seen[what] = true; keep(p); }

// A finished campaign fight ({ world, stage, diff }): a win at a difficulty
// above the level's best is its new best. What changed, for the end screen.
export function record(c, win) {
  const p = progress(), k = key(c.world, c.stage), before = p.stars[k] || 0;
  if (win && c.diff > before) p.stars[k] = c.diff;
  keep(p);
  const W = worldOf(c.world), last = c.stage === W.stages.length - 1;
  return { win, before, now: p.stars[k] || 0, opened: win && !before && !last ? c.stage + 1 : null, worldDone: win && !before && last };
}
