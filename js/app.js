// The Collective — app shell: hash router and the non-game views
// (home, card gallery, deck list, deckbuilder, rules).

import { BY_ID, CARDS, FACTIONS, FACTION_ORDER, KEYWORDS, RULES, SET, STARTERS, TOKENS } from './cards.js';
import { cardBackHTML, cardHTML, cardRowHTML, esc, factionCoin } from './render.js';
import * as Decks from './decks.js';
import { autoRejoin, demo, playPage } from './game-ui.js';

const view = document.getElementById('view');

// ── small helpers ───────────────────────────────────────────────────
let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

function factionSlots(fs) {
  const list = [...fs];
  let html = list.map(factionCoin).join('');
  for (let i = list.length; i < RULES.maxFactions; i++) html += '<span class="fac-slot-empty"></span>';
  return html;
}

function curveHTML(counts) {
  const c = Decks.curve(counts).slice(1); // costs 1..7+
  const max = Math.max(4, ...c);
  return `<div class="curve" title="Cards by cost">${c.map((n, i) =>
    `<div><i style="height:${(n / max) * 24}px"></i><span>${i === 6 ? '7+' : i + 1}</span></div>`).join('')}</div>`;
}

function chipsHTML(state, opts = {}) {
  const fchips = [['all', 'All'], ...FACTION_ORDER.map((f) => [f, FACTIONS[f].name]), ['multi', 'Two-faction']];
  const tchips = [['all', 'Any type'], ['creature', 'Creatures'], ['spell', 'Spells']];
  return `<div class="chips">${fchips.map(([k, label]) =>
      `<button class="chip${state.f === k ? ' on' : ''}" data-f="${k}">${FACTIONS[k] ? factionCoin(k) : ''}${label}</button>`).join('')}</div>
    <div class="chips">${tchips.map(([k, label]) =>
      `<button class="chip${state.t === k ? ' on' : ''}" data-t="${k}">${label}</button>`).join('')}${opts.extra || ''}</div>`;
}

function matches(card, state) {
  const okF = state.f === 'all' || (state.f === 'multi' ? card.factions.length > 1 : card.factions.includes(state.f));
  const okT = state.t === 'all' || card.type === state.t;
  return okF && okT;
}

// ── zoom overlay ────────────────────────────────────────────────────
// Shows one card big, flippable, with its keywords explained. In the
// deckbuilder it also carries the +/- controls.
let zoomEl = null;
function closeZoom() {
  if (!zoomEl) return;
  zoomEl.remove();
  zoomEl = null;
  document.body.style.overflow = '';
}

function openZoom(id, deckCtx = null) {
  closeZoom();
  const card = BY_ID[id];
  if (!card) return;
  zoomEl = document.createElement('div');
  zoomEl.className = 'zoom';
  document.body.style.overflow = 'hidden';

  const kwSeen = new Set();
  const kwList = [];
  const scan = (text) => {
    for (const k of Object.keys(KEYWORDS)) {
      const re = new RegExp('\\b' + KEYWORDS[k].name + '\\b', 'i');
      if (re.test(text) && !kwSeen.has(k)) { kwSeen.add(k); kwList.push(k); }
    }
  };
  scan(card.text || '');
  const notes = [];
  if (/Spirit creature/.test(card.text)) notes.push('<b>Spirit</b> — a 1/1 Radiant creature token. Tokens vanish if they leave play.');
  if (card.subtype === 'Trap') notes.push('Sits face-down on your side until an opponent plays a Spell.');

  const render = () => {
    const n = deckCtx ? deckCtx.counts[id] || 0 : 0;
    const can = deckCtx ? Decks.canAdd(deckCtx.counts, id) : null;
    zoomEl.innerHTML = `
      <button class="zoom-close" data-act="close" aria-label="Close">×</button>
      <div class="zoom-inner">
        <div class="flipper"><div class="flip-inner">${cardHTML(card, { cls: 'anim' })}${cardBackHTML()}</div></div>
        <div class="zoom-bar">
          <button class="btn small ghost" data-act="flip">Flip card</button>
          ${deckCtx ? `<div class="r-ctl">
              <button class="r-btn" data-act="minus" ${n <= 0 ? 'disabled' : ''}>−</button>
              <span class="r-count${n ? ' on' : ''}" style="width:auto;padding:0 8px">${n} in deck</span>
              <button class="r-btn" data-act="plus" ${!can.ok ? 'disabled' : ''}>+</button>
            </div>` : `<span class="muted small">2 copies in the pool</span>`}
        </div>
        ${deckCtx && !can.ok && n < 2 ? `<div class="zoom-note">${esc(can.reason)}</div>` : ''}
        ${kwList.length || notes.length ? `<div class="kw-help">${kwList.map((k) =>
          `<div><b>${KEYWORDS[k].name}</b> — ${esc(KEYWORDS[k].text)}</div>`).join('')}${notes.map((t) => `<div>${t}</div>`).join('')}</div>` : ''}
      </div>`;
  };
  render();

  zoomEl.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'close') return closeZoom();
    if (act === 'flip') return zoomEl.querySelector('.flipper').classList.toggle('flipped');
    if (act === 'plus' || act === 'minus') {
      deckCtx.change(id, act === 'plus' ? 1 : -1);
      const flipped = zoomEl.querySelector('.flipper').classList.contains('flipped');
      render();
      if (flipped) zoomEl.querySelector('.flipper').classList.add('flipped');
      return;
    }
    if (e.target.closest('.flipper')) return zoomEl.querySelector('.flipper').classList.toggle('flipped');
    if (!e.target.closest('.zoom-inner')) closeZoom();
  });
  document.body.appendChild(zoomEl);
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeZoom(); });

