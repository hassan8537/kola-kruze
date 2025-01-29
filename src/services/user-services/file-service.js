const File = require("../../models/File");
const { populateFile } = require("../../populate/populate-models");
const { errorResponse } = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.file = File;
  }

  async getFiles(request, response) {
    try {
      const query = request.query;

      const filters = {};

      if (query._id) filters._id = query._id;
      if (query.user_id) filters.user_id = query.user_id;
      if (query.file_type) filters.file_type = query.file_type;
      if (query.file_size) filters.file_size = query.file_size;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Files",
        model: this.file,
        filters,
        page,
        limit,
        sort,
        populate: populateFile.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
