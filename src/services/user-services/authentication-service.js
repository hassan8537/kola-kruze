const Student = require("../../models/Student");
const User = require("../../models/User");
const { generateOTP } = require("../../utilities/generators/otp-generator");
const {
  errorResponse,
  successResponse,
  failedResponse
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

      const user = await this.user.findOne({
        email_address: email_address
      });

      if (user) {
        await createSession({
          response: response,
          user: user
        });

        user.device_token = device_token;
        user.is_verified = false;
        await user.save();

        await generateOTP({ response, user_id: user._id });
      } else {
        const newUser = await this.user.create({
          email_address: email_address,
          role: role,
          device_token: device_token
        });

        if (!newUser) {
          return failedResponse({
            response,
            message: "Failed to authenticate user"
          });
        } else {
          await createSession({
            response,
            user: newUser
          });

          await generateOTP({ response, user_id: newUser._id });
        }
      }
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async socialAuthentication(request, response) {
    try {
      const { phone_number, social_token, role, auth_provider, device_token } =
        request.body;

      const user = await this.user.findOne({
        social_token: social_token
      });

      if (user) {
        await createSession({
          response,
          user: user
        });

        user.device_token = device_token;
        await user.save();

        return successResponse({
          response,
          message: "Authentication successful"
        });
      } else {
        let newUser;

        if (auth_provider === "phone") {
          newUser = await this.user.create({
            phone_number: phone_number,
            social_token: social_token,
            role: role,
            auth_provider: auth_provider,
            device_token: device_token,
            is_verified: true
          });
        } else {
          newUser = await this.user.create({
            social_token: social_token,
            role: role,
            auth_provider: auth_provider,
            device_token: device_token,
            is_verified: true
          });
        }

        if (!newUser) {
          return failedResponse({
            response,
            message: "Failed to authenticate user"
          });
        } else {
          await createSession({
            response,
            user: newUser
          });

          return successResponse({
            response,
            message: "Authentication successful"
          });
        }
      }
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
