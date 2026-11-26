"""SOG (PlayCanvas / splat-transform v2) → verkleinerte PLY-Datei für die Quest.

Aufruf:  python3 tools/sog2ply.py welt.sog welten/zimmer.ply --anzahl 450000 [--info]

Behält die „wichtigsten“ Punkte (deckend und groß genug, um gesehen zu werden)
und wirft winzige, fast unsichtbare Punkte weg. Ergebnis: Standard-3DGS-PLY ohne
höhere Farbanteile (SH), die Spark direkt laden kann.
"""
import argparse, io, json, sys, zipfile
import numpy as np
from PIL import Image


def img(z, name, n):
    a = np.asarray(Image.open(io.BytesIO(z.read(name))).convert('RGBA'), dtype=np.uint8)
    return a.reshape(-1, 4)[:n]


def decode(path):
    z = zipfile.ZipFile(path)
    meta_name = [x for x in z.namelist() if x.endswith('meta.json')][0]
    m = json.loads(z.read(meta_name))
    assert m.get('version') == 2, 'nur SOG Version 2'
    n = m['count']
    f = lambda k, i=0: m[k]['files'][i]
    # Positionen: 16 Bit (oberes/unteres Byte), logarithmisch abgelegt
    lo, hi = img(z, f('means', 0), n), img(z, f('means', 1), n)
    v = (hi[:, :3].astype(np.uint32) << 8 | lo[:, :3]).astype(np.float64) / 65535.0
    mins, maxs = np.array(m['means']['mins']), np.array(m['means']['maxs'])
    t = mins + (maxs - mins) * v
    xyz = np.sign(t) * (np.exp(np.abs(t)) - 1.0)
    # Drehung: „kleinste drei“ + Index der weggelassenen Komponente (Reihenfolge w,x,y,z)
    q = img(z, f('quats'), n)
    abc = (q[:, :3].astype(np.float64) / 255.0 - 0.5) * 2.0 / np.sqrt(2.0)
    d = np.sqrt(np.clip(1.0 - (abc ** 2).sum(1), 0, 1))
    mode = q[:, 3].astype(np.int64) - 252
    rot = np.zeros((n, 4))
    for k in range(4):
        sel = mode == k
        others = [j for j in range(4) if j != k]
        rot[sel, k] = d[sel]
        rot[np.ix_(sel, others)] = abc[sel]
    # Größe (log) und Farbe über Codebuch, Deckkraft im Alphakanal
    sc = img(z, f('scales'), n)
    cb = np.array(m['scales']['codebook'])
    scale = cb[sc[:, :3]]
    c0 = img(z, f('sh0'), n)
    cb0 = np.array(m['sh0']['codebook'])
    dc = cb0[c0[:, :3]]
    op = np.clip(c0[:, 3].astype(np.float64) / 255.0, 1e-4, 1 - 1e-4)
    return dict(xyz=xyz, rot=rot, scale=scale, dc=dc, op=op, meta=m)


def write_ply(path, d, idx):
    n = len(idx)
    props = ['x', 'y', 'z', 'nx', 'ny', 'nz', 'f_dc_0', 'f_dc_1', 'f_dc_2', 'opacity',
             'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3']
    arr = np.zeros((n, len(props)), dtype=np.float32)
    arr[:, 0:3] = d['xyz'][idx]
    arr[:, 6:9] = d['dc'][idx]
    p = d['op'][idx]
    arr[:, 9] = np.log(p / (1 - p))
    arr[:, 10:13] = d['scale'][idx]
    arr[:, 13:17] = d['rot'][idx]
    head = 'ply\nformat binary_little_endian 1.0\nelement vertex %d\n' % n
    head += ''.join('property float %s\n' % p for p in props) + 'end_header\n'
    with open(path, 'wb') as fh:
        fh.write(head.encode('ascii'))
        fh.write(arr.tobytes())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('sog'); ap.add_argument('ply', nargs='?')
    ap.add_argument('--anzahl', type=int, default=450000)
    ap.add_argument('--info', action='store_true')
    a = ap.parse_args()
    d = decode(a.sog)
    xyz = d['xyz']
    print('Punkte:', len(xyz))
    for i, ax in enumerate('xyz'):
        print(' %s: %.2f … %.2f  (1%%–99%%: %.2f … %.2f)' % (ax, xyz[:, i].min(), xyz[:, i].max(),
              *np.percentile(xyz[:, i], [1, 99])))
    print(' Größe (median exp):', np.exp(np.median(d['scale'])), ' Deckkraft median:', np.median(d['op']))
    if a.info or not a.ply:
        return
    # Wichtigkeit: Deckkraft × sichtbare Fläche (zwei größte Achsen)
    s = np.sort(np.exp(d['scale']), axis=1)
    imp = d['op'] * s[:, 1] * s[:, 2]
    k = min(a.anzahl, len(imp))
    idx = np.argpartition(-imp, k - 1)[:k]
    idx.sort()
    write_ply(a.ply, d, idx)
    print('geschrieben:', a.ply, k, 'Punkte')


if __name__ == '__main__':
    main()
