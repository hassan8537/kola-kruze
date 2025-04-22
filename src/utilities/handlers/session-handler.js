const jwt = require("jsonwebtoken");
const { handlers } = require("./handlers");

exports.createSession = async ({ response, user }) => {
  try {
    const token = jwt.sign(
      { user_id: user._id },
      process.env.SESSION_SECRET_KEY,
      { expiresIn: process.env.TOKEN_EXPIRATION }
    );

    if (!token) {
      return handlers.response.failed({
        res: response,
        message: "Session creation failed"
      });
    }

    response.cookie("authorization", token, {
      httpOnly: process.env.HTTP_ONLY === "true",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE || "Lax",
      maxAge: +process.env.MAX_AGE || 86400000
    });

    user.session_token = token;
    return await user.save();
  } catch (error) {
    return handlers.response.error({ res: response, message: error.message });
  }
};
