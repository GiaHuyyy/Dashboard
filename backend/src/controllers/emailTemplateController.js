import mongoose from "mongoose";

import EmailTemplate from "../models/EmailTemplate.js";

const TEMPLATE_TYPES = ["program", "source", "contract", "correction", "upgrade"];
const TEMPLATE_STATUSES = ["draft", "active"];

const DEFAULT_TEMPLATES = [
  {
    templateType: "program",
    name: "Thông báo phiếu lập trình",
    subject: "[{{contractCode}}] Thông tin phiếu lập trình {{module}}",
    body:
      "Xin chào {{assignee}},\n\nPhiếu lập trình {{contractCode}} - {{module}} đã được tạo/cập nhật.\n\nMô tả: {{description}}\nTrạng thái: {{status}}\nNgày dự kiến: {{dueAt}}\n\nTrân trọng.",
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định cho phiếu lập trình.",
  },
  {
    templateType: "source",
    name: "Gửi link source",
    subject: "[{{contractCode}}] Link source {{module}}",
    body:
      "Xin chào,\n\nHệ thống gửi link source cho hợp đồng {{contractCode}}.\n\nModule: {{module}}\nLink source: {{sourceLink}}\nHạn hiệu lực link: {{expiresAt}}\n\nTrân trọng.",
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định để gửi link source.",
  },
  {
    templateType: "contract",
    name: "Thông báo bàn giao hợp đồng",
    subject: "[{{contractCode}}] Thông tin bàn giao hợp đồng",
    body:
      "Xin chào,\n\nHợp đồng {{contractCode}} đã được cập nhật thông tin bàn giao.\n\nKhách hàng: {{customerName}}\nTrạng thái: {{handoverStatus}}\n\nTrân trọng.",
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định cho hợp đồng kinh doanh.",
  },
  {
    templateType: "correction",
    name: "Thông báo yêu cầu chỉnh sửa",
    subject: "[{{contractCode}}] Yêu cầu chỉnh sửa {{module}}",
    body:
      "Xin chào {{assignee}},\n\nCó yêu cầu chỉnh sửa cho hợp đồng {{contractCode}}.\n\nModule: {{module}}\nNội dung: {{description}}\nTrạng thái: {{status}}\n\nTrân trọng.",
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định cho yêu cầu chỉnh sửa.",
  },
  {
    templateType: "upgrade",
    name: "Thông báo yêu cầu nâng cấp",
    subject: "[{{contractCode}}] Yêu cầu nâng cấp {{module}}",
    body:
      "Xin chào {{assignee}},\n\nCó yêu cầu nâng cấp cho hợp đồng {{contractCode}}.\n\nModule: {{module}}\nNội dung: {{description}}\nTrạng thái: {{status}}\n\nTrân trọng.",
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định cho yêu cầu nâng cấp.",
  },
];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return false;
};
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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

const normalizePayload = (body = {}) => ({
  templateType: normalizeString(body.templateType),
  name: normalizeString(body.name),
  subject: normalizeString(body.subject),
  body: typeof body.body === "string" ? body.body.trim() : "",
  status: normalizeString(body.status),
  isDefault: normalizeBoolean(body.isDefault),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!TEMPLATE_TYPES.includes(payload.templateType)) return { status: 400, message: "Loại mẫu không hợp lệ" };
  if (!payload.name) return { status: 400, message: "Tên mẫu là bắt buộc" };
  if (!payload.subject) return { status: 400, message: "Tiêu đề email là bắt buộc" };
  if (!payload.body) return { status: 400, message: "Nội dung mẫu là bắt buộc" };
  if (!TEMPLATE_STATUSES.includes(payload.status)) return { status: 400, message: "Trạng thái mẫu không hợp lệ" };

  const escapedName = payload.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const duplicate = await EmailTemplate.findOne({
    templateType: payload.templateType,
    name: { $regex: `^${escapedName}$`, $options: "i" },
    isDeleted: false,
  }).lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Tên mẫu đã tồn tại trong loại mẫu này" };
  }

  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  templateType: doc.templateType,
  name: doc.name,
  subject: doc.subject,
  body: doc.body || "",
  status: doc.status,
  isDefault: Boolean(doc.isDefault),
  note: doc.note || "",
  createdAt: formatDateTime(doc.createdAt),
  updatedAt: formatDateTime(doc.updatedAt),
});

