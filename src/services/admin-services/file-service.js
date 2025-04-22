const File = require("../../models/File");
const fileSchema = require("../../schemas/file-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.file = File;
  }

  async getFiles(req, res) {
    try {
      const query = req.query;

      const filters = {};

      if (query._id) filters._id = query._id;
      if (query.user_id) filters.user_id = query.user_id;
      if (query.file_type) filters.file_type = query.file_type;
      if (query.file_size) filters.file_size = query.file_size;

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Files",
        model: this.file,
        filters,
        page,
        limit,
        sort,
        populate: fileSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ object_type: "fetch-files", message: error });

      return handlers.response.error({ res, message: error });
    }
  }
}

module.exports = new Service();
