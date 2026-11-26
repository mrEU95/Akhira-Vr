import * as THREE from 'three';
import { Sound } from './audio.js';
import { TextPanel } from './textpanel.js';
import { TX } from './texte.js';
import {
  Sky, Grave, Lahd, Clods, LightPresences, DarkPresences, LightGate, EmberOpening,
  Companion, Cemetery,
} from './world.js';
import { Room, Mosque, Veil, DescendingLights, Panorama, PANORAMEN, ProjectedRoom } from './scenes-life.js';

// ======================================================================
// Grundgerüst
// ======================================================================

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
renderer.xr.setReferenceSpaceType('local-floor');
// Schärfer in der Quest: höhere Auflösung, weniger Unschärfe am Rand
renderer.xr.setFramebufferScaleFactor(1.3);
renderer.xr.setFoveation(0.35);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.02, 600);
camera.position.set(0, 1.15, 0); // Sitzhöhe am Bildschirm; in VR übernimmt das Headset
const rig = new THREE.Group();
rig.add(camera);
scene.add(rig);

// Licht
const hemi = new THREE.HemisphereLight(0xdfe6ee, 0x3a2a1c, 0);
scene.add(hemi);
const residual = new THREE.PointLight(0x9aa6b4, 0, 2.6, 2); // Restschimmer an den Erdwänden
camera.add(residual);
const sun = new THREE.DirectionalLight(0xfff4e2, 0);
sun.position.set(-20, 30, 10);
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.02;
Object.assign(sun.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 30 });
scene.add(sun, sun.target);
// Licht, das durch die Öffnung der Nische fällt (vom hellen Graben zurückgeworfen)
const bounce = new THREE.PointLight(0xe9e0d0, 0, 2.2, 2);
scene.add(bounce);

// Welt
const sky = new Sky(scene);
const grave = new Grave(scene);
const lahd = new Lahd(grave);
const clods = new Clods(grave.group);
const lightPresences = new LightPresences(grave.group);
const darkPresences = new DarkPresences(grave.group);
const gate = new LightGate(scene);
const ember = new EmberOpening(grave);
const companionA = new Companion(scene, 'good');
const companionB = new Companion(scene, 'bad');
const cemetery = new Cemetery(scene);
const panel = new TextPanel(scene);
const room = new Room(scene);
const mosque = new Mosque(scene);
const veil = new Veil(camera);
const descLights = new DescendingLights(scene);
const pano = new Panorama(scene);
const proom = new ProjectedRoom(scene);   // echter Raum aus dem 360°-Foto (mit Tiefe)
let allowWalk = false;                    // Gehen mit dem Stick (nur im Zimmer)
// Zimmerlicht – dimmt im Fotomodus auch das 360°-Foto
function roomLamp(level, warm = 0) {
  room.setLamp(level, warm);
  if (pano.mesh.visible) pano.brightness = Math.max(0.2, Math.min(1, level));
  if (proom.visible) proom.brightness = Math.max(0.15, Math.min(1, level));
}
let veilBase = 0;     // Grundtrübung des Schleiers
let veilPulse = 0;    // 0..1: ab und zu kurz klar (Kampf gegen das Wegdämmern)
let phoneOn = false, nextBuzz = 0, phoneFlash = 0;

// Heller, weicher Boden für die Weite des Grabes (Weg A)
const softFloorMat = new THREE.MeshStandardMaterial({ color: 0xf0e4c9, roughness: 1, transparent: true, opacity: 0 });
const softFloor = new THREE.Mesh(new THREE.CircleGeometry(150, 48), softFloorMat);
softFloor.rotation.x = -Math.PI / 2;
softFloor.position.y = 0.003;
softFloor.visible = false;
scene.add(softFloor);
const sound = new Sound();

// Blende vor den Augen (schwarz / grau / weiß)
const fadeMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 1, side: THREE.BackSide, depthTest: false, depthWrite: false, fog: false });
const fadeMesh = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 12), fadeMat);
fadeMesh.renderOrder = 999;
camera.add(fadeMesh);

// ======================================================================
// Zeitsteuerung (Promise-basiert, läuft im Render-Loop – auch in VR)
// ======================================================================

let now = 0;
const waits = [];
const tweens = [];
let holdSkip = false;   // Seitentaste / Taste K gehalten
let ttsEnabled = false;

function wait(sec, skippable = false) {
  return new Promise((res) => waits.push({ until: now + sec, res, skippable }));
}
function skipText() {
  for (const w of waits) if (w.skippable) w.until = now;
  if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
}
const ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
function tween(sec, fn, e = ease) {
  return new Promise((res) => tweens.push({ start: now, dur: Math.max(0.001, sec), fn, res, e }));
}
function lerp(a, b, t) { return a + (b - a) * t; }

function fadeTo(color, opacity, sec) {
  const c0 = fadeMat.color.clone();
  const c1 = new THREE.Color(color);
  const o0 = fadeMat.opacity;
  return tween(sec, (t) => {
    fadeMat.color.copy(c0).lerp(c1, t);
    fadeMat.opacity = lerp(o0, opacity, t);
  });
}

