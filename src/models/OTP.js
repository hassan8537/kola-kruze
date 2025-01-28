const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: "User"
    },
    otp_code: {
      type: Number,
      required: true
    },
    otp_expiration: {
      type: Date,
      required: true
    },
    is_used: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: "otps",
    timestamps: true
  }
);

const OTP = mongoose.model("OTP", OTPSchema);
module.exports = OTP;
