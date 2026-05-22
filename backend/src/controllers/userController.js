import mongoose from "mongoose";

import User, { USER_ROLES, getUserRoles } from "../models/User.js";

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

const normalizeRoles = (value) => {
  const input = Array.isArray(value) ? value : value ? [value] : [];
  const roles = input
    .map((item) => normalizeString(item))
    .filter((item) => USER_ROLES.includes(item));

  return Array.from(new Set(roles));
};

const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Người dùng";

const toResponseItem = (doc) => {
  const roles = getUserRoles(doc);

  return {
    id: doc._id,
    name: doc.name || "",
    userName: doc.userName || "",
    role: roles[0] || "user",
    roles,
    roleLabel: roles.map(getRoleLabel).join(", "),
    roleLabels: roles.map(getRoleLabel),
    isActive: doc.isActive !== false,
    note: doc.note || "",
    createdAt: doc.createdAt,
  };
};

const normalizePayload = (body = {}) => {
  const roles = normalizeRoles(body.roles ?? body.role);

  return {
    name: normalizeString(body.name),
    userName: normalizeString(body.userName),
    password: typeof body.password === "string" ? body.password : "",
    roles: roles.length > 0 ? roles : ["user"],
    isActive: normalizeBoolean(body.isActive),
    note: normalizeString(body.note),
  };
};

const validatePayload = async (payload, { isEditMode = false, excludeId = "" } = {}) => {
  if (!payload.name) return { status: 400, message: "Họ tên là bắt buộc" };
  if (!payload.userName) return { status: 400, message: "Tên đăng nhập là bắt buộc" };
  if (!isEditMode && !payload.password) return { status: 400, message: "Mật khẩu là bắt buộc" };
  if (payload.password && payload.password.length < 6) return { status: 400, message: "Mật khẩu tối thiểu 6 ký tự" };
  if (!Array.isArray(payload.roles) || payload.roles.length === 0) {
    return { status: 400, message: "Vui lòng chọn ít nhất một vai trò" };
  }
  if (payload.roles.some((role) => !USER_ROLES.includes(role))) {
    return { status: 400, message: "Vai trò không hợp lệ" };
  }
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const duplicate = await User.findOne({ userName: payload.userName }).select("_id").lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Tên đăng nhập đã tồn tại" };
  }

  return null;
};

const hasRole = (roles, role) => roles.includes(role);
const canManageUser = (currentUserRoles = [], targetRoles = []) => {
  if (hasRole(currentUserRoles, "super_admin")) return true;
  if (hasRole(currentUserRoles, "admin") && !hasRole(targetRoles, "super_admin")) return true;
  return false;
};

export const listUsers = async (req, res) => {
  const search = normalizeString(req.query.search);
  const role = normalizeString(req.query.role);
  const active = normalizeString(req.query.active);

  const filters = {};
  if (role && role !== "all") {
    filters.$or = [{ roles: role }, { role }];
  }
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;

  if (search) {
    filters.$and = filters.$and || [];
    filters.$and.push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { note: { $regex: search, $options: "i" } },
      ],
    });
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

  const currentRoles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  if (!canManageUser(currentRoles, payload.roles)) {
    return res.status(403).json({ message: "Bạn không có quyền tạo tài khoản với vai trò này" });
  }

  const created = await User.create({
    ...payload,
    role: payload.roles[0],
  });

  return res.status(201).json({
    message: "Đã tạo tài khoản",
    user: toResponseItem(created),
  });
};

export const updateUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "id không hợp lệ" });

  const existing = await User.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Không tìm thấy tài khoản" });

  const currentRoles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  const existingRoles = getUserRoles(existing);

  if (!canManageUser(currentRoles, existingRoles)) {
    return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa tài khoản này" });
  }

  const payload = normalizePayload(req.body);
  const merged = {
    name: payload.name || existing.name,
    userName: payload.userName || existing.userName,
    password: payload.password || "",
    roles: payload.roles.length > 0 ? payload.roles : existingRoles,
    isActive: payload.isActive === null ? existing.isActive : payload.isActive,
    note: typeof req.body.note === "string" ? payload.note : existing.note,
  };

  if (!canManageUser(currentRoles, merged.roles)) {
    return res.status(403).json({ message: "Bạn không có quyền gán vai trò này" });
  }

  if (hasRole(existingRoles, "super_admin") && existing._id.toString() === req.user?.sub) {
    if (merged.isActive === false) {
      return res.status(400).json({ message: "Không thể khóa chính tài khoản Super Admin đang đăng nhập" });
    }
    if (!hasRole(merged.roles, "super_admin")) {
      return res.status(400).json({ message: "Không thể tự gỡ vai trò Super Admin khỏi tài khoản đang đăng nhập" });
    }
  }

  const validation = await validatePayload(merged, { isEditMode: true, excludeId: String(existing._id) });
  if (validation) return res.status(validation.status).json({ message: validation.message });

  existing.name = merged.name;
  existing.userName = merged.userName;
  existing.roles = merged.roles;
  existing.role = merged.roles[0] || "user";
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

  const currentRoles = Array.isArray(req.user?.roles) ? req.user.roles : [req.user?.role].filter(Boolean);
  const existingRoles = getUserRoles(existing);

  if (!canManageUser(currentRoles, existingRoles)) {
    return res.status(403).json({ message: "Bạn không có quyền xóa tài khoản này" });
  }

  await existing.deleteOne();

  return res.json({ message: "Đã xóa tài khoản" });
};
