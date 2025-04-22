const { Schema, model } = require("mongoose");

const otpSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },
    type: {
      type: String,
      enum: ["email-verification"],
      required: true
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

const Otp = model("Otp", otpSchema);

module.exports = Otp;
