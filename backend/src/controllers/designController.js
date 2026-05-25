import mongoose from "mongoose";

import DesignTask from "../models/DesignTask.js";
import { getActiveCategoryNames } from "../utils/system-category.js";

const DESIGN_TYPES = ["Logo", "Banner", "Landing page", "UI/UX", "Social post"];
const COMPLETED_STATUS = "Đã hoàn thành";
const hasRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);
const normalizeStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return COMPLETED_STATUS;
  if (normalized === "Đã nhận") return "Đã phân công";
  if (!Array.isArray(statusOptions) || statusOptions.length === 0) return normalized;
  return statusOptions.includes(normalized) ? normalized : statusOptions[0];
};
const DURATION_UNITS = ["h", "ngày"];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};
const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

const normalizePayload = (body = {}) => ({
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

const validatePayload = async (payload, excludeId = "") => {
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

  payload.status = normalizeStatus(payload.status, statusOptions);
  if (!payload.title) return { status: 400, message: "title là bắt buộc" };
  if (!DESIGN_TYPES.includes(payload.designType)) return { status: 400, message: "designType không hợp lệ" };
  if (!priorityOptions.includes(payload.priority)) return { status: 400, message: "priority không hợp lệ" };
  if (!payload.assigner) return { status: 400, message: "assigner là bắt buộc" };
  if (!payload.assignee) return { status: 400, message: "assignee là bắt buộc" };
  if (payload.durationValue === null || payload.durationValue <= 0)
    return { status: 400, message: "durationValue không hợp lệ" };
  if (!DURATION_UNITS.includes(payload.durationUnit)) return { status: 400, message: "durationUnit không hợp lệ" };
  if (payload.convert === null || payload.convert < 0) return { status: 400, message: "convert không hợp lệ" };
  if (payload.bonusPoint === null || payload.bonusPoint < 0) return { status: 400, message: "bonusPoint không hợp lệ" };
  if (!statusOptions.includes(payload.status)) return { status: 400, message: "status không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };
  if (payload.status !== COMPLETED_STATUS) {
    payload.completedDate = null;
  }

  const escapedTitle = payload.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const duplicate = await DesignTask.findOne({
    title: { $regex: `^${escapedTitle}$`, $options: "i" },
    designType: payload.designType,
    assignee: payload.assignee,
    isDeleted: false,
  }).lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Công việc design đã tồn tại cho nhân sự này" };
  }

  return null;
};

const toResponseItem = (doc) => ({
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
  status: normalizeStatus(doc.status),
  handoverDate: doc.handoverDate ? new Date(doc.handoverDate).toISOString() : null,
  handoverDateLabel: doc.handoverDate ? formatDateTime(doc.handoverDate) : "",
  receiveDate: doc.receiveDate ? new Date(doc.receiveDate).toISOString() : null,
  receiveDateLabel: doc.receiveDate ? formatDateTime(doc.receiveDate) : "",
  expectedDate: doc.expectedDate ? new Date(doc.expectedDate).toISOString() : null,
  expectedDateLabel: doc.expectedDate ? formatDateTime(doc.expectedDate) : "",
  completedDate: doc.completedDate ? new Date(doc.completedDate).toISOString() : null,
  completedDateLabel: doc.completedDate ? formatDateTime(doc.completedDate) : "",
  deadline: doc.expectedDate
    ? new Date(doc.expectedDate).toISOString()
    : doc.deadline
      ? new Date(doc.deadline).toISOString()
      : null,
  deadlineLabel: doc.expectedDate ? formatDateTime(doc.expectedDate) : doc.deadline ? formatDateTime(doc.deadline) : "",
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listDesignTasks = async (req, res) => {
  const search = normalizeString(req.query.search);
  const designType = normalizeString(req.query.designType);
  const status = normalizeString(req.query.status);
  const assignee = normalizeString(req.query.assignee);
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 200;

  const filters = { isDeleted: false };
  if (designType && designType !== "all") filters.designType = designType;
  if (status && status !== "all") filters.status = status;
  if (assignee && assignee !== "all") filters.assignee = assignee;
  if (search) {
    filters.$or = [
      { title: { $regex: search, $options: "i" } },
      { assignee: { $regex: search, $options: "i" } },
      { assigner: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    DesignTask.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    DesignTask.countDocuments(filters),
  ]);

  return res.json({
    page,
    limit,
    total,
    designTasks: items.map(toResponseItem),
  });
};

export const listDesignReferences = async (req, res) => {
  const items = await DesignTask.find({
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .select("title designType assignee status expectedDate")
    .lean();

  return res.json({
    designTasks: items.map((item) => ({
      id: item._id,
      title: item.title || "",
      designType: item.designType || "",
      assignee: item.assignee || "",
      status: normalizeStatus(item.status),
      expectedDate: item.expectedDate ? new Date(item.expectedDate).toISOString() : null,
      expectedDateLabel: item.expectedDate ? formatDateTime(item.expectedDate) : "",
      label: `${item.title || "Design"} - ${item.designType || "N/A"} - ${item.assignee || "N/A"} - ${normalizeStatus(
        item.status,
      )}`,
    })),
  });
};

export const getDesignTaskById = async (req, res) => {
  const item = await DesignTask.findById(req.params.id).lean();
  if (!item || item.isDeleted) return res.status(404).json({ message: "Không tìm thấy công việc design" });
  return res.json({ designTask: toResponseItem(item) });
};

export const createDesignTask = async (req, res) => {
  const payload = normalizePayload(req.body);
  payload.deadline = payload.expectedDate;
  const validationError = await validatePayload(payload);
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  const created = await DesignTask.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return res.status(201).json({
    message: "Đã thêm công việc design",
    designTask: toResponseItem(created),
  });
};

export const updateDesignTask = async (req, res) => {
  const existing = await DesignTask.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy công việc design" });
  if (existing.status === COMPLETED_STATUS && !hasRequestPermission(req, "design.overrideCompleted")) {
    return res.status(403).json({ message: "Công việc design đã hoàn thành, chỉ được xem chi tiết" });
  }

  const normalizedInput = normalizePayload(req.body);
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
    handoverDate: req.body.handoverDate === null ? null : normalizedInput.handoverDate || existing.handoverDate,
    receiveDate: req.body.receiveDate === null ? null : normalizedInput.receiveDate || existing.receiveDate,
    expectedDate: req.body.expectedDate === null ? null : normalizedInput.expectedDate || existing.expectedDate,
    completedDate: req.body.completedDate === null ? null : normalizedInput.completedDate || existing.completedDate,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };
  mergedPayload.deadline = mergedPayload.expectedDate;

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  existing.title = mergedPayload.title;
  existing.designType = mergedPayload.designType;
  existing.priority = mergedPayload.priority;
  existing.assigner = mergedPayload.assigner;
  existing.assignee = mergedPayload.assignee;
  existing.durationValue = mergedPayload.durationValue;
  existing.durationUnit = mergedPayload.durationUnit;
  existing.convert = mergedPayload.convert;
  existing.bonusPoint = mergedPayload.bonusPoint;
  existing.status = mergedPayload.status;
  existing.handoverDate = mergedPayload.handoverDate;
  existing.receiveDate = mergedPayload.receiveDate;
  existing.expectedDate = mergedPayload.expectedDate;
  existing.completedDate = mergedPayload.completedDate;
  existing.deadline = mergedPayload.deadline;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return res.json({
    message: "Đã cập nhật công việc design",
    designTask: toResponseItem(existing),
  });
};

export const deleteDesignTask = async (req, res) => {
  const item = await DesignTask.findById(req.params.id);
  if (!item || item.isDeleted) return res.status(404).json({ message: "Không tìm thấy công việc design" });
  item.isDeleted = true;
  await item.save();
  return res.json({ message: "Đã xóa công việc design" });
};

export const deleteDesignTasks = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await DesignTask.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các công việc design đã chọn" : "Đã xóa toàn bộ công việc design",
    deletedCount: result.modifiedCount || 0,
  });
};