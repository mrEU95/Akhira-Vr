"""EXR/HDR-Panorama -> JPG (Tonemapping wie ein Foto). Aufruf: exr2jpg.py in.exr out.jpg [Belichtung]"""
import sys, numpy as np, OpenEXR
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
with OpenEXR.File(src) as f:
    ch = f.channels()
    if 'RGB' in ch:
        rgb = np.asarray(ch['RGB'].pixels, dtype=np.float32)
    else:
        rgb = np.stack([np.asarray(ch[c].pixels, dtype=np.float32) for c in ('R', 'G', 'B')], -1)
rgb = np.nan_to_num(np.clip(rgb, 0, None))
lum = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
# Belichtung: mittleres Grau auf ~0.18 (geometrisches Mittel), optional Faktor
key = float(sys.argv[3]) if len(sys.argv) > 3 else 0.22
gm = np.exp(np.mean(np.log(lum + 1e-4)))
x = rgb * (key / gm)
# Filmische Kurve (ACES-Näherung) + sRGB
a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
x = np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)
x = np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(x, 1 / 2.4) - 0.055)
img = Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))
img.save(dst, quality=90, optimize=True)
print(img.size, 'gespeichert:', dst)
