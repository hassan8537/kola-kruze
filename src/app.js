require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const adminSeeder = require("./middlewares/admin-seeder-middleware");
const sessionAuthentication = require("./middlewares/authentication-middleware");
const accountStatusVerification = require("./middlewares/account-status-verification-middleware");
const adminVerification = require("./middlewares/admin-verification-middleware");
const requestVerification = require("./middlewares/verification-middleware");

const authRoutes = {
  admin: {
    authentication: require("./routes/admin-routes/authentication-routes")
  },
  user: {
    authentication: require("./routes/user-routes/authentication-routes"),
    otp: require("./routes/user-routes/otp-routes")
  }
};

const protectedRoutes = {
  admin: require("./routes/admin-routes/protected-routes"),
  user: require("./routes/user-routes/protected-routes")
};

const connectToDatabase = require("./config/database");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(adminSeeder);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), { maxAge: "1d" })
);

// Admin Routes
app.use(
  `/api/${process.env.API_VERSION}/admin/auth`,
  authRoutes.admin.authentication
);
app.use(`/api/${process.env.API_VERSION}/admin`, [
  sessionAuthentication,
  accountStatusVerification,
  adminVerification,
  protectedRoutes.admin
]);

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

const io = new Server(server);

io.on("connection", (socket) => {
  console.log("New WebSocket connection:", socket.id);
  socket.on("disconnect", () => {
    console.log("WebSocket disconnected:", socket.id);
  });
});

// Pass io to service instances
const rideService = require("./services/user-services/ride-service");
const driverService = require("./services/user-services/driver-service");
const chatService = require("./services/user-services/chat-service");

rideService.io = io;
driverService.io = io;
chatService.io = io;

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  // Ride Events
  socket.on("ride-request", (data) => rideService.rideRequest(socket, data));
  socket.on("ride-request-response", (data) =>
    rideService.rideRequestResponse(socket, data)
  );
  socket.on("ride-status-update", (data) =>
    rideService.rideStatusUpdate(socket, data)
  );
  socket.on("share-ride", (data) => rideService.shareRide(socket, data));
  socket.on("ride-location-update", (data) =>
    rideService.rideLocationUpdate(socket, data)
  );

  // Driver Events
  socket.on("driver-availability", (data) =>
    driverService.driverAvailability(socket, data)
  );
  socket.on("driver-location-update", (data) =>
    driverService.driverLocationUpdate(socket, data)
  );
  socket.on("driver-ride-completed", (data) =>
    driverService.driverRideCompleted(socket, data)
  );

  // Chat Events
  socket.on("get-chats", (data) => chatService.getChats(socket, data));
  socket.on("chat-message", (data) => chatService.chatMessage(socket, data));
  socket.on("chat-typing", (data) => chatService.chatTyping(socket, data));
  socket.on("chat-seen", (data) => chatService.chatSeen(socket, data));

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

connectToDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });

module.exports = app;
