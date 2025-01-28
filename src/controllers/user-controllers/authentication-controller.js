const service = require("../../services/user-services/authentication-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async emailAuthentication(request, response) {
    return this.service.emailAuthentication(request, response);
  }

  async socialAuthentication(request, response) {
    return this.service.socialAuthentication(request, response);
  }
}

module.exports = new Controller();
