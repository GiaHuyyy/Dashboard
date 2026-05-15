import Program from "../models/Program.js";

const MODULE_OPTIONS = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const DURATION_UNITS = ["h", "ngày"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[\p{L}\s]+$/u;
const CONTRACT_NAME_MIN_LENGTH = 4;
const CONTRACT_CODE_MIN_LENGTH = 6;
const SALES_RECEIVER_NAME_MIN_LENGTH = 4;
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

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  if (localPart.length < EMAIL_LOCAL_MIN_LENGTH) {
    return false;
  }
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

const normalizeProgramPayload = (body) => {
  const module = normalizeString(body.module);
  const durationValue = normalizeNumber(body.durationValue);
  const durationUnit = normalizeString(body.durationUnit);
  const time = durationValue !== null ? `${formatNumber(durationValue)} ${durationUnit}` : "";
  const convert = durationValue !== null ? calculateConvertByDuration(durationValue, durationUnit) : "";
  const design = normalizeBoolean(body.design);
  const visible = normalizeBoolean(body.visible);
  const contractName = normalizeString(body.contractName);
  const contractCode = normalizeString(body.contractCode);
  const contractImages = Array.isArray(body.contractImages)
    ? body.contractImages.map((img) => normalizeString(img)).filter(Boolean)
    : [];
  const status = normalizeString(body.status);
  const mailStatus = normalizeString(body.mailStatus);
  const selectedSalesStaff = normalizeString(body.selectedSalesStaff);
  const salesReceiverName = normalizeString(body.salesReceiverName);
  const salesReceiverEmail = normalizeString(body.salesReceiverEmail).toLowerCase();
  const ccEmails = parseCcEmails(body.ccEmails);

  return {
    module,
    durationValue,
    durationUnit,
    time,
    convert,
    design,
    visible,
    contractName,
    contractCode,
    contractImages,
    status,
    mailStatus,
    selectedSalesStaff,
    salesReceiverName,
    salesReceiverEmail,
    ccEmails,
  };
};

const validateProgramPayload = async (payload, { checkDuplicate = true, excludeProgramId = "" } = {}) => {
  const {
    module,
    durationValue,
    durationUnit,
    convert,
    design,
    visible,
    contractName,
    contractCode,
    status,
    mailStatus,
    selectedSalesStaff,
    salesReceiverName,
    salesReceiverEmail,
    ccEmails,
  } = payload;

  if (
    !module ||
    durationValue === null ||
    !durationUnit ||
    !contractName ||
    !contractCode ||
    !selectedSalesStaff ||
    !salesReceiverName ||
    !salesReceiverEmail
  ) {
    return {
      status: 400,
      message:
        "module, durationValue, durationUnit, contractName, contractCode, selectedSalesStaff, salesReceiverName, salesReceiverEmail là bắt buộc",
    };
  }

  if (!MODULE_OPTIONS.includes(module)) {
    return {
      status: 400,
      message: `module không hợp lệ. Giá trị cho phép: ${MODULE_OPTIONS.join(", ")}`,
    };
  }

  if (durationValue <= 0) {
    return { status: 400, message: "Thời gian phải là số lớn hơn 0" };
  }

  if (!DURATION_UNITS.includes(durationUnit)) {
    return {
      status: 400,
      message: `durationUnit không hợp lệ. Giá trị cho phép: ${DURATION_UNITS.join(", ")}`,
    };
  }

  if (!convert) {
    return { status: 400, message: "Không thể quy đổi thời gian" };
  }

  if (design === null || visible === null) {
    return { status: 400, message: "design và visible phải là kiểu boolean" };
  }

  if (contractName.length < CONTRACT_NAME_MIN_LENGTH) {
    return { status: 400, message: `Tên hợp đồng phải tối thiểu ${CONTRACT_NAME_MIN_LENGTH} ký tự` };
  }

  if (contractCode.length < CONTRACT_CODE_MIN_LENGTH) {
    return { status: 400, message: `Số hợp đồng phải tối thiểu ${CONTRACT_CODE_MIN_LENGTH} ký tự` };
  }

  if (salesReceiverName.length < SALES_RECEIVER_NAME_MIN_LENGTH) {
    return {
      status: 400,
      message: `Họ tên kinh doanh nhận mail phải tối thiểu ${SALES_RECEIVER_NAME_MIN_LENGTH} ký tự`,
    };
  }

  if (!NAME_REGEX.test(salesReceiverName)) {
    return {
      status: 400,
      message: "Họ tên kinh doanh nhận mail chỉ được chứa chữ và khoảng trắng",
    };
  }

  if (!STATUS_OPTIONS.includes(status)) {
    return {
      status: 400,
      message: `status không hợp lệ. Giá trị cho phép: ${STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (!MAIL_STATUS_OPTIONS.includes(mailStatus)) {
    return {
      status: 400,
      message: `mailStatus không hợp lệ. Giá trị cho phép: ${MAIL_STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (!EMAIL_REGEX.test(salesReceiverEmail)) {
    return { status: 400, message: "salesReceiverEmail không đúng định dạng email" };
  }

  if (!hasValidEmailLocalPart(salesReceiverEmail)) {
    return {
      status: 400,
      message: `Phần trước @ của salesReceiverEmail phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    };
  }

  const invalidCcEmail = ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return {
      status: 400,
      message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}`,
    };
  }

  const invalidCcLocalPart = ccEmails.find((email) => !hasValidEmailLocalPart(email));
  if (invalidCcLocalPart) {
    return {
      status: 400,
      message: `Phần trước @ của email cc phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    };
  }

  if (checkDuplicate) {
    const existingProgram = await Program.findOne({
      contractCode: { $regex: `^${escapeRegex(contractCode)}$`, $options: "i" },
    });
    if (existingProgram && toObjectIdString(existingProgram._id) !== excludeProgramId) {
      return { status: 409, message: "Số hợp đồng đã tồn tại" };
    }
  }

  return null;
};

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
  const payload = normalizeProgramPayload(req.body);
  const validationError = await validateProgramPayload(payload, { checkDuplicate: true });
  if (validationError) {
    return res.status(validationError.status).json({ message: validationError.message });
  }

  const createdProgram = await Program.create({
    type: "program",
    ...payload,
    createdBy: req.user.sub,
  });

  return res.status(201).json({
    message: "Lưu form thành công",
    program: createdProgram,
  });
};

export const listPrograms = async (req, res) => {
  const selectedModule = normalizeString(req.query.module);

  const filters = {
    $or: [{ type: "program" }, { type: { $exists: false } }],
  };
  if (selectedModule && selectedModule !== "all") {
    filters.module = selectedModule;
  }

  const programs = await Program.find(filters)
    .sort({ programCreatedAt: -1, createdAt: -1 })
    .select("module time convert programCreatedAt design visible")
    .lean();

  return res.json({
    programs: programs.map((item) => ({
      id: item._id,
      module: item.module,
      time: item.time,
      convert: item.convert,
      createdAt: formatDateTime(item.programCreatedAt || item.createdAt),
      design: item.design,
      visible: item.visible,
    })),
  });
};

export const getProgramById = async (req, res) => {
  const program = await Program.findById(req.params.id).lean();
  if (!program) {
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
  if (!existingProgram) {
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
  existingProgram.design = payload.design;
  existingProgram.visible = payload.visible;
  existingProgram.contractName = payload.contractName;
  existingProgram.contractCode = payload.contractCode;
  existingProgram.contractImages = payload.contractImages;
  existingProgram.status = payload.status;
  existingProgram.mailStatus = payload.mailStatus;
  existingProgram.selectedSalesStaff = payload.selectedSalesStaff;
  existingProgram.salesReceiverName = payload.salesReceiverName;
  existingProgram.salesReceiverEmail = payload.salesReceiverEmail;
  existingProgram.ccEmails = payload.ccEmails;

  await existingProgram.save();

  return res.json({
    message: "Cập nhật form thành công",
    program: existingProgram,
  });
};
