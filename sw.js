// sw.js - Service Worker
const CACHE_NAME = 'krestal-clinic-v2';
const urlsToCache = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './krestal.png',
  './pack.png',
  './icon-192.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache addAll error:', error);
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// جلب الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع من الكاش إذا وجد
        if (response) {
          return response;
        }
        
        // جلب من الشبكة
        return fetch(event.request).then(response => {
          // التحقق من صحة الاستجابة
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // نسخ الاستجابة للتخزين
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        // في حالة فشل الشبكة، إرجاع الصفحة الرئيسية
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});