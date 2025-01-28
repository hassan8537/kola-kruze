const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/student-controller");

router.get("/", controller.getStudents.bind(controller));

module.exports = router;
