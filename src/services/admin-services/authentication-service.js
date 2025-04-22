const User = require("../../models/User");
const bcrypt = require("bcryptjs");
const { createSession } = require("../../utilities/handlers/session-handler");
const userSchema = require("../../schemas/user-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
  }

  async signIn(request, response) {
    try {
      const { email_address, password } = request.body;

      const admin = await this.user
        .findOne({ email_address, role: "admin" })
        .populate(userSchema.populate);

      if (!admin) {
        const payload = {
          object_type: "admin_login",
          message: "Invalid credentials."
        };
        handlers.logger.failed(payload);
        return handlers.response.failed({
          res: response,
          message: "Invalid credentials."
        });
      }

      const isPasswordMatched = await bcrypt.compare(password, admin.password);

      if (!isPasswordMatched) {
        const payload = {
          object_type: "admin_login",
          message: "Invalid credentials."
        };
        handlers.logger.failed(payload);
        return handlers.response.failed({ res: response, ...payload });
      }

      await createSession({ response, user: admin });

      const payload = {
        object_type: "admin_login",
        message: "Logged in successfully.",
        data: admin
      };
      handlers.logger.success(payload);
      return handlers.response.success({ res: response, ...payload });
    } catch (error) {
      const payload = {
        object_type: "admin_login",
        message: error.message
      };
      handlers.logger.error(payload);
      return handlers.response.error({ res: response, ...payload });
    }
  }
}

module.exports = new Service();
