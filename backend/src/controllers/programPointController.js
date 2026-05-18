import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const parsePoint = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return parsed;
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

export const listProgramPoints = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "" } = req.query;
  const normalizedAssignee = normalizeString(assignee);
  const keyword = normalizeString(search).toLowerCase();

  const monthNum = month !== "all" ? parsePositiveInteger(month) : null;
  const yearNum = year !== "all" ? parsePositiveInteger(year) : null;
  const startDate = monthNum || yearNum ? new Date(yearNum || 1970, monthNum ? monthNum - 1 : 0, 1, 0, 0, 0, 0) : null;
  const endDate = monthNum || yearNum ? new Date(yearNum || 3000, monthNum ? monthNum : 12, 1, 0, 0, 0, 0) : null;

  const [programs, upgrades, corrections] = await Promise.all([
    Program.find({
      isDeleted: false,
      $or: [{ type: "program" }, { type: { $exists: false } }],
    })
      .populate({ path: "createdBy", select: "name userName" })
      .select("contractCode module time convert status programCreatedAt createdAt createdBy")
      .lean(),
    ProgramUpgrade.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId upgradeItem status assignee bonusPoint createdAt")
      .lean(),
    ProgramCorrection.find({ isDeleted: false })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId issueContent status assignee assignedAt createdAt")
      .lean(),
  ]);

  const details = [];
  const assigneeSet = new Set();

  programs.forEach((item) => {
    const ownerName = item.createdBy?.name || item.createdBy?.userName || "Không xác định";
    const createdAt = item.programCreatedAt || item.createdAt;
    if (!inRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;
    const description = `${item.module} - ${item.time} - Quy đổi ${item.convert}`;
    const searchable = `${item.contractCode} ${item.module} ${description}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;
    assigneeSet.add(ownerName);
    details.push({
      id: String(item._id),
      source: "Lập trình",
      contractCode: item.contractCode,
      module: item.module,
      description,
      status: item.status || "",
      assignee: ownerName,
      point: parsePoint(item.convert),
      createdAt,
      createdAtLabel: formatDateTime(createdAt),
    });
  });

  upgrades.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    const createdAt = item.createdAt;
    if (!inRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;
    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const description = item.upgradeItem || "";
    const searchable = `${contractCode} ${module} ${description}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;
    assigneeSet.add(ownerName);
    details.push({
      id: String(item._id),
      source: "Nâng cấp",
      contractCode,
      module,
      description,
      status: item.status || "",
      assignee: ownerName,
      point: parsePoint(item.bonusPoint),
      createdAt,
      createdAtLabel: formatDateTime(createdAt),
    });
  });

  corrections.forEach((item) => {
    const ownerName = item.assignee || "Không xác định";
    const createdAt = item.assignedAt || item.createdAt;
    if (!inRange(createdAt, startDate, endDate)) return;
    if (normalizedAssignee !== "all" && ownerName !== normalizedAssignee) return;
    const contractCode = item.programId?.contractCode || "";
    const module = item.programId?.module || "";
    const description = item.issueContent || "";
    const searchable = `${contractCode} ${module} ${description}`.toLowerCase();
    if (keyword && !searchable.includes(keyword)) return;
    assigneeSet.add(ownerName);
    details.push({
      id: String(item._id),
      source: "Chỉnh sửa",
      contractCode,
      module,
      description,
      status: item.status || "",
      assignee: ownerName,
      point: 0,
      createdAt,
      createdAtLabel: formatDateTime(createdAt),
    });
  });

  const sortedDetails = details.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const summaryMap = new Map();
  const ensureSummary = (name) => {
    if (!summaryMap.has(name)) {
      summaryMap.set(name, {
        assignee: name,
        programPoint: 0,
        upgradePoint: 0,
        correctionCount: 0,
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
      summary.correctionCount += 1;
    }
    summary.totalPoint = Number((summary.programPoint + summary.upgradePoint).toFixed(3));
  });

  const owners = Array.from(summaryMap.values()).sort((a, b) => b.totalPoint - a.totalPoint);
  const totalProgramPoint = owners.reduce((sum, item) => sum + item.programPoint, 0);
  const totalUpgradePoint = owners.reduce((sum, item) => sum + item.upgradePoint, 0);
  const totalCorrectionCount = owners.reduce((sum, item) => sum + item.correctionCount, 0);

  return res.json({
    summary: {
      totalProgramPoint: Number(totalProgramPoint.toFixed(3)),
      totalUpgradePoint: Number(totalUpgradePoint.toFixed(3)),
      totalPoint: Number((totalProgramPoint + totalUpgradePoint).toFixed(3)),
      totalCorrectionCount,
    },
    owners,
    details: sortedDetails.map((item) => ({
      ...item,
      point: Number(item.point.toFixed(3)),
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : item.createdAt,
    })),
    assigneeOptions: Array.from(assigneeSet).sort((a, b) => a.localeCompare(b)),
  });
};
