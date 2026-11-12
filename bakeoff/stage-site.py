"""Stage finished puppets as one private review page (a claude.ai Artifact):
an index of the cards, each playing live from the game's own code, on a loop,
in a copy of the harness that takes the card from the link's #hash: alone
(#<id>), or aimed at a neighbour as check (e) aims it (#<id>--aimed: an
attacker's or support's move sent to a point beside its card, a defender
blocking two blows on its guard, with the points ringed).

    python bakeoff/stage-site.py <worktree> <out dir> <title> <intro> <card id> [<card id> ...]

Writes <out dir>/index.html and the files it needs, and prints the list of
published paths for the Artifact tool's `files` (with `root` = <out dir>).
An Artifact takes at most 255 files per publish (511 per version), so stage
about 30 cards a page.
"""
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT, OUT, TITLE, INTRO, IDS = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5:]
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


# each card's interaction contract, as its puppet entry has it (its maker may have changed cards.json's suggestion)
SPEC = json.loads(subprocess.run(
    ['node', '--input-type=module', '-e',
     'const { PUPPETS } = await import(process.argv[1]); console.log(JSON.stringify(Object.fromEntries(Object.entries(PUPPETS).map(([k, v]) => '
     '[k, { role: v.role, element: v.element, facing: v.facing, guard: v.guard, hit: v.hit }]))));',
     (ROOT / 'js/art/puppets.js').resolve().as_uri()], capture_output=True, text=True, check=True).stdout)


def aimed(s):
    """the harness query for a card aimed at a neighbour, as check (e) aims it (None for an aura)"""
    if s.get('role') in ('attacker', 'support'):
        return f"aim={'-28,45' if s.get('facing') == 'left' else '328,45'}&mark"
    if s.get('role') == 'defender':
        g = s.get('guard') or ([s['hit']] if s.get('hit') else None)
        if g:
            return 'blows=' + ';'.join(f'{t},{x},{y}' for t, (x, y) in ((900, g[0]), (1350, g[-1]))) + '&mark'
    return None


AIMED = {c: q for c in IDS if (q := aimed(SPEC.get(c, {})))}

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
# the harness, for the hosted page: the card (alone or aimed) from the #hash, on a loop, and a way back
h = (ROOT / 'bakeoff/harness.js').read_text(encoding='utf8')
h = h.replace("const q = new URLSearchParams(location.search);",
              f"const AIMED = {json.dumps(AIMED)}; // (#<id>--aimed: the card aimed at a neighbour, as check (e) aims it)\n"
              "const hash = decodeURIComponent(location.hash.slice(1)), hid = hash.replace(/--aimed$/, '');\n"
              "const q = new URLSearchParams(hash.endsWith('--aimed') && AIMED[hid] ? AIMED[hid] : location.search);")
h = h.replace("const id = q.get('id') || '';", "const id = hid || q.get('id') || '';")
h = h.replace("await fetch(`bakeoff/moves/${id}.js`, { method: 'HEAD' })", "await fetch(`bakeoff/moves/${id}.js`)")
h = h.replace("if (q.has('play') || q.has('loop')) { await sleep(500); do { await play(); await sleep(1000); } while (q.has('loop')); }",
              "await sleep(700); for (;;) { await play(); await sleep(1300); }")
assert 'const AIMED' in h and 'hid ||' in h and 'for (;;)' in h
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
for c in IDS:
    put(f'art/live/{c}.webp')
    put(f'art/live/{c}.json')
    for s in json.loads((ROOT / f'art/live/{c}.json').read_text(encoding='utf8'))['sprites']:
        if s.get('img'):
            put(s['img'].split('?')[0])
# the index
rows = []
for c in IDS:
    d, s = cards.get(c, {'name': c}), SPEC.get(c, {})
    tags = ' &middot; '.join(html.escape(x) for x in (s.get('role'), s.get('element')) if x)
    links = f'<a class="go" href="bakeoff/harness.html#{c}">Play</a>'
    if c in AIMED:
        links += f'<a class="go" href="bakeoff/harness.html#{c}--aimed">Aimed</a>'
    rows.append(f'<div class="row"><span class="nm">{html.escape(d["name"])}</span><span class="tg">{tags}</span><span class="links">{links}</span></div>')
idx = f"""<title>{html.escape(TITLE)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@600&display=swap">
<style>
/* one column of card rows, the game's own dark table: gold on brown-black */
:root {{ --ink: #120e0b; --panel: #1d1712; --line: #3a3026; --cream: #efe6d2; --muted: #a8987a; --gold: #d6b46a;
  --display: 'EB Garamond', Georgia, serif; --body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color-scheme: dark; }}
body {{ background: var(--ink); color: var(--cream); font: 15px/1.45 var(--body);
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 18px 40px; }}
main {{ max-width: 640px; margin: 0 auto; display: grid; gap: 14px; }}
h1 {{ font: 600 30px/1.15 var(--display); color: var(--gold); margin: 0; text-wrap: balance; }}
p {{ margin: 0; color: var(--muted); max-width: 62ch; }}
.list {{ display: grid; gap: 8px; }}
.row {{ display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 12px; align-items: center; padding: 8px 10px 8px 14px; background: var(--panel); border: 1px solid var(--line); border-radius: 10px; }}
.nm {{ font-weight: 650; min-width: 0; }}
.tg {{ grid-column: 1; color: var(--muted); font-size: 13px; }}
.links {{ grid-column: 2; grid-row: 1 / span 2; display: flex; gap: 6px; }}
.go {{ display: inline-flex; align-items: center; min-height: 40px; padding: 0 13px; border-radius: 20px; border: 1px solid var(--line); color: var(--gold); font-weight: 600; font-size: 13px; text-decoration: none; }}
.go:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
</style>
<main>
<h1>{html.escape(TITLE)}</h1>
<p>{html.escape(INTRO)}</p>
<p><b>Play</b> runs a card's move on a loop. <b>Aimed</b> runs it at a neighbour, the way cards will act on each other: an attack or a gift goes to the ringed point where the next card would sit, and a defender takes two blows at the rings. Fields and relics aren't aimed. The words under each name are its role and element.</p>
<div class="list">{''.join(rows)}</div>
</main>
"""
(OUT / 'index.html').write_text(idx, encoding='utf8')
print(json.dumps([{'path': f} for f in files]))
