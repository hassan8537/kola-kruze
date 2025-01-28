const { check, body } = require("express-validator");

const validator = {
  adminAuthentication: [
    check("email_address")
      .notEmpty()
      .withMessage("Email address is required")
      .isEmail()
      .withMessage("Email address should be a valid email address"),

    check("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/\d/)
      .withMessage("Password must contain at least one number")
      .matches(/[@$!%*?&]/)
      .withMessage("Password must contain at least one special character")
  ],

  emailAuthentication: [
    check("email_address")
      .notEmpty()
      .withMessage("Email address is required")
      .isEmail()
      .withMessage("Email address should be a valid"),
    check("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["passenger", "driver", "admin"])
      .withMessage(
        "Role should be one of the following: passenger, driver, or admin"
      ),
    check("device_token").notEmpty().withMessage("Device token is required")
  ],

  socialAuthentication: [
    body("phone_number").custom((value, { req }) => {
      if (req.body.auth_provider === "phone" && !value) {
        throw new Error("Phone number is required");
      }
      return true;
    }),
    check("social_token").notEmpty().withMessage("Social token is required"),
    check("role")
      .notEmpty()
      .withMessage("Role is required")
      .isIn(["passenger", "driver", "admin"])
      .withMessage(
        "Role should be one of the following: passenger, driver, or admin"
      ),
    check("auth_provider")
      .notEmpty()
      .withMessage("Auth provider is required")
      .isIn(["phone", "google", "apple"])
      .withMessage("Auth provider is required"),
    check("device_token").notEmpty().withMessage("Device token is required")
  ]
};

module.exports = validator;
