const notificationSchema = {
  populate: [
    {
      path: "user_id",
      select: "name email phone profile_image role"
    },
    {
      path: "model_id",
      refPath: "model_type",
      select: "-__v -createdAt -updatedAt"
    }
  ],
  options: {
    sort: { createdAt: -1 }
  }
};

module.exports = notificationSchema;
