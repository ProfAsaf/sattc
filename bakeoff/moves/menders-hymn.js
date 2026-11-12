// Mender's Hymn: the priestess sings, and her notes of light go to mend.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support, element: light
// (suggestion kept: a Trick that heals).
//   0-800     she draws breath and sings: she rises a little, her arms lift and open,
//             rings of sound leave her mouth, her hands begin to glow and the first
//             golden notes lift off them and drift up; the dawn behind her warms.
//   900       (BEATS.release) her arms sweep toward T and nine notes leave her hands in
//             an arc, each bobbing and turning as it goes, trailing glints.
//   1350      (BEATS.impact) the first lands at T: a flare, a ring, motes rising; the
//             notes settle there one after another, hover and sink into the glow.
//             Alone, T is the soldier's heart: he draws a breath, lifts his head and sits
//             up, glints of mending running over him.
//   1900-3500 the warmth holds and fades; her arms come down, she settles; the soldier
//             eases back to his bow.
//   3500      at rest as drawn (the move ends at END).
//
// The contract (bakeoff/recipe.md): the gift goes to T = k.aim || the soldier's heart; every
// point of its path is worked out from her hands (`emit`, carried round with her arms as
// they turn toward T, at most 35 degrees either way) and T. What flies and lands is on the
// overlay (k.pic / k.light), since T may be on another card. The soldier only answers when
// she plays alone. Every motion of a part is one sampled list (every 40 ms).
export const END = 4200;
export const BEATS = { release: 900, impact: 1350, settle: 3500 };
export const STILLS = [300, 650, 950, 1150, 1400, 1800, 2700, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 232 + 23 * c * c, 160 + 95 * c * c, Math.min(1, c * c * 2.2)]; }],
  mote: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 240, 190, Math.min(1, c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, sho = S.shoulder, seat = S.seat, neck = S.neck, feet = S.feet;
  const alone = !k.aim, T = k.aim || S.alone;
  const ang = (a, b) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const ph = (t, a, b) => sm(cl((t - a) / (b - a), 0, 1));
  const carry = (p, th, o) => { const r = (th * Math.PI) / 180, vx = p[0] - o[0], vy = p[1] - o[1]; return [o[0] + vx * Math.cos(r) - vy * Math.sin(r), o[1] + vx * Math.sin(r) + vy * Math.cos(r)]; };
  const grid = [];
  for (let t = 0; t <= 3560; t += 40) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,246,214,.95), rgba(255,218,140,.5) 25%, rgba(255,190,90,.14) 55%, rgba(255,170,60,0) 100%); }`);

  // ── her: she rises on her breath, her arms open, lift, sweep toward T, and come down
  const D = cl((ang(sho, T) - ang(sho, E)) * 0.5, -35, 35);
  const rise = (t) => ph(t, 100, 700) * (1 - ph(t, 1700, 2900));
  const open = (t) => -5 * ph(t, 150, 750) * (1 - ph(t, 1000, 1200)) + 4 * Math.sin(t / 120) * ph(t, 300, 800) * (1 - ph(t, 800, 900)) * 0.3;
  const sweep = (t) => D * ph(t, 820, 1100) * (1 - ph(t, 1900, 2900));
  act(k.part('her'), sample((t) => ({ transform: `${k.T(0, -0.8 * rise(t))} scale(${(1 + 0.008 * rise(t)).toFixed(4)}, ${(1 + 0.014 * rise(t)).toFixed(4)})` })));
  act(k.part('arms'), sample((t) => { const th = open(t) + sweep(t), p = carry(sho, 0, sho); return { transform: `${k.T(0, -0.8 * rise(t))} rotate(${th.toFixed(2)}deg)` + (p ? '' : '') }; }));
  const Er = (t) => { const th = open(t) + sweep(t), [x, y] = carry(E, th, sho); return [x, y - 0.8 * rise(t)]; };
  const E1 = carry(E, D, sho); // where her hands are as she lets go

  // ── the soldier (alone): a breath, his head lifting, sitting up
  const sit = (t) => (alone ? ph(t, 1350, 1800) * (1 - ph(t, 2500, 3500)) : 0);
  const look = (t) => (alone ? ph(t, 1450, 1900) * (1 - ph(t, 2500, 3400)) : 0);
  const breath = (t) => (alone ? Math.sin(Math.PI * cl((t - 1350) / 800, 0, 1)) : 0);
  act(k.part('soldier'), sample((t) => ({ transform: `${k.T(0, -0.5 * sit(t))} rotate(${(-1.6 * sit(t)).toFixed(2)}deg) scale(${(1 + 0.008 * breath(t)).toFixed(4)}, ${(1 + 0.014 * breath(t)).toFixed(4)})` })));
  act(k.part('sHead'), sample((t) => { const th = -1.6 * sit(t), [x, y] = carry(neck, th, seat); return { transform: `${k.T(x - neck[0], y - neck[1] - 0.5 * sit(t) - 0.5 * breath(t))} rotate(${(th - 9 * look(t)).toFixed(2)}deg)` }; }));

  // ── the dawn warms; her hands glow
  fx(k.lightIn('g-gold', [150, 150], 120, 90), [[100, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1)', opacity: 0.4 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [2800, { transform: 'scale(1)', opacity: 0.15 }, eio], [3500, { transform: 'scale(.8)', opacity: 0 }]]);
  const handGlow = [[120, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1)', opacity: 0.6 }, eio], [880, { transform: 'scale(1.25)', opacity: 0.95 }, eio], [1100, { transform: 'scale(1.6)', opacity: 0.85 }, eio], [1500, { transform: 'scale(1.1)', opacity: 0.4 }, eio], [2300, { transform: 'scale(.6)', opacity: 0 }]];
  fx(k.lightIn('g-gold', E, 40, 40), handGlow.map(([t, kf, e]) => [t, kf, e]));

  // ── the notes: one picture drawn in the card's own style (a note, glowing)
  const note = k.svg('<path d="M5.8,12.6V2.2q3.2,1.4 4.2,6" fill="none" stroke="#fff6d8" stroke-width="1.15" stroke-linecap="round"/><ellipse cx="3.6" cy="13" rx="2.7" ry="1.9" transform="rotate(-20 3.6 13)" fill="#fff6d8"/>', 12, 16);
  const [X0, Y0] = k.P(...E);
  // rings of sound leave her mouth as she sings
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><path d="M12,8 A20,20 0 0 1 12,52" fill="none" stroke="#fff3cc" stroke-width="3" stroke-linecap="round" filter="url(#b)"/>', 30, 60);
  [150, 420, 690].forEach((t) => fx(k.picIn(ring, [102, 87], 10, 20), [[t, { transform: 'translate(0px, 0px) scale(.4)', opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(1, -1)} scale(.7)`, opacity: 0.75 }], [t + 600, { transform: `${k.T(9, -4)} scale(1.5)`, opacity: 0 }]]));
  // the first notes lift off her hands and drift up
  for (let i = 0; i < 6; i++) {
    const t0 = 220 + i * 120, dx = (rand() - 0.5) * 16, sz = 7 + rand() * 3;
    const f = (u, o) => ({ transform: `${k.T(dx * u + Math.sin(u * 4 + i) * 2, -3 - 22 * u)} rotate(${(-12 + 24 * u).toFixed(0)}deg) scale(${(0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, u * 1.1 + 0.1))).toFixed(2)})`, opacity: o });
    fx(k.pic(note, E, sz * 0.75, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 160, f(0.2, 0.95)], [t0 + 600, f(0.75, 0.9), 'ease-in'], [t0 + 900, f(1, 0)]]);
  }

  // ── the release (BEATS.release to .impact): nine notes in an arc from her hands to T
  const dist = Math.hypot(T[0] - E1[0], T[1] - E1[1]), nrm = [-(T[1] - E1[1]) / dist, (T[0] - E1[0]) / dist];
  const N = 9, REL = 900, TRAVEL = 470;
  const [F0, G0] = k.P(...E);
  const lands = [];
  for (let i = 0; i < N; i++) {
    const t0 = REL + i * 70, to = [T[0] + (rand() - 0.5) * 18, T[1] + (rand() - 0.5) * 16 - 4], from = [E1[0] + (rand() - 0.5) * 6, E1[1] + (rand() - 0.5) * 5];
    const bend = (i % 2 ? 1 : -1) * (6 + rand() * 8) - 0.1 * dist, mid = [(from[0] + to[0]) / 2 + nrm[0] * bend, (from[1] + to[1]) / 2 + nrm[1] * bend - 10 - 0.12 * dist];
    const pts = k.arc(from, mid, to, 8, (u) => Math.pow(u, 1.2)), sz = 11 + rand() * 3, tr = TRAVEL - 20 + rand() * 40;
    const nl = [], gl = [];
    pts.forEach((p, j) => {
      const [x, y] = k.P(...p), op = j === 0 ? 0 : 1, s = 0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, (j + 1.5) / 7)), tt = Math.round(t0 + (tr * j) / 8);
      const tf = `translate(${(x - F0).toFixed(1)}px, ${(y - G0).toFixed(1)}px)`;
      nl.push([tt, { transform: `${tf} rotate(${(Math.sin(j * 1.3 + i) * 16).toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: op * 0.98 }, 'linear']);
      gl.push([tt, { transform: `${tf} scale(${(s * 0.9).toFixed(2)})`, opacity: op * 0.9 }, 'linear']);
    });
    // it settles over its mark: hovers, bobs and sinks into the glow
    const [tx, ty] = k.P(...to), tf = (dy, r, s) => `translate(${(tx - F0).toFixed(1)}px, ${(ty - G0 + dy * k.u).toFixed(1)}px) rotate(${r}deg) scale(${s})`;
    const ta = t0 + tr;
    nl.push([ta + 300, { transform: tf(-4, 6, 1), opacity: 0.95 }, eio], [ta + 800, { transform: tf(-7, -6, 0.9), opacity: 0.7 }, eio], [ta + 1250, { transform: tf(-10, 4, 0.6), opacity: 0 }]);
    gl.push([ta + 300, { transform: tf(-4, 0, 1), opacity: 0.8 }, eio], [ta + 800, { transform: tf(-7, 0, 1), opacity: 0.5 }, eio], [ta + 1250, { transform: tf(-10, 0, 0.5), opacity: 0 }]);
    fx(k.pic(note, E, sz * 0.75, sz), nl);
    fx(k.pic('spark', E, sz * 1.1, sz * 1.1), gl);
    lands.push([ta, to]);
    // glints trailing behind it
    for (let q = 0; q < 2; q++) {
      const off = (rand() - 0.5) * 6;
      fx(k.pic('mote', E, 2.4, 2.4), pts.map((p, j) => { const [x, y] = k.P(...pts[Math.max(0, j - 1)]); return [Math.round(t0 + 40 + (tr * j) / 8 + q * 50), { transform: `translate(${(x - F0 + off * 0.3).toFixed(1)}px, ${(y - G0 + off).toFixed(1)}px) scale(${(0.5 + 0.5 * (j / 8)).toFixed(2)})`, opacity: j === 0 || j === 8 ? 0 : 0.8 }, 'linear']; }).concat([[Math.round(t0 + tr + 260 + q * 50), { transform: `translate(${(k.P(...to)[0] - F0).toFixed(1)}px, ${(k.P(...to)[1] - G0 + 3 * k.u).toFixed(1)}px) scale(.2)`, opacity: 0 }]]));
    }
  }

  // ── where it lands (BEATS.impact = the first): a flare, rings, motes rising
  const IM = lands[0][0];
  const ring2 = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#fff3cc" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-gold', T, 72), [[IM - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 50, { transform: 'scale(1.2)', opacity: 1 }, eio], [IM + 350, { transform: 'scale(1.5)', opacity: 0.7 }, eio], [IM + 1400, { transform: 'scale(1.7)', opacity: 0.3 }, eio], [IM + 2100, { transform: 'scale(1.3)', opacity: 0 }]]);
  [0, 150].forEach((dl, i) => fx(k.pic(ring2, T, 26, 26), [[IM + dl, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + dl + 60, { transform: 'scale(.55)', opacity: 0.95 }], [IM + dl + 650, { transform: `scale(${1.9 + 0.6 * i})`, opacity: 0 }]]));
  lands.forEach(([t, to]) => fx(k.pic('spark', to, 7, 7), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(1.4)', opacity: 1 }, eio], [t + 320, { transform: 'scale(.5)', opacity: 0 }]]));
  for (let i = 0; i < 12; i++) {
    const t0 = IM + 40 + i * 80 + rand() * 40, x = (rand() - 0.5) * 22, rise2 = 18 + rand() * 20, sz = 2.2 + rand() * 2.6;
    const f = (u, o) => ({ transform: `${k.T(x + Math.sin(u * 5 + i) * 2.5, 4 - rise2 * u)} scale(${(0.6 + 0.6 * Math.sin(Math.PI * Math.min(1, u * 1.2))).toFixed(2)})`, opacity: o });
    fx(k.pic('spark', T, sz, sz), [[t0, f(0, 0), 'ease-out'], [t0 + 160, f(0.2, 0.95)], [t0 + 700, f(0.7, 0.85), 'ease-in'], [t0 + 1100 + rand() * 300, f(1, 0)]]);
  }
  // alone: the song settles on the soldier: a soft light on him and glints of mending running over him
  if (alone) {
    fx(k.lightIn('g-gold', [200, 140], 70, 64), [[IM, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [IM + 350, { transform: 'scale(1)', opacity: 0.75 }, eio], [IM + 1500, { transform: 'scale(1.1)', opacity: 0.45 }, eio], [IM + 2300, { transform: 'scale(1.2)', opacity: 0 }]]);
    [[205, 140], [196, 158], [210, 124], [190, 170], [208, 112], [192, 138], [212, 160], [200, 120]].forEach(([x, y], i) => {
      const t0 = IM + 100 + i * 110, sz = 4 + rand() * 3;
      fx(k.picIn('spark', [x, y], sz, sz), [[t0, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t0 + 140, { transform: 'scale(1.3)', opacity: 1 }, eio], [t0 + 360, { transform: `${k.T(0, -2)} scale(.5)`, opacity: 0.6 }, eio], [t0 + 560, { transform: `${k.T(0, -4)} scale(.1)`, opacity: 0 }]]);
    });
  }
}
