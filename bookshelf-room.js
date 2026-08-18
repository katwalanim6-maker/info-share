/* ANIM OS — KNOWLEDGE VAULT / CINEMATIC LIBRARY
 * The website behaves like a physical library.
 * Scroll -> camera travels through the room -> one hero book flies from its shelf,
 * opens at the center -> DOM content emerges from its pages -> book closes and returns.
 */
(() => {
  'use strict';

  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const smooth = v => v * v * (3 - 2 * v);
  const remap = (v, a, b) => clamp((v - a) / (b - a));

  class CinematicBook {
    constructor(T, cfg) {
      this.T = T;
      this.id = cfg.id;
      this.base = cfg.position.clone();
      this.group = new T.Group();
      this.group.position.copy(this.base);
      this.group.rotation.y = Math.PI;
      this.restRotation = this.group.rotation.y;
      this.width = 2.05;
      this.height = 3.0;

      const cover = new T.MeshStandardMaterial({
        color: cfg.color, roughness: .3, metalness: .38
      });
      const inside = new T.MeshStandardMaterial({
        color: 0xded7c7, roughness: .72, metalness: .02, side: T.DoubleSide
      });
      const silver = new T.MeshStandardMaterial({
        color: 0xbfc4c9, roughness: .2, metalness: .85
      });

      this.back = new T.Mesh(new T.BoxGeometry(2.05, 3, .16), cover);
      this.back.position.z = .02;
      this.group.add(this.back);

      this.pageBlock = new T.Group();
      this.pageBlock.position.z = .16;
      this.group.add(this.pageBlock);

      // Individual page leaves create a visible paper fan instead of a single brick.
      this.pages = [];
      for (let i = 0; i < 13; i++) {
        const page = new T.Mesh(new T.PlaneGeometry(1.82, 2.72), inside);
        page.position.z = .02 + i * .006;
        page.rotation.y = -.035 + i * .005;
        this.pageBlock.add(page);
        this.pages.push(page);
      }

      this.frontPivot = new T.Group();
      this.frontPivot.position.set(-1.01, 0, .28);
      this.group.add(this.frontPivot);
      this.front = new T.Mesh(new T.BoxGeometry(2.05, 3, .16), cover);
      this.front.position.x = 1.025;
      this.frontPivot.add(this.front);

      this.spine = new T.Mesh(new T.BoxGeometry(.16, 3.06, .27), silver);
      this.spine.position.set(-.94, 0, .13);
      this.group.add(this.spine);

      // Small metallic title plate — intentionally abstract, while the DOM carries real text.
      const plate = new T.Mesh(new T.BoxGeometry(1.05, .06, .035), silver);
      plate.position.set(1.02, -.25, .36);
      this.frontPivot.add(plate);

      this.anchor = new T.Object3D();
      this.anchor.position.set(.12, .12, .48);
      this.group.add(this.anchor);

      this.label = this.makeLabel(T, cfg.title, cfg.accent || 0xe8e3d8);
      this.label.position.set(0, -1.78, .3);
      this.group.add(this.label);
    }

    makeLabel(T, text, accent) {
      // Lightweight canvas texture so each hero book is readable from the camera.
      const c = document.createElement('canvas');
      c.width = 512; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = '#0b0b0b';
      ctx.roundRect(12, 12, 488, 104, 18);
      ctx.fill();
      ctx.strokeStyle = '#8f9398';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#f1eee6';
      ctx.font = '700 31px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);
      const tex = new T.CanvasTexture(c);
      tex.colorSpace = T.SRGBColorSpace;
      return new T.Mesh(
        new T.PlaneGeometry(1.65, .41),
        new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false })
      );
    }

    update(f) {
      const extract = smooth(f.extract);
      const open = smooth(f.open);
      const settle = smooth(f.settle);
      const returnP = smooth(f.returnP);

      // The book physically leaves the shelf, flies toward the viewer, settles at center,
      // opens, then reverses exactly when the user scrolls back.
      const forward = extract * (1 - returnP);
      this.group.position.x = this.base.x + Math.sin(extract * Math.PI) * .42 - returnP * .12;
      this.group.position.y = this.base.y + Math.sin(extract * Math.PI) * .26;
      this.group.position.z = this.base.z + forward * 6.8;
      this.group.scale.setScalar(1 + settle * .16);
      this.group.rotation.y = this.restRotation + extract * Math.PI * .86;
      this.group.rotation.x = Math.sin(extract * Math.PI) * -.09;
      this.group.rotation.z = Math.sin(extract * Math.PI) * .035;

      // Open toward the camera. Pages fan in the opposite direction for a tactile feel.
      this.frontPivot.rotation.y = -open * Math.PI * .92;
      this.pages.forEach((page, i) => {
        const t = i / (this.pages.length - 1);
        page.rotation.y = (-.04 + t * .08) * (1 - open) + (t - .5) * open * .16;
        page.position.x = (t - .5) * open * .22;
        page.position.z = .02 + i * .006 + open * .05 * Math.sin(t * Math.PI);
      });
      this.anchor.visible = open > .02;
    }
  }

  class LibraryEngine {
    constructor() {
      this.T = window.THREE;
      this.canvas = document.getElementById('story-canvas');
      this.main = document.getElementById('main');
      this.mobile = matchMedia('(max-width:700px)').matches;
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.p = 0;
      this.targetP = 0;
      this.books = [];
      this.sections = {};
      this.clock = new this.T.Clock();
      this.tmp = new this.T.Vector3();
      this.tmp2 = new this.T.Vector3();
    }

    init() {
      if (!this.T || !this.canvas || !this.main || window.__animKnowledgeVault) return;
      window.__animKnowledgeVault = this;
      this.injectStageCSS();
      this.setupRenderer();
      this.setupScene();
      this.setupLibrary();
      this.setupBooks();
      this.setupCamera();
      this.setupScroll();
      this.setupResize();
      this.render();
    }

    injectStageCSS() {
      const s = document.createElement('style');
      s.id = 'anim-vault-cinematic-css';
      s.textContent = `
        html,body{background:#090806!important}
        #main{background:transparent!important;min-height:760vh!important}
        #story-canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;display:block!important;background:#090806!important}
        #main .container{position:relative!important;width:100%!important;max-width:none!important;height:760vh!important;padding:0!important;margin:0!important;z-index:3!important;pointer-events:none!important}
        #main .container>section.vault-ui{position:fixed!important;left:50%!important;top:50%!important;width:min(760px,calc(100vw - 32px))!important;max-height:78vh!important;overflow:auto!important;margin:0!important;z-index:12!important;pointer-events:none;opacity:0;transform:translate3d(-50%,-50%,0) scale(.82)!important;transform-origin:center!important;will-change:transform,opacity,filter!important}
        #main .container>section.vault-ui::-webkit-scrollbar{width:3px}
        #main .container>footer{position:fixed!important;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;pointer-events:none}
        .vault-cinematic-caption{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:8;letter-spacing:.32em;font-size:9px;color:rgba(245,241,231,.38);text-transform:uppercase;pointer-events:none;white-space:nowrap}
        .vault-scroll-hint{position:fixed;right:26px;bottom:28px;z-index:8;writing-mode:vertical-rl;letter-spacing:.24em;font-size:8px;color:rgba(255,255,255,.3);pointer-events:none}
        @media(max-width:700px){
          #main .container{height:900vh!important}
          #main .container>section.vault-ui{width:calc(100vw - 20px)!important;max-height:74vh!important}
          .vault-cinematic-caption{bottom:18px;font-size:7px}
          .vault-scroll-hint{right:10px;bottom:18px}
        }
        @media(prefers-reduced-motion:reduce){#story-canvas{display:none!important}#main .container>section.vault-ui{position:relative!important;left:auto!important;top:auto!important;transform:none!important;opacity:1!important;pointer-events:auto!important;margin:30px auto!important}}
      `;
      document.head.appendChild(s);

      ['profile','projects','contact','ai-section'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.classList.add('vault-ui'); this.sections[id] = el; }
      });

      const caption = document.createElement('div');
      caption.className = 'vault-cinematic-caption';
      caption.textContent = 'ANIM OS  •  KNOWLEDGE VAULT';
      document.body.appendChild(caption);
      const hint = document.createElement('div');
      hint.className = 'vault-scroll-hint';
      hint.textContent = 'SCROLL TO EXPLORE';
      document.body.appendChild(hint);
    }

    setupRenderer() {
      const T = this.T;
      this.renderer = new T.WebGLRenderer({canvas:this.canvas,antialias:!this.mobile,alpha:false,powerPreference:'high-performance'});
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1,this.mobile ? 1.25 : 1.65));
      this.renderer.setSize(innerWidth,innerHeight);
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.15;
    }

    setupScene() {
      const T = this.T;
      this.scene = new T.Scene();
      this.scene.background = new T.Color(0x090806);
      this.scene.fog = new T.Fog(0x090806,18,46);
      this.world = new T.Group();
      this.scene.add(this.world);
      this.camera = new T.PerspectiveCamera(46,innerWidth/innerHeight,.1,140);
      this.camera.position.set(0,2.1,25);
    }

    setupLibrary() {
      const T = this.T;
      const wood = new T.MeshStandardMaterial({color:0x211812,roughness:.54,metalness:.12});
      const woodDark = new T.MeshStandardMaterial({color:0x100c09,roughness:.7,metalness:.06});
      const brass = new T.MeshStandardMaterial({color:0x77705f,roughness:.3,metalness:.72});

      // Floor, back wall and ceiling establish a real enclosed room instead of a black canvas.
      const floor = new T.Mesh(new T.PlaneGeometry(52,70),woodDark);
      floor.rotation.x=-Math.PI/2; floor.position.set(0,-2.5,-8); this.world.add(floor);
      const back = new T.Mesh(new T.PlaneGeometry(48,28),woodDark);
      back.position.set(0,8,-25); this.world.add(back);
      const ceiling = new T.Mesh(new T.PlaneGeometry(52,70),woodDark);
      ceiling.rotation.x=Math.PI/2; ceiling.position.set(0,12,-8); this.world.add(ceiling);

      // Long architectural side columns and ceiling beams sell the library-room scale.
      for (let x of [-13,-9,-5,5,9,13]) {
        const col = new T.Mesh(new T.BoxGeometry(.35,15,.8),wood);
        col.position.set(x,4.5,-18); this.world.add(col);
      }
      for (let z of [-7,-13,-19,-25]) {
        const beam = new T.Mesh(new T.BoxGeometry(28,.28,.5),wood);
        beam.position.set(0,10,z); this.world.add(beam);
      }

      this.shelf = new T.Group();
      this.shelf.position.set(0,.6,-15);
      this.world.add(this.shelf);
      const shelfW=this.mobile?15:23;
      for(let row=0;row<7;row++){
        const plank=new T.Mesh(new T.BoxGeometry(shelfW,.28,1.05),wood);
        plank.position.y=-3+row*2.05; this.shelf.add(plank);
        // brass trim catches the warm light and makes the shelf readable.
        const trim=new T.Mesh(new T.BoxGeometry(shelfW+.03,.035,.06),brass);
        trim.position.set(0,plank.position.y+.16,.54); this.shelf.add(trim);
      }
      for(let x of [-shelfW/2,shelfW/2]){
        const post=new T.Mesh(new T.BoxGeometry(.42,14.8,1.15),wood);
        post.position.set(x,3,0); this.shelf.add(post);
      }

      this.addFillerBooks();
      this.addLighting();
      this.addAtmosphere();
    }

    addFillerBooks(){
      const T=this.T;
      const count=this.mobile?130:250;
      const geo=new T.BoxGeometry(.34,1.55,.72);
      const mat=new T.MeshStandardMaterial({color:0x51463b,roughness:.52,metalness:.2});
      const mesh=new T.InstancedMesh(geo,mat,count);
      const d=new T.Object3D();
      for(let i=0;i<count;i++){
        const row=i%7;
        const col=Math.floor(i/7);
        const perRow=Math.ceil(count/7);
        const x=-10.8+(col/(perRow-1))*21.6;
        const y=-2.05+row*2.05;
        d.position.set(x+(Math.random()-.5)*.12,y,-.02);
        d.rotation.z=(Math.random()-.5)*.055;
        d.scale.set(.75+Math.random()*.8,.72+Math.random()*.58,.78+Math.random()*.38);
        d.updateMatrix();mesh.setMatrixAt(i,d.matrix);
      }
      mesh.instanceMatrix.needsUpdate=true;this.shelf.add(mesh);
    }

    addLighting(){
      const T=this.T;
      this.scene.add(new T.HemisphereLight(0x8e8575,0x090705,.7));
      this.key=new T.PointLight(0xffd9a1,2.4,28,1.8);this.key.position.set(0,6,-9);this.world.add(this.key);
      const left=new T.PointLight(0xb8c8e8,1.15,24,2);left.position.set(-9,3,-6);this.world.add(left);
      const right=new T.PointLight(0xe9d5ad,1.0,24,2);right.position.set(9,4,-12);this.world.add(right);
      // Shelf lamps: repeated pools of warm light make the books visible row-by-row.
      for(let x of [-8,-4,0,4,8]){
        const lamp=new T.PointLight(0xffd8a0,.65,6,2);lamp.position.set(x,3.9,-14);this.world.add(lamp);
      }
    }

    addAtmosphere(){
      const T=this.T;
      const count=this.mobile?160:360;
      const pos=new Float32Array(count*3);
      for(let i=0;i<count;i++){
        pos[i*3]=(Math.random()-.5)*28;
        pos[i*3+1]=-2+Math.random()*13;
        pos[i*3+2]=2-Math.random()*32;
      }
      const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
      this.dust=new T.Points(g,new T.PointsMaterial({color:0xe5d6bd,size:this.mobile?.045:.055,transparent:true,opacity:.28,depthWrite:false}));
      this.world.add(this.dust);
    }

    setupBooks(){
      const T=this.T;
      const cfg=[
        {id:'profile',title:'PROFILE',color:0x20262c,position:new T.Vector3(-5.1,.83,.38),accent:0xdce2e7},
        {id:'projects',title:'PROJECTS',color:0x2b211a,position:new T.Vector3(-1.7,2.88,.38),accent:0xe4d1b0},
        {id:'contact',title:'CONTACT',color:0x1e2924,position:new T.Vector3(2.0,.83,.38),accent:0xc9ded3},
        {id:'ai-section',title:'AI ANIM',color:0x25212d,position:new T.Vector3(5.3,4.93,.38),accent:0xd8d2e7}
      ];
      cfg.forEach(c=>{const b=new CinematicBook(T,c);this.books.push(b);this.shelf.add(b.group);});
    }

    setupCamera(){
      const T=this.T;
      this.path=new T.CatmullRomCurve3([
        new T.Vector3(0,2.0,25),new T.Vector3(-2,2.2,18),new T.Vector3(2,2.1,10),
        new T.Vector3(-2,2.0,4.5),new T.Vector3(-5,2.1,1.8),new T.Vector3(-1.7,4.0,1.8),
        new T.Vector3(2.0,2.1,2.0),new T.Vector3(5.3,5.5,2.0),new T.Vector3(0,3.2,11)
      ]);
      this.targets=[
        new T.Vector3(0,1.8,-14),new T.Vector3(-5.1,1.3,-13.5),
        new T.Vector3(-1.7,3.35,-13.5),new T.Vector3(2,1.3,-13.5),new T.Vector3(5.3,5.4,-13.5)
      ];
    }

    setupScroll(){
      const update=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);this.targetP=clamp(scrollY/max)};
      addEventListener('scroll',update,{passive:true});update();
      if(window.ScrollTrigger){
        window.gsap?.registerPlugin(window.ScrollTrigger);
        this.trigger=window.ScrollTrigger.create({trigger:document.body,start:'top top',end:()=>document.documentElement.scrollHeight-innerHeight,scrub:true,onUpdate:s=>this.targetP=s.progress});
      }
    }

    setupResize(){
      addEventListener('resize',()=>{
        this.mobile=matchMedia('(max-width:700px)').matches;
        this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,this.mobile?1.25:1.65));this.renderer.setSize(innerWidth,innerHeight);
        window.ScrollTrigger?.refresh();
      },{passive:true});
    }

    bookFocus(i,local){
      const extract=remap(local,.03,.22);
      const open=remap(local,.22,.43);
      const hold=remap(local,.43,.68);
      const close=remap(local,.68,.82);
      const returnP=remap(local,.82,1);
      this.books[i].update({extract,open:Math.max(open,hold),settle:hold,returnP:Math.max(close,returnP)});
      return {extract,open,hold,close,returnP};
    }

    projectAnchor(book){
      if(!book.anchor.visible)return null;
      book.anchor.getWorldPosition(this.tmp2);
      this.tmp2.project(this.camera);
      return {x:(this.tmp2.x*.5+.5)*innerWidth,y:(-.5*this.tmp2.y+.5)*innerHeight};
    }

    updatePopup(active,local){
      const ids=['profile','projects','contact','ai-section'];
      ids.forEach((id,i)=>{
        const el=this.sections[id];if(!el)return;
        const is=i===active;
        let opacity=0,scale=.78,blur=13;
        if(is){
          const enter=smooth(remap(local,.34,.48));
          const exit=smooth(remap(local,.73,.86));
          opacity=enter*(1-exit);scale=.78+enter*.22;blur=13*(1-enter);
          const anchor=this.projectAnchor(this.books[i]);
          if(anchor){
            // Start from the actual open-page position, then grow into the center of the viewport.
            const dx=(innerWidth/2-anchor.x)*enter;
            const dy=(innerHeight/2-anchor.y)*enter;
            el.style.transform=`translate3d(calc(-50% + ${dx}px),calc(-50% + ${dy}px),0) scale(${scale})`;
          }else el.style.transform=`translate3d(-50%,-50%,0) scale(${scale})`;
          el.style.filter=`blur(${blur}px)`;
          el.style.pointerEvents=opacity>.65?'auto':'none';
        }else{
          el.style.opacity='0';el.style.filter='blur(13px)';el.style.pointerEvents='none';
          el.style.transform='translate3d(-50%,-50%,0) scale(.76)';
        }
        el.style.opacity=opacity;
      });
    }

    update(){
      this.p+=(this.targetP-this.p)*.075;
      const p=this.p;
      const scaled=p*4;
      const active=Math.min(3,Math.floor(scaled));
      const local=scaled-active;

      // Camera travels through the physical room and looks ahead toward the next book.
      const cp=this.path.getPointAt(clamp(p));
      this.camera.position.lerp(cp,.075);
      const targetIndex=Math.min(4,Math.floor(scaled+.55));
      this.tmp.lerp(this.targets[targetIndex],.09);
      this.camera.lookAt(this.tmp);

      for(let i=0;i<this.books.length;i++){
        const d=Math.abs(i-scaled);
        const bookLocal=clamp(1-d);
        this.bookFocus(i,bookLocal);
      }
      this.updatePopup(active,local);

      this.dust.rotation.y+=.00012;
      this.key.intensity=2.25+Math.sin(this.clock.elapsedTime*.45)*.18;
      this.camera.fov=46-(remap(local,.22,.58)*5);this.camera.updateProjectionMatrix();
    }

    render(){requestAnimationFrame(()=>this.render());this.update();this.renderer.render(this.scene,this.camera)}
  }

  window.initNarrativeWorld=()=>{if(!window.__animKnowledgeVault)new LibraryEngine().init()};
})();
