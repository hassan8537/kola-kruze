const { validationResult } = require("express-validator");
const { failedResponse } = require("../utilities/handlers/response-handler");

const validateResult = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const messages = errors.array();
    return failedResponse({ response, message: messages });
  }
  next();
};

module.exports = validateResult;
