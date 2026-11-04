// Card rendering: full cards, compact rows, the card back and faction glyphs.
// Everything is drawn in HTML/CSS; paintings come from art/ when they exist.

import { FACTIONS, KEYWORDS, KEYWORD_PATTERN, SET } from './cards.js';
import { ART } from './art-manifest.js';
import { artImage, artSVG } from './art/index.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const GLYPH_PATHS = {
  ember:   '<path d="M12 2.2c1.6 4 5.2 6 5.2 11.3a5.2 5.2 0 0 1-10.4 0c0-3 1.9-4.6 3-6.2.3 2 1.1 3.2 2.3 3.8-.6-3.2-.9-6 0-8.9z"/>',
  verdant: '<path d="M4.5 19.5C4.5 10.5 10 4.5 19.5 4.5c0 9.5-6 15-15 15z"/><path d="M4.5 19.5 13 11" fill="none" stroke="var(--gl-bg,#000)" stroke-width="1.4" stroke-linecap="round"/>',
  tide:    '<path d="M2.5 9.2c2.4-2.6 4.6-2.6 7 0s4.6 2.6 7 0 3.9-2.2 5 0M2.5 14.2c2.4-2.6 4.6-2.6 7 0s4.6 2.6 7 0 3.9-2.2 5 0M2.5 19.2c2.4-2.6 4.6-2.6 7 0s4.6 2.6 7 0 3.9-2.2 5 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  umbral:  '<path d="M15.2 2.8a9.4 9.4 0 1 0 6 13.6A7.4 7.4 0 0 1 15.2 2.8z"/>',
  radiant: '<path d="M12 1.8l2.1 8.1 8.1 2.1-8.1 2.1L12 22.2l-2.1-8.1L1.8 12l8.1-2.1z"/>',
  neutral: '<circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="1.6"/>',
};

export function glyph(faction, cls = '') {
  const f = GLYPH_PATHS[faction] ? faction : 'neutral';
  return `<svg class="glyph ${cls}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${GLYPH_PATHS[f]}</svg>`;
}

// A small coin in the faction colour with the glyph knocked out in cream.
export function factionCoin(faction) {
  const f = FACTIONS[faction];
  const bg = f ? f.color : '#6d6a62';
  return `<span class="coin" style="--coin:${bg}" title="${esc(f ? f.name : 'Neutral')}">${glyph(faction)}</span>`;
}

export function factionVars(card) {
  const [a, b] = card.factions.length ? card.factions : ['neutral'];
  const fa = FACTIONS[a] || { color: '#6d6a62', light: '#b9b3a3' };
  const fb = FACTIONS[b || a] || fa;
  return `--f:${fa.color};--fl:${fa.light};--f2:${fb.color};--f2l:${fb.light}`;
}

export function typeLine(card) {
  const t = card.type === 'creature' ? 'Creature' : card.type === 'relic' ? 'Relic' : 'Spell';
  const pre = (card.token ? 'Token ' : '') + (card.legendary ? 'Legendary ' : '');
  return card.subtype && card.type !== 'relic' ? `${pre}${t} — ${card.subtype}` : `${pre}${t}`;
}

// A one-word label for a non-creature: Spell, Trick, Trap or Relic.
export const kindOf = (card) => (card.type === 'relic' ? 'Relic' : card.subtype === 'Trick' || card.subtype === 'Trap' ? card.subtype : card.type === 'creature' ? 'Creature' : 'Spell');

// Rules text: one paragraph per line, keywords set in bold so a tap can explain them.
export function rulesHTML(text) {
  if (!text) return '';
  return text.split('\n').map((line) => {
    const safe = esc(line).replace(KEYWORD_PATTERN, (m) => {
      const key = Object.keys(KEYWORDS).find((k) => KEYWORDS[k].name.toLowerCase() === m.toLowerCase());
      return `<b class="kw" data-kw="${key}">${m}</b>`;
    });
    return `<p>${safe}</p>`;
  }).join('');
}

export function artURL(card) {
  return ART[card.id] || null;
}

// Small static art as an <img>, or the live SVG where it animates.
export function artTag(id, live = false) {
  if (live) return artSVG(id) || '';
  const src = artImage(id);
  return src ? `<img class="art-img" src="${src}" alt="" loading="lazy" decoding="async">` : (artSVG(id) || '');
}

// A painting in art/ (if one is ever added) wins over the drawn art.
function artHTML(card, live = false) {
  const url = artURL(card);
  if (!url && artSVG(card.id)) return `<div class="c-art">${artTag(card.id, live)}</div>`;
  const main = card.factions[0] || 'neutral';
  return `<div class="c-art">
      <div class="c-art-ph">${glyph(main)}</div>
      ${url ? `<img src="${esc(url)}" alt="" loading="lazy" decoding="async">` : ''}
    </div>`;
}

