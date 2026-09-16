const CACHE='halo-v591-fast-offline-20260916';
const INDEX=new URL('./index.html',self.location.href).href;

// Keep installation small so Safari can activate offline mode immediately.
const CORE=[
  './index.html',
  './manifest.webmanifest',
  './supabase-js-2.116.0.js',
  './qrcode-1.0.0.min.js'
];

// These large templates warm in the background and never block activation.
const TEMPLATES=[
  './assets/wedding-floral-halo.png',
  './assets/wedding-floral-horizontal-3x2.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key.startsWith('halo-')&&key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
      .then(()=>caches.open(CACHE))
      .then(cache=>{
        // Do not await these downloads: the app is already available offline.
        TEMPLATES.forEach(url=>cache.add(url).catch(()=>{}));
      })
  );
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  if(event.request.mode==='navigate'){
    event.respondWith(
      caches.match(INDEX).then(cached=>cached||fetch(event.request))
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
