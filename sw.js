const CACHE_NAME = "anim-os-shell-v2";
const APP_SHELL = ["./","./index.html","./style.css","./script.js","./cloudscape.js","./manifest.webmanifest","./offline.html","./assets/brand/anim-os-logo.svg","./assets/icons/anim-os-icon.svg","./assets/icons/anim-os-maskable.svg","./assets/icons/icon-192.png","./assets/icons/icon-512.png"];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
 const request=event.request;
 if(request.method!=="GET"||new URL(request.url).origin!==self.location.origin)return;
 if(request.mode==="navigate"){
  event.respondWith(fetch(request).then(response=>{
   if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put("./index.html",copy));}
   return response;
  }).catch(async()=> (await caches.match(request))||(await caches.match("./index.html"))||(await caches.match("./offline.html"))));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>{
  const fresh=fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}return response;}).catch(()=>cached);
  return cached||fresh;
 }));
});
