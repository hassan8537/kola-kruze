const userSchema = require("./user-schema");

const fileSchema = {
  populate: [
    {
      path: "user_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: userSchema.fieldsToSelect
      }
    }
  ],
  fieldsToSelect: "file_path"
};

module.exports = fileSchema;
