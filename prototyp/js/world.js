import * as THREE from 'three';

// Alle 3D-Elemente des Akts. Grundsätze aus dem Drehbuch:
// – Engel nur als Licht ohne Form (G3)
// – Menschen gesichtslos (G9)
// – Was hinter den Toren ist, wird nicht gezeigt (G6/G7)

export const DEFAULT_GRAVE = { hw: 0.55, front: -1.25, back: 0.65, h: 2.0, cover: 0 };

// ---------- Texturen ----------

function earthTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#4b3727';
  g.fillRect(0, 0, 512, 512);
  // weiche Flecken (Feuchtigkeit, Schichten) – nahtlos durch Wiederholung an den Rändern
  for (let i = 0; i < 140; i++) {
    const x = Math.random() * 512, y = Math.random() * 512, r = 20 + Math.random() * 70;
    const dark = Math.random() < 0.5;
    const col = dark ? '30,20,12' : '96,74,52';
    for (const [ox, oy] of [[0, 0], [512, 0], [-512, 0], [0, 512], [0, -512]]) {
      const grd = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r);
      grd.addColorStop(0, `rgba(${col},0.22)`);
      grd.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = grd;
      g.fillRect(x + ox - r, y + oy - r, r * 2, r * 2);
    }
  }
  // feine Körnung
  for (let i = 0; i < 14000; i++) {
    const v = Math.random();
    g.fillStyle = `rgba(${(30 + v * 60) | 0},${(22 + v * 42) | 0},${(14 + v * 26) | 0},${(0.15 + Math.random() * 0.35).toFixed(2)})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 1.5, 1 + Math.random() * 1.5);
  }
  // kleine Steine
  for (let i = 0; i < 45; i++) {
    const s = (70 + Math.random() * 30) | 0;
    g.fillStyle = `rgba(${s + 10},${s},${s - 12},0.5)`;
    g.beginPath();
    g.ellipse(Math.random() * 512, Math.random() * 512, 1.5 + Math.random() * 4, 1 + Math.random() * 3, Math.random() * 3, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = 'rgba(25,16,9,0.5)';
  for (let i = 0; i < 14; i++) {
    g.lineWidth = 1 + Math.random() * 2;
    g.beginPath();
    let x = Math.random() * 512, y = Math.random() * 512;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (Math.random() - 0.5) * 60; y += Math.random() * 40; g.lineTo(x, y); }
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.35, inner.replace(/[\d.]+\)$/, '0.55)'));
  grd.addColorStop(1, outer);
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function verticalGlowTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 128, 0);
  grd.addColorStop(0, 'rgba(255,240,205,0)');
  grd.addColorStop(0.5, 'rgba(255,250,235,1)');
  grd.addColorStop(1, 'rgba(255,240,205,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 256);
  const fade = g.createLinearGradient(0, 0, 0, 256);
  fade.addColorStop(0, 'rgba(0,0,0,0.6)');
  fade.addColorStop(0.2, 'rgba(0,0,0,0)');
  g.globalCompositeOperation = 'destination-out';
  g.fillStyle = fade;
  g.fillRect(0, 0, 128, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ---------- Himmel ----------

export class Sky {
  constructor(scene) {
    this.uniforms = {
      top: { value: new THREE.Color('#9fb3c8') },
      bottom: { value: new THREE.Color('#e4e2dc') },
      opacity: { value: 1 },
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.BackSide,
      depthWrite: false,
      transparent: true,
      fog: false,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 top; uniform vec3 bottom; uniform float opacity;
        varying vec3 vDir;
        void main() {
          float h = smoothstep(-0.1, 0.9, vDir.y);
          gl_FragColor = vec4(mix(bottom, top, h), opacity);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat);
    this.mesh.renderOrder = -10;
    scene.add(this.mesh);
  }
  set(top, bottom) { this.uniforms.top.value.set(top); this.uniforms.bottom.value.set(bottom); }
  get opacity() { return this.uniforms.opacity.value; }
  set opacity(v) { this.uniforms.opacity.value = v; this.mesh.visible = v > 0.001; }
  follow(pos) { this.mesh.position.copy(pos); }
}

// ---------- Gesichtslose Gestalt ----------

export function makeFigure(material, height = 1.72) {
  const g = new THREE.Group();
  const s = height / 1.72;
  const pts = [
    [0.0, 0], [0.17, 0.02], [0.2, 0.5], [0.23, 0.95], [0.25, 1.3], [0.2, 1.42],
    [0.07, 1.47], [0.06, 1.5], [0.0, 1.5],
  ].map(([x, y]) => new THREE.Vector2(x * s, y * s));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), material);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12 * s, 20, 14), material);
  head.position.y = 1.6 * s;
  g.add(body, head);
  return g;
}

// ---------- Das Grab ----------

export class Grave {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.tex = earthTexture();
    this.wallMats = [];
    const mk = () => {
      const m = new THREE.MeshStandardMaterial({
        map: this.tex, roughness: 1, metalness: 0, side: THREE.DoubleSide, transparent: true, color: 0xffffff,
      });
      this.wallMats.push(m);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
      this.group.add(mesh);
      return mesh;
    };
    this.left = mk(); this.right = mk(); this.front = mk(); this.back = mk();
    this.floor = mk(); this.cover = mk();
    this.dims = { ...DEFAULT_GRAVE };
    this.attachments = []; // Objekte, die an Wänden haften: {obj, wall, u, v}
    this.apply();
  }

  reset() {
    Object.assign(this.dims, DEFAULT_GRAVE);
    this.setOpacity(1);
    this.floor.material.color.set(0xffffff);
    this.apply();
  }

  // Wände (und optional den Boden) ein-/ausblenden
  setOpacity(o, includeFloor = true) {
    for (const m of this.wallMats) {
      if (!includeFloor && m === this.floor.material) continue;
      m.opacity = o;
      m.depthWrite = o > 0.98;
    }
    for (const w of [this.left, this.right, this.front, this.back, this.cover]) w.visible = o > 0.001;
    if (includeFloor) this.group.visible = o > 0.001;
    else this.group.visible = true;
  }

  apply() {
    const { hw, front, back, h, cover } = this.dims;
    const len = back - front, cz = (front + back) / 2;
    const rep = (m, a, b) => { /* gleichbleibende Körnung */ m.material.map.repeat.set(1, 1); m.scale.set(a, b, 1); };
    this.left.rotation.set(0, Math.PI / 2, 0); this.left.position.set(-hw, h / 2, cz); rep(this.left, len, h);
    this.right.rotation.set(0, -Math.PI / 2, 0); this.right.position.set(hw, h / 2, cz); rep(this.right, len, h);
    this.front.rotation.set(0, 0, 0); this.front.position.set(0, h / 2, front); rep(this.front, 2 * hw, h);
    this.back.rotation.set(0, Math.PI, 0); this.back.position.set(0, h / 2, back); rep(this.back, 2 * hw, h);
    this.floor.rotation.set(-Math.PI / 2, 0, 0); this.floor.position.set(0, 0, cz); rep(this.floor, 2 * hw, len);
    const covered = Math.max(0.0001, len * cover);
    this.cover.rotation.set(Math.PI / 2, 0, 0);
    this.cover.position.set(0, h, back - covered / 2);
    this.cover.scale.set(2 * hw, covered, 1);
    this.cover.visible = cover > 0.001;
    for (const a of this.attachments) a.update(this.dims);
  }

  // Grab so verschieben, dass der Kopf des Zuschauers in der Mitte der Breite liegt
  centerOn(worldPos) {
    this.group.position.set(worldPos.x, 0, worldPos.z);
  }
}

// ---------- Erdoberfläche mit Graböffnung (für die Beerdigung) ----------

export class Surface {
  constructor(scene, earthTex) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const mat = new THREE.MeshStandardMaterial({ map: earthTex, roughness: 1, color: 0xb9a58c });
    const { hw, front, back, h } = DEFAULT_GRAVE;
    const R = 40;
    const strip = (x0, x1, z0, z1) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), mat);
      m.rotation.x = -Math.PI / 2;
      m.position.set((x0 + x1) / 2, h, (z0 + z1) / 2);
      this.group.add(m);
    };
    strip(-R, -hw, -R, R);
    strip(hw, R, -R, R);
    strip(-hw, hw, -R, front);
    strip(-hw, hw, back, R);

    // Trauergäste am Rand: gesichtslos, gegen den Himmel nur als Schatten
    this.mourners = [];
    const mm = new THREE.MeshBasicMaterial({ color: 0x1b1a18 });
    const spots = [[-1.05, -0.9], [-1.15, 0.05], [1.0, -0.55], [1.1, 0.35], [0.1, -1.85], [-0.45, 1.35], [0.6, 1.4]];
    for (const [x, z] of spots) {
      const f = makeFigure(mm, 1.6 + Math.random() * 0.25);
      f.position.set(x, h, z);
      f.lookAt(0, h, -0.3);
      this.group.add(f);
      this.mourners.push(f);
    }
    this.mournerMat = mm;
  }
  set visible(v) { this.group.visible = v; }
}

// ---------- Fallende Erdklumpen ----------

export class Clods {
  constructor(parent) {
    this.parent = parent;
    this.items = [];
    this.geo = new THREE.DodecahedronGeometry(0.045, 0);
    this.mat = new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 1 });
  }
  spawn(n, dims) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, this.mat);
      const s = 0.6 + Math.random() * 1.4;
      m.scale.setScalar(s);
      // fällt in den noch offenen Teil
      const openFront = dims.front, openBack = dims.back - (dims.back - dims.front) * dims.cover;
      m.position.set((Math.random() - 0.5) * dims.hw * 1.6, dims.h + 0.2 + Math.random() * 0.3,
        openFront + Math.random() * Math.max(0.1, openBack - openFront));
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.4, -0.5 - Math.random(), (Math.random() - 0.5) * 0.4);
      m.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0);
      this.parent.add(m);
      this.items.push(m);
    }
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const m = this.items[i];
      m.userData.v.y -= 9.8 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      if (m.position.y < 0.55) {
        this.parent.remove(m);
        this.items.splice(i, 1);
      }
    }
  }
  clear() { for (const m of this.items) this.parent.remove(m); this.items = []; }
}

// ---------- Die zwei Präsenzen (Weg A: Licht ohne Quelle) ----------

export class LightPresences {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    const tex = radialTexture('rgba(255,248,232,1)');
    this.sprites = [];
    this.lights = [];
    for (const x of [-0.27, 0.27]) {
      const sm = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const s = new THREE.Sprite(sm);
      s.scale.set(0.9, 1.6, 1);
      s.position.set(x, 1.25, -1.0);
      this.group.add(s);
      this.sprites.push(s);
      const l = new THREE.PointLight(0xfff2dc, 0, 4, 2);
      l.position.set(x, 1.25, -0.95);
      this.group.add(l);
      this.lights.push(l);
    }
  }
  set level(v) {
    this.sprites.forEach((s) => { s.material.opacity = 0.55 * v; });
    this.lights.forEach((l) => { l.intensity = 0.9 * v; });
    this.group.visible = v > 0.001;
  }
}

// ---------- Die zwei Präsenzen (Weg B: tiefere Dunkelheit) ----------

export class DarkPresences {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    const tex = radialTexture('rgba(0,0,0,1)', 'rgba(0,0,0,0)');
    this.mats = [];
    for (const x of [-0.25, 0.25]) {
      const m = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, color: 0x000000 });
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.5), m);
      p.position.set(x, 1.2, -1.05);
      this.group.add(p);
      this.mats.push(m);
    }
  }
  set level(v) { this.mats.forEach((m) => { m.opacity = v; }); this.group.visible = v > 0.001; }
}

// ---------- Tor des Lichts (Weg A) – man sieht nicht, was dahinter ist ----------

export class LightGate {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.mat = new THREE.MeshBasicMaterial({ map: verticalGlowTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 4.4), this.mat);
    p.position.y = 2.2;
    this.group.add(p);
    this.haloMat = new THREE.SpriteMaterial({ map: radialTexture('rgba(255,244,214,1)'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    const halo = new THREE.Sprite(this.haloMat);
    halo.scale.set(9, 9, 1);
    halo.position.y = 2.2;
    this.group.add(halo);
    this.light = new THREE.PointLight(0xfff0d0, 0, 30, 1.2);
    this.light.position.set(0, 2, 0.5);
    this.group.add(this.light);
    this.group.position.set(7.5, 0, -6.5);
    this.group.lookAt(0, 0, 0);
  }
  set level(v) {
    this.mat.opacity = v; this.haloMat.opacity = 0.6 * v; this.light.intensity = 25 * v;
    this.group.visible = v > 0.001;
  }
}

// ---------- Öffnung zum Feuer (Weg B) – nur Glut, nichts Erkennbares ----------

export class EmberOpening {
  constructor(grave) {
    this.uniforms = { time: { value: 0 }, level: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */`
        uniform float time; uniform float level; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
        void main() {
          vec2 c = vUv - 0.5;
          float r = length(c * vec2(1.0, 0.8));
          float edge = smoothstep(0.5, 0.15, r);
          float n = noise(vUv * 6.0 + vec2(0.0, -time * 0.9)) * 0.6 + noise(vUv * 13.0 + vec2(time * 0.3, -time * 1.7)) * 0.4;
          vec3 col = mix(vec3(0.35, 0.03, 0.0), vec3(1.0, 0.35, 0.05), n);
          gl_FragColor = vec4(col * edge * level * (0.75 + 0.5 * n), 1.0);
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.7), mat);
    this.light = new THREE.PointLight(0xff5a1a, 0, 3.5, 2);
    grave.group.add(this.mesh, this.light);
    this.mesh.visible = false;
    // haftet an der rechten Wand
    grave.attachments.push({
      update: (d) => {
        this.mesh.position.set(d.hw - 0.015, 0.9, Math.min(-0.2, d.front + 0.6));
        this.mesh.rotation.set(0, -Math.PI / 2, 0);
        this.light.position.set(d.hw - 0.18, 0.9, Math.min(-0.2, d.front + 0.6));
      },
    });
    grave.apply();
    this._level = 0;
  }
  set level(v) { this._level = v; this.mesh.visible = v > 0.001; }
  update(t) {
    this.uniforms.time.value = t;
    this.uniforms.level.value = this._level;
    const flicker = 0.75 + 0.25 * Math.sin(t * 7.3) * Math.sin(t * 3.1 + 1.2) + 0.1 * Math.random();
    this.light.intensity = 3.0 * this._level * flicker;
  }
}

