/* ============================================================
   page-field.js: the wave field the whole page is printed on.

   Coordinates: page pixels (x right, y down from the top of the
   document). World units are the same pixels with y flipped, on the
   plane z = 0. The simulation covers the viewport plus a margin, and
   is glued to the page: when the page scrolls by whole cells, the
   field is shifted by the same number of cells, so a ripple stays
   where you made it and leaves with the content.

   The medium is rebuilt whenever the window moves:
     - the chrome name's footprint, rendered from above from the same
       mesh you see, is a wall (u = 0): the waves reflect off it;
     - blocks marked data-absorb are absorbers (the field goes quiet
       under the words), data-absorb="plate" blocks are metal plates,
       and a data-absorb="frame" box is a closed tank;
     - the window's margin is a sponge.
   ============================================================ */
import {
  Scene, Color, Mesh, PlaneGeometry, Vector2, Vector4, RenderTarget, HalfFloatType, OrthographicCamera,
  MeshBasicNodeMaterial, MeshPhysicalNodeMaterial, NodeMaterial, QuadMesh, BufferGeometry, BufferAttribute, Group,
} from 'three/webgpu';
import {
  Fn, textureLoad, vec2, vec4, float, ivec2, screenCoordinate, uniform, uniformArray, positionWorld,
  clamp, smoothstep, abs, max, min, length, select, step, Loop,
} from 'three/tsl';
import { WaveSolver } from '../wave/solver.js';
import { PageCamera } from '../scene/page-camera.js';
import { waterMaterial } from './surface.js';

const MAX_RECTS = 40;
const KIND = { NONE: 0, ABSORB: 1, PLATE: 2, FRAME: 3 };
const C = 0.5;                       // wave speed in cells per step
const STEPS_PER_SECOND = 480;

const ricker = (t) => (1 - 2 * t * t) * Math.exp(-t * t);
const clamp01 = (v) => Math.max(0, Math.min(1, v));

export class PageField {
  /**
   * @param {import('three/webgpu').WebGPURenderer} renderer
   * @param {{ envs: {metal, water}, name: import('three/webgpu').Object3D, reduced: boolean, cell: number }} o
   */
  constructor(renderer, o) {
    this.r = renderer;
    this.envs = o.envs;
    this.reduced = o.reduced;
    this.cell = o.cell;
    this.margin = 32;
    this.scene = new Scene();
    this.scene.background = new Color(0x030507);
    this.scene.environment = this.envs.metal;
    this.cam = new PageCamera(28);

    this.rects = Array.from({ length: MAX_RECTS }, () => new Vector4());
    this.kinds = Array.from({ length: MAX_RECTS }, () => new Vector4());
    this.uRects = uniformArray(this.rects, 'vec4');
    this.uKinds = uniformArray(this.kinds, 'vec4');
    this.uWin = uniform(new Vector4(0, 0, 2, 0));     // window origin (page px) and cell size
    this.uWinSize = uniform(new Vector2(1, 1));        // window size (page px)
    this.uSponge = uniform(this.margin - 4);

    this.pointer = { x: -1e4, y: -1e4, px: -1e4, py: -1e4, last: -1e9, inside: false, over: null };
    this.pulses = [];
    this.trades = [];
    this.allRects = [];
    this.stepAcc = 0;
    this.phase = 0;
    this.activeUntil = 0;
    this.eye = { x: 0, y: 0, tx: 0, ty: 0 };
    this.frames = 0;
    this.totalSteps = 0;
    this.lastScroll = -1;
    this.paused = false;

    this._setupName(o.name);
    this._bind();
    this.resize();
  }

