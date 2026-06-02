import Staff from "../models/Staff.js";
import { normalizeBoolean, normalizeObjectId, normalizeString, parsePositiveInteger } from "../utils/normalize.js";
import {
  sendBadRequest,
  sendCreated,
  sendNotFound,
  sendOk,
  sendValidationError,
} from "../utils/httpResponse.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STAFF_ROLE_OPTIONS = ["Lập trình viên", "Thiết kế", "Nhân viên kinh doanh", "Quản lý"];
const STAFF_DEPARTMENT_OPTIONS = ["Lập trình", "Design", "Kinh doanh", "Quản lý", "Khác"];
const ROLE_DEPARTMENT_MAP = {
  "Lập trình viên": "Lập trình",
  "Nhân viên kinh doanh": "Kinh doanh",
  "Quản lý": "Quản lý",
  "Thiết kế": "Design",
};

const normalizeStringArray = (value) => {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(items.map((item) => normalizeString(item)).filter(Boolean))];
};

const normalizePayload = (body = {}) => {
  const roles = normalizeStringArray(body.roles).length > 0
    ? normalizeStringArray(body.roles)
    : normalizeStringArray(body.role || "Lập trình viên");
  const departments = normalizeStringArray(body.departments).length > 0
    ? normalizeStringArray(body.departments)
    : normalizeStringArray(body.department);

  return {
    fullName: normalizeString(body.fullName),
    email: normalizeString(body.email).toLowerCase(),
    phone: normalizeString(body.phone),
    roles,
    departments,
    role: roles[0] || normalizeString(body.role) || "Lập trình viên",
    department: departments[0] || normalizeString(body.department),
    isActive: normalizeBoolean(body.isActive),
  };
};

const getLegacyRoles = (doc = {}) => {
  const roles = Array.isArray(doc.roles) ? doc.roles.map((item) => normalizeString(item)).filter(Boolean) : [];
  const role = normalizeString(doc.role);
  return roles.length > 0 ? roles : role ? [role] : [];
};

const getLegacyDepartments = (doc = {}) => {
  const departments = Array.isArray(doc.departments)
    ? doc.departments.map((item) => normalizeString(item)).filter(Boolean)
    : [];
  const department = normalizeString(doc.department);
  return departments.length > 0 ? departments : department ? [department] : [];
};

const validatePayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.fullName) return { status: 400, message: "fullName là bắt buộc" };
  if (!payload.email) return { status: 400, message: "email là bắt buộc" };
  if (!EMAIL_REGEX.test(payload.email)) return { status: 400, message: "email không đúng định dạng" };
  if (!Array.isArray(payload.departments) || payload.departments.length === 0) {
    return { status: 400, message: "departments là bắt buộc" };
  }
  if (!Array.isArray(payload.roles) || payload.roles.length === 0) {
    return { status: 400, message: "roles là bắt buộc" };
  }
  const invalidDepartments = payload.departments.filter((item) => !STAFF_DEPARTMENT_OPTIONS.includes(item));
  if (invalidDepartments.length > 0) {
    return { status: 400, message: `departments không hợp lệ: ${invalidDepartments.join(", ")}` };
  }
  const invalidRoles = payload.roles.filter((item) => !STAFF_ROLE_OPTIONS.includes(item));
  if (invalidRoles.length > 0) {
    return { status: 400, message: `roles không hợp lệ: ${invalidRoles.join(", ")}` };
  }
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const duplicate = await Staff.findOne({ email: payload.email, isDeleted: false }).select("_id").lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Email nhân sự đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => {
  const roles = getLegacyRoles(doc);
  const departments = getLegacyDepartments(doc);

  return {
    id: doc._id,
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone || "",
    departments,
    roles,
    department: departments[0] || "",
    role: roles[0] || "",
    isActive: Boolean(doc.isActive),
    createdAt: doc.createdAt,
  };
};

const resolveDepartments = ({ roles = [], fallbackDepartments = [] } = {}) => {
  const resolved = roles.map((role) => ROLE_DEPARTMENT_MAP[role]).filter(Boolean);
  const departments = fallbackDepartments.length > 0 ? fallbackDepartments : resolved;
  return departments.length > 0 ? [...new Set(departments)] : ["Khác"];
};

