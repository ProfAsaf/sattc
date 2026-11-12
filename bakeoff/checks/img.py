"""Picture work for the bake-off checks (bakeoff/checks/check.mjs).

    python img.py diff A.png B.png [OUT.png]     -> JSON: how A and B differ (OUT: the differences shown)
    python img.py strip OUT.png COLS TITLE LABELS FRAME.png...   -> the frames in a grid, labelled
    python img.py anim OUT.webp MS FRAME.png...  -> an animated WebP, MS per frame
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont


def font(size):
    for name in ('segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def erode(m):
    # a 3 x 3 erosion: what's left is the inside of solid areas (thin lines go)
    e = np.zeros_like(m)
    e[1:-1, 1:-1] = m[1:-1, 1:-1] & m[:-2, 1:-1] & m[2:, 1:-1] & m[1:-1, :-2] & m[1:-1, 2:] & m[:-2, :-2] & m[:-2, 2:] & m[2:, :-2] & m[2:, 2:]
    return e


def diff(a_path, b_path, out=None):
    A = np.asarray(Image.open(a_path).convert('RGBA'), dtype=np.int16)
    B = np.asarray(Image.open(b_path).convert('RGBA'), dtype=np.int16)
    if A.shape != B.shape:
        return {'error': f'sizes differ: {A.shape[1]}x{A.shape[0]} and {B.shape[1]}x{B.shape[0]}'}
    d = np.abs(A - B).max(axis=2)
    n = d.size
    ys, xs = np.nonzero(d > 0)
    res = {
        'pixels': int(n),
        'changed': int((d > 0).sum()),
        'over8': int((d > 8).sum()),
        'over24': int((d > 24).sum()),
        'over64': int((d > 64).sum()),
        'mean': round(float(np.abs(A[..., :3] - B[..., :3]).mean()), 3),
        'max': int(d.max()),
        'box': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None,
    }
    # solid areas that differ a lot (a hole, a missing or misplaced piece), not edges or grain
    solid = erode(erode(d > 48))
    ys2, xs2 = np.nonzero(solid)
    res['solid'] = int(solid.sum())
    res['solidBox'] = [int(xs2.min()), int(ys2.min()), int(xs2.max()), int(ys2.max())] if len(xs2) else None
    if out:
        # the second picture, darkened, with what differs by more than 24 in red
        base = (B[..., :3] * 0.35).astype(np.uint8)
        base[d > 24] = [255, 40, 40]
        base[(d > 8) & (d <= 24)] = [255, 190, 60]
        Image.fromarray(base, 'RGB').save(out)
    return res


def strip(out, cols, title, labels, frames):
    ims = [Image.open(f).convert('RGB') for f in frames]
    w, h = ims[0].size
    cols = int(cols)
    rows = (len(ims) + cols - 1) // cols
    pad, top, lab = 6, 34, 22
    W = cols * w + (cols + 1) * pad
    H = top + rows * (h + lab + pad) + pad
    sheet = Image.new('RGB', (W, H), (14, 11, 9))
    g = ImageDraw.Draw(sheet)
    g.text((pad + 2, 7), title, fill=(241, 226, 192), font=font(18))
    labels = labels.split('|')
    for i, im in enumerate(ims):
        r, c = divmod(i, cols)
        x, y = pad + c * (w + pad), top + r * (h + lab + pad)
        sheet.paste(im, (x, y + lab))
        g.text((x + 2, y + 2), labels[i] if i < len(labels) else '', fill=(200, 186, 150), font=font(15))
    sheet.save(out, optimize=True)
    return {'size': [W, H]}


def anim(out, ms, frames):
    ims = [Image.open(f).convert('RGB') for f in frames]
    ims[0].save(out, save_all=True, append_images=ims[1:], duration=int(ms), loop=0, quality=72, method=4)
    return {'frames': len(ims)}


if __name__ == '__main__':
    cmd, *args = sys.argv[1:]
    if cmd == 'diff':
        print(json.dumps(diff(*args)))
    elif cmd == 'strip':
        print(json.dumps(strip(args[0], args[1], args[2], args[3], args[4:])))
    elif cmd == 'anim':
        print(json.dumps(anim(args[0], args[1], args[2:])))
