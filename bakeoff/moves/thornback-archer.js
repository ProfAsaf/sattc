// Thornback Archer: she takes a breath, draws a fresh arrow of light and thorn, looses it, and
// it bursts into brambles and leaves where it lands.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: attacker, element: nature. Her parts: she
// (from her feet, all of her but the bow arm), the bow arm (about the shoulder end of its cut, riding
// her), the arrow in flight as drawn, and the beast and the eagle above (they react if she shoots at
// the beast, which she does alone).
//   0-450     anticipation: she lowers the bow a little and breathes out; the arrow as drawn
//             dissolves into motes; (if T is to her left she turns about through a sliver).
//   450-1050  she draws: lean back, the bow comes up and round onto T, a fresh arrow conjured at
//             the string, thorn-glow running down her back from nape to hip, motes drawn in.
//   880-1150  full draw: a tremor.
//   1150      RELEASE (BEATS.release): the string snaps; she kicks forward, the bow arm flicks up; a
//             flash at the grip; the arrow flies out from `emit` (the grip) to T, a streak of green
//             light behind it, leaves and motes shaken off along its path.
//   1500      LANDS (BEATS.impact) at T = k.aim, else the beast's jaws: a flash, a ring, thorns and
//             leaves bursting outward, pollen rising; alone the beast recoils and the eagle banks away.
//   1500-3000 brambles' light lingers and fades, she lowers the bow and watches.
//   3500      at rest as drawn (the arrow as drawn fades back in by then).
//
// The contract: the attack leaves from `emit` (the grip, after she has turned/aimed) and goes to T.
export const END = 3900;
export const BEATS = { release: 1150, impact: 1500, settle: 3500 };
export const STILLS = [250, 700, 1050, 1180, 1330, 1560, 2300, 3700];

export const textures = {
  mote: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [226, 255, 160, Math.min(1, c * c * 1.5)]; }],
  pollen: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246, 150, Math.min(1, c * c * 1.3)]; }],
};

