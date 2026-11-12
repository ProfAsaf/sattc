// The bake-off harness: one card big at phone size, with its puppet parts
// (js/art/puppets.js, baked by tools/bake-live.mjs) and its move
// (bakeoff/moves/<id>.js), built once by the kit below and replayed on demand.
//
// The kit keeps the living-cards rules (living-cards.md, "The scene's rules"):
//  - one timeline: every motion runs the whole move (END) from one shared
//    start, its moments written into its keyframes (no delays);
//  - only transform and opacity move (the compositor's work);
//  - one motion per element;
//  - everything measured once, before anything is made;
//  - what a card's picture clips goes in a sealed box (.fx-in) inside it;
//  - made once, replayed: the move is built while the page loads, and every
//    play just plays its motions again.
//
// window.bk (for the checks and the console):
//   bk.state      'loading' | 'ready' | 'nomove' | 'error'
//   bk.ready      a promise of bk.info once the card, its parts, its textures and its move are in
//   bk.play()     plays the move once; resolves when it has ended and cleaned up
//   bk.hold(ms)   shows the move stopped at `ms`; bk.stop() lets go
//   bk.info       { id, END, STILLS, parts, effects, motions, buildMs, baked }
//
// harness.html?id=<card id>        the card, still; "Play the move" plays it
//            ...&play / &loop       play once when ready / again and again
//            ...&aim=x,y            aim its attack (or boon) at a point, in drawing units: k.aim
//            ...&blows=ms,x,y;...   blows landing on it (a defender's block): k.blows
//            ...&mark               draw a ring at the aim and at each blow (for checking)

import { CARDS, ULTRA } from '../js/cards.js';
import { cardHTML, livenArt } from '../js/render.js';
import { LIVE } from '../js/art-live.js';
import { PUPPETS } from '../js/art/puppets.js';
import { fxArt } from '../js/fx-art.js';

const W = 300, H = 210; // the drawing's units
const q = new URLSearchParams(location.search);
const id = q.get('id') || '';
const card = [...CARDS, ...ULTRA].find((c) => c.id === id);
const stage = document.querySelector('.bk-stage'), over = stage.querySelector('.bk-fx');
const info = document.getElementById('bk-info'), btn = document.getElementById('bk-play');
const say = (t) => { info.textContent = t; };
const pc = (v) => `${(v * 100).toFixed(3)}%`;
const f1 = (v) => (+v).toFixed(1);
const bare = ({ offset, easing, ...f }) => f;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MOVES = new Set(['transform', 'opacity']);
// interactions (bakeoff/recipe.md): where another card is, for a move that can be aimed
const nums = (v) => v.split(',').map(Number);
const AIM = q.get('aim') ? nums(q.get('aim')) : null;
const BLOWS = q.get('blows') ? q.get('blows').split(';').filter(Boolean).map((b) => { const [at, x, y] = nums(b); return { at, to: [x, y] }; }) : null;

const bk = { state: 'loading', info: { id }, play, hold, stop };
window.bk = bk;

// a texture: w x h pixels; px(x, y) gives [r, g, b, a] for x, y in 0..1 (rgb 0..255,
// a 0..1). Painted on a canvas kept off the GPU and kept as a blob link (as js/fx-art.js).
function paint(w, h, px) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }), im = g.createImageData(w, h), d = im.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const [r, gr, b, a] = px((x + 0.5) / w, (y + 0.5) / h);
    d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = a * 255;
  }
  g.putImageData(im, 0, 0);
  const bin = atob(c.toDataURL().split(',')[1]), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
}
const loaded = (img) => (img.complete && img.naturalWidth ? Promise.resolve() : img.decode().catch(() => new Promise((r) => { img.onload = img.onerror = r; })));
// (the move's dice: the same throws every time it plays)
const dice = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hashOf = (s) => { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };

