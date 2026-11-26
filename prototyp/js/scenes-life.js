import * as THREE from 'three';
import { pbrMaterial, setRepeat, makeFigure, radialTexture } from './world.js';

// Räume des diesseitigen Lebens (Zimmer, Gebetsraum) und die Effekte des Sterbens.
// Platzhalter, bis die fotorealistischen KI-Welten (Gaussian Splats) eingesetzt werden.

function box(w, h, d, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function plane(kind, w, h, pos, rot, opts) {
  const mat = pbrMaterial(kind, opts);
  setRepeat(mat, w, h);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  p.position.copy(pos);
  p.rotation.set(rot[0], rot[1], rot[2] || 0, 'YXZ');
  p.receiveShadow = true;
  return p;
}
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ======================================================================
// Das Zimmer (Prolog/Epilog). Ursprung = Sitzplatz auf der Bettkante, Blick nach -z.
// ======================================================================
export class Room {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    const g = this.group;
    const X0 = -2.0, X1 = 2.2, Z0 = -2.2, Z1 = 2.4, H = 2.6;
    const W = X1 - X0, D = Z1 - Z0, cx = (X0 + X1) / 2, cz = (Z0 + Z1) / 2;
    g.add(plane('wood', W, D, V(cx, 0, cz), [-Math.PI / 2, 0]));
    g.add(plane('plaster', W, D, V(cx, H, cz), [Math.PI / 2, 0]));
    g.add(plane('plaster', W, H, V(cx, H / 2, Z0), [0, 0]));
    g.add(plane('plaster', W, H, V(cx, H / 2, Z1), [0, Math.PI]));
    g.add(plane('plaster', D, H, V(X0, H / 2, cz), [0, Math.PI / 2]));
    g.add(plane('plaster', D, H, V(X1, H / 2, cz), [0, -Math.PI / 2]));

    // Fenster: Abenddämmerung, draußen eine Straßenlaterne
    const wc = document.createElement('canvas'); wc.width = 256; wc.height = 320;
    const wg = wc.getContext('2d');
    const grd = wg.createLinearGradient(0, 0, 0, 320);
    grd.addColorStop(0, '#0c1428'); grd.addColorStop(0.7, '#243555'); grd.addColorStop(1, '#3a3f52');
    wg.fillStyle = grd; wg.fillRect(0, 0, 256, 320);
    const lamp = wg.createRadialGradient(190, 120, 0, 190, 120, 70);
    lamp.addColorStop(0, 'rgba(255,200,120,0.9)'); lamp.addColorStop(1, 'rgba(255,200,120,0)');
    wg.fillStyle = lamp; wg.fillRect(0, 0, 256, 320);
    wg.fillStyle = '#05070c';
    for (let i = 0; i < 6; i++) wg.fillRect(i * 45, 250 - Math.random() * 60, 38, 120); // Häuser
    wg.fillStyle = 'rgba(255,210,140,0.8)';
    for (let i = 0; i < 14; i++) wg.fillRect(Math.random() * 250, 230 + Math.random() * 70, 4, 6);
    const wt = new THREE.CanvasTexture(wc); wt.colorSpace = THREE.SRGBColorSpace;
    this.windowMat = new THREE.MeshBasicMaterial({ map: wt });
    const win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.35), this.windowMat);
    win.position.set(0.7, 1.5, Z0 + 0.01);
    g.add(win);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0xe8e4dc, roughness: 0.7 });
    g.add(box(1.2, 0.05, 0.08, frameMat, 0.7, 2.2, Z0 + 0.04), box(1.2, 0.05, 0.08, frameMat, 0.7, 0.8, Z0 + 0.04));
    g.add(box(0.05, 1.45, 0.08, frameMat, 0.12, 1.5, Z0 + 0.04), box(0.05, 1.45, 0.08, frameMat, 1.28, 1.5, Z0 + 0.04), box(0.04, 1.4, 0.06, frameMat, 0.7, 1.5, Z0 + 0.04));
    this.dawn = { mat: this.windowMat, canvas: wc };

    // Bett hinter dem Zuschauer (er sitzt an der Kante)
    const woodMat = pbrMaterial('wood'); setRepeat(woodMat, 1, 1);
    const fabric = new THREE.MeshStandardMaterial({ color: 0x6d7a86, roughness: 1 });
    const sheet = new THREE.MeshStandardMaterial({ color: 0xd9d6cf, roughness: 1 });
    g.add(box(1.0, 0.3, 2.05, woodMat, 0, 0.15, 1.05));
    g.add(box(0.96, 0.16, 2.0, sheet, 0, 0.38, 1.05));
    g.add(box(0.98, 0.04, 1.3, fabric, 0, 0.48, 0.75));
    g.add(box(0.6, 0.12, 0.35, sheet, 0, 0.52, 1.85)); // Kissen
    g.add(box(1.0, 0.7, 0.06, woodMat, 0, 0.35, 2.1));

    // Schreibtisch mit Handy und Tasse
    g.add(box(1.2, 0.04, 0.6, woodMat, -1.1, 0.75, -1.8));
    g.add(box(0.05, 0.73, 0.55, woodMat, -1.65, 0.37, -1.8), box(0.05, 0.73, 0.55, woodMat, -0.55, 0.37, -1.8));
    // Handy als eigene Gruppe (bleibt auch im Fotomodus sichtbar)
    this.phone = new THREE.Group();
    this.phone.add(box(0.075, 0.009, 0.155, new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 }), 0, 0.0045, 0));
    this.screen = new PhoneScreen();
    this.phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.068, 0.145), new THREE.MeshBasicMaterial({ map: this.screen.tex, color: 0x222222 }));
    this.phoneScreen.rotation.x = -Math.PI / 2;
    this.phoneScreen.position.set(0, 0.0095, 0);
    this.phone.add(this.phoneScreen);
    this.phone.position.set(-0.95, 0.771, -1.7);
    g.add(this.phone);
    this.phonePos = this.phone.position;
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.4 }));
    cup.position.set(-1.35, 0.82, -1.85); g.add(cup);

    // Regal an der linken Wand mit dem verstaubten Mushaf
    g.add(box(0.25, 0.03, 0.9, woodMat, X0 + 0.13, 1.45, -0.6));
    const books = [0x5b3b2a, 0x2c3e50, 0x7a6a4f];
    books.forEach((c, i) => g.add(box(0.18, 0.24, 0.04, new THREE.MeshStandardMaterial({ color: c, roughness: 0.9 }), X0 + 0.13, 1.585, -0.95 + i * 0.05)));
    this.mushafMat = new THREE.MeshStandardMaterial({ color: 0x7d8a72, roughness: 1 }); // staubig: matt, entsättigt, grauer Schleier
    // Mushaf als eigene Gruppe (bleibt auch im Fotomodus sichtbar)
    this.mushafGroup = new THREE.Group();
    this.mushaf = buildMushaf();
    this.mushafGroup.add(this.mushaf);
    this.mushafGroup.position.set(X0 + 0.13, 1.47, -0.45);
    g.add(this.mushafGroup);
    // Schwaches Licht der Nachttischlampe auf dem Mushaf (nur im Fotomodus an)
    this.mushafLight = new THREE.PointLight(0xffd9a8, 0, 1.2, 2);
    this.mushafLight.position.set(0.15, 0.3, 0.1);
    this.mushafGroup.add(this.mushafLight);
    this.homes = { phone: this.phone.position.clone(), mushaf: this.mushafGroup.position.clone() };

    // Tür rechts
    g.add(box(0.05, 2.05, 0.9, woodMat, X1 - 0.03, 1.03, 0.2));

    // Deckenleuchte (warm)
    this.lampMesh = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffe2b0 }));
    this.lampMesh.position.set(0.1, H - 0.25, -0.3);
    g.add(this.lampMesh);
    this.lamp = new THREE.PointLight(0xffd2a0, 0, 9, 1.6);
    this.lamp.position.copy(this.lampMesh.position);
    this.lamp.castShadow = false;
    g.add(this.lamp);
    this.fill = new THREE.HemisphereLight(0x8090b0, 0x403020, 0);
    g.add(this.fill);

    // Angehörige am Bett – gesichtslos (G12), erst beim Sterben sichtbar
    const robe = new THREE.MeshStandardMaterial({ color: 0x3a3632, roughness: 1 });
    const light = new THREE.MeshStandardMaterial({ color: 0xbdb6a8, roughness: 1 });
    this.family = new THREE.Group();
    const scarf = new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 1 });
    [[-1.25, 0.6, robe, 1.72, 'mann'], [1.25, 1.0, scarf, 1.62, 'frau'], [-1.2, 2.0, light, 1.58, 'frau'], [1.2, -0.2, light, 1.76, 'tuch']].forEach(([x, z, m, h, kind]) => {
      const f = makeFigure(m, h, { kind });
      f.position.set(x, 0, z);
      f.lookAt(0, 0, z);
      this.family.add(f);
    });
    this.family.visible = false;
    g.add(this.family);

    this.headOnBed = V(0, 0.62, 1.55); // Kopfposition, wenn er liegt
    this.setLamp(1);
  }
  // Fotomodus: ein 360°-Foto ersetzt den gebauten Raum, nur die Angehörigen bleiben
  setPhotoMode(on) {
    const keep = [this.family, this.lamp, this.fill, this.phone, this.mushafGroup];
    this.group.children.forEach((c) => { c.visible = !on || keep.includes(c); });
    this.mushafLight.intensity = on ? 0.5 : 0;
    this.mushafGroup.scale.setScalar(on ? 1.15 : 1);
    if (!on) {
      this.phone.position.copy(this.homes.phone); this.phone.rotation.set(0, 0, 0);
      this.mushafGroup.position.copy(this.homes.mushaf); this.mushafGroup.rotation.set(0, 0, 0);
    }
  }
  // Angehörige um das Bett im projizierten Raum stellen (Positionen in w/n des Raums)
  placeFamily(proom) {
    const spots = [[2.25, -1.3], [1.5, 1.3], [0.55, -1.25], [2.35, 1.35]];
    const bed = proom.local(2.0, 0, 0);
    this.family.children.forEach((f, i) => {
      const [w, n] = spots[i % spots.length];
      f.position.copy(proom.local(w, n, 0));
      f.lookAt(bed.x, 0, bed.z);
    });
  }
  // Gegenstände passend ins 360°-Foto setzen. Anker: u/v im Foto (0..1), s = Höhe der Fläche im Raum (m).
  // Die Entfernung ergibt sich aus der Kamerahöhe des Fotos (camH); gesetzt wird entlang des Sehstrahls
  // vom Auge des Zuschauers, damit der Gegenstand genau dort erscheint, wo die Fläche im Foto ist.
  placeInPhoto(anchors, eyeY, drehungDeg = 0, camH = 1.45) {
    const put = (obj, a, lying) => {
      if (!a) return;
      const th = (a.u - 0.5) * 2 * Math.PI - (drehungDeg * Math.PI) / 180;
      const ph = (0.5 - a.v) * Math.PI;
      const dist = Math.max(0.6, (camH - a.s) / Math.tan(-ph));
      const dir = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(ph), -Math.cos(th) * Math.cos(ph));
      obj.position.set(dir.x * dist, eyeY + dir.y * dist + 0.01, dir.z * dist);
      obj.rotation.set(lying ? -Math.PI / 2 : 0, -th + (a.dreh || 0), 0, 'YXZ');
    };
    put(this.phone, anchors.handy, false);
    put(this.mushafGroup, anchors.mushaf, true);
  }
  setLamp(level, warm = 0) {
    this.lamp.intensity = 7 * level;
    this.lamp.color.setRGB(1, 0.82 - warm * 0.1, 0.63 - warm * 0.15);
    this.lampMesh.material.color.setRGB(1, 0.89 - warm * 0.1, 0.69 - warm * 0.2).multiplyScalar(0.3 + 0.7 * level);
    this.fill.intensity = 0.35 * level;
  }
  set visible(v) { this.group.visible = v; }
}

