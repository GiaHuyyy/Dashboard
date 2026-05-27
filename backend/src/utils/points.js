export const normalizePoint = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const roundPoint = (value, digits = 3) => Number(normalizePoint(value).toFixed(digits));
