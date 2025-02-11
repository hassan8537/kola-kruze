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
  isETAWithinTwoMinutes,
  calculateDistance,
  calculateETA
} = require("../../utilities/calculators/calculators");
const {
  failedEvent,
  successEvent,
  errorEvent
} = require("../../utilities/handlers/event-handlers");
const Category = require("../../models/Vehicle-Category");
const Vehicle = require("../../models/Vehicle");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
    this.category = Category;
    this.vehicle = Vehicle;
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

      try {
        const { pickup_location, dropoff_location, stops = [] } = request.body;

        const admin = await this.user.findOne({ role: "admin" });

        const pickupCoords = pickup_location.location.coordinates;
        const dropoffCoords = dropoff_location.location.coordinates;

        // Calculate total distance with stops in order
        let totalMiles = 0;
        let prevCoords = pickupCoords;

        if (!stops.length) {
          for (const stop of stops) {
            const stopCoords = stop.location.coordinates;
            totalMiles += getDistanceBetweenSourceAndDestination(
              prevCoords[1],
              prevCoords[0],
              stopCoords[1],
              stopCoords[0]
            );
            prevCoords = stopCoords;
          }
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
            stops: stops
          }
        });
      } catch (error) {
        return errorResponse({ response, error });
      }
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

      for (const stop of stops) {
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
          stops: stops
        }
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async joinRoom(socket, data) {
    const { userId } = data;

    socket.join(userId.toString());

    console.log(`User [${userId}] joined the room.`);

    socket.emit(
      "response",
      successEvent({
        object_type: "room-joined",
        message: `User ID [${userId}] joined the room`,
        data: { user_id: userId }
      })
    );
  }

  async requestARide(socket, data) {
    try {
      const {
        user_id,
        vehicle_category,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops,
        driver_preference,
        gender_preference
      } = data;

      const user = await this.user.findById(user_id);
      if (!user) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "user-not-found",
            message: "User not found"
          })
        );
      }

      // Check for existing ride
      const existingRide = await this.ride.findOne({
        user_id,
        ride_status: { $in: ["pending", "ongoing", "accepted", "arrived"] }
      });

      if (existingRide) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "ride-in-progress",
            message: "A ride is already in progress"
          })
        );
      }

      // Create a new ride request
      const newRide = await this.ride.create({
        user_id,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops
      });

      const ride = await this.ride
        .findById(newRide._id)
        .populate(populateRide.populate);

      socket.emit(
        "response",
        successEvent({
          object_type: "ride-request-sent",
          message: "Ride request sent successfully",
          data: ride
        })
      );

      // Find available drivers
      const availableDrivers = await this.user.find({
        role: "driver",
        is_available: true,
        is_deleted: false
      });

      socket.emit(
        "response",
        successEvent({
          object_type: "connecting-drivers",
          message: "Connecting you to nearby drivers..."
        })
      );

      if (availableDrivers.length > 0) {
        availableDrivers.forEach((driver) => {
          this.io.to(driver._id.toString()).emit(
            "response",
            successEvent({
              object_type: "get-ride",
              message: "A user requested a ride",
              data: ride
            })
          );
        });
      }

      // Set a timeout to expire the ride request if no driver accepts it
      const rideTimeout = setTimeout(async () => {
        const latestRide = await this.ride.findById(ride._id);

        if (latestRide && latestRide.ride_status === "pending") {
          await this.deleteRide(ride);

          // Notify user
          socket.emit(
            "response",
            failedEvent({
              object_type: "no-drivers-available",
              message: "We are sorry! No drivers accepted the ride request."
            })
          );

          this.io.to(ride.user_id.toString()).emit(
            "response",
            failedEvent({
              object_type: "ride-expired",
              message:
                "Your ride request has been canceled due to no available drivers."
            })
          );

          // Notify drivers
          availableDrivers.forEach((driver) => {
            this.io.to(driver._id.toString()).emit(
              "response",
              successEvent({
                object_type: "ride-expired",
                message: "The ride request has expired.",
                data: ride
              })
            );
          });
        }
      }, process.env.RIDE_REQUEST_TIMER); // Default to 3 minutes if env variable not set

      // Clear timeout if ride is accepted or canceled
      const clearRideTimeout = (data) => {
        if (data.ride_id.toString() === ride._id.toString()) {
          clearTimeout(rideTimeout);
        }
      };

      socket.on("accept-a-ride", clearRideTimeout);
      socket.on("cancel-a-ride", clearRideTimeout);
    } catch (error) {
      socket.emit(
        "error",
        errorEvent({
          error
        })
      );
    }
  }

  async acceptARide(socket, data) {
    try {
      const { user_id, ride_id, driver_id } = data;

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, ride_status: "pending" },
          { $set: { driver_id, ride_status: "accepted" } },
          { new: true }
        )
        .populate(populateRide.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "no-riders-available",
            message: "Ride is not available for acceptance"
          })
        );
      }

      const ongoingRide = await this.ride.findOne({
        driver_id,
        ride_status: { $in: ["ongoing"] }
      });

      if (ongoingRide) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "ride-in-progress",
            message: "You already have an ongoing ride"
          })
        );
      }

      // ✅ Emit to the driver (confirmation)
      socket.emit(
        "response",
        successEvent({
          object_type: "driver-ride-accepted",
          message: "Ride accepted successfully",
          data: ride
        })
      );

      // ✅ Emit to the user using the correct room
      socket.join(user_id);
      this.io.to(user_id.toString()).emit(
        "response",
        successEvent({
          object_type: "user-ride-accepted",
          message: "Your ride has been accepted by a driver",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async arrivedAtPickup(socket, data) {
    try {
      const { ride_id, driver_id } = data;
      const object_type = "ride-update";

      // Find the ride and ensure it's in an accepted state
      const ride = await this.ride.findOneAndUpdate(
        { _id: ride_id, driver_id, ride_status: "accepted" },
        { $set: { ride_status: "arrived" } },
        { new: true }
      );

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride not found or cannot be updated"
          })
        );
      }

      // Notify the driver
      socket.emit(
        "response",
        successEvent({
          object_type,
          message: "You arrived at pickup location",
          data: ride
        })
      );

      // Notify the user
      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit(
        "response",
        successEvent({
          object_type: object_type,
          message: "Your driver has arrived at the pickup location",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async startRide(socket, data) {
    try {
      const { ride_id, driver_id } = data;
      const object_type = "start-ride";

      const ride = await this.ride.findOneAndUpdate(
        { _id: ride_id, driver_id, ride_status: "arrived" },
        { $set: { ride_status: "started", start_time: Date.now() } },
        { new: true }
      );

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride not found or cannot be started"
          })
        );
      }

      // Notify the driver
      socket.emit(
        "response",
        successEvent({
          object_type,
          message: "Ride has started",
          data: ride
        })
      );

      // Notify the user
      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit(
        "response",
        successEvent({
          object_type: object_type,
          message: "Your ride has started",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("response", errorEvent({ error }));
    }
  }

  async cancelARide(socket, data) {
    try {
      const { user_id, ride_id, cancellation } = data;
      const object_type = "cancel-ride";

      const user = await this.user.findById(user_id);
      if (!user) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "User not found" })
        );
      }

      const rideQuery =
        user.role === "passenger"
          ? {
              user_id: user._id,
              ride_status: { $in: ["ongoing", "accepted", "pending"] }
            }
          : {
              driver_id: user._id,
              ride_status: { $in: ["ongoing", "accepted", "pending"] }
            };

      const ride = await this.ride.findOne(rideQuery);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "No active ride found to cancel"
          })
        );
      }

      // Set cancellation details
      ride.ride_status = "cancelled";
      ride.cancellation = {
        user_id: user._id,
        reason: cancellation?.reason,
        description: cancellation?.description
      };

      await ride.save();

      // If passenger cancels the ride
      if (user.role === "passenger") {
        const isWithinWindow = isETAWithinTwoMinutes(
          ride.tracking?.driver?.eta_to_pickup
        );

        socket.emit(
          "response",
          successEvent({
            object_type,
            message: "Your ride has been cancelled successfully",
            data: ride
          })
        );

        // Notify the driver
        this.io.to(ride.driver_id.toString()).emit(
          "response",
          failedEvent({
            object_type,
            message: isWithinWindow
              ? "Ride cancelled by passenger"
              : "Ride cancelled - full charge applied",
            data: ride
          })
        );

        // TODO: Implement refund or charge logic based on the cancellation window
      } else {
        // If the driver cancels the ride
        socket.emit(
          "response",
          successEvent({
            object_type,
            message: "You have cancelled the ride",
            data: ride
          })
        );

        // Notify the passenger
        this.io.to(ride.user_id.toString()).emit(
          "response",
          failedEvent({
            object_type,
            message: "Driver has cancelled the ride",
            data: ride
          })
        );
      }
    } catch (error) {
      socket.emit(
        "response",
        errorEvent({
          object_type: "cancel-ride",
          message: "Error cancelling ride",
          error
        })
      );
    }
  }

  async updateLocation(socket, data) {
    try {
      const { user_id, current_location } = data;

      const user = await this.user.findById(user_id);

      if (!user) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "get-location",
            message: "No user found"
          })
        );
      }

      await this.user.findByIdAndUpdate(
        user._id,
        { current_location },
        { new: true }
      );

      return socket.emit(
        "response",
        successEvent({
          object_type: "get-location",
          message: "Current location updated successfully",
          data: {
            current_location
          }
        })
      );
    } catch (error) {
      return errorEvent({ error });
    }
  }

  async etaToPickup(socket, data) {
    try {
      const { ride_id, pickup_location, driver_current_location } = data;
      const object_type = "get-eta";

      if (!ride_id || !pickup_location || !driver_current_location) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "Invalid request data" })
        );
      }

      const ride = await this.ride.findById(ride_id);
      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No ride found" })
        );
      }

      const [pickup_longitude, pickup_latitude] =
        pickup_location.location.coordinates;
      const [driver_longitude, driver_latitude] =
        driver_current_location.coordinates;

      const distance = calculateDistance(
        driver_latitude,
        driver_longitude,
        pickup_latitude,
        pickup_longitude
      );
      const eta = calculateETA(distance);

      const updatedRide = await this.ride.findByIdAndUpdate(
        ride_id,
        { $set: { "tracking.eta_to_pickup": eta } },
        { new: true }
      );

      // Notify User
      if (ride.user_id) {
        socket.join(ride.user_id.toString());
        this.io.to(ride.user_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `The driver will reach you in ${eta} minutes`,
            data: updatedRide
          })
        );
      }

      // Notify Driver
      if (ride.driver_id) {
        socket.join(ride.driver_id.toString());
        this.io.to(ride.driver_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `You will reach the passenger in ${eta} minutes`,
            data: updatedRide
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async etaToDropOff(socket, data) {
    try {
      const { ride_id, dropoff_location, driver_current_location } = data;
      const object_type = "get-eta";

      if (!ride_id || !dropoff_location || !driver_current_location) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "Invalid request data" })
        );
      }

      const ride = await this.ride.findById(ride_id);
      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No ride found" })
        );
      }

      const [dropoff_longitude, dropoff_latitude] =
        dropoff_location.location.coordinates;
      const [driver_longitude, driver_latitude] =
        driver_current_location.coordinates;

      const distance = calculateDistance(
        driver_latitude,
        driver_longitude,
        dropoff_latitude,
        dropoff_longitude
      );
      const eta = calculateETA(distance);

      const updatedRide = await this.ride.findByIdAndUpdate(
        ride_id,
        { $set: { "tracking.eta_to_dropoff": eta } },
        { new: true }
      );

      // Notify User
      if (ride.user_id) {
        socket.join(ride.user_id.toString());
        this.io.to(ride.user_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `You will reach your destination in ${eta} minutes`,
            data: updatedRide
          })
        );
      }

      // Notify Driver
      if (ride.driver_id) {
        socket.join(ride.driver_id.toString());
        this.io.to(ride.driver_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `You will reach your destination in ${eta} minutes`,
            data: updatedRide
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
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

  async deleteRide(ride) {
    await this.ride.findByIdAndDelete(ride._id);
  }
}

module.exports = new Service();
