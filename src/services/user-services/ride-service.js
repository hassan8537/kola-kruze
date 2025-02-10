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

      const { pickup_location, dropoff_location } = request.body;

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
          dropoff_location
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

  // for nearby drivers
  // async rideRequest(socket, data) {
  //   try {
  //     const {
  //       user_id,
  //       pickup_location,
  //       dropoff_location,
  //       stops,
  //       fare_details,
  //       vehicle_category
  //     } = data;

  //     const user = await this.user.findById(user_id);
  //     const object_type = "get-ride";

  //     if (!user) {
  //       return socket.emit(
  //         "response",
  //         failedEvent({ object_type, message: "No user found" })
  //       );
  //     }

  //     const existingRide = await this.ride.findOne({
  //       user_id,
  //       ride_status: { $in: ["pending", "ongoing"] }
  //     });

  //     if (existingRide) {
  //       return socket.emit(
  //         "response",
  //         failedEvent({
  //           object_type,
  //           message: "A ride is already in progress"
  //         })
  //       );
  //     }

  //     const newRide = await this.ride.create({
  //       user_id,
  //       pickup_location,
  //       dropoff_location,
  //       stops,
  //       fare_details
  //     });

  //     const ride = await this.ride
  //       .findById(newRide._id)
  //       .populate(populateRide.populate);

  //     socket.emit(
  //       "response",
  //       successEvent({
  //         object_type,
  //         message: "Ride request sent successfully",
  //         data: ride
  //       })
  //     );

  //     const maxDistanceInMiles = process.env.MAX_DISTANCE_IN_MILES || 5;
  //     const [pickupLongitude, pickupLatitude] =
  //       pickup_location.location.coordinates;

  //     const drivers = await this.user.find({
  //       role: "driver",
  //       is_available: true,
  //       is_deleted: false
  //     });

  //     // Filter nearby drivers based on location
  //     const nearbyDrivers = drivers.filter((driver) => {
  //       const driverCoordinates = driver.current_location?.coordinates || [];
  //       if (driverCoordinates.length === 0) return false;

  //       const [driverLongitude, driverLatitude] = driverCoordinates;
  //       const distance = getDistanceBetweenSourceAndDestination(
  //         pickupLatitude,
  //         pickupLongitude,
  //         driverLatitude,
  //         driverLongitude
  //       );

  //       return distance <= maxDistanceInMiles;
  //     });

  //     if (nearbyDrivers.length > 0) {
  //       await Promise.all(
  //         nearbyDrivers.map((driver) => {
  //           socket.join(driver._id.toString());
  //           this.io.to(driver._id.toString()).emit(
  //             "response",
  //             successEvent({
  //               object_type: "new-ride-request",
  //               message: "A user requested a ride near your location",
  //               data: ride
  //             })
  //           );
  //         })
  //       );
  //     } else {
  //       socket.emit(
  //         "response",
  //         failedEvent({
  //           object_type,
  //           message: "No drivers are available within your area."
  //         })
  //       );
  //     }
  //   } catch (error) {
  //     socket.emit("error", errorEvent({ error }));
  //   }
  // }

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
      const object_type = "get-ride";

      if (!user) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No user found" })
        );
      }

      const existingRide = await this.ride.findOne({
        user_id,
        ride_status: {
          $in: ["pending", "ongoing", "accepted", "arrived"]
        }
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
          object_type,
          message: "Ride request sent successfully",
          data: ride
        })
      );

      // Find all available drivers (without filtering by location)

      const vehicles = await this.vehicle.find({
        vehicle_category,
        is_verified: true
      });

      const drivers = await this.user.find({
        role: "driver",
        is_available: true,
        is_deleted: false,
        driver_preference,
        gender_preference,
        driver_license: { $ne: null }
      });

      const driversWithVehicleCategory = drivers.filter((driver) =>
        vehicles.includes({ user_id: driver._id.toString() })
      );

      socket.emit(
        "response",
        failedEvent({
          object_type,
          message: "Connecting you to nearby drivers..."
        })
      );

      if (driversWithVehicleCategory.length > 0) {
        await Promise.all(
          driversWithVehicleCategory.map((driver) => {
            socket.join(driver._id.toString());
            this.io.to(driver._id.toString()).emit(
              "response",
              successEvent({
                object_type: object_type,
                message: "A user requested a ride",
                data: ride
              })
            );
          })
        );
      } else {
        socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "We are sorry! No drivers are available at the moment."
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async acceptRideRequest(socket, data) {
    try {
      const { ride_id, driver_id } = data;
      const object_type = "accept-ride";

      // Check if the ride exists and is pending
      const ride = await this.ride.findOneAndUpdate(
        { _id: ride_id, ride_status: "pending" },
        { $set: { driver_id, ride_status: "accepted" } },
        { new: true }
      );

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride is not available for acceptance"
          })
        );
      }

      // Check if driver is already assigned to another ride
      const activeRide = await this.ride.findOne({
        driver_id,
        ride_status: { $in: ["accepted", "ongoing"] }
      });

      if (activeRide) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "You already have an active ride"
          })
        );
      }

      // Notify the driver
      socket.emit(
        "response",
        successEvent({
          object_type,
          message: "Ride accepted successfully",
          data: ride
        })
      );

      // Notify the user in real-time
      socket.join(ride.user_id.toString());
      this.io.to(ride.user_id.toString()).emit(
        "response",
        successEvent({
          object_type: object_type,
          message: "Your ride has been accepted by a driver",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("response", errorEvent({ error }));
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
      socket.emit("response", errorEvent({ error }));
    }
  }

  async startRide(socket, data) {
    try {
      const { ride_id, driver_id } = data;
      const object_type = "start-ride";

      // Find the ride and ensure it's in the correct status before starting
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
            // Write your code here
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
}

module.exports = new Service();
