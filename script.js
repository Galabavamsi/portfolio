/* ============================================================
   PORTFOLIO.ROM — game systems
   audio · boot · typewriter · reveals · score · achievements
   konami · snake · terminal · coins · idle wanderer
   ============================================================ */
(() => {
  'use strict';

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= AUDIO — square-wave chiptune blips ================= */
  const audio = {
    ctx: null,
    enabled: localStorage.getItem('gv_sound') !== 'off',
    ensure() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    },
    tone(freq, dur = 0.06, delay = 0, vol = 0.04, type = 'square') {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    blip() { this.tone(660, 0.05); },
    nav() { this.tone(440, 0.04); },
    coin() { this.tone(988, 0.07); this.tone(1319, 0.18, 0.07, 0.05); },
    achieve() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.1, i * 0.09, 0.05)); },
    eat() { this.tone(880, 0.05); this.tone(1175, 0.06, 0.05); },
    over() { [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.14, i * 0.12, 0.05)); },
    boot() { this.tone(262, 0.1); this.tone(523, 0.18, 0.1, 0.05); },
  };

  const soundBtn = $('#sound-btn');
  const syncSoundBtn = () => soundBtn.classList.toggle('off', !audio.enabled);
  syncSoundBtn();
  soundBtn.addEventListener('click', () => {
    audio.enabled = !audio.enabled;
    localStorage.setItem('gv_sound', audio.enabled ? 'on' : 'off');
    audio.ensure();
    syncSoundBtn();
    audio.blip();
  });
  // browsers require a gesture before audio — arm on first interaction
  ['pointerdown', 'keydown'].forEach(ev =>
    document.addEventListener(ev, () => audio.ensure(), { once: true, capture: true }));

  /* ================= SCORE ================= */
  let score = 0;
  const scoreEl = $('#score');
  function addScore(n) {
    score += n;
    scoreEl.textContent = String(score).padStart(6, '0');
  }

  /* ================= ACHIEVEMENTS ================= */
  const ACH = [
    { id: 'power_on', name: 'POWER ON', desc: 'Booted the cartridge.' },
    { id: 'explorer', name: 'CARTOGRAPHER', desc: 'Visited every level.' },
    { id: 'konami', name: 'GOD MODE', desc: '↑↑↓↓←→←→BA — you know the ways.' },
    { id: 'snake_play', name: 'CARTRIDGE INSERTED', desc: 'Played the mystery ROM.' },
    { id: 'snake_15', name: 'SNAKE CHARMER', desc: 'Scored 15+ in SNAKE.' },
    { id: 'coins_10', name: 'BIG SPENDER', desc: 'Inserted 10 coins.' },
    { id: 'terminal', name: 'HACKERMAN', desc: 'Opened the terminal.' },
    { id: 'masher', name: 'BUTTON MASHER', desc: 'Clicked the logo 5 times.' },
    { id: 'wanderer', name: 'BUG HUNTER', desc: 'Caught the wandering invader.' },
    { id: 'pet_chat', name: 'MADE A FRIEND', desc: 'Had a chat with BIT.' },
  ];
  const unlocked = new Set(JSON.parse(localStorage.getItem('gv_ach') || '[]'));
  const countEl = $('#secret-count');
  const syncCount = () => { countEl.textContent = `ACHIEVEMENTS ${unlocked.size}/${ACH.length}`; };
  syncCount();

  const toastQueue = [];
  let toastBusy = false;
  function showToast(a) {
    toastQueue.push(a);
    if (!toastBusy) nextToast();
  }
  function nextToast() {
    const a = toastQueue.shift();
    if (!a) { toastBusy = false; return; }
    toastBusy = true;
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = `<div class="toast-title">★ ACHIEVEMENT UNLOCKED</div>
      <div class="toast-name">${a.name}</div><div class="toast-desc">${a.desc}</div>`;
    $('#toasts').appendChild(el);
    setTimeout(() => {
      el.classList.add('out');
      setTimeout(() => { el.remove(); nextToast(); }, 320);
    }, 2600);
  }

  function unlock(id) {
    if (unlocked.has(id)) return;
    const a = ACH.find(x => x.id === id);
    if (!a) return;
    unlocked.add(id);
    localStorage.setItem('gv_ach', JSON.stringify([...unlocked]));
    syncCount();
    addScore(50);
    audio.achieve();
    showToast(a);
  }

  /* ================= PIXEL AVATAR ================= */
  const PALETTE = {
    h: '#1c2a20', s: '#e8b88a', g: '#5af78e', w: '#0a0e0b',
    m: '#b07050', b: '#24332a', c: '#5af78e',
  };
  const SPRITE = [
    '....hhhhhhhh....',
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '..hhhhhhhhhhhh..',
    '..hhsssssssshh..',
    '..hssssssssssh..',
    '..gggggggggggg..',
    '..gwwgssssgwwg..',
    '..gwwgssssgwwg..',
    '..ssssssssssss..',
    '..ssssssssssss..',
    '...sssmmmmsss...',
    '....ssssssss....',
    '...bbbbbbbbbb...',
    '..bbbcbbbbcbbb..',
    '.bbbbbbbbbbbbbb.',
  ];
  (function drawAvatar() {
    const cv = $('#avatar');
    const ctx = cv.getContext('2d');
    SPRITE.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = PALETTE[ch] || PALETTE.s;
        ctx.fillRect(x, y, 1, 1);
      });
    });
  })();

  /* ================= BOOT SEQUENCE ================= */
  const boot = $('#boot');
  const bootLog = $('#boot-log');
  const bootStart = $('#boot-start');
  let bootDone = false;

  function dismissBoot() {
    if (bootDone) return;
    bootDone = true;
    sessionStorage.setItem('gv_booted', '1');
    audio.ensure();
    audio.boot();
    boot.classList.add('out');
    setTimeout(() => boot.remove(), 500);
    unlock('power_on');
    startTypewriter();
  }

  if (sessionStorage.getItem('gv_booted') || reducedMotion) {
    boot.remove();
    bootDone = true;
    unlock('power_on');
    startTypewriterSoon();
  } else {
    const LINES = [
      ['GV BIOS v2.6 — 64K RAM ', 'OK'],
      ['CPU: HUMAN BRAIN @ 3.6 GHz ', 'OK'],
      ['LOADING PORTFOLIO.ROM ', '████████ 100%'],
      ['CHECKSUM: NO AI SLOP DETECTED ', 'OK'],
    ];
    let li = 0;
    (function typeLine() {
      if (bootDone) return;
      if (li >= LINES.length) {
        bootStart.classList.remove('hidden');
        return;
      }
      const [txt, ok] = LINES[li++];
      const line = document.createElement('div');
      bootLog.appendChild(line);
      line.textContent = txt;
      setTimeout(() => {
        if (bootDone) return;
        const okSpan = document.createElement('span');
        okSpan.className = 'ok';
        okSpan.textContent = ok;
        line.appendChild(okSpan);
        audio.tone(523 + li * 80, 0.03, 0, 0.02);
        setTimeout(typeLine, 160);
      }, 220);
    })();
    boot.addEventListener('click', dismissBoot);
    document.addEventListener('keydown', function bootKey() {
      dismissBoot();
      document.removeEventListener('keydown', bootKey);
    });
  }

  /* ================= TYPEWRITER ================= */
  const ROLES = [
    'FULL-STACK ENGINEER',
    'AI/ML RESEARCHER',
    'GPU SHADER WIZARD',
    'CO-FOUNDER @ HUMAN SLOP',
    'IEEE FIRST-AUTHOR',
    'ZERO-BUDGET ARCHITECT',
  ];
  const twEl = $('#typewriter');
  let twStarted = false;
  function startTypewriterSoon() { setTimeout(startTypewriter, 300); }
  function startTypewriter() {
    if (twStarted) return;
    twStarted = true;
    if (reducedMotion) { twEl.textContent = ROLES[0]; return; }
    let ri = 0, ci = 0, deleting = false;
    (function tick() {
      const word = ROLES[ri % ROLES.length];
      if (!deleting) {
        ci++;
        if (ci === word.length) { deleting = true; setTimeout(tick, 1700); twEl.textContent = word; return; }
      } else {
        ci--;
        if (ci === 0) { deleting = false; ri++; }
      }
      twEl.textContent = word.slice(0, ci);
      setTimeout(tick, deleting ? 35 : 70);
    })();
  }

  /* ================= STAT BARS — build segments ================= */
  $$('.statbar').forEach(sb => {
    const fill = +sb.dataset.fill;
    const bar = $('.bar', sb);
    for (let i = 0; i < 10; i++) {
      const seg = document.createElement('i');
      if (i < fill) { seg.classList.add('fill'); seg.style.setProperty('--s', i); }
      bar.appendChild(seg);
    }
  });

  /* ================= SCROLL REVEALS + SECTION TRACKING ================= */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('on');
      if (e.target.classList.contains('panel')) {
        $$('.statbar', e.target).forEach(sb => sb.classList.add('lit'));
      }
      revealObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealObs.observe(el));
  document.addEventListener('animationend', e => {
    if (e.animationName === 'reveal-step') e.target.classList.add('done');
  });

  const SECTION_IDS = ['about', 'experience', 'projects', 'skills', 'trophies', 'contact'];
  const visited = new Set();
  const levelEl = $('#level');
  const navLinks = $$('#nav a');

  const sectionObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      const lv = e.target.dataset.level;
      if (lv) levelEl.textContent = lv;
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      if (!visited.has(id)) {
        visited.add(id);
        addScore(10);
        audio.nav();
        if (SECTION_IDS.every(s => visited.has(s))) unlock('explorer');
      }
    });
  }, { threshold: 0.25 });
  SECTION_IDS.forEach(id => { const el = $('#' + id); if (el) sectionObs.observe(el); });

  /* ================= XP BAR ================= */
  const xpFill = $('#xp-fill');
  let scrollTicking = false;
  addEventListener('scroll', () => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const pct = max > 0 ? (scrollY / max) * 100 : 0;
      // quantize to 5% steps — pixels don't glide
      xpFill.style.width = Math.round(pct / 5) * 5 + '%';
      scrollTicking = false;
    });
  }, { passive: true });

  /* ================= KONAMI ================= */
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let kIdx = 0;
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    kIdx = key === KONAMI[kIdx] ? kIdx + 1 : (key === KONAMI[0] ? 1 : 0);
    if (kIdx === KONAMI.length) {
      kIdx = 0;
      document.body.classList.toggle('god');
      unlock('konami');
      audio.achieve();
    }
  });

  /* ================= LOGO MASHER ================= */
  let logoClicks = 0;
  $('#logo').addEventListener('click', () => {
    logoClicks++;
    audio.blip();
    const logo = $('#logo');
    logo.classList.remove('shake');
    void logo.offsetWidth; // restart animation
    logo.classList.add('shake');
    if (logoClicks >= 5) unlock('masher');
  });

  /* ================= COIN SLOT ================= */
  let coins = 0;
  $('#coin-slot').addEventListener('click', e => {
    coins++;
    addScore(1);
    audio.coin();
    const f = document.createElement('span');
    f.className = 'coin-float';
    f.textContent = '+1';
    f.style.left = (e.clientX - 8) + 'px';
    f.style.top = (e.clientY - 24) + 'px';
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 850);
    if (coins >= 10) unlock('coins_10');
  });

  /* ================= MODAL PLUMBING ================= */
  function openModal(id) {
    $('#' + id).classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id) {
    $('#' + id).classList.add('hidden');
    document.body.style.overflow = '';
    if (id === 'game-modal') snake.stop();
  }
  $$('.modal-close').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
  $$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m) closeModal(m.id); }));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $$('.modal:not(.hidden)').forEach(m => closeModal(m.id));
  });

  /* ================= SNAKE ================= */
  const snake = (() => {
    const cv = $('#snake');
    const ctx = cv.getContext('2d');
    const CELL = 16, N = 20; // 20x20 grid on 320px canvas
    const scoreEl2 = $('#snake-score');
    const bestEl = $('#snake-best');
    const msgEl = $('#game-msg');
    let body, dir, nextDir, food, sc, timer, speed, state; // state: idle|run|over
    let best = +(localStorage.getItem('gv_snake_best') || 0);
    bestEl.textContent = best;

    const cssVar = n => getComputedStyle(document.body).getPropertyValue(n).trim();

    function reset() {
      body = [{ x: 9, y: 10 }, { x: 8, y: 10 }, { x: 7, y: 10 }];
      dir = { x: 1, y: 0 };
      nextDir = dir;
      sc = 0;
      speed = 130;
      scoreEl2.textContent = 0;
      spawnFood();
      draw();
    }
    function spawnFood() {
      do {
        food = { x: (Math.random() * N) | 0, y: (Math.random() * N) | 0 };
      } while (body.some(p => p.x === food.x && p.y === food.y));
    }
    function start() {
      reset();
      state = 'run';
      msgEl.textContent = '';
      unlock('snake_play');
      clearInterval(timer);
      timer = setInterval(step, speed);
    }
    function stop() {
      clearInterval(timer);
      state = 'idle';
      msgEl.textContent = 'PRESS ANY KEY / TAP TO START';
    }
    function gameOver() {
      clearInterval(timer);
      state = 'over';
      audio.over();
      if (sc > best) {
        best = sc;
        localStorage.setItem('gv_snake_best', best);
        bestEl.textContent = best;
        msgEl.textContent = `NEW BEST: ${sc}! PRESS ANY KEY`;
      } else {
        msgEl.textContent = 'GAME OVER — PRESS ANY KEY';
      }
      if (sc >= 15) unlock('snake_15');
      addScore(sc);
      window.GVLB?.submit(sc);
    }
    function step() {
      dir = nextDir;
      const head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= N || head.y >= N ||
          body.some(p => p.x === head.x && p.y === head.y)) return gameOver();
      body.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        sc++;
        scoreEl2.textContent = sc;
        audio.eat();
        spawnFood();
        if (sc % 5 === 0 && speed > 70) {
          speed -= 12;
          clearInterval(timer);
          timer = setInterval(step, speed);
        }
      } else {
        body.pop();
      }
      draw();
    }
    function draw() {
      ctx.fillStyle = '#070a08';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.fillStyle = cssVar('--faint') || '#2a3a2e';
      for (let i = 0; i <= N; i++) {
        ctx.fillRect(i * CELL, 0, 1, cv.height);
        ctx.fillRect(0, i * CELL, cv.width, 1);
      }
      ctx.fillStyle = cssVar('--gold') || '#ffb454';
      ctx.fillRect(food.x * CELL + 3, food.y * CELL + 3, CELL - 6, CELL - 6);
      const acc = cssVar('--accent') || '#5af78e';
      body.forEach((p, i) => {
        ctx.fillStyle = i === 0 ? acc : (i % 2 ? acc + 'cc' : acc);
        ctx.fillRect(p.x * CELL + 1, p.y * CELL + 1, CELL - 2, CELL - 2);
      });
    }
    function turn(d) {
      const map = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
      const nd = map[d];
      if (!nd || (state !== 'run')) return;
      if (nd.x === -dir.x && nd.y === -dir.y) return; // no 180s
      nextDir = nd;
    }
    const naming = () => $('#game-modal').classList.contains('naming');
    function onKey(e) {
      const m = $('#game-modal');
      if (m.classList.contains('hidden') || naming()) return;
      if (!$('#lb-panel')?.classList.contains('hidden')) return; // rankings open
      const dirs = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right' };
      if (e.key in dirs || ['Enter', ' '].includes(e.key) || state !== 'run') e.preventDefault();
      if (state !== 'run') {
        if (e.key !== 'Escape') start();
        return;
      }
      const d = dirs[e.key];
      if (d) turn(d);
    }
    document.addEventListener('keydown', onKey);
    // touch: tap to start, swipe to steer
    let tx = 0, ty = 0;
    cv.addEventListener('touchstart', e => {
      if (naming()) return;
      const t = e.touches[0];
      tx = t.clientX; ty = t.clientY;
      if (state !== 'run') start();
    }, { passive: true });
    cv.addEventListener('touchmove', e => {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.abs(dx) + Math.abs(dy) < 24) return;
      turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      tx = t.clientX; ty = t.clientY;
    }, { passive: false });
    $$('.dpad button').forEach(b => b.addEventListener('click', () => {
      if (naming()) return;
      if (state !== 'run') start(); else turn(b.dataset.dir);
    }));
    cv.addEventListener('click', () => { if (!naming() && state !== 'run') start(); });

    reset();
    state = 'idle';
    return { stop, open() { openModal('game-modal'); stop(); draw(); } };
  })();

  $('#secret-cart').addEventListener('click', () => { audio.coin(); snake.open(); });

  /* ================= TERMINAL ================= */
  const term = (() => {
    const out = $('#term-out');
    const input = $('#term-in');
    function print(html, cls = '') {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.innerHTML = html;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    }
    function open() {
      openModal('terminal');
      unlock('terminal');
      if (!out.childElementCount) {
        print('GV-SHELL v2.6 — type <span class="t-acc">help</span> for commands.', 't-dim');
      }
      setTimeout(() => input.focus(), 50);
    }
    const CMDS = {
      help: () => print(
        `<span class="t-acc">help</span>      this menu
<span class="t-acc">whoami</span>    player info
<span class="t-acc">ls</span>        list levels
<span class="t-acc">open</span> &lt;x&gt;  jump to a level (e.g. open projects)
<span class="t-acc">skills</span>    dump the stat sheet
<span class="t-acc">resume</span>    open resume.pdf
<span class="t-acc">contact</span>   how to reach me
<span class="t-acc">snake</span>     insert the mystery cartridge
<span class="t-acc">player</span> &lt;name&gt;  set your pilot name
<span class="t-acc">secrets</span>   hints for the hidden stuff
<span class="t-acc">sudo hire-me</span>  do it.
<span class="t-acc">clear</span> / <span class="t-acc">exit</span>`),
      whoami: () => print(`GALABA VAMSI — software engineer & AI/ML researcher.
IIT Bhilai '27 · IEEE first-author · YC Startup School founder · Inter IIT 5th.`, 't-dim'),
      ls: () => print('about/  experience/  projects/  skills/  trophies/  contact/', 't-acc'),
      skills: () => print(`LANG:   python c/c++ ts/js kotlin swift dart go glsl cuda
WEB:    react react-native node flutter postgresql aws openmpi
AI/ML:  pytorch gatv2 safe-rl transformers opencv cupy
SYS:    wifi-phy/mac sdr/usrp 802.11k/v pcb-design linux`, 't-dim'),
      resume: () => { window.open('vamsi%20resume.pdf', '_blank'); print('opening resume.pdf ...', 't-dim'); },
      contact: () => print(`email:    <a href="mailto:galabavamsi12@gmail.com">galabavamsi12@gmail.com</a>
github:   <a href="https://github.com/Galabavamsi" target="_blank" rel="noopener">github.com/Galabavamsi</a>
linkedin: <a href="https://www.linkedin.com/in/galabavamsi" target="_blank" rel="noopener">linkedin.com/in/galabavamsi</a>`),
      snake: () => { closeModal('terminal'); snake.open(); },
      secrets: () => print(`${ACH.length - unlocked.size} undiscovered...
- the oldest cheat code in the book still works
- the dusty cartridge in the library is playable
- arcade machines love coins. ten of them.
- the logo can take a beating
- go AFK for ~30s and watch the floor
- see every level to map the world
- the critter in the corner answers questions`, 't-dim'),
      konami: () => print('nice try. you have to actually press it. ↑↑ ...', 't-dim'),
      clear: () => { out.innerHTML = ''; },
      exit: () => closeModal('terminal'),
      'sudo hire-me': () => {
        print('[sudo] permission granted. compiling offer letter ...', 't-acc');
        setTimeout(() => { location.href = 'mailto:galabavamsi12@gmail.com?subject=We%20want%20to%20hire%20you'; }, 900);
      },
      god: () => { document.body.classList.toggle('god'); print('palette override toggled.', 't-acc'); },
    };
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const raw = input.value.trim();
      input.value = '';
      if (!raw) return;
      print(`<span class="t-cmd">guest@gv:~$ ${raw.replace(/</g, '&lt;')}</span>`);
      audio.blip();
      const lower = raw.toLowerCase();
      if (CMDS[lower]) { CMDS[lower](); return; }
      if (lower.startsWith('open ')) {
        const arg = lower.slice(5).trim();
        const alias = { wins: 'trophies', exp: 'experience', proj: 'projects', home: 'hero' };
        const id = alias[arg] || arg;
        const el = $('#' + id);
        if (el) { closeModal('terminal'); el.scrollIntoView(); }
        else print(`no such level: ${id}`, 't-dim');
        return;
      }
      if (lower === 'player' || lower.startsWith('player ')) {
        const arg = raw.slice(6).trim();
        if (!arg) { print(`pilot: ${window.GVLB?.getName() || '(unset)'}`, 't-dim'); return; }
        print(window.GVLB?.setName(arg)
          ? `pilot name set: ${arg.replace(/</g, '&lt;')}`
          : 'invalid name — 1-12 chars: letters, numbers, _ - space', 't-dim');
        return;
      }
      if (lower === 'sudo' || lower.startsWith('sudo ')) { print('usage: sudo hire-me', 't-dim'); return; }
      if (['hi', 'hello', 'hey'].includes(lower)) { print('hey. type help.', 't-dim'); return; }
      if (lower === 'rm -rf /') { print('nice try. this ROM is read-only.', 't-dim'); return; }
      print(`command not found: ${lower.replace(/</g, '&lt;')} — try help`, 't-dim');
    });
    return { open };
  })();
  $('#term-btn').addEventListener('click', term.open);
  document.addEventListener('keydown', e => {
    if (e.key === '/' && e.target.tagName !== 'INPUT' && $$('.modal:not(.hidden)').length === 0) {
      e.preventDefault();
      term.open();
    }
  });

  /* ================= IDLE WANDERER ================= */
  let idleTimer, wandererEl = null;
  const INVADER = [
    '..g....g..',
    '...g..g...',
    '..gggggg..',
    '.gg.gg.gg.',
    'gggggggggg',
    'g.gggggg.g',
    'g.g....g.g',
    '...gg.gg..',
  ];
  function spawnWanderer() {
    if (wandererEl || reducedMotion || document.hidden) return;
    const cv = document.createElement('canvas');
    cv.id = 'wanderer';
    cv.width = 10; cv.height = 8;
    cv.title = 'catch it!';
    const ctx = cv.getContext('2d');
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#5af78e';
    INVADER.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'g') ctx.fillRect(x, y, 1, 1); }));
    cv.classList.add('bounce');
    cv.addEventListener('pointerdown', () => {
      unlock('wanderer');
      addScore(25);
      audio.coin();
      cv.remove();
      wandererEl = null;
    });
    cv.addEventListener('animationend', e => {
      if (e.animationName === 'wander') { cv.remove(); wandererEl = null; }
    });
    document.body.appendChild(cv);
    wandererEl = cv;
  }
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(spawnWanderer, 30000);
  }
  ['pointermove', 'keydown', 'scroll', 'pointerdown'].forEach(ev =>
    addEventListener(ev, resetIdle, { passive: true }));
  resetIdle();

  /* ================= NAV BLIPS ================= */
  $$('#nav a, .btn').forEach(el => el.addEventListener('click', () => audio.nav()));

  /* ================= PUBLIC BRIDGE (used by pet.js) ================= */
  window.GV = { unlock, addScore, audio };

  /* ================= CONSOLE EASTER EGG ================= */
  console.log(
    '%c▶ PORTFOLIO.ROM %c\n\nhey, fellow dev. you get a hint:\nthe terminal has a `secrets` command.\n\n— vamsi',
    'font-family: monospace; font-size: 20px; color: #5af78e; background: #0a0e0b; padding: 8px;',
    'font-family: monospace; color: #6b8a70;'
  );
})();
