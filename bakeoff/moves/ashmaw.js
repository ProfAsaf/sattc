// A worked example (bakeoff/recipe.md): Ashmaw, one of Home's three living
// cards, given a solo move with the harness kit. It swings its head round to
// the right, breathing a cone of fire down onto the burning city: billows
// burst on the roofs, flames catch and smoke goes up, scorches spread where
// the fire lands. It rears up, fire gathering in its jaws, then lowers its
// head and turns it back; its drawn breath returns and the scorches heal.
// (Home's whole scene, with the other two cards, is js/home-alive.js.)
//
// Everything is in the drawing's units (300 x 210) and ms of the move;
// keyframe translations are px, so they're drawing units times k.u.
export const END = 4200;
export const STILLS = [150, 450, 750, 1100, 1700, 2600, 3200, 3800];

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
  // the mouth with the head turned right and raised `up` degrees about the neck
  const mouthTurned = (up) => {
    const r = (up * Math.PI) / 180, dx = mx - nx, dy = my - ny;
    return [nx - (dx * Math.cos(r) - dy * Math.sin(r)), ny + dx * Math.sin(r) + dy * Math.cos(r)];
  };
  const mx0 = mouthX(0);

  // ── the head: round to the right (a sliver at 450), up (1150), back round (a sliver at 3030)
  act(head, [[0, { transform: 'none' }, eio], [450, { transform: 'scale(.06, 1.03)' }, eio], [900, { transform: 'scaleX(-1)' }, eio],
    [1150, { transform: 'scaleX(-1) rotate(40deg)' }, eio], [1300, { transform: 'scaleX(-1) rotate(32deg)' }, eio], [2300, { transform: 'scaleX(-1) rotate(32deg)' }, eio],
    [2600, { transform: 'scaleX(-1)' }, eio], [3030, { transform: 'scale(.06, 1.03)' }, eio], [BACK, { transform: 'none' }]]);
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
  fx(k.light('g-warm', mouthTurned(34), 70), ml);
  // and a few licks of flame at its jaws while it holds the pose
  for (let i = 0; i < 4; i++) {
    const [x, y] = mouthTurned(32);
    flicker(k.pic(i % 2 ? 'flame' : 'flame2', [x + (rand() - 0.5) * 6, y + 3], 10 + rand() * 3, 16 + rand() * 6, { base: true }), 1200 + i * 90, 2200 + rand() * 120, 10);
  }
}
