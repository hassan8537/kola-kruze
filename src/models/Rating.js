const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    ride_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    user_to_driver_rating: { type: Number, min: 1, max: 5, default: null },
    user_feedback: { type: String, default: null },

    driver_to_user_rating: { type: Number, min: 1, max: 5, default: null },
    driver_feedback: { type: String, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Rating", RatingSchema);
