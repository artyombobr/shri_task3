
var cacheName = 'cache-and-update';

self.addEventListener('install', (event) => {
    console.info('Event: Install');
    event.waitUntil(
      caches.open(cacheName)
      .then((cache) => {
        return cache.addAll([
        '/',
        './index.html',
        './script.js',
        './style.css',
        './conferences.json',
        './favicon.ico'
        ])
        .then(() => {
          console.info('All files are cached');
          return self.skipWaiting();
        })
        .catch((error) =>  {
          console.error('Failed to cache', error);
        })
      })
    );
  });


  self.addEventListener('fetch', (event) => {
  console.info('Event: Fetch');

  var request = event.request;

  event.respondWith(
    caches.match(request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(request).then((response) => {
        var responseToCache = response.clone();
        caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache).catch((err) => {
              console.warn(request.url + ': ' + err.message);
            });
          });

        return response;
      });
    })
  );
});


self.addEventListener('activate', (event) => {
  console.info('Event: Activate');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== cacheName) {  
            console.log('delete');
            return caches.delete(cache); 
          }
        })
      );
    })
  );
});

