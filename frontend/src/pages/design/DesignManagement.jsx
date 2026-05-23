import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/program/ManagementActions";
import { ManagementTableCard } from "@/components/program/ManagementTableCard";
import { InlinePrioritySelect } from "@/components/table/InlinePrioritySelect";
import { InlineStatusSelect } from "@/components/table/InlineStatusSelect";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRowSelection } from "@/hooks/useRowSelection";
import { designApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { usePermission } from "@/lib/permissions";

const DESIGN_TYPES = ["all", "Logo", "Banner", "Landing page", "UI/UX", "Social post"];
const COMPLETED_STATUS = "Đã hoàn thành";

function DesignManagement() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can("design.create");
  const canUpdate = can("design.update");
  const canDelete = can("design.delete");
  const canUpdateStatus = can("design.updateStatus");

  const [rows, setRows] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState("");
  const [updatingPriorityId, setUpdatingPriorityId] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedAssignee, setSelectedAssignee] = useState("all");

  const priorityCategories = useSystemCategoryOptions("priority");
  const statusCategories = useSystemCategoryOptions("status");
  const statusOptions = useMemo(
    () => (statusCategories.values || []).filter((item) => item !== COMPLETED_STATUS),
    [statusCategories.values],
  );
  const statusFilterOptions = useMemo(() => ["all", ...(statusCategories.values || [])], [statusCategories.values]);

  const displayedRows = useMemo(() => rows, [rows]);
  const displayedIds = useMemo(() => displayedRows.map((item) => item.id), [displayedRows]);

  const {
    selectedIds,
    isAllSelected: isAllFilteredSelected,
    toggleAll: handleToggleAll,
    toggleRow: handleToggleRow,
    clearSelection,
    setSelectedIds,
  } = useRowSelection(displayedIds);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await designApi.list({
        search: searchText.trim(),
        designType: selectedType,
        status: selectedStatus,
        assignee: selectedAssignee,
      });
      const nextRows = Array.isArray(response?.designTasks) ? response.designTasks : [];
      setRows(nextRows);
      setSelectedIds((prev) => prev.filter((id) => nextRows.some((item) => item.id === id)));
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách design");
    } finally {
      setIsLoading(false);
    }
  }, [searchText, selectedType, selectedStatus, selectedAssignee, setSelectedIds]);

  useEffect(() => {
    void fetchRows();
  }, [fetchRows]);

  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";
  const assigneeOptions = useMemo(
    () => ["all", ...Array.from(new Set(rows.map((item) => item.assignee).filter(Boolean)))],
    [rows],
  );

  const openCreate = () => navigate("/design/them-moi");
  const openEdit = (row) => navigate(`/design/chinh-sua/${row.id}`);

  const handleDelete = async () => {
    try {
      if (deleteRow?.id) {
        await designApi.remove(deleteRow.id);
        setRows((prev) => prev.filter((item) => item.id !== deleteRow.id));
        toast.success("Đã xóa công việc design");
      } else if (selectedIds.length > 0) {
        const response = await designApi.removeMany(selectedIds);
        setRows((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} công việc design`);
      } else {
        const response = await designApi.removeMany([]);
        setRows([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) công việc design`);
      }
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    } finally {
      setDeleteOpen(false);
      setDeleteRow(null);
      clearSelection();
    }
  };

  const applyStatusUpdate = async (row, nextStatus) => {
    setUpdatingStatusId(row.id);
    try {
      const payload = {
        status: nextStatus,
        completedDate: null,
      };
      const response = await designApi.update(row.id, payload);
      const nextRow = response?.designTask;
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, ...(nextRow || {}), status: nextStatus } : item)),
      );
      toast.success("Đã cập nhật trạng thái");
    } catch (error) {
      toast.error(error?.message || "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingStatusId("");
    }
  };

  const applyPriorityUpdate = async (row, nextPriority) => {
    setUpdatingPriorityId(row.id);
    try {
      const payload = {
        priority: nextPriority,
      };
      const response = await designApi.update(row.id, payload);
      const nextRow = response?.designTask;
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, ...(nextRow || {}), priority: nextPriority } : item)),
      );
      toast.success("Đã cập nhật mức ưu tiên");
    } catch (error) {
      toast.error(error?.message || "Không thể cập nhật mức ưu tiên");
    } finally {
      setUpdatingPriorityId("");
    }
  };

  const handleStatusChange = (row, nextStatus) => {
    if (nextStatus === row.status || row.status === COMPLETED_STATUS) return;
    void applyStatusUpdate(row, nextStatus);
  };

  const handlePriorityChange = (row, nextPriority) => {
    if (nextPriority === row.priority || row.status === COMPLETED_STATUS) return;
    void applyPriorityUpdate(row, nextPriority);
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
        addTitle={!canCreate ? "Bạn không có quyền thêm mới" : undefined}
        deleteDisabled={rows.length === 0 || !canDelete}
        deleteTitle={!canDelete ? "Bạn không có quyền xóa" : undefined}
        deleteLabel={deleteManyLabel}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
        >
          {DESIGN_TYPES.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Loại design" : option}
            </option>
          ))}
        </select>

        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value)}
        >
          {statusFilterOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Trạng thái" : option}
            </option>
          ))}
        </select>

        <select
          className="w-52 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          {assigneeOptions.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "Người nhận" : option}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm công việc design"
      >
        <Table className="min-w-full text-center text-sm">
          <TableHeader className="bg-slate-50 text-slate-500">
            <TableRow>
              <TableHead className="w-12 border border-slate-200 px-4">
                <input
                  type="checkbox"
                  checked={isAllFilteredSelected}
                  onChange={(event) => handleToggleAll(event.target.checked)}
                  onClick={(event) => event.stopPropagation()}
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hạng mục
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Loại
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-7 text-center font-semibold text-slate-500">
                Ưu tiên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thời gian
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Quy đổi
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm thêm
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người giao (Quản lý)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người nhận
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày giao
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày nhận
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày dự kiến
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Ngày hoàn thành
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
                <TableCell colSpan={17} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Đang tải dữ liệu...
                </TableCell>
              </TableRow>
            ) : displayedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="border border-slate-200 p-4 py-8 text-slate-500">
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
                      onChange={(event) => handleToggleRow(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left font-semibold text-sky-700">
                    {row.title}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.designType}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <InlinePrioritySelect
                      value={row.priority}
                      options={priorityCategories.values}
                      isCompleted={row.status === COMPLETED_STATUS}
                      disabled={updatingPriorityId === row.id || !canUpdateStatus}
                      onChange={(nextValue) => handlePriorityChange(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.durationLabel}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convert}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assigner}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assignee}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <InlineStatusSelect
                      value={row.status}
                      options={statusOptions}
                      isCompleted={row.status === COMPLETED_STATUS}
                      completedLabel={COMPLETED_STATUS}
                      disabled={updatingStatusId === row.id || !canUpdateStatus}
                      onChange={(nextValue) => handleStatusChange(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.handoverDateLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.receiveDateLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.expectedDateLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.completedDateLabel || "-"}</TableCell>
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
                        title={!canUpdate ? "Bạn không có quyền sửa" : undefined}
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
                        title={!canDelete ? "Bạn không có quyền xóa" : undefined}
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
              onClick={() => void handleDelete()}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        <p className="text-sm text-slate-600">
          Bạn có chắc muốn xóa công việc design{" "}
          <span className="font-semibold text-slate-800">{deleteRow?.title || "đang chọn"}</span>?
        </p>
      </Modal>
    </>
  );
}

export default DesignManagement;