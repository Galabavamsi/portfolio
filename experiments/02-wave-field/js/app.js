/* ============================================================
   app.js: the GPU side of the page. Loaded only when WebGPU or
   WebGL 2 exists (see main.js).
   ============================================================ */
import { WebGPURenderer, AgXToneMapping, REVISION } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import Lenis from 'lenis';
import { makeEnvironments } from './scene/studio.js';
import { PageField } from './field/page-field.js';
import { Instruments } from './instruments/index.js';

export async function start({ reduced, query }) {
  const canvas = document.getElementById('field');
  const renderer = new WebGPURenderer({ canvas, antialias: true, forceWebGL: query.has('gl'), powerPreference: 'high-performance' });
  const dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 2 : 1.75);
  renderer.setPixelRatio(dpr);
  const boxH = () => Math.max(innerHeight, canvas.clientHeight || 0);   // the canvas is 100lvh tall
  renderer.setSize(innerWidth, boxH(), false);
  renderer.toneMapping = AgXToneMapping;
  renderer.toneMappingExposure = 1.0;
  await renderer.init();
  const backend = renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL 2';

  const [gltf] = await Promise.all([
    new GLTFLoader().loadAsync(new URL('../assets/name.glb', import.meta.url).href),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]);
  const envs = makeEnvironments(renderer);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const cell = innerWidth < 760 ? 3 : 2;
  const field = new PageField(renderer, { envs, name: gltf.scene, reduced, cell });

  // smooth scrolling on desktop keeps the canvas and the DOM in the same frame
  let lenis = null;
  if (!reduced && !coarse && !query.has('nolenis')) {
    lenis = new Lenis({ autoRaf: false, anchors: { offset: -60 }, lerp: 0.12, wheelMultiplier: 1 });
  }

  const instruments = new Instruments({ pageRenderer: renderer, envs, reduced, backend });
  if (reduced) { const h = document.querySelector('.hint-text'); if (h) h.textContent = 'Click to send a pulse.'; }

  // if the GPU goes away, fall back to the static page instead of leaving the name invisible
  const lost = () => {
    renderer.setAnimationLoop(null);
    document.documentElement.classList.remove('field-on');
    for (const f of document.querySelectorAll('.instrument.is-live')) f.classList.remove('is-live');
    const s = document.querySelector('[data-out="stats"]');
    if (s) s.textContent = 'Renderer: the GPU was lost, so the page is static now.';
  };
  const origLost = renderer.onDeviceLost ? renderer.onDeviceLost.bind(renderer) : null;
  renderer.onDeviceLost = (info) => { if (origLost) origLost(info); lost(); };
  const statsEl = document.querySelector('[data-out="stats"]');
  let last = performance.now(), paused = false, fpsAcc = 0, fpsN = 0, fps = 0, shown = false;
  const writeStats = () => {
    if (!statsEl) return;
    const s = field.stats();
    statsEl.textContent = `Renderer: ${backend} · three.js r${REVISION} · field ${s.cells} cells of ${s.cell} px · ${Math.round(fps)} fps · ${s.steps.toLocaleString()} steps so far`;
  };

  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (lenis) lenis.raf(now);
    if (field.frame(now, dt)) field.render();   // while paused it still follows scrolling, without stepping
    if (!shown && field.frames > 0) { shown = true; document.documentElement.classList.add('field-on'); }
    instruments.frame(now, dt, paused);
    fpsAcc += dt; fpsN++;
    if (fpsAcc > 1) {
      fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; writeStats();
      if (query.has('perf')) console.log(`[perf] y=${Math.round(scrollY)} loop ${fps.toFixed(1)} fps · field frames ${field.frames} · steps ${field.solver.steps}`);
    }
  });

  let tResize, tLayout;
  const doResize = () => {
    clearTimeout(tLayout);
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 760 ? 2 : 1.75));
    renderer.setSize(innerWidth, boxH(), false);
    field.resize();
    field.kick(2);
    instruments.resize();
  };
  addEventListener('resize', () => { clearTimeout(tResize); tResize = setTimeout(doResize, 160); });
  // layout can change without a resize (fonts, details opening, images)
  const ro = new ResizeObserver(() => { clearTimeout(tLayout); tLayout = setTimeout(() => field.layout(), 120); });
  ro.observe(document.querySelector('main'));
  if (innerWidth !== field.VW || Math.abs(boxH() - field.VH) > 1) doResize();

  const app = {
    renderer, field, instruments, backend,
    setPaused(v) { paused = v; field.paused = v; instruments.setPaused(v); field.kick(2); },
  };
  window.__wave = app;
  return app;
}
