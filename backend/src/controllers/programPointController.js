import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { buildMonthYearDateRange, formatDateTime, isDateInRange } from "../utils/date.js";
import { normalizeString } from "../utils/normalize.js";
import { normalizePoint, roundPoint } from "../utils/points.js";
import { sendOk } from "../utils/httpResponse.js";

const buildSearchText = (...values) => values.filter(Boolean).join(" ").toLowerCase();

const pushPointDetail = ({
  details,
  assigneeSet,
  item,
  source,
  contractCode,
  module,
  description,
  status,
  assignee,
  createdAt,
  point,
  convertPoint,
  bonusPoint,
}) => {
  assigneeSet.add(assignee);
  details.push({
    id: String(item._id),
    source,
    contractCode,
    module,
    description,
    status: status || "",
    assignee,
    point,
    convertPoint,
    bonusPoint,
    createdAt,
    createdAtLabel: formatDateTime(createdAt, { includeSeconds: false }),
  });
};

export const listProgramPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const keyword = normalizeString(search).toLowerCase();
  const { startDate, endDate } = buildMonthYearDateRange({ month, year });

  const [programs, upgrades, corrections] = await Promise.all([
    Program.find({
      isDeleted: false,
      $or: [{ type: "program" }, { type: { $exists: false } }],
    })
      .select("contractCode module time convert bonusPoint status programCreatedAt createdAt assignee")
      .lean(),
    ProgramUpgrade.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId upgradeItem time convert status assignee bonusPoint createdAt")
      .lean(),
    ProgramCorrection.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId issueContent time convert status assignee bonusPoint assignedAt createdAt")
      .lean(),
  ]);

  const details = [];
  const assigneeSet = new Set();

  programs.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    const createdAt = item.programCreatedAt || item.createdAt;
    if (!isDateInRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const description = `${item.module} - ${item.time} - Quy đổi ${item.convert}`;
    const searchable = buildSearchText(item.contractCode, item.module, description);
    if (keyword && !searchable.includes(keyword)) return;

    const convertPoint = normalizePoint(item.convert);
    const bonusPoint = normalizePoint(item.bonusPoint);
    pushPointDetail({
      details,
      assigneeSet,
      item,
      source: "Lập trình",
      contractCode: item.contractCode,
      module: item.module,
      description,
      status: item.status,
      assignee: ownerName,
      point: convertPoint + bonusPoint,
      convertPoint,
      bonusPoint,
      createdAt,
    });
  });

  upgrades.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    const createdAt = item.createdAt;
    if (!isDateInRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const convertPoint = normalizePoint(item.convert);
    const bonusPoint = normalizePoint(item.bonusPoint);
    const descriptionParts = [item.upgradeItem || ""];
    if (item.time) descriptionParts.push(item.time);
    if (item.convert !== undefined && item.convert !== null && item.convert !== "") descriptionParts.push(`Quy đổi ${item.convert}`);
    const description = descriptionParts.filter(Boolean).join(" - ");
    const searchable = buildSearchText(contractCode, module, description);
    if (keyword && !searchable.includes(keyword)) return;

    pushPointDetail({
      details,
      assigneeSet,
      item,
      source: "Nâng cấp",
      contractCode,
      module,
      description,
      status: item.status,
      assignee: ownerName,
      point: convertPoint + bonusPoint,
      convertPoint,
      bonusPoint,
      createdAt,
    });
  });

  corrections.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    const createdAt = item.assignedAt || item.createdAt;
    if (!isDateInRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;

    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const convertPoint = normalizePoint(item.convert);
    const bonusPoint = normalizePoint(item.bonusPoint);
    const descriptionParts = [item.issueContent || ""];
    if (item.time) descriptionParts.push(item.time);
    if (item.convert !== undefined && item.convert !== null && item.convert !== "") descriptionParts.push(`Quy đổi ${item.convert}`);
    const description = descriptionParts.filter(Boolean).join(" - ");
    const searchable = buildSearchText(contractCode, module, description);
    if (keyword && !searchable.includes(keyword)) return;

    pushPointDetail({
      details,
      assigneeSet,
      item,
      source: "Chỉnh sửa",
      contractCode,
      module,
      description,
      status: item.status,
      assignee: ownerName,
      point: convertPoint + bonusPoint,
      convertPoint,
      bonusPoint,
      createdAt,
    });
  });

  const sortedDetails = details.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

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
      convertPoint: item.convertPoint !== undefined ? roundPoint(item.convertPoint) : undefined,
      bonusPoint: item.bonusPoint !== undefined ? roundPoint(item.bonusPoint) : undefined,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};