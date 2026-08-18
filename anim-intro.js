/* ANIM OS — automatic premium logo intro */
(() => {
  'use strict';

  const start = () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    const logo = intro?.querySelector('.anim-logo');
    if (!intro || !main || !logo) return;

    // The intro is a cinematic sequence, never a tap-to-enter screen.
    intro.style.pointerEvents = 'none';
    requestAnimationFrame(() => logo.classList.add('reveal'));

    // Let the logo breathe, then transition into the library automatically.
    window.setTimeout(() => {
      intro.classList.add('is-exiting');

      window.setTimeout(() => {
        intro.style.display = 'none';
        main.style.display = 'block';

        if (typeof window.startGreeting === 'function') {
          window.startGreeting();
        }

        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      }, 1000);
    }, 5000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
