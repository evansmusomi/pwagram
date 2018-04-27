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
