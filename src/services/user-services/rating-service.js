const Rating = require("../../models/Rating");
const Ride = require("../../models/Ride");
const {
  successResponse,
  failedResponse,
  errorResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.rating = Rating;
    this.ride = Ride;
  }

  async addRating(request, response) {
    try {
      const { ride_id, drive_again, rating, feedback, type } = request.body;
      const reviewer_id = request.user._id;

      const ride = await this.ride.findById(ride_id).lean();
      if (!ride) {
        return unavailableResponse({ response, message: "Ride not found" });
      }

      let recipient_id;
      if (type === "user-to-driver") {
        recipient_id = ride.driver_id.toString();
      } else if (type === "driver-to-user") {
        recipient_id = ride.user_id.toString();
      } else {
        return failedResponse({ response, message: "Invalid rating type" });
      }

      const ratingDoc = await this.rating.findOneAndUpdate(
        { ride_id, type, reviewer_id, recipient_id },
        {
          $set: {
            type,
            drive_again,
            reviewer_id,
            recipient_id,
            rating,
            feedback
          }
        },
        { upsert: true, new: true }
      );

      return successResponse({
        response,
        message: "Rating submitted successfully",
        data: ratingDoc
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async getRatings(request, response) {
    try {
      const { ride_id, type, reviewer_id, recipient_id } = request.query;

      const query = {};

      if (ride_id) query.ride_id = ride_id;
      if (type) query.type = type;
      if (reviewer_id) query.reviewer_id = reviewer_id;
      if (recipient_id) query.recipient_id = recipient_id;

      const ratings = await this.rating.find(query);
      if (!ratings.length) {
        return failedResponse({
          response,
          message: "No ratings found for this user"
        });
      }

      return successResponse({
        response,
        message: "User ratings fetched successfully",
        data: ratings
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
