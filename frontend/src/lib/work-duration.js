const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDuration = (diffMs) => {
  if (!Number.isFinite(diffMs) || diffMs < 0) return "-";

  const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return hours > 0 ? `${days} ngày ${hours} giờ` : `${days} ngày`;
  }
  if (hours > 0) {
    return minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  }
  return `${minutes} phút`;
};

export const getWorkDurationLabel = ({ startAt, receivedAt, assignedAt, handoverDate, receiveDate, endAt, completedAt, completedDate, dueAt, expectedDate } = {}) => {
  const startDate =
    toValidDate(startAt) ||
    toValidDate(receivedAt) ||
    toValidDate(receiveDate) ||
    toValidDate(assignedAt) ||
    toValidDate(handoverDate);
  const endDate =
    toValidDate(endAt) ||
    toValidDate(completedAt) ||
    toValidDate(completedDate) ||
    toValidDate(dueAt) ||
    toValidDate(expectedDate);

  if (!startDate || !endDate) return "-";
  return formatDuration(endDate.getTime() - startDate.getTime());
};
