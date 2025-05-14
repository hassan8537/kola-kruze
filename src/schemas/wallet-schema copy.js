const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const transactionSchema = {
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
      path: "wallet_id"
    }
  ]
};

module.exports = transactionSchema;
