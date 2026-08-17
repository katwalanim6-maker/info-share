/*
 * ANIM OS — HOMEPAGE 3D BACKGROUND ONLY
 * Visual layer only. script.js remains untouched.
 * Story: BLACK VOID -> STAR IGNITION -> LIGHT SPREAD
 */
(() => {
  'use strict';

  function boot() {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;
    if (window.__animHomepageWorld) return;

    const canvas = document.getElementById('story-canvas');
    const main = document.getElementById('main');
    const hero = document.getElementById('profile');
    if (!canvas || !main || !hero) return;

    window.__animHomepageWorld = true;
    gsap.registerPlugin(ScrollTrigger);

    const mobile = window.matchMedia('(max-width:700px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    /* Kill the old decorative background layers. The homepage background is now
       controlled by this one WebGL scene only. No UI is replaced. */
    const css = document.createElement('style');
    css.id = 'homepage-3d-background-style';
    css.textContent = `
      html, body { background:#000 !important; }
      body:before, body:after { display:none !important; }
      #main { background:transparent !important; }
      .orb { display:none !important; }
      #story-canvas {
        position:fixed !important;
        inset:0 !important;
        width:100vw !important;
        height:100vh !important;
        z-index:0 !important;
        display:block !important;
        opacity:1 !important;
        pointer-events:none !important;
        mix-blend-mode:normal !important;
        background:#000 !important;
      }
      #main { position:relative; z-index:1; }
      .navbar { z-index:50; }
      .container { position:relative; z-index:2; }
    `;
    document.head.appendChild(css);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    const camera = new THREE.PerspectiveCamera(
      48,
      innerWidth / innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 0, 30);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.7));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.8;

    const world = new THREE.Group();
    world.position.set(0, 0, -2);
    scene.add(world);

    const clock = new THREE.Clock();
    const state = {
      progress: 0,
      mouseX: 0,
      mouseY: 0,
      smoothMouseX: 0,
      smoothMouseY: 0
    };

    /* -------------------- DUST / DISTANT STARS -------------------- */
    const count = reduced ? 100 : mobile ? 280 : 850;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const j = i * 3;
      const radius = 14 + Math.random() * 65;
      const angle = Math.random() * Math.PI * 2;
      positions[j] = Math.cos(angle) * radius;
      positions[j + 1] = (Math.random() - 0.5) * 48;
      positions[j + 2] = -10 - Math.random() * 130;
    }

    const starFieldGeometry = new THREE.BufferGeometry();
    starFieldGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    const starFieldMaterial = new THREE.PointsMaterial({
      color: 0xcff8ff,
      size: mobile ? 0.045 : 0.055,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const starField = new THREE.Points(
      starFieldGeometry,
      starFieldMaterial
    );
    world.add(starField);

    /* -------------------- HERO STAR -------------------- */
    const star = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, mobile ? 10 : 16, mobile ? 10 : 16),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false
      })
    );
    star.position.set(0, 1.5, -3);
    world.add(star);

    function glowTexture() {
      const c = document.createElement('canvas');
      c.width = c.height = 256;
      const ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.035, 'rgba(225,250,255,.98)');
      g.addColorStop(0.12, 'rgba(100,220,255,.62)');
      g.addColorStop(0.32, 'rgba(40,160,255,.18)');
      g.addColorStop(0.7, 'rgba(20,100,180,.035)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
      return new THREE.CanvasTexture(c);
    }

    const starGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    starGlow.position.copy(star.position);
    starGlow.scale.set(1, 1, 1);
    world.add(starGlow);

    /* A soft 3D halo around the star. This is deliberately subtle, not a neon blob. */
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 20, 20),
      new THREE.MeshBasicMaterial({
        color: 0x7edfff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );
    halo.position.copy(star.position);
    world.add(halo);

    /* -------------------- LIGHT THAT ACTUALLY ILLUMINATES THE WORLD -------------------- */
    const starLight = new THREE.PointLight(0xbdefff, 0, 75, 2);
    starLight.position.copy(star.position);
    scene.add(starLight);

    /* Very thin atmospheric beam. It grows only after the star appears. */
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xbdefff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 34),
      beamMaterial
    );
    beam.position.set(0, -15, -2.5);
    beam.scale.y = 0.001;
    world.add(beam);

    const beamWideMaterial = new THREE.MeshBasicMaterial({
      color: 0x4fcfff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    const beamWide = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 34),
      beamWideMaterial
    );
    beamWide.position.copy(beam.position);
    beamWide.scale.y = 0.001;
    world.add(beamWide);

    /* -------------------- SCROLL = STORY --------------------
       Only the homepage hero controls the background.
       0% = absolute black.
       25% = first spark.
       50% = star fully alive.
       100% = atmosphere gently illuminated.
    */
    ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: 'bottom top',
      scrub: 1.4,
      invalidateOnRefresh: true,
      onUpdate(self) {
        state.progress = self.progress;
      }
    });

    addEventListener('pointermove', (event) => {
      state.mouseX = event.clientX / innerWidth - 0.5;
      state.mouseY = event.clientY / innerHeight - 0.5;
    }, { passive: true });

    addEventListener('resize', () => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.7));
      renderer.setSize(innerWidth, innerHeight);
      ScrollTrigger.refresh();
    }, { passive: true });

    function render() {
      requestAnimationFrame(render);

      const time = clock.getElapsedTime();
      const p = state.progress;

      /* Smooth stages. Nothing jumps on/off. */
      const spark = THREE.MathUtils.smoothstep(p, 0.08, 0.30);
      const fullStar = THREE.MathUtils.smoothstep(p, 0.20, 0.48);
      const atmosphere = THREE.MathUtils.smoothstep(p, 0.28, 0.92);
      const beamProgress = THREE.MathUtils.smoothstep(p, 0.28, 0.72);

      /* The entire background begins as black and slowly becomes deep blue-black. */
      const background = new THREE.Color(0x000000).lerp(
        new THREE.Color(0x07131d),
        atmosphere * 0.82
      );
      scene.background.copy(background);

      /* Star: tiny spark -> physical-looking glowing point -> breathing star. */
      star.material.opacity = spark;
      const starScale = 0.45 + fullStar * 2.15 + Math.sin(time * 2.2) * 0.025 * fullStar;
      star.scale.setScalar(starScale);

      starGlow.material.opacity = spark * 0.48;
      const glowScale = 0.4 + fullStar * (mobile ? 3.1 : 4.8);
      starGlow.scale.setScalar(glowScale);

      halo.material.opacity = fullStar * 0.055;
      halo.scale.setScalar(0.7 + fullStar * 1.8);

      /* The light is what makes the surrounding 3D space feel illuminated. */
      starLight.intensity = fullStar * (mobile ? 3.2 : 7.5);
      starLight.distance = 30 + atmosphere * 48;

      /* Stars emerge gradually instead of covering the homepage immediately. */
      starFieldMaterial.opacity = 0.006 + atmosphere * 0.065;
      starField.rotation.y = time * 0.0018;
      starField.rotation.x = Math.sin(time * 0.12) * 0.015;

      /* A restrained beam connects the star to the page as the user continues upward. */
      beam.scale.y = Math.max(0.001, beamProgress);
      beamWide.scale.y = Math.max(0.001, beamProgress);
      beamMaterial.opacity = beamProgress * 0.36;
      beamWideMaterial.opacity = beamProgress * 0.055;
      beam.position.y = -15 + beamProgress * 16.5;
      beamWide.position.y = beam.position.y;

      /* Gentle 3D parallax — background moves, interface does not. */
      state.smoothMouseX = THREE.MathUtils.lerp(state.smoothMouseX, state.mouseX, 0.035);
      state.smoothMouseY = THREE.MathUtils.lerp(state.smoothMouseY, state.mouseY, 0.035);
      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        state.smoothMouseX * 1.0,
        0.025
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        -state.smoothMouseY * 0.65,
        0.025
      );
      camera.lookAt(0, 0, -3);

      /* Keep the star alive even when scrolling stops. */
      starGlow.rotation.z = time * 0.035;
      halo.rotation.y = time * 0.12;

      renderer.render(scene, camera);
    }

    ScrollTrigger.refresh();
    render();
  }

  /* script.js starts this after #main becomes visible. */
  window.initNarrativeWorld = boot;
})();
