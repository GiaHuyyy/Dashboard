import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramSource from "../models/ProgramSource.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import DomainPrice from "../models/DomainPrice.js";
import HostPrice from "../models/HostPrice.js";
import SslPrice from "../models/SslPrice.js";
import PackagePrice from "../models/PackagePrice.js";
import AdministrationPrice from "../models/AdministrationPrice.js";
import AdvertisingPrice from "../models/AdvertisingPrice.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import { normalizeContractImages, toBusinessContractResponseItem } from "./businessContractService.js";
import { toDesignTaskResponseItem } from "./designTaskService.js";
import { toProgramCorrectionResponseItem } from "./programCorrectionService.js";
import { toProgramDetailItem } from "./programTaskService.js";
import { toProgramUpgradeResponseItem } from "./programUpgradeService.js";
import { getSystemSettingsObject } from "./systemSettingService.js";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundPoint = (value) => Number(toNumber(value).toFixed(3));

const getId = (value) => {
  if (!value) return "";
  return String(value._id || value);
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

const formatPointNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "0";
  return Number(parsed.toFixed(3)).toString();
};

const formatConvertDuration = (convertValue, workingHoursPerDay = 8) => {
  const convert = toNumber(convertValue);
  const hoursPerDay = Number(workingHoursPerDay) || 8;
  if (!Number.isFinite(convert) || convert <= 0 || !Number.isFinite(hoursPerDay) || hoursPerDay <= 0) return "";

  const totalHours = convert * hoursPerDay;
  let days = Math.floor(totalHours / hoursPerDay);
  let hours = Number((totalHours - days * hoursPerDay).toFixed(3));

  if (hours >= hoursPerDay) {
    days += 1;
    hours = 0;
  }

  const parts = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${formatPointNumber(hours)}h`);
  return parts.join(" ") || "0h";
};



const getDateTime = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const formatElapsedDuration = (totalMs) => {
  if (!Number.isFinite(totalMs) || totalMs <= 0) return "";

  const totalMinutes = Math.max(1, Math.round(totalMs / (60 * 1000)));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
  const minutes = totalMinutes - days * 24 * 60 - hours * 60;

  const parts = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (days === 0 && minutes > 0) parts.push(`${minutes} phút`);

  return parts.join(" ") || "0 phút";
};

const sumElapsedDuration = (items = [], getStart, getEnd) =>
  items.reduce((total, item) => {
    const startTime = getDateTime(getStart(item));
    const endTime = getDateTime(getEnd(item));
    if (!startTime || !endTime || endTime < startTime) return total;
    return total + (endTime - startTime);
  }, 0);


const joinParts = (parts = []) => parts.filter(Boolean).join(" - ");

const createPriceReference = ({ type, label, amount = 0, amountLabel = "", description = "" }) => ({
  type,
  label: label || "",
  amount: toNumber(amount),
  amountLabel: amountLabel || formatCurrency(amount),
  description,
});

const getSourcePriceReferences = ({ source, priceReferences = {} }) => {
  const references = [];

  if (source.domain) {
    const domainPrice = priceReferences.domainPrice;
    if (domainPrice) {
      references.push(
        createPriceReference({
          type: "Domain",
          label: joinParts([`${domainPrice.extension || source.domain} ${domainPrice.provider || ""}`.trim()]),
          amount: domainPrice.registerPrice,
          amountLabel: formatCurrency(domainPrice.registerPrice),
          description: joinParts([
            domainPrice.registerPrice !== undefined ? `Đăng ký: ${formatCurrency(domainPrice.registerPrice)}` : "",
            domainPrice.renewalPrice !== undefined ? `Gia hạn: ${formatCurrency(domainPrice.renewalPrice)}` : "",
            domainPrice.transferPrice !== undefined ? `Chuyển: ${formatCurrency(domainPrice.transferPrice)}` : "",
          ]),
        }),
      );
    } else {
      references.push(createPriceReference({ type: "Domain", label: source.domain, description: "Chưa khớp bảng giá domain" }));
    }
  }

  const hostPrice = priceReferences.hostPrice;
  if (hostPrice) {
    references.push(
      createPriceReference({
        type: "Host",
        label: joinParts([hostPrice.name, hostPrice.storage]),
        amount: hostPrice.yearlyPrice1,
        amountLabel: formatCurrency(hostPrice.yearlyPrice1),
        description: joinParts([
          hostPrice.monthlyPrice !== undefined ? `Tháng: ${formatCurrency(hostPrice.monthlyPrice)}` : "",
          hostPrice.yearlyPrice1 !== undefined ? `1 năm: ${formatCurrency(hostPrice.yearlyPrice1)}` : "",
          hostPrice.yearlyPrice2 !== undefined ? `2 năm: ${formatCurrency(hostPrice.yearlyPrice2)}` : "",
          hostPrice.yearlyPrice3 !== undefined ? `3 năm: ${formatCurrency(hostPrice.yearlyPrice3)}` : "",
        ]),
      }),
    );
  }

  const sslPrice = priceReferences.sslPrice;
  if (sslPrice) {
    references.push(
      createPriceReference({
        type: "SSL",
        label: joinParts([sslPrice.name, sslPrice.sslType, sslPrice.validityMonths ? `${sslPrice.validityMonths} tháng` : ""]),
        amount: sslPrice.price,
        amountLabel: formatCurrency(sslPrice.price),
        description: sslPrice.warrantyAmount ? `Bảo hành: ${formatCurrency(sslPrice.warrantyAmount)}` : "",
      }),
    );
  }

  const packagePrice = priceReferences.packagePrice;
  if (packagePrice) {
    references.push(
      createPriceReference({
        type: "Trọn gói",
        label: packagePrice.name || "Gói trọn gói",
        amount: packagePrice.yearlyPrice,
        amountLabel: formatCurrency(packagePrice.yearlyPrice),
        description: joinParts([
          packagePrice.monthlyPrice !== undefined ? `Tháng: ${formatCurrency(packagePrice.monthlyPrice)}` : "",
          packagePrice.yearlyPrice !== undefined ? `Năm: ${formatCurrency(packagePrice.yearlyPrice)}` : "",
        ]),
      }),
    );
  }

  const administrationPrice = priceReferences.administrationPrice;
  if (administrationPrice) {
    references.push(
      createPriceReference({
        type: "Quản trị",
        label: joinParts([administrationPrice.serviceName, administrationPrice.scope, administrationPrice.frequency]),
        amount: administrationPrice.price,
        amountLabel: formatCurrency(administrationPrice.price),
        description: administrationPrice.slaHours ? `SLA: ${administrationPrice.slaHours} giờ` : "",
      }),
    );
  }

  const advertisingPrice = priceReferences.advertisingPrice;
  if (advertisingPrice) {
    const setupFee = toNumber(advertisingPrice.setupFee);
    const minimumBudget = toNumber(advertisingPrice.minimumBudget);
    references.push(
      createPriceReference({
        type: "Quảng cáo",
        label: joinParts([advertisingPrice.platform, advertisingPrice.packageName]),
        amount: setupFee + minimumBudget,
        amountLabel: formatCurrency(setupFee + minimumBudget),
        description: joinParts([
          advertisingPrice.minimumBudget !== undefined ? `Ngân sách tối thiểu: ${formatCurrency(advertisingPrice.minimumBudget)}` : "",
          advertisingPrice.setupFee !== undefined ? `Phí setup: ${formatCurrency(advertisingPrice.setupFee)}` : "",
          advertisingPrice.serviceFeePercent !== undefined ? `Phí dịch vụ: ${advertisingPrice.serviceFeePercent}%` : "",
        ]),
      }),
    );
  }

  return references;
};

const formatSourcePriceReferencesLabel = (references = []) =>
  references
    .map((item) => joinParts([item.type, item.label, item.description]))
    .filter(Boolean)
    .join("\n");

const formatProfileSourceItem = (doc) => {
  const priceReferences = getSourcePriceReferences({
    source: doc,
    priceReferences: {
      domainPrice: doc.domainPrice,
      hostPrice: doc.hostPriceId,
      sslPrice: doc.sslPriceId,
      packagePrice: doc.packagePriceId,
      administrationPrice: doc.administrationPriceId,
      advertisingPrice: doc.advertisingPriceId,
    },
  });
  const priceTotal = roundPoint(priceReferences.reduce((total, item) => total + toNumber(item.amount), 0));

  return {
    id: doc._id,
    programId: doc.programId?._id || doc.programId,
    contractCode: doc.programId?.contractCode || "",
    module: doc.programId?.module || "",
    domain: doc.domain || "",
    sourceLink: doc.sourceLink || "",
    priceReferences,
    priceReferencesLabel: formatSourcePriceReferencesLabel(priceReferences),
    priceTotal,
    priceTotalLabel: formatCurrency(priceTotal),
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
  };
};

const buildTimeline = ({ contract, designs, programs, corrections, upgrades, sources }) => {
  const events = [];

  const pushEvent = ({ date, title, description = "", type = "info", pinned = false }) => {
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
      pinned,
      pinnedBottom: title.startsWith("Bàn giao hợp đồng"),
    });
  };

  const pushPlannedAwareEvent = ({ actualDate, plannedDate, title, description = "", type = "info" }) => {
    const isPlanned = !actualDate && Boolean(plannedDate);
    pushEvent({
      date: actualDate || plannedDate,
      title: isPlanned ? `${title} (Dự kiến)` : title,
      description,
      type,
    });
  };

  pushEvent({
    date: contract.receivedAt || contract.createdAt,
    title: "Tạo hợp đồng",
    description: `${contract.contractCode || ""} - ${contract.contractName || ""}`.trim(),
    type: "contract",
    pinned: true,
  });

  designs.forEach((item) => {
    pushEvent({
      date: item.handoverDate || item.receiveDate || item.createdAt,
      title: "Tạo phiếu design",
      description: `${item.title || ""} - ${item.assignee || ""}`.trim(),
      type: "design",
    });
    pushPlannedAwareEvent({
      actualDate: item.completedDate,
      plannedDate: item.expectedDate || item.deadline,
      title: "Hoàn thành design",
      description: item.title || "",
      type: "design",
    });
  });

  programs.forEach((item) => {
    pushEvent({
      date: item.assignedAt || item.receivedAt || item.createdAt,
      title: "Tạo phiếu lập trình",
      description: `${item.contractCode || ""} - ${item.module || ""} - ${item.assignee || ""}`.trim(),
      type: "program",
    });
    pushPlannedAwareEvent({
      actualDate: item.completedAt,
      plannedDate: item.dueAt,
      title: "Hoàn thành lập trình",
      description: `${item.contractCode || ""} - ${item.module || ""}`.trim(),
      type: "program",
    });
  });

  corrections.forEach((item) => {
    pushEvent({
      date: item.assignedAt || item.receivedAt || item.createdAt,
      title: "Tạo yêu cầu chỉnh sửa",
      description: `${item.contractCode || ""} - ${item.issueContent || ""}`.trim(),
      type: "correction",
    });
    pushPlannedAwareEvent({
      actualDate: item.completedAt,
      plannedDate: item.dueAt,
      title: "Hoàn thành chỉnh sửa",
      description: item.issueContent || "",
      type: "correction",
    });
  });

  upgrades.forEach((item) => {
    pushEvent({
      date: item.assignedAt || item.receivedAt || item.createdAt,
      title: "Tạo yêu cầu nâng cấp",
      description: `${item.contractCode || ""} - ${item.upgradeItem || ""}`.trim(),
      type: "upgrade",
    });
    pushPlannedAwareEvent({
      actualDate: item.completedAt,
      plannedDate: item.dueAt,
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
  });

  pushPlannedAwareEvent({
    actualDate: contract.handoverAt,
    plannedDate: contract.expectedHandoverAt,
    title: "Bàn giao hợp đồng",
    description: contract.handoverStatus || "",
    type: "contract",
  });

  return events
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      if (a.pinnedBottom && !b.pinnedBottom) return 1;
      if (!a.pinnedBottom && b.pinnedBottom) return -1;
      return a.timestamp - b.timestamp;
    })
    .map(({ timestamp, pinned, pinnedBottom, ...item }) => item);
};


const buildStaffPointSummary = ({ designs, programs, corrections, upgrades, workingHoursPerDay = 8 }) => {
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
        totalConvert: 0,
      });
    }
    return staffMap.get(key);
  };

  designs.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.designPoint += toNumber(item.bonusPoint);
  });

  programs.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.programPoint += toNumber(item.bonusPoint);
  });

  corrections.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.correctionPoint += toNumber(item.bonusPoint);
  });

  upgrades.forEach((item) => {
    const summary = ensureStaff(item.assignee);
    summary.upgradePoint += toNumber(item.bonusPoint);
  });

  return Array.from(staffMap.values())
    .map((item) => {
      const totalConvert = roundPoint(item.totalConvert);
      const totalPoint = roundPoint(item.designPoint + item.programPoint + item.correctionPoint + item.upgradePoint);
      return {
        ...item,
        designPoint: roundPoint(item.designPoint),
        programPoint: roundPoint(item.programPoint),
        correctionPoint: roundPoint(item.correctionPoint),
        upgradePoint: roundPoint(item.upgradePoint),
        totalPoint,
        totalConvert,
        totalDurationLabel: "",
      };
    })
    .sort((a, b) => b.totalPoint - a.totalPoint || a.name.localeCompare(b.name, "vi"));
};

export const buildBusinessContractProfile = async (contract) => {
  const contractId = getId(contract._id || contract.id);
  const settings = await getSystemSettingsObject();
  const workingHoursPerDay = Number(settings?.time?.workingHoursPerDay || 8);
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
          .populate({ path: "createdBy", select: "name userName" })
          .populate({ path: "hostPriceId", select: "name storage monthlyPrice yearlyPrice1 yearlyPrice2 yearlyPrice3" })
          .populate({ path: "sslPriceId", select: "name sslType validityMonths warrantyAmount price" })
          .populate({ path: "packagePriceId", select: "name monthlyPrice yearlyPrice" })
          .populate({ path: "administrationPriceId", select: "serviceName scope frequency price slaHours" })
          .populate({ path: "advertisingPriceId", select: "platform packageName minimumBudget setupFee serviceFeePercent" })
          .lean()
      : [],
  ]);

  const sourceDomains = [...new Set(sourcesRaw.map((item) => item.domain).filter(Boolean))];
  const domainPrices =
    sourceDomains.length > 0
      ? await DomainPrice.find({ extension: { $in: sourceDomains }, isDeleted: false })
          .select("extension provider registerPrice renewalPrice transferPrice")
          .lean()
      : [];
  const domainPriceMap = new Map(domainPrices.map((item) => [String(item.extension || "").toLowerCase(), item]));
  sourcesRaw.forEach((item) => {
    item.domainPrice = domainPriceMap.get(String(item.domain || "").toLowerCase()) || null;
  });

  const contractItem = toBusinessContractResponseItem(contract);
  const designs = designsRaw.map((item) => {
    const responseItem = toDesignTaskResponseItem(item);
    return {
      ...responseItem,
      createdAt: toIsoString(item.createdAt),
      createdAtLabel: formatDateTime(item.createdAt, { includeSeconds: false }),
    };
  });
  const programs = programsRaw.map((item) => {
    const responseItem = toProgramDetailItem(item);
    return {
      ...responseItem,
      createdAt: toIsoString(item.createdAt),
      createdAtLabel: formatDateTime(item.createdAt, { includeSeconds: false }),
      assignedAtLabel: formatDateTime(item.assignedAt, { includeSeconds: false }),
      receivedAtLabel: formatDateTime(item.receivedAt, { includeSeconds: false }),
      dueAtLabel: formatDateTime(item.dueAt, { includeSeconds: false }),
      completedAtLabel: formatDateTime(item.completedAt, { includeSeconds: false }),
    };
  });
  const corrections = correctionsRaw.map((item) => {
    const responseItem = toProgramCorrectionResponseItem(item);
    return {
      ...responseItem,
      assignedAtLabel: formatDateTime(item.assignedAt, { includeSeconds: false }),
      receivedAtLabel: formatDateTime(item.receivedAt, { includeSeconds: false }),
      dueAtLabel: formatDateTime(item.dueAt, { includeSeconds: false }),
      completedAtLabel: formatDateTime(item.completedAt, { includeSeconds: false }),
      createdAt: toIsoString(item.createdAt),
      createdAtLabel: formatDateTime(item.createdAt, { includeSeconds: false }),
    };
  });
  const upgrades = upgradesRaw.map((item) => {
    const responseItem = toProgramUpgradeResponseItem(item);
    return {
      ...responseItem,
      assignedAtLabel: formatDateTime(item.assignedAt, { includeSeconds: false }),
      receivedAtLabel: formatDateTime(item.receivedAt, { includeSeconds: false }),
      dueAtLabel: formatDateTime(item.dueAt, { includeSeconds: false }),
      completedAtLabel: formatDateTime(item.completedAt, { includeSeconds: false }),
      createdAt: toIsoString(item.createdAt),
      createdAtLabel: formatDateTime(item.createdAt, { includeSeconds: false }),
    };
  });
  const sources = sourcesRaw.map(formatProfileSourceItem);

  const summary = {
    designCount: designs.length,
    programCount: programs.length,
    correctionCount: corrections.length,
    upgradeCount: upgrades.length,
    sourceCount: sources.length,
    sourcePriceTotal: roundPoint(sources.reduce((total, item) => total + toNumber(item.priceTotal), 0)),
    contractValue: toNumber(contractItem.contractValue),
    totalContractValue: roundPoint(toNumber(contractItem.contractValue) + sources.reduce((total, item) => total + toNumber(item.priceTotal), 0)),
    contractImageCount: normalizeContractImages(contract.contractImages).length,
    designPoint: roundPoint(designs.reduce((total, item) => total + toNumber(item.bonusPoint), 0)),
    programPoint: roundPoint(programs.reduce((total, item) => total + toNumber(item.bonusPoint), 0)),
    correctionPoint: roundPoint(corrections.reduce((total, item) => total + toNumber(item.bonusPoint), 0)),
    upgradePoint: roundPoint(upgrades.reduce((total, item) => total + toNumber(item.bonusPoint), 0)),
  };

  summary.mainWorkDurationLabel = formatElapsedDuration(
    sumElapsedDuration(
      designs,
      (item) => item.receiveDate || item.handoverDate || item.createdAt,
      (item) => item.completedDate || item.expectedDate || item.deadline || item.receiveDate || item.handoverDate || item.createdAt,
    ) +
      sumElapsedDuration(
        programs,
        (item) => item.receivedAt || item.assignedAt || item.createdAt,
        (item) => item.completedAt || item.dueAt || item.receivedAt || item.assignedAt || item.createdAt,
      ),
  );
  summary.extraWorkDurationLabel = formatElapsedDuration(
    sumElapsedDuration(
      corrections,
      (item) => item.receivedAt || item.assignedAt || item.createdAt,
      (item) => item.completedAt || item.dueAt || item.receivedAt || item.assignedAt || item.createdAt,
    ) +
      sumElapsedDuration(
        upgrades,
        (item) => item.receivedAt || item.assignedAt || item.createdAt,
        (item) => item.completedAt || item.dueAt || item.receivedAt || item.assignedAt || item.createdAt,
      ),
  );

  summary.totalPoint = roundPoint(
    summary.designPoint + summary.programPoint + summary.correctionPoint + summary.upgradePoint,
  );
  summary.totalConvert = 0;
  summary.totalDurationLabel = "";

  return {
    contract: contractItem,
    summary,
    designs,
    programs,
    corrections,
    upgrades,
    sources,
    staffPoints: buildStaffPointSummary({ designs, programs, corrections, upgrades, workingHoursPerDay }),
    timeline: buildTimeline({ contract, designs, programs, corrections, upgrades, sources }),
  };
};
