import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

// Splat-Test: lädt eine Gaussian-Splat-Welt und misst die Bildrate – am Bildschirm und in der Quest.
// Hinweise aus der Spark-Dokumentation: antialias aus (bringt bei Splats nichts und vermeidet
// einen bekannten Hänger der Quest bei MSAA), keine Schatten.

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
renderer.xr.setFoveation(1);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0b0a);
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.02, 500);
camera.position.set(0, 1.6, 0);
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

const spark = new SparkRenderer({ renderer });
scene.add(spark);

const world = new THREE.Group();
scene.add(world);
let splat = null;
let splatCount = 0;

// ---------- HUD (in VR als Tafel vor dem linken Auge unten, am Bildschirm als Text) ----------
const hudEl = document.getElementById('hud');
const hudCanvas = document.createElement('canvas');
hudCanvas.width = 512; hudCanvas.height = 160;
const hudCtx = hudCanvas.getContext('2d');
const hudTex = new THREE.CanvasTexture(hudCanvas);
hudTex.colorSpace = THREE.SRGBColorSpace;
const hudMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.1),
  new THREE.MeshBasicMaterial({ map: hudTex, transparent: true, depthTest: false, depthWrite: false }));
hudMesh.renderOrder = 1000;
hudMesh.position.set(-0.18, -0.2, -0.6);
hudMesh.visible = false;
camera.add(hudMesh);

function drawHud(lines) {
  hudEl.textContent = lines.join('\n');
  hudCtx.clearRect(0, 0, 512, 160);
  hudCtx.fillStyle = 'rgba(0,0,0,0.6)';
  hudCtx.fillRect(0, 0, 512, 160);
  hudCtx.fillStyle = '#efe6d2';
  hudCtx.font = '30px ui-monospace, Menlo, monospace';
  lines.forEach((l, i) => hudCtx.fillText(l, 18, 44 + i * 40));
  hudTex.needsUpdate = true;
}

// ---------- Generierte Testwelt: Erdboden, Grabhügel, Steine, Bäume, Staub ----------
function makeTestWorld(total) {
  const c = new THREE.Vector3(), s = new THREE.Vector3(), q = new THREE.Quaternion(), col = new THREE.Color();
  const rnd = Math.random;
  return new SplatMesh({
    constructSplats: (splats) => {
      const nGround = Math.floor(total * 0.55);
      const nMounds = Math.floor(total * 0.2);
      const nTrees = Math.floor(total * 0.15);
      const nDust = total - nGround - nMounds - nTrees;
      // Boden
      for (let i = 0; i < nGround; i++) {
        const r = Math.sqrt(rnd()) * 25, a = rnd() * Math.PI * 2;
        const x = Math.cos(a) * r, z = Math.sin(a) * r;
        c.set(x, Math.sin(x * 0.3) * 0.05 + Math.cos(z * 0.4) * 0.05, z);
        const k = 0.03 + rnd() * 0.05;
        s.set(k, 0.006, k);
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rnd() * Math.PI);
        const g = rnd();
        col.setRGB(0.32 + g * 0.18, 0.25 + g * 0.12, 0.15 + g * 0.08);
        splats.pushSplat(c, s, q, 0.9, col);
      }
      // Grabhügel in Reihen
      const mounds = [];
      for (let row = -3; row <= 3; row++) for (let k = -4; k <= 4; k++) {
        if (row === 0 && Math.abs(k) < 1) continue;
        mounds.push([k * 2.0, row * 3.0 - 4]);
      }
      for (let i = 0; i < nMounds; i++) {
        const [mx, mz] = mounds[i % mounds.length];
        const u = rnd() - 0.5, v = rnd() - 0.5;
        const h = 0.25 * Math.cos(u * Math.PI) * Math.cos(v * Math.PI);
        c.set(mx + u * 0.9, h, mz + v * 2.0);
        s.set(0.025, 0.012, 0.025);
        q.identity();
        const g = rnd();
        col.setRGB(0.36 + g * 0.12, 0.27 + g * 0.08, 0.17 + g * 0.06);
        splats.pushSplat(c, s, q, 0.95, col);
      }
      // Bäume (Stamm + Krone)
      const trees = [[-7, -9], [6, -11], [-11, -2], [10, -4], [0, -16], [-5, -14], [12, -14], [-14, -10]];
      for (let i = 0; i < nTrees; i++) {
        const [tx, tz] = trees[i % trees.length];
        if (rnd() < 0.2) {
          const y = rnd() * 4.2;
          c.set(tx + (rnd() - 0.5) * 0.35, y, tz + (rnd() - 0.5) * 0.35);
          s.set(0.04, 0.08, 0.04);
          col.setRGB(0.22, 0.16, 0.11);
        } else {
          const dir = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
          c.set(tx, 5.2, tz).addScaledVector(dir, 1.6 + rnd() * 0.6);
          s.set(0.07, 0.05, 0.07);
          const g = rnd();
          col.setRGB(0.18 + g * 0.1, 0.3 + g * 0.12, 0.14 + g * 0.06);
        }
        q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rnd() * Math.PI);
        splats.pushSplat(c, s, q, 0.9, col);
      }
      // Staub in der Luft (Licht)
      for (let i = 0; i < nDust; i++) {
        c.set((rnd() - 0.5) * 30, rnd() * 6, (rnd() - 0.5) * 30);
        s.setScalar(0.004 + rnd() * 0.006);
        q.identity();
        col.setRGB(1.0, 0.94, 0.8);
        splats.pushSplat(c, s, q, 0.35, col);
      }
    },
  });
}

