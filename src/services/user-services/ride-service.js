const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);

const Ride = require("../../models/Ride");
const User = require("../../models/User");
const { failedResponse } = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");
const notification = require("../../services/user-services/notification-service");
const {
  calculateDistance
} = require("../../utilities/calculators/distance-calculator");
const {
  failedEvent,
  successEvent,
  errorEvent
} = require("../../utilities/handlers/event-handlers");
const Category = require("../../models/Category");
const Vehicle = require("../../models/Vehicle");
const Card = require("../../models/Card");
const rideSchema = require("../../schemas/ride-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const categorySchema = require("../../schemas/category-schema");
const {
  formatStripeList
} = require("../../utilities/formatters/stripe-card-list-formatter");
const { calculateETA } = require("../../utilities/calculators/eta-calculator");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
    this.category = Category;
    this.vehicle = Vehicle;
    this.card = Card;
  }

  async getMyRides(req, res) {
    try {
      const { _id } = req.query;

      const user_id =
        req.user.role === "driver"
          ? { driver_id: req.user._id }
          : { user_id: req.user._id };

      const filters = { user_id };
      if (_id) filters._id = _id;
      const { page, limit, sort } = req.query;
      await pagination({
        response: res,
        table: "Rides",
        model: this.ride,
        filters,
        page,
        limit,
        sort,
        populate: rideSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ object_type: "get-rides", message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async selectDestination(req, res) {
    try {
      const user_id = req.user._id;

      const existingRide = await this.ride
        .findOne(
          { user_id, ride_status: { $in: ["pending", "ongoing", "booked"] } },
          "_id"
        )
        .lean();

      if (existingRide) {
        handlers.logger.failed({
          object_type: "select-destinations",
          message: "A ride is already in progress"
        });
        return handlers.response.failed({
          res,
          message: "A ride is already in progress"
        });
      }

      try {
        const { pickup_location, dropoff_location, stops = [] } = req.body;

        const admin = await this.user.findOne({ role: "admin" });

        const pickupCoords = pickup_location.location.coordinates;
        const dropoffCoords = dropoff_location.location.coordinates;

        // Calculate total distance with stops in order
        let totalMiles = 0;
        let prevCoords = pickupCoords;

        if (!stops.length) {
          for (const stop of stops) {
            const stopCoords = stop.location.coordinates;
            totalMiles += calculateDistance(
              prevCoords[1],
              prevCoords[0],
              stopCoords[1],
              stopCoords[0]
            );
            prevCoords = stopCoords;
          }
        }

        // Add final segment from last stop to dropoff
        totalMiles += calculateDistance(
          prevCoords[1],
          prevCoords[0],
          dropoffCoords[1],
          dropoffCoords[0]
        );

        const categories = await this.category
          .find()
          .populate(categorySchema.populate)
          .lean();
        if (!categories.length) {
          handlers.logger.failed({
            object_type: "select-destinations",
            message: "No categories found"
          });
          return handlers.response.failed({
            res,
            message: "No categories found"
          });
        }

        handlers.logger.success({
          object_type: "select-destinations",
          message: "Stop(s) managed successfully.",
          data: {
            vehicle_categories: categories,
            rate_per_stop: admin.rate_per_stop,
            distance_miles: Number(totalMiles),
            pickup_location,
            dropoff_location,
            stops: stops
          }
        });
        return handlers.response.success({
          res,
          message: "Stop(s) managed successfully.",
          data: {
            vehicle_categories: categories,
            rate_per_stop: admin.rate_per_stop,
            distance_miles: Number(totalMiles),
            pickup_location,
            dropoff_location,
            stops: stops
          }
        });
      } catch (error) {
        handlers.logger.error({
          object_type: "select-destinations",
          message: error
        });
        return handlers.response.error({
          res,
          message: error.message
        });
      }
    } catch (error) {
      handlers.logger.error({
        object_type: "select-destinations",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async manageStops(req, res) {
    try {
      const { pickup_location, dropoff_location, stops = [] } = req.body;

      if (!stops.length) {
        handlers.logger.failed({
          object_type: "manage-stops",
          message: "No new stops provided."
        });
        return handlers.response.failed({
          res,
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
        totalMiles += calculateDistance(
          prevCoords[1],
          prevCoords[0],
          stopCoords[1],
          stopCoords[0]
        );
        prevCoords = stopCoords;
      }

      // Add final segment from last stop to dropoff
      totalMiles += calculateDistance(
        prevCoords[1],
        prevCoords[0],
        dropoffCoords[1],
        dropoffCoords[0]
      );

      const categories = await this.category
        .find()
        .populate(categorySchema.populate)
        .lean();
      if (!categories.length) {
        handlers.logger.unavailable({
          object_type: "manage-stops",
          message: "No categories found"
        });
        return handlers.response.unavailable({
          res,
          message: "No categories found"
        });
      }

      const data = {
        vehicle_categories: categories,
        rate_per_stop: admin.rate_per_stop,
        distance_miles: Number(totalMiles),
        pickup_location,
        dropoff_location,
        stops: stops
      };

      handlers.logger.success({
        object_type: "select-destinations",
        message: "Stop(s) managed successfully.",
        data: data
      });
      return handlers.response.success({
        res,
        message: "Stop(s) managed successfully.",
        data: data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "manage-stops",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async rideDetailsAndFares(req, res) {
    try {
      const user_id = req.user._id;
      const {
        vehicle_category,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops,
        stripe_card_id
      } = req.body;

      const user = await this.user.findById(user_id);
      if (!user) {
        handlers.logger.unavailable({
          object_type: "ride-details-and-fares",
          message: "No user found"
        });
        return handlers.response.unavailable({
          res,
          message: "No user found"
        });
      }

      const categories = await this.category
        .find()
        .populate(categorySchema.populate);
      if (!categories.length) {
        handlers.logger.unavailable({
          object_type: "ride-details-and-fares",
          message: "No categories found"
        });
        return handlers.response.unavailable({
          res,
          message: "No categories found"
        });
      }

      // On Hold
      // const card = await this.card.findOne({ stripe_card_id });
      // if (!card) {
      //   handlers.logger.unavailable({
      //     object_type: "ride-details-and-fares",
      //     message: "No cards found"
      //   });
      //   return handlers.response.unavailable({
      //     res,
      //     message: "No cards found"
      //   });
      // }
      // const stripeCardDetails =
      //   await stripe.paymentMethods.retrieve(stripe_card_id);
      // const cardObject = card.toObject();
      // cardObject.card_details = stripeCardDetails;

      // Check for existing ride
      const existingRide = await this.ride.findOne({
        user_id,
        ride_status: {
          $in: ["pending", "ongoing", "accepted", "arrived", "booked"]
        }
      });

      // Create a new ride request
      const newRide = new this.ride({
        user_id,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops
      });

      await newRide.populate(rideSchema.populate);

      const admin = await this.user.findOne({ role: "admin" });

      const data = {
        selected_category: categories.filter(
          (cat) => cat._id.toString() === vehicle_category.toString()
        ),
        vehicle_categories: categories,
        rate_per_stop: admin.rate_per_stop,
        distance_miles: newRide.distance_miles,
        pickup_location: newRide.pickup_location,
        dropoff_location: newRide.dropoff_location,
        fare_details: newRide.fare_details,
        stops: newRide.stops
        // card: formatStripeList([cardObject.card_details])
      };

      handlers.logger.success({
        object_type: "ride-details-and-fares",
        message: "Ride confirmed successfully",
        data: data
      });
      return handlers.response.success({
        res,
        message: "Ride confirmed successfully",
        data: data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "ride-details-and-fares",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async confirmRide(req, res) {
    try {
      const {
        vehicle_category,
        pickup_location,
        dropoff_location,
        stops,
        fare_details,
        distance_miles,
        stripe_card_id
      } = req.body;

      // Check for existing ride
      const existingRide = await this.ride.findOne({
        user_id: req.user._id
      });

      if (existingRide) {
        const deletedRide = await this.ride.deleteMany({
          ride_status: "pending"
        });
        if (deletedRide) {
          handlers.logger.error({
            object_type: "confirm-ride",
            message: "Previous ride deleted successfully"
          });
        }
      }

      const newRide = new this.ride({
        user_id: req.user._id,
        pickup_location,
        dropoff_location,
        stops,
        fare_details,
        distance_miles
      });

      await newRide.save();
      await newRide.populate(rideSchema.populate);

      const categories = await this.category
        .find()
        .populate(categorySchema.populate);
      if (!categories.length) {
        handlers.logger.unavailable({
          object_type: "confirm-ride",
          message: "No categories found"
        });
        handlers.response.unavailable({
          res,
          message: "No categories found"
        });
      }

      // On Hold
      // const card = await this.card.findOne({ stripe_card_id });
      // if (!card) {
      //   handlers.logger.unavailable({
      //     object_type: "confirm-ride",
      //     message: "No cards found"
      //   });
      //   handlers.logger.unavailable({
      //     res,
      //     message: "No cards found"
      //   });
      // }

      // const stripeCardDetails =
      //   await stripe.paymentMethods.retrieve(stripe_card_id);
      // const cardObject = card.toObject();
      // cardObject.card_details = stripeCardDetails;

      const admin = await this.user.findOne({ role: "admin" });

      const data = {
        _id: newRide._id,
        selected_category: categories.filter(
          (cat) => cat._id.toString() === vehicle_category.toString()
        ),
        vehicle_categories: categories,
        rate_per_stop: admin.rate_per_stop,
        distance_miles: newRide.distance_miles,
        pickup_location: newRide.pickup_location,
        dropoff_location: newRide.dropoff_location,
        fare_details: newRide.fare_details,
        stops: newRide.stops
        // card: formatStripeList([cardObject.card_details])
      };

      handlers.logger.success({
        object_type: "confirm-ride",
        message: "Ride confirmed successfully",
        data: data
      });
      handlers.response.success({
        res,
        message: "Ride confirmed successfully",
        data: data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "confirm-ride",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async verifyOtp(req, res) {
    try {
      const { _id, ride_otp } = req.body;

      const ride = await this.ride.findOne({ _id, ride_otp });

      if (!ride) {
        handlers.logger.failed({
          object_type: "verify-otp",
          message: "Invalid OTP"
        });
        return handlers.response.failed({
          res,
          message: "Invalid OTP"
        });
      }

      ride.ride_otp = null;
      ride.is_verified = true;
      await ride.save();
      await ride.populate(rideSchema.populate);

      handlers.logger.success({
        object_type: "verify-otp",
        message: "OTP verified successfully",
        data: ride
      });
      return handlers.response.success({
        res,
        message: "OTP verified successfully",
        data: ride
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "verify-otp",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async payNow(req, res) {
    try {
      if (!req.params._id) {
        handlers.logger.failed({
          object_type: "pay-now",
          message: "Ride ID is required"
        });
        return handlers.response.failed({
          res,
          message: "Ride ID is required"
        });
      }

      const ride = await this.ride.findById(req.params._id).populate("user_id");

      if (!ride) {
        handlers.logger.unavailable({
          object_type: "pay-now",
          message: "No rides found"
        });
        return handlers.response.unavailable({
          res,
          message: "No rides found"
        });
      }

      if (ride.ride_status === "booked")
        return failedResponse({
          response: res,
          message: "You already have booked this ride"
        });

      // On Hold
      // const stripe_default_card = ride.user_id.stripe_default_card;

      // const card = await this.card.findOne({
      //   stripe_card_id: stripe_default_card
      // });

      ride.ride_status = "booked";
      ride.fare_details.payment_status = "paid";
      await ride.save();
      await ride.populate(rideSchema.populate);

      handlers.logger.success({
        object_type: "pay-now",
        message: "Payment authorized and ride booked",
        data: ride
      });
      return handlers.response.success({
        res,
        message: "Payment authorized and ride booked",
        data: ride
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "pay-now",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async joinRoom(socket, data) {
    const { userId } = data;

    socket.join(userId);

    console.log(`User [${userId}] joined the room.`);

    return socket.emit(
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
      const { ride_id } = data;

      const ride = await this.ride
        .findOne({ _id: ride_id, ride_status: "booked" })
        .populate(rideSchema.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "ride-request-sent",
            message: "No ride found"
          })
        );
      }

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
        role: "driver"
        // driver_preference: ride.user_id.driver_preference,
        // gender_preference: ride.user_id.gender_preference,
        // is_available: true, // Fixed to correctly fetch available drivers
        // is_deleted: false
      });

      if (!availableDrivers.length) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "no-drivers-available",
            message: "No available drivers found."
          })
        );
      }

      socket.emit(
        "response",
        successEvent({
          object_type: "connecting-drivers",
          message: "Connecting you to nearby drivers..."
        })
      );

      console.log(
        "Available drivers:",
        availableDrivers.map((d) => d._id.toString())
      );

      availableDrivers.forEach(async (driver) => {
        console.log(
          `Attempting to emit to driver room: ${driver._id.toString()}`
        );
        console.log(`Rooms:`, this.io.sockets.adapter.rooms);

        socket.join(driver._id.toString());
        await this.io.to(driver._id.toString()).emit(
          "response",
          successEvent({
            object_type: "get-ride",
            message: "A user has requested a ride",
            data: ride
          })
        );
        console.log(
          `Ride request emitted successfully to driver ${driver._id}`
        );
      });

      // Set a timeout to expire the ride request if no driver accepts it
      const rideTimeout = setTimeout(async () => {
        const latestRide = await this.ride.findById(ride._id);

        if (latestRide && latestRide.ride_status === "booked") {
          // await this.deleteRide(ride);

          socket.emit(
            "response",
            failedEvent({
              object_type: "no-drivers-available",
              message: "We are sorry! No drivers accepted the ride request."
            })
          );

          await this.io.to(ride.user_id.toString()).emit(
            "response",
            failedEvent({
              object_type: "ride-expired",
              message:
                "Your ride request has been canceled due to no available drivers."
            })
          );

          availableDrivers.forEach(async (driver) => {
            await this.io.to(driver._id.toString()).emit(
              "response",
              successEvent({
                object_type: "ride-expired",
                message: "The ride request has expired.",
                data: ride
              })
            );
          });
        }
      }, process.env.RIDE_REQUEST_TIMER || 10000);

      // Clear timeout if ride is accepted or canceled
      const clearRideTimeout = (data) => {
        if (data.ride_id.toString() === ride._id.toString()) {
          clearTimeout(rideTimeout);
          availableDrivers.forEach(async (driver) => {
            await this.io.to(driver._id.toString()).emit(
              "response",
              successEvent({
                object_type: "ride-cancelled",
                message: "The ride request has been cancelled.",
                data: ride
              })
            );
          });
        }
      };

      // Handle new connections listening to the ride request
      socket.on("join-room", async (data) => {
        await this.joinRoom(socket, data);
        await this.io.to(data.userId.toString()).emit(
          "response",
          successEvent({
            object_type: "get-ride",
            message: "A user requested a ride",
            data: ride
          })
        );
      });

      socket.on("accept-a-ride", clearRideTimeout);
      socket.on("cancel-a-ride", clearRideTimeout);
    } catch (error) {
      console.error("Error in requestARide:", error);
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

      const vehicle = await this.vehicle.findOne({ user_id: driver_id });

      if (!vehicle) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "no-vehicles-available",
            message: "Driver does not have a vehicle registered"
          })
        );
      }

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, ride_status: "booked" },
          {
            $set: {
              driver_id,
              ride_status: "accepted",
              vehicle_id: vehicle._id
            }
          },
          { new: true }
        )
        .populate(rideSchema.populate);

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
        ride_status: { $in: ["accept", "start"] }
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
      await this.io.to(user_id.toString()).emit(
        "response",
        successEvent({
          object_type: "user-ride-accepted",
          message: "Your ride has been accepted by a driver",
          data: ride
        })
      );

      // await this.user.findByIdAndUpdate(driver_id, { is_available: false });
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async arrivedAtPickup(socket, data) {
    try {
      const { ride_id } = data;
      const object_type = "ride-arrived";

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, ride_status: "accepted" },
          { $set: { ride_status: "arrived", ride_otp: 123456 } },
          { new: true }
        )
        .populate(rideSchema.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride status could not be updated"
          })
        );
      }

      // Emit to both driver and user
      await this.io.to(ride.user_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Your driver has arrived at your pickup location",
          data: ride
        })
      );

      await this.io.to(ride.driver_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "You have arrived at the pickup location",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async startARide(socket, data) {
    try {
      const { ride_id } = data;
      const object_type = "ride-started";

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, ride_status: "arrived", is_verified: true },
          { $set: { ride_status: "started", start_time: Date.now() } },
          { new: true }
        )
        .populate(rideSchema.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride not found or cannot be started"
          })
        );
      }

      if (ride.fare_details.payment_status === "pending") {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "This ride is not booked yet." })
        );
      }

      // Emit to both driver and user
      await this.io.to(ride.user_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Your ride has started",
          data: ride
        })
      );

      await this.io.to(ride.driver_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Ride has started",
          data: ride
        })
      );
    } catch (error) {
      socket.emit("response", errorEvent({ error }));
    }
  }

  async endARide(socket, data) {
    try {
      const { ride_id } = data;
      const object_type = "ride-ended";

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, ride_status: "started" },
          { $set: { ride_status: "ended", end_time: Date.now() } },
          { new: true }
        )
        .populate(rideSchema.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride not found or cannot be ended"
          })
        );
      }

      // Emit to both driver and user
      await this.io.to(ride.user_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Your ride has ended",
          data: ride
        })
      );

      await this.io.to(ride.driver_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Ride has ended",
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

      // Find the ride
      const ride = await this.ride.findOne({
        _id: ride_id,
        $or: [{ user_id }, { driver_id: user_id }],
        ride_status: { $in: ["booked", "accepted"] }
      });

      // Ride not found
      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "ride-cancelled",
            message: "No active ride found to cancel"
          })
        );
      }

      const driver_id = ride.driver_id?.toString() || null;
      const passenger_id = ride.user_id?.toString() || null;
      const isPassenger = passenger_id === user_id;

      // Update ride status
      ride.ride_status = "cancelled";
      ride.cancellation = {
        user_id,
        reason: cancellation?.reason || null,
        description: cancellation?.description || null
      };

      await ride.save();

      // Get the updated ride
      const currentRide = await this.ride
        .findById(ride_id)
        .populate(rideSchema.populate);

      const object_type = isPassenger
        ? "ride-cancelled-by-passenger"
        : "ride-cancelled-by-driver";

      const message = successEvent({
        object_type,
        message: `The ride has been cancelled by the ${isPassenger ? "passenger" : "driver"}`,
        data: currentRide
      });

      // Emit to the user who cancelled
      socket.emit("response", message);

      // Emit to the other party if different
      const receiverId = isPassenger ? driver_id : passenger_id;

      if (receiverId && receiverId !== socket.id) {
        await this.io.to(receiverId).emit("response", message);
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error: error.message }));
    }
  }

  async etaToPickup(socket, data) {
    try {
      const { ride_id, driver_current_location } = data;
      const object_type = "get-eta-to-pickup";

      if (!driver_current_location?.coordinates) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Driver location is required"
          })
        );
      }

      const ride = await this.ride.findById(ride_id);
      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No ride found" })
        );
      }

      if (!ride.driver_id) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "No driver assigned to this ride"
          })
        );
      }

      // Extract locations
      const [pickup_longitude, pickup_latitude] =
        ride.pickup_location.location.coordinates;
      const [driver_longitude, driver_latitude] =
        driver_current_location.coordinates;

      // Calculate Distance & ETA
      const distance = calculateDistance(
        driver_latitude,
        driver_longitude,
        pickup_latitude,
        pickup_longitude
      );
      const eta = calculateETA(distance);

      // Construct response data
      const responseData = {
        ride_id,
        tracking: {
          distance_miles_from_pickup: distance,
          driver_current_location,
          eta_to_pickup: eta
        }
      };

      // Notify User
      if (ride.user_id) {
        socket.join(ride.user_id.toString());
        await this.io.to(ride.user_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `The driver will reach you in ${eta} minutes`,
            data: responseData
          })
        );
      }

      // Notify Driver
      if (ride.driver_id) {
        socket.join(ride.driver_id.toString());
        await this.io.to(ride.driver_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `You will reach the passenger in ${eta} minutes`,
            data: responseData
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async etaToDropOff(socket, data) {
    try {
      const { ride_id, driver_current_location } = data;
      const object_type = "get-eta-to-dropoff";

      if (!driver_current_location?.coordinates) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Driver location is required"
          })
        );
      }

      const ride = await this.ride.findById(ride_id);
      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({ object_type, message: "No ride found" })
        );
      }

      if (!ride.driver_id) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "No driver assigned to this ride"
          })
        );
      }

      // Extract locations
      const [dropoff_longitude, dropoff_latitude] =
        ride.dropoff_location.location.coordinates;
      const [driver_longitude, driver_latitude] =
        driver_current_location.coordinates;

      // Calculate Distance & ETA
      const distance = calculateDistance(
        driver_latitude,
        driver_longitude,
        dropoff_latitude,
        dropoff_longitude
      );
      const eta = calculateETA(distance);

      // Construct response data
      const responseData = {
        ride_id,
        tracking: {
          distance_miles_from_dropoff: distance,
          driver_current_location,
          eta_to_dropoff: eta
        }
      };

      // Notify User
      if (ride.user_id) {
        socket.join(ride.user_id.toString());
        await this.io.to(ride.user_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `The driver will reach your drop-off location in ${eta} minutes`,
            data: responseData
          })
        );
      }

      // Notify Driver
      if (ride.driver_id) {
        socket.join(ride.driver_id.toString());
        await this.io.to(ride.driver_id.toString()).emit(
          "response",
          successEvent({
            object_type,
            message: `You will reach the drop-off location in ${eta} minutes`,
            data: responseData
          })
        );
      }
    } catch (error) {
      socket.emit("error", errorEvent({ error }));
    }
  }

  async deleteRide(ride) {
    await this.ride.findByIdAndDelete(ride._id);
  }
}

module.exports = new Service();
