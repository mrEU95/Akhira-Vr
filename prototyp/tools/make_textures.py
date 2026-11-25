"""Erzeugt kachelbare PBR-Texturen (Farbe, Normal, Rauheit) für den Prototyp.

Keine externen Quellen: alles aus Rauschen berechnet, daher frei von Lizenzfragen.
Aufruf:  python3 tools/make_textures.py   (schreibt nach textures/)
"""
import numpy as np
from PIL import Image
import os

N = 1024
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'textures')


def fbm(beta=2.0, lo=2.0, hi=None):
    """Periodisches (kachelbares) Rauschen mit Leistungsspektrum 1/f^beta."""
    w = rng.standard_normal((N, N))
    F = np.fft.fft2(w)
    fy = np.fft.fftfreq(N)[:, None] * N
    fx = np.fft.fftfreq(N)[None, :] * N
    f = np.sqrt(fx ** 2 + fy ** 2)
    f[0, 0] = 1
    amp = 1 / f ** (beta / 2)
    amp[f < lo] = 0
    if hi:
        amp[f > hi] = 0
    r = np.real(np.fft.ifft2(F * amp))
    return (r - r.mean()) / (r.std() + 1e-9)


def blobs(count, rmin, rmax, aspect=1.6):
    """Kleine Steine/Klumpen als Höhenfeld (periodisch umgebrochen)."""
    h = np.zeros((N, N))
    yy, xx = np.mgrid[0:N, 0:N]
    for _ in range(count):
        cx, cy = rng.uniform(0, N, 2)
        r = rng.uniform(rmin, rmax)
        a = rng.uniform(0, np.pi)
        ca, sa = np.cos(a), np.sin(a)
        x0, x1 = int(cx - r * 2), int(cx + r * 2)
        y0, y1 = int(cy - r * 2), int(cy + r * 2)
        ys = np.arange(y0, y1) % N
        xs = np.arange(x0, x1) % N
        dx = (np.arange(x0, x1)[None, :] - cx)
        dy = (np.arange(y0, y1)[:, None] - cy)
        u = (dx * ca + dy * sa) / r
        v = (-dx * sa + dy * ca) / (r / aspect)
        d = 1 - (u ** 2 + v ** 2)
        bump = np.sqrt(np.clip(d, 0, None))
        h[np.ix_(ys, xs)] = np.maximum(h[np.ix_(ys, xs)], bump)
    return h


def lines(count, steps, step_len, width, jitter):
    """Dünne Linien (Wurzeln, Halme, Risse) als Maske."""
    img = Image.new('L', (N, N), 0)
    from PIL import ImageDraw
    d = ImageDraw.Draw(img)
    for _ in range(count):
        x, y = rng.uniform(0, N, 2)
        ang = rng.uniform(0, 2 * np.pi)
        pts = [(x, y)]
        for _ in range(steps):
            ang += rng.normal(0, jitter)
            x += np.cos(ang) * step_len
            y += np.sin(ang) * step_len
            pts.append((x, y))
        for ox in (-N, 0, N):
            for oy in (-N, 0, N):
                d.line([(px + ox, py + oy) for px, py in pts], fill=255, width=width)
    return np.asarray(img, dtype=np.float64) / 255


def normal_map(h, strength):
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5 * strength
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5 * strength
    n = np.stack([-gx, gy, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    return ((n * 0.5 + 0.5) * 255).astype(np.uint8)


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,))
    xs = [s[0] for s in stops]
    for c in range(3):
        out[..., c] = np.interp(t, xs, [s[1][c] for s in stops])
    return out


def save(name, arr, q=88):
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(os.path.join(OUT, name), quality=q)


