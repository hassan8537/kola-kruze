const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/admin-controllers/profile-controller"),
  student: require("../../controllers/admin-controllers/student-controller"),
  file: require("../../controllers/admin-controllers/file-controller"),
  vehicle: require("../../controllers/admin-controllers/vehicle-controller")
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

// vehicles
router.get(
  "/vehicles",
  controllers.vehicle.getVehicles.bind(controllers.vehicle)
);

module.exports = router;
