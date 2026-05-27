import Program from "../models/Program.js";
import { getSystemSettingsObject } from "./systemSettingService.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import {
  normalizeBoolean,
  normalizeDate,
  normalizeNumber,
  normalizeObjectId,
  normalizeString,
} from "../utils/normalize.js";
import { getActiveCategoryNames } from "../utils/system-category.js";

export const PROGRAM_UPGRADE_COMPLETED_STATUS = "Đã hoàn thành";
export const PROGRAM_UPGRADE_DURATION_UNITS = ["h", "ngày"];

export const normalizeProgramUpgradeStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return PROGRAM_UPGRADE_COMPLETED_STATUS;
  if (normalized === "Tạm dừng") return "Đang xử lý";
  if (normalized === "Đã nhận") return "Đã phân công";
  if (!Array.isArray(statusOptions) || statusOptions.length === 0) return normalized;
  return statusOptions.includes(normalized) ? normalized : statusOptions[0];
};

const formatNumber = (value, roundingDigits = 3) => {
  if (!Number.isFinite(value)) return "";
  const safeDigits = Number.isFinite(Number(roundingDigits))
    ? Math.min(Math.max(Math.trunc(Number(roundingDigits)), 0), 6)
    : 3;
  return Number(value.toFixed(safeDigits)).toString();
};

const getProgramUpgradeConvertSettings = async () => {
  const settings = await getSystemSettingsObject();
  return settings?.time || {};
};

const calculateProgramUpgradeConvertByDuration = (durationValue, durationUnit, convertSettings = {}) => {
  const workingHoursPerDay = Number(convertSettings.workingHoursPerDay || 8);
  const roundingDigits = Number(convertSettings.roundingDigits ?? 3);

  if (!Number.isFinite(durationValue) || durationValue <= 0) return "";
  if (durationUnit === "ngày") return formatNumber(durationValue, roundingDigits);
  if (durationUnit === "h") {
    if (!Number.isFinite(workingHoursPerDay) || workingHoursPerDay <= 0) return "";
    return formatNumber(durationValue / workingHoursPerDay, roundingDigits);
  }
  return "";
};

