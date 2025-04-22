const categorySchema = require("./category-schema");
const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const vehicleSchema = {
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
      path: "vehicle_images",
      select: fileSchema.fieldsToSelect
    },
    {
      path: "insurance_document",
      select: fileSchema.fieldsToSelect
    },
    {
      path: "inspection_document",
      select: fileSchema.fieldsToSelect
    },
    {
      path: "vehicle_category",
      select: categorySchema.fieldsToSelect
    }
  ],
  fieldsToSelect:
    "license_plate_number vehicle_make vehicle_model vehicle_year vehicle_color vehicle_variant vehicle_category passenger_limit vehicle_images insurance_document inspection_document is_verified"
};

module.exports = vehicleSchema;
