const express = require("express");
const sessionAuthentication = require("../../middlewares/authentication-middleware");
const app = express();

const authRoutes = require("./authentication-routes");
const profileRoutes = require("./profile-routes");
const studentRoutes = require("./student-routes");
const vehicleRoutes = require("./vehicle-routes");
const categoryRoutes = require("./category-routes");
const rideRoutes = require("./ride-routes");
const accountStatusVerification = require("../../middlewares/account-status-verification-middleware");
const adminVerification = require("../../middlewares/admin-verification-middleware");

// 🔹 Apply Global Middlewares
const middlewares = [
  sessionAuthentication,
  adminVerification,
  accountStatusVerification
];

// 🔹 Register Routes
app.use("/api/v1/admin/auth", authRoutes);
app.use("/api/v1/admin/profiles", middlewares, profileRoutes);
app.use("/api/v1/admin/students", middlewares, studentRoutes);
app.use("/api/v1/admin/rides", middlewares, rideRoutes);
app.use("/api/v1/admin/vehicles", middlewares, vehicleRoutes);
app.use("/api/v1/admin/categories", middlewares, categoryRoutes);

module.exports = app;
