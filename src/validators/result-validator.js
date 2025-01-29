const { validationResult } = require("express-validator");
const { failedResponse } = require("../utilities/handlers/response-handler");

const validateResult = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg)[0];
    return failedResponse({ response, message: messages });
  }
  next();
};

module.exports = validateResult;
