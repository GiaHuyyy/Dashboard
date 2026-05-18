import mongoose from "mongoose";

import Program from "../models/Program.js";
import ProgramSource from "../models/ProgramSource.js";
import { sendProgramSourceMail } from "../services/programSourceMailService.js";

const SEND_STATUS_OPTIONS = ["Chưa gửi", "Đã gửi"];
const DOWNLOAD_STATUS_OPTIONS = ["Chưa tải", "Đã tải"];

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};
const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const normalizeDate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};
const parsePositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
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
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};
const toIsoString = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};
const isValidHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizePayload = (body = {}) => ({
  programId: normalizeString(body.programId),
  sourceLink: normalizeString(body.sourceLink),
  expiresAt: normalizeDate(body.expiresAt),
  sendStatus: normalizeString(body.sendStatus),
  downloadStatus: normalizeString(body.downloadStatus),
  downloadedAt: normalizeDate(body.downloadedAt),
  downloadCount: normalizeNumber(body.downloadCount),
  visible: normalizeBoolean(body.visible),
  note: normalizeString(body.note),
});

const validatePayload = async (payload) => {
  if (!payload.programId) {
    return { status: 400, message: "programId là bắt buộc" };
  }
  if (!mongoose.isValidObjectId(payload.programId)) {
    return { status: 400, message: "programId không hợp lệ" };
  }

  const program = await Program.findOne({
    _id: payload.programId,
    isDeleted: false,
    $or: [{ type: "program" }, { type: { $exists: false } }],
  })
    .select("contractCode module salesReceiverEmail ccEmails")
    .lean();
  if (!program) {
    return { status: 404, message: "Không tìm thấy phiếu gốc hợp lệ" };
  }

  if (!payload.sourceLink) {
    return { status: 400, message: "sourceLink là bắt buộc" };
  }
  if (!isValidHttpUrl(payload.sourceLink)) {
    return { status: 400, message: "Link source không hợp lệ (chỉ chấp nhận http/https)" };
  }

  if (!payload.expiresAt) {
    return { status: 400, message: "expiresAt là bắt buộc" };
  }

  if (!SEND_STATUS_OPTIONS.includes(payload.sendStatus)) {
    return {
      status: 400,
      message: `sendStatus không hợp lệ. Giá trị cho phép: ${SEND_STATUS_OPTIONS.join(", ")}`,
    };
  }
  if (!DOWNLOAD_STATUS_OPTIONS.includes(payload.downloadStatus)) {
    return {
      status: 400,
      message: `downloadStatus không hợp lệ. Giá trị cho phép: ${DOWNLOAD_STATUS_OPTIONS.join(", ")}`,
    };
  }

  if (payload.downloadCount === null || payload.downloadCount < 0) {
    return { status: 400, message: "downloadCount không hợp lệ" };
  }
  if (!Number.isInteger(payload.downloadCount)) {
    return { status: 400, message: "downloadCount phải là số nguyên" };
  }

  if (payload.visible === null) {
    return { status: 400, message: "visible phải là kiểu boolean" };
  }

  const normalizedDownloadedAt = payload.downloadStatus === "Đã tải" ? payload.downloadedAt || new Date() : null;

  return { program, normalizedDownloadedAt };
};

const toResponseItem = (doc) => ({
  id: doc._id,
  programId: doc.programId?._id || doc.programId,
  contractCode: doc.programId?.contractCode || "",
  module: doc.programId?.module || "",
  sourceLink: doc.sourceLink || "",
  sendStatus: doc.sendStatus || "Chưa gửi",
  sentAt: toIsoString(doc.sentAt),
  sentAtLabel: formatDateTime(doc.sentAt),
  expiresAt: toIsoString(doc.expiresAt),
  expiresAtLabel: formatDateTime(doc.expiresAt),
  downloadStatus: doc.downloadStatus || "Chưa tải",
  downloadedAt: toIsoString(doc.downloadedAt),
  downloadedAtLabel: formatDateTime(doc.downloadedAt),
  downloadCount: doc.downloadCount || 0,
  visible: Boolean(doc.visible),
  note: doc.note || "",
  createdAt: toIsoString(doc.createdAt),
  createdAtLabel: formatDateTime(doc.createdAt),
});

