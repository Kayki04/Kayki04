/* Service worker da Gatecão: abre rápido e funciona com internet fraca. */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js', '/config.js');
try { firebase.initializeApp(self.GC_FIREBASE_CONFIG); firebase.messaging(); } catch (e) {}
const CACHE = 'gatecao-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/manifest.webmanifest', '/icons/icon-192.png']).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('/', cp)); return res; }).catch(() => caches.match('/'))); return; }
  const fixo = u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.gstatic.com' || u.hostname === 'cdnjs.cloudflare.com' || (u.hostname === 'firebasestorage.googleapis.com' && u.pathname.includes('/o/assets')) || u.pathname.startsWith('/icons/');
  if (fixo) e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});
