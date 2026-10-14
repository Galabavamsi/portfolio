/* ============================================================
   main.js: everything that works without the GPU (section dial,
   motion toggle), then a capability check, then the field.
   three.js is only downloaded when WebGPU or WebGL 2 is available.
   ============================================================ */
const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
const state = { reduced: reducedQuery.matches, app: null };

/* ---------------- section dial ---------------- */
function initDial() {
  const links = [...document.querySelectorAll('.dial a')];
  const needle = document.querySelector('.dial-needle');
  const sections = links.map((a) => document.querySelector(a.getAttribute('href')));
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY + innerHeight * 0.38;
    let i = 0;
    for (let k = 0; k < sections.length; k++) if (sections[k] && sections[k].offsetTop <= y) i = k;
    const cur = sections[i], next = sections[i + 1];
    const t = next ? Math.max(0, Math.min(1, (y - cur.offsetTop) / Math.max(1, next.offsetTop - cur.offsetTop))) : 0;
    links.forEach((a, k) => a.classList.toggle('is-active', k === i));
    if (needle && links[i]) {
      // list items are positioned relative to the dial; the links inside them sit at offsetTop 0
      const a = links[i].parentElement, b = (links[i + 1] || links[i]).parentElement;
      needle.style.setProperty('--needle', `${a.offsetTop + (b.offsetTop - a.offsetTop) * t + a.offsetHeight / 2 - 11}px`);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  update();
}

/* ---------------- motion toggle ---------------- */
function initMotion() {
  const btn = document.querySelector('[data-motion]');
  if (!btn) return;
  const KEY = 'wave-field:motion-paused';
  const set = (paused, save = true) => {
    document.documentElement.classList.toggle('motion-paused', paused);
    btn.textContent = paused ? 'Resume motion' : 'Pause motion';
    btn.setAttribute('aria-pressed', String(paused));
    if (state.app) state.app.setPaused(paused);
    if (save) { try { localStorage.setItem(KEY, paused ? '1' : '0'); } catch { /* private mode */ } }
  };
  let saved = false;
  try { saved = localStorage.getItem(KEY) === '1'; } catch { /* storage unavailable */ }
  if (saved) set(true, false);
  btn.addEventListener('click', () => set(!document.documentElement.classList.contains('motion-paused')));
}

/* ---------------- capability check ---------------- */
function webgl2() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch { return false; }
}

initDial();
initMotion();

const q = new URLSearchParams(location.search);
if (!q.has('static') && (('gpu' in navigator) || webgl2())) {
  import('./app.js')
    .then((m) => m.start({ reduced: state.reduced, query: q }))
    .then((app) => { state.app = app; if (document.documentElement.classList.contains('motion-paused')) app.setPaused(true); })
    .catch((err) => {
      console.error('[wave field] could not start, the page stays static:', err);
      document.documentElement.classList.remove('field-on');
      const s = document.querySelector('[data-out="stats"]');
      if (s) s.textContent = 'Renderer: unavailable here, so the page is static.';
    });
} else {
  const s = document.querySelector('[data-out="stats"]');
  if (s) s.textContent = 'Renderer: none (static page).';
}
