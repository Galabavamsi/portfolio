/* ============================================================
   Post-page extras: reading progress rail + table-of-contents
   highlighting. Both degrade to nothing if the markup is absent.
   ============================================================ */
(() => {
  'use strict';

  const bar = document.getElementById('read-progress');
  const body = document.querySelector('.post-body');
  const tocLinks = [...document.querySelectorAll('.post-toc a')];
  const headings = tocLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (!bar && !headings.length) return;

  function progress() {
    if (!bar || !body) return;
    const span = body.offsetHeight - window.innerHeight * 0.5;
    const done = span > 0 ? (window.scrollY - body.offsetTop) / span : 1;
    bar.style.width = Math.max(0, Math.min(1, done)) * 100 + '%';
  }

  function highlight() {
    if (!headings.length) return;
    // The active entry is the last heading whose top has passed the reading line.
    const line = window.innerHeight * 0.3;
    let current = headings[0];
    for (const heading of headings) {
      if (heading.getBoundingClientRect().top <= line) current = heading;
    }
    tocLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current.id}`);
    });
  }

  let queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      progress();
      highlight();
    });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  addEventListener('load', () => { progress(); highlight(); });
  progress();
  highlight();
})();