export function build(k) {
  const { fx, act, rand, u } = k, sm = k.smooth, eio = 'ease-in-out';
  const S = k.spec, F = S.feet, SH = S.shoulder, G = S.grip, MX = F[0]; // (she mirrors about her knee's x)
  const T = k.aim || S.alone;
  const right = T[0] >= MX;
  const m = ([x, y]) => (right ? [x, y] : [2 * MX - x, y]); // a point of the drawing, mirrored if she faces left
  const TL = m(T); // T in her own (right-facing) frame
  const her = k.part('her'), bow = k.part('bow'), oldArrow = k.part('arrow'), beast = k.part('beast'), eagle = k.part('eagle');
  const rad = (d) => (d * Math.PI) / 180;
  const rot = (a, [x, y]) => [x * Math.cos(rad(a)) - y * Math.sin(rad(a)), x * Math.sin(rad(a)) + y * Math.cos(rad(a))];

  k.css(`.g-nature { border-radius: 50%; background: radial-gradient(circle, rgba(250,255,226,.95), rgba(196,242,112,.6) 30%, rgba(120,200,70,.2) 55%, rgba(90,180,60,0) 70%); }`);

  // a curve through [ms, value] keys, eased between them
  const track = (keys) => (t) => {
    let i = keys.length - 1;
    while (i > 0 && keys[i][0] > t) i--;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)];
    const f = b[0] === a[0] ? 0 : sm(Math.max(0, Math.min(1, (t - a[0]) / (b[0] - a[0]))));
    return a[1] + (b[1] - a[1]) * f;
  };
  const ramp = (a, b) => (t) => Math.max(0, Math.min(1, (t - a) / (b - a)));

  // ── her pose over time: the body's lean/shift/mirror about her knee, and the bow arm's turn
  const lean = track([[0, 0], [450, 1.3], [1000, -3.2], [1150, -3.6], [1230, 3], [1420, 0.9], [1800, 0.5], [2900, 0.4], [3500, 0]]);
  const ty = track([[0, 0], [450, 1.7], [1000, -0.6], [1150, -0.6], [1270, 0.9], [1800, 0.3], [3500, 0]]);
  const tx = track([[0, 0], [1000, -1.4], [1150, -1.4], [1240, 1.5], [1700, 0.2], [3500, 0]]);
  const sy = track([[0, 1], [450, 0.985], [1000, 1.01], [1260, 0.99], [1900, 1], [3500, 1]]);
  const sxl = right ? () => 1 : track([[0, 1], [190, 0.06], [380, -1], [3050, -1], [3240, 0.06], [3430, 1]]);
  // the bow arm's own turn (clockwise = down, in her own frame): toward T, a drop as she breathes, a flick on release
  const dAim = Math.max(-34, Math.min(34, (Math.atan2(TL[1] - SH[1], TL[0] - SH[0]) * 180) / Math.PI - S.aim));
  const aimTo = track([[0, 0], [300, 0], [680, 1], [2200, 1], [3000, 0], [3500, 0]]);
  const drop = track([[0, 0], [450, 5], [1000, 0]]);
  const kick = track([[1140, 0], [1190, -5.5], [1310, 2.4], [1500, -0.7], [1750, 0]]);
  const tremble = (t) => 0.34 * Math.sin(t / 17) * Math.sin((Math.PI * Math.max(0, Math.min(1, (t - 880) / 270))));
  const body = (t) => ({ tx: tx(t), ty: ty(t), a: lean(t) + tremble(t), sx: sxl(t), sy: sy(t) });
  const bowRot = (t) => dAim * aimTo(t) + drop(t) + kick(t) + tremble(t) * 0.8;
  // where a point of her (at rest in her own frame) is on the card at time t; `ofBow`: a point of the bow arm
  const bodyPt = ([x, y], t) => {
    const b = body(t), d = [(x - F[0]) * b.sx, (y - F[1]) * b.sy], r = rot(b.a, d);
    return [F[0] + b.tx + r[0], F[1] + b.ty + r[1]];
  };
  const bowPt = ([x, y], t) => {
    const b = body(t), s0 = bodyPt(SH, t), q = rot(bowRot(t), [x - SH[0], y - SH[1]]), r = rot(b.a, [q[0] * b.sx, q[1] * b.sy]);
    return [s0[0] + r[0], s0[1] + r[1]];
  };
  const grid = [];
  for (let t = 0; t <= 3500; t += 30) grid.push(t);
  const sample = (fn) => [...grid.map((t) => [t, fn(t), 'linear']), [3600, { transform: 'none' }]];
  act(her, sample((t) => { const b = body(t); return { transform: `translate(${(b.tx * u).toFixed(2)}px, ${(b.ty * u).toFixed(2)}px) rotate(${b.a.toFixed(2)}deg) scale(${b.sx.toFixed(3)}, ${b.sy.toFixed(3)})` }; }));
  act(bow, sample((t) => {
    const b = body(t), p = bodyPt(SH, t);
    return { transform: `translate(${((p[0] - SH[0]) * u).toFixed(2)}px, ${((p[1] - SH[1]) * u).toFixed(2)}px) rotate(${b.a.toFixed(2)}deg) scale(${b.sx.toFixed(3)}, ${b.sy.toFixed(3)}) rotate(${bowRot(t).toFixed(2)}deg)` };
  }));
  // the arrow as drawn dissolves as she lowers the bow, and returns as she settles
  act(oldArrow, [[0, { opacity: 1 }, eio], [280, { opacity: 0 }], [3120, { opacity: 0 }, eio], [3500, { opacity: 1 }]]);
  for (let n = 0; n < 7; n++) {
    const t = 20 + n * 32, f = n / 6, x = 118 + 68 * f, y = 91 - 24 * f + (rand() - 0.5) * 4, sz = 4 + rand() * 3;
    fx(k.pic('mote', [x, y], sz, sz), [[t, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [t + 100, { transform: 'scale(1)', opacity: 0.95 }], [t + 520, { transform: `${k.T((rand() - 0.5) * 10, -10 - rand() * 12)} scale(.3)`, opacity: 0 }]]);
  }

  // ── where the arrow leaves (the grip as she holds it at release) and its way to T
  const Hd = [38, 98]; // her string hand, drawn back past her ear (at rest, her own frame)
  // (bowPt and bodyPt map her-frame points through her pose, mirror included: they give points on the card)
  const Eg = (t) => bowPt(G, t);
  const E = Eg(1150), flight = [T[0] - E[0], T[1] - E[1]], L = Math.hypot(flight[0], flight[1]) || 1, ud = [flight[0] / L, flight[1] / L];
  const ANG = (Math.atan2(ud[1], ud[0]) * 180) / Math.PI;

  // ── her thorns light up, nape to hip, as the arrow is conjured (her own frame: the tips of her thorns)
  const thorns = [[47, 101], [45, 112], [45, 122], [46, 132], [48, 141]];
  thorns.forEach((P, i) => {
    const t0 = 520 + i * 95, home = m(P);
    const at = (t, s, o) => { const q = bodyPt(P, t); return { transform: `${k.T(q[0] - home[0], q[1] - home[1])} scale(${s})`, opacity: o }; };
    const list = [[t0, at(t0, 0.3, 0), 'ease-out'], [t0 + 130, at(t0 + 130, 1.2, 1), 'linear']];
    for (let t = t0 + 190; t < 1140; t += 60) list.push([t, at(t, 0.95 + 0.25 * Math.sin(t / 40 + i), 0.85), 'linear']);
    list.push([1150, at(1150, 1.8, 1), 'ease-out'], [1330, at(1330, 0.5, 0)]);
    fx(k.pic('mote', home, 9, 9), list);
  });
  // a long warm swell along her back and over her bow as she draws
  const backGlow = m([52, 122]);
  fx(k.light('g-nature', backGlow, 70), [[520, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1100, { transform: 'scale(1)', opacity: 0.42 }, eio], [1170, { transform: 'scale(1.3)', opacity: 0.6 }, 'ease-out'], [1600, { transform: 'scale(1.2)', opacity: 0 }]]);

  // ── the arrow, conjured at the string (480-1150), then flying (1150-1500)
  const nockImg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter></defs>' +
    '<path d="M2,5H60" stroke="#d6f58c" stroke-width="3.2" filter="url(#b)" opacity=".9"/><path d="M4,5H58" stroke="#3a2a16" stroke-width="1.5"/>' +
    '<path d="M58,2.2L66,5L58,7.8Z" fill="#1c2a12"/><path d="M60,3.6L63.5,5L60,6.4Z" fill="#effcb4"/>' +
    '<path d="M4,5L9,1.4L12,5L9,8.6Z" fill="#7ab048"/><path d="M10,5L15,2L17,5L15,8Z" fill="#a8d864"/>', 70, 10);
  const flyImg = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation="1.1"/></filter><linearGradient id="g"><stop offset="0" stop-color="#e8ffa8" stop-opacity="0"/><stop offset="1" stop-color="#f2ffc8" stop-opacity=".95"/></linearGradient></defs>' +
    '<path d="M2,5H44L56,3.4V6.6Z" fill="url(#g)" filter="url(#b)"/><path d="M40,5H96" stroke="#d6f58c" stroke-width="3.2" filter="url(#b)" opacity=".9"/><path d="M40,5H94" stroke="#3a2a16" stroke-width="1.5"/>' +
    '<path d="M94,2.2L102,5L94,7.8Z" fill="#1c2a12"/><path d="M96,3.6L99.5,5L96,6.4Z" fill="#effcb4"/>' +
    '<path d="M40,5L45,1.4L48,5L45,8.6Z" fill="#7ab048"/><path d="M46,5L51,2L53,5L51,8Z" fill="#a8d864"/>', 104, 10);
  const AL = 62; // the arrow's length on the card; the picture's tip is 66 of 70 wide
  // the nocked arrow: tip at the grip, tail at her string hand, riding the bow's motion; it slides home as she draws
  const unwrapped = (() => { let prev = null; return (a) => { if (prev !== null) { while (a - prev > 180) a -= 360; while (a - prev < -180) a += 360; } prev = a; return a; }; })();
  {
    const NW = 70, tipFrac = 66 / NW; // (centre of the picture is 35 from its left; the tip is 31 further)
    const centre = (t, slide) => {
      const tip = Eg(t), tail = bodyPt(Hd, t);
      let dx = tip[0] - tail[0], dy = tip[1] - tail[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const scale = AL / 66, back = (66 - 35) * scale; // the centre sits 31 (scaled) behind the tip
      return { c: [tip[0] - dx * back - dx * slide, tip[1] - dy * back - dy * slide], a: (Math.atan2(dy, dx) * 180) / Math.PI, scale };
    };
    void tipFrac;
    const c0 = centre(500, 14).c;
    const list = [];
    for (let t = 480; t <= 1148; t += 30) {
      const sl = 14 * (1 - sm(Math.min(1, (t - 480) / 520))), p = centre(t, sl);
      list.push([t, { transform: `${k.T(p.c[0] - c0[0], p.c[1] - c0[1])} rotate(${unwrapped(p.a).toFixed(2)}deg) scale(${p.scale.toFixed(3)})`, opacity: t < 500 ? 0 : Math.min(1, (t - 480) / 220) }, 'linear']);
    }
    const last = centre(1150, 0);
    list.push([1150, { transform: `${k.T(last.c[0] - c0[0], last.c[1] - c0[1])} rotate(${unwrapped(last.a).toFixed(2)}deg) scale(${last.scale.toFixed(3)})`, opacity: 1 }, 'linear'], [1170, { transform: `${k.T(last.c[0] - c0[0] + ud[0] * 3, last.c[1] - c0[1] + ud[1] * 3)} rotate(${last.a.toFixed(2)}deg) scale(${last.scale.toFixed(3)})`, opacity: 0 }]);
    fx(k.pic(nockImg, c0, 70 * (AL / 66), 10 * (AL / 66), { lit: false }), list);
    // a bloom of light round it as it is conjured, flaring on release
    const tipAt = (t) => { const p = Eg(t); return p; };
    const g0 = tipAt(900);
    const gl = [];
    for (let t = 520; t <= 1148; t += 30) { const p = tipAt(t), s = 0.4 + 0.7 * Math.min(1, (t - 520) / 500) + 0.08 * Math.sin(t / 45); gl.push([t, { transform: `${k.T(p[0] - g0[0], p[1] - g0[1])} scale(${s.toFixed(2)})`, opacity: Math.min(0.85, (t - 520) / 420) }, 'linear']); }
    gl.push([1170, { transform: `${k.T(E[0] - g0[0], E[1] - g0[1])} scale(1.7)`, opacity: 1 }, 'ease-out'], [1420, { transform: `${k.T(E[0] - g0[0], E[1] - g0[1])} scale(2.2)`, opacity: 0 }]);
    fx(k.light('g-nature', g0, 44), gl);
  }
  // motes drawn in along the arrow as it is conjured
  for (let n = 0; n < 16; n++) {
    const t = 480 + n * 36 + rand() * 25, tp = Eg(t), f = rand(), tail = bodyPt(Hd, t);
    const x = tail[0] + (tp[0] - tail[0]) * f, y = tail[1] + (tp[1] - tail[1]) * f;
    const a = rand() * Math.PI * 2, d = 12 + rand() * 12, sz = 3 + rand() * 3;
    fx(k.pic('mote', [x + Math.cos(a) * d, y + Math.sin(a) * d], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 90, { transform: 'scale(1)', opacity: 0.95 }, 'linear'], [t + 330 + rand() * 90, { transform: `${k.T(-Math.cos(a) * d, -Math.sin(a) * d)} scale(.4)`, opacity: 0 }]]);
  }

  // the flight: a pace that starts slow off the string, and quickens
  const FL0 = 1150, FL1 = 1500, ease = (q) => Math.pow(q, 1.5);
  const side = rad(ANG + 90), arcUp = Math.min(10, L * 0.07); // (a little drop and rise: it flies on a gentle arc)
  const pathPt = (q) => { const off = Math.sin(Math.PI * q) * arcUp; return [E[0] + flight[0] * q - Math.cos(side) * off * 0 + 0, E[1] + flight[1] * q - off]; };
  {
    const tipOff = 50 - 0; // (flyImg: 104 wide, centre at 52, the tip 52 from it)
    const sc = AL / 66;
    const c0 = [E[0] - ud[0] * 31 * sc, E[1] - ud[1] * 31 * sc];
    const list = [], steps = 14;
    for (let i = 0; i <= steps; i++) {
      const q = ease(i / steps), p = pathPt(q), tx2 = pathPt(Math.min(1, q + 0.02)), tx1 = pathPt(Math.max(0, q - 0.02));
      const ang = (Math.atan2(tx2[1] - tx1[1], tx2[0] - tx1[0]) * 180) / Math.PI;
      const c = [p[0] - Math.cos(rad(ang)) * 52 * sc, p[1] - Math.sin(rad(ang)) * 52 * sc];
      list.push([FL0 + (FL1 - FL0) * (i / steps), { transform: `${k.T(c[0] - c0[0], c[1] - c0[1])} rotate(${ang.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: 1 }, 'linear']);
    }
    void tipOff;
    list.unshift([FL0 - 10, { transform: `${k.T(0, 0)} rotate(${ANG.toFixed(2)}deg) scale(${sc.toFixed(3)})`, opacity: 0 }, 'linear']);
    list.push([FL1 + 60, { transform: list[list.length - 1][1].transform, opacity: 0 }]);
    fx(k.pic(flyImg, c0, 104 * sc, 10 * sc, { lit: false }), list);
    // its green light flies with it
    const gl = [[FL0, { transform: 'scale(.6)', opacity: 0 }, 'ease-out']];
    const g0 = E;
    for (let i = 0; i <= steps; i++) { const q = ease(i / steps), p = pathPt(q); gl.push([FL0 + (FL1 - FL0) * (i / steps), { transform: `${k.T(p[0] - g0[0], p[1] - g0[1])} scale(${(0.9 + 0.5 * q).toFixed(2)})`, opacity: 0.9 }, 'linear']); }
    gl.push([FL1 + 120, { transform: `${k.T(T[0] - g0[0], T[1] - g0[1])} scale(1.8)`, opacity: 0 }]);
    fx(k.light('g-nature', g0, 40), gl);
  }
  // leaves and motes shaken off along its path
  const leafLight = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".45"/></filter></defs><path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#b6e98f" filter="url(#b)"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#effcc8"/>', 20, 14);
  const leafDark = k.svg('<path d="M3,10C5,3 13,1 17,2C16,9 11,16 3,10Z" fill="#587f34"/><path d="M3.6,9.6C6,4.5 12,3 15.5,3.2C14.5,8.5 10.5,13.5 3.6,9.6Z" fill="#7ea84a"/><path d="M3,10L16,3" stroke="#d8eda0" stroke-width=".6" opacity=".7"/>', 20, 14);
  for (let n = 0; n < 16; n++) {
    const q = 0.04 + (n / 16) * 0.9, t = FL0 + (FL1 - FL0) * Math.pow(q, 1 / 1.5), p = pathPt(q), dark = n % 3 === 0, sz = dark ? 8 : 4 + rand() * 3, kind = n % 2 ? leafLight : 'mote';
    const dx = (rand() - 0.5) * 12, fall = 8 + rand() * 12, r = Math.round(rand() * 360);
    fx(dark ? k.pic(leafDark, p, 9, 6.3, { lit: false }) : k.pic(kind, p, sz, kind === 'mote' ? sz : sz * 0.7), [[t, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 60, { transform: `scale(1) rotate(${r / 4}deg)`, opacity: 0.95 }, 'linear'], [t + 500 + rand() * 300, { transform: `${k.T(dx, fall)} scale(.7) rotate(${r}deg)`, opacity: 0 }]]);
  }
  // a flash and a few leaves at the string as it lets go
  const flashAt = Eg(1160), g0f = Eg(1150);
  void g0f;
  fx(k.light('g-nature', E, 44), [[1130, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1175, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [1520, { transform: 'scale(1.9)', opacity: 0 }]]);
  for (let n = 0; n < 8; n++) {
    const a = rad(ANG + 180 + (rand() - 0.5) * 120), d = 8 + rand() * 18, t = 1150 + rand() * 60, dark = n % 2;
    fx(dark ? k.pic(leafDark, flashAt, 8, 5.6, { lit: false }) : k.pic(leafLight, flashAt, 8, 5.6), [[t, { transform: 'scale(.4) rotate(0deg)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(1) rotate(20deg)', opacity: 1 }, 'linear'],
      [t + 700, { transform: `${k.T(Math.cos(a) * d, Math.sin(a) * d + 8)} scale(.8) rotate(${Math.round((rand() - 0.5) * 300)}deg)`, opacity: 0 }]]);
  }

  // ── where it lands (BEATS.impact): a flash, rings, thorns and leaves bursting out, pollen rising
  const I = 1500;
  const ring = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".9"/></filter></defs><circle cx="30" cy="30" r="26" fill="none" stroke="#f0ffc8" stroke-width="3" filter="url(#b)"/>', 60, 60);
  fx(k.light('g-nature', T, 78), [[I - 70, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + 40, { transform: 'scale(1.3)', opacity: 1 }, eio], [I + 300, { transform: 'scale(1.4)', opacity: 0.6 }, eio], [2300, { transform: 'scale(1.3)', opacity: 0.35 }, eio], [2900, { transform: 'scale(1)', opacity: 0 }]]);
  [[0, 3.4, 0.9], [160, 2.4, 0.6]].forEach(([dt, sc, o]) => fx(k.pic(ring, T, 26, 26), [[I + dt, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [I + dt + 50, { transform: 'scale(.6)', opacity: o }], [I + dt + 800, { transform: `scale(${sc})`, opacity: 0 }]]));
  const thornLight = k.svg('<defs><filter id="b"><feGaussianBlur stdDeviation=".5"/></filter></defs><path d="M0,3.6L20,5L0,6.4Z" fill="#d4f57c" filter="url(#b)"/><path d="M1,4.2L18,5L1,5.8Z" fill="#fbffe0"/>', 22, 10);
  const thornDark = k.svg('<path d="M0,3L20,5L0,7Z" fill="#26361a"/><path d="M1,3.8L16,5L1,5.2Z" fill="#8fb25a" opacity=".8"/>', 22, 10);
  for (let n = 0; n < 14; n++) {
    const a = (n / 14) * Math.PI * 2 + (rand() - 0.5) * 0.4, d = 14 + rand() * 18, t = I + rand() * 70, len = 11 + rand() * 7, dark = n % 2;
    const P = (f, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f)} rotate(${Math.round((a * 180) / Math.PI)}deg) scale(${sc})`, opacity: o });
    fx(dark ? k.pic(thornDark, T, len, len * 0.45, { lit: false }) : k.pic(thornLight, T, len, len * 0.45), [[t, P(0.1, 0.4, 0), 'cubic-bezier(.1,.8,.3,1)'], [t + 90, P(0.7, 1, 1), 'ease-out'], [t + 340, P(1, 1, 0.95), 'ease-in'], [t + 700 + rand() * 300, P(1.15, 0.7, 0)]]);
  }
  for (let n = 0; n < 11; n++) {
    const a = rand() * Math.PI * 2, d = 12 + rand() * 30, t = I + 20 + rand() * 120, dark = n % 3 === 0, r = Math.round((rand() - 0.5) * 420);
    const P = (f, g, sc, o) => ({ transform: `${k.T(Math.cos(a) * d * f, Math.sin(a) * d * f * 0.8 + g)} rotate(${Math.round(r * f)}deg) scale(${sc})`, opacity: o });
    fx(dark ? k.pic(leafDark, T, 10, 7, { lit: false }) : k.pic(leafLight, T, 10, 7), [[t, P(0, 0, 0.4, 0), 'ease-out'], [t + 90, P(0.35, -2, 1, 1), 'ease-out'], [t + 600 + rand() * 300, P(1, 12 + rand() * 12, 0.9, 0.9), 'ease-in'], [t + 1300 + rand() * 400, P(1.15, 28, 0.7, 0)]]);
  }
  for (let n = 0; n < 16; n++) {
    const a = rand() * Math.PI * 2, d = 4 + rand() * 24, t = I + 80 + n * 70 + rand() * 40, sz = 3 + rand() * 3.4;
    fx(k.pic('pollen', [T[0] + Math.cos(a) * d, T[1] + Math.sin(a) * d * 0.6], sz, sz), [[t, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t + 130, { transform: `${k.T(0, -4)} scale(1)`, opacity: 0.95 }, 'linear'], [t + 900 + rand() * 400, { transform: `${k.T((rand() - 0.5) * 12, -26 - rand() * 14)} scale(.4)`, opacity: 0 }]]);
  }

  // ── alone, the arrow lands on the beast: it recoils; the eagle above wheels away from it
  const sk = (v) => v.toFixed(2);
  if (!k.aim) {
    const pose = (dx, dy, r, o) => ({ transform: `${k.T(dx, dy)} rotate(${sk(r)}deg)`, ...(o === undefined ? {} : { opacity: o }) });
    act(beast, [[0, pose(0, 0, 0), eio], [I - 30, pose(0, 0, 0), 'cubic-bezier(.1,.8,.3,1)'], [I + 70, pose(5, -3.5, -9), eio], [I + 190, pose(3, -2, -5.5), eio], [I + 330, pose(4.5, -3, -8), eio],
      [I + 560, pose(3, -1.5, -4), eio], [2200, pose(1.2, -0.6, -1.6), eio], [3200, pose(0, 0, 0)]]);
    act(eagle, [[0, pose(0, 0, 0), eio], [350, pose(0, -0.8, -0.7), eio], [750, pose(0.4, 1.0, 0.8), eio], [1100, pose(0, -0.8, -0.5), eio], [I - 20, pose(0, 0.4, 0), eio], [I + 150, pose(-5, -7, -7), eio], [I + 600, pose(-3.5, -4.5, -3.5), eio], [2300, pose(-1.4, -1.8, -1), eio], [3300, pose(0, 0, 0)]]);
    // a dark shock of light round the beast's eyes
    fx(k.light('g-nature', [212, 41], 30), [[I + 20, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [I + 110, { transform: 'scale(1.2)', opacity: 0.8 }, eio], [I + 500, { transform: 'scale(1)', opacity: 0 }]]);
  } else {
    // (the eagle just breathes: a slow beat of the wings, before and after)
    act(eagle, [[0, { transform: 'none' }, eio], [350, { transform: `${k.T(0, -0.8)} rotate(-0.7deg)` }, eio], [750, { transform: `${k.T(0.4, 1)} rotate(.8deg)` }, eio], [1150, { transform: `${k.T(0, -0.8)} rotate(-.5deg)` }, eio], [1800, { transform: `${k.T(0.4, 1)} rotate(.8deg)` }, eio], [2500, { transform: 'none' }]]);
  }
}
