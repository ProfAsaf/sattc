// Pictures that move without being redrawn. A picture's moving parts come as
// sprites, cut out of its drawing at bake time (tools/bake-campaign.mjs,
// tools/bake-live.mjs): each a little picture placed in the drawing's units
// that moves as a whole, a transform or an opacity, which the phone's
// compositor runs while the page itself does nothing. Grass bends from its
// roots, smoke and embers rise, moths and gulls float, stars and lanterns
// glimmer, clouds drift, a windmill turns.
//
// What keeps the page out of it (measured in Chrome, look-campaign-cost.mjs):
// nothing left running on an element that has left the page (drop, sweep);
// nothing moving out of sight, cropped away by the frame (restart with a
// clip); everything started afresh once a zoom of its parents is over.

export const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pc = (v) => `${(v * 100).toFixed(3)}%`;
const LIGHTS = new Set(['twinkle', 'rise', 'breathe', 'fall']); // (these set their own opacity)
const E = 'ease-in-out';
const sway = (a, b) => [{ transform: 'none', easing: E }, { transform: a, offset: 0.25, easing: E }, { transform: 'none', offset: 0.5, easing: E }, { transform: b, offset: 0.75, easing: E }, { transform: 'none' }];
const MOVES = { // -> [keyframes, seconds, back and forth?, easing]; u: px per unit of the drawing
  sway: (u, s) => [[{ transform: 'rotate(-4deg)' }, { transform: 'rotate(3deg)' }], s.t ?? 3.6, true],
  turn: () => [[{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], 18, false, 'linear'],
  rise: (u, s) => [[{ transform: 'translate(0,0)', opacity: 0 }, { opacity: s.o ?? 1, offset: 0.15 }, { opacity: s.o ?? 1, offset: 0.8 }, { transform: `translate(${7 * u}px,${-52 * u}px)`, opacity: 0 }], s.t ?? 6, false, 'linear'],
  float: (u, s) => [[{ transform: `translate(${-3 * u}px,${2 * u}px)` }, { transform: `translate(${3 * u}px,${-4 * u}px)` }], s.t ?? 7, true],
  twinkle: (u, s) => [[{ opacity: 0.12 }, { opacity: s.o ?? 1 }], s.t ?? 4, true],
  drift: (u) => [[{ transform: `translateX(${-16 * u}px)` }, { transform: `translateX(${16 * u}px)` }], 16, true],
  breathe: (u, s) => [[{ opacity: 0.65 * (s.o ?? 1), transform: 'scale(.93)' }, { opacity: s.o ?? 1, transform: 'scale(1.07)' }], 3.4, true],
  fall: (u) => [[{ transform: `translate(0,${-5 * u}px)`, opacity: 0 }, { opacity: 0.95, offset: 0.25 }, { transform: `translate(${-3 * u}px,${7 * u}px)`, opacity: 0 }], 1.6, false, 'linear'],
  // a character breathing and swaying (js/art/alive.js; the same numbers as card.css .alive): each step eased
  ground: () => [sway('rotate(.8deg) scale(1.01, 1.035)', 'rotate(-.8deg) scale(1.01, 1.035)'), 6.4, false, 'linear'],
  air: () => [sway('rotate(1.2deg) scale(1.03)', 'rotate(-1.2deg) scale(1.03)'), 5.6, false, 'linear'],
};

const files = new Map(); // a sprites file -> its contents, fetched once (the last 48 kept: a long session doesn't pile them up)
export function fetchSprites(url) {
  let f = files.get(url);
  if (f) { files.delete(url); files.set(url, f); return f; } // (the most recent last)
  files.set(url, (f = fetch(url).then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  for (const k of files.keys()) { if (files.size <= 48) break; files.delete(k); }
  return f;
}
const boxes = new Set(); // every box with moving parts, so none is left running once it's gone

// Lay a picture's sprites (`pic`: { live: the sprites file, w, h: the
// drawing's size }) into `box`: an element laid exactly over the picture,
// same size and crop. Then set them moving. `clip`: what they're seen
// through (an element, or true: the screen), to still the ones outside it.
export async function liven(box, pic, { clip = null } = {}) {
  const L = await fetchSprites(pic.live);
  if (!L || !box.isConnected) return;
  const at = (s) => `left:${pc(s.x / pic.w)};top:${pc(s.y / pic.h)};width:${pc(s.w / pic.w)};height:${pc(s.h / pic.h)};transform-origin:${s.ox}% ${s.oy}%`;
  // (a character is a picture cut from the finished art; the rest are drawn)
  box.innerHTML = `<svg class="sp-defs" aria-hidden="true"><defs>${L.defs}</defs></svg>${L.sprites.map((s, i) => (s.img
    ? `<img class="sp" data-i="${i}"${s.name ? ` data-part="${s.name}"` : ''} src="${s.img}" alt="" decoding="async" style="${at(s)}">`
    : `<svg class="sp" data-i="${i}" viewBox="${s.x} ${s.y} ${s.w} ${s.h}" preserveAspectRatio="none" aria-hidden="true" style="${at(s)}${LIGHTS.has(s.a) && s.o != null ? `;opacity:${s.o}` : ''}">${s.svg}</svg>`)).join('')}`;
  box.live = L;
  box.pic = pic;
  boxes.add(box);
  move(box);
  if (clip) restart(box, clip);
}

// Set the sprites moving (again when the picture changes size: drifts and
// rises go a distance in the drawing's units). Each keeps its place in its
// cycle.
export function move(box) {
  const L = box.live;
  if (!L || still() || !box.animate) return;
  const u = box.offsetWidth / box.pic.w;
  if (box.anims && box.u && Math.abs(u / box.u - 1) < 0.02) return;
  const old = box.anims || [];
  box.u = u;
  box.anims = [...box.querySelectorAll('.sp')].map((el, k) => {
    const s = L.sprites[el.dataset.i];
    if (!MOVES[s.a]) return null; // (a puppet's part: still until its scene moves it, js/home-alive.js)
    if (el.dataset.still) return null; // (stilled to save the phone's memory: js/cards-alive.js fit())
    const [frames, t, alt, easing = 'ease-in-out'] = MOVES[s.a](u, s);
    const a = el.animate(frames, { duration: t * 1000, delay: (s.d || 0) * 1000, iterations: Infinity, direction: alt ? 'alternate' : 'normal', easing });
    const at = old[k] ? old[k].currentTime ?? old[k].at : null;
    if (at != null) a.currentTime = at;
    old[k]?.cancel();
    if (box.held) { a.at = a.currentTime; a.cancel(); } // (held: let go, its moment kept; see hold())
    return a;
  });
}

// Start them afresh where they are (after a zoom of their parents, a browser
// may leave them ticking on the main thread), and still the ones that can't
// be seen through `clip` (an element, or true: the screen): moving out of
// sight, they would tick there too.
export function restart(box, clip = null) {
  setTimeout(() => {
    if (!box?.isConnected || !box.live) return;
    box.u = 0;
    move(box);
    if (!clip || box.held) return;
    const c = clip === true ? { left: 0, top: 0, right: innerWidth, bottom: innerHeight } : clip.getBoundingClientRect();
    box.querySelectorAll('.sp').forEach((el, k) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < c.top || r.top > c.bottom || r.right < c.left || r.left > c.right) { const a = box.anims[k]; if (a) { a.at = a.currentTime; a.cancel(); } } // (let go, as hold() does)
    });
  }, 160);
}

// Pause them (a picture out of sight for a while), or go on. On a phone a
// paused motion still holds a layer of memory for nothing seen, so a held one
// is let go (cancelled), its moment kept, and set going again from there.
export function hold(box, on) {
  if (!box) return;
  box.held = on;
  for (const a of box.anims || []) {
    if (!a) continue;
    if (on) { if (a.playState !== 'idle') { a.at = a.currentTime; a.cancel(); } }
    else if (a.playState === 'idle') { a.currentTime = a.at ?? 0; a.play(); }
  }
}

// Let pictures' memory go now: an <img> leaving the page keeps its decoded
// picture (often megabytes) until the browser gets round to collecting it;
// pointed at nothing first, it lets go at once. Only for what's leaving.
const NOTHING = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
export function release(root) {
  if (!root) return;
  for (const im of root.tagName === 'IMG' ? [root] : root.querySelectorAll('img')) {
    im.removeAttribute('srcset');
    if (im.getAttribute('src') !== NOTHING) im.src = NOTHING;
  }
}

// Stop them for good, the picture leaving the page: an animation left running
// on an element that's gone keeps the browser ticking.
export function drop(box) {
  for (const a of box?.anims || []) a?.cancel();
  if (box) { box.anims = []; boxes.delete(box); }
}
// Stop every box no longer on the page (after the page changes).
export function sweep() {
  for (const b of boxes) if (!b.isConnected) drop(b);
}
