const service = require("../../services/user-services/wallet-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async addFunds(request, response) {
    return this.service.addFunds(request, response);
  }
}

module.exports = new Controller();
