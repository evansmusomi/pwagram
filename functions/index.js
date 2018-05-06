const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });
const webpush = require("web-push");
const UUID = require("uuid-v4");
const serviceAccount = require("./pwagramapp-fb-key.json");
const vapid = require("./vapid.json");
const googleCloudConfig = {
    projectId: "pwagramapp",
    keyFilename: "pwagramapp-fb-key.json"
};
const googleCloudStorage = require("@google-cloud/storage")(googleCloudConfig);
const cityReverseGeocoder = require("city-reverse-geocoder");
const fs = require("fs");
const os = require("os");
const Busboy = require("busboy");
const path = require("path");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://pwagramapp.firebaseio.com"
});

exports.storePostData = functions.https.onRequest((request, response) => {
  return cors(request, response, () => {
    let uuid = UUID();
    const busboy = new Busboy({ headers: request.headers });
    let upload;
    const fields = {};
    
    // process every file upload
    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
        const filepath = path.join(os.tmpdir(), filename);
        upload = { file: filepath, type: mimetype };
        file.pipe(fs.createWriteStream(filepath));
    });
    
    // process every field detected
    busboy.on("field", (fieldname, value, fieldnameTruncated, valueTruncated, encoding, mimetype) => {
       fields[fieldname] = value; 
    });
    
    // post file-upload processing
    busboy.on("finish", () => {
        let bucket = googleCloudStorage.bucket("pwagramapp.appspot.com");
        
        bucket.upload(upload.file, {
           uploadType: "media",
           metadata: {
               metadata: {
                   contentType: upload.type,
                   firebaseStorageDownloadTokens: uuid
               }
           }
        }, (error, uploadedFile) => {
            if (!error){
                admin
                    .database()
                    .ref("posts")
                    .push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        rawLocation: {
                            lat: fields.rawLocationLat,
                            lng: fields.rawLocationLng
                        },
                        image: `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${uuid}`
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
                    
                    return response.status(201).json({message: "Data stored", id: fields.id});
                }).catch(error => {
                    return response.status(500).json({ error: error });    
                });
            }else{
                console.log(error);
            }
        });
    });
  
    // send upload bytes to busboy
    busboy.end(request.rawBody); 
  });
});

exports.cityReverseGeocode = functions.https.onRequest((request, response) => {
    return cors(request, response, () => {
        let decodedCity = [{ city: "Anonymous"}];
        let { rawLocationLat, rawLocationLng } = request.query;
    
        decodedCity = cityReverseGeocoder(rawLocationLat, rawLocationLng)[0];
        
        return response.status(200).json({ message: "City Decoded", city: `${decodedCity.city}, ${decodedCity.country}` });
    });
});