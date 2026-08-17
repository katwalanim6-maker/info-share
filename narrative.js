/*
 * ANIM OS — CINEMATIC NARRATIVE WORLD
 * Visual layer only. Existing application logic remains in script.js.
 * Story: Void -> Awakening -> Identity -> Connection -> Intelligence -> Expansion
 */
(function () {
  'use strict';

  function boot() {
    if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    const canvas = document.getElementById('story-canvas');
    const main = document.getElementById('main');
    if (!canvas || !main) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x02040a, 0.012);

    const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1200);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.8));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const world = new THREE.Group();
    scene.add(world);

    const ambient = new THREE.AmbientLight(0x8ecfff, 0.22);
    const key = new THREE.PointLight(0x39dfff, 18, 180, 2);
    key.position.set(0, 4, 16);
    const violet = new THREE.PointLight(0x8b5cf6, 12, 160, 2);
    violet.position.set(-18, -8, -12);
    scene.add(ambient, key, violet);

    const clock = new THREE.Clock();
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const state = { progress: 0, velocity: 0, lastScroll: scrollY };

    // ---------- Particle universe ----------
    const mobile = innerWidth < 700;
    const count = mobile ? 2200 : 5200;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count * 3);
    const grid = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const r = 7 + Math.random() * 70;
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(THREE.MathUtils.randFloatSpread(2));
      seeds[i3] = positions[i3] = Math.sin(b) * Math.cos(a) * r;
      seeds[i3 + 1] = positions[i3 + 1] = Math.sin(b) * Math.sin(a) * r;
      seeds[i3 + 2] = positions[i3 + 2] = Math.cos(b) * r - 20;

      const cols = mobile ? 55 : 75;
      const row = Math.floor(i / cols);
      const col = i % cols;
      grid[i3] = (col / Math.max(cols - 1, 1) - 0.5) * 45;
      grid[i3 + 1] = (row / Math.max(Math.ceil(count / cols) - 1, 1) - 0.5) * 28;
      grid[i3 + 2] = Math.sin(col * 0.17) * 3 + Math.cos(row * 0.11) * 2 - 18;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x8feaff,
      size: mobile ? 0.075 : 0.095,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    world.add(particles);

    // A small central point: the first spark.
    const coreGeo = new THREE.SphereGeometry(0.16, 20, 20);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xdffcff, transparent: true, opacity: 0 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    world.add(core);

    const halo = new THREE.Sprite(new THREE.SpriteMaterial({
      color: 0x42e8ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    halo.scale.set(5, 5, 1);
    world.add(halo);

    // ---------- Deep-space dust / starfield ----------
    const starCount = mobile ? 700 : 1500;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = THREE.MathUtils.randFloatSpread(180);
      starPos[i + 1] = THREE.MathUtils.randFloatSpread(110);
      starPos[i + 2] = THREE.MathUtils.randFloat(-150, 35);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0x9fdcff,
      size: mobile ? 0.035 : 0.045,
      transparent: true,
      opacity: 0.08,
      depthWrite: false
    }));
    world.add(stars);

    // ---------- Glass architecture ----------
    const glassGroup = new THREE.Group();
    world.add(glassGroup);
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x8feaff,
      transparent: true,
      opacity: 0,
      roughness: 0.12,
      metalness: 0.02,
      transmission: 0.72,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    const glassMeshes = [];
    for (let i = 0; i < 5; i++) {
      const geo = new THREE.PlaneGeometry(8 + i * 2, 12 + i * 2);
      const mesh = new THREE.Mesh(geo, glassMaterial.clone());
      mesh.position.set((i - 2) * 10, (i % 2 ? 2 : -2), -12 - i * 2);
      mesh.rotation.set((i - 2) * 0.035, (i - 2) * 0.11, (i - 2) * 0.025);
      glassGroup.add(mesh);
      glassMeshes.push(mesh);
    }

    // ---------- Connection network ----------
    const networkGroup = new THREE.Group();
    world.add(networkGroup);
    const nodeCount = 8;
    const nodePositions = [];
    const nodeGroup = new THREE.Group();
    networkGroup.add(nodeGroup);

    for (let i = 0; i < nodeCount; i++) {
      const a = (i / nodeCount) * Math.PI * 2;
      const radius = 9 + (i % 2) * 3;
      const p = new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius * 0.72, -2 - (i % 3) * 2);
      nodePositions.push(p);
      const n = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 12),
        new THREE.MeshBasicMaterial({ color: 0x8feaff, transparent: true, opacity: 0 })
      );
      n.position.copy(p);
      nodeGroup.add(n);
    }

    const linePositions = [];
    for (let i = 0; i < nodePositions.length; i++) {
      linePositions.push(0, 0, 0, nodePositions[i].x, nodePositions[i].y, nodePositions[i].z);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      color: 0x64e8ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    networkGroup.add(lines);

    // ---------- Scroll narrative ----------
    const proxy = { p: 0 };
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: main,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.35,
        onUpdate: self => {
          state.progress = self.progress;
          state.velocity = self.getVelocity();
        }
      }
    });

    // 0–15% THE VOID
    tl.to(proxy, { p: 0.15, duration: 1, ease: 'none' }, 0);
    tl.to(coreMat, { opacity: 1, duration: 0.6 }, 0);
    tl.to(halo.material, { opacity: 0.35, duration: 0.7 }, 0.05);
    tl.to(halo.scale, { x: 8, y: 8, duration: 1 }, 0.08);

    // 15–35% AWAKENING
    tl.to(particleMat, { opacity: 0.72, duration: 1.1 }, 1);
    tl.to(core.scale, { x: 2.5, y: 2.5, z: 2.5, duration: 1 }, 1);
    tl.to(stars.material, { opacity: 0.24, duration: 1 }, 1.1);
    tl.to(proxy, { p: 0.35, duration: 1.2, ease: 'none' }, 1);

    // 35–55% IDENTITY
    tl.to(glassGroup.position, { z: 10, duration: 1.4, ease: 'power2.inOut' }, 2);
    glassMeshes.forEach((m, i) => {
      tl.to(m.material, { opacity: 0.13, duration: 0.9 }, 2 + i * 0.05);
      tl.to(m.rotation, { y: m.rotation.y * 0.35, duration: 1 }, 2);
    });
    tl.to(camera.position, { z: 26, y: 1.2, duration: 1.5, ease: 'power2.inOut' }, 2);
    tl.to(proxy, { p: 0.55, duration: 1.2, ease: 'none' }, 2);

    // 55–75% CONNECTION
    tl.to(networkGroup.position, { z: 4, duration: 1.2, ease: 'power2.inOut' }, 3.25);
    tl.to(lines.material, { opacity: 0.32, duration: 1 }, 3.3);
    nodeGroup.children.forEach((n, i) => tl.to(n.material, { opacity: 0.8, duration: 0.5 }, 3.25 + i * 0.05));
    tl.to(proxy, { p: 0.75, duration: 1.2, ease: 'none' }, 3.25);

    // 75–90% INTELLIGENCE
    tl.to(networkGroup.rotation, { z: Math.PI * 1.8, duration: 1.5, ease: 'power2.inOut' }, 4.5);
    tl.to(particleMat, { color: new THREE.Color(0xcfffff), size: mobile ? 0.11 : 0.14, duration: 1 }, 4.5);
    tl.to(coreMat, { color: new THREE.Color(0xffffff), duration: 1 }, 4.5);
    tl.to(camera.position, { z: 18, y: -1, duration: 1.4 }, 4.5);
    tl.to(proxy, { p: 0.9, duration: 1, ease: 'none' }, 4.5);

    // 90–100% EXPANSION
    tl.to(camera.position, { z: 36, y: 0, duration: 1.8, ease: 'power2.inOut' }, 5.6);
    tl.to(stars.material, { opacity: 0.42, duration: 1.2 }, 5.6);
    tl.to(particleMat, { opacity: 0.28, duration: 1 }, 5.8);
    tl.to(proxy, { p: 1, duration: 0.8, ease: 'none' }, 5.6);

    // Existing UI becomes part of the environment.
    const hero = document.getElementById('profile');
    const contact = document.getElementById('contact');
    const ai = document.getElementById('ai-section');
    const uiTargets = [hero, contact, ai].filter(Boolean);
    uiTargets.forEach(el => el.classList.add('narrative-ui'));

    gsap.set(uiTargets, { transformPerspective: 1400, transformOrigin: '50% 50%' });

    gsap.fromTo(hero,
      { y: 40, rotateX: 5, scale: 0.97 },
      { y: 0, rotateX: 0, scale: 1, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: hero, start: 'top 82%', end: 'top 40%', scrub: 1 } }
    );

    gsap.fromTo(contact,
      { y: 80, rotateX: 8, rotateY: -2, scale: 0.96 },
      { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'power3.out', scrollTrigger: { trigger: contact, start: 'top 90%', end: 'top 45%', scrub: 1.2 } }
    );

    gsap.fromTo(ai,
      { y: 100, rotateX: 9, rotateY: 2, scale: 0.95 },
      { y: 0, rotateX: 0, rotateY: 0, scale: 1, ease: 'power3.out', scrollTrigger: { trigger: ai, start: 'top 92%', end: 'top 42%', scrub: 1.25 } }
    );

    // Contact cards have individual depth and react to the world.
    document.querySelectorAll('.contact-card').forEach((card, i) => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { z: 24, y: -5, rotateY: i % 2 ? -3 : 3, duration: 0.45, ease: 'power3.out' });
        gsap.to(key, { intensity: 26, duration: 0.45 });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { z: 0, y: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
        gsap.to(key, { intensity: 18, duration: 0.7 });
      });
    });

    // Mouse creates a subtle “looking through a window” effect.
    window.addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / innerWidth - 0.5);
      pointer.ty = (e.clientY / innerHeight - 0.5);
    }, { passive: true });

    window.addEventListener('resize', resize);

    function resize() {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.35 : 1.8));
      renderer.setSize(innerWidth, innerHeight);
      ScrollTrigger.refresh();
    }

    function updateParticles(time) {
      const arr = particleGeo.attributes.position.array;
      const p = state.progress;
      const awakening = THREE.MathUtils.clamp((p - 0.12) / 0.28, 0, 1);
      const easeAwaken = awakening * awakening * (3 - 2 * awakening);
      const expansion = THREE.MathUtils.clamp((p - 0.75) / 0.25, 0, 1);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        const wave = Math.sin(time * 0.45 + i * 0.017) * 0.35;
        const nx = seeds[i3] + Math.sin(time * 0.25 + seeds[i3 + 1] * 0.08) * 1.2;
        const ny = seeds[i3 + 1] + Math.cos(time * 0.22 + seeds[i3] * 0.07) * 1.2;
        const nz = seeds[i3 + 2] + wave;
        arr[i3] = THREE.MathUtils.lerp(nx, grid[i3], easeAwaken) * (1 + expansion * 0.35);
        arr[i3 + 1] = THREE.MathUtils.lerp(ny, grid[i3 + 1], easeAwaken) * (1 + expansion * 0.35);
        arr[i3 + 2] = THREE.MathUtils.lerp(nz, grid[i3 + 2], easeAwaken) - expansion * 28;
      }
      particleGeo.attributes.position.needsUpdate = true;
    }

    function animate() {
      requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      pointer.x += (pointer.tx - pointer.x) * 0.045;
      pointer.y += (pointer.ty - pointer.y) * 0.045;

      const mouseStrength = mobile ? 0.35 : 1;
      world.rotation.y += ((pointer.x * 0.055 * mouseStrength) - world.rotation.y) * 0.025;
      world.rotation.x += ((-pointer.y * 0.045 * mouseStrength) - world.rotation.x) * 0.025;

      stars.rotation.y += 0.00025;
      stars.rotation.x = Math.sin(time * 0.05) * 0.015;
      particles.rotation.z = Math.sin(time * 0.08) * 0.025;
      core.scale.setScalar(1 + Math.sin(time * 2.2) * 0.08);
      halo.material.opacity = Math.max(0, 0.16 + Math.sin(time * 1.6) * 0.05) * (state.progress > 0.12 ? 1 : 0.7);
      halo.rotation.z += 0.002;

      const scrollKick = Math.min(Math.abs(state.velocity) / 3500, 0.5);
      key.position.x = pointer.x * 18;
      key.position.y = 4 - pointer.y * 10;
      key.intensity = 18 + scrollKick * 18;

      updateParticles(time);
      renderer.render(scene, camera);
    }

    // Keep the canvas visible only once the existing app has entered the main UI.
    const reveal = () => {
      if (main.style.display !== 'none') {
        canvas.classList.add('story-ready');
        ScrollTrigger.refresh();
      }
    };
    const observer = new MutationObserver(reveal);
    observer.observe(main, { attributes: true, attributeFilter: ['style'] });
    reveal();
    animate();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
