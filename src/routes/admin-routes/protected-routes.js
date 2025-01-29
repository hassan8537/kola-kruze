const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/admin-controllers/profile-controller"),
  student: require("../../controllers/admin-controllers/student-controller"),
  file: require("../../controllers/admin-controllers/file-controller")
};

// profiles
router.get(
  "/profiles",
  controllers.profile.getProfiles.bind(controllers.profile)
);

// students
router.get(
  "/students",
  controllers.student.getStudents.bind(controllers.student)
);

// files
router.get("/files", controllers.file.getFiles.bind(controllers.student));

module.exports = router;
