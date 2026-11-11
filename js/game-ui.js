// The table: practice games against the bot (online games reuse it).
// Drag a card from your hand onto the table to play it (or tap it, then
// Play). Attacking, blocking and the Tricks before a fight each have a screen
// of their own over the table (decideHTML): tap Attack, then the creatures
// that attack; when someone attacks you, tap a creature of yours (and, with
// several attackers, the one it blocks). Every move is animated on the old
// table first (cards flying in, lunges, hits, deaths), then the table is
// redrawn and everything glides into place.

import { BY_ID, KEYWORDS, RULES, STARTERS, ULTRA_KEYWORDS, ULTRA_STARTERS, ULTRA_V, ULTRA_V2, isTrick } from './cards.js';
import { abilityNeeds, actor, apply, blockLimit, canAttack, canBlock, champLevel, check, costOf, xpAt, fuseCost, stageNeeds, forcedBlocks, hasKw, helpers, living, needs, newGame, opponents, phoenixReady, playOptions, power, replay, ultraV2, unstableClock, useOptions, vitality } from './engine.js';
import { chooseAction, LEVELS, levelOf, levelMove } from './ai.js';
import { artTag, cardBackHTML, cardHTML, esc, factionCoin, factionVars } from './render.js';
import * as FX from './fx.js';
import * as Decks from './decks.js';
import * as Net from './net.js';
import * as Draft from './draft-ui.js';
import { keepAwake } from './awake.js';
import { TUTORIAL, botAction, matches } from './tutorial.js';
import * as St from './stats.js';
import * as Rating from './rating.js';
import * as Ins from './insights.js';
import * as Fight from './fightview.js';
import * as Push from './push.js';
import * as Mode from './mode.js';

const SAVE = 'collective.practice.v2';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch { return null; } },
  set(v) { try { localStorage.setItem(SAVE, JSON.stringify(v)); } catch { /* fine without */ } },
  clear() { try { localStorage.removeItem(SAVE); } catch { /* fine */ } },
};
const SPEED_KEY = 'collective.fast';
const fastOn = () => { try { return localStorage.getItem(SPEED_KEY) === '1'; } catch { return false; } };
// The first SATTC Ultra game on this phone starts with what's different (ultraIntroHTML).
const ULTRA_INTRO = 'collective.ultraIntro';
let ultraIntroSeen = (() => { try { return localStorage.getItem(ULTRA_INTRO) === '1'; } catch { return false; } })();
// ...and the first game of Ultra's second version, for a phone that saw the first intro: what's new (ultraNewHTML)
// (with the growth cap on there is more to tell, under a key of its own: a phone that saw the first list sees this once more)
// (and with version 4's six decks, once more)
const ULTRA_INTRO2 = ULTRA_V >= 5 ? 'collective.ultraIntro5' : ULTRA_V >= 4 ? 'collective.ultraIntro4' : ULTRA_V2.growthCap ? 'collective.ultraIntro3' : 'collective.ultraIntro2';
let ultraNewSeen = (() => { try { return localStorage.getItem(ULTRA_INTRO2) === '1'; } catch { return false; } })();
const SPEEDS = { normal: 1, fast: 1.7 };
FX.setSpeed(fastOn() ? SPEEDS.fast : SPEEDS.normal);

const ICON = {
  heart: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.6 4.5c2.2 0 3.6 1.3 4.4 2.5.8-1.2 2.2-2.5 4.4-2.5 3.6 0 5.7 3.8 4.2 7.2C19.5 16.4 12 21 12 21z"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="5" width="11" height="15" rx="1.5"/><path d="M9 3h9.5A1.5 1.5 0 0 1 20 4.5V17"/></svg>',
  deck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M9 8h6M9 12h6"/></svg>',
  trap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>',
  crown: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 7.5l4.6 4 4.4-7 4.4 7 4.6-4-1.9 11H4.9z"/><rect x="4.9" y="19.6" width="14.2" height="2.2" rx=".6"/></svg>',
  bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.2 1.5 4.5 13.6h6.3L9 22.5l10.5-12.9h-6.4z"/></svg>',
};
// Energy is drawn in the bronze hexagon a card's cost sits in, so what you have
// and what a card costs look alike (players took a ⚡ and the hexagon for two things).
const enHex = (n) => `<span class="en-hex"><b>${n}</b></span>`;
const COLORS = { ember: '#ff7a2e', verdant: '#b4e06a', tide: '#8fe0ee', umbral: '#b07cff', radiant: '#ffd77a' };
const colorOf = (cid) => COLORS[BY_ID[cid]?.factions[0]] || '#ffd77a';

let G = null; // the game being shown

// For performance checks from the console or a test script. botMove() has
// the bot make this phone's move, if it is this phone's move (whole games
// in tests).
if (typeof window !== 'undefined') {
  window.collectiveDebug = {
    redraw: () => redraw(), get G() { return G; },
    botMove: () => (!!G && !G.busy && G.state.phase !== 'over' && actor(G.state) === G.me && dispatch(chooseAction(G.state, G.me, { noise: 0.4 }))),
    move: (a) => (!!G && !G.busy && G.state.phase !== 'over' && dispatch(a)),
  };
}

// ── play page ───────────────────────────────────────────────────────
// Friends first (a new game for 2 or 3 players, or join one by its code),
// then Bots (1 or 2, or draft a deck against them). Few words, one screen.
// Your decks and the starters that fit a game's rules (SATTC Ultra or the standard game).
const startersFor = (ultra) => (ultra ? ULTRA_STARTERS : STARTERS);
function deckChoices(ultra = Mode.ultra()) {
  const mine = Decks.loadDecks().filter((d) => Decks.validate(d.counts, { ultra }).ok).map((d) => ({ id: d.id, name: d.name, counts: d.counts }));
  return [...mine, ...startersFor(ultra).map((d) => ({ id: d.id, name: `${d.name} (starter)`, counts: d.counts }))];
}

// ── online lobby ────────────────────────────────────────────────────
let L = null; // { code, info, unsub } while in a room
let playView = null;
// The Play page's switches and its "Decks" list, kept while the page redraws.
const PF = { draftNight: false, botDraft: false, decksOpen: false, champions: (() => { try { return localStorage.getItem('collective.champions') !== '0'; } catch { return true; } })(),
  level: (() => { try { return levelOf(localStorage.getItem('collective.botLevel')).id; } catch { return 'practice'; } })() };
const BACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';

function deckSelect(id, choices, chosen) {
  return `<select id="${id}" class="select">${choices.map((d) => `<option value="${esc(d.id)}"${d.id === chosen ? ' selected' : ''}>${esc(d.name)}</option>`).join('')}</select>`;
}

// 🔔 "It's your turn" alerts (js/push.js), for games that go on while the phones are put away.
function alertsHTML() {
  switch (Push.status()) {
    case 'off': return '<button class="btn small" data-act="alerts-on">🔔 Alert me when it’s my turn</button><p class="muted small pp-alerts">Alerts also bring friends’ invites: one tap and you’re in their game.</p>';
    case 'on': return '<p class="muted small pp-alerts">🔔 Alerts are on: this phone hears when it’s your turn. <button class="btn small ghost" data-act="alerts-off">Turn off</button></p>';
    case 'home': return '<p class="muted small pp-alerts">🔔 For “your turn” alerts, open the game from its Home Screen icon.</p>';
    case 'blocked': return '<p class="muted small pp-alerts">🔔 Alerts are turned off for this game in the iPhone’s Settings → Notifications.</p>';
    default: return ''; // not set up, or a phone that can't
  }
}

async function alertsTap(on) {
  const code = G?.mode === 'online' ? G.code : L?.code;
  const seat = G?.mode === 'online' ? G.me : (L?.info?.players || []).findIndex((p) => p && p.id === Net.clientId());
  const st = on ? await Push.turnOn(code, seat) : await Push.turnOff(code);
  flash(st === 'on' ? 'Alerts on: you’ll hear when it’s your turn.' : st === 'blocked' ? 'Alerts weren’t allowed. Settings → Notifications can turn them on.' : 'Alerts off.');
}

// 🔔 Invites: a link can't open the Home Screen app on an iPhone, but an alert
// can. One tap wakes the players of this phone's last rooms (those with alerts
// on), and a tap on their alert brings them straight into this room (acceptInvite).
function inviteHTML() {
  const info = L?.info;
  if (!info || info.status !== 'lobby' || !Push.enabled()) return '';
  const here = new Set((info.players || []).filter(Boolean).map((p) => p.id));
  if (here.size >= info.seats) return '';
  if (L.invited) return `<p class="muted small pp-alerts">🔔 Invited ${esc(listNames(L.invited))}: a tap on the alert brings them here.</p>`;
  const who = (L.invitees || []).filter((p) => !here.has(p.id)).map((p) => p.name);
  return who.length ? `<button class="btn" data-act="invite">🔔 Invite ${esc(listNames(who))}</button>` : '';
}

function onlinePanelHTML(choices, chosen) {
  if (!Net.isConfigured()) return '<div class="pp-in"><h3>Friends</h3><p class="muted small" style="margin:0">Online play is not set up yet.</p></div>';
  if (L && L.info) {
    if (L.info.draft) { // Draft night has its own lobby; until the draft starts, the host can still switch the rules
      const host = L.info.host === Net.clientId(), drafted = !!L.info.draft.id, ultra = drafted ? !!L.info.draft.ultra : !!L.info.ultra;
      // (the host's switch goes with the draft's own switch; everyone else sees which rules it is)
      const note = ultra ? '<p class="muted small ultra-note">This room plays <b>SATTC Ultra</b>.</p>' : '';
      const rules = host && L.info.status === 'lobby' && !drafted
        ? `<label class="dr-switch mini"><input type="checkbox" id="room-ultra"${ultra ? ' checked' : ''}><span class="dr-knob" aria-hidden="true"></span><span class="dr-switch-text"><b>SATTC Ultra</b>: the draft deals Ultra’s cards</span></label>` : '';
      return Draft.roomPanelHTML(L.code, L.info, (rules ? '' : note) + inviteHTML() + tonightHTML(), rules);
    }
    const info = L.info;
    const meSeat = (info.players || []).findIndex((p) => p && p.id === Net.clientId());
    const host = info.host === Net.clientId();
    const seats = Array.from({ length: info.seats }, (_, i) => {
      const p = info.players?.[i];
      if (!p) return `<div class="deck-card"><span class="fac-slot-empty"></span><div class="muted">Waiting for a player…</div><span></span></div>`;
      const counts = Decks.decode(p.deck) || {};
      const fs = [...Decks.factionsOf(counts)];
      return `<div class="deck-card${i === meSeat ? ' active' : ''}"><div class="deck-coins">${fs.map(factionCoin).join('')}</div>
        <div><div class="deck-name">${esc(p.name)}${i === meSeat ? ' (you)' : ''}</div><div class="deck-meta">${p.id === info.host ? 'Host · ' : ''}${Decks.total(counts)} cards</div></div><span></span></div>`;
    }).join('');
    const full = (info.players || []).length === info.seats;
    const link = `${location.origin}${location.pathname}?room=${L.code}`;
    const myDeck = info.players?.[meSeat]?.deck;
    // the room's rules decide which decks fit (the host's switch, not this phone's)
    choices = deckChoices(!!info.ultra);
    const current = choices.find((d) => Decks.encode(d.counts) === myDeck)?.id || choices[0].id;
    const misfits = (info.players || []).filter((p) => p && !Decks.validate(Decks.decode(p.deck) || {}, { ultra: !!info.ultra }).ok);
    const mineMisfit = misfits.some((p) => p.id === Net.clientId());
    const hostName = (info.players || []).find((p) => p && p.id === info.host)?.name || 'The host';
    const odd = Net.otherVersions(info);
    const next = info.status === 'playing' ? '<button class="btn primary" data-act="rejoin-table">Back to the table</button>'
      : host && odd.length ? '<button class="btn primary" disabled>Reload every phone first</button>'
        : host && misfits.length ? `<button class="btn primary" disabled>${misfits.length === 1 && misfits[0].id !== Net.clientId() ? `Waiting for ${esc(misfits[0].name)} to pick a deck` : 'Every deck has to fit the rules first'}</button>`
        : host ? `<button class="btn primary" data-act="start" ${full ? '' : 'disabled'}>${full ? `Start game ${(info.round || 0) + 1}` : 'Waiting for everyone to join'}</button>`
          : `<p class="muted small pp-wait">${esc(hostName)} starts the game.</p>`;
    return `<div class="pp-in">
      <div class="pp-title"><h3>Game <b>${esc(L.code)}</b>${info.ultra ? ' <i class="ultra-pill">Ultra</i>' : ''}</h3><button class="btn small" data-act="copy-link" data-link="${esc(link)}">Copy invite link</button></div>
      ${inviteHTML()}
      ${tonightHTML()}
      <div class="deck-cards">${seats}</div>
      ${Draft.versionNoteHTML(info)}
      ${host && info.status === 'lobby' ? Draft.modeSwitchHTML(false) : ''}
      ${info.status === 'lobby' ? `<label class="dr-switch mini"><input type="checkbox" id="room-champions"${info.champions ? ' checked' : ''}${host ? '' : ' disabled'}><span class="dr-knob" aria-hidden="true"></span><span class="dr-switch-text"><b>Champions</b> (new)${host ? '' : ': the host decides'}</span></label>` : ''}
      ${info.status === 'lobby' ? `<label class="dr-switch mini"><input type="checkbox" id="room-ultra"${info.ultra ? ' checked' : ''}${host ? '' : ' disabled'}><span class="dr-knob" aria-hidden="true"></span><span class="dr-switch-text"><b>SATTC Ultra</b>${host ? '' : ': the host decides'}</span></label>` : ''}
      <div class="pp-group"><label class="pp-row"><span>Deck</span>${deckSelect('room-deck', choices, current)}</label></div>
      ${mineMisfit ? `<p class="small pp-misfit">Your deck doesn’t fit ${info.ultra ? 'SATTC Ultra' : 'the standard game'}: pick one above.</p>` : ''}
      ${next}
      ${alertsHTML()}
      <button class="btn ghost" data-act="leave-room">Leave this game</button>
    </div>`;
  }
  const code = Net.cleanCode(new URLSearchParams(location.search).get('room')) || '';
  const last = Net.lastRoom();
  const btn = (lead) => `btn${lead ? ' primary' : ''}`; // opened from an invite link, Join leads
  return `<div class="pp-in">
    <h3>Friends</h3>
    <div class="pp-group">
      <label class="pp-row"><span>Name</span><input id="my-name" maxlength="16" value="${esc(Net.myName())}" placeholder="Your name" autocomplete="off" autocapitalize="words" spellcheck="false" enterkeyhint="done"></label>
      ${Draft.createSwitchHTML(PF.draftNight)}
      <label class="pp-row" id="net-deck-row"${PF.draftNight ? ' hidden' : ''}><span>Deck</span>${deckSelect('net-deck', choices, chosen)}</label>
    </div>
    <div class="pp-label">New game</div>
    <div class="pp-two">
      <button class="${btn(!code)}" data-act="create" data-seats="2">2 players</button>
      <button class="${btn(!code)}" data-act="create" data-seats="3">3 players</button>
    </div>
    <div class="pp-two">
      <input id="join-code" class="pp-code" maxlength="4" placeholder="CODE" value="${esc(code)}" aria-label="Game code" autocomplete="off" autocapitalize="characters" spellcheck="false" enterkeyhint="go">
      <button class="${btn(code)}" data-act="join">Join</button>
    </div>
    ${last && !code ? `<button class="btn small ghost pp-rejoin" data-act="rejoin" data-code="${esc(last)}">Rejoin game ${esc(last)}</button>` : ''}
  </div>`;
}

function botsPanelHTML(choices, chosen) {
  const saved = store.get();
  const draft = Draft.savedPractice();
  const x = (act) => `<button class="btn ghost pp-x" data-act="${act}" aria-label="Throw it away">✕</button>`;
  return `<div class="pp-in">
    <h3>Bots</h3>
    ${saved && !saved.over ? `<div class="pp-resume"><button class="btn primary" data-act="resume">Resume your game</button>${x('forget')}</div>` : ''}
    ${draft ? `<div class="pp-resume"><button class="btn primary" data-act="draft-resume">${draft.done ? 'Your drafted deck' : `Resume your draft · ${draft.picks}/${draft.of}`}</button>${x('draft-forget')}</div>` : ''}
    ${(() => { const R = Rating.myRating(St.loadGames()); return `<div class="pp-rating muted small">${R.n ? `Your rating: <b>${Rating.ratingText(R)}</b> · ${esc(Rating.nearLevel(R.r))}` : 'Finish a game against the bots to get your rating.'}</div>`; })()}
    <div class="pp-group pp-level"><label class="pp-row"><span>Level</span><select id="bot-level" class="select">${LEVELS.map((L) => `<option value="${L.id}"${L.id === PF.level ? ' selected' : ''}>${esc(L.name)}${L.elo ? ` · Elo ${L.elo}` : ''}</option>`).join('')}</select></label></div>
    <div class="pp-two">
      <button class="btn" data-act="bots" data-n="1">1 bot</button>
      <button class="btn" data-act="bots" data-n="2">2 bots</button>
    </div>
    <div class="pp-opts">
      <label class="dr-switch mini"><input type="checkbox" id="bot-draft"${PF.botDraft ? ' checked' : ''}><span class="dr-knob" aria-hidden="true"></span><span class="dr-switch-text"><b>Draft my deck</b></span></label>
      ${Mode.ultra() ? '' : `<label class="dr-switch mini"><input type="checkbox" id="champions-practice"${PF.champions ? ' checked' : ''}><span class="dr-knob" aria-hidden="true"></span><span class="dr-switch-text"><b>Champions</b> (new)</span></label>`}
      <button class="pp-more" data-act="decks" aria-expanded="${PF.decksOpen}" aria-controls="bot-decks"${PF.botDraft ? ' hidden' : ''}>Decks<i>${PF.decksOpen ? '▴' : '▾'}</i></button>
    </div>
    <div class="pp-group" id="bot-decks"${PF.decksOpen && !PF.botDraft ? '' : ' hidden'}>
      <label class="pp-row"><span>You</span>${deckSelect('my-deck', choices, chosen)}</label>
      <label class="pp-row"><span>Bots</span><select id="bot-deck" class="select"><option value="random">Random starter decks</option>
        ${startersFor(Mode.ultra()).map((d) => `<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></label>
    </div>
  </div>`;
}

// Tonight in this room (every game's result, from every phone), and the
// way back into the review of your last game here.
function tonightHTML() {
  if (!L) return '';
  const meName = (L.info?.players || []).find((p) => p && p.id === Net.clientId())?.name || Net.myName();
  const last = L.lastRec ? `<button class="btn small ghost tn-last" data-act="last-review">Your last game: the bot’s review${L.lastRec.review?.acc != null ? ` · ${L.lastRec.review.acc}%` : ''} ›</button>` : '';
  return Ins.tonightHTML(L.results, meName, last) || last;
}

function watchTonight(info) {
  if (!L || L.resFor === info?.created || !info?.created) return;
  L.resUnsub?.();
  L.resFor = info.created;
  const room = L;
  Net.watchResults(L.code, info.created, (results) => {
    if (L !== room) return;
    L.results = results;
    if (playView && location.hash === '#/play' && !G) playPage(playView);
    if (G && G.mode === 'online' && G.state.phase === 'over') redraw();
  }).then((unsub) => { if (L === room) room.resUnsub = unsub; else unsub(); }, (e) => console.warn(e));
}

async function enterRoom(code) {
  if (L?.unsub) L.unsub();
  L?.resUnsub?.();
  L = { code, info: null, unsub: null };
  keepAwake('room', true);
  Push.joinRoom(code);
  L.unsub = await Net.watchRoom(code, (info) => {
    if (!L || L.code !== code) return;
    L.info = info;
    // my seat says which version this phone runs now (it may have reloaded onto a newer one)
    const mine = info?.players?.find((p) => p && p.id === Net.clientId());
    if (mine && mine.v !== Net.version() && !L.marking) { L.marking = true; Net.markVersion(code).catch(() => {}).finally(() => { if (L) L.marking = false; }); }
    Draft.onRoomInfo(code, info, () => { if (playView && location.hash === '#/play' && !G) playPage(playView); });
    if (!info) { flash('That game no longer exists.'); Net.setLastRoom(''); exitRoom(); return; }
    watchTonight(info);
    if (info.status === 'lobby' && !L.invitees && Push.enabled()) {
      L.invitees = [];
      Net.invitees(code).then((who) => { if (L?.code !== code) return; L.invitees = who; if (playView && location.hash === '#/play' && !G) playPage(playView); }, () => {});
    }
    const seat = (info.players || []).findIndex((p) => p && p.id === Net.clientId());
    if (seat < 0 && info.status !== 'lobby') { Net.setLastRoom(''); exitRoom(); return; }
    if (info.status === 'playing' && seat >= 0 && !(G && G.mode === 'online' && G.round === info.round)) beginOnline(info, seat);
    if (info.status === 'lobby' && G && G.mode === 'online') { leave(); }
    if (playView && location.hash === '#/play' && !G) playPage(playView);
  });
}

// A tapped invite (sw.js, Push.takeInvite): straight into that room, with this
// phone's name and deck. No name yet: the Play page, with the code filled in.
export async function acceptInvite(code) {
  code = Net.cleanCode(code);
  if (code.length !== 4 || !Net.isConfigured()) return;
  if (!Net.myName()) { location.href = `${location.pathname}?room=${code}#/play`; return; }
  if (L?.code !== code) {
    try {
      const choices = deckChoices();
      const deck = choices.find((d) => d.id === Decks.getActiveId()) || choices[0];
      await Net.joinRoom(code, { name: Net.myName(), deck: Decks.encode(deck.counts) });
    } catch (e) { flash(e.message || String(e)); return; }
    if (G?.mode === 'online') leave();
    exitRoom();
    await enterRoom(code).catch((e) => flash(e.message || String(e)));
  }
  if (location.hash !== '#/play') location.hash = '#/play';
  flash(`You’re in game ${code}.`);
}

// On start-up, go straight back into a game this phone was part of
// (iPhones reload pages that have been in the background a while).
export async function autoRejoin() {
  const code = Net.lastRoom();
  if (!code || !Net.isConfigured() || L) return;
  try { await enterRoom(code); } catch { /* offline: the Rejoin button is still there */ }
}

function exitRoom() {
  if (L?.unsub) L.unsub();
  L?.resUnsub?.();
  L = null;
  keepAwake('room', false);
  if (playView && location.hash === '#/play' && !G) playPage(playView);
}

async function onlineAct(act, el, choices) {
  const deckOf = (id) => choices.find((d) => d.id === document.getElementById(id)?.value);
  try {
    if (act === 'create' || act === 'join' || act === 'rejoin') {
      const name = (document.getElementById('my-name')?.value || '').trim() || Net.myName();
      if (!name) { flash('Type your name first.'); document.getElementById('my-name')?.focus(); return; }
      Net.setMyName(name);
      const deck = deckOf('net-deck');
      const dcode = Decks.encode(deck.counts);
      if (act === 'create') { const code = await Net.createRoom({ seats: Number(el.dataset.seats), name, deck: dcode, draft: !!document.getElementById('draft-new')?.checked, ultra: Mode.ultra() }); await enterRoom(code); }
      else {
        const code = act === 'rejoin' ? el.dataset.code : Net.cleanCode(document.getElementById('join-code').value);
        if (code.length !== 4) { flash('Game codes have four letters.'); return; }
        await Net.joinRoom(code, { name, deck: dcode });
        await enterRoom(code);
      }
    }
    if (act === 'start') {
      if (L.info?.draft) await Draft.beforeStart(L.code, L.info); // drafted decks, not the picker's
      else await Net.setDeck(L.code, Decks.encode(deckOf('room-deck').counts));
      await Net.startGame(L.code);
      const me = (L.info?.players || []).findIndex((p) => p && p.id === Net.clientId());
      (L.info?.players || []).forEach((p, i) => { if (p && i !== me) Push.notify(L.code, i, me, 'start'); });
    }
    if (act === 'leave-room') { const code = L.code; Draft.leaveRoom(); exitRoom(); await Net.leaveLobby(code); } // stop watching first, so leaving isn't reported as the game vanishing
    if (act === 'rejoin-table') { const seat = L.info.players.findIndex((p) => p.id === Net.clientId()); beginOnline(L.info, seat); }
    if (act === 'copy-link') { try { await navigator.clipboard.writeText(el.dataset.link); flash('Invite link copied.'); } catch { flash(el.dataset.link); } }
    if (act === 'invite') {
      el.disabled = true;
      const r = await Push.invite(L.code);
      if (r.sent) { L.invited = r.names; flash(`Invited ${listNames(r.names)}.`); } else flash(r.why === 'just sent' ? 'The invites just went out.' : 'No one could be invited: their alerts are off.');
      if (playView && location.hash === '#/play' && !G) playPage(playView);
    }
  } catch (e) { flash(e.message || String(e)); }
}

export function playPage(view) {
  playView = view;
  const choices = deckChoices();
  const active = Decks.getActiveId();
  const chosen = choices.find((d) => d.id === active) ? active : choices[0].id;
  view.innerHTML = `
    <header class="pagehead"><a class="back" href="#/" aria-label="Home">${BACK}</a><h2>Play${Mode.ultra() ? ' <i class="ultra-pill">Ultra</i>' : ''}</h2></header>
    <section class="panel pp">${onlinePanelHTML(choices, chosen)}</section>
    <section class="panel pp">${botsPanelHTML(choices, chosen)}</section>`;
  // "Draft my deck" brings no deck, so it hides the deck choice
  const showDecks = () => {
    const more = view.querySelector('[data-act="decks"]');
    more.hidden = PF.botDraft;
    more.setAttribute('aria-expanded', String(PF.decksOpen));
    more.querySelector('i').textContent = PF.decksOpen ? '▴' : '▾';
    document.getElementById('bot-decks').hidden = PF.botDraft || !PF.decksOpen;
  };
  view.onchange = (e) => {
    const t = e.target;
    if (t.id === 'draft-new') { PF.draftNight = t.checked; document.getElementById('net-deck-row').hidden = t.checked; return; }
    if (t.id === 'bot-draft') { PF.botDraft = t.checked; showDecks(); return; }
    if (t.id === 'champions-practice') { PF.champions = t.checked; try { localStorage.setItem('collective.champions', t.checked ? '1' : '0'); } catch { /* fine */ } return; }
    if (t.id === 'bot-level') { PF.level = levelOf(t.value).id; try { localStorage.setItem('collective.botLevel', PF.level); } catch { /* fine */ } return; }
    if (t.id === 'room-champions') { if (L) Net.setChampions(L.code, t.checked).catch((err) => flash(err.message)); return; }
    if (t.id === 'room-ultra') { if (L) Net.setUltra(L.code, t.checked).catch((err) => flash(err.message)); return; }
    if (t.id !== 'room-deck' || !L) return;
    const d = deckChoices(!!L.info?.ultra).find((x) => x.id === t.value);
    Net.setDeck(L.code, Decks.encode(d.counts)).then(() => flash(`${d.name.replace(/ \(starter\)$/, '')} is your deck for the next game.`), (err) => flash(err.message));
  };
  view.onkeydown = (e) => {
    if (e.key === 'Enter' && e.target.id === 'join-code') { e.preventDefault(); onlineAct('join', e.target, choices); }
  };
  view.onclick = (e) => {
    const el = e.target.closest('[data-act]');
    const act = el?.dataset.act;
    if (!act) return;
    // ✕ beside a saved game or draft: the second tap throws it away
    if ((act === 'forget' || act === 'draft-forget') && !el.classList.contains('armed')) {
      el.classList.add('armed');
      el.textContent = 'Throw away?';
      setTimeout(() => { if (el.isConnected) { el.classList.remove('armed'); el.textContent = '✕'; } }, 3000);
      return;
    }
    if (['create', 'join', 'rejoin', 'start', 'leave-room', 'rejoin-table', 'copy-link', 'invite'].includes(act)) { onlineAct(act, el, choices); return; }
    if (act === 'alerts-on' || act === 'alerts-off') { alertsTap(act === 'alerts-on').catch((er) => flash(er.message)).finally(() => playPage(view)); return; }
    if (act === 'last-review') { if (L?.lastRec) Ins.openSheet(Ins.reviewHTML(L.lastRec)); return; }
    const ctx = { play: startPractice, refresh: () => playPage(view), code: L?.code, ultra: !!L?.info?.ultra };
    if (act === 'bots') {
      if (PF.botDraft) { Draft.onPlayAct('draft-practice', el, ctx); return; } // data-n is the number of bots
      const mine = choices.find((d) => d.id === document.getElementById('my-deck').value);
      startPractice(mine, pickBots(Number(el.dataset.n), document.getElementById('bot-deck').value, mine));
      return;
    }
    if (act === 'decks') { PF.decksOpen = !PF.decksOpen; showDecks(); return; }
    if (act.startsWith('draft-')) { Draft.onPlayAct(act, el, ctx); return; }
    if (act === 'resume') resume();
    if (act === 'forget') { store.clear(); playPage(view); }
  };
}

// Bots get different starters, and not yours if there is a choice.
function pickBots(n, which, mine) {
  const starters = startersFor(Mode.ultra());
  if (which !== 'random') return Array.from({ length: n }, () => starters.find((d) => d.id === which) || starters[0]);
  const pool = [...starters].filter((d) => d.id !== mine?.id).sort(() => Math.random() - 0.5);
  return pool.slice(0, n);
}

// `ultra`: the rules a drafted deck was dealt under (otherwise Home's switch; an
// Ultra deck always plays Ultra). Ultra games go without Champions for now.
function startPractice(mine, bots, { ultra } = {}) {
  ultra = ultra ?? (Mode.ultra() || [mine, ...bots].some((d) => Decks.isUltraDeck(d.counts)));
  const players = [{ name: 'You', deck: Decks.cardList(mine.counts) },
    ...bots.map((d) => ({ name: `Bot · ${d.name}`, deck: Decks.cardList(d.counts) }))];
  const setup = { seed: (Math.random() * 2 ** 31) | 0, players, startEnergy: RULES.startEnergy, deckClock: true, champions: PF.champions && !ultra, ultra: ultra ? ULTRA_V : false };
  begin({ mode: 'practice', setup, actions: [], me: 0, bots: bots.map((_, i) => i + 1), level: PF.level });
}

// ── the guided first game ───────────────────────────────────────────
// Both opening hands are kept automatically; the coach takes it from there.
export function startTutorial() {
  begin({
    mode: 'tutorial', setup: TUTORIAL.setup, me: 0, bots: [1], tut: { i: 0, done: false },
    actions: [{ t: 'mulligan', p: 0, redraw: false }, { t: 'mulligan', p: 1, redraw: false }],
  });
}

const tutDoneKey = 'collective.tutorialDone';

// The current lesson step, or null outside the lesson.
const tutStep = () => (G && G.mode === 'tutorial' && G.tut && !G.tut.done ? TUTORIAL.steps[G.tut.i] : null);

function tutAdvance() {
  G.tut.i++;
  if (G.tut.i >= TUTORIAL.steps.length) {
    G.tut.done = true;
    try { localStorage.setItem(tutDoneKey, '1'); } catch { /* fine */ }
  }
  redraw();
  schedule();
}

// The bot's scripted lesson moves, one at a time so they can be followed.
async function runBotScript(st) {
  for (const m of st.bot) {
    if (!G || tutStep() !== st) return;
    commit(botAction(G.state, 1, m));
    await G.chain;
    await FX.wait(500);
  }
  if (G && tutStep() === st) tutAdvance();
}