// ======================================================================
// Der Gebetsraum (Totengebet). Ursprung = Raummitte am Boden, Qibla in Richtung -z.
// ======================================================================
export class Mosque {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    const g = this.group;
    const HX = 8, HZ = 6, H = 7;
    g.add(plane('carpet', 2 * HX, 2 * HZ, V(0, 0, 0), [-Math.PI / 2, 0]));
    // Decke mit runder Öffnung für die Kuppel
    const shape = new THREE.Shape();
    shape.moveTo(-HX, -HZ); shape.lineTo(HX, -HZ); shape.lineTo(HX, HZ); shape.lineTo(-HX, HZ); shape.lineTo(-HX, -HZ);
    const hole = new THREE.Path(); hole.absarc(0, 0, 4, 0, Math.PI * 2, true); shape.holes.push(hole);
    const ceilMat = pbrMaterial('plaster'); setRepeat(ceilMat, 1, 1);
    for (const k of ['map', 'normalMap', 'roughnessMap']) if (ceilMat[k]) ceilMat[k].repeat.set(1 / 2, 1 / 2);
    const ceil = new THREE.Mesh(new THREE.ShapeGeometry(shape, 48), ceilMat);
    ceil.rotation.x = Math.PI / 2; ceil.position.y = H;
    g.add(ceil);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), pbrMaterial('plaster', { side: THREE.BackSide }));
    dome.position.y = H; dome.scale.y = 0.9;
    g.add(dome);
    // Kuppelkranz mit kleinen Fenstern
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xfff3d6 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.7), ringMat);
      w.position.set(Math.cos(a) * 3.97, H + 0.5, Math.sin(a) * 3.97);
      w.lookAt(0, H + 0.5, 0);
      g.add(w);
    }
    // Wände
    g.add(plane('plaster', 2 * HX, H, V(0, H / 2, -HZ), [0, 0]));
    g.add(plane('plaster', 2 * HX, H, V(0, H / 2, HZ), [0, Math.PI]));
    g.add(plane('plaster', 2 * HZ, H, V(-HX, H / 2, 0), [0, Math.PI / 2]));
    g.add(plane('plaster', 2 * HZ, H, V(HX, H / 2, 0), [0, -Math.PI / 2]));
    // Bogenfenster an den Seiten
    const archShape = (w, h) => {
      const s = new THREE.Shape();
      s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h - w / 2);
      s.absarc(0, h - w / 2, w / 2, 0, Math.PI, false); s.lineTo(-w / 2, 0);
      return new THREE.ShapeGeometry(s, 24);
    };
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfaf1dc });
    for (const side of [-1, 1]) for (let i = 0; i < 4; i++) {
      const w = new THREE.Mesh(archShape(1.1, 2.6), winMat);
      w.position.set(side * (HX - 0.01), 2.6, -4.2 + i * 2.8);
      w.rotation.y = -side * Math.PI / 2;
      g.add(w);
    }
    // Gebetsnische (Mihrab) in der Qibla-Wand
    const mihrabMat = new THREE.MeshStandardMaterial({ color: 0x2f5d50, roughness: 0.6 });
    const mihrab = new THREE.Mesh(archShape(1.6, 3.2), mihrabMat);
    mihrab.position.set(0, 0, -HZ + 0.02);
    g.add(mihrab);
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xc9a86a, roughness: 0.5, metalness: 0.3 });
    const trim = new THREE.Mesh(archShape(1.8, 3.35), trimMat);
    trim.position.set(0, 0, -HZ + 0.01);
    g.add(trim);
    // Tür hinten (hell, Tageslicht)
    this.door = new THREE.Mesh(archShape(2.4, 3.4), new THREE.MeshBasicMaterial({ color: 0xfffaf0 }));
    this.door.position.set(0, 0, HZ - 0.01); this.door.rotation.y = Math.PI;
    g.add(this.door);
    // Leuchter unter der Kuppel
    const bulb = new THREE.MeshBasicMaterial({ color: 0xffe6b8 });
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), bulb);
      b.position.set(Math.cos(a) * 1.6, 4.6, Math.sin(a) * 1.6);
      g.add(b);
    }
    const ringGeo = new THREE.TorusGeometry(1.6, 0.025, 6, 64);
    const ring = new THREE.Mesh(ringGeo, trimMat); ring.rotation.x = Math.PI / 2; ring.position.y = 4.62; g.add(ring);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 2.4), trimMat);
      rod.position.set(Math.cos(a) * 0.8, 5.8, Math.sin(a) * 0.8); rod.rotation.z = Math.cos(a) * 0.6; rod.rotation.x = -Math.sin(a) * 0.6;
      g.add(rod);
    }
    this.lights = [];
    for (const [x, z] of [[0, 0], [-4, -3], [4, -3], [-4, 3], [4, 3]]) {
      const l = new THREE.PointLight(0xffe0b0, 0, 14, 1.5);
      l.position.set(x, 4.5, z);
      g.add(l); this.lights.push(l);
    }
    this.fill = new THREE.HemisphereLight(0xfff4e0, 0x6a2a2a, 0);
    g.add(this.fill);
    // Bahre vor dem Mihrab
    const woodMat = pbrMaterial('wood'); setRepeat(woodMat, 0.6, 0.6);
    const bierZ = -3.6;
    // Quer zur Qibla: der Kopf liegt zur Rechten des Imams (+x)
    const bier = new THREE.Group();
    bier.add(box(2.0, 0.05, 0.7, woodMat, 0, 0.75, bierZ));
    for (const [x, z] of [[-0.9, -0.3], [-0.9, 0.3], [0.9, -0.3], [0.9, 0.3]]) bier.add(box(0.05, 0.75, 0.05, woodMat, x, 0.37, bierZ + z));
    const shroud = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 1 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.45, 6, 16), shroud);
    body.rotation.z = Math.PI / 2; body.position.set(0, 0.95, bierZ); body.scale.set(1.1, 1, 0.7);
    bier.add(body);
    g.add(bier);
    this.bier = bier;
    // Kopf liegt Richtung Osten/rechts; Blick nach oben
    this.headOnBier = V(0.78, 1.12, bierZ);
    this.doorPos = V(0, 1.6, HZ);
    this.setLight(1);
  }
  // Fotomodus: ein 360°-Foto ersetzt den gebauten Raum, nur die Bahre bleibt
  setPhotoMode(on) { this.group.children.forEach((c) => { c.visible = !on || c === this.bier; }); }
  setLight(level) {
    this.lights.forEach((l, i) => { l.intensity = (i === 0 ? 14 : 8) * level; });
    this.fill.intensity = 0.7 * level;
  }
  set visible(v) { this.group.visible = v; }
}

