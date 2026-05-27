import BusinessContract from "../models/BusinessContract.js";
import { sendBusinessContractMail } from "../services/businessContractMailService.js";
import {
  getContractImagePublicIds,
  getRemovedContractImagePublicIds,
  isBusinessContractSendMailRequested,
  normalizeBusinessContractPayload,
  toBusinessContractReferenceItem,
  toBusinessContractResponseItem,
  validateBusinessContractPayload,
} from "../services/businessContractService.js";
import { deleteImageAsset } from "../services/uploadAssetService.js";
import {
  normalizeObjectId,
  normalizeString,
  parsePositiveInteger,
} from "../utils/normalize.js";
import { buildSearchOrFilter } from "../utils/query.js";
import {
  sendBadRequest,
  sendCreated,
  sendError,
  sendNotFound,
  sendOk,
  sendValidationError,
} from "../utils/httpResponse.js";

export const createBusinessContract = async (req, res) => {
  const shouldSendMail = isBusinessContractSendMailRequested(req.body.sendMail);
  const payload = normalizeBusinessContractPayload({
    ...req.body,
    contractValue: req.body.contractValue ?? 0,
    visible: req.body.visible ?? true,
  });

  payload.salesReceiverName = payload.customerName;
  payload.salesReceiverEmail = payload.customerEmail;

  if (payload.handoverStatus !== "Đã bàn giao") {
    payload.handoverAt = null;
  }

  const validation = await validateBusinessContractPayload(payload);
  if (validation) return sendValidationError(res, validation);

  const created = await BusinessContract.create({
    ...payload,
    createdBy: req.user.sub,
  });

  const contract = toBusinessContractResponseItem(created);

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
    contracts: items.map(toBusinessContractResponseItem),
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
    contracts: items.map(toBusinessContractReferenceItem),
  });
};

export const getBusinessContractById = async (req, res) => {
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const contract = await BusinessContract.findById(id).lean();
  if (!contract || contract.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  return sendOk(res, { contract: toBusinessContractResponseItem(contract) });
};

export const updateBusinessContract = async (req, res) => {
  const shouldSendMail = isBusinessContractSendMailRequested(req.body.sendMail);
  const id = normalizeObjectId(req.params.id);
  if (!id) return sendBadRequest(res, "id không hợp lệ");

  const existing = await BusinessContract.findById(id);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy hợp đồng kinh doanh");

  const input = normalizeBusinessContractPayload(req.body);
  const mergedPayload = {
    contractCode: input.contractCode || existing.contractCode,
    contractName: input.contractName || existing.contractName,
    contractValue: input.contractValue === null ? Number(existing.contractValue ?? 0) : input.contractValue,
    customerName: input.customerName || existing.customerName,
    customerPhone: typeof req.body.customerPhone === "string" ? input.customerPhone : existing.customerPhone,
    customerEmail: typeof req.body.customerEmail === "string" ? input.customerEmail : existing.customerEmail,
    status: input.status || existing.status,
    mailStatus: input.mailStatus || existing.mailStatus,
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

  const validation = await validateBusinessContractPayload(mergedPayload, { excludeId: String(existing._id) });
  if (validation) return sendValidationError(res, validation);

  const removedImagePublicIds = getRemovedContractImagePublicIds(existing.contractImages, mergedPayload.contractImages);

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
  existing.contractImages = mergedPayload.contractImages;
  existing.expectedHandoverAt = mergedPayload.expectedHandoverAt;
  existing.handoverStatus = mergedPayload.handoverStatus;
  existing.handoverAt = mergedPayload.handoverAt;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;
  await existing.save();

  await Promise.all(removedImagePublicIds.map((publicId) => deleteImageAsset(publicId)));

  const contract = toBusinessContractResponseItem(existing);

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
    contract: toBusinessContractResponseItem(existing),
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
