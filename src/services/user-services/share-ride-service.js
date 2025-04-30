const Notification = require("../../models/Notification");
const Ride = require("../../models/Ride");
const RideInvite = require("../../models/RideInvite");
const User = require("../../models/User");
const categorySchema = require("../../schemas/category-schema");
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

        existingRide.total_invites++;
        await existingRide.save();

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

      existingRide.total_accepted++;
      existingRide.total_shares++;
      await existingRide.save();

      // Send notification
      await this.notification.create({
        user_id: existingRide.user_id,
        message: `${current_user.first_name} ${current_user.last_name} has accepted your ride invitation. 
            Tap to view the updated ride details.`,
        type: "share-ride",
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

      // Send notification
      await this.notification.create({
        user_id: existingRide.user_id,
        message: `${current_user.first_name} ${current_user.last_name} has rejected your ride invitation. 
            Tap to view the updated ride details.`,
        type: "share-ride",
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

  async selectDestination(req, res) {
    try {
      const user_id = req.user._id;

      const existingRide = await this.ride
        .findOne(
          {
            user_id,
            ride_type: "split-fare",
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
          },
          "_id"
        )
        .lean();

      if (existingRide) {
        handlers.logger.failed({
          object_type: "select-destinations",
          message: "A ride is already in progress"
        });
        return handlers.response.failed({
          res,
          message: "A ride is already in progress"
        });
      }

      try {
        const { pickup_location, dropoff_location, no_of_passengers } =
          req.body;

        // const admin = await this.user.findOne({ role: "admin" });

        const pickupCoords = pickup_location.location.coordinates;
        const dropoffCoords = dropoff_location.location.coordinates;

        // Calculate distance directly from pickup to dropoff
        const distance_miles = calculateDistance(
          pickupCoords[1],
          pickupCoords[0],
          dropoffCoords[1],
          dropoffCoords[0]
        );

        const categories = await this.category
          .find()
          .populate(categorySchema.populate)
          .lean();

        if (!categories.length) {
          handlers.logger.failed({
            object_type: "select-destinations",
            message: "No categories found"
          });
          return handlers.response.failed({
            res,
            message: "No categories found"
          });
        }

        const finalData = {
          vehicle_categories: categories,
          distance_miles: Number(distance_miles),
          pickup_location,
          dropoff_location,
          no_of_passengers
        };

        handlers.logger.success({
          object_type: "select-destinations",
          message: "Destination managed successfully.",
          data: finalData
        });
        return handlers.response.success({
          res,
          message: "Destination managed successfully.",
          data: finalData
        });
      } catch (error) {
        handlers.logger.error({
          object_type: "select-destinations",
          message: error
        });
        return handlers.response.error({
          res,
          message: error.message
        });
      }
    } catch (error) {
      handlers.logger.error({
        object_type: "select-destinations",
        message: error
      });
      return handlers.response.error({
        res,
        message: error.message
      });
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
