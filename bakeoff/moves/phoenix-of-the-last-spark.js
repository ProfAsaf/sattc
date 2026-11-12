// Phoenix of the Last Spark: the phoenix rouses from its ember, rears, and strikes.
//
// PLAN (drawing units 300 x 210, ms of the move). Role attacker, element fire (Soar, Rush:
// it dives on its target).
//   0-450     if its target is on its left it turns on the spot (a flip through a sliver);
//             the last ember at its feet flares and throws sparks up in a column.
//   450-1100  gather: it sinks, wings drawn up and back, body arching away from T;
//             the fire along its feathers swells, sparks spiral in from all round to
//             its chest, and a fireball swells at its beak.
//   1130      RELEASE: the downbeat: wings sweep down and forward, it lunges at T,
//             the tail whips; a fireball leaves the beak and flaming feathers are shed
//             from the wings as they beat.
//   1130-1600 the fireball flies an arc to T (k.aim, else the far right).
//   1600      IMPACT at T: flash, rings, billows and sparks flung, flames catch, smoke.
//   1600-3300 it soars up on a second beat, and settles back, wings fluttering down
//             and still; embers rain off the feathers; the light dies down. At rest from 3300.
// Aimed: T = k.aim || [262, 112]. All its motion is worked in its own space (target to the
// right) and mirrored as a whole when T is on its left; every point of the fireball's path
// comes from its beak (spec.emit, carried by the same transforms) to T.
import { SPARK, mul, rot, scl, tr, app, curve, kit } from './_fx.js';
export const END = 3700;
export const BEATS = { release: 1130, impact: 1600, settle: 3300 };
export const STILLS = [350, 800, 1100, 1250, 1600, 1950, 2600, 3400];
export const textures = { spark: SPARK };

