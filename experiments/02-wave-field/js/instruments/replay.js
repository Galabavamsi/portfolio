/* ============================================================
   replay.js: time reversal in a closed box.

   A stone is dropped (a bump with zero velocity), the waves scatter
   off the posts for REC steps, and the state is kept. Replay swaps
   "now" and "previous" and runs the same number of steps: the leapfrog
   scheme is exactly reversible, so the field walks back to the bump.
   "Dropped frame" first throws away the previous frame (sets it equal
   to the current one), which loses the direction the waves were moving:
   only about half comes home. The readout is the height measured at
   the drop point after the replay, as a share of the original.
   ============================================================ */
import { Mesh, CylinderGeometry, BoxGeometry, Group } from 'three/webgpu';
import { InstrumentBase } from './base.js';

const REC = 1100;           // steps recorded
const RATE = 420;           // steps per second while recording or replaying
const AMP = 1.0, RAD = 3.2; // the dropped bump, in cells

// posts and bars as fractions of the box (x, y, radius as a fraction of the height)
const DISKS = [[0.215, 0.30, 0.050], [0.365, 0.72, 0.065], [0.505, 0.36, 0.038], [0.625, 0.64, 0.055], [0.785, 0.27, 0.070], [0.875, 0.73, 0.045], [0.115, 0.70, 0.032], [0.47, 0.88, 0.03]];
const BARS = [[0.28, 0.16, 0.44, 0.19], [0.68, 0.42, 0.705, 0.93], [0.06, 0.44, 0.15, 0.47]];
const BORDER = 3;

export default class Replay extends InstrumentBase {
  constructor(el, ctx) {
    super(el, ctx, { cols: 440 });
    this.state = 'idle';
    this.t = 0;
    this.acc = 0;
    this.auto = !ctx.reduced;
    this.buttons = {};
    for (const b of el.querySelectorAll('[data-act]')) this.buttons[b.dataset.act] = b;
  }

  async init() {
    await super.init();
    const act = (f) => () => { this.userActed = true; this.auto = false; f(); };
    this.buttons.pulse.addEventListener('click', act(() => this.drop(this.home.x, this.home.y)));
    this.buttons.replay.addEventListener('click', act(() => this.replay(false)));
    this.buttons.drop.addEventListener('click', act(() => this.replay(true)));
    this.canvas.addEventListener('pointerdown', (e) => {
      const c = this.cellAt(e);
      if (this.isSolid(c.x, c.y)) return;
      this.auto = false; this.userActed = true;
      this.drop(c.x, c.y);
    });
    this.setText('readout', '');
  }

