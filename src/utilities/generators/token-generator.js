const jwt = require("jsonwebtoken");
const { handlers } = require("../handlers/handlers");

exports.generateToken = ({ response, user_id }) => {
  try {
    const token = jwt.sign({ user_id }, process.env.SESSION_SECRET_KEY, {
      expiresIn: process.env.TOKEN_EXPIRATION
    });

    if (!token) {
      return handlers.response.failed({
        res: response,
        message: "Invalid session"
      });
    }

    response.cookie("authorization", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE || "Lax",
      maxAge: parseInt(process.env.MAX_AGE || "86400000") // fallback: 1 day
    });

    return {
      status: 1,
      message: "Token generated successfully",
      token
    };
  } catch (error) {
    return handlers.response.error({
      res: response,
      message: error.message
    });
  }
};
