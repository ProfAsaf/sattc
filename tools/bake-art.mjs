// Bake the drawn card art into small WebP images, so phones show a plain
// picture on the table and in the gallery instead of rendering SVG filters
// for every card (the big zoom view still draws the live, animated SVG).
//
//   python tools/serve.py 8770        (in another terminal)
//   node tools/bake-art.mjs            (all cards)
//   node tools/bake-art.mjs id1,id2    (just these)
//
// Writes art/raw/<id>.png (kept out of git), then runs tools/bake_post.py,
// which makes art/<id>.webp and rewrites js/art-manifest.js.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.BASE || 'http://localhost:8770';
const W = 600, H = 420; // the art canvas is 300 × 210; twice that is sharp on a phone
const only = process.argv[2] ? process.argv[2].split(',') : null;
const chrome = join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe');
const port = 9500 + Math.floor(Math.random() * 400);
// A throwaway browser profile (tens of MB): removed again when the run ends.
const profile = mkdtempSync(join(tmpdir(), 'bake-'));
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-extensions', '--hide-scrollbars', `--window-size=${W},${H}`, 'about:blank'], { stdio: 'ignore' });
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
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `${BASE}/tools/bake.html` });
  for (let k = 0; k < 60 && !(await evaluate('!!window.ready').catch(() => false)); k++) await sleep(250);
  const ids = only || await evaluate('window.ids');
  const raw = join(ROOT, 'art', 'raw');
  mkdirSync(raw, { recursive: true });
  for (const id of ids) {
    await evaluate(`window.show(${JSON.stringify(id)})`);
    const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: W, height: H, scale: 1 } });
    writeFileSync(join(raw, `${id}.png`), Buffer.from(data, 'base64'));
    process.stdout.write('.');
  }
  console.log(`\nbaked ${ids.length} pictures`);
} finally {
  try { ws?.close(); } catch { /* closed */ }
  await closeBrowser();
}
const post = spawnSync('python', [join(ROOT, 'tools', 'bake_post.py')], { stdio: 'inherit' });
process.exit(post.status ?? 0);
