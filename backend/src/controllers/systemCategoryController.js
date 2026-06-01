import mongoose from "mongoose";

import SystemCategory from "../models/SystemCategory.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeNumber, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { buildSearchOrFilter, escapeRegex } from "../utils/query.js";
import { sendBadRequest, sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const CATEGORY_TYPES = ["module", "status", "priority", "websiteTemplate", "contractProjectStatus", "contractType"];
const DEFAULT_CATEGORIES = {
  module: ["Không tính điểm", "Cơ bản", "Cơ bản + Responsive", "Cơ bản + Mobile", "Giỏ hàng cơ bản"],
  status: ["Mới tạo", "Đã phân công", "Đang xử lý", "Đã hoàn thành"],
  priority: ["Thấp", "Trung bình", "Cao", "Khẩn"],
  websiteTemplate: ["Landing Page", "Website công ty", "Bán hàng", "Spa - Thẩm mỹ", "Nhà hàng - Cafe", "Bất động sản", "Giáo dục", "Tin tức - Blog"],
  contractProjectStatus: ["Chưa nhận", "Đã nhận", "Đang làm", "Ưu tiên", "Hoãn"],
  contractType: ["Giao diện", "Lập trình", "Nâng cấp", "Upsource"],
};

const DEFAULT_CATEGORY_TYPE_BY_NAME = Object.entries(DEFAULT_CATEGORIES).reduce((acc, [type, names]) => {
  names.forEach((name) => {
    acc[name.toLowerCase()] = type;
  });
  return acc;
}, {});

const repairDefaultCategoryTypes = async () => {
  const defaultNames = Object.values(DEFAULT_CATEGORIES).flat();
  const existingItems = await SystemCategory.find({
    name: { $in: defaultNames },
    isDeleted: false,
  })
    .select("_id name type sortOrder isActive createdAt")
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  if (existingItems.length === 0) return;

  const activeTargetKeys = new Set(
    existingItems
      .filter((item) => DEFAULT_CATEGORY_TYPE_BY_NAME[String(item.name || "").toLowerCase()] === item.type)
      .map((item) => `${item.type}:${String(item.name || "").toLowerCase()}`),
  );

  await Promise.all(
    existingItems.map(async (item) => {
      const nameKey = String(item.name || "").toLowerCase();
      const correctType = DEFAULT_CATEGORY_TYPE_BY_NAME[nameKey];
      if (!correctType || item.type === correctType) return;

      const targetKey = `${correctType}:${nameKey}`;
      if (activeTargetKeys.has(targetKey)) {
        await SystemCategory.updateOne({ _id: item._id }, { $set: { isDeleted: true } });
        return;
      }

      await SystemCategory.updateOne({ _id: item._id }, { $set: { type: correctType } });
      activeTargetKeys.add(targetKey);
    }),
  );
};

const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  type: normalizeString(body.type),
  sortOrder: normalizeNumber(body.sortOrder),
  isActive: normalizeBoolean(body.isActive),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!payload.name) return { status: 400, message: "name là bắt buộc" };
  if (!CATEGORY_TYPES.includes(payload.type)) {
    return { status: 400, message: `type không hợp lệ. Giá trị cho phép: ${CATEGORY_TYPES.join(", ")}` };
  }
  if (payload.sortOrder === null || payload.sortOrder < 0) {
    return { status: 400, message: "sortOrder không hợp lệ" };
  }
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const escapedName = escapeRegex(payload.name);
  const duplicate = await SystemCategory.findOne({
    name: { $regex: `^${escapedName}$`, $options: "i" },
    type: payload.type,
    isDeleted: false,
  }).lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Danh mục đã tồn tại" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name,
  type: doc.type,
  sortOrder: Number(doc.sortOrder || 0),
  isActive: Boolean(doc.isActive),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
});

const seedDefaults = async (type, createdBy) => {
  await repairDefaultCategoryTypes();
  if (!createdBy) return;
  const typesToSeed = type ? [type] : CATEGORY_TYPES;
  await Promise.all(
    typesToSeed.map(async (categoryType) => {
      if (!CATEGORY_TYPES.includes(categoryType)) return;
      const count = await SystemCategory.countDocuments({ type: categoryType, isDeleted: false });
      if (count > 0) return;
      const defaults = DEFAULT_CATEGORIES[categoryType] || [];
      if (defaults.length === 0) return;
      const docs = defaults.map((name, index) => ({
        name,
        type: categoryType,
        sortOrder: index + 1,
        isActive: true,
        createdBy,
      }));
      await SystemCategory.insertMany(docs);
    }),
  );
};

export const listSystemCategories = async (req, res) => {
  const search = normalizeString(req.query.search);
  const type = normalizeString(req.query.type);
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 200;

  if (type && !CATEGORY_TYPES.includes(type)) {
    return sendBadRequest(res, "type không hợp lệ");
  }

  await seedDefaults(type, req.user?.sub);

  const filters = { isDeleted: false };
  if (type) filters.type = type;
  if (search) {
    Object.assign(filters, buildSearchOrFilter(search, ["name", "note"]));
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    SystemCategory.find(filters).sort({ sortOrder: 1, createdAt: 1 }).skip(skip).limit(limit).lean(),
    SystemCategory.countDocuments(filters),
  ]);

  return sendOk(res, {
    page,
    limit,
    total,
    categories: items.map(toResponseItem),
  });
};

export const getSystemCategoryById = async (req, res) => {
  const item = await SystemCategory.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy danh mục");
  }
  return sendOk(res, { category: toResponseItem(item) });
};

export const createSystemCategory = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await SystemCategory.create({
    ...payload,
    createdBy: req.user.sub,
  });

  return sendCreated(res, {
    message: "Đã thêm danh mục",
    category: toResponseItem(created),
  });
};

export const updateSystemCategory = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendBadRequest(res, "id không hợp lệ");
  }

  const existing = await SystemCategory.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy danh mục");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    name: normalizedInput.name || existing.name,
    type: normalizedInput.type || existing.type,
    sortOrder: normalizedInput.sortOrder === null ? existing.sortOrder : normalizedInput.sortOrder,
    isActive: normalizedInput.isActive === null ? existing.isActive : normalizedInput.isActive,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

  existing.name = mergedPayload.name;
  existing.type = mergedPayload.type;
  existing.sortOrder = mergedPayload.sortOrder;
  existing.isActive = mergedPayload.isActive;
  existing.note = mergedPayload.note;
  await existing.save();

  return sendOk(res, {
    message: "Đã cập nhật danh mục",
    category: toResponseItem(existing),
  });
};

export const deleteSystemCategory = async (req, res) => {
  const item = await SystemCategory.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy danh mục");
  }

  item.isDeleted = true;
  await item.save();
  return sendOk(res, { message: "Đã xóa danh mục" });
};

export const deleteSystemCategories = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await SystemCategory.updateMany(filters, { isDeleted: true });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các danh mục đã chọn" : "Đã xóa toàn bộ danh mục",
    deletedCount: result.modifiedCount || 0,
  });
};
