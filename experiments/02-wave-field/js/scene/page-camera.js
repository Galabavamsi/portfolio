/* ============================================================
   page-camera.js

   World units are CSS pixels. The page is the plane z = 0 with
   x to the right and y up (so page y = -world y).

   PageCamera looks straight down at the plane and keeps a chosen
   rectangle of it exactly filling the viewport, wherever the eye is.
   Moving the eye sideways gives parallax to anything standing on the
   plane (the chrome letters) and moves the reflections, while the
   plane itself, and the DOM that lines up with it, stays put:
   an off-axis (asymmetric) frustum.

   For the opening shot it can also act as an ordinary look-at camera
   (`free`), and blends back into the page view.
   ============================================================ */
import { PerspectiveCamera, Vector3, Quaternion, MathUtils } from 'three/webgpu';

const _q = new Quaternion();
const _v = new Vector3();

export class PageCamera extends PerspectiveCamera {
  constructor(fov = 28) {
    super(fov, 1, 1, 10000);
    this.rect = { x0: 0, x1: 1, y0: -1, y1: 0 };   // plane rectangle that fills the viewport (world units)
    this.eye = { x: 0, y: 0 };                      // eye offset from the rectangle's centre (world units)
    this.blend = 0;                                 // 0 = page view, 1 = free view
    this.free = { position: new Vector3(), target: new Vector3(), fov: 40 };
    this.matrixAutoUpdate = true;
  }

  setRect(x0, x1, y0, y1) {
    this.rect.x0 = x0; this.rect.x1 = x1; this.rect.y0 = y0; this.rect.y1 = y1;
    this.aspect = (x1 - x0) / (y1 - y0);
  }

  /** Distance from the plane at which the page view's vertical field of view is `fov`. */
  get distance() {
    return (this.rect.y1 - this.rect.y0) / 2 / Math.tan(MathUtils.degToRad(this.fov) / 2);
  }

  /** Call once per frame before rendering. */
  update() {
    const r = this.rect, D = this.distance;
    const cx = (r.x0 + r.x1) / 2 + this.eye.x, cy = (r.y0 + r.y1) / 2 + this.eye.y;
    this.near = Math.max(1, D * 0.05);
    this.far = D * 6;
    if (this.blend <= 0) {
      this.position.set(cx, cy, D);
      this.quaternion.identity();
      const k = this.near / D;
      this.projectionMatrix.makePerspective((r.x0 - cx) * k, (r.x1 - cx) * k, (r.y1 - cy) * k, (r.y0 - cy) * k,
        this.near, this.far, this.coordinateSystem, this.reversedDepth);
    } else {
      // blend position and orientation from the page view toward the free view
      const t = this.blend;
      const pagePos = _v.set(cx, cy, D);
      this.position.copy(pagePos).lerp(this.free.position, t);
      const look = new Vector3().copy(this.free.target).sub(this.free.position).normalize();
      _q.setFromUnitVectors(new Vector3(0, 0, -1), look);
      this.quaternion.identity().slerp(_q, t);
      const fov = MathUtils.lerp(this.fov, this.free.fov, t);
      const top = this.near * Math.tan(MathUtils.degToRad(fov) / 2);
      // keep the page view's off-centre shift, fading it out as we leave
      const k = this.near / D, s = 1 - t;
      const l0 = (r.x0 - cx) * k, r0 = (r.x1 - cx) * k, t0 = (r.y1 - cy) * k, b0 = (r.y0 - cy) * k;
      const w = top * this.aspect;
      this.projectionMatrix.makePerspective(
        MathUtils.lerp(-w, l0, s), MathUtils.lerp(w, r0, s), MathUtils.lerp(top, t0, s), MathUtils.lerp(-top, b0, s),
        this.near, this.far, this.coordinateSystem, this.reversedDepth);
    }
    this.projectionMatrixInverse.copy(this.projectionMatrix).invert();
    this.updateMatrixWorld(true);
  }

  // the renderer calls this when the coordinate system changes; keep our own projection
  updateProjectionMatrix() {
    if (!this.rect) { super.updateProjectionMatrix(); return; }
    this.update();
  }
}