def soil():
    big = fbm(2.6, 1)
    mid = fbm(2.0, 6)
    fine = fbm(1.2, 40)
    clumps = np.clip(fbm(2.2, 10, 120), 0, None)
    stones = blobs(520, 2.0, 8) * np.clip(0.6 + 0.5 * fbm(1.5, 20), 0, 1)
    grit = blobs(5000, 0.8, 2.2, 1.2)
    roots = lines(26, 60, 7, 2, 0.35)
    h = 0.35 * big + 0.35 * mid + 0.12 * fine + 0.5 * clumps + 1.4 * stones + 0.5 * grit + 0.4 * roots
    t = 0.5 + 0.17 * big + 0.12 * mid + 0.06 * fine
    col = ramp(t, [(0.0, (34, 24, 16)), (0.45, (66, 47, 32)), (0.75, (94, 72, 52)), (1.0, (120, 98, 74))])
    # Feuchte Senken dunkler, Steine heller und kühler
    col *= (0.85 + 0.15 * np.clip(clumps, 0, 1))[..., None]
    stone_col = ramp(0.5 + 0.3 * fine + 0.2 * mid, [(0, (58, 50, 42)), (0.6, (88, 78, 66)), (1, (112, 102, 88))])
    m = np.clip(stones * 1.6, 0, 1)[..., None] * 0.85
    col = col * (1 - m) + stone_col * m
    gm = np.clip(grit * 1.5, 0, 1)[..., None] * 0.5
    col = col * (1 - gm) + np.array([96, 82, 66]) * gm
    col = col * (1 - roots[..., None] * 0.7) + np.array([40, 28, 18]) * roots[..., None] * 0.7
    # Hohlraum-Verdunkelung (AO) aus Höhenfeld
    ao = np.clip(0.75 + 0.25 * (h - h.mean()) / (h.std() + 1e-9), 0.45, 1.1)
    col *= ao[..., None]
    save('soil_color.jpg', col)
    save('soil_normal.jpg', normal_map(h, 2.2), 92)
    rough = 235 - 60 * m[..., 0] - 15 * np.clip(-clumps, 0, 1)
    save('soil_rough.jpg', np.repeat(rough[..., None], 3, -1))


def labin():
    """Ungebrannter Lehmziegel: hell, mit Strohhalmen, feinen Rissen und Fingerspuren."""
    base = fbm(2.4, 1)
    mid = fbm(1.8, 8)
    fine = fbm(1.0, 60)
    straw = lines(420, 4, 9, 2, 0.15)
    cracks = lines(18, 40, 6, 1, 0.6)
    smear = fbm(2.8, 3, 30)
    h = 0.4 * base + 0.3 * mid + 0.15 * fine + 0.35 * straw - 0.9 * cracks + 0.25 * smear
    t = 0.55 + 0.12 * base + 0.1 * mid + 0.05 * fine
    col = ramp(t, [(0.0, (92, 72, 50)), (0.5, (146, 118, 86)), (1.0, (186, 160, 124))])
    col = col * (1 - straw[..., None] * 0.55) + np.array([196, 170, 110]) * straw[..., None] * 0.55
    col = col * (1 - cracks[..., None] * 0.6) + np.array([60, 45, 32]) * cracks[..., None] * 0.6
    save('labin_color.jpg', col)
    save('labin_normal.jpg', normal_map(h, 1.6), 92)
    rough = 225 - 20 * straw
    save('labin_rough.jpg', np.repeat(rough[..., None], 3, -1))


def grass():
    """Friedhofsboden an der Oberfläche: trockenes Gras mit Erde."""
    big = fbm(2.6, 1)
    blades = lines(2600, 3, 5, 2, 0.2)
    dirt = np.clip(fbm(2.2, 4), 0, None)
    h = 0.3 * big + 0.6 * blades - 0.3 * dirt
    t = 0.5 + 0.2 * big
    g = ramp(t, [(0, (70, 72, 44)), (1, (128, 124, 78))])
    g = g * (1 - blades[..., None] * 0.4) + np.array([150, 146, 96]) * blades[..., None] * 0.4
    dm = np.clip(dirt, 0, 1)[..., None] * 0.7
    g = g * (1 - dm) + np.array([92, 72, 52]) * dm
    save('grass_color.jpg', g)
    save('grass_normal.jpg', normal_map(h, 1.5), 92)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    soil(); labin(); grass()
    print('Texturen geschrieben nach', os.path.abspath(OUT))
