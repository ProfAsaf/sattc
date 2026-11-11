// The campaign's screens (campaign.js has the worlds, the story and your
// progress). A world is a painted map (js/art/campaign-art.js, baked by
// tools/bake-campaign.mjs into js/campaign-pics.js): the road from your
// harbor up to its boss, each level a medallion with the Legend you'll meet
// there. Tap one and the map zooms into that place: its own painting, the
// three rounds along its path with the Legend waiting at the one that's due,
// the story so far, and the one fight to have now. The fights are practice
// games (game-ui.js startCampaign) that come back to the place, where a win
// is played out: the round turns gold and the Legend runs on up the path, or
// is beaten for good.

import { BY_ID, ULTRA_STARTERS } from './cards.js';
import { artURL, esc } from './render.js';
import * as Camp from './campaign.js';
import { PICS } from './campaign-pics.js';
import { startCampaign } from './game-ui.js';
import { drop, fetchSprites, hold, liven, move, restart, still } from './sprites.js';

const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="5" y="10" width="14" height="10" rx="2.2" fill="currentColor"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 12.5l4.2 4.2L18.5 7.8"/></svg>';
const starter = (id) => ULTRA_STARTERS.find((d) => d.id === id);
const legendOf = (deckId) => BY_ID[starter(deckId)?.legend];
const shortName = (name) => name.split(',')[0];
const face = (card, cls = 'cp-face') => `<img class="${cls}" src="${esc(artURL(card) || '')}" alt="">`;
const starRow = (n) => `<span class="cp-stars" aria-label="${n} of 3 rounds won">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}">★</i>`).join('')}</span>`;
const pc = (v) => `${(v * 100).toFixed(3)}%`;
const at = (P, [x, y]) => `left:${pc(x / P.w)};top:${pc(y / P.h)}`;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const done = (anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

// ── the moving parts (js/sprites.js) ───────────────────────────────
// Leaving the campaign (another page, or a fight over it): let it all go.
export function leaveCampaign() {
  if (!ui) return;
  ui.root.querySelectorAll('.cp-live').forEach(drop);
  ui = null;
}
// a picture's sprites, into its box (a place's that arrive once it has settled: stilled out of sight)
const livenPic = (box) => liven(box, PICS[box.dataset.pic], { clip: box.closest('.cp-place.in') ? true : null });

// ── the map ─────────────────────────────────────────────────────────
let ui = null; // the page up: { view, root, W, place, pushed, chain }
const go = (fn) => { const u = ui; u.chain = u.chain.then(fn).catch((e) => console.error(e)); };

function mapHTML(W, p) {
  const P = PICS[W.map], me = legendOf(W.deck), next = Camp.nextStage(p, W);
  const total = Camp.worldStars(p, W), over = Camp.beaten(p, W.id, W.stages.length - 1);
  const node = (S, i) => {
    const L = legendOf(S.deck), n = Camp.starsOf(p, W.id, i), open = Camp.isOpen(p, W.id, i);
    const cls = !open ? 'locked' : n >= 3 ? 'done' : i === next ? 'next' : 'open';
    return `<button class="cp-node ${cls}${S.boss ? ' boss' : ''}" data-stage="${i}" style="${at(P, P.spots.levels[i])}" aria-label="${esc(S.place)}: ${esc(L.name)}${open ? `, ${n} of 3 rounds won` : ', locked'}">
      <span class="cp-ring">${face(L, 'cp-img')}${!open ? `<span class="cp-lock">${LOCK}</span>` : n >= 3 ? `<span class="cp-won">${CHECK}</span>` : ''}</span>
      <span class="cp-plaque"><b>${esc(S.place)}</b>${open ? starRow(n) : ''}</span>
    </button>`;
  };
  return `<div class="cp-world">
    <div class="cp-mapwrap">
      <div class="cp-stage cp-mapstage" style="aspect-ratio:${P.w} / ${P.h}">
        <img class="cp-pic" src="${P.src}" alt="" decoding="async">
        <div class="cp-live" data-pic="${W.map}"></div>
        <div class="cp-start" style="${at(P, P.spots.start)}">${face(me, 'cp-img')}<span>${esc(shortName(me.name))} sets out</span></div>
        ${W.stages.map(node).join('')}
      </div>
    </div>
    <header class="cp-bar">
      <a class="cp-btn" href="#/" aria-label="Home">${BACK}</a>
      <div class="cp-title"><b>${esc(W.name)}</b><span>World ${W.id} · <em>★ ${total}</em> of ${W.stages.length * 3}</span></div>
      <button class="cp-btn" data-act="cp-help" aria-label="How the campaign works">?</button>
      ${over ? `<div class="cp-done">${esc(W.done)} <span>(Coming soon.)</span></div>` : ''}
    </header>
  </div>`;
}

// The campaign page: World 1's map (the only world so far); with a level's
// number (#/campaign/2) that level's place, over it. Going between the two
// while the page is up zooms rather than redrawing ('kept': the router leaves
// the scroll alone).
export function campaignPage(view, arg) {
  const i = /^\d+$/.test(arg || '') ? Number(arg) : null;
  if (document.body.classList.contains('in-game')) { view.innerHTML = ''; ui = null; return; } // (a fight is on: drawn afresh when it ends)
  if (ui && ui.view === view && ui.root.isConnected) {
    go(() => (i == null ? closePlace() : openPlace(i)));
    return 'kept';
  }
  leaveCampaign();
  const W = Camp.worldOf(1), p = Camp.progress();
  view.innerHTML = mapHTML(W, p);
  ui = { view, W, root: view.querySelector('.cp-world'), place: null, pushed: false, chain: Promise.resolve() };
  const img = ui.root.querySelector('.cp-pic');
  ready(img);
  livenPic(ui.root.querySelector('.cp-live'));
  ui.root.addEventListener('click', onClick);
  // in view: the place asked for, else the level to play next (once the router has scrolled to the top)
  const next = Camp.nextStage(p, W);
  setTimeout(() => centerOn(i ?? next ?? W.stages.length - 1), 0);
  if (i != null) go(() => openPlace(i, true));
  else if (!p.seen[`w${W.id}`]) introSheet(W);
  // the next place's picture, ahead of the tap
  if (next != null) img.addEventListener('load', () => { const id = W.stages[next].pic; new Image().src = PICS[id].src; fetchSprites(PICS[id].live); }, { once: true });
}
// A fight opens over the page (game-ui.js): the campaign's pictures and moving
// parts (tens of MB on a phone) go while it's on; leaving the fight comes back
// to #/campaign/<level>, drawn afresh, where a win plays out.
window.addEventListener('collective:game', () => {
  if (!ui) return;
  const root = ui.root;
  leaveCampaign();
  root.remove();
});

// a picture fades in once it has arrived
function ready(img) {
  const on = () => img.classList.add('ready');
  if (img.complete && img.naturalWidth) on(); else img.addEventListener('load', on, { once: true });
}
function centerOn(i, smooth = false) {
  const n = ui?.root.querySelector(`.cp-node[data-stage="${i}"] .cp-ring`);
  if (!n) return;
  const r = n.getBoundingClientRect();
  window.scrollTo({ top: Math.max(0, window.scrollY + r.top + r.height / 2 - innerHeight * 0.55), behavior: smooth ? 'smooth' : 'auto' });
}

function onClick(e) {
  const n = e.target.closest('.cp-node');
  if (n) {
    const i = Number(n.dataset.stage);
    if (n.classList.contains('locked')) lockedSheet(ui.W, i);
    else { ui.pushed = true; location.hash = `#/campaign/${i}`; }
    return;
  }
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'cp-help') introSheet(ui.W);
  else if (act === 'cp-back') back();
  else if (act === 'cp-onward') location.replace(`#/campaign/${ui.place.i + 1}`);
  const f = e.target.closest('[data-diff]');
  if (f && ui.place) startCampaign(ui.W.id, ui.place.i, Number(f.dataset.diff));
}
// to the map: back through the history if the map is where we came from
function back() {
  if (ui.pushed) history.back(); else location.replace('#/campaign');
}

