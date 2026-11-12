// Shieldwright: she hammers out a shield of light, and sends it to a friend.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (it gives a Shield to a creature:
// the card's own text; the suggestion was defender), element: light (the shield she forges is
// light, the glass shields behind her). Alone, her gift goes to the warrior waiting at the forge
// door (`alone`); aimed, to T = k.aim.
//   0-540      the gather: the hammer swings back over her shoulder (anticipation), the tongs steady
//              the shield on the anvil, the anvil's face warming.
//   540        the first blow: the hammer comes down on the shield's rim (the arm swings through
//              ~90 degrees about the shoulder); the shield jolts, flares; sparks fly off it, the
//              anvil flashes, the shields behind her answer with a chime of light.
//   700-1000   the hammer bounces up and swings back, the shield glowing hotter.
//   1000       the finishing blow: harder, a ring of light runs out over the anvil, the shield
//              blazes white and stays hot.
//   1000-1500  she holds it a breath, the hammer resting low, the shield trembling with light.
//   1500       (BEATS.release) the tongs fling it up and it leaves: the shield flies from the anvil
//              to T on an arc, turning as it goes, a trail of gold flecks behind it.
//   1950       (BEATS.impact) at T the shield lands: a flash, a ring of gold, the glass shield
//              hangs there glowing, motes rising; then it cools and fades.
//   2100-3300  the hammer and tongs come home; the anvil cools.
//   3300-3800  a new shield forms in the tongs (a pulse of light), and everything is as drawn
//              (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; the flight is worked out from her `emit` (the shield on the
// anvil) and T; everything that flies or lands is on the overlay (T may be on another card).
export const END = 4200;
export const BEATS = { release: 1500, impact: 1950, settle: 3800 };
export const STILLS = [300, 560, 1010, 1380, 1620, 1950, 2500, 3900];

