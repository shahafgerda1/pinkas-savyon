/* פנקס התרגולים: עבודה בלי רשת (4.10.2026).
   הדף והנתונים: קודם מהרשת, כדי שעדכון יגיע מיד, ובלי רשת מהעותק השמור.
   תמונות הדפים: מהעותק השמור, ונשמרות בפעם הראשונה שפותחים אותן.
   רישום השימוש וההקלטות: תמיד מהרשת, אף פעם לא מהעותק. */
const V = 'pinkas-2026-10-04b';
const IMG = 'pinkas-img', EXT = 'pinkas-ext';
const CORE = ['./', 'index.html', 'data-v2.js', 'logo-hi.png', 'wings-hi.png', 'boger-poster.jpg',
              'icon-32.png', 'icon-180.png', 'icon-192.png', 'manifest.webmanifest'];
const IMG_MAX = 150;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== IMG && k !== EXT).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function fresh(req, cacheName, key) {
  return fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(cacheName).then(x => x.put(key || req, c)); }
    return r;
  }).catch(() => caches.match(key || req).then(m => m || Promise.reject(new Error('offline'))));
}
function stored(req, cacheName) {
  return caches.match(req).then(m => m || fetch(req).then(r => {
    if (r && (r.ok || r.type === 'opaque')) {
      const c = r.clone();
      caches.open(cacheName).then(x => x.put(req, c).then(() => x.keys()).then(ks => {
        if (ks.length > IMG_MAX) return Promise.all(ks.slice(0, ks.length - IMG_MAX).map(k => x.delete(k)));
      }));
    }
    return r;
  }));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  /* רישום שימוש והקלטות (בקשות טווח) עוברים ישר לרשת */
  if (/[?&]api=use\b/.test(u.search) || /export=download/.test(u.search) || req.headers.has('range')) return;
  if (u.origin === location.origin) {
    if (/sw\.js$/.test(u.pathname)) return;
    if (req.mode === 'navigate') return e.respondWith(fresh(req, V, 'index.html'));
    if (/data-v2\.js$|index\.html$|\/$/.test(u.pathname)) return e.respondWith(fresh(req, V));
    if (/\/v2\//.test(u.pathname)) return e.respondWith(stored(req, V));
    /* דפי התרגול עצמם יושבים בתיקיית images של הפנקס, מחוץ ל-v2 */
    if (req.destination === 'image') return e.respondWith(stored(req, IMG));
    return;
  }
  /* התוספות, שיוך בוגר סביון וזמני הצוות: מהרשת, ובלי רשת מהתשובה האחרונה */
  if (u.hostname === 'script.google.com') return e.respondWith(fresh(req, EXT));
  if (/(^|\.)drive\.google\.com$|googleusercontent\.com$/.test(u.hostname) && req.destination === 'image')
    return e.respondWith(stored(req, IMG));
  if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) return e.respondWith(stored(req, EXT));
});
