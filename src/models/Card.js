const mongoose = require("mongoose");

const CardSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    card_type: {
      type: String
    },
    stripe_card_id: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

CardSchema.index({
  _id: 1,
  card_type: 1
});

const Card = mongoose.model("Card", CardSchema);
module.exports = Card;
