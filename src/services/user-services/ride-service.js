const Ride = require("../../models/Ride");
const User = require("../../models/User");
const { errorResponse } = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
    this.ride = Ride;
  }

  async createRide(request, response) {
    try {
      const user_id = request.user._id;
      const driver_id = request.user.driver_id;
      const vehicle_id = request.user.vehicle_id;

      const share_with = request.body.share_with;

      const pickup_locations = {
        user_id: user_id,
        address: request.pickup_locations.address,
        coordinates: request.pickup_locations.coordinates
      };

      const stops = request.body.stops.map((stop) => {
        return {
          user_id: user_id,
          address: stop.address,
          coordinates: stop.coordinates
        };
      });

      const dropoff_locations = {
        user_id: user_id,
        address: request.dropoff_locations.address,
        coordinates: request.dropoff_locations.coordinates
      };

      const ride_type = request.body.ride_type;

      const ride_status = request.body.ride_status;

      const scheduled_time = request.body.scheduled_time;
      const reserved_at = request.body.reserved_at;
      const start_time = request.body.scheduled_time;
      const end_time = request.body.end_time;

      const fare_details = request.body.share_with.map((share_with) => {
        return {
          user_id: share_with.user_id,
          amount: share_with.amount,
          payment_status: share_with.payment_status
        };
      });

      const ride_preferences = {
        pet_friendly: request.body.ride_preferences.pet_friendly,
        wheelchair_accessible:
          request.body.ride_preferences.wheelchair_accessible,
        air_conditioning: request.body.ride_preferences.air_conditioning
      };
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}
