import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagementList } from "@/hooks/useManagementList";
import { userApi } from "@/lib/api-client";
import { PERMISSION_DENIED_MESSAGE, usePermission } from "@/lib/permissions";
import { USER_ROLE_OPTIONS, getUserRoleLabel } from "@/lib/user-roles";

function UserManagement() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedActive, setSelectedActive] = useState("all");
  const { canAny } = usePermission();

  const canView = canAny(["permission.user.view", "user.view"]);
  const canCreate = canAny(["permission.user.create", "user.create"]);
  const canUpdate = canAny(["permission.user.update", "user.update"]);
  const canDelete = canAny(["permission.user.delete", "user.delete"]);
  const getUserListParams = useCallback(
    (value) => ({
      search: value.trim(),
      role: selectedRole,
      active: selectedActive,
    }),
    [selectedActive, selectedRole],
  );

  const {
    rows,
    searchText,
    setSearchText,
    isLoading,
    deleteOpen,
    setDeleteOpen,
    deleteRow,
    setDeleteRow,
    handleDelete,
  } = useManagementList({
    listApi: userApi.list,
    removeApi: userApi.remove,
    removeManyApi: userApi.removeMany,
    responseKey: "users",
    getListParams: getUserListParams,
    loadErrorMessage: "Không thể tải danh sách tài khoản",
    noDeletePermissionMessage: PERMISSION_DENIED_MESSAGE,
    deleteOneSuccessMessage: "Đã xóa tài khoản",
    deleteErrorMessage: "Xóa tài khoản không thành công",
  });

  const activeCount = useMemo(() => rows.filter((item) => item.isActive).length, [rows]);

  const openDetail = (row) => {
    if (!canView) {
      toast.error(PERMISSION_DENIED_MESSAGE);
      return;
    }

    navigate(`/phan-quyen/tai-khoan/chinh-sua/${row.id}`);
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/phan-quyen/tai-khoan/them-moi")}
        onDeleteAll={() => null}
        addDisabled={!canCreate}
        addTitle={!canCreate ? PERMISSION_DENIED_MESSAGE : undefined}
        deleteDisabled
        deleteLabel={`Đang hoạt động: ${activeCount}`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={selectedRole}
          onChange={(event) => setSelectedRole(event.target.value)}
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          <option value="all">Tất cả vai trò</option>
          {USER_ROLE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        <select
          value={selectedActive}
          onChange={(event) => setSelectedActive(event.target.value)}
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>

      <ManagementTableCard
        title="Danh sách tài khoản"
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm tên, tài khoản"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Họ tên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tài khoản
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Vai trò
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ghi chú
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openDetail(row)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.name}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.userName}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{getUserRoleLabel(row.role)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        row.isActive
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-rose-200 bg-rose-50 text-rose-700"
                      }`}
                    >
                      {row.isActive ? "Đang hoạt động" : "Đã khóa"}
                    </span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.note || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetail(row);
                        }}
                        variant="primary-outline"
                        iconOnly
                        title={canUpdate ? "Sửa tài khoản" : canView ? "Xem chi tiết (chỉ xem)" : PERMISSION_DENIED_MESSAGE}
                        className="text-sky-500"
                      />
                      <Button
                        icon={Trash2}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteRow(row);
                          setDeleteOpen(true);
                        }}
                        variant="danger-outline"
                        iconOnly
                        className="text-rose-700"
                        disabled={!canDelete || row.role === "super_admin"}
                        title={!canDelete ? PERMISSION_DENIED_MESSAGE : row.role === "super_admin" ? "Không thể xóa Super Admin" : "Xóa"}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ManagementTableCard>

      <Modal
        open={deleteOpen}
        onClose={() => {
          setDeleteOpen(false);
          setDeleteRow(null);
        }}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleDelete({ canDelete: canDelete })}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa tài khoản
          <span className="font-semibold text-slate-800"> {deleteRow?.userName}</span>?
        </p>
      </Modal>
    </>
  );
}

export default UserManagement;