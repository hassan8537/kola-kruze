exports.getDistanceBetweenSourceAndDestination = (lat1, lon1, lat2, lon2) => {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

// Haversine formula
exports.getTimeTeReachTheDestination = (
  lat1,
  lon1,
  lat2,
  lon2,
  speedKmh = process.env.AVERAGE_SPEED_IN_KM
) => {
  const R = 6371;
  const toRad = (angle) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  const timeHours = distance / speedKmh; // Time in hours
  const timeMinutes = timeHours * 60; // Convert to minutes

  return Math.round(timeMinutes); // Return rounded time in minutes
};

// Calculate ETA
const haversineDistance = (coords1, coords2) => {
  const toRad = (angle) => (Math.PI / 180) * angle;

  const R = 6371; // Radius of Earth in km
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in km
};

exports.calculateETA = (driver_location, dropoff_location, avgSpeed = 40) => {
  const distance = haversineDistance(
    driver_location.coordinates,
    dropoff_location.coordinates
  );

  const timeInHours = distance / avgSpeed; // Time in hours
  const timeInMinutes = Math.round(timeInHours * 60); // Convert to minutes

  return timeInMinutes; // Return estimated time in minutes
};

exports.calculateWaitingTime = (arrival_time, current_time) => {
  const arrival = new Date(arrival_time).getTime();
  const current = new Date(current_time).getTime();

  const waitingTime = Math.round((current - arrival) / (1000 * 60)); // Convert milliseconds to minutes

  return waitingTime >= 0 ? waitingTime : 0; // Ensure no negative values
};

exports.isETAWithinTwoMinutes = (etaToPickup) => {
  if (!etaToPickup) return false;

  const currentTime = Date.now();
  const etaTime = new Date(etaToPickup).getTime();
  const differenceInMinutes = (etaTime - currentTime) / (1000 * 60);

  return differenceInMinutes < process.env.CANCELLATION_WINDOW;
};
