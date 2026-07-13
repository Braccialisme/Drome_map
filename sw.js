// Service Worker — cache offline pour la carte Drôme · Diois
// Stratégie : app shell pré-caché + tuiles/glyphs mis en cache au fil de la
// navigation, réutilisables hors-ligne pendant 30 jours.
// Actif uniquement en https (GitHub Pages) ou localhost — pas en file://.

const VERSION = 'v6';
const SHELL = 'drome-shell-' + VERSION;
const RUNTIME = 'drome-runtime-' + VERSION;
const MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 jours

// App shell : ce qu'il faut pour que l'appli se lance sans réseau
const SHELL_URLS = [
  './',
  'index.html',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
];

// Hôtes de tuiles / polices distantes → cache runtime horodaté 30j
const RUNTIME_HOSTS = ['data.geopf.fr', 'tile.waymarkedtrails.org', 'cdn.velvetyne.fr'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL)
      .then(c => c.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  const isRuntime = RUNTIME_HOSTS.includes(url.hostname) || url.pathname.includes('/fonts/VG5000/');
  const isSameOrigin = url.origin === self.location.origin;
  // Le document HTML : network-first (frais si online, cache si offline).
  // Sinon on servirait éternellement un index.html périmé.
  const isDocument = req.mode === 'navigate' ||
    (isSameOrigin && (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('/')));

  if (isRuntime) {
    event.respondWith(runtimeCache(req));
  } else if (isDocument || isSameOrigin) {
    // HTML + fichiers de l'app (js/png/json/css) : network-first → les updates
    // arrivent toujours quand online, cache en secours offline. (avant : cacheFirst
    // sur les same-origin figeait buttons-v4.js / plaques → app cassée après deploy)
    event.respondWith(networkFirst(req, SHELL));
  } else if (url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(req, SHELL)); // libs versionnées → cache OK
  }
  // Nominatim / Overpass : laissés au réseau (POI déjà en cache localStorage)
});

// Network-first : réseau si dispo (donc toujours à jour), cache en secours offline
async function networkFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const net = await fetch(req);
    if (net.ok) cache.put(req, net.clone());
    return net;
  } catch (e) {
    const hit = await cache.match(req) || await cache.match('index.html') || await cache.match('./');
    return hit || Response.error();
  }
}

// Cache-first simple (app shell, glyphs) — sans expiration
async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const net = await fetch(req);
    if (net.ok) cache.put(req, net.clone());
    return net;
  } catch (e) {
    return hit || Response.error();
  }
}

// Cache-first horodaté 30j (tuiles) : sert le cache si frais, sinon tente
// le réseau, et retombe sur le cache périmé si hors-ligne.
async function runtimeCache(req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req);
  if (cached) {
    const ts = Number(cached.headers.get('sw-cached-at') || 0);
    if (Date.now() - ts < MAX_AGE) return cached;
    try {
      const net = await fetch(req);
      if (net.ok) { await store(cache, req, net.clone()); return net; }
      return cached;
    } catch (e) {
      return cached; // hors-ligne → tuile périmée plutôt que rien
    }
  }
  try {
    const net = await fetch(req);
    if (net.ok) await store(cache, req, net.clone());
    return net;
  } catch (e) {
    return Response.error();
  }
}

// Stocke une réponse en y ajoutant l'horodatage de mise en cache
async function store(cache, req, res) {
  const body = await res.blob();
  const headers = new Headers(res.headers);
  headers.set('sw-cached-at', Date.now().toString());
  await cache.put(req, new Response(body, {
    status: res.status,
    statusText: res.statusText,
    headers
  }));
}
