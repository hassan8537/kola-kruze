const { handlers } = require("../handlers/handlers");

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

    console.log({ data });

    const totalCount = await model.countDocuments(filters);

    if (!data.length) {
      return handlers.response.unavailable({
        res: response,
        message: `No ${table.toLowerCase()} found.`
      });
    }

    return handlers.response.success({
      res: response,
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
    return handlers.response.error({
      res: response,
      message: error.message
    });
  }
};
