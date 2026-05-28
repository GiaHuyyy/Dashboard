import mongoose from "mongoose";

import SslPrice from "../models/SslPrice.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const SSL_TYPES = ["DV", "OV", "EV", "Wildcard"];
const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  sslType: normalizeString(body.sslType),
  validityMonths: normalizeNumber(body.validityMonths),
  warrantyAmount: normalizeNumber(body.warrantyAmount),
  price: normalizeNumber(body.price),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.name) return { status: 400, message: "name là bắt buộc" };
  if (!SSL_TYPES.includes(payload.sslType)) return { status: 400, message: "sslType không hợp lệ" };
  if (payload.validityMonths === null || payload.validityMonths <= 0) {
    return { status: 400, message: "validityMonths không hợp lệ" };
  }
  if (payload.warrantyAmount === null || payload.warrantyAmount < 0) {
    return { status: 400, message: "warrantyAmount không hợp lệ" };
  }
  if (payload.price === null || payload.price < 0) {
    return { status: 400, message: "price không hợp lệ" };
  }
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const existing = await SslPrice.findOne({
    name: { $regex: `^${escapeRegex(payload.name)}$`, $options: "i" },
    sslType: payload.sslType,
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Gói SSL đã tồn tại" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name,
  sslType: doc.sslType,
  validityMonths: doc.validityMonths,
  warrantyAmount: doc.warrantyAmount,
  price: doc.price,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listSslPrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { sslType: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = Math.min(parsePositiveInteger(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    SslPrice.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    SslPrice.countDocuments(filters),
  ]);

  return sendOk(res, { sslPrices: items.map(toResponseItem), total, page, limit });
};

export const getSslPriceById = async (req, res) => {
  const item = await SslPrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá SSL");
  }
  return sendOk(res, { sslPrice: toResponseItem(item) });
};

export const createSslPrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await SslPrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm bảng giá SSL",
    sslPrice: toResponseItem(created),
  });
};

export const updateSslPrice = async (req, res) => {
  const existing = await SslPrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá SSL");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    name: normalizedInput.name || existing.name,
    sslType: normalizedInput.sslType || existing.sslType,
    validityMonths: normalizedInput.validityMonths === null ? existing.validityMonths : normalizedInput.validityMonths,
    warrantyAmount: normalizedInput.warrantyAmount === null ? existing.warrantyAmount : normalizedInput.warrantyAmount,
    price: normalizedInput.price === null ? existing.price : normalizedInput.price,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

  existing.name = mergedPayload.name;
  existing.sslType = mergedPayload.sslType;
  existing.validityMonths = mergedPayload.validityMonths;
  existing.warrantyAmount = mergedPayload.warrantyAmount;
  existing.price = mergedPayload.price;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật bảng giá SSL",
    sslPrice: toResponseItem(existing),
  });
};

export const deleteSslPrice = async (req, res) => {
  const item = await SslPrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá SSL");
  }
  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa bảng giá SSL" });
};

export const deleteSslPrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await SslPrice.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các bảng giá SSL đã chọn" : "Đã xóa toàn bộ bảng giá SSL",
    deletedCount: result.modifiedCount || 0,
  });
};