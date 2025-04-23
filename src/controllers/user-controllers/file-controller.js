const service = require("../../services/user-services/file-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async createFile(request, response) {
    return this.service.createFile(request, response);
  }

  async getFiles(request, response) {
    return this.service.getFiles(request, response);
  }

  async deleteFile(request, response) {
    return this.service.deleteFile(request, response);
  }
}

module.exports = new Controller();