// The coach box floats over the table (placeCoach). The gold line along its top
// is how far through the lesson you are; Next is the button at the bottom
// right, and ☰ has Skip the lesson.
function coachHTML(st) {
  const n = G.tut.i + 1, total = TUTORIAL.steps.length;
  return `<div class="coach${st.bot ? ' coach-wait' : ''}" data-key="coach" data-step="${n}" style="--done: ${Math.round((n / total) * 100)}%">
    <div class="coach-text">${esc(st.say)}</div>
  </div>`;
}

// The middle strip of the table is often shorter than the coach box (on many
// phones it was cut off, and read by scrolling inside it), so the box floats
// over the table instead: in the middle when it fits there, otherwise spilling
// onto the rows next to it where it covers the fewest creatures, and never
// over what it is talking about (the gold rings) or a fight in the middle.
function placeCoach(root) {
  const box = root.querySelector('.g-table > .coach'), st = tutStep();
  if (!box || !st) return;
  const table = box.parentElement, T = table.getBoundingClientRect();
  const span = (el) => { const r = el.getBoundingClientRect(); return [r.top - T.top, r.bottom - T.top]; };
  // (what the step rings, whether or not the rings are showing: a card's big view hides them)
  const talksAbout = (el) => (st.show || []).some((sel) => el.matches(sel) || el.querySelector(sel));
  const hard = [], soft = [];
  for (const el of table.querySelectorAll('.g-side .tc-row, .g-side .pbar')) {
    if (talksAbout(el)) hard.push(span(el));
    else if (el.children.length) soft.push(span(el));
  }
  for (const el of table.querySelectorAll('.g-battle, .g-say > *')) hard.push(span(el));
  const mid = span(table.querySelector('.g-mid'));
  const h = box.offsetHeight;
  const want = (mid[0] + mid[1] - h) / 2;
  const over = (y, [a, b]) => Math.max(0, Math.min(y + h, b) - Math.max(y, a));
  let best = want, least = Infinity;
  for (let y = 4; y <= Math.max(4, T.height - h - 4); y += 2) {
    let cost = Math.abs(y - want);
    for (const r of hard) cost += 1000 * over(y, r);
    for (const r of soft) cost += 10 * over(y, r);
    if (cost < least) { least = cost; best = y; }
  }
  box.style.top = `${Math.round(best)}px`;
  if (box.sizes) return;
  // the first time it goes straight there; from then on it glides
  requestAnimationFrame(() => { box.style.transition = 'top .3s ease'; });
  // the text's font arriving late, or the phone turning, changes the sizes
  box.sizes = new ResizeObserver(() => { if (box.isConnected && G) placeCoach(root); });
  box.sizes.observe(box);
  box.sizes.observe(table);
}

// ?demo=<seed>&moves=<n>&bots=<1|2>: bots play every seat for n moves, then
// hand you the position. For screenshots and quick checks.
export function demo(params) {
  const seed = Number(params.get('demo')) || 1;
  const nBots = Number(params.get('bots')) || 1;
  const moves = Number(params.get('moves')) || 24;
  const starters = startersFor(params.get('ultra') === '1');
  const decks = [starters[1], starters[4], starters[0]];
  const players = [{ name: 'You', deck: Decks.cardList(decks[0].counts) },
    ...decks.slice(1, 1 + nBots).map((d) => ({ name: `Bot · ${d.name}`, deck: Decks.cardList(d.counts) }))];
  const setup = { seed, players, startEnergy: RULES.startEnergy, deckClock: true, champions: params.get('champions') === '1', ultra: params.get('ultra') === '1' ? ULTRA_V : false };
  let s = newGame(setup);
  const actions = [];
  for (let k = 0; s.phase !== 'over' && (k < moves || actor(s) !== 0 || s.phase !== 'main'); k++) {
    if (k > moves + 300) break;
    const p = s.phase === 'mulligan' ? s.players.findIndex((P) => !P.mull) : actor(s);
    const a = chooseAction(s, p, { noise: 0 });
    s = apply(s, a).state;
    actions.push(a);
  }
  begin({ mode: 'practice', setup, actions, me: 0, bots: players.slice(1).map((_, i) => i + 1) });
}

function resume() {
  const saved = store.get();
  if (saved) begin(saved);
}

function mount() {
  let root = document.getElementById('game');
  if (!root) {
    root = document.createElement('div');
    root.id = 'game';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
    FX.setStage(root);
    // Drag a hand card up onto the table to play it.
    FX.drag(root, {
      selector: '.tc-hand > .tcard',
      enabled: (el) => !!G && !G.busy && !G.flow && !G.sheet && !playable(Number(el.dataset.uid), fromFor(Number(el.dataset.uid))),
      canDrop: (info) => !info.overHand && info.y < info.handRect.top - 24,
      onDrop: (info) => { fuseOver(null); return dropPlay(Number(info.el.dataset.uid), info); },
      onMove: (info) => { const h = hostAt(info.x, info.y); fuseOver(h != null && fuseTargets(Number(info.el.dataset.uid)).includes(h) ? h : null); },
      onBack: () => fuseOver(null),
      // sliding along the hand moves its focal card, which stays where you leave it
      onScrub: (el) => {
        if (!G) return;
        G.peek = Number(el.dataset.uid);
        for (const c of el.parentElement.children) c.classList.toggle('peek', c === el);
      },
    });
    // Your hand, big: swipe sideways to move along it.
    root.addEventListener('pointerdown', viewerSwipe);
    // Three players: swipe sideways across the opponent at the top for the other one.
    root.addEventListener('pointerdown', focusSwipe);
    // On the attack and block screens: hold a card to read it.
    root.addEventListener('pointerdown', holdToRead);
    root.addEventListener('contextmenu', (e) => { if (e.target.closest?.('.dec-c, .tcard, .hv-card')) e.preventDefault(); });
    // Drag from your creature to aim: at an opponent to attack, at an attacker to block it.
    FX.dragArrow(root, {
      selector: '.g-side.me .tcard',
      enabled: (el) => !!G && !G.busy && !G.flow && !G.sheet && aimTargets(Number(el.dataset.uid)).length > 0,
      targets: (el) => aimTargets(Number(el.dataset.uid)),
      onDrop: (toEl, fromEl) => { if (toEl) aimDrop(Number(fromEl.dataset.uid), toEl); },
    });
  }
  document.body.classList.add('in-game');
  keepAwake('game', true);
  return root;
}

function begin(rec) {
  clearTimeout(G?.timer);
  endGate?.(false);
  const state = replay(rec.setup, rec.actions);
  state.events = [];
  G = { ...rec, bots: new Set(rec.bots), state, view: state, lastShown: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
  noteGameOver();
  mount();
  redraw();
  schedule();
}

// An online game: the seed and decks come from the room, the moves from
// the shared move list. Nothing is applied locally until it is in the list.
function beginOnline(info, seat) {
  const round = info.round;
  // (every phone in a game runs the same version, so they agree on the rules: see G.stale)
  const setup = { seed: info.seeds[round], players: info.players.map((p) => ({ name: p.name, deck: Decks.cardList(Decks.decode(p.deck) || {}) })), startEnergy: RULES.startEnergy, deckClock: true, champions: !!info.champions, ultra: (info.draft?.id ? info.draft.ultra : info.ultra) ? ULTRA_V : false };
  clearTimeout(G?.timer);
  G?.unsubActions?.();
  endGate?.(false);
  const state = newGame(setup);
  state.events = [];
  G = { mode: 'online', code: L.code, created: info.created || 0, round, setup, actions: [], me: seat, bots: new Set(), state, view: state, lastShown: state, flow: null, atk: null, blk: null, sheet: null, timer: null, busy: false, chain: Promise.resolve(), sched: 0 };
  // a game remembers the version it started with: on another one this phone would not see the same game
  G.stale = !!info.v && info.v !== Net.version();
  mount();
  redraw();
  watchSeen(true);
  Net.watchActions(L.code, round, (actions, atEnd) => {
    if (!G || G.mode !== 'online' || G.round !== round) return;
    if (atEnd && actions.length === G.actions.length + 1) {
      const r = apply(G.state, actions[actions.length - 1]);
      if (!r.error) { G.state = r.state; G.actions = actions; show(r.state.events, actions[actions.length - 1]); return; }
    }
    G.state = replay(setup, actions);
    G.state.events = [];
    G.actions = actions;
    show([]);
  }).then((unsub) => { if (G && G.round === round) G.unsubActions = unsub; else unsub(); });
}

// Leave the table (a practice game stays saved and can be resumed;
// an online game carries on and you can go back to it from Play).
function leave(goTo = '#/play') {
  clearTimeout(G?.timer);
  if (G?.mode === 'online' && Push.enabled()) { watchSeen(false); Net.markSeen(G.code, false).catch(() => {}); }
  G?.unsubActions?.();
  endGate?.(false);
  if (G && G.mode === 'practice' && G.state.phase === 'over') store.clear();
  else if (G && G.mode === 'practice') { const sv = store.get(); if (sv) store.set({ ...sv, left: true }); } // (left on purpose: no going back in by itself)
  G = null;
  keepAwake('game', false);
  document.getElementById('game')?.remove();
  document.getElementById('fx-layer')?.replaceChildren();
  document.body.classList.remove('in-game');
  if (location.hash === goTo) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = goTo;
}

function save() {
  if (G.mode !== 'practice') return;
  store.set({ mode: G.mode, setup: G.setup, actions: G.actions, me: G.me, bots: [...G.bots], over: G.state.phase === 'over', takebacks: G.takebacks || 0, level: G.level, at: Date.now() });
}

// On start-up, straight back into a practice game the app was in the middle of
// (an iPhone may close a page in the background, or when it runs short of
// memory, and open it afresh: a white flash, then the home screen). Not a game
// you left on purpose, or one from more than 20 minutes ago (Resume on the
// Play page still has it). True if it went back in.
export function autoResume() {
  const saved = store.get();
  if (!saved || saved.over || saved.left || !saved.at || Date.now() - saved.at > 20 * 60000 || G) return false;
  if (!['', '#', '#/', '#/play'].includes(location.hash)) return false; // (a page opened on purpose stays open)
  if (location.hash !== '#/play') location.hash = '#/play';
  begin(saved);
  return true;
}

// ── a finished game goes into Insights ──────────────────────────────
// Counted at once (stats.js), saved on this phone, and in an online room
// also summed up for tonight's scoreboard; then the bot reviews your moves
// in the background and the end screen fills in its tip.
function noteGameOver() {
  if (!G || G.rec || G.mode === 'tutorial' || G.state.phase !== 'over') return;
  let rec;
  try { rec = St.analyzeGame(G.setup, G.actions, { me: G.me }); } catch (e) { console.error(e); return; }
  Object.assign(rec, {
    id: G.mode === 'online' ? `o:${G.code}:${G.created || 0}:${G.round}` : `p:${G.setup.seed}`,
    at: Date.now(), mode: G.mode === 'online' ? 'online' : 'practice', takebacks: G.takebacks || 0,
    ...(G.mode === 'practice' ? { level: levelOf(G.level).id } : {}), // (the bots' difficulty level)
    play: { setup: G.setup, actions: G.actions }, // (only the newest games keep it: stats.js saveGame)
  });
  G.rec = rec;
  St.saveGame(rec);
  if (G.mode === 'online' && L && L.code === G.code) L.lastRec = rec;
  if (G.mode === 'online' && G.created) Net.sendResult(G.code, G.created, G.round, St.roomResult(rec)).catch((e) => console.warn(e));
  if (G.mode !== 'online') {
    const vs = St.summarize(St.loadGames(), [], 'bots');
    // (and what this game did to your rating: rating.js)
    const R = Rating.myRating(St.loadGames()), h = R.history.find((x) => x.id === rec.id);
    const rated = h ? `Rating ${Rating.ratingText(R)} (${h.change >= 0 ? '+' : '−'}${Math.abs(Math.round(h.change))})` : G.mode === 'practice' && rec.takebacks ? 'Not rated: a move was taken back' : '';
    G.scoreLine = [vs.n > 1 ? `You’re ${vs.w}–${vs.l} against the bots` : '', rated].filter(Boolean).join(' · ');
  }
  const g = G;
  St.reviewPlay(G.setup, G.actions, G.me).then((review) => {
    rec.review = review;
    St.saveGame(rec);
    if (L?.lastRec === rec && playView && location.hash === '#/play' && !G) playPage(playView);
    if (G !== g || G.rec !== rec) return;
    if (G.sheet?.startsWith('<div class="rv">')) G.sheet = Ins.reviewHTML(rec);
    redraw();
  }).catch((e) => console.error(e));
}

// ── moves ───────────────────────────────────────────────────────────
function dispatch(a) {
  if (!G) return false;
  if (G.mode === 'online') {
    const r = apply(G.state, a);
    if (r.error) { flash(r.error); return false; }
    clearSelections();
    Net.sendAction(G.code, G.round, a).then(() => turnAlert(r.state, a), (e) => flash(`Not sent: ${e.message}`));
    return true;
  }
  // In the lesson, your moves must be the one the coach is asking for.
  const st = tutStep();
  let lessonMove = false;
  if (st && a.p === G.me && a.t !== 'concede' && a.t !== 'fix') {
    if (!st.expect) { flash(st.next ? 'Read the box first, then tap Next.' : 'Wait for the bot to finish.'); return false; }
    if (!matches(G.state, a, st.expect)) { flash(`Not quite. ${st.say}`); clearSelections(); redraw(); return false; }
    lessonMove = true;
  }
  if (!commit(a)) return false;
  if (lessonMove) G.chain.then(() => { if (G && tutStep() === st) tutAdvance(); });
  else schedule();
  return true;
}

// Online: a move that leaves the next one to another player wakes their phone
// (js/push.js; nothing if they're looking at the game, or alerts are off).
function turnAlert(s, a) {
  if (!G || G.mode !== 'online' || s.phase === 'over' || s.phase === 'mulligan') return;
  const next = actor(s);
  if (next == null || next === G.me || s.players[next]?.out) return;
  const kind = s.phase === 'combat' && s.combat.step === 'block' && s.combat.d === next ? 'attacked' : a.t === 'end' || a.t === 'mulligan' ? 'turn' : 'move';
  Push.notify(G.code, next, G.me, kind);
}

// Online: while the game is in front of you, your seat says so (and nobody's
// move wakes your phone); put away or left, it doesn't.
let seenTimer = 0;
function markSeen() {
  if (G?.mode === 'online' && Push.enabled()) Net.markSeen(G.code, document.visibilityState === 'visible').catch(() => {});
}
function watchSeen(on) {
  clearInterval(seenTimer);
  if (!on || !Push.enabled()) return;
  markSeen();
  seenTimer = setInterval(markSeen, 15000);
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', markSeen);

// Apply a move locally, remember it, and show it. Returns true if it happened.
function commit(a) {
  const r = apply(G.state, a);
  if (r.error) { flash(r.error); return false; }
  G.actions.push(a);
  G.state = r.state;
  // using an ability while picking attackers keeps the attackers picked
  const atk = a.t === 'use' && G.atk ? G.atk : null;
  clearSelections();
  if (atk) {
    atk.att = atk.att.filter((u) => canAttack(r.state, G.me, r.state.cards[u]));
    if (atk.att.length) G.atk = atk;
  }
  save();
  show(r.state.events, a);
  return true;
}

function clearSelections() {
  if (!G) return;
  G.recap = null;
  G.fightNote = null;
  G.atk = null;
  G.blk = null;
  G.flow = null;
  G.suggest = null;
}

// ── 💡 a suggested move: what the bot would do in your place ────────
// Worked out without the opponents' face-down Traps, so it gives nothing away.
function suggestion() {
  const s = structuredClone(G.state);
  s.events = [];
  for (const Q of s.players) if (Q.i !== G.me) { for (const u of Q.traps) s.cards[u].zone = 'gone'; Q.traps = []; }
  return chooseAction(s, G.me, { noise: 0 });
}

function startSuggest() {
  if (!G || G.busy || !myMove() || tutStep()) return;
  const at = G.state;
  G.suggest = { state: at, thinking: true };
  redraw();
  // let the button press show before the bot thinks (a moment on a slow phone)
  setTimeout(() => {
    if (!G || G.state !== at || !G.suggest) return;
    try {
      const a = suggestion();
      G.suggest = { state: at, a, text: describeMove(at, a), show: suggestRings(at, a) };
      // An attack or a block is set up on the table, so the line under it shows how
      // it would go; you confirm with the usual button (or change it first).
      if (a.t === 'attack') {
        G.atk = { att: [...a.att], hunt: (a.hunt || []).map((h) => [...h]), target: a.target };
        G.suggest.setUp = at.players.length === 2 ? 'Attack' : `Attack ${at.players[a.target].name.replace(/^Bot · /, '')}`;
      }
      if (a.t === 'block' && G.blk) { G.blk.pairs = a.blocks.map((p) => [...p]); G.blk.sel = null; G.suggest.setUp = a.blocks.length ? 'Block' : 'No block'; }
    } catch (e) { console.error(e); G.suggest = null; flash('No suggestion this time.'); }
    redraw();
  }, 40);
}

function describeMove(s, a) {
  const card = (u) => `<b>${esc(BY_ID[s.cards[u].cid].name)}</b>`;
  const who = (p) => (p === G.me ? 'yourself' : `<b>${esc(shortName(s.players[p].name))}</b>`);
  const on = (t) => (!t ? '' : t.p != null ? ` on ${who(t.p)}` : ` on ${card(t.uid)}`);
  switch (a.t) {
    case 'play': {
      if (a.fuse != null) return `Fuse ${card(a.uid)} into ${card(a.fuse)}: it gets its Power, Vitality and keywords for good.`;
      let t = `Play ${a.from === 'legend' ? 'your Legend, ' : ''}${card(a.uid)}${a.from === 'discard' ? ' from your discard pile (Echo)' : ''}`;
      if (a.sac != null) t += `, sacrificing ${card(a.sac)},`;
      if (a.offer != null) t += `, offering ${card(a.offer)},`;
      if (a.fighter != null) t += ` with ${card(a.fighter)} fighting`;
      t += on(a.target);
      if (a.pick != null) t += s.cards[a.uid].cid === 'whispered-doubt' ? `, sending ${card(a.pick)} to the bottom of its owner’s deck` : `, bringing back ${card(a.pick)}`;
      if (a.picks?.length) t += `, getting back ${listNames(a.picks.map(card))}`;
      if (a.targets?.length) t += ` on ${listNames(a.targets.map(card))}`;
      if (a.keep != null) t += `, keeping ${card(a.keep)}`;
      if (a.discard != null) t += `, then discarding ${card(a.discard)}`;
      return `${t}.`;
    }
    case 'attack': {
      const hunt = (a.hunt || []).map(([x, y]) => `${card(x)} hunts ${card(y)}`);
      return `Attack ${who(a.target)} with ${listNames(a.att.map(card))}${hunt.length ? ` (${hunt.join(', ')})` : ''}.`;
    }
    case 'block': {
      if (!a.blocks.length) return 'Don’t block this time: take the hit and keep your creatures.';
      const by = new Map();
      for (const [b, x] of a.blocks) by.set(x, [...(by.get(x) || []), b]);
      return `${[...by].map(([x, bs]) => `${listNames(bs.map(card))} ${bs.length > 1 ? 'block' : 'blocks'} ${card(x)}`).join('; ')}.`;
    }
    case 'pass': return 'Tap <b>Fight</b>: no Trick or ability is worth it here.';
    case 'use': {
      const c = s.cards[a.uid], d = BY_ID[c.cid];
      if (d.stages) {
        const st = d.stages[c.stage];
        let t = `Pay ${st.cost} Energy for stage ${['I', 'II', 'III'][c.stage]} of ${card(a.uid)}: ${esc(st.text.replace(/\.$/, ''))}`;
        if (a.target?.uid != null) t += ` (${card(a.target.uid)})`;
        if (a.pick != null) t += ` (${card(a.pick)})`;
        if (a.picks?.length) t += ` (${listNames(a.picks.map(card))})`;
        return `${t}.`;
      }
      if (c.zone === 'relic') return `Use the ${card(a.uid)}: sacrifice ${card(a.sac)} to draw a card.`;
      if (d.keywords.includes('fuse') && a.target?.uid != null) return a.prey != null
        ? `Pay 1 Energy: ${card(a.uid)} kills ${card(a.prey)}, then fuses into ${card(a.target.uid)}, which keeps its Power, Vitality and keywords.`
        : `Fuse ${card(a.uid)} into ${card(a.target.uid)} (1 Energy): it keeps the Power, Vitality and keywords.`;
      if (a.fighter != null && a.target?.uid != null) return `Use ${card(a.uid)}: ${card(a.fighter)} is made to fight ${card(a.target.uid)}.`;
      return `Use ${card(a.uid)}: ${esc(d.ability.short)}${on(a.target)}.`;
    }
    case 'unhex': return `Pay ${s.cards[a.uid].hex} Energy to break the Hex on ${card(a.uid)}.`;
    case 'phoenix': return 'Pay 2 Energy to bring the Phoenix back to your hand.';
    case 'dig': return `Dig: pay ${ULTRA_V2.digCost} Energy to draw a card.`;
    case 'end': return 'End your turn: nothing else is worth doing right now.';
  }
  return 'Anything goes.';
}

// What to ring for a suggested move: on the table, and on a fight's own screen.
function suggestRings(s, a) {
  const c = (u) => (s.cards[u]?.zone === 'relic' ? `.relic[data-uid="${u}"]` : `.tcard[data-uid="${u}"]:not(.in-hand), .dec-c[data-u="${u}"] > .tcard`);
  const t = (x) => (!x ? [] : x.p != null ? [`.pbar[data-p="${x.p}"]`] : [c(x.uid)]);
  switch (a.t) {
    case 'play': return [a.from === 'discard' ? `.tc-pile[data-pile="${G.me}"]` : `.g-hand .tcard[data-uid="${a.uid}"], .dec-c[data-u="${a.uid}"] > .tcard`, ...t(a.target), ...[a.sac, a.offer, a.fighter, a.fuse, ...(a.targets || [])].filter((u) => u != null).map(c)];
    case 'attack': return [...a.att.map(c), `.pbar[data-p="${a.target}"]`, ...(a.hunt || []).map(([, y]) => c(y))];
    case 'block': return a.blocks.length ? a.blocks.flatMap(([b, x]) => [c(b), c(x)]) : ['.g-go'];
    case 'pass': return ['.g-go'];
    case 'use': return [c(a.uid), ...t(a.target), ...[a.sac, a.prey, a.fighter].filter((u) => u != null).map(c)];
    case 'unhex': return [c(a.uid)];
    case 'phoenix': return ['[data-act="phoenix"]'];
    case 'dig': return ['[data-act="dig"]'];
    case 'end': return ['.g-go'];
  }
  return [];
}

// The 💡 tip. Tapping it puts it away (no "Got it" button).
function suggestHTML() {
  const sg = G.suggest;
  if (!sg || sg.state !== G.state || !myMove()) return '';
  if (sg.thinking) return '<div class="suggest"><span class="suggest-t"><span class="suggest-h">💡 Thinking…</span></span></div>';
  if (sg.setUp) {
    return `<div class="suggest" data-act="suggest-close"><span class="suggest-t"><span class="suggest-h">💡 The bot would:</span> ${sg.text} It’s set up: tap <b>${esc(sg.setUp)}</b> to do it, or change it.</span></div>`;
  }
  return `<div class="suggest" data-act="suggest-close"><span class="suggest-t"><span class="suggest-h">💡 The bot would:</span> ${sg.text}</span>
    <div class="suggest-row"><button class="btn small primary" data-act="suggest-do">Do it</button></div></div>`;
}

// Queue the animation of a move (`a`, when known), then the redraw of the
// position after it. When moves wait for your tap, a phone that was put away
// shows them when it's back; otherwise a hidden page or a pile of moves
// catching up skips straight to the result.
function show(events, a = null) {
  const after = G.state;
  noteGameOver();
  // Remember the table as your turn ended, for "Since your last turn".
  const prev = G.lastShown;
  if (prev && prev.active === G.me && prev.phase !== 'mulligan' && (after.active !== G.me || after.turn !== prev.turn)) {
    G.mark = { turn: prev.turn, life: prev.players.map((P) => P.life), board: prev.players[G.me].board.map((u) => ({ uid: u, name: BY_ID[prev.cards[u].cid].name })) };
  }
  G.lastShown = after;
  G.backlog = (G.backlog || 0) + 1;
  const g = G;
  G.chain = G.chain.then(async () => {
    if (tapThrough() && document.hidden && !g.skipping) await whenVisible();
    if (G !== g) return;
    const quick = document.hidden || (!tapThrough() && G.backlog > 2);
    try { await present(quick ? [] : events || [], after, quick, a); } finally { if (G) G.backlog--; }
  }).catch((e) => console.error(e));
  return G.chain;
}
const whenVisible = () => new Promise((r) => {
  const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); r(); } };
  document.addEventListener('visibilitychange', f);
});
// Animations wait on the screen; never let one hold the game up for long
// (the time a move waits for your tap doesn't count).
function capped(p, ms) {
  let t = 0;
  const cap = new Promise((done) => {
    let left = ms;
    const tick = () => { if (!gates) left -= 250; if (left <= 0) done(); else t = setTimeout(tick, 250); };
    t = setTimeout(tick, 250);
  });
  return Promise.race([p, cap]).finally(() => clearTimeout(t));
}

// ── one move at a time ──────────────────────────────────────────────
// What the other players do waits on the screen until you tap: a card they
// play stays up big, an attack between the other two stays on the table, and
// every fight goes step by step. Nothing goes by too fast or while you look
// away. A line at the bottom says what happened; Skip passes over the rest
// until it's your move. 'collective.tapThrough' = '0' lets it all play by
// itself (the ☰ switch; the older tests).
const tapThrough = () => { try { return localStorage.getItem('collective.tapThrough') !== '0'; } catch { return true; } };
let gates = 0, endGate = null;

function tapToGoOn(line) {
  if (!G || !tapThrough() || G.skipping) return Promise.resolve();
  const g = G;
  endGate?.(false);
  gates++;
  return new Promise((resolve) => {
    const box = document.createElement('div');
    box.className = 'g-beat';
    box.innerHTML = `<div class="g-beat-t">${line}</div><div class="g-beat-row"><span class="g-beat-go">Tap to go on</span><button class="g-beat-skip" type="button">Skip to your move</button></div>`;
    document.body.appendChild(box);
    const t0 = performance.now();
    const finish = (skip) => {
      if (endGate !== finish) return;
      endGate = null;
      removeEventListener('pointerup', up, true);
      removeEventListener('keydown', key, true);
      gates--;
      if (G === g) { G.tapAt = performance.now(); if (skip) G.skipping = G.skipped = true; }
      box.classList.add('going');
      setTimeout(() => box.remove(), 180);
      resolve();
    };
    const up = (e) => {
      if (performance.now() - t0 < 250) return; // a finger still lifting from the last tap
      if (e.target.closest?.('.g-beat-skip')) { finish(true); return; }
      if (e.target.closest?.('[data-act="menu"], .g-sheet')) return; // ☰ works as usual meanwhile
      finish(false);
    };
    const key = (e) => { if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); finish(false); } };
    endGate = finish;
    addEventListener('pointerup', up, true);
    addEventListener('keydown', key, true);
  });
}

// The line under a card another player plays: who, what, and on what.
function playLine(s0, e, d) {
  const by = `<b>${esc(name(e.p))}</b>`;
  if (!d) return `${by} sets a Trap, face down.`;
  const t = e.target;
  let on = '';
  if (t?.p != null) on = ` on ${t.p === G.me ? 'you' : t.p === e.p ? 'themselves' : `<b>${esc(name(t.p))}</b>`}`;
  else if (t?.uid != null && s0.cards[t.uid]) {
    const c = s0.cards[t.uid];
    on = ` on ${c.ctrl === G.me ? 'your' : c.ctrl === e.p ? 'their' : esc(poss(name(c.ctrl)))} <b>${esc(BY_ID[c.cid].name)}</b>`;
  }
  return `${by} plays <b>${esc(d.name)}</b>${on}.`;
}

// The line under another player's move that waits on the new table (their
// cards wait big instead, in animateOld). None when the game waits for you
// next anyway (they attack you; they block your attack) or a fight plays big.
function moveLine(s0, a, events) {
  if (!a || a.p === G.me || events.some((e) => e.k === 'fight')) return '';
  const by = `<b>${esc(name(a.p))}</b>`;
  const card = (u) => `<b>${esc(BY_ID[s0.cards[u]?.cid]?.name || 'a creature')}</b>`;
  switch (a.t) {
    case 'attack': return a.target === G.me ? '' : `${by} attacks <b>${esc(name(a.target))}</b> with ${listNames(a.att.map(card))}.`;
    case 'block': {
      if (s0.combat?.a === G.me) return '';
      if (!a.blocks.length) return `${by} doesn’t block.`;
      const by2 = new Map();
      for (const [b, x] of a.blocks) by2.set(x, [...(by2.get(x) || []), b]);
      return `${by} blocks ${[...by2].map(([x, bs]) => `${card(x)} with ${listNames(bs.map(card))}`).join(', and ')}.`;
    }
    case 'use': {
      const c0 = s0.cards[a.uid], d0 = BY_ID[c0?.cid];
      if (d0?.stages) return `${by} does stage ${['I', 'II', 'III'][c0.stage]} of ${card(a.uid)}: ${esc(d0.stages[c0.stage].text)}`;
      if (d0?.keywords.includes('fuse') && a.target?.uid != null) return a.prey != null ? `${by}’s ${card(a.uid)} kills ${card(a.prey)}, then fuses into ${card(a.target.uid)}.` : `${by} fuses ${card(a.uid)} into ${card(a.target.uid)}.`;
      const ab = d0?.ability;
      return `${by} uses ${card(a.uid)}${ab ? `: ${esc(ab.short)}` : ''}.`;
    }
    case 'unhex': return `${by} pays to break the Hex on ${card(a.uid)}.`;
    case 'phoenix': return `${by} brings the Phoenix back to their hand.`;
    case 'dig': return `${by} pays ${ULTRA_V2.digCost} Energy and digs for a card.`;
  }
  return '';
}

// The bot (or the lesson script) moves once the table has caught up.
function schedule() {
  if (!G) return;
  clearTimeout(G.timer);
  const id = ++G.sched;
  G.chain.then(() => {
    if (!G || G.sched !== id) return;
    const s = G.state;
    if (s.phase === 'over') return;
    const st = tutStep();
    if (st?.bot) { G.timer = setTimeout(() => runBotScript(st), 600); return; }
    if (st) return; // the lesson is waiting for you
    const who = s.phase === 'mulligan'
      ? s.players.find((P) => !P.mull && G.bots.has(P.i))?.i
      : (G.bots.has(actor(s)) ? actor(s) : undefined);
    if (who == null) return;
    const move = () => (G.mode === 'tutorial' ? chooseAction(G.state, who, { noise: 3 }) : levelMove(G.state, who, G.level));
    // when moves wait for your tap the bot needn't leave a gap first (you just tapped); Skip hurries it
    const pace = G.skipping ? 0.05 : tapThrough() ? 0.4 : 1;
    // (a strong level thinks for a moment: the pause before its move counts that time)
    const wait = Math.round((s.phase === 'mulligan' ? 200 : s.phase === 'combat' ? 700 : 950) * pace);
    const think = levelOf(G.level).plan ? 0 : wait;
    G.timer = setTimeout(() => {
      if (!G || G.sched !== id || G.state !== s) return;
      const t0 = Date.now(), a = move();
      const rest = wait - think - (Date.now() - t0);
      if (rest <= 0) { dispatch(a); return; }
      G.timer = setTimeout(() => { if (G && G.sched === id && G.state === s) dispatch(a); }, rest);
    }, think);
  });
}

