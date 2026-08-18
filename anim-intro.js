/* ANIM OS — cinematic automatic hello sequence */
(() => {
  'use strict';

  const start = () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    if (!intro || !main) return;

    const script = intro.querySelector('.anim-script');
    const letters = intro.querySelector('.anim-letters');
    const word = intro.querySelector('.anim-word');
    const logo = intro.querySelector('.anim-logo');

    // Give the browser a frame so the initial hidden SVG state is painted first.
    requestAnimationFrame(() => {
      script?.classList.add('play');
      window.setTimeout(() => letters && (letters.style.opacity = '1'), 2050);
      window.setTimeout(() => word?.classList.add('collapsing'), 3550);
      window.setTimeout(() => logo?.classList.add('reveal'), 4050);
    });

    // The logo gets its own hero moment, then the entire intro dissolves into the site.
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
      }, 900);
    }, 5550);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
