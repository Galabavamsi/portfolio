/* ============================================================
   focus.js: a lens, and a focus pull.

   A tapered line source on the left launches a plane wave. A
   biconvex region where waves travel slower (index n = 1.5, so
   k = 1/n^2 in the medium) focuses it. The sensor is a vertical line
   you can drag; the readout is the width (full width at half
   maximum) of the energy profile measured along it. Where the focus
   really is, is found from the simulated field itself once it has
   settled: the column with the narrowest profile.
   ============================================================ */
import {
  Mesh, BoxGeometry, Group, Shape, ExtrudeGeometry, DataTexture, RGBAFormat, FloatType, MeshPhysicalNodeMaterial,
  MeshBasicNodeMaterial, Color, BufferGeometry, BufferAttribute, Line, LineBasicNodeMaterial,
} from 'three/webgpu';
import { InstrumentBase } from './base.js';

const LAMBDA = 12;
const C = 0.5;
const OMEGA = 2 * Math.PI * C / LAMBDA;
const RATE = 480;
const N_INDEX = 1.5;

export default class Focus extends InstrumentBase {
  constructor(el, ctx) {
    super(el, ctx, { cols: 440 });
    this.acc = 0;
    this.phase = 0;
    this.auto = !ctx.reduced;
    this.sensorX = null;
    this.range = el.querySelector('[data-sensor]');
  }

  makeLineSource(W, H) {
    const d = new Float32Array(W * H * 4), x = 30;
    for (let j = 0; j < H; j++) {
      const y = (j + 0.5 - H / 2) / (H * 0.3);
      d[(j * W + x) * 4] = Math.exp(-y * y * y * y);   // flat-topped taper
    }
    const t = new DataTexture(d, W, H, RGBAFormat, FloatType);
    t.needsUpdate = true;
    return t;
  }

  async init() {
    await super.init();
    let dragging = false;
    const set = (e) => {
      const c = this.cellAt(e);
      this.setSensor(c.x);
      this.auto = false; this.userActed = true;
      if (this.out.hint) this.out.hint.classList.add('is-hidden');
    };
    this.canvas.addEventListener('pointerdown', (e) => { dragging = true; set(e); this.canvas.setPointerCapture(e.pointerId); });
    this.canvas.addEventListener('pointermove', (e) => { if (dragging) set(e); });
    this.canvas.addEventListener('pointerup', () => { dragging = false; });
    this.canvas.addEventListener('pointercancel', () => { dragging = false; });
    if (this.range) this.range.addEventListener('input', () => {
      this.auto = false; this.userActed = true;
      const lo = this.sensorMin, hi = this.sensorMax;
      this.setSensor(lo + (hi - lo) * (+this.range.value / 1000));
    });
  }

