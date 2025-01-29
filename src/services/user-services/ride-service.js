const Ride = require("../../models/Ride");
const User = require("../../models/User");
const {
  errorResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
    this.ride = Ride;
  }

  async createRide(request, response) {
    try {
      const user_id = request.user._id;
      const {
        share_with,
        pickup_locations,
        stops,
        dropoff_locations,
        ride_type,
        ride_status,
        scheduled_time,
        reserved_at,
        start_time,
        end_time,
        fare_details,
        ride_preferences,
        cancellation,
        tracking
      } = request.body;

      const ride = await this.ride.create({
        user_id,
        driver_id: request.user.driver_id || null,
        vehicle_id: request.user.vehicle_id || null,
        share_with,
        pickup_locations: [
          {
            user_id,
            address: pickup_locations.address,
            coordinates: pickup_locations.coordinates
          }
        ],
        stops: stops.map((stop, index) => ({
          address: stop.address,
          coordinates: stop.coordinates,
          stop_order: index + 1
        })),
        dropoff_locations: [
          {
            user_id,
            address: dropoff_locations.address,
            coordinates: dropoff_locations.coordinates
          }
        ],
        ride_type,
        ride_status,
        scheduled_time,
        reserved_at,
        start_time,
        end_time,
        fare_details: fare_details.map((detail) => ({
          user_id: detail.user_id,
          amount: detail.amount,
          payment_status: detail.payment_status
        })),
        ride_preferences,
        cancellation: {
          cancelled_by: request.body.cancellation.cancelled_by,
          cancellation_reason: request.body.cancellation.cancellation_reason
        },
        tracking: {
          current_location: request.body.tracking.current_location.coordinates,
          eta: request.body.tracking.eta
        }
      });

      return successResponse({
        response,
        message: "Ride created successfully",
        data: ride
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