const seedDefaults = async (userId) => {
  if (!userId) return;
  const count = await EmailTemplate.countDocuments({ isDeleted: false });
  if (count > 0) return;

  await EmailTemplate.insertMany(
    DEFAULT_TEMPLATES.map((item) => ({
      ...item,
      createdBy: userId,
      updatedBy: userId,
    })),
  );
};

const applyDefaultConstraint = async (template) => {
  if (!template.isDefault) return;
  await EmailTemplate.updateMany(
    {
      _id: { $ne: template._id },
      templateType: template.templateType,
      isDeleted: false,
    },
    { isDefault: false },
  );
};

export const listEmailTemplates = async (req, res) => {
  await seedDefaults(req.user?.sub);

  const search = normalizeString(req.query.search);
  const templateType = normalizeString(req.query.templateType);
  const status = normalizeString(req.query.status);
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 200;

  const filters = { isDeleted: false };
  if (templateType && templateType !== "all") filters.templateType = templateType;
  if (status && status !== "all") filters.status = status;
  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { body: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    EmailTemplate.find(filters).sort({ templateType: 1, isDefault: -1, createdAt: 1 }).skip(skip).limit(limit).lean(),
    EmailTemplate.countDocuments(filters),
  ]);

  return res.json({
    page,
    limit,
    total,
    templates: items.map(toResponseItem),
  });
};

export const getEmailTemplateById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const item = await EmailTemplate.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy mẫu email" });
  }

  return res.json({ template: toResponseItem(item) });
};

export const createEmailTemplate = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  const created = await EmailTemplate.create({
    ...payload,
    createdBy: req.user.sub,
    updatedBy: req.user.sub,
  });

  await applyDefaultConstraint(created);

  return res.status(201).json({
    message: "Đã thêm mẫu email",
    template: toResponseItem(created),
  });
};

export const updateEmailTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const existing = await EmailTemplate.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy mẫu email" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    templateType: normalizedInput.templateType || existing.templateType,
    name: normalizedInput.name || existing.name,
    subject: normalizedInput.subject || existing.subject,
    body: typeof req.body.body === "string" ? normalizedInput.body : existing.body,
    status: normalizedInput.status || existing.status,
    isDefault: typeof req.body.isDefault === "boolean" || typeof req.body.isDefault === "string" ? normalizedInput.isDefault : existing.isDefault,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  existing.templateType = mergedPayload.templateType;
  existing.name = mergedPayload.name;
  existing.subject = mergedPayload.subject;
  existing.body = mergedPayload.body;
  existing.status = mergedPayload.status;
  existing.isDefault = mergedPayload.isDefault;
  existing.note = mergedPayload.note;
  existing.updatedBy = req.user.sub;
  await existing.save();

  await applyDefaultConstraint(existing);

  return res.json({
    message: "Đã cập nhật mẫu email",
    template: toResponseItem(existing),
  });
};

export const deleteEmailTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "id không hợp lệ" });
  }

  const item = await EmailTemplate.findById(req.params.id);
  if (!item || item.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy mẫu email" });
  }

  item.isDeleted = true;
  item.updatedBy = req.user.sub;
  await item.save();

  return res.json({ message: "Đã xóa mẫu email" });
};

export const deleteEmailTemplates = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await EmailTemplate.updateMany(filters, { isDeleted: true, updatedBy: req.user.sub });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các mẫu email đã chọn" : "Đã xóa toàn bộ mẫu email",
    deletedCount: result.modifiedCount || 0,
  });
};