function speak(text) {
  if (!ttsEnabled || !window.speechSynthesis || !text) return Promise.resolve();
  return new Promise((res) => {
    const u = new SpeechSynthesisUtterance(text.replace(/[„“‚‘]/g, ''));
    u.lang = 'de-DE'; u.rate = 0.92;
    u.onend = res; u.onerror = res;
    window.speechSynthesis.speak(u);
    setTimeout(res, 40000);
  });
}

// Text zeigen, Lesezeit abwarten (per Trigger überspringbar), ausblenden
async function say(entry, extra = 0) {
  panel.show(entry);
  const len = (entry.de || '').length + (entry.ar || '').length * 0.5;
  const sec = Math.max(3.5, 2.5 + len * 0.055) + extra;
  await Promise.all([wait(sec, true), ttsEnabled ? Promise.race([speak(entry.de), wait(9999, true)]) : null]);
  panel.hide();
  await wait(0.8);
}

// ======================================================================
// Hilfen für Szenen
// ======================================================================

const headPos = new THREE.Vector3();
function head() { camera.getWorldPosition(headPos); return headPos; }

function setDay(level) {
  hemi.color.set(0xdfe6ee); hemi.groundColor.set(0x3a2a1c);
  hemi.intensity = 1.5 * level;
}

function resetWorld() {
  clods.clear();
  grave.reset();
  grave.group.visible = false; // die Szenen im Grab blenden es mit grave.fit() wieder ein
  lightPresences.level = 0;
  darkPresences.level = 0;
  gate.level = 0;
  ember.level = 0;
  companionA.level = 0;
  companionB.level = 0;
  cemetery.group.visible = false;
  lahd.visible = false;
  sun.castShadow = false;
  bounce.intensity = 0;
  panel.setDistance(0.85);
  sky.opacity = 0;
  scene.fog = null;
  hemi.intensity = 0;
  sun.intensity = 0;
  softFloor.visible = false;
  softFloorMat.opacity = 0;
  residual.intensity = 0;
  rig.position.set(0, 0, 0);
  rig.rotation.set(0, 0, 0);
  room.visible = false; room.family.visible = false;
  mosque.visible = false;
  veilBase = 0; veilPulse = 0; veil.opacity = 0;
  descLights.level = 0; descLights.headLevel = 0;
  pano.hide();
  proom.visible = false;
  allowWalk = false;
  room.setPhotoMode(false); mosque.setPhotoMode(false); cemetery.setPhotoMode(false);
  panel.setMode('yaw');
  phoneOn = false;
  if (sound.ctx) {
    sound.muffle(0, 0.1); sound.worldLevel(1, 0.1); sound.heartbeat(0);
    sound.setLevel('breath', 0, 0.5); sound.setLevel('room', 0, 0.5);
  }
}

// Liegen: Blick nach oben. viewUp = Richtung, in die der Scheitel zeigt (+z oder +x).
function lieDown(viewUp = 'z') {
  if (viewUp === 'x') rig.rotation.set(Math.PI / 2, Math.PI / 2, 0, 'YXZ');
  else rig.rotation.set(Math.PI / 2, 0, 0, 'YXZ');
}
// Den Kopf des Zuschauers genau an eine Stelle der Welt setzen
function placeHead(target) {
  rig.updateMatrixWorld(true);
  const h = head().clone();
  rig.position.add(target.clone().sub(h));
  rig.updateMatrixWorld(true);
}
// Punkt neben dem rechten Ohr (für Flüstern)
function besideEar(dist = 0.25) {
  const e = camera.matrixWorld.elements;
  return head().clone().add(new THREE.Vector3(e[0], e[1], e[2]).multiplyScalar(dist));
}

// ======================================================================
// PROLOG – das Zimmer
// ======================================================================
async function sceneProlog() {
  resetWorld();
  await fadeTo(0x000000, 1, 0.01);
  const h = head();
  room.group.position.set(h.x, 0, h.z);
  room.visible = true;
  if (pano.has('zimmer')) {
    // Echter Raum: das Foto wird auf Wände, Boden, Bett, Schreibtisch projiziert – man steht darin
    proom.build('zimmer', pano.tex.zimmer);
    proom.group.position.set(h.x, 0, h.z);
    proom.visible = true;
    proom.update();
    room.setPhotoMode(true);
    const A = proom.anchors;
    room.phone.position.copy(proom.local(...A.handy)); room.phone.rotation.set(0, -0.5, 0);
    room.mushafGroup.position.copy(proom.local(...A.mushaf)); room.mushafGroup.rotation.set(0, 0.2, 0);
    room.placeFamily(proom);
    allowWalk = true;
  }
  roomLamp(1, 0);
  room.family.visible = false;
  sound.worldLevel(1, 0.1);
  sound.setLevel('room', 0.6, 2);
  phoneOn = true; nextBuzz = now + 4;
  await fadeTo(0x000000, 0, 3);
  await wait(8);
  await say(TX.prologTitel, 1);
  await wait(5);
  await say(TX.jedeSeele, 1);
  await wait(3);
  phoneOn = false; // das Handy hört auf zu vibrieren
  await tween(6, (t) => roomLamp(1 - 0.2 * t, t));
  await say(TX.zerstoerer, 1);
  await wait(2);
}

