const Student = require("../../models/Student");
const User = require("../../models/User");
const {
  populateUser,
  populateStudent
} = require("../../populate/populate-models");
const {
  sanitizeNumber
} = require("../../utilities/formatters/value-formatters");
const {
  errorResponse,
  failedResponse,
  successResponse,
  unavailableResponse
} = require("../../utilities/handlers/response-handler");

class Service {
  constructor() {
    this.user = User;
    this.student = Student;
  }

  async getProfile(request, response) {
    try {
      const user_id = request.user._id;

      const profile = await this.user
        .findById(user_id)
        .populate(populateUser.populate);

      if (!profile) {
        return unavailableResponse({ response, message: "No profile found." });
      }

      return successResponse({
        response,
        message: "Profile retrieved successfully.",
        data: profile
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async createProfile(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;

      const profile_picture = request.files.profile_picture?.[0] ?? null;
      const driver_license = request.files.driver_license?.[0] ?? null;

      const user = await this.user
        .findById(user_id)
        .populate(populateUser.populate);

      if (!user) {
        return unavailableResponse({ response, message: "No profile found." });
      }

      const usedEmail = await this.user.findOne({
        _id: user._id,
        email_address: user.email_address
      });

      if (!usedEmail)
        return failedResponse({ response, message: "Email already in use" });

      user.profile_picture = profile_picture;

      if (user.role === "passenger") {
        const sanitizedPhoneNumber = sanitizeNumber({
          field: "phone number",
          value: body.phone_number
        });

        const sanitizedEmergencyContact = sanitizeNumber({
          field: "emergency contact",
          value: body.emergency_contact
        });

        if (sanitizedPhoneNumber === sanitizedEmergencyContact)
          return failedResponse({
            response,
            message: "Phone number and Emergency contact cannot be same."
          });

        user.legal_name = body.legal_name;
        user.phone_number = body.phone_number;
        user.email = body.email;
        user.emergency_contact = body.emergency_contact;
        user.current_location = body.current_location;
        user.gender = body.gender;
      }

      if (user.role === "driver") {
        user.first_name = body.first_name;
        user.last_name = body.last_name;
        user.gender = body.gender;
        user.driver_license = driver_license;
      }

      if (body.is_student) {
        const identity_document = request.files.identity_document?.[0] ?? null;

        user.identity_document = identity_document;
        return await this.studentManagement({ response, user, body });
      }

      user.is_profile_completed = true;
      await user.save();

      return successResponse({
        response,
        message: "Profile created successfully.",
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async editProfile(request, response) {
    try {
      const user_id = request.user._id;
      const body = request.body;
      const profile_picture = request.files.profile_picture?.[0] ?? null;
      const driver_license = request.files.driver_license?.[0] ?? null;

      const user = await this.user.findById(user_id);

      if (!user) {
        return unavailableResponse({ response, message: "No profile found." });
      }

      const usedEmail = await this.user.findOne({
        _id: user._id,
        email_address: user.email_address
      });

      if (!usedEmail)
        return failedResponse({ response, message: "Email already in use" });

      user.profile_picture = profile_picture;

      if (user.role === "passenger") {
        const sanitizedPhoneNumber = sanitizeNumber({
          field: "phone number",
          value: body.phone_number
        });

        const sanitizedEmergencyContact = sanitizeNumber({
          field: "emergency contact",
          value: body.emergency_contact
        });

        if (sanitizedPhoneNumber === sanitizedEmergencyContact)
          return failedResponse({
            response,
            message: "Phone number and Emergency contact cannot be same."
          });

        user.profile_picture = profile_picture;
        user.legal_name = body.legal_name;
        user.phone_number = body.phone_number;
        user.email_address = body.email_address;
        user.emergency_contact = body.emergency_contact;
        user.current_location = body.current_location;
        user.gender = body.gender;
        user.driver_preference = body.driver_preference;
        user.gender_preference = body.gender_preference;
      }

      if (user.role === "driver") {
        user.first_name = body.first_name;
        user.last_name = body.last_name;
        user.gender = body.gender;
        user.driver_license = driver_license;
      }

      user.state = body.state || user.state;
      user.ssn_number = body.ssn_number || user.ssn_number;
      user.is_notification_enabled =
        body.is_notification_enabled || user.is_notification_enabled;
      user.is_merchant_setup = body.is_merchant_setup || user.is_merchant_setup;
      user.is_vehicle_setup = body.is_vehicle_setup || user.is_vehicle_setup;

      await user.save();

      await user.populate(populateUser.populate);

      return successResponse({
        response,
        message: "Profile edited successfully.",
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async deleteAccount(request, response) {
    try {
      const user_id = request.user._id;

      const user = await this.user
        .findById(user_id)
        .populate(populateUser.populate);

      if (!user) {
        return unavailableResponse({ response, message: "No profile found." });
      }

      user.is_deleted = true;
      await user.save();

      return successResponse({
        response,
        message: "Account deleted successfully.",
        data: user
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }

  async studentManagement({ response, user, body }) {
    try {
      const student = await this.student.findOne({
        user_id: user._id
      });

      if (student) {
        return failedResponse({
          response,
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
        return failedResponse({
          response,
          message: "Failed to complete student profile."
        });
      }

      user.is_student = true;
      user.is_profile_completed = true;
      await user.save();

      const studentUser = await this.user
        .findById(user._id)
        .populate(populateUser.populate);

      return successResponse({
        response,
        message: "Profile created successfully",
        data: studentUser
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
