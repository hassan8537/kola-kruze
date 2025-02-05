const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);
const Card = require("../../models/Card");
const User = require("../../models/User");
const { populateCard } = require("../../populate/populate-models");
const {
  errorResponse,
  successResponse,
  failedResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
    this.card = Card;
  }

  async addCard(request, response) {
    try {
      const user = request.user;
      const { stripe_card_id } = request.body;

      if (!stripe_card_id) {
        return failedResponse({
          response,
          message: "Stripe card id is required."
        });
      }

      const existingAccount = await this.card
        .findOne({ user_id: user._id, stripe_card_id })
        .populate(populateCard.populate);

      if (existingAccount) {
        return failedResponse({
          response,
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

      return successResponse({
        response,
        message: "Card added successfully.",
        data: card
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async getMyCards(request, response) {
    try {
      const stripeCustomerId = request.user.stripe_customer_id;

      if (!stripeCustomerId) {
        return unavailableResponse({
          response,
          message: "Stripe customer ID not found."
        });
      }

      const paymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: "card"
      });

      if (!paymentMethods.data.length) {
        return unavailableResponse({ response, message: "No cards found." });
      }

      return successResponse({
        response,
        message: "Cards retrieved successfully.",
        data: this.formatStripeList(paymentMethods.data)
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteCard(request, response) {
    try {
      const user_id = request.user._id;
      const { _id } = request.params;

      const card = await this.card
        .findOne({ stripe_card_id: _id, user_id })
        .populate(populateCard.populate);

      if (!card) {
        return unavailableResponse({
          response,
          message: "Card not found."
        });
      }

      await stripe.customers.deleteSource(
        request.user.stripe_customer_id,
        card.stripe_card_id
      );

      await this.card.findByIdAndDelete(card._id);

      return successResponse({
        response,
        message: "Card deleted successfully"
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async setDefaultCard(request, response) {
    try {
      const user_id = request.user._id;
      const { stripe_card_id } = request.body;

      const card = await this.card.findOne({ user_id, stripe_card_id });

      if (!card) {
        return unavailableResponse({
          response,
          message: "Card not found."
        });
      }

      request.user.stripe_default_card = card._id;
      await request.user.save();

      const stripeCustomerId = request.user.stripe_customer_id;

      if (!stripeCustomerId) {
        return unavailableResponse({
          response,
          message: "Stripe customer ID not found."
        });
      }

      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: stripe_card_id
        }
      });

      const stripeCard = await stripe.paymentMethods.retrieve(stripe_card_id);

      return successResponse({
        response,
        message: "Default card set successfully.",
        data: stripeCard
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  formatStripeList(array) {
    return array.map((item) => {
      return {
        id: item.id,
        brand: item.card.brand,
        last4: item.card.last4
      };
    });
  }
}

module.exports = new Service();
