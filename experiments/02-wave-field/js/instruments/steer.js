/* ============================================================
   steer.js: a 1-bit reconfigurable intelligent surface (RIS).

   Two rooms share a ceiling wall. The transmitter in the left room
   cannot see the reader in the right one. The ceiling is a row of
   N elements, each half a wavelength wide. An element is a stretch of
   wall whose boundary condition is switchable:
     Dirichlet (u = 0)        reflection -1
     Neumann   (mirror)       reflection +1
   a pi phase step, which is what a 1-bit RIS cell's PIN diode does.

   The controller plans the pattern for wherever the pointer is
   (choose each element's sign to line its echo up in phase at the
   receiver, i.e. a reflective Fresnel zone plate) and re-plans on a
   10 Hz loop. A twin simulation with a plain metal ceiling runs
   alongside, and the readout is the measured energy ratio at the
   receiver: the dB gain over a plain wall, from the simulation.
   ============================================================ */
import {
  Mesh, BoxGeometry, CylinderGeometry, TorusGeometry, Group, InstancedMesh, Object3D, DataTexture, RGBAFormat, FloatType,
  NodeMaterial, QuadMesh, MeshPhysicalNodeMaterial, MeshBasicNodeMaterial, Color,
} from 'three/webgpu';
import { Fn, textureLoad, ivec2, vec4, int, float, screenCoordinate, select } from 'three/tsl';
import { InstrumentBase } from './base.js';
import { WaveSolver } from '../wave/solver.js';

const LAMBDA = 16;                     // cells per wavelength
const C = 0.5;
const K = 2 * Math.PI / LAMBDA;
const OMEGA = 2 * Math.PI * C / LAMBDA;
const RATE = 480;
const PLAN_HZ = 10;

export default class Steer extends InstrumentBase {
  constructor(el, ctx) {
    super(el, ctx, { cols: 440 });
    this.gain = 3.2;
    this.mode = 'opt';
    this.plans = 0;
    this.acc = 0;
    this.auto = !ctx.reduced;
    this.dB = null;
    this.buttons = [...el.querySelectorAll('[data-mode]')];
  }

  async init() {
    await super.init();
    for (const b of this.buttons) b.addEventListener('click', () => { this.userActed = true; this.auto = false; this.setMode(b.dataset.mode); });
    // offer keyboard steering only once the simulation is really running
    this.vf.setAttribute('tabindex', '0'); this.vf.setAttribute('role', 'group');
    this.vf.setAttribute('aria-label', 'Steer simulation. Arrow keys move the receiver.');
    const move = (e) => {
      const c = this.cellAt(e);
      if (c.y < this.faceRow + 6 || this.isSolid(c.x, c.y)) return;
      this.rx = { x: c.x, y: c.y };
      this.movedAt = performance.now();
      this.auto = false; this.userActed = true;
      this.hideHint();
    };
    this.canvas.addEventListener('pointermove', move);
    this.canvas.addEventListener('pointerdown', move);
    // keyboard: arrows move the receiver while the viewfinder has focus
    this.vf.addEventListener('keydown', (e) => {
      const d = { ArrowLeft: [-6, 0], ArrowRight: [6, 0], ArrowUp: [0, -6], ArrowDown: [0, 6] }[e.key];
      if (!d) return;
      e.preventDefault();
      const nx = this.rx.x + d[0], ny = this.rx.y + d[1];
      if (ny < this.faceRow + 6 || this.isSolid(nx, ny)) return;
      this.rx = { x: nx, y: ny }; this.movedAt = performance.now(); this.auto = false; this.userActed = true; this.hideHint();
    });
  }

  hideHint() { if (this.out.hint) this.out.hint.classList.add('is-hidden'); }

