const service = require("../../services/admin-services/profile-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getProfiles(request, response) {
    return this.service.getProfiles(request, response);
  }
}

module.exports = new Controller();
