const { check, param } = require("express-validator");

const validator = {
  verifyOTP: [
    check("user_id")
      .notEmpty()
      .withMessage("User ID is required")
      .isMongoId()
      .withMessage("User ID should be a valid Object ID"),
    check("otp_code")
      .notEmpty()
      .withMessage("OTP code is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP code must be 6 characters long")
  ],
  resendOTP: [
    param("user_id")
      .notEmpty()
      .withMessage("User ID is required")
      .isMongoId()
      .withMessage("User ID should be a valid Object ID")
  ]
};

module.exports = validator;
