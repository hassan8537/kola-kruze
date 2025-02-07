const service = require("../../services/admin-services/stop-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async updateRatePerStop(request, response) {
    return this.service.updateRatePerStop(request, response);
  }
}

module.exports = new Controller();
