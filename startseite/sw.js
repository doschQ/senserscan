/*
 * Klima Wandel Stadt – Service Worker der Startseite
 * Hält nur die Startseite selbst offline bereit: erst Netz (damit Änderungen
 * sofort ankommen), sonst Cache.
 * Anfragen der Apps in den Unterordnern fasst er nicht an; Klima Chancen hat
 * einen eigenen Service Worker.
 * Wenn sich die Liste unten oder eine der Dateien ändert, VERSION erhöhen.
 */
const VERSION = 'startseite-v1';

const DATEIEN = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon.svg',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];
const EIGENE = new Set(DATEIEN.map(f => new URL(f, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(DATEIEN.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // nur eigene alte Caches löschen – die Apps derselben Domain haben ihre eigenen
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('startseite-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (EIGENE.has(url.origin + url.pathname)) event.respondWith(netzZuerst(req));
  // alles andere (die Apps) geht unverändert ins Netz
});

async function netzZuerst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetchMitTimeout(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }), 4000);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const treffer = await cache.match(req, { ignoreSearch: true });
    if (treffer) return treffer;
    throw err;
  }
}

function fetchMitTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Zeitüberschreitung')), ms);
    fetch(req).then(
      res => { clearTimeout(timer); resolve(res); },
      err => { clearTimeout(timer); reject(err); }
    );
  });
}
