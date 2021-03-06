// Define db handler
const dbPromise = idb.open("posts-store", 1, db => {
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
  
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeData(idbStore, data) {
  return dbPromise.then(db => {
    let tx = db.transaction(idbStore, "readwrite");
    let store = tx.objectStore(idbStore);
    store.put(data);
    return tx.complete;
  });
}

function readAllData(idbStore) {
  return dbPromise.then(db => {
    let tx = db.transaction(idbStore, "readonly");
    let store = tx.objectStore(idbStore);
    return store.getAll();
  });
}

function clearAllData(idbStore) {
  return dbPromise.then(db => {
    let tx = db.transaction(idbStore, "readwrite");
    let store = tx.objectStore(idbStore);
    store.clear();
    return tx.complete;
  });
}

function deleteItemFromData(idbStore, id) {
  return dbPromise
    .then(db => {
      let tx = db.transaction(idbStore, "readwrite");
      let store = tx.objectStore(idbStore);
      store.delete(id);
      return tx.complete;
    })
    .then(() => console.log("Item deleted"));
}

function urlBase64ToUint8Array(base64String) {
  var padding = '='.repeat((4 - base64String.length % 4) % 4);
  var base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  var rawData = window.atob(base64);
  var outputArray = new Uint8Array(rawData.length);

  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function dataURItoBlob(dataURI){
  let byteString = atob(dataURI.split(",")[1]);
  let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
  let ab = new ArrayBuffer(byteString.length);
  let ia = new Uint8Array(ab);
  for(let i = 0; i < byteString.length; i++){
    ia[i] = byteString.charCodeAt(i);
  }
  
  let blob = new Blob([ab], {type: mimeString});
  return blob;
}