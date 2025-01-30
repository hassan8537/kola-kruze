const router = require("express").Router();

const controller = require("../../controllers/user-controllers/profile-controller");
// const validator = require("../../validators/otp-validator");

// const validateResult = require("../../validators/result-validator");

router.get("/", controller.getProfile.bind(controller));

router.post("/", controller.createProfile.bind(controller));

router.put("/", controller.editProfile.bind(controller));

router.delete("/", controller.deleteAccount.bind(controller));

module.exports = router;
