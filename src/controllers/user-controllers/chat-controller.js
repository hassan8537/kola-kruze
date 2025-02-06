const service = require("../../services/user-services/chat-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async getInbox(request, response) {
    return this.service.getInbox(request, response);
  }
}

module.exports = new Controller();