export const normalizeProgramUpgradePayload = (body = {}) => ({
  programId: normalizeString(body.programId),
  upgradeItem: normalizeString(body.upgradeItem),
  priority: normalizeString(body.priority),
  durationValue: normalizeNumber(body.durationValue),
  durationUnit: normalizeString(body.durationUnit),
  bonusPoint: normalizeNumber(body.bonusPoint),
  status: normalizeString(body.status),
  assigner: normalizeString(body.assigner),
  assignee: normalizeString(body.assignee),
  assignedAt: body.assignedAt ? normalizeDate(body.assignedAt) : null,
  receivedAt: body.receivedAt ? normalizeDate(body.receivedAt) : null,
  dueAt: body.dueAt ? normalizeDate(body.dueAt) : null,
  completedAt: body.completedAt ? normalizeDate(body.completedAt) : null,
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

export const validateProgramUpgradePayload = async (payload) => {
  const [priorityOptions, statusOptions] = await Promise.all([
    getActiveCategoryNames("priority"),
    getActiveCategoryNames("status"),
  ]);

  if (priorityOptions.length === 0) {
    return { status: 400, message: "Danh mục ưu tiên chưa được cấu hình" };
  }
  if (statusOptions.length === 0) {
    return { status: 400, message: "Danh mục trạng thái chưa được cấu hình" };
  }

  payload.status = normalizeProgramUpgradeStatus(payload.status, statusOptions);
  if (!payload.programId) {
    return { status: 400, message: "programId là bắt buộc" };
  }
  if (!normalizeObjectId(payload.programId)) {
    return { status: 400, message: "programId không hợp lệ" };
  }

  const program = await Program.findOne({
    _id: payload.programId,
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  })
    .select("contractCode module")
    .lean();
  if (!program) {
    return { status: 404, message: "Không tìm thấy phiếu gốc hợp lệ" };
  }

  if (!payload.upgradeItem) {
    return { status: 400, message: "upgradeItem là bắt buộc" };
  }
  if (payload.durationValue === null || payload.durationValue <= 0) {
    return { status: 400, message: "durationValue phải lớn hơn 0" };
  }
  if (!PROGRAM_UPGRADE_DURATION_UNITS.includes(payload.durationUnit)) {
    return {
      status: 400,
      message: `durationUnit không hợp lệ. Giá trị cho phép: ${PROGRAM_UPGRADE_DURATION_UNITS.join(", ")}`,
    };
  }
  if (!payload.assigner) {
    return { status: 400, message: "assigner là bắt buộc" };
  }
  if (!payload.assignee) {
    return { status: 400, message: "assignee là bắt buộc" };
  }
  if (!payload.assignedAt) {
    return { status: 400, message: "assignedAt là bắt buộc" };
  }
  if (!payload.dueAt) {
    return { status: 400, message: "dueAt là bắt buộc" };
  }
  if (payload.bonusPoint === null || payload.bonusPoint < 0) {
    return { status: 400, message: "bonusPoint không hợp lệ" };
  }
  if (!priorityOptions.includes(payload.priority)) {
    return { status: 400, message: `priority không hợp lệ. Giá trị cho phép: ${priorityOptions.join(", ")}` };
  }
  if (!statusOptions.includes(payload.status)) {
    return { status: 400, message: `status không hợp lệ. Giá trị cho phép: ${statusOptions.join(", ")}` };
  }
  if (payload.visible === null) {
    return { status: 400, message: "visible phải là kiểu boolean" };
  }

  const convertSettings = await getProgramUpgradeConvertSettings();

  return {
    program,
    time: `${formatNumber(payload.durationValue, convertSettings.roundingDigits)} ${payload.durationUnit}`,
    convert: calculateProgramUpgradeConvertByDuration(payload.durationValue, payload.durationUnit, convertSettings),
  };
};

export const normalizeProgramUpgradeCreatePayload = (body = {}) => {
  const payload = normalizeProgramUpgradePayload(body);
  return payload.status === PROGRAM_UPGRADE_COMPLETED_STATUS ? payload : { ...payload, completedAt: null };
};

export const mergeProgramUpgradePayload = (input, existing, rawBody = {}) => {
  const mergedPayload = {
    programId: input.programId || String(existing.programId),
    upgradeItem: input.upgradeItem || existing.upgradeItem,
    priority: input.priority || existing.priority,
    durationValue: input.durationValue === null ? existing.durationValue : input.durationValue,
    durationUnit: input.durationUnit || existing.durationUnit,
    bonusPoint: input.bonusPoint === null ? existing.bonusPoint : input.bonusPoint,
    status: input.status || existing.status,
    assigner: input.assigner || existing.assigner,
    assignee: input.assignee || existing.assignee,
    assignedAt: rawBody.assignedAt === null ? null : input.assignedAt || existing.assignedAt,
    receivedAt: rawBody.receivedAt === null ? null : input.receivedAt || existing.receivedAt,
    dueAt: rawBody.dueAt === null ? null : input.dueAt || existing.dueAt,
    completedAt: rawBody.completedAt === null ? null : input.completedAt || existing.completedAt,
    visible: input.visible === null ? existing.visible : input.visible,
    note: typeof rawBody.note === "string" ? input.note : existing.note,
  };

  if (mergedPayload.status !== PROGRAM_UPGRADE_COMPLETED_STATUS) {
    mergedPayload.completedAt = null;
  }

  return mergedPayload;
};

export const applyProgramUpgradePayload = (document, payload, validationResult) => {
  document.programId = payload.programId;
  document.upgradeItem = payload.upgradeItem;
  document.priority = payload.priority;
  document.durationValue = payload.durationValue;
  document.durationUnit = payload.durationUnit;
  document.time = validationResult.time;
  document.convert = validationResult.convert;
  document.bonusPoint = payload.bonusPoint;
  document.status = payload.status;
  document.assigner = payload.assigner;
  document.assignee = payload.assignee;
  document.assignedAt = payload.assignedAt;
  document.receivedAt = payload.receivedAt;
  document.dueAt = payload.dueAt;
  document.completedAt = payload.completedAt;
  document.visible = payload.visible;
  document.note = payload.note;
};

export const toProgramUpgradeResponseItem = (doc) => ({
  id: doc._id,
  programId: doc.programId?._id || doc.programId,
  contractCode: doc.programId?.contractCode || "",
  module: doc.programId?.module || "",
  upgradeItem: doc.upgradeItem,
  priority: doc.priority,
  durationValue: doc.durationValue,
  durationUnit: doc.durationUnit,
  time: doc.time || "",
  convert: doc.convert || "",
  bonusPoint: doc.bonusPoint,
  status: normalizeProgramUpgradeStatus(doc.status),
  assigner: doc.assigner,
  assignee: doc.assignee,
  assignedAt: toIsoString(doc.assignedAt),
  assignedAtLabel: formatDateTime(doc.assignedAt),
  receivedAt: toIsoString(doc.receivedAt),
  receivedAtLabel: formatDateTime(doc.receivedAt),
  dueAt: toIsoString(doc.dueAt),
  dueAtLabel: formatDateTime(doc.dueAt),
  completedAt: toIsoString(doc.completedAt),
  completedAtLabel: formatDateTime(doc.completedAt),
  visible: doc.visible,
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatDateTime(doc.createdAt),
});
