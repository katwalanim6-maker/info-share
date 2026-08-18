/* ANIM OS — handwritten write → deconstruct → A morph → logo */
(() => {
  'use strict';
  const start = () => {
    const intro = document.getElementById('intro');
    const main = document.getElementById('main');
    if (!intro || !main) return;
    const script = intro.querySelector('.anim-script');
    const a = intro.querySelector('.transition-a');
    const logo = intro.querySelector('.anim-logo');

    requestAnimationFrame(() => script?.classList.add('play'));

    // 3.55s: the whole handwritten word is pulled inward and deconstructed.
    window.setTimeout(() => intro.classList.add('deconstructing'), 3550);

    // 4.25s: a clean handwritten A emerges from the collapsing word and lands center.
    window.setTimeout(() => a?.classList.add('extract'), 4250);

    // 4.85s: the temporary handwritten A dissolves while the real A logo grows through it.
    window.setTimeout(() => {
      a?.classList.add('dissolve');
      logo?.classList.add('reveal');
    }, 4850);

    // The finished logo is then alone on pure black for 2 seconds.
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
    }, 7900);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
