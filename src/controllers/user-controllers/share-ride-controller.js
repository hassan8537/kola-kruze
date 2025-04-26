const service = require("../../services/user-services/share-ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async selectDestination(request, response) {
    return this.service.selectDestination(request, response);
  }

  async getPassengers(request, response) {
    return this.service.getPassengers(request, response);
  }

  async inviteUser(request, response) {
    return this.service.inviteUser(request, response);
  }

  async acceptInvite(request, response) {
    return this.service.acceptInvite(request, response);
  }

  async rejectInvite(request, response) {
    return this.service.rejectInvite(request, response);
  }
}

module.exports = new Controller();
