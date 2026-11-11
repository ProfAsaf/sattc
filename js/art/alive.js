// Card art whose characters come alive: in a close-up they breathe, a slow
// rise and fall of a percent or two, from their feet (or, in the air, a
// swell from their middle: it never lifts their feet off a high horizon). The kit draws each figure as a rim-lit silhouette, all its
// layers in one `fig` group (kit.js figure); here each figure that's a
// character is gathered, with the figures it overlaps (wings and body, a hand
// and its shield) and the details drawn right against it (an eye, the glint
// on its armour, wings painted around it: neighbours in the drawing that lie
// within it or are centred on it), into one group that moves. The picture's
// finish (grade, vignette, grain) stays on top, still.
//
// A figure that's terrain, a building or a prop stays still: tiny ones, ones
// along the bottom edge or across most of the picture, banks off the side.
// Exceptions per card, from a look at every card (tools/alive-review.html,
// .phone-tests/look-alive.mjs): ALIVE below.

const CW = 300, CH = 210; // the art canvas (kit.js W, H)

// Per card: { figure (its order in the drawing, from 0): 'still' | 'ground' |
// 'air' } where the rules get it wrong, or 'still' for the whole card.
export const ALIVE = {
  cinderling: { 0: 'still' }, 'feed-the-flame': { 0: 'still' }, 'deepwater-leviathan': { 0: 'ground' }, 'grave-rat': { 0: 'still' },
  'death-is-a-door': { 0: 'still' }, 'funeral-pyre': { 0: 'still' }, 'the-kiln': { 0: 'still' }, 'cloud-ray': { 2: 'air' },
  'the-drowned-clock': { 0: 'still' }, nerissa: { 0: 'still' }, 'vesper-bat': { 0: 'still', 1: 'air' }, 'bone-altar': 'still',
  'hungry-ghoul': { 1: 'still' }, 'beacon-of-hope': { 0: 'still' }, 'the-pale-abbess': { 1: 'still' }, 'the-bright-choir': { 1: 'still' },
  'borrowed-time': { 1: 'still', 2: 'still' }, bastion: { 1: 'still' }, ripple: { 0: 'still' }, 'season-of-plenty': { 2: 'still' },
  'champion-ember': { 0: 'still' }, 'champion-tide': { 1: 'still' }, 'stoke-the-furnace': { 0: 'still' }, 'molten-core': { 0: 'ground' },
  sprouting: { 3: 'still' }, 'tidecallers-library': { 0: 'still' }, 'tide-of-fortune': { 1: 'still' }, 'wing-graft': { 0: 'still' },
  'blood-pact': { 0: 'still' }, bloodbinder: { 0: 'still' }, 'mirror-shield': { 0: 'still' }, shieldwright: { 1: 'still' },
  'the-granary': { 2: 'still', 3: 'still' }, 'compound-interest': 'still', 'legend-marisol': { 0: 'still' }, 'static-spark': { 0: 'still' },
  'the-arcane-well': { 0: 'still' }, 'legend-mirelle': { 0: 'still' }, 'legend-seren': { 0: 'still' }, 'gale-winds': { 2: 'still' },
  'hallowed-ground': 'still', 'war-chest': 'still', 'choking-smoke': 'still', 'deep-roots': { 0: 'still', 1: 'still', 2: 'ground' },
  // characters as big as the picture (a mountain, a face): the rules take them for backdrops
  'the-mountain-is-angry': { 0: 'ground' }, 'legend-ymra': { 0: 'ground' }, 'kiss-of-night': { 0: 'ground' }, 'ward-of-dawn': { 0: 'air', 2: 'air' },
};

const area = (b) => b.width * b.height;
const overlap = (a, b) => Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
const union = (a, b) => { const x = Math.min(a.x, b.x), y = Math.min(a.y, b.y); return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y }; };
const boxOf = (el) => { try { const b = el.getBBox(); return { x: b.x, y: b.y, width: b.width, height: b.height }; } catch { return null; } };

