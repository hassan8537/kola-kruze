const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const notificationSchema = {
  populate: [
    {
      path: "user_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    }
  ],
  options: {
    sort: { createdAt: -1 }
  }
};

module.exports = notificationSchema;
