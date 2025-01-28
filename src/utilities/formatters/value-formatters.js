exports.sanitizeNumber = ({ field, value }) => {
  try {
    console.log({ value });

    if (!value) throw new Error(`Invalid ${field}`);

    const sanitizedNumber = value.replace(/\D/g, "");

    if (!sanitizedNumber) throw new Error(`Failed to sanitize ${field}`);

    return sanitizedNumber;
  } catch (error) {
    console.error(error);
    return error.message;
  }
};
