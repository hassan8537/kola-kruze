const Notification = require("../../models/Notification");
const Ride = require("../../models/Ride");
const RideInvite = require("../../models/RideInvite");
const User = require("../../models/User");
const { handlers } = require("../../utilities/handlers/handlers");

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
        status: "pending"
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "invite-user",
          res,
          message: "Invalid ride"
        });
        handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      const checkIfTheUserIsAlreadyInvited = await this.rideInvite.findOne({
        ride_id,
        invited_user_id,
        status: { $ne: ["accepted", "rejected", "expired"] }
      });

      if (checkIfTheUserIsAlreadyInvited) {
        handlers.logger.failed({
          object_type: "invite-user",
          res,
          message: "Invitation is already pending"
        });
        handlers.response.failed({
          res,
          message: "Invitation is already pending"
        });
      }

      if (existingRide.total_invites < 3 && existingRide.total_shares < 3) {
        const newInvite = new RideInvite({
          ride_id: ride_id,
          invited_by: current_user._id,
          invited_user_id: invited_user_id
        });

        await newInvite.save();

        // Send notification
        await this.notification.create({
          user_id: invited_user_id,
          message: `You’ve been invited to join a ride by ${current_user.first_name} ${current_user.last_name}. 
                    Tap to view the ride details.`,
          type: "share-ride",
          model_id: newInvite._id,
          model_type: "RideInvite"
        });

        handlers.logger.success({
          object_type: "invite-user",
          res,
          message: "Invitation sent successfully"
        });
        handlers.response.success({
          res,
          message: "Invitation sent successfully"
        });
      }
    } catch (error) {
      handlers.logger.error({
        object_type: "invite-user",
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
        status: "pending"
      });

      if (!existingPendingInvitation) {
        handlers.logger.failed({
          object_type: "accept-invitation",
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
        status: "pending"
      });

      if (!existingRide) {
        handlers.logger.failed({
          object_type: "accept-invitation",
          res,
          message: "Invalid ride"
        });
        handlers.response.failed({
          res,
          message: "Invalid ride"
        });
      }

      existingPendingInvitation.status = "accepted";
      existingPendingInvitation.accepted_at = Date.now();
      await existingPendingInvitation.save();

      // Send notification
      await this.notification.create({
        user_id: invited_user_id,
        message: `You’ve been invited to join a ride by ${current_user.first_name} ${current_user.last_name}. 
                    Tap to view the ride details.`,
        type: "share-ride",
        model_id: newInvite._id,
        model_type: "RideInvite"
      });

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
        status: "pending"
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
        status: "pending"
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

      existingPendingInvitation.status = "rejected";
      existingPendingInvitation.accepted_at = Date.now();
      await existingPendingInvitation.save();

      handlers.logger.success({
        object_type: "accept-invitation",
        res,
        message: "Invitation rejected"
      });
      handlers.response.success({
        res,
        message: "Invitation rejected"
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
}

module.exports = new Service();
