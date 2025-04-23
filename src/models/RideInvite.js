const { Schema, model } = require("mongoose");

const RideInviteSchema = new Schema(
  {
    ride_id: {
      type: Schema.Types.ObjectId,
      ref: "Ride",
      required: true
    },
    invited_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    invited_user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending"
    },
    accepted_at: { type: Date, default: null },
    rejected_at: { type: Date, default: null }
  },
  { timestamps: true }
);

RideInviteSchema.index({ ride_id: 1, invited_user_id: 1 });
RideInviteSchema.index({ status: 1 });

const RideInvite = model("RideInvite", RideInviteSchema);
module.exports = RideInvite;
