const upload = require("../../middlewares/multer-middleware");
const uploadFiles = require("../../middlewares/upload-files-middleware");

const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/admin-controllers/profile-controller"),
  student: require("../../controllers/admin-controllers/student-controller"),
  file: require("../../controllers/admin-controllers/file-controller"),
  vehicle: require("../../controllers/admin-controllers/vehicle-controller"),
  category: require("../../controllers/admin-controllers/category-controller"),
  stop: require("../../controllers/admin-controllers/stop-controller")
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

// categories
router.get(
  "/categories",
  controllers.category.getCategories.bind(controllers.category)
);

router.post(
  "/categories",
  upload.fields([{ name: "image", maxCount: 1 }]),
  uploadFiles,
  controllers.category.createCategory.bind(controllers.category)
);

router.put(
  "/categories/:_id",
  upload.fields([{ name: "image", maxCount: 1 }]),
  uploadFiles,
  controllers.category.updateCategory.bind(controllers.category)
);

router.delete(
  "/categories/:_id",
  controllers.category.deleteCategory.bind(controllers.category)
);

// stops
router.put(
  "/rides/stops",
  controllers.stop.updateRatePerStop.bind(controllers.stop)
);

module.exports = router;
