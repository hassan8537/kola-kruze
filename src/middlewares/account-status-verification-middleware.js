const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const accountStatusVerification = async (request, response, next) => {
  try {
    const accountStatus = request.user.is_deleted;

    if (accountStatus) {
      return failedResponse({
        response,
        message:
          "You account was marked deleted. Contact admin to recover your account."
      });
    }

    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = accountStatusVerification;
