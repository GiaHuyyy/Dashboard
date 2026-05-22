import mongoose from "mongoose";

import User, { USER_ROLES } from "../models/User.js";

const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Quản lý",
  developer: "Lập trình viên",
  designer: "Thiết kế",
  sale: "Kinh doanh",
  viewer: "Chỉ xem",
  user: "Người dùng",
};

const normalizeString = (value) => (typeof value === "string" ? value.trim() : "");
const normalizeBoolean = (value) => {
  if (value === true || value === false) return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  name: doc.name || "",
  userName: doc.userName || "",
  role: doc.role || "user",
  roleLabel: ROLE_LABELS[doc.role] || doc.role || "Người dùng",
  isActive: doc.isActive !== false,
  note: doc.note || "",
  createdAt: doc.createdAt,
});

const normalizePayload = (body = {}) => ({
  name: normalizeString(body.name),
  userName: normalizeString(body.userName),
  password: typeof body.password === "string" ? body.password : "",
  role: normalizeString(body.role) || "user",
  isActive: normalizeBoolean(body.isActive),
  note: normalizeString(body.note),
});

const validatePayload = async (payload, { isEditMode = false, excludeId = "" } = {}) => {
  if (!payload.name) return { status: 400, message: "Họ tên là bắt buộc" };
  if (!payload.userName) return { status: 400, message: "Tên đăng nhập là bắt buộc" };
  if (!isEditMode && !payload.password) return { status: 400, message: "Mật khẩu là bắt buộc" };
  if (payload.password && payload.password.length < 6) return { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
  if (!USER_ROLES.includes(payload.role)) return { status: 400, message: "Vai trò không hợp lệ" };
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const duplicate = await User.findOne({ userName: payload.userName }).select("_id").lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Tên đăng nhập đã tồn tại" };
  }

  return null;
};

const canManageUser = (currentUserRole, targetRole) => {
  if (currentUserRole === "super_admin") return true;
  if (currentUserRole === "admin" && targetRole !== "super_admin") return true;
  return false;
};

export const listUsers = async (req, res) => {
  const search = normalizeString(req.query.search);
  const role = normalizeString(req.query.role);
  const active = normalizeString(req.query.active);

  const filters = {};
  if (role && role !== "all") filters.role = role;
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;

  if (search) {
    filters.$or = [
      { name: { $regex: search, $options: "i" } },
      { userName: { $regex: search, $options: "i" } },
      { note: { $regex: search, $options: "i" } },
    ];
  }

  const users = await User.find(filters).sort({ createdAt: 1 }).select("-password").lean();

  return res.json({
    users: users.map(toResponseItem),
    roleOptions: USER_ROLES.map((item) => ({ value: item, label: ROLE_LABELS[item] || item })),
  });
};

export const getUserById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });

  const user = await User.findById(req.params.id).select("-password").lean();
  if (!user) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

  return res.json({ user: toResponseItem(user) });
};

export const createUser = async (req, res) => {
  const payload = normalizePayload(req.body);
  const validation = await validatePayload(payload);
  if (validation) return res.status(validation.status).json({ message: validation.message });

  if (!canManageUser(req.user?.role, payload.role)) {
    return res.status(403).json({ message: "Bạn không có quyền tạo tài khoản với vai trò này" });
  }

  const created = await User.create(payload);

  return res.status(201).json({
    message: "Đã tạo tài khoản",
    user: toResponseItem(created),
  });
};

export const updateUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });

  const existing = await User.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

  if (!canManageUser(req.user?.role, existing.role)) {
    return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tài khoản này" });
  }

  const payload = normalizePayload(req.body);
  const merged = {
    name: payload.name || existing.name,
    userName: payload.userName || existing.userName,
    password: payload.password || "",
    role: payload.role || existing.role,
    isActive: payload.isActive === null ? existing.isActive : payload.isActive,
    note: typeof req.body.note === "string" ? payload.note : existing.note,
  };

  if (!canManageUser(req.user?.role, merged.role)) {
    return res.status(403).json({ message: "Bạn không có quyền gán vai trò này" });
  }

  if (existing.role === "super_admin" && existing._id.toString() === req.user?.sub && merged.isActive === false) {
    return res.status(400).json({ message: "Không thể khóa chính tài khoản Super Admin đang đăng nhập" });
  }

  const validation = await validatePayload(merged, { isEditMode: true, excludeId: String(existing._id) });
  if (validation) return res.status(validation.status).json({ message: validation.message });

  existing.name = merged.name;
  existing.userName = merged.userName;
  existing.role = merged.role;
  existing.isActive = merged.isActive;
  existing.note = merged.note;
  if (payload.password) existing.password = payload.password;
  await existing.save();

  return res.json({
    message: "Đã cập nhật tài khoản",
    user: toResponseItem(existing),
  });
};

export const deleteUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });

  const existing = await User.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

  if (String(existing._id) === req.user?.sub) {
    return res.status(400).json({ message: "Không thể xóa chính tài khoản đang đăng nhập" });
  }

  if (!canManageUser(req.user?.role, existing.role)) {
    return res.status(403).json({ message: "Bạn không có quyền xóa tài khoản này" });
  }

  await existing.deleteOne();

  return res.json({ message: "Đã xóa tài khoản" });
};
