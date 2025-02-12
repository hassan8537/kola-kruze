const { sendNotification } = require("../../config/firebase");
const User = require("../../models/User");

exports.sendNotificationToUser = async ({
  user_id,
  type,
  model_type,
  model_id,
  message
}) => {
  try {
    const user = await User.findById(user_id).lean();
    if (!user) return;

    await notificationManagement({ user, type, model_type, model_id, message });
  } catch (error) {
    return errorLog({ error });
  }
};

exports.notificationManagement = async ({
  user,
  type,
  model_type,
  model_id,
  message
}) => {
  try {
    const notificationBody = {
      user_id: user._id.toString(),
      message: message || "New notification",
      type: type || "general",
      model_id: model_id?.toString() || null,
      model_type: model_type || "general"
    };

    const fcmPayload = JSON.stringify({
      message: {
        token: user.device_token,
        notification: {
          title: message || "Notification",
          body: `You have a new ${type || "update"}`
        },
        data: {
          notificationType: type || "general",
          title: "Scheduled Ride",
          body: JSON.stringify(notificationBody)
        }
      }
    });

    await User.findByIdAndUpdate(
      user._id,
      { $inc: { notification_count: 1 } },
      { new: true }
    );

    await sendNotification(fcmPayload);
    await notificationService.createNotification({ body: notificationBody });
  } catch (error) {
    return errorLog({ error });
  }
};
