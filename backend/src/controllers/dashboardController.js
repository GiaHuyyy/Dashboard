import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramSource from "../models/ProgramSource.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { getBusinessContractStatusOptions } from "../services/businessContractService.js";
import { getActiveCategoryNames } from "../utils/system-category.js";
import { getSystemSettingValue } from "../services/systemSettingService.js";
import { formatDateTime } from "../utils/date.js";
import { sendOk } from "../utils/httpResponse.js";

const COMPLETED_STATUS = "Đã hoàn thành";
const HANDED_OVER_STATUS = "Đã bàn giao";
const SENT_STATUS = "Đã gửi";
const DOWNLOADED_STATUS = "Đã tải";

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};


const getSlaState = (deadline, warningBeforeMs, now = new Date()) => {
  const date = toDate(deadline);
  if (!date) return null;

  const diff = date.getTime() - now.getTime();
  if (diff < 0) {
    return {
      status: "overdue",
      label: "Quá hạn",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-100",
      priority: 1,
    };
  }

  if (diff <= warningBeforeMs) {
    return {
      status: "warning",
      label: "Sắp đến hạn",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-100",
      priority: 2,
    };
  }

  return {
    status: "normal",
    label: "Bình thường",
    badgeClass: "bg-slate-50 text-slate-600 border-slate-100",
    priority: 3,
  };
};

const getProcessingAlertDescription = (sla) =>
  sla?.status === "overdue" ? "Đã quá hạn xử lý" : "Sắp đến hạn xử lý";


const makeAlert = ({ type, title, description, deadline, href, warningBeforeMs, now }) => {
  const sla = getSlaState(deadline, warningBeforeMs, now);
  if (!sla || sla.status === "normal") return null;

  return {
    type,
    title,
    description: typeof description === "function" ? description(sla) : description,
    href,
    deadline: toDate(deadline)?.toISOString() || "",
    deadlineLabel: formatDateTime(deadline, { includeSeconds: false }),
    status: sla.status,
    statusLabel: sla.label,
    badgeClass: sla.badgeClass,
    priority: sla.priority,
  };
};

const countByStatus = (alerts = []) => ({
  warning: alerts.filter((item) => item.status === "warning").length,
  overdue: alerts.filter((item) => item.status === "overdue").length,
});

const sortAlerts = (alerts = []) =>
  [...alerts].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

const getWarningBeforeHours = async () => {
  const value = await getSystemSettingValue("sla.warningBeforeDeadlineHours");
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 24;
};


