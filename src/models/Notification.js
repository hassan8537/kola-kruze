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
      enum: ["payment", "ride", "user", "vehicle", "review", "chat"],
      required: true
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread"
    },
    model_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    model_type: {
      type: String,
      enum: ["payment", "ride", "user", "vehicle", "review", "chat"],
      required: true
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

module.exports = Notification;
