const staticCacheName = "static-v1.0";
const dynamicCacheName = "dynamic-v1.0";
const staticAssets = [
  "/",
  "/index.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css"
];

self.addEventListener("install", event => {
  console.log("[SW] Installing");
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log("[SW] Pre-caching App shell");
      cache.addAll(staticAssets);
    })
  );
});

self.addEventListener("activate", event => {
  console.log("[SW] Activating");
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== staticCacheName && key !== dynamicCacheName) {
            console.log("[SW] Removing old cache");
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request)
        .then(res => {
          return caches.open(dynamicCacheName).then(cache => {
            cache.put(event.request.url, res.clone());
            return res;
          });
        })
        .catch(err => console.log(err));
    })
  );
});
