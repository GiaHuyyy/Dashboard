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

const permission = (key, label) => ({ key, label });

export const PERMISSION_GROUPS = [
  {
    key: "staff",
    label: "Nhân sự",
    permissions: [
      permission(PERMISSIONS.STAFF_VIEW, "Xem"),
      permission(PERMISSIONS.STAFF_CREATE, "Thêm"),
      permission(PERMISSIONS.STAFF_UPDATE, "Sửa"),
      permission(PERMISSIONS.STAFF_DELETE, "Xóa"),
    ],
  },
  {
    key: "program",
    label: "Lập trình",
    permissions: [
      permission(PERMISSIONS.PROGRAM_VIEW, "Xem"),
      permission(PERMISSIONS.PROGRAM_CREATE, "Thêm"),
      permission(PERMISSIONS.PROGRAM_UPDATE, "Sửa"),
      permission(PERMISSIONS.PROGRAM_DELETE, "Xóa"),
      permission(PERMISSIONS.PROGRAM_UPDATE_STATUS, "Đổi trạng thái"),
      permission(PERMISSIONS.PROGRAM_UPDATE_POINT, "Chỉnh điểm"),
      permission(PERMISSIONS.PROGRAM_OVERRIDE_COMPLETED, "Sửa sau hoàn thành"),
    ],
  },
  {
    key: "correction",
    label: "Chỉnh sửa",
    permissions: [
      permission(PERMISSIONS.CORRECTION_VIEW, "Xem"),
      permission(PERMISSIONS.CORRECTION_CREATE, "Thêm"),
      permission(PERMISSIONS.CORRECTION_UPDATE, "Sửa"),
      permission(PERMISSIONS.CORRECTION_DELETE, "Xóa"),
      permission(PERMISSIONS.CORRECTION_UPDATE_STATUS, "Đổi trạng thái"),
      permission(PERMISSIONS.CORRECTION_OVERRIDE_COMPLETED, "Sửa sau hoàn thành"),
    ],
  },
  {
    key: "upgrade",
    label: "Nâng cấp",
    permissions: [
      permission(PERMISSIONS.UPGRADE_VIEW, "Xem"),
      permission(PERMISSIONS.UPGRADE_CREATE, "Thêm"),
      permission(PERMISSIONS.UPGRADE_UPDATE, "Sửa"),
      permission(PERMISSIONS.UPGRADE_DELETE, "Xóa"),
      permission(PERMISSIONS.UPGRADE_UPDATE_STATUS, "Đổi trạng thái"),
      permission(PERMISSIONS.UPGRADE_OVERRIDE_COMPLETED, "Sửa sau hoàn thành"),
    ],
  },
  {
    key: "design",
    label: "Design",
    permissions: [
      permission(PERMISSIONS.DESIGN_VIEW, "Xem"),
      permission(PERMISSIONS.DESIGN_CREATE, "Thêm"),
      permission(PERMISSIONS.DESIGN_UPDATE, "Sửa"),
      permission(PERMISSIONS.DESIGN_DELETE, "Xóa"),
      permission(PERMISSIONS.DESIGN_UPDATE_STATUS, "Đổi trạng thái"),
      permission(PERMISSIONS.DESIGN_UPDATE_POINT, "Chỉnh điểm"),
      permission(PERMISSIONS.DESIGN_OVERRIDE_COMPLETED, "Sửa sau hoàn thành"),
    ],
  },
  {
    key: "source",
    label: "Source",
    permissions: [
      permission(PERMISSIONS.SOURCE_VIEW, "Xem"),
      permission(PERMISSIONS.SOURCE_CREATE, "Thêm"),
      permission(PERMISSIONS.SOURCE_UPDATE, "Sửa"),
      permission(PERMISSIONS.SOURCE_DELETE, "Xóa"),
      permission(PERMISSIONS.SOURCE_SEND_MAIL, "Gửi mail"),
      permission(PERMISSIONS.SOURCE_UPDATE_STATUS, "Đổi trạng thái"),
    ],
  },
  {
    key: "websiteTemplate",
    label: "Website mẫu",
    permissions: [
      permission(PERMISSIONS.WEBSITE_TEMPLATE_VIEW, "Xem"),
      permission(PERMISSIONS.WEBSITE_TEMPLATE_CREATE, "Thêm"),
      permission(PERMISSIONS.WEBSITE_TEMPLATE_UPDATE, "Sửa"),
      permission(PERMISSIONS.WEBSITE_TEMPLATE_DELETE, "Xóa"),
    ],
  },
  {
    key: "server",
    label: "Server",
    permissions: [
      permission(PERMISSIONS.SERVER_VIEW, "Xem"),
      permission(PERMISSIONS.SERVER_CREATE, "Thêm"),
      permission(PERMISSIONS.SERVER_UPDATE, "Sửa"),
      permission(PERMISSIONS.SERVER_DELETE, "Xóa"),
    ],
  },
  {
    key: "contract",
    label: "Hợp đồng",
    permissions: [
      permission(PERMISSIONS.CONTRACT_VIEW, "Xem"),
      permission(PERMISSIONS.CONTRACT_CREATE, "Thêm"),
      permission(PERMISSIONS.CONTRACT_UPDATE, "Sửa"),
      permission(PERMISSIONS.CONTRACT_DELETE, "Xóa"),
      permission(PERMISSIONS.CONTRACT_SEND_MAIL, "Gửi mail"),
      permission(PERMISSIONS.CONTRACT_OVERRIDE_HANDOVER, "Sửa sau bàn giao"),
    ],
  },
  {
    key: "price",
    label: "Bảng giá",
    permissions: [
      permission(PERMISSIONS.PRICE_VIEW, "Xem"),
      permission(PERMISSIONS.PRICE_CREATE, "Thêm"),
      permission(PERMISSIONS.PRICE_UPDATE, "Sửa"),
      permission(PERMISSIONS.PRICE_DELETE, "Xóa"),
    ],
  },
  {
    key: "config",
    label: "Cấu hình",
    permissions: [
      permission(PERMISSIONS.CONFIG_CATEGORY_VIEW, "Xem danh mục"),
      permission(PERMISSIONS.CONFIG_CATEGORY_UPDATE, "Sửa danh mục"),
      permission(PERMISSIONS.CONFIG_MAIL_VIEW, "Xem mail"),
      permission(PERMISSIONS.CONFIG_MAIL_UPDATE, "Sửa mail"),
      permission(PERMISSIONS.CONFIG_SETTING_VIEW, "Xem tham số"),
      permission(PERMISSIONS.CONFIG_SETTING_UPDATE, "Sửa tham số"),
    ],
  },
  {
    key: "template",
    label: "Biểu mẫu email",
    permissions: [
      permission(PERMISSIONS.TEMPLATE_VIEW, "Xem"),
      permission(PERMISSIONS.TEMPLATE_CREATE, "Thêm"),
      permission(PERMISSIONS.TEMPLATE_UPDATE, "Sửa"),
      permission(PERMISSIONS.TEMPLATE_DELETE, "Xóa"),
      permission(PERMISSIONS.TEMPLATE_SET_DEFAULT, "Đặt mặc định"),
    ],
  },
  {
    key: "permission",
    label: "Phân quyền",
    permissions: [
      permission(PERMISSIONS.PERMISSION_USER_VIEW, "Xem tài khoản"),
      permission(PERMISSIONS.PERMISSION_USER_CREATE, "Thêm tài khoản"),
      permission(PERMISSIONS.PERMISSION_USER_UPDATE, "Sửa tài khoản"),
      permission(PERMISSIONS.PERMISSION_USER_DELETE, "Xóa tài khoản"),
      permission(PERMISSIONS.PERMISSION_ROLE_VIEW, "Xem vai trò"),
      permission(PERMISSIONS.PERMISSION_ROLE_UPDATE, "Sửa vai trò"),
    ],
  },
];

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((group) => group.permissions.map((item) => item.key));
export const ALL_PERMISSIONS = ALL_PERMISSION_KEYS;