// ---------- Laden ----------
async function loadWorld() {
  const src = document.querySelector('input[name=src]:checked').value;
  const status = document.getElementById('status');
  if (splat) { world.remove(splat); splat.dispose?.(); splat = null; }
  world.rotation.set(0, 0, 0);
  if (src === 'gen') {
    splatCount = Number(document.getElementById('count').value);
    status.textContent = 'Erzeuge Testwelt …';
    await new Promise((r) => setTimeout(r, 30));
    splat = makeTestWorld(splatCount);
  } else if (src === 'file') {
    const f = document.getElementById('file').files[0];
    if (!f) throw new Error('Bitte zuerst eine Datei auswählen.');
    status.textContent = `Lade ${f.name} (${(f.size / 1e6).toFixed(1)} MB) …`;
    const bytes = new Uint8Array(await f.arrayBuffer());
    splat = new SplatMesh({ fileBytes: bytes, fileName: f.name });
  } else {
    const url = document.getElementById('url').value.trim();
    if (!/^https:\/\//.test(url)) throw new Error('Bitte eine https-Adresse eingeben.');
    status.textContent = 'Lade Welt aus dem Netz …';
    splat = new SplatMesh({ url });
  }
  world.add(splat);
  await splat.initialized;
  const n = splat.packedSplats?.numSplats;
  if (typeof n === 'number' && n > 0) splatCount = n;
  // Scans aus vielen Apps stehen kopfüber (y nach unten) – Spark-Beispiele drehen sie um 180° um X.
  if (src !== 'gen') world.rotation.x = Math.PI;
  status.textContent = `Geladen: ${splatCount.toLocaleString('de-DE')} Punkte.`;
}

// ---------- Bewegung ----------
let yaw = 0, pitch = 0;
const keys = new Set();
const tmpV = new THREE.Vector3();
let snapReady = true, btnLatch = {};

function resetPosition() { rig.position.set(0, 0, 0); rig.rotation.set(0, 0, 0); yaw = 0; pitch = 0; }
function flipWorld() { world.rotation.x = world.rotation.x === 0 ? Math.PI : 0; }

function updateXrInput(dt) {
  const session = renderer.xr.getSession();
  if (!session) return;
  for (const src of session.inputSources) {
    const gp = src.gamepad;
    if (!gp) continue;
    const ax = gp.axes.length >= 4 ? [gp.axes[2], gp.axes[3]] : [gp.axes[0] || 0, gp.axes[1] || 0];
    if (src.handedness === 'left') {
      // Gehen in Blickrichtung (nur horizontal)
      const e = camera.matrixWorld.elements;
      const fwd = tmpV.set(-e[8], 0, -e[10]).normalize();
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const dead = (v) => Math.abs(v) < 0.15 ? 0 : v;
      rig.position.addScaledVector(fwd, -dead(ax[1]) * 1.4 * dt);
      rig.position.addScaledVector(right, dead(ax[0]) * 1.4 * dt);
    } else if (src.handedness === 'right') {
      if (Math.abs(ax[0]) > 0.7 && snapReady) {
        rig.rotateY(-Math.sign(ax[0]) * Math.PI / 6);
        snapReady = false;
      } else if (Math.abs(ax[0]) < 0.3) snapReady = true;
      if (Math.abs(ax[1]) > 0.3) rig.position.y -= ax[1] * 0.8 * dt;
    }
    // Tasten: 4 = A/X, 5 = B/Y
    const key = src.handedness;
    const a = gp.buttons[4]?.pressed, b = gp.buttons[5]?.pressed;
    if (a && !btnLatch[key + 'a']) flipWorld();
    if (b && !btnLatch[key + 'b']) resetPosition();
    btnLatch[key + 'a'] = a; btnLatch[key + 'b'] = b;
  }
}

function updateDesktop(dt) {
  camera.rotation.set(pitch, yaw, 0, 'YXZ');
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
  const r = new THREE.Vector3(-f.z, 0, f.x);
  const sp = 2.0 * dt;
  if (keys.has('KeyW')) camera.position.addScaledVector(f, sp);
  if (keys.has('KeyS')) camera.position.addScaledVector(f, -sp);
  if (keys.has('KeyD')) camera.position.addScaledVector(r, sp);
  if (keys.has('KeyA')) camera.position.addScaledVector(r, -sp);
  if (keys.has('KeyE')) camera.position.y += sp;
  if (keys.has('KeyQ')) camera.position.y -= sp;
}

let dragging = false, lx = 0, ly = 0;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
window.addEventListener('pointerup', () => { dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging || renderer.xr.isPresenting) return;
  yaw -= (e.clientX - lx) * 0.004; pitch -= (e.clientY - ly) * 0.004;
  pitch = Math.max(-1.5, Math.min(1.5, pitch));
  lx = e.clientX; ly = e.clientY;
});
window.addEventListener('keydown', (e) => {
  keys.add(e.code);
  if (e.code === 'KeyF') flipWorld();
  if (e.code === 'KeyR') { resetPosition(); camera.position.set(0, 1.6, 0); }
});
window.addEventListener('keyup', (e) => keys.delete(e.code));
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Bildrate messen ----------
let frames = 0, acc = 0, worst = 0, fps = 0, lastHud = 0;
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  frames++; acc += dt; worst = Math.max(worst, dt);
  if (acc >= 1) {
    fps = frames / acc;
    const lines = [
      `${fps.toFixed(0)} Bilder/s   (langsamstes: ${(worst * 1000).toFixed(0)} ms)`,
      `${splatCount.toLocaleString('de-DE')} Punkte`,
      renderer.xr.isPresenting ? 'VR aktiv' : 'Bildschirm',
    ];
    if (splat) drawHud(lines);
    frames = 0; acc = 0; worst = 0;
  }
  if (renderer.xr.isPresenting) updateXrInput(Math.min(dt, 0.1));
  else updateDesktop(Math.min(dt, 0.1));
  renderer.render(scene, camera);
});

