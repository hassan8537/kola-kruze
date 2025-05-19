const service = require("../../services/admin-services/promocode-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async createPromocode(request, response) {
    return this.service.create(request, response);
  }

  async updatePromocode(request, response) {
    return this.service.update(request, response);
  }

  async getAllPromocodes(request, response) {
    return this.service.getAll(request, response);
  }

  async getPromocode(request, response) {
    return this.service.get(request, response);
  }

  async deletePromocode(request, response) {
    return this.service.remove(request, response);
  }
}

module.exports = new Controller();