  build() {
    const W = this.cols, H = this.rows;
    this.solid = new Uint8Array(W * H);
    const data = new Float32Array(W * H * 4);
    const disks = DISKS.map(([x, y, r]) => ({ x: x * W, y: y * H, r: r * H }));
    const bars = BARS.map(([x0, y0, x1, y1]) => ({ x0: x0 * W, y0: y0 * H, x1: x1 * W, y1: y1 * H }));
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const x = i + 0.5, y = j + 0.5;
      let s = i < BORDER || j < BORDER || i >= W - BORDER || j >= H - BORDER;
      for (const d of disks) if (!s && (x - d.x) ** 2 + (y - d.y) ** 2 < d.r * d.r) s = true;
      for (const b of bars) if (!s && x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) s = true;
      const k = (j * W + i);
      this.solid[k] = s ? 1 : 0;
      data[k * 4] = s ? 1 : 0; data[k * 4 + 1] = 0; data[k * 4 + 2] = 1; data[k * 4 + 3] = 0;
    }
    this.uploadMedium(data);
    this.shapes = { disks, bars };
    this.home = { x: 0.285 * W, y: 0.5 * H };
    if (this.snap) this.snap.dispose();
    this.snap = this.solver.makeSnapshotTarget();
    this._buildObjects();
    this.solver.clear();
    this.setState('idle');
  }

  _buildObjects() {
    if (this.objects) { this.scene.remove(this.objects); this.objects.traverse((o) => o.geometry && o.geometry.dispose()); }
    const g = this.objects = new Group();
    const c = this.W / this.cols, h = 12;
    for (const d of this.shapes.disks) {
      const m = new Mesh(new CylinderGeometry(d.r * c, d.r * c, h, 48), this.metal);
      m.rotation.x = Math.PI / 2; m.position.set(d.x * c, -d.y * c, h / 2);
      g.add(m);
    }
    for (const b of this.shapes.bars) {
      const m = new Mesh(new BoxGeometry((b.x1 - b.x0) * c, (b.y1 - b.y0) * c, h), this.metal);
      m.position.set((b.x0 + b.x1) / 2 * c, -(b.y0 + b.y1) / 2 * c, h / 2);
      g.add(m);
    }
    this.scene.add(g);
  }

  place() { this.build(); }   // the box is rebuilt at the new size

  isSolid(x, y) {
    const i = Math.floor(x), j = Math.floor(y);
    if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) return true;
    return this.solid[j * this.cols + i] === 1;
  }

  setState(s) {
    this.state = s;
    const rec = this.out.rec;
    if (rec) {
      rec.classList.toggle('is-on', s === 'rec');
      rec.classList.toggle('is-play', s === 'play');
      rec.textContent = s === 'play' ? (this.dropped ? '◀◀ replay · frame dropped' : '◀◀ replay') : s === 'rec' ? '● rec' : s === 'held' ? '■ recorded' : '● rec';
    }
    const b = this.buttons;
    const busy = s === 'rec' || s === 'play';
    // aria-disabled keeps keyboard focus on a button while a run is busy (drop/replay ignore input then)
    const off = (btn, v) => { btn.disabled = false; btn.setAttribute('aria-disabled', String(v)); };
    off(b.pulse, busy);
    off(b.replay, !(s === 'held' || s === 'done'));
    off(b.drop, !(s === 'held' || s === 'done'));
    const hint = this.out.hint;
    if (hint) {
      hint.textContent = s === 'idle' ? 'Click inside to drop a pulse.' : s === 'held' ? 'Recorded. Now play it backwards.' : '';
      hint.classList.toggle('is-hidden', !(s === 'idle' || s === 'held'));
    }
  }

  drop(x, y) {
    if (this.state === 'rec' || this.state === 'play') return;
    this.solver.clear();
    this.origin = { x, y };
    this.solver.inject(x, y, RAD, AMP);
    this.t = 0; this.acc = 0; this.dropped = false;
    this.setText('readout', '');
    this.setState('rec');
  }

  replay(dropFrame) {
    if (!(this.state === 'held' || this.state === 'done')) return;
    this.auto = false;
    this.solver.restore(this.snap);
    if (dropFrame) this.solver.dropFrame();
    this.solver.reverse();
    this.dropped = dropFrame;
    this.t = REC; this.acc = 0;
    this.setText('readout', '');
    this.setState('play');
  }

  async _measure() {
    const o = this.origin;
    const px = await this.solver.probe(Math.floor(o.x), Math.floor(o.y));
    // the bump was injected at a sub-cell position; compare with the value the bump had at that cell
    const dx = Math.floor(o.x) + 0.5 - o.x, dy = Math.floor(o.y) + 0.5 - o.y;
    const ref = AMP * Math.exp(-(dx * dx + dy * dy) / (2 * RAD * RAD));
    if (!px) return;
    // u_prev holds the replayed t = 0 state after the final swap of the leapfrog pair
    const v = Math.max(px[0], px[1]);
    const pct = Math.max(0, v / ref * 100);
    this.setText('readout', `back at the drop point: ${pct.toFixed(1)}%`);
    this.announce(`Replay finished${this.dropped ? ' with a dropped frame' : ''}: ${pct.toFixed(1)} percent of the wave came back to the drop point.`);
    this.lastPct = pct;
  }

  frame(now, dt) {
    const s = this.solver;
    if (this.state === 'idle' && this.auto && !this.autoStarted && this.ratio > 0.55) {
      this.autoStarted = now + 500;   // start the demo once most of the box is on screen
    }
    if (this.autoStarted && this.state === 'idle' && this.auto && now > this.autoStarted) this.drop(this.home.x, this.home.y);
    if (this.state === 'rec' || this.state === 'play') {
      this.engagedAt = now;   // a run in progress always finishes
      let n = this.takeSteps(dt, RATE);
      if (this.state === 'rec') {
        n = Math.min(n, REC - this.t);
        s.step(n); this.t += n;
        if (this.t >= REC) {
          s.snapshot(this.snap);
          this.setState('held');
          if (this.auto) this.autoReplay = now + 900;
        }
      } else {
        n = Math.min(n, this.t);
        s.step(n); this.t -= n;
        if (this.t <= 0) {
          this.setState('done');
          this._measure();
        }
      }
      this.setText('clock', `t ${String(this.t).padStart(4, '0')}`);
    }
    if (this.autoReplay && this.state === 'held' && now > this.autoReplay) { this.autoReplay = 0; this.replay(false); this.auto = false; }
    this.render();
  }
}
