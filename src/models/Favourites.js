const { Schema, model } = require("mongoose");

const favouriteSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      default: null
    },
    driver_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      trim: true,
      default: null
    }
  },
  { timestamps: true }
);

const Favourite = model("Favourite", favouriteSchema);
module.exports = Favourite;
