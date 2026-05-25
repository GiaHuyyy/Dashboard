import { getPermissionsForRoles } from "../services/rolePermissionService.js";

const normalizePermissions = (permissions = []) =>
  Array.isArray(permissions) ? permissions.filter(Boolean) : [permissions].filter(Boolean);

const getRequestRoles = (user = {}) => {
  const roles = Array.isArray(user.roles) && user.roles.length > 0 ? user.roles : user.role ? [user.role] : [];
  return roles;
};

export const requireAnyPermission = (...permissions) => {
  const requiredPermissions = normalizePermissions(permissions.flat());

  return async (req, res, next) => {
    try {
      if (requiredPermissions.length === 0) return next();

      const roles = getRequestRoles(req.user);
      const userPermissions = await getPermissionsForRoles(roles);
      const isAllowed = requiredPermissions.some((permission) => userPermissions.includes(permission));

      if (!isAllowed) {
        return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
      }

      req.userPermissions = userPermissions;
      return next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      return res.status(500).json({ message: "Không thể kiểm tra quyền truy cập" });
    }
  };
};

const requirePermission = (permission) => requireAnyPermission(permission);

export default requirePermission;
