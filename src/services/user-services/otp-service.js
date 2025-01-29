const OTP = require("../../models/OTP");
const User = require("../../models/User");
const {
  errorResponse,
  failedResponse,
  successResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");
const { generateOTP } = require("../../utilities/generators/otp-generator");
const { populateUser } = require("../../populate/populate-models");

class Service {
  constructor() {
    this.otp = OTP;
    this.user = User;
  }

  async verifyOTP(request, response) {
    try {
      const { user_id, otp_code } = request.body;

      const existingOTPCode = await this.otp.findOne({
        user_id: user_id,
        otp_code: otp_code
      });

      if (!existingOTPCode) {
        return failedResponse({ response, message: "Invalid OTP code." });
      } else {
        const user = await this.user
          .findById(user_id)
          .populate(populateUser.populate);

        if (!user) {
          return unavailableResponse({
            response,
            message: "No user found."
          });
        } else {
          user.is_verified = true;
          await user.save();

          await this.otp.findOneAndDelete({ user_id: user._id });

          return successResponse({
            response,
            message: "OTP verification successful.",
            data: user
          });
        }
      }
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async resendOTP(request, response) {
    try {
      const { user_id } = request.params;

      const existingOTPCode = await this.otp.findOne({
        user_id
      });

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 10);

      if (existingOTPCode) {
        await this.otp.deleteOne({ user_id });
      }

      await generateOTP({ response, user_id });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
