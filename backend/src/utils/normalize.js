import mongoose from "mongoose";

export const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

export const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }

  return null;
};

export const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  return normalizeString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const normalizeObjectId = (value) => {
  const normalized = normalizeString(value);
  if (!normalized) return null;

  return mongoose.isValidObjectId(normalized) ? normalized : null;
};

export const normalizeDate = (value) => {
  if (value === null || value === undefined || value === "") return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
