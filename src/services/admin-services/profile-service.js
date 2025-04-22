const Student = require("../../models/Student");
const User = require("../../models/User");
const userSchema = require("../../schemas/user-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.user = User;
    this.student = Student;
  }

  async getProfiles(req, res) {
    try {
      const query = req.query;

      const filters = {};

      if (query._id) filters._id = query._id;
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
        response: res,
        table: "Profiles",
        model: this.user,
        filters,
        page,
        limit,
        sort,
        populate: userSchema.populate
      });
    } catch (error) {
      handlers.logger.error({
        object_type: "fetch-profiles",
        message: error.message
      });

      return handlers.response.error({
        res: res,
        message: error.message
      });
    }
  }
}

module.exports = new Service();
