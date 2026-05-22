import { sendConfiguredMail } from "./mailConfigurationService.js";
import { renderDefaultEmailTemplate } from "./emailTemplateRenderService.js";

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

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

const buildImageHtml = (contract) => {
  const images = Array.isArray(contract.contractImages) ? contract.contractImages : [];

  return images
    .filter(Boolean)
    .map(
      (url) =>
        `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin:6px;"><img src="${url}" alt="Contract" style="max-width:240px;max-height:160px;border:1px solid #e2e8f0;border-radius:6px;object-fit:cover;" /></a>`,
    )
    .join("");
};

const buildFallbackHtml = ({ contract, actionLabel }) => {
  const ccEmails = Array.isArray(contract.ccEmails) ? contract.ccEmails.join(", ") : "";
  const imageHtml = buildImageHtml(contract);

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

const buildTemplateVariables = ({ contract, actionLabel }) => ({
  actionLabel: actionLabel || "Cập nhật",
  actionLabelLower: (actionLabel || "Cập nhật").toLowerCase(),
  contractCode: contract.contractCode || "",
  contractName: contract.contractName || "",
  contractValue: formatCurrency(contract.contractValue),
  customerName: contract.customerName || "",
  customerPhone: contract.customerPhone || "",
  customerEmail: contract.customerEmail || "",
  status: contract.status || "",
  mailStatus: contract.mailStatus || "",
  handoverStatus: contract.handoverStatus || "",
  handoverAt: formatDateTime(contract.handoverAt) || "",
  signedDate: formatDateTime(contract.createdAt) || "",
  selectedSalesStaff: contract.selectedSalesStaff || "",
  salesReceiverName: contract.salesReceiverName || "",
  salesReceiverEmail: contract.salesReceiverEmail || "",
  ccEmails: Array.isArray(contract.ccEmails) ? contract.ccEmails.join(", ") : "",
  note: contract.note || "",
});

const buildMailContent = async ({ contract, actionLabel }) => {
  const variables = buildTemplateVariables({ contract, actionLabel });
  const imageHtml = buildImageHtml(contract);

  return renderDefaultEmailTemplate({
    templateType: "contract",
    variables,
    htmlVariables: {
      contractImages: imageHtml || "Không có",
      contractImagesBlock: imageHtml
        ? `<div style="margin-top:18px;"><h3 style="margin:8px 0 6px;color:#0f172a;">Ảnh hợp đồng</h3><div style="display:flex;flex-wrap:wrap;">${imageHtml}</div></div>`
        : "",
    },
    fallback: () => ({
      subject: `[Dashboard] ${actionLabel} hợp đồng - ${contract.contractCode || "N/A"}`,
      html: buildFallbackHtml({ contract, actionLabel }),
    }),
  });
};

export const sendBusinessContractMail = async ({ contract, actionLabel }) => {
  const content = await buildMailContent({ contract, actionLabel });

  return sendConfiguredMail({
    to: contract.customerEmail,
    cc: Array.isArray(contract.ccEmails) && contract.ccEmails.length > 0 ? contract.ccEmails : undefined,
    subject: content.subject,
    html: content.html,
  });
};
