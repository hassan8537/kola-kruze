exports.calculateWaitingTime = (arrival_time, current_time) => {
  const arrival = new Date(arrival_time).getTime();
  const current = new Date(current_time).getTime();

  const waitingTime = Math.round((current - arrival) / MS_IN_MINUTE);
  return Math.max(waitingTime, 0); // Ensure no negative values
};
