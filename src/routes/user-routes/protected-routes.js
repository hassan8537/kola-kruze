const driverVerification = require("../../middlewares/driver-verification-middleware");
const upload = require("../../middlewares/multer-middleware");
const uploadFiles = require("../../middlewares/upload-files-middleware");

const router = require("express").Router();

const controllers = {
  authentication: require("../../controllers/user-controllers/authentication-controller"),
  profile: require("../../controllers/user-controllers/profile-controller"),
  student: require("../../controllers/user-controllers/student-controller"),
  vehicle: require("../../controllers/user-controllers/vehicle-controller"),
  file: require("../../controllers/user-controllers/file-controller"),
  card: require("../../controllers/user-controllers/card-controller"),
  stripe: require("../../controllers/user-controllers/stripe-controller"),
  chat: require("../../controllers/user-controllers/chat-controller"),
  category: require("../../controllers/user-controllers/category-controller"),
  ride: require("../../controllers/user-controllers/ride-controller"),
  scheduled_ride: require("../../controllers/user-controllers/scheduled-ride-controller"),
  shared_ride: require("../../controllers/user-controllers/share-ride-controller"),
  rating: require("../../controllers/user-controllers/rating-controller"),
  report: require("../../controllers/user-controllers/report-controller"),
  toggle: require("../../controllers/user-controllers/toggle-controller"),
  invitation: require("../../controllers/user-controllers/invitation-controller"),
  notification: require("../../controllers/user-controllers/notification-controller")
};

// session
router.get(
  "/auth/logout",
  controllers.authentication.logout.bind(controllers.authentication)
);

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
router.post(
  "/files",
  upload.fields([
    { name: "videos" },
    { name: "images" },
    { name: "audios" },
    { name: "docs" }
  ]),
  controllers.file.createFile.bind(controllers.file)
);

router.get("/files", controllers.file.getFiles.bind(controllers.file));

router.delete(
  "/files/:_id",
  controllers.file.deleteFile.bind(controllers.file)
);

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

// chats
router.get("/chats/inbox", controllers.chat.getInbox.bind(controllers.chat));

// categories
router.get(
  "/categories",
  controllers.category.getCategories.bind(controllers.category)
);

// rides
router.get(
  "/rides/current",
  controllers.ride.getCurrentRide.bind(controllers.ride)
);

router.get("/rides", controllers.ride.getMyRides.bind(controllers.ride));

router.post(
  "/rides/select-destination",
  controllers.ride.selectDestination.bind(controllers.ride)
);

router.post(
  "/rides/manage-stops",
  controllers.ride.manageStops.bind(controllers.ride)
);

router.post(
  "/rides/ride-details-and-fare",
  controllers.ride.rideDetailsAndFares.bind(controllers.ride)
);

router.post(
  "/rides/confirm",
  controllers.ride.confirmRide.bind(controllers.ride)
);

router.post(
  "/rides/pay-now/:_id",
  controllers.ride.payNow.bind(controllers.ride)
);

router.post(
  "/rides/verify-otp",
  controllers.ride.verifyOtp.bind(controllers.ride)
);

// scheduled rides
router.get(
  "/rides/scheduled",
  controllers.scheduled_ride.getMyRides.bind(controllers.scheduled_ride)
);

// shared rides
router.get(
  "/rides/shared/select-destination",
  controllers.shared_ride.selectDestination.bind(controllers.shared_ride)
);

router.get(
  "/rides/shared/passengers",
  controllers.shared_ride.getPassengers.bind(controllers.shared_ride)
);

router.post(
  "/rides/shared/send-invite",
  controllers.shared_ride.inviteUser.bind(controllers.shared_ride)
);

router.post(
  "/rides/shared/invites/accept",
  controllers.shared_ride.acceptInvite.bind(controllers.shared_ride)
);

router.post(
  "/rides/shared/invites/reject",
  controllers.shared_ride.rejectInvite.bind(controllers.shared_ride)
);

// rating
router.get(
  "/ratings/user",
  controllers.rating.getUserRatings.bind(controllers.rating)
);

router.get("/ratings", controllers.rating.getRatings.bind(controllers.rating));

router.post("/ratings", controllers.rating.addRating.bind(controllers.rating));

// report
router.post(
  "/reports",
  upload.fields([{ name: "image" }]),
  uploadFiles,
  controllers.report.submitReport.bind(controllers.report)
);

// toggles
router.get(
  "/toggles/driver-availability",
  controllers.toggle.toggleDriverAvailability.bind(controllers.toggle)
);

// invitation
router.get(
  "/invitations/send-invitation",
  controllers.invitation.sendInvitation.bind(controllers.invitation)
);

router.get(
  "/invitations/accept-invitation/:ride_id/:user_id",
  controllers.invitation.acceptInvitation.bind(controllers.invitation)
);

// invitation
router.get(
  "/notifications",
  controllers.notification.getNotifications.bind(controllers.notification)
);

router.get(
  "/notifications/unread",
  controllers.notification.getUnreadNotificationCount.bind(
    controllers.notification
  )
);

router.get(
  "/notifications/mark-as-read",
  controllers.notification.markAsRead.bind(controllers.notification)
);

module.exports = router;
