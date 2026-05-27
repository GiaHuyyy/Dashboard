import {
  ALL_PERMISSION_KEYS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_LABELS,
  WEBSITE_TEMPLATE_PERMISSION_KEYS,
  getRoleOptions,
} from "../constants/permissions.js";
import RolePermission from "../models/RolePermission.js";
import { USER_ROLES } from "../models/User.js";

const unique = (items = []) => Array.from(new Set(items));

const normalizeRole = (role) => (USER_ROLES.includes(role) ? role : "user");
const normalizePermissions = (permissions = []) =>
  unique((Array.isArray(permissions) ? permissions : []).filter((permission) => ALL_PERMISSION_KEYS.includes(permission)));

const seedRolePermission = async (role, userId = null) => {
  const normalizedRole = normalizeRole(role);
  const existing = await RolePermission.findOne({ role: normalizedRole });
  if (existing) {
    // Super Admin luôn phải hiển thị đủ toàn bộ quyền mới nhất trên ma trận.
    // Admin mặc định phải có đủ quyền Website mẫu để dùng được module Kho mẫu ngay sau khi cập nhật.
    // Các role khác giữ nguyên cấu hình người dùng đã chỉnh, tránh tự bật quyền mới ngoài ý muốn.
    if (normalizedRole === "super_admin" || normalizedRole === "admin") {
      const nextPermissions =
        normalizedRole === "super_admin"
          ? ALL_PERMISSION_KEYS
          : unique([...normalizePermissions(existing.permissions), ...WEBSITE_TEMPLATE_PERMISSION_KEYS]);

      const currentPermissions = normalizePermissions(existing.permissions);
      const hasDifference =
        currentPermissions.length !== nextPermissions.length || nextPermissions.some((permission) => !currentPermissions.includes(permission));

      if (hasDifference) {
        existing.permissions = nextPermissions;
        existing.name = ROLE_LABELS[normalizedRole] || normalizedRole;
        existing.isSystem = true;
        existing.updatedBy = userId || existing.updatedBy || null;
        await existing.save();
      }
    }

    return existing;
  }

  return RolePermission.create({
    role: normalizedRole,
    name: ROLE_LABELS[normalizedRole] || normalizedRole,
    permissions: ROLE_DEFAULT_PERMISSIONS[normalizedRole] || [],
    isSystem: true,
    note: "",
    updatedBy: userId || null,
  });
};

export const ensureRolePermissions = async (userId = null) => {
  const rows = [];
  for (const role of USER_ROLES) {
    rows.push(await seedRolePermission(role, userId));
  }
  return rows;
};

export const getPermissionDefinitions = () => ({
  groups: PERMISSION_GROUPS,
  roleOptions: getRoleOptions(USER_ROLES),
});

export const listRolePermissions = async (userId = null) => {
  await ensureRolePermissions(userId);
  const rows = await RolePermission.find({ role: { $in: USER_ROLES } }).sort({ role: 1 }).lean();
  const orderMap = new Map(USER_ROLES.map((role, index) => [role, index]));

  return rows.sort((a, b) => (orderMap.get(a.role) ?? 999) - (orderMap.get(b.role) ?? 999));
};

export const updateRolePermissions = async ({ role, permissions, userId = null }) => {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "super_admin") {
    throw Object.assign(new Error("Không thể chỉnh sửa quyền của Super Admin"), { status: 400 });
  }

  const normalizedPermissions = normalizePermissions(permissions);

  await RolePermission.findOneAndUpdate(
    { role: normalizedRole },
    {
      $set: {
        role: normalizedRole,
        name: ROLE_LABELS[normalizedRole] || normalizedRole,
        permissions: normalizedPermissions,
        isSystem: true,
        updatedBy: userId || null,
      },
    },
    { upsert: true, new: true },
  );

  return listRolePermissions(userId);
};

export const getPermissionsForRoles = async (roles = []) => {
  const normalizedRoles = unique((Array.isArray(roles) ? roles : [roles]).map(normalizeRole));
  if (normalizedRoles.includes("super_admin")) return ALL_PERMISSION_KEYS;

  await ensureRolePermissions();
  const rows = await RolePermission.find({ role: { $in: normalizedRoles } }).lean();
  return unique(rows.flatMap((item) => item.permissions || []));
};

export { ALL_PERMISSIONS };