// ── a place ─────────────────────────────────────────────────────────
// A round on the path: won (gold), due, or still to come. The Legend stands
// on the round due (or, beaten, on the last): that round is `held`, the
// Legend's face its marker.
function roundHTML(P, k, n) {
  const d = Camp.DIFFS[k], st = n > k ? 'won' : n === k ? 'due' : 'later', stars = '★'.repeat(d.stars);
  return `<div class="cp-rnd ${st}${k === Math.min(n, 2) ? ' held' : ''}" data-k="${k}" style="${at(P, P.spots.rounds[k])};--k:${k}">
    <span class="cp-disc">${st === 'won' ? CHECK : `<b>${stars}</b>`}</span>
    <span class="cp-tag">${st === 'won' ? `Won · ${d.name}` : st === 'due' ? `Round ${k + 1} · ${stars} ${d.name}` : `Round ${k + 1} · ${d.name}`}</span>
  </div>`;
}
const foeAt = (P, n) => at(P, P.spots.rounds[Math.min(n, 2)]);
function panelHTML(W, i, n) {
  const S = W.stages[i], L = legendOf(S.deck), round = n < 3 ? n + 1 : null;
  const onward = i + 1 < W.stages.length && Camp.isOpen(Camp.progress(), W.id, i + 1);
  const story = (round ? Camp.beforeLines(S, round) : S.win).map((t) => `<p>${esc(t)}</p>`).join('');
  const act = round
    ? `<button class="btn primary cp-fight" data-diff="${round}">Fight · Round ${round} of 3 · ${'★'.repeat(round)} ${Camp.DIFFS[round - 1].name}</button>`
    : `<div class="cp-beaten">${esc(shortName(L.name))} is beaten.</div>
      <div class="cp-acts"><button class="btn" data-diff="3">Fight again · ★★★</button>${onward ? `<button class="btn primary" data-act="cp-onward">On to ${esc(W.stages[i + 1].place)}</button>` : ''}</div>`;
  return `<div class="cp-story">${story}</div><div class="cp-match"><b>${esc(starter(S.deck).name)}</b> · ${esc(Camp.matchupText(S.odds))}</div>${act}`;
}
// `from`: how many rounds the path shows won at first (fewer than `n` when a
// win is still to be played out here)
function placeHTML(W, i, from, n) {
  const S = W.stages[i], L = legendOf(S.deck), P = PICS[S.pic];
  return `<div class="cp-frame">
    <div class="cp-scene">
      <div class="cp-stage cp-pstage">
        <img class="cp-pic" src="${P.src}" alt="" decoding="async">
        <div class="cp-live" data-pic="${S.pic}"></div>
        ${[0, 1, 2].map((k) => roundHTML(P, k, from)).join('')}
        <div class="cp-foe${from >= 3 ? ' beaten' : ''}" style="${foeAt(P, from)}"><span class="cp-foe-in">${face(L, 'cp-img')}</span><span class="cp-foe-won">${CHECK}</span></div>
      </div>
    </div>
    <header class="cp-ptop">
      <button class="cp-btn" data-act="cp-back" aria-label="Back to the map">${BACK}</button>
      <div class="cp-title"><b>${esc(S.place)}</b><span>${esc(L.name)}${S.boss ? ' · the boss' : ''}</span></div>
      ${starRow(n)}
    </header>
    <div class="cp-panel">${panelHTML(W, i, n)}</div>
  </div>`;
}

