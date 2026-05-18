import mongoose from "mongoose";

import Staff from "../models/Staff.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};

const normalizePayload = (body = {}) => ({
  fullName: normalizeString(body.fullName),
  email: normalizeString(body.email).toLowerCase(),
  phone: normalizeString(body.phone),
  department: normalizeString(body.department) || "Lập trình",
  role: normalizeString(body.role) || "Nhân sự",
  isActive: normalizeBoolean(body.isActive),
});

const validatePayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.fullName) return { status: 400, message: "fullName là bắt buộc" };
  if (!payload.email) return { status: 400, message: "email là bắt buộc" };
  if (!EMAIL_REGEX.test(payload.email)) return { status: 400, message: "email không đúng định dạng" };
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const duplicate = await Staff.findOne({ email: payload.email, isDeleted: false }).select("_id").lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Email nhân sự đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  fullName: doc.fullName,
  email: doc.email,
  phone: doc.phone || "",
  department: doc.department || "",
  role: doc.role || "",
  isActive: Boolean(doc.isActive),
  createdAt: doc.createdAt,
});

export const createStaff = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validation = await validatePayload(payload);
  if (validation) return res.status(validation.status).json({ message: validation.message });

  const created = await Staff.create({
    ...payload,
    createdBy: req.user.sub,
  });
  return res.status(201).json({ message: "Tạo nhân sự thành công", staff: toResponseItem(created) });
};

export const listStaffs = async (req, res) => {
  const keyword = normalizeString(req.query.search).toLowerCase();
  const filters = { isDeleted: false };
  const active = normalizeString(req.query.active);
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;

  if (keyword) {
    filters.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];
  }

  const staffs = await Staff.find(filters).sort({ createdAt: 1 }).lean();
  return res.json({ staffs: staffs.map(toResponseItem) });
};

export const listStaffReferences = async (req, res) => {
  const staffs = await Staff.find({ isDeleted: false, isActive: true }).sort({ fullName: 1 }).select("fullName").lean();
  return res.json({
    staffs: staffs.map((item) => ({
      id: item._id,
      fullName: item.fullName,
    })),
  });
};

export const getStaffById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const staff = await Staff.findById(req.params.id).lean();
  if (!staff || staff.isDeleted) return res.status(404).json({ message: "Không tìm thấy nhân sự" });
  return res.json({ staff: toResponseItem(staff) });
};

export const updateStaff = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const existing = await Staff.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy nhân sự" });

  const input = normalizePayload(req.body);
  const merged = {
    fullName: input.fullName || existing.fullName,
    email: input.email || existing.email,
    phone: typeof req.body.phone === "string" ? input.phone : existing.phone,
    department: input.department || existing.department,
    role: input.role || existing.role,
    isActive: input.isActive === null ? existing.isActive : input.isActive,
  };
  const validation = await validatePayload(merged, { excludeId: String(existing._id) });
  if (validation) return res.status(validation.status).json({ message: validation.message });

  existing.fullName = merged.fullName;
  existing.email = merged.email;
  existing.phone = merged.phone;
  existing.department = merged.department;
  existing.role = merged.role;
  existing.isActive = merged.isActive;
  await existing.save();

  return res.json({ message: "Cập nhật nhân sự thành công", staff: toResponseItem(existing) });
};

export const deleteStaff = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });
  const existing = await Staff.findById(req.params.id);
  if (!existing || existing.isDeleted) return res.status(404).json({ message: "Không tìm thấy nhân sự" });
  existing.isDeleted = true;
  await existing.save();
  return res.json({ message: "Đã xóa nhân sự" });
};
