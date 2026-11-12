// Stamp every script and stylesheet in index.html with a content hash, so a
// phone always loads one consistent version after an update (GitHub Pages
// lets browsers cache files for 10 minutes, and a mix of old and new modules
// breaks the app). Run before publishing:
//
//   node tools/stamp.mjs
//
// Writes an import map that sends each module to `file.js?v=<hash>`, and
// adds the same `?v=` to the CSS links and the entry script. Then a
// modulepreload link for each module app.js loads at start-up (its static
// imports, and theirs), so a phone asks for them all at once instead of one
// layer at a time: with nothing cached, on a phone-like connection, the last
// script used to be asked for 4.6 s in.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative } from 'node:path';
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
// the modules app.js loads at start-up: its static imports, and theirs (not import())
const IMPORT = /^\s*(?:import|export)\s[^'"`;]*?from\s*['"](\.{1,2}\/[^'"]+)['"]|^\s*import\s*['"](\.{1,2}\/[^'"]+)['"]/gm;
const loads = new Set(), todo = ['./js/app.js'];
while (todo.length) {
  const m = todo.pop();
  if (loads.has(m) || !imports[m]) continue;
  loads.add(m);
  for (const x of readFileSync(join(ROOT, m), 'utf8').matchAll(IMPORT)) todo.push('./' + posix.normalize(posix.join(posix.dirname(m), x[1] || x[2])));
}
loads.delete('./js/app.js'); // (the entry script itself)
const preload = [...loads].sort().map((m) => `<link rel="modulepreload" href="${imports[m]}">`).join('\n');
const map = `<script type="importmap">${JSON.stringify({ imports }, null, 1)}</script>\n${preload}`;

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
html = html.replace(/<!-- importmap -->[\s\S]*?<!-- \/importmap -->\n?/, '');
html = html.replace(/(<link rel="stylesheet" href=")(css\/[\w-]+\.css)(\?v=\w+)?(">)/g, (m, a, f, v, z) => `${a}${f}?v=${hash(join(ROOT, f))}${z}`);
html = html.replace(/(<script type="module" src=")(js\/app\.js)(\?v=\w+)?(">)/, (m, a, f, v, z) => `${a}${f}?v=${hash(join(ROOT, f))}${z}`);
html = html.replace('<link rel="stylesheet" href="css/card.css', `<!-- importmap -->\n${map}\n<!-- /importmap -->\n<link rel="stylesheet" href="css/card.css`);
writeFileSync(join(ROOT, 'index.html'), html);
console.log(`stamped ${modules.length} modules and the stylesheets; ${loads.size} preloaded`);
