const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/authentication-controller");

router.post("/signin", controller.signIn.bind(controller));

module.exports = router;
