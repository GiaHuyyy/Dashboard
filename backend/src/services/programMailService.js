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

const buildHtml = ({ program, actionLabel }) => {
  const ccEmails = Array.isArray(program.ccEmails) ? program.ccEmails.join(", ") : "";

  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">${actionLabel} lập trình</h2>
      <p style="margin: 0 0 12px;">Hệ thống đã ${actionLabel.toLowerCase()} form lập trình với thông tin như sau:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 6px 0; width: 180px;"><strong>Module</strong></td><td style="padding: 6px 0;">${program.module || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Thời gian</strong></td><td style="padding: 6px 0;">${program.time || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Quy đổi</strong></td><td style="padding: 6px 0;">${program.convert || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Design</strong></td><td style="padding: 6px 0;">${program.design ? "Có" : "Không"}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Hiển thị</strong></td><td style="padding: 6px 0;">${program.display ? "Có" : "Không"}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Tên hợp đồng</strong></td><td style="padding: 6px 0;">${program.contractName || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Số hợp đồng</strong></td><td style="padding: 6px 0;">${program.contractCode || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Trạng thái</strong></td><td style="padding: 6px 0;">${program.status || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Mail nhận</strong></td><td style="padding: 6px 0;">${program.mailStatus || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Tên nhân viên KD</strong></td><td style="padding: 6px 0;">${program.selectedSalesStaff || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Tên KD nhận mail</strong></td><td style="padding: 6px 0;">${program.salesReceiverName || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email KD nhận mail</strong></td><td style="padding: 6px 0;">${program.salesReceiverEmail || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email cc</strong></td><td style="padding: 6px 0;">${ccEmails || "Không có"}</td></tr>
      </table>
    </div>
  `;
};

export const sendProgramMail = async ({ program, actionLabel }) => {
  const config = getMailConfig();
  if (!config.host || !config.auth || !config.from) {
    throw new Error("Thiếu cấu hình MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS hoặc MAIL_FROM");
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
    subject: `[Dashboard] ${actionLabel} lập trình - ${program.contractCode || "N/A"}`,
    html: buildHtml({ program, actionLabel }),
  });
};
