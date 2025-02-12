const { sendNotification } = require("../../../config/firebase");
const Ride = require("../../../models/Ride");
const User = require("../../../models/User");
const { errorLog } = require("../../../utilities/handlers/log-handler");
const notificationService = require("../notification-service");

class Service {
  constructor() {
    this.user = User;
    this.ride = Ride;
  }

  async findNearestDriver(pickupLocation) {
    const nearestDriver = await this.user.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: pickupLocation.location.coordinates // [longitude, latitude]
          },
          distanceField: "distance",
          maxDistance: 5 * 1609.34, // 5 miles in meters
          spherical: true,
          query: {
            role: "driver",
            is_available: true,
            "current_location.coordinates": { $exists: true } // Ensure driver has a valid location
          }
        }
      },
      { $sort: { distance: 1 } }, // Sort by nearest
      { $limit: 1 } // Get only one nearest driver
    ]);

    return nearestDriver.length ? nearestDriver[0] : null;
  }

  async checkScheduledRideDelays() {
    const now = new Date();
    const rides = await this.ride.find({
      ride_status: "reserved",
      scheduled_time: { $lte: new Date(now.getTime() + 10 * 60 * 1000) } // Check 10 minutes before
    });

    for (let ride of rides) {
      const driver = await this.user.findById(ride.driver_id);

      if (!driver || !driver.current_location?.coordinates) continue; // Ensure driver has a location

      // Fetch ETA (implement getETA function using Google Maps API)
      const estimatedArrivalTime = await getETA(
        driver.current_location.coordinates, // Driver's location
        ride.pickup_location.location.coordinates // Ride pickup location
      );

      // If the driver is predicted to be late, mark as delayed and try reassigning
      if (estimatedArrivalTime > 10) {
        ride.ride_status = "delayed";
        await ride.save();

        const newDriver = await this.findNearestDriver(ride.pickup_location);
        if (newDriver) {
          ride.driver_id = newDriver._id;
          ride.ride_status = "reassigned";
          await ride.save();

          notifyUser({
            user_id: ride.user_id,
            ride,
            message: "Your scheduled ride has been reassigned to a new driver."
          });
          notifyDriver({
            user_id: newDriver._id,
            ride,
            message: "You have a new scheduled ride assignment."
          });
        } else {
          notifyUser({
            user_id: ride.user_id,
            ride,
            message:
              "Your scheduled driver is running late. We are looking for a replacement."
          });
        }
      }
    }
  }

  async notifyUser({ user_id, ride, message }) {
    try {
      const user = await this.user.findById(user_id);
      this.notificationManagement({ user, ride, message });
    } catch (error) {
      return errorLog({ error });
    }
  }

  async notifyDriver({ user_id, ride, message }) {
    try {
      const user = await this.user.findById(user_id);
      this.notificationManagement({ user, ride, message });
    } catch (error) {
      return errorLog({ error });
    }
  }

  async notificationManagement({ user, ride, message }) {
    try {
      const notificationBody = {
        user_id: user._id,
        message: message,
        type: "ride",
        model_id: ride._id,
        model_type: "Ride"
      };

      const fcmPayload = JSON.stringify({
        message: {
          token: user.device_token,
          notification: {
            title: message,
            body: `${sender.first_name || sender.legal_name} sent you a message`
          },
          data: {
            notificationType: "ride",
            title: "Scheduled Ride",
            body: JSON.stringify(notificationBody)
          }
        }
      });

      await this.user.findByIdAndUpdate(
        receiver._id,
        { $inc: { notification_count: 1 } },
        { new: true }
      );

      await sendNotification(fcmPayload);

      await notificationService.createNotification({ body: notificationBody });
    } catch (error) {
      return errorLog({ error });
    }
  }
}

module.exports = new Service();
