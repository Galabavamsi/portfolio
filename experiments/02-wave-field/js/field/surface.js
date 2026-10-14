/* ============================================================
   surface.js: how the field looks.

   The simulated u is treated as the height of a black glossy liquid:
   its gradient becomes the surface normal, so ripples catch the
   studio strips (physically based, through three's lighting).

   On top of that the signed field is drawn as light: crests in warm
   tungsten, troughs in cool daylight, both thin lines whose brightness
   follows the local wave energy, so weak far waves fade out and the
   zero level stays the page's black.
   ============================================================ */
import { MeshPhysicalNodeMaterial, Color } from 'three/webgpu';
import { Fn, texture, vec3, uniform, normalize, clamp, pow, smoothstep, sqrt, abs, select, transformNormalToView, pmremTexture } from 'three/tsl';

export const WARM = new Color(1.0, 0.70, 0.30);   // tungsten
export const COOL = new Color(0.42, 0.60, 0.90);  // daylight

/**
 * @param {object} o
 * @param {import('three/webgpu').Texture} o.view    the solver's filterable view (du/dx, du/dy, u, energy)
 * @param {Node} o.uv                                 a vec2 node mapping the fragment to the view texture
 * @param {import('three/webgpu').Texture} o.env     prefiltered environment for the liquid
 */
export function waterMaterial({ view, uv, env, base = 0x010306, slope = 3.0, crest = 0.45, trough = 0.22, gain = 9, roughness = 0.035, edge = 0.78 }) {
  const m = new MeshPhysicalNodeMaterial({ color: base, metalness: 0, roughness, ior: 1.5 });
  m.envNode = pmremTexture(env);
  const u = {
    slope: uniform(slope), crest: uniform(crest), trough: uniform(trough), gain: uniform(gain),
    warm: uniform(vec3(WARM.r, WARM.g, WARM.b)), cool: uniform(vec3(COOL.r, COOL.g, COOL.b)), edge: uniform(edge),
  };
  const fv = texture(view, uv);
  m.normalNode = transformNormalToView(normalize(vec3(fv.x.mul(u.slope).negate(), fv.y.mul(u.slope), 1)));
  m.emissiveNode = Fn(() => {
    const rms = sqrt(fv.w.max(0));
    const c = fv.z.div(rms.mul(1.4142).add(0.004));                // about -1..1 wherever there is a wave
    const line = smoothstep(u.edge, 0.99, abs(c));
    const amp = pow(clamp(rms.mul(u.gain), 0, 1), 0.8);
    const tint = select(c.greaterThan(0), u.warm.mul(u.crest), u.cool.mul(u.trough));
    return tint.mul(line.mul(amp));
  })();
  m.userData.u = u;
  return m;
}