  /* ---------------- name ---------------- */
  _setupName(gltfScene) {
    this.nameRoot = new Group();
    this.chrome = new MeshPhysicalNodeMaterial({ color: 0xece6dc, metalness: 1.0, roughness: 0.16 });
    // split the single mesh into its two words, so the name can break onto two lines on phones
    let mesh = null;
    gltfScene.traverse((n) => { if (n.isMesh && !mesh) mesh = n; });
    const words = splitWords(mesh.geometry);
    this.words = words.map((g) => {
      const m = new Mesh(g, this.chrome);
      m.rotation.x = Math.PI / 2;      // glTF y-up (height along +y) -> world z up
      this.nameRoot.add(m);
      g.computeBoundingBox();
      return { mesh: m, box: g.boundingBox.clone() };
    });
    this.scene.add(this.nameRoot);
    // footprint copy
    this.maskScene = new Scene();
    this.maskScene.background = new Color(0x000000);
    const white = new MeshBasicNodeMaterial({ color: 0xffffff });
    this.maskWords = this.words.map((w) => { const m = new Mesh(w.mesh.geometry, white); m.rotation.x = Math.PI / 2; this.maskScene.add(m); return m; });
    this.maskCam = new OrthographicCamera(0, 1, 0, -1, -4000, 4000);
    this.maskCam.position.set(0, 0, 2000);
  }

  /** Fit the 3D words onto the transparent DOM heading, line by line. */
  _layoutName() {
    const span = document.querySelector('.hero-name-text');
    if (!span) return;
    const range = document.createRange();
    range.selectNodeContents(span);
    const lines = [...range.getClientRects()].filter((r) => r.width > 2);
    const sy = window.scrollY;
    const place = (w, r) => {
      const bw = w.box.max.x - w.box.min.x;
      const s = r.width / bw * 0.985;
      const cx = (w.box.max.x + w.box.min.x) / 2, cz = (w.box.max.z + w.box.min.z) / 2;
      w.mesh.scale.setScalar(s);
      // glTF z runs down the page; centre the caps a little above the line box's middle
      w.mesh.position.set(r.left + r.width / 2 - cx * s, -(r.top + sy + r.height * 0.5) + cz * s, 0);
    };
    if (lines.length >= 2) {
      // one line per word
      place(this.words[0], lines[0]);
      place(this.words[1], lines[lines.length - 1]);
    } else if (lines.length === 1) {
      const r = lines[0];
      // keep the two words' natural spacing: scale the pair as one
      const b0 = this.words[0].box, b1 = this.words[1].box;
      const total = b1.max.x - b0.min.x;
      const s = r.width / total * 0.985;
      const cz = (b0.max.z + b0.min.z) / 2;
      const x0 = r.left + r.width / 2 - ((b0.min.x + b1.max.x) / 2) * s;
      for (const w of this.words) { w.mesh.scale.setScalar(s); w.mesh.position.set(x0, -(r.top + sy + r.height * 0.5) + cz * s, 0); }
    }
    for (let i = 0; i < this.words.length; i++) {
      this.maskWords[i].position.copy(this.words[i].mesh.position);
      this.maskWords[i].scale.copy(this.words[i].mesh.scale);
    }
    // page-space bounds for culling the footprint render
    const b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    for (const r of lines) { b.x0 = Math.min(b.x0, r.left); b.x1 = Math.max(b.x1, r.right); b.y0 = Math.min(b.y0, r.top + sy); b.y1 = Math.max(b.y1, r.bottom + sy); }
    this.nameBounds = b;
  }

  /* ---------------- layout ---------------- */
  resize() {
    const VW = Math.max(1, innerWidth), VH = Math.max(1, innerHeight, this.r.domElement.clientHeight || 0);
    if (this.solver && VW === this.VW && Math.abs(VH - this.VH) < 120 && this.solverH >= Math.ceil(VH / this.cell) + 2 * this.margin) {
      // mobile URL bar show/hide: keep the field
      this.VH = VH; this.layout(); return;
    }
    this.VW = VW; this.VH = VH;
    const M = this.margin;
    this.pulses = [];
    this.cell = VW < 760 ? 3 : 2;
    const cell = this.cell;
    const CW = Math.ceil(VW / cell) + 2 * M, CH = Math.ceil((VH + 140) / cell) + 2 * M;
    if (this.solver) { this.totalSteps += this.solver.steps; this.solver.dispose(); }
    this.solver = new WaveSolver(this.r, { width: CW, height: CH, c2: C * C, energyRate: 0.02 });
    this.solverH = CH;
    this.CW = CW; this.CH = CH;
    this.uWinSize.value.set(CW * cell, CH * cell);
    this.uWin.value.z = cell;
    this.uSponge.value = M - 4;
    if (this.maskRT) this.maskRT.dispose();
    this.maskRT = new RenderTarget(CW, CH, { type: HalfFloatType, depthBuffer: true });
    this._buildMedium();
    this._buildSurface();
    this.snapY = Math.round(scrollY / cell) * cell;
    this.layout();
  }

