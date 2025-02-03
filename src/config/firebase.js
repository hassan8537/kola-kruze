// const admin = require("firebase-admin");

// const serviceAccount = require("../../path/to/your/serviceAccountKey.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

// const sendNotification = async ({
//   device_token,
//   title,
//   payload,
//   meta_data = {}
// }) => {
//   const message = {
//     token: device_token,
//     notification: {
//       title: title,
//       body: payload
//     },
//     data: meta_data
//   };

//   try {
//     const response = await admin.messaging().send(message);
//     console.log("Notification sent successfully:", response);
//     return response;
//   } catch (error) {
//     console.error("Error sending notification:", error);
//     throw new Error(error.message);
//   }
// };

// module.exports = { sendNotification };
