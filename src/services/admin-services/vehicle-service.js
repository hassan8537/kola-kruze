const Vehicle = require("../../models/Vehicle");
const vehicleSchema = require("../../schemas/vehicle-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.vehicle = Vehicle;
  }

  async getVehicles(req, res) {
    try {
      const query = req.query;

      const filters = {};

      if (query._id) filters._id = query._id;
      if (query.user_id) filters.user_id = query.user_id;
      if (query.vehicle_state) filters.vehicle_state = query.vehicle_state;
      if (query.vehicle_category)
        filters.vehicle_category = query.vehicle_category;
      if (query.vehicle_make) filters.vehicle_make = query.vehicle_make;
      if (query.vehicle_model) filters.vehicle_model = query.vehicle_model;
      if (query.vehicle_year) filters.vehicle_year = query.vehicle_year;
      if (query.vehicle_variant)
        filters.vehicle_variant = query.vehicle_variant;
      if (query.passenger_limit)
        filters.passenger_limit = query.passenger_limit;
      if (query.vehicle_color) filters.vehicle_color = query.vehicle_color;
      if (query.vehicle_doors) filters.vehicle_doors = query.vehicle_doors;
      if (query.vehicle_seatbelts)
        filters.vehicle_seatbelts = query.vehicle_seatbelts;
      if (query.is_verified) filters.is_verified = query.is_verified;

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Vehicles",
        model: this.vehicle,
        filters,
        page,
        limit,
        sort,
        populate: vehicleSchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "fetch-vehicles",
        message: error
      });

      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async getVehicleById(req, res) {
    try {
      const { _id } = req.params;

      const vehicle = await this.vehicle
        .findById(_id)
        .populate(vehicleSchema.populate);

      if (!vehicle) {
        handlers.logger.success({
          object_type: "get-vehicle",
          message: "No rides found"
        });
        return handlers.response.error({ res, message: "No rides found" });
      }

      handlers.logger.success({
        object_type: "get-vehicle",
        message: "Vehicle fetched successfully"
      });
      return handlers.response.success({
        res,
        message: "Vehicle fetched successfully",
        data: vehicle
      });
    } catch (error) {
      handlers.logger.error({ object_type: "get-vehicle", message: error });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
