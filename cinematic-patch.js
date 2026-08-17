/*
 * ANIM OS — CLEAN CINEMATIC WORLD
 * Visual layer only. Existing application logic remains in script.js.
 * Story: BLACK VOID -> STAR IGNITION -> BEAM -> NETWORK -> AI CORE -> EXPANSION
 */
(() => {
  'use strict';

  if (!window.THREE || !window.gsap || !window.ScrollTrigger) return;

  window.initNarrativeWorld = function initNarrativeWorld() {
    if (window.__animCinematicStarted) return;
    const main = document.getElementById('main');
    if (!main) return;
    window.__animCinematicStarted = true;

    gsap.registerPlugin(ScrollTrigger);

    const mobile = window.matchMedia('(max-width:700px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
    const oldCanvas = document.getElementById('story-canvas');
    if (oldCanvas) oldCanvas.style.display = 'none';

    const style = document.createElement('style');
    style.id = 'clean-cinematic-style';
    style.textContent = `
      html, body { background:#000 !important; }
      body:before, body:after { display:none !important; }
      #main { background:transparent !important; }
      #cinematic-canvas {
        position:fixed; inset:0; width:100vw; height:100vh;
        display:block; z-index:0; pointer-events:none; background:#000;
      }
      .orb { opacity:.025 !important; }
      .glass-panel {
        background:rgba(3,8,15,.30) !important;
        backdrop-filter:blur(10px) saturate(115%) !important;
        -webkit-backdrop-filter:blur(10px) saturate(115%) !important;
        box-shadow:0 22px 70px rgba(0,0,0,.22), inset 0 1px 1px rgba(255,255,255,.09) !important;
      }
      #ai-section {
        width:min(700px,100%) !important;
        min-height:0 !important;
        height:auto !important;
        margin:90px auto 45px !important;
        padding:22px !important;
      }
      #ai-section #chat-box {
        height:155px !important;
        min-height:0 !important;
        margin:16px 0 !important;
        background:rgba(0,0,0,.16) !important;
      }
      @media(max-width:700px){
        #cinematic-canvas { height:100dvh; }
        #ai-section {
          width:calc(100% - 10px) !important;
          margin:72px auto 35px !important;
          padding:17px !important;
          border-radius:20px !important;
        }
        #ai-section #chat-box { height:135px !important; margin:13px 0 !important; }
      }
    `;
    document.head.appendChild(style);

    const canvas = document.createElement('canvas');
    canvas.id = 'cinematic-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, .1, 700);
    camera.position.set(0, 0, 38);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha:false,
      antialias:!mobile,
      powerPreference:'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.2 : 1.6));
    renderer.setSize(innerWidth, innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .72;

    const world = new THREE.Group();
    scene.add(world);
    const clock = new THREE.Clock();
    const state = { progress:0, targetVelocity:0, velocity:0, mx:0, my:0, tx:0, ty:0 };

    /* ---------- Distant stars ---------- */
    const starCount = reduced ? 220 : mobile ? 650 : 1800;
    const starPositions = new Float32Array(starCount * 3);
    const starDepth = new Float32Array(starCount);
    for (let i=0;i<starCount;i++) {
      const j=i*3;
      const r=16+Math.random()*115;
      const a=Math.random()*Math.PI*2;
      starPositions[j]=Math.cos(a)*r;
      starPositions[j+1]=(Math.random()-.5)*82;
      starPositions[j+2]=-8-Math.random()*220;
      starDepth[i]=Math.random();
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));
    const starMaterial = new THREE.PointsMaterial({
      color:0xd9f8ff,
      size:mobile?.045:.055,
      transparent:true,
      opacity:0,
      depthWrite:false,
      blending:THREE.AdditiveBlending
    });
    const stars = new THREE.Points(starGeometry,starMaterial);
    world.add(stars);

    /* ---------- Star core ---------- */
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(.075,10,10),
      new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0})
    );
    world.add(core);

    function makeGlowTexture() {
      const c=document.createElement('canvas');
      c.width=c.height=256;
      const x=c.getContext('2d');
      const g=x.createRadialGradient(128,128,0,128,128,128);
      g.addColorStop(0,'rgba(255,255,255,1)');
      g.addColorStop(.035,'rgba(225,252,255,.98)');
      g.addColorStop(.14,'rgba(85,220,255,.45)');
      g.addColorStop(.42,'rgba(40,160,255,.08)');
      g.addColorStop(1,'rgba(0,0,0,0)');
      x.fillStyle=g; x.fillRect(0,0,256,256);
      return new THREE.CanvasTexture(c);
    }

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map:makeGlowTexture(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending
    }));
    glow.scale.set(1,1,1);
    world.add(glow);

    /* ---------- Scroll-driven beam: starts invisible in the void, then grows from the star ---------- */
    const beamGroup = new THREE.Group();
    world.add(beamGroup);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color:0xdffcff,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide
    });
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(.34,44),beamMaterial);
    beam.position.set(0,-22,-3);
    beamGroup.add(beam);

    const beamGlowMaterial = new THREE.MeshBasicMaterial({
      color:0x47dfff,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide
    });
    const beamGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4,44),beamGlowMaterial);
    beamGlow.position.copy(beam.position);
    beamGroup.add(beamGlow);

    const beamHaloMaterial = new THREE.MeshBasicMaterial({
      color:0x7eeaff,transparent:true,opacity:0,depthWrite:false,
      blending:THREE.AdditiveBlending,side:THREE.DoubleSide
    });
    const beamHalo = new THREE.Mesh(new THREE.PlaneGeometry(7,44),beamHaloMaterial);
    beamHalo.position.copy(beam.position);
    beamGroup.add(beamHalo);

    /* ---------- Connection constellation ---------- */
    const network = new THREE.Group();
    world.add(network);
    const nodes=[];
    const nodeCount=mobile?8:14;
    for(let i=0;i<nodeCount;i++){
      const a=i/nodeCount*Math.PI*2;
      const r=5.5+(i%4)*1.45;
      const material=new THREE.MeshBasicMaterial({color:0xb7f3ff,transparent:true,opacity:0});
      const node=new THREE.Mesh(new THREE.SphereGeometry(.075,7,7),material);
      node.position.set(Math.cos(a)*r,Math.sin(a)*r*.62,-5-(i%3)*1.5);
      network.add(node); nodes.push(node);
    }
    const linePositions=[];
    nodes.forEach(n=>linePositions.push(0,0,-2,n.position.x,n.position.y,n.position.z));
    const lineGeometry=new THREE.BufferGeometry();
    lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(linePositions,3));
    const lineMaterial=new THREE.LineBasicMaterial({color:0x66e2ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
    network.add(new THREE.LineSegments(lineGeometry,lineMaterial));

    const keyLight=new THREE.PointLight(0x8eeaff,0,100,2);
    keyLight.position.set(0,0,4);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff,.018));

    /* ---------- One scroll controller ---------- */
    ScrollTrigger.create({
      trigger:main,
      start:'top top',
      end:'bottom bottom',
      scrub:1.35,
      invalidateOnRefresh:true,
      onUpdate(self){
        state.progress=self.progress;
        state.targetVelocity=THREE.MathUtils.clamp(self.getVelocity()/2600,-1,1);
      }
    });

    /* ---------- Existing UI only: physical depth, never replacement ---------- */
    ['profile','contact','ai-section'].forEach(id=>{
      const el=document.getElementById(id);
      if(!el || reduced) return;
      gsap.set(el,{transformPerspective:1400,transformOrigin:'50% 50%'});
      gsap.fromTo(el,
        {y:28,rotateX:2.2,scale:.992},
        {y:0,rotateX:0,scale:1,ease:'none',scrollTrigger:{trigger:el,start:'top 90%',end:'top 52%',scrub:1.1}}
      );
    });

    document.querySelectorAll('.contact-card,.liquid-btn').forEach(el=>{
      el.addEventListener('pointerenter',()=>gsap.to(keyLight,{intensity:mobile?4:8,duration:.25,overwrite:true}));
      el.addEventListener('pointerleave',()=>gsap.to(keyLight,{intensity:0,duration:.4,overwrite:true}));
    });

    addEventListener('pointermove',e=>{
      state.tx=e.clientX/innerWidth-.5;
      state.ty=e.clientY/innerHeight-.5;
    },{passive:true});

    addEventListener('resize',()=>{
      camera.aspect=innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<700?1.2:1.6));
      renderer.setSize(innerWidth,innerHeight);
      ScrollTrigger.refresh();
    },{passive:true});

    function update(time){
      const p=state.progress;
      const ignite=THREE.MathUtils.smoothstep(p,0.02,0.16);
      const beamFill=THREE.MathUtils.smoothstep(p,0.10,0.42);
      const networkFill=THREE.MathUtils.smoothstep(p,0.52,0.76);
      const intelligence=THREE.MathUtils.smoothstep(p,0.72,0.91);
      const expansion=THREE.MathUtils.smoothstep(p,0.90,1);

      /* Void: truly black, only a tiny point exists. */
      core.material.opacity=.02+ignite*.98;
      core.scale.setScalar(.45+ignite*1.8);
      glow.material.opacity=ignite*.34;
      glow.scale.setScalar(.5+ignite*4.8);

      /* Starfield slowly appears as the world wakes. */
      starMaterial.opacity=.008+ignite*.07+expansion*.035;
      stars.rotation.y=time*.003;

      /* Beam grows with scroll instead of appearing as a static square. */
      const beamScale=.02+beamFill*1.12;
      beamGroup.scale.y=beamScale;
      beamGroup.position.y=-22+beamFill*22;
      beamMaterial.opacity=beamFill*.55;
      beamGlowMaterial.opacity=beamFill*.12;
      beamHaloMaterial.opacity=beamFill*.035;
      beam.material.opacity += Math.sin(time*1.8)*.008*beamFill;

      /* The beam becomes the spine of the digital universe. */
      keyLight.intensity=ignite*(mobile?4:9)+intelligence*(mobile?2:4);
      keyLight.position.y=-6+beamFill*10;

      /* Network emerges only after the beam has formed. */
      network.position.z=THREE.MathUtils.lerp(4,-2,networkFill);
      network.rotation.z=networkFill*Math.PI*.7;
      lineMaterial.opacity=networkFill*.16;
      nodes.forEach((n,i)=>{
        const reveal=THREE.MathUtils.clamp((networkFill-i/nodeCount*.34)*1.5,0,1);
        n.material.opacity=reveal*.5;
        n.scale.setScalar(.65+intelligence*.9);
      });

      /* Expansion pulls the camera back, exposing more stars. */
      camera.position.z=THREE.MathUtils.lerp(38,54,expansion);
      state.velocity=THREE.MathUtils.lerp(state.velocity,state.targetVelocity,.07);
      state.mx=THREE.MathUtils.lerp(state.mx,state.tx,.045);
      state.my=THREE.MathUtils.lerp(state.my,state.ty,.045);
      camera.position.x=THREE.MathUtils.lerp(camera.position.x,state.mx*1.15,.035);
      camera.position.y=THREE.MathUtils.lerp(camera.position.y,-state.my*.8,.035);
      world.rotation.z+=state.velocity*.0003;
      camera.lookAt(0,0,-5);
    }

    function render(){
      update(clock.getElapsedTime());
      renderer.render(scene,camera);
      requestAnimationFrame(render);
    }

    ScrollTrigger.refresh();
    render();
  };
})();
