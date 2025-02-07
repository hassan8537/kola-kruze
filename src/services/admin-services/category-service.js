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

  async createCategory(request, response) {
    try {
      const image = request.files.image?.[0] ?? null;
      const { name, rate_per_mile, passenger_limit } = request.body;

      const existingCategory = await this.category.findOne({ name });

      if (existingCategory) {
        return failedResponse({
          response,
          message: "Category name already exists."
        });
      }

      const newCategory = new this.category({
        name,
        image,
        rate_per_mile,
        passenger_limit
      });

      await newCategory.save();
      await newCategory.populate(populateCategory.populate);

      return successResponse({
        response,
        message: "Category created successfully.",
        data: newCategory
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async updateCategory(request, response) {
    try {
      const { _id } = request.params;
      const { name, rate_per_mile, passenger_limit } = request.body;
      const image = request.files?.image?.[0] ?? null;

      const category = await this.category.findById(_id);

      if (!category) {
        return failedResponse({
          response,
          message: "Category not found."
        });
      }

      if (name && name !== category.name) {
        const existingCategory = await this.category.findOne({ name });

        if (existingCategory) {
          return failedResponse({
            response,
            message: "Category name already exists."
          });
        }

        category.name = name;
      }

      category.rate_per_mile = rate_per_mile ?? category.rate_per_mile;
      category.passenger_limit = passenger_limit ?? category.passenger_limit;
      if (image) category.image = image;

      await category.save();
      await category.populate(populateCategory.populate);

      return successResponse({
        response,
        message: "Category updated successfully.",
        data: category
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteCategory(request, response) {
    try {
      const { _id } = request.params;

      const category = await this.category.findByIdAndDelete(_id);

      if (!category) {
        return failedResponse({
          response,
          message: "Category not found."
        });
      }

      return successResponse({
        response,
        message: "Category deleted successfully."
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
