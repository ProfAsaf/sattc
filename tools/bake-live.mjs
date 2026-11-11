// Bake cards that stay on screen with their art moving (Home's fan): the
// picture without its moving parts as a WebP, and those parts as sprites
// (js/sprites.js moves them: the compositor's work, nothing redrawn). The
// same art drawn live as an SVG repaints every frame, filters and all.
//
//   python tools/serve.py 8770          (in another terminal)
//   node tools/bake-live.mjs             (Home's fan: Ashmaw, Seraphine, the Barrow Queen)
//   node tools/bake-live.mjs id1,id2     (these cards; the others baked before stay)
//
// Writes art/live/<id>.webp and art/live/<id>.json, and js/art-live.js (every
// card baked so far, with cache-busting versions). Raw PNGs: art/live/raw
// (kept out of git).

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
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
  for (const id of ids) {
    const L = await evaluate(`window.live(${JSON.stringify(id)})`);
    writeFileSync(join(dir, `${id}.json`), JSON.stringify(L));
    await evaluate(`window.show(${JSON.stringify(id)})`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(join(raw, `${id}.png`), Buffer.from(data, 'base64'));
    process.stdout.write(`${id} (${L.sprites.length} moving) `);
  }
  console.log(`\nbaked ${ids.length} cards`);
} finally {
  try { ws?.close(); } catch { /* closed */ }
  await closeBrowser();
}
// PNG -> WebP (only what changed)
const conv = spawnSync('python', ['-c', `
from pathlib import Path
from PIL import Image
out = Path(${JSON.stringify(dir)})
for src in sorted((out / 'raw').glob('*.png')):
    dst = out / (src.stem + '.webp')
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        Image.open(src).convert('RGB').save(dst, 'WEBP', quality=82, method=6)
`], { stdio: 'inherit' });
if (conv.status) process.exit(conv.status);
// every card baked so far, with versions
const ver = (f) => createHash('sha1').update(readFileSync(join(dir, f))).digest('hex').slice(0, 8);
const baked = readdirSync(dir).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)).filter((id) => existsSync(join(dir, `${id}.json`))).sort();
writeFileSync(join(ROOT, 'js', 'art-live.js'), `// Written by tools/bake-live.mjs: cards whose art, shown big and moving, is a
// baked picture without its moving parts, with those parts as sprites over it
// (js/sprites.js): nothing redrawn while they move.
export const LIVE = {
${baked.map((id) => `  ${JSON.stringify(id)}: { src: 'art/live/${id}.webp?v=${ver(`${id}.webp`)}', live: 'art/live/${id}.json?v=${ver(`${id}.json`)}' },`).join('\n')}
};
`);
console.log(`art-live.js: ${baked.length} cards`);
