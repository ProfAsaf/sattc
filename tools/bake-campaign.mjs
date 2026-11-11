// Bake the campaign's pictures (js/art/campaign-art.js) into WebP: the map
// and the places are big dioramas full of filters, too slow to draw live on a
// phone, so they are photographed once here at four times their size (sharp
// on a phone at full width); their moving parts are cut out as sprites that
// the campaign page lays over the picture and moves.
//
//   python tools/serve.py 8770        (in another terminal)
//   node tools/bake-campaign.mjs       (all of them)
//   node tools/bake-campaign.mjs id    (just these, comma-separated)
//
// Writes art/campaign/<id>.webp (the picture), art/campaign/<id>.json (its
// moving parts) and js/campaign-pics.js (each picture's files with
// cache-busting versions, its size and its spots). The raw PNGs go to
// art/campaign/raw (kept out of git).

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://localhost:8770';
const SCALE = 4; // a 300-wide drawing shown 400 wide on a 3x phone
const only = process.argv[2] ? process.argv[2].split(',') : null;
const chrome = join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe');
const port = 9500 + Math.floor(Math.random() * 400);
// A throwaway browser profile (tens of MB): removed again when the run ends.
const profile = mkdtempSync(join(tmpdir(), 'bake-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--window-size=1300,3100', 'about:blank'], { stdio: 'ignore' });
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
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
  return r.result.value;
}

try {
  let targets = [];
  for (let k = 0; k < 40 && !targets.length; k++) { try { targets = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).filter((t) => t.type === 'page'); } catch { /* starting */ } await sleep(250); }
  ws = new WebSocket(targets[0].webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  ws.onmessage = (m) => { const d = JSON.parse(m.data); const p = pending.get(d.id); if (p) { pending.delete(d.id); d.error ? p.reject(new Error(d.error.message)) : p.resolve(d.result); } };
  await send('Page.enable');
  await send('Page.navigate', { url: `${BASE}/tools/bake-campaign.html?nc=${Date.now()}` });
  for (let k = 0; k < 60 && !(await evaluate('!!window.ready').catch(() => false)); k++) await sleep(250);
  const ids = only || await evaluate('window.ids');
  const raw = join(ROOT, 'art', 'campaign', 'raw');
  mkdirSync(raw, { recursive: true });
  for (const id of ids) {
    const L = await evaluate(`window.live(${JSON.stringify(id)})`);
    writeFileSync(join(ROOT, 'art', 'campaign', `${id}.json`), JSON.stringify({ defs: L.defs, sprites: L.sprites }));
    writeFileSync(join(raw, `${id}.meta.json`), JSON.stringify({ w: L.w, h: L.h, spots: L.spots, n: L.sprites.length }));
    const [w, h] = await evaluate(`window.size(${JSON.stringify(id)})`);
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: SCALE, mobile: false });
    await evaluate(`window.show(${JSON.stringify(id)})`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: w, height: h, scale: 1 } });
    writeFileSync(join(raw, `${id}.png`), Buffer.from(data, 'base64'));
    process.stdout.write(`${id} (${L.sprites.length} moving) `);
  }
  console.log(`\nbaked ${ids.length} pictures`);
} finally {
  try { ws?.close(); } catch { /* closed */ }
  await closeBrowser();
}
// PNG -> WebP (only what changed)
const conv = spawnSync('python', ['-c', `
from pathlib import Path
from PIL import Image
out = Path(${JSON.stringify(join(ROOT, 'art', 'campaign'))})
for src in sorted((out / 'raw').glob('*.png')):
    dst = out / (src.stem + '.webp')
    if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
        Image.open(src).convert('RGB').save(dst, 'WEBP', quality=78, method=6)
`], { stdio: 'inherit' });
if (conv.status) process.exit(conv.status);
// the list of pictures: files with versions, sizes, spots
const dir = join(ROOT, 'art', 'campaign');
const ver = (f) => createHash('sha1').update(readFileSync(join(dir, f))).digest('hex').slice(0, 8);
const all = await (async () => { const { CAMPAIGN_ART } = await import('../js/art/campaign-art.js'); return Object.keys(CAMPAIGN_ART); })();
let kb = 0;
const rows = all.map((id) => {
  const m = JSON.parse(readFileSync(join(dir, 'raw', `${id}.meta.json`), 'utf8'));
  kb += (readFileSync(join(dir, `${id}.webp`)).length + readFileSync(join(dir, `${id}.json`)).length) / 1024;
  return `  ${JSON.stringify(id)}: { src: 'art/campaign/${id}.webp?v=${ver(`${id}.webp`)}', live: 'art/campaign/${id}.json?v=${ver(`${id}.json`)}', w: ${m.w}, h: ${m.h}, spots: ${JSON.stringify(m.spots)} },`;
});
writeFileSync(join(ROOT, 'js', 'campaign-pics.js'), `// Written by tools/bake-campaign.mjs: each campaign picture (js/art/campaign-art.js)
// baked: the picture, its moving parts, its size in the drawing's units, and
// where its levels or rounds sit.
export const PICS = {
${rows.join('\n')}
};
`);
console.log(`campaign-pics.js: ${all.length} pictures, ${Math.round(kb)} KB`);
