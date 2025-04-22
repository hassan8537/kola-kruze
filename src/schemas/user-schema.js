const fileSchema = require("./file-schema");

const userSchema = {
  populate: [
    {
      path: "profile_picture driver_license",
      select: fileSchema.fieldsToSelect
    }
  ],
  fieldsToSelect:
    "first_name last_name legal_name profile_picture gender email_address phone_number role is_student driver_license is_verified"
};

module.exports = userSchema;
