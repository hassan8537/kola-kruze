const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      ref: "User"
    },
    file_name: {
      type: String,
      required: true
    },
    file_type: {
      type: String,
      required: true,
      default: "application/octet-stream"
    },
    file_url: {
      type: String,
      required: true
    },
    file_size: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    collection: "files",
    timestamps: true
  }
);

const File = mongoose.model("File", FileSchema);
module.exports = File;
