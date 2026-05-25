import mongoose from "mongoose";

import BusinessContract from "../models/BusinessContract.js";
import { sendBusinessContractMail } from "../services/businessContractMailService.js";

const HANDOVER_STATUS_OPTIONS = ["Chưa bàn giao", "Đã bàn giao"];
const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeFlag = (value) => value === true || String(value).toLowerCase() === "true";

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
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const parseCcEmails = (ccEmails) => {
  if (!ccEmails) return [];
  if (Array.isArray(ccEmails)) {
    return ccEmails.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(ccEmails)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
const toIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const normalizePayload = (body = {}) => {
  const contractImages = Array.isArray(body.contractImages)
    ? body.contractImages.map((item) => normalizeString(item)).filter(Boolean)
    : [];
  return {
    contractCode: normalizeString(body.contractCode),
    contractName: normalizeString(body.contractName),
    contractValue: normalizeNumber(body.contractValue),
    customerName: normalizeString(body.customerName),
    customerPhone: normalizeString(body.customerPhone),
    customerEmail: normalizeString(body.customerEmail).toLowerCase(),
    status: normalizeString(body.status) || STATUS_OPTIONS[0],
    mailStatus: normalizeString(body.mailStatus) || MAIL_STATUS_OPTIONS[0],
    selectedSalesStaff: normalizeString(body.selectedSalesStaff),
    salesReceiverName: normalizeString(body.salesReceiverName) || normalizeString(body.customerName),
    salesReceiverEmail:
      normalizeString(body.salesReceiverEmail).toLowerCase() || normalizeString(body.customerEmail).toLowerCase(),
    ccEmails: parseCcEmails(body.ccEmails),
    contractImages,
    handoverStatus: normalizeString(body.handoverStatus) || HANDOVER_STATUS_OPTIONS[0],
    handoverAt: normalizeDate(body.handoverAt),
    visible: normalizeBoolean(body.visible),
    note: normalizeString(body.note),
  };
};

const validatePayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.contractCode) return { status: 400, message: "contractCode là bắt buộc" };
  if (!payload.contractName) return { status: 400, message: "contractName là bắt buộc" };
  if (payload.contractValue === null || payload.contractValue < 0)
    return { status: 400, message: "contractValue không hợp lệ" };
  if (!payload.customerName) return { status: 400, message: "customerName là bắt buộc" };
  if (!payload.customerEmail) return { status: 400, message: "customerEmail là bắt buộc" };
  if (!payload.selectedSalesStaff) return { status: 400, message: "selectedSalesStaff là bắt buộc" };

  if (!STATUS_OPTIONS.includes(payload.status)) {
    return { status: 400, message: `status không hợp lệ. Giá trị cho phép: ${STATUS_OPTIONS.join(", ")}` };
  }
  if (!MAIL_STATUS_OPTIONS.includes(payload.mailStatus)) {
    return { status: 400, message: `mailStatus không hợp lệ. Giá trị cho phép: ${MAIL_STATUS_OPTIONS.join(", ")}` };
  }
  if (!HANDOVER_STATUS_OPTIONS.includes(payload.handoverStatus)) {
    return {
      status: 400,
      message: `handoverStatus không hợp lệ. Giá trị cho phép: ${HANDOVER_STATUS_OPTIONS.join(", ")}`,
    };
  }
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  if (payload.customerEmail && !EMAIL_REGEX.test(payload.customerEmail)) {
    return { status: 400, message: "customerEmail không đúng định dạng email" };
  }
  const invalidCcEmail = payload.ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return { status: 400, message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}` };
  }

  const existing = await BusinessContract.findOne({
    contractCode: { $regex: `^${escapeRegex(payload.contractCode)}$`, $options: "i" },
    isDeleted: false,
  })
    .select("_id")
    .lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Số hợp đồng đã tồn tại" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  contractCode: doc.contractCode,
  contractName: doc.contractName,
  contractValue: Number(doc.contractValue) || 0,
  customerName: doc.customerName,
  customerPhone: doc.customerPhone || "",
  customerEmail: doc.customerEmail || "",
  status: doc.status || STATUS_OPTIONS[0],
  mailStatus: doc.mailStatus || MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: doc.selectedSalesStaff || "",
  salesReceiverName: doc.salesReceiverName || "",
  salesReceiverEmail: doc.salesReceiverEmail || "",
  ccEmails: Array.isArray(doc.ccEmails) ? doc.ccEmails : [],
  contractImages: Array.isArray(doc.contractImages) ? doc.contractImages : [],
  handoverStatus: doc.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
  handoverAt: toIsoString(doc.handoverAt),
  handoverAtLabel: formatDateTime(doc.handoverAt),
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatDateTime(doc.createdAt),
});

export const createBusinessContract = async (req, res) => {
  const shouldSendMail = normalizeFlag(req.body.sendMail);
  const payload = normalizePayload({
    ...req.body,
    contractValue: req.body.contractValue ?? 0,
    visible: req.body.visible ?? true,
  });
  payload.salesReceiverName = payload.customerName;
  payload.salesReceiverEmail = payload.customerEmail;
  if (payload.handoverStatus !== "Đã bàn giao") {
    payload.handoverAt = null;
  } else if (!payload.handoverAt) {
    payload.handoverAt = new Date();
  }

  const validation = await validatePayload(payload);
  if (validation) return res.status(validation.status).json({ message: validation.message });

  const created = await BusinessContract.create({
    ...payload,
    createdBy: req.user.sub,
  });

  if (shouldSendMail) {
    try {
      await sendBusinessContractMail({
        contract: toResponseItem(created),
        actionLabel: "Lưu gửi mail",
      });
    } catch (error) {
      return res.status(500).json({
        message: `Đã lưu hợp đồng nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  return res.status(201).json({
    message: shouldSendMail ? "Đã tạo hợp đồng và gửi mail thành công" : "Đã tạo hợp đồng kinh doanh",
    contract: toResponseItem(created),
  });
};

