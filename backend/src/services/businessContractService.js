import BusinessContract from "../models/BusinessContract.js";
import SystemCategory from "../models/SystemCategory.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import {
  normalizeBoolean,
  normalizeDate,
  normalizeNumber,
  normalizeString,
} from "../utils/normalize.js";
import { escapeRegex } from "../utils/query.js";

export const BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS = ["Chưa bàn giao", "Đã bàn giao"];
export const BUSINESS_CONTRACT_PROJECT_STATUS_CATEGORY_TYPE = "contractProjectStatus";
export const BUSINESS_CONTRACT_TYPE_CATEGORY_TYPE = "contractType";
export const BUSINESS_CONTRACT_TYPE_OPTIONS = ["Giao diện", "Lập trình", "Nâng cấp", "Upsource"];
export const BUSINESS_CONTRACT_STATUS_OPTIONS = ["Chưa nhận", "Đã nhận", "Đang làm", "Ưu tiên", "Hoãn"];
export const BUSINESS_CONTRACT_LEGACY_STATUS_OPTIONS = ["Đang xử lý", "Hoàn thành"];
export const BUSINESS_CONTRACT_ALLOWED_STATUS_OPTIONS = [
  ...BUSINESS_CONTRACT_STATUS_OPTIONS,
  ...BUSINESS_CONTRACT_LEGACY_STATUS_OPTIONS,
];
export const BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];

