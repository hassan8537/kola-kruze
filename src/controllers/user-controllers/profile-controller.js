const service = require("../../services/user-services/profile-services");

class Controller {
  constructor() {
    this.service = service;
  }

  async getProfile(request, response) {
    return this.service.getProfile(request, response);
  }

  async createProfile(request, response) {
    return this.service.createProfile(request, response);
  }

  async editProfile(request, response) {
    return this.service.updateProfile(request, response);
  }

  async deleteAccount(request, response) {
    return this.service.deleteAccount(request, response);
  }
}

module.exports = new Controller();
