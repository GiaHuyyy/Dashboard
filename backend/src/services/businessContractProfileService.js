import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramSource from "../models/ProgramSource.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import { normalizeContractImages, toBusinessContractResponseItem } from "./businessContractService.js";
import { toDesignTaskResponseItem } from "./designTaskService.js";
import { toProgramCorrectionResponseItem } from "./programCorrectionService.js";
import { toProgramDetailItem } from "./programTaskService.js";
import { toProgramUpgradeResponseItem } from "./programUpgradeService.js";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundPoint = (value) => Number(toNumber(value).toFixed(3));

const getId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

const formatProfileSourceItem = (doc) => ({
  id: doc._id,
  programId: doc.programId?._id || doc.programId,
  contractCode: doc.programId?.contractCode || "",
  module: doc.programId?.module || "",
  domain: doc.domain || "",
  sourceLink: doc.sourceLink || "",
  sendStatus: doc.sendStatus || "Chưa gửi",
  sentAt: toIsoString(doc.sentAt),
  sentAtLabel: formatDateTime(doc.sentAt, { includeSeconds: false }),
  expiresAt: toIsoString(doc.expiresAt),
  expiresAtLabel: formatDateTime(doc.expiresAt, { includeSeconds: false }),
  downloadStatus: doc.downloadStatus || "Chưa tải",
  downloadedAt: toIsoString(doc.downloadedAt),
  downloadedAtLabel: formatDateTime(doc.downloadedAt, { includeSeconds: false }),
  downloadCount: Number(doc.downloadCount || 0),
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatDateTime(doc.createdAt, { includeSeconds: false }),
});

const buildTimeline = ({ contract, designs, programs, corrections, upgrades, sources }) => {
  const events = [];

  const pushEvent = ({ date, title, description = "", type = "info" }) => {
    if (!date) return;
    const time = new Date(date);
    if (Number.isNaN(time.getTime())) return;

    events.push({
      date: toIsoString(time),
      dateLabel: formatDateTime(time, { includeSeconds: false }),
      title,
      description,
      type,
      timestamp: time.getTime(),
    });
  };

  pushEvent({
    date: contract.createdAt,
    title: "Tạo hợp đồng",
    description: `${contract.contractCode || ""} - ${contract.contractName || ""}`.trim(),
    type: "contract",
  });

  pushEvent({
    date: contract.expectedHandoverAt,
    title: "Dự kiến bàn giao",
    description: contract.handoverStatus || "",
    type: "deadline",
  });

  pushEvent({
    date: contract.handoverAt,
    title: "Bàn giao hợp đồng",
    description: contract.handoverStatus || "",
    type: "contract",
  });

  designs.forEach((item) => {
    pushEvent({
      date: item.createdAt,
      title: "Tạo phiếu design",
      description: `${item.title || ""} - ${item.assignee || ""}`.trim(),
      type: "design",
    });
    pushEvent({
      date: item.completedDate,
      title: "Hoàn thành design",
      description: item.title || "",
      type: "design",
    });
  });

  programs.forEach((item) => {
    pushEvent({
      date: item.assignedAt,
      title: "Tạo phiếu lập trình",
      description: `${item.contractCode || ""} - ${item.module || ""} - ${item.assignee || ""}`.trim(),
      type: "program",
    });
    pushEvent({
      date: item.completedAt,
      title: "Hoàn thành lập trình",
      description: `${item.contractCode || ""} - ${item.module || ""}`.trim(),
      type: "program",
    });
  });

  corrections.forEach((item) => {
    pushEvent({
      date: item.assignedAt,
      title: "Tạo yêu cầu chỉnh sửa",
      description: `${item.contractCode || ""} - ${item.issueContent || ""}`.trim(),
      type: "correction",
    });
    pushEvent({
      date: item.completedAt,
      title: "Hoàn thành chỉnh sửa",
      description: item.issueContent || "",
      type: "correction",
    });
  });

  upgrades.forEach((item) => {
    pushEvent({
      date: item.assignedAt || item.createdAt,
      title: "Tạo yêu cầu nâng cấp",
      description: `${item.contractCode || ""} - ${item.upgradeItem || ""}`.trim(),
      type: "upgrade",
    });
    pushEvent({
      date: item.completedAt,
      title: "Hoàn thành nâng cấp",
      description: item.upgradeItem || "",
      type: "upgrade",
    });
  });

  sources.forEach((item) => {
    pushEvent({
      date: item.createdAt,
      title: "Tạo source",
      description: `${item.contractCode || ""} - ${item.domain || ""}`.trim(),
      type: "source",
    });
    pushEvent({
      date: item.sentAt,
      title: "Gửi source",
      description: item.domain || "",
      type: "source",
    });
    pushEvent({
      date: item.expiresAt,
      title: "Hết hạn link source",
      description: item.domain || "",
      type: "deadline",
    });
  });

  return events.sort((a, b) => a.timestamp - b.timestamp).map(({ timestamp, ...item }) => item);
};

