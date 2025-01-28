const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/authentication-controller");
const validator = require("../../validators/authentication-validator");

const validateResult = require("../../validators/result-validator");

router.post(
  "/signin",
  validator.adminAuthentication,
  validateResult,
  controller.adminAuthentication.bind(controller)
);

module.exports = router;
