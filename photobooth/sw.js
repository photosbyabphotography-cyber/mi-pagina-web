const CACHE='halo-v59-offline-airdrop-20260916';
const CORE=[
  './',
  './index.html',
  './manifest.webmanifest',
  './supabase-js-2.116.0.js',
  './qrcode-1.0.0.min.js',
  './assets/wedding-romantic-clean-v4.png',
  './assets/wedding-floral-halo.png',
  './assets/wedding-floral-horizontal.png',
  './assets/wedding-floral-horizontal-3x2.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('halo-')&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      caches.match('./index.html').then(cached=>cached||fetch(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached=>{
      if(cached)return cached;
      return fetch(event.request).then(response=>{
        if(response&&response.ok&&new URL(event.request.url).origin===self.location.origin){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      });
    })
  );
});