// ======================================================================
// Schleier vor den Augen: Milchglas (Sterben) oder Leichentuch (Totengebet)
// ======================================================================
export class Veil {
  constructor(camera) {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    this.canvas = c; this.ctx = g;
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.wrapS = this.tex.wrapT = THREE.RepeatWrapping;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false, side: THREE.BackSide, fog: false });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.3, 32, 16), this.mat);
    this.mesh.renderOrder = 990;
    this.mesh.visible = false;
    camera.add(this.mesh);
    this.frost();
  }
  // Milchglas: helle, wolkige Trübung
  frost() {
    const g = this.ctx;
    g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * 512, y = Math.random() * 512, r = 20 + Math.random() * 60;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const v = Math.random() < 0.5 ? '255,255,255' : '150,145,138';
      grd.addColorStop(0, `rgba(${v},0.12)`); grd.addColorStop(1, `rgba(${v},0)`);
      g.fillStyle = grd; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    }
    this.tex.repeat.set(2, 1);
    this.tex.needsUpdate = true;
  }
  // Leichentuch: feines Baumwollgewebe, weiß
  cloth() {
    const g = this.ctx;
    g.fillStyle = '#f2efe8'; g.fillRect(0, 0, 512, 512);
    for (let y = 0; y < 512; y += 2) { g.fillStyle = `rgba(160,150,135,${0.10 + Math.random() * 0.08})`; g.fillRect(0, y, 512, 1); }
    for (let x = 0; x < 512; x += 2) { g.fillStyle = `rgba(160,150,135,${0.08 + Math.random() * 0.08})`; g.fillRect(x, 0, 1, 512); }
    for (let i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 40, 1); }
    this.tex.repeat.set(10, 5);
    this.tex.needsUpdate = true;
  }
  set opacity(v) { this.mat.opacity = v; this.mesh.visible = v > 0.002; }
  get opacity() { return this.mat.opacity; }
}