function textTier(card) {
  const n = (card.text || '').length + (card.flavor || '').length * 0.8;
  if (n > 190) return 't-xs';
  if (n > 150) return 't-sm';
  if (n > 105) return 't-md';
  return '';
}

function nameTier(name) {
  if (name.length > 22) return 'n-sm';
  if (name.length > 16) return 'n-md';
  return '';
}

// Full card face. `opts.cost` overrides the printed cost (e.g. after reductions).
export function cardHTML(card, opts = {}) {
  const multi = card.factions.length > 1 ? ' multi' : '';
  const cost = opts.cost ?? card.cost;
  const costCls = opts.cost != null && opts.cost !== card.cost ? (opts.cost < card.cost ? ' cheaper' : ' pricier') : '';
  const pv = card.type === 'creature'
    ? `<div class="c-pv">${opts.power ?? card.power}<span>/</span>${opts.vitality ?? card.vitality}</div>` : '';
  const flavor = card.flavor && !opts.noFlavor ? `<div class="c-flavor">${esc(card.flavor)}</div>` : '';
  const coins = (card.factions.length ? card.factions : ['neutral']).map(factionCoin).join('');
  const num = card.n ? `${String(card.n).padStart(2, '0')}/90` : 'token';
  return `<div class="card${multi}${card.legendary ? ' legendary' : ''}${opts.cls ? ' ' + opts.cls : ''}" data-id="${esc(card.id)}" data-type="${card.type}" style="${factionVars(card)}">
    <div class="card-face">
      <div class="c-frame">
        <div class="c-head">
          <div class="c-name ${nameTier(card.name)}">${esc(card.name)}</div>
          <div class="c-cost${costCls}"><span>${cost}</span></div>
        </div>
        ${artHTML(card, /\banim\b/.test(opts.cls || ''))}
        <div class="c-type"><span>${esc(typeLine(card))}</span><span class="c-coins">${coins}</span></div>
        <div class="c-box ${textTier(card)}">
          <div class="c-rules">${rulesHTML(card.text)}</div>
          ${flavor}
        </div>
        <div class="c-foot">${esc(SET.week)} · ${num}</div>
      </div>
      ${pv}
    </div>
  </div>`;
}

export function cardBackHTML(cls = '') {
  const ring = ['ember', 'verdant', 'tide', 'umbral', 'radiant'].map((f, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + Math.cos(a) * 31, y = 50 + Math.sin(a) * 31;
    return `<g transform="translate(${(x - 6).toFixed(2)} ${(y - 6).toFixed(2)}) scale(.5)">${GLYPH_PATHS[f]}</g>`;
  }).join('');
  return `<div class="card card-back ${cls}">
    <div class="card-face">
      <div class="b-field">
        <svg class="b-emblem" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" stroke-width="1.2"/>
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width=".5"/>
          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="1"/>
          <path d="M50 33 L54 46 L67 50 L54 54 L50 67 L46 54 L33 50 L46 46 Z" fill="currentColor"/>
          <g fill="currentColor" stroke="none">${ring}</g>
        </svg>
        <div class="b-word">THE COLLECTIVE</div>
      </div>
    </div>
  </div>`;
}

// One line in the deckbuilder: thumbnail, cost, name, type, stats, factions.
export function cardRowHTML(card, count = 0, opts = {}) {
  const url = artURL(card);
  const thumb = url ? `<img src="${esc(url)}" alt="" loading="lazy">` : artTag(card.id) || glyph(card.factions[0] || 'neutral');
  const pv = card.type === 'creature' ? `<span class="r-pv">${card.power}/${card.vitality}</span>` : `<span class="r-pv r-spell">${kindOf(card)}</span>`;
  const coins = card.factions.map(factionCoin).join('');
  const controls = opts.controls === false ? '' : `
      <div class="r-ctl">
        <button class="r-btn" data-act="minus" ${count <= 0 ? 'disabled' : ''} aria-label="Remove one">−</button>
        <span class="r-count${count ? ' on' : ''}">${count}</span>
        <button class="r-btn" data-act="plus" ${count >= (opts.max ?? 1) || opts.blocked ? 'disabled' : ''} aria-label="Add one">+</button>
      </div>`;
  return `<div class="row" data-id="${esc(card.id)}" style="${factionVars(card)}">
      <div class="r-thumb">${thumb}</div>
      <div class="r-cost">${card.cost}</div>
      <div class="r-main">
        <div class="r-name">${esc(card.name)}</div>
        <div class="r-sub">${coins}<span>${esc(typeLine(card))}</span></div>
      </div>
      ${pv}
      ${controls}
    </div>`;
}
