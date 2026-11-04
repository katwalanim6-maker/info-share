(() => {
  "use strict";
  const root = document.querySelector(".cloudscape");
  if (!root) return;
  const canvases = [...root.querySelectorAll("canvas[data-cloud-plane]")];
  if (!canvases.length) return;

  // Small, seeded value-noise fields are expanded into fractal turbulence.
  // Rendering once per viewport keeps the effect light on mobile devices.
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  function makeNoise(w, h, cell, random) {
    const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
    const data = new Float32Array(gw * gh);
    for (let i = 0; i < data.length; i++) data[i] = random();
    return (x, y) => {
      const gx = x / cell, gy = y / cell;
      const ix = Math.floor(gx), iy = Math.floor(gy);
      const fx = gx - ix, fy = gy - iy;
      const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
      const a = data[iy * gw + ix], b = data[iy * gw + ix + 1];
      const c = data[(iy + 1) * gw + ix], d = data[(iy + 1) * gw + ix + 1];
      const top = a + (b - a) * sx, bottom = c + (d - c) * sx;
      return top + (bottom - top) * sy;
    };
  }
  function palette(t, depth, light) {
    const dark = depth === "near" ? [3, 7, 17] : depth === "mid" ? [8, 10, 24] : [13, 17, 34];
    const violet = [48, 36, 66], mauve = [111, 75, 111];
    const rose = [190, 137, 169], pearl = [235, 203, 218];
    let c;
    if (t < .34) c = dark.map((v,i)=>v+(violet[i]-v)*smooth(0,.34,t));
    else if (t < .70) c = violet.map((v,i)=>v+(mauve[i]-v)*smooth(.34,.70,t));
    else if (t < .91) c = mauve.map((v,i)=>v+(rose[i]-v)*smooth(.70,.91,t));
    else c = rose.map((v,i)=>v+(pearl[i]-v)*smooth(.91,1,t));
    const shade = .56 + light * .66;
    return c.map(v => clamp(v * shade, 0, 255));
  }

  function draw(canvas, depth, seed) {
    const rect = root.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.15);
    const scale = depth === "far" ? .62 : depth === "mid" ? .78 : .9;
    const w = Math.max(240, Math.round(rect.width * dpr * scale));
    const h = Math.max(360, Math.round(rect.height * dpr * scale));
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;
    const image = ctx.createImageData(w, h), pixels = image.data;
    const random = rng(seed);
    const n1 = makeNoise(w,h,depth==="far"?115:depth==="mid"?92:76,random);
    const n2 = makeNoise(w,h,depth==="far"?48:depth==="mid"?38:31,random);
    const n3 = makeNoise(w,h,depth==="far"?19:depth==="mid"?15:12,random);
    const n4 = makeNoise(w,h,depth==="far"?7:depth==="mid"?5.5:4.5,random);
    const n5 = makeNoise(w,h,2.2,random);
    const shift = depth==="far" ? .08 : depth==="mid" ? 0 : -.07;
    const threshold = depth==="far" ? .565 : depth==="mid" ? .548 : .535;
    const opacity = depth==="far" ? .64 : depth==="mid" ? .78 : .88;
    const invW=1/w, invH=1/h;
    for(let y=0;y<h;y++){
      const v=y*invH;
      for(let x=0;x<w;x++){
        const u=x*invW;
        const broad=n1(x,y), medium=n2(x,y), detail=n3(x,y), fine=n4(x,y), micro=n5(x,y);
        // Large storm masses gather at the sides and lower frame, leaving a
        // naturally broken, luminous opening through the centre.
        const leftMass=Math.exp(-Math.pow((u-(.08+shift))/.34,2)-Math.pow((v-.53)/.42,2));
        const rightMass=Math.exp(-Math.pow((u-(.94+shift))/.34,2)-Math.pow((v-.50)/.43,2));
        const lowerMass=Math.exp(-Math.pow((v-.91)/.22,2))*(.45+.55*broad);
        const upperRim=Math.exp(-Math.pow((v-.16)/.22,2))*(.35+.65*medium);
        const tower=Math.max(
          Math.exp(-Math.pow((u-.13)/.19,2)-Math.pow((v-.68)/.31,2)),
          Math.exp(-Math.pow((u-.87)/.20,2)-Math.pow((v-.66)/.34,2))
        );
        const mass=clamp(leftMass*.78+rightMass*.82+lowerMass*.86+upperRim*.30+tower*.34,0,1.35);
        const aperture=Math.exp(-Math.pow((u-.51)/.29,2)-Math.pow((v-.43)/.34,2));
        const cloudShape=mass*(1-aperture*.80);
        const turbulence=broad*.37+medium*.29+detail*.19+fine*.105+micro*.045;
        const density=turbulence*.78+cloudShape*.34;
        const alpha=smooth(threshold-.075,threshold+.13,density)*cloudShape*opacity;
        if(alpha<.012) continue;
        // A broad light source behind the cloud deck creates silver-pink
        // scattering on upper billows and deep violet occlusion underneath.
        const lightSource=Math.exp(-Math.pow((u-.51)/.34,2)-Math.pow((v-.40)/.29,2));
        const topLight=1-smooth(.24,.88,v);
        const billowLight=smooth(.47,.82,medium*.55+detail*.45);
        const light=clamp(lightSource*.78+topLight*.22+billowLight*.18,0,1);
        const shade=clamp((1-v)*.46+light*.54+(fine-.5)*.16,0,1);
        const color=palette(shade,depth,light);
        const i=(y*w+x)*4;
        pixels[i]=color[0];pixels[i+1]=color[1];pixels[i+2]=color[2];
        pixels[i+3]=Math.round(clamp(alpha*(.72+micro*.42),0,.96)*255);
      }
    }
    ctx.putImageData(image,0,0);
  }

  let resizeTimer;
  function render() {
    const box=root.getBoundingClientRect();
    if(!box.width||!box.height) return;
    draw(canvases.find(c=>c.dataset.cloudPlane==="far"),"far",1827);
    draw(canvases.find(c=>c.dataset.cloudPlane==="mid"),"mid",4913);
    draw(canvases.find(c=>c.dataset.cloudPlane==="near"),"near",8271);
  }
  function scheduleRender(){
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(render,180);
  }
  render();
  window.addEventListener("resize",scheduleRender,{passive:true});
  window.addEventListener("orientationchange",scheduleRender,{passive:true});
})();