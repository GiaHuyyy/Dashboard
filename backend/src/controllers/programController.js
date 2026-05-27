
import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import { getSystemSettingsObject } from "../services/systemSettingService.js";
import { getActiveCategoryNames } from "../utils/system-category.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import { normalizeBoolean, normalizeDate, normalizeNumber, normalizeObjectId, normalizeString } from "../utils/normalize.js";
import { sendCreated, sendError, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const DURATION_UNITS = ["h", "ngày"];
const COMPLETED_STATUS = "Đã hoàn thành";
const hasRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);
const normalizeProcessingStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return COMPLETED_STATUS;
  if (normalized === "Đã nhận") return "Đã phân công";
  if (!Array.isArray(statusOptions) || statusOptions.length === 0) return normalized;
  return statusOptions.includes(normalized) ? normalized : statusOptions[0];
};
const parseCcEmails = (ccEmails) => {
  if (!ccEmails) return [];
  if (Array.isArray(ccEmails)) {
    return ccEmails.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(ccEmails)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

  if (durationUnit === "ngày") return formatNumber(durationValue, roundingDigits);
  if (durationUnit === "h") {
    if (!Number.isFinite(workingHoursPerDay) || workingHoursPerDay <= 0) return "";
    return formatNumber(durationValue / workingHoursPerDay, roundingDigits);
  }
  return "";
};
const toObjectIdString = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : String(value);
};
const normalizeProgramPayload = (body = {}, convertSettings = {}) => {
  const module = normalizeString(body.module);
  const durationValue = normalizeNumber(body.durationValue);
  const durationUnit = normalizeString(body.durationUnit);
  const time = durationValue !== null ? `${formatNumber(durationValue, convertSettings.roundingDigits)} ${durationUnit}` : "";
  const convert = durationValue !== null ? calculateConvertByDuration(durationValue, durationUnit, convertSettings) : "";
  const bonusPoint = normalizeNumber(body.bonusPoint);

  return {
    module,
    priority: normalizeString(body.priority),
    durationValue,
    durationUnit,
    time,
    convert,
    bonusPoint,
    assigner: normalizeString(body.assigner),
    assignee: normalizeString(body.assignee),
    businessContractId: normalizeString(body.businessContractId),
    assignedAt: normalizeDate(body.assignedAt),
    receivedAt: normalizeDate(body.receivedAt),
    dueAt: normalizeDate(body.dueAt),
    completedAt: normalizeDate(body.completedAt),
    processingStatus: normalizeString(body.processingStatus),
    design: normalizeBoolean(body.design),
    visible: normalizeBoolean(body.visible),
    designTaskId: normalizeString(body.designTaskId) || null,
    designTaskTitle: "",
    contractSnapshot: null,
  };
};

