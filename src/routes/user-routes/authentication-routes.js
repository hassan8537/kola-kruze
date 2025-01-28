const router = require("express").Router();

const controller = require("../../controllers/user-controllers/authentication-controller");
const validator = require("../../validators/authentication-validator");

const validateResult = require("../../validators/result-validator");

router.post(
  "/email",
  validator.emailAuthentication,
  validateResult,
  controller.emailAuthentication.bind(controller)
);

router.post(
  "/social",
  validator.socialAuthentication,
  validateResult,
  controller.socialAuthentication.bind(controller)
);

module.exports = router;
