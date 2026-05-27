import DesignTask from "../models/DesignTask.js";
import { buildMonthYearDateRange, formatDateTime, isDateInRange } from "../utils/date.js";
import { normalizeString } from "../utils/normalize.js";
import { roundPoint } from "../utils/points.js";
import { sendOk } from "../utils/httpResponse.js";

export const listDesignPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "", status = "all" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const normalizedStatus = normalizeString(status);
  const keyword = normalizeString(search).toLowerCase();
  const { startDate, endDate } = buildMonthYearDateRange({ month, year });

  const filters = { isDeleted: false };
  if (normalizedStatus !== "all") filters.status = normalizedStatus;
  const tasks = await DesignTask.find(filters).sort({ createdAt: 1 }).lean();

  const details = [];
  const assigneeSet = new Set();

  tasks.forEach((item) => {
    if (!isDateInRange(item.createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && item.assignee !== normalizedAssignee) return;

    const searchable =
      `${item.title} ${item.designType} ${item.assignee} ${item.assigner} ${item.note || ""}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;

    const convertPoint = roundPoint(item.convert || 0);
    const bonusPoint = roundPoint(item.bonusPoint || 0);
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
      totalPoint: roundPoint(convertPoint + bonusPoint),
      createdAt: item.createdAt,
      createdAtLabel: formatDateTime(item.createdAt, { includeSeconds: false }),
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
    summary.totalPoint = roundPoint(summary.convertPoint + summary.bonusPoint);
  });

  const owners = Array.from(summaryMap.values()).sort((a, b) => b.totalPoint - a.totalPoint);
  const totalConvertPoint = owners.reduce((sum, item) => sum + item.convertPoint, 0);
  const totalBonusPoint = owners.reduce((sum, item) => sum + item.bonusPoint, 0);

  return sendOk(res, {
    summary: {
      totalConvertPoint: roundPoint(totalConvertPoint),
      totalBonusPoint: roundPoint(totalBonusPoint),
      totalPoint: roundPoint(totalConvertPoint + totalBonusPoint),
    },
    owners,
    details: details.map((item) => ({
      ...item,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};
