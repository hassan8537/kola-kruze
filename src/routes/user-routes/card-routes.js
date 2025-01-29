const router = require("express").Router();

const controller = require("../../controllers/user-controllers/card-controller");

router.post("/", controller.addCard.bind(controller));

router.get("/", controller.getCards.bind(controller));

router.get("/:_id", controller.getCards.bind(controller));

router.delete("/:_id", controller.deleteCard.bind(controller));

router.put("/default", controller.setDefaultCard.bind(controller));

module.exports = router;
