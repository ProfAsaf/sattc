// The campaign's screens (campaign.js has the worlds, the story and your
// progress): a world's map, the road from your harbor up to its boss, each
// level a medallion with the Legend you'll meet there and your stars; tap
// one for its scene and the three difficulties. The fights themselves are
// practice games (game-ui.js startCampaign) that come back here.

import { BY_ID, ULTRA_STARTERS } from './cards.js';
import { artURL, esc } from './render.js';
import * as Camp from './campaign.js';
import { startCampaign } from './game-ui.js';

const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7.5a5 5 0 0 1 10 0V10" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="5" y="10" width="14" height="10" rx="2.2" fill="currentColor"/></svg>';
const starter = (id) => ULTRA_STARTERS.find((d) => d.id === id);
const legendOf = (deckId) => BY_ID[starter(deckId)?.legend];
const shortName = (name) => name.split(',')[0];
const face = (card, cls = 'cp-face') => `<img class="${cls}" src="${esc(artURL(card) || '')}" alt="">`;
const starRow = (n) => `<span class="cp-stars" aria-label="${n} of 3 stars">${[1, 2, 3].map((k) => `<i class="${k <= n ? 'on' : ''}">★</i>`).join('')}</span>`;

// Where each level sits on World 1's map (in its 400 × 1000 drawing), the
// harbor at the bottom, the Wall at the top; and the road through them.
const SPOTS = { 1: { start: [200, 962], stages: [[128, 828], [272, 680], [150, 522], [256, 366], [200, 182]] } };

