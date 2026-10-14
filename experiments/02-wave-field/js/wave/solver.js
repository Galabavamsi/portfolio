/* ============================================================
   solver.js: the 2D scalar wave equation on the GPU.

     u_tt + sigma u_t = k c^2 lap(u)

   Leapfrog in time, 5-point Laplacian in space, stepped by
   ping-ponging two float render targets with full-screen passes.
   Works on the WebGPU and the WebGL2 backend of three.js.

   State texel   (R, G, B, A) = (u now, u previous, energy, unused)
   Medium texel  (R, G, B, A) = (solid, sigma, k, neumann)
     solid > 0.5   the cell is a wall; u stays 0 there
     neumann > 0.5 on a solid cell, neighbours see a mirror (dU/dn = 0,
                   reflection +1) instead of a short (U = 0, reflection -1).
                   Flipping a wall cell between the two is a 1-bit RIS element.
     sigma         damping per step (sponges, absorbers)
     k             (c / c0)^2, below 1 inside a lens

   Energy is an exponential moving average of u^2, so a steady beam
   shows up as a steady glow.
   ============================================================ */
import {
  RenderTarget, FloatType, HalfFloatType, NearestFilter, LinearFilter, RGBAFormat,
  QuadMesh, NodeMaterial, Vector4,
} from 'three/webgpu';
import {
  Fn, textureLoad, ivec2, vec2, vec4, float, int, screenCoordinate, uniform, uniformArray,
  Loop, select, clamp, exp, mix, max,
} from 'three/tsl';

export const MAX_SOURCES = 8;

function target(w, h, type, filter = NearestFilter) {
  const rt = new RenderTarget(w, h, {
    type, format: RGBAFormat, minFilter: filter, magFilter: filter,
    depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
  });
  rt.texture.generateMipmaps = false;
  return rt;
}

function pass(node) {
  const m = new NodeMaterial();
  m.fragmentNode = node;
  m.depthTest = false; m.depthWrite = false;
  return new QuadMesh(m);
}

export class WaveSolver {
  /**
   * @param {import('three/webgpu').WebGPURenderer} renderer
   * @param {{ width:number, height:number, c2?:number, energyRate?:number, float32?:boolean }} o
   */
  constructor(renderer, o) {
    this.renderer = renderer;
    this.width = o.width; this.height = o.height;
    this.type = o.float32 === false ? HalfFloatType : FloatType;
    this.rt = [target(this.width, this.height, this.type), target(this.width, this.height, this.type)];
    this.cur = 0;
    this.steps = 0;
    this.medium = target(this.width, this.height, HalfFloatType);
    this.view = target(this.width, this.height, HalfFloatType, LinearFilter);   // filterable display copy

    this.uSize = uniform(vec2(this.width, this.height));
    this.uC2 = uniform(o.c2 ?? 0.25);
    this.uEnergyRate = uniform(o.energyRate ?? 0.03);
    this.uShift = uniform(vec2(0, 0));
    this.sources = Array.from({ length: MAX_SOURCES }, () => new Vector4(0, 0, 1, 0));
    this.uSources = uniformArray(this.sources, 'vec4');
    this.uInject = uniform(new Vector4(0, 0, 1, 0));
    // optional extended source: a texture whose red channel weights a shared amplitude (a line source)
    this.lineTex = o.lineSource || null;
    this.uLineAmp = uniform(0);

    this._build();
    this.clear();
  }

