/* ANIM OS — INTERACTIVE 3D LIBRARY
 * Single source of truth for shelf geometry, books, camera and interaction.
 */
(() => {
  'use strict';
  const T=window.THREE,canvas=document.getElementById('story-canvas'),main=document.getElementById('main');
  if(!T||!canvas||!main||window.__animKnowledgeLibrary)return; window.__animKnowledgeLibrary=true;
  const mobile=matchMedia('(max-width:700px)').matches;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>v*v*(3-2*v),lerp=(a,b,t)=>a+(b-a)*t;

  /* One coordinate system for every shelf and every book. */
  const BAY_X=[-14,-7,0,7,14],BAY_WIDTH=6.8,SHELF_THICKNESS=.28,SHELF_DEPTH=1.35,SHELF_FRONT=.68,SHELF_BACK=-.675,SHELF_Y0=-4,ROW_GAP=2.45,ROWS=9;
  const shelfY=row=>SHELF_Y0+row*ROW_GAP;
  const shelfTop=row=>shelfY(row)+SHELF_THICKNESS/2;
  const bayLeft=bay=>BAY_X[bay]-BAY_WIDTH/2;
  const bookY=(row,h)=>shelfTop(row)+.08+h/2;
  const bookZ=depth=>SHELF_BACK+.08+depth/2;

  const configs=[
    {id:'profile',bay:1,row:6,color:0x197cff,rot:.015},
    {id:'projects',bay:2,row:4,color:0x19bd67,rot:-.025},
    {id:'contact',bay:2,row:1,color:0xff3040,rot:.02},
    {id:'ai-section',bay:3,row:5,color:0xffcf21,rot:-.018},
    {id:'future',bay:4,row:7,color:0x2588ff,rot:.028}
  ];

  const css=document.createElement('style');css.textContent=`
    html,body,#main{background:transparent!important}body:after{display:none!important}
    #story-canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;display:block!important;background:#090807!important;filter:none!important;pointer-events:auto!important}
    #main{position:relative!important;min-height:${mobile?'1150':'1000'}vh!important;background:transparent!important}
    #main .container{position:relative!important;height:${mobile?'1150':'1000'}vh!important;min-height:${mobile?'1150':'1000'}vh!important;max-width:none!important;margin:0!important;padding:0!important;z-index:4!important;pointer-events:none!important}
    #main .container>section.vault-ui{position:fixed!important;left:50%!important;top:50%!important;width:min(330px,40vw)!important;height:min(240px,43vh)!important;max-height:none!important;margin:0!important;overflow:auto!important;z-index:25!important;opacity:0;pointer-events:none;transform:translate(-50%,-50%) scale(.18);transform-origin:center!important;will-change:transform,opacity,filter!important;border-radius:18px!important}
    .vault-ui *{max-width:100%!important}.vault-ui .project-grid{gap:5px!important}.vault-ui .contact-card{padding:6px!important}.vault-ui .utility-row{gap:5px!important}
    .library-close{position:fixed;right:20px;top:20px;z-index:40;padding:9px 13px;border:1px solid rgba(255,255,255,.22);border-radius:999px;background:rgba(0,0,0,.38);color:#fff;backdrop-filter:blur(12px);display:none;font:700 10px Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;cursor:pointer}.library-close.is-visible{display:block}
    .vault-title{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:12;color:rgba(255,255,255,.58);font:700 9px/1 Arial,sans-serif;letter-spacing:.5em;white-space:nowrap;pointer-events:none;text-shadow:0 1px 10px #000}.vault-hint{position:fixed;right:18px;bottom:24px;z-index:12;color:rgba(255,255,255,.45);font:700 8px/1 Arial,sans-serif;letter-spacing:.25em;writing-mode:vertical-rl;pointer-events:none;text-shadow:0 1px 10px #000}
    @media(max-width:700px){#main .container>section.vault-ui{width:min(290px,74vw);height:min(210px,43vh)}.vault-title{top:13px;font-size:7px}.vault-hint{right:7px;font-size:7px}}
  `;document.head.appendChild(css);
  ['profile','projects','contact','ai-section'].forEach(id=>document.getElementById(id)?.classList.add('vault-ui'));
  const title=document.createElement('div');title.className='vault-title';title.textContent='ANIM OS  •  THE LIBRARY';document.body.appendChild(title);
  const hint=document.createElement('div');hint.className='vault-hint';hint.textContent='SCROLL';document.body.appendChild(hint);
  const closeButton=document.createElement('button');closeButton.className='library-close';closeButton.textContent='CLOSE BOOK';document.body.appendChild(closeButton);

  const renderer=new T.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.2:1.5));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  const scene=new T.Scene();scene.background=new T.Color(0x090807);scene.fog=new T.Fog(0x090807,26,68);
  const camera=new T.PerspectiveCamera(50,innerWidth/innerHeight,.1,100),world=new T.Group();scene.add(world);const library=new T.Group();library.position.z=-19;world.add(library);
  const wood=new T.MeshStandardMaterial({color:0x56351f,roughness:.66,metalness:.05}),darkWood=new T.MeshStandardMaterial({color:0x241711,roughness:.82}),shelfEdge=new T.MeshStandardMaterial({color:0xa16a3b,roughness:.46,metalness:.08}),brass=new T.MeshStandardMaterial({color:0x9a8155,roughness:.26,metalness:.62}),floorMat=new T.MeshStandardMaterial({color:0x17100c,roughness:.9});
  const back=new T.Mesh(new T.PlaneGeometry(58,38),darkWood);back.position.set(0,6,-1.2);library.add(back);const floor=new T.Mesh(new T.PlaneGeometry(58,55),floorMat);floor.rotation.x=-Math.PI/2;floor.position.set(0,-5,9);library.add(floor);const ceiling=new T.Mesh(new T.PlaneGeometry(58,55),darkWood);ceiling.rotation.x=Math.PI/2;ceiling.position.set(0,17,7);library.add(ceiling);const leftWall=new T.Mesh(new T.PlaneGeometry(55,30),darkWood);leftWall.rotation.y=Math.PI/2;leftWall.position.set(-29,6,6);library.add(leftWall);const rightWall=leftWall.clone();rightWall.rotation.y=-Math.PI/2;rightWall.position.x=29;library.add(rightWall);

  for(let bay=0;bay<BAY_X.length;bay++){const group=new T.Group();group.position.x=BAY_X[bay];library.add(group);for(const sx of [-3.25,3.25]){const post=new T.Mesh(new T.BoxGeometry(.34,23,1.15),wood);post.position.set(sx,6,-.05);group.add(post)}for(let row=0;row<ROWS;row++){const y=shelfY(row),plank=new T.Mesh(new T.BoxGeometry(BAY_WIDTH,SHELF_THICKNESS,SHELF_DEPTH),wood);plank.position.set(0,y,0);group.add(plank);const front=new T.Mesh(new T.BoxGeometry(BAY_WIDTH,.065,.14),shelfEdge);front.position.set(0,y+SHELF_THICKNESS/2+.0325,SHELF_FRONT);group.add(front);const glow=new T.PointLight(0xffc27b,.45,5,2);glow.position.set(0,y+.7,.15);group.add(glow)}const top=new T.Mesh(new T.BoxGeometry(7,.5,1.45),wood);top.position.set(0,17,0);group.add(top)}

  /* Reserve the exact space occupied by featured books so ordinary books can never overlap them. */
  const reserved={}; configs.forEach(c=>{reserved[`${c.bay}:${c.row}`]=true});
  let seed=7919;const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647};
  const positions=[];
  function packSegment(row,bay,start,end){let cursor=start;while(cursor<end-.45){const w=.46+rnd()*.34,h=1.42+rnd()*.48,depth=.70+rnd()*.16;if(cursor+w>end)break;positions.push({x:cursor+w/2,y:bookY(row,h),z:bookZ(depth),w,h,depth,rz:(rnd()-.5)*.045,ry:(rnd()-.5)*.028});cursor+=w+.055}}
  for(let row=0;row<ROWS;row++)for(let bay=0;bay<BAY_X.length;bay++){
    const left=bayLeft(bay)+.18,right=bayLeft(bay)+BAY_WIDTH-.18,key=`${bay}:${row}`;
    if(!reserved[key])packSegment(row,bay,left,right);
    else {const center=BAY_X[bay],reserve=.82;packSegment(row,bay,left,center-reserve);packSegment(row,bay,center+reserve,right)}
  }
  const palette=[0x30251e,0x1d4942,0x51282e,0x654523,0x2b3747,0x47442d,0x5b4940,0x263330];
  const perMesh=Math.ceil(positions.length/palette.length),meshes=palette.map(c=>new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial({color:c,roughness:.72,metalness:.04}),perMesh));
  const dummy=new T.Object3D();positions.forEach((p,i)=>{const m=meshes[i%meshes.length],n=Math.floor(i/meshes.length);dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(0,p.ry,p.rz);dummy.scale.set(p.w,p.h,p.depth);dummy.updateMatrix();m.setMatrixAt(n,dummy.matrix)});
  meshes.forEach(m=>{m.instanceMatrix.needsUpdate=true;m.userData.libraryBooks=true;library.add(m)});
  for(const x of BAY_X){const rail=new T.Mesh(new T.BoxGeometry(6.9,.06,.06),brass);rail.position.set(x,15.9,.72);library.add(rail)}

  scene.add(new T.HemisphereLight(0xffe7cc,0x151b24,.95));const warm=new T.PointLight(0xffb56a,3.8,30,1.55);warm.position.set(0,8,8);world.add(warm);const cool=new T.PointLight(0x668cff,1.55,28,1.8);cool.position.set(0,3,10);world.add(cool);const cameraLight=new T.PointLight(0xffe3bf,1.7,15,2);world.add(cameraLight);
  const dustN=mobile?70:160,dustPos=new Float32Array(dustN*3);for(let i=0;i<dustN;i++){dustPos[i*3]=(rnd()-.5)*45;dustPos[i*3+1]=-4+rnd()*20;dustPos[i*3+2]=-4-rnd()*32}const dustGeo=new T.BufferGeometry();dustGeo.setAttribute('position',new T.BufferAttribute(dustPos,3));world.add(new T.Points(dustGeo,new T.PointsMaterial({color:0xe4d5c2,size:.055,transparent:true,opacity:.25,depthWrite:false})));

  class HeroBook{constructor(cfg){this.id=cfg.id;this.cfg=cfg;this.closedScale=.38;this.bookW=3.35;this.bookH=5.15;this.bookD=.42;this.closedW=this.bookW*this.closedScale;this.closedH=this.bookH*this.closedScale;this.closedD=this.bookD*this.closedScale;this.base=new T.Vector3(BAY_X[cfg.bay],bookY(cfg.row,this.closedH),bookZ(this.closedD));this.group=new T.Group();this.group.position.copy(this.base);this.group.scale.setScalar(this.closedScale);this.group.rotation.y=cfg.rot;this.group.userData.heroBook=this;library.add(this.group);const cover=new T.MeshStandardMaterial({color:cfg.color,roughness:.23,metalness:.42,emissive:cfg.color,emissiveIntensity:.035}),pageMat=new T.MeshStandardMaterial({color:0xf1eadb,roughness:.8,side:T.DoubleSide}),pageInner=new T.MeshStandardMaterial({color:0xe6decd,roughness:.82,side:T.DoubleSide}),metal=new T.MeshStandardMaterial({color:0xc7cbd0,roughness:.18,metalness:.9});this.back=new T.Mesh(new T.BoxGeometry(this.bookW,this.bookH,.2),cover);this.back.userData.heroBook=this;this.group.add(this.back);this.pages=new T.Group();this.pages.position.z=.17;this.pages.userData.heroBook=this;this.group.add(this.pages);for(let i=0;i<26;i++){const p=new T.Mesh(new T.PlaneGeometry(3.12,4.86),i===13?pageInner:pageMat);p.userData.heroBook=this;p.position.z=.01+i*.005;this.pages.add(p)}this.frontPivot=new T.Group();this.frontPivot.position.set(-this.bookW/2,0,.31);this.frontPivot.userData.heroBook=this;this.group.add(this.frontPivot);this.front=new T.Mesh(new T.BoxGeometry(this.bookW,this.bookH,.2),cover);this.front.position.x=this.bookW/2;this.front.userData.heroBook=this;this.frontPivot.add(this.front);this.spine=new T.Mesh(new T.BoxGeometry(.18,this.bookH+.12,.3),metal);this.spine.position.set(-this.bookW/2+.02,0,.14);this.spine.userData.heroBook=this;this.group.add(this.spine);const stripe=new T.Mesh(new T.BoxGeometry(2.1,.055,.055),metal);stripe.position.set(this.bookW/2,-.72,.43);stripe.userData.heroBook=this;this.frontPivot.add(stripe);this.anchor=new T.Object3D();this.anchor.position.set(.78,0,.52);this.anchor.userData.heroBook=this;this.group.add(this.anchor);this.glow=new T.PointLight(cfg.color,0,9,2);this.glow.position.set(.4,0,.7);this.group.add(this.glow)}update(extract,open){const e=ease(clamp(extract)),o=ease(clamp(open));this.group.position.x=this.base.x+Math.sin(e*Math.PI)*.15;this.group.position.y=this.base.y+Math.sin(e*Math.PI)*.08;this.group.position.z=this.base.z+e*10;this.group.scale.setScalar(lerp(this.closedScale,1.42,e));this.group.rotation.y=lerp(this.cfg.rot,.03,e);this.group.rotation.x=-Math.sin(e*Math.PI)*.06;this.frontPivot.rotation.y=-o*2.92;this.pages.children.forEach((p,i)=>{const t=i/(this.pages.children.length-1);p.position.x=(t-.5)*o*.72;p.rotation.y=(t-.5)*o*.42;p.position.z=.02+i*.004+Math.sin(t*Math.PI)*o*.18});this.glow.intensity=o*2.8}reset(){this.group.position.copy(this.base);this.group.scale.setScalar(this.closedScale);this.group.rotation.set(0,this.cfg.rot,0);this.frontPivot.rotation.y=0;this.pages.children.forEach((p,i)=>{p.position.x=0;p.rotation.y=0;p.position.z=.02+i*.005});this.glow.intensity=0}}
  const heroes=configs.map(c=>new HeroBook(c));
  const cameraPath=new T.CatmullRomCurve3([new T.Vector3(0,3.2,22),new T.Vector3(-4,4.5,14),new T.Vector3(-6.2,9,8),new T.Vector3(0,6,8),new T.Vector3(6.2,1,8),new T.Vector3(8,7.2,8),new T.Vector3(11,10.2,9),new T.Vector3(0,4,20)],false,'catmullrom',.35);
  const lookPath=new T.CatmullRomCurve3([new T.Vector3(0,5,-19),new T.Vector3(-7,10,-19),new T.Vector3(0,6,-19),new T.Vector3(7,2,-19),new T.Vector3(7,9,-19),new T.Vector3(14,11,-19),new T.Vector3(0,4,-19)],false,'catmullrom',.35);
  let targetScroll=0,progress=0;function readScroll(){const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);targetScroll=clamp(scrollY/max)}addEventListener('scroll',readScroll,{passive:true});readScroll();
  let selected=null,extract=0,open=0,opening=false,closing=false,previousOverflow='';const raycaster=new T.Raycaster(),pointer=new T.Vector2();
  function hidePopups(){['profile','projects','contact','ai-section'].forEach(id=>{const e=document.getElementById(id);if(e){e.style.opacity=0;e.style.pointerEvents='none';e.style.filter='none'}})}
  function showPanel(id){const e=document.getElementById(id);if(!e)return;e.style.left='50%';e.style.top='50%';e.style.opacity=1;e.style.pointerEvents='auto';e.style.transform='translate(-50%,-50%) scale(1)';e.style.filter='none'}
  function openBook(book){if(selected||opening)return;selected=book;opening=true;previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';closeButton.classList.add('is-visible');hidePopups();const start=performance.now(),duration=1050;const tick=now=>{const t=clamp((now-start)/duration);extract=ease(t);book.update(extract,0);if(t<1)requestAnimationFrame(tick);else{const s=performance.now(),d=850;const otick=n=>{const q=clamp((n-s)/d);open=ease(q);book.update(1,open);if(q<1)requestAnimationFrame(otick);else{opening=false;showPanel(book.id)}};requestAnimationFrame(otick)}};requestAnimationFrame(tick)}
  function closeBook(){if(!selected||closing)return;closing=true;hidePopups();const book=selected,s=performance.now(),d=750;const tick=now=>{const t=clamp((now-s)/d);open=1-ease(t);book.update(1,open);if(t<1)requestAnimationFrame(tick);else{const a=performance.now(),b=700;const backTick=n=>{const q=clamp((n-a)/b);extract=1-ease(q);book.update(extract,0);if(q<1)requestAnimationFrame(backTick);else{book.reset();selected=null;closing=false;open=0;extract=0;closeButton.classList.remove('is-visible');document.body.style.overflow=previousOverflow}};requestAnimationFrame(backTick)}};requestAnimationFrame(tick)}
  closeButton.addEventListener('click',closeBook);addEventListener('keydown',e=>{if(e.key==='Escape')closeBook()});
  canvas.addEventListener('pointerdown',e=>{if(selected||opening||closing)return;const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(heroes.map(h=>h.group),true);for(const hit of hits){const hero=hit.object.userData.heroBook;if(hero){openBook(hero);break}}});
  function renderPanel(){if(!selected)return;const e=document.getElementById(selected.id);if(!e)return;const v=selected.anchor.getWorldPosition(new T.Vector3()).project(camera);e.style.left=`${(v.x*.5+.5)*innerWidth}px`;e.style.top=`${(-v.y*.5+.5)*innerHeight}px`}
  function frame(){requestAnimationFrame(frame);if(!selected){progress=lerp(progress,targetScroll,.075);const cp=cameraPath.getPointAt(progress),look=lookPath.getPointAt(progress);camera.position.lerp(cp,.09);camera.lookAt(look);cameraLight.position.lerp(new T.Vector3(camera.position.x,camera.position.y+1,camera.position.z+2),.08)}else if(!opening&&!closing){selected.update(extract,open);renderPanel()}renderer.render(scene,camera)}
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.2:1.5))});
  hidePopups();camera.position.set(0,3.2,22);camera.lookAt(0,5,-19);requestAnimationFrame(frame);
})();