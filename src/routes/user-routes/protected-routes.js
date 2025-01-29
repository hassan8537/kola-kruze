const driverVerification = require("../../middlewares/driver-verification-middleware");
const upload = require("../../middlewares/mutler-middleware");
const uploadFiles = require("../../middlewares/upload-files-middleware");

const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/user-controllers/profile-controller"),
  vehicle: require("../../controllers/user-controllers/vehicle-controller"),
  file: require("../../controllers/user-controllers/file-controller")
};

// profiles
router.get(
  "/profiles",
  controllers.profile.getProfile.bind(controllers.profile)
);

router.post(
  "/profiles",
  upload.fields([{ name: "profile_picture" }, { name: "identity_document" }]),
  uploadFiles,
  controllers.profile.createProfile.bind(controllers.profile)
);

router.put(
  "/profiles",
  upload.fields([{ name: "profile_picture" }, { name: "identity_document" }]),
  uploadFiles,
  controllers.profile.updateProfile.bind(controllers.profile)
);

router.delete(
  "/profiles",
  controllers.profile.deleteAccount.bind(controllers.profile)
);

// vehicles
router.get(
  "/vehicles",
  driverVerification,
  controllers.vehicle.getVehicle.bind(controllers.vehicle)
);

router.post(
  "/vehicles",
  driverVerification,
  upload.fields([
    { name: "insurance_document" },
    { name: "inspection_document" },
    { name: "vehicle_images" },
    { name: "vehicle_driver_licenses" }
  ]),
  uploadFiles,
  controllers.vehicle.addVehicle.bind(controllers.vehicle)
);

router.put(
  "/vehicles",
  driverVerification,
  upload.fields([
    { name: "insurance_document" },
    { name: "inspection_document" },
    { name: "vehicle_images" },
    { name: "vehicle_driver_licenses" }
  ]),
  uploadFiles,
  controllers.vehicle.editVehicleDetails.bind(controllers.vehicle)
);

// files
router.get("/files", controllers.file.getFiles.bind(controllers.file));

module.exports = router;
