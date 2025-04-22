const { calculateDistance } = require("./distance-calculator");
const { calculateETA } = require("./eta-calculator");

exports.getTimeToReachDestination = (
  lat1,
  lon1,
  lat2,
  lon2,
  speedKmh = process.env.AVERAGE_SPEED_IN_KM
) => {
  const distance = calculateDistance(lat1, lon1, lat2, lon2, "km");
  return calculateETA(distance, speedKmh);
};
