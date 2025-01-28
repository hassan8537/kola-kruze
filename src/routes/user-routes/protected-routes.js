const driverVerification = require("../../middlewares/driver-verification-middleware");
const upload = require("../../middlewares/mutler-middleware");
const uploadFiles = require("../../middlewares/upload-files-middleware");

const router = require("express").Router();

const controllers = {
  profiles: require("../../controllers/user-controllers/profile-controller"),
  vehicle: require("../../controllers/user-controllers/vehicle-controller")
};

router.get(
  "/profiles",
  controllers.profiles.getProfile.bind(controllers.profiles)
);

router.post(
  "/profiles",
  upload.fields([{ name: "profile_picture" }, { name: "identity_document" }]),
  uploadFiles,
  controllers.profiles.createProfile.bind(controllers.profiles)
);

router.put(
  "/profiles",
  upload.fields([{ name: "profile_picture" }, { name: "identity_document" }]),
  uploadFiles,
  controllers.profiles.updateProfile.bind(controllers.profiles)
);

router.delete(
  "/profiles",
  controllers.profiles.deleteAccount.bind(controllers.profiles)
);

router.post(
  "/vehicles",
  driverVerification,
  upload.fields([
    { name: "insurance_document" },
    { name: "inspection_document" },
    { name: "vehicle_images" },
    { name: "driver_license" }
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
    { name: "driver_license" }
  ]),
  uploadFiles,
  controllers.vehicle.editVehicleDetails.bind(controllers.vehicle)
);

module.exports = router;
