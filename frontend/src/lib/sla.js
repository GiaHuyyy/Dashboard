const toDateTimeLocalValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const normalizeDays = (value, fallbackDays) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return fallbackDays;
};

export const buildDueAtFromDays = (days, baseDate = new Date()) => {
  const date = new Date(baseDate);
  const parsedDays = Number(days);

  if (!Number.isFinite(parsedDays)) return toDateTimeLocalValue(date);

  date.setDate(date.getDate() + parsedDays);
  return toDateTimeLocalValue(date);
};

export const getSlaDueAt = (settings, settingKey, fallbackDays) => {
  const days = normalizeDays(settings?.sla?.[settingKey], fallbackDays);
  return buildDueAtFromDays(days);
};
