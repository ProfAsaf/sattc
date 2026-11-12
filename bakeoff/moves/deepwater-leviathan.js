// Deepwater Leviathan (a creature, an attacker: it surfaces beside a tiny ship and drowns it in a
// wave). It draws its head back, spines laid flat and water streaming harder off its jaw, its eye
// flaring; lightning cracks in the sky; then it lunges, roaring, and a great wave breaks out of its
// jaw, a curling crest with spray flying off it, and runs down onto T and crashes: a tower of
// spray, rings, mist; the ship is thrown up and tilted and tossed back down, bobbing to rest. The
// leviathan holds its lunge, then slowly sinks back, spines lifting, as the sea calms.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element water (suggestion kept).
//   0-500     ANTICIPATION: the head draws back and up (a rear), spines lay flat, the pour thickens,
//             the eye narrows then flares; the ship rocks uneasily.
//   500-800   LUNGE: the head thrusts out along its line, fangs bared; lightning flickers.
//   800       RELEASE: the wave leaves the jaw (crest, spray, billows along an arc to T).
//   1250      IMPACT at T: the crash; the ship (if it is there) is thrown up and tossed; spray, mist.
//   1250-3600 follow-through: it holds, the pour streams, the ship bobs to rest, it sinks back, the
//             spines lift; the sea calms. At rest from 3600.
// BEATS: release 800, impact 1250, settle 3600.
export const END = 4000;
export const BEATS = { release: 800, impact: 1250, settle: 3600 };
export const STILLS = [300, 650, 850, 1050, 1300, 1700, 2500, 3800];

