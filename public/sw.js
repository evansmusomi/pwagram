const cacheVersion = "v1";
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
    caches.open(`static-${cacheVersion}`).then(cache => {
      console.log("[SW] Pre-caching App shell");
      cache.addAll(staticAssets);
    })
  );
});

self.addEventListener("activate", event => {
  console.log("[SW] Activating");
});

self.addEventListener("fetch", event => {
  console.log("[SW] Fetching...", event.request.url);
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(res => {
        return caches.open(`dynamic-${cacheVersion}`).then(cache => {
          cache.put(event.request.url, res.clone());
          return res;
        });
      });
    })
  );
});
