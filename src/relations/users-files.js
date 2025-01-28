const File = require("../models/File");
const Student = require("../models/Student");
const User = require("../models/User");

module.exports = {
  UsersFilesRelation: () => {
    User.belongsTo(File, {
      foreignKey: "profile_picture",
      as: "picture"
    });

    File.hasMany(User, {
      foreignKey: "profile_picture",
      as: "picture_users"
    });
  },
  StudentsFilesRelation: () => {
    Student.belongsTo(File, {
      foreignKey: "identity_document",
      as: "student_identity_document"
    });

    File.hasMany(Student, {
      foreignKey: "identity_document",
      as: "student_identity_document_students"
    });
  }
};
