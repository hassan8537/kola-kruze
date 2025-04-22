const Report = require("../../models/Report");
const Ride = require("../../models/Ride");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.report = Report;
    this.ride = Ride;
  }

  async submitReport(request, response) {
    try {
      const { ride_id, description, cleaning_charges } = request.body;

      const ride = await this.ride.findById(ride_id);

      if (!ride) {
        handlers.logger.unavailable({
          object_type: "ride",
          message: "No ride found"
        });
        return handlers.response.unavailable({
          res: response,
          message: "No ride found"
        });
      }

      const user_id = request.user._id;

      if (ride.is_reported) {
        handlers.logger.failed({
          object_type: "report",
          message: "Ride already reported"
        });
        return handlers.response.failed({
          res: response,
          message: "Ride already reported."
        });
      }

      const image = body.image;

      const newReport = new this.report({
        ride_id: ride._id,
        user_id: user_id,
        image: image,
        description: description,
        delivery_charges: cleaning_charges
      });

      await newReport.save();
      await newReport.populate(reportSchema.populate);

      ride.is_reported = true;
      await ride.save();

      handlers.logger.success({
        object_type: "report",
        message: "Report submitted successfully",
        data: newReport
      });
      return handlers.response.success({
        res: response,
        message: "Report submitted successfully",
        data: newReport
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "report",
        message: "Failed to submit report",
        data: error?.message
      });
      return handlers.response.error({ res: response, error });
    }
  }
}

module.exports = new Service();
