const CACHE_NAME='katrinas-attendance-offline-final1';
const APP_SHELL=[
  './',
  './index.html','./employee.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await cache.addAll(['./','./index.html','./manifest.json']);
    for(const url of APP_SHELL.slice(3)){
      try{
        const r=await fetch(url,{mode:'no-cors',cache:'no-store'});
        if(r) await cache.put(url,r);
      }catch(e){ console.warn('Could not cache external asset',url,e); }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin===self.location.origin && req.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const network=await fetch(req);
        const cache=await caches.open(CACHE_NAME);
        await cache.put('./index.html',network.clone());
        return network;
      }catch(e){
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached) return cached;
    try{
      const network=await fetch(req);
      if(url.origin===self.location.origin){
        const cache=await caches.open(CACHE_NAME);
        cache.put(req,network.clone());
      }
      return network;
    }catch(e){
      return cached || Response.error();
    }
  })());
});