import DesignTask from "../models/DesignTask.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const inRange = (dateValue, startDate, endDate) => {
  if (!startDate || !endDate) return true;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;
  return date >= startDate && date < endDate;
};

export const listDesignPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "", status = "all" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const normalizedStatus = normalizeString(status);
  const keyword = normalizeString(search).toLowerCase();

  const monthNum = month !== "all" ? parsePositiveInteger(month) : null;
  const yearNum = year !== "all" ? parsePositiveInteger(year) : null;
  const startDate = monthNum || yearNum ? new Date(yearNum || 1970, monthNum ? monthNum - 1 : 0, 1, 0, 0, 0, 0) : null;
  const endDate = monthNum || yearNum ? new Date(yearNum || 3000, monthNum ? monthNum : 12, 1, 0, 0, 0, 0) : null;

  const filters = { isDeleted: false };
  if (normalizedStatus !== "all") filters.status = normalizedStatus;
  const tasks = await DesignTask.find(filters).sort({ createdAt: 1 }).lean();

  const details = [];
  const assigneeSet = new Set();
  tasks.forEach((item) => {
    if (!inRange(item.createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && item.assignee !== normalizedAssignee) return;
    const searchable =
      `${item.title} ${item.designType} ${item.assignee} ${item.assigner} ${item.note || ""}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;

    const convertPoint = Number(item.convert || 0);
    const bonusPoint = Number(item.bonusPoint || 0);
    assigneeSet.add(item.assignee);
    details.push({
      id: String(item._id),
      title: item.title,
      designType: item.designType,
      priority: item.priority,
      status: item.status,
      assigner: item.assigner,
      assignee: item.assignee,
      convertPoint,
      bonusPoint,
      totalPoint: Number((convertPoint + bonusPoint).toFixed(3)),
      createdAt: item.createdAt,
      createdAtLabel: formatDateTime(item.createdAt),
    });
  });

  const summaryMap = new Map();
  details.forEach((item) => {
    if (!summaryMap.has(item.assignee)) {
      summaryMap.set(item.assignee, {
        assignee: item.assignee,
        convertPoint: 0,
        bonusPoint: 0,
        totalPoint: 0,
      });
    }
    const summary = summaryMap.get(item.assignee);
    summary.convertPoint += item.convertPoint;
    summary.bonusPoint += item.bonusPoint;
    summary.totalPoint = Number((summary.convertPoint + summary.bonusPoint).toFixed(3));
  });

  const owners = Array.from(summaryMap.values()).sort((a, b) => b.totalPoint - a.totalPoint);
  const totalConvertPoint = owners.reduce((sum, item) => sum + item.convertPoint, 0);
  const totalBonusPoint = owners.reduce((sum, item) => sum + item.bonusPoint, 0);

  return res.json({
    summary: {
      totalConvertPoint: Number(totalConvertPoint.toFixed(3)),
      totalBonusPoint: Number(totalBonusPoint.toFixed(3)),
      totalPoint: Number((totalConvertPoint + totalBonusPoint).toFixed(3)),
    },
    owners,
    details: details.map((item) => ({
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};
