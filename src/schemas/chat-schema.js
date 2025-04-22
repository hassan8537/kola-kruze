const fileSchema = require("./file-schema");
const userSchema = require("./user-schema");

const chatSchema = {
  populate: [
    {
      path: "sender_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    },
    {
      path: "receiver_id",
      select: userSchema.fieldsToSelect,
      populate: {
        path: "profile_picture driver_license",
        select: fileSchema.fieldsToSelect
      }
    },
    {
      path: "files",
      select: fileSchema.fieldsToSelect
    }
  ]
};

module.exports = chatSchema;
