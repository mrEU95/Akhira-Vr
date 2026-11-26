import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fotorealistische, begehbare Welten (Gaussian Splats) – von KI erzeugt (z. B. SpAItial Echo)
// oder mit dem Handy gescannt (z. B. Scaniverse).
//
// Dateien im Ordner welten/:
//   <name>.spz oder <name>.ply      die Welt (für die Quest ca. 300.000–500.000 Punkte)
//   <name>-collider.glb             optional: unsichtbare Hülle (Wände, Boden, Möbel) für Kollision
//   einstellungen.json              optional: Ausrichtung und Ankerpunkte, z. B.
//     { "zimmer": { "umdrehen": true, "drehung": 0, "skalierung": 1, "kamerahoehe": 1.6,
//                   "start": [0, 0], "handy": [0.5, -0.6], "mushaf": [1.2, 0.3], "bett": [1.0, 0.8, 0.6] } }
//   (Positionen in Metern relativ zum Startpunkt der Welt: [x, z] bzw. [x, z, Höhe])
export const WELTEN = ['zimmer', 'moschee', 'friedhof'];

export class SplatWorld {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.spark = null;
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.files = {};
    this.settings = {};
    this.mesh = null;
    this.collider = null;
    this.current = null;
    this.ray = new THREE.Raycaster();
  }

  async _exists(url) {
    try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch (e) { return false; }
  }

  // Prüft, welche Welten vorhanden sind (beim Start einmal aufrufen)
  async scan() {
    try {
      const r = await fetch('welten/einstellungen.json', { cache: 'no-store' });
      if (r.ok) this.settings = await r.json();
    } catch (e) { /* keine Einstellungen */ }
    for (const name of WELTEN) {
      for (const ext of ['spz', 'ply', 'sog', 'splat']) {
        if (await this._exists(`welten/${name}.${ext}`)) { this.files[name] = { url: `welten/${name}.${ext}` }; break; }
      }
      if (this.files[name] && await this._exists(`welten/${name}-collider.glb`)) this.files[name].collider = `welten/${name}-collider.glb`;
    }
    return Object.keys(this.files);
  }

  has(name) { return !!this.files[name]; }
  cfg(name) { return this.settings[name] || {}; }

  // Lädt die Welt und stellt sie so auf, dass ihr Startpunkt unter dem Kopf des Zuschauers liegt
  async show(name, headPos) {
    const f = this.files[name];
    if (!f) return false;
    if (!this.spark) { this.spark = new SparkRenderer({ renderer: this.renderer }); this.scene.add(this.spark); }
    this.hide();
    const c = this.cfg(name);
    const inner = new THREE.Group();          // Weltkoordinaten der Datei
    this.mesh = new SplatMesh({ url: f.url });
    inner.add(this.mesh);
    await this.mesh.initialized;
    // Viele Exporte stehen „kopfüber“ (y nach unten) – dann 180° um X drehen
    if (c.umdrehen !== false) inner.rotation.x = Math.PI;
    inner.rotation.y = ((c.drehung || 0) * Math.PI) / 180;
    inner.scale.setScalar(c.skalierung || 1);
    if (f.collider) {
      try {
        const gltf = await new GLTFLoader().loadAsync(f.collider);
        this.collider = gltf.scene;
        this.collider.traverse((o) => { if (o.isMesh) { o.material = new THREE.MeshBasicMaterial({ visible: false }); } });
        inner.add(this.collider);
      } catch (e) { this.collider = null; }
    }
    this.group.clear();
    this.group.add(inner);
    this.inner = inner;
    // Boden finden: per Kollisionshülle, sonst angenommene Kamerahöhe der Aufnahme
    this.group.position.set(0, 0, 0);
    this.group.updateMatrixWorld(true);
    const start = c.start || [0, 0];
    let floorY = -(c.kamerahoehe || 1.6);
    const hit = this._down(new THREE.Vector3(start[0], 0.5, start[1]));
    if (hit) floorY = hit.y;
    // Welt so verschieben, dass der Startpunkt unter dem Kopf liegt und der Boden auf Höhe 0
    this.group.position.set(headPos.x - start[0], -floorY, headPos.z - start[1]);
    this.group.visible = true;
    this.group.updateMatrixWorld(true);
    this.current = name;
    return true;
  }

  hide() {
    if (this.mesh) { this.mesh.dispose?.(); this.mesh = null; }
    this.group.clear();
    this.collider = null;
    this.group.visible = false;
    this.current = null;
  }
  get visible() { return this.group.visible; }

  // Punkt in Welt-Metern relativ zum Startpunkt → Weltkoordinaten (Höhe über dem Boden)
  point(xz, height = 0) {
    return new THREE.Vector3(this.group.position.x + xz[0] + (this.cfg(this.current).start || [0, 0])[0], height,
      this.group.position.z + xz[1] + (this.cfg(this.current).start || [0, 0])[1]);
  }

  // Oberfläche unter einem Punkt (Tisch, Bett, Boden) – nur mit Kollisionshülle
  _down(p) {
    if (!this.collider) return null;
    this.ray.set(p, new THREE.Vector3(0, -1, 0));
    this.ray.far = 4;
    const h = this.ray.intersectObject(this.collider, true)[0];
    return h ? h.point : null;
  }
  surfaceAt(x, z, fromY = 2.2) {
    const h = this._down(new THREE.Vector3(x, fromY, z));
    return h ? h.y : 0;
  }

  // Gehen begrenzen: blockiert, wenn in Bewegungsrichtung eine Wand/ein Möbel näher als margin ist
  clamp(head, target, margin = 0.3) {
    if (!this.collider) return target;
    const dir = target.clone().sub(head); dir.y = 0;
    const len = dir.length();
    if (len < 1e-5) return target;
    dir.normalize();
    for (const hgt of [0.4, 1.0]) {             // Kniehöhe und Hüfthöhe prüfen
      const o = new THREE.Vector3(head.x, hgt, head.z);
      this.ray.set(o, dir); this.ray.far = len + margin;
      const hit = this.ray.intersectObject(this.collider, true)[0];
      if (hit) return head.clone();
    }
    return target;
  }
}