// ======================================================================
// P.3–P.5 – Die Trunkenheit des Todes: die Welt verschwimmt, das Verborgene wird scharf
// ======================================================================
async function sceneDying() {
  await fadeTo(0x000000, 1, 2.5);
  // Schnitt im Schwarz: er liegt auf dem Bett und schaut zur Decke
  allowWalk = false;
  if (proom.visible) {
    const d = proom.headDir;                      // Scheitel zeigt zum Kopfende des Bettes
    rig.rotation.set(Math.PI / 2, Math.atan2(d.x, d.z), 0, 'YXZ');
    placeHead(proom.world(...proom.anchors.kopfAufBett));
  } else {
    lieDown('z');
    placeHead(room.group.localToWorld(room.headOnBed.clone()));
  }
  panel.setMode('free'); panel.setDistance(0.7);
  room.family.visible = true;
  veil.frost(); veil.mat.color.set(0xffffff);
  sound.setLevel('breath', 0.45, 4);
  sound.heartbeat(76, 0.45);
  await fadeTo(0x000000, 0, 3);

  // Die Welt verschwimmt
  tween(14, (t) => { veilBase = 0.62 * t; roomLamp(0.8 - 0.3 * t, 1); }, (x) => x);
  sound.muffle(0.75, 14);
  veilPulse = 1;
  await wait(4);
  await say(TX.sakra, 1);
  await say(TX.sakaratProphet, 1);
  sound.heartbeat(58, 0.5);
  await say(TX.taraqi, 1);

  // P.4 – Talqīn am Bett: klar und nah durch das Dumpfe hindurch
  for (let i = 0; i < 2; i++) {
    const ear = besideEar();
    panel.show(TX.talqin);
    const played = await sound.playFile('talqin.mp3', ear.x, ear.y, ear.z, 1);
    if (!played) { sound.whisper(ear.x, ear.y, ear.z); await wait(3.2, true); }
    panel.hide();
    await wait(1.6);
  }
  await say(TX.talqinHad, 0.5);
  await say(TX.letztesWort, 0.5);
  sound.heartbeat(44, 0.5);
  await say(TX.hulqum, 1);

  // P.5 – Alles bricht ab. Stille. Von oben wird etwas gestochen scharf.
  sound.heartbeat(0);
  sound.setLevel('breath', 0, 0.3);
  sound.worldLevel(0, 0.3);
  veilPulse = 0;
  // Die Welt tritt zurück: der Schleier wird grau und dunkel, damit das Licht von oben hervortritt
  const vc = veil.mat.color.clone(), dark = new THREE.Color(0x4a4844);
  await tween(4, (t) => { veil.mat.color.copy(vc).lerp(dark, t); veilBase = 0.62 + 0.2 * t; roomLamp(0.5 * (1 - t), 1); });
  descLights.group.position.copy(head());
  descLights.group.rotation.set(0, 0, 0);
  descLights.descend(0);
  const fall = tween(24, (t) => { descLights.descend(t); descLights.level = Math.min(1, t * 1.6); }, (x) => 1 - Math.pow(1 - x, 3));
  await wait(3);
  await say(TX.ghita, 2);
  await fall;
}

// ======================================================================
// 1A (Kurzfassung) – der gläubige Diener stirbt
// ======================================================================
async function sceneDeathA() {
  await say(TX.abdMumin, 1);
  await say(TX.engelHerab, 1);
  // Die eine, klarere Präsenz am Kopfende (jenseits des Scheitels)
  descLights.head.position.set(0, 0.8, 0.75);
  await tween(4, (t) => { descLights.headLevel = t; });
  await say(TX.malakA, 1);
  await say(TX.salamA, 1);
  // Die Seele fließt hinaus – der Blick folgt ihr nach oben, alles wird weiß
  sound.drip();
  const y0 = rig.position.y;
  const vc = veil.mat.color.clone(), white = new THREE.Color(0xffffff);
  const rise = tween(16, (t) => {
    rig.position.y = y0 + 1.4 * t;
    veil.mat.color.copy(vc).lerp(white, t);   // alles wird weiß – das Leichentuch aus dem Paradies
    veilBase = 0.82 + 0.15 * t;
  }, (x) => x);
  await say(TX.blickFolgt, 1);
  await say(TX.fliesst, 1);
  await rise;
  await say(TX.mutmainna, 1);
  await fadeTo(0xffffff, 1, 3);
  await fadeTo(0x000000, 1, 3);
  sound.allOff(1);
  resetWorld();
  await say(TX.aufstiegHinweis, 0);
}

