const CACHE_NAME='katrinas-attendance-offline-final11';

const APP_SHELL=['./','./index.html','./manifest.json','https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(['./','./index.html','./manifest.json']);
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

 // Never cache Supervisor/login/test pages. Always get the newest GitHub Pages file.
 if(url.origin===self.location.origin &&
   (url.pathname.endsWith('/supervisor-login-test.html') ||
    url.pathname.endsWith('/supervisor.html') ||
    url.pathname.endsWith('/login.html') ||
    url.pathname.endsWith('/office.html') ||
    url.pathname.endsWith('/owner.html'))){
   event.respondWith(fetch(req,{cache:'no-store'}));
   return;
 }

 if(url.origin===self.location.origin && req.mode==='navigate'){
  event.respondWith((async()=>{
   try{return await fetch(req,{cache:'no-store'});}
   catch(e){
    const cache=await caches.open(CACHE_NAME);
    return (await cache.match(req)) || Response.error();
   }
  })());
  return;
 }

 event.respondWith((async()=>{
  const cached=await caches.match(req);
  if(cached)return cached;
  try{
   const network=await fetch(req);
   if(url.origin===self.location.origin){
    const cache=await caches.open(CACHE_NAME);
    cache.put(req,network.clone());
   }
   return network;
  }catch(e){return cached||Response.error();}
 })());
});