// ── home ────────────────────────────────────────────────────────────
function home() {
  const fan = ['cinderling', 'memory-diver', 'something-beneath'].map((id) => cardHTML(BY_ID[id], { cls: 'anim' })).join('');
  view.innerHTML = `
    <section class="hero">
      <div class="kicker">${esc(SET.week)}</div>
      <h1>THE COLLECTIVE</h1>
      <div class="sub">${esc(SET.title)}</div>
      <p class="pitch">Everyone gets the same 90 cards. Build the best 30, then find out who read the cards best.</p>
    </section>
    <div class="fan">${fan}</div>
    <div class="home-actions">
      <a class="btn primary" href="#/cards">See all 90 cards</a>
      <a class="btn" href="#/decks">Build a deck</a>
      <a class="btn" href="#/rules">How to play</a>
    </div>
    <div class="notice"><div>⚔</div><div><b>Practice now</b> against the bot on the Play tab. Online games with friends (1v1 or three-way) arrive on Thursday.</div></div>
    <div class="sect-title"><h3>Five factions</h3></div>
    <div class="factions-list">${FACTION_ORDER.map((f) => `
      <div class="faction-item">${factionCoin(f)}<div><b>${FACTIONS[f].name}</b><div>${esc(FACTIONS[f].blurb)}</div></div></div>`).join('')}
    </div>`;
  view.onclick = (e) => {
    const c = e.target.closest('.card[data-id]');
    if (c) openZoom(c.dataset.id);
  };
}

// ── gallery ─────────────────────────────────────────────────────────
const galleryState = { f: 'all', t: 'all' };
function gallery() {
  const render = () => {
    const list = CARDS.filter((c) => matches(c, galleryState));
    view.innerHTML = `
      ${chipsHTML(galleryState)}
      <p class="count-line">${list.length} card${list.length === 1 ? '' : 's'} · everyone has 2 copies of each</p>
      <div class="grid">${list.map((c) => cardHTML(c)).join('')}</div>`;
  };
  render();
  view.onclick = (e) => {
    const chip = e.target.closest('.chip');
    if (chip) {
      if (chip.dataset.f) galleryState.f = chip.dataset.f;
      if (chip.dataset.t) galleryState.t = chip.dataset.t;
      return render();
    }
    const c = e.target.closest('.card[data-id]');
    if (c) openZoom(c.dataset.id);
  };
}

// ── deck list ───────────────────────────────────────────────────────
function deckCardHTML(d, activeId) {
  const fs = [...Decks.factionsOf(d.counts)];
  const v = Decks.validate(d.counts);
  const sp = Decks.split(d.counts);
  const badge = d.id === activeId ? '<span class="badge">In use</span>'
    : v.ok ? '' : `<span class="badge bad">${Decks.total(d.counts)}/30</span>`;
  return `<a class="deck-card${d.id === activeId ? ' active' : ''}" href="#/deck/${encodeURIComponent(d.id)}">
      <div class="deck-coins">${fs.map(factionCoin).join('') || '<span class="fac-slot-empty"></span>'}</div>
      <div><div class="deck-name">${esc(d.name)}</div>
        <div class="deck-meta">${d.pitch ? esc(d.pitch) : `${sp.creatures} creatures · ${sp.spells} spells`}</div></div>
      ${badge}
    </a>`;
}

