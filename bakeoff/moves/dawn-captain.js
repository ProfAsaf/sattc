// Dawn Captain: she and her two soldiers of light stand against a volley.
//
// PLAN (drawing units 300 x 210, ms of the move). A defender (element: spirit, which
// here is gold-white light).
//   100-700   the brace (BEATS.release 700). The two spirit soldiers rise on their toes,
//             lean in toward her, and a thread of light runs from each one's heart to her
//             chest; the spear tips glint. Her cloak is drawn in (a flick the wrong way)
//             and then flung out wide on her shield side. A ward of light gathers about her.
//   at each blow (the first is BEATS.impact 1250; k.blows, else three of its own from
//             the right: cloak, right soldier, cloak's hem): a dark shaft streaks in from
//             the blow's side (up and away) to the nearest guard point; there it breaks
//             on a bright arc of ward-light: a flash, a ring, gold sparks thrown back,
//             dark chips, a few motes of spirit rising. The part that took it jolts
//             away from the blow and rings back; the others flinch a little a beat later;
//             the soldier's heart and the ward flare.
//   2300-3300 she holds, then the threads and the ward fade; the soldiers sink back down
//             and the cloak settles, with a puff of motes rising from the soldiers.
//   3500      (BEATS.settle) at rest as drawn.
import { curve } from './_fx.js';

export const END = 4000;
export const BEATS = { release: 700, impact: 1250, settle: 3500 };
export const STILLS = [300, 700, 1230, 1330, 1700, 2100, 2900, 3800];