// Size the place's picture to fill the screen; and how far to lift it once the
// story is up, to keep its rounds clear of the story below them. (It fills
// the screen as it opens; then it moves up, by its position.)
function layoutPlace() {
  const pl = ui?.place;
  if (!pl) return;
  const el = pl.el, P = PICS[ui.W.stages[pl.i].pic], stage = el.querySelector('.cp-pstage');
  const frame = el.querySelector('.cp-frame'), fw = frame.clientWidth, fh = frame.clientHeight;
  const k = Math.max(fw / P.w, fh / P.h), w = P.w * k, h = P.h * k, top = (fh - h) / 2;
  const ys = P.spots.rounds.map(([, y]) => top + y * k);
  const textTop = fh - el.querySelector('.cp-panel').offsetHeight + 18, barBottom = el.querySelector('.cp-ptop').offsetHeight - 14;
  const lift = Math.max(0, Math.min(Math.max(...ys) + 62 - textTop, Math.min(...ys) - 44 - barBottom)); // the lowest marker's tag; the top one's face
  Object.assign(pl, { top, lift: Math.round(lift) });
  stage.style.cssText = `left:${(fw - w) / 2}px;top:${top - (pl.settled ? pl.lift : 0)}px;width:${w}px;height:${h}px`;
  move(stage.querySelector('.cp-live'));
}
// the lift, once the story is up: a glide that leaves no transform behind
function settle(pl) {
  pl.settled = true;
  const stage = pl.el.querySelector('.cp-pstage'), box = stage.querySelector('.cp-live');
  if (!pl.lift) { restart(box, true); return; }
  stage.style.top = `${pl.top - pl.lift}px`;
  if (still()) return;
  stage.animate([{ transform: `translateY(${pl.lift}px)` }, { transform: 'none' }], { duration: 500, delay: 100, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' })
    .finished.then(() => restart(box, true), () => {});
}
let resizing = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizing);
  resizing = setTimeout(() => {
    if (!ui?.root.isConnected) return;
    layoutPlace();
    if (ui.place) restart(ui.place.el.querySelector('.cp-live'), true);
    move(ui.root.querySelector('.cp-mapstage .cp-live'));
  }, 150);
});

