const Vehicle = require("../../models/Vehicle");
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

  async addVehicle(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const insurance_document = request.files?.insurance_document?.[0] ?? null;
      const inspection_document =
        request.files?.inspection_document?.[0] ?? null;
      const vehicle_images = request.files?.vehicle_images ?? [];
      const vehicle_driver_licenses =
        request.files?.vehicle_driver_licenses ?? [];

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
        vehicle_images,
        vehicle_driver_licenses
      };

      const existingVehicle = await this.vehicle.findOne({ user_id });
      if (existingVehicle)
        return failedResponse({
          response,
          message: "You already have a vehicle registered."
        });

      const newVehicle = new this.vehicle(formData);
      await newVehicle.save();

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
      const vehicle_driver_licenses =
        request.files?.vehicle_driver_licenses ?? [];

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
        vehicle_images,
        vehicle_driver_licenses
      };

      const vehicle = await this.vehicle.findOne({ user_id });
      if (!vehicle)
        return unavailableResponse({ response, message: "No vehicle found." });

      Object.assign(vehicle, formData);
      await vehicle.save();

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