function undo() {
  let i = G.actions.length - 1;
  while (i >= 0 && G.actions[i].p !== G.me) i--;
  if (i < 0 || G.actions[i].t === 'mulligan') { flash('Nothing to take back.'); return; }
  clearTimeout(G.timer);
  G.actions = G.actions.slice(0, i);
  G.state = replay(G.setup, G.actions);
  G.state.events = [];
  G.view = G.state;
  G.lastShown = G.state;
  G.mark = null;
  G.takebacks = (G.takebacks || 0) + 1;
  G.rec = null;
  clearSelections();
  G.sheet = null;
  save();
  redraw();
  schedule();
}

// ── helpers about the position ──────────────────────────────────────
const S = () => G.view;

// The engine logs in the third person ("Dana plays…"); in practice games
// the human is called "You", so fix the grammar for display.
function speak(text) {
  if (G.state.players[G.me].name !== 'You') return text;
  // Other players' names stay as they are (a deck can be called "You Didn't Need That").
  const names = G.state.players.filter((P) => P.i !== G.me).map((P) => P.name);
  let t = names.reduce((acc, n, k) => acc.split(n).join(`\u0001${k}\u0001`), text);
  if (/\bYou\b/.test(t)) {
    t = t
      .replace(/\bYou's\b/g, 'Your')
      .replace(/\bYou is\b/g, 'You are')
      .replace(/\bYou has\b/g, 'You have')
      .replace(/\bYou goes\b/g, 'You go')
      .replace(/\bYou doesn't\b/g, 'You don’t')
      .replace(/\bYou does\b/g, 'You do')
      .replace(/\bYou passes\b/g, 'You pass')
      .replace(/\b(You|and) (\w+?[^s])s\b/g, (m, w, v) => `${w} ${v}`)
      .replace(/([a-z,;:] )You\b/g, '$1you')
      .replace(/\btheir\b/g, 'your');
  }
  // bots go by their deck's name, and "Everything Dies's turn" reads "Everything Dies’ turn"
  return t.replace(/\u0001(\d+)\u0001('s)?/g, (m, k, s) => (s ? poss(shortName(names[k])) : shortName(names[k])));
}
// Practice bots are called "Bot · <deck>"; on the table they go by the deck's name.
const shortName = (n) => String(n ?? '').replace(/^Bot · /, '');
const poss = (n) => (/s$/.test(n) ? `${n}’` : `${n}’s`);
const name = (p) => shortName(S().players[p].name);
// (Whose move it is, as shown. Input is held back separately while G.busy.)
const myMove = () => actor(S()) === G.me && S().phase !== 'over';
const myMain = () => myMove() && S().phase === 'main';
const fightStep = (step) => S().phase === 'combat' && S().combat.step === step;
const iBlock = () => myMove() && fightStep('block');
const iTrick = () => myMove() && fightStep('tricks');
const attackedThisTurn = () => S().players[G.me].attackedOn === S().turn;
const nameOf = (u) => BY_ID[S().cards[u].cid].name;
const listNames = (ns) => (ns.length < 2 ? ns.join('') : `${ns.slice(0, -1).join(', ')} and ${ns[ns.length - 1]}`);

function playable(uid, from = 'hand') {
  const s = S(), P = s.players[G.me], c = s.cards[uid];
  if (!c) return 'Gone.';
  const d = BY_ID[c.cid];
  if (!myMove()) return actor(s) === G.me ? 'Just a moment…' : 'Wait for your turn.';
  const fusing = fuseTargets(uid).length > 0; // (SATTC Ultra: fused into one of your creatures instead)
  if (s.phase === 'combat' && !isTrick(d) && !d.keywords.includes('ambush')) return fusing ? null : ultraV2(s) && d.type === 'creature' ? 'During a fight, only a creature with Ambush can come in.' : 'During a fight you can only play Tricks.';
  const cost = costOf(s, G.me, c, from);
  if (cost > P.energy) return `Needs ${cost} Energy; you have ${P.energy}.`;
  if (d.type === 'creature' && P.board.length >= RULES.boardMax) return fusing ? null : `You already have ${RULES.boardMax} creatures.`;
  if (d.type === 'relic' && P.relics.length >= RULES.relicMax) return `You already have ${RULES.relicMax} Relics.`;
  if (!playOptions(s, G.me, c, from, 1).length) {
    const n = needs(s, G.me, c, from);
    if (n.sac && !n.sac.length) return 'You need a creature of yours to sacrifice.';
    if (n.fighter && !n.fighter.length) return 'You need a creature of yours to fight with.';
    if (c.cid === 'dawns-judgment') return 'Only when a creature is attacking you.';
    if (n.target && !n.target.length) return 'There is nothing to target.';
    if (n.pick && !n.pick.length) return 'There is nothing in the discard pile it can bring back.';
    if (n.targets && !n.count) return 'You need creatures of your own.';
    return 'You can’t play that right now.';
  }
  return null;
}

// SATTC Ultra: your Legend waits beside your deck. On the table it sits first
// in your hand row (it isn't a card in your hand), and plays like one.
const legendWaiting = (s, pi = G.me) => { const u = s.players[pi].legend; return u != null && s.cards[u]?.zone === 'legend' ? u : null; };
const handRow = (s) => { const L = legendWaiting(s); return L != null ? [L, ...s.players[G.me].hand] : s.players[G.me].hand; };
const fromFor = (u) => (u != null && u === legendWaiting(S()) ? 'legend' : 'hand');
// SATTC Ultra: the creatures of yours a creature card in your hand can be fused into right now.
function fuseTargets(uid) {
  const s = S(), c = s.cards[uid];
  if (!c || !ultraV2(s) || !myMove() || fromFor(uid) !== 'hand' || BY_ID[c.cid].type !== 'creature') return [];
  return playOptions(s, G.me, c, 'hand').filter((a) => a.fuse != null).map((a) => a.fuse);
}
// Can it be played the ordinary way (not fused)?
const plainPlay = (uid, from) => playOptions(S(), G.me, S().cards[uid], from).some((a) => a.fuse == null);

const PROMPTS = {
  'feed-the-flame': ['Sacrifice which of your creatures?', 'Where do the 3 damage go?'],
  'funeral-pyre': ['Sacrifice which of your creatures?', 'Where does the damage go?'],
  'the-mountain-is-angry': [null, 'Which opponent?'],
  'wild-growth': [null, 'Which of your creatures grows +2/+2?'],
  'worldtree-stag': [null, 'Give another creature of yours +2/+2 (or skip).'],
  'not-yet': [null, 'Send which creature or Relic (cost 3 or less) back to its owner’s hand?'],
  'deepwater-leviathan': [null, 'You may return another creature to its owner’s hand.'],
  'death-is-a-door': [null, 'Destroy which creature or Relic?'],
  'apex-predator': [null, 'Apex Predator fights which creature?'],
  'we-grow-together': [null, null, 'Choose your creatures to grow +1/+2.'],
  scorch: [null, 'Scorch which creature (2 damage)?'],
  'ember-volley': [null, null, 'Ember Volley: choose the enemy creatures (1 damage each).'],
  shackles: [null, 'Shackle which enemy creature?'],
  'menders-hymn': [null, 'Heal which of your creatures?'],
  'ward-of-dawn': [null, 'Which of your creatures gets a Shield?'],
  'aegis-acolyte': [null, 'Give which of your creatures a Shield?'],
  kindle: [null, 'Which of your creatures gets +2 Power and Swift?'],
  mutiny: [null, 'Take which enemy creature until the end of the turn?'],
  'sudden-growth': [null, 'Which of your creatures gets +3/+3?'],
  'savage-clash': ['Which of your creatures fights?', 'Fight which enemy creature?'],
  'grove-druid': [null, 'Destroy a Relic? (Skip to raise your maximum Energy instead.)'],
  'sea-change': [null, 'Turn which creature into a Fish?'],
  'tidal-mimic': [null, 'Copy which creature? (or skip)'],
  nerissa: [null, 'Take which enemy creature for good? (cost 4 or less, or skip)'],
  'kiss-of-night': [null, 'Which of your creatures gets Venom and Drain?'],
  bastion: [null, 'Which of your creatures gets +1/+3?'],
  crescendo: [null, 'Where does it hit? (1 damage for each Spell you play this turn, this one included)'],
  'wild-bloom': [null, 'Which of your creatures doubles its Power and Vitality?'],
  'dawns-judgment': [null, 'Destroy which attacker?'],
  'sky-warden': [null, 'Pin down which enemy creature?'],
  // (Ultra, version 4)
  'grave-harvest': ['Make an Offering? Tap a creature of yours to sacrifice and draw 3, or tap No Offering to draw 1.'],
  'bone-lance': ['Make an Offering? Tap a creature of yours to sacrifice for 5 damage, or tap No Offering for 2.', 'Where does the Bone Lance hit?'],
  'bone-tithe': ['Sacrifice which of your creatures? (You Invest and draw a card.)'],
  turnabout: [null, 'Swap the Power and Vitality of which creature?'],
  'static-spark': [null, 'Where does the spark hit (1 damage)?'],
  'the-last-storm': [null, 'Which opponent does the storm hit?'],
};
// what an ability asks for
const ABILITY_PROMPTS = {
  'ember-duelist': 'Ember Duelist: 1 damage to which creature?',
  'canopy-archer': 'Canopy Archer: shoot which creature with Soar?',
  'hungry-ghoul': 'Hungry Ghoul: sacrifice which of your creatures?',
  'dawnwatch-knight': 'Which of your creatures gets +0/+2 this turn?',
  'molten-core': 'Molten Core fuses into which of your creatures?',
  'bark-graft': 'Bark Graft fuses into which of your creatures?',
  'wing-graft': 'Wing Graft fuses into which of your creatures?',
  'venom-shard': 'Venom Shard fuses into which of your creatures?',
  'blight-beetle': 'Blight Beetle: which enemy creature loses +1/+1 of its growth?',
};

// SATTC Ultra: a Ritual's next stage, and why it can't happen now.
function riteBlocked(s, c) {
  const st = BY_ID[c.cid].stages?.[c.stage];
  if (!st) return 'That Ritual is complete.';
  if (s.active !== G.me || s.phase !== 'main' || !myMove()) return 'On your own turn.';
  if (c.stageOn === s.turn) return 'One stage a turn: this one can happen next turn.';
  if (st.cost > s.players[G.me].energy) return `Needs ${st.cost} Energy; you have ${s.players[G.me].energy}.`;
  return null;
}
function startRite(uid) {
  const s = S(), c = s.cards[uid];
  const why = riteBlocked(s, c);
  if (why) { flash(why); return; }
  const n = stageNeeds(s, G.me, c);
  const steps = [];
  if (n.target && n.target.length) steps.push({ kind: 'target', options: n.target, optional: !!n.optional, prompt: `${BY_ID[c.cid].name}: return which creature to its owner’s hand?` });
  if (n.pick && n.pick.length) steps.push({ kind: 'pick', options: n.pick, optional: !!n.optional });
  if (n.picks && n.picks.length) steps.push({ kind: 'picks', options: n.picks, max: n.max, title: `Bring back up to ${n.max} creatures`, verb: 'Bring back' });
  G.sheet = null;
  if (!steps.length) { tryMove({ t: 'use', p: G.me, uid }); return; }
  G.flow = { a: { t: 'use', p: G.me, uid }, steps, i: 0, multi: [] };
  nextChoice();
}

// Why can't I use this creature's ability right now? (null: I can)
function abilityBlocked(uid) {
  const s = S(), c = s.cards[uid], ab = c && BY_ID[c.cid].ability;
  if (!ab || c.zone !== 'board') return 'It has no ability.';
  if (c.ctrl !== G.me) return 'That is not your creature.';
  if (c.usedOn === s.turn) return 'Already used this turn.';
  if (!myMove()) return s.phase === 'combat' ? 'Wait: someone else is deciding.' : 'On your turn, or during a fight you’re in.';
  if (ab.cost > s.players[G.me].energy) return `Needs ${ab.cost} Energy; you have ${s.players[G.me].energy}.`;
  if (c.cid === 'choirmother' && s.players[G.me].board.length >= RULES.boardMax) return `You already have ${RULES.boardMax} creatures.`;
  if (ultraV2(s) && BY_ID[c.cid].keywords.includes('fuse')) { // (a Symbiote)
    if (c.played === s.turn) return 'A Symbiote can’t fuse the turn it arrives.';
    const n = abilityNeeds(s, G.me, c);
    if (!n.prey.length) return 'Nothing is weak enough for it to kill: it needs a creature with Vitality left no more than its Power, and no Shield.';
    if (!n.target.length) return 'It needs another creature of yours to join.';
  }
  if (c.cid === 'the-puppeteer' && abilityNeeds(s, G.me, c).fighter.length < 2) return 'It needs two enemy creatures it can aim at (a newcomer is Sheltered until its owner’s next turn).';
  if (!useOptions(s, G.me, c, 1).length) return 'There is nothing to target.';
  return null;
}

function startAbility(uid) {
  const why = abilityBlocked(uid);
  if (why) { flash(why); return; }
  const s = S(), c = s.cards[uid];
  const n = abilityNeeds(s, G.me, c);
  G.sheet = null;
  if (n.prey) { // (SATTC Ultra: a Symbiote kills, then fuses)
    const nm = BY_ID[c.cid].name;
    G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'prey', options: n.prey.map((u) => ({ uid: u })), prompt: `${nm} kills which creature? (one it can kill in one hit)` },
      { kind: 'target', options: n.target, prompt: `Then ${nm} joins which of your creatures?` }], i: 0, multi: [] };
    nextChoice();
    return;
  }
  if (n.fighter) { // (SATTC Ultra, version 4: The Puppeteer)
    G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'fighter', options: n.fighter.map((u) => ({ uid: u })), prompt: 'Which enemy creature is made to fight?' },
      { kind: 'target', options: n.target, prompt: 'And which other enemy creature does it fight?' }], i: 0, multi: [] };
    nextChoice();
    return;
  }
  if (!n.target) { tryMove({ t: 'use', p: G.me, uid }); return; }
  G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'target', options: n.target, prompt: ABILITY_PROMPTS[c.cid] || 'Choose a target.' }], i: 0, multi: [] };
  nextChoice();
}

function stepsFor(uid, from) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const n = needs(s, G.me, c, from);
  const pr = PROMPTS[c.cid] || [];
  const steps = [];
  if (n.offer && n.offer.length) steps.push({ kind: 'offer', options: n.offer.map((u) => ({ uid: u })), optional: true, prompt: pr[0] || 'Make an Offering? Tap a creature of yours to sacrifice for the stronger effect.' });
  if (n.sac) steps.push({ kind: 'sac', options: n.sac.map((u) => ({ uid: u })), prompt: pr[0] || 'Choose a creature to sacrifice.' });
  if (n.fighter) steps.push({ kind: 'fighter', options: n.fighter.map((u) => ({ uid: u })), prompt: pr[0] || 'Which of your creatures?' });
  if (n.target && (n.target.length || !n.optional)) steps.push({ kind: 'target', options: n.target, optional: !!n.optional, prompt: pr[1] || 'Choose a target.' });
  if (n.targets && n.count) steps.push({ kind: 'targets', options: n.targets.map((u) => ({ uid: u })), count: n.count, prompt: pr[2] || `Choose ${n.count} of your creatures.` });
  if (n.pick && n.pick.length) steps.push({ kind: 'pick', options: n.pick, optional: !!n.optional });
  if (n.picks) steps.push({ kind: 'picks', options: n.picks, max: n.max, ...(c.cid === 'danse-macabre' ? { title: 'Bring back up to four creatures: they dance (with Rush) until the end of your turn', verb: 'Bring back' } : {}) });
  if (n.keep && n.keep.length) steps.push({ kind: 'keep', options: n.keep });
  if (n.bottom && n.bottom.length) steps.push({ kind: 'bottom', options: n.bottom });
  if (n.discard) steps.push({ kind: 'discard', options: n.discard });
  if (d.type === 'spell' && countercurrentOwner(s)) steps.push({ kind: 'tax' });
  return steps;
}
const countercurrentOwner = (s) => opponents(s, G.me).find((Q) => Q.traps.some((u) => s.cards[u].cid === 'countercurrent'));

const sameT = (a, b) => (a.p != null ? a.p === b.p : a.uid === b.uid);

// What is highlighted on the table right now.
function highlights() {
  const h = { targets: [], picked: [] };
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'offer', 'fighter', 'target', 'targets', 'fuse', 'prey'].includes(st.kind)) {
    h.targets = st.options.filter((o) => !(st.kind === 'target' && o.uid != null && (o.uid === G.flow.a.sac || o.uid === G.flow.a.offer || o.uid === G.flow.a.fighter || o.uid === G.flow.a.prey)));
    if (st.kind === 'targets') h.picked = [...G.flow.multi];
  }
  if (G.atk) {
    for (const Q of opponents(S(), G.me)) h.targets.push({ p: Q.i });
    if (hunterWithoutPrey()) for (const u of preyFor(hunterWithoutPrey())) h.targets.push({ uid: u });
  }
  if (G.blk && G.blk.sel != null) for (const a of S().combat.att) if (canAssign(G.blk.sel, a)) h.targets.push({ uid: a });
  return h;
}

// ── attacking ───────────────────────────────────────────────────────
const readyAttackers = () => S().players[G.me].board.filter((u) => canAttack(S(), G.me, S().cards[u]));
const canStartAttack = () => myMain() && !attackedThisTurn() && readyAttackers().length > 0;
const hunterWithoutPrey = () => G.atk?.att.find((u) => hasKw(S(), S().cards[u], 'hunt') && !G.atk.hunt.some(([a]) => a === u));
function preyFor(hunter, target = G.atk?.target) {
  const s = S(), a = s.cards[hunter];
  return opponents(s, G.me).filter((Q) => target == null || Q.i === target).flatMap((Q) => Q.board).filter((u) => canBlock(s, s.cards[u], a));
}

// Whom an attack is aimed at to begin with: the only opponent, or (three
// players) the one open on the table.
function attackTarget(s) {
  const opp = opponents(s, G.me).filter((Q) => !Q.out);
  return opp.length === 1 ? opp[0].i : focusOf(s);
}

// The attack screen (decideHTML) is open while G.atk is: Attack opens it,
// and so does tapping a ready creature on the table (it comes in picked).
function openAttack(first = null) {
  if (!canStartAttack()) return;
  G.suggest = null;
  G.atk = { att: first != null ? [first] : [], hunt: [], target: attackTarget(S()) };
  redraw();
}

function toggleAttacker(uid) {
  G.suggest = null; // a suggestion set up on the screen is now yours to change
  if (!G.atk) { openAttack(uid); return; }
  const k = G.atk.att.indexOf(uid);
  if (k >= 0) { G.atk.att.splice(k, 1); G.atk.hunt = G.atk.hunt.filter(([a]) => a !== uid); }
  else if (G.atk.att.length >= 2 && S().field != null && S().cards[S().field].cid === 'rolling-fog') { flash('In the Rolling Fog, no more than two creatures can attack in one fight.'); return; }
  else G.atk.att.push(uid);
  redraw();
}

// A Hunt attacker can make one of the defender's creatures block it: tap that
// creature (tap it again to let it go). Any other of theirs: its card, big.
function preyTap(u) {
  const had = G.atk.hunt.find(([, y]) => y === u);
  if (had) { G.atk.hunt = G.atk.hunt.filter((h) => h !== had); redraw(); return; }
  const hunter = hunterWithoutPrey();
  if (hunter != null && preyFor(hunter).includes(u)) { G.atk.hunt.push([hunter, u]); G.suggest = null; redraw(); return; }
  G.sheet = cardSheet(u);
  redraw();
}

function sendAttack(target) {
  const t = target ?? G.atk?.target;
  if (!G.atk || t == null) return;
  const hunt = G.atk.hunt.filter(([, prey]) => S().cards[prey].ctrl === t);
  dispatch({ t: 'attack', p: G.me, target: t, att: [...G.atk.att], ...(hunt.length ? { hunt } : {}) });
}

// ── blocking ────────────────────────────────────────────────────────
function syncBlocks() {
  if (!iBlock()) { G.blk = null; return; }
  const key = `${S().turn}:${S().combat.att.join(',')}`;
  // sel: a creature of yours picked up, waiting for the attacker it blocks; selA: an attacker
  // picked first, waiting for the creature that blocks it (either way round works)
  if (!G.blk || G.blk.key !== key) G.blk = { key, pairs: forcedBlocks(S()), sel: null, selA: null };
}
const isForced = (b, a) => forcedBlocks(S()).some(([x, y]) => x === b && y === a);
function canAssign(b, a) {
  const s = S(), bc = s.cards[b], ac = s.cards[a];
  if (!bc || bc.ctrl !== G.me || !canBlock(s, bc, ac)) return false;
  // a creature that must block its hunter (Hunt) stays where it is
  return !G.blk.pairs.some(([x, y]) => x === b && y !== a && blockLimit(s, bc) === 1 && isForced(x, y));
}
const canBlockSomething = (u) => S().combat.att.some((a) => canBlock(S(), S().cards[u], S().cards[a]));

// Several creatures may block the same attacker; each blocks one (a Guard two).
function assignBlock(b, a) {
  if (!canAssign(b, a)) { flash(`${nameOf(b)} can’t block that.`); return; }
  G.suggest = null;
  if (!G.blk.pairs.some(([x, y]) => x === b && y === a)) {
    // over its limit: it lets go of the attacker it was blocking before
    const mine = G.blk.pairs.filter(([x]) => x === b);
    if (mine.length >= blockLimit(S(), S().cards[b])) { const drop = mine.find(([x, y]) => !isForced(x, y)); G.blk.pairs = G.blk.pairs.filter((p) => p !== drop); }
    G.blk.pairs.push([b, a]);
  }
  G.blk.sel = null;
  G.blk.selA = null;
  redraw();
}

// How many more attackers a creature of yours could still take on (a Guard blocks two).
const blocksLeft = (b) => blockLimit(S(), S().cards[b]) - G.blk.pairs.filter(([x]) => x === b).length;

// On the block screen: tap a creature of yours. With one attacker it can stop,
// it steps in front of it; with several, it is picked up and the attackers it
// can block light up: tap one. (An attacker tapped first waits for its blocker.)
function blockTap(b) {
  const s = S();
  if (!canBlockSomething(b)) { flash(whyNoBlock(b)); return; }
  const fits = s.combat.att.filter((a) => canAssign(b, a) && !G.blk.pairs.some(([x, y]) => x === b && y === a));
  G.suggest = null;
  if (G.blk.selA != null) {
    const a = G.blk.selA;
    if (fits.includes(a)) { assignBlock(b, a); return; }
    flash(`${nameOf(b)} can’t block ${nameOf(a)}${hasKw(s, s.cards[a], 'soar') ? ': it has Soar' : ''}.`);
    return;
  }
  if (!fits.length) { flash(`${nameOf(b)} is already blocking.`); return; }
  if (fits.length === 1) { assignBlock(b, fits[0]); return; }
  G.blk.sel = G.blk.sel === b ? null : b;
  redraw();
}

function attackerTap(a) {
  const s = S();
  G.suggest = null;
  if (G.blk.sel != null) {
    const b = G.blk.sel;
    if (canAssign(b, a)) assignBlock(b, a);
    else flash(`${nameOf(b)} can’t block ${nameOf(a)}${hasKw(s, s.cards[a], 'soar') ? ': it has Soar, so only Soar or Reach can block it' : ''}.`);
    return;
  }
  const can = s.players[G.me].board.filter((u) => canAssign(u, a) && blocksLeft(u) > 0);
  if (!can.length) { flash(`None of your creatures can block ${nameOf(a)}${hasKw(s, s.cards[a], 'soar') ? ': it has Soar, so only Soar or Reach can block it' : ''}.`); return; }
  G.blk.selA = G.blk.selA === a ? null : a;
  redraw();
}

// Tap a blocker standing in front of an attacker: it goes back.
function unblock(b, a) {
  if (isForced(b, a)) { flash(`${nameOf(b)} must block ${nameOf(a)}: it was hunted.`); return; }
  G.suggest = null;
  G.blk.pairs = G.blk.pairs.filter(([x, y]) => !(x === b && y === a));
  G.blk.sel = null;
  G.blk.selA = null;
  redraw();
}

// Why one of your creatures can't block now, in a sentence.
function whyNoBlock(u) {
  const s = S(), c = s.cards[u], d = BY_ID[c.cid];
  if (d.cantBlock) return `${d.name} can’t block: its card says so.`;
  if (c.frozen) return `${d.name} is frozen, so it can’t block until it thaws.`;
  if (c.ex) return `${d.name} is exhausted (it attacked), so it can’t block until your next turn.`;
  const soar = s.combat.att.find((a) => hasKw(s, s.cards[a], 'soar'));
  if (soar != null) return `${d.name} can’t block ${nameOf(soar)}: it has Soar, and only creatures with Soar or Reach can block it.`;
  return `${d.name} can’t block this time.`;
}

// What a block would lead to, if nobody plays a Trick.
const lean = (s) => ({ ...s, log: [], events: [] });
function playOut(s, a) {
  const r = apply(lean(s), a);
  if (r.error) return null;
  let t = r.state;
  for (let i = 0; i < 20 && t.phase === 'combat'; i++) {
    const C = t.combat;
    const r2 = apply(t, C.step === 'block' ? { t: 'block', p: C.d, blocks: forcedBlocks(t, C) } : { t: 'pass', p: C.prio });
    if (r2.error) break;
    t = r2.state;
  }
  return t;
}
// How the fight you are deciding goes if no one plays a Trick (worked out once
// for each position and set of blocks: the banner and the cards both use it).
function fightPreview(s) {
  const key = iBlock() ? `b${JSON.stringify(G.blk?.pairs || [])}` : iTrick() ? 'p' : null;
  if (!key) return null;
  if (G.pv?.s !== s || G.pv.key !== key) G.pv = { s, key, t: playOut(s, key === 'p' ? { t: 'pass', p: G.me } : { t: 'block', p: G.me, blocks: G.blk?.pairs || [] }) };
  return G.pv.t;
}
function outcome(s, t) {
  if (!t) return '';
  const lost = s.players[G.me].life - t.players[G.me].life;
  const gone = (P) => P.board.filter((u) => t.cards[u].zone !== 'board').map((u) => BY_ID[s.cards[u].cid].name);
  const mine = gone(s.players[G.me]);
  const theirs = s.players.filter((Q) => Q.i !== G.me).flatMap(gone);
  const out = t.players[G.me].out && !s.players[G.me].out; // (then losing your creatures goes without saying)
  const bits = [out ? `you take <b>${lost}</b> and <b>you’re out!</b>` : lost > 0 ? `you take <b>${lost}</b>` : 'you take no damage'];
  for (const Q of s.players) {
    const n = Q.life - t.players[Q.i].life;
    if (Q.i !== G.me && n > 0) bits.push(`${esc(shortName(Q.name))} takes <b>${n}</b>${t.players[Q.i].out ? ' (and is out!)' : ''}`);
  }
  if (mine.length && !out) bits.push(`you lose ${esc(listNames(mine))}`);
  if (theirs.length) bits.push(`they lose ${esc(listNames(theirs))}`);
  return bits.join(' · ');
}

// Dragging from one of your creatures on the table: what can it aim at?
// (An opponent's bar to attack them, or the prey of a Hunt: the attack screen
// opens with that set up. Blocking happens on the block screen.)
function aimTargets(uid) {
  const root = document.getElementById('game');
  if (!root || !G) return [];
  const s = S(), c = s.cards[uid];
  if (!c || c.ctrl !== G.me) return [];
  if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) {
    const bars = opponents(s, G.me).map((Q) => root.querySelector(`.pbar[data-p="${Q.i}"]`));
    const prey = hasKw(s, c, 'hunt') ? opponents(s, G.me).flatMap((Q) => Q.board).filter((u) => canBlock(s, s.cards[u], c)).map((u) => root.querySelector(`.tcard[data-uid="${u}"]`)) : [];
    return [...bars, ...prey].filter(Boolean);
  }
  return [];
}

function aimDrop(uid, toEl) {
  const s = S();
  if (!G.atk) G.atk = { att: [], hunt: [], target: null };
  if (!G.atk.att.includes(uid)) G.atk.att.push(uid);
  if (toEl.dataset.p != null) G.atk.target = Number(toEl.dataset.p);
  else {
    const prey = Number(toEl.dataset.uid);
    G.atk.hunt = G.atk.hunt.filter(([a]) => a !== uid);
    G.atk.hunt.push([uid, prey]);
    G.atk.target = s.cards[prey].ctrl;
  }
  redraw();
}

// ── rendering ───────────────────────────────────────────────────────
// A Relic of yours you can use right now glows: Bone Altar, a Ritual's next stage.
function relicCan(s, r) {
  if (r.ctrl !== G.me || !myMain()) return false;
  if (r.cid === 'bone-altar') return r.usedOn !== s.turn && s.players[G.me].board.length > 0;
  return !!BY_ID[r.cid].stages && !riteBlocked(s, r);
}

function relicHTML(s, r, hl) {
  const d = BY_ID[r.cid];
  const isT = hl.targets.some((t) => t.uid === r.uid);
  const note = r.cid === 'the-drowned-clock' ? `<b class="relic-n">${r.chimes || 0}/3</b>` : (r.cid === 'bone-altar' || r.cid === 'war-chest') && r.usedOn === s.turn ? '<b class="relic-n">✓</b>'
    : r.cid === 'the-granary' && r.stored ? `<b class="relic-n">+${r.stored}</b>`
    : d.stages ? `<b class="relic-n rite">${r.stage}/${d.stages.length}</b>` : '';
  return `<button class="relic${isT ? ' target' : relicCan(s, r) ? ' can' : ''}" data-uid="${r.uid}" data-cid="${r.cid}" style="${factionVars(d)}" aria-label="${esc(d.name)}">
    <span class="relic-art">${artTag(r.cid) || ''}</span>${note}</button>`;
}

