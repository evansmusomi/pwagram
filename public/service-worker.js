importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

workbox.routing.registerRoute(
    new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
    workbox.strategies.staleWhileRevalidate({
        cacheName: "post-images"
    })
);

workbox.routing.registerRoute(
    new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
    workbox.strategies.staleWhileRevalidate({
        cacheName: "google-fonts",
        plugins: [ 
            new workbox.expiration.Plugin({ 
                maxEntries: 3,
                maxAgeSeconds: 30*24*60*60
            })
        ]
    })
);

workbox.routing.registerRoute(
    "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
    workbox.strategies.staleWhileRevalidate({
        cacheName: "material-css"
    })
);

workbox.routing.registerRoute("https://pwagramapp.firebaseio.com/posts.json", args => {
    return fetch(args.event.request).then(response => {
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
    });
});

const htmlHandler = workbox.strategies.cacheFirst();
workbox.routing.registerRoute(routeData => {
    return (routeData.event.request.headers.get("accept").includes("text/html"));
}, ({event}) => {
    return htmlHandler.handle({event}).catch(() => caches.match("/offline.html"));
});

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "cd5f84d9d5b20f854d6b2b84cd3a1b54"
  },
  {
    "url": "manifest.json",
    "revision": "754803a2d87420caf6df2069d1132f95"
  },
  {
    "url": "offline.html",
    "revision": "90ae3375397cfef060ca99b293a42ca6"
  },
  {
    "url": "src/css/app.css",
    "revision": "f27b4d5a6a99f7b6ed6d06f6583b73fa"
  },
  {
    "url": "src/css/feed.css",
    "revision": "283e58d6846fb0ac6244f372bffd303c"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  },
  {
    "url": "src/js/app.min.js",
    "revision": "5fc5657df61b733b741d3815c1e22afa"
  },
  {
    "url": "src/js/feed.min.js",
    "revision": "4c10ce8965fbbc234399748a7df9f3ef"
  },
  {
    "url": "src/js/fetch.min.js",
    "revision": "32590119a06bf9ade8026dd12baa695e"
  },
  {
    "url": "src/js/idb.min.js",
    "revision": "ea82c8cec7e6574ed535bee7878216e0"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.min.js",
    "revision": "7be19d2e97926f498f2668e055e26b22"
  },
  {
    "url": "src/js/utility.min.js",
    "revision": "0ea6d05f57fd4e4ac742c61317e9fdc1"
  }
], {});

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
            
            fetch("https://us-central1-pwagramapp.cloudfunctions.net/storePostData", {
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