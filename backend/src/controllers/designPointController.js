import DesignTask from "../models/DesignTask.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeString } from "../utils/normalize.js";
import { roundPoint } from "../utils/points.js";
import { sendOk } from "../utils/httpResponse.js";

const normalizeFilterMonth = (value) => {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
};

const normalizeFilterYear = (value) => {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100 ? parsed : null;
};

const isPointDateMatched = (value, { month, year } = {}) => {
  if (!month && !year) return true;
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  if (month && date.getMonth() + 1 !== month) return false;
  if (year && date.getFullYear() !== year) return false;

  return true;
};

const formatPointDate = (value) => (value ? formatDateTime(value, { includeSeconds: false }) : "-");

const getPointTimestamp = (value) => {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? Number.MAX_SAFE_INTEGER : date.getTime();
};

export const listDesignPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const keyword = normalizeString(search).toLowerCase();
  const normalizedMonth = normalizeFilterMonth(month);
  const normalizedYear = normalizeFilterYear(year);

  const tasks = await DesignTask.find({ isDeleted: false }).sort({ createdAt: 1 }).lean();

  const details = [];
  const assigneeSet = new Set();

  tasks.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    assigneeSet.add(ownerName);

    const pointDate = item.completedDate || item.completedAt || null;
    if (!isPointDateMatched(pointDate, { month: normalizedMonth, year: normalizedYear })) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const searchable =
      `${item.title} ${item.designType} ${ownerName} ${item.assigner} ${item.note || ""}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;

    const bonusPoint = roundPoint(item.bonusPoint || 0);
    details.push({
      id: String(item._id),
      title: item.title,
      designType: item.designType,
      priority: item.priority,
      status: item.status,
      assigner: item.assigner,
      assignee: ownerName,
      bonusPoint,
      totalPoint: bonusPoint,
      createdAt: pointDate || null,
      createdAtLabel: formatPointDate(pointDate),
    });
  });

  const sortedDetails = details.sort((a, b) => getPointTimestamp(a.createdAt) - getPointTimestamp(b.createdAt));

  const summaryMap = new Map();
  sortedDetails.forEach((item) => {
    if (!summaryMap.has(item.assignee)) {
      summaryMap.set(item.assignee, {
        assignee: item.assignee,
        bonusPoint: 0,
        totalPoint: 0,
      });
    }

    const summary = summaryMap.get(item.assignee);
    summary.bonusPoint += item.bonusPoint;
    summary.totalPoint = roundPoint(summary.bonusPoint);
  });

  const owners = Array.from(summaryMap.values()).sort((a, b) => b.totalPoint - a.totalPoint);
  const totalBonusPoint = owners.reduce((sum, item) => sum + item.bonusPoint, 0);

  return sendOk(res, {
    summary: {
      totalBonusPoint: roundPoint(totalBonusPoint),
      totalPoint: roundPoint(totalBonusPoint),
    },
    owners,
    details: sortedDetails.map((item) => ({
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};
