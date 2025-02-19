const service = require("../../services/user-services/rating-service");

class Controller {
  async addRating(req, res) {
    return service.addRating(req, res);
  }

  async getRatings(req, res) {
    return service.getRatings(req, res);
  }

  async getUserRatings(req, res) {
    return service.getUserRatings(req, res);
  }
}

module.exports = new Controller();
