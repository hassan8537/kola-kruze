const sendEmail = require("../../config/nodemailer");
const OTP = require("../../models/OTP");
const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const {
  errorResponse,
  successResponse,
  failedResponse
} = require("../handlers/response-handler");
const crypto = require("crypto");
require("dotenv").config();

exports.generateOTP = async ({ response, user_id }) => {
  try {
    // const otp_code = crypto.randomInt(100000, 1000000).toString();
    const otp_code = process.env.OTP_CODE;

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    const user = await User.findById(user_id).populate(populateUser.populate);

    if (!user_id) {
      return failedResponse({
        response,
        message: "No user found."
      });
    }

    const existingOTPCode = await OTP.findOne({
      user_id: user._id
    });

    if (existingOTPCode) {
      await OTP.findOneAndDelete({ user_id: user._id });
    }

    const newOTP = await OTP.create({
      user_id: user_id,
      otp_code: otp_code,
      otp_expiration: expirationTime
    });

    if (!newOTP) {
      return failedResponse({
        response,
        message: "Failed to generate OTP."
      });
    }

    await sendEmail({
      to: user.email_address,
      subject: "OTP Verification.",
      text: `This is your verification OTP: ${otp_code}`
    });

    user.is_verified = false;
    await user.save();

    return successResponse({
      response,
      message: "A verification OTP has been sent to your email address.",
      data: user
    });
  } catch (error) {
    return errorResponse({ response, error });
  }
};
