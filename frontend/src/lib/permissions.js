import { useSelector } from "react-redux";

export const PERMISSION_DENIED_MESSAGE = "Bạn không có quyền thực hiện thao tác này";

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

export const getDisabledPermissionProps = (user, permission, message = PERMISSION_DENIED_MESSAGE) => {
  const allowed = hasPermission(user, permission);

  return {
    disabled: !allowed,
    title: allowed ? undefined : message,
    "aria-disabled": !allowed,
  };
};

export const usePermission = () => {
  const { user } = useSelector((state) => state.auth);

  const can = (permission) => hasPermission(user, permission);
  const canAny = (permissions) => hasAnyPermission(user, permissions);
  const disabledProps = (permission, message = PERMISSION_DENIED_MESSAGE) =>
    getDisabledPermissionProps(user, permission, message);

  return {
    user,
    can,
    canAny,
    disabledProps,
  };
};
