const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const serviceAccount = require("./pwagramapp-fb-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagramapp.firebaseio.com"
});

exports.storePostData = functions.https.onRequest((request, response) => {
  return cors(request, response, () => {
    admin.database().ref("posts").push({
        id: request.body.id,
        title: request.body.title,
        location: request.body.location,
        image: request.body.image
    }).then(() => {
        return response.status(201).json({message: "Data stored", id: request.body.id});
    }).catch(error => {
        return response.status(500).json({ error: error });    
    });
  });
});
