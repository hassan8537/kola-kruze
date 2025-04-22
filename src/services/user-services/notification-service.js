// const { sendNotification } = require("../../config/firebase");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

const { handlers } = require("../../utilities/handlers/handlers");
const notificationSchema = require("../../schemas/notification-schema");

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

  async getNotifications(request, response) {
    try {
      const query = request.query;

      const filters = {};

      if (query._id) filters._id = query._id;
      if (query.user_id) filters.user_id = query.user_id;
      if (query.type) filters.type = query.type;
      if (query.status) filters.status = query.status;
      if (query.model_id) filters.model_id = query.model_id;
      if (query.model_type) filters.model_type = query.model_type;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Notifications",
        model: this.notification,
        filters,
        page,
        limit,
        sort,
        populate: notificationSchema.populate
      });
    } catch (error) {
      return handlers.response.error({ response, error });
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
      return handlers.response.error({ response, error });
    }
  }
}

module.exports = new Service();
