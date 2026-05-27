import Program from "../models/Program.js";
import {
  applyProgramPayload,
  getProgramConvertSettings,
  hasProgramRequestPermission,
  normalizeProgramPayload,
  normalizeProgramProcessingStatus,
  PROGRAM_TASK_COMPLETED_STATUS,
  toProgramCreateData,
  toProgramDetailItem,
  toProgramListItem,
  toProgramObjectIdString,
  toProgramReferenceItem,
  validateProgramPayload,
} from "../services/programTaskService.js";
import { normalizeString } from "../utils/normalize.js";
import { sendCreated, sendError, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

export const validateProgram = async (req, res) => {
  const convertSettings = await getProgramConvertSettings();
  const payload = normalizeProgramPayload(req.body, convertSettings);
  const currentProgramId = normalizeString(req.body.currentProgramId);
  const validationError = await validateProgramPayload(payload, {
    checkDuplicate: true,
    excludeProgramId: currentProgramId,
  });

  if (validationError) {
    return sendValidationError(res, validationError);
  }

  return sendOk(res, { message: "Dữ liệu hợp lệ" });
};

export const createProgram = async (req, res) => {
  const convertSettings = await getProgramConvertSettings();
  const payload = normalizeProgramPayload(req.body, convertSettings);
  const validationError = await validateProgramPayload(payload, { checkDuplicate: true });

  if (validationError) {
    return sendValidationError(res, validationError);
  }

  const createdProgram = await Program.create(toProgramCreateData(payload, req.user.sub));

  return sendCreated(res, {
    message: "Lưu form thành công",
    program: createdProgram,
  });
};

export const listPrograms = async (req, res) => {
  const selectedModule = normalizeString(req.query.module);
  const filters = {
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  };

  if (selectedModule && selectedModule !== "all") {
    filters.module = selectedModule;
  }

  const programs = await Program.find(filters)
    .sort({ programCreatedAt: 1, createdAt: 1 })
    .select(
      "contractCode contractName module priority time convert bonusPoint assigner assignee designTaskTitle processingStatus assignedAt receivedAt dueAt completedAt design visible",
    )
    .lean();

  return sendOk(res, {
    programs: programs.map(toProgramListItem),
  });
};

export const listProgramReferences = async (req, res) => {
  const programs = await Program.find({
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  })
    .sort({ programCreatedAt: 1, createdAt: 1 })
    .select(
      "businessContractId contractCode module priority contractName time convert bonusPoint durationValue durationUnit salesReceiverEmail ccEmails",
    )
    .populate({ path: "businessContractId", select: "customerName" })
    .lean();

  return sendOk(res, {
    programs: programs.map(toProgramReferenceItem),
  });
};

export const getProgramById = async (req, res) => {
  const program = await Program.findById(req.params.id).lean();
  if (!program || program.isDeleted) {
    return sendNotFound(res, "Không tìm thấy chương trình");
  }

  return sendOk(res, {
    program: toProgramDetailItem(program),
  });
};

export const updateProgram = async (req, res) => {
  const existingProgram = await Program.findById(req.params.id);
  if (!existingProgram || existingProgram.isDeleted) {
    return sendNotFound(res, "Không tìm thấy chương trình");
  }

  if (
    existingProgram.processingStatus === PROGRAM_TASK_COMPLETED_STATUS &&
    !hasProgramRequestPermission(req, "program.overrideCompleted")
  ) {
    return sendError(res, 403, "Phiếu lập trình đã hoàn thành, chỉ được xem chi tiết");
  }

  const convertSettings = await getProgramConvertSettings();
  const payload = normalizeProgramPayload(req.body, convertSettings);
  const validationError = await validateProgramPayload(payload, {
    checkDuplicate: true,
    excludeProgramId: toProgramObjectIdString(existingProgram._id),
  });

  if (validationError) {
    return sendValidationError(res, validationError);
  }

  applyProgramPayload(existingProgram, payload);
  await existingProgram.save();

  return sendOk(res, {
    message: "Cập nhật form thành công",
    program: existingProgram,
  });
};

export const deleteProgram = async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program || program.isDeleted) {
    return sendNotFound(res, "Không tìm thấy chương trình");
  }

  program.isDeleted = true;
  await program.save();

  return sendOk(res, { message: "Đã xóa chương trình" });
};

export const deletePrograms = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter(Boolean)
    : [];

  const filters =
    ids.length > 0
      ? { _id: { $in: ids }, isDeleted: false }
      : { isDeleted: false, $or: [{ type: "program" }, { type: { $exists: false } }] };
  const result = await Program.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các chương trình đã chọn" : "Đã xóa toàn bộ chương trình",
    deletedCount: result.modifiedCount || 0,
  });
};
