// SATTC Ultra: a switch on Home for trying bigger changes to the rules beside
// the standard game. This phone remembers it. New practice games and new rooms
// take it from here; a room keeps its own (its host can flip it in the lobby),
// so everyone at a table plays the same rules. The engine sees `setup.ultra`.
const KEY = 'collective.ultra';
let on = (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();

export const ultra = () => on;

export function setUltra(v) {
  on = !!v;
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* private browsing: this visit only */ }
  paint();
}

// The whole app wears it (body.ultra), so you can tell at a glance.
export const paint = () => document.body.classList.toggle('ultra', on);
