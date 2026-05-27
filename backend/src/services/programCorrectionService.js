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

export const PROGRAM_CORRECTION_COMPLETED_STATUS = "Đã hoàn thành";
export const PROGRAM_CORRECTION_DURATION_UNITS = ["h", "ngày"];

export const normalizeProgramCorrectionStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return PROGRAM_CORRECTION_COMPLETED_STATUS;
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

const getProgramCorrectionConvertSettings = async () => {
  const settings = await getSystemSettingsObject();
  return settings?.time || {};
};

const calculateProgramCorrectionConvertByDuration = (durationValue, durationUnit, convertSettings = {}) => {
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

export const normalizeProgramCorrectionPayload = (body = {}) => ({
  programId: normalizeString(body.programId),
  issueContent: normalizeString(body.issueContent),
  priority: normalizeString(body.priority),
  durationValue: normalizeNumber(body.durationValue),
  durationUnit: normalizeString(body.durationUnit),
  bonusPoint: normalizeNumber(body.bonusPoint),
  assigner: normalizeString(body.assigner),
  assignee: normalizeString(body.assignee),
  assignedAt: normalizeDate(body.assignedAt),
  receivedAt: normalizeDate(body.receivedAt),
  dueAt: normalizeDate(body.dueAt),
  completedAt: normalizeDate(body.completedAt),
  status: normalizeString(body.status),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

export const validateProgramCorrectionPayload = async (payload) => {
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

  payload.status = normalizeProgramCorrectionStatus(payload.status, statusOptions);
  if (!payload.programId) {
    return { status: 400, message: "programId là bắt buộc" };
  }
  if (!normalizeObjectId(payload.programId)) {
    return { status: 400, message: "programId không hợp lệ" };
  }

  const targetProgram = await Program.findOne({
    _id: payload.programId,
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  })
    .select("contractCode module")
    .lean();
  if (!targetProgram) {
    return { status: 404, message: "Không tìm thấy phiếu gốc hợp lệ" };
  }

  if (!payload.issueContent) {
    return { status: 400, message: "issueContent là bắt buộc" };
  }
  if (payload.durationValue === null || payload.durationValue <= 0) {
    return { status: 400, message: "durationValue phải lớn hơn 0" };
  }
  if (!PROGRAM_CORRECTION_DURATION_UNITS.includes(payload.durationUnit)) {
    return {
      status: 400,
      message: `durationUnit không hợp lệ. Giá trị cho phép: ${PROGRAM_CORRECTION_DURATION_UNITS.join(", ")}`,
    };
  }
  if (payload.bonusPoint === null || payload.bonusPoint < 0) {
    return { status: 400, message: "bonusPoint không hợp lệ" };
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
  if (!priorityOptions.includes(payload.priority)) {
    return { status: 400, message: `priority không hợp lệ. Giá trị cho phép: ${priorityOptions.join(", ")}` };
  }
  if (!statusOptions.includes(payload.status)) {
    return { status: 400, message: `status không hợp lệ. Giá trị cho phép: ${statusOptions.join(", ")}` };
  }
  if (payload.visible === null) {
    return { status: 400, message: "visible phải là kiểu boolean" };
  }
  if (payload.receivedAt && payload.receivedAt < payload.assignedAt) {
    return { status: 400, message: "Ngày nhận không được nhỏ hơn ngày giao" };
  }
  if (payload.completedAt && payload.completedAt < payload.assignedAt) {
    return { status: 400, message: "Ngày hoàn thành không được nhỏ hơn ngày giao" };
  }
  if (payload.dueAt < payload.assignedAt) {
    return { status: 400, message: "Ngày dự kiến không được nhỏ hơn ngày giao" };
  }

  const convertSettings = await getProgramCorrectionConvertSettings();

  return {
    targetProgram,
    time: `${formatNumber(payload.durationValue, convertSettings.roundingDigits)} ${payload.durationUnit}`,
    convert: calculateProgramCorrectionConvertByDuration(payload.durationValue, payload.durationUnit, convertSettings),
  };
};

export const normalizeProgramCorrectionCreatePayload = (body = {}) => {
  const payload = normalizeProgramCorrectionPayload(body);
  return payload.status === PROGRAM_CORRECTION_COMPLETED_STATUS ? payload : { ...payload, completedAt: null };
};

export const mergeProgramCorrectionPayload = (input, existing, rawBody = {}) => {
  const mergedPayload = {
    programId: input.programId || String(existing.programId),
    issueContent: input.issueContent || existing.issueContent,
    priority: input.priority || existing.priority,
    durationValue: input.durationValue === null ? existing.durationValue : input.durationValue,
    durationUnit: input.durationUnit || existing.durationUnit,
    bonusPoint: input.bonusPoint === null ? existing.bonusPoint : input.bonusPoint,
    assigner: input.assigner || existing.assigner,
    assignee: input.assignee || existing.assignee,
    assignedAt: input.assignedAt || existing.assignedAt,
    receivedAt: input.receivedAt !== null ? input.receivedAt : existing.receivedAt,
    dueAt: input.dueAt || existing.dueAt,
    completedAt: input.completedAt !== null ? input.completedAt : existing.completedAt,
    status: input.status || existing.status,
    visible: input.visible === null ? existing.visible : input.visible,
    note: typeof rawBody.note === "string" ? input.note : existing.note,
  };

  if (mergedPayload.status !== PROGRAM_CORRECTION_COMPLETED_STATUS) {
    mergedPayload.completedAt = null;
  }

  return mergedPayload;
};

export const applyProgramCorrectionPayload = (document, payload, validationResult) => {
  document.programId = payload.programId;
  document.issueContent = payload.issueContent;
  document.priority = payload.priority;
  document.durationValue = payload.durationValue;
  document.durationUnit = payload.durationUnit;
  document.time = validationResult.time;
  document.convert = validationResult.convert;
  document.bonusPoint = payload.bonusPoint;
  document.assigner = payload.assigner;
  document.assignee = payload.assignee;
  document.assignedAt = payload.assignedAt;
  document.receivedAt = payload.receivedAt;
  document.dueAt = payload.dueAt;
  document.completedAt = payload.completedAt;
  document.status = payload.status;
  document.visible = payload.visible;
  document.note = payload.note;
};

export const toProgramCorrectionResponseItem = (doc) => ({
  id: doc._id,
  programId: doc.programId?._id || doc.programId,
  contractCode: doc.programId?.contractCode || "",
  module: doc.programId?.module || "",
  issueContent: doc.issueContent,
  priority: doc.priority,
  durationValue: doc.durationValue,
  durationUnit: doc.durationUnit,
  time: doc.time || "",
  convert: doc.convert || "",
  bonusPoint: doc.bonusPoint || 0,
  status: normalizeProgramCorrectionStatus(doc.status),
  assigner: doc.assigner,
  assignee: doc.assignee,
  assignedAt: toIsoString(doc.assignedAt),
  receivedAt: toIsoString(doc.receivedAt),
  dueAt: toIsoString(doc.dueAt),
  completedAt: toIsoString(doc.completedAt),
  visible: doc.visible,
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt, { includeSeconds: false }),
});
