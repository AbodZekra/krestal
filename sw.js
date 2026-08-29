// sw.js - Service Worker (نسخة محسنة لـ GitHub Pages و Vercel)
const CACHE_NAME = 'krestal-clinic-v6';

// استخدام مسارات نسبية للعمل على أي منصة
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
        return Promise.allSettled(
          CORE_ASSETS.map(asset => 
            cache.add(asset).catch(err => {
              console.warn(`⚠️ فشل تحميل ${asset}:`, err);
            })
          )
        );
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
  const url = new URL(event.request.url);
  
  // تجاهل طلبات API تماماً
  if (url.pathname.includes('/api/')) {
    return;
  }
  
  // تجاهل طلبات Supabase
  if (url.hostname.includes('supabase.co')) {
    return;
  }
  
  // تجاهل طلبات Telegram
  if (url.hostname.includes('telegram.org')) {
    return;
  }

  // استراتيجية Network First مع fallback للكاش
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // تخزين النسخة في الكاش
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // في حالة عدم وجود اتصال، جلب من الكاش
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          
          // للتنقل، العودة للصفحة الرئيسية
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// التعامل مع الرسائل
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});