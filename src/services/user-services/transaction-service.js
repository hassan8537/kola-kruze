// const stripeSecretKey = require("../../config/stripe");
// const stripe = require("stripe")(stripeSecretKey);

const Transaction = require("../../models/Transactions");
const transactionSchema = require("../../schemas/wallet-schema copy");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.transaction = Transaction;
  }

  async getTransactions(req, res) {
    const object_type = "fetch-transactions";
    try {
      const query = req.query;

      const filters = {};

      filters.user_id = req.user._id;

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Transactions",
        model: this.transaction,
        filters,
        page,
        limit,
        sort,
        populate: transactionSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
