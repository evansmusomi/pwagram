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
workbox.precaching.precacheAndRoute([], {});

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