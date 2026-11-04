"""Turn the baked art in art/raw/ into WebP in art/ and rewrite js/art-manifest.js.

Called by tools/bake-art.mjs. The pictures keep the art's own 10:7 shape;
cards crop them like `object-fit: cover`.
"""
from pathlib import Path
import hashlib
import json

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "art" / "raw"
OUT = ROOT / "art"
MANIFEST = ROOT / "js" / "art-manifest.js"
WIDTH, HEIGHT = 480, 336  # enough for a hand card at 3x and a gallery card at 2x


def main() -> None:
    entries = {}
    for src in sorted(RAW.glob("*.png")):
        card_id = src.stem
        dst = OUT / f"{card_id}.webp"
        if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime:
            Image.open(src).convert("RGB").resize((WIDTH, HEIGHT), Image.LANCZOS).save(dst, "WEBP", quality=82, method=6)
        version = hashlib.sha1(dst.read_bytes()).hexdigest()[:8]
        entries[card_id] = f"art/{card_id}.webp?v={version}"
    body = ",\n".join(f"  {json.dumps(k)}: {json.dumps(v)}" for k, v in entries.items())
    MANIFEST.write_text(
        "// Written by tools/bake-art.mjs + tools/bake_post.py: card id -> baked picture (with a cache-busting version).\n"
        "// Small views show these; the big zoom view draws the live SVG from js/art/.\n"
        f"export const ART = {{\n{body}{',' if body else ''}\n}};\n",
        encoding="utf-8",
    )
    total = sum((OUT / f"{k}.webp").stat().st_size for k in entries)
    print(f"art-manifest.js: {len(entries)} pictures, {total / 1024:.0f} KB")


if __name__ == "__main__":
    main()
