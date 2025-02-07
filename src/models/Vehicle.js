const mongoose = require("mongoose");

const VehicleSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false
    },
    license_plate_number: {
      type: String,
      default: ""
    },
    vehicle_vin: {
      type: String,
      default: ""
    },
    vehicle_state: {
      type: String,
      default: ""
    },
    vehicle_category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true
    },
    vehicle_make: {
      type: String,
      default: ""
    },
    vehicle_model: {
      type: String,
      default: ""
    },
    vehicle_year: {
      type: Number,
      default: 2000
    },
    vehicle_variant: {
      type: String,
      default: ""
    },
    passenger_limit: {
      type: Number,
      default: 4
    },
    vehicle_registration_number: {
      type: String,
      default: ""
    },
    vehicle_color: {
      type: String,
      default: ""
    },
    vehicle_doors: {
      type: Number,
      default: 4
    },
    vehicle_seatbelts: {
      type: Number,
      default: 4
    },
    insurance_document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null
    },
    inspection_document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null
    },
    vehicle_images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "File",
        default: []
      }
    ],
    is_verified: {
      type: Boolean,
      default: false,
      required: true
    }
  },
  {
    collection: "vehicles",
    timestamps: true
  }
);

const Vehicle = mongoose.model("Vehicle", VehicleSchema);
module.exports = Vehicle;
