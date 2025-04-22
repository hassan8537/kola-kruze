const Otp = require("../../models/Otp");
const User = require("../../models/User");
const { handlers } = require("../../utilities/handlers/handlers");
const { generateOTP } = require("../../utilities/generators/otp-generator");
const otpSchema = require("../../schemas/otp-schema");
const userSchema = require("../../schemas/user-schema");

class Service {
  constructor() {
    this.otp = Otp;
    this.user = User;
  }

  async verifyOTP(req, res) {
    const object_type = "otp-verification";
    try {
      const { user_id, otp_code } = req.body;

      const existingOTPCode = await this.otp.findOne({
        user_id: user_id,
        otp_code: otp_code,
        type: "email-verification"
      });

      if (!existingOTPCode) {
        handlers.logger.failed({
          object_type,
          message: "Invalid OTP code."
        });
        return handlers.response.failed({
          res: res,
          message: "Invalid OTP code."
        });
      } else {
        const user = await this.user
          .findById(user_id)
          .populate(userSchema.populate);

        if (!user) {
          handlers.logger.unavailable({
            object_type,
            message: "No user found."
          });
          return handlers.response.unavailable({
            res: res,
            message: "No user found."
          });
        } else {
          user.is_verified = true;
          await user.save();

          await this.otp.findOneAndDelete({ user_id: user._id });

          handlers.logger.success({
            object_type,
            message: "OTP verification successful.",
            data: { user_id, user }
          });

          return handlers.response.success({
            res: res,
            message: "OTP verification successful.",
            data: user
          });
        }
      }
    } catch (error) {
      handlers.logger.error({
        object_type,
        message: error
      });
      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async resendOTP(request, response) {
    const object_type = "resend-otp";

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

      handlers.logger.success({
        object_type,
        message: "OTP resent successfully."
      });
    } catch (error) {
      handlers.logger.error({
        object_type,
        message: error
      });
      return handlers.response.error({
        res: response,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
