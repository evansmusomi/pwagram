// Globals
var deferredPrompt;

// Register SW
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then(() => {
    console.log("Service worker registered");
  });
}

// Defer install prompt
window.addEventListener("beforeinstallprompt", event => {
  console.log("beforeinstallprompt fired");
  event.preventDefault();
  deferredPrompt = event;
  return false;
});
