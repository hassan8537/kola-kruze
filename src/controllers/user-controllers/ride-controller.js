const service = require("../../services/user-services/ride-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getMyRides(request, response) {
    return this.service.getMyRides(request, response);
  }
}

module.exports = new Controller();