// ======================================================================
// 3.00 – Waschung, Leichentuch, Totengebet, Hinaustragen
// ======================================================================
async function sceneJanaza() {
  resetWorld();
  await fadeTo(0x000000, 1, 0.01);
  await say(TX.janazaTitel, 1);
  sound.water(6);            // Waschung nur als Ton (Sicht des Toten ist schwach überliefert)
  await say(TX.kafan, 1);
  await wait(1);

  // Auf der Bahre vor der Gebetsnische, Blick nach oben, durch das Leichentuch
  mosque.group.position.set(0, 0, 0);
  mosque.visible = true;
  mosque.setLight(1);
  if (pano.show('moschee')) mosque.setPhotoMode(true);
  lieDown('x');
  placeHead(mosque.group.localToWorld(mosque.headOnBier.clone()));
  panel.setMode('free'); panel.setDistance(0.8);
  veil.cloth(); veil.mat.color.set(0xffffff);
  veilBase = 0.5; veilPulse = 0;
  await fadeTo(0x000000, 0, 4);
  await wait(3);

  // Die Reihen füllen sich hinter ihm – dann Stille
  const hp = head().clone();
  sound.crowd(12, { x: hp.x, y: 0, z: hp.z });
  await wait(13);
  await wait(3);

  // Vier Takbīr – der Imam unsichtbar, nur die Stimme
  const imam = { x: hp.x + 0.3, y: 1.7, z: hp.z + 0.8 };
  for (let i = 0; i < 4; i++) {
    panel.show(TX.takbir);
    const ok = await sound.playFile('takbir.mp3', imam.x, imam.y, imam.z, 1);
    if (!ok) await wait(2.6, true);
    panel.hide();
    await wait(1.5);
    if (i === 0) await say(TX.vierzig, 1);
    else await wait(5);
  }
  await say(TX.salamJanaza, 0);

  // Die Bahre wird angehoben und hinausgetragen
  const s0 = rig.position.clone();
  await tween(3, (t) => { rig.position.y = s0.y + 0.55 * t; });
  const door = mosque.group.localToWorld(mosque.doorPos.clone());
  const s1 = rig.position.clone();
  const dist = door.z - head().z + 0.6;
  const carry = tween(16, (t) => {
    rig.position.z = s1.z + dist * t;
    rig.position.y = s1.y + 0.012 * Math.sin(now * 3.2);
  }, (x) => x);
  await say(TX.asriu, 1);
  await carry;

  // Draußen: Himmel und Baumkronen ziehen vorüber
  await fadeTo(0xffffff, 1, 1.5);
  mosque.visible = false;
  pano.hide();
  sky.set('#9fb2c6', '#e9e6de'); sky.opacity = 1;
  hemi.color.set(0xdfe6ee); hemi.groundColor.set(0x4a4232); hemi.intensity = 1.2;
  sun.position.set(head().x - 20, 30, head().z + 10);
  sun.target.position.set(head().x, 0, head().z);
  sun.intensity = 1.4;
  cemetery.reset(); cemetery.walking = false;
  cemetery.group.position.set(head().x, 0, head().z + 4);
  cemetery.group.visible = true;
  if (pano.show('friedhof')) { cemetery.setPhotoMode(true); sky.opacity = 0; }
  sound.worldLevel(1, 0.5);
  sound.setLevel('wind', 0.2, 2);
  const s2 = rig.position.clone();
  const walk = tween(22, (t) => {
    rig.position.z = s2.z + 7 * t;
    rig.position.y = s2.y + 0.012 * Math.sin(now * 3.2);
  }, (x) => x);
  await fadeTo(0xffffff, 0, 1.5);
  await wait(2);
  await say(TX.qaddimuni, 1);
  cemetery.scatter(sound);   // alles hört es – nur der Mensch nicht
  await walk;
  await fadeTo(0x000000, 1, 3);
  sound.allOff(1);
}

// ======================================================================
// Szenen
// ======================================================================

async function sceneIntro() {
  resetWorld();
  await fadeTo(0x000000, 1, 0.01);
  await wait(1.5);
  await say(TX.aktTitel, 1);
  await say(TX.ersteStation);
}

