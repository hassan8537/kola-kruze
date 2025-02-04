const Ride = require("../../models/Ride");
const User = require("../../models/User");
const { populateRide } = require("../../populate/populate-models");
const { errorResponse } = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");
const notification = require("../../services/user-services/notification-service");
const {
  getDistance
} = require("../../utilities/calculators/distance-calculator");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
  }

  async getMyRides(request, response) {
    try {
      const { _id } = request.query;
      const filters = { user_id: request.user._id };
      if (_id) filters._id = _id;
      const { page, limit, sort } = query;
      await pagination({
        response,
        table: "Rides",
        model: this.ride,
        filters,
        page,
        limit,
        sort,
        populate: populateRide.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async rideRequest(socket, data) {
    try {
      const {
        user_id,
        pickup_locations,
        stops,
        dropoff_locations,
        ride_type,
        ride_status,
        fare_details,
        ride_preferences,
        tracking
      } = data;

      const existingRide = await this.ride.findOne({ user_id });

      if (existingRide) {
        return socket.emit("ride-request-response", {
          status: 0,
          message: "You already have a ride in progress"
        });
      }

      const newRide = await this.ride.create({
        user_id,
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
        fare_details: fare_details.map((detail) => ({
          user_id: detail.user_id,
          amount: detail.amount,
          payment_status: detail.payment_status
        })),
        ride_preferences,
        tracking
      });

      socket.emit("ride-request-response", {
        status: 1,
        message: "Ride request sent successfully",
        ride: newRide
      });

      const maxDistanceInMiles = process.env.MAX_DISTANCE_IN_MILES || 5;

      const drivers = await this.user.find({
        role: "driver",
        is_available: true,
        is_deleted: false
      });

      const nearbyDrivers = drivers.filter((driver) => {
        const driverCoordinates = driver.current_location[0]?.coordinates || [];
        if (driverCoordinates.length === 0) return false;

        const [driverLongitude, driverLatitude] = driverCoordinates;
        const [pickupLongitude, pickupLatitude] = pickup_locations.coordinates;
        const distance = getDistance(
          pickupLatitude,
          pickupLongitude,
          driverLatitude,
          driverLongitude
        );

        return distance <= maxDistanceInMiles;
      });

      if (nearbyDrivers.length > 0) {
        await Promise.all(
          nearbyDrivers.map((driver) => {
            socket.join(driver._id.toString());
            this.io.to(driver._id.toString()).emit("ride-request", newRide);

            const body = {
              device_token: driver.device_token,
              user: driver._id,
              message: "A user requested a ride within your area",
              type: "ride",
              model_id: newRide._id,
              model_type: "ride",
              meta_data: { ...newRide.toJSON() }
            };
            return notification.createNotification({ body });
          })
        );
      } else {
        console.log("No drivers found within the specified range.");
      }
    } catch (error) {
      console.error(error);

      socket.emit("ride-request-response", {
        status: 0,
        message: "Error requesting ride",
        error
      });
    }
  }

  async rideRequestResponse(socket, data) {
    try {
      const { ride_id, driver_id, accepted } = data;
      const ride = await this.ride.findOne({ _id: ride_id });
      if (!ride) {
        return socket.emit("ride-request-response", {
          status: 0,
          message: "Ride not found"
        });
      }

      if (!accepted) {
        return socket.emit("ride-request-response", {
          status: 0,
          message: "Ride rejected"
        });
      }

      ride.driver_id = driver_id;
      ride.ride_status = "accepted";
      await ride.save();

      socket.emit("ride-request-response", {
        status: 1,
        message: "Ride accepted",
        ride
      });

      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit("ride-status-update", ride);

      const body = {
        device_token: ride.user.device_token,
        user: ride.user_id,
        message: "Your ride request has been accepted",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body });
    } catch (error) {
      socket.emit("ride-request-response", {
        status: 0,
        message: "Error updating ride request",
        error
      });
    }
  }

  async rideStatusUpdate(socket, data) {
    try {
      const { ride_id, ride_status, end_time, cancellation, eta } = data;
      const ride = await this.ride.findOne({ _id: ride_id });

      if (!ride) {
        return socket.emit("ride-status-update", {
          status: 0,
          message: "Ride not found"
        });
      }

      ride.ride_status = ride_status;
      if (ride_status === "completed") {
        ride.end_time = end_time;
      }

      if (ride_status === "canceled") {
        ride.cancellation = {
          cancelled_by: cancellation.cancelled_by,
          cancellation_reason: cancellation.cancellation_reason
        };
      }

      if (eta) {
        ride.tracking.eta = eta;
      }

      await ride.save();

      socket.emit("ride-status-update", {
        status: 1,
        message: "Ride status updated",
        ride
      });

      socket.join(ride.user_id.toString());
      socket.join(ride.driver_id.toString());

      this.io.to(ride.user_id.toString()).emit("ride-status-update", ride);
      this.io.to(ride.driver_id.toString()).emit("ride-status-update", ride);

      const userBody = {
        device_token: ride.user.device_token,
        user: ride.user_id,
        message: `Your ride status has been updated to ${ride_status}`,
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };
      await notification.createNotification({ body: userBody });

      const driverBody = {
        device_token: ride.driver.device_token,
        user: ride.driver_id,
        message: `The ride status has been updated to ${ride_status}`,
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };
      await notification.createNotification({ body: driverBody });
    } catch (error) {
      socket.emit("ride-status-update", {
        status: 0,
        message: "Error updating ride status",
        error
      });
    }
  }

  async shareRide(socket, data) {
    try {
      const { ride_id, user_id } = data;
      const ride = await this.ride.findOne({ _id: ride_id });

      if (!ride) {
        return socket.emit("share-ride", {
          status: 0,
          message: "Ride not found"
        });
      }

      if (!ride.share_with.includes(user_id)) {
        ride.share_with.push(user_id);
        await ride.save();
      }

      socket.emit("share-ride", {
        status: 1,
        message: "Ride shared successfully",
        ride
      });

      socket.join(user_id.toString());
      this.io.to(user_id.toString()).emit("share-ride", ride);

      const body = {
        device_token: user_id.device_token,
        user: user_id,
        message: "A ride was shared with you",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body });
    } catch (error) {
      socket.emit("share-ride", {
        status: 0,
        message: "Error sharing ride",
        error
      });
    }
  }

  async rideLocationUpdate(socket, data) {
    try {
      const { ride_id, driver_id, current_location, eta } = data;
      const ride = await this.ride.findOne({ _id: ride_id, driver_id });

      if (!ride) {
        return socket.emit("ride-location-update", {
          status: 0,
          message: "Ride not found"
        });
      }

      ride.tracking.current_location.coordinates = current_location.coordinates;
      if (eta) ride.tracking.eta = eta;

      await ride.save();

      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit("ride-location-update", {
        status: 1,
        ride
      });

      socket.join(ride.driver_id.toString());
      this.io.to(ride.driver_id.toString()).emit("ride-location-update", {
        status: 1,
        ride
      });

      const body = {
        device_token: ride.user.device_token,
        user: ride.user_id,
        message: "The ride location has been updated",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };
      await notification.createNotification({ body });
    } catch (error) {
      socket.emit("ride-location-update", {
        status: 0,
        message: "Error updating ride location",
        error
      });
    }
  }
}

module.exports = new Service();
