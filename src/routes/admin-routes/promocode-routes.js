const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/promocode-controller");

router.post("/", controller.createPromocode.bind(controller));

router.put("/:_id", controller.updatePromocode.bind(controller));

router.get("/", controller.getAllPromocodes.bind(controller));

router.get("/:_id", controller.getPromocode.bind(controller));

router.delete("/:_id", controller.deletePromocode.bind(controller));

module.exports = router;
