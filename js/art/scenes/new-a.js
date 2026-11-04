// Card art for the second half of Week One (cards 46–90). Style rules live
// in ../scenes.js; drawing tools in ../kit.js.
// This file: the new Ember (46–53) and Verdant (54–61) cards.

import { H, W, blob, particles, pines, poly, pt, rays, ridge, rng, spline, taper } from '../kit.js';
import { PAL, arcade, faction, mirror } from './shared.js';

// ── local helpers ───────────────────────────────────────────────────
// Every taper() outline winds the same way (and so do circ() clouds, the
// other way round), so several of one kind can share a `d` and still merge;
// blobs and polys get their own <path>.
const f1 = (n) => (Math.round(n * 10) / 10).toString();
const P = (...ds) => ds.map((d) => `<path d="${d}"/>`).join('');
const E = (cx, cy, rx, ry, rot = 0) => `<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}"${rot ? ` transform="rotate(${f1(rot)} ${f1(cx)} ${f1(cy)})"` : ''}/>`;
const C = (cx, cy, r) => `<circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(r)}"/>`;
const G = (tr, inner) => `<g transform="${tr}">${inner}</g>`;
// A circle as a clockwise subpath, so a cloud of them can be one path.
const circ = (cx, cy, r) => `M${f1(cx - r)},${f1(cy)}a${f1(r)},${f1(r)} 0 1 1 ${f1(2 * r)},0a${f1(r)},${f1(r)} 0 1 1 ${f1(-2 * r)},0Z`;
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const rad = (deg) => (deg * Math.PI) / 180;
// A two-part limb a→b→c (hip, knee, ankle or shoulder, elbow, wrist): full at
// the top, narrow at the joint, a swell of calf or forearm below it.
const limb = (a, b, c, w0, wk, w1) => taper([a, lerp(a, b, 0.5), b, lerp(b, c, 0.4), c], [w0, w0 * 0.86, wk, wk * 1.1, w1]);

// A flame tongue rising from (x, y): height h, base width w, tip pushed sideways by `lean`.
const tongue = (x, y, h, w, lean = 0, wob = 0, per = 8) =>
  taper([[x, y], [x + lean * 0.25 + wob, y - h * 0.35], [x + lean * 0.6 - wob, y - h * 0.7], [x + lean, y - h]], [w, w * 0.8, w * 0.42, 0.4], { per });
// A flame tongue along any direction (degrees), its tip flicking to one side.
const lick = (x, y, deg, L, w, flick = 0.3) => {
  const a = rad(deg), ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const at = (t, o) => [x + ux * L * t + nx * o, y + uy * L * t + ny * o];
  return taper([[x, y], at(0.35, w * 0.25), at(0.7, -w * 0.2), at(1, L * flick * 0.3)], [w, w * 0.8, w * 0.42, 0.4], { per: 6 });
};
// A ragged band of tongues along a baseline, as one path.
function flameWall({ seed, base, x0 = -14, x1 = W + 14, h = [20, 50], w = [8, 16], lean = 0, gap = [5, 10] }) {
  const r = rng(seed);
  let d = '';
  for (let x = x0; x < x1; x += gap[0] + r() * (gap[1] - gap[0])) {
    const hh = h[0] + r() * (h[1] - h[0]);
    d += tongue(x, base + r() * 3, hh, w[0] + r() * (w[1] - w[0]), (lean * hh) / h[1] + (r() - 0.5) * 6, (r() - 0.5) * 5, 4);
  }
  return d + `M${x0},${base}L${x0},${base + 16}L${x1},${base + 16}L${x1},${base}Z`;
}
// Animated sparks scattered along a segment a→b.
function trail(seed, a, b, n, { spread = 5, r = [0.4, 1.2], fill = '#ffd27a', cls = 'rise', t = [1.6, 3.6], op = [0.5, 1] } = {}) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const k = R(), x = a[0] + (b[0] - a[0]) * k + (R() - 0.5) * 2 * spread, y = a[1] + (b[1] - a[1]) * k + (R() - 0.5) * 2 * spread;
    const rr = r[0] + R() * (r[1] - r[0]), o = op[0] + R() * (op[1] - op[0]), dur = t[0] + R() * (t[1] - t[0]);
    out += `<circle class="${cls}" style="--t:${f1(dur)}s;--d:${f1(-R() * dur)}s;--o:${f1(o)}" cx="${f1(x)}" cy="${f1(y)}" r="${f1(rr)}" fill="${fill}" opacity="${f1(o)}"/>`;
  }
  return out;
}
// A rocky edge: the polyline through pts, each segment broken into `k` jittered steps.
function crag(seed, pts, j = 4, k = 3) {
  const r = rng(seed);
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    for (let s = 1; s <= k; s++) {
      const q = lerp(pts[i - 1], pts[i], s / k);
      out.push(s === k ? pts[i] : [q[0] + (r() - 0.5) * 2 * j, q[1] + (r() - 0.5) * 2 * j]);
    }
  }
  return out;
}
// A city skyline on a baseline: blocks with flat, gabled, domed and spired roofs.
function skyline({ seed, base, x0, x1, h = [10, 30], w = [8, 18], spire = 0.22, dome = 0.14 }) {
  const r = rng(seed);
  let d = '';
  for (let x = x0; x < x1;) {
    const bw = w[0] + r() * (w[1] - w[0]), bh = h[0] + r() * (h[1] - h[0]), top = base - bh, q = r();
    d += `M${f1(x)},${base}L${f1(x)},${f1(top)}`;
    if (q < spire) d += `L${f1(x + bw * 0.3)},${f1(top)}L${f1(x + bw * 0.5)},${f1(top - bh * 0.8)}L${f1(x + bw * 0.7)},${f1(top)}`;
    else if (q < spire + dome) d += `A${f1(bw / 2)},${f1(bw * 0.6)} 0 0 1 ${f1(x + bw)},${f1(top)}`;
    else if (q < 0.72) d += `L${f1(x + bw / 2)},${f1(top - bw * 0.42)}`;
    d += `L${f1(x + bw)},${f1(top)}L${f1(x + bw)},${base}Z`;
    x += bw + (r() < 0.3 ? 2 + r() * 5 : -r() * 3);
  }
  return d;
}
// A crescent swept around (cx, cy): outer edge on the ellipse, inner edge at
// k0 of it at angle a0 widening to k1 at a1 (a motion smear, fresh end at a1).
function crescent(cx, cy, rx, ry, a0, a1, k0, k1, { n = 30, ease = 1.6, out = 1 } = {}) {
  const o = [], inn = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = rad(a0 + (a1 - a0) * t), k = k0 + (k1 - k0) * Math.pow(t, ease);
    o.push([cx + rx * out * Math.cos(a), cy + ry * out * Math.sin(a)]);
    inn.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
  }
  return poly([...o, ...inn.reverse()]);
}

// An uneven rounded stone. `d` is its outline; `arc(a0, a1)` is the stretch of
// that outline between two angles (degrees, 0 = right, 90 = down), as a line.
function stone(cx, cy, rx, ry, seed, n = 9) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.35, k = 0.86 + r() * 0.22;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  const sm = spline(pts, 5, true);
  const ang = (q) => ((Math.atan2(q[1] - cy, q[0] - cx) * 180) / Math.PI + 360) % 360;
  return {
    d: poly(sm),
    arc(a0, a1) {
      const lo = ((a0 % 360) + 360) % 360, span = a1 - a0;
      const inside = (q) => ((ang(q) - lo + 360) % 360) <= span;
      let start = sm.findIndex((q, i) => inside(q) && !inside(sm[(i - 1 + sm.length) % sm.length]));
      if (start < 0) start = 0;
      const run = [];
      for (let i = 0; i < sm.length; i++) { const q = sm[(start + i) % sm.length]; if (!inside(q)) break; run.push(q); }
      return run.length > 1 ? poly(run, false) : '';
    },
  };
}

// Soft woodland: round crowns of uneven size whose tops follow a slow wave,
// traced as one outline. `prof(x)` scales heights across the layer.
function woods({ seed, base, top, x0 = -12, x1 = W + 12, r0 = 8, r1 = 16, prof = null }) {
  const r = rng(seed);
  const ph1 = r() * 7, ph2 = r() * 7;
  const crowns = [];
  for (let x = x0; x <= x1;) {
    const rr = r0 + r() * (r1 - r0);
    let w = 0.55 + 0.27 * Math.sin(x / 43 + ph1) + 0.16 * Math.sin(x / 15 + ph2) + (r() - 0.5) * 0.2;
    if (prof) w = prof(x) < 0 ? prof(x) : w * prof(x);
    w = Math.max(-2, Math.min(1, w));
    const y = base - (base - top) * w;
    crowns.push([x, y + rr, rr]);
    if (r() < 0.75) {
      const a = (r() < 0.5 ? -1 : 1) * (0.42 + r() * 0.3), pr = rr * (0.38 + r() * 0.2);
      crowns.push([x + a * rr, y + rr - Math.sqrt(1 - a * a) * rr + pr * 0.5, pr]);
    }
    x += rr * (0.6 + r() * 0.35);
  }
  const pts = [];
  for (let x = x0 - r1; x <= x1 + r1; x += 1.5) {
    let y = H + 8;
    for (const [cx, cy, rr] of crowns) {
      const dx = x - cx;
      if (Math.abs(dx) < rr) y = Math.min(y, cy - Math.sqrt(rr * rr - dx * dx));
    }
    pts.push([x, y]);
  }
  return `M${f1(x0 - r1)},${H + 8}L` + pts.map(pt).join('L') + `L${f1(x1 + r1)},${H + 8}Z`;
}
// A lens-shaped leaf from (x, y) pointing along angle a (radians).
const leaf = (x, y, a, len, wid) => {
  const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux;
  const m = (k) => pt([x + ux * len * 0.5 + nx * wid * k, y + uy * len * 0.5 + ny * wid * k]);
  return `M${pt([x, y])}Q${m(1)} ${pt([x + ux * len, y + uy * len])}Q${m(-1)} ${pt([x, y])}Z`;
};
// A vine growing from a towards b, ending in a curl, with leaves along it.
function vine(a, b, { bend = 0.18, curl = 8, turns = 1.15, w = 6, side = 1, leaves = 3, lr = 9 } = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy);
  const ux = dx / L, uy = dy / L, nx = -uy * side, ny = ux * side;
  const at = (t) => { const o = L * bend * Math.sin(Math.PI * t); return [a[0] + dx * t + nx * o, a[1] + dy * t + ny * o]; };
  const pts = [a, at(0.33), at(0.66), b];
  const cx = b[0] + nx * curl, cy = b[1] + ny * curl;
  const a0 = Math.atan2(b[1] - cy, b[0] - cx);
  const dir = -Math.sin(a0) * ux + Math.cos(a0) * uy >= 0 ? 1 : -1;
  for (let k = 1; k <= 8; k++) {
    const t = k / 8, ang = a0 + dir * t * turns * 2 * Math.PI, rr = curl * (1 - 0.65 * t);
    pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
  }
  let d = taper(pts, [w, w * 0.78, w * 0.6, w * 0.42, w * 0.3, w * 0.2, 0.6]);
  for (let i = 0; i < leaves; i++) {
    const t = 0.22 + (0.56 * i) / Math.max(1, leaves - 1);
    const p0 = at(t), p1 = at(t + 0.02);
    d += leaf(p0[0], p0[1], Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (i % 2 ? 1 : -1) * 0.95, lr, lr * 0.55);
  }
  return d;
}
// Little bird in flight (one subpath).
const bird = (x, y, k) => `M${f1(x)},${f1(y)}c${f1(2 * k)},${f1(-2.6 * k)} ${f1(4.4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(1.6 * k)},${f1(-2.6 * k)} ${f1(4 * k)},${f1(-2.6 * k)} ${f1(6 * k)},0c${f1(-2 * k)},${f1(-0.8 * k)} ${f1(-4 * k)},0 ${f1(-6 * k)},${f1(2 * k)}c${f1(-2 * k)},${f1(-2 * k)} ${f1(-4 * k)},${f1(-2.8 * k)} ${f1(-6 * k)},${f1(-2 * k)}Z`;

// ── Ember ───────────────────────────────────────────────────────────

