const Vehicle = require("../../models/Vehicle");
const vehicleSchema = require("../../schemas/vehicle-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.vehicle = Vehicle;
  }

  async getVehicle(request, response) {
    try {
      const user_id = request.user._id;

      const vehicle = await this.vehicle
        .findOne({ user_id })
        .populate(vehicleSchema.populate);

      if (!vehicle) {
        handlers.logger.unavailable({
          object_type: "vehicle",
          message: "No vehicle found."
        });
        return handlers.response.unavailable({
          res: response,
          message: "No vehicle found."
        });
      }

      handlers.logger.success({
        object_type: "vehicle",
        message: "Vehicle retrieved successfully.",
        data: vehicle
      });
      return handlers.response.success({
        res: response,
        message: "Vehicle retrieved successfully.",
        data: vehicle
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "vehicle",
        message: "Error retrieving vehicle.",
        data: error.message
      });
      return handlers.response.error({
        res: response,
        message: "Error retrieving vehicle."
      });
    }
  }

  async addVehicle(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const formData = {
        user_id,
        license_plate_number: body.license_plate_number,
        vehicle_vin: body.vehicle_vin,
        vehicle_state: body.vehicle_state,
        vehicle_category: body.vehicle_category,
        vehicle_make: body.vehicle_make,
        vehicle_model: body.vehicle_model,
        vehicle_year: body.vehicle_year,
        vehicle_variant: body.vehicle_variant,
        passenger_limit: body.passenger_limit,
        vehicle_registration_number: body.vehicle_registration_number,
        vehicle_color: body.vehicle_color,
        vehicle_doors: body.vehicle_doors,
        vehicle_seatbelts: body.vehicle_seatbelts,
        insurance_document: body.insurance_document,
        inspection_document: body.inspection_document,
        vehicle_images: body.vehicle_images
      };

      const existingVehicle = await this.vehicle.findOne({ user_id });
      if (existingVehicle) {
        handlers.logger.failed({
          object_type: "vehicle",
          message: "You already have a vehicle registered."
        });
        return handlers.response.failed({
          res: response,
          message: "You already have a vehicle registered."
        });
      }

      const newVehicle = new this.vehicle(formData);
      request.user.is_vehicle_setup = true;

      await newVehicle.save();
      await newVehicle.populate(vehicleSchema.populate);
      await request.user.save();

      handlers.logger.success({
        object_type: "vehicle",
        message: "Vehicle created successfully.",
        data: newVehicle
      });
      return handlers.response.success({
        res: response,
        message: "Vehicle created successfully.",
        data: newVehicle
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "vehicle",
        message: "Error adding vehicle.",
        data: error.message
      });
      return handlers.response.error({
        res: response,
        message: "Error adding vehicle."
      });
    }
  }

  async editVehicleDetails(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const vehicle = await this.vehicle
        .findOne({ user_id })
        .populate(vehicleSchema.populate);

      if (!vehicle) {
        handlers.logger.unavailable({
          object_type: "vehicle",
          message: "No vehicle found."
        });
        return handlers.response.unavailable({
          res: response,
          message: "No vehicle found."
        });
      }

      const updatableFields = [
        "license_plate_number",
        "vehicle_vin",
        "vehicle_state",
        "vehicle_category",
        "vehicle_make",
        "vehicle_model",
        "vehicle_year",
        "vehicle_variant",
        "passenger_limit",
        "vehicle_registration_number",
        "vehicle_color",
        "vehicle_doors",
        "vehicle_seatbelts",
        "insurance_document",
        "inspection_document",
        "vehicle_images"
      ];

      updatableFields.forEach((field) => {
        if (body[field]) vehicle[field] = body[field];
      });

      await vehicle.save();
      await vehicle.populate(vehicleSchema.populate);

      handlers.logger.success({
        object_type: "vehicle",
        message: "Vehicle details updated successfully.",
        data: vehicle
      });
      return handlers.response.success({
        res: response,
        message: "Vehicle details updated successfully.",
        data: vehicle
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "vehicle",
        message: "Error editing vehicle details.",
        data: error.message
      });
      return handlers.response.error({
        res: response,
        message: "Error editing vehicle details."
      });
    }
  }
}

module.exports = new Service();
