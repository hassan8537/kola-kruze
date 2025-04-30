const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        "payment",
        "user",
        "vehicle",
        "review",
        "chat",
        "instant-ride",
        "schedule-ride",
        "share-ride"
      ],
      required: true
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread"
    },
    model_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "model_type"
    },
    model_type: {
      type: String,
      required: true,
      enum: [
        "Payment",
        "Ride",
        "User",
        "Vehicle",
        "Rating",
        "Chat",
        "RideInvite"
      ]
    },
    model_action: {
      type: String,
      enum: ["accepted", "rejected"]
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
