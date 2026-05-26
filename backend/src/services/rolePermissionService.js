import RolePermission from "../models/RolePermission.js";
import { USER_ROLES } from "../models/User.js";

export const ROLE_LABELS = {
  super_admin: "Super Admin",
  admin: "Admin",
  manager: "Quản lý",
  developer: "Lập trình viên",
  designer: "Thiết kế",
  sale: "Kinh doanh",
  viewer: "Chỉ xem",
  user: "Người dùng",
};

export const PERMISSION_GROUPS = [
  {
    key: "staff",
    label: "Nhân sự",
    permissions: [
      { key: "staff.view", label: "Xem" },
      { key: "staff.create", label: "Thêm" },
      { key: "staff.update", label: "Sửa" },
      { key: "staff.delete", label: "Xóa" },
    ],
  },
  {
    key: "program",
    label: "Lập trình",
    permissions: [
      { key: "program.view", label: "Xem" },
      { key: "program.create", label: "Thêm" },
      { key: "program.update", label: "Sửa" },
      { key: "program.delete", label: "Xóa" },
      { key: "program.updateStatus", label: "Đổi trạng thái" },
      { key: "program.updatePoint", label: "Chỉnh điểm" },
      { key: "program.overrideCompleted", label: "Sửa sau hoàn thành" },
    ],
  },
  {
    key: "correction",
    label: "Chỉnh sửa",
    permissions: [
      { key: "correction.view", label: "Xem" },
      { key: "correction.create", label: "Thêm" },
      { key: "correction.update", label: "Sửa" },
      { key: "correction.delete", label: "Xóa" },
      { key: "correction.updateStatus", label: "Đổi trạng thái" },
      { key: "correction.overrideCompleted", label: "Sửa sau hoàn thành" },
    ],
  },
  {
    key: "upgrade",
    label: "Nâng cấp",
    permissions: [
      { key: "upgrade.view", label: "Xem" },
      { key: "upgrade.create", label: "Thêm" },
      { key: "upgrade.update", label: "Sửa" },
      { key: "upgrade.delete", label: "Xóa" },
      { key: "upgrade.updateStatus", label: "Đổi trạng thái" },
      { key: "upgrade.overrideCompleted", label: "Sửa sau hoàn thành" },
    ],
  },
  {
    key: "design",
    label: "Design",
    permissions: [
      { key: "design.view", label: "Xem" },
      { key: "design.create", label: "Thêm" },
      { key: "design.update", label: "Sửa" },
      { key: "design.delete", label: "Xóa" },
      { key: "design.updateStatus", label: "Đổi trạng thái" },
      { key: "design.updatePoint", label: "Chỉnh điểm" },
      { key: "design.overrideCompleted", label: "Sửa sau hoàn thành" },
    ],
  },
  {
    key: "source",
    label: "Source",
    permissions: [
      { key: "source.view", label: "Xem" },
      { key: "source.create", label: "Thêm" },
      { key: "source.update", label: "Sửa" },
      { key: "source.delete", label: "Xóa" },
      { key: "source.sendMail", label: "Gửi mail" },
      { key: "source.updateStatus", label: "Đổi trạng thái" },
    ],
  },

  {
    key: "websiteTemplate",
    label: "Website mẫu",
    permissions: [
      { key: "websiteTemplate.view", label: "Xem" },
      { key: "websiteTemplate.create", label: "Thêm" },
      { key: "websiteTemplate.update", label: "Sửa" },
      { key: "websiteTemplate.delete", label: "Xóa" },
    ],
  },
  {
    key: "server",
    label: "Server",
    permissions: [
      { key: "server.view", label: "Xem" },
      { key: "server.create", label: "Thêm" },
      { key: "server.update", label: "Sửa" },
      { key: "server.delete", label: "Xóa" },
    ],
  },
  {
    key: "contract",
    label: "Hợp đồng",
    permissions: [
      { key: "contract.view", label: "Xem" },
      { key: "contract.create", label: "Thêm" },
      { key: "contract.update", label: "Sửa" },
      { key: "contract.delete", label: "Xóa" },
      { key: "contract.sendMail", label: "Gửi mail" },
      { key: "contract.overrideHandover", label: "Sửa sau bàn giao" },
    ],
  },
  {
    key: "price",
    label: "Bảng giá",
    permissions: [
      { key: "price.view", label: "Xem" },
      { key: "price.create", label: "Thêm" },
      { key: "price.update", label: "Sửa" },
      { key: "price.delete", label: "Xóa" },
    ],
  },
  {
    key: "config",
    label: "Cấu hình",
    permissions: [
      { key: "config.category.view", label: "Xem danh mục" },
      { key: "config.category.update", label: "Sửa danh mục" },
      { key: "config.mail.view", label: "Xem mail" },
      { key: "config.mail.update", label: "Sửa mail" },
      { key: "config.setting.view", label: "Xem tham số" },
      { key: "config.setting.update", label: "Sửa tham số" },
    ],
  },
  {
    key: "template",
    label: "Biểu mẫu email",
    permissions: [
      { key: "template.view", label: "Xem" },
      { key: "template.create", label: "Thêm" },
      { key: "template.update", label: "Sửa" },
      { key: "template.delete", label: "Xóa" },
      { key: "template.setDefault", label: "Đặt mặc định" },
    ],
  },
  {
    key: "permission",
    label: "Phân quyền",
    permissions: [
      { key: "permission.user.view", label: "Xem tài khoản" },
      { key: "permission.user.create", label: "Thêm tài khoản" },
      { key: "permission.user.update", label: "Sửa tài khoản" },
      { key: "permission.user.delete", label: "Xóa tài khoản" },
      { key: "permission.role.view", label: "Xem vai trò" },
      { key: "permission.role.update", label: "Sửa vai trò" },
    ],
  },
];

