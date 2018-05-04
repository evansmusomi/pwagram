const apiUrl = {
  postFetch: "https://pwagramapp.firebaseio.com/posts.json",
  postSync: "https://us-central1-pwagramapp.cloudfunctions.net/storePostData"
};
let networkDataReceived = false;

const closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
const shareImageButton = document.querySelector("#share-image-button");
const createPostArea = document.querySelector("#create-post");
const sharedMomentsArea = document.querySelector("#shared-moments");
const form = document.querySelector("form");
const locationInput = document.querySelector("#location");
const titleInput = document.querySelector("#title");
const videoPlayer = document.querySelector("#player");
const canvasElement = document.querySelector("#canvas");
const captureButton = document.querySelector("#capture-btn");
const imagePicker = document.querySelector("#image-picker");
const imagePickerArea = document.querySelector("#pick-image");


function initializeMedia(){
  if (!('mediaDevices') in navigator){
    navigator.mediaDevices = {};
  }
  
  if (!('getUserMedia') in navigator.mediaDevices){
    let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
    if (!getUserMedia){
      return Promise.reject(new Error("getUserMedia is not implemented!"));
    }
    
    return new Promise((resolve, reject) => {
      getUserMedia.call(navigator, constraints, resolve, reject);
    });
  }
}

function openCreatePostModal() {
  createPostArea.style.transform = "translateY(0)";
  initializeMedia();

  // Show deferred install prompt
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(choiceResult => {
      console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.transform = "translateY(100vh)";
}

shareImageButton.addEventListener("click", openCreatePostModal);
closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function clearCards() {
  while (sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  let cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";

  let cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url("${data.image}")`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.backgroundPosition = "center";
  cardWrapper.appendChild(cardTitle);

  let cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);

  let cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);

  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
  clearCards();
  data.forEach(item => {
    createCard(item);
  });
}

fetch(apiUrl.postFetch)
  .then(response => response.json())
  .then(data => {
    networkDataReceived = true;
    console.log("From web", data);
    let dataArray = Object.keys(data).map(key => data[key]);
    updateUI(dataArray);
  })
  .catch(console.log);

if ("indexedDB" in window) {
  readAllData("posts").then(data => {
    if (!networkDataReceived) {
      console.log("From indexeddb", data);
      updateUI(data);
    }
  });
}

function sendData(){
  fetch(apiUrl.postSync, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: "https://firebasestorage.googleapis.com/v0/b/pwagramapp.appspot.com/o/sf-boat.jpg?alt=media"
    })
  }).then(response => {
      console.log("Sent data", response);
      updateUI(response);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  
  if (titleInput.value.trim() === '' || locationInput.value.trim() === ''){
    alert("Please enter valid data!");
    return;
  }
  
  closeCreatePostModal();
  
  if ("serviceWorker" in navigator && "SyncManager" in window){
    navigator.serviceWorker.ready.then(sw => {
      let post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value
      };
      writeData("sync-posts", post)
        .then(() => {
          return sw.sync.register("sync-new-posts");
        })
        .then(() => {
          const snackbarContainer = document.querySelector("#confirmation-toast");
          let data = { message: "Your post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        }).catch(error => {
          console.log(error);
        });
    });
  }else{
    sendData();
  }
  
});