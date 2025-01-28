const service = require("../../services/user-services/otp-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async verifyOTP(request, response) {
    return this.service.verifyOTP(request, response);
  }

  async resendOTP(request, response) {
    return this.service.resendOTP(request, response);
  }
}

module.exports = new Controller();
