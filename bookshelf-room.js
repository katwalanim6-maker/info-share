/* ANIM OS — INTERACTIVE 3D LIBRARY
 * Rebuilt around one physical coordinate system.
 * Shelf geometry is the source of truth for every book, hero book and camera target.
 */
(() => {
  'use strict';

  const T = window.THREE;
  const canvas = document.getElementById('story-canvas');
  const main = document.getElementById('main');
  if (!T || !canvas || !main || window.__animKnowledgeLibrary) return;
  window.__animKnowledgeLibrary = true;

  const mobile = window.matchMedia('(max-width:700px)').matches;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- PHYSICAL LIBRARY MODEL ---------- */
  const LIB = Object.freeze({
    bays: [-14, -7, 0, 7, 14],
    bayWidth: 6.8,
    shelf: {
      firstY: -4,
      rowStep: 2.45,
      thickness: .28,
      depth: 1.35,
      backZ: -.675,
      frontZ: .675,
      lipDepth: .14,
      lipHeight: .065,
      bookGap: .045,
      sideClearance: .18
    },
    rows: 9,
    normalBook: { minW: .46, maxW: .80, minH: 1.42, maxH: 1.90, minD: .70, maxD: .86 },
    hero: { width: 3.35, height: 5.15, depth: .42, closedScale: .38 }
  });

  const shelfY = row => LIB.shelf.firstY + row * LIB.shelf.rowStep;
  const shelfTop = row => shelfY(row) + LIB.shelf.thickness / 2;
  const bayLeft = bay => LIB.bays[bay] - LIB.bayWidth / 2;
  const bayRight = bay => LIB.bays[bay] + LIB.bayWidth / 2;

  // Normal books are placed from their physical bottom/front extents.
  const placeNormalBook = (row, h, d) => {
    const bottom = shelfTop(row) + LIB.shelf.bookGap;
    const frontInterior = LIB.shelf.frontZ - LIB.shelf.lipDepth - .025;
    return { y: bottom + h / 2, z: frontInterior - d / 2 };
  };

  const HEROES = Object.freeze([
    // The first and fourth featured books intentionally use the two inner bays.
    { id: 'profile', bay: 1, row: 6, color: 0x197cff, rotation: .015 },
    { id: 'projects', bay: 2, row: 4, color: 0x19bd67, rotation: -.025 },
    { id: 'contact', bay: 2, row: 1, color: 0xff3040, rotation: .020 },
    { id: 'ai-section', bay: 3, row: 5, color: 0xffcf21, rotation: -.018 },
    { id: 'future', bay: 3, row: 7, color: 0x2588ff, rotation: .028 }
  ]);

  const heroReserved = new Set(HEROES.map(h => `${h.bay}:${h.row}`));

  /* ---------- PAGE / CANVAS LAYER ---------- */
  const uiStyle = document.createElement('style');
  uiStyle.textContent = `
    html,body,#main{background:transparent!important}
    body:after{display:none!important}
    #story-canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;display:block!important;background:#100d0b!important;filter:none!important;touch-action:none}
    #main{position:relative!important;min-height:${mobile ? 1150 : 1000}vh!important;background:transparent!important}
    #main .container{position:relative!important;min-height:${mobile ? 1150 : 1000}vh!important;height:${mobile ? 1150 : 1000}vh!important;max-width:none!important;margin:0!important;padding:0!important;z-index:4!important;pointer-events:none!important}
    #main .container>section.library-panel{position:fixed!important;left:50%!important;top:50%!important;width:min(520px,70vw)!important;height:min(560px,72vh)!important;margin:0!important;overflow:auto!important;z-index:25!important;opacity:0;pointer-events:none;transform:translate(-50%,-50%) scale(.18);transform-origin:center!important;will-change:transform,opacity!important;border-radius:18px!important}
    .library-panel a,.library-panel button,.library-panel input{pointer-events:auto!important}
    .library-close{position:fixed;right:20px;top:20px;z-index:40;padding:9px 13px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(0,0,0,.42);color:#fff;backdrop-filter:blur(12px);display:none;font:700 10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
    .library-close.is-visible{display:block}
    .library-title{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:12;color:rgba(255,255,255,.62);font:700 9px/1 Arial,sans-serif;letter-spacing:.5em;white-space:nowrap;pointer-events:none;text-shadow:0 1px 10px #000}
    .library-hint{position:fixed;right:18px;bottom:24px;z-index:12;color:rgba(255,255,255,.5);font:700 8px/1 Arial,sans-serif;letter-spacing:.25em;writing-mode:vertical-rl;pointer-events:none;text-shadow:0 1px 10px #000}
    @media(max-width:700px){#main .container>section.library-panel{width:min(340px,82vw);height:min(500px,70vh)}.library-title{top:13px;font-size:7px}.library-hint{right:7px;font-size:7px}}
  `;
  document.head.appendChild(uiStyle);

  ['profile','projects','contact','ai-section','future'].forEach(id => document.getElementById(id)?.classList.add('library-panel'));

  const title = document.createElement('div');
  title.className = 'library-title';
  title.textContent = 'ANIM OS  •  THE LIBRARY';
  document.body.appendChild(title);

  const hint = document.createElement('div');
  hint.className = 'library-hint';
  hint.textContent = 'SCROLL';
  document.body.appendChild(hint);

  const closeButton = document.createElement('button');
  closeButton.className = 'library-close';
  closeButton.textContent = 'CLOSE BOOK';
  document.body.appendChild(closeButton);

  /* ---------- THREE ---------- */
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: !mobile,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = mobile ? 1.16 : 1.12;

  const scene = new T.Scene();
  scene.background = new T.Color(0x100d0b);
  scene.fog = new T.Fog(0x100d0b, 30, 78);

  const camera = new T.PerspectiveCamera(48, innerWidth / innerHeight, .1, 100);
  const world = new T.Group();
  scene.add(world);
  const library = new T.Group();
  library.position.z = -19;
  world.add(library);

  const wood = new T.MeshStandardMaterial({ color: 0x6a4327, roughness: .68, metalness: .04 });
  const darkWood = new T.MeshStandardMaterial({ color: 0x302019, roughness: .84 });
  const shelfEdge = new T.MeshStandardMaterial({ color: 0xb47a48, roughness: .46, metalness: .08 });
  const brass = new T.MeshStandardMaterial({ color: 0x9a8155, roughness: .26, metalness: .62 });
  const floorMat = new T.MeshStandardMaterial({ color: 0x21150f, roughness: .92 });

  const back = new T.Mesh(new T.PlaneGeometry(58, 38), darkWood);
  back.position.set(0, 6, -1.2);
  library.add(back);

  const floor = new T.Mesh(new T.PlaneGeometry(58, 55), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -5, 9);
  library.add(floor);

  const ceiling = new T.Mesh(new T.PlaneGeometry(58, 55), darkWood);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 17, 7);
  library.add(ceiling);

  const leftWall = new T.Mesh(new T.PlaneGeometry(55, 30), darkWood);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-29, 6, 6);
  library.add(leftWall);
  const rightWall = leftWall.clone();
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.x = 29;
  library.add(rightWall);

  // Shelf geometry and book geometry use exactly the same dimensions.
  for (let bay = 0; bay < LIB.bays.length; bay++) {
    const group = new T.Group();
    group.position.x = LIB.bays[bay];
    library.add(group);

    for (const sx of [-3.25, 3.25]) {
      const post = new T.Mesh(new T.BoxGeometry(.34, 23, 1.15), wood);
      post.position.set(sx, 6, -.05);
      group.add(post);
    }

    for (let row = 0; row < LIB.rows; row++) {
      const y = shelfY(row);
      const plank = new T.Mesh(new T.BoxGeometry(LIB.bayWidth, LIB.shelf.thickness, LIB.shelf.depth), wood);
      plank.position.set(0, y, 0);
      group.add(plank);

      const lip = new T.Mesh(new T.BoxGeometry(LIB.bayWidth, LIB.shelf.lipHeight, LIB.shelf.lipDepth), shelfEdge);
      lip.position.set(0, y + LIB.shelf.thickness / 2 + LIB.shelf.lipHeight / 2, LIB.shelf.frontZ);
      group.add(lip);

      const glow = new T.PointLight(0xffc27b, .5, 5, 2);
      glow.position.set(0, y + .72, .25);
      group.add(glow);
    }

    const top = new T.Mesh(new T.BoxGeometry(7, .5, 1.45), wood);
    top.position.set(0, 17, 0);
    group.add(top);
  }

  /* ---------- DETERMINISTIC NORMAL BOOK PACKING ---------- */
  let seed = 7919;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const positions = [];

  function pack(row, bay, start, end) {
    let cursor = start;
    while (cursor < end - LIB.normalBook.minW) {
      const w = lerp(LIB.normalBook.minW, LIB.normalBook.maxW, rnd());
      const h = lerp(LIB.normalBook.minH, LIB.normalBook.maxH, rnd());
      const d = lerp(LIB.normalBook.minD, LIB.normalBook.maxD, rnd());
      if (cursor + w > end) break;
      const p = placeNormalBook(row, h, d);
      positions.push({ x: cursor + w / 2, y: p.y, z: p.z, w, h, d, ry: (rnd() - .5) * .028, rz: (rnd() - .5) * .045 });
      cursor += w + .055;
    }
  }

  for (let row = 0; row < LIB.rows; row++) {
    for (let bay = 0; bay < LIB.bays.length; bay++) {
      const left = bayLeft(bay) + LIB.shelf.sideClearance;
      const right = bayRight(bay) - LIB.shelf.sideClearance;
      const key = `${bay}:${row}`;
      if (!heroReserved.has(key)) {
        pack(row, bay, left, right);
      } else {
        // Reserve a central physical footprint for the featured book.
        const centre = LIB.bays[bay];
        const reserve = 1.95;
        pack(row, bay, left, centre - reserve);
        pack(row, bay, centre + reserve, right);
      }
    }
  }

  const palette = [0x30251e,0x1d4942,0x51282e,0x654523,0x2b3747,0x47442d,0x5b4940,0x263330];
  const perMesh = Math.max(1, Math.ceil(positions.length / palette.length));
  const meshes = palette.map(color => new T.InstancedMesh(new T.BoxGeometry(1,1,1), new T.MeshStandardMaterial({ color, roughness: .72, metalness: .04 }), perMesh));
  const counts = new Array(meshes.length).fill(0);
  const dummy = new T.Object3D();

  positions.forEach((p, i) => {
    const mi = i % meshes.length;
    const n = counts[mi]++;
    dummy.position.set(p.x, p.y, p.z);
    dummy.rotation.set(0, p.ry, p.rz);
    dummy.scale.set(p.w, p.h, p.d);
    dummy.updateMatrix();
    meshes[mi].setMatrixAt(n, dummy.matrix);
  });

  meshes.forEach((mesh, i) => {
    mesh.count = counts[i];
    mesh.instanceMatrix.needsUpdate = true;
    mesh.userData.libraryBooks = true;
    library.add(mesh);
  });

  for (const x of LIB.bays) {
    const rail = new T.Mesh(new T.BoxGeometry(6.9,.06,.06), brass);
    rail.position.set(x, 15.9, .72);
    library.add(rail);
  }

  /* ---------- LIGHTING ---------- */
  scene.add(new T.HemisphereLight(0xffe7cc, 0x151b24, 1.05));
  const warm = new T.PointLight(0xffb56a, 4.2, 34, 1.55);
  warm.position.set(0, 8, 9);
  world.add(warm);
  const cool = new T.PointLight(0x668cff, 1.25, 30, 1.8);
  cool.position.set(0, 3, 11);
  world.add(cool);
  const cameraLight = new T.PointLight(0xffe3bf, 1.55, 16, 2);
  world.add(cameraLight);

  const dustN = mobile ? 65 : 140;
  const dustPositions = new Float32Array(dustN * 3);
  for (let i = 0; i < dustN; i++) {
    dustPositions[i*3] = (rnd() - .5) * 45;
    dustPositions[i*3+1] = -4 + rnd() * 20;
    dustPositions[i*3+2] = -4 - rnd() * 30;
  }
  const dustGeo = new T.BufferGeometry();
  dustGeo.setAttribute('position', new T.BufferAttribute(dustPositions, 3));
  world.add(new T.Points(dustGeo, new T.PointsMaterial({ color: 0xe4d5c2, size: .055, transparent: true, opacity: .2, depthWrite: false })));

  /* ---------- FEATURED BOOKS ---------- */
  class HeroBook {
    constructor(cfg) {
      this.id = cfg.id;
      this.cfg = cfg;
      this.scaleClosed = LIB.hero.closedScale;
      this.localFront = .41;
      this.actualHeight = LIB.hero.height * this.scaleClosed;

      // The bottom is derived from the shelf top. The front face is derived from the lip.
      const bottom = shelfTop(cfg.row) + LIB.shelf.bookGap;
      const frontVisiblePlane = LIB.shelf.frontZ - LIB.shelf.lipDepth - .035;
      const centreZ = frontVisiblePlane - this.localFront * this.scaleClosed;
      this.base = new T.Vector3(LIB.bays[cfg.bay], bottom + this.actualHeight / 2, centreZ);

      this.group = new T.Group();
      this.group.position.copy(this.base);
      this.group.scale.setScalar(this.scaleClosed);
      this.group.rotation.y = cfg.rotation;
      this.group.userData.heroBook = this;
      library.add(this.group);

      const cover = new T.MeshStandardMaterial({ color: cfg.color, roughness: .23, metalness: .42, emissive: cfg.color, emissiveIntensity: .035 });
      const page = new T.MeshStandardMaterial({ color: 0xf1eadb, roughness: .8, side: T.DoubleSide });
      const pageInner = new T.MeshStandardMaterial({ color: 0xe6decd, roughness: .82, side: T.DoubleSide });
      const metal = new T.MeshStandardMaterial({ color: 0xc7cbd0, roughness: .18, metalness: .9 });

      this.back = new T.Mesh(new T.BoxGeometry(LIB.hero.width, LIB.hero.height, .2), cover);
      this.back.userData.heroBook = this;
      this.group.add(this.back);

      this.pages = new T.Group();
      this.pages.position.z = .17;
      this.group.add(this.pages);
      for (let i = 0; i < 26; i++) {
        const p = new T.Mesh(new T.PlaneGeometry(3.12,4.86), i === 13 ? pageInner : page);
        p.userData.heroBook = this;
        p.position.z = .01 + i * .005;
        this.pages.add(p);
      }

      this.frontPivot = new T.Group();
      this.frontPivot.position.set(-LIB.hero.width/2, 0, .31);
      this.group.add(this.frontPivot);
      this.front = new T.Mesh(new T.BoxGeometry(LIB.hero.width, LIB.hero.height, .2), cover);
      this.front.position.x = LIB.hero.width/2;
      this.front.userData.heroBook = this;
      this.frontPivot.add(this.front);

      this.spine = new T.Mesh(new T.BoxGeometry(.18, LIB.hero.height+.12, .3), metal);
      this.spine.position.set(-LIB.hero.width/2+.02, 0, .14);
      this.spine.userData.heroBook = this;
      this.group.add(this.spine);

      const stripe = new T.Mesh(new T.BoxGeometry(2.1,.055,.055), metal);
      stripe.position.set(LIB.hero.width/2, -.72, .43);
      this.frontPivot.add(stripe);

      this.glow = new T.PointLight(cfg.color, 0, 9, 2);
      this.glow.position.set(.4,0,.7);
      this.group.add(this.glow);
    }

    update(extract, open) {
      const e = smooth(clamp(extract));
      const o = smooth(clamp(open));
      this.group.position.x = this.base.x + Math.sin(e * Math.PI) * .15;
      this.group.position.y = this.base.y + Math.sin(e * Math.PI) * .08;
      this.group.position.z = this.base.z + e * 10;
      this.group.scale.setScalar(lerp(this.scaleClosed, 1.42, e));
      this.group.rotation.y = lerp(this.cfg.rotation, .03, e);
      this.group.rotation.x = -Math.sin(e * Math.PI) * .06;
      this.frontPivot.rotation.y = -o * 2.92;
      this.pages.children.forEach((p, i) => {
        const t = i / (this.pages.children.length - 1);
        p.position.x = (t - .5) * o * .72;
        p.rotation.y = (t - .5) * o * .42;
        p.position.z = .02 + i * .004 + Math.sin(t * Math.PI) * o * .18;
      });
      this.glow.intensity = o * 2.8;
    }

    reset() {
      this.group.position.copy(this.base);
      this.group.scale.setScalar(this.scaleClosed);
      this.group.rotation.set(0, this.cfg.rotation, 0);
      this.frontPivot.rotation.y = 0;
      this.pages.children.forEach((p, i) => {
        p.position.x = 0;
        p.rotation.y = 0;
        p.position.z = .02 + i * .005;
      });
      this.glow.intensity = 0;
    }
  }

  const heroes = HEROES.map(cfg => new HeroBook(cfg));

  /* ---------- SCROLL + CAMERA ---------- */
  let scrollTarget = 0;
  let scrollProgress = 0;
  function readScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    scrollTarget = clamp(window.scrollY / max);
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  let selected = null;
  let extract = 0;
  let open = 0;
  let previousOverflow = '';

  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2();

  function hidePanels() {
    ['profile','projects','contact','ai-section','future'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      el.style.transform = 'translate(-50%,-50%) scale(.18)';
    });
  }

  function showPanel(id) {
    hidePanels();
    const el = document.getElementById(id);
    if (!el) return;
    el.style.opacity = '1';
    el.style.pointerEvents = 'auto';
    el.style.transform = 'translate(-50%,-50%) scale(1)';
  }

  function openHero(hero) {
    if (selected || !hero) return;
    selected = hero;
    extract = 0;
    open = 0;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButton.classList.add('is-visible');
    hint.style.opacity = '.15';
    showPanel(hero.id);
  }

  function closeHero() {
    if (!selected) return;
    const hero = selected;
    hidePanels();
    closeButton.classList.remove('is-visible');
    document.body.style.overflow = previousOverflow;
    hero.reset();
    selected = null;
    extract = 0;
    open = 0;
    hint.style.opacity = '1';
  }

  closeButton.addEventListener('click', closeHero);
  addEventListener('keydown', e => { if (e.key === 'Escape') closeHero(); });

  function setPointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener('pointerup', e => {
    if (selected) return;
    setPointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(heroes.map(h => h.group), true);
    if (!hits.length) return;
    let object = hits[0].object;
    let hero = object.userData.heroBook;
    while (!hero && object.parent) {
      object = object.parent;
      hero = object.userData.heroBook;
    }
    if (hero) openHero(hero);
  });

  const cameraTarget = new T.Vector3();
  const cameraPosition = new T.Vector3();

  function updateCamera() {
    if (selected) {
      cameraTarget.copy(selected.group.position);
      cameraPosition.set(cameraTarget.x, cameraTarget.y + .1, cameraTarget.z + 9.2);
      camera.position.lerp(cameraPosition, .12);
      camera.lookAt(cameraTarget);
      return;
    }

    const scaled = scrollProgress * (heroes.length - 1);
    const index = Math.min(heroes.length - 2, Math.floor(scaled));
    const local = smooth(scaled - index);
    const a = heroes[Math.max(0, index)];
    const b = heroes[Math.min(heroes.length - 1, index + 1)];

    cameraPosition.set(
      lerp(a.base.x, b.base.x, local) * .55,
      lerp(a.base.y + 2.1, b.base.y + 2.1, local),
      8.8
    );
    cameraTarget.set(
      lerp(a.base.x, b.base.x, local),
      lerp(a.base.y + .3, b.base.y + .3, local),
      library.position.z
    );
    camera.position.lerp(cameraPosition, .08);
    camera.lookAt(cameraTarget);
    cameraLight.position.copy(camera.position);
    cameraLight.position.z -= 1;
  }

  function tick() {
    requestAnimationFrame(tick);
    scrollProgress = lerp(scrollProgress, scrollTarget, .075);

    heroes.forEach(hero => {
      if (hero === selected) {
        extract = lerp(extract, 1, .085);
        open = lerp(open, 1, .07);
        hero.update(extract, open);
      } else {
        hero.update(0, 0);
      }
    });

    updateCamera();
    renderer.render(scene, camera);
  }

  addEventListener('resize', () => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  hidePanels();
  tick();
})();