// ---------- 3.0 Die Beerdigung ----------
// Nach der Sunnah: Lahd (Seitennische), davor hochkant gestellte Lehmziegel, dann Erde (Muslim 966).
async function sceneBurial() {
  resetWorld();
  grave.fit(head());
  grave.slabs.forEach((s) => { s.userData.placed = 0; });
  grave.gap = 0.014;
  grave.apply();
  lahd.build();
  lahd.visible = true;
  panel.setDistance(0.5);

  // Tageslicht im Graben, Sonne mit Schatten
  const gp = grave.group.position, d = grave.dims;
  sky.set('#9fb2c6', '#e9e6de');
  sky.opacity = 1;
  if (pano.show('himmel')) sky.opacity = 0;   // echter Himmel über dem Graben
  hemi.color.set(0xe4e9f0); hemi.groundColor.set(0x5a4634);
  hemi.intensity = 0.9;
  // Sonne steht hoch und etwas hinter dem Zuschauer: Sie fällt in den Graben und auf die gegenüberliegende Wand
  sun.position.set(gp.x + 2.5, 11, gp.z + 2.5);
  sun.target.position.set(gp.x, 0, gp.z + d.front - 0.6);
  sun.intensity = 3.0;
  sun.castShadow = true;
  bounce.position.set(gp.x, d.h * 0.5, gp.z + d.front - 0.3);
  bounce.intensity = 3.0;
  sound.setLevel('wind', 0.3, 3);
  await fadeTo(0x000000, 0, 4);
  await wait(4);

  // Die Ziegel werden einer nach dem anderen gesetzt – Reihe für Reihe, von unten nach oben
  const textRun = (async () => { await wait(3); await say(TX.dreiFolgen, 6); })();
  const n = grave.slabs.length;
  for (let k = 0; k < n; k++) {
    const slab = grave.slabs[k];
    const sx = gp.x + (slab.userData.col - 2) * 0.24;
    sound.scrape(sx, d.h + 0.6, gp.z + d.front - 0.3, 0.9);
    await tween(0.95, (t) => { slab.userData.placed = t; grave.apply(); });
    sound.place(sx, (slab.userData.row + 0.5) * d.h / 3, gp.z + d.front);
    const open = 1 - (k + 1) / n;
    bounce.intensity = 3.0 * Math.pow(open, 1.3) + 0.05;
    hemi.intensity = 0.15 + 0.75 * open;
    await wait(0.5 + Math.random() * 0.5);
  }
  // Fugen werden mit Lehm verschlossen – die letzten Lichtstreifen verschwinden
  sound.smear(3);
  await tween(3, (t) => { grave.gap = lerp(0.014, 0, t); grave.apply(); bounce.intensity = lerp(0.05, 0, t); hemi.intensity = lerp(0.15, 0, t); });
  sun.castShadow = false;
  sun.intensity = 0;
  sky.opacity = 0;
  pano.hide();
  lahd.visible = false;
  residual.color.set(0x9aa6b4);
  residual.intensity = 0.12;
  await textRun;

  // Erde fällt auf die Ziegel – dumpf, von oben; feiner Staub rieselt durch
  sound.setLevel('wind', 0, 2);
  for (let i = 0; i < 12; i++) {
    sound.earth(gp.x + (Math.random() - 0.5) * 0.8, d.h + 0.4, gp.z + d.front - 0.3, 0.75, true);
    clods.dust(6 + Math.floor(Math.random() * 8), d);
    await wait(1.3 + Math.random() * 1.1);
  }
  sound.thud(0.35);

  // Dunkelheit – die Schritte gehen fort
  await wait(2.5);
  sound.footstepsAway(14, 7);
  await wait(1.5);
  await say(TX.sandalen, 5);
  await wait(5);
  // Stille
  await wait(6);
  await say(TX.barzakh, 1);
  await wait(2);
}

// ---------- 3A Der gläubige Diener ----------
async function scenePathA() {
  resetWorld();
  grave.fit(head());
  lightPresences.place(grave.dims);
  panel.setDistance(0.5);
  residual.color.set(0x9aa6b4);
  residual.intensity = 0.25;
  await fadeTo(0x000000, 1, 0.01);
  await say(TX.titelA, 1);
  await fadeTo(0x000000, 0, 2);
  await wait(2);

  await say(TX.rueckgabeA);
  // Der Diener wird aufgesetzt
  await tween(5, (t) => { rig.position.y = lerp(0, 0.15, t); });
  // Zwei Präsenzen: Licht ohne Quelle
  await tween(5, (t) => { lightPresences.level = t; });
  await wait(1.5);

  for (const [q, a] of TX.fragenA) {
    await say(q, 0.5);
    await say(a, 0.5);
  }
  await say(TX.festesWort);
  await say(TX.rufA, 1);

  // Das Grab weitet sich, so weit der Blick reicht
  const d = grave.dims;
  const s0 = { ...d };
  sky.set('#fff7e6', '#f2e4c6');
  scene.fog = new THREE.FogExp2(0xf4e8cf, 0.0);
  sound.setLevel('garden', 0.45, 18);
  sound.drip();
  const textRun = (async () => { await wait(6); panel.setDistance(0.85); await say(TX.weiteA, 3); })();
  await tween(22, (t) => {
    const k = Math.pow(t, 1.6);
    d.hw = lerp(s0.hw, 70, k);
    d.front = lerp(s0.front, -70, k);
    d.back = lerp(s0.back, 70, k);
    d.h = lerp(s0.h, 40, k);
    grave.apply();
    grave.setOpacity(1 - THREE.MathUtils.smoothstep(t, 0.15, 0.75), false);
    softFloor.visible = true;
    softFloor.position.x = grave.group.position.x;
    softFloor.position.z = grave.group.position.z;
    softFloorMat.opacity = THREE.MathUtils.smoothstep(t, 0.2, 0.8);
    sky.opacity = THREE.MathUtils.smoothstep(t, 0.1, 0.6);
    scene.fog.density = 0.035 * t;
    hemi.color.set(0xfff3dc); hemi.groundColor.set(0xcdb48e);
    hemi.intensity = lerp(0, 1.6, t);
    lightPresences.level = 1 - t;
    residual.intensity = 0.25 * (1 - t);
  }, (x) => x);
  gate.group.position.set(head().x + 7.5, 0, head().z - 6.5);
  gate.group.lookAt(head().x, 0, head().z);
  await tween(6, (t) => { gate.level = t; });
  await textRun;
  await say(TX.platzA);

  // Der Gefährte
  const h = head();
  companionA.group.position.set(h.x, 0, h.z - 9);
  companionA.group.lookAt(h.x, 0, h.z);
  const textRun2 = (async () => { await wait(2); await say(TX.gefaehrteA[0], 1); })();
  await tween(12, (t) => {
    companionA.level = Math.min(1, t * 2);
    companionA.group.position.z = lerp(h.z - 9, h.z - 2.6, t);
  });
  await textRun2;
  for (const e of TX.gefaehrteA.slice(1)) await say(e, 0.5);
  await say(TX.brautA, 1.5);

  // Ruhe – weiches Abendlicht
  sound.setLevel('garden', 0.12, 8);
  await tween(8, (t) => {
    hemi.intensity = lerp(1.6, 0.4, t);
    companionA.level = 1 - t;
    gate.level = 1 - 0.6 * t;
  });
  await fadeTo(0x0a0806, 1, 4);
  sound.allOff(3);
  await wait(2);
}