function pbarHTML(s, P, hl, folded = false) {
  const isT = hl.targets.some((t) => t.p === P.i);
  // a folded side (three players) says how many creatures and Relics it has, on one line; a tap opens it
  const n = P.board.length, nr = P.relics.length;
  const fold = folded && !P.out ? `<span class="pb-fold">${n ? `${n} creature${n > 1 ? 's' : ''}` : 'no creatures'}${nr ? ` · ${nr} Relic${nr > 1 ? 's' : ''}` : ''}</span>` : '';
  const C = s.combat;
  const fighting = C && (C.d === P.i ? ' defending' : C.a === P.i ? ' attacking' : '');
  const crown = s.crown === P.i ? `<button class="pb-crown" data-act="crown-info" aria-label="Holds the Crown">${ICON.crown}</button>` : '';
  // A glance shows Life, Energy and cards in hand; the rest is a tap away (playerSheet).
  // Your own Energy is a big number out of your most this turn (tiny pips were hard to
  // count); the others' is one number. Before the first turn: what the first turn brings.
  const mine = P.i === G.me;
  const most = s.phase === 'mulligan' ? Math.min(RULES.maxEnergy, P.maxEnergy + 1) : P.maxEnergy;
  const energy = mine
    ? `<div class="pb-energy" title="Energy">${enHex(s.phase === 'mulligan' ? most : P.energy)}<span>/${most}</span></div>`
    : `<div class="pb-en" title="Energy">${enHex(P.energy)}</div>`;
  const meta = (mine ? '' : `<span title="cards in hand">${ICON.hand}${P.hand.length}</span>`)
    + (P.deck.length <= 5 && !P.out ? (P.deck.length ? `<span class="pb-low" title="cards left in the deck">${ICON.deck}${P.deck.length} left</span>` : `<span class="pb-low empty" title="${s.deckClock ? `The deck is empty: ${mine ? 'you lose' : 'they lose'} 2 Life at the start of each of ${mine ? 'your' : 'their'} turns` : `The deck is empty: each card ${mine ? 'you' : 'they'}’d draw costs 2 Life`}">${ICON.deck}empty</span>`) : '')
    + (P.traps.length ? `<span class="trap-chip" title="${P.traps.length} face-down Trap${P.traps.length > 1 ? 's' : ''}">${ICON.trap}${P.traps.length}</span>` : '')
    + (!mine && legendWaiting(s, P.i) != null ? `<span class="pb-leg" title="Their Legend waits beside their deck (Level ${champLevel(s, P.i)})">★${champLevel(s, P.i)}</span>` : '');
  return `<div class="pbar${isT ? ' target' : ''}${fighting || ''}${crown ? ' crowned' : ''}" data-p="${P.i}">
    <div class="pb-name">${crown}${esc(shortName(P.name))}</div>
    <div class="pb-life${P.life <= 5 ? ' low' : ''}">${ICON.heart}${P.out ? 'OUT' : P.life}</div>
    ${energy}
    ${meta ? `<div class="pb-meta">${meta}</div>` : ''}
    ${fold}
    ${FX.pileHTML(P.discard.slice(-3).map((u) => ({ cid: s.cards[u].cid })), { p: P.i, count: P.discard.length, act: 'discards', w: s.players.length > 2 ? 22 : 26 })}
    ${P.relics.length ? `<div class="pb-relics">${P.relics.map((u) => relicHTML(s, s.cards[u], hl)).join('')}</div>` : ''}
  </div>`;
}

function creatureHTML(s, c, hl, inBattle = false) {
  const d = BY_ID[c.cid];
  const mine = c.ctrl === G.me;
  const st = [];
  const inAtk = G.atk?.att.includes(c.uid);
  const blkPair = G.blk?.pairs.some(([b]) => b === c.uid);
  if (c.ex && !c.attacking) st.push('exhausted');
  if (c.attacking || inAtk) st.push('attacking');
  if (c.blocking || blkPair) st.push('blocking');
  if (mine) {
    if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c) && !inAtk) st.push('ready');
    else if (iBlock() && !blkPair && s.combat.att.some((a) => canAssign(c.uid, a))) st.push('ready');
    if (c.played === s.turn && s.active === G.me && !c.rush && !hasKw(s, c, 'rush')) st.push('sick');
  }
  if (G.blk?.sel === c.uid) st.push('selected');
  // in a fight you are deciding: what would be destroyed if no one plays a Trick
  if (inBattle && (iBlock() || iTrick())) { const pv = fightPreview(s); if (pv && pv.cards[c.uid]?.zone !== 'board') st.push('doomed'); }
  if (hl.targets.some((t) => t.uid === c.uid)) st.push('target');
  if (hl.picked.includes(c.uid)) st.push('selected');
  const kws = FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k));
  // ⚡ chips only on your own creatures (theirs are a tap away, on the card)
  const ability = d.ability && mine ? { cost: d.ability.cost, on: !abilityBlocked(c.uid), used: c.usedOn === s.turn } : null;
  const clock = unstableClock(s, c);
  return FX.tcardHTML(d, {
    uid: c.uid, states: st, power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), dmg: c.dmg,
    keywords: kws, leaving: !!(c.sacEnd || c.stolen), foe: !mine, ability, champ: d.champion ? champLevel(s, c.owner) : 0,
    shelter: !!(s.ultra && c.shelter), hex: c.hex || 0, poison: c.poison || 0, shield: c.shield || 0,
    unstable: clock ? { p: clock.p, at: clock.at, soon: clock.turns <= 1 } : null,
    ...(inBattle ? { cls: 'in-battle', rest: false } : {}),
  });
}

// The blockers of each attacker: the engine's, the ones just declared (shown while
// that move is animated), or the ones I am choosing right now.
function blockersOf(s) {
  const C = s.combat;
  if (!C) return {};
  if (G.showBlk && C.step === 'block') return G.showBlk;
  if (C.step === 'block' && C.d === G.me && G.blk) {
    const blk = {};
    for (const [b, x] of G.blk.pairs) (blk[x] ||= []).push(b);
    return blk;
  }
  return C.blk;
}

// ── the battle zone ─────────────────────────────────────────────────
// While a fight is on (or while you pick attackers), the creatures in it
// leave their rows and meet in the middle: each attacker in a column, its
// blockers straight across from it (side by side when there are several).
function battleView(s) {
  const C = s.combat;
  let att, blk = {}, a, d;
  if (C) {
    att = C.att.filter((u) => s.cards[u].zone === 'board');
    a = C.a; d = C.d;
    blk = blockersOf(s);
  } else if (G.atk && myMain()) {
    att = [...G.atk.att];
    a = G.me; d = G.atk.target;
  } else return null;
  if (!att.length) return null;
  // You are always at the bottom; otherwise the attacker is on top.
  const attTop = a !== G.me;
  const placed = new Set();
  const cols = att.map((u) => {
    const all = (blk[u] || []).filter((b) => s.cards[b]?.zone === 'board');
    const bs = all.filter((b) => !placed.has(b));
    const also = all.filter((b) => placed.has(b)); // a Guard blocking two is shown once
    for (const b of all) placed.add(b);
    return { a: u, bs, also };
  });
  return { a, d, attTop, cols, inZone: new Set([...att, ...placed]) };
}

// The fight on the table is to watch (yours while the others decide, and the
// others'); deciding one happens on its own screen (decideHTML).
function battleHTML(s, bv, hl) {
  const card = (u) => creatureHTML(s, s.cards[u], hl, true);
  const target = bv.d != null ? s.players[bv.d] : null;
  const short = (P) => (P.i === G.me ? 'you' : shortName(P.name));
  const cols = bv.cols.map(({ a, bs, also }) => {
    const parts = bs.map(card);
    if (also.length) parts.push(`<div class="gb-empty gb-also">also ${esc(listNames(also.map(nameOf)))}</div>`);
    // an unblocked attacker gets a small "→ name" label, not a card-sized slot
    const label = !parts.length;
    if (label) parts.push(`<div class="gb-empty gb-hit">→ ${target ? esc(short(target)) : '?'}</div>`);
    const other = `<div class="gb-slot${parts.length > 1 ? ' multi' : ''}${label ? ' label' : ''}">${parts.join('')}</div>`;
    const mine = `<div class="gb-slot">${card(a)}</div>`;
    const blocked = bs.length + also.length > 0;
    return `<div class="gb-col${parts.length > 1 ? ' wide' : ''}" data-key="col-${a}">${bv.attTop ? mine : other}<div class="gb-vs">${blocked ? '⚔' : ''}</div>${bv.attTop ? other : mine}</div>`;
  }).join('');
  const who = bv.a === G.me ? 'You' : shortName(s.players[bv.a].name);
  const at = target ? (target.i === G.me ? 'you' : shortName(target.name)) : null;
  const across = bv.cols.reduce((n, c) => n + Math.max(1, c.bs.length + (c.also.length ? 0.6 : 0)), 0);
  const label = at ? `<div class="gb-label">⚔ ${esc(who)} → ${esc(at)}</div>` : '';
  return `<div class="g-battle ${bv.attTop ? 'att-top' : 'att-bottom'}${bv.cols.length > 4 || across > 5 ? ' many' : ''}" data-key="battle">${tutStep() ? '' : label}<div class="gb-cols">${cols}</div></div>`;
}

// ── deciding a fight, big ───────────────────────────────────────────
// Picking attackers, blocking and the Tricks before a fight each get a screen
// of their own over the table (players couldn't tell on the small fight in the
// middle what to tap, when, or what it meant): big cards, one line saying what
// to tap next, a line on what it means, and how it would turn out, in words.
// The button that carries the game on is at the bottom right, as on the table;
// ☰ and 💡 stay at the top. The lesson's coach speaks in the line at the top.

// Which fight decision is on screen: 'attack', 'block', 'tricks' or null.
// (None while a move plays out, or while a Trick's target is picked on the table.)
function decision() {
  if (!G || G.busy || G.flow || G.stale) return null;
  const s = S();
  if (s.phase === 'over' || s.players[G.me].out) return null;
  if (G.atk && myMain()) return 'attack';
  if (iBlock()) return 'block';
  if (iTrick()) return 'tricks';
  return null;
}

// A creature on a decision screen: a big table card in a wrapper that is what you tap
// (no data-uid of its own, so nothing on the table mistakes it for the one in the row).
function decCard(s, u, { act = '', states = [], foe = false, tag = '', why = '', att = null } = {}) {
  const c = s.cards[u], d = BY_ID[c.cid];
  const card = FX.tcardHTML(d, {
    states: states.filter(Boolean), power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0), dmg: c.dmg,
    keywords: FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k)), leaving: !!(c.sacEnd || c.stolen), foe, rest: false,
  });
  return `<div class="dec-c"${act ? ` data-act="${act}" role="button"` : ''} data-u="${u}"${att != null ? ` data-att="${att}"` : ''}${why ? ` data-why="${esc(why)}"` : ''} data-key="dc-${u}">`
    + `${card}${tag ? `<span class="dec-tag">${tag}</span>` : ''}</div>`;
}

// The cards in a box: as big as the box lets them be (fitDecision sizes them).
const decCards = (cls, html, n) => `<div class="dec-cards ${cls}" data-n="${n}">${html}</div>`;

// Under an unblocked attacker: the damage it would deal. (A blocked pair says
// it with ☠ on the cards; the line under the fight says it in words.)
// (`compact`, many columns: just "−7"; the line under the fight says the total)
function decRes(s, a, bs, toMe, compact = false) {
  if (bs.length) return '';
  const p = power(s, s.cards[a]);
  return compact ? `<b class="hit" title="${p} damage${toMe ? ' to you' : ''}">−${p}</b>` : `<b class="hit">${p} damage</b>${toMe ? ' to you' : ''}`;
}
// "☠" explained, when a fight shows one
const skullNote = (s, t) => (t && s.combat.att.some((a) => [a, ...(blockersOf(s)[a] || [])].some((u) => t.cards[u]?.zone !== 'board')) ? ' ☠: would be destroyed.' : '');

// The fight as it stands: a column for each attacker, the other side's creatures
// on top and yours below. Blocking, your side of each column is where your
// blockers stand (tap one to send it back) or a place to put one. With nobody
// blocked (a Tricks window), the attackers stand in one row.
function decFight(s, t, { blocking = false } = {}) {
  const C = s.combat, mineAttack = C.a === G.me, toMe = C.d === G.me;
  const blk = blockersOf(s);
  const doomed = (u) => !!t && t.cards[u]?.zone !== 'board';
  const atts = C.att.filter((u) => s.cards[u].zone === 'board');
  const bsOf = (a) => (blk[a] || []).filter((b) => s.cards[b]?.zone === 'board');
  const one = !blocking && atts.every((a) => !bsOf(a).length);
  const compact = atts.length >= 5; // a big board: short words, so every column fits the screen
  const cols = atts.map((a) => {
    const bs = bsOf(a);
    const sel = blocking ? G.blk.sel : null;
    const open = sel != null && canAssign(sel, a) && !G.blk.pairs.some(([x, y]) => x === sel && y === a);
    const picked = blocking && G.blk.selA === a;
    const att = decCard(s, a, { act: blocking ? 'dec-foe' : 'dec-look', foe: !mineAttack, states: ['attacking', doomed(a) && 'doomed', (open || picked) && 'target'] });
    const res = `<div class="dec-res">${decRes(s, a, bs, toMe, compact)}</div>`;
    if (one) return `<div class="dec-col" data-n="1" data-key="col-${a}"><div class="dec-stack">${att}</div>${res}</div>`;
    let other;
    if (blocking) {
      other = bs.map((b) => decCard(s, b, { act: 'dec-unblk', att: a, states: ['blocking', doomed(b) && 'doomed'], tag: isForced(b, a) ? 'hunted' : '' })).join('')
        + (open || picked || !bs.length ? `<button class="dec-empty${open || picked ? ' open' : ''}" data-act="dec-foe" data-u="${a}" aria-label="${open || picked ? 'Block here' : 'Not blocked'}">${open || picked ? (compact ? 'Here' : 'Block here') : compact ? '–' : 'Not blocked'}</button>` : '');
    } else {
      other = bs.map((b) => decCard(s, b, { act: 'dec-look', foe: mineAttack, states: ['blocking', doomed(b) && 'doomed'] })).join('')
        || `<span class="dec-free">${compact ? '–' : 'Not blocked'}</span>`;
    }
    const n = Math.max(1, bs.length + (blocking && bs.length && (open || picked) ? 1 : 0));
    return `<div class="dec-col${picked ? ' picked' : ''}" data-n="${n}" data-key="col-${a}">
      <div class="dec-stack top">${mineAttack ? other : att}</div><div class="dec-vs">${bs.length ? '⚔' : '↓'}</div><div class="dec-stack bottom">${mineAttack ? att : other}</div>
      ${res}</div>`;
  });
  return `<div class="dec-fight${one ? ' one' : ''}" data-key="fight">${cols.join('')}</div>`;
}

function decideHTML(s) {
  const mode = decision();
  if (!mode) return '';
  const st = tutStep();
  let body;
  try {
    body = mode === 'attack' ? attackDec(s) : mode === 'block' ? blockDec(s) : tricksDec(s);
  } catch (e) { console.error(e); return ''; }
  // the coach's words take the place of the usual line (and of what it means)
  const say = st ? `<div class="dec-say dec-coach">${esc(st.say)}</div>` : `<div class="dec-say">${body.say}</div>${body.why ? `<div class="dec-why">${body.why}</div>` : ''}`;
  return `<div class="g-dec dec-${mode}" data-key="dec">
    <div class="dec-head"><div class="dec-title">${body.title}</div>${body.meta ? `<div class="dec-meta">${body.meta}</div>` : ''}</div>
    ${say}
    ${body.main}
    ${body.sum ? `<div class="dec-sum">${body.sum}</div>` : ''}
    ${suggestHTML()}
    <div class="dec-btns"><span>${body.left || ''}</span><span>${goButton()}</span></div>
  </div>`;
}

// Picking attackers: whom (three players), your creatures that can attack, and
// theirs that could block them.
function attackDec(s) {
  const A = G.atk, T = s.players[A.target];
  const tn = esc(shortName(T.name));
  const opp = opponents(s, G.me).filter((Q) => !Q.out);
  const mine = s.players[G.me].board;
  const ready = readyAttackers();
  const pool = A.att.length ? A.att : ready;
  const theirs = T.board.filter((u) => pool.some((a) => canBlock(s, s.cards[u], s.cards[a])));
  const hunter = hunterWithoutPrey();
  const prey = hunter != null ? new Set(preyFor(hunter)) : new Set();
  const hunted = new Map(A.hunt.map(([a, y]) => [y, a]));
  const whom = opp.length > 1 ? `<div class="dec-whom">${opp.map((Q) => `<button class="dec-foe${Q.i === A.target ? ' on' : ''}" data-act="dec-target" data-p="${Q.i}" data-key="foe-${Q.i}">
    <b>${esc(shortName(Q.name))}</b><span>${ICON.heart}${Q.life} · ${Q.board.length} creature${Q.board.length === 1 ? '' : 's'}</span></button>`).join('')}</div>` : '';
  const theirCards = theirs.map((u) => decCard(s, u, { act: 'dec-prey', foe: true, states: [prey.has(u) && 'target', hunted.has(u) && 'selected'], tag: hunted.has(u) ? 'hunted' : '' })).join('');
  const myCards = mine.map((u) => {
    const c = s.cards[u];
    if (ready.includes(u)) return decCard(s, u, { act: 'dec-att', states: [A.att.includes(u) ? 'attacking' : 'ready'], tag: A.att.includes(u) ? '⚔ attacking' : '' });
    const why = c.ex ? `${nameOf(u)} is spent: it can’t attack until your next turn.` : `${nameOf(u)} just arrived: it can attack next turn.`;
    return decCard(s, u, { act: 'dec-why', states: [c.ex ? 'exhausted' : 'sick'], why });
  }).join('');
  const n = A.att.length;
  const hit = A.att.reduce((x, u) => x + power(s, s.cards[u]), 0);
  let say;
  if (!n) say = ready.length > 1 ? 'Tap the creatures you attack with.' : 'Tap your creature to attack with it.';
  else if (hunter != null && prey.size) say = `${esc(nameOf(hunter))} can Hunt: tap one of ${tn}’s creatures to make it block (or skip it).`;
  else say = `${ready.length > n ? 'Tap more to add them, or tap' : 'Tap'} <b>Attack${opp.length > 1 ? ` ${tn}` : ''}</b> to send ${n > 1 ? 'them' : 'it'}.`;
  return {
    title: '⚔ Attack',
    meta: opp.length > 1 ? '' : `${tn} ${ICON.heart}${T.life}`,
    say,
    why: `Attackers hit ${tn} unless blocked: a blocked one fights its blocker instead. Attacking spends them: they can’t block until your next turn. Hold a card to read it.`,
    main: `${whom}
      <div class="dec-label">${theirs.length ? `${tn} can block with` : `${tn} has nothing that can block`}</div>
      ${theirs.length ? decCards('theirs', theirCards, theirs.length) : ''}
      <div class="dec-label">Your creatures</div>
      ${decCards('mine', myCards, mine.length)}`,
    sum: n ? `If nothing is blocked, ${tn} takes <b>${hit}</b>${hit >= T.life ? ': enough to knock them out!' : '.'}` : '',
    left: '<button class="btn small ghost" data-act="cancel">Cancel</button>',
  };
}

// Blocking: the attackers on top with a place in front of each; your creatures
// below. Tap one of yours, then (with several attackers) the one it blocks.
function blockDec(s) {
  const C = s.combat, A = s.players[C.a], an = esc(shortName(A.name));
  const t = fightPreview(s);
  const me = s.players[G.me];
  const can = me.board.filter((u) => canBlockSomething(u));
  const free = me.board.filter((u) => !canBlockSomething(u) || blocksLeft(u) > 0);
  const myCards = free.map((u) => {
    if (!canBlockSomething(u)) return decCard(s, u, { act: 'dec-why', states: [s.cards[u].ex ? 'exhausted' : 'dim'], why: whyNoBlock(u) });
    const used = G.blk.pairs.some(([x]) => x === u); // a Guard, with one attacker taken
    return decCard(s, u, { act: 'dec-blk', states: [G.blk.sel === u ? 'selected' : 'ready'], tag: used ? 'can block 1 more' : '' });
  }).join('');
  const atts = C.att.filter((u) => s.cards[u].zone === 'board');
  // (SATTC Ultra, version 4) an Ambush creature played now can still block
  const ambush = G.blk.pairs.length ? [] : me.hand.filter((u) => BY_ID[s.cards[u].cid].keywords.includes('ambush'));
  const ambushCards = ambush.map((u) => {
    const d = BY_ID[s.cards[u].cid], why = playable(u);
    return `<div class="dec-c" data-act="${why ? 'dec-why' : 'dec-trick'}" role="button" data-u="${u}"${why ? ` data-why="${esc(why)}"` : ''} data-key="dt-${u}">${FX.tcardHTML(d, { zone: 'hand', cost: costOf(s, G.me, s.cards[u]), states: [why ? 'dim' : 'can'] })}</div>`;
  }).join('');
  let say;
  if (G.blk.selA != null) say = `Now tap the creature of yours that blocks ${esc(nameOf(G.blk.selA))}.`;
  else if (G.blk.sel != null) say = `Now tap the attacker ${esc(nameOf(G.blk.sel))} blocks.`;
  else if (!can.length) say = ambush.length ? 'None of your creatures can block this: play an Ambush creature below, or tap <b>No block</b>.' : 'None of your creatures can block this. Tap <b>No block</b>.';
  else if (!G.blk.pairs.length) say = `Tap ${can.length > 1 ? 'one of your creatures' : 'your creature'} to block${atts.length > 1 ? ' an attacker' : ''}, or tap <b>No block</b>.`;
  else say = 'Tap <b>Block</b> when you’re done. Tap a blocker to send it back.';
  const clear = G.blk.pairs.some(([b, a]) => !isForced(b, a)) ? '<button class="btn small ghost" data-act="clear-blocks">Clear</button>' : '';
  return {
    title: `⚔ ${an} attacks you`,
    meta: `${ICON.bolt}${A.energy} · ${A.hand.length} card${A.hand.length === 1 ? '' : 's'}`,
    say,
    why: `A blocked attacker fights your blocker instead of hitting you.${can.length > 1 && atts.length ? ' Two of yours can team up on one attacker.' : ''}${skullNote(s, t)} Hold a card to read it.`,
    main: `${decFight(s, t, { blocking: true })}
      ${free.length ? `<div class="dec-label">${can.length ? 'Your creatures' : 'Your creatures can’t block (tap one to see why)'}</div>${decCards('mine', myCards, free.length)}` : ''}
      ${ambush.length ? `<div class="dec-label">Ambush: play one now and it can block</div>${decCards('tricks', ambushCards, ambush.length)}` : ''}`,
    sum: `If no one plays a Trick: ${outcome(s, t)}.`,
    left: clear,
  };
}

// The Tricks before a fight: the fight as it stands, and what you could play.
function tricksDec(s) {
  const C = s.combat, mineAttack = C.a === G.me;
  const O = s.players[mineAttack ? C.d : C.a], on = esc(shortName(O.name));
  const P = s.players[G.me];
  const t = fightPreview(s);
  const tricks = P.hand.filter((u) => isTrick(BY_ID[s.cards[u].cid]) || BY_ID[s.cards[u].cid].keywords.includes('ambush') || fuseTargets(u).length); // (SATTC Ultra: a creature card fused in, like a Trick; an Ambush creature)
  const abil = P.board.filter((u) => BY_ID[s.cards[u].cid].ability && !abilityBlocked(u));
  const cards = tricks.map((u) => {
    const d = BY_ID[s.cards[u].cid], why = playable(u);
    return `<div class="dec-c" data-act="${why ? 'dec-why' : 'dec-trick'}" role="button" data-u="${u}"${why ? ` data-why="${esc(why)}"` : ''} data-key="dt-${u}">${FX.tcardHTML(d, { zone: 'hand', cost: costOf(s, G.me, s.cards[u]), states: [why ? 'dim' : 'can'] })}</div>`;
  }).join('');
  const abs = abil.map((u) => {
    const ab = BY_ID[s.cards[u].cid].ability;
    return `<button class="dec-ab" data-act="dec-ab" data-u="${u}" data-key="da-${u}">${ICON.bolt}<b>${esc(nameOf(u))}</b><span class="dec-ab-what">${esc(ab.short)}</span>${enHex(ab.cost)}</button>`;
  }).join('');
  const can = tricks.some((u) => !playable(u));
  return {
    title: mineAttack ? `⚔ You attack ${on}` : `⚔ ${on} attacks you`,
    meta: `${ICON.bolt}${O.energy} · ${O.hand.length} card${O.hand.length === 1 ? '' : 's'}`,
    say: `Before the fight: ${can ? (tricks.some((u) => BY_ID[s.cards[u].cid].type === 'creature') ? 'play a Trick or fuse a creature card in' : 'play a Trick') : 'use an ability'}, or tap <b>Fight</b>.`,
    why: `Tricks${abil.length ? ' and ⚡ abilities' : ''} can change a fight; ${on} can answer yours.${skullNote(s, t)}`,
    main: `${decFight(s, t)}
      <div class="dec-label">You can play · you have ${enHex(P.energy)} Energy</div>
      ${tricks.length ? decCards('tricks', cards, tricks.length) : ''}
      ${abs ? `<div class="dec-abs">${abs}</div>` : ''}`,
    sum: `If no one plays a Trick: ${outcome(s, t)}.`,
  };
}

// Each box of cards gets the biggest size at which they all fit, in as many
// rows as suits it; a fight's columns, the size at which two cards stack.
function fitDecision(root) {
  const dec = root.querySelector('.g-dec');
  if (!dec) return;
  // the fight first: your creatures below it are never drawn bigger than the fighters
  let fw = 0;
  const fight = dec.querySelector('.dec-fight');
  if (fight) {
    const cols = [...fight.children];
    // many attackers (a big board): smaller words and gaps (.tight), and two lines of
    // columns (.wrap) when one line won't fit the screen
    const tight = cols.length >= 5, gap = tight ? 8 : 14;
    fight.classList.toggle('tight', tight);
    const W = fight.clientWidth, H = fight.clientHeight;
    const rows = fight.classList.contains('one') ? 1 : 2;
    const fits = () => fight.scrollWidth <= W + 1 && fight.scrollHeight <= H + 1;
    const lay = (lines) => {
      const per = Math.ceil(cols.length / lines);
      fight.classList.toggle('wrap', lines > 1);
      fight.style.setProperty('--fcols', per);
      let units = 0;
      for (let i = 0; i < cols.length; i += per) units = Math.max(units, cols.slice(i, i + per).reduce((x, c) => x + Math.max(1, (Number(c.dataset.n) || 1) * 0.86), 0));
      let w = Math.max(34, Math.floor(Math.min(108, (W - (per - 1) * gap) / units, (H - lines * (rows === 1 ? 44 : 62)) / (lines * rows) / 1.33)));
      fight.style.setProperty('--dw', `${w}px`);
      // (the words under a column can take more room than reckoned: smaller until it all fits)
      for (let k = 0; k < 10 && w > 34 && !fits(); k++) { w = Math.max(34, Math.floor(w * 0.92)); fight.style.setProperty('--dw', `${w}px`); }
      return w;
    };
    let w = lay(1);
    if (cols.length >= 4 && (!fits() || w < 44)) {
      const one = { w, ok: fits() };
      const two = lay(2);
      if ((one.ok && !fits()) || (one.ok && two < one.w + 6)) w = lay(1); else w = two;
    }
    fw = w;
  }
  const GAP = 16; // (room for a picked card's lift and glow)
  for (const box of dec.querySelectorAll('.dec-cards')) {
    const n = Number(box.dataset.n) || 1, W = box.clientWidth, H = box.clientHeight;
    const hand = box.classList.contains('tricks');
    const ar = hand ? 1.397 : 1.33;
    const max = Math.min(hand ? 92 : box.classList.contains('theirs') ? 84 : 112, fw && !hand ? Math.max(56, Math.round(fw * 1.1)) : Infinity);
    let best = { w: 0, cols: n };
    for (let rows = 1; rows <= Math.min(3, n); rows++) {
      const cols = Math.ceil(n / rows);
      const w = Math.min(max, (W - (cols - 1) * GAP) / cols, (H - (rows - 1) * 16 - 16) / rows / ar);
      if (w > best.w + 2) best = { w, cols };
    }
    box.style.setProperty('--dw', `${Math.max(36, Math.floor(best.w))}px`);
    box.style.setProperty('--dcols', best.cols);
  }
}

// The hand always has a focal card: the one you last slid to or looked at,
// or (when that one is gone) the card that took its place.
function peekOf(hand) {
  if (!hand.length) return null;
  if (!hand.includes(G.peek)) G.peek = hand[Math.min(G.peekAt ?? Math.floor((hand.length - 1) / 2), hand.length - 1)];
  G.peekAt = hand.indexOf(G.peek);
  return G.peek;
}

function handHTML(s) {
  const row = handRow(s);
  // the first time your Legend can be played, the hand turns to it (it sits at the far left)
  const L = legendWaiting(s);
  if (L != null && !G.legendShown && myMain() && !playable(L, 'legend')) { G.legendShown = true; G.peek = L; G.peekAt = 0; }
  const peek = peekOf(row);
  return row.map((u) => {
    const c = s.cards[u], d = BY_ID[c.cid], from = fromFor(u);
    const can = !playable(u, from);
    const st = can ? ['can'] : myMove() ? ['dim'] : [];
    if (from === 'legend') st.push('legend-wait');
    if (G.flow?.a.uid === u) st.push('selected');
    if (u === peek) st.push('peek');
    // (Ultra: a creature sent back to the hand shows the growth it kept)
    const kept = c.keepP || c.keepV ? { power: d.power + (c.keepP || 0), vitality: d.vitality + (c.keepV || 0) } : {};
    return FX.tcardHTML(d, { uid: u, zone: 'hand', cost: costOf(s, G.me, c, from), states: st, ...kept });
  }).join('');
}

function statusHTML() {
  const s = S();
  if (s.phase === 'over') return 'Game over';
  if (s.players[G.me].out) return `<b>You’re out</b> · watching ${esc(listNames(living(s).map((P) => shortName(P.name))))} finish`;
  if (s.phase === 'mulligan') return 'Waiting for everyone to choose an opening hand…';
  const P = s.players[s.active];
  const who = actor(s);
  if (s.phase === 'combat') return who === G.me ? `<b>${s.combat.step === 'block' ? 'You’re attacked' : 'Your move'}</b>` : `${esc(name(who))} is deciding…`;
  if (s.active === G.me) return '<b>Your turn</b>'; // your Energy is on your bar
  return G.bots.has(s.active) ? `${esc(shortName(P.name))} is thinking…` : `${esc(poss(shortName(P.name)))} turn`;
}

function midHTML() {
  return suggestHTML() + midInner();
}

function midInner() {
  const s = S();
  const coached = !!tutStep(); // the coach box says what to do
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'offer', 'fighter', 'target', 'targets', 'fuse', 'prey'].includes(st.kind)) return `<div class="banner"><span>${esc(st.prompt)}</span></div>`;
  // (picking attackers, blocking and the Tricks before a fight have their own screen: decideHTML)
  // how the last fight went (the full story is in the game log, in the menu)
  if (G.fightNote && s.phase === 'main' && !coached) return `<div class="fight-note"${G.lastFight ? ' data-act="fight-replay" role="button"' : ''}>${G.fightNote}${G.lastFight ? ' <span class="fn-replay">▶ Replay</span>' : ''}</div>`;
  if (s.players[G.me].out && s.phase !== 'over') return '<div class="hint">You’re out of this game; the others play on.</div>';
  return '';
}

