/*
 * SenserScan – Service Worker
 * Hält die App-Oberfläche offline verfügbar.
 *  - eigene Dateien: erst Netz (damit Änderungen sofort ankommen), sonst Cache
 *  - Leaflet/Geoman vom CDN (feste Versionen): erst Cache, sonst Netz
 *  - Kartenkacheln (OSM, PDOK) werden nicht abgefangen und nicht gespeichert
 * Wenn sich die Liste unten ändert, VERSION erhöhen.
 */
const VERSION = 'senserscan-v1';

const LOKAL = [
  './',
  'index.html',
  'style.css',
  'config.js',
  'i18n.js',
  'app.js',
  'manifest.json',
  'data/vaals_gebiete_wgs84.geojson',
  'data/massnahmen.json',
  'data/beispielflaechen.geojson',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png'
];

const CDN = [
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css',
  'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',
  'https://cdn.jsdelivr.net/npm/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.css',
  'https://cdn.jsdelivr.net/npm/@geoman-io/leaflet-geoman-free@2.17.0/dist/leaflet-geoman.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(LOKAL.concat(CDN)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(netzZuerst(req));
  } else if (url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheZuerst(req));
  }
  // alles andere (Kartenkacheln) geht unverändert ins Netz
});

async function netzZuerst(req) {
  const cache = await caches.open(VERSION);
  try {
    // no-cache: beim Server nachfragen, damit geänderte Dateien (z. B. config.js) sofort wirken
    const res = await fetchMitTimeout(new Request(req, { cache: 'no-cache' }), 4000);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const treffer = await cache.match(req, { ignoreSearch: true });
    if (treffer) return treffer;
    if (req.mode === 'navigate') {
      const start = await cache.match('index.html');
      if (start) return start;
    }
    throw err;
  }
}

async function cacheZuerst(req) {
  const treffer = await caches.match(req);
  if (treffer) return treffer;
  const res = await fetch(req);
  if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
  return res;
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
