const C='halo-offline-test-v1-20260907';
const LOCAL=[
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/halo-photobooth-logo.png',
  './assets/wedding-floral-halo.png',
  './assets/wedding-floral-horizontal.png',
  './assets/wedding-floral-horizontal-3x2.png',
  './assets/wedding-romantic-clean-v4.png',
  './assets/wedding-romantic-approved.png',
  './assets/wedding-romantic-approved-v3.png'
];
const EXTERNAL=[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(C);
    await cache.addAll(LOCAL);
    await Promise.all(EXTERNAL.map(async url=>{
      try{
        const r=await fetch(url,{cache:'reload'});
        await cache.put(url,r);
      }catch(e){}
    }));
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if(event.request.method!=='GET') return;
  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    if(cached) return cached;
    try{
      const response=await fetch(event.request);
      return response;
    }catch(e){
      if(event.request.mode==='navigate'){
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
      throw e;
    }
  })());
});