export const WEBSITE_TEMPLATE_PERMISSION_KEYS = [
  PERMISSIONS.WEBSITE_TEMPLATE_VIEW,
  PERMISSIONS.WEBSITE_TEMPLATE_CREATE,
  PERMISSIONS.WEBSITE_TEMPLATE_UPDATE,
  PERMISSIONS.WEBSITE_TEMPLATE_DELETE,
];

const unique = (items = []) => Array.from(new Set(items));
const baseViewPermissions = ALL_PERMISSION_KEYS.filter((permissionKey) => permissionKey.endsWith(".view"));

export const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: ALL_PERMISSION_KEYS,
  admin: ALL_PERMISSION_KEYS.filter((permissionKey) => permissionKey !== PERMISSIONS.PERMISSION_ROLE_UPDATE),
  manager: unique([
    ...baseViewPermissions,
    PERMISSIONS.PROGRAM_CREATE,
    PERMISSIONS.PROGRAM_UPDATE,
    PERMISSIONS.PROGRAM_UPDATE_STATUS,
    PERMISSIONS.CORRECTION_CREATE,
    PERMISSIONS.CORRECTION_UPDATE,
    PERMISSIONS.CORRECTION_UPDATE_STATUS,
    PERMISSIONS.UPGRADE_CREATE,
    PERMISSIONS.UPGRADE_UPDATE,
    PERMISSIONS.UPGRADE_UPDATE_STATUS,
    PERMISSIONS.DESIGN_CREATE,
    PERMISSIONS.DESIGN_UPDATE,
    PERMISSIONS.DESIGN_UPDATE_STATUS,
    PERMISSIONS.SOURCE_CREATE,
    PERMISSIONS.SOURCE_UPDATE,
    PERMISSIONS.SOURCE_SEND_MAIL,
    PERMISSIONS.SOURCE_UPDATE_STATUS,
    PERMISSIONS.WEBSITE_TEMPLATE_CREATE,
    PERMISSIONS.WEBSITE_TEMPLATE_UPDATE,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.CONTRACT_UPDATE,
    PERMISSIONS.CONTRACT_SEND_MAIL,
    PERMISSIONS.TEMPLATE_CREATE,
    PERMISSIONS.TEMPLATE_UPDATE,
    PERMISSIONS.TEMPLATE_SET_DEFAULT,
  ]),
  developer: [
    PERMISSIONS.PROGRAM_VIEW,
    PERMISSIONS.PROGRAM_UPDATE,
    PERMISSIONS.PROGRAM_UPDATE_STATUS,
    PERMISSIONS.CORRECTION_VIEW,
    PERMISSIONS.CORRECTION_UPDATE,
    PERMISSIONS.CORRECTION_UPDATE_STATUS,
    PERMISSIONS.UPGRADE_VIEW,
    PERMISSIONS.UPGRADE_UPDATE,
    PERMISSIONS.UPGRADE_UPDATE_STATUS,
    PERMISSIONS.SOURCE_VIEW,
    PERMISSIONS.WEBSITE_TEMPLATE_VIEW,
  ],
  designer: [PERMISSIONS.DESIGN_VIEW, PERMISSIONS.DESIGN_UPDATE, PERMISSIONS.DESIGN_UPDATE_STATUS, PERMISSIONS.DESIGN_UPDATE_POINT],
  sale: [
    PERMISSIONS.CONTRACT_VIEW,
    PERMISSIONS.CONTRACT_CREATE,
    PERMISSIONS.CONTRACT_UPDATE,
    PERMISSIONS.CONTRACT_SEND_MAIL,
    PERMISSIONS.SOURCE_VIEW,
    PERMISSIONS.SOURCE_SEND_MAIL,
    PERMISSIONS.TEMPLATE_VIEW,
    PERMISSIONS.WEBSITE_TEMPLATE_VIEW,
  ],
  viewer: baseViewPermissions,
  user: [
    PERMISSIONS.PROGRAM_VIEW,
    PERMISSIONS.DESIGN_VIEW,
    PERMISSIONS.SOURCE_VIEW,
    PERMISSIONS.CONTRACT_VIEW,
    PERMISSIONS.WEBSITE_TEMPLATE_VIEW,
  ],
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role || "Người dùng";

export const getRoleOptions = (roles = []) => roles.map((role) => ({ value: role, label: getRoleLabel(role) }));
