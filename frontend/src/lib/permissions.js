import { useMemo } from "react";
import { useSelector } from "react-redux";

export const hasPermission = (user, permission) => {
  if (!permission) return true;
  const permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  return permissions.includes("*") || permissions.includes(permission);
};

export const hasAnyPermission = (user, permissionList = []) => {
  if (!Array.isArray(permissionList) || permissionList.length === 0) return true;
  return permissionList.some((permission) => hasPermission(user, permission));
};

export const getDisabledPermissionProps = (user, permission, message = "Bạn không có quyền thực hiện chức năng này") => {
  const allowed = hasPermission(user, permission);
  return {
    disabled: !allowed,
    title: allowed ? "" : message,
  };
};

export const usePermission = () => {
  const user = useSelector((state) => state.auth.user);

  return useMemo(
    () => ({
      user,
      can: (permission) => hasPermission(user, permission),
      canAny: (permissionList = []) => hasAnyPermission(user, permissionList),
      getDisabledProps: (permission, message) => getDisabledPermissionProps(user, permission, message),
    }),
    [user],
  );
};