  build() {
    const W = this.cols, H = this.rows;
    // geometry in cells
    this.faceRow = Math.round(H * 0.2);               // first fluid row under the ceiling
    const el = LAMBDA / 2;
    this.N = Math.floor((W - 40) / el);
    this.x0 = Math.round((W - this.N * el) / 2);
    this.el = el;
    const wallX = Math.round(W * 0.47), wallW = 6, wallTop = Math.round(H * 0.44);
    this.wall = { x0: wallX, x1: wallX + wallW, y0: wallTop, y1: H };
    this.tx = { x: W * 0.2, y: H * 0.74 };
    this.rx = this.rx && this.rx.x < W && this.rx.y < H ? this.rx : { x: W * 0.8, y: H * 0.72 };
    // static medium: ceiling (solid), dividing wall (solid), sponge on the three open sides
    this.solid = new Uint8Array(W * H);
    const data = new Float32Array(W * H * 4);
    const SP = 26;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i;
      const s = j < this.faceRow || (i >= this.wall.x0 && i < this.wall.x1 && j >= this.wall.y0);
      const e = Math.min(i, W - 1 - i, H - 1 - j);
      const t = Math.max(0, (SP - e) / SP);
      this.solid[k] = s ? 1 : 0;
      data[k * 4] = s ? 1 : 0; data[k * 4 + 1] = j >= this.faceRow ? 0.18 * t * t : 0; data[k * 4 + 2] = 1; data[k * 4 + 3] = 0;
    }
    if (this.baseTex) this.baseTex.dispose();
    this.baseTex = new DataTexture(data, W, H, RGBAFormat, FloatType);
    this.baseTex.needsUpdate = true;
    // element signs, one texel per element: 1 = Neumann (+1), 0 = Dirichlet (-1)
    this.bits = new Float32Array(this.N * 4);
    this.bitsTex = new DataTexture(this.bits, this.N, 1, RGBAFormat, FloatType);
    this.plainTex = new DataTexture(new Float32Array(this.N * 4), this.N, 1, RGBAFormat, FloatType);
    this.bitsTex.needsUpdate = true; this.plainTex.needsUpdate = true;
    // the twin with a plain wall
    if (this.twin) this.twin.dispose();
    this.twin = new WaveSolver(this.r, { width: W, height: H, c2: C * C, energyRate: 0.02 });
    this.composeMain = this._composer(this.bitsTex);
    this.composeTwin = this._composer(this.plainTex);
    this._compose(this.composeMain, this.solver);
    this._compose(this.composeTwin, this.twin);
    this.solver.clear(); this.twin.clear();
    this.phase = 0;
    this._buildObjects();
    this.plan(true);
  }

  _composer(bitsTex) {
    const faceY = this.faceRow - 1, x0 = this.x0, el = this.el, N = this.N, base = this.baseTex;
    const m = new NodeMaterial();
    m.fragmentNode = Fn(() => {
      const p = ivec2(screenCoordinate.xy);
      const b = textureLoad(base, p);
      const n = p.x.sub(int(x0)).div(int(el));
      const onFace = p.y.equal(int(faceY)).and(p.x.greaterThanEqual(int(x0))).and(n.lessThan(int(N)));
      const bit = textureLoad(bitsTex, ivec2(n.max(int(0)).min(int(N - 1)), int(0))).x;
      return vec4(b.x, b.y, b.z, select(onFace, bit, b.w));
    })();
    return new QuadMesh(m);
  }

  _compose(quad, solver) {
    const prev = this.r.getRenderTarget();
    this.r.setRenderTarget(solver.medium);
    quad.render(this.r);
    this.r.setRenderTarget(prev);
  }

  _buildObjects() {
    if (this.objects) { this.scene.remove(this.objects); this.objects.traverse((o) => o.geometry && o.geometry.dispose()); }
    const g = this.objects = new Group();
    const c = this.W / this.cols, h = 14;
    const wallMat = new MeshPhysicalNodeMaterial({ color: 0x2a2e35, metalness: 0.2, roughness: 0.6 });
    // ceiling slab and dividing wall
    const ceil = new Mesh(new BoxGeometry(this.W, this.faceRow * c, h), wallMat);
    ceil.position.set(this.W / 2, -this.faceRow * c / 2, h / 2); g.add(ceil);
    const w = this.wall;
    const div = new Mesh(new BoxGeometry((w.x1 - w.x0) * c, (w.y1 - w.y0) * c, h), wallMat);
    div.position.set((w.x0 + w.x1) / 2 * c, -(w.y0 + w.y1) / 2 * c, h / 2); g.add(div);
    // RIS tiles: two-faced flip dots (warm face = +1, cool face = -1)
    const tileGeo = new BoxGeometry(this.el * c * 0.84, this.faceRow * c * 0.34, 1.6);
    const tileMat = new MeshPhysicalNodeMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.35, emissive: 0x000000 });
    this.tiles = new InstancedMesh(tileGeo, tileMat, this.N);
    this.tileState = new Float32Array(this.N);   // animated 0..1 (1 = +1 face up)
    this.tiles.position.z = h + 1.2;
    g.add(this.tiles);
    this._dummy = new Object3D();
    this._warm = new Color(1.0, 0.70, 0.30); this._cool = new Color(0.32, 0.46, 0.72);
    // transmitter: a short antenna
    const ant = new Mesh(new CylinderGeometry(3.2, 3.2, 18, 24), new MeshBasicNodeMaterial({ color: new Color(1.6, 1.1, 0.5) }));
    ant.rotation.x = Math.PI / 2; ant.position.set(this.tx.x * c, -this.tx.y * c, 9); g.add(ant);
    // receiver marker
    this.rxMark = new Mesh(new TorusGeometry(9, 1.1, 8, 48), new MeshBasicNodeMaterial({ color: new Color(1.4, 1.4, 1.35) }));
    this.rxMark.position.z = 4; g.add(this.rxMark);
    this.scene.add(g);
  }

  place() { this.build(); }

  isSolid(x, y) {
    const i = Math.floor(x), j = Math.floor(y);
    if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) return true;
    return this.solid[j * this.cols + i] === 1;
  }

  setMode(m) {
    this.mode = m;
    for (const b of this.buttons) b.setAttribute('aria-pressed', String(b.dataset.mode === m));
    this.setText('mode', m === 'opt' ? 'optimized' : m === 'random' ? 'random pattern' : 'plain wall');
    this.plan(true);
  }

  /** Choose element signs. Each element's echo travels |Tx-e| + |e-Rx|; flip the ones that would arrive out of phase. */
  plan(force = false) {
    const N = this.N, fy = this.faceRow - 0.5;
    const L = new Float64Array(N), a = new Float64Array(N);
    for (let n = 0; n < N; n++) {
      const x = this.x0 + (n + 0.5) * this.el;
      const d1 = Math.hypot(x - this.tx.x, fy - this.tx.y), d2 = Math.hypot(x - this.rx.x, fy - this.rx.y);
      L[n] = d1 + d2; a[n] = 1 / Math.sqrt(d1 * d2);
    }
    let sign = new Int8Array(N);
    if (this.mode === 'off') sign.fill(-1);
    else if (this.mode === 'random') {
      if (!this.randomSigns) { this.randomSigns = new Int8Array(N); let s = 7; for (let n = 0; n < N; n++) { s = (s * 1103515245 + 12345) & 0x7fffffff; this.randomSigns[n] = (s >> 16) & 1 ? 1 : -1; } }
      sign = this.randomSigns;
    } else {
      let best = -1;
      for (let q = 0; q < 16; q++) {
        const th = q * Math.PI / 8;
        let re = 0, im = 0;
        const s = new Int8Array(N);
        for (let n = 0; n < N; n++) {
          s[n] = Math.cos(K * L[n] - th) >= 0 ? 1 : -1;
          re += s[n] * a[n] * Math.cos(K * L[n]); im -= s[n] * a[n] * Math.sin(K * L[n]);
        }
        const mag = re * re + im * im;
        if (mag > best) { best = mag; sign = s; }
      }
    }
    let changed = force;
    for (let n = 0; n < N; n++) {
      const v = sign[n] > 0 ? 1 : 0;
      if (this.bits[n * 4] !== v) { this.bits[n * 4] = v; changed = true; }
    }
    if (changed) {
      this.bitsTex.needsUpdate = true;
      this._compose(this.composeMain, this.solver);
      this.plans++;
      this.changedAt = performance.now();
    }
    this.lastPlan = { x: this.rx.x, y: this.rx.y };
    const ones = Array.from({ length: N }, (_, n) => this.bits[n * 4]).filter(Boolean).length;
    const glyphs = this.W < 900 ? '' : 'surface ' + Array.from({ length: N }, (_, n) => (this.bits[n * 4] ? '▮' : '▯')).join('') + ' · ';
    this.setText('bits', `${glyphs}${ones}/${N} at +1`);
  }

  async _measure() {
    if (this.measuring) return;
    this.measuring = true;
    const x = Math.min(this.cols - 3, Math.max(0, Math.round(this.rx.x) - 1));
    const y = Math.min(this.rows - 3, Math.max(0, Math.round(this.rx.y) - 1));
    const [a, b] = await Promise.all([this.solver.probe(x, y, 3, 3), this.twin.probe(x, y, 3, 3)]);
    this.measuring = false;
    if (!a || !b) return;
    let ea = 0, eb = 0;
    for (let i = 0; i < 9; i++) { ea += a[i * 4 + 2]; eb += b[i * 4 + 2]; }
    if (eb <= 1e-12 || ea <= 1e-12) return;
    const db = 10 * Math.log10(ea / eb);
    // the echo needs about two seconds to cross the room; until then the reading is not a fair one
    const settling = performance.now() - (this.changedAt || 0) < 2400 || performance.now() - (this.movedAt || 0) < 900;
    if (settling) { this.setText('readout', 'settling…'); this.dB = null; return; }
    this.dB = this.dB === null ? db : this.dB + (db - this.dB) * 0.35;
    const s = this.dB >= 0 ? '+' : '−';
    this.setText('readout', `${s}${Math.abs(this.dB).toFixed(1)} dB ${this.W < 600 ? 'vs plain wall' : 'at you vs a plain wall'}`);
    // announce once per settled plan, not every reading
    if (this.announced !== this.plans && performance.now() - (this.changedAt || 0) > 3500) {
      this.announced = this.plans;
      this.announce(`${this.mode === 'opt' ? 'Optimized' : this.mode === 'random' ? 'Random' : 'Plain wall'}: the signal at the receiver is ${this.dB >= 0 ? 'up' : 'down'} ${Math.abs(this.dB).toFixed(1)} decibels compared with a plain wall.`);
    }
  }

  frame(now, dt) {
    // demo path until the reader takes over
    // demo: the receiver hops between a few spots and waits for the beam to form at each
    if (this.auto && this.ratio > 0.4 && now - (this.hopAt || 0) > 7000) {
      this.hopAt = now;
      const spots = [[0.80, 0.70], [0.66, 0.56], [0.90, 0.48], [0.72, 0.84]];
      const [fx, fy] = spots[(this.hop = ((this.hop ?? -1) + 1) % spots.length)];
      this.rx = { x: this.cols * fx, y: this.rows * fy };
      this.dB = null;
    }
    if (now - (this.lastPlanAt || 0) > 1000 / PLAN_HZ) {
      this.lastPlanAt = now;
      const lp = this.lastPlan;
      if (!lp || Math.hypot(lp.x - this.rx.x, lp.y - this.rx.y) > 1.5) this.plan();
      this.setText('mode', (this.mode === 'opt' ? 'optimized' : this.mode === 'random' ? 'random pattern' : 'plain wall') + ` · plan ${this.plans} · ${PLAN_HZ} Hz`);
    }
    // step both rooms with the same transmitter
    const n = this.shouldStep(now) ? this.takeSteps(dt, RATE) : 0;
    for (let i = 0; i < n; i++) {
      this.phase += OMEGA;
      const amp = 0.07 * Math.sin(this.phase);
      this.solver.setSource(0, this.tx.x, this.tx.y, 1.6, amp);
      this.twin.setSource(0, this.tx.x, this.tx.y, 1.6, amp);
      this.solver.step(1); this.twin.step(1);
    }
    if (now - (this.lastMeasure || 0) > 180) { this.lastMeasure = now; this._measure(); }
    // flip-dot tiles ease toward their states
    const c = this.W / this.cols, d = this._dummy;
    for (let k = 0; k < this.N; k++) {
      const target = this.bits[k * 4];
      this.tileState[k] += (target - this.tileState[k]) * Math.min(1, dt * 9);
      const s = this.tileState[k];
      // a flip-dot seen from above: it squashes to an edge and comes back showing the other face
      const flip = Math.abs(s - 0.5) * 2;
      d.position.set((this.x0 + (k + 0.5) * this.el) * c, -this.faceRow * c * 0.78, 0);
      d.scale.set(1, Math.max(0.04, flip), 1);
      d.updateMatrix();
      this.tiles.setMatrixAt(k, d.matrix);
      this.tiles.setColorAt(k, s > 0.5 ? this._warm : this._cool);
    }
    this.tiles.instanceMatrix.needsUpdate = true;
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;
    this.rxMark.position.x = this.rx.x * c; this.rxMark.position.y = -this.rx.y * c;
    this.render();
  }
}
