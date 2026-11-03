// Stamp every script and stylesheet in index.html with a content hash, so a
// phone always loads one consistent version after an update (GitHub Pages
// lets browsers cache files for 10 minutes, and a mix of old and new modules
// breaks the app). Run before publishing:
//
//   node tools/stamp.mjs
//
// Writes an import map that sends each module to `file.js?v=<hash>`, and
// adds the same `?v=` to the CSS links and the entry script.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const hash = (file) => createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 8);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js')) out.push(p);
  }
  return out;
}

const modules = walk(join(ROOT, 'js')).map((p) => './' + relative(ROOT, p).replace(/\\/g, '/')).sort();
const imports = Object.fromEntries(modules.map((m) => [m, `${m}?v=${hash(join(ROOT, m))}`]));
const map = `<script type="importmap">${JSON.stringify({ imports }, null, 1)}</script>`;

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<!-- importmap -->[\s\S]*?<!-- \/importmap -->\n?/, '');
html = html.replace(/(<link rel="stylesheet" href=")(css\/[\w-]+\.css)(\?v=\w+)?(">)/g, (m, a, f, v, z) => `${a}${f}?v=${hash(join(ROOT, f))}${z}`);
html = html.replace(/(<script type="module" src=")(js\/app\.js)(\?v=\w+)?(">)/, (m, a, f, v, z) => `${a}${f}?v=${hash(join(ROOT, f))}${z}`);
html = html.replace('<link rel="stylesheet" href="css/card.css', `<!-- importmap -->\n${map}\n<!-- /importmap -->\n<link rel="stylesheet" href="css/card.css`);
writeFileSync(join(ROOT, 'index.html'), html);
console.log(`stamped ${modules.length} modules and the stylesheets`);
