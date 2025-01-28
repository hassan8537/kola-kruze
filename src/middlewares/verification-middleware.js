const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const requestVerification = async (request, response, next) => {
  try {
    const verificationStatus = request.user.is_verified;

    if (!verificationStatus) {
      return failedResponse({
        response,
        message: "Unverified request. Verify your account."
      });
    }

    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = requestVerification;
