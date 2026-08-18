/* ANIM OS — simple premium logo intro */
(() => {
  'use strict';
  const start = () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    const logo = intro?.querySelector('.anim-logo');
    if (!intro || !main || !logo) return;

    requestAnimationFrame(() => logo.classList.add('reveal'));

    // Logo reveal + a clean 2-second hero hold on pure black.
    window.setTimeout(() => {
      intro.classList.add('is-exiting');
      window.setTimeout(() => {
        intro.style.display = 'none';
        main.style.display = 'block';
        if (typeof window.startGreeting === 'function') window.startGreeting();
        requestAnimationFrame(() => {
          if (typeof window.initNarrativeWorld === 'function') window.initNarrativeWorld();
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        });
      }, 1000);
    }, 5000);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
