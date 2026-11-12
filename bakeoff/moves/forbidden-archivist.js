// Forbidden Archivist: he looks up from his book and wards himself with the drowned vault's
// own black water.
//
// PLAN (drawing units 300 x 210, ms of the move). Role defender (he stands knee-deep, bowed
// over the book, and is the one the blows come at), element water.
//   0-600     BRACE: he looks up, the book lifts to his chest and its pages flare cyan; he
//             leans back from the threat (which comes from the right) and gathers himself;
//             the flood rings round his knees.
//   600-950   RELEASE: a ward of ink-dark water rises from the flood in front of the book,
//             its edge bright with cold light and violet, rings spreading from its foot,
//             droplets thrown up and falling back.
//   1100 on   IMPACT: blows land on the ward, each at its time on the nearest guard point
//             (k.blows; alone, three of his own: darts of cold violet light from the right):
//             the ward bulges and jolts, a cyan flash, a ring across the water, droplets
//             and ink thrown off; he and the book are knocked back with each, and the
//             book's pages flare.
//   1900-2400 HOLD: the ward ripples and sags a little; the droplets fall back.
//   2400-3100 the ward sinks back into the flood, the book lowers, he settles upright.
//   3300      at rest as drawn (END 3700).
// The ward, the blows and what they throw are on the overlay (blows may come from another card).
import { mul, rot, tr } from './_fx.js';

