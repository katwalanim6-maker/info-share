/* ANIM OS — INTERACTIVE 3D LIBRARY
 * One renderer, one physical shelf model, one interaction state machine.
 */
(() => {
  'use strict';
  const T = window.THREE;
  const canvas = document.getElementById('story-canvas');
  const main = document.getElementById('main');
  if (!T || !canvas || !main || window.__animKnowledgeLibrary) return;
  window.__animKnowledgeLibrary = true;

  const mobile = matchMedia('(max-width:700px)').matches;
  const clamp = (v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth = v=>v*v*(3-2*v);
  const lerp = (a,b,t)=>a+(b-a)*t;

  /* ---------------- PHYSICAL LIBRARY MODEL ---------------- */
  const LIB = Object.freeze({
    bays: [-14,-7,0,7,14],
    bayWidth: 6.8,
    rows: 9,
    shelf: {
      firstY:-4,
      rowStep:2.45,
      thickness:.28,
      depth:1.35,
      backZ:-.675,
      frontZ:.675,
      lipDepth:.14,
      lipHeight:.075,
      bookGap:.035,
      sideClearance:.22,
      bookBackGap:.055
    },
    normal:{minW:.46,maxW:.80,minH:1.42,maxH:1.90,minD:.70,maxD:.86},
    hero:{width:3.35,height:5.15,depth:.42,scale:.38}
  });
  const shelfY = row => LIB.shelf.firstY + row*LIB.shelf.rowStep;
  const shelfTop = row => shelfY(row)+LIB.shelf.thickness/2;
  const bayLeft = bay => LIB.bays[bay]-LIB.bayWidth/2+LIB.shelf.sideClearance;
  const bayRight = bay => LIB.bays[bay]+LIB.bayWidth/2-LIB.shelf.sideClearance;

  /* The hero books are deliberately assigned to physical shelf bays/rows.
     #1 and #4 use the inner bays so they are not pushed to the outer edges. */
  const HERO_CONFIG = Object.freeze([
    {id:'profile',    bay:1,row:6,color:0x197cff,tilt:.012},
    {id:'projects',   bay:2,row:4,color:0x19bd67,tilt:-.018},
    {id:'contact',    bay:2,row:1,color:0xff3040,tilt:.014},
    {id:'ai-section', bay:3,row:5,color:0xffcf21,tilt:-.014},
    {id:'future',     bay:3,row:7,color:0x2588ff,tilt:.018}
  ]);
  const reserved = new Set(HERO_CONFIG.map(h=>`${h.bay}:${h.row}`));

  /* ---------------- UI LAYER ---------------- */
  const uiStyle = document.createElement('style');
  uiStyle.textContent = `
    html,body,#main{background:transparent!important}
    body:after{display:none!important}
    #story-canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:1!important;display:block!important;background:#17110d!important;filter:none!important;touch-action:none;cursor:default}
    #main{position:relative!important;min-height:${mobile?1150:1000}vh!important;background:transparent!important}
    #main .container{position:relative!important;min-height:${mobile?1150:1000}vh!important;height:${mobile?1150:1000}vh!important;max-width:none!important;margin:0!important;padding:0!important;z-index:4!important;pointer-events:none!important}
    #main .container>section.library-panel{position:fixed!important;left:50%!important;top:50%!important;width:min(520px,76vw)!important;height:min(560px,74vh)!important;margin:0!important;overflow:auto!important;z-index:25!important;opacity:0;visibility:hidden;pointer-events:none;transform:translate(-50%,-50%) scale(.72);transform-origin:center!important;will-change:transform,opacity!important;border-radius:20px!important}
    .library-panel.library-panel-open{visibility:visible!important;pointer-events:auto!important}
    .library-close{position:fixed;right:20px;top:20px;z-index:40;padding:10px 15px;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(10,8,6,.62);color:#fff;backdrop-filter:blur(14px);display:none;font:700 10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}
    .library-close.is-visible{display:block}
    .library-title{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:12;color:rgba(255,255,255,.72);font:700 9px/1 Arial,sans-serif;letter-spacing:.5em;white-space:nowrap;pointer-events:none;text-shadow:0 2px 14px #000}
    .library-hint{position:fixed;right:18px;bottom:24px;z-index:12;color:rgba(255,255,255,.62);font:700 8px/1 Arial,sans-serif;letter-spacing:.25em;writing-mode:vertical-rl;pointer-events:none;text-shadow:0 2px 14px #000}
    @media(max-width:700px){#main .container>section.library-panel{width:min(350px,84vw);height:min(510px,72vh)}.library-title{top:13px;font-size:7px}.library-hint{right:7px;font-size:7px}}
  `;
  document.head.appendChild(uiStyle);
  ['profile','projects','contact','ai-section','future'].forEach(id=>document.getElementById(id)?.classList.add('library-panel'));

  const title=document.createElement('div');
  title.className='library-title';
  title.textContent='ANIM OS  •  THE LIBRARY';
  document.body.appendChild(title);
  const hint=document.createElement('div');
  hint.className='library-hint';
  hint.textContent='SCROLL • CLICK A BOOK';
  document.body.appendChild(hint);
  const closeButton=document.createElement('button');
  closeButton.type='button';
  closeButton.className='library-close';
  closeButton.textContent='CLOSE BOOK';
  document.body.appendChild(closeButton);

  /* ---------------- THREE ---------------- */
  const renderer=new T.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.25:1.6));
  renderer.setSize(innerWidth,innerHeight,false);
  renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=mobile?1.18:1.14;

  const scene=new T.Scene();
  scene.background=new T.Color(0x17110d);
  scene.fog=new T.Fog(0x17110d,34,78);
  const camera=new T.PerspectiveCamera(47,innerWidth/innerHeight,.1,100);
  const world=new T.Group();
  scene.add(world);
  const library=new T.Group();
  world.add(library);

  const wood=new T.MeshStandardMaterial({color:0x6d4529,roughness:.66,metalness:.035});
  const darkWood=new T.MeshStandardMaterial({color:0x38251b,roughness:.84});
  const edgeWood=new T.MeshStandardMaterial({color:0xb57a47,roughness:.45,metalness:.08});
  const floorMat=new T.MeshStandardMaterial({color:0x2a1a11,roughness:.9});

  const back=new T.Mesh(new T.PlaneGeometry(60,40),darkWood);
  back.position.set(0,6,-1.25); library.add(back);
  const floor=new T.Mesh(new T.PlaneGeometry(60,55),floorMat);
  floor.rotation.x=-Math.PI/2; floor.position.set(0,-5,9); library.add(floor);
  const ceiling=new T.Mesh(new T.PlaneGeometry(60,55),darkWood);
  ceiling.rotation.x=Math.PI/2; ceiling.position.set(0,17,9); library.add(ceiling);

  for(let bay=0;bay<LIB.bays.length;bay++){
    const g=new T.Group(); g.position.x=LIB.bays[bay]; library.add(g);
    for(const x of [-3.25,3.25]){
      const post=new T.Mesh(new T.BoxGeometry(.34,23,1.15),wood);
      post.position.set(x,6,-.04); g.add(post);
    }
    for(let row=0;row<LIB.rows;row++){
      const y=shelfY(row);
      const plank=new T.Mesh(new T.BoxGeometry(LIB.bayWidth,LIB.shelf.thickness,LIB.shelf.depth),wood);
      plank.position.set(0,y,0); g.add(plank);
      const lip=new T.Mesh(new T.BoxGeometry(LIB.bayWidth,LIB.shelf.lipHeight,LIB.shelf.lipDepth),edgeWood);
      lip.position.set(0,shelfTop(row)+LIB.shelf.lipHeight/2,LIB.shelf.frontZ-LIB.shelf.lipDepth/2); g.add(lip);
      const light=new T.PointLight(0xffc27b,.42,5,2); light.position.set(0,y+.72,.38); g.add(light);
    }
    const cap=new T.Mesh(new T.BoxGeometry(7,.5,1.45),wood); cap.position.set(0,17,0); g.add(cap);
  }

  /* ---------------- DETERMINISTIC NORMAL BOOKS ---------------- */
  let seed=917321;
  const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  const normalBooks=[];
  const frontBookPlane=LIB.shelf.frontZ-LIB.shelf.lipDepth-LIB.shelf.bookBackGap;

  function addPackedRow(bay,row,left,right){
    let x=left;
    while(x+LIB.normal.minW<=right){
      const w=lerp(LIB.normal.minW,LIB.normal.maxW,rnd());
      if(x+w>right) break;
      const h=lerp(LIB.normal.minH,LIB.normal.maxH,rnd());
      const d=lerp(LIB.normal.minD,LIB.normal.maxD,rnd());
      const bottom=shelfTop(row)+LIB.shelf.bookGap;
      const y=bottom+h/2;
      const z=frontBookPlane-d/2;
      normalBooks.push({x:x+w/2,y,z,w,h,d,ry:(rnd()-.5)*.018,rz:(rnd()-.5)*.035});
      x+=w+.055;
    }
  }
  for(let row=0;row<LIB.rows;row++) for(let bay=0;bay<LIB.bays.length;bay++){
    const left=bayLeft(bay),right=bayRight(bay),key=`${bay}:${row}`;
    if(!reserved.has(key)) addPackedRow(bay,row,left,right);
    else{
      const c=LIB.bays[bay],reserve=1.25;
      addPackedRow(bay,row,left,c-reserve);
      addPackedRow(bay,row,c+reserve,right);
    }
  }

  const palette=[0x30251e,0x27483e,0x51282e,0x654523,0x2b3747,0x47442d,0x5b4940,0x263330];
  const dummy=new T.Object3D();
  const perMesh=Math.max(1,Math.ceil(normalBooks.length/palette.length));
  const instanced=[];
  for(let m=0;m<palette.length;m++){
    const mesh=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:palette[m],roughness:.72,metalness:.03}),perMesh);
    let count=0;
    for(let i=m;i<normalBooks.length;i+=palette.length){
      const p=normalBooks[i]; dummy.position.set(p.x,p.y,p.z); dummy.rotation.set(0,p.ry,p.rz); dummy.scale.set(p.w,p.h,p.d); dummy.updateMatrix(); mesh.setMatrixAt(count++,dummy.matrix);
    }
    mesh.count=count; mesh.instanceMatrix.needsUpdate=true; library.add(mesh); instanced.push(mesh);
  }

  /* ---------------- HERO BOOK ---------------- */
  class HeroBook{
    constructor(cfg){
      this.id=cfg.id; this.cfg=cfg;
      this.closedScale=LIB.hero.scale;
      this.closedH=LIB.hero.height*this.closedScale;
      this.closedD=LIB.hero.depth*this.closedScale;
      const bottom=shelfTop(cfg.row)+LIB.shelf.bookGap;
      // Position by the FRONT of the book, not by its centre. This leaves the lip visible while keeping the book readable.
      const front=LIB.shelf.frontZ-LIB.shelf.lipDepth-.055;
      const z=front-this.closedD/2;
      this.base=new T.Vector3(LIB.bays[cfg.bay],bottom+this.closedH/2,z);
      this.group=new T.Group();
      this.group.position.copy(this.base); this.group.scale.setScalar(this.closedScale); this.group.rotation.y=cfg.tilt;
      this.group.userData.heroBook=this; library.add(this.group);

      const cover=new T.MeshStandardMaterial({color:cfg.color,roughness:.25,metalness:.34,emissive:cfg.color,emissiveIntensity:.025});
      const page=new T.MeshStandardMaterial({color:0xf0e7d5,roughness:.82,side:T.DoubleSide});
      const metal=new T.MeshStandardMaterial({color:0xc7cbd0,roughness:.2,metalness:.9});
      this.back=new T.Mesh(new T.BoxGeometry(LIB.hero.width,LIB.hero.height,.2),cover); this.back.userData.heroBook=this; this.group.add(this.back);
      this.pages=new T.Group(); this.pages.position.z=.17; this.group.add(this.pages);
      for(let i=0;i<20;i++){const p=new T.Mesh(new T.PlaneGeometry(3.12,4.86),page);p.userData.heroBook=this;p.position.z=.012+i*.004;this.pages.add(p);}
      this.frontPivot=new T.Group(); this.frontPivot.position.set(-LIB.hero.width/2,0,.31); this.group.add(this.frontPivot);
      this.front=new T.Mesh(new T.BoxGeometry(LIB.hero.width,LIB.hero.height,.2),cover); this.front.position.x=LIB.hero.width/2; this.front.userData.heroBook=this; this.frontPivot.add(this.front);
      this.spine=new T.Mesh(new T.BoxGeometry(.18,LIB.hero.height+.12,.3),metal); this.spine.position.set(-LIB.hero.width/2+.02,0,.14); this.spine.userData.heroBook=this; this.group.add(this.spine);
      this.glow=new T.PointLight(cfg.color,0,10,2); this.glow.position.set(.4,0,.8); this.group.add(this.glow);
      this.hit=new T.Mesh(new T.BoxGeometry(LIB.hero.width+1,LIB.hero.height+1,.9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
      this.hit.userData.heroBook=this; this.group.add(this.hit);
    }
    update(extract,opening){
      const e=smooth(clamp(extract)),o=smooth(clamp(opening));
      this.group.position.x=lerp(this.base.x,0,e);
      this.group.position.y=lerp(this.base.y,0.15,e);
      this.group.position.z=lerp(this.base.z,10.2,e);
      this.group.scale.setScalar(lerp(this.closedScale,1.35,e));
      this.group.rotation.x=lerp(0,-.045,e); this.group.rotation.y=lerp(this.cfg.tilt,0,e);
      this.frontPivot.rotation.y=-o*2.94;
      this.pages.children.forEach((p,i)=>{const t=i/(this.pages.children.length-1);p.position.x=(t-.5)*o*.72;p.rotation.y=(t-.5)*o*.42;p.position.z=.018+i*.004+Math.sin(t*Math.PI)*o*.18;});
      this.glow.intensity=o*3;
    }
    reset(){
      this.group.position.copy(this.base);this.group.scale.setScalar(this.closedScale);this.group.rotation.set(0,this.cfg.tilt,0);this.frontPivot.rotation.y=0;
      this.pages.children.forEach((p,i)=>{p.position.x=0;p.rotation.y=0;p.position.z=.012+i*.004;});this.glow.intensity=0;
    }
  }
  const heroes=HERO_CONFIG.map(c=>new HeroBook(c));

  /* ---------------- LIGHTING / ATMOSPHERE ---------------- */
  scene.add(new T.HemisphereLight(0xffead7,0x18202a,1.12));
  const key=new T.PointLight(0xffb66b,4.5,38,1.55); key.position.set(0,8,10); world.add(key);
  const fill=new T.PointLight(0x718cff,1.35,34,1.8); fill.position.set(0,4,8); world.add(fill);
  const cameraLight=new T.PointLight(0xffe4c6,1.6,18,2); world.add(cameraLight);
  const dustN=mobile?55:120; const dg=new T.BufferGeometry(); const dp=new Float32Array(dustN*3);
  for(let i=0;i<dustN;i++){dp[i*3]=(rnd()-.5)*48;dp[i*3+1]=-4+rnd()*20;dp[i*3+2]=-2-rnd()*28;}
  dg.setAttribute('position',new T.BufferAttribute(dp,3));world.add(new T.Points(dg,new T.PointsMaterial({color:0xe5d7c4,size:.055,transparent:true,opacity:.16,depthWrite:false})));

  /* ---------------- INTERACTION STATE ---------------- */
  let scrollTarget=0,scrollProgress=0,selected=null,extract=0,opening=0,previousOverflow='';
  const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  const panelIds=['profile','projects','contact','ai-section','future'];

  function hidePanels(){
    panelIds.forEach(id=>{const el=document.getElementById(id);if(!el)return;el.classList.remove('library-panel-open');el.style.opacity='0';el.style.pointerEvents='none';el.style.visibility='hidden';el.style.transform='translate(-50%,-50%) scale(.72)';});
  }
  function revealPanel(id){
    const el=document.getElementById(id); if(!el)return;
    el.classList.add('library-panel-open');el.style.opacity='1';el.style.visibility='visible';el.style.pointerEvents='auto';el.style.transform='translate(-50%,-50%) scale(1)';
  }
  function openHero(hero){
    if(selected)return;
    selected=hero;extract=0;opening=0;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
    closeButton.classList.add('is-visible');hint.style.opacity='.15';canvas.style.cursor='default';
    hidePanels();
  }
  function closeHero(){
    if(!selected)return;
    const hero=selected;hidePanels();closeButton.classList.remove('is-visible');document.body.style.overflow=previousOverflow;selected=null;extract=0;opening=0;hero.reset();hint.style.opacity='1';
  }
  closeButton.addEventListener('click',closeHero);
  addEventListener('keydown',e=>{if(e.key==='Escape')closeHero();});

  function readScroll(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);scrollTarget=clamp(scrollY/max);}
  addEventListener('scroll',readScroll,{passive:true});readScroll();
  function pointerFromEvent(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;}
  canvas.addEventListener('pointermove',e=>{
    if(selected)return;
    pointerFromEvent(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(heroes.map(h=>h.hit),false)[0];canvas.style.cursor=hit?'pointer':'default';
  },{passive:true});
  canvas.addEventListener('pointerup',e=>{
    if(selected)return;
    pointerFromEvent(e);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(heroes.map(h=>h.hit),false)[0];
    if(hit?.object?.userData?.heroBook)openHero(hit.object.userData.heroBook);
  });

  /* ---------------- CAMERA ---------------- */
  const cameraPos=new T.Vector3(),cameraLook=new T.Vector3();
  function updateCamera(){
    if(selected){
      // During extraction the camera remains stable enough to show the entire flight.
      const e=smooth(clamp(extract));
      const tx=lerp(selected.base.x,0,e),ty=lerp(selected.base.y,0.15,e),tz=lerp(selected.base.z,10.2,e);
      cameraPos.set(tx,ty+.15,tz+7.6);camera.position.lerp(cameraPos,.13);cameraLook.set(tx,ty,tz);camera.lookAt(cameraLook);cameraLight.position.copy(camera.position);cameraLight.position.z-=1;return;
    }
    const scaled=scrollProgress*(heroes.length-1);let i=Math.floor(scaled);i=clamp(i,0,heroes.length-2);const t=smooth(scaled-i);const a=heroes[i],b=heroes[i+1];
    const x=lerp(a.base.x,b.base.x,t),y=lerp(a.base.y,b.base.y,t);
    cameraPos.set(x*.48,y+2.05,15.8);camera.position.lerp(cameraPos,.08);cameraLook.set(x,y+.15,0);camera.lookAt(cameraLook);cameraLight.position.copy(camera.position);cameraLight.position.z-=1;
  }

  /* ---------------- LOOP ---------------- */
  function tick(){
    requestAnimationFrame(tick);scrollProgress=lerp(scrollProgress,scrollTarget,.075);
    heroes.forEach(h=>{
      if(h===selected){extract=lerp(extract,1,.055);opening=lerp(opening,1,.045);h.update(extract,opening);
        // Only reveal the HTML after the book has reached the foreground and begun opening.
        if(extract>.72 && opening>.48) revealPanel(h.id);
      } else h.update(0,0);
    });
    updateCamera();renderer.render(scene,camera);
  }
  addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});
  hidePanels();
  tick();
})();