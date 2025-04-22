const fileSchema = require("./file-schema");
const rideSchema = require("./ride-schema");
const userSchema = require("./user-schema");

const reportSchema = {
  populate: [
    {
      path: "ride_id",
      select: rideSchema.fieldsToSelect,
      populate: [
        {
          path: "user_id",
          select: userSchema.fieldsToSelect
        },
        {
          path: "driver_id",
          populate: {
            path: "profile_picture driver_license",
            select: fileSchema.fieldsToSelect
          }
        }
      ]
    },
    {
      path: "user_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    },
    {
      path: "image",
      select: fileSchema.fieldsToSelect
    }
  ]
};

module.exports = reportSchema;