// The rule for a figure, from its box: 'still', 'ground' or 'air'.
export function kindOf(b) {
  const bottom = b.y + b.height, right = b.x + b.width;
  if (area(b) < 260 || b.height < 14) return 'still'; // a prop, someone far off
  if ([b.x < -10, b.y < -10, right > CW + 10, bottom > CH + 10].filter(Boolean).length >= 2) return 'still'; // a backdrop: fog, a sky, past the edges
  if (bottom > CH - 4 && b.width > CW * 0.55) return 'still'; // ground, a wall, a skyline
  if (b.width > CW * 0.7 && b.height < CH * 0.45) return 'still'; // a bank of cloud, a row of riders, a line of fire
  if ((b.x < 3 || right > CW - 3) && b.height < CH * 0.45 && bottom > CH * 0.7) return 'still'; // banks and hills off the side
  return bottom < CH * 0.74 ? 'air' : 'ground';
}
// What each figure in a drawn card does: [{ fig, k, box, kind }].
export function figuresOf(svg, id = '') {
  const rule = ALIVE[id];
  return [...svg.querySelectorAll('g.fig')].map((fig, k) => {
    const box = boxOf(fig);
    const kind = !box ? 'still' : rule === 'still' ? 'still' : rule?.[k] || kindOf(box);
    return { fig, k, box, kind };
  });
}

// Find the characters in a drawn card (`svg`, in the page) and gather each
// into a group of class `alive` and `air` or `ground`. Returns
// [{ g, kind, box }] (box: the group's, in the drawing's units).
export function gatherAlive(svg, id = '') {
  if (svg.querySelector('.alive')) return []; // (gathered already)
  const figs = figuresOf(svg, id).filter((f) => f.kind !== 'still');
  // figures that overlap become one creature (in the same group of the drawing)
  const clusters = [];
  for (const f of figs) {
    const c = clusters.find((c) => c.parent === f.fig.parentNode && c.members.some((m) => overlap(m.box, f.box) >= 0.35 * Math.min(area(m.box), area(f.box))));
    if (c) { c.members.push(f); c.box = union(c.box, f.box); } else clusters.push({ parent: f.fig.parentNode, members: [f], box: f.box });
  }
  // ...and two whose figures interleave in the drawing are one too (each
  // moves the stretch of the drawing from its first figure to its last)
  const span = (c) => { const kids = [...c.parent.children], idx = c.members.map((m) => kids.indexOf(m.fig)); return [Math.min(...idx), Math.max(...idx)]; };
  for (let merged = true; merged;) {
    merged = false;
    for (let i = 0; i < clusters.length && !merged; i++) {
      for (let j = i + 1; j < clusters.length && !merged; j++) {
        const a = clusters[i], b = clusters[j];
        if (a.parent !== b.parent) continue;
        const [a0, a1] = span(a), [b0, b1] = span(b);
        if (a0 <= b1 && b0 <= a1) { a.members.push(...b.members); a.box = union(a.box, b.box); clusters.splice(j, 1); merged = true; }
      }
    }
  }
  const out = [];
  for (const c of clusters) {
    const kids = [...c.parent.children], [i0, i1] = span(c);
    let first = kids[i0], last = kids[i1];
    if (!first || !last) continue;
    // the details right against it: neighbours that lie within it, or are
    // centred on it and not much bigger (not other figures, not the defs)
    const fits = (el) => {
      if (!el || el.nodeType !== 1 || el.matches('g.fig, defs, .alive') || el.querySelector?.('g.fig')) return false;
      const b = boxOf(el);
      if (!b || !area(b)) return false;
      // never scenery: the ground along the bottom edge, a backdrop past the
      // edges, something wide down at its feet (a skyline, a road), or a long
      // thin line (the horizon). Wide and higher up is fine: wings.
      const wide = b.width > CW * 0.55, bottom = b.y + b.height;
      if (wide && (bottom > CH - 4 || bottom > c.box.y + c.box.height * 0.9 || b.height < CH * 0.1)) return false;
      if ([b.x < -10, b.y < -10, b.x + b.width > CW + 10, bottom > CH + 10].filter(Boolean).length >= 2) return false;
      const within = overlap(b, c.box) / area(b) >= 0.85, cx = b.x + b.width / 2, cy = b.y + b.height / 2;
      const centred = cx > c.box.x && cx < c.box.x + c.box.width && cy > c.box.y && cy < c.box.y + c.box.height && area(b) <= area(c.box) * 4;
      return (within && area(b) <= area(c.box) * 0.9) || centred;
    };
    while (fits(first.previousElementSibling)) first = first.previousElementSibling;
    while (fits(last.nextElementSibling)) last = last.nextElementSibling;
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const kind = c.members.some((m) => m.kind === 'ground') ? 'ground' : 'air';
    g.setAttribute('class', `alive ${kind}`);
    g.style.setProperty('--d', `${-((out.length * 1.37) % 2.8).toFixed(2)}s`); // (each breathes in its own time)
    first.before(g);
    for (let el = first, stop = last.nextElementSibling; el && el !== stop;) { const next = el.nextElementSibling; g.append(el); el = next; }
    out.push({ g, kind, box: boxOf(g) || c.box, ks: c.members.map((m) => m.k) });
  }
  return out;
}
