const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      required: true
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      required: true
    },
    text: {
      type: String,
      trim: true,
      default: null
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        trim: true,
        default: []
      }
    ],
    is_read: {
      type: String,
      default: false
    }
  },
  { timestamps: true }
);

ChatSchema.index({ sender_id: 1, receiver_id: 1 });

const Chat = mongoose.model("Chat", ChatSchema);
module.exports = Chat;
