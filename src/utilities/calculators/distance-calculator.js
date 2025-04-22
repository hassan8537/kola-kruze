exports.calculateDistance = (lat1, lon1, lat2, lon2, unit = "km") => {
  const R = unit === "miles" ? RADIUS_OF_EARTH_MILES : RADIUS_OF_EARTH_KM;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return (R * c).toFixed(2); // Distance in the specified unit (miles/km)
};