  layout() {
    this._layoutName();
    const sy = window.scrollY;
    const list = [];
    for (const el of document.querySelectorAll('[data-absorb]')) {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const kind = el.dataset.absorb === 'plate' ? KIND.PLATE : KIND.ABSORB;
      list.push({ x: r.left, y: r.top + sy, w: r.width, h: r.height, kind, a: 0.07, b: 26, rad: 4 });
    }
    const stage = document.querySelector('[data-trades]');
    this.trades = [];
    if (stage) {
      const r = stage.getBoundingClientRect();
      list.push({ x: r.left, y: r.top + sy, w: r.width, h: r.height, kind: KIND.FRAME, a: 0.0035, b: 5, rad: 0 });
      for (const t of stage.querySelectorAll('.trade')) {
        const tr = t.getBoundingClientRect();
        this.trades.push({ x: tr.left + tr.width / 2, y: tr.top + sy + 3.5, lambda: +t.dataset.lambda || 16 });
      }
      this.tradesBox = { y0: r.top + sy, y1: r.bottom + sy };
    }
    this.allRects = list;
    // where the idle source may wander: empty hero space (beside the copy on wide screens, under the buttons on phones)
    const copy = document.querySelector('.hero-copy'), hero = document.querySelector('.hero');
    if (copy && hero) {
      const c = copy.getBoundingClientRect(), h = hero.getBoundingClientRect();
      const wide = this.VW >= 900 && this.VW - c.right > 260;
      this.ghostZone = wide
        ? { x0: c.right + 60, x1: this.VW - 170, y0: c.top + sy - 40, y1: c.bottom + sy + 140 }
        : { x0: this.VW * 0.15, x1: this.VW * 0.85, y0: c.bottom + sy + 40, y1: h.bottom + sy - 30 };
    }
    const send = document.querySelector('[data-send] .send-ring');
    if (send) { const r = send.getBoundingClientRect(); this.sendPos = { x: r.left + r.width / 2, y: r.top + sy + r.height / 2 }; }
    this.mediumDirty = true;
    this.kick(2);
  }

  /* ---------------- passes ---------------- */
  _buildMedium() {
    const uR = this.uRects, uK = this.uKinds, uW = this.uWin, uS = this.uSponge;
    const CW = this.CW, CH = this.CH, mask = this.maskRT.texture;
    const mat = new NodeMaterial();
    mat.fragmentNode = Fn(() => {
      const ip = ivec2(screenCoordinate.xy);
      const p = vec2(ip).add(0.5);
      const page = uW.xy.add(p.mul(uW.z));
      const solid = textureLoad(mask, ip).x.greaterThan(0.5).select(float(1), float(0)).toVar();
      const e = p.x.min(p.y).min(float(CW).sub(p.x)).min(float(CH).sub(p.y));
      const t = clamp(uS.sub(e).div(uS), 0, 1);
      const sigma = t.mul(t).mul(0.18).toVar();   // quadratic sponge, ~-30 dB (see tools notes)
      Loop(MAX_RECTS, ({ i }) => {
        const r = uR.element(i), k = uK.element(i);
        const hs = r.zw.mul(0.5);
        const q = abs(page.sub(r.xy.add(hs))).sub(hs).add(k.w);
        const sd = length(max(q, 0)).add(min(max(q.x, q.y), 0)).sub(k.w);   // < 0 inside
        const isA = k.x.greaterThan(0.5).and(k.x.lessThan(1.5));
        const isP = k.x.greaterThan(1.5).and(k.x.lessThan(2.5));
        const isF = k.x.greaterThan(2.5);
        sigma.assign(max(sigma, select(isA, k.y.mul(smoothstep(0, k.z, sd.negate())), 0)));
        solid.assign(max(solid, select(isP, step(sd, 0), 0)));
        solid.assign(max(solid, select(isF, step(abs(sd), k.z), 0)));
        sigma.assign(max(sigma, select(isF, k.y.mul(step(sd, 0)), 0)));
      });
      return vec4(solid, sigma, 1, 0);
    })();
    if (this.mediumQuad) this.mediumQuad.material.dispose();
    this.mediumQuad = new QuadMesh(mat);
  }

