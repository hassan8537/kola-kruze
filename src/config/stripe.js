const stripeSecretKey =
  process.env.NODE_ENV === "production"
    ? process.env.TEST_STRIPE_SECRET_KEY
    : process.env.LIVE_STRIPE_SECRET_KEY;

module.exports = stripeSecretKey;
