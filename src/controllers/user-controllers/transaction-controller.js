const service = require("../../services/user-services/transaction-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getTransactions(request, response) {
    return this.service.getTransactions(request, response);
  }
}

module.exports = new Controller();
