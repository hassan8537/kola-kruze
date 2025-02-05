require("dotenv").config();
const stripeSecretKey =
  process.env.NODE_ENV === "development"
    ? process.env.TEST_STRIPE_SECRET_KEY
    : process.env.LIVE_STRIPE_SECRET_KEY;
console.log({ stripeSecretKey });

module.exports = stripeSecretKey;
