const { Schema, model } = require("mongoose");

const CardSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    stripe_card_id: { type: String, required: true }
  },
  { timestamps: true }
);

const Card = model("Card", CardSchema);
module.exports = Card;
