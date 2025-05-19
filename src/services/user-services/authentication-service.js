const sendEmail = require("../../config/nodemailer");
const Otp = require("../../models/Otp");
const Referral = require("../../models/Refer");
const User = require("../../models/User");
const Wallet = require("../../models/Wallet");
const userSchema = require("../../schemas/user-schema");
const { generateOTP } = require("../../utilities/generators/otp-generator");
const {
  generateReferralCode
} = require("../../utilities/generators/refferal-code-generator");
const { generateToken } = require("../../utilities/generators/token-generator");
const { handlers } = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
    this.otp = Otp;
    this.wallet = Wallet;
    this.referral = Referral;
  }

  async generateAndSendOtp(user, device_token, res) {
    try {
      const otpCode = await generateOTP({ user_id: user._id });
      const token = generateToken({ res, user_id: user._id });

      user.session_token = token;
      user.device_token = device_token;
      await user.save();
      await user.populate(userSchema.populate);

      await sendEmail({
        to: user.email_address,
        subject: "Account Verification",
        text: `Your verification code is: ${otpCode}`
      });

      handlers.logger.success({
        object_type: "user-authentication -> generate and send OTP",
        message: "OTP generated and email sent successfully",
        data: { user_id: user._id }
      });

      return { user, token };
    } catch (error) {
      handlers.logger.error({
        object_type: "user-authentication -> generate and send OTP",
        message: "Failed to generate or send OTP",
        data: { user_id: user?._id }
      });
      throw error;
    }
  }

  async signUpOrSignIn(req, res) {
    try {
      const {
        legal_name,
        first_name,
        last_name,
        email_address,
        phone_number,
        device_token,
        role,
        referral_code
      } = req.body;

      let user = await this.user.findOne({ email_address });

      if (user && user.role !== role) {
        handlers.logger.failed({
          object_type: "user-authentication",
          message: "Email already registered with a different role",
          data: {
            email: email_address,
            existing_role: user.role,
            attempted_role: role
          }
        });

        return handlers.response.failed({
          res,
          message: "This email is already registered with a different role."
        });
      }

      let isNewUser = false;
      let referredByUser = null;

      if (!user) {
        // If referral_code is given, find referrer
        if (referral_code) {
          referredByUser = await this.user.findOne({
            referral_code: referral_code.trim()
          });

          if (!referredByUser) {
            return handlers.response.failed({
              res,
              message: "Invalid referral code"
            });
          }
        }

        // Create new user
        user = await this.user.create({
          role,
          legal_name,
          first_name,
          last_name,
          email_address,
          phone_number,
          device_token,
          referral_code: await generateReferralCode(),
          is_referred_driver: role === "driver"
        });

        isNewUser = true;

        handlers.logger.success({
          object_type: "user-authentication",
          message: "New user created",
          data: { user_id: user._id }
        });

        // If referral code was valid, create Referral entry
        if (referredByUser) {
          await this.referral.create({
            referrer_user: referredByUser._id,
            referred_user: user._id,
            points_awarded: 2
          });

          referredByUser.referral_points += 2;
          referredByUser.total_referrals += 1;
          await referredByUser.save();

          handlers.logger.success({
            object_type: "referral",
            message: "Referral record created",
            data: {
              referrer_user: referredByUser._id,
              referred_user: user._id
            }
          });
        }
      }

      // Ensure wallet exists
      const existingWallet = await this.wallet.findOne({ user_id: user._id });

      if (!existingWallet) {
        const wallet = await this.wallet.create({ user_id: user._id });

        handlers.logger.success({
          object_type: "user-authentication",
          message: "New wallet created",
          data: { wallet_id: wallet._id }
        });
      }

      const { user: updatedUser } = await this.generateAndSendOtp(
        user,
        device_token,
        res
      );

      const message = updatedUser.isVerified
        ? "Signed in"
        : "User is not verified. A verification OTP has been sent to your email.";

      handlers.logger.success({
        object_type: "user-authentication",
        message,
        data: { user_id: updatedUser._id }
      });

      return handlers.response.success({
        res,
        message,
        data: updatedUser
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "user-authentication",
        message: error
      });
      return handlers.response.error({ res, message: error.message });
    }
  }

  async socialSignUpOrSignIn(req, res) {
    try {
      const {
        legal_name,
        first_name,
        last_name,
        email,
        provider,
        social_token,
        phone_number,
        device_token,
        role
      } = req.body;

      if (email) {
        const emailConflict = await this.user.findOne({ email });
        if (emailConflict && emailConflict.role !== role) {
          handlers.logger.failed({
            object_type: "social-authentication",
            message: "Email already in use with different role",
            data: {
              email,
              existing_role: emailConflict.role,
              attempted_role: role
            }
          });

          return handlers.response.success({
            res,
            message: "Email already in use"
          });
        }

        if (emailConflict && emailConflict.provider !== provider) {
          handlers.logger.failed({
            object_type: "social-authentication",
            message: "Email already in use with different provider",
            data: {
              email,
              existing_provider: emailConflict.provider,
              attempted_provider: provider
            }
          });

          return handlers.response.success({
            res,
            message: "Email already in use"
          });
        }
      }

      if (social_token) {
        const socialTokenConflict = await this.user.findOne({ social_token });
        if (socialTokenConflict && socialTokenConflict.role !== role) {
          handlers.logger.failed({
            object_type: "social-authentication",
            message: "Social token already in use with different role",
            data: { user_id: socialTokenConflict._id, attempted_role: role }
          });

          return handlers.response.success({
            res,
            message: "Social token already in use"
          });
        }

        if (socialTokenConflict && socialTokenConflict.provider !== provider) {
          handlers.logger.failed({
            object_type: "social-authentication",
            message: "Social token already in use with different provider",
            data: {
              user_id: socialTokenConflict._id,
              existing_provider: socialTokenConflict.provider,
              attempted_provider: provider
            }
          });

          return handlers.response.success({
            res,
            message: "Social token already in use"
          });
        }
      }

      let user = await this.user.findOne({ social_token, role, provider });

      let isNewUser = false;
      let referredByUser = null;

      if (!user) {
        // If referral_code is given, find referrer
        if (referral_code) {
          referredByUser = await this.user.findOne({
            referral_code: referral_code.trim()
          });

          if (!referredByUser) {
            return handlers.response.failed({
              res,
              message: "Invalid referral code"
            });
          }
        }

        user = await this.user.create({
          legal_name,
          first_name,
          last_name,
          email,
          provider,
          social_token,
          phone_number,
          device_token,
          role,
          referral_code: await generateReferralCode(),
          is_referred_driver: role === "driver"
        });

        isNewUser = true;

        handlers.logger.success({
          object_type: "social-authentication",
          message: "New social user created",
          data: { user_id: user._id }
        });

        // If referral code was valid, create Referral entry
        if (referredByUser) {
          await this.referral.create({
            referrer_user: referredByUser._id,
            referred_user: user._id,
            points_awarded: 2
          });

          referredByUser.referral_points += 2;
          referredByUser.total_referrals += 1;
          await referredByUser.save();

          handlers.logger.success({
            object_type: "referral",
            message: "Referral record created",
            data: {
              referrer_user: referredByUser._id,
              referred_user: user._id
            }
          });
        }
      } else {
        user.social_token = social_token;
        user.device_token = device_token;
        user.role = role;
        await user.save();

        handlers.logger.success({
          object_type: "social-authentication",
          message: "Existing social user updated",
          data: { user_id: user._id }
        });
      }

      const token = generateToken({ _id: user._id, res });
      user.session_token = token;
      await user.populate(userSchema.populate);

      handlers.logger.success({
        object_type: "social-authentication",
        message: "Signed in!",
        data: user
      });

      return handlers.response.success({
        res,
        message: "Signed in!",
        data: user
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "social-authentication",
        message: error
      });

      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
