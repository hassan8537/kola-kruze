const File = require("../../models/File");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");
const handlers = require("../../utilities/handlers/handlers");
const fileSchema = require("../../schemas/file-schema");

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
        populate: fileSchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "fetch-files",
        message: "Error fetching files.",
        data: error.message
      });
      return handlers.response.error({
        res: response,
        message: "Error fetching files."
      });
    }
  }

  async deleteFile(request, response) {
    try {
      const { _id } = request.params;

      const file = await this.file.findById(_id);

      if (!file) {
        handlers.logger.unavailable({
          object_type: "delete-files",
          message: "No file found."
        });
        return handlers.response.unavailable({
          res: response,
          message: "No file found."
        });
      }

      await this.file.findByIdAndDelete(_id);

      handlers.logger.success({
        object_type: "delete-files",
        message: "File deleted successfully."
      });
      return handlers.response.success({
        res: response,
        message: "File deleted successfully."
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "file",
        message: "Error deleting file.",
        data: error.message
      });
      return handlers.response.error({
        res: response,
        message: "Error deleting file."
      });
    }
  }
}

module.exports = new Service();