  _buildSurface() {
    const W = this.uWin, S = this.uWinSize;
    const uv = vec2(positionWorld.x.sub(W.x).div(S.x), positionWorld.y.negate().sub(W.y).div(S.y));
    const mat = waterMaterial({ view: this.solver.view.texture, uv, env: this.envs.water });
    if (this.surface) { this.scene.remove(this.surface); this.surface.material.dispose(); this.surface.geometry.dispose(); }
    this.surface = new Mesh(new PlaneGeometry(1, 1), mat);
    this.surface.renderOrder = -1;
    this.scene.add(this.surface);
    this.surfaceU = mat.userData.u;
  }

  _updateMedium() {
    const cell = this.cell, M = this.margin;
    const wx0 = -M * cell, wy0 = this.snapY - M * cell;
    const ww = this.CW * cell, wh = this.CH * cell;
    this.uWin.value.set(wx0, wy0, cell, 0);
    // rects that touch the window
    let n = 0;
    for (const r of this.allRects) {
      if (n >= MAX_RECTS) break;
      if (r.y + r.h < wy0 - 40 || r.y > wy0 + wh + 40) continue;
      this.rects[n].set(r.x, r.y, r.w, r.h);
      this.kinds[n].set(r.kind, r.a, r.b, r.rad);
      n++;
    }
    for (let i = n; i < MAX_RECTS; i++) this.kinds[i].set(0, 0, 1, 0);
    // footprint of the name
    const nb = this.nameBounds;
    const r = this.r, prev = r.getRenderTarget();
    const cam = this.maskCam;
    cam.left = wx0; cam.right = wx0 + ww; cam.top = -wy0; cam.bottom = -(wy0 + wh);
    cam.updateProjectionMatrix();
    const nameIn = nb && nb.y1 > wy0 && nb.y0 < wy0 + wh;
    for (const m of this.maskWords) m.visible = !!nameIn;
    r.setRenderTarget(this.maskRT);
    r.render(this.maskScene, cam);
    r.setRenderTarget(this.solver.medium);
    this.mediumQuad.render(r);
    r.setRenderTarget(prev);
    // the visible surface covers the window (and more, for the opening shot)
    this.surface.scale.set(ww * 3, wh * 3, 1);
    this.surface.position.set(wx0 + ww / 2, -(wy0 + wh / 2), 0);
    this.mediumDirty = false;
  }

  /* ---------------- input ---------------- */
  _bind() {
    const interactive = 'a, button, summary, input, textarea, select, label, .vf, .strip';
    addEventListener('pointermove', (e) => {
      const p = this.pointer;
      p.x = e.clientX; p.y = e.clientY + scrollY; p.last = performance.now();
      p.over = e.target instanceof Element ? e.target.closest('.vf') : null;
      if (e.pointerType === 'mouse' && !this.reduced) {
        this.eye.tx = (e.clientX / this.VW - 0.5);
        this.eye.ty = (0.5 - e.clientY / this.VH);
      }
      if (!p.over) this.kick();
    }, { passive: true });
    addEventListener('pointerdown', (e) => {
      if (!(e.target instanceof Element) || e.target.closest(interactive)) return;
      this.pulse(e.clientX, e.clientY + scrollY, 1);
    }, { passive: true });
    for (const t of document.querySelectorAll('[data-source]')) {
      t.addEventListener('pointerenter', () => {
        const r = t.getBoundingClientRect();
        this.pulse(r.left - 9, r.top + scrollY - 9, 0.55, 13);
      });
    }
    const send = document.querySelector('[data-send]');
    if (send) {
      send.addEventListener('pointerenter', () => this.sendPos && this.pulse(this.sendPos.x, this.sendPos.y, 0.8));
      send.addEventListener('click', () => this.sendPos && this.pulse(this.sendPos.x, this.sendPos.y, 1.6));
    }
  }

