// Sunglass Lancer: the charge, and the lance of sunlight let fly.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: light (both the
// suggestions kept). Alone, the lance's light goes just beyond the picture, level with the lance
// (`alone`); aimed, to k.aim, the whole rider turning to face it (through a sliver, as Ashmaw's
// head does) when it lies behind him, and the lance dipping or rising to point at it.
//   0-500     (only if T is behind him) horse and rider wheel round through a sliver.
//   500-1300  the gathering: the gallop builds (the horse bobs, the fore and hind legs swing
//             against each other), the rider hunches back and draws the lance back, sunlight
//             swells along it and flickers in his mirrored armour, light running in the cracks.
//   1300-1400 the wind-up: rider and horse rear a hair, the lance at its furthest back.
//   1400      RELEASE: the lance thrusts forward, the horse lunges, and a bolt of sunlight leaves
//             the lance's tip, with flares riding on it, in a line to T. The cracks flare; glass
//             splinters tear off the armour and stream back.
//   1750      IMPACT at T: a star of light, a burst of rays, rings, sparks, a lingering glow.
//   1800-3300 the lance draws back, rider and horse settle, the splinters re-form, the lights die
//             down (and, if it turned, they wheel back round).
//   3500      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim or its own; the lance and the bolt are worked out from the lance's tip
// (`emit`, after the lance has turned) to T on the overlay.
export const END = 4200;
export const BEATS = { release: 1400, impact: 1750, settle: 3500 };
export const STILLS = [250, 900, 1300, 1420, 1600, 1780, 2500, 3900];

