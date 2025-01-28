const File = require("../models/File");
const { errorResponse } = require("../utilities/handlers/response-handler");
const fs = require("fs").promises;

const uploadFiles = async (request, response, next) => {
  try {
    const user_id = request.user._id;
    const files = request.files;

    const fields = Object.keys(files);

    if (!files) {
      console.log("No files uploaded");
      return next();
    }

    const fileIds = {};
    const fileDeletionPromises = [];

    await Promise.all(
      fields.map(async (field) => {
        const fileList = files[field];
        console.log({ fileList });

        const uploadedFiles = await Promise.all(
          fileList.map(async (file) => {
            try {
              const upload = await File.create({
                file_name: file.originalname,
                user_id: user_id,
                file_name: file.originalname,
                file_type: file.mimetype,
                file_path: file.path,
                file_url: `${file.path}`,
                file_size: file.size
              });

              if (!upload) {
                await fs.rm(file.path);
                throw new Error(
                  `Error occurred while uploading ${file.originalname}`
                );
              }

              return upload._id;
            } catch (error) {
              fileDeletionPromises.push(fs.rm(file.path));
              throw error;
            }
          })
        );

        fileIds[field] = uploadedFiles;
      })
    );

    if (fileDeletionPromises.length > 0) {
      await Promise.all(fileDeletionPromises);
    }

    request.files = fileIds;
    return next();
  } catch (error) {
    return errorResponse({ response, error });
  }
};

module.exports = uploadFiles;
