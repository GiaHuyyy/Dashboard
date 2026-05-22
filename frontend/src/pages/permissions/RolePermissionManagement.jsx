import { RotateCcw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button-v2";
import { rolePermissionApi } from "@/lib/api-client";

const SUPER_ADMIN_ROLE = "super_admin";

const normalizeRolePermissions = (rows = []) =>
  rows.reduce((result, row) => {
    result[row.role] = Array.isArray(row.permissions) ? row.permissions : [];
    return result;
  }, {});

function RolePermissionManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState([]);
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState("admin");

  const selectedRoleLabel = useMemo(
    () => roleOptions.find((item) => item.value === selectedRole)?.label || selectedRole,
    [roleOptions, selectedRole],
  );

  const selectedPermissions = useMemo(() => rolePermissions[selectedRole] || [], [rolePermissions, selectedRole]);
  const isSuperAdminSelected = selectedRole === SUPER_ADMIN_ROLE;

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await rolePermissionApi.list();
      const nextRoleOptions = Array.isArray(response?.roleOptions) ? response.roleOptions : [];
      const nextRows = Array.isArray(response?.rolePermissions) ? response.rolePermissions : [];

      setRoleOptions(nextRoleOptions);
      setPermissionGroups(Array.isArray(response?.groups) ? response.groups : []);
      setRolePermissions(normalizeRolePermissions(nextRows));

      if (!nextRoleOptions.some((item) => item.value === selectedRole)) {
        setSelectedRole(nextRoleOptions.find((item) => item.value !== SUPER_ADMIN_ROLE)?.value || nextRoleOptions[0]?.value || "admin");
      }
    } catch (error) {
      toast.error(error?.message || "Không thể tải cấu hình phân quyền");
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const hasPermission = (permissionKey) => selectedPermissions.includes(permissionKey);

  const updateSelectedPermissions = (nextPermissions) => {
    if (isSuperAdminSelected) return;

    setRolePermissions((prev) => ({
      ...prev,
      [selectedRole]: Array.from(new Set(nextPermissions)),
    }));
  };

  const handleTogglePermission = (permissionKey, checked) => {
    if (checked) {
      updateSelectedPermissions([...selectedPermissions, permissionKey]);
      return;
    }

    updateSelectedPermissions(selectedPermissions.filter((item) => item !== permissionKey));
  };

  const handleToggleGroup = (group, checked) => {
    const groupKeys = group.permissions.map((item) => item.key);

    if (checked) {
      updateSelectedPermissions([...selectedPermissions, ...groupKeys]);
      return;
    }

    updateSelectedPermissions(selectedPermissions.filter((item) => !groupKeys.includes(item)));
  };

  const handleSave = async () => {
    if (isSuperAdminSelected) {
      toast.error("Không thể chỉnh sửa quyền của Super Admin");
      return;
    }

    setIsSaving(true);
    try {
      const response = await rolePermissionApi.update(selectedRole, selectedPermissions);
      setRolePermissions(normalizeRolePermissions(response?.rolePermissions || []));
      toast.success(response?.message || "Đã lưu quyền vai trò");
    } catch (error) {
      toast.error(error?.message || "Không thể lưu quyền vai trò");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
        Đang tải cấu hình phân quyền...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-700">Vai trò & quyền</p>
            <p className="mt-1 text-sm text-slate-500">
              Thiết lập quyền theo vai trò. Người dùng có nhiều vai trò sẽ được cộng gộp quyền từ tất cả vai trò.
            </p>
          </div>
          <div className="rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
            Phân quyền nội bộ
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <h2 className="text-base font-semibold text-gray-500">Danh sách vai trò</h2>
          </div>
          <div className="border-x border-b border-slate-200 p-3">
            <div className="space-y-2">
              {roleOptions.map((role) => {
                const active = selectedRole === role.value;
                const count = rolePermissions[role.value]?.length || 0;

                return (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      active
                        ? "border-sky-200 bg-sky-50 text-sky-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="font-semibold">{role.label}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-tl-2xl rounded-tr-2xl bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-t-3 border-slate-200 border-t-sky-500 px-4 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-500">Quyền của {selectedRoleLabel}</h2>
              <p className="mt-1 text-xs text-slate-500">
                {isSuperAdminSelected
                  ? "Super Admin luôn có toàn quyền và không thể chỉnh sửa tại đây."
                  : "Tick các quyền được phép sử dụng cho vai trò này."}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                icon={RotateCcw}
                variant="secondary"
                label="Tải lại"
                onClick={() => void fetchRows()}
                disabled={isSaving}
              />
              <Button
                icon={Save}
                variant="primary"
                label={isSaving ? "Đang lưu..." : "Lưu quyền"}
                onClick={handleSave}
                disabled={isSaving || isSuperAdminSelected}
              />
            </div>
          </div>

          <div className="border-x border-b border-slate-200 p-4">
            <div className="grid gap-4 xl:grid-cols-2">
              {permissionGroups.map((group) => {
                const groupKeys = group.permissions.map((item) => item.key);
                const allChecked = groupKeys.length > 0 && groupKeys.every((key) => hasPermission(key));
                const someChecked = groupKeys.some((key) => hasPermission(key));

                return (
                  <div key={group.key} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          ref={(node) => {
                            if (node) node.indeterminate = !allChecked && someChecked;
                          }}
                          onChange={(event) => handleToggleGroup(group, event.target.checked)}
                          disabled={isSuperAdminSelected}
                          className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed"
                        />
                        {group.label}
                      </label>
                      <span className="text-xs text-slate-400">
                        {groupKeys.filter((key) => hasPermission(key)).length}/{groupKeys.length}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      {group.permissions.map((permission) => (
                        <label
                          key={permission.key}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                            hasPermission(permission.key)
                              ? "border-sky-100 bg-sky-50 text-sky-700"
                              : "border-slate-100 bg-slate-50 text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission(permission.key)}
                            onChange={(event) => handleTogglePermission(permission.key, event.target.checked)}
                            disabled={isSuperAdminSelected}
                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 disabled:cursor-not-allowed"
                          />
                          <span>{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RolePermissionManagement;
