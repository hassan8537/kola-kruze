const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    vehicle_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null
    },

    pickup_location: {
      address: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", required: true } // [longitude, latitude]
      }
    },

    stops: [
      {
        address: { type: String, required: true },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point"
          },
          coordinates: { type: [Number], index: "2dsphere", required: true }
        }
      }
    ],

    dropoff_location: {
      address: { type: String, required: true },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", required: true }
      }
    },
    ride_status: {
      type: String,
      enum: [
        "pending",
        "scheduled",
        "reserved",
        "ongoing",
        "completed",
        "canceled",
        "accepted"
      ],
      default: "pending"
    },

    scheduled_time: { type: Date, default: null },
    reserved_at: { type: Date, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },

    fare_details: {
      amount: { type: Number, required: true },
      payment_status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending"
      }
    },

    cancellation: {
      user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      reason: { type: String, default: null },
      description: { type: String, default: null }
    },

    tracking: {
      driver_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      eta_to_pickup: { type: Number, default: null },
      eta_to_dropoff: { type: Number, default: null },
      passenger_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      waiting_time: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

const Ride = mongoose.model("Ride", RideSchema);
module.exports = Ride;
