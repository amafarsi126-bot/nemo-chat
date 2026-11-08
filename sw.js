// Nemo Chat service worker: network only (no caching), so the newest version always loads.
// Its presence lets Chrome offer "Install app".
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(k){ return Promise.all(k.map(function(x){ return caches.delete(x); })); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).catch(function(){
    return new Response('<h2 style="font-family:sans-serif;text-align:center;padding:2rem">لا يوجد اتصال بالإنترنت</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }));
});
