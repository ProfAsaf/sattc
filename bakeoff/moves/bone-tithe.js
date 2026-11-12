// Bone Tithe: the hand sets the coin on the heap; the bones give up their dead; the coin's light goes out as a card.
//
// PLAN (drawing units 300 x 210, ms of the move). Role: support (Sacrifice a creature; draw a card: the boon is the
// card drawn), element: bone (the suggestion stands: violet candlelight on bone, gold coin). The skeletal hand
// faces left, holding the coin over the heap on the altar. T = k.aim, or, alone, the dark of the arch above the
// watcher (`alone`).
//   0-760     the gather: the candles swell, the watcher's eyes brighten, the hand draws the coin back and up
//             a little (anticipation), the coin warms.
//   760-1000  the hand lowers the coin to the heap and sets it down: CLINK (1000): a white-gold flash on the coin,
//             a ring, sparks; the heap jolts and shivers, the candles flare, the watcher's eyes flash.
//   1020-1250 the tithe: spirits stream out of the skulls and bones into the coin; the hand lets go and draws away
//             up and back.
//   1250      RELEASE: the coin's light tears out of it as a gold-and-violet orb, trailing sparks and puffs, up an arc
//             to T (the coin dims, spent, as it goes).
//   1800      IMPACT: the orb bursts at T: a gold-white flash, two rings, a glowing card spun open (the card drawn),
//             sparks, motes rising.
//   2200-2950 the hand comes home; the card fades; the candles settle. 2800-3300 a fresh coin forms in its fingers.
//   3600      at rest as drawn (BEATS.settle); the move ends at END.
// Contract: T = k.aim || alone; the orb's arc runs from `emit` (the coin) to T, bent to the side; everything that
// flies or lands is on the overlay.
export const END = 4000;
export const BEATS = { release: 1250, impact: 1800, settle: 3600 };
export const STILLS = [500, 900, 1010, 1150, 1400, 1800, 2300, 3700];

export const textures = {
  gspark: [24, 24, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 222 + 33 * c * c, 150 + 100 * c * c, Math.min(1, c * c * 2.4)]; }],
  // a soft puff, gold at the heart, violet at its edge
  gpuff: [40, 40, (x, y) => {
    const r = Math.hypot(x - 0.5, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.4) * (0.7 + 0.3 * Math.sin(x * 17 + y * 9) * Math.cos(y * 13 - x * 5)), h = Math.min(1, a * 1.3);
    return [200 + 55 * h, 150 + 90 * h * h, 255 - 120 * h, Math.min(1, a * 1.2)];
  }],
  spirit: [32, 48, (x, y) => {
    const r = Math.hypot((x - 0.5) * 1.6, y - 0.5) * 2, a = Math.pow(Math.max(0, 1 - r), 1.5) * (0.6 + 0.3 * Math.sin(x * 12 + y * 7) * Math.cos(y * 9 - x * 4) + 0.2 * Math.sin(x * 21 - y * 13)) * 0.95;
    return [214, 196, 255, Math.min(1, a)];
  }],
};

