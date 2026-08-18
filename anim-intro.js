/* ANIM OS — cinematic title sequence */
(() => {
  'use strict';
  const start = () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    if (!intro || !main) return;
    const script = intro.querySelector('.anim-script');
    const a = intro.querySelector('.transition-a');
    const logo = intro.querySelector('.anim-logo');
    requestAnimationFrame(() => {
      script?.classList.add('play');
      setTimeout(() => script?.classList.add('deconstruct'), 3550);
      setTimeout(() => a?.classList.add('extract'), 3750);
      setTimeout(() => a?.classList.add('dissolve'), 5000);
      setTimeout(() => logo?.classList.add('reveal'), 5120);
    });
    setTimeout(() => {
      intro.classList.add('is-exiting');
      setTimeout(() => {
        intro.style.display = 'none';
        main.style.display = 'block';
        if (typeof window.startGreeting === 'function') window.startGreeting();
        requestAnimationFrame(() => {
          if (typeof window.initNarrativeWorld === 'function') window.initNarrativeWorld();
          if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        });
      }, 1000);
    }, 7200);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
