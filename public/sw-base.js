importScripts("https://storage.googleapis.com/workbox-cdn/releases/3.2.0/workbox-sw.js");


workbox.routing.registerRoute(
    new RegExp(/.*(?:firebasestorage\.googleapis)\.com.*$/),
    workbox.strategies.staleWhileRevalidate({
        cacheName: "post-images"
    })
);

workbox.routing.registerRoute(
    new RegExp(/.*(?:googleapis|gstatic)\.com.*$/),
    workbox.strategies.staleWhileRevalidate({
        cacheName: "google-fonts"
    })
);

workbox.routing.registerRoute(
    "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
    workbox.strategies.staleWhileRevalidate({
        cacheName: "material-css"
    })
);

workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute([], {});
