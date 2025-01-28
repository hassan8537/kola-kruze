const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const driverVerification = async (request, response, next) => {
  try {
    const isDriver = request.user.role === "driver";

    if (!isDriver) {
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

module.exports = driverVerification;
