const service = require("../../services/admin-services/vehicle-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getVehicles(request, response) {
    return this.service.getVehicles(request, response);
  }

  async getVehicleById(request, response) {
    return this.service.getVehicleById(request, response);
  }
}

module.exports = new Controller();
