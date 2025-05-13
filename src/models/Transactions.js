const { Schema, model } = require("mongoose");

const schema = new Schema(
  {
    wallet_id: {
      type: Schema.Types.ObjectId,
      ref: "Wallet"
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: ["top-up", "ride-payment", "withdraw", "refund"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "success"
    },
    reference: {
      type: String // Stripe paymentIntent ID or internal reference
    },
    note: {
      type: String
    }
  },
  { timestamps: true }
);

const Transaction = model("Transaction", schema);
module.exports = Transaction;
