// Bake cards that stay on screen with their art moving (Home's fan): the
// picture without its moving parts or its characters as a WebP; its ambient
// moving parts as sprites; and each character (js/art/alive.js) as a picture
// of its own, cut from the finished art so it keeps the grade, vignette and
// grain, to breathe over the rest (js/sprites.js moves them all: the
// compositor's work, nothing redrawn). The same art drawn live as an SVG
// repaints every frame, filters and all.
//
// A character's picture: the art photographed whole (F), without the
// characters (B), and the character alone on nothing (its coverage, a); its
// colours are what, laid over B with that coverage, give back F exactly:
// (F - B(1 - a)) / a.
//
// A puppet (js/art/puppets.js; living-cards.md) is cut the same way, part by
// part: each source photographed with what's drawn after it hidden (F),
// without itself as well (B), and alone (A), split by its polygons, and the
// picture left without its parts: art/live/<id>-p-<part>.webp.
//
//   python tools/serve.py 8770          (in another terminal)
//   node tools/bake-live.mjs             (Home's fan: Ashmaw, Seraphine, the Barrow Queen)
//   node tools/bake-live.mjs id1,id2     (these cards; the others baked before stay)
//
// Writes art/live/<id>.webp, art/live/<id>-a<k>.webp (its characters) and
// art/live/<id>.json, and js/art-live.js (every card baked so far, with
// cache-busting versions). Raw PNGs: art/live/raw (kept out of git).

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// js/art-live.js: every card baked so far (in art/live), with cache-busting versions.
//   node tools/bake-live.mjs --manifest   (only that: after merging bakes made elsewhere)
function writeManifest() {
  const d = join(ROOT, 'art', 'live');
  const v = (f) => createHash('sha1').update(readFileSync(join(d, f))).digest('hex').slice(0, 8);
  const baked = readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).filter((id) => existsSync(join(d, `${id}.webp`))).sort();
  writeFileSync(join(ROOT, 'js', 'art-live.js'), `// Written by tools/bake-live.mjs: cards whose art, shown big and moving, is a
// baked picture without its moving parts or characters, with those as
// sprites over it (js/sprites.js): nothing redrawn while they move.
export const LIVE = {
${baked.map((id) => `  ${JSON.stringify(id)}: { src: 'art/live/${id}.webp?v=${v(`${id}.webp`)}', live: 'art/live/${id}.json?v=${v(`${id}.json`)}' },`).join('\n')}
};
`);
  console.log(`art-live.js: ${baked.length} cards`);
}
if (process.argv.includes('--manifest')) { writeManifest(); process.exit(0); }
const BASE = process.env.BASE || 'http://localhost:8770';
const SCALE = 2; // a 300-wide picture shown about 140 wide in the fan on a 3x phone
const HOME_FAN = ['ashmaw', 'seraphine', 'the-barrow-queen']; // (app.js home)
const ids = process.argv[2] ? process.argv[2].split(',') : HOME_FAN;
const chrome = join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe');
const port = 9500 + Math.floor(Math.random() * 400);
// A throwaway browser profile (tens of MB): removed again when the run ends.
const profile = mkdtempSync(join(tmpdir(), 'bake-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--window-size=700,500', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function closeBrowser() {
  // on Windows the browser's helper processes hold the profile open: end the whole tree
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { stdio: 'ignore' });
  await new Promise((r) => { if (proc.exitCode != null) return r(); proc.once('exit', r); proc.kill(); setTimeout(r, 4000); });
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 30, retryDelay: 200 }); } catch { /* still locked: the OS cleans Temp eventually */ }
}
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { closeBrowser().finally(() => process.exit(1)); });

let ws, seq = 0;
const pending = new Map();
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
async function evaluate(expression) {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}

