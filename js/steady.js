// Keeping the game steady on a phone. iOS closes a page that runs out of
// memory for what moves on it (on an iPhone everything that moves is a layer
// as big as itself, ~12.6 MB a screen at 3x): the screen flashes white and the
// page starts again, or, for the app on the home screen, the whole app starts
// again at its first page. Nothing on the page hears it coming, so this
// notices it afterwards. While the page is open and in sight, a mark says so
// (localStorage, which a restart keeps), refreshed every few seconds; hiding
// or leaving the page clears it. A mark found at start-up, under half an hour
// old, that no page still open answers for (BroadcastChannel) means the last
// page was closed under us. (Two minutes until 2026-11-16: the app on the home
// screen may not start again by itself, and a closing found late still counts.)
//
// Each phone learns what it can hold from its own closings (Asaf, 2026-11-14:
// "Is there a way for you to have it be able to assess what level of graphics
// it could handle given the phone situation and adjust before game starts?").
// No page can read a phone's memory, and a test that filled it would close the
// game itself, so:
//  - Its level (calm(): 0 as made, 1 fewer cards acting at once and less
//    moving, 2 the cards only act opened big and fights charge, 3 nothing
//    moves by itself) goes up a step with each closing and stays there, day
//    after day, until three games in a row end without one; then it eases
//    back a step. (Until 2026-11-14 it lasted the day, so every evening began
//    at full motion and had to be closed down to steady again.)
//  - The game keeps its own count of what it holds (meter(): the pictures on
//    the page, decoded; what's moving, as layers at the screen's scale;
//    canvases), noted every few seconds and at the heavy moments (note()). After a closing, the last note
//    says how much it held just before: the phone's budget becomes a little
//    under that, and the cards fit what they set moving into what's left of it
//    (left(), js/cards-alive.js). Each easing back gives it a little more.
//  - Those notes, with the phone's screen and browser (no names), are kept
//    after a closing and sent to the game's database the next time the phone
//    is in an online room (unsent(), sentTo()), so what closes the game on real
//    phones can be looked at. The menus pass them on by hand too, sent to a
//    room or not (toShare(), shareClosings()).

const OPEN = 'collective.open'; // { id, at }: the page last seen open and in sight
const CALM = 'collective.calm'; // { level, n, steady, at }: this phone's level, its closings, games ended since the last
const BUDGET = 'collective.budget'; // { mb, at }: how much this phone has shown it can hold
const NOTES = 'collective.notes'; // [{ at, where, doing, mb, ... }]: the last few notes on what the page held
const CRASHES = 'collective.crashes'; // [{ at, found, ..., room?, shared? }]: the last few closings (room: the online game they went to; shared: passed on by hand)
const FLOOR_MB = 60; // (a budget never goes under this: under it, something else closed the page)
const me = Math.random().toString(36).slice(2);
let level = 0, closings = 0, steady = 0, doingNow = '';

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* no storage: nothing to keep */ } };
const keepCalm = () => write(CALM, { level, n: closings, steady, at: Date.now() });

// Call once at start-up. Resolves true (within half a second) when the page
// before this one was closed under us.
export function startSteady() {
  const c = read(CALM);
  if (c) { level = c.level || 0; closings = c.n || 0; steady = c.steady || 0; }
  const was = read(OPEN), before = read(NOTES) || []; // (before this page's own mark and notes)
  let chan = null;
  try { chan = new BroadcastChannel('collective-steady'); chan.onmessage = (e) => { if (e.data === 'who') chan.postMessage('here'); }; } catch { /* (an older browser: no asking) */ }
  const mark = () => {
    if (document.visibilityState === 'visible') { write(OPEN, { id: me, at: Date.now() }); note(); }
    else if (read(OPEN)?.id === me) { try { localStorage.removeItem(OPEN); } catch { /* (as above) */ } }
  };
  mark();
  setInterval(mark, 5000);
  document.addEventListener('visibilitychange', mark);
  addEventListener('pageshow', mark);
  addEventListener('pagehide', () => { if (read(OPEN)?.id === me) { try { localStorage.removeItem(OPEN); } catch { /* (as above) */ } } });
  if (!was || was.id === me || Date.now() - was.at > 30 * 60e3) return checking;
  // a page still open (another tab) answers for its mark; none: it was closed under us
  return (checking = new Promise((resolve) => {
    let open = false;
    const hear = (e) => { if (e.data === 'here') open = true; };
    chan?.addEventListener('message', hear);
    chan?.postMessage('who');
    setTimeout(() => {
      chan?.removeEventListener('message', hear);
      if (open) { resolve(false); return; }
      closed(was, before.filter((x) => x.page === was.id));
      resolve(true);
    }, chan ? 400 : 0);
  }));
}

// The check above, done (a closing it found is among unsent() by then). The
// last room is rejoined straight after start-up, before the check is through,
// so its notes wait for this (game-ui.js enterRoom); without it the closing
// just found went only the time after.
let checking = Promise.resolve(false);
export const checked = () => checking;

