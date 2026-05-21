import MailConfiguration from "../models/MailConfiguration.js";
import { decryptSmtpPassword, encryptSmtpPassword } from "../services/mailConfigurationService.js";

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
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const getEnvDefault = () => {
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER || "";
  return {
    smtpHost: process.env.MAIL_HOST || "",
    smtpPort: Number.isFinite(port) ? port : 587,
    smtpSecure: port === 465,
    smtpUser: user,
    smtpPassword: process.env.MAIL_PASS || "",
    fromEmail: process.env.MAIL_FROM || user,
    fromName: process.env.MAIL_FROM_NAME || "Dashboard",
    enableRealSend: process.env.MAIL_ENABLE_REAL_SEND === "true",
    note: "",
  };
};

const toResponseItem = (doc) => ({
  id: doc._id,
  smtpHost: doc.smtpHost || "",
  smtpPort: Number(doc.smtpPort || 587),
  smtpSecure: Boolean(doc.smtpSecure),
  smtpUser: doc.smtpUser || "",
  smtpPassword: "",
  hasSmtpPassword: Boolean(doc.smtpPassword),
  fromEmail: doc.fromEmail || "",
  fromName: doc.fromName || "",
  enableRealSend: Boolean(doc.enableRealSend),
  note: doc.note || "",
  updatedAt: formatDateTime(doc.updatedAt),
  createdAt: formatDateTime(doc.createdAt),
});

const getOrCreateConfiguration = async (userId) => {
  const existing = await MailConfiguration.findOne().sort({ createdAt: -1 });
  if (existing) return existing;

  const envDefault = getEnvDefault();
  return MailConfiguration.create({
    ...envDefault,
    smtpPassword: encryptSmtpPassword(envDefault.smtpPassword),
    updatedBy: userId || null,
  });
};

const normalizePayload = (body = {}, existing = null) => {
  const rawPassword = typeof body.smtpPassword === "string" ? body.smtpPassword : undefined;
  const existingPassword = existing?.smtpPassword ? decryptSmtpPassword(existing.smtpPassword) : "";
  const nextPassword = rawPassword === undefined || rawPassword === "" ? existingPassword : rawPassword.trim();

  return {
    smtpHost: normalizeString(body.smtpHost),
    smtpPort: normalizeNumber(body.smtpPort),
    smtpSecure: normalizeBoolean(body.smtpSecure),
    smtpUser: normalizeString(body.smtpUser),
    smtpPassword: nextPassword,
    fromEmail: normalizeString(body.fromEmail),
    fromName: normalizeString(body.fromName),
    enableRealSend: normalizeBoolean(body.enableRealSend),
    note: normalizeString(body.note),
  };
};

const validatePayload = (payload) => {
  if (payload.smtpPort === null || payload.smtpPort < 1 || payload.smtpPort > 65535) {
    return { status: 400, message: "SMTP port không hợp lệ" };
  }

  if (payload.smtpSecure === null) return { status: 400, message: "smtpSecure phải là kiểu boolean" };
  if (payload.enableRealSend === null) return { status: 400, message: "enableRealSend phải là kiểu boolean" };

  if (payload.enableRealSend) {
    if (!payload.smtpHost) return { status: 400, message: "SMTP host là bắt buộc khi bật gửi mail thật" };
    if (!payload.smtpUser) return { status: 400, message: "SMTP user là bắt buộc khi bật gửi mail thật" };
    if (!payload.smtpPassword) return { status: 400, message: "SMTP password là bắt buộc khi bật gửi mail thật" };
    if (!payload.fromEmail) return { status: 400, message: "Email người gửi là bắt buộc khi bật gửi mail thật" };
  }

  return null;
};

export const getMailConfiguration = async (req, res) => {
  const config = await getOrCreateConfiguration(req.user?.sub);
  return res.json({ mailConfiguration: toResponseItem(config) });
};

export const updateMailConfiguration = async (req, res) => {
  const config = await getOrCreateConfiguration(req.user?.sub);
  const payload = normalizePayload(req.body, config);
  const validationError = validatePayload(payload);
  if (validationError) return res.status(validationError.status).json({ message: validationError.message });

  config.smtpHost = payload.smtpHost;
  config.smtpPort = payload.smtpPort;
  config.smtpSecure = payload.smtpSecure;
  config.smtpUser = payload.smtpUser;
  config.smtpPassword = encryptSmtpPassword(payload.smtpPassword);
  config.fromEmail = payload.fromEmail;
  config.fromName = payload.fromName || "Dashboard";
  config.enableRealSend = payload.enableRealSend;
  config.note = payload.note;
  config.updatedBy = req.user?.sub || null;

  await config.save();

  return res.json({
    message: "Đã lưu cấu hình mail",
    mailConfiguration: toResponseItem(config),
  });
};
