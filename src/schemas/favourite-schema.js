const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const favouriteSchema = {
  populate: [
    {
      path: "driver_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    }
  ]
};

module.exports = favouriteSchema;
