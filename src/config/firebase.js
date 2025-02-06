const admin = require("firebase-admin");
const { google } = require("googleapis");
const axios = require("axios");
const { errorLog, successLog } = require("../utilities/handlers/log-handler");

const serviceAccount = require("../keys/kola-kruze-4ba2c-firebase-adminsdk-fbsvc-bd69855ae8.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const SCOPES = "https://www.googleapis.com/auth/firebase.messaging";

const getAccessToken = () => {
  try {
    return new Promise((resolve, reject) => {
      const key = require("../keys/kola-kruze-4ba2c-firebase-adminsdk-fbsvc-bd69855ae8.json");

      const jwtClient = new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        SCOPES
      );

      jwtClient.authorize((err, tokens) => {
        if (err) return reject(err);
        resolve(tokens.access_token);
      });
    });
  } catch (error) {
    return errorLog({ error });
  }
};

const AxiosConfig = async (token, payload) => {
  try {
    const config = {
      method: "post",
      url: `https://fcm.googleapis.com/v1/projects/${process.env.FIREBASE_PROJECT_ID}/messages:send`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      data: payload
    };

    const response = await axios(config);

    return successLog({
      message: "Notification sent successfully",
      data: response
    });
  } catch (error) {
    return errorLog({ error });
  }
};

const sendNotification = async (payload) => {
  try {
    const access_token = await getAccessToken();
    console.log("Sending Notification - Payload:", payload);

    await AxiosConfig(access_token, payload);
  } catch (error) {
    return errorLog({ error });
  }
};

module.exports = { sendNotification };
