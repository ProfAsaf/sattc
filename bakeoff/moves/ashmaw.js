// A worked example (bakeoff/recipe.md): Ashmaw, one of Home's three living
// cards, given its move with the harness kit. It swings its head round to
// the right, breathing a cone of fire down onto the burning city: billows
// burst on the roofs, flames catch and smoke goes up, scorches spread where
// the fire lands. It turns its head to its target and rears, fire gathering
// in its jaws, and breathes a stream of fire at it: billows along an arc,
// bursting where they land, flames catching, smoke rolling up. Then it turns
// its head back; its drawn breath returns and the scorches heal.
// (Home's whole scene, with the other two cards, is js/home-alive.js.)
//
// The interaction contract (bakeoff/recipe.md): its target is k.aim when
// another card is there, else its own (the far side of the city); the head
// turns toward whichever, left or right, and every point of the stream is
// worked out from its jaws and the target. BEATS: when the stream leaves,
// when it lands, and when Ashmaw is at rest again.
//
// Everything is in the drawing's units (300 x 210) and ms of the move;
// keyframe translations are px, so they're drawing units times k.u.
export const END = 4200;
export const BEATS = { release: 1320, impact: 1620, settle: 3480 };
export const STILLS = [150, 450, 900, 1200, 1500, 1800, 2600, 3800];

