// Grave Snare: the graveyard takes hold, and its grip is thrown out.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (the suggestion kept: like
// Shackles, a Hex is a gift laid on a creature, here a curse on an enemy attacker: the boon goes
// to T), element: bone (skeletal hands, violet runes; the card's suggestion kept). Alone, T is the
// horse's hind legs, where the snare is already closing.
//   0-1000    the gathering: the hands sink into the turf, then burst up again, clawing and
//             swaying; the rune ring dims and relights, light runs along the cracks; the horse
//             heaves and jerks at the grip, yanked back every time the hands close.
//   1000-1250 the wind-up: the ring blazes, the hands rise to their full height, the horse rears.
//   1250      RELEASE: from the three reaching hands, ghostly bony hands and streaks of violet
//             light are flung in an arc to T.
//   1650      IMPACT at T: a ring of claws snaps shut (closing from wide), a flash, bone splinters,
//             a ripple of rings, gloom boiling off; the horse is wrenched down (a gentle slump if
//             T is another card's).
//   1800-3300 it is held: the claws turn slowly, the gloom rises; the horse goes still; the light
//             drains back into the ring; the hands settle.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim or its own; the flight is worked out from each hand to T on the overlay.
export const END = 4200;
export const BEATS = { release: 1250, impact: 1650, settle: 3500 };
export const STILLS = [300, 750, 1150, 1300, 1550, 1700, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [225 + 30 * v, 200 + 55 * v, 255, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [205 + 50 * c * c, 160 + 90 * c * c, 255, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, REACH = S.reach, HOOF = S.hooves;
  const T = k.aim || S.alone;
  const REL = 1250, FLY = 400, IMP = REL + FLY;
  // is T on its own picture (the horse is gripped), or on another card (the horse only slumps)?
  const own = T[0] > 90 && T[0] < 260 && T[1] > 20 && T[1] < 200 ? 1 : 0.3;
  k.css(`.g-bone { border-radius: 50%; background: radial-gradient(closest-side, rgba(250,244,255,.95), rgba(196,150,255,.6) 28%, rgba(140,80,255,.24) 58%, rgba(120,60,255,0) 100%); }
    .g-snare { border-radius: 50%; background: radial-gradient(closest-side, rgba(226,200,255,.5), rgba(160,110,255,.28) 45%, rgba(120,60,255,.1) 75%, rgba(120,60,255,0) 100%); }`);
  const B = '<defs><filter id="b"><feGaussianBlur stdDeviation=".4"/></filter></defs>';
  const hand = k.svg(B + '<g filter="url(#b)" stroke="#f3eaff" stroke-linecap="round" fill="none"><g stroke-width="1.8"><path d="M5,18L3,8M8,17L7,4.5M12,17L13,4.5M15,18L17.5,9M15.5,21L20,17.5"/></g><ellipse cx="10" cy="20.5" rx="4.6" ry="3.6" fill="#e6d8fa" stroke="none"/><path stroke-width="2.4" d="M8.4,24L8,29M11.6,24L12,29"/></g>', 22, 30);
  const handB = k.svg(B + '<g filter="url(#b)" stroke="#d6c4f2" stroke-linecap="round" fill="none"><g stroke-width="1.6"><path d="M4,16L3,9M7.5,15L7,6M12,15L12.5,6M15.5,16L17,10"/></g><ellipse cx="10" cy="18" rx="4.4" ry="3.2" fill="#c9b4ec" stroke="none"/><path stroke-width="2.2" d="M8.4,21L8,26M11.6,21L12,26"/></g>', 22, 28);
  const streak = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#8a50ff" stop-opacity="0"/><stop offset=".7" stop-color="#c9a6ff"/><stop offset="1" stop-color="#fbf6ff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,4 Q10,1.2 24,3 Q30,4 24,5 Q10,6.8 0,4Z" fill="url(#s)" filter="url(#b)"/>', 30, 8);
  const shard = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".3"/></filter></defs><path d="M2,6L12,3.4L7,7.4Z" fill="#f4ecff" filter="url(#b)"/>', 14, 10);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#c9a6ff" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  let claws = '';
  for (let i = 0; i < 8; i++) claws += `<g transform="rotate(${i * 45} 24 24)"><path d="M24,3.4L21.2,13.4L24,10.6L26.8,13.4Z" fill="#f1e6ff"/><circle cx="24" cy="4.5" r="1.6" fill="#fff"/></g>`;
  const clamp = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".6"/></filter></defs><g filter="url(#b)"><circle cx="24" cy="24" r="19" fill="none" stroke="#8a6ad0" stroke-width="3.4"/><circle cx="24" cy="24" r="19" fill="none" stroke="#e6d6ff" stroke-width="1"/><circle cx="24" cy="24" r="13.5" fill="none" stroke="#e6d6ff" stroke-width=".8" stroke-dasharray="2 2.6" opacity=".85"/>' + claws + '</g>', 48, 48);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];
  // yanks: the horse heaves at the grip at these moments (ms, strength)
  const PULLS = [[480, 0.6], [780, 0.8], [1060, 1], [1200, 1.3]];
  const shake = (t) => { let a = 0; for (const [tt, s] of PULLS) if (t > tt) a += s * Math.exp(-(t - tt) / 210) * Math.sin((t - tt) / 22); return a; };
  const slam = (t) => (t > IMP ? Math.exp(-(t - IMP) / 280) * Math.sin((t - IMP) / 26) : 0);

  // ── the horse: rears at the wind-up, jerked at every grip, wrenched down at the impact, then still
  const REAR = curve([[0, 0], [300, 0.6], [520, -2.4], [700, -0.8], [820, -3.2], [980, -1.2], [1080, -4.4], [REL, -5.6], [REL + 120, -6.2], [IMP - 30, -5], [IMP + 90, 3.6 * own], [2100, 1.6 * own], [2800, 0.5 * own], [3400, 0]]);
  const c01 = (x) => Math.max(0, Math.min(1, x)), SQ = (t) => own * Math.max(0, sm(c01((t - IMP) / 120)) - sm(c01((t - 2300) / 900)));
  act(k.part('horse'), sample((t) => ({ transform: `rotate(${(REAR(t) + shake(t) * 0.5 + slam(t) * 1.6 * own).toFixed(2)}deg) scale(${(1 - 0.012 * SQ(t)).toFixed(4)}, ${(1 - 0.018 * SQ(t)).toFixed(4)})` })));

  // ── the ring: dims, relights as the cracks run, blazes at the wind-up and the release, dims again
  act(k.part('ring'), [[0, { opacity: 1 }, eio], [220, { opacity: 0.3 }, eio], [900, { opacity: 0.8 }, eio], [1100, { opacity: 1 }, eio], [REL, { opacity: 1 }, eio], [2300, { opacity: 0.75 }, eio], [3200, { opacity: 1 }]]);
  const RL = curve([[0, 0.15], [220, 0.05], [800, 0.5], [1150, 0.9], [REL, 1], [REL + 400, 0.65], [2300, 0.35], [3100, 0.1], [3500, 0]]);
  fx(k.lightIn('g-bone', [150, 188], 170, 40), [...grid.filter((t) => t >= 35).map((t) => [t, { transform: `scale(${(0.7 + 0.4 * RL(t)).toFixed(3)})`, opacity: +(0.9 * RL(t)).toFixed(3) }, 'linear']), [3700, { transform: 'scale(.7)', opacity: 0 }]]);
  // sparks of light run along the ring and the cracks at every yank
  for (let i = 0; i < 20; i++) {
    const pt = PULLS[i % 4][0] - 20 + Math.round(rand() * 90), a = rand() * Math.PI * 2, x = 150 + Math.cos(a) * 62, y = 188 + Math.sin(a) * 9.5, up = 6 + rand() * 12, sz = 2 + rand() * 2.4;
    fx(k.picIn(i % 2 ? 'spark' : 'mote', [x, y], sz, sz), [[pt, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [pt + 80, { transform: `${k.T(0, -up * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [pt + 520, { transform: `${k.T((rand() - 0.5) * 6, -up - 8)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the hands: sink, burst up clawing and swaying, rise to full height, then settle back as drawn
  const handMove = (name, d, ph, lean) => {
    const sk = (t) => `rotate(${(lean * Math.sin((t + ph) / 160) * Math.max(0, Math.min(1, (t - 600) / 400)) * (t < 1300 ? 1 : Math.exp(-(t - 1300) / 500))).toFixed(2)}deg)`;
    const Y = curve([[0, 1], [150 + d, 1], [420 + d, 0.55], [700 + d, 0.6], [900 + d, 1.14], [1080, 1.2], [REL + 40, 1.28], [IMP, 1.12], [2100, 1.05], [3000, 1]]);
    act(k.part(name), sample((t) => ({ transform: `${sk(t)} scale(${(1 + (Y(t) - 1) * 0.55).toFixed(3)}, ${Y(t).toFixed(3)})` })));
  };
  handMove('grips', 0, 0, 3);
  handMove('boneAC', 90, 70, 4);
  handMove('boneB', 40, 130, 4);
  handMove('boneD', 150, 40, 5);
  // a violet light at each reaching hand, swelling as it rises and flaring as its grip is thrown
  REACH.forEach(([x, y], i) => {
    const d = i * 90;
    fx(k.lightIn('g-bone', [x, y + 2], 40, 34), [[600 + d, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [950 + d, { transform: 'scale(1)', opacity: 0.8 }, eio], [REL + i * 30, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 450, { transform: 'scale(1)', opacity: 0.4 }, eio], [2400, { transform: 'scale(.6)', opacity: 0.2 }, eio], [3100, { transform: 'scale(.4)', opacity: 0 }]]);
  });
  // a violet wash over the whole picture as the rune-light climbs
  fx(k.lightIn('g-snare', [150, 150], 300, 110), [[200, { opacity: 0 }, 'ease-out'], [REL, { opacity: 0.85 }, 'ease-out'], [IMP + 300, { opacity: 0.55 }, eio], [3000, { opacity: 0 }]]);
  // gloom curling up round the hooves while it strains
  for (let i = 0; i < 6; i++) {
    const t = 450 + i * 330, r = Math.round(rand() * 360), x = HOOF[0] - 22 + rand() * 50;
    fx(k.picIn('gloom', [x, 186], 30, 24, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-1, -8)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1400, { transform: `${k.T(-4, -34)} rotate(${r + 50}deg) scale(1.9)`, opacity: 0 }]]);
  }

  // ── the release: bony hands, streaks of light and motes flung from each reaching hand to T
  const along = (A, tex, t0, dur, lat, sx, sy, s0, s1, o, mode, linger = 0) => {
    const C = [(A[0] + T[0]) / 2, Math.min(A[1], T[1]) - 34 - lat * 2];
    const bz = (t) => { const q = 1 - t; return [q * q * A[0] + 2 * q * t * C[0] + t * t * T[0], q * q * A[1] + 2 * q * t * C[1] + t * t * T[1]]; };
    const [X0, Y0] = k.P(...A), kf = [], n = 8;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.9), q = bz(w), q2 = bz(Math.min(1, w + 0.02)), q1 = bz(Math.max(0, w - 0.02)), [x, y] = k.P(...q);
      const ang = (Math.atan2(q2[1] - q1[1], q2[0] - q1[0]) * 180) / Math.PI + (mode === 'hand' ? 90 : 0);
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + lat * Math.sin(Math.PI * w) * u * 0.5).toFixed(1)}px) rotate(${mode ? ang.toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, A, sx, sy), kf);
  };
  REACH.forEach((A, ci) => {
    const lat = (ci - 1) * 10;
    for (let i = 0; i < 4; i++) along(A, i % 2 ? handB : hand, REL + ci * 30 + i * 60, FLY - 70 + i * 6, lat + (rand() - 0.5) * 6, 10, 13, 0.9, 1.1, 0.95, 'hand', 180);
    along(A, streak, REL + ci * 30, FLY - 20, lat, 30, 8, 0.8, 1, 0.85, 'streak', 60);
    along(A, 'spark', REL + ci * 30 + 10, FLY - 30, lat, 10, 10, 1, 1.2, 1, null, 40);
    fx(k.light('g-bone', A, 34), [[REL - 80 + ci * 30, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 30 + ci * 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [REL + 380, { transform: 'scale(.9)', opacity: 0.3 }, eio], [REL + 700, { transform: 'scale(.5)', opacity: 0 }]]);
  });
  for (let i = 0; i < 12; i++) along(REACH[i % 3], i % 2 ? 'spark' : 'mote', REL + 10 + Math.round(rand() * 240), FLY - 60 + Math.round(rand() * 120), (rand() - 0.5) * 18, 4 + rand() * 4, 4 + rand() * 4, 1, 0.5, 0.95, null, 120);

  // ── where it lands (BEATS.impact): the claws snap shut
  fx(k.pic(clamp, T, 40, 40), [[IMP - 90, { transform: 'rotate(-60deg) scale(2.3)', opacity: 0 }, 'ease-in'], [IMP - 40, { transform: 'rotate(-48deg) scale(1.9)', opacity: 0.9 }, 'ease-in'], [IMP + 60, { transform: 'rotate(0deg) scale(.9)', opacity: 1 }, 'ease-out'], [IMP + 160, { transform: 'rotate(0deg) scale(1)', opacity: 1 }, eio],
    [2400, { transform: 'rotate(35deg) scale(1.02)', opacity: 0.9 }, eio], [3000, { transform: 'rotate(60deg) scale(1.05)', opacity: 0.6 }, eio], [3400, { transform: 'rotate(70deg) scale(1.1)', opacity: 0 }]]);
  fx(k.pic(clamp, T, 26, 26), [[IMP - 60, { transform: 'rotate(50deg) scale(2)', opacity: 0 }, 'ease-in'], [IMP, { transform: 'rotate(35deg) scale(1.6)', opacity: 0.8 }, 'ease-in'], [IMP + 90, { transform: 'rotate(0deg) scale(.9)', opacity: 1 }, 'ease-out'], [IMP + 200, { transform: 'rotate(-6deg) scale(1)', opacity: 1 }, eio],
    [2400, { transform: 'rotate(-35deg) scale(1.02)', opacity: 0.85 }, eio], [3000, { transform: 'rotate(-60deg) scale(1.05)', opacity: 0.5 }, eio], [3400, { transform: 'rotate(-70deg) scale(1.1)', opacity: 0 }]]);
  fx(k.light('g-bone', T, 62), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 70, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IMP + 280, { transform: 'scale(.9)', opacity: 0.7 }, eio], [IMP + 600, { transform: 'scale(1.05)', opacity: 0.75 }, eio], [IMP + 1000, { transform: 'scale(.9)', opacity: 0.45 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);
  [[60, 3.2, 0.9], [200, 4.6, 0.55]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  // bone splinters thrown off, a spray of sparks, gloom boiling up from the grip
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 18, t0 = IMP + 20 + Math.round(rand() * 100), r = Math.round(rand() * 180);
    fx(k.pic(shard, T, 9, 6), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 80, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5)} rotate(${r + 60}deg) scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 650, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 12)} rotate(${r + 220}deg) scale(.8)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 18; i++) {
    const a = rand() * Math.PI * 2, d = 10 + rand() * 22, t0 = IMP + Math.round(rand() * 140), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.5 - 14 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IMP + 150 + i * 190, r = Math.round(rand() * 360);
    fx(k.pic('gloom', [T[0] + (rand() - 0.5) * 16, T[1] - 2], 30, 30, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -10)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t + 1300, { transform: `${k.T(-6, -34)} rotate(${r + 50}deg) scale(1.8)`, opacity: 0 }]]);
  }
}
