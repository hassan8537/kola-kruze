const stripeSecretKey = require("../../config/stripe");
const stripe = require("stripe")(stripeSecretKey);

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
const Card = require("../../models/Card");
const {
  formatStripeList
} = require("../../utilities/formatters/value-formatters");
const { successLog } = require("../../utilities/handlers/log-handler");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
    this.category = Category;
    this.vehicle = Vehicle;
    this.card = Card;
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

  async selectDestination(request, response) {
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

  async rideDetailsAndFares(request, response) {
    try {
      const {
        user_id,
        vehicle_category,
        fare_details,
        distance_miles,
        pickup_location,
        dropoff_location,
        stops,
        stripe_card_id
      } = request.body;

      const user = await this.user.findById(user_id);
      if (!user)
        return failedResponse({
          response,
          message: "No user found"
        });

      const categories = await this.category
        .find()
        .populate(populateCategory.populate);
      if (!categories.length)
        return failedResponse({
          response,
          message: "No categories found"
        });

      const card = await this.card.findOne({ stripe_card_id });
      if (!card)
        return failedResponse({
          response,
          message: "No card found"
        });

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
        stops
      });

      await newRide.populate(populateRide.populate);

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
        card: formatStripeList([cardObject.card_details])
      };

      return successResponse({
        response,
        message: "Ride confirmed successfully",
        data: data
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async confirmRide(request, response) {
    try {
      const {
        vehicle_category,
        pickup_location,
        dropoff_location,
        stops,
        fare_details,
        distance_miles,
        stripe_card_id
      } = request.body;

      // Check for existing ride
      const existingRide = await this.ride.findOne({
        user_id: request.user._id
      });

      if (existingRide) {
        const deletedRide = await this.ride.findByIdAndDelete(existingRide._id);
        if (deletedRide) {
          successLog({ message: "Previous ride deleted successfully" });
        }
      }

      const newRide = new this.ride({
        user_id: request.user._id,
        pickup_location,
        dropoff_location,
        stops,
        fare_details,
        distance_miles
      });

      await newRide.save();
      await newRide.populate(populateRide.populate);

      const categories = await this.category
        .find()
        .populate(populateCategory.populate);
      if (!categories.length)
        return failedResponse({
          response,
          message: "No categories found"
        });

      const card = await this.card.findOne({ stripe_card_id });
      if (!card)
        return failedResponse({
          response,
          message: "No card found"
        });

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
        card: formatStripeList([cardObject.card_details])
      };

      return successResponse({
        response,
        message: "Ride confirmed successfully",
        data: data
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  // async payNow(request, response) {
  //   try {
  //     if (!request.params._id)
  //       return failedResponse({ response, message: "Ride ID is required" });

  //     const ride = await this.ride
  //       .findById(request.params._id)
  //       .populate("user_id");

  //     if (!ride)
  //       return unavailableResponse({ response, message: "No ride found" });

  //     if (ride.ride_status === "booked")
  //       return failedResponse({
  //         response,
  //         message: "You already have booked this ride"
  //       });

  //     if (!ride.fare_details || !ride.fare_details.amount)
  //       return failedResponse({ response, message: "Invalid fare details" });

  //     if (!ride.user_id.stripe_customer_id)
  //       return failedResponse({
  //         response,
  //         message: "User has no Stripe account linked"
  //       });

  //     if (!ride.stripe_card_id)
  //       return failedResponse({
  //         response,
  //         message: "No payment method provided"
  //       });

  //     // Create a PaymentIntent to HOLD the payment (not capture)
  //     const charge = await stripe.charges.create({
  //       amount: sub_total * 100,
  //       currency: "usd",
  //       source: selected_card_detail.id,
  //       customer: selected_card_detail.customer // Add the customer field here
  //     });

  //     // Save the PaymentIntent ID in the ride details
  //     ride.fare_details.stripe_payment_intent = paymentIntent.id;
  //     ride.ride_status = "booked"; // Mark ride as booked
  //     await ride.save();

  //     return successResponse({
  //       response,
  //       message: "Payment authorized and ride booked",
  //       data: { ride, payment_intent: paymentIntent.id }
  //     });
  //   } catch (error) {
  //     return errorResponse({ response, error });
  //   }
  // }

  async payNow(request, response) {
    try {
      if (!request.params._id)
        return failedResponse({ response, message: "Ride ID is required" });

      const ride = await this.ride
        .findById(request.params._id)
        .populate("user_id");

      if (!ride)
        return unavailableResponse({ response, message: "No ride found" });

      if (ride.ride_status === "booked")
        return failedResponse({
          response,
          message: "You already have booked this ride"
        });

      ride.ride_status = "booked";
      await ride.save();
      await ride.populate(populateRide.populate);

      return successResponse({
        response,
        message: "Payment authorized and ride booked",
        data: ride
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
      const { ride_id } = data;

      const ride = await this.ride
        .findOne({ _id: ride_id, ride_status: "booked" })
        .populate(populateRide.populate);

      if (!ride) {
        socket.emit(
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
        availableDrivers.forEach(async (driver) => {
          const [pLat, pLon] = ride.pickup_location.location.coordinates;
          const [dLat, dLon] = driver.current_location.coordinates;
          const distance = calculateDistance(pLat, pLon, dLat, dLon);
          const eta = calculateETA(distance);

          const rideObject = ride.toObject();

          rideObject.tracking.eta_to_arrive = eta;

          this.io.to(driver._id.toString()).emit(
            "response",
            successEvent({
              object_type: "get-ride",
              message: "A user has requested a ride",
              data: rideObject
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
          availableDrivers.forEach((driver) => {
            this.io.to(driver._id.toString()).emit(
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
          { _id: ride_id, ride_status: "booked" },
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
      const object_type = "ride-arrived";

      const ride = await this.ride
        .findOneAndUpdate(
          { _id: ride_id, driver_id, ride_status: "accepted" },
          { $set: { ride_status: "arrived" } },
          { new: true }
        )
        .populate(populateRide.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "Ride not found or cannot be updated"
          })
        );
      }

      // ✅ Notify the driver (who triggered the event)
      socket.emit(
        "response",
        successEvent({
          object_type,
          message: "You have arrived at the pickup location",
          data: ride
        })
      );

      // ✅ Notify the passenger
      this.io.to(ride.user_id._id.toString()).emit(
        "response",
        successEvent({
          object_type,
          message: "Your driver has arrived at your pickup location",
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

      if (ride.fare_details.payment_status === "pending")
        return socket.emit(
          "response",
          failedEvent({
            object_type,
            message: "This ride is not booked yet."
          })
        );

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

      const ride = await this.ride
        .findOne({
          _id: ride_id,
          $or: [{ user_id }, { driver_id: user_id }],
          ride_status: { $in: ["accepted", "booked"] }
        })
        .populate(populateRide.populate);

      if (!ride) {
        return socket.emit(
          "response",
          failedEvent({
            object_type: "ride-cancelled",
            message: "No active ride found to cancel"
          })
        );
      }

      if (!ride.driver_id) {
        // Update ride status and cancellation details
        ride.ride_status = "cancelled";
        ride.cancellation = {
          user_id,
          reason: cancellation?.reason,
          description: cancellation?.description
        };
        await ride.save();

        // ✅ Notify the other user (driver or passenger)
        socket.emit(
          "response",
          successEvent({
            object_type: "ride-cancelled",
            message: `The ride has been cancelled by the passenger`,
            data: ride
          })
        );
      }

      const isPassenger = ride.user_id._id.toString() === user_id.toString();

      const receiver_id = isPassenger ? ride.driver_id._id : ride.user_id._id;

      // Update ride status and cancellation details
      ride.ride_status = "cancelled";
      ride.cancellation = {
        user_id,
        reason: cancellation?.reason,
        description: cancellation?.description
      };
      await ride.save();

      // // ✅ Notify the cancelling user
      // socket.emit(
      //   "response",
      //   successEvent({
      //     object_type: "ride-cancelled",
      //     message: "Ride cancelled successfully",
      //     data: ride
      //   })
      // );

      // ✅ Notify the other user (driver or passenger)
      socket.join(receiver_id.toString());
      this.io.to(receiver_id.toString()).emit(
        "response",
        successEvent({
          object_type: "ride-cancelled",
          message: `The ride has been cancelled by the ${isPassenger ? "passenger" : "driver"}`,
          data: ride
        })
      );
    } catch (error) {
      socket.emit(
        "error",
        errorEvent({
          error
        })
      );
    }
  }

  async updateCurrentLocation(socket, data) {
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
      const { ride_id, driver_current_location } = data;
      const object_type = "get-eta-to-pickup";

      const ride = await this.ride
        .findById(ride_id)
        .populate(populateRide.populate);
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

      // Update driver's location
      if (driver_current_location?.coordinates) {
        await this.user.findByIdAndUpdate(
          ride.driver_id._id,
          {
            $set: {
              "current_location.coordinates":
                driver_current_location.coordinates
            }
          },
          { new: true }
        );
      }

      // Extract locations
      const [pickup_longitude, pickup_latitude] =
        ride.pickup_location.location.coordinates;
      const [driver_longitude, driver_latitude] =
        driver_current_location.coordinates; // Use updated driver location

      // Calculate Distance & ETA
      const distance = calculateDistance(
        driver_latitude,
        driver_longitude,
        pickup_latitude,
        pickup_longitude
      );
      const eta = calculateETA(distance);

      // Update ETA in ride tracking
      const updatedRide = await this.ride
        .findByIdAndUpdate(
          ride_id,
          { $set: { "tracking.eta_to_pickup": eta } },
          { new: true }
        )
        .populate(populateRide.populate);

      // Notify User
      if (ride.user_id) {
        this.io.to(ride.user_id._id.toString()).emit(
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
        this.io.to(ride.driver_id._id.toString()).emit(
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
