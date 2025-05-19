const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/profile-controller");

router.get("/count", controller.getTotalProfiles.bind(controller));

router.get("/", controller.getProfiles.bind(controller));

router.get("/:_id", controller.getProfileById.bind(controller));

module.exports = router;
