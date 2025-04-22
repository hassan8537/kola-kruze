const service = require("../../services/user-services/invitation-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async sendInvitation(request, response) {
    return this.service.sendInvitation(request, response);
  }

  async acceptInvitation(request, response) {
    return this.service.acceptInvitation(request, response);
  }
}

module.exports = new Controller();
