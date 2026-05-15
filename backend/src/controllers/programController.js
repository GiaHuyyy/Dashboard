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

export const createProgram = async (req, res) => {
  const module = normalizeString(req.body.module);
  const durationValue = normalizeNumber(req.body.durationValue);
  const durationUnit = normalizeString(req.body.durationUnit);
  const time = durationValue !== null ? `${formatNumber(durationValue)} ${durationUnit}` : "";
  const convert = durationValue !== null ? calculateConvertByDuration(durationValue, durationUnit) : "";
  const design = normalizeBoolean(req.body.design);
  const visible = normalizeBoolean(req.body.visible);
  const contractName = normalizeString(req.body.contractName);
  const contractCode = normalizeString(req.body.contractCode);
  const status = normalizeString(req.body.status);
  const mailStatus = normalizeString(req.body.mailStatus);
  const selectedSalesStaff = normalizeString(req.body.selectedSalesStaff);
  const salesReceiverName = normalizeString(req.body.salesReceiverName);
  const salesReceiverEmail = normalizeString(req.body.salesReceiverEmail).toLowerCase();
  const ccEmails = parseCcEmails(req.body.ccEmails);

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
    return res.status(400).json({
      message:
        "module, durationValue, durationUnit, contractName, contractCode, selectedSalesStaff, salesReceiverName, salesReceiverEmail là bắt buộc",
    });
  }

  if (!MODULE_OPTIONS.includes(module)) {
    return res.status(400).json({
      message: `module không hợp lệ. Giá trị cho phép: ${MODULE_OPTIONS.join(", ")}`,
    });
  }

  if (durationValue <= 0) {
    return res.status(400).json({
      message: "Thời gian phải là số lớn hơn 0",
    });
  }

  if (!DURATION_UNITS.includes(durationUnit)) {
    return res.status(400).json({
      message: `durationUnit không hợp lệ. Giá trị cho phép: ${DURATION_UNITS.join(", ")}`,
    });
  }

  if (!convert) {
    return res.status(400).json({
      message: "Không thể quy đổi thời gian",
    });
  }

  if (design === null || visible === null) {
    return res.status(400).json({ message: "design và visible phải là kiểu boolean" });
  }

  if (contractName.length < CONTRACT_NAME_MIN_LENGTH) {
    return res.status(400).json({
      message: `Tên hợp đồng phải tối thiểu ${CONTRACT_NAME_MIN_LENGTH} ký tự`,
    });
  }

  if (contractCode.length < CONTRACT_CODE_MIN_LENGTH) {
    return res.status(400).json({
      message: `Số hợp đồng phải tối thiểu ${CONTRACT_CODE_MIN_LENGTH} ký tự`,
    });
  }

  if (salesReceiverName.length < SALES_RECEIVER_NAME_MIN_LENGTH) {
    return res.status(400).json({
      message: `Họ tên kinh doanh nhận mail phải tối thiểu ${SALES_RECEIVER_NAME_MIN_LENGTH} ký tự`,
    });
  }

  if (!NAME_REGEX.test(salesReceiverName)) {
    return res.status(400).json({
      message: "Họ tên kinh doanh nhận mail chỉ được chứa chữ và khoảng trắng",
    });
  }

  if (!STATUS_OPTIONS.includes(status)) {
    return res.status(400).json({
      message: `status không hợp lệ. Giá trị cho phép: ${STATUS_OPTIONS.join(", ")}`,
    });
  }

  if (!MAIL_STATUS_OPTIONS.includes(mailStatus)) {
    return res.status(400).json({
      message: `mailStatus không hợp lệ. Giá trị cho phép: ${MAIL_STATUS_OPTIONS.join(", ")}`,
    });
  }

  if (!EMAIL_REGEX.test(salesReceiverEmail)) {
    return res.status(400).json({ message: "salesReceiverEmail không đúng định dạng email" });
  }

  if (!hasValidEmailLocalPart(salesReceiverEmail)) {
    return res.status(400).json({
      message: `Phần trước @ của salesReceiverEmail phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    });
  }

  const invalidCcEmail = ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return res.status(400).json({
      message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}`,
    });
  }

  const invalidCcLocalPart = ccEmails.find((email) => !hasValidEmailLocalPart(email));
  if (invalidCcLocalPart) {
    return res.status(400).json({
      message: `Phần trước @ của email cc phải tối thiểu ${EMAIL_LOCAL_MIN_LENGTH} ký tự và có ít nhất 1 chữ cái`,
    });
  }

  const existingProgram = await Program.findOne({ contractCode });
  if (existingProgram) {
    return res.status(409).json({ message: "Số hợp đồng đã tồn tại" });
  }

  const createdProgram = await Program.create({
    type: "program",
    module,
    time,
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
