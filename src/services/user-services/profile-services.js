const Student = require("../../models/Student");
const User = require("../../models/User");
const userSchema = require("../../schemas/user-schema");
const {
  sanitizeNumber
} = require("../../utilities/formatters/sanitize-number");

const {
  handlers: { logger, response }
} = require("../../utilities/handlers/handlers");

class Service {
  constructor() {
    this.user = User;
    this.student = Student;
  }

  async getProfile(req, res) {
    const object_type = "fetch-profiles";
    try {
      const user_id = req.user._id;

      const profile = await this.user
        .findById(user_id)
        .populate(userSchema.populate);

      if (!profile) {
        logger.unavailable({
          object_type,
          message: "No profile found."
        });
        return response.unavailable({ res, message: "No profile found." });
      }

      logger.success({
        object_type,
        message: "Profile retrieved successfully.",
        data: profile
      });

      return response.success({
        res,
        message: "Profile retrieved successfully.",
        data: profile
      });
    } catch (error) {
      logger.error({
        object_type,
        message: error
      });

      return response.error({
        res,
        message: error.message
      });
    }
  }

  async createProfile(req, res) {
    const object_type = "create-profile";
    try {
      const user_id = req.user._id;
      const body = req.body;

      const user = await this.user
        .findById(user_id)
        .populate(userSchema.populate);

      if (!user) {
        logger.unavailable({
          object_type,
          message: "No profile found."
        });
        return response.unavailable({ res, message: "No profile found." });
      }

      const usedEmail = await this.user.findOne({
        _id: user._id,
        email_address: user.email_address
      });

      if (!usedEmail) {
        logger.failed({
          object_type,
          message: "Email already in use"
        });
        return response.failed({ res, message: "Email already in use" });
      }

      const sanitizedPhoneNumber = sanitizeNumber({
        field: "phone number",
        value: body.phone_number
      });

      const sanitizedEmergencyContact = sanitizeNumber({
        field: "emergency contact",
        value: body.emergency_contact
      });

      if (sanitizedPhoneNumber === sanitizedEmergencyContact) {
        logger.failed({
          object_type,
          message: "Phone number and Emergency contact cannot be same."
        });
        return response.failed({
          res,
          message: "Phone number and Emergency contact cannot be same."
        });
      }

      Object.assign(user, {
        profile_picture: body.profile_picture,
        email: body.email,
        legal_name: body.legal_name,
        first_name: body.first_name,
        last_name: body.last_name,
        gender: body.gender,
        driver_license: body.driver_license,
        phone_number: body.phone_number,
        emergency_contact: body.emergency_contact,
        current_location: body.current_location
      });

      if (body.is_student) {
        user.identity_document = body.identity_document;
        return await this.studentManagement({ res, user, body });
      }

      user.is_profile_completed = true;
      await user.save();
      await user.populate(userSchema.populate);

      logger.success({
        object_type,
        message: "Profile created successfully.",
        data: user
      });
      return response.success({
        res,
        message: "Profile created successfully.",
        data: user
      });
    } catch (error) {
      logger.error({ object_type, message: error });
      return response.error({ res, message: error.message });
    }
  }

  async updateProfile(req, res) {
    const object_type = "update-profile";

    try {
      const user_id = req.user._id;
      const body = req.body;

      const user = await this.user.findById(user_id);
      if (!user) {
        logger.unavailable({
          object_type,
          message: "No profile found."
        });
        return response.unavailable({ res, message: "No profile found." });
      }

      const usedEmail = await this.user.findOne({
        _id: user._id,
        email_address: user.email_address
      });

      if (!usedEmail) {
        logger.failed({ object_type, message: "Email already in use" });
        return response.failed({ res, message: "Email already in use" });
      }

      const sanitizedPhoneNumber = sanitizeNumber({
        field: "phone number",
        value: body.phone_number
      });

      const sanitizedEmergencyContact = sanitizeNumber({
        field: "emergency contact",
        value: body.emergency_contact
      });

      if (sanitizedPhoneNumber === sanitizedEmergencyContact) {
        logger.failed({
          object_type,
          message: "Phone number and Emergency contact cannot be same."
        });
        return response.failed({
          res,
          message: "Phone number and Emergency contact cannot be same."
        });
      }

      console.log({
        profile_picture: body.profile_picture ?? user.profile_picture,
        legal_name: body.legal_name ?? user.legal_name,
        first_name: body.first_name ?? user.first_name,
        last_name: body.last_name ?? user.last_name
      });

      Object.assign(user, {
        profile_picture: body.profile_picture ?? user.profile_picture,
        legal_name: body.legal_name ?? user.legal_name,
        first_name: body.first_name ?? user.first_name,
        last_name: body.last_name ?? user.last_name,
        driver_license: body.driver_license ?? user.driver_license,
        phone_number: body.phone_number ?? user.phone_number,
        email_address: body.email_address ?? user.email_address,
        emergency_contact: body.emergency_contact ?? user.emergency_contact,
        current_location: body.current_location ?? user.current_location,
        gender: body.gender ?? user.gender,
        driver_preference: body.driver_preference ?? user.driver_preference,
        gender_preference: body.gender_preference ?? user.gender_preference,
        state: body.state ?? user.state,
        ssn_number: body.ssn_number ?? user.ssn_number
      });

      await user.save();
      await user.populate(userSchema.populate);

      logger.success({
        object_type,
        message: "Profile updated successfully.",
        data: user
      });
      return response.success({
        res,
        message: "Profile updated successfully.",
        data: user
      });
    } catch (error) {
      logger.error({ object_type, message: error.message });
      return response.error({ res, message: "Internal server error." });
    }
  }

  async deleteAccount(request, res) {
    const object_type = "delete-account";
    try {
      const user_id = request.user._id;

      const user = await this.user
        .findById(user_id)
        .populate(userSchema.populate);

      if (!user) {
        logger.unavailable({
          object_type,
          message: "No profile found."
        });
        return response.unavailable({ res, message: "No profile found." });
      }

      user.is_deleted = true;
      await user.save();

      logger.success({
        object_type,
        message: "Account deleted successfully.",
        data: user
      });
      return response.success({
        res,
        message: "Account deleted successfully.",
        data: user
      });
    } catch (error) {
      logger.error({ object_type, message: error });
      return response.error({ res, message: error.message });
    }
  }

  async studentManagement({ res, user, body }) {
    const object_type = "manage-student";
    try {
      const student = await this.student.findOne({ user_id: user._id });

      if (student) {
        logger.failed({
          object_type: "student",
          message: "You already have a student profile."
        });
        return response.failed({
          res,
          message: "You already have a student profile."
        });
      }

      const newStudent = await this.student.create({
        user_id: user._id,
        university_name: body.university_name,
        identity_document: user.identity_document,
        start_date: body.start_date,
        end_date: body.end_date
      });

      if (!newStudent) {
        logger.failed({
          object_type,
          message: "Failed to complete student profile."
        });
        return response.failed({
          res,
          message: "Failed to complete student profile."
        });
      }

      user.is_student = true;
      user.is_profile_completed = true;
      await user.save();

      const studentUser = await this.user
        .findById(user._id)
        .populate(userSchema.populate);

      logger.success({
        object_type,
        message: "Profile created successfully",
        data: studentUser
      });
      return response.success({
        res,
        message: "Profile created successfully",
        data: studentUser
      });
    } catch (error) {
      logger.error({ object_type, message: error });
      return response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
