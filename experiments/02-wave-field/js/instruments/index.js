/* ============================================================
   instruments/index.js: the three small instruments embedded in
   the page. Each one gets its own canvas and renderer (so it scrolls
   with the page natively), is created when it comes near the
   viewport, and only renders while it is visible.
   ============================================================ */
const LOADERS = {
  replay: () => import('./replay.js'),
  steer: () => import('./steer.js'),
  focus: () => import('./focus.js'),
};

export class Instruments {
  constructor({ pageRenderer, envs, reduced, backend }) {
    this.ctx = { pageRenderer, envs, reduced, backend };
    this.items = [];
    this.paused = false;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const it = this.items.find((i) => i.el === e.target);
        if (!it) continue;
        it.near = e.isIntersecting;
        if (it.near && !it.instance && !it.loading) this._create(it);
      }
    }, { rootMargin: '120% 0px 120% 0px' });
    const vis = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const it = this.items.find((i) => i.el === e.target);
        if (!it) continue;
        it.visible = e.isIntersecting;
        it.ratio = e.intersectionRatio;
        if (it.instance) it.instance.ratio = it.ratio;
      }
    }, { rootMargin: '0px', threshold: [0, 0.25, 0.55, 0.8, 1] });
    for (const el of document.querySelectorAll('[data-instrument]')) {
      const it = { el, kind: el.dataset.instrument, instance: null, loading: false, near: false, visible: false };
      this.items.push(it);
      io.observe(el); vis.observe(el);
    }
  }

  async _create(it) {
    it.loading = true;
    try {
      const mod = await LOADERS[it.kind]();
      it.instance = new mod.default(it.el, this.ctx);
      it.instance.ratio = it.ratio || 0;
      await it.instance.init();
      it.el.classList.add('is-live');
    } catch (err) {
      console.error(`[wave field] ${it.kind} instrument failed; showing its poster`, err);
      it.instance = null;
    }
    it.loading = false;
  }

  frame(now, dt, paused) {
    for (const it of this.items) if (it.instance && it.visible && !paused) it.instance.frame(now, dt);
  }

  resize() { for (const it of this.items) if (it.instance) it.instance.resize(); }
  setPaused(v) { this.paused = v; }
}