export const textures = {
  foam: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [236, 252, 252, Math.min(1, c * 1.5) * 0.9]; }],
  drop: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [214 + 40 * c, 248, 252, Math.min(1, c * 1.7)]; }],
  mist: [48, 48, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [188, 226, 232, c * c * 0.5]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, M = S.emit, NECK = S.neck, EYE = S.eye, SHIP = S.ship;
  const head = k.part('head'), spines = k.part('spines'), fangs = k.part('fangs'), eye = k.part('eye'), pour = k.part('pour'), ship = k.part('ship'), bolt = k.part('bolt');
  k.css('.g-sea { border-radius: 50%; background: radial-gradient(circle, rgba(236,255,254,.9), rgba(170,238,242,.5) 32%, rgba(90,190,205,.18) 60%, rgba(60,170,190,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="1.5"/></filter></defs><circle cx="50" cy="50" r="40" fill="none" stroke="#cdf4f4" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f2ffff" stroke-width="1.5"/>', 100, 100);
  // a breaking wave, curling to the left (drawn at rest; mirrored when it runs to the right)
  const crest = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8f2f2"/><stop offset=".5" stop-color="#6fbcc4"/><stop offset="1" stop-color="#2a6a76"/></linearGradient></defs>' +
    '<path d="M4,40C2,22 14,6 34,3C46,1 56,8 56,18C50,12 42,13 38,19C46,21 50,28 48,40Z" fill="url(#g)"/>' +
    '<path d="M34,3C46,1 56,8 56,18C50,12 42,13 38,19" fill="none" stroke="#f4ffff" stroke-width="2.4" stroke-linecap="round"/><path d="M8,30C14,18 24,12 34,11" fill="none" stroke="#e8fbfb" stroke-width="1.2" opacity=".7"/>', 60, 44);

  const T = k.aim || SHIP;

  // ── the beast, all one body turning about its neck: a pose is [ms, dx, dy, deg, sx, sy]
  const poses = [[0, 0, 0, 0, 1, 1, eio], [500, 16, 7, 4.4, 1.0, 0.96, 'ease-in'], [560, 16, 7, 4.4, 1.0, 0.96, 'ease-out'], [820, -24, -7, -3.2, 1.07, 1.01, eio], [1000, -21, -6, -2.6, 1.055, 1.01, eio],
    [1500, -16, -4.5, -1.8, 1.04, 1.0, eio], [2300, -7, -2, -.7, 1.015, 1, eio], [3000, 1.5, .6, .4, 1, 1, eio], [3600, 0, 0, 0, 1, 1, eio], [END, 0, 0, 0, 1, 1]];
  const tf = ([, dx, dy, a, sx, sy], extra = '') => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${a}deg) scale(${sx}, ${sy})${extra}` });
  const track = (extra) => poses.map((p) => [p[0], tf(p, extra ? extra(p) : ''), p[6]]);
  act(head, track()); act(fangs, track());
  // the eye: narrows with the draw, flares at the lunge (a scale about its own centre, riding the beast)
  const ee = (p) => { const s = p[0] === 500 || p[0] === 560 ? 0.86 : p[0] === 820 ? 1.2 : p[0] === 1000 ? 1.14 : p[0] === 1500 ? 1.08 : 1; return ` translate(${((1 - s) * (EYE[0] - NECK[0]) * u).toFixed(1)}px, ${((1 - s) * (EYE[1] - NECK[1]) * u).toFixed(1)}px) scale(${s})`; };
  act(eye, track(ee));
  // the spines lay back for the draw, snap up and flare at the lunge, ripple as it sinks back
  const sp = (p) => { const r = p[0] === 500 || p[0] === 560 ? 5 : p[0] === 820 ? -6 : p[0] === 1000 ? -3 : p[0] === 1500 ? -2 : p[0] === 2300 ? 1.5 : 0; return ` rotate(${r}deg)`; };
  act(spines, track(sp));
  // the pour off its jaw: thickens in the draw, streams long in the lunge
  const pr = (p) => { const s = p[0] === 500 || p[0] === 560 ? 1.35 : p[0] === 820 ? 1.7 : p[0] === 1000 ? 1.5 : p[0] === 1500 ? 1.25 : p[0] === 2300 ? 1.1 : 1; return ` scale(1, ${s})`; };
  act(pour, track(pr));

  // ── the eye's glare: swelling with the draw, a flare at the lunge
  fx(k.lightIn('g-sea', EYE, 48, 36), [[150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [500, { transform: `${k.T(2, 1)} scale(.8)`, opacity: 0.5 }, eio], [820, { transform: `${k.T(-4, -1)} scale(1.7)`, opacity: 0.95 }, 'ease-out'], [1200, { transform: `${k.T(-3, -1)} scale(1.3)`, opacity: 0.6 }, eio], [2200, { transform: `${k.T(-1, 0)} scale(1.0)`, opacity: 0.25 }, eio], [3200, { transform: 'scale(.7)', opacity: 0 }]]);

  // ── the lightning answers: flickers three times at the lunge, and the whole sky lights with it
  act(bolt, [[0, { transform: 'scale(1)', opacity: 1 }, eio], [400, { transform: 'scale(1)', opacity: 0.4 }, eio], [600, { transform: 'scale(1.04, 1.05)', opacity: 1 }, eio], [700, { transform: 'scale(1)', opacity: 0.25 }, eio], [820, { transform: 'scale(1.06, 1.08)', opacity: 1 }, eio],
    [960, { transform: 'scale(1)', opacity: 0.35 }, eio], [1100, { transform: 'scale(1.03, 1.04)', opacity: 1 }, eio], [1700, { transform: 'scale(1)', opacity: 1 }]]);
  fx(k.lightIn('g-sea', [60, 55], 200, 150), [[560, { opacity: 0 }, 'ease-out'], [640, { opacity: 0.5 }, eio], [720, { opacity: 0.1 }, eio], [830, { opacity: 0.65 }, eio], [1000, { opacity: 0.1 }, eio], [1130, { opacity: 0.4 }, eio], [1500, { opacity: 0 }]]);

  // ── the ship: rocks uneasily, and is thrown by the crash (hard if it is where the wave lands, softly if not)
  const near = Math.max(0.28, Math.min(1, 1.15 - Math.hypot(T[0] - SHIP[0], T[1] - SHIP[1]) / 90)), IM = BEATS.impact;
  const sh = (t, dx, dy, a) => [t, { transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${a}deg)` }, eio];
  const sk = [sh(0, 0, 0, 0), sh(250, 0, -0.5, -2), sh(520, 0, 0.5, 2.4), sh(800, 0, -0.6, -2.4), sh(IM - 60, 0, 0.8, 3),
    sh(IM + 170, 7 * near, -15 * near, -20 * near), sh(IM + 430, 4 * near, 5 * near, 11 * near), sh(IM + 750, 1 * near, -4 * near, -7 * near), sh(IM + 1100, 0.5, 2 * near, 4 * near), sh(IM + 1550, 0, -1 * near, -2 * near), sh(IM + 2100, 0, 0.3, 0.6), sh(IM + 2600, 0, 0, 0)];
  act(ship, sk);

  // ── the wave: a crest runs from the jaw to T (800 -> 1250), billows and spray streaming off it
  const [X0, Y0] = k.P(...M), [X1, Y1] = k.P(...T);
  const right = T[0] > M[0] + 4;
  const dist = Math.hypot(T[0] - M[0], T[1] - M[1]) || 1, C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - Math.min(26, 8 + dist * 0.12)];
  const bz = (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const REL = BEATS.release;
  const run = (el, t0, dur, scale0, scale1, flip, o) => {
    const kf = [];
    for (let j = 0; j <= 6; j++) {
      const f = j / 6, [x, y] = k.P(...bz(Math.pow(f, 1.25))), s = scale0 + (scale1 - scale0) * f;
      kf.push([t0 + Math.round(dur * f), { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px) scale(${((flip ? -1 : 1) * s).toFixed(2)}, ${s.toFixed(2)})`, opacity: j === 0 ? 0 : o }, j === 0 ? 'ease-out' : 'linear']);
    }
    const [x, y] = k.P(...bz(1));
    kf.push([t0 + dur + 110, { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + 8 * u).toFixed(1)}px) scale(${((flip ? -1 : 1) * scale1 * 1.2).toFixed(2)}, ${(scale1 * 0.6).toFixed(2)})`, opacity: 0 }]);
    fx(el, kf);
  };
  // the crest itself, growing as it runs; the light of the lightning on it
  run(k.pic(crest, M, 56, 41), REL, 440, 0.5, 1.4, right, 1);
  // its foam: billows along the path, thrown ahead and left behind
  for (let i = 0; i < 16; i++) {
    const t0 = REL + i * 24, sz = 26 + rand() * 12;
    run(k.pic(i % 2 ? 'foam' : 'mist', M, sz, sz), t0, 400 - i * 6, 0.4, 1.0 + rand() * 0.3, right, i % 2 ? 0.8 : 0.55);
  }
  // drops and spray flung off the crest
  for (let i = 0; i < 12; i++) {
    const f = 0.15 + rand() * 0.75, [x, y] = k.P(...bz(f)), t0 = REL + Math.round(440 * Math.pow(f, 0.8)), p = `translate(${(x - X0).toFixed(1)}px, ${(y - Y0).toFixed(1)}px)`;
    fx(k.pic('drop', M, 4, 4), [[t0, { transform: `${p} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 40, { transform: `${p} scale(1)`, opacity: 0.9 }], [t0 + 340, { transform: `translate(${(x - X0 + (rand() - 0.5) * 12 * u).toFixed(1)}px, ${(y - Y0 + (12 + rand() * 12) * u).toFixed(1)}px) scale(.5)`, opacity: 0 }]]);
  }
  // the spray leaving its jaw as it bursts open
  for (let i = 0; i < 8; i++) {
    const t0 = REL - 30 + i * 22, dx = (right ? 1 : -1) * (8 + rand() * 14), dy = -(4 + rand() * 12);
    fx(k.pic('foam', M, 12 + rand() * 8, 12 + rand() * 8), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 70, { transform: `${k.T(dx * 0.3, dy * 0.3)} scale(.9)`, opacity: 0.9 }], [t0 + 420, { transform: `${k.T(dx, dy + 10)} scale(1.4)`, opacity: 0 }]]);
  }
  fx(k.light('g-sea', M, 44), [[REL - 150, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 20, { transform: 'scale(1.3)', opacity: 0.9 }, eio], [REL + 450, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the crash at T (1250): a flash, a tower of spray falling back, rings, mist
  const il = [[IM - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 40, { transform: 'scale(1.4)', opacity: 1 }, eio], [IM + 260, { transform: 'scale(1)', opacity: 0.6 }, eio], [IM + 800, { transform: 'scale(1.4)', opacity: 0 }]];
  fx(k.light('g-sea', T, 64), il);
  for (const [dt, s2, o] of [[0, 2.2, 0.95], [140, 3.0, 0.7], [300, 3.8, 0.45]]) {
    fx(k.pic(ring, [T[0], T[1] + 4], 34, 34), [[IM + dt, { transform: 'scale(1, .45) scale(.15)', opacity: 0 }, 'ease-out'], [IM + dt + 70, { transform: 'scale(1, .45) scale(.45)', opacity: o }], [IM + dt + 800, { transform: `scale(1, .45) scale(${s2})`, opacity: 0 }]]);
  }
  for (let i = 0; i < 20; i++) {
    const up = 16 + rand() * 26, dx = (rand() - 0.5) * 2 * (6 + rand() * 20), sz = 3 + rand() * 4, t0 = IM + rand() * 90;
    const pt = (f, s, o) => ({ transform: `translate(${(dx * f * u).toFixed(1)}px, ${((-up * 4 * f * (1 - f) + 10 * f * f) * u).toFixed(1)}px) scale(${s})`, opacity: o });
    fx(k.pic(i % 3 ? 'drop' : 'foam', T, sz * (i % 3 ? 1 : 2.4), sz * (i % 3 ? 1 : 2.4)), [[t0, pt(0, 0.5, 0), 'ease-out'], [t0 + 50, pt(0.06, 1, 1), 'linear'], [t0 + 260, pt(0.45, 1, 0.95), 'linear'], [t0 + 520, pt(0.8, 0.9, 0.8), 'linear'], [t0 + 760, pt(1, 0.5, 0)]]);
  }
  for (let i = 0; i < 5; i++) {
    const t = IM + 60 + i * 150, r = Math.round(rand() * 360), x = T[0] + (rand() - 0.5) * 24;
    fx(k.pic('mist', [x, T[1] + 3], 34, 34, { low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(0, -9)} rotate(${r + 20}deg) scale(1)`, opacity: 0.7 }], [t + 1500, { transform: `${k.T((rand() - 0.5) * 10, -30)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
