// for nearby drivers
// async rideRequest(socket, data) {
//   try {
//     const {
//       user_id,
//       pickup_location,
//       dropoff_location,
//       stops,
//       fare_details,
//       vehicle_category
//     } = data;

//     const user = await this.user.findById(user_id);
//     const object_type = "get-ride";

//     if (!user) {
//       return socket.emit(
//         "response",
//         failedEvent({ object_type, message: "No user found" })
//       );
//     }

//     const existingRide = await this.ride.findOne({
//       user_id,
//       ride_status: { $in: ["pending", "ongoing"] }
//     });

//     if (existingRide) {
//       return socket.emit(
//         "response",
//         failedEvent({
//           object_type,
//           message: "A ride is already in progress"
//         })
//       );
//     }

//     const newRide = await this.ride.create({
//       user_id,
//       pickup_location,
//       dropoff_location,
//       stops,
//       fare_details
//     });

//     const ride = await this.ride
//       .findById(newRide._id)
//       .populate(populateRide.populate);

//     socket.emit(
//       "response",
//       successEvent({
//         object_type,
//         message: "Ride request sent successfully",
//         data: ride
//       })
//     );

//     const maxDistanceInMiles = process.env.MAX_DISTANCE_IN_MILES || 5;
//     const [pickupLongitude, pickupLatitude] =
//       pickup_location.location.coordinates;

//     const drivers = await this.user.find({
//       role: "driver",
//       is_available: true,
//       is_deleted: false
//     });

//     // Filter nearby drivers based on location
//     const nearbyDrivers = drivers.filter((driver) => {
//       const driverCoordinates = driver.current_location?.coordinates || [];
//       if (driverCoordinates.length === 0) return false;

//       const [driverLongitude, driverLatitude] = driverCoordinates;
//       const distance = getDistanceBetweenSourceAndDestination(
//         pickupLatitude,
//         pickupLongitude,
//         driverLatitude,
//         driverLongitude
//       );

//       return distance <= maxDistanceInMiles;
//     });

//     if (nearbyDrivers.length > 0) {
//       await Promise.all(
//         nearbyDrivers.map((driver) => {
//           socket.join(driver._id.toString());
//           this.io.to(driver._id.toString()).emit(
//             "response",
//             successEvent({
//               object_type: "new-ride-request",
//               message: "A user requested a ride near your location",
//               data: ride
//             })
//           );
//         })
//       );
//     } else {
//       socket.emit(
//         "response",
//         failedEvent({
//           object_type,
//           message: "No drivers are available within your area."
//         })
//       );
//     }
//   } catch (error) {
//     socket.emit("error", errorEvent({ error }));
//   }
// }
