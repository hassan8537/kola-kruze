const stripeSecretKey = require("../../config/stripe");
const User = require("../../models/User");
const { errorResponse } = require("../../utilities/handlers/response-handler");

const stripe = require("stripe")(stripeSecretKey);

class Service {
  constructor() {
    this.user = User;
  }

  async setupStripeMerchant(req, res) {
    try {
      const user_id = req.user._id;
      let user = await this.user.findById(user_id);

      if (!user.stripe_merchant_id) {
        const account = await stripe.accounts.create({
          type: "express",
          email: req.user.email,
          capabilities: {
            transfers: { requested: true }
          }
        });

        user.stripe_merchant_id = account.id;
        await user.save();
      }

      const account = await stripe.accounts.retrieve(user.stripe_merchant_id);

      if (account.capabilities.transfers === "active") {
        return handleResponse(
          res,
          200,
          0,
          "You have already set up your Stripe account"
        );
      }

      const accountLink = await stripe.accountLinks.create({
        account: user.stripe_merchant_id,
        refresh_url: `${process.env.BASE_URL}/merchant/setup`,
        return_url: `${process.env.BASE_URL}/merchant/thank-you`,
        type: "account_onboarding"
      });

      return {
        code: 200,
        status: 1,
        message: "Please complete your Stripe merchant setup.",
        data: { url: accountLink.url }
      };
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