// The page was closed under us: a step calmer, a budget under what it held, and a note to send.
function closed(was, notes) {
  closings++;
  level = Math.min(3, level + 1);
  steady = 0;
  keepCalm();
  const last = notes[notes.length - 1];
  if (last?.mb > 0) {
    const b = read(BUDGET), mb = Math.max(FLOOR_MB, Math.round(last.mb * 0.8));
    write(BUDGET, { mb: b?.mb ? Math.min(b.mb, mb) : mb, at: Date.now() });
  }
  const list = read(CRASHES) || [];
  // (a tag of the phone's own, not its seat's id: its closings can be told apart, but not tied to a name)
  let tag = read('collective.phoneTag');
  if (!tag) { tag = Math.random().toString(36).slice(2, 10); write('collective.phoneTag', tag); }
  list.push({
    at: was.at, found: Date.now(), phone: tag, level, closings,
    budget: read(BUDGET)?.mb || null,
    screen: { w: screen.width, h: screen.height, dpr: devicePixelRatio, inner: [innerWidth, innerHeight] },
    ua: navigator.userAgent, app: matchMedia?.('(display-mode: standalone)').matches || !!navigator.standalone,
    notes: notes.slice(-6).map(({ page, ...x }) => x),
  });
  write(CRASHES, list.slice(-8));
}

// A game ended (any kind but the lesson; `id` its id, counted once). Three in
// a row since the last closing: a step livelier, and a little more room in
// the budget.
export function gameDone(id) {
  const done = read('collective.steadyGames') || [];
  if (id && done.includes(id)) return;
  write('collective.steadyGames', [...done, id].slice(-6));
  steady++;
  if (steady >= 3 && level > 0) {
    level--;
    steady = 0;
    const b = read(BUDGET);
    if (b?.mb) write(BUDGET, { mb: Math.round(b.mb * 1.25), at: Date.now() });
  }
  keepCalm();
}

// How calm the cards should be: 0, 1 or 2 (above), or 3, nothing moving at all
// (the cards' own pictures only). The calmer of this phone's level and your
// choice in the game's menu (Moving cards: lively, calm or still; Asaf,
// 2026-11-12, after "It seems to be crashing a lot"). ?calm=0|1|2|3 sets the
// level by hand (for testing).
const CHOICE = 'collective.cardsMode'; // localStorage: 'lively' | 'calm' | 'still'
export const CHOICES = ['lively', 'calm', 'still'];
const FLOOR = { lively: 0, calm: 1, still: 3 };
export function chosen() { try { return CHOICES.includes(localStorage.getItem(CHOICE)) ? localStorage.getItem(CHOICE) : 'lively'; } catch { return 'lively'; } }
export function choose(c) { try { localStorage.setItem(CHOICE, c); } catch { /* (as above) */ } }
export function calm() { return Math.max(level, FLOOR[chosen()] || 0); }
export const phoneLevel = () => level;
export const closingsSoFar = () => closings;

// ── what the page holds ─────────────────────────────────────────────
// The game's own count, in MB (a phone's browser says nothing of its memory):
// every picture on the page at its own size (4 bytes a pixel), every element
// with a motion running as a layer at the screen's scale (capped at four
// screens each), and canvases. Taken at most once a quarter second.
let last = null;
export function meter() {
  if (last && performance.now() - last.t < 250) return last;
  const dpr = devicePixelRatio || 1, cap = innerWidth * innerHeight * 4;
  let img = 0, nImg = 0, lay = 0, nAnim = 0, cv = 0;
  for (const im of document.images) if (im.complete && im.naturalWidth > 1) { img += im.naturalWidth * im.naturalHeight; nImg++; }
  const seen = new Set();
  for (const a of document.getAnimations()) {
    const el = a.playState === 'running' && a.effect?.target;
    if (!el || seen.has(el) || !el.getBoundingClientRect) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    lay += Math.min(r.width * r.height, cap);
    nAnim++;
  }
  for (const c of document.getElementsByTagName('canvas')) cv += c.width * c.height;
  const m = { img: img * 4 / 1e6, lay: lay * dpr * dpr * 4 / 1e6, cv: cv * 4 / 1e6, nImg, nAnim, nEl: document.getElementsByTagName('*').length };
  m.mb = m.img + m.lay + m.cv;
  last = { ...m, t: performance.now() };
  return last;
}

// The budget this phone has learned (MB), or Infinity before it has closed
// the game (never under FLOOR_MB).
export const budget = () => read(BUDGET)?.mb || Infinity;
// What's left of the budget now, with `more` MB about to be added.
export function left(more = 0) { const b = budget(); return b === Infinity ? Infinity : b - meter().mb - more; }
// A screen's worth of moving layer, in MB (a ceiling in screens becomes MB).
export const screenMB = () => (innerWidth * innerHeight * (devicePixelRatio || 1) ** 2 * 4) / 1e6;

