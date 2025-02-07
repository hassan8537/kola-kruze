const User = require("../models/User");
const {
  errorResponse,
  failedResponse,
  unauthorizedResponse
} = require("../utilities/handlers/response-handler");
const jwt = require("jsonwebtoken");

const sessionAuthentication = async (request, response, next) => {
  try {
    const bearerToken =
      request.headers["authorization"] || request.cookies.authorization;

    if (!bearerToken) {
      return failedResponse({ response, message: "Invalid session." });
    }

    const token = bearerToken.includes("Bearer")
      ? bearerToken.split(" ")[1]
      : bearerToken;

    const verifiedToken = jwt.verify(token, process.env.SESSION_SECRET_KEY);

    console.log({ verifiedToken: verifiedToken.user_id });

    const user = await User.findById(verifiedToken.user_id);

    if (!user) {
      return unauthorizedResponse({
        response,
        message: "Unauthorized request."
      });
    }

    request.user = user;
    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = sessionAuthentication;
