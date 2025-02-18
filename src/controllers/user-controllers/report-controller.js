const service = require("../../services/user-services/report-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async submitReport(request, response) {
    return this.service.submitReport(request, response);
  }
}

module.exports = new Controller();
