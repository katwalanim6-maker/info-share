/* ANIM OS — handwriting -> deconstruction -> A -> logo */
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
      // 0.0–3.4s: write Anim OS in white.
      script?.classList.add('play');

      // 3.65s: the finished writing begins breaking down from behind.
      // The isolated A then emerges from the left side of the word and travels to center.
      window.setTimeout(() => script?.classList.add('deconstruct'), 3650);
      window.setTimeout(() => a?.classList.add('form'), 3700);

      // 4.85s: the handwritten A is now centered; dissolve it away.
      // 5.25s: the real uploaded logo grows out of the disappearing A.
      window.setTimeout(() => a?.classList.remove('form'), 4850);
      window.setTimeout(() => a?.classList.add('fade'), 4850);
      window.setTimeout(() => logo?.classList.add('reveal'), 5050);
    });

    // Real logo is held alone on pure black for ~2 seconds, then the site fades in.
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
    }, 7050);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