export const listBusinessContracts = async (req, res) => {
  const { search = "", handoverStatus = "all", page = "1", limit = "200" } = req.query;
  const pageNumber = parsePositiveInteger(page) || 1;
  const limitNumber = parsePositiveInteger(limit) || 200;
  const skip = (pageNumber - 1) * limitNumber;

  const filters = { isDeleted: false };
  if (handoverStatus && handoverStatus !== "all") {
    filters.handoverStatus = normalizeString(handoverStatus);
  }

  const keyword = normalizeString(search);
  if (keyword) {
    filters.$or = [
      { contractCode: { $regex: keyword, $options: "i" } },
      { contractName: { $regex: keyword, $options: "i" } },
      { customerName: { $regex: keyword, $options: "i" } },
      { customerPhone: { $regex: keyword, $options: "i" } },
      { customerEmail: { $regex: keyword, $options: "i" } },
      { selectedSalesStaff: { $regex: keyword, $options: "i" } },
      { salesReceiverName: { $regex: keyword, $options: "i" } },
      { salesReceiverEmail: { $regex: keyword, $options: "i" } },
      { note: { $regex: keyword, $options: "i" } },
    ];
  }

  const [items, total] = await Promise.all([
    BusinessContract.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limitNumber).lean(),
    BusinessContract.countDocuments(filters),
  ]);

  return res.json({
    contracts: items.map(toResponseItem),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
    },
  });
};

export const listBusinessContractReferences = async (req, res) => {
  const items = await BusinessContract.find({ isDeleted: false, visible: true })
    .sort({ createdAt: 1 })
    .select(
      "contractCode contractName contractValue customerName status mailStatus selectedSalesStaff salesReceiverName salesReceiverEmail ccEmails contractImages handoverStatus",
    )
    .lean();

  return res.json({
    contracts: items.map((item) => ({
      id: item._id,
      contractCode: item.contractCode || "",
      contractName: item.contractName || "",
      contractValue: Number(item.contractValue) || 0,
      customerName: item.customerName || "",
      status: item.status || STATUS_OPTIONS[0],
      mailStatus: item.mailStatus || MAIL_STATUS_OPTIONS[0],
      selectedSalesStaff: item.selectedSalesStaff || "",
      salesReceiverName: item.salesReceiverName || "",
      salesReceiverEmail: item.salesReceiverEmail || "",
      ccEmails: Array.isArray(item.ccEmails) ? item.ccEmails : [],
      contractImages: Array.isArray(item.contractImages) ? item.contractImages : [],
      handoverStatus: item.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
      label: `${item.contractCode || "N/A"} - ${item.contractName || "N/A"} - ${item.customerName || "N/A"}`,
    })),
  });
};

export const getBusinessContractById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const contract = await BusinessContract.findById(req.params.id).lean();
  if (!contract || contract.isDeleted) return res.status(404).json({ message: "Không tìm thấy hợp đồng kinh doanh" });
  return res.json({ contract: toResponseItem(contract) });
};

