export const STAFF_DEPARTMENT_OPTIONS = ["Lập trình", "Design", "Kinh doanh", "Quản lý"];

export const STAFF_ROLE_OPTIONS = [
  "Quản lý",
  "Lập trình viên",
  "Thiết kế",
  "Thiết kế viên",
  "Nhân viên kinh doanh",
];

export const STAFF_ROLE_DEPARTMENT_MAP = {
  "Quản lý": "Quản lý",
  "Lập trình viên": "Lập trình",
  "Thiết kế": "Design",
  "Thiết kế viên": "Design",
  "Nhân viên kinh doanh": "Kinh doanh",
};

export const getDepartmentByRole = (role) => STAFF_ROLE_DEPARTMENT_MAP[String(role || "").trim()] || "Lập trình";

const ROLE_ALIASES = {
  "Thiết kế": ["Thiết kế", "Thiết kế viên"],
  "Thiết kế viên": ["Thiết kế", "Thiết kế viên"],
};

const normalizeText = (value) => String(value || "").trim();

const uniqueValues = (items = []) => [...new Set(items.map(normalizeText).filter(Boolean))];

const expandRoleAliases = (role) => {
  const normalized = normalizeText(role);
  if (!normalized) return [];
  return ROLE_ALIASES[normalized] || [normalized];
};

export const getStaffRoles = (staff = {}) => {
  const roles = Array.isArray(staff.roles) ? staff.roles.filter(Boolean) : [];
  return uniqueValues(roles.length > 0 ? roles : staff.role ? [staff.role] : []);
};

export const getStaffDepartments = (staff = {}) => {
  const departments = Array.isArray(staff.departments) ? staff.departments.filter(Boolean) : [];
  return uniqueValues(departments.length > 0 ? departments : staff.department ? [staff.department] : []);
};

export const getStaffNamesByRole = (staffs = [], role) => {
  const targetRoles = uniqueValues(Array.isArray(role) ? role : [role]).flatMap(expandRoleAliases);
  const targetRoleSet = new Set(targetRoles);
  if (targetRoleSet.size === 0) return [];

  return uniqueValues(
    staffs
      .filter((item) => getStaffRoles(item).some((staffRole) => targetRoleSet.has(staffRole)))
      .map((item) => item?.fullName),
  );
};

export const getStaffNamesByDepartment = (staffs = [], department) => {
  const targetDepartments = new Set(uniqueValues(Array.isArray(department) ? department : [department]));
  if (targetDepartments.size === 0) return [];

  return uniqueValues(
    staffs
      .filter((item) => getStaffDepartments(item).some((staffDepartment) => targetDepartments.has(staffDepartment)))
      .map((item) => item?.fullName),
  );
};

export const toSelectOptions = (items = []) => uniqueValues(items).map((item) => ({ label: item, value: item }));

export const ensureSelectOption = (options = [], value) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return options;
  return options.some((item) => item?.value === normalizedValue)
    ? options
    : [{ label: normalizedValue, value: normalizedValue }, ...options];
};