// ======================================================================
// Licht ohne Form, das von oben herabsinkt – scharf über dem Schleier.
// „Sie setzen sich zu ihm, so weit das Auge reicht.“ (Abu Dawud 4753)
// ======================================================================
export class DescendingLights {
  constructor(scene) {
    const N = 240;
    this.N = N;
    const pos = new Float32Array(N * 3);
    this.from = new Float32Array(N * 3);
    this.to = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      // Zielpunkte füllen den Himmel über dem Liegenden – nah und fern, „so weit das Auge reicht“
      const r = 1.5 + Math.pow(Math.random(), 0.7) * 30, a = Math.random() * Math.PI * 2;
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      this.to.set([x, 1.2 + r * (0.5 + Math.random() * 0.9), z], i * 3);
      this.from.set([x * 0.6, 25 + Math.random() * 25, z * 0.6], i * 3);
    }
    pos.set(this.from);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.PointsMaterial({
      map: radialTexture('rgba(255,250,238,1)'), size: 18, sizeAttenuation: false, transparent: true, opacity: 0,
      depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    });
    this.points = new THREE.Points(geo, this.mat);
    this.points.renderOrder = 995;
    this.points.frustumCulled = false;
    this.group = new THREE.Group();
    this.group.add(this.points);
    // Die eine, klarere Präsenz am Kopfende
    this.headMat = new THREE.SpriteMaterial({ map: radialTexture('rgba(255,252,242,1)'), transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.head = new THREE.Sprite(this.headMat);
    this.head.renderOrder = 996;
    this.head.scale.set(1.4, 1.4, 1);
    this.group.add(this.head);
    this.group.visible = false;
    scene.add(this.group);
  }
  // t: 0 = hoch oben, 1 = angekommen
  descend(t) {
    const pos = this.points.geometry.attributes.position.array;
    for (let i = 0; i < this.N * 3; i++) pos[i] = this.from[i] + (this.to[i] - this.from[i]) * t;
    this.points.geometry.attributes.position.needsUpdate = true;
  }
  set level(v) { this.mat.opacity = v; this.group.visible = v > 0.001 || this.headMat.opacity > 0.001; }
  set headLevel(v) { this.headMat.opacity = v; this.group.visible = v > 0.001 || this.mat.opacity > 0.001; }
}

// ======================================================================
// 360°-Fotos (equirectangular, 2:1) als echte Umgebung.
// Liegen sie als panorama/<name>.jpg vor, ersetzen sie die gebauten Räume.
// ======================================================================
export const PANORAMEN = ['zimmer', 'moschee', 'himmel', 'friedhof'];
export class Panorama {
  constructor(scene) {
    const geo = new THREE.SphereGeometry(150, 64, 32);
    geo.scale(-1, 1, 1); // von innen gesehen, nicht gespiegelt
    this.mat = new THREE.MeshBasicMaterial({ depthWrite: false, fog: false, color: 0xffffff });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.renderOrder = -20;
    this.mesh.visible = false;
    scene.add(this.mesh);
    this.tex = {};
    this.settings = {};
    this.loader = new THREE.TextureLoader();
  }
  async loadSettings() {
    try {
      const r = await fetch('panorama/einstellungen.json', { cache: 'no-store' });
      if (r.ok) this.settings = await r.json();
    } catch (e) { /* keine Einstellungen */ }
  }
  async load(name) {
    if (name in this.tex) return this.tex[name];
    this.tex[name] = null;
    try {
      const url = 'panorama/' + name + '.jpg';
      const head = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (!head.ok) return null;
      const t = await this.loader.loadAsync(url);
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      this.tex[name] = t;
    } catch (e) { /* kein Foto */ }
    return this.tex[name];
  }
  has(name) { return !!this.tex[name]; }
  // Zeigt das Foto; Drehung (Grad) aus panorama/einstellungen.json, z. B. {"moschee": {"drehung": 90}}
  show(name) {
    const t = this.tex[name];
    if (!t) return false;
    this.mat.map = t; this.mat.needsUpdate = true;
    const deg = (this.settings[name] && this.settings[name].drehung) || 0;
    this.mesh.rotation.set(0, -Math.PI / 2 + (deg * Math.PI) / 180, 0); // Bildmitte = Blickrichtung
    this.brightness = 1;
    this.mesh.visible = true;
    return true;
  }
  set brightness(v) { this.mat.color.setScalar(v); }
  hide() { this.mesh.visible = false; }
  follow(pos) { this.mesh.position.copy(pos); }
}

// ======================================================================
// Projizierter Raum: das 360°-Foto wird auf grobe 3D-Flächen des echten Raums projiziert
// (Wände, Boden, Decke, Bett, Schreibtisch …). So entsteht Tiefe: Kopfbewegung und Gehen
// verändern die Ansicht wie in einem echten Raum. Maße aus dem Foto ausgemessen.
// Koordinaten: w = entlang der Bettachse (zum Kopfende +), n = quer (zur Rückwand +), Ursprung
// unter der Fotokamera. Die Kamera stand CAM_H über dem Boden.
// ======================================================================
const ROOM_SPEC = {
  zimmer: {
    camH: 1.5, alpha: 26.8,                       // Kamerahöhe (m), Drehung des Raums (Grad)
    room: { w: [-1.9, 3.15], n: [-1.66, 1.57], h: 2.8 },
    boxes: [                                       // [w0, w1, n0, n1, y0, y1]
      { name: 'bett', b: [1.0, 3.1, -0.9, 0.9, 0, 0.55] },
      { name: 'kopfteil', b: [3.05, 3.15, -0.95, 0.95, 0, 1.15] },
      { name: 'nachttisch1', b: [2.75, 3.12, -1.42, -0.95, 0, 0.56] },
      { name: 'nachttisch2', b: [2.75, 3.12, 0.95, 1.42, 0, 0.56] },
      { name: 'schreibtisch', b: [-1.9, -1.15, -0.55, 1.35, 0, 0.75] },
      { name: 'sessel', b: [-1.25, -0.55, -1.6, -0.9, 0, 0.8] },
      { name: 'schrank1', b: [2.6, 3.15, -1.66, -1.0, 0.62, 2.8] },
      { name: 'schrank2', b: [2.6, 3.15, 1.0, 1.57, 0.62, 2.8] },
    ],
    // Ankerpunkte für Gegenstände und Personen (w, n, y)
    anchors: {
      handy: [-1.42, 0.25, 0.752],
      mushaf: [2.93, -1.18, 0.561],
      handyBett: [1.45, -0.5, 0.552],
      tv: { tl: [0.268, 0.432], br: [0.373, 0.551], w: -1.885 },
      kopfAufBett: [2.62, 0.25, 0.72],
      sitz: [0.0, 0.0],
    },
  },
};

export class ProjectedRoom {
  constructor(scene) {
    this.group = new THREE.Group();
    this.group.visible = false;
    scene.add(this.group);
    this.uniforms = {
      map: { value: null },
      center: { value: new THREE.Vector3() },
      rotY: { value: 0 },
      brightness: { value: 1 },
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec3 vWorld;
        void main() {
          vec4 w = modelMatrix * vec4(position, 1.0);
          vWorld = w.xyz;
          gl_Position = projectionMatrix * viewMatrix * w;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D map; uniform vec3 center; uniform float rotY; uniform float brightness;
        varying vec3 vWorld;
        const float PI = 3.141592653589793;
        void main() {
          vec3 d = normalize(vWorld - center);
          float c = cos(rotY), s = sin(rotY);
          d = vec3(c * d.x + s * d.z, d.y, -s * d.x + c * d.z);
          float th = atan(d.x, -d.z);                 // 0 = vorne (-z), positiv = rechts
          float u = th / (2.0 * PI) + 0.5;
          float v = 0.5 - asin(clamp(d.y, -1.0, 1.0)) / PI;
          vec4 col = texture2D(map, vec2(u, 1.0 - v));
          gl_FragColor = vec4(col.rgb * brightness, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.spec = null;
  }

  // (w, n, y) -> lokale Koordinaten der Gruppe
  local(w, n, y = 0) {
    const a = (this.spec.alpha * Math.PI) / 180;
    return new THREE.Vector3(w * Math.cos(a) - n * Math.sin(a), y, w * Math.sin(a) + n * Math.cos(a));
  }
  world(w, n, y = 0) { return this.group.localToWorld(this.local(w, n, y)); }
  // Richtung „zum Kopfende“ in Weltkoordinaten (für das Hinlegen)
  get headDir() { const a = (this.spec.alpha * Math.PI) / 180; return new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); }

  build(name, texture) {
    this.group.clear();
    const S = ROOM_SPEC[name];
    this.spec = S;
    texture.generateMipmaps = false;               // keine Naht am Bildrand
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    this.uniforms.map.value = texture;
    const a = (S.alpha * Math.PI) / 180;
    const addBox = (w0, w1, n0, n1, y0, y1, inside) => {
      const geo = new THREE.BoxGeometry(w1 - w0, y1 - y0, n1 - n0);
      const m = new THREE.Mesh(geo, this.mat);
      m.position.copy(this.local((w0 + w1) / 2, (n0 + n1) / 2, (y0 + y1) / 2));
      m.rotation.y = -a;
      if (inside) m.material = this.mat; // Innenflächen: DoubleSide genügt
      this.group.add(m);
      return m;
    };
    const R = S.room;
    addBox(R.w[0], R.w[1], R.n[0], R.n[1], 0, R.h, true);
    for (const b of S.boxes) addBox(...b.b, false);
    this.anchors = S.anchors;
  }

  // Fotokamera-Position in Weltkoordinaten nachführen (wenn die Gruppe verschoben wurde)
  update() {
    if (!this.spec) return;
    this.uniforms.center.value.copy(this.group.localToWorld(new THREE.Vector3(0, this.spec.camH, 0)));
    this.uniforms.rotY.value = 0;
  }
  // Punkt auf einer Wand (w = const), gesehen im Foto bei (u, v) – für Overlays wie den Fernseher
  onWall(u, v, wPlane) {
    const th = (u - 0.5) * 2 * Math.PI, ph = (0.5 - v) * Math.PI;
    const d = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.sin(ph), -Math.cos(th) * Math.cos(ph));
    const a = (this.spec.alpha * Math.PI) / 180;
    const W = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const t = wPlane / W.dot(d);
    return new THREE.Vector3(0, this.spec.camH, 0).addScaledVector(d, t);
  }
  set brightness(v) { this.uniforms.brightness.value = v; }
  set visible(v) { this.group.visible = v; }
  get visible() { return this.group.visible; }
  // Liegt ein Punkt (Welt) im Raum? Für das Begrenzen des Gehens.
  clampInside(p, margin = 0.25) {
    const l = this.group.worldToLocal(p.clone());
    const a = (this.spec.alpha * Math.PI) / 180;
    let w = l.x * Math.cos(a) + l.z * Math.sin(a), n = -l.x * Math.sin(a) + l.z * Math.cos(a);
    const R = this.spec.room;
    w = Math.min(R.w[1] - margin, Math.max(R.w[0] + margin, w));
    n = Math.min(R.n[1] - margin, Math.max(R.n[0] + margin, n));
    // nicht in Möbel hineinlaufen: aus jedem Möbelrechteck (mit Abstand) zur nächsten Kante schieben
    for (const b of this.spec.boxes) {
      const [w0, w1, n0, n1] = b.b;
      if (w > w0 - margin && w < w1 + margin && n > n0 - margin && n < n1 + margin) {
        const d = [w - (w0 - margin), (w1 + margin) - w, n - (n0 - margin), (n1 + margin) - n];
        const k = d.indexOf(Math.min(...d));
        if (k === 0) w = w0 - margin; else if (k === 1) w = w1 + margin; else if (k === 2) n = n0 - margin; else n = n1 + margin;
      }
    }
    const q = this.world(w, n, 0);
    return new THREE.Vector3(q.x, p.y, q.z);
  }
}

// ======================================================================
// Ein echter Mushaf: Ledereinband mit Goldrahmen, Seitenblock, Staub. Liegt flach.
// ======================================================================
export function buildMushaf() {
  const W = 0.17, L = 0.245, T = 0.048, cov = 0.004;
  const g = new THREE.Group();
  // Einband-Textur
  const c = document.createElement('canvas'); c.width = 340; c.height = 490;
  const x = c.getContext('2d');
  x.fillStyle = '#23402f'; x.fillRect(0, 0, 340, 490);
  for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.05})`; x.fillRect(Math.random() * 340, Math.random() * 490, 2, 2); }
  x.strokeStyle = '#b8995a'; x.lineWidth = 5; x.strokeRect(22, 22, 296, 446);
  x.lineWidth = 2; x.strokeRect(34, 34, 272, 422);
  // Mittelmedaillon (geometrisch, achtzackiger Stern)
  x.save(); x.translate(170, 245); x.fillStyle = '#b8995a';
  for (let k = 0; k < 2; k++) { x.rotate(Math.PI / 4); x.fillRect(-46, -46, 92, 92); }
  x.fillStyle = '#23402f'; x.beginPath(); x.arc(0, 0, 40, 0, Math.PI * 2); x.fill();
  x.strokeStyle = '#b8995a'; x.lineWidth = 2; x.beginPath(); x.arc(0, 0, 34, 0, Math.PI * 2); x.stroke();
  x.fillStyle = '#c9ab6a'; x.font = '600 30px "Noto Naskh Arabic", "Amiri", serif'; x.textAlign = 'center'; x.direction = 'rtl';
  x.fillText('القرآن', 0, 6); x.font = '600 20px "Noto Naskh Arabic", serif'; x.fillText('الكريم', 0, 28);
  x.restore();
  // Eckornamente
  for (const [cx, cy, r] of [[34, 34, 0], [306, 34, 1], [34, 456, 3], [306, 456, 2]]) {
    x.save(); x.translate(cx, cy); x.rotate((r * Math.PI) / 2); x.fillStyle = '#b8995a';
    x.beginPath(); x.moveTo(0, 0); x.lineTo(40, 0); x.quadraticCurveTo(14, 14, 0, 40); x.closePath(); x.fill(); x.restore();
  }
  // Staub: heller Schleier, an den Rändern dichter
  const grd = x.createRadialGradient(170, 245, 60, 170, 245, 300);
  grd.addColorStop(0, 'rgba(200,195,185,0.18)'); grd.addColorStop(1, 'rgba(210,205,195,0.42)');
  x.fillStyle = grd; x.fillRect(0, 0, 340, 490);
  for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(225,220,210,${Math.random() * 0.25})`; x.fillRect(Math.random() * 340, Math.random() * 490, 1 + Math.random() * 2, 1); }
  const coverTex = new THREE.CanvasTexture(c); coverTex.colorSpace = THREE.SRGBColorSpace; coverTex.anisotropy = 4;
  // Seitenschnitt-Textur
  const pc = document.createElement('canvas'); pc.width = 8; pc.height = 128;
  const px = pc.getContext('2d'); px.fillStyle = '#e8dcc2'; px.fillRect(0, 0, 8, 128);
  for (let i = 0; i < 128; i += 2) { px.fillStyle = `rgba(150,130,100,${0.15 + Math.random() * 0.2})`; px.fillRect(0, i, 8, 1); }
  const pageTex = new THREE.CanvasTexture(pc); pageTex.colorSpace = THREE.SRGBColorSpace;
  pageTex.wrapS = pageTex.wrapT = THREE.RepeatWrapping;
  const leather = new THREE.MeshStandardMaterial({ color: 0x2c4a37, roughness: 0.85 });
  const coverTop = new THREE.MeshStandardMaterial({ map: coverTex, roughness: 0.8 });
  const pages = new THREE.MeshStandardMaterial({ map: pageTex, roughness: 0.95 });
  // Deckel unten und oben (oben mit Prägung), Seitenblock dazwischen, Rücken abgerundet
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, cov, L), leather); back.position.y = cov / 2;
  const front = new THREE.Mesh(new THREE.BoxGeometry(W, cov, L), [leather, leather, coverTop, leather, leather, leather]);
  front.position.y = T - cov / 2;
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - 0.008, T - 2 * cov, L - 0.008), pages);
  block.position.set(0.004, T / 2, 0);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(T / 2, T / 2, L, 16, 1, false, Math.PI, Math.PI), leather);
  spine.rotation.x = Math.PI / 2; spine.position.set(-W / 2 + 0.002, T / 2, 0); spine.scale.set(0.35, 1, 1);
  for (const m of [back, front, block, spine]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  g.rotation.y = 0.35;
  return g;
}

