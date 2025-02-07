const { Schema, model } = require("mongoose");

const CategorySchema = new Schema({
  name: {
    type: String,
    trime: true,
    required: true
  },
  image: {
    type: Schema.Types.ObjectId,
    ref: "File",
    default: null
  },
  rate_per_mile: {
    type: Number,
    trime: true,
    default: 0
  },
  passenger_limit: {
    type: Number,
    trime: true,
    default: 4
  }
});

CategorySchema.index({ name: 1 });

const Category = model("Category", CategorySchema);
module.exports = Category;
