const Notification = require("../../models/Notification");
const Ride = require("../../models/Ride");
const {
  successResponse,
  failedResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.service = Ride;
  }

  async sendInvitation(request, response) {
    try {
      const user = req.user;

      const { ride_id, user_id, phone } = request.body;

      if (!ride_id || !user_id || !phone) {
        return failedResponse({
          response: response,
          message: "Missing required fields"
        });
      }

      const ride = await Ride.findById(ride_id);
      if (!ride) {
        return failedResponse({
          response: response,
          message: "Ride not found"
        });
      }

      const alreadyInvited = ride.shared_with.some(
        (invite) => invite.user_id.toString() === user_id
      );

      if (alreadyInvited) {
        return failedResponse({
          response: response,
          message: "User already invited"
        });
      }

      ride.shared_with.push({
        user_id,
        phone,
        status: "invited",
        split_amount: ride.split_fare.per_rider_amount
      });

      await Notification.create({
        user_id: user_id,
        message: `${user.first_name} ${user.last_name} has sent you an invitation`,
        type: "invitation",
        model_id: "Ride"
      });

      await ride.save();

      const invitationLink = `${process.env.BASE_URL}/api/${process.env.API_VERSION}/accept-invitation/${ride_id}/${user_id}`;

      return successResponse({
        response: response,
        message: "Invitation sent successfully",
        data: { invitationLink }
      });
    } catch (error) {
      return errorResponse({ response: response, error });
    }
  }

  async acceptInvitation(req, res) {
    try {
      const { ride_id, user_id } = req.params;

      if (!ride_id || !user_id) {
        return failedResponse({
          response: res,
          message: "Missing required fields"
        });
      }

      const ride = await Ride.findById(ride_id);
      if (!ride) {
        return failedResponse({ response: res, message: "Ride not found" });
      }

      const invite = ride.shared_with.find(
        (invite) => invite.user_id.toString() === user_id
      );

      if (!invite) {
        return failedResponse({
          response: res,
          message: "Invitation not found"
        });
      }

      if (invite.status !== "invited") {
        return failedResponse({
          response: res,
          message: "Invitation is not valid for acceptance"
        });
      }

      invite.status = "accepted";
      await ride.save();

      return successResponse({
        response: res,
        message: "Invitation accepted",
        data: ride
      });
    } catch (error) {
      return errorResponse({ response: res, error });
    }
  }
}

module.exports = new Service();