// ---------- Übergang ----------
async function sceneTransition() {
  await fadeTo(0x5a5a5a, 1, 2.5);
  sound.breath(0.45);
  await wait(4);
  await say(TX.titelB, 1.5);
  await fadeTo(0x000000, 1, 2);
}

// ---------- 3B Der ungläubige Diener ----------
async function scenePathB() {
  resetWorld();
  grave.fit(head());
  darkPresences.place(grave.dims);
  panel.setDistance(0.5);
  residual.color.set(0x7d8a9a);
  residual.intensity = 0.9;
  await fadeTo(0x000000, 0, 3);
  await wait(2);

  await say(TX.rueckgabeB);
  sound.setLevel('sub', 0.32, 6);
  await tween(5, (t) => { rig.position.y = lerp(0, 0.15, t); });
  await tween(5, (t) => { darkPresences.level = t; residual.intensity = lerp(0.9, 1.3, t); });
  await wait(1.5);

  for (const [q, a] of TX.fragenB) {
    await say(q, 0.5);
    await say(a, 1.2);
  }
  await say(TX.laDarayta, 1);
  await say(TX.rufB, 1);

  // Öffnung zum Feuer – nur Glut
  sound.setLevel('heat', 0.35, 6);
  await tween(5, (t) => { ember.level = t; darkPresences.level = 1 - t * 0.5; });
  await say(TX.engeB, 1);

  // Komfort-Hinweis, dann die Enge (überspringbar durch Halten der Seitentaste)
  await say(TX.hinweisEnge, -1);
  if (!holdSkip) {
    const d = grave.dims;
    const s0 = { ...d };
    const hp = head();
    const gp = grave.group.position;
    const localZ = hp.z - gp.z;
    const targetH = Math.max(hp.y + 0.22, 1.1);
    sound.grind(6);
    let skipped = false;
    await tween(6, (t) => {
      if (holdSkip) skipped = true;
      if (skipped) return;
      d.hw = lerp(s0.hw, 0.3, t);
      d.front = lerp(s0.front, localZ - 0.3, t);
      d.back = lerp(s0.back, localZ + 0.24, t);
      d.h = lerp(s0.h, targetH, t);
      grave.apply();
    });
  }
  fadeMat.color.set(0x000000); fadeMat.opacity = 1;
  sound.thud(1);
  sound.setLevel('heat', 0.15, 0.5);
  grave.reset();
  grave.dims.front = -1.25; grave.apply(); // etwas Raum für den Gefährten
  darkPresences.level = 0;
  await wait(3);

  // Der Gefährte – in rotem Halbdunkel
  const h = head();
  companionB.group.position.set(h.x, 0, h.z - 1.05);
  companionB.group.lookAt(h.x, 0, h.z);
  companionB.group.scale.setScalar(Math.min(1, (grave.dims.h - 0.08) / 1.78)); // passt in die Nische
  sound.setLevel('heat', 0.3, 3);
  await fadeTo(0x000000, 0, 2.5);
  const textRun = say(TX.gefaehrteB[0], 1);
  await tween(4, (t) => { companionB.level = t; });
  await textRun;
  for (const e of TX.gefaehrteB.slice(1)) await say(e, 0.6);

  await say(TX.schreiB, 2);
  await fadeTo(0x000000, 1, 0.4);
  sound.allOff(0.3);
  ember.level = 0;
  companionB.level = 0;

  // An der Oberfläche: Stille. Nur die Vögel fliegen auf.
  await wait(1.5);
  grave.setOpacity(0);
  rig.position.set(0, 0, 0);
  panel.setDistance(0.85);
  cemetery.reset();
  cemetery.group.visible = true;
  cemetery.group.position.set(head().x, 0, head().z + 3);
  if (pano.show('friedhof')) { cemetery.setPhotoMode(true); }
  sky.set('#a9b8c8', '#e6e3db');
  sky.opacity = 1;
  scene.fog = new THREE.Fog(0xd9d8d2, 18, 90);
  if (pano.mesh.visible) { sky.opacity = 0; scene.fog = null; } // echtes Foto statt Himmel und Nebel
  hemi.color.set(0xdfe6ee); hemi.groundColor.set(0x4a4232);
  hemi.intensity = 1.3;
  sun.position.set(head().x - 20, 30, head().z + 10);
  sun.target.position.set(head().x, 0, head().z);
  sun.intensity = 1.6;
  residual.intensity = 0;
  sound.setLevel('wind', 0.12, 3);
  cemetery.walking = true;
  await fadeTo(0x000000, 0, 2.5);
  await wait(5);
  cemetery.scatter(sound);
  await wait(9);
  await say(TX.vorgefuehrtB, 1.5);
  await wait(2);
  cemetery.walking = false;
  await fadeTo(0x000000, 1, 4);
  sound.allOff(2);
}

