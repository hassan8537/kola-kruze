const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const {
  errorResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
  }

  async toggleDriverAvailability(request, response) {
    try {
      const user = request.user;

      if (!user.is_available) {
        user.is_available = true;
      } else {
        user.is_available = false;
      }

      await user.save();
      await user.populate(populateUser.populate);

      return successResponse({
        response,
        message: `You are ${user.is_available ? "available" : "unavailable"}`,
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
