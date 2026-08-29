// sw.js - Service Worker (نسخة محسنة)
const CACHE_NAME = 'krestal-clinic-v5';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './krestali.png',
  './pack.png',
  './icon-192.png',
  './icon-512.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Cache opened:', CACHE_NAME);
        return cache.addAll(CORE_ASSETS).catch(err => {
          console.warn('⚠️ بعض الملفات غير موجودة:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑 حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// جلب الطلبات
self.addEventListener('fetch', event => {
  // تجاهل طلبات API تماماً
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/')) {
    return; // دعها تذهب للشبكة مباشرة بدون تدخل
  }
  
  // تجاهل طلبات Supabase
  if (url.hostname.includes('supabase.co')) {
    return;
  }
  
  // تجاهل طلبات Telegram
  if (url.hostname.includes('telegram.org')) {
    return;
  }

  // استراتيجية Network First
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});