exports.isETAWithinTwoMinutes = (etaToPickup) => {
  if (!etaToPickup) return false;

  const currentTime = Date.now();
  const etaTime = new Date(etaToPickup).getTime();
  const differenceInMinutes = (etaTime - currentTime) / MS_IN_MINUTE;

  return differenceInMinutes < process.env.CANCELLATION_WINDOW;
};
