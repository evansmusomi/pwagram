self.addEventListener("install", event => {
  console.log("[SW] Installing");
});

self.addEventListener("activate", event => {
  console.log("[SW] Activating");
});
