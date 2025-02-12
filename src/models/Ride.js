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

    distance_miles: { type: Number, default: 0 },

    ride_status: {
      type: String,
      enum: [
        "pending",
        "cancelled",
        "accepted",
        "scheduled",
        "arrived",
        "reserved",
        "ongoing",
        "completed",
        "delayed",
        "reassigned",
        "booked"
      ],
      default: "pending"
    },

    arrival_time: { type: Date, required: false },
    scheduled_time: { type: Date, default: null },
    reserved_at: { type: Date, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },

    fare_details: {
      amount: { type: Number, required: true },
      payment_status: {
        type: String,
        enum: ["hold", "pending", "paid"],
        default: "pending"
      },
      stripe_payment_intent: { type: String, default: null }, // Holds funds in admin’s account
      stripe_transfer_id: { type: String, default: null } // Transfers payment to driver
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
      eta_to_pickup: { type: String, default: null },
      eta_to_dropoff: { type: String, default: null }
    },

    // Multi-rider (Ride Sharing)
    share_with: [
      {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        split_amount: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

// Indexes for faster queries
RideSchema.index({ user_id: 1, driver_id: 1, ride_status: 1 });
RideSchema.index({ "pickup_location.location": "2dsphere" });
RideSchema.index({ "dropoff_location.location": "2dsphere" });

const Ride = mongoose.model("Ride", RideSchema);
module.exports = Ride;