  /** A broadband pulse (Ricker wavelet) at page coordinates. */
  pulse(x, y, amp = 1, lambda = 20) {
    if (!this.solver) return;
    this.pulses.push({ x, y, amp, t0: this.solver.steps, width: lambda / (Math.PI * C) * 0.9 });
    if (this.pulses.length > 2) this.pulses.shift();
    this.kick();
  }

  /** Keep stepping for a while (the field settles in a few seconds after the last excitation). */
  kick(seconds = 7) { this.activeUntil = Math.max(this.activeUntil, performance.now() + seconds * 1000); }

  /* ---------------- frame ---------------- */
  frame(now, dt) {
    if (!this.solver) return false;
    const cell = this.cell, M = this.margin, sy = window.scrollY;
    // glue the field to the page
    const d = Math.round((sy - this.snapY) / cell);
    if (d !== 0) {
      if (Math.abs(d) >= this.CH) { this.totalSteps += this.solver.steps; this.solver.clear(); this.pulses = []; } else this.solver.shift(0, d);
      this.snapY += d * cell;
      this.mediumDirty = true;
    }
    if (this.mediumDirty) this._updateMedium();
    const scrolled = sy !== this.lastScroll;
    this.lastScroll = sy;

    // sources
    const p = this.pointer;
    const toCellX = (x) => (x + M * cell) / cell;
    const toCellY = (y) => (y - (this.snapY - M * cell)) / cell;
    const idle = now - p.last;
    const presence = this.reduced || p.over ? 0 : clamp01(1 - idle / 900);
    const heroIn = sy < this.VH * 0.9;
    let ghost = 0, gx = 0, gy = 0;
    if (!this.reduced && heroIn && idle > 2500 && this.ghostZone) {
      // wave trains with calm in between: about 5 s on, 4 s off
      const t = now / 1000, z = this.ghostZone;
      const train = Math.max(0, Math.sin(t * 0.7)) ** 0.6;
      ghost = clamp01((idle - 2500) / 1500) * 0.75 * train;
      gx = (z.x0 + z.x1) / 2 + (z.x1 - z.x0) * 0.45 * Math.sin(t * 0.29);
      gy = (z.y0 + z.y1) / 2 + (z.y1 - z.y0) * 0.45 * Math.sin(t * 0.47 + 1.0);
      this.kick(1);
    }
    const tb = this.tradesBox;
    const tradesOn = !this.reduced && tb && tb.y1 > sy - 50 && tb.y0 < sy + this.VH + 50;
    if (tradesOn) this.kick(1);
    const pulsing = this.pulses.length > 0;
    const k = this.reduced || this.paused ? 0 : 0.045;
    const moving = Math.abs(this.eye.x - this.eye.tx * this.VW * k) > 0.3 || Math.abs(this.eye.y - this.eye.ty * this.VH * k) > 0.3;
    const active = now < this.activeUntil || pulsing || this.mediumDirty;
    // paused: keep following the page (the canvas is fixed), but do not step
    if (!scrolled && !moving && this.frames > 2 && (this.paused || !active)) return false;

    // step count from real time, so waves move at the same speed on 60 and 120 Hz screens
    this.stepAcc += Math.min(dt, 1 / 20) * STEPS_PER_SECOND;
    const n = this.paused ? 0 : Math.min(16, Math.floor(this.stepAcc));
    this.stepAcc = n === 16 || this.paused ? 0 : this.stepAcc - n;   // drop any backlog after a slow frame
    const omega = 2 * Math.PI * C / 16;
    const s = this.solver;
    const px0 = p.px, py0 = p.py;
    s.step(n, (i) => {
      const a = (i + 1) / Math.max(1, n);
      this.phase += omega;
      // slot 0: the pointer (or the ghost when the pointer rests)
      if (presence > 0 && px0 > -1e3) {
        const x = px0 + (p.x - px0) * a, y = py0 + (p.y - py0) * a;
        s.setSource(0, toCellX(x), toCellY(y), 1.5, 0.08 * presence * Math.sin(this.phase));
      } else if (ghost > 0) {
        s.setSource(0, toCellX(gx), toCellY(gy), 1.5, 0.08 * ghost * Math.sin(this.phase));
      } else s.setSource(0, 0, 0, 1, 0);
      // slots 1-2: pulses
      for (let k = 0; k < 2; k++) {
        const q = this.pulses[k];
        if (!q) { s.setSource(1 + k, 0, 0, 1, 0); continue; }
        const tt = (s.steps - q.t0 - 3 * q.width) / q.width;
        s.setSource(1 + k, toCellX(q.x), toCellY(q.y), 2.0, 0.55 * q.amp * ricker(tt));
      }
      // slots 3-7: the five trades in the About tank
      for (let k = 0; k < 5; k++) {
        const t = this.trades[k];
        if (!t || !tradesOn) { s.setSource(3 + k, 0, 0, 1, 0); continue; }
        const w = 2 * Math.PI * C / t.lambda;
        s.setSource(3 + k, toCellX(t.x), toCellY(t.y), 1.4, 0.035 * Math.sin(w * s.steps + k * 1.7));
      }
    });
    p.px = p.x; p.py = p.y;
    this.pulses = this.pulses.filter((q) => s.steps - q.t0 < 8 * q.width);
    s.updateView();

    // camera: the viewport rectangle of the page, with a little parallax
    this.eye.x += (this.eye.tx * this.VW * k - this.eye.x) * 0.06;
    this.eye.y += (this.eye.ty * this.VH * k - this.eye.y) * 0.06;
    this.cam.setRect(0, this.VW, -(sy + this.VH), -sy);
    this.cam.eye.x = this.eye.x; this.cam.eye.y = this.eye.y;
    this.cam.update();
    this.frames++;
    return true;
  }

