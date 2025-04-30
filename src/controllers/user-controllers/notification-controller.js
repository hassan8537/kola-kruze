const service = require("../../services/user-services/notification-service");

class Controller {
  constructor() {
    this.service = service;
  }

  async createNotification(request, response) {
    return this.service.createNotification(request, response);
  }

  async getNotifications(request, response) {
    return this.service.getNotifications(request, response);
  }

  async getUnreadNotificationCount(request, response) {
    return this.service.getUnreadNotificationCount(request, response);
  }

  async markAsRead(request, response) {
    return this.service.markAsRead(request, response);
  }
}

module.exports = new Controller();
