const buildPayload = ({ object_type, code, status, message, data = null }) => ({
  object_type,
  code,
  status,
  message,
  data
});

const sendResponse = ({ res, code, status, message, data = null }) =>
  res.status(code).send({ status, message, data });

const logPayload = ({ object_type, code, status, message, data = null }) => {
  console.info({ object_type, code, status, message, data });
};

exports.handlers = {
  logger: {
    success: (params) => logPayload({ code: 200, status: 1, ...params }),
    failed: (params) => logPayload({ code: 400, status: 0, ...params }),
    error: (params) => logPayload({ code: 500, status: 0, ...params }),
    unavailable: (params) => logPayload({ code: 404, status: 0, ...params }),
    unauthorized: (params) => logPayload({ code: 403, status: 1, ...params })
  },
  response: {
    success: (params) => sendResponse({ code: 200, status: 1, ...params }),
    failed: (params) => sendResponse({ code: 400, status: 0, ...params }),
    error: (params) => sendResponse({ code: 500, status: 0, ...params }),
    unavailable: (params) => sendResponse({ code: 404, status: 0, ...params }),
    unauthorized: (params) => sendResponse({ code: 403, status: 1, ...params })
  },
  event: {
    success: (params) => buildPayload({ code: 200, status: 1, ...params }),
    failed: (params) => buildPayload({ code: 400, status: 0, ...params }),
    error: (params) => buildPayload({ code: 500, status: 0, ...params }),
    unavailable: (params) => buildPayload({ code: 404, status: 0, ...params }),
    unauthorized: (params) => buildPayload({ code: 403, status: 1, ...params })
  }
};
