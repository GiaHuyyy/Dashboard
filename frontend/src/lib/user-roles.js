export const USER_ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Quản lý" },
  { value: "developer", label: "Lập trình viên" },
  { value: "designer", label: "Thiết kế" },
  { value: "sale", label: "Kinh doanh" },
  { value: "viewer", label: "Chỉ xem" },
  { value: "user", label: "Người dùng" },
];

export const getUserRoleLabel = (value) => USER_ROLE_OPTIONS.find((item) => item.value === value)?.label || value || "-";
