const service = require("../../services/user-services/stripe-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async setupStripeMerchant(request, response) {
    return this.service.setupStripeMerchant(request, response);
  }
}

module.exports = new Controller();
