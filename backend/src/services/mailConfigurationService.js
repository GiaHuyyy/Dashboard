import crypto from "crypto";
import nodemailer from "nodemailer";

import MailConfiguration from "../models/MailConfiguration.js";

const ENCRYPTION_PREFIX = "enc:v1";

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");

const buildMailAddress = (name, email) => {
  const normalizedEmail = normalizeString(email);
  const normalizedName = normalizeString(name);
  if (!normalizedEmail) return "";
  if (!normalizedName) return normalizedEmail;
  return `"${normalizedName.replace(/"/g, "'")}" <${normalizedEmail}>`;
};

const getEncryptionSecret = () =>
  process.env.MAIL_CONFIG_SECRET || process.env.JWT_SECRET || process.env.MONGODB_URI || "local-mail-config-secret";

const getEncryptionKey = () => crypto.createHash("sha256").update(getEncryptionSecret()).digest();

export const encryptSmtpPassword = (plainText) => {
  const password = typeof plainText === "string" ? plainText : "";
  if (!password) return "";
  if (password.startsWith(`${ENCRYPTION_PREFIX}:`)) return password;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(password, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [ENCRYPTION_PREFIX, iv.toString("base64"), tag.toString("base64"), encrypted.toString("base64")].join(":");
};

export const decryptSmtpPassword = (storedValue) => {
  const value = typeof storedValue === "string" ? storedValue : "";
  if (!value) return "";

  if (!value.startsWith(`${ENCRYPTION_PREFIX}:`)) return value;

  try {
    const [, , ivText, tagText, encryptedText] = value.split(":");
    const decipher = crypto.createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivText, "base64"));
    decipher.setAuthTag(Buffer.from(tagText, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(encryptedText, "base64")), decipher.final()]).toString("utf8");
  } catch (error) {
    throw new Error("Không thể giải mã SMTP password. Vui lòng nhập lại mật khẩu SMTP trong cấu hình mail");
  }
};

const resolveSmtpSecure = (port, smtpSecure) => {
  const normalizedPort = Number(port || 587);

  if (normalizedPort === 465) return true;

  if (normalizedPort === 587 || normalizedPort === 25) return false;

  return Boolean(smtpSecure);
};

const getEnvMailConfig = () => {
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER || "";
  const pass = process.env.MAIL_PASS || "";
  const fromEmail = process.env.MAIL_FROM || user;
  const fromName = process.env.MAIL_FROM_NAME || "Dashboard";

  return {
    host: process.env.MAIL_HOST || "",
    port,
    secure: resolveSmtpSecure(port, process.env.MAIL_SECURE === "true"),
    auth: user && pass ? { user, pass } : null,
    fromEmail,
    fromName,
    from: buildMailAddress(fromName, fromEmail),
    enableRealSend: process.env.MAIL_ENABLE_REAL_SEND === "true",
    isConfigured: Boolean(process.env.MAIL_HOST && user && pass && fromEmail),
  };
};

export const buildSmtpTransportOptions = (config) => ({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: config.auth,
  family: 4,
  requireTLS: !config.secure,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
  tls: {
    minVersion: "TLSv1.2",
    servername: config.host,
  },
});

export const getActiveMailConfiguration = async () => {
  const savedConfig = await MailConfiguration.findOne().sort({ createdAt: -1 }).lean();
  if (!savedConfig) return getEnvMailConfig();

  const host = savedConfig.smtpHost || "";
  const port = Number(savedConfig.smtpPort || 587);
  const user = savedConfig.smtpUser || "";
  const pass = decryptSmtpPassword(savedConfig.smtpPassword || "");
  const fromEmail = savedConfig.fromEmail || user;
  const fromName = savedConfig.fromName || "Dashboard";

  return {
    host,
    port,
    secure: resolveSmtpSecure(port, savedConfig.smtpSecure),
    auth: user && pass ? { user, pass } : null,
    fromEmail,
    fromName,
    from: buildMailAddress(fromName, fromEmail),
    enableRealSend: Boolean(savedConfig.enableRealSend),
    isConfigured: Boolean(host && user && pass && fromEmail),
  };
};

export const assertMailConfigurationReady = (config) => {
  if (!config?.enableRealSend) {
    throw new Error("Chưa bật gửi mail thật trong cấu hình mail");
  }

  if (!config?.host || !config?.auth || !config?.from) {
    throw new Error("Chưa cấu hình đầy đủ SMTP host, SMTP user, SMTP password hoặc email người gửi");
  }
};

const normalizeSendMailError = (error) => {
  const message = error?.message || "Unknown error";

  if (message.includes("Không thể giải mã SMTP password")) return message;
  if (message.includes("Chưa bật gửi mail thật")) return message;
  if (message.includes("Chưa cấu hình đầy đủ")) return message;
  if (message.includes("Invalid login") || error?.code === "EAUTH") {
    return "Cấu hình mail sai tài khoản hoặc mật khẩu SMTP";
  }
  if (message.includes("wrong version number")) {
    return "Cấu hình SSL/TLS không đúng với SMTP port. Port 587 hãy tắt SSL/TLS, port 465 hãy bật SSL/TLS";
  }
  if (error?.code === "ENOTFOUND" || error?.code === "ECONNREFUSED" || error?.code === "ETIMEDOUT") {
    return "Không thể kết nối SMTP. Vui lòng kiểm tra SMTP host, port hoặc mạng";
  }
  if (error?.code === "ENETUNREACH") {
    return "Không thể kết nối SMTP từ mạng hiện tại";
  }

  return `Cấu hình mail chưa đúng hoặc máy chủ SMTP từ chối gửi: ${message}`;
};

export const sendConfiguredMail = async (mailOptions) => {
  const config = await getActiveMailConfiguration();

  if (!config.enableRealSend) {
    console.log("[MAIL_DISABLED] Đã tắt gửi mail thật", {
      to: mailOptions?.to,
      subject: mailOptions?.subject,
    });
    return { skipped: true, reason: "MAIL_DISABLED" };
  }

  try {
    assertMailConfigurationReady(config);

    const transporter = nodemailer.createTransport(buildSmtpTransportOptions(config));

    return await transporter.sendMail({
      from: config.from,
      ...mailOptions,
    });
  } catch (error) {
    throw new Error(normalizeSendMailError(error));
  }
};