// ---------- Start ----------
const overlay = document.getElementById('overlay');
const btnVR = document.getElementById('btn-vr');
const btnDesk = document.getElementById('btn-desk');
const status = document.getElementById('status');

async function start(vr) {
  btnVR.disabled = true; btnDesk.disabled = true;
  try {
    if (vr) {
      // Die Sitzung muss direkt aus dem Klick heraus angefragt werden, deshalb zuerst die Sitzung, dann laden.
      const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'hand-tracking'] });
      session.addEventListener('end', () => location.reload());
      await renderer.xr.setSession(session);
      hudMesh.visible = true;
      drawHud(['Lade Welt …']);
    }
    await loadWorld();
    overlay.classList.add('hidden');
    hudEl.style.display = vr ? 'none' : 'block';
  } catch (err) {
    status.textContent = 'Fehler: ' + (err && err.message || err);
    if (renderer.xr.isPresenting) renderer.xr.getSession().end();
    btnDesk.disabled = false;
    btnVR.disabled = !(await xrSupported());
  }
}

async function xrSupported() {
  return !!(navigator.xr && await navigator.xr.isSessionSupported('immersive-vr').catch(() => false));
}

btnDesk.addEventListener('click', () => start(false));
btnVR.addEventListener('click', () => start(true));
document.getElementById('file').addEventListener('change', () => { document.querySelector('input[value=file]').checked = true; });
document.getElementById('url').addEventListener('input', () => { document.querySelector('input[value=url]').checked = true; });

(async () => {
  if (await xrSupported()) { btnVR.disabled = false; status.textContent = 'VR bereit.'; }
  else if (!window.isSecureContext) status.textContent = 'VR benötigt eine HTTPS-Adresse.';
  else status.textContent = 'Kein VR-Headset erkannt – Test am Bildschirm möglich.';
})();

window.__splatTest = { get fps() { return fps; }, get count() { return splatCount; } };
