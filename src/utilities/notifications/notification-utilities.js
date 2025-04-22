const { sendNotification } = require("../../config/firebase");
const User = require("../../models/User");
const { handlers } = require("../../helpers/handlers");
const notificationService = require("../services/notificationService");

exports.sendNotificationToUser = async ({
  user_id,
  type,
  model_type,
  model_id,
  message
}) => {
  try {
    const user = await User.findById(user_id).lean();
    if (user) {
      await exports.notificationManagement({
        user,
        type,
        model_type,
        model_id,
        message
      });
    }
  } catch (error) {
    handlers.logger.error({
      object_type: "Notification",
      message: error.message
    });
  }
};

exports.notificationManagement = async ({
  user,
  type = "general",
  model_type = "general",
  model_id,
  message = "New notification"
}) => {
  try {
    const notificationBody = {
      user_id: user._id.toString(),
      message,
      type,
      model_type,
      model_id: model_id?.toString() || null
    };

    const fcmPayload = JSON.stringify({
      message: {
        token: user.device_token,
        notification: {
          title: message,
          body: `You have a new ${type}`
        },
        data: {
          notificationType: type,
          title: "Scheduled Ride",
          body: JSON.stringify(notificationBody)
        }
      }
    });

    await Promise.all([
      User.findByIdAndUpdate(user._id, { $inc: { notification_count: 1 } }),
      sendNotification(fcmPayload),
      notificationService.createNotification({ body: notificationBody })
    ]);
  } catch (error) {
    handlers.logger.error({
      object_type: "Notification",
      message: error.message
    });
  }
};
