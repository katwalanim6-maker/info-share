/* ANIM OS — KNOWLEDGE VAULT
 * Scroll-controlled Three.js bookshelf experience.
 * The existing DOM remains the functional UI; this file supplies the cinematic 3D world.
 */
(() => {
  'use strict';

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ease = (v) => v * v * (3 - 2 * v);
  const segment = (p, a, b) => clamp01((p - a) / (b - a));

  class HeroBook {
    constructor(THREE, options) {
      this.THREE = THREE;
      this.id = options.id;
      this.title = options.title;
      this.subtitle = options.subtitle;
      this.color = options.color;
      this.position = options.position;
      this.group = new THREE.Group();
      this.group.position.copy(options.position);
      this.group.rotation.y = Math.PI;
      this.closedRotation = this.group.rotation.y;

      const coverMat = new THREE.MeshStandardMaterial({
        color: options.color,
        roughness: 0.28,
        metalness: 0.38
      });
      const edgeMat = new THREE.MeshStandardMaterial({
        color: 0x8f959c,
        roughness: 0.24,
        metalness: 0.78
      });
      const pageMat = new THREE.MeshStandardMaterial({
        color: 0xe8e4d8,
        roughness: 0.8,
        metalness: 0.02,
        side: THREE.DoubleSide
      });

      this.back = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.75, 0.13), coverMat);
      this.back.position.z = 0.02;
      this.group.add(this.back);

      this.pages = new THREE.Mesh(new THREE.BoxGeometry(1.72, 2.58, 0.20), pageMat);
      this.pages.position.z = 0.12;
      this.group.add(this.pages);

      this.frontPivot = new THREE.Group();
      this.frontPivot.position.set(-0.92, 0, 0.23);
      this.group.add(this.frontPivot);

      this.front = new THREE.Mesh(new THREE.BoxGeometry(1.85, 2.75, 0.13), coverMat);
      this.front.position.x = 0.92;
      this.frontPivot.add(this.front);

      this.spine = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.82, 0.24), edgeMat);
      this.spine.position.x = -0.88;
      this.spine.position.z = 0.12;
      this.group.add(this.spine);

      const pageEdge = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.025, 0.23), edgeMat);
      pageEdge.position.set(0, 1.3, 0.23);
      this.group.add(pageEdge);

      this.anchor = new THREE.Object3D();
      this.anchor.position.set(0.35, 0.35, 0.34);
      this.group.add(this.anchor);

      // Tiny silver title mark; text remains DOM for crisp accessibility.
      const titleBar = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.07, 0.02), edgeMat);
      titleBar.position.set(0.92, -0.15, 0.31);
      this.frontPivot.add(titleBar);

      this.base = this.group.position.clone();
    }

    update(focus) {
      const extract = ease(focus.extract);
      const open = ease(focus.open);
      const returnFactor = ease(focus.returnFactor);

      // Pull the book toward the camera, then rotate it squarely toward us.
      this.group.position.z = this.base.z + extract * 4.15 - returnFactor * 4.15;
      this.group.position.x = this.base.x + Math.sin(extract * Math.PI) * 0.16;
      this.group.position.y = this.base.y + extract * 0.08;
      this.group.rotation.y = this.closedRotation + extract * (Math.PI * 0.72);
      this.group.rotation.x = Math.sin(extract * Math.PI) * 0.06;
      this.frontPivot.rotation.y = -open * Math.PI * 0.88;

      // Page block fans slightly to sell the physical opening without heavy physics.
      this.pages.scale.x = 1 + open * 0.045;
      this.pages.scale.y = 1 + open * 0.012;
      this.pages.rotation.y = open * 0.025;
    }
  }

  class VaultEngine {
    constructor() {
      this.THREE = window.THREE;
      this.canvas = document.getElementById('story-canvas');
      this.main = document.getElementById('main');
      this.container = document.querySelector('.container');
      this.mobile = window.matchMedia('(max-width:700px)').matches;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.progress = 0;
      this.targetProgress = 0;
      this.heroBooks = [];
      this.focusPoints = [];
      this.domSections = {};
      this.clock = new this.THREE.Clock();
      this.tmp = new this.THREE.Vector3();
      this.tmp2 = new this.THREE.Vector3();
    }

    init() {
      if (!this.THREE || !this.canvas || !this.main || window.__animKnowledgeVault) return;
      window.__animKnowledgeVault = this;

      this.injectStageStyles();
      this.setupRenderer();
      this.setupScene();
      this.setupRoom();
      this.setupBooks();
      this.setupCameraRail();
      this.setupScroll();
      this.setupResize();
      this.render();
    }

    injectStageStyles() {
      const style = document.createElement('style');
      style.textContent = `
        #story-canvas{opacity:1!important;visibility:visible!important;mix-blend-mode:normal!important;background:#020201!important}
        #main{background:transparent!important}
        .orb{display:none!important}
        .vault-ui{position:relative;z-index:4;transform-origin:center center;will-change:transform,opacity,filter}
        #profile,#projects,#contact,#ai-section{scroll-margin-top:90px}
        .vault-stage-label{position:fixed;left:24px;bottom:22px;z-index:8;font-size:9px;letter-spacing:.24em;color:rgba(255,255,255,.28);pointer-events:none;text-transform:uppercase}
        @media(max-width:700px){.vault-stage-label{left:14px;bottom:12px;font-size:8px}}
      `;
      document.head.appendChild(style);
      const label = document.createElement('div');
      label.className = 'vault-stage-label';
      label.textContent = 'ANIM OS / KNOWLEDGE VAULT';
      document.body.appendChild(label);
      ['profile','projects','contact','ai-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.classList.add('vault-ui');
          this.domSections[id] = el;
        }
      });
    }

    setupRenderer() {
      this.renderer = new this.THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: !this.mobile,
        alpha: false,
        powerPreference: 'high-performance'
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.6));
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.outputColorSpace = this.THREE.SRGBColorSpace;
      this.renderer.setClearColor(0x020201, 1);
    }

    setupScene() {
      this.scene = new this.THREE.Scene();
      this.scene.background = new this.THREE.Color(0x020201);
      this.scene.fog = new this.THREE.FogExp2(0x020201, this.mobile ? 0.018 : 0.013);
      this.camera = new this.THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 180);
      this.camera.position.set(0, 1.8, 18);
      this.world = new this.THREE.Group();
      this.scene.add(this.world);
    }

    setupRoom() {
      const T = this.THREE;
      const wood = new T.MeshStandardMaterial({color:0x15120f, roughness:0.68, metalness:0.08});
      const dark = new T.MeshStandardMaterial({color:0x08090a, roughness:0.5, metalness:0.5});

      const floor = new T.Mesh(new T.PlaneGeometry(44, 70), wood);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -2.3;
      floor.position.z = -15;
      this.world.add(floor);

      const back = new T.Mesh(new T.BoxGeometry(34, 20, 0.5), dark);
      back.position.set(0, 7, -28);
      this.world.add(back);

      this.shelf = new T.Group();
      this.shelf.position.set(0, 1.0, -13);
      this.world.add(this.shelf);

      const woodMat = new T.MeshStandardMaterial({color:0x24201a, roughness:0.46, metalness:0.15});
      const shelfWidth = this.mobile ? 14 : 19;
      for (let i = 0; i < 7; i++) {
        const plank = new T.Mesh(new T.BoxGeometry(shelfWidth, 0.22, 1.15), woodMat);
        plank.position.y = -3.2 + i * 2.25;
        this.shelf.add(plank);
      }
      for (const x of [-shelfWidth/2, shelfWidth/2]) {
        const post = new T.Mesh(new T.BoxGeometry(0.28, 15.5, 1.2), woodMat);
        post.position.set(x, 3.3, 0);
        this.shelf.add(post);
      }

      const warm = new T.PointLight(0xffe5bd, this.mobile ? 1.1 : 1.6, 20, 2);
      warm.position.set(0, 4, -9);
      this.world.add(warm);
      const rim = new T.PointLight(0xdfe8ff, this.mobile ? 0.65 : 1.0, 24, 2);
      rim.position.set(0, 1, -4);
      this.world.add(rim);

      this.addDust();
    }

    addDust() {
      const T = this.THREE;
      const count = this.reduced ? 80 : (this.mobile ? 140 : 320);
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random()-0.5) * 24;
        positions[i*3+1] = -2 + Math.random() * 14;
        positions[i*3+2] = -2 - Math.random() * 35;
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(positions,3));
      this.dust = new T.Points(geo, new T.PointsMaterial({color:0xd8d2c3,size:this.mobile?0.035:0.045,transparent:true,opacity:0.26,depthWrite:false}));
      this.world.add(this.dust);
    }

    makeFillerBooks() {
      const T = this.THREE;
      const count = this.mobile ? 90 : 190;
      const geo = new T.BoxGeometry(0.32, 1.72, 0.68);
      const mat = new T.MeshStandardMaterial({color:0x45403a,roughness:0.55,metalness:0.28});
      const mesh = new T.InstancedMesh(geo, mat, count);
      const dummy = new T.Object3D();
      for (let i=0;i<count;i++) {
        const row = Math.floor(i/30);
        const col = i%30;
        const y = -2.35 + row*2.25 + 0.95;
        const x = -8.6 + col*0.59 + (Math.random()-0.5)*0.08;
        dummy.position.set(x,y,-12.55+(Math.random()-0.5)*0.16);
        dummy.rotation.z = (Math.random()-0.5)*0.06;
        const scale = 0.72 + Math.random()*0.5;
        dummy.scale.set(0.8+Math.random()*0.7,scale,0.8+Math.random()*0.35);
        dummy.updateMatrix();
        mesh.setMatrixAt(i,dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;
      this.shelf.add(mesh);
    }

    setupBooks() {
      const T = this.THREE;
      this.makeFillerBooks();
      const configs = [
        {id:'profile',title:'IDENTITY',subtitle:'PROFILE',color:0x20262b,position:new T.Vector3(-4.1,0.55,-11.65)},
        {id:'projects',title:'WORK',subtitle:'PROJECTS',color:0x29251f,position:new T.Vector3(1.0,2.80,-11.65)},
        {id:'contact',title:'NETWORK',subtitle:'CONTACT',color:0x202421,position:new T.Vector3(4.7,0.55,-11.65)},
        {id:'ai-section',title:'INTELLIGENCE',subtitle:'AI',color:0x25232c,position:new T.Vector3(-1.7,5.05,-11.65)}
      ];
      configs.forEach(c => {
        const book = new HeroBook(T,c);
        this.heroBooks.push(book);
        this.shelf.add(book.group);
      });
      this.focusPoints = [
        new T.Vector3(-4.1,1.5,-5.2),
        new T.Vector3(1.0,3.7,-5.0),
        new T.Vector3(4.7,1.5,-5.1),
        new T.Vector3(-1.7,5.7,-5.0)
      ];
    }

    setupCameraRail() {
      const T = this.THREE;
      this.cameraPath = new T.CatmullRomCurve3([
        new T.Vector3(0,1.5,17), new T.Vector3(0,1.2,7),
        new T.Vector3(-2,1.8,2), new T.Vector3(-4.1,1.7,-3.2),
        new T.Vector3(0.8,3.2,-3.1), new T.Vector3(4.2,1.7,-3.0),
        new T.Vector3(-1.4,5.1,-2.8), new T.Vector3(0,2.6,8)
      ]);
      this.targetPath = new T.CatmullRomCurve3([
        new T.Vector3(0,1.5,-12), new T.Vector3(0,1.5,-11),
        this.focusPoints[0].clone(), this.focusPoints[0].clone(),
        this.focusPoints[1].clone(), this.focusPoints[1].clone(),
        this.focusPoints[2].clone(), this.focusPoints[3].clone()
      ]);
    }

    setupScroll() {
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
        this.trigger = window.ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: () => Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
          scrub: true,
          onUpdate: self => { this.targetProgress = self.progress; }
        });
      } else {
        window.addEventListener('scroll', () => {
          const max = Math.max(1, document.documentElement.scrollHeight-window.innerHeight);
          this.targetProgress = window.scrollY/max;
        }, {passive:true});
      }
    }

    setupResize() {
      window.addEventListener('resize', () => {
        this.mobile = window.matchMedia('(max-width:700px)').matches;
        this.camera.aspect = window.innerWidth/window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,this.mobile?1.25:1.6));
        this.renderer.setSize(window.innerWidth,window.innerHeight);
        if(window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, {passive:true});
    }

    updateBookFocus(index, local) {
      const focus = {
        extract: segment(local,0.05,0.27),
        open: segment(local,0.24,0.58),
        returnFactor: segment(local,0.70,1)
      };
      this.heroBooks[index].update(focus);
      return focus;
    }

    updateDOM(index, local) {
      const ids=['profile','projects','contact','ai-section'];
      ids.forEach((id,i)=>{
        const el=this.domSections[id];
        if(!el)return;
        let opacity=0;
        let scale=0.88;
        let y=40;
        let blur=7;
        if(i===index && local>0.40 && local<0.78){
          const reveal=ease(segment(local,0.40,0.52));
          const exit=ease(segment(local,0.68,0.78));
          opacity=reveal*(1-exit);
          scale=0.92+reveal*0.08;
          y=34*(1-reveal);
          blur=7*(1-reveal);
          if(opacity>0.02) el.style.pointerEvents='auto';
          else el.style.pointerEvents='none';
        } else if(i===0 && this.progress<0.18){
          // The first profile remains naturally visible as the entry point.
          opacity=1; scale=1; y=0; blur=0;
          el.style.pointerEvents='auto';
        } else {
          el.style.pointerEvents='auto';
        }
        el.style.opacity=opacity;
        el.style.filter=`blur(${blur}px)`;
        el.style.transform=`translate3d(0,${y}px,0) scale(${scale})`;
      });
    }

    updateScene() {
      this.progress += (this.targetProgress-this.progress)*(this.reduced?0.2:0.085);
      const p=this.progress;
      const T=this.THREE;

      // Camera rail is continuous; each hero zone occupies one quarter of the journey.
      const cameraPos=this.cameraPath.getPointAt(clamp01(p));
      const target=this.targetPath.getPointAt(clamp01(p));
      this.camera.position.lerp(cameraPos,0.08);
      this.tmp.lerp(target,0.1);
      this.camera.lookAt(this.tmp);
      const focusWindow=p*4;
      const active=Math.min(3,Math.floor(Math.max(0,focusWindow)));
      const local=focusWindow-active;
      for(let i=0;i<this.heroBooks.length;i++){
        const distance=Math.abs(i-focusWindow);
        const localForBook=clamp01(1-distance);
        this.updateBookFocus(i,localForBook);
      }
      this.updateDOM(active,local);
      this.dust.rotation.y += 0.00012;

      // Slight focus breathing when a book is active.
      const f=segment(local,0.24,0.6);
      this.camera.fov=48-f*5;
      this.camera.updateProjectionMatrix();

      // Keep the visual environment dark and premium.
      const ambientPulse=0.92+Math.sin(this.clock.elapsedTime*0.35)*0.03;
      this.scene.fog.density=(this.mobile?0.019:0.013)*ambientPulse;
    }

    render() {
      requestAnimationFrame(()=>this.render());
      this.updateScene();
      this.renderer.render(this.scene,this.camera);
    }
  }

  window.initNarrativeWorld = () => {
    if (!window.__animKnowledgeVault) new VaultEngine().init();
  };
})();