const MONTH_LABELS = Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`);

const MONTHLY_STAT_TYPES = [
  { key: "program", label: "Lập trình", model: Program, dateFields: ["programCreatedAt", "createdAt"] },
  { key: "design", label: "Design", model: DesignTask, dateFields: ["createdAt"] },
  { key: "correction", label: "Chỉnh sửa", model: ProgramCorrection, dateFields: ["createdAt"] },
  { key: "upgrade", label: "Nâng cấp", model: ProgramUpgrade, dateFields: ["createdAt"] },
  { key: "source", label: "Source", model: ProgramSource, dateFields: ["createdAt"] },
];

const PROJECT_STATUS_KEYS = {
  "Chưa nhận": "notReceived",
  "Đã nhận": "received",
  "Đang làm": "doing",
  "Ưu tiên": "priority",
  "Hoãn": "paused",
};

const toProjectStatusKey = (status, index = 0) => PROJECT_STATUS_KEYS[status] || `status-${index + 1}`;

const DEFAULT_WORK_STATUS_OPTIONS = ["Mới tạo", "Đã phân công", "Đang xử lý", "Đã hoàn thành"];

const WORK_STATUS_KEYS = {
  "Mới tạo": "new",
  "Đã phân công": "assigned",
  "Đang xử lý": "processing",
  "Đã hoàn thành": "completed",
};

const toWorkStatusKey = (status, index = 0) => WORK_STATUS_KEYS[status] || `status-${index + 1}`;


const normalizeStatsMonth = (value) => {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null;
};

const normalizeOptionalStatsYear = (value) => {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  return normalizeStatsYear(value);
};

const buildCreatedAtMatchFilter = ({ month, year } = {}) => {
  const normalizedMonth = normalizeStatsMonth(month);
  const normalizedYear = normalizeOptionalStatsYear(year);

  if (!normalizedMonth && !normalizedYear) return null;

  if (normalizedMonth && normalizedYear) {
    return {
      createdAt: {
        $gte: new Date(normalizedYear, normalizedMonth - 1, 1),
        $lt: new Date(normalizedYear, normalizedMonth, 1),
      },
    };
  }

  if (normalizedYear) {
    return {
      createdAt: {
        $gte: new Date(normalizedYear, 0, 1),
        $lt: new Date(normalizedYear + 1, 0, 1),
      },
    };
  }

  return {
    $expr: { $eq: [{ $month: "$createdAt" }, normalizedMonth] },
  };
};

const appendProjectStatusHrefFilters = (status, { month, year } = {}) => {
  const params = new URLSearchParams();
  params.set("status", status);
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  return `/kinh-doanh/danh-sach?${params.toString()}`;
};

const appendWorkStatusHrefFilters = (basePath, status, { month, year } = {}) => {
  const params = new URLSearchParams();
  params.set("status", status);
  if (month) params.set("month", String(month));
  if (year) params.set("year", String(year));
  return `${basePath}?${params.toString()}`;
};

const getDashboardWorkStatusOptions = async () => {
  const statusOptions = await getActiveCategoryNames("status");
  return statusOptions.length > 0 ? statusOptions : DEFAULT_WORK_STATUS_OPTIONS;
};

const buildProgramWorkStatusSummaryByType = async ({ model, basePath, month, year } = {}) => {
  const normalizedMonth = normalizeStatsMonth(month);
  const normalizedYear = normalizeOptionalStatsYear(year);
  const statusOptions = await getDashboardWorkStatusOptions();
  const match = {
    isDeleted: false,
    status: { $in: statusOptions },
  };

  Object.assign(match, buildCreatedAtMatchFilter({ month: normalizedMonth, year: normalizedYear }) || {});

  const rows = await model.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countMap = rows.reduce((result, item) => {
    result[item._id] = Number(item.count || 0);
    return result;
  }, {});

  const items = statusOptions.map((status, index) => ({
    key: toWorkStatusKey(status, index),
    status,
    label: status,
    value: countMap[status] || 0,
    href: appendWorkStatusHrefFilters(basePath, status, { month: normalizedMonth, year: normalizedYear }),
  }));

  return {
    month: normalizedMonth || "all",
    year: normalizedYear || "all",
    total: items.reduce((sum, item) => sum + Number(item.value || 0), 0),
    items,
  };
};

const buildProgramWorkStatusSummary = async ({ month, year } = {}) => {
  const [correction, upgrade] = await Promise.all([
    buildProgramWorkStatusSummaryByType({
      model: ProgramCorrection,
      basePath: "/lap-trinh/chinh-sua",
      month,
      year,
    }),
    buildProgramWorkStatusSummaryByType({
      model: ProgramUpgrade,
      basePath: "/lap-trinh/nang-cap",
      month,
      year,
    }),
  ]);

  return {
    month: correction.month,
    year: correction.year,
    correction,
    upgrade,
  };
};

const buildContractProjectStatusSummary = async ({ month, year } = {}) => {
  const normalizedMonth = normalizeStatsMonth(month);
  const normalizedYear = normalizeOptionalStatsYear(year);
  const statusOptions = await getBusinessContractStatusOptions({ includeLegacy: false });
  const match = {
    isDeleted: false,
    status: { $in: statusOptions },
  };
  Object.assign(match, buildCreatedAtMatchFilter({ month: normalizedMonth, year: normalizedYear }) || {});

  const rows = await BusinessContract.aggregate([
    { $match: match },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const countMap = rows.reduce((result, item) => {
    result[item._id] = Number(item.count || 0);
    return result;
  }, {});

  const items = statusOptions.map((status, index) => ({
    key: toProjectStatusKey(status, index),
    status,
    label: status,
    value: countMap[status] || 0,
    href: appendProjectStatusHrefFilters(status, { month: normalizedMonth, year: normalizedYear }),
  }));

  return {
    month: normalizedMonth || "all",
    year: normalizedYear || "all",
    total: items.reduce((sum, item) => sum + Number(item.value || 0), 0),
    items,
  };
};

const normalizeStatsYear = (value, now = new Date()) => {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100) return parsed;
  return now.getFullYear();
};

const buildDateFallbackExpression = (dateFields = []) => {
  const fields = dateFields.length > 0 ? dateFields : ["createdAt"];
  return fields.slice(1).reduce((currentExpression, field) => ({ $ifNull: [currentExpression, `$${field}`] }), `$${fields[0]}`);
};

const getMonthlyCountMap = async ({ model, dateFields, year }) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year + 1, 0, 1);
  const dateExpression = buildDateFallbackExpression(dateFields);

  const rows = await model.aggregate([
    { $match: { isDeleted: false } },
    { $addFields: { dashboardStatsDate: dateExpression } },
    { $match: { dashboardStatsDate: { $gte: startDate, $lt: endDate } } },
    { $group: { _id: { $month: "$dashboardStatsDate" }, count: { $sum: 1 } } },
  ]);

  return rows.reduce((map, item) => {
    map[item._id] = item.count;
    return map;
  }, {});
};

const buildMonthlyStats = async ({ year }) => {
  const countMaps = await Promise.all(
    MONTHLY_STAT_TYPES.map(async (type) => ({
      ...type,
      countMap: await getMonthlyCountMap({ model: type.model, dateFields: type.dateFields, year }),
    })),
  );

  const items = MONTH_LABELS.map((label, index) => {
    const month = index + 1;
    const row = { month, label, total: 0 };

    countMaps.forEach((type) => {
      const count = Number(type.countMap[month] || 0);
      row[type.key] = count;
      row.total += count;
    });

    return row;
  });

  const totals = countMaps.reduce(
    (result, type) => {
      const count = Object.values(type.countMap).reduce((sum, value) => sum + Number(value || 0), 0);
      result[type.key] = count;
      result.total += count;
      return result;
    },
    { total: 0 },
  );

  return {
    year,
    types: MONTHLY_STAT_TYPES.map(({ key, label }) => ({ key, label })),
    totals,
    items,
  };
};

export const getDashboardMonthlyStats = async (req, res) => {
  const statsYear = normalizeStatsYear(req.query?.year);
  const monthlyStats = await buildMonthlyStats({ year: statsYear });
  return sendOk(res, { monthlyStats });
};

export const getDashboardProjectStatusSummary = async (req, res) => {
  const projectStatusSummary = await buildContractProjectStatusSummary({
    month: req.query?.month,
    year: req.query?.year,
  });
  return sendOk(res, { projectStatusSummary });
};

export const getDashboardProgramWorkStatusSummary = async (req, res) => {
  const programWorkStatusSummary = await buildProgramWorkStatusSummary({
    month: req.query?.month,
    year: req.query?.year,
  });
  return sendOk(res, { programWorkStatusSummary });
};

export const getDashboardSummary = async (req, res) => {
  const now = new Date();
  const statsYear = normalizeStatsYear(req.query?.year, now);
  const warningBeforeHours = await getWarningBeforeHours();
  const warningBeforeMs = warningBeforeHours * 60 * 60 * 1000;

  const [
    programs,
    corrections,
    upgrades,
    designs,
    sources,
    contracts,
    monthlyStats,
    projectStatusSummary,
    programWorkStatusSummary,
  ] = await Promise.all([
    Program.find({ isDeleted: false, processingStatus: { $ne: COMPLETED_STATUS } })
      .select("contractCode module processingStatus dueAt")
      .lean(),
    ProgramCorrection.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS } })
      .populate("programId", "contractCode module")
      .select("issueContent status dueAt programId")
      .lean(),
    ProgramUpgrade.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS } })
      .populate("programId", "contractCode module")
      .select("upgradeItem status dueAt programId")
      .lean(),
    DesignTask.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS } })
      .select("title status expectedDate deadline")
      .lean(),
    ProgramSource.find({
      isDeleted: false,
      sendStatus: SENT_STATUS,
      downloadStatus: { $ne: DOWNLOADED_STATUS },
    })
      .populate("programId", "contractCode module")
      .select("programId domain expiresAt sendStatus downloadStatus sourceLink")
      .lean(),
    BusinessContract.find({ isDeleted: false, handoverStatus: { $ne: HANDED_OVER_STATUS } })
      .select("contractCode contractName customerName handoverStatus expectedHandoverAt")
      .lean(),
    buildMonthlyStats({ year: statsYear }),
    buildContractProjectStatusSummary(),
    buildProgramWorkStatusSummary(),
  ]);

  const programAlerts = programs
    .map((item) =>
      makeAlert({
        type: "program",
        title: item.contractCode || item.module || "Phiếu lập trình",
        description: getProcessingAlertDescription,
        deadline: item.dueAt,
        href: `/lap-trinh/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const correctionAlerts = corrections
    .map((item) =>
      makeAlert({
        type: "correction",
        title: item.programId?.contractCode || item.issueContent || "Phiếu chỉnh sửa",
        description: item.issueContent || "Yêu cầu chỉnh sửa sắp đến hạn",
        deadline: item.dueAt,
        href: `/lap-trinh/quan-ly-chinh-sua/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const upgradeAlerts = upgrades
    .map((item) =>
      makeAlert({
        type: "upgrade",
        title: item.upgradeItem || item.programId?.contractCode || "Phiếu nâng cấp",
        description: getProcessingAlertDescription,
        deadline: item.dueAt,
        href: `/lap-trinh/nang-cap/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const designAlerts = designs
    .map((item) =>
      makeAlert({
        type: "design",
        title: item.title || "Công việc design",
        description: getProcessingAlertDescription,
        deadline: item.expectedDate || item.deadline,
        href: `/design/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const sourceAlerts = sources
    .map((item) =>
      makeAlert({
        type: "source",
        title: item.programId?.contractCode || item.domain || "Source",
        description: item.expiresAt && new Date(item.expiresAt).getTime() < now.getTime()
          ? "Link source đã hết hạn"
          : "Link source sắp hết hạn",
        deadline: item.expiresAt,
        href: `/he-thong/source/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const contractAlerts = contracts
    .map((item) =>
      makeAlert({
        type: "contract",
        title: item.contractCode || item.contractName || "Hợp đồng",
        description: `Hợp đồng chưa bàn giao${item.customerName ? ` - ${item.customerName}` : ""}`,
        deadline: item.expectedHandoverAt,
        href: `/kinh-doanh/chinh-sua/${item._id}`,
        warningBeforeMs,
        now,
      }),
    )
    .filter(Boolean);

  const allAlerts = sortAlerts([
    ...programAlerts,
    ...correctionAlerts,
    ...upgradeAlerts,
    ...designAlerts,
    ...sourceAlerts,
    ...contractAlerts,
  ]);

  const sourceStatus = countByStatus(sourceAlerts);
  const contractStatus = countByStatus(contractAlerts);

  return sendOk(res, {
    warningBeforeHours,
    monthlyStats,
    projectStatusSummary,
    programWorkStatusSummary,
    cards: {
      program: {
        label: "Lập trình đang xử lý",
        value: programs.length,
        href: "/lap-trinh/danh-sach",
        ...countByStatus(programAlerts),
      },
      correction: {
        label: "Chỉnh sửa đang xử lý",
        value: corrections.length,
        href: "/lap-trinh/chinh-sua",
        ...countByStatus(correctionAlerts),
      },
      upgrade: {
        label: "Nâng cấp đang xử lý",
        value: upgrades.length,
        href: "/lap-trinh/nang-cap",
        ...countByStatus(upgradeAlerts),
      },
      design: {
        label: "Design đang xử lý",
        value: designs.length,
        href: "/design/danh-sach",
        ...countByStatus(designAlerts),
      },
      source: {
        label: "Source hết hạn link",
        value: sourceStatus.overdue,
        href: "/he-thong/source",
        warning: sourceStatus.warning,
        overdue: sourceStatus.overdue,
      },
      contract: {
        label: "Hợp đồng chưa bàn giao",
        value: contracts.length,
        href: "/kinh-doanh/danh-sach",
        warning: contractStatus.warning,
        overdue: contractStatus.overdue,
      },
    },
    alerts: allAlerts.slice(0, 20),
    alertSummary: {
      warning: allAlerts.filter((item) => item.status === "warning").length,
      overdue: allAlerts.filter((item) => item.status === "overdue").length,
    },
  });
};
