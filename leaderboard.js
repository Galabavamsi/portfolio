/* ============================================================
   LEADERBOARD — Supabase-backed snake high scores
   asks for a player name before the first game, submits scores
   on game over, renders a TOP PILOTS ranking panel.
   Degrades gracefully when Supabase isn't configured yet.
   ============================================================ */
(() => {
  'use strict';

  const C = window.GV_CONFIG || {};
  const ready = !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY &&
    !C.SUPABASE_URL.includes('YOUR-') && !C.SUPABASE_ANON_KEY.includes('YOUR-'));
  const HEADERS = {
    apikey: C.SUPABASE_ANON_KEY,
    Authorization: 'Bearer ' + C.SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
  };
  const TABLE = C.SUPABASE_URL + '/rest/v1/leaderboard';
  const NAME_RE = /^[A-Za-z0-9_\- ]{1,12}$/;

  let name = localStorage.getItem('gv_player') || '';
  if (!NAME_RE.test(name)) name = '';

  const modal = document.getElementById('game-modal');
  const box = modal.querySelector('.modal-box');

  /* ---------- inject UI into the game modal ---------- */
  const bar = document.createElement('div');
  bar.className = 'game-bar';
  bar.innerHTML = `
    <span>PILOT <b id="lb-name">—</b></span>
    <button id="lb-toggle" type="button">★ RANKS</button>`;
  box.insertBefore(bar, box.querySelector('.game-hud'));

  const panel = document.createElement('div');
  panel.id = 'lb-panel';
  panel.className = 'hidden';
  panel.innerHTML = `
    <p class="lb-title">★ TOP PILOTS ★</p>
    <ol id="lb-list"><li class="lb-dim">loading...</li></ol>
    <button id="lb-back" type="button">◀ BACK TO GAME</button>`;
  box.appendChild(panel);

  const nameForm = document.createElement('form');
  nameForm.id = 'name-form';
  nameForm.className = 'hidden';
  nameForm.innerHTML = `
    <p class="lb-title">NEW PILOT DETECTED</p>
    <label for="name-in">ENTER YOUR NAME</label>
    <input id="name-in" type="text" maxlength="12" autocomplete="off"
      spellcheck="false" placeholder="AAA" aria-label="Player name">
    <p class="name-err hidden">1–12 chars: letters, numbers, _ - space</p>
    <button type="submit">▶ START</button>`;
  box.appendChild(nameForm);

  const nameEl = document.getElementById('lb-name');
  const listEl = document.getElementById('lb-list');
  const nameIn = document.getElementById('name-in');
  const nameErr = nameForm.querySelector('.name-err');
  const syncName = () => { nameEl.textContent = name || '—'; };
  syncName();

  /* ---------- name gate ---------- */
  function requireName() {
    // guard against MutationObserver re-entry: classList.add always re-sets
    // the attribute (a new mutation record) even when the token is present
    if (name || modal.classList.contains('naming')) return;
    modal.classList.add('naming');
    nameForm.classList.remove('hidden');
    setTimeout(() => nameIn.focus(), 60);
  }
  nameForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = nameIn.value.trim();
    if (!NAME_RE.test(v)) { nameErr.classList.remove('hidden'); return; }
    nameErr.classList.add('hidden');
    setName(v);
    modal.classList.remove('naming');
    nameForm.classList.add('hidden');
    window.GV?.audio.coin();
  });
  // keep game keys from firing while typing a name
  nameIn.addEventListener('keydown', e => e.stopPropagation());

  function setName(v) {
    if (!NAME_RE.test(v)) return false;
    name = v;
    localStorage.setItem('gv_player', v);
    syncName();
    return true;
  }

  // whenever the game modal opens, demand a name first
  new MutationObserver(() => {
    if (!modal.classList.contains('hidden')) requireName();
  }).observe(modal, { attributes: true, attributeFilter: ['class'] });

  /* ---------- score submission ---------- */
  let submitting = false;
  async function submit(score) {
    score = Math.min(Math.max(score | 0, 0), 400);
    if (!ready || !name || score < 1 || submitting) return;
    submitting = true;
    try {
      await fetch(TABLE, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'return=minimal' },
        body: JSON.stringify({ name, score }),
      });
      if (!panel.classList.contains('hidden')) renderTop();
    } catch { /* offline — scores stay local */ }
    submitting = false;
  }

  /* ---------- rankings panel ---------- */
  async function fetchTop() {
    const res = await fetch(
      TABLE + '?select=name,score&order=score.desc&limit=60', { headers: HEADERS });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const rows = await res.json();
    const seen = new Set(), top = [];
    for (const r of rows) {            // best score per name
      if (seen.has(r.name)) continue;
      seen.add(r.name);
      top.push(r);
      if (top.length === 10) break;
    }
    return top;
  }

  async function renderTop() {
    if (!ready) {
      listEl.innerHTML = '<li class="lb-dim">LEADERBOARD OFFLINE — supabase not configured (see README)</li>';
      return;
    }
    listEl.innerHTML = '<li class="lb-dim">loading...</li>';
    try {
      const top = await fetchTop();
      if (!top.length) {
        listEl.innerHTML = '<li class="lb-dim">no scores yet. be the first!</li>';
        return;
      }
      listEl.innerHTML = top.map(r =>
        `<li class="${r.name === name ? 'lb-me' : ''}">
          <span>${r.name.replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]))}</span>
          <b>${r.score}</b></li>`).join('');
    } catch {
      listEl.innerHTML = '<li class="lb-dim">connection lost — try again later</li>';
    }
  }

  document.getElementById('lb-toggle').addEventListener('click', () => {
    panel.classList.remove('hidden');
    window.GV?.audio.nav();
    renderTop();
  });
  document.getElementById('lb-back').addEventListener('click', () => {
    panel.classList.add('hidden');
    window.GV?.audio.nav();
  });

  window.GVLB = { submit, setName, getName: () => name, isReady: () => ready };
})();