const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.key));
const unique = (items = []) => Array.from(new Set(items));

const baseViewPermissions = ALL_PERMISSION_KEYS.filter((permission) => permission.endsWith(".view"));

const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: ALL_PERMISSION_KEYS,
  admin: ALL_PERMISSION_KEYS.filter((permission) => permission !== "permission.role.update"),
  manager: unique([
    ...baseViewPermissions,
    "program.create",
    "program.update",
    "program.updateStatus",
    "correction.create",
    "correction.update",
    "correction.updateStatus",
    "upgrade.create",
    "upgrade.update",
    "upgrade.updateStatus",
    "design.create",
    "design.update",
    "design.updateStatus",
    "source.create",
    "source.update",
    "source.sendMail",
    "source.updateStatus",
    "websiteTemplate.create",
    "websiteTemplate.update",
    "contract.create",
    "contract.update",
    "contract.sendMail",
    "template.create",
    "template.update",
    "template.setDefault",
  ]),
  developer: [
    "program.view",
    "program.update",
    "program.updateStatus",
    "correction.view",
    "correction.update",
    "correction.updateStatus",
    "upgrade.view",
    "upgrade.update",
    "upgrade.updateStatus",
    "source.view",
    "websiteTemplate.view",
  ],
  designer: ["design.view", "design.update", "design.updateStatus", "design.updatePoint"],
  sale: [
    "contract.view",
    "contract.create",
    "contract.update",
    "contract.sendMail",
    "source.view",
    "source.sendMail",
    "template.view",
    "websiteTemplate.view",
  ],
  viewer: baseViewPermissions,
  user: ["program.view", "design.view", "source.view", "contract.view", "websiteTemplate.view"],
};

const normalizeRole = (role) => (USER_ROLES.includes(role) ? role : "user");
const normalizePermissions = (permissions = []) =>
  unique((Array.isArray(permissions) ? permissions : []).filter((permission) => ALL_PERMISSION_KEYS.includes(permission)));

const seedRolePermission = async (role, userId = null) => {
  const normalizedRole = normalizeRole(role);
  const existing = await RolePermission.findOne({ role: normalizedRole });
  if (existing) {
    // Super Admin luôn phải hiển thị đủ toàn bộ quyền mới nhất trên ma trận.
    // Các role khác giữ nguyên cấu hình người dùng đã chỉnh, tránh tự bật quyền mới ngoài ý muốn.
    if (normalizedRole === "super_admin") {
      const nextPermissions = ALL_PERMISSION_KEYS;
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
  roleOptions: USER_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] || role })),
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

export const ALL_PERMISSIONS = ALL_PERMISSION_KEYS;