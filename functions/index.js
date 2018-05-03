const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const serviceAccount = require("./pwagramapp-fb-key.json");
const webpush = require("web-push");
const vapid = require("./vapid.json");

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
        webpush.setVapidDetails("mailto:dev@evansmusomi.com", vapid.publicKey, vapid.privateKey);
        return admin.database().ref("subscriptions").once("value");
    }).then(subscriptions => {
        subscriptions.forEach(subscription => {
            let pushConfig = {
                endpoint: subscription.val().endpoint,
                keys: {
                    auth: subscription.val().keys.auth,
                    p256dh: subscription.val().keys.p256dh
                }
            };
            
            webpush.sendNotification(pushConfig, JSON.stringify({ 
                title: "New Post", 
                content: "New Post Added",
                openUrl: "/"
            })).catch(error => console.log(error));
        });
        
        return response.status(201).json({message: "Data stored", id: request.body.id});
    }).catch(error => {
        return response.status(500).json({ error: error });    
    });
  });
});
