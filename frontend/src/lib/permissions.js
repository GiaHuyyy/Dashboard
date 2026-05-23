export const hasPermission = (user, permission) => {
  if (!permission) return true;
  const roles = Array.isArray(user?.roles) ? user.roles : [user?.role].filter(Boolean);
  if (roles.includes("super_admin")) return true;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.includes(permission);
};

export const hasAnyPermission = (user, permissions = []) => {
  const normalizedPermissions = Array.isArray(permissions) ? permissions.filter(Boolean) : [permissions].filter(Boolean);
  if (normalizedPermissions.length === 0) return true;
  return normalizedPermissions.some((permission) => hasPermission(user, permission));
};

export const getDisabledPermissionProps = (user, permission, message = "Bạn không có quyền thực hiện thao tác này") => {
  const allowed = hasPermission(user, permission);

  return {
    disabled: !allowed,
    title: allowed ? undefined : message,
    "aria-disabled": !allowed,
  };
};
