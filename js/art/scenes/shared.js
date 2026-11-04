// Helpers shared by the faction art files.

import { W, rng } from '../kit.js';

export const PAL = {
  ember:   { fig: '#140705', rim: '#ff9447', glow: '#ff7a2e', hot: '#ffd27a' },
  verdant: { fig: '#1b2714', rim: '#fff3c0', glow: '#e6f78f', hot: '#f7ffc8' },
  tide:    { fig: '#06151b', rim: '#a6e4ec', glow: '#c6f4f6', hot: '#f4f3d6' },
  umbral:  { fig: '#0a0710', rim: '#b8a6e2', glow: '#b07cff', hot: '#efe2ff' },
  radiant: { fig: '#2a1f15', rim: '#fff0c2', glow: '#ffd77a', hot: '#fff7dc' },
};

// Give every scene in a faction file that faction's finish (colour grade,
// vignette; see Scene.finish in kit.js). A scene can still override it.
export const faction = (name, scenes) => Object.fromEntries(Object.entries(scenes).map(([id, fn]) => [id, (s) => fn(s.finish({ faction: name }))]));

export const mirror = (d) => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${(W - Number(x)).toFixed(1)},${y}`);

// A drifting sheet of paper with a few lines of writing.
export function page(cx, cy, rot, op, t, d) {
  return `<g class="float" style="--t:${t}s;--d:${d}s"><g transform="translate(${cx} ${cy}) rotate(${rot})" opacity="${op}">
    <rect x="-4.5" y="-6" width="9" height="12" rx=".8" fill="#f4f0d6"/>
    <path d="M-3,-3.5h6M-3,-1.5h6M-3,.5h4.5M-3,2.5h5.5" stroke="#9aa79e" stroke-width=".45"/></g></g>`;
}

// Arcade wall with arched openings and a broken top (evenodd holes).
export function arcade({ seed, x0, x1, base, h, bay = 26, col = 6 }) {
  const r = rng(seed);
  let d = `M${x0},${base}L${x0},${base - h}`;
  for (let x = x0; x <= x1; x += 5) d += `L${x},${(base - h + (r() < 0.25 ? 4 + r() * 16 : r() * 3)).toFixed(1)}`;
  d += `L${x1},${base}Z`;
  const ar = (bay - col) / 2;
  for (let x = x0 + col; x + bay - col <= x1; x += bay) {
    const top = base - h * 0.5;
    d += `M${x},${base}L${x},${top}A${ar},${ar} 0 0 1 ${x + bay - col},${top}L${x + bay - col},${base}Z`;
  }
  return d;
}
