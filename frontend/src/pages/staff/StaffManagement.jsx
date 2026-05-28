import { SquarePen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { useManagementList } from "@/hooks/useManagementList";
import { staffApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

function StaffManagement() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.STAFF_CREATE);
  const canUpdate = can(PERMISSIONS.STAFF_UPDATE);
  const canDelete = can(PERMISSIONS.STAFF_DELETE);

  const {
    rows,
    total,
    page,
    limit,
    setPage,
    setLimit,
    rowNumberOffset,
    searchText,
    setSearchText,
    isLoading,
    deleteOpen,
    setDeleteOpen,
    deleteRow,
    setDeleteRow,
    handleDelete,
  } = useManagementList({
    listApi: staffApi.list,
    removeApi: staffApi.remove,
    removeManyApi: staffApi.removeMany,
    responseKey: "staffs",
    enablePagination: true,
    loadErrorMessage: "Không thể tải danh sách nhân sự",
    noDeletePermissionMessage: "Bạn không có quyền xóa nhân sự",
    deleteOneSuccessMessage: "Đã xóa nhân sự",
    deleteErrorMessage: "Xóa dữ liệu không thành công",
  });

  const totalLabel = `Tổng: ${total}`;

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/nhan-su/them-moi")}
        onDeleteAll={() => null}
        addDisabled={!canCreate}
        addTitle={!canCreate ? "Bạn không có quyền thêm nhân sự" : undefined}
        deleteDisabled
        deleteLabel={totalLabel}
      />

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm tên, email, SĐT"
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
                Email
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                SĐT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Phòng ban
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Vai trò
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/nhan-su/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{rowNumberOffset + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.fullName}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.email}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.phone || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.department || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.role || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/nhan-su/chinh-sua/${row.id}`);
                        }}
                        variant="primary-outline"
                        iconOnly
                        disabled={!canUpdate}
                        title={!canUpdate ? "Bạn không có quyền sửa" : undefined}
                        className="text-sky-500"
                      />
                      <Button
                        icon={Trash2}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!canDelete) {
                            toast.error("Bạn không có quyền xóa");
                            return;
                          }
                          setDeleteRow(row);
                          setDeleteOpen(true);
                        }}
                        variant="danger-outline"
                        iconOnly
                        disabled={!canDelete}
                        title={!canDelete ? "Bạn không có quyền xóa" : undefined}
                        className="text-rose-700"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ManagementPagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={setPage}
          onLimitChange={setLimit}
          disabled={isLoading}
        />
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
          Bạn có chắc muốn xóa nhân sự
          <span className="font-semibold text-slate-800"> {deleteRow?.fullName}</span>?
        </p>
      </Modal>
    </>
  );
}

export default StaffManagement;