// ── notes ───────────────────────────────────────────────────────────
// What the game is doing now ('a fight shown big: 4 against 3', ...), set at
// the heavy moments; doing(what, true) also notes it at once.
export function doing(what, now = false) { doingNow = what || ''; if (now) note(); }
export function note() {
  let m;
  try { m = meter(); } catch { return; }
  const list = (read(NOTES) || []).filter((x) => Date.now() - x.at < 600e3);
  const r = (x) => Math.round(x * 10) / 10;
  list.push({ at: Date.now(), page: me, where: location.hash || '#/', doing: doingNow, mb: r(m.mb), img: r(m.img), lay: r(m.lay), cv: r(m.cv), nImg: m.nImg, nAnim: m.nAnim, nEl: m.nEl, level: calm() });
  write(NOTES, list.slice(-8));
}

// The closings kept on the phone, each marked as it goes on: to an online
// room (unsent(): not yet, nor passed on by hand), and by hand (toShare(): not
// yet, from the last three days). Until 2026-11-16 a closing sent to a room
// left the phone, so after one in an online game the menus had nothing to
// share (Asaf: "Just crashed but don't see share crash notes").
const crashes = () => read(CRASHES) || [];
const SHARE_FOR = 3 * 864e5;
function markCrashes(list, what) {
  const was = (c) => list.some((x) => x.at === c.at && x.found === c.found);
  write(CRASHES, crashes().map((c) => (was(c) ? { ...c, ...what } : c)));
}
export const unsent = () => crashes().filter((c) => !c.room && !c.shared);
export function sentTo(code, list) { markCrashes(list, { room: code }); }
export const toShare = () => crashes().filter((c) => !c.shared && Date.now() - (c.found || c.at) < SHARE_FOR);

// ── passing them on by hand ─────────────────────────────────────────
// "Share crash notes" in Home's menu and the game's, there while any wait
// (Asaf, 2026-11-15: "Will I be able to generate a report from a bot game
// that crashes if I don't finish the game?"): a closing in a bot game or the
// campaign has no room to go to, and one in an online game went to a room
// whose code is soon forgotten. The phone's share sheet gets them as text, a
// line on each (and the game it went to) and then all of it as data, as a
// room gets it; without one the clipboard does, and failing both, a box to
// copy from. Shared or copied, the button goes until the next closing. Call
// it straight from the tap: a share sheet opens only on one.
export function closingsText(list = toShare()) {
  const when = (t) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  const lines = list.map((c, i) => {
    const n = c.notes?.[c.notes.length - 1];
    return `${i + 1}. ${when(c.at)}${n ? `: ${n.where}${n.doing ? `, ${n.doing}` : ''}, ${n.mb} MB` : ''}${c.room ? ` (sent to game ${c.room})` : ''}`;
  });
  return [`The Collective: crash notes (${list.length === 1 ? 'the game closed once' : `the game closed ${list.length} times`} on this phone)`, ...lines, JSON.stringify(list)].join('\n');
}
// Resolves { how: 'shared' | 'copied' | 'cancelled' | 'none' }, or { how: 'show', text } (still on the phone).
export async function shareClosings() {
  const list = toShare();
  if (!list.length) return { how: 'none' };
  const text = closingsText(list);
  const done = (how) => { markCrashes(list, { shared: true }); return { how }; };
  if (navigator.share) {
    try { await navigator.share({ title: 'The Collective: crash notes', text }); return done('shared'); } catch (e) { if (e?.name === 'AbortError') return { how: 'cancelled' }; }
  }
  try { await navigator.clipboard.writeText(text); return done('copied'); } catch { /* (no clipboard either) */ }
  return { how: 'show', text };
}
export function showClosingsText(text) {
  document.querySelector('.notes-box')?.remove();
  const box = document.createElement('div');
  box.className = 'notes-box';
  box.innerHTML = '<p>Copy these crash notes to pass them on:</p><textarea readonly></textarea><button class="btn">Close</button>';
  box.querySelector('textarea').value = text;
  box.querySelector('button').onclick = () => box.remove();
  document.body.appendChild(box);
  box.querySelector('textarea').select();
}

// Start fresh: the copy of the game's files kept on the phone (sw.js) and the
// worker that keeps it go, and the page loads anew from the network, where it
// was (a game under way comes straight back: it's saved after every move).
// Games, decks, the campaign and settings stay. Home's menu and the game's
// menu have it; ?fresh=1 does the first half (js/app.js).
export async function startFresh() {
  try { for (const r of (await navigator.serviceWorker?.getRegistrations?.()) || []) await r.unregister(); } catch { /* (none) */ }
  try { await caches.delete('collective-files'); } catch { /* (none) */ }
  if (location.search) location.replace(location.pathname + location.hash);
  else location.reload();
}
try {
  const q = new URLSearchParams(location.search).get('calm');
  if (['0', '1', '2', '3'].includes(q)) { level = Number(q); write(CALM, { level, n: 0, steady: 0, at: Date.now() }); }
} catch { /* (as above) */ }
