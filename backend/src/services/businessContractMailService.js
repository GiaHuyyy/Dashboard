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

const buildHtml = ({ contract, actionLabel }) => {
  const ccEmails = Array.isArray(contract.ccEmails) ? contract.ccEmails.join(", ") : "";
  const images = Array.isArray(contract.contractImages) ? contract.contractImages : [];

  const imageHtml = images
    .filter(Boolean)
    .map(
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px;"><img src="${url}" alt="Contract" style="max-width:240px;max-height:160px;border:1px solid #e2e8f0;border-radius:6px;object-fit:cover;" /></a>`,
    )
    .join("");

  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">${actionLabel} hợp đồng kinh doanh</h2>
      <p style="margin: 0 0 12px;">Hệ thống đã ${actionLabel.toLowerCase()} với thông tin như sau:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        <tr><td style="padding: 6px 0; width: 180px;"><strong>Số hợp đồng</strong></td><td style="padding: 6px 0;">${contract.contractCode || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Tên hợp đồng</strong></td><td style="padding: 6px 0;">${contract.contractName || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Khách hàng</strong></td><td style="padding: 6px 0;">${contract.customerName || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Số điện thoại</strong></td><td style="padding: 6px 0;">${contract.customerPhone || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email khách hàng</strong></td><td style="padding: 6px 0;">${contract.customerEmail || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Mail nhận</strong></td><td style="padding: 6px 0;">${contract.mailStatus || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Nhân viên kinh doanh</strong></td><td style="padding: 6px 0;">${contract.selectedSalesStaff || ""}</td></tr>
        <tr><td style="padding: 6px 0;"><strong>Email CC</strong></td><td style="padding: 6px 0;">${ccEmails || "Không có"}</td></tr>
      </table>
      ${imageHtml ? `<div style="margin-top:18px;"><h3 style="margin:8px 0 6px;color:#0f172a;">Ảnh hợp đồng</h3><div style="display:flex;flex-wrap:wrap;">${imageHtml}</div></div>` : ""}
    </div>
  `;
};

export const sendBusinessContractMail = async ({ contract, actionLabel }) => {
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
    to: contract.customerEmail,
    cc: Array.isArray(contract.ccEmails) && contract.ccEmails.length > 0 ? contract.ccEmails : undefined,
    subject: `[Dashboard] ${actionLabel} hợp đồng - ${contract.contractCode || "N/A"}`,
    html: buildHtml({ contract, actionLabel }),
  });
};
