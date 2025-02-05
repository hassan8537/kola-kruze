const service = require("../../services/user-services/card-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async addCard(request, response) {
    return this.service.addCard(request, response);
  }

  async getCards(request, response) {
    return this.service.getMyCards(request, response);
  }

  async deleteCard(request, response) {
    return this.service.deleteCard(request, response);
  }

  async setDefaultCard(request, response) {
    return this.service.setDefaultCard(request, response);
  }
}

module.exports = new Controller();
