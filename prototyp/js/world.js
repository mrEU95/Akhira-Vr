import * as THREE from 'three';

// Alle 3D-Elemente des Akts. Grundsätze aus dem Drehbuch:
// – Engel nur als Licht ohne Form (G3)
// – Menschen gesichtslos (G9)
// – Was hinter den Toren ist, wird nicht gezeigt (G6/G7)


// ---------- Texturen ----------

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

// ---------- Materialien (PBR-Texturen aus tools/make_textures.py) ----------

const texLoader = new THREE.TextureLoader();
const texCache = {};
// Liefert eine eigene Kopie der Textur (eigenes repeat). Kopien, die vor dem Laden entstehen,
// werden nach dem Laden aktualisiert – sonst blieben sie leer.
function tex(name, srgb) {
  let e = texCache[name];
  if (!e) {
    e = texCache[name] = { base: null, copies: [], loaded: false };
    e.base = texLoader.load('textures/' + name + '.jpg', () => {
      e.loaded = true;
      for (const c of e.copies) c.needsUpdate = true;
      e.copies = [];
    });
    e.base.wrapS = e.base.wrapT = THREE.RepeatWrapping;
    e.base.anisotropy = 4;
    if (srgb) e.base.colorSpace = THREE.SRGBColorSpace;
  }
  const c = e.base.clone();
  if (!e.loaded) { c.version = 0; e.copies.push(c); } // erst nach dem Laden hochladen
  return c;
}

// Eigenes Material je Fläche, damit die Körnung zur Flächengröße passt (repeat je Fläche)
const TILE = { labin: 0.55, wood: 1.6, carpet: [5.6, 1.25], plaster: 2.0 }; // Meter pro Kachel (x, y)
export function pbrMaterial(kind, opts = {}) {
  const { tile, ...rest } = opts;
  const maps = {
    map: tex(kind + '_color', true),
    normalMap: tex(kind + '_normal', false),
  };
  if (kind !== 'grass') maps.roughnessMap = tex(kind + '_rough', false);
  const m = new THREE.MeshStandardMaterial({
    ...maps, roughness: 1, metalness: 0, side: THREE.DoubleSide,
    normalScale: new THREE.Vector2(1.2, 1.2), ...rest,
  });
  m.userData.tile = tile || TILE[kind] || 1.1;
  return m;
}
export function setRepeat(m, w, h) {
  const t = m.userData.tile || 1;
  const tx = Array.isArray(t) ? t[0] : t, ty = Array.isArray(t) ? t[1] : t;
  for (const k of ['map', 'normalMap', 'roughnessMap']) if (m[k]) m[k].repeat.set(Math.max(0.05, w / tx), Math.max(0.05, h / ty));
}

// Standardmaße der Lahd (Nische) relativ zum Kopf; h/eye werden in fit() an die Kopfhöhe angepasst
export const DEFAULT_GRAVE = { hw: 0.6, front: -0.62, back: 0.38, h: 1.65, eye: 1.15, cover: 1 };
const COLS = 5, ROWS = 3; // Lehmziegel: 5 nebeneinander, 3 übereinander

// ---------- Das Grab: die Lahd-Nische, vorne mit Lehmziegeln (Labin) verschlossen ----------
// Muslim 966: „Macht mir eine Lahd und stellt Lehmziegel vor mich auf, wie es beim Gesandten Allahs ﷺ gemacht wurde.“

export class Grave {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.wallMats = [];
    const mk = (kind) => {
      const m = pbrMaterial(kind, { transparent: true });
      this.wallMats.push(m);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
      mesh.receiveShadow = true; mesh.castShadow = true;
      this.group.add(mesh);
      return mesh;
    };
    this.left = mk('soil'); this.right = mk('soil'); this.back = mk('soil');
    this.floor = mk('soil'); this.cover = mk('soil');
    this.front = mk('soil'); this.front.visible = false; // vorne stehen die Ziegel

