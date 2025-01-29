const Vehicle = require("../../models/Vehicle");
const { populateVehicle } = require("../../populate/populate-models");
const { errorResponse } = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.vehicle = Vehicle;
  }

  async getVehicles(request, response) {
    try {
      const query = request.query;

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
        response,
        table: "Vehicles",
        model: this.vehicle,
        filters,
        page,
        limit,
        sort,
        populate: populateVehicle.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
