require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const adminSeeder = require("./src/middlewares/admin-seeder-middleware");
const sessionAuthentication = require("./src/middlewares/authentication-middleware");
const accountStatusVerification = require("./src/middlewares/account-status-verification-middleware");
const adminVerification = require("./src/middlewares/admin-verification-middleware");
const requestVerification = require("./src/middlewares/verification-middleware");

const authRoutes = {
  user: {
    authentication: require("./src/routes/user-routes/authentication-routes"),
    otp: require("./src/routes/user-routes/otp-routes")
  }
};

const protectedRoutes = {
  admin: require("./src/routes/admin-routes/index-routes"),
  user: require("./src/routes/user-routes/protected-routes")
};

const connectToDatabase = require("./src/config/database");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(adminSeeder);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
console.log({ static_path: path.join(__dirname, "uploads") });

// Admin Routes
app.use(protectedRoutes.admin);

// User Routes
app.use(`/api/${process.env.API_VERSION}/auth`, authRoutes.user.authentication);
app.use(`/api/${process.env.API_VERSION}/otps`, authRoutes.user.otp);
app.use(`/api/${process.env.API_VERSION}`, [
  sessionAuthentication,
  accountStatusVerification,
  requestVerification,
  protectedRoutes.user
]);

const PORT = process.env.PORT || 3002;

console.log({ mode: process.env.NODE_ENV });

let server;

if (process.env.NODE_ENV === "production") {
  try {
    const options = {
      key: fs.readFileSync(
        "/etc/letsencrypt/live/client1.appsstaging.com/privkey.pem"
      ),
      cert: fs.readFileSync(
        "/etc/letsencrypt/live/client1.appsstaging.com/cert.pem"
      ),
      ca: fs.readFileSync(
        "/etc/letsencrypt/live/client1.appsstaging.com/chain.pem"
      )
    };
    server = require("https").createServer(options, app);
  } catch (error) {
    console.error("SSL certificate files are missing or incorrect:", error);
    process.exit(1);
  }
} else {
  server = require("http").createServer(app);
}

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: false,
    transports: ["websocket", "polling"],
    allowEIO3: true
  }
});

// global.io = io;

io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  socket.on("disconnect", () => {
    console.log("WebSocket disconnected:", socket.id);
  });
});

// Pass io to service instances
const rideService = require("./src/services/user-services/ride-service");
const chatService = require("./src/services/user-services/chat-service");

const Ride = require("./src/models/Ride");

rideService.io = io;
chatService.io = io;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Ride Events
  socket.on("join-room", (data) => rideService.joinRoom(socket, data));
  socket.on("request-a-ride", (data) => rideService.requestARide(socket, data));
  socket.on("cancel-a-ride", (data) => rideService.cancelARide(socket, data));
  socket.on("accept-a-ride", (data) => rideService.acceptARide(socket, data));
  socket.on("arrived-at-pickup", (data) =>
    rideService.arrivedAtPickup(socket, data)
  );
  socket.on("start-a-ride", (data) => rideService.startARide(socket, data));
  socket.on("end-a-ride", (data) => rideService.endARide(socket, data));

  socket.on("update-current-location", (data) =>
    rideService.updateCurrentLocation(socket, data)
  );
  socket.on("eta-to-pickup", (data) => rideService.etaToPickup(socket, data));
  socket.on("eta-to-dropoff", (data) => rideService.etaToDropOff(socket, data));

  socket.on("split-fare", (data) => rideService.shareRide(socket, data));
  socket.on("ride-location-update", (data) =>
    rideService.rideLocationUpdate(socket, data)
  );

  // Chat Events
  socket.on("get-chats", (data) => chatService.getChats(socket, data));
  socket.on("chat-message", (data) => chatService.chatMessage(socket, data));
  socket.on("chat-typing", (data) => chatService.chatTyping(socket, data));

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.delete(`/api/${process.env.API_VERSION}/rides`, async (req, res) => {
  await Ride.deleteMany({});
});

// Crones
// const cron = require("node-cron");
// cron.schedule("* * * * *", async () => {
//   try {
//     console.log("Crone running...");

//     const now = new Date();
//     // const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

//     const rides = await Ride.find({
//       ride_type: "scheduled",
//       ride_status: "scheduled"
//       // scheduled_at: { $lte: twoHoursFromNow }
//     });

//     if (!rides) {
//       console.error("No schedule rides yet");
//     }

//     for (const ride of rides) {
//       console.log(`🔍 Starting driver search for ride: ${ride._id}`);
//       const data = { ride_id: ride._id };
//       await rideService.requestARide(null, data);
//     }
//   } catch (err) {
//     console.error("❌ Cron job error:", err.message);
//   }
// });

// setInterval(async () => {
//   try {
//     console.log("Running every second");

//     const now = new Date();
//     // const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

//     const rides = await Ride.find({
//       ride_type: "scheduled",
//       ride_status: "pending"
//       // scheduled_at: { $lte: twoHoursFromNow }
//     });

//     for (const ride of rides) {
//       console.log(`🔍 Starting driver search for ride: ${ride._id}`);
//       const data = { ride_id: ride._id };
//       await rideService.requestARide(null, data);
//     }
//   } catch (err) {
//     console.error("❌ Interval error:", err.message);
//   }
// }, 5000); // 1000ms = 1 second

connectToDatabase()
  .then(() => {
    require("./src/models/RideInvite");
    require("./src/models/Payment");

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });
