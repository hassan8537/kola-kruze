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

      const newCard = await this.card.create({
        user_id: user._id,
        stripe_card_id: card.id
      });

      const createdCard = await this.card
        .findById(newCard._id)
        .populate(populateCard.populate);

      return successResponse({
        response,
        message: "Card added successfully.",
        data: createdCard
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async getMyCards(request, response) {
    try {
      const { _id } = request.query;

      const filters = { user_id: request.user._id };

      if (_id) filters._id = _id;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Cards",
        model: this.card,
        filters,
        page,
        limit,
        sort,
        populate: populateCard.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteCard(request, response) {
    try {
      const user_id = request.user._id;
      const { _id } = request.body;

      const card = await this.card
        .findOne({ _id, user_id })
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

      const card = await this.card
        .findOne({ user_id, stripe_card_id })
        .populate(populateCard.populate);

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

      return successResponse({
        response,
        message: "Default card set successfully in both system and Stripe."
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
