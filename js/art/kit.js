// Drawing kit for the card art: cut-paper dioramas lit from behind.
// Everything is plain SVG (gradients and paths, no filters) so 45 cards
// render quickly on a phone. Randomness is seeded: same card, same picture.

export const W = 300;
export const H = 210;

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const f1 = (n) => (Math.round(n * 10) / 10).toString();
export const pt = (p) => `${f1(p[0])},${f1(p[1])}`;

// ── curves ──────────────────────────────────────────────────────────

// Catmull-Rom through the points, sampled into a dense polyline.
export function spline(pts, per = 8, closed = false) {
  const n = pts.length;
  const P = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  const out = [];
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      const c = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

export const poly = (ps, close = true) => 'M' + ps.map(pt).join('L') + (close ? 'Z' : '');

// Smooth closed shape through the given points.
export const blob = (pts, per = 6) => poly(spline(pts, per, true));

// Smooth open line (for strokes).
export const line = (pts, per = 6) => poly(spline(pts, per), false);

// A filled shape grown along a centre line: tentacles, tails, horns, limbs,
// cloth. `w` is a width per control point (or [start, end]).
export function taper(pts, w, { per = 8, bulge = 0 } = {}) {
  const s = spline(pts, per);
  const ws = Array.isArray(w) ? w : [w, w];
  const widthAt = (t) => {
    const x = t * (ws.length - 1), i = Math.min(ws.length - 2, Math.floor(x)), f = x - i;
    return ws[i] * (1 - f) + ws[i + 1] * f;
  };
  const L = [], R = [];
  for (let i = 0; i < s.length; i++) {
    const a = s[Math.max(0, i - 1)], b = s[Math.min(s.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const t = i / (s.length - 1);
    const hw = (widthAt(t) * (1 + bulge * Math.sin(Math.PI * t))) / 2;
    L.push([s[i][0] - dy * hw, s[i][1] + dx * hw]);
    R.push([s[i][0] + dy * hw, s[i][1] - dx * hw]);
  }
  return poly([...L, ...R.reverse()]);
}

// ── terrain ─────────────────────────────────────────────────────────

function noise(r, n = 48) {
  const v = Array.from({ length: n + 1 }, () => r());
  return (x) => {
    const i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
    const a = v[((i % n) + n) % n], b = v[(((i + 1) % n) + n) % n];
    return a * (1 - s) + b * s;
  };
}

// Skyline of hills (smooth) or peaks (ridged). `base` is the lowest point,
// `amp` how far above it the tallest point may rise.
export function ridge({ seed = 1, base, amp, freq = 2.5, oct = 3, peaks = false, step = 4, x0 = -8, x1 = W + 8, bottom = H + 8 }) {
  const r = rng(seed);
  const ns = Array.from({ length: oct }, () => noise(r));
  const pts = [];
  for (let x = x0; x <= x1; x += step) {
    let v = 0, a = 1, f = freq, norm = 0;
    for (let o = 0; o < oct; o++) {
      let n = ns[o]((x / W) * f + o * 5.17);
      if (peaks) n = 1 - Math.abs(n * 2 - 1);
      v += n * a; norm += a; a *= 0.5; f *= 2.05;
    }
    pts.push([x, base - (v / norm) * amp]);
  }
  return `M${x0},${bottom}L` + pts.map(pt).join('L') + `L${x1},${bottom}Z`;
}

// A line of pines between x0 and x1 standing on `base`.
export function pines({ seed = 2, base, x0 = -10, x1 = W + 10, h = [24, 40], gap = [8, 15] }) {
  const r = rng(seed);
  const parts = [];
  for (let x = x0; x < x1; x += gap[0] + r() * (gap[1] - gap[0])) {
    const th = h[0] + r() * (h[1] - h[0]), tw = th * (0.32 + r() * 0.08), y = base + r() * 3;
    const tiers = 3;
    let path = `M${f1(x - 1)},${f1(y)}L${f1(x - 1)},${f1(y - th * 0.18)}L${f1(x + 1)},${f1(y - th * 0.18)}L${f1(x + 1)},${f1(y)}Z`;
    for (let k = 0; k < tiers; k++) {
      const top = y - th + (k * th) / (tiers + 0.6), bot = top + th * 0.5, half = tw * (0.55 + k * 0.22);
      path += `M${f1(x)},${f1(top)}L${f1(x + half)},${f1(bot)}L${f1(x - half)},${f1(bot)}Z`;
    }
    parts.push(path);
  }
  return parts.join('');
}

// Rounded broadleaf canopy: a bumpy band of crowns.
export function canopy({ seed = 3, base, top, x0 = -20, x1 = W + 20, r0 = 10, r1 = 20 }) {
  const r = rng(seed);
  // Overlapping crowns of uneven size, each arc starting and ending at a
  // different height, so the edge reads as foliage rather than a stamp.
  let d = `M${x0},${H + 8}L${x0},${base}`;
  for (let x = x0; x < x1;) {
    const rad = r0 + r() * (r1 - r0), cy = top + r() * (base - top) * 0.6;
    const ya = cy + rad * (0.3 + r() * 0.3), yb = cy + rad * (0.3 + r() * 0.3);
    const span = rad * (1.4 + r() * 0.4);
    d += `L${f1(x)},${f1(ya)}A${f1(rad)},${f1(rad * (0.9 + r() * 0.15))} 0 0 1 ${f1(x + span)},${f1(yb)}`;
    x += span * (0.72 + r() * 0.18);
  }
  return d + `L${x1},${H + 8}Z`;
}

// Ruined towers and walls on a baseline.
export function ruins({ seed = 4, base, x0, x1, h = [20, 60], w = [8, 16] }) {
  const r = rng(seed);
  let d = '';
  for (let x = x0; x < x1;) {
    const tw = w[0] + r() * (w[1] - w[0]), th = h[0] + r() * (h[1] - h[0]);
    const top = base - th, broken = r() < 0.5;
    if (broken) {
      d += `M${f1(x)},${base}L${f1(x)},${f1(top + 6)}L${f1(x + tw * 0.3)},${f1(top)}L${f1(x + tw * 0.55)},${f1(top + 8)}L${f1(x + tw * 0.8)},${f1(top + 3)}L${f1(x + tw)},${f1(top + 10)}L${f1(x + tw)},${base}Z`;
    } else {
      d += `M${f1(x)},${base}L${f1(x)},${f1(top)}`;
      const m = Math.max(2, Math.round(tw / 4));
      for (let k = 0; k < m; k++) {
        const a = x + (k * tw) / m, b = x + ((k + 0.5) * tw) / m;
        d += `L${f1(a)},${f1(top - 3)}L${f1(b)},${f1(top - 3)}L${f1(b)},${f1(top)}`;
      }
      d += `L${f1(x + tw)},${f1(top)}L${f1(x + tw)},${base}Z`;
    }
    x += tw + 2 + r() * 14;
  }
  return d;
}

// ── light and air ───────────────────────────────────────────────────

// Particles: embers, motes, bubbles, stars. Each gets a random delay so a
// looping animation never pulses in unison.
export function particles({ seed = 5, n, x = [0, W], y = [0, H], r = [0.6, 1.6], fill, cls = 'rise', op = [0.5, 1], t = [5, 9], stroke = null }) {
  const R = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const cx = x[0] + R() * (x[1] - x[0]), cy = y[0] + R() * (y[1] - y[0]);
    const rad = r[0] + R() * (r[1] - r[0]), o = op[0] + R() * (op[1] - op[0]);
    const dur = t[0] + R() * (t[1] - t[0]), delay = -R() * dur;
    const paint = stroke ? `fill="none" stroke="${stroke}" stroke-width=".5"` : `fill="${fill}"`;
    s += `<circle class="${cls}" style="--t:${f1(dur)}s;--d:${f1(delay)}s;--o:${f1(o)}" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(rad)}" ${paint} opacity="${f1(o)}"/>`;
  }
  return s;
}

// Fan of soft light shafts from a point.
export function rays({ cx, cy, n = 9, from = -150, to = -30, len = 260, spread = 4, color = '#fff', op = 0.12, seed = 6 }) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = ((from + ((to - from) * (i + r() * 0.6)) / n) * Math.PI) / 180;
    const sp = ((spread * (0.5 + r())) * Math.PI) / 180;
    const p1 = [cx + Math.cos(a - sp) * len, cy + Math.sin(a - sp) * len];
    const p2 = [cx + Math.cos(a + sp) * len, cy + Math.sin(a + sp) * len];
    s += `<path d="M${f1(cx)},${f1(cy)}L${pt(p1)}L${pt(p2)}Z" fill="${color}" opacity="${f1(op * (0.5 + r()))}"/>`;
  }
  return s;
}

