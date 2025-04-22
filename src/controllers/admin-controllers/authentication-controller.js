const service = require("../../services/admin-services/authentication-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async signIn(request, response) {
    return this.service.signIn(request, response);
  }
}

module.exports = new Controller();
