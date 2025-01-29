const {
  errorResponse,
  successResponse,
  unavailableResponse
} = require("../handlers/response-handler");

exports.pagination = async ({
  response,
  table,
  model,
  filters = {},
  page = 1,
  limit = 10,
  sort = { createdAt: -1 },
  populate = null
}) => {
  try {
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;

    const skip = (pageNumber - 1) * pageSize;

    const data = await model
      .find(filters)
      .skip(skip)
      .limit(pageSize)
      .sort(sort)
      .populate(populate);

    const totalCount = await model.countDocuments(filters);

    if (!data.length) {
      return unavailableResponse({
        response,
        message: `No ${table.toLowerCase()} found.`
      });
    }

    return successResponse({
      response,
      message: `${table} retrieved successfully.`,
      data: {
        results: data,
        total_records: totalCount,
        total_pages: Math.ceil(totalCount / pageSize),
        current_page: pageNumber,
        page_size: pageSize
      }
    });
  } catch (error) {
    return errorResponse({ response, error });
  }
};
