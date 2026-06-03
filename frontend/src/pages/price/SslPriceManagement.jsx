import { SquarePen, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { useManagementList } from "@/hooks/useManagementList";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sslPriceApi } from "@/lib/api-client";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value) || 0) + "đ";

function SslPriceManagement() {
  const navigate = useNavigate();
  const { can, disabledProps } = usePermission();
  const canCreate = can(PERMISSIONS.PRICE_CREATE);
  const canUpdate = can(PERMISSIONS.PRICE_UPDATE);
  const canDelete = can(PERMISSIONS.PRICE_DELETE);
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
    selectedIds,
    deleteOpen,
    setDeleteOpen,
    deleteRow,
    setDeleteRow,
    displayedRows,
    isAllFilteredSelected,
    deleteManyLabel,
    handleToggleAll,
    handleToggleRow,
    handleDelete,
  } = useManagementList({
    listApi: sslPriceApi.list,
    removeApi: sslPriceApi.remove,
    removeManyApi: sslPriceApi.removeMany,
    enablePagination: true,
    responseKey: "sslPrices",
    loadErrorMessage: "Không thể tải bảng giá SSL",
    noDeletePermissionMessage: "Bạn không có quyền xóa bảng giá",
    deleteOneSuccessMessage: "Đã xóa bảng giá SSL",
    deleteManySuccessMessage: ({ deletedCount, selectedCount }) =>
      `Đã xóa ${deletedCount || selectedCount} bảng giá SSL`,
    deleteAllSuccessMessage: ({ deletedCount }) => `Đã xóa toàn bộ (${deletedCount || 0}) bảng giá SSL`,
  });

  const openCreate = () => {
    if (!canCreate) {
      toast.error("Bạn không có quyền thêm bảng giá");
      return;
    }
    navigate("/bang-gia/ssl/them-moi");
  };
  const openEdit = (row) => {
    navigate(`/bang-gia/ssl/chinh-sua/${row.id}`);
  };

  return (
    <>
      <ManagementActions
        onAdd={openCreate}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        addDisabled={!canCreate}
        addTitle={disabledProps(PERMISSIONS.PRICE_CREATE).title}
        deleteDisabled={!canDelete || rows.length === 0}
        deleteTitle={!canDelete ? disabledProps(PERMISSIONS.PRICE_DELETE).title : undefined}
        deleteLabel={deleteManyLabel}
      />

      <ManagementTableCard
        title="Danh sách Bảng giá SSL"
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm tên gói SSL"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  disabled={!canDelete}
                  title={!canDelete ? disabledProps(PERMISSIONS.PRICE_DELETE).title : undefined}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Tên gói SSL
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Loại SSL
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thời hạn (tháng)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Giá
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Bảo hiểm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày tạo
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hiển thị
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thao tác
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => openEdit(row)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      disabled={!canDelete}
                      title={!canDelete ? disabledProps(PERMISSIONS.PRICE_DELETE).title : undefined}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{rowNumberOffset + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.name}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.sslType}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.validityMonths}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatMoney(row.price)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatMoney(row.warrantyAmount)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.createdAt}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={Boolean(row.visible)}
                      readOnly
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        iconOnly
                        variant="primary-outline"
                        disabled={!canUpdate}
                        title={!canUpdate ? "Xem chi tiết (chỉ xem)" : "Sửa bảng giá"}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEdit(row);
                        }}
                      />
                      <Button
                        icon={Trash2}
                        iconOnly
                        variant="danger-outline"
                        disabled={!canDelete}
                        title={!canDelete ? disabledProps(PERMISSIONS.PRICE_DELETE).title : undefined}
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteRow(row);
                          setDeleteOpen(true);
                        }}
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
              onClick={() => void handleDelete({ canDelete })}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa bảng giá SSL{" "}
          <span className="font-semibold text-slate-800">{deleteRow?.name || "đang chọn"}</span>?
        </p>
      </Modal>
    </>
  );
}

export default SslPriceManagement;
