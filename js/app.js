// The Collective — app shell: hash router and the non-game views
// (home, card gallery, deck list, deckbuilder, rules).

import { BY_ID, CARDS, FACTIONS, FACTION_ORDER, KEYWORDS, RULES, SET, STARTERS, TOKENS, isTrick } from './cards.js';
import { cardBackHTML, cardHTML, cardRowHTML, esc, factionCoin } from './render.js';
import * as Decks from './decks.js';
import { autoRejoin, demo, playPage, startTutorial } from './game-ui.js';

const view = document.getElementById('view');

// ── small helpers ───────────────────────────────────────────────────
// The pages below Home start with a back chevron and their title.
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const backLink = (href = '#/', label = 'Home') => `<a class="back" href="${href}" aria-label="${label}">${BACK}</a>`;
const pageHead = (title, extra = '') => `<header class="pagehead">${backLink()}<h2>${title}</h2>${extra}</header>`;

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
  const tchips = [['all', 'Any type'], ['creature', 'Creatures'], ['spell', 'Spells'], ['trick', 'Tricks'], ['relic', 'Relics'], ['legendary', 'Legendary']];
  return `<div class="chips">${fchips.map(([k, label]) =>
      `<button class="chip${state.f === k ? ' on' : ''}" data-f="${k}">${FACTIONS[k] ? factionCoin(k) : ''}${label}</button>`).join('')}</div>
    <div class="chips">${tchips.map(([k, label]) =>
      `<button class="chip${state.t === k ? ' on' : ''}" data-t="${k}">${label}</button>`).join('')}${opts.extra || ''}</div>`;
}

