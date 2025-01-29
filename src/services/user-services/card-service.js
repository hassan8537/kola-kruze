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
      const user_id = request.user._id;
      const { card_type, stripe_card_id } = request.body;

      const card = await this.card.findOne({ user_id, stripe_card_id });

      if (card) {
        return failedResponse({
          response,
          message: "You already have added this card."
        });
      }

      let stripeCustomerId = request.user.stripe_customer_id;

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: request.user.email_address
        });

        request.user.stripe_customer_id = customer.id;
        await request.user.save();
        stripeCustomerId = customer.id;
      }

      const stripeCard = await stripe.customers.createSource(stripeCustomerId, {
        source: stripe_card_id
      });

      const newCard = await this.card.create({
        user_id,
        card_type,
        stripe_card_id: stripeCard.id
      });

      const addedCard = await this.card
        .findById(newCard._id)
        .populate(populateCard.populate);

      return successResponse({
        response,
        message: "Card added successfully",
        data: addedCard
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async getCards(request, response) {
    try {
      const user_id = request.user._id;

      const filters = { user_id };

      if (request.params._id) filters._id = request.params._id;

      const cards = await this.card
        .find(filters)
        .populate(populateCard.populate)
        .sort(populateCard.sort);

      if (!cards.length)
        return unavailableResponse({ response, message: "No cards found" });

      return successResponse({
        response,
        message: "Cards fetched successfully",
        data: cards
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteCard(request, response) {
    try {
      const user_id = request.user._id;
      const { _id } = request.body;

      const card = await this.card.findOne({ _id, user_id });

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

      return successResponse({
        response,
        message: "Default card set successfully"
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
