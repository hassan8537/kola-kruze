const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema({
  sender_id: {
    type: String,
    required: true,
    trim: true
  },
  receiver_id: {
    type: String,
    required: true,
    trim: true
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
});

ChatSchema.index({ sender_id: 1, receiver_id: 1 });

const Chat = mongoose.model("Chat", ChatSchema);
module.exports = Chat;
