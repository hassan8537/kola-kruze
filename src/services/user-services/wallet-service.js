const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);

const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const Transaction = require("../../models/Transactions");
const { handlers } = require("../../utilities/handlers/handlers");
const walletSchema = require("../../schemas/wallet-schema");

class Service {
  constructor() {
    this.user = User;
    this.wallet = Wallet;
    this.transaction = Transaction;
  }

  async addFunds(req, res) {
    try {
      const { user: current_user, body } = req;
      const { funds } = body;

      if (!funds) {
        return handlers.response.failed({
          res,
          message: "Funds amount is required"
        });
      }

      const wallet = await this.wallet.findOne({
        user_id: current_user._id
      });

      if (!wallet) {
        return handlers.response.failed({
          res,
          message: "Wallet not found"
        });
      }

      const amountInCents = Math.round(Number(funds) * 100);

      // Create PaymentIntent with automatic handling of 3D Secure
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        customer: current_user.stripe_customer_id,
        payment_method: current_user.stripe_default_card_id,
        confirm: true,
        metadata: {
          user_id: current_user._id.toString(),
          purpose: "kruze-kash-top-up"
        },
        // Optional: Add a return_url if you plan to handle redirects
        return_url: process.env.YOUR_RETURN_URL
      });

      // Handle different payment statuses
      if (
        paymentIntent.status === "requires_action" ||
        paymentIntent.status === "requires_source_action"
      ) {
        // This means the payment requires authentication (e.g., 3D Secure)
        return handlers.response.failed({
          res,
          message:
            "Payment requires further authentication. Please complete the payment process."
        });
      }

      if (paymentIntent.status !== "succeeded") {
        // If payment isn't successful, return an error response
        return handlers.response.failed({
          res,
          message: `Payment failed with status: ${paymentIntent.status}`
        });
      }

      // Update wallet balance
      wallet.available_balance += Number(funds);
      await wallet.save();

      // Log the transaction in the database
      await this.transaction.create({
        wallet_id: wallet._id,
        user_id: current_user._id,
        type: "top-up",
        amount: Number(funds),
        status: "success",
        reference: paymentIntent.id,
        note: "Top-up via Stripe"
      });

      handlers.logger.success({
        object_type: "wallet-top-up",
        message: `User ${current_user._id} topped up $${funds}`,
        data: wallet
      });

      // Send successful response
      return handlers.response.success({
        res,
        message: "Funds added to Kruze Kash wallet successfully",
        data: wallet
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "wallet-top-up",
        message: error.message
      });
      return handlers.response.error({
        res,
        message: "Something went wrong while adding funds"
      });
    }
  }

  async getMyWallet(req, res) {
    try {
      const { user: current_user } = req;

      const wallet = await this.wallet
        .findOne({
          user_id: current_user._id
        })
        .populate(walletSchema.populate);

      if (!wallet) {
        return handlers.response.failed({
          res,
          message: "Wallet not found"
        });
      }

      handlers.logger.success({
        object_type: "wallet",
        message: `Wallet fetched successfully`,
        data: wallet
      });

      // Send successful response
      return handlers.response.success({
        res,
        object_type: "wallet",
        message: `Wallet fetched successfully`,
        data: wallet
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "wallet",
        message: error.message
      });
      return handlers.response.error({
        res,
        message: "Something went wrong while fetching funds"
      });
    }
  }

  async instantTransfer(req, res) {
    try {
      const driverId = req.user._id;
      const driverStripeAccountId = req.user.stripe_account_id;
      const externalAccountId = req.user.stripe_default_card_id; // must be external account added to driverStripeAccountId
      const amount = req.body.amount;

      const accounts = await stripe.accounts.listExternalAccounts(
        driverStripeAccountId,
        {
          object: "card"
        }
      );

      const driverWallet = await this.wallet.findOne({ user_id: driverId });

      if (driverWallet.available_balance < amount) {
        return handlers.response.failed({
          res,
          message: "Insufficent wallet funds"
        });
      }

      const transferAmountInCents = Math.round(amount * 100);

      // Step 1: Create a payout from connected account to their external account (card/bank)
      // const payout = await stripe.payouts.create(
      //   {
      //     amount: transferAmountInCents,
      //     currency: "usd",
      //     method: "instant",
      //     // destination: externalAccountId, // Must be an external account linked to the connected account
      //     metadata: {
      //       driver_id: driverId.toString(),
      //       purpose: "instant-card-payout"
      //     }
      //   },
      //   {
      //     stripeAccount: driverStripeAccountId // Act on behalf of connected account
      //   }
      // );

      const payout = await stripe.payouts.create(
        {
          amount: 1000, // amount in cents, e.g. $10.00
          currency: "usd",
          method: "instant" // request instant payout to debit card
        },
        {
          stripeAccount: driverStripeAccountId // connected account ID
        }
      );

      // Log transaction or save to DB (mocked below, you should replace with actual DB logic)
      await this.transaction.create({
        wallet_id: req.user.wallet_id, // You must ensure this is part of the user session
        user_id: driverId,
        type: "instant-transfer",
        amount: amount,
        status: "success",
        reference: payout.id,
        note: `Instant payout to external card ${externalAccountId}`
      });

      return handlers.response.success({
        res,
        message: "Instant transfer to card successful",
        data: payout
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
