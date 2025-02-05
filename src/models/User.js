const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    legal_name: {
      type: String,
      default: ""
    },
    first_name: {
      type: String,
      default: ""
    },
    last_name: {
      type: String,
      default: ""
    },
    profile_picture: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      default: "male"
    },
    email_address: {
      type: String,
      required: false
    },
    phone_number: {
      type: String,
      default: ""
    },
    emergency_contact: {
      type: String,
      default: ""
    },
    current_location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      address: { type: String, default: "" },
      coordinates: {
        type: [Number],
        index: "2dsphere",
        required: true
      }
    },
    state: {
      type: String,
      default: ""
    },
    password: {
      type: String,
      default: ""
    },
    auth_provider: {
      type: String,
      enum: ["email", "phone", "google", "apple"],
      default: "email"
    },
    social_token: {
      type: String,
      default: ""
    },
    device_token: {
      type: String,
      default: ""
    },
    role: {
      type: String,
      enum: ["passenger", "driver", "admin"],
      default: "passenger"
    },
    is_student: {
      type: Boolean,
      default: false
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    is_notification_enabled: {
      type: Boolean,
      default: false
    },
    is_profile_completed: {
      type: Boolean,
      default: false
    },
    is_merchant_setup: {
      type: Boolean,
      default: false
    },
    is_vehicle_setup: {
      type: Boolean,
      default: false
    },
    driver_preference: {
      type: String,
      enum: ["any", "student-only"],
      default: "any"
    },
    gender_preference: {
      type: String,
      enum: ["any", "female-only"],
      default: "any"
    },
    ssn_number: {
      type: String,
      default: ""
    },
    stripe_customer_id: {
      type: Boolean,
      default: false
    },
    stripe_merchant_id: {
      type: Boolean,
      default: false
    },
    stripe_default_card: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
      default: null
    },
    session_token: {
      type: String,
      default: ""
    },
    driver_license: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
      default: null
    },
    is_available: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    collection: "users",
    timestamps: true,
    autoIndex: true
  }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
