import * as THREE from 'three';

// Eine schwebende Texttafel in VR: Arabisch oben, Deutsch darunter, Quelle unten rechts.
// Sie folgt dem Blick träge, damit man den Kopf frei bewegen kann.

const W = 1600, H = 900;
const AR_FONT = '"Noto Naskh Arabic", "Geeza Pro", serif';
const DE_FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export class TextPanel {
  constructor(scene) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.mat = new THREE.MeshBasicMaterial({
      map: this.tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0 * H / W), this.mat);
    this.mesh.renderOrder = 1000;
    this.mesh.visible = false;
    scene.add(this.mesh);

    this.distance = 0.85;
    this.yaw = null;
    this.targetOpacity = 0;
    this._tmp = new THREE.Vector3();
  }

  _wrap(text, maxWidth) {
    const g = this.g;
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxWidth && line) { lines.push(line); line = w; }
      else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  _draw(entry) {
    const g = this.g;
    g.clearRect(0, 0, W, H);
    const style = entry.style || 'quote';
    const pad = 70;
    const maxW = W - pad * 2;

    const blocks = [];
    let arSize = 58, deSize = 40;
    if (style === 'title') { arSize = 64; deSize = 64; }
    if (style === 'answer') { arSize = 66; deSize = 42; }
    if (style === 'hint') { deSize = 34; }

    if (entry.ar) {
      g.font = `600 ${arSize}px ${AR_FONT}`;
      g.direction = 'rtl';
      const lines = this._wrap(entry.ar, maxW);
      blocks.push({ kind: 'ar', lines, size: arSize, lh: arSize * 1.75 });
    }
    if (entry.de) {
      const weight = style === 'title' ? 600 : 400;
      g.font = `${weight} ${deSize}px ${DE_FONT}`;
      g.direction = 'ltr';
      const paragraphs = entry.de.split('\n');
      const lines = [];
      for (const p of paragraphs) lines.push(...this._wrap(p, maxW));
      blocks.push({ kind: 'de', lines, size: deSize, lh: deSize * 1.42, weight });
    }

    const gap = 34;
    let total = blocks.reduce((s, b) => s + b.lines.length * b.lh, 0) + gap * (blocks.length - 1);
    const srcH = entry.src ? 60 : 0;
    const boxH = Math.min(H, total + pad * 1.4 + srcH);
    const boxY = (H - boxH) / 2;

    // Hintergrund
    if (style !== 'title') {
      g.fillStyle = style === 'hint' ? 'rgba(20,18,14,0.75)' : 'rgba(6,5,4,0.62)';
      roundRect(g, 10, boxY, W - 20, boxH, 36);
      g.fill();
    }

    let y = boxY + pad * 0.7;
    for (const b of blocks) {
      for (const line of b.lines) {
        y += b.lh;
        if (b.kind === 'ar') {
          g.font = `600 ${b.size}px ${AR_FONT}`;
          g.direction = 'rtl';
          g.textAlign = 'center';
          g.fillStyle = entry.colorAr || '#f1dfae';
          g.fillText(line, W / 2, y - b.lh * 0.3);
        } else {
          g.font = `${b.weight} ${b.size}px ${DE_FONT}`;
          g.direction = 'ltr';
          g.textAlign = 'center';
          g.fillStyle = entry.colorDe || (style === 'hint' ? '#cfc6b6' : '#efe9de');
          g.fillText(line, W / 2, y - b.lh * 0.25);
        }
      }
      y += gap;
    }

    if (entry.src) {
      g.font = `400 28px ${DE_FONT}`;
      g.direction = 'ltr';
      g.textAlign = 'right';
      g.fillStyle = '#9d9483';
      g.fillText(entry.src, W - pad, boxY + boxH - 30);
    }
    this.tex.needsUpdate = true;
  }

  show(entry) {
    this._draw(entry);
    this.mesh.visible = true;
    this.targetOpacity = entry.style === 'whisper' ? 0.7 : 1;
  }

  hide() { this.targetOpacity = 0; }

  // Abstand zur Tafel; die Größe wird mitskaliert, damit sie gleich groß erscheint
  setDistance(d) {
    this.distance = d;
    this.mesh.scale.setScalar(d / 0.85);
  }

  update(camera, dt) {
    // Opazität weich
    const k = Math.min(1, dt * 4);
    this.mat.opacity += (this.targetOpacity - this.mat.opacity) * k;
    if (this.mat.opacity < 0.01 && this.targetOpacity === 0) { this.mesh.visible = false; }

    // Kopfposition und Blickrichtung (nur horizontal)
    camera.getWorldPosition(this._tmp);
    const e = camera.matrixWorld.elements;
    const camYaw = Math.atan2(-e[8], -e[10]);
    if (this.yaw === null) this.yaw = camYaw;
    let d = camYaw - this.yaw;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) > 0.45 || this._following) {
      this._following = Math.abs(d) > 0.05;
      this.yaw += d * Math.min(1, dt * 2.5);
    }
    const p = this._tmp;
    this.mesh.position.set(
      p.x + Math.sin(this.yaw) * this.distance,
      p.y - 0.06,
      p.z + Math.cos(this.yaw) * this.distance,
    );
    this.mesh.lookAt(p.x, p.y - 0.06, p.z);
  }
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
