import mongoose from "mongoose";

import PackagePrice from "../models/PackagePrice.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  includesHosting: normalizeBoolean(body.includesHosting),
  includesDomain: normalizeBoolean(body.includesDomain),
  designPages: normalizeNumber(body.designPages),
  monthlyPrice: normalizeNumber(body.monthlyPrice),
  yearlyPrice: normalizeNumber(body.yearlyPrice),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.name) return { status: 400, message: "name là bắt buộc" };
  if (payload.includesHosting === null) return { status: 400, message: "includesHosting phải là boolean" };
  if (payload.includesDomain === null) return { status: 400, message: "includesDomain phải là boolean" };
  if (payload.designPages === null || payload.designPages <= 0)
    return { status: 400, message: "designPages không hợp lệ" };
  if (payload.monthlyPrice === null || payload.monthlyPrice < 0)
    return { status: 400, message: "monthlyPrice không hợp lệ" };
  if (payload.yearlyPrice === null || payload.yearlyPrice < 0)
    return { status: 400, message: "yearlyPrice không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const existing = await PackagePrice.findOne({
    name: { $regex: `^${escapeRegex(payload.name)}$`, $options: "i" },
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Gói trọn gói đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name,
  includesHosting: Boolean(doc.includesHosting),
  includesDomain: Boolean(doc.includesDomain),
  designPages: doc.designPages,
  monthlyPrice: doc.monthlyPrice,
  yearlyPrice: doc.yearlyPrice,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listPackagePrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [{ name: { $regex: search, $options: "i" } }, { note: { $regex: search, $options: "i" } }];
  }
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = Math.min(parsePositiveInteger(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    PackagePrice.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    PackagePrice.countDocuments(filters),
  ]);

  return sendOk(res, { packagePrices: items.map(toResponseItem), total, page, limit });
};

export const getPackagePriceById = async (req, res) => {
  const item = await PackagePrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá trọn gói");
  }
  return sendOk(res, { packagePrice: toResponseItem(item) });
};

export const createPackagePrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await PackagePrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm bảng giá trọn gói",
    packagePrice: toResponseItem(created),
  });
};

export const updatePackagePrice = async (req, res) => {
  const existing = await PackagePrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá trọn gói");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    name: normalizedInput.name || existing.name,
    includesHosting:
      normalizedInput.includesHosting === null ? existing.includesHosting : normalizedInput.includesHosting,
    includesDomain: normalizedInput.includesDomain === null ? existing.includesDomain : normalizedInput.includesDomain,
    designPages: normalizedInput.designPages === null ? existing.designPages : normalizedInput.designPages,
    monthlyPrice: normalizedInput.monthlyPrice === null ? existing.monthlyPrice : normalizedInput.monthlyPrice,
    yearlyPrice: normalizedInput.yearlyPrice === null ? existing.yearlyPrice : normalizedInput.yearlyPrice,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

  existing.name = mergedPayload.name;
  existing.includesHosting = mergedPayload.includesHosting;
  existing.includesDomain = mergedPayload.includesDomain;
  existing.designPages = mergedPayload.designPages;
  existing.monthlyPrice = mergedPayload.monthlyPrice;
  existing.yearlyPrice = mergedPayload.yearlyPrice;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật bảng giá trọn gói",
    packagePrice: toResponseItem(existing),
  });
};

export const deletePackagePrice = async (req, res) => {
  const item = await PackagePrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá trọn gói");
  }
  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa bảng giá trọn gói" });
};

export const deletePackagePrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await PackagePrice.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các bảng giá trọn gói đã chọn" : "Đã xóa toàn bộ bảng giá trọn gói",
    deletedCount: result.modifiedCount || 0,
  });
};