exports.successEvent = ({ message, data }) => {
  console.log({
    code: 200,
    status: 1,
    message: message,
    data: data
  });

  return {
    code: 200,
    status: 1,
    message: message,
    data: data
  };
};

exports.failedEvent = ({ message }) => {
  console.log({
    code: 400,
    status: 0,
    message: message
  });

  return {
    code: 400,
    status: 0,
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
