export const DEFAULT_CONVERT_SETTINGS = {
  workingHoursPerDay: 8,
  roundingDigits: 3,
};

export const getConvertSettings = (settings = {}) => ({
  workingHoursPerDay: Number(settings?.time?.workingHoursPerDay || DEFAULT_CONVERT_SETTINGS.workingHoursPerDay),
  roundingDigits: Number(settings?.time?.roundingDigits ?? DEFAULT_CONVERT_SETTINGS.roundingDigits),
});

export const formatConvertNumber = (value, roundingDigits = DEFAULT_CONVERT_SETTINGS.roundingDigits) => {
  const parsed = Number(value);
  const digits = Number(roundingDigits);
  if (!Number.isFinite(parsed)) return "";
  const safeDigits = Number.isFinite(digits) ? Math.min(Math.max(Math.trunc(digits), 0), 6) : 3;
  return Number(parsed.toFixed(safeDigits)).toString();
};

export const calculateConvertByDuration = (durationValue, durationUnit, settings = DEFAULT_CONVERT_SETTINGS) => {
  const numeric = Number(durationValue);
  const workingHoursPerDay = Number(settings?.workingHoursPerDay || DEFAULT_CONVERT_SETTINGS.workingHoursPerDay);
  const roundingDigits = Number(settings?.roundingDigits ?? DEFAULT_CONVERT_SETTINGS.roundingDigits);

  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  if (durationUnit === "ngày") return formatConvertNumber(numeric, roundingDigits);
  if (durationUnit === "h") {
    if (!Number.isFinite(workingHoursPerDay) || workingHoursPerDay <= 0) return "";
    return formatConvertNumber(numeric / workingHoursPerDay, roundingDigits);
  }

  return "";
};
