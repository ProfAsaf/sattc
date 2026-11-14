// SATTC Ultra: since 14 November 2026 the only version of the game. (From 7
// November a switch on the PvP page, and one in each room's lobby, chose it or
// the standard rules.) Every new game, room, draft and deck plays it; a game
// saved under the standard rules still replays as it was (its own setup says
// so), and the guided lesson keeps to the basics. The engine sees `setup.ultra`.
export const ultra = () => true;

// The whole app wears it (body.ultra).
export const paint = () => document.body.classList.add('ultra');