export const updateBusinessContract = async (req, res) => {
  const shouldSendMail = normalizeFlag(req.body.sendMail);
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const existing = await BusinessContract.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy hợp đồng kinh doanh" });
  if (existing.handoverStatus === "Đã bàn giao") {
    return res.status(409).json({ message: "Hợp đồng đã bàn giao, chỉ được xem chi tiết" });
  }

  const input = normalizePayload(req.body);
  const mergedPayload = {
    contractCode: input.contractCode || existing.contractCode,
    contractName: input.contractName || existing.contractName,
    contractValue: input.contractValue === null ? Number(existing.contractValue ?? 0) : input.contractValue,
    customerName: input.customerName || existing.customerName,
    customerPhone: typeof req.body.customerPhone === "string" ? input.customerPhone : existing.customerPhone,
    customerEmail: typeof req.body.customerEmail === "string" ? input.customerEmail : existing.customerEmail,
    status: input.status || existing.status || STATUS_OPTIONS[0],
    mailStatus: input.mailStatus || existing.mailStatus || MAIL_STATUS_OPTIONS[0],
    selectedSalesStaff: input.selectedSalesStaff || existing.selectedSalesStaff,
    salesReceiverName: input.customerName || existing.customerName,
    salesReceiverEmail: input.customerEmail || existing.customerEmail,
    ccEmails: req.body.ccEmails !== undefined ? input.ccEmails : existing.ccEmails,
    contractImages: Array.isArray(req.body.contractImages) ? input.contractImages : existing.contractImages,
    handoverStatus: input.handoverStatus || existing.handoverStatus,
    handoverAt: req.body.handoverAt === null ? null : input.handoverAt || existing.handoverAt,
    visible: input.visible === null ? existing.visible : input.visible,
    note: typeof req.body.note === "string" ? input.note : existing.note,
  };

  if (mergedPayload.handoverStatus !== "Đã bàn giao") {
    mergedPayload.handoverAt = null;
  } else if (!mergedPayload.handoverAt) {
    mergedPayload.handoverAt = new Date();
  }

  const validation = await validatePayload(mergedPayload, { excludeId: String(existing._id) });
  if (validation) return res.status(validation.status).json({ message: validation.message });

  existing.contractCode = mergedPayload.contractCode;
  existing.contractName = mergedPayload.contractName;
  existing.contractValue = mergedPayload.contractValue;
  existing.customerName = mergedPayload.customerName;
  existing.customerPhone = mergedPayload.customerPhone;
  existing.customerEmail = mergedPayload.customerEmail;
  existing.status = mergedPayload.status;
  existing.mailStatus = mergedPayload.mailStatus;
  existing.selectedSalesStaff = mergedPayload.selectedSalesStaff;
  existing.salesReceiverName = mergedPayload.salesReceiverName;
  existing.salesReceiverEmail = mergedPayload.salesReceiverEmail;
  existing.ccEmails = mergedPayload.ccEmails;
  existing.contractImages = mergedPayload.contractImages;
  existing.handoverStatus = mergedPayload.handoverStatus;
  existing.handoverAt = mergedPayload.handoverAt;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  if (shouldSendMail) {
    try {
      await sendBusinessContractMail({
        contract: toResponseItem(existing),
        actionLabel: "Cập nhật gửi mail",
      });
    } catch (error) {
      return res.status(500).json({
        message: `Đã cập nhật hợp đồng nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  return res.json({
    message: shouldSendMail ? "Đã cập nhật hợp đồng và gửi mail thành công" : "Đã cập nhật hợp đồng kinh doanh",
    contract: toResponseItem(existing),
  });
};

export const handoverBusinessContract = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const existing = await BusinessContract.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy hợp đồng kinh doanh" });
  if (existing.handoverStatus === "Đã bàn giao") {
    return res.status(409).json({ message: "Hợp đồng đã bàn giao" });
  }

  existing.handoverStatus = "Đã bàn giao";
  existing.handoverAt = existing.handoverAt || new Date();
  await existing.save();

  return res.json({
    message: "Đã bàn giao hợp đồng cho lập trình",
    contract: toResponseItem(existing),
  });
};

export const deleteBusinessContract = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const existing = await BusinessContract.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy hợp đồng kinh doanh" });
  existing.isDeleted = true;
  await existing.save();
  return res.json({ message: "Đã xóa hợp đồng kinh doanh" });
};

export const deleteBusinessContracts = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await BusinessContract.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các hợp đồng đã chọn" : "Đã xóa toàn bộ hợp đồng kinh doanh",
    deletedCount: result.modifiedCount || 0,
  });
};