const emberScenes = {
  scorch(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#0b0303'], [0.35, '#240806'], [0.6, '#4e170c'], [0.8, '#3a110a'], [1, '#160605']]));
    // the far end of the ravine, glowing
    s.glow(204, 86, 150, '#ff5a1a', 0.38);
    // far walls, lit from the gap and softened by distance
    const farL = poly([[-10, -10], ...crag(301, [[92, -10], [104, 34], [122, 66], [148, 98], [168, 126], [178, 214]], 5), [-10, 214]]);
    const farR = poly([[310, -10], ...crag(302, [[288, -10], [282, 30], [270, 62], [258, 92], [238, 122], [222, 214]], 5), [310, 214]]);
    s.layer(farL + farR, s.linU(0, 0, 0, 210, [[0, '#2a0c07'], [0.5, '#5a1d0f'], [1, '#3a110a']]), { blur: 0.7 });
    s.add('<path d="M108,40L96,52M130,78L112,90M150,104L134,118M276,40L288,56M262,74L280,88M248,104L264,120" stroke="#7a2a14" stroke-width="1.2" fill="none" opacity=".55"/>');
    s.haze(80, 150, '#ff6a1f', 0.22);
    // near walls, black against the gap
    const nearL = poly([[-10, -10], ...crag(303, [[34, -10], [40, 40], [30, 80], [44, 120], [36, 160], [50, 214]], 6), [-10, 214]]);
    const nearR = poly([[310, -10], ...crag(304, [[276, -10], [284, 36], [292, 70], [282, 112], [270, 128], [286, 146], [282, 214]], 5), [310, 214]]);
    s.figure(P(nearL, nearR), { fill: '#120504', rim: '#a8461b', offsets: [[1, 0], [-1, 0]], rimOp: 0.55 });
    // the wolf, mid-leap off the far ledge, snarling
    const wolf = [
      taper([[-2, 2], [14, -4], [30, -8], [46, -12], [56, -14]], [27, 25, 18, 15, 17]),
      taper([[2, -2], [-8, -10], [-16, -16]], [22, 17, 13]),
      taper([[-22, -22], [-33, -21], [-43, -18]], [11, 7.5, 4]),
      taper([[-22, -15], [-31, -10], [-39, -6]], [7, 5, 2.6]),
      taper([[-15, -25], [-9, -30], [-3, -31]], [7.5, 4, 0.5]) + taper([[-19, -26], [-14, -31], [-9, -33]], [6, 3.4, 0.4]),
      taper([[-4, -15], [0, -21], [3, -23]], [8, 3.6, 0.4]) + taper([[5, -11], [10, -17], [14, -19]], [8, 3.6, 0.4]) + taper([[14, -9], [19, -14], [23, -16]], [7, 3, 0.4]),
      taper([[-4, 8], [-16, 15], [-28, 18], [-38, 16]], [11, 7.5, 5, 4]) + taper([[4, 10], [-6, 21], [-16, 28], [-26, 29]], [10, 7, 4.5, 3.6]),
      taper([[50, -6], [61, 0], [68, 7], [76, 11]], [16, 10, 6, 4]) + taper([[46, -4], [54, 8], [60, 17], [67, 22]], [14, 8.5, 5, 3.6]),
      taper([[58, -16], [67, -22], [76, -24], [82, -22]], [9, 11, 9, 2]),
    ].join('');
    s.figure(G('translate(194 82) scale(.9)', P(wolf) + E(-20, -19, 9.5, 8, -10)),
      { fill: '#0e0403', rim: '#ffb04a', offsets: [[-1.1, 0.9], [0, -1.2], [1.1, 0]], rimOp: 0.95, shade: 0.5, light: [-1, 1], halo: { op: 0.45, sd: 2.6 } });
    s.add('<ellipse cx="173.3" cy="62.7" rx="1.8" ry="1" fill="#ffd27a" transform="rotate(-20 173.3 62.7)"/>');
    // the bolt: white-hot, the brightest thing in the ravine
    const A = [94, 152], B = [152, 110];
    const ang = (Math.atan2(B[1] - A[1], B[0] - A[0]) * 180) / Math.PI;
    const path = (w) => taper([A, [A[0] + (B[0] - A[0]) * 0.35 - 1.5, A[1] + (B[1] - A[1]) * 0.35 - 2], [A[0] + (B[0] - A[0]) * 0.7 + 1, A[1] + (B[1] - A[1]) * 0.7 + 1.5], B], w);
    s.glow(B[0], B[1], 52, '#ffb04a', 0.55);
    s.glow((A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 34, '#ff7a2e', 0.35);
    const wisps = [[-170, 22, 6], [168, 20, 5.5], [-150, 14, 4.5], [150, 13, 4]].map(([d, L, w]) => lick(B[0] - 3, B[1] + 1, ang + d, L, w, d > 0 ? 0.4 : -0.4)).join('');
    s.bloom(`<path d="${path([2.5, 7, 12, 16])}${wisps}" fill="#ff6a1f" opacity=".75"/>` +
      `<path d="${path([1.2, 4, 7.5, 10.5])}" fill="#ffb04a"/>${E(B[0], B[1], 11, 8, ang).replace('/>', ' fill="#ffb04a"/>')}` +
      `<path d="${path([0.5, 1.8, 3.6, 5.5])}" fill="#fff2cc"/>${E(B[0] + 1, B[1] - 0.5, 7, 4.6, ang).replace('/>', ' fill="#fffaf0"/>')}`,
    { sd: 2.2, k: 1.5, box: [60, 70, 130, 110] });
    // the hand that flicked it, fingers still spread
    const hand = P(
      blob([[0, -8], [10, -10], [22, -9], [25, -2], [24, 6], [14, 10], [2, 9], [-2, 2]]),
      taper([[6, -8], [12, -16], [18, -21], [24, -24]], [6.5, 5, 4, 3]) +
      taper([[22, -7], [33, -10], [44, -12]], [5, 4.2, 3.4]) +
      taper([[24, -2], [36, -2], [47, -1]], [5.2, 4.4, 3.5]) +
      taper([[23, 3], [34, 6], [43, 9]], [4.8, 4, 3.2]) +
      taper([[20, 7], [28, 12], [34, 16]], [4.2, 3.5, 2.8]) +
      taper([[2, 0], [-30, 4], [-80, 10]], [16, 20, 24]) + taper([[-14, 1], [-28, 3]], [22, 24])) +
      C(24, -24, 1.5) + C(44, -12, 1.7) + C(47, -1, 1.75) + C(43, 9, 1.6) + C(34, 16, 1.4);
    s.figure(G('translate(52 182) rotate(-35)', hand),
      { fill: '#0d0403', rim: '#ffd27a', offsets: [[1, -0.9], [0.3, -1.2]], rimOp: 0.95, shade: 0.6, edge: 0.55 });
    s.add(trail(305, A, B, 14, { spread: 6, fill: '#ffe2a0', t: [1.2, 2.6] }));
    s.motes({ seed: 306, n: 14, x: [60, 260], y: [30, 200], r: [0.4, 1], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [5, 9], op: [0.3, 0.8] });
    return s.svg();
  },

  kindle(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#120404'], [0.5, '#2e0d08'], [1, '#43140a']]));
    s.glow(176, 74, 160, '#ff6a1f', 0.42);
    // smoke rolling around the fight, lit from the arc
    const R = rng(311);
    let smoke = '';
    for (const [x, y, r] of [[28, 60, 30], [60, 26, 26], [20, 120, 26], [270, 30, 30], [292, 92, 26], [244, 8, 24], [130, -6, 26], [196, -4, 24], [270, 150, 22], [30, 168, 20]]) {
      smoke += circ(x, y, r);
      for (let i = 0; i < 2; i++) smoke += circ(x + (R() - 0.5) * r * 1.4, y + (R() - 0.5) * r, r * (0.45 + R() * 0.3));
    }
    s.blur(`<path d="${smoke}" fill="${s.radU(176, 92, 170, [[0, '#8a3416', 0.9], [0.45, '#4e1a0d', 0.8], [1, '#1c0806', 0.9]])}"/>`, 3.2);
    s.path(ridge({ seed: 312, base: 186, amp: 14, freq: 2.6 }), '#2a0d08');
    s.add(`<ellipse cx="160" cy="188" rx="110" ry="12" fill="${s.rad([[0, '#ff8a3a', 0.4], [1, '#ff8a3a', 0]])}"/>`);
    s.path('M-10,214L-10,190C60,186 120,188 180,189C230,190 270,187 310,190L310,214Z', '#120504');
    // the arc of fire the blade leaves behind it
    const cx = 150, cy = 114, rx = 98, ry = 82, a0 = -200, a1 = 9;
    const arcFill = s.linU(50, 0, 250, 0, [[0, '#ff5a1a', 0.15], [0.45, '#ff7a2e', 0.75], [1, '#ffb04a']]);
    // tongues streaming off the outer edge, back along the stroke
    let licks = '';
    for (let i = 0; i < 8; i++) {
      const t = 0.3 + i * 0.09, ar = rad(a0 + (a1 - a0) * t);
      const x = cx + rx * 0.97 * Math.cos(ar), y = cy + ry * 0.97 * Math.sin(ar);
      const tx = rx * Math.sin(ar), ty = -ry * Math.cos(ar), tl = Math.hypot(tx, ty);
      const dir = (Math.atan2(ty / tl * 0.8 + Math.sin(ar) * 0.6, tx / tl * 0.8 + Math.cos(ar) * 0.6) * 180) / Math.PI;
      licks += lick(x, y, dir, 12 + t * 18, 5 + t * 6, i % 2 ? 0.5 : -0.4);
    }
    s.bloom(`<path d="${crescent(cx, cy, rx, ry, a0, a1, 0.985, 0.6, { out: 1.05, ease: 1.4 })}" fill="${arcFill}" opacity=".7"/><path d="${licks}" fill="${arcFill}" opacity=".85"/>` +
      `<path d="${crescent(cx, cy, rx, ry, a0 + 40, a1, 0.99, 0.7, { ease: 1.8 })}" fill="${s.linU(80, 0, 250, 0, [[0, '#ff9a3a', 0.2], [0.6, '#ffc25a', 0.9], [1, '#ffe7a3']])}"/>` +
      `<path d="${crescent(cx, cy, rx * 0.985, ry * 0.985, a0 + 120, a1, 0.995, 0.86, { ease: 2 })}" fill="#fff4d8" opacity=".9"/>`,
    { sd: 2.4, k: 1.3, box: [20, 0, 270, 170] });
    s.glow(236, 112, 44, '#ffd27a', 0.6);
    // the warrior, lunging into the stroke
    const body = [
      limb([154, 131], [178, 150], [186, 182], 14, 8.5, 6),
      limb([145, 133], [124, 158], [102, 180], 13, 8, 5.5),
      taper([[183, 183], [196, 186]], [6.5, 3.6]) + taper([[104, 181], [93, 185]], [6, 3.4]),
      taper([[151, 128], [153, 118], [157, 106], [161, 97]], [15, 11.5, 17, 19]),
      taper([[163, 92], [166, 86]], [6.5, 6.5]),
      taper([[162, 76], [151, 73], [139, 74], [128, 71], [119, 72]], [7, 6, 4.6, 2.6, 0.5]),
      limb([166, 98], [180, 108], [192, 115], 7.5, 5.6, 4.6),
      limb([157, 100], [173, 114], [189, 118], 7, 5.4, 4.4),
      taper([[184, 115.5], [194, 117.5]], [3.6, 3.6]) + taper([[198, 110.5], [196, 124.5]], [3, 3]),
    ].join('');
    const skirt = poly([[144, 124], [160, 122], [166, 134], [163, 143], [154, 140], [146, 145], [138, 141], [131, 146], [132, 136], [139, 128]]);
    const cape = poly([[161, 93], [150, 97], [136, 103], [121, 108], [106, 115], [112, 119], [101, 126], [118, 124], [132, 120], [145, 114], [155, 106]]);
    s.figure(P(body, skirt, cape) + C(168, 81, 7) + E(171.5, 85, 4, 3, 20) + C(193, 116.5, 4) + C(183, 115.5, 2.4),
      { fill: '#0e0403', rim: '#ffb04a', offsets: [[1.2, -0.6], [0.2, -1.3], [-1, -0.6]], rimOp: 0.95, shade: 0.55, light: [1, -0.5] });
    // the blade itself, burning white
    s.add(`<path d="${taper([[197, 118.5], [222, 122.5], [246, 126.5]], [3.4, 2.6, 0.6])}" fill="#fff4d8"/>`);
    s.add(trail(313, [120, 30], [250, 120], 22, { spread: 14, fill: '#ffc46a', t: [2, 4] }));
    s.motes({ seed: 314, n: 12, x: [40, 270], y: [40, 200], r: [0.4, 1], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [5, 9], op: [0.3, 0.7] });
    return s.svg();
  },

  'ember-duelist'(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#0a0303'], [0.34, '#200806'], [0.56, '#5e1d0d'], [0.7, '#b8481c'], [0.76, '#c9581f'], [0.86, '#5a1b0d'], [1, '#1e0806']]));
    s.glow(96, 146, 170, '#ff6a1f', 0.45);
    s.add('<g fill="#ffd9b0">' + [[30, 14], [70, 30], [118, 10], [232, 18], [270, 40], [252, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r=".7" class="twinkle" style="--t:4s;--d:-${(x % 7) / 2}s;--o:.5" opacity=".5"/>`).join('') + '</g>');
    // smoke climbing out of the city, lit from beneath
    let smoke = '';
    for (const [x0, y0, k] of [[46, 140, 1], [118, 146, 0.8], [252, 142, 0.9]]) {
      for (let i = 0; i < 8; i++) smoke += circ(x0 + (i * 6 + i * i * 1.1) * k, y0 - i * 17 * k, (6 + i * 3.4) * k);
    }
    s.add(`<path class="drift" d="${smoke}" fill="${s.lin([[0, '#1c0806', 0.75], [0.6, '#3a140b', 0.6], [1, '#8a3416', 0.5]])}"/>`);
    // the city far below: towers and domes against its own fire
    s.layer(skyline({ seed: 321, base: 158, x0: -12, x1: 312, h: [12, 34], w: [8, 17] }), '#4a170b', { blur: 0.6 });
    s.add(`<path d="${flameWall({ seed: 322, base: 152, x0: 6, x1: 90, h: [8, 22], w: [6, 11], lean: 4, gap: [4, 8] })}${flameWall({ seed: 323, base: 152, x0: 210, x1: 290, h: [6, 18], w: [6, 10], lean: 4, gap: [4, 8] })}" fill="${s.lin([[0, '#ff6a1f', 0.2], [0.5, '#ffa040', 0.9], [1, '#ffd27a']])}"/>`);
    s.haze(118, 150, '#ff7a2e', 0.3);
    // the balustrade behind her and the balcony floor
    let bal = 'M-10,155L310,155L310,161L-10,161Z M-10,177L310,177L310,183L-10,183Z';
    for (let x = 2; x < 304; x += 11) bal += taper([[x, 177], [x, 161]], [6.5, 5], { bulge: 0.4 });
    s.figure(P(bal), { fill: '#2a0d08', rim: '#ff8a3a', offsets: [[0, -1]], rimOp: 0.7 });
    s.path('M-10,214L-10,182L310,182L310,214Z', s.lin([[0, '#24090a'], [1, '#0c0303']]));
    // the duelist: long coat streaming, salute raised
    const hem = [[228, 173], [216, 170], [208, 177], [199, 168], [191, 175], [185, 161]];
    const coat = poly([[163, 107], [179, 105], [188, 120], [199, 138], [213, 156], ...hem, [179, 145], [176, 128]]);
    const flap = poly([[164, 108], [172, 111], [170, 128], [166, 146], [158, 141], [161, 124]]);
    const limbs = [
      taper([[172, 80], [173, 95], [172, 111]], [18, 14, 12]),
      taper([[171, 74], [172, 81]], [5, 6]),
      taper([[177, 82], [181, 70]], [6.5, 1.5]),
      taper([[175, 63], [185, 61], [195, 66]], [5.5, 3.8, 0.5]),
      limb([168, 112], [162, 148], [157, 182], 11, 7.5, 6.5),
      limb([176, 112], [180, 148], [184, 183], 11, 7.5, 6.5),
      taper([[157, 184], [147, 186.5]], [5.5, 3.4]) + taper([[184, 185], [193, 187.5]], [5.5, 3.4]),
      limb([166, 84], [153, 96], [157, 79], 7, 5.5, 4.6),
      limb([178, 84], [191, 97], [180, 109], 7, 5.5, 4.6),
      taper([[150, 74.5], [163, 73.5]], [2.4, 2.4]),
    ].join('');
    s.figure(P(coat, flap, limbs) + C(170, 67, 6.8) + E(166.5, 70.5, 3.6, 2.6, -20) + C(157, 78, 3.4) + C(157, 84, 1.8),
      { fill: '#0d0403', rim: p.rim, offsets: [[-1.2, 0.2], [-0.6, -1.1], [1, -0.8]], rimOp: 0.9, shade: 0.5, light: [-1, 0.4], halo: { op: 0.4, sd: 2.4 } });
    // the scorched hem still smoulders
    s.add(`<path d="${poly(hem, false)}" stroke="#ff8a3a" stroke-width="1.2" fill="none" stroke-linejoin="round" opacity=".85"/>`);
    // the rapier, red-hot
    s.add(`<ellipse cx="155" cy="44" rx="9" ry="36" fill="${s.rad([[0, '#ff6a1f', 0.45], [0.6, '#ff6a1f', 0.12], [1, '#ff6a1f', 0]])}"/>`);
    s.bloom(`<path d="${taper([[157, 73], [155, 40], [153, 12]], [2.6, 2, 0.5])}" fill="#ff7a2e"/><path d="${taper([[157, 72], [155, 40], [153.3, 16]], [1.1, 0.9, 0.3])}" fill="#fff0c4"/>`,
      { sd: 1.6, k: 1.6, box: [130, -5, 50, 100] });
    s.add(particles({ seed: 324, n: 22, x: [0, W], y: [70, 200], r: [0.5, 1.3], fill: '#ffb05a', cls: 'rise', t: [4, 8], op: [0.4, 0.9] }));
    return s.svg();
  },

  mutiny(s) {
    const p = PAL.ember;
    s.rect(s.lin([[0, '#100303'], [0.36, '#33100a'], [0.58, '#7a2a12'], [0.7, '#c4541f'], [0.78, '#7a2a12'], [1, '#160605']]));
    s.glow(90, 134, 170, '#ff6a1f', 0.48);
    // smoke from the camp fires
    let smoke = '';
    for (const [x0, y0, k] of [[30, 134, 1], [140, 130, 0.8]]) {
      for (let i = 0; i < 8; i++) smoke += circ(x0 + (i * 7 + i * i * 1.2) * k, y0 - i * 17 * k, (6 + i * 3.6) * k);
    }
    s.add(`<path class="drift" d="${smoke}" fill="${s.lin([[0, '#1a0706', 0.8], [0.6, '#3a140b', 0.6], [1, '#8a3416', 0.45]])}"/>`);
    s.layer(ridge({ seed: 331, base: 150, amp: 12, freq: 2.4 }), '#5a1d0f', { blur: 0.6 });
    // the army: rank on rank of spears, all still facing the way he was going
    const rank = (seed, base, x0, x1, k, gap) => {
      const r = rng(seed);
      let body = '', heads = '';
      for (let x = x0; x < x1; x += gap * (0.8 + r() * 0.4)) {
        const y = base + r() * 2 * k, lean = (r() - 0.5) * 2 * k;
        body += taper([[x - 1.6 * k, y], [x - 1.2 * k, y - 9 * k]], [3 * k, 3.4 * k], { per: 2 }) + taper([[x + 1.6 * k, y], [x + 1.2 * k, y - 9 * k]], [3 * k, 3.4 * k], { per: 2 }) +
          taper([[x, y - 9 * k], [x + 0.6 * k, y - 19 * k]], [7.4 * k, 6.8 * k], { per: 2 }) + taper([[x + 4 * k, y - 7 * k], [x + 4 * k, y - 18 * k]], [5.5 * k, 5.5 * k], { per: 2 }) +
          taper([[x - 2.5 * k, y - 4 * k], [x - 2 * k + lean, y - 44 * k]], [1.1 * k, 0.9 * k], { per: 2 }) + taper([[x - 2 * k + lean, y - 43 * k], [x - 2 * k + lean * 1.05, y - 49 * k]], [2.4 * k, 0.2], { per: 2 });
        heads += circ(x + 1 * k, y - 22 * k, 2.8 * k) + circ(x + 0.6 * k, y - 23.5 * k, 3 * k);
      }
      return { body, heads };
    };
    const back = rank(332, 147, -10, 160, 0.55, 7.5);
    s.add(`<g fill="#3e130a"><path d="${back.body}"/><path d="${back.heads}"/></g>`);
    s.haze(118, 150, '#ff7a2e', 0.25);
    const front = rank(333, 162, -14, 150, 0.82, 10.5);
    const banner = (x, y, h, k) => taper([[x, y], [x, y - h]], [1.4, 1.2]) + `M${x},${y - h}L${x + 16 * k},${y - h + 1}L${x + 12 * k},${y - h + 6 * k}L${x + 16 * k},${y - h + 11 * k}L${x},${y - h + 11 * k}Z`;
    s.add(`<g fill="#1e0807"><path d="${front.body}"/><path d="${front.heads}"/><path d="${banner(34, 160, 64, 1.1) + banner(108, 158, 58, 1)}"/></g>`);
    s.path('M-10,214L-10,166C40,160 100,160 150,163C200,166 250,170 310,172L310,214Z', '#140504');
    // the soldier, turned on his own, spear levelled at them
    const body = [
      limb([203, 130], [190, 156], [181, 185], 13, 8, 7),
      limb([211, 130], [222, 157], [233, 185], 13, 8, 7),
      taper([[181, 187], [170, 190]], [6.5, 4]) + taper([[233, 187], [243, 190]], [6.5, 4]),
      taper([[207, 126], [206, 116], [204, 102], [204, 93]], [14, 12.5, 20, 21]),
      taper([[203, 90], [202, 85]], [7, 7]),
      taper([[193, 71], [202, 66], [212, 68], [221, 75], [225, 86]], [3, 6, 6, 4, 1]),
      limb([199, 96], [189, 110], [180, 120], 8.5, 6.2, 5.4),
      limb([211, 96], [222, 106], [218, 116], 8.5, 6.2, 5.4),
      taper([[256, 110], [190, 118.5], [128, 126.3]], [3, 2.8, 2.4]),
      taper([[194, 82], [189, 84]], [3, 2]) + taper([[205, 83], [211, 88]], [6, 3]),
    ].join('');
    const skirt = poly([[196, 121], [217, 121], [221, 137], [216, 134], [213, 141], [208, 135], [203, 142], [199, 135], [193, 139]]);
    const cloak = blob([[207, 89], [224, 91], [239, 99], [251, 113], [259, 130], [251, 128], [245, 136], [237, 130], [229, 138], [223, 127], [215, 110]]);
    s.figure(P(body, skirt, cloak) + C(200, 80, 8.2) + C(180, 120, 4) + C(218, 116, 4),
      { fill: '#0c0403', rim: p.rim, offsets: [[-1.2, -0.3], [-0.4, -1.2], [0.8, -0.8]], rimOp: 0.9, shade: 0.55, light: [-1, -0.2], halo: { op: 0.35, sd: 2.4 } });
    // eyes gone to embers
    s.glow(195, 80, 10, '#ff3a1a', 0.85);
    s.add('<ellipse cx="195" cy="80" rx="2.2" ry="1.2" fill="#ffcf6a"/>');
    // the spear's burning head
    s.glow(126, 124, 40, '#ffb04a', 0.6, 'breathe');
    s.bloom(`<path d="${lick(132, 126, 168, 30, 12, 0.6)}${lick(130, 124, 190, 22, 8, -0.5)}" fill="${s.lin([[0, '#ff6a1f', 0.6], [1, '#ffb04a']], { x1: 1, y1: 0, x2: 0, y2: 0 })}"/>` +
      `<path d="M118,126.5L132,123.6L131,129Z" fill="#ffe7a3"/><path d="${lick(130, 126, 175, 14, 5, 0.4)}" fill="#fff0c4"/>`, { sd: 1.8, k: 1.4, box: [80, 90, 80, 70] });
    s.add(trail(334, [104, 110], [132, 124], 12, { spread: 6, fill: '#ffc46a', t: [1.6, 3] }));
    s.motes({ seed: 335, n: 14, x: [0, W], y: [60, 200], r: [0.4, 1], fill: '#ff9a3a', hot: '#ffe2a0', cls: 'rise', t: [5, 9], op: [0.3, 0.7] });
    return s.svg();
  },

  'molten-berserker'(s) {
    s.rect(s.lin([[0, '#110404'], [0.38, '#360f09'], [0.6, '#862f13'], [0.72, '#c9581f'], [0.76, '#a8441a'], [1, '#2a0c07']]));
    s.glow(168, 112, 140, '#ff7a2e', 0.42);
    // ash blowing across the sky
    let ash = '';
    for (const [x, y, r] of [[30, 34, 22], [64, 22, 18], [236, 18, 24], [270, 36, 20], [200, 6, 16], [6, 64, 16], [110, 4, 14]]) ash += circ(x, y, r);
    s.blur(`<path d="${ash}" fill="#1a0706" opacity=".6"/>`, 4);
    // far cones under the glow, and the plain it is crossing
    s.layer(ridge({ seed: 341, base: 158, amp: 30, peaks: true, freq: 2.6 }), '#5e2213', { blur: 0.7 });
    s.haze(128, 158, '#ff7a2e', 0.3);
    s.path('M-10,214L-10,157C60,155 120,156 180,157C230,158 270,156 310,157L310,214Z', s.lin([[0, '#4a170c'], [0.25, '#2a0c07'], [1, '#0e0403']]));
    // the way it came: footprints still molten, and the ground split under each step
    const prints = [[240, 177, 5.5, 2], [262, 169, 4.4, 1.6], [278, 164, 3.4, 1.3], [291, 161, 2.6, 1]];
    s.add(prints.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ff8a3a" opacity=".85"/><ellipse cx="${x}" cy="${y}" rx="${f1(rx * 0.5)}" ry="${f1(ry * 0.5)}" fill="#ffe08a"/>`).join(''));
    s.add(`<ellipse cx="106" cy="188" rx="40" ry="8" fill="${s.rad([[0, '#ff8a3a', 0.55], [1, '#ff8a3a', 0]])}"/><ellipse cx="226" cy="180" rx="26" ry="5" fill="${s.rad([[0, '#ff8a3a', 0.4], [1, '#ff8a3a', 0]])}"/>`);
    const cracks = 'M106,189L86,195L72,193M106,189L95,201L91,212M106,189L122,199L132,212M106,189L128,191L144,187M106,189L80,187L66,182M226,180L240,187L254,186M226,180L230,192L226,202M226,180L212,186L204,195';
    s.add(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${cracks}" stroke="#ff6a1f" stroke-width="2.6" opacity=".55"/><path d="${cracks}" stroke="#ffd88a" stroke-width=".9"/></g>`);
    // the brute, pitched forward into the charge: all shoulder and fist, head down
    const body = [
      taper([[160, 70], [160, 56]], [11, 0.5]) + taper([[176, 70], [181, 57]], [11, 0.5]) + taper([[189, 79], [197, 69]], [10, 0.5]) + taper([[195, 93], [205, 88]], [8, 0.5]),
      taper([[96, 104], [112, 100]], [6, 4]),
      limb([130, 86], [106, 84], [84, 78], 24, 15, 14),
      limb([184, 90], [204, 114], [214, 138], 22, 14, 13),
      limb([146, 126], [126, 150], [110, 180], 26, 16, 15),
      limb([176, 124], [196, 148], [222, 168], 24, 15, 13),
    ].join('');
    const torso = blob([[112, 104], [118, 88], [134, 76], [154, 68], [174, 67], [190, 77], [197, 96], [191, 114], [177, 128], [156, 134], [136, 130], [120, 120]]);
    s.figure(P(body, torso) + E(104, 110, 10, 9) + E(100, 116, 8, 5) + C(76, 77, 13) + C(218, 143, 12) + E(106, 185, 15, 6) + E(229, 171, 12, 5, 35),
      { fill: '#120504', rim: '#ff9a4a', offsets: [[0, -1.3], [1.1, -0.6], [-1, -0.6]], rimOp: 0.9, shade: 0.5, light: [0.3, -1], edge: 0.35 });
    // molten all the way through: cracks, knuckles, and drops flung off the fists
    const veins = 'M114,112L126,113L137,105L148,113L160,107L172,115L186,110M160,74L156,88L164,95L159,106M178,72L180,86L190,93M100,82L92,78M116,86L108,84M134,150L128,160L132,170M196,146L206,155L212,163M198,110L208,120M160,122L155,129L162,133';
    const fling = [[[62, 70], [50, 64], 2.8], [[60, 84], [46, 88], 2.6], [[68, 92], [58, 102], 2.2], [[52, 76], [38, 76], 1.8], [[232, 148], [246, 154], 2.4], [[230, 138], [246, 132], 2], [[226, 156], [236, 168], 1.8]];
    s.bloom(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${veins}" stroke="#ff6a1f" stroke-width="2.8" opacity=".6"/><path d="${veins}" stroke="#ffe08a" stroke-width="1"/></g>` +
      `<ellipse cx="69" cy="78" rx="6" ry="9" fill="${s.rad([[0, '#ffe7a3'], [0.5, '#ff9a3a', 0.8], [1, '#ff6a1f', 0]])}"/><ellipse cx="225" cy="148" rx="5" ry="8" transform="rotate(-30 225 148)" fill="${s.rad([[0, '#ffe7a3'], [0.5, '#ff9a3a', 0.8], [1, '#ff6a1f', 0]])}"/>` +
      `<path d="${fling.map(([a, b, r]) => taper([a, lerp(a, b, 0.6), b], [0.4, r * 1.3, r * 1.9])).join('')}" fill="#ff9a3a"/><path d="${fling.map(([, b, r]) => circ(b[0], b[1], r)).join('')}" fill="#ffe7a3"/>`,
    { sd: 1.6, k: 1.4, box: [20, 40, 250, 170] });
    s.add('<g fill="#ffe7a3"><ellipse cx="98" cy="109" rx="2.2" ry="1.1" transform="rotate(12 98 109)"/><ellipse cx="106" cy="108" rx="2" ry="1" transform="rotate(12 106 108)"/></g>');
    s.add(particles({ seed: 342, n: 22, x: [50, 280], y: [60, 200], r: [0.5, 1.4], fill: '#ffb05a', cls: 'rise', t: [3, 7] }));
    s.add(particles({ seed: 343, n: 10, x: [0, W], y: [20, 160], r: [0.6, 1.4], fill: '#3a1a12', cls: 'float', t: [6, 10], op: [0.5, 0.9] }));
    return s.svg();
  },

  'the-kiln'(s) {
    s.rect(s.lin([[0, '#0a0303'], [0.5, '#1a0706'], [1, '#2a0b07']]));
    s.glow(150, 140, 170, '#ff6a1f', 0.36);
    // the courtyard: an old arcade, lit only by the kiln
    s.path(arcade({ seed: 351, x0: -10, x1: 310, base: 186, h: 150, bay: 52, col: 14 }),
      s.radU(150, 160, 210, [[0, '#8a3214'], [0.45, '#4a180c'], [1, '#1a0706']]), 'fill-rule="evenodd"');
    // smoke from the vent, lit from beneath, and the shapes rising in it
    let smoke = '';
    for (let i = 0; i < 8; i++) smoke += circ(150 + i * 3 + i * i * 0.7, 62 - i * 11, 7 + i * 4.4);
    s.add(`<path class="drift" d="${smoke}" fill="${s.linU(0, -20, 0, 70, [[0, '#1c0806', 0.55], [0.55, '#5a1e0e', 0.75], [1, '#c4541f', 0.9]])}"/>`);
    // each soul a wisp: a long hollow-eyed face trailing a curl of smoke
    const soulFill = s.linU(0, -10, 0, 60, [[0, '#ffe6c0', 0.6], [1, '#ffb070', 0.05]]);
    const soul = (x, y, k, lean, t, d) => `<g class="float" style="--t:${t}s;--d:${d}s"><path d="${
      taper([[x + lean, y + 34 * k], [x - lean * 0.6, y + 24 * k], [x + lean * 0.4, y + 12 * k], [x, y + 2 * k]], [0.4, 3 * k, 6 * k, 7.6 * k])}" fill="${soulFill}"/>` +
      `<path d="${blob([[x, y - 7 * k], [x + 3.8 * k, y - 2 * k], [x + 3 * k, y + 4 * k], [x, y + 6 * k], [x - 3 * k, y + 4 * k], [x - 3.8 * k, y - 2 * k]])}" fill="#ffe6c0" opacity=".45"/>` +
      `<g fill="#4a160b" opacity=".7">${E(x - 1.5 * k, y - 1.5 * k, 0.8 * k, 1.7 * k, 10)}${E(x + 1.5 * k, y - 1.5 * k, 0.8 * k, 1.7 * k, -10)}${E(x, y + 3 * k, 0.8 * k, 1.4 * k)}</g></g>`;
    s.add(soul(138, 30, 1.05, -6, 7, -1) + soul(167, 14, 0.9, 7, 8, -4) + soul(148, -2, 0.75, -5, 9, -6));
    // the floor, lit in front of the mouth
    s.path('M-10,214L-10,186L310,186L310,214Z', s.lin([[0, '#2a0c07'], [1, '#0e0403']]));
    s.add(`<ellipse cx="150" cy="192" rx="100" ry="15" fill="${s.rad([[0, '#ff9a3a', 0.55], [0.5, '#ff7a2e', 0.2], [1, '#ff7a2e', 0]])}"/>`);
    s.add('<path d="M-60,214L68,186M20,214L104,186M96,214L136,186M204,214L164,186M280,214L196,186M360,214L232,186M-10,197H310M-10,207H310" stroke="#120504" stroke-width="1.2" opacity=".7"/>');
    // the kiln: a beehive of fired stone, hot through
    const dome = 'M82,187C82,130 106,80 150,76C194,80 218,130 218,187Z';
    s.figure(P(dome, 'M139,80L140,66L160,66L161,80Z', 'M135,67L165,67L165,62L135,62Z'),
      { fill: s.radU(150, 182, 120, [[0, '#7a2a12'], [0.45, '#4a180c'], [1, '#1e0806']]), rim: '#ff9a4a', offsets: [[0, -1.1]], rimOp: 0.45 });
    // courses of stone, some joints leaking light
    const clip = s.uid('clip');
    s.defs.push(`<clipPath id="${clip}"><path d="${dome}"/></clipPath>`);
    const R = rng(352);
    let courses = '', joints = '', leaks = '';
    const ys = [174, 161, 148, 135, 122, 110, 98, 87];
    ys.forEach((y, i) => {
      courses += `M70,${y}Q150,${f1(y + (y - 122) * 0.12)} 230,${y}`;
      const top = i + 1 < ys.length ? ys[i + 1] : 76;
      for (let x = 70 + (i % 2) * 9; x < 232; x += 18) {
        const seg = `M${f1(x)},${y}L${f1(x + (x - 150) * 0.04)},${top}`;
        if (R() < 0.22 && y > 100) leaks += seg; else joints += seg;
      }
    });
    s.add(`<g clip-path="url(#${clip})" fill="none"><path d="${courses}${joints}" stroke="#120504" stroke-width="1.3" opacity=".85"/><path d="${leaks}M96,150L104,146L110,152M196,128L188,134M178,166L186,160L192,166" stroke="#ff8a3a" stroke-width="1.3" opacity=".9"/></g>`);
    // the mouth, white-hot, and the arch of stones around it
    s.glow(150, 166, 70, '#ffb04a', 0.6, 'breathe');
    s.add('<path d="M120,187L120,160A30,30 0 0 1 180,160L180,187" fill="none" stroke="#140504" stroke-width="7"/>');
    s.add('<path d="M120,160L127,160M180,160L173,160M124.5,145L130.5,148.5M175.5,145L169.5,148.5M136,133L139,139M164,133L161,139M150,129.5V136" stroke="#3a140b" stroke-width="1.2"/>');
    s.bloom(`<path d="M126,187L126,160A24,24 0 0 1 174,160L174,187Z" fill="${s.radU(150, 180, 34, [[0, '#fff4d0'], [0.35, '#ffd27a'], [0.7, '#ff8a2e'], [1, '#c4401a']])}"/>` +
      `<path d="${tongue(136, 187, 26, 9, -3, 2)}${tongue(146, 187, 36, 12, 2, -2)}${tongue(157, 187, 31, 10, -3, 2)}${tongue(166, 187, 24, 8, 3, -1)}" fill="${s.lin([[0, '#ff6a1f', 0.5], [0.6, '#ffb04a'], [1, '#ffe7a3']])}"/>` +
      `<path d="${tongue(150, 187, 22, 14, 0, 0)}" fill="#fff4d8"/>`, { sd: 2.2, k: 1.4, box: [100, 120, 100, 80] });
    s.glow(150, 64, 24, '#ffb04a', 0.7, 'breathe');
    s.add('<ellipse cx="150" cy="65" rx="9" ry="2" fill="#ffd27a"/>');
    s.add(particles({ seed: 353, n: 16, x: [130, 180], y: [10, 64], r: [0.5, 1.3], fill: '#ffc46a', cls: 'rise', t: [3, 6] }));
    s.add(particles({ seed: 354, n: 10, x: [110, 190], y: [140, 186], r: [0.4, 1.1], fill: '#ffe2a0', cls: 'rise', t: [2.5, 5] }));
    return s.svg();
  },

  'smoldering-golem'(s) {
    s.rect(s.lin([[0, '#0b0303'], [0.5, '#200806'], [1, '#2e0c07']]));
    // smoke through the broken roof
    let smoke = '';
    for (const [x, y, r] of [[60, 10, 24], [100, 0, 20], [230, 6, 26], [270, 22, 18], [180, -6, 18]]) smoke += circ(x, y, r);
    s.blur(`<path d="${smoke}" fill="#3a140b" opacity=".6"/>`, 4);
    // the forge's back wall, broken off at the top, and its great hearth
    const wall = poly([[-10, 214], ...crag(361, [[-10, 34], [40, 26], [70, 40], [96, 22], [130, 30], [176, 18], [214, 34], [250, 24], [310, 38]], 5, 2), [310, 214]]);
    s.path(wall, s.radU(150, 150, 190, [[0, '#5a1e0e'], [0.55, '#36110a'], [1, '#1a0706']]));
    s.add('<path d="M-10,60H60M240,60H310M-10,88H54M246,88H310M-10,116H50M250,116H310M-10,144H46M254,144H310M20,60V88M44,88V116M14,116V144M36,144V172M262,60V88M284,88V116M268,116V144M290,144V172" stroke="#1a0706" stroke-width="1.2" opacity=".7"/>');
    s.path('M64,187L64,110C64,72 100,52 150,52C200,52 236,72 236,110L236,187Z', '#200807');
    s.glow(150, 160, 110, '#ff7a2e', 0.6);
    s.add(`<path d="M74,187L74,112C74,80 106,63 150,63C194,63 226,80 226,112L226,187Z" fill="${s.radU(150, 186, 130, [[0, '#ffc25a'], [0.3, '#ff8a2e'], [0.65, '#b8441a'], [1, '#4a160b']])}"/>`);
    // a fallen beam and a hanging chain
    s.path(taper([[196, 6], [250, 40], [312, 78]], [9, 9, 10]), '#140504');
    s.add('<path d="M62,-5V48" stroke="#140504" stroke-width="1.6" stroke-dasharray="3 1.4"/><path d="M62,48Q57,54 62,58Q67,58 66,54" stroke="#140504" stroke-width="1.8" fill="none"/>');
    // the floor, an anvil in the foreground, rubble
    s.path('M-10,214L-10,186L310,186L310,214Z', s.lin([[0, '#2a0c07'], [1, '#0d0403']]));
    s.add(`<ellipse cx="150" cy="190" rx="110" ry="12" fill="${s.rad([[0, '#ff8a3a', 0.4], [1, '#ff8a3a', 0]])}"/>`);
    s.figure(P('M14,166L64,166L60,172L50,175L50,184L58,190L18,190L26,184L28,175L22,172C14,171 8,169 2,166Z'),
      { fill: '#0d0403', rim: '#ff8a3a', offsets: [[0.8, -1], [-0.6, -1]], rimOp: 0.7 });
    s.path([[250, 190, 6], [262, 192, 4], [240, 194, 3.5], [84, 194, 4], [272, 188, 3]].map(([x, y, r]) => circ(x, y, r)).join(''), '#0d0403');
    // the golem: hot stones stacked into a body
    // (overlapping, so the body is one cut-out; the seams are drawn on after)
    const st = {
      torso: stone(150, 128, 40, 32, 362), head: stone(151, 91, 16, 12.5, 363),
      shL: stone(110, 106, 17, 15, 364), shR: stone(190, 106, 17, 15, 365),
      arL: stone(101, 132, 12.5, 13, 366), arR: stone(199, 132, 12.5, 13, 367),
      fiL: stone(98, 160, 16, 14, 368), fiR: stone(202, 160, 16, 14, 369),
      lgL: stone(131, 165, 14, 12, 370), lgR: stone(169, 165, 14, 12, 371),
      ftL: stone(126, 184, 17, 7, 372), ftR: stone(174, 184, 17, 7, 373),
    };
    s.figure(P(...Object.values(st).map((q) => q.d)),
      { fill: '#140605', rim: '#ffb04a', offsets: [[0, -1.3], [-1.1, -0.5], [1.1, -0.5]], rimOp: 0.9, shade: 0.45, light: [0, -1], halo: { op: 0.28, sd: 2.6 } });
    // the seams between the stones glow, and the cracks across them
    const seams = st.head.arc(30, 150) + st.shL.arc(-60, 70) + st.shR.arc(110, 240) + st.arL.arc(215, 330) + st.arR.arc(210, 325) +
      st.fiL.arc(215, 325) + st.fiR.arc(215, 325) + st.lgL.arc(215, 325) + st.lgR.arc(215, 325) + st.ftL.arc(210, 330) + st.ftR.arc(210, 330) +
      'M126,118L136,124L132,134L142,141M164,108L169,120L180,125M150,146L156,155M112,98L106,106';
    s.bloom(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${seams}" stroke="#ff6a1f" stroke-width="2.8" opacity=".65"/><path d="${seams}" stroke="#ffd88a" stroke-width="1"/></g>` +
      '<g fill="#ffe7a3"><ellipse cx="145" cy="90" rx="3" ry="1.1" transform="rotate(10 145 90)"/><ellipse cx="157" cy="90" rx="3" ry="1.1" transform="rotate(-10 157 90)"/></g>',
    { sd: 1.6, k: 1.4, box: [70, 60, 160, 140] });
    // steam venting from the seams
    const steam = (x, y, dx, n, r0) => { let d = ''; for (let i = 0; i < n; i++) d += circ(x + dx * i + (i % 2) * 2, y - i * 8, r0 + i * 2.2); return d; };
    s.add(`<path class="drift" d="${steam(146, 100, -2, 5, 2.5) + steam(124, 96, -3, 4, 2) + steam(178, 96, 3, 4, 2) + steam(104, 146, -2.5, 3, 1.6)}" fill="${s.linU(0, 50, 0, 104, [[0, '#ffd6b8', 0], [1, '#ffd6b8', 0.26]])}"/>`);
    s.add(particles({ seed: 374, n: 18, x: [60, 240], y: [40, 190], r: [0.5, 1.3], fill: '#ffb05a', cls: 'rise', t: [4, 8] }));
    return s.svg();
  },

  ashmaw(s) {
    s.rect(s.lin([[0, '#070202'], [0.3, '#1a0605'], [0.56, '#521a0c'], [0.74, '#b0451b'], [0.82, '#d0601f'], [1, '#3a110a']]));
    s.add('<g fill="#ffd9b0">' + [[24, 12], [52, 24], [96, 8], [210, 10], [244, 26], [278, 12], [180, 22], [130, 18]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r=".75" class="twinkle" style="--t:${3 + (i % 3)}s;--d:-${i * 0.7}s;--o:.7" opacity=".6"/>`).join('') + '</g>');
    s.glow(150, 172, 190, '#ff5a1a', 0.5);
    // smoke climbing out of the city, lit from beneath
    let smoke = '';
    for (const [x0, y0, k] of [[34, 150, 1], [266, 150, 1], [110, 156, 0.7], [196, 156, 0.7]]) {
      for (let i = 0; i < 8; i++) smoke += circ(x0 + (i * 4 + i * i * 0.8) * k * (x0 > 150 ? -1 : 1), y0 - i * 18 * k, (6 + i * 3.8) * k);
    }
    s.blur(`<path d="${smoke}" fill="${s.lin([[0, '#140504', 0.85], [0.6, '#3a120a', 0.7], [1, '#9a3a17', 0.6]])}"/>`, 1.4);
    // the wings: membranes lit through by the fire below
    const W0 = [138, 92], wrist = [70, 32], tips = [[14, 16], [4, 58], [20, 100], [54, 124]];
    const scal = (a, b, k = 0.32) => { const m = lerp(a, b, 0.5); return pt(lerp(m, wrist, k)); };
    const memL = `M${pt(W0)}L${pt([112, 70])}L${pt([92, 50])}L${pt(wrist)}L${pt(tips[0])}Q${scal(tips[0], tips[1])} ${pt(tips[1])}Q${scal(tips[1], tips[2])} ${pt(tips[2])}Q${scal(tips[2], tips[3])} ${pt(tips[3])}Q${pt([98, 108])} ${pt([136, 134])}Z`;
    const memR = mirror(memL);
    const memFill = s.radU(150, 176, 190, [[0, '#ffb45a'], [0.3, '#e86a24'], [0.6, '#a8381a'], [0.85, '#5a1a0c'], [1, '#3a0f08']]);
    const edgeL = `M${pt(tips[0])}Q${scal(tips[0], tips[1])} ${pt(tips[1])}Q${scal(tips[1], tips[2])} ${pt(tips[2])}Q${scal(tips[2], tips[3])} ${pt(tips[3])}Q${pt([98, 108])} ${pt([136, 134])}`;
    s.add(`<g fill="${memFill}"><path d="${memL}"/><g transform="rotate(-5 162 92)"><path d="${memR}"/></g></g>`);
    s.add(`<g fill="none" stroke="#ffc46a" stroke-width="1.3" opacity=".7"><path d="${edgeL}"/><path d="${mirror(edgeL)}" transform="rotate(-5 162 92)"/></g>`);
    // the dragon: wing bones, black body, neck reared back
    const bonesL = taper([W0, [112, 70], [92, 50], wrist], [11, 8, 6, 4.5]) + taper([wrist, [64, 22], [62, 15]], [4, 2, 0.4]) +
      tips.map((t, i) => taper([wrist, lerp(lerp(wrist, t, 0.5), [W0[0], 120], 0.08 + i * 0.02), t], [3.4, 2, 0.6])).join('');
    const body = [
      taper([[146, 94], [142, 76], [132, 61], [118, 52], [104, 51]], [29, 23, 18, 16, 15]),
      taper([[97, 52], [84, 56], [67, 63]], [14, 9, 3.6]),
      taper([[97, 61], [86, 70], [73, 80]], [10, 7, 2.8]),
      taper([[106, 47], [118, 36], [134, 31]], [7, 4.4, 0.6]) + taper([[100, 45], [104, 31], [113, 20]], [5.5, 3.6, 0.5]),
      [[136, 66, 124, 70], [128, 58, 118, 60], [146, 80, 136, 82]].map(([x, y, bx, by]) => taper([[x, y], [bx, by - 9]], [5, 0.4])).join(''),
      limb([140, 110], [124, 121], [116, 108], 13, 8.5, 6.5) + taper([[116, 108], [110, 102]], [4, 0.5]) + taper([[116, 108], [108, 108]], [3.6, 0.5]) + taper([[117, 107], [114, 99]], [3.6, 0.5]),
      limb([162, 112], [174, 126], [168, 138], 13, 8.5, 6.5) + taper([[168, 138], [162, 144]], [4, 0.5]) + taper([[168, 138], [170, 146]], [3.6, 0.5]),
      taper([[162, 156], [184, 166], [208, 162], [227, 148], [235, 130], [231, 114], [221, 108]], [22, 16, 12, 8, 5, 3, 0.6]),
    ].join('');
    s.figure(P(bonesL, body, blob([[134, 90], [150, 82], [166, 90], [173, 110], [171, 134], [165, 156], [150, 168], [135, 156], [129, 134], [127, 110]])) +
      G('rotate(-5 162 92)', P(mirror(bonesL))) + E(99, 54, 14, 10.5, 15) + C(141, 160, 13) + C(163, 160, 13),
    { fill: '#0b0303', rim: '#ffab52', offsets: [[0, 1.2], [-1.1, 0.4], [1.1, 0.4], [0, -0.9]], rimOp: 0.9, shade: 0.55, light: [0, 1], halo: { op: 0.5, sd: 3 } });
    // belly plates catching the firelight, a burning eye
    s.add(`<path d="M138,112Q150,116 162,112M137,124Q150,128 163,124M138,136Q150,140 162,136M140,148Q150,152 160,148" stroke="#ff8a3a" stroke-width="1.4" fill="none" opacity=".55"/>`);
    s.add('<path d="M90,50L100,53L91,55Z" fill="#ffe7a3"/>');
    // fire rolling out of its jaws and curling down into the city
    const breath = [[72, 72], [58, 84], [48, 102], [46, 122], [54, 138], [68, 146]];
    const q = spline(breath, 6);
    s.glow(56, 110, 52, '#ffb04a', 0.55);
    const BR = rng(384);
    let outer = '', mid = '', licks = '';
    for (let i = 0; i < q.length; i += 2) {
      const t = i / (q.length - 1), [x, y] = q[i], r = 3 + t * 9 + Math.sin(Math.PI * t) * 5;
      outer += circ(x + (BR() - 0.5) * r * 0.5, y + (BR() - 0.5) * r * 0.5, r);
      mid += circ(x + (BR() - 0.5) * r * 0.3, y + (BR() - 0.5) * r * 0.3, r * 0.6);
    }
    for (let i = 5; i < q.length - 3; i += 4) {
      const [x, y] = q[i], [x2, y2] = q[i + 1], dir = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI, t = i / q.length;
      licks += lick(x - 4, y, dir + 115 + (BR() - 0.5) * 20, 10 + t * 10, 7 + t * 4, 0.5);
    }
    s.bloom(`<path d="${outer}" fill="#ff6a1f" opacity=".9"/><path d="${licks}" fill="#ff7a2e" opacity=".9"/><path d="${mid}" fill="#ffb04a"/>` +
      `<path d="${taper([[73, 72], [62, 81], [54, 93]], [3.5, 5.5, 1.5])}" fill="#fff0c4"/>`,
    { sd: 2.2, k: 1.4, box: [10, 40, 110, 130] });
    // the walled city, tiny beneath it, burning
    s.add(`<path d="${flameWall({ seed: 381, base: 162, h: [10, 36], w: [8, 15], lean: 5, gap: [5, 10] })}" fill="${s.lin([[0, '#ff5a1a', 0.2], [0.5, '#ff9a3a', 0.9], [1, '#ffd27a']])}"/>`);
    s.path(skyline({ seed: 385, base: 164, x0: -10, x1: 310, h: [5, 16], w: [6, 12], spire: 0.3, dome: 0.15 }), '#1e0806');
    const tower = (x, top, w) => `M${x - w / 2},214L${x - w / 2},${top}L${x},${top - w * 1.1}L${x + w / 2},${top}L${x + w / 2},214Z`;
    let walls = 'M-10,214L-10,163';
    for (let x = -10; x < 310; x += 8) walls += `L${x},163L${x},159L${x + 4},159L${x + 4},163`;
    walls += 'L310,163L310,214Z';
    s.figure(P(walls, tower(30, 140, 14), tower(92, 146, 12), tower(208, 146, 12), tower(268, 138, 15)),
      { fill: '#120504', rim: '#ffab52', offsets: [[0, -1.1]], rimOp: 0.85 });
    s.add('<g fill="#ffd27a"><rect x="28.5" y="150" width="3" height="4"/><rect x="90.6" y="154" width="2.8" height="4"/><rect x="206.6" y="154" width="2.8" height="4"/><rect x="266.5" y="148" width="3" height="4"/><rect x="40" y="172" width="2.4" height="3"/><rect x="250" y="174" width="2.4" height="3"/></g>');
    s.add(particles({ seed: 382, n: 30, x: [0, W], y: [40, 200], r: [0.5, 1.5], fill: '#ffb05a', cls: 'rise', t: [4, 8] }));
    s.motes({ seed: 383, n: 10, x: [30, 110], y: [80, 150], r: [0.5, 1.1], fill: '#ffc46a', hot: '#fff0c4', cls: 'rise', t: [3, 6] });
    return s.svg();
  },
};

// ── Verdant ─────────────────────────────────────────────────────────

// Leaves scattered around (x, y) within radius r, pointing every which way.
function leafCluster(seed, pts, n = 6, len = [7, 11]) {
  const R = rng(seed);
  let d = '';
  for (const [x, y, r] of pts) {
    for (let i = 0; i < n; i++) {
      const a = R() * Math.PI * 2, dd = R() * r, L = len[0] + R() * (len[1] - len[0]);
      d += leaf(x + Math.cos(a) * dd, y + Math.sin(a) * dd, a + (R() - 0.5) * 0.8, L, L * 0.5);
    }
  }
  return d;
}
// A twig that forks as it goes: a gently bent taper, a side shoot from its
// middle and a fork at its tip, `depth` times over. Collects tips for leaves.
function twig(R, x, y, ang, len, w, depth, out) {
  const a = rad(ang), bend = (R() - 0.5) * 0.6;
  const pts = [[x, y]];
  for (let i = 1; i <= 3; i++) {
    const t = i / 3, aa = a + bend * t * 0.6;
    pts.push([x + Math.cos(aa) * len * t, y + Math.sin(aa) * len * t]);
  }
  out.d += taper(pts, [w, w * 0.72, w * 0.48, Math.max(0.4, w * 0.22)], { per: 5 });
  if (depth > 0) {
    twig(R, pts[2][0], pts[2][1], ang - 26 - R() * 16, len * 0.55, w * 0.45, depth - 1, out);
    twig(R, pts[3][0], pts[3][1], ang + 16 + R() * 16, len * 0.5, w * 0.4, depth - 1, out);
  } else out.tips.push(pts[3]);
  return out;
}
// Animated leaves tumbling through the air.
function flyingLeaves(seed, n, x, y, fill, { len = [5, 9], t = [5, 9], cls = 'float', op = [0.7, 1] } = {}) {
  const R = rng(seed);
  let out = '';
  for (let i = 0; i < n; i++) {
    const cx = x[0] + R() * (x[1] - x[0]), cy = y[0] + R() * (y[1] - y[0]), L = len[0] + R() * (len[1] - len[0]);
    const dur = t[0] + R() * (t[1] - t[0]), o = op[0] + R() * (op[1] - op[0]);
    out += `<path class="${cls}" style="--t:${f1(dur)}s;--d:${f1(-R() * dur)}s;--o:${f1(o)}" d="${leaf(cx - L / 2, cy, R() * Math.PI * 2, L, L * 0.5)}" fill="${fill}" opacity="${f1(o)}"/>`;
  }
  return out;
}

const verdantScenes = {
  'sudden-growth'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f4eec6'], [0.5, '#dce2a8'], [1, '#8fa96c']]));
    // the burst of light it is rising out of
    s.glow(152, 108, 170, '#fbffd8', 0.9);
    s.add(rays({ cx: 152, cy: 108, from: -180, to: 180, n: 20, len: 260, spread: 2.4, color: '#fdffe4', op: 0.3, seed: 401 }));
    s.layer(woods({ seed: 402, base: 162, top: 136, r0: 6, r1: 11 }), '#c6d3a0', { blur: 0.7 });
    s.fog(160, '#fbf8e0', 0.5);
    // a whole wood that now comes up to its knees
    s.path(pines({ seed: 403, base: 186, h: [12, 24], gap: [5, 10] }), '#7f9a63');
    s.path('M-10,214L-10,184C50,181 110,182 160,183C220,184 260,181 310,183L310,214Z', '#3a5029');
    // roots heaving up out of the ground behind it
    const roots = taper([[36, 196], [44, 168], [62, 154], [80, 162], [88, 188]], [9, 8, 7, 7, 8]) +
      taper([[212, 196], [222, 166], [244, 150], [266, 160], [272, 190]], [10, 9, 8, 7, 8]) +
      vine([70, 186], [36, 92], { side: 1, curl: 9, w: 7 }) + vine([94, 188], [70, 44], { side: -1, curl: 8, w: 6 }) +
      vine([216, 186], [246, 52], { side: 1, curl: 9, w: 6 }) + vine([240, 188], [280, 104], { side: -1, curl: 9, w: 7 });
    s.path(roots, '#4a6a33');
    // the fox, sitting up suddenly enormous, tail flung high
    const fox = [
      taper([[178, 162], [160, 130], [148, 102]], [58, 46, 32]),
      taper([[147, 104], [142, 90], [141, 80]], [30, 24, 20]),
      taper([[134, 80], [121, 85], [107, 89]], [17, 11, 3]),
      taper([[133, 70], [128, 58], [126, 48]], [15, 8, 0.5]) + taper([[148, 69], [153, 58], [156, 49]], [14, 7.5, 0.5]),
      taper([[146, 84], [153, 94], [152, 100]], [12, 7, 0.5]) + taper([[138, 88], [140, 98], [137, 104]], [10, 6, 0.5]),
      taper([[147, 100], [132, 110], [129, 126], [136, 140]], [16, 20, 15, 3]),
      limb([140, 128], [138, 156], [136, 182], 14, 9, 8), limb([153, 132], [152, 158], [151, 182], 13, 8.5, 7.5),
      taper([[204, 172], [226, 156], [242, 128], [242, 98], [232, 74]], [16, 28, 32, 24, 5]),
    ].join('');
    s.figure(P(fox) + E(142, 78, 15, 13, -12) + E(176, 160, 34, 24, -24) + E(132, 183, 8, 3) + E(149, 183, 7.5, 3) + E(198, 182, 14, 4.4),
      { fill: p.fig, rim: p.rim, offsets: [[-1.1, -1], [1.1, -1], [0, -1.3], [-1.2, 0.4], [1.2, 0.4]], rimOp: 0.95, shade: 0.35, light: [0, -1], halo: { op: 0.5, sd: 3 } });
    s.add('<ellipse cx="134" cy="77" rx="2" ry="1.3" fill="#f7ffc8" transform="rotate(-12 134 77)"/>');
    // buds blazing at every tip, vines whipping across the front
    const bud = s.rad([[0, '#fbffd0', 0.95], [0.35, '#e6f78f', 0.5], [1, '#e6f78f', 0]]);
    s.add([[36, 92], [70, 44], [246, 52], [280, 104]].map(([x, y]) => `<circle class="breathe" cx="${x}" cy="${y}" r="8" fill="${bud}"/>`).join(''));
    s.path(vine([-12, 206], [54, 176], { side: -1, curl: 7, w: 8, leaves: 2, lr: 12 }) + vine([312, 208], [244, 182], { side: 1, curl: 7, w: 8, leaves: 2, lr: 12 }), '#1c2913');
    s.path([[28, 172, 3.4], [62, 160, 2.6], [244, 166, 3], [270, 150, 2.4], [90, 150, 2]].map(([x, y, r]) => circ(x, y, r)).join(''), '#2c2416');
    s.add(flyingLeaves(404, 16, [20, 280], [20, 170], '#5f7f3e', { len: [6, 10] }));
    s.add(flyingLeaves(405, 10, [40, 260], [30, 150], '#d6e89a', { len: [5, 8] }));
    s.add(particles({ seed: 406, n: 14, x: [40, 260], y: [30, 170], r: [0.6, 1.4], fill: '#fffbd0', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'canopy-archer'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#fbf3cf'], [0.5, '#e8e5b0'], [1, '#b3c58f']]));
    s.glow(224, 30, 140, '#fff8d6', 0.95);
    s.add(rays({ cx: 224, cy: 30, from: 95, to: 245, n: 10, len: 300, spread: 2.4, color: '#fffbe6', op: 0.3, seed: 411 }));
    s.add('<circle cx="224" cy="30" r="14" fill="#fffcea"/>');
    // the forest far below, sinking into haze
    s.layer(woods({ seed: 412, base: 176, top: 150, r0: 8, r1: 14 }), '#cad5a6', { blur: 0.8 });
    s.haze(150, 188, '#f8f6dc', 0.55);
    s.path(woods({ seed: 413, base: 206, top: 184, r0: 10, r1: 16 }), '#a8bc89');
    // the dark winged thing, crossing the sun
    s.path(taper([[214, 31], [230, 29]], [5, 3]) + taper([[214, 31], [207, 33]], [4, 1.6]) + taper([[230, 29], [240, 33], [249, 29]], [2.6, 1.4, 0.3]) +
      taper([[219, 30], [209, 20], [197, 14]], [5, 3, 0.5]) + taper([[225, 29], [233, 15], [242, 8]], [5, 3, 0.5]), '#262a1c');
    s.path(poly([[219, 30], [197, 14], [201, 23], [195, 26], [207, 29]]) + poly([[225, 29], [242, 8], [240, 18], [246, 21], [231, 31]]), '#262a1c');
    // the great tree: trunk at the left, the branch she is perched on
    const tree = taper([[14, 222], [20, 150], [17, 80], [24, 0], [22, -12]], [58, 46, 40, 36, 36]) +
      taper([[10, 192], [70, 190], [130, 185], [190, 178], [250, 170], [304, 166]], [32, 22, 18, 14, 9, 4]) +
      taper([[196, 178], [212, 160], [222, 145]], [7, 4.5, 1.5]) + taper([[30, 40], [64, 22], [96, 14]], [14, 8, 3]);
    s.figure(P(tree), { fill: '#2a3a1e', rim: p.rim, offsets: [[0.8, -1.2]], rimOp: 0.85, shade: 0.4 });
    s.add('<path d="M8,170C12,150 6,130 10,110M30,150C26,130 32,110 28,84M18,70C20,50 14,30 18,10M60,188C80,185 100,186 118,182M150,181C170,178 186,176 204,172" stroke="#1a2612" stroke-width="1.2" fill="none" opacity=".7"/>');
    s.path(leafCluster(414, [[40, 14, 22], [80, 6, 18], [12, 44, 18], [112, 4, 12], [222, 146, 9], [262, 170, 10]], 9, [8, 13]), '#3a522a');
    // the archer, kneeling on the branch, drawing on it
    const u = [Math.cos(rad(-35)), Math.sin(rad(-35))], n = [-u[1], u[0]];
    const hand = [31.7, -61.8], tip1 = [37.9, -44.2], tip2 = [17.3, -73.6], draw = [13, -57];
    const archer = [
      taper([[0, 0], [-14, -1]], [6, 4]),
      taper([[0, 0], [4, -22]], [7.5, 9.5]),
      taper([[6, -22], [22, -27]], [9.5, 7]) + taper([[22, -27], [24, -2]], [7, 5]) + taper([[23, 0], [31, 0]], [4.4, 2.6]),
      taper([[5, -22], [7, -36], [9, -50]], [13, 11, 14]),
      taper([[12, -48], hand], [5, 3.8]),
      limb([8, -48], [-5, -51], draw, 5.5, 4.2, 3.6),
      taper([tip1, [hand[0] + 3 * u[0], hand[1] + 3 * u[1]], tip2], [0.9, 2.8, 0.9]),
      taper([[8, -62], [1, -66], [-7, -65]], [7, 4, 0.5]),
    ].join('');
    const cloak = poly([[4, -52], [0, -44], [-6, -30], [-13, -16], [-20, -6], [-12, -8], [-8, -1], [-3, -12], [2, -26], [7, -42]]);
    const hood = blob([[6, -64], [12, -68], [18, -64], [19, -56], [15, -52], [8, -52], [4, -58]]);
    const string = `M${pt(tip1)}L${pt(draw)}L${pt(tip2)}`;
    const arrow = `M${pt(draw)}L${pt([hand[0] + 7 * u[0], hand[1] + 7 * u[1]])}`;
    s.figure(G('translate(96 177) scale(1.45)', P(archer, cloak, hood) + C(hand[0], hand[1], 2.4) + C(draw[0], draw[1], 2.2) +
      `<path d="${string}" fill="none" stroke-width=".5"/><path d="${arrow}" fill="none" stroke-width=".8"/>`),
    { fill: p.fig, rim: p.rim, offsets: [[0.9, -1.1], [-0.6, -1]], rimOp: 0.95, shade: 0.35, light: [1, -1], halo: { op: 0.4, sd: 2.4 } });
    const ah = [96 + (hand[0] + 7 * u[0]) * 1.45, 177 + (hand[1] + 7 * u[1]) * 1.45];
    s.glow(ah[0], ah[1], 8, '#fbffd0', 0.9);
    s.add(`<path d="M${pt(ah)}l${f1(-5 * u[0] + 2 * n[0])},${f1(-5 * u[1] + 2 * n[1])}l${f1(-4 * n[0])},${f1(-4 * n[1])}Z" fill="#f7ffd8"/>`);
    s.add(flyingLeaves(415, 6, [60, 280], [40, 160], '#4f6b38', { len: [5, 8] }));
    s.add(particles({ seed: 416, n: 14, x: [40, 280], y: [20, 170], r: [0.6, 1.4], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'grove-druid'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#eef0c6'], [0.55, '#c7d59b'], [1, '#7a955e']]));
    s.glow(64, 16, 140, '#fff8d6', 0.75);
    s.add(rays({ cx: 44, cy: -24, from: 30, to: 80, n: 6, len: 300, spread: 2.6, color: '#fffbe6', op: 0.24, seed: 421 }));
    // the grove: trunks in the mist, a ring of trees behind her
    s.add(`<g fill="#c3d09f">${[[20, 9], [58, 6], [214, 8], [252, 11], [286, 7]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="170"/>`).join('')}</g>`);
    s.layer(woods({ seed: 422, base: 156, top: 112, r0: 8, r1: 14 }), '#a9bd8a', { blur: 0.6 });
    s.fog(152, '#f4f2d6', 0.5);
    // the dark, rich earth she kneels on
    s.path('M-10,214L-10,172C50,168 110,170 160,172C220,174 260,169 310,172L310,214Z', s.lin([[0, '#3a3a22'], [0.4, '#2a2c19'], [1, '#161a0c']]));
    // the druid, crowned in antlers, bent over the seed
    // (antlers drawn upright around the head at (0, 0), then tilted with the bowed head)
    const antlers = [
      taper([[-4, -6], [-9, -18], [-13, -30], [-15, -42]], [3.8, 3, 2, 0.8]),
      taper([[-9, -18], [-17, -22], [-23, -28]], [2.3, 1.5, 0.4]) + taper([[-13, -30], [-21, -35]], [1.8, 0.4]) + taper([[-13, -31], [-8, -40]], [1.7, 0.4]),
      taper([[3, -6], [10, -18], [16, -30], [20, -41]], [3.8, 3, 2, 0.8]),
      taper([[10, -18], [18, -20], [26, -26]], [2.3, 1.5, 0.4]) + taper([[16, -30], [24, -34]], [1.8, 0.4]) + taper([[16, -31], [13, -40]], [1.7, 0.4]),
    ].join('');
    // kneeling, sat back on her heels, bent low over the seed
    const body = [
      taper([[126, 158], [140, 140], [156, 126]], [24, 19, 17]),
      taper([[158, 122], [164, 117]], [7, 7]),
      limb([158, 127], [166, 146], [177, 163], 7.5, 5.6, 4.6),
      limb([153, 130], [161, 149], [171, 164], 7, 5.2, 4.4),
      taper([[164, 108], [156, 118], [152, 132], [150, 142]], [9, 10, 6, 1.5]),
    ].join('');
    const robe = blob([[112, 150], [124, 140], [140, 146], [152, 160], [162, 172], [158, 179], [130, 180], [100, 180], [96, 172], [102, 160]]);
    s.figure(G('translate(168 114) rotate(28)', P(antlers) + `<path d="M-8,-3Q0,-9 8,-3" fill="none" stroke-width="3"/>`) + P(body, robe) + C(168, 114, 7) +
      E(178, 164, 4, 2.8, 20) + E(172.5, 165, 3.6, 2.6, 20),
    { fill: p.fig, rim: p.rim, offsets: [[-1.1, -1], [0.6, -1.2]], rimOp: 0.9, shade: 0.35, light: [-0.5, -1], halo: { op: 0.35, sd: 2.4 } });
    // the seed, and the light and roots spreading out of it through the earth
    const roots = 'M182,173C168,178 152,180 136,184C116,188 96,190 74,194C52,197 30,196 6,194M136,184C130,192 128,200 122,212M98,190C92,198 84,204 76,212' +
      'M182,173C198,177 214,180 232,184C252,188 272,186 306,184M232,184C236,194 234,204 240,212M262,187C270,194 276,198 288,204M182,175C184,186 180,198 184,212M182,175C176,186 166,196 156,206';
    s.glow(184, 168, 60, '#e6f78f', 0.75, 'breathe');
    s.bloom(`<g fill="none" stroke-linecap="round"><path d="${roots}" stroke="#d9f27a" stroke-width="3" opacity=".35"/><path d="${roots}" stroke="#f2ffb8" stroke-width="1.1"/></g>` +
      `<ellipse cx="183" cy="172" rx="4.2" ry="3" fill="#fbffe0"/><path d="${leaf(184, 170, -1.9, 7, 4) + leaf(184, 170, -1.1, 7, 4)}" fill="#efffb0"/>`,
    { sd: 1.8, k: 1.5, box: [0, 140, 310, 80] });
    s.motes({ seed: 424, n: 16, x: [130, 240], y: [90, 175], r: [0.5, 1.1], fill: '#e6f78f', hot: '#fbffe0', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 425, n: 10, x: [20, 280], y: [20, 150], r: [0.6, 1.4], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'savage-clash'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f6efc8'], [0.5, '#dfe2aa'], [1, '#9cb47a']]));
    // the flash where they meet
    s.glow(156, 98, 150, '#fffbe0', 0.92);
    s.add(rays({ cx: 156, cy: 98, from: -180, to: 180, n: 16, len: 220, spread: 2.6, color: '#fffbe6', op: 0.32, seed: 431 }));
    // the clearing, woods all round it
    s.layer(woods({ seed: 432, base: 152, top: 104, r0: 8, r1: 15 }), '#c3d0a0', { blur: 0.7 });
    s.fog(150, '#faf6dc', 0.5);
    s.path(woods({ seed: 433, base: 176, top: 140, r0: 10, r1: 17, prof: (x) => Math.min(1, Math.abs(x - 156) / 90) }), '#93ab74');
    s.path('M-10,214L-10,182C50,179 110,180 160,181C220,182 260,179 310,181L310,214Z', '#3a5029');
    // dust thrown up from their feet
    let dust = '';
    for (const [x, y, r] of [[70, 184, 12], [96, 188, 9], [160, 186, 10], [186, 188, 12], [236, 186, 11], [262, 188, 9], [128, 190, 8], [44, 190, 8], [212, 190, 9]]) dust += circ(x, y, r);
    s.blur(`<path d="${dust}" fill="#efe8c4" opacity=".6"/>`, 3.5);
    // the bear, reared up, and the horned beast, head down: one silhouette where they meet
    const bear = [
      limb([92, 150], [80, 166], [84, 184], 26, 16, 12), limb([104, 152], [108, 168], [104, 184], 24, 15, 12),
      taper([[96, 158], [104, 132], [116, 110], [128, 99]], [40, 40, 34, 26]),
      limb([122, 100], [134, 80], [150, 70], 16, 11, 10),
      limb([126, 114], [142, 118], [156, 120], 15, 10, 9),
      taper([[128, 98], [137, 96], [146, 98]], [21, 18, 13]),
      taper([[144, 95], [153, 97], [158, 99]], [10, 8, 4.4]), taper([[144, 102], [151, 106], [155, 109]], [6.5, 5, 3]),
      taper([[150, 70], [157, 66]], [3.4, 0.4]) + taper([[151, 72], [159, 71]], [3.2, 0.4]) + taper([[156, 120], [163, 118]], [3, 0.4]) + taper([[156, 122], [163, 124]], [3, 0.4]),
    ].join('');
    const beast = [
      taper([[192, 108], [180, 109], [169, 110]], [34, 29, 22]),
      taper([[168, 102], [159, 92], [153, 82], [157, 72]], [8, 6, 3.8, 0.6]) + taper([[177, 99], [176, 87], [171, 77], [175, 67]], [8, 6, 3.8, 0.6]),
      taper([[161, 114], [155, 122]], [10, 8]) + taper([[176, 116], [178, 134], [184, 142]], [16, 10, 2]),
      limb([186, 130], [176, 156], [170, 182], 21, 12, 9), limb([200, 132], [200, 158], [196, 182], 19, 11, 9),
      limb([244, 128], [254, 154], [256, 182], 22, 11, 9), limb([230, 130], [236, 156], [232, 182], 20, 11, 9),
      taper([[260, 112], [265, 124], [266, 138]], [4, 3, 2]),
      // a shaggy beard under its chest
      [[174, 104, 166, 102], [178, 120, 172, 132], [184, 126, 182, 140], [190, 130, 192, 142]].map(([x, y, tx, ty]) => taper([[x, y], [tx, ty]], [8, 0.5])).join(''),
    ].join('');
    const hulk = blob([[176, 110], [179, 92], [190, 78], [206, 73], [222, 78], [238, 90], [254, 98], [264, 110], [262, 127], [250, 136], [232, 137], [212, 135], [194, 138], [182, 132]]);
    s.figure(P(bear, beast, hulk) + E(112, 106, 14, 11, -30) + C(130, 87, 4.4) + C(138, 85, 4) + E(166, 111, 13, 12) + E(266, 143, 3.6, 6.5) +
      E(84, 185, 9, 3) + E(104, 185, 9, 3) + E(170, 183, 6, 2.4) + E(196, 183, 6, 2.4) + E(256, 183, 6, 2.4) + E(232, 183, 6, 2.4),
    { fill: p.fig, rim: p.rim, offsets: [[-1, -1], [1, -1], [0, -1.3]], rimOp: 0.95, shade: 0.35, light: [0, -1], halo: { op: 0.45, sd: 2.8 } });
    s.add('<circle cx="142" cy="93" r="1.2" fill="#f1f6c8"/><circle cx="170" cy="106" r="1.2" fill="#f1f6c8"/>');
    // leaves and dust bursting off the impact
    let puff = '';
    for (const [x, y, r] of [[156, 62, 6], [144, 56, 4], [170, 58, 5], [158, 132, 6], [146, 138, 4], [172, 136, 4]]) puff += circ(x, y, r);
    s.add(`<path class="drift" d="${puff}" fill="#fbf6dc" opacity=".6"/>`);
    s.add(flyingLeaves(434, 16, [100, 220], [36, 150], '#4a6634', { len: [6, 10], t: [4, 7] }));
    s.add(flyingLeaves(435, 8, [110, 210], [50, 140], '#dbeba0', { len: [5, 8], t: [4, 7] }));
    s.add(particles({ seed: 436, n: 12, x: [40, 260], y: [30, 170], r: [0.6, 1.4], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'heartwood-totem'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f2efc8'], [0.5, '#cfdaa2'], [1, '#86a066']]));
    s.glow(56, -4, 150, '#fff8d6', 0.85);
    s.shafts({ cx: 36, cy: -30, from: 38, to: 72, n: 7, len: 320, spread: 2.6, color: '#fffbe2', op: 0.62, seed: 441 });
    // the glade: old trunks standing back in the green light
    s.add(`<g fill="#bccb98">${[[14, 10], [48, 7], [236, 8], [268, 12]].map(([x, w]) => `<rect x="${x}" y="-5" width="${w}" height="180"/>`).join('')}</g>`);
    s.layer(woods({ seed: 442, base: 164, top: 126, r0: 8, r1: 14 }), '#a5ba86', { blur: 0.6 });
    s.fog(160, '#f4f2d6', 0.5);
    s.path('M-10,214L-10,182C40,177 90,171 150,169C210,171 260,177 310,182L310,214Z', s.lin([[0, '#4a6233'], [1, '#26341a']]));
    s.add('<path d="M70,178C90,174 110,172 128,172M174,172C194,172 214,174 232,178" stroke="#7d9858" stroke-width="2" fill="none" opacity=".6"/>');
    // the totem: owl-crowned, winged, a face at its foot, roots in the moss
    const wingL = poly([[136, 60], [118, 54], [102, 51], [91, 55], [102, 59], [94, 64], [107, 66], [100, 72], [114, 72], [110, 78], [124, 76], [136, 80]]);
    const totem = P(
      poly([[131, 190], [133, 52], [167, 52], [169, 190]]),
      blob([[133, 54], [134, 40], [141, 33], [150, 31], [159, 33], [166, 40], [167, 54]]),
      taper([[137, 38], [133, 28], [131, 22]], [7, 4, 0.5]) + taper([[163, 38], [167, 28], [169, 22]], [7, 4, 0.5]) +
      taper([[133, 176], [120, 184], [106, 190]], [9, 6, 1.5]) + taper([[167, 176], [180, 184], [194, 190]], [9, 6, 1.5]) + taper([[148, 182], [146, 192]], [10, 6]),
      wingL, mirror(wingL),
      taper([[150, 31], [150, 20], [146, 10]], [3, 2.2, 1.2]) + taper([[166, 98], [176, 92], [182, 84]], [3, 2, 0.8]) + taper([[134, 146], [124, 140], [120, 132]], [3, 2, 0.8]),
      leaf(146, 10, -2.2, 12, 6) + leaf(147, 12, -0.9, 11, 5.5) + leaf(149, 19, -2.9, 9, 4.6) + leaf(182, 84, -1.2, 10, 5) + leaf(180, 87, -0.2, 9, 4.6) +
      leaf(120, 132, -2.1, 10, 5) + leaf(121, 135, -2.9, 9, 4.6) + leaf(92, 55, -2.8, 9, 4.6) + leaf(208, 55, -0.35, 9, 4.6));
    s.figure(totem, { fill: '#253420', rim: p.rim, offsets: [[-1, -1], [0.6, -1.2]], rimOp: 0.95, shade: 0.5, light: [-0.6, -1], halo: { op: 0.35, sd: 2.6 } });
    // its carving: the owl's face, feathered wings, bands, a stern face at the foot
    s.add('<g fill="none" stroke="#5f7a44" stroke-width="1.3" opacity=".9" stroke-linecap="round">' +
      '<circle cx="143" cy="44" r="4.2"/><circle cx="157" cy="44" r="4.2"/><path d="M150,47L147,53L150,57L153,53Z"/>' +
      '<path d="M133,84H167M133,88H167M133,150H167M133,154H167M104,59L128,62M100,66L128,67M110,72L130,72M196,59L172,62M200,66L172,67M190,72L170,72"/>' +
      '<path d="M139,163L146,166M161,163L154,166M140,176Q150,182 160,176M150,166V172"/></g>');
    s.add('<g fill="#9bb86a"><circle cx="143" cy="44" r="1.6"/><circle cx="157" cy="44" r="1.6"/><circle cx="142.5" cy="166" r="1.2"/><circle cx="157.5" cy="166" r="1.2"/></g>');
    // the heart-knot, carved deep and burning green
    s.glow(150, 119, 54, '#e6f78f', 0.7, 'breathe');
    const heart = 'M150,134C139,126 134,118 136,112C138,105 146,104 150,111C154,104 162,105 164,112C166,118 161,126 150,134Z';
    s.path(heart, '#1a2412');
    s.bloom(`<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${heart}" stroke="#e6f78f" stroke-width="3.2"/>` +
      '<path d="M141,111C146,118 154,118 159,111M150,111V130M143,121C147,125 153,125 157,121" stroke="#f4ffc2" stroke-width="1.6"/></g>',
    { sd: 1.8, k: 1.6, box: [110, 90, 80, 60] });
    // ferns at the edges; a very small visitor at its foot
    const fern = (pts, w) => taper(pts, w);
    s.path(fern([[-6, 214], [8, 194], [26, 182], [46, 178]], [8, 4, 2, 0.4]) + fern([[-4, 214], [2, 186], [8, 166], [20, 152]], [7, 4, 2, 0.4]) +
      fern([[306, 214], [292, 192], [276, 182], [258, 180]], [8, 4, 2, 0.4]) + fern([[304, 214], [298, 186], [300, 164], [290, 150]], [7, 4, 2, 0.4]), '#1b2714');
    s.figure(`<path d="${blob([[198, 186], [197, 179], [200, 174], [205, 174], [208, 179], [209, 186]])}"/>${E(201, 171, 3.6, 3.2)}${E(199.5, 163, 1.3, 4.2, -14)}${E(203, 163.5, 1.3, 4, 12)}`,
      { fill: p.fig, rim: p.rim, offsets: [[-0.8, -0.8]] });
    s.motes({ seed: 443, n: 14, x: [110, 190], y: [60, 170], r: [0.5, 1], fill: '#e6f78f', hot: '#fbffe0', cls: 'float', t: [5, 9], op: [0.5, 1] });
    s.add(particles({ seed: 444, n: 10, x: [20, 280], y: [20, 160], r: [0.6, 1.4], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'grandmother-bramble'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#efd68c'], [0.38, '#f6e6aa'], [0.72, '#ccd496'], [1, '#86a066']]));
    // a low gold sun behind her, its light coming through her hair
    s.glow(104, 58, 175, '#fff3c0', 0.95);
    s.shafts({ cx: 104, cy: 58, from: -180, to: 180, n: 18, len: 290, spread: 2.4, color: '#fffbe0', op: 0.58, seed: 451 });
    s.add('<circle cx="104" cy="58" r="16" fill="#fffbe8" opacity=".9"/>');
    s.layer(woods({ seed: 452, base: 164, top: 126, r0: 8, r1: 14 }), '#c9cf98', { blur: 0.8 });
    s.fog(160, '#fbf6dc', 0.55);
    s.path('M-10,214L-10,188C50,184 110,186 170,188C230,190 270,186 310,188L310,214Z', s.lin([[0, '#3e5530'], [1, '#22301a']]));
    s.add('<path d="M176,194C200,192 240,192 290,195" stroke="#5c7444" stroke-width="2" fill="none" opacity=".7"/>');
    // Grandmother: rooted skirt, bent old back, a shawl of moss, a crown of twigs with nests in it
    const TR = rng(456), hair = { d: '', tips: [] };
    for (const [x, y, a, len, w] of [[140, 86, -98, 50, 8], [136, 88, -124, 56, 8.5], [132, 90, -150, 52, 8], [146, 85, -74, 42, 7], [128, 94, -172, 42, 7], [142, 86, -112, 32, 6]]) twig(TR, x, y, a, len, w, 2, hair);
    const leaves = leafCluster(453, hair.tips.filter((_, i) => i % 2 === 0).map(([x, y]) => [x, y, 3]), 3, [5, 8]);
    const nest = (x, y) => `M${x - 10},${y}Q${x},${y + 13} ${x + 10},${y}Z`;
    const nestTwigs = (x, y) => taper([[x - 8, y + 1], [x - 14, y - 3]], [1.6, 0.3]) + taper([[x + 8, y + 1], [x + 14, y - 2]], [1.6, 0.3]) + taper([[x - 4, y + 7], [x - 10, y + 9]], [1.4, 0.3]) + taper([[x + 5, y + 7], [x + 11, y + 10]], [1.4, 0.3]);
    const chick = (x, y, k = 1) => circ(x, y, 2.8 * k);
    const twigs = hair.d + nestTwigs(84, 86) + nestTwigs(160, 50);
    const body = [
      taper([[84, 152], [96, 128], [112, 110], [126, 100]], [32, 29, 26, 22]),
      taper([[126, 98], [137, 93]], [15, 12]),
      taper([[153, 96], [158, 100]], [7, 5]),
      limb([131, 102], [151, 128], [168, 150], 9, 6.5, 5),
      taper([[168, 150], [176, 158], [182, 167]], [3.4, 2.4, 0.8]) + taper([[168, 151], [172, 161], [175, 170]], [3.2, 2.2, 0.7]) + taper([[167, 150], [180, 154], [188, 160]], [3, 2, 0.7]),
      limb([115, 106], [104, 127], [113, 139], 8.5, 6.5, 5.5),
      taper([[113, 134], [117, 162], [121, 191]], [3.6, 3.2, 2.8]),
      taper([[64, 186], [48, 190], [34, 194]], [9, 5, 1]) + taper([[108, 186], [124, 191], [138, 194]], [9, 5, 1]) + taper([[86, 188], [84, 196]], [9, 4]),
    ].join('');
    const skirt = blob([[70, 150], [96, 145], [106, 160], [112, 176], [122, 190], [100, 192], [78, 192], [54, 191], [62, 176], [66, 162]]);
    s.figure(P(twigs, leaves, body, skirt, nest(84, 86), nest(160, 50)) + E(104, 106, 19, 14, -35) + E(146, 94, 11.5, 10, 20) + E(151, 103, 5, 4) + E(158.5, 101, 4.4, 3.6, 30) +
      `<path d="${chick(80, 80) + chick(88, 81, 0.85) + chick(160, 44)}"/>` + C(114, 129, 3.4),
    { fill: p.fig, rim: '#fff6cc', offsets: [[-1.1, -1], [1.1, -1], [0, -1.3], [-1.2, 0.3]], rimOp: 0.95, shade: 0.4, light: [-0.6, -1], halo: { op: 0.55, sd: 3 } });
    // her shawl of moss, hanging in strands
    const shawl = poly([[90, 122], [100, 106], [114, 97], [130, 94], [140, 100], [143, 112], [138, 116], [136, 124], [131, 119], [127, 128], [122, 121], [116, 132], [111, 123], [104, 134], [100, 125], [94, 132]]);
    s.path(shawl, '#33492a');
    s.add('<g fill="#86a35c" opacity=".8"><circle cx="112" cy="106" r="1.1"/><circle cx="124" cy="101" r="1"/><circle cx="104" cy="116" r="1"/><circle cx="132" cy="108" r=".9"/><circle cx="118" cy="114" r=".9"/></g>');
    // a kind eye, beaks open in the nests
    s.add('<path d="M143,91Q146,93.5 149,91M147,104Q151,106 154,104" stroke="#f7ffc8" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".9"/>');
    // the chicks, beaks wide open: "Eat. You're growing."
    const beak = (x, y, a) => taper([[x, y], [x + Math.cos(rad(a - 14)) * 5, y + Math.sin(rad(a - 14)) * 5]], [1.8, 0.3]) + taper([[x, y], [x + Math.cos(rad(a + 14)) * 5, y + Math.sin(rad(a + 14)) * 5]], [1.8, 0.3]);
    s.path(beak(80, 77.5, -110) + beak(88, 79, -70) + beak(160, 41.5, -90), p.fig);
    // brambles curling in at the corners
    const thorns = (pts) => pts.map(([x, y, a]) => taper([[x, y], [x + Math.cos(rad(a)) * 5, y + Math.sin(rad(a)) * 5]], [2.4, 0.3])).join('');
    s.path(vine([-14, 196], [40, 168], { side: -1, curl: 8, w: 6, leaves: 2, lr: 10 }) + vine([-10, 170], [22, 132], { side: 1, curl: 6, w: 4.4, leaves: 1, lr: 8 }) +
      vine([314, 200], [270, 172], { side: 1, curl: 7, w: 6, leaves: 2, lr: 10 }) + thorns([[12, 186, -100], [26, 176, -60], [4, 158, -150], [292, 186, -80], [280, 178, -120]]), '#16200f');
    // the row of saplings she is feeding, glowing
    const sap = [[188, 13], [212, 17], [236, 21], [260, 25]];
    for (const [x, h] of sap) s.glow(x, 189 - h * 0.7, 13 + h * 0.3, '#e6f78f', 0.7, 'breathe');
    s.bloom(sap.map(([x, h]) => `<path d="${taper([[x, 190], [x + 1, 190 - h]], [2.4, 1.2])}" fill="#c9e070"/><path d="${leaf(x + 1, 190 - h, -2.3, 7 + h * 0.2, 3.6 + h * 0.08) + leaf(x + 1, 190 - h, -0.85, 7 + h * 0.2, 3.6 + h * 0.08) + leaf(x + 0.5, 192 - h * 0.5, -0.4, 5 + h * 0.1, 2.8)}" fill="#f2ffbc"/>`).join(''),
      { sd: 1.6, k: 1.5, box: [170, 150, 110, 50] });
    s.path(bird(196, 46, 1.1) + bird(214, 36, 0.9) + bird(232, 50, 0.8), p.fig);
    s.motes({ seed: 454, n: 14, x: [176, 276], y: [120, 186], r: [0.5, 1], fill: '#e6f78f', hot: '#fbffe0', cls: 'rise', t: [4, 8], op: [0.5, 1] });
    s.add(particles({ seed: 455, n: 14, x: [20, 280], y: [10, 170], r: [0.6, 1.4], fill: '#fffbd6', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  'ironhide-charger'(s) {
    const p = PAL.verdant;
    s.rect(s.lin([[0, '#f6eec4'], [0.5, '#e2dca4'], [1, '#a4b47c']]));
    s.glow(236, 70, 160, '#fff6cc', 0.9);
    s.layer(woods({ seed: 461, base: 158, top: 134, r0: 6, r1: 11 }), '#c9cf9c', { blur: 0.7 });
    s.path('M-10,214L-10,160C60,158 120,159 180,160C230,161 270,159 310,160L310,214Z', s.lin([[0, '#8c9a62'], [0.3, '#5d6e3e'], [1, '#2c3a1e']]));
    // the dust it is tearing up, a churning cloud lit through from behind
    let dust = '';
    for (const [x, y, r] of [[226, 128, 30], [258, 104, 34], [292, 130, 32], [204, 152, 24], [250, 156, 28], [286, 72, 28], [236, 78, 24], [302, 168, 26], [190, 170, 18], [270, 40, 22],
      [176, 122, 24], [148, 140, 20], [196, 96, 22], [126, 150, 16], [214, 58, 18]]) dust += circ(x, y, r);
    s.blur(`<path d="${dust}" fill="${s.radU(240, 76, 130, [[0, '#fff6d4', 0.95], [0.4, '#e4cf98', 0.9], [0.8, '#b49c64', 0.85], [1, '#8f7c4c', 0.8]])}"/>`, 2.6);
    // the ground split where it lands
    s.add('<path d="M78,188L60,193L44,191M78,188L68,199L66,212M78,188L94,197L100,210M78,188L100,190L114,186M156,186L170,194L176,206M156,186L146,198" stroke="#1c2612" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".85"/>');
    // the charger at full gallop: head down, horn first, plated like a keep
    const k = 1.22;
    const beast = [
      taper([[-30, -44], [-46, -36], [-58, -28]], [30, 25, 17]),
      taper([[-64, -30], [-74, -38], [-79, -54]], [12, 7, 0.6]) + taper([[-54, -38], [-58, -47], [-57, -54]], [7, 4, 0.5]),
      taper([[-30, -50], [-26, -64], [-18, -74]], [18, 15, 4]),
      limb([-20, -30], [-40, -20], [-56, -12], 18, 12, 11), limb([-6, -28], [-10, -14], [-6, 0], 17, 11, 10),
      limb([56, -30], [74, -20], [92, -12], 20, 12, 11), limb([44, -28], [36, -14], [30, 0], 19, 11, 10),
      taper([[74, -44], [84, -46], [90, -42]], [5, 3, 1]),
    ].join('');
    const hulk = blob([[-34, -50], [-24, -64], [0, -70], [30, -71], [56, -63], [72, -49], [75, -34], [62, -24], [30, -20], [0, -22], [-24, -26], [-36, -36]]);
    const crest = [[-12, -67], [10, -71], [32, -71], [54, -64]].map(([x, y]) => taper([[x, y + 3], [x + 2, y - 9]], [9, 0.5])).join('');
    s.figure(G(`translate(118 186) scale(${k})`, P(beast, hulk, crest) + E(-56, -28, 12, 10) + E(-58, -12, 7, 3.2, -30) + E(-6, 0, 7.5, 3) + E(93, -11, 7, 3.2, 25) + E(30, 0, 7.5, 3)),
      { fill: '#1e2a16', rim: p.rim, offsets: [[1.2, -0.8], [0, -1.3], [-0.8, -1]], rimOp: 0.95, shade: 0.45, light: [1, -0.6], halo: { op: 0.45, sd: 2.8 } });
    // its armour: great overlapping plates, each lit along its edge and studded
    const X = (x) => 118 + x * k, Y = (y) => 186 + y * k;
    const plateEdge = (x0, x1) => `M${f1(X(x0))},${f1(Y(-69))}Q${f1(X(x0 + 9))},${f1(Y(-46))} ${f1(X(x1))},${f1(Y(-23))}`;
    const edges = plateEdge(-14, -18) + plateEdge(10, 6) + plateEdge(34, 30) + plateEdge(58, 56) + `M${f1(X(-28))},${f1(Y(-50))}Q${f1(X(-20))},${f1(Y(-37))} ${f1(X(-30))},${f1(Y(-26))}`;
    s.add(`<path d="${edges}" transform="translate(${f1(-2.2)} 0)" stroke="#0e150a" stroke-width="2.6" fill="none" opacity=".8"/><path d="${edges}" stroke="#d6e2a0" stroke-width="1.2" fill="none" opacity=".7"/>`);
    let studs = '';
    for (const x0 of [-14, 10, 34]) for (const t of [0.25, 0.5, 0.75]) studs += circ(X(x0 + 5 + 9 * Math.sin(Math.PI * t) * 0.6), Y(-69 + 46 * t), 1.1);
    s.path(studs, '#a9be7a');
    s.add(`<circle cx="${f1(X(-52))}" cy="${f1(Y(-32))}" r="1.4" fill="#f1f6c8"/>`);
    // clods kicked up, dust boiling round its feet
    s.path([[52, 168, 3], [40, 158, 2.2], [66, 154, 2], [186, 168, 2.6], [200, 158, 2]].map(([x, y, r]) => circ(x, y, r)).join(''), '#2c3a1e');
    let puffs = '';
    for (const [x, y, r] of [[40, 194, 14], [84, 198, 12], [128, 198, 13], [170, 196, 15], [218, 192, 16]]) puffs += circ(x, y, r);
    s.blur(`<path d="${puffs}" fill="#cdbb8a" opacity=".55"/>`, 4);
    s.add(particles({ seed: 462, n: 16, x: [160, 300], y: [60, 190], r: [0.6, 1.6], fill: '#fffbe0', cls: 'float', t: [5, 9], op: [0.4, 0.9] }));
    return s.svg();
  },

  stampede(s) {
    const p = PAL.verdant;
    // a storm overhead, sun breaking under it at the horizon
    s.rect(s.lin([[0, '#3e4a34'], [0.3, '#6f7c58'], [0.52, '#e2dba4'], [0.62, '#f8f0c8'], [0.78, '#cfd59c'], [1, '#6f8a55']]));
    s.glow(178, 118, 170, '#fff6cc', 0.85);
    // the storm rolling over, its belly lit by the sun breaking under it
    let storm = '';
    const R = rng(471);
    for (let x = -30; x < 330; x += 22 + R() * 16) storm += circ(x, 14 + R() * 30, 26 + R() * 18);
    s.blur(`<path d="${storm}" fill="${s.linU(0, -20, 0, 80, [[0, '#262f20'], [0.6, '#3c4732'], [1, '#7d8660']])}"/>`, 3.2);
    s.add('<path d="M244,34L238,56L247,58L236,90" stroke="#fbffe0" stroke-width="1.6" fill="none" stroke-linejoin="round" opacity=".9"/>');
    // the wall of dust the herd raises, towering behind it
    let wall = '';
    for (let x = -20; x < 330; x += 16 + R() * 12) wall += circ(x, 128 + R() * 20, 22 + R() * 18);
    for (let x = 120; x < 330; x += 22 + R() * 14) wall += circ(x, 96 + R() * 18, 16 + R() * 14);
    s.blur(`<path d="${wall}" fill="${s.linU(0, 70, 0, 170, [[0, '#f4e8bc', 0.85], [0.5, '#d8c690', 0.92], [1, '#a8955e', 0.95]])}"/>`, 2.6);
    s.path('M-10,214L-10,164C60,161 120,162 180,163C230,164 270,162 310,163L310,214Z', s.lin([[0, '#8c9862'], [0.25, '#5e6e40'], [1, '#2a381c']]));
    // the herd, nearer and darker
    const beast = (x, y, k) => {
      const T = (q) => [x + q[0] * k, y + q[1] * k];
      const tp = (pts, w) => taper(pts.map(T), w.map((v) => v * k));
      return {
        d: tp([[-26, -50], [-38, -44], [-48, -36]], [28, 23, 17]) + tp([[-46, -42], [-54, -32], [-57, -22]], [17, 13, 9]) +
          tp([[-48, -42], [-60, -50], [-63, -62], [-56, -71]], [6, 4.8, 3, 0.5]) + tp([[-42, -46], [-44, -58], [-37, -67]], [5, 3.4, 0.5]) +
          tp([[-30, -38], [-34, -26], [-30, -18]], [12, 8, 1]) +
          tp([[-22, -32], [-38, -22], [-50, -12]], [14, 9, 6.5]) + tp([[-12, -30], [-12, -14], [-6, 0]], [14, 9, 6.5]) +
          tp([[48, -34], [64, -22], [76, -12]], [16, 9, 6.5]) + tp([[40, -32], [34, -16], [26, -2]], [15, 9, 6.5]) +
          tp([[60, -50], [72, -57], [84, -54]], [4, 3, 1]),
        b: blob([[-32, -52], [-24, -68], [-6, -77], [14, -73], [34, -64], [54, -60], [66, -50], [64, -36], [48, -28], [20, -26], [0, -28], [-20, -30], [-34, -40]].map(T)),
        h: E(x - 47 * k, y - 40 * k, 9 * k, 8 * k),
      };
    };
    const far = [beast(206, 158, 0.4), beast(244, 156, 0.44), beast(284, 160, 0.46), beast(162, 160, 0.38)];
    s.add(`<g fill="#8a9668">${far.map((b) => `<path d="${b.d}"/><path d="${b.b}"/>${b.h}`).join('')}</g>`);
    s.haze(130, 168, '#f2e8c0', 0.35);
    const mid = [beast(270, 184, 0.72), beast(186, 176, 0.58), beast(226, 180, 0.64), beast(306, 178, 0.6)];
    s.figure(mid.map((b) => P(b.d, b.b) + b.h).join(''), { fill: '#3a4c2c', rim: p.rim, offsets: [[0, -1.1], [-0.8, -0.6]], rimOp: 0.8 });
    const lead = beast(118, 198, 1.16);
    s.figure(P(lead.d, lead.b) + lead.h, { fill: p.fig, rim: p.rim, offsets: [[1.1, -0.9], [0, -1.3], [-0.8, -1]], rimOp: 0.95, shade: 0.4, light: [0.6, -1], halo: { op: 0.45, sd: 2.8 } });
    s.add('<circle cx="62.5" cy="150.5" r="1.2" fill="#f1f6c8"/>');
    // dust thrown up at the front, rain in the storm light
    let puffs = '';
    for (const [x, y, r] of [[46, 204, 15], [96, 208, 13], [150, 206, 15], [204, 198, 13], [256, 200, 15], [300, 196, 12]]) puffs += circ(x, y, r);
    s.blur(`<path d="${puffs}" fill="#cdbd8c" opacity=".55"/>`, 4);
    s.add(Array.from({ length: 14 }, (_, i) => { const x = 10 + i * 21 + (i % 3) * 5, y = 40 + (i % 4) * 12; return `<path class="fall" style="--d:${f1(-i * 0.23)}s" d="M${x},${y}l-3,9" stroke="#e8efd0" stroke-width=".8" opacity=".55"/>`; }).join(''));
    return s.svg();
  },
};

// Each faction's finish (colour grade, vignette) applied via shared.js.
export const new_a = { ...faction('ember', emberScenes), ...faction('verdant', verdantScenes) };
