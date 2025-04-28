const Favourite = require("../../models/Favourites");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const favouriteSchema = require("../../schemas/favourite-schema");
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

      const pageNumber = parseInt(page, 10) || 1;
      const pageSize = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * pageSize;

      const data = await this.favourite
        .find(filters)
        .skip(skip)
        .limit(pageSize)
        .sort(sort)
        .populate(favouriteSchema.populate);

      const filteredData = data.map((item) => item.driver_id);

      const totalCount = await this.favourite.countDocuments(filters);

      if (!filteredData.length) {
        return handlers.response.unavailable({
          res: res,
          message: `No favourite drivers found.`
        });
      }

      return handlers.response.success({
        res: res,
        message: `Favourite drivers retrieved successfully.`,
        data: {
          results: filteredData,
          total_records: totalCount,
          total_pages: Math.ceil(totalCount / pageSize),
          current_page: pageNumber,
          page_size: pageSize
        }
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