export const createStaff = async (req, res) => {
  const payload = normalizePayload(req.body);
  payload.departments = resolveDepartments({ roles: payload.roles, fallbackDepartments: payload.departments });
  payload.department = payload.departments[0] || "Khác";
  payload.role = payload.roles[0] || "Lập trình viên";

  const validation = await validatePayload(payload);
  if (validation) return sendValidationError(res, validation);

  const created = await Staff.create({
    ...payload,
    createdBy: req.user.sub,
  });
  return sendCreated(res, { message: "Tạo nhân sự thành công", staff: toResponseItem(created) });
};

export const listStaffs = async (req, res) => {
  const keyword = normalizeString(req.query.search).toLowerCase();
  const page = parsePositiveInteger(req.query.page) || 1;
  const limit = parsePositiveInteger(req.query.limit) || 10;
  const filters = { isDeleted: false };
  const active = normalizeString(req.query.active);
  if (active === "true") filters.isActive = true;
  if (active === "false") filters.isActive = false;

  if (keyword) {
    filters.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
      { role: { $regex: keyword, $options: "i" } },
      { roles: { $regex: keyword, $options: "i" } },
      { department: { $regex: keyword, $options: "i" } },
      { departments: { $regex: keyword, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const [staffs, total] = await Promise.all([
    Staff.find(filters).sort({ createdAt: 1 }).skip(skip).limit(limit).lean(),
    Staff.countDocuments(filters),
  ]);

  return sendOk(res, {
    page,
    limit,
    total,
    staffs: staffs.map(toResponseItem),
  });
};

export const listStaffReferences = async (req, res) => {
  const staffs = await Staff.find({ isDeleted: false, isActive: true })
    .sort({ fullName: 1 })
    .select("fullName role roles department departments")
    .lean();

  return sendOk(res, {
    staffs: staffs.map((item) => {
      const roles = getLegacyRoles(item);
      const departments = getLegacyDepartments(item);
      return {
        id: item._id,
        fullName: item.fullName,
        roles,
        departments,
        role: roles[0] || "",
        department: departments[0] || "",
      };
    }),
  });
};

export const getStaffById = async (req, res) => {
  const staffId = normalizeObjectId(req.params.id);
  if (!staffId) return sendBadRequest(res, "id không hợp lệ");

  const staff = await Staff.findById(staffId).lean();
  if (!staff || staff.isDeleted) return sendNotFound(res, "Không tìm thấy nhân sự");

  return sendOk(res, { staff: toResponseItem(staff) });
};

export const updateStaff = async (req, res) => {
  const staffId = normalizeObjectId(req.params.id);
  if (!staffId) return sendBadRequest(res, "id không hợp lệ");

  const existing = await Staff.findById(staffId);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy nhân sự");

  const input = normalizePayload(req.body);
  const existingRoles = getLegacyRoles(existing);
  const existingDepartments = getLegacyDepartments(existing);
  const hasRoles = Array.isArray(req.body.roles) || typeof req.body.role === "string";
  const hasDepartments = Array.isArray(req.body.departments) || typeof req.body.department === "string";

  const merged = {
    fullName: input.fullName || existing.fullName,
    email: input.email || existing.email,
    phone: typeof req.body.phone === "string" ? input.phone : existing.phone,
    roles: hasRoles ? input.roles : existingRoles,
    departments: hasDepartments ? input.departments : existingDepartments,
    isActive: input.isActive === null ? existing.isActive : input.isActive,
  };

  merged.departments = resolveDepartments({ roles: merged.roles, fallbackDepartments: merged.departments });
  merged.role = merged.roles[0] || existing.role || "Lập trình viên";
  merged.department = merged.departments[0] || existing.department || resolveDepartments({ roles: merged.roles })[0];

  const validation = await validatePayload(merged, { excludeId: String(existing._id) });
  if (validation) return sendValidationError(res, validation);

  existing.fullName = merged.fullName;
  existing.email = merged.email;
  existing.phone = merged.phone;
  existing.roles = merged.roles;
  existing.departments = merged.departments;
  existing.role = merged.role;
  existing.department = merged.department;
  existing.isActive = merged.isActive;
  await existing.save();

  return sendOk(res, { message: "Cập nhật nhân sự thành công", staff: toResponseItem(existing) });
};

export const deleteStaff = async (req, res) => {
  const staffId = normalizeObjectId(req.params.id);
  if (!staffId) return sendBadRequest(res, "id không hợp lệ");

  const existing = await Staff.findById(staffId);
  if (!existing || existing.isDeleted) return sendNotFound(res, "Không tìm thấy nhân sự");

  existing.isDeleted = true;
  await existing.save();

  return sendOk(res, { message: "Đã xóa nhân sự" });
};
