import mongoose from "mongoose";

import BusinessContract from "../models/BusinessContract.js";
import DesignTask from "../models/DesignTask.js";
import Program from "../models/Program.js";
import { sendProgramMail } from "../services/programMailService.js";

const MODULE_OPTIONS = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const DURATION_UNITS = ["h", "ngày"];
const PROCESSING_STATUS_OPTIONS = ["Mới tạo", "Đã phân công", "Đang xử lý", "Đã hoàn thành"];
const COMPLETED_STATUS = "Đã hoàn thành";
const normalizeProcessingStatus = (value) => {
  const normalized = normalizeString(value);
  if (normalized === "Hoàn thành") return COMPLETED_STATUS;
  if (normalized === "Đã nhận") return "Đã phân công";
  return PROCESSING_STATUS_OPTIONS.includes(normalized) ? normalized : PROCESSING_STATUS_OPTIONS[0];
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_LOCAL_MIN_LENGTH = 6;
const EMAIL_LOCAL_HAS_LETTER_REGEX = /[A-Za-zÀ-ỹ]/u;

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
const formatNumber = (value) => {
  if (!Number.isFinite(value)) return "";
  return Number(value.toFixed(3)).toString();
};
const calculateConvertByDuration = (durationValue, durationUnit) => {
  if (durationUnit === "ngày") return formatNumber(durationValue);
  if (durationUnit === "h") return formatNumber(durationValue / 8);
  return "";
};
const hasValidEmailLocalPart = (email) => {
  const localPart = email.split("@")[0] || "";
  if (localPart.length < EMAIL_LOCAL_MIN_LENGTH) return false;
  return EMAIL_LOCAL_HAS_LETTER_REGEX.test(localPart);
};
const formatDateTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
const toObjectIdString = (value) => {
  if (!value) return "";
  return typeof value === "string" ? value : String(value);
};
const toIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const normalizeProgramPayload = (body = {}) => {
  const module = normalizeString(body.module);
  const durationValue = normalizeNumber(body.durationValue);
  const durationUnit = normalizeString(body.durationUnit);
  const time = durationValue !== null ? `${formatNumber(durationValue)} ${durationUnit}` : "";
  const convert = durationValue !== null ? calculateConvertByDuration(durationValue, durationUnit) : "";

  return {
    module,
    durationValue,
    durationUnit,
    time,
    convert,
    assigner: normalizeString(body.assigner),
    assignee: normalizeString(body.assignee),
    businessContractId: normalizeString(body.businessContractId),
    assignedAt: normalizeDate(body.assignedAt),
    receivedAt: normalizeDate(body.receivedAt),
    dueAt: normalizeDate(body.dueAt),
    completedAt: normalizeDate(body.completedAt),
    processingStatus: normalizeProcessingStatus(body.processingStatus),
    design: normalizeBoolean(body.design),
    visible: normalizeBoolean(body.visible),
    designTaskId: normalizeString(body.designTaskId) || null,
    designTaskTitle: "",
    contractSnapshot: null,
  };
};

const validateProgramPayload = async (payload, { checkDuplicate = true, excludeProgramId = "" } = {}) => {
  const { module, durationValue, durationUnit, convert, assigner, assignee, design, visible, designTaskId } = payload;

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
  if (!PROCESSING_STATUS_OPTIONS.includes(payload.processingStatus)) {
    return {
      status: 400,
      message: `processingStatus không hợp lệ. Giá trị cho phép: ${PROCESSING_STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (!MODULE_OPTIONS.includes(module)) {
    return { status: 400, message: `module không hợp lệ. Giá trị cho phép: ${MODULE_OPTIONS.join(", ")}` };
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
  if (design === null || visible === null) {
    return { status: 400, message: "design và visible phải là kiểu boolean" };
  }

  if (!mongoose.isValidObjectId(payload.businessContractId)) {
    return { status: 400, message: "businessContractId không hợp lệ" };
  }
  const businessContract = await BusinessContract.findOne({
    _id: payload.businessContractId,
    isDeleted: false,
  }).lean();
  if (!businessContract) {
    return { status: 404, message: "Không tìm thấy hợp đồng kinh doanh hợp lệ" };
  }

  if (!EMAIL_REGEX.test(businessContract.salesReceiverEmail || "")) {
    return { status: 400, message: "Hợp đồng kinh doanh chưa có salesReceiverEmail hợp lệ" };
  }
  if (!hasValidEmailLocalPart(businessContract.salesReceiverEmail || "")) {
    return {
      status: 400,
      message: `Phần trước @ của salesReceiverEmail phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    };
  }

  const ccEmails = parseCcEmails(businessContract.ccEmails);
  const invalidCcEmail = ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return { status: 400, message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}` };
  }
  const invalidCcLocalPart = ccEmails.find((email) => !hasValidEmailLocalPart(email));
  if (invalidCcLocalPart) {
    return {
      status: 400,
      message: `Phần trước @ của email cc phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    };
  }

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
    if (!mongoose.isValidObjectId(designTaskId)) {
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

const toMailPayload = (payload) => ({
  module: payload.module,
  time: payload.time,
  convert: payload.convert,
  design: payload.design,
  display: payload.visible,
  contractName: payload.contractSnapshot?.contractName || "",
  contractCode: payload.contractSnapshot?.contractCode || "",
  contractImages: payload.contractSnapshot?.contractImages || [],
  status: payload.contractSnapshot?.status || "",
  mailStatus: payload.contractSnapshot?.mailStatus || "",
  selectedSalesStaff: payload.contractSnapshot?.selectedSalesStaff || "",
  salesReceiverName: payload.contractSnapshot?.salesReceiverName || "",
  salesReceiverEmail: payload.contractSnapshot?.salesReceiverEmail || "",
  ccEmails: payload.contractSnapshot?.ccEmails || [],
});

export const validateProgram = async (req, res) => {
  const payload = normalizeProgramPayload(req.body);
  const currentProgramId = normalizeString(req.body.currentProgramId);
  const validationError = await validateProgramPayload(payload, {
    checkDuplicate: true,
    excludeProgramId: currentProgramId,
  });
  if (validationError) {
    return res.status(validationError.status).json({ message: validationError.message });
  }
  return res.json({ message: "Dữ liệu hợp lệ" });
};

export const createProgram = async (req, res) => {
  const shouldSendMail = normalizeBoolean(req.body.sendMail) === true;
  const payload = normalizeProgramPayload(req.body);
  const validationError = await validateProgramPayload(payload, { checkDuplicate: true });
  if (validationError) {
    return res.status(validationError.status).json({ message: validationError.message });
  }

  const createdProgram = await Program.create({
    type: "program",
    module: payload.module,
    time: payload.time,
    durationValue: payload.durationValue,
    durationUnit: payload.durationUnit,
    convert: payload.convert,
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

  if (shouldSendMail) {
    try {
      await sendProgramMail({
        program: toMailPayload(payload),
        actionLabel: "Lưu gửi mail",
      });
    } catch (error) {
      return res.status(500).json({
        message: `Đã lưu form nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  return res.status(201).json({
    message: shouldSendMail ? "Lưu form và gửi mail thành công" : "Lưu form thành công",
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
      "contractCode contractName module time convert assigner assignee designTaskTitle processingStatus assignedAt receivedAt dueAt completedAt design visible",
    )
    .lean();

  return res.json({
    programs: programs.map((item) => ({
      id: item._id,
      contractCode: item.contractCode || "",
      contractName: item.contractName || "",
      module: item.module,
      time: item.time,
      convert: item.convert,
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
    .select("businessContractId contractCode module contractName time convert durationValue durationUnit salesReceiverEmail ccEmails")
    .lean();

  return res.json({
    programs: programs.map((item) => ({
      id: item._id,
      businessContractId: toObjectIdString(item.businessContractId),
      contractCode: item.contractCode,
      contractName: item.contractName,
      module: item.module,
      time: item.time || "",
      convert: item.convert || "",
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
    return res.status(404).json({ message: "Không tìm thấy chương trình" });
  }

  return res.json({
    program: {
      id: program._id,
      module: program.module,
      time: program.time,
      durationValue: program.durationValue,
      durationUnit: program.durationUnit,
      convert: program.convert,
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
  const shouldSendMail = normalizeBoolean(req.body.sendMail) === true;
  const existingProgram = await Program.findById(req.params.id);
  if (!existingProgram || existingProgram.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy chương trình" });
  }

  const payload = normalizeProgramPayload(req.body);
  const validationError = await validateProgramPayload(payload, {
    checkDuplicate: true,
    excludeProgramId: toObjectIdString(existingProgram._id),
  });
  if (validationError) {
    return res.status(validationError.status).json({ message: validationError.message });
  }

  existingProgram.module = payload.module;
  existingProgram.durationValue = payload.durationValue;
  existingProgram.durationUnit = payload.durationUnit;
  existingProgram.time = payload.time;
  existingProgram.convert = payload.convert;
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

  if (shouldSendMail) {
    try {
      await sendProgramMail({
        program: toMailPayload(payload),
        actionLabel: "Cập nhật gửi mail",
      });
    } catch (error) {
      return res.status(500).json({
        message: `Đã cập nhật form nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  return res.json({
    message: shouldSendMail ? "Cập nhật form và gửi mail thành công" : "Cập nhật form thành công",
    program: existingProgram,
  });
};

export const deleteProgram = async (req, res) => {
  const program = await Program.findById(req.params.id);
  if (!program || program.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy chương trình" });
  }

  program.isDeleted = true;
  await program.save();

  return res.json({ message: "Đã xóa chương trình" });
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

  return res.json({
    message: ids.length > 0 ? "Đã xóa các chương trình đã chọn" : "Đã xóa toàn bộ chương trình",
    deletedCount: result.modifiedCount || 0,
  });
};
