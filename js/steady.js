// Keeping the game steady on a phone. iOS closes a page that runs out of
// memory for what moves on it (on an iPhone everything that moves is a layer
// as big as itself, ~12.6 MB a screen at 3x): the screen flashes white and the
// page starts again, or, for the app on the home screen, the whole app starts
// again at its first page. Nothing on the page hears it coming, so this
// notices it afterwards. While the page is open and in sight, a mark says so
// (localStorage, which a restart keeps), refreshed every few seconds; hiding
// or leaving the page clears it. A fresh mark found at start-up that no page
// still open answers for (BroadcastChannel) means the last page was closed
// under us.
// Each such closing makes the cards calmer for the rest of the day (calm():
// 0 as made, 1 fewer at once and less moving, 2 the cards only act opened big
// and fights charge as they used to), read by js/cards-alive.js.

const OPEN = 'collective.open'; // localStorage: { id, at }, the page last seen open and in sight
const CALM = 'collective.calm'; // localStorage: { level, at, n }, today's closings
const DAY = 24 * 3600e3;
const me = Math.random().toString(36).slice(2);
let level = 0, closings = 0;

const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* no storage: nothing to keep */ } };

// Call once at start-up. Resolves true (within half a second) when the page
// before this one was closed under us.
export function startSteady() {
  const c = read(CALM);
  if (c && Date.now() - c.at < DAY) { level = c.level || 0; closings = c.n || 0; }
  const was = read(OPEN); // (before this page's own mark)
  let chan = null;
  try { chan = new BroadcastChannel('collective-steady'); chan.onmessage = (e) => { if (e.data === 'who') chan.postMessage('here'); }; } catch { /* (an older browser: no asking) */ }
  const mark = () => {
    if (document.visibilityState === 'visible') write(OPEN, { id: me, at: Date.now() });
    else if (read(OPEN)?.id === me) { try { localStorage.removeItem(OPEN); } catch { /* (as above) */ } }
  };
  mark();
  setInterval(mark, 5000);
  document.addEventListener('visibilitychange', mark);
  addEventListener('pageshow', mark);
  addEventListener('pagehide', () => { if (read(OPEN)?.id === me) { try { localStorage.removeItem(OPEN); } catch { /* (as above) */ } } });
  if (!was || was.id === me || Date.now() - was.at > 120e3) return Promise.resolve(false);
  // a page still open (another tab) answers for its mark; none: it was closed under us
  return new Promise((resolve) => {
    let open = false;
    const hear = (e) => { if (e.data === 'here') open = true; };
    chan?.addEventListener('message', hear);
    chan?.postMessage('who');
    setTimeout(() => {
      chan?.removeEventListener('message', hear);
      if (open) { resolve(false); return; }
      closings++;
      level = Math.min(2, level + 1);
      write(CALM, { level, at: Date.now(), n: closings });
      resolve(true);
    }, chan ? 400 : 0);
  });
}

// How calm the cards should be: 0, 1 or 2 (above), or 3, nothing moving at all
// (the cards' own pictures only). The calmer of today's closings and your
// choice in the game's menu (Moving cards: lively, calm or still; Asaf,
// 2026-11-12, after "It seems to be crashing a lot"). ?calm=0|1|2 sets the
// day's level by hand (for testing).
const CHOICE = 'collective.cardsMode'; // localStorage: 'lively' | 'calm' | 'still'
export const CHOICES = ['lively', 'calm', 'still'];
const FLOOR = { lively: 0, calm: 1, still: 3 };
export function chosen() { try { return CHOICES.includes(localStorage.getItem(CHOICE)) ? localStorage.getItem(CHOICE) : 'lively'; } catch { return 'lively'; } }
export function choose(c) { try { localStorage.setItem(CHOICE, c); } catch { /* (as above) */ } }
export function calm() { return Math.max(level, FLOOR[chosen()] || 0); }
export const dayLevel = () => level;
export const closingsToday = () => closings;

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
  if (q === '0' || q === '1' || q === '2') { level = Number(q); write(CALM, { level, at: Date.now(), n: 0 }); }
} catch { /* (as above) */ }
