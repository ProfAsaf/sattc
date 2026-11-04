// Card art index. One scene function per card id, grouped by faction in
// scenes/*.js. Each function receives a Scene (kit.js) and returns s.svg().
//
// STYLE: "lantern and paper" — every card is a small cut-paper diorama lit
// from behind. Rules, learned from the five reference cards (cinderling,
// little-gardener, memory-diver, something-beneath, shieldbearer):
//
//  1. Canvas is 300×210, cropped like `background-size: cover`; keep the
//     subject inside x 40–260, y 25–195.
//  2. Back to front: sky gradient → one light source (glow, sun, moon, lava,
//     surface light, rays) → 2–3 depth layers (far = paler and closer to the
//     sky, near = darker) → the subject → its glowing details → optional dark
//     foreground framing → particles.
//  3. One subject, one silhouette, 40–60% of the picture height. Build it as a
//     union of simple parts (taper(), blob(), ellipses) inside s.figure(); every
//     part takes the figure's fill, so overlaps merge into one cut-out.
//  4. Rim light comes from s.figure offsets pointing toward the light; several
//     offsets when backlit. A silhouette is always darker than what is behind it.
//  5. Only 1–3 things glow in the faction accent (eyes, a flame, a page, a
//     sprout). Everything else stays muted. Use PAL[faction] for fig/rim/glow.
//  6. Skies: Ember maroon→lava orange; Verdant cream sunlight→sage; Tide sea
//     teal→deep navy, lit from above; Umbral indigo night→violet horizon, moon;
//     Radiant pale blue→gold dawn. Two-faction cards blend both.
//  7. People: separate limbs with gaps, a head distinct from the shoulders,
//     profile or three-quarter poses, cloaks that trail off one side and never
//     swallow the legs. (A diver once read as a whale.)
//  8. Dark things are unsettling, not cute: no toothy grins; too many eyes,
//     seams of light, scale cues like tiny towers.
//  9. Spells show the effect happening in a scene, still with one focal point.
// 10. Only light and air move. Particle classes: rise (embers, bubbles),
//     float (motes, pages), twinkle (stars), drift (smoke, fog), breathe
//     (glows), fall (drops). Motion only runs on cards shown large.
// 11. At most ~6 filter uses (the finish's grain included), never on or around
//     an animated element; no <image>, no text; at most ~200 elements. Light
//     comes from the kit (bloom, shafts, haze, figure shade/edge/halo) and
//     every card gets its faction's finish once (faction() in shared.js, or
//     s.finish()). Seeded helpers (ridge, canopy, pines, ruins, particles,
//     rays, motes) get a seed unique to the card.
// 12. Check every scene at card size in art-lab.html?sheet: the subject must be
//     recognisable on a 160px-wide card.

import { ember } from './scenes/ember.js';
import { verdant } from './scenes/verdant.js';
import { tide } from './scenes/tide.js';
import { umbral } from './scenes/umbral.js';
import { radiant } from './scenes/radiant.js';
import { multi } from './scenes/multi.js';
import { new_a } from './scenes/new-a.js';
import { new_b } from './scenes/new-b.js';
import { new_c } from './scenes/new-c.js';

export { PAL } from './scenes/shared.js';

export const SCENES = { ...ember, ...verdant, ...tide, ...umbral, ...radiant, ...multi, ...new_a, ...new_b, ...new_c };
