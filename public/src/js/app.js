// Globals
var deferredPrompt;
const enableNotificationsButtons = document.querySelectorAll(".enable-notifications");

// Polyfills
if (!window.Promise) {
  window.Promise = Promise;
}

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

// Notifications
function displayConfirmNotification(){
  if ("serviceWorker" in navigator){
    let options = {
      body: "You successfully subscribed to our service"
    };
    
    navigator.serviceWorker.ready.then(swRegistration => {
      swRegistration.showNotification("Successfully subscribed", options);
    });
  }
}

function askForNotificationPermission(){
  Notification.requestPermission(result => {
    if(result !== "granted"){
      console.log("Permission not granted");
    }else{
      displayConfirmNotification();
    }
  });
}

if("Notification" in window){
  enableNotificationsButtons.forEach((item, index) => {
    enableNotificationsButtons[index].style.display = "inline-block";
    enableNotificationsButtons[index].addEventListener("click", askForNotificationPermission);
  });
}