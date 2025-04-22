const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const ratingSchema = {
  populate: [
    {
      path: "ride_id",
      populate: [
        {
          path: "user_id",
          select: userSchema.fieldsToSelect,
          populate: {
            path: "profile_picture driver_license",
            select: fileSchema.fieldsToSelect
          }
        },
        {
          path: "driver_id",
          select: userSchema.fieldsToSelect,
          populate: {
            path: "profile_picture driver_license",
            select: fileSchema.fieldsToSelect
          }
        },
        {
          path: "vehicle_id"
        },
        {
          path: "shared_with.user_id",
          select: userSchema.fieldsToSelect,
          populate: {
            path: "profile_picture driver_license",
            select: fileSchema.fieldsToSelect
          }
        }
      ]
    },
    {
      path: "reviewer_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    },
    {
      path: "recipient_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    }
  ]
};

module.exports = ratingSchema;
