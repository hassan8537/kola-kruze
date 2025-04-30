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

  async getCurrentRide(req, res) {
    try {
      const userFilter =
        req.user.role === "driver"
          ? { driver_id: req.user._id }
          : { user_id: req.user._id };

      const currentRide = await this.ride
        .findOne({
          ...userFilter,
          ride_status: {
            $in: [
              "booked",
              "reserved",
              "accepted",
              "started",
              "scheduled",
              "arrived",
              "ongoing",
              "confirm-split-fare"
            ]
          }
        })
        .populate(rideSchema.populate);

      if (!currentRide) {
        handlers.logger.failed({
          object_type: "current-ride",
          message: "No current rides yet"
        });
        return handlers.response.failed({
          res,
          message: "No current rides yet"
        });
      }

      handlers.logger.success({
        object_type: "current-ride",
        message: "Current ride fetched successfully"
      });

      return handlers.response.success({
        res,
        message: "Current ride fetched successfully",
        data: currentRide
      });
    } catch (error) {
      handlers.logger.error({ object_type: "current-ride", message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getMyRides(req, res) {
    try {
      const { _id, status } = req.query;

      const userFilter =
        req.user.role === "driver"
          ? { driver_id: req.user._id }
          : { user_id: req.user._id };

      const filters = { ...userFilter };
      if (_id) filters._id = _id;
      if (status) filters.ride_status = status;

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
      const ride_type = req.body.ride_type || "instant";

      const existingRide = await this.ride
        .findOne(
          {
            user_id,
            ride_type,
            ride_status: {
              $in: [
                "booked",
                "reserved",
                "accepted",
                "started",
                "scheduled",
                "arrived",
                "ongoing",
                "waiting"
              ]
            }
          },
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

      if (ride_type === "instant") {
        const now = new Date();
        const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const oneMinuteBefore = new Date(
          twoHoursFromNow.getTime() - 1 * 60 * 1000
        );
        const oneMinuteAfter = new Date(
          twoHoursFromNow.getTime() + 1 * 60 * 1000
        );

        const nearScheduledRide = await this.ride
          .findOne({
            user_id,
            ride_type: "scheduled",
            ride_status: "scheduled",
            scheduled_at: { $gte: oneMinuteBefore, $lte: oneMinuteAfter }
          })
          .lean();

        if (nearScheduledRide) {
          handlers.logger.failed({
            object_type: "select-destinations",
            message:
              "Cannot create instant ride within 2 hours of a scheduled ride"
          });
          return handlers.response.failed({
            res,
            message:
              "Cannot create instant ride within 2 hours of a scheduled ride"
          });
        }
      }

      const {
        pickup_location,
        dropoff_location,
        stops = [],
        scheduled_at,
        no_of_passengers
      } = req.body;

      if (ride_type === "scheduled") {
        const now = new Date();
        const scheduledDate = new Date(scheduled_at);
        const minScheduledDate = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const maxAllowedDate = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        if (scheduledDate < now) {
          handlers.logger.failed({
            object_type: "scheduled-ride",
            message: "Scheduled ride cannot be in the past"
          });
          return handlers.response.failed({
            res,
            message: "Scheduled ride cannot be in the past"
          });
        }

        if (scheduledDate < minScheduledDate) {
          handlers.logger.failed({
            object_type: "scheduled-ride",
            message: "Scheduled ride must be at least 2 hours in the future"
          });
          return handlers.response.failed({
            res,
            message: "Scheduled ride must be at least 2 hours in the future"
          });
        }

        if (scheduledDate > maxAllowedDate) {
          handlers.logger.failed({
            object_type: "scheduled-ride",
            message: "Scheduled ride cannot be more than 30 days ahead"
          });
          return handlers.response.failed({
            res,
            message: "Scheduled ride cannot be more than 30 days ahead"
          });
        }
      }

      const admin = await this.user.findOne({ role: "admin" });

      const pickupCoords = pickup_location.location.coordinates;
      const dropoffCoords = dropoff_location.location.coordinates;

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

      const data = {
        vehicle_categories: categories,
        rate_per_stop: admin.rate_per_stop,
        distance_miles: Number(totalMiles),
        pickup_location,
        dropoff_location,
        stops,
        no_of_passengers,
        ride_type
      };

      handlers.logger.success({
        object_type: "select-destinations",
        message: "Locations selected successfully.",
        data: data
      });
      return handlers.response.success({
        res,
        message: "Stop(s) managed successfully.",
        data: data
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
  }

  async manageStops(req, res) {
    try {
      const {
        pickup_location,
        dropoff_location,
        stops = [],
        ride_type,
        scheduled_at
      } = req.body;

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
        stripe_card_id,
        ride_type,
        scheduled_at,
        no_of_passengers
      } = req.body;

      console.log("Body Parameters:", {
        vehicle_category,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops,
        stripe_card_id,
        ride_type,
        scheduled_at,
        no_of_passengers
      });

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
      const card = await this.card.findOne({ stripe_card_id });
      if (!card) {
        handlers.logger.unavailable({
          object_type: "ride-details-and-fares",
          message: "No cards found"
        });
        return handlers.response.unavailable({
          res,
          message: "No cards found"
        });
      }
      const stripeCardDetails =
        await stripe.paymentMethods.retrieve(stripe_card_id);
      const cardObject = card.toObject();
      cardObject.card_details = stripeCardDetails;

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
        stops,
        ride_type,
        scheduled_at,
        no_of_passengers,
        ride_type
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
        stops: newRide.stops,
        card: formatStripeList([cardObject.card_details])[0],
        no_of_passengers,
        ride_type
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
        stripe_card_id,
        ride_type,
        scheduled_at,
        no_of_passengers
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
        distance_miles,
        ride_type,
        scheduled_at,
        no_of_passengers
      });

      newRide.split_with_users.push({
        user_id: req.user._id,
        amount: Number(fare_details.amount) / no_of_passengers,
        status: "accepted",
        stripe_card_id: stripe_card_id
      });
      newRide.ride_status = "confirm-split-fare";
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
      const card = await this.card.findOne({ stripe_card_id });
      if (!card) {
        handlers.logger.unavailable({
          object_type: "confirm-ride",
          message: "No cards found"
        });
        handlers.logger.unavailable({
          res,
          message: "No cards found"
        });
      }

      const stripeCardDetails =
        await stripe.paymentMethods.retrieve(stripe_card_id);
      const cardObject = card.toObject();
      cardObject.card_details = stripeCardDetails;

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
        stops: newRide.stops,
        card: formatStripeList([cardObject.card_details])[0],
        ride_type,
        no_of_passengers
      };

      handlers.logger.success({
        object_type: "confirm-ride",
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
        object_type: "confirm-ride",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async cancelScheduledRide(req, res) {
    try {
      const { ride_id } = req.params;

      const ride = await this.ride.findOne({
        _id: ride_id,
        ride_type: "scheduled",
        ride_status: {
          $in: ["scheduled", "pending"]
        }
      });

      if (!ride) {
        handlers.logger.unavailable({
          object_type: "cancel-ride",
          message: "No scheduled rides found"
        });
        return handlers.response.unavailable({
          res,
          message: "No scheduled rides found"
        });
      }

      await this.ride.deleteOne({ _id: ride_id });

      handlers.logger.success({
        object_type: "cancel-ride",
        message: "Ride cancelled successfully"
      });
      return handlers.response.success({
        res,
        message: "Ride cancelled successfully"
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "cancel-ride",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }

  async cancelSplitFareRide(req, res) {
    try {
      const { ride_id } = req.params;

      const ride = await this.ride.findOne({
        _id: ride_id,
        ride_type: "split-fare",
        ride_status: {
          $in: ["booked", "pending", "waiting"]
        }
      });

      if (!ride) {
        handlers.logger.unavailable({
          object_type: "cancel-ride",
          message: "No split fare rides found"
        });
        return handlers.response.unavailable({
          res,
          message: "No split fare rides found"
        });
      }

      await this.ride.deleteOne({ _id: ride_id });

      handlers.logger.success({
        object_type: "cancel-ride",
        message: "Ride cancelled successfully"
      });
      return handlers.response.success({
        res,
        message: "Ride cancelled successfully"
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "cancel-ride",
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
      const rideId = req.params._id;
      const body = req.body;
      if (!rideId) {
        handlers.logger.failed({
          object_type: "pay-now",
          message: "Ride ID is required"
        });
        return handlers.response.failed({
          res,
          message: "Ride ID is required"
        });
      }

      const ride = await this.ride
        .findById(rideId)
        .populate(rideSchema.populate);
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

      if (ride.ride_status === "booked") {
        return handlers.response.failed({
          res,
          message: "You already have booked this ride"
        });
      }

      // Stripe Payment Process Start
      const stripeCustomerId = ride.user_id.stripe_customer_id;
      const stripeDefaultCard = body.stripe_card_id;

      const amountInCents = Math.round(Number(ride.fare_details.amount) * 100);

      // ✅ Now create the PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        customer: stripeCustomerId,
        payment_method: stripeDefaultCard,
        confirm: true,
        capture_method: "manual",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never"
        },
        metadata: {
          ride_id: ride._id.toString(),
          user_id: ride.user_id._id.toString()
        }
      });
      // Stripe Payment Process End

      // Store the PaymentIntent ID in the ride record
      ride.ride_status = "booked";
      ride.fare_details.payment_status = "authorized";
      ride.fare_details.stripe_payment_intent_id = paymentIntent.id;
      await ride.save();
      await ride.populate(rideSchema.populate);

      handlers.logger.success({
        object_type: "pay-now",
        message: "Payment authorized and ride booked successfully",
        data: ride
      });
      return handlers.response.success({
        res,
        message: "Payment authorized and ride booked successfully",
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

      // 👉 Capture the authorized payment
      const paymentIntentId = ride.fare_details.stripe_payment_intent_id;

      if (
        paymentIntentId &&
        ride.fare_details.payment_status === "authorized"
      ) {
        const capturedPayment =
          await stripe.paymentIntents.capture(paymentIntentId);

        // 👉 Transfer amount to driver (80% example)
        const driverStripeAccountId = ride.driver_id.stripe_account_id;
        const amountToTransfer = Math.round(
          ride.fare_details.amount * 0.8 * 100
        ); // cents

        const transfer = await stripe.transfers.create({
          amount: amountToTransfer,
          currency: "usd",
          destination: driverStripeAccountId,
          transfer_group: `ride_${ride._id}`
        });

        // 👉 Update ride fare details
        ride.fare_details.payment_status = "paid";
        ride.fare_details.stripe_transfer_id = transfer.id;
        await ride.save();
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
      socket.emit(
        "error",
        errorEvent({ error: "Failed to end ride: " + error })
      );
    }
  }

  async cancelARide(socket, data) {
    try {
      const { user_id, ride_id, cancellation } = data;

      const ride = await this.ride.findOne({
        _id: ride_id,
        $or: [{ user_id }, { driver_id: user_id }],
        ride_status: { $in: ["booked", "accepted", "confirm-split-fare"] }
      });

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

      ride.ride_status = "cancelled";
      ride.cancellation = {
        user_id,
        reason: cancellation?.reason || null,
        description: cancellation?.description || null
      };

      await ride.save();

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

      // Emit to both
      // socket.emit("response", message); // canceller
      // const receiverId = isPassenger ? driver_id : passenger_id;
      // if (receiverId) {
      await this.io.to(passenger_id.toString()).emit("response", message); // other party
      await this.io.to(driver_id.toString()).emit("response", message); // other party
      // }
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
