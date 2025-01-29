const {
  errorResponse,
  failedResponse
} = require("../utilities/handlers/response-handler");

const stripeMerchantVerification = async (request, response, next) => {
  try {
    const stripeMerchantSetup = request.user.is_merchant_setup;

    if (stripeMerchantSetup) {
      return failedResponse({
        response,
        message: "Please setup your merchant."
      });
    }

    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = stripeMerchantVerification;