const validateProgramPayload = async (payload, { checkDuplicate = true, excludeProgramId = "" } = {}) => {
  const {
    module,
    priority,
    durationValue,
    durationUnit,
    convert,
    bonusPoint,
    assigner,
    assignee,
    design,
    visible,
    designTaskId,
  } = payload;

  const [moduleOptions, statusOptions, priorityOptions] = await Promise.all([
    getActiveCategoryNames("module"),
    getActiveCategoryNames("status"),
    getActiveCategoryNames("priority"),
  ]);

  if (moduleOptions.length === 0) {
    return { status: 400, message: "Danh mục module chưa được cấu hình" };
  }
  if (statusOptions.length === 0) {
    return { status: 400, message: "Danh mục trạng thái chưa được cấu hình" };
  }
  if (priorityOptions.length === 0) {
    return { status: 400, message: "Danh mục ưu tiên chưa được cấu hình" };
  }

  if (!module || durationValue === null || !durationUnit || !assigner || !assignee) {
    return { status: 400, message: "module, durationValue, durationUnit, assigner, assignee là bắt buộc" };
  }
  if (!payload.businessContractId) {
    return { status: 400, message: "businessContractId là bắt buộc" };
  }
  if (!payload.assignedAt) {
    return { status: 400, message: "assignedAt là bắt buộc" };
  }
  if (!payload.dueAt) {
    return { status: 400, message: "dueAt là bắt buộc" };
  }
  payload.processingStatus = normalizeProcessingStatus(payload.processingStatus, statusOptions);
  if (!statusOptions.includes(payload.processingStatus)) {
    return {
      status: 400,
      message: `processingStatus không hợp lệ. Giá trị cho phép: ${statusOptions.join(", ")}`,
    };
  }

  if (!moduleOptions.includes(module)) {
    return { status: 400, message: `module không hợp lệ. Giá trị cho phép: ${moduleOptions.join(", ")}` };
  }
  if (!priorityOptions.includes(priority)) {
    return { status: 400, message: `priority không hợp lệ. Giá trị cho phép: ${priorityOptions.join(", ")}` };
  }
  if (durationValue <= 0) {
    return { status: 400, message: "Thời gian phải là số lớn hơn 0" };
  }
  if (!DURATION_UNITS.includes(durationUnit)) {
    return { status: 400, message: `durationUnit không hợp lệ. Giá trị cho phép: ${DURATION_UNITS.join(", ")}` };
  }
  if (!convert) {
    return { status: 400, message: "Không thể quy đổi thời gian" };
  }
  if (bonusPoint === null || bonusPoint < 0) {
    return { status: 400, message: "bonusPoint không hợp lệ" };
  }
  if (design === null || visible === null) {
    return { status: 400, message: "design và visible phải là kiểu boolean" };
  }

  if (!normalizeObjectId(payload.businessContractId)) {
    return { status: 400, message: "businessContractId không hợp lệ" };
  }
  const businessContract = await BusinessContract.findOne({
    _id: payload.businessContractId,
    isDeleted: false,
  }).lean();
  if (!businessContract) {
    return { status: 404, message: "Không tìm thấy hợp đồng kinh doanh hợp lệ" };
  }

  const ccEmails = parseCcEmails(businessContract.ccEmails);

  payload.contractSnapshot = {
    contractName: businessContract.contractName || "",
    contractCode: businessContract.contractCode || "",
    contractImages: Array.isArray(businessContract.contractImages) ? businessContract.contractImages : [],
    status: businessContract.status || "Đã nhận",
    mailStatus: businessContract.mailStatus || "Mail nhận",
    selectedSalesStaff: businessContract.selectedSalesStaff || "",
    salesReceiverName: businessContract.salesReceiverName || "",
    salesReceiverEmail: businessContract.salesReceiverEmail || "",
    ccEmails,
  };

  if (payload.processingStatus !== COMPLETED_STATUS) {
    payload.completedAt = null;
  }

  if (design) {
    if (!designTaskId) {
      return { status: 400, message: "Vui lòng chọn thiết kế tham chiếu" };
    }
    if (!normalizeObjectId(designTaskId)) {
      return { status: 400, message: "Thiết kế tham chiếu không hợp lệ" };
    }
    const designTask = await DesignTask.findOne({
      _id: designTaskId,
      isDeleted: false,
      status: { $in: [COMPLETED_STATUS, "Hoàn thành"] },
    })
      .select("title")
      .lean();
    if (!designTask) {
      return { status: 400, message: "Thiết kế tham chiếu không tồn tại hoặc chưa hoàn thành" };
    }
    payload.designTaskTitle = designTask.title || "";
  } else {
    payload.designTaskId = null;
    payload.designTaskTitle = "";
  }

  if (checkDuplicate) {
    const existingProgram = await Program.findOne({
      isDeleted: false,
      businessContractId: payload.businessContractId,
      $or: [{ type: "program" }, { type: { $exists: false } }],
    });
    if (existingProgram && toObjectIdString(existingProgram._id) !== excludeProgramId) {
      return { status: 409, message: "Hợp đồng đã có phiếu gốc lập trình" };
    }
  }

  return null;
};


