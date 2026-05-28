import mongoose from "mongoose";

import AdvertisingPrice from "../models/AdvertisingPrice.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const PLATFORM_OPTIONS = ["Google", "Facebook", "TikTok", "Zalo"];
const normalizePayload = (body = {}) => ({
  platform: normalizeString(body.platform),
  packageName: normalizeString(body.packageName),
  minimumBudget: normalizeNumber(body.minimumBudget),
  serviceFeePercent: normalizeNumber(body.serviceFeePercent),
  setupFee: normalizeNumber(body.setupFee),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!PLATFORM_OPTIONS.includes(payload.platform)) return { status: 400, message: "platform không hợp lệ" };
  if (!payload.packageName) return { status: 400, message: "packageName là bắt buộc" };
  if (payload.minimumBudget === null || payload.minimumBudget < 0) {
    return { status: 400, message: "minimumBudget không hợp lệ" };
  }
  if (payload.serviceFeePercent === null || payload.serviceFeePercent < 0 || payload.serviceFeePercent > 100) {
    return { status: 400, message: "serviceFeePercent không hợp lệ" };
  }
  if (payload.setupFee === null || payload.setupFee < 0) return { status: 400, message: "setupFee không hợp lệ" };
  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  const escapedName = escapeRegex(payload.packageName);
  const existing = await AdvertisingPrice.findOne({
    packageName: { $regex: `^${escapedName}$`, $options: "i" },
    platform: payload.platform,
    isDeleted: false,
  }).lean();
  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Gói quảng cáo đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  platform: doc.platform,
  packageName: doc.packageName,
  minimumBudget: doc.minimumBudget,
  serviceFeePercent: doc.serviceFeePercent,
  setupFee: doc.setupFee,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

export const listAdvertisingPrices = async (req, res) => {
  const search = normalizeString(req.query.search);
  const filters = { isDeleted: false };
  if (search) {
    filters.$or = [
      { platform: { $regex: search, $options: "i" } },
      { packageName: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }
  const items = await AdvertisingPrice.find(filters).sort({ createdAt: 1 }).lean();
  return sendOk(res, { advertisingPrices: items.map(toResponseItem) });
};

export const getAdvertisingPriceById = async (req, res) => {
  const item = await AdvertisingPrice.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quảng cáo");
  }
  return sendOk(res, { advertisingPrice: toResponseItem(item) });
};

export const createAdvertisingPrice = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await AdvertisingPrice.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm bảng giá quảng cáo",
    advertisingPrice: toResponseItem(created),
  });
};

export const updateAdvertisingPrice = async (req, res) => {
  const existing = await AdvertisingPrice.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quảng cáo");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    platform: normalizedInput.platform || existing.platform,
    packageName: normalizedInput.packageName || existing.packageName,
    minimumBudget: normalizedInput.minimumBudget === null ? existing.minimumBudget : normalizedInput.minimumBudget,
    serviceFeePercent:
      normalizedInput.serviceFeePercent === null ? existing.serviceFeePercent : normalizedInput.serviceFeePercent,
    setupFee: normalizedInput.setupFee === null ? existing.setupFee : normalizedInput.setupFee,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

  existing.platform = mergedPayload.platform;
  existing.packageName = mergedPayload.packageName;
  existing.minimumBudget = mergedPayload.minimumBudget;
  existing.serviceFeePercent = mergedPayload.serviceFeePercent;
  existing.setupFee = mergedPayload.setupFee;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật bảng giá quảng cáo",
    advertisingPrice: toResponseItem(existing),
  });
};

export const deleteAdvertisingPrice = async (req, res) => {
  const item = await AdvertisingPrice.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy bảng giá quảng cáo");
  }
  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa bảng giá quảng cáo" });
};

export const deleteAdvertisingPrices = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];
  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await AdvertisingPrice.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các bảng giá quảng cáo đã chọn" : "Đã xóa toàn bộ bảng giá quảng cáo",
    deletedCount: result.modifiedCount || 0,
  });
};
