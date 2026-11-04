// Plays the guided lesson's script against the engine and prints what the
// table looks like at each step, so the coach's claims can be checked.
//   node tools/check-tutorial.mjs

import { newGame, apply, actor, power, vitality } from '../js/engine.js';
import { TUTORIAL, botAction, expectedAction, matches } from '../js/tutorial.js';

let s = newGame(TUTORIAL.setup);
for (const p of [0, 1]) s = apply(s, { t: 'mulligan', p, redraw: false }).state;

const board = (pi) => s.players[pi].board.map((u) => { const c = s.cards[u]; return `${c.cid} ${power(s, c)}/${vitality(s, c) - c.dmg}${c.ex ? ' (ex)' : ''}`; }).join(', ') || '—';
const where = () => `turn ${s.turn} · ${s.phase}${s.combat ? `/${s.combat.step}` : ''} · to move: ${actor(s) === 0 ? 'You' : 'Bot'} · Life ${s.players[0].life}–${s.players[1].life} · Energy ${s.players[0].energy}/${s.players[0].maxEnergy}`;
let failed = false;

TUTORIAL.steps.forEach((st, i) => {
  const head = `${String(i + 1).padStart(2)}.`;
  if (st.next) { console.log(`${head} [next] ${where()}\n     you: ${board(0)}\n     bot: ${board(1)}\n     hand: ${s.players[0].hand.map((u) => s.cards[u].cid).join(', ')}`); return; }
  if (st.expect) {
    if (actor(s) !== 0) { console.log(`${head} FAIL: expected your move but ${where()}`); failed = true; return; }
    const a = expectedAction(s, 0, st.expect);
    const r = apply(s, a);
    if (r.error || !matches(s, a, st.expect)) { console.log(`${head} FAIL ${JSON.stringify(st.expect)}: ${r.error || 'no match'}`); failed = true; return; }
    s = r.state;
    console.log(`${head} [you] ${JSON.stringify(st.expect)} → ${where()}`);
    return;
  }
  for (const m of st.bot) {
    if (actor(s) !== 1) { console.log(`${head} FAIL: bot move ${JSON.stringify(m)} but ${where()}`); failed = true; return; }
    const r = apply(s, botAction(s, 1, m));
    if (r.error) { console.log(`${head} FAIL bot ${JSON.stringify(m)}: ${r.error}`); failed = true; return; }
    s = r.state;
  }
  console.log(`${head} [bot] ${st.bot.map((m) => m.t + (m.cid ? ' ' + m.cid : '')).join(', ')} → ${where()}`);
});
console.log(failed ? '\nTUTORIAL SCRIPT BROKEN' : '\nok: the whole lesson plays through');
process.exit(failed ? 1 : 0);
