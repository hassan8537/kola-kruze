const service = require("../../services/user-services/student-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getStudents(request, response) {
    return this.service.getStudents(request, response);
  }
}

module.exports = new Controller();
