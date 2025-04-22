exports.formatStripeList = (array) => {
  return array.map((item) => ({
    id: item.id,
    brand: item.card.brand,
    last4: item.card.last4
  }));
};
