import mongoose from "mongoose";

import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
import { getSystemSettingsObject } from "../services/systemSettingService.js";
import { getActiveCategoryNames } from "../utils/system-category.js";

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

const normalizeDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
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

const toIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatNumber = (value, roundingDigits = 3) => {
  if (!Number.isFinite(value)) return "";
  const safeDigits = Number.isFinite(Number(roundingDigits)) ? Math.min(Math.max(Math.trunc(Number(roundingDigits)), 0), 6) : 3;
  return Number(value.toFixed(safeDigits)).toString();
};

const getConvertSettings = async () => {
  const settings = await getSystemSettingsObject();
  return settings?.time || {};
};

const calculateConvertByDuration = (durationValue, durationUnit, convertSettings = {}) => {
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

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizePayload = (body = {}) => ({
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

const validatePayload = async (payload) => {
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
  if (!payload.programId) {
    return { status: 400, message: "programId là bắt buộc" };
  }
  if (!mongoose.isValidObjectId(payload.programId)) {
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
  if (!DURATION_UNITS.includes(payload.durationUnit)) {
    return { status: 400, message: `durationUnit không hợp lệ. Giá trị cho phép: ${DURATION_UNITS.join(", ")}` };
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

  const convertSettings = await getConvertSettings();

  return {
    targetProgram,
    time: `${formatNumber(payload.durationValue, convertSettings.roundingDigits)} ${payload.durationUnit}`,
    convert: calculateConvertByDuration(payload.durationValue, payload.durationUnit, convertSettings),
  };
};

const toResponseItem = (doc) => ({
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
  status: normalizeStatus(doc.status),
  assigner: doc.assigner,
  assignee: doc.assignee,
  assignedAt: toIsoString(doc.assignedAt),
  receivedAt: toIsoString(doc.receivedAt),
  dueAt: toIsoString(doc.dueAt),
  completedAt: toIsoString(doc.completedAt),
  visible: doc.visible,
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const createProgramCorrection = async (req, res) => {
  const payload = normalizePayload(req.body);
  const normalizedPayload = payload.status === COMPLETED_STATUS ? payload : { ...payload, completedAt: null };

  const validationResult = await validatePayload(normalizedPayload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  const createdCorrection = await ProgramCorrection.create({
    ...normalizedPayload,
    time: validationResult.time,
    convert: validationResult.convert,
    createdBy: req.user.sub,
  });

  const populated = await ProgramCorrection.findById(createdCorrection._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.status(201).json({
    message: "Tạo yêu cầu chỉnh sửa thành công",
    correction: toResponseItem(populated),
  });
};

export const listProgramCorrections = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", search = "", page = "1", limit = "20" } = req.query;
  const pageNumber = parsePositiveInteger(page) || 1;
  const limitNumber = parsePositiveInteger(limit) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const filters = { isDeleted: false };
  if (assignee && assignee !== "all") {
    filters.assignee = normalizeString(assignee);
  }

  const monthNum = month !== "all" ? parsePositiveInteger(month) : null;
  const yearNum = year !== "all" ? parsePositiveInteger(year) : null;
  if (monthNum || yearNum) {
    const rangeStart = new Date(yearNum || 1970, monthNum ? monthNum - 1 : 0, 1, 0, 0, 0, 0);
    const rangeEnd = new Date(yearNum || 3000, monthNum ? monthNum : 12, 1, 0, 0, 0, 0);
    filters.assignedAt = { $gte: rangeStart, $lt: rangeEnd };
  }

  const keyword = normalizeString(search);
  let searchedProgramIds = [];
  if (keyword) {
    const matchingPrograms = await Program.find({
      isDeleted: false,
      $and: [
        { $or: [{ type: "program" }, { type: { $exists: false } }] },
        { $or: [{ contractCode: { $regex: keyword, $options: "i" } }, { module: { $regex: keyword, $options: "i" } }] },
      ],
    })
      .select("_id")
      .lean();
    searchedProgramIds = matchingPrograms.map((item) => item._id);
    filters.$or = [
      { issueContent: { $regex: keyword, $options: "i" } },
      { note: { $regex: keyword, $options: "i" } },
      { programId: { $in: searchedProgramIds } },
    ];
  }

  const [items, total] = await Promise.all([
    ProgramCorrection.find(filters)
      .sort({ assignedAt: 1, createdAt: 1 })
      .skip(skip)
      .limit(limitNumber)
      .populate({ path: "programId", select: "contractCode module" })
      .lean(),
    ProgramCorrection.countDocuments(filters),
  ]);

  return res.json({
    corrections: items.map(toResponseItem),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
    },
  });
};

export const getProgramCorrectionById = async (req, res) => {
  const correction = await ProgramCorrection.findById(req.params.id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();
  if (!correction || correction.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu chỉnh sửa" });
  }

  return res.json({
    correction: toResponseItem(correction),
  });
};

export const updateProgramCorrection = async (req, res) => {
  const existing = await ProgramCorrection.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu chỉnh sửa" });
  }

  if (existing.status === COMPLETED_STATUS && !hasRequestPermission(req, "correction.overrideCompleted")) {
    return res.status(403).json({ message: "Yêu cầu chỉnh sửa đã hoàn thành, chỉ được xem chi tiết" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    programId: normalizedInput.programId || String(existing.programId),
    issueContent: normalizedInput.issueContent || existing.issueContent,
    priority: normalizedInput.priority || existing.priority,
    durationValue: normalizedInput.durationValue === null ? existing.durationValue : normalizedInput.durationValue,
    durationUnit: normalizedInput.durationUnit || existing.durationUnit,
    bonusPoint: normalizedInput.bonusPoint === null ? existing.bonusPoint : normalizedInput.bonusPoint,
    assigner: normalizedInput.assigner || existing.assigner,
    assignee: normalizedInput.assignee || existing.assignee,
    assignedAt: normalizedInput.assignedAt || existing.assignedAt,
    receivedAt: normalizedInput.receivedAt !== null ? normalizedInput.receivedAt : existing.receivedAt,
    dueAt: normalizedInput.dueAt || existing.dueAt,
    completedAt: normalizedInput.completedAt !== null ? normalizedInput.completedAt : existing.completedAt,
    status: normalizedInput.status || existing.status,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };
  if (mergedPayload.status !== COMPLETED_STATUS) {
    mergedPayload.completedAt = null;
  }

  const validationResult = await validatePayload(mergedPayload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  existing.programId = mergedPayload.programId;
  existing.issueContent = mergedPayload.issueContent;
  existing.priority = mergedPayload.priority;
  existing.durationValue = mergedPayload.durationValue;
  existing.durationUnit = mergedPayload.durationUnit;
  existing.time = validationResult.time;
  existing.convert = validationResult.convert;
  existing.bonusPoint = mergedPayload.bonusPoint;
  existing.assigner = mergedPayload.assigner;
  existing.assignee = mergedPayload.assignee;
  existing.assignedAt = mergedPayload.assignedAt;
  existing.receivedAt = mergedPayload.receivedAt;
  existing.dueAt = mergedPayload.dueAt;
  existing.completedAt = mergedPayload.completedAt;
  existing.status = mergedPayload.status;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  const populated = await ProgramCorrection.findById(existing._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.json({
    message: "Cập nhật yêu cầu chỉnh sửa thành công",
    correction: toResponseItem(populated),
  });
};

export const deleteProgramCorrection = async (req, res) => {
  const correction = await ProgramCorrection.findById(req.params.id);
  if (!correction || correction.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu chỉnh sửa" });
  }

  correction.isDeleted = true;
  await correction.save();

  return res.json({ message: "Đã xóa yêu cầu chỉnh sửa" });
};

export const deleteProgramCorrections = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await ProgramCorrection.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các yêu cầu chỉnh sửa đã chọn" : "Đã xóa toàn bộ yêu cầu chỉnh sửa",
    deletedCount: result.modifiedCount || 0,
  });
};