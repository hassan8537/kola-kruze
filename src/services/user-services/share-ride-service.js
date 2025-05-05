const Notification = require("../../models/Notification");
const Ride = require("../../models/Ride");
const RideInvite = require("../../models/RideInvite");
const User = require("../../models/User");
const categorySchema = require("../../schemas/category-schema");
const rideSchema = require("../../schemas/ride-schema");
const userSchema = require("../../schemas/user-schema");
const {
  calculateDistance
} = require("../../utilities/calculators/distance-calculator");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.user = User;
    this.ride = Ride;
    this.rideInvite = RideInvite;
    this.notification = Notification;
  }

  async inviteUser(req, res) {
    try {
      const { user: current_user, body } = req;
      const { ride_id, invited_user_id } = body;

      const existingRide = await this.ride.findOne({
        _id: ride_id,
        ride_status: {
          $in: ["booked", "pending", "waiting", "confirm-split-fare"]
        }
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "invite-user",
          res,
          message: "Invalid ride"
        });
        return handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      const checkIfTheUserIsAlreadyInvited = await this.rideInvite.findOne({
        ride_id,
        invited_user_id,
        status: { $nin: ["accepted", "rejected", "expired"] }
      });

      if (checkIfTheUserIsAlreadyInvited) {
        handlers.logger.failed({
          object_type: "invite-user",
          res,
          message: "Invitation is already pending"
        });
        return handlers.response.failed({
          res,
          message: "Invitation is already pending"
        });
      }

      const currentTotal = await this.rideInvite.countDocuments({
        ride_id: existingRide._id,
        invited_by: current_user._id,
        status: "pending"
      });

      if (currentTotal >= existingRide.no_of_passengers - 1) {
        handlers.logger.failed({
          object_type: "invite-user",
          res,
          message: "Cannot invite more users. Ride is full."
        });
        return handlers.response.failed({
          res,
          message: "Cannot invite more users. Ride is full."
        });
      }

      const newInvite = new this.rideInvite({
        ride_id,
        invited_by: current_user._id,
        invited_user_id
      });
      await newInvite.save();

      existingRide.total_invites++;
      await existingRide.save();
      await existingRide.populate(rideSchema.populate);

      await this.notification.create({
        user_id: invited_user_id,
        message: `You’ve been invited to join a ride by ${current_user.first_name} ${current_user.last_name}. Tap to view the ride details.`,
        type: "split-fare",
        model_id: newInvite._id,
        model_type: "RideInvite"
      });

      const invitedPassengers = await this.rideInvite.find({
        invited_by: req.user._id
      });

      const data = {
        invited_passengers: invitedPassengers,
        ...existingRide.toObject()
      };

      handlers.logger.success({
        object_type: "invite-user",
        res,
        message: "Invitation sent successfully",
        data: data
      });
      handlers.response.success({
        res,
        message: "Invitation sent successfully",
        data: data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "invite-user",
        res,
        message: error
      });
      handlers.response.error({ res, message: error.message });
    }
  }

  async withdrawInvite(req, res) {
    try {
      const { user: current_user, body } = req;
      const { ride_id, invited_user_id } = body;

      const existingRide = await this.ride.findOne({
        _id: ride_id,
        ride_status: {
          $in: ["booked", "pending", "waiting", "confirm-split-fare"]
        }
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "withdraw-invite",
          res,
          message: "Invalid ride"
        });
        return handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      const invite = await this.rideInvite.findOne({
        ride_id,
        invited_user_id,
        invited_by: current_user._id,
        status: { $nin: ["accepted", "rejected", "expired"] }
      });

      if (!invite) {
        handlers.logger.failed({
          object_type: "withdraw-invite",
          res,
          message: "No active invitation found to withdraw"
        });
        return handlers.response.failed({
          res,
          message: "No active invitation found to withdraw"
        });
      }

      await this.rideInvite.deleteOne({ _id: invite._id });

      if (existingRide.total_invites > 0) {
        existingRide.total_invites--;
        await existingRide.save();
        await existingRide.populate(rideSchema.populate);
      }

      await this.notification.deleteOne({
        user_id: invited_user_id,
        model_id: invite._id,
        model_type: "RideInvite"
      });

      const invitedPassengers = await this.rideInvite.find({
        invited_by: req.user._id
      });

      const data = {
        invited_passengers: invitedPassengers,
        ...existingRide.toObject()
      };

      handlers.logger.success({
        object_type: "withdraw-invite",
        res,
        message: "Invitation withdrawn successfully",
        data: data
      });
      handlers.response.success({
        res,
        message: "Invitation withdrawn successfully",
        data: data
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "withdraw-invite",
        res,
        message: error
      });
      handlers.response.error({ res, message: error.message });
    }
  }

  async acceptInvite(req, res) {
    try {
      const { user: current_user, body } = req;
      const { ride_invite_id } = body;

      const existingPendingInvitation = await this.rideInvite.findOne({
        _id: ride_invite_id,
        status: {
          $in: ["pending"]
        }
      });

      if (!existingPendingInvitation) {
        handlers.logger.failed({
          object_type: "accept-invitation",
          res,
          message: "Invalid invitation"
        });
        return handlers.response.failed({
          res,
          message: "Invalid invitation"
        });
      }

      // 🚫 Check if user already has an ongoing ride
      const existingOngoingRide = await this.ride.findOne({
        $or: [
          { user_id: current_user._id }, // if they are the ride creator
          { "split_with_users.user_id": current_user._id } // if they are a shared passenger
        ],
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
      });

      if (existingOngoingRide) {
        handlers.logger.failed({
          object_type: "accept-invitation",
          res,
          message: "You already have an ongoing ride"
        });
        return handlers.response.failed({
          res,
          message: "You already have an ongoing ride"
        });
      }

      const existingRide = await this.ride.findOne({
        _id: existingPendingInvitation.ride_id,
        ride_status: "confirm-split-fare"
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "accept-invitation",
          res,
          message: "Invalid ride"
        });
        return handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      if (!current_user.stripe_default_card_id) {
        handlers.logger.failed({
          object_type: "accept-invitation",
          res,
          message: "Please add a card before accepting invitation"
        });
        return handlers.response.failed({
          res,
          message: "Please add a card before accepting invitation"
        });
      }

      existingPendingInvitation.status = "accepted";
      existingPendingInvitation.accepted_at = Date.now();
      await existingPendingInvitation.save();

      existingRide.total_accepted++;
      existingRide.total_shares++;

      existingRide.split_with_users.push({
        user_id: current_user._id,
        amount:
          existingRide.fare_details.amount / existingRide.no_of_passengers,
        status: "accepted",
        stripe_card_id: current_user.stripe_default_card_id
      });

      await existingRide.save();

      await this.notification.create({
        user_id: existingRide.user_id,
        message: `${current_user.first_name} ${current_user.last_name} has accepted your ride invitation. Tap to view the updated ride details.`,
        type: "invitation",
        model_id: existingPendingInvitation._id,
        model_type: "RideInvite"
      });

      await this.notification.findOneAndUpdate(
        { model_id: ride_invite_id },
        { model_action: "accepted" },
        { new: true }
      );

      handlers.logger.success({
        object_type: "accept-invitation",
        res,
        message: "Invitation accepted"
      });
      handlers.response.success({
        res,
        message: "Invitation accepted"
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "accept-invitation",
        res,
        message: error
      });
      handlers.response.error({ res, message: error.message });
    }
  }

  async rejectInvite(req, res) {
    try {
      const { user: current_user, body } = req;

      const { ride_invite_id } = body;

      const existingPendingInvitation = await this.rideInvite.findOne({
        _id: ride_invite_id,
        status: {
          $in: ["pending"]
        }
      });

      if (!existingPendingInvitation) {
        handlers.logger.failed({
          object_type: "reject-invitation",
          res,
          message: "Invalid invitation"
        });
        handlers.response.failed({
          res,
          message: "Invalid invitation"
        });
      }

      const existingRide = await this.ride.findOne({
        _id: existingPendingInvitation.ride_id,
        ride_status: "confirm-split-fare"
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "reject-invitation",
          res,
          message: "Invalid ride"
        });
        handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      existingRide.total_rejected++;
      existingPendingInvitation.status = "rejected";
      existingPendingInvitation.accepted_at = Date.now();
      await existingRide.save();
      await existingPendingInvitation.save();

      // Send notification
      await this.notification.create({
        user_id: existingRide.user_id,
        message: `${current_user.first_name} ${current_user.last_name} has rejected your ride invitation. 
            Tap to view the updated ride details.`,
        type: "invitation",
        model_id: existingPendingInvitation._id,
        model_type: "RideInvite"
      });

      await this.notification.findOneAndUpdate(
        { model_id: ride_invite_id },
        { model_action: "rejected" },
        { new: true }
      );

      handlers.logger.success({
        object_type: "reject-invitation",
        res,
        message: "Invitation rejected"
      });
      handlers.response.success({
        res,
        message: "Invitation rejected"
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "reject-invitation",
        res,
        message: error
      });
      handlers.response.error({ res, message: error.message });
    }
  }

  async getPassengers(req, res) {
    try {
      const filters = {
        role: "passenger",
        _id: { $ne: req.user._id }
      };

      const { page, limit, sort, search } = req.query;

      if (search) {
        const regex = new RegExp(search, "i");
        filters.$or = [
          { legal_name: { $regex: regex } },
          { first_name: { $regex: regex } },
          { last_name: { $regex: regex } }
        ];
      }

      await pagination({
        response: res,
        table: "Passenger", // Keep as needed
        model: this.user,
        filters,
        page,
        limit,
        sort,
        populate: userSchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "get-passengers",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
