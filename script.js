(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const audio = {
    enabled: false,
    blip() {},
    nav() {},
    coin() {},
    eat() {},
  };

  function unlock() {}
  function addScore() {}

  window.GV = { unlock, addScore, audio };

  function initLoader() {
    const loader = $('#loading-screen');
    if (!loader) return;

    const bar = $('#loader-progress');
    const percent = $('#loader-percent');
    const status = $('#loader-status');
    const labels = [
      [0, 'Preparing portfolio'],
      [28, 'Loading resume links'],
      [55, 'Loading projects'],
      [78, 'Starting BIT'],
      [96, 'Ready'],
    ];

    let pageReady = document.readyState === 'complete';
    const startedAt = performance.now();
    const minTime = reducedMotion ? 240 : 1150;
    const maxTime = reducedMotion ? 420 : 3200;

    window.addEventListener('load', () => { pageReady = true; }, { once: true });

    function setProgress(value) {
      const safeValue = Math.max(0, Math.min(100, Math.round(value)));
      if (bar) bar.style.width = safeValue + '%';
      if (percent) percent.textContent = safeValue + '%';
      if (status) {
        const label = labels.reduce((current, item) => safeValue >= item[0] ? item[1] : current, labels[0][1]);
        status.textContent = label;
      }
    }

    function finish() {
      setProgress(100);
      window.setTimeout(() => {
        loader.classList.add('is-done');
        loader.addEventListener('transitionend', () => loader.remove(), { once: true });
        window.setTimeout(() => loader.remove(), 900);
      }, reducedMotion ? 80 : 220);
    }

    function tick(now) {
      const elapsed = now - startedAt;
      const base = Math.min(96, (elapsed / minTime) * 96);
      const done = (pageReady && elapsed >= minTime) || elapsed >= maxTime;

      if (done) {
        finish();
        return;
      }

      setProgress(base);
      window.requestAnimationFrame(tick);
    }

    window.requestAnimationFrame(tick);
  }

  initLoader();

  const profileTabs = $$('.profile-tab');
  const profilePanels = $$('[data-profile-panel]');
  const profileNavs = $$('[data-profile-nav]');
  const profileHeaderLinks = $$('.tech-header-link, .film-header-link');
  const profileDescription = $('meta[name="description"]');

  function profileFromHash() {
    return location.hash === '#film' || location.hash.startsWith('#film-') ? 'film' : 'tech';
  }

  function setProfile(profile, updateHash = true) {
    const isFilm = profile === 'film';
    document.body.classList.toggle('profile-film', isFilm);

    profilePanels.forEach(panel => {
      const active = panel.dataset.profilePanel === profile;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });

    profileTabs.forEach(tab => {
      const active = tab.dataset.profile === profile;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-pressed', String(active));
    });

    profileNavs.forEach(nav => {
      nav.hidden = nav.dataset.profileNav !== profile;
      $$('a', nav).forEach(link => link.classList.remove('active'));
    });

    profileHeaderLinks.forEach(link => {
      link.hidden = (isFilm ? 'film' : 'tech') !== (link.classList.contains('film-header-link') ? 'film' : 'tech');
    });

    document.title = isFilm
      ? 'Galaba Vamsi | Filmmaker, Editor & Director'
      : 'Galaba Vamsi | Software Engineer & AI/ML Researcher';
    if (profileDescription) {
      profileDescription.setAttribute('content', isFilm
        ? 'Film portfolio of Galaba Vamsi, a filmmaker, editor, director, writer, and Mechatronics student at IIT Bhilai.'
        : 'Portfolio of Galaba Vamsi, a software engineer and AI/ML researcher at IIT Bhilai.');
    }

    if (updateHash) {
      const nextHash = isFilm ? '#film' : '#home';
      if (location.hash !== nextHash) history.replaceState(null, '', nextHash);
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }

  const initialProfile = profileFromHash();
  setProfile(initialProfile, false);
  if (initialProfile === 'film' && location.hash === '#film') {
    const resetFilmScroll = () => window.scrollTo(0, 0);
    resetFilmScroll();
    window.addEventListener('load', () => window.setTimeout(resetFilmScroll, 0), { once: true });
    window.setTimeout(resetFilmScroll, 180);
  }
  profileTabs.forEach(tab => tab.addEventListener('click', () => setProfile(tab.dataset.profile)));
  const brand = $('.brand');
  if (brand) brand.addEventListener('click', () => setProfile('tech'));

  const revealItems = $$('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('on'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('on');
        revealObserver.unobserve(entry.target);
      }
    }, { threshold: 0.14 });
    revealItems.forEach(el => revealObserver.observe(el));
  }

  const navLinks = $$('.site-nav a');
  // Only same-page anchors take part in scroll-spy; blog pages link out with paths.
  const sections = navLinks
    .map(link => link.getAttribute('href'))
    .filter(href => href && href.startsWith('#'))
    .map(href => $(href))
    .filter(Boolean);

  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting && entry.target.closest('.profile-panel.is-active'))
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach(link => {
        const inActiveNav = !link.closest('.site-nav')?.hidden;
        link.classList.toggle('active', inActiveNav && link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, { threshold: [0.25, 0.5, 0.75] });
    sections.forEach(section => navObserver.observe(section));
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.forEach(item => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
})();
