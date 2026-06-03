import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementPagination } from "@/components/management/ManagementPagination";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { InlinePrioritySelect } from "@/components/table/InlinePrioritySelect";
import { InlineStatusSelect } from "@/components/table/InlineStatusSelect";
import { UPGRADE_COMPLETED_STATUS } from "@/constants/program-upgrade";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useRowSelection } from "@/hooks/useRowSelection";
import { staffApi, upgradeApi } from "@/lib/api-client";
import { getWorkDurationLabel } from "@/lib/work-duration";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { getStaffNamesByRole, toSelectOptions } from "@/lib/staff-roles";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

const MONTH_OPTIONS = ["Tất cả", ...Array.from({ length: 12 }, (_, index) => `Tháng ${index + 1}`)];
const YEAR_OPTIONS = ["Tất cả", "2026", "2025", "2024"];
const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};
function ProgramUpgradeManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.UPGRADE_CREATE);
  const canUpdate = can(PERMISSIONS.UPGRADE_UPDATE);
  const canDelete = can(PERMISSIONS.UPGRADE_DELETE);
  const canUpdateStatus = can(PERMISSIONS.UPGRADE_UPDATE_STATUS);

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAssignee, setSelectedAssignee] = useState("Tất cả");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const initialMonth = searchParams.get("month");
    return initialMonth && initialMonth !== "all" ? `Tháng ${initialMonth}` : "Tất cả";
  });
  const [selectedYear, setSelectedYear] = useState(() => {
    const initialYear = searchParams.get("year");
    return initialYear && initialYear !== "all" ? initialYear : "Tất cả";
  });
  const [selectedStatus, setSelectedStatus] = useState(() => searchParams.get("status") || "Tất cả");
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebouncedValue(searchText, 2000);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState(null);
  const [staffReferences, setStaffReferences] = useState([]);

  const priorityCategories = useSystemCategoryOptions("priority");
  const statusCategories = useSystemCategoryOptions("status");
  const statusOptions = useMemo(
    () => (statusCategories.values || []).filter((item) => item !== UPGRADE_COMPLETED_STATUS),
    [statusCategories.values],
  );

  const fetchUpgrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await upgradeApi.list({
        assignee: selectedAssignee === "Tất cả" ? "all" : selectedAssignee,
        month: selectedMonth === "Tất cả" ? "all" : Number(selectedMonth.split(" ")[1]),
        year: selectedYear === "Tất cả" ? "all" : Number(selectedYear),
        status: selectedStatus === "Tất cả" ? "all" : selectedStatus,
        search: debouncedSearchText.trim(),
        page,
        limit,
      });
      const nextRows = Array.isArray(response?.upgrades) ? response.upgrades : [];
      setRows(nextRows);
      setTotal(Number(response?.total ?? nextRows.length) || 0);
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách nâng cấp");
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchText, selectedAssignee, selectedMonth, selectedStatus, selectedYear, page, limit]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUpgrades();
  }, [fetchUpgrades]);

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        const response = await staffApi.references();
        const nextReferences = Array.isArray(response?.staffs) ? response.staffs : [];
        setStaffReferences(nextReferences);
      } catch {
        setStaffReferences([]);
      }
    };
    void fetchStaffs();
  }, []);

  const assigneeOptions = toSelectOptions(getStaffNamesByRole(staffReferences, "Lập trình viên"));

  const displayedRows = rows;
  const displayedIds = useMemo(() => displayedRows.map((item) => item.id), [displayedRows]);
  const {
    selectedIds,
    isAllSelected: isAllFilteredSelected,
    toggleAll: handleToggleAll,
    toggleRow: handleToggleRow,
    clearSelection,
    setSelectedIds,
  } = useRowSelection(displayedIds);
  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";
  const rowNumberOffset = (Math.max(Number(page) || 1, 1) - 1) * (Number(limit) || 10);

  const handleSearchTextChange = (value) => {
    setSearchText(value);
    setPage(1);
  };

  const handleLimitChange = (nextLimit) => {
    setLimit(nextLimit);
    setPage(1);
  };

  const handleInlineUpdate = async (rowId, patch, successMessage) => {
    const target = rows.find((item) => item.id === rowId);
    if (!target) return;

    const payload = {
      programId: target.programId,
      upgradeItem: target.upgradeItem,
      priority: target.priority,
      durationValue: target.durationValue,
      durationUnit: target.durationUnit,
      convert: target.convert,
      bonusPoint: target.bonusPoint,
      status: target.status,
      assigner: target.assigner,
      assignee: target.assignee,
      assignedAt: target.assignedAt || new Date().toISOString(),
      receivedAt: target.receivedAt || null,
      dueAt: target.dueAt || new Date().toISOString(),
      completedAt: target.completedAt || null,
      visible: target.visible,
      note: target.note || "",
      ...patch,
    };
    try {
      const response = await upgradeApi.update(rowId, payload);
      const updated = response?.upgrade;
      if (!updated) return;

      setRows((prev) => prev.map((item) => (item.id === rowId ? updated : item)));
      toast.success(successMessage || "Đã cập nhật");
    } catch (error) {
      toast.error(error?.message || "Cập nhật không thành công");
    }
  };

  const handleStatusChange = (row, nextStatus) => {
    if (nextStatus === row.status) return;

    if (row.status === UPGRADE_COMPLETED_STATUS) {
      toast.error("Không thể chỉnh sửa yêu cầu nâng cấp đã hoàn thành");
      return;
    }

    void handleInlineUpdate(row.id, { status: nextStatus }, "Đã cập nhật trạng thái");
  };

  const handlePriorityChange = (row, nextPriority) => {
    if (nextPriority === row.priority) return;

    if (row.status === UPGRADE_COMPLETED_STATUS) {
      toast.error("Không thể chỉnh sửa yêu cầu nâng cấp đã hoàn thành");
      return;
    }

    void handleInlineUpdate(row.id, { priority: nextPriority }, "Đã cập nhật mức ưu tiên");
  };

  const handleDeleteOne = async (rowId) => {
    try {
      await upgradeApi.remove(rowId);
      setRows((prev) => prev.filter((item) => item.id !== rowId));
      setTotal((prev) => Math.max(0, prev - 1));
      setSelectedIds((prev) => prev.filter((item) => item !== rowId));
      toast.success("Đã xóa yêu cầu nâng cấp");
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  const handleDeleteMany = async () => {
    try {
      if (selectedIds.length > 0) {
        const response = await upgradeApi.removeMany(selectedIds);
        setRows((prev) => prev.filter((item) => !selectedIds.includes(item.id)));
        setTotal((prev) => Math.max(0, prev - (Number(response?.deletedCount || selectedIds.length) || 0)));
        clearSelection();
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} yêu cầu nâng cấp`);
      } else {
        const response = await upgradeApi.removeMany([]);
        setRows([]);
        setTotal(0);
        setPage(1);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) yêu cầu nâng cấp`);
      }
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    } finally {
      setDeleteOpen(false);
      setDeleteRow(null);
    }
  };

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/lap-trinh/nang-cap/them-moi")}
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
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedAssignee}
          onChange={(event) => {
            setSelectedAssignee(event.target.value);
            setPage(1);
          }}
        >
          {["Tất cả", ...assigneeOptions.map((item) => item.value)].map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn lập trình" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedMonth}
          onChange={(event) => {
            setSelectedMonth(event.target.value);
            setPage(1);
          }}
        >
          {MONTH_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn tháng" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedYear}
          onChange={(event) => {
            setSelectedYear(event.target.value);
            setPage(1);
          }}
        >
          {YEAR_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn năm" : option}
            </option>
          ))}
        </select>

        <select
          className="w-48 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value);
            setPage(1);
          }}
        >
          {["Tất cả", ...(statusCategories.values || [])].map((option) => (
            <option key={option} value={option}>
              {option === "Tất cả" ? "Chọn trạng thái" : option}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        title="Danh sách Yêu cầu nâng cấp"
        searchText={searchText}
        onSearchChange={handleSearchTextChange}
        searchPlaceholder="Tìm số HĐ, module, hạng mục"
      >
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
                />
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                STT
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Phiếu gốc / Số HĐ
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Module
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Hạng mục nâng cấp
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-7 text-center font-semibold text-slate-500">
                Ưu tiên
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Thời gian
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-6 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Điểm cộng
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người giao (Quản lý)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 px-10 text-center font-semibold text-slate-500">
                Chuyển lập trình
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
                  onClick={() => navigate(`/lap-trinh/nang-cap/chinh-sua/${row.id}`)}
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
                    <span className="border px-3 py-1.5">{rowNumberOffset + index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.contractCode}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.module}</TableCell>
                  <TableCell className="border border-slate-200 p-4 text-left">{row.upgradeItem}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <InlinePrioritySelect
                      value={row.priority}
                      options={priorityCategories.values}
                      isCompleted={row.status === UPGRADE_COMPLETED_STATUS}
                      onChange={(nextValue) => handlePriorityChange(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {getWorkDurationLabel({
                      receivedAt: row.receivedAt,
                      assignedAt: row.assignedAt,
                      completedAt: row.completedAt,
                      dueAt: row.dueAt,
                    })}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <InlineStatusSelect
                      value={row.status}
                      options={statusOptions}
                      isCompleted={row.status === UPGRADE_COMPLETED_STATUS}
                      completedLabel={UPGRADE_COMPLETED_STATUS}
                      onChange={(nextValue) => handleStatusChange(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.bonusPoint}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assigner}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <select
                      className="w-full rounded border border-slate-200 px-2 py-1.5"
                      value={row.assignee}
                      disabled={row.status === UPGRADE_COMPLETED_STATUS}
                      onChange={(event) => void handleInlineUpdate(row.id, { assignee: event.target.value })}
                    >
                      {assigneeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatDateTime(row.assignedAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatDateTime(row.receivedAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatDateTime(row.dueAt)}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{formatDateTime(row.completedAt)}</TableCell>
                  <TableCell
                    className="border border-slate-200 p-4 text-center"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={row.visible}
                      disabled={row.status === UPGRADE_COMPLETED_STATUS}
                      onChange={(event) => void handleInlineUpdate(row.id, { visible: event.target.checked })}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        icon={SquarePen}
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/lap-trinh/nang-cap/chinh-sua/${row.id}`);
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
          onLimitChange={handleLimitChange}
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
            <button
              type="button"
              onClick={() => {
                if (deleteRow?.id) {
                  void handleDeleteOne(deleteRow.id);
                  setDeleteOpen(false);
                  setDeleteRow(null);
                  return;
                }
                void handleDeleteMany();
              }}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        {deleteRow ? (
          <p className="text-sm text-slate-600">
            Bạn có chắc muốn xóa mục
            <span className="font-semibold text-slate-800"> {deleteRow.contractCode}</span>?
          </p>
        ) : selectedIds.length > 0 ? (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa {selectedIds.length} mục đã chọn?</p>
        ) : (
          <p className="text-sm text-slate-600">Bạn có chắc muốn xóa toàn bộ danh sách nâng cấp?</p>
        )}
      </Modal>
    </>
  );
}

export default ProgramUpgradeManagement;
