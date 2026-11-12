// A small headless-Chrome driver for the bake-off checks (Chrome DevTools
// Protocol over a WebSocket). One browser per run, its own throwaway profile,
// a phone-sized page (402 x 799 at 2x, touch). The browser and its profile
// folder are always removed when the run ends, however it ends: profiles are
// tens of MB and once nearly filled the disk.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const CHROME = join(process.env.LOCALAPPDATA || '', 'ms-playwright', 'chromium-1234', 'chrome-win64', 'chrome.exe');
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const PHONE = { width: 402, height: 799, scale: 2 };

// The page server's address: BASE in the environment (python tools/serve.py <port>).
export function base() {
  const b = process.env.BASE;
  if (!b) throw new Error("Set BASE to your server, e.g. BASE=http://localhost:PORT node bakeoff/checks/check.mjs <id>");
  return b.replace(/\/$/, '');
}

const OPEN = new Set();
function shut(b) {
  if (!OPEN.delete(b)) return;
  // on Windows the helper processes hold the profile open: end the whole tree, then retry the delete
  try { if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(b.proc.pid), '/T', '/F'], { stdio: 'ignore' }); else b.proc.kill('SIGKILL'); } catch { /* gone */ }
  for (let i = 0; i < 40; i++) {
    try { rmSync(b.profile, { recursive: true, force: true }); break; } catch { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250); }
  }
}
process.on('exit', () => { for (const b of [...OPEN]) shut(b); });
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => process.exit(1));

export async function open({ width = PHONE.width, height = PHONE.height, scale = PHONE.scale, mobile = true, transparent = false } = {}) {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(tmpdir(), 'bko-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--hide-scrollbars', '--mute-audio', `--window-size=${width + 30},${height + 60}`, 'about:blank'], { stdio: 'ignore' });
  const browser = { proc, profile };
  OPEN.add(browser);
  let target = null;
  for (let k = 0; k < 80 && !target; k++) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === 'page'); } catch { /* starting */ }
    if (!target) await sleep(150);
  }
  if (!target) { shut(browser); throw new Error('Chrome did not start'); }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let seq = 0;
  const pending = new Map(), heard = new Map(), problems = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.method && heard.has(d.method)) for (const fn of heard.get(d.method)) fn(d.params);
    if (d.method === 'Runtime.exceptionThrown') problems.push(`exception: ${d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text}`);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') problems.push(`console.error: ${d.params.args.map((a) => a.value ?? a.description).join(' ')}`);
    if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error' && !/favicon/.test(d.params.entry.url || '')) problems.push(`log: ${d.params.entry.text} ${d.params.entry.url || ''}`);
    const p = pending.get(d.id);
    if (p) { pending.delete(d.id); d.error ? p.reject(new Error(d.error.message)) : p.resolve(d.result); }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => { const id = ++seq; pending.set(id, { resolve, reject }); ws.send(JSON.stringify({ id, method, params })); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  if (transparent) await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  const pg = {
    send, problems,
    on(method, fn) { if (!heard.has(method)) heard.set(method, []); heard.get(method).push(fn); },
    async ev(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description || r.exceptionDetails.text).slice(0, 600));
      return r.result.value;
    },
    async goto(url) { await send('Page.navigate', { url }); await sleep(250); await pg.waitFor('document.readyState === "complete"', 20000); },
    async waitFor(expr, timeout = 15000, every = 100) {
      const t0 = Date.now();
      for (;;) {
        let v = null;
        try { v = await pg.ev(expr); } catch { /* mid-load */ }
        if (v) return v;
        if (Date.now() - t0 > timeout) throw new Error(`timed out waiting for ${expr}`);
        await sleep(every);
      }
    },
    // a PNG of a region of the page (css px), at `k` times css px
    async shot(clip, k = 1) {
      const { data } = await send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: k / scale }, captureBeyondViewport: false });
      return Buffer.from(data, 'base64');
    },
    close() { try { ws.close(); } catch { /* fine */ } shut(browser); },
  };
  return pg;
}

// Runs fn(pg) with a browser, and always closes it; gives up after `limit` ms.
export async function withChrome(opts, fn, limit = 180000) {
  const pg = await open(opts);
  let timer;
  try {
    return await Promise.race([fn(pg), new Promise((_, j) => { timer = setTimeout(() => j(new Error(`gave up after ${limit / 1000} s`)), limit); })]);
  } finally { clearTimeout(timer); pg.close(); }
}
