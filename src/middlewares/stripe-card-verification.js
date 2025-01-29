const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const stripeCardVerification = async (request, response, next) => {
  try {
    const stripeCardSetup = request.user.is_customer_id;

    if (stripeCardSetup) {
      return failedResponse({
        response,
        message: "Please setup your card."
      });
    }

    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = stripeCardVerification;
