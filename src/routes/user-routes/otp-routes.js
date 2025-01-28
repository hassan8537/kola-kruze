const router = require("express").Router();

const controller = require("../../controllers/user-controllers/otp-controller");
const validator = require("../../validators/otp-validator");

const validateResult = require("../../validators/result-validator");

router.post(
  "/verify",
  validator.verifyOTP,
  validateResult,
  controller.verifyOTP.bind(controller)
);

router.get(
  "/resend/:user_id",
  validator.resendOTP,
  validateResult,
  controller.resendOTP.bind(controller)
);

module.exports = router;