// ── scene builder ───────────────────────────────────────────────────

export class Scene {
  constructor(id) {
    this.id = id;
    this.defs = [];
    this.body = [];
    this.k = 0;
  }
  uid(tag) { return `${this.id}-${tag}${this.k++}`; }
  stops(stops) {
    return stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}"${op !== 1 ? ` stop-opacity="${op}"` : ''}/>`).join('');
  }
  // Vertical gradient by default; pass x1..y2 (0..1) for other directions.
  lin(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
    const id = this.uid('l');
    this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${this.stops(stops)}</linearGradient>`);
    return `url(#${id})`;
  }
  rad(stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
    const id = this.uid('r');
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${this.stops(stops)}</radialGradient>`);
    return `url(#${id})`;
  }
  add(...svg) { this.body.push(...svg); return this; }
  rect(fill, op = 1) { return this.add(`<rect x="-5" y="-5" width="${W + 10}" height="${H + 10}" fill="${fill}"${op !== 1 ? ` opacity="${op}"` : ''}/>`); }
  path(d, fill, extra = '') { return this.add(`<path d="${d}" fill="${fill}" ${extra}/>`); }
  // Soft round light.
  glow(cx, cy, r, color, op = 0.6, cls = '') {
    const g = this.rad([[0, color, op], [0.45, color, op * 0.35], [1, color, 0]]);
    return this.add(`<ellipse${cls ? ` class="${cls}"` : ''} cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(r)}" fill="${g}"/>`);
  }
  // A silhouette with rim light: the shape is drawn twice, a light copy
  // nudged toward the light source sits behind the dark one.
  // Backlit subjects get several offsets so the rim wraps around them.
  figure(inner, { fill, rim, offsets = [[-1.2, -1]], rimOp = 1 }) {
    const id = this.uid('f');
    this.defs.push(`<g id="${id}">${inner}</g>`);
    if (rim) {
      for (const [dx, dy] of offsets) {
        this.add(`<use href="#${id}" fill="${rim}" stroke="${rim}" opacity="${rimOp}" transform="translate(${dx} ${dy})"/>`);
      }
    }
    return this.add(`<use href="#${id}" fill="${fill}" stroke="${fill}"/>`);
  }
  // Low fog bands.
  fog(y, color, op = 0.35, cls = 'drift') {
    const g = this.lin([[0, color, 0], [0.5, color, op], [1, color, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    return this.add(`<rect class="${cls}" x="-60" y="${f1(y - 7)}" width="${W + 120}" height="14" rx="7" fill="${g}"/>`);
  }
  svg() {
    return `<svg class="art-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${this.defs.join('')}</defs>${this.body.join('')}</svg>`;
  }
}
