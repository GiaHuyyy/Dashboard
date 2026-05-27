import BusinessContract from "../models/BusinessContract.js";
import { deleteImageAsset } from "../services/uploadAssetService.js";
import { sendBusinessContractMail } from "../services/businessContractMailService.js";
import { formatDateTime, toIsoString } from "../utils/date.js";
import {
  normalizeBoolean,
  normalizeDate,
  normalizeNumber,
  normalizeObjectId,
  normalizeString,
  parsePositiveInteger,
} from "../utils/normalize.js";
import { buildSearchOrFilter, escapeRegex } from "../utils/query.js";
import {
  sendBadRequest,
  sendCreated,
  sendError,
  sendNotFound,
  sendOk,
  sendValidationError,
} from "../utils/httpResponse.js";

const HANDOVER_STATUS_OPTIONS = ["Chưa bàn giao", "Đã bàn giao"];
const STATUS_OPTIONS = ["Đã nhận", "Đang xử lý", "Hoàn thành"];
const MAIL_STATUS_OPTIONS = ["Mail nhận", "Mail dự kiến", "Mail hoàn thành"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeFlag = (value) => normalizeBoolean(value) === true;

const parseCcEmails = (ccEmails) => {
  if (!ccEmails) return [];
  if (Array.isArray(ccEmails)) {
    return ccEmails.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
  }
  return String(ccEmails)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
};

const normalizeContractImage = (item) => {
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

const normalizeContractImages = (images) =>
  Array.isArray(images) ? images.map(normalizeContractImage).filter(Boolean) : [];

const getContractImagePublicIds = (images = []) =>
  normalizeContractImages(images)
    .map((item) => item.publicId)
    .filter(Boolean);

const getRemovedContractImagePublicIds = (oldImages = [], nextImages = []) => {
  const nextPublicIds = new Set(getContractImagePublicIds(nextImages));
  return getContractImagePublicIds(oldImages).filter((publicId) => !nextPublicIds.has(publicId));
};

const formatContractDateTime = (value) => formatDateTime(value, { includeSeconds: false });

const normalizePayload = (body = {}) => {
  const contractImages = normalizeContractImages(body.contractImages);
  return {
    contractCode: normalizeString(body.contractCode),
    contractName: normalizeString(body.contractName),
    contractValue: normalizeNumber(body.contractValue),
    customerName: normalizeString(body.customerName),
    customerPhone: normalizeString(body.customerPhone),
    customerEmail: normalizeString(body.customerEmail).toLowerCase(),
    status: normalizeString(body.status) || STATUS_OPTIONS[0],
    mailStatus: normalizeString(body.mailStatus) || MAIL_STATUS_OPTIONS[0],
    selectedSalesStaff: normalizeString(body.selectedSalesStaff),
    salesReceiverName: normalizeString(body.salesReceiverName) || normalizeString(body.customerName),
    salesReceiverEmail:
      normalizeString(body.salesReceiverEmail).toLowerCase() || normalizeString(body.customerEmail).toLowerCase(),
    ccEmails: parseCcEmails(body.ccEmails),
    contractImages,
    expectedHandoverAt: normalizeDate(body.expectedHandoverAt),
    handoverStatus: normalizeString(body.handoverStatus) || HANDOVER_STATUS_OPTIONS[0],
    handoverAt: normalizeDate(body.handoverAt),
    visible: normalizeBoolean(body.visible),
    note: normalizeString(body.note),
  };
};

const validatePayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.contractCode) return { status: 400, message: "contractCode là bắt buộc" };
  if (!payload.contractName) return { status: 400, message: "contractName là bắt buộc" };
  if (payload.contractValue === null || payload.contractValue < 0)
    return { status: 400, message: "contractValue không hợp lệ" };
  if (!payload.customerName) return { status: 400, message: "customerName là bắt buộc" };
  if (!payload.customerEmail) return { status: 400, message: "customerEmail là bắt buộc" };
  if (!payload.selectedSalesStaff) return { status: 400, message: "selectedSalesStaff là bắt buộc" };
  if (!payload.expectedHandoverAt) return { status: 400, message: "expectedHandoverAt là bắt buộc" };

  if (!STATUS_OPTIONS.includes(payload.status)) {
    return { status: 400, message: `status không hợp lệ. Giá trị cho phép: ${STATUS_OPTIONS.join(", ")}` };
  }
  if (!MAIL_STATUS_OPTIONS.includes(payload.mailStatus)) {
    return { status: 400, message: `mailStatus không hợp lệ. Giá trị cho phép: ${MAIL_STATUS_OPTIONS.join(", ")}` };
  }
  if (!HANDOVER_STATUS_OPTIONS.includes(payload.handoverStatus)) {
    return {
      status: 400,
      message: `handoverStatus không hợp lệ. Giá trị cho phép: ${HANDOVER_STATUS_OPTIONS.join(", ")}`,
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

const toResponseItem = (doc) => ({
  id: doc._id,
  contractCode: doc.contractCode,
  contractName: doc.contractName,
  contractValue: Number(doc.contractValue) || 0,
  customerName: doc.customerName,
  customerPhone: doc.customerPhone || "",
  customerEmail: doc.customerEmail || "",
  status: doc.status || STATUS_OPTIONS[0],
  mailStatus: doc.mailStatus || MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: doc.selectedSalesStaff || "",
  salesReceiverName: doc.salesReceiverName || "",
  salesReceiverEmail: doc.salesReceiverEmail || "",
  ccEmails: Array.isArray(doc.ccEmails) ? doc.ccEmails : [],
  contractImages: normalizeContractImages(doc.contractImages),
  expectedHandoverAt: toIsoString(doc.expectedHandoverAt),
  expectedHandoverAtLabel: formatContractDateTime(doc.expectedHandoverAt),
  handoverStatus: doc.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
  handoverAt: toIsoString(doc.handoverAt),
  handoverAtLabel: formatContractDateTime(doc.handoverAt),
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatContractDateTime(doc.createdAt),
});

const toReferenceItem = (item) => ({
  id: item._id,
  contractCode: item.contractCode || "",
  contractName: item.contractName || "",
  contractValue: Number(item.contractValue) || 0,
  customerName: item.customerName || "",
  status: item.status || STATUS_OPTIONS[0],
  mailStatus: item.mailStatus || MAIL_STATUS_OPTIONS[0],
  selectedSalesStaff: item.selectedSalesStaff || "",
  salesReceiverName: item.salesReceiverName || "",
  salesReceiverEmail: item.salesReceiverEmail || "",
  ccEmails: Array.isArray(item.ccEmails) ? item.ccEmails : [],
  contractImages: normalizeContractImages(item.contractImages),
  expectedHandoverAt: toIsoString(item.expectedHandoverAt),
  expectedHandoverAtLabel: formatContractDateTime(item.expectedHandoverAt),
  handoverStatus: item.handoverStatus || HANDOVER_STATUS_OPTIONS[0],
  label: `${item.contractCode || "N/A"} - ${item.contractName || "N/A"} - ${item.customerName || "N/A"}`,
});

export const createBusinessContract = async (req, res) => {
  const shouldSendMail = normalizeFlag(req.body.sendMail);
  const payload = normalizePayload({
    ...req.body,
    contractValue: req.body.contractValue ?? 0,
    visible: req.body.visible ?? true,
  });
  payload.salesReceiverName = payload.customerName;
  payload.salesReceiverEmail = payload.customerEmail;
  if (payload.handoverStatus !== "Đã bàn giao") {
    payload.handoverAt = null;
  }

  const validation = await validatePayload(payload);
  if (validation) return sendValidationError(res, validation);

  const created = await BusinessContract.create({
    ...payload,
    createdBy: req.user.sub,
  });

  const contract = toResponseItem(created);

  if (shouldSendMail) {
    try {
      await sendBusinessContractMail({
        contract,
        actionLabel: "Lưu gửi mail",
      });
    } catch (error) {
      return sendError(res, 500, `Đã lưu hợp đồng nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`);
    }
  }

  return sendCreated(res, {
    message: shouldSendMail ? "Đã tạo hợp đồng và gửi mail thành công" : "Đã tạo hợp đồng kinh doanh",
    contract,
  });
};

export const listBusinessContracts = async (req, res) => {
  const { search = "", handoverStatus = "all", page = "1", limit = "200" } = req.query;
  const pageNumber = parsePositiveInteger(page) || 1;
  const limitNumber = parsePositiveInteger(limit) || 200;
  const skip = (pageNumber - 1) * limitNumber;

  const filters = { isDeleted: false };
  if (handoverStatus && handoverStatus !== "all") {
    filters.handoverStatus = normalizeString(handoverStatus);
  }

  Object.assign(
    filters,
    buildSearchOrFilter(search, [
      "contractCode",
      "contractName",
      "customerName",
      "customerPhone",
      "customerEmail",
      "selectedSalesStaff",
      "salesReceiverName",
      "salesReceiverEmail",
      "note",
    ]),
  );

  const [items, total] = await Promise.all([
    BusinessContract.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limitNumber).lean(),
    BusinessContract.countDocuments(filters),
  ]);

  return sendOk(res, {
    contracts: items.map(toResponseItem),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
    },
  });
};

export const listBusinessContractReferences = async (req, res) => {
  const items = await BusinessContract.find({ isDeleted: false, visible: true })
    .sort({ createdAt: 1 })
    .select(
      "contractCode contractName contractValue customerName status mailStatus selectedSalesStaff salesReceiverName salesReceiverEmail ccEmails contractImages expectedHandoverAt handoverStatus",
    )
    .lean();

  return sendOk(res, {
    contracts: items.map(toReferenceItem),
  });
};

export const getBusinessContractById = async (req, res) => {
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const contract = await BusinessContract.findById(id).lean();
  if (!contract || contract.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  return sendOk(res, { contract: toResponseItem(contract) });
};

export const updateBusinessContract = async (req, res) => {
  const shouldSendMail = normalizeFlag(req.body.sendMail);
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const existing = await BusinessContract.findById(id);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  const input = normalizePayload(req.body);
  const mergedPayload = {
    contractCode: input.contractCode || existing.contractCode,
    contractName: input.contractName || existing.contractName,
    contractValue: input.contractValue === null ? Number(existing.contractValue ?? 0) : input.contractValue,
    customerName: input.customerName || existing.customerName,
    customerPhone: typeof req.body.customerPhone === "string" ? input.customerPhone : existing.customerPhone,
    customerEmail: typeof req.body.customerEmail === "string" ? input.customerEmail : existing.customerEmail,
    status: input.status || existing.status || STATUS_OPTIONS[0],
    mailStatus: input.mailStatus || existing.mailStatus || MAIL_STATUS_OPTIONS[0],
    selectedSalesStaff: input.selectedSalesStaff || existing.selectedSalesStaff,
    salesReceiverName: input.customerName || existing.customerName,
    salesReceiverEmail: input.customerEmail || existing.customerEmail,
    ccEmails: req.body.ccEmails !== undefined ? input.ccEmails : existing.ccEmails,
    contractImages: Array.isArray(req.body.contractImages) ? input.contractImages : existing.contractImages,
    expectedHandoverAt: req.body.expectedHandoverAt === null ? null : input.expectedHandoverAt || existing.expectedHandoverAt,
    handoverStatus: input.handoverStatus || existing.handoverStatus,
    handoverAt: req.body.handoverAt === null ? null : input.handoverAt || existing.handoverAt,
    visible: input.visible === null ? existing.visible : input.visible,
    note: typeof req.body.note === "string" ? input.note : existing.note,
  };

  if (mergedPayload.handoverStatus !== "Đã bàn giao") {
    mergedPayload.handoverAt = null;
  }

  const validation = await validatePayload(mergedPayload, { excludeId: String(existing._id) });
  if (validation) return sendValidationError(res, validation);

  existing.contractCode = mergedPayload.contractCode;
  existing.contractName = mergedPayload.contractName;
  existing.contractValue = mergedPayload.contractValue;
  existing.customerName = mergedPayload.customerName;
  existing.customerPhone = mergedPayload.customerPhone;
  existing.customerEmail = mergedPayload.customerEmail;
  existing.status = mergedPayload.status;
  existing.mailStatus = mergedPayload.mailStatus;
  existing.selectedSalesStaff = mergedPayload.selectedSalesStaff;
  existing.salesReceiverName = mergedPayload.salesReceiverName;
  existing.salesReceiverEmail = mergedPayload.salesReceiverEmail;
  existing.ccEmails = mergedPayload.ccEmails;
  const removedImagePublicIds = getRemovedContractImagePublicIds(existing.contractImages, mergedPayload.contractImages);

  existing.contractImages = mergedPayload.contractImages;
  existing.expectedHandoverAt = mergedPayload.expectedHandoverAt;
  existing.handoverStatus = mergedPayload.handoverStatus;
  existing.handoverAt = mergedPayload.handoverAt;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  await Promise.all(removedImagePublicIds.map((publicId) => deleteImageAsset(publicId)));

  const contract = toResponseItem(existing);

  if (shouldSendMail) {
    try {
      await sendBusinessContractMail({
        contract,
        actionLabel: "Cập nhật gửi mail",
      });
    } catch (error) {
      return sendError(res, 500, `Đã cập nhật hợp đồng nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`);
    }
  }

  return sendOk(res, {
    message: shouldSendMail ? "Đã cập nhật hợp đồng và gửi mail thành công" : "Đã cập nhật hợp đồng kinh doanh",
    contract,
  });
};

export const handoverBusinessContract = async (req, res) => {
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const existing = await BusinessContract.findById(id);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  existing.handoverStatus = "Đã bàn giao";
  existing.handoverAt = existing.handoverAt || new Date();
  await existing.save();

  return sendOk(res, {
    message: "Đã bàn giao hợp đồng cho lập trình",
    contract: toResponseItem(existing),
  });
};

export const deleteBusinessContract = async (req, res) => {
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const existing = await BusinessContract.findById(id);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  const imagePublicIds = getContractImagePublicIds(existing.contractImages);
  existing.isDeleted = true;
  existing.contractImages = [];
  await existing.save();

  await Promise.all(imagePublicIds.map((publicId) => deleteImageAsset(publicId)));

  return sendOk(res, { message: "Đã xóa hợp đồng kinh doanh" });
};

export const deleteBusinessContracts = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeObjectId(item)).filter(Boolean)
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const contracts = await BusinessContract.find(filters).select("contractImages").lean();
  const result = await BusinessContract.updateMany(filters, { isDeleted: true, contractImages: [] });
  const imagePublicIds = contracts.flatMap((contract) => getContractImagePublicIds(contract.contractImages));

  await Promise.all(imagePublicIds.map((publicId) => deleteImageAsset(publicId)));

  return sendOk(res, {
    message: ids.length > 0 ? "Đã xóa các hợp đồng đã chọn" : "Đã xóa toàn bộ hợp đồng kinh doanh",
    deletedCount: result.modifiedCount || 0,
  });
};
