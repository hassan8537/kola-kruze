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
      address: { type: String, required: true, default: "" },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }
      }
    },

    stops: [
      {
        address: { type: String, required: true, default: "" },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point"
          },
          coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }
        }
      }
    ],

    dropoff_location: {
      address: { type: String, required: true, default: "" },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }
      }
    },

    distance_miles: { type: Number, default: 0 },

    ride_type: {
      type: String,
      enum: ["instant", "scheduled", "split-fare"],
      default: "instant"
    },

    ride_status: {
      type: String,
      enum: [
        "pending",
        "started",
        "ended",
        "cancelled",
        "accepted",
        "scheduled",
        "arrived",
        "reserved",
        "ongoing",
        "completed",
        "delayed",
        "booked",
        "confirm-split-fare",
        "requesting",
        "waiting"
      ],
      default: "pending"
    },

    arrival_time: { type: Date, default: null },
    scheduled_at: { type: Date, default: null },
    reserved_at: { type: Date, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },

    fare_details: {
      amount: { type: Number, default: 0 },
      payment_status: {
        type: String,
        enum: ["authorized", "pending", "paid"],
        default: "pending"
      },
      stripe_payment_intent_id: { type: String, default: null },
      admin_stripe_transfer_id: { type: String, default: null },
      driver_stripe_transfer_id: { type: String, default: null }
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
      driver_current_location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }
      },
      distance_miles_from_pickup: { type: Number, default: 0 },
      eta_to_pickup: { type: String, default: null },
      eta_to_dropoff: { type: String, default: null }
    },

    no_of_passengers: { type: Number, default: 0, max: 4 },

    split_with_users: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        amount: {
          type: Number,
          required: true
        },
        status: {
          type: String,
          enum: [
            "pending",
            "paid",
            "failed",
            "accepted",
            "rejected",
            "self",
            "authorized"
          ],
          default: "pending"
        },
        stripe_card_id: {
          type: String,
          default: null
        },
        paid_at: {
          type: Date,
          default: null
        }
      }
    ],

    ride_otp: { type: Number, default: null },
    is_verified: { type: Boolean, default: false },
    is_reported: { type: Boolean, default: false },
    report_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      default: null
    },

    total_invites: { type: Number, default: 0 },
    total_accepted: { type: Number, default: 0 },
    total_rejected: { type: Number, default: 0 },
    total_shares: { type: Number, default: 0 }
  },
  { timestamps: true }
);

RideSchema.index({ user_id: 1, driver_id: 1, ride_status: 1 });
RideSchema.index({ "pickup_location.location": "2dsphere" });
RideSchema.index({ "dropoff_location.location": "2dsphere" });

const Ride = mongoose.model("Ride", RideSchema);
module.exports = Ride;
