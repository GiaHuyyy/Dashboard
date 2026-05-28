import mongoose from "mongoose";

import HostPrice from "../models/HostPrice.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  storage: normalizeString(body.storage),
  monthlyPrice: normalizeNumber(body.monthlyPrice),
  yearlyPrice1: normalizeNumber(body.yearlyPrice1),
  yearlyPrice2: normalizeNumber(body.yearlyPrice2),
  yearlyPrice3: normalizeNumber(body.yearlyPrice3),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.name) return { status: 400, message: "name là bắt buộc" };
  if (!payload.storage) return { status: 400, message: "storage là bắt buộc" };
  if (payload.monthlyPrice === null || payload.monthlyPrice < 0) {
    return { status: 400, message: "monthlyPrice không hợp lệ" };
  }
  if (payload.yearlyPrice1 === null || payload.yearlyPrice1 < 0) {
    return { status: 400, message: "yearlyPrice1 không hợp lệ" };
  }
  if (payload.yearlyPrice2 === null || payload.yearlyPrice2 < 0) {
    return { status: 400, message: "yearlyPrice2 không hợp lệ" };
  }
  if (payload.yearlyPrice3 === null || payload.yearlyPrice3 < 0) {
    return { status: 400, message: "yearlyPrice3 không hợp lệ" };
  }
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const existing = await HostPrice.findOne({
    name: { $regex: `^${escapeRegex(payload.name)}$`, $options: "i" },
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Tên hosting đã tồn tại" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name,
  storage: doc.storage,
  monthlyPrice: doc.monthlyPrice,
  yearlyPrice1: doc.yearlyPrice1,
  yearlyPrice2: doc.yearlyPrice2,
  yearlyPrice3: doc.yearlyPrice3,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listHostPrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { storage: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = Math.min(parsePositiveInteger(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    HostPrice.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    HostPrice.countDocuments(filters),
  ]);

  return sendOk(res, { hostPrices: items.map(toResponseItem), total, page, limit });
};

export const getHostPriceById = async (req, res) => {
  const item = await HostPrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá host");
  }
  return sendOk(res, { hostPrice: toResponseItem(item) });
};

export const createHostPrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) {
    return sendValidationError(res, validationError);
  }

  const created = await HostPrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm bảng giá host",
    hostPrice: toResponseItem(created),
  });
};

export const updateHostPrice = async (req, res) => {
  const existing = await HostPrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá host");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    name: normalizedInput.name || existing.name,
    storage: normalizedInput.storage || existing.storage,
    monthlyPrice: normalizedInput.monthlyPrice === null ? existing.monthlyPrice : normalizedInput.monthlyPrice,
    yearlyPrice1: normalizedInput.yearlyPrice1 === null ? existing.yearlyPrice1 : normalizedInput.yearlyPrice1,
    yearlyPrice2: normalizedInput.yearlyPrice2 === null ? existing.yearlyPrice2 : normalizedInput.yearlyPrice2,
    yearlyPrice3: normalizedInput.yearlyPrice3 === null ? existing.yearlyPrice3 : normalizedInput.yearlyPrice3,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) {
    return sendValidationError(res, validationError);
  }

  existing.name = mergedPayload.name;
  existing.storage = mergedPayload.storage;
  existing.monthlyPrice = mergedPayload.monthlyPrice;
  existing.yearlyPrice1 = mergedPayload.yearlyPrice1;
  existing.yearlyPrice2 = mergedPayload.yearlyPrice2;
  existing.yearlyPrice3 = mergedPayload.yearlyPrice3;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật bảng giá host",
    hostPrice: toResponseItem(existing),
  });
};

export const deleteHostPrice = async (req, res) => {
  const item = await HostPrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá host");
  }

  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa bảng giá host" });
};

export const deleteHostPrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await HostPrice.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các bảng giá host đã chọn" : "Đã xóa toàn bộ bảng giá host",
    deletedCount: result.modifiedCount || 0,
  });
};