  _build() {
    const size = this.uSize, c2 = this.uC2, er = this.uEnergyRate, src = this.uSources;
    const med = this.medium.texture;

    const step = (stateTex) => Fn(() => {
      const p = ivec2(screenCoordinate.xy).toVar();
      const hi = ivec2(int(size.x).sub(1), int(size.y).sub(1));
      const s = textureLoad(stateTex, p);
      const m = textureLoad(med, p);
      const u = s.x;
      const nb = (dx, dy) => {
        const q = clamp(p.add(ivec2(dx, dy)), ivec2(0, 0), hi);
        const mn = textureLoad(med, q);
        const un = textureLoad(stateTex, q).x;
        return select(mn.x.greaterThan(0.5), select(mn.w.greaterThan(0.5), u, float(0)), un);
      };
      const lap = nb(1, 0).add(nb(-1, 0)).add(nb(0, 1)).add(nb(0, -1)).sub(u.mul(4));
      const half = m.y.mul(0.5);
      const next = u.mul(2).sub(s.y.mul(float(1).sub(half))).add(c2.mul(m.z).mul(lap)).div(float(1).add(half)).toVar();
      const pc = vec2(p).add(0.5);
      Loop(MAX_SOURCES, ({ i }) => {
        const sv = src.element(i);
        const d = pc.sub(sv.xy);
        const r = max(sv.z, 0.5);
        next.addAssign(sv.w.mul(exp(d.dot(d).div(r.mul(r).mul(-2)))));
      });
      if (this.lineTex) next.addAssign(textureLoad(this.lineTex, p).x.mul(this.uLineAmp));
      next.assign(select(m.x.greaterThan(0.5), float(0), next));
      return vec4(next, u, mix(s.z, next.mul(next), er), s.w);
    })();

    // integer shift of the whole state (the field is glued to the page while it scrolls)
    const shift = (stateTex) => Fn(() => {
      const q = ivec2(screenCoordinate.xy).add(ivec2(this.uShift));
      const inside = q.x.greaterThanEqual(0).and(q.y.greaterThanEqual(0))
        .and(q.x.lessThan(int(size.x))).and(q.y.lessThan(int(size.y)));
      const qc = clamp(q, ivec2(0, 0), ivec2(int(size.x).sub(1), int(size.y).sub(1)));
      return select(inside, textureLoad(stateTex, qc), vec4(0));
    })();

    // time reversal: swap now and previous
    const reverse = (stateTex) => Fn(() => {
      const s = textureLoad(stateTex, ivec2(screenCoordinate.xy));
      return vec4(s.y, s.x, s.z, s.w);
    })();

    // a dropped frame: the previous frame is lost, so assume it equals the current one
    const drop = (stateTex) => Fn(() => {
      const s = textureLoad(stateTex, ivec2(screenCoordinate.xy));
      return vec4(s.x, s.x, s.z, s.w);
    })();

    // add a bump to both "now" and "previous": a displacement with zero velocity (a dropped stone),
    // which keeps the forward run free of sources and so exactly reversible
    const inject = (stateTex) => Fn(() => {
      const p = ivec2(screenCoordinate.xy);
      const s = textureLoad(stateTex, p);
      const m = textureLoad(med, p);
      const iv = this.uInject;
      const d = vec2(p).add(0.5).sub(iv.xy);
      const g = iv.w.mul(exp(d.dot(d).div(iv.z.mul(iv.z).mul(-2)))).mul(select(m.x.greaterThan(0.5), float(0), float(1)));
      return vec4(s.x.add(g), s.y.add(g), s.z, s.w);
    })();

    // filterable display copy: (du/dx, du/dy, u, energy)
    const view = (stateTex) => Fn(() => {
      const p = ivec2(screenCoordinate.xy);
      const hi = ivec2(int(size.x).sub(1), int(size.y).sub(1));
      const at = (dx, dy) => textureLoad(stateTex, clamp(p.add(ivec2(dx, dy)), ivec2(0, 0), hi));
      const c = at(0, 0);
      const gx = at(1, 0).x.sub(at(-1, 0).x).mul(0.5);
      const gy = at(0, 1).x.sub(at(0, -1).x).mul(0.5);
      return vec4(gx, gy, c.x, c.z);
    })();

    const zero = Fn(() => vec4(0))();

    // copy any state-shaped texture into a target (snapshots of a recording)
    this._copyNode = textureLoad(this.rt[0].texture, ivec2(screenCoordinate.xy));
    const copy = Fn(() => this._copyNode)();

    this.passes = {
      step: [pass(step(this.rt[0].texture)), pass(step(this.rt[1].texture))],
      shift: [pass(shift(this.rt[0].texture)), pass(shift(this.rt[1].texture))],
      reverse: [pass(reverse(this.rt[0].texture)), pass(reverse(this.rt[1].texture))],
      drop: [pass(drop(this.rt[0].texture)), pass(drop(this.rt[1].texture))],
      inject: [pass(inject(this.rt[0].texture)), pass(inject(this.rt[1].texture))],
      view: [pass(view(this.rt[0].texture)), pass(view(this.rt[1].texture))],
      zero: pass(zero),
      copy: pass(copy),
    };
  }

