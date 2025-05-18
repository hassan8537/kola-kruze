const service = require("../../services/admin-services/student-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getStudents(request, response) {
    return this.service.getStudents(request, response);
  }

  async getStudentById(request, response) {
    return this.service.getStudentById(request, response);
  }
}

module.exports = new Controller();
