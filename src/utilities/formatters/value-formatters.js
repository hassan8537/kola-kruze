const { default: mongoose } = require("mongoose");

exports.sanitizeNumber = ({ field, value }) => {
  try {
    console.log({ value });

    if (!value) throw new Error(`Invalid ${field}`);

    const sanitizedNumber = value.replace(/\D/g, "");

    if (!sanitizedNumber) throw new Error(`Failed to sanitize ${field}`);

    return sanitizedNumber;
  } catch (error) {
    console.error(error);
    return error.message;
  }
};

exports.convertToObjectId = (_id) => {
  return new mongoose.Types.ObjectId(`${_id}`);
};

exports.formatStripeList = (array) => {
  const [card] = array.map((item) => {
    return {
      id: item.id,
      brand: item.card.brand,
      last4: item.card.last4
    };
  });

  return card;
};
