// const { sendNotification } = require("../../config/firebase");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

const { handlers } = require("../../utilities/handlers/handlers");
const notificationSchema = require("../../schemas/notification-schema");
const { default: mongoose } = require("mongoose");

class Service {
  constructor() {
    this.notification = Notification;
    this.user = User;
  }

  // Utilities

  async createNotification({ body }) {
    const { user_id, message, type, model_id, model_type } = body;
    try {
      const notification = await this.notification.create({
        user_id,
        message,
        type,
        model_id,
        model_type
      });

      return handlers.logger.success({
        message: "Notification created successfully.",
        data: notification
      });
    } catch (error) {
      return handlers.logger.error({ error });
    }
  }

  async createNotification(req, res) {
    const { message, type, model_id, model_type } = req.body;

    try {
      const notification = await this.notification.create({
        user_id: req.user._id,
        message,
        type,
        model_id,
        model_type
      });

      return handlers.logger.success({
        message: "Notification created successfully.",
        data: notification
      });
    } catch (error) {
      return handlers.logger.error({ error });
    }
  }

  async updateNotificationStatus({ _id }) {
    try {
      const notification = await this.notification
        .findByIdAndUpdate(_id, { status: "read" }, { new: true })
        .populate(notificationSchema.populate);

      if (!notification) {
        return handlers.logger.failed({
          message: "Notification not found."
        });
      }

      return handlers.logger.success({
        message: "Notification status updated successfully.",
        data: notification
      });
    } catch (error) {
      return handlers.logger.error({ error });
    }
  }

  // APIs

  async getNotifications(req, res) {
    try {
      const user_id = req.user_id;

      const filters = { ...user_id };

      const { page, limit, sort } = req.query;

      await pagination({
        response: res,
        table: "Notifications",
        model: this.notification,
        filters,
        page,
        limit,
        sort,
        populate: notificationSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getUnreadNotificationCount(req, res) {
    try {
      const user_id = req.user._id;

      console.log(req.user.email_address);

      if (!user_id) {
        return handlers.response.failed({
          res,
          message: "User ID is required to fetch unread notification count."
        });
      }

      const count = await this.notification.countDocuments({
        user_id,
        status: "unread"
      });

      return handlers.response.success({
        res,
        message: "Unread notification count fetched successfully.",
        data: { count }
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const user_id = req.user._id;

      if (!user_id) {
        return handlers.response.failed({
          res,
          message: "User ID is required to mark notifications as read."
        });
      }

      const result = await this.notification.updateMany(
        { user_id, status: "unread" },
        { $set: { status: "read" } }
      );

      return handlers.response.success({
        res,
        message: "All unread notifications marked as read."
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }

  async deleteNotification(request, response) {
    const { _id } = request.params;

    try {
      const notification = await this.notification
        .findByIdAndDelete(_id)
        .populate(notificationSchema.populate);

      if (!notification) {
        return handlers.response.failed({
          response,
          message: "Notification not found."
        });
      }

      return handlers.response.success({
        response,
        message: "Notification deleted successfully."
      });
    } catch (error) {
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
