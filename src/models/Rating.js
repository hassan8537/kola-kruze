const mongoose = require("mongoose");

const RatingSchema = new mongoose.Schema(
  {
    ride_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ["user-to-driver", "driver-to-user"]
    },
    reviewer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: null }
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", RatingSchema);
module.exports = Rating;
