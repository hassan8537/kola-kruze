const service = require("../../services/user-services/file-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getFiles(request, response) {
    return this.service.getFiles(request, response);
  }
}

module.exports = new Controller();
