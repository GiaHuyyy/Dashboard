import Program from "../models/Program.js";

const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

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

export const createProgram = async (req, res) => {
  const contractName = normalizeString(req.body.contractName);
  const contractCode = normalizeString(req.body.contractCode);
  const status = normalizeString(req.body.status);
  const mailStatus = normalizeString(req.body.mailStatus);
  const selectedSalesStaff = normalizeString(req.body.selectedSalesStaff);
  const salesReceiverName = normalizeString(req.body.salesReceiverName);
  const salesReceiverEmail = normalizeString(req.body.salesReceiverEmail).toLowerCase();
  const ccEmails = parseCcEmails(req.body.ccEmails);

  if (!contractName || !contractCode || !selectedSalesStaff || !salesReceiverName || !salesReceiverEmail) {
    return res.status(400).json({
      message:
        "contractName, contractCode, selectedSalesStaff, salesReceiverName, salesReceiverEmail là bắt buộc",
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
