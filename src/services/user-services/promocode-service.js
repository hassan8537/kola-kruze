const Promocode = require("../../models/PromoCode");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.promocode = Promocode;
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
      const { code } = req.params;

      const existingPromocode = await this.promocode.findOne({
        code: code
      });

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
}

module.exports = new Service();
