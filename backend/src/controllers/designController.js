import DesignTask from "../models/DesignTask.js";
import { normalizeObjectId, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { buildSearchOrFilter } from "../utils/query.js";
import {
  sendCreated,
  sendError,
  sendNotFound,
  sendOk,
  sendValidationError,
} from "../utils/httpResponse.js";
import {
  DESIGN_TASK_COMPLETED_STATUS,
  applyDesignTaskPayload,
  mergeDesignTaskPayload,
  normalizeDesignTaskPayload,
  toDesignTaskReferenceItem,
  toDesignTaskResponseItem,
  validateDesignTaskPayload,
} from "../services/designTaskService.js";

const hasRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);

export const listDesignTasks = async (req, res) => {
  const search = normalizeString(req.query.search);
  const designType = normalizeString(req.query.designType);
  const status = normalizeString(req.query.status);
  const assignee = normalizeString(req.query.assignee);
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 200;

  const filters = {
    isDeleted: false,
    ...buildSearchOrFilter(search, ["title", "assignee", "assigner", "note"]),
  };
  if (designType && designType !== "all") filters.designType = designType;
  if (status && status !== "all") filters.status = status;
  if (assignee && assignee !== "all") filters.assignee = assignee;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    DesignTask.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    DesignTask.countDocuments(filters),
  ]);

  return sendOk(res, {
    page,
    limit,
    total,
    designTasks: items.map(toDesignTaskResponseItem),
  });
};

export const listDesignReferences = async (req, res) => {
  const items = await DesignTask.find({
    isDeleted: false,
  })
    .sort({ createdAt: 1 })
    .select("title designType assignee status expectedDate")
    .lean();

  return sendOk(res, {
    designTasks: items.map(toDesignTaskReferenceItem),
  });
};

export const getDesignTaskById = async (req, res) => {
  const item = await DesignTask.findById(req.params.id).lean();
  if (!item || item.isDeleted) return sendNotFound(res, "Không tìm thấy công việc design");
  return sendOk(res, { designTask: toDesignTaskResponseItem(item) });
};

export const createDesignTask = async (req, res) => {
  const payload = normalizeDesignTaskPayload(req.body);
  payload.deadline = payload.expectedDate;

  const validationError = await validateDesignTaskPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await DesignTask.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm công việc design",
    designTask: toDesignTaskResponseItem(created),
  });
};

export const updateDesignTask = async (req, res) => {
  const existing = await DesignTask.findById(req.params.id);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy công việc design");
  if (existing.status === DESIGN_TASK_COMPLETED_STATUS && !hasRequestPermission(req, "design.overrideCompleted")) {
    return sendError(res, 403, "Công việc design đã hoàn thành, chỉ được xem chi tiết");
  }

  const mergedPayload = mergeDesignTaskPayload(req.body, existing);
  const validationError = await validateDesignTaskPayload(mergedPayload, { excludeId: String(existing._id) });
  if (validationError) return sendValidationError(res, validationError);

  applyDesignTaskPayload(existing, mergedPayload);
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật công việc design",
    designTask: toDesignTaskResponseItem(existing),
  });
};

export const deleteDesignTask = async (req, res) => {
  const item = await DesignTask.findById(req.params.id);
  if (!item || item.isDeleted) return sendNotFound(res, "Không tìm thấy công việc design");

  item.isDeleted = true;
  await item.save();

  return sendOk(res, { message: "Đã xóa công việc design" });
};

export const deleteDesignTasks = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeObjectId(item)).filter(Boolean)
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await DesignTask.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các công việc design đã chọn" : "Đã xóa toàn bộ công việc design",
    deletedCount: result.modifiedCount || 0,
  });
};
