/*
 * ANIM OS — CINEMATIC NARRATIVE WORLD
 * Visual layer only. Existing HTML, links and application logic remain untouched.
 * Story: VOID -> AWAKENING -> IDENTITY -> CONNECTION -> INTELLIGENCE -> EXPANSION
 */
(() => {
  'use strict';

  let started = false;

  window.initNarrativeWorld = function initNarrativeWorld() {
    if (started) {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      return;
    }
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;

    const canvas = document.getElementById('story-canvas');
    const main = document.getElementById('main');
    if (!canvas || !main || getComputedStyle(main).display === 'none') return;

    started = true;
    gsap.registerPlugin(ScrollTrigger);

    const mobile = window.matchMedia('(max-width:700px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, mobile ? 0.012 : 0.009);

    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 500);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !mobile,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.2 : 1.6));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    canvas.classList.add('story-ready');

    const world = new THREE.Group();
    scene.add(world);

    scene.add(new THREE.AmbientLight(0x8ecfff, 0.11));
    const keyLight = new THREE.PointLight(0x39dfff, mobile ? 7 : 12, 150, 2);
    keyLight.position.set(0, 4, 14);
    scene.add(keyLight);
    const violetLight = new THREE.PointLight(0x8b5cf6, mobile ? 4 : 7, 140, 2);
    violetLight.position.set(-18, -10, -20);
    scene.add(violetLight);

    const state = {
      progress: 0,
      velocity: 0,
      targetVelocity: 0,
      pointerX: 0,
      pointerY: 0,
      targetPointerX: 0,
      targetPointerY: 0
    };
    const clock = new THREE.Clock();

    /* ---------- Particles ---------- */
    const particleCount = reduced ? 700 : (mobile ? 1200 : 3200);
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);
    const cols = mobile ? 36 : 58;

    for (let i = 0; i < particleCount; i++) {
      const j = i * 3;
      const radius = 10 + Math.random() * 58;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.sin(phi) * Math.sin(theta) * radius;
      const z = Math.cos(phi) * radius - 28;
      seeds[j] = positions[j] = x;
      seeds[j + 1] = positions[j + 1] = y;
      seeds[j + 2] = positions[j + 2] = z;

      const row = Math.floor(i / cols);
      const col = i % cols;
      targets[j] = (col / Math.max(cols - 1, 1) - 0.5) * 44;
      targets[j + 1] = (row / Math.max(Math.ceil(particleCount / cols) - 1, 1) - 0.5) * 28;
      targets[j + 2] = Math.sin(col * 0.17) * 2.2 + Math.cos(row * 0.13) * 1.8 - 22;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const baseParticleColor = new THREE.Color(0x9deeff);
    const brightParticleColor = new THREE.Color(0xe7fdff);
    const particleMaterial = new THREE.PointsMaterial({
      color: baseParticleColor,
      size: mobile ? 0.065 : 0.075,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    world.add(particles);

    /* ---------- Core ---------- */
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, mobile ? 10 : 16, mobile ? 10 : 16),
      new THREE.MeshBasicMaterial({ color: 0xe9fdff, transparent: true, opacity: 0 })
    );
    world.add(core);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x42e8ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    halo.scale.set(4.5, 4.5, 1);
    world.add(halo);

    /* ---------- Quiet starfield ---------- */
    const starCount = reduced ? 220 : (mobile ? 420 : 850);
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const j = i * 3;
      starPositions[j] = THREE.MathUtils.randFloatSpread(180);
      starPositions[j + 1] = THREE.MathUtils.randFloatSpread(105);
      starPositions[j + 2] = THREE.MathUtils.randFloat(-170, 20);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xb9eaff,
      size: mobile ? 0.03 : 0.04,
      transparent: true,
      opacity: 0.045,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    world.add(stars);

    /* ---------- Identity architecture: outlines only, never filled rectangles ---------- */
    const glassGroup = new THREE.Group();
    world.add(glassGroup);
    const glassFrames = [];
    const glassCount = mobile ? 2 : 3;

    for (let i = 0; i < glassCount; i++) {
      const width = 8 + i * 3.5;
      const height = 12 + i * 3.5;
      const edges = new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height));
      const material = new THREE.LineBasicMaterial({
        color: 0x8feaff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });
      const frame = new THREE.LineSegments(edges, material);
      frame.position.set((i - (glassCount - 1) / 2) * 7, i % 2 ? 1.5 : -1.5, -17 - i * 2);
      frame.rotation.set((i - 1) * 0.025, (i - 1) * 0.09, (i - 1) * 0.02);
      glassGroup.add(frame);
      glassFrames.push(frame);
    }

    /* ---------- Connection network ---------- */
    const networkGroup = new THREE.Group();
    world.add(networkGroup);
    const nodeCount = mobile ? 6 : 8;
    const nodePositions = [];
    const nodeMaterials = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = i / nodeCount * Math.PI * 2;
      const radius = 7 + (i % 3) * 2.2;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.72,
        -4 - (i % 3) * 2
      );
      nodePositions.push(position);
      const material = new THREE.MeshBasicMaterial({ color: 0x9deeff, transparent: true, opacity: 0 });
      nodeMaterials.push(material);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), material);
      node.position.copy(position);
      networkGroup.add(node);
    }

    const linePositions = [];
    nodePositions.forEach(p => linePositions.push(0, 0, 0, p.x, p.y, p.z));
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x64e8ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    networkGroup.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    /* ---------- One scroll controller. No competing ScrollTriggers. ---------- */
    ScrollTrigger.create({
      trigger: main,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.35,
      invalidateOnRefresh: true,
      onUpdate(self) {
        state.progress = self.progress;
        state.targetVelocity = THREE.MathUtils.clamp(self.getVelocity() / 2600, -1.2, 1.2);
      }
    });

    /* ---------- Existing UI: visual depth only ---------- */
    const hero = document.getElementById('profile');
    const contact = document.getElementById('contact');
    const ai = document.getElementById('ai-section');
    [hero, contact, ai].filter(Boolean).forEach(el => {
      el.classList.add('narrative-ui');
      gsap.set(el, { transformPerspective: 1400, transformOrigin: '50% 50%' });
    });

    if (!reduced) {
      if (hero) gsap.fromTo(hero,
        { y: 28, rotateX: 3, scale: 0.985 },
        { y: 0, rotateX: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top 88%', end: 'top 48%', scrub: 1 } }
      );
      if (contact) gsap.fromTo(contact,
        { y: 38, rotateX: 3, rotateY: -1.5, scale: 0.99 },
        { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: contact, start: 'top 90%', end: 'top 50%', scrub: 1.1 } }
      );
      if (ai) gsap.fromTo(ai,
        { y: 45, rotateX: 3, rotateY: 1.5, scale: 0.99 },
        { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'none', scrollTrigger: { trigger: ai, start: 'top 92%', end: 'top 52%', scrub: 1.15 } }
      );
    }

    document.querySelectorAll('.contact-card').forEach((card, index) => {
      card.addEventListener('pointerenter', () => {
        gsap.to(card, { z: 12, y: -3, rotateY: index % 2 ? -1.5 : 1.5, duration: 0.35, overwrite: true });
        gsap.to(keyLight, { intensity: mobile ? 9 : 16, duration: 0.3, overwrite: true });
      });
      card.addEventListener('pointerleave', () => {
        gsap.to(card, { z: 0, y: 0, rotateY: 0, duration: 0.45, overwrite: true });
        gsap.to(keyLight, { intensity: mobile ? 7 : 12, duration: 0.45, overwrite: true });
      });
    });

    document.querySelectorAll('.liquid-btn').forEach(button => {
      button.addEventListener('pointerdown', () => {
        gsap.to(keyLight, { intensity: mobile ? 11 : 18, duration: 0.1, yoyo: true, repeat: 1 });
      }, { passive: true });
    });

    window.addEventListener('pointermove', event => {
      state.targetPointerX = event.clientX / innerWidth - 0.5;
      state.targetPointerY = event.clientY / innerHeight - 0.5;
    }, { passive: true });

    function resize() {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.2 : 1.6));
      renderer.setSize(innerWidth, innerHeight);
      ScrollTrigger.refresh();
    }
    window.addEventListener('resize', resize, { passive: true });

    function updateWorld(time) {
      const p = state.progress;

      // 0–15% VOID
      const voidProgress = THREE.MathUtils.clamp(p / 0.15, 0, 1);
      core.material.opacity = voidProgress;
      core.scale.setScalar(0.7 + voidProgress * 0.8);
      halo.material.opacity = voidProgress * 0.18;
      halo.scale.setScalar(4.5 + voidProgress * 2.5);

      // 15–35% AWAKENING
      const awaken = THREE.MathUtils.smoothstep(p, 0.15, 0.35);
      particleMaterial.opacity = awaken * 0.48;
      starMaterial.opacity = 0.045 + awaken * 0.07;
      const array = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const j = i * 3;
        const n = Math.sin(time * 0.35 + i * 0.013) * 0.22 + Math.cos(time * 0.22 + i * 0.009) * 0.13;
        array[j] = THREE.MathUtils.lerp(seeds[j], targets[j], awaken) + n;
        array[j + 1] = THREE.MathUtils.lerp(seeds[j + 1], targets[j + 1], awaken) + Math.cos(time * 0.3 + i) * 0.11;
        array[j + 2] = THREE.MathUtils.lerp(seeds[j + 2], targets[j + 2], awaken) + Math.sin(time * 0.26 + i) * 0.08;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 35–55% IDENTITY: elegant outlines dock around the real UI.
      const identity = THREE.MathUtils.smoothstep(p, 0.35, 0.55);
      glassGroup.position.z = THREE.MathUtils.lerp(-5, 7, identity);
      glassFrames.forEach((frame, i) => {
        frame.material.opacity = identity * (0.055 + i * 0.012);
        frame.rotation.z += (i - 1) * 0.00003;
      });

      // 55–75% CONNECTION
      const connection = THREE.MathUtils.smoothstep(p, 0.55, 0.75);
      networkGroup.position.z = THREE.MathUtils.lerp(-4, 4, connection);
      lineMaterial.opacity = connection * 0.22;
      nodeMaterials.forEach((material, i) => {
        material.opacity = THREE.MathUtils.clamp((connection - i / (nodeCount * 1.35)) * 1.8, 0, 1) * 0.55;
      });

      // 75–90% INTELLIGENCE
      const intelligence = THREE.MathUtils.smoothstep(p, 0.75, 0.9);
      networkGroup.rotation.z = intelligence * Math.PI * 1.4;
      particleMaterial.color.copy(baseParticleColor).lerp(brightParticleColor, intelligence);
      particleMaterial.size = THREE.MathUtils.lerp(mobile ? 0.065 : 0.075, mobile ? 0.09 : 0.11, intelligence);
      core.material.color.copy(new THREE.Color(0xe9fdff)).lerp(new THREE.Color(0xffffff), intelligence);
      keyLight.intensity = (mobile ? 7 : 12) + intelligence * (mobile ? 3 : 6);

      // 90–100% EXPANSION
      const expansion = THREE.MathUtils.smoothstep(p, 0.9, 1);
      camera.position.z = THREE.MathUtils.lerp(42, 54, expansion);
      starMaterial.opacity = THREE.MathUtils.lerp(0.115, 0.22, expansion);

      state.velocity = THREE.MathUtils.lerp(state.velocity, state.targetVelocity, 0.08);
      world.rotation.z += state.velocity * 0.0006;
      world.position.z = state.velocity * 0.45;
    }

    function render() {
      const time = clock.getElapsedTime();
      state.pointerX = THREE.MathUtils.lerp(state.pointerX, state.targetPointerX, 0.045);
      state.pointerY = THREE.MathUtils.lerp(state.pointerY, state.targetPointerY, 0.045);
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointerX * 1.4, 0.035);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, -state.pointerY * 0.9, 0.035);
      stars.rotation.y += 0.00008;
      particles.rotation.y += 0.00012 + Math.abs(state.velocity) * 0.0004;
      core.rotation.y += 0.0015;
      updateWorld(time);
      camera.lookAt(0, 0, -8);
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    if (reduced) {
      particleMaterial.opacity = 0.1;
      starMaterial.opacity = 0.06;
    }

    ScrollTrigger.refresh();
    render();
  };
})();