// ---------- Der Gefährte (die Taten) – gesichtslose Silhouette ----------

export class Companion {
  constructor(scene, kind) {
    this.kind = kind;
    this.group = new THREE.Group();
    scene.add(this.group);
    if (kind === 'good') {
      this.mat = new THREE.MeshBasicMaterial({ color: 0xfff1d6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      this.group.add(makeFigure(this.mat, 1.78));
      this.haloMat = new THREE.SpriteMaterial({ map: radialTexture('rgba(255,246,226,1)'), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const halo = new THREE.Sprite(this.haloMat);
      halo.scale.set(2.4, 3.2, 1); halo.position.y = 1.0;
      this.group.add(halo);
    } else {
      this.mat = new THREE.MeshBasicMaterial({ color: 0x040302, transparent: true, opacity: 0 });
      this.group.add(makeFigure(this.mat, 1.78));
      this.rimMat = new THREE.MeshBasicMaterial({ color: 0x5a1405, side: THREE.BackSide, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      const rim = makeFigure(this.rimMat, 1.78);
      rim.scale.set(1.08, 1.02, 1.08);
      this.group.add(rim);
    }
    this.group.visible = false;
  }
  set level(v) {
    this.group.visible = v > 0.001;
    if (this.kind === 'good') { this.mat.opacity = 0.45 * v; this.haloMat.opacity = 0.35 * v; }
    else { this.mat.opacity = v; this.rimMat.opacity = 0.8 * v; }
  }
}

// ---------- Friedhof an der Oberfläche (3B.4) ----------

export class Cemetery {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.group.visible = false;

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x6d6a4c, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2;
    this.group.add(ground);

    const moundMat = new THREE.MeshStandardMaterial({ color: 0x6b5641, roughness: 1 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x9a968c, roughness: 0.9 });
    for (let row = -4; row <= 4; row++) {
      for (let col = -5; col <= 5; col++) {
        if (Math.abs(col) < 1 && Math.abs(row) < 1) continue;
        if (Math.random() < 0.15) continue;
        const x = col * 1.9 + (Math.random() - 0.5) * 0.3;
        const z = row * 2.8 - 2 + (Math.random() - 0.5) * 0.3;
        const mound = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.18, 1.9), moundMat);
        mound.position.set(x, 0.09, z);
        const stone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.5 + Math.random() * 0.25, 0.08), stoneMat);
        stone.position.set(x, 0.3, z - 0.95);
        this.group.add(mound, stone);
      }
    }

    // Bäume mit Vögeln
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3b2c20, roughness: 1 });
    const crownMat = new THREE.MeshStandardMaterial({ color: 0x3f5134, roughness: 1, flatShading: true });
    this.trees = [];
    const treeSpots = [[-7, -9], [6, -11], [-11, -2], [10, -4], [0, -16], [-4, -14], [12, -14]];
    for (const [x, z] of treeSpots) {
      const t = new THREE.Group();
      const h = 4 + Math.random() * 2.5;
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.28, h, 8), trunkMat);
      trunk.position.y = h / 2;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8 + Math.random(), 1), crownMat);
      crown.position.y = h + 0.8;
      t.add(trunk, crown);
      t.position.set(x, 0, z);
      this.group.add(t);
      this.trees.push({ x, z, top: h + 0.8 });
    }

    // Vögel: einfache dunkle V-Formen
    const birdGeo = new THREE.BufferGeometry();
    birdGeo.setAttribute('position', new THREE.Float32BufferAttribute([
      -0.36, 0.08, 0, 0, 0, 0.1, 0, 0, -0.1,
      0.36, 0.08, 0, 0, 0, -0.1, 0, 0, 0.1,
    ], 3));
    birdGeo.computeVertexNormals();
    const birdMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a, side: THREE.DoubleSide });
    this.birds = [];
    for (const tr of this.trees) {
      for (let i = 0; i < 6; i++) {
        const b = new THREE.Mesh(birdGeo, birdMat);
        const a = Math.random() * Math.PI * 2;
        b.position.set(tr.x + Math.cos(a) * 1.5, tr.top + (Math.random() - 0.3) * 1.2, tr.z + Math.sin(a) * 1.5);
        b.userData = { flying: false, v: new THREE.Vector3(), phase: Math.random() * 6, home: b.position.clone() };
        this.group.add(b);
        this.birds.push(b);
      }
    }

    // Ein Mensch geht zwischen den Gräbern entlang – er hört nichts
    this.walkerMat = new THREE.MeshStandardMaterial({ color: 0x2d2b28, roughness: 1 });
    this.walker = makeFigure(this.walkerMat, 1.75);
    this.walker.position.set(-9, 0, -5.2);
    this.walker.rotation.y = Math.PI / 2;
    this.group.add(this.walker);
    this.walking = false;
  }

  reset() {
    for (const b of this.birds) { b.userData.flying = false; b.position.copy(b.userData.home); b.scale.set(1, 1, 1); }
    this.walker.position.x = -9;
  }

  scatter(sound) {
    for (const b of this.birds) {
      b.userData.flying = true;
      const away = new THREE.Vector3(b.position.x, 0, b.position.z).normalize();
      b.userData.v.set(away.x * (2 + Math.random() * 3), 3 + Math.random() * 3, away.z * (2 + Math.random() * 3));
      b.lookAt(b.position.clone().add(b.userData.v));
    }
    if (sound) for (const t of this.trees) sound.flutter(t.x, t.top, t.z, 2.5);
  }

  update(dt, t) {
    if (!this.group.visible) return;
    for (const b of this.birds) {
      if (b.userData.flying) {
        b.position.addScaledVector(b.userData.v, dt);
        b.userData.v.y += 0.4 * dt;
        b.scale.y = 0.4 + Math.abs(Math.sin(t * 18 + b.userData.phase)) * 1.6;
      }
    }
    if (this.walking) this.walker.position.x += dt * 0.65;
  }
}
