import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramSource from "../models/ProgramSource.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { getSystemSettingValue } from "../services/systemSettingService.js";

const COMPLETED_STATUS = "Đã hoàn thành";
const HANDED_OVER_STATUS = "Đã bàn giao";

const toDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value) => {
  const date = toDate(value);
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const toIsoString = (value) => {
  const date = toDate(value);
  return date ? date.toISOString() : "";
};

const getTaskAlertStatus = (dateValue, now, warningDate) => {
  const date = toDate(dateValue);
  if (!date) return null;
  if (date < now) return "overdue";
  if (date <= warningDate) return "upcoming";
  return null;
};

const pushTaskAlerts = ({ rows, alerts, type, titleKey, dateKey, pathPrefix, now, warningDate }) => {
  rows.forEach((item) => {
    const status = getTaskAlertStatus(item[dateKey], now, warningDate);
    if (!status) return;
    alerts.push({
      id: String(item._id),
      type,
      status,
      title: item[titleKey] || item.contractCode || item.module || "Không có tiêu đề",
      description: status === "overdue" ? "Đã quá hạn xử lý" : "Sắp đến hạn xử lý",
      date: toIsoString(item[dateKey]),
      dateLabel: formatDateTime(item[dateKey]),
      path: `${pathPrefix}/${item._id}`,
    });
  });
};

const countTaskStatus = async ({ model, statusField, dueField }) => {
  const now = new Date();
  return Promise.all([
    model.countDocuments({ isDeleted: false, [statusField]: { $ne: COMPLETED_STATUS } }),
    model.countDocuments({ isDeleted: false, [statusField]: { $ne: COMPLETED_STATUS }, [dueField]: { $ne: null, $lt: now } }),
  ]);
};

export const getDashboardSummary = async (req, res) => {
  const warningBeforeDeadlineHours = Number(await getSystemSettingValue("sla.warningBeforeDeadlineHours"));
  const safeWarningHours = Number.isFinite(warningBeforeDeadlineHours) ? warningBeforeDeadlineHours : 24;
  const now = new Date();
  const warningDate = new Date(now.getTime() + safeWarningHours * 60 * 60 * 1000);

  const [
    [programActiveCount, programOverdueCount],
    [correctionActiveCount, correctionOverdueCount],
    [upgradeActiveCount, upgradeOverdueCount],
    [designActiveCount, designOverdueCount],
    sourceExpiredCount,
    sourceExpiringSoonCount,
    contractPendingHandoverCount,
  ] = await Promise.all([
    countTaskStatus({ model: Program, statusField: "processingStatus", dueField: "dueAt" }),
    countTaskStatus({ model: ProgramCorrection, statusField: "status", dueField: "dueAt" }),
    countTaskStatus({ model: ProgramUpgrade, statusField: "status", dueField: "dueAt" }),
    countTaskStatus({ model: DesignTask, statusField: "status", dueField: "expectedDate" }),
    ProgramSource.countDocuments({ isDeleted: false, expiresAt: { $lt: now } }),
    ProgramSource.countDocuments({ isDeleted: false, expiresAt: { $gte: now, $lte: warningDate } }),
    BusinessContract.countDocuments({ isDeleted: false, handoverStatus: { $ne: HANDED_OVER_STATUS } }),
  ]);

  const [programRows, correctionRows, upgradeRows, designRows, sourceRows, contractRows] = await Promise.all([
    Program.find({ isDeleted: false, processingStatus: { $ne: COMPLETED_STATUS }, dueAt: { $lte: warningDate } })
      .select("module contractCode dueAt processingStatus")
      .sort({ dueAt: 1 })
      .limit(8)
      .lean(),
    ProgramCorrection.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS }, dueAt: { $lte: warningDate } })
      .select("issueContent dueAt status")
      .sort({ dueAt: 1 })
      .limit(8)
      .lean(),
    ProgramUpgrade.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS }, dueAt: { $lte: warningDate } })
      .select("upgradeItem dueAt status")
      .sort({ dueAt: 1 })
      .limit(8)
      .lean(),
    DesignTask.find({ isDeleted: false, status: { $ne: COMPLETED_STATUS }, expectedDate: { $lte: warningDate } })
      .select("title expectedDate status")
      .sort({ expectedDate: 1 })
      .limit(8)
      .lean(),
    ProgramSource.find({ isDeleted: false, expiresAt: { $lte: warningDate } })
      .populate({ path: "programId", select: "contractCode module" })
      .select("programId domain expiresAt sendStatus downloadStatus")
      .sort({ expiresAt: 1 })
      .limit(8)
      .lean(),
    BusinessContract.find({ isDeleted: false, handoverStatus: { $ne: HANDED_OVER_STATUS } })
      .select("contractCode contractName customerName handoverStatus createdAt")
      .sort({ createdAt: 1 })
      .limit(8)
      .lean(),
  ]);

  const alerts = [];
  pushTaskAlerts({
    rows: programRows,
    alerts,
    type: "program",
    titleKey: "contractCode",
    dateKey: "dueAt",
    pathPrefix: "/lap-trinh/chinh-sua",
    now,
    warningDate,
  });
  pushTaskAlerts({
    rows: correctionRows,
    alerts,
    type: "correction",
    titleKey: "issueContent",
    dateKey: "dueAt",
    pathPrefix: "/lap-trinh/quan-ly-chinh-sua/chinh-sua",
    now,
    warningDate,
  });
  pushTaskAlerts({
    rows: upgradeRows,
    alerts,
    type: "upgrade",
    titleKey: "upgradeItem",
    dateKey: "dueAt",
    pathPrefix: "/lap-trinh/nang-cap/chinh-sua",
    now,
    warningDate,
  });
  pushTaskAlerts({
    rows: designRows,
    alerts,
    type: "design",
    titleKey: "title",
    dateKey: "expectedDate",
    pathPrefix: "/design/chinh-sua",
    now,
    warningDate,
  });

  sourceRows.forEach((item) => {
    const status = getTaskAlertStatus(item.expiresAt, now, warningDate);
    if (!status) return;
    alerts.push({
      id: String(item._id),
      type: "source",
      status,
      title: item.programId?.contractCode || item.domain || "Source",
      description: status === "overdue" ? "Link source đã hết hạn" : "Link source sắp hết hạn",
      date: toIsoString(item.expiresAt),
      dateLabel: formatDateTime(item.expiresAt),
      path: `/he-thong/source/chinh-sua/${item._id}`,
    });
  });

  contractRows.forEach((item) => {
    alerts.push({
      id: String(item._id),
      type: "contract",
      status: "pending",
      title: item.contractCode || item.contractName,
      description: `Hợp đồng chưa bàn giao${item.customerName ? ` - ${item.customerName}` : ""}`,
      date: toIsoString(item.createdAt),
      dateLabel: formatDateTime(item.createdAt),
      path: `/kinh-doanh/chinh-sua/${item._id}`,
    });
  });

  const sortedAlerts = alerts
    .sort((a, b) => {
      const rank = { overdue: 0, upcoming: 1, pending: 2 };
      const rankDiff = (rank[a.status] ?? 99) - (rank[b.status] ?? 99);
      if (rankDiff !== 0) return rankDiff;
      return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
    })
    .slice(0, 12);

  return res.json({
    warningBeforeDeadlineHours: safeWarningHours,
    summaryCards: [
      {
        key: "programActive",
        label: "Lập trình đang xử lý",
        value: programActiveCount,
        dangerValue: programOverdueCount,
        path: "/lap-trinh/danh-sach",
      },
      {
        key: "correctionActive",
        label: "Chỉnh sửa đang xử lý",
        value: correctionActiveCount,
        dangerValue: correctionOverdueCount,
        path: "/lap-trinh/chinh-sua",
      },
      {
        key: "upgradeActive",
        label: "Nâng cấp đang xử lý",
        value: upgradeActiveCount,
        dangerValue: upgradeOverdueCount,
        path: "/lap-trinh/nang-cap",
      },
      {
        key: "designActive",
        label: "Design đang xử lý",
        value: designActiveCount,
        dangerValue: designOverdueCount,
        path: "/design/danh-sach",
      },
      {
        key: "sourceExpired",
        label: "Source hết hạn link",
        value: sourceExpiredCount,
        subValue: `${sourceExpiringSoonCount} sắp hết hạn`,
        path: "/he-thong/source",
      },
      {
        key: "contractPendingHandover",
        label: "Hợp đồng chưa bàn giao",
        value: contractPendingHandoverCount,
        path: "/kinh-doanh/danh-sach",
      },
    ],
    alerts: sortedAlerts,
  });
};
