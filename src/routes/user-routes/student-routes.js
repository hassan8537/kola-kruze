const router = require("express").Router();

const controller = require("../../controllers/user-controllers/student-controller");

router.get("/", controller.getStudents.bind(controller));

module.exports = router;
