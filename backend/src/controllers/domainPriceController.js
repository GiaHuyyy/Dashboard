import mongoose from "mongoose";

import DomainPrice from "../models/DomainPrice.js";

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
const formatDateTime = (value) => {
  if (!value) return "";
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

const normalizePayload = (body = {}) => ({
  extension: normalizeString(body.extension),
  provider: normalizeString(body.provider),
  registerPrice: normalizeNumber(body.registerPrice),
  renewalPrice: normalizeNumber(body.renewalPrice),
  transferPrice: normalizeNumber(body.transferPrice),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.extension) return { status: 400, message: "extension là bắt buộc" };
  if (!payload.provider) return { status: 400, message: "provider là bắt buộc" };
  if (payload.registerPrice === null || payload.registerPrice < 0)
    return { status: 400, message: "registerPrice không hợp lệ" };
  if (payload.renewalPrice === null || payload.renewalPrice < 0)
    return { status: 400, message: "renewalPrice không hợp lệ" };
  if (payload.transferPrice === null || payload.transferPrice < 0)
    return { status: 400, message: "transferPrice không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const existing = await DomainPrice.findOne({
    extension: { $regex: `^${payload.extension.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Tên miền đã tồn tại trong bảng giá" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  extension: doc.extension,
  provider: doc.provider,
  registerPrice: doc.registerPrice,
  renewalPrice: doc.renewalPrice,
  transferPrice: doc.transferPrice,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listDomainPrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [
      { extension: { $regex: search, $options: "i" } },
      { provider: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }
  const items = await DomainPrice.find(filters).sort({ createdAt: 1 }).lean();
  return res.json({ domainPrices: items.map(toResponseItem) });
};

export const getDomainPriceById = async (req, res) => {
  const item = await DomainPrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy bảng giá tên miền" });
  }
  return res.json({ domainPrice: toResponseItem(item) });
};

export const createDomainPrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  const created = await DomainPrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return res.status(201).json({
    message: "Đã thêm bảng giá tên miền",
    domainPrice: toResponseItem(created),
  });
};

export const updateDomainPrice = async (req, res) => {
  const existing = await DomainPrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy bảng giá tên miền" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    extension: normalizedInput.extension || existing.extension,
    provider: normalizedInput.provider || existing.provider,
    registerPrice: normalizedInput.registerPrice === null ? existing.registerPrice : normalizedInput.registerPrice,
    renewalPrice: normalizedInput.renewalPrice === null ? existing.renewalPrice : normalizedInput.renewalPrice,
    transferPrice: normalizedInput.transferPrice === null ? existing.transferPrice : normalizedInput.transferPrice,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  existing.extension = mergedPayload.extension;
  existing.provider = mergedPayload.provider;
  existing.registerPrice = mergedPayload.registerPrice;
  existing.renewalPrice = mergedPayload.renewalPrice;
  existing.transferPrice = mergedPayload.transferPrice;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return res.json({
    message: "Đã cập nhật bảng giá tên miền",
    domainPrice: toResponseItem(existing),
  });
};

export const deleteDomainPrice = async (req, res) => {
  const item = await DomainPrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy bảng giá tên miền" });
  }
  item.isDeleted = true;
  await item.save();
  return res.json({ message: "Đã xóa bảng giá tên miền" });
};

export const deleteDomainPrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await DomainPrice.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các bảng giá tên miền đã chọn" : "Đã xóa toàn bộ bảng giá tên miền",
    deletedCount: result.modifiedCount || 0,
  });
};
