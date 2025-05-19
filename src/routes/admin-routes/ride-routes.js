const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/ride-controller");

router.get("/count", controller.getTotalRides.bind(controller));

router.get("/", controller.getAllRides.bind(controller));

router.get("/:_id", controller.getRideById.bind(controller));

module.exports = router;
