const service = require("../../services/user-services/vehicle-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getVehicle(request, response) {
    return this.service.getVehicle(request, response);
  }

  async addVehicle(request, response) {
    return this.service.addVehicle(request, response);
  }

  async editVehicleDetails(request, response) {
    return this.service.editVehicleDetails(request, response);
  }
}

module.exports = new Controller();