async function sceneEnd() {
  resetWorld();
  await say(TX.pruefhinweis, 1);
  panel.show(TX.ende);
  ended = true;
}

// ======================================================================
// Ablauf
// ======================================================================

let ended = false;
let running = false;

async function run(chapter) {
  running = true;
  if (chapter === 'all' || chapter === 'prolog') {
    await sceneProlog();
    await sceneDying();
    await sceneDeathA();
  }
  if (chapter === 'all' || chapter === 'janaza') await sceneJanaza();
  if (chapter === 'all' || chapter === 'burial') {
    await sceneIntro();
    await sceneBurial();
  }
  if (chapter === 'all' || chapter === 'a') await scenePathA();
  if (chapter === 'all') await sceneTransition();
  if (chapter === 'all' || chapter === 'b') {
    if (chapter === 'b') { await fadeTo(0x000000, 1, 0.01); await say(TX.titelB, 1); }
    await scenePathB();
  }
  await sceneEnd();
}

// ======================================================================
// Eingabe
// ======================================================================

function onSelect() {
  if (ended) { location.reload(); return; }
  skipText();
}
for (let i = 0; i < 2; i++) {
  const c = renderer.xr.getController(i);
  c.addEventListener('select', onSelect);
  c.addEventListener('squeezestart', () => { holdSkip = true; });
  c.addEventListener('squeezeend', () => { holdSkip = false; });
  rig.add(c);
}

// Bildschirm-Modus: Ziehen zum Umsehen
let yaw = 0, pitch = 0, dragging = false, lx = 0, ly = 0, moved = 0;
renderer.domElement.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; moved = 0; });
window.addEventListener('pointerup', () => { if (dragging && moved < 6 && running) onSelect(); dragging = false; });
window.addEventListener('pointermove', (e) => {
  if (!dragging || renderer.xr.isPresenting) return;
  const dx = e.clientX - lx, dy = e.clientY - ly;
  moved += Math.abs(dx) + Math.abs(dy);
  lx = e.clientX; ly = e.clientY;
  yaw -= dx * 0.004; pitch -= dy * 0.004;
  pitch = Math.max(-1.45, Math.min(1.45, pitch));
});
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && running) { e.preventDefault(); onSelect(); }
  if (e.code === 'KeyK') holdSkip = true;
});
window.addEventListener('keyup', (e) => { if (e.code === 'KeyK') holdSkip = false; });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ======================================================================
// Render-Loop
// ======================================================================

// Gehen: linker Stick (VR) oder W/A/S/D (Bildschirm), in Blickrichtung, begrenzt auf den Raum
const walkKeys = new Set();
window.addEventListener('keydown', (e) => walkKeys.add(e.code));
window.addEventListener('keyup', (e) => walkKeys.delete(e.code));
function walk(dt) {
  let fx = 0, fz = 0;
  const session = renderer.xr.getSession();
  if (session) {
    for (const src of session.inputSources) {
      if (src.handedness !== 'left' || !src.gamepad) continue;
      const ax = src.gamepad.axes;
      const sx = ax.length >= 4 ? ax[2] : ax[0] || 0, sy = ax.length >= 4 ? ax[3] : ax[1] || 0;
      if (Math.abs(sx) > 0.15) fx = sx;
      if (Math.abs(sy) > 0.15) fz = sy;
    }
  } else {
    if (walkKeys.has('KeyW')) fz = -1; if (walkKeys.has('KeyS')) fz = 1;
    if (walkKeys.has('KeyA')) fx = -1; if (walkKeys.has('KeyD')) fx = 1;
  }
  if (!fx && !fz) return;
  const e = camera.matrixWorld.elements;
  const fwd = new THREE.Vector3(-e[8], 0, -e[10]).normalize();
  const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
  const move = fwd.multiplyScalar(-fz).add(right.multiplyScalar(fx)).multiplyScalar(0.9 * dt);
  const h = head().clone().add(move);
  const target = proom.visible ? proom.clampInside(h) : h;
  rig.position.x += target.x - head().x;
  rig.position.z += target.z - head().z;
}

