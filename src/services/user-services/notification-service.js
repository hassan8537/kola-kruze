// const { sendNotification } = require("../../config/firebase");
const Notification = require("../../models/Notification");
const User = require("../../models/User");
const { populateNotification } = require("../../populate/populate-models");
const {
  successLog,
  failedLog
} = require("../../utilities/handlers/log-handler");
const {
  successResponse,
  errorResponse
} = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.notification = Notification;
    this.user = User;
  }

  // Utilities

  async createNotification({ body }) {
    const {
      device_token,
      user_id,
      message,
      type,
      model_id,
      model_type,
      meta_data
    } = body;
    try {
      const notification = new this.notification({
        user_id: user_id,
        message: message,
        type: type,
        model_id: model_id,
        model_type: model_type
      }).populate(populateNotification.populate);

      console.log({ notification });

      await notification.save();

      // await sendNotification({
      //   device_token: device_token,
      //   title: message,
      //   payload: notification,
      //   meta_data
      // });

      return successLog({
        message: "Notification created successfully.",
        data: notification
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async updateNotificationStatus({ _id }) {
    try {
      const notification = await this.notification
        .findByIdAndUpdate(_id, { status: "read" }, { new: true })
        .populate(populateNotification.populate);

      if (!notification) {
        return failedLog({
          message: "Notification not found."
        });
      }

      return successLog({
        message: "Notification status updated successfully.",
        data: notification
      });
    } catch (error) {
      return errorResponse({ response, error });
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
        populate: populateNotification.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteNotification(request, response) {
    const { _id } = request.params;

    try {
      const notification = await this.notification
        .findByIdAndDelete(_id)
        .populate(populateNotification.populate);

      if (!notification) {
        return errorResponse({
          response,
          message: "Notification not found."
        });
      }

      return successResponse({
        response,
        message: "Notification deleted successfully."
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
