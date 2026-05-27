import { parsePositiveInteger } from "./normalize.js";

export const formatDateTime = (value, { includeSeconds = true } = {}) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (!includeSeconds) {
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

export const buildMonthYearDateRange = ({ month = "all", year = "all" } = {}) => {
  const monthNum = month !== "all" ? parsePositiveInteger(month) : null;
  const yearNum = year !== "all" ? parsePositiveInteger(year) : null;

  if (!monthNum && !yearNum) {
    return {
      startDate: null,
      endDate: null,
    };
  }

  return {
    startDate: new Date(yearNum || 1970, monthNum ? monthNum - 1 : 0, 1, 0, 0, 0, 0),
    endDate: new Date(yearNum || 3000, monthNum ? monthNum : 12, 1, 0, 0, 0, 0),
  };
};

export const isDateInRange = (dateValue, startDate, endDate) => {
  if (!startDate || !endDate) return true;

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  return date >= startDate && date < endDate;
};
