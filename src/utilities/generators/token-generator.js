const {
  errorResponse,
  failedResponse
} = require("../handlers/response-handler");
const jwt = require("jsonwebtoken");

exports.generateToken = ({ response, user_id }) => {
  try {
    const token = jwt.sign({ user_id }, process.env.SESSION_SECRET_KEY, {
      expiresIn: process.env.TOKEN_EXPIRATION
    });

    if (!token) {
      return failedResponse({ response, message: "Invalid session" });
    }

    response.cookie("authorization", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE,
      maxAge: process.env.MAX_AGE
    });

    return { status: 1, message: "Token generated successfully", token };
  } catch (error) {
    return errorResponse({ response, error });
  }
};
