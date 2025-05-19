const mongoose = require("mongoose");

const schema = new mongoose.Schema(
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
      address: { type: String, default: null },
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point"
        },
        coordinates: { type: [Number], index: "2dsphere", default: [0, 0] }
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
      enum: ["any", "student", "regular"],
      default: "any"
    },
    gender_preference: {
      type: String,
      enum: ["any", "male", "female"],
      default: "any"
    },
    ssn_number: {
      type: String,
      default: ""
    },
    stripe_customer_id: {
      type: String,
      default: null
    },
    stripe_merchant_id: {
      type: String,
      default: null
    },
    stripe_account_id: {
      type: String,
      default: null
    },
    stripe_default_card_id: {
      type: String,
      default: null
    },
    available_balance: {
      type: Number,
      default: 0
    },
    total_expense: {
      type: Number,
      default: 0
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
      default: true
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    is_referred_driver: {
      type: Boolean,
      default: false
    },
    notification_count: {
      type: Number,
      default: 0
    },
    rate_per_stop: {
      type: Number,
      default: 3.5
    },

    total_favourite_drivers: {
      type: Number,
      default: 0
    },

    referral_code: {
      type: String
    },

    referral_points: {
      type: Number,
      default: 0
    },

    has_discount_on_next_ride: {
      type: Boolean,
      default: false
    },

    total_referrals: {
      type: Number,
      default: 0
    },

    total_completed_rewards: {
      type: Number,
      default: 0
    }
  },
  {
    collection: "users",
    timestamps: true,
    autoIndex: true
  }
);

const User = mongoose.model("User", schema);
module.exports = User;