export function build(k) {
  const { fx, act, rand, u } = k, eio = 'ease-in-out', sm = k.smooth;
  const S = k.spec, E = S.emit, T = k.aim || S.alone, HP = S.heap, EL = S.elbow;
  const RAD = Math.PI / 180;
  const REL = 1250, IMP = 1800, CLINK = 1000;
  k.css(`.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,250,226,.98), rgba(255,220,130,.6) 28%, rgba(255,170,70,.2) 60%, rgba(255,150,40,0) 100%); }
    .g-vio { border-radius: 50%; background: radial-gradient(closest-side, rgba(246,236,255,.95), rgba(190,140,255,.55) 26%, rgba(140,90,255,.18) 58%, rgba(120,60,255,0) 100%); }`);

  // ── the hand: [ms, dx, dy, rotate deg, easing]; the coin goes with its fingers until it is set down
  const HK = [[0, 0, 0, 0, eio], [450, 6, -5, 1.2, eio], [760, 6, -5, 1.2, 'ease-in'], [CLINK, 2, 9, 0, 'ease-out'], [1040, 2, 7.8, 0, eio], [1150, 2, 8.4, 0, eio], [1450, 17, -7, 2.8, 'ease-out'], [2200, 17, -7, 2.8, eio], [2950, 0, 0, 0]];
  const hand = k.part('hand'), coin = k.part('coin'), heap = k.part('heap');
  act(hand, HK.map(([t, dx, dy, r, e]) => [t, { transform: `${k.T(dx, dy)} rotate(${r}deg)` }, e]));
  const tip = [E[0] - EL[0], E[1] - EL[1]];
  const fingers = (dx, dy, r) => { const c = Math.cos(r * RAD), s = Math.sin(r * RAD); return [dx + tip[0] * c - tip[1] * s - tip[0], dy + tip[0] * s + tip[1] * c - tip[1]]; };
  const ck = HK.filter(([t]) => t <= 1150).map(([t, dx, dy, r, e]) => { const [x, y] = t >= CLINK ? [dx, dy] : fingers(dx, dy, r); return [t, { transform: k.T(x, y), opacity: 1 }, e]; });
  // set down (1000): it rests on the heap; spent from the release, gone, and a fresh coin comes back
  ck.push([REL, { transform: k.T(2, 8.4), opacity: 1 }, 'ease-in'], [1700, { transform: k.T(2, 8.4), opacity: 0 }], [2750, { transform: k.T(0, 0), opacity: 0 }, 'ease-out'], [3250, { transform: k.T(0, 0), opacity: 1 }]);
  act(coin, ck);
  const hp = (y, r) => `${k.T(0, y)} rotate(${r}deg)`;
  act(heap, [[0, { transform: hp(0, 0) }], [CLINK, { transform: hp(0, 0) }, 'ease-out'], [1030, { transform: hp(1.8, -0.5) }, eio], [1100, { transform: hp(-0.3, 0.3) }, eio], [1180, { transform: hp(0.5, -0.2) }, eio], [1260, { transform: hp(-0.2, 0.1) }, eio], [1360, { transform: hp(0, 0) }]]);

  // ── the light of the place: candles swell, flare at the clink; the watcher's eyes
  const cand = S.candles;
  cand.forEach(([x, y], i) => {
    const fl = [[0, { transform: 'scale(.9)', opacity: 0.1 }, eio], [350 + i * 40, { transform: 'scale(1.05)', opacity: 0.5 + rand() * 0.15 }, eio], [760, { transform: 'scale(1.15)', opacity: 0.7 }, 'ease-in'], [CLINK + 10, { transform: 'scale(1.7)', opacity: 1 }, 'ease-out'], [1300, { transform: 'scale(1.3)', opacity: 0.75 }, eio]];
    for (let t = 1400 + i * 60; t < 2300; t += 150 + Math.round(rand() * 80)) fl.push([t, { transform: `scale(${(1.05 + rand() * 0.2).toFixed(2)})`, opacity: +(0.45 + rand() * 0.25).toFixed(2) }, eio]);
    fl.push([2800, { transform: 'scale(.95)', opacity: 0.1 }, eio], [3300, { transform: 'scale(.9)', opacity: 0 }]);
    fx(k.light('g-vio', [x, y], 28, 28), fl);
  });
  fx(k.light('g-vio', [S.eyes[0][0] + 4, S.eyes[0][1]], 46, 30), [[300, { transform: 'scale(.7)', opacity: 0 }, 'ease-out'], [760, { transform: 'scale(1)', opacity: 0.55 }, eio], [CLINK, { transform: 'scale(1.2)', opacity: 0.85 }, 'ease-out'], [1250, { transform: 'scale(1.5)', opacity: 1 }, eio], [1800, { transform: 'scale(1.3)', opacity: 0.8 }, eio], [2600, { transform: 'scale(.9)', opacity: 0.2 }, eio], [3200, { transform: 'scale(.7)', opacity: 0 }]]);
  for (const [x, y] of S.eyes) fx(k.light('g-vio', [x, y], 9, 7), [[500, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [CLINK, { transform: 'scale(1.2)', opacity: 0.9 }, 'ease-out'], [1260, { transform: 'scale(1.8)', opacity: 1 }, eio], [1900, { transform: 'scale(1.4)', opacity: 0.7 }, eio], [2900, { transform: 'scale(.8)', opacity: 0 }]]);

  // ── the coin warms as it is drawn up; the heap's skulls glow
  fx(k.light('g-gold', E, 34, 34), [[200, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [450, { transform: `${k.T(6, -5)} scale(.95)`, opacity: 0.6 }, eio], [760, { transform: `${k.T(5, -6)} scale(1.1)`, opacity: 0.8 }, 'ease-in'], [CLINK, { transform: `${k.T(2, 9)} scale(1.1)`, opacity: 0.8 }, 'ease-out'], [1250, { transform: `${k.T(2, 8.4)} scale(1.35)`, opacity: 1 }, eio], [1500, { transform: `${k.T(2, 8.4)} scale(.9)`, opacity: 0.4 }, 'ease-out'], [1750, { transform: `${k.T(2, 8.4)} scale(.5)`, opacity: 0 }]]);
  const skulls = [[110, 141], [191, 141], [131, 129], [171, 127]];
  skulls.forEach(([x, y], i) => fx(k.light('g-vio', [x, y], 16, 14), [[CLINK + i * 40, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [CLINK + 110 + i * 40, { transform: 'scale(1.2)', opacity: 0.95 }, eio], [1500, { transform: 'scale(1)', opacity: 0.6 }, eio], [1950, { transform: 'scale(.7)', opacity: 0 }]]));
  // the glow on the heap's top where the coin lies
  fx(k.light('g-gold', [HP[0], HP[1]], 60, 26), [[CLINK, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [CLINK + 80, { transform: 'scale(1)', opacity: 0.8 }, 'ease-out'], [1250, { transform: 'scale(1.1)', opacity: 0.55 }, eio], [1750, { transform: 'scale(.9)', opacity: 0 }]]);

  // ── the clink
  fx(k.light('g-gold', [HP[0], HP[1] - 1], 44, 44), [[CLINK - 8, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [CLINK + 14, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [CLINK + 160, { transform: 'scale(1.5)', opacity: 0.6 }, 'ease-out'], [CLINK + 420, { transform: 'scale(1.8)', opacity: 0 }]]);
  const ringG = k.svg('<circle cx="30" cy="30" r="27" fill="none" stroke="#ffe9b0" stroke-width="1.8"/><circle cx="30" cy="30" r="22" fill="none" stroke="#c89aff" stroke-width="1" stroke-opacity=".7"/>', 60, 60);
  fx(k.pic(ringG, [HP[0], HP[1]], 36, 36), [[CLINK, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [CLINK + 30, { transform: 'scale(.3)', opacity: 1 }, 'ease-out'], [CLINK + 520, { transform: 'scale(1.5)', opacity: 0 }]]);
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI * (0.1 + 0.8 * rand()), r = 10 + rand() * 20, ex = Math.cos(a) * r, ey = Math.sin(a) * r, sz = 2.2 + rand() * 2.4, t0 = CLINK + Math.round(rand() * 30), life = 380 + rand() * 260;
    const pts = k.arc([0, 0], [ex * 0.6, ey - 5 - rand() * 6], [ex + 1, ey + 10 + rand() * 8], 5);
    fx(k.pic('gspark', [HP[0], HP[1] - 2], sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.5 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }

  // ── the tithe: spirits stream out of the bones into the coin
  const sources = [[110, 141], [191, 141], [131, 129], [171, 127], [92, 141], [214, 139], [118, 125], [186, 126]];
  sources.forEach(([x, y], i) => {
    const t0 = CLINK + 20 + i * 28, dur = 340 + rand() * 80, side = x < HP[0] ? -1 : 1;
    const pts = k.arc([x, y], [x + (HP[0] - x) * 0.4, Math.min(y, HP[1]) - 22 - rand() * 10], [HP[0] + side * 2, HP[1] - 4], 7, (t) => t * t * (3 - 2 * t));
    fx(k.pic('spirit', [x, y], 11, 16), pts.map(([px, py], j) => [Math.round(t0 + dur * j / 7), { transform: `${k.T(px - x, py - y)} scale(${(0.5 + 0.7 * Math.sin(Math.PI * Math.min(1, j / 7)) + 0.1).toFixed(2)})`, opacity: j === 0 ? 0 : j === 7 ? 0 : 0.85 }, 'linear']));
  });

  // ── RELEASE: the orb tears out of the coin and goes to T along an arc, trailing light
  const mid = [(E[0] + T[0]) / 2, (E[1] + T[1]) / 2], dx = T[0] - E[0], dy = T[1] - E[1], len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len, ny = dx / len; if (ny > 0) { nx = -nx; ny = -ny; }           // bend upward
  const bend = Math.min(40, 14 + len * 0.12), CTRL = [mid[0] + nx * bend, mid[1] + ny * bend];
  const FLY = IMP - REL, pace = (t) => Math.pow(t, 1.45);
  const at = (w) => { const q = 1 - w; return [q * q * E[0] + 2 * q * w * CTRL[0] + w * w * T[0], q * q * E[1] + 2 * q * w * CTRL[1] + w * w * T[1]]; };
  const orbK = [];
  // positions are relative to the orb's own start, E
  const rel = (p) => k.T(p[0] - E[0], p[1] - E[1]);
  orbK.push([REL - 140, { transform: `${rel([HP[0], HP[1] - 4])} scale(.4)`, opacity: 0 }, 'ease-out'], [REL - 20, { transform: `${rel([HP[0], HP[1] - 5])} scale(1)`, opacity: 1 }, 'ease-in']);
  for (let j = 1; j <= 12; j++) { const w = pace(j / 12); orbK.push([Math.round(REL + FLY * j / 12), { transform: `${rel(at(w))} scale(${(1 - 0.3 * j / 12).toFixed(2)})`, opacity: 1 }, 'linear']); }
  orbK.push([IMP + 80, { transform: `${rel(T)} scale(.4)`, opacity: 0 }]);
  fx(k.light('g-gold', E, 26, 26), orbK);
  fx(k.light('g-vio', E, 44, 44), orbK.map(([t, f, e]) => [t, { ...f, transform: f.transform.replace(/scale\(([\d.]+)\)/, (m, s) => `scale(${(s * 1.3).toFixed(2)})`), opacity: f.opacity * 0.7 }, e]));
  // its trail: puffs and sparks left behind along the arc
  for (let i = 0; i < 26; i++) {
    const f = (i + rand() * 0.6) / 26, t = Math.round(REL + FLY * f), w = pace(f), p = at(w), tx = (rand() - 0.5) * 7, ty = (rand() - 0.5) * 7;
    const spark = i % 3 === 0, tex = spark ? 'gspark' : (i % 2 ? 'gpuff' : 'spirit'), sz = spark ? 3 + rand() * 2.5 : 10 + rand() * 8;
    const dir = [dx / len, dy / len];
    fx(k.pic(tex, p, sz, tex === 'spirit' ? sz * 1.5 : sz), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 70, { transform: `${k.T(tx * 0.3 - dir[0] * 2, ty * 0.3 - dir[1] * 2)} scale(1)`, opacity: spark ? 0.95 : 0.7 }, 'ease-out'],
      [t + 520, { transform: `${k.T(tx - dir[0] * 8, ty - dir[1] * 8 + 5)} scale(${spark ? 0.4 : 1.5})`, opacity: 0 }]]);
  }

  // ── IMPACT: the card is drawn
  const R = IMP;
  fx(k.light('g-gold', T, 70, 70), [[R - 6, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [R + 16, { transform: 'scale(1)', opacity: 1 }, 'ease-out'], [R + 180, { transform: 'scale(1.4)', opacity: 0.8 }, 'ease-out'], [R + 800, { transform: 'scale(1.9)', opacity: 0.25 }, 'ease-out'], [R + 1400, { transform: 'scale(2.2)', opacity: 0 }]]);
  fx(k.light('g-vio', T, 110, 80), [[R, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [R + 120, { transform: 'scale(1)', opacity: 0.7 }, 'ease-out'], [R + 900, { transform: 'scale(1.2)', opacity: 0.35 }, eio], [R + 1500, { transform: 'scale(1.3)', opacity: 0 }]]);
  for (const [t, big] of [[R, 1.2], [R + 140, 1.8]]) fx(k.pic(ringG, T, 60, 60), [[t, { transform: 'scale(.1)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.25)', opacity: 1 }, 'ease-out'], [t + 600, { transform: `scale(${big})`, opacity: 0 }]]);
  // the card: a pale card of light spun open and held, then let go upward
  const card = k.svg('<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff7da"/><stop offset="1" stop-color="#d2b4ff"/></linearGradient></defs><rect x="1.5" y="1.5" width="21" height="31" rx="2.6" fill="#241638" fill-opacity=".72" stroke="url(#c)" stroke-width="1.5"/><rect x="5" y="5" width="14" height="14" rx="1.6" fill="none" stroke="#ffe3a0" stroke-width=".9" stroke-opacity=".8"/><circle cx="12" cy="12" r="3.2" fill="#ffe9b0"/><path d="M6,25h12M6,28h8" stroke="#d9c4ff" stroke-width="1" stroke-linecap="round" stroke-opacity=".8"/>', 24, 34);
  fx(k.pic(card, T, 13, 18.4, { lit: false }), [[R + 20, { transform: 'scale(.15, .3) rotate(-30deg)', opacity: 0 }, 'ease-out'], [R + 190, { transform: `scale(1.15, 1.1) rotate(8deg)`, opacity: 1 }, eio], [R + 330, { transform: 'scale(1, 1) rotate(-3deg)', opacity: 1 }, eio], [R + 900, { transform: `${k.T(0, -3)} scale(1.05, 1.05) rotate(2deg)`, opacity: 1 }, 'ease-in'], [R + 1300, { transform: `${k.T(0, -9)} scale(1.2) rotate(0deg)`, opacity: 0 }]]);
  fx(k.light('g-gold', T, 24, 30), [[R + 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [R + 220, { transform: 'scale(1)', opacity: 0.9 }, eio], [R + 1000, { transform: 'scale(1.1)', opacity: 0.6 }, eio], [R + 1400, { transform: 'scale(1.3)', opacity: 0 }]]);
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2, r = 12 + rand() * 30, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9, sz = 2.2 + rand() * 3, t0 = R + Math.round(rand() * 70), life = 480 + rand() * 400;
    const pts = k.arc([0, 0], [ex * 0.6, ey - 6 - rand() * 8], [ex + 2, ey + 8 + rand() * 12], 5);
    fx(k.pic('gspark', T, sz, sz), pts.map(([x, y], j) => [Math.round(t0 + life * j / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.55 * j / 5).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
  }
  for (let i = 0; i < 8; i++) {
    const t = R + 80 + i * 90 + rand() * 40, x = T[0] + (rand() - 0.5) * 30, up = 18 + rand() * 30, sway = (rand() - 0.5) * 12, sz = 11 + rand() * 6;
    fx(k.pic('gpuff', [x, T[1] + 4], sz, sz), [[Math.round(t), { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [Math.round(t + 160), { transform: `${k.T(sway * 0.3, -up * 0.3)} scale(.9)`, opacity: 0.7 }, 'ease-out'], [Math.round(t + 900), { transform: `${k.T(sway, -up)} scale(1.4)`, opacity: 0 }]]);
  }

  // ── a fresh coin forms in the fingers (2800-3300)
  fx(k.light('g-gold', E, 34, 34), [[2750, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [3150, { transform: 'scale(1.2)', opacity: 0.85 }, eio], [3650, { transform: 'scale(.9)', opacity: 0 }]]);
  for (let i = 0; i < 8; i++) {
    const a = rand() * Math.PI * 2, r = 14 + rand() * 14, t0 = 2750 + Math.round(rand() * 350), sz = 2 + rand() * 2;
    fx(k.pic('gspark', E, sz, sz), [[t0, { transform: `${k.T(Math.cos(a) * r, Math.sin(a) * r * 0.8)} scale(.6)`, opacity: 0 }, 'ease-out'], [t0 + 130, { transform: `${k.T(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.5)} scale(1)`, opacity: 0.9 }, 'ease-in'], [t0 + 420, { transform: 'scale(.4)', opacity: 0 }]]);
  }
}
