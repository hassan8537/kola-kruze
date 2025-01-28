const Student = require("../../models/Student");
const { populateStudent } = require("../../populate/populate-models");
const {
  errorResponse,
  successResponse,
  failedResponse
} = require("../../utilities/handlers/response-handler");
const {
  pagination
} = require("../../utilities/paginations/pagination-utility");

class Service {
  constructor() {
    this.student = Student;
  }

  async getStudents(request, response) {
    try {
      const query = request.query;

      const filters = {};

      if (query.student_id) filters.student_id = query.student_id;
      if (query.user_id) filters.user_id = query.user_id;

      const { page, limit, sort } = query;

      await pagination({
        response,
        table: "Students",
        model: this.student,
        filters,
        page,
        limit,
        sort: sort ? [sort.split(",")] : [["createdAt", "DESC"]],
        populate: populateStudent.populate
      });
    } catch (error) {
      return errorResponse({ response, error });
    }
  }
}

module.exports = new Service();
