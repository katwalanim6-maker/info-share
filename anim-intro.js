/* ANIM OS — refined handwritten hello sequence */
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

    // Keep the entire stage pure black while the handwritten mark is drawn.
    requestAnimationFrame(() => {
      script?.classList.add('play');
      window.setTimeout(() => letters && (letters.style.opacity = '1'), 2850);
      window.setTimeout(() => word?.classList.add('collapsing'), 4050);
      window.setTimeout(() => logo?.classList.add('reveal'), 5000);
    });

    // Logo gets a full 2-second hero hold before the website appears.
    // 5.0s reveal start + 2.0s hold + 0.8s fade = 7.8s total.
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
      }, 800);
    }, 7000);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