function matches(card, state) {
  const okF = state.f === 'all' || (state.f === 'multi' ? card.factions.length > 1 : card.factions.includes(state.f));
  const okT = state.t === 'all' || (state.t === 'trick' ? isTrick(card) : state.t === 'legendary' ? !!card.legendary : card.type === state.t);
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
  if (card.ability && !kwSeen.has('ability')) { kwSeen.add('ability'); kwList.push('ability'); }
  const notes = [];
  if (/Spirit/.test(card.text)) notes.push('<b>Spirit</b> — a 1/1 Radiant creature token. Tokens vanish if they leave play.');
  if (/Fish/.test(card.text)) notes.push('<b>Fish</b> — it loses everything it had. If it leaves play it turns back into its old self.');
  if (/exhaust/i.test(card.text)) notes.push('<b>Exhausted</b> — tilted sideways: it can\u2019t attack or block until it readies at the start of its controller\u2019s turn.');

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
            </div>` : `<span class="muted small">Everyone owns one</span>`}
        </div>
        ${deckCtx && !can.ok && n < RULES.maxCopies ? `<div class="zoom-note">${esc(can.reason)}</div>` : ''}
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

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeZoom(); homeMenu(false); } });

// ── home ────────────────────────────────────────────────────────────
// One screen: the title, three cards, and two buttons within thumb reach.
// Cards, Decks and Rules sit behind the quiet ☰ in the corner.
const ICONS = {
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="7" y="3" width="12" height="16" rx="1.6"/><path d="M5 6.5v12.2A1.8 1.8 0 0 0 6.8 20.5H15"/></svg>',
  decks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3 3.5 7.5 12 12l8.5-4.5z"/><path d="m3.5 12 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/></svg>',
  rules: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M8.5 8h7M8.5 11.5h5"/></svg>',
};

function homeMenu(open) {
  const menu = document.getElementById('home-menu');
  if (!menu) return;
  menu.hidden = !open;
  document.querySelector('.menu-btn')?.setAttribute('aria-expanded', String(open));
}

function home() {
  const fan = ['ashmaw', 'seraphine', 'the-barrow-queen'].map((id) => cardHTML(BY_ID[id], { cls: 'anim' })).join('');
  view.innerHTML = `
    <button class="menu-btn" data-act="menu" aria-label="Menu" aria-expanded="false" aria-controls="home-menu">${ICONS.menu}</button>
    <div class="home">
      <div class="home-show">
        <section class="hero">
          <div class="kicker">${esc(SET.week)}</div>
          <h1>THE COLLECTIVE</h1>
          <div class="sub">${esc(SET.title)}</div>
        </section>
        <div class="fan">${fan}</div>
      </div>
      <div class="home-actions">
        <button class="btn primary" data-act="tutorial">Learn to play</button>
        <a class="btn" href="#/play">Play</a>
      </div>
    </div>
    <div class="menu" id="home-menu" hidden>
      <nav class="menu-in" aria-label="More">
        <a href="#/cards">${ICONS.cards}All 90 cards</a>
        <a href="#/decks">${ICONS.decks}Decks</a>
        <a href="#/rules">${ICONS.rules}Rules</a>
      </nav>
    </div>`;
  view.onclick = (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'menu') { homeMenu(document.getElementById('home-menu').hidden); return; }
    if (e.target.closest('#home-menu')) { if (!e.target.closest('a')) homeMenu(false); return; } // a tap beside the menu closes it
    if (act === 'tutorial') { startTutorial(); return; }
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
      ${pageHead('Cards')}
      ${chipsHTML(galleryState)}
      <p class="count-line">${list.length} card${list.length === 1 ? '' : 's'} · everyone owns one of each</p>
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
    ${pageHead('Your decks', '<button class="btn small primary" data-act="new">New deck</button>')}
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
      body = (inDeck.length ? group('Creatures', inDeck.filter((c) => c.type === 'creature')) + group('Spells', inDeck.filter((c) => c.type === 'spell')) + group('Relics', inDeck.filter((c) => c.type === 'relic'))
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
        <div class="bh-top">${backLink('#/decks', 'Decks')}
          ${deck.starter ? `<div class="bh-name"><div class="deck-name" style="font-size:22px">${esc(deck.name)}</div><div class="muted small">Starter deck · changes save your own copy</div></div>`
            : `<input class="name-input" id="deck-name" value="${esc(deck.name)}" maxlength="40" aria-label="Deck name">`}
        </div>
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
  view.innerHTML = `${pageHead('Rules')}<article class="rules-page">
    <div class="notice" style="margin-bottom:8px"><div>▶</div><div>Rather learn by doing? <button class="btn small primary" data-act="tutorial" style="margin-left:6px">Play the guided lesson</button></div></div>
    <h2>The idea</h2>
    <p>Every player owns the <b>same 90 cards</b>, one of each. Before you play, you build a deck of exactly <b>30</b>. Everyone is solving the same puzzle. The fun is finding combinations nobody else spotted, and guessing what your friends will bring.</p>

    <h2>Winning</h2>
    <p>Everyone starts with <b>${RULES.startLife} Life</b>. Bring a player to 0 and they are out. Last player standing wins.</p>

    <h2>Setting up</h2>
    <p>Shuffle your 30 cards and draw ${RULES.openingHand}. Don't like your hand? You may shuffle it back and draw ${RULES.openingHand} new cards, once. A random player goes first; that player skips their first draw, and everyone else starts with a free <b>Spark</b> card (gain 1 Energy).</p>

    <h2>Your turn</h2>
    <ol>
      <li><b>Ready.</b> Your exhausted creatures stand back up. Your maximum Energy goes up by 1 (up to ${RULES.maxEnergy}) and refills.</li>
      <li><b>Draw</b> a card.</li>
      <li><b>Play cards</b>: pay a card's cost in Energy. Creatures and Relics stay on the table; Spells happen once.</li>
      <li><b>Attack</b>, once, with as many creatures as you like (see below). You can still play cards afterwards.</li>
      <li><b>End your turn.</b> Damage on creatures heals and "this turn" effects end.</li>
    </ol>
    <p>Energy you don't spend stays until your next turn: keep some back to answer with a <b>Trick</b> when someone attacks you.</p>

    <h2>Attacking and blocking</h2>
    <ul>
      <li>Choose an opponent and any of your ready creatures. A creature can't attack on the turn it arrived, unless it has <b>Rush</b>.</li>
      <li>Attacking <b>exhausts</b> a creature (it tilts): it can't block until your next turn. So every attack is a choice: hit now, or stay home to defend.</li>
      <li>The defender chooses <b>blockers</b>: each of their ready creatures can stop one attacker. Creatures with <b>Soar</b> can only be blocked by <b>Soar</b> or <b>Reach</b>.</li>
      <li><b>Teaming up.</b> Several creatures can block the same attacker. They all hit it, and it splits its damage among them, destroying the costliest ones it can.</li>
      <li>Then both sides may play <b>Tricks</b> and use <b>abilities</b>, attacker first, back and forth until both are done.</li>
      <li><b>Damage.</b> A blocked attacker and its blocker hit each other, each dealing its Power; a creature dies when the damage reaches its Vitality. Unblocked attackers hit the player. A blocked attacker never hits the player (unless it has <b>Overrun</b>), even if its blocker is gone.</li>
    </ul>

    <h2>⚡ Abilities</h2>
    <p>Some creatures say <b>“Pay 2 Energy: …”</b>. Pay the Energy and it happens. Each ability works <b>once each turn</b>, whenever you could play a Trick: on your own turn, or during a fight you are in. On the table, tap the ⚡ chip on the creature; it glows gold when you can use it.</p>

    <h2>Kinds of cards</h2>
    <ul>
      <li><b>Creatures</b> fight for you.</li>
      <li><b>Spells</b> happen once, on your turn.</li>
      <li><b>Tricks</b> are Spells you can also play in the middle of a fight, even on someone else's turn.</li>
      <li><b>Traps</b> are set face-down on your turn and spring by themselves when their moment comes.</li>
      <li><b>Relics</b> stay on the table and keep working. They never fight. At most ${RULES.relicMax} each.</li>
      <li><b>Legendary</b> cards are the big ones, with a shimmering frame.</li>
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
      <li>Exactly <b>${RULES.deckSize} cards</b>; you own one of each, so no repeats.</li>
      <li>At most <b>${RULES.maxFactions} factions</b>. Two-faction cards count as both.</li>
      <li>Between games, you may swap cards with the 60 you left out.</li>
      <li>Not sure? Use a <a href="#/decks">starter deck</a> and change it later.</li>
    </ul>

    <h2>Three players</h2>
    <p>Free-for-all. Each attack goes at one opponent of your choice, and only that player blocks. "Each opponent" hits both. Last player standing wins.</p>
    <p><b>👑 The Crown.</b> Nobody has it at the start. The first player to hit an opponent in a fight takes it. Whoever holds the Crown draws an extra card at the end of each of their turns, and anyone who hits them in a fight takes it from them. If the holder is knocked out, the Crown goes to whoever's turn it is.</p>

    <details class="fine"><summary>Fine print</summary>
      <ul>
        <li>At most ${RULES.boardMax} creatures each, and at most ${RULES.handMax} cards in hand (extra draws go to the discard pile).</li>
        <li>If you must draw from an empty deck, you lose ${RULES.emptyDeckDamage} Life instead.</li>
        <li>"Permanently" lasts until the creature leaves play. "This turn" ends when the turn ends.</li>
        <li>Swift: a Swift creature deals its damage first; if that kills the other creature, it takes nothing back.</li>
        <li>Guard: one Guard creature can block two attackers and deals its full Power to each. Other creatures can join either block.</li>
        <li>Teaming up: the attacker destroys its blockers one at a time, the costliest first, skipping any it can't finish. Leftover damage lands on the next blocker; with Overrun it goes to the player once every blocker has had enough.</li>
        <li>Hunt: the hunted creature must block that attacker if it can (if it is exhausted, it can't).</li>
        <li>Venom with Overrun: 1 damage is enough for the blocker; the rest goes through.</li>
        <li>Awaken also counts boosts that last one turn.</li>
        <li>Tokens (Spirits, Spark) vanish when they would leave play. A creature turned into a Fish, or a Tidal Mimic copying something, turns back into itself when it leaves play.</li>
        <li>Creatures you take with Mutiny go back at the end of the turn. Creatures you take for good (Nerissa, The Barrow Queen) still go to their owner's discard pile when they die.</li>
        <li>A card played with Echo is removed from the game when it would go to the discard pile.</li>
        <li>Funeral Pyre: the sacrificed creature's Last Breath happens twice in total.</li>
        <li>Countercurrent: the player casting into it sees the trap and chooses to pay 2 more or let the Spell be canceled (its cost is still spent).</li>
        <li>Phoenix of the Last Spark: during your next turn, tap it in your discard pile to pay 2 and return it to your hand.</li>
        <li>Damage to a player is the same as losing Life.</li>
      </ul>
    </details>
  </article>`;
  view.onclick = (e) => {
    if (e.target.closest('[data-act="tutorial"]')) { startTutorial(); return; }
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
  document.body.dataset.page = path && ROUTES[path] ? path : 'home';
  (ROUTES[path] || home)(arg ? decodeURIComponent(arg) : undefined);
  window.scrollTo(0, 0);
  document.body.classList.remove('scrolled');
}

window.addEventListener('hashchange', route);
// A page's title bar gets its backdrop once the page scrolls under it.
window.addEventListener('scroll', () => document.body.classList.toggle('scrolled', window.scrollY > 4), { passive: true });
route();
const params = new URLSearchParams(location.search);
if (params.has('demo')) demo(params);
else autoRejoin();
// an invite link (?room=CODE) opens the Play tab with the code filled in
if (params.has('room') && !location.hash.startsWith('#/play')) location.hash = '#/play';

// expose for quick debugging in the console
window.collective = { BY_ID, CARDS, TOKENS, Decks };
