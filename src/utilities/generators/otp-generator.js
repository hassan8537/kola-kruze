const sendEmail = require("../../config/nodemailer");
const Otp = require("../../models/Otp");
const User = require("../../models/User");
const userSchema = require("../../schemas/user-schema");
const { handlers } = require("../handlers/handlers");
const crypto = require("crypto");
require("dotenv").config();

exports.generateOTP = async ({ response, user_id }) => {
  try {
    // const otp_code = crypto.randomInt(100000, 1000000).toString();
    const otp_code = process.env.OTP_CODE;

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    const user = await User.findById(user_id).populate(userSchema.populate);

    if (!user_id || !user) {
      return handlers.response.unavailable({
        res: response,
        message: "No user found."
      });
    }

    await Otp.findOneAndDelete({ user_id: user._id });

    const newOTP = await Otp.create({
      user_id,
      otp_code,
      otp_expiration: expirationTime
    });

    if (!newOTP) {
      return handlers.response.failed({
        res: response,
        message: "Failed to generate OTP."
      });
    }

    await sendEmail({
      to: user.email_address,
      subject: "OTP Verification",
      text: `This is your verification OTP: ${otp_code}`
    });

    user.is_verified = false;
    await user.save();

    return handlers.response.success({
      res: response,
      message: "A verification OTP has been sent to your email address.",
      data: user
    });
  } catch (error) {
    return handlers.response.error({
      res: response,
      message: error.message
    });
  }
};
