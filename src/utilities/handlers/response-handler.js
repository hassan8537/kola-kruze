exports.successResponse = ({ response, message, data }) => {
  console.log({ log: message });
  return response.status(200).json({
    code: 200,
    status: 1,
    message: message,
    data: data
  });
};

exports.failedResponse = ({ response, message }) => {
  console.log({ log: message });
  return response.status(200).json({
    code: 200,
    status: 0,
    message: message
  });
};

exports.errorResponse = ({ response, error }) => {
  console.log({ log: error });
  return response.status(500).json({
    code: 500,
    status: 0,
    message: error.message
  });
};
