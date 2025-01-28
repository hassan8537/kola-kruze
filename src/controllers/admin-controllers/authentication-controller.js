const service = require("../../services/admin-services/authentication-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async adminAuthentication(request, response) {
    return this.service.adminAuthentication(request, response);
  }
}

module.exports = new Controller();
