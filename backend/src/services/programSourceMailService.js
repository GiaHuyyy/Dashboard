import nodemailer from "nodemailer";

const getMailConfig = () => {
  const host = process.env.MAIL_HOST || "";
  const port = Number(process.env.MAIL_PORT || 587);
  const user = process.env.MAIL_USER || "";
  const pass = process.env.MAIL_PASS || "";
  const from = process.env.MAIL_FROM || user;

  return {
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : null,
    from,
  };
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

const buildHtml = ({ program, source, actionLabel }) => {
  const ccEmails = Array.isArray(program.ccEmails) ? program.ccEmails.join(", ") : "";
  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">${actionLabel} source</h2>
      <p style="margin: 0 0 12px;">Hệ thống đã ${actionLabel.toLowerCase()} source với thông tin như sau:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 6px 0; width: 180px;"><strong>Số hợp đồng</strong></td><td style="padding: 6px 0;">${program.contractCode || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Module</strong></td><td style="padding: 6px 0;">${program.module || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Link source</strong></td><td style="padding: 6px 0;"><a href="${source.sourceLink}" target="_blank" rel="noopener noreferrer">${source.sourceLink}</a></td></tr>
        <tr><td style="padding: 6px 0;"><strong>Ngày hết hạn tải</strong></td><td style="padding: 6px 0;">${formatDateTime(source.expiresAt) || "-"}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Trạng thái tải</strong></td><td style="padding: 6px 0;">${source.downloadStatus || "Chưa tải"}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Số lượt tải</strong></td><td style="padding: 6px 0;">${source.downloadCount || 0} lượt tải</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email nhận</strong></td><td style="padding: 6px 0;">${program.salesReceiverEmail || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email cc</strong></td><td style="padding: 6px 0;">${ccEmails || "Không có"}</td></tr>
      </table>
    </div>
  `;
};

export const sendProgramSourceMail = async ({ program, source, actionLabel }) => {
  const config = getMailConfig();
  if (!config.host || !config.auth || !config.from) {
    throw new Error("Thiếu cấu hình MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS hoặc MAIL_FROM");
  }
  if (!program?.salesReceiverEmail) {
    throw new Error("Phiếu gốc chưa có email kinh doanh nhận");
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: program.salesReceiverEmail,
    cc: Array.isArray(program.ccEmails) && program.ccEmails.length > 0 ? program.ccEmails : undefined,
    subject: `[Dashboard] ${actionLabel} source - ${program.contractCode || "N/A"}`,
    html: buildHtml({ program, source, actionLabel }),
  });
};
