/*
 * ANIM OS — HOMEPAGE STAR BACKGROUND
 * ONLY the homepage background. Existing UI + script.js are untouched.
 * Story: BLACK VOID -> FIRST SPARK -> STAR -> LIGHT SPREAD
 */
(() => {
  'use strict';

  function boot() {
    if (window.__animHomepageStarWorld || !window.THREE) return;

    const canvas = document.getElementById('story-canvas');
    const main = document.getElementById('main');
    const hero = document.getElementById('profile');
    if (!canvas || !main || !hero) return;

    window.__animHomepageStarWorld = true;

    const mobile = window.matchMedia('(max-width:700px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Remove every old decorative layer that could create the square/gradient look. */
    const style = document.createElement('style');
    style.textContent = `
      html, body { background:#000 !important; }
      body:before, body:after { display:none !important; }
      .orb { display:none !important; }
      #main { background:transparent !important; }
      #story-canvas {
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100vh !important;
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        z-index:0 !important;
        pointer-events:none !important;
        background:#000 !important;
        mix-blend-mode:normal !important;
      }
      #main { position:relative !important; z-index:1 !important; }
      .navbar { z-index:50 !important; }
      .container { position:relative; z-index:2; }
    `;
    document.head.appendChild(style);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: false,
      antialias: !mobile,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    const world = new THREE.Group();
    world.position.z = -2;
    scene.add(world);

    const state = { scroll: 0, mx: 0, my: 0, sx: 0, sy: 0 };

    /* Distant space. These are invisible until the page starts moving. */
    const starCount = reduced ? 80 : (mobile ? 220 : 700);
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const j = i * 3;
      const radius = 9 + Math.random() * 55;
      const angle = Math.random() * Math.PI * 2;
      positions[j] = Math.cos(angle) * radius;
      positions[j + 1] = (Math.random() - 0.5) * 38;
      positions[j + 2] = -8 - Math.random() * 100;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const dustMaterial = new THREE.PointsMaterial({
      color: 0xdaf8ff,
      size: mobile ? 0.045 : 0.055,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    world.add(dust);

    /* One actual 3D star — this is the only hero object. */
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, mobile ? 10 : 18, mobile ? 10 : 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
    );
    star.position.set(0, 0, -4);
    world.add(star);

    /* Soft glow texture around the star. */
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext('2d');
    const gradient = glowCtx.createRadialGradient(128,128,0,128,128,128);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.04, 'rgba(190,245,255,.95)');
    gradient.addColorStop(0.13, 'rgba(70,200,255,.5)');
    gradient.addColorStop(0.35, 'rgba(50,150,255,.12)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0,0,256,256);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(glowCanvas),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    glow.position.copy(star.position);
    glow.scale.setScalar(0.1);
    world.add(glow);

    /* A very thin vertical beam — no rectangle, no glass plane. */
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 32),
      new THREE.MeshBasicMaterial({
        color: 0xbdf5ff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      })
    );
    beam.position.set(0, -16, -3.5);
    beam.scale.y = 0.001;
    world.add(beam);

    const light = new THREE.PointLight(0xbdefff, 0, 55, 2);
    light.position.copy(star.position);
    scene.add(light);

    /*
     * IMPORTANT: use the actual page scroll position rather than relying on
     * ScrollTrigger measuring a changing hero height. This makes the effect
     * reliable on mobile and desktop.
     * The first ~1.5 viewport heights are the homepage story.
     */
    function updateScroll() {
      const heroTop = hero.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(window.innerHeight * 1.35, hero.offsetHeight * 0.75);
      const raw = (window.scrollY - heroTop) / distance;
      state.scroll = Math.max(0, Math.min(1, raw));
    }

    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.6));
      renderer.setSize(window.innerWidth, window.innerHeight);
      updateScroll();
    }, { passive: true });

    window.addEventListener('pointermove', (e) => {
      state.mx = e.clientX / window.innerWidth - 0.5;
      state.my = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });

    updateScroll();

    const clock = new THREE.Clock();
    function render() {
      requestAnimationFrame(render);
      const t = clock.getElapsedTime();
      const p = state.scroll;

      /* Black at the start. Only a tiny amount of blue-black enters later. */
      const darkness = THREE.MathUtils.smoothstep(p, 0.25, 0.95);
      scene.background.setRGB(
        0.001 + darkness * 0.004,
        0.001 + darkness * 0.010,
        0.002 + darkness * 0.016
      );

      /* The star is born, then grows and breathes. */
      const birth = THREE.MathUtils.smoothstep(p, 0.03, 0.22);
      const starLife = THREE.MathUtils.smoothstep(p, 0.13, 0.42);
      star.material.opacity = birth;
      const size = 0.35 + starLife * 2.2 + Math.sin(t * 2.4) * 0.025;
      star.scale.setScalar(size);

      glow.material.opacity = starLife * 0.5;
      glow.scale.setScalar(0.15 + starLife * (mobile ? 2.8 : 4.2));

      light.intensity = starLife * (mobile ? 2.8 : 6.5);
      light.distance = 22 + darkness * 30;

      /* The light beam slowly fills in after the star has appeared. */
      const beamLife = THREE.MathUtils.smoothstep(p, 0.30, 0.78);
      beam.scale.y = Math.max(0.001, beamLife);
      beam.material.opacity = beamLife * 0.32;
      beam.position.y = -16 + beamLife * 16;

      /* Space wakes up only after the star is born. */
      dust.material.opacity = 0.003 + darkness * 0.075;
      dust.rotation.y = t * 0.0015;
      dust.rotation.x = Math.sin(t * 0.1) * 0.012;

      /* Subtle parallax gives the background genuine depth. */
      state.sx += (state.mx - state.sx) * 0.025;
      state.sy += (state.my - state.sy) * 0.025;
      camera.position.x += (state.sx * 0.8 - camera.position.x) * 0.025;
      camera.position.y += (-state.sy * 0.55 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, -4);

      glow.material.rotation = t * 0.025;
      renderer.render(scene, camera);
    }
    render();
  }

  window.initNarrativeWorld = boot;
})();
