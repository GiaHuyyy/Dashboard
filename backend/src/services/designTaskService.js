import DesignTask from "../models/DesignTask.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import {
  normalizeBoolean,
  normalizeDate,
  normalizeNumber,
  normalizeString,
} from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { getActiveCategoryNames } from "../utils/system-category.js";

export const DESIGN_TASK_TYPES = ["Logo", "Banner", "Landing page", "UI/UX", "Social post"];
export const DESIGN_TASK_COMPLETED_STATUS = "Đã hoàn thành";
export const DESIGN_TASK_DURATION_UNITS = ["h", "ngày"];

export const normalizeDesignTaskStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return DESIGN_TASK_COMPLETED_STATUS;
  if (normalized === "Đã nhận") return "Đã phân công";
  if (!Array.isArray(statusOptions) || statusOptions.length === 0) return normalized;
  return statusOptions.includes(normalized) ? normalized : statusOptions[0];
};

export const formatDesignTaskDateTime = (value) => formatDateTime(value, { includeSeconds: false });

export const normalizeDesignTaskPayload = (body = {}) => ({
  title: normalizeString(body.title),
  designType: normalizeString(body.designType),
  priority: normalizeString(body.priority),
  assigner: normalizeString(body.assigner),
  assignee: normalizeString(body.assignee),
  durationValue: normalizeNumber(body.durationValue),
  durationUnit: normalizeString(body.durationUnit),
  convert: normalizeNumber(body.convert),
  bonusPoint: normalizeNumber(body.bonusPoint),
  status: normalizeString(body.status),
  handoverDate: body.handoverDate ? normalizeDate(body.handoverDate) : null,
  receiveDate: body.receiveDate ? normalizeDate(body.receiveDate) : null,
  expectedDate: body.expectedDate
    ? normalizeDate(body.expectedDate)
    : body.deadline
      ? normalizeDate(body.deadline)
      : null,
  completedDate: body.completedDate ? normalizeDate(body.completedDate) : null,
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

export const mergeDesignTaskPayload = (body = {}, existing) => {
  const normalizedInput = normalizeDesignTaskPayload(body);

  const mergedPayload = {
    title: normalizedInput.title || existing.title,
    designType: normalizedInput.designType || existing.designType,
    priority: normalizedInput.priority || existing.priority,
    assigner: normalizedInput.assigner || existing.assigner,
    assignee: normalizedInput.assignee || existing.assignee,
    durationValue: normalizedInput.durationValue === null ? existing.durationValue : normalizedInput.durationValue,
    durationUnit: normalizedInput.durationUnit || existing.durationUnit,
    convert: normalizedInput.convert === null ? existing.convert : normalizedInput.convert,
    bonusPoint: normalizedInput.bonusPoint === null ? existing.bonusPoint : normalizedInput.bonusPoint,
    status: normalizedInput.status || existing.status,
    handoverDate: body.handoverDate === null ? null : normalizedInput.handoverDate || existing.handoverDate,
    receiveDate: body.receiveDate === null ? null : normalizedInput.receiveDate || existing.receiveDate,
    expectedDate: body.expectedDate === null ? null : normalizedInput.expectedDate || existing.expectedDate,
    completedDate: body.completedDate === null ? null : normalizedInput.completedDate || existing.completedDate,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof body.note === "string" ? normalizedInput.note : existing.note,
  };

  mergedPayload.deadline = mergedPayload.expectedDate;
  return mergedPayload;
};

export const validateDesignTaskPayload = async (payload, { excludeId = "" } = {}) => {
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

  payload.status = normalizeDesignTaskStatus(payload.status, statusOptions);
  if (!payload.title) return { status: 400, message: "title là bắt buộc" };
  if (!DESIGN_TASK_TYPES.includes(payload.designType)) return { status: 400, message: "designType không hợp lệ" };
  if (!priorityOptions.includes(payload.priority)) return { status: 400, message: "priority không hợp lệ" };
  if (!payload.assigner) return { status: 400, message: "assigner là bắt buộc" };
  if (!payload.assignee) return { status: 400, message: "assignee là bắt buộc" };
  if (payload.durationValue === null || payload.durationValue <= 0) {
    return { status: 400, message: "durationValue không hợp lệ" };
  }
  if (!DESIGN_TASK_DURATION_UNITS.includes(payload.durationUnit)) {
    return { status: 400, message: "durationUnit không hợp lệ" };
  }
  if (payload.convert === null || payload.convert < 0) return { status: 400, message: "convert không hợp lệ" };
  if (payload.bonusPoint === null || payload.bonusPoint < 0) return { status: 400, message: "bonusPoint không hợp lệ" };
  if (!statusOptions.includes(payload.status)) return { status: 400, message: "status không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  if (payload.status !== DESIGN_TASK_COMPLETED_STATUS) {
    payload.completedDate = null;
  }

  const duplicate = await DesignTask.findOne({
    title: { $regex: `^${escapeRegex(payload.title)}$`, $options: "i" },
    designType: payload.designType,
    assignee: payload.assignee,
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Công việc design đã tồn tại cho nhân sự này" };
  }

  return null;
};

export const applyDesignTaskPayload = (doc, payload) => {
  doc.title = payload.title;
  doc.designType = payload.designType;
  doc.priority = payload.priority;
  doc.assigner = payload.assigner;
  doc.assignee = payload.assignee;
  doc.durationValue = payload.durationValue;
  doc.durationUnit = payload.durationUnit;
  doc.convert = payload.convert;
  doc.bonusPoint = payload.bonusPoint;
  doc.status = payload.status;
  doc.handoverDate = payload.handoverDate;
  doc.receiveDate = payload.receiveDate;
  doc.expectedDate = payload.expectedDate;
  doc.completedDate = payload.completedDate;
  doc.deadline = payload.deadline;
  doc.visible = payload.visible;
  doc.note = payload.note;
};

export const toDesignTaskResponseItem = (doc) => ({
  id: doc._id,
  title: doc.title,
  designType: doc.designType,
  priority: doc.priority,
  assigner: doc.assigner,
  assignee: doc.assignee,
  durationValue: doc.durationValue,
  durationUnit: doc.durationUnit,
  durationLabel: `${doc.durationValue} ${doc.durationUnit}`,
  convert: Number(doc.convert || 0),
  bonusPoint: Number(doc.bonusPoint || 0),
  totalPoint: Number((Number(doc.convert || 0) + Number(doc.bonusPoint || 0)).toFixed(3)),
  status: normalizeDesignTaskStatus(doc.status),
  handoverDate: doc.handoverDate ? toIsoString(doc.handoverDate) : null,
  handoverDateLabel: doc.handoverDate ? formatDesignTaskDateTime(doc.handoverDate) : "",
  receiveDate: doc.receiveDate ? toIsoString(doc.receiveDate) : null,
  receiveDateLabel: doc.receiveDate ? formatDesignTaskDateTime(doc.receiveDate) : "",
  expectedDate: doc.expectedDate ? toIsoString(doc.expectedDate) : null,
  expectedDateLabel: doc.expectedDate ? formatDesignTaskDateTime(doc.expectedDate) : "",
  completedDate: doc.completedDate ? toIsoString(doc.completedDate) : null,
  completedDateLabel: doc.completedDate ? formatDesignTaskDateTime(doc.completedDate) : "",
  deadline: doc.expectedDate ? toIsoString(doc.expectedDate) : doc.deadline ? toIsoString(doc.deadline) : null,
  deadlineLabel: doc.expectedDate
    ? formatDesignTaskDateTime(doc.expectedDate)
    : doc.deadline
      ? formatDesignTaskDateTime(doc.deadline)
      : "",
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDesignTaskDateTime(doc.createdAt),
});

export const toDesignTaskReferenceItem = (item) => ({
  id: item._id,
  title: item.title || "",
  designType: item.designType || "",
  assignee: item.assignee || "",
  status: normalizeDesignTaskStatus(item.status),
  expectedDate: item.expectedDate ? toIsoString(item.expectedDate) : null,
  expectedDateLabel: item.expectedDate ? formatDesignTaskDateTime(item.expectedDate) : "",
  label: `${item.title || "Design"} - ${item.designType || "N/A"} - ${item.assignee || "N/A"} - ${normalizeDesignTaskStatus(
    item.status,
  )}`,
});
