const User = require("../../models/User");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
  }

  async updateRatePerStop(req, res) {
    try {
      const user_id = req.user._id;

      const { rate_per_stop } = req.body;

      await this.user.findByIdAndUpdate(user_id, {
        rate_per_stop
      });

      handlers.logger.success({
        object_type: "update-rate-per-stop",
        message: "Rate per stop updated successfully.",
        data: { rate_per_stop: Number(rate_per_stop) }
      });

      return handlers.response.success({
        res,
        message: "Rate per stop updated successfully.",
        data: { rate_per_stop: Number(rate_per_stop) }
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "update-rate-per-stop",
        message: error
      });

      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
