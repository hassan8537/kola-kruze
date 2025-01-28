const router = require("express").Router();

const controller = require("../../controllers/user-controllers/vehicle-controller");

// const validator = require("../../validators/otp-validator");

// const validateResult = require("../../validators/result-validator");

router.post("/", controller.addVehicle.bind(controller));

router.put("/", controller.editVehicleDetails.bind(controller));

module.exports = router;
