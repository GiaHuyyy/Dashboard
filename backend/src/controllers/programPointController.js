import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeString } from "../utils/normalize.js";
import { normalizePoint, roundPoint } from "../utils/points.js";
import { sendOk } from "../utils/httpResponse.js";

const buildSearchText = (...values) => values.filter(Boolean).join(" ").toLowerCase();

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

const pushPointDetail = ({
  details,
  item,
  source,
  contractCode,
  module,
  description,
  status,
  assignee,
  point,
  bonusPoint,
  pointDate,
}) => {
  details.push({
    id: String(item._id),
    source,
    contractCode,
    module,
    description,
    status: status || "",
    assignee,
    point,
    bonusPoint,
    createdAt: pointDate || null,
    createdAtLabel: formatPointDate(pointDate),
  });
};

export const listProgramPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const keyword = normalizeString(search).toLowerCase();
  const normalizedMonth = normalizeFilterMonth(month);
  const normalizedYear = normalizeFilterYear(year);

  const [programs, upgrades, corrections] = await Promise.all([
    Program.find({
      isDeleted: false,
      $or: [{ type: "program" }, { type: { $exists: false } }],
    })
      .select("contractCode module bonusPoint processingStatus status programCreatedAt createdAt completedAt assignee")
      .lean(),
    ProgramUpgrade.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId upgradeItem status assignee bonusPoint completedAt createdAt")
      .lean(),
    ProgramCorrection.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId issueContent status assignee bonusPoint completedAt assignedAt createdAt")
      .lean(),
  ]);

  const details = [];
  const assigneeSet = new Set();

  programs.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    assigneeSet.add(ownerName);

    const pointDate = item.completedAt || null;
    if (!isPointDateMatched(pointDate, { month: normalizedMonth, year: normalizedYear })) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const description = item.module || "";
    const searchable = buildSearchText(item.contractCode, item.module, description);
    if (keyword && !searchable.includes(keyword)) return;

    const bonusPoint = normalizePoint(item.bonusPoint);
    pushPointDetail({
      details,
      item,
      source: "Lập trình",
      contractCode: item.contractCode,
      module: item.module,
      description,
      status: item.processingStatus || item.status,
      assignee: ownerName,
      point: bonusPoint,
      bonusPoint,
      pointDate,
    });
  });

  upgrades.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    assigneeSet.add(ownerName);

    const pointDate = item.completedAt || null;
    if (!isPointDateMatched(pointDate, { month: normalizedMonth, year: normalizedYear })) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const bonusPoint = normalizePoint(item.bonusPoint);
    const description = item.upgradeItem || "";
    const searchable = buildSearchText(contractCode, module, description);
    if (keyword && !searchable.includes(keyword)) return;

    pushPointDetail({
      details,
      item,
      source: "Nâng cấp",
      contractCode,
      module,
      description,
      status: item.status,
      assignee: ownerName,
      point: bonusPoint,
      bonusPoint,
      pointDate,
    });
  });

  corrections.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    assigneeSet.add(ownerName);

    const pointDate = item.completedAt || null;
    if (!isPointDateMatched(pointDate, { month: normalizedMonth, year: normalizedYear })) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const bonusPoint = normalizePoint(item.bonusPoint);
    const description = item.issueContent || "";
    const searchable = buildSearchText(contractCode, module, description);
    if (keyword && !searchable.includes(keyword)) return;

    pushPointDetail({
      details,
      item,
      source: "Chỉnh sửa",
      contractCode,
      module,
      description,
      status: item.status,
      assignee: ownerName,
      point: bonusPoint,
      bonusPoint,
      pointDate,
    });
  });

  const sortedDetails = details.sort((a, b) => getPointTimestamp(a.createdAt) - getPointTimestamp(b.createdAt));

  const summaryMap = new Map();
  const ensureSummary = (name) => {
    if (!summaryMap.has(name)) {
      summaryMap.set(name, {
        assignee: name,
        programPoint: 0,
        upgradePoint: 0,
        correctionPoint: 0,
        totalPoint: 0,
      });
    }

    return summaryMap.get(name);
  };

  sortedDetails.forEach((item) => {
    const summary = ensureSummary(item.assignee);

    if (item.source === "Lập trình") {
      summary.programPoint += item.point;
    } else if (item.source === "Nâng cấp") {
      summary.upgradePoint += item.point;
    } else if (item.source === "Chỉnh sửa") {
      summary.correctionPoint += item.point;
    }

    summary.totalPoint = roundPoint(summary.programPoint + summary.upgradePoint + summary.correctionPoint);
  });

  const owners = Array.from(summaryMap.values()).sort((a, b) => b.totalPoint - a.totalPoint);
  const totalProgramPoint = owners.reduce((sum, item) => sum + item.programPoint, 0);
  const totalUpgradePoint = owners.reduce((sum, item) => sum + item.upgradePoint, 0);
  const totalCorrectionPoint = owners.reduce((sum, item) => sum + item.correctionPoint, 0);

  return sendOk(res, {
    summary: {
      totalProgramPoint: roundPoint(totalProgramPoint),
      totalUpgradePoint: roundPoint(totalUpgradePoint),
      totalCorrectionPoint: roundPoint(totalCorrectionPoint),
      totalPoint: roundPoint(totalProgramPoint + totalUpgradePoint + totalCorrectionPoint),
    },
    owners,
    details: sortedDetails.map((item) => ({
      ...item,
      point: roundPoint(item.point),
      bonusPoint: item.bonusPoint !== undefined ? roundPoint(item.bonusPoint) : undefined,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};
