const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/vehicle-controller");

router.get("/", controller.getVehicles.bind(controller));

router.get("/:_id", controller.getVehicleById.bind(controller));

module.exports = router;