function deckList() {
  const mine = Decks.loadDecks();
  const active = Decks.getActiveId();
  view.innerHTML = `
    <div class="sect-title"><h2>Your decks</h2><button class="btn small primary" data-act="new">New deck</button></div>
    ${mine.length ? `<div class="deck-cards">${mine.map((d) => deckCardHTML(d, active)).join('')}</div>`
      : '<p class="muted">No decks yet. Start from scratch, or open a starter deck and change it.</p>'}
    <div class="sect-title"><h2>Starter decks</h2></div>
    <p class="muted small" style="margin-top:-6px">Ready to play. Changing one saves your own copy.</p>
    <div class="deck-cards">${STARTERS.map((s) => deckCardHTML(s, active)).join('')}</div>
    <div class="sect-title"><h3>Got a deck code?</h3></div>
    <div class="btn-row">
      <input class="name-input" style="flex:1;min-width:0;font-size:18px" id="code-in" placeholder="W1-…" autocapitalize="off" autocomplete="off" spellcheck="false">
      <button class="btn small" data-act="import">Import</button>
    </div>`;
  view.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'new') {
      const d = Decks.newDeck('My deck');
      location.hash = '#/deck/' + d.id;
    } else if (act === 'import') {
      const counts = Decks.decode(document.getElementById('code-in').value);
      if (!counts) return toast("That doesn't look like a deck code.");
      const d = Decks.newDeck('Imported deck', counts);
      location.hash = '#/deck/' + d.id;
    }
  };
}

