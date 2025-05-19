const service = require("../../services/admin-services/ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getAllRides(request, response) {
    return this.service.getAllRides(request, response);
  }

  async getRideById(request, response) {
    return this.service.getRideById(request, response);
  }

  async getTotalRides(request, response) {
    return this.service.getTotalRides(request, response);
  }
}

module.exports = new Controller();
