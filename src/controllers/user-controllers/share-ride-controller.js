const service = require("../../services/user-services/share-ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getPassengers(request, response) {
    return this.service.getPassengers(request, response);
  }

  async inviteUser(request, response) {
    return this.service.inviteUser(request, response);
  }

  async withdrawInvite(request, response) {
    return this.service.withdrawInvite(request, response);
  }

  async acceptInvite(request, response) {
    return this.service.acceptInvite(request, response);
  }

  async rejectInvite(request, response) {
    return this.service.rejectInvite(request, response);
  }
}

module.exports = new Controller();
