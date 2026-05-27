import Program from "../models/Program.js";
import ProgramUpgrade from "../models/ProgramUpgrade.js";
import { buildMonthYearDateRange } from "../utils/date.js";
import {
  normalizeObjectId,
  normalizeString,
  parsePositiveInteger,
} from "../utils/normalize.js";
import {
  sendCreated,
  sendError,
  sendNotFound,
  sendOk,
  sendValidationError,
} from "../utils/httpResponse.js";
import {
  PROGRAM_UPGRADE_COMPLETED_STATUS,
  applyProgramUpgradePayload,
  mergeProgramUpgradePayload,
  normalizeProgramUpgradeCreatePayload,
  normalizeProgramUpgradePayload,
  toProgramUpgradeResponseItem,
  validateProgramUpgradePayload,
} from "../services/programUpgradeService.js";

const hasRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);

export const createProgramUpgrade = async (req, res) => {
  const payload = normalizeProgramUpgradeCreatePayload(req.body);
  const validationResult = await validateProgramUpgradePayload(payload);
  if (validationResult.status) {
    return sendValidationError(res, validationResult);
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

  return sendCreated(res, {
    message: "Tạo yêu cầu nâng cấp thành công",
    upgrade: toProgramUpgradeResponseItem(populated),
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

  const { startDate, endDate } = buildMonthYearDateRange({ month, year });
  if (startDate && endDate) {
    filters.createdAt = { $gte: startDate, $lt: endDate };
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

  return sendOk(res, {
    upgrades: items.map(toProgramUpgradeResponseItem),
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
    return sendNotFound(res, "Không tìm thấy yêu cầu nâng cấp");
  }

  return sendOk(res, {
    upgrade: toProgramUpgradeResponseItem(upgrade),
  });
};

export const updateProgramUpgrade = async (req, res) => {
  const existing = await ProgramUpgrade.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy yêu cầu nâng cấp");
  }

  if (
    existing.status === PROGRAM_UPGRADE_COMPLETED_STATUS &&
    !hasRequestPermission(req, "upgrade.overrideCompleted")
  ) {
    return sendError(res, 403, "Yêu cầu nâng cấp đã hoàn thành, chỉ được xem chi tiết");
  }

  const normalizedInput = normalizeProgramUpgradePayload(req.body);
  const mergedPayload = mergeProgramUpgradePayload(normalizedInput, existing, req.body);

  const validationResult = await validateProgramUpgradePayload(mergedPayload);
  if (validationResult.status) {
    return sendValidationError(res, validationResult);
  }

  applyProgramUpgradePayload(existing, mergedPayload, validationResult);
  await existing.save();

  const populated = await ProgramUpgrade.findById(existing._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return sendOk(res, {
    message: "Cập nhật yêu cầu nâng cấp thành công",
    upgrade: toProgramUpgradeResponseItem(populated),
  });
};

export const deleteProgramUpgrade = async (req, res) => {
  const upgrade = await ProgramUpgrade.findById(req.params.id);
  if (!upgrade || upgrade.isDeleted) {
    return sendNotFound(res, "Không tìm thấy yêu cầu nâng cấp");
  }

  upgrade.isDeleted = true;
  await upgrade.save();

  return sendOk(res, { message: "Đã xóa yêu cầu nâng cấp" });
};

export const deleteProgramUpgrades = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeObjectId(item)).filter(Boolean)
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await ProgramUpgrade.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các yêu cầu nâng cấp đã chọn" : "Đã xóa toàn bộ yêu cầu nâng cấp",
    deletedCount: result.modifiedCount || 0,
  });
};
