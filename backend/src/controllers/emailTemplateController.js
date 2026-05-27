import mongoose from "mongoose";

import EmailTemplate from "../models/EmailTemplate.js";
import { formatDateTime } from "../utils/date.js";
import { normalizeBoolean, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";
import { sendBadRequest, sendCreated, sendNotFound, sendOk, sendValidationError } from "../utils/httpResponse.js";

const TEMPLATE_TYPES = ["program", "source", "contract", "correction", "upgrade"];
const TEMPLATE_STATUSES = ["draft", "active"];

const DEFAULT_TEMPLATES = [
  {
    templateType: "source",
    name: "Gửi link source",
    subject: "[Dashboard] {{actionLabel}} source - {{contractCode}}",
    body: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
  <h2 style="margin: 0 0 12px; color: #0f172a;">{{actionLabel}} source</h2>
  <p style="margin: 0 0 12px;">Hệ thống đã {{actionLabelLower}} source với thông tin như sau:</p>
  <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
    <tr><td style="padding: 6px 0; width: 180px;"><strong>Số hợp đồng</strong></td><td style="padding: 6px 0;">{{contractCode}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Module</strong></td><td style="padding: 6px 0;">{{module}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Domain</strong></td><td style="padding: 6px 0;">{{domain}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Link source</strong></td><td style="padding: 6px 0;">{{sourceLink}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Hạn hiệu lực link</strong></td><td style="padding: 6px 0;">{{expiresAt}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Xác nhận tải</strong></td><td style="padding: 6px 0;">{{downloadStatus}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Số lượt tải</strong></td><td style="padding: 6px 0;">{{downloadCount}} lượt tải</td></tr>
    {{priceRows}}
    <tr><td style="padding: 6px 0;"><strong>Email nhận</strong></td><td style="padding: 6px 0;">{{salesReceiverEmail}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Email cc</strong></td><td style="padding: 6px 0;">{{ccEmails}}</td></tr>
  </table>
</div>`.trim(),
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định để gửi link source, giữ đầy đủ trường giống email hard-code.",
  },
  {
    templateType: "contract",
    name: "Thông báo hợp đồng kinh doanh",
    subject: "[Dashboard] {{actionLabel}} hợp đồng - {{contractCode}}",
    body: `
<div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
  <h2 style="margin: 0 0 12px; color: #0f172a;">{{actionLabel}} hợp đồng kinh doanh</h2>
  <p style="margin: 0 0 12px;">Hệ thống đã {{actionLabelLower}} với thông tin như sau:</p>
  <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
    <tr><td style="padding: 6px 0; width: 180px;"><strong>Số hợp đồng</strong></td><td style="padding: 6px 0;">{{contractCode}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Tên hợp đồng</strong></td><td style="padding: 6px 0;">{{contractName}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Khách hàng</strong></td><td style="padding: 6px 0;">{{customerName}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Số điện thoại</strong></td><td style="padding: 6px 0;">{{customerPhone}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Email khách hàng</strong></td><td style="padding: 6px 0;">{{customerEmail}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Mail nhận</strong></td><td style="padding: 6px 0;">{{mailStatus}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Nhân viên kinh doanh</strong></td><td style="padding: 6px 0;">{{selectedSalesStaff}}</td></tr>
    <tr><td style="padding: 6px 0;"><strong>Email CC</strong></td><td style="padding: 6px 0;">{{ccEmails}}</td></tr>
  </table>
  {{contractImagesBlock}}
</div>`.trim(),
    status: "draft",
    isDefault: true,
    note: "Mẫu mặc định cho hợp đồng kinh doanh, giữ đầy đủ trường giống email hard-code.",
  },
];

const normalizePayload = (body = {}) => ({
  templateType: normalizeString(body.templateType),
  name: normalizeString(body.name),
  subject: normalizeString(body.subject),
  body: typeof body.body === "string" ? body.body.trim() : "",
  status: normalizeString(body.status),
  isDefault: normalizeBoolean(body.isDefault) === true,
  note: normalizeString(body.note),
});

const validatePayload = async (payload, excludeId = "") => {
  if (!TEMPLATE_TYPES.includes(payload.templateType)) return { status: 400, message: "Loại mẫu không hợp lệ" };
  if (!payload.name) return { status: 400, message: "Tên mẫu là bắt buộc" };
  if (!payload.subject) return { status: 400, message: "Tiêu đề email là bắt buộc" };
  if (!payload.body) return { status: 400, message: "Nội dung mẫu là bắt buộc" };
  if (!TEMPLATE_STATUSES.includes(payload.status)) return { status: 400, message: "Trạng thái mẫu không hợp lệ" };

  const escapedName = escapeRegex(payload.name);
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

  return sendOk(res, {
    page,
    limit,
    total,
    templates: items.map(toResponseItem),
  });
};

export const getEmailTemplateById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendBadRequest(res, "id không hợp lệ");
  }

  const item = await EmailTemplate.findById(req.params.id).lean();
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy mẫu email");
  }

  return sendOk(res, { template: toResponseItem(item) });
};

export const createEmailTemplate = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validationError = await validatePayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const created = await EmailTemplate.create({
    ...payload,
    createdBy: req.user.sub,
    updatedBy: req.user.sub,
  });

  await applyDefaultConstraint(created);

  return sendCreated(res, {
    message: "Đã thêm mẫu email",
    template: toResponseItem(created),
  });
};

export const updateEmailTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendBadRequest(res, "id không hợp lệ");
  }

  const existing = await EmailTemplate.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return sendNotFound(res, "Không tìm thấy mẫu email");
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    templateType: normalizedInput.templateType || existing.templateType,
    name: normalizedInput.name || existing.name,
    subject: normalizedInput.subject || existing.subject,
    body: typeof req.body.body === "string" ? normalizedInput.body : existing.body,
    status: normalizedInput.status || existing.status,
    isDefault:
      typeof req.body.isDefault === "boolean" || typeof req.body.isDefault === "string"
        ? normalizedInput.isDefault
        : existing.isDefault,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationError = await validatePayload(mergedPayload, String(existing._id));
  if (validationError) return sendValidationError(res, validationError);

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

  return sendOk(res, {
    message: "Đã cập nhật mẫu email",
    template: toResponseItem(existing),
  });
};

export const deleteEmailTemplate = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return sendBadRequest(res, "id không hợp lệ");
  }

  const item = await EmailTemplate.findById(req.params.id);
  if (!item || item.isDeleted) {
    return sendNotFound(res, "Không tìm thấy mẫu email");
  }

  item.isDeleted = true;
  item.updatedBy = req.user.sub;
  await item.save();

  return sendOk(res, { message: "Đã xóa mẫu email" });
};

export const deleteEmailTemplates = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await EmailTemplate.updateMany(filters, { isDeleted: true, updatedBy: req.user.sub });

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các mẫu email đã chọn" : "Đã xóa toàn bộ mẫu email",
    deletedCount: result.modifiedCount || 0,
  });
};