// ======================================================================
// Sperrbildschirm des Handys: Uhrzeit und Benachrichtigungen, die nacheinander eintreffen.
// ======================================================================
const NACHRICHTEN = [
  ['Gruppe „Jungs“', 'Heute Abend noch zocken? Bin ab 0 Uhr online'],
  ['Gebetszeiten', 'ʿIschāʾ hat begonnen'],
  ['Video-App', 'Dein Video hat 1.204 neue Aufrufe'],
  ['Mama', 'Ruf mich bitte an, wenn du Zeit hast.'],
  ['Gruppe „Jungs“', '5 neue Nachrichten'],
  ['Verpasster Anruf', 'Mama'],
];
export class PhoneScreen {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 340; this.c.height = 725;
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 4;
    this.list = [];
    this.next = 0;
    this.draw();
  }
  push() {
    if (this.next >= NACHRICHTEN.length) return false;
    this.list.unshift(NACHRICHTEN[this.next++]);
    this.draw();
    return true;
  }
  draw() {
    const x = this.x, W = 340, H = 725;
    const grd = x.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#1c2b46'); grd.addColorStop(1, '#0b1020');
    x.fillStyle = grd; x.fillRect(0, 0, W, H);
    x.fillStyle = '#ffffff'; x.textAlign = 'center';
    x.font = '300 96px system-ui, sans-serif'; x.fillText('23:41', W / 2, 150);
    x.font = '400 22px system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillText('Donnerstag, 26. November', W / 2, 186);
    let y = 230;
    for (const [app, text] of this.list.slice(0, 5)) {
      x.fillStyle = 'rgba(255,255,255,0.16)';
      x.beginPath(); x.roundRect(16, y, W - 32, 82, 18); x.fill();
      x.textAlign = 'left'; x.fillStyle = '#ffffff';
      x.font = '600 19px system-ui, sans-serif'; x.fillText(app, 32, y + 30);
      x.font = '400 18px system-ui, sans-serif'; x.fillStyle = 'rgba(255,255,255,0.88)';
      x.fillText(text.length > 30 ? text.slice(0, 29) + '…' : text, 32, y + 58);
      x.textAlign = 'right'; x.fillStyle = 'rgba(255,255,255,0.6)'; x.font = '400 15px system-ui, sans-serif';
      x.fillText('jetzt', W - 32, y + 30);
      y += 94;
    }
    this.tex.needsUpdate = true;
  }
}

