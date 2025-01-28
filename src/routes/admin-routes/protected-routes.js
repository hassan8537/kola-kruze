const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/admin-controllers/profile-controller"),
  student: require("../../controllers/admin-controllers/student-controller")
};

router.get(
  "/profiles",
  controllers.profile.getProfiles.bind(controllers.profile)
);

router.get(
  "/students",
  controllers.student.getStudents.bind(controllers.student)
);

module.exports = router;
