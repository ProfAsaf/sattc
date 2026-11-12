"""Stage finished puppets as one private review page (a claude.ai Artifact):
an index of the cards, each playing live from the game's own code, on a loop,
in a copy of the harness that takes the card from the link's #hash.

    python bakeoff/stage-site.py <worktree> <out dir> <title> <card id> [<card id> ...]

Writes <out dir>/index.html and the files it needs, and prints the list of
published paths for the Artifact tool's `files` (with `root` = <out dir>).
An Artifact takes at most 255 files per publish (511 per version), so stage
about 30 cards a page.
"""
import html
import json
import re
import shutil
import sys
from pathlib import Path

ROOT, OUT, TITLE, IDS = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4:]
IMP = re.compile(r"""(?:import|export)\s[^'"]*?from\s*['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)""")
if OUT.exists():
    shutil.rmtree(OUT)
files = []


def put(rel, text=None):
    dst = OUT / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    if text is None:
        shutil.copyfile(ROOT / rel, dst)
    else:
        dst.write_text(text, encoding='utf8')
    files.append(rel.replace('\\', '/'))


def norm(rel):
    parts = []
    for p in rel.split('/'):
        if p == '..':
            parts.pop()
        elif p not in ('.', ''):
            parts.append(p)
    return '/'.join(parts)


# the module graph, from the harness and the cards' moves
todo, seen = ['bakeoff/harness.js'] + [f'bakeoff/moves/{c}.js' for c in IDS], set()
while todo:
    rel = norm(todo.pop())
    if rel in seen:
        continue
    seen.add(rel)
    for m in IMP.finditer((ROOT / rel).read_text(encoding='utf8')):
        spec = next(g for g in m.groups() if g)
        if '${' not in spec and spec.startswith('.'):
            todo.append(str(Path(rel).parent.as_posix() + '/' + spec))
for rel in sorted(seen - {'bakeoff/harness.js'}):
    put(rel)
# the harness, for the hosted page: the card from the #hash, on a loop, and a way back
h = (ROOT / 'bakeoff/harness.js').read_text(encoding='utf8')
h = h.replace("const id = q.get('id') || '';", "const id = decodeURIComponent(location.hash.slice(1)) || q.get('id') || '';")
h = h.replace("await fetch(`bakeoff/moves/${id}.js`, { method: 'HEAD' })", "await fetch(`bakeoff/moves/${id}.js`)")
h = h.replace("if (q.has('play') || q.has('loop')) { await sleep(500); do { await play(); await sleep(1000); } while (q.has('loop')); }",
              "await sleep(700); for (;;) { await play(); await sleep(1300); }")
assert 'location.hash.slice(1)' in h and 'for (;;)' in h
put('bakeoff/harness.js', h + "\naddEventListener('hashchange', () => location.reload());\n")
page = (ROOT / 'bakeoff/harness.html').read_text(encoding='utf8').replace('<div class="bk-stage">', """<nav class="bk-nav"><a id="bk-back" href="../">‹ All cards</a></nav>
<script>document.getElementById('bk-back').onclick = (e) => { if (history.length > 1) { e.preventDefault(); history.back(); } };</script>
<div class="bk-stage">""", 1).replace('</head>', """<style>
.bk-nav { display: flex; justify-content: center; padding: 10px 12px 0; font: 600 14px/1 system-ui, sans-serif; }
.bk-nav a { color: #d9cdb4; text-decoration: none; padding: 8px 12px; border-radius: 16px; border: 1px solid #4a3d2c; }
.bk-stage { height: 520px; }
</style>
</head>""", 1)
put('bakeoff/harness.html', page)
for rel in ['bakeoff/harness.css', 'css/card.css', 'css/app.css']:
    put(rel)
# the cards' baked pictures and parts
cards = {c['id']: c for c in json.loads((ROOT / 'bakeoff/cards.json').read_text(encoding='utf8'))}
from_js = (ROOT / 'js/art/puppets.js').read_text(encoding='utf8')
for c in IDS:
    put(f'art/live/{c}.webp')
    put(f'art/live/{c}.json')
    for s in json.loads((ROOT / f'art/live/{c}.json').read_text(encoding='utf8'))['sprites']:
        if s.get('img'):
            put(s['img'].split('?')[0])
# the index
rows = []
for c in IDS:
    d = cards.get(c, {'name': c, 'role': '', 'element': '', 'type': ''})
    rows.append(f"""<a class="row" href="bakeoff/harness.html#{c}"><span class="nm">{html.escape(d['name'])}</span><span class="tg">{html.escape(d.get('role') or '')} · {html.escape(d.get('element') or '')}</span><span class="go">Play ›</span></a>""")
idx = f"""<title>{html.escape(TITLE)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<style>
:root {{ --ink: #120e0b; --panel: #1d1712; --line: #3a3026; --cream: #f1e8d4; --muted: #a8987a; --gold: #e2bf74; color-scheme: dark; }}
body {{ background: var(--ink); color: var(--cream); font: 15px/1.45 system-ui, -apple-system, 'Segoe UI', sans-serif;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 18px 40px; }}
main {{ max-width: 640px; margin: 0 auto; display: grid; gap: 14px; }}
h1 {{ font: 700 28px/1.2 Georgia, serif; color: var(--gold); margin: 0; text-wrap: balance; }}
p {{ margin: 0; color: var(--muted); }}
.list {{ display: grid; gap: 8px; }}
.row {{ display: grid; grid-template-columns: 1fr auto; gap: 2px 12px; padding: 12px 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; color: inherit; text-decoration: none; }}
.row:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
.nm {{ font-weight: 650; }} .tg {{ grid-column: 1; color: var(--muted); font-size: 13px; }} .go {{ grid-column: 2; grid-row: 1 / span 2; align-self: center; color: var(--gold); font-weight: 600; font-size: 13px; }}
</style>
<main>
<h1>{html.escape(TITLE)}</h1>
<p>Tap a card to watch its move play live from the game's own code, on a loop. Role and element are what it would bring to a fight with its neighbours.</p>
<div class="list">{''.join(rows)}</div>
</main>
"""
(OUT / 'index.html').write_text(idx, encoding='utf8')
print(json.dumps([{'path': f} for f in files]))
