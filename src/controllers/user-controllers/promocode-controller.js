const service = require("../../services/user-services/promocode-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getAllPromocodes(request, response) {
    return this.service.getAll(request, response);
  }

  async getPromocode(request, response) {
    return this.service.get(request, response);
  }
}

module.exports = new Controller();
