// Fire, smoke, gloom and scorches for the cards' scenes (js/home-alive.js): little
// pictures painted once, in code, and shared by every flame that shows one.
// Each is still. Fire's flicker and roll come from many of them moving at
// once and adding up their light (the compositor's work).

// colours by heat, 0-1: [heat, r, g, b, alpha]
const FIRE = [[0, 70, 8, 0, 0], [0.14, 140, 26, 4, 0.3], [0.32, 228, 74, 12, 0.78], [0.52, 255, 146, 34, 0.95], [0.72, 255, 210, 96, 1], [0.92, 255, 248, 220, 1]];
const NONE = [0, 0, 0, 0];
function heat(R, t) {
  if (!(t > 0)) return NONE;
  let i = 1;
  while (i < R.length - 1 && R[i][0] < t) i++;
  const a = R[i - 1], b = R[i], k = Math.min(1, (t - a[0]) / (b[0] - a[0]));
  return [a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k, a[4] + (b[4] - a[4]) * k];
}

// smooth random values over the plane (value noise), and summed over scales
function noise(seed) {
  const S = Math.imul(seed + 1, 2246822519);
  const h = (x, y) => {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + S) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
    const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    const su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
}
const fbm = (n, x, y) => (n(x, y) * 8 + n(x * 2 + 17, y * 2 + 9) * 4 + n(x * 4 + 3, y * 4 + 41) * 2 + n(x * 8 + 29, y * 8 + 5)) / 15;

// A tongue of flame standing on its base (or hanging from it: `down`), hottest
// low in its middle, its tip wandering and torn.
const tongue = (R, seed, down = false) => {
  const n = noise(seed);
  return (x, y) => {
    const v = down ? y : 1 - y, u = x * 2 - 1; // (v: 0 at the base, 1 at the tip)
    const w = v < 0.26 ? 0.84 * Math.sqrt(Math.max(0, 1 - ((0.26 - v) / 0.26) ** 2)) : 0.84 * (1 - (v - 0.26) / 0.74) ** 1.3;
    if (w < 0.01) return NONE;
    const mid = (fbm(n, 2.1, v * 2.4) - 0.5) * 0.9 * v * v;
    const d = Math.abs(u - mid) / w;
    return heat(R, (1 - d) * (1.08 - 0.62 * v) * (0.6 + 0.8 * fbm(n, u * 2.4 + 7, v * 4.6 - 3)));
  };
};
// A billow of fire, ragged round its rim.
const puff = (R, seed, hot) => {
  const n = noise(seed);
  return (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
    const k = 1 - r / (0.62 + 0.36 * fbm(n, Math.cos(a) * 1.5 + 4, Math.sin(a) * 1.5 + 4));
    return k > 0 ? heat(R, hot * k ** 0.7 * (0.55 + 0.85 * fbm(n, x * 5, y * 5))) : NONE;
  };
};
// A puff of smoke.
const smoke = (seed) => {
  const n = noise(seed);
  return (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
    const k = 1 - r / (0.66 + 0.32 * fbm(n, Math.cos(a) * 1.4 + 8, Math.sin(a) * 1.4 + 8));
    if (k <= 0) return NONE;
    const f = fbm(n, x * 4 + 2, y * 4 + 6), g = 50 + 34 * f;
    return [g, g * 0.9, g * 0.84, Math.min(1, k ** 1.2 * (0.35 + 0.8 * f))];
  };
};
// A dark gloom, the ghosts' shadow: soft and ragged, no fire in it.
const gloom = (seed) => {
  const n = noise(seed);
  return (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
    const k = 1 - r / (0.6 + 0.38 * fbm(n, Math.cos(a) * 1.3 + 2, Math.sin(a) * 1.3 + 2));
    if (k <= 0) return NONE;
    const f = fbm(n, x * 3.5 + 1, y * 3.5 + 4);
    return [20 + 14 * f, 8 + 8 * f, 34 + 20 * f, Math.min(1, k ** 1.1 * (0.5 + 0.7 * f))];
  };
};
// A scorch where fire landed: char in a ragged blot, singed brown round it
// ('char'), or the smouldering ring at its rim, with sparks of it left inside
// ('glow').
const scorch = (seed, what) => {
  const n = noise(seed);
  return (x, y) => {
    const dx = x - 0.5, dy = y - 0.5, r = Math.hypot(dx, dy) * 2, a = Math.atan2(dy, dx);
    const e = r - (0.34 + 0.38 * fbm(n, Math.cos(a) * 2.2 + 5, Math.sin(a) * 2.2 + 5) + 0.12 * (fbm(n, x * 9, y * 9) - 0.5)); // (< 0: burnt)
    if (what === 'char') {
      const ins = Math.min(1, Math.max(0, (0.02 - e) / 0.04)), sg = e < 0.25 ? 0.45 * (1 - Math.max(0, e) / 0.25) ** 2 : 0;
      if (ins <= 0 && sg <= 0) return NONE;
      const m = 0.75 + 0.4 * fbm(n, x * 8 + 3, y * 8), k = Math.min(1, 0.7 + (0.3 * Math.max(0, -e)) / 0.25);
      return [96 + (24 * m - 96) * ins, 54 + (14 * m - 54) * ins, 22 + (8 * m - 22) * ins, ins * 0.8 * k + (1 - ins) * sg];
    }
    let t = Math.max(0, 1 - Math.abs(e) / 0.07) * 0.95, halo = 0.22 * (1 - Math.abs(e) / 0.2);
    if (halo > t) t = halo;
    if (e < -0.04 && e > -0.45) { const s = fbm(n, x * 20 + 5, y * 20); if (s > 0.6) t = Math.max(t, (s - 0.6) * 2.2 * (1 + e / 0.45)); }
    return heat(FIRE, t);
  };
};

function paint(w, h, px) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
  for (let y = 0, i = 0; y < h; y++) {
    for (let x = 0; x < w; x++, i += 4) {
      const [r, gr, b, a] = px((x + 0.5) / w, (y + 0.5) / h);
      d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = a * 255;
    }
  }
  g.putImageData(im, 0, 0);
  return new Promise((ok) => c.toBlob((blob) => ok(blob ? URL.createObjectURL(blob) : c.toDataURL())));
}

let made = null;
// The pictures, as image URLs once painted: flames (and a jet hanging from a
// mouth), billows of fire, smoke, gloom, and three scorches (scorchN:char and
// scorchN:glow). Painted one at a time, the page free in between.
export function fxArt() {
  made ??= (async () => {
    const jobs = {
      flame: [40, 80, tongue(FIRE, 3)], flame2: [40, 80, tongue(FIRE, 8)], jet: [32, 96, tongue(FIRE, 11, true)],
      puff: [56, 56, puff(FIRE, 4, 1.05)], puffHot: [56, 56, puff(FIRE, 9, 1.4)], puffCool: [56, 56, puff(FIRE, 12, 0.78)],
      smoke: [56, 56, smoke(6)], gloom: [56, 56, gloom(13)],
    };
    for (const v of [1, 2, 3]) for (const what of ['char', 'glow']) jobs[`scorch${v}:${what}`] = [64, 64, scorch(20 + v * 7, what)];
    const out = {};
    for (const [name, [w, h, px]] of Object.entries(jobs)) out[name] = await paint(w, h, px);
    await Promise.all(Object.values(out).map((src) => { const im = new Image(); im.src = src; return im.decode().catch(() => {}); }));
    return out;
  })();
  return made;
}
