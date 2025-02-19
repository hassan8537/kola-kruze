const service = require("../../services/user-services/toggle-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async toggleDriverAvailability(request, response) {
    return this.service.toggleDriverAvailability(request, response);
  }
}

module.exports = new Controller();