    // Lehmziegel – je Ziegel: placed 0 (noch nicht da) … 1 (steht), gap = Fuge in Metern
    this.slabMat = pbrMaterial('labin', { transparent: true });
    this.wallMats.push(this.slabMat);
    this.slabs = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.slabMat);
      s.castShadow = true; s.receiveShadow = true;
      s.userData = { placed: 1, row: r, col: c, tilt: (Math.random() - 0.5) * 0.05, dz: (Math.random() - 0.5) * 0.012 };
      this.group.add(s);
      this.slabs.push(s);
    }
    this.gap = 0.012;
    this.base = { ...DEFAULT_GRAVE };
    this.dims = { ...DEFAULT_GRAVE };
    this.attachments = [];
    this.apply();
  }

  // An den Kopf des Zuschauers anpassen: Kopf mittig, Decke eine Handbreit über dem Kopf
  fit(headPos) {
    this.group.position.set(headPos.x, 0, headPos.z);
    const eye = Math.max(0.9, Math.min(headPos.y, 1.9));
    this.base = { ...DEFAULT_GRAVE, eye, h: eye + 0.5 };
    this.reset();
  }

  reset() {
    Object.assign(this.dims, this.base);
    this.gap = 0.0;
    this.slabs.forEach((s) => { s.userData.placed = 1; });
    this.setOpacity(1);
    this.apply();
  }

  setOpacity(o, includeFloor = true) {
    for (const m of this.wallMats) {
      if (!includeFloor && m === this.floor.material) continue;
      m.opacity = o;
      m.transparent = o < 0.999;
      m.depthWrite = o > 0.98;
    }
    for (const w of [this.left, this.right, this.back, this.cover, ...this.slabs]) w.visible = o > 0.001;
    this.group.visible = includeFloor ? o > 0.001 : true;
  }

  apply() {
    const { hw, front, back, h } = this.dims;
    const len = back - front, cz = (front + back) / 2;
    const put = (m, w, hh) => { m.scale.set(w, hh, 1); setRepeat(m.material, w, hh); };
    this.left.rotation.set(0, Math.PI / 2, 0); this.left.position.set(-hw, h / 2, cz); put(this.left, len, h);
    this.right.rotation.set(0, -Math.PI / 2, 0); this.right.position.set(hw, h / 2, cz); put(this.right, len, h);
    this.back.rotation.set(0, Math.PI, 0); this.back.position.set(0, h / 2, back); put(this.back, 2 * hw, h);
    this.floor.rotation.set(-Math.PI / 2, 0, 0); this.floor.position.set(0, 0, cz); put(this.floor, 2 * hw, len);
    this.cover.rotation.set(Math.PI / 2, 0, 0); this.cover.position.set(0, h, cz); put(this.cover, 2 * hw, len);
    this.cover.visible = this.left.visible;

    // Ziegelwand: hochkant gestellte Lehmziegel vor der Öffnung
    const sw = (2 * hw) / COLS, rh = (h + 0.02) / ROWS;
    const th = Math.min(0.11, sw * 0.45);
    setRepeat(this.slabMat, sw, rh);
    const g = this.gap;
    this.slabs.forEach((s) => {
      const { row, col, tilt, dz } = s.userData;
      const p = s.userData.placed;
      s.visible = p > 0.001 && this.left.visible;
      const fx = -hw + sw * (col + 0.5), fy = rh * (row + 0.5), fz = front - th / 2 + dz;
      // Anfangslage: über dem Graben, gekippt – wird herabgereicht und eingesetzt
      const k = 1 - p;
      s.position.set(fx + k * 0.15, fy + k * 1.5, fz - k * 0.4);
      s.rotation.set(-k * 0.5 + tilt * 0.4, k * 0.3, tilt * (0.3 + g * 30));
      s.scale.set(sw - 0.006 - g, rh - 0.006 - g * 0.5, th);
    });
    for (const a of this.attachments) a.update(this.dims);
  }
}

// ---------- Der Graben vor der Nische, die Oberfläche und die Trauergäste (nur bei der Bestattung) ----------

export class Lahd {
  constructor(grave) {
    this.grave = grave;
    this.group = new THREE.Group();
    grave.group.add(this.group);
    this.group.visible = false;
    this.soil = [];
  }

  // Baut die Umgebung passend zu den aktuellen Maßen der Nische
  build() {
    this.group.clear();
    const d = this.grave.dims;
    const TW = 0.85, X = 1.35, D = 2.15;   // Grabenbreite, halbe Länge, Tiefe
    const f = d.front;
    this.depth = D;
    const plane = (kind, w, h, pos, rotY, rotX = 0) => {
      const m = pbrMaterial(kind);
      setRepeat(m, w, h);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
      p.position.copy(pos); p.rotation.set(rotX, rotY, 0, 'YXZ');
      p.receiveShadow = true; p.castShadow = true;
      this.group.add(p);
      return p;
    };
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    // Graben: Boden, gegenüberliegende Wand, Stirnwände
    plane('soil', 2 * X, TW, V(0, 0.002, f - TW / 2), 0, -Math.PI / 2);
    plane('soil', 2 * X, D, V(0, D / 2, f - TW), 0);
    plane('soil', TW, D, V(-X, D / 2, f - TW / 2), Math.PI / 2);
    plane('soil', TW, D, V(X, D / 2, f - TW / 2), -Math.PI / 2);
    // Wand über und neben der Nischenöffnung (zum Graben hin)
    plane('soil', 2 * d.hw, D - d.h, V(0, d.h + (D - d.h) / 2, f), Math.PI);
    plane('soil', X - d.hw, D, V(-(X + d.hw) / 2, D / 2, f), Math.PI);
    plane('soil', X - d.hw, D, V((X + d.hw) / 2, D / 2, f), Math.PI);
    // Oberfläche mit Grabenöffnung
    const R = 30;
    const strip = (x0, x1, z0, z1) => plane('grass', x1 - x0, z1 - z0, V((x0 + x1) / 2, D, (z0 + z1) / 2), 0, -Math.PI / 2);
    strip(-R, -X, -R, R); strip(X, R, -R, R);
    strip(-X, X, -R, f - TW); strip(-X, X, f, R);
    // Aufgeworfene Erde am Rand (Aushub)
    const pileMat = pbrMaterial('soil');
    setRepeat(pileMat, 2, 1);
    for (const [x, z, sx] of [[0, f - TW - 0.9, 2.6], [-X - 0.9, f - 0.4, 1.0]]) {
      const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), pileMat);
      pile.scale.set(sx, 0.45, 0.6);
      pile.position.set(x, D, z);
      pile.castShadow = true; pile.receiveShadow = true;
      this.group.add(pile);
    }
    // Trauergäste: gesichtslos (G12), dunkle Gewänder
    const robe = new THREE.MeshStandardMaterial({ color: 0x2a2724, roughness: 1 });
    const white = new THREE.MeshStandardMaterial({ color: 0xcfc9bd, roughness: 1 });
    const spots = [[-0.85, f - TW - 0.3], [-0.1, f - TW - 0.35], [0.7, f - TW - 0.3], [-X - 0.35, f - 0.35], [X + 0.35, f - 0.5], [1.0, f - TW - 1.1], [-0.6, f - TW - 1.2]];
    spots.forEach(([x, z], i) => {
      const fig = makeFigure(i % 3 === 1 ? white : robe, 1.62 + Math.random() * 0.22);
      fig.position.set(x, D, z);
      fig.lookAt(this.group.position.x + 0, D, f - TW / 2 + 0.2);
      fig.traverse((o) => { o.castShadow = true; });
      this.group.add(fig);
    });
  }

  set visible(v) { this.group.visible = v; }
}

