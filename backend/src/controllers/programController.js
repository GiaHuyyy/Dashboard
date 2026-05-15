import Program from "../models/Program.js";

const MODULE_OPTIONS = ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"];
const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const TIME_TO_CONVERT_MAP = {
  "0.1": "0",
  "1 ngày": "1",
  "1.2 ngày": "1.2",
  "1.5 ngày": "1.5",
  "2 h": "0.25",
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
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
  const time = normalizeString(req.body.time);
  const convert = TIME_TO_CONVERT_MAP[time] || "";
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
    !time ||
    !contractName ||
    !contractCode ||
    !selectedSalesStaff ||
    !salesReceiverName ||
    !salesReceiverEmail
  ) {
    return res.status(400).json({
      message:
        "module, time, contractName, contractCode, selectedSalesStaff, salesReceiverName, salesReceiverEmail là bắt buộc",
    });
  }

  if (!MODULE_OPTIONS.includes(module)) {
    return res.status(400).json({
      message: `module không hợp lệ. Giá trị cho phép: ${MODULE_OPTIONS.join(", ")}`,
    });
  }

  if (!convert) {
    return res.status(400).json({
      message: `time không hợp lệ. Giá trị cho phép: ${Object.keys(TIME_TO_CONVERT_MAP).join(", ")}`,
    });
  }

  if (design === null || visible === null) {
    return res.status(400).json({ message: "design và visible phải là kiểu boolean" });
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

  const invalidCcEmail = ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return res.status(400).json({
      message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}`,
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
