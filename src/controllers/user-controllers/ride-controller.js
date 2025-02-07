const service = require("../../services/user-services/ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getMyRides(request, response) {
    return this.service.getMyRides(request, response);
  }

  async createRide(request, response) {
    return this.service.createRide(request, response);
  }

  async manageStops(request, response) {
    return this.service.manageStops(request, response);
  }
}

module.exports = new Controller();
