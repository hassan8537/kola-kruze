const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);
const User = require("../../models/User");
const {
  errorResponse,
  failedResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
  }

  async stripeSetupMerchantWebhook(request, response) {
    try {
      let event;
      const sig = request.headers["stripe-signature"];

      try {
        event = stripe.webhooks.constructEvent(
          request.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        return failedResponse({ response, message: "Webhook error." });
      }

      if (event.type === "account.updated") {
        const account = event.data.object;

        if (account.capabilities?.transfers === "active") {
          try {
            await User.findOneAndUpdate(
              { stripe_merchant_id: account.id },
              { is_merchant_setup: true }
            );
          } catch (error) {
            console.error("Error updating user:", error);
          }
        }
      }

      return successResponse({
        response,
        message: "Stripe setup webhook recieved successfully."
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async setupStripeMerchant(request, response) {
    try {
      const user_id = request.user._id;
      const user = await this.user.findById(user_id);

      // If merchant setup is already done, return response
      if (user.is_merchant_setup) {
        return failedResponse({ response, message: "Merchant already setup." });
      }

      // If stripe_merchant_id is missing, create a new Stripe account
      if (!user.stripe_merchant_id) {
        console.log("Creating new Stripe account...");
        const account = await stripe.accounts.create({
          type: "express",
          email: request.user.email_address,
          capabilities: { transfers: { requested: true } }
        });

        user.stripe_merchant_id = account.id;
        await user.save();
      }

      // Retrieve the Stripe account
      const account = await stripe.accounts.retrieve(user.stripe_merchant_id);
      console.log("Stripe Account Details:", account);

      // Check if transfers capability is active
      if (account.capabilities?.transfers === "active") {
        user.is_merchant_setup = true; // Update the field
        await user.save();

        return successResponse({
          response,
          message: "Merchant setup successfully.",
          data: { is_merchant_setup: true }
        });
      }

      // Generate Stripe onboarding link if setup is incomplete
      console.log("Generating Stripe onboarding link...");
      const accountLink = await stripe.accountLinks.create({
        account: user.stripe_merchant_id,
        refresh_url: `${process.env.BASE_URL}/merchant/setup`,
        return_url: `${process.env.BASE_URL}/merchant/thank-you`,
        type: "account_onboarding"
      });

      return successResponse({
        response,
        message: "Complete your Stripe merchant setup.",
        data: accountLink.url
      });
    } catch (error) {
      console.error("Stripe Setup Error:", error);
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
