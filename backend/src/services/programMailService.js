import { sendConfiguredMail } from "./mailConfigurationService.js";

const buildHtml = ({ program, actionLabel }) => {
  const ccEmails = Array.isArray(program.ccEmails) ? program.ccEmails.join(", ") : "";
  const images = Array.isArray(program.contractImages) ? program.contractImages : [];

  const renderImagesHtml = () => {
    const normalized = images
      .map((img) => {
        if (!img) return null;
        if (typeof img === "string") return img;
        if (typeof img === "object") return img.url || img.path || img.src || null;
        return null;
      })
      .filter(Boolean);

    if (normalized.length === 0) return "";

    const itemsHtml = normalized
      .map(
        (url) =>
          `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px;"><img src="${url}" alt="Contract image" style="max-width:240px;max-height:160px;border:1px solid #e2e8f0;border-radius:6px;object-fit:cover;" /></a>`,
      )
      .join("");

    return `
      <div style="margin-top:18px;">
        <h3 style="margin:8px 0 6px;color:#0f172a;">Ảnh hợp đồng</h3>
        <div style="display:flex;flex-wrap:wrap;">${itemsHtml}</div>
      </div>
    `;
  };

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
      ${renderImagesHtml()}
    </div>
  `;
};

export const sendProgramMail = async ({ program, actionLabel }) => {
  return sendConfiguredMail({
    to: program.salesReceiverEmail,
    cc: Array.isArray(program.ccEmails) && program.ccEmails.length > 0 ? program.ccEmails : undefined,
    subject: `[Dashboard] ${actionLabel} lập trình - ${program.contractCode || "N/A"}`,
    html: buildHtml({ program, actionLabel }),
  });
};