// ── deck builder ────────────────────────────────────────────────────
const builderState = { mode: 'pool', f: 'all', t: 'all' };
function builder(id) {
  let deck = Decks.getDeck(id);
  if (!deck) { location.hash = '#/decks'; return; }

  // Starters stay pristine: the first change saves a copy and carries on there.
  const change = (cardId, delta) => {
    const counts = { ...deck.counts };
    if (delta > 0) {
      const can = Decks.canAdd(counts, cardId);
      if (!can.ok) { toast(can.reason); return false; }
      counts[cardId] = (counts[cardId] || 0) + 1;
    } else {
      if (!counts[cardId]) return false;
      counts[cardId] -= 1;
      if (!counts[cardId]) delete counts[cardId];
    }
    if (deck.starter) {
      const copy = Decks.newDeck(deck.name + ' (mine)', counts);
      if (Decks.getActiveId() === deck.id) Decks.setActiveId(copy.id);
      deck = copy;
      history.replaceState(null, '', '#/deck/' + copy.id);
      toast('Saved as your own copy.');
    } else {
      deck = Decks.upsertDeck({ ...deck, counts });
    }
    render();
    return true;
  };

  const render = () => {
    const counts = deck.counts;
    const n = Decks.total(counts);
    const fs = Decks.factionsOf(counts);
    const v = Decks.validate(counts);
    const isActive = Decks.getActiveId() === deck.id;
    let body = '';
    if (builderState.mode === 'pool') {
      const list = CARDS.filter((c) => matches(c, builderState));
      body = chipsHTML(builderState) + `<div class="rows">${list.map((c) => {
        const can = Decks.canAdd(counts, c.id);
        const factionBlocked = !can.ok && /factions/.test(can.reason);
        return cardRowHTML(c, counts[c.id] || 0, { blocked: !can.ok }).replace('class="row"', `class="row${factionBlocked && !counts[c.id] ? ' dim' : ''}"`);
      }).join('')}</div>`;
    } else {
      const inDeck = CARDS.filter((c) => counts[c.id]).sort((a, b) => a.cost - b.cost || a.n - b.n);
      const group = (label, cards) => cards.length ? `<div class="group-label">${label} · ${cards.reduce((s, c) => s + counts[c.id], 0)}</div>
        <div class="rows">${cards.map((c) => cardRowHTML(c, counts[c.id], { blocked: !Decks.canAdd(counts, c.id).ok })).join('')}</div>` : '';
      body = (inDeck.length ? group('Creatures', inDeck.filter((c) => c.type === 'creature')) + group('Spells', inDeck.filter((c) => c.type === 'spell'))
        : '<p class="muted">Empty so far. Switch to “All cards” and tap + to add.</p>') + `
        <div class="sect-title"><h3>Deck tools</h3></div>
        <div class="btn-row">
          <button class="btn small${isActive ? '' : ' primary'}" data-act="use" ${v.ok ? '' : 'disabled'}>${isActive ? 'In use for games ✓' : 'Use for games'}</button>
          <button class="btn small" data-act="code">Copy deck code</button>
          ${deck.starter ? '' : '<button class="btn small danger" data-act="delete">Delete deck</button>'}
        </div>
        <p class="muted small">Deck code: <code>${Decks.encode(counts)}</code></p>`;
    }
    view.innerHTML = `
      <div class="builder-head">
        ${deck.starter ? `<div class="deck-name" style="font-size:22px">${esc(deck.name)}</div><div class="muted small">Starter deck · changes save your own copy</div>`
          : `<input class="name-input" id="deck-name" value="${esc(deck.name)}" maxlength="40" aria-label="Deck name">`}
        <div class="stats-line">
          <div class="big-count${n === RULES.deckSize ? ' full' : ''}">${n}<small>/${RULES.deckSize}</small></div>
          <div class="fac-slots" title="Factions used (max ${RULES.maxFactions})">${factionSlots(fs)}</div>
          ${curveHTML(counts)}
        </div>
        ${v.ok ? '' : `<div class="warn">${v.errors.map(esc).join(' ')}</div>`}
        <div class="seg">
          <button data-mode="pool" class="${builderState.mode === 'pool' ? 'on' : ''}">All cards</button>
          <button data-mode="deck" class="${builderState.mode === 'deck' ? 'on' : ''}">This deck (${n})</button>
        </div>
      </div>
      ${body}`;
    const nameIn = document.getElementById('deck-name');
    if (nameIn) nameIn.onchange = () => { deck = Decks.upsertDeck({ ...deck, name: nameIn.value.trim() || 'My deck' }); };
  };
  render();

  view.onclick = async (e) => {
    const t = e.target;
    const mode = t.closest('[data-mode]')?.dataset.mode;
    if (mode) { builderState.mode = mode; return render(); }
    const chip = t.closest('.chip');
    if (chip) {
      if (chip.dataset.f) builderState.f = chip.dataset.f;
      if (chip.dataset.t) builderState.t = chip.dataset.t;
      return render();
    }
    const act = t.closest('[data-act]')?.dataset.act;
    const row = t.closest('.row');
    if ((act === 'plus' || act === 'minus') && row) { change(row.dataset.id, act === 'plus' ? 1 : -1); return; }
    if (act === 'use') { Decks.setActiveId(deck.id); toast('This deck will be used for games.'); return render(); }
    if (act === 'code') {
      const code = Decks.encode(deck.counts);
      try { await navigator.clipboard.writeText(code); toast('Copied ' + code); } catch { toast(code); }
      return;
    }
    if (act === 'delete') {
      if (t.dataset.confirm !== '1') { t.dataset.confirm = '1'; t.textContent = 'Tap again to delete'; return; }
      Decks.deleteDeck(deck.id);
      location.hash = '#/decks';
      return;
    }
    if (row) openZoom(row.dataset.id, { get counts() { return deck.counts; }, change });
  };
}

