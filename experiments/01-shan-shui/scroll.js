/* ============================================================
   scroll.js — the handscroll page.

   The painting was made once, offline, by tools/paint.js (the original
   {Shan, Shui}* generator) and saved as WebP tiles. This script only
   lays the tiles end to end, places the text stations where the
   painter left clearings (painting.json), and handles travel.

   World units: the painting is 800 units tall; S = pixels per unit.
   ============================================================ */
(function () {
  'use strict';
  var WORLD_H = 800;
  var NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

  /* ---------------- content ---------------- */
  var SECTIONS = {
    home: { label: 'Opening', eyebrow: 'Software, AI & robotics · Graduating May 2027', title: 'Galaba Vamsi', big: true,
      paras: ['Mechatronics at IIT Bhilai. I build full-stack apps, AI agents, and ML models, and co-founded Human Slop. I also contribute to open-source robotics tools: 15 merged pull requests across HFlow, Inspect Robots, and Cerulion, plus inspect-robots-wandb, a plugin I wrote and publish on PyPI.'],
      links: [['Resume', '../../resume_vamsi.pdf'], ['GitHub', 'https://github.com/Galabavamsi'], ['LinkedIn', 'https://www.linkedin.com/in/galabavamsi/']],
      hint: 'Scroll, drag, or press → to travel east along the scroll.' },
    about: { label: 'About', title: 'Jack of all trades, master of none (working on it).',
      paras: ['I study Mechatronics at IIT Bhilai, which officially makes me a bit of everything: part mechanical, part electrical, part "can you fix my laptop". I took that personally.',
        'On any given week I\'m training a model, shipping a full-stack app, sending a pull request to some robot\'s software, or arguing with a simulator about physics. Then I close the laptop and go shoot and edit a short film.',
        'The full quote goes "jack of all trades, master of none, but oftentimes better than a master of one." I\'m betting on the second half. Keep scrolling for the receipts.'] },
    work: { label: 'Work', title: 'Work I can point to', items: [
      { h: 'HFlow contributions', href: 'https://github.com/Hebbian-Robotics/hflow/pulls?q=is%3Apr+author%3AGalabavamsi', p: 'Open-source SDK for verifying the quality of robot training data (Hebbian Robotics, YC S26). Eight merged PRs, mostly making robot-log and LeRobot conversion keep data whole or refuse it with a clear reason.', meta: '8 merged PRs · Sep–Oct 2026 · Python, LeRobot, Apache Arrow' },
      { h: 'inspect-robots-wandb + Inspect Robots', href: 'https://pypi.org/project/inspect-robots-wandb/', p: 'Robocurve\'s evaluation framework for physical AI. The maintainers asked for my Weights & Biases sink to live outside the core, so it became a PyPI package with a 100% coverage gate. Upstream: 2 merged, 3 open.', meta: 'PyPI v0.1.0 · 2 merged PRs · 3 open' },
      { h: 'Quarter-car active suspension study', href: 'https://quarter-car-afc.vercel.app', p: 'Reproduces Na et al. (IEEE TSMC 2022) in MATLAB/Simulink to within about 6% of its error indices, then tests the claims: hold-out gains fail, LQR and skyhook match it at equal effort.', meta: 'MATLAB · Simulink · C port timed for a Cortex-M4' },
      { h: 'RIS-SIM v2 emulator', href: 'https://github.com/Galabavamsi/RIM-SIM-V2', p: 'Open-source Python emulator for RIS-assisted radio links with USRP-style SDR interfaces: six paper-grounded scenarios, a 20 Hz WebSocket dashboard, a ZeroMQ server.', meta: 'Python · 103 tests · 6 scenarios' } ] },
    'open-source': { label: 'Open source', title: 'Open-source contributions', items: [
      { h: 'HFlow', href: 'https://github.com/Hebbian-Robotics/hflow', p: 'Hebbian Robotics (YC S26). Arrow typing from every message, refusing ambiguous sources before canonical episodes, depth-video refusal, a cold benchmark that honestly found no speedup, paginated Hugging Face discovery.', meta: '8 merged PRs · 2026' },
      { h: 'Inspect Robots', href: 'https://github.com/robocurve/inspect-robots', p: 'Robocurve (YC S26). Configurable LLM retry policy honoring Retry-After; unknown working trees no longer logged as clean; checkpoint and resume for long eval sets on robot hardware (in review).', meta: '2 merged · 3 open · author of inspect-robots-wandb' },
      { h: 'Cerulion', href: 'https://github.com/cerulion-inc/cerulion', p: 'Rust robot runtime that records a run and re-executes it against new code. A dry-run CLI fix with an exclusively created temp root, plus four documentation and comment corrections.', meta: '5 merged PRs · 2026' } ] },
    experience: { label: 'Experience', title: 'Experience', items: [
      { h: 'Research Intern · IIT Bhilai', p: 'Built RIS-SIM, an open-source emulator for RIS-assisted radio links, and designed RIS unit cells in CST Studio Suite for the lab\'s RF energy-harvesting work (IEEE INDICON 2025, co-author). Advisor: Dr. Arzad Alam Kherani.', meta: 'May–Jul 2025 · paid, COMET Foundation project' },
      { h: 'Co-founder · Human Slop', href: 'https://humanslop.in/', p: 'Anti-AI social app for human-written posts: Expo app for web and Android, Fastify API, PostgreSQL on Supabase. Live on the web and Google Play (50+ downloads). Device biometric check at signup and a keystroke-timing score in the editor, both heuristics.', meta: '2026–present · YC Startup School, Bengaluru' },
      { h: 'Marketing Intern · Swiggy Campus CEO', p: 'Executed a campus campaign of 15 social media posts.', meta: 'Apr–Jul 2024' } ] },
    projects: { label: 'Projects', cols: 2, title: 'Projects', items: [
      { h: 'Whiteboard Cleaning Robot', href: 'https://github.com/Galabavamsi/whiteboard_robot', p: '3-DOF gantry cleaning a 90 × 90 cm board in ROS 2 Jazzy and Gazebo Harmonic, with coverage analysis from logged data.', meta: 'ROS 2 · Gazebo · team, 2025' },
      { h: 'Prompt Robot Arm', href: 'https://github.com/Galabavamsi/prompt-robot-arm', p: 'MuJoCo sim where "sort red, blue, green" becomes a pick-and-place plan for a SCARA arm with analytic inverse kinematics.', meta: 'MuJoCo · Python · 2026' },
      { h: 'Charter', href: 'https://github.com/Galabavamsi/charter', p: 'Razorpay AI Buildathon prototype: chat, voice, and MCP share one bounded commerce core with frozen INR quotes and audit trails.', meta: 'TypeScript · Fastify · PostgreSQL' },
      { h: 'HeatCast', href: 'https://github.com/Galabavamsi/heatcast', p: 'Neighborhood heat-planning scorecard for US planners: thermal maps, exceedance streaks, vulnerability data, walking routes.', meta: 'Next.js · FastAPI · MapLibre · team' },
      { h: 'Arista Wi-Fi RRM', href: 'https://canva.link/puoqbe4okoid8rb', p: 'Inter IIT Tech Meet 14.0, 5th place: client-aware RRM in NS-3 with I/Q interference classification (STFT, DBSCAN, Dual-CNN).', meta: 'NS-3 · team, Dec 2025' },
      { h: 'AntennaNet', href: 'https://github.com/Galabavamsi/Antenna-Net', p: 'Inverse antenna design: surrogate network plus KD-tree anchoring over about 2,000 simulated patch-antenna S11 spectra.', meta: 'PyTorch · MoM · MEEP' },
      { h: 'Lunar Crater Detection', href: 'https://github.com/Galabavamsi/Moon-Crater-Detection-using-DEM', p: 'Crater extraction from lunar DEMs after Zhou et al. (2018): F1 0.839 on a labelled region in Mare Serenitatis.', meta: 'scikit-image · CuPy' },
      { h: 'Open-PyFX', href: 'https://github.com/Galabavamsi/open-pyfx', p: 'GPU video effects in Python, ModernGL, and GLSL: CRT emulation from 3D LUT profiles, ASCII edge detection, 4K export.', meta: 'ModernGL · GLSL' } ] },
    research: { label: 'Research', title: 'Research and publications', items: [
      { h: 'Experience with RF Energy Harvesting-Driven Self-Powered RIS', href: 'https://ieeexplore.ieee.org/abstract/document/11392908/', meta: 'Co-author · IEEE INDICON 2025' },
      { h: 'A systematic literature review on simulation models and deployments for reconfigurable intelligent surfaces', href: 'https://www.sciencedirect.com/science/article/pii/S1570870526001964', meta: 'Co-author · Ad Hoc Networks (Elsevier), 2026' },
      { h: 'Inspect Robots: Evaluating the Capabilities and Safety of Embodied AI', meta: 'Co-author · submitted, under review · CoRL 2026 Workshop SPAIS' },
      { h: 'An Open Emulator for Smart Radio Environments', href: 'https://drive.google.com/file/d/12oDPsflaUXKnSjfA3247HgFDDf4bJkCP/view?usp=drive_link', meta: 'First author · manuscript, arXiv preprint in preparation' } ],
      links: [['Google Scholar', 'https://scholar.google.com/citations?user=UNjZa1sAAAAJ&hl=en'], ['ResearchGate', 'https://www.researchgate.net/profile/Galaba-Vamsi'], ['IEEE Xplore', 'https://ieeexplore.ieee.org/author/943675488152924']] },
    skills: { label: 'Skills', title: 'Skills', items: [
      { h: 'Robotics, simulation, and controls', p: 'ROS 2 (rclpy, ros2_control, URDF/Xacro), Gazebo Harmonic, MuJoCo, Unity (C#), MATLAB/Simulink, LQR and Kalman filter design, LeRobot datasets' },
      { h: 'Languages', p: 'Python, TypeScript/JavaScript, C/C++, Rust (open-source contributions), SQL, GLSL' },
      { h: 'ML, data, and scientific computing', p: 'PyTorch, PyTorch Geometric, OpenCV, NumPy, CuPy, Apache Arrow, Weights & Biases, MEEP (FDTD), CST Studio Suite, NS-3' },
      { h: 'Software, cloud, and tooling', p: 'FastAPI, Node.js (Fastify), React, React Native (Expo), Flutter, PostgreSQL, Supabase, WebSockets, Docker, AWS (CDK, Lambda, Step Functions, Bedrock), Git, Linux, GitHub Actions, pytest, Ruff, mypy, PyPI trusted publishing' } ] },
    highlights: { label: 'Highlights', cols: 2, title: 'Highlights', items: [
      { h: 'AIR 200', p: 'Amazon ML Challenge 2026 (team)' }, { h: '5th place', p: 'Arista Networks Wi-Fi challenge, Inter IIT Tech Meet 14.0 (team, Dec 2025)' },
      { h: 'AIR 700', p: 'Amazon ML Challenge 2025 (team; 20,000+ participants)' }, { h: '1st place', p: 'IIT Bhilai Web Development Competition' },
      { h: 'Top 10 finalist', p: 'Toyota Hackathon' }, { h: 'PMSS scholar', p: 'Prime Minister\'s Scholarship Scheme, National Defence Fund (2024)' } ] },
    contact: { label: 'Contact', title: 'Working on robot data, evaluation, or simulation?',
      paras: ['Open to robotics software internships and new-grad roles (graduating May 2027), and to research collaborations. I read the code, write the tests, and say plainly what did not work.'],
      links: [['Email', 'mailto:galabavamsi12@gmail.com'], ['LinkedIn', 'https://www.linkedin.com/in/galabavamsi/'], ['GitHub', 'https://github.com/Galabavamsi'], ['X', 'https://x.com/Galaba_Vamsi'], ['Main site', 'https://galabavamsi.github.io/portfolio/']] },
    colophon: { label: 'Colophon', title: 'About this scroll', small: true,
      paras: ['The landscape was painted once by LingDong-\'s {Shan, Shui}* generator (MIT), run offline with the text stations planned as clearings, and saved as image tiles. Nothing is drawn while you read. The scroll keeps going a little past this point.'],
      links: [['{Shan, Shui}* source', 'https://github.com/LingDong-/shan-shui-inf'], ['This experiment\'s source', 'https://github.com/Galabavamsi/portfolio/tree/main/experiments/01-shan-shui']] },
  };

  /* ---------------- state ---------------- */
  var meta, S = 1, VW = 0, bandTop = 0, bandH = 0, cursx = 0, target = 0, lastSet = -1, stations = [], lastDir = 1;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stage, spacer, canvas, g2d, stationsEl, navEl, boatEl, builtW = 0, builtH = 0, rebuildTimer, animating = false;
  var tiles = [];

  /* ---------------- layout ---------------- */
  function layout() {
    builtW = innerWidth; builtH = innerHeight;
    var narrow = innerWidth < 720;
    // fill the height on desktop; on a phone shrink the painting so a station fits the width,
    // and let the words run on below the painted band
    S = Math.max(innerHeight, 1) / WORLD_H;
    if (narrow) S = Math.min(S, (Math.max(innerWidth, 1) - 24) / 700);
    bandH = WORLD_H * S; bandTop = narrow ? 52 : (innerHeight - bandH) / 2;
    VW = Math.max(innerWidth, 1) / S;
    spacer.style.width = (meta.width * S).toFixed(1) + 'px';
    spacer.style.height = innerHeight + 'px';
    canvas.width = Math.round(innerWidth * devicePixelRatio); canvas.height = Math.round(innerHeight * devicePixelRatio);
    stationsEl.innerHTML = ''; stations = [];
    for (var i = 0; i < meta.stations.length; i++) {
      var st = meta.stations[i], sec = SECTIONS[st.id];
      if (!sec) continue;
      var el = renderStation(st.id, sec, i);
      el.style.left = (st.u0 * S).toFixed(1) + 'px';
      el.style.width = ((st.u1 - st.u0) * S).toFixed(1) + 'px';
      el.style.top = (bandTop + bandH * 0.08).toFixed(1) + 'px';
      stationsEl.appendChild(el);
      stations.push({ id: st.id, label: sec.label, u0: st.u0, u1: st.u1, w: st.u1 - st.u0, el: el });
    }
    navEl.innerHTML = '';
    for (i = 0; i < stations.length; i++) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = stations[i].label;
      b.setAttribute('data-id', stations[i].id); b.setAttribute('data-label', stations[i].label); b.title = stations[i].label;
      b.addEventListener('click', jumpTo.bind(null, stations[i].id));
      navEl.appendChild(b);
    }
    boatEl.style.top = (bandTop + 700 * S).toFixed(1) + 'px';
    boatEl.style.width = (150 * S).toFixed(1) + 'px';
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function link(t, h) { var ext = /^https?:/.test(h); return '<a href="' + h + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + esc(t) + '</a>'; }
  function renderStation(id, sec, i) {
    var el = document.createElement('section');
    el.className = 'station' + (sec.cols === 2 ? ' two-col' : '') + (sec.small ? ' small' : ''); el.id = id;
    var h = '<div class="mark"><span class="num">' + NUM[i] + '</span><span class="label">' + esc(sec.label) + '</span></div><div class="body">';
    if (sec.eyebrow) h += '<p class="eyebrow">' + esc(sec.eyebrow) + '</p>';
    h += sec.big ? '<h1>' + esc(sec.title) + '</h1>' : '<h2>' + esc(sec.title) + '</h2>';
    if (id === 'home') h += '<img class="seal" src="seal.svg" alt="">';
    (sec.paras || []).forEach(function (p) { h += '<p>' + esc(p) + '</p>'; });
    if (sec.items) {
      h += '<div class="items">';
      sec.items.forEach(function (it) {
        h += '<article class="item"><h3>' + (it.href ? link(it.h, it.href) : esc(it.h)) + '</h3>';
        if (it.p) h += '<p>' + esc(it.p) + '</p>';
        if (it.meta) h += '<p class="meta">' + esc(it.meta) + '</p>';
        h += '</article>';
      });
      h += '</div>';
    }
    if (sec.links) h += '<p class="links">' + sec.links.map(function (l) { return link(l[0], l[1]); }).join('') + '</p>';
    if (id === 'colophon') h += '<p class="meta">Seed ' + esc(meta.seed) + ' · ' + meta.width + ' units long · repaint with <code>tools/paint.js</code></p>';
    if (sec.hint) h += '<p class="hint">' + esc(sec.hint) + '</p>';
    el.innerHTML = h + '</div>';
    return el;
  }

  /* ---------------- painting ---------------- */
  function tile(i) {
    if (i < 0 || i >= meta.tile.count) return null;
    if (!tiles[i]) {
      var img = new Image();
      img.onload = function () { draw(); };
      img.src = meta.tile.pattern.replace('NN', String(i).padStart(2, '0'));
      tiles[i] = img;
    }
    return tiles[i];
  }
  function draw() {
    var dpr = devicePixelRatio, U = meta.tile.units;
    g2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    g2d.clearRect(0, 0, innerWidth, innerHeight);
    var i0 = Math.floor(cursx / U), i1 = Math.floor((cursx + VW) / U);
    for (var i = i0 - 1; i <= i1 + 2; i++) {
      var img = tile(i);                       // warms the next tiles too
      if (!img || i < i0 || i > i1 || !img.complete || !img.naturalWidth) continue;
      g2d.drawImage(img, (i * U - cursx) * S, bandTop, U * S, bandH);
    }
  }

  /* ---------------- travel ---------------- */
  function maxX() { return Math.max(0, meta.width - VW); }
  function frame() {
    if (innerWidth !== builtW || innerHeight !== builtH) scheduleRebuild();
    if (reduced) cursx = target; else cursx += (target - cursx) * 0.12;
    if (Math.abs(target - cursx) < 0.05) cursx = target;
    lastSet = Math.round(cursx * S);
    stage.scrollLeft = lastSet;
    draw(); updateUI();
    if (cursx !== target) requestAnimationFrame(frame); else animating = false;
  }
  function animate() { if (!animating) { animating = true; requestAnimationFrame(frame); } }
  function updateUI() {
    var mid = cursx + VW * 0.5, active = null;
    for (var i = 0; i < stations.length; i++) if (stations[i].u0 - 200 <= mid && stations[i].u1 + 200 >= mid) active = stations[i].id;
    var btns = navEl.children;
    for (i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].getAttribute('data-id') === active);
    document.documentElement.style.setProperty('--progress', Math.max(0, Math.min(1, cursx / maxX())).toFixed(4));
  }
  function go(x) {
    var nt = Math.max(0, Math.min(maxX(), x));
    if (nt !== target) {
      var dir = nt > target ? 1 : -1;
      if (dir !== lastDir) { lastDir = dir; boatEl.classList.toggle('west', dir < 0); }
    }
    target = nt; animate();
  }
  function jumpTo(id, silent) {
    for (var i = 0; i < stations.length; i++) if (stations[i].id === id) {
      go(stations[i].u0 - Math.max(24 / S, (VW - stations[i].w) * 0.45));
      if (!silent && history.replaceState) history.replaceState(null, '', '#' + id);
      return;
    }
  }
  function idAt(x) {
    var mid = x + VW * 0.5;
    for (var i = stations.length - 1; i >= 0; i--) if (stations[i].u0 - 200 <= mid) return stations[i].id;
    return null;
  }
  function scheduleRebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(function () {
      if (innerWidth < 50 || innerHeight < 50 || (innerWidth === builtW && innerHeight === builtH)) return;
      var id = target > 0 ? idAt(target) : null;
      layout();
      if (id) jumpTo(id);
      else if (stations[0] && stations[0].u1 > VW - 24 / S) jumpTo('home', true);
      cursx = target; frame();
    }, 250);
  }

  /* ---------------- input ---------------- */
  function bind() {
    // native scrolling (touch pans, trackpad swipes) drives the painting
    stage.addEventListener('scroll', function () {
      if (Math.abs(stage.scrollLeft - lastSet) > 1.5) { cursx = target = stage.scrollLeft / S; draw(); updateUI(); }
    }, { passive: true });
    stage.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      var d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 16;
      e.preventDefault();
      go(target + (d / S) * 1.1);
    }, { passive: false });
    addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey || e.altKey) return;
      var step = VW * 0.6;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); go(target + (e.shiftKey ? -step : step)); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); go(target - step); }
      else if (e.key === 'Home') { e.preventDefault(); go(0); }
      else if (e.key === 'End') { e.preventDefault(); jumpTo('colophon'); }
    });
    // drag with a mouse (touch already pans natively)
    var drag = null;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a, button')) return;
      drag = { x: e.clientX, t: target, vx: 0, last: e.clientX, time: performance.now() };
      stage.setPointerCapture(e.pointerId); stage.classList.add('dragging');
    });
    stage.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var now = performance.now(), dt = Math.max(1, now - drag.time);
      drag.vx = (e.clientX - drag.last) / dt; drag.last = e.clientX; drag.time = now;
      target = cursx = Math.max(0, Math.min(maxX(), drag.t - (e.clientX - drag.x) / S)); frame();
    });
    var endDrag = function () { if (!drag) return; stage.classList.remove('dragging'); go(target - (drag.vx * 260) / S); drag = null; };
    stage.addEventListener('pointerup', endDrag); stage.addEventListener('pointercancel', endDrag);
    addEventListener('hashchange', function () { if (location.hash) jumpTo(location.hash.slice(1)); });
    addEventListener('resize', scheduleRebuild);
  }

  /* ---------------- boot ---------------- */
  function init(data) {
    meta = data;
    stage = document.getElementById('stage'); spacer = document.getElementById('spacer'); canvas = document.getElementById('painting');
    g2d = canvas.getContext('2d'); stationsEl = document.getElementById('stations'); navEl = document.getElementById('nav'); boatEl = document.getElementById('boat');
    layout(); bind();
    if (location.hash) jumpTo(location.hash.slice(1));
    else if (stations[0] && stations[0].u1 > VW - 24 / S) jumpTo('home', true);   // narrow screens: start at the title
    cursx = target;
    frame();
    document.body.classList.add('ready');
    setTimeout(frame, 600);   // catches a viewport that only settled after load
  }
  window.__scroll = { state: function () { return { S: S, VW: VW, cursx: cursx, target: target, builtW: builtW, builtH: builtH, w: innerWidth, h: innerHeight }; }, go: go, jumpTo: jumpTo };
  fetch('painting.json').then(function (r) { return r.json(); }).then(init).catch(function (e) {
    document.getElementById('stations').innerHTML = '<p class="load-error">Could not load painting.json (' + esc(e.message) + '). Serve this folder over HTTP.</p>';
  });
})();
