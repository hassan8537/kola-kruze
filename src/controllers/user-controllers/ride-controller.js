const service = require("../../services/user-services/ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getMyRides(request, response) {
    return this.service.getMyRides(request, response);
  }

  async selectDestination(request, response) {
    return this.service.selectDestination(request, response);
  }

  async manageStops(request, response) {
    return this.service.manageStops(request, response);
  }

  async rideDetailsAndFares(request, response) {
    return this.service.rideDetailsAndFares(request, response);
  }

  async payNow(request, response) {
    return this.service.payNow(request, response);
  }
}

module.exports = new Controller();
