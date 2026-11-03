"""Shrink paintings in art/raw/ to phone-sized WebP in art/ and rewrite js/art-manifest.js.

Run after adding or replacing anything in art/raw/ (gen-art.mjs calls it).
A painting can also be dropped into art/raw/<card-id>.png by hand, e.g. one
exported from ChatGPT, and this picks it up.
"""
from pathlib import Path
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw"
OUT = ROOT / "art"
MANIFEST = ROOT / "js" / "art-manifest.js"

WIDTH, HEIGHT = 840, 560  # 3:2, about 2x the largest on-screen size on a phone


def fit(img: Image.Image) -> Image.Image:
    """Cover-crop to 3:2, then resize."""
    img = img.convert("RGB")
    w, h = img.size
    target = WIDTH / HEIGHT
    if w / h > target:
        nw = int(h * target)
        img = img.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w / target)
        top = max(0, int((h - nh) * 0.4))  # keep a little more of the top
        img = img.crop((0, top, w, top + nh))
    return img.resize((WIDTH, HEIGHT), Image.LANCZOS)


def main() -> None:
    entries = {}
    for src in sorted(p for p in RAW.glob("*") if p.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp"}):
        card_id = src.stem
        dst = OUT / f"{card_id}.webp"
        if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
            fit(Image.open(src)).save(dst, "WEBP", quality=80, method=6)
        version = hashlib.sha1(dst.read_bytes()).hexdigest()[:8]
        entries[card_id] = f"art/{card_id}.webp?v={version}"

    body = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in entries.items())
    MANIFEST.write_text(
        "// Written by tools/gen-art.mjs + tools/art_post.py: card id -> painting URL (with a cache-busting version).\n"
        "// Cards missing here show a faction placeholder instead.\n"
        f"export const ART = {{\n{body}{',' if body else ''}\n}};\n",
        encoding="utf-8",
    )
    print(f"art-manifest.js: {len(entries)} painting(s)")


if __name__ == "__main__":
    main()
