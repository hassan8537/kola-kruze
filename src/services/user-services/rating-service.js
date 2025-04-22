const Rating = require("../../models/Rating");
const Ride = require("../../models/Ride");
const ratingSchema = require("../../schemas/rating-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.rating = Rating;
    this.ride = Ride;
  }

  async addRating(req, res) {
    try {
      const { ride_id, drive_again, rating, feedback, type } = req.body;
      const reviewer_id = req.user._id;

      const ride = await this.ride.findById(ride_id).lean();
      if (!ride) {
        handlers.logger.unavailable({
          object_type: "rating",
          message: "Ride not found"
        });
        return handlers.response.unavailable({
          res: res,
          message: "Ride not found"
        });
      }

      let recipient_id;
      if (type === "user-to-driver") {
        recipient_id = ride.driver_id.toString();
      } else if (type === "driver-to-user") {
        recipient_id = ride.user_id.toString();
      } else {
        handlers.logger.failed({
          object_type: "rating",
          message: "Invalid rating type"
        });
        return handlers.response.failed({
          res: res,
          message: "Invalid rating type"
        });
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

      handlers.logger.success({
        object_type: "rating",
        message: "Rating submitted successfully",
        data: ratingDoc
      });
      return handlers.response.success({
        res: res,
        message: "Rating submitted successfully",
        data: ratingDoc
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "rating",
        message: error.message
      });
      return handlers.response.error({
        res: res,
        message: "Something went wrong",
        data: null
      });
    }
  }

  async getRatings(req, res) {
    try {
      const { ride_id, drive_again, type, reviewer_id, recipient_id } =
        req.query;

      const query = {};
      if (ride_id) query.ride_id = ride_id;
      if (type) query.type = type;
      if (drive_again) query.drive_again = drive_again;
      if (reviewer_id) query.reviewer_id = reviewer_id;
      if (recipient_id) query.recipient_id = recipient_id;

      const ratings = await this.rating
        .find(query)
        .populate(ratingSchema.populate);

      if (!ratings.length) {
        handlers.logger.failed({
          object_type: "rating",
          message: "No ratings found for this user"
        });
        return handlers.response.failed({
          res: res,
          message: "No ratings found for this user"
        });
      }

      handlers.logger.success({
        object_type: "rating",
        message: "User ratings fetched successfully",
        data: ratings
      });
      return handlers.response.success({
        res: res,
        message: "User ratings fetched successfully",
        data: ratings
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "rating",
        message: error.message
      });
      return handlers.response.error({
        res: res,
        message: "Something went wrong",
        data: null
      });
    }
  }

  async getUserRatings(req, res) {
    try {
      const user_id = req.query._id;

      if (!user_id) {
        handlers.logger.failed({
          object_type: "rating",
          message: "User ID is required"
        });
        return handlers.response.failed({
          res: res,
          message: "User ID is required"
        });
      }

      const ratings = await this.rating
        .find({ recipient_id: user_id })
        .populate(ratingSchema.populate);

      if (!ratings.length) {
        handlers.logger.failed({
          object_type: "rating",
          message: "No ratings found for this user"
        });
        return handlers.response.failed({
          res: res,
          message: "No ratings found for this user"
        });
      }

      const totalRatings = ratings.length;
      const totalScore = ratings.reduce(
        (sum, rating) => sum + rating.rating,
        0
      );
      const averageRating = totalScore / totalRatings;

      const data = {
        ratings,
        total_ratings: totalRatings,
        average_rating: parseFloat(averageRating.toFixed(2))
      };

      handlers.logger.success({
        object_type: "rating",
        message: "User ratings fetched successfully",
        data
      });

      return handlers.response.success({
        res: res,
        message: "User ratings fetched successfully",
        data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "rating",
        message: error.message
      });
      return handlers.response.error({
        res: res,
        message: "Something went wrong",
        data: null
      });
    }
  }
}

module.exports = new Service();
