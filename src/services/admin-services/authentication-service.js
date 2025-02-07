const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const { generateToken } = require("../../utilities/generators/token-generator");
const {
  errorResponse,
  successResponse,
  failedResponse
} = require("../../utilities/handlers/response-handler");
const bcrypt = require("bcryptjs");
const { createSession } = require("../../utilities/handlers/session-handler");

class Service {
  constructor() {
    this.user = User;
  }

  async adminAuthentication(request, response) {
    try {
      const { email_address, password } = request.body;

      const admin = await this.user
        .findOne({ email_address: email_address })
        .populate(populateUser.populate);

      if (!admin)
        return failedResponse({
          response,
          message: "Invalid credentials."
        });

      const isPasswordMatched = await bcrypt.compare(password, admin.password);

      if (!isPasswordMatched)
        return failedResponse({
          response,
          message: "Invalid credentials."
        });

      await createSession({
        response: response,
        user: admin
      });

      return successResponse({
        response,
        message: "Logged in successfully.",
        data: admin
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
