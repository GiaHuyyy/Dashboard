import mongoose from "mongoose";

import AdministrationPrice from "../models/AdministrationPrice.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const SCOPE_OPTIONS = ["Website", "Hệ thống", "Server"];
const FREQUENCY_OPTIONS = ["Tháng", "Quý", "Năm", "Theo yêu cầu"];
const normalizePayload = (body = {}) => ({
  serviceName: normalizeString(body.serviceName),
  scope: normalizeString(body.scope),
  frequency: normalizeString(body.frequency),
  price: normalizeNumber(body.price),
  slaHours: normalizeNumber(body.slaHours),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.serviceName) return { status: 400, message: "serviceName là bắt buộc" };
  if (!SCOPE_OPTIONS.includes(payload.scope)) return { status: 400, message: "scope không hợp lệ" };
  if (!FREQUENCY_OPTIONS.includes(payload.frequency)) return { status: 400, message: "frequency không hợp lệ" };
  if (payload.price === null || payload.price < 0) return { status: 400, message: "price không hợp lệ" };
  if (payload.slaHours === null || payload.slaHours < 0) return { status: 400, message: "slaHours không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const escapedService = escapeRegex(payload.serviceName);
  const existing = await AdministrationPrice.findOne({
    serviceName: { $regex: `^${escapedService}$`, $options: "i" },
    scope: payload.scope,
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Dịch vụ quản trị đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  serviceName: doc.serviceName,
  scope: doc.scope,
  frequency: doc.frequency,
  price: doc.price,
  slaHours: doc.slaHours,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listAdministrationPrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [
      { serviceName: { $regex: search, $options: "i" } },
      { scope: { $regex: search, $options: "i" } },
      { frequency: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = Math.min(parsePositiveInteger(req.query.limit) || 10, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AdministrationPrice.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    AdministrationPrice.countDocuments(filters),
  ]);

  return sendOk(res, { administrationPrices: items.map(toResponseItem), total, page, limit });
};

export const getAdministrationPriceById = async (req, res) => {
  const item = await AdministrationPrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quản trị");
  }
  return sendOk(res, { administrationPrice: toResponseItem(item) });
};

export const createAdministrationPrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await AdministrationPrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm bảng giá quản trị",
    administrationPrice: toResponseItem(created),
  });
};

export const updateAdministrationPrice = async (req, res) => {
  const existing = await AdministrationPrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quản trị");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    serviceName: normalizedInput.serviceName || existing.serviceName,
    scope: normalizedInput.scope || existing.scope,
    frequency: normalizedInput.frequency || existing.frequency,
    price: normalizedInput.price === null ? existing.price : normalizedInput.price,
    slaHours: normalizedInput.slaHours === null ? existing.slaHours : normalizedInput.slaHours,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

  existing.serviceName = mergedPayload.serviceName;
  existing.scope = mergedPayload.scope;
  existing.frequency = mergedPayload.frequency;
  existing.price = mergedPayload.price;
  existing.slaHours = mergedPayload.slaHours;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật bảng giá quản trị",
    administrationPrice: toResponseItem(existing),
  });
};

export const deleteAdministrationPrice = async (req, res) => {
  const item = await AdministrationPrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quản trị");
  }
  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa bảng giá quản trị" });
};

export const deleteAdministrationPrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await AdministrationPrice.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các bảng giá quản trị đã chọn" : "Đã xóa toàn bộ bảng giá quản trị",
    deletedCount: result.modifiedCount || 0,
  });
};