// A soft burst of light where the map opens into the place.
function burst(host, x, y) {
  const b = document.createElement('div');
  b.className = 'cp-burst';
  b.style.cssText = `left:${x}px;top:${y}px`;
  host.append(b);
  return b;
}

// Into a place: the map dives toward its medallion, and the place opens out
// of the medallion as a widening circle; then the rounds come up along the
// path and the story slides in. (A clip and transforms: the compositor's work.)
const OPEN = 1.08; // the place starts a touch closer, inside its circle, and settles (never smaller than the screen: no edges)
const circle = (r, x, y) => `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
function zoomFrame(el, wrap, node) {
  const r = node.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, wr = wrap.getBoundingClientRect();
  const scene = el.querySelector('.cp-scene'), fr = scene.getBoundingClientRect(), x = cx - fr.left, y = cy - fr.top;
  wrap.style.transformOrigin = `${cx - wr.left}px ${cy - wr.top}px`;
  scene.style.transformOrigin = `${x}px ${y}px`;
  const far = Math.hypot(Math.max(x, fr.width - x), Math.max(y, fr.height - y)) + 4;
  return { scene, cx, cy, small: circle(r.width / 2 / OPEN, x, y), big: circle(far, x, y) };
}
async function openPlace(i, instant = false) {
  if (!ui || ui.place?.i === i) return;
  const { W, root } = ui, p = Camp.progress();
  if (!W.stages[i] || !Camp.isOpen(p, W.id, i)) {
    if (ui.place) await closePlace();
    history.replaceState(null, '', '#/campaign');
    if (W.stages[i]) lockedSheet(W, i);
    return;
  }
  if (ui.place) await closePlace(true);
  const S = W.stages[i], n = Camp.starsOf(p, W.id, i), shown = Camp.shownOf(p, W.id, i);
  const from = shown != null && shown < n ? shown : n;
  const el = document.createElement('div');
  el.className = 'cp-place';
  el.innerHTML = placeHTML(W, i, from, n);
  root.append(el);
  ui.place = { i, el };
  layoutPlace();
  const img = el.querySelector('.cp-pic');
  ready(img);
  livenPic(el.querySelector('.cp-live'));
  swipeBack(el.querySelector('.cp-scene'));
  const wrap = root.querySelector('.cp-mapwrap'), mapLive = root.querySelector('.cp-mapstage .cp-live');
  let node = root.querySelector(`.cp-node[data-stage="${i}"] .cp-ring`);
  if (!instant && !still() && node) {
    let r = node.getBoundingClientRect();
    if (r.top < 70 || r.bottom > innerHeight - 70) { centerOn(i, true); await wait(450); r = node.getBoundingClientRect(); }
    await Promise.race([img.decode ? img.decode().catch(() => {}) : null, wait(450)]);
    if (ui?.place?.el !== el) return;
    const z = zoomFrame(el, wrap, node), flash = burst(el, z.cx, z.cy), D = 860;
    const anims = [
      wrap.animate([{ transform: 'scale(1)' }, { transform: 'scale(2.4)' }], { duration: D, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' }),
      z.scene.animate([{ clipPath: z.small, transform: `scale(${OPEN})` }, { clipPath: z.big, transform: 'scale(1)' }], { duration: D, easing: 'cubic-bezier(.5,0,.15,1)', fill: 'both' }),
      flash.animate([{ transform: 'scale(.4)', opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { transform: 'scale(3.2)', opacity: 0 }], { duration: D * 0.6, easing: 'ease-out', fill: 'both' }),
    ];
    await done(anims);
    flash.remove();
    wrap.style.visibility = 'hidden';
    anims.forEach((a) => a.cancel());
  }
  wrap.style.visibility = 'hidden';
  hold(mapLive, true);
  root.classList.add('placed');
  requestAnimationFrame(() => { el.classList.add('in', 'lit'); settle(ui.place); }); // (lit stays while it shrinks away; in goes)
  if (from < n) setTimeout(() => playWin(el, i, from, n), 900);
  else Camp.markShown(W.id, i, n);
}

// Back out to the map: the circle closes back into the medallion as the map
// comes back around it. (`swap`: on to another place right after.)
async function closePlace(swap = false) {
  const pl = ui?.place;
  if (!pl) return;
  const { root } = ui, el = pl.el;
  ui.place = null;
  if (!swap) ui.pushed = false;
  const wrap = root.querySelector('.cp-mapwrap'), mapLive = root.querySelector('.cp-mapstage .cp-live');
  wrap.style.visibility = '';
  hold(mapLive, false);
  root.classList.remove('placed');
  const node = root.querySelector(`.cp-node[data-stage="${pl.i}"] .cp-ring`);
  if (still() || !node) { drop(el.querySelector('.cp-live')); el.remove(); return; }
  const r = node.getBoundingClientRect();
  if (r.top < 70 || r.bottom > innerHeight - 70) centerOn(pl.i);
  el.classList.remove('in');
  const z = zoomFrame(el, wrap, node), D = 700;
  const anims = [
    wrap.animate([{ transform: 'scale(2.4)' }, { transform: 'scale(1)' }], { duration: D, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'both' }),
    z.scene.animate([{ clipPath: z.big, transform: 'scale(1)', opacity: 1 }, { clipPath: z.small, transform: `scale(${OPEN})`, opacity: 1, offset: 0.9 }, { clipPath: z.small, transform: `scale(${OPEN})`, opacity: 0 }], { duration: D, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' }),
  ];
  await done(anims);
  drop(el.querySelector('.cp-live'));
  el.remove();
  anims.forEach((a) => a.cancel());
  wrap.style.transformOrigin = '';
  restart(mapLive);
}

// A win not yet seen here: the Legend runs on up the path, and the rounds
// left behind turn gold; the round they stop at lights up. The third time
// there's nowhere left to run: they fall where they stand.
async function playWin(el, i, from, n) {
  if (ui?.place?.el !== el) return;
  const P = PICS[ui.W.stages[i].pic], stage = el.querySelector('.cp-pstage'), foe = stage.querySelector('.cp-foe');
  const swap = (k, cls) => {
    const old = stage.querySelector(`.cp-rnd[data-k="${k}"]`);
    old.insertAdjacentHTML('afterend', roundHTML(P, k, n));
    old.remove();
    if (cls) stage.querySelector(`.cp-rnd[data-k="${k}"]`).classList.add(cls);
  };
  const to = Math.min(n, 2), behind = () => { for (let k = from; k < n; k++) if (k !== to) swap(k, 'just'); };
  Camp.markShown(ui.W.id, i, n);
  if (Math.min(from, 2) !== to && !still()) {
    const a = foe.getBoundingClientRect(), [tx, ty] = P.spots.rounds[to], s = stage.getBoundingClientRect();
    const dx = s.left + (tx / P.w) * s.width - a.left, dy = s.top + (ty / P.h) * s.height - a.top;
    const run = foe.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx * 0.5}px,${dy * 0.5 - 34}px)`, offset: 0.5 }, { transform: `translate(${dx}px,${dy}px)` }], { duration: 1000, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'forwards' });
    await wait(380);
    behind();
    await done([run]);
    foe.style.cssText = foeAt(P, n);
    run.cancel();
  } else {
    foe.style.cssText = foeAt(P, n);
    behind();
  }
  if (n >= 3) { swap(2, 'just'); foe.classList.add('beaten'); } else swap(to, 'lit');
}

