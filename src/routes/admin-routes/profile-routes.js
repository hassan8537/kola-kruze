const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/profile-controller");

router.get("/", controller.getProfiles.bind(controller));

module.exports = router;
