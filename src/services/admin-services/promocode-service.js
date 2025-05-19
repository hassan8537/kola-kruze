const Promocode = require("../../models/PromoCode");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.promocode = Promocode;
  }

  async create(req, res) {
    const object_type = "create-promocode";
    try {
      const { code, discount } = req.body;

      const existing = await this.promocode.findOne({ code });
      if (existing) {
        handlers.logger.failed({
          object_type,
          message: "Promocode already exists"
        });
        return handlers.response.failed({
          res,
          message: "Promocode already exists"
        });
      }

      const created = await this.promocode.create({ code, discount });

      handlers.logger.success({
        object_type,
        message: "Promocode created successfully",
        data: created
      });
      return handlers.response.success({
        res,
        message: "Promocode created successfully",
        data: created
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async update(req, res) {
    const object_type = "update-promocode";
    try {
      const { _id } = req.params;
      const updateData = req.body;

      const updated = await this.promocode.findByIdAndUpdate(_id, updateData, {
        new: true
      });

      if (!updated) {
        handlers.logger.unavailable({
          object_type,
          message: "Promocode not found"
        });
        return handlers.response.unavailable({
          res,
          message: "Promocode not found"
        });
      }

      handlers.logger.success({
        object_type,
        message: "Promocode updated successfully",
        data: updated
      });
      return handlers.response.success({
        res,
        message: "Promocode updated successfully",
        data: updated
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async getAll(req, res) {
    try {
      const query = req.query;

      const filters = {};

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Promocodes",
        model: this.promocode,
        filters,
        page,
        limit,
        sort
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "fetch-promocodes",
        message: error.message
      });

      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }

  async get(req, res) {
    const object_type = "get-promocode";
    try {
      const { _id } = req.params;

      const existingPromocode = await this.promocode.findById(_id);

      if (!existingPromocode) {
        handlers.logger.unavailable({
          object_type,
          message: "Promocode not found"
        });
        return handlers.response.unavailable({
          res,
          message: "Promocode not found"
        });
      }

      handlers.logger.success({
        object_type,
        message: "Promocode fetched successfully",
        data: existingPromocode
      });
      return handlers.response.success({
        res,
        message: "Promocode fetched successfully",
        data: existingPromocode
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async remove(req, res) {
    const object_type = "delete-promocode";
    try {
      const { _id } = req.params;

      const existingPromocode = await this.promocode.findByIdAndDelete(_id);

      if (!existingPromocode) {
        handlers.logger.unavailable({
          object_type,
          message: "Promocode not found"
        });
        return handlers.response.unavailable({
          res,
          message: "Promocode not found"
        });
      }

      handlers.logger.success({
        object_type,
        message: "Promocode deleted successfully",
        data: existingPromocode
      });
      return handlers.response.success({
        res,
        message: "Promocode deleted successfully",
        data: existingPromocode
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
