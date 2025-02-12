const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);
const Ride = require("../../models/Ride");
const Payment = require("../../models/Payment");
const {
  successResponse,
  errorResponse,
  failedResponse
} = require("../../utilities/handlers/response-handler");
const { populatePayment } = require("../../populate/populate-models");

class Service {
  constructor() {
    this.ride = Ride;
    this.payment = Payment;
  }
}

module.exports = new Service();
