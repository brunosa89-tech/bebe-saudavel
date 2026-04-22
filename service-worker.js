// ═══════════════════════════════════════════════════════════════
// BEBÊ SAUDÁVEL — service-worker.js
// Estratégia: Cache-First para assets, Network-First para dados
// ═══════════════════════════════════════════════════════════════

const CACHE      = 'bebe-saudavel-v1';
const CACHE_URLS = [
  './index.html',
  './styles.css',
  './db.js',
  './rules.js',
  './script.js',
  './catalogo-vacinas.js',
  './catalogo-medicamentos.js',
  './manifest.json'
];

// ── Instala e pré-cacheia todos os assets ──
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Remove caches antigos ao ativar ──
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Cache-First: tenta cache primeiro, fallback para rede ──
self.addEventListener('fetch', e => {
  // Ignora requisições não-GET e de outras origens
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request)
        .then(response => {
          // Cacheia novos assets válidos
          if (response && response.status === 200 && response.type === 'basic') {
            const clone = response.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
