import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import { getSystemSettingsObject } from "../services/systemSettingService.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import {
  normalizeBoolean,
  normalizeDate,
  normalizeNumber,
  normalizeObjectId,
  normalizeString,
} from "../utils/normalize.js";
import { getActiveCategoryNames } from "../utils/system-category.js";

export const PROGRAM_TASK_DURATION_UNITS = ["h", "ngày"];
export const PROGRAM_TASK_COMPLETED_STATUS = "Đã hoàn thành";

export const hasProgramRequestPermission = (req, permission) =>
  Array.isArray(req.userPermissions) && req.userPermissions.includes(permission);

export const normalizeProgramProcessingStatus = (value, statusOptions) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return PROGRAM_TASK_COMPLETED_STATUS;
  if (normalized === "Đã nhận") return "Đã phân công";
  if (!Array.isArray(statusOptions) || statusOptions.length === 0) return normalized;
  return statusOptions.includes(normalized) ? normalized : statusOptions[0];
};

export const parseProgramCcEmails = (ccEmails) => {
  if (!ccEmails) return [];
  if (Array.isArray(ccEmails)) {
    return ccEmails.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(ccEmails)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const formatProgramNumber = (value, roundingDigits = 3) => {
  if (!Number.isFinite(value)) return "";
  const safeDigits = Number.isFinite(Number(roundingDigits))
    ? Math.min(Math.max(Math.trunc(Number(roundingDigits)), 0), 6)
    : 3;

  return Number(value.toFixed(safeDigits)).toString();
};

export const getProgramConvertSettings = async () => {
  const settings = await getSystemSettingsObject();
  return settings?.time || {};
};

export const calculateProgramConvertByDuration = (durationValue, durationUnit, convertSettings = {}) => {
  const workingHoursPerDay = Number(convertSettings.workingHoursPerDay || 8);
  const roundingDigits = Number(convertSettings.roundingDigits ?? 3);

  if (durationUnit === "ngày") return formatProgramNumber(durationValue, roundingDigits);
  if (durationUnit === "h") {
    if (!Number.isFinite(workingHoursPerDay) || workingHoursPerDay <= 0) return "";
    return formatProgramNumber(durationValue / workingHoursPerDay, roundingDigits);
  }

  return "";
};

export const toProgramObjectIdString = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : String(value);
};

export const normalizeProgramPayload = (body = {}, convertSettings = {}) => {
  const module = normalizeString(body.module);
  const durationValue = 0;
  const durationUnit = "ngày";
  const time = "";
  const convert = "0";
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
    note: normalizeString(body.note),
    designTaskId: normalizeString(body.designTaskId) || null,
    designTaskTitle: "",
    contractSnapshot: null,
  };
};

export const validateProgramPayload = async (
  payload,
  { checkDuplicate = true, excludeProgramId = "" } = {},
) => {
  const {
    module,
    priority,
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

  if (!module || !assigner || !assignee) {
    return { status: 400, message: "module, assigner, assignee là bắt buộc" };
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

  payload.processingStatus = normalizeProgramProcessingStatus(payload.processingStatus, statusOptions);
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

  payload.contractSnapshot = {
    contractName: businessContract.contractName || "",
    contractCode: businessContract.contractCode || "",
    contractImages: Array.isArray(businessContract.contractImages) ? businessContract.contractImages : [],
    status: businessContract.status || "Đã nhận",
    mailStatus: businessContract.mailStatus || "Mail nhận",
    selectedSalesStaff: businessContract.selectedSalesStaff || "",
    salesReceiverName: businessContract.salesReceiverName || businessContract.customerName || "",
    salesReceiverEmail: businessContract.salesReceiverEmail || businessContract.customerEmail || "",
    ccEmails: parseProgramCcEmails(businessContract.ccEmails),
  };

  if (payload.processingStatus !== PROGRAM_TASK_COMPLETED_STATUS) {
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
      status: { $in: [PROGRAM_TASK_COMPLETED_STATUS, "Hoàn thành"] },
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
    if (existingProgram && toProgramObjectIdString(existingProgram._id) !== excludeProgramId) {
      return { status: 409, message: "Hợp đồng đã có phiếu gốc lập trình" };
    }
  }

  return null;
};

export const toProgramCreateData = (payload, userId) => ({
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
  note: payload.note,
  contractName: payload.contractSnapshot.contractName,
  contractCode: payload.contractSnapshot.contractCode,
  contractImages: payload.contractSnapshot.contractImages,
  status: payload.contractSnapshot.status,
  mailStatus: payload.contractSnapshot.mailStatus,
  selectedSalesStaff: payload.contractSnapshot.selectedSalesStaff,
  salesReceiverName: payload.contractSnapshot.salesReceiverName,
  salesReceiverEmail: payload.contractSnapshot.salesReceiverEmail,
  ccEmails: payload.contractSnapshot.ccEmails,
  createdBy: userId,
});

export const applyProgramPayload = (program, payload) => {
  program.module = payload.module;
  program.priority = payload.priority;
  program.durationValue = payload.durationValue;
  program.durationUnit = payload.durationUnit;
  program.time = payload.time;
  program.convert = payload.convert;
  program.bonusPoint = payload.bonusPoint;
  program.assigner = payload.assigner;
  program.assignee = payload.assignee;
  program.businessContractId = payload.businessContractId;
  program.designTaskId = payload.designTaskId || null;
  program.designTaskTitle = payload.designTaskTitle || "";
  program.assignedAt = payload.assignedAt;
  program.receivedAt = payload.receivedAt || null;
  program.dueAt = payload.dueAt;
  program.completedAt = payload.completedAt || null;
  program.processingStatus = payload.processingStatus;
  program.design = payload.design;
  program.visible = payload.visible;
  program.note = payload.note;
  program.contractName = payload.contractSnapshot.contractName;
  program.contractCode = payload.contractSnapshot.contractCode;
  program.contractImages = payload.contractSnapshot.contractImages;
  program.status = payload.contractSnapshot.status;
  program.mailStatus = payload.contractSnapshot.mailStatus;
  program.selectedSalesStaff = payload.contractSnapshot.selectedSalesStaff;
  program.salesReceiverName = payload.contractSnapshot.salesReceiverName;
  program.salesReceiverEmail = payload.contractSnapshot.salesReceiverEmail;
  program.ccEmails = payload.contractSnapshot.ccEmails;
};

export const toProgramListItem = (item) => ({
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
  processingStatus: normalizeProgramProcessingStatus(item.processingStatus),
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
  note: item.note || "",
});

export const toProgramReferenceItem = (item) => ({
  id: item._id,
  businessContractId: toProgramObjectIdString(item.businessContractId?._id || item.businessContractId),
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
});

export const toProgramDetailItem = (program) => ({
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
  businessContractId: toProgramObjectIdString(program.businessContractId),
  designTaskId: toProgramObjectIdString(program.designTaskId),
  designTaskTitle: program.designTaskTitle || "",
  assignedAt: toIsoString(program.assignedAt),
  receivedAt: toIsoString(program.receivedAt),
  dueAt: toIsoString(program.dueAt),
  completedAt: toIsoString(program.completedAt),
  processingStatus: normalizeProgramProcessingStatus(program.processingStatus),
  design: program.design,
  visible: program.visible,
  note: program.note || "",
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
});
