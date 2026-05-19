export const STAFF_ROLE_OPTIONS = ["Lập trình viên", "Thiết kế", "Nhân viên kinh doanh", "Quản lý"];

export const STAFF_DEPARTMENT_BY_ROLE = {
  "Lập trình viên": "Lập trình",
  "Thiết kế": "Design",
  "Nhân viên kinh doanh": "Kinh doanh",
  "Quản lý": "Quản lý",
};

export const getDepartmentByRole = (role) => STAFF_DEPARTMENT_BY_ROLE[role] || "Khác";

export const getStaffNamesByRole = (staffs = [], role) =>
  staffs
    .filter((item) => item?.role === role)
    .map((item) => item?.fullName)
    .filter(Boolean);

export const toSelectOptions = (items = []) => items.map((item) => ({ label: item, value: item }));