export const createProgramSource = async (req, res) => {
  const shouldSendMail = normalizeBoolean(req.body.sendMail) === true;
  const payload = normalizePayload({
    ...req.body,
    sendStatus: req.body.sendStatus || "Chưa gửi",
    downloadStatus: req.body.downloadStatus || "Chưa tải",
    downloadCount: req.body.downloadCount ?? 0,
    visible: req.body.visible ?? true,
  });

  const validationResult = await validatePayload(payload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  const created = await ProgramSource.create({
    ...payload,
    downloadedAt: validationResult.normalizedDownloadedAt,
    createdBy: req.user.sub,
  });

  if (shouldSendMail) {
    try {
      await sendProgramSourceMail({
        program: validationResult.program,
        source: created,
        actionLabel: "Lưu gửi mail",
      });
      created.sentAt = new Date();
      created.sendStatus = "Đã gửi";
      await created.save();
    } catch (error) {
      return res.status(500).json({
        message: `Đã lưu source nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  const populated = await ProgramSource.findById(created._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.status(201).json({
    message: shouldSendMail ? "Lưu source và gửi mail thành công" : "Lưu source thành công",
    source: toResponseItem(populated),
  });
};

export const listProgramSources = async (req, res) => {
  const { status = "all", search = "", page = "1", limit = "100" } = req.query;
  const pageNumber = parsePositiveInteger(page) || 1;
  const limitNumber = parsePositiveInteger(limit) || 100;
  const skip = (pageNumber - 1) * limitNumber;

  const filters = { isDeleted: false };
  const normalizedStatus = normalizeString(status);
  if (normalizedStatus && normalizedStatus !== "all") {
    filters.sendStatus = normalizedStatus;
  }

  const keyword = normalizeString(search);
  if (keyword) {
    const matchingPrograms = await Program.find({
      isDeleted: false,
      $and: [
        { $or: [{ type: "program" }, { type: { $exists: false } }] },
        {
          $or: [{ contractCode: { $regex: keyword, $options: "i" } }, { module: { $regex: keyword, $options: "i" } }],
        },
      ],
    })
      .select("_id")
      .lean();
    const programIds = matchingPrograms.map((item) => item._id);

    filters.$or = [
      { sourceLink: { $regex: keyword, $options: "i" } },
      { note: { $regex: keyword, $options: "i" } },
      { programId: { $in: programIds } },
    ];
  }

  const [items, total] = await Promise.all([
    ProgramSource.find(filters)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limitNumber)
      .populate({ path: "programId", select: "contractCode module" })
      .lean(),
    ProgramSource.countDocuments(filters),
  ]);

  return res.json({
    sources: items.map(toResponseItem),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
    },
  });
};

export const getProgramSourceById = async (req, res) => {
  const source = await ProgramSource.findById(req.params.id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();
  if (!source || source.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy source" });
  }

  return res.json({ source: toResponseItem(source) });
};

export const updateProgramSource = async (req, res) => {
  const shouldSendMail = normalizeBoolean(req.body.sendMail) === true;
  const existing = await ProgramSource.findById(req.params.id);
  if (!existing || existing.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy source" });
  }

  const normalizedInput = normalizePayload(req.body);
  const mergedPayload = {
    programId: normalizedInput.programId || String(existing.programId),
    sourceLink: normalizedInput.sourceLink || existing.sourceLink,
    expiresAt: normalizedInput.expiresAt || existing.expiresAt,
    sendStatus: normalizedInput.sendStatus || existing.sendStatus,
    downloadStatus: normalizedInput.downloadStatus || existing.downloadStatus,
    downloadedAt: normalizedInput.downloadedAt !== null ? normalizedInput.downloadedAt : existing.downloadedAt,
    downloadCount: normalizedInput.downloadCount === null ? existing.downloadCount : normalizedInput.downloadCount,
    visible: normalizedInput.visible === null ? existing.visible : normalizedInput.visible,
    note: typeof req.body.note === "string" ? normalizedInput.note : existing.note,
  };

  const validationResult = await validatePayload(mergedPayload);
  if (validationResult.status) {
    return res.status(validationResult.status).json({ message: validationResult.message });
  }

  existing.programId = mergedPayload.programId;
  existing.sourceLink = mergedPayload.sourceLink;
  existing.expiresAt = mergedPayload.expiresAt;
  existing.sendStatus = mergedPayload.sendStatus;
  existing.downloadStatus = mergedPayload.downloadStatus;
  existing.downloadedAt = validationResult.normalizedDownloadedAt;
  existing.downloadCount = mergedPayload.downloadCount;
  existing.visible = mergedPayload.visible;
  existing.note = mergedPayload.note;

  await existing.save();

  if (shouldSendMail) {
    try {
      await sendProgramSourceMail({
        program: validationResult.program,
        source: existing,
        actionLabel: "Cập nhật gửi mail",
      });
      existing.sendStatus = "Đã gửi";
      existing.sentAt = new Date();
      await existing.save();
    } catch (error) {
      return res.status(500).json({
        message: `Đã cập nhật source nhưng gửi mail thất bại: ${error?.message || "Unknown error"}`,
      });
    }
  }

  const populated = await ProgramSource.findById(existing._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.json({
    message: shouldSendMail ? "Cập nhật source và gửi mail thành công" : "Cập nhật source thành công",
    source: toResponseItem(populated),
  });
};

export const sendProgramSourceMailById = async (req, res) => {
  const source = await ProgramSource.findById(req.params.id).populate({
    path: "programId",
    select: "contractCode module salesReceiverEmail ccEmails",
  });
  if (!source || source.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy source" });
  }

  const program = source.programId;
  try {
    await sendProgramSourceMail({
      program,
      source,
      actionLabel: "Gửi lại",
    });
  } catch (error) {
    return res.status(500).json({ message: error?.message || "Gửi mail thất bại" });
  }

  source.sendStatus = "Đã gửi";
  source.sentAt = new Date();
  await source.save();

  const populated = await ProgramSource.findById(source._id)
    .populate({ path: "programId", select: "contractCode module" })
    .lean();

  return res.json({
    message: "Gửi lại mail thành công",
    source: toResponseItem(populated),
  });
};

export const deleteProgramSource = async (req, res) => {
  const source = await ProgramSource.findById(req.params.id);
  if (!source || source.isDeleted) {
    return res.status(404).json({ message: "Không tìm thấy source" });
  }

  source.isDeleted = true;
  await source.save();

  return res.json({ message: "Đã xóa source" });
};

export const deleteProgramSources = async (req, res) => {
  const ids = Array.isArray(req.body?.ids)
    ? req.body.ids.map((item) => normalizeString(String(item))).filter((item) => mongoose.isValidObjectId(item))
    : [];

  const filters = ids.length > 0 ? { _id: { $in: ids }, isDeleted: false } : { isDeleted: false };
  const result = await ProgramSource.updateMany(filters, { isDeleted: true });

  return res.json({
    message: ids.length > 0 ? "Đã xóa các source đã chọn" : "Đã xóa toàn bộ source",
    deletedCount: result.modifiedCount || 0,
  });
};