export const getBusinessContractStatusOptions = async ({ includeLegacy = true } = {}) => {
  const categories = await SystemCategory.find({
    type: BUSINESS_CONTRACT_PROJECT_STATUS_CATEGORY_TYPE,
    isActive: true,
    isDeleted: false,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name")
    .lean();

  const activeStatuses = categories.map((item) => normalizeString(item.name)).filter(Boolean);
  const baseStatuses = activeStatuses.length > 0 ? activeStatuses : BUSINESS_CONTRACT_STATUS_OPTIONS;
  const nextStatuses = includeLegacy ? [...baseStatuses, ...BUSINESS_CONTRACT_LEGACY_STATUS_OPTIONS] : baseStatuses;

  return [...new Set(nextStatuses)];
};

export const getBusinessContractTypeOptions = async () => {
  const categories = await SystemCategory.find({
    type: BUSINESS_CONTRACT_TYPE_CATEGORY_TYPE,
    isActive: true,
    isDeleted: false,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name")
    .lean();

  const activeTypes = categories.map((item) => normalizeString(item.name)).filter(Boolean);
  return activeTypes.length > 0 ? activeTypes : BUSINESS_CONTRACT_TYPE_OPTIONS;
};


const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isBusinessContractSendMailRequested = (value) => normalizeBoolean(value) === true;

export const parseBusinessContractCcEmails = (ccEmails) => {
  if (!ccEmails) return [];

  if (Array.isArray(ccEmails)) {
    return ccEmails.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }

  return String(ccEmails)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

export const normalizeContractImage = (item) => {
  if (typeof item === "string") {
    const url = normalizeString(item);
    return url ? { url, publicId: "" } : null;
  }

  if (item && typeof item === "object") {
    const url = normalizeString(item.url);
    if (!url) return null;

    return {
      url,
      publicId: normalizeString(item.publicId),
    };
  }

  return null;
};

export const normalizeContractImages = (images) =>
  Array.isArray(images) ? images.map(normalizeContractImage).filter(Boolean) : [];

export const getContractImagePublicIds = (images = []) =>
  normalizeContractImages(images)
    .map((item) => item.publicId)
    .filter(Boolean);

export const getRemovedContractImagePublicIds = (oldImages = [], nextImages = []) => {
  const nextPublicIds = new Set(getContractImagePublicIds(nextImages));
  return getContractImagePublicIds(oldImages).filter((publicId) => !nextPublicIds.has(publicId));
};

export const formatBusinessContractDateTime = (value) => formatDateTime(value, { includeSeconds: false });

export const normalizeBusinessContractPayload = (body = {}) => {
  const customerName = normalizeString(body.customerName);
  const customerEmail = normalizeString(body.customerEmail).toLowerCase();

  return {
    contractCode: normalizeString(body.contractCode),
    contractName: normalizeString(body.contractName),
    contractValue: normalizeNumber(body.contractValue),
    customerName,
    customerPhone: normalizeString(body.customerPhone),
    customerEmail,
    contractType: normalizeString(body.contractType) || BUSINESS_CONTRACT_TYPE_OPTIONS[0],
    status: normalizeString(body.status) || BUSINESS_CONTRACT_STATUS_OPTIONS[0],
    mailStatus: normalizeString(body.mailStatus) || BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS[0],
    selectedSalesStaff: normalizeString(body.selectedSalesStaff),
    selectedManager: normalizeString(body.selectedManager),
    salesReceiverName: normalizeString(body.salesReceiverName) || customerName,
    salesReceiverEmail: normalizeString(body.salesReceiverEmail).toLowerCase() || customerEmail,
    ccEmails: parseBusinessContractCcEmails(body.ccEmails),
    contractImages: normalizeContractImages(body.contractImages),
    expectedHandoverAt: normalizeDate(body.expectedHandoverAt),
    handoverStatus: normalizeString(body.handoverStatus) || BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS[0],
    handoverAt: normalizeDate(body.handoverAt),
    visible: normalizeBoolean(body.visible),
    note: normalizeString(body.note),
  };
};

export const validateBusinessContractPayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.contractCode) return { status: 400, message: "contractCode là bắt buộc" };
  if (!payload.contractName) return { status: 400, message: "contractName là bắt buộc" };
  if (payload.contractValue === null || payload.contractValue < 0)
    return { status: 400, message: "contractValue không hợp lệ" };
  if (!payload.selectedSalesStaff) return { status: 400, message: "selectedSalesStaff là bắt buộc" };
  if (!payload.expectedHandoverAt) return { status: 400, message: "expectedHandoverAt là bắt buộc" };

  const [allowedTypeOptions, allowedStatusOptions] = await Promise.all([
    getBusinessContractTypeOptions(),
    getBusinessContractStatusOptions({ includeLegacy: true }),
  ]);

  if (!allowedTypeOptions.includes(payload.contractType)) {
    return {
      status: 400,
      message: `contractType không hợp lệ. Giá trị cho phép: ${allowedTypeOptions.join(", ")}`,
    };
  }

  if (!allowedStatusOptions.includes(payload.status)) {
    return {
      status: 400,
      message: `status không hợp lệ. Giá trị cho phép: ${allowedStatusOptions.join(", ")}`,
    };
  }

  if (!BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS.includes(payload.mailStatus)) {
    return {
      status: 400,
      message: `mailStatus không hợp lệ. Giá trị cho phép: ${BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (!BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS.includes(payload.handoverStatus)) {
    return {
      status: 400,
      message: `handoverStatus không hợp lệ. Giá trị cho phép: ${BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (payload.handoverStatus === "Đã bàn giao" && !payload.handoverAt) {
    return { status: 400, message: "handoverAt là bắt buộc khi hợp đồng đã bàn giao" };
  }

  if (payload.visible === null) return { status: 400, message: "visible phải là kiểu boolean" };

  if (payload.customerEmail && !EMAIL_REGEX.test(payload.customerEmail)) {
    return { status: 400, message: "customerEmail không đúng định dạng email" };
  }

  const invalidCcEmail = payload.ccEmails.find((email) => !EMAIL_REGEX.test(email));
  if (invalidCcEmail) {
    return { status: 400, message: `ccEmails chứa email không hợp lệ: ${invalidCcEmail}` };
  }

  const existing = await BusinessContract.findOne({
    contractCode: { $regex: `^${escapeRegex(payload.contractCode)}$`, $options: "i" },
    isDeleted: false,
  })
    .select("_id")
    .lean();

  if (existing && String(existing._id) !== excludeId) {
    return { status: 409, message: "Số hợp đồng đã tồn tại" };
  }

  return null;
};

export const toBusinessContractResponseItem = (doc) => ({
  id: doc._id,
  contractCode: doc.contractCode,
  contractName: doc.contractName,
  contractValue: Number(doc.contractValue) || 0,
  customerName: doc.customerName,
  customerPhone: doc.customerPhone || "",
  customerEmail: doc.customerEmail || "",
  contractType: doc.contractType || BUSINESS_CONTRACT_TYPE_OPTIONS[0],
  status: doc.status || BUSINESS_CONTRACT_STATUS_OPTIONS[0],
  mailStatus: doc.mailStatus || BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: doc.selectedSalesStaff || "",
  selectedManager: doc.selectedManager || "",
  salesReceiverName: doc.salesReceiverName || "",
  salesReceiverEmail: doc.salesReceiverEmail || "",
  ccEmails: Array.isArray(doc.ccEmails) ? doc.ccEmails : [],
  contractImages: normalizeContractImages(doc.contractImages),
  expectedHandoverAt: toIsoString(doc.expectedHandoverAt),
  expectedHandoverAtLabel: formatBusinessContractDateTime(doc.expectedHandoverAt),
  handoverStatus: doc.handoverStatus || BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS[0],
  handoverAt: toIsoString(doc.handoverAt),
  handoverAtLabel: formatBusinessContractDateTime(doc.handoverAt),
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatBusinessContractDateTime(doc.createdAt),
});

export const toBusinessContractReferenceItem = (item) => ({
  id: item._id,
  contractCode: item.contractCode || "",
  contractName: item.contractName || "",
  contractValue: Number(item.contractValue) || 0,
  customerName: item.customerName || "",
  contractType: item.contractType || BUSINESS_CONTRACT_TYPE_OPTIONS[0],
  status: item.status || BUSINESS_CONTRACT_STATUS_OPTIONS[0],
  mailStatus: item.mailStatus || BUSINESS_CONTRACT_MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: item.selectedSalesStaff || "",
  selectedManager: item.selectedManager || "",
  salesReceiverName: item.salesReceiverName || "",
  salesReceiverEmail: item.salesReceiverEmail || "",
  ccEmails: Array.isArray(item.ccEmails) ? item.ccEmails : [],
  contractImages: normalizeContractImages(item.contractImages),
  expectedHandoverAt: toIsoString(item.expectedHandoverAt),
  expectedHandoverAtLabel: formatBusinessContractDateTime(item.expectedHandoverAt),
  handoverStatus: item.handoverStatus || BUSINESS_CONTRACT_HANDOVER_STATUS_OPTIONS[0],
  label: `${item.contractCode || "N/A"} - ${item.contractName || "N/A"} - ${item.customerName || "N/A"}`,
});
