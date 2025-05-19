const service = require("../../services/admin-services/profile-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getProfiles(request, response) {
    return this.service.getProfiles(request, response);
  }

  async getProfileById(request, response) {
    return this.service.getProfileById(request, response);
  }

  async getTotalProfiles(request, response) {
    return this.service.getTotalProfiles(request, response);
  }
}

module.exports = new Controller();
