// Card art drawn in code. Pictures are built once per card and cached.

import { Scene } from './kit.js';
import { SCENES } from './scenes.js';

const cache = new Map();

export function hasArt(id) {
  return Object.prototype.hasOwnProperty.call(SCENES, id);
}

export function artSVG(id) {
  if (!hasArt(id)) return null;
  if (!cache.has(id)) cache.set(id, SCENES[id](new Scene('a-' + id)));
  return cache.get(id);
}

// The same picture as an image URL. Small, static uses (gallery, deckbuilder,
// the table) show it as an <img>: the browser rasterises it once and reuses
// the bitmap, instead of re-parsing ~20KB of SVG every time the table redraws.
const urls = new Map();
export function artImage(id) {
  if (!hasArt(id) || typeof URL.createObjectURL !== 'function') return null;
  if (!urls.has(id)) urls.set(id, URL.createObjectURL(new Blob([artSVG(id)], { type: 'image/svg+xml' })));
  return urls.get(id);
}
