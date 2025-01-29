const Student = require("../../models/Student");
const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const {
  errorResponse,
  failedResponse,
  successResponse
} = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.user = User;
    this.student = Student;
  }

  async getProfiles(request, response) {
    try {
      const query = request.query;

      const filters = {};

      if (query.user_id) filters.user_id = query.user_id;
      if (query.role) filters.role = query.role;
      if (query.gender) filters.gender = query.gender;
      if (query.auth_provider) filters.auth_provider = query.auth_provider;
      if (query.is_verified) filters.is_verified = query.is_verified;
      if (query.is_student) filters.is_student = query.is_student;
      if (query.driver_preference)
        filters.driver_preference = query.driver_preference;
      if (query.gender_preference)
        filters.gender_preference = query.gender_preference;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Profiles",
        model: this.user,
        filters,
        page,
        limit,
        sort,
        populate: populateUser.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
