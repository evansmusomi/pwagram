const apiUrl = {
  postFetch: "https://pwagramapp.firebaseio.com/posts.json",
  postSync: "https://us-central1-pwagramapp.cloudfunctions.net/storePostData",
  getCity: "https://us-central1-pwagramapp.cloudfunctions.net/cityReverseGeocode"
};
let networkDataReceived = false;

const closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
const locationButton = document.querySelector("#location-btn");
const locationLoader = document.querySelector("#location-loader");
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
let picture;
let fetchedLocation = { lat: 0, lng: 0};


function reverseGeocodeCity(coordinates){
  fetch(`${apiUrl.getCity}?rawLocationLat=${coordinates.latitude}&rawLocationLng=${coordinates.longitude}`)
  .then(response => response.json())
  .then(data => {
    locationInput.value = data.city;
  })
  .catch(console.log);
}

locationButton.addEventListener("click", event => {
  if (!("geolocation" in navigator)){ return;}
  let sawAlert = false;
  
  locationButton.style.display = "none";
  locationLoader.style.display = "block";
  
  navigator.geolocation.getCurrentPosition(position => {
    locationButton.style.display = "inline";
    locationLoader.style.display = "none";
    console.log(position);
    fetchedLocation = { lat: position.coords.latitude, lng: position.coords.longitude };
    reverseGeocodeCity(position.coords);
    document.querySelector("#manual-location").classList.add("is-focused");
  }, error => {
    console.log(error);
    locationButton.style.display = "inline";
    locationLoader.style.display = "none";
  
    if(!sawAlert){
      alert("Couldn't fetch location, please enter manually!");
      sawAlert = true;
    }

    fetchedLocation = { lat: 0, lng: 0};
  }, { timeout: 7000});
  
  event.preventDefault();
});

function initializeLocation(){
  if (!('geolocation' in navigator)){
    locationButton.style.display = "none";
  }
}

function initializeMedia(){
  if (!('mediaDevices') in navigator){
    navigator.mediaDevices = {};
  }
  
  if (!('getUserMedia') in navigator.mediaDevices){
    navigator.mediaDevices.getUserMedia = constraints => {
      let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    
      if (!getUserMedia){
        return Promise.reject(new Error("getUserMedia is not implemented!"));
      }
      
      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject);
      }); 
    }
  }
  
  captureButton.style.display = "block";
  
  navigator.mediaDevices.getUserMedia({video: true}).then(stream => {
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = "block";
  }).catch(error => {
    imagePickerArea.style.display = "block";
  });
}

function shutDownCamera(){
  if (videoPlayer.srcObject){
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    }); 
  }
}

captureButton.addEventListener("click", event => {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";
  let context = canvasElement.getContext("2d");
  context.drawImage(videoPlayer, 0, 0, canvasElement.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width));
  shutDownCamera();
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener("change", event => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  setTimeout(() => {
    createPostArea.style.transform = "translateY(0)";
  }, 1);
  initializeMedia();
  initializeLocation();

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
  setTimeout(() => {
    createPostArea.style.transform = "translateY(100vh)";  
  }, 1);

  videoPlayer.style.display = "none";
  imagePickerArea.style.display = "none";
  canvasElement.style.display = "none";
  locationButton.style.display = "inline";
  locationLoader.style.display = "none";
  shutDownCamera();
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
  let postData = new FormData();
  let postId = new Date().toISOString();
  
  postData.append("id", postId);
  postData.append("title", titleInput.value);
  postData.append("location", locationInput.value);
  postData.append("rawLocationLat", fetchedLocation.lat);
  postData.append("rawLocationLng", fetchedLocation.lng);
  postData.append("file", picture, `${postId}.png`);
  
            
  fetch(apiUrl.postSync, {
    method: "POST",
    body: postData
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
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
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