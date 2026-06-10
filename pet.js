/* ============================================================
   BIT.EXE — pixel pet companion + DeepSeek-powered chat
   a small animated tabby: wanders, sleeps, blinks, tracks your
   cursor, comments while you scroll, and answers questions.

   Chat endpoint comes from config.js — in production it points
   at the Supabase Edge Function so no API key ships to clients.
   ============================================================ */
(() => {
  'use strict';

  const GVC = window.GV_CONFIG || {};
  const CFG = {
    endpoint: (GVC.CHAT_ENDPOINT && !GVC.CHAT_ENDPOINT.includes('YOUR-')) ? GVC.CHAT_ENDPOINT : '',
    devKey: GVC.DEV_DEEPSEEK_KEY || '',
  };

  const GV = window.GV || { unlock() {}, addScore() {}, audio: { blip() {}, nav() {}, coin() {}, eat() {} } };
  const $ = s => document.querySelector(s);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= SYSTEM PROMPT ================= */
  const SYSTEM = `You are BIT, a tiny 8-bit pixel cat who lives on Galaba Vamsi's retro portfolio website. You are his loyal pet, guide and hype-creature.

STYLE RULES:
- Replies under 80 words. Plain text only — no markdown, no asterisks, no emoji (an occasional ^-^ or meow is fine).
- Playful retro-videogame flavor. The site's sections are "levels". You are a cat, act slightly catlike.
- Be accurate about Vamsi. Never invent facts not listed below.
- If asked something unrelated to Vamsi or this site, answer in one short sentence, then nudge back to Vamsi.

FACTS ABOUT GALABA VAMSI:
- B.Tech Mechatronics, IIT Bhilai (Aug 2023 – May 2027). Focus: software engineering, full-stack, AI/ML, computer vision.
- Research Intern, IIT Bhilai (May–Aug 2025, advisor Dr. Arzad Alam): built a zero-budget open-source 6G RIS simulator emulating USRPs in LoS/NLoS environments, saving lakhs in hardware costs; designed a two-layer RIS PCB (DipTrace/CST) for RF energy harvesting.
- Publications: First-Author of "An Open Emulator for Smart Radio Environments"; Co-Author of "Experience with RF Energy Harvesting-Driven Self-Powered RIS" (IEEE INDICON 2025).
- Co-Founder of Human Slop (2026): anti-AI social platform (React, PostgreSQL, AWS) with hardware-bound biometric auth and real-time typing forensics blocking 100% of synthetic content. Accepted into Y Combinator Startup School.
- Inter IIT Tech Meet 14.0, 5th rank: Arista Networks Wi-Fi optimization — Python simulator + AI-assisted RRM with Dual-CNNs, GNNs, Safe RL; +15% throughput, <2% false positives, 100% DFS compliance.
- Electron-GNN (ongoing): two-tower hybrid GNN (GATv2) predicting quantum absorption spectra from molecular geometry, replacing expensive RT-TDDFT simulations.
- Open-PyFX: GPU-accelerated video FX suite in Python + GLSL (CRT emulation, ASCII edge detection, 3D LUTs).
- Lunar Crater Detection: CV pipeline on Digital Elevation Models, F1 0.839, CuPy/CUDA backend with 4.07x speedup.
- AntennaNet: KD-Tree nearest-neighbour anchoring for inverse EM design, 144-D search spaces, Python-MEEP on OpenMPI clusters.
- Rumikai: zero-backend on-device intelligence engine in TypeScript with Kotlin/Swift bridges for context-aware widgets.
- Serenity: Flutter mental wellness app with CV-based real-time emotion detection and appointment booking.
- Amazon ML Challenge 2025: top 3.5% (700/20,000+), multimodal price prediction with Qwen 2-VL 7B and ViT+RoBERTa two-tower, SMAPE 49.0.
- Other wins: 1st place IIT Bhilai Web Dev Competition, top 1% JEE Advanced, top 10 finalist Toyota Hackathon, 95% class 12, 94% class 10.
- Skills: Python, C/C++, TypeScript/JS, Kotlin, Swift, Dart, Go, GLSL, CUDA; React/React Native, Node, Flutter, PostgreSQL, AWS, OpenMPI; PyTorch, GNNs, Safe RL, Transformers, OpenCV, CuPy; Wi-Fi PHY/MAC, SDR/USRP, IEEE 802.11k/v, PCB design; Linux, Git.
- Contact: galabavamsi12@gmail.com · github.com/Galabavamsi · linkedin.com/in/galabavamsi · resume is the RESUME.PDF button on the site.
- He is open to software engineering and AI/ML research roles. Encourage recruiters to email him.
- This site has a snake game leaderboard — visitors enter a pilot name and compete.

SITE SECRETS you may hint at (never spell out fully): the konami code works, a dusty cartridge in the library is playable, the terminal opens with /, coins exist in the footer, going AFK summons something.`;

  /* ================= DOM ================= */
  const wrap = document.createElement('div');
  wrap.id = 'pet-wrap';
  wrap.innerHTML = `
    <div id="pet-bubble" class="hidden" role="status"></div>
    <div id="pet-fx"></div>
    <canvas id="pet-cv" width="16" height="15" title="BIT — click to chat"
      role="button" tabindex="0" aria-label="BIT the pixel pet — click to chat"></canvas>`;
  document.body.appendChild(wrap);

  const chat = document.createElement('div');
  chat.id = 'pet-chat';
  chat.className = 'hidden';
  chat.setAttribute('role', 'dialog');
  chat.setAttribute('aria-label', 'Chat with BIT');
  chat.innerHTML = `
    <div class="pet-head">
      <span>BIT.EXE — VAMSI'S PET</span>
      <button id="pet-close" aria-label="Close chat">✕</button>
    </div>
    <div id="pet-log"></div>
    <form id="pet-form">
      <input id="pet-in" type="text" maxlength="500" placeholder="ask me about vamsi..."
        autocomplete="off" spellcheck="false" aria-label="Message BIT">
      <button id="pet-send" type="submit">SEND</button>
    </form>`;
  document.body.appendChild(chat);

  const cv = $('#pet-cv');
  const fx = $('#pet-fx');
  const bubble = $('#pet-bubble');
  const log = $('#pet-log');
  const input = $('#pet-in');
  const sendBtn = $('#pet-send');
  const ctx = cv.getContext('2d');
  const cssVar = n => getComputedStyle(document.body).getPropertyValue(n).trim();

  /* ================= SPRITE =================
     16x15 front-facing tabby.
     o outline · b body · s stripe · i inner ear · l belly/muzzle
     n nose · h blush · c collar · g gold tag                    */
  const BASE = [
    '.oo..........oo.',
    '.oio........oio.',
    '.oibo......obio.',
    '.obbbbbbbbbbbbo.',
    'obsbbbbbbbbbbsbo',
    'obbbbbbbbbbbbbbo', // eyes drawn dynamically on this row
    'obbbbbbnnbbbbbbo',
    'ohbbllllllllbbho',
    '.obbbbbbbbbbbbo.',
    '.occcccccccccco.',
    '.obbbbbggbbbbbo.',
    '.obllllllllllbo.',
    '.obllllllllllbo.',
    '.obllllllllllbo.',
    '................', // paw row drawn dynamically
  ];
  // tail frames: little appendage on the right edge
  const TAILS = [
    [[15, 10], [15, 11], [15, 12]],
    [[15, 9], [15, 10], [14, 8]],
    [[15, 11], [15, 12], [15, 13]],
  ];
  // paw row variants: 0 = both down, 1 = left up, 2 = right up
  const PAWS = [
    [[2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14]],
    [[2, 14], [3, 14], [4, 13], [5, 13], [6, 14], [9, 14], [10, 14], [11, 14], [12, 14], [13, 14]],
    [[2, 14], [3, 14], [4, 14], [5, 14], [6, 14], [9, 14], [10, 13], [11, 13], [12, 14], [13, 14]],
  ];

  function drawPet(st) {
    const acc = cssVar('--accent') || '#5af78e';
    const dim = cssVar('--accent-dim') || '#2e7d4a';
    const C = {
      o: '#10241a', b: acc, s: dim, i: '#ffb454', l: '#d8ffe6',
      n: '#ffb454', h: '#ffb454', c: '#8a5a1e', g: '#ffd866',
    };
    ctx.clearRect(0, 0, cv.width, cv.height);
    BASE.forEach((row, y) => [...row].forEach((ch, x) => {
      if (ch === '.') return;
      // ear twitch: drop one ear's inner pixel for a frame
      if (ch === 'i' && st.twitch && ((st.twitch === 1 && x < 8) || (st.twitch === 2 && x >= 8))) return;
      ctx.fillStyle = C[ch];
      ctx.fillRect(x, y, 1, 1);
    }));
    // paws
    const paw = PAWS[st.paw] || PAWS[0];
    ctx.fillStyle = C.o;
    paw.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    // tail
    ctx.fillStyle = C.s;
    (TAILS[st.tail] || TAILS[0]).forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    // eyes
    const EY = 5;
    if (st.eyes === 'closed') {
      ctx.fillStyle = C.o;
      ctx.fillRect(3, EY, 2, 1);
      ctx.fillRect(11, EY, 2, 1);
    } else if (st.eyes === 'happy') {
      ctx.fillStyle = C.o;
      [[2, EY], [3, EY - 1], [4, EY], [11, EY], [12, EY - 1], [13, EY]]
        .forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
    } else { // open, pupil tracks cursor (st.pupil: 0 = left px, 1 = right px)
      ctx.fillStyle = '#f4fff6';
      ctx.fillRect(3, EY, 2, 1);
      ctx.fillRect(11, EY, 2, 1);
      ctx.fillStyle = '#07120b';
      ctx.fillRect(3 + st.pupil, EY, 1, 1);
      ctx.fillRect(11 + st.pupil, EY, 1, 1);
    }
  }

  /* ================= ANIMATION ENGINE ================= */
  let mode = 'idle';            // idle | walk | sleep | happy
  let frame = 0;
  let pupil = 0;                // 0|1 — follows cursor
  let blinkUntil = 0, nextBlink = Date.now() + 3000;
  let twitch = 0, nextTwitch = Date.now() + 6000;
  let walkUntil = 0;            // scroll-run timer
  let lastInput = Date.now();
  let petX = 0;                 // translateX offset (0 .. -WANDER_RANGE)
  const WANDER_RANGE = 150;

  function currentMode() {
    if (!chat.classList.contains('hidden')) return 'happy';
    if (Date.now() < walkUntil || wandering) return 'walk';
    if (sleeping) return 'sleep';
    return 'idle';
  }

  setInterval(() => {
    frame++;
    const now = Date.now();
    mode = currentMode();
    if (mode !== 'sleep' && now > nextBlink) {
      blinkUntil = now + 150;
      nextBlink = now + 2600 + Math.random() * 2800;
    }
    if (now > nextTwitch) {
      twitch = 1 + (Math.random() * 2 | 0);
      nextTwitch = now + 5000 + Math.random() * 7000;
      setTimeout(() => { twitch = 0; }, 320);
    }
    drawPet({
      eyes: mode === 'sleep' ? 'closed'
        : mode === 'happy' ? 'happy'
        : now < blinkUntil ? 'closed' : 'open',
      pupil,
      tail: mode === 'sleep' ? 0 : [0, 1, 0, 2][(frame >> 2) % 4],
      paw: mode === 'walk' ? (frame % 2 ? 1 : 2) : 0,
      twitch,
    });
  }, 150);

  /* pupils follow the cursor */
  addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect();
    pupil = e.clientX < r.left + r.width / 2 ? 0 : 1;
  }, { passive: true });

  /* run-in-place while the page scrolls */
  addEventListener('scroll', () => { if (!sleeping) walkUntil = Date.now() + 450; }, { passive: true });

  /* ---------- wandering ---------- */
  let wandering = false;
  function wander() {
    if (reducedMotion || sleeping || wandering || document.hidden ||
        !chat.classList.contains('hidden') || !bubble.classList.contains('hidden')) return;
    const target = -(Math.random() * WANDER_RANGE) | 0;
    if (Math.abs(target - petX) < 30) return;
    wandering = true;
    cv.classList.toggle('flip', target < petX);
    const dist = Math.abs(target - petX);
    wrap.style.transition = `transform ${(dist / 90).toFixed(2)}s steps(${Math.max(4, dist >> 3)})`;
    wrap.style.transform = `translateX(${target}px)`;
    petX = target;
  }
  wrap.addEventListener('transitionend', () => {
    wandering = false;
    cv.classList.remove('flip');
  });
  setInterval(() => { if (Math.random() < 0.5) wander(); }, 9000);

  /* ---------- sleeping ---------- */
  let sleeping = false, zzzTimer = null;
  function fallAsleep() {
    if (sleeping || !chat.classList.contains('hidden')) return;
    sleeping = true;
    zzzTimer = setInterval(() => {
      if (document.hidden) return;
      const z = document.createElement('span');
      z.className = 'pet-zzz';
      z.textContent = 'z';
      z.style.right = (18 + Math.random() * 16) + 'px';
      fx.appendChild(z);
      setTimeout(() => z.remove(), 2100);
    }, 1300);
  }
  function wakeUp() {
    lastInput = Date.now();
    if (!sleeping) return;
    sleeping = false;
    clearInterval(zzzTimer);
    say('mrrp?! i was resting my pixels.', 3500);
  }
  setInterval(() => { if (Date.now() - lastInput > 45000) fallAsleep(); }, 5000);
  ['pointerdown', 'keydown', 'scroll'].forEach(ev =>
    addEventListener(ev, wakeUp, { passive: true }));
  addEventListener('pointermove', () => { lastInput = Date.now(); }, { passive: true });

  /* ---------- hearts when petted ---------- */
  function hearts() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const h = document.createElement('span');
        h.className = 'pet-heart';
        h.textContent = '♥';
        h.style.right = (12 + Math.random() * 36) + 'px';
        fx.appendChild(h);
        setTimeout(() => h.remove(), 1100);
      }, i * 130);
    }
  }

  /* ================= SPEECH BUBBLE ================= */
  let bubbleTimer, lastSay = 0;
  function say(text, hold = 5200) {
    if (!chat.classList.contains('hidden')) return; // quiet while chatting
    lastSay = Date.now();
    bubble.textContent = text;
    bubble.classList.remove('hidden');
    GV.audio.blip();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.add('hidden'), hold);
  }
  const canSay = (gap = 9000) => Date.now() - lastSay > gap &&
    document.visibilityState === 'visible' && !sleeping;

  /* greet once the boot screen is gone */
  (function waitBoot() {
    if (document.getElementById('boot')) return setTimeout(waitBoot, 400);
    setTimeout(() => say("hi! i'm BIT, vamsi's pixel pet. click me to ask anything ^-^", 6500), 900);
  })();

  /* section commentary while scrolling */
  const SECTION_LINES = {
    about: "that's his character sheet. 100% true. i fact-checked it myself.",
    experience: 'IEEE first-author at 20. i am a very proud pet.',
    projects: 'psst... one of these cartridges is not like the others.',
    skills: 'he feeds me CUDA kernels for breakfast.',
    trophies: 'shiny. very shiny. do not touch.',
    contact: 'go on, recruit him. i need the kibble money.',
  };
  const saidSections = new Set();
  const secObs = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id;
    if (saidSections.has(id) || !canSay()) return;
    saidSections.add(id);
    say(SECTION_LINES[id]);
  }), { threshold: 0.4 });
  Object.keys(SECTION_LINES).forEach(id => {
    const el = document.getElementById(id);
    if (el) secObs.observe(el);
  });

  /* idle quips */
  const QUIPS = [
    'found the konami code yet?',
    'try pressing / sometime. just saying.',
    'i am 16 pixels wide and entirely slop-free.',
    'meow. that is pet-speak for "hire vamsi".',
    'he once saved lakhs of rupees with software. i saved a screenshot.',
    'the footer accepts coins. i accept head pats.',
    'beat the snake high score. claim your place among the pilots.',
  ];
  let quipIdx = Math.floor(Math.random() * QUIPS.length);
  setInterval(() => {
    if (!canSay(30000)) return;
    say(QUIPS[quipIdx++ % QUIPS.length]);
  }, 38000);

  /* ================= CHAT ================= */
  const history = [];
  let pending = false;

  function addMsg(cls, text) {
    const el = document.createElement('div');
    el.className = 'pet-msg ' + cls;
    el.textContent = text;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function openChat() {
    wakeUp();
    chat.classList.remove('hidden');
    bubble.classList.add('hidden');
    GV.audio.coin();
    if (!log.childElementCount) {
      addMsg('bot', "meow! i'm BIT. ask me anything about vamsi — projects, skills, how to hire him, or where the secrets are.");
    }
    setTimeout(() => input.focus(), 60);
  }
  function closeChat() { chat.classList.add('hidden'); }

  cv.addEventListener('click', () => {
    hearts();
    GV.audio.eat();
    chat.classList.contains('hidden') ? openChat() : closeChat();
  });
  cv.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openChat(); } });
  $('#pet-close').addEventListener('click', closeChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !chat.classList.contains('hidden')) closeChat();
  });

  $('#pet-form').addEventListener('submit', async e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text || pending) return;
    input.value = '';
    GV.unlock('pet_chat');
    GV.audio.blip();

    history.push({ role: 'user', content: text });
    addMsg('user', text);
    const botEl = addMsg('bot typing', '');
    pending = true;
    sendBtn.disabled = true;

    try {
      const direct = !!CFG.devKey;
      if (!direct && !CFG.endpoint) {
        throw new Error('brain not deployed — set CHAT_ENDPOINT in config.js');
      }
      const url = direct ? 'https://api.deepseek.com/chat/completions' : CFG.endpoint;
      const headers = { 'Content-Type': 'application/json' };
      if (direct) headers.Authorization = 'Bearer ' + CFG.devKey;
      const msgs = [{ role: 'system', content: SYSTEM }, ...history.slice(-12)];
      const body = direct
        ? { model: 'deepseek-v4-flash', messages: msgs, stream: true, max_tokens: 500, temperature: 0.8, thinking: { type: 'disabled' } }
        : { messages: msgs };
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '', full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const data = t.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta;
            if (delta && delta.content) {
              full += delta.content;
              botEl.textContent = full;
              log.scrollTop = log.scrollHeight;
            }
          } catch { /* partial frame, ignored */ }
        }
      }
      if (!full) full = '...static noises... try that again?';
      botEl.textContent = full;
      history.push({ role: 'assistant', content: full });
      if (history.length > 24) history.splice(0, history.length - 24);
      GV.audio.nav();
    } catch (err) {
      botEl.textContent = 'connection lost (' + err.message + '). the hamster powering my brain needs a sec — try again.';
      botEl.classList.add('err');
      history.pop();
    } finally {
      botEl.classList.remove('typing');
      pending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  });
})();
