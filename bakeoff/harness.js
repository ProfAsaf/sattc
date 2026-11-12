// The bake-off harness: one card big at phone size, with its puppet parts
// (js/art/puppets.js, baked by tools/bake-live.mjs) and its move
// (bakeoff/moves/<id>.js), built once by the kit (js/puppet-kit.js) and replayed on demand.
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

import { CARDS, ULTRA, TOKENS, CHAMPIONS, LEGENDS } from '../js/cards.js';
import { cardHTML, livenArt } from '../js/render.js';
import { LIVE } from '../js/art-live.js';
import { PUPPETS } from '../js/art/puppets.js';
import { fxArt } from '../js/fx-art.js';
import { loaded, makeKit, paint, sleep } from '../js/puppet-kit.js';

const q = new URLSearchParams(location.search);
const id = q.get('id') || '';
const card = [...CARDS, ...ULTRA, ...Object.values(TOKENS), ...Object.values(CHAMPIONS), ...Object.values(LEGENDS)].find((c) => c.id === id);
const stage = document.querySelector('.bk-stage'), over = stage.querySelector('.bk-fx');
const info = document.getElementById('bk-info'), btn = document.getElementById('bk-play');
const say = (t) => { info.textContent = t; };
// interactions (bakeoff/recipe.md): where another card is, for a move that can be aimed
const nums = (v) => v.split(',').map(Number);
const AIM = q.get('aim') ? nums(q.get('aim')) : null;
const BLOWS = q.get('blows') ? q.get('blows').split(';').filter(Boolean).map((b) => { const [at, x, y] = nums(b); return { at, to: [x, y] }; }) : null;

const bk = { state: 'loading', info: { id }, play, hold, stop };
window.bk = bk;


let anims = [], END = 4000, timer = null;


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
  const built = makeKit({ id, mod, art, box, face: stage.querySelector('.card-face'), over, aim: AIM, blows: BLOWS });
  const { k, made, moved } = built;
  anims = built.anims; END = built.END;
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
