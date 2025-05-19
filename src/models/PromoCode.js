const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    code: {
      type: String,
      trim: true
    },
    discount: {
      type: Number
    },
    total_use: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

const Promocode = model("Promocode", schema);
module.exports = Promocode;