// "Since your last turn": what happened to you first (the Life you lost, who
// hit you, what you lost), then the rest in a line each. It sits over the
// table at the start of your turn, so it is never cut off; a tap closes it.
function recapInfo() {
  const s = S(), log = s.log, me = s.players[G.me];
  let start = log.length - 1;
  while (start >= 0 && log[start].text !== `${me.name}'s turn.`) start--;   // this turn's start
  let prev = start - 1;
  while (prev >= 0 && log[prev].text !== `${me.name}'s turn.`) prev--;      // your previous turn's start
  if (start < 0 || prev < 0) return null;
  let from = prev + 1;
  while (from < start && !/'s turn\.$/.test(log[from].text)) from++;  // skip your own turn
  const fights = [], news = [];
  let cur = null;
  for (const { text } of log.slice(from, start)) {
    let m;
    if ((m = text.match(/^(.+) attacks (.+) with (.+)\.$/))) { cur = { who: m[1], target: m[2], with: m[3], dmg: 0 }; fights.push(cur); continue; }
    if ((m = text.match(/^(.+) takes (\d+) damage\.$/)) && cur && m[1] === cur.target) { cur.dmg += Number(m[2]); continue; }
    if (/'s turn\.$/.test(text)) { cur = null; continue; }
    if (/takes the Crown|Crown goes|is out|plays (?!a )|sets a Trap|Trap springs/.test(text)) news.push(text);
  }
  const mk = G.mark && G.mark.turn < s.turn ? G.mark : null;
  return {
    fights, news, now: me.life, before: mk ? mk.life[G.me] : null,
    lost: mk ? mk.life[G.me] - me.life : 0,
    died: mk ? mk.board.filter((x) => !(s.cards[x.uid]?.zone === 'board' && s.cards[x.uid].ctrl === G.me)).map((x) => x.name) : [],
  };
}

function recapHTML() {
  const s = S();
  if (G.recap !== s.turn || !myMain() || tutStep()) return '';
  const r = recapInfo();
  if (!r) return '';
  const me = s.players[G.me].name;
  const who = (n) => (n === me ? 'you' : `<b>${esc(shortName(n))}</b>`);
  const lines = [];
  for (const f of r.fights.filter((x) => x.target === me)) lines.push(`${who(f.who)} attacked you with ${esc(f.with)}${f.dmg ? `: you took <b class="bad">${f.dmg}</b>.` : ', but nothing got through.'}`);
  if (r.died.length) lines.push(`You lost ${esc(listNames(r.died))}.`);
  for (const t of r.news.filter((x) => /Crown|is out/.test(x))) lines.push(esc(speak(t)));
  for (const f of r.fights.filter((x) => x.target !== me)) lines.push(`${who(f.who)} attacked ${who(f.target)}${f.dmg ? ` (${f.dmg} damage)` : ''}.`);
  for (const t of r.news.filter((x) => !/Crown|is out/.test(x)).slice(-2)) lines.push(esc(speak(t)));
  if (!lines.length && !r.lost) return '';
  const head = r.lost > 0 ? `You lost <b class="bad">${r.lost} Life</b> (${r.before} → ${r.now}).` : r.lost < 0 ? `You gained ${-r.lost} Life (now ${r.now}).` : `You lost no Life (${r.now}).`;
  return `<div class="recap-pop" data-act="recap-close" data-key="recap"><div class="recap-h">Since your last turn</div>
    <div class="recap-life">${head}</div>${lines.slice(0, 5).map((t) => `<div>${t}</div>`).join('')}<div class="recap-x">Tap to close</div></div>`;
}

function anythingToDo() {
  const s = S(), P = s.players[G.me];
  if (!myMain()) return false;
  if (handRow(s).some((u) => !playable(u, fromFor(u)))) return true;
  if (canStartAttack()) return true;
  return phoenixReady(s, G.me).length > 0 && P.energy >= 2;
}

// The strip under the table: Cancel, End turn or a Phoenix on the left; on
// the right, under the thumb, the button that carries the game on (Attack,
// End turn: goHTML), or a choice's Skip or Done, or the lesson's Next. Nothing
// on the table can cover it or push it out of view there, and it never moves.
// (While a fight is being decided, its screen has the buttons: decideHTML.)
function actionsHTML() {
  const s = S();
  const btn = (cls, act, label, extra = '') => `<button class="btn ${cls}" data-act="${act}" ${extra}>${label}</button>`;
  const left = [], right = [];
  const row = () => `<span class="ga-side">${left.join('')}</span><span class="ga-side end">${right.join('')}${goHTML()}</span>`;
  // In the lesson, "Next" is a button here: the coach box can be taller than the
  // middle of a short phone, and the button must never be the part that's cut off.
  const lesson = tutStep();
  if (lesson?.next) { right.push(btn('primary coach-next-btn', 'coach-next', lesson.final ? 'Let’s play!' : 'Next')); return row(); }
  const st = G.flow?.steps[G.flow.i];
  if (st && ['sac', 'offer', 'fighter', 'target', 'targets', 'fuse', 'prey'].includes(st.kind)) {
    left.push(btn('small ghost', 'cancel', 'Cancel'));
    if (st.kind === 'targets' && G.flow.multi.length) right.push(btn('primary', 'done-targets', `Done (${G.flow.multi.length})`));
    else if (st.optional) right.push(btn('primary', 'skip', st.kind === 'offer' ? 'No Offering' : 'Skip'));
  } else if (!decision()) {
    // Attack is the button at the right while you can attack: End turn waits on the left
    if (myMain() && canStartAttack() && goAction()?.act === 'attack-open') {
      left.push(`<button class="btn small g-end${endArmed() ? ' armed' : ''}" data-act="go" data-go="end">${endArmed() ? 'End turn anyway' : 'End turn'}</button>`);
    }
    const phoenix = phoenixReady(s, G.me);
    if (phoenix.length && myMain()) left.push(btn('small', 'phoenix', 'Return Phoenix (2)', `data-uid="${phoenix[0]}"`));
    if (myMain() && ultraV2(s) && !check(s, { t: 'dig', p: G.me })) left.push(btn('small g-dig', 'dig', `<span>Dig ${enHex(ULTRA_V2.digCost)}</span><small>draw a card</small>`, `aria-label="Dig: pay ${ULTRA_V2.digCost} Energy to draw a card"`));
    if (s.players[G.me].out && s.phase !== 'over') right.push(btn('primary', 'leave', 'Leave'));
  }
  return row();
}

// ── moving the game on ──────────────────────────────────────────────
// One button, always in the same place at the bottom right: Attack (it opens
// the attack screen) and End turn on the table; Attack, Block (or No block)
// and Fight on a fight's own screen. It is gold when it is the thing to do.
// End turn stays plain while you could still play a card or attack, and then
// its first tap only asks ("End turn anyway"), so a stray tap never throws a
// turn away.
const END_ARM_MS = 4000;
const endArmed = () => !!G.endArm && Date.now() - G.endArm < END_ARM_MS;

function goAction() {
  const s = S();
  if (G.flow || (s.phase !== 'main' && s.phase !== 'combat') || s.players[G.me].out) return null;
  if (tutStep()?.next) return null; // the lesson's own Next comes first
  if (G.atk && myMain()) {
    const p = G.atk.target;
    if (p == null) return null;
    const label = s.players.length === 2 ? 'Attack' : `Attack ${shortName(s.players[p].name)}`;
    return { act: 'attack', p, label, gold: G.atk.att.length > 0, off: !G.atk.att.length };
  }
  if (iBlock()) {
    if (G.blk?.pairs.length) return { act: 'block', label: 'Block', gold: true };
    const t = fightPreview(s), lost = t ? s.players[G.me].life - t.players[G.me].life : 0;
    return { act: 'block', label: t?.players[G.me].out ? 'No block (you’re out!)' : lost > 0 ? `No block (take ${lost})` : 'No block', gold: true };
  }
  if (iTrick()) return { act: 'pass', label: 'Fight', gold: true };
  if (myMain() && canStartAttack()) return { act: 'attack-open', label: 'Attack', gold: true };
  if (myMain()) return { act: 'end', label: endArmed() ? 'End turn anyway' : 'End turn', gold: !anythingToDo(), armed: endArmed() };
  return null;
}

// The button on the strip under the table (none while a fight's screen is up: it has its own).
function goHTML() {
  return decision() ? '' : goButton();
}

function goButton() {
  const go = goAction();
  if (!go) return '';
  return `<button class="btn g-go${go.gold ? ' primary' : ''}${go.armed ? ' armed' : ''}" data-act="go" data-go="${go.act}"${go.p != null ? ` data-p="${go.p}"` : ''}${go.off ? ' disabled' : ''} data-key="go">${esc(go.label)}</button>`;
}

function goTap(el) {
  if (!G || G.busy) return;
  const act = el.dataset.go;
  const w = act === 'end' && !tutStep() ? endSlip(S()) : null; // Energy, and a creature or Relic still to play: ask
  if (w) { G.endArm = 0; G.slip = { a: { t: 'end', p: G.me }, ...w }; G.sheet = slipSheet(G.slip); redraw(); return; }
  if (act === 'end' && !tutStep() && anythingToDo() && !endArmed()) {
    G.endArm = Date.now();
    toast(canStartAttack() ? 'You can still attack. Tap again to end your turn.' : 'You can still play a card. Tap again to end.', 2200);
    redraw();
    setTimeout(() => { if (G?.endArm && !endArmed()) { G.endArm = 0; redraw(); } }, END_ARM_MS + 50);
    return;
  }
  G.endArm = 0;
  onAct(act, el); // 'attack' reads data-p
}

// ── three players: two sides at a time ────────────────────────────
// The table is laid out as in a duel: the two sides in play (whoever is
// fighting; otherwise you and the opponent in focus), and the third folds to
// its bar. Whoever moves comes up, a move that touches a folded side opens it
// first (all three for one that touches everyone), and a tap on a folded bar
// (or a sideways swipe across the top) opens it.
const focusOf = (s) => {
  const opp = s.players.filter((P) => P.i !== G.me);
  const live = opp.filter((P) => !P.out);
  return (live.find((P) => P.i === G.focus) || live[0] || opp[0]).i;
};

function openSides(s) {
  const all = new Set(s.players.map((P) => P.i));
  if (all.size < 3 || G.showAll) return all;
  if (G.reveal) return G.reveal.size >= 3 ? all : new Set(G.reveal);
  const C = s.combat || (G.atk && G.atk.target != null && myMain() ? { a: G.me, d: G.atk.target } : null);
  if (C) return new Set([C.a, C.d]);
  const open = new Set([G.me, focusOf(s)]);
  // choosing a target: every side with something to pick opens
  const st = G.flow?.steps[G.flow.i];
  for (const o of st?.options || []) if (o.uid != null && s.cards[o.uid]?.zone === 'board') open.add(s.cards[o.uid].ctrl);
  return open.size >= 3 ? all : open;
}

// Folded bars go to the top; with you folded (two others in play) the one
// acting is on top, then the middle, then the other, as in a duel.
function sideOrder(s, open) {
  if (open.size === s.players.length) return null;
  const ord = {};
  for (const P of s.players) if (!open.has(P.i)) ord[P.i] = 0;
  if (open.has(G.me)) {
    for (const p of open) if (p !== G.me) ord[p] = 1;
    ord.mid = 2; ord[G.me] = 3;
  } else {
    const C = s.combat;
    const top = C && open.has(C.a) ? C.a : G.revealTop != null && open.has(G.revealTop) ? G.revealTop : [...open][0];
    for (const p of open) ord[p] = p === top ? 1 : 3;
    ord.mid = 2; ord[G.me] = 4;
  }
  return ord;
}

// Whose rows a move touches (where a card lands, whose creature is hit), and which creatures.
function involved(events, s0, after) {
  const who = new Set(), uids = new Set();
  const ctrl = (u) => (s0.cards[u]?.zone === 'board' ? s0.cards[u].ctrl : after.cards[u]?.ctrl);
  const touch = (u) => { uids.add(u); who.add(ctrl(u)); };
  for (const e of events) {
    if (e.k === 'play' && e.cid && BY_ID[e.cid]?.type === 'creature') who.add(e.p);
    if (e.k === 'play' && e.target?.uid != null) touch(e.target.uid);
    if (e.k === 'die' && e.uid != null) { uids.add(e.uid); who.add(e.ctrl); }
    if (['strike', 'dmg', 'buff', 'clash', 'bounce', 'transform', 'freeze', 'steal', 'chime', 'use', 'attack', 'block'].includes(e.k) && e.uid != null) touch(e.uid);
    if ((e.k === 'clash' || e.k === 'strike') && typeof e.to === 'number') touch(e.to);
    if (e.k === 'breath') who.add(e.p);
  }
  who.delete(undefined);
  return { who, uids };
}

// Before a move plays out on the table: whoever made it comes up, and the
// sides it touches open. Returns true when the open sides changed.
function revealFor(events, a, s0, after) {
  if (s0.players.length < 3) return false;
  const was = [...openSides(s0)].sort().join();
  if (a && a.p !== G.me && ['play', 'use', 'attack', 'phoenix'].includes(a.t)) G.focus = a.p;
  const open = openSides(s0);
  const { who: need, uids } = involved(events, s0, after);
  if (![...need].every((p) => open.has(p))) {
    const want = new Set(need);
    if (a?.p != null) want.add(a.p);
    if (want.size < 2) want.add(G.me);
    G.reveal = want;
    G.revealTop = a?.p;
  }
  // in a fight the opponents' other creatures are out of view: one the move touches brings them back
  const C = s0.combat;
  if (C && !G.reveal) {
    const inFight = new Set([...C.att, ...Object.values(blockersOf(s0)).flat()]);
    if ([...uids].some((u) => !inFight.has(u) && s0.cards[u]?.zone === 'board' && s0.cards[u].ctrl !== G.me)) { G.reveal = new Set(open); G.revealTop = C.a; return true; }
  }
  return [...openSides(s0)].sort().join() !== was;
}

// A tap on a folded bar opens that side (in a fight: everyone, until it's over).
function unfold(p) {
  const s = S();
  if (s.combat || (G.atk && G.atk.target != null)) G.showAll = true;
  else if (p !== G.me) G.focus = p;
  redraw();
}

// A sideways swipe across the opponent at the top brings up the other one.
function focusSwipe(e) {
  if (!G || G.sheet || S().players.length < 3 || !e.target.closest?.('.g-side.opp')) return;
  const x0 = e.clientX, y0 = e.clientY;
  const up = (ev) => {
    removeEventListener('pointerup', up, true);
    const dx = ev.clientX - x0, dy = ev.clientY - y0;
    if (!G || Math.abs(dx) < 60 || Math.abs(dy) > 45 || S().combat) return;
    const opp = S().players.filter((P) => P.i !== G.me && !P.out);
    if (opp.length < 2) return;
    const cur = focusOf(S());
    G.focus = opp.find((P) => P.i !== cur).i;
    G.tapAt = performance.now(); // the swipe isn't also a tap on a card
    redraw();
  };
  addEventListener('pointerup', up, true);
}

// SATTC Ultra: the Field everyone plays under, as a banner in the middle (a tap reads it).
function fieldHTML(s) {
  if (s.field == null) return '';
  const f = s.cards[s.field], d = BY_ID[f.cid];
  const whose = f.ctrl === G.me ? 'Your Field' : `${esc(poss(shortName(s.players[f.ctrl].name)))} Field`; // (cards that say “your Field” count it as its player’s)
  const lifts = f.cid === 'rolling-fog' && s.uv >= 5 ? ` · lifts in ${3 - (f.clock || 0)}` : ''; // (version 5: the fog lifts at its owner's third turn)
  return `<button class="g-field" data-key="field" data-act="field-info" data-uid="${f.uid}" style="${factionVars(d)}"><span>${whose}${lifts}</span><b>${esc(d.name)}</b></button>`;
}

function tableHTML() {
  const s = S(), me = s.players[G.me];
  const hl = highlights();
  const others = [];
  for (let k = 1; k < s.players.length; k++) others.push(s.players[(G.me + k) % s.players.length]);
  const st = tutStep();
  const bv = battleView(s);
  const open = openSides(s), ord = sideOrder(s, open);
  const folded = (P) => !open.has(P.i);
  const order = (k) => (ord ? ` style="order: ${ord[k] ?? 0}"` : '');
  // (the opponent under the middle, when you are folded, has its row first and its bar under it, as yours)
  const low = (P) => (ord && ord[P.i] === 3 && !open.has(G.me) ? ' low' : '');
  const row = (P) => (folded(P) ? '' : `<div class="tc-row">${P.board.filter((u) => !bv?.inZone.has(u)).map((u) => creatureHTML(s, s.cards[u], hl)).join('')}</div>`);
  return `
    <div class="g-top">
      <button class="g-icon" data-act="menu" aria-label="Menu (how the table works, game log, take back a move, leave)">☰</button>
      <div class="g-status">${statusHTML()}</div>
      <button class="g-icon g-bulb${myMove() && !st && !G.flow ? '' : ' off'}${G.suggest ? ' on' : ''}" data-act="suggest" aria-label="Suggest a move">💡</button>
    </div>
    <div class="g-table">
      ${others.map((P) => `<section class="g-side opp${s.active === P.i ? ' active' : ''}${P.out ? ' out' : ''}${s.combat && (s.combat.a === P.i || s.combat.d === P.i) ? ' in-fight' : ''}${folded(P) ? ' folded' : ''}${low(P)}" data-side="${P.i}"${order(P.i)}>${pbarHTML(s, P, hl, folded(P))}${row(P)}</section>`).join('')}
      <div class="g-mid"${order('mid')}>${bv ? battleHTML(s, bv, hl) : ''}${fieldHTML(s)}<div class="g-say" data-key="say">${midHTML()}</div></div>
      <section class="g-side me${s.active === G.me ? ' active' : ''}${me.out ? ' out' : ''}${folded(me) ? ' folded' : ''}" data-side="${G.me}"${order(G.me)}>${row(me)}${pbarHTML(s, me, hl, folded(me))}</section>
      ${st && !decision() ? coachHTML(st) : ''}${recapHTML()}
    </div>
    <div class="g-actions">${actionsHTML()}</div>
    <div class="tc-hand g-hand${myMove() ? '' : ' wait'}${me.out ? ' out' : ''}">${handHTML(s)}</div>
    ${decideHTML(s)}
    <svg class="g-lines" aria-hidden="true"></svg>
    ${s.phase === 'over' ? overHTML() : ''}
    ${G.stale ? STALE_GAME : ''}
    ${G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div>${G.viewer || G.flow ? '' : GRAB}</div>` : ''}`;
}

const STALE_GAME = `<div class="g-stale" data-key="stale"><div><b>This phone has a different version of the game from the others.</b>
  Reload the page. If this note is still here, reload every phone and start a new game from the lobby.</div>
  <button class="btn primary" data-act="reload">Reload</button><button class="btn ghost" data-act="leave">Back to the lobby</button></div>`;

// ── updating the page in place ──────────────────────────────────────
// Rebuilding the whole table on every move made phones re-lay-out and
// repaint every card. Instead the new markup is merged into what is there:
// cards keep their elements (pictures, running animations, the hand's fan),
// and only what changed is touched.
const keyOf = (n) => (n.nodeType === 1 ? n.getAttribute('data-uid') ?? n.getAttribute('data-side') ?? n.getAttribute('data-key') : null);
// Classes the animation layer puts on cards itself; a redraw leaves them alone.
const FX_CLASS = /^(fx-|dragging$|returning$|touched$|aim$|aiming$|drop-ok$)/;
const tplProps = new WeakMap(); // element -> style properties that came from the markup

function morphChildren(parent, html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  syncChildren(parent, tpl.content);
}

function syncChildren(from, to) {
  const old = [...from.childNodes];
  const keyed = new Map();
  for (const n of old) { const k = keyOf(n); if (k != null) keyed.set(`${n.nodeName}|${k}`, n); }
  const loose = old.filter((n) => keyOf(n) == null);
  const used = new Set();
  let u = 0, i = 0;
  for (const nn of [...to.childNodes]) {
    const k = keyOf(nn);
    let match = null;
    if (k != null) match = keyed.get(`${nn.nodeName}|${k}`) || null;
    else {
      while (u < loose.length && used.has(loose[u])) u++;
      if (loose[u] && loose[u].nodeName === nn.nodeName) match = loose[u++];
    }
    if (match && !used.has(match)) {
      used.add(match);
      syncNode(match, nn);
      if (from.childNodes[i] !== match) from.insertBefore(match, from.childNodes[i] || null);
    } else {
      const fresh = document.importNode(nn, true);
      noteStyles(fresh);
      from.insertBefore(fresh, from.childNodes[i] || null);
    }
    i++;
  }
  while (from.childNodes.length > i) from.removeChild(from.lastChild);
}

// A node added fresh: remember which of its style properties came from the
// markup, so a later redraw that reuses it for something else clears them.
function noteStyles(node) {
  if (node.nodeType !== 1) return;
  for (const el of [node, ...node.querySelectorAll('[style]')]) {
    const st = el.getAttribute('style');
    if (st) tplProps.set(el, new Set(st.split(';').filter((d) => d.includes(':')).map((d) => d.slice(0, d.indexOf(':')).trim())));
  }
}

function syncNode(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  if (a.isEqualNode(b)) return;
  for (const { name } of [...a.attributes]) if (name !== 'class' && name !== 'style' && !b.hasAttribute(name)) a.removeAttribute(name);
  for (const { name, value } of [...b.attributes]) {
    if (name === 'class' || name === 'style') continue;
    if (a.getAttribute(name) !== value) a.setAttribute(name, value);
  }
  syncClass(a, b.getAttribute('class') || '');
  syncStyle(a, b.getAttribute('style') || '');
  syncChildren(a, b);
}

function syncClass(a, cls) {
  const want = new Set(cls.split(/\s+/).filter(Boolean));
  for (const c of [...a.classList]) if (!want.has(c) && !FX_CLASS.test(c)) a.classList.remove(c);
  for (const c of want) if (!a.classList.contains(c)) a.classList.add(c);
}

// Only the properties written in the markup are synced; the animation layer's own
// inline properties (fan slots, FLIP offsets) are left as they are.
function syncStyle(a, style) {
  const want = new Map();
  for (const decl of style.split(';')) {
    const at = decl.indexOf(':');
    if (at > 0) want.set(decl.slice(0, at).trim(), decl.slice(at + 1).trim());
  }
  const had = tplProps.get(a) || new Set();
  for (const p of had) if (!want.has(p)) a.style.removeProperty(p);
  for (const [p, v] of want) if (a.style.getPropertyValue(p).trim() !== v) a.style.setProperty(p, v);
  tplProps.set(a, new Set(want.keys()));
}

// Draw the position in G.view. No animation here.
function draw(root) {
  const s = S(), me = s.players[G.me];
  if (G.viewer && !G.sheet?.startsWith('<div class="hv"')) G.viewer = null; // (whatever took the big view's place ended it)
  syncBlocks();
  if (s.phase === 'mulligan' && !me.mull) {
    root.className = 'g-mull';
    morphChildren(root, (s.ultra && !ultraIntroSeen ? ultraIntroHTML() : ultraV2(s) && !ultraNewSeen ? ultraNewHTML() : mulliganHTML()) + (G.sheet ? `<div class="g-sheet" data-sheet="1"><div class="g-sheet-inner">${G.sheet}</div>${G.viewer ? '' : GRAB}</div>` : '') + (G.stale ? STALE_GAME : ''));
    return;
  }
  // three players with a side folded are laid out (and sized) as a duel
  if (G.showAll && !s.combat && !(G.atk && G.atk.target != null)) G.showAll = false; // that fight is over
  const duel = s.players.length === 2 || openSides(s).size === 2;
  // (`quiet`: in a fight the opponents' other creatures step out of view, unless a move touches one)
  const quiet = s.players.length > 2 && s.combat && !G.reveal && !G.showAll;
  const cls = (duel ? 'g-duel' : 'g-ffa') + (s.players.length > 2 ? ' g-three' : '') + (G.busy ? ' busy' : '') + (s.combat || G.atk ? ' fighting' : '') + (s.combat ? ' in-combat' : '') + (quiet ? ' quiet' : '') + (tutStep() ? ' lesson' : '') + (s.ultra ? ' ultra' : '');
  if (root.className !== cls) root.className = cls; // an unchanged class costs nothing to restyle
  morphChildren(root, tableHTML());
  FX.layoutHand(root.querySelector('.tc-hand'));
  fitDecision(root);
  // ring whatever the lesson (or a 💡 suggestion) is talking about
  const st = tutStep();
  const rings = st?.show || (G.suggest?.show && G.suggest.state === G.state ? G.suggest.show : null);
  if (rings && !G.sheet) for (const sel of rings) root.querySelectorAll(sel).forEach((el) => el.classList.add('coach-on'));
  placeCoach(root);
}

// Redraw after a tap: things that moved glide to their new places.
function redraw() {
  const root = document.getElementById('game');
  if (!root || !G) return;
  // (while a move waits for your tap the table holds still, so ☰ and its sheets can open over it)
  if (G.busy && !gates) { G.dirty = true; return; }
  const before = FX.capture(root);
  draw(root);
  drawLines(root);
  FX.flip(root, before, { duration: 260, enter: 'none' }).then(() => drawLines(root));
}

// Combat lines: attackers point at whoever they attack; blockers are tied to their attacker.
function drawLines(root) {
  const svg = root.querySelector('.g-lines');
  if (!svg || !G) return;
  const s = S();
  const rr = root.getBoundingClientRect();
  const at = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - rr.left + r.width / 2, y: r.top - rr.top + r.height / 2, r }; };
  const card = (u) => root.querySelector(`.tcard[data-uid="${u}"]:not(.in-hand)`);
  const bar = (p) => root.querySelector(`.pbar[data-p="${p}"]`);
  const lines = [];
  const C = s.combat;
  if (C) {
    const blk = blockersOf(s);
    // blocked attackers face their blockers in the battle zone; the rest head for the player
    for (const a of C.att) if (!blk[a]?.length) lines.push([card(a), bar(C.d), 'attack']);
  } else if (G.atk) {
    for (const a of G.atk.att) if (G.atk.target != null) lines.push([card(a), bar(G.atk.target), 'attack']);
    for (const [a, p] of G.atk.hunt) lines.push([card(a), card(p), 'hunt']);
  }
  svg.setAttribute('viewBox', `0 0 ${rr.width} ${rr.height}`);
  svg.innerHTML = `<defs><marker id="gl-head" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#ff7b4d"/></marker></defs>` +
    lines.filter(([a, b]) => a && b).map(([a, b, kind]) => {
      const p = at(a), q = at(b);
      // stop at the edge of the target rather than its middle
      const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
      const back = kind === 'attack' ? Math.min(q.r.height / 2 + 2, len / 3) : 0;
      const ex = q.x - (dx / len) * back, ey = q.y - (dy / len) * back;
      const mx = (p.x + ex) / 2 + dy * 0.12, my = (p.y + ey) / 2 - dx * 0.12;
      return `<path class="gl ${kind}" d="M${p.x.toFixed(1)},${p.y.toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}"${kind === 'block' ? '' : ' marker-end="url(#gl-head)"'}/>`;
    }).join('');
}

// ── animation of a move ─────────────────────────────────────────────
// Fights you are in come up big, step by step (js/fightview.js); the rest
// play out on the table. 'collective.bigFights' = '0' turns it off (tests).
const bigFights = () => { try { return localStorage.getItem('collective.bigFights') !== '0'; } catch { return true; } };

async function present(events, after, quick = false, a = null) {
  const root = document.getElementById('game');
  if (!root || !G) return;
  // every fight is kept as a story, so the note after it can play it again
  let story = null;
  if (events.some((e) => e.k === 'fight')) { try { story = Fight.fightStory(S(), after, events, G.me); } catch (e) { console.error(e); } }
  if (story) G.lastFight = story;
  // Skip: straight to the result until it's your move
  if (quick || G.skipping) {
    G.view = after; draw(root); drawLines(root);
    if (G.skipping && (myMove() || after.phase === 'over')) G.skipping = false;
    return;
  }
  const tap = tapThrough();
  const line = tap ? moveLine(S(), a, events) : '';
  G.busy = true;
  root.classList.add('busy');
  // three players: whoever moved comes up, and the sides the move touches open first
  if (revealFor(events, a, S(), after)) {
    const was = FX.capture(root);
    draw(root);
    drawLines(root);
    await capped(FX.flip(root, was, { duration: 260, enter: 'fade' }), 900);
  }
  try {
    if (events.length && root.querySelector('.g-table')) {
      // a fight comes up big: yours always, two others' too when moves wait for your tap
      if (story && bigFights() && (story.mine || tap)) {
        await capped(animateOld(root, events.slice(0, events.findIndex((e) => e.k === 'fight')), after), 20000);
        if (G && !G.skipping) await Fight.playStory(story, { stage: root, tap });
      } else await capped(animateOld(root, events, after), 20000);
    }
  } catch (e) { console.error(e); }
  if (!G) return;
  if (events.some((e) => e.k === 'fight')) G.fightNote = fightNoteText(events);
  G.showBlk = null;
  const before = FX.capture(root);
  G.view = after;
  G.dirty = false;
  draw(root);
  drawLines(root);
  try {
    await capped(FX.flip(root, before), 2500);
    drawLines(root);
    await capped(animateNew(root, events), 2500);
  } catch (e) { console.error(e); }
  // another player's move waits on the new table for your tap (an attack between the other two, say)
  if (line && G && !G.skipping) await tapToGoOn(line);
  if (!G) return;
  G.busy = false;
  root.classList.remove('busy');
  // the sides opened for this move fold again
  if (G.reveal) { G.reveal = null; G.revealTop = null; G.dirty = true; }
  if (G.skipping && (myMove() || S().phase === 'over')) G.skipping = false;
  // (a fight to decide now comes up on its own screen)
  if (G.dirty || decision()) redraw();
}

const el = (root, uid) => root.querySelector(`.tcard[data-uid="${uid}"]:not(.in-hand), .relic[data-uid="${uid}"]`);
const barEl = (root, p) => root.querySelector(`.pbar[data-p="${p}"]`);
const DMG = new Set(['strike', 'dmg', 'hitPlayer', 'life', 'buff']);

// On the old table: show what happens, in order.
async function animateOld(root, events, after = G.state) {
  const s0 = S();
  let i = 0;
  const lifeShown = new Set();
  while (i < events.length) {
    const e = events[i];
    if (e.k === 'play') {
      i++;
      const d = e.cid ? BY_ID[e.cid] : null;
      const from = e.p === G.me ? root.querySelector(`.tcard[data-uid="${e.uid}"]`)?.getBoundingClientRect() : barEl(root, e.p)?.getBoundingClientRect();
      if (e.p === G.me && (!d || d.type !== 'spell')) continue; // your creatures and Relics glide over from your hand
      const html = d ? cardHTML(d) : cardBackHTML();
      if (e.p === G.me) root.querySelector(`.tcard[data-uid="${e.uid}"]`)?.classList.add('fx-hidden');
      const target = e.target ? (e.target.p != null ? barEl(root, e.target.p) : el(root, e.target.uid)) : e.sac != null ? el(root, e.sac) : null;
      const look = { fromRect: from, hold: e.p === G.me ? 350 : d ? 1050 : 650, flip: e.p !== G.me && !!d, width: e.p === G.me ? 0.55 : 0.7 };
      // another player's card stays up big until you tap
      if (e.p !== G.me && tapThrough()) look.until = () => tapToGoOn(playLine(s0, e, d));
      if (d && d.type === 'spell') {
        // what the spell does is everything up to the next move
        let j = i;
        while (j < events.length && !['play', 'attack', 'turn', 'fight'].includes(events[j].k)) j++;
        const effects = events.slice(i, j);
        i = j;
        const effect = async () => {
          const ar = target && FX.arrow(barEl(root, e.p), target, { duration: 600, color: colorOf(e.cid) });
          if (ar) await ar.finished;
          await animateOld(root, effects, after);
        };
        // it lands on its owner's discard pile (tokens vanish, Echo cards leave the game)
        const pile = after.cards[e.uid]?.zone === 'discard' ? root.querySelector(`.tc-pile[data-pile="${s0.cards[e.uid]?.owner ?? e.p}"]`) : null;
        await FX.showCard(html, { ...look, ...(pile ? { toPile: pile } : {}), during: effect });
        continue;
      }
      // An opponent's creature or Relic is put down where it will sit.
      const toRect = e.p !== G.me && d ? landingRect(root, e.p, d.type) : undefined;
      await FX.showCard(html, { ...look, toRect });
      continue;
    }
    if (e.k === 'fuse' && e.hand && e.p !== G.me) {
      i++;
      const d = BY_ID[e.cid], into = s0.cards[e.to];
      const look = { fromRect: barEl(root, e.p)?.getBoundingClientRect(), hold: 1050, flip: true, width: 0.7, toRect: el(root, e.to)?.getBoundingClientRect() };
      if (tapThrough()) look.until = () => tapToGoOn(`<b>${esc(name(e.p))}</b> fuses <b>${esc(d.name)}</b> into ${into?.ctrl === e.p ? 'their' : 'a'} <b>${esc(BY_ID[into?.cid]?.name || 'creature')}</b>: +${d.power}/+${d.vitality} for good.`);
      await FX.showCard(cardHTML(d), look);
      const n = el(root, e.to);
      if (n) await FX.burst(n, { color: '#ffb35c' });
      continue;
    }
    if (e.k === 'attack') {
      const group = [];
      while (i < events.length && events[i].k === 'attack') group.push(events[i++]);
      const d = group[0].target.p;
      const atk = s0.cards[group[0].uid]?.ctrl;
      const label = d === G.me ? `${name(atk)} attacks you!` : atk === G.me ? `You attack ${name(d)}` : `${name(atk)} attacks ${name(d)}`;
      const sub = group.length > 2 ? `with ${group.length} creatures` : `with ${listNames(group.map((g) => BY_ID[s0.cards[g.uid].cid].name))}`;
      const arrows = group.map((g) => FX.arrow(el(root, g.uid), barEl(root, d), { duration: 1000, color: '#ff6a3d' }));
      // the whole screen only when it's about you; two others fighting gets a note
      // (or, when moves wait for your tap, the line under the table afterwards)
      const say = d === G.me || atk === G.me ? FX.banner(label, { sub, tone: d === G.me ? 'foe' : 'mine' }) : tapThrough() ? null : toast(`⚔ ${label}`);
      await Promise.all([say, ...arrows.map((a) => a?.finished)]);
      continue;
    }
    if (e.k === 'block') {
      const group = [];
      while (i < events.length && events[i].k === 'block') group.push(events[i++]);
      await Promise.all(group.map((g) => FX.arrow(el(root, g.uid), el(root, g.att), { duration: 550, color: '#bfe6ff' })?.finished));
      // The blockers step into the battle zone before the fight plays out
      // (when nobody can answer with a Trick, the fight comes in the same move).
      G.showBlk = {};
      for (const g of group) (G.showBlk[g.att] ||= []).push(g.uid);
      const before = FX.capture(root);
      draw(root);
      drawLines(root);
      await capped(FX.flip(root, before), 900);
      await FX.wait(300);
      continue;
    }
    if (e.k === 'fight' || e.k === 'strike') {
      // One damage step: everything that strikes at the same time.
      if (e.k === 'fight') i++;
      const strikes = [];
      while (i < events.length && DMG.has(events[i].k)) {
        const x = events[i++];
        if (x.k === 'strike') strikes.push({ from: x.uid, to: x.to, n: 0 });
        else if ((x.k === 'dmg' || x.k === 'hitPlayer') && x.src != null) { const sk = [...strikes].reverse().find((t) => t.from === x.src); if (sk) sk.n += x.n; }
        else if (x.k === 'life' && x.n > 0) lifeShown.add(x);
      }
      await strikeAll(root, strikes);
      continue;
    }
    if (e.k === 'die') {
      const group = [];
      while (i < events.length && events[i].k === 'die') group.push(events[i++]);
      const deaths = group.map((g) => {
        const node = el(root, g.uid);
        return node ? FX.death(node, { style: BY_ID[g.cid]?.token ? 'light' : 'crumble', color: colorOf(g.cid), of: group.length }) : null;
      });
      await Promise.race([Promise.all(deaths), FX.wait(1000)]);
      continue;
    }
    if (e.k === 'dmg' || e.k === 'hitPlayer' || e.k === 'buff' || e.k === 'life' || e.k === 'heal') {
      // Damage from spells and abilities, life changes, boosts, healing (Ultra): all at once.
      const group = [];
      while (i < events.length && ['dmg', 'hitPlayer', 'buff', 'life', 'heal'].includes(events[i].k)) group.push(events[i++]);
      const dmg = group.filter((g) => g.k === 'dmg');
      if (dmg.length >= 3 && !dmg[0].src) {
        await Promise.race([FX.wave(root.querySelector('.g-table'), { color: '#ff8a3d', targets: dmg.map((g) => el(root, g.uid)).filter(Boolean) }), FX.wait(650)]);
      }
      const hits = new Set(group.filter((g) => g.k === 'hitPlayer').map((g) => g.p));
      group.forEach((g) => {
        if (g.k === 'dmg') { const n = el(root, g.uid); if (!n) return null; if (dmg.length < 3) FX.impact(n, { strength: g.n }); return FX.number(n, `−${g.n}`, { kind: 'damage' }); }
        if (g.k === 'hitPlayer') { const b = barEl(root, g.p); FX.impact(b, { strength: g.n }); return FX.number(b, `−${g.n}`, { kind: 'damage' }); }
        if (g.k === 'life') {
          if (lifeShown.has(g) || (g.n < 0 && hits.has(g.p))) return null;
          return FX.number(barEl(root, g.p), g.n > 0 ? `+${g.n}` : `−${-g.n}`, { kind: g.n > 0 ? 'heal' : 'damage' });
        }
        if (g.k === 'buff') {
          const n = el(root, g.uid);
          if (!n || (!g.dP && !g.dV)) return n ? FX.burst(n, { color: '#b07cff' }) : null;
          return FX.number(n, g.dV ? `+${g.dP}/+${g.dV}` : `+${g.dP}`, { kind: 'buff' });
        }
        if (g.k === 'heal') { const n = el(root, g.uid); return n ? FX.number(n, `+${g.n}`, { kind: 'heal' }) : null; }
        return null;
      });
      await FX.wait(group.some((g) => g.k !== 'buff') ? 420 : 260);
      continue;
    }
    i++;
    switch (e.k) {
      case 'trap': {
        const d = BY_ID[e.cid];
        // a Trap springing is a surprise: it waits for your tap whoever set it
        const until = tapThrough() ? () => tapToGoOn(`${e.p === G.me ? 'Your' : `<b>${esc(poss(name(e.p)))}</b>`} Trap springs: <b>${esc(d.name)}</b>.`) : undefined;
        await Promise.all([FX.banner('Trap!', { sub: `${name(e.p)}: ${d.name}`, tone: e.p === G.me ? 'mine' : 'foe' }),
          FX.showCard(cardHTML(d), { fromRect: barEl(root, e.p)?.getBoundingClientRect(), hold: 900, flip: true, until })]);
        break;
      }
      case 'breath': {
        const side = root.querySelector(`.g-side[data-side="${e.p}"]`);
        await FX.wave(side || root, { color: '#ff7a2e', dir: 'down' });
        break;
      }
      case 'clash': await FX.clash(el(root, e.uid), el(root, e.to), { color: colorOf(s0.cards[e.uid]?.cid) }); break;
      case 'countered': await FX.banner('Canceled!', { sub: 'Countercurrent', tone: 'info' }); break;
      case 'bounce': case 'transform': case 'freeze': case 'steal': {
        const n = el(root, e.uid);
        if (n) await FX.burst(n, { color: e.k === 'freeze' ? '#d6ecff' : e.k === 'steal' ? '#ff9a6b' : '#8fe0ee' });
        break;
      }
      case 'use': {
        // an ability (or the Bone Altar): a gold flash, the Energy paid, a line to its target
        const n = el(root, e.uid), d = BY_ID[e.cid], ab = d?.ability;
        if (ab && e.p !== G.me && !tapThrough()) toast(`⚡ ${name(e.p)}: ${d.name}, ${ab.short}`, 1600);
        if (n) { FX.burst(n, { color: ab ? '#ffd76a' : '#b07cff' }); if (ab) FX.number(n, `⚡${ab.cost}`, { kind: 'buff' }); }
        const t = e.target?.uid != null ? el(root, e.target.uid) : null;
        const ar = n && t && FX.arrow(n, t, { duration: 550, color: '#ffd76a' });
        if (ar) await ar.finished; else await FX.wait(ab && e.p !== G.me ? 700 : 380);
        break;
      }
      case 'crown': {
        const msg = e.p == null ? 'The Crown is back in the middle' : e.p === G.me ? 'You take the Crown!' : `${name(e.p)} takes the Crown!`;
        const sub = e.p == null ? 'Hit someone in a fight to take it' : e.p === G.me ? 'You draw an extra card at the end of each of your turns' : 'Hit them in a fight to take it';
        // the first Crown, and any Crown you win or lose, get the whole screen; the rest a note
        const big = e.p === G.me || e.from === G.me || e.from == null;
        await Promise.all([
          big ? FX.banner(msg, { sub, tone: e.p === G.me ? 'mine' : e.from === G.me ? 'foe' : 'info' }) : toast(`👑 ${msg}`),
          flyCrown(root, e.from != null ? barEl(root, e.from) : null, e.p != null ? barEl(root, e.p) : null),
        ]);
        break;
      }
      case 'crownDraw': { const b = barEl(root, e.p); if (b) await FX.number(b, '👑 +1 card', { kind: 'buff' }); break; }
      case 'levelup': {
        const d = BY_ID[e.cid], u = S().players[e.p].board.find((x) => S().cards[x].cid === e.cid);
        const n = u != null ? el(root, u) : null;
        if (n) FX.burst(n, { color: '#ffd76a' });
        await FX.banner(`${e.p === G.me ? 'Your' : `${name(e.p)}’s`} ${d.name.split(',')[0]}: Level ${e.level}!`, { sub: levelLine(d, e.level), tone: e.p === G.me ? 'mine' : 'foe' });
        break;
      }
      case 'chime': { const n = el(root, e.uid); if (n) await FX.number(n, `🔔 ${e.n || 3}/3`, { kind: 'buff' }); break; }
      // SATTC Ultra
      case 'invest': { const b = barEl(root, e.p); if (b) await FX.number(b, '⚡ +1 for good', { kind: 'buff' }); break; }
      case 'field': {
        const d = BY_ID[S().cards[e.uid]?.cid];
        if (d) await FX.banner(`The Field: ${d.name}`, { sub: d.text.replace(/^Field\n/, ''), tone: e.p === G.me ? 'mine' : 'foe' });
        break;
      }
      case 'fuse': { const n = el(root, e.to); if (n) await FX.burst(n, { color: '#ffb35c' }); break; }
      case 'erupt': {
        const n = el(root, e.uid);
        if (n) FX.burst(n, { color: '#ff5a2a' });
        await Promise.race([FX.wave(root.querySelector('.g-table'), { color: '#ff5a2a' }), FX.wait(700)]);
        break;
      }
      case 'legacy': { const n = el(root, e.uid); if (n) await FX.number(n, 'Legacy', { kind: 'buff' }); break; }
      default: break;
    }
  }
}

// A quiet note at the top of the table for what doesn't need the whole screen
// (someone else's turn, two others fighting). It lives outside the redrawn table.
function toast(text, ms = 1300) {
  document.querySelectorAll('.g-toast').forEach((x) => x.remove());
  const box = document.createElement('div');
  box.className = 'g-toast';
  box.textContent = text;
  document.body.appendChild(box);
  const anim = box.animate([
    { opacity: 0, transform: 'translate(-50%, -6px)' },
    { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.12 },
    { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.82 },
    { opacity: 0, transform: 'translate(-50%, -4px)' },
  ], { duration: ms, fill: 'forwards' });
  // the game waits only for the first moment of it
  anim.finished.catch(() => {}).then(() => box.remove());
  return FX.wait(Math.min(ms, 700));
}

// The Crown flies from its old holder's name (or the middle) to the new one's.
async function flyCrown(root, fromEl, toEl) {
  const box = document.createElement('div');
  box.className = 'fx-crown';
  box.innerHTML = ICON.crown;
  box.style.left = '0';
  box.style.top = '0';
  document.body.appendChild(box);
  const rr = root.getBoundingClientRect();
  const spot = (bar) => {
    if (!bar) return { x: rr.left + rr.width / 2, y: rr.top + rr.height * 0.45 };
    const r = (bar.querySelector('.pb-name') || bar).getBoundingClientRect();
    return { x: r.left + 12, y: r.top + r.height / 2 };
  };
  const a = spot(fromEl), b = spot(toEl);
  const at = (p, sc, o) => ({ transform: `translate(${p.x - 17}px, ${p.y - 15}px) scale(${sc})`, opacity: o });
  try {
    await box.animate([
      at(a, fromEl ? 0.7 : 0.3, fromEl ? 1 : 0),
      { ...at({ x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - 50 }, 1.7, 1), offset: 0.45 },
      at(b, toEl ? 0.65 : 0.3, toEl ? 1 : 0),
    ], { duration: 1150, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'forwards' }).finished;
  } catch { /* the page went away */ }
  box.remove();
}

// Where a newly played card will land: the end of that player's row (a Relic: their bar).
function landingRect(root, p, type) {
  if (type === 'relic') { const r = barEl(root, p)?.getBoundingClientRect(); return r && new DOMRect(r.left + 8, r.top, 40, r.height); }
  const row = root.querySelector(`.g-side[data-side="${p}"] .tc-row`);
  if (!row) return undefined;
  const cards = row.querySelectorAll('.tcard');
  const last = cards[cards.length - 1]?.getBoundingClientRect();
  const w = last?.width || parseFloat(getComputedStyle(row).getPropertyValue('--w-board-max')) || 64;
  const h = last?.height || w * 1.33;
  const r = row.getBoundingClientRect();
  const x = last ? Math.min(last.right + 6 + w / 2, r.right - w / 2) : r.left + r.width / 2;
  return new DOMRect(x - w / 2, r.top + (r.height - h) / 2, w, h);
}

// Every strike in one damage step at once: pairs that hit each other clash.
// One pair at a time, in the spotlight: the rest of the table dims, the two
// creatures fight (or the attacker charges the player), the numbers stay up
// long enough to read, then the next pair.
async function strikeAll(root, strikes) {
  const done = new Set();
  const hit = (target, n) => { if (target && n) FX.number(target, `−${n}`, { kind: 'damage' }); };
  root.classList.add('spotlight');
  for (const sk of strikes) {
    if (done.has(sk)) continue;
    done.add(sk);
    const a = el(root, sk.from);
    const toPlayer = sk.to && typeof sk.to === 'object';
    const b = toPlayer ? barEl(root, sk.to.p) : el(root, sk.to);
    const back = !toPlayer && strikes.find((t) => !done.has(t) && t.from === sk.to && t.to === sk.from);
    if (back) done.add(back);
    if (!a || !b) continue;
    const lit = [a, b, a.closest('.gb-col')].filter(Boolean);
    lit.forEach((x) => x.classList.add('focus'));
    await FX.wait(160);
    if (back) await FX.clash(a, b, { strength: Math.max(sk.n, back.n), onHit: () => { hit(b, sk.n); hit(a, back.n); } });
    else await FX.lunge(a, b, { strength: sk.n, color: toPlayer ? '#ff6a3d' : undefined, onHit: () => hit(b, sk.n) });
    await FX.wait(420);
    lit.forEach((x) => x.classList.remove('focus'));
  }
  root.classList.remove('spotlight');
}

// One line saying how a fight ended, shown until the next move.
function fightNoteText(events) {
  const s0 = S();
  const lost = new Map();
  for (const e of events) if (e.k === 'hitPlayer') lost.set(e.p, (lost.get(e.p) || 0) + e.n);
  const bits = [...lost].map(([p, n]) => `${p === G.me ? 'You' : esc(shortName(s0.players[p].name))} took <b>${n}</b>`);
  const died = events.filter((e) => e.k === 'die' && BY_ID[e.cid]?.type === 'creature')
    // with three players, "their" could be anyone's: name the owner
    .map((e) => `${e.ctrl === G.me ? 'your' : s0.players.length > 2 ? esc(poss(shortName(s0.players[e.ctrl].name))) : 'their'} ${esc(BY_ID[e.cid].name)}`);
  if (died.length) bits.push(`${listNames(died)} died`);
  return bits.length ? `⚔ ${bits.join(' · ')}` : '⚔ Nobody was hurt.';
}

// On the new table: turn banners.
async function animateNew(root, events) {
  const turn = events.find((e) => e.k === 'turn');
  if (!turn) return;
  const P = S().players[turn.p];
  // a new turn's banner replaces any that is still on screen (bots can be quick)
  document.querySelectorAll('#fx-layer .fx-banner').forEach((b) => b.remove());
  if (turn.p === G.me) {
    // "Since your last turn" sums up what you didn't see: with every move
    // waiting for your tap that's nothing, unless you skipped
    const sum = !tapThrough() || G.skipped;
    G.skipped = false;
    if (sum) G.recap = S().turn;
    redraw();
    FX.banner('Your turn', { sub: `${P.energy} Energy`, tone: 'mine' });
    // what the others did to you meanwhile, in one number on your bar
    const lost = recapInfo()?.lost || 0;
    if (sum && lost > 0 && !tutStep()) FX.number(barEl(root, G.me), `−${lost}`, { kind: 'damage' });
  }
  else toast(`${poss(shortName(P.name))} turn`, 1100);
  await FX.wait(turn.p === G.me ? 250 : 450);
}

// The first SATTC Ultra game on this phone: what's different, before the opening hand.
function ultraIntroHTML() {
  const s = S();
  return `<div class="g-full ultra-intro" data-key="ultra-intro">
    <div class="kicker muted small" style="letter-spacing:.2em">YOUR FIRST SATTC ULTRA GAME</div>
    <h2>What’s different</h2>
    <ul>
      <li><b>❤ ${s.players[G.me].life} Life.</b> Games run longer, so what you build has time to pay off.</li>
      <li><b>Wounds stay.</b> They heal by half at the start of their owner’s turn. Poison (☠, from Venom) doesn’t heal.</li>
      <li><b>🛡 New creatures are Sheltered:</b> opponents’ Spells and abilities can’t aim at them until their owner’s next turn.</li>
      <li><b>⚡ Energy</b> grows to 6 by itself. <b>Invest</b> cards raise it for good, up to 12.</li>
      <li><b>Growth lasts.</b> Some creatures <b>Grow</b> every turn or <b>Multiply</b>; an <b>Unstable</b> one erupts at 10 Power (💥8/10 shows how close). When a creature that grew dies, half its growth goes to your weakest (<b>Legacy</b>).</li>
      <li><b>One Field</b> (the banner in the middle) changes the rules for everyone. <b>Rituals</b> wait in your Relic row: pay one stage a turn. A <b>Hex</b> (⛓) holds a creature until its owner pays to break it.</li>
      <li><b>Tap any creature</b> to see what’s helping it.</li>
      ${ultraV2(s) ? `<li><b>★ Your Legend</b> waits at the left of your hand: play it when you can pay. It levels up as you play its way.</li>
      <li><b>Symbiotes</b> (Molten Core, Bark Graft, Wing Graft, Venom Shard) kill a weak creature to fuse into one of yours, from the turn after they arrive. They have no Shelter. <b>Dig</b>: 3 Energy for a card.</li>
      <li><b>Gang up</b>: two or more blockers on one attacker each hit 2 harder. A <b>Shield</b> (◈) stops one hit.</li>` : ''}
    </ul>
    <button class="btn primary" data-act="ultra-intro-ok">Got it: on to my opening hand</button>
  </div>`;
}

// For a phone that already knows Ultra: what its second version adds, once, before the opening hand.
function ultraNewHTML() {
  return `<div class="g-full ultra-intro" data-key="ultra-new">
    <div class="kicker muted small" style="letter-spacing:.2em">SATTC ULTRA HAS GROWN</div>
    <h2>What’s new</h2>
    <ul>
      ${ULTRA_V >= 5 ? `<li><b>Two decks the bots discovered</b>, each with its own Legend: <b>Spellbloom</b> (cheap Spells that grow your creatures for good) and <b>Fogbound</b> (hide in the fog, then Drain to win).</li>
      <li><b>Guerrilla cards</b> slow an opponent’s plans instead of fighting their creatures: Choking Smoke, Tollkeeper, Grave Robber, Pickpocket, Whispered Doubt and Blight Beetle.</li>
      <li><b>Simpler:</b> a creature sent back to the hand now comes back fresh, without its growth. <b>Toned down:</b> Spellwright Apprentice grows with your first Spell each turn, and the Rolling Fog lifts after three of your turns.</li>
      <li><b>From before:</b> ★ Legends, Ambush, Offering, your Field, Symbiotes, Dig, ganging up, Traps, Shields and the growth ceiling. The <b>?</b> in a game explains each.</li>` : ULTRA_V >= 4 ? `<li><b>Six new decks</b>, each with its own Legend: <b>The Long Game</b> (Invest, save Energy, draw), <b>Rot and Bloom</b> (sacrifice for power), <b>Smoke and Mirrors</b> (Tricks, Traps, Ambushes), <b>Storm Rising</b> (Spell after Spell), <b>Weathermakers</b> (choose the Field) and <b>The Charge</b> (hit first). Their biggest cards cost 7 or more: Energy beyond the usual 6, so each deck has its own way to Invest.</li>
      <li><b>New words.</b> <b>Ambush</b>: play it in a fight like a Trick; played before you block, it can block. <b>Offering</b>: as you play the card, you may sacrifice a creature of yours for the stronger effect. <b>Your Field</b>: one you played (the banner says whose).</li>
      <li><b>From before:</b> ★ Legends beside every deck, Symbiotes, Dig, ganging up, Traps, Shields that stack, and the growth ceiling. The <b>?</b> in a game explains each.</li>` : `
      <li><b>★ A Legend for every deck.</b> Yours waits at the left of your hand (it isn’t a card in your hand): play it whenever you can pay. It levels up as you play its way, even before it’s out. If it dies, it comes back to wait, 2 Energy dearer.</li>
      <li><b>Symbiotes.</b> Molten Core, Bark Graft, Wing Graft and Venom Shard are Symbiotes. From the turn after one arrives, tap its ⚡: it kills a creature it can kill in one hit, then joins one of yours for good (its Power, Vitality and keywords). They arrive without Shelter, so opponents get a turn to kill them, and a swarm of weak creatures is their food. Nothing fuses into a Legend.</li>
      <li><b>Dig</b> (bottom left, on your turn): pay ${ULTRA_V2.digCost} Energy to draw a card, once a turn.</li>
      <li><b>Gang up.</b> Two or more creatures blocking one attacker each hit ${ULTRA_V2.together} harder: many small ones can bring down a giant.</li>
      <li><b>Traps</b> wait face down and stop a big attacker for a while. <b>Shields</b> (◈) each stop one hit and stack, so a glass cannon can live.</li>
      ${ULTRA_V2.growthCap ? `<li><b>Growth has a ceiling:</b> a creature can’t grow for good by more than its controller’s maximum Energy (6, more with Invest), so a monster takes an economy.</li>` : ''}
      `}
    </ul>
    <button class="btn primary" data-act="ultra-new-ok">Got it: on to my opening hand</button>
  </div>`;
}

function mulliganHTML() {
  const s = S(), me = s.players[G.me];
  const first = s.players[s.first];
  return `<div class="g-full" data-key="mull">
    <div class="kicker muted small" style="letter-spacing:.2em">YOUR OPENING HAND</div>
    <h2>${s.first === G.me ? 'You go first' : `${esc(shortName(first.name))} goes first`}</h2>
    <p class="muted small" style="margin:0">Everyone has ${RULES.startEnergy} Energy on their first turn. ${s.first === G.me ? 'Going first, you skip your first draw.' : 'You also get a Spark: a free card that gives 1 extra Energy.'}</p>
    <div class="hand-row">${me.hand.map((u) => `<div class="mull-card" data-mull="${u}">${cardHTML(BY_ID[s.cards[u].cid])}</div>`).join('')}</div>
    <p class="muted small" style="margin:0">Tap a card to read it.</p>
    <p class="muted small" style="margin:0">Keep these, or shuffle them back and draw ${RULES.openingHand} new cards (once).</p>
    <p class="small" style="margin:0;color:#cfe6f5">💡 Not sure? The bot would ${chooseAction(s, G.me).redraw ? 'draw a new hand: too few cheap cards, or too many expensive ones' : 'keep this hand'}.</p>
    <div class="btn-row"><button class="btn primary" data-act="keep">Keep</button><button class="btn" data-act="redraw">Draw a new hand</button></div>
    <button class="btn ghost small" data-act="leave">Leave game</button>
  </div>`;
}

function overHTML() {
  const s = S();
  const win = s.winner === G.me;
  const score = G.mode === 'online' ? Ins.tonightLine(L?.results, s.players[G.me]?.name) : G.scoreLine || '';
  return `<div class="g-sheet"><div class="g-sheet-inner g-full" style="min-height:70vh;justify-content:center">
    <div class="winner">${win ? 'You win!' : `${esc(shortName(s.players[s.winner]?.name || 'Nobody'))} wins`}</div>
    ${G.rec ? Ins.overSummaryHTML(G.rec, { score }) : `<div class="over-how">${s.log.slice(-4).filter((l) => !/ wins!$|ends their turn|'s turn\.$/.test(l.text)).slice(-2).map((l) => `<div>${esc(speak(l.text))}</div>`).join('')}</div>`}
    <div class="btn-row">
      ${G.mode === 'online'
        ? '<button class="btn primary" data-act="lobby">Back to the lobby (swap cards, play again)</button>'
        : G.mode === 'tutorial'
          ? '<button class="btn primary" data-act="leave">Try a real practice game</button><button class="btn" data-act="tutorial">Replay the lesson</button>'
          : `<button class="btn primary" data-act="rematch">Play again</button>${!win ? '<button class="btn" data-act="undo">Take back a move</button>' : ''}`}
      <button class="btn ghost" data-act="leave">Leave</button>
    </div></div></div>`;
}

// ── sheets ──────────────────────────────────────────────────────────
function kwHelp(card, extra = [], skip = []) {
  const text = `${card.text || ''} ${extra.map((k) => KEYWORDS[k]?.name || '').join(' ')}`;
  const list = Object.values(KEYWORDS).filter((k) => k !== KEYWORDS.ability && !skip.includes(k) && new RegExp('\\b' + k.name + '\\b', 'i').test(text));
  if (card.ability) list.push(KEYWORDS.ability);
  const ultra = G?.state?.ultra || (!G && Mode.ultra());
  return list.map((k) => `<div><b>${k.name}</b> — ${esc((ultra && ULTRA_KEYWORDS[Object.keys(KEYWORDS).find((id) => KEYWORDS[id] === k)]) || k.text)}</div>`).join('');
}

// ── a card in plain words ───────────────────────────────────────────
// Over a big card (under one on a sheet): what kind of card it is and what
// it costs, its two numbers, each keyword on it, and the words in its text
// that carry a rule without being keywords (+1/+0, for good, this turn…).
const TERMS = [
  ['nn', /[+-]\d+\/[+-]\d+/, (m) => { const [p, v] = m[0].split('/'); return `<b>${m[0]}</b> — Power first, then Vitality: ${p} Power and ${v} Vitality.`; }],
  ['good', /\bfor good\b|\bpermanently\b/i, () => `<b>For good</b> — it lasts after the turn ends, as long as the card stays on the table.${G?.state?.ultra && G.state.uv >= 3 && ULTRA_V2.growthCap ? ' A creature can grow for good by no more than its controller’s maximum Energy.' : ''}`],
  ['turn', /\bthis turn\b|\buntil (?:the )?end of (?:(?:the|your|this) )?turn\b/i, () => '<b>This turn</b> — it wears off when the turn ends.'],
  ['heal', /\bheals?\b/i, () => '<b>Heal</b> — takes damage off a creature.'],
  ['spirit', /\bSpirits?\b/, () => '<b>Spirit</b> — a 1/1 token: a creature that isn’t a real card, so it’s gone for good once it leaves the table.'],
  ['token', /\btokens?\b/i, () => '<b>Token</b> — a creature a card makes. It isn’t a real card: it’s gone for good once it leaves the table.'],
  ['pile', /\bdiscard piles?\b/i, () => '<b>Discard pile</b> — where Spells go once played, and creatures when they die. Some cards bring them back.'],
  ['hand', /\bto (?:its|their) owners?.s? hands?\b/i, () => '<b>Back to its owner’s hand</b> — it leaves the table and can be played again, fresh: no damage, no growth.'],
  ['fight', /\bfights?\b/i, () => '<b>Fight</b> — an attacker and its blocker hit each other at once, each with its Power.'],
  ['any', /\bany target\b/i, () => '<b>Any target</b> — a creature or a player.'],
  ['max', /\bmaximum Energy\b/i, () => '<b>Maximum Energy</b> — what your Energy fills back up to at the start of each turn.'],
  ['ready', /\bready\b/i, () => '<b>Ready</b> — able to attack and block. Attacking leaves a creature spent until its owner’s next turn.'],
];

// `now`: its Power and Vitality on the table, `dmg` the damage on it, `granted` keywords it has from elsewhere.
function cardGuide(d, { cost = d.cost, now = null, dmg = 0, granted = [], champ = null } = {}) {
  const kw = (k) => d.keywords.includes(k);
  const ultra = G?.state?.ultra || (!G && Mode.ultra());
  const E = cost != null ? ` · ${cost} Energy` : '';
  // (a Relic, a Trap… : its kind is a keyword, said once, at the top)
  const own = d.token ? null : d.type === 'relic' ? 'relic' : d.type === 'field' ? 'field' : kw('trap') ? 'trap' : d.stages ? 'ritual' : kw('trick') ? 'trick' : d.legend ? 'legend' : null;
  const lines = [d.token ? '<b>Token creature</b> — made by another card, not a real card: it’s gone for good once it leaves the table.'
    : own === 'legend' && d.levels ? `<b>Legend</b>${E} — waits beside your deck, not in it: play it from there on any turn you can pay. If it dies, it goes back to wait, 2 Energy dearer. Nothing can be fused into it.`
    : own ? `<b>${KEYWORDS[own].name}</b>${E} — ${esc((ultra && ULTRA_KEYWORDS[own]) || KEYWORDS[own].text)}`
    : d.type === 'creature' ? `<b>Creature</b>${E} — stays on the table: blocks at once, attacks from your next turn.`
    : `<b>Spell</b>${E} — happens once, then goes to your discard pile.`];
  if (d.levels) lines.push(...levelGuide(d, champ));
  if (d.type === 'creature' && !(d.levels && !champ?.out)) {
    const p = now ? now.power : d.power, v = now ? now.vitality : d.vitality;
    lines.push(`<b>${p}/${v}</b> — ${p} Power (the damage it deals) and ${v} Vitality (the damage it can take)${dmg ? `; ${dmg} damage is on it now` : ''}.${now && (p !== d.power || v !== d.vitality) ? ` Printed ${d.power}/${d.vitality}.` : ''}`);
  }
  const seen = new Set();
  const terms = TERMS.filter(([id, re]) => re.test(d.text || '') && !(id === 'token' && seen.has('spirit')) && seen.add(id)).map(([, re, say]) => say(re.exec(d.text)));
  return `<div class="kw-help card-guide">${lines.map((x) => `<div>${x}</div>`).join('')}${kwHelp(d, granted, own ? [KEYWORDS[own]] : [])}${terms.map((x) => `<div>${x}</div>`).join('')}</div>`;
}

// The Play button for one of your cards (or Echo from the discard pile), and why not if it can't be played.
function playPanel(uid, from = 'hand') {
  const s = S(), c = s.cards[uid];
  let why = playable(uid, from);
  const cost = costOf(s, G.me, c, from);
  // in the lesson, only the card the coach is asking for can be played
  const st = tutStep();
  let advice = '';
  if (st && !why) {
    if (st.expect?.t === 'play' && st.expect.cid === c.cid) advice = st.sheet || '';
    else why = st.expect?.t === 'play' ? `For now, play ${BY_ID[st.expect.cid].name} (it's glowing).` : 'Not yet: follow the box on the table first.';
  }
  const fuses = why ? [] : fuseTargets(uid);
  const plain = !why && plainPlay(uid, from);
  let actions = '';
  if (plain || !fuses.length) actions += `<button class="btn primary" data-act="${from === 'discard' ? 'echo' : from === 'legend' ? 'play-legend' : 'play'}" data-uid="${uid}" ${plain ? '' : 'disabled'}>${from === 'discard' ? 'Play with Echo' : from === 'legend' ? 'Play your Legend' : BY_ID[c.cid].keywords.includes('trap') ? 'Set it face-down' : 'Play'} · ${cost} Energy</button>`;
  // SATTC Ultra: or fuse it into one of your creatures (its Power, Vitality and keywords, for good)
  if (fuses.length) {
    const costs = [...new Set(fuses.map((h) => fuseCost(s, G.me, c, s.cards[h])))].sort((x, y) => x - y);
    actions += `<button class="btn${plain ? '' : ' primary'}" data-act="fuse" data-uid="${uid}">Fuse in · ${costs.join('–')} Energy</button>`;
  }
  let note = why ? `<div class="why">${esc(why)}</div>` : '';
  if (!why && !plain && fuses.length) note = `<div class="why">${s.phase === 'combat' ? 'In a fight, fuse it into one of your creatures in it.' : 'Your table is full: fuse it into one of your creatures instead.'}</div>`;
  if (advice) note = `<div class="coach coach-sheet"><div class="coach-text">${esc(advice)}</div></div>`;
  return { actions, note };
}

// Sheets close with a handle at the bottom: swipe it up or tap it (or tap outside the sheet).
const GRAB = '<div class="g-grab" data-act="close" role="button" aria-label="Close"><i></i><span>Swipe up to close</span></div>';

// ── cards, big ──────────────────────────────────────────────────────
// Tap a card in your hand (or in your opening hand, or a creature on the
// table) and its whole row comes up close: that card in the middle, its
// neighbours fanned at the sides. Swipe (or tap a neighbour) to move along;
// the cards slide over like a hand being fanned. Over them, the card in words.
function openViewer(uid, kind = 'hand') {
  G.viewer = { kind, ctrl: S().cards[uid].ctrl, i: 0 };
  const row = viewerRow();
  G.viewer.i = Math.max(0, row.indexOf(uid));
  if (kind === 'hand') G.peek = row[G.viewer.i];
  G.sheet = viewerHTML();
  redraw();
}

// What the big view moves along: your hand (with your Legend if it waits),
// your opening hand, or the creatures on one side of the table.
function viewerRow() {
  const s = S(), V = G.viewer;
  if (!V) return [];
  return V.kind === 'hand' ? handRow(s) : V.kind === 'mull' ? s.players[G.me].hand : s.players[V.ctrl].board;
}

function viewerHTML() {
  const s = S(), row = viewerRow(), V = G.viewer;
  if (!row.length || !V) { G.viewer = null; return ''; }
  const i = V.i = Math.min(Math.max(0, V.i), row.length - 1);
  const uid = row[i];
  const from = (u) => (V.kind === 'hand' ? fromFor(u) : 'hand');
  const cards = row.map((u, k) => {
    const dk = k - i, ak = Math.min(Math.abs(dk), 3);
    return `<div class="hv-card${dk ? '' : ' on'}${ak >= 3 ? ' far' : ''}${from(u) === 'legend' ? ' legend-wait' : ''}" data-hv-i="${k}" style="--kk:${dk};--akk:${ak};--z:${10 - ak}">${cardHTML(BY_ID[s.cards[u].cid], cardOpts(s, u, from(u)))}</div>`;
  }).join('');
  const dots = row.length > 1 ? `<div class="hv-dots">${row.map((u, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('')}</div>` : '';
  const { actions, note, guide } = cardInfo(uid, { from: from(uid) });
  // The cards and Play sit low, where the thumb is, and never move with the
  // amount of text: the card in words fills the space above them. No Close
  // button: swipe the cards up (or down) to put them away; the handle says so.
  // (what you have to spend, next to what it costs)
  const have = V.kind !== 'hand' || s.phase === 'mulligan' ? '' : `<div class="hv-have">You have ${enHex(s.players[G.me].energy)} Energy</div>`;
  return `<div class="hv" data-key="hv">
    <div class="hv-info">${guide}${note}</div>
    <div class="hv-track">${cards}</div>${dots}
    ${have}<div class="hv-btns">${actions}</div>
    <div class="hv-grab" data-act="close" role="button" aria-label="Close"><i></i><span>Swipe up to close</span></div></div>`;
}

// A sheet's handle: swipe it up (or tap it) to close the sheet.
function sheetGrab(e, grab) {
  FX.grabSwipe(e, grab, () => { if (G) { G.sheet = null; redraw(); } });
}

// Put the big hand away, the cards flying off the way they were swiped.
function closeViewer(dir = 'up') {
  const hv = document.querySelector('.hv');
  const done = () => { if (!G) return; G.sheet = null; G.viewer = null; redraw(); };
  if (!hv) { done(); return; }
  hv.classList.add(`out-${dir}`);
  setTimeout(done, 240);
}

function goViewer(i) {
  const row = viewerRow();
  if (!G.viewer || i < 0 || i >= row.length || i === G.viewer.i) return;
  G.viewer.i = i;
  if (G.viewer.kind === 'hand') G.peek = row[i];
  G.sheet = viewerHTML();
  redraw();
}

// On the attack and block screens a tap picks a card: hold one to read it.
function holdToRead(e) {
  const el = e.target.closest?.('.dec-c[data-u]');
  if (!el || !G || G.flow || G.busy || G.sheet) return;
  const x0 = e.clientX, y0 = e.clientY;
  let held = false;
  const off = () => { clearTimeout(timer); removeEventListener('pointermove', move); removeEventListener('pointerup', up); removeEventListener('pointercancel', off); };
  const move = (ev) => { if (!held && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) off(); };
  const up = () => { if (held && G) G.heldAt = performance.now(); off(); }; // (lifting the finger isn't a tap)
  const timer = setTimeout(() => {
    if (!G || G.sheet || G.flow || !el.isConnected) { off(); return; }
    held = true;
    G.sheet = cardSheet(Number(el.dataset.u));
    redraw();
  }, 450);
  addEventListener('pointermove', move);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', off);
}

// Swipes on the big hand (FX.swipeTrack, the same as the draft's big cards):
// sideways to look along it, gliding on after a flick; up or down, on the
// cards or the handle, to put it away. A sheet's handle swipes up to close it.
function viewerSwipe(e) {
  const grab = e.target.closest?.('.g-grab');
  if (grab && G?.sheet) { sheetGrab(e, grab); return; }
  const zone = e.target.closest?.('.hv-track, .hv-grab');
  if (!zone || !G?.viewer) return;
  const hv = zone.closest('.hv'), track = hv?.querySelector('.hv-track');
  if (!track) return;
  FX.swipeTrack(e, {
    track, zone, host: hv, index: G.viewer.i,
    onSettle: (i) => { if (G?.viewer && i !== G.viewer.i) goViewer(i); },
    onClose: (dir) => closeViewer(dir),
  });
}

// How a card looks big: its cost in your hand, or its Power and Vitality (less its damage) on the table.
function cardOpts(s, uid, from = 'hand') {
  const c = s.cards[uid], d = BY_ID[c.cid];
  if (c.zone === 'board') return { power: power(s, c), vitality: vitality(s, c) - (c.dmg || 0) };
  if (c.zone === 'legend') from = 'legend';
  const cost = c.owner === G.me && (c.zone === 'hand' || c.zone === 'legend') ? costOf(s, G.me, c, from) : c.zone === 'legend' ? costOf(s, c.owner, c, 'legend') : d.cost;
  // (a Legend or Champion comes in at its level: those are the numbers to show)
  return d.levels && s.players[c.owner]?.champ === d.id ? { cost, power: power(s, c), vitality: vitality(s, c) } : { cost };
}

// A card's details: how it looks (opts), what's going on with it (note), its
// buttons (actions) and the card in words (guide). A sheet and the big view show them.
function cardInfo(uid, { from = 'hand' } = {}) {
  const s = S(), c = s.cards[uid], d = BY_ID[c.cid];
  const onBoard = c.zone === 'board';
  // the baked picture: drawing the live art the first time can stall a phone for a moment
  if (c.zone === 'legend') from = 'legend';
  const opts = cardOpts(s, uid, from);
  let actions = '', note = '';
  const granted = onBoard ? FX.KEYWORD_BADGES.filter((k) => hasKw(s, c, k) && !d.keywords.includes(k)) : [];
  if (c.owner === G.me && s.phase !== 'mulligan' && (c.zone === 'hand' || c.zone === 'legend' || (from === 'discard' && d.echo))) ({ actions, note } = playPanel(uid, from));
  if (c.zone === 'legend') note += `<div class="sheet-note">${c.owner === G.me ? 'Your' : `${esc(poss(shortName(s.players[c.owner].name)))}`} Legend waits beside the deck, ready to be played.</div>`;
  if (onBoard) {
    const bits = [];
    const field = s.field != null ? s.cards[s.field].cid : null;
    const mends = field === 'scorched-earth' ? 'wounds don’t heal while Scorched Earth is the Field' : field === 'sanctuary-spring' ? 'wounds heal fully at the start of its owner’s turn' : 'wounds heal by half at the start of its owner’s turn';
    if (c.dmg) bits.push(s.ultra ? `${c.dmg} damage: ${mends}${c.poison ? ` (${c.poison} of it is poison, which doesn’t heal)` : ''}` : `${c.dmg} damage this turn (heals at the end of the turn)`);
    const clock = unstableClock(s, c);
    if (clock) bits.push(`Unstable: ${clock.p} of ${clock.at} Power. It swells +${clock.swell}/+${clock.swell} each turn and erupts at ${clock.at}: 3 damage to every other creature and every player. ${clock.turns <= 1 ? 'That’s next turn!' : `About ${clock.turns} turns away.`}`);
    if (s.ultra && c.shelter) bits.push('Sheltered: opponents can’t aim Spells or abilities at it until its owner’s next turn');
    if (c.hex) bits.push(`Hexed: it can’t attack or block until ${c.ctrl === G.me ? 'you pay' : `${shortName(s.players[c.ctrl].name)} pays`} ${c.hex} Energy`);
    if (c.fuseKw?.length || c.fused) bits.push(`Fused${c.fused ? ` (${c.fused} card${c.fused > 1 ? 's' : ''})` : ''}${c.fuseKw?.length ? `: ${c.fuseKw.map((k) => KEYWORDS[k]?.name).filter(Boolean).join(', ')}` : ''}`);
    if (c.shield) bits.push(`${c.shield} Shield${c.shield > 1 ? 's' : ''}: each stops the next hit it would take, then breaks`);
    if (c.ex) bits.push(c.frozen ? 'Exhausted, and pinned: it stays down through its next turn' : 'Exhausted: it can’t attack or block until its controller’s next turn');
    if (c.stolen) bits.push(`Borrowed from ${shortName(s.players[c.stolen.back].name)} until the end of the turn`);
    if (c.owner !== c.ctrl && !c.stolen) bits.push(`Taken from ${shortName(s.players[c.owner].name)} for good`);
    if (c.sacEnd) bits.push('Borrowed Time: it leaves at the end of this turn');
    if (c.baseCid) bits.push(`Really ${BY_ID[c.baseCid].name}: it turns back if it leaves play`);
    if (c.ctrl === G.me) {
      if (myMain() && !attackedThisTurn() && canAttack(s, G.me, c)) actions = `<button class="btn primary" data-act="attack-from-sheet" data-uid="${uid}">${G.atk?.att.includes(uid) ? 'Keep it home' : 'Send it into the attack'}</button>`;
      if (c.hex && myMain()) actions += `<button class="btn primary" data-act="unhex" data-uid="${uid}" ${s.players[G.me].energy >= c.hex ? '' : 'disabled'}>Break the Hex: pay ${c.hex} Energy</button>`;
      else if (c.played === s.turn && s.active === G.me && !hasKw(s, c, 'rush')) bits.push('Arrived this turn: it can attack next turn (it can block already)');
      if (d.ability) {
        const why = abilityBlocked(uid);
        actions = `<button class="btn primary ab-btn" data-act="use-ability" data-uid="${uid}" ${why ? 'disabled' : ''}>⚡ Pay ${d.ability.cost} Energy: ${esc(d.ability.short)}</button>${actions.replace('btn primary', 'btn')}`;
        if (why) bits.push(`Ability: ${why}`);
      }
    } else if (d.ability) bits.push(c.usedOn === s.turn ? 'Its ability was used this turn' : `Its ability: pay ${d.ability.cost} Energy for ${d.ability.short}`);
    if (bits.length) note = `<div class="sheet-note">${bits.map(esc).join('<br>')}</div>`;
    // the party around it: what each card on its side (and the Field) does for it
    const helps = helpers(s, c);
    if (helps.length) note += `<div class="sheet-helps"><b>Helping it</b>${helps.map((h) => `<div>${esc(h)}</div>`).join('')}</div>`;
  }
  if (c.zone === 'field') note = `<div class="sheet-note">The Field: it changes the rules for everyone at the table, until someone plays another Field. ${c.ctrl === G.me ? 'You' : esc(shortName(s.players[c.ctrl].name))} played it, so it counts as ${c.ctrl === G.me ? 'your' : 'their'} Field.</div>`;
  if (c.zone === 'relic') {
    const bits = [];
    if (c.cid === 'the-drowned-clock') bits.push(`Chimes so far: ${c.chimes || 0} of 3`);
    if (c.cid === 'the-granary') bits.push(c.stored ? `Saved for next turn: ${c.stored} Energy` : 'At the end of your turn it saves up to 3 Energy you didn’t spend');
    if (c.cid === 'war-chest') bits.push(c.usedOn === s.turn ? 'It paid out this turn' : 'It pays out the first time your creatures hit an opponent this turn');
    if (d.stages) {
      const next = d.stages[c.stage];
      bits.push(`Ritual: stage ${c.stage} of ${d.stages.length} done`);
      if (next && c.ctrl === G.me) {
        const why = riteBlocked(s, c);
        actions = `<button class="btn primary" data-act="rite" data-uid="${uid}" ${why ? 'disabled' : ''}>Stage ${['I', 'II', 'III'][c.stage]}: pay ${next.cost} Energy</button>`;
        bits.push(`Next: ${next.text}${why ? ` (${why})` : ''}`);
      } else if (next) bits.push(`Next, for ${next.cost} Energy: ${next.text}`);
    }
    if (c.cid === 'bone-altar' && c.ctrl === G.me) {
      const ok = myMove() && s.active === G.me && c.usedOn !== s.turn && s.players[G.me].board.length > 0;
      actions = `<button class="btn primary" data-act="use" data-uid="${uid}" ${ok ? '' : 'disabled'}>Sacrifice a creature to draw a card</button>`;
      if (c.usedOn === s.turn) bits.push('Already used this turn');
    }
    if (bits.length) note = `<div class="sheet-note">${bits.map(esc).join('<br>')}</div>`;
  }
  const P = s.players[c.owner];
  const champ = d.levels && P?.champ === d.id ? { L: champLevel(s, c.owner), n: P.cxp || 0, at: xpAt(s, d.id), out: onBoard } : null;
  const guide = cardGuide(d, { cost: opts.cost ?? d.cost, now: onBoard || champ ? { power: power(s, c), vitality: vitality(s, c) } : null, dmg: onBoard ? c.dmg || 0 : 0, granted, champ });
  return { d, opts, note, actions, guide };
}

function cardSheet(uid, { from = 'hand' } = {}) {
  const { d, opts, note, actions, guide } = cardInfo(uid, { from });
  return `${cardHTML(d, opts)}${note}${guide}
    ${actions ? `<div class="btn-col">${actions}</div>` : ''}`;
}

function choiceSheet(st) {
  const s = S(), P = s.players[G.me];
  const cards = (uids, chosen = []) => `<div class="choice-grid">${uids.map((u) => {
    const c = s.cards[u];
    const whose = c.owner !== G.me ? `<div class="choice-owner">${esc(poss(shortName(s.players[c.owner].name)))}</div>` : '';
    return `<div data-choice="${u}" class="${chosen.includes(u) ? 'chosen' : ''}">${cardHTML(BY_ID[c.cid])}${whose}</div>`;
  }).join('')}</div>`;
  const cancel = '<button class="btn ghost" data-act="cancel">Cancel</button>';
  switch (st.kind) {
    case 'pick': {
      const by = G.flow.a.uid && s.cards[G.flow.a.uid].cid;
      const title = by === 'the-barrow-queen' ? 'Bring back a creature from any discard pile' : by === 'weatherwitch' ? 'Bring a Field back to your hand'
        : by === 'whispered-doubt' ? 'Their cards that cost 4 or more: which goes to the bottom of its owner’s deck?' : 'Choose a creature from your discard pile';
      const skip = by === 'whispered-doubt' ? 'Leave their hands alone' : 'Bring nothing back';
      return `<h3>${title}</h3>${cards(st.options)}<div class="btn-col">${st.optional ? `<button class="btn" data-act="skip">${skip}</button>` : ''}${cancel}</div>`;
    }
    case 'picks':
      return `<h3>${esc(st.title || 'Return up to three Spells')}</h3>${cards(st.options, G.flow.multi)}
        <div class="btn-col"><button class="btn primary" data-act="done-picks">${esc(st.verb || 'Return')} ${G.flow.multi.length}</button>${cancel}</div>`;
    case 'keep':
      return `<h3>Memory Diver</h3><p class="sheet-note">The top ${st.options.length} cards of your deck. Keep one; the rest go to your discard pile.</p>${cards(st.options)}<div class="btn-col">${cancel}</div>`;
    case 'bottom':
      return `<h3>Curious Wisp</h3><p class="sheet-note">The top card of your deck:</p>${cards(st.options)}
        <div class="btn-col"><button class="btn" data-act="wisp-top">Leave it on top</button><button class="btn" data-act="wisp-bottom">Put it on the bottom</button>${cancel}</div>`;
    case 'discard': {
      const drawn = P.deck.slice(0, 2);
      return `<h3>Second Thought</h3><p class="sheet-note">You will draw ${drawn.map((u) => esc(BY_ID[s.cards[u].cid].name)).join(' and ') || 'nothing'}. Then discard one card:</p>${cards(st.options)}<div class="btn-col">${cancel}</div>`;
    }
    case 'tax': {
      const owner = countercurrentOwner(s);
      const cost = costOf(s, G.me, s.cards[G.flow.a.uid], G.flow.a.from || 'hand');
      const left = P.energy - cost;
      return `<h3>Countercurrent</h3><p class="sheet-note">${esc(shortName(owner.name))} has a Countercurrent set. Your next Spell is canceled unless you pay 2 more Energy.</p>
        <div class="btn-col"><button class="btn primary" data-act="tax-pay" ${left >= 2 ? '' : 'disabled'}>Pay 2 more (${left} left after the card)</button>
        <button class="btn" data-act="tax-no">Play it anyway (it will be canceled)</button>${cancel}</div>`;
    }
  }
  return '';
}

function discardSheet(pi) {
  const s = S(), P = s.players[pi];
  const list = [...P.discard].reverse();
  const items = list.map((u) => {
    const d = BY_ID[s.cards[u].cid];
    const echo = pi === G.me && d.echo;
    return `<div>${cardHTML(d)}${echo ? `<button class="btn small primary" style="width:100%;margin-top:6px" data-act="echo-open" data-uid="${u}">Echo ${d.echo}</button>` : ''}</div>`;
  }).join('');
  return `<h3>${pi === G.me ? 'Your' : esc(poss(shortName(P.name)))} discard pile (${list.length})</h3>
    ${list.length ? `<div class="choice-grid big">${items}</div>` : '<p class="sheet-note">Empty.</p>'}
    ${P.exile.length ? `<p class="sheet-note">Removed from the game: ${P.exile.map((u) => esc(BY_ID[s.cards[u].cid].name)).join(', ')}</p>` : ''}
`;
}

// A player's Energy in words: what they have now, and what their next turn brings.
function energyLine(s, P, whose) {
  const next = Math.min(RULES.maxEnergy, P.maxEnergy + 1);
  if (s.phase === 'mulligan') return `${next} on ${whose} first turn`;
  if (s.active === P.i) return `${P.energy} now, out of ${P.maxEnergy} this turn`;
  return `${P.energy} now, ${next} at the start of ${whose} next turn`;
}

// A Legend's (or Champion's) levels in its card's guide: what it counts, then
// each level's numbers and power, the one it's at marked, with how far to the
// next. `champ`: { L, n, at, out } in a game (its level, the count so far, the
// counts the levels need, on the table or not); null in the card's gallery.
function levelGuide(d, champ) {
  const at = champ?.at || d.xp.at;
  const what = `${/^times\b/.test(d.xp.unit) ? 'the ' : ''}${d.xp.unit}`;
  const head = `<b>Levels</b> — it counts ${esc(what)}, all game${d.legend ? ', even while it waits' : ''}. Each level adds to the one before; its powers work only on the table.`;
  const rows = [1, 2, 3].map((L) => {
    const [p, v, ks] = d.levels[L - 1];
    const stats = `${p}/${v}${ks.length ? `, ${ks.map((k) => KEYWORDS[k].name).join(', ')}` : ''}`;
    const power = L === 1 ? 'No power yet.' : L === 2 ? d.l2 : `Also, ${d.l3[0].toLowerCase()}${d.l3.slice(1)}`;
    const when = L === 1 ? '' : ` at ${at[L - 2]}`;
    const tag = champ?.L === L ? ' <i class="lv-now">now</i>' : champ && L === champ.L + 1 ? ` <i class="lv-next">${champ.n} so far</i>` : '';
    return `<div class="lv${champ?.L === L ? ' now' : champ && L < champ.L ? ' past' : ''}"><b>Level ${L}</b>${when}${tag} — ${stats}. ${esc(power)}</div>`;
  });
  return [head, `<div class="lv-list">${rows.join('')}</div>`];
}

// Champions: what a level brings, and how far along one is.
function levelLine(d, L) {
  const [p, v, ks] = d.levels[L - 1];
  return `${p}/${v}${ks.length ? `, ${ks.map((k) => KEYWORDS[k].name).join(', ')}` : ''}. ${L === 2 ? d.l2 : d.l3}`;
}
// (a player's sheet: their Champion, where it is, and how far along)
function champRow(s, P) {
  const d = BY_ID[P.champ], L = champLevel(s, P.i);
  const u = P.legend ?? [...P.board, ...P.hand].find((x) => s.cards[x].cid === P.champ);
  const z = u != null ? s.cards[u].zone : null;
  const where = z === 'board' ? 'on the table' : z === 'hand' ? 'in hand' : z === 'legend' ? `beside the deck, ${costOf(s, P.i, s.cards[u], 'legend')} Energy to play` : 'gone';
  return `${d.name.split(',')[0]}, Level ${L} (${where})${L < 3 ? ` · ${P.cxp} of ${xpAt(s, P.champ)[L - 1]} ${d.xp.unit} for Level ${L + 1}` : ''}`;
}

// Tap a player's bar: everything about them, in words.
function playerSheet(pi) {
  const s = S(), P = s.players[pi], mine = pi === G.me;
  const who = mine ? 'You' : esc(shortName(P.name));
  const rows = [
    ['Life', P.out ? 'out of the game' : P.life],
    ['Energy', energyLine(s, P, mine ? 'your' : 'their')],
    ['Cards in hand', P.hand.length],
    ['Cards left in the deck', P.deck.length],
    ['Discard pile', `${P.discard.length} card${P.discard.length === 1 ? '' : 's'}`],
    ...(P.traps.length ? [['Face-down Traps', P.traps.length]] : []),
    ...(s.crownOn ? [['The Crown', s.crown === pi ? (mine ? 'yours: an extra card at the end of each of your turns' : 'theirs: hit them in a fight to take it') : 'no']] : []),
    ...(P.champ ? [[BY_ID[P.champ].legend ? 'Legend' : 'Champion', champRow(s, P)]] : []),
    ...(G.bots.has(pi) && G.mode === 'practice' ? [['Bot level', `${levelOf(G.level).name}${levelOf(G.level).elo ? ` (Elo ${levelOf(G.level).elo})` : ''}`]] : []),
  ];
  const relics = P.relics.map((u) => BY_ID[s.cards[u].cid]).map((d) => `<div><b>${esc(d.name)}</b> — ${esc(d.text.replace(/^Relic\n/, ''))}</div>`).join('');
  // (yours only: theirs are face-down)
  const traps = mine ? P.traps.map((u) => BY_ID[s.cards[u].cid]).map((d) => `<div><b>${esc(d.name)}</b> — ${esc(d.text.replace(/^Trap\n/, ''))}</div>`).join('') : '';
  return `<h3>${who}</h3>
    <div class="pl-rows">${rows.map(([k, v]) => `<div>${k}</div><div>${typeof v === 'number' ? v : esc(String(v))}</div>`).join('')}</div>
    ${relics ? `<div class="kw-help"><div class="sheet-note" style="text-align:left;margin:0 0 4px">Relics</div>${relics}</div>` : ''}
    ${traps ? `<div class="kw-help"><div class="sheet-note" style="text-align:left;margin:0 0 4px">Your face-down Traps: each waits, turn after turn, until it springs</div>${traps}</div>` : ''}
    <div class="btn-col">${P.discard.length ? `<button class="btn" data-act="discards" data-of="${pi}">Look at the discard pile</button>` : ''}</div>`;
}

function menuSheet() {
  return `<h3>Menu</h3>${S().ultra ? '<p class="sheet-note ultra-note">This game plays <b>SATTC Ultra</b>.</p>' : ''}<div class="btn-col">
    ${tutStep() ? '<button class="btn" data-act="coach-skip">Skip the lesson (play on against the bot)</button>' : ''}
    ${G.mode === 'practice' ? '<button class="btn" data-act="undo">↶ Take back my last move</button>' : ''}
    <button class="btn" data-act="help">How the table works</button>
    <button class="btn" data-act="log">Game log</button>
    <button class="btn" data-act="speed">${fastOn() ? 'Animations: fast (tap for normal)' : 'Animations: normal (tap for fast)'}</button>
    <button class="btn" data-act="pace">${tapThrough() ? 'Others’ moves: wait for your tap (tap for automatic)' : 'Others’ moves: automatic (tap to wait for your tap)'}</button>
    ${G.mode === 'online' && ['on', 'off'].includes(Push.status()) ? `<button class="btn" data-act="alerts">${Push.status() === 'on' ? '🔔 Turn alerts: on (tap to turn off)' : '🔔 Turn alerts: off (tap to turn on)'}</button>` : ''}
    <button class="btn" data-act="fixes">Fix something</button>
    <button class="btn" data-act="rules">All the rules (leaves the table)</button>
    <button class="btn danger" data-act="concede">${G.concedeArm && Date.now() - G.concedeArm < 4000 ? 'Tap again to concede' : 'Concede'}</button>
    <button class="btn ghost" data-act="leave">${G.mode === 'tutorial' ? 'Leave the lesson' : `Leave (${G.mode === 'practice' ? 'you can resume later' : 'the game continues'})`}</button>
    </div>`;
}

function helpSheet() {
  return `<h3>How the table works</h3>
    <div class="help-list">
      <div><b>Energy</b> ${enHex(4)}<span class="muted">/5</span> on your bar: 4 left to spend, out of your most this turn. A card’s cost is in the same bronze hexagon. Everyone has ${RULES.startEnergy} on their first turn, then 1 more each turn, up to ${RULES.maxEnergy}.</div>
      <div><b>Top: your opponents.</b> Name, Life ❤, Energy and cards in hand. <b>Tap anyone’s bar</b> for the rest: their deck, discard pile and Relics. ⊠ is a face-down Trap.</div>
      ${S().players.length > 2 ? '<div><b>Three players</b>: the table shows two sides at a time, as in a duel: whoever is in play. The third folds to its bar (“3 creatures ▾”): <b>tap it</b>, or swipe sideways across the top, to open it.</div>' : ''}
      <div><b>Creatures</b>: theirs above, yours below. Left number = <b>Power</b> (damage it deals), right = <b>Vitality</b> (damage it can take). Small badges are keywords; tap any card to read it.</div>
      <div><b>Your hand</b>: the card in the middle pokes up with its rules showing. Slide the hand sideways to bring another card to the middle (flick it to go further). <b>Tap a card</b> to see your whole hand big, and swipe through it.</div>
      <div><b>Play a card</b>: drag it from your hand up onto the table, or tap it and tap Play. Glowing cards can be played now.</div>
      <div><b>Attack</b> (once a turn): tap <b>Attack</b> (bottom right). Its screen shows your creatures that can attack and theirs that could block: tap the ones that attack (with three players, also tap whom), then tap <b>Attack</b> again. Attackers are exhausted afterwards: they can’t block until your next turn.</div>
      <div><b>Block</b>: when you are attacked, a screen comes up with the attackers on top and your creatures below. <b>Tap one of yours</b> and it steps in front of an attacker (with several attackers, then tap the one it blocks); tap a blocker to send it back. ☠ marks what would be destroyed if no one plays a Trick, and the line under it says what you would lose. Then tap <b>Block</b>.</div>
      <div><b>Can’t block?</b> An exhausted creature (it attacked) can’t, and only creatures with Soar or Reach can block one with Soar. Tap it to see why.</div>
      <div><b>Team up</b>: several of your creatures can block the same attacker. They all hit it, and it splits its damage among them, destroying the costliest ones it can.</div>
      <div><b>The fight</b>: before it starts, a screen shows the <b>Tricks</b> and abilities you could use (only when you have one): play one, or tap <b>Fight</b>. It comes up big, a pair at a time, with what happened and why: tap to go on, Skip to close. The note under the table afterwards plays it again.</div>
      <div><b>The others’ moves wait for you</b>: a card someone plays stays up big, and an attack between the other two stays on the table, until you <b>tap anywhere</b>. <b>Skip to your move</b> passes over the rest. In ☰ you can let them play by themselves instead.</div>
      <div><b>⚡ Abilities</b>: some creatures say “Pay 2 Energy: …”. Tap the creature (or the ⚡ chip on it, which shows the Energy it takes and glows when you can use it): its ⚡ button is under the card. Each works once a turn: on your turn, or in a fight you are in.</div>
      <div><b>Relics</b> sit under your name. Tap one to read it; one that glows can be used now (Bone Altar, a Ritual’s next stage): tap it for its button.</div>
      ${S().ultra ? '<div><b>SATTC Ultra</b>: 30 Life. <b>Wounds stay</b> on creatures and heal by half at the start of their owner’s turn. A new creature is <b>Sheltered</b> (🛡) from opponents’ Spells and abilities until its owner’s next turn. When a creature that grew dies, half its growth passes to your weakest creature (<b>Legacy</b>). Energy grows by itself to 6; <b>Invest</b> cards raise it for good, up to 12. One <b>Field</b> (the banner in the middle) changes the rules for everyone. A <b>Ritual</b> stays in your Relic row: tap it to pay its next stage, one a turn. A <b>Hex</b> (⛓) lasts until its owner pays to break it: tap the creature. Venom’s damage is poison (☠): it doesn’t heal. An <b>Unstable</b> creature shows how close it is to erupting (💥8/10; it pulses red the turn before). Tap a creature to see what’s helping it: the cards on its side, and the Field.</div>' : ''}
      ${ultraV2(S()) ? `<div><b>Ultra’s second version</b>: your <b>Legend</b> waits beside your deck (at the left of your hand) and can be played whenever you can pay; it levels up as you play its way, and if it dies it comes back to wait there, 2 Energy dearer. Nothing can be fused into a Legend. <b>Symbiotes</b> (the creatures with Fuse): from the turn after one arrives, pay 1 Energy and it kills a creature it can kill in one hit (Vitality left no more than its Power, no Shield), then joins another creature of yours, which gets its Power, Vitality and keywords for good. A Symbiote arrives without Shelter. <b>Dig</b> (the button bottom left): once a turn, pay ${ULTRA_V2.digCost} Energy to draw a card. <b>Ganging up</b>: when two or more creatures block one attacker, each hits ${ULTRA_V2.together} harder. A <b>Shield</b> (◈) stops the next hit a creature would take; Shields stack. <b>Traps</b> wait face down, turn after turn, until their moment comes, then spring by themselves.${ULTRA_V2.growthCap ? ' <b>Growth has a ceiling</b>: a creature can’t grow for good by more than its controller’s maximum Energy (6, more with Invest), so a monster takes an economy.' : ''}</div>` : ''}
      ${S().uv >= 4 ? `<div><b>Ultra’s fourth version</b>: six more decks, each with its Legend, and their biggest cards cost 7 or more, so they need Energy beyond the usual 6 (Invest). <b>Ambush</b>: a creature you can play during a fight, like a Trick; played when you’re attacked, before you choose blockers, it can block. <b>Offering</b>: as you play the card, you may sacrifice a creature of yours for its stronger effect. <b>Your Field</b> is a Field you played; the banner in the middle says whose it is. The <b>Granary</b> saves up to 3 Energy you didn’t spend for your next turn (its number shows on it).</div>` : ''}
      ${S().uv >= 5 ? `<div><b>Ultra’s fifth version</b>: a creature sent back to the hand comes back fresh, without its growth. Two more decks with Legends (Spellbloom, Fogbound). Guerrilla cards slow an opponent’s plans: <b>Choking Smoke</b> (less Energy on their next turn), <b>Tollkeeper</b> (you draw when they Invest), <b>Grave Robber</b> (their dead go to the bottom of their deck), <b>Pickpocket</b> (its hit takes a random card from their hand), <b>Whispered Doubt</b> (a big card in their hand goes to the bottom of their deck) and <b>Blight Beetle</b> (it eats an enemy creature’s growth). The <b>Rolling Fog</b> lifts at the start of its owner’s third turn; the banner counts down.</div>` : ''}
      ${S().players.some((P) => P.champ) ? '<div><b>★ Champions</b> (new): every deck starts with a Champion on the table. It can block from the start, but can’t attack until Level 2. It levels up as you do what its faction does (tap it to see how far along it is), and each level changes how your other cards work. If it leaves the table it goes back to your hand, costing 2 more each time.</div>' : ''}
      ${S().crownOn ? '<div><b>👑 The Crown</b> (three players): the first player to hit someone in a fight takes it. Whoever holds it draws an extra card at the end of each of their turns. Hit the holder in a fight and it’s yours.</div>' : ''}
      <div><b>The button at the bottom right</b> moves the game on: End turn, Attack, Block, Fight. While you could still play a card or attack, End turn asks for a second tap.</div>
      <div><b>💡</b> (top right) asks the bot what it would do in your place: it spells out the move and rings the cards. Tap <b>Do it</b> to make that move, or do something else.</div>
      <div><b>Is it ready?</b> A <b>gold glow</b> means it can act now. <b>zZ</b> means it just arrived: it can block, but it can’t attack until your next turn. Turned sideways, with ↻ in its corner, means it attacked: it can’t attack or block until its owner’s next turn.</div>
      <div><b>Discard piles</b> sit at the end of each player’s bar. Spells land there when they’re done; tap a pile to look through it.</div>
      <div><b>End turn</b> when you’re finished. Energy you don’t spend stays until your next turn, so you can answer attacks with Tricks.</div>
    </div>
    <div class="btn-col">
      ${G.mode === 'online' ? '' : '<button class="btn" data-act="tutorial">Play the guided lesson</button>'}
      </div>`;
}

function logSheet() {
  const items = G.state.log.map((l) => `<div class="${/’s turn\.$|'s turn\.$/.test(l.text) ? 'turn' : ''}">${esc(speak(l.text))}</div>`).join('');
  setTimeout(() => { const box = document.querySelector('.log-list'); if (box) box.scrollTop = box.scrollHeight; }, 0);
  return `<h3>Game log</h3><div class="log-list">${items}</div>`;
}

function fixSheet() {
  const s = G.state;
  const rows = s.players.map((P) => `<div>${esc(shortName(P.name))} · Life ${P.life}</div>
      <button class="btn small" data-act="fix-life" data-p="${P.i}" data-n="-1">−1</button>
      <button class="btn small" data-act="fix-life" data-p="${P.i}" data-n="1">+1</button>`).join('');
  return `<h3>Fix something</h3><p class="sheet-note">If the game ever gets a rule wrong, put it right here. Everyone sees the fix in the log.</p>
    <div class="fix-grid">${rows}
      <div>Your Energy · ${s.players[G.me].energy}</div>
      <button class="btn small" data-act="fix-energy" data-n="-1">−1</button>
      <button class="btn small" data-act="fix-energy" data-n="1">+1</button></div>
`;
}

// ── asking first: moves that are almost surely a slip ───────────────
// Legal, but almost never what anyone means: a spell or an ability that would
// change nothing; one aimed at the wrong side (destroying or weakening your own
// creature, making theirs stronger, Life lost by you or given to them); ending
// the turn with Energy and a creature or Relic you could still play (Energy
// left over is only good for Tricks until your next turn); not blocking when
// that puts you out. These ask first, on a sheet: go back, or do it anyway.
// Not in the lesson, and never for the 💡 suggestion.
const ZONES = ['deck', 'hand', 'discard', 'exile', 'board', 'traps', 'relics'];

function tryMove(a, steps = []) {
  const w = tutStep() ? null : slip(S(), a, steps);
  G.slip = w ? { a, ...w } : null;
  if (!w) return dispatch(a);
  G.sheet = slipSheet(G.slip);
  redraw();
  return false;
}

function slipSheet(w) {
  return `<h3>${esc(w.title)}</h3><p class="sheet-note">${esc(w.text)}</p>
    <div class="btn-col"><button class="btn primary" data-act="slip-no">${esc(w.no || 'Go back')}</button>
    <button class="btn" data-act="slip-yes">${esc(w.yes || 'Do it anyway')}</button></div>`;
}

// What to ask before move `a` (null: just make it). `steps` are the choices it was made with.
function slip(s, a, steps) {
  if (a.t === 'end') return endSlip(s);
  if (a.t === 'block') return blockSlip(s, a);
  if (a.t === 'play' || a.t === 'use' || a.t === 'dig') { const w = outSlip(s, a); if (w) return w; }
  if ((a.t !== 'play' && a.t !== 'use') || a.payTax === false) return null; // (letting Countercurrent cancel it was a choice)
  const r = apply(s, a);
  if (r.error) return null; // sending it says why
  const t = r.state, c0 = s.cards[a.uid], d = BY_ID[c0.cid];
  const what = a.t === 'use' ? `${d.name}’s ability` : d.name;
  // (setting a Trap changes nothing yet: it waits face-down, which is the point)
  if (s.phase === 'main' && (a.t === 'use' ? !!d.ability : d.type === 'spell' && !d.stages && !d.keywords.includes('trap'))) {
    const paid = a.t === 'use' ? d.ability?.cost || 0 : costOf(s, a.p, c0, a.from || 'hand') + (a.payTax ? 2 : 0);
    if (changesNothing(s, t, a, paid)) {
      const says = a.t === 'use' ? d.ability.short : d.text.replace(/^Trick\n/, '').replace(/\n/g, ' ');
      return { title: `${what} would do nothing now`, text: `It says: “${says}” Right now nothing would happen, and you’d still pay its Energy.`, yes: a.t === 'use' ? 'Use it anyway' : 'Play it anyway' };
    }
  }
  // aimed at the wrong side (only asked when the choice had both sides in it)
  const tg = a.target, opts = steps.find((x) => x.kind === 'target')?.options || [];
  if (tg?.uid != null && new Set(opts.filter((o) => o.uid != null).map((o) => s.cards[o.uid]?.ctrl === G.me)).size > 1) {
    const c = s.cards[tg.uid], x = t.cards[tg.uid], nm = BY_ID[c.cid].name;
    const hp = (st, k) => vitality(st, k) - (k.dmg || 0);
    const stays = x.zone === 'board' && x.ctrl === c.ctrl;
    if (c.ctrl === G.me) {
      const verb = ['discard', 'exile'].includes(x.zone) ? 'destroy' : x.ctrl !== c.ctrl ? 'hand over' : x.frozen && !c.frozen ? 'freeze'
        : stays && (power(t, x) < power(s, c) || hp(t, x) < hp(s, c)) ? 'weaken' : null;
      if (verb) return { title: 'That’s your own creature', text: `${what} would ${verb} your own ${nm}.` };
    } else if (stays && (power(t, x) > power(s, c) || hp(t, x) > hp(s, c))) {
      return { title: 'That’s their creature', text: `${what} would make ${name(c.ctrl)}’s ${nm} stronger.` };
    }
  }
  if (tg?.p != null && opts.some((o) => o.p != null && o.p !== tg.p)) {
    const dl = t.players[tg.p].life - s.players[tg.p].life;
    if (tg.p === G.me && dl < 0) return { title: 'That hits you', text: `${what} would take ${-dl} Life from you, not from them.` };
    if (tg.p !== G.me && dl > 0) return { title: 'That helps them', text: `${what} would give ${name(tg.p)} ${dl} Life.` };
  }
  return null;
}

// Would the move change nothing but where the card itself is, the Energy paid and the log?
function changesNothing(s, t, a, paid) {
  const norm = (x, refund) => {
    const y = structuredClone({ ...x, log: [], events: [], rng: 0 });
    y.players[a.p].energy += refund;
    y.players[a.p].spells = 0;
    if (a.t === 'use') delete y.cards[a.uid].usedOn;
    else { for (const Q of y.players) for (const z of ZONES) Q[z] = Q[z].filter((u) => u !== a.uid); delete y.cards[a.uid]; }
    return JSON.stringify(y);
  };
  return norm(s, 0) === norm(t, paid);
}

// A move that would knock you out: paying Life, or (games set up before the
// deck clock) drawing from an empty deck, 2 Life a card. Say how first (game
// DTSN: Grand Illusion drew 7 cards from an empty deck, 14 Life, all that was left).
function outSlip(s, a) {
  const r = apply(s, a);
  if (r.error) return null;
  const t = r.state;
  if (!t.players[G.me].out && !(t.phase === 'over' && t.winner !== G.me)) return null;
  const draws = t.log.slice(s.log.length).filter((l) => l.p === G.me && /no cards left to draw/.test(l.text)).length;
  const what = a.t === 'dig' ? 'Digging' : a.t === 'use' ? `${BY_ID[s.cards[a.uid].cid].name}’s ability` : BY_ID[s.cards[a.uid].cid].name;
  return {
    title: 'That would knock you out',
    text: draws ? `${what} would make you draw ${draws} card${draws > 1 ? 's' : ''} from your empty deck: 2 Life each, ${draws * 2} in all, and you have ${s.players[G.me].life}.` : `${what} would take the last of your Life.`,
    yes: 'Do it anyway', no: 'Go back',
  };
}

// Ending the turn with Energy and a creature or Relic still to play: that Energy
// is lost when your next turn starts (until then it's only good for Tricks).
function endSlip(s) {
  const P = s.players[G.me];
  if (!myMain() || P.energy <= 0) return null;
  // (a Trap counts: set now, it waits face-down until it springs)
  const isTrap = (c) => BY_ID[c.cid].keywords.includes('trap');
  const could = handRow(s).map((u) => s.cards[u]).filter((c) => (['creature', 'relic'].includes(BY_ID[c.cid].type) || isTrap(c)) && !playable(c.uid, fromFor(c.uid)) && plainPlay(c.uid, fromFor(c.uid)));
  if (!could.length) return null;
  const few = (cs) => { const named = cs.slice(0, 3).map((c) => `${BY_ID[c.cid].name} (${costOf(s, G.me, c, fromFor(c.uid))})`); return listNames(cs.length > 3 ? [...named, `${cs.length - 3} more`] : named); };
  const plays = could.filter((c) => !isTrap(c)), sets = could.filter(isTrap);
  const what = [plays.length ? `play ${few(plays)}` : '', sets.length ? `set ${few(sets)} face-down` : ''].filter(Boolean).join(', or ');
  const dig = ultraV2(s) && !check(s, { t: 'dig', p: G.me }) ? ` Or dig: ${ULTRA_V2.digCost} Energy to draw a card.` : '';
  const later = P.hand.some((u) => isTrick(BY_ID[s.cards[u].cid])) || P.board.some((u) => BY_ID[s.cards[u].cid].ability);
  return {
    title: `You still have ${P.energy} Energy`,
    text: `You could ${what}.${dig} ${later ? 'Energy you keep is only good for Tricks and abilities until your next turn starts.' : 'You have no Tricks or abilities to spend it on, so it’s lost when your next turn starts.'}`,
    yes: 'End turn anyway', no: 'Keep playing',
  };
}

// Not blocking when that puts you out, while a creature of yours could block.
function blockSlip(s, a) {
  if (a.blocks.length || s.players[G.me].out || !fightPreview(s)?.players[G.me].out) return null;
  const can = s.players[G.me].board.filter((u) => s.combat.att.some((x) => canAssign(u, x)));
  if (!can.length) return null;
  return {
    title: 'Without a block, you’re out',
    text: `If no one blocks, you lose the game. ${listNames(can.map((u) => BY_ID[s.cards[u].cid].name))} could block.`,
    yes: 'No block anyway', no: 'Choose a blocker',
  };
}

// ── playing a card, one choice at a time ───────────────────────────
function startPlay(uid, from = 'hand') {
  G.sheet = null;
  G.viewer = null;
  G.atk = null;
  G.flow = { a: { t: 'play', p: G.me, uid, ...(from !== 'hand' ? { from } : {}) }, steps: stepsFor(uid, from), i: 0, multi: [] };
  nextChoice();
}

// SATTC Ultra: fuse a creature card from your hand into one of your creatures (tap which).
function startFuse(uid) {
  const hosts = fuseTargets(uid);
  if (!hosts.length) return;
  G.sheet = null;
  G.viewer = null;
  G.atk = null;
  G.flow = { a: { t: 'play', p: G.me, uid }, steps: [{ kind: 'fuse', options: hosts.map((u) => ({ uid: u })), prompt: `Fuse ${BY_ID[S().cards[uid].cid].name} into which of your creatures?` }], i: 0, multi: [] };
  nextChoice();
}

// Dropped from the hand onto the table: play it now, or ask what it needs first.
// (SATTC Ultra: dropped onto one of your creatures, a creature card fuses into it.)
function dropPlay(uid, info = null) {
  const from = fromFor(uid);
  const host = info ? hostAt(info.x, info.y) : null;
  if (host != null && fuseTargets(uid).includes(host)) return tryMove({ t: 'play', p: G.me, uid, fuse: host });
  if (playable(uid, from)) return false;
  if (!plainPlay(uid, from)) { if (fuseTargets(uid).length) startFuse(uid); return false; }
  const steps = stepsFor(uid, from);
  if (steps.length) { startPlay(uid, from); return false; }
  return tryMove({ t: 'play', p: G.me, uid, ...(from !== 'hand' ? { from } : {}) });
}
// Your creature under a point on the screen, and lighting it up while a card is dragged over it.
function hostAt(x, y) {
  for (const n of document.querySelectorAll('#game .g-side.me .tcard.on-board')) {
    const r = n.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return Number(n.dataset.uid);
  }
  return null;
}
function fuseOver(uid) {
  for (const n of document.querySelectorAll('#game .tcard.fuse-over')) if (Number(n.dataset.uid) !== uid) n.classList.remove('fuse-over');
  if (uid != null) document.querySelector(`#game .g-side.me .tcard[data-uid="${uid}"]`)?.classList.add('fuse-over');
}

function nextChoice() {
  const f = G.flow;
  if (f.i >= f.steps.length) { G.flow = null; G.sheet = null; tryMove(f.a, f.steps); if (G && !G.busy && !G.slip) redraw(); return; }
  const st = f.steps[f.i];
  G.sheet = ['pick', 'picks', 'keep', 'bottom', 'discard', 'tax'].includes(st.kind) ? choiceSheet(st) : null;
  redraw();
}

function chooseOnTable(t) {
  const f = G.flow, st = f.steps[f.i];
  if (!st.options.some((o) => sameT(o, t))) return false;
  if (st.kind === 'sac') { f.a.sac = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'offer') { f.a.offer = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'fighter') { f.a.fighter = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'fuse') { f.a.fuse = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'prey') { f.a.prey = t.uid; f.i++; nextChoice(); return true; }
  if (st.kind === 'target') {
    if (t.uid != null && (t.uid === f.a.sac || t.uid === f.a.offer || t.uid === f.a.fighter || t.uid === f.a.prey)) return false;
    f.a.target = t; f.i++; nextChoice(); return true;
  }
  if (st.kind === 'targets') {
    const k = f.multi.indexOf(t.uid);
    if (k >= 0) f.multi.splice(k, 1); else f.multi.push(t.uid);
    if (f.multi.length === st.count) { f.a.targets = [...f.multi]; f.multi = []; f.i++; nextChoice(); }
    else redraw();
    return true;
  }
  return false;
}

// ── input ───────────────────────────────────────────────────────────
let flashTimer;
function flash(msg) {
  document.querySelector('.toast')?.remove();
  const box = document.createElement('div');
  box.className = 'toast';
  box.style.zIndex = 90;
  box.textContent = msg;
  document.body.appendChild(box);
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => box.remove(), 2400);
}

function onClick(e) {
  if (!G) return;
  // the tap that let another player's move go on doesn't also count on the table
  if (G.tapAt && performance.now() - G.tapAt < 400) return;
  if (G.heldAt && performance.now() - G.heldAt < 500) { G.heldAt = 0; return; } // (the finger lifting after holding a card to read it)
  const s = S();
  const t = e.target;
  const actEl = t.closest('[data-act]');
  // "Since your last turn" goes away at the first tap anywhere (and the tap still counts)
  if (G.recap != null && !t.closest('.recap-pop')) { G.recap = null; if (!actEl) redraw(); }
  if (actEl && !t.closest('.relic')) { onAct(actEl.dataset.act, actEl); return; }
  if (G.busy) return;

  if (G.sheet) {
    const ch = t.closest('[data-choice]');
    const st = G.flow?.steps[G.flow.i];
    if (ch && st) {
      const u = Number(ch.dataset.choice);
      if (st.kind === 'picks') {
        const k = G.flow.multi.indexOf(u);
        if (k >= 0) G.flow.multi.splice(k, 1); else if (G.flow.multi.length < st.max) G.flow.multi.push(u);
        G.sheet = choiceSheet(st);
        redraw();
        return;
      }
      if (st.kind === 'pick') G.flow.a.pick = u;
      if (st.kind === 'keep') G.flow.a.keep = u;
      if (st.kind === 'discard') G.flow.a.discard = u;
      G.flow.i++;
      nextChoice();
      return;
    }
    // the big hand: tap a neighbour to bring it to the middle; tap the empty background to put it away
    const hv = t.closest('[data-hv-i]');
    if (hv && G.viewer) { goViewer(Number(hv.dataset.hvI)); return; }
    if (G.viewer && t.classList?.contains('hv')) { closeViewer('down'); return; }
    if (t.closest('[data-sheet]') && !t.closest('.g-sheet-inner')) { if (!G.flow) { G.sheet = null; G.viewer = null; redraw(); } }
    return;
  }

  // the opening hand: tap a card to read it, then swipe along
  const mull = t.closest('[data-mull]');
  if (mull) { openViewer(Number(mull.dataset.mull), 'mull'); return; }

  const card = t.closest('.tcard');
  const relic = t.closest('.relic');
  const pb = t.closest('.pbar');
  const inHand = card?.classList.contains('in-hand');
  const target = relic ? { uid: Number(relic.dataset.uid) } : card && !inHand ? { uid: Number(card.dataset.uid) } : pb ? { p: Number(pb.dataset.p) } : null;

  if (G.flow) { if (target && !chooseOnTable(target)) flash('That is not one of the choices.'); return; }

  if (inHand) { openViewer(Number(card.dataset.uid)); return; }
  if (relic) { G.sheet = cardSheet(target.uid); redraw(); return; }

  // (attacking and blocking are worked on their own screen, over the table: decideHTML)
  if (card) {
    const c = s.cards[target.uid];
    // a creature: its side of the table, big, to read and swipe along (a ready
    // one of yours has a button to send it into the attack; or drag it at them)
    if (c.zone === 'board') { openViewer(c.uid, 'table'); return; }
    G.sheet = cardSheet(c.uid);
    redraw();
    return;
  }
  // a folded side (three players) opens; any other player's bar: their details, in words
  if (pb && pb.closest('.g-side.folded')) { unfold(Number(pb.dataset.p)); return; }
  if (pb) { G.sheet = playerSheet(Number(pb.dataset.p)); redraw(); }
}

function onAct(act, el) {
  const uid = Number(el.dataset.uid);
  const busyOk = ['menu', 'help', 'close', 'log', 'leave', 'speed', 'pace', 'alerts', 'rules', 'coach-skip', 'crown-info', 'reload'].includes(act);
  if (G.busy && !busyOk) return;
  // While choosing a target, the small chips on cards and bars are part of what you tap.
  const choosing = G.flow || G.atk || (G.blk && G.blk.sel != null);
  switch (act) {
    case 'ability': {
      const card = el.closest('.tcard');
      if (G.flow || G.sheet) { if (card) onClick({ target: card }); break; }
      openViewer(Number(el.dataset.ab), 'table');
      break;
    }
    case 'use-ability': startAbility(uid); break;
    case 'rite': startRite(uid); break;
    case 'unhex': G.sheet = null; G.viewer = null; dispatch({ t: 'unhex', p: G.me, uid }); break;
    case 'field-info': G.sheet = cardSheet(uid); redraw(); break;
    case 'suggest': if (G.suggest) { G.suggest = null; redraw(); } else startSuggest(); break;
    case 'suggest-close': G.suggest = null; redraw(); break;
    case 'suggest-do': {
      const a = G.suggest?.state === G.state ? G.suggest.a : null;
      G.suggest = null;
      if (a) dispatch(a); else redraw();
      break;
    }
    case 'crown-info':
      if (choosing) { const bar = el.closest('.pbar'); if (bar) onClick({ target: bar }); break; }
      flash(S().crown === G.me
        ? 'You hold the Crown: you draw an extra card at the end of each of your turns. Anyone who hits you in a fight takes it.'
        : `${name(S().crown)} holds the Crown: an extra card at the end of each of their turns. Hit them in a fight to take it.`);
      break;
    case 'close': if (G.viewer) { closeViewer('up'); break; } G.sheet = null; G.slip = null; redraw(); break;
    case 'recap-close': G.recap = null; redraw(); break;
    case 'fight-replay': {
      // the last fight again, big, in turn with whatever else is being shown
      const story = G.lastFight, g = G;
      if (!story) break;
      G.chain = G.chain.then(async () => {
        const root = document.getElementById('game');
        if (G !== g || !root) return;
        G.busy = true;
        root.classList.add('busy');
        try { await Fight.playStory(story, { stage: root }); } finally { if (G === g) { G.busy = false; root.classList.remove('busy'); redraw(); } }
      }).catch((e) => console.error(e));
      break;
    }
    case 'cancel': clearSelections(); G.sheet = null; redraw(); break;
    case 'ultra-intro-ok':
      ultraIntroSeen = true;
      if (ultraV2(S())) ultraNewSeen = true; // (its bullets cover what's new too)
      try { localStorage.setItem(ULTRA_INTRO, '1'); if (ultraNewSeen) localStorage.setItem(ULTRA_INTRO2, '1'); } catch { /* fine: seen for now */ }
      redraw();
      break;
    case 'ultra-new-ok':
      ultraNewSeen = true;
      try { localStorage.setItem(ULTRA_INTRO2, '1'); } catch { /* fine: seen for now */ }
      redraw();
      break;
    case 'keep': dispatch({ t: 'mulligan', p: G.me, redraw: false }); break;
    case 'redraw': dispatch({ t: 'mulligan', p: G.me, redraw: true }); break;
    case 'go': goTap(el); break;
    case 'end': clearSelections(); dispatch({ t: 'end', p: G.me }); break;
    case 'play': startPlay(uid, 'hand'); break;
    case 'play-legend': startPlay(uid, 'legend'); break;
    case 'fuse': startFuse(uid); break;
    case 'dig': G.sheet = null; tryMove({ t: 'dig', p: G.me }); break;
    case 'echo': startPlay(uid, 'discard'); break;
    case 'echo-open': G.sheet = cardSheet(uid, { from: 'discard' }); redraw(); break;
    case 'attack-from-sheet': G.sheet = null; G.viewer = null; toggleAttacker(uid); break;
    case 'attack': sendAttack(Number(el.dataset.p)); break;
    case 'block': tryMove({ t: 'block', p: G.me, blocks: G.blk?.pairs || [] }); break;
    case 'slip-no': G.slip = null; G.sheet = null; redraw(); break;
    case 'slip-yes': {
      const a = G.slip?.a;
      G.slip = null;
      G.sheet = null;
      if (!a) { redraw(); break; }
      if (a.t === 'end') clearSelections();
      dispatch(a);
      break;
    }
    case 'clear-blocks': G.blk.pairs = forcedBlocks(S()); G.blk.sel = null; G.blk.selA = null; G.suggest = null; redraw(); break;
    case 'pass': dispatch({ t: 'pass', p: G.me }); break;
    // the fight screens (decideHTML)
    case 'attack-open': openAttack(); break;
    case 'dec-target': {
      const p = Number(el.dataset.p);
      G.atk.target = G.focus = p;
      G.atk.hunt = G.atk.hunt.filter(([, y]) => S().cards[y]?.ctrl === p);
      G.suggest = null;
      redraw();
      break;
    }
    case 'dec-att': toggleAttacker(Number(el.dataset.u)); break;
    case 'dec-prey': preyTap(Number(el.dataset.u)); break;
    case 'dec-look': G.sheet = cardSheet(Number(el.dataset.u)); redraw(); break;
    case 'dec-why': flash(el.dataset.why || 'Not now.'); break;
    case 'dec-blk': blockTap(Number(el.dataset.u)); break;
    case 'dec-foe': attackerTap(Number(el.dataset.u)); break;
    case 'dec-unblk': unblock(Number(el.dataset.u), Number(el.dataset.att)); break;
    case 'dec-trick': openViewer(Number(el.dataset.u)); break;
    case 'dec-ab': G.sheet = cardSheet(Number(el.dataset.u)); redraw(); break;
    case 'use':
      G.sheet = null;
      G.flow = { a: { t: 'use', p: G.me, uid }, steps: [{ kind: 'sac', options: S().players[G.me].board.map((u) => ({ uid: u })), prompt: 'Sacrifice which creature to draw a card?' }], i: 0, multi: [] };
      nextChoice();
      break;
    case 'phoenix': dispatch({ t: 'phoenix', p: G.me, uid }); break;
    case 'skip': G.flow.i++; nextChoice(); break;
    case 'done-targets': G.flow.a.targets = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; nextChoice(); break;
    case 'done-picks': G.flow.a.picks = [...G.flow.multi]; G.flow.multi = []; G.flow.i++; nextChoice(); break;
    case 'wisp-top': G.flow.a.bottom = false; G.flow.i++; nextChoice(); break;
    case 'wisp-bottom': G.flow.a.bottom = true; G.flow.i++; nextChoice(); break;
    case 'tax-pay': G.flow.a.payTax = true; G.flow.i++; nextChoice(); break;
    case 'tax-no': G.flow.a.payTax = false; G.flow.i++; nextChoice(); break;
    case 'discards': G.sheet = discardSheet(Number(el.dataset.of)); redraw(); break;
    case 'menu': G.sheet = menuSheet(); redraw(); break;
    case 'log': G.sheet = logSheet(); redraw(); break;
    case 'speed': {
      const fast = !fastOn();
      try { localStorage.setItem(SPEED_KEY, fast ? '1' : '0'); } catch { /* fine */ }
      FX.setSpeed(fast ? SPEEDS.fast : SPEEDS.normal);
      G.sheet = menuSheet();
      redraw();
      break;
    }
    case 'alerts': alertsTap(Push.status() !== 'on').catch((e) => flash(e.message)).finally(() => { if (G) { G.sheet = menuSheet(); redraw(); } }); break;
    case 'pace': {
      try { localStorage.setItem('collective.tapThrough', tapThrough() ? '0' : '1'); } catch { /* fine */ }
      G.sheet = menuSheet();
      redraw();
      break;
    }
    case 'fixes': G.sheet = fixSheet(); redraw(); break;
    case 'fix-life': dispatch({ t: 'fix', by: G.me, op: 'life', p: Number(el.dataset.p), n: Number(el.dataset.n) }); G.sheet = fixSheet(); redraw(); break;
    case 'fix-energy': dispatch({ t: 'fix', by: G.me, op: 'energy', p: G.me, n: Number(el.dataset.n) }); G.sheet = fixSheet(); redraw(); break;
    case 'undo': G.sheet = null; if (G.mode === 'practice') undo(); break;
    case 'review': if (G.rec) { G.sheet = Ins.reviewHTML(G.rec); redraw(); } break;
    case 'share-game':
      if (G.rec) {
        el.disabled = true;
        el.textContent = 'Sending…';
        const rec = G.rec;
        Ins.shareGame(rec.id).then((code) => { rec.shared = code; }).catch((e) => flash(e.message))
          .finally(() => { if (G?.rec === rec && G.sheet?.startsWith('<div class="rv">')) { G.sheet = Ins.reviewHTML(rec); redraw(); } });
      }
      break;
    case 'coach-next': tutAdvance(); break;
    case 'coach-skip': G.sheet = null; G.tut.done = true; flash('Lesson skipped. 💡 (top right) suggests a move, and ☰ has help.'); redraw(); schedule(); break;
    case 'help': G.sheet = helpSheet(); redraw(); break;
    case 'tutorial': startTutorial(); break;
    case 'concede':
      if (!G.concedeArm || Date.now() - G.concedeArm > 4000) { G.concedeArm = Date.now(); G.sheet = menuSheet(); redraw(); break; }
      G.concedeArm = 0;
      G.sheet = null;
      dispatch({ t: 'concede', p: G.me });
      break;
    case 'rules': leave('#/rules'); break;
    case 'leave': leave(); break;
    case 'reload': location.reload(); break;
    case 'lobby': Net.backToLobby(G.code).catch((e) => flash(e.message)); break;
    case 'rematch': {
      const setup = { ...G.setup, seed: (Math.random() * 2 ** 31) | 0, startEnergy: RULES.startEnergy, deckClock: true, ultra: G.setup.ultra ? ULTRA_V : false };
      begin({ mode: G.mode, setup, actions: [], me: G.me, bots: [...G.bots], level: G.level });
      break;
    }
  }
}
