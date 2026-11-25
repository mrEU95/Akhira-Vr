// Prozedurale Klanggestaltung – keine Musikinstrumente, nur Natur- und Raumklang.
// Alles wird zur Laufzeit erzeugt (Rauschen, Filter, Hüllkurven), es gibt keine Audiodateien.

export class Sound {
  constructor() {
    this.ctx = null;
    this.layers = {};
  }

  init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(this.ctx.destination);
    this.noiseBuf = this._makeNoise(4);
    this._makeLayers();
  }

  resume() { return this.ctx && this.ctx.resume(); }
  get now() { return this.ctx.currentTime; }

  _makeNoise(seconds) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    // leicht "braunes" Rauschen: wärmer als weißes
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.04 * w) / 1.04;
      d[i] = w * 0.5 + last * 3.0;
    }
    return buf;
  }

  _noiseSrc(loop = true) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.noiseBuf;
    s.loop = loop;
    s.loopStart = Math.random() * 2;
    return s;
  }

  _panner(x, y, z) {
    const p = this.ctx.createPanner();
    p.panningModel = 'HRTF';
    p.distanceModel = 'inverse';
    p.refDistance = 1;
    p.rolloffFactor = 1;
    if (p.positionX) {
      p.positionX.value = x; p.positionY.value = y; p.positionZ.value = z;
    } else {
      p.setPosition(x, y, z);
    }
    p.connect(this.master);
    return p;
  }

  // --- Dauerschichten (mit setLevel ein- und ausblenden) ---

  _makeLayers() {
    const c = this.ctx;

    // Wind: weich, weit
    {
      const src = this._noiseSrc();
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.6;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.08;
      const lfoG = c.createGain(); lfoG.gain.value = 180;
      lfo.connect(lfoG).connect(bp.frequency);
      const g = c.createGain(); g.gain.value = 0;
      src.connect(bp).connect(g).connect(this.master);
      src.start(); lfo.start();
      this.layers.wind = g;
    }

    // Tiefe Präsenz (Weg B): kaum hörbar, eher spürbar
    {
      const o1 = c.createOscillator(); o1.type = 'sine'; o1.frequency.value = 48;
      const o2 = c.createOscillator(); o2.type = 'sine'; o2.frequency.value = 96.7;
      const g2 = c.createGain(); g2.gain.value = 0.25;
      const g = c.createGain(); g.gain.value = 0;
      o1.connect(g); o2.connect(g2).connect(g);
      g.connect(this.master);
      o1.start(); o2.start();
      this.layers.sub = g;
    }

    // Glut: dumpfes Rauschen mit Knistern (Weg B)
    {
      const src = this._noiseSrc();
      const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
      const g = c.createGain(); g.gain.value = 0;
      src.connect(lp).connect(g).connect(this.master);
      src.start();
      this.layers.heat = g;
      this._crackleGain = c.createGain(); this._crackleGain.gain.value = 0;
      this._crackleGain.connect(this.master);
    }

    // Weite (Weg A): Blätter in der Ferne, fließendes Wasser
    {
      const leaves = this._noiseSrc();
      const hp = c.createBiquadFilter(); hp.type = 'bandpass'; hp.frequency.value = 2600; hp.Q.value = 0.4;
      const lg = c.createGain(); lg.gain.value = 0.35;
      const lfo = c.createOscillator(); lfo.frequency.value = 0.15;
      const lfoG = c.createGain(); lfoG.gain.value = 0.2;
      lfo.connect(lfoG).connect(lg.gain);

      const water = this._noiseSrc();
      const wb = c.createBiquadFilter(); wb.type = 'bandpass'; wb.frequency.value = 900; wb.Q.value = 2.5;
      const wlfo = c.createOscillator(); wlfo.frequency.value = 3.1;
      const wlfoG = c.createGain(); wlfoG.gain.value = 260;
      wlfo.connect(wlfoG).connect(wb.frequency);
      const wg = c.createGain(); wg.gain.value = 0.5;

      const g = c.createGain(); g.gain.value = 0;
      leaves.connect(hp).connect(lg).connect(g);
      water.connect(wb).connect(wg).connect(g);
      g.connect(this.master);
      leaves.start(); water.start(); lfo.start(); wlfo.start();
      this.layers.garden = g;
    }

    this._crackleTimer = setInterval(() => this._crackle(), 140);
  }

  setLevel(name, value, seconds = 2) {
    const g = this.layers[name];
    if (!g) return;
    const t = this.now;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(g.gain.value, t);
    g.gain.linearRampToValueAtTime(value, t + Math.max(0.01, seconds));
    if (name === 'heat') {
      this._crackleGain.gain.cancelScheduledValues(t);
      this._crackleGain.gain.setValueAtTime(this._crackleGain.gain.value, t);
      this._crackleGain.gain.linearRampToValueAtTime(value, t + Math.max(0.01, seconds));
    }
  }

  allOff(seconds = 1.5) {
    for (const k of Object.keys(this.layers)) this.setLevel(k, 0, seconds);
  }

  _crackle() {
    if (!this.ctx || this._crackleGain.gain.value < 0.01) return;
    if (Math.random() > 0.45) return;
    const c = this.ctx, t = this.now;
    const s = this._noiseSrc(false);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800 + Math.random() * 2500;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.25 + Math.random() * 0.3, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03 + Math.random() * 0.05);
    s.connect(hp).connect(g).connect(this._crackleGain);
    s.start(t); s.stop(t + 0.12);
  }

  // --- Einzelklänge ---

  // Erde, die auf Stoff und Holz fällt
  earth(x = 0, y = 2, z = 0, vol = 1) {
    const c = this.ctx, t = this.now;
    const out = this._panner(x, y, z);
    const s = this._noiseSrc(false);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500 + Math.random() * 300;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.9 * vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5 + Math.random() * 0.3);
    s.connect(lp).connect(g).connect(out);
    s.start(t); s.stop(t + 1);
    // dumpfer Aufprall
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.25);
    const og = c.createGain();
    og.gain.setValueAtTime(0.0001, t);
    og.gain.exponentialRampToValueAtTime(0.6 * vol, t + 0.01);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    o.connect(og).connect(out);
    o.start(t); o.stop(t + 0.35);
  }

  // Ein Schritt mit Sandalen auf Erde
  step(x, y, z, vol = 1, when = 0) {
    const c = this.ctx, t = this.now + when;
    const out = this._panner(x, y, z);
    const s = this._noiseSrc(false);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random() * 600; bp.Q.value = 1.2;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.7 * vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
    s.connect(bp).connect(g).connect(out);
    s.start(t); s.stop(t + 0.15);
    // Klappern der Sandale
    const s2 = this._noiseSrc(false);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
    const g2 = c.createGain();
    g2.gain.setValueAtTime(0, t + 0.05);
    g2.gain.linearRampToValueAtTime(0.25 * vol, t + 0.054);
    g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.09);
    s2.connect(hp).connect(g2).connect(out);
    s2.start(t); s2.stop(t + 0.15);
  }

  // Die Gefährten gehen fort: mehrere Personen, die sich vom Grab entfernen
  footstepsAway(duration = 14, people = 6) {
    for (let p = 0; p < people; p++) {
      const ang = Math.random() * Math.PI * 2;
      const interval = 0.52 + Math.random() * 0.12;
      const delay = Math.random() * 1.5;
      for (let t = delay; t < duration; t += interval) {
        const k = t / duration;
        const dist = 1 + k * 18;
        const x = Math.cos(ang) * dist, z = Math.sin(ang) * dist;
        const vol = Math.pow(1 - k, 1.6);
        this.step(x, 2.6, z, vol, t);
      }
    }
  }

  // Ein einzelner Wassertropfen
  drip() {
    const c = this.ctx, t = this.now;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(1500, t); o.frequency.exponentialRampToValueAtTime(500, t + 0.09);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.4, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 0.3);
  }

  // Ein langer Atemzug (Übergang zwischen Weg A und B)
  breath(vol = 0.5) {
    const c = this.ctx, t = this.now;
    const s = this._noiseSrc(false);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1.6);
    g.gain.linearRampToValueAtTime(0, t + 3.6);
    s.connect(bp).connect(g).connect(this.master);
    s.start(t); s.stop(t + 3.8);
  }

  // Dumpfer Schlag (Erde verdichtet sich, Tor schließt sich)
  thud(vol = 1) {
    const c = this.ctx, t = this.now;
    const o = c.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(30, t + 0.6);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.9 * vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g).connect(this.master);
    o.start(t); o.stop(t + 1);
  }

  // Erde, die sich zusammenpresst: Knirschen
  grind(seconds = 6) {
    const c = this.ctx, t = this.now;
    const s = this._noiseSrc(false);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 260; bp.Q.value = 1.5;
    const am = c.createGain(); am.gain.value = 0.5;
    const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 13;
    const lfoG = c.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG).connect(am.gain);
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.9, t + seconds * 0.8);
    g.gain.linearRampToValueAtTime(0, t + seconds);
    s.connect(bp).connect(am).connect(g).connect(this.master);
    s.start(t); s.stop(t + seconds + 0.1); lfo.start(t); lfo.stop(t + seconds + 0.1);
  }

  // Flügelschlagen vieler Vögel an einer Position
  flutter(x, y, z, seconds = 2.2) {
    const c = this.ctx, t0 = this.now;
    const out = this._panner(x, y, z);
    for (let t = 0; t < seconds; t += 0.05 + Math.random() * 0.05) {
      const t1 = t0 + t;
      const s = this._noiseSrc(false);
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500 + Math.random() * 700; bp.Q.value = 0.8;
      const g = c.createGain();
      const v = 0.5 * (1 - t / seconds);
      g.gain.setValueAtTime(0, t1);
      g.gain.linearRampToValueAtTime(v, t1 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0005, t1 + 0.07);
      s.connect(bp).connect(g).connect(out);
      s.start(t1); s.stop(t1 + 0.1);
    }
  }

  // Hörer folgt dem Kopf (für räumlichen Klang)
  updateListener(camera) {
    if (!this.ctx) return;
    const l = this.ctx.listener;
    const e = camera.matrixWorld.elements;
    const px = e[12], py = e[13], pz = e[14];
    const fx = -e[8], fy = -e[9], fz = -e[10];
    const ux = e[4], uy = e[5], uz = e[6];
    if (l.positionX) {
      const t = this.now;
      l.positionX.setTargetAtTime(px, t, 0.02); l.positionY.setTargetAtTime(py, t, 0.02); l.positionZ.setTargetAtTime(pz, t, 0.02);
      l.forwardX.setTargetAtTime(fx, t, 0.02); l.forwardY.setTargetAtTime(fy, t, 0.02); l.forwardZ.setTargetAtTime(fz, t, 0.02);
      l.upX.setTargetAtTime(ux, t, 0.02); l.upY.setTargetAtTime(uy, t, 0.02); l.upZ.setTargetAtTime(uz, t, 0.02);
    } else {
      l.setPosition(px, py, pz);
      l.setOrientation(fx, fy, fz, ux, uy, uz);
    }
  }
}
