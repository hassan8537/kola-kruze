const router = require("express").Router();

const controller = require("../../controllers/user-controllers/promocode-controller");

router.get("/", controller.getAllPromocodes.bind(controller));

router.get("/:_id", controller.getPromocode.bind(controller));

module.exports = router;
