// Hush, the Fog Witch (a defender: she stalls attacks so they do no harm).
// PLAN. She braces: draws back and lifts the lantern, its witchlight swelling,
// her hair lifting (0-800), and the wall of fog behind her swells toward her
// while tendrils of fog pour forward off it into a veil before her (release,
// 800). Blows come in (k.blows, else two spectral spears flung from the right
// at 1300 and 1850), each at the nearest of her guard points. At each
// (impact, 1300): the veil takes it, a flash of witchlight, a ripple of mist,
// cold sparks and fog thrown out, the blow gone without a mark; she barely
// moves (a jolt, her hair whipping, the fog wall pulsing, the lantern
// flaring). The lost warriors' eyes open in the fog. When it's over a hush
// goes out from the lantern as a ring of mist; the veil thins and drifts
// back into the wall, and she settles (settle, 3900).
// Points are in the drawing's units (300 x 210), times in ms.
export const END = 4200;
export const BEATS = { release: 800, impact: 1300, settle: 3900 };
export const STILLS = [300, 800, 1200, 1400, 1950, 2400, 3100, 4000];

export const textures = {
  fog: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [228, 236, 248, Math.min(1, Math.pow(a, 1.3) * (0.8 + 0.2 * Math.sin(x * 9 + y * 6)))]; }],
  fogD: [64, 64, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [146, 164, 196, Math.min(1, Math.pow(a, 1.2) * (0.75 + 0.25 * Math.sin(x * 7 - y * 8)))]; }],
  cold: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.max(0, 1 - r); return [196, 250, 250, Math.min(1, a * a * 2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const fog = k.part('fog'), her = k.part('her'), face = k.part('face'), hair = k.part('hair'), lantern = k.part('lantern');
  // keyframes in strictly rising time (blows may crowd each other), none past END
  const seq = (l) => { let t = -1; return l.slice().sort((a, b) => a[0] - b[0]).filter((e) => e[0] <= k.END && e[0] > t && (t = e[0]) >= 0); };
  const G = k.spec.guard, [lx, ly] = k.spec.lamp, [fx0, fy0] = [150, 120];
  k.css('.g-witch { border-radius: 50%; background: radial-gradient(circle, rgba(236,255,252,.95), rgba(150,236,232,.55) 30%, rgba(90,200,210,.2) 56%, rgba(70,170,200,0) 72%); }');
  // blows on her: another card's, or (alone) two spectral spears from the fog's warriors, flung from the right
  const snap = ([x, y]) => G.reduce((b, g) => (Math.hypot(g[0] - x, g[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? g : b));
  const mine = !k.blows;
  const blows = (k.blows || [{ at: 1300, to: G[1] }, { at: 1850, to: G[0] }]).map((b) => ({ at: b.at, to: snap(b.to) })).sort((a, b) => a.at - b.at);
  const last = blows.length ? blows[blows.length - 1].at : 1300;

  // ── her body (her, face and lantern share one pose), and her hair (turning about her head; it follows her lean)
  const hd = (rot) => [114 * Math.sin((rot * Math.PI) / 180), 3 * Math.sin((rot * Math.PI) / 180)];
  const poses = [[0, 0, 0, 0, 0], [500, -0.8, -1.2, -1.4, -6], [800, -0.5, -0.8, -1, 1]];
  for (const b of blows) {
    poses.push([b.at - 70, -0.5, -0.8, -1, 1], [b.at, -2.4, 0.4, -2.4, 10], [b.at + 150, -1.1, -0.2, -1.2, -3], [b.at + 360, -0.8, -0.8, -1, 2]);
  }
  const rest = Math.min(3500, Math.max(2900, last + 900));
  poses.push([rest, -0.4, -0.4, -0.4, 0], [Math.min(END, rest + 600), 0, 0, 0, 0]);
  const list = seq(poses);
  const bodyP = ([, dx, dy, rot]) => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) rotate(${rot}deg)` });
  for (const el of [her, face, lantern]) act(el, list.map((p) => [p[0], bodyP(p), eio]));
  act(hair, list.map((p) => { const [hx, hy] = hd(p[3]); return [p[0], { transform: `translate(${((p[1] + hx) * u).toFixed(1)}px, ${((p[2] + hy) * u).toFixed(1)}px) rotate(${p[4] + p[3] * 0.2}deg)` }, eio]; }));

  // ── the wall of fog: swells toward her, pulses at every blow, relaxes
  const swell = (s, dx, dy) => ({ transform: `translate(${(dx * u).toFixed(1)}px, ${(dy * u).toFixed(1)}px) scale(${s})` });
  const fl = [[0, swell(1, 0, 0), eio], [700, swell(1.03, -2, 1), eio]];
  for (const b of blows) fl.push([b.at - 60, swell(1.03, -2, 1), 'ease-out'], [b.at + 120, swell(1.05, -3.5, 1.4), eio], [b.at + 500, swell(1.03, -2, 1), eio]);
  fl.push([Math.min(END, rest), swell(1.02, -1, 0.5), eio], [Math.min(END, rest + 700), swell(1, 0, 0)]);
  act(fog, seq(fl));

  // ── the lantern's witchlight: swells as she braces, flares at each blow, breathes, calms
  const ll = [[200, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [800, { transform: 'scale(1.15)', opacity: 0.85 }, eio]];
  for (const b of blows) ll.push([b.at - 40, { transform: 'scale(1.1)', opacity: 0.8 }, 'ease-out'], [b.at + 90, { transform: 'scale(1.7)', opacity: 1 }, eio], [b.at + 450, { transform: 'scale(1.2)', opacity: 0.85 }, eio]);
  ll.push([rest - 200, { transform: 'scale(1.1)', opacity: 0.7 }, eio], [rest + 500, { transform: 'scale(.6)', opacity: 0 }]);
  fx(k.light('g-witch', [lx, ly], 58), seq(ll));

  // ── fog pouring off the wall into a veil before her (800 on), held through the blows, thinning back into the wall
  for (let i = 0; i < 12; i++) {
    const t0 = 800 + i * 55, sz = 34 + rand() * 24, from = [236 + rand() * 60, 96 + rand() * 60], to = [142 + rand() * 40, 96 + rand() * 66];
    const dim = i % 3 === 2 ? 'fogD' : 'fog', o = dim === 'fogD' ? 0.45 : 0.6;
    const at = (p, s, op, dy = 0) => ({ transform: `translate(${((p[0] - to[0]) * u).toFixed(1)}px, ${((p[1] - to[1] + dy) * u).toFixed(1)}px) scale(${s})`, opacity: op });
    const drift = (j) => [to[0] + (j % 2 ? 4 : -3), to[1] - (j % 3) * 1.5];
    const tl = [[t0, at(from, 0.5, 0), 'ease-out'], [t0 + 700, at(to, 1, o), eio], [t0 + 1300, at(drift(1), 1.08, o * 0.95), eio], [t0 + 1900, at(drift(2), 1.04, o), eio]];
    const out = Math.min(END - 400, rest - 300 + i * 40);
    tl.push([out, at(drift(3), 1.1, o * 0.9), eio], [Math.min(END, out + 650), at([from[0] - 20, from[1]], 1.3, 0), eio]);
    fx(k.pic(dim, to, sz, sz * 0.8, { lit: false }), seq(tl));
  }
  // low fog curling round her feet and along the shore
  for (let i = 0; i < 6; i++) {
    const x = 100 + i * 24, t0 = 500 + i * 120;
    fx(k.picIn('fog', [x, 185], 46, 14, { lit: false }), [[t0, { transform: `${k.T(-10, 0)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 600, { transform: `${k.T(0, 0)} scale(1)`, opacity: 0.5 }, eio], [t0 + 1800, { transform: `${k.T(6, -1)} scale(1.1)`, opacity: 0.45 }, eio], [Math.min(END, rest + i * 60), { transform: `${k.T(14, 0)} scale(1.2)`, opacity: 0 }]]);
  }
  // the lost warriors' eyes open in the fog, and close
  const eyes = k.svg('<circle cx="3" cy="3" r="1.5" fill="#e6ffff"/><circle cx="9" cy="3" r="1.5" fill="#e6ffff"/>', 12, 6);
  [[34, 98], [78, 112], [224, 102], [270, 96], [196, 120]].forEach(([x, y], i) => {
    const t0 = 900 + i * 260;
    fx(k.pic(eyes, [x, y], 8, 4), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 160, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [t0 + 320, { transform: 'scale(1)', opacity: 0.8 }, eio], [t0 + 1400, { transform: 'scale(1)', opacity: 0.75 }, eio], [t0 + 1700, { transform: 'scale(.3, .1)', opacity: 0 }]]);
  });

  // ── the blows, and what the veil does with each
  const spear = k.svg('<path d="M0,3H44" stroke="#e6faff" stroke-width="1.6" stroke-linecap="round"/><path d="M42,0L53,3L42,6Z" fill="#fff"/>', 54, 6);
  const ripple = k.svg('<ellipse cx="20" cy="20" rx="17" ry="16" fill="none" stroke="#e0f0f6" stroke-width="2.4" opacity=".9"/>', 40, 40);
  blows.forEach((b, n) => {
    const [gx, gy] = b.to, t = b.at;
    if (mine) {
      const sx = 320, sy = gy - 22 + n * 8, ang = (Math.atan2(gy - sy, gx - sx) * 180) / Math.PI;
      fx(k.pic(spear, [gx, gy], 40, 4.5), [[t - 260, { transform: `${k.T(sx - gx, sy - gy)} rotate(${ang.toFixed(1)}deg) scale(1.1, 1)`, opacity: 0 }, 'ease-out'], [t - 200, { transform: `${k.T((sx - gx) * 0.78, (sy - gy) * 0.78)} rotate(${ang.toFixed(1)}deg) scale(1.1, 1)`, opacity: 0.95 }, 'ease-in'],
        [t, { transform: `${k.T(0, 0)} rotate(${ang.toFixed(1)}deg) scale(.8, 1)`, opacity: 0.95 }], [t + 80, { transform: `${k.T(0, 0)} rotate(${ang.toFixed(1)}deg) scale(.2, .6)`, opacity: 0 }]]);
    }
    // the flash, the ripple of mist (two), fog thrown out, cold sparks
    fx(k.light('g-witch', [gx, gy], 46), [[t - 30, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 70, { transform: 'scale(1.1)', opacity: 1 }, eio], [t + 480, { transform: 'scale(.8)', opacity: 0 }]]);
    fx(k.pic(ripple, [gx, gy], 34, 32), [[t, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(.5)', opacity: 0.95 }, 'ease-out'], [t + 650, { transform: 'scale(1.4)', opacity: 0 }]]);
    fx(k.pic(ripple, [gx, gy], 34, 32), [[t + 130, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t + 230, { transform: 'scale(.4)', opacity: 0.6 }, 'ease-out'], [t + 800, { transform: 'scale(1.1)', opacity: 0 }]]);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.28 + rand(), d = 10 + rand() * 14;
      fx(k.pic(i % 2 ? 'fog' : 'fogD', [gx, gy], 20, 16, { lit: false }), [[t, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t + 120, { transform: `${k.T(Math.cos(a) * d * 0.5, Math.sin(a) * d * 0.5)} scale(.9)`, opacity: 0.8 }, 'ease-out'], [t + 650, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d - 6)} scale(1.5)`, opacity: 0 }]]);
    }
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * 6.28 + rand() * 0.5, d = 12 + rand() * 20;
      fx(k.pic('cold', [gx, gy], 5 + rand() * 3, 5 + rand() * 3), [[t, { transform: `${k.T(0, 0)} scale(.5)`, opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t + 500, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 6)} scale(.3)`, opacity: 0 }]]);
    }
  });

  // ── the hush: after the last blow, a ring of mist goes out from the lantern, and the lantern's motes drift up
  const hs = last + 500;
  fx(k.pic(ripple, [lx, ly], 60, 56), [[hs, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [hs + 180, { transform: 'scale(.5)', opacity: 0.8 }, 'ease-out'], [Math.min(END, hs + 1500), { transform: 'scale(3.2)', opacity: 0 }]]);
  for (let i = 0; i < 7; i++) {
    const t0 = hs + i * 90, x = lx + (rand() - 0.5) * 16;
    fx(k.pic('cold', [x, ly + 4], 5, 5), [[t0, { transform: `${k.T(0, 0)} scale(.4)`, opacity: 0 }, 'ease-out'], [t0 + 300, { transform: `${k.T((rand() - 0.5) * 6, -12)} scale(1)`, opacity: 0.9 }], [Math.min(END, t0 + 1100), { transform: `${k.T((rand() - 0.5) * 14, -40)} scale(.4)`, opacity: 0 }]]);
  }
}
