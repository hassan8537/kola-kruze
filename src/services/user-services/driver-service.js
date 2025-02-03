const Ride = require("../../models/Ride");
const User = require("../../models/User");
const { populateUser } = require("../../populate/populate-models");
const notification = require("../../services/user-services/notification-service");

class Service {
  constructor(io) {
    this.io = io;
    this.user = User;
    this.ride = Ride;
  }

  async driverAvailability(socket, data) {
    try {
      const { driver_id, is_available } = data;

      const driver = await this.user
        .findById(driver_id)
        .populate(populateUser.populate);

      if (!driver) {
        return socket.emit("driver-availability", {
          status: 0,
          message: "Driver not found"
        });
      }

      driver.is_available = is_available;
      await driver.save();

      socket.emit("driver-availability", {
        status: 1,
        message: `Driver ${is_available ? "online" : "offline"}`,
        driver
      });

      this.io.to("drivers").emit("driver-availability", {
        driver_id: driver._id,
        is_available
      });

      // Notification for the user when a driver becomes available
      if (is_available) {
        const body = {
          device_token: driver.device_token,
          user: driver._id,
          message: "You are now online and available for rides",
          type: "ride",
          model_id: driver._id,
          model_type: "user",
          meta_data: { ...driver.toJSON() }
        };
        await notification.createNotification({ body });
      }
    } catch (error) {
      socket.emit("driver-availability", {
        status: 0,
        message: "Error updating driver availability",
        error
      });
    }
  }

  async driverLocationUpdate(socket, data) {
    try {
      const { ride_id, driver_id, current_location, eta } = data;

      const ride = await this.ride
        .findOne({ _id: ride_id, driver_id })
        .populate(populateUser.populate);
      if (!ride) {
        return socket.emit("driver-location-update", {
          status: 0,
          message: "Ride not found or driver mismatch"
        });
      }

      ride.tracking.current_location.coordinates = current_location.coordinates;
      ride.tracking.eta = eta;

      await ride.save();

      socket.emit("driver-location-update", {
        status: 1,
        message: "Driver's location updated",
        location: current_location,
        eta
      });

      this.io.to(ride.user_id).emit("driver-location-update", {
        location: current_location,
        eta
      });

      // Notification to both driver and user about location update
      const bodyUser = {
        device_token: ride.user.device_token,
        user: ride.user_id,
        message: "Your driver's location has been updated",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body: bodyUser });

      const bodyDriver = {
        device_token: ride.driver.device_token,
        user: ride.driver_id,
        message: "Your location has been updated for the ride",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body: bodyDriver });
    } catch (error) {
      socket.emit("driver-location-update", {
        status: 0,
        message: "Error updating driver's location",
        error
      });
    }
  }

  async driverRideCompleted(socket, data) {
    try {
      const { ride_id, driver_id } = data;

      const ride = await this.ride
        .findOne({ _id: ride_id, driver_id })
        .populate(populateUser.populate);
      if (!ride) {
        return socket.emit("driver-ride-completed", {
          status: 0,
          message: "Ride not found or driver mismatch"
        });
      }

      ride.ride_status = "completed";
      ride.end_time = new Date();

      await ride.save();

      socket.emit("driver-ride-completed", {
        status: 1,
        message: "Ride completed successfully",
        ride
      });

      this.io.to(ride.user_id).emit("ride-status-update", ride);
      this.io.to(ride.driver_id).emit("ride-status-update", ride);

      // Notification to both user and driver about ride completion
      const bodyUser = {
        device_token: ride.user.device_token,
        user: ride.user_id,
        message: "Your ride has been completed successfully",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body: bodyUser });

      const bodyDriver = {
        device_token: ride.driver.device_token,
        user: ride.driver_id,
        message: "You have completed the ride successfully",
        type: "ride",
        model_id: ride._id,
        model_type: "ride",
        meta_data: { ...ride.toJSON() }
      };

      await notification.createNotification({ body: bodyDriver });
    } catch (error) {
      socket.emit("driver-ride-completed", {
        status: 0,
        message: "Error marking ride as completed",
        error
      });
    }
  }
}

module.exports = new Service();
