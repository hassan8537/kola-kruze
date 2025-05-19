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

  async createCategory(req, res) {
    try {
      const { name, image, rate_per_mile, passenger_limit } = req.body;

      const existingCategory = await this.category.findOne({ name });
      if (existingCategory) {
        handlers.logger.failed({
          object_type: "create-category",
          message: "Category name already exists."
        });

        return handlers.response.failed({
          res: res,
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
      await newCategory.populate(categorySchema.populate);

      handlers.logger.success({
        object_type: "create-category",
        message: "Category created successfully.",
        data: newCategory
      });

      return handlers.response.success({
        res: res,
        message: "Category created successfully.",
        data: newCategory
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "create-category",
        message: error
      });

      return handlers.response.error({ res: res, message: error.message });
    }
  }

  async updateCategory(req, res) {
    try {
      const { _id } = req.params;

      console.log(req.body);

      const { name, rate_per_mile, passenger_limit, image } = req.body;

      const category = await this.category.findById(_id);

      if (!category) {
        handlers.logger.failed({
          object_type: "update-category",
          message: "Category not found."
        });

        return handlers.response.failed({
          res: res,
          message: "Category not found."
        });
      }

      if (name && name !== category.name) {
        const existingCategory = await this.category.findOne({ name });
        if (existingCategory) {
          handlers.logger.failed({
            object_type: "update-category",
            message: "Category name already exists."
          });

          return handlers.response.failed({
            res: res,
            message: "Category name already exists."
          });
        }

        category.name = name;
      }

      const updatedCategory = await this.category
        .findByIdAndUpdate(
          category._id,
          { name, rate_per_mile, passenger_limit, image },
          { new: true }
        )
        .populate(categorySchema.populate);

      handlers.logger.success({
        object_type: "update-category",
        message: "Category updated successfully",
        data: updatedCategory
      });

      return handlers.response.success({
        res: res,
        message: "Category updated successfully",
        data: updatedCategory
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "update-category",
        message: error
      });

      return handlers.response.error({ res, message: error.message });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { _id } = req.params;

      const category = await this.category.findByIdAndDelete(_id);

      if (!category) {
        handlers.logger.failed({
          object_type: "delete-category",
          message: "No categories found"
        });

        return handlers.response.failed({
          res: res,
          message: "No categories found"
        });
      }

      handlers.logger.success({
        object_type: "delete-category",
        message: "Category deleted successfully"
      });

      return handlers.response.success({
        res: res,
        message: "Category deleted successfully"
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "delete-category",
        message: error
      });

      return handlers.response.error({ res: res, message: error.message });
    }
  }
}

module.exports = new Service();
