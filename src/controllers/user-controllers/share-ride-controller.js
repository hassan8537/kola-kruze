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
}

module.exports = new Controller();