export const textures = {
  spark: [32, 32, (x, y) => { const dx = Math.abs(x - 0.5) * 2, dy = Math.abs(y - 0.5) * 2, c = Math.max(0, 1 - Math.hypot(dx, dy)), cr = Math.max(0, 1 - Math.min(dx * 7 + dy, dy * 7 + dx)), v = Math.min(1, c * c * 1.6 + cr * 0.8); return [255, 240 + 15 * v, 200 + 55 * v, v]; }],
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 220 + 30 * c * c, 150 + 90 * c * c, Math.min(1, c * c * 1.6)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, BUTT = S.butt, TIP = S.tip, H = S.hooves;
  const T = k.aim || S.alone;
  const REL = 1400, FLY = 350, IMP = REL + FLY;
  const c01 = (x) => Math.max(0, Math.min(1, x));
  const flip = T[0] < 96; // behind him: he wheels round
  const MX = 116, M = ([x, y]) => (flip ? [2 * MX - x, y] : [x, y]);
  // ── the lance's turn toward T (in his own, unmirrored frame), and where its tip is then
  const L = Math.hypot(TIP[0] - BUTT[0], TIP[1] - BUTT[1]), a0 = Math.atan2(TIP[1] - BUTT[1], TIP[0] - BUTT[0]);
  const [tmx, tmy] = M(T);
  let dAng = ((Math.atan2(tmy - BUTT[1], tmx - BUTT[0]) - a0) * 180) / Math.PI;
  dAng = Math.max(-28, Math.min(38, ((dAng + 540) % 360) - 180));
  const thrust = 24, a1 = a0 + (dAng * Math.PI) / 180;
  const tipAt = (sh) => M([BUTT[0] + Math.cos(a1) * (L + sh) , BUTT[1] + Math.sin(a1) * (L + sh)]); // tip on screen, the lance thrust `sh` along its flight
  const E = tipAt(thrust);
  k.css(`.g-sun { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,252,238,.95), rgba(255,226,150,.6) 28%, rgba(255,190,100,.24) 58%, rgba(255,170,80,0) 100%); }
    .g-glass { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,255,255,.7), rgba(200,230,255,.35) 40%, rgba(200,230,255,.1) 75%, rgba(200,230,255,0) 100%); }`);
  const G = '<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs>';
  const bolt = k.svg('<defs><linearGradient id="s" x1="0" x2="1"><stop offset="0" stop-color="#ffd070" stop-opacity="0"/><stop offset=".55" stop-color="#ffe6a0"/><stop offset="1" stop-color="#ffffff"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><path d="M0,6 Q20,2 56,4 L70,6 L56,8 Q20,10 0,6Z" fill="url(#s)" filter="url(#b)"/><path d="M26,6 Q44,4.6 64,6 Q44,7.4 26,6Z" fill="#fff"/>', 70, 12);
  const star = k.svg(G + '<g filter="url(#b)" fill="#fffaf0"><path d="M20,0L22.4,17.6L40,20L22.4,22.4L20,40L17.6,22.4L0,20L17.6,17.6Z"/><path d="M20,6L21.4,18.6L34,20L21.4,21.4L20,34L18.6,21.4L6,20L18.6,18.6Z" fill="#fff"/></g>', 40, 40);
  let rays = '';
  for (let i = 0; i < 16; i++) { const a = (i * 360) / 16, l = i % 2 ? 22 : 30; rays += `<path transform="rotate(${a} 30 30)" d="M30,${30 - l}L32,26L28,26Z" fill="#fff4cc"/>`; }
  const burst = k.svg(G + '<g filter="url(#b)">' + rays + '</g>', 60, 60);
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1"/></filter></defs><circle cx="30" cy="30" r="25" fill="none" stroke="#fff0c0" stroke-width="2.6" filter="url(#b)"/>', 60, 60);
  const glass = k.svg(G + '<g filter="url(#b)"><path d="M1.5,7L11,3L6,8Z" fill="#e6f6ff"/><path d="M5,2L9,6" stroke="#fff" stroke-width=".6"/></g>', 13, 10);
  const glass2 = k.svg(G + '<g filter="url(#b)"><path d="M2,2L10,6L3,9Z" fill="#cfe9ff"/></g>', 12, 11);

  const curve = (pts) => (t) => {
    if (t <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (t <= pts[i][0]) return pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * sm((t - pts[i - 1][0]) / (pts[i][0] - pts[i - 1][0]));
    return pts.at(-1)[1];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 35) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3700, { transform: 'none' }]];

  // the wheel round (only if T is behind): 1 -> -1 through a sliver, and back
  const sx = (t) => { if (!flip) return 1; let s = t < 1500 ? Math.cos(Math.PI * c01(t / 460)) : -Math.cos(Math.PI * c01((t - 2900) / 460)); if (Math.abs(s) < 0.05) s = s < 0 ? -0.05 : 0.05; return s; };
  const mir = (P, t) => (flip ? `${k.T((MX - P[0]) * (1 - sx(t)), 0)} scaleX(${sx(t).toFixed(3)}) ` : '');
  // rotation by `a` degrees about the hooves, written in the frame whose origin is the part's pivot P
  const about = (P, a, dx, dy) => {
    const r = (a * Math.PI) / 180, vx = H[0] - P[0], vy = H[1] - P[1];
    return `${k.T(dx + vx - (Math.cos(r) * vx - Math.sin(r) * vy), dy + vy - (Math.sin(r) * vx + Math.cos(r) * vy))} rotate(${a.toFixed(2)}deg)`;
  };

  // ── the gallop (a bob every 420 ms, building from 300 and dying away by 3300) and the charge
  const A = (t) => c01((t - 300) / 400) * (1 - c01((t - 2700) / 600));
  const bob = (t) => Math.sin((2 * Math.PI * (t - 300)) / 420) * A(t);
  const bob2 = (t) => Math.sin((2 * Math.PI * (t - 300)) / 420 - 0.9) * A(t);
  const HA = curve([[0, 0], [700, 0.4], [1100, -0.8], [1300, -2.6], [REL + 40, 1.6], [IMP, 1.2], [2400, 0.3], [3300, 0]]);
  const HX = curve([[0, 0], [1300, -1.5], [REL + 130, 3.4], [IMP, 2.6], [2500, 0.6], [3300, 0]]);
  const ha = (t) => HA(t) + 0.9 * bob(t);
  const hx = (t) => HX(t);
  const hy = (t) => -2 * Math.abs(bob(t)) * 0 - 2.2 * bob(t);
  const LEAN = curve([[0, 0], [600, 0], [1000, -3], [1300, -6.5], [REL + 60, 7], [IMP, 4.5], [2300, 1.2], [3100, 0]]);
  const part = (name, P, extra = () => '') => act(k.part(name), sample((t) => ({ transform: `${mir(P, t)}${about(P, ha(t), hx(t), hy(t))}${extra(t)}` })));
  part('horse', [116, 188]);
  part('foreleg', [128, 152], (t) => ` rotate(${(-13 * Math.sin((2 * Math.PI * (t - 300)) / 420) * A(t)).toFixed(2)}deg)`);
  part('hindleg', [94, 152], (t) => ` rotate(${(11 * Math.sin((2 * Math.PI * (t - 300)) / 420 + 0.5) * A(t)).toFixed(2)}deg)`);
  part('rider', [122, 134], (t) => ` rotate(${(LEAN(t) + 1.2 * bob2(t)).toFixed(2)}deg)`);
  // the lance: draws back along its flight, turns to T, thrusts out, then comes home
  const SH = curve([[0, 0], [600, 0], [1300, -10], [REL - 30, -11], [REL + 150, thrust], [IMP, thrust - 2], [2300, 9], [3200, 0]]);
  const DA = curve([[0, 0], [900, dAng], [2600, dAng], [3300, 0]]);
  const lanceX = (t) => ` rotate(${DA(t).toFixed(2)}deg) ${k.T(Math.cos(a0) * SH(t), Math.sin(a0) * SH(t))}`;
  part('lance', BUTT, lanceX);
  part('haze', BUTT, lanceX);
  // the splinters of glass: shudder with him, tear loose at the release and stream back, re-form
  act(k.part('shards'), [...grid.map((t) => [t, { transform: `${mir([95, 100], t)}${about([95, 100], ha(t), hx(t), hy(t))} rotate(${(LEAN(t) + 1.2 * bob2(t)).toFixed(2)}deg) ${k.T(-22 * sm(c01((t - REL) / 450)) * (1 - c01((t - 2500) / 10)), 4 * sm(c01((t - REL) / 450)) * (1 - c01((t - 2500) / 10)))}`, opacity: t < REL ? 1 : t < REL + 450 ? +(1 - sm((t - REL) / 450)).toFixed(3) : t < 2500 ? 0 : +sm((t - 2500) / 800).toFixed(3) }, 'linear']).filter(([t]) => t < 3500), [3700, { transform: 'none', opacity: 1 }]]);

  // ── light: swells along the lance as it is drawn back, flares at the release, dies down (it rides the lance)
  const LA = (t) => `${mir(BUTT, t)}${k.T(Math.cos(a0) * SH(t), Math.sin(a0) * SH(t))}`;
  const LG = curve([[0, 0], [500, 0.1], [1300, 0.75], [REL + 60, 1], [REL + 400, 0.6], [2300, 0.3], [3000, 0]]);
  for (const f of [0.3, 0.6, 0.9]) {
    const px = BUTT[0] + Math.cos(a0) * L * f, py = BUTT[1] + Math.sin(a0) * L * f, kf = [];
    const P0 = M([px, py]);
    for (const t of grid.filter((t) => t >= 35)) {
      const sh = SH(t), d = DA(t) * Math.PI / 180, r = L * f + 0;
      // where that spot of the lance is now (turned by DA about the butt, pushed along the flight): relative to its start on screen
      const q = M([BUTT[0] + Math.cos(a0 + d) * (r + sh), BUTT[1] + Math.sin(a0 + d) * (r + sh)]);
      kf.push([t, { transform: `${k.T(q[0] - P0[0], q[1] - P0[1])} scale(${(0.6 + 0.8 * LG(t)).toFixed(3)})`, opacity: +Math.min(1, LG(t) * 1.1).toFixed(3) }, 'linear']);
    }
    kf.push([3700, { transform: 'scale(.6)', opacity: 0 }]);
    fx(k.light('g-sun', P0, 38), kf);
  }
  // the armour: its mirror throws back flashes as the light builds, a flare at each crack at the release
  const HITP = [128, 108];
  const armour = (x, y, sz, t0, o) => [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: 'scale(1.2)', opacity: o }, 'ease-out'], [t0 + 320, { transform: 'scale(.6)', opacity: 0 }]];
  [[560, 0.6, 0], [820, 0.7, -8], [1060, 0.9, 6], [1250, 1, -4]].forEach(([t0, o, dy]) => {
    const P = M([HITP[0] + dy * 0.4, HITP[1] + dy]);
    fx(k.light('g-glass', P, 26), armour(P[0], P[1], 26, t0, o));
    fx(k.pic('spark', P, 7, 7), [[t0 + 20, { transform: 'scale(.3) rotate(0deg)', opacity: 0 }, 'ease-out'], [t0 + 110, { transform: 'scale(1.2) rotate(40deg)', opacity: 1 }, 'ease-out'], [t0 + 330, { transform: 'scale(.4) rotate(80deg)', opacity: 0 }]]);
  });
  // the glow of the crack-lines at the release, and the splinters torn off the armour, streaming back and tumbling
  const CP = M([133, 111]);
  fx(k.light('g-sun', CP, 46), [[REL - 60, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 70, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [REL + 400, { transform: 'scale(.9)', opacity: 0.5 }, eio], [REL + 900, { transform: 'scale(.6)', opacity: 0 }]]);
  for (let i = 0; i < 18; i++) {
    const t0 = REL - 20 + Math.round(rand() * 280), x = 70 + rand() * 60, y = 78 + rand() * 40, P = M([x, y]);
    const dir = flip ? 1 : -1, d = 30 + rand() * 40, r = Math.round(rand() * 360);
    fx(k.pic(i % 2 ? glass : glass2, P, 8 + rand() * 4, 6 + rand() * 3), [[t0, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.7)`, opacity: 0 }, 'ease-out'], [t0 + 100, { transform: `${k.T(dir * d * 0.2, -2)} rotate(${r + 50}deg) scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 900 + Math.round(rand() * 400), { transform: `${k.T(dir * d, 14 + rand() * 22)} rotate(${r + 340}deg) scale(.7)`, opacity: 0 }]]);
  }
  // a glint in the dust under the hooves with every bob
  for (let i = 0; i < 8; i++) {
    const t0 = 420 + i * 300, x = 40 + rand() * 140;
    const P = M([x, 186]);
    fx(k.picIn('mote', P, 3, 3), [[t0, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t0 + 120, { transform: `${k.T(flip ? 5 : -5, -3)} scale(1)`, opacity: 0.8 }, 'ease-out'], [t0 + 500, { transform: `${k.T(flip ? 16 : -16, -9)} scale(.3)`, opacity: 0 }]]);
  }

  // ── the release: the bolt of sunlight from the lance's tip to T (and flares and motes riding on it)
  const [X0, Y0] = k.P(...E);
  const dist = Math.hypot(T[0] - E[0], T[1] - E[1]), ang = Math.atan2(T[1] - E[1], T[0] - E[0]);
  const pos = (f, lat) => { const [x, y] = k.P(E[0] + (T[0] - E[0]) * f - Math.sin(ang) * lat, E[1] + (T[1] - E[1]) * f + Math.cos(ang) * lat); return [x - X0, y - Y0]; };
  const flight = (tex, sx0, sy0, t0, dur, lat, s0, s1, o, rot, linger = 0) => {
    const kf = [], n = 6;
    for (let j = 0; j <= n; j++) {
      const f = j / n, w = Math.pow(f, 0.8), [x, y] = pos(w, lat * Math.sin(Math.PI * w));
      kf.push([Math.round(t0 + dur * f), { transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${rot ? ((ang * 180) / Math.PI).toFixed(1) : 0}deg) scale(${(s0 + (s1 - s0) * f).toFixed(2)})`, opacity: j === 0 ? 0 : o }, 'linear']);
    }
    kf.push([Math.round(t0 + dur + 50 + linger), { ...kf.at(-1)[1], opacity: 0 }]);
    fx(k.pic(tex, E, sx0, sy0), kf);
  };
  const BL = Math.min(60, Math.max(26, dist * 0.45));
  flight(bolt, BL, BL * 0.17, REL + 40, FLY - 40, 0, 0.9, 1.15, 1, true, 30);
  flight(bolt, BL * 0.7, BL * 0.12, REL + 80, FLY - 60, 3.5, 0.9, 1, 0.8, true, 30);
  flight(bolt, BL * 0.7, BL * 0.12, REL + 90, FLY - 70, -3.5, 0.9, 1, 0.8, true, 30);
  flight(star, 14, 14, REL + 30, FLY - 30, 0, 0.8, 1.2, 1, false, 20);
  for (let i = 0; i < 12; i++) flight(i % 3 ? 'mote' : 'spark', 4 + rand() * 4, 4 + rand() * 4, REL + 30 + Math.round(rand() * 200), FLY - 40 + Math.round(rand() * 80), (rand() - 0.5) * 10, 1, 0.5, 0.95, false, 100);
  fx(k.light('g-sun', E, 44), [[REL - 80, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [REL + 30, { transform: 'scale(1.5)', opacity: 1 }, 'ease-out'], [REL + 400, { transform: 'scale(1)', opacity: 0.4 }, eio], [REL + 800, { transform: 'scale(.5)', opacity: 0 }]]);
  fx(k.pic(star, E, 22, 22), [[REL - 30, { transform: 'rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [REL + 50, { transform: 'rotate(30deg) scale(1.3)', opacity: 1 }, 'ease-out'], [REL + 300, { transform: 'rotate(90deg) scale(.5)', opacity: 0 }]]);
  // light spills over the whole picture as the lance flies
  fx(k.lightIn('g-sun', [160, 110], 320, 150), [[REL - 100, { opacity: 0 }, 'ease-out'], [REL + 80, { opacity: 0.5 }, 'ease-out'], [IMP + 200, { opacity: 0.25 }, eio], [2600, { opacity: 0 }]]);

  // ── where it lands (BEATS.impact): a star of light, a burst of rays, rings, sparks
  fx(k.pic(star, T, 46, 46), [[IMP - 50, { transform: 'rotate(0deg) scale(.2)', opacity: 0 }, 'ease-out'], [IMP + 60, { transform: 'rotate(20deg) scale(1.2)', opacity: 1 }, 'ease-out'], [IMP + 260, { transform: 'rotate(50deg) scale(.9)', opacity: 0.9 }, eio], [IMP + 900, { transform: 'rotate(110deg) scale(.4)', opacity: 0 }]]);
  fx(k.pic(burst, T, 52, 52), [[IMP - 40, { transform: 'rotate(0deg) scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 70, { transform: 'rotate(12deg) scale(1.1)', opacity: 1 }, 'ease-out'], [IMP + 700, { transform: 'rotate(40deg) scale(1.9)', opacity: 0 }]]);
  fx(k.light('g-sun', T, 70), [[IMP - 40, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + 70, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [IMP + 300, { transform: 'scale(.9)', opacity: 0.75 }, eio], [IMP + 700, { transform: 'scale(1.05)', opacity: 0.7 }, eio], [IMP + 1100, { transform: 'scale(.9)', opacity: 0.4 }, eio], [3100, { transform: 'scale(.6)', opacity: 0 }]]);
  [[60, 3.2, 0.9], [200, 4.6, 0.55]].forEach(([d, big, o]) => fx(k.pic(ring, T, 30, 30, { low: true }), [[IMP + d, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [IMP + d + 40, { transform: 'scale(.6)', opacity: o }, 'ease-out'], [IMP + d + 700, { transform: `scale(${big})`, opacity: 0 }]]));
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 26, t0 = IMP + Math.round(rand() * 120), sz = 3 + rand() * 4;
    fx(k.pic(i % 3 ? 'mote' : 'spark', T, sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 90, { transform: `${k.T(Math.cos(a) * d * 0.4, Math.sin(a) * d * 0.4)} scale(1)`, opacity: 1 }, 'ease-out'], [t0 + 800 + Math.round(rand() * 400), { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d * 0.8 + 8)} scale(.3)`, opacity: 0 }]]);
  }
}
