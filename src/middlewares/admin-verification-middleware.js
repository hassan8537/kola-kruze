const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const adminVerification = async (request, response, next) => {
  try {
    const isAdmin = request.user.role === "admin";

    if (!isAdmin) {
      return failedResponse({
        response,
        message: "Unauthorized request."
      });
    }

    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = adminVerification;