// Where an element's box lies on the overlay: a map from fractions of its width
// and height to overlay px, from three of its corners (works on tilted cards too).
function frame(el) {
  const ps = [[0, 0], [1, 0], [0, 1]].map(([x, y]) => {
    const p = document.createElement('i');
    p.style.cssText = `position:absolute;left:${x * 100}%;top:${y * 100}%;width:0;height:0`;
    el.append(p);
    return p;
  });
  const o = over.getBoundingClientRect();
  const [a, b, c] = ps.map((p) => { const r = p.getBoundingClientRect(); return [r.left - o.left, r.top - o.top]; });
  for (const p of ps) p.remove();
  return (x, y) => [a[0] + x * (b[0] - a[0]) + y * (c[0] - a[0]), a[1] + x * (b[1] - a[1]) + y * (c[1] - a[1])];
}

let anims = [], END = 4000, timer = null;

// ── the kit a move builds itself with (bakeoff/recipe.md lists it) ────────
function makeKit(mod, art, box) {
  END = mod.END ?? 4000;
  if (!(END >= 1500 && END <= 6000)) throw new Error(`END must be 1500-6000 ms (is ${END})`);
  // measured once, first
  const toArt = frame(box), toFace = frame(stage.querySelector('.card-face'));
  const u = box.offsetWidth / W, OW = over.clientWidth, OH = over.clientHeight;
  const P = (x, y) => toArt(x / W, y / H);
  const made = [], moved = new Set(), sealed = {};
  const K = (list) => {
    let last = -1;
    return list.map(([ms, f, e]) => {
      if (!(ms >= 0 && ms <= END)) throw new Error(`a keyframe at ${ms} ms is outside the move (0-${END} ms)`);
      if (ms < last) throw new Error(`keyframes out of order: ${ms} ms after ${last} ms`);
      last = ms;
      for (const p of Object.keys(f)) if (!MOVES.has(p)) throw new Error(`only transform and opacity may move (the compositor's work), not "${p}"`);
      return { ...f, offset: ms / END, easing: e || 'linear' };
    });
  };
  const run = (el, ks) => {
    if (!el) throw new Error('a motion for nothing (a part name or element that does not exist?)');
    if (moved.has(el)) throw new Error('one motion per element: put all of its moments in one keyframe list');
    moved.add(el);
    anims.push(el.animate(ks, { duration: END, fill: 'forwards' }));
    return el;
  };
  // an effect: unseen until its first moment, and after its last (a keyframe without opacity has 1)
  const fx = (el, list) => {
    const ks = K(list).map((k) => ('opacity' in k ? k : { ...k, opacity: 1 })), a = ks[0], z = ks.at(-1), e = 1 / END;
    if (a.offset > e) ks.unshift({ ...bare(a), opacity: 0, offset: 0 }, { ...bare(a), opacity: 0, offset: a.offset - e });
    if (z.offset < 1 - e) ks.push({ ...bare(z), opacity: 0, offset: z.offset + e }, { ...bare(z), opacity: 0, offset: 1 });
    return run(el, ks);
  };
  // a part of the card (or a copy of one): as it is until its first moment, and as it ends after its last
  const act = (el, list) => {
    const ks = K(list);
    if (ks[0].offset > 0) ks.unshift({ ...bare(ks[0]), offset: 0 });
    if (ks.at(-1).offset < 1) ks.push({ ...bare(ks.at(-1)), offset: 1 });
    return run(el, ks);
  };
  const keep = (el) => { made.push(el); return el; };
  // the sealed boxes inside the card's picture: above its parts, or (under) beneath them
  const inside = (under) => {
    const k = under ? 'under' : 'over';
    if (!sealed[k]) { const d = document.createElement('div'); d.className = 'fx-in'; if (under) box.prepend(d); else box.append(d); sealed[k] = keep(d); }
    return sealed[k];
  };
  const origin = (o) => `transform-origin:50% ${o.top ? 0 : o.base ? 100 : 50}%`;
  const atPx = ([x, y], w, h, o) => { const [X, Y] = P(x, y), pw = w * u, ph = h * u; return `left:${f1(X - pw / 2)}px;top:${f1(o.top ? Y : Y - (o.base ? ph : ph / 2))}px;width:${f1(pw)}px;height:${f1(ph)}px;${origin(o)}`; };
  const atIn = ([x, y], w, h, o) => `left:${pc((x - w / 2) / W)};top:${pc((o.top ? y : o.base ? y - h : y - h / 2) / H)};width:${pc(w / W)};height:${pc(h / H)};${origin(o)}`;
  const put = (el, o) => (o.inside ? inside(o.under).append(el) : o.low ? over.prepend(el) : over.append(el), keep(el));
  const img = (src) => { if (!src) throw new Error('a picture with no source (a texture name that does not exist?)'); const el = document.createElement('img'); el.src = src; el.alt = ''; return el; };
  const k = {
    END, u, P, OW, OH, art, rand: dice(hashOf(id)),
    spec: PUPPETS[id] || {},
    // interactions: where its attack (or boon) goes, and blows landing on it; null when it plays alone
    aim: AIM, blows: BLOWS,
    // a point on the card's face, in fractions of it (0-1), as overlay px
    F: (x, y) => toFace(x, y),
    // a part (a sprite cut by the bake): img.sp[data-part=name]
    part(name) {
      const el = box.querySelector(`img.sp[data-part="${name}"]`);
      if (!el) throw new Error(`no part named "${name}": is it in js/art/puppets.js, and baked (tools/bake-live.mjs)?`);
      return el;
    },
    parts: () => [...box.querySelectorAll('img.sp[data-part]')].map((el) => el.dataset.part),
    fx, act,
    // a picture (a texture name from k.art, or any image URL) on the overlay at
    // drawing point [x, y], w x h drawing units: centred, standing on its base
    // (base), or hanging from its top (top); adding its light (lit, the default)
    // or not; beneath the overlay's other effects (low)
    pic: (src, at, w, h, o = {}) => { const el = img(k.art[src] || src); el.className = o.lit === false ? 'fx' : 'fx lit'; el.style.cssText = atPx(at, w, h, o); return put(el, o); },
    // the same inside the card's picture (its frame clips it), above its parts, or beneath them (under)
    picIn: (src, at, w, h, o = {}) => { const el = img(k.art[src] || src); el.className = o.lit === false ? 'fx' : 'fx lit'; el.style.cssText = atIn(at, w, h, o); return put(el, { ...o, inside: true }); },
    // a glow: an element with a class whose background is a radial gradient
    // (css/app.css has g-warm, g-city, g-violet, g-aura, g-heal; add your own with k.css)
    light: (cls, at, w, h = w, o = {}) => { const el = document.createElement('i'); el.className = `fx lit ${cls}`; el.style.cssText = atPx(at, w, h, o); return put(el, o); },
    lightIn: (cls, at, w, h = w, o = {}) => { const el = document.createElement('i'); el.className = `fx lit ${cls}`; el.style.cssText = atIn(at, w, h, o); return put(el, { ...o, inside: true }); },
    // a copy of a part, with a class of yours (e.g. a lit silhouette), just
    // behind it (behind) or over it; move it with k.act on the part's keyframes
    copy(name, cls = '', o = {}) {
      const p = k.part(name), c = p.cloneNode();
      c.removeAttribute('data-part'); c.removeAttribute('data-i');
      c.className = `fx-copy ${cls}`.trim();
      if (o.behind) p.before(c); else p.after(c);
      return keep(c);
    },
    // a picture drawn as SVG in a w x h box of drawing units: a URL for pic/picIn
    svg: (markup, w, h) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${h * 4}">${markup}</svg>`)}`,
    // style rules of your own (glow classes and the like), added once
    css(text) { const s = document.createElement('style'); s.textContent = text; document.head.append(s); },
    // translate by drawing units (keyframe transforms are in px)
    T: (dx, dy) => `translate(${f1(dx * u)}px, ${f1(dy * u)}px)`,
    // n + 1 points along a curve from s to e pulled toward c, spaced by pace
    arc: (s, c, e, n = 10, pace = (t) => t) => Array.from({ length: n + 1 }, (_, i) => { const t = pace(i / n), r = 1 - t; return [r * r * s[0] + 2 * r * t * c[0] + t * t * e[0], r * r * s[1] + 2 * r * t * c[1] + t * t * e[1]]; }),
    smooth: (t) => t * t * (3 - 2 * t),
  };
  return { k, made, moved };
}

