// Soft lights as small pictures. On a phone every element in motion is a
// layer of its own, and an element whose look is a CSS gradient must be
// painted into a layer as big as it is on screen (at 3x, and at the largest
// its motion scales it: a 320 px glow grown 1.5x is ~8 MB). A moving <img>
// needs no such layer: the graphics chip stretches its picture. So a soft
// round light (a radial gradient that fades out inside its circle) is painted
// once, small, into a picture shared by every light that looks like it, and
// shown as an <img>. Soft gradients stretch without a visible difference.
// (Asaf, 2026-11-12: "clever ways to avoid overloading working memory ...
// without really affecting visuals".)

const pics = new Map(); // a gradient's stops (as text) -> its picture (a data URL)
let pen = null;

// A CSS colour as [r, g, b, a] (0-255, alpha 0-1), or null.
export function rgbaOf(color) {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,/\s]+([\d.]+%?))?\s*\)$/.exec(String(color).trim());
  if (m) return [+m[1], +m[2], +m[3], m[4] == null ? 1 : m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]];
  pen ||= document.createElement('canvas').getContext('2d');
  pen.fillStyle = '#000';
  pen.fillStyle = color; // (the browser reads any colour; it gives back #rrggbb or rgba())
  const v = pen.fillStyle;
  if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16), 1];
  return v.startsWith('rgb') ? rgbaOf(v) : null;
}

// Split at the commas outside brackets.
function split(s) {
  const out = [];
  let depth = 0, at = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') depth--;
    else if (s[i] === ',' && depth === 0) { out.push(s.slice(at, i).trim()); at = i + 1; }
  }
  out.push(s.slice(at).trim());
  return out;
}

// A computed background-image that is one plain radial gradient, centred,
// a circle or an ellipse sized to the farthest corner (the default) or to the
// closest side: { circle, side: 'far' | 'near', stops: [[at 0-1, [r,g,b,a]], ...] }.
// Null for anything else (a position, another size, more than one image).
export function radialStops(bg) {
  const m = /^radial-gradient\((.*)\)$/.exec(String(bg).trim());
  if (!m || /\)\s*,\s*\w+-gradient\(/.test(bg) || /url\(/.test(bg)) return null;
  const parts = split(m[1]);
  let shape = 'ellipse', side = 'far';
  if (!/^(rgb|#|[a-z]+\s*\(|transparent)/i.test(parts[0]) || /^(circle|ellipse|closest-side|farthest-corner)\b/.test(parts[0])) {
    const head = parts.shift().split(/\s+/);
    for (const w of head) {
      if (w === 'circle' || w === 'ellipse') shape = w;
      else if (w === 'closest-side') side = 'near';
      else if (w !== 'farthest-corner') return null; // (a position, or another size: not drawn here)
    }
  }
  const stops = [];
  for (const p of parts) {
    const mm = /^(.*?\))\s*([\d.]+%)?(?:\s+([\d.]+%))?$/.exec(p) || /^(\S+)\s*([\d.]+%)?(?:\s+([\d.]+%))?$/.exec(p);
    if (!mm) return null;
    const c = rgbaOf(mm[1]);
    if (!c) return null;
    stops.push([mm[2] != null ? parseFloat(mm[2]) / 100 : null, c]);
    if (mm[3] != null) stops.push([parseFloat(mm[3]) / 100, c]);
  }
  if (stops.length < 2) return null;
  // the stops without a place: the first at 0, the last at 1, others evenly between their neighbours
  if (stops[0][0] == null) stops[0][0] = 0;
  if (stops[stops.length - 1][0] == null) stops[stops.length - 1][0] = 1;
  for (let i = 1; i < stops.length - 1; i++) {
    if (stops[i][0] != null) continue;
    let j = i;
    while (stops[j][0] == null) j++;
    const a = stops[i - 1][0], b = stops[j][0];
    for (let k = i; k < j; k++) stops[k][0] = a + ((b - a) * (k - i + 1)) / (j - i + 1);
  }
  for (let i = 1; i < stops.length; i++) stops[i][0] = Math.max(stops[i][0], stops[i - 1][0]);
  return { circle: shape === 'circle', side, stops };
}

// The picture of a radial gradient's stops: a square of `size` px, the
// gradient sized to its corners (side 'far'), or to its sides ('near'), as CSS
// lays it; past its last stop the last colour goes on, as in CSS (`round`: cut
// to the circle inside, as border-radius: 50% does). A stop with no alpha
// takes its neighbour's colour (CSS mixes colours with their alpha, a canvas
// does not: fading to "transparent", black, would darken the edge).
export function softPic(stops, size = 192, round = false, side = 'far') {
  const key = `${size}|${round ? 'o' : ''}|${side}|${JSON.stringify(stops)}`;
  let url = pics.get(key);
  if (url) return url;
  const c = paintSoft(stops, size, round, side);
  url = c.toDataURL('image/png');
  c.width = c.height = 0; // (its memory goes now)
  pics.set(key, url);
  return url;
}

// The same, its picture made by the browser out of the way (toBlob), for a
// move being built: resolves with its URL (kept for the page, like the rest).
const later = new Map();
export function softPicSoon(stops, size = 192, round = false, side = 'far') {
  const key = `${size}|${round ? 'o' : ''}|${side}|${JSON.stringify(stops)}`;
  if (pics.has(key)) return Promise.resolve(pics.get(key));
  if (!later.has(key)) {
    later.set(key, new Promise((resolve) => {
      const c = paintSoft(stops, size, round, side);
      c.toBlob((b) => {
        c.width = c.height = 0;
        const url = b ? URL.createObjectURL(b) : softPic(stops, size, round, side);
        pics.set(key, url);
        later.delete(key);
        resolve(url);
      }, 'image/png');
    }));
  }
  return later.get(key);
}

function paintSoft(stops, size, round, side) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d'), h = size / 2;
  const grad = g.createRadialGradient(h, h, 0, h, h, side === 'near' ? h : h * Math.SQRT2);
  stops.forEach(([at, [r, gg, b, a]], i) => {
    let rgb = [r, gg, b];
    if (a < 0.004) {
      const near = stops[i - 1]?.[1][3] >= 0.004 ? stops[i - 1] : stops[i + 1];
      if (near) rgb = near[1].slice(0, 3);
    }
    grad.addColorStop(Math.min(1, Math.max(0, at)), `rgba(${rgb.map(Math.round).join(',')},${a})`);
  });
  if (round) { g.beginPath(); g.arc(h, h, h, 0, 2 * Math.PI); g.clip(); }
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}
