/* ANIM OS — KNOWLEDGE VAULT
 * Black cinematic library. Scroll drives: book flies out -> opens wide -> DOM panel emerges -> closes -> returns.
 */
(() => {
  'use strict';
  const T = window.THREE;
  const canvas = document.getElementById('story-canvas');
  const main = document.getElementById('main');
  if (!T || !canvas || !main || window.__animKnowledgeVault) return;
  window.__animKnowledgeVault = true;

  const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
  const ease = v => v < .5 ? 4*v*v*v : 1-Math.pow(-2*v+2,3)/2;
  const range = (v,a,b) => ease(clamp((v-a)/(b-a)));

  const style = document.createElement('style');
  style.textContent = `
    html,body,#main{background:#000!important}
    #story-canvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:0!important;background:#000!important}
    #main{min-height:720vh!important;background:transparent!important}
    #main .container{position:relative!important;height:720vh!important;z-index:3!important;pointer-events:none!important;padding:0!important;margin:0!important;max-width:none!important}
    #main .container>section.vault-ui{position:fixed!important;left:50%!important;top:50%!important;width:min(760px,calc(100vw - 24px))!important;max-height:76vh!important;overflow:auto!important;z-index:20!important;opacity:0!important;pointer-events:none!important;transform:translate(-50%,-50%) scale(.35)!important;transform-origin:center!important;will-change:transform,opacity,filter!important}
    #main .container>footer{position:fixed!important;left:50%;bottom:14px;transform:translateX(-50%);z-index:8;pointer-events:none}
    .vault-title{position:fixed;top:22px;left:50%;transform:translateX(-50%);z-index:8;color:rgba(255,255,255,.42);font:600 9px/1 Arial,sans-serif;letter-spacing:.45em;white-space:nowrap;pointer-events:none}
    .vault-hint{position:fixed;right:20px;bottom:26px;z-index:8;color:rgba(255,255,255,.28);font:600 8px/1 Arial,sans-serif;letter-spacing:.28em;writing-mode:vertical-rl;pointer-events:none}
    @media(max-width:700px){#main,.#main .container{min-height:900vh!important;height:900vh!important}.vault-title{font-size:7px;top:15px}.vault-hint{right:8px}}
  `;
  document.head.appendChild(style);
  ['profile','projects','contact','ai-section'].forEach(id=>{const e=document.getElementById(id);if(e)e.classList.add('vault-ui')});
  const title=document.createElement('div');title.className='vault-title';title.textContent='ANIM OS  •  KNOWLEDGE VAULT';document.body.appendChild(title);
  const hint=document.createElement('div');hint.className='vault-hint';hint.textContent='SCROLL TO EXPLORE';document.body.appendChild(hint);

  const mobile = matchMedia('(max-width:700px)').matches;
  const renderer = new T.WebGLRenderer({canvas,antialias:!mobile,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,mobile?1.2:1.6));
  renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=T.SRGBColorSpace;
  renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.08;

  const scene=new T.Scene(); scene.background=new T.Color(0x000000); scene.fog=new T.Fog(0x000000,18,44);
  const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,120);
  const world=new T.Group();scene.add(world);
  const shelf=new T.Group();shelf.position.set(0,0,-15);world.add(shelf);

  const wood=new T.MeshStandardMaterial({color:0x101318,roughness:.62,metalness:.18});
  const shelfEdge=new T.MeshStandardMaterial({color:0x4c5560,roughness:.28,metalness:.7});
  const black=new T.MeshStandardMaterial({color:0x020304,roughness:.9,metalness:.05});

  // Nearly black room: the shelves and book edges are visible only through controlled light.
  const floor=new T.Mesh(new T.PlaneGeometry(48,64),black);floor.rotation.x=-Math.PI/2;floor.position.set(0,-3,-8);world.add(floor);
  const wall=new T.Mesh(new T.PlaneGeometry(48,28),black);wall.position.set(0,6,-25);world.add(wall);
  for(const x of [-13,13]){const p=new T.Mesh(new T.BoxGeometry(.45,16,1),wood);p.position.set(x,4,-15);shelf.add(p)}
  for(let r=0;r<7;r++){
    const y=-2.5+r*2.05;
    const plank=new T.Mesh(new T.BoxGeometry(26,.25,1.15),wood);plank.position.set(0,y,0);shelf.add(plank);
    const edge=new T.Mesh(new T.BoxGeometry(26,.045,.08),shelfEdge);edge.position.set(0,y+.16,.57);shelf.add(edge);
  }

  // Filler books: muted so the five hero colors dominate.
  const fillerGeo=new T.BoxGeometry(.32,1.55,.72);
  const fillerMat=new T.MeshStandardMaterial({color:0x20252b,roughness:.65,metalness:.2});
  const filler=new T.InstancedMesh(fillerGeo,fillerMat,mobile?130:250);const dummy=new T.Object3D();
  for(let i=0;i<(mobile?130:250);i++){
    const row=i%7, col=Math.floor(i/7), cols=Math.ceil((mobile?130:250)/7);
    dummy.position.set(-10.8+(col/(cols-1))*21.6+(Math.random()-.5)*.12,-1.7+row*2.05,.02);
    dummy.rotation.z=(Math.random()-.5)*.045;dummy.scale.set(.7+Math.random()*.7,.7+Math.random()*.55,.8+Math.random()*.3);dummy.updateMatrix();filler.setMatrixAt(i,dummy.matrix);
  }
  filler.instanceMatrix.needsUpdate=true;shelf.add(filler);

  // Lighting is deliberately tight: black room, bright colored books.
  scene.add(new T.HemisphereLight(0x536070,0x000000,.42));
  const key=new T.PointLight(0xffffff,2.2,30,1.8);key.position.set(0,4,-8);world.add(key);
  const rim=new T.PointLight(0x6c8cff,1.4,22,2);rim.position.set(-9,2,-10);world.add(rim);
  const dustCount=mobile?100:240;const dustPos=new Float32Array(dustCount*3);
  for(let i=0;i<dustCount;i++){dustPos[i*3]=(Math.random()-.5)*28;dustPos[i*3+1]=-2+Math.random()*12;dustPos[i*3+2]=1-Math.random()*30}
  const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dustPos,3));world.add(new T.Points(dg,new T.PointsMaterial({color:0x9aa6b5,size:.045,transparent:true,opacity:.25,depthWrite:false})));

  class HeroBook{
    constructor(cfg){
      this.base=cfg.pos.clone();this.group=new T.Group();this.group.position.copy(this.base);this.group.rotation.y=0;shelf.add(this.group);
      const cover=new T.MeshStandardMaterial({color:cfg.color,roughness:.24,metalness:.48,emissive:cfg.color,emissiveIntensity:.08});
      const paper=new T.MeshStandardMaterial({color:0xf2eee4,roughness:.72,side:T.DoubleSide});
      const silver=new T.MeshStandardMaterial({color:0xbcc6d0,roughness:.18,metalness:.9});
      this.back=new T.Mesh(new T.BoxGeometry(2.0,3,.16),cover);this.group.add(this.back);
      this.pages=new T.Group();this.pages.position.z=.16;this.group.add(this.pages);
      for(let i=0;i<15;i++){const p=new T.Mesh(new T.PlaneGeometry(1.84,2.78),paper);p.position.z=i*.007;p.rotation.y=(i-7)*.002;this.pages.add(p)}
      // Front cover hinges visibly around the spine.
      this.frontPivot=new T.Group();this.frontPivot.position.set(-1,0,.28);this.group.add(this.frontPivot);
      this.front=new T.Mesh(new T.BoxGeometry(2,3,.16),cover);this.front.position.x=1;this.frontPivot.add(this.front);
      this.spine=new T.Mesh(new T.BoxGeometry(.16,3.08,.28),silver);this.spine.position.set(-.93,0,.12);this.group.add(this.spine);
      const band=new T.Mesh(new T.BoxGeometry(1.1,.055,.04),silver);band.position.set(1,-.28,.37);this.frontPivot.add(band);
      this.anchor=new T.Object3D();this.anchor.position.set(.05,.12,.55);this.group.add(this.anchor);
      this.glow=new T.PointLight(cfg.color,0,7,2);this.glow.position.set(0,0,1);this.group.add(this.glow);
    }
    update(extract,open,returning){
      const e=ease(extract),o=ease(open),r=ease(returning);
      // Fly out toward viewer, then back exactly to the shelf.
      this.group.position.x=this.base.x+Math.sin(e*Math.PI)*.28;
      this.group.position.y=this.base.y+Math.sin(e*Math.PI)*.18;
      this.group.position.z=this.base.z+e*(1-r)*7.2;
      this.group.scale.setScalar(1+e*.32*(1-r));
      this.group.rotation.y=e*.10;
      this.group.rotation.x=Math.sin(e*Math.PI)*-.06;
      // VERY visible opening: cover goes past 140 degrees and pages fan apart.
      this.frontPivot.rotation.y=-o*2.55;
      this.pages.children.forEach((p,i)=>{const t=i/(this.pages.children.length-1);p.position.x=(t-.5)*o*.34;p.rotation.y=(t-.5)*o*.22;p.position.z=.01+i*.006+Math.sin(t*Math.PI)*o*.13});
      this.anchor.visible=o>.06;this.glow.intensity=o*1.8;
    }
  }

  // Exact requested hero palette: BLUE, GREEN, RED, YELLOW, BLUE.
  const configs=[
    {id:'profile',pos:new T.Vector3(-6.8,-1.55,.4),color:0x1687ff},
    {id:'projects',pos:new T.Vector3(-3.4,.5,.4),color:0x20c878},
    {id:'contact',pos:new T.Vector3(0,-1.55,.4),color:0xff3038},
    {id:'ai-section',pos:new T.Vector3(3.4,.5,.4),color:0xffd21c},
    {id:'future',pos:new T.Vector3(6.8,-1.55,.4),color:0x1687ff}
  ];
  const books=configs.map(c=>new HeroBook(c));

  // Camera physically moves through the black library.
  const cameraPath=new T.CatmullRomCurve3([
    new T.Vector3(0,2.1,25),new T.Vector3(-2,2.0,17),new T.Vector3(2,1.8,9),
    new T.Vector3(-2,1.7,3.5),new T.Vector3(-6,1.5,1.0),new T.Vector3(-2,.7,1.0),
    new T.Vector3(2,1.5,1.0),new T.Vector3(6,2.2,1.0),new T.Vector3(0,2.3,12)
  ]);
  const targets=[new T.Vector3(0,0,-15),new T.Vector3(-6.8,-.8,-13),new T.Vector3(-3.4,.9,-13),new T.Vector3(0,-.8,-13),new T.Vector3(3.4,.9,-13),new T.Vector3(6.8,-.8,-13),new T.Vector3(0,2,-15)];

  const ids=['profile','projects','contact','ai-section'];
  function setPopup(active,book,local){
    ids.forEach((id,i)=>{const el=document.getElementById(id);if(!el)return;let opacity=0,scale=.35,blur=12;
      if(i===active){const reveal=range(local,.18,.43),hold=range(local,.43,.68),hide=range(local,.68,.84);opacity=Math.max(0,Math.min(1,reveal,1-hide));scale=.35+.65*Math.max(reveal,hold)*(1-hide);blur=12*(1-Math.max(reveal,hold));
        book.anchor.getWorldPosition(book._screen|| (book._screen=new T.Vector3()));const v=book._screen.clone().project(camera);const x=(v.x*.5+.5)*innerWidth,y=(-v.y*.5+.5)*innerHeight;el.style.transform=`translate3d(calc(-50% + ${x-innerWidth/2}px),calc(-50% + ${y-innerHeight/2}px),0) scale(${scale})`;el.style.filter=`blur(${blur}px)`;
      } else {el.style.transform='translate(-50%,-50%) scale(.35)';el.style.filter='blur(12px)'}
      el.style.opacity=opacity;
    });
  }

  let progress=0,target=0;
  const readScroll=()=>{const max=Math.max(1,document.documentElement.scrollHeight-innerHeight);target=clamp(scrollY/max)};
  addEventListener('scroll',readScroll,{passive:true});readScroll();

  function frame(){
    progress+=(target-progress)*.075;
    const p=progress;
    const pos=cameraPath.getPointAt(p);camera.position.lerp(pos,.09);
    const ti=p*(targets.length-1),a=Math.floor(ti),b=Math.min(targets.length-1,a+1),q=ti-a;
    const look=targets[a].clone().lerp(targets[b],q);camera.lookAt(look);
    // Four actual content books are spread through the scroll; the fifth blue is decorative.
    const zones=[.08,.31,.54,.77];let active=-1;
    books.forEach((book,i)=>{
      if(i>=4){book.update(0,0,1);return}
      const center=zones[i],span=.22,local=clamp((p-(center-span/2))/span);
      const extract=range(local,0,.22),open=range(local,.20,.43),returning=range(local,.70,1);
      book.update(extract,open,returning);
      if(local>.08&&local<.92)active=i;
    });
    if(active>=0){const center=zones[active],local=clamp((p-(center-.11))/.22);setPopup(active,books[active],local)}else{ids.forEach(id=>{const e=document.getElementById(id);if(e)e.style.opacity=0})}
    renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio||1,matchMedia('(max-width:700px)').matches?1.2:1.6));renderer.setSize(innerWidth,innerHeight)},{passive:true});
  frame();
})();