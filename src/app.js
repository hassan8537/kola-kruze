const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const sessionAuthentication = require("./middlewares/authentication-middleware");
const requestVerification = require("./middlewares/verification-middleware");
const adminVerification = require("./middlewares/admin-verification-middleware");
const accountStatusVerification = require("./middlewares/account-status-verification-middleware");
const adminSeeder = require("./middlewares/admin-seeder-middleware");
const connectToDatabase = require("./config/database");

require("dotenv").config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("tiny"));
app.use(adminSeeder);

const adminRoutes = {
  authentication: require("./routes/admin-routes/authentication-routes"),
  protected: require("./routes/admin-routes/protected-routes")
};

const userRoutes = {
  authentication: require("./routes/user-routes/authentication-routes"),
  otp: require("./routes/user-routes/otp-routes"),
  protected: require("./routes/user-routes/protected-routes")
};

app.use(
  `/api/${process.env.API_VERSION}/admin/auth`,
  adminRoutes.authentication
);

app.use(`/api/${process.env.API_VERSION}/admin`, [
  sessionAuthentication,
  accountStatusVerification,
  adminVerification,
  adminRoutes.protected
]);

app.use(`/api/${process.env.API_VERSION}/auth`, userRoutes.authentication);
app.use(`/api/${process.env.API_VERSION}/otps`, userRoutes.otp);

app.use(`/api/${process.env.API_VERSION}`, [
  sessionAuthentication,
  accountStatusVerification,
  requestVerification,
  userRoutes.protected
]);

const PORT = process.env.PORT || 3002;

connectToDatabase()
  .then(() => {
    console.log("Database connected successfully.");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  });

module.exports = app;
