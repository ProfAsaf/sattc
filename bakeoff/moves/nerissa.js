// Nerissa, Voice of the Deep (a legendary creature, an attacker: her song takes an enemy under her sway). She
// draws breath, her head tilting back to the moon, her hair lifting, the coral crown's pearls kindling and
// moonlight gathering into her mouth; then she sings: pulse after pulse of song, arcs of pale water-light, goes
// out from her mouth to T, her beckoning hand reaching toward it and calling it in, her hair and tail streaming.
// Where the song lands it closes round its target: a ring drawing in, a whirl winding shut, a flash and bubbles;
// then a thread of light is drawn taut back to her, glints running along it, as the target is pulled in (alone,
// the knight, entranced, leans toward her and reaches out, the water rippling at his feet). Then the light dies
// away, the thread lets go, and everything settles as drawn.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element water (as suggested: the song is the
// attack, and it takes control). T = k.aim, else the knight's chest (`knight`), so alone the song reaches the
// knight. She faces left; if T is to her right her head and beckoning arm turn about to face it, and the song
// leaves from the mirrored mouth. Everything that flies or lands is on the overlay (k.pic / k.light).
//   0-900    GATHER: she inhales (body sinks, then rears back), the head lifts, the hair rises; glints are drawn
//            from the moon into her mouth, the crown's pearls glow, the rings of song at rest shiver and dim.
//   1100     RELEASE: she sings: the arcs of song start out to T one after another (every 85 ms), a glow at her mouth.
//   1650     IMPACT: the first arc arrives: ring drawn in, whirl, flash, bubbles at T; the thread of light is drawn taut.
//   1650-2500 sustained song: more arcs arrive, she sways and beckons, the knight is pulled in (alone).
//   2500-3600 the lights fade, the thread lets go, everything eases to rest. At rest from 3600.
// BEATS: release 1100, impact 1650, settle 3600.
export const END = 4200;
export const BEATS = { release: 1100, impact: 1650, settle: 3600 };
export const STILLS = [250, 700, 1000, 1300, 1700, 2100, 2800, 3900];

