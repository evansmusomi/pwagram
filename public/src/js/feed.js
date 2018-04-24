const shareImageButton = document.querySelector("#share-image-button");
const createPostArea = document.querySelector("#create-post");
const closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
const sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
  createPostArea.style.display = "block";

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
  createPostArea.style.display = "none";
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
  cardTitle.style.height = "180px";
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

fetch("https://pwagramapp.firebaseio.com/posts.json")
  .then(response => response.json())
  .then(data => {
    let dataArray = Object.keys(data).map(key => {
      return data[key];
    });
    updateUI(dataArray);
  });
