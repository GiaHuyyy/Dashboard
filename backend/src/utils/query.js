import { normalizeString } from "./normalize.js";

export const escapeRegex = (value = "") => normalizeString(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const isValidHttpUrl = (value, { required = false } = {}) => {
  const normalized = normalizeString(value);
  if (!normalized) return !required;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

export const buildSearchOrFilter = (search, fields = []) => {
  const normalized = normalizeString(search);
  if (!normalized || fields.length === 0) return {};

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: normalized, $options: "i" },
    })),
  };
};
