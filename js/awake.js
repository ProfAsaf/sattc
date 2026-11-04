// Keep the phone's screen on while a game, a draft or an online room is open.
// A phone that locks drops out of an online game until it is unlocked, and
// everyone waits if it was its turn. The browser lets go of the lock whenever
// the page is hidden, so it is asked for again when the page comes back (and
// on a tap, for browsers that only allow it after one). Where the browser has
// no Screen Wake Lock (or says no, say on low battery), nothing happens.

const want = new Set(); // who wants the screen on: 'game', 'draft', 'room'
let lock = null, asking = false;

async function ask() {
  if (lock || asking || !want.size || document.visibilityState !== 'visible' || !navigator.wakeLock) return;
  asking = true;
  try {
    lock = await navigator.wakeLock.request('screen');
    lock.addEventListener('release', () => { lock = null; });
  } catch { /* not allowed now: the next tap or return to the page asks again */ }
  asking = false;
  if (lock && !want.size) letGo(); // everyone left while we were asking
}

function letGo() {
  const l = lock;
  lock = null;
  l?.release().catch(() => { /* already gone */ });
}

/** keepAwake('game', true) while a game is open, keepAwake('game', false) when it closes. */
export function keepAwake(who, on) {
  if (on) want.add(who); else want.delete(who);
  if (want.size) ask(); else letGo();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', ask);
  addEventListener('pointerdown', ask, true);
}
