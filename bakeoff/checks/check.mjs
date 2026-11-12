// The bake-off checks for one card (bakeoff/recipe.md). Needs the page server:
// python tools/serve.py <port>, and BASE=http://localhost:<port>.
//
//   node bakeoff/checks/check.mjs <id>            all four checks
//   node bakeoff/checks/check.mjs <id> a b        some of them (a, b, c, d)
//   node bakeoff/checks/check.mjs <id> start      note that you start work on this card (no checks)
//   node bakeoff/checks/check.mjs <id> look       the drawing alone, big: bakeoff/out/<id>-look.png
//   node bakeoff/checks/check.mjs <id> d --video  also the whole move as an animated WebP
//
// (a) still: the drawing is pixel-identical to before you touched it (bakeoff/ref/<id>.png): 0 changed pixels
// (b) bake:  every part in js/art/puppets.js was cut, and the baked picture with its
//            parts laid back at rest looks like the drawing (no holes, no missing bits)
// (c) cheap: the move runs on the compositor: no animation left on the main thread,
//            no style or layout work while it plays, and nothing left running after
// (d) strip: about 8 stills across the move, in one picture: bakeoff/out/<id>-strip.png
//
// Each run is noted in bakeoff/out/log.jsonl; the last report is bakeoff/out/<id>-report.json.
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { base, sleep, withChrome } from './chrome.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(ROOT, 'bakeoff', 'out');
const REF = join(ROOT, 'bakeoff', 'ref');
mkdirSync(OUT, { recursive: true });
const [id, ...rest] = process.argv.slice(2);
if (!id) { console.log('usage: node bakeoff/checks/check.mjs <card id> [a b c d | start | look] [--video]'); process.exit(2); }
const flags = new Set(rest.filter((a) => a.startsWith('--')));
const words = rest.filter((a) => !a.startsWith('--'));
const log = (o) => appendFileSync(join(OUT, 'log.jsonl'), JSON.stringify({ t: new Date().toISOString(), id, ...o }) + '\n');
const py = (...args) => {
  const r = spawnSync('python', [join(HERE, 'img.py'), ...args], { encoding: 'utf8' });
  if (r.status) throw new Error(`img.py ${args[0]}: ${r.stderr.slice(-400)}`);
  return JSON.parse(r.stdout.trim().split('\n').pop());
};

const START = words[0] === 'start';
if (START) { log({ run: 'start' }); console.log(`noted: you start ${id}`); }

const B = START ? '' : base();
const tmp = mkdtempSync(join(tmpdir(), 'bkc-'));
const report = { id, at: new Date().toISOString(), pass: {}, notes: [] };
const want = words.length ? [...words] : ['a', 'b', 'c', 'd'];
if (START || words[0] === 'ref' || words[0] === 'look') want.length = 0;

// a picture of the drawing (still.html, 300 x 210 css px) at `k` x
async function still(mode, file, k = 2) {
  return withChrome({ width: 300, height: 210, scale: k, mobile: false, transparent: true }, async (pg) => {
    await pg.goto(`${B}/bakeoff/still.html?id=${encodeURIComponent(id)}&mode=${mode}&nc=${Date.now()}`);
    await pg.waitFor('window.ready || window.failed', 20000);
    const failed = await pg.ev('window.failed || null');
    if (failed) throw new Error(`still.html (${mode}): ${failed}`);
    const parts = await pg.ev('window.parts || null');
    writeFileSync(file, await pg.shot({ x: 0, y: 0, width: 300, height: 210 }, k));
    return parts;
  }, 60000);
}

