const service = require("../../services/user-services/favourite-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getFavourites(request, response) {
    return this.service.getFavourites(request, response);
  }

  async toggleFavouriteDriver(request, response) {
    return this.service.toggleFavouriteDriver(request, response);
  }
}

module.exports = new Controller();