// ── rules ───────────────────────────────────────────────────────────
function rules() {
  view.innerHTML = `<article class="rules-page">
    <h2>The idea</h2>
    <p>Every player gets the <b>same 90 cards</b>: 45 different cards, two copies of each. Before you play, you build a deck of exactly <b>30</b>. Everyone is solving the same puzzle. The fun is finding combinations nobody else spotted, and guessing what your friends will bring.</p>

    <h2>Winning</h2>
    <p>Everyone starts with <b>${RULES.startLife} Life</b>. Bring a player to 0 and they are out. Last player standing wins.</p>

    <h2>Setting up</h2>
    <p>Shuffle your 30 cards and draw ${RULES.openingHand}. Don't like your hand? You may shuffle it back and draw ${RULES.openingHand} new cards, once. A random player goes first; that player skips their first draw, and everyone else starts with a free <b>Spark</b> card (gain 1 Energy this turn).</p>

    <h2>Your turn</h2>
    <ol>
      <li><b>Energy.</b> Your maximum Energy goes up by 1 (up to ${RULES.maxEnergy}) and refills completely. Turn one you have 1, turn two you have 2, and so on.</li>
      <li><b>Draw</b> a card.</li>
      <li><b>Play cards and attack</b>, in any order. Pay a card's cost in Energy to play it. Creatures stay on the table; Spells happen once and go to your discard pile.</li>
      <li><b>End your turn.</b> All damage on creatures heals.</li>
    </ol>

    <h2>Attacking</h2>
    <p>Each of your creatures can attack once per turn, but not on the turn it arrived (unless it has <b>Rush</b>). You pick the target: an opponent, or one of their creatures. Nobody blocks; that is what <b>Guard</b> is for.</p>
    <ul>
      <li><b>Attack a player:</b> they lose Life equal to your creature's Power.</li>
      <li><b>Attack a creature:</b> both hit each other at the same time, each dealing damage equal to its Power. A creature dies when the damage on it reaches its Vitality.</li>
    </ul>

    <h2>Reading a card</h2>
    <div class="anatomy">${cardHTML(BY_ID['cinderling'])}
      <ol>
        <li><b>Name</b> and <b>Energy cost</b> (the hexagon).</li>
        <li><b>Type</b> and <b>faction</b> (the coin).</li>
        <li><b>Rules</b>: what it does. Italic text is just flavour.</li>
        <li><b>Power / Vitality</b>: damage it deals / damage it can take.</li>
      </ol>
    </div>

    <h2>Keywords</h2>
    <dl>${Object.values(KEYWORDS).map((k) => `<dt>${k.name}</dt><dd>${esc(k.text)}</dd>`).join('')}</dl>

    <h2>Building a deck</h2>
    <ul>
      <li>Exactly <b>${RULES.deckSize} cards</b>, at most <b>${RULES.maxCopies} copies</b> of any card.</li>
      <li>At most <b>${RULES.maxFactions} factions</b>. Two-faction cards count as both.</li>
      <li>Between games, you may swap cards with the 60 you left out.</li>
      <li>Not sure? Use a <a href="#/decks">starter deck</a> and change it later.</li>
    </ul>

    <h2>Three players</h2>
    <p>Free-for-all: you may attack either opponent. "Each opponent" hits both. Guard only protects its owner. Last player standing wins.</p>

    <details class="fine"><summary>Fine print</summary>
      <ul>
        <li>At most ${RULES.boardMax} creatures each, and at most ${RULES.handMax} cards in hand (extra draws go to the discard pile).</li>
        <li>If you must draw from an empty deck, you lose ${RULES.emptyDeckDamage} Life instead.</li>
        <li>"Permanently" lasts until the creature leaves play. "This turn" ends when the turn ends.</li>
        <li>Awaken also counts boosts that last one turn.</li>
        <li>Tokens (Spirits, Spark) vanish when they would leave play.</li>
        <li>A card played with Echo is removed from the game when it would go to the discard pile.</li>
        <li>Funeral Pyre: the sacrificed creature's Last Breath happens twice in total.</li>
        <li>Countercurrent: the player casting into it sees the trap and chooses to pay 2 more or let the Spell be canceled (its cost is still spent).</li>
        <li>Phoenix of the Last Spark: during your next turn, tap it in your discard pile to pay 2 and return it to your hand.</li>
        <li>Damage to a player is the same as losing Life.</li>
      </ul>
    </details>
  </article>`;
  view.onclick = (e) => {
    const c = e.target.closest('.card[data-id]');
    if (c) openZoom(c.dataset.id);
  };
}

// ── play ────────────────────────────────────────────────────────────
function play() {
  playPage(view);
}

// ── router ──────────────────────────────────────────────────────────
const ROUTES = { '': home, cards: gallery, decks: deckList, deck: builder, rules, play };

function route() {
  const [path = '', arg] = location.hash.replace(/^#\/?/, '').split('/');
  closeZoom();
  (ROUTES[path] || home)(arg ? decodeURIComponent(arg) : undefined);
  const tab = path === 'deck' ? 'decks' : (ROUTES[path] ? path : '') || 'home';
  document.querySelectorAll('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === tab));
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
const params = new URLSearchParams(location.search);
if (params.has('demo')) demo(params);
else autoRejoin();
// an invite link (?room=CODE) opens the Play tab with the code filled in
if (params.has('room') && !location.hash.startsWith('#/play')) location.hash = '#/play';

// expose for quick debugging in the console
window.collective = { BY_ID, CARDS, TOKENS, Decks };
