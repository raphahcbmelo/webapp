const CACHE_NAME = 'webfin-cache-dinamico';

// Lista de arquivos essenciais para o primeiro carregamento
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './motor-dados.js',
  './motor-recursos.js',
  './ux-base.js',
  './ux-financas.js',
  './ux-pessoal.js',
  './ux-negocios.js',
  './ux-sistema.js',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2'
];

// INSTALAÇÃO: Baixa os arquivos e força o Service Worker a assumir o controle imediatamente
self.addEventListener('install', event => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// ATIVAÇÃO: Limpa qualquer cache antigo que tenha ficado para trás
self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
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

// INTERCEPTAÇÃO (A MÁGICA): Estratégia "Network First" (Rede Primeiro)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Se tem internet e conseguiu baixar, atualiza o cofre com a versão mais nova
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Se falhou (está offline), pega a versão que está salva no cofre
        return caches.match(event.request);
      })
  );
});

// ESCUTA DE COMANDOS: Permite que o botão "Atualizar" do app force a limpeza do cofre
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then(cacheNames => {
      Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    });
  }
});