  build() {
    const W = this.cols, H = this.rows;
    this.lens = { x: W * 0.36, h: H * 0.36, n: N_INDEX };
    const f = W * 0.27;
    const R = 2 * f * (N_INDEX - 1);
    const h = this.lens.h = Math.min(H * 0.36, R * 0.8);   // keep the aperture inside the surfaces' radius (tall phone viewfinders)
    const sag = R - Math.sqrt(Math.max(0, R * R - h * h));
    this.lens.R = R; this.lens.sag = sag;
    const data = new Float32Array(W * H * 4);
    const SP = 26, k = 1 / (N_INDEX * N_INDEX);
    // lens = intersection of two discs of radius R whose centres sit on the axis
    const cy = H / 2, cL = this.lens.x + (R - sag), cR = this.lens.x - (R - sag);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i + 0.5, y = j + 0.5;
      const dL = R - Math.hypot(x - cL, y - cy), dR = R - Math.hypot(x - cR, y - cy);
      const inside = Math.min(dL, dR, h - Math.abs(y - cy));         // > 0 inside
      const a = Math.max(0, Math.min(1, inside / 1.5 + 0.5));          // 1.5-cell soft edge
      const e = Math.min(i, j, W - 1 - i, H - 1 - j);
      const t = Math.max(0, (SP - e) / SP);
      const o = (j * W + i) * 4;
      data[o] = 0; data[o + 1] = 0.18 * t * t; data[o + 2] = 1 + (k - 1) * a; data[o + 3] = 0;
    }
    this.uploadMedium(data);
    this.lensRight = this.lens.x + sag;
    this.sensorMin = Math.ceil(this.lensRight + 8);
    this.sensorMax = W - 34;
    if (this.sensorX === null || this.sensorX > this.sensorMax) this.sensorX = W * 0.86;
    this.focusX = null;
    this.solver.clear();
    this._buildObjects();
    this.setSensor(this.sensorX);
  }

  _buildObjects() {
    if (this.objects) { this.scene.remove(this.objects); this.objects.traverse((o) => o.geometry && o.geometry.dispose()); }
    const g = this.objects = new Group();
    const c = this.W / this.cols, L = this.lens, H = this.rows;
    // glass: the lens cross-section, extruded
    const shape = new Shape();
    const steps = 48, cy = H / 2;
    const cL = L.x + (L.R - L.sag), cR = L.x - (L.R - L.sag);
    const a = Math.asin(Math.min(1, L.h / L.R));
    for (let s = 0; s <= steps; s++) {
      const t = -a + 2 * a * s / steps, px = (cL - L.R * Math.cos(t)) * c, py = -(cy + L.R * Math.sin(t)) * c;
      if (s === 0) shape.moveTo(px, py); else shape.lineTo(px, py);
    }
    for (let s = 0; s <= steps; s++) { const t = a - 2 * a * s / steps; shape.lineTo((cR + L.R * Math.cos(t)) * c, -(cy + L.R * Math.sin(t)) * c); }
    const glass = new Mesh(new ExtrudeGeometry(shape, { depth: 10, bevelEnabled: true, bevelThickness: 3, bevelSize: 2, bevelSegments: 4, curveSegments: 4 }),
      new MeshPhysicalNodeMaterial({ color: 0xbcd4ff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.07, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.03 }));
    g.add(glass);
    // sensor bar and its live profile trace
    this.sensor = new Mesh(new BoxGeometry(2.4, H * c * 0.86, 3), new MeshBasicNodeMaterial({ color: new Color(1.2, 1.15, 1.1) }));
    this.sensor.position.z = 6; g.add(this.sensor);
    const pts = new Float32Array(H * 3);
    this.traceGeo = new BufferGeometry();
    this.traceGeo.setAttribute('position', new BufferAttribute(pts, 3));
    this.trace = new Line(this.traceGeo, new LineBasicNodeMaterial({ color: new Color(1.0, 0.72, 0.35) }));
    this.trace.position.z = 7; this.trace.frustumCulled = false; g.add(this.trace);
    this.scene.add(g);
  }

  place() { this.build(); }

  setSensor(x) {
    this.sensorX = Math.max(this.sensorMin, Math.min(this.sensorMax, x));
    const c = this.W / this.cols;
    if (this.sensor) this.sensor.position.set(this.sensorX * c, -this.rows / 2 * c, 6);
    if (this.range && document.activeElement !== this.range) this.range.value = String(Math.round((this.sensorX - this.sensorMin) / (this.sensorMax - this.sensorMin) * 1000));
  }

  /** Full width at half maximum of a profile, in cells (sub-cell by linear interpolation). */
  static fwhm(p) {
    let m = 0, im = 0;
    for (let i = 0; i < p.length; i++) if (p[i] > m) { m = p[i]; im = i; }
    if (m <= 0) return null;
    const half = m / 2;
    let l = im, r = im;
    while (l > 0 && p[l] > half) l--;
    while (r < p.length - 1 && p[r] > half) r++;
    const lx = l + (half - p[l]) / ((p[l + 1] - p[l]) || 1);
    const rx = r - (half - p[r]) / ((p[r - 1] - p[r]) || 1);
    return { width: rx - lx, peak: m, at: im };
  }

  async _measure() {
    if (this.measuring) return;
    this.measuring = true;
    const H = this.rows;
    const col = await this.solver.probe(Math.round(this.sensorX), 0, 1, H);
    // the full field once, after it settles, to find where the focus really is
    if (this.focusX === null && this.solver.steps > 2200) {   // simulated time: it only steps while visible
      const all = await this.solver.probe(0, 0, this.cols, H);
      if (all) {
        let best = Infinity, bx = null;
        for (let i = Math.ceil(this.lensRight + 4); i < this.cols - 30; i++) {
          const prof = new Float32Array(H);
          for (let j = 0; j < H; j++) prof[j] = all[(j * this.cols + i) * 4 + 2];
          const f = Focus.fwhm(prof);
          if (f && f.width < best && f.peak > 0) { best = f.width; bx = i; }
        }
        this.focusX = bx; this.focusWidth = best;
      }
    }
    this.measuring = false;
    if (!col) return;
    const prof = new Float32Array(H);
    for (let j = 0; j < H; j++) prof[j] = col[j * 4 + 2];
    const f = Focus.fwhm(prof);
    if (!f) return;
    // draw the profile as a trace beside the sensor
    const c = this.W / this.cols, pos = this.traceGeo.attributes.position.array, scale = (this.W * 0.09) / f.peak;
    for (let j = 0; j < H; j++) { pos[j * 3] = this.sensorX * c + 6 + prof[j] * scale; pos[j * 3 + 1] = -(j + 0.5) * c; pos[j * 3 + 2] = 0; }
    this.traceGeo.attributes.position.needsUpdate = true;
    const px = f.width * c;
    const sharp = this.focusX !== null && Math.abs(this.sensorX - this.focusX) < 7;
    const short = this.W < 600;
    this.setText('readout', short ? `spot ${px.toFixed(1)} px` : `spot ${px.toFixed(1)} px wide`);
    if (sharp !== this.wasSharp && this.focusX !== null) {
      this.wasSharp = sharp;
      this.announce(sharp ? `In focus: the spot is ${px.toFixed(0)} pixels wide.` : 'Out of focus.');
    }
    this.setText('state', this.focusX === null ? 'settling' : sharp ? 'sharp' : this.sensorX < this.focusX ? 'soft · focus is further' : 'soft · focus is nearer');
    this.setText('scale', short ? `sensor +${Math.round((this.sensorX - this.lensRight) * c)} px` : `sensor ${Math.round((this.sensorX - this.lensRight) * c)} px behind the lens`);
  }

  frame(now, dt) {
    // a slow rack focus until the reader takes over
    if (this.auto && this.ratio > 0.4 && this.focusX !== null) {
      const t = now / 1000;
      this.setSensor(this.focusX + (this.sensorMax - this.focusX) * 0.6 * (0.5 + 0.5 * Math.sin(t * 0.6)));
    }
    const n = this.shouldStep(now) ? this.takeSteps(dt, RATE) : 0;
    const s = this.solver;
    s.step(n, () => { this.phase += OMEGA; s.uLineAmp.value = 0.012 * Math.sin(this.phase); });
    if (now - (this.lastMeasure || 0) > 140) { this.lastMeasure = now; this._measure(); }
    this.render();
  }
}
