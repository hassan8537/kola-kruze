const Student = require("../../models/Student");
const studentSchema = require("../../schemas/student-schema");
const { handlers } = require("../../utilities/handlers/handlers");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.student = Student;
  }

  async getStudents(req, res) {
    const object_type = "fetch-students";
    try {
      const query = req.query;

      const filters = {};

      if (query._id) filters._id = query._id;
      if (query.user_id) filters.user_id = query.user_id;

      const { page, limit, sort } = query;

      await pagination({
        response: res,
        table: "Students",
        model: this.student,
        filters,
        page,
        limit,
        sort,
        populate: studentSchema.populate
      });
    } catch (error) {
      handlers.logger.error({ object_type, message: error });
      return handlers.response.error({ res, message: error.message });
    }
  }
}

module.exports = new Service();
