const service = require("../../services/admin-services/category-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getCategories(request, response) {
    return this.service.getCategories(request, response);
  }

  async createCategory(request, response) {
    return this.service.createCategory(request, response);
  }

  async updateCategory(request, response) {
    return this.service.updateCategory(request, response);
  }

  async deleteCategory(request, response) {
    return this.service.deleteCategory(request, response);
  }
}

module.exports = new Controller();
