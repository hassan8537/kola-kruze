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

  async processPayment(req, res) {
    const { ride_id, user_id, amount, payment_method_id, payment_method } =
      req.body;
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        payment_method: payment_method_id,
        confirm: true
      });

      const transaction_id = paymentIntent.id;

      if (paymentIntent.status === "succeeded") {
        return await this.handlePaymentSuccess({
          ride_id,
          user_id,
          amount,
          payment_method,
          transaction_id,
          res
        });
      } else {
        return await this.handlePaymentFailure({
          ride_id,
          user_id,
          amount,
          payment_method,
          transaction_id,
          res
        });
      }
    } catch (error) {
      console.error("Payment processing failed:", error);
      return errorResponse({ response: res, error });
    }
  }

  async handlePaymentSuccess({
    ride_id,
    user_id,
    amount,
    payment_method,
    transaction_id,
    res
  }) {
    try {
      const payment = new Payment({
        ride_id: ride_id,
        user_id: user_id,
        amount: amount,
        payment_method: payment_method,
        payment_status: "completed",
        transaction_id: transaction_id
      }).populate(populatePayment.populate);

      await payment.save();

      await Ride.updateOne(
        { _id: ride_id, "fare_details.user_id": user_id },
        {
          $set: {
            "fare_details.$.payment_status": "paid",
            "fare_details.$.amount": amount
          }
        }
      );

      const ride = await Ride.findById(ride_id);
      const totalFare = ride.fare_details.reduce(
        (sum, fare) => sum + fare.amount,
        0
      );

      await Ride.findByIdAndUpdate(ride_id, { total_fare: totalFare });

      await Ride.findByIdAndUpdate(ride_id, { ride_status: "completed" });

      return successResponse({
        response: res,
        message: "Payment processed successfully.",
        data: payment
      });
    } catch (error) {
      console.error("Error handling payment success:", error);
      return errorResponse({ response: res, error });
    }
  }

  async handlePaymentFailure({
    ride_id,
    user_id,
    amount,
    payment_method,
    transaction_id,
    res
  }) {
    try {
      const payment = new Payment({
        ride_id: ride_id,
        user_id: user_id,
        amount: amount,
        payment_method: payment_method,
        payment_status: "failed",
        transaction_id: transaction_id
      }).populate(populatePayment.populate);

      await payment.save();
      await Ride.findByIdAndUpdate(ride_id, { ride_status: "failed" });

      return failedResponse({
        response: res,
        message: "Payment failed."
      });
    } catch (error) {
      console.error("Error handling payment failure:", error);
      return errorResponse({ response: res, error });
    }
  }

  async addTip(req, res) {
    const { ride_id, user_id, tip_amount, payment_method } = req.body;
    try {
      if (tip_amount <= 0) {
        return failedResponse({
          response: res,
          message: "Tip amount must be greater than zero."
        });
      }

      const payment = new Payment({
        ride_id: ride_id,
        user_id: user_id,
        amount: tip_amount,
        payment_status: "completed",
        tip_amount: tip_amount,
        payment_method: payment_method
      }).populate(populatePayment.populate);

      await payment.save();
      await Ride.findByIdAndUpdate(ride_id, {
        $inc: { total_fare: tip_amount }
      });

      return successResponse({
        response: res,
        message: "Tip added successfully.",
        data: payment
      });
    } catch (error) {
      console.error("Error handling tip addition:", error);
      return errorResponse({ response: res, error });
    }
  }
}

module.exports = new Service();
