const fileSchema = require("./file-schema");

const categorySchema = {
  populate: [
    {
      path: "image",
      select: fileSchema.fieldsToSelect
    }
  ],
  fieldsToSelect: "name image rate_per_mile passenger_limit"
};

module.exports = categorySchema;
