// Ember Volley: nine flaming arrows lift, gather fire, and go.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker (the volley IS the
// attack), element: fire (the cards's suggestion was wind; the arrows are fire).
//   0-1000    they gather: the sky round the volley warms, each arrow draws back up its
//             own line and tilts skyward (a bow drawn), heads flaring, sparks drawn in
//             from the dark, the sheet of trails pulled back with them.
//   960-1000  the clench: the light is sucked small, the whole volley hangs.
//   1000+     RELEASE: arrow after arrow (a ripple, not a salvo) tears off along a loft to
//             its own place on the line at T, turning in the air to follow its curve,
//             each with a hot head-light, a fresh streak of fire and billows and sparks.
//   1400+     IMPACT (BEATS.impact, the first lands): each arrow bursts where it lands
//             (flash, ring, billows, sparks thrown, tongues of flame left standing),
//             the line at T is lit orange, scorches smoulder, smoke goes up.
//   2400-3300 the burst dies down; the arrows come back to their places, nocked again
//             one after another with a flare, the sheet of trails fading in behind them.
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
//
// The contract (bakeoff/recipe.md): T = k.aim, or its own spot (the far line of spearmen).
// Every arrow flies from its own head (spec.heads) to T plus its own offset; its flight, its
// tilt and its streak are worked out from those.
export const END = 4000;
export const BEATS = { release: 1000, impact: 1520, settle: 3500 };
export const STILLS = [600, 980, 1120, 1250, 1380, 1540, 1750, 3700];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, h = Math.max(0, 1 - r); return [255, 200 + 55 * h * h, 110 + 130 * h * h * h, Math.min(1, h * h * 1.8)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E0 = S.emit;
  const T = k.aim || S.alone;
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const REL = 1000;
  k.css(`.g-white { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,232,.98), rgba(255,226,150,.6) 30%, rgba(255,150,60,.2) 62%, rgba(255,120,40,0) 100%); }`);
  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#ffc878" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const streak = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#ff8a3a" stop-opacity="0"/><stop offset=".55" stop-color="#ff9a3a" stop-opacity=".8"/><stop offset="1" stop-color="#fff0c0"/></linearGradient></defs><path d="M0,3 L40,0.4 Q44,3 40,5.6 Z" fill="url(#g)"/>', 44, 6);
  const ringAt = (t0, big, o, c, dur = 600) => fx(k.pic(ring, c, 40, 40, { low: true }), [[t0, { transform: 'scale(.55)', opacity: 0 }, 'ease-out'], [t0 + 40, { transform: 'scale(.8)', opacity: o }, 'ease-out'], [t0 + dur, { transform: `scale(${big})`, opacity: 0 }]]);

  // ── per arrow: where it lands, when it goes, and its curve there
  const N = S.heads.length;
  const spread = k.aim ? 11 : 34;
  const DELAY = [0, 60, 25, 150, 190, 100, 250, 215, 290];  // the ripple of releases
  const FLYD = 520;
  const arrows = S.heads.map((H, i) => {
    const sgn = (i % 3) - 1, tx = T[0] + sgn * spread * (0.6 + rand() * 0.5) + (rand() - 0.5) * 5;
    const ty = T[1] + ((i * 7) % 5 - 2) * (k.aim ? 2.2 : 2.6) + (rand() - 0.5) * 2;
    const dist = Math.hypot(tx - H[0], ty - H[1]);
    const rest = S.angles[i], kk = S.size[i];
    const rel = REL + DELAY[i], dur = FLYD + (rand() - 0.5) * 60;
    const C = [(H[0] + tx) / 2, (H[1] + ty) / 2 - (8 + dist * 0.2)];
    return { i, H, tx, ty, rest, kk, rel, dur, imp: Math.round(rel + dur), C, back: [-Math.cos(rad(rest)), -Math.sin(rad(rest))] };
  });
  const posAt = (a, w) => { const q = 1 - w; return [q * q * a.H[0] + 2 * q * w * a.C[0] + w * w * a.tx, q * q * a.H[1] + 2 * q * w * a.C[1] + w * w * a.ty]; };
  const tanAt = (a, w) => { const q = 1 - w; return deg(Math.atan2(2 * q * (a.C[1] - a.H[1]) + 2 * w * (a.ty - a.C[1]), 2 * q * (a.C[0] - a.H[0]) + 2 * w * (a.tx - a.C[0]))); };
  // the path as keyframe samples, the angle unwrapped from the arrow's rest angle
  const flight = (a) => {
    const out = []; let prev = a.rest;
    for (let j = 0; j <= 10; j++) {
      const f = j / 10, w = Math.pow(f, 1.5), p = posAt(a, w);
      let ang = tanAt(a, Math.min(0.995, Math.max(0.005, w)));
      while (ang - prev > 180) ang -= 360;
      while (ang - prev < -180) ang += 360;
      prev = ang;
      out.push({ t: Math.round(a.rel + a.dur * f), p, ang, f });
    }
    return out;
  };

  // ── the arrows: draw back and tilt (a bow drawn), hang, go, burst, and come back nocked again
  const trails = k.part('trails');
  act(trails, [[0, { transform: 'none' }, 'ease-in-out'], [820, { transform: `${k.T(-5, -3.5)}` }, 'ease-in-out'], [980, { transform: `${k.T(-6, -4)}` }, 'ease-in'], [REL + 70, { transform: `${k.T(7, 5)}`, opacity: 0.8 }, 'ease-out'], [REL + 190, { transform: `${k.T(20, 12)}`, opacity: 0 }], [3050, { transform: `${k.T(0, 0)}`, opacity: 0 }, 'ease-out'], [3500, { transform: 'none', opacity: 1 }]]);

  arrows.forEach((a) => {
    const part = k.part('a' + a.i);
    const bk = (d, tilt) => `translate(${(a.back[0] * d * u).toFixed(2)}px, ${(a.back[1] * d * u).toFixed(2)}px) rotate(${tilt}deg) scale(1)`;
    const own = 120 + a.i * 28;
    const fl = flight(a);
    const list = [[0, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)' }, 'ease-in-out'], [Math.round(260 + a.i * 25), { transform: bk(2.5, -3) }, 'ease-out'], [Math.round(a.rel - 40), { transform: bk(7.5 + a.kk, -7.5) }, 'ease-in']];
    fl.forEach(({ t, p, ang, f }, j) => {
      const s = (1 - 0.12 * f).toFixed(3);
      list.push([t, { transform: `translate(${((p[0] - a.H[0]) * u).toFixed(2)}px, ${((p[1] - a.H[1]) * u).toFixed(2)}px) rotate(${(ang - a.rest).toFixed(1)}deg) scale(${s})`, opacity: j < 10 ? 1 : 0 }, 'linear']);
    });
    const back = 2450 + a.i * 95;
    list.push([back, { transform: 'translate(0px, 0px) rotate(0deg) scale(.8)', opacity: 0 }, 'ease-out']);
    list.push([back + 420, { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', opacity: 1 }]);
    act(part, list);
    // nocked again: a little flare as it comes back
    fx(k.lightIn('g-white', a.H, 18 * a.kk, 18 * a.kk), [[back + 120, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [back + 330, { transform: 'scale(1.1)', opacity: 0.85 }, 'ease-in'], [back + 700, { transform: 'scale(.6)', opacity: 0 }]]);

    // the head's own light, flaring before it goes, then riding it to where it lands
    const hl = [[a.rel - 330, { transform: 'translate(0px, 0px) scale(.5)', opacity: 0 }, 'ease-out'], [a.rel - 40, { transform: `${bk(7.5 + a.kk, 0).replace(/rotate\(.*?\) scale\(1\)/, '')} scale(.95)`, opacity: 0.85 }, 'ease-in'], [a.rel, { transform: `${bk(7.5 + a.kk, 0).replace(/rotate\(.*?\) scale\(1\)/, '')} scale(1.1)`, opacity: 1 }, 'linear']];
    fl.slice(1).forEach(({ t, p, f }, j) => hl.push([t, { transform: `translate(${((p[0] - a.H[0]) * u).toFixed(2)}px, ${((p[1] - a.H[1]) * u).toFixed(2)}px) scale(${(1.1 - 0.35 * f).toFixed(2)})`, opacity: j < 9 ? 1 : 0.9 }, 'linear']));
    hl.push([a.imp + 70, { transform: `translate(${((a.tx - a.H[0]) * u).toFixed(2)}px, ${((a.ty - a.H[1]) * u).toFixed(2)}px) scale(.3)`, opacity: 0 }]);
    fx(k.lightIn('g-warm', a.H, 22 * a.kk, 22 * a.kk), hl);

    // its fresh streak: a tongue of fire stretched behind it all the way down
    const sc = 34 * a.kk, sk = [];
    sk.push([a.rel, { transform: `translate(${(a.back[0] * 7 * u).toFixed(1)}px, ${(a.back[1] * 7 * u).toFixed(1)}px) rotate(${a.rest}deg) scale(.4, .8)`, opacity: 0 }, 'ease-out']);
    fl.slice(1).forEach(({ t, p, ang, f }, j) => {
      const len = (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, f * 1.1))) * 0.9, cx = p[0] - Math.cos(rad(ang)) * sc * len * 0.5, cy = p[1] - Math.sin(rad(ang)) * sc * len * 0.5;
      sk.push([t, { transform: `translate(${((cx - a.H[0]) * u).toFixed(2)}px, ${((cy - a.H[1]) * u).toFixed(2)}px) rotate(${ang.toFixed(1)}deg) scale(${(len * (1 - 0.15 * f)).toFixed(3)}, ${(1 - 0.3 * f).toFixed(2)})`, opacity: j < 9 ? 1 : 0.8 }, 'linear']);
    });
    const last = sk.at(-1)[1];
    sk.push([a.imp + 260, { ...last, opacity: 0 }]);
    fx(k.pic(streak, a.H, sc * 1.3, sc * 0.3 + 2), sk);

    // billows and sparks left on its way
    const along = (tex, t0, dur, lat, sz, sc0, sc1, o, spin = 0, drop = 0, delay = 0) => {
      const kf = [];
      for (let j = 0; j <= 7; j++) {
        const f = j / 7, w = Math.pow(Math.min(1, f + delay), 1.5), p = posAt(a, w), off = lat * Math.sin(Math.PI * w) + drop * f * f, s = sc0 + (sc1 - sc0) * f;
        kf.push([Math.round(a.rel + a.dur * Math.min(1, f + delay) * 0 + t0 + dur * f), { transform: `translate(${((p[0] - a.H[0]) * u).toFixed(1)}px, ${((p[1] - a.H[1] + off) * u).toFixed(1)}px) rotate(${(spin * f).toFixed(0)}deg) scale(${s.toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0.5 * o : o }, 'linear']);
      }
      kf.push([Math.round(a.rel + t0 + dur + 70), { ...kf.at(-1)[1], opacity: 0 }]);
      fx(k.pic(tex, a.H, sz, sz), kf);
    };
    // (each of these sits a little further down the path than the last, so they trail the head)
    for (let j = 0; j < 2; j++) along(j === 1 ? 'puffCool' : 'puffHot', 40 + j * 45, a.dur - 80 - j * 30, (rand() - 0.5) * 5, (11 + rand() * 4) * a.kk, 0.8, 0.45, 0.8, (rand() - 0.5) * 80, 2 + rand() * 4);
    for (let j = 0; j < 3; j++) along('spark', 20 + Math.round(rand() * 160), a.dur - 160, (rand() - 0.5) * 8, (3 + rand() * 3) * a.kk, 1, 0.5, 0.95, 0, 4 + rand() * 8);

    // ── where it lands: a flash, billows, sparks thrown with gravity, a tongue of flame left standing
    const I = a.imp, X = [a.tx, a.ty];
    fx(k.light('g-white', X, 17 * a.kk + 4), [[I - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 30, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [I + 260, { transform: 'scale(.8)', opacity: 0 }]]);
    fx(k.light('g-warm', X, 34), [[I - 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 60, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [I + 300, { transform: 'scale(1)', opacity: 0.55 }, eio], [2500 + a.i * 40, { transform: 'scale(.7)', opacity: 0.2 }, eio], [3000 + a.i * 25, { transform: 'scale(.5)', opacity: 0 }]]);
    ringAt(I + 5, 1.9 + rand() * 0.5, 0.75, X, 520);
    for (let j = 0; j < 2; j++) {
      const ang = -Math.PI * (0.15 + 0.7 * rand()), d = 8 + rand() * 9, t0 = I + Math.round(rand() * 40), sz = 13 + rand() * 6;
      const P = (f, s, o) => ({ transform: `${k.T(Math.cos(ang) * d * f * 1.3, Math.sin(ang) * d * f * 0.8)} rotate(${Math.round(f * 60)}deg) scale(${s})`, opacity: o });
      fx(k.pic(j ? 'puffCool' : 'puffHot', X, sz, sz), [[t0, P(0, 0.3, 0), 'ease-out'], [t0 + 60, P(0.35, 0.9, 0.9), 'ease-out'], [t0 + 280, P(1, 1.3, 0.5)], [t0 + 520, P(1.2, 1.7, 0)]]);
    }
    for (let j = 0; j < 4; j++) {
      const ang = -Math.PI * (0.04 + 0.92 * rand()), dist = 8 + rand() * 22, g = 10 + rand() * 12, sz = 2.6 + rand() * 3, t0 = I + Math.round(rand() * 40);
      const P = (f, s, o) => ({ transform: `${k.T(Math.cos(ang) * dist * f * 1.2, Math.sin(ang) * dist * f + g * f * f)} scale(${s})`, opacity: o });
      fx(k.pic('spark', X, sz, sz), [[t0, P(0, 0.6, 0), 'ease-out'], [t0 + 40, P(0.2, 1.1, 1), 'ease-out'], [t0 + 300, P(0.75, 0.9, 0.9), 'ease-in'], [Math.round(t0 + 520 + rand() * 220), P(1, 0.3, 0)]]);
    }
    {
      const on = I + 70, off = 2300 + a.i * 90 + rand() * 250, F = [[on, { transform: 'scale(.6,.12)', opacity: 0 }, 'ease-out'], [on + 120, { transform: 'scale(1,1)', opacity: 0.95 }, eio]];
      for (let t = on + 120, j = 1; (t += 90 + rand() * 50) < off; j++) F.push([Math.round(t), { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - (j % 2 ? 0.08 : -0.08) - rand() * 0.06).toFixed(2)}, ${(1 + (j % 2 ? 0.14 : -0.14) + rand() * 0.1).toFixed(2)}) skewX(${((j % 2 ? 1 : -1) * (2 + rand() * 5)).toFixed(1)}deg)`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
      F.push([Math.round(off + 280), { transform: 'scale(.5,.15)', opacity: 0 }]);
      fx(k.pic(a.i % 2 ? 'flame' : 'flame2', [a.tx, a.ty + 3], (8 + rand() * 3) * a.kk, (13 + rand() * 9) * a.kk, { base: true }), F);
    }
  });

  // ── the sky warms round the volley while it gathers, the light sucked small at the clench, then flares at the release
  const WARM = curve([[0, 0], [400, 0.35], [900, 0.9], [980, 0.45], [REL + 20, 1], [REL + 400, 0.5], [REL + 900, 0.15], [REL + 1500, 0]]);
  const grid = [];
  for (let t = 100; t <= 2600; t += 50) grid.push(t);
  fx(k.lightIn('g-warm', [168, 58], 190, 130), [...grid.map((t) => [t, { transform: `scale(${(0.8 + 0.3 * WARM(t)).toFixed(3)})`, opacity: +Math.min(1, WARM(t) * 0.85).toFixed(3) }, 'linear']), [2800, { transform: 'scale(.8)', opacity: 0 }]]);
  ringAt(REL + 20, 2.8, 0.7, E0, 700);
  // ── sparks drawn in to the volley from the dark
  for (let i = 0; i < 22; i++) {
    const t0 = 120 + Math.round(rand() * 800), a = rand() * Math.PI * 2, d = 36 + rand() * 40, sz = 2.6 + rand() * 3;
    const at = [E0[0] + (rand() - 0.5) * 44, E0[1] + (rand() - 0.5) * 24];
    fx(k.pic('spark', at, sz, sz), [[t0, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.7)} scale(.4)`, opacity: 0 }, 'ease-in'], [t0 + 70, { transform: `${k.T(Math.cos(a) * d * 0.9, Math.sin(a) * d * 0.63)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 340, { transform: `${k.T(0, 0)} scale(.3)`, opacity: 0 }]]);
  }
  // ── the line they fall on: lit orange as the first lands, then dim again; a scorch that smoulders; smoke going up
  const first = Math.min(...arrows.map((a) => a.imp));
  const il = [[first - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [first + 80, { transform: 'scale(1.2)', opacity: 0.95 }, 'ease-out']];
  for (let t = first + 260, i = 0; t < 2400; t += 130, i++) il.push([t, { transform: `scale(${i % 2 ? 1.1 : 0.95})`, opacity: i % 2 ? 0.8 : 0.55 }, eio]);
  il.push([3000, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 130), il);
  ringAt(first + 60, 2.6, 0.8, T, 640);
  const sr = ((rand() - 0.5) * 16).toFixed(1), scr = (o, s) => ({ transform: `rotate(${sr}deg) scale(${s}, ${(s * 0.5).toFixed(2)})`, opacity: o });
  [[-0.7, 44], [0.15, 52], [0.8, 40]].forEach(([f, size], i) => {
    const P = [T[0] + f * spread * 1.1, T[1] + 4 + i];
    fx(k.pic('scorch' + (1 + (i % 3)) + ':char', P, size, size, { lit: false }), [[first + 100 + i * 60, scr(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [first + 380 + i * 60, scr(0.9, 1)], [2700, scr(0.9, 1), eio], [3350, scr(0, 1)]]);
    const gl = [[first + 100 + i * 60, scr(0, 0.15), 'cubic-bezier(.2,.7,.4,1)'], [first + 380 + i * 60, scr(0.95, 1)]];
    for (let t = first + 520, j = 0; t < 2600; t += 140 + rand() * 90, j++) gl.push([Math.round(t), scr(j % 2 ? 1 : 0.55, 1), eio]);
    gl.push([3000, scr(0, 1)]);
    fx(k.pic('scorch' + (1 + (i % 3)) + ':glow', P, size, size), gl);
  });
  for (let i = 0; i < 6; i++) {
    const t = first + 220 + i * 140, r = Math.round(rand() * 360), x = (rand() - 0.5) * spread * 1.6;
    fx(k.pic('smoke', [T[0] + x, T[1] - 4], 28, 28, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'], [t + 320, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1200, { transform: `${k.T(-8, -48)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
