import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Fotorealistische, begehbare Welten (Gaussian Splats) – von KI erzeugt (z. B. SpAItial Echo)
// oder mit dem Handy gescannt (z. B. Scaniverse).
//
// Dateien im Ordner welten/:
//   <name>.sog / .spz / .ply        die Welt. Große Dateien (Millionen Punkte) sind erlaubt:
//                                   mit "lod": true wählt Spark pro Bild nur so viele Punkte,
//                                   wie die Quest schafft ("punkte", Standard 350.000).
//   <name>-collider.glb             optional: unsichtbare Hülle für Kollision
//   einstellungen.json              Ausrichtung und Ankerpunkte (siehe welten/LIESMICH.txt)
//
// Raumkoordinaten (alle Angaben in einstellungen.json): Meter, nachdem die Welt mit
// "umdrehen"/"drehung"/"skalierung" gerade ausgerichtet wurde. x/z waagerecht, Höhen über dem Boden.
export const WELTEN = ['zimmer', 'moschee', 'friedhof'];

export class SplatWorld {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.spark = null;
    this.group = new THREE.Group();     // Raumkoordinaten (nur verschoben)
    this.group.visible = false;
    scene.add(this.group);
    this.files = {};
    this.settings = {};
    this.loaded = {};                   // name → Promise<{ inner, mesh, collider }>
    this.current = null;
    this.ray = new THREE.Raycaster();
  }

  async _exists(url) {
    try { const r = await fetch(url, { method: 'HEAD', cache: 'no-store' }); return r.ok; } catch (e) { return false; }
  }

  // Prüft, welche Welten vorhanden sind (beim Start einmal aufrufen)
  async scan() {
    if (this._scan) return this._scan;
    this._scan = (async () => {
      try {
        const r = await fetch('welten/einstellungen.json', { cache: 'no-store' });
        if (r.ok) this.settings = await r.json();
      } catch (e) { /* keine Einstellungen */ }
      for (const name of WELTEN) {
        const c = this.cfg(name);
        const cands = c.datei ? [c.datei] : ['spz', 'sog', 'ply', 'splat'].map((e) => `${name}.${e}`);
        for (const f of cands) {
          if (await this._exists(`welten/${f}`)) { this.files[name] = { url: `welten/${f}` }; break; }
        }
        if (this.files[name] && await this._exists(`welten/${name}-collider.glb`)) this.files[name].collider = `welten/${name}-collider.glb`;
      }
      return Object.keys(this.files);
    })();
    return this._scan;
  }

  has(name) { return !!this.files[name]; }
  cfg(name) { return this.settings[name] || {}; }

  _ensureSpark() {
    if (this.spark) return;
    // Punkte-Budget pro Bild: kleinster Wert aller Welten (die Quest schafft ca. 300.000–500.000)
    const budgets = Object.keys(this.files).map((n) => this.cfg(n).punkte).filter(Boolean);
    this.spark = new SparkRenderer({ renderer: this.renderer, lodSplatCount: budgets.length ? Math.min(...budgets) : 350000 });
    this.scene.add(this.spark);
  }

  // Lädt eine Welt schon im Voraus (z. B. während die Startseite offen ist). Mehrfach aufrufbar.
  preload(name) {
    if (this.loaded[name]) return this.loaded[name];
    const f = this.files[name];
    if (!f) return Promise.resolve(null);
    this._ensureSpark();
    const c = this.cfg(name);
    this.loaded[name] = (async () => {
      const inner = new THREE.Group();
      const mesh = new SplatMesh({ url: f.url, lod: c.lod !== false });
      inner.add(mesh);
      await mesh.initialized;
      // Manche Exporte stehen „kopfüber“ (y nach unten) – dann 180° um X drehen
      if (c.umdrehen) inner.rotation.x = Math.PI;
      inner.rotation.y = ((c.drehung || 0) * Math.PI) / 180;
      inner.scale.setScalar(c.skalierung || 1);
      let collider = null;
      if (f.collider) {
        try {
          collider = (await new GLTFLoader().loadAsync(f.collider)).scene;
          collider.traverse((o) => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ visible: false }); });
          inner.add(collider);
        } catch (e) { collider = null; }
      }
      return { inner, mesh, collider };
    })();
    return this.loaded[name];
  }

  // Zeigt die Welt so, dass der Startpunkt unter dem Kopf liegt und der Boden auf Höhe 0
  async show(name, headPos) {
    const w = await this.preload(name);
    if (!w) return false;
    this.hide();
    const c = this.cfg(name);
    this.world = w;
    this.collider = w.collider;
    this.group.add(w.inner);
    const start = c.start || [0, 0];
    let floorY = c.boden ?? -(c.kamerahoehe || 1.6);
    this.group.position.set(0, 0, 0);
    this.group.updateMatrixWorld(true);
    const hit = c.boden === undefined && this._down(new THREE.Vector3(start[0], 0.5, start[1]));
    if (hit) floorY = hit.y;
    this.group.position.set(headPos.x - start[0], -floorY, headPos.z - start[1]);
    this.group.visible = true;
    this.group.updateMatrixWorld(true);
    this.current = name;
    this.brightness = 1;
    return true;
  }

  hide() {
    if (this.world) this.group.remove(this.world.inner);
    this.world = null;
    this.collider = null;
    this.group.visible = false;
    this.current = null;
  }
  get visible() { return this.group.visible; }

  // Helligkeit der Welt (1 = wie aufgenommen), z. B. wenn das Licht im Zimmer schwächer wird
  set brightness(v) { if (this.world) this.world.mesh.recolor.setRGB(v, v, v); }

  // Raumkoordinaten → Weltkoordinaten. xz = [x, z], height = Höhe über dem Boden.
  point(xz, height = 0) {
    const g = this.group.position;
    return new THREE.Vector3(g.x + xz[0], height, g.z + xz[1]);
  }
  // Weltkoordinaten → Raumkoordinaten (x, Höhe, z)
  toRoom(p) { return new THREE.Vector3(p.x - this.group.position.x, p.y, p.z - this.group.position.z); }

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

  // Darf man an dieser Stelle (Raumkoordinaten) stehen? "raum": [xmin, xmax, zmin, zmax],
  // "hindernisse": [[xmin, xmax, zmin, zmax], …] – Möbel, durch die man nicht gehen soll.
  _free(x, z, margin) {
    const c = this.cfg(this.current);
    const r = c.raum;
    if (r && (x < r[0] + margin || x > r[1] - margin || z < r[2] + margin || z > r[3] - margin)) return false;
    for (const b of c.hindernisse || []) {
      if (x > b[0] - margin && x < b[1] + margin && z > b[2] - margin && z < b[3] + margin) return false;
    }
    return true;
  }

  // Gehen begrenzen: an Wänden und Möbeln entlanggleiten statt hindurchzugehen
  clamp(head, target, margin = 0.25) {
    if (this.collider) {
      const dir = target.clone().sub(head); dir.y = 0;
      const len = dir.length();
      if (len < 1e-5) return target;
      dir.normalize();
      for (const hgt of [0.4, 1.0]) {
        this.ray.set(new THREE.Vector3(head.x, hgt, head.z), dir); this.ray.far = len + margin;
        if (this.ray.intersectObject(this.collider, true)[0]) return head.clone();
      }
      return target;
    }
    const h = this.toRoom(head), t = this.toRoom(target);
    if (this._free(t.x, t.z, margin)) return target;
    if (this._free(t.x, h.z, margin)) return new THREE.Vector3(target.x, target.y, head.z);
    if (this._free(h.x, t.z, margin)) return new THREE.Vector3(head.x, target.y, target.z);
    // Schon im „verbotenen“ Bereich (z. B. Start im Möbel): Bewegung nicht verhindern
    if (!this._free(h.x, h.z, margin)) return target;
    return head.clone();
  }
}
