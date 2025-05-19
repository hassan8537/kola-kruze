const Ride = require("../../models/Ride");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

const rideSchema = require("../../schemas/ride-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor(io) {
    this.ride = Ride;
  }

  async getAllRides(req, res) {
    try {
      const { page, limit, sort, status } = req.query;

      const filters = { page, limit, sort };

      if (status) filters.ride_status = status;

      await pagination({
        response: res,
        table: "Rides",
        model: this.ride,
        filters,
        page,
        limit,
        sort,
        populate: rideSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ object_type: "get-rides", message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getRideById(req, res) {
    try {
      const { _id } = req.params;

      const ride = await this.ride.findById(_id).populate(rideSchema.populate);

      if (!ride) {
        handlers.logger.success({
          object_type: "get-rides",
          message: "No rides found"
        });
        return handlers.response.error({ res, message: "No rides found" });
      }

      handlers.logger.success({
        object_type: "get-rides",
        message: "Rides fetched successfully"
      });
      return handlers.response.success({
        res,
        message: "Rides fetched successfully",
        data: ride
      });
    } catch (error) {
      handlers.logger.error({ object_type: "get-rides", message: error });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async getTotalRides(req, res) {
    const object_type = "get-total-rides";
    try {
      const { date, status } = req.query;

      const filters = {};

      if (date) {
        const start = new Date(date);
        start.setUTCHours(0, 0, 0, 0);

        const end = new Date(date);
        end.setUTCHours(23, 59, 59, 999);

        filters.createdAt = { $gte: start, $lte: end };
      }

      if (status) {
        filters.ride_status = status;
      }

      const totalRides = await this.ride.countDocuments(filters);

      handlers.logger.success({
        object_type,
        message: "Success",
        data: totalRides
      });
      return handlers.response.success({
        res,
        message: "Success",
        data: totalRides
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