export function build(k) {
  const { fx, rand } = k, eio = 'ease-in-out';
  const h = kit(k);
  const wL = k.part('wingL'), wR = k.part('wingR'), tail = k.part('tail'), body = k.part('body');
  const [shL, shR] = k.spec.shoulders, E = k.spec.emit, EMB = k.spec.ember;
  const T = k.aim || [262, 112];
  const mirrored = T[0] < 140;
  const dirT = mirrored ? -1 : 1;
  const TAU = Math.PI * 2;

  // ── motion (its own space, target on the right)
  const flip = mirrored ? curve([[0, 1], [400, -1], [2800, -1], [3200, 1]]) : () => 1;
  const MIR = (t) => { const v = flip(t); return scl(Math.sign(v || 1) * Math.max(0.06, Math.abs(v)), 1, 150, 0); };
  const rise = curve([[0, 0], [450, 3], [1000, 6], [1120, 6, 'in'], [1300, -10, 'out'], [1750, -16], [2150, -9], [2700, -3], [3250, 0]]); // dy: sinks, then up
  const tilt = curve([[0, 0], [450, -3], [1000, -8], [1120, -8, 'in'], [1300, 9, 'out'], [1700, 5], [2300, -1.5], [3250, 0]]); // degrees: + dives at T
  const ahead = curve([[0, 0], [1000, -3], [1120, -3, 'in'], [1300, 7, 'out'], [1800, 3], [3250, 0]]);
  const squash = curve([[0, 1], [450, 0.97], [1000, 0.94], [1120, 0.94, 'in'], [1300, 1.05], [1800, 1.01], [3250, 1]]);
  const flap = curve([[0, 0], [450, 7], [1000, 24], [1120, 26, 'in'], [1280, -32, 'out'], [1500, -12], [1750, 14], [2000, -9], [2250, 7], [2600, -4], [2900, 2], [3250, 0]]); // + raises the wing
  const whip = curve([[0, 0], [450, -4], [1000, -10], [1120, -10, 'in'], [1300, 13, 'out'], [1750, -6], [2200, 5], [2700, -2], [3250, 0]]);
  const BODY = (t) => mul(tr(ahead(t), rise(t)), mul(rot(tilt(t), 150, 130), scl(1, squash(t), 150, 176)));
  const WB = (t) => mul(MIR(t), BODY(t));
  const WL = (t) => mul(WB(t), rot(flap(t), shL[0], shL[1]));
  const WR = (t) => mul(WB(t), rot(-flap(t - 40), shR[0], shR[1])); // the right wing follows a hair late
  const WT = (t) => mul(WB(t), rot(whip(t), 150, 124));
  h.drive(body, [150, 128], WB, 3250);
  h.drive(wL, shL, WL, 3250);
  h.drive(wR, shR, WR, 3290);
  h.drive(tail, [150, 124], WT, 3250);

  // ── light
  const glow = (peak) => [[200, 0.6, 0], [700, 1.1 * peak, 0.7 * peak], [1100, 1.4 * peak, 0.95 * peak], [1300, 1.9 * peak, 1], [1800, 1.3 * peak, 0.7 * peak], [2600, 1 * peak, 0.3 * peak], [3300, 0.9 * peak, 0]];
  h.ride(k.light('g-warm', [150, 100], 96), [150, 100], WB, glow(1));
  h.ride(k.light('g-ember', [70, 42], 52), [70, 42], WL, glow(0.9));
  h.ride(k.light('g-ember', [230, 42], 52), [230, 42], WR, glow(0.9));
  fx(k.light('g-warm', EMB, 44), [[80, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [500, { transform: 'scale(1.2)', opacity: 0.9 }, eio], [1100, { transform: 'scale(1.7)', opacity: 1 }, eio], [1500, { transform: 'scale(1.3)', opacity: 0.8 }, eio], [2600, { transform: 'scale(1)', opacity: 0.3 }], [3300, { transform: 'scale(.9)', opacity: 0 }]]);
  fx(k.lightIn('g-city', [150, 110], 340, 170), [[100, { opacity: 0 }, 'ease-out'], [800, { opacity: 0.55 }, eio], [1300, { opacity: 0.9 }, eio], [1800, { opacity: 0.7 }, eio], [2600, { opacity: 0.25 }], [3300, { opacity: 0 }]]);

  // ── the ember flares, throwing sparks up in a column
  for (let i = 0; i < 14; i++) {
    const t = 150 + i * 55 + rand() * 40, x = EMB[0] + (rand() - 0.5) * 12, life = 700 + rand() * 400;
    fx(k.pic('spark', [x, EMB[1] - 2], 4 + rand() * 3, 4 + rand() * 3), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 1 }], [t + life, { transform: `${k.T((rand() - 0.5) * 30, -(35 + rand() * 40))} scale(.2)`, opacity: 0 }]]);
  }
  // ── gathering: sparks spiral in from all round to its chest, riding the body
  for (let i = 0; i < 16; i++) {
    const a = rand() * TAU, d = 55 + rand() * 40, t0 = 450 + i * 40 + rand() * 30, dur = 450 + rand() * 120, sz = 3.5 + rand() * 3, ks = [];
    for (let t = t0; t <= t0 + dur + 1; t += 50) {
      const f = Math.min(1, (t - t0) / dur), g = f * f, p = app(WB(t), [150, 100]), r = d * (1 - g), an = a + f * 2.4;
      ks.push([Math.min(t, t0 + dur), { transform: `${k.T(p[0] - 150 + Math.cos(an) * r, p[1] - 100 + Math.sin(an) * r * 0.8)} scale(${(0.6 + 0.6 * (1 - f)).toFixed(2)})`, opacity: f < 0.1 ? f * 10 : f > 0.92 ? (1 - f) * 12 : 1 }, 'linear']);
    }
    fx(k.pic('spark', [150, 100], sz, sz), ks);
  }
  // the fireball swelling at its beak, riding the head
  const ball = [[700, 0.2, 0], [850, 0.5, 0.85]];
  for (let t = 950, i = 0; t < 1120; t += 70, i++) ball.push([t, 0.7 + 0.12 * Math.min(i, 2) + (i % 2 ? 0.07 : -0.04), i % 2 ? 1 : 0.9]);
  ball.push([1135, 1, 1], [1190, 0.5, 0.5], [1260, 0.2, 0]);
  h.ride(k.light('g-ember', E, 26), E, WB, ball);
  h.ride(k.pic('puffHot', E, 16, 16), E, WB, [[760, 0.2, 0], [950, 0.8, 0.9], [1130, 1.2, 0.95], [1200, 0.6, 0.4], [1260, 0.2, 0]], 'rotate(25deg) ');
  h.ride(k.pic('puff', E, 13, 13), E, WB, [[860, 0.2, 0], [1030, 0.8, 0.75], [1135, 1.1, 0.8], [1210, 0.4, 0.3], [1260, 0.1, 0]], 'rotate(-40deg) ');

  // ── the fireball in flight (1130-1600), from its beak at the release to T
  const M = app(WB(1140), E), bz = h.arcPath(M, T, 22);
  h.fly(k.light('g-ember', M, 36), M, bz, 1130, 1600, (f) => 0.9 + 0.4 * f, (f) => (f > 0.97 ? 0.5 : 1));
  h.fly(k.pic('puffHot', M, 22, 22), M, bz, 1130, 1600, (f) => 0.6 + 0.5 * f, (f) => (f > 0.97 ? 0.4 : 0.95), 0);
  h.fly(k.pic('puff', M, 17, 17), M, bz, 1136, 1600, (f) => 0.7 + 0.5 * f, (f) => (f > 0.97 ? 0.3 : 0.85), 90);
  for (let i = 0; i < 5; i++) { // flame licks streaming back off it
    const lag = 28 + i * 24, off = (i - 2) * 3;
    h.fly(k.pic(i % 2 ? 'flame' : 'flame2', M, 8, 14, { base: true }), M, bz, 1130 + lag, 1600 + lag * 0.4, (f) => 0.8 - 0.3 * f + i * 0.05, (f) => (f > 0.9 ? 0.2 : 0.85 - 0.1 * i), off * 3);
  }
  for (let i = 0; i < 14; i++) { // shed along the way
    const f = 0.04 + (i / 14) * 0.9, t = 1130 + 470 * Math.sqrt(f) * 0.95, p = bz(f), r = Math.round(rand() * 360), id = i % 3;
    const dx = p[0] - M[0], dy = p[1] - M[1];
    fx(k.pic(id === 2 ? 'spark' : id === 1 ? 'puffCool' : 'puff', M, id === 2 ? 5 : 12, id === 2 ? 5 : 12), [[t, { transform: `${k.T(dx, dy)} rotate(${r}deg) scale(.6)`, opacity: 0 }, 'ease-out'], [t + 60, { transform: `${k.T(dx, dy)} rotate(${r + 20}deg) scale(.95)`, opacity: id === 2 ? 1 : 0.7 }],
      [t + 380, { transform: `${k.T(dx + (rand() - 0.5) * 6, dy - 7 - rand() * 6)} rotate(${r + 60}deg) scale(${id === 2 ? 0.2 : 1.4})`, opacity: 0 }]]);
  }
  // ── flaming feathers shed from the wings as they beat down (1130-1500), and again on the soaring beat
  const shed = (Wf, side, t0, n) => {
    for (let i = 0; i < n; i++) {
      const pt = [side < 0 ? 52 + i * 11 + rand() * 6 : 300 - (52 + i * 11 + rand() * 6), 36 + i * 7 + rand() * 6], t = t0 + i * 32 + rand() * 20, p = app(Wf(t), pt);
      const r = Math.round((rand() - 0.5) * 40), life = 450 + rand() * 250, big = i % 2;
      fx(k.pic(big ? 'flame2' : 'spark', p, big ? 8 : 4, big ? 14 : 4, big ? { base: true } : {}), [[t, { transform: `rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 90, { transform: `rotate(${r}deg) scale(1)`, opacity: 0.95 }],
        [t + life, { transform: `${k.T(dirT * (14 + rand() * 22), 12 + rand() * 20)} rotate(${r + dirT * 40}deg) scale(.3)`, opacity: 0 }]]);
    }
  };
  shed(WL, -1, 1140, 9);
  shed(WR, 1, 1160, 9);
  shed(WL, -1, 1740, 6);
  shed(WR, 1, 1760, 6);

  // ── the strike
  h.burst(T, 1600, { size: 1.4, flames: 6, linger: 900 });
  // ── embers raining off the feathers as it settles
  for (let i = 0; i < 12; i++) {
    const t = 1900 + i * 80 + rand() * 50, side = i % 2 ? 1 : -1, p = [150 + side * (30 + rand() * 80), 40 + rand() * 50];
    fx(k.pic('spark', p, 3.5, 3.5), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 1 }], [t + 700, { transform: `${k.T(side * (rand() - 0.2) * 10, 24 + rand() * 30)} scale(.25)`, opacity: 0 }]]);
  }
}