// A swipe to the right goes back to the map (as on a phone's own screens).
function swipeBack(el) {
  let x0 = 0, y0 = 0, t0 = 0;
  el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; t0 = Date.now(); });
  el.addEventListener('pointerup', (e) => {
    const dx = e.clientX - x0, dy = e.clientY - y0;
    if (dx > 70 && Math.abs(dy) < dx * 0.6 && Date.now() - t0 < 800 && ui?.place) back();
  });
}

// ── sheets ──────────────────────────────────────────────────────────
function sheet(html, onClick) {
  closeSheet();
  const el = document.createElement('div');
  el.className = 'cp-sheet';
  el.setAttribute('role', 'dialog');
  el.innerHTML = `<div class="cp-sheet-in">${html}</div>`;
  el.onclick = (e) => { if (e.target === el || e.target.closest('[data-act="cp-close"]')) { closeSheet(); return; } onClick?.(e); };
  document.body.appendChild(el);
}
export function closeSheet() { document.querySelector('.cp-sheet')?.remove(); }

function introSheet(W) {
  const me = legendOf(W.deck);
  sheet(`<div class="cp-who">${face(me)}<div><b>${esc(me.name)}</b><span>World ${W.id} · ${esc(W.name)}</span></div></div>
    <div class="cp-story">${W.intro.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    <p class="cp-how">Each place on the road has a Legend to beat three times: ★ Casual, then ★★ Practice, then ★★★ Expert. They get away the first two times and come back with better fighters; the third win beats them for good and opens the road on.</p>
    <button class="btn primary" data-act="cp-close">Set out</button>`);
  Camp.markSeen(`w${W.id}`);
}

function lockedSheet(W, i) {
  const S = W.stages[i], L = legendOf(S.deck), prev = W.stages[i - 1];
  sheet(`<div class="cp-who">${face(L)}<div><b>${esc(S.place)}</b><span>${esc(L.name)} waits here</span></div></div>
    <div class="cp-locked">${LOCK}Beat ${esc(shortName(legendOf(prev.deck).name))} three times at ${esc(prev.place)} to open this road.</div>
    <button class="btn ghost" data-act="cp-close">Close</button>`);
}