// ======================================================================
// Fernseher: läuft im Hintergrund – nur wechselndes Licht, keine erkennbaren Bilder oder Personen
// ======================================================================
export class TV {
  constructor() {
    this.c = document.createElement('canvas'); this.c.width = 256; this.c.height = 144;
    this.x = this.c.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.c); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, color: 0x000000 });
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry(), this.mat);
    this.light = new THREE.PointLight(0x8aa8ff, 0, 4, 1.5);
    this.group = new THREE.Group();
    this.group.add(this.mesh, this.light);
    this.on = false;
    this.t = 0; this.scene = 0; this.next = 0;
    this.blobs = [];
  }
  // Vier Ecken (lokal im Raum) setzen
  place(tl, tr, bl, br, normal) {
    const g = new THREE.BufferGeometry();
    const off = normal.clone().multiplyScalar(0.012);
    const P = [tl, bl, br, tl, br, tr].map((p) => p.clone().add(off));
    g.setAttribute('position', new THREE.Float32BufferAttribute(P.flatMap((p) => [p.x, p.y, p.z]), 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 1], 2));
    this.mesh.geometry.dispose(); this.mesh.geometry = g;
    const c = tl.clone().add(br).multiplyScalar(0.5);
    this.light.position.copy(c.add(normal.clone().multiplyScalar(0.6)));
  }
  update(dt) {
    if (!this.on) { this.mat.color.setScalar(0.02); this.light.intensity = 0; return; }
    this.t += dt;
    if (this.t > this.next) {               // „Schnitt“ im Film: neue Farbstimmung
      this.next = this.t + 1.5 + Math.random() * 4;
      const hue = Math.random() * 360;
      this.blobs = Array.from({ length: 5 }, () => ({
        x: Math.random() * 256, y: Math.random() * 144, r: 30 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 10,
        col: `hsl(${(hue + Math.random() * 60) % 360},${40 + Math.random() * 40}%,${30 + Math.random() * 40}%)`,
      }));
      this.base = `hsl(${hue},30%,${10 + Math.random() * 20}%)`;
    }
    const x = this.x;
    x.fillStyle = this.base || '#111'; x.fillRect(0, 0, 256, 144);
    for (const b of this.blobs) {
      b.x += b.vx * dt; b.y += b.vy * dt;
      const g = x.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.col); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 256, 144);
    }
    this.tex.needsUpdate = true;
    const flick = 0.85 + 0.15 * Math.sin(this.t * 9) * Math.sin(this.t * 2.3);
    this.mat.color.setScalar(flick);
    this.light.intensity = 0.9 * flick;
  }
}
