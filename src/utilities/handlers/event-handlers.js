exports.successEvent = ({ object_type, message, data }) => {
  console.log({
    code: 200,
    status: 1,
    object_type,
    message: message,
    data: data
  });

  return {
    code: 200,
    status: 1,
    object_type,
    message: message,
    data: data
  };
};

exports.failedEvent = ({ object_type, message }) => {
  console.log({
    code: 400,
    status: 0,
    object_type,
    message: message
  });

  return {
    code: 400,
    status: 0,
    object_type,
    message: message
  };
};

exports.errorEvent = ({ error }) => {
  console.log({
    code: 500,
    status: 0,
    message: error.message
  });

  return {
    code: 500,
    status: 0,
    message: error.message
  };
};
