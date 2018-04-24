// import idb script
importScripts("/src/js/idb.js");

// declare constants
const staticCacheName = "static-v1.0";
const dynamicCacheName = "dynamic-v1.0";
const staticAssets = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
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

// define db handler
const dbPromise = idb.open("posts-store", 1, db => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
});

// helper functions
function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

function isInArray(string, array) {
  array.forEach((item, index) => {
    if (item == string) {
      return true;
    }
  });

  return false;
}

// event listeners
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
  const apiUrl = "https://pwagramapp.firebaseio.com/posts";

  if (
    event.request.url.indexOf(apiUrl) > -1 &&
    event.request.headers.get("accept").includes("application/json")
  ) {
    // cache to indexeddb
  } else if (isInArray(event.request.url, staticAssets)) {
    // cache only
    event.respondWith(caches.match(event.request));
  } else {
    // cache with network fallback
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
          .catch(err => {
            return caches.open(staticCacheName).then(cache => {
              if (event.request.headers.get("accept").includes("text/html")) {
                return cache.match("/offline.html");
              }
            });
          });
      })
    );
  }
});
