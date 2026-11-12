// Choking Smoke (a Spell that takes 2 Energy from each opponent: a curse, an attacker; its element is the smoke itself,
// shadow). The forge's fire flares, as if drawing one last breath, light running up the flue; the great mass of smoke
// heaves, the chimney belches a thick black plume and lets go a river of billows that rolls along an arc down onto
// whatever is at T (the roofs of the village, alone), where it falls as a pall: a dark ring, a settling cloud, a
// little warm light there snuffed out, ash flakes sifting down. Meanwhile the forge-fire chokes down to embers (the
// Energy taken), the ember-glow in the forge mouth smothered; then the smoke draws back, the fire comes back to the heap
// as drawn.
//
// PLAN (drawing units 300 x 210, ms). Role attacker (changed from the suggested support: it is a curse sent at the
// opponent, not a boon), element shadow (the smoke; the suggested fire is only the forge's light). T = k.aim, else the
// village roofs (`roofs`). Everything that flies or lands is on the overlay (k.pic, k.light), since T may be on another card.
//   0-700    GATHER: the embers flare, sparks run up the flue; the smoke mass swells and leans back.
//   650-1100 the chimney belches thick puffs; the mass heaves.
//   1100     RELEASE: the billows leave the chimney's mouth along an arc to T.
//   1600     IMPACT: they land: dark ring, the pall mushrooms, a little light snuffed, flakes of ash.
//   1100-2300 the forge chokes down to embers (and the ember glow is smothered), the smoke rolls low over the roofs.
//   2800-3600 everything draws back to rest; SETTLE 3600.
import { curve } from './_fx.js';

