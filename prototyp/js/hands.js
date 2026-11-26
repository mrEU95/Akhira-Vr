import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';

// Sichtbare Hände (Hand-Tracking der Quest) bzw. Controller – und Greifen von Gegenständen.
// Greifen: Hand/Controller in die Nähe bringen, dann Seitentaste (Grip), Trigger oder Finger-Pinch.
// Nochmal drücken: loslassen (der Gegenstand kehrt an seinen Platz zurück).
export class Hands {
  constructor(renderer, rig, camera) {
    this.renderer = renderer;
    this.camera = camera;
    this.grips = [];
    this.handObjs = [];
    this.grabbables = [];     // { obj, home: {parent, position, quaternion}, radius }
    this.holding = null;      // { item, by }
    this.consumedSelect = false;
    this.group = new THREE.Group();
    rig.add(this.group);

    const cmf = new XRControllerModelFactory();
    cmf.setPath('lib/xr-profiles');
    const hmf = new XRHandModelFactory();
    hmf.setPath('lib/xr-profiles/generic-hand/');

    for (let i = 0; i < 2; i++) {
      const grip = renderer.xr.getControllerGrip(i);
      grip.add(cmf.createControllerModel(grip));
      this.group.add(grip);
      this.grips.push(grip);
      const hand = renderer.xr.getHand(i);
      hand.add(hmf.createHandModel(hand, 'mesh'));
      this.group.add(hand);
      this.handObjs.push(hand);

      const ctrl = renderer.xr.getController(i);
      const toggle = () => this._toggle(i);
      ctrl.addEventListener('squeezestart', toggle);
      ctrl.addEventListener('selectstart', () => { if (this._near(i)) { toggle(); this.consumedSelect = true; } });
    }
    this.visible = false;
  }

  set visible(v) { this.group.visible = v; this._visible = v; }
  get visible() { return this._visible; }

  addGrabbable(obj, radius = 0.22) {
    this.grabbables.push({ obj, radius, home: null });
  }

  // Position der Hand i: Zeigefingerspitze bei Hand-Tracking, sonst Controller-Griff
  _handPos(i) {
    const hand = this.handObjs[i];
    const tip = hand.joints && hand.joints['index-finger-tip'];
    const p = new THREE.Vector3();
    if (tip && tip.visible) return tip.getWorldPosition(p);
    return this.grips[i].getWorldPosition(p);
  }
  _usingHand(i) {
    const w = this.handObjs[i].joints && this.handObjs[i].joints.wrist;
    return !!(w && w.visible);
  }
  _near(i) {
    if (!this._visible) return null;
    if (this.holding && this.holding.by === i) return this.holding.item;
    const hp = this._handPos(i);
    let best = null, bd = Infinity;
    for (const g of this.grabbables) {
      if (!g.obj.visible || !g.obj.parent) continue;
      const d = g.obj.getWorldPosition(new THREE.Vector3()).distanceTo(hp);
      if (d < g.radius && d < bd) { best = g; bd = d; }
    }
    return best;
  }

  _toggle(i) {
    if (!this._visible) return;
    if (this.holding) { if (this.holding.by === i || this.holding.by === 'desk') this.release(); return; }
    const g = this._near(i);
    if (!g) return;
    // Platz merken, dann an die Hand hängen
    g.home = { parent: g.obj.parent, position: g.obj.position.clone(), quaternion: g.obj.quaternion.clone() };
    if (this._usingHand(i)) {
      const wrist = this.handObjs[i].joints.wrist;
      wrist.add(g.obj);
      g.obj.position.set(0, -0.035, -0.09);
      g.obj.rotation.set(Math.PI, 0, 0);          // Bildschirm zur Handfläche hin nach oben
    } else {
      this.grips[i].add(g.obj);
      g.obj.position.set(0, 0.03, -0.09);
      g.obj.rotation.set(0.6, 0, 0);              // Bildschirm schräg zum Gesicht
    }
    this.holding = { item: g, by: i };
  }

  // Am Bildschirm: Taste G nimmt das Handy vor die Augen
  toggleDesktop() {
    if (this.holding) { this.release(); return; }
    const g = this.grabbables.find((x) => x.obj.visible);
    if (!g) return;
    g.home = { parent: g.obj.parent, position: g.obj.position.clone(), quaternion: g.obj.quaternion.clone() };
    this.camera.add(g.obj);
    g.obj.position.set(0.04, -0.09, -0.3);
    g.obj.rotation.set(Math.PI / 2 - 0.15, 0, 0);
    this.holding = { item: g, by: 'desk' };
  }

  release() {
    if (!this.holding) return;
    const g = this.holding.item;
    if (g.home) {
      g.home.parent.add(g.obj);
      g.obj.position.copy(g.home.position);
      g.obj.quaternion.copy(g.home.quaternion);
    }
    this.holding = null;
  }
}
