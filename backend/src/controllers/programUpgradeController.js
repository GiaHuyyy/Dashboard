import mongoose from "mongoose";

import Program from "../models/Program.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";

const PRIORITY_OPTIONS = ["Thấp", "Trung bình", "Cao", "Khẩn"];
const STATUS_OPTIONS = ["Mới tạo", "Đang xử lý", "Hoàn thành", "Tạm dừng"];

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

const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  slaHours: normalizeNumber(body.slaHours),
  bonusPoint: normalizeNumber(body.bonusPoint),
  status: normalizeString(body.status),
  assignee: normalizeString(body.assignee),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, { excludeUpgradeId = "" } = {}) => {
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

  if (payload.status !== "Hoàn thành") {
    const duplicateFilters = {
      programId: payload.programId,
      isDeleted: false,
      status: { $ne: "Hoàn thành" },
    };
    if (excludeUpgradeId && mongoose.isValidObjectId(excludeUpgradeId)) {
      duplicateFilters._id = { $ne: excludeUpgradeId };
    }
    const existingOpenUpgrade = await ProgramUpgrade.findOne(duplicateFilters).select("_id").lean();
    if (existingOpenUpgrade) {
      return { status: 409, message: "Hợp đồng này đã có nâng cấp đang mở" };
    }
  }

  if (!payload.upgradeItem) {
    return { status: 400, message: "upgradeItem là bắt buộc" };
  }
  if (!payload.assignee) {
    return { status: 400, message: "assignee là bắt buộc" };
  }
  if (payload.slaHours === null || payload.slaHours <= 0) {
    return { status: 400, message: "slaHours phải lớn hơn 0" };
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

  return { program };
};

const toResponseItem = (doc) => ({
  id: doc._id,
  programId: doc.programId?._id || doc.programId,
  contractCode: doc.programId?.contractCode || "",
  module: doc.programId?.module || "",
  upgradeItem: doc.upgradeItem,
  priority: doc.priority,
  slaHours: doc.slaHours,
  bonusPoint: doc.bonusPoint,
  status: doc.status,
  assignee: doc.assignee,
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

  const createdUpgrade = await ProgramUpgrade.create({
    ...payload,
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
      .sort({ createdAt: -1 })
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
    slaHours: normalizedInput.slaHours === null ? existing.slaHours : normalizedInput.slaHours,
    bonusPoint: normalizedInput.bonusPoint === null ? existing.bonusPoint : normalizedInput.bonusPoint,
    status: normalizedInput.status || existing.status,
    assignee: normalizedInput.assignee || existing.assignee,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationResult = await validatePayload(mergedPayload, {
    excludeUpgradeId: String(existing._id),
  });
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  existing.programId = mergedPayload.programId;
  existing.upgradeItem = mergedPayload.upgradeItem;
  existing.priority = mergedPayload.priority;
  existing.slaHours = mergedPayload.slaHours;
  existing.bonusPoint = mergedPayload.bonusPoint;
  existing.status = mergedPayload.status;
  existing.assignee = mergedPayload.assignee;
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
