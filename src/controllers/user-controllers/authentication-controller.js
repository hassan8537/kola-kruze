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

  async logout(request, response) {
    return this.service.logout(request, response);
  }
}

module.exports = new Controller();
