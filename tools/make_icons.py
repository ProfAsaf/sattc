"""Home-screen icons: the card-back emblem (gold ring + four-point star) on dark brown."""
from pathlib import Path
import math

from PIL import Image, ImageDraw, ImageFilter

OUT = Path(__file__).resolve().parent.parent / "icons"
S = 1024  # draw large, scale down

GOLD = (214, 182, 108)
GOLD_DIM = (150, 120, 64)


def star(cx, cy, r_out, r_in, points=4, rot=-math.pi / 2):
    pts = []
    for i in range(points * 2):
        r = r_out if i % 2 == 0 else r_in
        a = rot + i * math.pi / points
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def draw() -> Image.Image:
    img = Image.new("RGB", (S, S), (24, 18, 13))
    glow = Image.new("RGB", (S, S), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((S * .18, S * .14, S * .82, S * .78), fill=(70, 52, 30))
    img = Image.blend(img, glow.filter(ImageFilter.GaussianBlur(S * .12)), .55)

    d = ImageDraw.Draw(img)
    c = S / 2
    for r, w, col in ((S * .40, 16, GOLD), (S * .365, 6, GOLD_DIM), (S * .19, 12, GOLD)):
        d.ellipse((c - r, c - r, c + r, c + r), outline=col, width=w)
    d.polygon(star(c, c, S * .17, S * .045), fill=GOLD)
    # five small dots around the ring for the five factions
    for i in range(5):
        a = -math.pi / 2 + i * 2 * math.pi / 5
        x, y = c + math.cos(a) * S * .285, c + math.sin(a) * S * .285
        d.polygon(star(x, y, S * .035, S * .012), fill=GOLD)
    return img


def main() -> None:
    OUT.mkdir(exist_ok=True)
    big = draw()
    for size in (512, 192, 180):
        big.resize((size, size), Image.LANCZOS).save(OUT / f"icon-{size}.png", optimize=True)
    print("icons:", ", ".join(p.name for p in sorted(OUT.glob("icon-*.png"))))


if __name__ == "__main__":
    main()