async function main() {
  if (!card) throw new Error(`no card with id "${id}" (harness.html?id=<card id>)`);
  document.title = `${card.name} · puppet harness`;
  stage.insertAdjacentHTML('afterbegin', cardHTML(card, { cls: 'anim', sprites: true }));
  livenArt(stage);
  const baked = !!LIVE[id];
  bk.info.baked = baked;
  let box = null;
  if (baked) {
    // its sprites come in once the sprites file is read; then their pictures
    for (let t = 0; t < 200 && !(box = stage.querySelector('.sp-art'))?.live; t++) await sleep(50);
    if (!box?.live) throw new Error('the card\'s sprites never came in');
    await Promise.all([...box.querySelectorAll('img.sp')].map(loaded));
    bk.info.parts = [...box.querySelectorAll('img.sp[data-part]')].map((el) => el.dataset.part);
  }
  const has = await fetch(`bakeoff/moves/${id}.js`, { method: 'HEAD' }).then((r) => r.ok).catch(() => false);
  if (!has) { bk.state = 'nomove'; btn.disabled = true; say(baked ? `No move yet: bakeoff/moves/${id}.js` : 'Not baked yet, and no move yet'); return bk.info; }
  if (!baked) throw new Error('the card has a move but is not baked (tools/bake-live.mjs)');
  const mod = await import(`./moves/${id}.js`);
  if (typeof mod.build !== 'function') throw new Error(`bakeoff/moves/${id}.js must export function build(k)`);
  // the textures: the shared fire, smoke and gloom (js/fx-art.js), and the move's own
  const art = { ...(await fxArt()) };
  for (const [name, [w, h, px]] of Object.entries(mod.textures || {})) { art[name] = paint(w, h, px); await sleep(0); }
  await Promise.all(Object.values(art).map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
  // built once, now; every play replays it
  const t0 = performance.now();
  const { k, made, moved } = makeKit(mod, art, box);
  mod.build(k);
  for (const a of anims) a.cancel();
  const buildMs = performance.now() - t0;
  await Promise.all(made.filter((el) => el.tagName === 'IMG').map(loaded));
  const idle = made.filter((el) => el.classList.contains('fx') && !moved.has(el)).length;
  Object.assign(bk.info, { END, STILLS: mod.STILLS || null, BEATS: mod.BEATS || null, role: PUPPETS[id]?.role || null, aim: AIM, blows: BLOWS, effects: made.length, motions: anims.length, unmoved: idle, buildMs: Math.round(buildMs) });
  if (q.has('mark')) {
    // (a still ring at each point the move was given, to see that it goes there)
    for (const pt of [...(AIM ? [AIM] : []), ...(BLOWS || []).map((b) => b.to)]) {
      const [X, Y] = k.P(...pt), r = document.createElement('i');
      r.style.cssText = `position:absolute;left:${(X - 7).toFixed(1)}px;top:${(Y - 7).toFixed(1)}px;width:14px;height:14px;border-radius:50%;border:2px dashed #3cf;box-sizing:border-box;z-index:9`;
      over.append(r);
    }
  }
  bk.state = 'ready';
  say(`${card.name}: ${anims.length} motions, ${made.length} effects, ${END} ms${idle ? ` (${idle} effects never move: unseen)` : ''}`);
  return bk.info;
}

function stop() {
  clearTimeout(timer); timer = null;
  for (const a of anims) a.cancel();
  delete over.dataset.on;
}
// one play: every motion started together (one shared start); after END, all cancelled
function play() {
  if (bk.state !== 'ready') return Promise.resolve(false);
  stop();
  for (const a of anims) a.play();
  over.dataset.on = '1';
  return new Promise((r) => { timer = setTimeout(() => { stop(); r(true); }, END + 100); });
}
// the move stopped at `ms` (for stills)
function hold(ms) {
  stop();
  for (const a of anims) { a.pause(); a.currentTime = Math.max(0, Math.min(END, ms)); }
  over.dataset.on = '1';
}

bk.ready = main().catch((e) => {
  bk.state = 'error';
  bk.info.error = String(e?.message || e);
  btn.disabled = true;
  say(`Error: ${bk.info.error}`);
  console.error(e);
  return bk.info;
});
btn.addEventListener('click', () => play());
bk.ready.then(async () => {
  if (bk.state !== 'ready') return;
  if (q.has('play') || q.has('loop')) { await sleep(500); do { await play(); await sleep(1000); } while (q.has('loop')); }
});
