// Drawing kit for the card art: cut-paper dioramas lit from behind.
// Shapes are plain SVG paths and gradients. Cards are shown as cached <img>s
// (rasterised once), so a few STATIC filters per card are affordable: bloom,
// depth blur, soft shafts, torn-paper edges and the finishing grain.
// Randomness is seeded: same card, same picture.
//
// Light, depth and texture (all optional, ≤ ~6 filter uses per card):
//   s.bloom(svg, { sd, k, box })        bright shapes (sun disc, lava, eyes, a flame) get a halo
//   s.shafts({ cx, cy, ...rays opts })   soft-edged light shafts that fade with distance
//   s.layer(d, fill, { blur, shadow, rough, seed })
//                                        a depth layer: depth-of-field blur, a soft shadow cast
//                                        on the layer behind it, a torn-paper edge
//   s.blur(svg, sd)                      depth blur for any far group
//   s.haze(y0, y1, color, op)            luminous air thickening toward y1, between layers
//   s.figure(inner, { ..., shade, edge, halo, light })
//                                        body lit toward the light, a soft band of light inside
//                                        the lit edge, a blurred rim glow around the silhouette
//   s.motes({ ...particles opts })       soft glowing particles (gradient dots, no filter)
//   s.bokeh({ ... })                     a few big out-of-focus discs in the foreground
//   s.finish({ faction, grade, vignette, grain, at }) or s.finish(false)
//                                        the global finish added by svg(): colour grade,
//                                        vignette and grain (on by default for every card)
// Strengths that read well: figure shade .4–.6, edge .25–.35, halo .3–.4 (main
// subject only; more turns a cut-out into a lit plastic toy); layer blur .5–.8
// on far layers only; haze op .25–.4 and shafts op .25–.35 (more washes the
// picture out); bloom on small bright things, not on big pale areas. Bokeh
// reads as dirt on most cards: use it rarely, bright on dark only.
// Never put a filter on or around an animated element (rise, float, twinkle,
// drift, breathe, fall): it would re-run every frame in the zoom view. Keep a
// glow's 'breathe' ellipse outside the bloom group, beside it.

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
const f2 = (n) => (Math.round(n * 100) / 100).toString();
export const pt = (p) => `${f1(p[0])},${f1(p[1])}`;

// ── colour ──────────────────────────────────────────────────────────

function rgbOf(c) {
  let h = String(c).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((x) => x + x).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isFinite(n) && h.length >= 6 ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [128, 128, 128];
}
const hexOf = (v) => '#' + v.map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join('');

// Blend two hex colours: t = 0 gives a, 1 gives b.
export function mix(a, b, t) {
  const A = rgbOf(a), B = rgbOf(b);
  return hexOf(A.map((v, i) => v + (B[i] - v) * t));
}

// Relative luminance 0..1 of a hex colour.
export function lum(c) {
  const [r, g, b] = rgbOf(c);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// The hue of `c` carried to luminance L, then pulled `sat` of the way from
// neutral grey: a soft-light tint that shifts colour without crushing values.
function tint(c, L, sat) {
  const v = rgbOf(c).map((x) => x / 255);
  const l = 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] || 0.001;
  return hexOf(v.map((x) => Math.min(1, x * (L / l))).map((x) => (L + (x - L) * sat) * 255));
}

