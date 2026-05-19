import mongoose from "mongoose";

import Program from "../models/Program.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";

const PRIORITY_OPTIONS = ["Thấp", "Trung bình", "Cao", "Khẩn"];
const STATUS_OPTIONS = ["Mới tạo", "Đang xử lý", "Hoàn thành", "Tạm dừng"];
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
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(3)).toString();
};

const calculateConvertByDuration = (durationValue, durationUnit) => {
  if (!Number.isFinite(durationValue) || durationValue <= 0) return "";
  if (durationUnit === "ngày") return formatNumber(durationValue);
  if (durationUnit === "h") return formatNumber(durationValue / 8);
  return "";
};

const toIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
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

const validatePayload = async (payload) => {
  if (!payload.programId) {
    return { status: 400, message: "programId là bắt buộc" };
  }
  if (!mongoose.isValidObjectId(payload.programId)) {
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
  if (!DURATION_UNITS.includes(payload.durationUnit)) {
    return { status: 400, message: `durationUnit không hợp lệ. Giá trị cho phép: ${DURATION_UNITS.join(", ")}` };
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
  if (!PRIORITY_OPTIONS.includes(payload.priority)) {
    return { status: 400, message: `priority không hợp lệ. Giá trị cho phép: ${PRIORITY_OPTIONS.join(", ")}` };
  }
  if (!STATUS_OPTIONS.includes(payload.status)) {
    return { status: 400, message: `status không hợp lệ. Giá trị cho phép: ${STATUS_OPTIONS.join(", ")}` };
  }
  if (payload.visible === null) {
    return { status: 400, message: "visible phải là kiểu boolean" };
  }

  return {
    program,
    time: `${formatNumber(payload.durationValue)} ${payload.durationUnit}`,
    convert: calculateConvertByDuration(payload.durationValue, payload.durationUnit),
  };
};

const toResponseItem = (doc) => ({
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
  status: doc.status,
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

export const createProgramUpgrade = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationResult = await validatePayload(payload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }
  if (payload.status === "Hoàn thành" && !payload.completedAt) {
    payload.completedAt = new Date();
  }
  if (payload.status !== "Hoàn thành") {
    payload.completedAt = null;
  }

  const createdUpgrade = await ProgramUpgrade.create({
    ...payload,
    time: validationResult.time,
    convert: validationResult.convert,
    createdBy: req.user.sub,
  });

  const populated = await ProgramUpgrade.findById(createdUpgrade._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.status(201).json({
    message: "Tạo yêu cầu nâng cấp thành công",
    upgrade: toResponseItem(populated),
  });
};

export const listProgramUpgrades = async (req, res) => {
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
    filters.createdAt = { $gte: rangeStart, $lt: rangeEnd };
  }

  const keyword = normalizeString(search);
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
    const programIds = matchingPrograms.map((item) => item._id);
    filters.$or = [
      { upgradeItem: { $regex: keyword, $options: "i" } },
      { note: { $regex: keyword, $options: "i" } },
      { programId: { $in: programIds } },
    ];
  }

  const [items, total] = await Promise.all([
    ProgramUpgrade.find(filters)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber)
      .populate({ path: "programId", select: "contractCode module" })
      .lean(),
    ProgramUpgrade.countDocuments(filters),
  ]);

  return res.json({
    upgrades: items.map(toResponseItem),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
    },
  });
};

export const getProgramUpgradeById = async (req, res) => {
  const upgrade = await ProgramUpgrade.findById(req.params.id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();
  if (!upgrade || upgrade.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu nâng cấp" });
  }

  return res.json({
    upgrade: toResponseItem(upgrade),
  });
};

export const updateProgramUpgrade = async (req, res) => {
  const existing = await ProgramUpgrade.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu nâng cấp" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    programId: normalizedInput.programId || String(existing.programId),
    upgradeItem: normalizedInput.upgradeItem || existing.upgradeItem,
    priority: normalizedInput.priority || existing.priority,
    durationValue: normalizedInput.durationValue === null ? existing.durationValue : normalizedInput.durationValue,
    durationUnit: normalizedInput.durationUnit || existing.durationUnit,
    bonusPoint: normalizedInput.bonusPoint === null ? existing.bonusPoint : normalizedInput.bonusPoint,
    status: normalizedInput.status || existing.status,
    assigner: normalizedInput.assigner || existing.assigner,
    assignee: normalizedInput.assignee || existing.assignee,
    assignedAt: req.body.assignedAt === null ? null : normalizedInput.assignedAt || existing.assignedAt,
    receivedAt: req.body.receivedAt === null ? null : normalizedInput.receivedAt || existing.receivedAt,
    dueAt: req.body.dueAt === null ? null : normalizedInput.dueAt || existing.dueAt,
    completedAt: req.body.completedAt === null ? null : normalizedInput.completedAt || existing.completedAt,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };
  if (mergedPayload.status === "Hoàn thành" && !mergedPayload.completedAt) {
    mergedPayload.completedAt = new Date();
  }
  if (mergedPayload.status !== "Hoàn thành") {
    mergedPayload.completedAt = null;
  }

  const validationResult = await validatePayload(mergedPayload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  existing.programId = mergedPayload.programId;
  existing.upgradeItem = mergedPayload.upgradeItem;
  existing.priority = mergedPayload.priority;
  existing.durationValue = mergedPayload.durationValue;
  existing.durationUnit = mergedPayload.durationUnit;
  existing.time = validationResult.time;
  existing.convert = validationResult.convert;
  existing.bonusPoint = mergedPayload.bonusPoint;
  existing.status = mergedPayload.status;
  existing.assigner = mergedPayload.assigner;
  existing.assignee = mergedPayload.assignee;
  existing.assignedAt = mergedPayload.assignedAt;
  existing.receivedAt = mergedPayload.receivedAt;
  existing.dueAt = mergedPayload.dueAt;
  existing.completedAt = mergedPayload.completedAt;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  const populated = await ProgramUpgrade.findById(existing._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.json({
    message: "Cập nhật yêu cầu nâng cấp thành công",
    upgrade: toResponseItem(populated),
  });
};

export const deleteProgramUpgrade = async (req, res) => {
  const upgrade = await ProgramUpgrade.findById(req.params.id);
  if (!upgrade || upgrade.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy yêu cầu nâng cấp" });
  }

  upgrade.isDeleted = true;
  await upgrade.save();

  return res.json({ message: "Đã xóa yêu cầu nâng cấp" });
};

export const deleteProgramUpgrades = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await ProgramUpgrade.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các yêu cầu nâng cấp đã chọn" : "Đã xóa toàn bộ yêu cầu nâng cấp",
    deletedCount: result.modifiedCount || 0,
  });
};
