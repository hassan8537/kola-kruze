const router = require("express").Router();

const controller = require("../../controllers/admin-controllers/category-controller");

router.get("/", controller.getCategories.bind(controller));

router.post("/", controller.createCategory.bind(controller));

router.put("/:_id", controller.updateCategory.bind(controller));

router.delete("/:_id", controller.deleteCategory.bind(controller));

module.exports = router;