// World 1, drawn: a harbor town on a bay at sunset, the market square, the
// cliffs, a mountain pass, high fields under the night, and the Wall on its
// ridge. Plain shapes, no filters: a page that scrolls on any phone.
function harborRoad() {
  const stars = [[24, 30], [62, 92], [118, 40], [160, 74], [232, 26], [290, 64], [338, 22], [376, 88], [96, 128], [314, 120], [40, 186], [366, 168], [204, 54]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.1 : 1.7}" fill="#fff" opacity="${i % 2 ? 0.55 : 0.85}"/>`).join('');
  const moths = [[226, 330], [238, 316], [276, 334], [290, 352], [214, 382], [300, 388], [262, 312], [246, 404], [282, 410]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.3}" fill="#fff3c4" opacity=".85"/>`).join('');
  const merlons = Array.from({ length: 19 }, (_, i) => `M${22 + i * 19},150h10v-9h-10z`).join('');
  return `<svg class="cp-art" viewBox="0 0 400 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#15142c"/><stop offset=".24" stop-color="#2c2448"/><stop offset=".38" stop-color="#6f415e"/>
        <stop offset=".45" stop-color="#d98d5a"/><stop offset=".5" stop-color="#f2c179"/><stop offset="1" stop-color="#f2c179"/>
      </linearGradient>
      <linearGradient id="cp-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3f7f99"/><stop offset="1" stop-color="#173b52"/></linearGradient>
      <linearGradient id="cp-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2c3a"/><stop offset=".6" stop-color="#22403f"/><stop offset="1" stop-color="#2b5243"/></linearGradient>
    </defs>
    <rect width="400" height="1000" fill="url(#cp-sky)"/>
    ${stars}
    <path d="M70 52a16 16 0 1 0 16 22 13 13 0 1 1-16-22z" fill="#f7efd2" opacity=".9"/>
    <!-- the high fields, at night -->
    <path d="M0 236 C90 214 300 214 400 240 L400 610 L0 610 Z" fill="url(#cp-night)"/>
    <path d="M200 306 C240 296 300 292 334 300 C344 340 348 392 340 428 C300 438 236 440 192 432 C186 392 188 340 200 306 Z" fill="#5a5a34" opacity=".55"/>
    <path d="M202 336 C250 328 300 326 340 332 M196 366 C250 360 300 358 344 364 M194 398 C250 394 300 392 344 396" stroke="#8a8446" stroke-width="2" fill="none" opacity=".5"/>
    ${moths}
    <!-- the ridge and the Wall -->
    <path d="M0 238 C80 206 150 198 200 196 C260 196 330 204 400 232 L400 262 L0 262 Z" fill="#22213a"/>
    <path d="M18 196 L382 196 L382 150 L18 150 Z" fill="#3e3b57"/>
    <path d="${merlons}" fill="#3e3b57"/>
    <path d="M18 150 L382 150" stroke="#d8a96b" stroke-width="2" opacity=".8"/>
    <path d="M52 196V128h28v68zM138 196V132h26v64zM236 196V132h26v64zM320 196V128h28v68z" fill="#47445f"/>
    <path d="M52 128h28M138 132h26M236 132h26M320 128h28" stroke="#d8a96b" stroke-width="2" opacity=".7"/>
    <path d="M182 196 L182 172 Q200 150 218 172 L218 196 Z" fill="#141322"/>
    <!-- far mountains and the pass -->
    <path d="M0 520 L40 470 L78 492 L112 446 L142 500 L132 540 L0 560 Z" fill="#4d4560"/>
    <path d="M168 540 L190 470 L222 440 L262 486 L300 452 L346 494 L400 470 L400 560 L170 560 Z" fill="#4d4560"/>
    <path d="M112 446 L142 500 L128 520 Z M222 440 L262 486 L236 492 Z M300 452 L346 494 L318 498 Z" fill="#7d6f86" opacity=".75"/>
    <path d="M88 548 L120 500 L138 512 L128 560 Z M176 562 L196 512 L214 528 L206 566 Z" fill="#6d6064"/>
    <!-- green hills -->
    <path d="M0 560 C70 540 140 556 200 548 C270 540 330 556 400 544 L400 1000 L0 1000 Z" fill="#2e5c41"/>
    <path d="M0 640 C90 610 170 640 240 622 C300 608 350 630 400 620 L400 1000 L0 1000 Z" fill="#3b7048"/>
    <!-- the cliffs over the bay, and their birds -->
    <path d="M300 640 C330 630 370 632 400 640 L400 800 L322 800 C330 760 306 720 300 640 Z" fill="#8a745c"/>
    <path d="M300 640 C330 630 370 632 400 640" stroke="#c4a77e" stroke-width="5" fill="none"/>
    <path d="M318 606 q6 -6 12 0 q6 -6 12 0 M352 590 q5 -5 10 0 q5 -5 10 0" stroke="#2a2a3a" stroke-width="2" fill="none"/>
    <path d="M0 740 C80 716 160 744 230 730 C280 720 300 740 322 760 L322 1000 L0 1000 Z" fill="#4b874f"/>
    <!-- the bay -->
    <path d="M232 790 C270 770 300 790 330 790 C360 790 380 784 400 786 L400 1000 L220 1000 C210 940 214 860 232 790 Z" fill="url(#cp-sea)"/>
    <path d="M262 830h26M300 856h30M250 890h22M318 912h40M270 960h30" stroke="#a9d3e0" stroke-width="2" stroke-linecap="round" opacity=".5"/>
    <path d="M232 936h96v8h-96z" fill="#6b4a32"/>
    <path d="M294 900h34l-5 10h-24z" fill="#5a3a2a"/><path d="M310 900v-30l14 26z" fill="#f4ead2"/>
    <path d="M344 968h40l-6 12h-28z" fill="#5a3a2a"/><path d="M362 968v-34l16 30z" fill="#f4ead2"/>
    <path d="M360 760h16l4 56h-24z" fill="#efe6d4"/><path d="M357 776h22v8h-22zM356 796h24v8h-24z" fill="#b8473c"/>
    <circle cx="368" cy="752" r="9" fill="#ffe6a0" opacity=".9"/>
    <!-- the town and its market -->
    <path d="M24 900h44v40h-44zM80 910h40v34h-40zM34 960h50v40h-50zM120 950h42v50h-42zM170 960h40v40h-40z" fill="#c9875a"/>
    <path d="M20 900l26-20 26 20zM76 910l24-18 24 18zM30 960l29-20 29 20zM116 950l25-20 25 20zM166 960l24-18 24 18z" fill="#6b3b2e"/>
    <circle cx="128" cy="828" r="52" fill="#d8c39a"/>
    <circle cx="128" cy="828" r="52" fill="none" stroke="#b9a37a" stroke-width="3" stroke-dasharray="2 6"/>
    ${[150, 190, 228, 266].map((a) => { const r = 62, x = 128 + r * Math.cos((a * Math.PI) / 180), y = 828 + r * Math.sin((a * Math.PI) / 180);
      return `<path d="M${(x - 11).toFixed(1)} ${(y + 2).toFixed(1)}h22v9h-22z" fill="#7a4e33"/><path d="M${(x - 12).toFixed(1)} ${(y - 8).toFixed(1)}h24v9h-24z" fill="#e05a4a"/>`
        + `<path d="M${(x - 12).toFixed(1)} ${(y - 8).toFixed(1)}h24" stroke="#fff" stroke-width="3" stroke-dasharray="4 4"/>`; }).join('')}
    <!-- the road -->
    <path id="cp-road" d="M200 975 C190 930 112 880 128 828 C144 774 286 742 272 680 C262 628 138 594 150 522 C160 462 270 432 256 366 C244 300 200 252 200 190"
      fill="none" stroke="#e8d2a2" stroke-width="13" stroke-linecap="round"/>
    <path d="M200 975 C190 930 112 880 128 828 C144 774 286 742 272 680 C262 628 138 594 150 522 C160 462 270 432 256 366 C244 300 200 252 200 190"
      fill="none" stroke="#b39461" stroke-width="2" stroke-dasharray="7 9" stroke-linecap="round"/>
  </svg>`;
}

