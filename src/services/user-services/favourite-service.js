const Favourite = require("../../models/Favourites");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const userSchema = require("../../schemas/user-schema");

const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.user = User;
    this.notification = Notification;
    this.favourite = Favourite;
  }

  async getFavourites(req, res) {
    try {
      const { user: current_user } = req;
      const { page, limit, sort } = req.query;

      const filters = {
        user_id: current_user._id
      };

      await pagination({
        response: res,
        table: "Favourites",
        model: this.favourite,
        filters,
        page,
        limit,
        sort,
        populate: userSchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "get-favourites",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async toggleFavouriteDriver(req, res) {
    try {
      const { driver_id } = req.body;
      const { user: current_user } = req;

      if (!driver_id) {
        return handlers.response.failed({
          res,
          message: "Driver ID is required."
        });
      }

      const existingFavourite = await this.favourite.findOne({
        user_id: current_user._id,
        driver_id
      });

      if (existingFavourite) {
        // Already favorited -> Unfavourite
        await this.favourite.deleteOne({ _id: existingFavourite._id });

        await this.user.findByIdAndUpdate(current_user._id, {
          $inc: { total_favourite_drivers: -1 }
        });

        return handlers.response.success({
          res,
          message: "Driver removed from favourites."
        });
      } else {
        // Not favorited yet -> Favourite
        await this.favourite.create({
          user_id: current_user._id,
          driver_id
        });

        await this.user.findByIdAndUpdate(current_user._id, {
          $inc: { total_favourite_drivers: 1 }
        });

        return handlers.response.success({
          res,
          message: "Driver added to favourites."
        });
      }
    } catch (error) {
      handlers.logger.error({
        object_type: "toggle-favourite-driver",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
