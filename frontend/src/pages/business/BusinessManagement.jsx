import { FileText, SquarePen, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { HANDOVER_STATUS_OPTIONS } from "@/constants/business-contract";
import { useManagementList } from "@/hooks/useManagementList";
import { businessContractApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

function BusinessManagement() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.CONTRACT_CREATE);
  const canUpdate = can(PERMISSIONS.CONTRACT_UPDATE);
  const canDelete = can(PERMISSIONS.CONTRACT_DELETE);

  const [selectedStatus, setSelectedStatus] = useState("all");

  const getBusinessListParams = useCallback(
    ({ searchText, page, limit }) => ({
      handoverStatus: selectedStatus,
      search: searchText.trim(),
      page,
      limit,
    }),
    [selectedStatus],
  );

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
    listApi: businessContractApi.list,
    removeApi: businessContractApi.remove,
    removeManyApi: businessContractApi.removeMany,
    responseKey: "contracts",
    getListParams: getBusinessListParams,
    enablePagination: true,
    loadErrorMessage: "Không thể tải danh sách kinh doanh",
    noDeletePermissionMessage: "Bạn không có quyền xóa hợp đồng",
    deleteOneSuccessMessage: "Đã xóa hợp đồng",
    deleteManySuccessMessage: ({ deletedCount, selectedCount }) => `Đã xóa ${deletedCount || selectedCount} hợp đồng`,
    deleteAllSuccessMessage: ({ deletedCount }) => `Đã xóa toàn bộ (${deletedCount || 0}) hợp đồng`,
  });

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/kinh-doanh/them-moi")}
        onDeleteAll={() => {
          setDeleteRow(null);
          setDeleteOpen(true);
        }}
        addDisabled={!canCreate}
        addTitle={!canCreate ? "Bạn không có quyền thêm hợp đồng" : undefined}
        deleteDisabled={rows.length === 0 || !canDelete}
        deleteTitle={!canDelete ? "Bạn không có quyền xóa hợp đồng" : undefined}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value);
            setPage(1);
          }}
        >
          <option value="all">Trạng thái bàn giao</option>
          {HANDOVER_STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard searchText={searchText} onSearchChange={setSearchText} searchPlaceholder="Tìm số HĐ, tên HĐ, khách hàng">
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  className="ml-px"
                  checked={isAllFilteredSelected}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                  disabled={!canDelete}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">STT</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Hồ sơ</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Số hợp đồng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Tên hợp đồng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Khách hàng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Nhân viên kinh doanh</TableHead>
              {/* <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Mail nhận</TableHead> */}
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Email khách hàng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày dự kiến bàn giao</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Trạng thái bàn giao</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Ngày bàn giao</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Hiển thị</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={14} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              displayedRows.map((row, index) => (
                <TableRow key={row.id} className="cursor-pointer text-slate-700 hover:bg-slate-50" onClick={() => navigate(`/kinh-doanh/chinh-sua/${row.id}`)}>
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                      disabled={!canDelete}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{rowNumberOffset + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <Button
                      icon={FileText}
                      label="Hồ sơ tổng hợp"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/kinh-doanh/hop-dong/${row.id}/ho-so`);
                      }}
                      variant="primary-outline"
                      className=" hover:bg-sky-100"
                      title="Xem hồ sơ hợp đồng tổng hợp"
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">{row.contractCode}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.contractName}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.customerName || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.selectedSalesStaff}</TableCell>
                  {/* <TableCell className="border border-slate-200 p-4">{row.mailStatus}</TableCell> */}
                  <TableCell className="border border-slate-200 p-4">{row.customerEmail || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.expectedHandoverAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className={row.handoverStatus === "Đã bàn giao" ? "text-emerald-700" : "text-slate-600"}>{row.handoverStatus}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.handoverAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <input type="checkbox" checked={Boolean(row.visible)} readOnly onClick={(event) => event.stopPropagation()} />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/kinh-doanh/chinh-sua/${row.id}`);
                        }}
                        variant="primary-outline"
                        iconOnly
                        title={!canUpdate ? "Xem chi tiết (chỉ xem)" : "Sửa hợp đồng"}
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
                        disabled={!canDelete}
                        title={!canDelete ? "Bạn không có quyền xóa hợp đồng" : undefined}
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
            <button
              type="button"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteRow(null);
              }}
              className="rounded-md border px-4 py-2 text-sm"
            >
              Hủy
            </button>
            <button type="button" onClick={() => void handleDelete({ canDelete })} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
              Xóa
            </button>
          </div>
        }
      >
        {deleteRow ? (
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa hợp đồng
            <span className="font-semibold text-slate-800"> {deleteRow.contractCode}</span>?
          </p>
        ) : selectedIds.length > 0 ? (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa {selectedIds.length} hợp đồng đã chọn?</p>
        ) : (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa toàn bộ hợp đồng kinh doanh?</p>
        )}
      </Modal>
    </>
  );
}

export default BusinessManagement;