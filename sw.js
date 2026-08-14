// ============================================================
// Service Worker - عيادة كريستال
// ============================================================

const CACHE_NAME = 'krestal-v1';
const OFFLINE_URL = '/offline.html';

// الملفات التي سيتم تخزينها مؤقتاً للاستخدام دون اتصال
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/krestal.png',
  '/pack.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css'
];

// ============================================================
// 1. تثبيت Service Worker
// ============================================================
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// ============================================================
// 2. تنشيط Service Worker
// ============================================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ============================================================
// 3. اعتراض الطلبات (Fetch)
// ============================================================
self.addEventListener('fetch', event => {
  // تخطي طلبات التحليلات والإعلانات
  if (event.request.url.includes('google-analytics') ||
      event.request.url.includes('doubleclick.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // إذا كان الملف موجوداً في الكاش، أرسله
        if (cachedResponse) {
          // تحديث الكاش في الخلفية للطلبات المستخدمة بكثرة
          if (event.request.method === 'GET') {
            fetch(event.request)
              .then(networkResponse => {
                if (networkResponse && networkResponse.status === 200) {
                  caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, networkResponse));
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }

        // إذا لم يكن في الكاش، جلب من الشبكة
        return fetch(event.request)
          .then(networkResponse => {
            // حفظ النسخة الجديدة في الكاش
            if (networkResponse && networkResponse.status === 200 &&
                event.request.method === 'GET' &&
                event.request.url.startsWith('http')) {
              const clonedResponse = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, clonedResponse));
            }
            return networkResponse;
          })
          .catch(() => {
            // إذا فشل الاتصال بالشبكة، عرض صفحة الدعم
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_URL);
            }
            // للموارد غير HTML، إرجاع استجابة فارغة
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// ============================================================
// 4. معالجة الإشعارات الواردة (Push Notifications)
// ============================================================
self.addEventListener('push', event => {
  console.log('[SW] Push received:', event);
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'عيادة كريستال';
  const options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/krestal.png',
    badge: '/krestal.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'فتح', icon: '/krestal.png' },
      { action: 'close', title: 'إغلاق', icon: '/krestal.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ============================================================
// 5. معالجة النقر على الإشعارات
// ============================================================
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification click:', event);
  
  const action = event.action;
  const notification = event.notification;
  const url = notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(windowClients => {
        // إذا كانت النافذة مفتوحة، اجلبها إلى الأمام
        for (let client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // وإلا افتح نافذة جديدة
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );

  // إغلاق الإشعار بعد النقر
  notification.close();
});