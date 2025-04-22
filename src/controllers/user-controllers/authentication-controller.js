const service = require("../../services/user-services/authentication-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async signUpOrSignIn(request, response) {
    return this.service.signUpOrSignIn(request, response);
  }

  async socialSignUpOrSignIn(request, response) {
    return this.service.socialSignUpOrSignIn(request, response);
  }

  async logout(request, response) {
    return this.service.logout(request, response);
  }
}

module.exports = new Controller();
