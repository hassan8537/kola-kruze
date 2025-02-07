const User = require("../../models/User");
const {
  errorResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
  }

  async updateRatePerStop(request, response) {
    try {
      const user_id = request.user._id;

      const { rate_per_stop } = request.body;

      await this.user.findByIdAndUpdate(user_id, {
        rate_per_stop
      });

      return successResponse({
        response,
        message: "Rate per stop updated successfully.",
        data: { rate_per_stop: Number(rate_per_stop) }
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
