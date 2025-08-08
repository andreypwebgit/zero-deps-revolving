// 📚 SOURCE: Basado en las guías de PWA y el "Definitive Folder Architecture".
const CACHE_NAME = 'revolving-sos-cache-v2'; // Incrementamos la versión de la caché
const urlsToCache = [
  '/',
  '/index.html',
  '/aviso-legal.html',
  '/politica-privacidad.html',
  '/politica-cookies.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://unpkg.com/lucide@latest',
  '/assets/images/logos/logo-apwebai-transparente.png',
  '/assets/images/logos/logo-apwebai-bn.png'
];

// Evento de instalación: se abre la caché y se añaden los archivos principales.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de activación: elimina cachés antiguas.
self.addEventListener('activate', event => {
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

// Evento de fetch: intercepta las peticiones de red.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en la caché, lo devuelve.
        if (response) {
          return response;
        }
        // Si no, hace la petición a la red, la clona, la guarda en caché y la devuelve.
        return fetch(event.request).then(
          response => {
            // Comprueba si hemos recibido una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});
