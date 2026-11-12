// Keeping the game steady on a phone. iOS closes a page that runs out of
// memory for what moves on it (on an iPhone everything that moves is a layer
// as big as itself, ~12.6 MB a screen at 3x): the screen flashes white and the
// page starts again. Nothing on the page hears it coming, so this notices it
// afterwards. While the page is open and in sight a mark says so, refreshed
// every few seconds (sessionStorage, which a reload in the same tab keeps), and
// leaving or hiding the page clears it. A fresh mark found at start-up means
// the last page ended without either: it was closed under us.
// Each such closing makes the cards calmer for the rest of the day (calm():
// 0 as made, 1 fewer at once and less moving, 2 the cards only act opened big
// and fights charge as they used to), read by js/cards-alive.js.

const OPEN = 'collective.open'; // sessionStorage: when the page was last seen open and in sight
const CALM = 'collective.calm'; // localStorage: { level, at, n }, today's closings
const DAY = 24 * 3600e3;
let level = 0, closings = 0;

// Call once at start-up. True when the page before this one was closed under us.
export function startSteady() {
  let closed = false;
  try {
    const was = Number(sessionStorage.getItem(OPEN)) || 0;
    const c = JSON.parse(localStorage.getItem(CALM) || 'null');
    if (c && Date.now() - c.at < DAY) { level = c.level || 0; closings = c.n || 0; }
    if (was && Date.now() - was < 120e3) {
      closed = true;
      closings++;
      level = Math.min(2, level + 1);
      localStorage.setItem(CALM, JSON.stringify({ level, at: Date.now(), n: closings }));
    }
  } catch { /* no storage: nothing to learn from */ }
  const mark = () => {
    try {
      if (document.visibilityState === 'visible') sessionStorage.setItem(OPEN, String(Date.now()));
      else sessionStorage.removeItem(OPEN);
    } catch { /* (as above) */ }
  };
  mark();
  setInterval(mark, 5000);
  document.addEventListener('visibilitychange', mark);
  addEventListener('pageshow', mark);
  addEventListener('pagehide', () => { try { sessionStorage.removeItem(OPEN); } catch { /* (as above) */ } });
  return closed;
}

// How calm the cards should be: 0, 1 or 2 (above). ?calm=0|1|2 sets it by hand
// (for testing), until the next closing or a day passes.
export function calm() { return level; }
export const closingsToday = () => closings;
try {
  const q = new URLSearchParams(location.search).get('calm');
  if (q === '0' || q === '1' || q === '2') { level = Number(q); localStorage.setItem(CALM, JSON.stringify({ level, at: Date.now(), n: 0 })); }
} catch { /* (as above) */ }
