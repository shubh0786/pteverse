const CACHE_NAME = 'pteverse-shell-v2';
const APP_SHELL = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/pages.js',
  './js/exam.js',
  './js/engine.js',
  './js/data.js',
  './js/store.js'
  ,'./js/skills-coach.js'
  ,'./js/command-center.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || Response.error()))
  );
});
