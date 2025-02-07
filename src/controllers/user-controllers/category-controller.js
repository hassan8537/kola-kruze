const service = require("../../services/user-services/category-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getCategories(request, response) {
    return this.service.getCategories(request, response);
  }
}

module.exports = new Controller();