function mapHTML(W, p) {
  const spot = SPOTS[W.id], next = Camp.nextStage(p, W);
  const node = (i) => {
    const S = W.stages[i], L = legendOf(S.deck), n = Camp.starsOf(p, W.id, i), open = Camp.isOpen(p, W.id, i);
    const [x, y] = spot.stages[i];
    const cls = !open ? 'locked' : i === next ? 'next' : n ? 'done' : 'open';
    return `<button class="cp-node ${cls}${S.boss ? ' boss' : ''}" data-stage="${i}" style="left:${(x / 4).toFixed(2)}%;top:${(y / 10).toFixed(2)}%"
      aria-label="${esc(S.place)}: ${esc(L.name)}${open ? `, ${n} of 3 stars` : ', locked'}">
      <span class="cp-ring">${face(L, 'cp-img')}${open ? '' : `<span class="cp-lock">${LOCK}</span>`}</span>
      <span class="cp-label">${esc(shortName(L.name))}</span>${open ? starRow(n) : ''}
    </button>`;
  };
  const me = legendOf(W.deck);
  const [sx, sy] = spot.start;
  return `<div class="cp-map">${harborRoad()}
    <div class="cp-start" style="left:${(sx / 4).toFixed(2)}%;top:${(sy / 10).toFixed(2)}%">${face(me, 'cp-img')}<span>${esc(shortName(me.name))} sets out</span></div>
    ${W.stages.map((_, i) => node(i)).join('')}
  </div>`;
}

// The campaign page: World 1 (the only one so far) with your stars.
export function campaignPage(view) {
  const W = Camp.worldOf(1), p = Camp.progress(), me = legendOf(W.deck), mine = starter(W.deck);
  const total = Camp.worldStars(p, W), done = Camp.starsOf(p, W.id, W.stages.length - 1) > 0;
  view.innerHTML = `
    <header class="pagehead"><a class="back" href="#/" aria-label="Home">${BACK}</a><h2>Campaign</h2></header>
    <div class="cp-page">
      <div class="cp-head">
        ${face(me)}
        <div><div class="cp-world">World ${W.id} · ${esc(W.name)}</div>
        <div class="cp-sub">You play ${esc(mine.name)}, led by ${esc(shortName(me.name))} · <b class="cp-total">★ ${total} / ${W.stages.length * 3}</b></div></div>
      </div>
      ${done ? `<div class="cp-done">${esc(W.done)} <span>(Coming soon.)</span></div>` : ''}
      ${mapHTML(W, p)}
      <p class="cp-how">Each level has three difficulties: ★ Casual, ★★ Practice, ★★★ Expert. One win opens the next level; harder wins earn more stars.</p>
    </div>`;
  view.onclick = (e) => {
    const n = e.target.closest('.cp-node');
    if (n) stageSheet(W, Number(n.dataset.stage));
  };
  if (!p.seen[`w${W.id}`]) introSheet(W);
  // the level to play next, in view
  setTimeout(() => document.querySelector('.cp-node.next')?.scrollIntoView({ block: 'center' }), 0);
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
    <button class="btn primary" data-act="cp-close">Set out</button>`);
  Camp.markSeen(`w${W.id}`);
}

function stageSheet(W, i) {
  const p = Camp.progress(), S = W.stages[i], L = legendOf(S.deck), deck = starter(S.deck);
  const n = Camp.starsOf(p, W.id, i), open = Camp.isOpen(p, W.id, i);
  const prev = i > 0 ? legendOf(W.stages[i - 1].deck) : null;
  const first = Camp.DIFFS.find((d) => d.stars > n) || Camp.DIFFS[Camp.DIFFS.length - 1];
  const diffs = Camp.DIFFS.map((d) => `<button class="btn${d === first ? ' primary' : ''} cp-diff" data-diff="${d.stars}">
      <span>${'★'.repeat(d.stars)} ${d.name}</span>${n >= d.stars ? '<small>won</small>' : ''}</button>`).join('');
  sheet(`<div class="cp-who">${face(L)}<div><b>${esc(L.name)}</b><span>${esc(deck.name)} · ${esc(S.place)}${S.boss ? ' · the boss' : ''}</span></div></div>
    <div class="cp-story">${S.before.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
    <div class="cp-match">${esc(Camp.matchupText(S.odds))}</div>
    ${open ? `<div class="cp-diffs">${diffs}</div>` : `<div class="cp-locked">${LOCK}Win against ${esc(shortName(prev.name))} at ${esc(W.stages[i - 1].place)} to open this road.</div>`}
    <button class="btn ghost" data-act="cp-close">Close</button>`, (e) => {
    const b = e.target.closest('[data-diff]');
    if (!b) return;
    closeSheet();
    startCampaign(W.id, i, Number(b.dataset.diff));
  });
}
