const Report = require("../../models/Report");
const Ride = require("../../models/Ride");
const { populateReport } = require("../../populate/populate-models");
const {
  successResponse,
  failedResponse,
  errorResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.report = Report;
    this.ride = Ride;
  }

  async submitReport(request, response) {
    try {
      const { ride_id, description, delivery_charges } = request.body;

      const ride = await this.ride.findById(ride_id);

      if (!ride)
        return unavailableResponse({ response, message: "No ride found" });

      const user_id = request.user._id;

      if (ride.is_reported)
        return failedResponse({
          response,
          message: "Ride already reported."
        });

      const image = request.files.image?.[0] ?? null;

      const newReport = new this.report({
        ride_id: ride._id,
        user_id: user_id,
        image: image,
        description: description,
        delivery_charges: delivery_charges
      });

      await newReport.save();
      await newReport.populate(populateReport.populate);

      ride.is_reported = true;
      await ride.save();

      return successResponse({
        response,
        message: "Report submitted successfully",
        data: newReport
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
