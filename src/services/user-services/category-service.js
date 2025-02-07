const Category = require("../../models/category");
const { populateCategory } = require("../../populate/populate-models");
const {
  errorResponse,
  failedResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.category = Category;
  }

  async getCategories(request, response) {
    try {
      const query = request.query;
      const filters = {};

      if (query._id) filters._id = query._id;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Categories",
        model: this.category,
        filters,
        page,
        limit,
        sort,
        populate: populateCategory.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
