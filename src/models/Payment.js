const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema(
  {
    ride_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    payment_method: {
      type: String,
      enum: ["credit-card", "debit-card", "paypal", "cash"],
      required: true
    },
    payment_status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending"
    },
    payment_date: {
      type: Date,
      default: Date.now
    },
    transaction_id: {
      type: String,
      required: true
    },
    tip_amount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

PaymentSchema.index({
  ride_id: 1,
  user_id: 1,
  payment_method: 1,
  payment_status: 1
});

const Payment = mongoose.model("Payment", PaymentSchema);
module.exports = Payment;
