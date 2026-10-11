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

  const TECH_TITLE = 'Galaba Vamsi | Mechatronics, IIT Bhilai | Software, AI and robotics';
  const TECH_DESCRIPTION = 'Mechatronics at IIT Bhilai. Full-stack apps, AI agents, and ML models, plus open-source robotics tools (HFlow, Inspect Robots, Cerulion). Co-founder, Human Slop. Co-author, 2 RIS papers.';
  const FILM_TITLE = 'Galaba Vamsi | Filmmaker, Editor & Director';
  const FILM_DESCRIPTION = 'Film portfolio of Galaba Vamsi, a filmmaker, editor, director, writer, and Mechatronics student at IIT Bhilai.';

  const profileTabs = $$('.profile-tab');
  const profilePanels = $$('[data-profile-panel]');
  const profileNavs = $$('[data-profile-nav]');
  const profileHeaderLinks = $$('.tech-header-link, .film-header-link');
  const profileDescription = $('meta[name="description"]');

  // Same-page anchors only; blog pages link back to the home page with paths.
  const isHashLink = link => (link.getAttribute('href') || '').startsWith('#');

  /* ---------- Mobile menu ---------- */

  const header = $('.site-header');
  const menuQuery = matchMedia('(max-width: 900px)');
  let menuToggle = header ? $('.menu-toggle', header) : null;
  let menuPanel = menuToggle ? document.getElementById(menuToggle.getAttribute('aria-controls')) : null;

  // Blog pages share this script but not the menu markup, so build it there.
  if (header && $('.site-nav', header) && (!menuToggle || !menuPanel)) {
    menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.type = 'button';
    menuToggle.textContent = 'Menu';
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-controls', 'site-menu');
    menuPanel = document.createElement('div');
    menuPanel.id = 'site-menu';
    menuPanel.className = 'site-menu';
    menuPanel.hidden = true;
    const menuNav = document.createElement('nav');
    menuNav.className = 'site-menu-nav';
    menuPanel.append(menuNav);
    header.append(menuToggle, menuPanel);
  }

  const menuNav = menuPanel ? $('.site-menu-nav', menuPanel) : null;

  function activeSourceNav() {
    if (!header) return null;
    return $$('.site-nav', header).find(nav => !nav.hidden) || null;
  }

  function buildMenu() {
    if (!menuNav) return;
    const source = activeSourceNav();
    menuNav.replaceChildren();
    if (!source) return;
    menuNav.setAttribute('aria-label', source.getAttribute('aria-label') || 'Site navigation');
    $$('a', source).forEach(link => {
      const item = link.cloneNode(true);
      item.removeAttribute('id');
      if (item.classList.contains('active')) item.setAttribute('aria-current', isHashLink(item) ? 'location' : 'page');
      else item.removeAttribute('aria-current');
      menuNav.append(item);
    });
  }

  function isMenuOpen() {
    return Boolean(menuToggle && menuToggle.getAttribute('aria-expanded') === 'true');
  }

  function openMenu() {
    if (!menuToggle || !menuPanel) return;
    buildMenu();
    menuPanel.hidden = false;
    menuToggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu(returnFocus = false) {
    if (!menuToggle || !menuPanel) return;
    menuPanel.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    if (returnFocus) menuToggle.focus();
  }

  if (menuToggle && menuPanel) {
    menuToggle.hidden = false;
    buildMenu();

    menuToggle.addEventListener('click', () => {
      if (isMenuOpen()) closeMenu();
      else openMenu();
    });

    menuPanel.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      if (isHashLink(link)) markActive(link.getAttribute('href').slice(1));
      closeMenu();
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && isMenuOpen()) {
        event.preventDefault();
        closeMenu(true);
      }
    });

    document.addEventListener('click', event => {
      if (!isMenuOpen()) return;
      if (menuPanel.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });

    // Tabbing past the last link closes the menu instead of leaving it open behind focus.
    menuPanel.addEventListener('focusout', event => {
      const next = event.relatedTarget;
      if (!isMenuOpen() || !next) return;
      if (menuPanel.contains(next) || menuToggle.contains(next)) return;
      closeMenu();
    });

    const onViewportChange = event => {
      if (!event.matches && isMenuOpen()) closeMenu();
    };
    if (menuQuery.addEventListener) menuQuery.addEventListener('change', onViewportChange);
    else if (menuQuery.addListener) menuQuery.addListener(onViewportChange);
  }

  /* ---------- Profiles ---------- */

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

    // Blog pages load this script too; leave their own titles and descriptions alone.
    if (profilePanels.length) {
      document.title = isFilm ? FILM_TITLE : TECH_TITLE;
      if (profileDescription) {
        profileDescription.setAttribute('content', isFilm ? FILM_DESCRIPTION : TECH_DESCRIPTION);
      }
    }

    // The menu always lists the active profile's links.
    buildMenu();

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

  /* ---------- Reveal on scroll ---------- */

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

  /* ---------- Scroll-spy ---------- */

  const navLinks = $$('.site-nav a').filter(isHashLink);

  function markActive(id) {
    const href = id ? `#${id}` : null;
    navLinks.forEach(link => {
      const inActiveNav = !link.closest('.site-nav')?.hidden;
      link.classList.toggle('active', inActiveNav && link.getAttribute('href') === href);
    });
    if (menuNav) {
      $$('a', menuNav).filter(isHashLink).forEach(link => {
        const current = link.getAttribute('href') === href;
        link.classList.toggle('active', current);
        if (current) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }

  // Every section in both profiles. A section without a nav link (About, Skills, ...)
  // clears the highlight, so the header never points at a section you already left.
  const spySections = $$('[data-profile-panel] .section[id]');

  if (spySections.length && 'IntersectionObserver' in window) {
    const crossing = new Set();
    const spyObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) crossing.add(entry.target);
        else crossing.delete(entry.target);
      });
      const current = spySections.find(section => crossing.has(section) && section.closest('.profile-panel.is-active'));
      if (current) markActive(current.id);
    }, { rootMargin: '-35% 0px -60% 0px', threshold: 0 });
    spySections.forEach(section => spyObserver.observe(section));

    // The last section can be too short to reach the band; at the very bottom, pick it.
    let bottomCheckQueued = false;
    window.addEventListener('scroll', () => {
      if (bottomCheckQueued) return;
      bottomCheckQueued = true;
      requestAnimationFrame(() => {
        bottomCheckQueued = false;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (!atBottom) return;
        const visibleSections = spySections.filter(section => section.closest('.profile-panel.is-active'));
        const last = visibleSections[visibleSections.length - 1];
        if (last) markActive(last.id);
      });
    }, { passive: true });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', () => markActive(link.getAttribute('href').slice(1)));
  });

  /* ---------- Page views ---------- */
  // One count per page per browser session, stored as a daily counter in Supabase
  // (no IPs, no identities). Local dev reads the count without adding to it.
  (async function pageViews() {
    const cfg = window.GV_CONFIG || {};
    const footer = $('footer');
    if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY || !footer) return;
    const path = location.pathname.replace(/index\.html$/, '') || '/';
    const local = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
    let counted = false;
    try { counted = sessionStorage.getItem('gv-viewed:' + path) === '1'; } catch { /* storage blocked */ }
    const fn = local || counted ? 'view_count' : 'track_view';
    try {
      const res = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: {
          apikey: cfg.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_path: path }),
      });
      if (!res.ok) return;
      const total = Number(await res.json());
      if (fn === 'track_view') {
        try { sessionStorage.setItem('gv-viewed:' + path, '1'); } catch { /* storage blocked */ }
      }
      if (!Number.isFinite(total) || total < 1) return;
      const note = document.createElement('p');
      note.className = 'view-count';
      note.textContent = `${total.toLocaleString('en-IN')} ${total === 1 ? 'view' : 'views'} on this page`;
      footer.append(note);
    } catch { /* offline or blocked: show nothing */ }
  })();
})();
