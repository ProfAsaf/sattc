// Generate card paintings with the OpenAI Images API, then shrink them for phones.
//
//   node tools/gen-art.mjs --test                 one image, to check access and the style
//   node tools/gen-art.mjs                        every card without art yet
//   node tools/gen-art.mjs --only cinderling,grave-rat --force
//
// The key is read from OPENAI_API_KEY or ~/.secrets/openai_key.txt and is never
// printed. Keep it out of this folder: the games folder is published.
// Originals land in art/raw/ (not published); phone-sized WebP in art/.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ART_STYLE, CARDS, FACTION_ART, FACTIONS, TOKENS } from '../js/cards.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAW = join(ROOT, 'art', 'raw');

const args = process.argv.slice(2);
const flag = (name) => args.includes('--' + name);
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};

const MODEL = opt('model', 'gpt-image-2');
const QUALITY = opt('quality', 'medium');
const SIZE = opt('size', '1536x1024');
const CONCURRENCY = Number(opt('concurrency', '3'));

async function apiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY.trim();
  const file = opt('key-file', join(homedir(), '.secrets', 'openai_key.txt'));
  try {
    return (await readFile(file, 'utf8')).trim();
  } catch {
    console.error(`No API key. Put it in ${file} (one line) or set OPENAI_API_KEY.`);
    process.exit(2);
  }
}

export function promptFor(card) {
  const fs = card.factions.length ? card.factions : ['neutral'];
  const bare = (f) => FACTION_ART[f].replace(/^Accent colour: /, '').replace(/\.$/, '');
  const accent = fs.length > 1
    ? `Two accent colours blended: ${bare(fs[0])}, and ${bare(fs[1])}.`
    : FACTION_ART[fs[0]];
  return `${ART_STYLE} ${accent} Landscape composition with the subject centred, leaving calm space at the edges. Subject: ${card.art}`;
}

const exists = (p) => access(p).then(() => true, () => false);

async function generate(card, key) {
  const body = { model: MODEL, prompt: promptFor(card), size: SIZE, quality: QUALITY, n: 1, output_format: 'png' };
  for (let attempt = 1; attempt <= 4; attempt++) {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error('No image in response');
      await writeFile(join(RAW, `${card.id}.png`), Buffer.from(b64, 'base64'));
      return json.usage || null;
    }
    const text = await res.text();
    if (res.status === 403) {
      console.error('\n403 from OpenAI. Image models need a verified organization:');
      console.error('platform.openai.com -> Settings -> Organization -> General -> Verify Organization.');
      console.error(text.slice(0, 300));
      process.exit(3);
    }
    if (res.status === 401) { console.error('401: the API key was rejected.'); process.exit(3); }
    if (res.status === 429 || res.status >= 500) {
      const wait = 4000 * attempt;
      console.warn(`  ${card.id}: HTTP ${res.status}, retrying in ${wait / 1000}s`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`);
  }
  throw new Error('Gave up after retries');
}

async function main() {
  await mkdir(RAW, { recursive: true });
  const all = [...CARDS, TOKENS.spirit, TOKENS.spark];
  const only = opt('only', null)?.split(',').map((s) => s.trim());
  let todo = only ? all.filter((c) => only.includes(c.id)) : all;
  if (flag('test')) todo = [all.find((c) => c.id === (only?.[0] || 'cinderling'))];

  if (flag('dry-run')) {
    for (const c of todo) console.log(`\n[${c.id}]\n${promptFor(c)}`);
    return;
  }

  const key = await apiKey();
  const pending = [];
  for (const c of todo) {
    if (!flag('force') && !flag('test') && (await exists(join(RAW, `${c.id}.png`)))) continue;
    pending.push(c);
  }
  console.log(`${pending.length} painting(s) to make with ${MODEL} (${QUALITY}, ${SIZE}).`);

  let done = 0, failed = 0;
  const queue = [...pending];
  const worker = async () => {
    while (queue.length) {
      const c = queue.shift();
      const t0 = Date.now();
      try {
        const usage = await generate(c, key);
        done++;
        const tok = usage?.output_tokens ? `, ${usage.output_tokens} output tokens` : '';
        console.log(`  ✓ ${c.id} (${((Date.now() - t0) / 1000).toFixed(0)}s${tok})  [${done + failed}/${pending.length}]`);
      } catch (e) {
        failed++;
        console.warn(`  ✗ ${c.id}: ${e.message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, CONCURRENCY) }, worker));
  console.log(`Made ${done}, failed ${failed}.`);

  // Shrink to phone-sized WebP and rewrite js/art-manifest.js.
  const py = spawnSync('python', [join(ROOT, 'tools', 'art_post.py')], { stdio: 'inherit' });
  if (py.status !== 0) process.exit(py.status || 1);
}

main();
