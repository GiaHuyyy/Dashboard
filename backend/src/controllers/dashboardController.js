import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import ProgramSource from "../models/ProgramSource.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { getSystemSettingValue } from "../services/systemSettingService.js";

const COMPLETED_STATUS = "Đã hoàn thành";
const HANDED_OVER_STATUS = "Đã bàn giao";
const SENT_STATUS = "Đã gửi";
const DOWNLOADED_STATUS = "Đã tải";

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

const makeAlert = ({ type, title, description, deadline, href, warningBeforeMs, now }) => {
  const sla = getSlaState(deadline, warningBeforeMs, now);
  if (!sla || sla.status === "normal") return null;

  return {
    type,
    title,
    description,
    href,
    deadline: toDate(deadline)?.toISOString() || "",
    deadlineLabel: formatDateTime(deadline),
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

export const getDashboardSummary = async (req, res) => {
  const now = new Date();
  const warningBeforeHours = await getWarningBeforeHours();
  const warningBeforeMs = warningBeforeHours * 60 * 60 * 1000;

  const [programs, corrections, upgrades, designs, sources, contracts] = await Promise.all([
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
  ]);

  const programAlerts = programs
    .map((item) =>
      makeAlert({
        type: "program",
        title: item.contractCode || item.module || "Phiếu lập trình",
        description: "Đã quá hạn xử lý",
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
        description: "Đã quá hạn xử lý",
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
        description: "Đã quá hạn xử lý",
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

  return res.json({
    warningBeforeHours,
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