  render(target = null) {
    this.r.setRenderTarget(target);
    this.r.render(this.scene, this.cam);
  }

  stats() {
    return { cells: `${this.CW}×${this.CH}`, cell: this.cell, steps: this.totalSteps + (this.solver ? this.solver.steps : 0) };
  }
}

/* Split a name mesh into words by the widest empty gap in x. */
function splitWords(geometry) {
  const pos = geometry.attributes.position, idx = geometry.index;
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  const vi = (t, j) => (idx ? idx.getX(t * 3 + j) : t * 3 + j);
  const cx = new Float32Array(triCount);
  let minX = Infinity, maxX = -Infinity;
  for (let t = 0; t < triCount; t++) {
    const x = (pos.getX(vi(t, 0)) + pos.getX(vi(t, 1)) + pos.getX(vi(t, 2))) / 3;
    cx[t] = x; minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  }
  // occupancy histogram; find the widest empty run near the middle
  const B = 400, occ = new Uint8Array(B);
  for (let i = 0; i < pos.count; i++) occ[Math.min(B - 1, Math.floor((pos.getX(i) - minX) / (maxX - minX) * B))] = 1;
  let best = { len: 0, at: B / 2 };
  for (let i = Math.floor(B * 0.25); i < B * 0.75;) {
    if (occ[i]) { i++; continue; }
    let j = i; while (j < B && !occ[j]) j++;
    if (j - i > best.len) best = { len: j - i, at: (i + j) / 2 };
    i = j;
  }
  const split = minX + (best.at / B) * (maxX - minX);
  const parts = [[], []];
  for (let t = 0; t < triCount; t++) parts[cx[t] < split ? 0 : 1].push(t);
  return parts.map((tris) => {
    const g = new BufferGeometry();
    for (const name of Object.keys(geometry.attributes)) {
      const a = geometry.attributes[name], size = a.itemSize;
      const arr = new Float32Array(tris.length * 3 * size);
      let o = 0;
      for (const t of tris) for (let j = 0; j < 3; j++) { const v = vi(t, j); for (let c = 0; c < size; c++) arr[o++] = a.getComponent(v, c); }
      g.setAttribute(name, new BufferAttribute(arr, size));
    }
    return g;
  });
}
