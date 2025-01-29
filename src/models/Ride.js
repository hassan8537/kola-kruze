const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema(
  {
    user_ids: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
    ],
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

    pickup_locations: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        address: { type: String, required: true },
        coordinates: { type: [Number], index: "2dsphere", required: true } // [longitude, latitude]
      }
    ],

    dropoff_locations: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        address: { type: String, required: true },
        coordinates: { type: [Number], index: "2dsphere", required: true }
      }
    ],

    ride_type: {
      type: String,
      enum: ["private", "shared"],
      default: "private"
    },

    ride_status: {
      type: String,
      enum: [
        "pending",
        "scheduled",
        "reserved",
        "ongoing",
        "completed",
        "canceled"
      ],
      default: "pending"
    },

    scheduled_time: { type: Date, default: null },
    reserved_at: { type: Date, default: null },
    start_time: { type: Date, default: null },
    end_time: { type: Date, default: null },

    fare_details: [
      {
        user_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        amount: { type: Number, required: true },
        payment_status: {
          type: String,
          enum: ["pending", "paid"],
          default: "pending"
        }
      }
    ],

    ride_preferences: {
      pet_friendly: { type: Boolean, default: false },
      wheelchair_accessible: { type: Boolean, default: false },
      air_conditioning: { type: Boolean, default: true }
    },

    cancellation: {
      canceled_by: {
        type: String,
        enum: ["passenger", "driver", "system"],
        default: null
      },
      cancellation_reason: { type: String, default: null }
    },

    tracking: {
      current_location: {
        coordinates: { type: [Number], index: "2dsphere", default: null }
      },
      eta: { type: Number, default: null }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ride", RideSchema);