// Per-faction finish: the hue the light takes (hi), the hue the shadows take
// (lo) and how hard the corners close in. Two-faction cards average theirs.
export const GRADES = {
  ember:   { hi: '#ffb35c', lo: '#5a0f16', vignette: 0.5 },
  verdant: { hi: '#fff0a0', lo: '#23401f', vignette: 0.28 },
  tide:    { hi: '#b4fff2', lo: '#0b2a4f', vignette: 0.45 },
  umbral:  { hi: '#d6b4ff', lo: '#231243', vignette: 0.5 },
  radiant: { hi: '#ffe08c', lo: '#4f2c12', vignette: 0.26 },
};
// Defaults for every card's finish (strengths 0..1; vignette null = per faction).
export const FINISH = { grade: 0.32, vignette: null, grain: 0.06, sat: 0.6, reach: 330, hiL: 0.64, loL: 0.38, blend: 'overlay' };

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
    this.fxc = new Map();   // filter cache: one <filter> per kind and settings
    this.grads = new Map(); // gradient id -> stops, so the finish can read the sky
    this.lights = [];       // every glow(), so the finish can find the key light
    this.fin = {};          // finish settings; false switches the finish off
  }
  uid(tag) { return `${this.id}-${tag}${this.k++}`; }
  stops(stops) {
    return stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}"${op !== 1 ? ` stop-opacity="${op}"` : ''}/>`).join('');
  }
  // Vertical gradient by default; pass x1..y2 (0..1) for other directions.
  lin(stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
    const id = this.uid('l');
    this.grads.set(id, stops);
    this.defs.push(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${this.stops(stops)}</linearGradient>`);
    return `url(#${id})`;
  }
  rad(stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
    const id = this.uid('r');
    this.defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${this.stops(stops)}</radialGradient>`);
    return `url(#${id})`;
  }
  // Gradients in canvas units (the two above are relative to each shape's box).
  radU(cx, cy, r, stops) {
    const id = this.uid('ru');
    this.defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}">${this.stops(stops)}</radialGradient>`);
    return `url(#${id})`;
  }
  linU(x1, y1, x2, y2, stops) {
    const id = this.uid('lu');
    this.defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}">${this.stops(stops)}</linearGradient>`);
    return `url(#${id})`;
  }
  add(...svg) { this.body.push(...svg); return this; }
  rect(fill, op = 1) {
    if (this.sky === undefined) this.sky = fill;
    return this.add(`<rect x="-5" y="-5" width="${W + 10}" height="${H + 10}" fill="${fill}"${op !== 1 ? ` opacity="${op}"` : ''}/>`);
  }
  path(d, fill, extra = '') { return this.add(`<path d="${d}" fill="${fill}" ${extra}/>`); }
  // Soft round light.
  glow(cx, cy, r, color, op = 0.6, cls = '') {
    this.lights.push([cx, cy, r, color, op]);
    const g = this.rad([[0, color, op], [0.45, color, op * 0.35], [1, color, 0]]);
    return this.add(`<ellipse${cls ? ` class="${cls}"` : ''} cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(r)}" ry="${f1(r)}" fill="${g}"/>`);
  }

  // ── filters ───────────────────────────────────────────────────────
  // fx(kind, opts) returns a ready attribute, `filter="url(#…)"`, defining
  // the <filter> once per scene and settings. Kinds:
  //   blur  { sd }               depth of field
  //   bloom { sd, k }            the shape plus a two-step halo of itself
  //   halo  { sd, k }            only the blurred halo (a glow behind something)
  //   rough { scale, freq, oct, seed }   torn-paper edge (turbulent displacement)
  //   layer { blur, shadow, sd, dy, color, rough, freq, seed }   all of a depth layer in one pass
  //   edge  { dx, dy, sd }       keeps a soft band along the side facing away from (dx, dy)
  // The region is the canvas plus a small margin (nothing outside the canvas
  // is ever shown); pass box: [x, y, w, h] to tighten it, or bbox: true to
  // follow the shape (fine for big shapes).
  fx(kind, o = {}) {
    const key = kind + JSON.stringify(o);
    if (!this.fxc.has(key)) {
      const id = this.uid('fx');
      const reg = o.bbox ? 'x="-.3" y="-.3" width="1.6" height="1.6"'
        : `filterUnits="userSpaceOnUse" x="${o.box ? o.box[0] : -10}" y="${o.box ? o.box[1] : -10}" width="${o.box ? o.box[2] : W + 20}" height="${o.box ? o.box[3] : H + 20}"`;
      let g = '';
      if (kind === 'blur') g = `<feGaussianBlur stdDeviation="${f2(o.sd ?? 1.2)}"/>`;
      else if (kind === 'bloom' || kind === 'halo') {
        const sd = o.sd ?? 2.5, k = o.k ?? 1.3;
        g = `<feGaussianBlur in="SourceGraphic" stdDeviation="${f2(sd)}" result="a"/><feGaussianBlur in="SourceGraphic" stdDeviation="${f2(sd * 3.2)}" result="b"/>` +
          `<feComponentTransfer in="b" result="b2"><feFuncA type="linear" slope="${f2(k * 0.75)}"/></feComponentTransfer>` +
          `<feComponentTransfer in="a" result="a2"><feFuncA type="linear" slope="${f2(k)}"/></feComponentTransfer>` +
          `<feMerge><feMergeNode in="b2"/><feMergeNode in="a2"/>${kind === 'bloom' ? '<feMergeNode in="SourceGraphic"/>' : ''}</feMerge>`;
      } else if (kind === 'edge') {
        g = `<feOffset in="SourceAlpha" dx="${o.dx ?? 0}" dy="${o.dy ?? 2}" result="sh"/><feComposite in="SourceAlpha" in2="sh" operator="out" result="band"/>` +
          `<feGaussianBlur in="band" stdDeviation="${f2(o.sd ?? 0.9)}" result="bb"/><feComposite in="SourceGraphic" in2="bb" operator="in"/>`;
      } else if (kind === 'rough') {
        g = `<feTurbulence type="fractalNoise" baseFrequency="${o.freq ?? 0.06}" numOctaves="${o.oct ?? 2}" seed="${o.seed ?? 1}" result="t"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="t" scale="${f2(o.scale ?? 2.5)}" xChannelSelector="R" yChannelSelector="G"/>`;
      } else if (kind === 'layer') {
        let src = 'SourceGraphic';
        if (o.rough) {
          g += `<feTurbulence type="fractalNoise" baseFrequency="${o.freq ?? 0.07}" numOctaves="2" seed="${o.seed ?? 1}" result="t"/>` +
            `<feDisplacementMap in="SourceGraphic" in2="t" scale="${f2(o.rough)}" xChannelSelector="R" yChannelSelector="G" result="r"/>`;
          src = 'r';
        }
        if (o.blur) { g += `<feGaussianBlur in="${src}" stdDeviation="${f2(o.blur)}" result="s"/>`; src = 's'; }
        if (o.shadow) {
          g += `<feGaussianBlur in="${src}" stdDeviation="${f2(o.sd ?? 2.6)}" result="sb"/><feFlood flood-color="${o.color || '#000'}" flood-opacity="${f2(o.shadow)}"/>` +
            `<feComposite in2="sb" operator="in"/><feOffset dy="${f2(o.dy ?? -0.8)}" result="sh"/>` +
            `<feMerge><feMergeNode in="sh"/><feMergeNode in="${src}"/></feMerge>`;
        } else if (src === 'SourceGraphic') g = '<feOffset/>';
      }
      this.defs.push(`<filter id="${id}" ${reg} color-interpolation-filters="sRGB">${g}</filter>`);
      this.fxc.set(key, `filter="url(#${id})"`);
    }
    return this.fxc.get(key);
  }
  // Wrap SVG in a filtered group and add it.
  bloom(svg, o = {}) { return this.add(`<g ${this.fx('bloom', o)}>${svg}</g>`); }
  blur(svg, sd = 1.2) { return this.add(`<g ${this.fx('blur', { sd })}>${svg}</g>`); }
  rough(svg, o = {}) { return this.add(`<g ${this.fx('rough', o)}>${svg}</g>`); }
  // A depth layer: path d in `fill`, with optional blur (far = blurrier),
  // a soft shadow it casts on the layer behind (0..1), a torn-paper edge
  // (displacement in canvas units, 1.5–3 reads as hand-cut).
  layer(d, fill, { blur = 0, shadow = 0, rough = 0, sd, dy, color, freq, seed, extra = '' } = {}) {
    const o = {};
    if (blur) o.blur = blur;
    if (shadow) Object.assign(o, { shadow, sd, dy, color });
    if (rough) Object.assign(o, { rough, freq, seed });
    for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
    const f = Object.keys(o).length ? ` ${this.fx('layer', o)}` : '';
    return this.add(`<path d="${d}" fill="${fill}"${f}${extra ? ' ' + extra : ''}/>`);
  }

  // ── light and air ─────────────────────────────────────────────────
  // Soft-edged shafts: like rays(), but blurred and fading with distance.
  shafts({ cx, cy, n = 9, from = -150, to = -30, len = 260, spread = 4, color = '#fff', op = 0.18, seed = 6, sd = 2.6, near = 0.12 }) {
    const r = rng(seed);
    const g = this.radU(cx, cy, len, [[0, color, 0.55], [near, color, 1], [0.45, color, 0.55], [1, color, 0]]);
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = ((from + ((to - from) * (i + r() * 0.6)) / n) * Math.PI) / 180;
      const sp = ((spread * (0.5 + r())) * Math.PI) / 180;
      const p1 = [cx + Math.cos(a - sp) * len, cy + Math.sin(a - sp) * len];
      const p2 = [cx + Math.cos(a + sp) * len, cy + Math.sin(a + sp) * len];
      s += `<path d="M${f1(cx)},${f1(cy)}L${pt(p1)}L${pt(p2)}Z" opacity="${f2(Math.min(1, op * (0.5 + r())))}"/>`;
    }
    return this.add(`<g fill="${g}" ${this.fx('blur', { sd })}>${s}</g>`);
  }
  // Luminous air: clear at y0, thickening to `op` at y1, gone `tail` below.
  // Put it between depth layers so the far ones sink into light.
  haze(y0, y1, color, op = 0.45, tail = 14) {
    const top = Math.min(y0, y1), h = Math.abs(y1 - y0) + tail, t = Math.abs(y1 - y0) / h;
    const g = this.lin([[0, color, 0], [f2(t * 0.6), color, op * 0.45], [f2(t), color, op], [1, color, 0]]);
    return this.add(`<rect x="-5" y="${f1(top)}" width="${W + 10}" height="${f1(h)}" fill="${g}"/>`);
  }
  // Glowing particles: same options as particles(), drawn as soft dots with a
  // hot centre. `r` is the visible core; the soft edge reaches about 2.4×.
  motes({ fill = '#fff', hot = null, r = [0.6, 1.6], ...o } = {}) {
    const g = this.rad([[0, hot || mix(fill, '#ffffff', 0.55)], [0.28, fill, 0.95], [0.55, fill, 0.32], [1, fill, 0]]);
    return this.add(particles({ ...o, r: [r[0] * 2.4, r[1] * 2.4], fill: g }));
  }
  // Big out-of-focus discs, as if very near the lens. Keep them few and faint.
  bokeh({ seed = 7, n = 5, x = [0, W], y = [0, H], r = [5, 11], color = '#fff', op = [0.08, 0.2], cls = 'float', t = [7, 12] } = {}) {
    const g = this.rad([[0, color, 0.5], [0.72, color, 0.62], [0.9, color, 0.28], [1, color, 0]]);
    return this.add(particles({ seed, n, x, y, r, fill: g, cls, op, t }));
  }

  // A silhouette with rim light: the shape is drawn twice, a light copy
  // nudged toward the light source sits behind the dark one.
  // Backlit subjects get several offsets so the rim wraps around them.
  // Optional, for more volume (each 0..1, all off by default):
  //   shade  the body is a gradient, lit toward the light, darker away from it
  //   edge   a soft band of rim light inside the lit edge (1 filter)
  //   halo   a blurred rim-coloured glow around the silhouette (1 filter);
  //          or { op, sd, color }
  //   light  [dx, dy] pointing at the light; defaults to the mean offset
  figure(inner, { fill, rim, offsets = [[-1.2, -1]], rimOp = 1, shade = 0, edge = 0, halo = 0, light = null, depth = 2 }) {
    const id = this.uid('f');
    this.defs.push(`<g id="${id}">${inner}</g>`);
    let [lx, ly] = light || offsets.reduce(([a, b], [x, y]) => [a + x, b + y], [0, 0]);
    const ll = Math.hypot(lx, ly);
    if (ll < 1e-6) { lx = 0; ly = -1; } else { lx /= ll; ly /= ll; }
    if (halo && rim) {
      // pushed toward the light, so it spills past the lit side only
      const h = typeof halo === 'object' ? halo : { op: halo };
      const c = h.color || rim, sd = h.sd ?? 2.4;
      this.add(`<use href="#${id}" fill="${c}" stroke="${c}" opacity="${f2(h.op ?? 0.6)}" transform="translate(${f1(lx * sd * 0.9)} ${f1(ly * sd * 0.9)})" ${this.fx('blur', { sd, bbox: true })}/>`);
    }
    if (rim) {
      for (const [dx, dy] of offsets) {
        this.add(`<use href="#${id}" fill="${rim}" stroke="${rim}" opacity="${rimOp}" transform="translate(${dx} ${dy})"/>`);
      }
    }
    let body = fill;
    if (shade && rim && fill[0] === '#' && rim[0] === '#') {
      body = this.lin([[0, mix(fill, rim, 0.2 * shade)], [0.35, mix(fill, rim, 0.03 * shade)], [1, mix(fill, '#000000', 0.5 * shade)]],
        { x1: f2(0.5 + lx * 0.5), y1: f2(0.5 + ly * 0.5), x2: f2(0.5 - lx * 0.5), y2: f2(0.5 - ly * 0.5) });
    }
    this.add(`<use href="#${id}" fill="${body}" stroke="${body}"/>`);
    if (edge && rim) {
      // the figure minus a copy pushed away from the light leaves a band
      // along the lit edge; soften it and paint the figure in rim light
      // through it (one filter, only as big as the figure)
      this.add(`<use href="#${id}" fill="${rim}" stroke="${rim}" opacity="${f2(edge)}" ${this.fx('edge', { dx: +f1(-lx * depth), dy: +f1(-ly * depth), sd: +f2(depth * 0.45), bbox: true })}/>`);
    }
    return this;
  }
  // Low fog bands.
  fog(y, color, op = 0.35, cls = 'drift') {
    const g = this.lin([[0, color, 0], [0.5, color, op], [1, color, 0]], { x1: 0, y1: 0, x2: 1, y2: 0 });
    return this.add(`<rect class="${cls}" x="-60" y="${f1(y - 7)}" width="${W + 120}" height="14" rx="7" fill="${g}"/>`);
  }

  // ── the finish ────────────────────────────────────────────────────
  // svg() lays three static sheets over every picture: a colour grade (an
  // overlay: the light's hue around the key light, the shadow hue away from
  // it), a vignette, and fine grain. Tune per scene before calling svg():
  //   s.finish({ faction: 'tide' })          use that faction's grade (or ['ember', 'umbral'])
  //   s.finish({ grade: 0.2, vignette: 0.3, grain: 0 })   strengths, 0 = off
  //   s.finish({ at: [x, y] })               where the key light is (default: the biggest glow)
  //   s.finish({ hi: '#ffcc88', lo: '#220011' })          explicit hues
  //   s.finish(false)                        no finish at all
  // Without a faction the hues come from the scene itself: the biggest
  // glow's colour for the light, the darkest sky stop for the shadows.
  finish(o) {
    this.fin = o === false ? false : { ...(this.fin || {}), ...o };
    return this;
  }
  finishSVG() {
    const o = { ...FINISH, ...this.fin };
    const fs = [].concat(o.faction || []).map((f) => GRADES[f]).filter(Boolean);
    let hi = o.hi, lo = o.lo, vig = o.vignette;
    if (fs.length) {
      hi = hi || (fs[1] ? mix(fs[0].hi, fs[1].hi, 0.5) : fs[0].hi);
      lo = lo || (fs[1] ? mix(fs[0].lo, fs[1].lo, 0.5) : fs[0].lo);
      if (vig == null) vig = fs.reduce((a, f) => a + f.vignette, 0) / fs.length;
    }
    const key = this.lights.reduce((b, l) => (!b || l[2] * l[4] > b[2] * b[4] ? l : b), null);
    const skyStops = typeof this.sky === 'string' ? this.grads.get((this.sky.match(/#([^)]+)\)/) || [])[1]) : null;
    const skyCols = skyStops ? skyStops.map((s) => s[1]) : [typeof this.sky === 'string' && this.sky[0] === '#' ? this.sky : '#404040'];
    const skyDark = skyCols.reduce((a, c) => (lum(c) < lum(a) ? c : a), skyCols[0]);
    const skyLum = skyCols.reduce((a, c) => a + lum(c), 0) / skyCols.length;
    if (!hi) hi = key ? key[3] : skyCols.reduce((a, c) => (lum(c) > lum(a) ? c : a), skyCols[0]);
    if (!lo) lo = skyDark;
    if (vig == null) vig = 0.26 + 0.24 * Math.max(0, Math.min(1, (0.7 - skyLum) / 0.5));
    let out = '';
    const full = `x="-5" y="-5" width="${W + 10}" height="${H + 10}"`;
    if (o.grade > 0) {
      const [kx, ky] = o.at || (key ? [key[0], key[1]] : [W / 2, H * 0.3]);
      const g = this.radU(kx, ky, o.reach, [[0, tint(hi, o.hiL, o.sat)], [0.4, '#808080'], [1, tint(lo, o.loL, o.sat)]]);
      out += `<rect ${full} fill="${g}" opacity="${f2(o.grade)}" style="mix-blend-mode:${o.blend}"/>`;
    }
    if (vig > 0) {
      const c = mix(lo, '#000000', 0.55);
      const v = this.rad([[0, c, 0], [0.5, c, 0], [0.78, c, f2(vig * 0.5)], [1, c, f2(vig)]], { cx: 0.5, cy: 0.48, r: 0.74 });
      out += `<rect ${full} fill="${v}"/>`;
    }
    if (o.grain > 0) {
      // noise computed once on a seamless 64-unit tile, then repeated
      const id = this.uid('grain'), pid = this.uid('gp');
      this.defs.push(`<filter id="${id}" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="${o.grainFreq || 1.15}" numOctaves="1" seed="${hash(this.id) % 97}" stitchTiles="stitch" result="n"/>` +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  4 0 0 0 -2" result="d"/>' +
        '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -4 0 0 0 2" result="l"/>' +
        '<feMerge><feMergeNode in="d"/><feMergeNode in="l"/></feMerge></filter>' +
        `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="64" height="64"><rect width="64" height="64" fill="#808080" filter="url(#${id})"/></pattern>`);
      out += `<rect ${full} fill="url(#${pid})" opacity="${f2(o.grain)}"/>`;
    }
    return out;
  }
  svg() {
    const fin = this.fin === false ? '' : this.finishSVG();
    return `<svg class="art-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>${this.defs.join('')}</defs>${this.body.join('')}${fin}</svg>`;
  }
}