export const END = 3700;
export const BEATS = { release: 600, impact: 1100, settle: 3300 };
export const STILLS = [300, 750, 1000, 1130, 1500, 1950, 2700, 3500];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [190 + 60 * c, 235 + 20 * c, 255, Math.min(1, c * c * 2.4)]; }],
  ink: [16, 16, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2; return r > 1 ? [0, 0, 0, 0] : r > 0.7 ? [150, 110, 230, 0.9] : [5, 7, 13, 0.95]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const man = k.part('man'), book = k.part('book');
  const G = k.spec.guard, [wx, wy] = k.spec.ward, [fx0, fy0] = k.spec.feet, [bx, by] = [168, 106];
  k.css(`.g-ink { border-radius: 50%; background: radial-gradient(circle, rgba(240,255,255,.95), rgba(140,225,240,.6) 28%, rgba(120,110,230,.25) 56%, rgba(110,90,230,0) 72%); }
.g-page { border-radius: 50%; background: radial-gradient(circle, rgba(240,255,252,.9), rgba(160,235,240,.45) 35%, rgba(120,200,230,0) 70%); }`);
  const snap = ([x, y]) => G.reduce((b, g) => (Math.hypot(g[0] - x, g[1] - y) < Math.hypot(b[0] - x, b[1] - y) ? g : b), G[0]);

  // ── the blows: another card's (k.blows), or three of his own from the right
  const OWN = [{ at: 1100, to: G[1] }, { at: 1480, to: G[0] }, { at: 1860, to: G[2] }];
  const blows = (k.blows ? [...k.blows].sort((a, b) => a.at - b.at).slice(0, 5) : OWN).map((b, n) => ({ t: Math.max(850 + n * 20, Math.min(2300, Math.round(b.at))), at: snap(b.to), n }));

  // ── artwork
  const ward = k.svg('<defs><filter id="b" x="-30%" y="-10%" width="160%" height="120%"><feGaussianBlur stdDeviation="1.2"/></filter><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050912"/><stop offset=".7" stop-color="#0c1b30"/><stop offset="1" stop-color="#173552"/></linearGradient></defs>' +
    '<path d="M3,86C6,60 2,30 7,8C9,2 14,-1 16,4C26,16 29,40 27,60C26,72 28,80 31,86Z" fill="url(#g)" opacity=".96"/>' +
    '<path d="M16,4C26,16 29,40 27,60C26,72 28,80 31,86" fill="none" stroke="#7a62d8" stroke-width="3.4" filter="url(#b)" opacity=".8"/>' +
    '<path d="M16,4C26,16 29,40 27,60C26,72 28,80 31,86" fill="none" stroke="#a6eef6" stroke-width="1.3"/>' +
    '<path d="M7,8C9,2 14,-1 16,4" fill="none" stroke="#8fd8e8" stroke-width="1" opacity=".8"/>' +
    '<path d="M10,82C13,62 10,42 14,18M18,84C21,64 19,44 22,26" fill="none" stroke="#4d7fa8" stroke-width=".8" opacity=".6"/>', 32, 86);
  const dart = k.svg('<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#bcaaff"/><stop offset="1" stop-color="#6a52d8" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation="1.3"/></filter></defs><path d="M0,4L36,0.6L48,4L36,7.4Z" fill="#8d6ad8" filter="url(#b)" opacity=".8"/><path d="M0,4L34,1.6L46,4L34,6.4Z" fill="url(#g)"/>', 48, 8);
  const ripple = k.svg('<ellipse cx="30" cy="8" rx="28" ry="5.5" fill="none" stroke="#bfeaf2" stroke-width="1.3"/><ellipse cx="30" cy="8" rx="21" ry="3.8" fill="none" stroke="#8d6ad8" stroke-width=".8" stroke-opacity=".7"/>', 60, 16);
  const vring = k.svg('<ellipse cx="14" cy="30" rx="6" ry="26" fill="none" stroke="#dffbff" stroke-width="1.6"/><ellipse cx="14" cy="30" rx="9" ry="28" fill="none" stroke="#8d6ad8" stroke-width=".9" stroke-opacity=".7"/>', 28, 60);

  // ── he and the book: lean back with each blow (a kick that dies away), the brace, the settle
  const kicks = (t) => blows.reduce((s, b) => s + (t < b.t ? 0 : Math.exp(-(t - b.t) / 190)), 0);
  const base = (t) => {
    const f = (a, b, x) => Math.max(0, Math.min(1, (x - a) / (b - a))), sm = (x) => x * x * (3 - 2 * x);
    const into = sm(f(150, 650, t)), out = sm(f(2300, 3200, t));
    return into * (1 - out);
  };
  const feetAt = (t) => { const g = base(t), K = kicks(t); return mul(tr(-1.1 * g - 1.6 * K, 0), rot(-1.6 * g - 1.3 * K, fx0, fy0)); };
  const css = (W, P) => {
    const tx = W[4] - P[0] + W[0] * P[0] + W[2] * P[1], ty = W[5] - P[1] + W[1] * P[0] + W[3] * P[1];
    return `matrix(${W[0].toFixed(4)}, ${W[1].toFixed(4)}, ${W[2].toFixed(4)}, ${W[3].toFixed(4)}, ${(tx * u).toFixed(2)}, ${(ty * u).toFixed(2)})`;
  };
  const sample = (el, P, W, end) => {
    const ks = [];
    for (let t = 0; ; t += 40) {
      const tt = Math.min(t, end);
      ks.push([tt, { transform: tt >= end ? 'none' : css(W(tt), P) }, 'linear']);
      if (tt >= end) break;
    }
    act(el, ks);
  };
  sample(man, [fx0, fy0], feetAt, 3300);
  // the book lifts to his chest, tilting up toward him, and jolts a little more than he does
  const bookAt = (t) => {
    const g = base(t), K = kicks(t);
    return mul(feetAt(t), mul(tr(-0.4 * K, -3.2 * g + 0.6 * K), rot(-5 * g - 3 * K, bx, by)));
  };
  sample(book, [bx, by], bookAt, 3300);

  // ── light: the pages flare as he lifts the book, and with each blow
  const pg = [[0, { opacity: 0 }, 'ease-out'], [300, { opacity: 0.5 }, eio], [650, { opacity: 0.8 }, eio], [900, { opacity: 0.55 }, eio]];
  for (const b of blows) pg.push([b.t - 4, { opacity: 0.5 }, 'ease-out'], [b.t + 30, { opacity: 1 }, 'ease-out'], [b.t + 300, { opacity: 0.55 }, eio]);
  pg.sort((a, b) => a[0] - b[0]);
  const pgl = pg.filter((x, i, a) => i === 0 || x[0] > a[i - 1][0]);
  pgl.push([Math.max(2400, pgl[pgl.length - 1][0] + 60), { opacity: 0.4 }, eio], [3100, { opacity: 0 }]);
  fx(k.lightIn('g-page', [180, 103], 80, 40), pgl);
  fx(k.lightIn('g-ink', [180, 103], 50, 26), [[300, { opacity: 0 }, 'ease-out'], [650, { opacity: 0.55 }, eio], [2500, { opacity: 0.3 }, eio], [3100, { opacity: 0 }]]);

  // ── the flood rings round his knees as he braces, and as the ward rises
  for (const [t, w] of [[250, 1.1], [520, 1.3], [800, 1.8]]) {
    fx(k.picIn(ripple, [143, 172.5], 70 * w, 18 * w), [[t, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [t + 80, { transform: 'scale(.4)', opacity: 0.8 }, 'ease-out'], [t + 800, { transform: 'scale(1)', opacity: 0 }]]);
  }

  // ── the ward: rises from the flood, jolts and rings at each blow, holds, sinks
  const wk = [[0, { transform: 'scale(.5, 0)', opacity: 0 }, 'linear'], [590, { transform: 'scale(.5, 0)', opacity: 0 }, 'ease-out'], [700, { transform: 'scale(.8, .55)', opacity: 1 }, 'ease-out'], [950, { transform: 'scale(1.05, 1.07)', opacity: 1 }, eio], [1060, { transform: 'scale(1, 1)', opacity: 1 }, eio]];
  let last = 1060;
  for (const b of blows) {
    if (b.t - 8 <= last + 20) { continue; }
    wk.push([b.t - 8, { transform: 'scale(1, 1)', opacity: 1 }, 'ease-out'], [b.t + 40, { transform: 'scale(1.13, .985)', opacity: 1 }, 'ease-out'], [b.t + 190, { transform: 'scale(.95, 1.015)', opacity: 1 }, eio], [b.t + 330, { transform: 'scale(1.02, 1)', opacity: 1 }, eio]);
    last = b.t + 330;
  }
  wk.push([Math.max(2350, last + 80), { transform: 'scale(1.01, 1)', opacity: 1 }, eio], [2900, { transform: 'scale(.9, .1)', opacity: 0.8 }, 'ease-in'], [3050, { transform: 'scale(.6, 0)', opacity: 0 }]);
  fx(k.pic(ward, [wx, wy], 32, 86, { base: true }), wk);
  // rings at its foot and droplets thrown up as it rises
  fx(k.picIn(ripple, [wx, wy + 1], 70, 18), [[640, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [720, { transform: 'scale(.45)', opacity: 0.95 }, 'ease-out'], [1500, { transform: 'scale(1.1)', opacity: 0 }]]);
  fx(k.picIn(ripple, [wx, wy + 1], 70, 18), [[820, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [880, { transform: 'scale(.35)', opacity: 0.7 }, 'ease-out'], [1600, { transform: 'scale(1.3)', opacity: 0 }]]);
  for (let i = 0; i < 14; i++) {
    const t = 620 + rand() * 260, dx = (rand() - 0.5) * 30, rise = 18 + rand() * 30, sz = 2.2 + rand() * 2.6, life = 520 + rand() * 280;
    const pts = k.arc([0, 0], [dx * 0.5, -rise * 1.9], [dx, 3 + rand() * 4], 6);
    fx(k.pic(i % 3 ? 'spark' : 'ink', [wx + (rand() - 0.5) * 18, wy - 1], sz, sz), pts.map(([x, y], j) => [Math.round(t + life * j / 6), { transform: `${k.T(x, y)} scale(${(1 - 0.4 * j / 6).toFixed(2)})`, opacity: j === 6 ? 0 : 1 - 0.08 * j }, j < 3 ? 'ease-out' : 'ease-in']));
  }
  // a cold light along the ward while it stands
  fx(k.light('g-ink', [wx + 4, wy - 42], 70), [[800, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [1050, { transform: 'scale(1)', opacity: 0.32 }, eio], [2350, { transform: 'scale(1)', opacity: 0.24 }, eio], [2900, { transform: 'scale(.6)', opacity: 0 }]]);

  // ── each blow: (alone) the dart arriving; a flash at the guard, a ring on the ward, drops and ink thrown off
  for (const b of blows) {
    const [gx, gy] = b.at, t = b.t;
    if (!k.blows) {
      const S0 = [gx + 78, gy - 26 + (b.n - 1) * 5], ang = (Math.atan2(gy - S0[1], gx - S0[0]) * 180) / Math.PI - 180;
      fx(k.pic(dart, S0, 48, 8), [[t - 190, { transform: `rotate(${ang.toFixed(1)}deg) scale(.6)`, opacity: 0 }, 'ease-in'], [t - 150, { transform: `rotate(${ang.toFixed(1)}deg) scale(1)`, opacity: 1 }, 'ease-in'],
        [t - 3, { transform: `${k.T(gx - S0[0] + 14, gy - S0[1] + 4)} rotate(${ang.toFixed(1)}deg) scale(1)`, opacity: 1 }], [t + 20, { transform: `${k.T(gx - S0[0] + 20, gy - S0[1] + 6)} rotate(${ang.toFixed(1)}deg) scale(.6)`, opacity: 0 }]]);
    }
    fx(k.light('g-ink', [gx, gy], 52), [[t - 6, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 30, { transform: 'scale(1.1)', opacity: 1 }, 'ease-out'], [t + 160, { transform: 'scale(.9)', opacity: 0.55 }, eio], [t + 480, { transform: 'scale(.6)', opacity: 0 }]]);
    fx(k.light('g-warm', [gx, gy], 16), [[t - 6, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 20, { transform: 'scale(1.3)', opacity: 0.7 }, 'ease-out'], [t + 130, { transform: 'scale(.6)', opacity: 0 }]]);
    fx(k.pic(vring, [gx, gy], 28, 60), [[t, { transform: 'scale(.3, .3)', opacity: 0 }, 'ease-out'], [t + 40, { transform: 'scale(.55, .5)', opacity: 0.95 }, 'ease-out'], [t + 520, { transform: 'scale(1.5, 1.1)', opacity: 0 }]]);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI * (0.15 + rand() * 0.7) + (i % 2 ? 0.4 : -0.4), v = 14 + rand() * 24, ex = Math.cos(a) * v, ey = Math.sin(a) * v, sz = 2 + rand() * 2.4, life = 360 + rand() * 260;
      fx(k.pic(i % 3 === 2 ? 'ink' : 'spark', [gx, gy], sz, sz), [[t, { transform: 'scale(.5)', opacity: 0 }, 'ease-out'], [t + 40, { transform: `${k.T(ex * 0.35, ey * 0.35)} scale(1)`, opacity: 1 }, 'ease-out'],
        [t + life * 0.5, { transform: `${k.T(ex, ey)} scale(.9)`, opacity: 0.9 }, 'ease-in'], [t + life, { transform: `${k.T(ex * 1.15, ey + 22 + rand() * 10)} scale(.5)`, opacity: 0 }]]);
    }
  }
}
