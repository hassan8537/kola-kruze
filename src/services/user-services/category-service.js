const Category = require("../../models/Category");
const categorySchema = require("../../schemas/category-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.category = Category;
  }

  async getCategories(req, res) {
    try {
      const query = req.query;
      const filters = {};

      if (query._id) filters._id = query._id;

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Categories",
        model: this.category,
        filters,
        page,
        limit,
        sort,
        populate: categorySchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "fetch-categories",
        message: error
      });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
