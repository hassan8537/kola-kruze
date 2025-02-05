const driverVerification = require("../../middlewares/driver-verification-middleware");
const upload = require("../../middlewares/mutler-middleware");
const uploadFiles = require("../../middlewares/upload-files-middleware");

const router = require("express").Router();

const controllers = {
  profile: require("../../controllers/user-controllers/profile-controller"),
  student: require("../../controllers/user-controllers/student-controller"),
  vehicle: require("../../controllers/user-controllers/vehicle-controller"),
  file: require("../../controllers/user-controllers/file-controller"),
  card: require("../../controllers/user-controllers/card-controller"),
  stripe: require("../../controllers/user-controllers/stripe-controller")
};

// profiles
router.get(
  "/profiles",
  controllers.profile.getProfile.bind(controllers.profile)
);

router.post(
  "/profiles",
  upload.fields([
    { name: "profile_picture" },
    { name: "identity_document" },
    { name: "driver_license" }
  ]),
  uploadFiles,
  controllers.profile.createProfile.bind(controllers.profile)
);

router.put(
  "/profiles",
  upload.fields([
    { name: "profile_picture" },
    { name: "identity_document" },
    { name: "driver_license" }
  ]),
  uploadFiles,
  controllers.profile.editProfile.bind(controllers.profile)
);

router.delete(
  "/profiles",
  controllers.profile.deleteAccount.bind(controllers.profile)
);

// students
router.get(
  "/students",
  controllers.student.getStudents.bind(controllers.student)
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
    { name: "vehicle_images" }
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
    { name: "vehicle_images" }
  ]),
  uploadFiles,
  controllers.vehicle.editVehicleDetails.bind(controllers.vehicle)
);

// files
router.get("/files", controllers.file.getFiles.bind(controllers.file));

// cards
router.get("/cards", controllers.card.getCards.bind(controllers.card));

router.post("/cards", controllers.card.addCard.bind(controllers.card));

router.delete(
  "/cards/:_id",
  controllers.card.deleteCard.bind(controllers.card)
);

router.put(
  "/cards/default",
  controllers.card.setDefaultCard.bind(controllers.card)
);

// stripe
router.get(
  "/stripe/setup",
  controllers.stripe.setupStripeMerchant.bind(controllers.stripe)
);

module.exports = router;
