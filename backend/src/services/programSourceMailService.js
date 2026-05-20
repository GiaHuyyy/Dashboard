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

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "";
  return `${parsed.toLocaleString("vi-VN")} đ`;
};

const buildRow = (label, value) =>
  `<tr><td style="padding: 6px 0; width: 180px;"><strong>${label}</strong></td><td style="padding: 6px 0;">${value}</td></tr>`;

const joinParts = (parts) => parts.filter(Boolean).join(" - ");

const buildPriceRows = ({ source, priceReferences = {} }) => {
  const rows = [];

  if (source.domain) {
    const domainPrice = priceReferences.domainPrice;
    if (domainPrice) {
      const label = joinParts([
        `${domainPrice.extension} ${domainPrice.provider || ""}`.trim(),
        domainPrice.registerPrice !== undefined ? `Đăng ký: ${formatCurrency(domainPrice.registerPrice)}` : "",
        domainPrice.renewalPrice !== undefined ? `Gia hạn: ${formatCurrency(domainPrice.renewalPrice)}` : "",
        domainPrice.transferPrice !== undefined ? `Chuyển: ${formatCurrency(domainPrice.transferPrice)}` : "",
      ]);
      rows.push(buildRow("Bảng giá domain", label || source.domain));
    } else {
      rows.push(buildRow("Bảng giá domain", source.domain));
    }
  }

  if (source.hostPriceId) {
    const hostPrice = priceReferences.hostPrice;
    const label = hostPrice
      ? joinParts([
          `${hostPrice.name} - ${hostPrice.storage}`.trim(),
          hostPrice.monthlyPrice !== undefined ? `Tháng: ${formatCurrency(hostPrice.monthlyPrice)}` : "",
          hostPrice.yearlyPrice1 !== undefined ? `1 năm: ${formatCurrency(hostPrice.yearlyPrice1)}` : "",
          hostPrice.yearlyPrice2 !== undefined ? `2 năm: ${formatCurrency(hostPrice.yearlyPrice2)}` : "",
          hostPrice.yearlyPrice3 !== undefined ? `3 năm: ${formatCurrency(hostPrice.yearlyPrice3)}` : "",
        ])
      : "Không tìm thấy dữ liệu";
    rows.push(buildRow("Bảng giá host", label));
  }

  if (source.sslPriceId) {
    const sslPrice = priceReferences.sslPrice;
    const label = sslPrice
      ? joinParts([
          `${sslPrice.name} - ${sslPrice.sslType}`.trim(),
          sslPrice.validityMonths ? `${sslPrice.validityMonths} tháng` : "",
          sslPrice.price !== undefined ? formatCurrency(sslPrice.price) : "",
        ])
      : "Không tìm thấy dữ liệu";
    rows.push(buildRow("Bảng giá SSL", label));
  }

  if (source.packagePriceId) {
    const packagePrice = priceReferences.packagePrice;
    const label = packagePrice
      ? joinParts([
          packagePrice.name || "Gói trọn gói",
          packagePrice.monthlyPrice !== undefined ? `Tháng: ${formatCurrency(packagePrice.monthlyPrice)}` : "",
          packagePrice.yearlyPrice !== undefined ? `Năm: ${formatCurrency(packagePrice.yearlyPrice)}` : "",
        ])
      : "Không tìm thấy dữ liệu";
    rows.push(buildRow("Bảng giá trọn gói", label));
  }

  if (source.administrationPriceId) {
    const administrationPrice = priceReferences.administrationPrice;
    const label = administrationPrice
      ? joinParts([
          `${administrationPrice.serviceName} - ${administrationPrice.scope} - ${administrationPrice.frequency}`.trim(),
          administrationPrice.price !== undefined ? formatCurrency(administrationPrice.price) : "",
        ])
      : "Không tìm thấy dữ liệu";
    rows.push(buildRow("Bảng giá quản trị", label));
  }

  if (source.advertisingPriceId) {
    const advertisingPrice = priceReferences.advertisingPrice;
    const label = advertisingPrice
      ? joinParts([
          `${advertisingPrice.platform} - ${advertisingPrice.packageName}`.trim(),
          advertisingPrice.minimumBudget !== undefined
            ? `Ngân sách tối thiểu: ${formatCurrency(advertisingPrice.minimumBudget)}`
            : "",
          advertisingPrice.setupFee !== undefined ? `Phí setup: ${formatCurrency(advertisingPrice.setupFee)}` : "",
          advertisingPrice.serviceFeePercent !== undefined ? `Phí dịch vụ: ${advertisingPrice.serviceFeePercent}%` : "",
        ])
      : "Không tìm thấy dữ liệu";
    rows.push(buildRow("Bảng giá quảng cáo", label));
  }

  return rows.join("");
};

const buildHtml = ({ program, source, actionLabel, priceReferences }) => {
  const ccEmails = Array.isArray(program.ccEmails) ? program.ccEmails.join(", ") : "";
  const priceRows = buildPriceRows({ source, priceReferences });
  return `
    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #334155; line-height: 1.6;">
      <h2 style="margin: 0 0 12px; color: #0f172a;">${actionLabel} source</h2>
      <p style="margin: 0 0 12px;">Hệ thống đã ${actionLabel.toLowerCase()} source với thông tin như sau:</p>
      <table style="border-collapse: collapse; width: 100%; max-width: 720px;">
        ${buildRow("Số hợp đồng", program.contractCode || "")}
        ${buildRow("Module", program.module || "")}
        ${buildRow("Domain", source.domain || "")}
        ${buildRow(
          "Link source",
          `<a href="${source.sourceLink}" target="_blank" rel="noopener noreferrer">${source.sourceLink}</a>`,
        )}
        ${buildRow("Ngày hết hạn tải", formatDateTime(source.expiresAt) || "-")}
        ${buildRow("Trạng thái tải", source.downloadStatus || "Chưa tải")}
        ${buildRow("Số lượt tải", `${source.downloadCount || 0} lượt tải`)}
        ${priceRows}
        ${buildRow("Email nhận", program.salesReceiverEmail || "")}
        ${buildRow("Email cc", ccEmails || "Không có")}
      </table>
    </div>
  `;
};

export const sendProgramSourceMail = async ({ program, source, actionLabel, priceReferences }) => {
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
    html: buildHtml({ program, source, actionLabel, priceReferences }),
  });
};
