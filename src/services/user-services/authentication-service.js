const Student = require("../../models/Student");
const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const { generateOTP } = require("../../utilities/generators/otp-generator");
const {
  errorResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");
const { createSession } = require("../../utilities/handlers/session-handler");

class Service {
  constructor() {
    this.user = User;
    this.student = Student;
  }

  async emailAuthentication(request, response) {
    try {
      const { email_address, role, device_token } = request.body;

      let user = await this.user.findOne({ email_address });

      if (user) {
        user.device_token = device_token;
        user.is_verified = false;
      } else {
        user = new this.user({ email_address, role, device_token });
      }

      await user.save();
      await user.populate(populateUser.populate);

      await createSession({ response, user });
      await generateOTP({ response, user_id: user._id });

      return successResponse({
        response,
        message: "Authentication successful",
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async socialAuthentication(request, response) {
    try {
      const {
        first_name,
        last_name,
        phone_number,
        social_token,
        role,
        auth_provider,
        device_token
      } = request.body;

      let user = await this.user.findOne({ social_token });

      if (!user) {
        const newUserData = {
          first_name,
          last_name,
          social_token,
          role,
          auth_provider,
          device_token,
          is_verified: true
        };

        if (auth_provider === "phone") newUserData.phone_number = phone_number;

        user = new this.user(newUserData);
        await user.save();
      }

      await user.populate(populateUser.populate);
      await createSession({ response, user });

      return successResponse({
        response,
        message: "Authentication successful",
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
