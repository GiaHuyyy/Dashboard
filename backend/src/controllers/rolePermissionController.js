import {
  getPermissionDefinitions,
  listRolePermissions,
  updateRolePermissions,
} from "../services/rolePermissionService.js";

const toResponseItem = (doc) => ({
  id: doc._id,
  role: doc.role,
  name: doc.name,
  permissions: Array.isArray(doc.permissions) ? doc.permissions : [],
  isSystem: Boolean(doc.isSystem),
  note: doc.note || "",
});

export const getRolePermissions = async (req, res) => {
  const rows = await listRolePermissions(req.user?.sub);

  return res.json({
    ...getPermissionDefinitions(),
    rolePermissions: rows.map(toResponseItem),
  });
};

export const updateRolePermission = async (req, res) => {
  try {
    const rows = await updateRolePermissions({
      role: req.params.role,
      permissions: req.body?.permissions || [],
      userId: req.user?.sub,
    });

    return res.json({
      message: "Đã lưu quyền vai trò",
      ...getPermissionDefinitions(),
      rolePermissions: rows.map(toResponseItem),
    });
  } catch (error) {
    return res.status(error?.status || 500).json({
      message: error?.message || "Không thể lưu quyền vai trò",
    });
  }
};
