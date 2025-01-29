const service = require("../../services/admin-services/vehicle-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getVehicles(request, response) {
    return this.service.getVehicles(request, response);
  }
}

module.exports = new Controller();