// ---------- Staub, der durch die Fugen rieselt / Erdkrumen ----------

export class Clods {
  constructor(parent) {
    this.parent = parent;
    this.items = [];
    this.geo = new THREE.DodecahedronGeometry(1, 0);
    this.mat = new THREE.MeshStandardMaterial({ color: 0x6b5440, roughness: 1 });
  }
  // Feine Krumen an der Oberkante der Ziegel (innen in der Nische)
  dust(n, dims) {
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, this.mat);
      m.scale.setScalar(0.003 + Math.random() * 0.006);
      m.position.set((Math.random() - 0.5) * dims.hw * 1.8, dims.h - 0.02, dims.front + 0.02 + Math.random() * 0.05);
      m.userData.v = new THREE.Vector3((Math.random() - 0.5) * 0.05, -Math.random() * 0.3, 0.05 + Math.random() * 0.1);
      m.userData.spin = new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0);
      this.parent.add(m);
      this.items.push(m);
    }
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const m = this.items[i];
      m.userData.v.y -= 6 * dt;
      m.position.addScaledVector(m.userData.v, dt);
      m.rotation.x += m.userData.spin.x * dt;
      m.rotation.y += m.userData.spin.y * dt;
      if (m.position.y < 0.01) { this.parent.remove(m); this.items.splice(i, 1); }
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
      s.scale.set(0.45, 0.8, 1);
      s.position.set(x * 0.8, 1.15, -0.5);
      this.group.add(s);
      this.sprites.push(s);
      const l = new THREE.PointLight(0xfff2dc, 0, 3, 2);
      l.position.set(x * 0.8, 1.15, -0.45);
      this.group.add(l);
      this.lights.push(l);
    }
  }
  place(dims) {
    this.sprites.forEach((s) => { s.position.y = dims.eye; s.position.z = dims.front + 0.14; });
    this.lights.forEach((l) => { l.position.y = dims.eye; l.position.z = dims.front + 0.18; });
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
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.85), m);
      p.position.set(x * 0.8, 1.15, -0.55);
      this.group.add(p);
      this.mats.push(m);
    }
  }
  place(dims) { this.group.children.forEach((p) => { p.position.y = dims.eye; p.position.z = dims.front + 0.06; }); }
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
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.5), mat);
    this.light = new THREE.PointLight(0xff5a1a, 0, 3.5, 2);
    grave.group.add(this.mesh, this.light);
    this.mesh.visible = false;
    // haftet an der rechten Wand
    grave.attachments.push({
      update: (d) => {
        const z = (d.front + d.back) / 2 - 0.05, y = (d.eye || 1.15) - 0.25;
        this.mesh.position.set(d.hw - 0.015, y, z);
        this.mesh.rotation.set(0, -Math.PI / 2, 0);
        this.light.position.set(d.hw - 0.15, y, z);
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

    const gm = pbrMaterial('grass', { side: THREE.FrontSide });
    setRepeat(gm, 200, 200);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), gm);
    ground.rotation.x = -Math.PI / 2;
    this.group.add(ground);

    const moundMat = pbrMaterial('soil', { side: THREE.FrontSide });
    setRepeat(moundMat, 1, 1);
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

  // Fotomodus: ein 360°-Foto zeigt den Friedhof, nur die Vögel bleiben (sie fliegen auf)
  setPhotoMode(on) { this.group.children.forEach((c) => { c.visible = !on || this.birds.includes(c); }); }

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
