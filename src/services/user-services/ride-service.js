const Ride = require("../../models/Ride");
const User = require("../../models/User");
const {
  populateRide,
  populateCategory
} = require("../../populate/populate-models");
const {
  errorResponse,
  failedResponse,
  unavailableResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");
const notification = require("../../services/user-services/notification-service");
const {
  getDistanceBetweenSourceAndDestination,
  isETAWithinTwoMinutes
} = require("../../utilities/calculators/calculators");
const {
  failedEvent,
  successEvent,
  errorEvent
} = require("../../utilities/handlers/event-handlers");
const Category = require("../../models/Vehicle-Category");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
    this.category = Category;
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

  async createRide(request, response) {
    try {
      const user_id = request.user._id;

      const existingRide = await this.ride
        .findOne(
          { user_id, ride_status: { $in: ["pending", "ongoing"] } },
          "_id"
        )
        .lean();

      if (existingRide) {
        return failedResponse({
          response,
          message: "A ride is already in progress"
        });
      }

      const { pickup_location, dropoff_location, scheduled_time } =
        request.body;

      const totalMiles = getDistanceBetweenSourceAndDestination(
        pickup_location.location.coordinates[1],
        pickup_location.location.coordinates[0],
        dropoff_location.location.coordinates[1],
        dropoff_location.location.coordinates[0]
      ).toFixed(2);

      const categories = await this.category
        .find()
        .populate(populateCategory.populate)
        .lean();
      if (!categories.length) {
        return unavailableResponse({
          response,
          message: "No categories found."
        });
      }

      return successResponse({
        response,
        message: "Ride created successfully.",
        data: {
          vehicle_categories: categories,
          distance_miles: Number(totalMiles),
          pickup_location,
          dropoff_location,
          scheduled_time
        }
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async manageStops(request, response) {
    try {
      const { pickup_location, dropoff_location, stops = [] } = request.body;

      if (!stops.length) {
        return failedResponse({
          response,
          message: "No new stops provided."
        });
      }

      const admin = await this.user.findOne({ role: "admin" });

      const pickupCoords = pickup_location.location.coordinates;
      const dropoffCoords = dropoff_location.location.coordinates;

      // Calculate total distance with stops in order
      let totalMiles = 0;
      let prevCoords = pickupCoords;

      const sortedStops = stops.sort((a, b) => a.stop_order - b.stop_order);

      for (const stop of sortedStops) {
        const stopCoords = stop.location.coordinates;
        totalMiles += getDistanceBetweenSourceAndDestination(
          prevCoords[1],
          prevCoords[0],
          stopCoords[1],
          stopCoords[0]
        );
        prevCoords = stopCoords;
      }

      // Add final segment from last stop to dropoff
      totalMiles += getDistanceBetweenSourceAndDestination(
        prevCoords[1],
        prevCoords[0],
        dropoffCoords[1],
        dropoffCoords[0]
      );

      const categories = await this.category
        .find()
        .populate(populateCategory.populate)
        .lean();
      if (!categories.length) {
        return unavailableResponse({
          response,
          message: "No categories found."
        });
      }

      return successResponse({
        response,
        message: "Stop(s) managed successfully.",
        data: {
          vehicle_categories: categories,
          rate_per_stop: admin.rate_per_stop,
          distance_miles: Number(totalMiles.toFixed(2)),
          pickup_location,
          dropoff_location,
          stops: sortedStops,
          scheduled_time
        }
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async rideRequest(socket, data) {
    try {
      const {
        user_id,
        pickup_location,
        dropoff_location,
        stops,
        scheduled_time
      } = data;

      const user = await this.user.findById(user_id);
      const object_type = "get-ride";

      if (!user) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No user found" })
        );
      }

      const existingRide = await this.ride.findOne({
        user_id,
        ride_status: { $in: ["pending", "ongoing"] }
      });

      if (existingRide) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "A ride is already in progress"
          })
        );
      }

      const newRide = await this.ride.create({
        user_id,
        pickup_location,
        dropoff_location,
        stops,
        fare_details,
        tracking,
        scheduled_time
      });

      const ride = await this.ride
        .findById(newRide._id)
        .populate(populateRide.populate);

      socket.emit(
        "response",
        successEvent({
          object_type,
          message: "Ride request sent successfully",
          data: ride
        })
      );

      const maxDistanceInMiles = process.env.MAX_DISTANCE_IN_MILES || 5;

      const drivers = await this.user.find({
        role: "driver",
        driver_preference: user.driver_preference,
        gender_preference: user.gender_preference,
        is_available: true,
        is_deleted: false
      });

      const nearbyDrivers = drivers.filter((driver) => {
        const driverCoordinates = driver.current_location?.coordinates || [];
        if (driverCoordinates.length === 0) return false;

        const [driverLongitude, driverLatitude] = driverCoordinates;
        const [pickupLongitude, pickupLatitude] =
          pickup_location[0].location.coordinates;
        const distance = getDistanceBetweenSourceAndDestination(
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
            this.io.to(driver._id.toString()).emit("response", ride);

            // const body = {
            //   device_token: driver.device_token,
            //   user: driver._id,
            //   message: "A user requested a ride within your area",
            //   type: "ride",
            //   model_id: newRide._id,
            //   model_type: "ride",
            //   meta_data: { ...newRide.toJSON() }
            // };
            // return notification.createNotification({ body });
          })
        );
      } else {
        socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "No drivers are available within your area."
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async rideRequestResponse(socket, data) {
    try {
      const { ride_id, driver_id, ride_status } = data;
      const ride = await this.ride.findById(ride_id);
      if (!ride) {
        return socket.emit("response", {
          status: 0,
          message: "No ride found"
        });
      }

      if (!ride_status) {
        return socket.emit("response", {
          status: 0,
          message: `Ride rejected`
        });
      }

      ride.driver_id = driver_id;
      ride.ride_status = ride_status;
      await ride.save();

      socket.emit("response", {
        status: 1,
        message: `Ride ${ride_status}`,
        ride
      });

      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit("response", ride);

      // const body = {
      //   device_token: ride.user.device_token,
      //   user: ride.user_id,
      //   message: "Your ride request has been accepted",
      //   type: "ride",
      //   model_id: ride._id,
      //   model_type: "ride",
      //   meta_data: { ...ride.toJSON() }
      // };

      // await notification.createNotification({ body });
    } catch (error) {
      socket.emit("response", {
        status: 0,
        message: "Error updating ride request",
        error
      });
    }
  }

  async cancelRideRequest(socket, data) {
    try {
      const { user_id, ride_status, cancellation } = data;

      let ride;

      const user = await this.user.findById(user_id);

      const rideQuery =
        user.role === "passenger"
          ? { user_id: user._id, ride_status: { $in: ["ongoing", "accepted"] } }
          : {
              driver_id: user._id,
              ride_status: { $in: ["ongoing", "accepted"] }
            };

      ride = await this.ride.findOne(rideQuery);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({ message: "No ride found" })
        );
      }

      const statuses = ["accepted", "ongoing"];

      if (ride && statuses.includes(ride.ride_status)) {
        if (user.role === "passenger") {
          const cancellationWindow = isETAWithinTwoMinutes(
            ride.tracking.driver.eta_to_pickup
          );

          if (!cancellationWindow) {
            const cancellationData = {
              user_id: user._id,
              reason: cancellation.reason,
              description: cancellation.description
            };

            ride.ride_status = "cancelled";
            ride.cancellation = cancellationData;
            await ride.save();

            socket.emit(
              "response",
              successEvent({
                message: "Your ride has been cancelled successfully"
              })
            );

            socket.join(ride.driver_id.toString());
            io.to(ride.driver_id.toString());
            // Logic to implement full charge back in passenger's account
          } else {
            const cancellationData = {
              user_id: user._id,
              reason: cancellation.reason,
              description: cancellation.description
            };

            ride.ride_status = "cancelled";
            ride.cancellation = cancellationData;
            await ride.save();

            socket.emit(
              "response",
              successEvent({
                message: "Your ride has been cancelled successfully"
              })
            );
          }
        }
      } else {
        socket.emit(
          "response",
          failedEvent({ message: `You cannot cancel a ${ride_status} ride` })
        );
      }

      ride.driver_id = driver_id;
      ride.ride_status = ride_status;
      await ride.save();

      socket.emit("response", {
        status: 1,
        message: `Ride ${ride_status}`,
        ride
      });

      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit("response", ride);

      // const body = {
      //   device_token: ride.user.device_token,
      //   user: ride.user_id,
      //   message: "Your ride request has been accepted",
      //   type: "ride",
      //   model_id: ride._id,
      //   model_type: "ride",
      //   meta_data: { ...ride.toJSON() }
      // };

      // await notification.createNotification({ body });
    } catch (error) {
      socket.emit("response", {
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
        return socket.emit("response", {
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

      socket.emit("response", {
        status: 1,
        message: "Ride status updated",
        ride
      });

      socket.join(ride.user_id.toString());
      socket.join(ride.driver_id.toString());

      this.io.to(ride.user_id.toString()).emit("response", ride);
      this.io.to(ride.driver_id.toString()).emit("response", ride);

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
      socket.emit("response", {
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
