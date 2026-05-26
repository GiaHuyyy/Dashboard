import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { HANDOVER_STATUS_OPTIONS } from "@/constants/business-contract";
import { businessContractApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/lib/permissions";

function BusinessManagement() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can("contract.create");
  const canUpdate = can("contract.update");
  const canDelete = can("contract.delete");

  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await businessContractApi.list({
        handoverStatus: selectedStatus,
        search: searchText.trim(),
        limit: 200,
      });
      const nextRows = Array.isArray(response?.contracts) ? response.contracts : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách kinh doanh");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedStatus]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = displayedRows.map((item) => item.id);
  const isAllFilteredSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";

  const handleToggleAll = (checked) => {
    if (checked) {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...displayedIds])));
      return;
    }
    setSelectedIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
  };

  const handleToggleRow = (id, checked) => {
    setSelectedIds((prev) => {
      if (checked) {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const handleDelete = async () => {
    try {
      if (deleteRow?.id) {
        await businessContractApi.remove(deleteRow.id);
        toast.success("Đã xóa hợp đồng");
      } else if (selectedIds.length > 0) {
        const response = await businessContractApi.removeMany(selectedIds);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} hợp đồng`);
      } else {
        const response = await businessContractApi.removeMany([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) hợp đồng`);
      }
      setDeleteOpen(false);
      setDeleteRow(null);
      setSelectedIds([]);
      await fetchRows();
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };


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
          onChange={(event) => setSelectedStatus(event.target.value)}
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
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Số hợp đồng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Tên hợp đồng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Khách hàng</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Nhân viên kinh doanh</TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">Mail nhận</TableHead>
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
                <TableCell colSpan={13} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="border border-slate-200 p-4 py-8 text-slate-500">
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
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">{row.contractCode}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.contractName}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.customerName}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.selectedSalesStaff}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.mailStatus}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.customerEmail}</TableCell>
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
            <button type="button" onClick={() => void handleDelete()} className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white">
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