export const textures = {
  spark: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 224 + 30 * c * c, 150 + 100 * c * c, Math.min(1, c * c * 2.4)]; }],
  mote: [32, 32, (x, y) => { const r = Math.hypot(x - 0.5, y - 0.5) * 2, c = Math.max(0, 1 - r); return [255, 246, 220, Math.min(1, c * c * c * 2.2)]; }],
};

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const cloak = k.part('cloak'), sL = k.part('spiritL'), sR = k.part('spiritR');
  const G = k.spec.guard, [HX, HY] = k.spec.hit, SH = k.spec.shoulder;
  const snap = ([x, y]) => { let b = 0; G.forEach((g, i) => { if (Math.hypot(g[0] - x, g[1] - y) < Math.hypot(G[b][0] - x, G[b][1] - y)) b = i; }); return b; };

  // ── the blows: from another card (k.blows) or its own volley from the right
  const own = [{ at: 1250, to: G[0] }, { at: 1650, to: G[2] }, { at: 2050, to: G[1] }];
  const VOL = (k.blows ? [...k.blows].sort((a, b) => a.at - b.at).slice(0, 4) : own)
    .map((b) => ({ t: Math.max(760, Math.min(2500, Math.round(b.at))), gi: snap(b.to) }))
    .filter((v, i, a) => i === 0 || v.t >= a[i - 1].t + 120)
    .map((v, i, a) => {
      const g = G[v.gi], dir = g[0] >= HX ? 1 : -1;
      return { ...v, g, dir, s: i === a.length - 1 && a.length > 1 ? 1.3 : 1, O: [g[0] + dir * (96 + 12 * i), g[1] - 42 - 9 * i] };
    });

  k.css('.g-gold { border-radius: 50%; background: radial-gradient(closest-side, rgba(255,247,222,.95), rgba(255,222,150,.5) 26%, rgba(255,196,100,.15) 56%, rgba(255,180,80,0) 100%); }');
  const shaft = k.svg('<defs><linearGradient id="t" x1="0" x2="1"><stop offset="0" stop-color="#2a2030" stop-opacity="0"/><stop offset=".6" stop-color="#2a2030" stop-opacity=".95"/><stop offset="1" stop-color="#150f1c"/></linearGradient></defs><path d="M0,4 L30,0.5 L38,4 L30,7.5Z" fill="url(#t)"/><path d="M30,0.5 L38,4 L30,7.5" fill="none" stroke="#ffd9a0" stroke-width="1.1" stroke-linejoin="round"/>', 38, 8);
  const arc = k.svg('<defs><filter id="b" x="-50%" y="-20%" width="200%" height="140%"><feGaussianBlur stdDeviation="2"/></filter></defs><path d="M14,3 Q46,30 14,57" fill="none" stroke="#ffcf7a" stroke-width="6" stroke-linecap="round" filter="url(#b)"/><path d="M14,3 Q46,30 14,57" fill="none" stroke="#fffbe8" stroke-width="2" stroke-linecap="round"/>', 60, 60);
  const ring = k.svg('<defs><filter id="b" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs><circle cx="50" cy="50" r="38" fill="none" stroke="#ffe4a8" stroke-width="5" filter="url(#b)"/><circle cx="50" cy="50" r="38" fill="none" stroke="#fffbe8" stroke-width="1.4"/>', 100, 100);
  const thread = k.svg('<defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0"/><stop offset=".25" stop-color="#fff6d8" stop-opacity=".85"/><stop offset=".75" stop-color="#ffe3a0" stop-opacity=".85"/><stop offset="1" stop-color="#ffe3a0" stop-opacity="0"/></linearGradient><filter id="b"><feGaussianBlur stdDeviation=".7"/></filter></defs><rect x="0" y="1.2" width="100" height="1.6" rx=".8" fill="url(#g)" filter="url(#b)"/>', 100, 4);
  const chip = k.svg('<path d="M0,2 L6,0 L8,2.4 L1,3.6Z" fill="#1c1424"/>', 8, 4);

  // ── a part's pose over time: base stops plus an impulse at each blow (a damped ring)
  // stops are [ms, value, ease]; the pose is dx, dy (units), rotation (deg), scale x, scale y
  const ringing = (d) => (d < 0 ? 0 : Math.exp(-d / 210) * Math.cos(d / 52) * (1 - Math.exp(-d / 10)));
  const track = (part, base, jolts) => {
    const ts = new Set([0, END]);
    for (let t = 0; t <= END; t += 50) ts.add(t);
    for (const j of jolts) for (const d of [0, 18, 40, 70, 105, 150, 205, 270, 350, 450, 600]) if (j.t + d < END) ts.add(j.t + d);
    const f = ([x, y, r, sx, sy]) => ({ transform: `${k.T(x, y)} rotate(${r.toFixed(2)}deg) scale(${sx.toFixed(3)}, ${sy.toFixed(3)})` });
    const list = [...ts].sort((a, b) => a - b).map((t) => {
      let [x, y, r, sx, sy] = base.map((c) => c(t));
      for (const j of jolts) { const q = ringing(t - j.t); x += j.dx * q; y += j.dy * q; r += j.r * q; sx += j.sx * q; sy += j.sy * q; }
      return [t, t === 0 || t === END ? { transform: 'none' } : f([x, y, r, sx, sy]), 'linear'];
    });
    act(part, list);
  };
  const one = () => curve([[0, 1]]), zero = () => curve([[0, 0]]);

  // ── jolts: the struck part rings away from the blow; the others flinch a beat later
  const jc = [], jl = [], jr = [];
  for (const v of VOL) {
    const w = v.s;
    if (v.gi === 0 || v.gi === 1) jc.push({ t: v.t, dx: 0, dy: 0, r: 9 * w, sx: 0, sy: 0 });
    else jc.push({ t: v.t + 60, dx: 0, dy: 0, r: 2.2 * w, sx: 0, sy: 0 });
    // the soldiers' flinch: pushed away from the blow if it's on them, else a small start
    const hitL = v.gi === 3, hitR = v.gi === 2;
    jl.push({ t: v.t + (hitL ? 0 : 70), dx: -v.dir * (hitL ? 3.2 : 0.7) * w, dy: hitL ? 0.8 : 0.2, r: -v.dir * (hitL ? 5 : 1.2) * w, sx: 0, sy: hitL ? -0.03 : 0 });
    jr.push({ t: v.t + (hitR ? 0 : 70), dx: -v.dir * (hitR ? 3.2 : 0.7) * w, dy: hitR ? 0.8 : 0.2, r: -v.dir * (hitR ? 5 : 1.2) * w, sx: 0, sy: hitR ? -0.03 : 0 });
  }
  // the cloak: drawn in (+5), flung out wide (-11), holds, then settles with a little overshoot
  track(cloak, [zero(), zero(), curve([[0, 0], [260, 5], [700, -11, 'out'], [2400, -9], [3000, 1.5], [3300, -0.6], [3500, 0]]), curve([[0, 1], [700, 1.03], [2400, 1.02], [3300, 1]]), one()], jc);
  // the soldiers: rise on their toes and lean in toward her, then sink back
  const lean = (d) => curve([[0, 0], [100, 0, 'out'], [700, d, 'ease'], [2500, d], [3200, -d * 0.2], [3500, 0]]);
  const lift = curve([[0, 0], [100, 0], [700, -1.6, 'out'], [2500, -1.6], [3200, 0.4], [3500, 0]]);
  track(sL, [curve([[0, 0], [700, 0.8], [2500, 0.8], [3500, 0]]), lift, lean(2.4), one(), curve([[0, 1], [100, 1], [700, 1.03], [2500, 1.03], [3200, 0.995], [3500, 1]])], jl);
  track(sR, [curve([[0, 0], [700, -0.8], [2500, -0.8], [3500, 0]]), lift, lean(-2.4), one(), curve([[0, 1], [100, 1], [700, 1.03], [2500, 1.03], [3200, 0.995], [3500, 1]])], jr);

  // ── the ward: light about her, gathering from 250, pulsing at each blow, fading from 2500
  const wardPts = [[0, 0], [250, 0], [900, 0.5], [2500, 0.4], [3300, 0]];
  const pulse = (stops, amp, dur = 420) => (t) => {
    let o = curve(stops)(t);
    for (const v of VOL) { const d = t - v.t; if (d >= 0 && d < dur) o = Math.max(o, amp * Math.pow(1 - d / dur, 1.6)); }
    return o;
  };
  const wardAt = pulse(wardPts, 0.95);
  const sample = (ts, fn) => [...new Set([...ts, ...VOL.flatMap((v) => [v.t - 1, v.t, v.t + 40, v.t + 120, v.t + 240, v.t + 420])])].filter((t) => t >= 0 && t <= END).sort((a, b) => a - b).map((t) => [t, fn(t)]);
  const wardL = k.lightIn('g-gold', [150, 110], 150, 150);
  fx(wardL, sample([0, 250, 500, 900, 1500, 2500, 2900, 3300, END], (t) => ({ transform: `scale(${(0.7 + 0.45 * Math.min(1, t / 900) + 0.18 * (wardAt(t) - 0.4)).toFixed(3)})`, opacity: +wardAt(t).toFixed(3) })));
  // the soldiers' hearts, bright while they lend her strength
  const heartAt = (side) => pulse([[0, 0], [100, 0], [700, 0.6], [2500, 0.45], [3300, 0]], 0.95, 380);
  for (const [x, side] of [[84, 3], [216, 2]]) {
    const o = (t) => { let v = heartAt()(t); for (const w of VOL) if (w.gi === side) { const d = t - w.t; if (d >= 0 && d < 520) v = Math.max(v, Math.pow(1 - d / 520, 1.5)); } return v; };
    fx(k.lightIn('g-gold', [x, 140], 56, 56), sample([0, 100, 400, 700, 2500, 3300, END], (t) => ({ transform: `scale(${(0.6 + 0.5 * Math.min(1, t / 700)).toFixed(3)})`, opacity: +o(t).toFixed(3) })));
  }
  // threads of light from each heart to her chest; they grow out from the soldier
  for (const [x, dirx] of [[84, 1], [216, -1]]) {
    const A = [x + dirx * 6, 138], B = [HX - dirx * 7, HY + 2], L = Math.hypot(B[0] - A[0], B[1] - A[1]), a = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
    const at = (f, o) => ({ transform: `${k.T(A[0] + ((B[0] - A[0]) * f) / 2 - (A[0] + B[0]) / 2, A[1] + ((B[1] - A[1]) * f) / 2 - (A[1] + B[1]) / 2)} rotate(${a.toFixed(1)}deg) scale(${Math.max(0.02, f).toFixed(3)}, 1)`, opacity: o });
    const th = [[150, at(0, 0), 'ease-out'], [700, at(1, 0.8), eio]];
    for (const v of VOL) th.push([v.t, at(1, 0.8), 'ease-out'], [v.t + 70, at(1, 1), eio], [v.t + 300, at(1, 0.7), eio]);
    th.push([2500, at(1, 0.7), eio], [3000, at(1, 0.2), 'ease-in'], [3300, at(0.7, 0)]);
    fx(k.pic(thread, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], L, 4), th.filter((x, i, ar) => i === 0 || x[0] > ar[i - 1][0]));
  }
  // the spear tips glint as the soldiers rise
  for (const [x, y] of k.spec.spearTips) {
    fx(k.pic('spark', [x, y], 12, 12), [[420, { transform: 'scale(.2)', opacity: 0 }, 'ease-out'], [640, { transform: 'scale(1.3)', opacity: 1 }, 'ease-out'], [900, { transform: 'scale(.7)', opacity: 0.5 }], [1100, { transform: 'scale(.9)', opacity: 0.2 }], [3000, { transform: 'scale(.9)', opacity: 0.2 }], [3300, { transform: 'scale(.3)', opacity: 0 }]]);
  }
  // her light flares at her chest as she flings the cloak out
  fx(k.light('g-gold', [HX, HY], 46), [[540, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [720, { transform: 'scale(1.2)', opacity: 0.8 }, 'ease-out'], [1000, { transform: 'scale(1)', opacity: 0.2 }, eio], [3000, { transform: 'scale(.9)', opacity: 0.15 }], [3400, { transform: 'scale(.5)', opacity: 0 }]]);

  // ── at each blow
  VOL.forEach((v) => {
    const [gx, gy] = v.g, t = v.t, s = v.s, O = v.O;
    const toA = Math.atan2(O[1] - gy, O[0] - gx), toD = (toA * 180) / Math.PI;
    // the shaft: three copies, each a step behind, streaking in to the guard point
    const Ce = [gx + Math.cos(toA) * 15, gy + Math.sin(toA) * 15], ang = toD + 180;
    [[0, 1, 38], [34, 0.5, 30], [70, 0.28, 24]].forEach(([lag, o, len]) => {
      const ts = t - 250 + lag * 0.5, te = t + lag * 0.4;
      fx(k.pic(shaft, [gx, gy], len, len * 0.21), [[ts, { transform: `${k.T(O[0] - gx, O[1] - gy)} rotate(${ang.toFixed(1)}deg)`, opacity: 0 }, 'ease-in'], [ts + 40, { transform: `${k.T(O[0] - gx, O[1] - gy)} rotate(${ang.toFixed(1)}deg)`, opacity: o }, 'ease-in'],
        [te, { transform: `${k.T(Ce[0] - gx, Ce[1] - gy)} rotate(${ang.toFixed(1)}deg)`, opacity: o }, 'linear'], [te + 36, { transform: `${k.T(Ce[0] - gx + Math.cos(toA) * 2, Ce[1] - gy + Math.sin(toA) * 2)} rotate(${ang.toFixed(1)}deg) scale(.4, 1)`, opacity: 0 }]]);
    });
    // the arc of ward-light the shaft breaks on (bulging toward it), a flash and a ring
    const ax = gx + Math.cos(toA) * 4, ay = gy + Math.sin(toA) * 4;
    fx(k.pic(arc, [ax, ay], 30 * s, 30 * s), [[t - 1, { transform: `rotate(${toD.toFixed(1)}deg) scale(.4)`, opacity: 0 }, 'ease-out'], [t + 30, { transform: `rotate(${toD.toFixed(1)}deg) scale(1.1)`, opacity: 1 }, 'ease-out'], [t + 130, { transform: `rotate(${toD.toFixed(1)}deg) scale(1.2)`, opacity: 0.7 }], [t + 400, { transform: `rotate(${toD.toFixed(1)}deg) scale(1.5)`, opacity: 0 }]]);
    fx(k.light('g-gold', [gx, gy], 46 * s), [[t - 1, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 14, { transform: 'scale(1.15)', opacity: 1 }, 'ease-out'], [t + 100, { transform: 'scale(1.4)', opacity: 0.7 }], [t + 380, { transform: 'scale(1.9)', opacity: 0 }]]);
    fx(k.light('g-gold', [gx, gy], 14 * s), [[t - 1, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [t + 12, { transform: 'scale(1.6)', opacity: 1 }], [t + 120, { transform: 'scale(2.6)', opacity: 0 }]]);
    fx(k.pic(ring, [gx, gy], 54 * s, 54 * s), [[t, { transform: 'scale(.15)', opacity: 0 }, 'ease-out'], [t + 50, { transform: 'scale(.4)', opacity: 0.9 }, 'ease-out'], [t + 460, { transform: 'scale(1.05)', opacity: 0 }]]);
    // sparks thrown back toward where the shaft came from
    for (let n = 0; n < 11; n++) {
      const a = toA + (rand() - 0.5) * 2.3, r = (11 + rand() * 24) * s, ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.9, sz = 2.4 + rand() * 3, t0 = t + rand() * 40, life = 300 + rand() * 300;
      const pts = k.arc([0, 0], [ex * 0.6, ey * 0.6 - 5 - rand() * 5], [ex * 1.1, ey + 8 + rand() * 8], 5);
      fx(k.pic('spark', [gx, gy], sz, sz), pts.map(([x, y], j) => [Math.round(t0 + (life * j) / 5), { transform: `${k.T(x, y)} scale(${(1 - 0.6 * (j / 5)).toFixed(2)})`, opacity: j === 5 ? 0 : 1 - 0.1 * j }, j < 2 ? 'ease-out' : 'linear']));
    }
    // the shaft's dark chips, flung out and spinning
    for (let n = 0; n < 5; n++) {
      const a = toA + (rand() - 0.5) * 2.6, r = (10 + rand() * 20) * s, ex = Math.cos(a) * r, ey = Math.sin(a) * r, sz = 5 + rand() * 4, t0 = t + 8 + rand() * 30, life = 380 + rand() * 260, spin = (rand() - 0.5) * 600;
      const pts = k.arc([0, 0], [ex * 0.55, ey * 0.55 - 9], [ex * 1.05, ey + 12 + rand() * 8], 5);
      fx(k.pic(chip, [gx, gy], sz, sz * 0.5, { lit: false }), pts.map(([x, y], j) => [Math.round(t0 + (life * j) / 5), { transform: `${k.T(x, y)} rotate(${(spin * j / 5).toFixed(0)}deg)`, opacity: j === 5 ? 0 : 1 }, j < 2 ? 'ease-out' : 'linear']));
    }
    // motes of spirit lifted off the guard, rising slowly
    for (let n = 0; n < 4; n++) {
      const dx = (rand() - 0.5) * 18, rise = 18 + rand() * 20, sz = 3 + rand() * 3, t0 = t + 60 + rand() * 140, life = 800 + rand() * 500;
      fx(k.pic('mote', [gx + (rand() - 0.5) * 8, gy], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 160, { transform: `${k.T(dx * 0.2, -rise * 0.25)} scale(1)`, opacity: 0.95 }, 'ease-out'], [t0 + life, { transform: `${k.T(dx, -rise)} scale(.6)`, opacity: 0 }]]);
    }
  });

  // ── when it's over: motes of light rise off the soldiers as they sink back
  for (const x of [84, 216]) for (let n = 0; n < 6; n++) {
    const px = x + (rand() - 0.5) * 18, py = 110 + rand() * 60, dx = (rand() - 0.5) * 12, rise = 22 + rand() * 26, sz = 2.6 + rand() * 3, t0 = 2650 + rand() * 500, life = 900 + rand() * 500;
    fx(k.pic('mote', [px, py], sz, sz), [[t0, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [t0 + 220, { transform: `${k.T(dx * 0.2, -rise * 0.25)} scale(1)`, opacity: 0.9 }, 'ease-out'], [Math.min(END, t0 + life), { transform: `${k.T(dx, -rise)} scale(.6)`, opacity: 0 }]]);
  }
}
