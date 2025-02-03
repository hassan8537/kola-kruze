const service = require("../../services/user-services/payment-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async processPayment(request, response) {
    return this.service.processPayment(request, response);
  }

  async addTip(request, response) {
    return this.service.addTip(request, response);
  }
}

module.exports = new Controller();
