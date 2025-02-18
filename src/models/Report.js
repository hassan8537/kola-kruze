const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    ride_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      default: null,
      trim: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      default: null,
      trim: true
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      required: true,
      default: null,
      trim: true
    },
    description: {
      type: String,
      required: true,
      default: null,
      trim: true
    },
    delivery_charges: {
      type: Number,
      required: true,
      default: 0,
      default: null,
      trim: true
    }
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", ReportSchema);
module.exports = Report;