export const textures = {
  spark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 236 + 19 * c * c, 170 + 80 * c * c, Math.min(1, c * c * 2.2)]; }],
  ember: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 170 + 85 * c * c, 60 + 150 * c * c * c, Math.min(1, c * c * 2.4)]; }],
  star: [48, 48, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 9 + dy, dy * 9 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.9); return [255, 244 + 11 * v, 205 + 50 * v, v]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth, fix = (n) => n.toFixed(2);
  const S = k.spec, E = S.emit, ANV = S.anvil, SH = S.shoulder;
  const T = k.aim || S.alone, HOME = 3800;
  const B = [176, 125]; // where the hammer meets the shield's rim
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,236,.95), rgba(255,226,150,.6) 28%, rgba(255,196,100,.18) 58%, rgba(255,170,70,0) 100%); }
    .fx-copy.f-hot { mix-blend-mode: plus-lighter; filter: brightness(1.7) saturate(1.3) sepia(.3); }`);
  const BLOWS = [{ t: 540, p: 1 }, { t: 1000, p: 1.5 }];

  // ── the hammer: back over her shoulder, down on the shield, up and down again, rests, comes home
  const hammer = k.part('hammer');
  act(hammer, [[0, { transform: 'none' }, 'ease-in-out'], [400, { transform: 'rotate(-15deg)' }, 'cubic-bezier(.6,0,1,.6)'], [540, { transform: 'rotate(84deg)' }, 'ease-out'],
    [640, { transform: 'rotate(70deg)' }, 'ease-in-out'], [850, { transform: 'rotate(10deg)' }, 'cubic-bezier(.6,0,1,.6)'], [1000, { transform: 'rotate(88deg)' }, 'ease-out'],
    [1120, { transform: 'rotate(80deg)' }, eio], [1500, { transform: 'rotate(84deg)' }, eio], [2250, { transform: 'rotate(20deg)' }, eio], [2900, { transform: 'rotate(-4deg)' }, 'ease-out'], [HOME, { transform: 'none' }]]);
  // ── the tongs: steady, jolting at each blow, flinging the shield up at the release, then home
  act(k.part('tongs'), [[0, { transform: 'none' }, eio], [520, { transform: 'none' }, 'ease-out'], [570, { transform: 'rotate(1.8deg)' }, eio], [720, { transform: 'rotate(-.4deg)' }, eio],
    [990, { transform: 'rotate(0deg)' }, 'ease-out'], [1030, { transform: 'rotate(2.4deg)' }, eio], [1200, { transform: 'rotate(-.5deg)' }, eio], [1400, { transform: 'rotate(1.2deg)' }, 'ease-in'], [1500, { transform: 'rotate(-14deg)' }, 'ease-out'],
    [1700, { transform: 'rotate(-14deg)' }, eio], [2400, { transform: 'rotate(-3deg)' }, eio], [3300, { transform: 'none' }]]);

  // ── the shield on the anvil: jolts at each blow, blazes, is flung; a new one forms in the tongs
  const KF = [[0, { transform: 'none' }, 'ease-out'], [540, { transform: 'none' }, 'ease-out'], [590, { transform: 'translate(-.8px, 1px) scale(1.06, .94)' }, eio], [760, { transform: 'scale(1)' }, 'ease-out'],
    [1000, { transform: 'scale(1)' }, 'ease-out'], [1050, { transform: 'translate(-1.2px, 1.4px) scale(1.09, .9)' }, eio], [1250, { transform: 'scale(1.02)' }, eio], [1400, { transform: 'scale(1.03)' }, 'ease-in'],
    [1500, { transform: `${k.T(0, -8)} scale(1.04)` }, 'ease-out'], [1560, { transform: `${k.T(0, -9)} scale(1.04)` }]];
  const forged = k.part('forged');
  act(forged, [...KF, [1561, { transform: `${k.T(0, -9)} scale(1.04)`, opacity: 0 }], [3250, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [3600, { transform: 'scale(1.06)', opacity: 1 }, eio], [HOME, { transform: 'none', opacity: 1 }]]);
  const hot = k.copy('forged', 'f-hot');
  const lift = `${k.T(0, -9)} scale(1.04)`;
  act(hot, [[0, { transform: 'none', opacity: 0 }, 'ease-out'], [540, { transform: 'none', opacity: 0 }, 'ease-out'], [590, { transform: 'translate(-.8px, 1px) scale(1.06, .94)', opacity: 0.85 }, eio], [760, { transform: 'scale(1)', opacity: 0.35 }, 'ease-out'],
    [1000, { transform: 'scale(1)', opacity: 0.4 }, 'ease-out'], [1050, { transform: 'translate(-1.2px, 1.4px) scale(1.09, .9)', opacity: 1 }, eio], [1250, { transform: 'scale(1.02)', opacity: 0.85 }, eio], [1400, { transform: 'scale(1.03)', opacity: 0.8 }, 'ease-in'],
    [1500, { transform: lift, opacity: 0.8 }, 'ease-out'], [1560, { transform: lift, opacity: 0.8 }], [1561, { transform: lift, opacity: 0 }], [3250, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [3600, { transform: 'scale(1.06)', opacity: 1 }, eio], [4000, { transform: 'none', opacity: 0 }]]);

  // ── the sparks drawn off the shield, flying with the blows and coming back at the end
  act(k.part('sparks'), [[0, { transform: 'none', opacity: 1 }, 'ease-in'], [380, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [540, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [660, { transform: 'scale(1.25)', opacity: 1 }, eio],
    [960, { transform: 'scale(1.1)', opacity: 0.2 }, 'ease-out'], [1000, { transform: 'scale(.8)', opacity: 0 }], [1100, { transform: 'scale(1.35)', opacity: 1 }, eio], [1500, { transform: 'scale(1.2)', opacity: 0.4 }, eio], [2500, { transform: 'scale(1.3)', opacity: 0 }],
    [3300, { transform: 'scale(1)', opacity: 0 }, 'ease-out'], [3700, { transform: 'none', opacity: 1 }]]);

  // ── the shields behind her chime with each blow, and once more as the new one leaves
  const stack = k.part('stack');
  act(stack, [[0, { transform: 'none' }, 'ease-out'], [570, { transform: 'none' }, 'ease-out'], [640, { transform: 'translate(0px, -.6px) scale(1.012)' }, eio], [900, { transform: 'none' }, 'ease-out'], [1040, { transform: 'none' }, 'ease-out'],
    [1110, { transform: 'translate(0px, -1px) scale(1.02)' }, eio], [1400, { transform: 'none' }, 'ease-out'], [1560, { transform: 'none' }, 'ease-out'], [1630, { transform: 'translate(0px, -.6px) scale(1.012)' }, eio], [2000, { transform: 'none' }]]);
  act(k.copy('stack', 'f-hot'), [[0, { transform: 'none', opacity: 0 }, 'ease-out'], [570, { transform: 'none', opacity: 0 }, 'ease-out'], [660, { transform: 'scale(1.012)', opacity: 0.4 }, eio], [1000, { transform: 'none', opacity: 0.1 }, 'ease-out'], [1110, { transform: 'scale(1.02)', opacity: 0.7 }, eio],
    [1500, { transform: 'none', opacity: 0.3 }, 'ease-out'], [1640, { transform: 'scale(1.012)', opacity: 0.55 }, eio], [2300, { transform: 'none', opacity: 0 }]]);

  // ── the forge: the anvil's face flashing, the room warm, the blows' stars, sparks and rings
  fx(k.lightIn('g-warm', [ANV[0] + 4, ANV[1] - 2], 80, 46), [[300, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [600, { transform: 'scale(1)', opacity: 0.8 }, eio], [820, { transform: 'scale(.9)', opacity: 0.4 }, 'ease-out'], [1060, { transform: 'scale(1.1)', opacity: 1 }, eio],
    [1700, { transform: 'scale(1)', opacity: 0.55 }, eio], [2900, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-gold', [E[0], E[1] - 4], 70, 70), [[500, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [620, { transform: 'scale(1.05)', opacity: 0.7 }, eio], [900, { transform: 'scale(.9)', opacity: 0.3 }, 'ease-out'], [1070, { transform: 'scale(1.25)', opacity: 0.95 }, eio],
    [1480, { transform: 'scale(1.1)', opacity: 0.7 }, 'ease-in'], [1700, { transform: 'scale(.8)', opacity: 0 }]]);
  const ringS = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><ellipse cx="50" cy="14" rx="44" ry="8" fill="none" stroke="#fff0c2" stroke-width="2" filter="url(#b)"/>', 100, 28);
  fx(k.pic(ringS, [E[0], ANV[1] - 1], 90, 24), [[1010, { transform: 'scale(.3, .4)', opacity: 0 }, 'ease-out'], [1090, { transform: 'scale(.6, .7)', opacity: 0.95 }], [1550, { transform: 'scale(1.5, 1.3)', opacity: 0 }]]);
  BLOWS.forEach(({ t, p }) => {
    fx(k.pic('star', B, 34 * p, 34 * p), [[t - 20, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.2) rotate(20deg)', opacity: 1 }], [t + 330, { transform: 'scale(.5) rotate(60deg)', opacity: 0 }]]);
    fx(k.light('g-gold', B, 44 * p), [[t - 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1)', opacity: 0.9 }], [t + 380, { transform: 'scale(1.2)', opacity: 0 }]]);
    // sparks flung up and out, falling back (a parabola, sampled)
    for (let i = 0; i < Math.round(14 * p); i++) {
      const a = (-170 + rand() * 150) * Math.PI / 180, v = 16 + rand() * 38 * p, g = 46, dur = 380 + rand() * 360, r = 3 + rand() * 3, t0 = t + rand() * 40, tex = i % 3 ? 'ember' : 'spark';
      const at = (f, o, s) => ({ transform: `translate(${fix(Math.cos(a) * v * f * u)}px, ${fix((Math.sin(a) * v * f + g * f * f) * u)}px) scale(${s})`, opacity: o });
      fx(k.pic(tex, B, r, r), [[t0, at(0, 0, 0.6), 'linear'], [t0 + 30, at(0.06, 1, 1.2), 'linear'], [t0 + dur * 0.5, at(0.5, 0.9, 1), 'linear'], [t0 + dur, at(1, 0, 0.4)]]);
    }
  });
  // embers drifting up from the shield and anvil while she works
  for (let i = 0; i < 8; i++) {
    const t0 = 600 + i * 170 + rand() * 80, x = 168 + rand() * 30, r = 2.5 + rand() * 2.5;
    fx(k.pic('ember', [x, ANV[1] - 6], r, r), [[t0, { transform: 'translate(0px, 0px) scale(.5)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `translate(${fix((rand() - 0.5) * 4 * u)}px, ${fix(-6 * u)}px) scale(1)`, opacity: 0.9 }, 'linear'],
      [t0 + 900, { transform: `translate(${fix((rand() - 0.3) * 14 * u)}px, ${fix(-40 * u)}px) scale(.6)`, opacity: 0 }]]);
  }

  // ── the shield she makes: a disc of light, flung from the tongs to T, landing, hanging, cooling
  const shieldSvg = k.svg('<defs><radialGradient id="g"><stop offset="0" stop-color="#fff2cc" stop-opacity=".25"/><stop offset=".55" stop-color="#d6f6f4" stop-opacity=".3"/><stop offset=".85" stop-color="#bfeef2" stop-opacity=".45"/><stop offset="1" stop-color="#e8fffd" stop-opacity=".7"/></radialGradient>' +
    '<filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter></defs><g filter="url(#b)" opacity=".8"><ellipse cx="24" cy="27" rx="17" ry="20" fill="none" stroke="#e8fbff" stroke-width="3"/></g>' +
    '<ellipse cx="24" cy="27" rx="16.5" ry="19.5" fill="url(#g)"/><g fill="none"><ellipse cx="24" cy="27" rx="16.5" ry="19.5" stroke="#dcfbff" stroke-width="1.5"/><ellipse cx="24" cy="27" rx="15.3" ry="18.1" stroke="#ffe2a0" stroke-width=".7" opacity=".7"/>' +
    '<ellipse cx="24" cy="27" rx="11.9" ry="14" stroke="#c6f4f6" stroke-width=".6" opacity=".4"/><path d="M12,16A15,18 0 0 1 22,9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="24" cy="27" rx="5" ry="5.9" stroke="#ffe2a0" stroke-width=".8" opacity=".8"/></g><ellipse cx="24" cy="27" rx="3.3" ry="3.9" fill="#fff6dc"/>', 48, 54);
  const A = [E[0], E[1] - 9], dist = Math.hypot(T[0] - A[0], T[1] - A[1]), C = [(A[0] + T[0]) / 2, Math.min(A[1], T[1]) - 18 - dist * 0.16];
  const bz = (f) => { const q = 1 - f; return [q * q * A[0] + 2 * q * f * C[0] + f * f * T[0], q * q * A[1] + 2 * q * f * C[1] + f * f * T[1]]; };
  const [X0, Y0] = k.P(...A), at = (f) => { const [x, y] = k.P(...bz(f)); return `translate(${fix(x - X0)}px, ${fix(y - Y0)}px)`; };
  const R0 = 1500, R1 = 1950, pace = (tau) => tau * tau * (0.4 + 0.6 * tau); // (it speeds up)
  const flight = [];
  for (let i = 1; i < 9; i++) {
    const f = i / 9, sz = 1.04 - 0.2 * f, sx = Math.max(0.3, Math.abs(Math.cos(f * Math.PI * 3.5)));
    flight.push([R0 + (R1 - R0) * f, { transform: `${at(pace(f))} rotate(${fix(f * 220)}deg) scale(${fix(sz * sx)}, ${fix(sz)})`, opacity: 1 }, 'linear']);
  }
  fx(k.pic(shieldSvg, A, 36, 40.5), [[R0 - 1, { transform: 'scale(1.04)', opacity: 0 }, 'linear'], [R0, { transform: 'scale(1.04)', opacity: 1 }, 'linear'], ...flight,
    [R1 - 40, { transform: `${at(1)} rotate(300deg) scale(.84, .86)`, opacity: 1 }, 'linear'], [R1, { transform: `${at(1)} rotate(360deg) scale(1.25)`, opacity: 1 }, 'ease-out'], [R1 + 160, { transform: `${at(1)} rotate(360deg) scale(1.05)`, opacity: 1 }, eio],
    [R1 + 500, { transform: `${at(1)} rotate(360deg) scale(1.12)`, opacity: 0.95 }, eio], [R1 + 1000, { transform: `${at(1)} rotate(360deg) scale(1.08)`, opacity: 0.85 }, eio], [R1 + 1500, { transform: `${at(1)} rotate(360deg) scale(1.3)`, opacity: 0 }]]);
  // a glow riding with it, a streak of gold flecks left behind
  fx(k.light('g-gold', A, 42), [[R0, { transform: 'scale(.6)', opacity: 0 }, 'linear'], ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => [R0 + (R1 - R0) * (i / 9), { transform: `${at(pace(i / 9))} scale(${fix(1 + 0.2 * Math.sin((i / 9) * Math.PI))})`, opacity: 0.8 }, 'linear']),
    [R1 + 200, { transform: `${at(1)} scale(1.2)`, opacity: 0.6 }, eio], [R1 + 1000, { transform: `${at(1)} scale(1.1)`, opacity: 0.4 }, eio], [R1 + 1500, { transform: `${at(1)} scale(1.3)`, opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const tau = 0.06 + (0.9 * i) / 16, [px, py] = k.P(...bz(pace(tau))), [qx, qy] = k.P(...A), r = 4 + rand() * 4, side = (rand() - 0.5) * 8, t0 = R0 + (R1 - R0) * tau;
    const dx = px - qx + side, dy = py - qy + side;
    fx(k.pic(i % 3 ? 'spark' : 'star', A, r, r), [[t0, { transform: `translate(${fix(dx)}px, ${fix(dy)}px) scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 60, { transform: `translate(${fix(dx)}px, ${fix(dy)}px) scale(1)`, opacity: 0.95 }],
      [t0 + 380, { transform: `translate(${fix(dx + side * 0.6)}px, ${fix(dy + 6 * u)}px) scale(.4)`, opacity: 0 }]]);
  }
  // ── where it lands (BEATS.impact): a flash, a star, a ring of gold, the glow, motes rising
  fx(k.light('g-gold', T, 72), [[R1 - 70, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [R1 + 30, { transform: 'scale(1.15)', opacity: 0.95 }], [R1 + 380, { transform: 'scale(1)', opacity: 0.55 }, eio], [R1 + 1200, { transform: 'scale(1.1)', opacity: 0.3 }, eio], [R1 + 1700, { transform: 'scale(1.3)', opacity: 0 }]]);
  fx(k.pic('star', T, 46, 46), [[R1 - 60, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [R1 + 20, { transform: 'scale(1.2) rotate(25deg)', opacity: 1 }], [R1 + 480, { transform: 'scale(.6) rotate(70deg)', opacity: 0 }]]);
  const ringG = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="40" cy="40" r="34" fill="none" stroke="#fff0c2" stroke-width="2.4" filter="url(#b)"/>', 80, 80);
  fx(k.pic(ringG, T, 60, 60), [[R1 - 40, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [R1 + 40, { transform: 'scale(.5)', opacity: 0.95 }], [R1 + 560, { transform: 'scale(1.6)', opacity: 0 }]]);
  fx(k.pic(ringG, T, 60, 60), [[R1 + 120, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [R1 + 200, { transform: 'scale(.55)', opacity: 0.6 }], [R1 + 760, { transform: 'scale(1.9)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t0 = R1 + i * 55 + rand() * 40, a = rand() * Math.PI * 2, d = 8 + rand() * 22, from = [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.7], r = 4 + rand() * 4;
    const rise = (f, o, s) => ({ transform: `translate(${fix(Math.cos(a) * 6 * f * u)}px, ${fix((-32 * f - 4 * f * f) * u)}px) scale(${s})`, opacity: o });
    fx(k.pic(i % 4 ? 'spark' : 'star', from, r, r), [[t0, rise(0, 0, 0.4), 'ease-out'], [t0 + 100, rise(0.1, 0.95, 1), 'linear'], [t0 + 700, rise(0.7, 0.6, 0.8), 'linear'], [t0 + 1100, rise(1, 0, 0.4)]]);
  }
}
