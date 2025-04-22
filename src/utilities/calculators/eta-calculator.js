exports.calculateETA = (distance, speed = 35) => {
  if (!distance || !speed) return "N/A";
  const timeInMinutes = Math.round((distance / speed) * 60);

  if (timeInMinutes < 1) return "< 1 min";
  if (timeInMinutes < 60) return `${timeInMinutes} min`;

  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
};
