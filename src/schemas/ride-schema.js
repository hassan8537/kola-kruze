const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");
const vehicleSchema = require("./vehicle-schema");

const rideSchema = {
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
      path: "vehicle_id",
      select: vehicleSchema.fieldsToSelect,
      populate: {
        path: "insurance_document inspection_document vehicle_images",
        select: fileSchema.fieldsToSelect
      }
    },
    {
      path: "cancellation.user_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    },
    // {
    //   path: "shared_with.user_id",
    //   select: userSchema.fieldsToSelect,
    //   populate: {
    //     path: "profile_picture driver_license",
    //     select: fileSchema.fieldsToSelect
    //   }
    // },
    {
      path: "report_id",
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
          path: "image",
          select: fileSchema.fieldsToSelect
        }
      ]
    }
  ],
  fieldsToSelect:
    "pickup_location dropoff_location distance_miles ride_status arrival_time scheduled_time reserved_at start_time end_time fare_details.amount fare_details.payment_status is_verified is_reported"
};

module.exports = rideSchema;
