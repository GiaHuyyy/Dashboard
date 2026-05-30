import Program from "../models/Program.js";
import ProgramCorrection from "../models/ProgramCorrection.js";
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
  PROGRAM_CORRECTION_COMPLETED_STATUS,
  applyProgramCorrectionPayload,
  mergeProgramCorrectionPayload,
  normalizeProgramCorrectionCreatePayload,
  normalizeProgramCorrectionPayload,
  toProgramCorrectionResponseItem,
  validateProgramCorrectionPayload,
} from "../services/programCorrectionService.js";

const hasRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);

export const createProgramCorrection = async (req, res) => {
  const payload = normalizeProgramCorrectionCreatePayload(req.body);
  const validationResult = await validateProgramCorrectionPayload(payload);
  if (validationResult.status) {
    return sendValidationError(res, validationResult);
  }

  const createdCorrection = await ProgramCorrection.create({
    ...payload,
    time: validationResult.time,
    convert: validationResult.convert,
    createdBy: req.user.sub,
  });

  const populated = await ProgramCorrection.findById(createdCorrection._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return sendCreated(res, {
    message: "Tạo yêu cầu chỉnh sửa thành công",
    correction: toProgramCorrectionResponseItem(populated),
  });
};

export const listProgramCorrections = async (req, res) => {
  const { assignee = "all", month = "all", year = "all", status = "all", search = "", page = "1", limit = "20" } = req.query;
  const pageNumber = parsePositiveInteger(page) || 1;
  const limitNumber = parsePositiveInteger(limit) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const filters = { isDeleted: false };
  if (assignee && assignee !== "all") {
    filters.assignee = normalizeString(assignee);
  }

  if (status && status !== "all") {
    filters.status = normalizeString(status);
  }

  const { startDate, endDate } = buildMonthYearDateRange({ month, year });
  if (startDate && endDate) {
    filters.assignedAt = { $gte: startDate, $lt: endDate };
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
    const searchedProgramIds = matchingPrograms.map((item) => item._id);
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

  return sendOk(res, {
    corrections: items.map(toProgramCorrectionResponseItem),
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
    return sendNotFound(res, "Không tìm thấy yêu cầu chỉnh sửa");
  }

  return sendOk(res, {
    correction: toProgramCorrectionResponseItem(correction),
  });
};

export const updateProgramCorrection = async (req, res) => {
  const existing = await ProgramCorrection.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy yêu cầu chỉnh sửa");
  }

  if (
    existing.status === PROGRAM_CORRECTION_COMPLETED_STATUS &&
    !hasRequestPermission(req, "correction.overrideCompleted")
  ) {
    return sendError(res, 403, "Yêu cầu chỉnh sửa đã hoàn thành, chỉ được xem chi tiết");
  }

  const normalizedInput = normalizeProgramCorrectionPayload(req.body);
  const mergedPayload = mergeProgramCorrectionPayload(normalizedInput, existing, req.body);

  const validationResult = await validateProgramCorrectionPayload(mergedPayload);
  if (validationResult.status) {
    return sendValidationError(res, validationResult);
  }

  applyProgramCorrectionPayload(existing, mergedPayload, validationResult);
  await existing.save();

  const populated = await ProgramCorrection.findById(existing._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return sendOk(res, {
    message: "Cập nhật yêu cầu chỉnh sửa thành công",
    correction: toProgramCorrectionResponseItem(populated),
  });
};

export const deleteProgramCorrection = async (req, res) => {
  const correction = await ProgramCorrection.findById(req.params.id);
  if (!correction || correction.isDeleted) {
    return sendNotFound(res, "Không tìm thấy yêu cầu chỉnh sửa");
  }

  correction.isDeleted = true;
  await correction.save();

  return sendOk(res, { message: "Đã xóa yêu cầu chỉnh sửa" });
};

export const deleteProgramCorrections = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeObjectId(item)).filter(Boolean)
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await ProgramCorrection.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các yêu cầu chỉnh sửa đã chọn" : "Đã xóa toàn bộ yêu cầu chỉnh sửa",
    deletedCount: result.modifiedCount || 0,
  });
};
