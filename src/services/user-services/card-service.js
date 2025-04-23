const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);
const Card = require("../../models/Card");
const User = require("../../models/User");
const cardSchema = require("../../schemas/card-schema");
const {
  formatStripeList
} = require("../../utilities/formatters/stripe-card-list-formatter");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
    this.card = Card;
  }

  async createCard(req, res) {
    const object_type = "add-card";
    try {
      const user = req.user;
      const { stripe_card_id } = req.body;

      if (!stripe_card_id) {
        handlers.logger.failed({
          object_type,
          message: "Stripe card id is required."
        });
        return handlers.response.failed({
          res,
          message: "Stripe card id is required."
        });
      }

      const existingAccount = await this.card
        .findOne({ user_id: user._id, stripe_card_id })
        .populate(cardSchema.populate);

      if (existingAccount) {
        handlers.logger.failed({
          object_type,
          message: "Stripe card already exists."
        });
        return handlers.response.failed({
          res,
          message: "Stripe card already exists."
        });
      }

      let stripeCustomer = user.stripe_customer_id;
      if (!stripeCustomer) {
        const customer = await stripe.customers.create({
          email: user.email_address
        });
        user.stripe_customer_id = customer.id;
        await user.save();
        stripeCustomer = customer.id;
      }

      const card = await stripe.customers.createSource(stripeCustomer, {
        source: stripe_card_id
      });

      await this.card.create({
        user_id: user._id,
        stripe_card_id: card.id
      });

      handlers.logger.success({
        object_type,
        message: "Card added successfully."
      });
      return handlers.response.success({
        res,
        message: "Card added successfully.",
        data: card
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getCards(req, res) {
    const object_type = "fetch-cards";
    try {
      const stripeCustomerId = req.user.stripe_customer_id;

      if (!stripeCustomerId) {
        handlers.logger.unavailable({
          object_type,
          message:
            "Stripe customer ID not found. Please setup your Stripe merchant"
        });
        return handlers.response.unavailable({
          res,
          message:
            "Stripe customer ID not found. Please setup your Stripe merchant"
        });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card"
      });

      if (!paymentMethods.data.length) {
        handlers.logger.unavailable({
          object_type,
          message: "No cards found."
        });
        return handlers.response.unavailable({
          res,
          message: "No cards found."
        });
      }

      const customer = await stripe.customers.retrieve(stripeCustomerId);
      const defaultPaymentMethod =
        customer.invoice_settings.default_payment_method;

      const sortedCards = paymentMethods.data.sort((a, b) => {
        if (a.id === defaultPaymentMethod) return -1;
        if (b.id === defaultPaymentMethod) return 1;
        return 0;
      });

      handlers.logger.success({
        object_type,
        message: "Cards retrieved successfully."
      });
      return handlers.response.success({
        res,
        message: "Cards retrieved successfully.",
        data: formatStripeList(sortedCards)
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async deleteCard(req, res) {
    const object_type = "delete-card";
    try {
      const user_id = req.user._id;
      const { _id } = req.params;

      const card = await this.card
        .findOne({ stripe_card_id: _id, user_id })
        .populate(cardSchema.populate);

      if (!card) {
        handlers.logger.unavailable({
          object_type,
          message: "Card not found."
        });
        return handlers.response.unavailable({
          res,
          message: "Card not found."
        });
      }

      await stripe.customers.deleteSource(
        req.user.stripe_customer_id,
        card.stripe_card_id
      );

      await this.card.findByIdAndDelete(card._id);

      handlers.logger.success({
        object_type,
        message: "Card deleted successfully."
      });
      return handlers.response.success({
        res,
        message: "Card deleted successfully"
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async setDefaultCard(req, res) {
    const object_type = "set-default-card";
    try {
      const user_id = req.user._id;
      const { stripe_card_id } = req.body;

      const card = await this.card.findOne({ user_id, stripe_card_id });

      if (!card) {
        handlers.logger.unavailable({
          object_type,
          message: "Card not found."
        });
        return handlers.response.unavailable({
          res,
          message: "Card not found."
        });
      }

      req.user.stripe_default_card = card._id;
      await req.user.save();

      const stripeCustomerId = req.user.stripe_customer_id;

      if (!stripeCustomerId) {
        handlers.logger.unavailable({
          object_type,
          message: "Stripe customer ID not found."
        });
        return handlers.response.unavailable({
          res,
          message: "Stripe customer ID not found."
        });
      }

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripe_card_id
        }
      });

      const stripeCard = await stripe.paymentMethods.retrieve(stripe_card_id);

      handlers.logger.success({
        object_type,
        message: "Default card set successfully."
      });
      return handlers.response.success({
        res,
        message: "Default card set successfully.",
        data: stripeCard
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
