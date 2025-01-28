const { errorResponse, failedResponse } = require("./response-handler");
const jwt = require("jsonwebtoken");

exports.createSession = async ({ response, user }) => {
  try {
    const COOKIE_OPTIONS = {
      httpOnly: process.env.HTTP_ONLY,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAME_SITE,
      maxAge: process.env.MAX_AGE
    };

    const sessionToken = jwt.sign(
      { user_id: user._id },
      process.env.SESSION_SECRET_KEY,
      {
        expiresIn: process.env.TOKEN_EXPIRATION
      }
    );

    if (!sessionToken) {
      return failedResponse({ response, message: "Failed to create session" });
    }

    response.cookie("authorization", sessionToken, COOKIE_OPTIONS);

    user.session_token = sessionToken;
    return await user.save();
  } catch (error) {
    return errorResponse({ response, error });
  }
};
