// نيمو شات — Service Worker
// الإصدار: 1.0.0
// يخزّن الواجهة مؤقتاً حتى يشتغل التطبيق بدون إنترنت

const CACHE_NAME = 'nemo-chat-v1';
const STATIC_ASSETS = [
  './nemo-chat-live.html',
  './nemo-icon-192.png',
  './nemo-icon-512.png',
  './manifest.json'
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// تنشيط وتنظيف الكاش القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// استراتيجية: الشبكة أولاً، ثم الكاش
// - طلبات Firebase تذهب دائماً للشبكة (لازم للبيانات الحية)
// - الملفات الثابتة تُجلب من الكاش إذا فشلت الشبكة
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Firebase والـ APIs — دايماً شبكة
  if (
    url.includes('firestore.googleapis.com') ||
    url.includes('firebase') ||
    url.includes('gstatic.com') ||
    url.includes('googleapis.com')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // الملفات المحلية — الشبكة أولاً، ثم الكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // خزّن نسخة في الكاش
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => {
        // الشبكة فشلت — جرّب الكاش
        return caches.match(event.request).then(cached => {
          return cached || new Response(
            '<h2 style="font-family:Cairo,sans-serif;text-align:center;padding:2rem">لا يوجد اتصال بالإنترنت</h2>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
  );
});
