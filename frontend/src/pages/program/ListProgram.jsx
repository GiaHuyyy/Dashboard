import { SquarePen, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { ManagementActions } from "@/components/management/ManagementActions";
import { ManagementTableCard } from "@/components/management/ManagementTableCard";
import { InlinePrioritySelect } from "@/components/table/InlinePrioritySelect";
import { InlineStatusSelect } from "@/components/table/InlineStatusSelect";
import { Button } from "@/components/ui/button-v2";
import Modal from "@/components/ui/modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { COMPLETED_STATUS } from "@/constants/program";
import { useRowSelection } from "@/hooks/useRowSelection";
import { programApi } from "@/lib/api-client";
import { useSystemCategoryOptions } from "@/lib/system-categories";
import { usePermission } from "@/lib/permissions";
import { PERMISSIONS } from "@/constants/permissions";

function ListProgram() {
  const navigate = useNavigate();
  const { can } = usePermission();
  const canCreate = can(PERMISSIONS.PROGRAM_CREATE);
  const canUpdate = can(PERMISSIONS.PROGRAM_UPDATE);
  const canDelete = can(PERMISSIONS.PROGRAM_DELETE);
  const canUpdateStatus = can(PERMISSIONS.PROGRAM_UPDATE_STATUS);

  const [selectedModule, setSelectedModule] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [programs, setPrograms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [deleteMode, setDeleteMode] = useState("single");
  const [updatingRowId, setUpdatingRowId] = useState("");

  const moduleCategories = useSystemCategoryOptions("module", {
    includeAll: true,
    allLabel: "Chọn loại điểm",
    allValue: "all",
  });
  const statusCategories = useSystemCategoryOptions("status");
  const priorityCategories = useSystemCategoryOptions("priority");

  const statusOptions = useMemo(() => {
    const values = statusCategories.values || [];
    return values.filter((item) => item !== COMPLETED_STATUS);
  }, [statusCategories.values]);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await programApi.list(selectedModule);
      const nextPrograms = response?.programs || [];
      setPrograms(nextPrograms);
    } catch (error) {
      toast.error(error?.message || "Không thể tải danh sách lập trình");
    } finally {
      setIsLoading(false);
    }
  }, [selectedModule]);

  useEffect(() => {
    void fetchPrograms();
  }, [fetchPrograms]);

  const filteredPrograms = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();
    if (!keyword) return programs;
    return programs.filter((item) => {
      const source = [item.contractCode, item.contractName, item.module, item.assigner, item.assignee]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return source.includes(keyword);
    });
  }, [programs, searchText]);

  const openDelete = (row) => {
    setDeleteMode("single");
    setActiveRow(row);
    setDeleteOpen(true);
  };

  const openDeleteMany = () => {
    setDeleteMode(selectedIds.length > 0 ? "selected" : "all");
    setActiveRow(null);
    setDeleteOpen(true);
  };

  const closeDelete = () => {
    setDeleteOpen(false);
    setActiveRow(null);
  };

  const filteredIds = useMemo(() => filteredPrograms.map((item) => item.id), [filteredPrograms]);
  const {
    selectedIds,
    isAllSelected: isAllFilteredSelected,
    toggleAll: handleToggleAll,
    toggleRow: handleRowCheckboxChange,
    clearSelection,
    syncWithData,
  } = useRowSelection(filteredIds);

  useEffect(() => {
    syncWithData(programs.map((item) => item.id));
  }, [programs, syncWithData]);

  const handleConfirmDelete = async () => {
    try {
      if (deleteMode === "single" && activeRow?.id) {
        await programApi.remove(activeRow.id);
        toast.success("Đã xóa chương trình");
      } else if (deleteMode === "selected" && selectedIds.length > 0) {
        const response = await programApi.removeMany(selectedIds);
        toast.success(`Đã xóa ${response?.deletedCount || selectedIds.length} chương trình`);
      } else {
        const response = await programApi.removeMany([]);
        toast.success(`Đã xóa toàn bộ (${response?.deletedCount || 0}) chương trình`);
      }

      clearSelection();
      closeDelete();
      await fetchPrograms();
    } catch (error) {
      toast.error(error?.message || "Xóa dữ liệu không thành công");
    }
  };

  const handleInlineUpdate = async (row, patch) => {
    if (!row?.id) return;
    if (row.processingStatus === COMPLETED_STATUS) {
      toast.error("Không thể chỉnh sửa chương trình đã hoàn thành");
      return;
    }

    setUpdatingRowId(row.id);
    try {
      const detailResponse = await programApi.detail(row.id);
      const program = detailResponse?.program;
      if (!program) {
        toast.error("Không tìm thấy dữ liệu chương trình");
        return;
      }

      const payload = {
        module: program.module,
        priority: patch.priority ?? program.priority,
        durationValue: program.durationValue,
        durationUnit: program.durationUnit,
        convert: program.convert,
        bonusPoint: Number(program.bonusPoint) || 0,
        assigner: program.assigner,
        assignee: program.assignee,
        businessContractId: program.businessContractId,
        designTaskId: program.designTaskId || "",
        design: Boolean(program.design),
        visible: Boolean(program.visible),
        processingStatus: patch.processingStatus ?? program.processingStatus,
        assignedAt: program.assignedAt,
        receivedAt: program.receivedAt || null,
        dueAt: program.dueAt,
        completedAt: null,
      };

      await programApi.update(row.id, payload);
      setPrograms((prev) =>
        prev.map((item) =>
          item.id === row.id ? { ...item, ...patch } : item
        )
      );
      toast.success("Đã cập nhật trạng thái");
    } catch (error) {
      toast.error(error?.message || "Cập nhật trạng thái không thành công");
    } finally {
      setUpdatingRowId("");
    }
  };

  const handleInlineStatusUpdate = (row, nextStatus) => {
    if (!nextStatus || nextStatus === row.processingStatus) return;
    void handleInlineUpdate(row, { processingStatus: nextStatus });
  };

  const handleInlinePriorityUpdate = (row, nextPriority) => {
    if (!nextPriority || nextPriority === row.priority) return;
    void handleInlineUpdate(row, { priority: nextPriority });
  };

  const deleteManyLabel = selectedIds.length > 0 ? `Xóa tất cả [ ${selectedIds.length} ]` : "Xóa tất cả";
  const deleteDescription =
    deleteMode === "single"
      ? "Bạn có chắc muốn xóa mục"
      : deleteMode === "selected"
        ? `Bạn có chắc muốn xóa ${selectedIds.length} mục đã chọn?`
        : "Bạn có chắc muốn xóa toàn bộ danh sách chương trình?";

  return (
    <>
      <ManagementActions
        onAdd={() => navigate("/lap-trinh/them-moi")}
        onDeleteAll={openDeleteMany}
        deleteLabel={deleteManyLabel}
        addDisabled={!canCreate}
        addTitle={!canCreate ? "Bạn không có quyền thêm mới" : undefined}
        deleteDisabled={programs.length === 0 || !canDelete}
        deleteTitle={!canDelete ? "Bạn không có quyền xóa" : undefined}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          value={selectedModule}
          onChange={(event) => setSelectedModule(event.target.value)}
        >
          {moduleCategories.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <ManagementTableCard
        searchText={searchText}
        onSearchChange={setSearchText}
        searchPlaceholder="Tìm số HĐ, module, người giao/nhận"
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
                Phiếu gốc (HĐ)
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Module
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
              <TableHead className="border border-slate-200 p-4 px-7 text-center font-semibold text-slate-500">
                Trạng thái
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người giao
              </TableHead>
              <TableHead className="border border-slate-200 p-4 text-center font-semibold text-slate-500">
                Người nhận
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
                Design
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
            ) : filteredPrograms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={17} className="border border-slate-200 p-4 py-8 text-slate-500">
                  Chưa có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              filteredPrograms.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer text-slate-700 hover:bg-slate-50"
                  onClick={() => navigate(`/lap-trinh/chinh-sua/${row.id}`)}
                >
                  <TableCell className="border border-slate-200 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={(event) => handleRowCheckboxChange(row.id, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    <span className="border px-3 py-1.5">{index + 1}</span>
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 font-semibold text-sky-700">
                    {row.contractCode || "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.module}</TableCell>
                  <TableCell className="border border-slate-200 p-4" onClick={(event) => event.stopPropagation()}>
                    <InlinePrioritySelect
                      value={row.priority || ""}
                      options={priorityCategories.values}
                      isCompleted={row.processingStatus === COMPLETED_STATUS}
                      disabled={updatingRowId === row.id || !canUpdateStatus}
                      onChange={(nextValue) => handleInlinePriorityUpdate(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.time}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.convert}</TableCell>
                  <TableCell
                    className="border border-slate-200 p-4"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <InlineStatusSelect
                      value={row.processingStatus || ""}
                      options={statusOptions}
                      isCompleted={row.processingStatus === COMPLETED_STATUS}
                      completedLabel={COMPLETED_STATUS}
                      disabled={updatingRowId === row.id || !canUpdateStatus}
                      onChange={(nextValue) => handleInlineStatusUpdate(row, nextValue)}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assigner || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.assignee || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.assignedAtLabel || "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.receivedAtLabel || "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4">{row.dueAtLabel || "-"}</TableCell>
                  <TableCell className="border border-slate-200 p-4">
                    {row.completedAtLabel || "-"}
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
                    <input
                      type="checkbox"
                      checked={Boolean(row.design)}
                      readOnly
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="border border-slate-200 p-4 text-center">
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
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/lap-trinh/chinh-sua/${row.id}`);
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
                          openDelete(row);
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
      </ManagementTableCard>

      <Modal
        open={deleteOpen}
        onClose={closeDelete}
        title="Xác nhận xóa"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={closeDelete} className="rounded-md border px-4 py-2 text-sm">
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Xóa
            </button>
          </div>
        }
      >
        {deleteMode === "single" ? (
          <p className="text-sm text-slate-600">
            {deleteDescription}
            <span className="font-semibold text-slate-800"> {activeRow?.module}</span>?
          </p>
        ) : (
          <p className="text-sm text-slate-600">{deleteDescription}</p>
        )}
      </Modal>
    </>
  );
}

export default ListProgram;