export function build(k) {
  const { fx, act, u, rand } = k, eio = 'ease-in-out';
  const head = k.part('head'), breath = k.part('breath');
  const [nx, ny] = k.spec.neck, [mx, my] = k.spec.mouth, ground = 150; // (anchor points from js/art/puppets.js)
  const BACK = 3480; // (its head is round again: the scorches heal from here)
  // the mouth's x as the head swings round (0-900 ms): it narrows to a sliver at 450 and widens, mirrored
  const mouthX = (ms) => {
    const s = ms < 450 ? 1 - 0.94 * k.smooth(ms / 450) : 0.06 - 1.06 * k.smooth(Math.min(1, (ms - 450) / 450));
    return nx + (mx - nx) * s;
  };
  const mx0 = mouthX(0);
  // ── where its fire goes: at another card (k.aim), or, alone, down on the city's far side
  const T = k.aim || [262, 146];
  // the head turned toward a point (about the neck, at most 50 degrees off its rest line;
  // mirrored when the point is to the right): its transform, and where its mouth is then
  const aimHead = ([tx, ty]) => {
    const right = tx >= nx, bx = right ? nx - mx : mx - nx, by = my - ny;
    let d = ((Math.atan2(ty - ny, tx - nx) - Math.atan2(by, bx)) * 180) / Math.PI;
    d = Math.max(-50, Math.min(50, ((d + 540) % 360) - 180));
    const r = (d * Math.PI) / 180;
    return { right, tf: right ? `scaleX(-1) rotate(${(-d).toFixed(1)}deg)` : `rotate(${d.toFixed(1)}deg)`, mouth: [nx + bx * Math.cos(r) - by * Math.sin(r), ny + bx * Math.sin(r) + by * Math.cos(r)] };
  };
  const A = aimHead(T), M = A.mouth;

  // ── the head: round to the right (a sliver at 450) over the city; turned to its target by 1150
  //    (back round through a sliver if that's to the left), held while it breathes, home by BACK
  const sliver = { transform: 'scale(.06, 1.03)' };
  act(head, [[0, { transform: 'none' }, eio], [450, sliver, eio], [900, { transform: 'scaleX(-1)' }, eio],
    ...(A.right ? [] : [[1030, sliver, eio]]), [1150, { transform: A.tf }, eio], [2300, { transform: A.tf }, eio],
    ...(A.right ? [[2600, { transform: 'scaleX(-1)' }, eio], [3030, sliver, eio]] : []), [BACK, { transform: 'none' }]]);
  // its fire as drawn dies down while it breathes, and comes back at the end
  act(breath, [[0, { opacity: 1 }, eio], [260, { opacity: 0 }], [3260, { opacity: 0 }, eio], [3700, { opacity: 1 }]]);

  // ── the city's glow, and smoke going up from it
  fx(k.lightIn('g-city', [150, 150], 330, 120), [[60, { opacity: 0 }, 'ease-out'], [450, { opacity: 0.9 }], [1500, { opacity: 0.75 }, eio], [2600, { opacity: 0 }]]);
  for (let i = 0; i < 5; i++) {
    const t = 650 + i * 260, x = 64 + i * 30 + (rand() - 0.5) * 14, r = Math.round(rand() * 360);
    fx(k.picIn('smoke', [x, 128], 30, 30, { lit: false }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 350, { transform: `${k.T(-3, -14)} rotate(${r + 20}deg) scale(1)`, opacity: 0.55 }], [t + 1500, { transform: `${k.T(-10, -52)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }

  // ── a flame catching at `on`, flickering and leaning, dying down after `off`
  const flicker = (el, on, off, lean = 0) => {
    const sk = (d) => `skewX(${(lean + d).toFixed(1)}deg)`;
    const list = [[on, { transform: `translateY(0px) scale(.6, .12) ${sk(0)}`, opacity: 0 }, 'ease-out'], [on + 120, { transform: `translateY(0px) scale(1, 1) ${sk(0)}`, opacity: 0.95 }, eio]];
    const step = off - on > 1200 ? 120 : 70;
    for (let t = on + 120, i = 1; (t += step + rand() * 60) < off; i++) {
      const s = i % 2 ? 1 : -1;
      list.push([t, { transform: `translateY(${(-rand() * 1.5).toFixed(1)}px) scale(${(1 - s * 0.08 - rand() * 0.06).toFixed(2)}, ${(1 + s * 0.14 + rand() * 0.1).toFixed(2)}) ${sk(s * (2 + rand() * 5))}`, opacity: +(0.8 + rand() * 0.2).toFixed(2) }, eio]);
    }
    list.push([Math.min(k.END, off + 260), { transform: `translateY(0px) scale(.5, .15) ${sk(0)}`, opacity: 0 }]);
    fx(el, list);
  };
  // ── a scorch where fire lands: spreads (t0-t1), smoulders till `heal`, then fades by `whole`, a light passing over it
  const scorch = ([x, y], size, v, flat, t0, t1, heal, whole) => {
    const r = ((rand() - 0.5) * 16).toFixed(1);
    const grow = (o) => [[t0, { transform: `rotate(${r}deg) scale(.15, ${(0.15 * flat).toFixed(3)})`, opacity: 0 }, 'cubic-bezier(.2,.7,.4,1)'], [t1, { transform: `rotate(${r}deg) scale(1, ${flat})`, opacity: o }]];
    fx(k.picIn(`scorch${v}:char`, [x, y], size, size, { lit: false }), [...grow(1), [heal + 150, { transform: `rotate(${r}deg) scale(1, ${flat})`, opacity: 1 }, eio], [whole, { transform: `rotate(${r}deg) scale(1, ${flat})`, opacity: 0 }]]);
    const gl = grow(0.95);
    for (let t = t1, i = 0; (t += 140 + rand() * 90) < heal; i++) gl.push([t, { transform: `rotate(${r}deg) scale(1, ${flat})`, opacity: i % 2 ? 1 : 0.7 }, eio]);
    gl.push([heal + 500, { transform: `rotate(${r}deg) scale(1, ${flat})`, opacity: 0 }]);
    fx(k.picIn(`scorch${v}:glow`, [x, y], size, size), gl);
    fx(k.lightIn('g-heal', [x, y], size * 1.3, size * 1.3 * flat), [[heal + 150, { transform: 'scale(.6)', opacity: 0 }, 'ease-out'], [heal + 400, { transform: 'scale(1)', opacity: 0.85 }], [whole, { transform: 'scale(1.25)', opacity: 0 }]]);
  };
  for (let i = 0; i < 3; i++) {
    const t = 150 + i * 270, x = mouthX(t + 120) + (rand() - 0.5) * 10;
    scorch([x, ground + 6], 58 + rand() * 12, i + 1, 0.45, t + 200, t + 900, BACK + i * 60, BACK + 600 + i * 40);
    for (let j = 0; j < 2; j++) flicker(k.picIn(j ? 'flame' : 'flame2', [x + (j ? 9 : -8) + (rand() - 0.5) * 4, ground + 8], 9 + rand() * 3, 14 + rand() * 7, { base: true }), t + 320 + j * 110, BACK - 100 + rand() * 80);
  }

  // ── its breath: a cone of flame from the mouth to the ground (and a hotter one inside), swept with the head
  for (const [w, len, o, ph] of [[44, ground - my - 2, 0.8, 0], [18, (ground - my - 2) * 0.85, 1, 1]]) {
    const jl = [[0, { transform: 'translateX(0px) scale(.6, .3)', opacity: 0 }, 'ease-out']];
    for (let t = 60, i = ph; t <= 840; t += 60, i++) jl.push([t, { transform: `translateX(${((mouthX(t) - mx0) * u).toFixed(1)}px) scale(${i % 2 ? 0.86 : 1.1}, ${i % 2 ? 1.05 : 0.94})`, opacity: +(o * (i % 2 ? 0.88 : 1)).toFixed(2) }]);
    jl.push([940, { transform: `translateX(${((mouthX(900) - mx0) * u).toFixed(1)}px) scale(.7, .5)`, opacity: 0 }]);
    fx(k.picIn('jet', [mx0, my + 1], w, len, { top: true }), jl);
  }
  // billows pouring down, drawn out by their speed, bursting flat on the roofs
  const fall = (ground - my - 6) * u;
  for (let i = 0; i < 17; i++) {
    const t = 20 + i * 49, j = (rand() - 0.5) * 24, dx = (rand() - 0.5) * 10 * u;
    const at = (f, s, o, st = 1.45) => ({ transform: `translate(${(dx * f).toFixed(1)}px, ${(fall * f).toFixed(1)}px) rotate(${(90 + j).toFixed(1)}deg) scale(${(s * st).toFixed(2)}, ${(s / Math.sqrt(st)).toFixed(2)})`, opacity: o });
    fx(k.picIn(i % 3 === 2 ? 'puffCool' : 'puff', [mouthX(t), my + 6], 26, 26), [[t, at(0, 0.45, 0), 'ease-out'], [t + 50, at(0.2, 0.62, 0.95)], [t + 120, at(0.5, 0.82, 0.9)], [t + 210, at(1, 1.1, 0.85, 1.3), 'ease-out'],
      [t + 400, { transform: `translate(${(dx + (rand() - 0.5) * 8 * u).toFixed(1)}px, ${(fall - 4 * u).toFixed(1)}px) rotate(${(90 + j + (rand() - 0.5) * 40).toFixed(1)}deg) scale(1, 2.1)`, opacity: 0 }]]);
  }
  // flames left standing along the city
  for (let i = 0; i < 9; i++) {
    const t = 70 + i * 95;
    flicker(k.picIn(i % 2 ? 'flame' : 'flame2', [mouthX(t) + (rand() - 0.5) * 6, ground + 6], 12 + rand() * 4, 22 + rand() * 12, { base: true }), t + 230, t + 900 + rand() * 300);
  }

  // ── reared up: fire gathering in its jaws, blazing, then dying down as it lowers its head
  const ml = [[900, { transform: 'scale(.3)', opacity: 0 }, 'ease-out'], [1150, { transform: 'scale(1.25)', opacity: 0.95 }]];
  for (let t = 1300, i = 0; t < 2250; t += 160, i++) ml.push([t, { transform: `scale(${i % 2 ? 1.18 : 0.98})`, opacity: i % 2 ? 0.95 : 0.8 }, eio]);
  ml.push([2300, { transform: 'scale(1.05)', opacity: 0.85 }, 'ease-in'], [2480, { transform: 'scale(.5)', opacity: 0 }]);
  fx(k.light('g-warm', M, 70), ml);
  // and a few licks of flame at its jaws while it holds the pose
  for (let i = 0; i < 4; i++) {
    const [x, y] = M;
    flicker(k.pic(i % 2 ? 'flame' : 'flame2', [x + (rand() - 0.5) * 6, y + 3], 10 + rand() * 3, 16 + rand() * 6, { base: true }), 1200 + i * 90, 2200 + rand() * 120, 10);
  }

  // ── the stream (BEATS.release to .impact and on): billows along an arc from its jaws to T,
  //    on the overlay, since T may be on another card
  const C = [(M[0] + T[0]) / 2, Math.min(M[1], T[1]) - 26];
  const bz = (t) => { const q = 1 - t; return [q * q * M[0] + 2 * q * t * C[0] + t * t * T[0], q * q * M[1] + 2 * q * t * C[1] + t * t * T[1]]; };
  const [X0, Y0] = k.P(...M);
  for (let i = 0; i < 14; i++) {
    const t0 = 1320 + i * 62, r = Math.round(rand() * 360), side = (rand() - 0.5) * 8;
    const at = (t, sc, o) => { const [x, y] = k.P(...bz(t)); return { transform: `translate(${(x - X0).toFixed(1)}px, ${(y - Y0 + side * t * u).toFixed(1)}px) rotate(${r + Math.round(t * 60)}deg) scale(${sc})`, opacity: o }; };
    fx(k.pic(i % 3 === 2 ? 'puffCool' : 'puff', M, 24, 24), [[t0, at(0, 0.4, 0), 'ease-out'], [t0 + 60, at(0.25, 0.6, 0.95)], [t0 + 140, at(0.55, 0.8, 0.9)],
      [t0 + 230, at(0.85, 0.95, 0.85)], [t0 + 300, at(1, 1.2, 0.7), 'ease-out'], [t0 + 560, at(1, 1.8, 0)]]);
  }
  // where it lands (BEATS.impact): a light beating with the billows, flames catching, smoke rolling up
  const IMPACT = 1620;
  const il = [[IMPACT - 40, { transform: 'scale(.4)', opacity: 0 }, 'ease-out'], [IMPACT + 60, { transform: 'scale(1.1)', opacity: 0.95 }]];
  for (let t = IMPACT + 180, i = 0; t < 2300; t += 120, i++) il.push([t, { transform: `scale(${i % 2 ? 1.12 : 0.95})`, opacity: i % 2 ? 0.95 : 0.75 }, eio]);
  il.push([2700, { transform: 'scale(.7)', opacity: 0 }]);
  fx(k.light('g-warm', T, 64), il);
  for (let i = 0; i < 4; i++) flicker(k.pic(i % 2 ? 'flame' : 'flame2', [T[0] + (i - 1.5) * 7, T[1] + 5], 10 + rand() * 4, 16 + rand() * 8, { base: true }), IMPACT + 60 + i * 70, 2450 + rand() * 200);
  for (let i = 0; i < 4; i++) {
    const t = IMPACT + 300 + i * 180, r = Math.round(rand() * 360);
    fx(k.pic('smoke', [T[0] + (rand() - 0.5) * 10, T[1] - 6], 26, 26, { lit: false, low: true }), [[t, { transform: `${k.T(0, 0)} rotate(${r}deg) scale(.5)`, opacity: 0 }, 'ease-out'],
      [t + 300, { transform: `${k.T(-2, -12)} rotate(${r + 20}deg) scale(1)`, opacity: 0.5 }], [t + 1300, { transform: `${k.T(-8, -46)} rotate(${r + 50}deg) scale(2)`, opacity: 0 }]]);
  }
}
