/*
 * ANIM OS — CINEMATIC NARRATIVE WORLD
 * Visual layer only. Existing HTML and application logic remain untouched.
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
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) {
      console.warn('Narrative world dependencies are not ready.');
      return;
    }

    const canvas = document.getElementById('story-canvas');
    const main = document.getElementById('main');
    if (!canvas || !main || getComputedStyle(main).display === 'none') return;

    started = true;
    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.matchMedia('(max-width: 700px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ---------- Renderer ----------
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, isMobile ? 0.014 : 0.011);

    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.7));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    canvas.classList.add('story-ready');

    const world = new THREE.Group();
    scene.add(world);

    // ---------- Lighting ----------
    scene.add(new THREE.AmbientLight(0x8ecfff, 0.16));

    const keyLight = new THREE.PointLight(0x39dfff, isMobile ? 12 : 20, 170, 2);
    keyLight.position.set(0, 4, 15);
    scene.add(keyLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, isMobile ? 7 : 12, 150, 2);
    violetLight.position.set(-18, -10, -15);
    scene.add(violetLight);

    // ---------- State ----------
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

    // ---------- Particles: the world begins as one spark, then becomes a universe ----------
    const particleCount = reducedMotion ? 900 : (isMobile ? 1800 : 4200);
    const positions = new Float32Array(particleCount * 3);
    const seeds = new Float32Array(particleCount * 3);
    const targets = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const j = i * 3;
      const radius = 8 + Math.random() * 72;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));

      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.sin(phi) * Math.sin(theta) * radius;
      const z = Math.cos(phi) * radius - 22;

      seeds[j] = positions[j] = x;
      seeds[j + 1] = positions[j + 1] = y;
      seeds[j + 2] = positions[j + 2] = z;

      const cols = isMobile ? 45 : 65;
      const row = Math.floor(i / cols);
      const col = i % cols;
      targets[j] = (col / Math.max(cols - 1, 1) - 0.5) * 46;
      targets[j + 1] = (row / Math.max(Math.ceil(particleCount / cols) - 1, 1) - 0.5) * 29;
      targets[j + 2] = Math.sin(col * 0.18) * 2.7 + Math.cos(row * 0.13) * 2.1 - 18;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const baseParticleColor = new THREE.Color(0x9deeff);
    const intelligenceParticleColor = new THREE.Color(0xcfffff);
    const particleMaterial = new THREE.PointsMaterial({
      color: baseParticleColor,
      size: isMobile ? 0.075 : 0.09,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    world.add(particles);

    // ---------- Central core and halo ----------
    const coreBaseColor = new THREE.Color(0xe9fdff);
    const coreIntelligenceColor = new THREE.Color(0xffffff);
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, isMobile ? 12 : 20, isMobile ? 12 : 20),
      new THREE.MeshBasicMaterial({ color: coreBaseColor, transparent: true, opacity: 0 })
    );
    world.add(core);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x42e8ff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    halo.scale.set(5, 5, 1);
    world.add(halo);

    // ---------- Ambient starfield ----------
    const starCount = reducedMotion ? 300 : (isMobile ? 550 : 1100);
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const j = i * 3;
      starPositions[j] = THREE.MathUtils.randFloatSpread(190);
      starPositions[j + 1] = THREE.MathUtils.randFloatSpread(115);
      starPositions[j + 2] = THREE.MathUtils.randFloat(-170, 30);
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xb9eaff,
      size: isMobile ? 0.035 : 0.045,
      transparent: true,
      opacity: 0.07,
      depthWrite: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    world.add(stars);

    // ---------- Glass architecture ----------
    const glassGroup = new THREE.Group();
    world.add(glassGroup);
    const glassMeshes = [];
    const glassCount = isMobile ? 3 : 5;

    for (let i = 0; i < glassCount; i++) {
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x8feaff,
        transparent: true,
        opacity: 0,
        roughness: 0.15,
        metalness: 0.02,
        transmission: isMobile ? 0.45 : 0.68,
        thickness: 0.45,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(8 + i * 2.2, 12 + i * 2.1),
        material
      );
      mesh.position.set((i - (glassCount - 1) / 2) * 10, i % 2 ? 2 : -2, -14 - i * 2);
      mesh.rotation.set((i - 2) * 0.035, (i - 2) * 0.11, (i - 2) * 0.025);
      glassGroup.add(mesh);
      glassMeshes.push(mesh);
    }

    // ---------- Connection network ----------
    const networkGroup = new THREE.Group();
    const nodeGroup = new THREE.Group();
    networkGroup.add(nodeGroup);
    world.add(networkGroup);

    const nodeCount = isMobile ? 6 : 9;
    const nodePositions = [];
    const nodeMaterials = [];

    for (let i = 0; i < nodeCount; i++) {
      const angle = (i / nodeCount) * Math.PI * 2;
      const radius = 8 + (i % 3) * 2.5;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius * 0.7,
        -2 - (i % 3) * 2
      );
      nodePositions.push(position);

      const material = new THREE.MeshBasicMaterial({ color: 0x9deeff, transparent: true, opacity: 0 });
      nodeMaterials.push(material);
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), material);
      node.position.copy(position);
      nodeGroup.add(node);
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
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    networkGroup.add(lines);

    // ---------- ScrollTrigger ----------
    const scrollTrigger = ScrollTrigger.create({
      trigger: main,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.25,
      invalidateOnRefresh: true,
      onUpdate(self) {
        state.progress = self.progress;
        state.targetVelocity = THREE.MathUtils.clamp(self.getVelocity() / 2500, -1.5, 1.5);
      }
    });

    // Keep a GSAP timeline tied to the same scroll progress. It controls the narrative
    // state without replacing or moving any existing HTML functionality.
    gsap.to(state, {
      progress: 1,
      duration: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: main,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.25,
        invalidateOnRefresh: true
      }
    });

    // ---------- Existing UI cinematic depth ----------
    const hero = document.getElementById('profile');
    const contact = document.getElementById('contact');
    const ai = document.getElementById('ai-section');
    const uiTargets = [hero, contact, ai].filter(Boolean);

    uiTargets.forEach(el => {
      el.classList.add('narrative-ui');
      gsap.set(el, { transformPerspective: 1400, transformOrigin: '50% 50%' });
    });

    if (!reducedMotion) {
      if (hero) gsap.fromTo(hero,
        { y: 55, rotateX: 6, scale: 0.97 },
        { y: 0, rotateX: 0, scale: 1, ease: 'power3.out', scrollTrigger: { trigger: hero, start: 'top 88%', end: 'top 45%', scrub: 1 } }
      );
      if (contact) gsap.fromTo(contact,
        { y: 90, rotateX: 8, rotateY: -3, scale: 0.96 },
        { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'power3.out', scrollTrigger: { trigger: contact, start: 'top 92%', end: 'top 43%', scrub: 1.2 } }
      );
      if (ai) gsap.fromTo(ai,
        { y: 110, rotateX: 9, rotateY: 3, scale: 0.95 },
        { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'power3.out', scrollTrigger: { trigger: ai, start: 'top 94%', end: 'top 40%', scrub: 1.25 } }
      );
    }

    // Every existing contact card remains a normal <a>. We only add visual feedback.
    document.querySelectorAll('.contact-card').forEach((card, index) => {
      card.addEventListener('pointerenter', () => {
        gsap.to(card, { z: 22, y: -5, rotateY: index % 2 ? -3 : 3, duration: 0.4, overwrite: true });
        gsap.to(keyLight, { intensity: isMobile ? 15 : 27, duration: 0.35, overwrite: true });
      });
      card.addEventListener('pointerleave', () => {
        gsap.to(card, { z: 0, y: 0, rotateY: 0, duration: 0.55, overwrite: true });
        gsap.to(keyLight, { intensity: isMobile ? 12 : 20, duration: 0.55, overwrite: true });
      });
      card.addEventListener('pointerdown', () => {
        gsap.fromTo(card, { scale: 0.985 }, { scale: 1, duration: 0.35, ease: 'power2.out', overwrite: true });
      }, { passive: true });
    });

    // Existing buttons also influence the environment, without changing their actions.
    document.querySelectorAll('.liquid-btn').forEach(button => {
      button.addEventListener('pointerdown', () => {
        gsap.to(keyLight, { intensity: isMobile ? 15 : 30, duration: 0.12, yoyo: true, repeat: 1 });
      }, { passive: true });
    });

    // ---------- Pointer parallax ----------
    window.addEventListener('pointermove', event => {
      state.targetPointerX = event.clientX / innerWidth - 0.5;
      state.targetPointerY = event.clientY / innerHeight - 0.5;
    }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });

    function resize() {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.25 : 1.7));
      renderer.setSize(innerWidth, innerHeight);
      ScrollTrigger.refresh();
    }

    // ---------- Story mechanics ----------
    function updateWorld(time) {
      const p = state.progress;

      // 0–15% VOID: one spark slowly wakes up.
      const voidProgress = THREE.MathUtils.clamp(p / 0.15, 0, 1);
      core.scale.setScalar(0.8 + voidProgress * 0.8);
      core.material.opacity = voidProgress;
      halo.material.opacity = voidProgress * 0.3;
      halo.scale.setScalar(5 + voidProgress * 3);

      // 15–35% AWAKENING: random particles form an intentional pattern.
      const awaken = THREE.MathUtils.smoothstep(p, 0.15, 0.35);
      particleMaterial.opacity = awaken * 0.68;
      starMaterial.opacity = 0.07 + awaken * 0.14;

      const positionArray = particleGeometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const j = i * 3;
        const noise = Math.sin(time * 0.35 + i * 0.013) * 0.28 + Math.cos(time * 0.23 + i * 0.009) * 0.18;
        positionArray[j] = THREE.MathUtils.lerp(seeds[j], targets[j], awaken) + noise * (0.3 + awaken);
        positionArray[j + 1] = THREE.MathUtils.lerp(seeds[j + 1], targets[j + 1], awaken) + Math.cos(time * 0.31 + i) * 0.16;
        positionArray[j + 2] = THREE.MathUtils.lerp(seeds[j + 2], targets[j + 2], awaken) + Math.sin(time * 0.28 + i) * 0.12;
      }
      particleGeometry.attributes.position.needsUpdate = true;

      // 35–55% IDENTITY: translucent 3D architecture docks around the real profile.
      const identity = THREE.MathUtils.smoothstep(p, 0.35, 0.55);
      glassGroup.position.z = THREE.MathUtils.lerp(-4, 9, identity);
      glassMeshes.forEach((mesh, i) => {
        mesh.material.opacity = identity * (0.07 + i * 0.012);
        mesh.rotation.y += (i - 2) * 0.00008;
      });

      // 55–75% CONNECTION: the network grows outward from the identity.
      const connection = THREE.MathUtils.smoothstep(p, 0.55, 0.75);
      networkGroup.position.z = THREE.MathUtils.lerp(-3, 5, connection);
      lineMaterial.opacity = connection * 0.32;
      nodeMaterials.forEach((material, i) => {
        const stagger = THREE.MathUtils.clamp((connection - i / (nodeCount * 1.4)) * 1.8, 0, 1);
        material.opacity = stagger * 0.8;
      });

      // 75–90% INTELLIGENCE: the network converges and the core becomes brighter.
      const intelligence = THREE.MathUtils.smoothstep(p, 0.75, 0.9);
      networkGroup.rotation.z = intelligence * Math.PI * 1.7;
      particleMaterial.size = THREE.MathUtils.lerp(isMobile ? 0.075 : 0.09, isMobile ? 0.105 : 0.14, intelligence);
      particleMaterial.color.copy(baseParticleColor).lerp(intelligenceParticleColor, intelligence);
      core.material.color.copy(coreBaseColor).lerp(coreIntelligenceColor, intelligence);
      keyLight.intensity = (isMobile ? 12 : 20) + intelligence * (isMobile ? 4 : 9);

      // 90–100% EXPANSION: the camera reveals that the world is larger than the UI.
      const expansion = THREE.MathUtils.smoothstep(p, 0.9, 1);
      camera.position.z = THREE.MathUtils.lerp(42, 57, expansion);
      starMaterial.opacity = THREE.MathUtils.lerp(0.24, 0.44, expansion);

      // Scroll velocity becomes physical momentum rather than a snap.
      state.velocity = THREE.MathUtils.lerp(state.velocity, state.targetVelocity, 0.08);
      world.rotation.z += state.velocity * 0.0008;
      world.position.z = state.velocity * 0.6;
    }

    function render() {
      const time = clock.getElapsedTime();

      state.pointerX = THREE.MathUtils.lerp(state.pointerX, state.targetPointerX, 0.045);
      state.pointerY = THREE.MathUtils.lerp(state.pointerY, state.targetPointerY, 0.045);

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.pointerX * 1.7, 0.035);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, -state.pointerY * 1.2, 0.035);

      stars.rotation.y += 0.00012;
      particles.rotation.y += 0.00018 + Math.abs(state.velocity) * 0.0005;
      core.rotation.y += 0.002;

      updateWorld(time);
      camera.lookAt(0, 0, -8);
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    }

    if (reducedMotion) {
      particleMaterial.opacity = 0.16;
      starMaterial.opacity = 0.1;
    }

    // The engine starts only after #main is visible, so ScrollTrigger gets real dimensions.
    scrollTrigger.refresh();
    ScrollTrigger.refresh();
    render();
  };
})();
