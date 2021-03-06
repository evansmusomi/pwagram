// Imports
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

// Declare constants
const apiUrl = {
  postFetch: "https://pwagramapp.firebaseio.com/posts.json",
  postSync: "https://us-central1-pwagramapp.cloudfunctions.net/storePostData"
};
const dynamicCacheName = "dynamic-v1.5";
const staticAssets = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/utility.js",
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
const staticCacheName = "static-v1.26";

// Helper functions
function cacheWithNetworkFallback(event) {
  // Cache with network fallback
  return event.respondWith(
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

function indexedDBWithNetworkFallback(event) {
  // IndexedDB with Network Fallback
  return event.respondWith(
    fetch(event.request).then(response => {
      let clonedResponse = response.clone();
      clearAllData("posts")
        .then(() => {
          return clonedResponse.json();
        })
        .then(data => {
          for (let key in data) {
            writeData("posts", data[key]);
          }
        });
      return response;
    })
  );
}

function isInArray(string, array) {
  array.forEach((item, index) => {
    if (item == string) {
      return true;
    }
  });

  return false;
}

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then(cache => {
    cache.keys().then(keys => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

// Event listeners
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
  if (event.request.url.indexOf(apiUrl.postFetch) > -1) {
    // Use IndexedDB and Network
    indexedDBWithNetworkFallback(event);
  } else if (isInArray(event.request.url, staticAssets)) {
    // Use Cache only
    event.respondWith(caches.match(event.request));
  } else {
    // Use Cache and Network
    cacheWithNetworkFallback(event);
  }
});

self.addEventListener("sync", event => {
  console.log("[SW] Background syncing");
  if(event.tag === "sync-new-posts"){
    event.waitUntil(
      readAllData("sync-posts")
        .then(data => {
          for(let item of data){
            let postData = new FormData();
            postData.append("id", item.id);
            postData.append("title", item.title);
            postData.append("location", item.location);
            postData.append("rawLocationLat", item.rawLocation.lat);
            postData.append("rawLocationLng", item.rawLocation.lng);
            postData.append("file", item.picture, `${item.id}.png`);
            
            fetch(apiUrl.postSync, {
              method: "POST",
              body: postData
            }).then(response => {
                console.log("Sent data", response);
                if(response.ok){
                  response.json().then(responseData => {
                    deleteItemFromData("sync-posts", responseData.id);  
                  });
                }
            }).catch(error => {
                console.log("Error while sending data", error);
            });
          }
        })
    );
  }
});

self.addEventListener("notificationclick", event => {
  let notification = event.notification;
  let action = event.action;
  
  console.log(notification);
  
  if (action === "confirm"){
    console.log("Confirm was chosen");
  }else{
    console.log(action);
    event.waitUntil(
      clients.matchAll().then(foundClients => {
        let client = foundClients.find(foundClient => foundClient.visibilityState === "visible");
        
        if (client !== undefined){
          client.navigate(notification.data.url);
          client.focus();
        }else{
          clients.openWindow(notification.data.url);
        }
      })
    );
  }
  
  notification.close();
});

self.addEventListener("notificationclose", event => {
  console.log("Notification was closed", event);
});

self.addEventListener("push", event => {
  console.log("Push Notification received");
  
  let data = {title: "New!", content: "Something new happened!", openUrl: "/help"};
  if (event.data){
    data = JSON.parse(event.data.text());
  }
  
  let options = {
    body: data.content,
    icon: "/src/images/icons/app-icon-96x96.png",
    badge: "/src/images/icons/app-icon-96x96.png",
    data: {
      url: data.openUrl
    }
  };
  
  event.waitUntil(self.registration.showNotification(data.title, options));
});