  get state() { return this.rt[this.cur]; }

  _run(kind) {
    const r = this.renderer, from = this.cur, to = 1 - from;
    r.setRenderTarget(this.rt[to]);
    this.passes[kind][from].render(r);
    this.cur = to;
  }

  clear() {
    const r = this.renderer, prev = r.getRenderTarget();
    for (const rt of this.rt) { r.setRenderTarget(rt); this.passes.zero.render(r); }
    r.setRenderTarget(prev);
    this.steps = 0;
  }

  /** Shift the field by whole cells (positive dy moves content up, as when the page scrolls down). */
  shift(dx, dy) {
    if (!dx && !dy) return;
    this.uShift.value.set(dx, dy);
    const prev = this.renderer.getRenderTarget();
    this._run('shift');
    this.renderer.setRenderTarget(prev);
  }

  /**
   * Advance n steps. `before(i)` may update sources between steps.
   */
  step(n = 1, before) {
    const prev = this.renderer.getRenderTarget();
    for (let i = 0; i < n; i++) {
      if (before) before(i);
      this._run('step');
      this.steps++;
    }
    this.renderer.setRenderTarget(prev);
  }

  /** A render target that can hold a copy of the state. */
  makeSnapshotTarget() { return target(this.width, this.height, this.type); }

  copyTexture(srcTexture, dstTarget) {
    const r = this.renderer, prev = r.getRenderTarget();
    this._copyNode.value = srcTexture;
    r.setRenderTarget(dstTarget);
    this.passes.copy.render(r);
    r.setRenderTarget(prev);
  }

  snapshot(dst) { this.copyTexture(this.state.texture, dst); }
  restore(src) { this.copyTexture(src.texture, this.rt[this.cur]); }

  /** Add a Gaussian bump with zero velocity at (x, y) cells. */
  inject(x, y, radius, amp) {
    this.uInject.value.set(x, y, radius, amp);
    const prev = this.renderer.getRenderTarget();
    this._run('inject');
    this.renderer.setRenderTarget(prev);
  }

  reverse() { const prev = this.renderer.getRenderTarget(); this._run('reverse'); this.renderer.setRenderTarget(prev); }
  dropFrame() { const prev = this.renderer.getRenderTarget(); this._run('drop'); this.renderer.setRenderTarget(prev); }

  /** Refresh the filterable display copy. */
  updateView() {
    const r = this.renderer, prev = r.getRenderTarget();
    r.setRenderTarget(this.view);
    this.passes.view[this.cur].render(r);
    r.setRenderTarget(prev);
  }

  setSource(i, x, y, radius, amp) { this.sources[i].set(x, y, radius, amp); }
  clearSources() { for (const s of this.sources) s.w = 0; }

  /**
   * Read a w x h block of the state, (u, u_prev, energy, _) per texel.
   * Resolves to a tightly packed Float32Array, rows top first, or null.
   * (WebGPU returns rows padded to 256 bytes; WebGL returns rows bottom first.)
   */
  async probe(x, y, w = 1, h = 1) {
    try {
      const gpu = this.renderer.backend.isWebGPUBackend;
      x = Math.round(x); y = Math.round(y);
      const yy = gpu ? y : this.height - y - h;
      const raw = await this.renderer.readRenderTargetPixelsAsync(this.state, x, yy, w, h);
      const out = new Float32Array(w * h * 4);
      const row = w * 4;
      const stride = gpu ? Math.ceil(w * 16 / 256) * 256 / 4 : row;
      for (let r = 0; r < h; r++) {
        const src = r * stride, dst = (gpu ? r : h - 1 - r) * row;
        out.set(raw.subarray(src, src + row), dst);
      }
      return out;
    } catch (e) { return null; }
  }

  dispose() {
    for (const rt of [...this.rt, this.medium, this.view]) rt.dispose();
    for (const k in this.passes) {
      const v = this.passes[k];
      for (const q of Array.isArray(v) ? v : [v]) q.material.dispose();
    }
  }
}
