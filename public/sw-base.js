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

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([], {});
