const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    available_balance: {
      type: Number,
      default: 0
    },
    total_expense: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: "usd"
    }
  },
  {
    timestamps: true
  }
);

const Wallet = model("Wallet", schema);
module.exports = Wallet;
