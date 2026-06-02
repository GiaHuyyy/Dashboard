export const STAFF_ROLE_OPTIONS = ["Lập trình viên", "Thiết kế", "Nhân viên kinh doanh", "Quản lý"];

export const STAFF_DEPARTMENT_OPTIONS = ["Lập trình", "Design", "Kinh doanh", "Quản lý", "Khác"];

export const STAFF_DEPARTMENT_BY_ROLE = {
  "Lập trình viên": "Lập trình",
  "Thiết kế": "Design",
  "Nhân viên kinh doanh": "Kinh doanh",
  "Quản lý": "Quản lý",
};

export const getDepartmentByRole = (role) => STAFF_DEPARTMENT_BY_ROLE[role] || "Khác";

export const getStaffRoles = (staff = {}) => {
  const roles = Array.isArray(staff.roles) ? staff.roles.filter(Boolean) : [];
  return roles.length > 0 ? roles : staff.role ? [staff.role] : [];
};

export const getStaffDepartments = (staff = {}) => {
  const departments = Array.isArray(staff.departments) ? staff.departments.filter(Boolean) : [];
  return departments.length > 0 ? departments : staff.department ? [staff.department] : [];
};

export const getStaffNamesByRole = (staffs = [], role) =>
  staffs
    .filter((item) => getStaffRoles(item).includes(role))
    .map((item) => item?.fullName)
    .filter(Boolean);

export const getStaffNamesByDepartment = (staffs = [], department) =>
  staffs
    .filter((item) => getStaffDepartments(item).includes(department))
    .map((item) => item?.fullName)
    .filter(Boolean);

export const toSelectOptions = (items = []) => items.map((item) => ({ label: item, value: item }));
