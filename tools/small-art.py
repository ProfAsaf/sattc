"""Small copies of the card pictures, for cards shown small.

A picture takes its full size in a phone's memory however small it's shown:
art/<id>.webp is 480x336 (0.65 MB once decoded), but on the table a card's
picture is 48-72 px wide, in the hand about 100 (on a 3x iPhone, 300 dots),
so a 320 px copy (0.29 MB) looks the same there. The game uses them on phones
for table cards up to 106 px wide (js/fx.js tcardHTML, js/cards-alive.js).

  art/<id>.webp       -> art/s/<id>.webp        (320 wide)
  art/live/<id>.webp  -> art/live/s/<id>.webp   (320 wide; the moving parts,
                                                 art/live/<id>-p-*.webp, stay)

Run after baking art (tools/bake-art.mjs, tools/bake-live.mjs):

  python tools/small-art.py
"""
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
WIDE = 320


def shrink(src, dst):
    im = Image.open(src)
    if im.width <= WIDE:
        return False
    h = round(im.height * WIDE / im.width)
    out = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB').resize((WIDE, h), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    out.save(dst, 'WEBP', quality=86, method=6)
    return True


made = 0
for folder in ('art', os.path.join('art', 'live')):
    base = os.path.join(ROOT, folder)
    for name in sorted(os.listdir(base)):
        if not name.endswith('.webp') or '-p-' in name:
            continue
        src = os.path.join(base, name)
        if not os.path.isfile(src):
            continue
        dst = os.path.join(base, 's', name)
        if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
            continue
        made += shrink(src, dst)
print(f'{made} small pictures made ({WIDE} px wide)')