export const textures = {
  glint: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226 + 29 * c, 255, 252, Math.min(1, c * c * 2.4)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec;
  const song = k.part('song'), hair = k.part('hair'), body = k.part('body'), head = k.part('head'), arm = k.part('arm'), tail = k.part('tail'), kbody = k.part('kbody'), kreach = k.part('kreach');
  k.css('.g-song { border-radius: 50%; background: radial-gradient(circle, rgba(246,255,252,.95), rgba(176,240,236,.55) 30%, rgba(110,206,216,.18) 58%, rgba(90,190,210,0) 72%); }');
  const arc = k.svg('<defs><filter id="b" x="-40%" y="-10%" width="180%" height="120%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><path d="M10,2.7A20,20 0 0 1 10,37.3" fill="none" stroke="#bdf3f2" stroke-width="4.4" stroke-linecap="round" filter="url(#b)"/><path d="M10,2.7A20,20 0 0 1 10,37.3" fill="none" stroke="#f2fffd" stroke-width="1.5" stroke-linecap="round"/>', 24, 40);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#bdf3f2" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f2fffd" stroke-width="1.4"/>', 100, 100);
  let d = '';
  for (let i = 0; i <= 44; i++) { const t = i / 44, a = t * 4.4 * Math.PI, r = 4 + 36 * (1 - t); d += `${i ? 'L' : 'M'}${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`; }
  const whirl = k.svg(`<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.2"/></filter></defs><path d="${d}" fill="none" stroke="#bdf3f2" stroke-width="6" stroke-linecap="round" filter="url(#b)"/><path d="${d}" fill="none" stroke="#f6fffe" stroke-width="2" stroke-linecap="round"/>`, 100, 100);
  const bub = k.svg('<circle cx="20" cy="20" r="15" fill="rgba(180,240,244,.14)" stroke="#e8fffd" stroke-width="2.4"/><path d="M10,16A11,11 0 0 1 17,9" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>', 40, 40);
  const thread = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#bdf3f2" stop-opacity="0"/><stop offset=".12" stop-color="#d6fbf8" stop-opacity=".8"/><stop offset=".88" stop-color="#d6fbf8" stop-opacity=".8"/><stop offset="1" stop-color="#bdf3f2" stop-opacity="0"/></linearGradient><filter id="b" x="-5%" y="-200%" width="110%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter></defs><rect x="0" y="3" width="100" height="4" fill="url(#g)" filter="url(#b)"/><rect x="0" y="4.2" width="100" height="1.6" fill="#f6fffe"/>', 100, 10);
  const tidy = (l) => l.filter((q, i) => i === 0 || q[0] > l[i - 1][0]);

  // ── where the song goes: another card's point (k.aim), else the knight's chest; which way she turns to it
  const T = k.aim || S.knight;
  const own = !k.aim;
  const nk = S.neck, sh = S.shoulder;
  const right = T[0] > nk[0] + 6;
  const f = right ? -1 : 1; // forward lean: counterclockwise facing left, clockwise facing right
  const E = right ? [2 * nk[0] - S.mouth[0], S.mouth[1]] : S.mouth;
  const dx = T[0] - E[0], dy = T[1] - E[1], dist = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
  const REL = BEATS.release, IM = BEATS.impact, back = BEATS.settle;
  const FLY = IM - REL;
  // the beckoning arm turned toward T about the shoulder (at most 32 degrees off its rest line)
  const rest = right ? Math.atan2(-2, 45) : Math.atan2(-2, -45);
  let da = ((Math.atan2(T[1] - sh[1], T[0] - sh[0]) - rest) * 180) / Math.PI;
  da = Math.max(-32, Math.min(32, ((da + 540) % 360) - 180));
  const A = (r, s) => ({ transform: right ? `rotate(${(da + r).toFixed(1)}deg) scaleX(-1) scale(${s})` : `rotate(${(da + r).toFixed(1)}deg) scale(${s})` });
  const H = (r) => ({ transform: right ? `scaleX(-1) rotate(${(-r).toFixed(1)}deg)` : `rotate(${r.toFixed(1)}deg)` });
  const sliver = { transform: 'scale(.06, 1.03)' };

  // ── her head: lowers to breathe in, lifts to sing, sways with the song; turns about to a target on her right
  act(head, tidy(right
    ? [[0, { transform: 'none' }, eio], [250, sliver, eio], [520, H(-3), eio], [900, H(8), eio], [1300, H(10), eio], [1650, H(9), eio], [2000, H(6), eio], [2400, H(1), eio], [2800, H(0), eio], [3150, sliver, eio], [back, { transform: 'none' }]]
    : [[0, { transform: 'none' }, eio], [350, H(-3), eio], [900, H(8), eio], [1300, H(10), eio], [1650, H(9), eio], [2000, H(6), eio], [2400, H(1), eio], [back, { transform: 'none' }]]));
  // her body: sinks as she breathes in, rears back, then leans into the song and eases back
  act(body, tidy([[0, { transform: 'none' }, eio], [350, { transform: 'rotate(0deg) scale(1, .99)' }, eio], [900, { transform: `rotate(${(-f * 2.2).toFixed(1)}deg) scale(1.01, 1.015)` }, eio], [1100, { transform: `rotate(${(-f * 2.8).toFixed(1)}deg) scale(1.01, 1.02)` }, 'ease-in'],
    [1350, { transform: `rotate(${(f * 2.4).toFixed(1)}deg) scale(1, 1)` }, 'ease-out'], [1750, { transform: `rotate(${(f * 1.6).toFixed(1)}deg) scale(1, 1.004)` }, eio], [2300, { transform: `rotate(${(f * 0.8).toFixed(1)}deg)` }, eio], [3000, { transform: `rotate(${(-f * 0.4).toFixed(1)}deg)` }, eio], [back, { transform: 'none' }]]));
  // hair and tail follow a beat behind
  act(hair, [[0, { transform: 'none' }, eio], [500, { transform: 'rotate(1deg)' }, eio], [900, { transform: 'rotate(-6deg) scale(1.02)' }, eio], [1300, { transform: 'rotate(5deg) scale(1.03)' }, eio], [1700, { transform: 'rotate(-3deg)' }, eio], [2200, { transform: 'rotate(2.4deg)' }, eio], [2800, { transform: 'rotate(-1deg)' }, eio], [back, { transform: 'none' }]]);
  act(tail, [[0, { transform: 'none' }, eio], [600, { transform: 'rotate(4deg)' }, eio], [1100, { transform: 'rotate(-5deg)' }, eio], [1500, { transform: 'rotate(4deg)' }, eio], [1900, { transform: 'rotate(-3deg)' }, eio], [2400, { transform: 'rotate(2deg)' }, eio], [3000, { transform: 'rotate(-1deg)' }, eio], [back, { transform: 'none' }]]);
  // the beckoning arm: drawn in with the breath, held out to T as she sings, a come-hither wave, then lowered
  act(arm, tidy([[0, { transform: 'none' }, eio], [400, A(10, 0.84), eio], [1000, A(6, 0.88), eio], [1150, A(0, 1.05), 'ease-out'], [1450, A(-4, 1.03), eio], [1750, A(4, 1.0), eio], [2050, A(-3, 1.02), eio], [2400, A(2, 1.0), eio], [3000, A(0, 1.0), eio], [back, { transform: 'none' }]]));

  // ── the rings of song as drawn: they shiver and dim as it gathers, throb as it goes (they stay put; the arcs below travel)
  act(song, right
    ? [[0, { opacity: 1 }, eio], [300, { opacity: 0 }], [3200, { opacity: 0 }, eio], [back + 400, { opacity: 1 }]]
    : [[0, { transform: 'scale(1)', opacity: 1 }, eio], [500, { transform: 'scale(.97)', opacity: 0.6 }, eio], [REL, { transform: 'scale(.95)', opacity: 0.4 }, 'ease-out'], [1400, { transform: 'scale(1.04)', opacity: 1 }, eio], [1800, { transform: 'scale(1)', opacity: 0.8 }, eio], [2300, { transform: 'scale(1.03)', opacity: 1 }, eio], [back, { transform: 'scale(1)', opacity: 1 }]]);
  if (!right) {
    for (let i = 0; i < 3; i++) {
      const g = k.copy('song', '', { behind: false }), t0 = REL + i * 260;
      act(g, tidy([[0, { transform: 'scale(1)', opacity: 0 }, 'ease-out'], [t0, { transform: 'scale(1)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: 'scale(1.04)', opacity: 0.8 }], [t0 + 700, { transform: 'scale(1.32)', opacity: 0 }]]));
    }
  }

  // ── light: moonlight gathering, the pearls of her crown, her mouth as she sings
  fx(k.light('g-song', [196, 64], 110), tidy([[100, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.4 }, eio], [REL + 100, { transform: 'scale(1.15)', opacity: 0.6 }, eio], [2300, { transform: 'scale(1.05)', opacity: 0.3 }, eio], [back, { transform: 'scale(.9)', opacity: 0 }]]));
  const pl = [[300, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1.05)', opacity: 0.85 }]];
  for (let t = 1000, i = 0; t < 2500; t += 170, i++) pl.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.9})`, opacity: i % 2 ? 0.95 : 0.7 }, eio]);
  pl.push([3100, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-song', [200, 42], 46), pl);
  const ml = [[REL - 120, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 80, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = REL + 250, i = 0; t < 2500; t += 150, i++) ml.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.9})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  ml.push([2900, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.light('g-song', E, 30), ml);

  // ── gathering (0-1000): glints drawn out of the moon into her mouth
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, r = 10 + rand() * 32, X = 196 + Math.cos(a) * r, Y = 64 + Math.sin(a) * r * 0.9, t0 = 80 + i * 70, sz = 3 + rand() * 3.2;
    fx(k.pic('glint', [X, Y], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 140, { transform: `${k.T((E[0] - X) * 0.1, (E[1] - Y) * 0.1)} scale(1)`, opacity: 0.95 }, 'ease-in'], [t0 + 620, { transform: `${k.T(E[0] - X, E[1] - Y)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the song (RELEASE to IMPACT and on): arcs of water-light from her mouth to T, one after another
  for (let i = 0; i < 7; i++) {
    const t0 = REL + i * 85, w = FLY - 80 + (i % 2) * 20, s0 = 0.5, s1 = 1.5 + (i % 3) * 0.1;
    const at = (f2, s, o) => ({ transform: `${k.T(dx * f2, dy * f2)} rotate(${ang.toFixed(1)}deg) scale(${s.toFixed(2)})`, opacity: o });
    fx(k.pic(arc, E, 24, 40), [[t0, at(0, s0, 0), 'ease-out'], [t0 + 70, at(0.07, 0.75, 0.95), 'linear'], [t0 + w, at(0.97, s1, 0.9), 'ease-in'], [t0 + w + 90, at(1, s1 + 0.2, 0)]]);
    // each arc, arriving, breaks in a ring at T
    const ta = t0 + w;
    fx(k.pic(ring, T, 30, 30), [[ta - 20, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [ta + 60, { transform: 'scale(.55)', opacity: i ? 0.55 : 0.9 }], [ta + 600, { transform: 'scale(1.8)', opacity: 0 }]]);
  }

  // ── IMPACT at T: the song closes round it: a whirl winding shut, a flash, bubbles and glints
  fx(k.light('g-song', T, 60), tidy([[IM - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 350, { transform: 'scale(.95)', opacity: 0.6 }, eio], [2300, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [2900, { transform: 'scale(1.3)', opacity: 0 }]]));
  fx(k.pic(whirl, T, 46, 46), [[IM - 20, { transform: 'rotate(0deg) scale(1.5)', opacity: 0 }, 'ease-out'], [IM + 90, { transform: 'rotate(60deg) scale(1.3)', opacity: 0.95 }, 'ease-in'], [IM + 900, { transform: 'rotate(470deg) scale(.15)', opacity: 0.9 }], [IM + 990, { transform: 'rotate(500deg) scale(.1)', opacity: 0 }]]);
  fx(k.pic(ring, T, 46, 46), [[IM, { transform: 'scale(1.9)', opacity: 0 }, 'ease-in'], [IM + 120, { transform: 'scale(1.5)', opacity: 0.9 }, 'ease-in'], [IM + 700, { transform: 'scale(.35)', opacity: 0.8 }], [IM + 800, { transform: 'scale(.2)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, v = 10 + rand() * 24, t0 = IM + rand() * 150, sz = 2.5 + rand() * 5, gl = i < 6;
    const pt = (f2, s, o) => ({ transform: `translate(${(Math.cos(a) * v * f2 * u).toFixed(1)}px, ${((Math.sin(a) * v * f2 - 12 * f2 * f2) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(gl ? 'glint' : bub, T, gl ? sz * 0.9 : sz, gl ? sz * 0.9 : sz), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 60, pt(0.2, 1, 0.95), 'linear'], [t0 + 520, pt(0.9, 1, 0.8), 'ease-in'], [t0 + 720, pt(1, 1.4, 0)]]);
  }

  // ── the thread: drawn taut from T back to her, shimmering, with glints pulled along it, then let go
  const mid = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2], len = Math.max(20, dist - 8);
  const tr = (sx, sy, o) => ({ transform: `rotate(${ang.toFixed(1)}deg) scale(${sx}, ${sy})`, opacity: o });
  const tl = [[IM + 100, tr(0.1, 0.5, 0), 'ease-out'], [IM + 380, tr(1, 1, 0.95), eio]];
  for (let t = IM + 600, i = 0; t < 2500; t += 170, i++) tl.push([t, tr(1, i % 2 ? 1.25 : 0.85, i % 2 ? 0.95 : 0.7), eio]);
  tl.push([2900, tr(1, 0.4, 0)]);
  fx(k.pic(thread, mid, len, 5), tl);
  for (let i = 0; i < 5; i++) {
    const t0 = IM + 380 + i * 330, sz = 3.2 + rand() * 2;
    fx(k.pic('glint', T, sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(-dx * 0.08, -dy * 0.08)} scale(1)`, opacity: 0.95 }, 'linear'], [t0 + 480, { transform: `${k.T(-dx * 0.92, -dy * 0.92)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 560, { transform: `${k.T(-dx, -dy)} scale(.4)`, opacity: 0 }]]);
  }

  // ── the knight, entranced (alone: T is him): he leans toward her, reaches out, the water rippling at his feet
  const fl = own ? 1 : 0.25, [fx0, fy0] = S.feet;
  act(kbody, tidy([[0, { transform: 'none' }, eio], [IM - 100, { transform: 'rotate(0deg)' }, 'ease-out'], [IM + 150, { transform: `${k.T(-1.5 * fl, 0)} rotate(${(-2.5 * fl).toFixed(2)}deg)` }, 'ease-out'], [IM + 500, { transform: `${k.T(3.5 * fl, 0)} rotate(${(3.4 * fl).toFixed(2)}deg)` }, eio], [2100, { transform: `${k.T(2.8 * fl, 0)} rotate(${(2.6 * fl).toFixed(2)}deg)` }, eio], [2500, { transform: `${k.T(4 * fl, 0)} rotate(${(3.6 * fl).toFixed(2)}deg)` }, eio], [3000, { transform: `${k.T(0.8 * fl, 0)} rotate(${(0.8 * fl).toFixed(2)}deg)` }, eio], [3500, { transform: 'none' }]]));
  act(kreach, tidy([[0, { transform: 'none' }, eio], [IM + 100, { transform: 'rotate(1deg) scale(1)' }, 'ease-out'], [IM + 500, { transform: `${k.T(3.5 * fl, 0)} rotate(${(-7 * fl).toFixed(1)}deg) scale(${(1 + 0.07 * fl).toFixed(2)})` }, eio], [2100, { transform: `${k.T(2.8 * fl, 0)} rotate(${(-4 * fl).toFixed(1)}deg) scale(${(1 + 0.05 * fl).toFixed(2)})` }, eio], [2500, { transform: `${k.T(4 * fl, 0)} rotate(${(-8 * fl).toFixed(1)}deg) scale(${(1 + 0.08 * fl).toFixed(2)})` }, eio], [3000, { transform: `${k.T(0.8 * fl, 0)} rotate(${(-1 * fl).toFixed(1)}deg)` }, eio], [3500, { transform: 'none' }]]));
  if (own) {
    for (let i = 0; i < 3; i++) {
      const t0 = IM + 250 + i * 520;
      fx(k.picIn(ring, [fx0, fy0 - 0.5], 34, 34), [[t0, { transform: 'scale(.35, .1)', opacity: 0 }, 'ease-out'], [t0 + 100, { transform: 'scale(.6, .17)', opacity: 0.7 }], [t0 + 800, { transform: 'scale(1.5, .4)', opacity: 0 }]]);
    }
    fx(k.lightIn('g-song', [fx0, fy0 - 2], 80, 20), tidy([[IM, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 300, { transform: 'scale(1)', opacity: 0.6 }, eio], [2400, { transform: 'scale(1.05)', opacity: 0.45 }, eio], [3000, { transform: 'scale(.9)', opacity: 0 }]]));
  }
  // and bubbles rising round her where the song leaves
  for (let i = 0; i < 6; i++) {
    const t0 = REL + 80 + i * 150, sz = 2.4 + rand() * 3;
    fx(k.pic(bub, [E[0] + (rand() - 0.5) * 8, E[1] + 2], sz, sz), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 200, { transform: `${k.T((rand() - 0.5) * 6, -6)} scale(1)`, opacity: 0.85 }], [t0 + 1000, { transform: `${k.T((rand() - 0.5) * 12, -30 - rand() * 12)} scale(1.1)`, opacity: 0 }]]);
  }
}
