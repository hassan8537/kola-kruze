const mongoose = require("mongoose");

// const mongoURI = "mongodb://127.0.0.1:27017/kola-kruze";
const mongoURI =
  "mongodb://user_kola-kruze:Abcd%401234@client1.appsstaging.com:27017/kola-kruze?authSource=kola-kruze&authMechanism=SCRAM-SHA-256";
const mode = process.env.NODE_ENV;

const connectToDatabase = async () => {
  try {
    const options = {
      ...(mode === "production"
        ? {
            user: process.env.MONGODB_USERNAME,
            pass: process.env.MONGODB_PASSWORD
          }
        : {})
    };

    await mongoose.connect(mongoURI, options);
    console.log("MongoDB connected successfully.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1); // Exit the process if the connection fails
  }
};

module.exports = connectToDatabase;
