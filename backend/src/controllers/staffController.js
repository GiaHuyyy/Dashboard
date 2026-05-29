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
const ROLE_DEPARTMENT_MAP = {
  "Lập trình viên": "Lập trình",
  "Nhân viên kinh doanh": "Kinh doanh",
  "Quản lý": "Quản lý",
  "Thiết kế": "Design",
};

const normalizePayload = (body = {}) => ({
  fullName: normalizeString(body.fullName),
  email: normalizeString(body.email).toLowerCase(),
  phone: normalizeString(body.phone),
  role: normalizeString(body.role) || "Lập trình viên",
  department: normalizeString(body.department),
  isActive: normalizeBoolean(body.isActive),
});

const validatePayload = async (payload, { excludeId = "" } = {}) => {
  if (!payload.fullName) return { status: 400, message: "fullName là bắt buộc" };
  if (!payload.email) return { status: 400, message: "email là bắt buộc" };
  if (!payload.department) return { status: 400, message: "department là bắt buộc" };
  if (!EMAIL_REGEX.test(payload.email)) return { status: 400, message: "email không đúng định dạng" };
  if (payload.isActive === null) return { status: 400, message: "isActive phải là kiểu boolean" };

  const duplicate = await Staff.findOne({ email: payload.email, isDeleted: false }).select("_id").lean();
  if (duplicate && String(duplicate._id) !== excludeId) {
    return { status: 409, message: "Email nhân sự đã tồn tại" };
  }
  return null;
};

const toResponseItem = (doc) => ({
  id: doc._id,
  fullName: doc.fullName,
  email: doc.email,
  phone: doc.phone || "",
  department: doc.department || "",
  role: doc.role || "",
  isActive: Boolean(doc.isActive),
  createdAt: doc.createdAt,
});

const resolveDepartment = ({ role, fallbackDepartment = "" } = {}) =>
  ROLE_DEPARTMENT_MAP[role] || fallbackDepartment || "Khác";

export const createStaff = async (req, res) => {
  const payload = normalizePayload(req.body);
  payload.department = payload.department || resolveDepartment({ role: payload.role });

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
    .select("fullName role department")
    .lean();

  return sendOk(res, {
    staffs: staffs.map((item) => ({
      id: item._id,
      fullName: item.fullName,
      role: item.role || "",
      department: item.department || "",
    })),
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
  const merged = {
    fullName: input.fullName || existing.fullName,
    email: input.email || existing.email,
    phone: typeof req.body.phone === "string" ? input.phone : existing.phone,
    role: input.role || existing.role,
    department: input.department || existing.department || resolveDepartment({ role: input.role || existing.role }),
    isActive: input.isActive === null ? existing.isActive : input.isActive,
  };

  const validation = await validatePayload(merged, { excludeId: String(existing._id) });
  if (validation) return sendValidationError(res, validation);

  existing.fullName = merged.fullName;
  existing.email = merged.email;
  existing.phone = merged.phone;
  existing.department = merged.department;
  existing.role = merged.role;
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