export const validateProgram = async (req, res) => {
  const convertSettings = await getConvertSettings();
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
  const convertSettings = await getConvertSettings();
  const payload = normalizeProgramPayload(req.body, convertSettings);
  const validationError = await validateProgramPayload(payload, { checkDuplicate: true });
  if (validationError) {
    return sendValidationError(res, validationError);
  }

  const createdProgram = await Program.create({
    type: "program",
    module: payload.module,
    priority: payload.priority,
    time: payload.time,
    durationValue: payload.durationValue,
    durationUnit: payload.durationUnit,
    convert: payload.convert,
    bonusPoint: payload.bonusPoint,
    assigner: payload.assigner,
    assignee: payload.assignee,
    businessContractId: payload.businessContractId,
    designTaskId: payload.designTaskId || null,
    designTaskTitle: payload.designTaskTitle || "",
    assignedAt: payload.assignedAt,
    receivedAt: payload.receivedAt || null,
    dueAt: payload.dueAt,
    completedAt: payload.completedAt || null,
    processingStatus: payload.processingStatus,
    design: payload.design,
    visible: payload.visible,
    contractName: payload.contractSnapshot.contractName,
    contractCode: payload.contractSnapshot.contractCode,
    contractImages: payload.contractSnapshot.contractImages,
    status: payload.contractSnapshot.status,
    mailStatus: payload.contractSnapshot.mailStatus,
    selectedSalesStaff: payload.contractSnapshot.selectedSalesStaff,
    salesReceiverName: payload.contractSnapshot.salesReceiverName,
    salesReceiverEmail: payload.contractSnapshot.salesReceiverEmail,
    ccEmails: payload.contractSnapshot.ccEmails,
    createdBy: req.user.sub,
  });

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
      "contractCode contractName module priority time convert assigner assignee designTaskTitle processingStatus assignedAt receivedAt dueAt completedAt design visible",
    )
    .lean();

  return sendOk(res, {
    programs: programs.map((item) => ({
      id: item._id,
      contractCode: item.contractCode || "",
      contractName: item.contractName || "",
      module: item.module,
      priority: item.priority || "",
      time: item.time,
      convert: item.convert,
      bonusPoint: Number(item.bonusPoint || 0),
      assigner: item.assigner || "",
      assignee: item.assignee || "",
      designTaskTitle: item.designTaskTitle || "",
      processingStatus: normalizeProcessingStatus(item.processingStatus),
      assignedAt: toIsoString(item.assignedAt),
      assignedAtLabel: formatDateTime(item.assignedAt),
      receivedAt: toIsoString(item.receivedAt),
      receivedAtLabel: formatDateTime(item.receivedAt),
      dueAt: toIsoString(item.dueAt),
      dueAtLabel: formatDateTime(item.dueAt),
      completedAt: toIsoString(item.completedAt),
      completedAtLabel: formatDateTime(item.completedAt),
      design: item.design,
      visible: item.visible,
    })),
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
    programs: programs.map((item) => ({
      id: item._id,
      businessContractId: toObjectIdString(item.businessContractId?._id || item.businessContractId),
      contractCode: item.contractCode,
      contractName: item.contractName,
      customerName: item.businessContractId?.customerName || "",
      module: item.module,
      priority: item.priority || "",
      time: item.time || "",
      convert: item.convert || "",
      bonusPoint: Number(item.bonusPoint || 0),
      durationValue: item.durationValue ?? null,
      durationUnit: item.durationUnit || "",
      salesReceiverEmail: item.salesReceiverEmail || "",
      ccEmails: Array.isArray(item.ccEmails) ? item.ccEmails : [],
    })),
  });
};