const buildStaffPointSummary = ({ designs, programs, corrections, upgrades }) => {
  const staffMap = new Map();

  const ensureStaff = (name) => {
    const key = name || "Chưa phân công";
    if (!staffMap.has(key)) {
      staffMap.set(key, {
        name: key,
        designPoint: 0,
        programPoint: 0,
        correctionPoint: 0,
        upgradePoint: 0,
        totalPoint: 0,
      });
    }
    return staffMap.get(key);
  };

  designs.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.designPoint += toNumber(item.totalPoint);
  });

  programs.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.programPoint += toNumber(item.convert) + toNumber(item.bonusPoint);
  });

  corrections.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.correctionPoint += toNumber(item.convert) + toNumber(item.bonusPoint);
  });

  upgrades.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.upgradePoint += toNumber(item.convert) + toNumber(item.bonusPoint);
  });

  return Array.from(staffMap.values())
    .map((item) => ({
      ...item,
      designPoint: roundPoint(item.designPoint),
      programPoint: roundPoint(item.programPoint),
      correctionPoint: roundPoint(item.correctionPoint),
      upgradePoint: roundPoint(item.upgradePoint),
      totalPoint: roundPoint(item.designPoint + item.programPoint + item.correctionPoint + item.upgradePoint),
    }))
    .sort((a, b) => b.totalPoint - a.totalPoint || a.name.localeCompare(b.name, "vi"));
};

export const buildBusinessContractProfile = async (contract) => {
  const contractId = getId(contract._id || contract.id);
  const programsRaw = await Program.find({
    businessContractId: contractId,
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  })
    .sort({ programCreatedAt: 1, createdAt: 1 })
    .lean();

  const programIds = programsRaw.map((item) => item._id);
  const designTaskIds = [
    ...new Set(programsRaw.map((item) => getId(item.designTaskId)).filter(Boolean)),
  ];

  const [designsRaw, correctionsRaw, upgradesRaw, sourcesRaw] = await Promise.all([
    designTaskIds.length > 0
      ? DesignTask.find({ _id: { $in: designTaskIds }, isDeleted: false }).sort({ createdAt: 1 }).lean()
      : [],
    programIds.length > 0
      ? ProgramCorrection.find({ programId: { $in: programIds }, isDeleted: false })
          .sort({ assignedAt: 1, createdAt: 1 })
          .populate({ path: "programId", select: "contractCode module" })
          .lean()
      : [],
    programIds.length > 0
      ? ProgramUpgrade.find({ programId: { $in: programIds }, isDeleted: false })
          .sort({ createdAt: 1 })
          .populate({ path: "programId", select: "contractCode module" })
          .lean()
      : [],
    programIds.length > 0
      ? ProgramSource.find({ programId: { $in: programIds }, isDeleted: false })
          .sort({ createdAt: 1 })
          .populate({ path: "programId", select: "contractCode module" })
          .lean()
      : [],
  ]);

  const contractItem = toBusinessContractResponseItem(contract);
  const designs = designsRaw.map(toDesignTaskResponseItem);
  const programs = programsRaw.map(toProgramDetailItem);
  const corrections = correctionsRaw.map(toProgramCorrectionResponseItem);
  const upgrades = upgradesRaw.map(toProgramUpgradeResponseItem);
  const sources = sourcesRaw.map(formatProfileSourceItem);

  const summary = {
    designCount: designs.length,
    programCount: programs.length,
    correctionCount: corrections.length,
    upgradeCount: upgrades.length,
    sourceCount: sources.length,
    contractImageCount: normalizeContractImages(contract.contractImages).length,
    designPoint: roundPoint(designs.reduce((total, item) => total + toNumber(item.totalPoint), 0)),
    programPoint: roundPoint(programs.reduce((total, item) => total + toNumber(item.convert) + toNumber(item.bonusPoint), 0)),
    correctionPoint: roundPoint(corrections.reduce((total, item) => total + toNumber(item.convert) + toNumber(item.bonusPoint), 0)),
    upgradePoint: roundPoint(upgrades.reduce((total, item) => total + toNumber(item.convert) + toNumber(item.bonusPoint), 0)),
  };

  summary.totalPoint = roundPoint(
    summary.designPoint + summary.programPoint + summary.correctionPoint + summary.upgradePoint,
  );

  return {
    contract: contractItem,
    summary,
    designs,
    programs,
    corrections,
    upgrades,
    sources,
    staffPoints: buildStaffPointSummary({ designs, programs, corrections, upgrades }),
    timeline: buildTimeline({ contract, designs, programs, corrections, upgrades, sources }),
  };
};
