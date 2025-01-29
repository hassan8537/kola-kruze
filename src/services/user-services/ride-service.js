const Ride = require("../../models/Ride");
const User = require("../../models/User");
const {
  errorResponse,
  successResponse,
  failedResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
    this.ride = Ride;
  }

  async createRide(request, response) {
    try {
      const user_id = request.user._id;

      const ride = await this.ride.findOne({ user_id });

      if (ride)
        return failedResponse({
          response,
          message: "You already have a ride in progress"
        });

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

      const newRide = await this.ride.create({
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
          cancelled_by: cancellation.cancelled_by,
          cancellation_reason: cancellation.cancellation_reason
        },
        tracking: {
          current_location: tracking.current_location.coordinates,
          eta: tracking.eta
        }
      });

      return successResponse({
        response,
        message: "Ride created successfully",
        data: newRide
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async updateRide(request, response) {
    try {
      const ride_id = request.params._id;
      const user_id = request.user._id;

      const ride = await this.ride.findOne({ _id: ride_id, user_id });

      if (!ride) {
        return unavailableResponse({
          response,
          message: "No ride found."
        });
      }

      const { tracking, ride_status, end_time, fare_details, cancellation } =
        request.body;

      if (tracking) {
        ride.tracking.current_location =
          tracking.current_location || ride.tracking.current_location;
        ride.tracking.eta = tracking.eta || ride.tracking.eta;
      }

      if (ride_status && ["completed", "canceled"].includes(ride_status)) {
        ride.ride_status = ride_status;
      }

      if (end_time) {
        ride.end_time = end_time;
      }

      if (fare_details) {
        ride.fare_details = fare_details.map((detail) => ({
          user_id: detail.user_id,
          amount: detail.amount,
          payment_status: detail.payment_status
        }));
      }

      if (cancellation) {
        ride.cancellation = {
          cancelled_by:
            cancellation.cancelled_by || ride.cancellation.cancelled_by,
          cancellation_reason:
            cancellation.cancellation_reason ||
            ride.cancellation.cancellation_reason
        };
        ride.ride_status = "canceled";
      }

      await ride.save();

      return successResponse({
        response,
        message: "Ride updated successfully",
        data: ride
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async updateRide(request, response) {
    try {
      const ride_id = request.params._id;
      const user_id = request.user._id;

      const ride = await this.ride.findOne({ _id: ride_id, user_id });

      if (!ride) {
        return unavailableResponse({
          response,
          message: "No ride found."
        });
      }

      const { cancellation } = request.body;

      if (cancellation) {
        ride.cancellation = {
          cancelled_by:
            cancellation.cancelled_by || ride.cancellation.cancelled_by,
          cancellation_reason:
            cancellation.cancellation_reason ||
            ride.cancellation.cancellation_reason
        };
        ride.ride_status = "canceled";
      }

      await ride.save();

      return successResponse({
        response,
        message: "Ride updated successfully",
        data: ride
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