export const END = 4000;
export const BEATS = { release: 1100, impact: 1600, settle: 3600 };
export const STILLS = [350, 800, 1150, 1450, 1750, 2200, 2900, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 200 + 55 * c * c, 110 + 120 * c * c * c, Math.min(1, c * c * 2.6)]; }],
  fleck: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return [150, 126, 112, Math.max(0, 1 - r) * 0.9]; }],
  dust: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, n = 0.12 * Math.sin(x * 17) * Math.cos(y * 13); return [22, 8, 7, Math.max(0, Math.min(1, (1 - r) * 1.5 + n)) * 0.92]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const S = k.spec, E = S.emit, EM = S.embers;
  const T = k.aim || S.roofs;
  k.css('.g-ash { border-radius: 50%; background: radial-gradient(circle, rgba(255,150,70,.85), rgba(255,100,30,.35) 35%, rgba(255,70,10,0) 70%); }');
  k.css('.g-pall { border-radius: 50%; background: radial-gradient(circle, rgba(20,8,6,.8), rgba(30,10,8,.5) 45%, rgba(30,10,8,0) 72%); }');
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2"/></filter></defs><ellipse cx="50" cy="50" rx="42" ry="42" fill="none" stroke="#1a0807" stroke-width="7" filter="url(#b)"/><ellipse cx="50" cy="50" rx="44" ry="44" fill="none" stroke="#d2682a" stroke-width="1.4" opacity=".6" filter="url(#b)"/>', 100, 100);

  // ── the mass of smoke (and the lit curls drawn on it) heaves about the seam; the forge-fire's embers flare, then choke down
  const mass = [[0, { transform: 'none' }, eio], [450, { transform: 'rotate(-1.2deg) scale(1.03)' }, eio], [1050, { transform: 'rotate(.8deg) scale(1.075)' }, 'ease-out'],
    [1500, { transform: 'rotate(-.6deg) scale(1.05) translate(0px, 2px)' }, eio], [2400, { transform: 'rotate(-1deg) scale(1.035)' }, eio], [3600, { transform: 'none' }]];
  act(k.part('smoke'), mass);
  act(k.part('folds'), mass);
  act(k.part('embers'), [[0, { transform: 'none', opacity: 1 }, eio], [420, { transform: 'scale(1.1, 1.25)', opacity: 1 }, eio], [900, { transform: 'scale(1.14, 1.3)', opacity: 1 }, 'ease-in'],
    [1500, { transform: 'scale(.86, .6)', opacity: 0.45 }, eio], [2100, { transform: 'scale(.8, .45)', opacity: 0.12 }, eio], [2900, { transform: 'scale(.82, .5)', opacity: 0.16 }, eio], [3600, { transform: 'none', opacity: 1 }]]);
  // the forge's light: flares, then is smothered (a dark gloom laid over the ambient glow at the mouth)
  fx(k.lightIn('g-ash', [EM[0], EM[1] - 4], 70, 46), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(1.1)', opacity: 0.95 }, eio], [1000, { transform: 'scale(1.2)', opacity: 1 }, 'ease-in'], [1500, { transform: 'scale(.7)', opacity: 0.3 }], [1900, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.picIn('gloom', [EM[0], EM[1] - 6], 64, 40, { lit: false }), [[1150, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [1800, { transform: 'scale(1.05)', opacity: 0.85 }, eio], [2900, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [3600, { transform: 'scale(.9)', opacity: 0 }]]);
  // sparks running up the flue
  for (let i = 0; i < 7; i++) {
    const t = 150 + i * 90 + rand() * 40, dx = (rand() - 0.5) * 6, sz = 3 + rand() * 3;
    fx(k.picIn('spark', [205 + dx, 170], sz, sz), [[t, { transform: 'translateY(0px) scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: `${k.T(0, -12)} scale(1)`, opacity: 1 }, 'ease-in'], [t + 520, { transform: `${k.T((rand() - 0.5) * 6, -118 - rand() * 10)} scale(.5)`, opacity: 0 }]]);
  }

  // ── the chimney belches: thick puffs rising and rolling over to the left (inside the picture)
  for (let i = 0; i < 7; i++) {
    const t = 640 + i * 70, r = Math.round(rand() * 360), s = 22 + rand() * 12;
    fx(k.picIn('dust', [205 + (rand() - 0.5) * 6, 40], s, s, { lit: false }), [[t, { transform: `${k.T(0, 4)} rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'],
      [t + 260, { transform: `${k.T(-8, -14)} rotate(${r + 20}deg) scale(1)`, opacity: 0.95 }], [t + 900, { transform: `${k.T(-34 - rand() * 12, -30)} rotate(${r + 60}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // a fierce lick of light at the mouth as it belches
  fx(k.lightIn('g-ash', [E[0], E[1] - 4], 40, 26), [[640, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [900, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [1400, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── the river of billows: from the chimney's mouth, along an arc to T (on the overlay)
  const C = [(E[0] + T[0]) / 2, Math.min(E[1], T[1]) - 34];
  const bz = (t) => { const q = 1 - t; return [q * q * E[0] + 2 * q * t * C[0] + t * t * T[0], q * q * E[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...E);
  const REL = BEATS.release, IM = BEATS.impact;
  const N = 24, TRAVEL = IM - REL + 40;
  for (let i = 0; i < N; i++) {
    const t0 = REL - 100 + i * 32, r = Math.round(rand() * 360), side = (rand() - 0.5) * 12, sz = 28 + rand() * 10;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(Math.min(1, f))); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(f * 3.14) * u).toFixed(1)}px) rotate(${r + Math.round(f * 80)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(i % 4 === 3 ? 'gloom' : 'dust', E, sz * 1.35, sz * 1.35, { lit: false }), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 90, at(0.12, 0.7, 0.95)], [t0 + TRAVEL * 0.5, at(0.55, 1.0, 0.95)],
      [t0 + TRAVEL, at(1, 1.3, 0.9), 'ease-out'], [t0 + TRAVEL + 420, at(1, 1.9, 0)]]);
  }
  // a warm underside to the river: a few embers carried along in it
  for (let i = 0; i < 8; i++) {
    const t0 = REL - 40 + i * 52, sz = 3 + rand() * 2.5, side = (rand() - 0.5) * 14;
    const at = (f, sc, o) => { const [x, y] = k.P(...bz(Math.min(1, f))); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * Math.sin(f * 3.14) * u).toFixed(1)}px) scale(${sc})`, opacity: o }; };
    fx(k.pic('spark', E, sz, sz), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 80, at(0.12, 1, 1)], [t0 + TRAVEL * 0.75, at(0.8, 0.9, 0.85)], [t0 + TRAVEL, at(1, 0.5, 0), 'ease-in']]);
  }

  // ── where it lands (IMPACT): a dark ring, the pall mushrooming, a little warm light snuffed, ash sifting down
  fx(k.pic(ring, T, 64, 64), [[IM - 20, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [IM + 60, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [IM + 520, { transform: 'scale(1.5)', opacity: 0 }]]);
  fx(k.pic(ring, T, 64, 64), [[IM + 120, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(.4)', opacity: 0.6 }, 'ease-out'], [IM + 700, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.light('g-pall', T, 84), [[IM - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IM + 200, { transform: 'scale(1)', opacity: 0.95 }, eio], [IM + 1200, { transform: 'scale(1.1)', opacity: 0.8 }, eio], [IM + 1800, { transform: 'scale(1.25)', opacity: 0 }]]);
  // the little light that was there: flares as the smoke arrives, then is smothered
  fx(k.light('g-ash', T, 30), [[IM - 100, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IM + 20, { transform: 'scale(1.1)', opacity: 1 }, 'ease-in'], [IM + 300, { transform: 'scale(.5)', opacity: 0.4 }], [IM + 520, { transform: 'scale(.2)', opacity: 0 }]]);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.5, d = 12 + rand() * 18, r = Math.round(rand() * 360), t = IM - 20 + rand() * 50, sz = 26 + rand() * 12;
    const dx = Math.cos(a) * d, dy = Math.sin(a) * d * 0.6 - 3;
    fx(k.pic(i % 3 === 2 ? 'gloom' : 'dust', T, sz * 1.3, sz * 1.3, { lit: false, low: true }), [[t, { transform: `rotate(${r}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 140, { transform: `${k.T(dx * 0.5, dy * 0.5)} rotate(${r + 30}deg) scale(.9)`, opacity: 0.95 }, 'ease-out'],
      [t + 700, { transform: `${k.T(dx, dy - 5)} rotate(${r + 60}deg) scale(1.3)`, opacity: 0.8 }, eio], [t + 1700, { transform: `${k.T(dx * 1.1, dy - 18)} rotate(${r + 90}deg) scale(1.9)`, opacity: 0 }]]);
  }
  // ash flakes sifting down
  for (let i = 0; i < 12; i++) {
    const x = (rand() - 0.5) * 36, t = IM + 120 + rand() * 600, sz = 1.6 + rand() * 1.6;
    fx(k.pic('fleck', [T[0] + x, T[1] - 18], sz, sz), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 150, { transform: `${k.T(x * 0.05, 4)} scale(1)`, opacity: 0.9 }], [t + 1200, { transform: `${k.T(x * 0.15 + 3, 26 + rand() * 6)} scale(.8)`, opacity: 0 }]]);
  }
  // and in the picture, the smoke coming down low over the village's roofs
  for (let i = 0; i < 6; i++) {
    const t = IM + 150 + i * 140, x = 28 + i * 24 + (rand() - 0.5) * 10, r = Math.round(rand() * 360);
    fx(k.picIn(i % 2 ? 'dust' : 'gloom', [x, 150 + (i % 3) * 6], 34, 24, { lit: false }), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 450, { transform: `${k.T(-4, 3)} rotate(${r + 10}deg) scale(1)`, opacity: 0.6 }, eio], [t + 1200, { transform: `${k.T(-9, 5)} rotate(${r + 25}deg) scale(1.4)`, opacity: 0 }]]);
  }
}
