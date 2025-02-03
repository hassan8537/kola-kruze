const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stripe_card_id: { type: String, required: true }
  },
  { timestamps: true }
);

const Card = mongoose.model("Card", CardSchema);
module.exports = Card;