const clock = new THREE.Clock();
const SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1; // nur für Tests
renderer.setAnimationLoop(() => {
  const dt = Math.min(0.1, clock.getDelta()) * SPEED;
  now += dt;

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    const t = Math.min(1, (now - tw.start) / tw.dur);
    tw.fn(tw.e(t));
    if (t >= 1) { tweens.splice(i, 1); tw.res(); }
  }
  for (let i = waits.length - 1; i >= 0; i--) {
    if (now >= waits[i].until) { const w = waits.splice(i, 1)[0]; w.res(); }
  }

  if (!renderer.xr.isPresenting) camera.rotation.set(pitch, yaw, 0, 'YXZ');

  if (allowWalk) walk(dt);
  if (proom.visible) proom.update();
  // Schleier: Grundtrübung, ab und zu ein kurzer klarer Moment
  veil.opacity = veilBase * (1 - veilPulse * Math.pow(Math.max(0, Math.sin(now * 0.45)), 8) * 0.85);
  // Handy auf dem Schreibtisch
  if (room.group.visible) {
    if (phoneOn && now > nextBuzz) {
      if (room.screen.push()) {
        const pp = room.group.localToWorld(room.phonePos.clone());
        sound.buzz(pp.x, pp.y, pp.z);
        phoneFlash = 1;
      }
      nextBuzz = now + 6 + Math.random() * 4;
    }
    phoneFlash = Math.max(0, phoneFlash - dt * 0.12);   // bleibt einige Sekunden hell
    room.phoneScreen.material.color.setScalar(0.08 + 0.92 * Math.min(1, phoneFlash * 1.5));
  }
  clods.update(dt);
  ember.update(now);
  cemetery.update(dt, now);
  camera.updateMatrixWorld();
  sky.follow(head());
  pano.follow(head());
  panel.update(camera, dt);
  sound.updateListener(camera);

  renderer.render(scene, camera);
});

// ======================================================================
// Start
// ======================================================================

const overlay = document.getElementById('overlay');
const btnVR = document.getElementById('btn-vr');
const btnDesk = document.getElementById('btn-desk');
const status = document.getElementById('xrstatus');
const hud = document.getElementById('hud');

async function prepare() {
  ttsEnabled = document.getElementById('tts').checked;
  sound.init();
  await sound.resume();
  await Promise.all([sound.loadFile('talqin.mp3'), sound.loadFile('takbir.mp3')]); // eigene Aufnahmen, falls vorhanden
  await pano.loadSettings();
  await Promise.all(PANORAMEN.map((n) => pano.load(n)));                           // 360°-Fotos, falls vorhanden
  try { await document.fonts.load('600 40px "Noto Naskh Arabic"'); } catch (e) { /* Systemschrift */ }
  // Kurzer stiller Ton, damit Safari/Quest Audio freigeben
  if (ttsEnabled && window.speechSynthesis) window.speechSynthesis.speak(new SpeechSynthesisUtterance(' '));
}

btnDesk.addEventListener('click', async () => {
  await prepare();
  overlay.classList.add('hidden');
  hud.style.display = 'block';
  run(document.getElementById('chapter').value);
});

btnVR.addEventListener('click', async () => {
  await prepare();
  try {
    const session = await navigator.xr.requestSession('immersive-vr', {
      optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'],
    });
    session.addEventListener('end', () => location.reload());
    await renderer.xr.setSession(session);
    overlay.classList.add('hidden');
    run(document.getElementById('chapter').value);
  } catch (err) {
    status.textContent = 'VR konnte nicht gestartet werden: ' + err.message;
  }
});

(async () => {
  if (navigator.xr && await navigator.xr.isSessionSupported('immersive-vr').catch(() => false)) {
    btnVR.disabled = false;
    status.textContent = 'VR bereit. Setz das Headset auf und tippe auf „In VR starten“.';
  } else if (!window.isSecureContext) {
    status.textContent = 'VR benötigt eine HTTPS-Adresse. Siehe Anleitung im README.';
  } else {
    status.textContent = 'Kein VR-Headset erkannt. Du kannst den Prototyp am Bildschirm ansehen.';
  }
})();

// Für automatisierte Tests
window.__akhira = { run, scene, camera, grave, TX, get now() { return now; }, skipText, setLook: (y, p) => { yaw = y; pitch = p; } };