try {
  if (words[0] === 'ref') {
    // (setting up the bake-off: the drawing as it was before any work)
    mkdirSync(REF, { recursive: true });
    await still('draw', join(REF, `${id}.png`));
    console.log(`bakeoff/ref/${id}.png written`);
  }
  if (words[0] === 'look') {
    await still('draw', join(OUT, `${id}-look.png`), 3);
    console.log(`bakeoff/out/${id}-look.png: the drawing, 900 x 630 (its units x 3)`);
  }

  // (a) the still drawing, unchanged
  if (want.includes('a')) {
    const ref = join(REF, `${id}.png`);
    if (!existsSync(ref)) throw new Error(`no reference picture bakeoff/ref/${id}.png`);
    const now = join(OUT, `${id}-draw.png`);
    await still('draw', now);
    const d = py('diff', ref, now, join(OUT, `${id}-a-diff.png`));
    report.a = d;
    report.pass.a = !d.error && d.changed === 0;
    console.log(`(a) still drawing unchanged: ${report.pass.a ? 'PASS' : 'FAIL'}  ${d.error || `${d.changed} changed pixels of ${d.pixels} (${d.over24} by more than 24 levels)${d.changed ? `, in the box ${d.box}; see bakeoff/out/${id}-a-diff.png` : ''}`}`);
  }

  // (b) the bake
  if (want.includes('b')) {
    const notes = [];
    const { PUPPETS } = await import(pathToFileURL(join(ROOT, 'js', 'art', 'puppets.js')).href + `?t=${Date.now()}`);
    const spec = PUPPETS[id];
    const live = readFileSync(join(ROOT, 'js', 'art-live.js'), 'utf8');
    const jf = join(ROOT, 'art', 'live', `${id}.json`);
    let parts = [];
    if (!spec) notes.push(`no puppet for ${id} in js/art/puppets.js`);
    if (!live.includes(`"${id}"`)) notes.push(`${id} is not in js/art-live.js (bake it: tools/bake-live.mjs ${id})`);
    if (!existsSync(jf)) notes.push(`no art/live/${id}.json (bake it)`);
    else {
      parts = JSON.parse(readFileSync(jf, 'utf8')).sprites.filter((s) => s.a === 'part');
      for (const p of spec?.parts || []) {
        const s = parts.find((x) => x.name === p.name);
        if (!s) notes.push(`part "${p.name}" was not cut (nothing of it in the picture? check its source "${JSON.stringify(p.of)}" and polygon)`);
        else if (!existsSync(join(ROOT, 'art', 'live', `${id}-p-${p.name}.webp`))) notes.push(`art/live/${id}-p-${p.name}.webp is missing`);
      }
      for (const s of parts) if (!(spec?.parts || []).some((p) => p.name === s.name)) notes.push(`baked part "${s.name}" is no longer in the puppet: bake again`);
    }
    let d = null;
    if (!notes.length) {
      const drawn = join(OUT, `${id}-noamb.png`), baked = join(OUT, `${id}-baked.png`);
      await still('noamb', drawn);
      await still('baked', baked);
      d = py('diff', drawn, baked, join(OUT, `${id}-b-diff.png`));
      if (d.error) notes.push(d.error);
      else {
        // (WebP's loss gives small differences everywhere, and the parts' soft edges thin
        // outlines; a hole, or a piece missing or out of place, gives a solid patch)
        if (d.solid > 60 || d.mean > 6) notes.push(`the baked picture with its parts at rest differs from the drawing: a solid patch of ${d.solid} px (2x) differs by more than 48 levels${d.solidBox ? ` around x ${d.solidBox[0] / 2}-${d.solidBox[2] / 2}, y ${d.solidBox[1] / 2}-${d.solidBox[3] / 2} in drawing units` : ''} (mean difference ${d.mean}); compare bakeoff/out/${id}-noamb.png (the drawing) with bakeoff/out/${id}-baked.png, and see bakeoff/out/${id}-b-diff.png (red: big differences)`);
      }
    }
    report.b = { parts: parts.map((s) => ({ name: s.name, x: s.x, y: s.y, w: s.w, h: s.h, ox: s.ox, oy: s.oy })), diff: d, notes };
    report.pass.b = !notes.length;
    console.log(`(b) parts bake cleanly: ${report.pass.b ? 'PASS' : 'FAIL'}  ${parts.length} parts (${parts.map((s) => s.name).join(', ') || 'none'})${d && !d.error ? `; at rest vs the drawing: solid patches ${d.solid} px, mean difference ${d.mean}` : ''}`);
    for (const n of notes) console.log(`    - ${n}`);
  }

  // (c) and (d): the harness at phone size
  if (want.includes('c') || want.includes('d')) {
    await withChrome({}, async (pg) => {
      await pg.send('Performance.enable');
      await pg.send('Page.addScriptToEvaluateOnNewDocument', { source: "window.__long = []; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push([e.startTime, e.duration]); }).observe({ type: 'longtask', buffered: true }); } catch (e) {}" });
      await pg.goto(`${B}/bakeoff/harness.html?id=${encodeURIComponent(id)}&nc=${Date.now()}`);
      await pg.waitFor(`window.bk && window.bk.state !== 'loading'`, 30000);
      const inf = await pg.ev('bk.info');
      if (inf.error || (await pg.ev('bk.state')) !== 'ready') {
        const why = inf.error || (await pg.ev('document.getElementById("bk-info").textContent'));
        for (const c of ['c', 'd']) if (want.includes(c)) { report.pass[c] = false; report[c] = { error: why }; }
        console.log(`(c)/(d) the harness has no move to play: ${why}`);
        return;
      }
      report.info = inf;
      const END = inf.END;
      await sleep(600);
      if (want.includes('c')) {
        const events = [];
        let done; const finished = new Promise((r) => (done = r));
        pg.on('Tracing.dataCollected', (p) => events.push(...p.value));
        pg.on('Tracing.tracingComplete', () => done());
        const metrics = async () => Object.fromEntries((await pg.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
        await pg.send('Tracing.start', { categories: 'blink.animations,devtools.timeline,disabled-by-default-devtools.timeline', transferMode: 'ReportEvents' });
        await pg.ev('bk.play()'); // (the first play)
        await sleep(400);
        // the second play, measured while it plays (from 120 ms in to 100 ms before its end)
        const at = await pg.ev('(bk.play(), performance.now())');
        await sleep(120);
        const m1 = await metrics();
        await sleep(END - 220);
        const m2 = await metrics();
        await sleep(400);
        const left = await pg.ev("document.getAnimations().filter((a) => a.playState !== 'idle' && a.constructor.name === 'Animation' && !a.effect?.target?.matches?.('.sp:not([data-part])')).map((a) => { const t = a.effect?.target; return t ? t.tagName.toLowerCase() + '.' + [...t.classList].join('.') + (t.dataset?.part ? '[' + t.dataset.part + ']' : '') + ' (' + a.constructor.name + (a.animationName ? ' ' + a.animationName : '') + ')' : '?'; })");
        const long = await pg.ev(`Math.round(Math.max(0, ...window.__long.filter(([s, d]) => s + d > ${at} - 50 && s < ${at} + ${END}).map(([, d]) => d)))`);
        await pg.send('Tracing.end');
        await finished;
        // (left: the move's own motions still going; the card's ambient sprites and its CSS sheen go on for ever)
        // every animation Chrome would not run on the compositor, and why (the trace's compositeFailed bits)
        const WHY = ['devtools', 'suppressed', 'invalid animation', 'unsupported timing', 'non-replace composite', 'target in an invalid state', 'incompatible animations',
          'css offset', '(8)', 'several transform properties', 'non-css properties', 'transform cannot be accelerated', 'filter that moves pixels', 'unsupported property', '(14)',
          'mixed keyframe types', 'timeline source', 'no effect', 'important', 'svg independent transform'];
        const why = (n) => WHY.filter((_, i) => n & (1 << i)).join(', ');
        const byAnim = new Map();
        for (const e of events.filter((x) => x.name === 'Animation')) {
          const k = e.id2?.local ?? e.id2?.global ?? e.id, d = e.args?.data || {};
          const o = byAnim.get(k) || { node: '', fails: new Set() };
          if (d.nodeName) o.node = d.nodeName;
          if (d.compositeFailed) o.fails.add(d.compositeFailed);
          byAnim.set(k, o);
        }
        const failed = [...byAnim.values()].filter((o) => o.fails.size);
        const tally = new Map();
        for (const o of failed) { const label = `${o.node.replace(/\s+/g, ' ').slice(0, 70) || '?'}: ${[...o.fails].map(why).join(' / ')}`; tally.set(label, (tally.get(label) || 0) + 1); }
        const c = {
          motions: inf.motions, effects: inf.effects, buildMs: inf.buildMs,
          recalcs: m2.RecalcStyleCount - m1.RecalcStyleCount, layouts: m2.LayoutCount - m1.LayoutCount,
          taskMs: Math.round((m2.TaskDuration - m1.TaskDuration) * 1000), longestTaskMs: long, leftRunning: left.length, left: left.slice(0, 6),
          offCompositor: failed.length, offCompositorWhy: [...tally].map(([l, n]) => `${n} x ${l}`),
        };
        const fails = [];
        if (c.offCompositor) fails.push(`${c.offCompositor} animations ran on the main thread`);
        if (c.recalcs > 3) fails.push(`${c.recalcs} style recalcs while it played (allowed 3)`);
        if (c.layouts > 1) fails.push(`${c.layouts} layouts while it played (allowed 1)`);
        if (c.taskMs > 80) fails.push(`${c.taskMs} ms of main-thread work while it played (allowed 80)`);
        if (c.longestTaskMs > 100) fails.push(`a ${c.longestTaskMs} ms task as it started (allowed 100)`);
        if (c.buildMs > 150) fails.push(`building it took ${c.buildMs} ms (allowed 150)`);
        if (c.leftRunning) fails.push(`${c.leftRunning} animations still running after it ended: ${c.left.join(', ')}`);
        c.fails = fails;
        report.c = c;
        report.pass.c = !fails.length;
        console.log(`(c) runs on the compositor: ${report.pass.c ? 'PASS' : 'FAIL'}  ${c.motions} motions; while it played: ${c.recalcs} style recalcs, ${c.layouts} layouts, ${c.taskMs} ms of main-thread work; ${c.offCompositor} animations off the compositor; built in ${c.buildMs} ms`);
        for (const f of fails) console.log(`    - ${f}`);
        for (const l of c.offCompositorWhy.slice(0, 8)) console.log(`      ${l}`);
      }
      if (want.includes('d')) {
        // the region shot: the card's picture and a margin round it (where effects may spill)
        const r = await pg.ev(`(() => { const c = document.querySelector('.bk-stage > .card').getBoundingClientRect(), a = document.querySelector('.bk-stage .c-art').getBoundingClientRect(), s = document.querySelector('.bk-stage').getBoundingClientRect();
          const x = Math.max(s.left, c.left - 24), y = Math.max(s.top, c.top - 34); return { x, y, width: Math.min(s.right, c.right + 24) - x, height: Math.min(s.bottom, a.bottom + 50) - y }; })()`);
        const shoot = async (ms, file, k) => {
          await pg.ev(`(() => { for (const a of document.getAnimations()) a.pause(); bk.hold(${ms}); return true; })()`);
          await pg.ev('new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true))))');
          await sleep(40);
          writeFileSync(file, await pg.shot(r, k));
        };
        const stills = Array.isArray(inf.STILLS) && inf.STILLS.length ? inf.STILLS : Array.from({ length: 8 }, (_, i) => Math.round(((i + 0.5) * END) / 8));
        const files = [];
        for (const [i, ms] of stills.entries()) { const f = join(tmp, `s${i}.png`); await shoot(ms, f, 0.8); files.push(f); }
        const strip = join(OUT, `${id}-strip.png`);
        py('strip', strip, '4', `${id}: ${stills.length} stills across its ${END} ms move`, stills.map((ms) => `${ms} ms`).join('|'), ...files);
        report.d = { stills, file: `bakeoff/out/${id}-strip.png` };
        if (flags.has('--video')) {
          const vf = [], step = 50;
          for (let i = 0, ms = -300; ms <= END + 300; ms += step, i++) { const f = join(tmp, `v${String(i).padStart(3, '0')}.png`); await shoot(Math.max(0, Math.min(END, ms)), f, 0.6); vf.push(f); }
          py('anim', join(OUT, `${id}-move.webp`), String(step), ...vf);
          report.d.video = `bakeoff/out/${id}-move.webp`;
        }
        await pg.ev('(bk.stop(), true)');
        report.pass.d = stills.length >= 6 && stills.length <= 10;
        console.log(`(d) frame strip: ${report.pass.d ? 'PASS' : 'FAIL'}  bakeoff/out/${id}-strip.png (${stills.length} stills: ${stills.join(', ')} ms)${report.d.video ? `; the move: ${report.d.video}` : ''}`);
      }
      if (pg.problems.length) { report.notes.push(...pg.problems.slice(0, 6)); console.log(`    page errors: ${pg.problems.slice(0, 4).join(' | ')}`); }
    });
  }
} catch (e) {
  report.error = String(e.message || e);
  console.log(`error: ${report.error}`);
} finally {
  try { rmSync(tmp, { recursive: true, force: true }); } catch { /* fine */ }
}
if (want.length) {
  const all = want.every((c) => report.pass[c]) && !report.error;
  writeFileSync(join(OUT, `${id}-report.json`), JSON.stringify(report, null, 1));
  log({ run: 'check', checks: want.join(''), pass: report.pass, all, error: report.error || null, c: report.c ? { recalcs: report.c.recalcs, layouts: report.c.layouts, taskMs: report.c.taskMs, off: report.c.offCompositor } : undefined });
  console.log(all ? `ALL PASS (${want.join(', ')})` : `NOT YET: ${want.filter((c) => !report.pass[c]).join(', ') || 'error'}`);
  process.exitCode = all ? 0 : 1;
}
