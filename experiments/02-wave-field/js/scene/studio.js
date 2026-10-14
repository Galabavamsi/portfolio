/* ============================================================
   studio.js: two procedural light studios, prefiltered (PMREM).

   metal: a soft overhead box biased toward the top of the page, so the
          flat tops of the letters read as a gradient that slides with
          the eye, plus two raking strips for the bevels.
   water: black overhead, so the still surface stays black; one strip
          near the zenith (a studio light caught in a black floor) and
          two raking strips that only tilted ripples can see.
   World axes: z up out of the page.
   ============================================================ */
import { Scene, Mesh, SphereGeometry, PlaneGeometry, MeshBasicNodeMaterial, Color, BackSide, DoubleSide, PMREMGenerator } from 'three/webgpu';

function studio(boxes, base) {
  const env = new Scene();
  env.add(new Mesh(new SphereGeometry(50, 32, 16), new MeshBasicNodeMaterial({ color: base, side: BackSide })));
  for (const [w, h, pos, intensity, tint] of boxes) {
    const m = new MeshBasicNodeMaterial({ color: new Color(tint).multiplyScalar(intensity), side: DoubleSide });
    const p = new Mesh(new PlaneGeometry(w, h), m);
    p.position.set(pos[0], pos[1], pos[2]);
    p.lookAt(0, 0, 0);
    env.add(p);
  }
  return env;
}

export const METAL = [
  [14, 5, [0, 5.5, 13], 3.2, 0xfff3e4],
  [20, 3, [0, -7, 12], 0.6, 0x9fb6d8],
  [2.2, 14, [-10, 3, 8], 12, 0xffdcae],
  [2.2, 12, [10, -2, 8], 8, 0xc8daff],
];
export const WATER = [
  [1.4, 18, [-9, 2, 10], 30, 0xffe0b0],
  [1.0, 14, [8, -3, 11], 18, 0xbfd6ff],
];

export function makeEnvironments(renderer) {
  const pmrem = new PMREMGenerator(renderer);
  const metal = pmrem.fromScene(studio(METAL, 0x010204), 0.03);
  const water = pmrem.fromScene(studio(WATER, 0x000000), 0.012);
  return { metal: metal.texture, water: water.texture, dispose() { metal.dispose(); water.dispose(); pmrem.dispose(); } };
}
