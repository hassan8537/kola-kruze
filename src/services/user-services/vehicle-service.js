const Vehicle = require("../../models/Vehicle");
const { populateVehicle } = require("../../populate/populate-models");
const {
  successResponse,
  failedResponse,
  errorResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.vehicle = Vehicle;
  }

  async getVehicle(request, response) {
    try {
      const user_id = request.user._id;

      const vehicle = await this.vehicle
        .findOne({ user_id })
        .populate(populateVehicle.populate);

      if (!vehicle) {
        return unavailableResponse({ response, message: "No vehicle found." });
      }

      return successResponse({
        response,
        message: "Vehicle retrieved successfully.",
        data: vehicle
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async addVehicle(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const insurance_document = request.files?.insurance_document?.[0] ?? null;
      const inspection_document =
        request.files?.inspection_document?.[0] ?? null;
      const vehicle_images = request.files?.vehicle_images ?? [];

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
        insurance_document,
        inspection_document,
        vehicle_images
      };

      const existingVehicle = await this.vehicle.findOne({ user_id });
      if (existingVehicle)
        return failedResponse({
          response,
          message: "You already have a vehicle registered."
        });

      const newVehicle = new this.vehicle(formData);
      request.user.is_vehicle_setup = true;
      await newVehicle.save();
      await request.user.save();
      await newVehicle.populate(populateVehicle.populate);

      return successResponse({
        response,
        message: "Vehicle created successfully.",
        data: newVehicle
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async editVehicleDetails(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const insurance_document = request.files?.insurance_document?.[0] ?? null;
      const inspection_document =
        request.files?.inspection_document?.[0] ?? null;
      const vehicle_images = request.files?.vehicle_images ?? [];

      const vehicle = await this.vehicle
        .findOne({ user_id })
        .populate(populateVehicle.populate);

      if (!vehicle) {
        return unavailableResponse({ response, message: "No vehicle found." });
      }

      // **Update only provided fields**
      if (body.license_plate_number)
        vehicle.license_plate_number = body.license_plate_number;
      if (body.vehicle_vin) vehicle.vehicle_vin = body.vehicle_vin;
      if (body.vehicle_state) vehicle.vehicle_state = body.vehicle_state;
      if (body.vehicle_category)
        vehicle.vehicle_category = body.vehicle_category;
      if (body.vehicle_make) vehicle.vehicle_make = body.vehicle_make;
      if (body.vehicle_model) vehicle.vehicle_model = body.vehicle_model;
      if (body.vehicle_year) vehicle.vehicle_year = body.vehicle_year;
      if (body.vehicle_variant) vehicle.vehicle_variant = body.vehicle_variant;
      if (body.passenger_limit) vehicle.passenger_limit = body.passenger_limit;
      if (body.vehicle_registration_number)
        vehicle.vehicle_registration_number = body.vehicle_registration_number;
      if (body.vehicle_color) vehicle.vehicle_color = body.vehicle_color;
      if (body.vehicle_doors) vehicle.vehicle_doors = body.vehicle_doors;
      if (body.vehicle_seatbelts)
        vehicle.vehicle_seatbelts = body.vehicle_seatbelts;

      // **Update documents only if provided**
      if (insurance_document) vehicle.insurance_document = insurance_document;
      if (inspection_document)
        vehicle.inspection_document = inspection_document;
      if (vehicle_images.length > 0) vehicle.vehicle_images = vehicle_images;

      await vehicle.save();
      await vehicle.populate(populateVehicle.populate);

      return successResponse({
        response,
        message: "Vehicle details updated successfully.",
        data: vehicle
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
