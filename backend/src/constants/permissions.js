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

export const PERMISSIONS = {
  STAFF_VIEW: "staff.view",
  STAFF_CREATE: "staff.create",
  STAFF_UPDATE: "staff.update",
  STAFF_DELETE: "staff.delete",

  PROGRAM_VIEW: "program.view",
  PROGRAM_CREATE: "program.create",
  PROGRAM_UPDATE: "program.update",
  PROGRAM_DELETE: "program.delete",
  PROGRAM_UPDATE_STATUS: "program.updateStatus",
  PROGRAM_UPDATE_POINT: "program.updatePoint",
  PROGRAM_OVERRIDE_COMPLETED: "program.overrideCompleted",

  CORRECTION_VIEW: "correction.view",
  CORRECTION_CREATE: "correction.create",
  CORRECTION_UPDATE: "correction.update",
  CORRECTION_DELETE: "correction.delete",
  CORRECTION_UPDATE_STATUS: "correction.updateStatus",
  CORRECTION_OVERRIDE_COMPLETED: "correction.overrideCompleted",

  UPGRADE_VIEW: "upgrade.view",
  UPGRADE_CREATE: "upgrade.create",
  UPGRADE_UPDATE: "upgrade.update",
  UPGRADE_DELETE: "upgrade.delete",
  UPGRADE_UPDATE_STATUS: "upgrade.updateStatus",
  UPGRADE_OVERRIDE_COMPLETED: "upgrade.overrideCompleted",

  DESIGN_VIEW: "design.view",
  DESIGN_CREATE: "design.create",
  DESIGN_UPDATE: "design.update",
  DESIGN_DELETE: "design.delete",
  DESIGN_UPDATE_STATUS: "design.updateStatus",
  DESIGN_UPDATE_POINT: "design.updatePoint",
  DESIGN_OVERRIDE_COMPLETED: "design.overrideCompleted",

  SOURCE_VIEW: "source.view",
  SOURCE_CREATE: "source.create",
  SOURCE_UPDATE: "source.update",
  SOURCE_DELETE: "source.delete",
  SOURCE_SEND_MAIL: "source.sendMail",
  SOURCE_UPDATE_STATUS: "source.updateStatus",

  WEBSITE_TEMPLATE_VIEW: "websiteTemplate.view",
  WEBSITE_TEMPLATE_CREATE: "websiteTemplate.create",
  WEBSITE_TEMPLATE_UPDATE: "websiteTemplate.update",
  WEBSITE_TEMPLATE_DELETE: "websiteTemplate.delete",

  SERVER_VIEW: "server.view",
  SERVER_CREATE: "server.create",
  SERVER_UPDATE: "server.update",
  SERVER_DELETE: "server.delete",

  CONTRACT_VIEW: "contract.view",
  CONTRACT_CREATE: "contract.create",
  CONTRACT_UPDATE: "contract.update",
  CONTRACT_DELETE: "contract.delete",
  CONTRACT_SEND_MAIL: "contract.sendMail",
  CONTRACT_OVERRIDE_HANDOVER: "contract.overrideHandover",

  PRICE_VIEW: "price.view",
  PRICE_CREATE: "price.create",
  PRICE_UPDATE: "price.update",
  PRICE_DELETE: "price.delete",

  CONFIG_CATEGORY_VIEW: "config.category.view",
  CONFIG_CATEGORY_UPDATE: "config.category.update",
  CONFIG_MAIL_VIEW: "config.mail.view",
  CONFIG_MAIL_UPDATE: "config.mail.update",
  CONFIG_SETTING_VIEW: "config.setting.view",
  CONFIG_SETTING_UPDATE: "config.setting.update",

  TEMPLATE_VIEW: "template.view",
  TEMPLATE_CREATE: "template.create",
  TEMPLATE_UPDATE: "template.update",
  TEMPLATE_DELETE: "template.delete",
  TEMPLATE_SET_DEFAULT: "template.setDefault",

  PERMISSION_USER_VIEW: "permission.user.view",
  PERMISSION_USER_CREATE: "permission.user.create",
  PERMISSION_USER_UPDATE: "permission.user.update",
  PERMISSION_USER_DELETE: "permission.user.delete",
  PERMISSION_ROLE_VIEW: "permission.role.view",
  PERMISSION_ROLE_UPDATE: "permission.role.update",
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

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.key));
export const ALL_PERMISSIONS = ALL_PERMISSION_KEYS;

export const WEBSITE_TEMPLATE_PERMISSION_KEYS = [
  "websiteTemplate.view",
  "websiteTemplate.create",
  "websiteTemplate.update",
  "websiteTemplate.delete",
];

const unique = (items = []) => Array.from(new Set(items));
const baseViewPermissions = ALL_PERMISSION_KEYS.filter((permission) => permission.endsWith(".view"));

export const ROLE_DEFAULT_PERMISSIONS = {
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

export const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Người dùng";

export const getRoleOptions = (roles = []) => roles.map((role) => ({ value: role, label: getRoleLabel(role) }));