export const getProgramById = async (req, res) => {
  const program = await Program.findById(req.params.id).lean();
  if (!program || program.isDeleted) {
    return sendNotFound(res, "Không tìm thấy chương trình");
  }

  return sendOk(res, {
    program: {
      id: program._id,
      module: program.module,
      priority: program.priority || "",
      time: program.time,
      durationValue: program.durationValue,
      durationUnit: program.durationUnit,
      convert: program.convert,
      bonusPoint: Number(program.bonusPoint || 0),
      assigner: program.assigner || "",
      assignee: program.assignee || "",
      businessContractId: toObjectIdString(program.businessContractId),
      designTaskId: toObjectIdString(program.designTaskId),
      designTaskTitle: program.designTaskTitle || "",
      assignedAt: toIsoString(program.assignedAt),
      receivedAt: toIsoString(program.receivedAt),
      dueAt: toIsoString(program.dueAt),
      completedAt: toIsoString(program.completedAt),
      processingStatus: normalizeProcessingStatus(program.processingStatus),
      design: program.design,
      visible: program.visible,
      contractName: program.contractName,
      contractCode: program.contractCode,
      contractImages: Array.isArray(program.contractImages) ? program.contractImages : [],
      status: program.status,
      mailStatus: program.mailStatus,
      selectedSalesStaff: program.selectedSalesStaff,
      salesReceiverName: program.salesReceiverName,
      salesReceiverEmail: program.salesReceiverEmail,
      ccEmails: Array.isArray(program.ccEmails) ? program.ccEmails : [],
      createdAt: formatDateTime(program.programCreatedAt || program.createdAt),
    },
  });
};

export const updateProgram = async (req, res) => {
  const existingProgram = await Program.findById(req.params.id);
  if (!existingProgram || existingProgram.isDeleted) {
    return sendNotFound(res, "Không tìm thấy chương trình");
  }

  if (existingProgram.processingStatus === COMPLETED_STATUS && !hasRequestPermission(req, "program.overrideCompleted")) {
    return sendError(res, 403, "Phiếu lập trình đã hoàn thành, chỉ được xem chi tiết");
  }

  const convertSettings = await getConvertSettings();
  const payload = normalizeProgramPayload(req.body, convertSettings);
  const validationError = await validateProgramPayload(payload, {
    checkDuplicate: true,
    excludeProgramId: toObjectIdString(existingProgram._id),
  });
  if (validationError) {
    return sendValidationError(res, validationError);
  }

  existingProgram.module = payload.module;
  existingProgram.priority = payload.priority;
  existingProgram.durationValue = payload.durationValue;
  existingProgram.durationUnit = payload.durationUnit;
  existingProgram.time = payload.time;
  existingProgram.convert = payload.convert;
  existingProgram.bonusPoint = payload.bonusPoint;
  existingProgram.assigner = payload.assigner;
  existingProgram.assignee = payload.assignee;
  existingProgram.businessContractId = payload.businessContractId;
  existingProgram.designTaskId = payload.designTaskId || null;
  existingProgram.designTaskTitle = payload.designTaskTitle || "";
  existingProgram.assignedAt = payload.assignedAt;
  existingProgram.receivedAt = payload.receivedAt || null;
  existingProgram.dueAt = payload.dueAt;
  existingProgram.completedAt = payload.completedAt || null;
  existingProgram.processingStatus = payload.processingStatus;
  existingProgram.design = payload.design;
  existingProgram.visible = payload.visible;
  existingProgram.contractName = payload.contractSnapshot.contractName;
  existingProgram.contractCode = payload.contractSnapshot.contractCode;
  existingProgram.contractImages = payload.contractSnapshot.contractImages;
  existingProgram.status = payload.contractSnapshot.status;
  existingProgram.mailStatus = payload.contractSnapshot.mailStatus;
  existingProgram.selectedSalesStaff = payload.contractSnapshot.selectedSalesStaff;
  existingProgram.salesReceiverName = payload.contractSnapshot.salesReceiverName;
  existingProgram.salesReceiverEmail = payload.contractSnapshot.salesReceiverEmail;
  existingProgram.ccEmails = payload.contractSnapshot.ccEmails;

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
