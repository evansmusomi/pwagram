self.addEventListener("install", event => {
  console.log("[SW] Installing");
});

self.addEventListener("activate", event => {
  console.log("[SW] Activating");
});

self.addEventListener("fetch", event => {
  console.log("[SW] Fetching...", event.request.url);
});