const dir = join(ROOT, 'art', 'live'), raw = join(dir, 'raw');
const pics = {}; // id -> its ambient sprites and characters
mkdirSync(raw, { recursive: true });
try {
  let targets = [];
  for (let k = 0; k < 40 && !targets.length; k++) { try { targets = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter((t) => t.type === 'page'); } catch { /* starting */ } await sleep(250); }
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); const p = pending.get(d.id); if (p) { pending.delete(d.id); d.error ? p.reject(new Error(d.error.message)) : p.resolve(d.result); } };
  await send('Page.enable');
  await send('Page.navigate', { url: `${BASE}/tools/bake-live.html?nc=${Date.now()}` });
  for (let k = 0; k < 60 && !(await evaluate('!!window.ready').catch(() => false)); k++) await sleep(250);
  const [w, h] = await evaluate('window.size');
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: SCALE, mobile: false });
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } }); // (a character alone: on nothing)
  const shot = async (file) => {
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(join(raw, file), Buffer.from(data, 'base64'));
  };
  for (const id of ids) {
    const L = await evaluate(`window.live(${JSON.stringify(id)})`);
    // a puppet (js/art/puppets.js): its parts, each from its source's three photographs
    const P = await evaluate(`window.prepPuppet(${JSON.stringify(id)})`);
    if (P) {
      await evaluate(`window.viewPup('base')`); await shot(`${id}.png`);
      for (let i = 0; i < P.sources.length; i++) {
        for (const mode of ['upto', 'below', 'alone']) { await evaluate(`window.viewPup('${mode}', ${i})`); await shot(`${id}-s${i}-${mode}.png`); }
      }
      pics[id] = { L, groups: [], puppet: P };
      process.stdout.write(`${id} (${L.sprites.length} moving, puppet: ${P.parts.map((p) => p.name).join(' ')}) `);
      continue;
    }
    const groups = await evaluate(`window.prep(${JSON.stringify(id)})`);
    await evaluate(`window.view('base')`); await shot(`${id}.png`);
    await evaluate(`window.view('full')`); await shot(`${id}-full.png`);
    for (let k = 0; k < groups.length; k++) { await evaluate(`window.view('alpha', ${k})`); await shot(`${id}-a${k}.png`); }
    pics[id] = { L, groups };
    process.stdout.write(`${id} (${L.sprites.length} moving, ${groups.length} alive) `);
  }
  console.log(`\nbaked ${ids.length} cards`);
} finally {
  try { ws?.close(); } catch { /* closed */ }
  await closeBrowser();
}
// The bases to WebP; each character cut from the finished art
const conv = spawnSync('python', ['-c', `
import json, re
from pathlib import Path
import numpy as np
from PIL import Image
out = Path(${JSON.stringify(dir)}); raw = out / 'raw'
todo = json.loads(${JSON.stringify(JSON.stringify(Object.fromEntries(Object.entries(pics).map(([id, p]) => [id, p.groups.length]))))})
pups = json.loads(${JSON.stringify(JSON.stringify(Object.fromEntries(Object.entries(pics).filter(([, p]) => p.puppet).map(([id, p]) => [id, p.puppet]))))})
S = ${SCALE}
cuts = {}
def poly_mask(shape, poly):
    # the polygon (drawing units), antialiased: drawn four times larger, then shrunk
    from PIL import ImageDraw
    big = Image.new('L', (shape[1] * 4, shape[0] * 4), 0)
    ImageDraw.Draw(big).polygon([(x * S * 4, y * S * 4) for x, y in poly], fill=255)
    return np.asarray(big.resize((shape[1], shape[0]), Image.LANCZOS), dtype=np.float32) / 255.0
def cut_out(name, F, B, A, m):
    a = A * m
    ys, xs = np.nonzero(a > 0.03)
    if not len(xs):
        return None
    x0, x1, y0, y1 = max(0, xs.min() - 2), min(A.shape[1], xs.max() + 3), max(0, ys.min() - 2), min(A.shape[0], ys.max() + 3)
    sa, sA = a[y0:y1, x0:x1], A[y0:y1, x0:x1]
    C = np.clip((F[y0:y1, x0:x1] - B[y0:y1, x0:x1] * (1 - sA[..., None])) / np.maximum(sA, 0.03)[..., None], 0, 255)
    Image.fromarray(np.dstack([C, np.where(sa > 0.03, sa, 0) * 255]).round().astype(np.uint8), 'RGBA').save(out / name, 'WEBP', quality=90, alpha_quality=95, method=6)
    return { 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0) }
for id, P in pups.items():
    Image.open(raw / (id + '.png')).convert('RGB').save(out / (id + '.webp'), 'WEBP', quality=82, method=6)
    load = lambda i, mode, kind: np.asarray(Image.open(raw / ('%s-s%d-%s.png' % (id, i, mode))).convert(kind), dtype=np.float32)
    cuts[id] = []
    for p in P['parts']:
        i = p['src']
        F, B, A = load(i, 'upto', 'RGB'), load(i, 'below', 'RGB'), load(i, 'alone', 'RGBA')[..., 3] / 255.0
        m = poly_mask(A.shape, p['poly']) if p['poly'] else np.ones_like(A)
        cuts[id].append(cut_out('%s-p-%s.webp' % (id, p['name']), F, B, A, m))
for id, n in todo.items():
    if id in pups:
        continue
    Image.open(raw / (id + '.png')).convert('RGB').save(out / (id + '.webp'), 'WEBP', quality=82, method=6)
    B = np.asarray(Image.open(raw / (id + '.png')).convert('RGB'), dtype=np.float32)
    F = np.asarray(Image.open(raw / (id + '-full.png')).convert('RGB'), dtype=np.float32)
    cuts[id] = []
    for k in range(n):
        A = np.asarray(Image.open(raw / ('%s-a%d.png' % (id, k))).convert('RGBA'), dtype=np.float32)[..., 3] / 255.0
        ys, xs = np.nonzero(A > 0.03)
        if not len(xs):
            cuts[id].append(None); continue
        x0, x1, y0, y1 = max(0, xs.min() - 2), min(A.shape[1], xs.max() + 3), max(0, ys.min() - 2), min(A.shape[0], ys.max() + 3)
        a = A[y0:y1, x0:x1]
        C = np.clip((F[y0:y1, x0:x1] - B[y0:y1, x0:x1] * (1 - a[..., None])) / np.maximum(a, 0.03)[..., None], 0, 255)
        alpha = np.where(a > 0.03, a, 0) * 255
        Image.fromarray(np.dstack([C, alpha]).round().astype(np.uint8), 'RGBA').save(out / ('%s-a%d.webp' % (id, k)), 'WEBP', quality=90, alpha_quality=95, method=6)
        cuts[id].append({ 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0) })
print('CUTS' + json.dumps(cuts))
`], { encoding: 'utf8' });
if (conv.status) { console.log(conv.stdout, conv.stderr); process.exit(conv.status); }
const cuts = JSON.parse(conv.stdout.split('CUTS')[1]);
const ver = (f) => createHash('sha1').update(readFileSync(join(dir, f))).digest('hex').slice(0, 8);
const r1 = (v) => Math.round(v * 10) / 10;
for (const [id, { L, groups, puppet }] of Object.entries(pics)) {
  if (puppet) {
    // a puppet's parts, in the order they're drawn, under the ambient sprites;
    // they keep still until js/home-alive.js moves them (about their joints)
    const parts = puppet.parts.map((p, k) => {
      const c = cuts[id][k];
      if (!c) return null;
      const x = c.x / SCALE, y = c.y / SCALE, w = c.w / SCALE, h = c.h / SCALE;
      return { a: 'part', name: p.name, x: r1(x), y: r1(y), w: r1(w), h: r1(h), ox: r1(((p.pivot[0] - x) / w) * 100), oy: r1(((p.pivot[1] - y) / h) * 100), img: `art/live/${id}-p-${p.name}.webp?v=${ver(`${id}-p-${p.name}.webp`)}`, src: p.src };
    }).filter(Boolean).sort((a, b) => a.src - b.src).map(({ src, ...s }) => s);
    writeFileSync(join(dir, `${id}.json`), JSON.stringify({ defs: L.defs, sprites: [...parts, ...L.sprites] }));
    continue;
  }
  // each character under the ambient sprites, breathing from its feet (or, in the air, its middle)
  const chars = groups.map((g, k) => {
    const c = cuts[id][k];
    if (!c) return null;
    const x = c.x / SCALE, y = c.y / SCALE, w = c.w / SCALE, h = c.h / SCALE;
    const ox = r1(((g.box.x + g.box.w / 2 - x) / w) * 100), oy = r1(((g.box.y + (g.kind === 'ground' ? g.box.h : g.box.h / 2) - y) / h) * 100);
    return { a: g.kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), ox, oy, d: g.d, img: `art/live/${id}-a${k}.webp?v=${ver(`${id}-a${k}.webp`)}` };
  }).filter(Boolean);
  writeFileSync(join(dir, `${id}.json`), JSON.stringify({ defs: L.defs, sprites: [...chars, ...L.sprites] }));
}
// every card baked so far, with versions
writeManifest();
