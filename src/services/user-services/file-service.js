const File = require("../../models/File");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");
const fileSchema = require("../../schemas/file-schema");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.file = File;
  }

  async createFile(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        handlers.logger.failed({ message: "No files uploaded" });

        return handlers.response.failed({
          res,
          message: "No files uploaded"
        });
      }

      const user_id = req.user._id;
      let filesToSave = [];

      for (const fieldname in req.files) {
        req.files[fieldname].forEach((file) => {
          filesToSave.push({
            user_id,
            file_name: file.originalname,
            file_type: file.mimetype,
            file_size: file.size,
            file_path: file.path
          });
        });
      }

      const savedFiles = await this.file.insertMany(filesToSave);

      handlers.logger.success({
        message: `Uploaded ${savedFiles.length} file(s) successfully`,
        data: savedFiles
      });

      return handlers.response.success({
        res,
        message: "Files uploaded successfully",
        data: savedFiles
      });
    } catch (error) {
      handlers.logger.error({
        message: error
      });

      return handlers.response.error({
        res,
        message: "Failed to upload files"
      });
    }
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
