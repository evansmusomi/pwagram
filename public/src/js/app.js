// Globals
var deferredPrompt;
const enableNotificationsButtons = document.querySelectorAll(".enable-notifications");
let registration;

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
      body: "You successfully subscribed to our service",
      icon: "/src/images/icons/app-icon-96x96.png",
      image: "/src/images/sf-boat.jpg",
      dir: "ltr",
      lang: "en-US",
      vibrate: [100,50,200],
      badge: "/src/images/icons/app-icon-96x96.png",
      tag: "confirm-notification",
      renotify: true,
      actions: [
        { action: "confirm", title: "Ok", icon: "/src/images/icons/app-icon-96x96.png" },
        { action: "cancel", title: "Cancel", icon: "/src/images/icons/app-icon-96x96.png" }
      ]
    };
    
    navigator.serviceWorker.ready.then(swRegistration => {
      swRegistration.showNotification("Successfully subscribed", options);
    });
  }
}

function configurePushSubscription(){
  if (!('serviceWorker' in navigator)){
    return;
  }
  
  navigator.serviceWorker.ready.then(swRegistration => {
    registration = swRegistration;
    return swRegistration.pushManager.getSubscription();
  }).then(subscription => {
    if(subscription === null){
      // create a new subscription
      let vapidPublicKey = "BIu6jBHCMIujAAcizZT_KypQABl7h3D46EQUsj_pPRPsF7Ha0E4t50A7d-oMqprM5GwvQXSQMBHpWcy4MDZGrF0";
      let applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      return registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });
    }else{
      // we have a subscription
      
    }
  }).then(newSubscription => {
    return fetch("https://pwagramapp.firebaseio.com/subscriptions.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(newSubscription)
    })
  }).then(response => {
    if (response.ok){
      displayConfirmNotification(); 
    }
  }).catch(error => {
    console.log(error);
  });
}

function askForNotificationPermission(){
  Notification.requestPermission(result => {
    if(result !== "granted"){
      console.log("Permission not granted");
    }else{
      configurePushSubscription();
    }
  });
}

if("Notification" in window && "serviceWorker" in navigator){
  enableNotificationsButtons.forEach((item, index) => {
    enableNotificationsButtons[index].style.display = "inline-block";
    enableNotificationsButtons[index].addEventListener("click", askForNotificationPermission);
  });
}