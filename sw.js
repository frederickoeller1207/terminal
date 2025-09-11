// sw.js
const CACHE_VER = 'img-v1';
const STATIC = `static-${CACHE_VER}`;
const IMG_HOSTS = ['i.supaimg.com','frederickoeller1207.github.io'];

const PRE_CACHE = [
  'https://i.supaimg.com/0483c192-7c11-41e0-92c1-e980e9b50f60.png',
  'https://i.supaimg.com/5abf1dba-fcbb-472c-a9bc-3c15894c1bcb.png',
  'https://i.supaimg.com/dea106e1-18eb-4ae7-b2ea-ca3ded6e63c1.png',
  'https://i.supaimg.com/652a2719-c338-4a37-a712-7dd6d56945b5.png',
  'https://i.supaimg.com/d256e5e6-05bd-43b0-a548-6c10c1e43efe.png',
  'https://i.supaimg.com/1fc31392-99ae-4970-8cee-474e784ef93f.png',
  'https://i.supaimg.com/359b3d2b-2cc2-48dd-86b2-4f44ee584857.png',
  'https://i.supaimg.com/965bbc7f-a8a5-43f8-a7d1-90ce44c21053.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(STATIC).then(c => c.addAll(PRE_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isImg = e.request.destination === 'image' ||
                /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
  const fromKnown = IMG_HOSTS.includes(url.hostname);

  if (isImg && fromKnown) {
    e.respondWith(
      caches.open(STATIC).then(async cache => {
        const hit = await cache.match(e.request, { ignoreSearch: true });
        if (hit) return hit;
        try {
          const res = await fetch(e.request, { cache: 'no-store' });
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        } catch {
          return hit || Response.error();
        }
      })
    );
    return;
  }
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});