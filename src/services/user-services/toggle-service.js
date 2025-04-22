const User = require("../../models/User");
const userSchema = require("../../schemas/user-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
  }

  async toggleDriverAvailability(req, res) {
    try {
      const user = req.user;

      user.is_available = !user.is_available;

      await user.save();
      await user.populate(userSchema.populate);

      const statusText = user.is_available ? "available" : "unavailable";

      handlers.logger.success({
        object_type: "user",
        message: `You are ${statusText}`,
        data: user
      });

      return handlers.response.success({
        res: res,
        message: `You are ${statusText}`,
        data: user
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "user",
        message: "Failed to toggle availability",
        data: error?.message
      });

      return handlers.response.error({ res: res, error });
    }
  }
}

module.exports = new Service();
