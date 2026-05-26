import mongoose from "mongoose";

import WebsiteTemplate from "../models/WebsiteTemplate.js";
import { deleteCloudinaryAsset } from "../services/cloudinaryService.js";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};
const normalizeTags = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  return normalizeString(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
const isValidHttpUrl = (value, { required = false } = {}) => {
  const normalized = normalizeString(value);
  if (!normalized) return !required;

  try {
    const parsed = new URL(normalized);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  demoUrl: normalizeString(body.demoUrl),
  templateUrl: normalizeString(body.templateUrl),
  previewImage: normalizeString(body.previewImage),
  previewImagePublicId: normalizeString(body.previewImagePublicId),
  category: normalizeString(body.category),
  platform: normalizeString(body.platform),
  tags: normalizeTags(body.tags),
  description: normalizeString(body.description),
  note: normalizeString(body.note),
  isActive: normalizeBoolean(body.isActive),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.name) return { status: 400, message: "name là bắt buộc" };
  if (!payload.demoUrl) return { status: 400, message: "demoUrl là bắt buộc" };
  if (!payload.category) return { status: 400, message: "category là bắt buộc" };
  if (!isValidHttpUrl(payload.demoUrl, { required: true })) {
    return { status: 400, message: "Link demo không hợp lệ (chỉ chấp nhận http/https)" };
  }
  if (!isValidHttpUrl(payload.templateUrl)) {
    return { status: 400, message: "Link template không hợp lệ (chỉ chấp nhận http/https)" };
  }
  if (!isValidHttpUrl(payload.previewImage)) {
    return { status: 400, message: "Link ảnh preview không hợp lệ (chỉ chấp nhận http/https)" };
  }
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const escapedName = payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const duplicate = await WebsiteTemplate.findOne({
    name: { $regex: `^${escapedName}$`, $options: "i" },
    isDeleted: false,
  }).lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Website mẫu đã tồn tại" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name,
  demoUrl: doc.demoUrl,
  templateUrl: doc.templateUrl || "",
  previewImage: doc.previewImage || "",
  previewImagePublicId: doc.previewImagePublicId || "",
  category: doc.category || "",
  platform: doc.platform || "",
  tags: Array.isArray(doc.tags) ? doc.tags : [],
  description: doc.description || "",
  note: doc.note || "",
  isActive: Boolean(doc.isActive),
  createdAt: formatDateTime(doc.createdAt),
  updatedAt: formatDateTime(doc.updatedAt),
});

export const listWebsiteTemplates = async (req, res) => {
  const search = normalizeString(req.query.search);
  const category = normalizeString(req.query.category);
  const platform = normalizeString(req.query.platform);
  const active = normalizeString(req.query.active);
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 200;

  const filters = { isDeleted: false };
  if (category && category !== "all") filters.category = category;
  if (platform && platform !== "all") filters.platform = platform;
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { demoUrl: { $regex: search, $options: "i" } },
      { templateUrl: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
      { platform: { $regex: search, $options: "i" } },
      { tags: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    WebsiteTemplate.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    WebsiteTemplate.countDocuments(filters),
  ]);

  return res.json({
    page,
    limit,
    total,
    websiteTemplates: items.map(toResponseItem),
  });
};

export const getWebsiteTemplateById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const item = await WebsiteTemplate.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy website mẫu" });
  }

  return res.json({ websiteTemplate: toResponseItem(item) });
};

export const createWebsiteTemplate = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  const created = await WebsiteTemplate.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return res.status(201).json({
    message: "Đã thêm website mẫu",
    websiteTemplate: toResponseItem(created),
  });
};

export const updateWebsiteTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const existing = await WebsiteTemplate.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy website mẫu" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    name: normalizedInput.name || existing.name,
    demoUrl: normalizedInput.demoUrl || existing.demoUrl,
    templateUrl: typeof req.body.templateUrl === "string" ? normalizedInput.templateUrl : existing.templateUrl,
    previewImage: typeof req.body.previewImage === "string" ? normalizedInput.previewImage : existing.previewImage,
    previewImagePublicId:
      typeof req.body.previewImagePublicId === "string" ? normalizedInput.previewImagePublicId : existing.previewImagePublicId,
    category: normalizedInput.category || existing.category,
    platform: typeof req.body.platform === "string" ? normalizedInput.platform : existing.platform,
    tags: Object.prototype.hasOwnProperty.call(req.body, "tags") ? normalizedInput.tags : existing.tags,
    description: typeof req.body.description === "string" ? normalizedInput.description : existing.description,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
    isActive: normalizedInput.isActive === null ? existing.isActive : normalizedInput.isActive,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  const oldPreviewImagePublicId = existing.previewImagePublicId || "";
  const shouldDeleteOldPreviewImage =
    oldPreviewImagePublicId &&
    typeof req.body.previewImage === "string" &&
    (mergedPayload.previewImage !== existing.previewImage || mergedPayload.previewImagePublicId !== oldPreviewImagePublicId);

  Object.assign(existing, mergedPayload);
  await existing.save();

  if (shouldDeleteOldPreviewImage) {
    await deleteCloudinaryAsset(oldPreviewImagePublicId);
  }

  return res.json({
    message: "Đã cập nhật website mẫu",
    websiteTemplate: toResponseItem(existing),
  });
};

export const deleteWebsiteTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const item = await WebsiteTemplate.findById(req.params.id);
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy website mẫu" });
  }

  const previewImagePublicId = item.previewImagePublicId || "";
  item.isDeleted = true;
  item.previewImage = "";
  item.previewImagePublicId = "";
  await item.save();

  if (previewImagePublicId) {
    await deleteCloudinaryAsset(previewImagePublicId);
  }

  return res.json({ message: "Đã xóa website mẫu" });
};

export const deleteWebsiteTemplates = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const items = await WebsiteTemplate.find(filters).select("previewImagePublicId").lean();
  const result = await WebsiteTemplate.updateMany(filters, { isDeleted: true, previewImage: "", previewImagePublicId: "" });

  await Promise.all(items.map((item) => deleteCloudinaryAsset(item.previewImagePublicId)));

  return res.json({
    message: ids.length > 0 ? "Đã xóa các website mẫu đã chọn" : "Đã xóa toàn bộ website mẫu",
    deletedCount: result.modifiedCount || 0,
  });
};