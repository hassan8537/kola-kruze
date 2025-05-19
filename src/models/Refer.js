const mongoose = require("mongoose");

const referralSchema = new mongoose.Schema(
  {
    referrer_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    referred_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    points_awarded: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    }
  },
  {
    collection: "referrals",
    timestamps: true
  }
);

const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;
