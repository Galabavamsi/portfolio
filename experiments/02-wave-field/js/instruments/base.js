/* ============================================================
   base.js: what every instrument shares.

   Its own canvas and renderer (on WebGPU it reuses the page's
   GPUDevice), a solver sized to the viewfinder's aspect, the same
   liquid surface as the page, and a top-down camera with a little
   parallax. Local units are the viewfinder's CSS pixels, with
   y flipped into world space like the page.
   ============================================================ */
import {
  WebGPURenderer, AgXToneMapping, Scene, Color, Mesh, PlaneGeometry, DataTexture, FloatType, RGBAFormat,
  NodeMaterial, QuadMesh, MeshPhysicalNodeMaterial,
} from 'three/webgpu';
import { Fn, texture, uv, vec2, positionWorld } from 'three/tsl';
import { WaveSolver } from '../wave/solver.js';
import { PageCamera } from '../scene/page-camera.js';
import { makeEnvironments } from '../scene/studio.js';
import { waterMaterial } from '../field/surface.js';

export class InstrumentBase {
  constructor(el, ctx, opts = {}) {
    this.el = el;
    this.ctx = ctx;
    this.vf = el.querySelector('.vf');
    this.canvas = el.querySelector('.vf-canvas');
    this.out = {};
    for (const n of el.querySelectorAll('[data-out]')) this.out[n.dataset.out] = n;
    this.cols = opts.cols || 480;
    this.solverOpts = opts.solver || {};
    this.eye = { x: 0, y: 0, tx: 0, ty: 0 };
    this.hover = false;
    this.userActed = false;     // announcements and reduced-motion stepping follow the reader, not the demos
    this.engagedAt = -1e9;
  }

  async init() {
    const ctx = this.ctx, page = ctx.pageRenderer;
    const params = { canvas: this.canvas, antialias: true, powerPreference: 'high-performance' };
    if (page.backend.isWebGPUBackend && page.backend.device) params.device = page.backend.device;
    else params.forceWebGL = true;
    const r = this.r = new WebGPURenderer(params);
    r.toneMapping = AgXToneMapping;
    r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    await r.init();
    this.envs = makeEnvironments(r);
    this.scene = new Scene();
    this.scene.background = new Color(0x000000);
    this.scene.environment = this.envs.metal;
    this.cam = new PageCamera(30);
    this.metal = new MeshPhysicalNodeMaterial({ color: 0x59606b, metalness: 0.45, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    this._bindPointer();
    this.resize(true);
  }

  /** Viewfinder size in CSS px. */
  size() { const b = this.vf.getBoundingClientRect(); return { w: Math.max(1, b.width), h: Math.max(1, b.height) }; }

  resize(first = false) {
    const { w, h } = this.size();
    this.r.setSize(w, h, false);
    const rows = Math.round(this.cols * h / w);
    const rebuild = first || !this.solver || rows !== this.rows;
    this.W = w; this.H = h; this.cell = w / this.cols;
    this.cam.setRect(0, w, -h, 0);
    if (rebuild) {
      this.rows = rows;
      if (this.solver) this.solver.dispose();
      this.solver = new WaveSolver(this.r, { width: this.cols, height: rows, c2: 0.25, energyRate: 0.02, ...this.solverOpts, lineSource: this.makeLineSource ? this.makeLineSource(this.cols, rows) : undefined });
      this._buildSurface();
      this.build();   // subclass: medium, objects, state
    } else {
      this._buildSurface();
      this.place();   // subclass: re-place objects at the new scale
    }
    this.frameOnce = true;
  }

  _buildSurface() {
    const W = this, mat = waterMaterial({
      view: this.solver.view.texture,
      uv: vec2(positionWorld.x.div(this.W), positionWorld.y.negate().div(this.H)),
      env: this.envs.water, gain: this.gain || 7, crest: 0.42,
    });
    if (this.surface) { this.scene.remove(this.surface); this.surface.material.dispose(); }
    this.surface = new Mesh(new PlaneGeometry(1, 1), mat);
    this.surface.scale.set(this.W * 1.2, this.H * 1.2, 1);
    this.surface.position.set(this.W / 2, -this.H / 2, 0);
    this.surface.renderOrder = -1;
    this.scene.add(this.surface);
    this.surfaceU = mat.userData.u;
  }

  /** Upload a medium built on the CPU: Float32Array (cols*rows*4) of (solid, sigma, k, neumann). */
  uploadMedium(data) {
    const tex = new DataTexture(data, this.cols, this.rows, RGBAFormat, FloatType);
    tex.needsUpdate = true;
    const m = new NodeMaterial();
    m.fragmentNode = Fn(() => texture(tex, uv()))();
    const q = new QuadMesh(m);
    const prev = this.r.getRenderTarget();
    this.r.setRenderTarget(this.solver.medium);
    q.render(this.r);
    this.r.setRenderTarget(prev);
    m.dispose();
    tex.dispose();
  }

  /** Cell coordinates of a pointer event. */
  cellAt(e) {
    const b = this.canvas.getBoundingClientRect();
    return { x: (e.clientX - b.left) / b.width * this.cols, y: (e.clientY - b.top) / b.height * this.rows };
  }

  _bindPointer() {
    this.canvas.addEventListener('pointerenter', () => { this.hover = true; });
    for (const ev of ['pointerdown', 'pointermove', 'keydown', 'input', 'click']) this.el.addEventListener(ev, () => { this.engagedAt = performance.now(); }, { passive: true });
    this.canvas.addEventListener('pointerleave', () => { this.hover = false; this.eye.tx = 0; this.eye.ty = 0; });
    this.canvas.addEventListener('pointermove', (e) => {
      const b = this.canvas.getBoundingClientRect();
      this.eye.tx = (e.clientX - b.left) / b.width - 0.5;
      this.eye.ty = 0.5 - (e.clientY - b.top) / b.height;
    });
  }

  /** Under reduced motion, only simulate while the reader is using this instrument. */
  shouldStep(now) { return !this.ctx.reduced || now - this.engagedAt < 6000; }

  /** Steps for this frame from real time; drops any backlog after a slow frame. */
  takeSteps(dt, rate, cap = 12) {
    this.acc = (this.acc || 0) + Math.min(dt, 0.05) * rate;
    const n = Math.min(cap, Math.floor(this.acc));
    this.acc = n === cap ? 0 : this.acc - n;
    return n;
  }

  announce(text) { if (this.userActed) this.setText('live', text); }

  setText(key, text) { const n = this.out[key]; if (n && n.textContent !== text) n.textContent = text; }

  render() {
    const k = this.ctx.reduced ? 0 : 0.03;
    this.eye.x += (this.eye.tx * this.W * k - this.eye.x) * 0.08;
    this.eye.y += (this.eye.ty * this.H * k - this.eye.y) * 0.08;
    this.cam.eye.x = this.eye.x; this.cam.eye.y = this.eye.y;
    this.cam.update();
    this.solver.updateView();
    this.r.render(this.scene, this.cam);
  }

  // subclasses implement build(), place(), frame(now, dt)
  build() {}
  place() {}
}
