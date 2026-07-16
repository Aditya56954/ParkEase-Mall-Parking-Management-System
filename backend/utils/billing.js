/**
 * Duration-based billing. Charges per hour, rounded UP to the nearest hour,
 * with a minimum charge floor (protects against near-zero "quick exit" abuse).
 */
const calculateAmount = (entryTime, exitTime, ratePerHour) => {
  const minChargeMinutes = Number(process.env.MIN_CHARGE_MINUTES || 30);
  const ms = new Date(exitTime) - new Date(entryTime);
  let minutes = Math.ceil(ms / (1000 * 60));

  if (minutes < minChargeMinutes) minutes = minChargeMinutes;

  const hours = Math.ceil(minutes / 60);
  const amount = hours * ratePerHour;

  return { minutes, hours, amount };
};

module.exports = { calculateAmount };
