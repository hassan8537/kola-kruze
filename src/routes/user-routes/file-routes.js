const router = require("express").Router();

const controller = require("../../controllers/user-controllers/file-controller");

router.get("/", controller.getFiles.bind(controller));

module.exports = router;
