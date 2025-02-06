exports.successLog = ({ message, data }) => {
  console.log({
    code: 200,
    status: 1,
    message: message,
    data: data
  });
};

exports.failedLog = ({ message }) => {
  console.log({
    code: 400,
    status: 0,
    message: message
  });
};

exports.unavailableLog = ({ message }) => {
  console.log({
    code: 404,
    status: 0,
    message: message
  });
};

exports.unauthorizedLog = ({ message }) => {
  console.log({
    code: 401,
    status: 0,
    message: message
  });
};

exports.errorLog = ({ error }) => {
  console.log({
    code: 500,
    status: 0,
    message: error
  });
};
